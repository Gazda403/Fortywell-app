import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Eye, EyeOff, CheckCircle, AlertCircle, ChevronRight, Mail, RefreshCw, ArrowLeft, Send } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { typography, fontFamilies } from '../theme/typography';
import { supabase } from '../lib/supabase';

const { width: SCREEN_W } = Dimensions.get('window');

interface AuthScreenProps {
  onAccountCreated: (firstName: string) => void;
  onLoginSuccess: () => void;
}

type Mode = 'signup' | 'login' | 'verify';

// ── Inline field validation ───────────────────────────────────────────────────

function validateFirstName(v: string): string | null {
  if (!v.trim()) return 'Please enter your first name.';
  if (v.trim().length < 2) return 'Needs at least 2 characters.';
  return null;
}
function validateEmail(v: string): string | null {
  if (!v.trim()) return 'Email is required.';
  if (!/\S+@\S+\.\S+/.test(v)) return 'Enter a valid email address.';
  return null;
}
function validatePassword(v: string): string | null {
  if (!v) return 'Password is required.';
  if (v.length < 8) return 'Must be at least 8 characters.';
  return null;
}

// ── Reusable form field ───────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string | null;
  valid?: boolean;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric';
  autoCapitalize?: 'none' | 'words' | 'sentences';
  returnKeyType?: 'next' | 'done';
  onSubmitEditing?: () => void;
  inputRef?: React.RefObject<TextInput | null> | React.RefObject<TextInput>;
}

const FormField: React.FC<FieldProps> = ({
  label,
  value,
  onChange,
  onBlur,
  error,
  valid,
  placeholder,
  secureTextEntry: secureProp = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  returnKeyType = 'next',
  onSubmitEditing,
  inputRef,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const isSecure = secureProp && !showPwd;

  return (
    <View style={ff.wrapper}>
      <Text style={ff.label}>{label}</Text>
      <View
        style={[
          ff.inputRow,
          isFocused && ff.inputFocused,
          error && ff.inputError,
          valid && !error && ff.inputValid,
        ]}
      >
        <TextInput
          ref={inputRef as any}
          style={ff.input}
          value={value}
          onChangeText={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            onBlur?.();
          }}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          secureTextEntry={isSecure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          autoComplete={secureProp ? 'password' : keyboardType === 'email-address' ? 'email' : 'off'}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
        />
        {secureProp && (
          <Pressable
            onPress={() => setShowPwd((p) => !p)}
            hitSlop={10}
            style={ff.eyeBtn}
            accessibilityLabel={showPwd ? 'Hide password' : 'Show password'}
          >
            {showPwd
              ? <EyeOff size={18} color={colors.textTertiary} />
              : <Eye size={18} color={colors.textTertiary} />
            }
          </Pressable>
        )}
        {!secureProp && valid && !error && (
          <CheckCircle size={16} color={colors.sage} style={{ marginRight: 12 }} />
        )}
      </View>
      {error ? (
        <View style={ff.errorRow}>
          <AlertCircle size={12} color={colors.error} />
          <Text style={ff.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
};

const ff = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: {
    fontSize: 11,
    fontFamily: fontFamilies.sansSemiBold,
    letterSpacing: 0.8,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  inputFocused: {
    borderColor: colors.peach,
    backgroundColor: '#FFFBF7',
  },
  inputError: {
    borderColor: colors.error,
  },
  inputValid: {
    borderColor: colors.sageBorder,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textPrimary,
  },
  eyeBtn: { paddingRight: 14 },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
    marginLeft: 2,
  },
  errorText: {
    fontSize: 12,
    fontFamily: fontFamilies.sansRegular,
    color: colors.error,
  },
});

// ── Main component ────────────────────────────────────────────────────────────

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAccountCreated, onLoginSuccess }) => {
  const [mode, setMode] = useState<Mode>('signup');

  // Signup state
  const [firstName, setFirstName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [fnTouched, setFnTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [pwdTouched, setPwdTouched] = useState(false);

  // Verification & OTP state
  const [otpCode, setOtpCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [resendBanner, setResendBanner] = useState<string | null>(null);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const emailRef = useRef<TextInput>(null);
  const pwdRef = useRef<TextInput>(null);
  const loginPwdRef = useRef<TextInput>(null);
  const otpRef = useRef<TextInput>(null);

  // Derived validation
  const fnError = fnTouched ? validateFirstName(firstName) : null;
  const emailError = emailTouched ? validateEmail(signupEmail) : null;
  const pwdError = pwdTouched ? validatePassword(signupPassword) : null;

  const signupReady =
    !validateFirstName(firstName) &&
    !validateEmail(signupEmail) &&
    !validatePassword(signupPassword);

  const loginReady = loginEmail.trim() !== '' && loginPassword.length >= 8;

  // Countdown timer for Resend Email
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const switchMode = useCallback((m: Mode) => {
    setMode(m);
    setAuthError(null);
    setResendBanner(null);
  }, []);

  const handleSignup = useCallback(async () => {
    // Touch all fields to surface errors
    setFnTouched(true);
    setEmailTouched(true);
    setPwdTouched(true);
    if (!signupReady) return;

    setLoading(true);
    setAuthError(null);
    setResendBanner(null);
    try {
      const trimmedName = firstName.trim();
      const { data, error } = await supabase.auth.signUp({
        email: signupEmail.trim().toLowerCase(),
        password: signupPassword,
        options: {
          data: { full_name: trimmedName },
        },
      });
      if (error) throw error;

      // Detect if this email is already registered (Supabase returns identities: [] when user already exists)
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        setAuthError('An account with this email already exists. Please log in below.');
        setLoginEmail(signupEmail.trim().toLowerCase());
        setMode('login');
        return;
      }

      // Also update the profile row first_name immediately (trigger may race)
      if (data.user?.id) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          first_name: trimmedName,
          target_focus: [],
          joint_sensitivities: [],
          has_completed_onboarding: false,
          updated_at: new Date().toISOString(),
        });
      }

      try { if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}

      // Proceed into onboarding quiz
      onAccountCreated(trimmedName);
    } catch (err: any) {
      const msg = err?.message || 'Something went wrong. Please try again.';
      if (msg.toLowerCase().includes('rate limit')) {
        setAuthError(
          'Email rate limit reached. Please wait a few minutes before trying again.'
        );
      } else if (msg.includes('already registered')) {
        setAuthError('An account with this email already exists. Tap "Log In" above to continue.');
      } else {
        setAuthError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [firstName, signupEmail, signupPassword, signupReady, onAccountCreated]);

  const handleLogin = useCallback(async () => {
    if (!loginReady) return;
    setLoading(true);
    setAuthError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim().toLowerCase(),
        password: loginPassword,
      });
      if (error) throw error;
      try { if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
      onLoginSuccess();
    } catch (err: any) {
      setAuthError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [loginEmail, loginPassword, loginReady, onLoginSuccess]);

  const handleGoogleOAuth = useCallback(async () => {
    setGoogleLoading(true);
    setAuthError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: 'https://yadjzsjfmamckptqotap.supabase.co/auth/v1/callback' },
      });
      if (error) throw error;
      // OAuth redirects — onLoginSuccess will be called once session is detected
    } catch (err: any) {
      setAuthError('Google sign-in is not available right now. Use email instead.');
    } finally {
      setGoogleLoading(false);
    }
  }, []);

  const handleVerifyOtp = useCallback(async () => {
    const cleanToken = otpCode.trim();
    if (cleanToken.length < 6) {
      setAuthError('Please enter the 6-digit verification code from your email.');
      return;
    }

    setLoading(true);
    setAuthError(null);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: signupEmail.trim().toLowerCase(),
        token: cleanToken,
        type: 'signup',
      });
      if (error) throw error;

      try { if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
      onAccountCreated(firstName.trim() || 'Welcome');
    } catch (err: any) {
      setAuthError(err?.message || 'Invalid or expired code. Please double-check or request a new one.');
    } finally {
      setLoading(false);
    }
  }, [otpCode, signupEmail, firstName, onAccountCreated]);

  const handleResendEmail = useCallback(async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    setAuthError(null);
    setResendBanner(null);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: signupEmail.trim().toLowerCase(),
      });
      if (error) throw error;
      setResendCooldown(60);
      setResendBanner(`A new confirmation email was sent to ${signupEmail.trim().toLowerCase()}`);
      try { if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
    } catch (err: any) {
      setAuthError(err?.message || 'Could not resend email. Please wait a moment and try again.');
    } finally {
      setResending(false);
    }
  }, [resendCooldown, resending, signupEmail]);

  const handleOpenMailApp = useCallback(async () => {
    try {
      if (Platform.OS === 'ios') {
        await Linking.openURL('message://');
      } else if (Platform.OS === 'android') {
        await Linking.openURL('mailto:');
      } else {
        window.open('https://mail.google.com', '_blank');
      }
    } catch {
      try {
        await Linking.openURL('mailto:');
      } catch (_) {}
    }
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── BRAND HEADER ── */}
          <View style={styles.brandHeader}>
            <View style={styles.logoMark}>
              <Text style={styles.logoGlyph}>✦</Text>
            </View>
            <Text style={styles.wordmark}>fortywell</Text>
            <Text style={styles.tagline}>
              A wellness approach built for your body, starting now.
            </Text>
          </View>

          {/* ── MODE TOGGLE PILL (Hidden during OTP verify mode) ── */}
          {mode !== 'verify' ? (
            <View style={styles.modeToggle}>
              <Pressable
                style={[styles.modePill, mode === 'signup' && styles.modePillActive]}
                onPress={() => switchMode('signup')}
                accessibilityRole="tab"
                accessibilityState={{ selected: mode === 'signup' }}
              >
                <Text style={[styles.modePillText, mode === 'signup' && styles.modePillTextActive]}>
                  Create Account
                </Text>
              </Pressable>
              <Pressable
                style={[styles.modePill, mode === 'login' && styles.modePillActive]}
                onPress={() => switchMode('login')}
                accessibilityRole="tab"
                accessibilityState={{ selected: mode === 'login' }}
              >
                <Text style={[styles.modePillText, mode === 'login' && styles.modePillTextActive]}>
                  Log In
                </Text>
              </Pressable>
            </View>
          ) : null}

          {/* ── FORM CARD ── */}
          <View style={styles.formCard}>
            {mode === 'verify' ? (
              <Animated.View key="verify" entering={FadeIn.duration(260)}>
                {/* Back button */}
                <Pressable
                  style={styles.backBtn}
                  onPress={() => switchMode('signup')}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Back to sign up"
                >
                  <ArrowLeft size={16} color={colors.textSecondary} />
                  <Text style={styles.backBtnText}>Back to sign up</Text>
                </Pressable>

                {/* Animated Mail Icon */}
                <View style={styles.verifyIconWrap}>
                  <View style={styles.verifyIconCircle}>
                    <Mail size={32} color={colors.rose} strokeWidth={1.8} />
                  </View>
                </View>

                <Text style={styles.formHeadline}>Check your inbox</Text>
                <Text style={styles.formSubtext}>
                  We sent a confirmation link & 6-digit code to:
                </Text>

                {/* Email highlight pill */}
                <View style={styles.emailPill}>
                  <Text style={styles.emailPillText}>{signupEmail}</Text>
                </View>

                {/* 6-digit OTP code input */}
                <View style={styles.otpSection}>
                  <Text style={styles.otpLabel}>ENTER 6-DIGIT CODE</Text>
                  <View style={styles.otpInputWrap}>
                    <TextInput
                      ref={otpRef}
                      style={styles.otpInput}
                      value={otpCode}
                      onChangeText={(text) => {
                        const cleaned = text.replace(/[^0-9]/g, '').slice(0, 6);
                        setOtpCode(cleaned);
                        if (authError) setAuthError(null);
                      }}
                      placeholder="• • • • • •"
                      placeholderTextColor={colors.textTertiary}
                      keyboardType="numeric"
                      maxLength={6}
                      returnKeyType="done"
                      onSubmitEditing={handleVerifyOtp}
                      autoFocus
                    />
                  </View>
                </View>

                {resendBanner && (
                  <Animated.View entering={FadeIn} style={styles.successBanner}>
                    <CheckCircle size={15} color={colors.sageDark} />
                    <Text style={styles.successBannerText}>{resendBanner}</Text>
                  </Animated.View>
                )}

                {authError && (
                  <Animated.View entering={FadeIn} style={styles.errorBanner}>
                    <AlertCircle size={15} color={colors.error} />
                    <Text style={styles.errorBannerText}>{authError}</Text>
                  </Animated.View>
                )}

                {/* Primary Verify CTA */}
                <Pressable
                  style={[
                    styles.primaryBtn,
                    (otpCode.length < 6 || loading) && styles.primaryBtnDisabled,
                  ]}
                  onPress={handleVerifyOtp}
                  disabled={loading || otpCode.length < 6}
                  accessibilityRole="button"
                  accessibilityLabel="Verify Code and Continue"
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.primaryBtnText}>Verify Code & Begin</Text>
                      <ChevronRight size={16} color="#fff" />
                    </>
                  )}
                </Pressable>

                {/* Open Mail App button */}
                <Pressable
                  style={styles.openMailBtn}
                  onPress={handleOpenMailApp}
                  accessibilityRole="button"
                  accessibilityLabel="Open email app"
                >
                  <Send size={15} color={colors.textPrimary} />
                  <Text style={styles.openMailBtnText}>Open Mail App</Text>
                </Pressable>

                {/* Resend email / cooldown timer */}
                <View style={styles.resendRow}>
                  {resendCooldown > 0 ? (
                    <Text style={styles.resendCooldownText}>
                      Resend available in {resendCooldown}s
                    </Text>
                  ) : (
                    <Pressable
                      style={styles.resendBtn}
                      onPress={handleResendEmail}
                      disabled={resending}
                    >
                      {resending ? (
                        <ActivityIndicator size="small" color={colors.rose} />
                      ) : (
                        <Text style={styles.resendBtnText}>
                          Didn't receive the email?{' '}
                          <Text style={styles.resendBtnHighlight}>Resend code</Text>
                        </Text>
                      )}
                    </Pressable>
                  )}
                </View>
              </Animated.View>
            ) : mode === 'signup' ? (
              <Animated.View key="signup" entering={FadeIn.duration(220)}>
                <Text style={styles.formHeadline}>Let's get started.</Text>
                <Text style={styles.formSubtext}>
                  Takes 2 minutes. No card required.
                </Text>

                <FormField
                  label="First Name"
                  value={firstName}
                  onChange={setFirstName}
                  onBlur={() => setFnTouched(true)}
                  error={fnError}
                  valid={!validateFirstName(firstName) && fnTouched}
                  placeholder="What should we call you?"
                  autoCapitalize="words"
                  returnKeyType="next"
                  onSubmitEditing={() => emailRef.current?.focus()}
                />

                <FormField
                  label="Email"
                  value={signupEmail}
                  onChange={setSignupEmail}
                  onBlur={() => setEmailTouched(true)}
                  error={emailError}
                  valid={!validateEmail(signupEmail) && emailTouched}
                  placeholder="your@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="next"
                  onSubmitEditing={() => pwdRef.current?.focus()}
                  inputRef={emailRef}
                />

                <FormField
                  label="Password"
                  value={signupPassword}
                  onChange={setSignupPassword}
                  onBlur={() => setPwdTouched(true)}
                  error={pwdError}
                  valid={!validatePassword(signupPassword) && pwdTouched}
                  placeholder="8+ characters"
                  secureTextEntry
                  returnKeyType="done"
                  onSubmitEditing={handleSignup}
                  inputRef={pwdRef}
                />

                {authError && (
                  <Animated.View entering={FadeIn} style={styles.errorBanner}>
                    <AlertCircle size={15} color={colors.error} />
                    <Text style={styles.errorBannerText}>{authError}</Text>
                  </Animated.View>
                )}

                {/* Primary CTA */}
                <Pressable
                  style={[styles.primaryBtn, (!signupReady || loading) && styles.primaryBtnDisabled]}
                  onPress={handleSignup}
                  disabled={loading}
                  accessibilityRole="button"
                  accessibilityLabel="Create My Account"
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.primaryBtnText}>Create My Account</Text>
                      <ChevronRight size={16} color="#fff" />
                    </>
                  )}
                </Pressable>

                {/* Divider */}
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Google OAuth */}
                <Pressable
                  style={[styles.googleBtn, googleLoading && styles.googleBtnDisabled]}
                  onPress={handleGoogleOAuth}
                  disabled={googleLoading}
                  accessibilityRole="button"
                  accessibilityLabel="Continue with Google"
                >
                  {googleLoading ? (
                    <ActivityIndicator size="small" color={colors.textSecondary} />
                  ) : (
                    <>
                      <Text style={styles.googleG}>G</Text>
                      <Text style={styles.googleBtnText}>Continue with Google</Text>
                    </>
                  )}
                </Pressable>

                {/* Footer toggle */}
                <Pressable
                  style={styles.footerLink}
                  onPress={() => switchMode('login')}
                  accessibilityRole="link"
                >
                  <Text style={styles.footerLinkText}>
                    Already have an account?{' '}
                    <Text style={styles.footerLinkEmphasis}>Log in</Text>
                  </Text>
                </Pressable>
              </Animated.View>
            ) : (
              <Animated.View key="login" entering={FadeIn.duration(220)}>
                <Text style={styles.formHeadline}>Welcome back.</Text>
                <Text style={styles.formSubtext}>
                  Pick up right where you left off.
                </Text>

                <FormField
                  label="Email"
                  value={loginEmail}
                  onChange={setLoginEmail}
                  placeholder="your@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="next"
                  onSubmitEditing={() => loginPwdRef.current?.focus()}
                />

                <FormField
                  label="Password"
                  value={loginPassword}
                  onChange={setLoginPassword}
                  placeholder="Your password"
                  secureTextEntry
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  inputRef={loginPwdRef}
                />

                {/* Forgot password — placeholder */}
                <Pressable style={styles.forgotBtn} accessibilityRole="link">
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </Pressable>

                {authError && (
                  <Animated.View entering={FadeIn} style={styles.errorBanner}>
                    <AlertCircle size={15} color={colors.error} />
                    <Text style={styles.errorBannerText}>{authError}</Text>
                  </Animated.View>
                )}

                <Pressable
                  style={[styles.primaryBtn, (!loginReady || loading) && styles.primaryBtnDisabled]}
                  onPress={handleLogin}
                  disabled={loading}
                  accessibilityRole="button"
                  accessibilityLabel="Log In"
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.primaryBtnText}>Log In</Text>
                      <ChevronRight size={16} color="#fff" />
                    </>
                  )}
                </Pressable>

                {/* Divider */}
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                <Pressable
                  style={[styles.googleBtn, googleLoading && styles.googleBtnDisabled]}
                  onPress={handleGoogleOAuth}
                  disabled={googleLoading}
                  accessibilityRole="button"
                  accessibilityLabel="Continue with Google"
                >
                  {googleLoading ? (
                    <ActivityIndicator size="small" color={colors.textSecondary} />
                  ) : (
                    <>
                      <Text style={styles.googleG}>G</Text>
                      <Text style={styles.googleBtnText}>Continue with Google</Text>
                    </>
                  )}
                </Pressable>

                <Pressable
                  style={styles.footerLink}
                  onPress={() => switchMode('signup')}
                  accessibilityRole="link"
                >
                  <Text style={styles.footerLinkText}>
                    New here?{' '}
                    <Text style={styles.footerLinkEmphasis}>Create an account</Text>
                  </Text>
                </Pressable>
              </Animated.View>
            )}
          </View>

          {/* ── TRUST FOOTER ── */}
          <Text style={styles.trustNote}>
            🔒 Your data is private and never sold. Unsubscribe any time.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  kav: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },

  // Brand header
  brandHeader: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 32,
  },
  logoMark: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.rose,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    ...Platform.select({
      ios: { shadowColor: colors.rose, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14 },
      android: { elevation: 8 },
      default: {},
    }),
  },
  logoGlyph: {
    fontSize: 22,
    color: '#fff',
    fontFamily: fontFamilies.soria,
  },
  wordmark: {
    fontSize: 28,
    fontFamily: fontFamilies.soria,
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  tagline: {
    fontSize: 14,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 260,
  },

  // Mode toggle
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundSubtle,
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  modePill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 11,
    alignItems: 'center',
  },
  modePillActive: {
    backgroundColor: colors.surfaceCard,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 },
      android: { elevation: 2 },
      default: {},
    }),
  },
  modePillText: {
    fontSize: 13,
    fontFamily: fontFamilies.sansMedium,
    color: colors.textTertiary,
  },
  modePillTextActive: {
    color: colors.textPrimary,
    fontFamily: fontFamilies.sansSemiBold,
  },

  // Form card
  formCard: {
    backgroundColor: colors.surfaceCard,
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    ...Platform.select({
      ios: { shadowColor: '#3A2F2A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16 },
      android: { elevation: 4 },
      default: { boxShadow: '0 4px 24px rgba(58,47,42,0.08)' },
    }),
  },
  formHeadline: {
    fontSize: 24,
    fontFamily: fontFamilies.soria,
    color: colors.textPrimary,
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  formSubtext: {
    fontSize: 13,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textTertiary,
    marginBottom: 24,
  },

  // Error banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(201,99,116,0.08)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    fontFamily: fontFamilies.sansRegular,
    color: colors.error,
    lineHeight: 18,
  },

  // Primary button
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.rose,
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 20,
    ...Platform.select({
      ios: { shadowColor: colors.rose, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 10 },
      android: { elevation: 6 },
      default: {},
    }),
  },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: {
    fontSize: 15,
    fontFamily: fontFamilies.sansSemiBold,
    color: '#fff',
    letterSpacing: 0.2,
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: 12,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textTertiary,
  },

  // Google button
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: 24,
  },
  googleBtnDisabled: { opacity: 0.5 },
  googleG: {
    fontSize: 16,
    fontFamily: fontFamilies.sansBold,
    color: '#4285F4',
  },
  googleBtnText: {
    fontSize: 14,
    fontFamily: fontFamilies.sansMedium,
    color: colors.textSecondary,
  },

  // Footer link
  footerLink: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  footerLinkText: {
    fontSize: 13,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textTertiary,
  },
  footerLinkEmphasis: {
    fontFamily: fontFamilies.sansSemiBold,
    color: colors.rose,
  },

  // Forgot password
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: -8,
    marginBottom: 16,
  },
  forgotText: {
    fontSize: 12,
    fontFamily: fontFamilies.sansMedium,
    color: colors.textTertiary,
  },

  // Trust footer
  trustNote: {
    textAlign: 'center',
    fontSize: 11,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textTertiary,
    lineHeight: 16,
    paddingHorizontal: 20,
  },

  // ── Verification screen styles ──
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  backBtnText: {
    fontSize: 13,
    fontFamily: fontFamilies.sansMedium,
    color: colors.textSecondary,
  },
  verifyIconWrap: {
    alignItems: 'center',
    marginBottom: 16,
  },
  verifyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 24,
    backgroundColor: 'rgba(208, 120, 135, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(208, 120, 135, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailPill: {
    backgroundColor: 'rgba(208, 120, 135, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(208, 120, 135, 0.25)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignSelf: 'center',
    marginBottom: 20,
  },
  emailPillText: {
    fontSize: 13.5,
    fontFamily: fontFamilies.monoBold,
    color: colors.primaryDark,
    letterSpacing: 0.3,
  },
  otpSection: {
    marginBottom: 20,
  },
  otpLabel: {
    fontSize: 11,
    fontFamily: fontFamilies.sansSemiBold,
    letterSpacing: 1.2,
    color: colors.textTertiary,
    textAlign: 'center',
    marginBottom: 10,
  },
  otpInputWrap: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.peach,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  otpInput: {
    fontSize: 24,
    fontFamily: fontFamilies.monoBold,
    color: colors.textPrimary,
    letterSpacing: 10,
    textAlign: 'center',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(146, 169, 117, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(146, 169, 117, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  successBannerText: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: fontFamilies.sansMedium,
    color: colors.sageDark,
    lineHeight: 18,
  },
  openMailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: 18,
  },
  openMailBtnText: {
    fontSize: 14,
    fontFamily: fontFamilies.sansMedium,
    color: colors.textPrimary,
  },
  resendRow: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  resendCooldownText: {
    fontSize: 12.5,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textTertiary,
  },
  resendBtn: {
    paddingVertical: 4,
  },
  resendBtnText: {
    fontSize: 13,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textTertiary,
  },
  resendBtnHighlight: {
    fontFamily: fontFamilies.sansSemiBold,
    color: colors.rose,
  },
});
