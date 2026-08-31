import React, { useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence } from 'react-native-reanimated';
import {
  X,
  Clock,
  ShieldCheck,
  Dumbbell,
  Flame,
  CheckCircle2,
  Info,
  Play,
  RotateCcw,
  Heart,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { fontFamilies } from '../theme/typography';
import { Workout, Exercise } from '../hooks/useWorkouts';
import { getExerciseInfo } from '../lib/exerciseDatabase';
import { useFavorites } from '../lib/useFavorites';
import { useLanguage } from '../context/LanguageContext';

interface WorkoutDetailModalProps {
  workout: Workout | null;
  visible: boolean;
  onClose: () => void;
  onStart?: (workout: Workout) => void;
  // Optional external favorite control — if not provided, hook is used internally
  isFavorite?: boolean;
  onToggleFavorite?: (slug: string) => void;
}

export const WorkoutDetailModal: React.FC<WorkoutDetailModalProps> = ({
  workout,
  visible,
  onClose,
  onStart,
  isFavorite: isFavoriteProp,
  onToggleFavorite,
}) => {
  const { t } = useLanguage();
  // Internal favorites support when not controlled externally
  const { isFavorite: isFavHook, toggleFavorite: toggleFavHook } = useFavorites();
  const heartScale = useSharedValue(1);

  const isFav = isFavoriteProp !== undefined
    ? isFavoriteProp
    : (workout ? isFavHook(workout.slug) : false);

  const handleHeartPress = useCallback(() => {
    if (!workout) return;
    // Bounce animation
    heartScale.value = withSequence(
      withSpring(1.35, { damping: 4, stiffness: 350 }),
      withSpring(1, { damping: 8, stiffness: 200 })
    );
    try { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch (_) {}
    if (onToggleFavorite) {
      onToggleFavorite(workout.slug);
    } else {
      toggleFavHook(workout.slug);
    }
  }, [workout, onToggleFavorite, toggleFavHook, heartScale]);

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));
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

  if (!visible || !workout) return null;

  const getEquipmentLabel = (eq: string) => {
    switch (eq) {
      case 'home_bodyweight':
        return t('workoutDetail.equipmentLabels.bodyweight');
      case 'home_dumbbells_bands':
        return t('workoutDetail.equipmentLabels.dumbbellsBands');
      case 'gym_machines_free_weights':
        return t('workoutDetail.equipmentLabels.gym');
      default:
        return eq;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header Bar */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleWrap}>
              <Text style={styles.kickerText}>{t('workoutDetail.kicker')}</Text>
              <Text style={styles.modalTitle}>{workout.title}</Text>
            </View>
            <View style={styles.headerActions}>
              {/* Heart / Favorite button */}
              <Pressable onPress={handleHeartPress} style={styles.heartBtn} hitSlop={10}>
                <Animated.View style={heartStyle}>
                  <Heart
                    size={22}
                    color={isFav ? colors.rose : colors.textTertiary}
                    fill={isFav ? colors.rose : 'transparent'}
                    strokeWidth={2}
                  />
                </Animated.View>
              </Pressable>
              <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={10}>
                <X size={20} color={colors.textPrimary} />
              </Pressable>
            </View>
          </View>

          <ScrollView
            style={styles.modalBody}
            contentContainerStyle={styles.modalBodyContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Hero Badge Row */}
            <View style={styles.badgeRow}>
              <View style={styles.pillBadge}>
                <Clock size={12} color={colors.primaryDark} />
                <Text style={styles.pillBadgeText}>{t('home.minutesCount', { count: workout.duration_minutes })}</Text>
              </View>
              <View style={[styles.pillBadge, { backgroundColor: colors.sageSoft }]}>
                <Dumbbell size={12} color={colors.sageDark} />
                <Text style={[styles.pillBadgeText, { color: colors.sageDark }]}>
                  {getEquipmentLabel(workout.equipment)}
                </Text>
              </View>
              <View style={styles.pillBadge}>
                <Flame size={12} color={colors.primary} />
                <Text style={styles.pillBadgeText}>{workout.energy_level.toUpperCase()}</Text>
              </View>
            </View>

            {/* Description */}
            <Text style={styles.descriptionText}>{workout.description}</Text>

            {/* Joint Safety Banner */}
            {workout.joint_sensitivities_safe && workout.joint_sensitivities_safe.length > 0 && (
              <View style={styles.jointSafetyCard}>
                <ShieldCheck size={16} color={colors.sageDark} />
                <Text style={styles.jointSafetyText}>
                  {t('workoutDetail.jointSafeFor', { areas: workout.joint_sensitivities_safe.join(', ').toUpperCase() })}
                </Text>
              </View>
            )}

            {/* WARMUP BLOCK */}
            {workout.warmup && workout.warmup.length > 0 && (
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionTitle}>{t('workoutDetail.warmupSection')}</Text>
                {workout.warmup.map((ex, idx) => {
                  const imgUri = ex.image_url || getExerciseInfo(ex.name).image_url;
                  return (
                    <View key={`w-${idx}`} style={styles.exerciseCard}>
                      {imgUri ? (
                        <Image
                          source={{ uri: imgUri }}
                          style={styles.exerciseImage}
                          contentFit="cover"
                          cachePolicy="memory-disk"
                          transition={150}
                        />
                      ) : null}
                      <View style={styles.exerciseDetails}>
                        <Text style={styles.exerciseName}>{ex.name}</Text>
                        {ex.duration && <Text style={styles.exerciseMeta}>{t('workoutDetail.durationLabel', { duration: ex.duration })}</Text>}
                        {ex.notes && <Text style={styles.exerciseNotes}>💡 {ex.notes}</Text>}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* MAIN BLOCKS */}
            {workout.main_blocks && workout.main_blocks.length > 0 && (
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionTitle}>{t('workoutDetail.strengthSection')}</Text>
                {workout.main_blocks.map((block, bIdx) => (
                  <View key={`b-${bIdx}`} style={styles.mainBlockWrap}>
                    <Text style={styles.blockName}>{block.block_name}</Text>
                    {block.exercises.map((ex, eIdx) => {
                      const imgUri = ex.image_url || getExerciseInfo(ex.name).image_url;
                      return (
                        <View key={`e-${bIdx}-${eIdx}`} style={styles.exerciseCard}>
                          {imgUri ? (
                            <Image
                              source={{ uri: imgUri }}
                              style={styles.exerciseImage}
                              contentFit="cover"
                              cachePolicy="memory-disk"
                              transition={150}
                            />
                          ) : null}
                          <View style={styles.exerciseDetails}>
                            <Text style={styles.exerciseName}>{ex.name}</Text>
                            <View style={styles.prescRow}>
                              {ex.sets && <Text style={styles.prescBadge}>{t('workoutDetail.setsCount', { count: ex.sets })}</Text>}
                              {ex.reps && <Text style={styles.prescBadge}>{ex.reps}</Text>}
                              {ex.tempo && <Text style={styles.prescBadge}>{t('workoutDetail.tempoLabel', { tempo: ex.tempo })}</Text>}
                              {ex.rest && <Text style={styles.prescBadge}>{t('workoutDetail.restLabel', { rest: ex.rest })}</Text>}
                            </View>
                            {ex.coaching_cue && (
                              <Text style={styles.coachingCue}>🎯 <Text style={{ fontFamily: fontFamilies.monoBold }}>{t('workoutDetail.coachCueLabel')}</Text> {ex.coaching_cue}</Text>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ))}
              </View>
            )}

            {/* COOLDOWN BLOCK */}
            {workout.cooldown && workout.cooldown.length > 0 && (
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionTitle}>{t('workoutDetail.cooldownSection')}</Text>
                {workout.cooldown.map((ex, idx) => {
                  const imgUri = ex.image_url || getExerciseInfo(ex.name).image_url;
                  return (
                    <View key={`c-${idx}`} style={styles.exerciseCard}>
                      {imgUri ? (
                        <Image
                          source={{ uri: imgUri }}
                          style={styles.exerciseImage}
                          contentFit="cover"
                          cachePolicy="memory-disk"
                          transition={150}
                        />
                      ) : null}
                      <View style={styles.exerciseDetails}>
                        <Text style={styles.exerciseName}>{ex.name}</Text>
                        {ex.duration && <Text style={styles.exerciseMeta}>{t('workoutDetail.durationLabel', { duration: ex.duration })}</Text>}
                        {ex.notes && <Text style={styles.exerciseNotes}>💡 {ex.notes}</Text>}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            <View style={{ height: 30 }} />
          </ScrollView>

          {/* Footer CTA */}
          <View style={styles.modalFooter}>
            <Pressable
              onPress={() => {
                onClose();
                if (onStart) onStart(workout);
              }}
              style={styles.startBtn}
            >
              <LinearGradient
                colors={['#F39EB0', '#C9465B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFillObject}
              />
              <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
              <Text style={styles.startBtnText}>{t('workoutDetail.startSessionBtn')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalContainer: {
    width: '100%',
    maxWidth: 600,
    height: '90%',
    maxHeight: '92%',
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(101, 78, 60, 0.1)',
  },
  headerTitleWrap: {
    flex: 1,
    paddingRight: 10,
  },
  kickerText: {
    fontSize: 10,
    fontFamily: fontFamilies.monoBold,
    letterSpacing: 1.5,
    color: colors.primaryDark,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'PlayfairDisplay-Bold',
    color: colors.textPrimary,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(101, 78, 60, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heartBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(208, 90, 110, 0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    flex: 1,
  },
  modalBodyContent: {
    padding: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(201, 99, 116, 0.12)',
  },
  pillBadgeText: {
    fontSize: 11,
    fontFamily: fontFamilies.monoBold,
    color: colors.primaryDark,
  },
  descriptionText: {
    fontSize: 13,
    fontFamily: fontFamilies.monoRegular,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  jointSafetyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 14,
    backgroundColor: colors.sageSoft,
    borderWidth: 1,
    borderColor: 'rgba(146, 169, 117, 0.3)',
    marginBottom: 20,
  },
  jointSafetyText: {
    flex: 1,
    fontSize: 11,
    fontFamily: fontFamilies.monoRegular,
    color: colors.sageDark,
  },
  boldText: {
    fontFamily: fontFamilies.monoBold,
  },
  sectionBlock: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: fontFamilies.monoBold,
    letterSpacing: 1.2,
    color: colors.textPrimary,
    marginBottom: 12,
  },
  mainBlockWrap: {
    marginBottom: 16,
  },
  blockName: {
    fontSize: 13,
    fontFamily: 'PlayfairDisplay-Bold',
    color: colors.primaryDark,
    marginBottom: 8,
  },
  exerciseCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(101, 78, 60, 0.08)',
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  exerciseImage: {
    width: 68,
    height: 68,
    borderRadius: 12,
    backgroundColor: 'rgba(101, 78, 60, 0.06)',
  },
  exerciseDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  exerciseName: {
    fontSize: 14,
    fontFamily: fontFamilies.monoBold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  exerciseMeta: {
    fontSize: 11,
    fontFamily: fontFamilies.monoMedium,
    color: colors.textTertiary,
  },
  exerciseNotes: {
    fontSize: 11,
    fontFamily: fontFamilies.monoRegular,
    color: colors.textSecondary,
    marginTop: 2,
  },
  prescRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginVertical: 4,
  },
  prescBadge: {
    fontSize: 10,
    fontFamily: fontFamilies.monoBold,
    color: colors.primaryDark,
    backgroundColor: 'rgba(201, 99, 116, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  coachingCue: {
    fontSize: 11,
    fontFamily: fontFamilies.monoRegular,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  modalFooter: {
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(101, 78, 60, 0.1)',
  },
  startBtn: {
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  startBtnText: {
    fontSize: 13,
    fontFamily: fontFamilies.monoBold,
    letterSpacing: 1.2,
    color: '#FFFFFF',
  },
});
