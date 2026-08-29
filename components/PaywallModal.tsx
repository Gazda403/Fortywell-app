import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  ScrollView,
  Pressable,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  Sparkles,
  CheckCircle2,
  Flower2,
  Flame,
  ShieldCheck,
  ArrowRight,
  X,
  Lock,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { fontFamilies } from '../theme/typography';
import { useSubscription } from '../context/SubscriptionContext';
import { useUserData } from '../hooks/useUserData';

const { width: SCREEN_W } = Dimensions.get('window');

interface PaywallModalProps {
  onDismissToGarden?: () => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({ onDismissToGarden }) => {
  const {
    isPaywallVisible,
    closePaywall,
    pricing,
    subscribe,
    isTrialActive,
    trialDaysRemaining,
  } = useSubscription();

  const { userProfile, gardenProgress, lifetimeStats, currentWeekDays } = useUserData();

  const [selectedInterval, setSelectedInterval] = useState<'annual' | 'monthly'>('annual');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const firstName = useMemo(() => {
    if (userProfile.fullName) return userProfile.fullName.split(' ')[0];
    if (userProfile.greetingName && userProfile.greetingName !== 'Welcome') {
      return userProfile.greetingName.replace('Hi, ', '');
    }
    return 'there';
  }, [userProfile]);

  const activeDaysThisWeek = useMemo(() => {
    return currentWeekDays.filter((d) => d.isCompleted).length;
  }, [currentWeekDays]);

  const handleSubscribe = async () => {
    try {
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (_) {}
    setIsProcessing(true);
    try {
      await subscribe(selectedInterval);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDismiss = () => {
    try {
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_) {}
    closePaywall();
    if (onDismissToGarden) onDismissToGarden();
  };

  const activeDays = activeDaysThisWeek || lifetimeStats.totalWorkouts || 1;

  const FEATURES = [
    { label: 'Adaptive Daily Workouts', desc: 'Joint-safe, phase-synced movement with AI rationale each day' },
    { label: 'Full Rhythm Tracking', desc: 'Perimenopause cycle pacing, energy curve & recovery signals' },
    { label: 'Garden of Vitality', desc: 'Permanent progress, streaks, milestone rewards — never reset' },
    { label: 'AI Coach & Learn Library', desc: 'Evidence-based hormone health protocols & daily articles' },
  ];

  return (
    <Modal
      visible={isPaywallVisible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleDismiss}
    >
      {/* ── FULL SCREEN DARK-TO-CREAM CANVAS ── */}
      <View style={s.canvas}>
        <SafeAreaView style={s.safeArea} edges={['top', 'bottom']}>

          {/* ───────────────────────── HERO HEADER ───────────────────────────── */}
          <LinearGradient
            colors={['#2A1F1B', '#3D2A24', '#4A3128']}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={s.heroGradient}
          >
            {/* Glow circle behind headline */}
            <View style={s.heroGlow} pointerEvents="none" />

            {/* Top bar */}
            <View style={s.topBar}>
              {isTrialActive ? (
                <View style={s.trialBadge}>
                  <Sparkles size={11} color="#F0C4CC" strokeWidth={2.2} />
                  <Text style={s.trialBadgeText}>
                    {trialDaysRemaining} DAYS LEFT IN TRIAL
                  </Text>
                </View>
              ) : (
                <View style={s.trialBadge}>
                  <Lock size={11} color="#F0C4CC" strokeWidth={2.2} />
                  <Text style={s.trialBadgeText}>TRIAL COMPLETE</Text>
                </View>
              )}

              <Pressable
                onPress={handleDismiss}
                style={s.closeBtn}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <X size={18} color="rgba(255,255,255,0.55)" strokeWidth={2} />
              </Pressable>
            </View>

            {/* Headline */}
            <View style={s.heroContent}>
              <Text style={s.heroKicker}>YOUR MOMENTUM IS REAL.</Text>
              <Text style={s.heroHeadline}>
                Don't let {firstName}'s{'\n'}progress fade.
              </Text>
              <Text style={s.heroSub}>
                {activeDays} active {activeDays === 1 ? 'day' : 'days'} this week · Level {gardenProgress.currentLevel} garden growing
              </Text>

              {/* ── GLASSY STAT PILLS ── */}
              <View style={s.statPillRow}>
                <View style={s.statPill}>
                  <View style={s.statPillIcon}>
                    <Flower2 size={13} color="#F0C4CC" strokeWidth={2} />
                  </View>
                  <View>
                    <Text style={s.statPillVal}>Lvl {gardenProgress.currentLevel}</Text>
                    <Text style={s.statPillLabel} numberOfLines={1}>{gardenProgress.levelName}</Text>
                  </View>
                </View>

                <View style={s.statPillDivider} />

                <View style={s.statPill}>
                  <View style={[s.statPillIcon, { backgroundColor: 'rgba(225,161,136,0.2)' }]}>
                    <Flame size={13} color="#E8A888" strokeWidth={2} />
                  </View>
                  <View>
                    <Text style={s.statPillVal}>{lifetimeStats.currentStreak} day{lifetimeStats.currentStreak !== 1 ? 's' : ''}</Text>
                    <Text style={s.statPillLabel}>Streak</Text>
                  </View>
                </View>

                <View style={s.statPillDivider} />

                <View style={s.statPill}>
                  <View style={[s.statPillIcon, { backgroundColor: 'rgba(146,169,117,0.2)' }]}>
                    <ShieldCheck size={13} color="#B2CA95" strokeWidth={2} />
                  </View>
                  <View>
                    <Text style={s.statPillVal}>{lifetimeStats.totalWorkouts}</Text>
                    <Text style={s.statPillLabel}>Sessions</Text>
                  </View>
                </View>
              </View>
            </View>
          </LinearGradient>

          {/* ───────────────────── SCROLLABLE BODY ──────────────────────────── */}
          <ScrollView
            style={s.bodyScroll}
            contentContainerStyle={s.scrollContent}
            showsVerticalScrollIndicator={false}
          >

            {/* ── PLAN TOGGLE ── */}
            <View style={s.planToggleWrap}>
              <Text style={s.sectionKicker}>CHOOSE YOUR PLAN</Text>

              {/* Annual */}
              <Pressable
                style={[s.planCard, selectedInterval === 'annual' && s.planCardActive]}
                onPress={() => {
                  try { if (Platform.OS !== 'web') Haptics.selectionAsync(); } catch (_) {}
                  setSelectedInterval('annual');
                }}
              >
                {selectedInterval === 'annual' && (
                  <LinearGradient
                    colors={['rgba(201,99,116,0.06)', 'rgba(159,66,82,0.03)']}
                    style={StyleSheet.absoluteFillObject}
                    borderRadius={16}
                  />
                )}

                {/* BEST VALUE badge */}
                <View style={s.bestValueBadge}>
                  <Text style={s.bestValueBadgeText}>BEST VALUE</Text>
                </View>

                <View style={s.planCardInner}>
                  {/* Radio */}
                  <View style={[s.radioRing, selectedInterval === 'annual' && s.radioRingActive]}>
                    {selectedInterval === 'annual' && <View style={s.radioDot} />}
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={s.planTitle}>Annual Membership</Text>
                    <Text style={s.planSavings}>Save 38% · 2+ months free</Text>
                  </View>

                  <View style={s.planPriceCol}>
                    <Text style={s.planPriceBig}>{pricing.annualMonthlyEquivalent}</Text>
                    <Text style={s.planPriceSub}>billed {pricing.annualPriceFormatted}</Text>
                  </View>
                </View>
              </Pressable>

              {/* Monthly */}
              <Pressable
                style={[s.planCard, selectedInterval === 'monthly' && s.planCardActive]}
                onPress={() => {
                  try { if (Platform.OS !== 'web') Haptics.selectionAsync(); } catch (_) {}
                  setSelectedInterval('monthly');
                }}
              >
                {selectedInterval === 'monthly' && (
                  <LinearGradient
                    colors={['rgba(201,99,116,0.06)', 'rgba(159,66,82,0.03)']}
                    style={StyleSheet.absoluteFillObject}
                    borderRadius={16}
                  />
                )}

                <View style={s.planCardInner}>
                  <View style={[s.radioRing, selectedInterval === 'monthly' && s.radioRingActive]}>
                    {selectedInterval === 'monthly' && <View style={s.radioDot} />}
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={s.planTitle}>Monthly Membership</Text>
                    <Text style={s.planSavings}>Cancel or pause anytime</Text>
                  </View>

                  <View style={s.planPriceCol}>
                    <Text style={s.planPriceBig}>{pricing.monthlyPriceFormatted}</Text>
                    <Text style={s.planPriceSub}>per month</Text>
                  </View>
                </View>
              </Pressable>
            </View>

            {/* ── WHAT'S INCLUDED ── */}
            <View style={s.featuresCard}>
              <Text style={s.sectionKicker}>EVERYTHING INCLUDED</Text>
              {FEATURES.map((f, i) => (
                <View key={i} style={[s.featureRow, i < FEATURES.length - 1 && s.featureRowBorder]}>
                  <View style={s.featureCheck}>
                    <CheckCircle2 size={16} color={colors.sageDark} strokeWidth={2.3} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.featureLabel}>{f.label}</Text>
                    <Text style={s.featureDesc}>{f.desc}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* ── PRIMARY CTA ── */}
            <Pressable
              style={[s.ctaBtn, isProcessing && { opacity: 0.78 }]}
              onPress={handleSubscribe}
              disabled={isProcessing}
              accessibilityRole="button"
              accessibilityLabel="Subscribe and continue"
            >
              <LinearGradient
                colors={['#C96374', '#A83D52', '#9F4252']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.ctaGradient}
              >
                <Text style={s.ctaText}>
                  {isProcessing ? 'Connecting…' : 'Subscribe & Continue'}
                </Text>
                {!isProcessing && <ArrowRight size={20} color="#FFFFFF" strokeWidth={2.3} />}
              </LinearGradient>
            </Pressable>

            {/* ── SECONDARY DISMISS ── */}
            <Pressable
              style={s.dismissBtn}
              onPress={handleDismiss}
              accessibilityRole="button"
              accessibilityLabel="Keep garden in read-only mode"
            >
              <Text style={s.dismissText}>Not right now — keep my garden in read-only</Text>
            </Pressable>

            {/* ── TRUST LINE ── */}
            <View style={s.trustRow}>
              <Lock size={11} color={colors.textTertiary} strokeWidth={2} />
              <Text style={s.trustText}>
                256-bit checkout via Lemon Squeezy · Cancel anytime
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  canvas: {
    flex: 1,
    backgroundColor: '#F5EEE5',
  },
  safeArea: {
    flex: 1,
  },

  // ── HERO ──
  heroGradient: {
    paddingBottom: 28,
    position: 'relative',
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    width: SCREEN_W * 1.1,
    height: SCREEN_W * 1.1,
    borderRadius: SCREEN_W * 0.55,
    backgroundColor: 'rgba(201,99,116,0.14)',
    top: -SCREEN_W * 0.5,
    left: -SCREEN_W * 0.05,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8,
  },
  trialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(240,196,204,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(240,196,204,0.22)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  trialBadgeText: {
    fontSize: 9.5,
    fontFamily: fontFamilies.monoBold,
    color: '#F0C4CC',
    letterSpacing: 1.2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Headline
  heroContent: {
    paddingHorizontal: 22,
    paddingTop: 6,
  },
  heroKicker: {
    fontSize: 10,
    fontFamily: fontFamilies.monoBold,
    color: 'rgba(240,196,204,0.65)',
    letterSpacing: 2,
    marginBottom: 8,
  },
  heroHeadline: {
    fontSize: 30,
    fontFamily: fontFamilies.soria,
    fontWeight: '700',
    color: '#F5EFE6',
    lineHeight: 36,
    letterSpacing: -0.6,
    marginBottom: 8,
  },
  heroSub: {
    fontSize: 13.5,
    fontFamily: fontFamilies.sansRegular,
    color: 'rgba(245,239,230,0.6)',
    lineHeight: 20,
    marginBottom: 20,
  },

  // Stat pills
  statPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 0,
  },
  statPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 6,
  },
  statPillDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  statPillIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(240,196,204,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statPillVal: {
    fontSize: 13,
    fontFamily: fontFamilies.sansBold,
    color: '#F5EFE6',
  },
  statPillLabel: {
    fontSize: 10,
    fontFamily: fontFamilies.sansRegular,
    color: 'rgba(245,239,230,0.5)',
  },

  // ── BODY ──
  bodyScroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 32,
    gap: 16,
  },

  // Plan section
  planToggleWrap: {
    gap: 10,
  },
  sectionKicker: {
    fontSize: 10,
    fontFamily: fontFamilies.monoBold,
    letterSpacing: 1.6,
    color: colors.textTertiary,
    marginBottom: 4,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(101,78,60,0.14)',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#2A2320',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  planCardActive: {
    borderColor: colors.primary,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
    }),
  },
  planCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  bestValueBadge: {
    backgroundColor: colors.primary,
    alignSelf: 'flex-end',
    marginTop: 0,
    marginRight: 0,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 10,
    borderTopRightRadius: 14,
    marginBottom: -1,
  },
  bestValueBadgeText: {
    fontSize: 9,
    fontFamily: fontFamilies.monoBold,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  radioRing: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'rgba(101,78,60,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  radioRingActive: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: colors.primary,
  },
  planTitle: {
    fontSize: 15,
    fontFamily: fontFamilies.sansSemiBold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  planSavings: {
    fontSize: 12,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textTertiary,
  },
  planPriceCol: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  planPriceBig: {
    fontSize: 17,
    fontFamily: fontFamilies.sansBold,
    color: colors.primaryDark,
    letterSpacing: -0.3,
  },
  planPriceSub: {
    fontSize: 10.5,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textTertiary,
  },

  // Features card
  featuresCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(101,78,60,0.1)',
    padding: 18,
    gap: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#2A2320',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 11,
  },
  featureRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(101,78,60,0.07)',
  },
  featureCheck: {
    marginTop: 1,
    flexShrink: 0,
  },
  featureLabel: {
    fontSize: 13.5,
    fontFamily: fontFamilies.sansSemiBold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 12,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textTertiary,
    lineHeight: 17,
  },

  // CTA
  ctaBtn: {
    borderRadius: 18,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: colors.primaryDark,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.32,
        shadowRadius: 16,
      },
      android: { elevation: 6 },
    }),
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 19,
    paddingHorizontal: 24,
    gap: 10,
  },
  ctaText: {
    fontSize: 16,
    fontFamily: fontFamilies.sansBold,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  // Dismiss
  dismissBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  dismissText: {
    fontSize: 13,
    fontFamily: fontFamilies.sansMedium,
    color: colors.textTertiary,
    textDecorationLine: 'underline',
    textDecorationStyle: 'dotted',
  },

  // Trust row
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingBottom: 4,
  },
  trustText: {
    fontSize: 11,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});
