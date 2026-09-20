import React, { useEffect, useMemo, useState } from 'react'
import {
  ClipboardPaste,
  FileSpreadsheet,
  FileText,
  Plus,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Rocket,
  Lock,
  Save,
} from 'lucide-react'
import * as api from '../api.js'
import QuestionRow, { parseNat } from './QuestionRow.jsx'
import { parseQuestions } from '../lib/parseQuestions.js'
import { parseCsv } from '../lib/parseCsv.js'
import { parsePdf } from '../lib/parsePdf.js'

const PASTE_SAMPLE = `1. What does ACID stand for in databases?
A) Atomicity, Consistency, Isolation, Durability
B) Accuracy, Completeness, Integrity, Durability
C) Atomicity, Concurrency, Isolation, Dependency
D) None of the above
Answer: A
Explanation: ACID guarantees reliable transaction processing.`

const STEPS = ['Subject & Topic', 'Questions', 'Duration & Publish']

function blankRow(type = 'MCQ') {
  if (type === 'NAT') {
    return {
      type: 'NAT',
      text: '',
      options: [],
      correctIndex: null,
      correctIndices: [],
      correctValue: '',
      tolerance: 0,
      marks: 1,
      negativeMarks: 0,
      explanation: '',
    }
  }
  return {
    type,
    text: '',
    options: ['', '', '', ''],
    correctIndex: 0,
    correctIndices: [],
    correctValue: null,
    tolerance: 0,
    marks: 1,
    negativeMarks: 0,
    explanation: '',
  }
}

// Step 1: subject + topic (select or create inline)
// Step 2: questions — Manual (MCQ/MSQ/NAT builder) + Import (Paste/CSV/PDF, always MCQ)
// Step 3: duration + publish
//
// Edit mode (existingTest passed in): subject/topic are fixed, so step 1 is skipped;
// once a test has an attempt, its questions are locked read-only (title/duration stay
// editable) so past scores/leaderboard rows can't be invalidated by a later edit.
export default function TestWizard({
  initialSubjectId = '',
  initialTopicId = '',
  existingTest = null,
  onCancel,
  onPublish,
  onUpdate,
}) {
  const isEdit = Boolean(existingTest)
  const questionsLocked = isEdit && existingTest.hasAttempts
  const firstStep = isEdit ? 2 : 1
  const [step, setStep] = useState(firstStep)

  // step 1 — subject & topic
  const [subjects, setSubjects] = useState([])
  const [topics, setTopics] = useState([])
  const [subjectId, setSubjectId] = useState(initialSubjectId)
  const [newSubjectName, setNewSubjectName] = useState('')
  const [topicId, setTopicId] = useState(initialTopicId)
  const [newTopicName, setNewTopicName] = useState('')

  useEffect(() => {
    api.getSubjects().then(setSubjects).catch(() => {})
  }, [])

  useEffect(() => {
    if (subjectId && subjectId !== '__new__') {
      api.getTopics(subjectId).then(setTopics).catch(() => {})
    } else {
      setTopics([])
    }
  }, [subjectId])

  const usingNewSubject = subjectId === '__new__'
  const usingNewTopic = topicId === '__new__'

  // step 2 — questions
  const [questionTab, setQuestionTab] = useState('manual')
  const [importTab, setImportTab] = useState('paste')
  const [rows, setRows] = useState([])
  const [pasteText, setPasteText] = useState('')
  const [csvText, setCsvText] = useState('')
  const [pdfBusy, setPdfBusy] = useState(false)
  const [warnings, setWarnings] = useState([])

  // step 3 — duration
  const [title, setTitle] = useState(existingTest?.title || '')
  const [timeLimitMinutes, setTimeLimit] = useState(existingTest?.timeLimitMinutes || 30)

  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!existingTest) return
    setRows(
      existingTest.questions.map((q) => ({
        type: q.type,
        text: q.text,
        options: q.type === 'NAT' ? [] : [...q.options],
        correctIndex: q.correctIndex,
        correctIndices: [...(q.correctIndices || [])],
        correctValue: q.correctValue,
        tolerance: q.tolerance || 0,
        marks: q.marks,
        negativeMarks: q.negativeMarks,
        explanation: q.explanation || '',
      })),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingTest])

  const applyParsed = ({ questions, warnings: w }) => {
    setRows((r) => [
      ...r,
      ...questions.map((q) => ({
        type: 'MCQ',
        text: q.text,
        options: [...q.options],
        correctIndex: q.correctIndex,
        correctIndices: [],
        correctValue: null,
        tolerance: 0,
        marks: 1,
        negativeMarks: 0,
        explanation: q.explanation || '',
      })),
    ])
    setWarnings(w || [])
  }

  const handleParsePaste = () => applyParsed(parseQuestions(pasteText))
  const handleParseCsv = () => applyParsed(parseCsv(csvText))
  const handlePdfFile = async (file) => {
    if (!file) return
    setPdfBusy(true)
    try {
      const { questions, warnings: w } = await parsePdf(file)
      applyParsed({ questions, warnings: w })
    } catch (err) {
      setWarnings([err.message || 'Failed to read PDF.'])
    } finally {
      setPdfBusy(false)
    }
  }

  const updateRow = (i, next) => setRows((r) => r.map((row, idx) => (idx === i ? next : row)))
  const removeRow = (i) => setRows((r) => r.filter((_, idx) => idx !== i))
  const addRow = (type) => setRows((r) => [...r, blankRow(type)])

  const validRows = useMemo(
    () =>
      rows.filter((r) => {
        if (!r.text.trim()) return false
        if (r.type === 'NAT') return parseNat(r.correctValue) !== null
        const optCount = r.options.map((o) => o.trim()).filter(Boolean).length
        if (optCount < 2) return false
        if (r.type === 'MSQ') return (r.correctIndices || []).length > 0
        return true
      }),
    [rows],
  )

  const goNext = () => {
    setError('')
    if (step === 1) {
      const subjOk = usingNewSubject ? newSubjectName.trim() : subjectId
      const topicOk = usingNewTopic ? newTopicName.trim() : topicId
      if (!subjOk) return setError('Choose or name a subject.')
      if (!topicOk) return setError('Choose or name a topic.')
    }
    if (step === 2 && validRows.length === 0) {
      return setError('Add at least one complete question.')
    }
    setStep((s) => Math.min(3, s + 1))
  }
  const goBack = () => setStep((s) => Math.max(firstStep, s - 1))

  const mapRowsToQuestions = (rowsToMap) =>
    rowsToMap.map((r) => ({
      type: r.type,
      text: r.text.trim(),
      options: r.type === 'NAT' ? [] : r.options.map((o) => o.trim()).filter(Boolean),
      correctIndex: r.type === 'MCQ' ? r.correctIndex : null,
      correctIndices: r.type === 'MSQ' ? r.correctIndices : [],
      correctValue: r.type === 'NAT' ? parseNat(r.correctValue) : null,
      tolerance: r.type === 'NAT' ? Number(r.tolerance) || 0 : 0,
      marks: Number(r.marks) || 1,
      negativeMarks: Number(r.negativeMarks) || 0,
      explanation: (r.explanation || '').trim(),
    }))

  const handlePublish = async () => {
    setError('')
    if (!title.trim()) return setError('Enter a test title.')
    if (validRows.length === 0) return setError('Add at least one complete question.')

    setSaving(true)
    try {
      let finalSubjectId = subjectId
      if (usingNewSubject) {
        const created = await api.createSubject({ name: newSubjectName.trim() })
        finalSubjectId = created._id
      }
      let finalTopicId = topicId
      if (usingNewTopic) {
        const created = await api.createTopic({ subject: finalSubjectId, name: newTopicName.trim() })
        finalTopicId = created._id
      }

      await onPublish({
        subject: finalSubjectId,
        topic: finalTopicId,
        title: title.trim(),
        timeLimitMinutes: Number(timeLimitMinutes) || 30,
        questions: mapRowsToQuestions(validRows),
      })
    } catch (err) {
      setError(err.message || 'Could not publish the test.')
      setSaving(false)
    }
  }

  const handleUpdate = async () => {
    setError('')
    if (!title.trim()) return setError('Enter a test title.')
    if (!questionsLocked && validRows.length === 0) return setError('Add at least one complete question.')

    setSaving(true)
    try {
      const payload = { title: title.trim(), timeLimitMinutes: Number(timeLimitMinutes) || 30 }
      if (!questionsLocked) payload.questions = mapRowsToQuestions(validRows)
      await onUpdate(payload)
    } catch (err) {
      setError(err.message || 'Could not save changes.')
      setSaving(false)
    }
  }

  const visibleSteps = isEdit
    ? STEPS.slice(1).map((label, i) => ({ label, n: i + 2 }))
    : STEPS.map((label, i) => ({ label, n: i + 1 }))

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[var(--text-main)]">{isEdit ? 'Edit Test' : 'Create Test'}</h2>
        <div className="flex items-center gap-2 mt-3">
          {visibleSteps.map(({ label, n }) => {
            const active = step === n
            const done = step > n
            const displayLabel = isEdit && n === 3 ? 'Duration & Save' : label
            return (
              <div key={label} className="flex items-center gap-2 flex-1">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    done
                      ? 'bg-emerald-600 text-white'
                      : active
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {n}
                </div>
                <span className={`text-xs font-medium ${active ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'}`}>
                  {displayLabel}
                </span>
                {n < STEPS.length && <div className="flex-1 h-px bg-[var(--border-color)]" />}
              </div>
            )
          })}
        </div>
      </div>

      <div className="card p-6 space-y-4">
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-main)] mb-1">Subject</label>
              <select
                value={subjectId}
                onChange={(e) => {
                  setSubjectId(e.target.value)
                  setTopicId('')
                }}
                className="w-full px-3 py-2 text-sm bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg text-[var(--text-main)]"
              >
                <option value="">— choose a subject —</option>
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
                <option value="__new__">+ New subject…</option>
              </select>
              {usingNewSubject && (
                <input
                  type="text"
                  autoFocus
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder="New subject name"
                  className="mt-2 w-full px-3 py-2 text-sm bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg text-[var(--text-main)]"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-main)] mb-1">Topic</label>
              <select
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
                disabled={!subjectId}
                className="w-full px-3 py-2 text-sm bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg text-[var(--text-main)] disabled:opacity-50"
              >
                <option value="">— choose a topic —</option>
                {topics.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}
                  </option>
                ))}
                <option value="__new__">+ New topic…</option>
              </select>
              {usingNewTopic && (
                <input
                  type="text"
                  autoFocus
                  value={newTopicName}
                  onChange={(e) => setNewTopicName(e.target.value)}
                  placeholder="New topic name (e.g. Normalization)"
                  className="mt-2 w-full px-3 py-2 text-sm bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg text-[var(--text-main)]"
                />
              )}
            </div>
          </div>
        )}

        {step === 2 && questionsLocked && (
          <div className="space-y-4">
            <div className="flex items-start gap-2 text-xs bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded px-3 py-2 text-amber-700 dark:text-amber-400">
              <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>
                This test already has attempts, so its questions are locked to protect scoring
                history and the leaderboard. You can still edit the title and duration.
              </span>
            </div>
            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
              {rows.map((row, i) => (
                <div key={i} className="card p-3 text-sm">
                  <div className="flex items-center justify-between gap-2 text-[11px] text-[var(--text-muted)] mb-1">
                    <span className="font-semibold">
                      Q{i + 1} · {row.type}
                    </span>
                    <span>
                      +{row.marks} / −{row.negativeMarks}
                    </span>
                  </div>
                  <p className="text-[var(--text-main)]">{row.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && !questionsLocked && (
          <div className="space-y-4">
            <div className="flex gap-1 border-b border-[var(--border-color)]">
              {['manual', 'import'].map((key) => (
                <button
                  key={key}
                  onClick={() => setQuestionTab(key)}
                  className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px capitalize transition-colors ${
                    questionTab === key
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>

            {questionTab === 'manual' && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-[var(--text-muted)] mr-1">Add a question:</span>
                <button onClick={() => addRow('MCQ')} className="btn btn-outline text-xs">
                  <Plus className="w-3.5 h-3.5" /> MCQ
                </button>
                <button onClick={() => addRow('MSQ')} className="btn btn-outline text-xs">
                  <Plus className="w-3.5 h-3.5" /> MSQ
                </button>
                <button onClick={() => addRow('NAT')} className="btn btn-outline text-xs">
                  <Plus className="w-3.5 h-3.5" /> NAT
                </button>
              </div>
            )}

            {questionTab === 'import' && (
              <div className="space-y-3">
                <div className="flex gap-1">
                  {[
                    { key: 'paste', label: 'Paste', Icon: ClipboardPaste },
                    { key: 'csv', label: 'CSV', Icon: FileSpreadsheet },
                    { key: 'pdf', label: 'PDF', Icon: FileText },
                  ].map(({ key, label, Icon }) => (
                    <button
                      key={key}
                      onClick={() => setImportTab(key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border ${
                        importTab === key
                          ? 'border-blue-600 text-blue-600 bg-blue-50 dark:bg-blue-950/30'
                          : 'border-[var(--border-color)] text-[var(--text-muted)]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" /> {label}
                    </button>
                  ))}
                </div>

                {importTab === 'paste' && (
                  <div className="space-y-2">
                    <textarea
                      value={pasteText}
                      onChange={(e) => setPasteText(e.target.value)}
                      rows={6}
                      placeholder={PASTE_SAMPLE}
                      className="w-full px-3 py-2 text-sm font-mono bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg text-[var(--text-main)]"
                    />
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setPasteText(PASTE_SAMPLE)} className="btn btn-outline text-xs">
                        Insert sample
                      </button>
                      <button onClick={handleParsePaste} className="btn btn-primary text-xs">
                        Parse &amp; add
                      </button>
                    </div>
                  </div>
                )}

                {importTab === 'csv' && (
                  <div className="space-y-2">
                    <textarea
                      value={csvText}
                      onChange={(e) => setCsvText(e.target.value)}
                      rows={6}
                      placeholder={'question,optionA,optionB,optionC,optionD,answer,explanation'}
                      className="w-full px-3 py-2 text-sm font-mono bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg text-[var(--text-main)]"
                    />
                    <div className="flex items-center justify-between">
                      <label className="btn btn-outline text-xs cursor-pointer">
                        Upload .csv
                        <input
                          type="file"
                          accept=".csv,text/csv"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0]
                            if (f) f.text().then(setCsvText)
                          }}
                        />
                      </label>
                      <button onClick={handleParseCsv} className="btn btn-primary text-xs">
                        Parse &amp; add
                      </button>
                    </div>
                  </div>
                )}

                {importTab === 'pdf' && (
                  <label className="flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-[var(--border-color)] rounded-lg cursor-pointer hover:border-blue-400">
                    {pdfBusy ? (
                      <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                    ) : (
                      <FileText className="w-6 h-6 text-blue-600" />
                    )}
                    <span className="text-sm text-[var(--text-main)] font-medium">
                      {pdfBusy ? 'Reading PDF…' : 'Click to choose a PDF'}
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)]">Text-based PDFs only.</span>
                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      className="hidden"
                      onChange={(e) => handlePdfFile(e.target.files?.[0])}
                    />
                  </label>
                )}

                {warnings.length > 0 && (
                  <div className="text-xs bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded px-3 py-2 space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-400">
                      <AlertTriangle className="w-3.5 h-3.5" /> {warnings.length} note(s) while parsing
                    </div>
                    <ul className="list-disc list-inside text-amber-700/90 dark:text-amber-400/90">
                      {warnings.slice(0, 8).map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="text-[11px] text-[var(--text-muted)]">
                  Imported questions are added as MCQs below — build MSQ/NAT questions manually.
                </p>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold text-[var(--text-main)]">
                  Questions
                  <span className="ml-2 text-xs font-normal text-[var(--text-muted)]">
                    {validRows.length} ready
                    {rows.length !== validRows.length ? ` · ${rows.length - validRows.length} incomplete` : ''}
                  </span>
                </h4>
              </div>

              {rows.length === 0 ? (
                <div className="text-center text-xs text-[var(--text-muted)] py-8 border border-dashed border-[var(--border-color)] rounded-lg">
                  Add a question manually, or import from Paste/CSV/PDF above.
                </div>
              ) : (
                <div className="space-y-3 max-h-[42vh] overflow-y-auto pr-1">
                  {rows.map((row, i) => (
                    <QuestionRow
                      key={i}
                      index={i}
                      row={row}
                      onChange={(next) => updateRow(i, next)}
                      onRemove={() => removeRow(i)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-main)] mb-1">Test title</label>
              <input
                type="text"
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. DBMS - Normalization"
                className="w-full px-3 py-2 text-sm bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg text-[var(--text-main)]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-main)] mb-1">Duration (minutes)</label>
              <input
                type="number"
                min="1"
                value={timeLimitMinutes}
                onChange={(e) => setTimeLimit(e.target.value)}
                className="w-40 px-3 py-2 text-sm bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg text-[var(--text-main)]"
              />
            </div>
            <div className="card p-4 bg-slate-50 dark:bg-slate-900/40 text-xs text-[var(--text-muted)] space-y-1">
              <p>
                <strong className="text-[var(--text-main)]">{validRows.length}</strong> question(s)
                {questionsLocked ? ' (locked).' : isEdit ? ' will be saved.' : ' will be published.'}
              </p>
              <p>
                Total marks:{' '}
                <strong className="text-[var(--text-main)]">
                  {validRows.reduce((s, r) => s + (Number(r.marks) || 0), 0)}
                </strong>
              </p>
            </div>
          </div>
        )}

        {error && (
          <p className="text-xs text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-[var(--border-color)]">
          <button onClick={step === firstStep ? onCancel : goBack} className="btn btn-outline text-sm">
            <ChevronLeft className="w-4 h-4" /> {step === firstStep ? 'Cancel' : 'Back'}
          </button>
          {step < 3 ? (
            <button onClick={goNext} className="btn btn-primary text-sm">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : isEdit ? (
            <button onClick={handleUpdate} disabled={saving} className="btn bg-blue-600 hover:bg-blue-500 text-white text-sm">
              <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save Changes'}
            </button>
          ) : (
            <button onClick={handlePublish} disabled={saving} className="btn bg-emerald-600 hover:bg-emerald-500 text-white text-sm">
              <Rocket className="w-4 h-4" /> {saving ? 'Publishing…' : 'Publish Test'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
