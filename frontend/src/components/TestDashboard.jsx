import React, { useState } from 'react'
import { Database, Cpu, BookOpen, FolderPlus, Trash2, Pencil, Folder } from 'lucide-react'
import NewSubjectModal from './NewSubjectModal.jsx'
import EditSubjectModal from './EditSubjectModal.jsx'
import TodaysTests from './TodaysTests.jsx'

export default function TestDashboard({
  subjects,
  tests,
  user,
  appMode,
  onOpenSubject,
  onStartTest,
  onCreateSubject,
  onUpdateSubject,
  onDeleteSubject,
}) {
  const [showNewSubject, setShowNewSubject] = useState(false)
  const [editingSubject, setEditingSubject] = useState(null)
  const canCreate = appMode === 'creation'

  const testCountFor = (subjectId) =>
    tests.filter((t) => (t.subject?._id || t.subject) === subjectId).length

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Hero banner */}
      <div className="card p-6 md:p-8 bg-slate-900 text-white relative overflow-hidden border-slate-800">
        <div className="relative z-10 space-y-3 max-w-3xl">
          <span className="inline-block px-3 py-1 bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded text-xs font-semibold">
            Collaborative Mock Test Portal
          </span>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            Study a topic, publish a test, compare results — together
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            Pick a subject folder to browse its topics and tests, or jump straight into whatever
            your group published today below.
          </p>
          {canCreate && (
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowNewSubject(true)}
                className="btn bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow"
              >
                <FolderPlus className="w-4 h-4" /> New Subject
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Today's Tests highlight — a study/attempt feature, not relevant while authoring */}
      {appMode !== 'creation' && <TodaysTests tests={tests} onStartTest={onStartTest} />}

      {/* Subjects grid */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2 text-[var(--text-main)]">
          <Folder className="w-5 h-5 text-blue-600" /> Subjects
        </h3>

        {subjects.length === 0 ? (
          <div className="card p-10 text-center space-y-3 border-dashed">
            <FolderPlus className="w-10 h-10 mx-auto text-slate-400" />
            <h4 className="font-bold text-base text-[var(--text-main)]">No subjects yet</h4>
            <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
              {canCreate ? (
                <>
                  Start by creating a subject folder (e.g. <strong>Database Management</strong>). Then
                  add topics like <strong>Normalization</strong> and tests inside them.
                </>
              ) : (
                'Switch to Creation Mode (top right) to add the first subject folder.'
              )}
            </p>
            {canCreate && (
              <button onClick={() => setShowNewSubject(true)} className="btn btn-primary text-xs mx-auto">
                <FolderPlus className="w-4 h-4" /> Create your first subject
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((sub) => {
              const isOwner = (sub.createdBy?._id || sub.createdBy) === user?.id
              return (
              <div
                key={sub._id}
                onClick={() => onOpenSubject(sub)}
                className="card p-5 cursor-pointer transition-all hover:shadow-md border-2 border-[var(--border-color)] hover:border-blue-400 group"
              >
                <div className="flex items-start justify-between">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl">
                    {sub.icon === 'Cpu' ? (
                      <Cpu className="w-6 h-6" />
                    ) : sub.icon === 'BookOpen' ? (
                      <BookOpen className="w-6 h-6" />
                    ) : (
                      <Database className="w-6 h-6" />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700">
                      {testCountFor(sub._id)} Tests
                    </span>
                    {canCreate && isOwner && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingSubject(sub)
                          }}
                          className="p-1 text-slate-400 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Edit subject folder"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onDeleteSubject(sub._id)
                          }}
                          className="p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete subject folder"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="mt-4 space-y-1">
                  <h4 className="font-bold text-base text-[var(--text-main)]">{sub.name}</h4>
                  <p className="text-xs text-[var(--text-muted)] line-clamp-2">{sub.description}</p>
                </div>
              </div>
              )
            })}
          </div>
        )}
      </div>

      {showNewSubject && (
        <NewSubjectModal
          existingNames={subjects.map((s) => s.name)}
          onClose={() => setShowNewSubject(false)}
          onCreate={onCreateSubject}
        />
      )}

      {editingSubject && (
        <EditSubjectModal
          subject={editingSubject}
          existingNames={subjects.map((s) => s.name)}
          onClose={() => setEditingSubject(null)}
          onUpdate={onUpdateSubject}
        />
      )}
    </div>
  )
}
