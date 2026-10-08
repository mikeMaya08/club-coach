import { useEffect, useRef } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { logout, useClub } from 'club-store'
import { useMe } from '../lib/useMe'
import PendingBar from './PendingBar'
import NotificationBell from './NotificationBell'
import ThemeToggle from './ThemeToggle'
import { useToast } from './Toast'

const LINKS = [
  { to: '/', label: 'My schedule', end: true },
  { to: '/lessons/new', label: 'Create lesson' },
  { to: '/notes', label: 'Student notes' },
  { to: '/students', label: 'Students' },
]

export default function Layout() {
  const me = useMe()
  const navigate = useNavigate()
  const toast = useToast()

  // Toast new notifications as they arrive.
  const mine = useClub((s) => s.notifications.filter((n) => n.userId === me.id))
  const seen = useRef<Set<string> | null>(null)
  useEffect(() => {
    if (!seen.current) {
      seen.current = new Set(mine.map((n) => n.id))
      return
    }
    for (const n of mine) {
      if (!seen.current.has(n.id)) {
        seen.current.add(n.id)
        toast(n.message, 'info')
      }
    }
  }, [mine, toast])

  return (
    <div className="min-h-screen">
      <a
        href="#main"
        className="sr-only rounded bg-white px-3 py-2 text-slate-900 focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[90]"
      >
        Skip to content
      </a>
      <PendingBar />
      <header className="bg-indigo-700 text-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <h1 className="text-lg font-semibold">
            Baseline Club <span className="font-normal text-indigo-100">· Coach</span>
          </h1>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 text-sm">
              <span className="inline-block h-6 w-6 rounded-full" style={{ background: me.avatarColor }} />
              {me.name}
            </span>
            <ThemeToggle />
            <NotificationBell />
            <span
              role="button"
              tabIndex={0}
              className="cursor-pointer rounded-md bg-indigo-900 px-3 py-1.5 text-sm hover:bg-indigo-950"
              onClick={() => {
                logout('coach')
                navigate('/login')
              }}
              onKeyDown={(e) => e.key === 'Enter' && (logout('coach'), navigate('/login'))}
            >
              Log out
            </span>
          </div>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-3">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) => `whitespace-nowrap rounded-t-md px-4 py-2 text-sm ${isActive ? 'bg-slate-50 font-medium text-indigo-800' : 'text-indigo-100 hover:bg-indigo-600'}`}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main id="main" tabIndex={-1} className="mx-auto max-w-5xl px-4 py-5 outline-none">
        <Outlet context={me} />
      </main>
    </div>
  )
}
