import { useEffect, useRef } from "react"

/** Navigasi fokus ala Tab/Shift+Tab lewat kode — dipakai supaya Enter di form modal
 *  otomatis pindah ke field berikutnya (bukan diam kayak browser default), tanpa ganggu
 *  Tab/Shift+Tab native yang memang sudah jalan sendiri lewat urutan DOM.
 *
 *  Discope ke elemen dengan [data-modal-panel] terdekat (fallback ke document.body kalau
 *  dipakai di luar Modal, mis. form filter di halaman biasa). */
const FOCUSABLE_SELECTOR = 'input:not([disabled]):not([type="hidden"]):not([data-select-search]), textarea:not([disabled]), button:not([disabled])'

function isVisible(el: Element): el is HTMLElement {
  return el instanceof HTMLElement && el.offsetParent !== null
}

export function focusAdjacentField(current: HTMLElement, direction: 1 | -1): boolean {
  const scope = current.closest<HTMLElement>("[data-modal-panel]") ?? document.body
  const focusables = Array.from(scope.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(isVisible)
  const idx = focusables.indexOf(current)
  if (idx === -1) return false
  const target = focusables[idx + direction]
  if (!target) return false
  target.focus()
  if (target instanceof HTMLInputElement && target.type !== "button") target.select()
  return true
}

/** Fokus elemen focusable pertama dalam scope (dipanggil saat Modal baru dibuka). */
export function focusFirstField(scope: HTMLElement) {
  const first = scope.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)[0]
  if (first) {
    first.focus()
    if (first instanceof HTMLInputElement && first.type !== "button") first.select()
  }
}

/** Versi non-Modal dari behavior di atas (auto-focus field pertama + Enter pindah kolom)
 *  — dipakai di form yang halaman penuh (bukan modal), mis. Tambah/Edit Purchase Order.
 *  Tempel `panelRef` & `onKeyDown={handleEnterAdvance}` ke div pembungkus form-nya. */
export function useFormKeyboardNav<T extends HTMLElement = HTMLDivElement>() {
  const panelRef = useRef<T>(null)

  useEffect(() => {
    requestAnimationFrame(() => {
      if (panelRef.current) focusFirstField(panelRef.current)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleEnterAdvance = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter") return
    const target = e.target as HTMLElement
    if (target.hasAttribute("data-select-search")) return
    if (!(target instanceof HTMLInputElement)) return
    e.preventDefault()
    focusAdjacentField(target, 1)
  }

  return { panelRef, handleEnterAdvance }
}
