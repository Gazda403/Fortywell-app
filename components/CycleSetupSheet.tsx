/**
 * CycleSetupSheet — 3-step cycle tracking input flow.
 * Step 1: Pick cycle start date (simple mini calendar grid)
 * Step 2: Set cycle length (21–35 days, stepper)
 * Step 3: Confirm — shows live phase preview
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Pressable,
  Animated,
  Dimensions,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Flower2,
  Sparkles,
  X,
  Minus,
  Plus,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { fontFamilies } from '../theme/typography';
import { CyclePhase } from '../types/rhythm';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface CycleSetupSheetProps {
  visible: boolean;
  initialStartDate?: string; // YYYY-MM-DD
  initialCycleLength?: number;
  onConfirm: (startDate: string, cycleLengthDays: number) => void;
  onDismiss: () => void;
}

function getISODateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function calculatePhasePreview(startDateStr: string, cycleLength: number): {
  phase: CyclePhase;
  day: number;
  headline: string;
} {
  const start = new Date(startDateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const day = (diff % cycleLength) + 1;

  if (day <= 5) return { phase: 'Menstrual Phase', day, headline: 'Gentle restoration — prioritize joint mobility and ease.' };
  if (day <= 13) return { phase: 'Follicular Phase', day, headline: 'Energy building — good window for strength work.' };
  if (day <= 17) return { phase: 'Ovulatory Phase', day, headline: 'Peak stamina — great time for purposeful cadence.' };
  return { phase: 'Luteal Phase', day, headline: 'Steady pacing — emphasize nervous system downshift.' };
}

const PHASE_COLORS: Record<CyclePhase, string> = {
  'Menstrual Phase': 'rgba(201, 99, 116, 0.55)',
  'Follicular Phase': 'rgba(146, 169, 117, 0.55)',
  'Ovulatory Phase': 'rgba(208, 160, 64, 0.55)',
  'Luteal Phase': 'rgba(175, 130, 90, 0.55)',
  'Gentle Rhythm': 'rgba(175, 130, 90, 0.45)',
};

const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const CycleSetupSheet: React.FC<CycleSetupSheetProps> = ({
  visible,
  initialStartDate,
  initialCycleLength = 28,
  onConfirm,
  onDismiss,
}) => {
  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const today = new Date();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 — date selection
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string>(
    initialStartDate || getISODateString(today)
  );

  // Step 2 — cycle length
  const [cycleLength, setCycleLength] = useState(initialCycleLength);

  useEffect(() => {
    if (visible) {
      setStep(1);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 240, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, damping: 22, stiffness: 180, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: SCREEN_H, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const haptic = () => {
    try {
      if (Platform.OS !== 'web') Haptics.selectionAsync();
    } catch (_) {}
  };

  // Build calendar grid for current month
  function buildCalendarDays() {
    const firstDay = new Date(calendarYear, calendarMonth, 1);
    // Monday-first grid: getDay() 0=Sun → offset
    const startOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }

  const calendarDays = buildCalendarDays();

  const handleDaySelect = (day: number) => {
    haptic();
    const d = new Date(calendarYear, calendarMonth, day);
    if (d > today) return; // Can't pick future date
    setSelectedDate(getISODateString(d));
  };

  const navMonth = (dir: 1 | -1) => {
    haptic();
    let m = calendarMonth + dir;
    let y = calendarYear;
    if (m > 11) { m = 0; y++; }
    if (m < 0) { m = 11; y--; }
    // Don't go into future months
    const candidate = new Date(y, m, 1);
    if (candidate > new Date(today.getFullYear(), today.getMonth(), 1)) return;
    setCalendarMonth(m);
    setCalendarYear(y);
  };

  const handleConfirm = () => {
    try {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (_) {}
    onConfirm(selectedDate, cycleLength);
    onDismiss();
  };

  const preview = step === 3 ? calculatePhasePreview(selectedDate, cycleLength) : null;

  const selectedDateObj = new Date(selectedDate + 'T12:00:00');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          {/* Glow */}
          <View style={styles.glowOrb} pointerEvents="none" />

          {/* Header */}
          <View style={styles.sheetHeader}>
            <Pressable
              onPress={step === 1 ? onDismiss : () => { haptic(); setStep((s) => (s - 1) as 1 | 2); }}
              hitSlop={10}
              style={styles.backBtn}
            >
              {step === 1 ? (
                <X size={18} color={colors.textSecondary} strokeWidth={2} />
              ) : (
                <ChevronLeft size={18} color={colors.textSecondary} strokeWidth={2} />
              )}
            </Pressable>

            <View style={styles.stepDots}>
              {([1, 2, 3] as const).map((s) => (
                <View key={s} style={[styles.stepDot, step >= s && styles.stepDotActive]} />
              ))}
            </View>

            <Text style={styles.stepCounter}>{step} / 3</Text>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* ── STEP 1: DATE PICKER ── */}
            {step === 1 && (
              <View>
                <View style={styles.kickerRow}>
                  <View style={styles.activeDot} />
                  <Text style={styles.kicker}>CYCLE START DATE</Text>
                </View>
                <Text style={styles.stepTitle}>When did your last period start?</Text>
                <Text style={styles.stepSub}>
                  This helps Fortywell calculate your current phase and adapt your sessions accordingly.
                </Text>

                {/* Month nav */}
                <View style={styles.monthNav}>
                  <Pressable onPress={() => navMonth(-1)} hitSlop={10} style={styles.monthNavBtn}>
                    <ChevronLeft size={18} color={colors.textSecondary} strokeWidth={2} />
                  </Pressable>
                  <Text style={styles.monthTitle}>
                    {MONTH_NAMES[calendarMonth]} {calendarYear}
                  </Text>
                  <Pressable onPress={() => navMonth(1)} hitSlop={10} style={styles.monthNavBtn}>
                    <ChevronRight size={18} color={calendarMonth === today.getMonth() && calendarYear === today.getFullYear() ? colors.borderMedium : colors.textSecondary} strokeWidth={2} />
                  </Pressable>
                </View>

                {/* Day headers */}
                <View style={styles.calGrid}>
                  {DAY_LABELS.map((l) => (
                    <Text key={l} style={styles.calDayHeader}>{l}</Text>
                  ))}
                  {calendarDays.map((day, idx) => {
                    if (day === null) return <View key={`e-${idx}`} style={styles.calCell} />;
                    const dateStr = getISODateString(new Date(calendarYear, calendarMonth, day));
                    const isFuture = new Date(calendarYear, calendarMonth, day) > today;
                    const isSelected = dateStr === selectedDate;
                    const isToday = dateStr === getISODateString(today);

                    return (
                      <Pressable
                        key={`d-${day}`}
                        onPress={() => !isFuture && handleDaySelect(day)}
                        style={[
                          styles.calCell,
                          isSelected && styles.calCellSelected,
                          isToday && !isSelected && styles.calCellToday,
                          isFuture && styles.calCellFuture,
                        ]}
                      >
                        <Text
                          style={[
                            styles.calDayNum,
                            isSelected && styles.calDayNumSelected,
                            isFuture && styles.calDayNumFuture,
                          ]}
                        >
                          {day}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={styles.selectedDateLabel}>
                  Selected: <Text style={styles.selectedDateValue}>
                    {selectedDateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </Text>
                </Text>

                <Pressable
                  onPress={() => { haptic(); setStep(2); }}
                  style={styles.nextBtn}
                  accessibilityRole="button"
                >
                  <LinearGradient
                    colors={[colors.primary, colors.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.nextGrad}
                  >
                    <Text style={styles.nextText}>Continue</Text>
                    <ChevronRight size={16} color="#FFF" strokeWidth={2.5} />
                  </LinearGradient>
                </Pressable>
              </View>
            )}

            {/* ── STEP 2: CYCLE LENGTH ── */}
            {step === 2 && (
              <View>
                <View style={styles.kickerRow}>
                  <View style={styles.activeDot} />
                  <Text style={styles.kicker}>CYCLE LENGTH</Text>
                </View>
                <Text style={styles.stepTitle}>How long is your typical cycle?</Text>
                <Text style={styles.stepSub}>
                  The average cycle is 21–35 days. This helps calculate phase timing accurately. You can update this anytime.
                </Text>

                {/* Stepper */}
                <View style={styles.stepperRow}>
                  <Pressable
                    onPress={() => { haptic(); setCycleLength((l) => Math.max(21, l - 1)); }}
                    style={styles.stepperBtn}
                    hitSlop={8}
                  >
                    <Minus size={20} color={colors.primaryDark} strokeWidth={2.5} />
                  </Pressable>

                  <View style={styles.stepperValueWrap}>
                    <LinearGradient
                      colors={['rgba(208,120,135,0.55)', 'rgba(156,66,82,0.35)']}
                      style={styles.stepperValueCircle}
                    >
                      <Text style={styles.stepperValueNum}>{cycleLength}</Text>
                      <Text style={styles.stepperValueLabel}>days</Text>
                    </LinearGradient>
                  </View>

                  <Pressable
                    onPress={() => { haptic(); setCycleLength((l) => Math.min(35, l + 1)); }}
                    style={styles.stepperBtn}
                    hitSlop={8}
                  >
                    <Plus size={20} color={colors.primaryDark} strokeWidth={2.5} />
                  </Pressable>
                </View>

                <View style={styles.cycleLengthHints}>
                  <Text style={styles.cycleLengthHint}>
                    {cycleLength < 24 ? '✦  Shorter cycle — phases shift earlier' :
                     cycleLength > 32 ? '✦  Longer cycle — extended phases' :
                     '✦  Typical 28-day pattern — standard phase timing'}
                  </Text>
                </View>

                <Pressable
                  onPress={() => { haptic(); setStep(3); }}
                  style={styles.nextBtn}
                  accessibilityRole="button"
                >
                  <LinearGradient
                    colors={[colors.primary, colors.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.nextGrad}
                  >
                    <Text style={styles.nextText}>Preview My Phase</Text>
                    <ChevronRight size={16} color="#FFF" strokeWidth={2.5} />
                  </LinearGradient>
                </Pressable>
              </View>
            )}

            {/* ── STEP 3: CONFIRM PREVIEW ── */}
            {step === 3 && preview && (
              <View>
                <View style={styles.kickerRow}>
                  <View style={styles.activeDot} />
                  <Text style={styles.kicker}>YOUR CURRENT PHASE</Text>
                </View>
                <Text style={styles.stepTitle}>Here's what your cycle looks like right now</Text>

                {/* Phase orb preview */}
                <View style={styles.confirmOrbContainer}>
                  <View style={styles.confirmOrbOuter}>
                    <LinearGradient
                      colors={[PHASE_COLORS[preview.phase], 'rgba(156,66,82,0.25)']}
                      style={styles.confirmOrbInner}
                    >
                      <Text style={styles.confirmOrbPhase}>{preview.phase.replace(' Phase', '').replace(' Rhythm', '')}</Text>
                      <Text style={styles.confirmOrbDay}>Day {preview.day}</Text>
                    </LinearGradient>
                  </View>
                </View>

                <View style={styles.confirmHeadlineBox}>
                  <Flower2 size={14} color={colors.primaryDark} strokeWidth={2} />
                  <Text style={styles.confirmHeadline}>{preview.headline}</Text>
                </View>

                <View style={styles.confirmSummaryRow}>
                  <View style={styles.confirmSummaryItem}>
                    <Text style={styles.confirmSummaryLabel}>Cycle started</Text>
                    <Text style={styles.confirmSummaryValue}>
                      {selectedDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                  <View style={styles.confirmSummaryDivider} />
                  <View style={styles.confirmSummaryItem}>
                    <Text style={styles.confirmSummaryLabel}>Cycle length</Text>
                    <Text style={styles.confirmSummaryValue}>{cycleLength} days</Text>
                  </View>
                </View>

                <Text style={styles.confirmNote}>
                  You can adjust your cycle data anytime by tapping <Text style={{ fontFamily: fontFamilies.sansMedium }}>Adjust</Text> on the cycle card.
                </Text>

                <Pressable
                  onPress={handleConfirm}
                  style={styles.nextBtn}
                  accessibilityRole="button"
                >
                  <LinearGradient
                    colors={[colors.primary, colors.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.nextGrad}
                  >
                    <Check size={16} color="#FFF" strokeWidth={2.5} />
                    <Text style={styles.nextText}>Enable Cycle Tracking</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const CELL_SIZE = Math.floor((SCREEN_W - 48 - 6 * 6) / 7);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(20,15,12,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: SCREEN_H * 0.88,
    overflow: 'hidden',
  },
  glowOrb: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(208,120,135,0.1)',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  backBtn: {
    padding: 4,
  },
  stepDots: {
    flexDirection: 'row',
    gap: 6,
  },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.borderMedium,
  },
  stepDotActive: {
    backgroundColor: colors.primary,
    width: 18,
  },
  stepCounter: {
    fontSize: 12,
    fontFamily: fontFamilies.monoBold,
    color: colors.textTertiary,
    letterSpacing: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  kicker: {
    fontSize: 10,
    fontFamily: fontFamilies.monoBold,
    color: colors.textTertiary,
    letterSpacing: 1.8,
  },
  stepTitle: {
    fontSize: 22,
    fontFamily: fontFamilies.sansBold,
    color: colors.textPrimary,
    lineHeight: 28,
    marginBottom: 8,
  },
  stepSub: {
    fontSize: 13,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textSecondary,
    lineHeight: 19,
    marginBottom: 24,
  },
  // Calendar
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  monthNavBtn: {
    padding: 6,
  },
  monthTitle: {
    fontSize: 15,
    fontFamily: fontFamilies.sansSemiBold,
    color: colors.textPrimary,
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  calDayHeader: {
    width: CELL_SIZE,
    textAlign: 'center',
    fontSize: 10,
    fontFamily: fontFamilies.monoBold,
    color: colors.textTertiary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  calCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: CELL_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calCellSelected: {
    backgroundColor: colors.primary,
  },
  calCellToday: {
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  calCellFuture: {
    opacity: 0.3,
  },
  calDayNum: {
    fontSize: 13,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textPrimary,
  },
  calDayNumSelected: {
    color: '#FFFFFF',
    fontFamily: fontFamilies.sansSemiBold,
  },
  calDayNumFuture: {
    color: colors.textTertiary,
  },
  selectedDateLabel: {
    fontSize: 12,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  selectedDateValue: {
    fontFamily: fontFamilies.sansMedium,
    color: colors.primaryDark,
  },
  // Stepper
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 16,
    marginTop: 8,
  },
  stepperBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.peachBorder,
  },
  stepperValueWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: 'rgba(208,120,135,0.45)',
    overflow: 'hidden',
  },
  stepperValueCircle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValueNum: {
    fontSize: 36,
    fontFamily: fontFamilies.sansBold,
    color: '#FFFFFF',
    lineHeight: 40,
  },
  stepperValueLabel: {
    fontSize: 12,
    fontFamily: fontFamilies.sansRegular,
    color: 'rgba(255,255,255,0.75)',
  },
  cycleLengthHints: {
    backgroundColor: colors.roseSoft,
    borderRadius: 10,
    padding: 10,
    marginBottom: 24,
  },
  cycleLengthHint: {
    fontSize: 12,
    fontFamily: fontFamilies.sansRegular,
    color: colors.primaryDark,
    lineHeight: 18,
  },
  // Step 3
  confirmOrbContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  confirmOrbOuter: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: 'rgba(208,120,135,0.5)',
    padding: 4,
    overflow: 'hidden',
  },
  confirmOrbInner: {
    flex: 1,
    borderRadius: 76,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  confirmOrbPhase: {
    fontSize: 17,
    fontFamily: fontFamilies.sansBold,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 21,
  },
  confirmOrbDay: {
    fontSize: 13,
    fontFamily: fontFamilies.sansRegular,
    color: 'rgba(255,255,255,0.8)',
  },
  confirmHeadlineBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.roseSoft,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.peachBorder,
    marginBottom: 16,
  },
  confirmHeadline: {
    flex: 1,
    fontSize: 13,
    fontFamily: fontFamilies.sansRegular,
    color: colors.primaryDark,
    lineHeight: 19,
    fontStyle: 'italic',
  },
  confirmSummaryRow: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderMedium,
    overflow: 'hidden',
    marginBottom: 16,
  },
  confirmSummaryItem: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  confirmSummaryDivider: {
    width: 1,
    backgroundColor: colors.borderMedium,
  },
  confirmSummaryLabel: {
    fontSize: 10,
    fontFamily: fontFamilies.monoBold,
    color: colors.textTertiary,
    letterSpacing: 0.8,
  },
  confirmSummaryValue: {
    fontSize: 16,
    fontFamily: fontFamilies.sansBold,
    color: colors.textPrimary,
  },
  confirmNote: {
    fontSize: 11.5,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textTertiary,
    lineHeight: 17,
    marginBottom: 24,
    textAlign: 'center',
  },
  // Shared
  nextBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
  },
  nextGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  nextText: {
    fontSize: 14,
    fontFamily: fontFamilies.sansBold,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
