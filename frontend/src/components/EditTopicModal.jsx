import React, { useState } from 'react'
import { X, Pencil } from 'lucide-react'

export default function EditTopicModal({ topic, onClose, onUpdate, existingNames = [] }) {
  const [name, setName] = useState(topic.name)
  const [description, setDescription] = useState(topic.description || '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return setError('Topic name is required.')
    if (
      trimmed.toLowerCase() !== topic.name.toLowerCase() &&
      existingNames.some((n) => n.toLowerCase() === trimmed.toLowerCase())
    ) {
      return setError('A topic with that name already exists in this subject.')
    }
    setSaving(true)
    setError('')
    try {
      await onUpdate(topic._id, { name: trimmed, description: description.trim() })
      onClose()
    } catch (err) {
      setError(err.message || 'Could not update the topic.')
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <Pencil className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-[var(--text-main)]">Edit Topic</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-main)] mb-1">Topic name</label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              placeholder="Short note about this topic"
              className="w-full px-3 py-2 text-sm bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-[var(--text-main)]"
            />
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
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
