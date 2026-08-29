import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  ScrollView,
  Dimensions,
  Modal,
  Image,
  useWindowDimensions,
} from 'react-native';
import {
  Download,
  Smartphone,
  Sparkles,
  Share,
  PlusSquare,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Flame,
  Leaf,
  Activity,
  X,
  Flower,
  Flower2,
  Sprout,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { fontFamilies } from '../theme/typography';
import Svg, {
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  Path,
  Circle,
  G,
} from 'react-native-svg';

interface PwaWelcomeGateProps {
  onEnterApp: () => void;
}

// Capture the install prompt globally immediately in case it fires before React mounts
let globalDeferredPrompt: any = null;
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: any) => {
    e.preventDefault();
    globalDeferredPrompt = e;
  });
}

export function PwaWelcomeGate({ onEnterApp }: PwaWelcomeGateProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(globalDeferredPrompt);
  const [isIOS, setIsIOS] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const ua = navigator.userAgent.toLowerCase();
    const isIosDevice =
      /ipad|iphone|ipod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(isIosDevice);

    // Register service worker if supported
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      });
    }

    // Capture install prompt if it fires after mount
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      globalDeferredPrompt = e;
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      globalDeferredPrompt = null;
      setDeferredPrompt(null);
      onEnterApp();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [onEnterApp]);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIosGuide(true);
      return;
    }

    if (deferredPrompt) {
      try {
        setIsInstalling(true);
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          onEnterApp();
        }
      } catch (err) {
        console.warn('Install prompt error:', err);
      } finally {
        setIsInstalling(false);
      }
    } else {
      // If browser doesn't support deferred prompt directly or already triggered
      setShowIosGuide(true);
    }
  };

  const handleBypass = () => {
    if (Platform.OS === 'web' && typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('fortywell_web_bypass', 'true');
    }
    onEnterApp();
  };

  const { width, height } = useWindowDimensions();
  const isWideScreen = width >= 860;
  const leftGutterWidth = Math.max(0, (width - 460) / 2);
  // Slimmer photo strip along the left edge
  const imageStripWidth = Math.min(Math.max(Math.round(leftGutterWidth * 0.50), 260), 360);
  const LETTER_SPACING = 6;
  // FortyWell text increased by an additional 15%
  const dynamicFontSize = Math.round(imageStripWidth * 0.718);

  return (
    <View style={styles.outerContainer}>
      {/* Full Top Green Background Section with Rich Blooming Botanical Rose Illustrations */}
      <View
        style={[
          styles.topGreenSection,
          { left: isWideScreen ? imageStripWidth : 0 },
        ]}
        pointerEvents="none"
        aria-hidden={true}
      >
        {/* Soft decorative concentric thin rose rings for depth */}
        <View style={styles.roseDecoRingLarge} />
        <View style={styles.roseDecoRingSmall} />

        {/* Left-Side Flourishing Rose Vine & Blossom SVG */}
        <View style={styles.roseSvgContainerLeft}>
          <Svg width={280} height={200} viewBox="0 0 280 200">
            <Defs>
              <SvgGradient id="roseGradBloom1" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#FBD6DF" stopOpacity="0.95" />
                <Stop offset="50%" stopColor="#E28698" stopOpacity="0.90" />
                <Stop offset="100%" stopColor="#A84357" stopOpacity="0.95" />
              </SvgGradient>
              <SvgGradient id="roseGradPetalFold1" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#FFF0F3" stopOpacity="0.95" />
                <Stop offset="100%" stopColor="#D96E82" stopOpacity="0.90" />
              </SvgGradient>
              <SvgGradient id="roseGradInnerCore1" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#C44E64" stopOpacity="0.95" />
                <Stop offset="100%" stopColor="#7E2436" stopOpacity="0.95" />
              </SvgGradient>
              <SvgGradient id="botanicalVineGrad1" x1="0%" y1="100%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor="#8EA973" stopOpacity="0.85" />
                <Stop offset="100%" stopColor="#B3CD9B" stopOpacity="0.90" />
              </SvgGradient>
              <SvgGradient id="roseLeafGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#9EBA82" stopOpacity="0.90" />
                <Stop offset="100%" stopColor="#556E3B" stopOpacity="0.90" />
              </SvgGradient>
            </Defs>

            {/* Graceful Arching Vine Stems */}
            <Path
              d="M-20,180 Q60,150 110,110 T220,50 Q250,30 270,10"
              stroke="url(#botanicalVineGrad1)"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
            <Path
              d="M70,135 Q95,95 85,60"
              stroke="url(#botanicalVineGrad1)"
              strokeWidth="1.8"
              fill="none"
              strokeLinecap="round"
            />
            <Path
              d="M170,75 Q210,105 240,115"
              stroke="url(#botanicalVineGrad1)"
              strokeWidth="1.8"
              fill="none"
              strokeLinecap="round"
            />

            {/* Botanical Leaves along the vine */}
            <G transform="translate(45, 135) rotate(-35)">
              <Path d="M0,0 C12,-18 28,-14 32,0 C28,14 12,18 0,0 Z" fill="url(#roseLeafGrad1)" />
              <Path d="M0,0 L26,0" stroke="#BFE0A3" strokeWidth="1" opacity="0.7" />
            </G>
            <G transform="translate(150, 85) rotate(40)">
              <Path d="M0,0 C14,-20 32,-16 36,0 C32,16 14,20 0,0 Z" fill="url(#roseLeafGrad1)" />
              <Path d="M0,0 L30,0" stroke="#BFE0A3" strokeWidth="1" opacity="0.7" />
            </G>
            <G transform="translate(225, 60) rotate(-25)">
              <Path d="M0,0 C10,-14 22,-12 26,0 C22,12 10,14 0,0 Z" fill="url(#roseLeafGrad1)" />
            </G>

            {/* Main Blooming Rose Blossom (Centered on vine at 110, 105) */}
            <G transform="translate(110, 105)">
              {/* Outer Layer Petals */}
              <Path
                d="M-38,-15 C-48,-42 -15,-55 0,-40 C15,-55 48,-42 38,-15 C55,5 42,42 15,46 C-5,50 -28,45 -38,20 C-46,5 -44,-5 -38,-15 Z"
                fill="url(#roseGradBloom1)"
              />
              {/* Overlapping Mid-Petals */}
              <Path
                d="M-26,-22 C-32,-38 -8,-44 4,-30 C16,-44 40,-32 30,-12 C42,4 28,34 6,36 C-14,38 -32,24 -28,2 C-34,-8 -32,-16 -26,-22 Z"
                fill="url(#roseGradPetalFold1)"
                opacity="0.95"
              />
              {/* Inner Petal Layers */}
              <Path
                d="M-18,-14 C-22,-26 -4,-30 4,-20 C12,-30 28,-22 22,-8 C30,4 20,24 4,25 C-10,26 -22,16 -18,2 Z"
                fill="url(#roseGradBloom1)"
              />
              {/* Core Spiral Rose Cup */}
              <Path
                d="M-10,-8 C-14,-18 0,-20 6,-12 C12,-20 22,-14 16,-4 C22,4 14,16 2,16 C-8,16 -16,8 -10,-8 Z"
                fill="url(#roseGradInnerCore1)"
              />
              <Path
                d="M-4,-4 Q2,-10 7,-4 Q12,2 4,8 Q-4,8 -4,-4 Z"
                fill="#FAD1DC"
                opacity="0.9"
              />
              {/* Golden Pistils/Stamens */}
              <Circle cx="-2" cy="-6" r="1.8" fill="#FDE68A" />
              <Circle cx="5" cy="-4" r="1.8" fill="#FDE68A" />
              <Circle cx="2" cy="3" r="1.8" fill="#FDE68A" />
            </G>

            {/* Smaller Bud Blossom at (255, 25) */}
            <G transform="translate(255, 25) rotate(25)">
              <Path d="M-6,8 C-10,2 -8,-10 0,-16 C8,-10 10,2 6,8 Z" fill="url(#roseGradBloom1)" />
              <Path d="M-4,4 C-6,0 -4,-8 0,-12 C4,-8 6,0 4,4 Z" fill="url(#roseGradInnerCore1)" />
              <Path d="M-8,12 Q-4,4 0,10 Q4,4 8,12 Z" fill="#6B854E" />
            </G>
          </Svg>
        </View>

        {/* Right-Side Cascading Rose Bouquet & Botanical Vines SVG */}
        <View style={styles.roseSvgContainerRight}>
          <Svg width={280} height={200} viewBox="0 0 280 200">
            <Defs>
              <SvgGradient id="roseGradBloom2" x1="100%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#FCE0E7" stopOpacity="0.95" />
                <Stop offset="45%" stopColor="#E58B9C" stopOpacity="0.92" />
                <Stop offset="100%" stopColor="#9C3A4D" stopOpacity="0.95" />
              </SvgGradient>
              <SvgGradient id="roseGradPetalFold2" x1="100%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#FFF5F7" stopOpacity="0.98" />
                <Stop offset="100%" stopColor="#D96E82" stopOpacity="0.92" />
              </SvgGradient>
            </Defs>

            {/* Sweeping Botanical Vines */}
            <Path
              d="M300,170 Q210,140 160,95 T40,40 Q10,25 -10,10"
              stroke="url(#botanicalVineGrad1)"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
            <Path
              d="M200,120 Q160,70 120,60"
              stroke="url(#botanicalVineGrad1)"
              strokeWidth="1.8"
              fill="none"
              strokeLinecap="round"
            />

            {/* Leaves */}
            <G transform="translate(230, 130) rotate(45)">
              <Path d="M0,0 C14,-20 32,-16 36,0 C32,16 14,20 0,0 Z" fill="url(#roseLeafGrad1)" />
              <Path d="M0,0 L30,0" stroke="#BFE0A3" strokeWidth="1" opacity="0.7" />
            </G>
            <G transform="translate(120, 65) rotate(-35)">
              <Path d="M0,0 C12,-18 28,-14 32,0 C28,14 12,18 0,0 Z" fill="url(#roseLeafGrad1)" />
              <Path d="M0,0 L26,0" stroke="#BFE0A3" strokeWidth="1" opacity="0.7" />
            </G>
            <G transform="translate(55, 45) rotate(30)">
              <Path d="M0,0 C10,-14 22,-12 26,0 C22,12 10,14 0,0 Z" fill="url(#roseLeafGrad1)" />
            </G>

            {/* Full Blooming Rose on Right (at 175, 90) */}
            <G transform="translate(175, 90)">
              <Path
                d="M-36,-14 C-46,-38 -14,-50 0,-36 C14,-50 46,-38 36,-14 C50,4 38,38 14,42 C-4,46 -26,40 -36,18 C-44,4 -42,-4 -36,-14 Z"
                fill="url(#roseGradBloom2)"
              />
              <Path
                d="M-24,-18 C-30,-34 -6,-38 4,-26 C14,-38 36,-28 26,-10 C36,4 24,30 4,32 C-12,34 -28,20 -24,2 Z"
                fill="url(#roseGradPetalFold2)"
                opacity="0.95"
              />
              <Path
                d="M-16,-12 C-20,-22 -4,-26 4,-16 C12,-26 24,-18 18,-6 C26,4 16,20 4,22 C-8,24 -18,14 -16,2 Z"
                fill="url(#roseGradBloom2)"
              />
              <Path
                d="M-8,-6 C-12,-14 0,-16 4,-10 C8,-16 18,-12 12,-4 C18,4 12,14 2,14 C-6,14 -12,8 -8,-6 Z"
                fill="#7E2436"
              />
              <Path
                d="M-3,-3 Q2,-8 6,-3 Q10,2 3,6 Q-3,6 -3,-3 Z"
                fill="#FAD1DC"
              />
              <Circle cx="-1" cy="-5" r="1.8" fill="#FDE68A" />
              <Circle cx="4" cy="-3" r="1.8" fill="#FDE68A" />
              <Circle cx="1" cy="2" r="1.8" fill="#FDE68A" />
            </G>

            {/* Second Rose Bloom in three-quarter view (at 85, 45) */}
            <G transform="translate(85, 45) rotate(-15)">
              <Path
                d="M-22,-10 C-28,-26 -8,-32 0,-24 C8,-32 28,-26 22,-10 C30,2 22,24 8,26 C-4,28 -18,22 -22,10 Z"
                fill="url(#roseGradBloom2)"
              />
              <Path
                d="M-14,-8 C-18,-18 -4,-20 2,-14 C8,-20 20,-16 14,-6 C20,2 14,16 4,18 C-6,20 -14,12 -14,2 Z"
                fill="url(#roseGradPetalFold2)"
              />
              <Path d="M-6,-4 C-8,-10 0,-12 3,-8 C6,-12 14,-10 9,-2 C12,4 8,10 2,10 C-4,10 -8,4 -6,-4 Z" fill="#7E2436" />
            </G>
          </Svg>
        </View>

        {/* Bottom-Left Blooming Rose & Foliage SVG */}
        <View style={styles.roseSvgContainerBottomLeft}>
          <Svg width={180} height={140} viewBox="0 0 180 140">
            <Path
              d="M-10,130 Q40,110 70,80 T150,30"
              stroke="url(#botanicalVineGrad1)"
              strokeWidth="2.2"
              fill="none"
              strokeLinecap="round"
            />
            <G transform="translate(30, 95) rotate(30)">
              <Path d="M0,0 C10,-16 24,-12 28,0 C24,12 10,16 0,0 Z" fill="url(#roseLeafGrad1)" />
            </G>
            <G transform="translate(110, 55) rotate(-40)">
              <Path d="M0,0 C10,-14 20,-10 24,0 C20,10 10,14 0,0 Z" fill="url(#roseLeafGrad1)" />
            </G>
            <G transform="translate(70, 75) rotate(15)">
              <Path
                d="M-28,-10 C-36,-30 -10,-40 0,-28 C10,-40 36,-30 28,-10 C38,4 30,30 10,34 C-4,36 -20,32 -28,14 Z"
                fill="url(#roseGradBloom1)"
              />
              <Path
                d="M-18,-14 C-24,-26 -4,-30 4,-20 C12,-30 28,-22 22,-8 C28,4 20,24 4,25 C-10,26 -22,16 -18,2 Z"
                fill="url(#roseGradPetalFold1)"
                opacity="0.95"
              />
              <Path
                d="M-10,-8 C-14,-18 0,-20 6,-12 C12,-20 22,-14 16,-4 C22,4 14,16 2,16 C-8,16 -16,8 -10,-8 Z"
                fill="url(#roseGradInnerCore1)"
              />
              <Path d="M-3,-3 Q2,-8 6,-3 Q10,2 3,6 Q-3,6 -3,-3 Z" fill="#FAD1DC" />
              <Circle cx="-1" cy="-4" r="1.5" fill="#FDE68A" />
              <Circle cx="3" cy="-2" r="1.5" fill="#FDE68A" />
            </G>
          </Svg>
        </View>

        {/* Bottom-Right Blooming Rose & Foliage SVG */}
        <View style={styles.roseSvgContainerBottomRight}>
          <Svg width={180} height={140} viewBox="0 0 180 140">
            <Path
              d="M190,130 Q140,110 110,80 T30,30"
              stroke="url(#botanicalVineGrad1)"
              strokeWidth="2.2"
              fill="none"
              strokeLinecap="round"
            />
            <G transform="translate(150, 95) rotate(-30)">
              <Path d="M0,0 C10,-16 24,-12 28,0 C24,12 10,16 0,0 Z" fill="url(#roseLeafGrad1)" />
            </G>
            <G transform="translate(70, 55) rotate(40)">
              <Path d="M0,0 C10,-14 20,-10 24,0 C20,10 10,14 0,0 Z" fill="url(#roseLeafGrad1)" />
            </G>
            <G transform="translate(110, 75) rotate(-15)">
              <Path
                d="M-28,-10 C-36,-30 -10,-40 0,-28 C10,-40 36,-30 28,-10 C38,4 30,30 10,34 C-4,36 -20,32 -28,14 Z"
                fill="url(#roseGradBloom2)"
              />
              <Path
                d="M-18,-14 C-24,-26 -4,-30 4,-20 C12,-30 28,-22 22,-8 C28,4 20,24 4,25 C-10,26 -22,16 -18,2 Z"
                fill="url(#roseGradPetalFold2)"
                opacity="0.95"
              />
              <Path
                d="M-10,-8 C-14,-18 0,-20 6,-12 C12,-20 22,-14 16,-4 C22,4 14,16 2,16 C-8,16 -16,8 -10,-8 Z"
                fill="#7E2436"
              />
              <Path d="M-3,-3 Q2,-8 6,-3 Q10,2 3,6 Q-3,6 -3,-3 Z" fill="#FAD1DC" />
              <Circle cx="-1" cy="-4" r="1.5" fill="#FDE68A" />
              <Circle cx="3" cy="-2" r="1.5" fill="#FDE68A" />
            </G>
          </Svg>
        </View>

        {/* Delicate Drifting Rose Petals in Center */}
        <View style={styles.floatingPetal1}>
          <Svg width={32} height={32} viewBox="0 0 32 32">
            <Path d="M4,16 C4,6 16,4 24,12 C28,18 22,28 12,26 C6,24 4,20 4,16 Z" fill="#F7CAD5" opacity="0.85" />
          </Svg>
        </View>
        <View style={styles.floatingPetal2}>
          <Svg width={24} height={24} viewBox="0 0 24 24">
            <Path d="M3,12 C3,5 12,3 18,9 C21,14 16,21 9,20 C4,18 3,15 3,12 Z" fill="#E88A9D" opacity="0.75" />
          </Svg>
        </View>
      </View>

      {/* Left-side sleek vertical photo column with FortyWell brand spine */}
      {isWideScreen && (
        <View
          style={[styles.leftBgContainer, { width: imageStripWidth }]}
          pointerEvents="none"
          aria-hidden={true}
        >
          {/* Top image block (oč.png) */}
          <View style={styles.bgImageBlock}>
            <Image
              source={require('../assets/editorial_oc.png')}
              style={styles.bgImage}
              resizeMode="cover"
            />
            <View style={styles.bgImageOverlay} />
          </View>

          {/* Bottom image block (pivvcvcvc.png) */}
          <View style={styles.bgImageBlock}>
            <Image
              source={require('../assets/editorial_piv.png')}
              style={styles.bgImage}
              resizeMode="cover"
            />
            <View style={styles.bgImageOverlay} />
          </View>

          {/* Vertical FortyWell typography sitting centered over the photo strip */}
          <View style={[styles.verticalSpineContainer, { left: 0, width: imageStripWidth }]}>
            <View style={[styles.verticalSpineInner, { width: width * 2 }]}>
              <Text
                style={[styles.verticalSpineText, { fontSize: dynamicFontSize, letterSpacing: LETTER_SPACING }]}
                numberOfLines={1}
              >
                FortyWell
              </Text>
            </View>
          </View>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>
          {/* Green Color Block Header above the download card */}
          <View style={styles.greenBrandBlock}>
            <View style={styles.greenLeafBadge}>
              <Leaf size={15} color="#FFFFFF" />
            </View>
            <Text style={styles.greenBrandText}>FORTYWELL</Text>
          </View>

          {/* Main Hero Card */}
          <View style={styles.heroCard}>
            <View style={styles.tagBadge}>
              <Sparkles size={12} color={colors.primary} />
              <Text style={styles.tagText}>OFFICIAL COMPANION APP</Text>
            </View>

            <Text style={styles.heroTitle}>
              Hormonal Vitality & Circadian Flow
            </Text>

            <Text style={styles.heroDescription}>
              Install FortyWell to your device for an uninterrupted, full-screen sanctuary. 
              Sync your workouts, daily rituals, and cortisol recovery in real time.
            </Text>

            {/* Feature Highlights */}
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <View style={[styles.featureIconBox, { backgroundColor: colors.primarySoft }]}>
                  <Flame size={16} color={colors.primary} />
                </View>
                <View style={styles.featureTextCol}>
                  <Text style={styles.featureItemTitle}>Cycle-Synced Movement</Text>
                  <Text style={styles.featureItemSub}>Cortisol-conscious strength and mobility</Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <View style={[styles.featureIconBox, { backgroundColor: colors.sageSoft }]}>
                  <Activity size={16} color={colors.sageDark} />
                </View>
                <View style={styles.featureTextCol}>
                  <Text style={styles.featureItemTitle}>Daily Rhythm & Energy Engine</Text>
                  <Text style={styles.featureItemSub}>Smart daily guidance tailored to your biological phase</Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <View style={[styles.featureIconBox, { backgroundColor: colors.peachSoft }]}>
                  <ShieldCheck size={16} color={colors.peach} />
                </View>
                <View style={styles.featureTextCol}>
                  <Text style={styles.featureItemTitle}>Private & Offline-Ready</Text>
                  <Text style={styles.featureItemSub}>Zero app store clutter. Launches instantly from home screen</Text>
                </View>
              </View>
            </View>

            {/* Install Primary Action Button */}
            <TouchableOpacity
              style={styles.installButton}
              onPress={handleInstallClick}
              activeOpacity={0.88}
            >
              <View style={styles.installButtonContent}>
                <Smartphone size={20} color="#FFFFFF" />
                <Text style={styles.installButtonText}>
                  {isInstalling ? 'Opening Installer...' : 'Install FortyWell App'}
                </Text>
                <Download size={18} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            {/* Browser Preview / Direct Access */}
            <TouchableOpacity
              style={styles.bypassButton}
              onPress={handleBypass}
              activeOpacity={0.75}
            >
              <Text style={styles.bypassText}>
                Open Web Version in Browser
              </Text>
              <ArrowRight size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Footer note */}
          <Text style={styles.footerNote}>
            Progressive Web App • Instant Setup • Works on iOS & Android
          </Text>
        </View>
      </ScrollView>

      {/* iOS / Manual Installation Modal Guide */}
      <Modal
        visible={showIosGuide}
        transparent
        animationType="fade"
        onRequestClose={() => setShowIosGuide(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Smartphone size={20} color={colors.primary} />
                <Text style={styles.modalTitle}>How to Install</Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setShowIosGuide(false)}
              >
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Follow these simple steps in Safari or Chrome to add FortyWell to your home screen:
            </Text>

            <View style={styles.stepsContainer}>
              <View style={styles.stepRow}>
                <View style={styles.stepNumCircle}>
                  <Text style={styles.stepNumText}>1</Text>
                </View>
                <View style={styles.stepDetails}>
                  <Text style={styles.stepHeading}>
                    Tap the <Text style={{ fontWeight: '700' }}>Share</Text> button (iOS) or <Text style={{ fontWeight: '700' }}>Menu ⋮</Text> (Android)
                  </Text>
                  <Text style={styles.stepSub}>
                    Found in Safari's bottom toolbar or Chrome's address bar.
                  </Text>
                </View>
                <View style={styles.stepIconBox}>
                  <Share size={20} color={colors.primary} />
                </View>
              </View>

              <View style={styles.stepRow}>
                <View style={styles.stepNumCircle}>
                  <Text style={styles.stepNumText}>2</Text>
                </View>
                <View style={styles.stepDetails}>
                  <Text style={styles.stepHeading}>
                    Select <Text style={{ fontWeight: '700' }}>Add to Home Screen</Text>
                  </Text>
                  <Text style={styles.stepSub}>
                    You might need to scroll down to find this option. Or on Android, look for "Install App".
                  </Text>
                </View>
                <View style={styles.stepIconBox}>
                  <PlusSquare size={20} color={colors.primary} />
                </View>
              </View>

              <View style={styles.stepRow}>
                <View style={styles.stepNumCircle}>
                  <Text style={styles.stepNumText}>3</Text>
                </View>
                <View style={styles.stepDetails}>
                  <Text style={styles.stepHeading}>
                    Launch FortyWell
                  </Text>
                  <Text style={styles.stepSub}>
                    Open the app icon on your home screen for full standalone experience.
                  </Text>
                </View>
                <View style={styles.stepIconBox}>
                  <CheckCircle2 size={18} color={colors.primary} />
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              onPress={() => {
                setShowIosGuide(false);
                handleBypass();
              }}
            >
              <Text style={styles.modalPrimaryBtnText}>Got it / Open Web App</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  topGreenSection: {
    position: 'absolute',
    top: 0,
    right: 0,
    height: 230,
    backgroundColor: colors.sageDark,
    zIndex: 0,
    overflow: 'hidden',
  },
  roseDecoRingLarge: {
    position: 'absolute',
    right: -40,
    top: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
    borderColor: 'rgba(208, 120, 135, 0.22)',
  },
  roseDecoRingSmall: {
    position: 'absolute',
    left: 40,
    top: -60,
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
    borderColor: 'rgba(208, 120, 135, 0.18)',
  },
  roseSvgContainerLeft: {
    position: 'absolute',
    left: 10,
    top: 5,
    zIndex: 1,
    opacity: 0.95,
  },
  roseSvgContainerRight: {
    position: 'absolute',
    right: 10,
    top: 5,
    zIndex: 1,
    opacity: 0.95,
  },
  roseSvgContainerBottomLeft: {
    position: 'absolute',
    left: 15,
    bottom: -15,
    zIndex: 1,
    opacity: 0.92,
  },
  roseSvgContainerBottomRight: {
    position: 'absolute',
    right: 15,
    bottom: -15,
    zIndex: 1,
    opacity: 0.92,
  },
  floatingPetal1: {
    position: 'absolute',
    left: '26%',
    top: 50,
    transform: [{ rotate: '25deg' }],
    zIndex: 1,
  },
  floatingPetal2: {
    position: 'absolute',
    right: '24%',
    top: 38,
    transform: [{ rotate: '-35deg' }],
    zIndex: 1,
  },
  leftBgContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 0,
    overflow: 'hidden',
    flexDirection: 'column',
  },
  bgImageBlock: {
    flex: 1,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  bgImage: {
    width: '100%',
    height: '100%',
  },
  bgImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(237, 227, 213, 0.22)',
  },
  verticalSpineContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    pointerEvents: 'none',
    overflow: 'visible',
  },
  verticalSpineInner: {
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-90deg' }],
  },
  verticalSpineText: {
    fontFamily: fontFamilies.soria,
    fontSize: 104,
    fontWeight: '400',
    color: colors.rose,
    letterSpacing: 10,
    textAlign: 'center',
    opacity: 0.95,
    ...Platform.select({
      web: {
        whiteSpace: 'nowrap' as any,
        userSelect: 'none' as any,
        fontWeight: '300' as any,
        textShadow: '0 2px 16px rgba(42, 35, 32, 0.25)',
      },
      default: {},
    }),
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    minHeight: '100%',
    zIndex: 1,
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 460,
    alignItems: 'center',
  },
  greenBrandBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 100,
    marginBottom: 20,
  },
  greenLeafBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  greenBrandText: {
    fontSize: 13,
    letterSpacing: 3.5,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'MartianMono-Bold',
  },
  heroCard: {
    width: '100%',
    backgroundColor: colors.surfaceCard,
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: colors.borderMedium,
    shadowColor: '#2A2320',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 100,
    gap: 6,
    marginBottom: 16,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: colors.primaryDark,
    fontFamily: 'MartianMono-SemiBold',
  },
  heroTitle: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: 'PlayfairDisplay-Bold',
    marginBottom: 10,
  },
  heroDescription: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
    fontFamily: 'WorkSans-Regular',
    marginBottom: 24,
  },
  featuresList: {
    gap: 16,
    marginBottom: 28,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  featureIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTextCol: {
    flex: 1,
  },
  featureItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    fontFamily: 'WorkSans-SemiBold',
    marginBottom: 2,
  },
  featureItemSub: {
    fontSize: 12,
    color: colors.textTertiary,
    fontFamily: 'WorkSans-Regular',
  },
  installButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 4,
  },
  installButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  installButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
    fontFamily: 'WorkSans-Bold',
  },
  bypassButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
    marginTop: 8,
  },
  bypassText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    fontFamily: 'WorkSans-Medium',
  },
  footerNote: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 20,
    textAlign: 'center',
    fontFamily: 'WorkSans-Regular',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(24, 20, 18, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surfaceCard,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: 'PlayfairDisplay-Bold',
  },
  closeBtn: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: 'WorkSans-Regular',
    marginBottom: 20,
    lineHeight: 18,
  },
  stepsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 14,
  },
  stepNumCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  stepDetails: {
    flex: 1,
  },
  stepHeading: {
    fontSize: 13,
    color: colors.textPrimary,
    fontFamily: 'WorkSans-Medium',
  },
  stepSub: {
    fontSize: 11,
    color: colors.textTertiary,
    fontFamily: 'WorkSans-Regular',
    marginTop: 2,
  },
  stepIconBox: {
    padding: 6,
  },
  modalPrimaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'WorkSans-Bold',
  },
});
