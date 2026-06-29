import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const ROUND_POINTS = { r32: 1, r16: 2, qf: 4, sf: 8, final: 16 }

const MEDALS = ['🥇', '🥈', '🥉']
const RANK_STYLE = [
  'border-yellow-400/50 bg-gradient-to-r from-yellow-950/40 to-gray-900/60',
  'border-gray-400/30 bg-gradient-to-r from-gray-800/40 to-gray-900/60',
  'border-orange-700/30 bg-gradient-to-r from-orange-950/30 to-gray-900/60',
]

export default function Leaderboard() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)

  async function load() {
    const [{ data: participants }, { data: predictions }, { data: matches }] = await Promise.all([
      supabase.from('participants').select('id, name'),
      supabase.from('predictions').select('participant_id, match_id, predicted_winner'),
      supabase.from('matches').select('id, round, winner').not('winner', 'is', null),
    ])

    const matchMap = {}
    matches?.forEach(m => { matchMap[m.id] = m })

    const scores = (participants || []).map(p => {
      const myPreds = (predictions || []).filter(pr => pr.participant_id === p.id)
      let points = 0, correct = 0
      myPreds.forEach(pr => {
        const match = matchMap[pr.match_id]
        if (match && match.winner === pr.predicted_winner) {
          correct++
          points += ROUND_POINTS[match.round] || 1
        }
      })
      return { name: p.name, points, correct, total: myPreds.filter(pr => matchMap[pr.match_id]).length }
    })

    scores.sort((a, b) => b.points - a.points || b.correct - a.correct)
    setRows(scores)
    setLastUpdated(new Date())
    setLoading(false)
  }

  useEffect(() => {
    load()
    const channel = supabase.channel('lb').on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, load).subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-3 text-gray-400">
      <span className="text-3xl animate-spin">⚽</span> Calculating scores…
    </div>
  )

  const leader = rows[0]

  return (
    <div className="max-w-xl mx-auto animate-fade-in">
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">🏆</div>
        <h1 className="text-4xl font-black tracking-tight mb-1">Leaderboard</h1>
        {lastUpdated && (
          <p className="text-gray-600 text-xs">Updates live · last refreshed {lastUpdated.toLocaleTimeString()}</p>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <div className="text-5xl mb-4">👀</div>
          <p className="text-lg font-semibold">No predictions yet</p>
          <p className="text-sm mt-1">Be the first to submit your picks!</p>
        </div>
      ) : (
        <>
          {leader && leader.points > 0 && (
            <div className="mb-6 text-center bg-yellow-400/10 border border-yellow-400/30 rounded-2xl py-4 px-6">
              <p className="text-yellow-400 text-xs font-black uppercase tracking-widest mb-1">Current Leader</p>
              <p className="text-2xl font-black text-white">{leader.name}</p>
              <p className="text-yellow-400 font-bold">{leader.points} points · {leader.correct} correct</p>
            </div>
          )}

          <div className="space-y-2">
            {rows.map((r, i) => (
              <div
                key={r.name}
                className={`flex items-center gap-4 rounded-xl px-5 py-4 border transition-all ${RANK_STYLE[i] || 'border-white/10 bg-white/5'}`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <span className="text-2xl w-8 text-center">{MEDALS[i] || <span className="text-gray-500 font-bold text-base">{i + 1}</span>}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white truncate">{r.name}</div>
                  <div className="text-gray-500 text-xs">{r.correct}/{r.total} correct picks</div>
                </div>
                <div className="text-right">
                  <div className={`font-black text-xl ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-400' : 'text-white'}`}>
                    {r.points}
                  </div>
                  <div className="text-gray-600 text-xs">pts</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
