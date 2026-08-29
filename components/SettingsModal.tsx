import React, { useState, useCallback } from "react";
import {
  StyleSheet, View, Text, ScrollView, Pressable,
  Modal, Switch, Platform, Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import {
  X, User, Bell, Shield, FileText, ChevronRight,
  RotateCcw, LogOut, Compass, Heart, Leaf, Moon,
  Volume2, Lock, ExternalLink, Trash2, CheckCircle2,
  Clock, Activity, Sparkles, Info, Tag, Globe, Crown,
} from "lucide-react-native";
import { colors } from "../theme/colors";
import { fontFamilies } from "../theme/typography";
import { setSoundEffectsEnabled, setHapticsEnabled } from "../lib/audioManager";
import { UserProfile } from "../hooks/useUserData";
import { LegalDocumentModal, LegalDocType } from "./LegalDocumentModal";
import { useLanguage } from "../context/LanguageContext";
import { SUPPORTED_LANGUAGES } from "../types/i18n";
import { useSubscription } from "../context/SubscriptionContext";

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onSignOut?: () => void;
  onRetakeQuiz?: () => void;
  onReplayTour?: () => void;
  userProfile: UserProfile;
  codeCopied?: boolean;
  onCopyCode?: () => void;
  onDeleteAccount?: () => void;
}

function SectionHeader({ label, icon: Icon, color = colors.primary }: { label: string; icon?: React.ElementType; color?: string }) {
  return (
    <View style={sStyles.sectionHeader}>
      {Icon && (
        <View style={[sStyles.sectionIconWrap, { backgroundColor: `${color}18` }]}>
          <Icon size={12} color={color} strokeWidth={2.5} />
        </View>
      )}
      <Text style={[sStyles.sectionHeaderText, { color }]}>{label}</Text>
    </View>
  );
}

function SettingToggle({
  label, sublabel, value, onToggle, icon: Icon, iconColor = colors.primary,
}: {
  label: string; sublabel?: string; value: boolean; onToggle: (v: boolean) => void;
  icon?: React.ElementType; iconColor?: string;
}) {
  return (
    <View style={sStyles.settingRow}>
      {Icon && (
        <View style={[sStyles.settingRowIconWrap, { backgroundColor: `${iconColor}15` }]}>
          <Icon size={16} color={iconColor} strokeWidth={2.2} />
        </View>
      )}
      <View style={sStyles.settingRowTextWrap}>
        <Text style={sStyles.settingRowLabel}>{label}</Text>
        {sublabel ? <Text style={sStyles.settingRowSublabel}>{sublabel}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: "rgba(101,78,60,0.15)", true: colors.primary }}
        thumbColor={Platform.OS === "android" ? (value ? "#FFFFFF" : "#FAF8F5") : "#FFFFFF"}
        ios_backgroundColor="rgba(101,78,60,0.15)"
      />
    </View>
  );
}

function SettingAction({
  label, sublabel, onPress, icon: Icon, iconColor = colors.primary, destructive, rightLabel,
}: {
  label: string; sublabel?: string; onPress: () => void;
  icon?: React.ElementType; iconColor?: string; destructive?: boolean; rightLabel?: string;
}) {
  return (
    <Pressable style={({ pressed }) => [sStyles.settingRow, pressed && { opacity: 0.7 }]} onPress={onPress}>
      {Icon && (
        <View style={[sStyles.settingRowIconWrap, { backgroundColor: destructive ? "rgba(201,70,91,0.12)" : `${iconColor}15` }]}>
          <Icon size={16} color={destructive ? colors.error : iconColor} strokeWidth={2.2} />
        </View>
      )}
      <View style={sStyles.settingRowTextWrap}>
        <Text style={[sStyles.settingRowLabel, destructive && { color: colors.error }]}>{label}</Text>
        {sublabel ? <Text style={sStyles.settingRowSublabel}>{sublabel}</Text> : null}
      </View>
      {rightLabel
        ? <Text style={sStyles.settingRightLabel}>{rightLabel}</Text>
        : <ChevronRight size={14} color={destructive ? colors.error : colors.textTertiary} strokeWidth={2} />
      }
    </Pressable>
  );
}

function SettingsCard({ children }: { children: React.ReactNode }) {
  return <View style={sStyles.settingsCard}>{children}</View>;
}

export function SettingsModal({
  visible, onClose, onSignOut, onRetakeQuiz, onReplayTour,
  userProfile, codeCopied, onCopyCode, onDeleteAccount,
}: SettingsModalProps) {
  const [notifWorkout, setNotifWorkout] = useState(true);
  const [notifMorning, setNotifMorning] = useState(true);
  const [notifWeekly, setNotifWeekly] = useState(true);
  const [notifPhase, setNotifPhase] = useState(true);
  const [soundMilestone, setSoundMilestone] = useState(true);
  const [soundAmbient, setSoundAmbient] = useState(false);
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [adaptiveRecs, setAdaptiveRecs] = useState(true);
  const [cycleSync, setCycleSync] = useState(true);
  const [restDayInsights, setRestDayInsights] = useState(true);
  const [analyticsOptIn, setAnalyticsOptIn] = useState(true);
  const [crashReports, setCrashReports] = useState(true);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [activeDoc, setActiveDoc] = useState<LegalDocType | null>(null);
  const [langPickerVisible, setLangPickerVisible] = useState(false);

  const { language, setLanguage, languageOptions } = useLanguage();
  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];

  const {
    isTrialActive,
    isSubscribed,
    isPaused,
    trialDaysRemaining,
    trialDayNumber,
    openPaywall,
    setDevSubscriptionOverride,
  } = useSubscription();

  const haptic = useCallback(() => {
    try { if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (_) {}
  }, []);

  const monogram = userProfile.monogram || "?";
  const fullName = userProfile.fullName || "Member";
  const email = userProfile.email || "";
  const cadence = userProfile.weeklyFrequency || "3-4 days";
  const sessionWindow = userProfile.timeCommitment
    ? userProfile.timeCommitment.replace("_", " ")
    : "15-30 min";

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={sStyles.backdrop}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={sStyles.sheet}>
          <View style={sStyles.handleBar} />

          <LinearGradient
            colors={["#F5D5DC", "#EDE3D5"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={sStyles.heroHeader}
          >
            <Pressable style={sStyles.closeBtn} onPress={onClose} hitSlop={10}>
              <X size={18} color={colors.textPrimary} strokeWidth={2.2} />
            </Pressable>
            <LinearGradient
              colors={["#F39EB0", "#C9465B"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={sStyles.avatarRing}
            >
              <View style={sStyles.avatar}>
                <Text style={sStyles.avatarText}>{monogram}</Text>
              </View>
            </LinearGradient>
            <Text style={sStyles.heroName}>{fullName}</Text>
            {email ? <Text style={sStyles.heroEmail}>{email}</Text> : null}

            <View style={sStyles.statsPillRow}>
              <View style={sStyles.statsPill}>
                <Clock size={11} color={colors.primary} />
                <Text style={sStyles.statsPillLabel}>CADENCE</Text>
                <Text style={sStyles.statsPillVal}>{cadence}</Text>
              </View>
              <View style={sStyles.statsPillDivider} />
              <View style={sStyles.statsPill}>
                <Activity size={11} color={colors.sageDark} />
                <Text style={sStyles.statsPillLabel}>SESSION</Text>
                <Text style={sStyles.statsPillVal}>{sessionWindow}</Text>
              </View>
              {userProfile.isEmailVerified ? (
                <>
                  <View style={sStyles.statsPillDivider} />
                  <View style={sStyles.statsPill}>
                    <CheckCircle2 size={11} color={colors.sageDark} />
                    <Text style={[sStyles.statsPillVal, { color: colors.sageDark }]}>VERIFIED</Text>
                  </View>
                </>
              ) : null}
            </View>
          </LinearGradient>

          <ScrollView style={sStyles.scrollBody} contentContainerStyle={sStyles.scrollContent} showsVerticalScrollIndicator={false}>
            {userProfile.isEmailVerified && (
              <View style={sStyles.rewardCard}>
                <View style={sStyles.rewardCardHeader}>
                  <Sparkles size={13} color={colors.rose} />
                  <Text style={sStyles.rewardCardKicker}>MEMBER BENEFIT ACTIVE</Text>
                </View>
                <Text style={sStyles.rewardCardTitle}>5% Store Discount Unlocked</Text>
                <Text style={sStyles.rewardCardDesc}>
                  Your verified email grants 5% off all upcoming FortyWell store drops and gear.
                </Text>
                <Pressable style={sStyles.promoCodeBox} onPress={onCopyCode} accessibilityRole="button">
                  <Text style={sStyles.promoCodeText}>FORTY5</Text>
                  <View style={sStyles.promoCodeTag}>
                    <Text style={sStyles.promoCodeTagText}>{codeCopied ? "Copied! ✓" : "Tap to Copy"}</Text>
                  </View>
                </Pressable>
              </View>
            )}

            <SectionHeader label="MEMBERSHIP & ACCESS" icon={Crown} color={colors.primaryDark} />
            <SettingsCard>
              {/* ── Status ── */}
              <View style={sStyles.membershipStatusHeader}>
                <View style={sStyles.statusIndicatorRow}>
                  <View style={[
                    sStyles.statusDot,
                    isSubscribed ? sStyles.statusDotSubscribed : isPaused ? sStyles.statusDotPaused : sStyles.statusDotTrial,
                  ]} />
                  <Text style={sStyles.statusKicker}>
                    {isSubscribed
                      ? "ACTIVE SUBSCRIBER"
                      : isPaused
                      ? "TRIAL EXPIRED · PAUSED"
                      : `7-DAY FREE TRIAL · DAY ${trialDayNumber}`}
                  </Text>
                </View>
                <Text style={sStyles.statusTitle}>
                  {isSubscribed
                    ? "Full Access Member"
                    : isPaused
                    ? "Read-Only Mode Active"
                    : `${trialDaysRemaining} day${trialDaysRemaining !== 1 ? "s" : ""} remaining`}
                </Text>
                <Text style={sStyles.statusDesc}>
                  {isSubscribed
                    ? "All daily workouts, AI coach guidance, and cycle rhythm tracking active."
                    : isPaused
                    ? "Your Garden & past logs are preserved. Subscribe to resume new sessions."
                    : "Enjoy full access during your free trial. Subscribe anytime to continue."}
                </Text>
              </View>

              {/* ── Actions ── */}
              {!isSubscribed && (
                <>
                  <View style={sStyles.rowDivider} />
                  <Pressable
                    style={({ pressed }) => [
                      sStyles.subscribeNowBtn,
                      pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
                    ]}
                    onPress={() => {
                      haptic();
                      onClose();
                      openPaywall("settings_subscribe");
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="View subscription options"
                  >
                    <LinearGradient
                      colors={[colors.primary, colors.primaryDark]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={sStyles.subscribeNowGradient}
                    >
                      <Crown size={15} color="#FFFFFF" strokeWidth={2.2} />
                      <Text style={sStyles.subscribeNowText}>
                        {isPaused ? "Subscribe & Restore Access" : "View Subscription Options"}
                      </Text>
                    </LinearGradient>
                  </Pressable>
                </>
              )}

              {isSubscribed && (
                <>
                  <View style={sStyles.rowDivider} />
                  <Pressable
                    style={sStyles.settingRow}
                    onPress={() => {
                      haptic();
                      Linking.openURL("https://app.lemonsqueezy.com/my-orders");
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Manage or cancel subscription"
                  >
                    <View style={[sStyles.settingRowIconWrap, { backgroundColor: "rgba(101,78,60,0.08)" }]}>
                      <ExternalLink size={17} color={colors.textSecondary} strokeWidth={2} />
                    </View>
                    <View style={sStyles.settingRowTextWrap}>
                      <Text style={sStyles.settingRowLabel}>Manage Subscription</Text>
                      <Text style={sStyles.settingRowSublabel}>Pause, upgrade, or cancel via Lemon Squeezy portal</Text>
                    </View>
                    <ChevronRight size={17} color={colors.textTertiary} strokeWidth={2} />
                  </Pressable>
                </>
              )}
            </SettingsCard>

            <SectionHeader label="PERSONALIZATION" icon={Leaf} color={colors.sageDark} />
            <SettingsCard>
              <SettingToggle label="AI-Adaptive Recommendations" sublabel="Tailors workouts daily to your cycle phase and energy level" value={adaptiveRecs} onToggle={(v) => { haptic(); setAdaptiveRecs(v); }} icon={Sparkles} iconColor={colors.primary} />
              <View style={sStyles.rowDivider} />
              <SettingToggle label="Cycle Phase Sync" sublabel="Aligns movement protocols to your hormonal flow" value={cycleSync} onToggle={(v) => { haptic(); setCycleSync(v); }} icon={Moon} iconColor={colors.rose} />
              <View style={sStyles.rowDivider} />
              <SettingToggle label="Rest Day Insights" sublabel="Recovery and cortisol reduction micro-guides on rest days" value={restDayInsights} onToggle={(v) => { haptic(); setRestDayInsights(v); }} icon={Heart} iconColor={colors.peach} />
              <View style={sStyles.rowDivider} />
              <SettingAction label="Recalibrate Protocol and Quiz" sublabel="Update your phase, goals, and movement preferences" icon={RotateCcw} iconColor={colors.sageDark} onPress={() => { onClose(); onRetakeQuiz?.(); }} />
            </SettingsCard>

            <SectionHeader label="NOTIFICATIONS" icon={Bell} color={colors.primary} />
            <SettingsCard>
              <SettingToggle label="Daily Morning Ritual Prompt" sublabel="A gentle nudge to begin your anchor routine" value={notifMorning} onToggle={(v) => { haptic(); setNotifMorning(v); }} icon={Bell} iconColor={colors.primary} />
              <View style={sStyles.rowDivider} />
              <SettingToggle label="Workout Reminders" sublabel="Notify me when a scheduled session is ready" value={notifWorkout} onToggle={(v) => { haptic(); setNotifWorkout(v); }} icon={Activity} iconColor={colors.rose} />
              <View style={sStyles.rowDivider} />
              <SettingToggle label="Cycle Phase Change Alerts" sublabel="Know when your phase shifts so you can adapt your movement" value={notifPhase} onToggle={(v) => { haptic(); setNotifPhase(v); }} icon={Moon} iconColor={colors.sageDark} />
              <View style={sStyles.rowDivider} />
              <SettingToggle label="Weekly Recap Summary" sublabel="Every Monday: review your progress and plan the week ahead" value={notifWeekly} onToggle={(v) => { haptic(); setNotifWeekly(v); }} icon={CheckCircle2} iconColor={colors.peach} />
            </SettingsCard>

            <SectionHeader label="SOUND AND HAPTICS" icon={Volume2} color={colors.rose} />
            <SettingsCard>
              <SettingToggle
                label="Milestone Sound Effects"
                sublabel="Celebratory audio cue when finishing workouts and streaks"
                value={soundMilestone}
                onToggle={(v) => {
                  haptic();
                  setSoundMilestone(v);
                  setSoundEffectsEnabled(v);
                }}
                icon={Volume2}
                iconColor={colors.rose}
              />
              <View style={sStyles.rowDivider} />
              <SettingToggle
                label="Ambient Workout Audio"
                sublabel="Soft nature soundscape during active sessions"
                value={soundAmbient}
                onToggle={(v) => {
                  haptic();
                  setSoundAmbient(v);
                }}
                icon={Leaf}
                iconColor={colors.sageDark}
              />
              <View style={sStyles.rowDivider} />
              <SettingToggle
                label="Haptic Feedback"
                sublabel="Tactile response on interactions and progress events"
                value={hapticFeedback}
                onToggle={(v) => {
                  setHapticFeedback(v);
                  setHapticsEnabled(v);
                  if (v) haptic();
                }}
                icon={Info}
                iconColor={colors.primary}
              />
            </SettingsCard>

            <SectionHeader label="APP EXPERIENCE" icon={Compass} color={colors.primary} />
            <SettingsCard>
              <SettingAction
                label="App Language"
                sublabel={`${currentLang.flag}  ${currentLang.nativeLabel}`}
                icon={Globe}
                iconColor={colors.primary}
                onPress={() => { haptic(); setLangPickerVisible(true); }}
                rightLabel={currentLang.flag}
              />
              <View style={sStyles.rowDivider} />
              <SettingAction label="Take the Guided App Tour" sublabel="Rediscover every feature with a curated walkthrough" icon={Compass} iconColor={colors.primary} onPress={() => { onClose(); onReplayTour?.(); }} />
              <View style={sStyles.rowDivider} />
              <SettingAction label="App Version" sublabel="FortyWell PWA" icon={Info} iconColor={colors.textTertiary} onPress={() => {}} rightLabel="1.0.0" />
            </SettingsCard>

            <SectionHeader label="PRIVACY AND DATA" icon={Shield} color={colors.sageDark} />
            <SettingsCard>
              <SettingToggle label="Anonymous Analytics" sublabel="Help improve FortyWell by sharing anonymous usage patterns" value={analyticsOptIn} onToggle={(v) => { haptic(); setAnalyticsOptIn(v); }} icon={Shield} iconColor={colors.sageDark} />
              <View style={sStyles.rowDivider} />
              <SettingToggle label="Crash Reports" sublabel="Automatically send error reports to help us fix issues faster" value={crashReports} onToggle={(v) => { haptic(); setCrashReports(v); }} icon={Activity} iconColor={colors.textTertiary} />
              <View style={sStyles.rowDivider} />
              <SettingAction
                label="Privacy Policy"
                sublabel="How we collect, store, and protect your data"
                icon={Lock}
                iconColor={colors.sageDark}
                onPress={() => {
                  haptic();
                  setActiveDoc("privacy");
                }}
              />
              <View style={sStyles.rowDivider} />
              <SettingAction
                label="Terms of Service"
                sublabel="Your rights and responsibilities as a member"
                icon={FileText}
                iconColor={colors.sageDark}
                onPress={() => {
                  haptic();
                  setActiveDoc("terms");
                }}
              />
              <View style={sStyles.rowDivider} />
              <SettingAction
                label="Data Deletion Request"
                sublabel="Request a full export or permanent deletion of your data"
                icon={ExternalLink}
                iconColor={colors.textTertiary}
                onPress={() => {
                  Linking.openURL("mailto:privacy@fortywell-app.vercel.app?subject=Data%20Deletion%20Request").catch(() => {});
                }}
              />
            </SettingsCard>

            <SectionHeader label="LEGAL" icon={FileText} color={colors.textTertiary} />
            <SettingsCard>
              <SettingAction
                label="Cookie Policy"
                sublabel="Local storage and functional token transparency"
                icon={FileText}
                iconColor={colors.textTertiary}
                onPress={() => {
                  haptic();
                  setActiveDoc("cookies");
                }}
              />
              <View style={sStyles.rowDivider} />
              <SettingAction
                label="Medical Disclaimer"
                sublabel="FortyWell is not a substitute for professional medical advice"
                icon={Info}
                iconColor={colors.warning}
                onPress={() => {
                  haptic();
                  setActiveDoc("disclaimer");
                }}
              />
              <View style={sStyles.rowDivider} />
              <SettingAction
                label="Open Source Licenses"
                sublabel="Software notices and attribution"
                icon={ExternalLink}
                iconColor={colors.textTertiary}
                onPress={() => {
                  haptic();
                  setActiveDoc("licenses");
                }}
              />
            </SettingsCard>

            <View style={sStyles.disclaimerBanner}>
              <Heart size={14} color={colors.rose} strokeWidth={2} style={{ marginTop: 1 }} />
              <Text style={sStyles.disclaimerText}>
                FortyWell provides wellness and movement guidance, not medical advice. Always consult your healthcare provider before beginning any new exercise program, especially if you have hormonal conditions, injuries, or are pregnant.
              </Text>
            </View>

            <SectionHeader label="ACCOUNT" icon={User} color={colors.error} />
            <SettingsCard>
              {onSignOut && (
                <>
                  <SettingAction label="Sign Out" sublabel="You can sign back in at any time" icon={LogOut} onPress={() => { onClose(); onSignOut(); }} destructive />
                  <View style={sStyles.rowDivider} />
                </>
              )}
              <SettingAction label="Delete Account" sublabel="Permanently removes all your data from FortyWell" icon={Trash2} onPress={() => setDeleteConfirmVisible(true)} destructive />
            </SettingsCard>

            <View style={sStyles.footer}>
              <Text style={sStyles.footerLogo}>FortyWell</Text>
              <Text style={sStyles.footerTagline}>Move with your cycle, not against it.</Text>
              <Text style={sStyles.footerVersion}>Version 1.0.0</Text>
            </View>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>

      {/* ── Language Picker Modal ── */}
      <Modal visible={langPickerVisible} transparent animationType="slide" onRequestClose={() => setLangPickerVisible(false)}>
        <View style={sStyles.confirmBackdrop}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setLangPickerVisible(false)} />
          <View style={[sStyles.confirmCard, { paddingBottom: 24 }]}>
            <Text style={[sStyles.confirmTitle, { marginBottom: 4 }]}>Select Language</Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 16, textAlign: 'center' }}>Choose your preferred language for the app</Text>
            {languageOptions.map((opt, idx) => (
              <Pressable
                key={opt.code}
                onPress={async () => { haptic(); await setLanguage(opt.code); setLangPickerVisible(false); }}
                style={({ pressed }) => [{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  marginBottom: 4,
                  backgroundColor: language === opt.code ? 'rgba(201,70,91,0.09)' : 'transparent',
                  opacity: pressed ? 0.7 : 1,
                }]}
              >
                <Text style={{ fontSize: 22, marginRight: 12 }}>{opt.flag}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: language === opt.code ? colors.primary : colors.textPrimary }}>{opt.nativeLabel}</Text>
                  <Text style={{ fontSize: 12, color: colors.textTertiary, marginTop: 1 }}>{opt.label}</Text>
                </View>
                {language === opt.code && <CheckCircle2 size={18} color={colors.primary} strokeWidth={2.2} />}
              </Pressable>
            ))}
            <Pressable onPress={() => setLangPickerVisible(false)} style={[sStyles.confirmCancelBtn, { marginTop: 8 }]}>
              <Text style={sStyles.confirmCancelBtnText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={deleteConfirmVisible} transparent animationType="fade" onRequestClose={() => setDeleteConfirmVisible(false)}>
        <View style={sStyles.confirmBackdrop}>
          <View style={sStyles.confirmCard}>
            <View style={sStyles.confirmIconWrap}>
              <Trash2 size={26} color={colors.error} strokeWidth={1.8} />
            </View>
            <Text style={sStyles.confirmTitle}>Delete Your Account?</Text>
            <Text style={sStyles.confirmDesc}>
              This will permanently erase all your workouts, progress, garden, and personal data. This action cannot be undone.
            </Text>
            <Pressable style={sStyles.confirmDeleteBtn} onPress={() => { setDeleteConfirmVisible(false); onDeleteAccount?.(); }}>
              <Text style={sStyles.confirmDeleteBtnText}>Yes, Delete Permanently</Text>
            </Pressable>
            <Pressable style={sStyles.confirmCancelBtn} onPress={() => setDeleteConfirmVisible(false)}>
              <Text style={sStyles.confirmCancelBtnText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <LegalDocumentModal
        visible={!!activeDoc}
        docType={activeDoc}
        onClose={() => setActiveDoc(null)}
      />
    </Modal>
  );
}

const sStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(42,35,32,0.65)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: colors.background, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    maxHeight: "92%", minHeight: "55%", overflow: "hidden",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.18, shadowRadius: 22 },
      android: { elevation: 16 }, default: {},
    }),
  },
  handleBar: { width: 40, height: 4, borderRadius: 2, backgroundColor: "rgba(101,78,60,0.22)", alignSelf: "center", marginTop: 10, marginBottom: 0 },
  heroHeader: { paddingTop: 20, paddingBottom: 22, paddingHorizontal: 24, alignItems: "center", position: "relative" },
  closeBtn: { position: "absolute", top: 14, right: 16, width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(255,255,255,0.6)", alignItems: "center", justifyContent: "center" },
  avatarRing: {
    width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", marginBottom: 12,
    ...Platform.select({ ios: { shadowColor: colors.rose, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14 }, android: { elevation: 6 }, default: {} }),
  },
  avatar: { width: 62, height: 62, borderRadius: 31, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 28, fontFamily: fontFamilies.soria, color: colors.primary },
  heroName: { fontSize: 22, fontFamily: fontFamilies.soria, color: colors.textPrimary, fontWeight: "700", marginBottom: 3, letterSpacing: -0.3 },
  heroEmail: { fontSize: 13, fontFamily: fontFamilies.sansRegular, color: colors.textTertiary, marginBottom: 16 },
  statsPillRow: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.55)", borderRadius: 16, paddingVertical: 8, paddingHorizontal: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.75)", gap: 6 },
  statsPill: { flexDirection: "row", alignItems: "center", gap: 5 },
  statsPillDivider: { width: 1, height: 18, backgroundColor: "rgba(101,78,60,0.14)", marginHorizontal: 4 },
  statsPillLabel: { fontSize: 10, fontFamily: fontFamilies.monoMedium, color: colors.textTertiary, letterSpacing: 0.4 },
  statsPillVal: { fontSize: 11, fontFamily: fontFamilies.sansSemiBold, color: colors.textPrimary },
  scrollBody: { flex: 1 },
  scrollContent: { paddingHorizontal: 18, paddingTop: 18 },
  rewardCard: { backgroundColor: "rgba(146,169,117,0.12)", borderWidth: 1.5, borderColor: "rgba(146,169,117,0.32)", borderRadius: 18, padding: 16, marginBottom: 22 },
  rewardCardHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  rewardCardKicker: { fontSize: 10, fontFamily: fontFamilies.monoBold, color: colors.sageDark, letterSpacing: 1.3 },
  rewardCardTitle: { fontSize: 16, fontFamily: fontFamilies.soria, color: colors.textPrimary, fontWeight: "700", marginBottom: 4 },
  rewardCardDesc: { fontSize: 12.5, fontFamily: fontFamilies.sansRegular, color: colors.textSecondary, lineHeight: 18, marginBottom: 12 },
  promoCodeBox: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: "rgba(146,169,117,0.38)", paddingVertical: 10, paddingHorizontal: 14 },
  promoCodeText: { fontSize: 15, fontFamily: fontFamilies.monoBold, color: colors.primaryDark, letterSpacing: 3.5 },
  promoCodeTag: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: colors.sage, borderRadius: 8, paddingVertical: 5, paddingHorizontal: 10 },
  promoCodeTagText: { fontSize: 11, fontFamily: fontFamilies.sansSemiBold, color: "#fff" },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8, marginBottom: 8, paddingHorizontal: 2 },
  sectionIconWrap: { width: 22, height: 22, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  sectionHeaderText: { fontSize: 10.5, fontFamily: fontFamilies.monoBold, letterSpacing: 1.5 },
  membershipStatusHeader: { padding: 16 },
  statusIndicatorRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusDotSubscribed: { backgroundColor: colors.sageDark },
  statusDotPaused: { backgroundColor: colors.primary },
  statusDotTrial: { backgroundColor: "#B87D2B" },
  statusKicker: { fontSize: 10, fontFamily: fontFamilies.monoBold, color: colors.textTertiary, letterSpacing: 1.2 },
  statusTitle: { fontSize: 16, fontFamily: fontFamilies.soria, fontWeight: "700", color: colors.textPrimary, marginBottom: 2 },
  subscribeNowBtn: {
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 14,
    overflow: "hidden",
    ...Platform.select({
      ios: { shadowColor: colors.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6 },
      android: { elevation: 3 },
    }),
  },
  subscribeNowGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  subscribeNowText: {
    fontSize: 13.5,
    fontFamily: fontFamilies.sansSemiBold,
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  settingsCard: {
    backgroundColor: colors.surfaceCard, borderRadius: 18, marginBottom: 14, borderWidth: 1, borderColor: colors.borderSubtle, overflow: "hidden",
    ...Platform.select({ ios: { shadowColor: "#2A2320", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 }, android: { elevation: 2 }, default: {} }),
  },
  settingRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 13, minHeight: 58 },
  settingRowIconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  settingRowTextWrap: { flex: 1, gap: 1 },
  settingRowLabel: { fontSize: 14, fontFamily: fontFamilies.sansSemiBold, color: colors.textPrimary, lineHeight: 20 },
  settingRowSublabel: { fontSize: 11.5, fontFamily: fontFamilies.sansRegular, color: colors.textTertiary, lineHeight: 16 },
  settingRightLabel: { fontSize: 13, fontFamily: fontFamilies.monoMedium, color: colors.textTertiary },
  rowDivider: { height: 1, backgroundColor: colors.borderSubtle, marginHorizontal: 16 },
  disclaimerBanner: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: "rgba(208,120,135,0.08)", borderWidth: 1, borderColor: "rgba(208,120,135,0.2)", borderRadius: 14, padding: 14, marginBottom: 22 },
  disclaimerText: { flex: 1, fontSize: 11.5, fontFamily: fontFamilies.sansRegular, color: colors.textSecondary, lineHeight: 17 },
  footer: { alignItems: "center", paddingVertical: 18, gap: 4 },
  footerLogo: { fontSize: 18, fontFamily: fontFamilies.soria, color: colors.textPrimary, letterSpacing: -0.2 },
  footerTagline: { fontSize: 11.5, fontFamily: fontFamilies.sansRegular, color: colors.textTertiary, letterSpacing: 0.2, fontStyle: "italic" },
  footerVersion: { fontSize: 10, fontFamily: fontFamilies.monoMedium, color: "rgba(154,142,134,0.5)", marginTop: 4, letterSpacing: 0.5 },
  confirmBackdrop: { flex: 1, backgroundColor: "rgba(42,35,32,0.72)", justifyContent: "center", alignItems: "center", paddingHorizontal: 28 },
  confirmCard: { width: "100%", maxWidth: 360, backgroundColor: colors.surfaceCard, borderRadius: 24, padding: 28, alignItems: "center" },
  confirmIconWrap: { width: 60, height: 60, borderRadius: 30, backgroundColor: "rgba(201,70,91,0.1)", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  confirmTitle: { fontSize: 20, fontFamily: fontFamilies.soria, color: colors.textPrimary, fontWeight: "700", marginBottom: 10, textAlign: "center" },
  confirmDesc: { fontSize: 13.5, fontFamily: fontFamilies.sansRegular, color: colors.textSecondary, lineHeight: 20, textAlign: "center", marginBottom: 22 },
  confirmDeleteBtn: { width: "100%", paddingVertical: 14, borderRadius: 14, backgroundColor: colors.error, alignItems: "center", marginBottom: 10 },
  confirmDeleteBtnText: { fontSize: 14, fontFamily: fontFamilies.sansSemiBold, color: "#fff", letterSpacing: 0.3 },
  confirmCancelBtn: { width: "100%", paddingVertical: 13, borderRadius: 14, backgroundColor: colors.surface, alignItems: "center", borderWidth: 1, borderColor: colors.borderSubtle },
  confirmCancelBtnText: { fontSize: 14, fontFamily: fontFamilies.sansSemiBold, color: colors.textSecondary },
});
