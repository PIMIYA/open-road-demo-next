import { useState, useEffect, useCallback } from 'react';
import { useUIEnvironment } from '@/contexts/UIEnvironmentContext';

const STORAGE_KEY = 'kairos_mobile_gesture_tutorial_seen_v1';
const AUTO_DISMISS_MS = 10000;

/**
 * MobileGestureTutorial
 *
 * First-time mobile gesture tutorial overlay.
 * Shows instructions for map interactions on mobile devices.
 *
 * Behavior:
 * - Only shown when isMobileUI === true
 * - Display duration: 10 seconds (auto-dismiss)
 * - Dismissible by tap
 * - After first display, never appears again on the same device
 * - Blocks map interaction while visible
 *
 * @param {Object} props
 * @param {Function} props.onAnimationStateChange - Callback to notify parent of animation state
 */
export function MobileGestureTutorial({ onAnimationStateChange }) {
  const { isMobileUI } = useUIEnvironment();
  const [isVisible, setIsVisible] = useState(false);
  const [hasCheckedStorage, setHasCheckedStorage] = useState(false);

  // Check localStorage on mount (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hasSeenTutorial = localStorage.getItem(STORAGE_KEY) === 'true';
    if (!hasSeenTutorial && isMobileUI) {
      setIsVisible(true);
    }
    setHasCheckedStorage(true);
  }, [isMobileUI]);

  // Notify parent of animation state
  useEffect(() => {
    if (onAnimationStateChange) {
      onAnimationStateChange(isVisible);
    }
  }, [isVisible, onAnimationStateChange]);

  // Auto-dismiss after timeout
  useEffect(() => {
    if (!isVisible) return;

    const timer = setTimeout(() => {
      dismissTutorial();
    }, AUTO_DISMISS_MS);

    return () => clearTimeout(timer);
  }, [isVisible]);

  const dismissTutorial = useCallback(() => {
    setIsVisible(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
  }, []);

  const handleTap = useCallback(() => {
    dismissTutorial();
  }, [dismissTutorial]);

  // Don't render anything if:
  // - Not mobile UI
  // - Haven't checked storage yet (SSR safety)
  // - Already dismissed
  if (!isMobileUI || !hasCheckedStorage || !isVisible) {
    return null;
  }

  return (
    <div
      onClick={handleTap}
      onTouchEnd={handleTap}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        touchAction: 'none', // Block underlying interactions
      }}
    >
      <div
        style={{
          maxWidth: '20rem',
          margin: '0 1rem',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
      >
        <h2
          style={{
            fontSize: '1.125rem',
            fontWeight: 600,
            color: '#111827',
            marginBottom: '1rem',
            textAlign: 'center',
          }}
        >
          Map Gestures
        </h2>

        <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', color: '#374151' }}>
          <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <span
              style={{
                flexShrink: 0,
                width: '2rem',
                height: '2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                backgroundColor: 'rgba(36, 131, 255, 0.1)',
                color: '#2483ff',
              }}
            >
              <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
              </svg>
            </span>
            <span style={{ paddingTop: '0.25rem' }}>
              <strong style={{ fontWeight: 500 }}>Single finger drag:</strong> Pan the map
            </span>
          </li>

          <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <span
              style={{
                flexShrink: 0,
                width: '2rem',
                height: '2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                backgroundColor: 'rgba(36, 131, 255, 0.1)',
                color: '#2483ff',
              }}
            >
              <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </span>
            <span style={{ paddingTop: '0.25rem' }}>
              <strong style={{ fontWeight: 500 }}>Two fingers:</strong> Pinch to zoom
            </span>
          </li>

          <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <span
              style={{
                flexShrink: 0,
                width: '2rem',
                height: '2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                backgroundColor: 'rgba(36, 131, 255, 0.1)',
                color: '#2483ff',
              }}
            >
              <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </span>
            <span style={{ paddingTop: '0.25rem' }}>
              <strong style={{ fontWeight: 500 }}>Change city:</strong> Use on-screen buttons
            </span>
          </li>
        </ul>

        <p
          style={{
            marginTop: '1rem',
            fontSize: '0.875rem',
            color: '#6B7280',
            textAlign: 'center',
          }}
        >
          Tap anywhere to continue
        </p>
      </div>
    </div>
  );
}

export default MobileGestureTutorial;
