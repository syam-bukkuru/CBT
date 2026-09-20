import React, { useState } from 'react'
import { X, Database, Cpu, BookOpen, FolderPlus } from 'lucide-react'

const ICONS = [
  { key: 'Database', label: 'Database', Icon: Database },
  { key: 'Cpu', label: 'Core / Tech', Icon: Cpu },
  { key: 'BookOpen', label: 'General', Icon: BookOpen },
]

export default function NewSubjectModal({ onClose, onCreate, existingNames = [] }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('Database')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return setError('Folder name is required.')
    if (existingNames.some((n) => n.toLowerCase() === trimmed.toLowerCase())) {
      return setError('A subject folder with that name already exists.')
    }
    setSaving(true)
    setError('')
    try {
      await onCreate({ name: trimmed, description: description.trim(), icon })
      onClose()
    } catch (err) {
      setError(err.message || 'Could not create the subject.')
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-[var(--text-main)]">New Subject Folder</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-[var(--text-muted)] mb-4">
          Create a modular folder (e.g. <strong>Database Management</strong>, <strong>Operating Systems</strong>).
          You then add tests like <strong>Database 1</strong>, <strong>Database 2</strong> inside it.
        </p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-main)] mb-1">
              Folder name
            </label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Database Management"
              className="w-full px-3 py-2 text-sm bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-[var(--text-main)]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-main)] mb-1">
              Description <span className="font-normal text-[var(--text-muted)]">(optional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short note about this subject"
              className="w-full px-3 py-2 text-sm bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-[var(--text-main)]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-main)] mb-1">Icon</label>
            <div className="flex gap-2">
              {ICONS.map(({ key, label, Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setIcon(key)}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-lg border-2 transition-all ${
                    icon === key
                      ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/20'
                      : 'border-[var(--border-color)] hover:border-blue-400'
                  }`}
                >
                  <Icon className="w-5 h-5 text-blue-600" />
                  <span className="text-[11px] text-[var(--text-muted)]">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn btn-outline text-sm">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary text-sm">
              {saving ? 'Creating…' : 'Create Folder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
