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
  Heart,
  Bookmark,
  History,
  Calendar,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { fontFamilies } from '../theme/typography';
import { Workout } from '../hooks/useWorkouts';
import { SavedSession } from '../lib/useSavedSessions';
import { useLanguage } from '../context/LanguageContext';

const { height: SCREEN_H } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_H * 0.78;

interface QuickLaunchSheetProps {
  visible: boolean;
  onClose: () => void;
  personalizedWorkout: Workout | null;
  matchReason?: string;
  onSelectWorkout: (workout: Workout) => void;
  onExploreAll: () => void;
  onStartEmpty: () => void;
  savedWorkouts?: Workout[];
  savedSessions?: SavedSession[];
  onToggleFavorite?: (slug: string) => void;
  /** Called when user taps a saved session to replay it */
  onLoadSession?: (session: SavedSession) => void;
}

export const QuickLaunchSheet: React.FC<QuickLaunchSheetProps> = ({
  visible,
  onClose,
  personalizedWorkout,
  matchReason,
  onSelectWorkout,
  onExploreAll,
  onStartEmpty,
  savedWorkouts = [],
  savedSessions = [],
  onToggleFavorite,
  onLoadSession,
}) => {
  const { t } = useLanguage();
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

        {/* Height Sheet */}
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
              <Text style={styles.minimizeText}>{t('quickLaunch.minimize')}</Text>
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
                <Text style={styles.headerKicker}>{t('quickLaunch.headerKicker')}</Text>
              </View>
              <Text style={styles.sheetTitle}>{t('quickLaunch.sheetTitle')}</Text>
              <Text style={styles.sheetSubtitle}>
                {t('quickLaunch.sheetSubtitle')}
              </Text>
            </View>

            {/* ── CARD 1: BUILD YOUR OWN WORKOUT (PRIMARY EMPTY SESSION) ── */}
            <Pressable
              onPress={() => {
                onStartEmpty();
              }}
              style={styles.actionCardEmpty}
              accessibilityRole="button"
              accessibilityLabel={t('quickLaunch.buildYourOwn')}
            >
              <View style={styles.emptyLeft}>
                <View style={styles.emptyIconWrap}>
                  <PlusCircle size={22} color={colors.primaryDark} strokeWidth={2.2} />
                </View>
                <View style={styles.emptyTextWrap}>
                  <View style={styles.buildBadgeRow}>
                    <Text style={styles.emptyTag}>{t('quickLaunch.customBuild')}</Text>
                    <View style={styles.instantBadge}>
                      <Text style={styles.instantBadgeText}>{t('quickLaunch.blankCanvas')}</Text>
                    </View>
                  </View>
                  <Text style={styles.emptyTitle}>{t('quickLaunch.buildYourOwn')}</Text>
                  <Text style={styles.emptySub}>
                    {t('quickLaunch.buildYourOwnSub')}
                  </Text>
                </View>
              </View>
              <View style={styles.emptyArrow}>
                <ArrowRight size={15} color="#FFFFFF" strokeWidth={2.5} />
              </View>
            </Pressable>

            {/* ── SAVED & FAVORITED WORKOUTS SHELF ── */}
            <View style={styles.savedSection}>
              <View style={styles.savedHeaderRow}>
                <View style={styles.savedTitleLeft}>
                  <Heart size={14} color={colors.rose} fill={colors.rose} />
                  <Text style={styles.savedSectionTitle}>{t('quickLaunch.savedRoutinesTitle')}</Text>
                </View>
                {savedWorkouts.length > 0 && (
                  <View style={styles.savedCountPill}>
                    <Text style={styles.savedCountText}>{t('quickLaunch.savedCount', { count: savedWorkouts.length })}</Text>
                  </View>
                )}
              </View>

              {savedWorkouts.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.savedScrollList}
                >
                  {savedWorkouts.map((item) => (
                    <Pressable
                      key={item.slug}
                      onPress={() => {
                        try {
                          if (Platform.OS !== 'web') {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          }
                        } catch (_) {}
                        onSelectWorkout(item);
                      }}
                      style={({ pressed }) => [
                        styles.savedCard,
                        pressed && { opacity: 0.88, transform: [{ scale: 0.97 }] },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Start favorite routine: ${item.title}`}
                    >
                      <LinearGradient
                        colors={['#F7DFE4', '#EAEFE6']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFillObject}
                      />
                      <View style={styles.savedCardTop}>
                        <View style={styles.savedCardBadge}>
                          <Clock size={10} color={colors.primaryDark} />
                          <Text style={styles.savedCardDuration}>{item.duration_minutes}m</Text>
                        </View>
                        {onToggleFavorite && (
                          <Pressable
                            onPress={() => onToggleFavorite(item.slug)}
                            hitSlop={8}
                            style={styles.savedHeartIconBtn}
                            accessibilityRole="button"
                            accessibilityLabel="Toggle favorite"
                          >
                            <Heart size={14} color={colors.rose} fill={colors.rose} />
                          </Pressable>
                        )}
                      </View>
                      <Text style={styles.savedCardTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <View style={styles.savedCardFooter}>
                        <Text style={styles.savedCardEq} numberOfLines={1}>
                          {item.equipment.replace('_', ' ').toUpperCase()}
                        </Text>
                        <View style={styles.savedCardPlayBubble}>
                          <Play size={10} color="#FFFFFF" fill="#FFFFFF" />
                        </View>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.savedEmptyNotice}>
                  <Bookmark size={16} color={colors.textTertiary} />
                  <Text style={styles.savedEmptyText}>
                    {t('quickLaunch.savedEmpty')}
                  </Text>
                </View>
              )}
            </View>

            {/* ── SAVED SESSIONS SECTION (Full workout data with sets & weights) ── */}
            {savedSessions.length > 0 && (
              <View style={styles.savedSection}>
                <View style={styles.savedHeaderRow}>
                  <View style={styles.savedTitleLeft}>
                    <History size={14} color={colors.sageDark} />
                    <Text style={styles.savedSectionTitle}>{t('quickLaunch.savedSessionsTitle')}</Text>
                  </View>
                  <View style={[styles.savedCountPill, { backgroundColor: colors.sageSoft, borderColor: colors.sageBorder }]}>
                    <Text style={[styles.savedCountText, { color: colors.sageDark }]}>{t('quickLaunch.sessionsCount', { count: savedSessions.length })}</Text>
                  </View>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.savedScrollList}
                >
                  {savedSessions.slice(0, 10).map((session) => {
                    const sessionDate = new Date(session.completedAt);
                    const dateStr = isNaN(sessionDate.getTime())
                      ? 'Recent'
                      : sessionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    const durationMin = Math.max(1, Math.floor((session.durationSeconds || 60) / 60));
                    const totalSetsCount = session.totalSets || (session.exercises || []).reduce((acc, e) => acc + (e.sets?.length || 0), 0);

                    return (
                      <Pressable
                        key={session.id}
                        onPress={() => {
                          try {
                            if (Platform.OS !== 'web') {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            }
                          } catch (_) {}
                          onLoadSession?.(session);
                        }}
                        style={({ pressed }) => [
                          styles.savedCard,
                          pressed && { opacity: 0.88, transform: [{ scale: 0.97 }] },
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={`Start saved session: ${session.workoutTitle}`}
                      >
                        <LinearGradient
                          colors={['#E8F0E4', '#D7E5D0']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={StyleSheet.absoluteFillObject}
                        />
                        <View style={styles.savedCardTop}>
                          <View style={[styles.savedCardBadge, { backgroundColor: colors.sageSoft }]}>
                            <Calendar size={10} color={colors.sageDark} />
                            <Text style={[styles.savedCardDuration, { color: colors.sageDark }]}>{dateStr}</Text>
                          </View>
                        </View>
                        <Text style={styles.savedCardTitle} numberOfLines={2}>
                          {session.workoutTitle}
                        </Text>
                        <View style={styles.savedCardFooter}>
                          <Text style={styles.savedCardEq} numberOfLines={1}>
                            {t('quickLaunch.sessionSetsMeta', { sets: totalSetsCount, duration: durationMin })}
                          </Text>
                          <View style={[styles.savedCardPlayBubble, { backgroundColor: colors.sage }]}>
                            <Play size={10} color="#FFFFFF" fill="#FFFFFF" />
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* ── CARD 2: USE PERSONALIZED WORKOUT (HERO) ── */}
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
                    <Text style={styles.heroMatchBadgeText}>{t('quickLaunch.prescribedPlanBadge')}</Text>
                  </View>
                  <View style={styles.heroDurationPill}>
                    <Clock size={11} color="#FFFFFF" />
                    <Text style={styles.heroDurationText}>{t('home.minutesCount', { count: personalizedWorkout.duration_minutes })}</Text>
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
                  <Text style={styles.cardHeroBtnText}>{t('quickLaunch.startPrescribedBtn')}</Text>
                  <ArrowRight size={14} color="#C9465B" strokeWidth={2.2} />
                </View>
              </Pressable>
            )}

            {/* ── CARD 3: EXPLORE ALL WORKOUTS ── */}
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
                    <Text style={styles.secondaryTag}>{t('quickLaunch.exploreAllTag')}</Text>
                  </View>
                  <Text style={styles.secondaryTitle}>{t('quickLaunch.exploreAllTitle')}</Text>
                  <Text style={styles.secondarySubtitle}>
                    {t('quickLaunch.exploreAllSubtitle')}
                  </Text>
                </View>
              </View>
              <View style={styles.secondaryArrowCircle}>
                <ArrowRight size={14} color={colors.textPrimary} />
              </View>
            </Pressable>

            <View style={{ height: 40 }} />
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
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(201, 70, 91, 0.25)',
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
      default: {},
    }),
  },
  buildBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  instantBadge: {
    backgroundColor: 'rgba(201, 70, 91, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  instantBadgeText: {
    fontSize: 8.5,
    fontFamily: fontFamilies.monoBold,
    color: colors.primaryDark,
    letterSpacing: 0.6,
  },
  emptyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  emptyIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(201, 70, 91, 0.12)',
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
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: fontFamilies.soria,
    color: colors.textPrimary,
    fontWeight: '700',
    marginBottom: 2,
  },
  emptySub: {
    fontSize: 11,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  emptyArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Saved Workouts Shelf
  savedSection: {
    marginBottom: 22,
  },
  savedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  savedTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  savedSectionTitle: {
    fontSize: 11,
    fontFamily: fontFamilies.monoBold,
    color: colors.primaryDark,
    letterSpacing: 1.2,
  },
  savedCountPill: {
    backgroundColor: 'rgba(201, 70, 91, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  savedCountText: {
    fontSize: 9,
    fontFamily: fontFamilies.monoBold,
    color: colors.primaryDark,
  },
  savedScrollList: {
    gap: 12,
    paddingRight: 10,
  },
  savedCard: {
    width: 170,
    height: 125,
    borderRadius: 18,
    padding: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(101, 78, 60, 0.12)',
    justifyContent: 'space-between',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  savedCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  savedCardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  savedCardDuration: {
    fontSize: 10,
    fontFamily: fontFamilies.monoBold,
    color: colors.primaryDark,
  },
  savedHeartIconBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedCardTitle: {
    fontSize: 13.5,
    fontFamily: fontFamilies.soria,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 17,
  },
  savedCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  savedCardEq: {
    fontSize: 8.5,
    fontFamily: fontFamilies.monoBold,
    color: colors.textTertiary,
    maxWidth: 100,
    letterSpacing: 0.5,
  },
  savedCardPlayBubble: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedEmptyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(101, 78, 60, 0.05)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(101, 78, 60, 0.1)',
  },
  savedEmptyText: {
    flex: 1,
    fontSize: 11.5,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textSecondary,
    lineHeight: 16,
  },
});
