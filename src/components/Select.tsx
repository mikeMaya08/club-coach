import { useEffect, useId, useRef, useState } from 'react'

export interface Option {
  value: string
  label: string
  hint?: string
  disabled?: boolean
}

/** Hand-built dropdown (no native <select>), closes on outside click. */
export default function Select({ options, value, onChange, placeholder, label }: { options: Option[]; value: string; onChange: (v: string) => void; placeholder: string; label: string }) {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const listId = useId()
  const current = options.find((o) => o.value === value)

  useEffect(() => {
    const close = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  return (
    <div ref={box} className="relative">
      <div
        tabIndex={0}
        role="combobox"
        aria-label={label}
        aria-haspopup="listbox"
        aria-controls={listId}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between rounded border bg-white px-3 py-2 text-sm"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setOpen((o) => !o))}
      >
        <span className={current ? '' : 'text-slate-500'}>{current ? current.label : placeholder}</span>
        <span aria-hidden>▾</span>
      </div>
      {open && (
        <div id={listId} role="listbox" aria-label={label} className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded border bg-white shadow-lg">
          {options.map((o) => (
            <div
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              aria-disabled={o.disabled}
              className={`flex justify-between px-3 py-2 text-sm ${o.disabled ? 'cursor-not-allowed text-slate-300' : 'cursor-pointer hover:bg-indigo-50'} ${o.value === value ? 'bg-indigo-50 font-medium' : ''}`}
              onClick={() => {
                if (o.disabled) return
                onChange(o.value)
                setOpen(false)
              }}
            >
              <span>{o.label}</span>
              {o.hint && <span className="text-xs text-slate-500">{o.hint}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
