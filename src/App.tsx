import { Navigate, Route, Routes } from 'react-router-dom'
import DebugPanel from './components/DebugPanel'
import Guard from './components/Guard'
import Layout from './components/Layout'
import CreateLesson from './pages/CreateLesson'
import LessonDetail from './pages/LessonDetail'
import Login from './pages/Login'
import Schedule from './pages/Schedule'
import StudentNotes from './pages/StudentNotes'
import Students from './pages/Students'

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Guard />}>
          <Route element={<Layout />}>
            <Route index element={<Schedule />} />
            <Route path="lessons/new" element={<CreateLesson />} />
            <Route path="lessons/:id" element={<LessonDetail />} />
            <Route path="notes" element={<StudentNotes />} />
            <Route path="students" element={<Students />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <DebugPanel app="coach" />
    </>
  )
}
