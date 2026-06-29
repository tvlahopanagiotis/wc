import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { flag } from '../lib/flags'

const ROUND_ORDER = ['r32', 'r16', 'qf', 'sf', 'final']
const ROUND_LABELS = { r32: 'Round of 32', r16: 'Round of 16', qf: 'Quarterfinals', sf: 'Semifinals', final: 'Final' }

function TeamRow({ team, isWinner, isTbd }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 ${
      isWinner
        ? 'bg-yellow-400/20 border border-yellow-400/50 text-yellow-300 font-bold'
        : isTbd
        ? 'text-gray-600 italic text-sm'
        : 'text-gray-300'
    }`}>
      {!isTbd && <span className="text-lg leading-none">{flag(team)}</span>}
      <span className="text-sm">{isTbd ? 'TBD' : team}</span>
      {isWinner && <span className="ml-auto text-yellow-400 text-xs">✓</span>}
    </div>
  )
}

function MatchCard({ match }) {
  const isDone = !!match.winner
  return (
    <div className={`rounded-xl border p-2 w-48 transition-all duration-300 ${
      isDone
        ? 'border-yellow-500/40 bg-gradient-to-b from-yellow-950/30 to-gray-900/80 winner-glow'
        : 'border-white/10 bg-gray-900/60 hover:border-white/20'
    }`}>
      <TeamRow team={match.team1} isWinner={match.winner === match.team1} isTbd={!match.team1} />
      <div className="text-gray-600 text-xs text-center py-1 font-bold">VS</div>
      <TeamRow team={match.team2} isWinner={match.winner === match.team2} isTbd={!match.team2} />
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
    const channel = supabase.channel('bracket').on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => {
      supabase.from('matches').select('*').order('match_number').then(({ data }) => setMatches(data || []))
    }).subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-3 text-gray-400">
      <span className="text-3xl animate-spin">⚽</span> Loading bracket…
    </div>
  )

  const byRound = ROUND_ORDER.reduce((acc, r) => {
    acc[r] = matches.filter(m => m.round === r)
    return acc
  }, {})

  const played = matches.filter(m => m.winner).length

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-black tracking-tight mb-1">
          <span className="text-yellow-400">FIFA</span> World Cup 2026
        </h1>
        <p className="text-gray-400 text-sm">{played} of {matches.length} matches played</p>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="flex gap-6 items-start min-w-max px-2">
          {ROUND_ORDER.map(round => (
            byRound[round].length > 0 && (
              <div key={round} className="flex flex-col">
                <div className="text-center mb-3">
                  <span className="text-xs font-black uppercase tracking-widest text-yellow-400 bg-yellow-400/10 border border-yellow-400/30 px-3 py-1 rounded-full">
                    {ROUND_LABELS[round]}
                  </span>
                </div>
                <div className="flex flex-col gap-3">
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
