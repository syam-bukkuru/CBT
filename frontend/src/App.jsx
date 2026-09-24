import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Header from './components/Header.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import LoginScreen from './components/LoginScreen.jsx'
import RegisterScreen from './components/RegisterScreen.jsx'
import TestDashboard from './components/TestDashboard.jsx'
import TopicList from './components/TopicList.jsx'
import TestWizard from './components/TestWizard.jsx'
import ExamScreen from './components/ExamScreen.jsx'
import ResultScreen from './components/ResultScreen.jsx'
import LeaderboardScreen from './components/LeaderboardScreen.jsx'
import HistoryScreen from './components/HistoryScreen.jsx'
import {
  TopicListSkeleton,
  ExamSkeleton,
  ResultSkeleton,
  LeaderboardSkeleton,
  HistorySkeleton,
  FormSkeleton,
} from './components/Skeletons.jsx'
import { useAuth } from './AuthContext.jsx'
import { useToast } from './ToastContext.jsx'
import { requestExamFullscreen } from './lib/fullscreen.js'
import * as api from './api.js'

const EXAM_PATH_RE = /^\/tests\/[^/]+\/exam$/

// Lets the exam page push its title/subject/live-timer up into the always-mounted Header,
// without lifting exam state into App itself.
const HeaderMetaContext = createContext(() => {})
const useSetHeaderMeta = () => useContext(HeaderMetaContext)

// Lets any nested page read/toggle User vs Creation mode without prop-drilling through
// the Routes tree — same "lift a setter into context" pattern as HeaderMetaContext above.
const AppModeContext = createContext({ appMode: 'user', setAppMode: () => {} })
const useAppMode = () => useContext(AppModeContext)

function useDarkMode() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('cbt-theme') === 'dark')
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
    localStorage.setItem('cbt-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])
  return [darkMode, setDarkMode]
}

function useAppModeState() {
  const [appMode, setAppMode] = useState(() => localStorage.getItem('cbt-mode') || 'user')
  useEffect(() => {
    localStorage.setItem('cbt-mode', appMode)
  }, [appMode])
  return [appMode, setAppMode]
}

function Loading({ label }) {
  return <div className="max-w-3xl mx-auto px-4 py-16 text-center text-sm text-[var(--text-muted)]">{label}</div>
}

function ErrorNote({ message }) {
  return (
    <div className="max-w-3xl mx-auto px-4 pt-6">
      <div className="card p-3 border-red-300 bg-red-50 dark:bg-red-950/30 text-sm text-red-700 dark:text-red-300">
        {message}
      </div>
    </div>
  )
}

function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { appMode } = useAppMode()
  const { confirm, showToast } = useToast()
  const [subjects, setSubjects] = useState([])
  const [tests, setTests] = useState([])
  const [loadError, setLoadError] = useState('')
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const [s, t] = await Promise.all([api.getSubjects(), api.getTests()])
      setSubjects(s)
      setTests(t)
      setLoadError('')
    } catch (err) {
      setLoadError(err.message || 'Could not reach the server. Is it running on port 5000?')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const handleCreateSubject = async (payload) => {
    await api.createSubject(payload)
    await refresh()
    showToast('Subject created.', { type: 'success' })
  }
  const handleUpdateSubject = async (id, payload) => {
    await api.updateSubject(id, payload)
    await refresh()
    showToast('Subject updated.', { type: 'success' })
  }
  const handleDeleteSubject = async (id) => {
    const ok = await confirm('Delete this subject folder and everything inside it (topics, tests, attempts)?', {
      title: 'Delete subject?',
      confirmLabel: 'Delete',
      danger: true,
    })
    if (!ok) return
    try {
      await api.deleteSubject(id)
      await refresh()
      showToast('Subject deleted.', { type: 'success' })
    } catch (err) {
      showToast(err.message || 'Could not delete the subject.', { type: 'error' })
    }
  }

  return (
    <>
      {loadError && <ErrorNote message={loadError} />}
      <TestDashboard
        subjects={subjects}
        tests={tests}
        user={user}
        appMode={appMode}
        loading={loading}
        onOpenSubject={(s) => navigate(`/subjects/${s._id}`)}
        onStartTest={(test) => {
          requestExamFullscreen()
          navigate(`/tests/${test._id}/exam`)
        }}
        onCreateSubject={handleCreateSubject}
        onUpdateSubject={handleUpdateSubject}
        onDeleteSubject={handleDeleteSubject}
      />
    </>
  )
}

function TopicListPage() {
  const { subjectId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { appMode } = useAppMode()
  const { confirm, showToast } = useToast()
  const [subject, setSubject] = useState(null)
  const [topics, setTopics] = useState([])
  const [tests, setTests] = useState([])
  const [loadError, setLoadError] = useState('')
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const [subjects, topicList, testList] = await Promise.all([
        api.getSubjects(),
        api.getTopics(subjectId),
        api.getTests({ subject: subjectId }),
      ])
      setSubject(subjects.find((s) => s._id === subjectId) || null)
      setTopics(topicList)
      setTests(testList)
      setLoadError('')
    } catch (err) {
      setLoadError(err.message || 'Could not reach the server.')
    } finally {
      setLoading(false)
    }
  }, [subjectId])

  useEffect(() => {
    refresh()
  }, [refresh])

  const handleCreateTopic = async (payload) => {
    await api.createTopic({ ...payload, subject: subjectId })
    await refresh()
    showToast('Topic created.', { type: 'success' })
  }
  const handleUpdateTopic = async (id, payload) => {
    await api.updateTopic(id, payload)
    await refresh()
    showToast('Topic updated.', { type: 'success' })
  }
  const handleDeleteTopic = async (id) => {
    const ok = await confirm('Delete this topic and all of its tests?', {
      title: 'Delete topic?',
      confirmLabel: 'Delete',
      danger: true,
    })
    if (!ok) return
    try {
      await api.deleteTopic(id)
      await refresh()
      showToast('Topic deleted.', { type: 'success' })
    } catch (err) {
      showToast(err.message || 'Could not delete the topic.', { type: 'error' })
    }
  }
  const handleUpdateTest = async (id, payload) => {
    await api.updateTest(id, payload)
    await refresh()
    showToast('Test updated.', { type: 'success' })
  }
  const handleDeleteTest = async (id) => {
    const ok = await confirm('Delete this test and its attempt history?', {
      title: 'Delete test?',
      confirmLabel: 'Delete',
      danger: true,
    })
    if (!ok) return
    try {
      await api.deleteTest(id)
      await refresh()
      showToast('Test deleted.', { type: 'success' })
    } catch (err) {
      showToast(err.message || 'Could not delete the test.', { type: 'error' })
    }
  }

  if (loading) return <TopicListSkeleton />

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {loadError && (
        <div className="card p-3 mb-4 border-red-300 bg-red-50 dark:bg-red-950/30 text-sm text-red-700 dark:text-red-300">
          {loadError}
        </div>
      )}
      <TopicList
        subject={subject}
        topics={topics}
        tests={tests}
        user={user}
        appMode={appMode}
        initialExpandedTopicId={searchParams.get('topic') || ''}
        onCreateTopic={handleCreateTopic}
        onUpdateTopic={handleUpdateTopic}
        onDeleteTopic={handleDeleteTopic}
        onCreateTest={(topicId) => navigate(`/tests/new?subjectId=${subjectId}&topicId=${topicId}`)}
        onStartTest={(test) => {
          requestExamFullscreen()
          navigate(`/tests/${test._id}/exam`)
        }}
        onEditTest={(test) => navigate(`/tests/${test._id}/edit`)}
        onUpdateTest={handleUpdateTest}
        onDeleteTest={handleDeleteTest}
      />
    </div>
  )
}

function TestWizardPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const subjectId = params.get('subjectId') || ''
  const topicId = params.get('topicId') || ''

  const handlePublish = async (payload) => {
    const test = await api.createTest(payload)
    navigate(`/subjects/${test.subject?._id || payload.subject}`)
  }

  return (
    <TestWizard
      initialSubjectId={subjectId}
      initialTopicId={topicId}
      onCancel={() => navigate(-1)}
      onPublish={handlePublish}
    />
  )
}

function TestEditPage() {
  const { testId } = useParams()
  const navigate = useNavigate()
  const [test, setTest] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getTest(testId).then(setTest).catch((err) => setError(err.message || 'Could not load this test.'))
  }, [testId])

  const handleUpdate = async (payload) => {
    await api.updateTest(testId, payload)
    navigate(`/subjects/${test.subject?._id}`)
  }

  if (error) return <Loading label={error} />
  if (!test) return <FormSkeleton />

  return <TestWizard existingTest={test} onCancel={() => navigate(-1)} onUpdate={handleUpdate} />
}

function ExamPage() {
  const { testId } = useParams()
  const navigate = useNavigate()
  const setHeaderMeta = useSetHeaderMeta()
  const { showToast } = useToast()
  const [test, setTest] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    api
      .getTest(testId)
      .then((t) => {
        if (cancelled) return
        setTest(t)
        setHeaderMeta((m) => ({ ...m, testTitle: t.title, subject: t.subject?.name || '' }))
      })
      .catch((err) => setError(err.message || 'Could not load this test.'))
    return () => {
      cancelled = true
    }
  }, [testId, setHeaderMeta])

  const handleTick = useCallback(
    (seconds) => setHeaderMeta((m) => ({ ...m, timeLeftSeconds: seconds })),
    [setHeaderMeta],
  )

  // Must stay referentially stable — ExamScreen's doSubmit callback (and the timer-tick
  // effect that calls onTick every second) depends on this identity. A fresh function
  // here on every render made that effect re-fire every render, which called
  // setHeaderMeta every render, which re-rendered this page — an unbounded loop that hit
  // React's "Maximum update depth exceeded" limit and froze the exam page.
  const handleSubmit = useCallback(
    async (payload) => {
      try {
        const attempt = await api.createAttempt(payload)
        navigate(`/tests/${testId}/result/${attempt._id}`, { replace: true })
      } catch (err) {
        showToast(`Could not save the attempt: ${err.message}`, { type: 'error', duration: 8000 })
        navigate('/')
      }
    },
    [testId, navigate, showToast],
  )

  if (error) return <Loading label={error} />
  if (!test) return <ExamSkeleton />

  return <ExamScreen test={test} onSubmit={handleSubmit} onTick={handleTick} />
}

function ResultPage() {
  const { testId, attemptId } = useParams()
  const navigate = useNavigate()
  const [test, setTest] = useState(null)
  const [attempt, setAttempt] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([api.getTest(testId), api.getAttempt(attemptId)])
      .then(([t, a]) => {
        setTest(t)
        setAttempt(a)
      })
      .catch((err) => setError(err.message || 'Could not load this result.'))
  }, [testId, attemptId])

  if (error) return <Loading label={error} />
  if (!test || !attempt) return <ResultSkeleton />

  return (
    <ResultScreen
      test={test}
      attempt={attempt}
      onReattempt={() => navigate(`/tests/${testId}/exam`)}
      onBackToDashboard={() => navigate('/')}
      onViewLeaderboard={() => navigate(`/tests/${testId}/leaderboard`)}
    />
  )
}

function HistoryPage() {
  const navigate = useNavigate()
  const [attempts, setAttempts] = useState([])
  const [loadError, setLoadError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .getAttempts({ mine: true })
      .then(setAttempts)
      .catch((err) => setLoadError(err.message || 'Could not load your history.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <HistorySkeleton />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {loadError && <ErrorNote message={loadError} />}
      <HistoryScreen
        attempts={attempts}
        onOpenAttempt={(a) => navigate(`/tests/${a.testId}/result/${a._id}`)}
      />
    </div>
  )
}

function LeaderboardPage() {
  const { testId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [test, setTest] = useState(null)
  const [rows, setRows] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([api.getTest(testId), api.getLeaderboard(testId)])
      .then(([t, lb]) => {
        setTest(t)
        setRows(lb)
      })
      .catch((err) => setError(err.message || 'Could not load the leaderboard.'))
  }, [testId])

  if (error) return <Loading label={error} />
  if (!test) return <LeaderboardSkeleton />

  return (
    <LeaderboardScreen
      test={test}
      rows={rows}
      currentUserId={user?.id}
      onBackToDashboard={() => navigate('/')}
      onReattempt={() => {
        requestExamFullscreen()
        navigate(`/tests/${testId}/exam`)
      }}
    />
  )
}

export default function App() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [darkMode, setDarkMode] = useDarkMode()
  const [appMode, setAppMode] = useAppModeState()
  const [examMeta, setExamMeta] = useState({ testTitle: '', subject: '', timeLeftSeconds: null })

  // Stale exam title/timer shouldn't linger once the learner leaves the exam route.
  useEffect(() => {
    if (!EXAM_PATH_RE.test(location.pathname)) {
      setExamMeta({ testTitle: '', subject: '', timeLeftSeconds: null })
    }
  }, [location.pathname])

  const isExam = EXAM_PATH_RE.test(location.pathname)
  const isDashboard = location.pathname === '/'
  const mode = isExam ? 'exam' : isDashboard ? 'dashboard' : 'other'
  const showHeader = location.pathname !== '/login' && location.pathname !== '/register'

  return (
    <AppModeContext.Provider value={{ appMode, setAppMode }}>
    <HeaderMetaContext.Provider value={setExamMeta}>
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
        {showHeader && (
          <Header
            mode={mode}
            testTitle={examMeta.testTitle}
            subject={examMeta.subject}
            timeLeftSeconds={examMeta.timeLeftSeconds}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            user={user}
            onLogout={logout}
            appMode={appMode}
            setAppMode={setAppMode}
          />
        )}

        <Routes>
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/register" element={<RegisterScreen />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subjects/:subjectId"
            element={
              <ProtectedRoute>
                <TopicListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tests/new"
            element={
              <ProtectedRoute>
                <TestWizardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tests/:testId/edit"
            element={
              <ProtectedRoute>
                <TestEditPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tests/:testId/exam"
            element={
              <ProtectedRoute>
                <ExamPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tests/:testId/result/:attemptId"
            element={
              <ProtectedRoute>
                <ResultPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tests/:testId/leaderboard"
            element={
              <ProtectedRoute>
                <LeaderboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <HistoryPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </HeaderMetaContext.Provider>
    </AppModeContext.Provider>
  )
}
