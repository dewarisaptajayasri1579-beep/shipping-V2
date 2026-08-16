/** Pengirim notifikasi ke server Baileys self-hosted (lihat docs/menu.md 5 — aplikasi cuma
 *  perlu jadi pengirim pesan ke server WA yang sudah ada, bukan setup provider baru).
 *
 *  Server Baileys yang sebenarnya belum dikonfigurasi di project ini, jadi kalau env var
 *  BAILEYS_WEBHOOK_URL belum di-set, panggilan ini disimulasikan (dicatat di alert log dengan
 *  notified=false) alih-alih benar-benar mengirim — supaya tidak fabricate integrasi ke sistem
 *  yang belum tersambung. Begitu URL webhook Baileys yang asli tersedia, set env var-nya dan
 *  pengiriman akan otomatis aktif tanpa ubah kode lain.
 */
export async function sendWhatsAppNotification(targetNumbers: string[], message: string): Promise<boolean> {
  const webhookUrl = process.env.BAILEYS_WEBHOOK_URL
  if (!webhookUrl || targetNumbers.length === 0) return false

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: targetNumbers, message }),
    })
    return res.ok
  } catch {
    return false
  }
}
