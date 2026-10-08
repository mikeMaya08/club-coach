import { Link } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { useClub } from 'club-store'
import Rating from '../components/Rating'
import { useMe } from '../lib/useMe'

export default function Students() {
  const me = useMe()
  const rows = useClub((s) => {
    const mine = s.lessons.filter((l) => l.coachId === me.id)
    const ids = new Set(mine.flatMap((l) => l.studentIds.filter((id) => l.attendance[id] === 'present')))
    return s.users
      .filter((u) => ids.has(u.id))
      .map((u) => {
        const last = s.notes.filter((n) => n.coachId === me.id && n.playerId === u.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
        return {
          user: u,
          attended: mine.filter((l) => l.attendance[u.id] === 'present').length,
          rating: last?.rating ?? 0,
          ratedOn: last?.createdAt,
        }
      })
      .sort((a, b) => a.user.name.localeCompare(b.user.name))
  })

  return (
    <div>
      <h2 className="mb-1 text-xl font-semibold">Students</h2>
      <p className="mb-4 text-sm text-slate-500">Players who attended at least one of your lessons.</p>
      {rows.length === 0 && <div className="rounded-lg border bg-white p-6 text-center text-sm text-slate-400">No students yet. Mark attendance in a lesson to see them here.</div>}
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.user.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-white p-3">
            <div className="flex items-center gap-3">
              <span className="h-8 w-8 rounded-full" style={{ background: r.user.avatarColor }} />
              <div>
                <div className="text-sm font-medium">{r.user.name}</div>
                <div className="text-xs text-slate-500">Level {r.user.level} · {r.attended} lesson{r.attended === 1 ? '' : 's'} attended</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                {r.rating ? <Rating value={r.rating} /> : <span className="text-xs text-slate-400">Not rated</span>}
                {r.ratedOn && <div className="text-[11px] text-slate-400">{format(parseISO(r.ratedOn), 'MMM d')}</div>}
              </div>
              <Link to={`/notes?student=${r.user.id}`} className="text-sm text-indigo-700 underline">Add note</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
