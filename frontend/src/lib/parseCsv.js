import Papa from 'papaparse'

// Expected header columns (case-insensitive, flexible):
//   question, optionA, optionB, optionC, optionD, answer, explanation
// `answer` may be a letter (A-D) or a 1-based number (1-4).

function pick(row, ...names) {
  for (const n of names) {
    for (const key of Object.keys(row)) {
      if (key.trim().toLowerCase() === n) return row[key]
    }
  }
  return ''
}

function answerToIndex(token, optionCount) {
  if (token == null) return -1
  const t = String(token).trim()
  const letter = t.match(/[A-Ha-h]/)
  if (letter && t.length <= 2) {
    const idx = letter[0].toUpperCase().charCodeAt(0) - 65
    return idx < optionCount ? idx : -1
  }
  const n = parseInt(t, 10)
  if (Number.isInteger(n) && n >= 1 && n <= optionCount) return n - 1
  return -1
}

export function parseCsv(text) {
  const warnings = []
  const questions = []

  const result = Papa.parse(text.trim(), {
    header: true,
    skipEmptyLines: true,
  })

  if (result.errors?.length) {
    for (const e of result.errors.slice(0, 5)) {
      warnings.push(`CSV row ${e.row ?? '?'}: ${e.message}`)
    }
  }

  result.data.forEach((row, i) => {
    const questionText = String(pick(row, 'question', 'q', 'text') || '').trim()
    if (!questionText) return

    const options = [
      pick(row, 'optiona', 'option a', 'a', 'opt1', 'option1'),
      pick(row, 'optionb', 'option b', 'b', 'opt2', 'option2'),
      pick(row, 'optionc', 'option c', 'c', 'opt3', 'option3'),
      pick(row, 'optiond', 'option d', 'd', 'opt4', 'option4'),
      pick(row, 'optione', 'option e', 'e', 'opt5', 'option5'),
    ]
      .map((o) => String(o ?? '').trim())
      .filter((o) => o.length > 0)

    if (options.length < 2) {
      warnings.push(`Row ${i + 1}: skipped — fewer than 2 options.`)
      return
    }

    let correctIndex = answerToIndex(pick(row, 'answer', 'correct', 'ans', 'key'), options.length)
    if (correctIndex < 0) {
      warnings.push(`Row ${i + 1}: answer not recognised — defaulted to A.`)
      correctIndex = 0
    }

    questions.push({
      text: questionText,
      options,
      correctIndex,
      explanation: String(pick(row, 'explanation', 'exp', 'reason') || '').trim(),
    })
  })

  if (questions.length === 0 && warnings.length === 0) {
    warnings.push('No rows parsed. Expected columns: question, optionA, optionB, optionC, optionD, answer, explanation.')
  }
  return { questions, warnings }
}

export default parseCsv
