'use client'

import { useEffect, useState, useRef } from 'react'
import { X, Download } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isFirefox, setIsFirefox] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [translateY, setTranslateY] = useState(0)
  const touchStartY = useRef(0)
  const touchCurrentY = useRef(0)
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Ministry Apps'

  useEffect(() => {
    // Check if device is iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(iOS)

    // Check if browser is Firefox
    const firefox = /Firefox/i.test(navigator.userAgent)
    setIsFirefox(firefox)

    // Check if app is already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches
    setIsStandalone(standalone)

    // Check if user dismissed the prompt this session (client-side only)
    // Using v2 key to reset any dismissals from old prompt design
    const dismissed = sessionStorage.getItem('pwa-prompt-dismissed-v2') === 'true'
    setIsDismissed(dismissed)

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      console.log('PWA: beforeinstallprompt event fired')
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstallPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Debug logging
    console.log('PWA Prompt Status:', {
      isIOS: iOS,
      isFirefox: firefox,
      isStandalone: standalone,
      dismissed,
      userAgent: navigator.userAgent
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setDeferredPrompt(null)
      setShowInstallPrompt(false)
    }
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    setDeferredPrompt(null)
    setIsDismissed(true)
    // Remember dismissal for this session
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('pwa-prompt-dismissed-v2', 'true')
    }
  }

  const handleShareClick = async () => {
    // Try to trigger the native share sheet (iOS/Android)
    if (navigator.share) {
      try {
        await navigator.share({
          title: appName,
          text: `Check out ${appName}`,
          url: window.location.href,
        })
      } catch (err) {
        // User cancelled or share failed
        console.log('Share cancelled or failed:', err)
      }
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchCurrentY.current = e.touches[0].clientY
    const diff = touchCurrentY.current - touchStartY.current

    // Only allow downward swipe
    if (diff > 0) {
      setTranslateY(diff)
    }
  }

  const handleTouchEnd = () => {
    // Dismiss if swiped down more than 50px
    if (translateY > 50) {
      handleDismiss()
    }
    setTranslateY(0)
  }

  // Don't show if already installed or dismissed this session
  if (isStandalone || isDismissed) return null

  // Don't show for Firefox - it doesn't natively support PWA installation
  if (isFirefox) return null

  // Show iOS instructions
  if (isIOS && !isStandalone) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 flex justify-center pointer-events-none">
        <div
          className="pointer-events-auto backdrop-blur-xl bg-white/40 dark:bg-[oklch(0.16_0.005_0)]/95 border border-white/30 dark:border-[oklch(0.3_0.005_0)] shadow-2xl rounded-2xl p-5 max-w-2xl w-full transition-transform"
          style={{ transform: `translateY(${translateY}px)` }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="flex justify-between items-start gap-4">
            <div className="flex gap-4 items-start flex-1">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                <Download className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg mb-1 text-foreground">Install {appName}</h3>
                <p className="text-sm text-muted-foreground">
                  Tap the{' '}
                  <button
                    onClick={handleShareClick}
                    className="inline-flex items-center gap-1 text-primary dark:text-primary font-medium hover:underline"
                  >
                    share button 📤
                  </button>
                  {' '}and select &quot;Add to Home Screen&quot; for quick access.
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 p-2 rounded-lg transition-colors flex-shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Show Android/Chrome install prompt
  if (showInstallPrompt && deferredPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 flex justify-center pointer-events-none">
        <div
          className="pointer-events-auto backdrop-blur-xl bg-white/40 dark:bg-[oklch(0.16_0.005_0)]/95 border border-white/30 dark:border-[oklch(0.3_0.005_0)] shadow-2xl rounded-2xl p-5 max-w-2xl w-full transition-transform"
          style={{ transform: `translateY(${translateY}px)` }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="flex justify-between items-center gap-4">
            <div className="flex gap-4 items-center flex-1">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                <Download className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg mb-0.5 text-foreground">Install {appName}</h3>
                <p className="text-sm text-muted-foreground">Add to your home screen for quick access</p>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={handleInstallClick}
                className="bg-primary text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-primary/90 transition-colors shadow-md"
              >
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="text-muted-foreground hover:text-foreground dark:text-gray-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 p-2.5 rounded-lg transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}