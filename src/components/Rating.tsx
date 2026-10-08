import { useEffect, useRef } from 'react'

/** React wrapper around the <club-rating> web component. */
export default function Rating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || !onChange) return
    const handler = (e: Event) => onChange((e as CustomEvent<number>).detail)
    el.addEventListener('rating-change', handler)
    return () => el.removeEventListener('rating-change', handler)
  }, [onChange])

  // React 18 sets unknown props on custom elements as attributes; `readonly` must be absent, not "false".
  return onChange ? <club-rating ref={ref} value={value} /> : <club-rating ref={ref} value={value} readonly />
}
