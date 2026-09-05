import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Image } from 'expo-image';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  FlatList,
  TextInput,
  Platform,
  Alert,
  KeyboardAvoidingView,
  Modal as RNModal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  X,
  Plus,
  Check,
  ChevronDown,
  ChevronUp,
  Timer,
  Dumbbell,
  CheckCircle2,
  Trash2,
  Info,
  Search,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { fontFamilies } from '../theme/typography';
import { Workout } from '../hooks/useWorkouts';
import { ExerciseDetailModal } from './ExerciseDetailModal';
import { getExerciseInfo, searchExercises } from '../lib/exerciseDatabase';
import { CancelWorkoutSheet } from './CancelWorkoutSheet';
import { FinishConfirmSheet } from './FinishConfirmSheet';
import { WorkoutCelebrationModal } from './WorkoutCelebrationModal';
import { ResetSlot } from '../types/rhythm';
import { playSetCompleteSound } from '../lib/audioManager';
import {
  saveActiveSessionCheckpoint,
  clearActiveSessionCheckpoint,
  enqueuePendingLog,
  ActiveSessionCheckpoint,
} from '../lib/useOfflineSync';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { workoutSessionManager } from '../lib/workoutSessionManager';
import { useLanguage } from '../context/LanguageContext';

const STORAGE_KEY_COMPLETED_DATES = '@fortywell_completed_dates_v1';

const { height: SCREEN_H } = Dimensions.get('window');

// --- Types -------------------------------------------------------------------

export interface LoggedSet {
  id: string;
  weight: string;
  reps: string;
  completed: boolean;
}

export interface LoggedExercise {
  id: string;
  name: string;
  sets: LoggedSet[];
  expanded: boolean;
  coaching_cue?: string;
  tempo?: string;
  rest?: string;
  image_url?: string;
  gif_url?: string;
}

export interface WorkoutSummaryData {
  workoutTitle: string;
  workoutSlug?: string;
  durationSeconds: number;
  completedSets: number;
  totalSets: number;
  totalVolumeKg: number;
  exercises: LoggedExercise[];
  sessionSlot?: ResetSlot;
}

export type WorkoutSummary = WorkoutSummaryData;

export interface ActiveWorkoutScreenProps {
  visible: boolean;
  workout: Workout | null;
  onFinish: (summary: WorkoutSummaryData) => void;
  onCancel: () => void;
  /** Optional: pre-loaded checkpoint to resume from (passed by HomeScreen) */
  checkpoint?: ActiveSessionCheckpoint | null;
  /** Optional: pre-populated exercises with sets & weights (e.g. replaying a SavedSession) */
  initialExercises?: LoggedExercise[] | null;
}

// --- Helper Timer Formatter -------------------------------------------------

function formatTime(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${m < 10 ? '0' : ''}${m}:${sec < 10 ? '0' : ''}${sec}`;
  return `${m < 10 ? '0' : ''}${m}:${sec < 10 ? '0' : ''}${sec}`;
}

const WorkoutTimer = React.memo(function WorkoutTimer({
  startTime,
  totalPausedMs,
  isPaused,
  pausedAt,
}: {
  startTime: number;
  totalPausedMs: number;
  isPaused: boolean;
  pausedAt: number | null;
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const calc = () => {
      if (isPaused && pausedAt != null) {
        // Frozen at the moment we paused
        return Math.floor((pausedAt - startTime - totalPausedMs) / 1000);
      }
      return Math.floor((Date.now() - startTime - totalPausedMs) / 1000);
    };
    setElapsed(Math.max(0, calc()));
    if (isPaused) return; // don't tick while paused
    const timer = setInterval(() => setElapsed(Math.max(0, calc())), 1000);
    return () => clearInterval(timer);
  }, [startTime, totalPausedMs, isPaused, pausedAt]);

  return (
    <View style={s.timerRow}>
      <Timer size={12} color={colors.primaryDark} />
      <Text style={s.timerTxt}>{formatTime(elapsed)}</Text>
    </View>
  );
});

// --- Initializer for workout exercises ---------------------------------------

function buildInitialExercises(w: Workout | null): LoggedExercise[] {
  if (!w) return [];
  const list: LoggedExercise[] = [];

  const addEx = (
    name: string,
    cue?: string,
    defaultReps = '10',
    raw_img?: string,
    raw_gif?: string,
    setCount = 1
  ) => {
    const info = getExerciseInfo(name);
    const cdnRawImg = raw_img
      ? raw_img.replace('raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises', 'cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises')
      : undefined;
    const cdnRawGif = raw_gif
      ? raw_gif.replace('raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises', 'cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises')
      : undefined;

    const count = Math.max(1, typeof setCount === 'number' && !isNaN(setCount) ? setCount : 1);
    const sets: LoggedSet[] = [];
    for (let i = 0; i < count; i++) {
      sets.push({
        id: Math.random().toString(36).substr(2, 9),
        weight: '',
        reps: defaultReps,
        completed: false,
      });
    }

    list.push({
      id: Math.random().toString(36).substr(2, 9),
      name,
      coaching_cue: cue || info.coaching_cues,
      image_url: info.image_url || cdnRawImg,
      gif_url: info.gif_url || cdnRawGif,
      expanded: true,
      sets,
    });
  };

  (w.warmup || []).forEach((e) => addEx(e.name, e.notes, e.duration || '60s', e.image_url, e.gif_url, e.sets || 1));
  (w.main_blocks || []).forEach((b) =>
    (b.exercises || []).forEach((e) =>
      addEx(
        e.name,
        e.coaching_cue,
        e.reps ? String(e.reps) : '10',
        e.image_url,
        e.gif_url,
        e.sets || 3
      )
    )
  );
  (w.cooldown || []).forEach((e) => addEx(e.name, e.notes, e.duration || '60s', e.image_url, e.gif_url, e.sets || 1));

  return list;
}

// --- Set Row -----------------------------------------------------------------

const SetRow = React.memo(function SetRow({
  idx,
  set,
  onChange,
  onToggle,
  onDelete,
}: {
  idx: number;
  set: LoggedSet;
  onChange: (field: 'weight' | 'reps', val: string) => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={[sr.row, set.completed && sr.rowDone]}>
      <View style={sr.numBadge}>
        <Text style={[sr.numTxt, set.completed && sr.numTxtDone]}>{idx + 1}</Text>
      </View>

      <TextInput
        style={[sr.input, set.completed && sr.inputDone]}
        placeholder="—"
        placeholderTextColor={colors.textTertiary}
        keyboardType="decimal-pad"
        value={set.weight}
        onChangeText={(v) => onChange('weight', v)}
        editable={!set.completed}
      />

      <TextInput
        style={[sr.input, set.completed && sr.inputDone]}
        placeholder="—"
        placeholderTextColor={colors.textTertiary}
        keyboardType="default"
        value={set.reps}
        onChangeText={(v) => onChange('reps', v)}
        editable={!set.completed}
      />

      <Pressable
        style={[sr.checkBtn, set.completed && sr.checkBtnDone]}
        onPress={onToggle}
        hitSlop={6}
      >
        <Check size={15} color={set.completed ? '#FFF' : colors.textTertiary} strokeWidth={2.5} />
      </Pressable>

      <Pressable style={sr.delBtn} onPress={onDelete} hitSlop={8}>
        <Trash2 size={13} color="rgba(201,70,91,0.45)" />
      </Pressable>
    </View>
  );
});

const sr = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    gap: 6,
    borderRadius: 10,
    paddingHorizontal: 2,
    marginBottom: 4,
    width: '100%',
  },
  rowDone: { backgroundColor: 'rgba(74,93,78,0.06)' },
  numBadge: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: 'rgba(101,78,60,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  numTxt: { fontSize: 11, fontFamily: fontFamilies.monoBold, color: colors.textSecondary },
  numTxtDone: { color: colors.sageDark },
  input: {
    flex: 1,
    minWidth: 0,
    height: 36,
    backgroundColor: '#FAF8F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(101,78,60,0.12)',
    textAlign: 'center',
    fontSize: 13,
    fontFamily: fontFamilies.monoMedium,
    color: colors.textPrimary,
    paddingHorizontal: 4,
  },
  inputDone: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    color: colors.sageDark,
  },
  checkBtn: {
    width: 34,
    height: 34,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: 'rgba(101,78,60,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    flexShrink: 0,
  },
  checkBtnDone: { backgroundColor: colors.sageDark, borderColor: colors.sageDark },
  delBtn: { width: 26, height: 34, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
});

// --- Exercise Card ------------------------------------------------------------

const ExCard = React.memo(function ExCard({
  ex,
  onToggle,
  onAddSet,
  onDel,
  onSetChange,
  onToggleSet,
  onDelSet,
  onOpenDetail,
}: {
  ex: LoggedExercise;
  onToggle: () => void;
  onAddSet: () => void;
  onDel: () => void;
  onSetChange: (sid: string, f: 'weight' | 'reps', v: string) => void;
  onToggleSet: (sid: string) => void;
  onDelSet: (sid: string) => void;
  onOpenDetail: () => void;
}) {
  const done = ex.sets.filter((s) => s.completed).length;
  const allDone = done === ex.sets.length && ex.sets.length > 0;
  const info = getExerciseInfo(ex.name);
  const thumbUrl = ex.image_url || info.image_url;

  return (
    <View style={ec.card}>
      <View style={ec.hdr}>
        <View style={[ec.dot, allDone && ec.dotDone]} />
        
        {/* Exercise Thumbnail */}
        <Pressable onPress={onOpenDetail} style={ec.thumbWrapper}>
          <Image
            source={{ uri: thumbUrl }}
            style={ec.thumbImg}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={150}
          />
        </Pressable>

        <Pressable style={ec.hdrTxt} onPress={onToggle}>
          <Text style={ec.name} numberOfLines={1}>{ex.name}</Text>
          <Text style={ec.meta}>
            {done}/{ex.sets.length} sets{ex.tempo ? ` • ${ex.tempo}` : ''}{ex.rest ? ` • ${ex.rest} rest` : ''}
          </Text>
        </Pressable>

        {/* Info detail trigger */}
        <Pressable onPress={onOpenDetail} hitSlop={8} style={ec.infoBtn}>
          <Info size={16} color={colors.primaryDark} />
        </Pressable>

        <Pressable onPress={onDel} hitSlop={10} style={ec.delBtn}>
          <X size={14} color="rgba(201,70,91,0.5)" />
        </Pressable>
        
        <Pressable onPress={onToggle} hitSlop={8}>
          {ex.expanded ? (
            <ChevronUp size={16} color={colors.textSecondary} />
          ) : (
            <ChevronDown size={16} color={colors.textSecondary} />
          )}
        </Pressable>
      </View>

      {ex.expanded && (
        <View style={ec.body}>
          {ex.coaching_cue ? (
            <View style={ec.cue}>
              <Text style={ec.cueTxt}>{ex.coaching_cue}</Text>
            </View>
          ) : null}
          <View style={ec.colHdr}>
            <View style={{ width: 22, flexShrink: 0 }} />
            <Text style={[ec.col, { flex: 1, textAlign: 'center', minWidth: 0 }]}>KG</Text>
            <Text style={[ec.col, { flex: 1, textAlign: 'center', minWidth: 0 }]}>REPS</Text>
            <View style={{ width: 66, flexShrink: 0 }} />
          </View>
          {ex.sets.map((set, i) => (
            <SetRow
              key={set.id}
              idx={i}
              set={set}
              onChange={(f, v) => onSetChange(set.id, f, v)}
              onToggle={() => onToggleSet(set.id)}
              onDelete={() => onDelSet(set.id)}
            />
          ))}
          <Pressable style={ec.addSet} onPress={onAddSet}>
            <Plus size={12} color={colors.primaryDark} strokeWidth={2.5} />
            <Text style={ec.addSetTxt}>ADD SET</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}, (prev, next) => prev.ex === next.ex);

const ec = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(101,78,60,0.08)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  hdr: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  thumbWrapper: {
    width: 38,
    height: 38,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F5F2EB',
    borderWidth: 1,
    borderColor: 'rgba(101,78,60,0.1)',
    flexShrink: 0,
  },
  thumbImg: {
    width: '100%',
    height: '100%',
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(101,78,60,0.2)', flexShrink: 0 },
  dotDone: { backgroundColor: colors.sageDark },
  hdrTxt: { flex: 1, minWidth: 0 },
  name: { fontSize: 13, fontFamily: fontFamilies.monoMedium, color: colors.textPrimary, marginBottom: 2 },
  meta: { fontSize: 10, fontFamily: fontFamilies.monoRegular, color: colors.textSecondary },
  infoBtn: { padding: 4, marginRight: 2, flexShrink: 0 },
  delBtn: { padding: 4, flexShrink: 0 },
  body: {
    paddingHorizontal: 10,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(101,78,60,0.06)',
    paddingTop: 8,
  },
  cue: {
    backgroundColor: 'rgba(201,70,91,0.06)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
  },
  cueTxt: {
    fontSize: 11,
    fontFamily: fontFamilies.monoRegular,
    color: colors.primaryDark,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  colHdr: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4, paddingHorizontal: 2 },
  col: { fontSize: 9, fontFamily: fontFamilies.monoBold, letterSpacing: 1, color: colors.textTertiary },
  addSet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(201,70,91,0.25)',
    backgroundColor: 'rgba(201,70,91,0.04)',
    marginTop: 4,
  },
  addSetTxt: { fontSize: 10, fontFamily: fontFamilies.monoBold, letterSpacing: 1, color: colors.primaryDark },
});

// --- Main Active Workout Modal Component -------------------------------------

export const ActiveWorkoutScreen: React.FC<ActiveWorkoutScreenProps> = ({
  visible,
  workout,
  onFinish,
  onCancel,
  checkpoint,
  initialExercises,
}) => {
  // ── Wall-clock timer (never drifts in background) ─────────────────────────
  // startedAtMs = epoch ms when workout actually started (restored from checkpoint)
  const startedAtMsRef = useRef<number>(Date.now());
  // Track total pause time so elapsed is always accurate after resume
  const totalPausedMsRef = useRef<number>(0);
  const pausedAtMsRef = useRef<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [pausedAtState, setPausedAtState] = useState<number | null>(null);
  const [totalPausedMsState, setTotalPausedMsState] = useState(0);

  const [exercises, setExercises] = useState<LoggedExercise[]>([]);
  const [addExVisible, setAddExVisible] = useState(false);
  const [detailExName, setDetailExName] = useState<string | null>(null);
  const [showCancelSheet, setShowCancelSheet] = useState(false);
  const [showFinishSheet, setShowFinishSheet] = useState(false);
  const [celebration, setCelebration] = useState<WorkoutSummaryData | null>(null);
  const { t } = useLanguage();

  const slideY = useSharedValue(SCREEN_H);

  // Helper: current elapsed accounting for pauses (for checkpoint saving)
  const getElapsedSeconds = useCallback(() => {
    if (isPaused && pausedAtMsRef.current != null) {
      return Math.max(0, Math.floor((pausedAtMsRef.current - startedAtMsRef.current - totalPausedMsRef.current) / 1000));
    }
    return Math.max(0, Math.floor((Date.now() - startedAtMsRef.current - totalPausedMsRef.current) / 1000));
  }, [isPaused]);

  // ── Animate in/out & initialise from scratch, saved session, or checkpoint ──
  useEffect(() => {
    if (visible) {
      slideY.value = withSpring(0, { damping: 20, stiffness: 120 });

      if (checkpoint) {
        // ── Resume from saved checkpoint ──────────────────────────────
        const checkpointStartMs = new Date(checkpoint.startedAt).getTime();
        startedAtMsRef.current = checkpointStartMs;
        totalPausedMsRef.current = checkpoint.totalPausedMs ?? 0;
        pausedAtMsRef.current = null;
        setTotalPausedMsState(checkpoint.totalPausedMs ?? 0);
        setPausedAtState(null);
        setIsPaused(false);
        setExercises(checkpoint.exercises as LoggedExercise[]);
      } else if (initialExercises && initialExercises.length > 0) {
        // ── Fresh workout from Saved Session / Custom routine ─────────
        startedAtMsRef.current = Date.now();
        totalPausedMsRef.current = 0;
        pausedAtMsRef.current = null;
        setTotalPausedMsState(0);
        setPausedAtState(null);
        setIsPaused(false);
        setExercises(initialExercises);

        // Prefetch images for initial exercises
        const urlsToPrefetch = initialExercises
          .flatMap((e) => [e.image_url, e.gif_url].filter(Boolean) as string[]);
        if (urlsToPrefetch.length > 0) Image.prefetch(urlsToPrefetch);
      } else {
        // ── Fresh workout from standard template ──────────────────────
        startedAtMsRef.current = Date.now();
        totalPausedMsRef.current = 0;
        pausedAtMsRef.current = null;
        setTotalPausedMsState(0);
        setPausedAtState(null);
        setIsPaused(false);
        const initialList = buildInitialExercises(workout);
        setExercises(initialList);

        // Prefetch all workout exercise images
        const urlsToPrefetch = initialList
          .flatMap((e) => [e.image_url, e.gif_url].filter(Boolean) as string[]);
        if (urlsToPrefetch.length > 0) Image.prefetch(urlsToPrefetch);
      }
    } else {
      slideY.value = withTiming(SCREEN_H, { duration: 300 });
    }
  }, [visible, workout, checkpoint, initialExercises]);

  // ── Background session: Wake Lock + Media Session (Spotify-style) ─────────
  useEffect(() => {
    if (!visible || !workout) return;

    const totalSets = exercises.reduce((a, e) => a + e.sets.length, 0);
    const doneSets = exercises.reduce((a, e) => a + e.sets.filter((s) => s.completed).length, 0);
    // Find the first uncompleted exercise/set for lockscreen metadata
    let currentExIdx = 0;
    let currentSetIdx = 0;
    for (let i = 0; i < exercises.length; i++) {
      const undoneSets = exercises[i].sets.findIndex((s) => !s.completed);
      if (undoneSets >= 0) { currentExIdx = i; currentSetIdx = undoneSets; break; }
    }
    const currentEx = exercises[currentExIdx];
    const currentSet = currentEx?.sets[currentSetIdx];

    workoutSessionManager.startSession(
      {
        workoutTitle: workout.title,
        workoutSlug: workout.slug,
        currentExerciseName: currentEx?.name ?? '',
        currentExerciseIndex: currentExIdx,
        totalExercises: exercises.length,
        currentSetIndex: currentSetIdx,
        totalSetsInExercise: currentEx?.sets.length ?? 0,
        currentSetReps: currentSet?.reps ?? '',
        currentSetWeight: currentSet?.weight ?? '',
        completedSetsTotal: doneSets,
        totalSetsAll: totalSets,
        elapsedSeconds: getElapsedSeconds(),
        isPaused,
        exerciseImageUrl: currentEx?.image_url,
      },
      {
        // Lock-screen "Next" button → complete the current active set
        onNextSet: () => {
          if (!currentEx || !currentSet) return;
          setExercises((prev) =>
            prev.map((e) => {
              if (e.id !== currentEx.id) return e;
              return {
                ...e,
                sets: e.sets.map((s) => {
                  if (s.id === currentSet.id && !s.completed) {
                    playSetCompleteSound();
                    return { ...s, completed: true };
                  }
                  return s;
                }),
              };
            })
          );
        },
        // Lock-screen "Prev" button → uncheck the most recently completed set
        onPrevSet: () => {
          setExercises((prev) => {
            const copy = prev.map((e) => ({ ...e, sets: [...e.sets] }));
            for (let i = copy.length - 1; i >= 0; i--) {
              const lastDone = [...copy[i].sets].reverse().find((s) => s.completed);
              if (lastDone) {
                copy[i].sets = copy[i].sets.map((s) =>
                  s.id === lastDone.id ? { ...s, completed: false } : s
                );
                return copy;
              }
            }
            return prev;
          });
        },
        onTogglePause: () => {
          setIsPaused((prev) => {
            const now = Date.now();
            if (!prev) {
              // Pausing
              pausedAtMsRef.current = now;
              setPausedAtState(now);
            } else {
              // Resuming
              if (pausedAtMsRef.current != null) {
                const pauseDelta = now - pausedAtMsRef.current;
                totalPausedMsRef.current += pauseDelta;
                setTotalPausedMsState((p) => p + pauseDelta);
              }
              pausedAtMsRef.current = null;
              setPausedAtState(null);
            }
            return !prev;
          });
        },
        onFinish: () => handleFinish(),
      }
    );

    return () => {
      workoutSessionManager.endSession();
    };
  // Only re-run when visibility or workout changes (not on every exercises tick)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, workout]);

  // ── Update lock-screen metadata whenever exercise/set state changes ────────
  useEffect(() => {
    if (!visible || !workout || exercises.length === 0) return;
    const totalSets = exercises.reduce((a, e) => a + e.sets.length, 0);
    const doneSets = exercises.reduce((a, e) => a + e.sets.filter((s) => s.completed).length, 0);
    let currentExIdx = 0;
    let currentSetIdx = 0;
    for (let i = 0; i < exercises.length; i++) {
      const undone = exercises[i].sets.findIndex((s) => !s.completed);
      if (undone >= 0) { currentExIdx = i; currentSetIdx = undone; break; }
    }
    const currentEx = exercises[currentExIdx];
    const currentSet = currentEx?.sets[currentSetIdx];
    workoutSessionManager.updateMediaSession({
      workoutTitle: workout.title,
      workoutSlug: workout.slug,
      currentExerciseName: currentEx?.name ?? '',
      currentExerciseIndex: currentExIdx,
      totalExercises: exercises.length,
      currentSetIndex: currentSetIdx,
      totalSetsInExercise: currentEx?.sets.length ?? 0,
      currentSetReps: currentSet?.reps ?? '',
      currentSetWeight: currentSet?.weight ?? '',
      completedSetsTotal: doneSets,
      totalSetsAll: totalSets,
      elapsedSeconds: getElapsedSeconds(),
      isPaused,
      exerciseImageUrl: currentEx?.image_url,
    });
  }, [exercises, isPaused, visible, workout, getElapsedSeconds]);

  // ── Instant Checkpoint: Save on EVERY state change ────────────────────────
  // Saves immediately whenever exercises change — wall-clock preserving resume
  useEffect(() => {
    if (!visible || !workout || exercises.length === 0) return;
    saveActiveSessionCheckpoint({
      workoutSlug: workout.slug || 'custom',
      workoutTitle: workout.title,
      workoutData: workout,
      exercises,
      elapsedSeconds: getElapsedSeconds(),
      startedAt: new Date(startedAtMsRef.current).toISOString(),
      isPaused,
      pausedAt: pausedAtMsRef.current ? new Date(pausedAtMsRef.current).toISOString() : undefined,
      totalPausedMs: totalPausedMsRef.current,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercises, isPaused, visible, workout]);

  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideY.value }],
  }));

  const handleTogglePause = useCallback(() => {
    const now = Date.now();
    setIsPaused((prev) => {
      if (!prev) {
        pausedAtMsRef.current = now;
        setPausedAtState(now);
      } else {
        if (pausedAtMsRef.current != null) {
          const delta = now - pausedAtMsRef.current;
          totalPausedMsRef.current += delta;
          setTotalPausedMsState((p) => p + delta);
        }
        pausedAtMsRef.current = null;
        setPausedAtState(null);
      }
      return !prev;
    });
  }, []);

  const toggleExpand = useCallback((id: string) => {
    setExercises((prev) =>
      prev.map((e) => (e.id === id ? { ...e, expanded: !e.expanded } : e))
    );
  }, []);

  const addSet = useCallback((id: string) => {
    setExercises((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        const lastSet = e.sets[e.sets.length - 1];
        const newSet: LoggedSet = {
          id: Math.random().toString(36).substr(2, 9),
          weight: lastSet ? lastSet.weight : '',
          reps: lastSet ? lastSet.reps : '10',
          completed: false,
        };
        return { ...e, sets: [...e.sets, newSet] };
      })
    );
  }, []);

  const delEx = useCallback((id: string) => {
    setExercises((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const setChange = useCallback(
    (exId: string, sid: string, f: 'weight' | 'reps', v: string) => {
      setExercises((prev) =>
        prev.map((e) => {
          if (e.id !== exId) return e;
          return {
            ...e,
            sets: e.sets.map((s) => (s.id === sid ? { ...s, [f]: v } : s)),
          };
        })
      );
    }
  , []);

  const toggleSet = useCallback((exId: string, sid: string) => {
    setExercises((prev) =>
      prev.map((e) => {
        if (e.id !== exId) return e;
        return {
          ...e,
          sets: e.sets.map((s) => {
            if (s.id === sid) {
              const nextVal = !s.completed;
              if (nextVal) playSetCompleteSound();
              else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              return { ...s, completed: nextVal };
            }
            return s;
          }),
        };
      })
    );
  }, []);

  const delSet = useCallback((exId: string, sid: string) => {
    setExercises((prev) =>
      prev.map((e) => {
        if (e.id !== exId) return e;
        return { ...e, sets: e.sets.filter((s) => s.id !== sid) };
      })
    );
  }, []);

  const handleAddEx = (name: string) => {
    const info = getExerciseInfo(name);
    const newEx: LoggedExercise = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      expanded: true,
      coaching_cue: info.coaching_cues,
      image_url: info.image_url,
      gif_url: info.gif_url,
      sets: [{ id: Math.random().toString(36).substr(2, 9), weight: '', reps: '10', completed: false }],
    };
    setExercises((prev) => [...prev, newEx]);
    setAddExVisible(false);
  };

  const handleCancel = () => {
    setShowCancelSheet(true);
  };

  const handleFinish = () => {
    setShowFinishSheet(true);
  };

  const confirmFinish = async (slot: ResetSlot = 'main') => {
    setShowFinishSheet(false);
    workoutSessionManager.endSession();
    const elapsed = getElapsedSeconds();
    const totalSets = exercises.reduce((a, e) => a + e.sets.length, 0);
    const doneSets = exercises.reduce((a, e) => a + e.sets.filter((s) => s.completed).length, 0);
    const volume = exercises.reduce((a, e) => {
      return (
        a +
        e.sets.reduce((sa, s) => {
          if (!s.completed) return sa;
          const w = parseFloat(s.weight) || 0;
          const r = parseFloat(s.reps) || 0;
          return sa + w * r;
        }, 0)
      );
    }, 0);

    const summary: WorkoutSummaryData = {
      workoutTitle: workout?.title || 'Custom Session',
      workoutSlug: workout?.slug || 'custom',
      durationSeconds: elapsed,
      completedSets: doneSets,
      totalSets,
      totalVolumeKg: Math.round(volume),
      exercises,
      sessionSlot: slot,
    };

    // ── Clear the live checkpoint (workout is done) ─────────────────────
    await clearActiveSessionCheckpoint();

    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // ── Immediately persist completed date to local storage (Garden/Streak update) ─
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY_COMPLETED_DATES);
      const existing: string[] = raw ? JSON.parse(raw) : [];
      if (!existing.includes(today)) {
        existing.push(today);
        await AsyncStorage.setItem(STORAGE_KEY_COMPLETED_DATES, JSON.stringify(existing));
      }
    } catch (_) {}

    // ── Try to save to Supabase; fall back to offline queue ─────────────
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        const { error } = await supabase.from('workout_logs').insert({
          user_id: user.id,
          workout_slug: workout?.slug || 'custom',
          workout_title: workout?.title || 'Custom Session',
          date: today,
          slot: slot,
          session_slot: slot,
          duration_minutes: Math.round(elapsed / 60),
          volume_kg: Math.round(volume),
          exercises_json: JSON.stringify(exercises),
          status: 'completed',
          sync_status: 'synced',
          created_at: new Date().toISOString(),
        });
        if (error) throw error;
      }
    } catch (_) {
      // Offline — queue for automatic sync when internet returns
      await enqueuePendingLog({
        workoutSlug: workout?.slug || 'custom',
        workoutTitle: workout?.title || 'Custom Session',
        date: today,
        durationSeconds: elapsed,
        completedSets: doneSets,
        totalSets,
        volumeKg: Math.round(volume),
        exercises,
        completedAt: new Date().toISOString(),
      });
    }

    setCelebration(summary);
  };

  if (!visible) return null;

  const totalSets = exercises.reduce((a, e) => a + e.sets.length, 0);
  const doneSets = exercises.reduce((a, e) => a + e.sets.filter((s) => s.completed).length, 0);
  const currentElapsed = getElapsedSeconds();

  return (
    <RNModal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleCancel}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={s.container}>
          <SafeAreaView style={{ flex: 1 }}>
            {/* Header */}
            <View style={s.topBar}>
              <Pressable style={s.iconBtn} onPress={handleCancel} hitSlop={10}>
                <X size={20} color={colors.textPrimary} />
              </Pressable>
              <View style={s.titleBox}>
                <Text style={s.titleTxt} numberOfLines={1}>
                  {workout?.title || 'Active Workout'}
                </Text>
                <WorkoutTimer
                  startTime={startedAtMsRef.current}
                  totalPausedMs={totalPausedMsState}
                  isPaused={isPaused}
                  pausedAt={pausedAtState}
                />
              </View>
              <Pressable style={s.finishBtn} onPress={handleFinish}>
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark]}
                  style={s.finishGrad}
                >
                  <Check size={14} color="#FFF" strokeWidth={2.5} />
                  <Text style={s.finishTxt}>{t('common.done').toUpperCase()}</Text>
                </LinearGradient>
              </Pressable>
            </View>

            {/* Progress bar */}
            <View style={s.progBg}>
              <View
                style={[
                  s.progFill,
                  { width: totalSets > 0 ? `${(doneSets / totalSets) * 100}%` : '0%' },
                ]}
              />
            </View>

            {/* Scrollable Exercise Cards */}
            <ScrollView style={s.scroll} contentContainerStyle={s.scrollPad}>
              {exercises.map((ex) => (
                <ExCard
                  key={ex.id}
                  ex={ex}
                  onToggle={() => toggleExpand(ex.id)}
                  onAddSet={() => addSet(ex.id)}
                  onDel={() => delEx(ex.id)}
                  onSetChange={(sid, f, v) => setChange(ex.id, sid, f, v)}
                  onToggleSet={(sid) => toggleSet(ex.id, sid)}
                  onDelSet={(sid) => delSet(ex.id, sid)}
                  onOpenDetail={() => setDetailExName(ex.name)}
                />
              ))}

              {/* Add Exercise Button */}
              <Pressable style={s.addExBtn} onPress={() => setAddExVisible(true)}>
                <Plus size={16} color={colors.primaryDark} strokeWidth={2} />
                <Text style={s.addExTxt}>{t('workout.addSet').toUpperCase()}</Text>
              </Pressable>
            </ScrollView>
          </SafeAreaView>

          {/* Add Exercise Modal */}
          {addExVisible && (
            <AddExerciseModal
              onClose={() => setAddExVisible(false)}
              onAdd={handleAddEx}
              onPreviewDetail={(name) => setDetailExName(name)}
            />
          )}

          {/* Exercise Detail Modal */}
          <ExerciseDetailModal
            visible={!!detailExName}
            exerciseName={detailExName || ''}
            onClose={() => setDetailExName(null)}
          />
        </View>
      </KeyboardAvoidingView>

      {/* Cancel Confirmation Sheet */}
      <CancelWorkoutSheet
        visible={showCancelSheet}
        onKeepGoing={() => setShowCancelSheet(false)}
        onDiscard={() => {
          setShowCancelSheet(false);
          workoutSessionManager.endSession();
          onCancel();
        }}
      />

      {/* Finish Confirmation Sheet */}
      {(() => {
        const totalSets = exercises.reduce((a, e) => a + e.sets.length, 0);
        const doneSets = exercises.reduce((a, e) => a + e.sets.filter((s) => s.completed).length, 0);
        const volume = exercises.reduce((a, e) =>
          a + e.sets.reduce((sa, s) => {
            if (!s.completed) return sa;
            return sa + (parseFloat(s.weight) || 0) * (parseFloat(s.reps) || 0);
          }, 0), 0);
        return (
          <FinishConfirmSheet
            visible={showFinishSheet}
            completedSets={doneSets}
            totalSets={totalSets}
            durationSeconds={currentElapsed}
            volumeKg={Math.round(volume)}
            onConfirm={confirmFinish}
            onCancel={() => setShowFinishSheet(false)}
          />
        );
      })()}

      {/* Celebration Modal */}
      <WorkoutCelebrationModal
        visible={!!celebration}
        summary={celebration}
        onClose={() => {
          const s = celebration!;
          setCelebration(null);
          onFinish(s);
        }}
      />
    </RNModal>
  );
};

// --- Quick Add Exercise Picker Modal -----------------------------------------

function AddExerciseModal({
  onClose,
  onAdd,
  onPreviewDetail,
}: {
  onClose: () => void;
  onAdd: (name: string) => void;
  onPreviewDetail: (name: string) => void;
}) {
  const [q, setQ] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedMuscle, setSelectedMuscle] = useState('All');

  const categories = ['All', 'Strength', 'Stretching', 'Plyometrics', 'Cardio', 'Powerlifting'];
  const muscles = ['All', 'Abdominals', 'Glutes', 'Hamstrings', 'Quadriceps', 'Chest', 'Lats', 'Shoulders', 'Biceps', 'Triceps', 'Calves'];

  const results = useMemo(() => {
    return searchExercises(q, selectedCategory, selectedMuscle);
  }, [q, selectedCategory, selectedMuscle]);

  return (
    <RNModal visible transparent animationType="slide">
      <View style={am.overlay}>
        <View style={am.box}>
          {/* Header */}
          <View style={am.hdr}>
            <View style={am.hdrTitleRow}>
              <Dumbbell size={18} color={colors.primaryDark} />
              <Text style={am.title}>Exercise Database</Text>
              <View style={am.countBadge}>
                <Text style={am.countTxt}>{results.length} found</Text>
              </View>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={am.closeBtn}>
              <X size={18} color={colors.textPrimary} />
            </Pressable>
          </View>

          {/* Search Input */}
          <View style={am.searchRow}>
            <Search size={15} color={colors.textTertiary} style={am.searchIcon} />
            <TextInput
              style={am.search}
              placeholder="Search 870+ exercises..."
              placeholderTextColor={colors.textTertiary}
              value={q}
              onChangeText={setQ}
              autoFocus
            />
            {q.length > 0 && (
              <Pressable onPress={() => setQ('')} style={am.clearBtn} hitSlop={8}>
                <X size={14} color={colors.textTertiary} />
              </Pressable>
            )}
          </View>

          {/* Muscle Filters */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={am.chipScroll} contentContainerStyle={am.chipContainer}>
            <Text style={am.filterLabel}>MUSCLE:</Text>
            {muscles.map((m) => (
              <Pressable
                key={m}
                style={[am.chip, selectedMuscle === m && am.chipActive]}
                onPress={() => setSelectedMuscle(m)}
              >
                <Text style={[am.chipTxt, selectedMuscle === m && am.chipTxtActive]}>{m}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Category Filters */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={am.chipScroll} contentContainerStyle={am.chipContainer}>
            <Text style={am.filterLabel}>TYPE:</Text>
            {categories.map((c) => (
              <Pressable
                key={c}
                style={[am.chip, selectedCategory === c && am.chipActiveCategory]}
                onPress={() => setSelectedCategory(c)}
              >
                <Text style={[am.chipTxt, selectedCategory === c && am.chipTxtActive]}>{c}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* 870+ Exercises List */}
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            style={{ maxHeight: 380 }}
            contentContainerStyle={{ paddingVertical: 4 }}
            initialNumToRender={20}
            maxToRenderPerBatch={25}
            windowSize={10}
            removeClippedSubviews={Platform.OS !== 'web'}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <View style={am.itemRow}>
                <Pressable style={am.itemTxtCol} onPress={() => onAdd(item.name)}>
                  <Image
                    source={{ uri: item.image_url }}
                    style={am.itemThumb}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    transition={100}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={am.itemTxt} numberOfLines={1}>{item.name}</Text>
                    <Text style={am.itemSub} numberOfLines={1}>
                      {item.equipment} • {item.primary_muscles.join(', ')}
                    </Text>
                  </View>
                </Pressable>
                <Pressable onPress={() => onPreviewDetail(item.name)} style={am.infoBtn} hitSlop={8}>
                  <Info size={16} color={colors.primaryDark} />
                </Pressable>
              </View>
            )}
          />
        </View>
      </View>
    </RNModal>
  );
}

const am = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(28,21,17,0.55)', justifyContent: 'flex-end' },
  box: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    maxHeight: SCREEN_H * 0.85,
  },
  hdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  hdrTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 16, fontFamily: fontFamilies.monoBold, color: colors.textPrimary },
  countBadge: { backgroundColor: 'rgba(74,93,78,0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  countTxt: { fontSize: 10, fontFamily: fontFamilies.monoMedium, color: colors.sageDark },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(101,78,60,0.06)', alignItems: 'center', justifyContent: 'center' },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(101,78,60,0.12)',
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  searchIcon: { marginRight: 6 },
  search: {
    flex: 1,
    height: 40,
    fontSize: 13,
    fontFamily: fontFamilies.monoRegular,
    color: colors.textPrimary,
  },
  clearBtn: { padding: 4 },
  chipScroll: { maxHeight: 34, marginBottom: 8 },
  chipContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  filterLabel: { fontSize: 9, fontFamily: fontFamilies.monoBold, color: colors.textTertiary, letterSpacing: 0.8, marginRight: 2 },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, backgroundColor: 'rgba(101,78,60,0.06)' },
  chipActive: { backgroundColor: colors.sageDark },
  chipActiveCategory: { backgroundColor: colors.primaryDark },
  chipTxt: { fontSize: 10, fontFamily: fontFamilies.monoMedium, color: colors.textSecondary },
  chipTxtActive: { color: '#FFF' },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(101,78,60,0.06)',
  },
  itemTxtCol: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  itemThumb: { width: 38, height: 38, borderRadius: 8, backgroundColor: '#F5F2EB', borderWidth: 1, borderColor: 'rgba(101,78,60,0.08)' },
  itemTxt: { fontSize: 13, fontFamily: fontFamilies.monoMedium, color: colors.textPrimary },
  itemSub: { fontSize: 10, fontFamily: fontFamilies.monoRegular, color: colors.textTertiary, marginTop: 1 },
  infoBtn: { padding: 8, marginLeft: 6 },
});


const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF8F5' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(101,78,60,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBox: { alignItems: 'center', flex: 1, marginHorizontal: 8, minWidth: 0 },
  titleTxt: { fontSize: 14, fontFamily: fontFamilies.monoBold, color: colors.textPrimary },
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  timerTxt: { fontSize: 12, fontFamily: fontFamilies.monoMedium, color: colors.primaryDark },
  finishBtn: { borderRadius: 12, overflow: 'hidden' },
  finishGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  finishTxt: { fontSize: 11, fontFamily: fontFamilies.monoBold, color: '#FFF', letterSpacing: 0.5 },
  progBg: { height: 3, backgroundColor: 'rgba(101,78,60,0.1)' },
  progFill: { height: '100%', backgroundColor: colors.sageDark },
  scroll: { flex: 1 },
  scrollPad: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 40 },
  addExBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(201,70,91,0.3)',
    backgroundColor: 'rgba(201,70,91,0.03)',
    marginTop: 6,
  },
  addExTxt: { fontSize: 12, fontFamily: fontFamilies.monoBold, letterSpacing: 1, color: colors.primaryDark },
});