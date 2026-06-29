import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const ROUND_LABELS = { r32: 'Round of 32', r16: 'Round of 16', qf: 'Quarterfinals', sf: 'Semifinals', final: 'Final' }

export default function Predict() {
  const [name, setName] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [matches, setMatches] = useState([])
  const [picks, setPicks] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [existing, setExisting] = useState(null)

  useEffect(() => {
    supabase.from('matches').select('*').is('winner', null).order('match_number').then(({ data }) => setMatches(data || []))
  }, [])

  async function handleNameSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    const { data } = await supabase.from('participants').select('id').ilike('name', name.trim()).single()
    if (data) {
      const { data: preds } = await supabase.from('predictions').select('match_id, predicted_winner').eq('participant_id', data.id)
      const existingPicks = {}
      preds?.forEach(p => { existingPicks[p.match_id] = p.predicted_winner })
      setPicks(existingPicks)
      setExisting(data.id)
    }
    setSubmitted(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (Object.keys(picks).length === 0) { setError('Pick at least one match.'); return }
    setSaving(true); setError('')

    let participantId = existing
    if (!participantId) {
      const { data, error: err } = await supabase.from('participants').insert({ name: name.trim() }).select('id').single()
      if (err) { setError('Could not save — try a different name.'); setSaving(false); return }
      participantId = data.id
    } else {
      await supabase.from('predictions').delete().eq('participant_id', participantId).in('match_id', Object.keys(picks))
    }

    const rows = Object.entries(picks).map(([match_id, predicted_winner]) => ({ participant_id: participantId, match_id, predicted_winner }))
    const { error: err2 } = await supabase.from('predictions').upsert(rows, { onConflict: 'participant_id,match_id' })
    if (err2) { setError('Error saving predictions.'); setSaving(false); return }
    setSaving(false)
    setError('')
    alert('Predictions saved! Good luck 🎉')
  }

  const roundGroups = matches.reduce((acc, m) => {
    if (!acc[m.round]) acc[m.round] = []
    acc[m.round].push(m)
    return acc
  }, {})

  if (!submitted) {
    return (
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">Make Your Predictions</h1>
        <form onSubmit={handleNameSubmit} className="bg-gray-900 rounded-xl p-6 border border-gray-700">
          <label className="block text-sm text-gray-400 mb-2">Enter your name to start</label>
          <input
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
            value={name} onChange={e => setName(e.target.value)} placeholder="Your name" autoFocus
          />
          <button type="submit" className="mt-4 w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-2 rounded-lg transition-colors">
            Continue →
          </button>
        </form>
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <div className="text-center text-gray-400 mt-12">
        <p className="text-lg">No upcoming matches to predict right now.</p>
        <p className="text-sm mt-2">Check back once the next round is set up.</p>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-2 text-center">Pick Your Winners</h1>
      <p className="text-gray-400 text-sm text-center mb-6">Playing as <span className="text-green-400 font-semibold">{name}</span></p>
      <form onSubmit={handleSubmit} className="space-y-8">
        {Object.entries(roundGroups).map(([round, rMatches]) => (
          <div key={round}>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">{ROUND_LABELS[round] || round}</h2>
            <div className="space-y-3">
              {rMatches.map(m => (
                <div key={m.id} className="bg-gray-900 border border-gray-700 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-3">Match {m.match_number}</p>
                  <div className="flex gap-3">
                    {[m.team1, m.team2].map(team => (
                      <button
                        key={team} type="button"
                        onClick={() => setPicks(p => ({ ...p, [m.id]: team }))}
                        className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                          picks[m.id] === team
                            ? 'bg-green-600 border-green-500 text-white'
                            : 'border-gray-600 text-gray-300 hover:border-green-600 hover:text-white'
                        }`}
                      >
                        {team || '—'}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button type="submit" disabled={saving} className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors">
          {saving ? 'Saving…' : 'Submit Predictions'}
        </button>
      </form>
    </div>
  )
}
