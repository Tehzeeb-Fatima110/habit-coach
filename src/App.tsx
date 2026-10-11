import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom'
import Dashboard from './pages/Dashboard.tsx'
import GoalForm from './pages/GoalForm.tsx'
import LogEntry from './pages/LogEntry.tsx'
import Progress from './pages/Progress.tsx'

function Layout() {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-accent-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-soft">
        Skip to main content
      </a>
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
        <nav className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4" aria-label="Primary navigation">
          <NavLink to="/" className="text-base font-bold tracking-tight text-gray-900">
            Habit Coach
          </NavLink>
          <span className="flex items-center gap-1 sm:gap-2">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600 ${
                  isActive
                    ? 'font-semibold text-accent-700 underline decoration-2 underline-offset-4'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/goals/new"
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600 ${
                  isActive
                    ? 'font-semibold text-accent-700 underline decoration-2 underline-offset-4'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              New Goal
            </NavLink>
          </span>
        </nav>
      </header>
      <main id="main" className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
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
