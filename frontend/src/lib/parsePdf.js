import * as pdfjsLib from 'pdfjs-dist'
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { parseQuestions } from './parseQuestions.js'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc

// Extract plain text from every page of a PDF File/Blob.
export async function extractPdfText(file) {
  const buf = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise
  const pages = []
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p)
    const content = await page.getTextContent()
    let lastY = null
    let line = ''
    const lines = []
    for (const item of content.items) {
      const y = item.transform?.[5]
      if (lastY !== null && Math.abs(y - lastY) > 2) {
        lines.push(line.trim())
        line = ''
      }
      line += item.str
      if (item.hasEOL) {
        lines.push(line.trim())
        line = ''
      }
      lastY = y
    }
    if (line.trim()) lines.push(line.trim())
    pages.push(lines.join('\n'))
  }
  return pages.join('\n\n')
}

// Full pipeline: PDF file -> extracted text -> structured questions.
export async function parsePdf(file) {
  const text = await extractPdfText(file)
  if (!text.trim()) {
    return {
      questions: [],
      text: '',
      warnings: [
        'No selectable text found in this PDF (it may be a scan/image). Try the Paste or CSV tab instead.',
      ],
    }
  }
  const { questions, warnings } = parseQuestions(text)
  return { questions, text, warnings }
}

export default parsePdf
