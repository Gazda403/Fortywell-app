import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
  Switch,
  Modal,
  TextInput,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  Sparkles,
  Check,
  Circle,
  Clock,
  ChevronRight,
  Info,
  Calendar,
  Bell,
  Sun,
  Moon,
  Compass,
  ArrowRight,
  Flame,
  CheckCircle2,
  X,
  Plus,
  Sliders,
  Dumbbell,
  Footprints,
  BookOpen,
  Palette,
  Flower2,
  Play,
  RotateCcw,
  MoreVertical,
  CalendarClock,
  HeartHandshake,
  Coffee,
  CheckCircle,
  ChevronLeft,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { fontFamilies } from '../theme/typography';
import { OnboardingAnswers } from '../types/onboarding';
import { useRhythmData, NIGHT_ACTIVITIES } from '../hooks/useRhythmData';
import { ResetSlot, DayRhythmSummary, ResetTimingPreference, NightActivityType, DaySlotInfo } from '../types/rhythm';
import { SessionClassificationModal } from './SessionClassificationModal';
import { ErrorBanner } from './ErrorBanner';
import { ErrorToast, ErrorToastVariant } from './ErrorToast';
import { CycleSetupSheet } from './CycleSetupSheet';
import { useLanguage } from '../context/LanguageContext';
import { HeaderActionButtons } from './HeaderActionButtons';

const { width: SCREEN_W } = Dimensions.get('window');

interface RhythmScreenProps {
  answers?: OnboardingAnswers | null;
  onStartWorkout?: () => void;
  onOpenStore?: () => void;
  onOpenProfile?: () => void;
  userMonogram?: string;
}

const AVAILABLE_TIMES = [
  '06:00 AM', '06:30 AM', '07:00 AM', '07:30 AM', '08:00 AM', '08:30 AM',
  '11:30 AM', '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM',
  '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM', '08:30 PM', '09:00 PM'
];

export const RhythmScreen: React.FC<RhythmScreenProps> = ({
  answers,
  onStartWorkout,
  onOpenStore,
  onOpenProfile,
  userMonogram,
}) => {
  const {
    weekDays,
    weeklyTheme,
    timingPreferences,
    cycleData,
    nightLogsByDate,
    toggleSlotStatus,
    completeSessionSlot,
    logNightActivity,
    skipSessionSlot,
    rescheduleSessionSlot,
    toggleRestDay,
    updateTimingPreference,
    toggleCycleOptIn,
    updateCycleStart,
  } = useRhythmData(answers);

  const { t } = useLanguage();

  // Selected day for the expanded view (defaults to today)
  const todaySummary = weekDays.find((d) => d.isToday) || weekDays[0];
  const [selectedDayDate, setSelectedDayDate] = useState<string>(todaySummary.date);

  // Time adjustment modal state
  const [activeEditingSlot, setActiveEditingSlot] = useState<ResetTimingPreference | null>(null);

  // Cycle info modal / setup sheet state
  const [cycleModalVisible, setCycleModalVisible] = useState<boolean>(false);
  const [cycleSetupVisible, setCycleSetupVisible] = useState<boolean>(false);

  // Error / offline state
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [errorToastVisible, setErrorToastVisible] = useState<boolean>(false);
  const [errorToastVariant, setErrorToastVariant] = useState<ErrorToastVariant>('save-error');

  const showErrorToast = useCallback((variant: ErrorToastVariant) => {
    setErrorToastVariant(variant);
    setErrorToastVisible(true);
  }, []);

  // Slot confirmation modal state ("Was this your Main Session, or something else?")
  const [confirmModalVisible, setConfirmModalVisible] = useState<boolean>(false);
  const [pendingConfirmDate, setPendingConfirmDate] = useState<string>(todaySummary.date);
  const [pendingConfirmInitialSlot, setPendingConfirmInitialSlot] = useState<ResetSlot>('main');

  // Night activity state & custom text input
  const [selectedNightActivity, setSelectedNightActivity] = useState<NightActivityType>('stretch');
  const [customNightInput, setCustomNightInput] = useState<string>('');
  const [nightActivityModalVisible, setNightActivityModalVisible] = useState<boolean>(false);

  // Skip / Reschedule bottom sheet state
  const [manageSlotModalVisible, setManageSlotModalVisible] = useState<boolean>(false);
  const [slotToManage, setSlotToManage] = useState<{ date: string; slot: ResetSlot; label: string } | null>(null);

  const selectedDay = weekDays.find((d) => d.date === selectedDayDate) || todaySummary;
  const isViewingToday = selectedDay.date === todaySummary.date;

  const handleDayPress = useCallback((dateStr: string) => {
    setSelectedDayDate(dateStr);
    try {
      if (Platform.OS !== 'web') {
        Haptics.selectionAsync();
      }
    } catch (_) {}
  }, []);

  // Open confirmation dialog before finalizing slot completion
  const handleRequestSlotComplete = (dateStr: string, slot: ResetSlot) => {
    setPendingConfirmDate(dateStr);
    setPendingConfirmInitialSlot(slot);
    setConfirmModalVisible(true);
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (_) {}
  };

  const handleConfirmSlotClassification = async (confirmedSlot: ResetSlot) => {
    try {
      await completeSessionSlot(pendingConfirmDate, confirmedSlot);
      setConfirmModalVisible(false);
    } catch (err) {
      showErrorToast('save-error');
    }
  };

  const handleTimeSelect = async (time: string) => {
    if (activeEditingSlot) {
      try {
        await updateTimingPreference(activeEditingSlot.slot, time, activeEditingSlot.reminderEnabled);
        setActiveEditingSlot(null);
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } catch (err) {
        showErrorToast('save-error');
      }
    }
  };

  // Save Night Activity (supports custom type-in)
  const handleSaveNightActivity = async () => {
    try {
      const isCustom = selectedNightActivity === 'custom';
      const finalTitle = isCustom && customNightInput.trim() ? customNightInput.trim() : undefined;
      await logNightActivity(selectedDay.date, selectedNightActivity, 20, finalTitle, finalTitle);
      setNightActivityModalVisible(false);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err) {
      showErrorToast('save-error');
    }
  };

  // Open manage modal (Skip / Reschedule)
  const handleOpenManageSlot = (slotKey: ResetSlot, label: string) => {
    setSlotToManage({ date: selectedDay.date, slot: slotKey, label });
    setManageSlotModalVisible(true);
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (_) {}
  };

  // Execute skip
  const handleExecuteSkip = async () => {
    if (slotToManage) {
      try {
        await skipSessionSlot(slotToManage.date, slotToManage.slot, 'Resting today — Honoring recovery');
        setManageSlotModalVisible(false);
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } catch (err) {
        showErrorToast('save-error');
      }
    }
  };

  // Execute reschedule
  const handleExecuteReschedule = async () => {
    if (slotToManage) {
      try {
        await rescheduleSessionSlot(slotToManage.date, slotToManage.slot, 'Tomorrow • 12:30 PM');
        setManageSlotModalVisible(false);
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } catch (err) {
        showErrorToast('save-error');
      }
    }
  };

  // Helper for rendering Night Activity icon
  const renderNightActivityIcon = (type: NightActivityType, color: string, size = 18) => {
    switch (type) {
      case 'walk': return <Footprints size={size} color={color} strokeWidth={2} />;
      case 'reading': return <BookOpen size={size} color={color} strokeWidth={2} />;
      case 'hobby': return <Palette size={size} color={color} strokeWidth={2} />;
      case 'stretch': return <Flower2 size={size} color={color} strokeWidth={2} />;
      case 'custom': return <Sparkles size={size} color={color} strokeWidth={2} />;
    }
  };

  const activeSlots = selectedDay.slots;
  const morningSlot = activeSlots.morning;
  const mainSlot = activeSlots.main;
  const nightSlot = activeSlots.night;

  return (
    <View style={styles.root}>
      {/* ── ERROR BANNER (OFFLINE AWARENESS) ── */}
      <ErrorBanner isOffline={isOffline} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── TOP EDITORIAL HEADER ── */}
        <View style={styles.header}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <View style={styles.kickerRow}>
              <View style={styles.activeDot} />
              <Text style={styles.headerKicker}>{t('rhythm.headerKicker')}</Text>
            </View>
            <Text style={styles.headline}>{t('rhythm.title')}</Text>
            <Text style={styles.subtitle}>
              {t('rhythm.dragToReorder')}
            </Text>
          </View>
          {onOpenStore && onOpenProfile && (
            <HeaderActionButtons
              onOpenStore={onOpenStore}
              onOpenProfile={onOpenProfile}
              userMonogram={userMonogram}
            />
          )}
        </View>

      {/* ── SECTION 1: 7-DAY RESET PROGRESS (CALENDAR VIEW) ── */}
      <View style={styles.section}>
        <View style={styles.weekStripCard}>
          <View style={styles.weekStripHeaderRow}>
            <View>
              <Text style={styles.sectionKicker}>{t('rhythm.weeklyPlan')}</Text>
              <Text style={styles.weekStripSubtitle}>{t('rhythm.dragToReorder')}</Text>
            </View>
            <View style={styles.weeklyCountBadge}>
              <Text style={styles.weeklyCountText}>
                {weekDays.reduce((acc, d) => acc + d.completedCount, 0)} resets done
              </Text>
            </View>
          </View>

          {/* 7-Day horizontal row */}
          <View style={styles.daysStripRow}>
            {weekDays.map((d) => {
              const isSelected = d.date === selectedDayDate;
              const slots = Object.values(d.slots);

              return (
                <Pressable
                  key={d.date}
                  onPress={() => handleDayPress(d.date)}
                  style={[
                    styles.dayStripCol,
                    isSelected && styles.dayStripColSelected,
                    d.isToday && styles.dayStripColToday,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`${d.fullDayName}, ${d.completedCount} of 3 resets completed`}
                >
                  {/* "Today" outer ring indicator */}
                  {d.isToday && (
                    <View style={styles.todayOuterRing} pointerEvents="none" />
                  )}

                  <Text
                    style={[
                      styles.dayStripLabel,
                      d.isToday && styles.dayStripLabelToday,
                      isSelected && styles.dayStripLabelSelected,
                    ]}
                  >
                    {d.dayLabel}
                  </Text>

                  <Text
                    style={[
                      styles.dayStripNumber,
                      d.isToday && styles.dayStripNumberToday,
                      isSelected && styles.dayStripNumberSelected,
                    ]}
                  >
                    {d.dayNumber}
                  </Text>

                  {/* 3 Status marks (Morning, Main, Night) */}
                  <View style={styles.statusDotsContainer}>
                    {slots.map((slot) => {
                      const isComplete = slot.status === 'completed';
                      const isSkipped = slot.status === 'skipped';
                      const isRest = slot.status === 'rest';

                      return (
                        <View
                          key={slot.slot}
                          style={[
                            styles.slotDot,
                            isComplete && styles.slotDotCompleted,
                            isSkipped && styles.slotDotSkipped,
                            isRest && styles.slotDotRest,
                            !isComplete && !isSkipped && !isRest && styles.slotDotPlanned,
                          ]}
                        />
                      );
                    })}
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Clarity Legend */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.sage }]} />
              <Text style={styles.legendText}>Complete</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { borderColor: colors.borderMedium, borderWidth: 1.5, backgroundColor: 'transparent' }]} />
              <Text style={styles.legendText}>Planned</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.roseSoft, borderColor: colors.peachBorder, borderWidth: 1 }]} />
              <Text style={styles.legendText}>Rest/Skip</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={styles.legendTodayRing} />
              <Text style={styles.legendText}>Today</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── SECTION 2: SESSION CARDS FOR SELECTED DAY ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.sectionKicker}>
              {isViewingToday ? "TODAY'S SESSIONS" : `SESSIONS FOR ${selectedDay.dayLabel} • ${selectedDay.dayNumber}`}
            </Text>
            {!isViewingToday && (
              <Pressable
                onPress={() => setSelectedDayDate(todaySummary.date)}
                style={styles.backToTodayBtn}
                accessibilityRole="button"
                accessibilityLabel="Jump back to today"
              >
                <Text style={styles.backToTodayText}>Back to Today</Text>
              </Pressable>
            )}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Pressable
              onPress={() => toggleRestDay(selectedDay.date)}
              style={[styles.restDayToggleBtn, selectedDay.isRestDay && styles.restDayToggleBtnActive]}
              accessibilityRole="button"
              accessibilityLabel="Toggle planned rest day"
            >
              <Coffee size={11} color={selectedDay.isRestDay ? '#FFF' : colors.textSecondary} />
              <Text style={[styles.restDayToggleText, selectedDay.isRestDay && styles.restDayToggleTextActive]}>
                {selectedDay.isRestDay ? 'Rest Day' : 'Make Rest Day'}
              </Text>
            </Pressable>

            <View style={styles.todayDateBadge}>
              <Text style={styles.todayDateText}>
                {selectedDay.dayLabel} • {selectedDay.dayNumber}
              </Text>
            </View>
          </View>
        </View>

        {/* IF FULL REST DAY */}
        {selectedDay.isRestDay ? (
          <View style={styles.restDayCard}>
            <View style={styles.restCardGlow} pointerEvents="none" />
            <View style={styles.restCardHeader}>
              <View style={styles.restIconBox}>
                <Coffee size={20} color={colors.sageDark} strokeWidth={2.2} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.restCardTitle}>Planned Rest & Restoration Day</Text>
                </View>
                <Text style={styles.restCardSubtitle}>
                  No structured training sessions scheduled for {selectedDay.fullDayName}.
                </Text>
              </View>
            </View>

            <Text style={styles.restCardBody}>
              Recovery is when your body synthesizes collagen, restores hormonal equilibrium, and consolidates strength. Focus on gentle walks, hydration, and restful sleep.
            </Text>

            <View style={styles.restCardActions}>
              <Pressable
                onPress={() => toggleRestDay(selectedDay.date, false)}
                style={styles.restCardActionBtn}
              >
                <RotateCcw size={13} color={colors.textSecondary} />
                <Text style={styles.restCardActionBtnText}>Switch to Active Day</Text>
              </Pressable>

              {onStartWorkout && (
                <Pressable
                  onPress={onStartWorkout}
                  style={styles.restCardStartBtn}
                >
                  <Sparkles size={13} color="#FFF" />
                  <Text style={styles.restCardStartBtnText}>Start Gentle Session Anyway</Text>
                </Pressable>
              )}
            </View>
          </View>
        ) : (
          /* ACTIVE 3 SESSION CARDS */
          <View style={styles.sessionCardsContainer}>
            {/* 1. MORNING SESSION CARD */}
            <View style={[styles.sessionCard, morningSlot.status === 'completed' && styles.sessionCardCompleted]}>
              <View style={styles.sessionCardHeader}>
                <View style={styles.sessionCardTitleWrap}>
                  <View style={[styles.sessionIconBox, { backgroundColor: 'rgba(146, 169, 117, 0.12)' }]}>
                    <Sun size={18} color={colors.sageDark} strokeWidth={2} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sessionCardTitle}>Morning Session</Text>
                    <Text style={styles.sessionCardDescriptor}>
                      {morningSlot.workoutTitle || 'Joint fluidity & nervous system calibration'}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={styles.timeScheduleBadge}>
                    <Clock size={11} color={colors.textTertiary} />
                    <Text style={styles.timeScheduleText}>{morningSlot.scheduledTime}</Text>
                  </View>
                  <Pressable
                    onPress={() => handleOpenManageSlot('morning', 'Morning Session')}
                    style={styles.manageSlotBtn}
                    hitSlop={8}
                    accessibilityLabel="Reschedule or skip morning session"
                  >
                    <MoreVertical size={15} color={colors.textTertiary} />
                  </Pressable>
                </View>
              </View>

              {/* Status or Actions */}
              <View style={styles.sessionCardFooter}>
                {morningSlot.status === 'completed' ? (
                  <View style={styles.completedStatusPill}>
                    <CheckCircle2 size={15} color={colors.sageDark} strokeWidth={2.2} />
                    <Text style={styles.completedStatusText}>
                      Completed at {morningSlot.completedAt || '7:15 AM'} • 12 min
                    </Text>
                  </View>
                ) : morningSlot.status === 'skipped' ? (
                  <View style={styles.skippedStatusPill}>
                    <HeartHandshake size={14} color={colors.rose} />
                    <Text style={styles.skippedStatusText}>
                      {morningSlot.skippedReason || 'Resting today — Honoring recovery'}
                    </Text>
                    <Pressable
                      onPress={() => toggleSlotStatus(selectedDay.date, 'morning')}
                      style={styles.undoStatusBtn}
                    >
                      <Text style={styles.undoStatusBtnText}>Undo</Text>
                    </Pressable>
                  </View>
                ) : morningSlot.status === 'rescheduled' ? (
                  <View style={styles.rescheduledStatusPill}>
                    <CalendarClock size={14} color={colors.primaryDark} />
                    <Text style={styles.rescheduledStatusText}>
                      Moved • {morningSlot.rescheduledTo || 'Tomorrow • 7:00 AM'}
                    </Text>
                    <Pressable
                      onPress={() => toggleSlotStatus(selectedDay.date, 'morning')}
                      style={styles.undoStatusBtn}
                    >
                      <Text style={styles.undoStatusBtnText}>Undo</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.actionRow}>
                    <Pressable
                      onPress={() => handleRequestSlotComplete(selectedDay.date, 'morning')}
                      style={styles.sessionActionBtn}
                      accessibilityRole="button"
                    >
                      <Check size={13} color={colors.sageDark} strokeWidth={2.5} />
                      <Text style={styles.sessionActionBtnText}>Mark Morning Done</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            </View>

            {/* 2. MAIN SESSION CARD */}
            <View style={[styles.sessionCard, styles.mainSessionCard, mainSlot.status === 'completed' && styles.sessionCardCompleted]}>
              <View style={styles.sessionCardHeader}>
                <View style={styles.sessionCardTitleWrap}>
                  <View style={[styles.sessionIconBox, { backgroundColor: 'rgba(208, 120, 135, 0.14)' }]}>
                    <Dumbbell size={18} color={colors.primaryDark} strokeWidth={2} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <Text style={styles.sessionCardTitle}>Main Session</Text>
                      <View style={styles.coreWorkoutBadge}>
                        <Text style={styles.coreWorkoutBadgeText}>CORE WORKOUT</Text>
                      </View>
                    </View>
                    <Text style={styles.sessionCardDescriptor}>
                      {mainSlot.workoutTitle || 'Strength, functional movement & bone density stimulus'}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={styles.timeScheduleBadge}>
                    <Clock size={11} color={colors.textTertiary} />
                    <Text style={styles.timeScheduleText}>{mainSlot.scheduledTime}</Text>
                  </View>
                  <Pressable
                    onPress={() => handleOpenManageSlot('main', 'Main Session')}
                    style={styles.manageSlotBtn}
                    hitSlop={8}
                    accessibilityLabel="Reschedule or skip main session"
                  >
                    <MoreVertical size={15} color={colors.textTertiary} />
                  </Pressable>
                </View>
              </View>

              {/* WHY THIS TODAY MICRO-EXPLANATION */}
              <View style={styles.whyThisCallout}>
                <View style={styles.whyThisHeader}>
                  <Sparkles size={12} color={colors.primaryDark} strokeWidth={2.2} />
                  <Text style={styles.whyThisKicker}>WHY THIS TODAY</Text>
                </View>
                <Text style={styles.whyThisBody}>
                  {mainSlot.whyThisToday || 'Chosen for your Lymphatic Flow focus & rising estrogen window — ideal for joint-friendly strength & lean muscle stimulus.'}
                </Text>
              </View>

              {/* Status or Actions */}
              <View style={styles.sessionCardFooter}>
                {mainSlot.status === 'completed' ? (
                  <View style={styles.completedStatusPill}>
                    <CheckCircle2 size={15} color={colors.sageDark} strokeWidth={2.2} />
                    <Text style={styles.completedStatusText}>
                      Completed at {mainSlot.completedAt || '12:45 PM'} • {mainSlot.durationMinutes || 22} min
                    </Text>
                  </View>
                ) : mainSlot.status === 'skipped' ? (
                  <View style={styles.skippedStatusPill}>
                    <HeartHandshake size={14} color={colors.rose} />
                    <Text style={styles.skippedStatusText}>
                      {mainSlot.skippedReason || 'Resting today — Honoring recovery'}
                    </Text>
                    <Pressable
                      onPress={() => toggleSlotStatus(selectedDay.date, 'main')}
                      style={styles.undoStatusBtn}
                    >
                      <Text style={styles.undoStatusBtnText}>Undo</Text>
                    </Pressable>
                  </View>
                ) : mainSlot.status === 'rescheduled' ? (
                  <View style={styles.rescheduledStatusPill}>
                    <CalendarClock size={14} color={colors.primaryDark} />
                    <Text style={styles.rescheduledStatusText}>
                      Moved • {mainSlot.rescheduledTo || 'Tomorrow • 12:30 PM'}
                    </Text>
                    <Pressable
                      onPress={() => toggleSlotStatus(selectedDay.date, 'main')}
                      style={styles.undoStatusBtn}
                    >
                      <Text style={styles.undoStatusBtnText}>Undo</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.mainActionRow}>
                    <Pressable
                      onPress={() => {
                        if (onStartWorkout) {
                          onStartWorkout();
                        } else {
                          handleRequestSlotComplete(selectedDay.date, 'main');
                        }
                      }}
                      style={styles.mainStartBtn}
                      accessibilityRole="button"
                    >
                      <LinearGradient
                        colors={[colors.primary, colors.primaryDark]}
                        style={styles.mainStartGrad}
                      >
                        <Play size={13} color="#FFF" fill="#FFF" />
                        <Text style={styles.mainStartTxt}>START WORKOUT</Text>
                      </LinearGradient>
                    </Pressable>

                    <Pressable
                      onPress={() => handleRequestSlotComplete(selectedDay.date, 'main')}
                      style={styles.mainMarkDoneBtn}
                      accessibilityRole="button"
                    >
                      <Check size={13} color={colors.sageDark} strokeWidth={2.4} />
                      <Text style={styles.mainMarkDoneTxt}>Mark Done</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            </View>

            {/* 3. NIGHT TIME SESSION CARD */}
            <View style={[styles.sessionCard, nightSlot.status === 'completed' && styles.sessionCardCompleted]}>
              <View style={styles.sessionCardHeader}>
                <View style={styles.sessionCardTitleWrap}>
                  <View style={[styles.sessionIconBox, { backgroundColor: 'rgba(225, 161, 136, 0.15)' }]}>
                    <Moon size={18} color={colors.primary} strokeWidth={2} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <Text style={styles.sessionCardTitle}>Night Time Session</Text>
                      <View style={styles.optionalBadge}>
                        <Text style={styles.optionalBadgeText}>OPTIONAL</Text>
                      </View>
                    </View>
                    <Text style={styles.sessionCardDescriptor}>
                      Flexible restorative wind-down • ~20 min suggested
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={styles.timeScheduleBadge}>
                    <Clock size={11} color={colors.textTertiary} />
                    <Text style={styles.timeScheduleText}>{nightSlot.scheduledTime}</Text>
                  </View>
                  <Pressable
                    onPress={() => handleOpenManageSlot('night', 'Night Time Session')}
                    style={styles.manageSlotBtn}
                    hitSlop={8}
                    accessibilityLabel="Reschedule or skip night time session"
                  >
                    <MoreVertical size={15} color={colors.textTertiary} />
                  </Pressable>
                </View>
              </View>

              {/* Activity Chips & Type-In Section */}
              <View style={styles.activitySelectionSection}>
                <Text style={styles.activityPickerLabel}>Choose or type your evening activity (~20 min):</Text>
                <View style={styles.activityChipsGrid}>
                  {NIGHT_ACTIVITIES.map((act) => {
                    const isSelected = selectedNightActivity === act.type;
                    return (
                      <Pressable
                        key={act.type}
                        onPress={() => setSelectedNightActivity(act.type)}
                        style={[
                          styles.activityChip,
                          isSelected && styles.activityChipSelected,
                        ]}
                      >
                        {renderNightActivityIcon(act.type, isSelected ? colors.primaryDark : colors.textTertiary, 14)}
                        <Text style={[styles.activityChipLabel, isSelected && styles.activityChipLabelSelected]}>
                          {act.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* INLINE CUSTOM TYPE-IN FIELD */}
                {selectedNightActivity === 'custom' && (
                  <View style={styles.customActivityInputWrap}>
                    <Text style={styles.customInputLabel}>Type your custom activity:</Text>
                    <TextInput
                      style={styles.customActivityTextInput}
                      placeholder="e.g. Herbal tea & journaling, sound bath, breathwork..."
                      placeholderTextColor={colors.textTertiary}
                      value={customNightInput}
                      onChangeText={setCustomNightInput}
                    />
                  </View>
                )}
              </View>

              {/* Status or Actions */}
              <View style={styles.sessionCardFooter}>
                {nightSlot.status === 'completed' ? (
                  <View style={styles.completedStatusPill}>
                    <CheckCircle2 size={15} color={colors.sageDark} strokeWidth={2.2} />
                    <Text style={styles.completedStatusText}>
                      Logged • {nightSlot.customActivityTitle || NIGHT_ACTIVITIES.find((a) => a.type === (nightSlot.nightActivity || selectedNightActivity))?.label} (~20 min)
                    </Text>
                    <Pressable
                      onPress={() => setNightActivityModalVisible(true)}
                      style={{ marginLeft: 8 }}
                    >
                      <Text style={styles.changeActionText}>Edit</Text>
                    </Pressable>
                  </View>
                ) : nightSlot.status === 'skipped' ? (
                  <View style={styles.skippedStatusPill}>
                    <HeartHandshake size={14} color={colors.rose} />
                    <Text style={styles.skippedStatusText}>
                      {nightSlot.skippedReason || 'Resting tonight — Honoring sleep'}
                    </Text>
                    <Pressable
                      onPress={() => toggleSlotStatus(selectedDay.date, 'night')}
                      style={styles.undoStatusBtn}
                    >
                      <Text style={styles.undoStatusBtnText}>Undo</Text>
                    </Pressable>
                  </View>
                ) : nightSlot.status === 'rescheduled' ? (
                  <View style={styles.rescheduledStatusPill}>
                    <CalendarClock size={14} color={colors.primaryDark} />
                    <Text style={styles.rescheduledStatusText}>
                      Moved • {nightSlot.rescheduledTo || 'Tomorrow • 8:30 PM'}
                    </Text>
                    <Pressable
                      onPress={() => toggleSlotStatus(selectedDay.date, 'night')}
                      style={styles.undoStatusBtn}
                    >
                      <Text style={styles.undoStatusBtnText}>Undo</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    onPress={handleSaveNightActivity}
                    style={styles.sessionActionBtn}
                    accessibilityRole="button"
                  >
                    <Sparkles size={13} color={colors.rose} />
                    <Text style={[styles.sessionActionBtnText, { color: colors.primaryDark }]}>
                      {selectedNightActivity === 'custom' && customNightInput.trim()
                        ? `Log "${customNightInput.trim()}" (~20 min)`
                        : 'Log Night Time Session (~20 min)'}
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          </View>
        )}
      </View>

      {/* ── SECTION 3: CYCLE / PHASE CARD — GLASSMORPHISM ORB ── */}
      <View style={styles.section}>
        <View style={styles.cycleGlassCard}>
          {/* Frosted glow behind */}
          <View style={styles.cycleGlassGlow} pointerEvents="none" />

          {cycleData.optedIn ? (
            <>
              {/* Top row kicker + Adjust */}
              <View style={styles.cycleCardTopRow}>
                <View style={styles.kickerRow}>
                  <View style={styles.activeDot} />
                  <Text style={styles.cycleKicker}>YOUR CYCLE</Text>
                </View>
                <Pressable
                  onPress={() => setCycleSetupVisible(true)}
                  style={styles.heroSettingBtn}
                  hitSlop={8}
                  accessibilityLabel="Edit cycle parameters"
                >
                  <Sliders size={13} color={colors.primaryDark} strokeWidth={2} />
                  <Text style={styles.cycleAdjustText}>Adjust</Text>
                </Pressable>
              </View>

              {/* Glassmorphism Phase Orb */}
              <View style={styles.cycleOrbContainer}>
                <View style={styles.cycleOrbOuter}>
                  <LinearGradient
                    colors={['rgba(208,120,135,0.62)', 'rgba(156,66,82,0.38)']}
                    style={styles.cycleOrbInner}
                  >
                    <Text style={styles.cycleOrbPhase}>
                      {(cycleData.currentPhase || 'Follicular Phase').replace(' Phase', '')}
                    </Text>
                    <Text style={styles.cycleOrbPhaseWord}>Phase</Text>
                    <View style={styles.cycleOrbDivider} />
                    <Text style={styles.cycleOrbDay}>Day {cycleData.cycleDay || 6}</Text>
                  </LinearGradient>
                </View>
              </View>

              {/* Outside the orb — guidance text */}
              <Text style={styles.cycleGlassHeadline}>
                {cycleData.guidanceHeadline}
              </Text>

              <View style={styles.cycleGlassFooter}>
                <Sparkles size={12} color={colors.primaryDark} strokeWidth={2} />
                <Text style={styles.cycleGlassFooterText}>
                  Your movement pace naturally adapts to your hormonal rhythm.
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.optOutContainer}>
              <View style={styles.optOutIconBadge}>
                <Flower2 size={20} color={colors.primary} strokeWidth={1.8} />
              </View>

              <Text style={styles.optOutTitle}>Want more precise guidance?</Text>
              <Text style={styles.optOutSubtitle}>
                Add your cycle or hormonal stage to unlock adaptive pacing and recovery windows. Completely optional.
              </Text>

              <Pressable
                onPress={() => setCycleSetupVisible(true)}
                style={styles.optInBtn}
                accessibilityRole="button"
                accessibilityLabel="Enable cycle awareness"
              >
                <Text style={styles.optInBtnText}>Enable Cycle Awareness</Text>
                <ChevronRight size={14} color="#FFF" strokeWidth={2.5} />
              </Pressable>
            </View>
          )}
        </View>
      </View>

      {/* ── SECTION 4: THIS WEEK'S PLAN (ZOOMED-OUT OVERVIEW) ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionKicker}>THIS WEEK'S PLAN</Text>
          
          <View style={styles.themePillBadge}>
            <Sparkles size={11} color={colors.primaryDark} strokeWidth={2} />
            <Text style={styles.themePillText}>
              {weeklyTheme.themeTitle} • Week {weeklyTheme.weekNumber} of {weeklyTheme.totalWeeks}
            </Text>
          </View>
        </View>

        <View style={styles.planCard}>
          {weekDays.map((day, idx) => {
            const morningSlotDone = day.slots.morning.status === 'completed';
            const mainSlotDone = day.slots.main.status === 'completed';
            const nightSlotDone = day.slots.night.status === 'completed';
            const isDayRest = day.isRestDay;

            return (
              <Pressable
                key={day.date}
                onPress={() => setSelectedDayDate(day.date)}
                style={[
                  styles.planRow,
                  idx < weekDays.length - 1 && styles.planRowDivider,
                  day.isToday && styles.planRowToday,
                  day.date === selectedDayDate && styles.planRowSelected,
                ]}
              >
                {/* Day label & date */}
                <View style={styles.planDayInfo}>
                  <View style={styles.planDayNameRow}>
                    <Text style={[styles.planDayName, day.isToday && styles.planDayNameToday]}>
                      {day.fullDayName}
                    </Text>
                    {day.isToday && (
                      <View style={styles.todayPill}>
                        <Text style={styles.todayPillText}>Today</Text>
                      </View>
                    )}
                    {isDayRest && (
                      <View style={styles.restPillMini}>
                        <Text style={styles.restPillMiniText}>Rest Day</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.planDayDate}>
                    {day.dayLabel} • {day.dayNumber}
                  </Text>
                </View>

                {/* 3 Compact status slot indicators (Morning, Main, Night) */}
                <View style={styles.planSlotsRow}>
                  {/* Morning Session Indicator */}
                  <View
                    style={[
                      styles.planSlotIndicator,
                      morningSlotDone ? styles.planSlotDone : styles.planSlotPending,
                    ]}
                  >
                    {morningSlotDone ? (
                      <Check size={11} color="#FFFFFF" strokeWidth={3} />
                    ) : (
                      <Sun size={10} color={colors.textTertiary} strokeWidth={2} />
                    )}
                  </View>

                  {/* Main Session Indicator */}
                  <View
                    style={[
                      styles.planSlotIndicator,
                      mainSlotDone ? styles.planSlotDone : styles.planSlotPending,
                    ]}
                  >
                    {mainSlotDone ? (
                      <Check size={11} color="#FFFFFF" strokeWidth={3} />
                    ) : (
                      <Dumbbell size={10} color={colors.textTertiary} strokeWidth={2} />
                    )}
                  </View>

                  {/* Night Time Session Indicator */}
                  <View
                    style={[
                      styles.planSlotIndicator,
                      nightSlotDone ? styles.planSlotDone : styles.planSlotPending,
                    ]}
                  >
                    {nightSlotDone ? (
                      <Check size={11} color="#FFFFFF" strokeWidth={3} />
                    ) : (
                      <Moon size={10} color={colors.textTertiary} strokeWidth={2} />
                    )}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ── SECTION 5: RESET TIMING PREFERENCES (UTILITY LIST) ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionKicker}>RESET TIMING PREFERENCES</Text>
          <View style={styles.utilityBadge}>
            <Bell size={11} color={colors.textTertiary} />
            <Text style={styles.utilityBadgeText}>Reminders</Text>
          </View>
        </View>

        <View style={styles.timingListCard}>
          {timingPreferences.map((pref, idx) => (
            <View
              key={pref.slot}
              style={[
                styles.timingRow,
                idx < timingPreferences.length - 1 && styles.timingRowDivider,
              ]}
            >
              <View style={styles.timingLeft}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <Text style={styles.timingLabel}>{pref.label}</Text>
                  {pref.isOptional && (
                    <View style={styles.optionalMiniBadge}>
                      <Text style={styles.optionalMiniBadgeText}>OPTIONAL</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.timingSublabel}>{pref.sublabel}</Text>
              </View>

              <View style={styles.timingRight}>
                <Pressable
                  onPress={() => setActiveEditingSlot(pref)}
                  style={styles.timePill}
                  accessibilityRole="button"
                  accessibilityLabel={`Adjust ${pref.label} reminder time: currently ${pref.reminderTime}`}
                >
                  <Clock size={11} color={colors.primaryDark} strokeWidth={2} />
                  <Text style={styles.timePillText}>{pref.reminderTime}</Text>
                </Pressable>

                <Switch
                  value={pref.reminderEnabled}
                  onValueChange={(val) => {
                    updateTimingPreference(pref.slot, pref.reminderTime, val);
                    try {
                      if (Platform.OS !== 'web') {
                        Haptics.selectionAsync();
                      }
                    } catch (_) {}
                  }}
                  trackColor={{ false: 'rgba(101, 78, 60, 0.18)', true: colors.primary }}
                  thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
                  ios_backgroundColor="rgba(101, 78, 60, 0.18)"
                />
              </View>
            </View>
          ))}
        </View>
      </View>
      </ScrollView>

      {/* ── TIME ADJUSTMENT MODAL ── */}
      <Modal
        visible={!!activeEditingSlot}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveEditingSlot(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setActiveEditingSlot(null)}
        >
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalKicker}>SET REMINDER TIME</Text>
                <Text style={styles.modalTitle}>{activeEditingSlot?.label}</Text>
              </View>
              <Pressable
                onPress={() => setActiveEditingSlot(null)}
                style={styles.modalCloseBtn}
                hitSlop={8}
              >
                <X size={18} color={colors.textPrimary} />
              </Pressable>
            </View>

            <Text style={styles.modalSubtitle}>
              Choose the scheduled time that best supports your circadian rhythm:
            </Text>

            <View style={styles.timeGrid}>
              {AVAILABLE_TIMES.map((timeStr) => {
                const isSelected = activeEditingSlot?.reminderTime === timeStr;
                return (
                  <Pressable
                    key={timeStr}
                    onPress={() => handleTimeSelect(timeStr)}
                    style={[
                      styles.timeGridItem,
                      isSelected && styles.timeGridItemSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.timeGridText,
                        isSelected && styles.timeGridTextSelected,
                      ]}
                    >
                      {timeStr}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── NIGHT TIME ACTIVITY PICKER MODAL ── */}
      <Modal
        visible={nightActivityModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNightActivityModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setNightActivityModalVisible(false)}
        >
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalKicker}>NIGHT TIME SESSION</Text>
                <Text style={styles.modalTitle}>Choose Wind-Down Activity</Text>
              </View>
              <Pressable
                onPress={() => setNightActivityModalVisible(false)}
                style={styles.modalCloseBtn}
                hitSlop={8}
              >
                <X size={18} color={colors.textPrimary} />
              </Pressable>
            </View>

            <Text style={styles.modalSubtitle}>
              Night time movement is flexible and restful. Minimum suggested duration is ~20 minutes to transition smoothly into restorative sleep.
            </Text>

            <View style={styles.nightModalList}>
              {NIGHT_ACTIVITIES.map((act) => {
                const isSelected = selectedNightActivity === act.type;
                return (
                  <Pressable
                    key={act.type}
                    onPress={() => setSelectedNightActivity(act.type)}
                    style={[
                      styles.nightModalItem,
                      isSelected && styles.nightModalItemSelected,
                    ]}
                  >
                    <View style={[styles.nightModalIcon, { backgroundColor: isSelected ? colors.primary : 'rgba(101,78,60,0.08)' }]}>
                      {renderNightActivityIcon(act.type, isSelected ? '#FFF' : colors.textPrimary, 18)}
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={styles.nightModalItemTitle}>{act.label}</Text>
                        <Text style={styles.nightModalItemDuration}>{act.suggestedDuration}</Text>
                      </View>
                      <Text style={styles.nightModalItemDesc}>{act.sublabel}</Text>
                    </View>
                    <View style={{ width: 22, alignItems: 'center' }}>
                      {isSelected ? (
                        <CheckCircle2 size={20} color={colors.primary} />
                      ) : (
                        <Circle size={20} color={colors.borderMedium} />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {selectedNightActivity === 'custom' && (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.customInputLabel}>Type your custom activity:</Text>
                <TextInput
                  style={styles.customActivityTextInput}
                  placeholder="e.g. Herbal tea & journaling, sound bath, breathwork..."
                  placeholderTextColor={colors.textTertiary}
                  value={customNightInput}
                  onChangeText={setCustomNightInput}
                />
              </View>
            )}

            <Pressable
              onPress={handleSaveNightActivity}
              style={styles.nightModalSaveBtn}
              accessibilityRole="button"
            >
              <Text style={styles.nightModalSaveBtnText}>
                {selectedNightActivity === 'custom' && customNightInput.trim()
                  ? `Log "${customNightInput.trim()}" (~20 min)`
                  : 'Log Night Time Session (~20 min)'}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── SKIP / RESCHEDULE MANAGEMENT MODAL ── */}
      <Modal
        visible={manageSlotModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setManageSlotModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setManageSlotModalVisible(false)}
        >
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalKicker}>ADAPT YOUR SCHEDULE</Text>
                <Text style={styles.modalTitle}>{slotToManage?.label}</Text>
              </View>
              <Pressable
                onPress={() => setManageSlotModalVisible(false)}
                style={styles.modalCloseBtn}
                hitSlop={8}
              >
                <X size={18} color={colors.textPrimary} />
              </Pressable>
            </View>

            <Text style={styles.modalSubtitle}>
              Honor what your body needs today. There is zero penalty or guilt for adapting your routine.
            </Text>

            <View style={styles.manageOptionsList}>
              {/* Option 1: Skip & Honor Recovery */}
              <Pressable
                onPress={handleExecuteSkip}
                style={styles.manageOptionCard}
              >
                <View style={[styles.manageOptionIcon, { backgroundColor: 'rgba(146, 169, 117, 0.12)' }]}>
                  <HeartHandshake size={20} color={colors.sageDark} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.manageOptionTitle}>Skip Today (Honor Recovery)</Text>
                  <Text style={styles.manageOptionDesc}>
                    Take this slot off. Recovery is an active part of hormone balance.
                  </Text>
                </View>
              </Pressable>

              {/* Option 2: Reschedule */}
              <Pressable
                onPress={handleExecuteReschedule}
                style={styles.manageOptionCard}
              >
                <View style={[styles.manageOptionIcon, { backgroundColor: 'rgba(208, 120, 135, 0.14)' }]}>
                  <CalendarClock size={20} color={colors.primaryDark} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.manageOptionTitle}>Reschedule to Tomorrow</Text>
                  <Text style={styles.manageOptionDesc}>
                    Shift this session to tomorrow without breaking your consistency rhythm.
                  </Text>
                </View>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── CYCLE DETAILS MODAL ── */}
      <Modal
        visible={cycleModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCycleModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setCycleModalVisible(false)}
        >
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalKicker}>CYCLE & HORMONAL PHASE</Text>
                <Text style={styles.modalTitle}>Adaptive Pacing</Text>
              </View>
              <Pressable
                onPress={() => setCycleModalVisible(false)}
                style={styles.modalCloseBtn}
                hitSlop={8}
              >
                <X size={18} color={colors.textPrimary} />
              </Pressable>
            </View>

            <View style={styles.cycleInfoCard}>
              <Text style={styles.cycleInfoHeadline}>{cycleData.guidanceHeadline}</Text>
              <Text style={styles.cycleInfoBody}>{cycleData.guidanceBody}</Text>
            </View>

            <View style={styles.cycleToggleRow}>
              <Text style={styles.cycleToggleLabel}>Enable cycle-aware movement guidance</Text>
              <Switch
                value={cycleData.optedIn}
                onValueChange={(val) => toggleCycleOptIn(val)}
                trackColor={{ false: 'rgba(101, 78, 60, 0.18)', true: colors.primary }}
                thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
                ios_backgroundColor="rgba(101, 78, 60, 0.18)"
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── CYCLE SETUP 3-STEP FLOW ── */}
      <CycleSetupSheet
        visible={cycleSetupVisible}
        initialStartDate={cycleData.cycleStartDate}
        initialCycleLength={cycleData.cycleLengthDays}
        onConfirm={(startDate, length) => updateCycleStart(startDate, length)}
        onDismiss={() => setCycleSetupVisible(false)}
      />

      {/* ── SESSION CLASSIFICATION MODAL ── */}
      <SessionClassificationModal
        visible={confirmModalVisible}
        initialSlot={pendingConfirmInitialSlot}
        onConfirm={handleConfirmSlotClassification}
        onCancel={() => setConfirmModalVisible(false)}
      />

      {/* ── ERROR TOAST ── */}
      <ErrorToast
        visible={errorToastVisible}
        variant={errorToastVariant}
        onDismiss={() => setErrorToastVisible(false)}
        onRetry={() => setErrorToastVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 110,
  },

  // ── HEADER ──
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.rose,
  },
  headerKicker: {
    fontSize: 10,
    fontFamily: fontFamilies.monoBold,
    letterSpacing: 2,
    color: colors.textTertiary,
    textTransform: 'uppercase',
  },
  headline: {
    fontSize: 28,
    fontFamily: fontFamilies.soria,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    lineHeight: 34,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  // ── SECTION ──
  section: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionKicker: {
    fontSize: 10,
    fontFamily: fontFamilies.monoBold,
    letterSpacing: 1.8,
    color: colors.textTertiary,
    textTransform: 'uppercase',
  },
  todayDateBadge: {
    backgroundColor: colors.peachSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.peachBorder,
  },
  todayDateText: {
    fontSize: 10,
    fontFamily: fontFamilies.monoBold,
    color: colors.primaryDark,
  },
  backToTodayBtn: {
    backgroundColor: colors.roseSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  backToTodayText: {
    fontSize: 10,
    fontFamily: fontFamilies.monoBold,
    color: colors.primaryDark,
  },
  restDayToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceCard,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  restDayToggleBtnActive: {
    backgroundColor: colors.sageDark,
    borderColor: colors.sageDark,
  },
  restDayToggleText: {
    fontSize: 10,
    fontFamily: fontFamilies.sansMedium,
    color: colors.textSecondary,
  },
  restDayToggleTextActive: {
    color: '#FFF',
    fontFamily: fontFamilies.sansBold,
  },

  // ── 1. WEEK STRIP CARD ──
  weekStripCard: {
    backgroundColor: colors.surfaceCard,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#2A2320',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: { elevation: 2 },
    }),
  },
  weekStripHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  weekStripSubtitle: {
    fontSize: 11.5,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textTertiary,
    marginTop: 2,
  },
  weeklyCountBadge: {
    backgroundColor: 'rgba(146, 169, 117, 0.14)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.sageBorder,
  },
  weeklyCountText: {
    fontSize: 10.5,
    fontFamily: fontFamilies.monoBold,
    color: colors.sageDark,
  },
  daysStripRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dayStripCol: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    position: 'relative',
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dayStripColSelected: {
    backgroundColor: colors.surfaceCardSelected,
    borderColor: colors.rose,
  },
  dayStripColToday: {
    backgroundColor: 'rgba(208, 120, 135, 0.08)',
  },
  todayOuterRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.rose,
    opacity: 0.9,
  },
  dayStripLabel: {
    fontSize: 9,
    fontFamily: fontFamilies.monoBold,
    color: colors.textTertiary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  dayStripLabelToday: {
    color: colors.primaryDark,
    fontFamily: fontFamilies.monoBold,
  },
  dayStripLabelSelected: {
    color: colors.textPrimary,
  },
  dayStripNumber: {
    fontSize: 15,
    fontFamily: fontFamilies.sansBold,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  dayStripNumberToday: {
    color: colors.primaryDark,
  },
  dayStripNumberSelected: {
    color: colors.textPrimary,
  },

  statusDotsContainer: {
    gap: 4,
    alignItems: 'center',
  },
  slotDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  slotDotCompleted: {
    backgroundColor: colors.sage,
  },
  slotDotPlanned: {
    borderWidth: 1,
    borderColor: colors.borderMedium,
    backgroundColor: 'transparent',
  },
  slotDotSkipped: {
    backgroundColor: colors.roseSoft,
    borderWidth: 1,
    borderColor: colors.peachBorder,
  },
  slotDotRest: {
    backgroundColor: colors.peachSoft,
  },

  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    marginBottom: 0,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendTodayRing: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.rose,
  },
  legendText: {
    fontSize: 10.5,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textTertiary,
  },

  // ── REST DAY CARD ──
  restDayCard: {
    backgroundColor: '#F9F5EF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(146, 169, 117, 0.3)',
    position: 'relative',
    overflow: 'hidden',
  },
  restCardGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(146, 169, 117, 0.12)',
  },
  restCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  restIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(146, 169, 117, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  restCardTitle: {
    fontSize: 16,
    fontFamily: fontFamilies.soria,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  restCardSubtitle: {
    fontSize: 11.5,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textSecondary,
    marginTop: 2,
  },
  restCardBody: {
    fontSize: 13,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textSecondary,
    lineHeight: 19,
    marginBottom: 16,
  },
  restCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(101, 78, 60, 0.08)',
  },
  restCardActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  restCardActionBtnText: {
    fontSize: 11.5,
    fontFamily: fontFamilies.sansMedium,
    color: colors.textSecondary,
  },
  restCardStartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryDark,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  restCardStartBtnText: {
    fontSize: 11.5,
    fontFamily: fontFamilies.monoBold,
    color: '#FFF',
  },

  // ── 2. TODAY'S SESSION CARDS ──
  sessionCardsContainer: {
    gap: 14,
  },
  sessionCard: {
    backgroundColor: colors.surfaceCard,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#2A2320',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: { elevation: 1.5 },
    }),
  },
  mainSessionCard: {
    borderColor: colors.peachBorder,
    backgroundColor: '#FAF6F0',
  },
  sessionCardCompleted: {
    borderColor: colors.sageBorder,
    backgroundColor: 'rgba(146, 169, 117, 0.04)',
  },
  sessionCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sessionCardTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  sessionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionCardTitle: {
    fontSize: 15,
    fontFamily: fontFamilies.soria,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  coreWorkoutBadge: {
    backgroundColor: 'rgba(208, 120, 135, 0.16)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  coreWorkoutBadgeText: {
    fontSize: 8.5,
    fontFamily: fontFamilies.monoBold,
    color: colors.primaryDark,
    letterSpacing: 0.5,
  },
  optionalBadge: {
    backgroundColor: 'rgba(101, 78, 60, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  optionalBadgeText: {
    fontSize: 8.5,
    fontFamily: fontFamilies.monoBold,
    color: colors.textTertiary,
    letterSpacing: 0.5,
  },
  sessionCardDescriptor: {
    fontSize: 11.5,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  timeScheduleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  timeScheduleText: {
    fontSize: 10.5,
    fontFamily: fontFamilies.monoBold,
    color: colors.textSecondary,
  },
  manageSlotBtn: {
    padding: 4,
  },

  // WHY THIS TODAY CALLOUT
  whyThisCallout: {
    backgroundColor: 'rgba(208, 120, 135, 0.07)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  whyThisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  whyThisKicker: {
    fontSize: 9.5,
    fontFamily: fontFamilies.monoBold,
    letterSpacing: 1.2,
    color: colors.primaryDark,
  },
  whyThisBody: {
    fontSize: 11.5,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textSecondary,
    lineHeight: 16,
  },

  // Night Activity selection
  activitySelectionSection: {
    marginTop: 4,
    marginBottom: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  activityPickerLabel: {
    fontSize: 11,
    fontFamily: fontFamilies.sansMedium,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  activityChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  activityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  activityChipSelected: {
    backgroundColor: 'rgba(208, 120, 135, 0.12)',
    borderColor: colors.primaryDark,
  },
  activityChipLabel: {
    fontSize: 11,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textSecondary,
  },
  activityChipLabelSelected: {
    color: colors.primaryDark,
    fontFamily: fontFamilies.sansSemiBold,
  },
  customActivityInputWrap: {
    marginTop: 10,
  },
  customInputLabel: {
    fontSize: 11,
    fontFamily: fontFamilies.sansMedium,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  customActivityTextInput: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.primary,
  },

  // Card Footer & Actions
  sessionCardFooter: {
    paddingTop: 8,
  },
  completedStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(146, 169, 117, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.sageBorder,
  },
  completedStatusText: {
    fontSize: 11.5,
    fontFamily: fontFamilies.monoBold,
    color: colors.sageDark,
    flex: 1,
  },
  changeActionText: {
    fontSize: 11,
    fontFamily: fontFamilies.monoBold,
    color: colors.primaryDark,
    textDecorationLine: 'underline',
  },
  skippedStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.roseSoft,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.peachBorder,
  },
  skippedStatusText: {
    fontSize: 11.5,
    fontFamily: fontFamilies.sansMedium,
    color: colors.rose,
    flex: 1,
  },
  rescheduledStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.peachSoft,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.peachBorder,
  },
  rescheduledStatusText: {
    fontSize: 11.5,
    fontFamily: fontFamilies.sansMedium,
    color: colors.primaryDark,
    flex: 1,
  },
  undoStatusBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  undoStatusBtnText: {
    fontSize: 11,
    fontFamily: fontFamilies.monoBold,
    color: colors.primaryDark,
    textDecorationLine: 'underline',
  },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  sessionActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderMedium,
  },
  sessionActionBtnText: {
    fontSize: 11.5,
    fontFamily: fontFamilies.sansSemiBold,
    color: colors.textPrimary,
  },
  mainActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mainStartBtn: {
    flex: 1.4,
    borderRadius: 10,
    overflow: 'hidden',
  },
  mainStartGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  mainStartTxt: {
    fontSize: 11.5,
    fontFamily: fontFamilies.monoBold,
    color: '#FFF',
    letterSpacing: 0.6,
  },
  mainMarkDoneBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: colors.surface,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.sageBorder,
  },
  mainMarkDoneTxt: {
    fontSize: 11.5,
    fontFamily: fontFamilies.sansSemiBold,
    color: colors.sageDark,
  },

  // ── 3. HERO DARK CARD ──
  heroDarkCard: {
    backgroundColor: colors.heroCard,
    borderRadius: 22,
    padding: 22,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 14,
      },
      android: { elevation: 4 },
    }),
  },
  heroGlowOverlay: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.heroCardGlow,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  phaseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  phaseIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.rose,
  },
  phaseBadgeText: {
    fontSize: 10.5,
    fontFamily: fontFamilies.monoBold,
    color: colors.textOnDark,
    letterSpacing: 0.5,
  },
  heroSettingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
  },
  heroSettingBtnText: {
    fontSize: 10,
    fontFamily: fontFamilies.monoRegular,
    color: colors.textOnDarkMuted,
  },
  heroHeadline: {
    fontSize: 18,
    fontFamily: fontFamilies.soria,
    fontWeight: '700',
    color: colors.textOnDark,
    lineHeight: 24,
    marginBottom: 8,
  },
  heroBody: {
    fontSize: 13,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textOnDarkMuted,
    lineHeight: 19,
    marginBottom: 16,
  },
  heroFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  heroFooterText: {
    fontSize: 11,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textOnDarkMuted,
    flex: 1,
  },

  // Opt-out state
  optOutContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  optOutIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  optOutTitle: {
    fontSize: 16,
    fontFamily: fontFamilies.soria,
    fontWeight: '700',
    color: colors.textOnDark,
    marginBottom: 6,
  },
  optOutSubtitle: {
    fontSize: 12.5,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textOnDarkMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  optInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.peach,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
  },
  optInBtnText: {
    fontSize: 12,
    fontFamily: fontFamilies.monoBold,
    color: '#3A3532',
    letterSpacing: 0.5,
  },

  // ── 4. THIS WEEK'S PLAN ──
  themePillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.roseSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  themePillText: {
    fontSize: 10,
    fontFamily: fontFamilies.monoBold,
    color: colors.primaryDark,
  },
  planCard: {
    backgroundColor: colors.surfaceCard,
    borderRadius: 18,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderRadius: 10,
    paddingHorizontal: 6,
  },
  planRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  planRowToday: {
    backgroundColor: 'rgba(208, 120, 135, 0.05)',
  },
  planRowSelected: {
    backgroundColor: colors.roseSoft,
  },
  planDayInfo: {
    flex: 1,
  },
  planDayNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  planDayName: {
    fontSize: 13,
    fontFamily: fontFamilies.sansSemiBold,
    color: colors.textPrimary,
  },
  planDayNameToday: {
    color: colors.primaryDark,
    fontFamily: fontFamilies.sansBold,
  },
  todayPill: {
    backgroundColor: colors.primaryDark,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  todayPillText: {
    fontSize: 8.5,
    fontFamily: fontFamilies.monoBold,
    color: '#FFF',
  },
  restPillMini: {
    backgroundColor: colors.sageDark,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  restPillMiniText: {
    fontSize: 8.5,
    fontFamily: fontFamilies.monoBold,
    color: '#FFF',
  },
  planDayDate: {
    fontSize: 10.5,
    fontFamily: fontFamilies.monoRegular,
    color: colors.textTertiary,
    marginTop: 1,
  },
  planSlotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  planSlotIndicator: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planSlotDone: {
    backgroundColor: colors.sage,
  },
  planSlotPending: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderMedium,
  },

  // ── 5. TIMING PREFERENCES ──
  utilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  utilityBadgeText: {
    fontSize: 10,
    fontFamily: fontFamilies.monoRegular,
    color: colors.textTertiary,
  },
  timingListCard: {
    backgroundColor: colors.surfaceCard,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  timingRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  timingLeft: {
    flex: 1,
    paddingRight: 10,
  },
  timingLabel: {
    fontSize: 13.5,
    fontFamily: fontFamilies.sansSemiBold,
    color: colors.textPrimary,
  },
  optionalMiniBadge: {
    backgroundColor: 'rgba(101, 78, 60, 0.08)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  optionalMiniBadgeText: {
    fontSize: 8,
    fontFamily: fontFamilies.monoBold,
    color: colors.textTertiary,
  },
  timingSublabel: {
    fontSize: 11,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textTertiary,
    lineHeight: 15,
  },
  timingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderMedium,
  },
  timePillText: {
    fontSize: 11.5,
    fontFamily: fontFamilies.monoBold,
    color: colors.primaryDark,
  },

  // ── MODALS ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(42, 35, 32, 0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalKicker: {
    fontSize: 10,
    fontFamily: fontFamilies.monoBold,
    letterSpacing: 1.5,
    color: colors.textTertiary,
    textTransform: 'uppercase',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: fontFamilies.soria,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 12.5,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeGridItem: {
    width: (SCREEN_W - 44 - 16) / 3,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
  },
  timeGridItemSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timeGridText: {
    fontSize: 12,
    fontFamily: fontFamilies.monoMedium,
    color: colors.textPrimary,
  },
  timeGridTextSelected: {
    color: '#FFFFFF',
    fontFamily: fontFamilies.monoBold,
  },

  // Night modal
  nightModalList: {
    gap: 8,
    marginBottom: 14,
  },
  nightModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surfaceCard,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  nightModalItemSelected: {
    borderColor: colors.primaryDark,
    backgroundColor: colors.roseSoft,
  },
  nightModalIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nightModalItemTitle: {
    fontSize: 13,
    fontFamily: fontFamilies.sansSemiBold,
    color: colors.textPrimary,
  },
  nightModalItemDuration: {
    fontSize: 10.5,
    fontFamily: fontFamilies.monoRegular,
    color: colors.textTertiary,
  },
  nightModalItemDesc: {
    fontSize: 11,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textSecondary,
    marginTop: 2,
  },
  nightModalSaveBtn: {
    backgroundColor: colors.primaryDark,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  nightModalSaveBtnText: {
    fontSize: 13,
    fontFamily: fontFamilies.monoBold,
    color: '#FFF',
    letterSpacing: 0.5,
  },

  // Manage options modal
  manageOptionsList: {
    gap: 10,
    marginBottom: 10,
  },
  manageOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surfaceCard,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  manageOptionIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manageOptionTitle: {
    fontSize: 14,
    fontFamily: fontFamilies.sansSemiBold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  manageOptionDesc: {
    fontSize: 11.5,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textSecondary,
    lineHeight: 16,
  },

  // Cycle Modal
  cycleInfoCard: {
    backgroundColor: colors.surfaceCard,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  cycleInfoHeadline: {
    fontSize: 14,
    fontFamily: fontFamilies.sansBold,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  cycleInfoBody: {
    fontSize: 12.5,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  cycleToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  cycleToggleLabel: {
    fontSize: 13,
    fontFamily: fontFamilies.sansMedium,
    color: colors.textPrimary,
    flex: 1,
    marginRight: 10,
  },

  // ── GLASSMORPHISM CYCLE CARD & ORB ──
  cycleGlassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(208, 120, 135, 0.35)',
    padding: 20,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  cycleGlassGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(208, 120, 135, 0.18)',
  },
  cycleCardTopRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  cycleKicker: {
    fontSize: 10,
    fontFamily: fontFamilies.monoBold,
    letterSpacing: 1.8,
    color: colors.primaryDark,
  },
  cycleAdjustText: {
    fontSize: 11.5,
    fontFamily: fontFamilies.monoBold,
    color: colors.primaryDark,
    marginLeft: 4,
  },
  cycleOrbContainer: {
    marginVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cycleOrbOuter: {
    width: 154,
    height: 154,
    borderRadius: 77,
    padding: 5,
    borderWidth: 2,
    borderColor: 'rgba(208, 120, 135, 0.55)',
    backgroundColor: 'rgba(208, 120, 135, 0.08)',
  },
  cycleOrbInner: {
    flex: 1,
    borderRadius: 72,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  cycleOrbPhase: {
    fontSize: 18,
    fontFamily: fontFamilies.sansBold,
    color: '#FFFFFF',
    letterSpacing: -0.2,
    textAlign: 'center',
    lineHeight: 22,
  },
  cycleOrbPhaseWord: {
    fontSize: 11,
    fontFamily: fontFamilies.sansRegular,
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 1,
  },
  cycleOrbDivider: {
    width: 28,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    marginVertical: 4,
  },
  cycleOrbDay: {
    fontSize: 13,
    fontFamily: fontFamilies.sansSemiBold,
    color: '#FFFFFF',
  },
  cycleGlassHeadline: {
    fontSize: 15,
    fontFamily: fontFamilies.sansSemiBold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 12,
    lineHeight: 21,
    paddingHorizontal: 8,
  },
  cycleGlassFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(208, 120, 135, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(208, 120, 135, 0.18)',
    width: '100%',
  },
  cycleGlassFooterText: {
    fontSize: 11.5,
    fontFamily: fontFamilies.sansRegular,
    color: colors.primaryDark,
    textAlign: 'center',
    flex: 1,
  },
});
