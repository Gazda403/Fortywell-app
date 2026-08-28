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
} from '../lib/useOfflineSync';
import { supabase } from '../lib/supabase';

const { height: SCREEN_H } = Dimensions.get('window');

// --- Types -------------------------------------------------------------------

interface LoggedSet {
  id: string;
  weight: string;
  reps: string;
  completed: boolean;
}

interface LoggedExercise {
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
}

// --- Helper Timer Formatter -------------------------------------------------

function formatTime(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${m < 10 ? '0' : ''}${m}:${sec < 10 ? '0' : ''}${sec}`;
  return `${m < 10 ? '0' : ''}${m}:${sec < 10 ? '0' : ''}${sec}`;
}

const WorkoutTimer = React.memo(function WorkoutTimer({ startTime }: { startTime: number }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    setElapsed(Math.floor((Date.now() - startTime) / 1000));
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

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

  const addEx = (name: string, cue?: string, defaultReps = '10', raw_img?: string, raw_gif?: string) => {
    const info = getExerciseInfo(name);
    const cdnRawImg = raw_img ? raw_img.replace('raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises', 'cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises') : undefined;
    const cdnRawGif = raw_gif ? raw_gif.replace('raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises', 'cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises') : undefined;

    list.push({
      id: Math.random().toString(36).substr(2, 9),
      name,
      coaching_cue: cue || info.coaching_cues,
      image_url: info.image_url || cdnRawImg,
      gif_url: info.gif_url || cdnRawGif,
      expanded: true,
      sets: [
        { id: Math.random().toString(36).substr(2, 9), weight: '', reps: defaultReps, completed: false },
      ],
    });
  };

  (w.warmup || []).forEach((e) => addEx(e.name, e.notes, e.duration || '60s', e.image_url, e.gif_url));
  (w.main_blocks || []).forEach((b) =>
    (b.exercises || []).forEach((e) =>
      addEx(
        e.name,
        e.coaching_cue,
        e.reps ? String(e.reps) : '10',
        e.image_url,
        e.gif_url
      )
    )
  );
  (w.cooldown || []).forEach((e) => addEx(e.name, e.notes, e.duration || '60s', e.image_url, e.gif_url));

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
        keyboardType="number-pad"
        value={set.reps}
        onChangeText={(v) => onChange('reps', v)}
        editable={!set.completed}
      />

      <Pressable
        style={[sr.checkBtn, set.completed && sr.checkBtnDone]}
        onPress={onToggle}
      >
        <Check size={14} color={set.completed ? '#FFF' : colors.textTertiary} strokeWidth={2.5} />
      </Pressable>

      <Pressable style={sr.delBtn} onPress={onDelete} hitSlop={8}>
        <Trash2 size={12} color="rgba(201,70,91,0.4)" />
      </Pressable>
    </View>
  );
});

const sr = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 8,
    borderRadius: 10,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  rowDone: { backgroundColor: 'rgba(74,93,78,0.06)' },
  numBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: 'rgba(101,78,60,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numTxt: { fontSize: 11, fontFamily: fontFamilies.monoBold, color: colors.textSecondary },
  numTxtDone: { color: colors.sageDark },
  input: {
    flex: 1,
    height: 36,
    backgroundColor: '#FAF8F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(101,78,60,0.12)',
    textAlign: 'center',
    fontSize: 13,
    fontFamily: fontFamilies.monoMedium,
    color: colors.textPrimary,
  },
  inputDone: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    color: colors.sageDark,
  },
  checkBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(101,78,60,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
  },
  checkBtnDone: { backgroundColor: colors.sageDark, borderColor: colors.sageDark },
  delBtn: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
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
            <View style={{ width: 24 }} />
            <Text style={[ec.col, { flex: 1, textAlign: 'center' }]}>KG</Text>
            <Text style={[ec.col, { flex: 1, textAlign: 'center' }]}>REPS</Text>
            <View style={{ width: 36 + 8 + 30 }} />
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
    overflow: 'hidden',
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
  },
  thumbImg: {
    width: '100%',
    height: '100%',
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(101,78,60,0.2)' },
  dotDone: { backgroundColor: colors.sageDark },
  hdrTxt: { flex: 1 },
  name: { fontSize: 13, fontFamily: fontFamilies.monoMedium, color: colors.textPrimary, marginBottom: 2 },
  meta: { fontSize: 10, fontFamily: fontFamilies.monoRegular, color: colors.textSecondary },
  infoBtn: { padding: 4, marginRight: 2 },
  delBtn: { padding: 4 },
  body: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(101,78,60,0.06)',
    paddingTop: 10,
  },
  cue: {
    backgroundColor: 'rgba(201,70,91,0.06)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
  },
  cueTxt: {
    fontSize: 11,
    fontFamily: fontFamilies.monoRegular,
    color: colors.primaryDark,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  colHdr: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
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
}) => {
  const startTimeRef = useRef<number>(Date.now());
  const [exercises, setExercises] = useState<LoggedExercise[]>([]);
  const [addExVisible, setAddExVisible] = useState(false);
  const [detailExName, setDetailExName] = useState<string | null>(null);
  const [showCancelSheet, setShowCancelSheet] = useState(false);
  const [showFinishSheet, setShowFinishSheet] = useState(false);
  const [celebration, setCelebration] = useState<WorkoutSummaryData | null>(null);

  const slideY = useSharedValue(SCREEN_H);

  // Animate in/out
  useEffect(() => {
    if (visible) {
      slideY.value = withSpring(0, { damping: 20, stiffness: 120 });
      startTimeRef.current = Date.now();
      const initialExercises = buildInitialExercises(workout);
      setExercises(initialExercises);

      // Prefetch all workout exercise images into memory
      const urlsToPrefetch = initialExercises
        .flatMap((e) => [e.image_url, e.gif_url].filter(Boolean) as string[]);
      if (urlsToPrefetch.length > 0) {
        Image.prefetch(urlsToPrefetch);
      }
    } else {
      slideY.value = withTiming(SCREEN_H, { duration: 300 });
    }
  }, [visible, workout]);

  // ── Offline Checkpoint: Save progress every 30s ──────────────────────────
  // Like hitting "Save" on a document — runs silently in the background.
  const checkpointIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!visible || !workout) return;

    const save = () => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      saveActiveSessionCheckpoint({
        workoutSlug: workout.slug || 'custom',
        workoutTitle: workout.title,
        exercises,
        elapsedSeconds: elapsed,
        startedAt: new Date(startTimeRef.current).toISOString(),
      });
    };

    checkpointIntervalRef.current = setInterval(save, 30_000);

    return () => {
      if (checkpointIntervalRef.current) clearInterval(checkpointIntervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, workout, exercises]);

  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideY.value }],
  }));

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
    const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
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
      durationSeconds: elapsed,
      completedSets: doneSets,
      totalSets,
      totalVolumeKg: Math.round(volume),
      exercises,
      sessionSlot: slot,
    };

    // ── Clear the live checkpoint (workout is done) ─────────────────────
    await clearActiveSessionCheckpoint();

    // ── Try to save to Supabase; fall back to offline queue ─────────────
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        const today = new Date().toISOString().split('T')[0];
        const { error } = await supabase.from('workout_logs').insert({
          workout_slug: workout?.slug || 'custom',
          workout_title: workout?.title || 'Custom Session',
          date: today,
          duration_minutes: Math.round(elapsed / 60),
          completed_sets: doneSets,
          total_sets: totalSets,
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
      const today = new Date().toISOString().split('T')[0];
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
  const currentElapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);

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
                <WorkoutTimer startTime={startTimeRef.current} />
              </View>
              <Pressable style={s.finishBtn} onPress={handleFinish}>
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark]}
                  style={s.finishGrad}
                >
                  <Check size={14} color="#FFF" strokeWidth={2.5} />
                  <Text style={s.finishTxt}>DONE</Text>
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
                <Text style={s.addExTxt}>ADD EXERCISE</Text>
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

  const results = searchExercises(q, selectedCategory, selectedMuscle, 120);

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

          {/* 800+ Exercises List */}
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            style={{ maxHeight: 380 }}
            contentContainerStyle={{ paddingVertical: 4 }}
            initialNumToRender={15}
            maxToRenderPerBatch={20}
            windowSize={10}
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
    paddingHorizontal: 16,
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
  titleBox: { alignItems: 'center', flex: 1, marginHorizontal: 10 },
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
  scrollPad: { padding: 14, paddingBottom: 40 },
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