import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  ShoppingBag,
  Sparkles,
  Bell,
  CheckCircle2,
  Tag,
  Package,
  ShieldCheck,
  Heart,
  Feather,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { fontFamilies } from '../theme/typography';

interface StoreScreenProps {
  visible: boolean;
  onClose: () => void;
  isEmailVerified?: boolean;
}

export const StoreScreen: React.FC<StoreScreenProps> = ({
  visible,
  onClose,
  isEmailVerified = false,
}) => {
  const [notified, setNotified] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleNotifyToggle = () => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (_) {}
    setNotified((prev) => !prev);
  };

  const handleCopyDiscount = () => {
    setCopiedCode(true);
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (_) {}
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* ── TOP NAV HEADER ── */}
        <View style={styles.topNav}>
          <Pressable
            style={styles.backBtn}
            onPress={onClose}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Close store and go back"
          >
            <ArrowLeft size={20} color={colors.textPrimary} />
          </Pressable>

          <View style={styles.navTitleWrap}>
            <Text style={styles.navKicker}>FORTYWELL</Text>
            <Text style={styles.navTitle}>Store</Text>
          </View>

          <View style={styles.navRightPlaceholder}>
            <View style={styles.storeIconBadge}>
              <ShoppingBag size={15} color={colors.primary} />
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── HERO BANNER ── */}
          <View style={styles.heroSection}>
            <LinearGradient
              colors={['#FDF2F4', '#F7E7EB', '#FAF7F2']}
              style={styles.heroGradient}
            >
              <View style={styles.heroBadgeRow}>
                <Sparkles size={12} color={colors.primaryDark} />
                <Text style={styles.heroBadgeText}>MEMBER APOTHECARY & GEAR</Text>
              </View>
              <Text style={styles.heroTitle}>FortyWell Store</Text>
              <Text style={styles.heroSubtitle}>
                Curated physical editions, restorative equipment, and nervous-system rituals tailored for restorative movement.
              </Text>
            </LinearGradient>
          </View>

          {/* ── 5% MEMBER DISCOUNT BADGE IF VERIFIED ── */}
          {isEmailVerified && (
            <View style={styles.discountCard}>
              <View style={styles.discountHeader}>
                <Tag size={15} color={colors.primary} />
                <Text style={styles.discountKicker}>✦ 5% MEMBER PERK UNLOCKED</Text>
              </View>
              <Text style={styles.discountTitle}>Ready For The Next Drop</Text>
              <Text style={styles.discountDesc}>
                Your verified account automatically qualifies for 5% off all FortyWell store items.
              </Text>
              <Pressable
                style={styles.promoCodeBox}
                onPress={handleCopyDiscount}
                accessibilityRole="button"
              >
                <Text style={styles.promoCodeText}>FORTY5</Text>
                <View style={styles.promoTag}>
                  <Text style={styles.promoTagText}>
                    {copiedCode ? 'Copied! ✓' : 'Tap to Copy Code'}
                  </Text>
                </View>
              </Pressable>
            </View>
          )}

          {/* ── EMPTY STATE / IN FORMULATION HERO CARD ── */}
          <View style={styles.emptyStateCard}>
            <View style={styles.emptyIconRing}>
              <LinearGradient
                colors={['#F39EB0', '#C9465B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.emptyIconGradient}
              >
                <ShoppingBag size={28} color="#FFFFFF" strokeWidth={2} />
              </LinearGradient>
            </View>

            <Text style={styles.emptyTitle}>Season 01 Collection</Text>
            <Text style={styles.emptyPhase}>IN FORMULATION</Text>
            <Text style={styles.emptyDesc}>
              We are currently finalizing our small-batch release of pelvic alignment cushions, non-toxic resistance bands, and organic recovery balms.
            </Text>

            {/* Notify Me Button */}
            <Pressable
              style={[
                styles.notifyBtn,
                notified && styles.notifyBtnActive,
              ]}
              onPress={handleNotifyToggle}
              accessibilityRole="button"
            >
              {notified ? (
                <>
                  <CheckCircle2 size={16} color="#FFFFFF" />
                  <Text style={styles.notifyBtnTextActive}>Notification Set</Text>
                </>
              ) : (
                <>
                  <Bell size={16} color="#FFFFFF" />
                  <Text style={styles.notifyBtnText}>Notify Me When Live</Text>
                </>
              )}
            </Pressable>
          </View>

          {/* ── UPCOMING RELEASES PREVIEW TEASERS ── */}
          <View style={styles.previewSection}>
            <Text style={styles.sectionHeading}>Upcoming Releases</Text>
            <Text style={styles.sectionSubheading}>
              Designed in collaboration with physical therapists and restorative practitioners.
            </Text>

            <View style={styles.previewGrid}>
              <View style={styles.previewItemCard}>
                <View style={styles.previewIconBox}>
                  <Feather size={20} color={colors.primary} />
                </View>
                <View style={styles.previewTextWrap}>
                  <Text style={styles.previewItemTag}>EQUIPMENT</Text>
                  <Text style={styles.previewItemTitle}>Micro-Mobility Spine Roller</Text>
                  <Text style={styles.previewItemDesc}>High-density EVA designed for thoracic decompression without joint strain.</Text>
                </View>
                <View style={styles.comingSoonPill}>
                  <Text style={styles.comingSoonText}>Drop 01</Text>
                </View>
              </View>

              <View style={styles.previewItemCard}>
                <View style={styles.previewIconBox}>
                  <Heart size={20} color={colors.sageDark} />
                </View>
                <View style={styles.previewTextWrap}>
                  <Text style={styles.previewItemTag}>RITUAL</Text>
                  <Text style={styles.previewItemTitle}>Magnesium Recovery Soak</Text>
                  <Text style={styles.previewItemDesc}>Pure Zechstein magnesium flakes infused with lavender and Roman chamomile.</Text>
                </View>
                <View style={styles.comingSoonPill}>
                  <Text style={styles.comingSoonText}>Drop 01</Text>
                </View>
              </View>

              <View style={styles.previewItemCard}>
                <View style={styles.previewIconBox}>
                  <Package size={20} color={colors.primaryDark} />
                </View>
                <View style={styles.previewTextWrap}>
                  <Text style={styles.previewItemTag}>APPAREL</Text>
                  <Text style={styles.previewItemTitle}>Organic Movement Wrap</Text>
                  <Text style={styles.previewItemDesc}>Breathable organic French terry for gentle warm-ups and cooldown breathing.</Text>
                </View>
                <View style={styles.comingSoonPill}>
                  <Text style={styles.comingSoonText}>Drop 01</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── GUARANTEE BADGE ── */}
          <View style={styles.guaranteeRow}>
            <ShieldCheck size={16} color={colors.sageDark} />
            <Text style={styles.guaranteeText}>
              Member Priority Access • Carbon Neutral Shipping • 30-Day Restorative Guarantee
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceCardSelected,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  navTitleWrap: {
    alignItems: 'center',
  },
  navKicker: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.textTertiary,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: fontFamilies.soria,
  },
  navRightPlaceholder: {
    width: 38,
    alignItems: 'flex-end',
  },
  storeIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    margin: 16,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.primarySoft,
  },
  heroGradient: {
    padding: 22,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: colors.primaryDark,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: fontFamilies.soria,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
  },
  discountCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E8DCB8',
  },
  discountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  discountKicker: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: colors.primary,
  },
  discountTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  discountDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  promoCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primarySoft,
  },
  promoCodeText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.primaryDark,
    fontFamily: fontFamilies.monoBold,
  },
  promoTag: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  promoTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  emptyStateCard: {
    marginHorizontal: 16,
    padding: 28,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: colors.textPrimary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  emptyIconRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surfaceCardSelected,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyIconGradient: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: fontFamilies.soria,
    marginBottom: 4,
  },
  emptyPhase: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.primaryDark,
    marginBottom: 12,
  },
  emptyDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 20,
    maxWidth: 300,
  },
  notifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#C9465B',
    paddingVertical: 13,
    paddingHorizontal: 24,
    borderRadius: 24,
    width: '100%',
  },
  notifyBtnActive: {
    backgroundColor: colors.sageDark,
  },
  notifyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  notifyBtnTextActive: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  previewSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: fontFamilies.soria,
    marginBottom: 4,
  },
  sectionSubheading: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 14,
  },
  previewGrid: {
    gap: 12,
  },
  previewItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  previewIconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: colors.surfaceCardSelected,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewTextWrap: {
    flex: 1,
  },
  previewItemTag: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: colors.textTertiary,
    marginBottom: 2,
  },
  previewItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  previewItemDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  comingSoonPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: colors.primarySoft,
  },
  comingSoonText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primaryDark,
    letterSpacing: 0.5,
  },
  guaranteeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
  guaranteeText: {
    fontSize: 11,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 16,
  },
});
