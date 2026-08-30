import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  ShoppingBag,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Leaf,
  Droplet,
  HandHeart,
  ShieldCheck,
  Star,
  Award,
  ArrowUpRight,
  Mail,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { fontFamilies } from '../theme/typography';

interface StoreScreenProps {
  visible: boolean;
  onClose: () => void;
  isEmailVerified?: boolean;
}

// Product type
interface Product {
  id: string;
  name: string;
  tag: string;
  tagColor: string;
  price: number;
  originalPrice?: number;
  description: string;
  longDescription: string;
  benefits: string[];
  imagePlaceholder: string; // User will add actual images
  inStock: boolean;
  isNew?: boolean;
}

const PRODUCTS: Product[] = [
  {
    id: 'heritage-oil',
    name: 'Heritage Muscle Oil',
    tag: 'HANDCRAFTED',
    tagColor: colors.sageDark,
    price: 48,
    description: 'A traditional, all-natural oil blend passed down through generations.',
    longDescription: 'Hand-harvested and made in small batches with no synthetic ingredients. This traditional oil blend has been passed down through my family for years — crafted with locally gathered ingredients and prepared with the utmost care.',
    benefits: [
      'Eases muscle tension and back pain',
      'Supports relaxation after workouts',
      'Soothes tired joints',
      'Nourishes skin and hair',
      'Perfect for massage therapy',
    ],
    imagePlaceholder: 'oil',
    inStock: true,
    isNew: true,
  },
];

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

  const handleContact = () => {
    Linking.openURL('mailto:hello@fortywell.app?subject=Heritage%20Oil%20Inquiry');
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
            <Text style={styles.navTitle}>Apothecary</Text>
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
          {/* ── EDITORIAL HERO ── */}
          <View style={styles.heroSection}>
            <LinearGradient
              colors={['#1A1614', '#2D2622', '#3D332C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroGradient}
            >
              <View style={styles.heroOverline}>
                <Sparkles size={10} color="#D4A574" />
                <Text style={styles.heroOverlineText}>CURATED FOR YOU</Text>
              </View>
              <Text style={styles.heroTitle}>
                Small Batch.{'\n'}
                Handcrafted.{'\n'}
                <Text style={styles.heroTitleAccent}>Intentional.</Text>
              </Text>
              <Text style={styles.heroSubtitle}>
                Physical rituals for the forty-plus body.
                Each piece selected for its restorative power
                and heritage.
              </Text>
            </LinearGradient>
          </View>

          {/* ── MEMBER DISCOUNT ── */}
          {isEmailVerified && (
            <View style={styles.discountCard}>
              <View style={styles.discountHeader}>
                <Award size={15} color={colors.primary} />
                <Text style={styles.discountKicker}>✦ MEMBER PERK</Text>
              </View>
              <Text style={styles.discountTitle}>5% Off Your Order</Text>
              <Text style={styles.discountDesc}>
                Your verified account unlocks exclusive member pricing on all apothecary items.
              </Text>
              <Pressable
                style={styles.promoCodeBox}
                onPress={handleCopyDiscount}
                accessibilityRole="button"
              >
                <Text style={styles.promoCodeText}>FORTY5</Text>
                <View style={styles.promoTag}>
                  <Text style={styles.promoTagText}>
                    {copiedCode ? 'Copied! ✓' : 'Tap to Copy'}
                  </Text>
                </View>
              </Pressable>
            </View>
          )}

          {/* ── PRODUCT: HERITAGE OIL ── */}
          {PRODUCTS.map((product) => (
            <View key={product.id} style={styles.productSection}>
              {product.isNew && (
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>JUST RELEASED</Text>
                </View>
              )}

              {/* Product Hero Card */}
              <Pressable style={styles.productCard} disabled>
                {/* Placeholder for image - user will add their own */}
                <View style={styles.productImagePlaceholder}>
                  <LinearGradient
                    colors={['#D4A574', '#B8956A', '#8B7355']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.productImageGradient}
                  >
                    <View style={styles.productImageContent}>
                      <Droplet size={48} color="rgba(255,255,255,0.9)" strokeWidth={1.5} />
                      <Text style={styles.productImageLabel}>Your Photo Here</Text>
                    </View>
                  </LinearGradient>
                </View>

                {/* Product Info Overlay */}
                <View style={styles.productInfo}>
                  <View style={styles.productTagRow}>
                    <View style={[styles.productTag, { backgroundColor: product.tagColor + '20' }]}>
                      <Text style={[styles.productTagText, { color: product.tagColor }]}>
                        {product.tag}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productPrice}>
                    ${product.price}
                    {product.originalPrice && (
                      <Text style={styles.productOriginalPrice}> ${product.originalPrice}</Text>
                    )}
                  </Text>

                  <Text style={styles.productDescription}>{product.description}</Text>

                  {/* Benefits List */}
                  <View style={styles.benefitsList}>
                    <Text style={styles.benefitsTitle}>Traditionally Used For:</Text>
                    {product.benefits.map((benefit, idx) => (
                      <View key={idx} style={styles.benefitRow}>
                        <Leaf size={12} color={colors.sageDark} />
                        <Text style={styles.benefitText}>{benefit}</Text>
                      </View>
                    ))}
                  </View>

                  {/* CTA Button */}
                  <Pressable
                    style={styles.ctaButton}
                    onPress={handleContact}
                    accessibilityRole="button"
                  >
                    <LinearGradient
                      colors={[colors.primary, colors.primaryDark]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.ctaGradient}
                    >
                      <Text style={styles.ctaButtonText}>Inquire to Purchase</Text>
                      <ArrowUpRight size={16} color="#FFFFFF" />
                    </LinearGradient>
                  </Pressable>

                  <Text style={styles.stockStatus}>
                    {product.inStock ? (
                      <><CheckCircle2 size={12} color={colors.sageDark} /> In Stock — Ships Within 48 Hours</>
                    ) : (
                      'Currently Out of Stock'
                    )}
                  </Text>
                </View>
              </Pressable>

              {/* Product Story Card */}
              <View style={styles.storyCard}>
                <View style={styles.storyHeader}>
                  <HandHeart size={18} color={colors.primary} />
                  <Text style={styles.storyTitle}>The Story</Text>
                </View>
                <Text style={styles.storyText}>
                  {product.longDescription}
                </Text>
              </View>
            </View>
          ))}

          {/* ── COMING SOON SECTION ── */}
          <View style={styles.comingSoonSection}>
            <Text style={styles.comingSoonHeading}>Coming Soon</Text>
            <Text style={styles.comingSoonSubtext}>
              More handpicked essentials in development — pelvic cushions, recovery tools, and organic essentials.
            </Text>

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
                  <Text style={styles.notifyBtnTextActive}>You're on the list</Text>
                </>
              ) : (
                <>
                  <Mail size={16} color="#FFFFFF" />
                  <Text style={styles.notifyBtnText}>Notify Me</Text>
                </>
              )}
            </Pressable>
          </View>

          {/* ── GUARANTEE BADGE ── */}
          <View style={styles.guaranteeSection}>
            <View style={styles.guaranteeCard}>
              <ShieldCheck size={20} color={colors.sageDark} />
              <View style={styles.guaranteeContent}>
                <Text style={styles.guaranteeTitle}>The FortyWell Promise</Text>
                <Text style={styles.guaranteeText}>
                  Member priority access • Carbon-neutral shipping • 30-day satisfaction guarantee
                </Text>
              </View>
            </View>

            <View style={styles.guaranteeLogos}>
              <View style={styles.logoPill}>
                <Leaf size={14} color={colors.sageDark} />
                <Text style={styles.logoPillText}>Natural</Text>
              </View>
              <View style={styles.logoPill}>
                <HandHeart size={14} color={colors.sageDark} />
                <Text style={styles.logoPillText}>Small Batch</Text>
              </View>
              <View style={styles.logoPill}>
                <Award size={14} color={colors.sageDark} />
                <Text style={styles.logoPillText}>Heritage</Text>
              </View>
            </View>
          </View>

          {/* Bottom padding */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: '#FAF8F5',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
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

  // ── EDITORIAL HERO ──
  heroSection: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 24,
    overflow: 'hidden',
  },
  heroGradient: {
    padding: 28,
    minHeight: 240,
    justifyContent: 'center',
  },
  heroOverline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  heroOverlineText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#D4A574',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '700',
    fontFamily: fontFamilies.soria,
    color: '#FAF8F5',
    lineHeight: 38,
    marginBottom: 16,
  },
  heroTitleAccent: {
    color: '#D4A574',
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(250, 248, 245, 0.7)',
    lineHeight: 21,
    maxWidth: 280,
  },

  // ── DISCOUNT CARD ──
  discountCard: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 18,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8DCB8',
    ...Platform.select({
      ios: { shadowColor: '#1A1614', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
      default: {},
    }),
  },
  discountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  discountKicker: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: colors.primary,
  },
  discountTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
    fontFamily: fontFamilies.soria,
  },
  discountDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  promoCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF8F5',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  promoCodeText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.primaryDark,
    fontFamily: fontFamilies.monoBold,
  },
  promoTag: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  promoTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primaryDark,
  },

  // ── PRODUCT SECTION ──
  productSection: {
    marginHorizontal: 20,
    marginTop: 28,
  },
  newBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.sage,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 12,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#FFFFFF',
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      ios: { shadowColor: '#1A1614', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
      android: { elevation: 3 },
      default: {},
    }),
  },
  productImagePlaceholder: {
    height: 220,
    overflow: 'hidden',
  },
  productImageGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImageContent: {
    alignItems: 'center',
    gap: 12,
  },
  productImageLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
  },
  productInfo: {
    padding: 20,
  },
  productTagRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  productTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  productTagText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  productName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: fontFamilies.soria,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primaryDark,
    fontFamily: fontFamilies.monoBold,
    marginBottom: 12,
  },
  productOriginalPrice: {
    fontSize: 16,
    color: colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  productDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
    marginBottom: 16,
  },

  // ── BENEFITS ──
  benefitsList: {
    marginBottom: 20,
  },
  benefitsTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.textPrimary,
    marginBottom: 12,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  benefitText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },

  // ── CTA BUTTON ──
  ctaButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  ctaButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  stockStatus: {
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },

  // ── STORY CARD ──
  storyCard: {
    marginTop: 16,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  storyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  storyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  storyText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    fontStyle: 'italic',
  },

  // ── COMING SOON ──
  comingSoonSection: {
    marginHorizontal: 20,
    marginTop: 36,
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  comingSoonHeading: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: fontFamilies.soria,
    marginBottom: 8,
  },
  comingSoonSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  notifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primaryDark,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 30,
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

  // ── GUARANTEE ──
  guaranteeSection: {
    marginHorizontal: 20,
    marginTop: 28,
  },
  guaranteeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    padding: 18,
    backgroundColor: colors.sageSoft,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.sageBorder,
  },
  guaranteeContent: {
    flex: 1,
  },
  guaranteeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.sageDark,
    marginBottom: 4,
  },
  guaranteeText: {
    fontSize: 12,
    color: colors.sageDark,
    lineHeight: 17,
    opacity: 0.85,
  },
  guaranteeLogos: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 16,
  },
  logoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});