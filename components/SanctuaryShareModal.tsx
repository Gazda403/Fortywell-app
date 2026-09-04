import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Platform,
  Dimensions,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  X,
  Share2,
  Sparkles,
  Trophy,
  CheckCircle2,
  Flower2,
  Copy,
  Check,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';
import { fontFamilies } from '../theme/typography';

const { width: SCREEN_W } = Dimensions.get('window');

interface SanctuaryShareModalProps {
  visible: boolean;
  onClose: () => void;
  level: number;
  levelName: string;
  levelDesc: string;
  currentStreak: number;
  totalWorkouts: number;
  gardenImageSource: any;
}

export const SanctuaryShareModal: React.FC<SanctuaryShareModalProps> = ({
  visible,
  onClose,
  level,
  levelName,
  levelDesc,
  currentStreak,
  totalWorkouts,
  gardenImageSource,
}) => {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (_) {}

    const shareText = `🌸 My FortyWell Sanctuary just reached Level ${level} (${levelName})!\n${currentStreak} days of moving with my biology, low cortisol, and building joint strength over 40. ✨\nCheck it out at https://fortywell-app.vercel.app`;

    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      try {
        await (navigator as any).share({
          title: `FortyWell Sanctuary: Level ${level} ${levelName}`,
          text: shareText,
          url: 'https://fortywell-app.vercel.app',
        });
        return;
      } catch (_) {}
    }

    // Fallback: Copy text to clipboard
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

        <View style={styles.cardContainer}>
          {/* Postcard Frame */}
          <View style={styles.postcard}>
            {/* Header branding */}
            <View style={styles.brandHeader}>
              <View style={styles.brandRow}>
                <Sparkles size={13} color="#C9465B" />
                <Text style={styles.brandName}>FORTYWELL SANCTUARY</Text>
              </View>
              <Pressable onPress={onClose} hitSlop={10} style={styles.miniCloseBtn}>
                <X size={16} color="#7A6D66" />
              </Pressable>
            </View>

            {/* Sanctuary Artwork with Framed Bevel */}
            <View style={styles.imageFrame}>
              <ExpoImage
                source={gardenImageSource}
                style={styles.image}
                contentFit="cover"
                transition={200}
              />
              <LinearGradient
                colors={['transparent', 'rgba(25, 20, 18, 0.75)']}
                style={styles.imageGradient}
              />

              {/* Badges on image */}
              <View style={styles.levelBadge}>
                <Flower2 size={12} color="#FFFFFF" />
                <Text style={styles.levelBadgeText}>STAGE {level}</Text>
              </View>

              <View style={styles.imageCaptionBox}>
                <Text style={styles.imageCaptionTitle}>{levelName}</Text>
                <Text style={styles.imageCaptionDesc}>{levelDesc}</Text>
              </View>
            </View>

            {/* Postcard Milestone Details */}
            <View style={styles.detailsBody}>
              <View style={styles.statsStrip}>
                <View style={styles.statCol}>
                  <Text style={styles.statVal}>{currentStreak} Days</Text>
                  <Text style={styles.statLbl}>Active Streak</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCol}>
                  <Text style={styles.statVal}>{totalWorkouts || 12}</Text>
                  <Text style={styles.statLbl}>Sessions Done</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCol}>
                  <Text style={styles.statVal}>Stage {level}/6</Text>
                  <Text style={styles.statLbl}>Sanctuary Bloom</Text>
                </View>
              </View>

              {/* Personal Manifesto Quote */}
              <View style={styles.quoteBox}>
                <Text style={styles.quoteText}>
                  "I am moving with my changing biology, not against it. Prioritizing joint safety, low cortisol, and lifelong vitality."
                </Text>
                <Text style={styles.quoteAuthor}>— FortyWell Member Sanctuary</Text>
              </View>
            </View>

            {/* Footer Actions */}
            <View style={styles.actionsFooter}>
              <Pressable
                style={styles.shareBtn}
                onPress={handleShare}
                accessibilityRole="button"
                accessibilityLabel="Share Sanctuary Milestone"
              >
                <LinearGradient
                  colors={['#F39EB0', '#C9465B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.shareBtnGradient}
                >
                  {copied ? (
                    <>
                      <Check size={16} color="#FFFFFF" />
                      <Text style={styles.shareBtnText}>Milestone Copied to Clipboard!</Text>
                    </>
                  ) : (
                    <>
                      <Share2 size={16} color="#FFFFFF" />
                      <Text style={styles.shareBtnText}>Share Sanctuary Milestone</Text>
                    </>
                  )}
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 16, 14, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 390,
  },
  postcard: {
    backgroundColor: '#FAF5EE',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#E8DCCF',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.28,
        shadowRadius: 20,
      },
      android: { elevation: 8 },
      default: {
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
      },
    }),
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandName: {
    fontSize: 10.5,
    fontFamily: fontFamilies.monoBold,
    letterSpacing: 1.8,
    color: '#3E342F',
  },
  miniCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageFrame: {
    position: 'relative',
    height: 220,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#352F2B',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 100,
  },
  levelBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(40, 32, 28, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  levelBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: fontFamilies.monoBold,
    letterSpacing: 1,
  },
  imageCaptionBox: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    right: 14,
  },
  imageCaptionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: fontFamilies.soria,
    fontWeight: '700',
    marginBottom: 2,
  },
  imageCaptionDesc: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    fontFamily: fontFamilies.sansRegular,
  },
  detailsBody: {
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#EDE2D5',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 14,
    fontFamily: fontFamilies.sansBold,
    color: colors.primaryDark,
  },
  statLbl: {
    fontSize: 9.5,
    fontFamily: fontFamilies.sansRegular,
    color: '#7A6D66',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E8DDD0',
  },
  quoteBox: {
    backgroundColor: 'rgba(208, 120, 135, 0.08)',
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#C9465B',
  },
  quoteText: {
    fontSize: 11.5,
    fontFamily: fontFamilies.sansRegular,
    fontStyle: 'italic',
    color: '#3E342F',
    lineHeight: 16,
  },
  quoteAuthor: {
    fontSize: 9.5,
    fontFamily: fontFamilies.sansBold,
    color: colors.primaryDark,
    marginTop: 4,
    textAlign: 'right',
  },
  actionsFooter: {
    padding: 18,
  },
  shareBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  shareBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontFamily: fontFamilies.sansBold,
    letterSpacing: 0.3,
  },
});
