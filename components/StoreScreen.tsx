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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Image as ExpoImage } from 'expo-image';
import {
  ArrowLeft,
  ShoppingBag,
  Sparkles,
  ChevronRight,
  Leaf,
  Droplet,
  HandHeart,
  ShieldCheck,
  ArrowUpRight,
  Mail,
  CheckCircle2,
  Award,
  Clock,
  Heart,
  Share2,
  Check,
  Flame,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { fontFamilies } from '../theme/typography';

const { width: SCREEN_W } = Dimensions.get('window');

// Local product photography assets
const PRODUCT_IMAGES = [
  require('../assets/products/heritage_oil_main.jpeg'),
  require('../assets/products/heritage_oil_white_platform.jpeg'),
  require('../assets/products/heritage_oil_lifestyle.jpeg'),
];

export interface Product {
  id: string;
  name: string;
  subtitle: string;
  tag: string;
  tagColor: string;
  price: number;
  originalPrice?: number;
  description: string;
  storyTitle: string;
  storySubtitle: string;
  storyParagraphs: string[];
  benefits: Array<{ title: string; desc: string; icon: 'flame' | 'leaf' | 'heart' | 'droplet' | 'clock' }>;
  ritualSteps: Array<{ step: string; title: string; desc: string }>;
  ingredients: string[];
  images: any[];
  inStock: boolean;
  isNew?: boolean;
}

const HERITAGE_OIL_PRODUCT: Product = {
  id: 'heritage-oil',
  name: 'Heritage Muscle Oil',
  subtitle: 'Small-Batch Handcrafted Restorative Elixir',
  tag: 'HANDCRAFTED',
  tagColor: colors.sageDark,
  price: 24.99,
  originalPrice: 49.99,
  description: 'A traditional, all-natural botanical blend passed down through generations to soothe joints, relieve muscle fatigue, and support restorative recovery.',
  storyTitle: 'The Story Behind The Blend',
  storySubtitle: 'Generations of care, crafted in small batches',
  storyParagraphs: [
    'Hand-harvested and crafted in small batches with zero synthetic chemicals, fillers, or artificial fragrances. This traditional formula has been passed down through our family for years — created with locally gathered botanicals and prepared with the utmost reverence for the body.',
    'Originally formulated for hardworking women and mothers needing relief from back stiffness, aching joints, and daily physical wear. Every bottle is infused slowly over weeks to ensure maximal bio-availability of the active herbs.',
    'When applied with intentional touch, it penetrates deeply to calm the nervous system, ease chronic muscle tension, and restore vitality to tired tissues.',
  ],
  benefits: [
    {
      title: 'Eases Muscle Tension & Back Stiffness',
      desc: 'Penetrates deeply into overworked muscle fibers, easing knots in the neck, shoulders, and lower back.',
      icon: 'flame',
    },
    {
      title: 'Soothes Tired & Sensitive Joints',
      desc: 'Targeted botanical relief for hips, knees, and wrists during natural hormonal transitions.',
      icon: 'leaf',
    },
    {
      title: 'Deep Relaxation & Nervous System Calming',
      desc: 'A gentle, earthy aromatic profile designed to shift your body from fight-or-flight into parasympathetic rest.',
      icon: 'heart',
    },
    {
      title: 'Nourishes & Replenishes Skin',
      desc: 'Cold-pressed natural base oils rich in natural fatty acids and antioxidants to restore skin barrier health.',
      icon: 'droplet',
    },
    {
      title: 'Post-Workout & Evening Ritual Companion',
      desc: 'The perfect pairing with your evening cooldowns, gentle mobility sessions, or soothing massage routines.',
      icon: 'clock',
    },
  ],
  ritualSteps: [
    {
      step: '01',
      title: 'Warm In Palms',
      desc: 'Dispense 4–6 drops into the center of your palm. Rub hands together to warm the botanicals and activate the natural herbal aroma.',
    },
    {
      step: '02',
      title: 'Intentional Inhale',
      desc: 'Bring your cupped hands to your face and take 3 deep, slow breaths. Let the botanical notes signal to your nervous system that it is time to unwind.',
    },
    {
      step: '03',
      title: 'Targeted Massage',
      desc: 'Massage with firm, circular motions into stiff neck, shoulders, lower back, hips, or knees after workouts or right before bed.',
    },
  ],
  ingredients: [
    'Cold-Pressed Botanical Seed Oil',
    'Wildcrafted Hypericum Extract',
    'Arnica Montana Flower Infusion',
    'Pure Frankincense & Lavender Essential Essences',
    'Vitamin E (Natural Tocopherol)',
    '100% Free of Parabens, Phthalates & Synthetics',
  ],
  images: PRODUCT_IMAGES,
  inStock: true,
  isNew: true,
};

const PRODUCTS: Product[] = [HERITAGE_OIL_PRODUCT];

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
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState<number>(0);
  const [notified, setNotified] = useState(false);

  const handleOpenProduct = (product: Product) => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (_) {}
    setActiveImageIdx(0);
    setSelectedProduct(product);
  };

  const handleCloseProduct = () => {
    setSelectedProduct(null);
  };

  const handleNotifyToggle = () => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (_) {}
    setNotified((prev) => !prev);
  };

  const handleInquirePurchase = (product: Product) => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (_) {}
    const priceText = `$${product.price.toFixed(2)}`;
    const origText = product.originalPrice ? ` (50% Off Special, Regular $${product.originalPrice.toFixed(2)})` : '';
    const subject = encodeURIComponent(`Inquiry: Order ${product.name} (FortyWell Store)`);
    const body = encodeURIComponent(
      `Hello FortyWell Team,\n\nI would like to inquire about purchasing the ${product.name} at the special price of ${priceText}${origText}.\n\nPlease let me know availability and shipping details.\n\nThank you!`
    );
    Linking.openURL(`mailto:hello@fortywell.app?subject=${subject}&body=${body}`);
  };

  const renderBenefitIcon = (type: string) => {
    switch (type) {
      case 'flame': return <Flame size={18} color={colors.primaryDark} strokeWidth={2} />;
      case 'leaf': return <Leaf size={18} color={colors.sageDark} strokeWidth={2} />;
      case 'heart': return <Heart size={18} color={colors.rose} strokeWidth={2} />;
      case 'droplet': return <Droplet size={18} color="#D4A574" strokeWidth={2} />;
      case 'clock': return <Clock size={18} color={colors.textSecondary} strokeWidth={2} />;
      default: return <Sparkles size={18} color={colors.primary} strokeWidth={2} />;
    }
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
                <Text style={styles.heroOverlineText}>CURATED RESTORATIVE APOTHECARY</Text>
              </View>
              <Text style={styles.heroTitle}>
                Small Batch.{'\n'}
                Handcrafted.{'\n'}
                <Text style={styles.heroTitleAccent}>Intentional.</Text>
              </Text>
              <Text style={styles.heroSubtitle}>
                Physical rituals for the forty-plus body. Each piece selected for its restorative power, pure ingredients, and timeless heritage.
              </Text>
            </LinearGradient>
          </View>

          {/* ── PRODUCT CARD: HERITAGE OIL (CLICKABLE TO DETAIL PAGE) ── */}
          {PRODUCTS.map((product) => (
            <View key={product.id} style={styles.productSection}>
              {product.isNew && (
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>JUST RELEASED · HANDCRAFTED</Text>
                </View>
              )}

              {/* Clickable Product Card */}
              <Pressable
                style={styles.productCard}
                onPress={() => handleOpenProduct(product)}
                accessibilityRole="button"
                accessibilityLabel={`View ${product.name} details and ritual guide`}
              >
                {/* Main Product Photography */}
                <View style={styles.productImageWrapper}>
                  <ExpoImage
                    source={product.images[0]}
                    style={styles.productMainImage}
                    contentFit="cover"
                    transition={200}
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(26,22,20,0.5)']}
                    style={styles.imageGradientOverlay}
                  />
                  <View style={styles.viewDetailsChip}>
                    <Text style={styles.viewDetailsChipText}>TAP TO VIEW STORY & RITUAL</Text>
                    <ChevronRight size={13} color="#FFFFFF" strokeWidth={2.5} />
                  </View>
                </View>

                {/* Product Info */}
                <View style={styles.productInfo}>
                  <View style={styles.productTagRow}>
                    <View style={[styles.productTag, { backgroundColor: product.tagColor + '18' }]}>
                      <Text style={[styles.productTagText, { color: product.tagColor }]}>
                        {product.tag}
                      </Text>
                    </View>
                    <View style={styles.photoCountBadge}>
                      <Text style={styles.photoCountText}>3 High-Res Photos</Text>
                    </View>
                  </View>

                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productSubtitle}>{product.subtitle}</Text>

                  <View style={styles.priceRow}>
                    <View style={styles.saleBadge}>
                      <Text style={styles.saleBadgeText}>50% OFF</Text>
                    </View>
                    {product.originalPrice && (
                      <Text style={styles.originalPrice}>${product.originalPrice.toFixed(2)}</Text>
                    )}
                    <Text style={styles.productPrice}>${product.price.toFixed(2)}</Text>
                    {isEmailVerified && (
                      <View style={styles.verifiedDiscountPill}>
                        <Sparkles size={11} color={colors.primary} />
                        <Text style={styles.verifiedDiscountText}>Member 5% Extra Off</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.productDescription}>{product.description}</Text>

                  {/* Highlights preview */}
                  <View style={styles.benefitsList}>
                    <Text style={styles.benefitsTitle}>Key Restorative Actions:</Text>
                    {product.benefits.slice(0, 3).map((benefit, idx) => (
                      <View key={idx} style={styles.benefitRow}>
                        <Leaf size={13} color={colors.sageDark} strokeWidth={2} />
                        <Text style={styles.benefitText}>{benefit.title}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Card Action Button */}
                  <View style={styles.ctaButton}>
                    <LinearGradient
                      colors={[colors.primary, colors.primaryDark]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.ctaGradient}
                    >
                      <Text style={styles.ctaButtonText}>View Product & Story</Text>
                      <ArrowUpRight size={16} color="#FFFFFF" strokeWidth={2.2} />
                    </LinearGradient>
                  </View>

                  <Text style={styles.stockStatus}>
                    <CheckCircle2 size={12} color={colors.sageDark} /> In Stock — Ships Within 48 Hours
                  </Text>
                </View>
              </Pressable>
            </View>
          ))}

          {/* ── COMING SOON SECTION ── */}
          <View style={styles.comingSoonSection}>
            <Text style={styles.comingSoonHeading}>Coming Soon to the Apothecary</Text>
            <Text style={styles.comingSoonSubtext}>
              More handpicked essentials in development — ergonomic pelvic cushions, joint recovery bands, and pure restorative herbal teas.
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
                  <Text style={styles.notifyBtnTextActive}>You're on the priority list</Text>
                </>
              ) : (
                <>
                  <Mail size={16} color="#FFFFFF" />
                  <Text style={styles.notifyBtnText}>Notify Me of New Releases</Text>
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
                  Small-batch artisan quality • Sustainable eco-friendly packaging • Direct handcrafted sourcing
                </Text>
              </View>
            </View>

            <View style={styles.guaranteeLogos}>
              <View style={styles.logoPill}>
                <Leaf size={14} color={colors.sageDark} />
                <Text style={styles.logoPillText}>100% Natural</Text>
              </View>
              <View style={styles.logoPill}>
                <HandHeart size={14} color={colors.sageDark} />
                <Text style={styles.logoPillText}>Small Batch</Text>
              </View>
              <View style={styles.logoPill}>
                <Award size={14} color={colors.sageDark} />
                <Text style={styles.logoPillText}>Family Heritage</Text>
              </View>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* ── DEDICATED PRODUCT DETAIL MODAL / PAGE ── */}
        {selectedProduct && (
          <Modal
            visible={!!selectedProduct}
            animationType="slide"
            presentationStyle="fullScreen"
            onRequestClose={handleCloseProduct}
          >
            <SafeAreaView style={styles.detailContainer} edges={['top', 'bottom']}>
              {/* Product Page Header */}
              <View style={styles.detailHeader}>
                <Pressable
                  style={styles.detailBackBtn}
                  onPress={handleCloseProduct}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel="Back to store"
                >
                  <ArrowLeft size={20} color={colors.textPrimary} />
                </Pressable>

                <View style={styles.detailHeaderTitleWrap}>
                  <Text style={styles.detailHeaderKicker}>APOTHECARY ESSENTIAL</Text>
                  <Text style={styles.detailHeaderTitle} numberOfLines={1}>
                    {selectedProduct.name}
                  </Text>
                </View>

                <Pressable
                  style={styles.detailShareBtn}
                  onPress={() => {
                    if (typeof navigator !== 'undefined' && (navigator as any).share) {
                      (navigator as any).share({
                        title: selectedProduct.name,
                        text: `${selectedProduct.name} — Handcrafted Restorative Muscle Oil from FortyWell`,
                        url: 'https://fortywell-app.vercel.app',
                      }).catch(() => {});
                    }
                  }}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="Share product"
                >
                  <Share2 size={18} color={colors.textPrimary} />
                </Pressable>
              </View>

              <ScrollView
                style={styles.detailScrollView}
                contentContainerStyle={styles.detailScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {/* ── PHOTO GALLERY / CAROUSEL ── */}
                <View style={styles.galleryContainer}>
                  {/* Active Featured Image */}
                  <View style={styles.mainGalleryImageFrame}>
                    <ExpoImage
                      source={selectedProduct.images[activeImageIdx]}
                      style={styles.mainGalleryImage}
                      contentFit="cover"
                      transition={250}
                    />
                    <View style={styles.galleryCounterBadge}>
                      <Text style={styles.galleryCounterText}>
                        {activeImageIdx + 1} / {selectedProduct.images.length}
                      </Text>
                    </View>
                  </View>

                  {/* Thumbnail Row */}
                  <View style={styles.thumbnailsRow}>
                    {selectedProduct.images.map((img, idx) => (
                      <Pressable
                        key={idx}
                        onPress={() => {
                          try { if (Platform.OS !== 'web') Haptics.selectionAsync(); } catch (_) {}
                          setActiveImageIdx(idx);
                        }}
                        style={[
                          styles.thumbnailBtn,
                          activeImageIdx === idx && styles.thumbnailBtnActive,
                        ]}
                      >
                        <ExpoImage
                          source={img}
                          style={styles.thumbnailImage}
                          contentFit="cover"
                        />
                        {activeImageIdx === idx && (
                          <View style={styles.thumbnailActiveRing} />
                        )}
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* ── MAIN PRODUCT INFO ── */}
                <View style={styles.detailInfoBox}>
                  <View style={styles.detailTagRow}>
                    <View style={[styles.productTag, { backgroundColor: selectedProduct.tagColor + '20' }]}>
                      <Text style={[styles.productTagText, { color: selectedProduct.tagColor }]}>
                        {selectedProduct.tag}
                      </Text>
                    </View>
                    <View style={styles.inStockPill}>
                      <CheckCircle2 size={12} color={colors.sageDark} />
                      <Text style={styles.inStockPillText}>In Stock — Handcrafted Fresh</Text>
                    </View>
                  </View>

                  <Text style={styles.detailTitle}>{selectedProduct.name}</Text>
                  <Text style={styles.detailSubtitle}>{selectedProduct.subtitle}</Text>

                  <View style={styles.detailPriceRow}>
                    <View style={styles.saleBadge}>
                      <Text style={styles.saleBadgeText}>50% OFF</Text>
                    </View>
                    {selectedProduct.originalPrice && (
                      <Text style={styles.detailOriginalPrice}>${selectedProduct.originalPrice.toFixed(2)}</Text>
                    )}
                    <Text style={styles.detailPriceBig}>${selectedProduct.price.toFixed(2)}</Text>
                    <Text style={styles.detailPriceNote}>Includes shipping inquiry</Text>
                  </View>

                  {isEmailVerified && (
                    <View style={styles.discountBannerDetail}>
                      <Sparkles size={14} color={colors.primary} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.discountBannerTitle}>5% Member Privilege Unlocked</Text>
                        <Text style={styles.discountBannerDesc}>
                          Your verified email grants code <Text style={{ fontWeight: '700' }}>FORTY5</Text> for 5% off this order.
                        </Text>
                      </View>
                    </View>
                  )}

                  <Text style={styles.detailDescriptionLead}>{selectedProduct.description}</Text>
                </View>

                {/* ── THE HERITAGE STORY (PLACED SPECIFICALLY HERE) ── */}
                <View style={styles.storyDetailCard}>
                  <LinearGradient
                    colors={['#2D2622', '#1E1917']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.storyDetailGradient}
                  >
                    <View style={styles.storyDetailHeader}>
                      <View style={styles.storyIconWrap}>
                        <HandHeart size={20} color="#D4A574" />
                      </View>
                      <View>
                        <Text style={styles.storyDetailKicker}>HERITAGE & ROOTS</Text>
                        <Text style={styles.storyDetailHeading}>{selectedProduct.storyTitle}</Text>
                      </View>
                    </View>

                    {selectedProduct.storyParagraphs.map((para, i) => (
                      <Text key={i} style={styles.storyDetailBodyText}>
                        {para}
                      </Text>
                    ))}

                    <View style={styles.storyQuoteBox}>
                      <Sparkles size={14} color="#D4A574" style={{ marginTop: 2 }} />
                      <Text style={styles.storyQuoteText}>
                        "A ritual of care passed through hands and generations, made to honor the wisdom of your body."
                      </Text>
                    </View>
                  </LinearGradient>
                </View>

                {/* ── COMPREHENSIVE BENEFITS GRID ── */}
                <View style={styles.detailSectionBlock}>
                  <View style={styles.sectionHeadingRow}>
                    <Award size={18} color={colors.primaryDark} />
                    <Text style={styles.detailSectionTitle}>Traditional Benefits & Restorative Uses</Text>
                  </View>

                  <View style={styles.benefitsGrid}>
                    {selectedProduct.benefits.map((b, i) => (
                      <View key={i} style={styles.benefitCard}>
                        <View style={styles.benefitIconWrap}>
                          {renderBenefitIcon(b.icon)}
                        </View>
                        <View style={styles.benefitCardContent}>
                          <Text style={styles.benefitCardTitle}>{b.title}</Text>
                          <Text style={styles.benefitCardDesc}>{b.desc}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>

                {/* ── THE DAILY RITUAL (HOW TO USE) ── */}
                <View style={styles.detailSectionBlock}>
                  <View style={styles.sectionHeadingRow}>
                    <Sparkles size={18} color={colors.primaryDark} />
                    <Text style={styles.detailSectionTitle}>The Restorative Ritual (How to Use)</Text>
                  </View>

                  <View style={styles.ritualContainer}>
                    {selectedProduct.ritualSteps.map((step, idx) => (
                      <View key={idx} style={styles.ritualStepRow}>
                        <View style={styles.ritualStepNumberBadge}>
                          <Text style={styles.ritualStepNumber}>{step.step}</Text>
                        </View>
                        <View style={styles.ritualStepTextWrap}>
                          <Text style={styles.ritualStepTitle}>{step.title}</Text>
                          <Text style={styles.ritualStepDesc}>{step.desc}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>

                {/* ── INGREDIENTS PURITY ── */}
                <View style={styles.detailSectionBlock}>
                  <View style={styles.sectionHeadingRow}>
                    <Leaf size={18} color={colors.sageDark} />
                    <Text style={styles.detailSectionTitle}>Pure Botanical Ingredients</Text>
                  </View>

                  <View style={styles.ingredientsBox}>
                    {selectedProduct.ingredients.map((ing, idx) => (
                      <View key={idx} style={styles.ingredientRow}>
                        <Check size={14} color={colors.sageDark} strokeWidth={2.5} />
                        <Text style={styles.ingredientText}>{ing}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Bottom space for sticky CTA */}
                <View style={{ height: 110 }} />
              </ScrollView>

              {/* ── STICKY BOTTOM INQUIRY ACTION BAR ── */}
              <View style={styles.bottomActionBar}>
                <View style={styles.bottomPriceCol}>
                  <Text style={styles.bottomPriceLabel}>SPECIAL PRICE</Text>
                  {selectedProduct.originalPrice && (
                    <Text style={styles.bottomOriginalPrice}>${selectedProduct.originalPrice.toFixed(2)}</Text>
                  )}
                  <Text style={styles.bottomPriceValue}>${selectedProduct.price.toFixed(2)}</Text>
                </View>

                <Pressable
                  style={styles.bottomInquireBtn}
                  onPress={() => handleInquirePurchase(selectedProduct)}
                  accessibilityRole="button"
                  accessibilityLabel="Inquire to purchase this product"
                >
                  <LinearGradient
                    colors={[colors.primary, colors.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.bottomInquireGrad}
                  >
                    <Text style={styles.bottomInquireText}>Inquire to Purchase</Text>
                    <ArrowUpRight size={18} color="#FFFFFF" strokeWidth={2.2} />
                  </LinearGradient>
                </Pressable>
              </View>
            </SafeAreaView>
          </Modal>
        )}
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
    padding: 26,
    minHeight: 220,
    justifyContent: 'center',
  },
  heroOverline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  heroOverlineText: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1.8,
    color: '#D4A574',
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '700',
    fontFamily: fontFamilies.soria,
    color: '#FAF8F5',
    lineHeight: 36,
    marginBottom: 12,
  },
  heroTitleAccent: {
    color: '#D4A574',
  },
  heroSubtitle: {
    fontSize: 13.5,
    color: 'rgba(250, 248, 245, 0.75)',
    lineHeight: 20,
    maxWidth: 300,
  },

  // ── PRODUCT CARD ──
  productSection: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  newBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: -8,
    marginLeft: 14,
    zIndex: 2,
  },
  newBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#FFFFFF',
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(101,78,60,0.1)',
    ...Platform.select({
      ios: { shadowColor: '#1A1614', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 14 },
      android: { elevation: 3 },
      default: {},
    }),
  },
  productImageWrapper: {
    width: '100%',
    height: 260,
    backgroundColor: '#1E1917',
    position: 'relative',
  },
  productMainImage: {
    width: '100%',
    height: '100%',
  },
  imageGradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 90,
  },
  viewDetailsChip: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(26,22,20,0.82)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  viewDetailsChipText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#FFFFFF',
  },
  productInfo: {
    padding: 20,
  },
  productTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  productTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  productTagText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  photoCountBadge: {
    backgroundColor: '#F5F2EB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  photoCountText: {
    fontSize: 10,
    fontFamily: fontFamilies.monoMedium,
    color: colors.textTertiary,
  },
  productName: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: fontFamilies.soria,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  productSubtitle: {
    fontSize: 12.5,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textTertiary,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  productPrice: {
    fontSize: 22,
    fontWeight: '800',
    fontFamily: fontFamilies.monoBold,
    color: colors.primary,
  },
  verifiedDiscountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  verifiedDiscountText: {
    fontSize: 10.5,
    fontFamily: fontFamilies.sansSemiBold,
    color: colors.primaryDark,
  },
  productDescription: {
    fontSize: 13.5,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  benefitsList: {
    backgroundColor: '#FAF8F5',
    padding: 14,
    borderRadius: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(101,78,60,0.06)',
  },
  benefitsTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  benefitText: {
    fontSize: 12.5,
    color: colors.textSecondary,
    flex: 1,
  },
  ctaButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 10,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  ctaButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  stockStatus: {
    fontSize: 11.5,
    color: colors.sageDark,
    textAlign: 'center',
    fontWeight: '600',
  },

  // ── COMING SOON ──
  comingSoonSection: {
    marginHorizontal: 20,
    marginTop: 26,
    padding: 22,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(101,78,60,0.08)',
    alignItems: 'center',
    textAlign: 'center',
  },
  comingSoonHeading: {
    fontSize: 17,
    fontFamily: fontFamilies.soria,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  comingSoonSubtext: {
    fontSize: 12.5,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  notifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primaryDark,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  notifyBtnActive: {
    backgroundColor: colors.sageDark,
  },
  notifyBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  notifyBtnTextActive: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ── GUARANTEE SECTION ──
  guaranteeSection: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  guaranteeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F5F2EB',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  guaranteeContent: {
    flex: 1,
  },
  guaranteeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  guaranteeText: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 15,
  },
  guaranteeLogos: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  logoPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(101,78,60,0.08)',
  },
  logoPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  // ── DEDICATED PRODUCT DETAIL VIEW ──
  detailContainer: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: '#FAF8F5',
  },
  detailBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailHeaderTitleWrap: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  detailHeaderKicker: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.6,
    color: colors.textTertiary,
  },
  detailHeaderTitle: {
    fontSize: 15,
    fontFamily: fontFamilies.soria,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  detailShareBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailScrollView: {
    flex: 1,
  },
  detailScrollContent: {
    paddingBottom: 20,
  },

  // ── GALLERY ──
  galleryContainer: {
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  mainGalleryImageFrame: {
    width: '100%',
    height: 340,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#1E1917',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(101,78,60,0.1)',
  },
  mainGalleryImage: {
    width: '100%',
    height: '100%',
  },
  galleryCounterBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(26,22,20,0.8)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  galleryCounterText: {
    fontSize: 11,
    fontFamily: fontFamilies.monoBold,
    color: '#FFFFFF',
  },
  thumbnailsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  thumbnailBtn: {
    flex: 1,
    height: 72,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  thumbnailBtnActive: {
    borderColor: colors.primary,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailActiveRing: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(201,70,91,0.1)',
  },

  // ── DETAIL INFO BOX ──
  detailInfoBox: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  detailTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  inStockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.sageSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  inStockPillText: {
    fontSize: 10.5,
    fontFamily: fontFamilies.sansSemiBold,
    color: colors.sageDark,
  },
  detailTitle: {
    fontSize: 28,
    fontFamily: fontFamilies.soria,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 3,
  },
  detailSubtitle: {
    fontSize: 13.5,
    color: colors.textTertiary,
    marginBottom: 12,
  },
  detailPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 14,
  },
  detailPriceBig: {
    fontSize: 28,
    fontFamily: fontFamilies.monoBold,
    fontWeight: '800',
    color: colors.primary,
  },
  detailPriceNote: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  discountBannerDetail: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.primarySoft,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(201, 99, 116, 0.22)',
  },
  discountBannerTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.primaryDark,
    marginBottom: 2,
  },
  discountBannerDesc: {
    fontSize: 11.5,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  detailDescriptionLead: {
    fontSize: 14.5,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 8,
  },

  // ── STORY CARD IN DETAIL ──
  storyDetailCard: {
    marginHorizontal: 18,
    marginTop: 18,
    borderRadius: 22,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#1A1614', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 16 },
      android: { elevation: 4 },
      default: {},
    }),
  },
  storyDetailGradient: {
    padding: 24,
  },
  storyDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  storyIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(212,165,116,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyDetailKicker: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.8,
    color: '#D4A574',
  },
  storyDetailHeading: {
    fontSize: 18,
    fontFamily: fontFamilies.soria,
    fontWeight: '700',
    color: '#FAF8F5',
  },
  storyDetailBodyText: {
    fontSize: 13.5,
    color: 'rgba(250,248,245,0.85)',
    lineHeight: 21,
    marginBottom: 12,
  },
  storyQuoteBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    padding: 14,
    borderRadius: 14,
    marginTop: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#D4A574',
  },
  storyQuoteText: {
    flex: 1,
    fontSize: 12.5,
    fontStyle: 'italic',
    color: '#FAF8F5',
    lineHeight: 18,
  },

  // ── DETAIL SECTION BLOCKS ──
  detailSectionBlock: {
    paddingHorizontal: 18,
    marginTop: 24,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontFamily: fontFamilies.soria,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  // Benefits Grid
  benefitsGrid: {
    gap: 10,
  },
  benefitCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(101,78,60,0.08)',
  },
  benefitIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FAF8F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  benefitCardContent: {
    flex: 1,
  },
  benefitCardTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  benefitCardDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },

  // Ritual Steps
  ritualContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(101,78,60,0.08)',
    gap: 14,
  },
  ritualStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  ritualStepNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ritualStepNumber: {
    fontSize: 12,
    fontFamily: fontFamilies.monoBold,
    color: colors.primary,
  },
  ritualStepTextWrap: {
    flex: 1,
  },
  ritualStepTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  ritualStepDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },

  // Ingredients Box
  ingredientsBox: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(101,78,60,0.08)',
    gap: 8,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ingredientText: {
    fontSize: 12.5,
    color: colors.textSecondary,
    flex: 1,
  },

  // ── STICKY BOTTOM ACTION BAR ──
  bottomActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 10 },
      android: { elevation: 8 },
      default: {},
    }),
  },
  bottomPriceCol: {
    justifyContent: 'center',
  },
  bottomPriceLabel: {
    fontSize: 9.5,
    fontFamily: fontFamilies.monoMedium,
    color: colors.textTertiary,
    letterSpacing: 1,
  },
  bottomPriceValue: {
    fontSize: 22,
    fontFamily: fontFamilies.monoBold,
    color: colors.textPrimary,
  },
  bottomOriginalPrice: {
    fontSize: 12,
    fontFamily: fontFamilies.monoMedium,
    color: colors.textTertiary,
    textDecorationLine: 'line-through',
    marginBottom: 1,
  },
  originalPrice: {
    fontSize: 15,
    fontFamily: fontFamilies.monoMedium,
    color: colors.textTertiary,
    textDecorationLine: 'line-through',
    textDecorationStyle: 'solid',
  },
  detailOriginalPrice: {
    fontSize: 18,
    fontFamily: fontFamilies.monoMedium,
    color: colors.textTertiary,
    textDecorationLine: 'line-through',
    textDecorationStyle: 'solid',
  },
  saleBadge: {
    backgroundColor: '#E53935',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  saleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  bottomInquireBtn: {
    flex: 1,
    marginLeft: 20,
    borderRadius: 14,
    overflow: 'hidden',
  },
  bottomInquireGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    gap: 6,
  },
  bottomInquireText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});