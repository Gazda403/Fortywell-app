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
} from 'lucide-react-native';
import { colors } from '../theme/colors';

interface PwaWelcomeGateProps {
  onEnterApp: () => void;
}

export function PwaWelcomeGate({ onEnterApp }: PwaWelcomeGateProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    // Detect iOS Safari
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isIosDevice);

    // Register service worker if supported
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      });
    }

    // Capture install prompt
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
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

  return (
    <View style={styles.outerContainer}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>
          {/* Header Brand */}
          <View style={styles.brandRow}>
            <View style={styles.leafBadge}>
              <Leaf size={16} color={colors.sage} />
            </View>
            <Text style={styles.brandText}>FORTYWELL</Text>
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
                    Tap the <Text style={{ fontWeight: '700' }}>Share</Text> button
                  </Text>
                  <Text style={styles.stepSub}>
                    Found in Safari's bottom toolbar or Chrome's address bar.
                  </Text>
                </View>
                <View style={styles.stepIconBox}>
                  <Share size={18} color={colors.primary} />
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
                    Scroll down slightly in the share menu options.
                  </Text>
                </View>
                <View style={styles.stepIconBox}>
                  <PlusSquare size={18} color={colors.sageDark} />
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
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    minHeight: '100%',
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 460,
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  leafBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.sageSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontSize: 14,
    letterSpacing: 3,
    fontWeight: '700',
    color: colors.textPrimary,
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
