import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { flag } from '../lib/flags'

const ROUND_ORDER = ['r32', 'r16', 'qf', 'sf', 'final']
const ROUND_LABELS = { r32: 'Round of 32', r16: 'Round of 16', qf: 'Quarterfinals', sf: 'Semifinals', final: 'Final' }
const ROUND_POINTS = { r32: 1, r16: 2, qf: 4, sf: 8, final: 16 }

export default function Predict() {
  const [name, setName] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [allMatches, setAllMatches] = useState([])
  const [picks, setPicks] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [existingId, setExistingId] = useState(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase.from('matches').select('*').order('match_number').then(({ data }) => setAllMatches(data || []))
  }, [])

  async function handleNameSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    const { data } = await supabase.from('participants').select('id').ilike('name', name.trim()).single()
    if (data) {
      const { data: preds } = await supabase.from('predictions').select('match_id, predicted_winner').eq('participant_id', data.id)
      const existing = {}
      preds?.forEach(p => { existing[p.match_id] = p.predicted_winner })
      setPicks(existing)
      setExistingId(data.id)
    }
    setSubmitted(true)
  }

  function pick(matchId, team) {
    setPicks(p => ({ ...p, [matchId]: team }))
    setSaved(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (Object.keys(picks).length === 0) { setError('Pick at least one match.'); return }
    setSaving(true); setError('')

    let participantId = existingId
    if (!participantId) {
      const { data, error: err } = await supabase.from('participants').insert({ name: name.trim() }).select('id').single()
      if (err) { setError('Could not save — try a different name.'); setSaving(false); return }
      participantId = data.id
      setExistingId(participantId)
    }

    const rows = Object.entries(picks).map(([match_id, predicted_winner]) => ({
      participant_id: participantId, match_id, predicted_winner
    }))
    const { error: err2 } = await supabase.from('predictions').upsert(rows, { onConflict: 'participant_id,match_id' })
    if (err2) { setError('Error saving predictions.'); setSaving(false); return }

    setSaving(false)
    setSaved(true)
  }

  if (!submitted) {
    return (
      <div className="max-w-md mx-auto animate-fade-in">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎯</div>
          <h1 className="text-4xl font-black tracking-tight mb-2">Make Your Picks</h1>
          <p className="text-gray-400">Predict winners all the way to the final. Points increase each round!</p>
        </div>
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
          <div className="flex justify-between text-center mb-6 gap-2">
            {Object.entries(ROUND_POINTS).map(([r, pts]) => (
              <div key={r} className="flex-1">
                <div className="text-yellow-400 font-black text-lg">{pts}pt{pts > 1 ? 's' : ''}</div>
                <div className="text-gray-500 text-xs">{ROUND_LABELS[r].split(' ')[0]}</div>
              </div>
            ))}
          </div>
          <form onSubmit={handleNameSubmit}>
            <label className="block text-sm text-gray-400 mb-2 font-semibold">Your name</label>
            <input
              className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-400 transition-colors text-lg"
              value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name…" autoFocus
            />
            <button type="submit" className="mt-4 w-full bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-black py-3 rounded-xl transition-colors text-lg tracking-wide">
              Let's Go →
            </button>
          </form>
        </div>
      </div>
    )
  }

  const byRound = ROUND_ORDER.reduce((acc, r) => {
    acc[r] = allMatches.filter(m => m.round === r)
    return acc
  }, {})

  const totalPicked = Object.keys(picks).length
  const totalMatches = allMatches.length

  return (
    <div className="max-w-xl mx-auto animate-fade-in">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-black mb-1">🎯 Your Picks</h1>
        <p className="text-gray-400 text-sm">
          Playing as <span className="text-yellow-400 font-bold">{name}</span>
          {' · '}
          <span className={totalPicked === totalMatches ? 'text-green-400' : 'text-gray-400'}>
            {totalPicked}/{totalMatches} picked
          </span>
        </p>
      </div>

      {saved && (
        <div className="mb-6 bg-green-500/20 border border-green-500/40 rounded-xl px-4 py-3 text-green-400 font-semibold text-center animate-fade-in">
          🎉 Predictions saved! Good luck!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {ROUND_ORDER.map(round => (
          byRound[round].length > 0 && (
            <div key={round}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-black uppercase tracking-widest text-yellow-400 bg-yellow-400/10 border border-yellow-400/30 px-3 py-1 rounded-full">
                  {ROUND_LABELS[round]}
                </span>
                <span className="text-xs text-gray-600">{ROUND_POINTS[round]} pt{ROUND_POINTS[round] > 1 ? 's' : ''} each</span>
              </div>
              <div className="space-y-2">
                {byRound[round].map(m => {
                  const done = !!m.winner
                  return (
                    <div key={m.id} className={`rounded-xl border p-3 transition-all ${done ? 'border-yellow-500/30 bg-yellow-950/20' : 'border-white/10 bg-white/5'}`}>
                      {done && <p className="text-xs text-yellow-500 mb-2 font-semibold">✓ Result: {flag(m.winner)} {m.winner}</p>}
                      <div className="flex gap-2">
                        {[m.team1, m.team2].map(team => {
                          if (!team) return null
                          const isPicked = picks[m.id] === team
                          const isCorrect = done && m.winner === team
                          const isWrong = done && picks[m.id] === team && m.winner !== team
                          return (
                            <button
                              key={team} type="button"
                              onClick={() => !done && pick(m.id, team)}
                              disabled={done}
                              className={`flex-1 flex items-center gap-2 py-2 px-3 rounded-lg border text-sm font-semibold transition-all duration-200 ${
                                isCorrect ? 'bg-green-500/30 border-green-500/60 text-green-300' :
                                isWrong   ? 'bg-red-500/20 border-red-500/40 text-red-400 line-through' :
                                isPicked  ? 'bg-yellow-400/20 border-yellow-400/60 text-yellow-300 scale-[1.02]' :
                                done      ? 'border-white/5 text-gray-600 cursor-default' :
                                            'border-white/15 text-gray-300 hover:border-yellow-400/50 hover:text-white hover:bg-white/5'
                              }`}
                            >
                              <span className="text-lg">{flag(team)}</span>
                              <span className="truncate">{team}</span>
                              {isPicked && !done && <span className="ml-auto">✓</span>}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        ))}

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <button
          type="submit" disabled={saving}
          className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-gray-900 font-black py-4 rounded-xl transition-all text-lg tracking-wide shadow-lg shadow-yellow-400/20"
        >
          {saving ? '⏳ Saving…' : '💾 Save All Predictions'}
        </button>
      </form>
    </div>
  )
}
