import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Linking, Platform, AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserData } from '../hooks/useUserData';
import { supabase } from '../lib/supabase';

const STORAGE_KEY_SUBSCRIPTION = '@fortywell_subscription_status';
const STORAGE_KEY_TRIAL_START = '@fortywell_trial_start_date';

// Standard 7 days in ms
const TRIAL_DURATION_DAYS = 7;
const TRIAL_DURATION_MS = TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000;

function userKey(base: string, userId?: string | null) {
  return userId ? `${base}_${userId}` : base;
}

// Whitelist of test/developer/VIP accounts that are completely immune to paywalls
const PAYWALL_EXEMPT_EMAILS: string[] = [
  'imenoprezimeno324@gmail.com',
];

export interface SubscriptionPricing {
  monthlyPrice: number;
  annualPrice: number;
  monthlyPriceFormatted: string;
  annualPriceFormatted: string;
  annualMonthlyEquivalent: string;
  savingsText: string;
}

export interface SubscriptionContextType {
  // Status flags
  isTrialActive: boolean;
  isSubscribed: boolean;
  isPaused: boolean;
  trialDaysRemaining: number;
  trialDayNumber: number; // 1 to 7
  trialExpiryDate: Date | null;
  
  // Pricing configuration
  pricing: SubscriptionPricing;
  
  // Paywall modal controls
  isPaywallVisible: boolean;
  paywallSource: string | null;
  openPaywall: (source?: string) => void;
  closePaywall: () => void;
  
  // Action Guard: executes callback if active, or triggers Paywall if paused
  guardAction: (action: () => void, actionName?: string) => void;
  
  // Subscription management
  subscribe: (billingInterval: 'monthly' | 'annual') => Promise<void>;
  restoreSubscription: () => Promise<boolean>;
  setDevSubscriptionOverride: (status: 'trial_day_3' | 'trial_day_7' | 'expired_day_8' | 'subscribed' | 'reset') => void;

  // Real-time verification states for checkout
  isAwaitingVerification: boolean;
  isVerifying: boolean;
  verificationMessage: string | null;
  verifySubscriptionStatus: () => Promise<boolean>;
  cancelAwaitingVerification: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userProfile, refreshUserData } = useUserData();
  const [devSubscriptionOverrideState, setDevSubscriptionOverrideState] = useState<boolean | null>(null);
  const [isPaywallVisible, setIsPaywallVisible] = useState<boolean>(false);
  const [paywallSource, setPaywallSource] = useState<string | null>(null);
  const [devDateOverride, setDevDateOverride] = useState<Date | null>(null);
  const [initialTrialStart, setInitialTrialStart] = useState<Date | null>(null);

  // Verification states
  const [isAwaitingVerification, setIsAwaitingVerification] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);

  // Check if current user is an exempt test/VIP account
  const isExemptAccount = useMemo(() => {
    const email = (userProfile?.email || '').trim().toLowerCase();
    return PAYWALL_EXEMPT_EMAILS.some((e) => e.toLowerCase() === email);
  }, [userProfile?.email]);

  // Clean up any legacy un-scoped subscription status from AsyncStorage & localStorage
  useEffect(() => {
    AsyncStorage.removeItem(STORAGE_KEY_SUBSCRIPTION).catch(() => {});
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(STORAGE_KEY_SUBSCRIPTION);
    }
  }, []);

  // Initialize trial start date for CURRENT user & remove any unverified local flags
  useEffect(() => {
    let isCancelled = false;
    async function loadSubscriptionState() {
      if (!userProfile?.id) {
        return;
      }
      try {
        // If profile status is not active in backend, purge any lingering local cache
        if (userProfile.subscriptionStatus !== 'active') {
          const userSubKey = userKey(STORAGE_KEY_SUBSCRIPTION, userProfile.id);
          await AsyncStorage.removeItem(userSubKey).catch(() => {});
        }

        const userTrialKey = userKey(STORAGE_KEY_TRIAL_START, userProfile.id);
        const storedStart = await AsyncStorage.getItem(userTrialKey);
        if (!isCancelled) {
          if (storedStart) {
            setInitialTrialStart(new Date(storedStart));
          } else {
            // Seed from real account creation date so a fresh install
            // doesn't reset the trial. Fall back to 'now' only if unavailable.
            const seedDate =
              userProfile.createdAt && !isNaN(new Date(userProfile.createdAt).getTime())
                ? new Date(userProfile.createdAt)
                : new Date();
            await AsyncStorage.setItem(userTrialKey, seedDate.toISOString());
            setInitialTrialStart(seedDate);
          }
        }
      } catch (_) {}
    }
    loadSubscriptionState();
    return () => {
      isCancelled = true;
    };
  }, [userProfile?.id, userProfile?.createdAt, userProfile?.subscriptionStatus]);

  // Compute effective account creation date
  const accountCreationDate = useMemo(() => {
    if (devDateOverride) return devDateOverride;
    if (userProfile.createdAt) {
      const parsed = new Date(userProfile.createdAt);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return initialTrialStart || new Date();
  }, [devDateOverride, userProfile.createdAt, initialTrialStart]);

  // Determine if active from backend database profile status
  const hasActiveBackendSubscription = useMemo(() => {
    if (isExemptAccount) return true;
    if (userProfile.subscriptionStatus === 'active') {
      if (userProfile.subscriptionEndsAt) {
        return new Date(userProfile.subscriptionEndsAt) > new Date();
      }
      return true;
    }
    return false;
  }, [isExemptAccount, userProfile.subscriptionStatus, userProfile.subscriptionEndsAt]);

  const effectiveIsSubscribed = isExemptAccount || (devSubscriptionOverrideState ?? hasActiveBackendSubscription);

  // If subscription status is explicitly cancelled, expired, or paused from backend
  const isExplicitlyBlocked = useMemo(() => {
    if (isExemptAccount) return false;
    if (
      userProfile.subscriptionStatus === 'cancelled' ||
      userProfile.subscriptionStatus === 'expired' ||
      userProfile.subscriptionStatus === 'paused'
    ) {
      if (userProfile.subscriptionEndsAt) {
        return new Date(userProfile.subscriptionEndsAt) <= new Date();
      }
      return true;
    }
    return false;
  }, [isExemptAccount, userProfile.subscriptionStatus, userProfile.subscriptionEndsAt]);

  // Compute trial status
  const { isTrialActive, trialDaysRemaining, trialDayNumber, trialExpiryDate, isPaused } = useMemo(() => {
    if (isExemptAccount) {
      return {
        isTrialActive: false,
        trialDaysRemaining: 999,
        trialDayNumber: 1,
        trialExpiryDate: new Date('2099-12-31T23:59:59Z'),
        isPaused: false,
      };
    }

    const now = new Date();
    const startTime = accountCreationDate.getTime();
    const endTime = startTime + TRIAL_DURATION_MS;
    const expiryDate = new Date(endTime);

    const msDiff = endTime - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(msDiff / (1000 * 60 * 60 * 24)));
    
    // Day 1 is the first 24h, up to Day 7
    const msElapsed = Math.max(0, now.getTime() - startTime);
    const dayNumber = Math.min(7, Math.max(1, Math.floor(msElapsed / (1000 * 60 * 60 * 24)) + 1));

    const trialActive = msDiff > 0 && !isExplicitlyBlocked;
    const paused = isExplicitlyBlocked || (!trialActive && !effectiveIsSubscribed);

    return {
      isTrialActive: trialActive && !effectiveIsSubscribed,
      trialDaysRemaining: daysRemaining,
      trialDayNumber: dayNumber,
      trialExpiryDate: expiryDate,
      isPaused: paused,
    };
  }, [isExemptAccount, accountCreationDate, effectiveIsSubscribed, isExplicitlyBlocked]);

  // Dynamic pricing configuration
  const pricing: SubscriptionPricing = useMemo(() => {
    return {
      monthlyPrice: 19.99,
      annualPrice: 149.0,
      monthlyPriceFormatted: '$19.99/mo',
      annualPriceFormatted: '$149/year',
      annualMonthlyEquivalent: '$12.42/mo',
      savingsText: 'Save 38% • 2+ months free',
    };
  }, []);

  const openPaywall = useCallback((source?: string) => {
    if (isExemptAccount) return;
    setPaywallSource(source || 'user_action');
    setIsPaywallVisible(true);
  }, [isExemptAccount]);

  const closePaywall = useCallback(() => {
    setIsPaywallVisible(false);
    setPaywallSource(null);
    setIsAwaitingVerification(false);
    setVerificationMessage(null);
  }, []);

  const cancelAwaitingVerification = useCallback(() => {
    setIsAwaitingVerification(false);
    setVerificationMessage(null);
  }, []);

  // Action guard: blocks actions if paused
  const guardAction = useCallback(
    (action: () => void, actionName?: string) => {
      if (isPaused && !isExemptAccount) {
        openPaywall(actionName || 'blocked_action');
        return;
      }
      action();
    },
    [isPaused, isExemptAccount, openPaywall]
  );

  // Official Lemon Squeezy Checkout URL (configured with Annual & Monthly options)
  const LEMON_SQUEEZY_CHECKOUT_BASE = 'https://fortywell.lemonsqueezy.com/checkout/buy/cf21dcb5-7248-41f3-80df-e0e58fb6b62e';

  // Verify status directly from Supabase
  const verifySubscriptionStatus = useCallback(async (): Promise<boolean> => {
    if (!userProfile?.id) return false;
    setIsVerifying(true);
    setVerificationMessage(null);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_status, subscription_ends_at, subscription_plan')
        .eq('id', userProfile.id)
        .maybeSingle();

      if (error) {
        setVerificationMessage('Connection error. Please check your internet connection.');
        setIsVerifying(false);
        return false;
      }

      const status = data?.subscription_status;
      const endsAt = data?.subscription_ends_at;
      const isActive =
        status === 'active' && (!endsAt || new Date(endsAt) > new Date());

      if (isActive) {
        await refreshUserData();
        setIsAwaitingVerification(false);
        setVerificationMessage('Payment verified! Welcome to FortyWell Pro.');
        closePaywall();
        setIsVerifying(false);
        return true;
      } else {
        setVerificationMessage(
          'No active subscription found yet. If you just completed checkout, please wait 5–10 seconds for payment processing and tap check again.'
        );
        setIsVerifying(false);
        return false;
      }
    } catch (e) {
      setVerificationMessage('Verification check failed. Please try again.');
      setIsVerifying(false);
      return false;
    }
  }, [userProfile?.id, refreshUserData, closePaywall]);

  // Auto-check status when app resumes focus from browser checkout
  useEffect(() => {
    if (!isAwaitingVerification) return;

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        setTimeout(() => {
          verifySubscriptionStatus();
        }, 2000);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isAwaitingVerification, verifySubscriptionStatus]);

  // Subscribe via Lemon Squeezy Checkout (Opens checkout, but DOES NOT grant Pro until paid)
  const subscribe = useCallback(
    async (billingInterval: 'monthly' | 'annual') => {
      try {
        // Build checkout URL with customer pre-fill if available
        const params: string[] = [];
        if (userProfile.email) {
          params.push(`checkout[email]=${encodeURIComponent(userProfile.email)}`);
        }
        if (userProfile.fullName && userProfile.fullName !== 'Member') {
          params.push(`checkout[name]=${encodeURIComponent(userProfile.fullName)}`);
        }
        if (userProfile.id) {
          params.push(`checkout[custom][user_id]=${encodeURIComponent(userProfile.id)}`);
        }

        const delimiter = LEMON_SQUEEZY_CHECKOUT_BASE.includes('?') ? '&' : '?';
        const finalCheckoutUrl =
          params.length > 0
            ? `${LEMON_SQUEEZY_CHECKOUT_BASE}${delimiter}${params.join('&')}`
            : LEMON_SQUEEZY_CHECKOUT_BASE;

        setIsAwaitingVerification(true);
        setVerificationMessage(null);

        // Meta Pixel: InitiateCheckout — fires the moment checkout opens
        try {
          if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof (window as any).fbq === 'function') {
            const pixelValue = billingInterval === 'annual' ? 149.0 : 19.99;
            (window as any).fbq('track', 'InitiateCheckout', {
              content_name: 'FortyWell Subscription',
              content_category: billingInterval === 'annual' ? 'Annual Plan' : 'Monthly Plan',
              currency: 'USD',
              value: pixelValue,
            });
          }
        } catch (_) {}

        // Open in browser (in-app on mobile or new tab on web)
        if (Platform.OS === 'web') {
          if (typeof window !== 'undefined') {
            window.open(finalCheckoutUrl, '_blank');
          }
        } else {
          await Linking.openURL(finalCheckoutUrl);
        }
      } catch (e) {
        console.warn('Subscription checkout error:', e);
        setIsAwaitingVerification(false);
      }
    },
    [userProfile]
  );

  const restoreSubscription = useCallback(async (): Promise<boolean> => {
    return await verifySubscriptionStatus();
  }, [verifySubscriptionStatus]);

  // Sandbox testing helper for easy QA/verification
  const setDevSubscriptionOverride = useCallback((status: 'trial_day_3' | 'trial_day_7' | 'expired_day_8' | 'subscribed' | 'reset') => {
    const now = new Date();
    const subKey = userKey(STORAGE_KEY_SUBSCRIPTION, userProfile.id);
    if (status === 'trial_day_3') {
      const past = new Date(now.getTime() - 2.5 * 24 * 60 * 60 * 1000);
      setDevDateOverride(past);
      setDevSubscriptionOverrideState(false);
    } else if (status === 'trial_day_7') {
      const past = new Date(now.getTime() - 6.5 * 24 * 60 * 60 * 1000);
      setDevDateOverride(past);
      setDevSubscriptionOverrideState(false);
    } else if (status === 'expired_day_8') {
      const past = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);
      setDevDateOverride(past);
      setDevSubscriptionOverrideState(false);
      AsyncStorage.removeItem(subKey);
    } else if (status === 'subscribed') {
      setDevSubscriptionOverrideState(true);
      AsyncStorage.setItem(subKey, 'active');
    } else if (status === 'reset') {
      setDevDateOverride(null);
      setDevSubscriptionOverrideState(null);
      AsyncStorage.removeItem(subKey);
    }
  }, [userProfile.id]);

  return (
    <SubscriptionContext.Provider
      value={{
        isTrialActive,
        isSubscribed: effectiveIsSubscribed,
        isPaused,
        trialDaysRemaining,
        trialDayNumber,
        trialExpiryDate,
        pricing,
        isPaywallVisible,
        paywallSource,
        openPaywall,
        closePaywall,
        guardAction,
        subscribe,
        restoreSubscription,
        setDevSubscriptionOverride,
        isAwaitingVerification,
        isVerifying,
        verificationMessage,
        verifySubscriptionStatus,
        cancelAwaitingVerification,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
