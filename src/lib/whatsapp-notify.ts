// Notification WhatsApp automatique vers l'administrateur (via CallMeBot).
//
// Configuration requise dans .env :
//   CALLMEBOT_PHONE   -> numero WhatsApp admin, format international sans "+"
//   CALLMEBOT_API_KEY -> cle obtenue en envoyant "I allow callmebot to send me messages"
//                        au contact CallMeBot (+34 644 51 95 23)
//
// Si absentes, l'envoi est ignore sans erreur : la commande reste enregistree.

const CALLMEBOT_PHONE = process.env.CALLMEBOT_PHONE ?? ''
const CALLMEBOT_API_KEY = process.env.CALLMEBOT_API_KEY ?? ''
const CALLMEBOT_ENDPOINT = 'https://api.callmebot.com/whatsapp.php'

export function isWhatsAppNotifyConfigured(): boolean {
  return Boolean(CALLMEBOT_PHONE && CALLMEBOT_API_KEY)
}

export interface WhatsAppSendResult {
  ok: boolean
  error?: string
}

export async function sendWhatsAppNotification(message: string): Promise<WhatsAppSendResult> {
  if (!isWhatsAppNotifyConfigured()) {
    return {
      ok: false,
      error: "Notification WhatsApp non configuree (CALLMEBOT_PHONE / CALLMEBOT_API_KEY manquants dans .env)",
    }
  }

  const url = `${CALLMEBOT_ENDPOINT}?phone=${encodeURIComponent(
    CALLMEBOT_PHONE
  )}&text=${encodeURIComponent(message)}&apikey=${encodeURIComponent(CALLMEBOT_API_KEY)}`

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10_000)
    const res = await fetch(url, { method: 'GET', signal: controller.signal })
    clearTimeout(timeout)

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return { ok: false, error: `CallMeBot a repondu ${res.status} : ${text.slice(0, 300)}` }
    }
    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Erreur reseau inconnue lors de l envoi WhatsApp',
    }
  }
}