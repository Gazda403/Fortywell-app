export const colors = {
  // ── BACKGROUNDS ──────────────────────────────────────────────────────────
  background: '#EDE3D5',
  backgroundSubtle: '#E5D9C8',
  surface: '#F7F0E6',
  surfaceCard: '#FFFFFF',
  surfaceCardSelected: 'rgba(208, 120, 135, 0.07)',

  // ── HERO DARK CARD ────────────────────────────────────────────────────────
  // Charcoal dark hero card background — matches home dashboard "Why This Today" style
  heroCard: '#3A3532',
  heroCardText: '#F5EFE6',
  heroCardGlow: 'rgba(208, 120, 135, 0.28)',  // soft rose radial glow

  // ── PRIMARY ACCENT — Dusty Rose / Confident ───────────────────────────────
  primary: '#C96374',
  primaryMuted: '#C47D89',
  primaryDark: '#9F4252',
  primarySoft: 'rgba(201, 99, 116, 0.1)',
  primaryGlow: 'rgba(201, 99, 116, 0.18)',

  // Richer rose for user chat bubble & hero use
  rose: '#D07887',
  roseSoft: 'rgba(208, 120, 135, 0.12)',

  // ── SECONDARY — Warm Sage ─────────────────────────────────────────────────
  sage: '#92A975',
  sageDark: '#708655',
  sageSoft: '#EFF4EA',
  sageBorder: '#C8DABA',

  // ── TERTIARY — Warm Peach ─────────────────────────────────────────────────
  peach: '#E1A188',
  peachSoft: 'rgba(225, 161, 136, 0.15)',
  peachBorder: '#DCBFB0',

  // ── TYPOGRAPHY — Warm espresso hierarchy ─────────────────────────────────
  textPrimary: '#2A2320',
  textSecondary: '#5A4F48',
  textTertiary: '#9A8E86',
  textInverse: '#F5EFE6',
  textOnDark: '#F5EFE6',         // text on dark hero card
  textOnDarkMuted: '#C9B8AC',   // muted on dark hero card

  // ── BORDERS ───────────────────────────────────────────────────────────────
  border: 'rgba(101, 78, 60, 0.14)',
  borderMedium: 'rgba(101, 78, 60, 0.22)',
  borderSelected: '#C96374',
  borderSubtle: 'rgba(101, 78, 60, 0.07)',

  // ── STATUS ────────────────────────────────────────────────────────────────
  success: '#92A975',
  warning: '#D6A354',
  error: '#C96374',
} as const;

export type ColorToken = keyof typeof colors;
