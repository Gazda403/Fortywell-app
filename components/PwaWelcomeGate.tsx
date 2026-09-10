import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Animated,
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
  ArrowUpFromLine,
  Plus,
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

// ─── iOS detection helpers ────────────────────────────────────────────────────
function detectIOSInfo(): { isIOS: boolean; isSafari: boolean; isChrome: boolean } {
  if (typeof navigator === 'undefined') return { isIOS: false, isSafari: false, isChrome: false };

  // Testing parameter overrides: allows testing iOS modes on any desktop browser or device
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const testIos = params.get('ios');
    if (testIos === 'chrome') {
      return { isIOS: true, isSafari: false, isChrome: true };
    }
    if (testIos === '1' || testIos === 'safari' || testIos === 'true' || params.get('preview') === 'ios') {
      return { isIOS: true, isSafari: true, isChrome: false };
    }
  }

  const ua = navigator.userAgent.toLowerCase();
  const isIOS =
    /ipad|iphone|ipod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isChrome = isIOS && /crios/i.test(ua);
  // Safari: iOS but NOT Chrome/Firefox/other Chromium wrappers
  const isSafari = isIOS && !isChrome && !/fxios|chromium|edgios|opios/i.test(ua);
  return { isIOS, isSafari, isChrome };
}

// Capture the install prompt globally immediately in case it fires before React mounts
let globalDeferredPrompt: any = null;
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: any) => {
    e.preventDefault();
    globalDeferredPrompt = e;
  });
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function PwaWelcomeGate({ onEnterApp }: PwaWelcomeGateProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(globalDeferredPrompt);
  const [isIOS, setIsIOS] = useState(false);
  const [isIOSSafari, setIsIOSSafari] = useState(false);
  const [isIOSChrome, setIsIOSChrome] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const slideAnim = useRef(new Animated.Value(300)).current;
  const stickyAnim = useRef(new Animated.Value(80)).current;
  const installBtnRef = useRef<View>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const { isIOS: ios, isSafari, isChrome } = detectIOSInfo();
    setIsIOS(ios);
    setIsIOSSafari(isSafari);
    setIsIOSChrome(isChrome);

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

    // Auto-show iOS guide after 1.5 seconds for iPhone users
    let autoTimer: ReturnType<typeof setTimeout> | undefined;
    if (ios) {
      autoTimer = setTimeout(() => {
        setShowIosGuide(true);
      }, 1500);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      if (autoTimer) clearTimeout(autoTimer);
    };
  }, [onEnterApp]);

  // Animate the bottom sheet in/out
  useEffect(() => {
    if (showIosGuide) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 500,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [showIosGuide]);

  // Animate sticky bar
  useEffect(() => {
    if (showStickyBar && !showIosGuide) {
      Animated.spring(stickyAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 70,
        friction: 10,
      }).start();
    } else {
      Animated.timing(stickyAnim, {
        toValue: 80,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [showStickyBar, showIosGuide]);

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
      setShowIosGuide(true);
    }
  };

  const handleBypass = useCallback(() => {
    if (Platform.OS === 'web' && typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('fortywell_web_bypass', 'true');
    }
    onEnterApp();
  }, [onEnterApp]);

  const handleScroll = (event: any) => {
    if (!isIOS) return;
    const scrollY = event.nativeEvent.contentOffset.y;
    // Show sticky bar after scrolling 200px past the install button
    setShowStickyBar(scrollY > 200);
  };

  const { width, height } = useWindowDimensions();
  const isWideScreen = width >= 860;
  const leftGutterWidth = Math.max(0, (width - 460) / 2);
  const imageStripWidth = Math.min(Math.max(Math.round(leftGutterWidth * 0.50), 260), 360);
  const LETTER_SPACING = 6;
  const dynamicFontSize = Math.round(imageStripWidth * 0.718);

  // iOS guide steps — different for Safari vs Chrome
  const iosSteps = isIOSChrome
    ? [
        {
          num: '1',
          heading: 'Open in Safari',
          sub: 'Chrome on iPhone doesn\'t support "Add to Home Screen". Copy the URL and paste it into Safari.',
          Icon: Smartphone,
          iconColor: colors.primary,
        },
        {
          num: '2',
          heading: 'Tap the Share button ⎋',
          sub: 'In Safari, tap the Share icon at the very bottom center of the screen — it looks like a box with an arrow pointing up.',
          Icon: ArrowUpFromLine,
          iconColor: colors.primary,
        },
        {
          num: '3',
          heading: 'Tap "Add to Home Screen"',
          sub: 'Scroll down in the Share menu until you see "Add to Home Screen" with a plus icon.',
          Icon: Plus,
          iconColor: colors.sage,
        },
        {
          num: '4',
          heading: 'Tap "Add" in the top right',
          sub: 'A confirmation dialog appears. Tap "Add" in the top right corner. FortyWell is now on your home screen!',
          Icon: CheckCircle2,
          iconColor: colors.sage,
        },
      ]
    : [
        {
          num: '1',
          heading: 'Tap the Share button ⎋',
          sub: 'Tap the Share icon at the very bottom center of Safari — the box with an arrow pointing up.',
          Icon: ArrowUpFromLine,
          iconColor: colors.primary,
        },
        {
          num: '2',
          heading: 'Scroll down → "Add to Home Screen"',
          sub: 'In the Share menu, scroll down and tap "Add to Home Screen" — it has a small plus icon.',
          Icon: Plus,
          iconColor: colors.primary,
        },
        {
          num: '3',
          heading: 'Tap "Add" in the top right',
          sub: 'A confirmation appears at the top. Tap "Add". That\'s it — FortyWell is now on your iPhone!',
          Icon: CheckCircle2,
          iconColor: colors.sage,
        },
      ];

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

            <Path d="M-20,180 Q60,150 110,110 T220,50 Q250,30 270,10" stroke="url(#botanicalVineGrad1)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <Path d="M70,135 Q95,95 85,60" stroke="url(#botanicalVineGrad1)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
            <Path d="M170,75 Q210,105 240,115" stroke="url(#botanicalVineGrad1)" strokeWidth="1.8" fill="none" strokeLinecap="round" />

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

            <G transform="translate(110, 105)">
              <Path d="M-38,-15 C-48,-42 -15,-55 0,-40 C15,-55 48,-42 38,-15 C55,5 42,42 15,46 C-5,50 -28,45 -38,20 C-46,5 -44,-5 -38,-15 Z" fill="url(#roseGradBloom1)" />
              <Path d="M-26,-22 C-32,-38 -8,-44 4,-30 C16,-44 40,-32 30,-12 C42,4 28,34 6,36 C-14,38 -32,24 -28,2 C-34,-8 -32,-16 -26,-22 Z" fill="url(#roseGradPetalFold1)" opacity="0.95" />
              <Path d="M-18,-14 C-22,-26 -4,-30 4,-20 C12,-30 28,-22 22,-8 C30,4 20,24 4,25 C-10,26 -22,16 -18,2 Z" fill="url(#roseGradBloom1)" />
              <Path d="M-10,-8 C-14,-18 0,-20 6,-12 C12,-20 22,-14 16,-4 C22,4 14,16 2,16 C-8,16 -16,8 -10,-8 Z" fill="url(#roseGradInnerCore1)" />
              <Path d="M-4,-4 Q2,-10 7,-4 Q12,2 4,8 Q-4,8 -4,-4 Z" fill="#FAD1DC" opacity="0.9" />
              <Circle cx="-2" cy="-6" r="1.8" fill="#FDE68A" />
              <Circle cx="5" cy="-4" r="1.8" fill="#FDE68A" />
              <Circle cx="2" cy="3" r="1.8" fill="#FDE68A" />
            </G>

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
            <Path d="M300,170 Q210,140 160,95 T40,40 Q10,25 -10,10" stroke="url(#botanicalVineGrad1)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <Path d="M200,120 Q160,70 120,60" stroke="url(#botanicalVineGrad1)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
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
            <G transform="translate(175, 90)">
              <Path d="M-36,-14 C-46,-38 -14,-50 0,-36 C14,-50 46,-38 36,-14 C50,4 38,38 14,42 C-4,46 -26,40 -36,18 C-44,4 -42,-4 -36,-14 Z" fill="url(#roseGradBloom2)" />
              <Path d="M-24,-18 C-30,-34 -6,-38 4,-26 C14,-38 36,-28 26,-10 C36,4 24,30 4,32 C-12,34 -28,20 -24,2 Z" fill="url(#roseGradPetalFold2)" opacity="0.95" />
              <Path d="M-16,-12 C-20,-22 -4,-26 4,-16 C12,-26 24,-18 18,-6 C26,4 16,20 4,22 C-8,24 -18,14 -16,2 Z" fill="url(#roseGradBloom2)" />
              <Path d="M-8,-6 C-12,-14 0,-16 4,-10 C8,-16 18,-12 12,-4 C18,4 12,14 2,14 C-6,14 -12,8 -8,-6 Z" fill="#7E2436" />
              <Path d="M-3,-3 Q2,-8 6,-3 Q10,2 3,6 Q-3,6 -3,-3 Z" fill="#FAD1DC" />
              <Circle cx="-1" cy="-5" r="1.8" fill="#FDE68A" />
              <Circle cx="4" cy="-3" r="1.8" fill="#FDE68A" />
              <Circle cx="1" cy="2" r="1.8" fill="#FDE68A" />
            </G>
            <G transform="translate(85, 45) rotate(-15)">
              <Path d="M-22,-10 C-28,-26 -8,-32 0,-24 C8,-32 28,-26 22,-10 C30,2 22,24 8,26 C-4,28 -18,22 -22,10 Z" fill="url(#roseGradBloom2)" />
              <Path d="M-14,-8 C-18,-18 -4,-20 2,-14 C8,-20 20,-16 14,-6 C20,2 14,16 4,18 C-6,20 -14,12 -14,2 Z" fill="url(#roseGradPetalFold2)" />
              <Path d="M-6,-4 C-8,-10 0,-12 3,-8 C6,-12 14,-10 9,-2 C12,4 8,10 2,10 C-4,10 -8,4 -6,-4 Z" fill="#7E2436" />
            </G>
          </Svg>
        </View>

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
          <View style={styles.bgImageBlock}>
            <Image
              source={require('../assets/editorial_oc.png')}
              style={styles.bgImage}
              resizeMode="cover"
            />
            <View style={styles.bgImageOverlay} />
          </View>
          <View style={styles.bgImageBlock}>
            <Image
              source={require('../assets/editorial_piv.png')}
              style={styles.bgImage}
              resizeMode="cover"
            />
            <View style={styles.bgImageOverlay} />
          </View>
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
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={50}
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

            {/* iOS-specific instruction teaser */}
            {isIOS && (
              <View style={styles.iosTeaserBanner}>
                <View style={styles.iosTeaserIcon}>
                  <Smartphone size={16} color={colors.primary} />
                </View>
                <Text style={styles.iosTeaserText}>
                  iPhone detected — tap below for a 10-second install guide
                </Text>
              </View>
            )}

            {/* Install Primary Action Button */}
            <View ref={installBtnRef}>
              <TouchableOpacity
                style={styles.installButton}
                onPress={handleInstallClick}
                activeOpacity={0.88}
              >
                <View style={styles.installButtonContent}>
                  <Smartphone size={20} color="#FFFFFF" />
                  <Text style={styles.installButtonText}>
                    {isIOS
                      ? 'Add to Home Screen (10 sec)'
                      : isInstalling
                      ? 'Opening Installer...'
                      : 'Install FortyWell App'}
                  </Text>
                  {isIOS ? (
                    <ArrowUpFromLine size={18} color="#FFFFFF" />
                  ) : (
                    <Download size={18} color="#FFFFFF" />
                  )}
                </View>
              </TouchableOpacity>
            </View>

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

      {/* ── STICKY FLOATING INSTALL BAR (iOS only, appears on scroll) ──────── */}
      {isIOS && (
        <Animated.View
          style={[
            styles.stickyBar,
            { transform: [{ translateY: stickyAnim }] },
          ]}
          pointerEvents={showStickyBar && !showIosGuide ? 'auto' : 'none'}
        >
          <View style={styles.stickyBarInner}>
            <View style={styles.stickyBarLeft}>
              <View style={styles.stickyBarIcon}>
                <Leaf size={14} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.stickyBarTitle}>Add FortyWell</Text>
                <Text style={styles.stickyBarSub}>Save to your Home Screen</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.stickyBarBtn}
              onPress={() => setShowIosGuide(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.stickyBarBtnText}>Install</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* ── IOS INSTALL GUIDE BOTTOM SHEET ──────────────────────────────────── */}
      {showIosGuide && (
        <View style={styles.sheetOverlay} pointerEvents="box-none">
          {/* Dimmed backdrop — tap to close */}
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setShowIosGuide(false)}
          />
          <Animated.View
            style={[
              styles.bottomSheet,
              { transform: [{ translateY: slideAnim }] },
            ]}
          >
            {/* Drag handle */}
            <View style={styles.dragHandle} />

            {/* Header */}
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>
                  {isIOSChrome ? 'Install in Safari' : 'Add to Home Screen'}
                </Text>
                <Text style={styles.sheetSubtitle}>
                  {isIOSChrome
                    ? '3 quick steps — open Safari, then follow these steps'
                    : 'Takes about 10 seconds in Safari'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.sheetCloseBtn}
                onPress={() => setShowIosGuide(false)}
              >
                <X size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>

            {/* Visual hint of Safari bar for Safari users */}
            {isIOSSafari && (
              <View style={styles.safariBarPreview}>
                <View style={styles.safariBarAddress}>
                  <Text style={styles.safariBarAddressText} numberOfLines={1}>
                    fortywell-mobile.vercel.app
                  </Text>
                </View>
                <View style={styles.safariBarIcons}>
                  {/* Visual representation of the share button */}
                  <View style={styles.safariShareHighlight}>
                    <ArrowUpFromLine size={16} color={colors.primary} />
                    <Text style={styles.safariShareLabel}>Tap this!</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Steps */}
            <View style={styles.stepsContainer}>
              {iosSteps.map((step, idx) => (
                <View key={idx} style={styles.stepRow}>
                  <View style={[styles.stepNumCircle, idx === iosSteps.length - 1 && { backgroundColor: colors.sage }]}>
                    <Text style={styles.stepNumText}>{step.num}</Text>
                  </View>
                  <View style={styles.stepDetails}>
                    <Text style={styles.stepHeading}>{step.heading}</Text>
                    <Text style={styles.stepSub}>{step.sub}</Text>
                  </View>
                  <View style={[styles.stepIconBox, { backgroundColor: step.iconColor + '15' }]}>
                    <step.Icon size={18} color={step.iconColor} />
                  </View>
                </View>
              ))}
            </View>

            {/* CTA */}
            <TouchableOpacity
              style={styles.sheetGotItBtn}
              onPress={() => {
                setShowIosGuide(false);
              }}
            >
              <CheckCircle2 size={16} color="#FFFFFF" />
              <Text style={styles.sheetGotItText}>Got it, I'll follow these steps</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetBypassBtn}
              onPress={() => {
                setShowIosGuide(false);
                handleBypass();
              }}
            >
              <Text style={styles.sheetBypassText}>Just open in browser instead</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
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
    paddingBottom: 120, // extra space for sticky bar
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
    marginBottom: 20,
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
  iosTeaserBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary + '30',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  iosTeaserIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iosTeaserText: {
    flex: 1,
    fontSize: 13,
    color: colors.primaryDark,
    fontFamily: 'WorkSans-Medium',
    lineHeight: 18,
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

  // ── Sticky floating bar ─────────────────────────────────────────────────
  stickyBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 400,
    ...Platform.select({
      ios: { paddingBottom: 28 },
      default: { paddingBottom: 12 },
    }),
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: colors.surfaceCard,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 16,
  },
  stickyBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  stickyBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  stickyBarIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickyBarTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: 'WorkSans-Bold',
  },
  stickyBarSub: {
    fontSize: 11,
    color: colors.textTertiary,
    fontFamily: 'WorkSans-Regular',
  },
  stickyBarBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  stickyBarBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'WorkSans-Bold',
  },

  // ── Bottom Sheet ────────────────────────────────────────────────────────
  sheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 500,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(30, 22, 18, 0.55)',
  },
  bottomSheet: {
    backgroundColor: colors.surfaceCard,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 24,
    maxHeight: '85%',
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderMedium,
    alignSelf: 'center',
    marginBottom: 18,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: 'PlayfairDisplay-Bold',
    marginBottom: 4,
  },
  sheetSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: 'WorkSans-Regular',
    maxWidth: 260,
  },
  sheetCloseBtn: {
    padding: 6,
    backgroundColor: colors.surface,
    borderRadius: 20,
  },

  // Safari bar preview widget
  safariBarPreview: {
    backgroundColor: '#F2F2F7',
    borderRadius: 14,
    padding: 10,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  safariBarAddress: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  safariBarAddressText: {
    fontSize: 12,
    color: '#3C3C43',
    fontFamily: 'WorkSans-Regular',
  },
  safariBarIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  safariShareHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  safariShareLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: 'WorkSans-Bold',
  },

  // Steps
  stepsContainer: {
    gap: 10,
    marginBottom: 20,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 14,
  },
  stepNumCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepNumText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'WorkSans-Bold',
  },
  stepDetails: {
    flex: 1,
  },
  stepHeading: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    fontFamily: 'WorkSans-SemiBold',
    marginBottom: 2,
  },
  stepSub: {
    fontSize: 11.5,
    color: colors.textTertiary,
    fontFamily: 'WorkSans-Regular',
    lineHeight: 16,
  },
  stepIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  // Sheet bottom buttons
  sheetGotItBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 15,
    marginBottom: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  sheetGotItText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'WorkSans-Bold',
  },
  sheetBypassBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  sheetBypassText: {
    fontSize: 13,
    color: colors.textTertiary,
    fontFamily: 'WorkSans-Medium',
    textDecorationLine: 'underline',
  },
});
