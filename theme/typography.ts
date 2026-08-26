import { StyleSheet, Platform } from 'react-native';
import { colors } from './colors';

// ── FONT FAMILIES ─────────────────────────────────────────────────────────────
// Soria   → Serif editorial, headlines only (≥ 18px)
// WorkSans → Clean sans-serif, ALL body, UI, chat, labels, captions
// MartianMono → Monospaced, used for code-style tags/badges only

export const fontFamilies = {
  // Serif — headline only
  soria: 'Soria',

  // Sans-serif — everything else
  sansRegular: 'WorkSans-Regular',
  sansMedium: 'WorkSans-Medium',
  sansSemiBold: 'WorkSans-SemiBold',
  sansBold: 'WorkSans-Bold',

  // Monospaced — tags, badges, code snippets
  monoRegular: 'MartianMono-Regular',
  monoMedium: 'MartianMono-Medium',
  monoSemiBold: 'MartianMono-SemiBold',
  monoBold: 'MartianMono-Bold',
};

export const typography = StyleSheet.create({
  // ── SERIF HEADLINES (Soria) ───────────────────────────────────────────────
  hero: {
    fontSize: 34,
    fontFamily: fontFamilies.soria,
    fontWeight: '700',
    letterSpacing: -1,
    lineHeight: 40,
    color: colors.textPrimary,
  },
  title1: {
    fontSize: 28,
    fontFamily: fontFamilies.soria,
    fontWeight: '700',
    letterSpacing: -0.6,
    lineHeight: 34,
    color: colors.textPrimary,
  },
  title2: {
    fontSize: 22,
    fontFamily: fontFamilies.soria,
    fontWeight: '700',
    letterSpacing: -0.3,
    lineHeight: 28,
    color: colors.textPrimary,
  },
  cardHeadline: {
    fontSize: 18,
    fontFamily: fontFamilies.soria,
    fontWeight: '700',
    letterSpacing: -0.2,
    lineHeight: 24,
    color: colors.textPrimary,
  },

  // ── SANS-SERIF UI (WorkSans) ──────────────────────────────────────────────
  headline: {
    fontSize: 15,
    fontFamily: fontFamilies.sansSemiBold,
    letterSpacing: -0.1,
    lineHeight: 22,
    color: colors.textPrimary,
  },
  body: {
    fontSize: 14,
    fontFamily: fontFamilies.sansRegular,
    letterSpacing: 0,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  bodyMedium: {
    fontSize: 14,
    fontFamily: fontFamilies.sansMedium,
    letterSpacing: 0,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  callout: {
    fontSize: 13,
    fontFamily: fontFamilies.sansMedium,
    letterSpacing: 0,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  caption: {
    fontSize: 12,
    fontFamily: fontFamilies.sansRegular,
    letterSpacing: 0,
    lineHeight: 18,
    color: colors.textTertiary,
  },
  button: {
    fontSize: 13,
    fontFamily: fontFamilies.sansBold,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.textInverse,
  },

  // ── MONO — Tags/Badges only ────────────────────────────────────────────────
  tag: {
    fontSize: 10,
    fontFamily: fontFamilies.monoBold,
    letterSpacing: 1.8,
    lineHeight: 15,
    color: colors.textTertiary,
    textTransform: 'uppercase',
  },
  subhead: {
    fontSize: 10,
    fontFamily: fontFamilies.monoBold,
    letterSpacing: 1.8,
    lineHeight: 15,
    color: colors.textTertiary,
    textTransform: 'uppercase',
  },
});
