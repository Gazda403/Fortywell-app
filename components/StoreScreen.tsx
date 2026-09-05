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
  CreditCard,
  Calendar,
  Dumbbell,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { fontFamilies } from '../theme/typography';
import { PayPalCheckoutModal } from './PayPalCheckoutModal';
import { ProgramDetailModal } from './ProgramDetailModal';
import {
  FITNESS_PROGRAMS,
  FitnessProgram,
  PROGRAMS_BUNDLE_PRICE,
  PROGRAMS_BUNDLE_ORIGINAL,
} from '../data/fitnessPrograms';

const { width: SCREEN_W } = Dimensions.get('window');

// Local product photography assets
const HERITAGE_OIL_IMAGES = [
  require('../assets/products/heritage_oil_main.jpeg'),
  require('../assets/products/heritage_oil_white_platform.jpeg'),
  require('../assets/products/heritage_oil_lifestyle.jpeg'),
];

const RESISTANCE_BANDS_IMAGES = [
  require('../assets/products/bands_3set_main.jpg'),
  require('../assets/products/bands_3set_lifestyle.jpg'),
  require('../assets/products/bands_3set_detail.jpg'),
];

const POSTURE_MAT_IMAGES = [
  require('../assets/products/mat_main.jpg'),
  require('../assets/products/mat_lifestyle.jpg'),
  require('../assets/products/mat_detail.jpg'),
];

export interface ProductVariant {
  id: string;
  name: string;
  tension?: string;
  dimensions?: string;
  colorName?: string;
  colorHex?: string;
  price: number;
  originalPrice?: number;
  badge?: string;
  isDefault?: boolean;
}

export interface Product {
  id: string;
  aliExpressProductId?: string;
  name: string;
  subtitle: string;
  tag: string;
  tagColor: string;
  price: number;
  originalPrice?: number;
  variants?: ProductVariant[];
  description: string;
  storyTitle: string;
  storySubtitle: string;
  storyParagraphs: string[];
  benefitsTitle?: string;
  benefits: Array<{ title: string; desc: string; icon: 'flame' | 'leaf' | 'heart' | 'droplet' | 'clock' }>;
  ritualTitle?: string;
  ritualSteps: Array<{ step: string; title: string; desc: string }>;
  ingredientsTitle?: string;
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
  benefitsTitle: 'Traditional Benefits & Restorative Uses',
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
  ritualTitle: 'The Restorative Ritual (How to Use)',
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
  ingredientsTitle: 'Pure Botanical Ingredients',
  ingredients: [
    'Cold-Pressed Botanical Seed Oil',
    'Wildcrafted Hypericum Extract',
    'Arnica Montana Flower Infusion',
    'Pure Frankincense & Lavender Essential Essences',
    'Vitamin E (Natural Tocopherol)',
    '100% Free of Parabens, Phthalates & Synthetics',
  ],
  images: HERITAGE_OIL_IMAGES,
  inStock: true,
  isNew: true,
};

const RESISTANCE_BANDS_PRODUCT: Product = {
  id: 'vitality-loop-bands-3set',
  aliExpressProductId: '1005012604669949',
  name: 'Vitality Power Loop Band Trio',
  subtitle: '3-Piece Progressive Resistance & Mobility Set',
  tag: 'MOBILITY ESSENTIAL',
  tagColor: '#B45309',
  price: 34.00,
  originalPrice: 68.00,
  variants: [
    {
      id: 'vitality-loop-bands-3set',
      name: 'Complete 3-Band Trio (All 3)',
      tension: 'Light + Medium + Heavy (5–65 lbs)',
      dimensions: '3-Piece Spectrum Set',
      colorName: 'Yellow, Red & Black',
      colorHex: '#B45309',
      price: 34.00,
      originalPrice: 68.00,
      badge: 'BEST VALUE · 50% OFF',
      isDefault: true,
    },
    {
      id: 'vitality-loop-band-light',
      name: 'Light Mobility Band (Yellow)',
      tension: '5–15 lbs Resistance',
      dimensions: '2080 × 4.5 × 6.4mm',
      colorName: 'Warm Yellow',
      colorHex: '#EAB308',
      price: 14.99,
      originalPrice: 24.99,
      badge: 'REHAB & MOBILITY',
    },
    {
      id: 'vitality-loop-band-medium',
      name: 'Medium Strength Band (Red)',
      tension: '15–35 lbs Resistance',
      dimensions: '2080 × 4.5 × 13mm',
      colorName: 'Crimson Red',
      colorHex: '#DC2626',
      price: 17.99,
      originalPrice: 29.99,
      badge: 'STRENGTH BUILDER',
    },
    {
      id: 'vitality-loop-band-heavy',
      name: 'Heavy Power Band (Black)',
      tension: '25–65 lbs Resistance',
      dimensions: '2080 × 4.5 × 22mm',
      colorName: 'Obsidian Black',
      colorHex: '#1F2937',
      price: 19.99,
      originalPrice: 34.99,
      badge: 'ASSIST & POWER',
    },
  ],
  description: 'A studio-grade set of multi-tension power loop bands engineered for joint-friendly strength training, assisted pull-ups, posture alignment, and restorative mobility.',
  storyTitle: 'Gentle Elastic Power for Mature Joints',
  storySubtitle: 'Variable tension designed for forty-plus longevity',
  storyParagraphs: [
    'Traditional heavy gym weights often place harsh compressive loads on mature joints, tendons, and cartilage. Our Vitality Power Loop Bands deliver smooth, accommodating elastic tension that aligns with your body\'s natural biomechanics.',
    'Crafted from 100% layered natural latex for maximum anti-snap durability and smooth tactile grip. The 3-band tension spectrum gives you total freedom to tailor resistance for any movement — from light morning shoulder pull-aparts to deep evening glute activation and lumbar decompressive traction.',
    'Designed to seamlessly accompany your daily FortyWell movement rituals, assisted pull-ups, and restorative stretches at home or on the go.',
  ],
  benefitsTitle: 'Functional Longevity & Mobility Benefits',
  benefits: [
    {
      title: 'Joint-Friendly Elastic Resistance',
      desc: 'Protects knees, hips, and shoulders with smooth progressive resistance and zero joint-jarring impact.',
      icon: 'leaf',
    },
    {
      title: 'Complete 3-Level Tension Spectrum',
      desc: 'Includes Light (5–15 lbs, Yellow), Medium (15–35 lbs, Red), and Heavy (25–65 lbs, Black) bands.',
      icon: 'flame',
    },
    {
      title: 'Posture & Shoulder Alignment',
      desc: 'Ideal for opening tight chest muscles, strengthening rear deltoids, and correcting forward neck slump.',
      icon: 'heart',
    },
    {
      title: 'Spinal Decompression & Pull-Up Assist',
      desc: 'Provides smooth bodyweight offloading for pull-ups, deep squats, and restorative traction hangs.',
      icon: 'droplet',
    },
    {
      title: 'Ultra-Compact & Travel-Ready',
      desc: 'Rolls up easily into your day bag or suitcase for mobility sessions anywhere.',
      icon: 'clock',
    },
  ],
  ritualTitle: 'The Daily Movement Ritual',
  ritualSteps: [
    {
      step: '01',
      title: 'Morning Thoracic Opener',
      desc: 'Loop the Light (Yellow) band across both palms. Perform 10 slow overhead pull-aparts while taking deep diaphragmatic breaths.',
    },
    {
      step: '02',
      title: 'Pelvis & Glute Activation',
      desc: 'Place the Medium (Red) band just above knees during glute bridge pulses or lateral steps to stabilize hips.',
    },
    {
      step: '03',
      title: 'Decompression & Stretch Cooldown',
      desc: 'Anchor the Heavy (Black) band to a door or post for guided spinal decompression and deep hamstring releases.',
    },
  ],
  ingredientsTitle: 'Premium Material Specifications',
  ingredients: [
    '100% High-Density Natural Latex',
    '3 Color-Coded Tension Loops (Yellow, Red, Black)',
    'Light: 5–15 lbs (2080 × 4.5 × 6.4mm)',
    'Medium: 15–35 lbs (2080 × 4.5 × 13mm)',
    'Heavy: 25–65 lbs (2080 × 4.5 × 22mm)',
    'Anti-Snap Continuous Layering Technology',
    'Non-Slip Skin-Safe Tactile Texture',
  ],
  images: RESISTANCE_BANDS_IMAGES,
  inStock: true,
  isNew: true,
};

const POSTURE_MAT_PRODUCT: Product = {
  id: 'posture-joint-mat',
  aliExpressProductId: '1005006960343249',
  name: 'Posture & Joint Support Mat',
  subtitle: '6mm High-Density Dual-Texture Non-Slip Restorative Exercise & Yoga Mat',
  tag: 'MOBILITY ESSENTIAL',
  tagColor: colors.sageDark,
  price: 24.99,
  originalPrice: 49.99,
  variants: [
    {
      id: 'mat-standard-6mm',
      name: 'Standard 6mm Cushion (183 × 61 cm)',
      tension: '6mm Balanced Joint Protection',
      dimensions: '183cm × 61cm × 6mm',
      colorName: 'Sage Olive',
      colorHex: '#708655',
      price: 24.99,
      originalPrice: 49.99,
      badge: 'MOST POPULAR',
      isDefault: true,
    },
    {
      id: 'mat-thick-8mm',
      name: 'Extra Thick 8mm Sensitive Knee (183 × 61 cm)',
      tension: '8mm Maximum Deep Cushion',
      dimensions: '183cm × 61cm × 8mm',
      colorName: 'Deep Forest',
      colorHex: '#4A6A35',
      price: 28.99,
      originalPrice: 57.99,
      badge: 'EXTRA KNEE RELIEF',
    },
    {
      id: 'mat-wide-6mm',
      name: 'Studio Wide 6mm (183 × 80 cm)',
      tension: '6mm Unrestricted Ground Movement',
      dimensions: '183cm × 80cm × 6mm',
      colorName: 'Sage Olive',
      colorHex: '#708655',
      price: 29.99,
      originalPrice: 59.99,
      badge: 'EXTRA WIDTH',
    },
  ],
  description:
    'Engineered for adult joints that require deeper floor protection. Crafted from high-density closed-cell eco-TPE, providing instant shock absorption for knees, wrists, and vertebrae with a textured grip that eliminates slipping during floor flows.',
  storyTitle: 'The Foundation of Pain-Free Movement',
  storySubtitle: 'Why floor padding is the difference between consistent habits and skipped workouts',
  storyParagraphs: [
    'As we cross forty, hard floors become the silent killer of daily movement consistency. Kneeling lunges irritate patellar tendons, planks cause wrist compression, and floor stretches leave the spine feeling bruised rather than restored.',
    'The FortyWell Posture & Joint Support Mat was designed specifically around this physiological reality. We calibrated a 6mm dual-density core that gives way under pressure points while maintaining firm, stable grounding so you never feel off-balance.',
    'Equipped with subtle laser-guided alignment markers to keep your hips, shoulders, and knees tracking safely, and made from 100% hypoallergenic, non-toxic closed-cell materials that wipe clean in seconds.',
  ],
  benefitsTitle: 'Physiologist-Approved Features',
  benefits: [
    {
      title: 'High-Density Knee & Hip Cushioning',
      desc: '6mm dual-layer microfoam disperses bodyweight pressure, eliminating floor bruising on knees, elbows, and hips.',
      icon: 'heart',
    },
    {
      title: 'Dual-Texture Non-Slip Traction',
      desc: 'Textured topographic grip surface anchors to hardwood and tiles without sliding or curling at the edges.',
      icon: 'leaf',
    },
    {
      title: 'Built-In Symmetry Alignment Guides',
      desc: 'Subtle center line and 45-degree angle guides ensure even hip squareness and correct joint tracking.',
      icon: 'flame',
    },
    {
      title: 'Eco-Certified & Odor-Free',
      desc: '100% recyclable, PVC-free, non-toxic TPE composite with zero chemical odor from the first unroll.',
      icon: 'droplet',
    },
    {
      title: 'Lightweight with Carry Strap',
      desc: 'Weighs under 1 kg with quick-fasten nylon shoulder carry harness included for park or travel sessions.',
      icon: 'clock',
    },
  ],
  ritualTitle: 'The Floor Reset Ritual',
  ritualSteps: [
    {
      step: '01',
      title: 'Unroll & Decompress',
      desc: 'Begin with 2 minutes lying supine with feet flat and knees bent to let your lumbar spine settle naturally onto the cushion.',
    },
    {
      step: '02',
      title: 'Ground Movement & Strength',
      desc: 'Perform your kneeling mobility flows, glute bridges, and planks with total joint comfort and zero floor pain.',
    },
    {
      step: '03',
      title: 'Wipe & Roll',
      desc: 'Give the closed-cell water-resistant surface a quick wipe with a damp cloth, roll tightly, and secure with the carry strap.',
    },
  ],
  ingredientsTitle: 'Technical Specifications',
  ingredients: [
    'Eco-Friendly Closed-Cell TPE Composite',
    'Laser-Etched Alignment Lines & Center Guideline',
    'Anti-Tear Mesh Middle Stabilization Layer',
    'Hypoallergenic, 100% PVC-Free & Latex-Free',
    'Water & Sweat Resistant Moisture-Barrier Surface',
    'Adjustable Carrying Strap Included',
  ],
  images: POSTURE_MAT_IMAGES,
  inStock: true,
  isNew: true,
};

const PRODUCTS: Product[] = [HERITAGE_OIL_PRODUCT, RESISTANCE_BANDS_PRODUCT, POSTURE_MAT_PRODUCT];

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
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<FitnessProgram | null>(null);
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
    if (product.variants && product.variants.length > 0) {
      const defaultVar = product.variants.find((v) => v.isDefault) || product.variants[0];
      setSelectedVariant(defaultVar);
    } else {
      setSelectedVariant(null);
    }
  };

  const handleCloseProduct = () => {
    setSelectedProduct(null);
    setSelectedVariant(null);
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

          {/* ── 30-DAY DIGITAL TRAINING PROGRAMS ── */}
          <View style={styles.programsSection}>
            <View style={styles.programsSectionHeader}>
              <View style={styles.programsSectionOverline}>
                <Sparkles size={11} color={colors.primary} />
                <Text style={styles.programsSectionOverlineText}>DIGITAL COACHING PROTOCOLS</Text>
              </View>
              <Text style={styles.programsSectionTitle}>30-Day Master Programs</Text>
              <Text style={styles.programsSectionSubtitle}>
                Pre-built guided workout routines and clinical diet strategies formulated specifically for 40+ physiology.
              </Text>
            </View>

            {FITNESS_PROGRAMS.map((prog) => (
              <Pressable
                key={prog.id}
                style={styles.programCard}
                onPress={() => {
                  try {
                    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  } catch (_) {}
                  setSelectedProgram(prog);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Open ${prog.name}`}
              >
                <LinearGradient
                  colors={prog.gradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.programCardGrad}
                >
                  <View style={styles.programCardTop}>
                    <View style={styles.programTagWrap}>
                      <Text style={styles.programTagText}>{prog.tag}</Text>
                    </View>
                    <View style={styles.programBadge}>
                      <Text style={styles.programBadgeText}>{prog.badge}</Text>
                    </View>
                  </View>

                  <Text style={styles.programCardTitle}>{prog.name}</Text>
                  <Text style={styles.programCardSubtitle}>{prog.subtitle}</Text>

                  <View style={styles.programMetaRow}>
                    <View style={styles.programMetaChip}>
                      <Calendar size={12} color="#FFFFFF" />
                      <Text style={styles.programMetaChipText}>30 Days</Text>
                    </View>
                    <View style={styles.programMetaChip}>
                      <Clock size={12} color="#FFFFFF" />
                      <Text style={styles.programMetaChipText}>{prog.sessionDuration}</Text>
                    </View>
                    <View style={styles.programMetaChip}>
                      <Dumbbell size={12} color="#FFFFFF" />
                      <Text style={styles.programMetaChipText}>{prog.sessionsPerWeek}x / wk</Text>
                    </View>
                  </View>

                  <View style={styles.programCardFooter}>
                    <View style={styles.programPriceWrap}>
                      <Text style={styles.programPriceCurrent}>${prog.price.toFixed(2)}</Text>
                      <Text style={styles.programPriceOld}>${prog.originalPrice.toFixed(2)}</Text>
                    </View>
                    <View style={styles.programActionBtn}>
                      <Text style={styles.programActionBtnText}>View 30-Day Plan & Diet</Text>
                      <ChevronRight size={14} color="#FFFFFF" strokeWidth={2.5} />
                    </View>
                  </View>
                </LinearGradient>
              </Pressable>
            ))}

            {/* Bundle Offer Card */}
            <View style={styles.bundleCard}>
              <LinearGradient
                colors={['#1A1614', '#2D2622']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.bundleCardGrad}
              >
                <View style={styles.bundleHeaderRow}>
                  <View style={styles.bundleTagPill}>
                    <Sparkles size={11} color="#D4A574" />
                    <Text style={styles.bundleTagText}>ULTIMATE 3-IN-1 PASS</Text>
                  </View>
                  <View style={styles.bundleSavePill}>
                    <Text style={styles.bundleSaveText}>SAVE 66%</Text>
                  </View>
                </View>

                <Text style={styles.bundleTitle}>The Complete 40+ Reset Trilogy</Text>
                <Text style={styles.bundleDesc}>
                  Unlock all three full 30-day programs (Weight Loss + Strength + Stretching) with lifetime access, exercise guides, and comprehensive nutrition playbooks.
                </Text>

                <View style={styles.bundleFooter}>
                  <View style={styles.bundlePriceCol}>
                    <View style={styles.bundlePriceRow}>
                      <Text style={styles.bundlePriceCurrent}>${PROGRAMS_BUNDLE_PRICE.toFixed(2)}</Text>
                      <Text style={styles.bundlePriceOld}>${PROGRAMS_BUNDLE_ORIGINAL.toFixed(2)}</Text>
                    </View>
                    <Text style={styles.bundlePriceMeta}>All 3 programs included</Text>
                  </View>

                  <Pressable
                    style={styles.bundleBuyBtn}
                    onPress={() => {
                      setCheckoutProduct({
                        id: 'programs-3in1-bundle',
                        name: 'Complete 40+ Reset Trilogy (3 Programs)',
                        subtitle: 'Weight Loss + Strength Routine + Stretching & Mobility (Lifetime)',
                        price: PROGRAMS_BUNDLE_PRICE,
                        originalPrice: PROGRAMS_BUNDLE_ORIGINAL,
                        tag: 'BUNDLE',
                        tagColor: colors.primaryDark,
                        description: 'Complete 30-day digital coaching trilogy.',
                        storyTitle: '',
                        storySubtitle: '',
                        storyParagraphs: [],
                        benefits: [],
                        ritualSteps: [],
                        ingredients: [],
                        images: POSTURE_MAT_IMAGES,
                        inStock: true,
                      });
                    }}
                  >
                    <Text style={styles.bundleBuyBtnText}>Unlock Trilogy</Text>
                    <ArrowUpRight size={15} color="#FFFFFF" strokeWidth={2.4} />
                  </Pressable>
                </View>
              </LinearGradient>
            </View>
          </View>

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
                    {(selectedVariant ? selectedVariant.originalPrice : selectedProduct.originalPrice) && (
                      <Text style={styles.detailOriginalPrice}>
                        ${((selectedVariant ? selectedVariant.originalPrice : selectedProduct.originalPrice) || 0).toFixed(2)}
                      </Text>
                    )}
                    <Text style={styles.detailPriceBig}>
                      ${(selectedVariant ? selectedVariant.price : selectedProduct.price).toFixed(2)}
                    </Text>
                    <Text style={styles.detailPriceNote}>Includes shipping</Text>
                  </View>

                  {/* ── VARIANT SELECTION (IF APPLICABLE) ── */}
                  {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                    <View style={styles.variantSection}>
                      <View style={styles.variantSectionHeader}>
                        <Text style={styles.variantSectionTitle}>Choose Option / Tension:</Text>
                        {selectedVariant && (
                          <Text style={styles.variantSelectedLabel}>{selectedVariant.name}</Text>
                        )}
                      </View>
                      <View style={styles.variantList}>
                        {selectedProduct.variants.map((v) => {
                          const isSelected = selectedVariant?.id === v.id;
                          return (
                            <Pressable
                              key={v.id}
                              style={[
                                styles.variantCard,
                                isSelected && styles.variantCardSelected,
                              ]}
                              onPress={() => {
                                try {
                                  if (Platform.OS !== 'web') {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                  }
                                } catch (_) {}
                                setSelectedVariant(v);
                              }}
                            >
                              <View style={styles.variantCardLeft}>
                                <View
                                  style={[
                                    styles.variantRadioCircle,
                                    isSelected && styles.variantRadioCircleSelected,
                                  ]}
                                >
                                  {isSelected && <View style={styles.variantRadioInner} />}
                                </View>
                                <View style={{ flex: 1 }}>
                                  <View style={styles.variantNameRow}>
                                    <Text
                                      style={[
                                        styles.variantName,
                                        isSelected && styles.variantNameSelected,
                                      ]}
                                    >
                                      {v.name}
                                    </Text>
                                    {v.badge && (
                                      <View
                                        style={[
                                          styles.variantBadgePill,
                                          v.isDefault ? styles.variantBadgePillBest : null,
                                        ]}
                                      >
                                        <Text
                                          style={[
                                            styles.variantBadgeText,
                                            v.isDefault ? styles.variantBadgeTextBest : null,
                                          ]}
                                        >
                                          {v.badge}
                                        </Text>
                                      </View>
                                    )}
                                  </View>
                                  {v.tension && (
                                    <Text style={styles.variantTension}>{v.tension}</Text>
                                  )}
                                </View>
                              </View>
                              <View style={styles.variantCardRight}>
                                <Text
                                  style={[
                                    styles.variantPrice,
                                    isSelected && styles.variantPriceSelected,
                                  ]}
                                >
                                  ${v.price.toFixed(2)}
                                </Text>
                                {v.originalPrice && (
                                  <Text style={styles.variantOrigPrice}>
                                    ${v.originalPrice.toFixed(2)}
                                  </Text>
                                )}
                              </View>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  )}

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
                    <Text style={styles.detailSectionTitle}>
                      {selectedProduct.benefitsTitle || 'Traditional Benefits & Restorative Uses'}
                    </Text>
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
                    <Text style={styles.detailSectionTitle}>
                      {selectedProduct.ritualTitle || 'The Restorative Ritual (How to Use)'}
                    </Text>
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

                {/* ── INGREDIENTS / MATERIAL PURITY ── */}
                <View style={styles.detailSectionBlock}>
                  <View style={styles.sectionHeadingRow}>
                    <Leaf size={18} color={colors.sageDark} />
                    <Text style={styles.detailSectionTitle}>
                      {selectedProduct.ingredientsTitle || 'Pure Botanical Ingredients'}
                    </Text>
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

              {/* ── STICKY BOTTOM CHECKOUT ACTION BAR ── */}
              <View style={styles.bottomActionBar}>
                <View style={styles.bottomPriceCol}>
                  <Text style={styles.bottomPriceLabel}>
                    {selectedVariant ? selectedVariant.name.toUpperCase() : 'SPECIAL PRICE'}
                  </Text>
                  {(selectedVariant ? selectedVariant.originalPrice : selectedProduct.originalPrice) && (
                    <Text style={styles.bottomOriginalPrice}>
                      ${((selectedVariant ? selectedVariant.originalPrice : selectedProduct.originalPrice) || 0).toFixed(2)}
                    </Text>
                  )}
                  <Text style={styles.bottomPriceValue}>
                    ${(selectedVariant ? selectedVariant.price : selectedProduct.price).toFixed(2)}
                  </Text>
                </View>

                <Pressable
                  style={styles.bottomInquireBtn}
                  onPress={() => {
                    if (selectedVariant) {
                      setCheckoutProduct({
                        ...selectedProduct,
                        id: selectedVariant.id,
                        name: `${selectedProduct.name} - ${selectedVariant.name}`,
                        subtitle: selectedVariant.tension || selectedProduct.subtitle,
                        price: selectedVariant.price,
                        originalPrice: selectedVariant.originalPrice,
                      });
                    } else {
                      setCheckoutProduct(selectedProduct);
                    }
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Purchase product with Card or PayPal"
                >
                  <LinearGradient
                    colors={[colors.primary, colors.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.bottomInquireGrad}
                  >
                    <CreditCard size={18} color="#FFFFFF" strokeWidth={2.2} />
                    <Text style={styles.bottomInquireText}>Buy with Card / PayPal</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </SafeAreaView>
          </Modal>
        )}

        {/* ── PROGRAM DETAIL MODAL ── */}
        <ProgramDetailModal
          visible={!!selectedProgram}
          program={selectedProgram}
          onClose={() => setSelectedProgram(null)}
          onBuyProgram={(prog) => {
            setSelectedProgram(null);
            setCheckoutProduct({
              id: prog.id,
              name: prog.name,
              subtitle: prog.subtitle,
              price: prog.price,
              originalPrice: prog.originalPrice,
              tag: prog.tag,
              tagColor: prog.tagColor,
              description: prog.description,
              storyTitle: '',
              storySubtitle: '',
              storyParagraphs: [],
              benefits: [],
              ritualSteps: [],
              ingredients: [],
              images: POSTURE_MAT_IMAGES,
              inStock: true,
            });
          }}
        />

        {/* ── PAYPAL & CARD GUEST CHECKOUT MODAL ── */}
        {checkoutProduct && (
          <PayPalCheckoutModal
            visible={!!checkoutProduct}
            onClose={() => setCheckoutProduct(null)}
            product={{
              id: checkoutProduct.id,
              name: checkoutProduct.name,
              subtitle: checkoutProduct.subtitle,
              price: checkoutProduct.price,
              originalPrice: checkoutProduct.originalPrice,
              image: checkoutProduct.images[0],
              aliExpressProductId: checkoutProduct.aliExpressProductId,
            }}
          />
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
  variantSection: {
    marginTop: 18,
    marginBottom: 8,
  },
  variantSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  variantSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  variantSelectedLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  variantList: {
    gap: 8,
  },
  variantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E8E4DF',
  },
  variantCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#FDF9F5',
  },
  variantCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  variantRadioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#C7C2BA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  variantRadioCircleSelected: {
    borderColor: colors.primary,
  },
  variantRadioInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: colors.primary,
  },
  variantNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  variantName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  variantNameSelected: {
    fontWeight: '700',
    color: colors.primaryDark,
  },
  variantTension: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  variantBadgePill: {
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  variantBadgePillBest: {
    backgroundColor: '#FEF3C7',
  },
  variantBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#374151',
    letterSpacing: 0.3,
  },
  variantBadgeTextBest: {
    color: '#92400E',
  },
  variantCardRight: {
    alignItems: 'flex-end',
  },
  variantPrice: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: fontFamilies.monoBold,
    color: colors.textPrimary,
  },
  variantPriceSelected: {
    color: colors.primaryDark,
  },
  variantOrigPrice: {
    fontSize: 11,
    fontFamily: fontFamilies.monoMedium,
    color: colors.textTertiary,
    textDecorationLine: 'line-through',
    marginTop: 1,
  },

  // ── PROGRAMS SECTION ──
  programsSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  programsSectionHeader: {
    marginBottom: 16,
  },
  programsSectionOverline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  programsSectionOverlineText: {
    fontSize: 10,
    fontFamily: fontFamilies.sansBold,
    color: colors.primary,
    letterSpacing: 1.5,
  },
  programsSectionTitle: {
    fontSize: 24,
    fontFamily: fontFamilies.soria,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  programsSectionSubtitle: {
    fontSize: 13,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  programCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  programCardGrad: {
    padding: 18,
  },
  programCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  programTagWrap: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  programTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: fontFamilies.sansBold,
    letterSpacing: 0.8,
  },
  programBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  programBadgeText: {
    color: colors.textPrimary,
    fontSize: 9.5,
    fontFamily: fontFamilies.sansBold,
  },
  programCardTitle: {
    fontSize: 20,
    fontFamily: fontFamilies.soria,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  programCardSubtitle: {
    fontSize: 12.5,
    fontFamily: fontFamilies.sansRegular,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 17,
    marginBottom: 14,
  },
  programMetaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  programMetaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.18)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  programMetaChipText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: fontFamilies.sansMedium,
  },
  programCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  programPriceWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  programPriceCurrent: {
    fontSize: 20,
    fontFamily: fontFamilies.sansBold,
    color: '#FFFFFF',
  },
  programPriceOld: {
    fontSize: 13,
    fontFamily: fontFamilies.sansRegular,
    color: 'rgba(255,255,255,0.65)',
    textDecorationLine: 'line-through',
  },
  programActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  programActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: fontFamilies.sansBold,
  },

  // Bundle
  bundleCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  bundleCardGrad: {
    padding: 20,
  },
  bundleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  bundleTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(212,165,116,0.18)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(212,165,116,0.35)',
  },
  bundleTagText: {
    fontSize: 9.5,
    fontFamily: fontFamilies.sansBold,
    color: '#D4A574',
    letterSpacing: 1,
  },
  bundleSavePill: {
    backgroundColor: '#D07887',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  bundleSaveText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontFamily: fontFamilies.sansBold,
  },
  bundleTitle: {
    fontSize: 20,
    fontFamily: fontFamilies.soria,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  bundleDesc: {
    fontSize: 12.5,
    fontFamily: fontFamilies.sansRegular,
    color: 'rgba(255,255,255,0.78)',
    lineHeight: 18,
    marginBottom: 16,
  },
  bundleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  bundlePriceCol: {},
  bundlePriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  bundlePriceCurrent: {
    fontSize: 22,
    fontFamily: fontFamilies.sansBold,
    color: '#FFFFFF',
  },
  bundlePriceOld: {
    fontSize: 14,
    fontFamily: fontFamilies.sansRegular,
    color: 'rgba(255,255,255,0.5)',
    textDecorationLine: 'line-through',
  },
  bundlePriceMeta: {
    fontSize: 10.5,
    fontFamily: fontFamilies.sansRegular,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  bundleBuyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryDark,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  bundleBuyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: fontFamilies.sansBold,
  },
});