/**
 * ErrorBanner — shown at the top of RhythmScreen when device is offline.
 * Warm amber/peach tone, never punishing red.
 * Animates in/out smoothly. No internet-detection library needed:
 * caller passes `isOffline` boolean (from NetInfo or similar).
 */
import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Animated,
} from 'react-native';
import { WifiOff } from 'lucide-react-native';
import { fontFamilies } from '../theme/typography';

interface ErrorBannerProps {
  isOffline: boolean;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ isOffline }) => {
  const slideAnim = useRef(new Animated.Value(-52)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOffline) {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 320, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -52, duration: 260, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [isOffline]);

  return (
    <Animated.View
      style={[
        styles.banner,
        { transform: [{ translateY: slideAnim }], opacity: opacityAnim },
      ]}
      pointerEvents={isOffline ? 'auto' : 'none'}
    >
      <WifiOff size={14} color="#7A5028" strokeWidth={2} />
      <Text style={styles.bannerText}>
        No connection — your logs will sync when you're back online
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(213, 163, 84, 0.22)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(213, 163, 84, 0.35)',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  bannerText: {
    flex: 1,
    fontSize: 12,
    fontFamily: fontFamilies.sansRegular,
    color: '#7A5028',
    lineHeight: 16,
  },
});
