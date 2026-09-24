import React, { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { QUOTES } from '../lib/quotes.js'

const ROTATE_MS = 6000
const FADE_MS = 300

export default function MotivationalQuote() {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * QUOTES.length))
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIndex((i) => (i + 1) % QUOTES.length)
        setVisible(true)
      }, FADE_MS)
    }, ROTATE_MS)
    return () => clearInterval(id)
  }, [])

  const q = QUOTES[index]

  return (
    <p
      className={`flex items-start gap-2 text-sm italic text-slate-300 transition-opacity ease-in-out ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ transitionDuration: `${FADE_MS}ms`, minHeight: '1.5rem' }}
    >
      <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
      <span>
        "{q.text}" <span className="text-slate-500 not-italic">— {q.author}</span>
      </span>
    </p>
  )
}
