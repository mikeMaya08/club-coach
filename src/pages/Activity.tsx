import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { filterEvents, useClub } from 'club-store'
import { useMe } from '../lib/useMe'

const PAGE = 15
const FILTERS = [
  { id: 'all', label: 'All', prefixes: [] as string[] },
  { id: 'lessons', label: 'My lessons', prefixes: ['lesson.', 'attendance.'] },
  { id: 'notes', label: 'Notes and templates', prefixes: ['note.', 'template.'] },
]

export default function Activity() {
  const me = useMe()
  const [filter, setFilter] = useState('all')
  const [visible, setVisible] = useState(PAGE)

  // Everything I did, plus what students did in my lessons (enroll, leave, waitlist) and what admins did to them.
  const events = useClub((s) => {
    const myLessons = new Set(s.lessons.filter((l) => l.coachId === me.id).map((l) => l.id))
    return filterEvents(s.events).filter(
      (e) => e.actorId === me.id || e.subjectId === me.id || (e.entity === 'lesson' && e.entityId !== undefined && myLessons.has(e.entityId)),
    )
  })

  const prefixes = FILTERS.find((f) => f.id === filter)!.prefixes
  const list = events.filter((e) => prefixes.length === 0 || prefixes.some((p) => e.type.startsWith(p)))
  const chip = (active: boolean) => `cursor-pointer rounded-full border px-3 py-1.5 text-sm ${active ? 'border-indigo-700 bg-indigo-700 text-white' : 'bg-white hover:bg-slate-100'}`

  return (
    <div className="max-w-2xl">
      <h2 className="mb-3 text-xl font-semibold">Activity</h2>
      <div role="group" aria-label="Filter activity" className="mb-3 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <span
            key={f.id}
            role="button"
            tabIndex={0}
            aria-pressed={filter === f.id}
            className={chip(filter === f.id)}
            onClick={() => { setFilter(f.id); setVisible(PAGE) }}
            onKeyDown={(e) => e.key === 'Enter' && (setFilter(f.id), setVisible(PAGE))}
          >
            {f.label}
          </span>
        ))}
      </div>

      {list.length === 0 && <div className="rounded-lg border bg-white p-6 text-center text-sm text-slate-500">No activity yet.</div>}

      <ol className="space-y-2">
        {list.slice(0, visible).map((e) => (
          <li key={e.id} className="rounded-lg border bg-white p-3">
            <p className="text-sm">{e.summary}</p>
            <p className="text-xs text-slate-500">{format(parseISO(e.createdAt), 'MMM d, HH:mm')} · {e.type}</p>
          </li>
        ))}
      </ol>

      {list.length > visible && (
        <div className="mt-3 text-center">
          <span role="button" tabIndex={0} className="cursor-pointer rounded border bg-white px-4 py-2 text-sm hover:bg-slate-100" onClick={() => setVisible((v) => v + PAGE)} onKeyDown={(e) => e.key === 'Enter' && setVisible((v) => v + PAGE)}>
            Show more ({list.length - visible} left)
          </span>
        </div>
      )}
    </div>
  )
}
