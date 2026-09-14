export async function sendWhatsAppNotification(message: string) {
  try {
    // Le numéro international béninois exact à 11 chiffres (229 + 66491298)
    const telAdmin = "22966491298"
    const url = "https://wa.me" + telAdmin + "?text=" + encodeURIComponent(message)
    return { ok: true, url: url }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erreur WhatsApp" }
  }
}
