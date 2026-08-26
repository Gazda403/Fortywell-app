import React from 'react';
import { StyleSheet, Text, View, Pressable, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';
import { typography, fontFamilies } from '../theme/typography';

interface EditorialHeaderProps {
  title: string;
  description: string;
  canGoBack: boolean;
  onBack: () => void;
  category?: string;
  stepNumber?: number;
  totalSteps?: number;
}

export const EditorialHeader: React.FC<EditorialHeaderProps> = ({
  title,
  description,
  canGoBack,
  onBack,
}) => {
  const handleBackPress = () => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch {
      // safe fallback
    }
    onBack();
  };

  return (
    <View style={styles.container}>
      {/* Back navigation — minimal, text-based */}
      {canGoBack && (
        <Pressable
          onPress={handleBackPress}
          style={styles.backButton}
          hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backLabel}>← Back</Text>
        </Pressable>
      )}

      {/* The editorial question — large serif, strong presence */}
      <View style={styles.textBlock}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  backLabel: {
    fontSize: 12,
    fontFamily: fontFamilies.monoMedium,
    letterSpacing: 0.2,
    color: colors.textSecondary,
  },
  textBlock: {},
  title: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.6,
    lineHeight: 36,
    color: colors.textPrimary,
    fontFamily: fontFamilies.soria,
    marginBottom: 12,
  },
  description: {
    fontSize: 13,
    fontFamily: fontFamilies.monoRegular,
    letterSpacing: 0.1,
    lineHeight: 20,
    color: colors.textSecondary,
  },
});
