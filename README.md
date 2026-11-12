# club-coach

Coach app of the **Baseline Tennis Club** sandbox, served at `/coach`. React 18 + Vite + TypeScript + Tailwind.
No backend: data lives in `localStorage` through the `club-store` package.

**This app has no `data-testid` attributes on purpose** and uses hand-built components (custom dropdown,
modal, contentEditable editor, `<club-rating>` Web Component with Shadow DOM) so it is harder to automate.
Select elements by role, text, labels or structure.

## Features

- **My schedule:** week agenda of the coach's lessons, linking to lesson details.
- **Create lesson:** court, date, start/end, title, capacity. Conflicts (reservations, blocks, lessons, lights, hours) show inline while typing.
- **Lesson detail:** enrolled students, Present / No-show toggles (a no-show also marks an overlapping booked reservation as no-show), mark done, cancel lesson (with confirm).
- **Student notes:** pick a student, rich text (bold, italic, bullet list on `contentEditable`), 1-5 star `<club-rating>` (Shadow DOM, fires `rating-change`).
- **Students:** players who attended your lessons, with their last rating.
- Hidden debug panel: **Ctrl+Shift+D**.

## Activity log

**Activity** lists what the coach did plus what happened in their lessons (students enrolling, leaving, joining the waitlist, attendance), with *All / My lessons / Notes and templates* filters. Attendance and *mark as done* now record the coach as the actor.

## Added in the product upgrade

- **Month view:** *Week / Month* switch on My schedule.
- **Lesson templates:** save the Create-lesson form as a template, start a lesson from a template, delete templates. Lesson details also show the waitlist.

## Dark mode and accessibility

- **Dark mode:** toggle in the header (🌙/☀️). The choice is saved in `localStorage['club:theme']`, which all apps share, and defaults to the operating system preference. It is implemented by remapping the Tailwind utilities in `src/index.css` under a `.dark` class (no `dark:` variants on each element).
- **Accessibility:** skip link, landmarks, visible focus ring, dialogs with `aria-labelledby`, focus moved into the dialog, kept inside it with Tab and restored on close. Audited with axe-core (WCAG 2 A/AA + best practices) on every page and dialog in light and dark themes: 0 violations at the time of writing.

Still no `data-testid` anywhere in this app, on purpose.

## Scripts

| Script          | What it does                                  |
| --------------- | --------------------------------------------- |
| `npm install`   | Install dependencies                          |
| `npm run dev`   | Dev server on <http://localhost:5103/coach/>  |
| `npm run build` | Typecheck + build into `dist/coach`           |

## How it connects to the other repos

- Depends on `club-store` (`"club-store": "file:../club-store"`): clone the repos side by side and run `npm install` in `club-store` first.
- All apps share data via `localStorage['club:v1']`, so open them through `club-shell`: <http://127.0.0.1:5000/coach/> (on macOS use `127.0.0.1`, port 5000 is taken by AirPlay on `localhost`).
- `base: '/coach/'`, router `basename="/coach"`, `resolve.dedupe` for React.

### Deploying

The committed dependency is the tagged git version (works on Vercel). For live development against a local `club-store`, temporarily use `"club-store": "file:../club-store"` and run `npm install`. Committed value:

```json
"club-store": "git+https://github.com/mikeMaya08/club-store.git#v0.1.0"
```

Deploy as its own **Vercel** project from this repo (config in `vercel.json`; the build writes to `dist/coach` so the files match the `/coach/` base path, and a rewrite gives deep links the SPA fallback). Name the project `club-coach` so `club-shell` can proxy `/coach/*` to `https://club-coach.vercel.app`. If the `club-store` repo is private, Vercel needs access to it (or switch to a public repo).

## Test hooks

`?reset=1&seed=demo|empty|full`, `?as=coach-1`, `?now=2026-10-10T18:30`, `?latency=800`, `?flaky=0.2`,
`?bug=double-booking,stale-ui,wrong-price,cancel-anytime,slow-render`; `window.__club` exposes
`{ state, reset(seed), setBugs([]), setNow(iso) }`. See the `club-store` README.

Example: <http://127.0.0.1:5000/coach/?reset=1&seed=demo&as=coach-1&now=2026-10-10T10:00>
