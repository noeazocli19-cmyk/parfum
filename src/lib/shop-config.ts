export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ''
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

export function buildWhatsAppOrderMessage(input: {
  items: Array<{ name: string; quantity: number; unitPrice: number | null }>
  customerName: string
  phone: string
  address: string
  comment?: string
  total: number
}) {
  const body = [
    'Bonjour E.T.P.S Belle Odeur 👋',
    '',
    'Je souhaite passer cette commande :',
    '',
    '🛍️ Ma commande',
    ...input.items.map(
      (item) =>
        `• ${item.name} × ${item.quantity} — ${formatMoneyForWhatsApp(item.unitPrice ?? 0)}`
    ),
    '',
    `💰 Total : ${formatMoneyForWhatsApp(input.total)}`,
    '',
    `👤 Nom : ${input.customerName}`,
    `📱 Téléphone : ${input.phone}`,
    `📍 Adresse de livraison : ${input.address}`,
    input.comment ? `💬 Commentaire : ${input.comment}` : '',
    '',
    'Je souhaite effectuer le paiement par Mobile Money.',
    '',
    'Merci.',
  ]
    .filter(Boolean)
    .join('\n')

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

export function getWhatsAppUrl(message: string) {
  const cleaned = (WHATSAPP_NUMBER || '').replace(/[^0-9]/g, '')
  if (!cleaned) return null
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`
}