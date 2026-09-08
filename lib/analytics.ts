export function trackEvent(_name: string, _properties?: Record<string, string | number | boolean | null>) {
  // No-op on native platforms
}

export function trackScreenView(_screen: string) {
  // No-op on native platforms
}
