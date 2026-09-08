import { track } from '@vercel/analytics';

export function trackEvent(name: string, properties?: Record<string, string | number | boolean | null>) {
  try {
    track(name, properties);
  } catch (err) {
    console.warn('[Analytics] Track event failed:', err);
  }
}

export function trackScreenView(screen: string) {
  try {
    track('screen_view', { screen });
  } catch (err) {
    // Non-fatal
  }
}
