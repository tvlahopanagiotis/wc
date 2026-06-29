import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Bracket from './pages/Bracket'
import Predict from './pages/Predict'
import Leaderboard from './pages/Leaderboard'
import Admin from './pages/Admin'

function Nav() {
  const base = 'px-4 py-2 rounded-lg text-sm font-medium transition-colors'
  const active = 'bg-green-600 text-white'
  const inactive = 'text-gray-300 hover:text-white hover:bg-white/10'
  return (
    <nav className="bg-gray-900 border-b border-gray-700 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-2 flex-wrap">
        <span className="text-white font-bold mr-4 text-lg">⚽ WC26</span>
        <NavLink to="/" end className={({ isActive }) => `${base} ${isActive ? active : inactive}`}>Bracket</NavLink>
        <NavLink to="/predict" className={({ isActive }) => `${base} ${isActive ? active : inactive}`}>Predict</NavLink>
        <NavLink to="/leaderboard" className={({ isActive }) => `${base} ${isActive ? active : inactive}`}>Leaderboard</NavLink>
        <NavLink to="/admin" className={({ isActive }) => `${base} ${isActive ? active : inactive}`}>Admin</NavLink>
      </div>
    </nav>
  )
}

export default function App() {
  return (
    <BrowserRouter basename="/wc">
      <div className="min-h-screen bg-gray-950 text-white">
        <Nav />
        <main className="max-w-5xl mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Bracket />} />
            <Route path="/predict" element={<Predict />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
