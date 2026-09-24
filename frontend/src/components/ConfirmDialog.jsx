import React from 'react'
import { AlertTriangle, X } from 'lucide-react'

// Promise-based replacement for window.confirm — see useToast().confirm().
export default function ConfirmDialog({ message, title, confirmLabel, danger, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {danger && <AlertTriangle className="w-5 h-5 text-red-500" />}
            <h3 className="text-lg font-bold text-[var(--text-main)]">{title || 'Are you sure?'}</h3>
          </div>
          <button onClick={onCancel} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-[var(--text-muted)] mb-5">{message}</p>

        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="btn btn-outline text-sm">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`btn text-sm text-white ${danger ? 'bg-red-600 hover:bg-red-500' : 'btn-primary'}`}
          >
            {confirmLabel || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}
