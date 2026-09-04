import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  Moon,
  Sparkles,
  Wind,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Play,
  RotateCcw,
  X,
  HeartPulse,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../theme/colors';
import { fontFamilies } from '../theme/typography';
import { useLanguage } from '../context/LanguageContext';

const { width: SCREEN_W } = Dimensions.get('window');
const STORAGE_WIND_DOWN_KEY = '@fortywell_wind_down_completed_date';

interface WindDownStep {
  title: string;
  subtitle: string;
  durationSec: number;
  instruction: string;
  scienceNote: string;
  type: 'breathe' | 'stretch' | 'drain';
}

const WIND_DOWN_STEPS: WindDownStep[] = [
  {
    title: '4-7-8 Parasympathetic Breathing',
    subtitle: 'Step 1 of 3 · Vagus Nerve Down-Regulation',
    durationSec: 60,
    instruction: 'Inhale through nose for 4s, gently hold for 7s, exhale slowly through mouth for 8s with a soft sigh.',
    scienceNote: 'Extended exhales stimulate the vagus nerve, signaling the adrenal glands to halt evening cortisol secretion.',
    type: 'breathe',
  },
  {
    title: 'Suboccipital & Jaw Tension Release',
    subtitle: 'Step 2 of 3 · Cervical Decompression',
    durationSec: 60,
    instruction: 'Place fingertips at the base of your skull. Gently tuck your chin, swallow once to drop your tongue from the roof of the mouth, and let the jaw hang heavy.',
    scienceNote: 'Clenching and forward head posture keep the sympathetic nervous system on high alert. Releasing the occiput triggers instant cranial relaxation.',
    type: 'stretch',
  },
  {
    title: 'Restorative Legs-Up Inversion',
    subtitle: 'Step 3 of 3 · Lymphatic & Interstitial Drainage',
    durationSec: 60,
    instruction: 'Lie flat on your bed or mat and extend your legs up against the wall or over a stack of pillows. Rest hands on your lower abdomen.',
    scienceNote: 'Reversing gravity drains stagnant lymphatic fluid from ankles and knees, cooling core temperature for deep restorative sleep.',
    type: 'drain',
  },
];

export const EveningWindDownCard: React.FC = () => {
  const { t } = useLanguage();
  const [modalVisible, setModalVisible] = useState(false);
  const [isCompletedToday, setIsCompletedToday] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [timerSec, setTimerSec] = useState(60);
  const [isActive, setIsActive] = useState(false);

  // Breathing animation orb
  const breathAnim = useRef(new Animated.Value(1)).current;
  const [breathPhase, setBreathPhase] = useState<'Inhale (4s)' | 'Hold (7s)' | 'Exhale (8s)'>('Inhale (4s)');

  // Check today's completion
  useEffect(() => {
    async function checkCompleted() {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const savedDate = await AsyncStorage.getItem(STORAGE_WIND_DOWN_KEY);
        if (savedDate === todayStr) {
          setIsCompletedToday(true);
        }
      } catch (_) {}
    }
    checkCompleted();
  }, []);

  // Breathing cycle animation loop
  useEffect(() => {
    let timeoutId: any;
    if (modalVisible && isActive && WIND_DOWN_STEPS[currentStepIndex].type === 'breathe') {
      const runCycle = () => {
        setBreathPhase('Inhale (4s)');
        Animated.timing(breathAnim, {
          toValue: 1.45,
          duration: 4000,
          useNativeDriver: true,
        }).start(() => {
          setBreathPhase('Hold (7s)');
          timeoutId = setTimeout(() => {
            setBreathPhase('Exhale (8s)');
            Animated.timing(breathAnim, {
              toValue: 0.9,
              duration: 8000,
              useNativeDriver: true,
            }).start(() => {
              runCycle();
            });
          }, 7000);
        });
      };
      runCycle();
    } else {
      Animated.timing(breathAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }

    return () => {
      clearTimeout(timeoutId);
    };
  }, [modalVisible, isActive, currentStepIndex]);

  // Step countdown timer
  useEffect(() => {
    let interval: any;
    if (modalVisible && isActive && timerSec > 0) {
      interval = setInterval(() => {
        setTimerSec((prev) => prev - 1);
      }, 1000);
    } else if (timerSec === 0 && isActive) {
      if (currentStepIndex < WIND_DOWN_STEPS.length - 1) {
        try {
          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        } catch (_) {}
        setCurrentStepIndex((prev) => prev + 1);
        setTimerSec(WIND_DOWN_STEPS[currentStepIndex + 1].durationSec);
      } else {
        handleCompleteAll();
      }
    }
    return () => clearInterval(interval);
  }, [modalVisible, isActive, timerSec, currentStepIndex]);

  const handleStart = () => {
    setCurrentStepIndex(0);
    setTimerSec(WIND_DOWN_STEPS[0].durationSec);
    setIsActive(true);
    setModalVisible(true);
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (_) {}
  };

  const handleCompleteAll = async () => {
    setIsActive(false);
    setIsCompletedToday(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      await AsyncStorage.setItem(STORAGE_WIND_DOWN_KEY, todayStr);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (_) {}
  };

  const currentStep = WIND_DOWN_STEPS[currentStepIndex];

  // Dynamic evening hour detection (after 18:00 is prime wind-down window)
  const currentHour = new Date().getHours();
  const isEveningNow = currentHour >= 18 || currentHour < 5;

  return (
    <View style={styles.outerContainer}>
      {/* ── CARD SHELL WITH LUXURY TWILIGHT GRADIENT ── */}
      <View style={styles.card}>
        <LinearGradient
          colors={
            isEveningNow
              ? ['#261B24', '#1A141A', '#130E13']
              : ['#2B2127', '#1E171E', '#161116']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          {/* Header Row */}
          <View style={styles.cardHeaderRow}>
            <View style={styles.badgeRow}>
              <View style={styles.moonPill}>
                <Moon size={11} color="#E8C39E" strokeWidth={2.4} />
                <Text style={styles.moonPillText}>3-MIN SOMATIC RESET</Text>
              </View>
              {isEveningNow && (
                <View style={styles.liveEveningBadge}>
                  <View style={styles.liveEveningDot} />
                  <Text style={styles.liveEveningText}>PRIME REST WINDOW</Text>
                </View>
              )}
            </View>

            {isCompletedToday ? (
              <View style={styles.completedPill}>
                <CheckCircle2 size={12} color="#92A975" strokeWidth={2.2} />
                <Text style={styles.completedPillText}>LOGGED TONIGHT</Text>
              </View>
            ) : (
              <View style={styles.durationPill}>
                <Clock size={11} color="rgba(255,255,255,0.7)" />
                <Text style={styles.durationText}>3 min</Text>
              </View>
            )}
          </View>

          {/* Title & Subtitle */}
          <Text style={styles.cardTitle}>Cortisol Wind-Down & Vagus Reset</Text>
          <Text style={styles.cardDescription}>
            Gentle parasympathetic pacing designed to drain lower-body fluid retention, quiet bedtime adrenaline, and prevent 3 AM hot-flash wakeups.
          </Text>

          {/* 3 Step Micro-Pills */}
          <View style={styles.stepsPillContainer}>
            <View style={styles.stepChip}>
              <Wind size={11} color="#E8C39E" />
              <Text style={styles.stepChipText}>4-7-8 Breath</Text>
            </View>
            <View style={styles.stepChip}>
              <ShieldCheck size={11} color="#E8C39E" />
              <Text style={styles.stepChipText}>Jaw & Cervical</Text>
            </View>
            <View style={styles.stepChip}>
              <HeartPulse size={11} color="#E8C39E" />
              <Text style={styles.stepChipText}>Legs-Up Drain</Text>
            </View>
          </View>

          {/* Bottom Action Row */}
          <View style={styles.actionRow}>
            <Pressable
              style={({ pressed }) => [
                styles.startBtn,
                pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
              ]}
              onPress={handleStart}
              accessibilityRole="button"
              accessibilityLabel="Start evening wind down routine"
            >
              <LinearGradient
                colors={['#D07887', '#9F4252']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.startBtnGradient}
              >
                <Play size={14} color="#FFFFFF" fill="#FFFFFF" />
                <Text style={styles.startBtnText}>
                  {isCompletedToday ? 'Repeat Wind-Down' : 'Begin 3-Min Wind-Down'}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        </LinearGradient>
      </View>

      {/* ── INTERACTIVE SOMATIC PLAYER MODAL ── */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalRoot}>
          <LinearGradient
            colors={['#1F161E', '#140D14', '#0B070B']}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalKicker}>EVENING SOMATIC RESTORATION</Text>
              <Text style={styles.modalHeaderTitle}>Cortisol Wind-Down</Text>
            </View>
            <Pressable
              onPress={() => setModalVisible(false)}
              style={styles.closeBtn}
              hitSlop={12}
            >
              <X size={18} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* Step Progress Indicators */}
          <View style={styles.stepProgressRow}>
            {WIND_DOWN_STEPS.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.stepProgressSegment,
                  i <= currentStepIndex && styles.stepProgressSegmentActive,
                ]}
              />
            ))}
          </View>

          {/* Main Interactive Stage */}
          <View style={styles.modalBody}>
            <Text style={styles.stepSubtitle}>{currentStep.subtitle.toUpperCase()}</Text>
            <Text style={styles.stepTitle}>{currentStep.title}</Text>

            {/* Central Animated Breathing / Action Visualizer */}
            <View style={styles.visualizerWrap}>
              <Animated.View
                style={[
                  styles.visualizerOrb,
                  {
                    transform: [{ scale: breathAnim }],
                  },
                ]}
              >
                <LinearGradient
                  colors={['rgba(208, 120, 135, 0.45)', 'rgba(232, 195, 158, 0.25)']}
                  style={styles.orbInner}
                >
                  <Moon size={32} color="#FFFFFF" />
                  {currentStep.type === 'breathe' && (
                    <Text style={styles.orbPhaseText}>{breathPhase}</Text>
                  )}
                  <Text style={styles.orbTimerText}>{timerSec}s</Text>
                </LinearGradient>
              </Animated.View>
            </View>

            {/* Step Instruction */}
            <View style={styles.instructionCard}>
              <Text style={styles.instructionText}>{currentStep.instruction}</Text>
              <View style={styles.scienceWrap}>
                <Sparkles size={13} color="#E8C39E" />
                <Text style={styles.scienceText}>{currentStep.scienceNote}</Text>
              </View>
            </View>
          </View>

          {/* Modal Footer Controls */}
          <View style={styles.modalFooter}>
            <Pressable
              style={styles.footerSecondaryBtn}
              onPress={() => {
                setIsActive(!isActive);
              }}
            >
              <Text style={styles.footerSecondaryText}>
                {isActive ? 'Pause' : 'Resume'}
              </Text>
            </Pressable>

            {currentStepIndex < WIND_DOWN_STEPS.length - 1 ? (
              <Pressable
                style={styles.footerPrimaryBtn}
                onPress={() => {
                  setCurrentStepIndex((prev) => prev + 1);
                  setTimerSec(WIND_DOWN_STEPS[currentStepIndex + 1].durationSec);
                }}
              >
                <Text style={styles.footerPrimaryText}>Next Movement →</Text>
              </Pressable>
            ) : (
              <Pressable
                style={[styles.footerPrimaryBtn, { backgroundColor: '#708655' }]}
                onPress={() => {
                  handleCompleteAll();
                  setModalVisible(false);
                }}
              >
                <CheckCircle2 size={16} color="#FFFFFF" />
                <Text style={styles.footerPrimaryText}>Complete & Rest</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    paddingHorizontal: 20,
    marginTop: 18,
    marginBottom: 8,
  },
  card: {
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: 'rgba(232, 195, 158, 0.3)',
    ...Platform.select({
      ios: {
        shadowColor: '#C9465B',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.18,
        shadowRadius: 10,
      },
      android: { elevation: 4 },
      default: {
        boxShadow: '0 4px 16px rgba(43, 33, 39, 0.35)',
      },
    }),
  },
  cardGradient: {
    padding: 20,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  moonPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(232, 195, 158, 0.16)',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(232, 195, 158, 0.3)',
  },
  moonPillText: {
    fontSize: 9.5,
    fontFamily: fontFamilies.sansBold,
    color: '#E8C39E',
    letterSpacing: 0.8,
  },
  liveEveningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(208, 120, 135, 0.2)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  liveEveningDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#F39EB0',
  },
  liveEveningText: {
    fontSize: 8.5,
    fontFamily: fontFamilies.sansBold,
    color: '#F39EB0',
    letterSpacing: 0.6,
  },
  durationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  durationText: {
    fontSize: 10.5,
    color: 'rgba(255, 255, 255, 0.75)',
    fontFamily: fontFamilies.sansRegular,
  },
  completedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(146, 169, 117, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  completedPillText: {
    fontSize: 9.5,
    fontFamily: fontFamilies.sansBold,
    color: '#92A975',
    letterSpacing: 0.6,
  },
  cardTitle: {
    fontSize: 20,
    fontFamily: fontFamilies.soria,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 12.5,
    fontFamily: fontFamilies.sansRegular,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
    marginBottom: 14,
  },
  stepsPillContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  stepChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 8,
  },
  stepChipText: {
    fontSize: 11,
    fontFamily: fontFamilies.sansMedium,
    color: 'rgba(255, 255, 255, 0.88)',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  startBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  startBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
  },
  startBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: fontFamilies.sansBold,
    letterSpacing: 0.3,
  },

  // Modal styles
  modalRoot: {
    flex: 1,
    backgroundColor: '#120D12',
    paddingTop: Platform.OS === 'ios' ? 55 : 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  modalKicker: {
    fontSize: 9.5,
    fontFamily: fontFamilies.monoBold,
    color: '#E8C39E',
    letterSpacing: 1.6,
  },
  modalHeaderTitle: {
    fontSize: 22,
    fontFamily: fontFamilies.soria,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepProgressRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  stepProgressSegment: {
    flex: 1,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  stepProgressSegmentActive: {
    backgroundColor: '#D07887',
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  stepSubtitle: {
    fontSize: 10,
    fontFamily: fontFamilies.monoBold,
    color: '#E8C39E',
    letterSpacing: 1.4,
    marginBottom: 4,
  },
  stepTitle: {
    fontSize: 24,
    fontFamily: fontFamilies.soria,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  visualizerWrap: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  visualizerOrb: {
    width: 170,
    height: 170,
    borderRadius: 85,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(232, 195, 158, 0.5)',
  },
  orbInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbPhaseText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: fontFamilies.sansBold,
    marginTop: 6,
  },
  orbTimerText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 16,
    fontFamily: fontFamilies.monoBold,
    marginTop: 4,
  },
  instructionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 16,
    padding: 16,
    marginTop: 18,
    width: '100%',
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontFamily: fontFamilies.sansRegular,
    lineHeight: 20,
    marginBottom: 10,
  },
  scienceWrap: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 8,
  },
  scienceText: {
    flex: 1,
    fontSize: 11,
    color: '#E8C39E',
    fontFamily: fontFamilies.sansRegular,
    lineHeight: 15,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    paddingTop: 12,
  },
  footerSecondaryBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerSecondaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: fontFamilies.sansSemiBold,
  },
  footerPrimaryBtn: {
    flex: 1.6,
    backgroundColor: '#D07887',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
  },
  footerPrimaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: fontFamilies.sansBold,
  },
});
