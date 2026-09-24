import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Bookmark, ChevronLeft, ChevronRight, Eraser, Send, X } from 'lucide-react'

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

// status -> palette css class (defined in index.css)
const STATUS_CLASS = {
  'not-visited': 'status-not-visited',
  'not-answered': 'status-not-answered',
  answered: 'status-answered',
  marked: 'status-marked',
  'answered-marked': 'status-ans-marked',
}

function initialAnswers(n) {
  return Array.from({ length: n }, () => ({
    selectedIndex: null,
    selectedIndices: [],
    numericValue: null,
    status: 'not-visited',
    timeSpentSeconds: 0,
  }))
}

function hasValue(type, a) {
  if (type === 'MSQ') return (a.selectedIndices || []).length > 0
  if (type === 'NAT') return a.numericValue !== null && a.numericValue !== undefined
  return a.selectedIndex !== null && a.selectedIndex !== undefined
}

export default function ExamScreen({ test, onSubmit, onTick }) {
  const total = test.questions.length
  const [answers, setAnswers] = useState(() => initialAnswers(total))
  const [current, setCurrent] = useState(0)
  const [timeLeft, setTimeLeft] = useState(test.timeLimitMinutes * 60)
  const [showConfirm, setShowConfirm] = useState(false)
  const submittedRef = useRef(false)

  // Per-question time tracking: how long the current question has been on screen.
  const enteredAtRef = useRef(Date.now())

  const doSubmit = useCallback(() => {
    if (submittedRef.current) return
    submittedRef.current = true
    const elapsedNow = Math.round((Date.now() - enteredAtRef.current) / 1000)
    const durationSeconds = test.timeLimitMinutes * 60 - timeLeft
    onSubmit({
      testId: test._id,
      durationSeconds,
      answers: answers.map((a, i) => {
        const q = test.questions[i]
        let status = a.status
        if (status === 'not-visited') status = hasValue(q.type, a) ? 'answered' : 'not-answered'
        return {
          questionIndex: i,
          selectedIndex: a.selectedIndex,
          selectedIndices: a.selectedIndices,
          numericValue: a.numericValue,
          status,
          timeSpentSeconds: (a.timeSpentSeconds || 0) + (i === current ? elapsedNow : 0),
        }
      }),
    })
  }, [answers, current, onSubmit, test._id, test.questions, test.timeLimitMinutes, timeLeft])

  // countdown
  useEffect(() => {
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(id)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    onTick?.(timeLeft)
    if (timeLeft === 0) doSubmit()
  }, [timeLeft, onTick, doSubmit])

  // mark a freshly-seen question as visited (=> "not answered" once left)
  const visit = (idx) =>
    setAnswers((prev) =>
      prev.map((a, i) =>
        i === idx && a.status === 'not-visited' && !hasValue(test.questions[i].type, a)
          ? { ...a, status: 'not-answered' }
          : a,
      ),
    )

  // flush accumulated time for the question being left, whenever `current` changes
  useEffect(() => {
    visit(current)
    const leavingIndex = current
    enteredAtRef.current = Date.now()
    return () => {
      const elapsed = Math.round((Date.now() - enteredAtRef.current) / 1000)
      if (elapsed > 0) {
        setAnswers((prev) =>
          prev.map((a, i) =>
            i === leavingIndex ? { ...a, timeSpentSeconds: (a.timeSpentSeconds || 0) + elapsed } : a,
          ),
        )
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current])

  const goTo = (idx) => {
    if (idx < 0 || idx >= total) return
    setCurrent(idx)
  }

  const isMarked = (s) => s === 'marked' || s === 'answered-marked'

  const selectMcq = (oi) =>
    setAnswers((prev) =>
      prev.map((a, i) => {
        if (i !== current) return a
        return { ...a, selectedIndex: oi, status: isMarked(a.status) ? 'answered-marked' : 'answered' }
      }),
    )

  const toggleMsq = (oi) =>
    setAnswers((prev) =>
      prev.map((a, i) => {
        if (i !== current) return a
        const set = new Set(a.selectedIndices || [])
        if (set.has(oi)) set.delete(oi)
        else set.add(oi)
        const selectedIndices = [...set].sort((x, y) => x - y)
        const answered = selectedIndices.length > 0
        return {
          ...a,
          selectedIndices,
          status: isMarked(a.status) ? (answered ? 'answered-marked' : 'marked') : answered ? 'answered' : 'not-answered',
        }
      }),
    )

  const setNat = (raw) =>
    setAnswers((prev) =>
      prev.map((a, i) => {
        if (i !== current) return a
        const numericValue = raw === '' ? null : Number(raw)
        const answered = numericValue !== null && Number.isFinite(numericValue)
        return {
          ...a,
          numericValue: answered ? numericValue : null,
          status: isMarked(a.status) ? (answered ? 'answered-marked' : 'marked') : answered ? 'answered' : 'not-answered',
        }
      }),
    )

  const clearResponse = () =>
    setAnswers((prev) =>
      prev.map((a, i) => {
        if (i !== current) return a
        return {
          ...a,
          selectedIndex: null,
          selectedIndices: [],
          numericValue: null,
          status: isMarked(a.status) ? 'marked' : 'not-answered',
        }
      }),
    )

  const saveAndNext = () => {
    setAnswers((prev) =>
      prev.map((a, i) => {
        if (i !== current) return a
        const marked = isMarked(a.status)
        const answered = hasValue(test.questions[i].type, a)
        return {
          ...a,
          status: marked ? (answered ? 'answered-marked' : 'marked') : answered ? 'answered' : 'not-answered',
        }
      }),
    )
    goTo(current + 1)
  }

  const markForReviewAndNext = () => {
    setAnswers((prev) =>
      prev.map((a, i) => {
        if (i !== current) return a
        return { ...a, status: hasValue(test.questions[i].type, a) ? 'answered-marked' : 'marked' }
      }),
    )
    goTo(current + 1)
  }

  const counts = useMemo(() => {
    const c = { answered: 0, notAnswered: 0, marked: 0, notVisited: 0 }
    answers.forEach((a, i) => {
      const s =
        i === current && a.status === 'not-visited' && !hasValue(test.questions[i].type, a)
          ? 'not-answered'
          : a.status
      if (s === 'answered') c.answered++
      else if (s === 'answered-marked') {
        c.answered++
        c.marked++
      } else if (s === 'marked') c.marked++
      else if (s === 'not-visited') c.notVisited++
      else c.notAnswered++
    })
    return c
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, current])

  const q = test.questions[current]
  const a = answers[current]

  const fmt = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] lg:grid-cols-[1fr_320px] gap-4 md:gap-6">
        {/* Question pane */}
        <div className="card p-6 flex flex-col">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3 mb-4">
            <h3 className="font-bold text-[var(--text-main)]">
              Question {current + 1}{' '}
              <span className="text-[var(--text-muted)] font-normal">/ {total}</span>
              <span className="ml-2 text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                {q.type}
              </span>
            </h3>
            <div className="text-xs text-[var(--text-muted)]">
              +{q.marks} &nbsp; / &nbsp; −{q.negativeMarks}
            </div>
          </div>

          <p className="text-[var(--text-main)] leading-relaxed whitespace-pre-wrap mb-5">{q.text}</p>

          <div className="space-y-2.5 flex-1">
            {q.type === 'NAT' ? (
              <div className="max-w-xs">
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                  Enter your numeric answer
                </label>
                <input
                  type="number"
                  step="any"
                  value={a.numericValue ?? ''}
                  onChange={(e) => setNat(e.target.value)}
                  placeholder="e.g. 4.25"
                  className="w-full px-3 py-2.5 text-sm bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-[var(--text-main)]"
                />
              </div>
            ) : (
              q.options.map((opt, oi) => {
                const checked = q.type === 'MSQ' ? (a.selectedIndices || []).includes(oi) : a.selectedIndex === oi
                return (
                  <label
                    key={oi}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      checked
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30'
                        : 'border-[var(--border-color)] hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <input
                      type={q.type === 'MSQ' ? 'checkbox' : 'radio'}
                      name={`q-${current}`}
                      checked={checked}
                      onChange={() => (q.type === 'MSQ' ? toggleMsq(oi) : selectMcq(oi))}
                      className="mt-1"
                    />
                    <span className="text-sm font-semibold text-[var(--text-muted)]">{LETTERS[oi]}.</span>
                    <span className="text-sm text-[var(--text-main)]">{opt}</span>
                  </label>
                )
              })
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-6 pt-4 border-t border-[var(--border-color)]">
            <div className="flex flex-wrap gap-2">
              <button onClick={markForReviewAndNext} className="btn btn-purple text-xs">
                <Bookmark className="w-3.5 h-3.5" /> Mark for Review &amp; Next
              </button>
              <button onClick={clearResponse} className="btn btn-outline text-xs">
                <Eraser className="w-3.5 h-3.5" /> Clear Response
              </button>
            </div>
            <div className="hidden sm:block flex-1" />
            <div className="flex gap-2 justify-between sm:justify-end">
              <button onClick={() => goTo(current - 1)} disabled={current === 0} className="btn btn-outline text-xs">
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </button>
              <button onClick={saveAndNext} className="btn btn-success text-xs">
                Save &amp; Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Palette pane */}
        <div className="card p-5 h-max md:sticky md:top-4">
          <div className="mb-3 text-center">
            <div className="text-xs text-[var(--text-muted)]">Time Remaining</div>
            <div
              className={`text-2xl font-mono font-bold ${
                timeLeft <= 300 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {fmt(timeLeft)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[11px] text-[var(--text-muted)] mb-4">
            <span>
              <b className="text-emerald-600">{counts.answered}</b> Answered
            </span>
            <span>
              <b className="text-red-600">{counts.notAnswered}</b> Not Answered
            </span>
            <span>
              <b className="text-purple-600">{counts.marked}</b> Marked
            </span>
            <span>
              <b>{counts.notVisited}</b> Not Visited
            </span>
          </div>

          <div className="grid grid-cols-6 gap-1.5 max-h-[38vh] overflow-y-auto">
            {answers.map((ans, i) => {
              const s =
                i === current && ans.status === 'not-visited' && !hasValue(test.questions[i].type, ans)
                  ? 'not-answered'
                  : ans.status
              return (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`palette-btn ${STATUS_CLASS[s]} ${i === current ? 'active' : ''}`}
                >
                  {i + 1}
                </button>
              )
            })}
          </div>

          <button onClick={() => setShowConfirm(true)} className="btn btn-primary w-full mt-5 text-sm">
            <Send className="w-4 h-4" /> Submit Test
          </button>
        </div>
      </div>

      {showConfirm && (
        <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="modal-content" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-bold text-[var(--text-main)]">Submit test?</h3>
              <button onClick={() => setShowConfirm(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm mb-4">
              <div className="card p-3 text-center">
                <div className="text-xl font-bold text-emerald-600">{counts.answered}</div>
                <div className="text-[11px] text-[var(--text-muted)]">Answered</div>
              </div>
              <div className="card p-3 text-center">
                <div className="text-xl font-bold text-red-600">{counts.notAnswered + counts.notVisited}</div>
                <div className="text-[11px] text-[var(--text-muted)]">Unanswered</div>
              </div>
            </div>
            <p className="text-xs text-[var(--text-muted)] mb-4">
              {counts.marked > 0 && `${counts.marked} question(s) are marked for review. `}
              You can re-attempt this test any number of times afterwards.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowConfirm(false)} className="btn btn-outline text-sm">
                Keep working
              </button>
              <button onClick={doSubmit} className="btn btn-primary text-sm">
                Submit now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
