import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const ROUND_POINTS = { r32: 1, r16: 2, qf: 4, sf: 8, final: 16 }

export default function Leaderboard() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const [{ data: participants }, { data: predictions }, { data: matches }] = await Promise.all([
      supabase.from('participants').select('id, name'),
      supabase.from('predictions').select('participant_id, match_id, predicted_winner'),
      supabase.from('matches').select('id, round, winner').not('winner', 'is', null),
    ])

    const matchMap = {}
    matches?.forEach(m => { matchMap[m.id] = m })

    const scores = participants?.map(p => {
      const myPreds = predictions?.filter(pr => pr.participant_id === p.id) || []
      let points = 0, correct = 0, total = 0
      myPreds.forEach(pr => {
        const match = matchMap[pr.match_id]
        if (match) {
          total++
          if (match.winner === pr.predicted_winner) {
            correct++
            points += ROUND_POINTS[match.round] || 1
          }
        }
      })
      return { name: p.name, points, correct, total }
    }) || []

    scores.sort((a, b) => b.points - a.points || b.correct - a.correct)
    setRows(scores)
    setLoading(false)
  }

  useEffect(() => {
    load()
    const channel = supabase.channel('lb').on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, load).subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  if (loading) return <p className="text-gray-400 text-center">Loading…</p>

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">Leaderboard</h1>
      {rows.length === 0 ? (
        <p className="text-gray-400 text-center">No predictions yet — be the first!</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r, i) => (
            <div key={r.name} className={`flex items-center gap-4 rounded-xl px-5 py-4 border ${i === 0 ? 'border-yellow-600/50 bg-yellow-950/20' : 'border-gray-700 bg-gray-900'}`}>
              <span className="text-xl w-8 text-center">{medals[i] || `${i + 1}`}</span>
              <span className="flex-1 font-semibold">{r.name}</span>
              <div className="text-right">
                <div className="text-green-400 font-bold text-lg">{r.points} pts</div>
                <div className="text-gray-500 text-xs">{r.correct}/{r.total} correct</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
