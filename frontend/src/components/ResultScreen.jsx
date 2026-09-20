import React from 'react'
import {
  RotateCcw,
  LayoutDashboard,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Trophy,
  Clock,
  BarChart3,
} from 'lucide-react'

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

function isCorrect(q, a) {
  if (!a) return false
  if (q.type === 'MSQ') {
    const got = [...(a.selectedIndices || [])].sort((x, y) => x - y)
    const want = [...(q.correctIndices || [])].sort((x, y) => x - y)
    return got.length > 0 && got.length === want.length && got.every((v, i) => v === want[i])
  }
  if (q.type === 'NAT') {
    return (
      a.numericValue !== null &&
      a.numericValue !== undefined &&
      Math.abs(a.numericValue - q.correctValue) <= (q.tolerance || 0)
    )
  }
  return a.selectedIndex !== null && a.selectedIndex !== undefined && a.selectedIndex === q.correctIndex
}

function isUnattempted(q, a) {
  if (!a) return true
  if (q.type === 'MSQ') return !a.selectedIndices || a.selectedIndices.length === 0
  if (q.type === 'NAT') return a.numericValue === null || a.numericValue === undefined
  return a.selectedIndex === null || a.selectedIndex === undefined
}

function fmtTime(s) {
  const secs = Math.round(s || 0)
  const m = Math.floor(secs / 60)
  const sec = secs % 60
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`
}

export default function ResultScreen({ test, attempt, onReattempt, onBackToDashboard, onViewLeaderboard }) {
  const answerFor = (i) => attempt.answers.find((a) => a.questionIndex === i)
  const pct = attempt.total > 0 ? Math.round((attempt.score / attempt.total) * 100) : 0

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Summary */}
      <div className="card p-6 md:p-8 bg-slate-900 text-white border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="inline-block px-3 py-1 bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded text-xs font-semibold mb-2">
              {test.subject?.name} › {test.topic?.name}
            </span>
            <h2 className="text-xl md:text-2xl font-bold">{test.title} — Result</h2>
            <p className="text-slate-400 text-xs mt-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Time taken: {fmtTime(attempt.durationSeconds)}
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold flex items-center gap-2">
              <Trophy className="w-7 h-7 text-amber-400" />
              {attempt.score}
              <span className="text-slate-500 text-2xl">/ {attempt.total}</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">{pct}% score</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-6">
          <div className="bg-slate-800/70 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-emerald-400">{attempt.correctCount}</div>
            <div className="text-[11px] text-slate-400">Correct</div>
          </div>
          <div className="bg-slate-800/70 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-red-400">{attempt.wrongCount}</div>
            <div className="text-[11px] text-slate-400">Wrong</div>
          </div>
          <div className="bg-slate-800/70 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-slate-300">{attempt.unattemptedCount}</div>
            <div className="text-[11px] text-slate-400">Unattempted</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-6">
          <button onClick={onReattempt} className="btn bg-blue-600 hover:bg-blue-500 text-white text-sm">
            <RotateCcw className="w-4 h-4" /> Re-attempt
          </button>
          {onViewLeaderboard && (
            <button
              onClick={onViewLeaderboard}
              className="btn bg-amber-600 hover:bg-amber-500 text-white text-sm"
            >
              <BarChart3 className="w-4 h-4" /> View Leaderboard
            </button>
          )}
          <button
            onClick={onBackToDashboard}
            className="btn bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm"
          >
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </button>
        </div>
      </div>

      {/* Per-question review */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-[var(--text-main)]">Answer Review</h3>
        {test.questions.map((q, i) => {
          const a = answerFor(i)
          const unattempted = isUnattempted(q, a)
          const correct = isCorrect(q, a)

          return (
            <div key={i} className="card p-5">
              <div className="flex items-start gap-2">
                <span className="mt-0.5">
                  {unattempted ? (
                    <MinusCircle className="w-5 h-5 text-slate-400" />
                  ) : correct ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="text-sm font-medium text-[var(--text-main)] whitespace-pre-wrap">
                      <span className="text-[var(--text-muted)]">
                        Q{i + 1}. <span className="font-semibold">[{q.type}]</span>{' '}
                      </span>
                      {q.text}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)] shrink-0">
                      <span>
                        +{q.marks} / −{q.negativeMarks}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {fmtTime(a?.timeSpentSeconds)}
                      </span>
                    </div>
                  </div>

                  {q.type === 'NAT' ? (
                    <div className="mt-3 grid grid-cols-2 gap-2 max-w-sm">
                      <div
                        className={`text-sm px-3 py-1.5 rounded border ${
                          unattempted
                            ? 'border-[var(--border-color)]'
                            : correct
                              ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30'
                              : 'border-red-400 bg-red-50 dark:bg-red-950/30'
                        }`}
                      >
                        <div className="text-[10px] text-[var(--text-muted)]">Your answer</div>
                        <div className="text-[var(--text-main)] font-medium">
                          {unattempted ? '—' : a.numericValue}
                        </div>
                      </div>
                      <div className="text-sm px-3 py-1.5 rounded border border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30">
                        <div className="text-[10px] text-[var(--text-muted)]">Correct answer</div>
                        <div className="text-[var(--text-main)] font-medium">
                          {q.correctValue}
                          {q.tolerance ? ` ± ${q.tolerance}` : ''}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 space-y-1.5">
                      {q.options.map((opt, oi) => {
                        const isAns =
                          q.type === 'MSQ' ? (q.correctIndices || []).includes(oi) : oi === q.correctIndex
                        const isPicked =
                          q.type === 'MSQ' ? (a?.selectedIndices || []).includes(oi) : oi === a?.selectedIndex
                        return (
                          <div
                            key={oi}
                            className={`text-sm px-3 py-1.5 rounded border flex items-center gap-2 ${
                              isAns
                                ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30'
                                : isPicked
                                  ? 'border-red-400 bg-red-50 dark:bg-red-950/30'
                                  : 'border-[var(--border-color)]'
                            }`}
                          >
                            <span className="font-semibold text-[var(--text-muted)]">{LETTERS[oi]}.</span>
                            <span className="text-[var(--text-main)]">{opt}</span>
                            {isAns && (
                              <span className="ml-auto text-[11px] font-semibold text-emerald-600">
                                Correct answer
                              </span>
                            )}
                            {isPicked && !isAns && (
                              <span className="ml-auto text-[11px] font-semibold text-red-600">Your answer</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {q.explanation && (
                    <p className="mt-3 text-xs text-[var(--text-muted)] bg-slate-50 dark:bg-slate-800/50 border border-[var(--border-color)] rounded px-3 py-2">
                      <strong className="text-[var(--text-main)]">Explanation: </strong>
                      {q.explanation}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
