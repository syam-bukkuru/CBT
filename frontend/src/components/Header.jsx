import React from 'react'
import { Link } from 'react-router-dom'
import { Clock, LogOut, Moon, Sun, ArrowLeft, History } from 'lucide-react'
import ModeToggle from './ModeToggle.jsx'
import InstallAppPrompt from './InstallAppPrompt.jsx'

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
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {mode !== 'dashboard' && (
            <Link
              to="/"
              className="p-1.5 rounded-md hover:bg-slate-700 text-slate-300 hover:text-white transition-colors shrink-0"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
          )}

          <div className="hidden sm:block px-2.5 py-1 bg-blue-700 rounded text-white font-bold text-xs tracking-wider shrink-0">
            CBT
          </div>

          <div className="min-w-0">
            <h1 className="font-semibold text-sm sm:text-lg leading-tight text-slate-100 truncate">
              {mode === 'exam' ? testTitle : 'Computer-Based Test Portal'}
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-400 truncate">
              {mode === 'exam' ? `Subject: ${subject}` : 'Collaborative Mock Test & Practice System'}
            </p>
          </div>
        </div>

        {mode === 'exam' && (
          <div
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 rounded border font-mono font-bold text-sm sm:text-lg shrink-0 transition-all ${
              isTimeLow
                ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse'
                : 'bg-slate-800 border-slate-700 text-emerald-400'
            }`}
          >
            <Clock className={`w-4 h-4 shrink-0 ${isTimeLow ? 'text-red-400' : 'text-emerald-400'}`} />
            <span className="whitespace-nowrap">
              <span className="hidden sm:inline">Time Left: </span>
              {formatTime(timeLeftSeconds)}
            </span>
          </div>
        )}

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {mode !== 'exam' && <InstallAppPrompt />}

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
            <div className="flex items-center gap-1.5 sm:gap-2.5 pl-1.5 sm:px-3 sm:py-1 sm:bg-slate-800/90 rounded sm:border sm:border-slate-700">
              <div
                className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs shrink-0"
                title={user.name}
              >
                {initial}
              </div>
              <div className="hidden md:block text-xs text-left">
                <p className="font-medium text-slate-200">{user.name}</p>
                <p className="text-[11px] text-slate-400">{user.email}</p>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 sm:ml-1 sm:p-1 text-slate-400 hover:text-red-400 transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {mode === 'exam' && (
        <div className="bg-[var(--tcs-bar-bg)] border-t border-slate-700/60 px-3 sm:px-4 py-1.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 text-xs sm:text-sm">
            <div className="flex items-center gap-2 text-slate-300 min-w-0">
              <span className="font-semibold text-white shrink-0">Section:</span>
              <span className="px-2.5 py-0.5 bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded font-medium truncate">
                {subject || 'General'}
              </span>
            </div>
            <div className="hidden sm:block text-slate-300 text-xs shrink-0">
              Interface Pattern: <span className="text-emerald-400 font-semibold">GATE CBT Standard</span>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
