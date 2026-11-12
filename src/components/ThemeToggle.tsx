import { toggleTheme, useTheme } from '../lib/theme'

/** Light/dark switch. The choice is shared by all apps (see lib/theme.ts). */
export default function ThemeToggle() {
  const theme = useTheme()
  return (
    <button
      type="button"
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className="rounded-md bg-indigo-900 px-3 py-1.5 text-sm hover:bg-indigo-950"
      onClick={toggleTheme}
    >
      <span aria-hidden>{theme === 'dark' ? '☀️' : '🌙'}</span>
    </button>
  )
}
