import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Platform,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ShoppingBag, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';
import { fontFamilies } from '../theme/typography';

interface HeaderActionButtonsProps {
  onOpenStore: () => void;
  onOpenProfile: () => void;
  userMonogram?: string;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const HeaderActionButtons: React.FC<HeaderActionButtonsProps> = ({
  onOpenStore,
  onOpenProfile,
  userMonogram = 'M',
  compact = false,
  style,
}) => {
  const handleStorePress = () => {
    onOpenStore();
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (_) {}
  };

  const handleProfilePress = () => {
    onOpenProfile();
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (_) {}
  };

  const size = compact ? 38 : 44;
  const radius = size / 2;
  const iconSize = compact ? 15 : 18;

  return (
    <View style={[styles.container, style]}>
      {/* ── 1ST CIRCLE: FORTYWELL STORE BUTTON WITH CLEAR "STORE" BADGE ── */}
      <Pressable
        style={({ pressed }) => [
          styles.buttonWrapper,
          { width: size, height: size, borderRadius: radius },
          pressed && styles.buttonPressed,
        ]}
        onPress={handleStorePress}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="FortyWell Wellness Store"
        accessibilityHint="Opens the curated wellness gear and supplements shop"
      >
        <LinearGradient
          colors={['#F39EB0', '#C9465B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.storeGradient, { borderRadius: radius }]}
        >
          <ShoppingBag size={iconSize} color="#FFFFFF" strokeWidth={2.3} />
        </LinearGradient>

        {/* Crisp "STORE" Pill Badge for 100% clarity */}
        <View style={styles.storePillBadge}>
          <Text style={styles.storePillText}>STORE</Text>
        </View>
      </Pressable>

      {/* ── 2ND CIRCLE: USER MONOGRAM / PROFILE & SETTINGS ── */}
      <Pressable
        style={({ pressed }) => [
          styles.buttonWrapper,
          { width: size, height: size, borderRadius: radius },
          pressed && styles.buttonPressed,
        ]}
        onPress={handleProfilePress}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Account and Profile Settings"
        accessibilityHint="Opens profile preferences, sound, notifications, and language"
      >
        <View
          style={[
            styles.avatarInner,
            {
              width: size,
              height: size,
              borderRadius: radius,
            },
          ]}
        >
          <Text style={[styles.avatarMonogram, { fontSize: compact ? 13 : 15 }]}>
            {userMonogram}
          </Text>
        </View>

        {/* Sparkle Badge */}
        <View style={styles.sparkleBadge}>
          <Sparkles size={compact ? 8 : 10} color="#FFFFFF" />
        </View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  buttonWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#C9465B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.22,
        shadowRadius: 5,
      },
      android: { elevation: 3 },
      default: {
        boxShadow: '0 2px 8px rgba(201, 99, 116, 0.22)',
      },
    }),
  },
  buttonPressed: {
    transform: [{ scale: 0.94 }],
    opacity: 0.9,
  },
  storeGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storePillBadge: {
    position: 'absolute',
    bottom: -5,
    alignSelf: 'center',
    backgroundColor: '#352125',
    borderWidth: 1,
    borderColor: '#F39EB0',
    borderRadius: 6,
    paddingHorizontal: 4.5,
    paddingVertical: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.25,
        shadowRadius: 2,
      },
      android: { elevation: 2 },
      default: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      },
    }),
  },
  storePillText: {
    color: '#FFF0F3',
    fontSize: 7.5,
    fontWeight: '800',
    fontFamily: fontFamilies.sansBold,
    letterSpacing: 0.6,
  },
  avatarInner: {
    backgroundColor: '#FAF5EE',
    borderWidth: 1.5,
    borderColor: '#E1A188',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMonogram: {
    fontWeight: '700',
    color: colors.primaryDark,
    fontFamily: fontFamilies.soria,
  },
  sparkleBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: colors.primaryDark,
    borderWidth: 1.5,
    borderColor: '#FAF5EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
