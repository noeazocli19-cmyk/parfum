export const PAYMENT_INFO =
  process.env.NEXT_PUBLIC_MOBILE_MONEY_INFO ??
  'Les modalités de paiement Mobile Money seront confirmées par la boutique après validation de votre commande.'

export function formatMoneyForWhatsApp(value: number | null | undefined): string {
  const n = Number(value ?? 0)
  return `${new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n)} FCFA`
}

// Génère le message exact demandé
export function buildWhatsAppOrderMessage(input: {
  items: Array<{ name: string; quantity: number; unitPrice: number | null }>
  customerName: string
  phone: string
  comment?: string
  reference: string
}) {
  let detailParfums = ""
  input.items.forEach((item) => {
    detailParfums += `* Parfum : ${item.name}\n* Quantité : ${item.quantity}\n* Prix : ${item.unitPrice !== null ? formatMoneyForWhatsApp(item.unitPrice) : 'Prix sur demande'}\n\n`
  })

  const body = `Bonjour, je souhaite commander :
${detailParfums}* Nom du client : ${input.customerName}
* Numéro du client : ${input.phone}
* Référence de commande : ${input.reference}
* Autres informations : ${input.comment || "Aucune"}`

  return body
}

/** Message envoyé automatiquement à l'admin dès qu'une commande est validée. */
export function buildAdminOrderNotification(input: {
  reference: string
  items: Array<{ name: string; quantity: number; unitPrice: number | null }>
  customerName: string
  phone: string
  address: string
  comment?: string | null
  total: number
  hasUndeterminedPrice: boolean
}) {
  const body = [
    '🔔 Nouvelle commande — E.T.P.S Belle Odeur',
    '',
    `📦 Référence : ${input.reference}`,
    '',
    '🛍️ Articles',
    ...input.items.map(
      (item) =>
        `• ${item.name} × ${item.quantity} — ${formatMoneyForWhatsApp(item.unitPrice ?? 0)}`
    ),
    '',
    input.hasUndeterminedPrice
      ? `💰 Total : ${formatMoneyForWhatsApp(input.total)} (prix sur demande à confirmer)`
      : `💰 Total : ${formatMoneyForWhatsApp(input.total)}`,
    '',
    `👤 Client : ${input.customerName}`,
    `📱 Téléphone : ${input.phone}`,
    `📍 Adresse : ${input.address}`,
    input.comment ? `💬 Commentaire : ${input.comment}` : '',
    '',
    'Cette commande est déjà visible dans le dashboard admin.',
  ]
    .filter(Boolean)
    .join('\n')

  return body
}

// Version sécurisée qui prend le numéro propre et le nettoie
export function getWhatsAppUrl(numAdmin: string, message: string) {
  const cleaned = (numAdmin || '0166491298').replace(/[^0-9]/g, '')
  let finalPhone = cleaned
  if (finalPhone.startsWith("01") || finalPhone.startsWith("66") || finalPhone.startsWith("49")) {
    if (!finalPhone.startsWith("229")) {
      finalPhone = "229" + finalPhone
    }
  }
  return `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`
}
