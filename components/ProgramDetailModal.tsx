import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  ScrollView,
  Pressable,
  Platform,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  X,
  Sparkles,
  Check,
  ChevronRight,
  Play,
  Flame,
  Leaf,
  Droplet,
  Clock,
  Heart,
  Calendar,
  ShieldCheck,
  Dumbbell,
  CheckCircle2,
  Lock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { fontFamilies } from '../theme/typography';
import { FitnessProgram, ProgramDay, ProgramWorkout } from '../data/fitnessPrograms';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface ProgramDetailModalProps {
  visible: boolean;
  program: FitnessProgram | null;
  onClose: () => void;
  onStartDayWorkout?: (workout: ProgramWorkout, day: ProgramDay) => void;
  onBuyProgram?: (program: FitnessProgram) => void;
}

export const ProgramDetailModal: React.FC<ProgramDetailModalProps> = ({
  visible,
  program,
  onClose,
  onStartDayWorkout,
  onBuyProgram,
}) => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'overview' | 'diet'>('schedule');
  const [expandedDay, setExpandedDay] = useState<number | null>(1);

  if (!program) return null;

  const handleTabChange = (tab: 'schedule' | 'overview' | 'diet') => {
    try {
      if (Platform.OS !== 'web') Haptics.selectionAsync();
    } catch (_) {}
    setActiveTab(tab);
  };

  const handleDayPress = (day: ProgramDay) => {
    try {
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_) {}
    setExpandedDay((prev) => (prev === day.day ? null : day.day));
  };

  const renderDietIcon = (icon: string) => {
    const iconProps = { size: 18, color: program.tagColor, strokeWidth: 2 };
    switch (icon) {
      case 'flame':
        return <Flame {...iconProps} />;
      case 'leaf':
        return <Leaf {...iconProps} />;
      case 'droplet':
        return <Droplet {...iconProps} />;
      case 'clock':
        return <Clock {...iconProps} />;
      case 'heart':
      default:
        return <Heart {...iconProps} />;
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={s.container}>
        {/* Top Floating Bar */}
        <View style={s.headerBar}>
          <Pressable
            onPress={onClose}
            style={s.closeBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="Close"
          >
            <X size={20} color={colors.textPrimary} strokeWidth={2.2} />
          </Pressable>
          <View style={s.headerTagWrap}>
            <View style={[s.headerBadge, { backgroundColor: program.tagColor + '20', borderColor: program.tagColor + '40' }]}>
              <Text style={[s.headerBadgeText, { color: program.tagColor }]}>{program.tag}</Text>
            </View>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
          {/* Hero Header */}
          <LinearGradient
            colors={program.gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.heroCard}
          >
            <View style={s.heroTopRow}>
              <View style={s.heroDurationBadge}>
                <Calendar size={13} color="#FFFFFF" strokeWidth={2.2} />
                <Text style={s.heroDurationText}>{program.durationDays} DAYS</Text>
              </View>
              <View style={s.discountBadge}>
                <Text style={s.discountBadgeText}>{program.badge}</Text>
              </View>
            </View>

            <Text style={s.heroTitle}>{program.name}</Text>
            <Text style={s.heroSubtitle}>{program.subtitle}</Text>

            <View style={s.heroStatsRow}>
              <View style={s.heroStat}>
                <Text style={s.heroStatLabel}>Cadence</Text>
                <Text style={s.heroStatVal}>{program.sessionsPerWeek}x / week</Text>
              </View>
              <View style={s.heroStatDivider} />
              <View style={s.heroStat}>
                <Text style={s.heroStatLabel}>Session Length</Text>
                <Text style={s.heroStatVal}>{program.sessionDuration}</Text>
              </View>
              <View style={s.heroStatDivider} />
              <View style={s.heroStat}>
                <Text style={s.heroStatLabel}>Format</Text>
                <Text style={s.heroStatVal}>Interactive</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Tab Controls */}
          <View style={s.tabsRow}>
            {[
              { id: 'schedule', label: '30-Day Workouts' },
              { id: 'diet', label: 'Diet & Nutrition' },
              { id: 'overview', label: 'Roadmap & Tips' },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  style={[s.tabBtn, isActive && s.tabBtnActive]}
                  onPress={() => handleTabChange(tab.id as any)}
                >
                  <Text style={[s.tabBtnText, isActive && s.tabBtnTextActive]}>{tab.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* TAB 1: 30-DAY WORKOUT SCHEDULE */}
          {activeTab === 'schedule' && (
            <View style={s.sectionWrap}>
              <View style={s.scheduleNotice}>
                <Sparkles size={16} color={program.tagColor} strokeWidth={2} />
                <Text style={s.scheduleNoticeText}>
                  Tap any day to preview or launch the complete guided workout session.
                </Text>
              </View>

              <View style={s.daysGrid}>
                {program.days.map((day) => {
                  const isRest = day.isRest;
                  const isExpanded = expandedDay === day.day;
                  return (
                    <View
                      key={day.day}
                      style={[
                        s.dayCard,
                        isRest && s.dayCardRest,
                        isExpanded && { borderColor: program.tagColor, borderWidth: 1.5 },
                      ]}
                    >
                      <Pressable
                        onPress={() => handleDayPress(day)}
                        accessibilityRole="button"
                        accessibilityLabel={`Day ${day.day}: ${day.title}`}
                      >
                        <View style={s.dayCardTop}>
                          <View
                            style={[
                              s.dayBadge,
                              isRest ? s.dayBadgeRest : { backgroundColor: program.tagColor + '22' },
                            ]}
                          >
                            <Text style={[s.dayBadgeText, !isRest && { color: program.tagColor }]}>
                              Day {day.day}
                            </Text>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={s.dayDuration}>
                              {isRest ? 'Rest' : `${day.durationMinutes}m`}
                            </Text>
                            {isExpanded ? (
                              <ChevronUp size={16} color={colors.textSecondary} />
                            ) : (
                              <ChevronDown size={16} color={colors.textTertiary} />
                            )}
                          </View>
                        </View>

                        <Text style={s.dayTitle} numberOfLines={1}>
                          {day.title.replace(/^Day \d+: /, '')}
                        </Text>
                        <Text style={s.dayFocus} numberOfLines={2}>
                          {day.focus}
                        </Text>
                      </Pressable>

                      {/* EXPANDED EXERCISES DRAWER */}
                      {isExpanded && (
                        <View style={s.expandedDrawer}>
                          {isRest ? (
                            <View style={s.restDrawerBox}>
                              <Text style={s.restDrawerTitle}>🌱 Restorative Day Guidance</Text>
                              <Text style={s.restDrawerText}>
                                • 20–30 min gentle leisurely walk outside{'\n'}
                                • Target 2.5L clean water with minerals{'\n'}
                                • No high-intensity output — allow cortisol to reset{'\n'}
                                • 7.5 to 8 hours restorative sleep tonight
                              </Text>
                            </View>
                          ) : (
                            day.workout && (
                              <View style={s.exercisesList}>
                                {/* Warmup */}
                                {day.workout.warmup.length > 0 && (
                                  <View style={s.blockSection}>
                                    <Text style={s.blockTitle}>WARM-UP & MOBILITY</Text>
                                    {day.workout.warmup.map((ex, i) => (
                                      <View key={i} style={s.exerciseRow}>
                                        <View style={s.exerciseBullet} />
                                        <View style={{ flex: 1 }}>
                                          <View style={s.exNameRow}>
                                            <Text style={s.exName}>{ex.name}</Text>
                                            <Text style={s.exParams}>
                                              {ex.duration || `${ex.sets} sets`}
                                            </Text>
                                          </View>
                                          {ex.coaching_cue && (
                                            <Text style={s.exCue}>💡 {ex.coaching_cue}</Text>
                                          )}
                                        </View>
                                      </View>
                                    ))}
                                  </View>
                                )}

                                {/* Main Blocks */}
                                {day.workout.main_blocks.map((b, bIdx) => (
                                  <View key={bIdx} style={s.blockSection}>
                                    <Text style={s.blockTitle}>
                                      {b.block_name.toUpperCase()}
                                    </Text>
                                    {b.exercises.map((ex, i) => (
                                      <View key={i} style={s.exerciseRow}>
                                        <View
                                          style={[s.exerciseBullet, { backgroundColor: program.tagColor }]}
                                        />
                                        <View style={{ flex: 1 }}>
                                          <View style={s.exNameRow}>
                                            <Text style={s.exName}>{ex.name}</Text>
                                            <Text style={[s.exParams, { color: program.tagColor }]}>
                                              {ex.sets ? `${ex.sets} sets × ` : ''}
                                              {ex.reps || ex.duration}
                                              {ex.rest ? ` (rest ${ex.rest})` : ''}
                                            </Text>
                                          </View>
                                          {ex.coaching_cue && (
                                            <Text style={s.exCue}>💡 {ex.coaching_cue}</Text>
                                          )}
                                        </View>
                                      </View>
                                    ))}
                                  </View>
                                ))}

                                {/* Cooldown */}
                                {day.workout.cooldown.length > 0 && (
                                  <View style={s.blockSection}>
                                    <Text style={s.blockTitle}>COOL-DOWN & DECOMPRESSION</Text>
                                    {day.workout.cooldown.map((ex, i) => (
                                      <View key={i} style={s.exerciseRow}>
                                        <View style={s.exerciseBullet} />
                                        <View style={{ flex: 1 }}>
                                          <View style={s.exNameRow}>
                                            <Text style={s.exName}>{ex.name}</Text>
                                            <Text style={s.exParams}>
                                              {ex.duration || `${ex.sets} sets`}
                                            </Text>
                                          </View>
                                          {ex.coaching_cue && (
                                            <Text style={s.exCue}>💡 {ex.coaching_cue}</Text>
                                          )}
                                        </View>
                                      </View>
                                    ))}
                                  </View>
                                )}

                                {/* Start Workout Button */}
                                {onStartDayWorkout && (
                                  <Pressable
                                    style={s.startDayWorkoutBtn}
                                    onPress={() => onStartDayWorkout(day.workout!, day)}
                                  >
                                    <LinearGradient
                                      colors={program.gradientColors}
                                      start={{ x: 0, y: 0 }}
                                      end={{ x: 1, y: 0 }}
                                      style={s.startDayWorkoutGrad}
                                    >
                                      <Play size={12} color="#FFFFFF" fill="#FFFFFF" />
                                      <Text style={s.startDayWorkoutText}>
                                        Launch Interactive Tracker
                                      </Text>
                                    </LinearGradient>
                                  </Pressable>
                                )}
                              </View>
                            )
                          )}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* TAB 2: DIET & NUTRITION TIPS */}
          {activeTab === 'diet' && (
            <View style={s.sectionWrap}>
              <View style={s.dietIntro}>
                <Text style={s.dietIntroTitle}>Evidence-Based 40+ Nutrition Protocol</Text>
                <Text style={s.dietIntroBody}>
                  Sustainable fat loss and muscle retention require a metabolic environment built on protein sufficiency, cellular hydration, and circadian-aligned eating.
                </Text>
              </View>

              {program.dietTips.map((tip, idx) => (
                <View key={idx} style={s.dietTipCard}>
                  <View style={[s.dietIconBox, { backgroundColor: program.tagColor + '18' }]}>
                    {renderDietIcon(tip.icon)}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.dietTipTitle}>{tip.title}</Text>
                    <Text style={s.dietTipBody}>{tip.body}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* TAB 3: OVERVIEW & ROADMAP */}
          {activeTab === 'overview' && (
            <View style={s.sectionWrap}>
              {/* Core Goals */}
              <Text style={s.subheading}>Program Outcomes</Text>
              <View style={s.goalsCard}>
                {program.goalSummary.map((goal, idx) => (
                  <View key={idx} style={s.goalItem}>
                    <CheckCircle2 size={16} color={program.tagColor} strokeWidth={2.2} />
                    <Text style={s.goalItemText}>{goal}</Text>
                  </View>
                ))}
              </View>

              {/* Weekly Structure */}
              <Text style={[s.subheading, { marginTop: 24 }]}>Weekly Progression</Text>
              <View style={s.structureList}>
                {program.weeklyStructure.map((item, idx) => (
                  <View key={idx} style={s.structureCard}>
                    <View style={[s.weekPill, { backgroundColor: program.tagColor + '20' }]}>
                      <Text style={[s.weekPillText, { color: program.tagColor }]}>{item.week}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.structureFocus}>{item.focus}</Text>
                      <Text style={s.structureDesc}>{item.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Coaching Insights */}
              <Text style={[s.subheading, { marginTop: 24 }]}>Physiologist Coaching Rules</Text>
              <View style={s.notesCard}>
                {program.coachingNotes.map((note, idx) => (
                  <View key={idx} style={s.noteItem}>
                    <View style={s.noteDot} />
                    <Text style={s.noteText}>{note}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Sticky Purchase/Action Footer */}
        <View style={s.footerBar}>
          <View>
            <View style={s.priceRow}>
              <Text style={s.priceCurrent}>${program.price.toFixed(2)}</Text>
              <Text style={s.priceOld}>${program.originalPrice.toFixed(2)}</Text>
            </View>
            <Text style={s.priceMeta}>One-time digital unlock • Lifetime access</Text>
          </View>

          <Pressable
            style={s.ctaBtn}
            onPress={() => {
              if (onBuyProgram) {
                onBuyProgram(program);
              } else if (program.days[0]?.workout && onStartDayWorkout) {
                onStartDayWorkout(program.days[0].workout, program.days[0]);
              }
            }}
          >
            <LinearGradient
              colors={program.gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.ctaBtnGradient}
            >
              <Text style={s.ctaBtnText}>Get Program</Text>
              <ChevronRight size={17} color="#FFFFFF" strokeWidth={2.4} />
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 16,
    paddingBottom: 10,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerTagWrap: {
    alignItems: 'center',
  },
  headerBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  headerBadgeText: {
    fontSize: 10,
    fontFamily: fontFamilies.sansBold,
    letterSpacing: 1,
  },
  scrollContent: {
    padding: 16,
  },
  heroCard: {
    borderRadius: 22,
    padding: 22,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroDurationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  heroDurationText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: fontFamilies.sansBold,
    letterSpacing: 0.5,
  },
  discountBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountBadgeText: {
    color: colors.textPrimary,
    fontSize: 10,
    fontFamily: fontFamilies.sansBold,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: fontFamilies.soria,
    fontWeight: '700',
    lineHeight: 28,
    marginBottom: 6,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontFamily: fontFamilies.sansRegular,
    lineHeight: 18,
    marginBottom: 16,
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  heroStat: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 9.5,
    fontFamily: fontFamilies.sansMedium,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  heroStatVal: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: fontFamilies.sansBold,
  },
  heroStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  // Tabs
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceCard,
    borderRadius: 12,
    padding: 4,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: colors.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  tabBtnText: {
    fontSize: 12,
    fontFamily: fontFamilies.sansMedium,
    color: colors.textSecondary,
  },
  tabBtnTextActive: {
    color: colors.textPrimary,
    fontFamily: fontFamilies.sansBold,
  },

  sectionWrap: {
    gap: 12,
  },
  scheduleNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surfaceCard,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 6,
  },
  scheduleNoticeText: {
    flex: 1,
    fontSize: 11.5,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textSecondary,
    lineHeight: 16,
  },

  // Day cards
  daysGrid: {
    gap: 10,
  },
  dayCard: {
    backgroundColor: colors.surfaceCard,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayCardRest: {
    backgroundColor: colors.background,
    borderStyle: 'dashed',
    opacity: 0.8,
  },
  dayCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  dayBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dayBadgeRest: {
    backgroundColor: colors.borderMedium,
  },
  dayBadgeText: {
    fontSize: 10,
    fontFamily: fontFamilies.sansBold,
    color: colors.textSecondary,
  },
  dayDuration: {
    fontSize: 11,
    fontFamily: fontFamilies.sansMedium,
    color: colors.textTertiary,
  },
  dayTitle: {
    fontSize: 14,
    fontFamily: fontFamilies.sansBold,
    color: colors.textPrimary,
    marginBottom: 3,
  },
  dayFocus: {
    fontSize: 11.5,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  dayActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  playCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayActionText: {
    fontSize: 11.5,
    fontFamily: fontFamilies.sansBold,
  },

  // Diet
  dietIntro: {
    backgroundColor: colors.surfaceCard,
    borderRadius: 14,
    padding: 14,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dietIntroTitle: {
    fontSize: 14,
    fontFamily: fontFamilies.sansBold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  dietIntroBody: {
    fontSize: 12,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  dietTipCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.surfaceCard,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dietIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dietTipTitle: {
    fontSize: 13,
    fontFamily: fontFamilies.sansBold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  dietTipBody: {
    fontSize: 12,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textSecondary,
    lineHeight: 17,
  },

  // Overview
  subheading: {
    fontSize: 13,
    fontFamily: fontFamilies.sansBold,
    color: colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  goalsCard: {
    backgroundColor: colors.surfaceCard,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  goalItemText: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: fontFamilies.sansMedium,
    color: colors.textPrimary,
  },
  structureList: {
    gap: 8,
  },
  structureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.surfaceCard,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  weekPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  weekPillText: {
    fontSize: 10,
    fontFamily: fontFamilies.sansBold,
  },
  structureFocus: {
    fontSize: 13,
    fontFamily: fontFamilies.sansBold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  structureDesc: {
    fontSize: 11.5,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  notesCard: {
    backgroundColor: colors.surfaceCard,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  noteDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primaryDark,
    marginTop: 6,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textSecondary,
    lineHeight: 17,
  },

  // Footer bar
  footerBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceCard,
    paddingHorizontal: 20,
    paddingVertical: 14,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  priceCurrent: {
    fontSize: 22,
    fontFamily: fontFamilies.sansBold,
    color: colors.textPrimary,
  },
  priceOld: {
    fontSize: 14,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  priceMeta: {
    fontSize: 10.5,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textTertiary,
    marginTop: 2,
  },
  ctaBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  ctaBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 13,
    paddingHorizontal: 22,
  },
  ctaBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: fontFamilies.sansBold,
  },

  // ── EXPANDED DAY EXERCISES DRAWER ──
  expandedDrawer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  restDrawerBox: {
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 12,
  },
  restDrawerTitle: {
    fontSize: 12.5,
    fontFamily: fontFamilies.sansBold,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  restDrawerText: {
    fontSize: 11.5,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  exercisesList: {
    gap: 12,
  },
  blockSection: {
    gap: 8,
  },
  blockTitle: {
    fontSize: 9.5,
    fontFamily: fontFamilies.sansBold,
    color: colors.textTertiary,
    letterSpacing: 1,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 10,
  },
  exerciseBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.borderMedium,
    marginTop: 6,
  },
  exNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 8,
  },
  exName: {
    fontSize: 12.5,
    fontFamily: fontFamilies.sansBold,
    color: colors.textPrimary,
    flex: 1,
  },
  exParams: {
    fontSize: 11,
    fontFamily: fontFamilies.sansSemiBold,
    color: colors.textSecondary,
  },
  exCue: {
    fontSize: 11,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textSecondary,
    marginTop: 3,
    lineHeight: 15,
  },
  startDayWorkoutBtn: {
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 4,
  },
  startDayWorkoutGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  startDayWorkoutText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: fontFamilies.sansBold,
  },
});
