import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserData } from '../hooks/useUserData';

const STORAGE_KEY_SUBSCRIPTION = '@fortywell_subscription_status';
const STORAGE_KEY_TRIAL_START = '@fortywell_trial_start_date';

// Standard 7 days in ms
const TRIAL_DURATION_DAYS = 7;
const TRIAL_DURATION_MS = TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000;

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
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userProfile } = useUserData();
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [isPaywallVisible, setIsPaywallVisible] = useState<boolean>(false);
  const [paywallSource, setPaywallSource] = useState<string | null>(null);
  const [devDateOverride, setDevDateOverride] = useState<Date | null>(null);
  const [initialTrialStart, setInitialTrialStart] = useState<Date | null>(null);

  // Initialize trial start date and stored subscription state
  useEffect(() => {
    async function loadSubscriptionState() {
      try {
        const storedSub = await AsyncStorage.getItem(STORAGE_KEY_SUBSCRIPTION);
        if (storedSub === 'active') {
          setIsSubscribed(true);
        }

        const storedStart = await AsyncStorage.getItem(STORAGE_KEY_TRIAL_START);
        if (storedStart) {
          setInitialTrialStart(new Date(storedStart));
        } else {
          const now = new Date();
          await AsyncStorage.setItem(STORAGE_KEY_TRIAL_START, now.toISOString());
          setInitialTrialStart(now);
        }
      } catch (_) {}
    }
    loadSubscriptionState();
  }, []);

  // Compute effective account creation date
  const accountCreationDate = useMemo(() => {
    if (devDateOverride) return devDateOverride;
    if (userProfile.createdAt) {
      const parsed = new Date(userProfile.createdAt);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return initialTrialStart || new Date();
  }, [devDateOverride, userProfile.createdAt, initialTrialStart]);

  // Compute trial status
  const { isTrialActive, trialDaysRemaining, trialDayNumber, trialExpiryDate, isPaused } = useMemo(() => {
    const now = new Date();
    const startTime = accountCreationDate.getTime();
    const endTime = startTime + TRIAL_DURATION_MS;
    const expiryDate = new Date(endTime);

    const msDiff = endTime - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(msDiff / (1000 * 60 * 60 * 24)));
    
    // Day 1 is the first 24h, up to Day 7
    const msElapsed = Math.max(0, now.getTime() - startTime);
    const dayNumber = Math.min(7, Math.max(1, Math.floor(msElapsed / (1000 * 60 * 60 * 24)) + 1));

    const trialActive = msDiff > 0;
    const paused = !trialActive && !isSubscribed;

    return {
      isTrialActive: trialActive,
      trialDaysRemaining: daysRemaining,
      trialDayNumber: dayNumber,
      trialExpiryDate: expiryDate,
      isPaused: paused,
    };
  }, [accountCreationDate, isSubscribed]);

  // Dynamic pricing calculation (Single Plan: $19.99/mo or $149/yr)
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
    setPaywallSource(source || 'user_action');
    setIsPaywallVisible(true);
  }, []);

  const closePaywall = useCallback(() => {
    setIsPaywallVisible(false);
    setPaywallSource(null);
  }, []);

  // Action guard: blocks actions if paused
  const guardAction = useCallback(
    (action: () => void, actionName?: string) => {
      if (isPaused) {
        openPaywall(actionName || 'blocked_action');
        return;
      }
      action();
    },
    [isPaused, openPaywall]
  );

  // Official Lemon Squeezy Checkout URL (configured with Annual & Monthly options)
  const LEMON_SQUEEZY_CHECKOUT_BASE = 'https://fortywell.lemonsqueezy.com/checkout/buy/3f039828-d006-4d16-8366-97bf8eb733fa';

  // Subscribe via Lemon Squeezy Checkout
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

        // Open in browser (in-app on mobile or new tab on web)
        if (Platform.OS === 'web') {
          if (typeof window !== 'undefined') {
            window.open(finalCheckoutUrl, '_blank');
          }
        } else {
          await Linking.openURL(finalCheckoutUrl);
        }

        // Keep state responsive for the user
        await AsyncStorage.setItem(STORAGE_KEY_SUBSCRIPTION, 'active');
        setIsSubscribed(true);
        closePaywall();
      } catch (e) {
        console.warn('Subscription checkout error:', e);
      }
    },
    [userProfile, closePaywall]
  );

  const restoreSubscription = useCallback(async (): Promise<boolean> => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY_SUBSCRIPTION);
      if (stored === 'active') {
        setIsSubscribed(true);
        return true;
      }
      return false;
    } catch (_) {
      return false;
    }
  }, []);

  // Sandbox testing helper for easy QA/verification
  const setDevSubscriptionOverride = useCallback((status: 'trial_day_3' | 'trial_day_7' | 'expired_day_8' | 'subscribed' | 'reset') => {
    const now = new Date();
    if (status === 'trial_day_3') {
      const past = new Date(now.getTime() - 2.5 * 24 * 60 * 60 * 1000);
      setDevDateOverride(past);
      setIsSubscribed(false);
    } else if (status === 'trial_day_7') {
      const past = new Date(now.getTime() - 6.5 * 24 * 60 * 60 * 1000);
      setDevDateOverride(past);
      setIsSubscribed(false);
    } else if (status === 'expired_day_8') {
      const past = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);
      setDevDateOverride(past);
      setIsSubscribed(false);
      AsyncStorage.removeItem(STORAGE_KEY_SUBSCRIPTION);
    } else if (status === 'subscribed') {
      setIsSubscribed(true);
      AsyncStorage.setItem(STORAGE_KEY_SUBSCRIPTION, 'active');
    } else if (status === 'reset') {
      setDevDateOverride(null);
      setIsSubscribed(false);
      AsyncStorage.removeItem(STORAGE_KEY_SUBSCRIPTION);
    }
  }, []);

  return (
    <SubscriptionContext.Provider
      value={{
        isTrialActive,
        isSubscribed,
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
