import { useEffect, useId, useRef, type ReactNode } from 'react'

interface Props {
  title: string
  onClose: () => void
  children: ReactNode
}

/** Moves focus into the dialog, keeps Tab inside it and gives focus back when it closes. */
function useDialogFocus(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const focusable = () =>
      Array.from(ref.current?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') ?? []).filter((el) => !el.hasAttribute('disabled'))
    ;(focusable()[1] ?? focusable()[0] ?? ref.current)?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return close.current()
      if (e.key !== 'Tab') return
      const items = focusable()
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) (e.preventDefault(), last.focus())
      else if (!e.shiftKey && document.activeElement === last) (e.preventDefault(), first.focus())
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      previous?.focus?.()
    }
  }, [])
  return ref
}

/** Centered dialog. Esc and backdrop click close it. */
export default function Modal({ title, onClose, children }: Props) {
  const titleId = useId()
  const ref = useDialogFocus(onClose)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-xl bg-white p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 id={titleId} className="text-lg font-semibold">{title}</h2>
          <button
            type="button"
            aria-label="Close"
            className="rounded p-1 text-slate-500 hover:bg-slate-100"
            onClick={onClose}
          >
            <span aria-hidden>✕</span>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
