import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, StatusBar, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import {
  MartianMono_400Regular,
  MartianMono_500Medium,
  MartianMono_600SemiBold,
  MartianMono_700Bold,
} from '@expo-google-fonts/martian-mono';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import {
  WorkSans_400Regular,
  WorkSans_500Medium,
  WorkSans_600SemiBold,
  WorkSans_700Bold,
} from '@expo-google-fonts/work-sans';
import { AuthScreen } from './screens/AuthScreen';
import { OnboardingQuizScreen } from './screens/OnboardingQuizScreen';
import { HomeScreen } from './screens/HomeScreen';
import { PwaWelcomeGate } from './components/PwaWelcomeGate';
import { OnboardingAnswers } from './types/onboarding';
import { colors } from './theme/colors';
import { supabase } from './lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LanguageProvider } from './context/LanguageContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { getStoredSettings } from './lib/userSettings';

const STORAGE_PROFILE_KEY = '@fortywell_completed_profile';
const STORAGE_ONBOARDING_COMPLETED_KEY = '@fortywell_onboarding_completed';

function checkIsStandalone(): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return true; // Native apps are always standalone
  }
  try {
    const isStandaloneMatch = window.matchMedia && (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      window.matchMedia('(display-mode: minimal-ui)').matches
    );
    if (isStandaloneMatch) return true;

    if ((window.navigator as any)?.standalone === true) return true;

    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'standalone' || params.get('pwa') === '1' || params.get('app') === 'true') {
      return true;
    }

    if (sessionStorage.getItem('fortywell_web_bypass') === 'true') {
      return true;
    }
  } catch (_) {}

  return false;
}

type AppScreen = 'loading' | 'auth' | 'quiz' | 'home';

export default function App() {
  const [isInstalledApp, setIsInstalledApp] = useState<boolean>(() => checkIsStandalone());
  const [activeScreen, setActiveScreen] = useState<AppScreen>('loading');
  const [userFirstName, setUserFirstName] = useState<string>('');
  // Flag: once checkAuthSession has navigated away from loading, the auth listener
  // should not race-navigate again on the same session restore.
  const sessionHandledRef = React.useRef(false);
  const [completedProfile, setCompletedProfile] = useState<OnboardingAnswers | null>(null);

  const [fontsLoaded] = useFonts({
    'Soria': require('./assets/fonts/soria-font.ttf'),
    'MartianMono-Regular': MartianMono_400Regular,
    'MartianMono-Medium': MartianMono_500Medium,
    'MartianMono-SemiBold': MartianMono_600SemiBold,
    'MartianMono-Bold': MartianMono_700Bold,
    'PlayfairDisplay-Regular': PlayfairDisplay_400Regular,
    'PlayfairDisplay-Bold': PlayfairDisplay_700Bold,
    'WorkSans-Regular': WorkSans_400Regular,
    'WorkSans-Medium': WorkSans_500Medium,
    'WorkSans-SemiBold': WorkSans_600SemiBold,
    'WorkSans-Bold': WorkSans_700Bold,
  });

  // Helper to extract onboarding profile from database row
  const buildProfileData = (profile: any, user: any, name: string): OnboardingAnswers => ({
    first_name: profile?.first_name || name || 'Member',
    target_focus: profile?.target_focus || [],
    energy_baseline: profile?.energy_baseline || null,
    joint_sensitivities: profile?.joint_sensitivities || [],
    time_commitment: profile?.time_commitment || null,
    weekly_frequency: profile?.weekly_frequency || '3–4 days',
    training_location: profile?.training_location || null,
    equipment: profile?.equipment || [],
  });

  // Check initial authentication state & onboarding completion
  useEffect(() => {
    let isMounted = true;
    sessionHandledRef.current = false;

    async function checkAuthSession() {
      try {
        // Load persistent settings (sound, haptics, notifications)
        getStoredSettings().catch(() => {});

        // 1. Try reading cached profile from local storage immediately
        let localProfile: OnboardingAnswers | null = null;
        try {
          const storedStr = await AsyncStorage.getItem(STORAGE_PROFILE_KEY);
          if (storedStr) {
            localProfile = JSON.parse(storedStr);
          }
        } catch (_) {}

        // 2. Fetch Supabase session with a 3s timeout safeguard
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<{ data: { session: null } }>((resolve) =>
          setTimeout(() => resolve({ data: { session: null } }), 3000)
        );

        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);

        if (!session?.user) {
          if (isMounted) {
            sessionHandledRef.current = true;
            setActiveScreen('auth');
          }
          return;
        }

        const user = session.user;
        const name = user.user_metadata?.full_name || '';
        if (name && isMounted) {
          setUserFirstName(name.split(' ')[0]);
        }

        // 3. Query profile for user data with a fast timeout
        let profile: any = null;
        try {
          const profileQuery = supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          const { data: pData } = await Promise.race([
            profileQuery,
            new Promise<{ data: null }>((resolve) => setTimeout(() => resolve({ data: null }), 2500)),
          ]);
          profile = pData;
        } catch (_) {}

        if (profile?.first_name && isMounted) {
          setUserFirstName(profile.first_name);
        }

        if (isMounted) {
          const finalProfile = buildProfileData(profile || localProfile, user, name);
          setCompletedProfile(finalProfile);

          // Save to local storage
          try {
            await AsyncStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(finalProfile));
            await AsyncStorage.setItem(STORAGE_ONBOARDING_COMPLETED_KEY, 'true');
          } catch (_) {}

          // Mark session as handled so the auth listener doesn't race-navigate
          sessionHandledRef.current = true;
          // Existing signed-in user on refresh goes straight to home
          setActiveScreen('home');
        }
      } catch (err) {
        console.warn('Auth check notice:', err);
        if (isMounted) {
          sessionHandledRef.current = true;
          setActiveScreen('auth');
        }
      }
    }

    checkAuthSession();

    // Listen to Supabase auth events (sign in, sign out, token refresh)
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        if (isMounted) {
          setCompletedProfile(null);
          setUserFirstName('');
          try {
            await AsyncStorage.removeItem(STORAGE_PROFILE_KEY);
            await AsyncStorage.removeItem(STORAGE_ONBOARDING_COMPLETED_KEY);
          } catch (_) {}
          setActiveScreen('auth');
        }
      } else if (event === 'SIGNED_IN' && session?.user) {
        // Guard: if checkAuthSession already handled this session (normal page load),
        // don't race-navigate again. Only act on genuine new sign-ins.
        if (isMounted && !sessionHandledRef.current) {
          const user = session.user;
          const name = user.user_metadata?.full_name || '';
          let profile: any = null;
          try {
            // Always use a timeout so a slow DB doesn't freeze the app on web refresh
            const profileQuery = supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .maybeSingle();
            const { data: pData } = await Promise.race([
              profileQuery,
              new Promise<{ data: null }>((resolve) =>
                setTimeout(() => resolve({ data: null }), 4000)
              ),
            ]);
            profile = pData;
          } catch (_) {}

          if (!isMounted) return;
          const fn = profile?.first_name || user.user_metadata?.full_name || '';
          if (fn) setUserFirstName(fn.split(' ')[0]);

          const finalProfile = buildProfileData(profile, user, fn);
          setCompletedProfile(finalProfile);
          try {
            await AsyncStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(finalProfile));
            await AsyncStorage.setItem(STORAGE_ONBOARDING_COMPLETED_KEY, 'true');
          } catch (_) {}
          sessionHandledRef.current = true;
          setActiveScreen('home');
        }
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const handleAccountCreated = useCallback((firstName: string) => {
    setUserFirstName(firstName);
    setActiveScreen('quiz');
  }, []);

  const handleLoginSuccess = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setActiveScreen('auth');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      const fn = profile?.first_name || user.user_metadata?.full_name || '';
      if (fn) setUserFirstName(fn.split(' ')[0]);

      // Populate completed profile and take existing user straight to home
      setCompletedProfile(buildProfileData(profile, user, fn));
      setActiveScreen('home');

      // Ensure profile is marked completed in DB
      if (user.id && !profile?.has_completed_onboarding) {
        supabase
          .from('profiles')
          .update({ has_completed_onboarding: true, updated_at: new Date().toISOString() })
          .eq('id', user.id)
          .then();
      }
    } catch {
      setActiveScreen('home');
    }
  }, []);

  const handleFlowCompleted = useCallback((answers: OnboardingAnswers) => {
    setCompletedProfile(answers);
    try {
      AsyncStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(answers));
      AsyncStorage.setItem(STORAGE_ONBOARDING_COMPLETED_KEY, 'true');
    } catch (_) {}
    setActiveScreen('home');
  }, []);

  const handleRetakeQuiz = useCallback(() => {
    setActiveScreen('quiz');
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign out error:', err);
    }
    setCompletedProfile(null);
    setUserFirstName('');
    setActiveScreen('auth');
  }, []);

  if (!fontsLoaded || activeScreen === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // If user is on standard web browser and hasn't installed/unlocked yet, show welcome gate
  if (!isInstalledApp) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <PwaWelcomeGate onEnterApp={() => setIsInstalledApp(true)} />
      </SafeAreaProvider>
    );
  }

  return (
    <LanguageProvider>
      <SubscriptionProvider>
        <SafeAreaProvider>
          <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

          {activeScreen === 'auth' && (
            <AuthScreen
              onAccountCreated={handleAccountCreated}
              onLoginSuccess={handleLoginSuccess}
            />
          )}

          {activeScreen === 'quiz' && (
            <OnboardingQuizScreen
              firstName={userFirstName}
              onFlowCompleted={handleFlowCompleted}
            />
          )}

          {activeScreen === 'home' && (
            <HomeScreen
              answers={completedProfile}
              onRetakeQuiz={handleRetakeQuiz}
              onSignOut={handleSignOut}
            />
          )}
        </SafeAreaProvider>
      </SubscriptionProvider>
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
