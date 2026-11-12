import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { login, useClub, useSession } from 'club-store'

/** Fake login: pick one of the coaches. A deactivated coach is sent back here with a message by the guard. */
export default function Login() {
  const { status } = useSession('coach')
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as { from?: string; message?: string } | null
  const coaches = useClub((s) => s.users.filter((u) => u.role === 'coach'))

  if (status === 'ok') return <Navigate to={state?.from ?? '/'} replace />

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-bold text-indigo-800">Baseline Club · Coach</h1>
      <p className="mb-4 text-sm text-slate-600">Who is coaching today? (fake login)</p>
      {state?.message && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{state.message}</div>}
      <div className="space-y-2">
        {coaches.map((u) => (
          <div
            key={u.id}
            role="button"
            tabIndex={0}
            className="flex cursor-pointer items-center gap-3 rounded-lg border bg-white p-3 hover:border-indigo-600"
            onClick={() => {
              login('coach', u.id)
              navigate(state?.from ?? '/', { replace: true })
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                login('coach', u.id)
                navigate(state?.from ?? '/', { replace: true })
              }
            }}
          >
            <span className="h-8 w-8 rounded-full" style={{ background: u.avatarColor }} />
            <div>
              <div className="text-sm font-medium">{u.name}</div>
              <div className="text-xs text-slate-500">{u.email}</div>
            </div>
            {!u.active && <span className="ml-auto rounded bg-slate-200 px-2 py-0.5 text-xs">inactive</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
