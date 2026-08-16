/** GAP = selisih hari SAMPE AGENT -> SAMPE MCHE, dihitung otomatis (bukan input manual)
 *  sesuai catatan implementasi di docs/menu.md. Null kalau salah satu tanggal belum ada. */
export function calcGapDays(sampeAgent: string | null, sampeMche: string | null): number | null {
  if (!sampeAgent || !sampeMche) return null
  const agent = new Date(sampeAgent)
  const mche = new Date(sampeMche)
  if (Number.isNaN(agent.getTime()) || Number.isNaN(mche.getTime())) return null
  const diffMs = mche.getTime() - agent.getTime()
  return Math.round(diffMs / (1000 * 60 * 60 * 24))
}
