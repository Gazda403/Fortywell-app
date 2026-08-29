import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TextInput,
  Pressable,
  Platform,
  Linking,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  X,
  UserCheck,
  Mail,
  User,
  Phone,
  MessageSquare,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { fontFamilies } from '../theme/typography';
import { UserProfile } from '../hooks/useUserData';

interface CoachLeadModalProps {
  visible: boolean;
  onClose: () => void;
  selectedMessagingApp: 'whatsapp' | 'signal' | 'viber' | 'messenger';
  userProfile: UserProfile;
  onSuccess: () => void;
}

// Live endpoint on fortywell-app Next.js backend
const LEAD_API_URL = 'https://fortywell-app.vercel.app/api/coaching/lead';

// Lemon Squeezy Checkout URL (with Annual/Monthly/Coaching options)
const LEMON_SQUEEZY_CHECKOUT_URL =
  'https://fortywell.lemonsqueezy.com/checkout/buy/3f039828-d006-4d16-8366-97bf8eb733fa';

export const CoachLeadModal: React.FC<CoachLeadModalProps> = ({
  visible,
  onClose,
  selectedMessagingApp,
  userProfile,
  onSuccess,
}) => {
  const appDisplayName =
    selectedMessagingApp === 'whatsapp'
      ? 'WhatsApp'
      : selectedMessagingApp === 'signal'
      ? 'Signal'
      : selectedMessagingApp === 'viber'
      ? 'Viber'
      : 'Messenger';

  const [email, setEmail] = useState<string>(userProfile.email || '');
  const [name, setName] = useState<string>(userProfile.fullName || '');
  const [handle, setHandle] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      if (userProfile.email && !email) setEmail(userProfile.email);
      if (userProfile.fullName && !name) setName(userProfile.fullName);
      setErrorMessage(null);
    }
  }, [visible, userProfile]);

  const handleSubmit = async () => {
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!handle.trim()) {
      setErrorMessage(`Please enter your phone number or handle for ${appDisplayName}.`);
      return;
    }

    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (_) {}

    setLoading(true);
    setErrorMessage(null);

    try {
      // 1. Send lead details via Resend API endpoint
      try {
        await fetch(LEAD_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim() || userProfile.fullName,
            email: email.trim(),
            phoneOrHandle: handle.trim(),
            messagingApp: appDisplayName,
            notes: notes.trim(),
            userId: userProfile.id,
          }),
        });
      } catch (networkErr) {
        console.warn('Lead API submission notice:', networkErr);
      }

      // 2. Build Lemon Squeezy checkout link with customer pre-fill
      const params: string[] = [];
      if (email.trim()) {
        params.push(`checkout[email]=${encodeURIComponent(email.trim())}`);
      }
      if (name.trim()) {
        params.push(`checkout[name]=${encodeURIComponent(name.trim())}`);
      }
      if (userProfile.id) {
        params.push(`checkout[custom][user_id]=${encodeURIComponent(userProfile.id)}`);
      }
      params.push(`checkout[custom][messaging_app]=${encodeURIComponent(appDisplayName)}`);
      params.push(`checkout[custom][handle]=${encodeURIComponent(handle.trim())}`);

      const delimiter = LEMON_SQUEEZY_CHECKOUT_URL.includes('?') ? '&' : '?';
      const checkoutUrl = `${LEMON_SQUEEZY_CHECKOUT_URL}${delimiter}${params.join('&')}`;

      // 3. Open checkout in browser
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          window.open(checkoutUrl, '_blank');
        }
      } else {
        await Linking.openURL(checkoutUrl);
      }

      // 4. Notify parent & close
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={s.backdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={s.keyboardView}
        >
          <View style={s.card}>
            {/* Header */}
            <View style={s.headerRow}>
              <View style={s.badge}>
                <Sparkles size={12} color={colors.primaryDark} strokeWidth={2.2} />
                <Text style={s.badgeText}>1:1 VIP COACHING · $55/MO</Text>
              </View>
              <Pressable
                style={s.closeBtn}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <X size={18} color={colors.textSecondary} strokeWidth={2} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={s.scrollContent}
            >
              <Text style={s.title}>Connect With Your Coach</Text>
              <Text style={s.subtitle}>
                We'll establish first contact on{' '}
                <Text style={s.highlightApp}>{appDisplayName}</Text> and send your
                onboarding intake form to your email.
              </Text>

              {errorMessage ? (
                <View style={s.errorBanner}>
                  <Text style={s.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              {/* Form Field: Email */}
              <View style={s.inputGroup}>
                <Text style={s.inputLabel}>YOUR EMAIL ADDRESS *</Text>
                <View style={s.inputWrap}>
                  <Mail size={16} color={colors.textTertiary} strokeWidth={2} />
                  <TextInput
                    style={s.input}
                    placeholder="you@example.com"
                    placeholderTextColor={colors.textTertiary}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Form Field: Name */}
              <View style={s.inputGroup}>
                <Text style={s.inputLabel}>YOUR FULL NAME</Text>
                <View style={s.inputWrap}>
                  <User size={16} color={colors.textTertiary} strokeWidth={2} />
                  <TextInput
                    style={s.input}
                    placeholder="First and last name"
                    placeholderTextColor={colors.textTertiary}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              {/* Form Field: Phone/Handle on chosen app */}
              <View style={s.inputGroup}>
                <Text style={s.inputLabel}>
                  YOUR {appDisplayName.toUpperCase()} NUMBER / HANDLE *
                </Text>
                <View style={s.inputWrap}>
                  <Phone size={16} color={colors.textTertiary} strokeWidth={2} />
                  <TextInput
                    style={s.input}
                    placeholder={
                      selectedMessagingApp === 'messenger'
                        ? '@facebook_username or profile link'
                        : '+1 (555) 000-0000'
                    }
                    placeholderTextColor={colors.textTertiary}
                    value={handle}
                    onChangeText={setHandle}
                    keyboardType={
                      selectedMessagingApp === 'messenger' ? 'default' : 'phone-pad'
                    }
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Form Field: Notes/Goals */}
              <View style={s.inputGroup}>
                <Text style={s.inputLabel}>WHAT WOULD YOU LIKE TO FOCUS ON? (OPTIONAL)</Text>
                <View style={[s.inputWrap, s.inputWrapArea]}>
                  <MessageSquare
                    size={16}
                    color={colors.textTertiary}
                    strokeWidth={2}
                    style={{ marginTop: 2 }}
                  />
                  <TextInput
                    style={[s.input, s.inputArea]}
                    placeholder="e.g. Morning hip stiffness, perimenopause energy, tailored strength adjustments"
                    placeholderTextColor={colors.textTertiary}
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </View>

              {/* Perks Row */}
              <View style={s.perksRow}>
                <View style={s.perkItem}>
                  <CheckCircle2 size={13} color={colors.sageDark} strokeWidth={2.2} />
                  <Text style={s.perkText}>Daily text accountability</Text>
                </View>
                <View style={s.perkItem}>
                  <CheckCircle2 size={13} color={colors.sageDark} strokeWidth={2.2} />
                  <Text style={s.perkText}>Direct protocol adaptations</Text>
                </View>
              </View>

              {/* Submit CTA */}
              <Pressable
                style={[s.submitBtn, loading && { opacity: 0.85 }]}
                onPress={handleSubmit}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Continue to checkout"
              >
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={s.submitGradient}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={s.submitBtnText}>
                        Continue to Checkout ($55/mo)
                      </Text>
                      <ArrowRight size={17} color="#FFFFFF" strokeWidth={2.2} />
                    </>
                  )}
                </LinearGradient>
              </Pressable>

              <Text style={s.trustText}>
                Secure Lemon Squeezy checkout · Cancel anytime with 1 tap
              </Text>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(42, 35, 32, 0.65)',
    justifyContent: 'flex-end',
  },
  keyboardView: {
    width: '100%',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.18,
        shadowRadius: 20,
      },
      android: { elevation: 16 },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(201, 99, 116, 0.2)',
  },
  badgeText: {
    fontSize: 10,
    fontFamily: fontFamilies.monoBold,
    color: colors.primaryDark,
    letterSpacing: 1.2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(101, 78, 60, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 16,
  },
  title: {
    fontSize: 22,
    fontFamily: fontFamilies.soria,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textSecondary,
    lineHeight: 19,
    marginBottom: 18,
  },
  highlightApp: {
    fontFamily: fontFamilies.sansBold,
    color: colors.primaryDark,
  },
  errorBanner: {
    backgroundColor: 'rgba(201, 70, 91, 0.1)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(201, 70, 91, 0.25)',
  },
  errorText: {
    fontSize: 12,
    fontFamily: fontFamilies.sansMedium,
    color: colors.error,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 10,
    fontFamily: fontFamilies.monoBold,
    color: colors.textTertiary,
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderMedium,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  inputWrapArea: {
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textPrimary,
    padding: 0,
  },
  inputArea: {
    minHeight: 50,
    textAlignVertical: 'top',
  },
  perksRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
    marginTop: 4,
  },
  perkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  perkText: {
    fontSize: 11.5,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textSecondary,
  },
  submitBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 10,
    ...Platform.select({
      ios: {
        shadowColor: colors.primaryDark,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 18,
    gap: 8,
  },
  submitBtnText: {
    fontSize: 14.5,
    fontFamily: fontFamilies.sansBold,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  trustText: {
    fontSize: 11,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});
