import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
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
import { Image as ExpoImage } from 'expo-image';
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
  Target,
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
import { ActiveWorkoutScreen, WorkoutSummary, LoggedExercise } from '../components/ActiveWorkoutScreen';
import { getExerciseInfo } from '../lib/exerciseDatabase';
import { workoutSessionManager } from '../lib/workoutSessionManager';
import { MorningRoutineCard } from '../components/MorningRoutineCard';
import { EveningWindDownCard } from '../components/EveningWindDownCard';
import { ExerciseDetailModal } from '../components/ExerciseDetailModal';
import { CoachScreen } from '../components/CoachScreen';
import { RhythmScreen } from '../components/RhythmScreen';
import { WeeklyRecapModal, WeeklyRecapData } from '../components/WeeklyRecapModal';
import { SpotlightTour, TargetRectsMap } from '../components/SpotlightTour';
import { useUserData } from '../hooks/useUserData';
import { StoreScreen } from '../components/StoreScreen';
import { HeaderActionButtons } from '../components/HeaderActionButtons';
import { WeeklyPlanSection } from '../components/WeeklyPlanSection';
import { useWeeklyPlan } from '../lib/useWeeklyPlan';
import { SettingsModal } from '../components/SettingsModal';
import { useFavorites } from '../lib/useFavorites';
import { useSavedSessions, SavedSession } from '../lib/useSavedSessions';
import { useOfflineSync, getActiveSessionCheckpoint, clearActiveSessionCheckpoint, ActiveSessionCheckpoint } from '../lib/useOfflineSync';
import { useLanguage } from '../context/LanguageContext';
import { useSubscription } from '../context/SubscriptionContext';
import { PaywallModal } from '../components/PaywallModal';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    gardenProgress,
    topExercises,
    recordCompletedWorkout,
    refreshUserData,
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
  // ── Favorites & Offline Protection ────────────────────────────────────────
  const { favoriteSlugs, toggleFavorite, isFavorite } = useFavorites();
  const { savedSessions } = useSavedSessions();
  const { hasPendingLogs, isSyncing } = useOfflineSync();
  const { t } = useLanguage();
  const { isPaused, openPaywall, isTrialActive, trialDaysRemaining, isSubscribed } = useSubscription();

  // Auto-prompt paywall on Day 8+ if trial has concluded and account is paused
  useEffect(() => {
    if (isPaused && !userLoading) {
      openPaywall('trial_expired_mount');
    }
  }, [isPaused, userLoading, openPaywall]);

  // Compute saved workouts list
  const savedWorkouts = useMemo(() => {
    return workouts.filter((w) => favoriteSlugs.has(w.slug));
  }, [workouts, favoriteSlugs]);

  const [selectedModalWorkout, setSelectedModalWorkout] = useState<Workout | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [quickLaunchVisible, setQuickLaunchVisible] = useState<boolean>(false);
  const [storeVisible, setStoreVisible] = useState<boolean>(false);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>(null);
  const [activeWorkoutVisible, setActiveWorkoutVisible] = useState<boolean>(false);
  const [activeWorkoutData, setActiveWorkoutData] = useState<Workout | null>(null);
  const [activeWorkoutInitialExercises, setActiveWorkoutInitialExercises] = useState<LoggedExercise[] | null>(null);
  const [exerciseDetailName, setExerciseDetailName] = useState<string | null>(null);
  const [exerciseDetailVisible, setExerciseDetailVisible] = useState<boolean>(false);
  const [profileModalVisible, setProfileModalVisible] = useState<boolean>(false);

  // ── In-Progress Workout Resume Banner ─────────────────────────────
  const [resumeCheckpoint, setResumeCheckpoint] = useState<ActiveSessionCheckpoint | null>(null);
  const [activeWorkoutCheckpoint, setActiveWorkoutCheckpoint] = useState<ActiveSessionCheckpoint | null>(null);
  const checkpointCheckedRef = useRef(false);

  // Check for in-progress checkpoint on mount
  useEffect(() => {
    if (checkpointCheckedRef.current) return;
    checkpointCheckedRef.current = true;
    getActiveSessionCheckpoint().then((cp) => {
      if (cp) setResumeCheckpoint(cp);
    });
  }, []);

  // Re-check when app comes back to foreground (tab visible again)
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const onVisible = () => {
      if (document.visibilityState === 'visible' && !activeWorkoutVisible) {
        getActiveSessionCheckpoint().then((cp) => {
          if (cp) setResumeCheckpoint(cp);
          else setResumeCheckpoint(null);
        });
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [activeWorkoutVisible]);

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
  // Ensure tour only ever fires ONCE per account mount
  const tourShownRef = React.useRef(false);

  // Automatically trigger first-time guided walkthrough on initial landing
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.sessionStorage?.getItem('fortywell_tour_shown_session') === 'true') {
        return;
      }
      if (window.localStorage?.getItem('@fortywell_has_seen_walkthrough_v1') === 'true') {
        return;
      }
      if (userProfile?.id && window.localStorage?.getItem(`@fortywell_walkthrough_${userProfile.id}`) === 'true') {
        return;
      }
    }

    async function checkWalkthrough() {
      try {
        const stored = await AsyncStorage.getItem('@fortywell_has_seen_walkthrough_v1');
        const userStored = userProfile?.id ? await AsyncStorage.getItem(`@fortywell_walkthrough_${userProfile.id}`) : null;
        if (stored === 'true' || userStored === 'true') {
          return;
        }
      } catch (_) {}

      // Only proceed when we have real data from the server (not loading)
      // and user has definitively NOT seen the walkthrough (not just the default 'true' stub)
      if (!userLoading && userProfile.hasSeenWalkthrough === false && !tourShownRef.current) {
        tourShownRef.current = true;
        if (typeof window !== 'undefined' && window.sessionStorage) {
          window.sessionStorage.setItem('fortywell_tour_shown_session', 'true');
        }
        const timer = setTimeout(() => {
          setTourVisible(true);
        }, 700);
        return () => clearTimeout(timer);
      }
    }

    checkWalkthrough();
  }, [userLoading, userProfile.hasSeenWalkthrough, userProfile?.id]);

  const handleTourComplete = React.useCallback(() => {
    setTourVisible(false);
    markWalkthroughCompleted();
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem('fortywell_tour_shown_session', 'true');
    }
  }, [markWalkthroughCompleted]);

  const handleTourSkip = React.useCallback(() => {
    setTourVisible(false);
    markWalkthroughCompleted();
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem('fortywell_tour_shown_session', 'true');
    }
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

  const launchWorkout = useCallback((workout: Workout | null) => {
    if (isPaused) {
      openPaywall('start_workout');
      return;
    }
    // Prime audio HERE — directly inside user gesture so browsers allow autoplay.
    // Without this, MediaSession lock screen controls won't appear.
    workoutSessionManager.primeAudio();
    // Clear any stale resume checkpoint so fresh workout starts clean
    setResumeCheckpoint(null);
    setActiveWorkoutCheckpoint(null);
    setActiveWorkoutInitialExercises(null);
    clearActiveSessionCheckpoint();
    setActiveWorkoutData(workout);
    setActiveWorkoutVisible(true);
    setQuickLaunchVisible(false);
    setModalVisible(false);
  }, [isPaused, openPaywall]);

  const loadSessionAsWorkout = useCallback((session: SavedSession) => {
    if (isPaused) {
      openPaywall('load_session');
      return;
    }

    // Convert SavedSession to a Workout structure
    const workoutFromSession: Workout = {
      slug: session.workoutSlug || 'custom-session',
      title: session.workoutTitle || 'Custom Workout',
      description: 'Replaying saved session with logged sets & weights',
      equipment: 'home_bodyweight',
      duration_minutes: Math.max(10, Math.ceil((session.durationSeconds || 1200) / 60)),
      target_focus: [],
      joint_sensitivities_safe: [],
      energy_level: 'moderate',
      warmup: [],
      main_blocks: [
        {
          block_name: 'Session Exercises',
          exercises: (session.exercises || []).map((ex) => ({
            name: ex.name,
            sets: ex.sets?.length || 3,
            reps: ex.sets?.[0]?.reps ? String(ex.sets[0].reps) : '10',
            tempo: '2-0-2-0',
            rest: '60s',
          })),
        },
      ],
      cooldown: [],
    };

    // Pre-populate LoggedExercise[] with the exact exercises, sets, weights and reps from this saved session
    const initialExercises: LoggedExercise[] = (session.exercises || []).map((ex) => {
      const info = getExerciseInfo(ex.name);
      return {
        id: Math.random().toString(36).substr(2, 9),
        name: ex.name,
        coaching_cue: info.coaching_cues,
        image_url: info.image_url,
        gif_url: info.gif_url,
        expanded: true,
        sets: (ex.sets && ex.sets.length > 0)
          ? ex.sets.map((s) => ({
              id: Math.random().toString(36).substr(2, 9),
              weight: s.weight != null && s.weight !== 0 ? String(s.weight) : '',
              reps: s.reps != null && s.reps !== 0 ? String(s.reps) : '10',
              completed: false, // Reset so user can execute and log today's fresh workout!
            }))
          : [
              {
                id: Math.random().toString(36).substr(2, 9),
                weight: '',
                reps: '10',
                completed: false,
              },
            ],
      };
    });

    // Prime audio and launch
    workoutSessionManager.primeAudio();
    setResumeCheckpoint(null);
    setActiveWorkoutCheckpoint(null);
    clearActiveSessionCheckpoint();
    setActiveWorkoutData(workoutFromSession);
    setActiveWorkoutInitialExercises(initialExercises);
    setActiveWorkoutVisible(true);
    setQuickLaunchVisible(false);

    try {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (_) {}
  }, [isPaused, openPaywall]);

  const handleResumeWorkout = useCallback(() => {
    if (!resumeCheckpoint) return;
    if (isPaused) {
      openPaywall('start_workout');
      return;
    }
    // Prime audio HERE — directly inside user gesture
    workoutSessionManager.primeAudio();
    // Restore workout object from checkpoint if available
    const workoutData: Workout | null = resumeCheckpoint.workoutData ?? null;
    setActiveWorkoutData(workoutData);
    setActiveWorkoutInitialExercises(null);
    setActiveWorkoutCheckpoint(resumeCheckpoint);
    setResumeCheckpoint(null);
    setActiveWorkoutVisible(true);
    setQuickLaunchVisible(false);
    setModalVisible(false);
  }, [resumeCheckpoint, isPaused, openPaywall]);

  const handleDiscardResume = useCallback(async () => {
    await clearActiveSessionCheckpoint();
    setResumeCheckpoint(null);
  }, []);

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
    if (isPaused) {
      openPaywall('hero_start_workout');
      return;
    }
    try {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (_) {}
    launchWorkout(featuredWorkout);
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
        <GardenView
          onStartWorkout={handleStartWorkout}
          gardenProgress={gardenProgress}
          lifetimeStats={lifetimeStats}
          topExercises={topExercises}
          onRefresh={() => refreshUserData(true)}
          onOpenStore={() => setStoreVisible(true)}
          onOpenProfile={() => setProfileModalVisible(true)}
          userMonogram={userProfile.monogram}
        />
      </View>
      <View style={[styles.tabContainer, { display: selectedTab === 'coach' ? 'flex' : 'none' }]}>
        <CoachScreen
          answers={answers}
          onOpenStore={() => setStoreVisible(true)}
          onOpenProfile={() => setProfileModalVisible(true)}
          userMonogram={userProfile.monogram}
        />
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
          onOpenStore={() => setStoreVisible(true)}
          onOpenProfile={() => setProfileModalVisible(true)}
          userMonogram={userProfile.monogram}
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
              {new Date().toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()} • {t('home.protocolActive')}
            </Text>
          </View>

          <View style={styles.stickyNavRight}>
            <HeaderActionButtons
              compact={true}
              onOpenStore={() => setStoreVisible(true)}
              onOpenProfile={() => setProfileModalVisible(true)}
              userMonogram={userProfile.monogram}
            />
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
                {new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()} • {t('home.protocolActive')}
              </Text>
            </View>
            <Text style={styles.greetingTitle}>{userProfile.greetingName}</Text>
            <Text style={styles.greetingSubtitle}>
              {t('home.nervousSystemSubtitle')}
            </Text>
          </View>

          <View style={styles.headerRightButtons}>
            <Animated.View style={headerStoreBtnAnimStyle}>
              <HeaderActionButtons
                onOpenStore={() => setStoreVisible(true)}
                onOpenProfile={() => setProfileModalVisible(true)}
                userMonogram={userProfile.monogram}
              />
            </Animated.View>
          </View>
        </View>

        {/* ── IMAGE BACKGROUND SEGMENT: WEEK 1 RHYTHM + STATS ── */}
        <View style={styles.imageBackgroundSegment}>
          {/* Centered Runner Image with expansive focal framing */}
          <ExpoImage
            source={heroRunnerImage}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
            contentPosition={{ top: '26%', left: '38%' }}
            transition={200}
            cachePolicy="memory-disk"
          />

          {/* Lighter, high-clarity vignette overlay so the background shines through */}
          <LinearGradient
            colors={['rgba(20, 16, 12, 0.10)', 'rgba(20, 16, 12, 0.28)']}
            style={StyleSheet.absoluteFillObject}
          />

          <View style={styles.heroSegmentInner}>
            {/* ── 3D FLOATING WEEK CALENDAR STRIP ── */}
            <View style={styles.weekCard}>
              <View style={styles.weekHeaderRow}>
                <Text style={styles.weekKicker}>{t('home.weeklyRhythm')}</Text>
                <Text style={styles.weekSubtext}>{t('home.goal', { frequency: String(userProfile.weeklyFrequency || '3–4 days') })}</Text>
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

            {/* ── METRICS STRIP (3D depth & real transparent stats) ── */}
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
              {/* Stat 1: Active Streak */}
              <View style={styles.metricCard}>
                <View style={[styles.metricIconCircle, { backgroundColor: 'rgba(201, 70, 91, 0.12)' }]}>
                  <Flame size={14} color={colors.primary} />
                </View>
                <Text style={styles.metricValue}>
                  {lifetimeStats.currentStreak} {lifetimeStats.currentStreak === 1 ? 'Day' : 'Days'}
                </Text>
                <Text style={styles.metricLabel}>{t('home.activeStreak')}</Text>
              </View>

              {/* Stat 2: Daily Target / Session Duration */}
              <View style={styles.metricCard}>
                <View style={[styles.metricIconCircle, { backgroundColor: colors.sageSoft }]}>
                  <Clock size={14} color={colors.sageDark} />
                </View>
                <Text style={styles.metricValue}>
                  {answers?.time_commitment ? answers.time_commitment.replace(' minutes', 'm').replace(' mins', 'm') : '20–30 min'}
                </Text>
                <Text style={styles.metricLabel}>{t('home.dailyTarget')}</Text>
              </View>

              {/* Stat 3: Weekly Sessions Goal */}
              <View style={styles.metricCard}>
                <View style={[styles.metricIconCircle, { backgroundColor: 'rgba(112, 134, 85, 0.12)' }]}>
                  <Target size={14} color={colors.sageDark} />
                </View>
                <Text style={styles.metricValue}>
                  {currentWeekDays.filter((d) => d.isCompleted).length} / {answers?.weekly_frequency ? (answers.weekly_frequency.split('–')[0].trim() || '3') : '3'}
                </Text>
                <Text style={styles.metricLabel}>{t('home.weeklyGoal')}</Text>
              </View>
            </View>
          </View>
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
              {answers ? t('home.calibratedToProfile') : "TODAY'S FOCUS SESSION"}
            </Text>
            <View style={styles.safeTag}>
              <ShieldCheck size={11} color={colors.sageDark} />
              <Text style={styles.safeTagText}>{t('home.jointSafe')}</Text>
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
                    {answers ? t('home.quizMatch') : 'RECOMMENDED TODAY'}
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

        {/* ── DISTINCTIVE EVENING CORTISOL WIND-DOWN CARD ── */}
        <EveningWindDownCard />

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
        isFavorite={selectedModalWorkout ? isFavorite(selectedModalWorkout.slug) : false}
        onToggleFavorite={toggleFavorite}
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

      {/* ── PROFILE & SETTINGS MODAL ── */}
      <SettingsModal
        visible={profileModalVisible}
        onClose={() => setProfileModalVisible(false)}
        onSignOut={onSignOut}
        onRetakeQuiz={onRetakeQuiz}
        onReplayTour={handleReplayTour}
        userProfile={userProfile}
        codeCopied={codeCopied}
        onCopyCode={() => {
          setCodeCopied(true);
          setTimeout(() => setCodeCopied(false), 2500);
          try { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (_) {}
        }}
        onDeleteAccount={() => {
          setProfileModalVisible(false);
          onSignOut?.();
        }}
      />


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
              {t('nav.today')}
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
              {t('nav.coach')}
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
              {t('nav.rhythm')}
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
              {t('nav.garden')}
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
        savedWorkouts={savedWorkouts}
        savedSessions={savedSessions}
        onToggleFavorite={toggleFavorite}
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
        onLoadSession={loadSessionAsWorkout}
      />

      {/* ── ACTIVE WORKOUT TRACKER ── */}
      <ActiveWorkoutScreen
        visible={activeWorkoutVisible}
        workout={activeWorkoutData}
        checkpoint={activeWorkoutCheckpoint}
        initialExercises={activeWorkoutInitialExercises}
        onFinish={(summary: WorkoutSummary) => {
          setActiveWorkoutVisible(false);
          setActiveWorkoutCheckpoint(null);
          setActiveWorkoutInitialExercises(null);
          setResumeCheckpoint(null);
          const now = new Date();
          const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
          recordCompletedWorkout(
            today,
            Math.round(summary.durationSeconds / 60),
            summary.totalVolumeKg,
            summary.completedSets
          );
          refreshUserData(true);
          try {
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          } catch (_) {}
        }}
        onCancel={() => {
          setActiveWorkoutVisible(false);
          setActiveWorkoutCheckpoint(null);
          setActiveWorkoutInitialExercises(null);
        }}
      />

      {/* ── WORKOUT IN PROGRESS RESUME BANNER ── */}
      {resumeCheckpoint && !activeWorkoutVisible && (
        <WorkoutInProgressBanner
          checkpoint={resumeCheckpoint}
          onResume={handleResumeWorkout}
          onDiscard={handleDiscardResume}
        />
      )}

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

      {/* ── 7-DAY TRIAL & SUBSCRIPTION PAYWALL MODAL ── */}
      <PaywallModal
        onDismissToGarden={() => setSelectedTab('garden')}
      />
    </SafeAreaView>
  );
};

// \u2500\u2500 WorkoutInProgressBanner \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// Spotify-style floating bar shown when re-opening app mid-workout

function formatElapsed(cp: ActiveSessionCheckpoint): string {
  const startMs = new Date(cp.startedAt).getTime();
  const totalPausedMs = cp.totalPausedMs ?? 0;
  const s = Math.max(0, Math.floor((Date.now() - startMs - totalPausedMs) / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${m < 10 ? '0' : ''}${m}:${sec < 10 ? '0' : ''}${sec}`;
  return `${m < 10 ? '0' : ''}${m}:${sec < 10 ? '0' : ''}${sec}`;
}

function WorkoutInProgressBanner({
  checkpoint,
  onResume,
  onDiscard,
}: {
  checkpoint: ActiveSessionCheckpoint;
  onResume: () => void;
  onDiscard: () => void;
}) {
  const [elapsed, setElapsed] = React.useState(() => formatElapsed(checkpoint));

  React.useEffect(() => {
    if (checkpoint.isPaused) return;
    const interval = setInterval(() => setElapsed(formatElapsed(checkpoint)), 1000);
    return () => clearInterval(interval);
  }, [checkpoint]);

  // Find first non-completed exercise name from checkpoint
  const currentExName = React.useMemo(() => {
    if (!checkpoint.exercises || checkpoint.exercises.length === 0) return 'Workout';
    const active = checkpoint.exercises.find((e: any) =>
      e.sets && e.sets.some((s: any) => !s.completed)
    );
    return active?.name || checkpoint.exercises[0]?.name || 'Workout';
  }, [checkpoint]);

  const doneSets = React.useMemo(() => {
    return checkpoint.exercises.reduce((a: number, e: any) =>
      a + (e.sets?.filter((s: any) => s.completed).length ?? 0), 0);
  }, [checkpoint]);

  const totalSets = React.useMemo(() => {
    return checkpoint.exercises.reduce((a: number, e: any) =>
      a + (e.sets?.length ?? 0), 0);
  }, [checkpoint]);

  return (
    <View style={wip.overlay} pointerEvents="box-none">
      <View style={wip.card}>
        {/* Pulsing dot */}
        <View style={wip.dot} />

        {/* Info */}
        <View style={wip.info}>
          <Text style={wip.title} numberOfLines={1}>
            {checkpoint.workoutTitle}
          </Text>
          <Text style={wip.sub} numberOfLines={1}>
            {currentExName} · {doneSets}/{totalSets} sets · {elapsed}
            {checkpoint.isPaused ? ' · ⏸ Paused' : ''}
          </Text>
        </View>

        {/* Actions */}
        <Pressable style={wip.discardBtn} onPress={onDiscard} hitSlop={8}>
          <X size={16} color={colors.textTertiary} />
        </Pressable>
        <Pressable style={wip.resumeBtn} onPress={onResume}>
          <Play size={14} color="#FFF" fill="#FFF" />
          <Text style={wip.resumeTxt}>RESUME</Text>
        </Pressable>
      </View>
    </View>
  );
}

const wip = StyleSheet.create({
  overlay: {
    position: 'absolute',
    bottom: 88,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
    pointerEvents: 'box-none',
  } as any,
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30,22,14,0.92)',
    borderRadius: 20,
    marginHorizontal: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    flexShrink: 0,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 13,
    fontFamily: fontFamilies.sansSemiBold,
    color: '#FFFFFF',
    marginBottom: 1,
  },
  sub: {
    fontSize: 11,
    fontFamily: fontFamilies.sansRegular,
    color: 'rgba(255,255,255,0.55)',
  },
  discardBtn: {
    padding: 4,
    flexShrink: 0,
  },
  resumeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexShrink: 0,
  },
  resumeTxt: {
    fontSize: 11,
    fontFamily: fontFamilies.monoBold,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});

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
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    ...Platform.select({
      ios: {
        shadowColor: '#1A1412',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.10,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
      default: {},
    }),
  },
  weekHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
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
    gap: 5,
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
    width: 30,
    height: 30,
    borderRadius: 15,
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
    fontSize: 11.5,
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
    gap: 8,
  },
  metricCard: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#1A1412',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
      default: {},
    }),
  },
  metricIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surfaceCardSelected,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 18,
    textAlign: 'center',
  },
  metricLabel: {
    fontSize: 9.5,
    fontWeight: '600',
    letterSpacing: 0.4,
    color: colors.textTertiary,
    marginTop: 2,
    textAlign: 'center',
  },

  // ── IMAGE BACKGROUND SEGMENT FOR WEEK + STATS ──
  imageBackgroundSegment: {
    marginHorizontal: 20,
    marginBottom: 26,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 330,
    ...Platform.select({
      ios: {
        shadowColor: '#2A2320',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.16,
        shadowRadius: 16,
      },
      android: { elevation: 6 },
      default: {},
    }),
  },
  heroSegmentInner: {
    paddingVertical: 16,
    paddingHorizontal: 14,
    minHeight: 330,
    justifyContent: 'space-between',
    position: 'relative',
    zIndex: 2,
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
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderTopColor: 'rgba(255, 255, 255, 0.45)',
    ...Platform.select({
      ios: {
        shadowColor: '#9F4252',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.22,
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
