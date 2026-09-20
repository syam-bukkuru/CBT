import React from 'react'
import { Trash2, X, Plus } from 'lucide-react'

// Number('') is 0 (finite) — an untouched NAT field must not silently count as "answer: 0".
export function parseNat(v) {
  if (v === '' || v === null || v === undefined) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']
const TYPES = [
  { key: 'MCQ', label: 'MCQ · single correct' },
  { key: 'MSQ', label: 'MSQ · multi correct' },
  { key: 'NAT', label: 'NAT · numeric' },
]

// Type-aware single-question editor: MCQ (radio), MSQ (checkboxes), NAT (value + tolerance).
// Shared by both the Manual and Import tabs of the test-creation wizard.
export default function QuestionRow({ index, row, onChange, onRemove }) {
  const update = (patch) => onChange({ ...row, ...patch })

  const updateOption = (oi, val) =>
    update({ options: row.options.map((o, k) => (k === oi ? val : o)) })

  const addOption = () => {
    if (row.options.length < 6) update({ options: [...row.options, ''] })
  }

  const removeOption = (oi) => {
    if (row.options.length <= 2) return
    const options = row.options.filter((_, k) => k !== oi)
    let correctIndex = row.correctIndex
    if (oi === correctIndex) correctIndex = 0
    else if (correctIndex != null && oi < correctIndex) correctIndex -= 1
    const correctIndices = (row.correctIndices || [])
      .filter((i) => i !== oi)
      .map((i) => (i > oi ? i - 1 : i))
    update({ options, correctIndex, correctIndices })
  }

  const toggleMsqCorrect = (oi) => {
    const set = new Set(row.correctIndices || [])
    if (set.has(oi)) set.delete(oi)
    else set.add(oi)
    update({ correctIndices: [...set].sort((a, b) => a - b) })
  }

  const changeType = (type) => {
    if (type === 'NAT') {
      update({ type, options: [], correctIndex: null, correctIndices: [] })
    } else if (row.type === 'NAT') {
      update({ type, options: ['', '', '', ''], correctIndex: 0, correctIndices: [] })
    } else {
      update({ type, correctIndex: 0, correctIndices: [] })
    }
  }

  const isComplete =
    row.type === 'NAT'
      ? Boolean(row.text.trim()) && parseNat(row.correctValue) !== null
      : Boolean(row.text.trim()) &&
        row.options.map((o) => o.trim()).filter(Boolean).length >= 2 &&
        (row.type !== 'MSQ' || (row.correctIndices || []).length > 0)

  return (
    <div className={`card p-3 border ${isComplete ? 'border-[var(--border-color)]' : 'border-amber-400'}`}>
      <div className="flex items-start gap-2">
        <span className="text-xs font-bold text-[var(--text-muted)] mt-2">{index + 1}.</span>
        <div className="flex-1 space-y-2 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={row.type}
              onChange={(e) => changeType(e.target.value)}
              className="px-2 py-1 text-xs bg-[var(--card-bg)] border border-[var(--border-color)] rounded text-[var(--text-main)]"
            >
              {TYPES.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-1.5 ml-auto text-[11px]">
              <label className="text-[var(--text-muted)]">Marks</label>
              <input
                type="number"
                step="0.5"
                value={row.marks}
                onChange={(e) => update({ marks: e.target.value })}
                className="w-14 px-1.5 py-1 bg-[var(--card-bg)] border border-[var(--border-color)] rounded text-[var(--text-main)]"
              />
              <label className="text-[var(--text-muted)]">Neg</label>
              <input
                type="number"
                step="0.25"
                min="0"
                value={row.negativeMarks}
                onChange={(e) => update({ negativeMarks: e.target.value })}
                className="w-14 px-1.5 py-1 bg-[var(--card-bg)] border border-[var(--border-color)] rounded text-[var(--text-main)]"
              />
            </div>
          </div>

          <textarea
            value={row.text}
            onChange={(e) => update({ text: e.target.value })}
            rows={2}
            placeholder="Question text"
            className="w-full px-2 py-1.5 text-sm bg-[var(--card-bg)] border border-[var(--border-color)] rounded text-[var(--text-main)]"
          />

          {row.type === 'NAT' ? (
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">
                  Correct value
                </label>
                <input
                  type="number"
                  step="any"
                  value={row.correctValue ?? ''}
                  onChange={(e) => update({ correctValue: e.target.value })}
                  className="w-28 px-2 py-1 text-sm bg-[var(--card-bg)] border border-[var(--border-color)] rounded text-[var(--text-main)]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">
                  Tolerance (±)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={row.tolerance ?? 0}
                  onChange={(e) => update({ tolerance: e.target.value })}
                  className="w-28 px-2 py-1 text-sm bg-[var(--card-bg)] border border-[var(--border-color)] rounded text-[var(--text-main)]"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <p className="text-[11px] text-[var(--text-muted)]">
                Tick <strong>Correct</strong> next to the right option{row.type === 'MSQ' ? '(s)' : ''}.
              </p>
              {row.options.map((opt, oi) => {
                const isCorrect =
                  row.type === 'MSQ' ? (row.correctIndices || []).includes(oi) : row.correctIndex === oi
                return (
                  <div
                    key={oi}
                    className={`flex items-center gap-2 rounded px-1.5 py-1 ${
                      isCorrect ? 'bg-emerald-50 dark:bg-emerald-950/30' : ''
                    }`}
                  >
                    <label
                      className={`flex items-center gap-1 shrink-0 cursor-pointer text-[11px] font-semibold ${
                        isCorrect ? 'text-emerald-600' : 'text-[var(--text-muted)]'
                      }`}
                    >
                      <input
                        type={row.type === 'MSQ' ? 'checkbox' : 'radio'}
                        name={`correct-${index}`}
                        checked={isCorrect}
                        onChange={() => (row.type === 'MSQ' ? toggleMsqCorrect(oi) : update({ correctIndex: oi }))}
                      />
                      Correct
                    </label>
                    <span className="text-xs font-semibold text-[var(--text-muted)] w-4">{LETTERS[oi]}</span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => updateOption(oi, e.target.value)}
                      placeholder={`Option ${LETTERS[oi]}`}
                      className="flex-1 px-2 py-1 text-sm bg-[var(--card-bg)] border border-[var(--border-color)] rounded text-[var(--text-main)]"
                    />
                    {row.options.length > 2 && (
                      <button
                        onClick={() => removeOption(oi)}
                        className="p-0.5 text-slate-400 hover:text-red-500"
                        title="Remove option"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )
              })}
              {row.options.length < 6 && (
                <button
                  onClick={addOption}
                  className="text-[11px] font-semibold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> option
                </button>
              )}
            </div>
          )}

          <input
            type="text"
            value={row.explanation}
            onChange={(e) => update({ explanation: e.target.value })}
            placeholder="Explanation (optional)"
            className="w-full px-2 py-1 text-xs bg-[var(--card-bg)] border border-[var(--border-color)] rounded text-[var(--text-main)]"
          />
        </div>
        <button onClick={onRemove} className="p-1 text-slate-400 hover:text-red-500 mt-1" title="Delete question">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
