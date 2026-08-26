import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  Sparkles,
  Flower2,
  Trophy,
  ChevronRight,
  X,
  Zap,
  Leaf,
  Flame,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { fontFamilies } from '../theme/typography';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export interface WeeklyRecapData {
  weekNumber: number;
  sessionsCompleted: number;
  totalSessions: number;
  longestStreak: number;
  gardenGrowth: number;
  personalRecords: number;
  cyclePhase?: string;
  motivationalLine?: string;
}

interface WeeklyRecapModalProps {
  visible: boolean;
  data: WeeklyRecapData;
  onDismiss: () => void;
}

function getDefaultMotivationalLine(data: WeeklyRecapData): string {
  const ratio = data.sessionsCompleted / Math.max(data.totalSessions, 1);
  if (ratio >= 0.85) {
    return 'You showed up for yourself with remarkable consistency last week — that discipline compounds.';
  } else if (ratio >= 0.6) {
    return 'Solid week. Every session you completed is a deposit into your long-term resilience.';
  } else if (data.longestStreak >= 3) {
    return `A ${data.longestStreak}-day streak is real momentum — this week, let's build on it.`;
  }
  return 'Every reset you completed last week was a choice to invest in yourself. That always counts.';
}

export const WeeklyRecapModal: React.FC<WeeklyRecapModalProps> = ({
  visible,
  data,
  onDismiss,
}) => {
  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 22,
          stiffness: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: SCREEN_H, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleDismiss = () => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (_) {}
    onDismiss();
  };

  const motivationalLine = data.motivationalLine || getDefaultMotivationalLine(data);
  const completionPct = Math.round((data.sessionsCompleted / Math.max(data.totalSessions, 1)) * 100);

  const stats: Array<{
    icon: React.ReactNode;
    value: string;
    label: string;
    bgColor: string;
    borderColor: string;
  }> = [
    {
      icon: <Flame size={20} color="#E1A188" strokeWidth={2} />,
      value: `${data.sessionsCompleted}/${data.totalSessions}`,
      label: 'Sessions Done',
      bgColor: 'rgba(225, 161, 136, 0.14)',
      borderColor: 'rgba(225, 161, 136, 0.3)',
    },
    {
      icon: <Zap size={20} color="#92A975" strokeWidth={2} />,
      value: `${data.longestStreak}d`,
      label: 'Best Streak',
      bgColor: 'rgba(146, 169, 117, 0.14)',
      borderColor: 'rgba(146, 169, 117, 0.3)',
    },
    {
      icon: <Leaf size={20} color="#92A975" strokeWidth={2} />,
      value: `+${data.gardenGrowth}`,
      label: 'Garden Growth',
      bgColor: 'rgba(146, 169, 117, 0.14)',
      borderColor: 'rgba(146, 169, 117, 0.3)',
    },
    {
      icon: <Trophy size={20} color="#D0A040" strokeWidth={2} />,
      value: `${data.personalRecords}`,
      label: 'Personal Records',
      bgColor: 'rgba(208, 160, 64, 0.14)',
      borderColor: 'rgba(208, 160, 64, 0.3)',
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleDismiss}
      statusBarTranslucent
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.glowOrb} pointerEvents="none" />

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <Pressable style={styles.closeBtn} onPress={handleDismiss} hitSlop={10}>
              <X size={18} color={colors.textOnDarkMuted} strokeWidth={2} />
            </Pressable>

            <View style={styles.kickerRow}>
              <View style={styles.activeDot} />
              <Text style={styles.kicker}>LAST WEEK IN REVIEW</Text>
            </View>
            <Text style={styles.weekLabel}>Week {data.weekNumber} Complete</Text>

            <View style={styles.ringContainer}>
              <View style={styles.ringOuter}>
                <LinearGradient
                  colors={['rgba(208,120,135,0.6)', 'rgba(156,66,82,0.4)']}
                  style={styles.ringInner}
                >
                  <Text style={styles.ringPct}>{completionPct}%</Text>
                  <Text style={styles.ringLabel}>Complete</Text>
                </LinearGradient>
              </View>
            </View>

            <View style={styles.statGrid}>
              {stats.map((stat, i) => (
                <View
                  key={i}
                  style={[
                    styles.statCell,
                    { backgroundColor: stat.bgColor, borderColor: stat.borderColor },
                  ]}
                >
                  {stat.icon}
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>

            {data.cyclePhase ? (
              <View style={styles.phaseRow}>
                <Flower2 size={14} color={colors.peach} strokeWidth={2} />
                <Text style={styles.phaseText}>
                  Week spent in your{' '}
                  <Text style={styles.phaseHighlight}>{data.cyclePhase}</Text> — your movement
                  was adapted accordingly.
                </Text>
              </View>
            ) : null}

            <View style={styles.divider} />

            <View style={styles.motiveRow}>
              <Sparkles size={14} color={colors.peach} strokeWidth={2} />
              <Text style={styles.motiveText}>{motivationalLine}</Text>
            </View>

            <Pressable
              onPress={handleDismiss}
              style={styles.ctaBtn}
              accessibilityRole="button"
              accessibilityLabel="Start this week fresh"
            >
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctaGrad}
              >
                <Text style={styles.ctaText}>Start This Week Fresh</Text>
                <ChevronRight size={16} color="#FFF" strokeWidth={2.5} />
              </LinearGradient>
            </Pressable>

            <Text style={styles.footerNote}>This summary appears every Monday morning ✦</Text>
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 15, 12, 0.78)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.heroCard,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: SCREEN_H * 0.92,
    overflow: 'hidden',
  },
  glowOrb: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(208,120,135,0.15)',
    transform: [{ scaleX: 1.4 }],
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    padding: 4,
    marginBottom: 8,
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
    backgroundColor: colors.rose,
  },
  kicker: {
    fontSize: 10,
    fontFamily: fontFamilies.monoBold,
    color: colors.textOnDarkMuted,
    letterSpacing: 1.8,
  },
  weekLabel: {
    fontSize: 26,
    fontFamily: fontFamilies.sansBold,
    color: colors.textOnDark,
    marginBottom: 20,
    lineHeight: 32,
  },
  ringContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  ringOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: 'rgba(208,120,135,0.5)',
    padding: 4,
    backgroundColor: 'rgba(208,120,135,0.06)',
  },
  ringInner: {
    flex: 1,
    borderRadius: 66,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringPct: {
    fontSize: 32,
    fontFamily: fontFamilies.sansBold,
    color: '#FFFFFF',
    lineHeight: 36,
  },
  ringLabel: {
    fontSize: 11,
    fontFamily: fontFamilies.sansRegular,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.6,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  statCell: {
    width: (SCREEN_W - 48 - 10) / 2,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 6,
    alignItems: 'flex-start',
  },
  statValue: {
    fontSize: 22,
    fontFamily: fontFamilies.sansBold,
    color: colors.textOnDark,
    lineHeight: 26,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textOnDarkMuted,
    letterSpacing: 0.3,
  },
  phaseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(225,161,136,0.1)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(225,161,136,0.2)',
    marginBottom: 16,
  },
  phaseText: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textOnDarkMuted,
    lineHeight: 18,
  },
  phaseHighlight: {
    color: colors.peach,
    fontFamily: fontFamilies.sansMedium,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: 16,
  },
  motiveRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 24,
  },
  motiveText: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textOnDark,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  ctaBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
  },
  ctaGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  ctaText: {
    fontSize: 14,
    fontFamily: fontFamilies.sansBold,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 10.5,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textOnDarkMuted,
    letterSpacing: 0.5,
  },
});
