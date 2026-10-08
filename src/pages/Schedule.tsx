import { useState } from 'react'
import { Link } from 'react-router-dom'
import { addDays, addMonths, addWeeks, endOfMonth, endOfWeek, format, isSameMonth, parseISO, startOfMonth, startOfWeek } from 'date-fns'
import { clock, useClub, type Lesson } from 'club-store'
import { useMe } from '../lib/useMe'

const WEEK = { weekStartsOn: 1 } as const
const arrow = 'cursor-pointer rounded border bg-white px-3 py-1.5 text-sm hover:bg-slate-100'

function LessonLink({ l, courts, compact }: { l: Lesson; courts: Record<string, string>; compact?: boolean }) {
  const tone = l.status === 'cancelled' ? 'border-slate-300 text-slate-500 line-through' : l.status === 'done' ? 'border-green-500' : 'border-indigo-500'
  return (
    <Link to={`/lessons/${l.id}`} className={`mb-1 block rounded-md border-l-4 p-1.5 text-xs hover:bg-slate-50 ${tone}`}>
      <div className="font-medium">{l.start}{compact ? '' : `–${l.end}`} {compact && l.title}</div>
      {!compact && <div>{l.title}</div>}
      {!compact && <div className="text-slate-500">{courts[l.courtId]} · {l.studentIds.length}/{l.capacity}</div>}
    </Link>
  )
}

export default function Schedule() {
  const me = useMe()
  const [view, setView] = useState<'week' | 'month'>('week')
  const [cursor, setCursor] = useState(() => clock.now())
  const today = clock.today()

  const first = view === 'week' ? startOfWeek(cursor, WEEK) : startOfWeek(startOfMonth(cursor), WEEK)
  const last = view === 'week' ? endOfWeek(cursor, WEEK) : endOfWeek(endOfMonth(cursor), WEEK)
  const days: string[] = []
  for (let d = first; d <= last; d = addDays(d, 1)) days.push(format(d, 'yyyy-MM-dd'))

  const data = useClub((s) => ({
    lessons: s.lessons.filter((l) => l.coachId === me.id && l.date >= days[0] && l.date <= days[days.length - 1]).sort((a, b) => a.start.localeCompare(b.start)),
    courts: Object.fromEntries(s.courts.map((c) => [c.id, c.name])),
  }))

  const step = (n: number) => setCursor((c) => (view === 'week' ? addWeeks(c, n) : addMonths(c, n)))
  const title = view === 'week' ? `${format(first, 'MMM d')} – ${format(last, 'MMM d, yyyy')}` : format(cursor, 'MMMM yyyy')
  const pill = (active: boolean) => `cursor-pointer px-3 py-1.5 text-sm ${active ? 'bg-indigo-600 text-white' : 'bg-white hover:bg-slate-100'}`

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="mr-3 text-xl font-semibold">My schedule</h2>
        <span className={arrow} role="button" tabIndex={0} onClick={() => step(-1)} onKeyDown={(e) => e.key === 'Enter' && step(-1)}>‹ Prev</span>
        <span className={arrow} role="button" tabIndex={0} onClick={() => setCursor(clock.now())} onKeyDown={(e) => e.key === 'Enter' && setCursor(clock.now())}>Today</span>
        <span className={arrow} role="button" tabIndex={0} onClick={() => step(1)} onKeyDown={(e) => e.key === 'Enter' && step(1)}>Next ›</span>
        <span className="text-sm text-slate-500" aria-live="polite">{title}</span>
        <span className="ml-auto inline-flex overflow-hidden rounded border" role="group" aria-label="View">
          <span className={pill(view === 'week')} role="button" tabIndex={0} aria-pressed={view === 'week'} onClick={() => setView('week')} onKeyDown={(e) => e.key === 'Enter' && setView('week')}>Week</span>
          <span className={pill(view === 'month')} role="button" tabIndex={0} aria-pressed={view === 'month'} onClick={() => setView('month')} onKeyDown={(e) => e.key === 'Enter' && setView('month')}>Month</span>
        </span>
      </div>

      {view === 'month' && (
        <div className="mb-1 hidden grid-cols-7 gap-2 text-center text-xs font-semibold uppercase text-slate-500 md:grid" aria-hidden>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <div key={d}>{d}</div>)}
        </div>
      )}

      <div className="grid gap-2 md:grid-cols-7">
        {days.map((date) => {
          const lessons = data.lessons.filter((l) => l.date === date)
          const outside = view === 'month' && !isSameMonth(parseISO(date), cursor)
          if (view === 'month' && outside && lessons.length === 0) return <div key={date} className="hidden md:block" />
          return (
            <div key={date} className={`rounded-lg border bg-white p-2 ${view === 'month' ? 'min-h-[88px]' : ''} ${outside ? 'opacity-60' : ''} ${date === today ? 'border-indigo-400 ring-1 ring-indigo-300' : ''}`}>
              <div className="mb-1 text-xs font-semibold uppercase text-slate-500">{format(parseISO(date), view === 'month' ? 'EEE d' : 'EEE d')}</div>
              {lessons.length === 0 && view === 'week' && <div className="text-xs text-slate-500">Nothing scheduled</div>}
              {lessons.map((l) => <LessonLink key={l.id} l={l} courts={data.courts} compact={view === 'month'} />)}
            </div>
          )
        })}
      </div>
    </div>
  )
}
