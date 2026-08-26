/**
 * ErrorToast — lightweight bottom-anchored notification for transient errors.
 * Variants: 'save-error' | 'ai-error'
 * Auto-dismisses after 3 seconds with a shrinking progress bar.
 * Warm and non-punishing tone — no scary red colours.
 */
import React, { useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Animated,
  Dimensions,
} from 'react-native';
import { AlertCircle, Sparkles, RotateCcw } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { fontFamilies } from '../theme/typography';

const { width: SCREEN_W } = Dimensions.get('window');

export type ErrorToastVariant = 'save-error' | 'ai-error';

interface ErrorToastProps {
  visible: boolean;
  variant: ErrorToastVariant;
  onDismiss: () => void;
  onRetry?: () => void;
}

const TOAST_DURATION = 3200;

const COPY: Record<ErrorToastVariant, { icon: React.ReactNode; message: string; retry: string }> = {
  'save-error': {
    icon: <AlertCircle size={16} color="#B86A2E" strokeWidth={2} />,
    message: "Couldn't save your log right now",
    retry: 'Tap to retry',
  },
  'ai-error': {
    icon: <Sparkles size={16} color="#B86A2E" strokeWidth={2} />,
    message: 'Guidance unavailable right now',
    retry: 'Showing cached content',
  },
};

export const ErrorToast: React.FC<ErrorToastProps> = ({
  visible,
  variant,
  onDismiss,
  onRetry,
}) => {
  const slideAnim = useRef(new Animated.Value(80)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 80, duration: 220, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 180, useNativeDriver: false }),
    ]).start(() => onDismiss());
  }, [onDismiss]);

  useEffect(() => {
    if (visible) {
      progressAnim.setValue(1);
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 260, useNativeDriver: false }),
      ]).start();

      // Progress bar drains over TOAST_DURATION
      Animated.timing(progressAnim, {
        toValue: 0,
        duration: TOAST_DURATION,
        useNativeDriver: false,
      }).start();

      timerRef.current = setTimeout(() => {
        dismiss();
      }, TOAST_DURATION);
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible]);

  const content = COPY[variant];
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          opacity: opacityAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.toastInner}>
        {content.icon}
        <View style={styles.toastTextCol}>
          <Text style={styles.toastMessage}>{content.message}</Text>
          <Text style={styles.toastSub}>{content.retry}</Text>
        </View>
        {onRetry && variant === 'save-error' && (
          <Pressable onPress={onRetry} style={styles.retryBtn} hitSlop={8}>
            <RotateCcw size={14} color="#B86A2E" strokeWidth={2} />
          </Pressable>
        )}
        <Pressable onPress={dismiss} style={styles.dismissBtn} hitSlop={8}>
          <Text style={styles.dismissText}>✕</Text>
        </Pressable>
      </View>

      {/* Progress drain bar */}
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(250, 238, 222, 0.97)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(213, 163, 84, 0.45)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  toastInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  toastTextCol: {
    flex: 1,
    gap: 2,
  },
  toastMessage: {
    fontSize: 13,
    fontFamily: fontFamilies.sansMedium,
    color: '#7A5028',
    lineHeight: 17,
  },
  toastSub: {
    fontSize: 11,
    fontFamily: fontFamilies.sansRegular,
    color: '#A07040',
  },
  retryBtn: {
    padding: 4,
  },
  dismissBtn: {
    padding: 4,
  },
  dismissText: {
    fontSize: 13,
    color: '#A07040',
    fontFamily: fontFamilies.sansRegular,
  },
  progressTrack: {
    height: 3,
    backgroundColor: 'rgba(213, 163, 84, 0.18)',
  },
  progressBar: {
    height: 3,
    backgroundColor: 'rgba(213, 163, 84, 0.7)',
  },
});
