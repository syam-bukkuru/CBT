import React from 'react'
import { Link } from 'react-router-dom'
import { Clock, LogOut, Moon, Sun, ArrowLeft, History } from 'lucide-react'
import ModeToggle from './ModeToggle.jsx'

export default function Header({
  mode, // 'dashboard' | 'exam' | 'other'
  testTitle,
  subject,
  timeLeftSeconds,
  darkMode,
  setDarkMode,
  user,
  onLogout,
  appMode,
  setAppMode,
}) {
  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return '--:--'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const isTimeLow = timeLeftSeconds !== null && timeLeftSeconds !== undefined && timeLeftSeconds <= 300

  const initial = (user?.name || '?').trim().charAt(0).toUpperCase()

  return (
    <header className="w-full bg-[var(--tcs-header-bg)] text-white shadow-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {mode !== 'dashboard' && (
            <Link
              to="/"
              className="p-1.5 rounded-md hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
          )}

          <div className="flex items-center gap-2.5">
            <div className="px-2.5 py-1 bg-blue-700 rounded text-white font-bold text-xs tracking-wider">
              CBT PORTAL
            </div>
            <div>
              <h1 className="font-semibold text-base sm:text-lg leading-tight text-slate-100">
                {mode === 'exam' ? testTitle : 'Computer-Based Test Portal'}
              </h1>
              <p className="text-xs text-slate-400">
                {mode === 'exam' ? `Subject: ${subject}` : 'Collaborative Mock Test & Practice System'}
              </p>
            </div>
          </div>
        </div>

        {mode === 'exam' && (
          <div
            className={`flex items-center gap-2 px-4 py-1.5 rounded border font-mono font-bold text-base sm:text-lg transition-all ${
              isTimeLow
                ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse'
                : 'bg-slate-800 border-slate-700 text-emerald-400'
            }`}
          >
            <Clock className={`w-4 h-4 ${isTimeLow ? 'text-red-400' : 'text-emerald-400'}`} />
            <span>Time Left: {formatTime(timeLeftSeconds)}</span>
          </div>
        )}

        <div className="flex items-center gap-3">
          {mode !== 'exam' && appMode === 'user' && (
            <Link
              to="/history"
              className="p-2 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              title="My History"
            >
              <History className="w-4 h-4" />
            </Link>
          )}

          {mode !== 'exam' && setAppMode && <ModeToggle mode={appMode} onChange={setAppMode} />}

          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            title="Toggle Dark Mode"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
          </button>

          {user && (
            <div className="hidden md:flex items-center gap-2.5 px-3 py-1 bg-slate-800/90 rounded border border-slate-700">
              <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                {initial}
              </div>
              <div className="text-xs text-left">
                <p className="font-medium text-slate-200">{user.name}</p>
                <p className="text-[11px] text-slate-400">{user.email}</p>
              </div>
              <button
                onClick={onLogout}
                className="ml-1 p-1 text-slate-400 hover:text-red-400 transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {mode === 'exam' && (
        <div className="bg-[var(--tcs-bar-bg)] border-t border-slate-700/60 px-4 py-1.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="font-semibold text-white">Section:</span>
              <span className="px-2.5 py-0.5 bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded font-medium">
                {subject || 'General'}
              </span>
            </div>
            <div className="text-slate-300 text-xs">
              Interface Pattern: <span className="text-emerald-400 font-semibold">GATE CBT Standard</span>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
