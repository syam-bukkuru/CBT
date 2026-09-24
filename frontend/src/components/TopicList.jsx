import React, { useState } from 'react'
import {
  FolderPlus,
  Layers,
  Plus,
  Trash2,
  Pencil,
  FileText,
  Clock,
  Play,
  ChevronDown,
  ChevronRight,
  User,
  Share2,
  Check,
} from 'lucide-react'
import NewTopicModal from './NewTopicModal.jsx'
import EditTopicModal from './EditTopicModal.jsx'
import { shareTest } from '../lib/share.js'

export default function TopicList({
  subject,
  topics,
  tests,
  user,
  appMode,
  initialExpandedTopicId = '',
  onCreateTopic,
  onUpdateTopic,
  onDeleteTopic,
  onCreateTest,
  onStartTest,
  onEditTest,
  onDeleteTest,
}) {
  const [showNewTopic, setShowNewTopic] = useState(false)
  const [editingTopic, setEditingTopic] = useState(null)
  const [expanded, setExpanded] = useState(
    () => new Set(initialExpandedTopicId ? [initialExpandedTopicId] : []),
  )
  const [sharedId, setSharedId] = useState(null)
  const canCreate = appMode === 'creation'

  const handleShare = async (test) => {
    const result = await shareTest(test).catch(() => 'unsupported')
    if (result === 'copied' || result === 'shared') {
      setSharedId(test._id)
      setTimeout(() => setSharedId((id) => (id === test._id ? null : id)), 1500)
    }
  }

  const toggle = (id) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const testsFor = (topicId) => tests.filter((t) => (t.topic?._id || t.topic) === topicId)
  const isOwnerOf = (doc) => (doc.createdBy?._id || doc.createdBy) === user?.id

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-[var(--text-muted)]">Subject</p>
          <h2 className="text-xl font-bold text-[var(--text-main)]">{subject?.name || 'Loading…'}</h2>
          {subject?.description && (
            <p className="text-xs text-[var(--text-muted)] mt-1">{subject.description}</p>
          )}
        </div>
        {canCreate && (
          <button onClick={() => setShowNewTopic(true)} className="btn btn-primary text-sm shrink-0">
            <FolderPlus className="w-4 h-4" /> New Topic
          </button>
        )}
      </div>

      {topics.length === 0 ? (
        <div className="card p-10 text-center space-y-3 border-dashed">
          <Layers className="w-10 h-10 mx-auto text-slate-400" />
          <h4 className="font-bold text-base text-[var(--text-main)]">No topics yet</h4>
          <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
            {canCreate ? (
              <>
                Create a topic (e.g. <strong>Normalization</strong>, <strong>ER Diagrams</strong>) to
                start publishing tests under this subject.
              </>
            ) : (
              'Switch to Creation Mode (top right) to add the first topic.'
            )}
          </p>
          {canCreate && (
            <button onClick={() => setShowNewTopic(true)} className="btn btn-primary text-xs mx-auto">
              <FolderPlus className="w-4 h-4" /> Create your first topic
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {topics.map((topic) => {
            const topicTests = testsFor(topic._id)
            const isOpen = expanded.has(topic._id)
            const ownsTopic = canCreate && isOwnerOf(topic)
            return (
              <div key={topic._id} className="card overflow-hidden">
                <button
                  onClick={() => toggle(topic._id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors text-left"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {isOpen ? (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-[var(--text-main)] truncate">{topic.name}</h4>
                      {topic.description && (
                        <p className="text-xs text-[var(--text-muted)] truncate">{topic.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    <span className="text-xs font-semibold px-2 sm:px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 whitespace-nowrap">
                      {topicTests.length}<span className="hidden sm:inline"> Tests</span>
                    </span>
                    {canCreate && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation()
                          onCreateTest(topic._id)
                        }}
                        className="btn btn-outline text-xs px-2 sm:px-2.5 py-1"
                        title="Create Test"
                      >
                        <Plus className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Create Test</span>
                      </span>
                    )}
                    {ownsTopic && (
                      <>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingTopic(topic)
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-500 transition-colors"
                          title="Edit topic"
                        >
                          <Pencil className="w-4 h-4" />
                        </span>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation()
                            onDeleteTopic(topic._id)
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                          title="Delete topic"
                        >
                          <Trash2 className="w-4 h-4" />
                        </span>
                      </>
                    )}
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-[var(--border-color)] p-4 space-y-2 bg-slate-50/50 dark:bg-slate-900/30">
                    {topicTests.length === 0 ? (
                      <p className="text-xs text-[var(--text-muted)] text-center py-4">
                        {canCreate ? (
                          <>
                            No tests yet in this topic.{' '}
                            <button
                              onClick={() => onCreateTest(topic._id)}
                              className="text-blue-600 font-semibold hover:underline"
                            >
                              Create the first one
                            </button>
                          </>
                        ) : (
                          'No tests yet in this topic.'
                        )}
                      </p>
                    ) : (
                      topicTests.map((test) => {
                        const ownsTest = canCreate && isOwnerOf(test)
                        return (
                          <div key={test._id} className="card p-3.5 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <h5 className="font-semibold text-sm text-[var(--text-main)] truncate">
                                {test.title}
                              </h5>
                              <div className="flex flex-wrap items-center gap-3 text-[11px] text-[var(--text-muted)] mt-0.5">
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
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => handleShare(test)}
                                className="p-1.5 text-slate-400 hover:text-blue-500 transition-colors"
                                title="Share test link"
                              >
                                {sharedId === test._id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Share2 className="w-3.5 h-3.5" />
                                )}
                              </button>
                              {ownsTest && (
                                <>
                                  <button
                                    onClick={() => onEditTest(test)}
                                    className="p-1.5 text-slate-400 hover:text-blue-500 transition-colors"
                                    title="Edit test"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => onDeleteTest(test._id)}
                                    className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                                    title="Delete test"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => onStartTest(test)}
                                className="btn btn-primary text-xs px-3 py-1.5"
                              >
                                <Play className="w-3.5 h-3.5 fill-current" /> Start Test
                              </button>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showNewTopic && (
        <NewTopicModal
          existingNames={topics.map((t) => t.name)}
          onClose={() => setShowNewTopic(false)}
          onCreate={onCreateTopic}
        />
      )}

      {editingTopic && (
        <EditTopicModal
          topic={editingTopic}
          existingNames={topics.map((t) => t.name)}
          onClose={() => setEditingTopic(null)}
          onUpdate={onUpdateTopic}
        />
      )}
    </div>
  )
}
