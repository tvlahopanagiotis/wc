import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Bracket from './pages/Bracket'
import Predict from './pages/Predict'
import Leaderboard from './pages/Leaderboard'
import Admin from './pages/Admin'

function Nav() {
  const base = 'px-4 py-2 rounded-lg text-sm font-bold tracking-wide transition-all duration-200'
  const active = 'bg-yellow-400 text-gray-900 shadow-lg shadow-yellow-400/30'
  const inactive = 'text-gray-300 hover:text-white hover:bg-white/10'
  return (
    <nav className="bg-gray-900/95 backdrop-blur border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 mr-6">
          <span className="text-2xl">⚽</span>
          <div>
            <div className="text-white font-black text-lg leading-none tracking-tight">WC 2026</div>
            <div className="text-yellow-400 text-xs font-semibold leading-none">OFFICE PREDICTOR</div>
          </div>
        </div>
        <NavLink to="/" end className={({ isActive }) => `${base} ${isActive ? active : inactive}`}>🏆 Bracket</NavLink>
        <NavLink to="/predict" className={({ isActive }) => `${base} ${isActive ? active : inactive}`}>🎯 Predict</NavLink>
        <NavLink to="/leaderboard" className={({ isActive }) => `${base} ${isActive ? active : inactive}`}>📊 Leaderboard</NavLink>
        <NavLink to="/admin" className={({ isActive }) => `ml-auto ${base} ${isActive ? active : inactive}`}>⚙️ Admin</NavLink>
      </div>
    </nav>
  )
}

export default function App() {
  return (
    <BrowserRouter basename="/wc">
      <div className="min-h-screen text-white" style={{ background: 'radial-gradient(ellipse at top, #0f2027 0%, #111827 50%, #030712 100%)' }}>
        <Nav />
        <main className="max-w-6xl mx-auto px-4 py-8">
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
