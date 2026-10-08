import { useState } from 'react'
import { Link } from 'react-router-dom'
import { addDays, addWeeks, format, parseISO, startOfWeek } from 'date-fns'
import { clock, useClub } from 'club-store'
import { useMe } from '../lib/useMe'

const WEEK = { weekStartsOn: 1 } as const

export default function Schedule() {
  const me = useMe()
  const [weekStart, setWeekStart] = useState(() => startOfWeek(clock.now(), WEEK))
  const days = Array.from({ length: 7 }, (_, i) => format(addDays(weekStart, i), 'yyyy-MM-dd'))
  const today = clock.today()

  const data = useClub((s) => ({
    lessons: s.lessons.filter((l) => l.coachId === me.id && days.includes(l.date)).sort((a, b) => a.start.localeCompare(b.start)),
    courts: Object.fromEntries(s.courts.map((c) => [c.id, c.name])),
  }))

  const arrow = 'cursor-pointer rounded border bg-white px-3 py-1.5 text-sm hover:bg-slate-100'
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="mr-3 text-xl font-semibold">My schedule</h2>
        <span className={arrow} role="button" tabIndex={0} onClick={() => setWeekStart((w) => addWeeks(w, -1))}>‹ Prev</span>
        <span className={arrow} role="button" tabIndex={0} onClick={() => setWeekStart(startOfWeek(clock.now(), WEEK))}>This week</span>
        <span className={arrow} role="button" tabIndex={0} onClick={() => setWeekStart((w) => addWeeks(w, 1))}>Next ›</span>
        <span className="text-sm text-slate-500">{format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}</span>
      </div>

      <div className="grid gap-3 md:grid-cols-7">
        {days.map((date) => {
          const lessons = data.lessons.filter((l) => l.date === date)
          return (
            <div key={date} className={`rounded-lg border bg-white p-2 ${date === today ? 'border-indigo-400 ring-1 ring-indigo-300' : ''}`}>
              <div className="mb-2 text-xs font-semibold uppercase text-slate-500">{format(parseISO(date), 'EEE d')}</div>
              {lessons.length === 0 && <div className="text-xs text-slate-300">Nothing scheduled</div>}
              {lessons.map((l) => (
                <Link
                  key={l.id}
                  to={`/lessons/${l.id}`}
                  className={`mb-2 block rounded-md border-l-4 p-2 text-xs hover:bg-slate-50 ${l.status === 'cancelled' ? 'border-slate-300 text-slate-400 line-through' : l.status === 'done' ? 'border-green-500' : 'border-indigo-500'}`}
                >
                  <div className="font-medium">{l.start}–{l.end}</div>
                  <div>{l.title}</div>
                  <div className="text-slate-500">{data.courts[l.courtId]} · {l.studentIds.length}/{l.capacity}</div>
                </Link>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
