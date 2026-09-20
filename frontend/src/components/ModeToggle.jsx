import React from 'react'
import { GraduationCap, PencilRuler } from 'lucide-react'

export default function ModeToggle({ mode, onChange }) {
  return (
    <div className="flex items-center bg-slate-800/80 border border-slate-700 rounded-md p-0.5 text-xs font-medium">
      <button
        onClick={() => onChange('user')}
        title="User Mode — browse and attempt tests"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded transition-colors ${
          mode === 'user' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
        }`}
      >
        <GraduationCap className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">User Mode</span>
      </button>
      <button
        onClick={() => onChange('creation')}
        title="Creation Mode — create and manage subjects, topics and tests"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded transition-colors ${
          mode === 'creation' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
        }`}
      >
        <PencilRuler className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Creation Mode</span>
      </button>
    </div>
  )
}
