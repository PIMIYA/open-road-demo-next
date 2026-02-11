import { createContext, useContext, useState, useEffect, useMemo } from 'react';

/**
 * UIEnvironmentContext
 *
 * A single, consistent source of truth for determining whether the app
 * should use mobile UI behavior.
 *
 * Definitions:
 * - Touch Device: Device that supports touch input
 * - Small Viewport: Viewport width <= 768px
 * - Mobile UI: isTouchDevice && isSmallViewport
 *
 * Updates on resize and orientationchange.
 * Safe for SSR (window access guarded).
 */

const SMALL_VIEWPORT_THRESHOLD = 768;

const UIEnvironmentContext = createContext({
  isTouchDevice: false,
  isSmallViewport: false,
  isMobileUI: false,
});

/**
 * Detects if the device supports touch input.
 * Safe for SSR - returns false when window is not available.
 */
function detectTouchDevice() {
  if (typeof window === 'undefined') return false;

  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore - msMaxTouchPoints is IE-specific
    navigator.msMaxTouchPoints > 0
  );
}

/**
 * Detects if the viewport is small (<= 768px).
 * Safe for SSR - returns false when window is not available.
 */
function detectSmallViewport() {
  if (typeof window === 'undefined') return false;

  return window.innerWidth <= SMALL_VIEWPORT_THRESHOLD;
}

export function UIEnvironmentProvider({ children }) {
  // Initialize with SSR-safe defaults
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isSmallViewport, setIsSmallViewport] = useState(false);

  useEffect(() => {
    // Initial detection on client
    setIsTouchDevice(detectTouchDevice());
    setIsSmallViewport(detectSmallViewport());

    // Handler for resize and orientation changes
    function handleEnvironmentChange() {
      setIsSmallViewport(detectSmallViewport());
      // Touch capability doesn't change on resize, but can change on orientation
      // (rare edge case where device capabilities are reported differently)
      setIsTouchDevice(detectTouchDevice());
    }

    window.addEventListener('resize', handleEnvironmentChange);
    window.addEventListener('orientationchange', handleEnvironmentChange);

    return () => {
      window.removeEventListener('resize', handleEnvironmentChange);
      window.removeEventListener('orientationchange', handleEnvironmentChange);
    };
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    isTouchDevice,
    isSmallViewport,
    isMobileUI: isTouchDevice && isSmallViewport,
  }), [isTouchDevice, isSmallViewport]);

  return (
    <UIEnvironmentContext.Provider value={value}>
      {children}
    </UIEnvironmentContext.Provider>
  );
}

/**
 * Hook to access UI environment context.
 * Must be used within a UIEnvironmentProvider.
 */
export function useUIEnvironment() {
  const context = useContext(UIEnvironmentContext);
  if (context === undefined) {
    throw new Error('useUIEnvironment must be used within a UIEnvironmentProvider');
  }
  return context;
}

export default UIEnvironmentContext;
