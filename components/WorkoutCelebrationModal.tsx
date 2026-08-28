/**
 * WorkoutCelebrationModal
 * ─────────────────────────────────────────────────────────────────────────────
 * Shown after a user confirms "Finish Workout". Displays:
 *   • Pink confetti burst (canvas-painted particles via Reanimated)
 *   • Workout stats summary card
 *   • Today's milestone badge
 *   • Personal Record (PR) highlights with a progress boost bar
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  Dimensions,
  ScrollView,
  Share,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  SharedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  Trophy,
  Zap,
  Star,
  CheckCircle2,
  Flame,
  Target,
  Heart,
  Share2,
  Copy,
  Sparkles,
  Check,
  X,
  Send,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { fontFamilies } from '../theme/typography';
import { WorkoutSummaryData } from './ActiveWorkoutScreen';
import { playWorkoutCelebrationChime } from '../lib/audioManager';
import { useFavorites } from '../lib/useFavorites';

const { width: W, height: H } = Dimensions.get('window');

// ─── Confetti Colors ─────────────────────────────────────────────────────────

const CONFETTI_COLORS = [
  '#C96374', '#E8A0AA', '#F2C4CB',
  '#708655', '#92A975', '#C5D9B3',
  '#D6A354', '#F7D08E',
  '#9F4252', '#FAF8F5',
];



function ConfettiLayer({ active }: { active: boolean }) {
  // Create shared values inside the component (Rules of Hooks respected, fixed count)
  const xs = [
    useSharedValue(W / 2), useSharedValue(W / 2), useSharedValue(W / 2), useSharedValue(W / 2), useSharedValue(W / 2),
    useSharedValue(W / 2), useSharedValue(W / 2), useSharedValue(W / 2), useSharedValue(W / 2), useSharedValue(W / 2),
    useSharedValue(W / 2), useSharedValue(W / 2), useSharedValue(W / 2), useSharedValue(W / 2), useSharedValue(W / 2),
    useSharedValue(W / 2), useSharedValue(W / 2), useSharedValue(W / 2), useSharedValue(W / 2), useSharedValue(W / 2),
    useSharedValue(W / 2), useSharedValue(W / 2), useSharedValue(W / 2), useSharedValue(W / 2), useSharedValue(W / 2),
    useSharedValue(W / 2), useSharedValue(W / 2), useSharedValue(W / 2), useSharedValue(W / 2), useSharedValue(W / 2),
    useSharedValue(W / 2), useSharedValue(W / 2), useSharedValue(W / 2), useSharedValue(W / 2), useSharedValue(W / 2),
    useSharedValue(W / 2), useSharedValue(W / 2), useSharedValue(W / 2), useSharedValue(W / 2), useSharedValue(W / 2),
    useSharedValue(W / 2), useSharedValue(W / 2), useSharedValue(W / 2), useSharedValue(W / 2), useSharedValue(W / 2),
    useSharedValue(W / 2), useSharedValue(W / 2), useSharedValue(W / 2), useSharedValue(W / 2), useSharedValue(W / 2),
    useSharedValue(W / 2), useSharedValue(W / 2), useSharedValue(W / 2), useSharedValue(W / 2), useSharedValue(W / 2),
  ];
  const ys = [
    useSharedValue(-20), useSharedValue(-20), useSharedValue(-20), useSharedValue(-20), useSharedValue(-20),
    useSharedValue(-20), useSharedValue(-20), useSharedValue(-20), useSharedValue(-20), useSharedValue(-20),
    useSharedValue(-20), useSharedValue(-20), useSharedValue(-20), useSharedValue(-20), useSharedValue(-20),
    useSharedValue(-20), useSharedValue(-20), useSharedValue(-20), useSharedValue(-20), useSharedValue(-20),
    useSharedValue(-20), useSharedValue(-20), useSharedValue(-20), useSharedValue(-20), useSharedValue(-20),
    useSharedValue(-20), useSharedValue(-20), useSharedValue(-20), useSharedValue(-20), useSharedValue(-20),
    useSharedValue(-20), useSharedValue(-20), useSharedValue(-20), useSharedValue(-20), useSharedValue(-20),
    useSharedValue(-20), useSharedValue(-20), useSharedValue(-20), useSharedValue(-20), useSharedValue(-20),
    useSharedValue(-20), useSharedValue(-20), useSharedValue(-20), useSharedValue(-20), useSharedValue(-20),
    useSharedValue(-20), useSharedValue(-20), useSharedValue(-20), useSharedValue(-20), useSharedValue(-20),
    useSharedValue(-20), useSharedValue(-20), useSharedValue(-20), useSharedValue(-20), useSharedValue(-20),
  ];
  const rots = [
    useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0),
    useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0),
    useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0),
    useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0),
    useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0),
    useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0),
    useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0),
    useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0),
    useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0),
    useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0),
    useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0),
  ];
  const opacities = [
    useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0),
    useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0),
    useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0),
    useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0),
    useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0),
    useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0),
    useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0),
    useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0),
    useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0),
    useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0),
    useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0),
  ];

  const SEEDS = Array.from({ length: 55 }, (_, i) => ({
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size: 6 + (i * 7919) % 9,
    shape: (['square', 'circle', 'rect'] as const)[i % 3],
    tx: (i * 6271) % W,
    ty: H * 0.3 + ((i * 3571) % (H * 0.5)),
    rot: (i * 2017) % 720 - 360,
  }));

  useEffect(() => {
    if (!active) return;
    xs.forEach((x, i) => {
      const delay = i * 18;
      const seed = SEEDS[i];
      x.value = W / 2 + ((i * 997) % 60) - 30;
      ys[i].value = -20;
      opacities[i].value = 0;
      rots[i].value = 0;

      x.value = withDelay(delay, withSpring(seed.tx, { damping: 10, stiffness: 40 }));
      ys[i].value = withDelay(delay, withSpring(seed.ty, { damping: 8, stiffness: 30 }));
      rots[i].value = withDelay(delay, withTiming(seed.rot, { duration: 2000 }));
      opacities[i].value = withDelay(delay, withSequence(
        withTiming(1, { duration: 200 }),
        withDelay(1400, withTiming(0, { duration: 600 }))
      ));
    });
  }, [active]);

  return (
    <>
      {SEEDS.map((seed, i) => (
        <SingleParticle
          key={i}
          x={xs[i]}
          y={ys[i]}
          rot={rots[i]}
          opacity={opacities[i]}
          size={seed.size}
          color={seed.color}
          shape={seed.shape}
        />
      ))}
    </>
  );
}

function SingleParticle({
  x, y, rot, opacity, size, color, shape,
}: {
  x: SharedValue<number>;
  y: SharedValue<number>;
  rot: SharedValue<number>;
  opacity: SharedValue<number>;
  size: number;
  color: string;
  shape: 'square' | 'circle' | 'rect';
}) {
  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    left: x.value - size / 2,
    top: y.value - size / 2,
    width: shape === 'rect' ? size * 1.8 : size,
    height: size,
    borderRadius: shape === 'circle' ? size / 2 : 2,
    backgroundColor: color,
    opacity: opacity.value,
    transform: [{ rotate: `${rot.value}deg` }],
  }));
  return <Animated.View style={style} />;
}


// ─── PR Boost Bar ────────────────────────────────────────────────────────────

type PRRecord = {
  exerciseName: string;
  field: 'weight' | 'volume';
  value: number;
  unit: string;
};

function PRBoostBar({ pr, delay }: { pr: PRRecord; delay: number }) {
  const barW = useSharedValue(0);
  const cardOpacity = useSharedValue(0);
  const cardY = useSharedValue(20);

  useEffect(() => {
    cardOpacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
    cardY.value = withDelay(delay, withSpring(0, { damping: 15 }));
    barW.value = withDelay(delay + 300, withTiming(1, { duration: 800, easing: Easing.out(Easing.quad) }));
  }, []);

  const barStyle = useAnimatedStyle(() => ({
    width: `${barW.value * 100}%` as `${number}%`,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardY.value }],
  }));

  return (
    <Animated.View style={[pr_s.card, cardStyle]}>
      <View style={pr_s.headerRow}>
        <View style={pr_s.badge}>
          <Zap size={12} color="#FFF" fill="#FFF" />
          <Text style={pr_s.badgeTxt}>NEW PR</Text>
        </View>
        <Text style={pr_s.exName} numberOfLines={1}>{pr.exerciseName}</Text>
        <Text style={pr_s.value}>{pr.value}{pr.unit}</Text>
      </View>
      <View style={pr_s.track}>
        <Animated.View style={[pr_s.fill, barStyle]}>
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const pr_s = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(201,99,116,0.07)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(201,99,116,0.18)',
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryDark,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  badgeTxt: { fontSize: 9, fontFamily: fontFamilies.monoBold, color: '#FFF', letterSpacing: 0.5 },
  exName: { flex: 1, fontSize: 12, fontFamily: fontFamilies.monoMedium, color: colors.textPrimary },
  value: { fontSize: 13, fontFamily: fontFamilies.monoBold, color: colors.primaryDark },
  track: {
    height: 8,
    backgroundColor: 'rgba(201,99,116,0.12)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 4 },
});

// ─── Stat Pill ───────────────────────────────────────────────────────────────

function StatPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View style={stat_s.pill}>
      {icon}
      <Text style={stat_s.val}>{value}</Text>
      <Text style={stat_s.lbl}>{label}</Text>
    </View>
  );
}

const stat_s = StyleSheet.create({
  pill: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(101,78,60,0.08)',
  },
  val: { fontSize: 18, fontFamily: fontFamilies.monoBold, color: colors.textPrimary },
  lbl: { fontSize: 9, fontFamily: fontFamilies.monoMedium, color: colors.textTertiary, letterSpacing: 0.8 },
});

// ─── PR Detection ────────────────────────────────────────────────────────────

function detectPRs(summary: WorkoutSummaryData): PRRecord[] {
  const prs: PRRecord[] = [];
  summary.exercises.forEach((ex) => {
    const completed = ex.sets.filter((s) => s.completed);
    if (completed.length === 0) return;

    // Heaviest single set weight
    const maxW = Math.max(...completed.map((s) => parseFloat(s.weight) || 0));
    if (maxW > 0) {
      prs.push({ exerciseName: ex.name, field: 'weight', value: maxW, unit: 'kg' });
    }
  });
  // Return top 3 most impressive (highest weight)
  return prs.sort((a, b) => b.value - a.value).slice(0, 3);
}

// ─── Main Modal ──────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  summary: WorkoutSummaryData | null;
  onClose: () => void;
}

export function WorkoutCelebrationModal({ visible, summary, onClose }: Props) {
  const [active, setActive] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [favNotice, setFavNotice] = useState<string | null>(null);

  const { isFavorite, toggleFavorite } = useFavorites();

  const sheetY = useSharedValue(H);
  const headerScale = useSharedValue(0.7);
  const headerOpacity = useSharedValue(0);
  const heartScale = useSharedValue(1);

  const workoutSlug = summary?.workoutSlug || 'custom';
  const isFav = isFavorite(workoutSlug);

  useEffect(() => {
    if (visible) {
      setActive(true);
      playWorkoutCelebrationChime();
      sheetY.value = withSpring(0, { damping: 22, stiffness: 120 });
      headerScale.value = withDelay(200, withSpring(1, { damping: 12, stiffness: 150 }));
      headerOpacity.value = withDelay(150, withTiming(1, { duration: 400 }));
    } else {
      setActive(false);
      sheetY.value = withTiming(H, { duration: 280 });
      headerScale.value = 0.7;
      headerOpacity.value = 0;
      setShareModalVisible(false);
      setFavNotice(null);
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetY.value }],
  }));

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ scale: headerScale.value }],
  }));

  const heartAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const handleToggleFav = useCallback(() => {
    if (!summary) return;
    heartScale.value = withSequence(
      withSpring(1.4, { damping: 4, stiffness: 350 }),
      withSpring(1, { damping: 8, stiffness: 200 })
    );
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (_) {}

    toggleFavorite(workoutSlug);
    const willBeFav = !isFav;
    setFavNotice(willBeFav ? 'Saved to Your Favorite Routines! ♥' : 'Removed from Favorites');
    setTimeout(() => setFavNotice(null), 3000);
  }, [summary, workoutSlug, isFav, toggleFavorite, heartScale]);

  if (!visible || !summary) return null;

  const prs = detectPRs(summary);
  const durationMin = Math.floor(summary.durationSeconds / 60);
  const durationSec = summary.durationSeconds % 60;
  const durationStr = `${durationMin}:${String(durationSec).padStart(2, '0')}`;

  const shareMessage = `🌸 FortyWell Workout Complete!\n` +
    `Routine: ${summary.workoutTitle}\n` +
    `📊 ${summary.completedSets}/${summary.totalSets} Sets Done • ⏱ ${durationStr} • 🏋️ ${summary.totalVolumeKg}kg Volume\n` +
    `Move with your cycle, not against it. ✨\n` +
    `https://fortywell-app.vercel.app`;

  const handleNativeShare = async () => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (_) {}

    try {
      await Share.share({
        message: shareMessage,
        title: `FortyWell Milestone: ${summary.workoutTitle}`,
      });
    } catch (_) {
      // Fallback: open modal preview
      setShareModalVisible(true);
    }
  };

  const handleCopyText = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareMessage);
      }
      setCopiedText(true);
      try {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } catch (_) {}
      setTimeout(() => setCopiedText(false), 2500);
    } catch (_) {
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      {/* Confetti layer — full screen, above everything */}
      <View style={cel_s.confettiLayer} pointerEvents="none">
        <ConfettiLayer active={active} />
      </View>

      {/* Dark backdrop */}
      <View style={cel_s.backdrop}>
        <Animated.View style={[cel_s.sheet, sheetStyle]}>
          <ScrollView contentContainerStyle={cel_s.scrollContent} showsVerticalScrollIndicator={false}>

            {/* Trophy header */}
            <Animated.View style={[cel_s.headerBox, headerStyle]}>
              <LinearGradient
                colors={['#C96374', '#9F4252']}
                style={cel_s.trophyCircle}
              >
                <Trophy size={38} color="#FFF" fill="rgba(255,255,255,0.25)" />
              </LinearGradient>
              <Text style={cel_s.congrats}>Workout Complete!</Text>
              <Text style={cel_s.subLine}>{summary.workoutTitle}</Text>
            </Animated.View>

            {/* Notification banner when favorited */}
            {favNotice && (
              <View style={cel_s.favNoticeBanner}>
                <Sparkles size={13} color={colors.rose} />
                <Text style={cel_s.favNoticeText}>{favNotice}</Text>
              </View>
            )}

            {/* Stats row */}
            <View style={cel_s.statsRow}>
              <StatPill
                icon={<CheckCircle2 size={18} color={colors.sage} />}
                label="SETS DONE"
                value={`${summary.completedSets}/${summary.totalSets}`}
              />
              <StatPill
                icon={<Flame size={18} color={colors.primaryDark} />}
                label="DURATION"
                value={durationStr}
              />
              <StatPill
                icon={<Target size={18} color={colors.warning} />}
                label="VOLUME"
                value={`${summary.totalVolumeKg}kg`}
              />
            </View>

            {/* Today's Milestone */}
            <View style={cel_s.milestoneCard}>
              <LinearGradient
                colors={['rgba(201,99,116,0.08)', 'rgba(159,66,82,0.04)']}
                style={cel_s.milestoneGrad}
              >
                <View style={cel_s.milestoneHeader}>
                  <Star size={16} color={colors.warning} fill={colors.warning} />
                  <Text style={cel_s.milestoneTitle}>TODAY'S MILESTONE</Text>
                </View>
                <Text style={cel_s.milestoneTxt}>
                  You crushed{' '}
                  <Text style={cel_s.milestoneHighlight}>{summary.exercises.length} exercise{summary.exercises.length !== 1 ? 's' : ''}</Text>
                  {' '}and logged{' '}
                  <Text style={cel_s.milestoneHighlight}>{summary.completedSets} completed sets</Text>
                  {' '}totalling{' '}
                  <Text style={cel_s.milestoneHighlight}>{summary.totalVolumeKg} kg</Text>
                  {' '}of volume in{' '}
                  <Text style={cel_s.milestoneHighlight}>{durationMin > 0 ? `${durationMin} min` : 'under a minute'}</Text>.
                  Keep the streak alive! 🔥
                </Text>
              </LinearGradient>
            </View>

            {/* Personal Records */}
            {prs.length > 0 && (
              <View style={cel_s.section}>
                <View style={cel_s.sectionHeader}>
                  <Zap size={14} color={colors.primaryDark} />
                  <Text style={cel_s.sectionTitle}>PERSONAL RECORDS SET</Text>
                </View>
                {prs.map((pr, i) => (
                  <PRBoostBar key={`${pr.exerciseName}-${i}`} pr={pr} delay={400 + i * 150} />
                ))}
              </View>
            )}

            {/* ── DUAL CELEBRATION ACTION BUTTONS: SAVE & SHARE ── */}
            <View style={cel_s.actionButtonsRow}>
              {/* Save / Favorite Routine Button */}
              <Pressable
                onPress={handleToggleFav}
                style={[cel_s.favBtn, isFav && cel_s.favBtnActive]}
                accessibilityRole="button"
                accessibilityLabel="Save routine to favorites"
              >
                <Animated.View style={heartAnimStyle}>
                  <Heart
                    size={17}
                    color={isFav ? '#FFFFFF' : colors.primaryDark}
                    fill={isFav ? '#FFFFFF' : 'transparent'}
                    strokeWidth={2.2}
                  />
                </Animated.View>
                <Text style={[cel_s.favBtnText, isFav && cel_s.favBtnTextActive]}>
                  {isFav ? 'Saved Routine ♥' : 'Save Routine'}
                </Text>
              </Pressable>

              {/* Share Button */}
              <Pressable
                onPress={() => setShareModalVisible(true)}
                style={cel_s.shareBtn}
                accessibilityRole="button"
                accessibilityLabel="Share workout achievement on social media"
              >
                <Share2 size={16} color={colors.primaryDark} strokeWidth={2.2} />
                <Text style={cel_s.shareBtnText}>Share Story</Text>
              </Pressable>
            </View>

            {/* Close / Return button */}
            <Pressable onPress={onClose} style={cel_s.closeBtn}>
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                style={cel_s.closeBtnGrad}
              >
                <Text style={cel_s.closeBtnTxt}>BACK TO HOME</Text>
              </LinearGradient>
            </Pressable>
          </ScrollView>
        </Animated.View>
      </View>

      {/* ── SOCIAL SHARE STORY CARD MODAL ── */}
      <Modal
        visible={shareModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setShareModalVisible(false)}
      >
        <View style={cel_s.shareModalBackdrop}>
          <View style={cel_s.storyCardContainer}>
            {/* Close modal X */}
            <Pressable
              style={cel_s.storyCloseBtn}
              onPress={() => setShareModalVisible(false)}
              hitSlop={10}
            >
              <X size={18} color="#FFFFFF" strokeWidth={2.5} />
            </Pressable>

            {/* Visual Social Story Card (9:16 Ratio Aesthetic) */}
            <View style={cel_s.storyCard}>
              <LinearGradient
                colors={['#F9D6DE', '#EDD7CA', '#D7E5D0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />

              {/* Top Editorial Kicker */}
              <View style={cel_s.storyHeader}>
                <View style={cel_s.storyBrandBadge}>
                  <Sparkles size={11} color={colors.primaryDark} />
                  <Text style={cel_s.storyBrandText}>FORTYWELL</Text>
                </View>
                <Text style={cel_s.storyDateText}>
                  {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
              </View>

              {/* Story Trophy & Title */}
              <View style={cel_s.storyMainBody}>
                <LinearGradient
                  colors={['#F39EB0', '#C9465B']}
                  style={cel_s.storyTrophyRing}
                >
                  <Trophy size={32} color="#FFFFFF" fill="rgba(255,255,255,0.3)" />
                </LinearGradient>
                <Text style={cel_s.storyKicker}>SESSION COMPLETE</Text>
                <Text style={cel_s.storyWorkoutTitle} numberOfLines={2}>
                  {summary.workoutTitle}
                </Text>

                {/* 3 Story Stats Badges */}
                <View style={cel_s.storyStatsGrid}>
                  <View style={cel_s.storyStatItem}>
                    <Text style={cel_s.storyStatVal}>{summary.completedSets}</Text>
                    <Text style={cel_s.storyStatLbl}>SETS</Text>
                  </View>
                  <View style={cel_s.storyStatDivider} />
                  <View style={cel_s.storyStatItem}>
                    <Text style={cel_s.storyStatVal}>{durationStr}</Text>
                    <Text style={cel_s.storyStatLbl}>TIME</Text>
                  </View>
                  <View style={cel_s.storyStatDivider} />
                  <View style={cel_s.storyStatItem}>
                    <Text style={cel_s.storyStatVal}>{summary.totalVolumeKg}kg</Text>
                    <Text style={cel_s.storyStatLbl}>VOLUME</Text>
                  </View>
                </View>

                <View style={cel_s.storyTaglineBox}>
                  <Text style={cel_s.storyTagline}>
                    "Move with your cycle, not against it."
                  </Text>
                </View>
              </View>

              {/* Story Footer */}
              <View style={cel_s.storyFooter}>
                <Text style={cel_s.storyDomain}>fortywell-app.vercel.app</Text>
              </View>
            </View>

            {/* Social Share Actions */}
            <View style={cel_s.storyActionsGroup}>
              <Pressable style={cel_s.shareStoryBtn} onPress={handleNativeShare}>
                <LinearGradient
                  colors={['#F39EB0', '#C9465B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={cel_s.shareStoryGrad}
                >
                  <Send size={15} color="#FFFFFF" strokeWidth={2.2} />
                  <Text style={cel_s.shareStoryBtnText}>Share to Socials / Apps</Text>
                </LinearGradient>
              </Pressable>

              <Pressable style={cel_s.copyTextBtn} onPress={handleCopyText}>
                {copiedText ? (
                  <>
                    <Check size={14} color={colors.sageDark} strokeWidth={2.5} />
                    <Text style={[cel_s.copyTextBtnText, { color: colors.sageDark }]}>Copied to Clipboard! ✓</Text>
                  </>
                ) : (
                  <>
                    <Copy size={14} color={colors.textPrimary} />
                    <Text style={cel_s.copyTextBtnText}>Copy Text Summary</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const cel_s = StyleSheet.create({
  confettiLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(28,21,17,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FAF8F5',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: H * 0.88,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  headerBox: {
    alignItems: 'center',
    marginBottom: 24,
  },
  trophyCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#C96374',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  congrats: {
    fontSize: 26,
    fontFamily: fontFamilies.soria,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subLine: {
    fontSize: 13,
    fontFamily: fontFamilies.monoRegular,
    color: colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  milestoneCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(201,99,116,0.15)',
  },
  milestoneGrad: {
    padding: 16,
  },
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  milestoneTitle: {
    fontSize: 9,
    fontFamily: fontFamilies.monoBold,
    color: colors.warning,
    letterSpacing: 1.2,
  },
  milestoneTxt: {
    fontSize: 13,
    fontFamily: fontFamilies.monoRegular,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  milestoneHighlight: {
    fontFamily: fontFamilies.monoBold,
    color: colors.textPrimary,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: fontFamilies.monoBold,
    color: colors.primaryDark,
    letterSpacing: 1.2,
  },
  closeBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  closeBtnGrad: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  closeBtnTxt: {
    fontSize: 13,
    fontFamily: fontFamilies.monoBold,
    color: '#FFF',
    letterSpacing: 1.5,
  },

  // Notification Banner
  favNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(201, 70, 91, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(201, 70, 91, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 14,
  },
  favNoticeText: {
    fontSize: 11.5,
    fontFamily: fontFamilies.monoBold,
    color: colors.primaryDark,
    letterSpacing: 0.3,
  },

  // Dual Action Buttons: Save & Share
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  favBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(201, 70, 91, 0.3)',
    ...Platform.select({
      ios: { shadowColor: colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 },
      android: { elevation: 2 },
      default: {},
    }),
  },
  favBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  favBtnText: {
    fontSize: 12,
    fontFamily: fontFamilies.monoBold,
    color: colors.primaryDark,
    letterSpacing: 0.5,
  },
  favBtnTextActive: {
    color: '#FFFFFF',
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(101, 78, 60, 0.15)',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
      android: { elevation: 2 },
      default: {},
    }),
  },
  shareBtnText: {
    fontSize: 12,
    fontFamily: fontFamilies.monoBold,
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },

  // Social Share Story Modal
  shareModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(25, 18, 15, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 22,
  },
  storyCardContainer: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },
  storyCloseBtn: {
    alignSelf: 'flex-end',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  storyCard: {
    width: '100%',
    height: 440,
    borderRadius: 28,
    padding: 22,
    overflow: 'hidden',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.25, shadowRadius: 24 },
      android: { elevation: 12 },
      default: {},
    }),
  },
  storyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  storyBrandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  storyBrandText: {
    fontSize: 10,
    fontFamily: fontFamilies.monoBold,
    color: colors.primaryDark,
    letterSpacing: 1.5,
  },
  storyDateText: {
    fontSize: 10.5,
    fontFamily: fontFamilies.monoMedium,
    color: colors.textTertiary,
  },
  storyMainBody: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  storyTrophyRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  storyKicker: {
    fontSize: 9.5,
    fontFamily: fontFamilies.monoBold,
    color: colors.primaryDark,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  storyWorkoutTitle: {
    fontSize: 20,
    fontFamily: fontFamilies.soria,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  storyStatsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 14,
  },
  storyStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  storyStatVal: {
    fontSize: 15,
    fontFamily: fontFamilies.monoBold,
    color: colors.textPrimary,
  },
  storyStatLbl: {
    fontSize: 8.5,
    fontFamily: fontFamilies.monoMedium,
    color: colors.textTertiary,
    letterSpacing: 0.8,
    marginTop: 2,
  },
  storyStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(101, 78, 60, 0.12)',
    marginHorizontal: 8,
  },
  storyTaglineBox: {
    paddingHorizontal: 10,
  },
  storyTagline: {
    fontSize: 11.5,
    fontFamily: fontFamilies.sansRegular,
    fontStyle: 'italic',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  storyFooter: {
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(101, 78, 60, 0.1)',
    paddingTop: 8,
  },
  storyDomain: {
    fontSize: 10,
    fontFamily: fontFamilies.monoRegular,
    color: colors.textTertiary,
    letterSpacing: 0.8,
  },

  // Action group under story card
  storyActionsGroup: {
    width: '100%',
    marginTop: 16,
    gap: 10,
  },
  shareStoryBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  shareStoryGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  shareStoryBtnText: {
    fontSize: 13,
    fontFamily: fontFamilies.monoBold,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  copyTextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(101, 78, 60, 0.15)',
  },
  copyTextBtnText: {
    fontSize: 12,
    fontFamily: fontFamilies.monoBold,
    color: colors.textPrimary,
  },
});
