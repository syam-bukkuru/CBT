// Lenient parser for the bulk-paste / PDF-extracted question format.
//
// Recognised shape (blank line separates questions):
//
//   1. Question text (may wrap onto the next line)
//   A) option one
//   B) option two
//   C) option three
//   D) option four
//   Answer: B
//   Explanation: optional single line
//
// Question markers:  "1." | "1)" | "Q1." | "Q1)"
// Option markers:    "A)" | "A." | "(A)"  (letters A-H, upper/lower)
// Answer markers:    "Answer:" | "Ans:" | "Correct:"  -> letter or 1-based number
// Explanation:       "Explanation:" | "Exp:"

const Q_RE = /^\s*(?:Q|Question)?\s*(\d+)\s*[.)]\s*(.*)$/i
const OPT_RE = /^\s*\(?\s*([A-Ha-h])\s*[).]\s*(.+?)\s*\)?\s*$/
const ANS_RE = /^\s*(?:Answer|Ans|Correct)\s*[:-]\s*(.+?)\s*$/i
const EXP_RE = /^\s*(?:Explanation|Exp|Reason)\s*[:-]\s*(.+?)\s*$/i

function letterToIndex(token) {
  if (!token) return -1
  const t = token.trim()
  const m = t.match(/[A-Ha-h]/)
  if (m) return m[0].toUpperCase().charCodeAt(0) - 65
  const n = parseInt(t, 10)
  if (Number.isInteger(n) && n >= 1) return n - 1
  return -1
}

function finalize(current, questions, warnings) {
  if (!current || !current.text) return
  if (current.options.length < 2) {
    warnings.push(`Q${current.num}: skipped — needs at least 2 options (found ${current.options.length}).`)
    return
  }
  if (current.correctIndex < 0 || current.correctIndex >= current.options.length) {
    warnings.push(`Q${current.num}: no valid answer detected — defaulted to option A. Please set the correct answer.`)
    current.correctIndex = 0
  }
  questions.push({
    text: current.text.trim(),
    options: current.options.map((o) => o.trim()),
    correctIndex: current.correctIndex,
    explanation: (current.explanation || '').trim(),
  })
}

export function parseQuestions(rawText) {
  const warnings = []
  const questions = []
  if (!rawText || !rawText.trim()) return { questions, warnings: ['No text to parse.'] }

  const lines = rawText.replace(/\r\n?/g, '\n').split('\n')
  let current = null
  let lastField = null // 'question' | 'option' | 'answer' | 'explanation'

  for (const line of lines) {
    const trimmed = line.trim()

    if (trimmed === '') {
      lastField = null
      continue
    }

    const qm = trimmed.match(Q_RE)
    // Only treat as a new question if it also isn't an option line like "A) ..."
    if (qm && !OPT_RE.test(trimmed)) {
      finalize(current, questions, warnings)
      current = {
        num: qm[1],
        text: qm[2] || '',
        options: [],
        correctIndex: -1,
        explanation: '',
      }
      lastField = 'question'
      continue
    }

    if (!current) continue

    const om = trimmed.match(OPT_RE)
    if (om) {
      current.options.push(om[2])
      lastField = 'option'
      continue
    }

    const am = trimmed.match(ANS_RE)
    if (am) {
      current.correctIndex = letterToIndex(am[1])
      lastField = 'answer'
      continue
    }

    const em = trimmed.match(EXP_RE)
    if (em) {
      current.explanation = em[1]
      lastField = 'explanation'
      continue
    }

    // Continuation line — append to whatever we were last building.
    if (lastField === 'question') current.text += ' ' + trimmed
    else if (lastField === 'option' && current.options.length)
      current.options[current.options.length - 1] += ' ' + trimmed
    else if (lastField === 'explanation') current.explanation += ' ' + trimmed
  }

  finalize(current, questions, warnings)

  if (questions.length === 0 && warnings.length === 0) {
    warnings.push('Could not find any questions. Check the format guide.')
  }
  return { questions, warnings }
}

export default parseQuestions
