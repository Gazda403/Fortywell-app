import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
  Dimensions,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';
import { typography, fontFamilies } from '../theme/typography';
import { QUIZ_STEPS, HOME_EQUIPMENT_OPTIONS } from '../data/quizData';
import {
  OnboardingAnswers,
  TargetFocusOption,
  EnergyBaselineOption,
  JointSensitivityOption,
  TimeCommitmentOption,
  TrainingLocationOption,
  EquipmentOption,
} from '../types/onboarding';
import { ProgressBar } from '../components/ProgressBar';
import { OptionCard } from '../components/OptionCard';
import { SwipeableDeck } from '../components/SwipeableDeck';
import { OnboardingSummary } from '../components/OnboardingSummary';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { height: SCREEN_H } = Dimensions.get('window');

interface OnboardingQuizScreenProps {
  firstName?: string;
  onFlowCompleted?: (answers: OnboardingAnswers) => void;
}

export const OnboardingQuizScreen: React.FC<OnboardingQuizScreenProps> = ({
  firstName,
  onFlowCompleted,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false);

  const [answers, setAnswers] = useState<OnboardingAnswers>({
    first_name: firstName || '',
    target_focus: [],
    energy_baseline: null,
    joint_sensitivities: [],
    time_commitment: null,
    weekly_frequency: '',
    training_location: null,
    equipment: [],
  });

  const currentStep = QUIZ_STEPS[currentStepIndex];
  const isDeckStep = currentStep.isMultiSelect;

  // ── Headline cinematic intro animation ─────────────────────────────────────
  const introProgress = useSharedValue(0);
  const titleOpacity = useSharedValue(0);

  useEffect(() => {
    introProgress.value = 0;
    titleOpacity.value = 0;

    // Immediately fade in headline
    titleOpacity.value = withTiming(1, { duration: 220 });

    // Hold centered for ~1.0s, then smoothly glide up to top
    introProgress.value = withDelay(
      1000,
      withSpring(1, {
        damping: 18,
        stiffness: 95,
        mass: 0.9,
      })
    );
  }, [currentStepIndex, introProgress, titleOpacity]);

  // Tap to fast-forward
  const handleFastForward = useCallback(() => {
    if (introProgress.value < 0.9) {
      introProgress.value = withSpring(1, { damping: 20, stiffness: 200 });
    }
  }, [introProgress]);

  // Title translation: glides smoothly from centered position to top
  const titleAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      introProgress.value,
      [0, 1],
      [SCREEN_H * 0.16, 0],
      Extrapolate.CLAMP
    );

    return {
      opacity: titleOpacity.value,
      transform: [{ translateY }],
    };
  });

  // Content animated style: progress bar, description, cards & footer
  const contentAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      introProgress.value,
      [0, 0.7, 1],
      [0, 0, 1],
      Extrapolate.CLAMP
    );
    const translateY = interpolate(
      introProgress.value,
      [0, 0.7, 1],
      [18, 18, 0],
      Extrapolate.CLAMP
    );

    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  // ── Deck handlers for multi-select steps ──────────────────────────────────
  const handleDeckSelect = useCallback(
    (id: string) => {
      const field = currentStep.field;
      setAnswers((prev) => {
        if (field === 'target_focus') {
          if (prev.target_focus.includes(id as TargetFocusOption)) return prev;
          return { ...prev, target_focus: [...prev.target_focus, id as TargetFocusOption] };
        }
        if (field === 'joint_sensitivities') {
          const next = prev.joint_sensitivities.filter(
            (i) => i !== 'none'
          ) as Exclude<JointSensitivityOption, 'none'>[];
          if (id === 'none') return { ...prev, joint_sensitivities: ['none' as JointSensitivityOption] };
          const target = id as Exclude<JointSensitivityOption, 'none'>;
          if (next.includes(target)) return prev;
          return { ...prev, joint_sensitivities: [...next, target] };
        }
        return prev;
      });
    },
    [currentStep.field]
  );

  const handleDeckDeselect = useCallback(
    (id: string) => {
      const field = currentStep.field;
      setAnswers((prev) => {
        if (field === 'target_focus') {
          return { ...prev, target_focus: prev.target_focus.filter((i) => i !== id) };
        }
        if (field === 'joint_sensitivities') {
          const next = prev.joint_sensitivities.filter((i) => i !== id);
          return { ...prev, joint_sensitivities: next };
        }
        return prev;
      });
    },
    [currentStep.field]
  );

  // ── Regular option toggle (single-select steps) ───────────────────────────
  const handleOptionToggle = useCallback(
    (optionId: string) => {
      setAnswers((prev) => {
        const field = currentStep?.field;
        if (!field) return prev;
        if (field === 'energy_baseline') {
          return { ...prev, energy_baseline: optionId as EnergyBaselineOption };
        }
        if (field === 'time_commitment') {
          return { ...prev, time_commitment: optionId as TimeCommitmentOption };
        }
        if (field === 'training_location') {
          return { ...prev, training_location: optionId as TrainingLocationOption };
        }
        return prev;
      });
    },
    [currentStep]
  );

  // ── Equipment toggle (Step 5 optional dropdown/grid) ──────────────────────
  const handleEquipmentToggle = useCallback((eqId: EquipmentOption) => {
    setAnswers((prev) => {
      if (eqId === 'none') {
        const hasNone = prev.equipment.includes('none');
        return {
          ...prev,
          equipment: hasNone ? [] : ['none'],
        };
      }
      const filtered = prev.equipment.filter((e) => e !== 'none');
      const exists = filtered.includes(eqId);
      const updated = exists
        ? filtered.filter((e) => e !== eqId)
        : [...filtered, eqId];
      return {
        ...prev,
        equipment: updated,
      };
    });
  }, []);

  // ── Weekly frequency custom input handler ─────────────────────────────────
  const handleWeeklyFrequencyChange = useCallback((text: string) => {
    setAnswers((prev) => ({
      ...prev,
      weekly_frequency: text,
    }));
  }, []);

  const isOptionSelected = useCallback(
    (optionId: string): boolean => {
      if (!currentStep) return false;
      const field = currentStep.field;
      if (field === 'energy_baseline') return answers.energy_baseline === optionId;
      if (field === 'time_commitment') return answers.time_commitment === optionId;
      if (field === 'training_location') return answers.training_location === optionId;
      return false;
    },
    [currentStep, answers]
  );

  const canContinue = useMemo((): boolean => {
    if (!currentStep) return false;
    const field = currentStep.field;
    if (field === 'target_focus') return answers.target_focus.length > 0;
    if (field === 'joint_sensitivities') return answers.joint_sensitivities.length > 0;
    if (field === 'energy_baseline') return answers.energy_baseline !== null;
    if (field === 'time_commitment') return answers.time_commitment !== null;
    if (field === 'training_location') return answers.training_location !== null;
    return true;
  }, [currentStep, answers]);

  // ── Navigation ────────────────────────────────────────────────────────────
  const handleBack = () => {
    if (isCompleted) {
      setIsCompleted(false);
      setCurrentStepIndex(QUIZ_STEPS.length - 1);
    } else if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleNext = async () => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch {
      // safe fallback
    }
    if (currentStepIndex < QUIZ_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
      await saveProfileToSupabase();
    }
  };

  // ── Supabase persistence ──────────────────────────────────────────────────
  const saveProfileToSupabase = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const profilePayload = {
        first_name: firstName || answers.first_name || user?.user_metadata?.full_name || null,
        target_focus: answers.target_focus,
        time_commitment: answers.time_commitment,
        weekly_frequency: answers.weekly_frequency || null,
        joint_sensitivities: answers.joint_sensitivities,
        energy_baseline: answers.energy_baseline,
        training_location: answers.training_location,
        equipment: answers.equipment,
        has_completed_onboarding: true,
        updated_at: new Date().toISOString(),
      };
      if (user?.id) {
        const { error } = await supabase.from('profiles').upsert({ id: user.id, ...profilePayload });
        if (error) throw error;
      } else {
        if (__DEV__) console.log('Guest session:', profilePayload);
      }
      try {
        await AsyncStorage.setItem('@fortywell_completed_profile', JSON.stringify(answers));
        await AsyncStorage.setItem('@fortywell_onboarding_completed', 'true');
      } catch (_) {}
    } catch (err: any) {
      console.warn('Supabase save notice:', err.message || err);
      setSaveError(err.message || 'Saved locally');
      try {
        await AsyncStorage.setItem('@fortywell_completed_profile', JSON.stringify(answers));
        await AsyncStorage.setItem('@fortywell_onboarding_completed', 'true');
      } catch (_) {}
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinalStart = async () => {
    try {
      await AsyncStorage.setItem('@fortywell_completed_profile', JSON.stringify(answers));
      await AsyncStorage.setItem('@fortywell_onboarding_completed', 'true');
    } catch (_) {}
    if (onFlowCompleted) onFlowCompleted(answers);
  };

  // ── Selected IDs for deck steps ───────────────────────────────────────────
  const deckSelectedIds = useMemo(() => {
    if (currentStep.field === 'target_focus') return answers.target_focus as string[];
    if (currentStep.field === 'joint_sensitivities') return answers.joint_sensitivities as string[];
    return [];
  }, [currentStep.field, answers]);

  const continueOpacity = useMemo(() => (canContinue ? 1 : 0.35), [canContinue]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {isCompleted ? (
          <OnboardingSummary
            firstName={firstName || answers.first_name}
            answers={answers}
            isSaving={isSaving}
            saveError={saveError}
            onComplete={handleFinalStart}
            onReview={() => {
              setIsCompleted(false);
              setCurrentStepIndex(0);
            }}
          />
        ) : (
          <Pressable style={styles.container} onPress={handleFastForward}>
            {/* ── PROGRESS BAR ── */}
            <Animated.View style={contentAnimatedStyle}>
              <ProgressBar
                currentStep={currentStep.stepNumber}
                totalSteps={currentStep.totalSteps}
                category={currentStep.category}
              />
            </Animated.View>

            {/* ── BACK NAV ── */}
            {currentStepIndex > 0 && (
              <Animated.View style={contentAnimatedStyle}>
                <Pressable
                  onPress={handleBack}
                  style={styles.backBtn}
                  hitSlop={14}
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                >
                  <Text style={styles.backLabel}>← Back</Text>
                </Pressable>
              </Animated.View>
            )}

            {/* ── EDITORIAL HEADLINE ── */}
            <View style={styles.titleContainer}>
              <Animated.View style={titleAnimatedStyle}>
                <Text style={styles.animTitle}>
                  {currentStep.title}
                </Text>
              </Animated.View>

              {/* Description text */}
              <Animated.View style={contentAnimatedStyle}>
                <Text style={styles.descriptionText}>
                  {currentStep.description}
                </Text>
              </Animated.View>
            </View>

            {/* ── MAIN CONTENT AREA ── */}
            <Animated.View style={[styles.contentArea, contentAnimatedStyle]}>
              {isDeckStep ? (
                <SwipeableDeck
                  options={currentStep.options}
                  selectedIds={deckSelectedIds}
                  onSelect={handleDeckSelect}
                  onDeselect={handleDeckDeselect}
                />
              ) : (
                <ScrollView
                  style={styles.scrollView}
                  contentContainerStyle={styles.scrollContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {currentStep.options.map((option) => (
                    <OptionCard
                      key={option.id}
                      option={option}
                      isSelected={isOptionSelected(option.id)}
                      onPress={handleOptionToggle}
                      isMultiSelect={false}
                    />
                  ))}

                  {/* ── STEP 4: HOW MANY TIMES PER WEEK INPUT CARD ── */}
                  {currentStep.field === 'time_commitment' && (
                    <View style={styles.frequencyCard}>
                      <View style={styles.frequencyHeader}>
                        <Text style={styles.frequencyKicker}>WEEKLY FREQUENCY</Text>
                        <Text style={styles.frequencyTitle}>
                          How many times per week can you workout?
                        </Text>
                        <Text style={styles.frequencySubtitle}>
                          Tell us how many days or sessions feel realistic for your rhythm.
                        </Text>
                      </View>

                      {/* Custom Input Field */}
                      <View
                        style={[
                          styles.inputWrapper,
                          isInputFocused && styles.inputWrapperFocused,
                        ]}
                      >
                        <TextInput
                          style={styles.textInput}
                          value={answers.weekly_frequency || ''}
                          onChangeText={handleWeeklyFrequencyChange}
                          placeholder="e.g., 3 days, 4–5 times, weekends"
                          placeholderTextColor={colors.textTertiary}
                          onFocus={() => setIsInputFocused(true)}
                          onBlur={() => setIsInputFocused(false)}
                          returnKeyType="done"
                        />
                        {answers.weekly_frequency ? (
                          <Pressable
                            onPress={() => handleWeeklyFrequencyChange('')}
                            style={styles.clearBtn}
                            hitSlop={8}
                            accessibilityLabel="Clear weekly frequency"
                          >
                            <Text style={styles.clearBtnText}>✕</Text>
                          </Pressable>
                        ) : null}
                      </View>

                      {/* Quick Suggestion Pills */}
                      <View style={styles.pillRow}>
                        {['2 days', '3 days', '4–5 days', 'Daily'].map((pill) => {
                          const isSelected = answers.weekly_frequency === pill;
                          return (
                            <Pressable
                              key={pill}
                              onPress={() => handleWeeklyFrequencyChange(pill)}
                              style={[
                                styles.freqPill,
                                isSelected && styles.freqPillSelected,
                              ]}
                              accessibilityRole="button"
                              accessibilityLabel={`Select ${pill} per week`}
                            >
                              <Text
                                style={[
                                  styles.freqPillText,
                                  isSelected && styles.freqPillTextSelected,
                                ]}
                              >
                                {pill}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  {/* ── STEP 5: EQUIPMENT DROPDOWN / SELECTOR (IF HOME OR HYBRID) ── */}
                  {currentStep.field === 'training_location' &&
                    (answers.training_location === 'home' ||
                      answers.training_location === 'hybrid') && (
                      <View style={styles.equipmentCard}>
                        <View style={styles.equipmentHeader}>
                          <View style={styles.equipmentBadgeRow}>
                            <Text style={styles.equipmentKicker}>AVAILABLE TOOLS</Text>
                            <View style={styles.optionalBadge}>
                              <Text style={styles.optionalBadgeText}>OPTIONAL</Text>
                            </View>
                          </View>
                          <Text style={styles.equipmentTitle}>
                            Do you have any equipment at home?
                          </Text>
                          <Text style={styles.equipmentSubtitle}>
                            Tap any tools you own. Core Fortywell flows require zero equipment.
                          </Text>
                        </View>

                        <View style={styles.equipmentList}>
                          {HOME_EQUIPMENT_OPTIONS.map((item) => {
                            const isSelected = answers.equipment.includes(item.id);
                            return (
                              <Pressable
                                key={item.id}
                                onPress={() => handleEquipmentToggle(item.id)}
                                style={[
                                  styles.equipmentRow,
                                  isSelected && styles.equipmentRowSelected,
                                ]}
                                accessibilityRole="checkbox"
                                accessibilityState={{ checked: isSelected }}
                                accessibilityLabel={`${item.label}, ${item.sublabel}`}
                              >
                                <View style={styles.equipmentTextWrap}>
                                  <Text
                                    style={[
                                      styles.equipmentLabel,
                                      isSelected && styles.equipmentLabelSelected,
                                    ]}
                                  >
                                    {item.label}
                                  </Text>
                                  <Text style={styles.equipmentSublabel}>
                                    {item.sublabel}
                                  </Text>
                                </View>

                                <View
                                  style={[
                                    styles.equipmentCheckbox,
                                    isSelected && styles.equipmentCheckboxSelected,
                                  ]}
                                >
                                  {isSelected && (
                                    <Text style={styles.equipmentCheckmark}>✓</Text>
                                  )}
                                </View>
                              </Pressable>
                            );
                          })}
                        </View>
                      </View>
                    )}

                  {/* Step 5: Gym Notice if gym is selected */}
                  {currentStep.field === 'training_location' &&
                    answers.training_location === 'gym' && (
                      <View style={styles.gymNoticeCard}>
                        <Text style={styles.gymNoticeTitle}>
                          Full Gym Programming Active
                        </Text>
                        <Text style={styles.gymNoticeSubtitle}>
                          We will include cables, barbells, dumbbells, and machine-assisted mobility flows in your library.
                        </Text>
                      </View>
                    )}
                </ScrollView>
              )}
            </Animated.View>

            {/* ── CONTINUE FOOTER ── */}
            <Animated.View style={[styles.footer, contentAnimatedStyle]}>
              <Pressable
                onPress={handleNext}
                disabled={!canContinue}
                style={[
                  styles.continueButton,
                  { opacity: continueOpacity },
                ]}
                android_ripple={{ color: colors.primaryDark }}
                accessibilityRole="button"
                accessibilityState={{ disabled: !canContinue }}
                accessibilityLabel={
                  currentStepIndex === QUIZ_STEPS.length - 1
                    ? 'Generate my protocol'
                    : 'Continue to next question'
                }
              >
                <Text style={typography.button}>
                  {currentStepIndex === QUIZ_STEPS.length - 1
                    ? 'Generate My Protocol'
                    : 'Continue'}
                </Text>
                <Text style={styles.continueArrow}>→</Text>
              </Pressable>
            </Animated.View>
          </Pressable>
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  backBtn: {
    marginLeft: 24,
    marginTop: 4,
    marginBottom: 0,
    alignSelf: 'flex-start',
  },
  backLabel: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.2,
    color: colors.textSecondary,
  },

  // Title container
  titleContainer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
  },
  animTitle: {
    fontSize: 27,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 34,
    color: colors.textPrimary,
    fontFamily: fontFamilies.soria,
    marginBottom: 6,
    paddingRight: 4,
  },
  descriptionText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 21,
    letterSpacing: 0.1,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Main interactive area
  contentArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 0,
    paddingBottom: 40,
  },

  // Step 4 Frequency Card
  frequencyCard: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 18,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      ios: {
        shadowColor: colors.textPrimary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  frequencyHeader: {
    marginBottom: 12,
  },
  frequencyKicker: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.primary,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  frequencyTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
    lineHeight: 22,
    color: colors.textPrimary,
    fontFamily: fontFamilies.soria,
    marginBottom: 4,
  },
  frequencySubtitle: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    color: colors.textSecondary,
    letterSpacing: 0.1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceCard,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    minHeight: 48,
  },
  inputWrapperFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    paddingVertical: 10,
  },
  clearBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  clearBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    lineHeight: 13,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  freqPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  freqPillSelected: {
    backgroundColor: colors.surfaceCardSelected,
    borderColor: colors.primary,
  },
  freqPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  freqPillTextSelected: {
    color: colors.primaryDark,
    fontWeight: '700',
  },

  // Step 5 Equipment Card
  equipmentCard: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 18,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      ios: {
        shadowColor: colors.textPrimary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  equipmentHeader: {
    marginBottom: 14,
  },
  equipmentBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  equipmentKicker: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.primary,
    textTransform: 'uppercase',
  },
  optionalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: colors.sageSoft,
  },
  optionalBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: colors.sageDark,
  },
  equipmentTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
    lineHeight: 22,
    color: colors.textPrimary,
    fontFamily: fontFamilies.soria,
    marginBottom: 4,
  },
  equipmentSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    color: colors.textSecondary,
    letterSpacing: 0.1,
  },
  equipmentList: {
    gap: 8,
  },
  equipmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  equipmentRowSelected: {
    backgroundColor: colors.surfaceCardSelected,
    borderColor: colors.primary,
  },
  equipmentTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  equipmentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 19,
    marginBottom: 1,
  },
  equipmentLabelSelected: {
    color: colors.primaryDark,
  },
  equipmentSublabel: {
    fontSize: 12,
    color: colors.textTertiary,
    lineHeight: 16,
  },
  equipmentCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  equipmentCheckboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  equipmentCheckmark: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textInverse,
    lineHeight: 14,
  },
  gymNoticeCard: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.sageSoft,
    borderWidth: 1,
    borderColor: colors.sage,
  },
  gymNoticeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.sageDark,
    marginBottom: 4,
  },
  gymNoticeSubtitle: {
    fontSize: 13,
    color: colors.sageDark,
    lineHeight: 18,
  },

  // Footer
  footer: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 20,
    backgroundColor: colors.background,
  },
  continueButton: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#9F4252',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 14,
      },
      android: { elevation: 6 },
      default: {},
    }),
  },
  continueArrow: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textInverse,
  },
});
