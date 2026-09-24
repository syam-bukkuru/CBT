import React, { useMemo } from 'react'
import { History, ChevronRight, Clock, Trophy } from 'lucide-react'

function fmtTime(s) {
  const secs = Math.round(s || 0)
  const m = Math.floor(secs / 60)
  const sec = secs % 60
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`
}

function fmtDate(d) {
  return new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

// Groups every attempt (not just the latest/best) by test, so re-attempts on the same
// test can be compared side by side instead of only ever seeing the most recent score.
export default function HistoryScreen({ attempts, onOpenAttempt }) {
  const groups = useMemo(() => {
    const byTest = new Map()
    for (const a of attempts) {
      const key = a.testId
      if (!byTest.has(key)) {
        byTest.set(key, {
          testId: key,
          testTitle: a.testTitle,
          subjectName: a.subjectName,
          topicName: a.topicName,
          attempts: [],
        })
      }
      byTest.get(key).attempts.push(a)
    }
    const list = [...byTest.values()]
    for (const g of list) {
      g.attempts.sort((x, y) => new Date(y.submittedAt) - new Date(x.submittedAt))
      g.best = g.attempts.reduce((b, a) => (a.score > b.score ? a : b), g.attempts[0])
    }
    list.sort((a, b) => new Date(b.attempts[0].submittedAt) - new Date(a.attempts[0].submittedAt))
    return list
  }, [attempts])

  if (groups.length === 0) {
    return (
      <div className="card p-10 text-center space-y-2">
        <History className="w-10 h-10 mx-auto text-slate-400" />
        <h4 className="font-bold text-base text-[var(--text-main)]">No attempts yet</h4>
        <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
          Attempt a test from the dashboard — every attempt is kept here so you can compare your
          scores over time.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
        <History className="w-5 h-5 text-blue-600" /> My History
      </h2>

      {groups.map((g) => (
        <div key={g.testId} className="card p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="min-w-0">
              <div className="text-[11px] text-[var(--text-muted)] truncate">
                {g.subjectName} › {g.topicName}
              </div>
              <h4 className="font-bold text-sm text-[var(--text-main)] truncate">{g.testTitle}</h4>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 shrink-0">
              {g.attempts.length} attempt{g.attempts.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-1.5">
            {g.attempts.map((a) => (
              <button
                key={a._id}
                onClick={() => onOpenAttempt(a)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded border text-left transition-colors ${
                  a._id === g.best._id
                    ? 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
                    : 'border-[var(--border-color)] hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] min-w-0">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{fmtDate(a.submittedAt)}</span>
                  <span className="hidden sm:inline shrink-0">· {fmtTime(a.durationSeconds)}</span>
                </span>
                <span className="flex items-center gap-2 shrink-0">
                  {a._id === g.best._id && (
                    <span className="hidden sm:flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                      <Trophy className="w-3.5 h-3.5" /> Best
                    </span>
                  )}
                  <span className="font-semibold text-sm text-[var(--text-main)]">
                    {a.score} <span className="text-[var(--text-muted)] font-normal">/ {a.total}</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
