import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Dimensions,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  ChevronDown,
  Sparkles,
  Play,
  PlusCircle,
  Clock,
  Dumbbell,
  Compass,
  ArrowRight,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { fontFamilies } from '../theme/typography';
import { Workout } from '../hooks/useWorkouts';

const { height: SCREEN_H } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_H * 0.68;

interface QuickLaunchSheetProps {
  visible: boolean;
  onClose: () => void;
  personalizedWorkout: Workout | null;
  matchReason?: string;
  onSelectWorkout: (workout: Workout) => void;
  onExploreAll: () => void;
  onStartEmpty: () => void;
}

export const QuickLaunchSheet: React.FC<QuickLaunchSheetProps> = ({
  visible,
  onClose,
  personalizedWorkout,
  matchReason,
  onSelectWorkout,
  onExploreAll,
  onStartEmpty,
}) => {
  if (!visible) return null;

  const handleMinimize = () => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (_) {}
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalRoot}>
        {/* Dimmed Backdrop */}
        <Pressable style={styles.backdrop} onPress={handleMinimize} />

        {/* 2/3 Height Sheet */}
        <View style={styles.sheetContainer}>
          {/* Top Minimize Handle & Arrow Bar */}
          <Pressable
            onPress={handleMinimize}
            style={styles.topHandleBar}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Minimize popup sheet"
          >
            <View style={styles.grabberPill} />
            <View style={styles.minimizeBtn}>
              <ChevronDown size={20} color={colors.primaryDark} strokeWidth={2.6} />
              <Text style={styles.minimizeText}>MINIMIZE</Text>
            </View>
          </Pressable>

          <ScrollView
            style={styles.sheetContent}
            contentContainerStyle={styles.sheetScrollBody}
            showsVerticalScrollIndicator={false}
          >
            {/* Header Title */}
            <View style={styles.sheetHeader}>
              <View style={styles.headerKickerRow}>
                <Sparkles size={13} color={colors.primaryDark} />
                <Text style={styles.headerKicker}>QUICK ACTION</Text>
              </View>
              <Text style={styles.sheetTitle}>Ready to move?</Text>
              <Text style={styles.sheetSubtitle}>
                Choose your path today — dive into your custom plan or start a new workout.
              </Text>
            </View>

            {/* ── CARD 1: USE PERSONALIZED WORKOUT (HERO) ── */}
            {personalizedWorkout && (
              <Pressable
                onPress={() => {
                  onSelectWorkout(personalizedWorkout);
                }}
                style={styles.actionCardHero}
                accessibilityRole="button"
                accessibilityLabel={`Use personalized workout: ${personalizedWorkout.title}`}
              >
                <LinearGradient
                  colors={['#F39EB0', '#C9465B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFillObject}
                />

                <View style={styles.cardHeroBadgeRow}>
                  <View style={styles.heroMatchBadge}>
                    <Sparkles size={10} color="#FFFFFF" />
                    <Text style={styles.heroMatchBadgeText}>TODAY'S PRESCRIBED PLAN</Text>
                  </View>
                  <View style={styles.heroDurationPill}>
                    <Clock size={11} color="#FFFFFF" />
                    <Text style={styles.heroDurationText}>{personalizedWorkout.duration_minutes} Mins</Text>
                  </View>
                </View>

                <Text style={styles.cardHeroTitle}>{personalizedWorkout.title}</Text>
                <Text style={styles.cardHeroDescription} numberOfLines={2}>
                  {personalizedWorkout.description}
                </Text>

                {matchReason && (
                  <View style={styles.reasonTag}>
                    <Text style={styles.reasonTagText}>{matchReason}</Text>
                  </View>
                )}

                {/* Action Button inside card */}
                <View style={styles.cardHeroBtn}>
                  <Play size={14} color="#C9465B" fill="#C9465B" />
                  <Text style={styles.cardHeroBtnText}>START PERSONALIZED WORKOUT</Text>
                  <ArrowRight size={14} color="#C9465B" strokeWidth={2.2} />
                </View>
              </Pressable>
            )}

            {/* ── CARD 2: START NEW / CUSTOM WORKOUT ── */}
            <Pressable
              onPress={() => {
                onExploreAll();
              }}
              style={styles.actionCardSecondary}
              accessibilityRole="button"
              accessibilityLabel="Explore full workout library"
            >
              <View style={styles.secondaryLeft}>
                <View style={styles.secondaryIconWrap}>
                  <Compass size={20} color={colors.sageDark} />
                </View>
                <View style={styles.secondaryTextWrap}>
                  <View style={styles.secondaryTagRow}>
                    <Text style={styles.secondaryTag}>20+ S&C PROTOCOLS</Text>
                  </View>
                  <Text style={styles.secondaryTitle}>Explore All Workouts</Text>
                  <Text style={styles.secondarySubtitle}>
                    Choose from Bodyweight, Dumbbells, Gym, or Somatic Recovery.
                  </Text>
                </View>
              </View>
              <View style={styles.secondaryArrowCircle}>
                <ArrowRight size={14} color={colors.textPrimary} />
              </View>
            </Pressable>

            {/* ── CARD 3: START EMPTY WORKOUT ── */}
            <Pressable
              onPress={() => {
                onStartEmpty();
              }}
              style={styles.actionCardEmpty}
              accessibilityRole="button"
              accessibilityLabel="Start empty workout session"
            >
              <View style={styles.emptyLeft}>
                <View style={styles.emptyIconWrap}>
                  <PlusCircle size={20} color={colors.primaryDark} />
                </View>
                <View style={styles.emptyTextWrap}>
                  <Text style={styles.emptyTag}>BUILD YOUR OWN</Text>
                  <Text style={styles.emptyTitle}>Empty Workout</Text>
                  <Text style={styles.emptySub}>
                    Start a blank session and add exercises freely.
                  </Text>
                </View>
              </View>
              <View style={styles.emptyArrow}>
                <ArrowRight size={14} color={colors.textPrimary} />
              </View>
            </Pressable>

            <View style={{ height: 30 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sheetContainer: {
    height: SHEET_HEIGHT,
    backgroundColor: colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.8)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      },
      android: { elevation: 16 },
      default: {},
    }),
  },
  topHandleBar: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(101, 78, 60, 0.08)',
  },
  grabberPill: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(101, 78, 60, 0.25)',
    marginBottom: 6,
  },
  minimizeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 2,
  },
  minimizeText: {
    fontSize: 9,
    fontFamily: fontFamilies.monoBold,
    letterSpacing: 1.5,
    color: colors.primaryDark,
  },
  sheetContent: {
    flex: 1,
  },
  sheetScrollBody: {
    padding: 20,
    paddingTop: 16,
  },
  sheetHeader: {
    marginBottom: 18,
  },
  headerKickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  headerKicker: {
    fontSize: 10,
    fontFamily: fontFamilies.monoBold,
    letterSpacing: 1.5,
    color: colors.primaryDark,
  },
  sheetTitle: {
    fontSize: 24,
    fontFamily: 'PlayfairDisplay-Bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  sheetSubtitle: {
    fontSize: 12,
    fontFamily: fontFamilies.monoRegular,
    color: colors.textSecondary,
    lineHeight: 18,
  },

  // Hero Personalized Card
  actionCardHero: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#C9465B',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
      default: {},
    }),
  },
  cardHeroBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  heroMatchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  heroMatchBadgeText: {
    fontSize: 9,
    fontFamily: fontFamilies.monoBold,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  heroDurationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroDurationText: {
    fontSize: 11,
    fontFamily: fontFamilies.monoMedium,
    color: 'rgba(255, 255, 255, 0.95)',
  },
  cardHeroTitle: {
    fontSize: 20,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  cardHeroDescription: {
    fontSize: 12,
    fontFamily: fontFamilies.monoRegular,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
    marginBottom: 10,
  },
  reasonTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 14,
  },
  reasonTagText: {
    fontSize: 10,
    fontFamily: fontFamilies.monoMedium,
    color: '#FFFFFF',
  },
  cardHeroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    height: 44,
    borderRadius: 22,
  },
  cardHeroBtnText: {
    fontSize: 11,
    fontFamily: fontFamilies.monoBold,
    letterSpacing: 1,
    color: '#C9465B',
  },

  // Secondary Custom Card
  actionCardSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(101, 78, 60, 0.1)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  secondaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  secondaryIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.sageSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryTextWrap: {
    flex: 1,
  },
  secondaryTagRow: {
    marginBottom: 2,
  },
  secondaryTag: {
    fontSize: 9,
    fontFamily: fontFamilies.monoBold,
    letterSpacing: 1,
    color: colors.sageDark,
  },
  secondaryTitle: {
    fontSize: 16,
    fontFamily: 'PlayfairDisplay-Bold',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  secondarySubtitle: {
    fontSize: 11,
    fontFamily: fontFamilies.monoRegular,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  secondaryArrowCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(101, 78, 60, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty workout card
  actionCardEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(201, 70, 91, 0.04)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(201, 70, 91, 0.15)',
    borderStyle: 'dashed',
  },
  emptyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  emptyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(201, 70, 91, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTextWrap: {
    flex: 1,
  },
  emptyTag: {
    fontSize: 9,
    fontFamily: fontFamilies.monoBold,
    letterSpacing: 1,
    color: colors.primaryDark,
    marginBottom: 2,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: 'PlayfairDisplay-Bold',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  emptySub: {
    fontSize: 11,
    fontFamily: fontFamilies.monoRegular,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  emptyArrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(201, 70, 91, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
