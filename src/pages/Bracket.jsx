import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const ROUND_ORDER = ['r32', 'r16', 'qf', 'sf', 'final']
const ROUND_LABELS = { r32: 'Round of 32', r16: 'Round of 16', qf: 'Quarterfinals', sf: 'Semifinals', final: 'Final' }

function MatchCard({ match }) {
  const isDone = !!match.winner
  return (
    <div className={`rounded-lg border p-3 text-sm w-44 ${isDone ? 'border-green-700 bg-green-950/40' : 'border-gray-700 bg-gray-900'}`}>
      <div className={`py-1 px-2 rounded ${match.winner === match.team1 ? 'text-green-400 font-semibold' : 'text-gray-300'}`}>
        {match.team1 || <span className="text-gray-600 italic">TBD</span>}
      </div>
      <div className="text-gray-600 text-xs text-center my-1">vs</div>
      <div className={`py-1 px-2 rounded ${match.winner === match.team2 ? 'text-green-400 font-semibold' : 'text-gray-300'}`}>
        {match.team2 || <span className="text-gray-600 italic">TBD</span>}
      </div>
    </div>
  )
}

export default function Bracket() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('matches').select('*').order('match_number').then(({ data }) => {
      setMatches(data || [])
      setLoading(false)
    })

    const channel = supabase.channel('matches').on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => {
      supabase.from('matches').select('*').order('match_number').then(({ data }) => setMatches(data || []))
    }).subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  if (loading) return <p className="text-gray-400 text-center">Loading bracket…</p>

  const byRound = ROUND_ORDER.reduce((acc, r) => {
    acc[r] = matches.filter(m => m.round === r)
    return acc
  }, {})

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-center">World Cup 2026 Bracket</h1>
      <div className="overflow-x-auto">
        <div className="flex gap-8 items-start min-w-max px-2">
          {ROUND_ORDER.map(round => (
            byRound[round].length > 0 && (
              <div key={round} className="flex flex-col gap-4">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500 text-center mb-2">
                  {ROUND_LABELS[round]}
                </h2>
                <div className="flex flex-col gap-4 justify-around h-full">
                  {byRound[round].map(m => <MatchCard key={m.id} match={m} />)}
                </div>
              </div>
            )
          ))}
        </div>
      </div>
    </div>
  )
}
