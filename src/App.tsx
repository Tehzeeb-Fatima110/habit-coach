import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import Dashboard from './pages/Dashboard.tsx'
import GoalForm from './pages/GoalForm.tsx'
import LogEntry from './pages/LogEntry.tsx'
import Progress from './pages/Progress.tsx'

function Layout() {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:p-4">
        Skip to main content
      </a>
      <header>
        <nav aria-label="Primary navigation">
          <Link to="/">Dashboard</Link>
          <Link to="/goals/new">New Goal</Link>
        </nav>
      </header>
      <main id="main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/goals/new" element={<GoalForm />} />
          <Route path="/log/:goalId" element={<LogEntry />} />
          <Route path="/progress/:goalId" element={<Progress />} />
        </Routes>
      </main>
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  )
}

export default App
