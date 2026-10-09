import { useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { api, useClub } from 'club-store'
import Rating from '../components/Rating'
import Select from '../components/Select'
import { useToast } from '../components/Toast'
import { useMe } from '../lib/useMe'
import { useRun } from '../lib/useRun'

/** Minimal rich text editor on contentEditable: bold, italic, bullet list. */
function Editor({ editorRef, onInput }: { editorRef: React.RefObject<HTMLDivElement>; onInput: () => void }) {
  const tool = (command: string, label: string, cls = '') => (
    <span
      role="button"
      tabIndex={0}
      className={`cursor-pointer select-none rounded border bg-white px-2 py-1 text-sm hover:bg-slate-100 ${cls}`}
      onMouseDown={(e) => {
        e.preventDefault() // keep the selection in the editor
        document.execCommand(command)
        onInput()
      }}
    >
      {label}
    </span>
  )
  return (
    <div>
      <div className="mb-1 flex gap-1">
        {tool('bold', 'B', 'font-bold')}
        {tool('italic', 'I', 'italic')}
        {tool('insertUnorderedList', '• List')}
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={onInput}
        className="min-h-[120px] rounded border bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-300 [&_li]:ml-5 [&_ul]:list-disc"
      />
    </div>
  )
}

export default function StudentNotes() {
  const me = useMe()
  const toast = useToast()
  const { run, busy } = useRun()
  const [params] = useSearchParams()
  const lessonId = params.get('lesson') ?? undefined
  const [studentId, setStudentId] = useState(params.get('student') ?? '')
  const [rating, setRating] = useState(0)
  const editor = useRef<HTMLDivElement>(null)
  const [empty, setEmpty] = useState(true)

  const data = useClub((s) => ({
    players: s.users.filter((u) => u.role === 'player' && u.active),
    notes: s.notes.filter((n) => n.coachId === me.id && n.playerId === studentId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  }))

  const save = async () => {
    const html = editor.current?.innerHTML ?? ''
    if (!studentId) return toast('Pick a student first', 'error')
    if (!editor.current?.textContent?.trim()) return toast('Write a note first', 'error')
    if (rating < 1) return toast('Please choose a rating', 'error')
    const result = await run(() => api.addNote({ coachId: me.id, playerId: studentId, lessonId, text: html, rating }), 'Note saved')
    if (result.ok) {
      if (editor.current) editor.current.innerHTML = ''
      setEmpty(true)
      setRating(0)
    }
  }

  return (
    <div className="max-w-2xl">
      <h2 className="mb-4 text-xl font-semibold">Student notes</h2>
      <div className="space-y-4 rounded-lg border bg-white p-4">
        <div>
          <span className="mb-1 block text-sm text-slate-600">Student</span>
          <Select
            label="Student" placeholder="Choose a student"
            value={studentId}
            onChange={setStudentId}
            options={data.players.map((p) => ({ value: p.id, label: p.name, hint: `Level ${p.level}` }))}
          />
        </div>
        <div>
          <span className="mb-1 block text-sm text-slate-600">Note</span>
          <Editor editorRef={editor} onInput={() => setEmpty(!editor.current?.textContent?.trim())} />
        </div>
        <div>
          <span className="mb-1 block text-sm text-slate-600">Rating</span>
          <Rating value={rating} onChange={setRating} />
        </div>
        <button type="button" disabled={busy || !studentId || empty} className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50" onClick={save}>
          {busy ? 'Saving…' : 'Save note'}
        </button>
      </div>

      {studentId && (
        <div className="mt-6">
          <h3 className="mb-2 text-sm font-semibold uppercase text-slate-500">Previous notes</h3>
          {data.notes.length === 0 && <p className="text-sm text-slate-500">No notes for this student yet.</p>}
          {data.notes.map((n) => (
            <div key={n.id} className="mb-2 rounded-lg border bg-white p-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs text-slate-500">{format(parseISO(n.createdAt), 'MMM d, yyyy HH:mm')}</span>
                <Rating value={n.rating} />
              </div>
              <div className="text-sm [&_li]:ml-5 [&_ul]:list-disc" dangerouslySetInnerHTML={{ __html: n.text }} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
