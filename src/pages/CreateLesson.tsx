import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, clock, findConflicts, toMin, useClub } from 'club-store'
import Select from '../components/Select'
import { useMe } from '../lib/useMe'
import { useRun } from '../lib/useRun'

/** Form to create a lesson, with live conflict checks and reusable templates. */
export default function CreateLesson() {
  const me = useMe()
  const navigate = useNavigate()
  const { run, busy } = useRun()
  const [title, setTitle] = useState('')
  const [courtId, setCourtId] = useState('')
  const [date, setDate] = useState(() => clock.today())
  const [start, setStart] = useState('10:00')
  const [end, setEnd] = useState('11:00')
  const [capacity, setCapacity] = useState('4')
  const [templateName, setTemplateName] = useState('')
  const templates = useClub((s) => s.lessonTemplates.filter((x) => x.coachId === me.id))

  // A template pre-fills the form; the court is only set when the template has one, and the date is never touched.
  const applyTemplate = (id: string) => {
    const tpl = templates.find((x) => x.id === id)
    if (!tpl) return
    setTitle(tpl.title)
    if (tpl.courtId) setCourtId(tpl.courtId)
    setStart(tpl.start)
    setEnd(tpl.end)
    setCapacity(String(tpl.capacity))
  }

  const saveAsTemplate = async () => {
    const result = await run(
      () => api.saveTemplate({ coachId: me.id, name: templateName.trim(), title: title.trim(), courtId: courtId || undefined, start, end, capacity: Number(capacity) }),
      'Template saved',
    )
    if (result.ok) setTemplateName('')
  }

  // Live check while the form is being filled in. It mirrors the store's rules (hours, lights, court status,
  // conflicts) to explain a problem before submitting; the store still enforces them when the lesson is created.
  const check = useClub((s) => {
    const court = s.courts.find((c) => c.id === courtId)
    const problems: string[] = []
    if (!courtId || !date || !start || !end) return { courts: s.courts, problems, ready: false }
    if (toMin(end) <= toMin(start)) problems.push('The end time must be after the start time.')
    if (toMin(start) < s.settings.openHour * 60 || toMin(end) > s.settings.closeHour * 60) {
      problems.push(`The club is open ${s.settings.openHour}:00 to ${s.settings.closeHour}:00.`)
    }
    if (court && !court.lights && start >= s.settings.lightsRequiredFrom) problems.push(`${court.name} has no lights, so it cannot be used from ${s.settings.lightsRequiredFrom}.`)
    if (court && !court.active) problems.push(`${court.name} is out of service.`)
    if (toMin(end) > toMin(start)) {
      const c = findConflicts(s, { courtId, date, start, end })
      const who = (id: string) => s.users.find((u) => u.id === id)?.name ?? id
      c.reservations.forEach((r) => problems.push(`Reserved by ${who(r.playerId)}, ${r.start}–${r.end}.`))
      c.blocks.forEach((b) => problems.push(`Court blocked for ${b.reason}, ${b.start}–${b.end}.`))
      c.lessons.forEach((l) => problems.push(`Another lesson ("${l.title}") runs ${l.start}–${l.end}.`))
    }
    return { courts: s.courts, problems, ready: true }
  })

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    const result = await run(
      () => api.createLesson({ coachId: me.id, courtId, date, start, end, title: title.trim(), capacity: Number(capacity) }),
      'Lesson created',
    )
    if (result.ok) navigate(`/lessons/${result.value.id}`)
  }

  const field = 'w-full rounded border bg-white px-3 py-2 text-sm'
  const label = 'mb-1 block text-sm text-slate-600'

  return (
    <div className="max-w-xl">
      <h2 className="mb-4 text-xl font-semibold">Create lesson</h2>
      <form onSubmit={submit} className="space-y-4 rounded-lg border bg-white p-4">
        {templates.length > 0 && (
          <div>
            <span className={label}>Start from a template</span>
            <Select
              label="Template" placeholder="Choose a template"
              value=""
              onChange={applyTemplate}
              options={templates.map((x) => ({ value: x.id, label: x.name, hint: `${x.start}–${x.end} · ${x.capacity} seats` }))}
            />
          </div>
        )}
        <div>
          <label htmlFor="lesson-title" className={label}>Title</label>
          <input id="lesson-title" className={field} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Serve clinic" />
        </div>
        <div>
          <span id="court-label" className={label}>Court</span>
          <Select
            label="Court" placeholder="Choose a court"
            value={courtId}
            onChange={setCourtId}
            options={check.courts.map((c) => ({ value: c.id, label: c.name, hint: `${c.surface}${c.lights ? '' : ' · no lights'}${c.active ? '' : ' · closed'}`, disabled: !c.active }))}
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label htmlFor="lesson-date" className={label}>Date</label>
            <input id="lesson-date" className={field} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label htmlFor="lesson-start" className={label}>Start</label>
            <input id="lesson-start" className={field} type="time" step={900} value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div>
            <label htmlFor="lesson-end" className={label}>End</label>
            <input id="lesson-end" className={field} type="time" step={900} value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
        </div>
        <div className="w-32">
          <label htmlFor="lesson-capacity" className={label}>Capacity</label>
          <input id="lesson-capacity" className={field} type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} />
        </div>

        {check.ready && (
          check.problems.length === 0 ? (
            <div className="rounded border border-green-200 bg-green-50 p-2 text-sm text-green-700">This slot is free.</div>
          ) : (
            <div role="alert" className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
              <div className="mb-1 font-medium">This lesson cannot be scheduled as it is:</div>
              <ul className="list-disc pl-5">
                {check.problems.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </div>
          )
        )}

        <button type="submit" disabled={busy || !title.trim() || !courtId} className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
          {busy ? 'Creating…' : 'Create lesson'}
        </button>
      </form>

      <section className="mt-6 rounded-lg border bg-white p-4" aria-labelledby="templates-heading">
        <h3 id="templates-heading" className="mb-2 text-sm font-semibold uppercase text-slate-500">Templates</h3>
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex-1">
            <label htmlFor="template-name" className={label}>Save the form above as a template</label>
            <input id="template-name" className={field} value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="Template name" />
          </div>
          <button type="button" disabled={busy || !templateName.trim() || !title.trim()} className="rounded border px-3 py-2 text-sm disabled:opacity-50" onClick={saveAsTemplate}>
            Save template
          </button>
        </div>
        {templates.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No templates yet.</p>
        ) : (
          <ul className="mt-3 divide-y">
            {templates.map((x) => (
              <li key={x.id} className="flex items-center justify-between py-2 text-sm">
                <span>
                  <span className="font-medium">{x.name}</span>{' '}
                  <span className="text-slate-500">{x.title} · {x.start}–{x.end} · {x.capacity} seats</span>
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  aria-label={`Delete template ${x.name}`}
                  className="cursor-pointer text-red-700 underline"
                  onClick={() => run(() => api.deleteTemplate(x.id, me.id), 'Template deleted')}
                  onKeyDown={(e) => e.key === 'Enter' && run(() => api.deleteTemplate(x.id, me.id), 'Template deleted')}
                >
                  Delete
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
