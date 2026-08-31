import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import {
  Sun,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  Droplets,
  Activity,
  Brain,
  Info,
  ChevronRight,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { fontFamilies } from '../theme/typography';
import { getExerciseInfo } from '../lib/exerciseDatabase';
import { useLanguage } from '../context/LanguageContext';

export interface MorningStretchItem {
  id: string;
  name: string;
  dbName: string;
  duration: string;
  focus: string;
}

export interface DayRoutineVariation {
  dayName: string;
  theme: string;
  stretches: MorningStretchItem[];
}

// 7 Day-of-Week Stretch Variations (Sunday = 0, Monday = 1, ..., Saturday = 6)
export const WEEKLY_STRETCH_ROUTINES: Record<number, DayRoutineVariation> = {
  0: {
    dayName: 'Sunday',
    theme: 'Sunday Decompression & Spinal Relief',
    stretches: [
      { id: 'sun-1', name: "Cat-Cow Segmental Mobility", dbName: "Cat-Cow Stretch", duration: '2 min', focus: 'Spinal Mobility' },
      { id: 'sun-2', name: "Child's Pose with Deep Breathing", dbName: "Child's Pose with Diaphragmatic Breathing", duration: '3 min', focus: 'Lats & Hips' },
      { id: 'sun-3', name: "Lying Figure-4 Glute Stretch", dbName: "Lying Figure-4 Glute Stretch", duration: '5 min', focus: 'Glutes & Piriformis' },
    ],
  },
  1: {
    dayName: 'Monday',
    theme: 'Monday Ignition & Hip Flexor Opening',
    stretches: [
      { id: 'mon-1', name: "Standing Hip Flexor Stretch", dbName: "Standing Hip Flexor Stretch", duration: '3 min', focus: 'Psoas & Quads' },
      { id: 'mon-2', name: "Lying Clamshells", dbName: "Lying Clamshells", duration: '3 min', focus: 'Glute Medius' },
      { id: 'mon-3', name: "90/90 Hip Rotation", dbName: "90/90 Hip Rotation (Seated)", duration: '4 min', focus: 'Hip Capsule' },
    ],
  },
  2: {
    dayName: 'Tuesday',
    theme: 'Tuesday Posture & Shoulder Reset',
    stretches: [
      { id: 'tue-1', name: "Open Book Thoracic Stretch", dbName: "Open Book Stretch (Side-Lying)", duration: '3 min', focus: 'Thoracic Spine' },
      { id: 'tue-2', name: "Prone Cobra Chest Lift", dbName: "Prone Cobra (Arms at Sides)", duration: '3 min', focus: 'Upper Back' },
      { id: 'tue-3', name: "Doorway Pec Stretch", dbName: "Doorway Pec Stretch", duration: '4 min', focus: 'Chest & Anterior Shoulders' },
    ],
  },
  3: {
    dayName: 'Wednesday',
    theme: 'Wednesday Core & Pelvic Alignment',
    stretches: [
      { id: 'wed-1', name: "Pelvic Tilts", dbName: "Pelvic Tilts", duration: '3 min', focus: 'Lower Back & Core' },
      { id: 'wed-2', name: "Bird-Dog Stability Hold", dbName: "Bird-Dog Hold", duration: '3 min', focus: 'Spinal Alignment' },
      { id: 'wed-3', name: "Supine Spinal Twist", dbName: "Supine Spinal Twist", duration: '4 min', focus: 'Lumbar Decompression' },
    ],
  },
  4: {
    dayName: 'Thursday',
    theme: 'Thursday Hamstring & Lower Back Release',
    stretches: [
      { id: 'thu-1', name: "Seated Forward Fold", dbName: "Seated Forward Fold", duration: '3 min', focus: 'Posterior Chain' },
      { id: 'thu-2', name: "Single-Leg RDL Reach-Down", dbName: "Single-Leg Romanian Deadlift Touch-Down", duration: '3 min', focus: 'Hamstrings & Balance' },
      { id: 'thu-3', name: "Lying Knee-to-Chest Hug", dbName: "Lying Knee-to-Chest Hug (Both Legs)", duration: '4 min', focus: 'Lower Back' },
    ],
  },
  5: {
    dayName: 'Friday',
    theme: 'Friday Glute Ignition & Lateral Stability',
    stretches: [
      { id: 'fri-1', name: "Iso-Hold Glute Bridge", dbName: "Iso-Hold Glute Bridge with Heel Drive", duration: '3 min', focus: 'Glute Max & Hamstrings' },
      { id: 'fri-2', name: "Side-Lying Hip Abduction", dbName: "Side-Lying Hip Abduction", duration: '3 min', focus: 'Hip Abductors' },
      { id: 'fri-3', name: "Pigeon Pose Hip Opener", dbName: "Pigeon Pose (or Figure-4 if Knee Sensitive)", duration: '4 min', focus: 'Deep Hips' },
    ],
  },
  6: {
    dayName: 'Saturday',
    theme: 'Saturday Full-Body Unwind & Un-Knotting',
    stretches: [
      { id: 'sat-1', name: "Thoracic Foam Roll", dbName: "Thoracic Foam Roll", duration: '3 min', focus: 'Mid-Back Mobilization' },
      { id: 'sat-2', name: "Wall Angels (Elbows Low)", dbName: "Wall Angels (Elbows Low)", duration: '3 min', focus: 'Posture & Scapulae' },
      { id: 'sat-3', name: "Child's Pose with Diaphragmatic Breathing", dbName: "Child's Pose with Diaphragmatic Breathing", duration: '4 min', focus: 'Full-Body Release' },
    ],
  },
};

interface MorningRoutineCardProps {
  onOpenExerciseDetail: (exerciseName: string) => void;
}

const MorningRoutineCardComponent: React.FC<MorningRoutineCardProps> = ({
  onOpenExerciseDetail,
}) => {
  // Checkbox state for 3 routine lines
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({
    water: false,
    stretching: false,
    reflection: false,
  });

  const { t } = useLanguage();
  // Get current day of week (0-6)
  const todayIndex = new Date().getDay();
  const todayRoutine = WEEKLY_STRETCH_ROUTINES[todayIndex] || WEEKLY_STRETCH_ROUTINES[3];

  const completedCount = Object.values(checkedItems).filter(Boolean).length;

  const toggleCheck = (key: string) => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (_) {}

    setCheckedItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <View style={s.card}>
      {/* ── HEADER ── */}
      <View style={s.headerRow}>
        <View style={s.headerLeft}>
          <View style={s.kickerBadge}>
            <Sun size={12} color={colors.primaryDark} />
            <Text style={s.kickerText}>{t('morningRoutine.kicker')}</Text>
          </View>
          <Text style={s.title}>{t('morningRoutine.title')}</Text>
          <Text style={s.subtitle}>
            {t('morningRoutine.subtitle')}
          </Text>
        </View>

        <View style={[s.progressBadge, completedCount === 3 && s.progressBadgeDone]}>
          <Sparkles size={11} color={completedCount === 3 ? '#FFFFFF' : colors.primaryDark} />
          <Text style={[s.progressText, completedCount === 3 && s.progressTextDone]}>
            {t('morningRoutine.progressDone', { done: completedCount })}
          </Text>
        </View>
      </View>

      {/* ── LINE 1: DRINK WATER ── */}
      <Pressable
        style={[s.itemRow, checkedItems.water && s.itemRowChecked]}
        onPress={() => toggleCheck('water')}
      >
        <View style={s.checkTouch}>
          {checkedItems.water ? (
            <CheckCircle2 size={22} color={colors.primary} fill="#F39EB0" />
          ) : (
            <Circle size={22} color={colors.textTertiary} />
          )}
        </View>
        <View style={s.itemContent}>
          <View style={s.itemTitleRow}>
            <Droplets size={14} color={colors.primaryDark} style={s.itemIcon} />
            <Text style={[s.itemTitle, checkedItems.water && s.itemTitleDone]}>
              {t('morningRoutine.waterTitle')}
            </Text>
          </View>
          <Text style={s.itemDesc}>
            {t('morningRoutine.waterDesc')}
          </Text>
        </View>
      </Pressable>

      <View style={s.divider} />

      {/* ── LINE 2: 10-MIN STRETCHING SESSION ── */}
      <View style={s.stretchSection}>
        <Pressable
          style={[s.itemRow, checkedItems.stretching && s.itemRowChecked]}
          onPress={() => toggleCheck('stretching')}
        >
          <View style={s.checkTouch}>
            {checkedItems.stretching ? (
              <CheckCircle2 size={22} color={colors.primary} fill="#F39EB0" />
            ) : (
              <Circle size={22} color={colors.textTertiary} />
            )}
          </View>
          <View style={s.itemContent}>
            <View style={s.itemTitleRow}>
              <Activity size={14} color={colors.primaryDark} style={s.itemIcon} />
              <Text style={[s.itemTitle, checkedItems.stretching && s.itemTitleDone]}>
                {t('morningRoutine.mobilityTitle')}
              </Text>
            </View>
            <Text style={s.itemDesc}>
              {todayRoutine.theme}
            </Text>
          </View>
        </Pressable>

        {/* ── SUB-ITEMS: 10 MIN WORTH OF TODAY'S STRETCHES ── */}
        <View style={s.stretchListCard}>
          <View style={s.stretchListHeader}>
            <Text style={s.todayThemeKicker}>{t('morningRoutine.routineKicker', { day: todayRoutine.dayName.toUpperCase() })}</Text>
            <View style={s.timeBadge}>
              <Clock size={10} color={colors.textSecondary} />
              <Text style={s.timeBadgeText}>{t('morningRoutine.tenMinTotal')}</Text>
            </View>
          </View>

          {todayRoutine.stretches.map((st) => {
            const exInfo = getExerciseInfo(st.dbName);
            return (
              <Pressable
                key={st.id}
                style={s.stretchRow}
                onPress={() => {
                  if (onOpenExerciseDetail) {
                    onOpenExerciseDetail(st.dbName);
                  }
                }}
              >
                <Image
                  source={{ uri: exInfo.image_url }}
                  style={s.stretchThumb}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
                <View style={s.stretchInfoCol}>
                  <Text style={s.stretchName} numberOfLines={1}>
                    {st.name}
                  </Text>
                  <Text style={s.stretchFocus}>
                    {st.focus} • <Text style={{ color: colors.primaryDark }}>{st.duration}</Text>
                  </Text>
                </View>
                <View style={s.infoIconBubble}>
                  <Info size={13} color={colors.primaryDark} />
                  <ChevronRight size={12} color={colors.primaryDark} />
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={s.divider} />

      {/* ── LINE 3: OPTIONAL 5-MIN SELF-REFLECTION ── */}
      <Pressable
        style={[s.itemRow, checkedItems.reflection && s.itemRowChecked]}
        onPress={() => toggleCheck('reflection')}
      >
        <View style={s.checkTouch}>
          {checkedItems.reflection ? (
            <CheckCircle2 size={22} color={colors.primary} fill="#F39EB0" />
          ) : (
            <Circle size={22} color={colors.textTertiary} />
          )}
        </View>
        <View style={s.itemContent}>
          <View style={s.itemTitleRow}>
            <Brain size={14} color={colors.primaryDark} style={s.itemIcon} />
            <Text style={[s.itemTitle, checkedItems.reflection && s.itemTitleDone]}>
              {t('morningRoutine.reflectionTitle')}
            </Text>
            <View style={s.optionalTag}>
              <Text style={s.optionalTagText}>{t('morningRoutine.optionalTag')}</Text>
            </View>
          </View>
          <Text style={s.itemDesc}>
            {t('morningRoutine.reflectionDesc')}
          </Text>
        </View>
      </Pressable>
    </View>
  );
};

const s = StyleSheet.create({
  card: {
    backgroundColor: '#FAF5EF',
    borderRadius: 24,
    padding: 18,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(201, 99, 116, 0.15)',
    ...Platform.select({
      ios: {
        shadowColor: '#3A2E2B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 4px 16px rgba(58, 46, 43, 0.08)',
      },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
    paddingRight: 8,
  },
  kickerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(201, 99, 116, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  kickerText: {
    fontSize: 9,
    fontFamily: fontFamilies.monoBold,
    color: colors.primaryDark,
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 18,
    fontFamily: fontFamilies.soria,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: fontFamilies.monoRegular,
    color: colors.textSecondary,
    marginTop: 2,
  },
  progressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(201, 99, 116, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  progressBadgeDone: {
    backgroundColor: colors.primary,
  },
  progressText: {
    fontSize: 11,
    fontFamily: fontFamilies.monoBold,
    color: colors.primaryDark,
  },
  progressTextDone: {
    color: '#FFFFFF',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginVertical: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 4,
  },
  itemRowChecked: {
    opacity: 0.85,
  },
  checkTouch: {
    marginRight: 10,
    marginTop: 2,
  },
  itemContent: {
    flex: 1,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  itemIcon: {
    marginRight: 2,
  },
  itemTitle: {
    fontSize: 14,
    fontFamily: fontFamilies.monoBold,
    color: colors.textPrimary,
  },
  itemTitleDone: {
    textDecorationLine: 'line-through',
    color: colors.textTertiary,
  },
  itemDesc: {
    fontSize: 12,
    fontFamily: fontFamilies.monoRegular,
    color: colors.textSecondary,
    marginTop: 3,
    lineHeight: 16,
  },
  optionalTag: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  optionalTagText: {
    fontSize: 8,
    fontFamily: fontFamilies.monoBold,
    color: colors.textTertiary,
    letterSpacing: 0.5,
  },
  stretchSection: {
    marginTop: 2,
  },
  stretchListCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginTop: 10,
    marginLeft: 32,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  stretchListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  todayThemeKicker: {
    fontSize: 10,
    fontFamily: fontFamilies.monoBold,
    color: colors.primaryDark,
    letterSpacing: 0.5,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.backgroundSubtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  timeBadgeText: {
    fontSize: 8,
    fontFamily: fontFamilies.monoBold,
    color: colors.textSecondary,
  },
  stretchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.03)',
  },
  stretchThumb: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.backgroundSubtle,
    marginRight: 10,
  },
  stretchInfoCol: {
    flex: 1,
  },
  stretchName: {
    fontSize: 12,
    fontFamily: fontFamilies.monoBold,
    color: colors.textPrimary,
  },
  stretchFocus: {
    fontSize: 10,
    fontFamily: fontFamilies.monoRegular,
    color: colors.textTertiary,
    marginTop: 1,
  },
  infoIconBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(201, 99, 116, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 2,
  },
});

export const MorningRoutineCard = React.memo(MorningRoutineCardComponent);
