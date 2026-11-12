import { announcementsFor, api, clock, useClub } from 'club-store'
import { useMe } from '../lib/useMe'
import { useRun } from '../lib/useRun'

/** Club announcements for the coach: not expired, not dismissed. Pinned ones stay on top and cannot be closed. */
export default function Announcements() {
  const me = useMe()
  const { run } = useRun()
  const list = useClub((s) => announcementsFor(s, me.id, clock.today()))

  if (list.length === 0) return null
  return (
    <section aria-label="Announcements" className="mb-4 space-y-2">
      {list.map((a) => (
        <article key={a.id} className="flex items-start justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <div>
            <h2 className="font-semibold">
              {a.pinned && <span className="mr-2 rounded bg-amber-200 px-1.5 py-0.5 text-xs uppercase">Pinned</span>}
              {a.title}
            </h2>
            <p>{a.body}</p>
          </div>
          {!a.pinned && (
            <button
              type="button"
              aria-label={`Dismiss ${a.title}`}
              className="shrink-0 rounded border border-amber-300 px-2 py-1 text-xs hover:bg-amber-100"
              onClick={() => run(() => api.dismissAnnouncement(a.id, me.id))}
            >
              Dismiss
            </button>
          )}
        </article>
      ))}
    </section>
  )
}
