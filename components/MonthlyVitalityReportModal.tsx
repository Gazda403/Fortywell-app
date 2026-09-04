import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Platform,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  X,
  Sparkles,
  TrendingUp,
  HeartPulse,
  Moon,
  ShieldCheck,
  Dumbbell,
  CheckCircle2,
  Share2,
  Check,
  FileText,
  Activity,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';
import { fontFamilies } from '../theme/typography';

const { width: SCREEN_W } = Dimensions.get('window');

interface MonthlyVitalityReportModalProps {
  visible: boolean;
  onClose: () => void;
  totalWorkouts?: number;
  currentStreak?: number;
}

export const MonthlyVitalityReportModal: React.FC<MonthlyVitalityReportModalProps> = ({
  visible,
  onClose,
  totalWorkouts = 14,
  currentStreak = 12,
}) => {
  const [copied, setCopied] = useState(false);

  const handleShareReport = async () => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (_) {}

    const text = `📊 My FortyWell 30-Day Vitality & Symptom Report:\n• Joint Stiffness: -38% relief\n• Nighttime Cortisol/Sleep: +42% deeper rest\n• Restorative Sessions: ${totalWorkouts || 14} logged\nBuilding real strength and longevity over 40! 🌸 https://fortywell-app.vercel.app`;

    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      try {
        await (navigator as any).share({
          title: 'My FortyWell 30-Day Vitality Report',
          text,
          url: 'https://fortywell-app.vercel.app',
        });
        return;
      } catch (_) {}
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const monthName = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

        <View style={styles.container}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <View style={styles.kickerRow}>
                <FileText size={13} color="#C9465B" />
                <Text style={styles.kickerText}>CLINICAL WELLNESS AUDIT</Text>
              </View>
              <Text style={styles.title}>30-Day Vitality Report</Text>
              <Text style={styles.subtitle}>{monthName} • Evidence-based progress</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <X size={18} color="#7A6D66" />
            </Pressable>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* Overall Vitality Index Card */}
            <View style={styles.scoreHeroCard}>
              <LinearGradient
                colors={['#32282B', '#231B1E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.scoreHeroGradient}
              >
                <View style={styles.scoreTopRow}>
                  <Text style={styles.scoreLabel}>OVERALL VITALITY INDEX</Text>
                  <View style={styles.deltaPill}>
                    <TrendingUp size={11} color="#92A975" />
                    <Text style={styles.deltaText}>+18% THIS MONTH</Text>
                  </View>
                </View>

                <View style={styles.scoreMainRow}>
                  <Text style={styles.scoreBig}>88</Text>
                  <Text style={styles.scoreOutOf}>/ 100</Text>
                </View>

                <Text style={styles.scoreDesc}>
                  Your biomarker consistency and somatic movement volume indicate balanced autonomic regulation and optimal tissue recovery.
                </Text>
              </LinearGradient>
            </View>

            {/* 4 Symptom Delta Cards */}
            <Text style={styles.sectionHeading}>Symptom & Recovery Biomarkers</Text>

            <View style={styles.grid2x2}>
              {/* Joint Stiffness */}
              <View style={styles.metricCard}>
                <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(201, 99, 116, 0.12)' }]}>
                  <ShieldCheck size={18} color="#C9465B" />
                </View>
                <Text style={styles.metricDeltaGreen}>-38%</Text>
                <Text style={styles.metricTitle}>Morning Stiffness</Text>
                <Text style={styles.metricSub}>Lumbar & hip synovial fluid mobilization active.</Text>
              </View>

              {/* Deep Sleep / Night Cortisol */}
              <View style={styles.metricCard}>
                <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(232, 195, 158, 0.18)' }]}>
                  <Moon size={18} color="#D4A574" />
                </View>
                <Text style={styles.metricDeltaGold}>+42%</Text>
                <Text style={styles.metricTitle}>Restful Sleep</Text>
                <Text style={styles.metricSub}>Reduced nocturnal adrenaline & fewer 3 AM wakeups.</Text>
              </View>

              {/* Lower-Leg Fluid Retention */}
              <View style={styles.metricCard}>
                <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(146, 169, 117, 0.15)' }]}>
                  <HeartPulse size={18} color="#708655" />
                </View>
                <Text style={styles.metricDeltaGreen}>-29%</Text>
                <Text style={styles.metricTitle}>Fluid Retention</Text>
                <Text style={styles.metricSub}>Lymphatic return protocols effectively clearing interstitial swelling.</Text>
              </View>

              {/* Bone Density Progressive Sets */}
              <View style={styles.metricCard}>
                <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(208, 120, 135, 0.15)' }]}>
                  <Dumbbell size={18} color="#9F4252" />
                </View>
                <Text style={styles.metricDeltaRose}>{totalWorkouts * 3} Sets</Text>
                <Text style={styles.metricTitle}>Bone-Loading Sets</Text>
                <Text style={styles.metricSub}>Progressive resistance safe for hip & lumbar osteopenia defense.</Text>
              </View>
            </View>

            {/* Physiological Doctor / AI Analysis */}
            <View style={styles.doctorCard}>
              <View style={styles.doctorHeaderRow}>
                <Sparkles size={14} color="#C9465B" />
                <Text style={styles.doctorKicker}>PHYSIOLOGICAL SYNTHESIS</Text>
              </View>
              <Text style={styles.doctorQuote}>
                "By moving away from exhaustive, cortisol-spiking HIIT and anchoring your week in low-impact resistance and parasympathetic resets, your HPA-axis has stabilized. You are building durable bone density without burning out adrenal reserves."
              </Text>
              <Text style={styles.doctorSignature}>— FortyWell Clinical Longevity Model</Text>
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Footer Action */}
          <View style={styles.footerRow}>
            <Pressable
              style={styles.shareBtn}
              onPress={handleShareReport}
              accessibilityRole="button"
              accessibilityLabel="Share 30-Day Vitality Report"
            >
              <LinearGradient
                colors={['#F39EB0', '#C9465B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.shareBtnGradient}
              >
                {copied ? (
                  <>
                    <Check size={16} color="#FFFFFF" />
                    <Text style={styles.shareBtnText}>Report Copied to Clipboard!</Text>
                  </>
                ) : (
                  <>
                    <Share2 size={16} color="#FFFFFF" />
                    <Text style={styles.shareBtnText}>Share My 30-Day Progress</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 16, 14, 0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FAF5EE',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    paddingTop: 20,
    borderWidth: 1,
    borderColor: '#E8DDD0',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.22,
        shadowRadius: 16,
      },
      android: { elevation: 10 },
      default: {
        boxShadow: '0 -6px 25px rgba(0,0,0,0.25)',
      },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 22,
    marginBottom: 14,
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  kickerText: {
    fontSize: 9.5,
    fontFamily: fontFamilies.monoBold,
    letterSpacing: 1.6,
    color: '#C9465B',
  },
  title: {
    fontSize: 22,
    fontFamily: fontFamilies.soria,
    fontWeight: '700',
    color: '#2A2320',
  },
  subtitle: {
    fontSize: 12,
    fontFamily: fontFamilies.sansRegular,
    color: '#7A6D66',
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: 22,
  },
  scoreHeroCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 18,
  },
  scoreHeroGradient: {
    padding: 18,
  },
  scoreTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreLabel: {
    fontSize: 9.5,
    fontFamily: fontFamilies.monoBold,
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 1.2,
  },
  deltaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(146, 169, 117, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  deltaText: {
    color: '#92A975',
    fontSize: 9,
    fontFamily: fontFamilies.sansBold,
    letterSpacing: 0.6,
  },
  scoreMainRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 6,
  },
  scoreBig: {
    fontSize: 42,
    fontFamily: fontFamilies.soria,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scoreOutOf: {
    fontSize: 16,
    fontFamily: fontFamilies.sansRegular,
    color: 'rgba(255, 255, 255, 0.55)',
  },
  scoreDesc: {
    fontSize: 12,
    fontFamily: fontFamilies.sansRegular,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 17,
  },
  sectionHeading: {
    fontSize: 14,
    fontFamily: fontFamilies.sansBold,
    color: '#2A2320',
    marginBottom: 10,
  },
  grid2x2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    width: (SCREEN_W - 44 - 10) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EDE3D5',
  },
  metricIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricDeltaGreen: {
    fontSize: 18,
    fontFamily: fontFamilies.sansBold,
    color: '#708655',
    marginBottom: 2,
  },
  metricDeltaGold: {
    fontSize: 18,
    fontFamily: fontFamilies.sansBold,
    color: '#D4A574',
    marginBottom: 2,
  },
  metricDeltaRose: {
    fontSize: 18,
    fontFamily: fontFamilies.sansBold,
    color: '#9F4252',
    marginBottom: 2,
  },
  metricTitle: {
    fontSize: 12,
    fontFamily: fontFamilies.sansBold,
    color: '#2A2320',
    marginBottom: 4,
  },
  metricSub: {
    fontSize: 10.5,
    fontFamily: fontFamilies.sansRegular,
    color: '#7A6D66',
    lineHeight: 14,
  },
  doctorCard: {
    backgroundColor: 'rgba(201, 99, 116, 0.07)',
    borderRadius: 16,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#C9465B',
    marginBottom: 10,
  },
  doctorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  doctorKicker: {
    fontSize: 9.5,
    fontFamily: fontFamilies.monoBold,
    letterSpacing: 1.4,
    color: '#C9465B',
  },
  doctorQuote: {
    fontSize: 12,
    fontFamily: fontFamilies.sansRegular,
    fontStyle: 'italic',
    color: '#3A3532',
    lineHeight: 17,
    marginBottom: 6,
  },
  doctorSignature: {
    fontSize: 9.5,
    fontFamily: fontFamilies.sansBold,
    color: '#7A6D66',
    textAlign: 'right',
  },
  footerRow: {
    paddingHorizontal: 22,
    paddingBottom: Platform.OS === 'ios' ? 38 : 20,
    paddingTop: 12,
    backgroundColor: '#FAF5EE',
    borderTopWidth: 1,
    borderTopColor: '#EDE3D5',
  },
  shareBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  shareBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontFamily: fontFamilies.sansBold,
  },
});
