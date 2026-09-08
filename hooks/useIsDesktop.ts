import { useState, useEffect } from 'react';
import { Platform } from 'react-native';

const DESKTOP_BREAKPOINT = 900;

export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
    return window.innerWidth >= DESKTOP_BREAKPOINT;
  });

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const handler = () => {
      setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT);
    };

    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return isDesktop;
}
