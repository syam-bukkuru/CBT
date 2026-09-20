import React from 'react'
import { Trophy, Medal, Clock, LayoutDashboard } from 'lucide-react'

function fmtTime(s) {
  const secs = Math.round(s || 0)
  const m = Math.floor(secs / 60)
  const sec = secs % 60
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`
}

const RANK_STYLE = {
  1: 'bg-amber-400 text-amber-950',
  2: 'bg-slate-300 text-slate-800',
  3: 'bg-amber-700 text-amber-50',
}

export default function LeaderboardScreen({ test, rows, currentUserId, onBackToDashboard }) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="card p-6 bg-slate-900 text-white border-slate-800">
        <span className="inline-block px-3 py-1 bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded text-xs font-semibold mb-2">
          {test.subject?.name} › {test.topic?.name}
        </span>
        <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          <Trophy className="w-6 h-6 text-amber-400" /> {test.title} — Leaderboard
        </h2>
        <p className="text-slate-400 text-xs mt-1">Ranked by each person's best attempt (score, then time).</p>
      </div>

      {rows.length === 0 ? (
        <div className="card p-10 text-center text-sm text-[var(--text-muted)]">
          No one has attempted this test yet.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-color)] text-left text-xs text-[var(--text-muted)]">
                <th className="px-4 py-3 font-semibold">Rank</th>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold text-right">Score</th>
                <th className="px-4 py-3 font-semibold text-right">Time</th>
                <th className="px-4 py-3 font-semibold text-right">Attempts</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isMe = row.userId === currentUserId
                return (
                  <tr
                    key={row.userId}
                    className={`border-b border-[var(--border-color)] last:border-0 ${
                      isMe ? 'bg-blue-50/60 dark:bg-blue-950/30' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                          RANK_STYLE[row.rank] || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {row.rank <= 3 ? <Medal className="w-3.5 h-3.5" /> : row.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-[var(--text-main)]">
                      {row.name} {isMe && <span className="text-[11px] text-blue-600 font-semibold">(you)</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-[var(--text-main)]">
                      {row.score} <span className="text-[var(--text-muted)] font-normal">/ {row.total}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-[var(--text-muted)]">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {fmtTime(row.durationSeconds)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-[var(--text-muted)]">{row.attemptsCount}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <button onClick={onBackToDashboard} className="btn btn-outline text-sm">
        <LayoutDashboard className="w-4 h-4" /> Back to Dashboard
      </button>
    </div>
  )
}
