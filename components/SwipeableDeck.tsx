import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';
import { fontFamilies } from '../theme/typography';
import { QuizOption } from '../types/onboarding';

const { width: W } = Dimensions.get('window');

const SWIPE_THRESHOLD = W * 0.25;
const CARD_PEEK = 8; // px each card behind peeks below

// Per-card background tones for deck depth
const CARD_BG = ['#F7F0E6', '#F2E9DC', '#EDE3D5', '#E8DCC9', '#E3D5BD'];

interface SwipeableDeckProps {
  options: QuizOption[];
  selectedIds: string[];
  onSelect: (id: string) => void;
  onDeselect: (id: string) => void;
}

// ─── Individual draggable card ────────────────────────────────────────────────
const DeckCard = React.memo(function DeckCard({
  option,
  depthIndex,
  isTop,
  onSwipeRight,
  onSwipeLeft,
  entranceDelay,
}: {
  option: QuizOption;
  depthIndex: number; // 0 = front, 1 = behind, etc.
  isTop: boolean;
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
  entranceDelay: number;
}) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(50);
  const opacity = useSharedValue(0);
  const isDragging = useSharedValue(false);

  // Stacked position for non-top cards
  const stackOffsetY = depthIndex * CARD_PEEK;
  const stackScale = 1 - depthIndex * 0.02;
  const stackRotate = depthIndex % 2 === 0
    ? -depthIndex * 1.0
    : depthIndex * 1.0;

  // Entrance animation
  useEffect(() => {
    opacity.value = withDelay(entranceDelay, withTiming(1, { duration: 300 }));
    translateY.value = withDelay(
      entranceDelay,
      withSpring(stackOffsetY, { damping: 14, stiffness: 100 })
    );
  }, [entranceDelay, stackOffsetY]);

  const triggerHaptic = useCallback(() => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (_) {}
  }, []);

  const triggerHapticLight = useCallback(() => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (_) {}
  }, []);

  const panGesture = Gesture.Pan()
    .enabled(isTop)
    .onStart(() => {
      isDragging.value = true;
      runOnJS(triggerHapticLight)();
    })
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = stackOffsetY - Math.abs(e.translationX) * 0.03;
    })
    .onEnd((e) => {
      isDragging.value = false;
      if (e.translationX > SWIPE_THRESHOLD || e.velocityX > 450) {
        // SWIPE RIGHT — select
        runOnJS(triggerHaptic)();
        translateX.value = withSpring(W + 80, { damping: 12, stiffness: 80 });
        opacity.value = withTiming(0, { duration: 220 });
        runOnJS(onSwipeRight)();
      } else if (e.translationX < -SWIPE_THRESHOLD || e.velocityX < -450) {
        // SWIPE LEFT — skip to back
        runOnJS(triggerHapticLight)();
        translateX.value = withTiming(-W - 60, { duration: 200 });
        opacity.value = withTiming(0, { duration: 180 });
        runOnJS(onSwipeLeft)();
      } else {
        // Spring back to centre
        translateX.value = withSpring(0, { damping: 18, stiffness: 200 });
        translateY.value = withSpring(stackOffsetY, { damping: 14, stiffness: 120 });
      }
    });

  const animatedCardStyle = useAnimatedStyle(() => {
    const rotate = isTop
      ? interpolate(translateX.value, [-W / 2, 0, W / 2], [-8, stackRotate, 8], Extrapolate.CLAMP)
      : stackRotate;

    const scale = isTop
      ? interpolate(
          Math.abs(translateX.value),
          [0, SWIPE_THRESHOLD],
          [stackScale, stackScale * 0.98],
          Extrapolate.CLAMP
        )
      : stackScale;

    return {
      opacity: opacity.value,
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  // Action indicator overlays (RIGHT = rose, LEFT = muted)
  const rightIndicatorStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [15, SWIPE_THRESHOLD * 0.5],
      [0, 1],
      Extrapolate.CLAMP
    ),
  }));

  const leftIndicatorStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [-15, -SWIPE_THRESHOLD * 0.5],
      [0, 1],
      Extrapolate.CLAMP
    ),
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          styles.card,
          { backgroundColor: CARD_BG[Math.min(depthIndex, CARD_BG.length - 1)] },
          animatedCardStyle,
          !isTop && { zIndex: 10 - depthIndex },
          isTop && { zIndex: 20 },
        ]}
      >
        {/* SELECT indicator overlay */}
        <Animated.View style={[styles.swipeIndicator, styles.swipeRight, rightIndicatorStyle]}>
          <Text style={[styles.swipeLabel, { color: colors.primary }]}>SELECT</Text>
        </Animated.View>

        {/* SKIP indicator overlay */}
        <Animated.View style={[styles.swipeIndicator, styles.swipeLeft, leftIndicatorStyle]}>
          <Text style={styles.swipeLabel}>SKIP</Text>
        </Animated.View>

        {/* Card content */}
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{option.title}</Text>
          {option.subtitle && (
            <Text style={styles.cardSubtitle}>{option.subtitle}</Text>
          )}
          {option.badge && (
            <View style={styles.cardBadge}>
              <Text style={styles.cardBadgeText}>{option.badge.toUpperCase()}</Text>
            </View>
          )}
        </View>
      </Animated.View>
    </GestureDetector>
  );
});

// ─── Selected mini-card (in visible vertical list) ───────────────────────────
const SelectedMini = React.memo(function SelectedMini({
  option,
  onPress,
}: {
  option: QuizOption;
  onPress: () => void;
}) {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(8);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 14, stiffness: 180 });
    translateY.value = withSpring(0, { damping: 14, stiffness: 180 });
    opacity.value = withTiming(1, { duration: 220 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={styles.miniCardPressable}
      accessibilityRole="button"
      accessibilityLabel={`Deselect ${option.title}, tap to return to deck`}
    >
      <Animated.View style={[styles.miniCard, animatedStyle]}>
        <View style={styles.miniCardTextWrap}>
          <Text style={styles.miniCardTitle} numberOfLines={2}>
            {option.title}
          </Text>
        </View>
        <View style={styles.miniCardRemoveBadge}>
          <Text style={styles.miniCardX}>✕</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
});

// ─── Main SwipeableDeck ───────────────────────────────────────────────────────
export const SwipeableDeck: React.FC<SwipeableDeckProps> = ({
  options,
  selectedIds,
  onSelect,
  onDeselect,
}) => {
  const [deckOrder, setDeckOrder] = useState<number[]>(
    options.map((_, i) => i)
  );

  const handleSwipeRight = useCallback((optionIndex: number) => {
    const opt = options[optionIndex];
    onSelect(opt.id);
    setDeckOrder((prev) => prev.filter((i) => i !== optionIndex));
  }, [options, onSelect]);

  const handleSwipeLeft = useCallback((optionIndex: number) => {
    setDeckOrder((prev) => {
      const next = prev.filter((i) => i !== optionIndex);
      return [...next, optionIndex];
    });
  }, []);

  const handleDeselect = useCallback((id: string) => {
    const idx = options.findIndex((o) => o.id === id);
    onDeselect(id);
    setDeckOrder((prev) => [idx, ...prev]);
  }, [options, onDeselect]);

  const handleArrowRight = useCallback(() => {
    if (deckOrder.length === 0) return;
    const topIndex = deckOrder[0];
    handleSwipeRight(topIndex);
  }, [deckOrder, handleSwipeRight]);

  const handleArrowLeft = useCallback(() => {
    if (deckOrder.length === 0) return;
    const topIndex = deckOrder[0];
    handleSwipeLeft(topIndex);
  }, [deckOrder, handleSwipeLeft]);

  const selectedOptions = selectedIds
    .map((id) => options.find((o) => o.id === id))
    .filter(Boolean) as QuizOption[];

  return (
    <View style={styles.deckWrapper}>
      <View style={styles.row}>
        {/* ── CARD DECK ── */}
        <View style={styles.deckArea}>
          {deckOrder.length === 0 ? (
            <View style={styles.emptyDeck}>
              <Text style={styles.emptyDeckText}>
                All cards reviewed.{'\n'}Tap any selected card on the right to pull it back.
              </Text>
            </View>
          ) : (
            // Render from BACK to FRONT so front card is on top
            [...deckOrder].reverse().map((optIdx, revI) => {
              const depthIndex = deckOrder.length - 1 - revI; // 0 = front
              const isTop = depthIndex === 0;
              return (
                <DeckCard
                  key={`${options[optIdx].id}-${optIdx}`}
                  option={options[optIdx]}
                  depthIndex={depthIndex}
                  isTop={isTop}
                  onSwipeRight={() => handleSwipeRight(optIdx)}
                  onSwipeLeft={() => handleSwipeLeft(optIdx)}
                  entranceDelay={depthIndex * 40}
                />
              );
            })
          )}
        </View>

        {/* ── SELECTED PILE (distinct individual cards, non-overlapping) ── */}
        {selectedOptions.length > 0 && (
          <View style={styles.selectedRail}>
            <View style={styles.selectedHeaderRow}>
              <Text style={styles.selectedLabel}>SELECTED</Text>
              <View style={styles.selectedCountBadge}>
                <Text style={styles.selectedCountText}>{selectedOptions.length}</Text>
              </View>
            </View>
            <ScrollView
              style={styles.selectedScrollView}
              contentContainerStyle={styles.selectedStackList}
              showsVerticalScrollIndicator={false}
            >
              {selectedOptions.map((opt) => (
                <SelectedMini
                  key={opt.id}
                  option={opt}
                  onPress={() => handleDeselect(opt.id)}
                />
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* ── HINT TEXT ── */}
      <Text style={styles.hintText}>
        Swipe <Text style={styles.hintRight}>right to select</Text>
        {'  ·  '}
        <Text style={styles.hintLeft}>left to skip</Text>
      </Text>

      {/* ── ARROW FALLBACKS ── */}
      <View style={styles.arrowRow}>
        <Pressable
          onPress={handleArrowLeft}
          style={[styles.arrowBtn, deckOrder.length === 0 && styles.arrowBtnDisabled]}
          disabled={deckOrder.length === 0}
          accessibilityLabel="Skip this option"
        >
          <Text style={styles.arrowText}>← Skip</Text>
        </Pressable>

        <Pressable
          onPress={handleArrowRight}
          style={[styles.arrowBtnPrimary, deckOrder.length === 0 && styles.arrowBtnDisabled]}
          disabled={deckOrder.length === 0}
          accessibilityLabel="Select this option"
        >
          <Text style={styles.arrowTextPrimary}>Select →</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  deckWrapper: {
    flex: 1,
    paddingHorizontal: 20,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 220,
  },

  // ── DECK AREA ──
  deckArea: {
    flex: 1,
    height: 220,
    position: 'relative',
    marginTop: 4,
  },
  card: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(101,78,60,0.12)',
    minHeight: 160,
    ...Platform.select({
      ios: {
        shadowColor: '#2A2320',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: { elevation: 6 },
      default: {},
    }),
  },
  cardContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 18,
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: -0.3,
    lineHeight: 24,
    color: colors.textPrimary,
    fontFamily: fontFamilies.soria,
    marginBottom: 6,
    paddingRight: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    fontFamily: fontFamilies.monoRegular,
    lineHeight: 17,
    color: colors.textSecondary,
    letterSpacing: 0.1,
  },
  cardBadge: {
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    lineHeight: 13,
    color: colors.textTertiary,
  },

  // Swipe indicators
  swipeIndicator: {
    position: 'absolute',
    top: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1.5,
    zIndex: 30,
  },
  swipeRight: {
    right: 12,
    borderColor: colors.primary,
    backgroundColor: 'rgba(201,99,116,0.12)',
  },
  swipeLeft: {
    left: 12,
    borderColor: colors.textTertiary,
    backgroundColor: 'rgba(101,78,60,0.08)',
  },
  swipeLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: colors.textTertiary,
  },

  // Empty deck state
  emptyDeck: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
  },
  emptyDeckText: {
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 20,
    color: colors.textTertiary,
    letterSpacing: 0.2,
  },

  // ── SELECTED RAIL ──
  selectedRail: {
    width: 104,
    marginLeft: 12,
    marginTop: 4,
    maxHeight: 220,
  },
  selectedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  selectedLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.8,
    color: colors.textTertiary,
  },
  selectedCountBadge: {
    backgroundColor: colors.primarySoft,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  selectedCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  selectedScrollView: {
    flex: 1,
  },
  selectedStackList: {
    flexDirection: 'column',
    gap: 8,
    paddingBottom: 6,
  },
  miniCardPressable: {
    width: '100%',
  },
  miniCard: {
    backgroundColor: colors.surfaceCardSelected,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.primarySoft,
    paddingVertical: 8,
    paddingHorizontal: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 4,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  miniCardTextWrap: {
    flex: 1,
  },
  miniCardTitle: {
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 14,
    color: colors.primaryDark,
    letterSpacing: -0.1,
  },
  miniCardRemoveBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(201, 99, 116, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniCardX: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.primary,
    lineHeight: 11,
  },

  // ── HINT & ARROWS ──
  hintText: {
    textAlign: 'center',
    fontSize: 12,
    letterSpacing: 0.3,
    color: colors.textTertiary,
    marginTop: 12,
    marginBottom: 12,
  },
  hintRight: {
    color: colors.primary,
    fontWeight: '600',
  },
  hintLeft: {
    color: colors.textSecondary,
    fontWeight: '500',
  },
  arrowRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  arrowBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowBtnPrimary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 6,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#9F4252',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  arrowBtnDisabled: {
    opacity: 0.35,
  },
  arrowText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: colors.textSecondary,
  },
  arrowTextPrimary: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.textInverse,
  },
});
