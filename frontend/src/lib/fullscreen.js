// Best-effort only: no fullscreenchange listener, no warning if the user exits mid-exam.
// Must be called synchronously inside a click handler — the Fullscreen API requires an
// active user-gesture context, which a call after `navigate()` can lose in some browsers.
export function requestExamFullscreen() {
  document.documentElement.requestFullscreen?.().catch(() => {})
}
