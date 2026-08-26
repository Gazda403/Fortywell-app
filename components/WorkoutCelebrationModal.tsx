/**
 * WorkoutCelebrationModal
 * ─────────────────────────────────────────────────────────────────────────────
 * Shown after a user confirms "Finish Workout". Displays:
 *   • Pink confetti burst (canvas-painted particles via Reanimated)
 *   • Workout stats summary card
 *   • Today's milestone badge
 *   • Personal Record (PR) highlights with a progress boost bar
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  Dimensions,
  ScrollView,
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
import { Trophy, Zap, Star, CheckCircle2, Flame, Target } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { fontFamilies } from '../theme/typography';
import { WorkoutSummaryData } from './ActiveWorkoutScreen';

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
  const sheetY = useSharedValue(H);
  const headerScale = useSharedValue(0.7);
  const headerOpacity = useSharedValue(0);



  useEffect(() => {
    if (visible) {
      setActive(true);
      sheetY.value = withSpring(0, { damping: 22, stiffness: 120 });
      headerScale.value = withDelay(200, withSpring(1, { damping: 12, stiffness: 150 }));
      headerOpacity.value = withDelay(150, withTiming(1, { duration: 400 }));
    } else {
      setActive(false);
      sheetY.value = withTiming(H, { duration: 280 });
      headerScale.value = 0.7;
      headerOpacity.value = 0;
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetY.value }],
  }));

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ scale: headerScale.value }],
  }));

  if (!visible || !summary) return null;

  const prs = detectPRs(summary);
  const durationMin = Math.floor(summary.durationSeconds / 60);
  const durationSec = summary.durationSeconds % 60;
  const durationStr = `${durationMin}:${String(durationSec).padStart(2, '0')}`;

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
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

            {/* Close button */}
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
});
