import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Platform,
  Animated,
  KeyboardAvoidingView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Circle,
  HeartPulse,
  Zap,
  Moon,
  Wind,
  BookOpen,
  Leaf,
  ShieldCheck,
  Info,
  TrendingUp,
  TrendingDown,
  Minus,
  Flame,
  Activity,
  Sun,
  Droplet,
  Shuffle,
  Compass,
  Plus,
  Mic,
  MicOff,
  ArrowUp,
  Brain,
  Database,
  Sliders,
  Check,
  UserCheck,
  Calendar,
  Crown,
  Dumbbell,
  Clock,
  ArrowUpRight,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { fontFamilies } from '../theme/typography';
import { OnboardingAnswers } from '../types/onboarding';
import {
  getDailyRotatedArticles,
  EducationalArticle,
} from '../data/educationalArticles';
import { ArticleDetailModal } from './ArticleDetailModal';
import { CoachLeadModal } from './CoachLeadModal';
import { ProgramDetailModal } from './ProgramDetailModal';
import { PayPalCheckoutModal } from './PayPalCheckoutModal';
import {
  FITNESS_PROGRAMS,
  FitnessProgram,
  PROGRAMS_BUNDLE_PRICE,
  PROGRAMS_BUNDLE_ORIGINAL,
} from '../data/fitnessPrograms';
import {
  classifyUserFeelingMessage,
  ClassificationResult,
} from '../lib/coachAiClassifier';
import {
  detectIntent,
  saveTrainingPreference,
} from '../lib/coachIntentEngine';
import {
  sendToGroq,
  shouldUseGroqAI,
  getFallbackReply,
} from '../lib/coachGroqService';
import { supabase } from '../lib/supabase';
import { useUserData } from '../hooks/useUserData';
import { useSubscription } from '../context/SubscriptionContext';
import { useLanguage } from '../context/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_W } = Dimensions.get('window');

// Message retention: show only messages from last 5 hours (stored history can be longer)
const MESSAGE_DISPLAY_WINDOW_MS = 5 * 60 * 60 * 1000; // 5 hours

// ── TYPES ────────────────────────────────────────────────────────────────────

interface CoachMessage {
  id: string;
  role: 'coach' | 'user';
  text: string;
  timestamp: Date;
  classification?: ClassificationResult;
  isDeepThink?: boolean;
}

interface HabitItem {
  id: string;
  label: string;
  iconType: 'heart' | 'leaf' | 'moon' | 'wind';
  checked: boolean;
}

interface FeelingEntry {
  date: string;
  mood: number;
  energy: number;
}

interface CoachScreenProps {
  answers?: OnboardingAnswers | null;
}

// ── HELPERS ───────────────────────────────────────────────────────────────────

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ── STATIC DATA ───────────────────────────────────────────────────────────────

const MOOD_OPTIONS = [
  { value: 1, label: 'Rough', emoji: '😔', color: '#C96374' },
  { value: 2, label: 'Low',   emoji: '😕', color: '#D6A354' },
  { value: 3, label: 'Okay',  emoji: '😐', color: '#A09186' },
  { value: 4, label: 'Good',  emoji: '🙂', color: '#92A975' },
  { value: 5, label: 'Great', emoji: '😊', color: '#708655' },
];

const ENERGY_OPTIONS = [
  { value: 1, label: 'Drained', color: '#C96374' },
  { value: 2, label: 'Low',     color: '#D6A354' },
  { value: 3, label: 'Okay',    color: '#A09186' },
  { value: 4, label: 'Good',    color: '#92A975' },
  { value: 5, label: 'High',    color: '#708655' },
];

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const DAILY_INSIGHTS = [
  {
    id: 'ins1',
    phase: 'Follicular Phase',
    phaseColor: '#D07887',
    headline: 'Your energy is building — this is your window for strength work.',
    body: 'Rising estrogen supports muscle protein synthesis and pain tolerance. This week is ideal for more purposeful, challenging movement.',
    tag: 'MOVEMENT TIMING',
  },
  {
    id: 'ins2',
    phase: 'Recovery Window',
    phaseColor: '#92A975',
    headline: 'Sleep quality drives everything you\'re trying to build.',
    body: 'Cortisol, growth hormone, and tissue repair all peak during deep sleep. A consistent wind-down routine matters more than most workouts.',
    tag: 'RECOVERY SCIENCE',
  },
  {
    id: 'ins3',
    phase: 'Nervous System',
    phaseColor: '#C9B8AC',
    headline: 'Slow movement is still movement — and sometimes the most effective kind.',
    body: 'Low-intensity activity activates the parasympathetic nervous system, reducing cortisol and supporting fat metabolism.',
    tag: 'STRESS PHYSIOLOGY',
  },
];

const PROMPT_CHIPS = [
  { id: 'c1', label: "I'm feeling tired today" },
  { id: 'c2', label: 'Tight hips from sitting' },
  { id: 'c3', label: 'Only slept 5 hours' },
  { id: 'c4', label: 'Energy is 10/10 today' },
  { id: 'c5', label: 'Lower back feels stiff' },
  { id: 'c6', label: 'Stressed and overwhelmed' },
];

const QUICK_ATTACH_TAGS = [
  '⚡ Low Energy Check',
  '🧘 Hip / Knee Mobility',
  '🌙 Sleep Disruption',
  '💪 High Readiness',
  '🌿 Stress Relief',
];

// ── ICON RENDERERS ───────────────────────────────────────────────────────────

function renderHabitIcon(type: HabitItem['iconType'], color: string) {
  const props = { size: 16, color, strokeWidth: 1.8 };
  switch (type) {
    case 'heart': return <HeartPulse {...props} />;
    case 'leaf':  return <Leaf {...props} />;
    case 'moon':  return <Moon {...props} />;
    case 'wind':  return <Wind {...props} />;
  }
}

function renderArticleIcon(iconType: string, color: string, size = 16) {
  const props = { size, color, strokeWidth: 1.8 };
  switch (iconType) {
    case 'wind':     return <Wind {...props} />;
    case 'zap':      return <Zap {...props} />;
    case 'moon':     return <Moon {...props} />;
    case 'heart':    return <HeartPulse {...props} />;
    case 'shield':   return <ShieldCheck {...props} />;
    case 'sparkles': return <Sparkles {...props} />;
    case 'leaf':     return <Leaf {...props} />;
    case 'flame':    return <Flame {...props} />;
    case 'activity': return <Activity {...props} />;
    case 'sun':      return <Sun {...props} />;
    case 'droplet':  return <Droplet {...props} />;
    default:         return <BookOpen {...props} />;
  }
}

const CARD_ACCENT_CYCLE = [
  { border: colors.sageDark, iconBg: colors.sageSoft,   iconColor: colors.sageDark  },
  { border: colors.rose,     iconBg: colors.roseSoft,   iconColor: '#9F4252'        },
  { border: colors.peach,    iconBg: colors.peachSoft,  iconColor: '#C07050'        },
];

function getCardAccent(idx: number) {
  return CARD_ACCENT_CYCLE[idx % 3];
}

// ── FEELING CHECK-IN CARD ─────────────────────────────────────────────────────

const FeelingCheckIn: React.FC<{
  history: FeelingEntry[];
  onSave: (entry: Omit<FeelingEntry, 'date'>) => void;
  todayEntry: FeelingEntry | undefined;
}> = ({ history, onSave, todayEntry }) => {
  const [selectedMood, setSelectedMood] = useState<number | null>(todayEntry?.mood ?? null);
  const [selectedEnergy, setSelectedEnergy] = useState<number | null>(todayEntry?.energy ?? null);
  const [saved, setSaved] = useState(!!todayEntry);
  const savedScale = useRef(new Animated.Value(1)).current;

  const canSave = selectedMood !== null && selectedEnergy !== null && !saved;

  const handleSave = () => {
    if (!canSave) return;
    onSave({ mood: selectedMood!, energy: selectedEnergy! });
    setSaved(true);
    Animated.sequence([
      Animated.timing(savedScale, { toValue: 1.04, duration: 130, useNativeDriver: true }),
      Animated.spring(savedScale, { toValue: 1, useNativeDriver: true }),
    ]).start();
  };

  const today = new Date();
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const entry =
      history.find((h) => h.date === key) ??
      (i === 6 && saved ? { date: key, mood: selectedMood!, energy: selectedEnergy! } : undefined);
    return { key, label: DAY_LABELS[d.getDay()], entry, isToday: i === 6 };
  });

  const avgMood =
    history.length > 0
      ? (history.reduce((s, h) => s + h.mood, 0) / history.length).toFixed(1)
      : null;
  const trend =
    history.length >= 2
      ? history[history.length - 1].mood - history[history.length - 2].mood
      : 0;

  return (
    <View style={ciStyles.card}>
      {/* Header */}
      <View style={ciStyles.headerRow}>
        <View>
          <Text style={ciStyles.kicker}>HOW ARE YOU FEELING?</Text>
          <Text style={ciStyles.subtitle}>Daily check-in · tracked for weekly rhythm</Text>
        </View>
        {avgMood && (
          <View style={ciStyles.avgPill}>
            {trend > 0 ? (
              <TrendingUp size={11} color={colors.sageDark} strokeWidth={2} />
            ) : trend < 0 ? (
              <TrendingDown size={11} color={colors.primary} strokeWidth={2} />
            ) : (
              <Minus size={11} color={colors.textTertiary} strokeWidth={2} />
            )}
            <Text style={ciStyles.avgText}>{avgMood} / 5</Text>
            <Text style={ciStyles.avgScaleLabel}>Mood</Text>
          </View>
        )}
      </View>

      {/* 7-day mood dot trail with clear states */}
      <View style={ciStyles.trailRow}>
        {last7.map((day) => {
          const isLogged = !!day.entry;
          const moodColor = day.entry
            ? (MOOD_OPTIONS.find((m) => m.value === day.entry!.mood)?.color ?? colors.sage)
            : 'transparent';

          return (
            <View key={day.key} style={ciStyles.trailCell}>
              {day.isToday ? (
                // Distinct "Today" ring indicator
                <View style={ciStyles.todayRingOuter}>
                  <View
                    style={[
                      ciStyles.trailDot,
                      {
                        backgroundColor: isLogged ? moodColor : 'rgba(208, 120, 135, 0.15)',
                        borderColor: colors.rose,
                        borderWidth: 2,
                      },
                    ]}
                  >
                    {isLogged ? (
                      <Check size={12} color="#FFFFFF" strokeWidth={3} />
                    ) : (
                      <View style={ciStyles.todayInnerPulseDot} />
                    )}
                  </View>
                </View>
              ) : isLogged ? (
                // Logged past day
                <View
                  style={[
                    ciStyles.trailDot,
                    {
                      backgroundColor: moodColor,
                      borderColor: moodColor,
                      borderWidth: 1,
                    },
                  ]}
                >
                  <Check size={11} color="#FFFFFF" strokeWidth={2.5} />
                </View>
              ) : (
                // Missed past day
                <View
                  style={[
                    ciStyles.trailDot,
                    ciStyles.trailDotMissed,
                  ]}
                >
                  <View style={ciStyles.missedDash} />
                </View>
              )}

              <Text style={[ciStyles.trailLabel, day.isToday && ciStyles.trailLabelToday]}>
                {day.isToday ? 'Today' : day.label}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Tiny Legend for dot states */}
      <View style={ciStyles.legendRow}>
        <View style={ciStyles.legendItem}>
          <View style={[ciStyles.legendDot, { backgroundColor: colors.sage }]} />
          <Text style={ciStyles.legendText}>Logged</Text>
        </View>
        <View style={ciStyles.legendItem}>
          <View style={[ciStyles.legendDot, { borderColor: colors.borderMedium, borderWidth: 1.5, backgroundColor: 'transparent' }]} />
          <Text style={ciStyles.legendText}>Missed</Text>
        </View>
        <View style={ciStyles.legendItem}>
          <View style={[ciStyles.legendDot, { borderColor: colors.rose, borderWidth: 2, backgroundColor: 'rgba(208, 120, 135, 0.2)' }]} />
          <Text style={ciStyles.legendText}>Today</Text>
        </View>
      </View>

      {saved ? (
        <Animated.View style={[ciStyles.savedState, { transform: [{ scale: savedScale }] }]}>
          <CheckCircle2 size={20} color={colors.sage} strokeWidth={2} />
          <View style={{ flex: 1 }}>
            <Text style={ciStyles.savedTitle}>Logged for today</Text>
            <Text style={ciStyles.savedSubtitle}>
              Mood: {MOOD_OPTIONS.find((m) => m.value === selectedMood)?.label} ·{' '}
              Energy: {ENERGY_OPTIONS.find((e) => e.value === selectedEnergy)?.label}
            </Text>
          </View>
          <Pressable
            onPress={() => setSaved(false)}
            style={ciStyles.editBtn}
            accessibilityRole="button"
            accessibilityLabel="Edit today's check-in"
          >
            <Text style={ciStyles.editBtnText}>Edit</Text>
          </Pressable>
        </Animated.View>
      ) : (
        <>
          {/* Mood */}
          <Text style={ciStyles.selectorLabel}>Mood</Text>
          <View style={ciStyles.emojiRow}>
            {MOOD_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                style={[
                  ciStyles.emojiBtn,
                  selectedMood === opt.value && {
                    backgroundColor: opt.color + '22',
                    borderColor: opt.color,
                  },
                ]}
                onPress={() => setSelectedMood(opt.value)}
                accessibilityRole="radio"
                accessibilityState={{ checked: selectedMood === opt.value }}
                accessibilityLabel={opt.label}
              >
                <Text style={ciStyles.emojiGlyph}>{opt.emoji}</Text>
                <Text
                  style={[
                    ciStyles.emojiLabel,
                    selectedMood === opt.value && { color: opt.color, fontFamily: fontFamilies.sansSemiBold },
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Energy */}
          <Text style={[ciStyles.selectorLabel, { marginTop: 16 }]}>Energy</Text>
          <View style={ciStyles.energyRow}>
            {ENERGY_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                style={[
                  ciStyles.energyBtn,
                  selectedEnergy === opt.value && {
                    backgroundColor: opt.color,
                    borderColor: opt.color,
                  },
                ]}
                onPress={() => setSelectedEnergy(opt.value)}
                accessibilityRole="radio"
                accessibilityState={{ checked: selectedEnergy === opt.value }}
                accessibilityLabel={opt.label}
              >
                <Text
                  style={[
                    ciStyles.energyLabel,
                    selectedEnergy === opt.value && { color: '#FFFFFF', fontFamily: fontFamilies.sansSemiBold },
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            style={[ciStyles.saveBtn, !canSave && { opacity: 0.45 }]}
            onPress={handleSave}
            disabled={!canSave}
            accessibilityRole="button"
            accessibilityLabel="Save today's check-in"
          >
            <LinearGradient
              colors={canSave ? ['#D07887', '#9F4252'] : [colors.borderMedium, colors.borderMedium]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={ciStyles.saveBtnGradient}
            >
              <Text style={[ciStyles.saveBtnText, !canSave && { color: colors.textTertiary }]}>
                {canSave ? 'Log Today' : 'Select mood & energy'}
              </Text>
            </LinearGradient>
          </Pressable>
        </>
      )}
    </View>
  );
};

// ── MAIN SCREEN ───────────────────────────────────────────────────────────────

export const CoachScreen: React.FC<CoachScreenProps> = ({ answers }) => {
  const { userProfile, feelingCheckins, logFeeling } = useUserData(answers);
  const { isPaused, openPaywall } = useSubscription();
  const { t } = useLanguage();
  const [feelingHistory, setFeelingHistory] = useState<FeelingEntry[]>([]);

  // 1:1 Texting Coach ($55/mo) preferred app
  const [selectedMessagingApp, setSelectedMessagingApp] = useState<'whatsapp' | 'signal' | 'viber' | 'messenger'>('whatsapp');
  const [hasEnrolledTextCoach, setHasEnrolledTextCoach] = useState<boolean>(false);
  const [textCoachToast, setTextCoachToast] = useState<boolean>(false);
  const [leadModalVisible, setLeadModalVisible] = useState<boolean>(false);

  // Digital 30-day programs
  const [selectedProgram, setSelectedProgram] = useState<FitnessProgram | null>(null);
  const [checkoutProduct, setCheckoutProduct] = useState<any | null>(null);

  // Sync feeling history from real Supabase check-ins
  React.useEffect(() => {
    if (feelingCheckins) {
      setFeelingHistory(feelingCheckins.map((f) => ({ date: f.date, mood: f.mood, energy: f.energy })));
    }
  }, [feelingCheckins]);

  const todayEntry = feelingHistory.find((h) => h.date === todayKey());

  const userName = userProfile.fullName ? userProfile.fullName.split(' ')[0] : '';
  const greetingText = userName ? `Hi ${userName}` : 'Welcome';

  const [messages, setMessages] = useState<CoachMessage[]>([
    {
      id: 'welcome',
      role: 'coach',
      text: `${greetingText}. I'm your Fortywell coach — trained in hormone physiology, joint longevity, and nervous system pacing for women 40+.\n\nTell me how you feel today so we can personalise your workouts and log your recovery signals for your weekly analysis.`,
      timestamp: new Date(),
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isDeepThink, setIsDeepThink] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [weeklySignalsCount, setWeeklySignalsCount] = useState(0);

  // 1:1 Personalisation Booking / Waitlist state
  const [hasJoinedWaitlist, setHasJoinedWaitlist] = useState<boolean>(false);
  const [showWaitlistToast, setShowWaitlistToast] = useState<boolean>(false);

  const handleBookConsultationPress = useCallback(() => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (_) {}
    setHasJoinedWaitlist(true);
    setShowWaitlistToast(true);
    setTimeout(() => {
      setShowWaitlistToast(false);
    }, 4000);
  }, []);

  React.useEffect(() => {
    setWeeklySignalsCount(feelingCheckins.length);
  }, [feelingCheckins.length]);

  const rotatedArticles = useMemo(() => getDailyRotatedArticles(), []);
  const [activeArticle, setActiveArticle] = useState<EducationalArticle | null>(null);
  const [activeInsight, setActiveInsight] = useState(0);

  // Dynamic daily insights with day-1 welcome insight for new users
  const dailyInsights = useMemo(() => {
    if (feelingHistory.length === 0) {
      return [
        {
          id: 'ins-welcome',
          phase: 'Day 1 Rhythm',
          phaseColor: '#D07887',
          headline: "Welcome — let's start figuring out what works for you.",
          body: "Log how you're feeling today to personalize your workouts and build your recovery signals with zero pressure.",
          tag: 'WELCOME TO COACH',
        },
        ...DAILY_INSIGHTS,
      ];
    }
    return DAILY_INSIGHTS;
  }, [feelingHistory.length]);

  const [habits, setHabits] = useState<HabitItem[]>([
    { id: 'h1', label: '10 min of movement or walking', iconType: 'heart', checked: false },
    { id: 'h2', label: 'Hydrated before noon',          iconType: 'leaf',  checked: false },
    { id: 'h3', label: 'Screen-free 30 min before bed', iconType: 'moon',  checked: false },
    { id: 'h4', label: 'Noticed one stress signal',     iconType: 'wind',  checked: false },
  ]);

  // Load persistent daily habits on mount
  React.useEffect(() => {
    let isMounted = true;
    const tKey = todayKey();

    async function loadHabits() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const uid = user?.id || userProfile.id;
        const storageKey = uid ? `@fortywell_habits_${tKey}_${uid}` : `@fortywell_habits_${tKey}`;

        // 1. Check local storage
        const raw = await AsyncStorage.getItem(storageKey);
        if (raw && isMounted) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setHabits(parsed);
          }
        }

        // 2. Sync from Supabase daily_habits table
        if (uid) {
          const { data: cloudHabits } = await supabase
            .from('daily_habits')
            .select('habit_id, completed')
            .eq('user_id', uid)
            .eq('date', tKey);

          if (cloudHabits && cloudHabits.length > 0 && isMounted) {
            setHabits((prev) => {
              const updated = prev.map((h) => {
                const cloud = cloudHabits.find((c: any) => c.habit_id === h.id);
                return cloud ? { ...h, checked: cloud.completed } : h;
              });
              AsyncStorage.setItem(storageKey, JSON.stringify(updated)).catch(() => {});
              return updated;
            });
          }
        }
      } catch (_) {}
    }

    loadHabits();
    return () => { isMounted = false; };
  }, [userProfile.id]);

  // Load persistent chat messages (all stored, but display only recent ones)
  React.useEffect(() => {
    let isMounted = true;
    async function loadSavedChat() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const uid = user?.id || userProfile.id;
        const chatKey = uid ? `@fortywell_coach_chat_history_${uid}` : '@fortywell_coach_chat_history';
        const fullKey = uid ? `@fortywell_coach_chat_history_full_${uid}` : '@fortywell_coach_chat_history_full';

        const raw = await AsyncStorage.getItem(chatKey);
        if (raw && isMounted) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const now = Date.now();
            const allMessages = parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
            // Filter display to only show messages from last 5 hours
            const recentMessages = allMessages.filter(
              (m: CoachMessage) => now - m.timestamp.getTime() < MESSAGE_DISPLAY_WINDOW_MS
            );
            // Always include at least the welcome message if no recent messages
            setMessages(recentMessages.length > 0 ? recentMessages : [allMessages[0] || { id: 'welcome', role: 'coach' as const, text: '', timestamp: new Date() }]);
            // Store full history in a separate key for potential future use (e.g., analytics)
            if (allMessages.length > 0) {
              AsyncStorage.setItem(fullKey, JSON.stringify(allMessages.slice(-50))).catch(() => {});
            }
          }
        }
      } catch (_) {}
    }
    loadSavedChat();
    return () => { isMounted = false; };
  }, [userProfile.id]);

  // Save chat messages whenever new message is sent/received
  React.useEffect(() => {
    if (messages.length > 1) {
      const uid = userProfile.id;
      const chatKey = uid ? `@fortywell_coach_chat_history_${uid}` : '@fortywell_coach_chat_history';
      const fullKey = uid ? `@fortywell_coach_chat_history_full_${uid}` : '@fortywell_coach_chat_history_full';

      // Save full history (up to 50 messages) to preserve older conversations
      AsyncStorage.getItem(fullKey).then((raw) => {
        let fullHistory: CoachMessage[] = [];
        if (raw) {
          try {
            fullHistory = JSON.parse(raw).map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
          } catch (_) {}
        }
        // Merge new messages with history, remove duplicates by id
        const existingIds = new Set(fullHistory.map((m) => m.id));
        const newMsgs = messages.filter((m) => !existingIds.has(m.id));
        const merged = [...fullHistory, ...newMsgs].slice(-50);
        AsyncStorage.setItem(fullKey, JSON.stringify(merged)).catch(() => {});
      });
      // Display only recent messages (up to 30)
      AsyncStorage.setItem(chatKey, JSON.stringify(messages.slice(-30))).catch(() => {});
    }
  }, [messages, userProfile.id]);

  const scrollRef = useRef<ScrollView>(null);
  const typingOpac = useRef(new Animated.Value(0)).current;

  const HABIT_ICON_COLORS: Record<HabitItem['iconType'], string> = {
    heart: colors.rose,
    leaf:  colors.sageDark,
    moon:  '#7B68B5',
    wind:  colors.textTertiary,
  };

  const toggleHabit = useCallback((id: string) => {
    const tKey = todayKey();

    setHabits((prev) => {
      const next = prev.map((h) => (h.id === id ? { ...h, checked: !h.checked } : h));
      const uid = userProfile.id;
      const storageKey = uid ? `@fortywell_habits_${tKey}_${uid}` : `@fortywell_habits_${tKey}`;
      AsyncStorage.setItem(storageKey, JSON.stringify(next)).catch(() => {});

      const target = next.find((h) => h.id === id);
      if (target) {
        supabase.auth.getUser().then(({ data: { user } }) => {
          const authId = user?.id || uid;
          if (authId) {
            supabase
              .from('daily_habits')
              .upsert(
                {
                  user_id: authId,
                  date: tKey,
                  habit_id: id,
                  completed: target.checked,
                  updated_at: new Date().toISOString(),
                },
                { onConflict: 'user_id,date,habit_id' }
              )
              .then();
          }
        }).catch(() => {});
      }

      return next;
    });
    try { if (Platform.OS !== 'web') Haptics.selectionAsync(); } catch (_) {}
  }, [userProfile.id]);

  const handleSaveFeeling = useCallback(async (entry: Omit<FeelingEntry, 'date'>) => {
    const key = todayKey();
    setFeelingHistory((prev) => [...prev.filter((h) => h.date !== key), { ...entry, date: key }]);
    await logFeeling(entry.mood, entry.energy);
    setWeeklySignalsCount((prev) => prev + 1);
  }, [logFeeling]);

  // AI Intent-Aware Message Handler
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;
    if (isPaused) {
      openPaywall('coach_chat');
      return;
    }
    const cleanText = text.trim();

    const userMsg: CoachMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: cleanText,
      timestamp: new Date(),
      isDeepThink,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setShowAttachMenu(false);
    setIsTyping(true);
    Animated.timing(typingOpac, { toValue: 1, duration: 200, useNativeDriver: true }).start();

    // Step 1: Detect intent — used for DB side-effects regardless of who replies
    const intentResult = detectIntent(cleanText, answers);

    // Step 2: If it's a goal preference, always save it to Supabase
    if (intentResult.intent === 'goal_preference' && intentResult.trainingPreference) {
      setWeeklySignalsCount((prev) => prev + 1);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          saveTrainingPreference(user.id, intentResult.trainingPreference);
        }
      } catch (_) {}
    }

    // Step 3: Decide who generates the reply
    const useAI = shouldUseGroqAI(cleanText, intentResult.intent);

    let replyText = '';
    let classification: ClassificationResult | undefined;

    if (useAI) {
      // ── Groq AI path ────────────────────────────────────────────────────
      const todayFeeling = todayEntry
        ? `Mood ${todayEntry.mood}/5, Energy ${todayEntry.energy}/5`
        : undefined;

      const conversationHistory = messages.map(m => ({ role: m.role, content: m.text }));

      const groqResult = await sendToGroq(cleanText, conversationHistory, answers, {
        currentFeeling: todayFeeling,
      });

      if (groqResult.success && groqResult.reply) {
        replyText = groqResult.reply;
      } else {
        // Groq failed — use canned reply as true last resort
        console.warn('[Coach] Groq failed, using fallback. Error:', groqResult.error);
        replyText = intentResult.coachReply || getFallbackReply();
      }

      // ── AI-determined weekly analysis saving (replaces keyword classifier) ──
      // groqResult.weeklySignal is set by the AI itself based on message content.
      // This correctly catches energy, sleep, stress, soreness etc even when
      // the intent engine didn't keyword-match them as 'feeling_checkin'.
      if (groqResult.weeklySignal?.shouldSave) {
        setWeeklySignalsCount((prev) => prev + 1);
        // Build a minimal ClassificationResult so the UI can show the tag
        classification = {
          category: 'General Coaching',
          categoryIcon: 'sparkles',
          confidence: 0.9,
          sentiment: 'neutral',
          extractedSignals: [groqResult.weeklySignal.insight],
          workoutAdaptation: '',
          weeklyAnalysisTag: `💾 ${groqResult.weeklySignal.tag}`,
          shouldSaveForWeeklyAnalysis: true,
          coachReply: replyText,
        };
      } else if (intentResult.intent === 'feeling_checkin') {
        // Fallback: if Groq had no signal but intent was feeling_checkin, still classify
        classification = classifyUserFeelingMessage(cleanText, isDeepThink, answers);
        if (classification.shouldSaveForWeeklyAnalysis) {
          setWeeklySignalsCount((prev) => prev + 1);
        }
      }

      // Groq already took real time — deliver reply immediately
      const coachMsg: CoachMessage = {
        id: `c-${Date.now()}`,
        role: 'coach',
        text: replyText,
        timestamp: new Date(),
        classification,
        isDeepThink,
      };

      setIsTyping(false);
      Animated.timing(typingOpac, { toValue: 0, duration: 150, useNativeDriver: true }).start();
      setMessages((prev) => [...prev, coachMsg]);

      try {
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (_) {}

    } else {
      // ── Pre-built path (simple greetings / ≤3 word messages) ───────────
      replyText = intentResult.coachReply;

      if (intentResult.intent === 'feeling_checkin' || !replyText) {
        classification = classifyUserFeelingMessage(cleanText, isDeepThink, answers);
        replyText = classification.coachReply;
        if (classification.shouldSaveForWeeklyAnalysis) {
          setWeeklySignalsCount((prev) => prev + 1);
        }
      }

      const latency = isDeepThink ? 1600 : 1100;

      setTimeout(() => {
        const coachMsg: CoachMessage = {
          id: `c-${Date.now()}`,
          role: 'coach',
          text: replyText,
          timestamp: new Date(),
          classification,
          isDeepThink,
        };

        setIsTyping(false);
        Animated.timing(typingOpac, { toValue: 0, duration: 150, useNativeDriver: true }).start();
        setMessages((prev) => [...prev, coachMsg]);

        try {
          if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (_) {}
      }, latency);
    }
  }, [isDeepThink, answers, typingOpac, messages, todayEntry, isPaused, openPaywall]);

  const toggleVoiceRecording = () => {
    if (!isRecordingVoice) {
      setIsRecordingVoice(true);
      try { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch (_) {}
      setTimeout(() => {
        setInputText("Woke up feeling sore in my hips and energy is low today");
        setIsRecordingVoice(false);
      }, 2200);
    } else {
      setIsRecordingVoice(false);
    }
  };

  const checkedCount = habits.filter((h) => h.checked).length;
  const dailyFeaturedArticles = useMemo(() => rotatedArticles.slice(0, 3), [rotatedArticles]);

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        ref={scrollRef}
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── HEADER ── */}
        <View style={s.header}>
          <View style={{ flex: 1 }}>
            <Text style={s.headerKicker}>{t('coach.headerKicker')}</Text>
            <Text style={s.headerTitle}>{t('coach.title')}</Text>
          </View>
          <View style={s.avatarWrap}>
            <LinearGradient colors={['#D07887', '#9F4252']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.avatar}>
              <Sparkles size={18} color="#FFF5EF" strokeWidth={1.8} />
            </LinearGradient>
            <View style={s.onlineDot} />
          </View>
        </View>

        {/* ── FEELING CHECK-IN ── */}
        <FeelingCheckIn history={feelingHistory} onSave={handleSaveFeeling} todayEntry={todayEntry} />

        {/* ── DISCLAIMER ── */}
        <View style={s.disclaimer}>
          <Info size={12} color={colors.textTertiary} strokeWidth={1.8} />
          <Text style={s.disclaimerText}>
            {t('coach.disclaimer')}
          </Text>
        </View>

        {/* ── TODAY'S INSIGHT — DARK HERO CARD ── */}
        <View style={s.section}>
          <View style={s.sectionRow}>
            <Text style={s.sectionKicker}>{t('coach.todaysInsight')}</Text>
            <View style={s.dotRow}>
              {dailyInsights.map((_, i) => (
                <View key={i} style={[s.dot, i === activeInsight && s.dotActive]} />
              ))}
            </View>
          </View>

          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / (SCREEN_W - 48));
              setActiveInsight(Math.max(0, Math.min(idx, dailyInsights.length - 1)));
            }}
            style={s.carouselScroll}
            contentContainerStyle={s.carouselContent}
          >
            {dailyInsights.map((insight) => (
              <View key={insight.id} style={[s.heroCard, { width: SCREEN_W - 48 }]}>
                <View style={s.heroGlowOverlay} pointerEvents="none" />

                <View style={s.heroTop}>
                  <View style={[s.phasePill, { backgroundColor: insight.phaseColor + '28' }]}>
                    <View style={[s.phaseDot, { backgroundColor: insight.phaseColor }]} />
                    <Text style={[s.phaseText, { color: insight.phaseColor }]}>{insight.phase}</Text>
                  </View>
                  <Text style={s.heroTag}>{insight.tag}</Text>
                </View>

                <Text style={s.heroHeadline}>{insight.headline}</Text>
                <Text style={s.heroBody}>{insight.body}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* ── TODAY'S HABITS ── */}
        <View style={s.section}>
          <View style={s.sectionRow}>
            <Text style={s.sectionKicker}>{t('coach.todaysHabits')}</Text>
            <View style={[s.pillBadge, { backgroundColor: colors.sageSoft, borderColor: colors.sageBorder }]}>
              <Text style={[s.pillBadgeText, { color: colors.sageDark }]}>
                {t('coach.habitsDone', { done: checkedCount, total: habits.length })}
              </Text>
            </View>
          </View>

          <View style={s.habitCard}>
            {habits.map((habit, idx) => (
              <Pressable
                key={habit.id}
                onPress={() => toggleHabit(habit.id)}
                style={[
                  s.habitRow,
                  idx < habits.length - 1 && s.habitRowDivider,
                  habit.checked && s.habitRowChecked,
                ]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: habit.checked }}
                accessibilityLabel={habit.label}
              >
                <View style={[
                  s.habitIconWrap,
                  { borderColor: HABIT_ICON_COLORS[habit.iconType] + '44',
                    backgroundColor: HABIT_ICON_COLORS[habit.iconType] + '14' },
                ]}>
                  {renderHabitIcon(habit.iconType, habit.checked ? HABIT_ICON_COLORS[habit.iconType] : colors.textTertiary)}
                </View>

                <Text style={[s.habitLabel, habit.checked && s.habitLabelChecked]}>
                  {habit.label}
                </Text>

                <View style={s.habitCheckWrap}>
                  {habit.checked ? (
                    <CheckCircle2 size={22} color={colors.sage} strokeWidth={2} />
                  ) : (
                    <Circle size={22} color={colors.borderMedium} strokeWidth={1.8} />
                  )}
                </View>
              </Pressable>
            ))}

            {checkedCount === habits.length && (
              <View style={s.allDoneBanner}>
                <Sparkles size={14} color={colors.sageDark} strokeWidth={1.8} />
                <Text style={s.allDoneText}>{t('coach.allHabitsDone')}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── COACH CHAT SECTION (WARM & HUMAN) ── */}
        <View style={s.section}>
          {/* Section header */}
          <View style={s.sectionRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={s.sectionKicker}>{t('coach.talkToCoach')}</Text>
              <View style={s.warmPill}>
                <Sparkles size={9} color={colors.primaryDark} strokeWidth={2} />
                <Text style={s.warmPillText}>{t('coach.adaptsToYou')}</Text>
              </View>
            </View>
            <View style={s.weeklySignalsBadge}>
              <Database size={10} color={colors.sageDark} strokeWidth={2} />
              <Text style={s.weeklySignalsText}>{t('coach.insightsSaved', { count: weeklySignalsCount })}</Text>
            </View>
          </View>

          {/* Warm conversational prompt */}
          <View style={s.chatPromptBanner}>
            <Text style={s.chatHeroPromptTitle}>{t('coach.howAreYouFeeling')}</Text>
            <Text style={s.chatHeroPromptSubtitle}>
              {t('coach.logMoodEnergySubtitle')}
            </Text>
          </View>

          {/* Quick prompt chips — clean multi-row wrap grid with zero text cutoff */}
          <View style={s.chipsWrapGrid}>
            {PROMPT_CHIPS.map((chip) => (
              <Pressable
                key={chip.id}
                style={s.chip}
                onPress={() => sendMessage(chip.label)}
                accessibilityRole="button"
                accessibilityLabel={chip.label}
              >
                <Text style={s.chipText}>{chip.label}</Text>
              </Pressable>
            ))}
          </View>

          {/* Chat Messages */}
          <View style={s.chatContainer}>
            {messages.map((msg) => (
              <View
                key={msg.id}
                style={[s.msgWrap, msg.role === 'user' && s.msgWrapUser]}
              >
                {msg.role === 'coach' && (
                  <View style={s.coachDot}>
                    <Sparkles size={10} color="#FFF5EF" strokeWidth={2} />
                  </View>
                )}

                <View style={[s.bubble, msg.role === 'user' ? s.bubbleUser : s.bubbleCoach]}>
                  {/* Deep Think User Mode Badge */}
                  {msg.role === 'user' && msg.isDeepThink && (
                    <View style={s.userDeepThinkBadge}>
                      <Brain size={10} color="#FFF5EF" strokeWidth={2} />
                      <Text style={s.userDeepThinkText}>DEEP ANALYSIS REQUESTED</Text>
                    </View>
                  )}

                  <Text style={[s.bubbleText, msg.role === 'user' && s.bubbleTextUser]}>
                    {msg.text}
                  </Text>

                  {/* AI Classification & Workout Personalization Cards on Coach Reply */}
                  {msg.role === 'coach' && msg.classification && (
                    <View style={s.classificationCard}>
                      {/* Weekly Analysis Tag */}
                      <View style={s.weeklyTagPill}>
                        <Database size={11} color={colors.primaryDark} strokeWidth={2} />
                        <Text style={s.weeklyTagText}>
                          {msg.classification.weeklyAnalysisTag}
                        </Text>
                      </View>

                      {/* Workout Adaptation Pill */}
                      <View style={s.adaptationPill}>
                        <Sliders size={11} color={colors.sageDark} strokeWidth={2} />
                        <Text style={s.adaptationText}>
                          {msg.classification.workoutAdaptation}
                        </Text>
                      </View>

                      {/* Deep Reasoning Box (if Think mode was active) */}
                      {msg.classification.deepReasoning && (
                        <View style={s.deepReasoningBox}>
                          <View style={s.deepReasoningHeader}>
                            <Brain size={12} color="#7B68B5" strokeWidth={2} />
                            <Text style={s.deepReasoningTitle}>PHYSIOLOGICAL MECHANISM</Text>
                          </View>
                          <Text style={s.deepReasoningBody}>
                            {msg.classification.deepReasoning.physiologicalMechanism}
                          </Text>
                          <Text style={[s.deepReasoningBody, { marginTop: 4, color: colors.textTertiary }]}>
                            • Hormone Context: {msg.classification.deepReasoning.hormoneContext}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </View>
            ))}

            {isTyping && (
              <Animated.View style={[s.msgWrap, { opacity: typingOpac }]}>
                <View style={s.coachDot}>
                  <Sparkles size={9} color="#FFF5EF" strokeWidth={2} />
                </View>
                <View style={[s.bubble, s.bubbleCoach, s.typingBubble]}>
                  <View style={s.typingHeaderRow}>
                    <Brain size={12} color={colors.primaryDark} strokeWidth={2} />
                    <Text style={s.typingHeaderText}>
                      {isDeepThink ? 'Running Deep Hormone & Biomechanics Analysis…' : 'Personalising Workout & Classifying…'}
                    </Text>
                  </View>
                  <View style={s.typingDots}>
                    <View style={s.typingDot} />
                    <View style={[s.typingDot, { opacity: 0.55 }]} />
                    <View style={[s.typingDot, { opacity: 0.25 }]} />
                  </View>
                </View>
              </Animated.View>
            )}
          </View>

          {/* ── IN-LINE WHITE & ROSE CHATBOT BAR (STAYS IN PLACE RIGHT HERE) ── */}
          <View style={s.inlineChatbotWrap}>
            {/* Quick Attach Popup Menu */}
            {showAttachMenu && (
              <View style={s.attachMenuPopup}>
                <Text style={s.attachMenuTitle}>QUICK FEELING LOG</Text>
                <View style={s.attachTagRow}>
                  {QUICK_ATTACH_TAGS.map((tag, idx) => (
                    <Pressable
                      key={idx}
                      style={s.attachTagBtn}
                      onPress={() => {
                        setInputText(tag);
                        setShowAttachMenu(false);
                      }}
                    >
                      <Text style={s.attachTagText}>{tag}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* White & Rose Chatbot Pill */}
            <View style={s.whiteRoseChatbotPill}>
              {/* Left (+) Context Attach Button */}
              <Pressable
                style={[s.pillLeftBtn, showAttachMenu && s.pillLeftBtnActive]}
                onPress={() => {
                  setShowAttachMenu((prev) => !prev);
                  try { if (Platform.OS !== 'web') Haptics.selectionAsync(); } catch (_) {}
                }}
                accessibilityRole="button"
                accessibilityLabel="Add feeling signal context"
              >
                <Plus size={18} color={colors.rose} strokeWidth={2.4} />
              </Pressable>

              {/* Middle TextInput */}
              <TextInput
                style={s.pillInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Tell coach how you feel…"
                placeholderTextColor={colors.textTertiary}
                multiline={false}
                maxLength={400}
                returnKeyType="send"
                onSubmitEditing={() => sendMessage(inputText)}
                accessibilityLabel="Message coach"
              />

              {/* Right Action Group: [Think] + [Mic] + [Send Arrow] */}
              <View style={s.pillRightGroup}>
                {/* Think / Deep Analysis Mode Toggle */}
                <Pressable
                  style={[s.thinkToggleBtn, isDeepThink && s.thinkToggleBtnActive]}
                  onPress={() => {
                    setIsDeepThink((prev) => !prev);
                    try { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (_) {}
                  }}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: isDeepThink }}
                  accessibilityLabel="Toggle deep AI analysis reasoning"
                >
                  <Brain size={14} color={isDeepThink ? '#9F4252' : colors.rose} strokeWidth={2} />
                  <Text style={[s.thinkToggleText, isDeepThink && s.thinkToggleTextActive]}>
                    Think
                  </Text>
                </Pressable>

                {/* Voice Dictation Mic Button */}
                <Pressable
                  style={[s.micBtn, isRecordingVoice && s.micBtnActive]}
                  onPress={toggleVoiceRecording}
                  accessibilityRole="button"
                  accessibilityLabel="Voice check-in dictation"
                >
                  {isRecordingVoice ? (
                    <MicOff size={16} color={colors.primaryDark} strokeWidth={2.2} />
                  ) : (
                    <Mic size={16} color={colors.rose} strokeWidth={2} />
                  )}
                </Pressable>

                {/* Circular Send Button (Up Arrow) */}
                <Pressable
                  style={[
                    s.pillSendBtn,
                    inputText.trim() ? s.pillSendBtnActive : s.pillSendBtnDisabled,
                  ]}
                  onPress={() => sendMessage(inputText)}
                  disabled={!inputText.trim()}
                  accessibilityRole="button"
                  accessibilityLabel="Send check-in message"
                >
                  <ArrowUp size={16} color="#FFFFFF" strokeWidth={2.6} />
                </Pressable>
              </View>
            </View>

            {/* Pinned Subtitle & Safety Note */}
            <View style={s.chatSafetyFooter}>
              <ShieldCheck size={11} color={colors.textTertiary} strokeWidth={1.8} />
              <Text style={s.chatSafetyText}>
                Classified & saved for weekly analysis. For injury, always see a doctor.
              </Text>
            </View>
          </View>
        </View>

        {/* ── 30-DAY DIGITAL TRAINING PROGRAMS & PRICING ── */}
        <View style={s.section}>
          <View style={s.sectionRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={s.sectionKicker}>30-DAY MASTER PROGRAMS</Text>
              <View style={s.programsPill}>
                <Sparkles size={9} color={colors.primaryDark} strokeWidth={2} />
                <Text style={s.programsPillText}>FULL PROTOCOLS</Text>
              </View>
            </View>
            <View style={s.priceFromBadge}>
              <Text style={s.priceFromText}>$19.99 each</Text>
            </View>
          </View>

          {/* Program cards list */}
          <View style={s.programCardsList}>
            {FITNESS_PROGRAMS.map((prog) => (
              <Pressable
                key={prog.id}
                style={s.coachProgramCard}
                onPress={() => {
                  try {
                    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  } catch (_) {}
                  setSelectedProgram(prog);
                }}
                accessibilityRole="button"
                accessibilityLabel={`View ${prog.name}`}
              >
                <LinearGradient
                  colors={prog.gradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={s.coachProgramCardGrad}
                >
                  <View style={s.coachProgTopRow}>
                    <View style={s.coachProgTagWrap}>
                      <Text style={s.coachProgTagText}>{prog.tag}</Text>
                    </View>
                    <View style={s.coachProgBadge}>
                      <Text style={s.coachProgBadgeText}>{prog.badge}</Text>
                    </View>
                  </View>

                  <Text style={s.coachProgTitle}>{prog.name}</Text>
                  <Text style={s.coachProgSubtitle}>{prog.subtitle}</Text>

                  <View style={s.coachProgChipsRow}>
                    <View style={s.coachProgChip}>
                      <Calendar size={11} color="#FFFFFF" />
                      <Text style={s.coachProgChipText}>30 Days</Text>
                    </View>
                    <View style={s.coachProgChip}>
                      <Clock size={11} color="#FFFFFF" />
                      <Text style={s.coachProgChipText}>{prog.sessionDuration}</Text>
                    </View>
                    <View style={s.coachProgChip}>
                      <Dumbbell size={11} color="#FFFFFF" />
                      <Text style={s.coachProgChipText}>{prog.sessionsPerWeek}x / wk</Text>
                    </View>
                  </View>

                  <View style={s.coachProgFooter}>
                    <View style={s.coachProgPriceRow}>
                      <Text style={s.coachProgPriceCurrent}>${prog.price.toFixed(2)}</Text>
                      <Text style={s.coachProgPriceOld}>${prog.originalPrice.toFixed(2)}</Text>
                    </View>
                    <View style={s.coachProgBtn}>
                      <Text style={s.coachProgBtnText}>Explore Plan & Diet</Text>
                      <ChevronRight size={14} color="#FFFFFF" strokeWidth={2.4} />
                    </View>
                  </View>
                </LinearGradient>
              </Pressable>
            ))}

            {/* Bundle Offer in Coach Screen */}
            <View style={s.coachBundleCard}>
              <LinearGradient
                colors={['#1A1614', '#2D2622']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.coachBundleGrad}
              >
                <View style={s.coachBundleTopRow}>
                  <View style={s.coachBundleTag}>
                    <Sparkles size={11} color="#D4A574" />
                    <Text style={s.coachBundleTagText}>TRILOGY PASS</Text>
                  </View>
                  <View style={s.coachBundleDiscount}>
                    <Text style={s.coachBundleDiscountText}>SAVE 66%</Text>
                  </View>
                </View>

                <Text style={s.coachBundleTitle}>All 3 Programs Bundle</Text>
                <Text style={s.coachBundleDesc}>
                  Get the Weight Loss Reset, Strength Routine, and Mobility Program with full nutrition guides and lifetime access.
                </Text>

                <View style={s.coachBundleFooter}>
                  <View style={s.coachBundlePriceCol}>
                    <View style={s.coachBundlePriceRow}>
                      <Text style={s.coachBundlePriceVal}>${PROGRAMS_BUNDLE_PRICE.toFixed(2)}</Text>
                      <Text style={s.coachBundlePriceOldVal}>${PROGRAMS_BUNDLE_ORIGINAL.toFixed(2)}</Text>
                    </View>
                    <Text style={s.coachBundlePriceMeta}>One-time payment</Text>
                  </View>

                  <Pressable
                    style={s.coachBundleBtn}
                    onPress={() => {
                      setCheckoutProduct({
                        id: 'programs-3in1-bundle',
                        name: 'Complete 40+ Reset Trilogy (3 Programs)',
                        subtitle: 'Weight Loss + Strength Routine + Stretching & Mobility (Lifetime)',
                        price: PROGRAMS_BUNDLE_PRICE,
                        originalPrice: PROGRAMS_BUNDLE_ORIGINAL,
                        image: require('../assets/products/mat_main.jpg'),
                      });
                    }}
                  >
                    <Text style={s.coachBundleBtnText}>Get All 3</Text>
                    <ArrowUpRight size={15} color="#FFFFFF" strokeWidth={2.4} />
                  </Pressable>
                </View>
              </LinearGradient>
            </View>
          </View>
        </View>

        {/* ── 1:1 PERSONALISATION / TEXTING COACH & CONSULTATION ── */}
        <View style={s.section}>
          <View style={s.sectionRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={s.sectionKicker}>1:1 EXPERT CARE</Text>
              <View style={s.consultationPill}>
                <Crown size={10} color={colors.primaryDark} strokeWidth={2} />
                <Text style={s.consultationPillText}>VIP ACCESS</Text>
              </View>
            </View>
            <Text style={s.waitlistTag}>Limited spots</Text>
          </View>

          {/* 1:1 Daily Texting Coach Card ($55/month) */}
          <View style={s.consultationCard}>
            <LinearGradient
              colors={['#FFFFFF', '#FFF9F6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.consultationGradient}
            >
              {/* Top Header Row */}
              <View style={s.consultationHeaderRow}>
                <View style={s.consultationIconWrap}>
                  <UserCheck size={20} color={colors.primaryDark} strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={s.consultationTitle}>1:1 Daily Text Coach</Text>
                    <View style={s.pricingTag}>
                      <Text style={s.pricingTagText}>$55/mo</Text>
                    </View>
                  </View>
                  <Text style={s.consultationSubtitle}>Daily check-ups & direct protocol tweaks</Text>
                </View>
              </View>

              {/* Description Body */}
              <Text style={s.consultationBody}>
                Text every single day with a dedicated clinical physiologist. Get proactive morning check-ins, custom workout adaptations on the fly, and compassionate accountability via your favourite messaging app.
              </Text>

              {/* App Picker */}
              <Text style={s.appPickerLabel}>CHOOSE YOUR PREFERRED MESSAGING APP:</Text>
              <View style={s.appPickerRow}>
                {[
                  { id: 'whatsapp', name: 'WhatsApp' },
                  { id: 'signal',   name: 'Signal' },
                  { id: 'viber',    name: 'Viber' },
                  { id: 'messenger', name: 'Messenger' },
                ].map((app) => {
                  const isSelected = selectedMessagingApp === app.id;
                  return (
                    <Pressable
                      key={app.id}
                      style={[s.appPill, isSelected && s.appPillSelected]}
                      onPress={() => {
                        try { if (Platform.OS !== 'web') Haptics.selectionAsync(); } catch (_) {}
                        setSelectedMessagingApp(app.id as any);
                      }}
                    >
                      <Text style={[s.appPillText, isSelected && s.appPillTextSelected]}>
                        {app.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* 3 Pillar Value Chips */}
              <View style={s.consultationChipsRow}>
                <View style={s.consultationChip}>
                  <CheckCircle2 size={12} color={colors.sageDark} strokeWidth={2.2} />
                  <Text style={s.consultationChipText}>Daily Text Check-ins</Text>
                </View>
                <View style={s.consultationChip}>
                  <CheckCircle2 size={12} color={colors.sageDark} strokeWidth={2.2} />
                  <Text style={s.consultationChipText}>No App Switching</Text>
                </View>
                <View style={s.consultationChip}>
                  <CheckCircle2 size={12} color={colors.sageDark} strokeWidth={2.2} />
                  <Text style={s.consultationChipText}>Real Specialist</Text>
                </View>
              </View>

              {/* Action Button */}
              <Pressable
                style={[
                  s.consultationBtn,
                  hasEnrolledTextCoach && s.consultationBtnJoined,
                ]}
                onPress={() => {
                  try { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (_) {}
                  setLeadModalVisible(true);
                }}
                accessibilityRole="button"
                accessibilityLabel="Enroll in 1:1 Text Coaching for $55 per month"
              >
                {hasEnrolledTextCoach ? (
                  <View style={s.consultationBtnInner}>
                    <Check size={16} color={colors.sageDark} strokeWidth={2.5} />
                    <Text style={s.consultationBtnTextJoined}>
                      Enrolled on {selectedMessagingApp.toUpperCase()}
                    </Text>
                  </View>
                ) : (
                  <View style={s.consultationBtnInner}>
                    <Calendar size={15} color="#FFFFFF" strokeWidth={2} />
                    <Text style={s.consultationBtnText}>
                      Start Daily Text Coach ($55/mo)
                    </Text>
                    <ChevronRight size={15} color="#FFFFFF" strokeWidth={2.2} />
                  </View>
                )}
              </Pressable>

              {/* Toast */}
              {textCoachToast && (
                <View style={s.consultationToast}>
                  <Sparkles size={13} color={colors.primaryDark} strokeWidth={2} />
                  <Text style={s.consultationToastText}>
                    You're set! Your dedicated coach will message you on {selectedMessagingApp.toUpperCase()} shortly.
                  </Text>
                </View>
              )}
            </LinearGradient>
          </View>
        </View>

        {/* ── LEARN (3 daily featured cards from 52 background dataset) ── */}
        <View style={s.section}>
          <View style={s.sectionRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={s.sectionKicker}>LEARN</Text>
              <View style={s.rotatePill}>
                <Shuffle size={9} color={colors.primaryDark} strokeWidth={2} />
                <Text style={s.rotatePillText}>ROTATES EVERY 24H</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <BookOpen size={11} color={colors.primary} strokeWidth={1.8} />
              <Text style={s.evidenceTag}>Evidence-based</Text>
            </View>
          </View>

          {/* Exactly 3 article cards */}
          {dailyFeaturedArticles.map((card, idx) => {
            const accent = getCardAccent(idx);
            return (
              <Pressable
                key={card.id}
                style={[s.eduCard, { borderLeftColor: accent.border }]}
                onPress={() => {
                  setActiveArticle(card);
                  try { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (_) {}
                }}
                accessibilityRole="button"
                accessibilityLabel={`${card.title}, ${card.readTime}`}
              >
                <View style={s.eduCardTop}>
                  <View style={[s.eduIconWrap, { backgroundColor: accent.iconBg }]}>
                    {renderArticleIcon(card.iconType, accent.iconColor, 14)}
                  </View>
                  <Text style={s.eduTag}>{card.tag}</Text>
                  <Text style={s.eduReadTime}>· {card.readTime}</Text>
                </View>

                <Text style={s.eduTitle}>{card.title}</Text>
                <Text style={s.eduPreview} numberOfLines={2}>{card.preview}</Text>

                <View style={s.eduFooter}>
                  <Text style={[s.eduReadMore, { color: accent.iconColor }]}>Read more</Text>
                  <ChevronRight size={13} color={accent.iconColor} strokeWidth={2} />
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Profile nudge */}
        {answers && (
          <View style={s.profileNudge}>
            <LinearGradient
              colors={['#D07887', '#9F4252']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={s.nudgeInner}>
              <Sparkles size={15} color="#FFF5EF" strokeWidth={1.8} />
              <View style={{ flex: 1 }}>
                <Text style={s.nudgeTitle}>Personalised to your profile</Text>
                <Text style={s.nudgeBody}>
                  {answers.energy_baseline === 'frequently_tired'
                    ? 'Your profile shows lower baseline energy. Your coach prioritises recovery-first guidance.'
                    : answers.joint_sensitivities.length > 0
                    ? `Joint sensitivity noted: ${answers.joint_sensitivities.join(', ')}. Recommendations tailored accordingly.`
                    : 'Your responses are shaping every recommendation in this section.'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Bottom padding — leave room above main tab navigation bar */}
        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Article reader modal */}
      <ArticleDetailModal
        article={activeArticle}
        visible={!!activeArticle}
        onClose={() => setActiveArticle(null)}
      />

      {/* 1:1 Text Coach Lead Capture & Checkout Modal */}
      <CoachLeadModal
        visible={leadModalVisible}
        onClose={() => setLeadModalVisible(false)}
        selectedMessagingApp={selectedMessagingApp}
        userProfile={userProfile}
        onSuccess={() => {
          setHasEnrolledTextCoach(true);
          setTextCoachToast(true);
          setTimeout(() => setTextCoachToast(false), 6000);
        }}
      />

      {/* 30-Day Digital Program Detail Modal */}
      <ProgramDetailModal
        visible={!!selectedProgram}
        program={selectedProgram}
        onClose={() => setSelectedProgram(null)}
        onBuyProgram={(prog) => {
          setSelectedProgram(null);
          setCheckoutProduct({
            id: prog.id,
            name: prog.name,
            subtitle: prog.subtitle,
            price: prog.price,
            originalPrice: prog.originalPrice,
            image: require('../assets/products/mat_main.jpg'),
          });
        }}
      />

      {/* PayPal & Card Checkout Modal */}
      {checkoutProduct && (
        <PayPalCheckoutModal
          visible={!!checkoutProduct}
          onClose={() => setCheckoutProduct(null)}
          product={{
            id: checkoutProduct.id,
            name: checkoutProduct.name,
            subtitle: checkoutProduct.subtitle,
            price: checkoutProduct.price,
            originalPrice: checkoutProduct.originalPrice,
            image: checkoutProduct.image,
          }}
        />
      )}
    </KeyboardAvoidingView>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// CHECK-IN STYLES
// ─────────────────────────────────────────────────────────────────────────────

const ciStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceCard,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      ios: { shadowColor: '#2A2320', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
      default: { boxShadow: '0 2px 8px rgba(42,35,32,0.06)' },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  kicker: {
    fontSize: 10,
    fontFamily: fontFamilies.monoBold,
    letterSpacing: 2,
    color: colors.rose,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textTertiary,
  },
  avgPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.sageSoft,
    borderWidth: 1,
    borderColor: colors.sageBorder,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  avgText: {
    fontSize: 12,
    fontFamily: fontFamilies.sansBold,
    color: colors.sageDark,
  },
  avgScaleLabel: {
    fontSize: 10,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textTertiary,
    marginLeft: 1,
  },
  trailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  trailCell: { alignItems: 'center', gap: 6 },
  trailDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayRingOuter: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(208, 120, 135, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayInnerPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.rose,
  },
  trailDotMissed: {
    backgroundColor: 'rgba(160, 145, 134, 0.08)',
    borderColor: colors.borderMedium,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missedDash: {
    width: 6,
    height: 1.5,
    backgroundColor: colors.borderMedium,
    borderRadius: 1,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    marginTop: 2,
    marginBottom: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textTertiary,
  },
  trailLabel: {
    fontSize: 10,
    fontFamily: fontFamilies.sansSemiBold,
    color: colors.textTertiary,
  },
  trailLabelToday: { color: colors.rose },
  selectorLabel: {
    fontSize: 11,
    fontFamily: fontFamilies.sansSemiBold,
    letterSpacing: 0.8,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  emojiRow: { flexDirection: 'row', gap: 6 },
  emojiBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  emojiGlyph: { fontSize: 20 },
  emojiLabel: {
    fontSize: 10,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textTertiary,
  },
  energyRow: { flexDirection: 'row', gap: 6 },
  energyBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  energyLabel: {
    fontSize: 11,
    fontFamily: fontFamilies.sansMedium,
    color: colors.textSecondary,
  },
  saveBtn: { marginTop: 16, borderRadius: 12, overflow: 'hidden' },
  saveBtnGradient: { paddingVertical: 13, alignItems: 'center' },
  saveBtnText: {
    fontSize: 12,
    fontFamily: fontFamilies.sansBold,
    letterSpacing: 0.8,
    color: '#FFF5EF',
    textTransform: 'uppercase',
  },
  savedState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.sageSoft,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.sageBorder,
  },
  savedTitle: {
    fontSize: 13,
    fontFamily: fontFamilies.sansSemiBold,
    color: colors.sageDark,
    marginBottom: 2,
  },
  savedSubtitle: {
    fontSize: 12,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textTertiary,
  },
  editBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderMedium,
    backgroundColor: colors.surfaceCard,
  },
  editBtnText: {
    fontSize: 11,
    fontFamily: fontFamilies.sansSemiBold,
    color: colors.textSecondary,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// MAIN STYLES
// ─────────────────────────────────────────────────────────────────────────────

const SHADOW_CARD = Platform.select({
  ios: { shadowColor: '#2A2320', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 10 },
  android: { elevation: 3 },
  default: { boxShadow: '0 2px 10px rgba(42,35,32,0.08)' },
});

const SHADOW_HERO = Platform.select({
  ios: { shadowColor: '#1A1210', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.22, shadowRadius: 14 },
  android: { elevation: 6 },
  default: { boxShadow: '0 4px 14px rgba(26,18,16,0.22)' },
});

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 16, paddingHorizontal: 24 },

  // ── HEADER ──
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerKicker: {
    fontSize: 10,
    fontFamily: fontFamilies.monoBold,
    letterSpacing: 2,
    color: colors.textTertiary,
    marginBottom: 3,
  },
  headerTitle: {
    fontSize: 32,
    fontFamily: fontFamilies.soria,
    fontWeight: '700',
    letterSpacing: -0.8,
    color: colors.textPrimary,
  },
  avatarWrap: { position: 'relative', marginTop: 4 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW_CARD,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.sage,
    borderWidth: 2,
    borderColor: colors.background,
  },

  // ── DISCLAIMER ──
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(160,145,134,0.08)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    fontFamilies: fontFamilies.sansRegular,
    color: colors.textTertiary,
    lineHeight: 17,
  } as any,

  // ── SECTION ──
  section: { marginBottom: 24 },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionKicker: {
    fontSize: 10,
    fontFamily: fontFamilies.monoBold,
    letterSpacing: 2,
    color: colors.textTertiary,
    textTransform: 'uppercase',
  },
  dotRow: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  dot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: 'rgba(255,245,239,0.3)' },
  dotActive: { width: 14, borderRadius: 3, backgroundColor: colors.rose },
  pillBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillBadgeText: {
    fontSize: 11,
    fontFamily: fontFamilies.sansSemiBold,
  },

  // ── HERO DARK INSIGHT CARD ──
  carouselScroll: { marginHorizontal: -24 },
  carouselContent: { paddingHorizontal: 24 },
  heroCard: {
    backgroundColor: colors.heroCard,
    borderRadius: 20,
    padding: 20,
    marginRight: 12,
    overflow: 'hidden',
    ...SHADOW_HERO,
  },
  heroGlowOverlay: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.heroCardGlow,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  phasePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  phaseDot: { width: 6, height: 6, borderRadius: 3 },
  phaseText: {
    fontSize: 11,
    fontFamily: fontFamilies.sansSemiBold,
    letterSpacing: 0.2,
  },
  heroTag: {
    fontSize: 9,
    fontFamily: fontFamilies.monoBold,
    letterSpacing: 1.8,
    color: colors.textOnDarkMuted,
    textTransform: 'uppercase',
  },
  heroHeadline: {
    fontSize: 18,
    fontFamily: fontFamilies.soria,
    fontWeight: '700',
    color: colors.textOnDark,
    lineHeight: 25,
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  heroBody: {
    fontSize: 13,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textOnDarkMuted,
    lineHeight: 20,
  },

  // ── HABITS ──
  habitCard: {
    backgroundColor: colors.surfaceCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...SHADOW_CARD,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    backgroundColor: colors.surfaceCard,
  },
  habitRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  habitRowChecked: {
    backgroundColor: 'rgba(146,169,117,0.05)',
  },
  habitIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitLabel: {
    flex: 1,
    fontSize: 13,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  habitLabelChecked: {
    color: colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  habitCheckWrap: { width: 24, alignItems: 'center' },
  allDoneBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.sageSoft,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.sageBorder,
  },
  allDoneText: {
    fontSize: 12,
    fontFamily: fontFamilies.sansMedium,
    color: colors.sageDark,
    flex: 1,
    lineHeight: 17,
  },

  // ── CHAT SECTION & WARM HUMAN PROMPT ──
  warmPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(208, 120, 135, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 12,
  },
  warmPillText: {
    fontSize: 8.5,
    fontFamily: fontFamilies.monoBold,
    color: colors.primaryDark,
    letterSpacing: 0.8,
  },
  chatPromptBanner: {
    backgroundColor: colors.surfaceCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    ...SHADOW_CARD,
  },
  chatHeroPromptTitle: {
    fontSize: 20,
    fontFamily: fontFamilies.soria,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 26,
    letterSpacing: -0.3,
    marginBottom: 5,
  },
  chatHeroPromptSubtitle: {
    fontSize: 12.5,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  weeklySignalsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.sageSoft,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.sageBorder,
  },
  weeklySignalsText: {
    fontSize: 9,
    fontFamily: fontFamilies.sansSemiBold,
    color: colors.sageDark,
  },

  // Multi-line wrap grid for prompt chips — 0 cutoffs, fully responsive
  chipsWrapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  chip: {
    backgroundColor: colors.surfaceCard,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      ios: { shadowColor: '#2A2320', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3 },
      android: { elevation: 1 },
      default: { boxShadow: '0 1px 4px rgba(42,35,32,0.04)' },
    }),
  },
  chipText: {
    fontSize: 12,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textSecondary,
  },
  chatContainer: { gap: 12, marginBottom: 14 },
  msgWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  msgWrapUser: { flexDirection: 'row-reverse' },
  coachDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.rose,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    ...SHADOW_CARD,
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: 18,
    padding: 14,
  },
  bubbleCoach: {
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.borderMedium,
    borderBottomLeftRadius: 4,
    ...Platform.select({
      ios: { shadowColor: '#2A2320', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6 },
      android: { elevation: 2 },
      default: { boxShadow: '0 2px 8px rgba(42,35,32,0.07)' },
    }),
  },
  bubbleUser: {
    backgroundColor: colors.rose,
    borderBottomRightRadius: 4,
    ...Platform.select({
      ios: { shadowColor: '#9F4252', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 6 },
      android: { elevation: 2 },
      default: { boxShadow: '0 2px 8px rgba(159,66,82,0.2)' },
    }),
  },
  userDeepThinkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  userDeepThinkText: {
    fontSize: 8.5,
    fontFamily: fontFamilies.monoBold,
    color: '#FFF5EF',
    letterSpacing: 0.8,
  },
  bubbleText: {
    fontSize: 13.5,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textPrimary,
    lineHeight: 21,
  },
  bubbleTextUser: {
    color: '#F5EFE6',
    fontFamily: fontFamilies.sansRegular,
  },

  // ── CLASSIFICATION & PERSONALIZATION PILLS IN COACH BUBBLE ──
  classificationCard: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    gap: 7,
  },
  weeklyTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(208, 120, 135, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(208, 120, 135, 0.25)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
  },
  weeklyTagText: {
    fontSize: 10.5,
    fontFamily: fontFamilies.sansSemiBold,
    color: colors.primaryDark,
    flex: 1,
  },
  adaptationPill: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: colors.sageSoft,
    borderWidth: 1,
    borderColor: colors.sageBorder,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
  },
  adaptationText: {
    fontSize: 11,
    fontFamily: fontFamilies.sansMedium,
    color: colors.sageDark,
    flex: 1,
    lineHeight: 16,
  },
  deepReasoningBox: {
    backgroundColor: '#F5F2EC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 4,
  },
  deepReasoningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  deepReasoningTitle: {
    fontSize: 9,
    fontFamily: fontFamilies.monoBold,
    letterSpacing: 1.2,
    color: '#7B68B5',
  },
  deepReasoningBody: {
    fontSize: 11,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textSecondary,
    lineHeight: 16,
  },

  typingBubble: { paddingVertical: 14, paddingHorizontal: 16 },
  typingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  typingHeaderText: {
    fontSize: 11,
    fontFamily: fontFamilies.sansMedium,
    color: colors.primaryDark,
  },
  typingDots: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.textTertiary,
  },

  // ── IN-LINE WHITE & ROSE CHATBOT BAR (STAYS IN PLACE RIGHT HERE) ──
  inlineChatbotWrap: {
    marginTop: 6,
    marginBottom: 6,
  },
  attachMenuPopup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(208, 120, 135, 0.3)',
    ...SHADOW_CARD,
  },
  attachMenuTitle: {
    fontSize: 9.5,
    fontFamily: fontFamilies.monoBold,
    letterSpacing: 1.5,
    color: colors.primaryDark,
    marginBottom: 8,
  },
  attachTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  attachTagBtn: {
    backgroundColor: 'rgba(208, 120, 135, 0.09)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(208, 120, 135, 0.2)',
  },
  attachTagText: {
    fontSize: 11,
    fontFamily: fontFamilies.sansSemiBold,
    color: colors.primaryDark,
  },

  // White & Rose luxury chatbot pill container
  whiteRoseChatbotPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    minHeight: 46,
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderWidth: 1.5,
    borderColor: 'rgba(208, 120, 135, 0.35)',
    ...Platform.select({
      ios: { shadowColor: '#D07887', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 10 },
      android: { elevation: 4 },
      default: { boxShadow: '0 3px 12px rgba(208, 120, 135, 0.15)' },
    }),
  },
  pillLeftBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(208, 120, 135, 0.12)',
  },
  pillLeftBtnActive: {
    backgroundColor: 'rgba(208, 120, 135, 0.25)',
  },
  pillInput: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textPrimary,
    paddingHorizontal: 10,
    paddingVertical: 0,
    height: 32,
    outlineStyle: 'none',
  } as any,
  pillRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  thinkToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 32,
    backgroundColor: 'rgba(208, 120, 135, 0.08)',
    borderRadius: 16,
    paddingHorizontal: 9,
    borderWidth: 1,
    borderColor: 'rgba(208, 120, 135, 0.2)',
  },
  thinkToggleBtnActive: {
    backgroundColor: 'rgba(208, 120, 135, 0.22)',
    borderColor: colors.rose,
  },
  thinkToggleText: {
    fontSize: 11.5,
    fontFamily: fontFamilies.sansMedium,
    color: '#7A6D66',
  },
  thinkToggleTextActive: {
    color: colors.primaryDark,
    fontFamily: fontFamilies.sansBold,
  },
  micBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  micBtnActive: {
    backgroundColor: 'rgba(208, 120, 135, 0.25)',
  },
  pillSendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillSendBtnActive: {
    backgroundColor: colors.rose,
    ...Platform.select({
      ios: { shadowColor: '#D07887', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 6 },
      android: { elevation: 3 },
      default: { boxShadow: '0 2px 8px rgba(208, 120, 135, 0.3)' },
    }),
  },
  pillSendBtnDisabled: {
    backgroundColor: 'rgba(208, 120, 135, 0.22)',
    opacity: 0.7,
  },
  chatSafetyFooter: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  chatSafetyText: {
    fontSize: 10.5,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textTertiary,
    lineHeight: 14,
  },

  // ── LEARN ──
  rotatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(159,66,82,0.1)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
  },
  rotatePillText: {
    fontSize: 8,
    fontFamily: fontFamilies.monoBold,
    letterSpacing: 1.2,
    color: colors.primaryDark,
  },
  evidenceTag: {
    fontSize: 11,
    fontFamily: fontFamilies.sansRegular,
    color: colors.primary,
  },
  eduCard: {
    backgroundColor: colors.surfaceCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 3,
    padding: 16,
    marginBottom: 12,
    ...SHADOW_CARD,
  },
  eduCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 8,
  },
  eduIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eduTag: {
    fontSize: 9,
    fontFamily: fontFamilies.monoBold,
    letterSpacing: 1.5,
    color: colors.textTertiary,
    textTransform: 'uppercase',
  },
  eduReadTime: {
    fontSize: 10,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textTertiary,
  },
  eduTitle: {
    fontSize: 17,
    fontFamily: fontFamilies.soria,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 23,
    letterSpacing: -0.2,
    marginBottom: 5,
  },
  eduPreview: {
    fontSize: 13,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textSecondary,
    lineHeight: 19,
    marginBottom: 10,
  },
  eduFooter: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  eduReadMore: {
    fontSize: 12,
    fontFamily: fontFamilies.sansSemiBold,
    letterSpacing: 0.1,
  },

  // ── 1:1 PERSONALISATION / CONSULTATION CARD ──
  consultationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(208, 120, 135, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
  },
  consultationPillText: {
    fontSize: 8.5,
    fontFamily: fontFamilies.monoBold,
    letterSpacing: 1.2,
    color: colors.primaryDark,
  },
  waitlistTag: {
    fontSize: 11,
    fontFamily: fontFamilies.sansMedium,
    color: colors.primary,
  },
  consultationCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(208, 120, 135, 0.18)',
    overflow: 'hidden',
    marginBottom: 8,
    ...SHADOW_CARD,
  },
  consultationGradient: {
    padding: 18,
  },
  consultationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  consultationIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(208, 120, 135, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(208, 120, 135, 0.22)',
  },
  consultationTitle: {
    fontSize: 16,
    fontFamily: fontFamilies.soria,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  consultationSubtitle: {
    fontSize: 12,
    fontFamily: fontFamilies.sansMedium,
    color: colors.primaryDark,
    marginTop: 2,
  },
  pricingTag: {
    backgroundColor: colors.sageSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.sageBorder,
  },
  pricingTagText: {
    fontSize: 11,
    fontFamily: fontFamilies.monoBold,
    color: colors.sageDark,
    letterSpacing: 0.5,
  },
  appPickerLabel: {
    fontSize: 9.5,
    fontFamily: fontFamilies.monoBold,
    color: colors.textTertiary,
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  appPickerRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  appPill: {
    backgroundColor: 'rgba(101, 78, 60, 0.06)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(101, 78, 60, 0.12)',
  },
  appPillSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  appPillText: {
    fontSize: 11.5,
    fontFamily: fontFamilies.sansMedium,
    color: colors.textSecondary,
  },
  appPillTextSelected: {
    color: colors.primaryDark,
    fontFamily: fontFamilies.sansBold,
  },
  consultationBody: {
    fontSize: 12.5,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textSecondary,
    lineHeight: 18.5,
    marginBottom: 14,
  },
  consultationChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  consultationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(146, 169, 117, 0.12)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(146, 169, 117, 0.25)',
  },
  consultationChipText: {
    fontSize: 11,
    fontFamily: fontFamilies.sansMedium,
    color: colors.sageDark,
  },
  consultationBtn: {
    backgroundColor: colors.primaryDark,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  consultationBtnJoined: {
    backgroundColor: 'rgba(146, 169, 117, 0.2)',
    borderWidth: 1,
    borderColor: colors.sageDark,
    shadowOpacity: 0,
    elevation: 0,
  },
  consultationBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  consultationBtnText: {
    fontSize: 13,
    fontFamily: fontFamilies.sansBold,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  consultationBtnTextJoined: {
    fontSize: 13,
    fontFamily: fontFamilies.sansBold,
    color: colors.sageDark,
    letterSpacing: 0.2,
  },
  consultationToast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(208, 120, 135, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(208, 120, 135, 0.25)',
  },
  consultationToastText: {
    flex: 1,
    fontSize: 11.5,
    fontFamily: fontFamilies.sansMedium,
    color: colors.primaryDark,
    lineHeight: 16,
  },

  // ── PROFILE NUDGE ──
  profileNudge: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    padding: 18,
    ...SHADOW_CARD,
  },
  nudgeInner: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  nudgeTitle: {
    fontSize: 13,
    fontFamily: fontFamilies.sansSemiBold,
    color: '#FFF5EF',
    marginBottom: 4,
  },
  nudgeBody: {
    fontSize: 12,
    fontFamily: fontFamilies.sansRegular,
    color: 'rgba(255,245,239,0.82)',
    lineHeight: 18,
  },

  // ── 30-DAY PROGRAMS SECTION (COACH) ──
  programsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(208, 120, 135, 0.14)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  programsPillText: {
    fontSize: 9,
    fontFamily: fontFamilies.sansBold,
    color: colors.primaryDark,
    letterSpacing: 0.5,
  },
  priceFromBadge: {
    backgroundColor: colors.surfaceCard,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  priceFromText: {
    fontSize: 10,
    fontFamily: fontFamilies.sansBold,
    color: colors.textPrimary,
  },
  programCardsList: {
    gap: 12,
    marginTop: 4,
  },
  coachProgramCard: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 7,
    elevation: 3,
  },
  coachProgramCardGrad: {
    padding: 16,
  },
  coachProgTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  coachProgTagWrap: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  coachProgTagText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontFamily: fontFamilies.sansBold,
    letterSpacing: 0.8,
  },
  coachProgBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 5,
  },
  coachProgBadgeText: {
    color: colors.textPrimary,
    fontSize: 9,
    fontFamily: fontFamilies.sansBold,
  },
  coachProgTitle: {
    fontSize: 18,
    fontFamily: fontFamilies.soria,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  coachProgSubtitle: {
    fontSize: 11.5,
    fontFamily: fontFamilies.sansRegular,
    color: 'rgba(255,255,255,0.88)',
    lineHeight: 16,
    marginBottom: 12,
  },
  coachProgChipsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  coachProgChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.18)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  coachProgChipText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: fontFamilies.sansMedium,
  },
  coachProgFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  coachProgPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  coachProgPriceCurrent: {
    fontSize: 18,
    fontFamily: fontFamilies.sansBold,
    color: '#FFFFFF',
  },
  coachProgPriceOld: {
    fontSize: 12,
    fontFamily: fontFamilies.sansRegular,
    color: 'rgba(255,255,255,0.6)',
    textDecorationLine: 'line-through',
  },
  coachProgBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  coachProgBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: fontFamilies.sansBold,
  },

  // Coach Bundle
  coachBundleCard: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  coachBundleGrad: {
    padding: 16,
  },
  coachBundleTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  coachBundleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(212,165,116,0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(212,165,116,0.35)',
  },
  coachBundleTagText: {
    fontSize: 9,
    fontFamily: fontFamilies.sansBold,
    color: '#D4A574',
    letterSpacing: 0.8,
  },
  coachBundleDiscount: {
    backgroundColor: '#D07887',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 5,
  },
  coachBundleDiscountText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: fontFamilies.sansBold,
  },
  coachBundleTitle: {
    fontSize: 18,
    fontFamily: fontFamilies.soria,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  coachBundleDesc: {
    fontSize: 11.5,
    fontFamily: fontFamilies.sansRegular,
    color: 'rgba(255,255,255,0.78)',
    lineHeight: 16,
    marginBottom: 12,
  },
  coachBundleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  coachBundlePriceCol: {},
  coachBundlePriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  coachBundlePriceVal: {
    fontSize: 19,
    fontFamily: fontFamilies.sansBold,
    color: '#FFFFFF',
  },
  coachBundlePriceOldVal: {
    fontSize: 12,
    fontFamily: fontFamilies.sansRegular,
    color: 'rgba(255,255,255,0.5)',
    textDecorationLine: 'line-through',
  },
  coachBundlePriceMeta: {
    fontSize: 9.5,
    fontFamily: fontFamilies.sansRegular,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 1,
  },
  coachBundleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primaryDark,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  coachBundleBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: fontFamilies.sansBold,
  },
});
