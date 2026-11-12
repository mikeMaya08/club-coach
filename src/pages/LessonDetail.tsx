import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { api, overlaps, useClub } from 'club-store'
import Modal from '../components/Modal'
import { useMe } from '../lib/useMe'
import { useRun } from '../lib/useRun'
import { useToast } from '../components/Toast'

export default function LessonDetail() {
  const { id } = useParams()
  const me = useMe()
  const navigate = useNavigate()
  const toast = useToast()
  const { run, busy } = useRun()
  const [confirming, setConfirming] = useState(false)

  const data = useClub((s) => {
    const lesson = s.lessons.find((l) => l.id === id)
    return {
      lesson,
      court: s.courts.find((c) => c.id === lesson?.courtId)?.name,
      waiting: (lesson?.waitlist ?? []).map((wid) => s.users.find((u) => u.id === wid)?.name ?? wid),
      students: (lesson?.studentIds ?? []).map((sid) => s.users.find((u) => u.id === sid)).filter((u) => !!u),
      // booked reservations that a no-show would also flip, per student
      matching: Object.fromEntries(
        (lesson?.studentIds ?? []).map((sid) => [
          sid,
          s.reservations.filter((r) => lesson && r.playerId === sid && r.status === 'booked' && r.date === lesson.date && overlaps(r, lesson)).length,
        ]),
      ),
    }
  })
  const { lesson } = data

  if (!lesson || lesson.coachId !== me.id) {
    return (
      <div>
        <p className="mb-2">Lesson not found.</p>
        <Link to="/" className="text-indigo-700 underline">Back to schedule</Link>
      </div>
    )
  }

  const editable = lesson.status !== 'cancelled'
  const mark = async (studentId: string, value: 'present' | 'no-show') => {
    const extra = value === 'no-show' && data.matching[studentId] > 0
    const result = await run(() => api.setAttendance(lesson.id, studentId, value, me.id))
    if (result.ok) toast(extra ? 'Marked as no-show (their reservation too)' : `Marked ${value}`, 'success')
  }

  const pill = (active: boolean, tone: string) =>
    `cursor-pointer rounded-full border px-3 py-1 text-xs ${active ? tone : 'bg-white text-slate-600 hover:bg-slate-100'} ${editable ? '' : 'pointer-events-none opacity-50'}`

  return (
    <div className="max-w-2xl">
      <Link to="/" className="text-sm text-indigo-700 underline">‹ Schedule</Link>
      <div className="mt-2 rounded-lg border bg-white p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-xl font-semibold">{lesson.title}</h2>
            <p className="text-sm text-slate-600">{format(parseISO(lesson.date), 'EEEE, MMM d')} · {lesson.start}–{lesson.end} · {data.court}</p>
          </div>
          <span className={`rounded px-2 py-0.5 text-xs font-medium ${lesson.status === 'scheduled' ? 'bg-indigo-100 text-indigo-700' : lesson.status === 'done' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {lesson.status}
          </span>
        </div>
        <p className="mt-2 text-sm">Enrolled: {lesson.studentIds.length} of {lesson.capacity}</p>

        <h3 className="mb-2 mt-4 text-sm font-semibold uppercase text-slate-500">Students</h3>
        {data.students.length === 0 && <p className="text-sm text-slate-500">No students enrolled yet.</p>}
        <ul className="divide-y">
          {data.students.map((u) => {
            const att = lesson.attendance[u!.id]
            return (
              <li key={u!.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <div>
                  <div className="text-sm font-medium">{u!.name}</div>
                  <div className="text-xs text-slate-500">Level {u!.level}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={pill(att === 'present', 'border-green-700 bg-green-700 text-white')} role="button" tabIndex={0} aria-pressed={att === 'present'} onClick={() => mark(u!.id, 'present')}>Present</span>
                  <span className={pill(att === 'no-show', 'border-red-600 bg-red-600 text-white')} role="button" tabIndex={0} aria-pressed={att === 'no-show'} onClick={() => mark(u!.id, 'no-show')}>No-show</span>
                  <Link to={`/notes?student=${u!.id}&lesson=${lesson.id}`} className="text-xs text-indigo-700 underline">Note</Link>
                </div>
              </li>
            )
          })}
        </ul>

        {data.waiting.length > 0 && (
          <>
            <h3 className="mb-2 mt-4 text-sm font-semibold uppercase text-slate-500">Waitlist ({data.waiting.length})</h3>
            <ol className="list-decimal pl-5 text-sm">
              {data.waiting.map((name, i) => <li key={i}>{name}</li>)}
            </ol>
            <p className="mt-1 text-xs text-slate-500">The first player is enrolled automatically when a seat opens up.</p>
          </>
        )}

        {lesson.status === 'scheduled' && (
          <div className="mt-5 flex gap-2 border-t pt-4">
            <button type="button" disabled={busy} className="rounded border px-3 py-2 text-sm" onClick={() => run(() => api.completeLesson(lesson.id, me.id), 'Lesson marked as done')}>Mark lesson as done</button>
            <button type="button" className="rounded border border-red-300 px-3 py-2 text-sm text-red-700" onClick={() => setConfirming(true)}>Cancel lesson</button>
          </div>
        )}
      </div>

      {confirming && (
        <Modal title="Cancel this lesson?" onClose={() => setConfirming(false)}>
          <p className="text-sm text-slate-600">The court is released and the {lesson.studentIds.length} enrolled student(s) are notified.</p>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" className="rounded border px-3 py-2 text-sm" onClick={() => setConfirming(false)}>Keep lesson</button>
            <button
              type="button"
              className="rounded bg-red-600 px-3 py-2 text-sm text-white"
              onClick={async () => {
                setConfirming(false)
                const r = await run(() => api.cancelLesson(lesson.id, me.id), 'Lesson cancelled')
                if (r.ok) navigate('/')
              }}
            >
              Cancel lesson
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
