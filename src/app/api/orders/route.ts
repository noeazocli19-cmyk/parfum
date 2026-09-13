// /api/orders — POST : enregistrement d'une commande client (public).

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { clientIp, rateLimit } from '@/lib/auth'
import { orderInclude, jsonError, readJson } from '@/lib/api-utils'
import { orderInputSchema, formatZodError } from '@/lib/validations'
import { buildAdminOrderNotification } from '@/lib/shop-config'
import { sendWhatsAppNotification } from '@/lib/whatsapp-notify'

async function generateReference(): Promise<string> {
  const year = new Date().getFullYear()
  const count = await db.order.count()
  let seq = count + 1
  for (;;) {
    const reference = `BO-${year}-${String(seq).padStart(4, '0')}`
    const exists = await db.order.findUnique({
      where: { reference },
      select: { id: true },
    })
    if (!exists) return reference
    seq += 1
  }
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req)
  const limit = rateLimit(`order:${ip}`, 10, 60 * 60 * 1000)
  if (!limit.ok) {
    return jsonError(
      429,
      `Trop de commandes envoyées. Réessayez dans ${Math.ceil(limit.retryAfterSec / 60)} minutes.`
    )
  }

  const body = await readJson<unknown>(req)
  const parsed = orderInputSchema.safeParse(body)
  if (!parsed.success) return jsonError(400, formatZodError(parsed.error))
  const input = parsed.data

  try {
    // Les produits sont relus depuis la base : les prix ne sont jamais pris du client.
    const ids = [...new Set(input.items.map((item) => item.productId))]
    const products = await db.product.findMany({ where: { id: { in: ids } } })
    const productMap = new Map(products.map((p) => [p.id, p]))

    for (const productId of ids) {
      const product = productMap.get(productId)
      if (!product) {
        return jsonError(
          400,
          "Un produit de votre panier n'est plus disponible. Veuillez actualiser votre panier."
        )
      }
      if (!product.isAvailable) {
        return jsonError(
          400,
          `Le parfum « ${product.name} » n'est actuellement plus disponible. Retirez-le de votre panier pour continuer.`
        )
      }
    }

    let total = 0
    let hasUndeterminedPrice = false
    for (const item of input.items) {
      const product = productMap.get(item.productId)!
      if (product.price === null) {
        hasUndeterminedPrice = true
      } else {
        total += product.price * item.quantity
      }
    }

    const reference = await generateReference()

    const order = await db.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          reference,
          customerName: input.customerName,
          phone: input.phone,
          address: input.address,
          comment: input.comment ?? null,
          total: Math.round(total * 100) / 100,
          hasUndeterminedPrice,
          status: 'NOUVELLE',
          items: {
            create: input.items.map((item) => {
              const product = productMap.get(item.productId)!
              return {
                productId: product.id,
                productName: product.name,
                unitPrice: product.price ?? 0,
                quantity: item.quantity,
              }
            }),
          },
        },
        include: orderInclude,
      })

      // Décrémente le stock lorsque géré, et rend indisponible à zéro.
      for (const item of input.items) {
        const product = productMap.get(item.productId)!
        if (product.stock !== null) {
          const newStock = Math.max(0, product.stock - item.quantity)
          await tx.product.update({
            where: { id: product.id },
            data: {
              stock: newStock,
              ...(newStock === 0 ? { isAvailable: false } : {}),
            },
          })
        }
      }

      return created
    })

    // Notification WhatsApp automatique et instantanée vers l'admin, en parallèle
    // de l'enregistrement (déjà fait ci-dessus). Un échec ici n'empêche jamais la
    // commande d'être créée : elle reste dans tous les cas visible dans le dashboard.
    const message = buildAdminOrderNotification({
      reference: order.reference,
      items: order.items.map((item) => ({
        name: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      customerName: order.customerName,
      phone: order.phone,
      address: order.address,
      comment: order.comment,
      total: order.total,
      hasUndeterminedPrice: order.hasUndeterminedPrice,
    })

    const result = await sendWhatsAppNotification(message)
    await db.order
      .update({
        where: { id: order.id },
        data: {
          whatsappNotifiedAt: result.ok ? new Date() : null,
          whatsappError: result.ok ? null : (result.error ?? 'Erreur inconnue'),
        },
      })
      .catch(() => {
        // Le suivi de statut WhatsApp est un bonus pour le dashboard : on ignore
        // une éventuelle erreur ici, la commande elle-même est déjà sauvegardée.
      })

    return NextResponse.json(
      { reference: order.reference },
      { status: 201 }
    )
  } catch {
    return jsonError(
      500,
      "Impossible d'enregistrer votre commande. Veuillez réessayer ou nous appeler."
    )
  }
}