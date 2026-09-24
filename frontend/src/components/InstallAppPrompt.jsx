import React, { useState, useEffect } from 'react'
import { Download, Smartphone, X, Share, PlusSquare } from 'lucide-react'

export default function InstallAppPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showIOSPrompt, setShowIOSPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check if already running in standalone mode (already installed as PWA)
    const inStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone ||
      document.referrer.includes('android-app://')

    setIsStandalone(inStandalone)

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase()
    const ios = /iphone|ipad|ipod/.test(userAgent)
    setIsIOS(ios)

    // Capture install prompt for Android/Chrome/Edge/Desktop
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  if (isStandalone || dismissed) return null

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setDeferredPrompt(null)
      }
    } else if (isIOS) {
      setShowIOSPrompt(true)
    }
  }

  // Show button if installable OR if on iOS (not standalone)
  if (!deferredPrompt && !isIOS) return null

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded text-xs font-semibold shadow-sm transition-all animate-pulse hover:animate-none shrink-0"
        title="Install app on your phone or desktop home screen"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden xs:inline sm:inline">Install App</span>
      </button>

      {/* iOS Installation Instructions Modal */}
      {showIOSPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 max-w-sm w-full shadow-xl text-slate-800 dark:text-slate-100 relative">
            <button
              onClick={() => setShowIOSPrompt(false)}
              className="absolute top-3 right-3 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base">Install CBT Portal</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Add to iPhone / iPad Home Screen</p>
              </div>
            </div>

            <ol className="text-xs space-y-2.5 my-4 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600">1.</span>
                <span>
                  Tap the <Share className="w-3.5 h-3.5 inline mx-0.5 text-blue-500" /> <strong>Share</strong> button
                  in Safari's navigation bar.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600">2.</span>
                <span>
                  Scroll down and select <PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-blue-500" />{' '}
                  <strong>Add to Home Screen</strong>.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600">3.</span>
                <span>
                  Tap <strong>Add</strong> at top right to launch from your home screen icon!
                </span>
              </li>
            </ol>

            <button
              onClick={() => setShowIOSPrompt(false)}
              className="btn btn-primary w-full text-xs font-semibold py-2"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  )
}
