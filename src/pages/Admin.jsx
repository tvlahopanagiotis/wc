import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const ROUNDS = ['r32', 'r16', 'qf', 'sf', 'final']
const ROUND_LABELS = { r32: 'Round of 32', r16: 'Round of 16', qf: 'Quarterfinals', sf: 'Semifinals', final: 'Final' }

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123'

function useAuth() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('admin') === 'yes')
  const login = (pw) => { if (pw === ADMIN_PASSWORD) { sessionStorage.setItem('admin', 'yes'); setAuthed(true); return true } return false }
  return { authed, login }
}

export default function Admin() {
  const { authed, login } = useAuth()
  const [pw, setPw] = useState('')
  const [pwErr, setPwErr] = useState(false)
  const [matches, setMatches] = useState([])
  const [tab, setTab] = useState('results')
  const [newMatch, setNewMatch] = useState({ round: 'r32', match_number: '', team1: '', team2: '' })
  const [saving, setSaving] = useState(null)
  const [msg, setMsg] = useState('')

  async function loadMatches() {
    const { data } = await supabase.from('matches').select('*').order('match_number')
    setMatches(data || [])
  }

  useEffect(() => { if (authed) loadMatches() }, [authed])

  function handleLogin(e) {
    e.preventDefault()
    if (!login(pw)) setPwErr(true)
  }

  async function setWinner(matchId, winner, round) {
    setSaving(matchId)
    await supabase.from('matches').update({ winner }).eq('id', matchId)
    await supabase.from('predictions').update({ is_correct: true }).eq('match_id', matchId).eq('predicted_winner', winner)
    await supabase.from('predictions').update({ is_correct: false }).eq('match_id', matchId).neq('predicted_winner', winner)
    await loadMatches()
    setSaving(null)
    setMsg('Result saved!')
    setTimeout(() => setMsg(''), 2000)
  }

  async function clearWinner(matchId) {
    setSaving(matchId)
    await supabase.from('matches').update({ winner: null }).eq('id', matchId)
    await supabase.from('predictions').update({ is_correct: null }).eq('match_id', matchId)
    await loadMatches()
    setSaving(null)
  }

  async function addMatch(e) {
    e.preventDefault()
    if (!newMatch.match_number || !newMatch.team1 || !newMatch.team2) return
    setSaving('new')
    await supabase.from('matches').insert({ ...newMatch, match_number: Number(newMatch.match_number) })
    setNewMatch(m => ({ ...m, match_number: '', team1: '', team2: '' }))
    await loadMatches()
    setSaving(null)
    setMsg('Match added!')
    setTimeout(() => setMsg(''), 2000)
  }

  async function deleteMatch(id) {
    if (!confirm('Delete this match and all predictions for it?')) return
    await supabase.from('predictions').delete().eq('match_id', id)
    await supabase.from('matches').delete().eq('id', id)
    await loadMatches()
  }

  if (!authed) {
    return (
      <div className="max-w-xs mx-auto mt-16">
        <h1 className="text-2xl font-bold mb-6 text-center">Admin</h1>
        <form onSubmit={handleLogin} className="bg-gray-900 border border-gray-700 rounded-xl p-6">
          <label className="block text-sm text-gray-400 mb-2">Password</label>
          <input type="password" className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500" value={pw} onChange={e => { setPw(e.target.value); setPwErr(false) }} autoFocus />
          {pwErr && <p className="text-red-400 text-sm mt-1">Wrong password</p>}
          <button type="submit" className="mt-4 w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-2 rounded-lg transition-colors">Login</button>
        </form>
      </div>
    )
  }

  const byRound = ROUNDS.reduce((acc, r) => { acc[r] = matches.filter(m => m.round === r); return acc }, {})

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Admin Panel</h1>
      {msg && <p className="text-green-400 text-sm mb-3">{msg}</p>}

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('results')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'results' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>Enter Results</button>
        <button onClick={() => setTab('setup')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'setup' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>Setup Bracket</button>
      </div>

      {tab === 'results' && (
        <div className="space-y-6">
          {ROUNDS.map(round => byRound[round].length > 0 && (
            <div key={round}>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">{ROUND_LABELS[round]}</h2>
              <div className="space-y-2">
                {byRound[round].map(m => (
                  <div key={m.id} className="bg-gray-900 border border-gray-700 rounded-xl p-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-gray-500 text-xs w-16">Match {m.match_number}</span>
                      <div className="flex gap-2 flex-1">
                        {[m.team1, m.team2].map(team => (
                          <button key={team} disabled={saving === m.id} onClick={() => setWinner(m.id, team, m.round)}
                            className={`flex-1 py-1.5 px-3 rounded-lg border text-sm transition-colors ${m.winner === team ? 'bg-green-600 border-green-500 text-white' : 'border-gray-600 text-gray-300 hover:border-green-600 hover:text-white'}`}>
                            {team}
                          </button>
                        ))}
                      </div>
                      {m.winner && (
                        <button onClick={() => clearWinner(m.id)} className="text-xs text-gray-500 hover:text-red-400 underline">clear</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {matches.length === 0 && <p className="text-gray-500">No matches yet. Use Setup Bracket to add matches.</p>}
        </div>
      )}

      {tab === 'setup' && (
        <div>
          <form onSubmit={addMatch} className="bg-gray-900 border border-gray-700 rounded-xl p-5 mb-6">
            <h2 className="font-semibold mb-4">Add Match</h2>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-gray-400">Round</label>
                <select className="mt-1 w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                  value={newMatch.round} onChange={e => setNewMatch(m => ({ ...m, round: e.target.value }))}>
                  {ROUNDS.map(r => <option key={r} value={r}>{ROUND_LABELS[r]}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400">Match #</label>
                <input className="mt-1 w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm" type="number" min="1"
                  value={newMatch.match_number} onChange={e => setNewMatch(m => ({ ...m, match_number: e.target.value }))} placeholder="1" />
              </div>
              <div>
                <label className="text-xs text-gray-400">Team 1</label>
                <input className="mt-1 w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                  value={newMatch.team1} onChange={e => setNewMatch(m => ({ ...m, team1: e.target.value }))} placeholder="e.g. Brazil" />
              </div>
              <div>
                <label className="text-xs text-gray-400">Team 2</label>
                <input className="mt-1 w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                  value={newMatch.team2} onChange={e => setNewMatch(m => ({ ...m, team2: e.target.value }))} placeholder="e.g. Argentina" />
              </div>
            </div>
            <button type="submit" disabled={saving === 'new'} className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition-colors">
              Add Match
            </button>
          </form>

          <div className="space-y-2">
            {matches.map(m => (
              <div key={m.id} className="flex items-center gap-3 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm">
                <span className="text-gray-500 text-xs w-8">#{m.match_number}</span>
                <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">{ROUND_LABELS[m.round]}</span>
                <span className="flex-1">{m.team1} vs {m.team2}</span>
                {m.winner && <span className="text-green-400 text-xs">✓ {m.winner}</span>}
                <button onClick={() => deleteMatch(m.id)} className="text-gray-600 hover:text-red-400 transition-colors text-lg leading-none">×</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
