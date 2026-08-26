import React, { useState, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
  Dimensions,
  ImageBackground,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  withSpring,
  withTiming,
  interpolate,
  interpolateColor,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  Play,
  Clock,
  ShieldCheck,
  Sparkles,
  Flame,
  ChevronRight,
  User,
  HeartPulse,
  Compass,
  ArrowRight,
  RotateCcw,
  Plus,
  Bot,
  Flower2,
  LogOut,
  X,
  Gift,
  CheckCircle2,
  Tag,
  ShoppingBag,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { typography, fontFamilies } from '../theme/typography';
import { OnboardingAnswers } from '../types/onboarding';
import heroRunnerImage from '../assets/hero_runner.png';
import { GardenView } from '../components/GardenView';
import { useWorkouts, Workout } from '../hooks/useWorkouts';
import { WorkoutDetailModal } from '../components/WorkoutDetailModal';
import { getPersonalizedRecommendations } from '../lib/recommendationEngine';
import { QuickLaunchSheet } from '../components/QuickLaunchSheet';
import { ActiveWorkoutScreen, WorkoutSummary } from '../components/ActiveWorkoutScreen';
import { MorningRoutineCard } from '../components/MorningRoutineCard';
import { ExerciseDetailModal } from '../components/ExerciseDetailModal';
import { CoachScreen } from '../components/CoachScreen';
import { RhythmScreen } from '../components/RhythmScreen';
import { WeeklyRecapModal, WeeklyRecapData } from '../components/WeeklyRecapModal';
import { SpotlightTour, TargetRectsMap } from '../components/SpotlightTour';
import { useUserData } from '../hooks/useUserData';
import { StoreScreen } from '../components/StoreScreen';
import { WeeklyPlanSection } from '../components/WeeklyPlanSection';
import { useWeeklyPlan } from '../lib/useWeeklyPlan';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface HomeScreenProps {
  answers?: OnboardingAnswers | null;
  onRetakeQuiz?: () => void;
  onSignOut?: () => void;
}

interface WorkoutItem {
  id: string;
  tag: string;
  tagColor?: string;
  title: string;
  duration: string;
  level: string;
  focus: string;
  equipment: string;
  gradientColors: [string, string];
}

const PERSONALIZED_WORKOUTS: WorkoutItem[] = [
  {
    id: 'w1',
    tag: 'RECOMMENDED TODAY',
    tagColor: colors.primaryDark,
    title: 'Spine & Hip Decompression',
    duration: '18 min',
    level: 'Gentle Pacing',
    focus: 'Hips • Neck • Lower Back',
    equipment: 'Zero Equipment',
    gradientColors: ['#F2D0D5', '#D8E8CF'],
  },
  {
    id: 'w2',
    tag: 'FUNCTIONAL STRENGTH',
    tagColor: colors.sageDark,
    title: 'Core & Pelvic Floor Tone',
    duration: '22 min',
    level: 'Adaptive Flow',
    focus: 'Deep Core • Posture',
    equipment: 'Bands Optional',
    gradientColors: ['#EAD8C0', '#D5E2D0'],
  },
  {
    id: 'w3',
    tag: 'MORNING SESSION',
    tagColor: colors.primaryDark,
    title: 'Full Body Joint Fluidity',
    duration: '15 min',
    level: 'Low Impact',
    focus: 'Knees • Shoulders',
    equipment: 'Bodyweight',
    gradientColors: ['#F5D6DC', '#E6DAF0'],
  },
  {
    id: 'w4',
    tag: 'NIGHT TIME RESTORATIVE',
    tagColor: colors.textSecondary,
    title: 'Nervous System Reset',
    duration: '12 min',
    level: 'Restorative',
    focus: 'Vagus Nerve • Calming',
    equipment: 'Bed / Mat',
    gradientColors: ['#E3DEC3', '#D0E3DB'],
  },
];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  answers,
  onRetakeQuiz,
  onSignOut,
}) => {
  const [selectedTab, setSelectedTab] = useState<'today' | 'coach' | 'progress' | 'garden'>('today');
  const { workouts, loading: workoutsLoading } = useWorkouts();
  const {
    userProfile,
    currentWeekDays,
    lifetimeStats,
    markWalkthroughCompleted,
    verifyEmailWithOtp,
    resendVerificationEmail,
    loading: userLoading,
  } = useUserData(answers);

  // ── Adaptive Weekly Plan ───────────────────────────────────────────────────
  const { plan: weeklyPlan, loading: weeklyPlanLoading, refresh: refreshWeeklyPlan } =
    useWeeklyPlan(workouts, answers, userProfile.greetingName.replace('Hi, ', ''));

  // Compute set of completed workout slugs for this week (so cards show green tick)
  const completedThisWeekSlugs = useMemo(() => {
    const slugSet = new Set<string>();
    currentWeekDays.forEach((d) => {
      if (d.isCompleted && weeklyPlan) {
        // Mark matched slugs as done — best effort without per-day slug tracking
      }
    });
    return slugSet;
  }, [currentWeekDays, weeklyPlan]);
  const [selectedModalWorkout, setSelectedModalWorkout] = useState<Workout | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [quickLaunchVisible, setQuickLaunchVisible] = useState<boolean>(false);
  const [storeVisible, setStoreVisible] = useState<boolean>(false);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>(null);
  const [activeWorkoutVisible, setActiveWorkoutVisible] = useState<boolean>(false);
  const [activeWorkoutData, setActiveWorkoutData] = useState<Workout | null>(null);
  const [exerciseDetailName, setExerciseDetailName] = useState<string | null>(null);
  const [exerciseDetailVisible, setExerciseDetailVisible] = useState<boolean>(false);
  const [profileModalVisible, setProfileModalVisible] = useState<boolean>(false);

  // Email verification & 5% reward state in Profile modal
  const [profileOtpInput, setProfileOtpInput] = useState('');
  const [profileOtpLoading, setProfileOtpLoading] = useState(false);
  const [profileOtpError, setProfileOtpError] = useState<string | null>(null);
  const [profileOtpSuccessBanner, setProfileOtpSuccessBanner] = useState<string | null>(null);
  const [profileResendCooldown, setProfileResendCooldown] = useState(0);
  const [profileResending, setProfileResending] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    if (profileResendCooldown <= 0) return;
    const timer = setInterval(() => {
      setProfileResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [profileResendCooldown]);

  const handleProfileVerifyOtp = async () => {
    if (profileOtpInput.trim().length < 6) {
      setProfileOtpError('Please enter the 6-digit code.');
      return;
    }
    setProfileOtpLoading(true);
    setProfileOtpError(null);
    const res = await verifyEmailWithOtp(profileOtpInput.trim());
    setProfileOtpLoading(false);
    if (res.success) {
      setProfileOtpSuccessBanner('✦ 5% Store Discount Unlocked! Use code FORTY5 at checkout.');
      try { if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (_) {}
    } else {
      setProfileOtpError(res.error || 'Invalid code. Please try again.');
    }
  };

  const handleProfileResend = async () => {
    if (profileResendCooldown > 0 || profileResending) return;
    setProfileResending(true);
    setProfileOtpError(null);
    const res = await resendVerificationEmail();
    setProfileResending(false);
    if (res.success) {
      setProfileResendCooldown(60);
      setProfileOtpSuccessBanner('Verification email sent! Check your inbox.');
    } else {
      setProfileOtpError(res.error || 'Could not resend email.');
    }
  };

  // Guided Spotlight Tour state
  const [tourVisible, setTourVisible] = useState<boolean>(false);
  const [targetRects, setTargetRects] = useState<TargetRectsMap>({});
  // Ensure tour only ever fires ONCE per app mount (lifetime guard — AsyncStorage handles
  // persistence across restarts; this ref prevents double-triggering within a single session).
  const tourShownRef = React.useRef(false);

  // Automatically trigger first-time guided walkthrough on initial landing
  React.useEffect(() => {
    // Only proceed when we have real data from the server (not loading)
    // and user has definitively NOT seen the walkthrough (not just the default 'true' stub)
    if (!userLoading && userProfile.hasSeenWalkthrough === false && !tourShownRef.current) {
      tourShownRef.current = true; // mark so even if effect re-runs it won't double-fire
      const timer = setTimeout(() => {
        setTourVisible(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [userLoading, userProfile.hasSeenWalkthrough]);

  const handleTourComplete = React.useCallback(() => {
    setTourVisible(false);
    markWalkthroughCompleted();
  }, [markWalkthroughCompleted]);

  const handleTourSkip = React.useCallback(() => {
    setTourVisible(false);
    markWalkthroughCompleted();
  }, [markWalkthroughCompleted]);

  const handleReplayTour = React.useCallback(() => {
    setProfileModalVisible(false);
    setTourVisible(true);
  }, []);

  // Weekly Recap Monday Modal
  const [weeklyRecapVisible, setWeeklyRecapVisible] = useState<boolean>(false);
  const [weeklyRecapData, setWeeklyRecapData] = useState<WeeklyRecapData>({
    weekNumber: 2,
    sessionsCompleted: 14,
    totalSessions: 18,
    longestStreak: 5,
    gardenGrowth: 3,
    personalRecords: 2,
    cyclePhase: 'Follicular Phase',
  });

  // Check if today is Monday to present weekly review (only after first week of account creation)
  React.useEffect(() => {
    if (userLoading) return;
    try {
      const now = new Date();
      const isMonday = now.getDay() === 1;

      // Ensure user has completed at least one week with FortyWell
      let isFirstWeek = true;
      if (userProfile?.createdAt) {
        const createdDate = new Date(userProfile.createdAt);
        const ageInDays = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
        if (ageInDays >= 7) {
          isFirstWeek = false;
        }
      } else if (lifetimeStats.totalWorkouts >= 3) {
        isFirstWeek = false;
      }

      if (isFirstWeek) {
        return;
      }

      const weekKey = `recap_${now.getFullYear()}_W${Math.ceil((now.getDate() + 6 - now.getDay()) / 7)}`;
      const hasShown = typeof window !== 'undefined' && window.sessionStorage?.getItem(weekKey);

      if (isMonday && !hasShown) {
        setWeeklyRecapVisible(true);
        if (typeof window !== 'undefined') {
          window.sessionStorage?.setItem(weekKey, 'true');
        }
      }
    } catch (_) {}
  }, [userLoading, userProfile?.createdAt, lifetimeStats.totalWorkouts]);

  const handleOpenExerciseDetail = (name: string) => {
    setExerciseDetailName(name);
    setExerciseDetailVisible(true);
  };

  const launchWorkout = (workout: Workout | null) => {
    setActiveWorkoutData(workout);
    setActiveWorkoutVisible(true);
    setQuickLaunchVisible(false);
    setModalVisible(false);
  };

  // Compute smart recommendations based on quiz answers
  const recommendations = useMemo(() => {
    return getPersonalizedRecommendations(workouts, answers);
  }, [workouts, answers]);

  // Use explicitly selected workout or the algorithmic recommendation
  const featuredWorkout =
    (activeWorkoutId && workouts.find((w) => w.slug === activeWorkoutId)) ||
    recommendations.featuredWorkout;

  const startBtnScale = useSharedValue(1);
  const btnFillProgress = useSharedValue(0);

  const handleStartPressIn = () => {
    startBtnScale.value = withSpring(0.96, { damping: 15, stiffness: 250 });
    btnFillProgress.value = withTiming(1, { duration: 200 });
  };

  const handleStartPressOut = () => {
    startBtnScale.value = withSpring(1, { damping: 15, stiffness: 200 });
    btnFillProgress.value = withTiming(0, { duration: 300 });
  };

  const handleStartWorkout = () => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (_) {}
  };

  const startBtnAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: startBtnScale.value }],
  }));

  // Animated overlay: fills button with rose pink on click
  const btnFillOverlayStyle = useAnimatedStyle(() => ({
    height: `${interpolate(btnFillProgress.value, [0, 1], [0, 100])}%` as any,
    opacity: interpolate(btnFillProgress.value, [0, 0.1, 1], [0, 1, 1]),
    backgroundColor: '#C9465B',
  }));

  // Animated text color: shifts from rose (#C9465B) to white (#FFFFFF)
  const btnTextColorStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      btnFillProgress.value,
      [0, 1],
      ['#C9465B', '#FFFFFF']
    ),
  }));

  // Scroll animations for top bar morphing
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      if (event.contentOffset.y > 45 && !isScrolled) {
        runOnJS(setIsScrolled)(true);
      } else if (event.contentOffset.y <= 45 && isScrolled) {
        runOnJS(setIsScrolled)(false);
      }
    },
  });

  const stickyNavAnimStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [25, 60],
      [0, 1],
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      scrollY.value,
      [25, 60],
      [-16, 0],
      Extrapolation.CLAMP
    );
    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  const headerStoreBtnAnimStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [15, 55],
      [1, 0],
      Extrapolation.CLAMP
    );
    const scale = interpolate(
      scrollY.value,
      [0, 55],
      [1, 0.85],
      Extrapolation.CLAMP
    );
    return {
      opacity,
      transform: [{ scale }],
    };
  });

  // Dynamic user details
  const timeCommitmentLabel = answers?.time_commitment === '15_min'
    ? '15 min'
    : answers?.time_commitment === '45_min'
    ? '45 min'
    : '20–30 min';

  const weeklyFreq = answers?.weekly_frequency || '3–4 days';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* ── TAB VIEWS (PRESERVED FOR ZERO-LATENCY INSTANT NAVIGATION) ── */}
      <View style={[styles.tabContainer, { display: selectedTab === 'garden' ? 'flex' : 'none' }]}>
        <GardenView onStartWorkout={handleStartWorkout} />
      </View>
      <View style={[styles.tabContainer, { display: selectedTab === 'coach' ? 'flex' : 'none' }]}>
        <CoachScreen answers={answers} />
      </View>
      <View style={[styles.tabContainer, { display: selectedTab === 'progress' ? 'flex' : 'none' }]}>
        <RhythmScreen
          answers={answers}
          onStartWorkout={() => {
            setQuickLaunchVisible(true);
            try {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }
            } catch (_) {}
          }}
        />
      </View>
      <View style={[styles.tabContainer, { display: selectedTab === 'today' ? 'flex' : 'none' }]}>
        {/* ── STICKY UPPER NAV BAR ON SCROLL ── */}
        <Animated.View
          style={[styles.stickyNavBar, stickyNavAnimStyle]}
          pointerEvents={isScrolled ? 'auto' : 'none'}
        >
          <View style={styles.stickyNavLeft}>
            <View style={styles.stickyNavDot} />
            <Text style={styles.stickyNavKicker}>
              {new Date().toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()} • PROTOCOL ACTIVE
            </Text>
          </View>

          <View style={styles.stickyNavRight}>
            {/* Store button in sticky nav */}
            <Pressable
              style={styles.stickyStoreBtn}
              onPress={() => {
                setStoreVisible(true);
                try {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                } catch (_) {}
              }}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="FortyWell Store"
            >
              <LinearGradient
                colors={['#F39EB0', '#C9465B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.stickyStoreGradient}
              >
                <ShoppingBag size={16} color="#FFFFFF" strokeWidth={2.2} />
              </LinearGradient>
            </Pressable>

            {/* Avatar in sticky nav */}
            <Pressable
              style={styles.stickyAvatarBtn}
              onPress={() => setProfileModalVisible(true)}
              hitSlop={8}
              accessibilityLabel="Profile settings"
            >
              <Text style={styles.stickyAvatarText}>{userProfile.monogram}</Text>
            </Pressable>
          </View>
        </Animated.View>

        <Animated.ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
        >
          {/* ── TOP LUXURY EDITORIAL HEADER ── */}
        <View style={styles.header}>
          <View style={styles.headerTextWrap}>
            <View style={styles.kickerRow}>
              <View style={styles.activeDot} />
              <Text style={styles.headerKicker}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()} • PROTOCOL ACTIVE
              </Text>
            </View>
            <Text style={styles.greetingTitle}>{userProfile.greetingName}</Text>
            <Text style={styles.greetingSubtitle}>
              Your nervous system is primed for restorative movement.
            </Text>
          </View>

          <View style={styles.headerRightButtons}>
            {/* Store Button: small pink gradient with white store icon */}
            <Animated.View style={headerStoreBtnAnimStyle}>
              <Pressable
                style={styles.storeHeaderButton}
                onPress={() => {
                  setStoreVisible(true);
                  try {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                  } catch (_) {}
                }}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="FortyWell Store"
              >
                <LinearGradient
                  colors={['#F39EB0', '#C9465B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.storeHeaderGradient}
                >
                  <ShoppingBag size={18} color="#FFFFFF" strokeWidth={2.2} />
                </LinearGradient>
              </Pressable>
            </Animated.View>

            {/* Luxury Monogram / Avatar badge */}
            <Pressable
              style={styles.avatarButton}
              onPress={() => setProfileModalVisible(true)}
              hitSlop={8}
              accessibilityLabel="Profile settings or account options"
            >
              <View style={styles.avatarInner}>
                <Text style={styles.avatarMonogram}>{userProfile.monogram}</Text>
              </View>
              <View style={styles.sparkleBadge}>
                <Sparkles size={10} color={colors.textInverse} />
              </View>
            </Pressable>
          </View>
        </View>

        {/* ── IMAGE BACKGROUND SEGMENT: WEEK 1 RHYTHM + STATS ── */}
        <View style={styles.imageBackgroundSegment}>
          <ImageBackground
            source={heroRunnerImage}
            style={styles.heroSegmentBg}
            imageStyle={styles.heroSegmentBgImage}
            resizeMode="cover"
          >
            {/* ── 3D FLOATING WEEK CALENDAR STRIP ── */}
            <View style={styles.weekCard}>
              <View style={styles.weekHeaderRow}>
                <Text style={styles.weekKicker}>WEEKLY RHYTHM</Text>
                <Text style={styles.weekSubtext}>Goal: {userProfile.weeklyFrequency}</Text>
              </View>

              <View style={styles.daysRow}>
                {currentWeekDays.map((d) => (
                  <View
                    key={d.dayLabel}
                    style={[
                      styles.dayCol,
                      d.isToday && styles.dayColToday,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayNameText,
                        d.isToday && styles.dayNameTextToday,
                      ]}
                    >
                      {d.dayLabel}
                    </Text>
                    <View
                      style={[
                        styles.dayNumBubble,
                        d.isCompleted && styles.dayNumBubbleCompleted,
                        d.isToday && styles.dayNumBubbleToday,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayNumText,
                          d.isToday && styles.dayNumTextToday,
                          d.isCompleted && styles.dayNumTextCompleted,
                        ]}
                      >
                        {d.dayNum}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* ── READINESS / METRICS STRIP (3D depth) ── */}
            <View
              style={styles.metricsStrip}
              onLayout={(e) => {
                const { x, y, width, height } = e.nativeEvent.layout;
                setTargetRects((prev) => ({
                  ...prev,
                  readinessStrip: {
                    x: x || 20,
                    y: Math.max(220, y + 170),
                    width: width || SCREEN_W - 40,
                    height: height || 75,
                  },
                }));
              }}
            >
              <View style={styles.metricCard}>
                <View style={styles.metricIconCircle}>
                  <HeartPulse size={14} color={colors.primary} />
                </View>
                <Text style={styles.metricValue}>{recommendations.readinessScore}%</Text>
                <Text style={styles.metricLabel}>Readiness</Text>
              </View>

              <View style={styles.metricCard}>
                <View style={[styles.metricIconCircle, { backgroundColor: colors.sageSoft }]}>
                  <ShieldCheck size={14} color={colors.sageDark} />
                </View>
                <Text style={styles.metricValue}>{recommendations.pacingLabel}</Text>
                <Text style={styles.metricLabel}>Pacing</Text>
              </View>

              <View style={styles.metricCard}>
                <View style={styles.metricIconCircle}>
                  <Flame size={14} color={colors.primary} />
                </View>
                <Text style={styles.metricValue}>
                  {currentWeekDays.filter((d) => d.isCompleted).length} / {answers?.weekly_frequency ? (answers.weekly_frequency.split('–')[0] || 3) : 3}
                </Text>
                <Text style={styles.metricLabel}>Sessions</Text>
              </View>
            </View>
          </ImageBackground>
        </View>

        {/* ── HERO GRADIENT CARD: START TODAY'S WORKOUT ── */}
        <View
          style={styles.heroSection}
          onLayout={(e) => {
            const { x, y, width, height } = e.nativeEvent.layout;
            setTargetRects((prev) => ({
              ...prev,
              todaySessions: {
                x: x || 16,
                y: Math.max(340, y + 260),
                width: width || SCREEN_W - 32,
                height: Math.min(height || 190, 240),
              },
            }));
          }}
        >
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionKicker}>
              {answers ? 'CALIBRATED TO YOUR PROFILE' : "TODAY'S FOCUS SESSION"}
            </Text>
            <View style={styles.safeTag}>
              <ShieldCheck size={11} color={colors.sageDark} />
              <Text style={styles.safeTagText}>Joint-Safe</Text>
            </View>
          </View>

          <View style={styles.hero3DCard}>
            {/* Rich strong rose gradient */}
            <LinearGradient
              colors={['#F39EB0', '#C9465B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />

            <View style={styles.heroCardBody}>
              <View style={styles.heroTagRow}>
                <View style={styles.primaryPill}>
                  <Text style={styles.primaryPillText}>
                    {answers ? 'QUIZ MATCH #1' : 'RECOMMENDED TODAY'}
                  </Text>
                </View>
                <View style={styles.timeTag}>
                  <Clock size={12} color="rgba(255,255,255,0.9)" />
                  <Text style={styles.timeTagText}>
                    {featuredWorkout ? `${featuredWorkout.duration_minutes} Mins` : '15 Mins'}
                  </Text>
                </View>
              </View>

              <Text style={styles.heroCardTitle}>
                {featuredWorkout ? featuredWorkout.title : 'Knee-Safe Core & Glute Ignition'}
              </Text>
              <Text style={styles.heroCardSubtitle} numberOfLines={3}>
                {featuredWorkout ? featuredWorkout.description : 'High-tension glute and core bracing routine designed to fire up the posterior chain.'}
              </Text>

              {/* Dynamic personalized reason pill */}
              <View style={styles.reasonPillWrap}>
                <Sparkles size={11} color="#FFFFFF" />
                <Text style={styles.reasonPillText}>{recommendations.matchReason}</Text>
              </View>

              {/* Badges row */}
              <View style={styles.heroBadgesRow}>
                <View style={styles.specBadge}>
                  <Text style={styles.specBadgeText}>
                    {featuredWorkout ? featuredWorkout.equipment.replace('_', ' ').toUpperCase() : 'BODYWEIGHT'}
                  </Text>
                </View>
                <View style={styles.specBadge}>
                  <Text style={styles.specBadgeText}>
                    {featuredWorkout?.energy_level.toUpperCase() || 'MODERATE'} ENERGY
                  </Text>
                </View>
                <View style={styles.specBadge}>
                  <Text style={styles.specBadgeText}>
                    {featuredWorkout?.main_blocks?.length || 3} BLOCKS
                  </Text>
                </View>
              </View>

              {/* CTA Button */}
              <View style={styles.startBtnWrap}>
                <Pressable
                  onPressIn={handleStartPressIn}
                  onPressOut={handleStartPressOut}
                  onPress={() => {
                    if (featuredWorkout) {
                      launchWorkout(featuredWorkout);
                    }
                  }}
                  style={styles.startHeroButton}
                  accessibilityRole="button"
                  accessibilityLabel="Start workout session"
                >
                  <Animated.View style={[styles.btnFillOverlay, btnFillOverlayStyle]} />
                  <Play size={16} color="#C9465B" fill="#C9465B" />
                  <Animated.Text style={[styles.startHeroBtnText, btnTextColorStyle]}>
                    VIEW &amp; START SESSION
                  </Animated.Text>
                  <View style={styles.playIconBubble}>
                    <ArrowRight size={14} color="#C9465B" />
                  </View>
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        {/* ── ADAPTIVE WEEKLY PLAN SECTION ── */}
        <WeeklyPlanSection
          plan={weeklyPlan}
          loading={weeklyPlanLoading}
          completedSlugs={completedThisWeekSlugs}
          onWorkoutPress={(workout) => {
            setSelectedModalWorkout(workout);
            setModalVisible(true);
            try {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            } catch (_) {}
          }}
          onRefresh={refreshWeeklyPlan}
        />

        {/* ── SIDEWAYS HORIZONTAL SCROLL CAROUSEL: PERSONALIZED WORKOUTS ── */}
        <View style={styles.carouselSection}>
          <View style={styles.carouselHeaderRow}>
            <View>
              <Text style={styles.sectionKicker}>CURATED LIBRARY</Text>
              <Text style={styles.carouselSectionTitle}>
                Your Personalized Workouts
              </Text>
            </View>
            <Pressable
              style={styles.seeAllBtn}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="See all personalized workouts"
            >
              <Text style={styles.seeAllText}>Explore</Text>
              <ChevronRight size={14} color={colors.primary} />
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScrollList}
            snapToInterval={254}
            decelerationRate="fast"
          >
            {recommendations.curatedWorkouts.slice(0, 10).map((item, idx) => {
              const isSelected = featuredWorkout?.slug === item.slug;
              return (
                <Pressable
                  key={item.slug}
                  onPress={() => {
                    setActiveWorkoutId(item.slug);
                    setSelectedModalWorkout(item);
                    setModalVisible(true);
                    try {
                      if (Platform.OS !== 'web') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                    } catch (_) {}
                  }}
                  style={[
                    styles.workoutCard3D,
                    isSelected && styles.workoutCard3DSelected,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.title}, ${item.duration_minutes} mins`}
                >
                  <LinearGradient
                    colors={isSelected ? ['#F5BAC6', '#E28C9B'] : ['#F2D0D5', '#D8E8CF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                  />

                  {/* Top card tag */}
                  <View style={styles.cardTagRow}>
                    <Text style={[styles.cardTagText, { color: isSelected ? '#FFFFFF' : colors.primaryDark }]}>
                      {idx === 0 && answers ? 'TOP MATCH' : item.equipment.replace('_', ' ').toUpperCase()}
                    </Text>
                    <View style={styles.cardDurationBadge}>
                      <Text style={styles.cardDurationText}>{item.duration_minutes} min</Text>
                    </View>
                  </View>

                  {/* Card Title */}
                  <Text style={[styles.cardItemTitle, isSelected && { color: '#FFFFFF' }]} numberOfLines={2}>
                    {item.title}
                  </Text>

                  <View style={styles.cardFooter}>
                    <Text style={[styles.cardFocusText, isSelected && { color: 'rgba(255,255,255,0.9)' }]}>
                      {item.joint_sensitivities_safe?.length > 0
                        ? `${item.joint_sensitivities_safe[0].toUpperCase()} SAFE`
                        : 'JOINT SAFE'}
                    </Text>
                    <View style={[styles.cardPlayBtn, isSelected && styles.cardPlayBtnActive]}>
                      <ChevronRight size={12} color={isSelected ? '#C9465B' : colors.textPrimary} />
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* ── MORNING ANCHOR ROUTINE CARD ── */}
        <MorningRoutineCard onOpenExerciseDetail={handleOpenExerciseDetail} />

        {/* Retake quiz subtle link at bottom */}
        {onRetakeQuiz && (
          <View style={styles.retakeRow}>
            <Pressable
              onPress={onRetakeQuiz}
              style={styles.retakeBtn}
              hitSlop={10}
            >
              <RotateCcw size={12} color={colors.textTertiary} />
              <Text style={styles.retakeText}>Recalibrate Profile & Quiz</Text>
            </Pressable>
          </View>
        )}

          {/* Bottom padding for floating dock */}
          <View style={{ height: 90 }} />
        </Animated.ScrollView>
      </View>

      {/* ── WORKOUT DETAIL MODAL ── */}
      <WorkoutDetailModal
        workout={selectedModalWorkout}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onStart={(w) => {
          launchWorkout(w);
        }}
      />

      {/* ── EXERCISE DETAIL MODAL (FOR MORNING STRETCHES & EXERCISES) ── */}
      <ExerciseDetailModal
        visible={exerciseDetailVisible}
        exerciseName={exerciseDetailName || ''}
        onClose={() => setExerciseDetailVisible(false)}
      />

      {/* ── PROFILE & ACCOUNT MODAL ── */}
      <Modal
        visible={profileModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => setProfileModalVisible(false)}
          />
          <View style={styles.profileModalCard}>
            {/* Header close button */}
            <Pressable
              style={styles.modalCloseBtn}
              onPress={() => setProfileModalVisible(false)}
              hitSlop={10}
            >
              <X size={18} color={colors.textTertiary} />
            </Pressable>

            {/* Avatar & Names */}
            <View style={styles.profileAvatarLarge}>
              <Text style={styles.profileAvatarText}>{userProfile.monogram}</Text>
            </View>
            <Text style={styles.profileModalName}>{userProfile.fullName || 'Member'}</Text>
            {userProfile.email ? (
              <Text style={styles.profileModalEmail}>{userProfile.email}</Text>
            ) : null}

            {/* Profile summary info */}
            <View style={styles.profilePillGroup}>
              <View style={styles.profileInfoPill}>
                <Text style={styles.profileInfoPillLabel}>Cadence</Text>
                <Text style={styles.profileInfoPillVal}>{userProfile.weeklyFrequency || '3–4 days'}</Text>
              </View>
              <View style={styles.profileInfoPill}>
                <Text style={styles.profileInfoPillLabel}>Daily Window</Text>
                <Text style={styles.profileInfoPillVal}>{userProfile.timeCommitment ? userProfile.timeCommitment.replace('_', ' ') : '15–30 min'}</Text>
              </View>
            </View>

            {/* ── 5% STORE DISCOUNT & EMAIL VERIFICATION REWARD CARD ── */}
            {userProfile.isEmailVerified || profileOtpSuccessBanner ? (
              <View style={styles.verifiedRewardCard}>
                <View style={styles.verifiedRewardHeader}>
                  <Sparkles size={14} color={colors.rose} />
                  <Text style={styles.verifiedRewardBadge}>✦ 5% STORE DISCOUNT ACTIVE</Text>
                </View>
                <Text style={styles.verifiedRewardTitle}>Member Benefit Unlocked</Text>
                <Text style={styles.verifiedRewardDesc}>
                  Your verified email grants you 5% off all upcoming FortyWell store drops & gear.
                </Text>
                <Pressable
                  style={styles.promoCodeBox}
                  onPress={() => {
                    setCodeCopied(true);
                    setTimeout(() => setCodeCopied(false), 2500);
                    try { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (_) {}
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Copy store discount promo code"
                >
                  <Text style={styles.promoCodeText}>FORTY5</Text>
                  <View style={styles.promoCodeTag}>
                    <Text style={styles.promoCodeTagText}>{codeCopied ? 'Copied! ✓' : 'Tap to Copy'}</Text>
                  </View>
                </Pressable>
              </View>
            ) : (
              <View style={styles.unverifiedRewardCard}>
                <View style={styles.unverifiedRewardHeader}>
                  <Gift size={14} color={colors.rose} />
                  <Text style={styles.unverifiedRewardKicker}>OPTIONAL REWARD • 5% OFF</Text>
                </View>
                <Text style={styles.unverifiedRewardTitle}>Unlock 5% Store Discount</Text>
                <Text style={styles.unverifiedRewardDesc}>
                  Enter the 6-digit code from your email to unlock 5% off our upcoming store.
                </Text>

                <View style={styles.profileOtpInputRow}>
                  <TextInput
                    style={styles.profileOtpInput}
                    value={profileOtpInput}
                    onChangeText={(t) => {
                      setProfileOtpInput(t.replace(/[^0-9]/g, '').slice(0, 6));
                      if (profileOtpError) setProfileOtpError(null);
                    }}
                    placeholder="6-digit code"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="numeric"
                    maxLength={6}
                  />
                  <Pressable
                    style={[
                      styles.profileOtpBtn,
                      (profileOtpInput.length < 6 || profileOtpLoading) && styles.profileOtpBtnDisabled,
                    ]}
                    onPress={handleProfileVerifyOtp}
                    disabled={profileOtpInput.length < 6 || profileOtpLoading}
                  >
                    {profileOtpLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.profileOtpBtnText}>Unlock</Text>
                    )}
                  </Pressable>
                </View>

                {profileOtpError ? (
                  <Text style={styles.profileOtpErrorText}>{profileOtpError}</Text>
                ) : null}
                {profileOtpSuccessBanner ? (
                  <Text style={styles.profileOtpSuccessText}>{profileOtpSuccessBanner}</Text>
                ) : null}

                <Pressable
                  style={styles.profileResendLink}
                  onPress={handleProfileResend}
                  disabled={profileResendCooldown > 0 || profileResending}
                >
                  <Text style={styles.profileResendLinkText}>
                    {profileResending
                      ? 'Sending email...'
                      : profileResendCooldown > 0
                      ? `Resend code in ${profileResendCooldown}s`
                      : 'Send or resend code to my email'}
                  </Text>
                </Pressable>
              </View>
            )}

            <View style={styles.profileDivider} />

            {/* Action buttons */}
            <Pressable
              style={styles.profileActionBtn}
              onPress={handleReplayTour}
            >
              <Compass size={16} color={colors.primary} />
              <Text style={styles.profileActionText}>Take Guided App Tour</Text>
            </Pressable>

            {onRetakeQuiz && (
              <Pressable
                style={styles.profileActionBtn}
                onPress={() => {
                  setProfileModalVisible(false);
                  onRetakeQuiz();
                }}
              >
                <RotateCcw size={16} color={colors.primary} />
                <Text style={styles.profileActionText}>Recalibrate Quiz & Protocol</Text>
              </Pressable>
            )}

            {onSignOut && (
              <Pressable
                style={[styles.profileActionBtn, styles.profileSignOutBtn]}
                onPress={() => {
                  setProfileModalVisible(false);
                  onSignOut();
                }}
              >
                <LogOut size={16} color={colors.error} />
                <Text style={[styles.profileActionText, { color: colors.error }]}>Log Out</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>

      {/* ── FLOATING LUXURY BOTTOM NAVIGATION BAR ── */}
      <View style={styles.floatingNavWrapper}>
        <View style={styles.floatingNavBar}>
          {/* Rose Gradient Background Wrapper (clipped) */}
          <View style={styles.navBarBgWrap}>
            <LinearGradient
              colors={['#F39EB0', '#C9465B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
          </View>

          <Pressable
            onPress={() => setSelectedTab('today')}
            style={[styles.navItem, selectedTab === 'today' && styles.navItemActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: selectedTab === 'today' }}
          >
            <Sparkles
              size={18}
              color={selectedTab === 'today' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.75)'}
            />
            <Text
              style={[
                styles.navLabel,
                selectedTab === 'today' && styles.navLabelActive,
              ]}
            >
              Today
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setSelectedTab('coach')}
            onLayout={(e) => {
              const { x, y, width, height } = e.nativeEvent.layout;
              setTargetRects((prev) => ({
                ...prev,
                navCoach: {
                  x: x || SCREEN_W * 0.28,
                  y: SCREEN_H - 85,
                  width: width || SCREEN_W * 0.22,
                  height: height || 55,
                },
              }));
            }}
            style={[styles.navItem, selectedTab === 'coach' && styles.navItemActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: selectedTab === 'coach' }}
          >
            <Bot
              size={18}
              color={selectedTab === 'coach' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.75)'}
            />
            <Text
              style={[
                styles.navLabel,
                selectedTab === 'coach' && styles.navLabelActive,
              ]}
            >
              Coach
            </Text>
          </Pressable>

          {/* ── CENTER EXTRUDED NEW WORKOUT FAB ── */}
          <Pressable
            style={styles.centerFabBtn}
            onPress={() => {
              setQuickLaunchVisible(true);
              try {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
              } catch (_) {}
            }}
            accessibilityRole="button"
            accessibilityLabel="Create or add new workout"
          >
            <View style={styles.centerFabInner}>
              <Plus size={22} color="#C9465B" strokeWidth={2.8} />
            </View>
          </Pressable>

          <Pressable
            onPress={() => setSelectedTab('progress')}
            onLayout={(e) => {
              const { x, y, width, height } = e.nativeEvent.layout;
              setTargetRects((prev) => ({
                ...prev,
                navRhythm: {
                  x: x || SCREEN_W * 0.52,
                  y: SCREEN_H - 85,
                  width: width || SCREEN_W * 0.22,
                  height: height || 55,
                },
              }));
            }}
            style={[styles.navItem, selectedTab === 'progress' && styles.navItemActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: selectedTab === 'progress' }}
          >
            <HeartPulse
              size={18}
              color={selectedTab === 'progress' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.75)'}
            />
            <Text
              style={[
                styles.navLabel,
                selectedTab === 'progress' && styles.navLabelActive,
              ]}
            >
              Rhythm
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setSelectedTab('garden')}
            onLayout={(e) => {
              const { x, y, width, height } = e.nativeEvent.layout;
              setTargetRects((prev) => ({
                ...prev,
                navGarden: {
                  x: x || SCREEN_W * 0.74,
                  y: SCREEN_H - 85,
                  width: width || SCREEN_W * 0.22,
                  height: height || 55,
                },
              }));
            }}
            style={[styles.navItem, selectedTab === 'garden' && styles.navItemActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: selectedTab === 'garden' }}
          >
            <Flower2
              size={18}
              color={selectedTab === 'garden' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.75)'}
            />
            <Text
              style={[
                styles.navLabel,
                selectedTab === 'garden' && styles.navLabelActive,
              ]}
            >
              Garden
            </Text>
          </Pressable>
        </View>
      </View>

      {/* ── 2/3 HEIGHT QUICK LAUNCH SHEET (EXPANDS FROM PLUS BUTTON) ── */}
      <QuickLaunchSheet
        visible={quickLaunchVisible}
        onClose={() => setQuickLaunchVisible(false)}
        personalizedWorkout={recommendations.featuredWorkout}
        matchReason={recommendations.matchReason}
        onSelectWorkout={(w) => {
          launchWorkout(w);
        }}
        onExploreAll={() => {
          setSelectedModalWorkout(recommendations.curatedWorkouts[0]);
          setModalVisible(true);
          setQuickLaunchVisible(false);
        }}
        onStartEmpty={() => {
          launchWorkout(null);
        }}
      />

      {/* ── ACTIVE WORKOUT TRACKER ── */}
      <ActiveWorkoutScreen
        visible={activeWorkoutVisible}
        workout={activeWorkoutData}
        onFinish={(summary: WorkoutSummary) => {
          setActiveWorkoutVisible(false);
          // TODO: persist summary to Supabase
          try {
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          } catch (_) {}
        }}
        onCancel={() => setActiveWorkoutVisible(false)}
      />

      {/* ── WEEKLY RECAP MODAL (MONDAY SUMMARY CARD) ── */}
      <WeeklyRecapModal
        visible={weeklyRecapVisible}
        data={weeklyRecapData}
        onDismiss={() => setWeeklyRecapVisible(false)}
      />

      {/* ── FIRST-TIME GUIDED SPOTLIGHT TOUR ── */}
      <SpotlightTour
        visible={tourVisible}
        targetRects={targetRects}
        onComplete={handleTourComplete}
        onSkip={handleTourSkip}
      />

      {/* ── FORTYWELL STORE SCREEN / MODAL ── */}
      <StoreScreen
        visible={storeVisible}
        onClose={() => setStoreVisible(false)}
        isEmailVerified={userProfile.isEmailVerified}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 12,
  },

  // ── HEADER ──
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  headerTextWrap: {
    flex: 1,
    paddingRight: 16,
  },
  headerRightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  storeHeaderButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#C9465B',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: { elevation: 3 },
      default: {},
    }),
  },
  storeHeaderGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.sage,
  },
  headerKicker: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.textTertiary,
  },
  greetingTitle: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.8,
    lineHeight: 38,
    color: colors.textPrimary,
    fontFamily: fontFamilies.soria,
    marginBottom: 4,
  },
  greetingSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  avatarButton: {
    position: 'relative',
  },
  avatarInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceCardSelected,
    borderWidth: 1.5,
    borderColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMonogram: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryDark,
    fontFamily: fontFamilies.soria,
  },
  sparkleBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.background,
  },

  // ── STICKY UPPER NAV BAR ──
  stickyNavBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#FAF7F2',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(216, 207, 196, 0.7)',
    ...Platform.select({
      ios: {
        shadowColor: colors.textPrimary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  stickyNavLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stickyNavDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.sage,
  },
  stickyNavKicker: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.8,
    color: colors.textTertiary,
  },
  stickyNavRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stickyStoreBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#C9465B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  stickyStoreGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickyAvatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceCardSelected,
    borderWidth: 1,
    borderColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickyAvatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
    fontFamily: fontFamilies.soria,
  },

  // ── WEEK CALENDAR ──
  weekCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      ios: {
        shadowColor: colors.textPrimary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  weekHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  weekKicker: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.textTertiary,
  },
  weekSubtext: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayCol: {
    alignItems: 'center',
    gap: 6,
  },
  dayColToday: {},
  dayNameText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.textTertiary,
  },
  dayNameTextToday: {
    color: colors.primary,
  },
  dayNumBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumBubbleCompleted: {
    backgroundColor: colors.sageSoft,
    borderColor: colors.sage,
  },
  dayNumBubbleToday: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: { elevation: 3 },
      default: {},
    }),
  },
  dayNumText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  dayNumTextCompleted: {
    color: colors.sageDark,
    fontWeight: '700',
  },
  dayNumTextToday: {
    color: colors.textInverse,
    fontWeight: '800',
  },

  // ── METRICS STRIP ──
  metricsStrip: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.textPrimary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  metricIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.surfaceCardSelected,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 20,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: colors.textTertiary,
    marginTop: 2,
  },

  // ── IMAGE BACKGROUND SEGMENT FOR WEEK + STATS ──
  imageBackgroundSegment: {
    marginHorizontal: 20,
    marginBottom: 26,
    borderRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#2A2320',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: { elevation: 6 },
      default: {},
    }),
  },
  heroSegmentBg: {
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  heroSegmentBgImage: {
    borderRadius: 24,
    opacity: 1.0,
  },



  // ── HERO GRADIENT WORKOUT CARD ──
  heroSection: {
    paddingHorizontal: 20,
    marginBottom: 26,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionKicker: {
    fontSize: 11,
    fontFamily: fontFamilies.monoBold,
    letterSpacing: 2,
    color: '#3E342F',
  },
  safeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: colors.sageSoft,
  },
  safeTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.sageDark,
    letterSpacing: 0.5,
  },
  hero3DCard: {
    position: 'relative',
    borderRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#9F4252',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.18,
        shadowRadius: 24,
      },
      android: { elevation: 8 },
      default: {},
    }),
  },
  heroCardBody: {
    padding: 22,
    paddingTop: 24,
  },
  heroTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  primaryPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.28)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  primaryPillText: {
    fontSize: 9,
    fontFamily: fontFamilies.monoBold,
    letterSpacing: 1.5,
    color: '#FFFFFF',
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeTagText: {
    fontSize: 12,
    fontFamily: fontFamilies.monoMedium,
    color: 'rgba(255, 255, 255, 0.95)',
  },
  heroCardTitle: {
    fontSize: 26,
    letterSpacing: -0.4,
    lineHeight: 32,
    color: '#FFFFFF',
    fontFamily: 'PlayfairDisplay-Bold',
    marginBottom: 8,
  },
  heroCardSubtitle: {
    fontSize: 13,
    fontFamily: fontFamilies.monoRegular,
    lineHeight: 20,
    color: 'rgba(255, 255, 255, 0.92)',
    letterSpacing: 0,
    marginBottom: 10,
  },
  reasonPillWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  reasonPillText: {
    fontSize: 11,
    fontFamily: fontFamilies.monoBold,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  heroBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 20,
  },
  specBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  specBadgeText: {
    fontSize: 11,
    fontFamily: fontFamilies.monoMedium,
    color: '#FFFFFF',
  },
  startBtnWrap: {
    width: '100%',
  },
  startHeroButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(201, 70, 91, 0.15)',
    ...Platform.select({
      ios: {
        shadowColor: '#C9465B',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
      default: {},
    }),
  },
  btnFillOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 50,
    zIndex: 0,
  },
  playIconBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(201, 70, 91, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  startHeroBtnText: {
    fontSize: 12,
    fontFamily: fontFamilies.monoBold,
    letterSpacing: 1.5,
    color: '#C9465B',
    zIndex: 1,
  },

  // ── SIDEWAYS CAROUSEL ──
  carouselSection: {
    marginBottom: 20,
  },
  carouselHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  carouselSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
    lineHeight: 26,
    color: colors.textPrimary,
    fontFamily: fontFamilies.soria,
    marginTop: 2,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingBottom: 2,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: colors.primary,
  },
  horizontalScrollList: {
    paddingLeft: 20,
    paddingRight: 10,
    gap: 14,
  },
  workoutCard3D: {
    width: 240,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 16,
    justifyContent: 'space-between',
    minHeight: 140,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#2A2320',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  workoutCard3DSelected: {
    borderColor: colors.primary,
  },
  cardTagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTagText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: colors.textTertiary,
  },
  cardDurationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  cardDurationText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cardItemTitle: {
    fontSize: 19,
    letterSpacing: -0.3,
    lineHeight: 24,
    color: colors.textPrimary,
    fontFamily: 'PlayfairDisplay-Bold',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardMetaWrap: {
    flex: 1,
    paddingRight: 10,
  },
  cardFocusText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 2,
  },
  cardEquipmentText: {
    fontSize: 10,
    color: colors.textTertiary,
  },
  cardPlayBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardPlayBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  // ── RETAKE QUIZ ──
  retakeRow: {
    alignItems: 'center',
    marginVertical: 10,
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  retakeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textTertiary,
    letterSpacing: 0.3,
  },

  // ── FLOATING NAVIGATION BAR ──
  floatingNavWrapper: {
    position: 'absolute',
    bottom: 16,
    left: 20,
    right: 20,
    zIndex: 100,
  },
  floatingNavBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#C9465B',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 18,
      },
      android: { elevation: 8 },
      default: {},
    }),
  },
  navBarBgWrap: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  centerFabBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24,
    zIndex: 10,
  },
  centerFabInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(243, 158, 176, 0.45)',
    ...Platform.select({
      ios: {
        shadowColor: '#C9465B',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
      },
      android: { elevation: 6 },
      default: {},
    }),
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 4,
    paddingVertical: 6,
    borderRadius: 18,
  },
  navItemActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  navLabel: {
    fontSize: 10,
    fontFamily: fontFamilies.monoMedium,
    color: 'rgba(255, 255, 255, 0.75)',
    letterSpacing: 0.3,
  },
  navLabelActive: {
    color: '#FFFFFF',
    fontFamily: fontFamilies.monoBold,
  },

  // ── Profile Modal Styles ──
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(42, 35, 32, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  profileModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.surfaceCard,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: { elevation: 10 },
      default: {},
    }),
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primarySoft,
    borderWidth: 2,
    borderColor: colors.borderSelected,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  profileAvatarText: {
    fontSize: 26,
    fontFamily: fontFamilies.soria,
    color: colors.primary,
    fontWeight: '700',
  },
  profileModalName: {
    fontSize: 20,
    fontFamily: fontFamilies.soria,
    color: colors.textPrimary,
    fontWeight: '700',
    marginBottom: 4,
  },
  profileModalEmail: {
    fontSize: 13,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textTertiary,
    marginBottom: 16,
  },
  profilePillGroup: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginBottom: 16,
  },
  profileInfoPill: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
  },
  profileInfoPillLabel: {
    fontSize: 10,
    fontFamily: fontFamilies.monoMedium,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  profileInfoPillVal: {
    fontSize: 12,
    fontFamily: fontFamilies.sansSemiBold,
    color: colors.textPrimary,
  },
  profileDivider: {
    width: '100%',
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginBottom: 16,
  },
  profileActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.surface,
    marginBottom: 10,
  },
  profileSignOutBtn: {
    backgroundColor: 'rgba(201, 99, 116, 0.08)',
    marginBottom: 0,
  },
  profileActionText: {
    fontSize: 14,
    fontFamily: fontFamilies.sansSemiBold,
    color: colors.textPrimary,
  },

  // ── Profile Reward & Email Verification Styles ──
  verifiedRewardCard: {
    width: '100%',
    backgroundColor: 'rgba(146, 169, 117, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(146, 169, 117, 0.35)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  verifiedRewardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  verifiedRewardBadge: {
    fontSize: 10.5,
    fontFamily: fontFamilies.monoBold,
    color: colors.sageDark,
    letterSpacing: 1.2,
  },
  verifiedRewardTitle: {
    fontSize: 16,
    fontFamily: fontFamilies.soria,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  verifiedRewardDesc: {
    fontSize: 12.5,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  promoCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(146, 169, 117, 0.4)',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  promoCodeText: {
    fontSize: 16,
    fontFamily: fontFamilies.monoBold,
    color: colors.primaryDark,
    letterSpacing: 3,
  },
  promoCodeTag: {
    backgroundColor: colors.sage,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  promoCodeTagText: {
    fontSize: 11,
    fontFamily: fontFamilies.sansSemiBold,
    color: '#fff',
  },

  unverifiedRewardCard: {
    width: '100%',
    backgroundColor: 'rgba(208, 120, 135, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(208, 120, 135, 0.25)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  unverifiedRewardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  unverifiedRewardKicker: {
    fontSize: 10,
    fontFamily: fontFamilies.monoBold,
    color: colors.primaryDark,
    letterSpacing: 1.2,
  },
  unverifiedRewardTitle: {
    fontSize: 16,
    fontFamily: fontFamilies.soria,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  unverifiedRewardDesc: {
    fontSize: 12,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textSecondary,
    lineHeight: 17,
    marginBottom: 12,
  },
  profileOtpInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  profileOtpInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: fontFamilies.monoBold,
    color: colors.textPrimary,
    letterSpacing: 2,
    textAlign: 'center',
  },
  profileOtpBtn: {
    backgroundColor: colors.rose,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileOtpBtnDisabled: {
    opacity: 0.5,
  },
  profileOtpBtnText: {
    fontSize: 13,
    fontFamily: fontFamilies.sansSemiBold,
    color: '#fff',
  },
  profileOtpErrorText: {
    fontSize: 12,
    fontFamily: fontFamilies.sansRegular,
    color: colors.error,
    marginBottom: 6,
  },
  profileOtpSuccessText: {
    fontSize: 12,
    fontFamily: fontFamilies.sansMedium,
    color: colors.sageDark,
    marginBottom: 6,
  },
  profileResendLink: {
    paddingVertical: 4,
    alignItems: 'center',
  },
  profileResendLinkText: {
    fontSize: 11.5,
    fontFamily: fontFamilies.sansMedium,
    color: colors.textTertiary,
  },
});
