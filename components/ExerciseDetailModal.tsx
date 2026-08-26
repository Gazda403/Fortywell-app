import React, { useState, useEffect } from 'react';
import { Image } from 'expo-image';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { X, ShieldCheck, Dumbbell, Activity, Sparkles, Image as ImageIcon, Check } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { fontFamilies } from '../theme/typography';
import { ExerciseInfo, getExerciseInfo } from '../lib/exerciseDatabase';

interface ExerciseDetailModalProps {
  visible: boolean;
  exerciseName: string;
  onClose: () => void;
}

export const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = ({
  visible,
  exerciseName,
  onClose,
}) => {
  const [showGif, setShowGif] = useState<boolean>(true);
  const [frame, setFrame] = useState<number>(0);
  const [imgError, setImgError] = useState<boolean>(false);

  // Reset image error state whenever exercise changes or modal opens
  useEffect(() => {
    if (visible) {
      setImgError(false);
      setFrame(0);
    }
  }, [visible, exerciseName]);

  // Support ESC key on web
  useEffect(() => {
    if (!visible || Platform.OS !== 'web' || typeof window === 'undefined') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, onClose]);

  // Animated frame toggling for 2-frame exercise demonstrations
  useEffect(() => {
    if (!showGif || !visible || imgError) return;
    const interval = setInterval(() => {
      setFrame((prev) => (prev === 0 ? 1 : 0));
    }, 850);
    return () => clearInterval(interval);
  }, [showGif, visible, imgError]);

  if (!visible || !exerciseName) return null;

  const info: ExerciseInfo = getExerciseInfo(exerciseName);
  const isRealGif = info.gif_url && info.gif_url.toLowerCase().endsWith('.gif');
  const mediaUrl = showGif
    ? (isRealGif ? info.gif_url! : (frame === 0 ? info.image_url : (info.gif_url || info.image_url)))
    : info.image_url;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        
        <View style={styles.sheet}>
          {/* Top handle bar */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Fixed Sticky Header */}
          <View style={styles.header}>
            <View style={styles.headerTextCol}>
              <View style={styles.categoryBadge}>
                <Sparkles size={10} color={colors.primaryDark} />
                <Text style={styles.categoryTxt}>{(info.category || 'STRENGTH').toUpperCase()}</Text>
              </View>
              <Text style={styles.title} numberOfLines={2}>{info.name}</Text>
            </View>
            <Pressable 
              onPress={onClose} 
              style={styles.closeBtn} 
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              accessibilityRole="button"
              accessibilityLabel="Close exercise details"
            >
              <X size={20} color={colors.textPrimary} />
            </Pressable>
          </View>

          {/* Scrollable Content Body */}
          <ScrollView
            style={styles.scrollBody}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Visual Media Demonstration Card */}
            <View style={styles.mediaCard}>
              {!imgError && mediaUrl ? (
                <Image
                  source={{ uri: mediaUrl }}
                  style={styles.mediaImg}
                  contentFit="contain"
                  cachePolicy="memory-disk"
                  transition={150}
                  onError={() => setImgError(true)}
                />
              ) : (
                <View style={styles.fallbackMedia}>
                  <ImageIcon size={48} color={colors.textTertiary} />
                  <Text style={styles.fallbackTxt}>Form Demonstration</Text>
                </View>
              )}

              {info.gif_url && (
                <View style={styles.mediaToggleRow}>
                  <Pressable
                    style={[styles.toggleBtn, showGif && styles.toggleBtnActive]}
                    onPress={() => setShowGif(true)}
                  >
                    <Text style={[styles.toggleTxt, showGif && styles.toggleTxtActive]}>
                      ANIMATED MOTION
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.toggleBtn, !showGif && styles.toggleBtnActive]}
                    onPress={() => setShowGif(false)}
                  >
                    <Text style={[styles.toggleTxt, !showGif && styles.toggleTxtActive]}>
                      STILL POSE
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>

            {/* Quick Badges: Equipment & Joint Safety */}
            <View style={styles.metaRow}>
              <View style={styles.metaChip}>
                <Dumbbell size={13} color={colors.textSecondary} />
                <Text style={styles.metaChipTxt}>{info.equipment}</Text>
              </View>

              {(info.joint_safety || []).map((tag, idx) => (
                <View key={idx} style={styles.safetyChip}>
                  <ShieldCheck size={13} color={colors.sageDark} />
                  <Text style={styles.safetyChipTxt}>{tag}</Text>
                </View>
              ))}
            </View>

            {/* Primary & Secondary Muscle Targeting */}
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>TARGETED MUSCLES</Text>
              <View style={styles.tagsWrapper}>
                {(info.primary_muscles || []).map((muscle, idx) => (
                  <View key={`pri-${idx}`} style={styles.primaryTag}>
                    <Activity size={12} color="#FFF" />
                    <Text style={styles.primaryTagTxt}>Primary: {muscle}</Text>
                  </View>
                ))}
                {(info.secondary_muscles || []).map((muscle, idx) => (
                  <View key={`sec-${idx}`} style={styles.secondaryTag}>
                    <Text style={styles.secondaryTagTxt}>Secondary: {muscle}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Description Summary */}
            {info.description ? (
              <Text style={styles.descriptionTxt}>{info.description}</Text>
            ) : null}

            {/* Step by Step Execution Instructions */}
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>EXECUTION STEPS</Text>
              {(info.instructions || []).map((step, idx) => (
                <View key={idx} style={styles.stepRow}>
                  <View style={styles.stepNumBox}>
                    <Text style={styles.stepNumTxt}>{idx + 1}</Text>
                  </View>
                  <Text style={styles.stepTxt}>{step}</Text>
                </View>
              ))}
            </View>

            {/* Editorial Coaching Cue */}
            {info.coaching_cues && (
              <View style={styles.cueBox}>
                <Text style={styles.cueTitle}>COACHING CUE & ALIGNMENT</Text>
                <Text style={styles.cueTxt}>"{info.coaching_cues}"</Text>
              </View>
            )}
          </ScrollView>

          {/* Guaranteed Bottom Exit Button */}
          <View style={styles.footer}>
            <Pressable 
              style={styles.footerDoneBtn} 
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Done viewing exercise"
            >
              <Check size={16} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.footerDoneBtnTxt}>GOT IT • RETURN TO WORKOUT</Text>
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
    backgroundColor: 'rgba(28,21,17,0.6)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    width: '100%',
    maxWidth: 600,
    height: '90%',
    maxHeight: '92%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      },
      android: { elevation: 16 },
      web: {
        boxShadow: '0 -8px 30px rgba(0, 0, 0, 0.18)',
      },
      default: {},
    }),
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
    backgroundColor: '#FFFFFF',
  },
  handle: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(101,78,60,0.25)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(101,78,60,0.1)',
    backgroundColor: '#FFFFFF',
  },
  headerTextCol: {
    flex: 1,
    marginRight: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(201,70,91,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  categoryTxt: {
    fontSize: 9,
    fontFamily: fontFamilies.monoBold,
    color: colors.primaryDark,
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 18,
    fontFamily: fontFamilies.soria,
    color: colors.textPrimary,
    lineHeight: 23,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(101,78,60,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  mediaCard: {
    backgroundColor: '#F9F6F0',
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(101,78,60,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  mediaImg: {
    width: '100%',
    height: 220,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  fallbackMedia: {
    height: 180,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F5F1EB',
    borderRadius: 14,
  },
  fallbackTxt: {
    fontSize: 12,
    fontFamily: fontFamilies.monoMedium,
    color: colors.textTertiary,
  },
  mediaToggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  toggleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(101,78,60,0.08)',
  },
  toggleBtnActive: {
    backgroundColor: colors.primaryDark,
  },
  toggleTxt: {
    fontSize: 9,
    fontFamily: fontFamilies.monoBold,
    color: colors.textSecondary,
    letterSpacing: 0.8,
  },
  toggleTxtActive: {
    color: '#FFFFFF',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(101,78,60,0.06)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  metaChipTxt: {
    fontSize: 11,
    fontFamily: fontFamilies.monoMedium,
    color: colors.textSecondary,
  },
  safetyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(74,93,78,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  safetyChipTxt: {
    fontSize: 11,
    fontFamily: fontFamilies.monoMedium,
    color: colors.sageDark,
  },
  section: {
    marginTop: 10,
    marginBottom: 14,
  },
  sectionHeader: {
    fontSize: 10,
    fontFamily: fontFamilies.monoBold,
    color: colors.textTertiary,
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  tagsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  primaryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryDark,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  primaryTagTxt: {
    fontSize: 11,
    fontFamily: fontFamilies.monoMedium,
    color: '#FFFFFF',
  },
  secondaryTag: {
    backgroundColor: 'rgba(101,78,60,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  secondaryTagTxt: {
    fontSize: 11,
    fontFamily: fontFamilies.monoRegular,
    color: colors.textSecondary,
  },
  descriptionTxt: {
    fontSize: 13,
    fontFamily: fontFamilies.monoRegular,
    color: colors.textPrimary,
    lineHeight: 20,
    marginBottom: 16,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 10,
  },
  stepNumBox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(201,70,91,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumTxt: {
    fontSize: 11,
    fontFamily: fontFamilies.monoBold,
    color: colors.primaryDark,
  },
  stepTxt: {
    flex: 1,
    fontSize: 13,
    fontFamily: fontFamilies.monoRegular,
    color: colors.textPrimary,
    lineHeight: 19,
  },
  cueBox: {
    backgroundColor: 'rgba(201,70,91,0.06)',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.primaryDark,
  },
  cueTitle: {
    fontSize: 9,
    fontFamily: fontFamilies.monoBold,
    color: colors.primaryDark,
    letterSpacing: 1,
    marginBottom: 4,
  },
  cueTxt: {
    fontSize: 12,
    fontFamily: fontFamilies.monoRegular,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(101,78,60,0.1)',
  },
  footerDoneBtn: {
    backgroundColor: colors.primaryDark,
    borderRadius: 14,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: colors.primaryDark,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: { elevation: 3 },
      web: {
        cursor: 'pointer',
      },
      default: {},
    }),
  },
  footerDoneBtnTxt: {
    fontSize: 12,
    fontFamily: fontFamilies.monoBold,
    letterSpacing: 1,
    color: '#FFFFFF',
  },
});

