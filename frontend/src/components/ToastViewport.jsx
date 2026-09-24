import React from 'react'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'

const STYLE = {
  success: { icon: CheckCircle2, border: 'border-emerald-400', iconColor: 'text-emerald-500' },
  error: { icon: XCircle, border: 'border-red-400', iconColor: 'text-red-500' },
  info: { icon: Info, border: 'border-blue-400', iconColor: 'text-blue-500' },
}

export default function ToastViewport({ toasts, onDismiss }) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed z-[1100] bottom-4 inset-x-4 sm:inset-x-auto sm:right-4 sm:left-auto flex flex-col gap-2 items-stretch sm:items-end pointer-events-none">
      {toasts.map((t) => {
        const { icon: Icon, border, iconColor } = STYLE[t.type] || STYLE.info
        return (
          <div
            key={t.id}
            role="status"
            className={`card ${border} pointer-events-auto flex items-start gap-2.5 px-4 py-3 w-full sm:w-auto sm:min-w-[280px] sm:max-w-sm animate-[toast-in_0.2s_ease-out]`}
          >
            <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${iconColor}`} />
            <p className="text-sm text-[var(--text-main)] flex-1">{t.message}</p>
            <button
              onClick={() => onDismiss(t.id)}
              className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
