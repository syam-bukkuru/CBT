import { createContext, useCallback, useContext, useRef, useState } from 'react'
import ToastViewport from './components/ToastViewport.jsx'
import ConfirmDialog from './components/ConfirmDialog.jsx'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)
  const [confirmState, setConfirmState] = useState(null)

  const dismissToast = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  // type: 'success' | 'error' | 'info'
  const showToast = useCallback(
    (message, { type = 'info', duration = 4000 } = {}) => {
      const id = ++idRef.current
      setToasts((t) => [...t, { id, message, type }])
      if (duration > 0) setTimeout(() => dismissToast(id), duration)
      return id
    },
    [dismissToast],
  )

  // Promise-based replacement for window.confirm — resolves true/false.
  const confirm = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      setConfirmState({ message, resolve, ...options })
    })
  }, [])

  const resolveConfirm = (result) => {
    confirmState?.resolve(result)
    setConfirmState(null)
  }

  return (
    <ToastContext.Provider value={{ showToast, confirm }}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
      {confirmState && (
        <ConfirmDialog
          message={confirmState.message}
          title={confirmState.title}
          confirmLabel={confirmState.confirmLabel}
          danger={confirmState.danger}
          onConfirm={() => resolveConfirm(true)}
          onCancel={() => resolveConfirm(false)}
        />
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}
