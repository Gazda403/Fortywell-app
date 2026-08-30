import React, { useState, useRef, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
  Dimensions,
  PanResponder,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import Svg, {
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  Path,
  Circle,
  Line,
  G,
  Rect,
  Text as SvgText,
} from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  Sprout,
  Flower2,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Lock,
  Heart,
  Trophy,
  Flame,
  Clock,
  Dumbbell,
  Activity,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { fontFamilies } from '../theme/typography';
import { getExerciseInfo } from '../lib/exerciseDatabase';
import { useUserData, GardenProgress, LifetimeStats, TopExerciseItem } from '../hooks/useUserData';
import { useLanguage } from '../context/LanguageContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SCREEN_W } = Dimensions.get('window');

// Garden images mapping
const GARDEN_IMAGES: Record<number, any> = {
  1: require('../assets/garden/1.jpeg'),
  2: require('../assets/garden/2.jpeg'),
  3: require('../assets/garden/3.jpeg'),
  4: require('../assets/garden/4.jpeg'),
  5: require('../assets/garden/5.jpeg'),
  6: require('../assets/garden/6.jpeg'),
};

const GARDEN_LEVELS = [
  { level: 1, name: 'Meadow Dawn', daysReq: '0–7 Days', desc: 'Fresh green meadow & serene lotus pond' },
  { level: 2, name: 'Wildflower Bloom', daysReq: '8–14 Days', desc: 'Gentle blooming daisies and sweet buttercups' },
  { level: 3, name: 'Sunlit Canopy', daysReq: '15–21 Days', desc: 'Golden afternoon rays through lush trees' },
  { level: 4, name: 'Luminous Flora', daysReq: '22–28 Days', desc: 'Evening warmth with bioluminescent petals' },
  { level: 5, name: 'Ethereal Haven', daysReq: '29–35 Days', desc: 'Vibrant rainbow canopy & dancing starlight' },
  { level: 6, name: 'Celestial Sanctuary', daysReq: '36+ Days', desc: 'Full cosmic bloom of eternal joint vitality' },
];

const DEFAULT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];

const DEFAULT_FAVORITE_EXERCISES = [
  { name: 'Cat-Cow Segmental Mobility', sets: 24, muscle: 'Spine & Lumbar', tag: 'Mobility' },
  { name: 'Iso-Hold Glute Bridge with Heel Drive', sets: 32, muscle: 'Glutes & Pelvic', tag: 'Strength' },
  { name: 'Deadbug with Opposite Arm/Leg Reach', sets: 28, muscle: 'Deep Core', tag: 'Stability' },
  { name: 'Dumbbell Romanian Deadlift', sets: 18, muscle: 'Hamstrings', tag: 'Posterior' },
];

export interface GardenViewProps {
  onStartWorkout?: () => void;
  gardenProgress?: GardenProgress;
  lifetimeStats?: LifetimeStats;
  topExercises?: TopExerciseItem[];
  onRefresh?: () => void;
}

export const GardenView: React.FC<GardenViewProps> = (props) => {
  const hookData = useUserData();
  const { t } = useLanguage();
  const gardenProgress = props.gardenProgress || hookData.gardenProgress;
  const lifetimeStats = props.lifetimeStats || hookData.lifetimeStats;
  const topExercises = props.topExercises || hookData.topExercises || DEFAULT_FAVORITE_EXERCISES;

  const months = gardenProgress.vitalityTrends?.months || DEFAULT_MONTHS;
  const chartData = useMemo(() => {
    if (gardenProgress.vitalityTrends) {
      return {
        consistency: gardenProgress.vitalityTrends.consistency,
        mobility: gardenProgress.vitalityTrends.mobility,
        fluidity: gardenProgress.vitalityTrends.fluidity,
      };
    }
    return {
      consistency: [45, 52, 53, 46, 42, 49, 40, 48, 46, 51],
      mobility: [28, 42, 41, 29, 34, 45, 33, 28, 38, 35],
      fluidity: [20, 34, 18, 22, 24, 10, 7, 23, 18, 27],
    };
  }, [gardenProgress.vitalityTrends]);

  const [previewLevel, setPreviewLevel] = useState<number>(gardenProgress.currentLevel || 1);
  const [isHowItGrowsOpen, setIsHowItGrowsOpen] = useState<boolean>(false);
  const [selectedMonthIdx, setSelectedMonthIdx] = useState<number>(months.length - 1);
  const [favorites, setFavorites] = useState<string[]>(topExercises.map((f) => f.name));

  // Sync preview level with real calculated garden level
  React.useEffect(() => {
    if (gardenProgress.currentLevel) {
      setPreviewLevel(gardenProgress.currentLevel);
    }
  }, [gardenProgress.currentLevel]);

  // Sync selected month index with months length
  React.useEffect(() => {
    if (months.length > 0) {
      setSelectedMonthIdx(months.length - 1);
    }
  }, [months]);

  const activeLevelMeta = GARDEN_LEVELS.find((l) => l.level === previewLevel) || GARDEN_LEVELS[0];

  // SVG Chart Dimensions
  const chartWidth = Math.min(SCREEN_W - 40, 400);
  const chartHeight = 220;
  const paddingLeft = 32;
  const paddingRight = 16;
  const paddingTop = 24;
  const paddingBottom = 32;
  const graphW = chartWidth - paddingLeft - paddingRight;
  const graphH = chartHeight - paddingTop - paddingBottom;
  const maxY = 60;

  // Touch scrubbing gesture handler for interactive graph
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        handleTouchX(evt.nativeEvent.locationX);
      },
      onPanResponderMove: (evt) => {
        handleTouchX(evt.nativeEvent.locationX);
      },
    })
  ).current;

  const handleTouchX = (touchX: number) => {
    const relativeX = touchX - paddingLeft;
    const clampedX = Math.max(0, Math.min(graphW, relativeX));
    const index = Math.round((clampedX / graphW) * (months.length - 1));
    if (index >= 0 && index < months.length && index !== selectedMonthIdx) {
      setSelectedMonthIdx(index);
      try {
        if (Platform.OS !== 'web') {
          Haptics.selectionAsync();
        }
      } catch (_) {}
    }
  };

  const toggleHowItGrows = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsHowItGrowsOpen(!isHowItGrowsOpen);
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (_) {}
  };

  const toggleFavorite = (name: string) => {
    setFavorites(prev =>
      prev.includes(name) ? prev.filter(f => f !== name) : [...prev, name]
    );
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (_) {}
  };

  // Helper to convert point to SVG coordinates
  const getCoords = (data: number[]) => {
    return data.map((val, i) => {
      const x = paddingLeft + (i / (data.length - 1)) * graphW;
      const y = paddingTop + graphH - (val / maxY) * graphH;
      return { x, y, val };
    });
  };

  // Helper to generate smooth SVG path from points
  const createCurvedPath = (coords: { x: number; y: number }[]) => {
    if (coords.length === 0) return '';
    let path = `M ${coords[0].x},${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i === 0 ? 0 : i - 1];
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const p3 = coords[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    return path;
  };

  const createAreaPath = (coords: { x: number; y: number }[]) => {
    const linePath = createCurvedPath(coords);
    const bottomY = paddingTop + graphH;
    const lastX = coords[coords.length - 1].x;
    const firstX = coords[0].x;
    return `${linePath} L ${lastX},${bottomY} L ${firstX},${bottomY} Z`;
  };

  const consistencyCoords = getCoords(chartData.consistency);
  const mobilityCoords = getCoords(chartData.mobility);
  const fluidityCoords = getCoords(chartData.fluidity);

  const safeMonthIdx = Math.min(selectedMonthIdx, months.length - 1);
  const selectedConsistency = chartData.consistency[safeMonthIdx] || 0;
  const selectedMobility = chartData.mobility[safeMonthIdx] || 0;
  const selectedFluidity = chartData.fluidity[safeMonthIdx] || 0;
  const selectedMonthName = months[safeMonthIdx] || 'Today';
  const selectedX = consistencyCoords[safeMonthIdx]?.x || paddingLeft;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* ── HEADER TITLE ── */}
      <View style={styles.header}>
        <View style={styles.kickerRow}>
          <Sparkles size={13} color={colors.primary} />
          <Text style={styles.kickerText}>{t('garden.headerKicker')}</Text>
        </View>
        <Text style={styles.headerTitle}>{t('garden.title')}</Text>
        <Text style={styles.headerSubtitle}>
          {t('garden.subtitle')}
        </Text>
      </View>

      {/* ── COLLAPSIBLE DROPDOWN: HOW YOUR GARDEN GROWS ── */}
      <View style={styles.collapsibleCard}>
        <Pressable onPress={toggleHowItGrows} style={styles.collapsibleHeader}>
          <View style={styles.collapsibleTitleRow}>
            <View style={styles.sparkleIconBubble}>
              <Sprout size={16} color={colors.primary} />
            </View>
            <Text style={styles.explanationTitle}>How Your Garden Grows</Text>
          </View>
          <View style={styles.chevronBubble}>
            {isHowItGrowsOpen ? (
              <ChevronUp size={16} color={colors.primaryDark} />
            ) : (
              <ChevronDown size={16} color={colors.primaryDark} />
            )}
          </View>
        </Pressable>

        {isHowItGrowsOpen && (
          <View style={styles.explanationBody}>
            <Text style={styles.explanationText}>
              • <Text style={styles.boldText}>Every 7 days</Text> of completed movement upgrades your garden to a more vibrant bloom level.{'\n'}
              • <Text style={styles.boldText}>If you miss a week</Text>, the garden returns to Level 1 — fertile soil ready for a fresh start with zero penalty.
            </Text>

            <View style={styles.explanationFooter}>
              <View style={styles.streakPill}>
                <CheckCircle2 size={12} color={colors.sageDark} />
                <Text style={styles.streakPillText}>Current: {lifetimeStats.currentStreak}-Day Streak</Text>
              </View>
              <Text style={styles.nextUpgradeText}>
                Level {Math.min(6, gardenProgress.currentLevel + 1)} in {gardenProgress.daysToNextLevel} Days
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* ── HERO FRAMED GARDEN PICTURE ── */}
      <View style={styles.gardenHeroWrapper}>
        <View style={styles.gardenCard}>
          {/* Framed Image */}
          <View style={styles.gardenImageFrame}>
            <ExpoImage
              source={GARDEN_IMAGES[previewLevel] || GARDEN_IMAGES[1]}
              style={styles.gardenImage}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={200}
            />
            {/* Level Badge Overlay */}
            <View style={styles.gardenBadgeOverlay}>
              <View style={styles.levelBadge}>
                <Flower2 size={13} color="#FFFFFF" />
                <Text style={styles.levelBadgeText}>LEVEL {previewLevel}</Text>
              </View>
              {previewLevel === gardenProgress.currentLevel ? (
                <View style={styles.activePill}>
                  <Text style={styles.activePillText}>CURRENT SANCTUARY</Text>
                </View>
              ) : (
                <View style={[styles.activePill, { backgroundColor: 'rgba(58, 53, 50, 0.75)' }]}>
                  <Text style={styles.activePillText}>PREVIEW</Text>
                </View>
              )}
            </View>
          </View>

          {/* Garden Level Info */}
          <View style={styles.gardenDetails}>
            <View style={styles.gardenTitleRow}>
              <Text style={styles.gardenName}>{activeLevelMeta.name}</Text>
              <Text style={styles.gardenDaysReq}>{activeLevelMeta.daysReq}</Text>
            </View>
            <Text style={styles.gardenDesc}>{activeLevelMeta.desc}</Text>

            {/* Progress to next level bar */}
            <View style={styles.progressBarWrap}>
              <View style={styles.progressLabelRow}>
                <Text style={styles.progressLabel}>Bloom Growth</Text>
                <Text style={styles.progressValue}>
                  {gardenProgress.daysCompletedInLevel} / 7 Days Completed
                </Text>
              </View>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.round((gardenProgress.daysCompletedInLevel / 7) * 100)}%`,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Interactive Level Preview Tabs */}
            <View style={styles.levelSelectorRow}>
              <Text style={styles.levelSelectorLabel}>Preview Bloom Stages:</Text>
              <View style={styles.levelPillsWrap}>
                {GARDEN_LEVELS.map((lvl) => {
                  const isSelected = previewLevel === lvl.level;
                  const isUnlocked = lvl.level <= gardenProgress.currentLevel;
                  return (
                    <Pressable
                      key={lvl.level}
                      onPress={() => {
                        setPreviewLevel(lvl.level);
                        try {
                          if (Platform.OS !== 'web') {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }
                        } catch (_) {}
                      }}
                      style={[
                        styles.levelPill,
                        isSelected && styles.levelPillSelected,
                        !isUnlocked && styles.levelPillLocked,
                      ]}
                    >
                      {!isUnlocked && <Lock size={9} color={colors.textTertiary} />}
                      <Text
                        style={[
                          styles.levelPillText,
                          isSelected && styles.levelPillTextSelected,
                        ]}
                      >
                        L{lvl.level}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* ── PROGRESS AREA CHART / EMPTY STATE SECTION ── */}
      <View style={styles.chartSection}>
        <View style={styles.chartHeader}>
          <View>
            <View style={styles.kickerRow}>
              <TrendingUp size={13} color={colors.primary} />
              <Text style={styles.kickerText}>VITALITY TRENDS</Text>
            </View>
            <Text style={styles.chartTitle}>Progress Analytics</Text>
          </View>
          {gardenProgress.hasEnoughDataForTrends && (
            <View style={styles.chartPeriodBadge}>
              <Text style={styles.chartPeriodText}>Touch to Inspect</Text>
            </View>
          )}
        </View>

        {!gardenProgress.hasEnoughDataForTrends ? (
          /* Empty state for new users (< 7 days) */
          <View style={styles.emptyChartCard}>
            <View style={styles.emptyChartIconWrap}>
              <TrendingUp size={24} color={colors.primary} strokeWidth={2} />
            </View>
            <Text style={styles.emptyChartTitle}>Your Trends Are Growing</Text>
            <Text style={styles.emptyChartSub}>
              Consistency, mobility, and fluidity metrics will plot here automatically after your first 7 days of movement check-ins.
            </Text>
            <View style={styles.emptyChartHintRow}>
              <Sparkles size={13} color={colors.primaryDark} strokeWidth={2} />
              <Text style={styles.emptyChartHintText}>
                {gardenProgress.totalActiveDays} / 7 days logged towards your first trend graph
              </Text>
            </View>
          </View>
        ) : (
          <>
            {/* SVG Interactive Area Chart Container */}
            <View style={styles.svgCard} {...panResponder.panHandlers}>
              <Svg width={chartWidth} height={chartHeight}>
                <Defs>
                  <SvgGradient id="gradRose" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor="#C9465B" stopOpacity="0.45" />
                    <Stop offset="100%" stopColor="#C9465B" stopOpacity="0.02" />
                  </SvgGradient>
                  <SvgGradient id="gradSage" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor="#92A975" stopOpacity="0.40" />
                    <Stop offset="100%" stopColor="#92A975" stopOpacity="0.02" />
                  </SvgGradient>
                  <SvgGradient id="gradGold" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor="#C29B7F" stopOpacity="0.35" />
                    <Stop offset="100%" stopColor="#C29B7F" stopOpacity="0.02" />
                  </SvgGradient>
                </Defs>

                {/* Horizontal Grid lines */}
                {[0, 10, 20, 30, 40, 50].map((val) => {
                  const y = paddingTop + graphH - (val / maxY) * graphH;
                  return (
                    <G key={val}>
                      <Line
                        x1={paddingLeft}
                        y1={y}
                        x2={chartWidth - paddingRight}
                        y2={y}
                        stroke="rgba(101, 78, 60, 0.12)"
                        strokeDasharray="4, 4"
                        strokeWidth={1}
                      />
                      <SvgText
                        x={paddingLeft - 8}
                        y={y + 3}
                        fontSize="9"
                        fill={colors.textTertiary}
                        textAnchor="end"
                        fontFamily={fontFamilies.monoMedium}
                      >
                        {val}
                      </SvgText>
                    </G>
                  );
                })}

                {/* Vertical Cursor on Selected Month */}
                <Line
                  x1={selectedX}
                  y1={paddingTop}
                  x2={selectedX}
                  y2={paddingTop + graphH}
                  stroke="#2A2320"
                  strokeDasharray="3, 3"
                  strokeWidth={1.4}
                  opacity={0.7}
                />

                {/* Area Fills */}
                <Path d={createAreaPath(consistencyCoords)} fill="url(#gradRose)" />
                <Path d={createAreaPath(mobilityCoords)} fill="url(#gradSage)" />
                <Path d={createAreaPath(fluidityCoords)} fill="url(#gradGold)" />

                {/* Curved Lines */}
                <Path d={createCurvedPath(consistencyCoords)} fill="none" stroke="#C9465B" strokeWidth={2.4} />
                <Path d={createCurvedPath(mobilityCoords)} fill="none" stroke="#7E9B60" strokeWidth={2.4} />
                <Path d={createCurvedPath(fluidityCoords)} fill="none" stroke="#A87A5B" strokeWidth={2.4} />

                {/* Data Point Circles */}
                {consistencyCoords.map((pt, i) => (
                  <Circle
                    key={`c-${i}`}
                    cx={pt.x}
                    cy={pt.y}
                    r={selectedMonthIdx === i ? 5 : 3}
                    fill={selectedMonthIdx === i ? '#FFFFFF' : '#C9465B'}
                    stroke="#C9465B"
                    strokeWidth={selectedMonthIdx === i ? 2.5 : 1.5}
                  />
                ))}

                {mobilityCoords.map((pt, i) => (
                  <Circle
                    key={`m-${i}`}
                    cx={pt.x}
                    cy={pt.y}
                    r={selectedMonthIdx === i ? 5 : 3}
                    fill={selectedMonthIdx === i ? '#FFFFFF' : '#7E9B60'}
                    stroke="#7E9B60"
                    strokeWidth={selectedMonthIdx === i ? 2.5 : 1.5}
                  />
                ))}

                {fluidityCoords.map((pt, i) => (
                  <Circle
                    key={`f-${i}`}
                    cx={pt.x}
                    cy={pt.y}
                    r={selectedMonthIdx === i ? 5 : 3}
                    fill={selectedMonthIdx === i ? '#FFFFFF' : '#A87A5B'}
                    stroke="#A87A5B"
                    strokeWidth={selectedMonthIdx === i ? 2.5 : 1.5}
                  />
                ))}

                {/* X-Axis Month Labels */}
                {months.map((m, i) => {
                  const x = paddingLeft + (i / (months.length - 1)) * graphW;
                  const isSelected = selectedMonthIdx === i;
                  return (
                    <SvgText
                      key={`${m}-${i}`}
                      x={x}
                      y={chartHeight - 8}
                      fontSize={isSelected ? '10' : '9'}
                      fontWeight={isSelected ? '700' : '400'}
                      fill={isSelected ? '#2A2320' : colors.textTertiary}
                      textAnchor="middle"
                      fontFamily={fontFamilies.monoMedium}
                    >
                      {m}
                    </SvgText>
                  );
                })}
              </Svg>

              {/* Floating Dark Tooltip Box for Selected Month */}
              <View
                style={[
                  styles.chartTooltip,
                  {
                    left: Math.max(16, Math.min(selectedX - 65, chartWidth - 145)),
                    top: 36,
                  },
                ]}
              >
                <Text style={styles.tooltipMonth}>{selectedMonthName}</Text>
                <View style={styles.tooltipRow}>
                  <View style={[styles.tooltipDot, { backgroundColor: '#C9465B' }]} />
                  <Text style={styles.tooltipLabel}>Consistency</Text>
                  <Text style={styles.tooltipValue}>{selectedConsistency}%</Text>
                </View>
                <View style={styles.tooltipRow}>
                  <View style={[styles.tooltipDot, { backgroundColor: '#7E9B60' }]} />
                  <Text style={styles.tooltipLabel}>Mobility</Text>
                  <Text style={styles.tooltipValue}>{selectedMobility} pts</Text>
                </View>
                <View style={styles.tooltipRow}>
                  <View style={[styles.tooltipDot, { backgroundColor: '#A87A5B' }]} />
                  <Text style={styles.tooltipLabel}>Fluidity</Text>
                  <Text style={styles.tooltipValue}>{selectedFluidity} hrs</Text>
                </View>
              </View>
            </View>

            {/* Chart Legend */}
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendIndicator, { backgroundColor: '#C9465B' }]} />
                <Text style={styles.legendText}>Consistency</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendIndicator, { backgroundColor: '#7E9B60' }]} />
                <Text style={styles.legendText}>Mobility</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendIndicator, { backgroundColor: '#A87A5B' }]} />
                <Text style={styles.legendText}>Fluidity</Text>
              </View>
            </View>
          </>
        )}
      </View>

      {/* ── LIFETIME MOVEMENT STATS SECTION ── */}
      <View style={styles.statsSection}>
        <View style={styles.kickerRow}>
          <Trophy size={13} color={colors.primary} />
          <Text style={styles.kickerText}>{t('garden.lifetimeImpact')}</Text>
        </View>
        <Text style={styles.sectionHeading}>{t('garden.lifetimeImpact')}</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Trophy size={18} color={colors.primary} />
            <Text style={styles.statBoxVal}>{lifetimeStats.totalWorkouts}</Text>
            <Text style={styles.statBoxLbl}>{t('nav.today').toUpperCase()}</Text>
          </View>
          <View style={styles.statBox}>
            <Dumbbell size={18} color={colors.sageDark} />
            <Text style={styles.statBoxVal}>
              {lifetimeStats.totalVolumeKg > 0 ? lifetimeStats.totalVolumeKg.toLocaleString() : '0'}
              <Text style={{ fontSize: 11 }}>kg</Text>
            </Text>
            <Text style={styles.statBoxLbl}>VOLUME</Text>
          </View>
          <View style={styles.statBox}>
            <Flame size={18} color={colors.warning} />
            <Text style={styles.statBoxVal}>
              {lifetimeStats.currentStreak}
              <Text style={{ fontSize: 11 }}>d</Text>
            </Text>
            <Text style={styles.statBoxLbl}>{t('home.activeStreak').toUpperCase()}</Text>
          </View>
          <View style={styles.statBox}>
            <Clock size={18} color={colors.primaryDark} />
            <Text style={styles.statBoxVal}>
              {lifetimeStats.totalTimeHours}
              <Text style={{ fontSize: 11 }}>h</Text>
            </Text>
            <Text style={styles.statBoxLbl}>TIME</Text>
          </View>
        </View>
      </View>

      {/* ── FAVORITE EXERCISES SECTION (SHOWN AFTER 3+ LOGS) ── */}
      {lifetimeStats.totalWorkouts >= 3 && (
        <View style={styles.favSection}>
          <View style={styles.favHeaderRow}>
            <View style={styles.kickerRow}>
              <Heart size={13} color={colors.primaryDark} fill={colors.primaryDark} />
              <Text style={styles.kickerText}>MOST FREQUENT</Text>
            </View>
            <Text style={styles.sectionHeading}>Favorite Exercises</Text>
          </View>

          <View style={styles.favList}>
            {topExercises.map((item) => {
              const info = getExerciseInfo(item.name);
              const isFav = favorites.includes(item.name);
              return (
                <View key={item.name} style={styles.favCard}>
                  <ExpoImage
                    source={{ uri: info.image_url }}
                    style={styles.favThumb}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    transition={150}
                  />
                  <View style={styles.favInfo}>
                    <View style={styles.favTagRow}>
                      <Text style={styles.favTag}>{item.tag.toUpperCase()}</Text>
                      <Text style={styles.favSets}>{item.sets} sets logged</Text>
                    </View>
                    <Text style={styles.favName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.favMuscle} numberOfLines={1}>{item.muscle} • {info.equipment || 'No equipment'}</Text>
                  </View>
                  <Pressable
                    onPress={() => toggleFavorite(item.name)}
                    hitSlop={8}
                    style={styles.heartBtn}
                  >
                    <Heart
                      size={18}
                      color={isFav ? colors.primaryDark : colors.textTertiary}
                      fill={isFav ? colors.primaryDark : 'transparent'}
                    />
                  </Pressable>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Bottom padding for floating navigation bar */}
      <View style={{ height: 110 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingTop: 16,
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  kickerText: {
    fontSize: 10,
    fontFamily: fontFamilies.monoBold,
    letterSpacing: 1.8,
    color: '#3E342F',
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'PlayfairDisplay-Bold',
    letterSpacing: -0.5,
    color: colors.textPrimary,
    lineHeight: 34,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: fontFamilies.monoRegular,
    color: colors.textSecondary,
    lineHeight: 19,
  },

  // ── COLLAPSIBLE DROPDOWN CARD ──
  collapsibleCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    backgroundColor: '#FAF8F5',
    borderWidth: 1.5,
    borderColor: 'rgba(201, 99, 116, 0.25)',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#C9465B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
      default: {},
    }),
  },
  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'rgba(255, 240, 243, 0.6)',
  },
  collapsibleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sparkleIconBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(201, 99, 116, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  explanationTitle: {
    marginLeft: 10,
    fontSize: 14,
    fontFamily: fontFamilies.monoBold,
    color: colors.textPrimary,
  },
  chevronBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(201, 99, 116, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  explanationBody: {
    padding: 16,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(101, 78, 60, 0.08)',
  },
  explanationText: {
    fontSize: 12,
    fontFamily: fontFamilies.monoRegular,
    lineHeight: 18,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  boldText: {
    fontFamily: fontFamilies.monoBold,
    color: colors.textPrimary,
  },
  explanationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(101, 78, 60, 0.08)',
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: colors.sageSoft,
  },
  streakPillText: {
    fontSize: 10,
    fontFamily: fontFamilies.monoBold,
    color: colors.sageDark,
  },
  nextUpgradeText: {
    fontSize: 11,
    fontFamily: fontFamilies.monoMedium,
    color: colors.primaryDark,
  },

  // ── HERO FRAMED GARDEN IMAGE ──
  gardenHeroWrapper: {
    paddingHorizontal: 20,
    marginBottom: 26,
  },
  gardenCard: {
    borderRadius: 24,
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: 'rgba(101, 78, 60, 0.15)',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#2A2320',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: { elevation: 5 },
      default: {},
    }),
  },
  gardenImageFrame: {
    width: '100%',
    height: 230,
    position: 'relative',
  },
  gardenImage: {
    width: '100%',
    height: '100%',
  },
  gardenBadgeOverlay: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: 'rgba(42, 35, 32, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  levelBadgeText: {
    fontSize: 10,
    fontFamily: fontFamilies.monoBold,
    letterSpacing: 1.2,
    color: '#FFFFFF',
  },
  activePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#C9465B',
  },
  activePillText: {
    fontSize: 9,
    fontFamily: fontFamilies.monoBold,
    letterSpacing: 1,
    color: '#FFFFFF',
  },
  gardenDetails: {
    padding: 18,
  },
  gardenTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  gardenName: {
    fontSize: 20,
    fontFamily: 'PlayfairDisplay-Bold',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  gardenDaysReq: {
    fontSize: 11,
    fontFamily: fontFamilies.monoBold,
    color: colors.primaryDark,
  },
  gardenDesc: {
    fontSize: 12,
    fontFamily: fontFamilies.monoRegular,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  progressBarWrap: {
    marginBottom: 16,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 11,
    fontFamily: fontFamilies.monoMedium,
    color: colors.textTertiary,
  },
  progressValue: {
    fontSize: 11,
    fontFamily: fontFamilies.monoBold,
    color: colors.textPrimary,
  },
  progressBarBg: {
    width: '100%',
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(101, 78, 60, 0.10)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#C9465B',
  },
  levelSelectorRow: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(101, 78, 60, 0.08)',
  },
  levelSelectorLabel: {
    fontSize: 10,
    fontFamily: fontFamilies.monoBold,
    letterSpacing: 1,
    color: colors.textTertiary,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  levelPillsWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  levelPill: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(101, 78, 60, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 3,
  },
  levelPillSelected: {
    backgroundColor: '#C9465B',
  },
  levelPillLocked: {
    opacity: 0.6,
  },
  levelPillText: {
    fontSize: 11,
    fontFamily: fontFamilies.monoBold,
    color: colors.textSecondary,
  },
  levelPillTextSelected: {
    color: '#FFFFFF',
  },

  // ── PROGRESS AREA CHART ──
  chartSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  chartTitle: {
    fontSize: 22,
    fontFamily: 'PlayfairDisplay-Bold',
    letterSpacing: -0.4,
    color: colors.textPrimary,
    marginTop: 2,
  },
  chartPeriodBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(201, 99, 116, 0.1)',
  },
  chartPeriodText: {
    fontSize: 10,
    fontFamily: fontFamilies.monoMedium,
    color: colors.primaryDark,
  },
  svgCard: {
    borderRadius: 22,
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: 'rgba(101, 78, 60, 0.12)',
    paddingTop: 12,
    paddingBottom: 8,
    position: 'relative',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#2A2320',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  chartTooltip: {
    position: 'absolute',
    backgroundColor: 'rgba(42, 35, 32, 0.94)',
    borderRadius: 14,
    padding: 12,
    width: 140,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: { elevation: 8 },
      default: {},
    }),
  },
  tooltipMonth: {
    fontSize: 12,
    fontFamily: fontFamilies.monoBold,
    color: '#FFFFFF',
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    paddingBottom: 4,
  },
  tooltipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  tooltipDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 6,
  },
  tooltipLabel: {
    flex: 1,
    fontSize: 10,
    fontFamily: fontFamilies.monoRegular,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  tooltipValue: {
    fontSize: 11,
    fontFamily: fontFamilies.monoBold,
    color: '#FFFFFF',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 18,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendIndicator: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 11,
    fontFamily: fontFamilies.monoMedium,
    color: colors.textSecondary,
  },

  // ── LIFETIME MOVEMENT STATS ──
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeading: {
    fontSize: 20,
    fontFamily: 'PlayfairDisplay-Bold',
    color: colors.textPrimary,
    marginTop: 2,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(101, 78, 60, 0.08)',
  },
  statBoxVal: {
    fontSize: 17,
    fontFamily: fontFamilies.monoBold,
    color: colors.textPrimary,
  },
  statBoxLbl: {
    fontSize: 9,
    fontFamily: fontFamilies.monoBold,
    color: colors.textTertiary,
    letterSpacing: 0.8,
  },

  // ── FAVORITE EXERCISES ──
  favSection: {
    paddingHorizontal: 20,
  },
  favHeaderRow: {
    marginBottom: 12,
  },
  favList: {
    gap: 10,
  },
  favCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(101, 78, 60, 0.08)',
  },
  favThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F5F2EB',
    borderWidth: 1,
    borderColor: 'rgba(101, 78, 60, 0.1)',
  },
  favInfo: {
    flex: 1,
  },
  favTagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  favTag: {
    fontSize: 9,
    fontFamily: fontFamilies.monoBold,
    color: colors.primaryDark,
    letterSpacing: 0.8,
  },
  favSets: {
    fontSize: 9,
    fontFamily: fontFamilies.monoMedium,
    color: colors.sageDark,
  },
  favName: {
    fontSize: 13,
    fontFamily: fontFamilies.monoMedium,
    color: colors.textPrimary,
  },
  favMuscle: {
    fontSize: 10,
    fontFamily: fontFamilies.monoRegular,
    color: colors.textTertiary,
    marginTop: 1,
  },
  heartBtn: {
    padding: 6,
  },

  // ── EMPTY CHART CARD ──
  emptyChartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(101, 78, 60, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    marginTop: 4,
  },
  emptyChartIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(208, 120, 135, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyChartTitle: {
    fontSize: 16,
    fontFamily: fontFamilies.sansBold,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  emptyChartSub: {
    fontSize: 12.5,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  emptyChartHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.roseSoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.peachBorder,
  },
  emptyChartHintText: {
    fontSize: 11,
    fontFamily: fontFamilies.sansMedium,
    color: colors.primaryDark,
  },
});
