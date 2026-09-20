import React from 'react'
import { Sparkles, Clock, FileText, User, Play } from 'lucide-react'

function isToday(dateStr) {
  const d = new Date(dateStr)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

export default function TodaysTests({ tests, onStartTest }) {
  const todays = tests.filter((t) => isToday(t.createdAt))
  if (todays.length === 0) return null

  return (
    <div className="rounded-xl border-2 border-amber-400/60 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-slate-900 p-5 md:p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-amber-500" />
        <h3 className="text-lg font-bold text-[var(--text-main)]">Today's Tests</h3>
        <span className="text-xs font-semibold px-2 py-0.5 bg-amber-500 text-white rounded-full">
          {todays.length} new
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {todays.map((test) => (
          <div
            key={test._id}
            className="card p-4 border-amber-300 dark:border-amber-800 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded font-medium">
                  {test.subject?.name}
                </span>
                <span>›</span>
                <span>{test.topic?.name}</span>
              </div>
              <h4 className="font-bold text-sm text-[var(--text-main)] leading-snug">{test.title}</h4>
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-[var(--text-muted)]">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" /> {test.createdBy?.name || 'Unknown'}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {test.timeLimitMinutes}m
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3" /> {test.questions.length}q
                </span>
              </div>
            </div>
            <button onClick={() => onStartTest(test)} className="btn btn-primary text-xs mt-3 w-full">
              <Play className="w-3.5 h-3.5 fill-current" /> Start Test
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
