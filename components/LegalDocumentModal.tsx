import React from "react";
import {
  StyleSheet,
  View,
  Text,
  Modal,
  ScrollView,
  Pressable,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { X, Shield, FileText, Heart, Lock, ExternalLink, Sparkles, Check } from "lucide-react-native";
import { colors } from "../theme/colors";
import { fontFamilies } from "../theme/typography";

export type LegalDocType = "privacy" | "terms" | "cookies" | "disclaimer" | "licenses";

interface LegalDocumentModalProps {
  visible: boolean;
  docType: LegalDocType | null;
  onClose: () => void;
}

interface DocContent {
  title: string;
  subtitle: string;
  badge: string;
  icon: React.ElementType;
  iconColor: string;
  lastUpdated: string;
  sections: { heading: string; body: string }[];
}

const LEGAL_DOCS: Record<LegalDocType, DocContent> = {
  privacy: {
    title: "Privacy Policy",
    subtitle: "How FortyWell collects, encrypts, and protects your personal health and quiz data.",
    badge: "GDPR & CCPA COMPLIANT",
    icon: Lock,
    iconColor: colors.sageDark,
    lastUpdated: "August 2026",
    sections: [
      {
        heading: "1. Overview & Commitment",
        body: "At FortyWell, we believe your health journey and biological data are deeply personal. We design our systems with strict privacy-by-design principles, end-to-end encryption for health metrics, and zero data selling to third-party advertisers.",
      },
      {
        heading: "2. Information We Collect",
        body: "• Account Information: Name, email address, and authentication credentials.\n• Quiz & Onboarding Answers: Age bracket, energy baseline, weekly frequency, training location, equipment access, joint sensitivities (e.g. knees, hips), and wellness goals.\n• Movement & Logging Data: Completed sessions, session volume, duration, and feelings/energy check-ins.",
      },
      {
        heading: "3. How Your Information Is Used",
        body: "We process your information exclusively to:\n• Calibrate and personalize your weekly movement protocols and rest recommendations.\n• Adapt exercise complexity to your reported joint sensitivities.\n• Provide cycle-synced insights and hormonal recovery guidance.\n• Maintain secure user sessions and provide customer support.",
      },
      {
        heading: "4. Health Data Protection & Storage",
        body: "Your data is stored securely in encrypted PostgreSQL databases with Row Level Security (RLS) policies. Only you have access to your personal workout logs and health check-ins.",
      },
      {
        heading: "5. Your Rights (GDPR & CCPA)",
        body: "You maintain full control over your data at all times. You have the right to:\n• Access and export a full copy of your data.\n• Correct or recalibrate your quiz profile.\n• Permanently delete your account and all associated records with one tap.",
      },
      {
        heading: "6. Contact Privacy Team",
        body: "For questions or formal data requests, contact our Data Protection Officer at privacy@fortywell-app.vercel.app.",
      },
    ],
  },
  terms: {
    title: "Terms of Service",
    subtitle: "Terms and conditions governing your use of the FortyWell application and services.",
    badge: "MEMBERSHIP AGREEMENT",
    icon: FileText,
    iconColor: colors.primary,
    lastUpdated: "August 2026",
    sections: [
      {
        heading: "1. Agreement to Terms",
        body: "By creating an account or accessing the FortyWell application, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, please do not use the application.",
      },
      {
        heading: "2. Wellness Platform Scope",
        body: "FortyWell provides movement guidance, somatic coaching, and cortisol-conscious wellness recommendations tailored for women 40+. FortyWell is NOT a medical clinic, pharmacy, or diagnostic healthcare provider.",
      },
      {
        heading: "3. Account Security",
        body: "You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized access.",
      },
      {
        heading: "4. Acceptable Use",
        body: "You agree to use FortyWell solely for personal, non-commercial health and wellness purposes. You may not reverse-engineer, scrape, or distribute proprietary workout protocols without written permission.",
      },
      {
        heading: "5. Intellectual Property",
        body: "All workout plans, illustrations, editorial content, software code, and trademarks are the exclusive property of FortyWell. All rights reserved.",
      },
      {
        heading: "6. Limitation of Liability",
        body: "To the maximum extent permitted by law, FortyWell and its instructors are not liable for any injuries, adverse health events, or damages arising from the use of the platform.",
      },
    ],
  },
  cookies: {
    title: "Cookie & Storage Policy",
    subtitle: "Information regarding local storage, session cookies, and app performance caching.",
    badge: "TRANSPARENT TRACKING",
    icon: FileText,
    iconColor: colors.peach,
    lastUpdated: "August 2026",
    sections: [
      {
        heading: "1. What We Store",
        body: "FortyWell uses local application storage (AsyncStorage / browser local storage) and essential session tokens to ensure instant, offline-capable app performance.",
      },
      {
        heading: "2. Essential Storage Tokens",
        body: "• Authentication Token: Keeps you securely logged in across app restarts.\n• Offline Plan Cache: Stores your current week's workout schedule so you can train with zero network latency.\n• User Preferences: Remembers your sound, haptics, and guided tour settings.",
      },
      {
        heading: "3. Analytics & Telemetry",
        body: "If enabled in Settings, we use privacy-friendly anonymous analytics to detect bugs, crashes, and screen rendering speeds. We never track your personal browsing history across external websites.",
      },
      {
        heading: "4. Managing Your Preferences",
        body: "You can toggle anonymous telemetry and crash reporting at any time under Settings → Privacy and Data.",
      },
    ],
  },
  disclaimer: {
    title: "Medical & Clinical Disclaimer",
    subtitle: "Crucial health, movement, and wellness safety guidelines for FortyWell members.",
    badge: "SAFETY MANDATE",
    icon: Heart,
    iconColor: colors.rose,
    lastUpdated: "August 2026",
    sections: [
      {
        heading: "1. Not Medical Advice",
        body: "The content, routines, and educational materials provided in FortyWell are for informational and general wellness purposes only. They are not intended as medical advice, diagnosis, treatment, or rehabilitation for any injury or medical condition.",
      },
      {
        heading: "2. Physician Consultation",
        body: "Always consult your physician, physical therapist, or qualified healthcare professional before starting any new exercise routine, particularly if you have cardiovascular conditions, joint replacements, pelvic floor disorders, severe osteoporosis, or are recovering from surgery.",
      },
      {
        heading: "3. Listen to Your Body",
        body: "Movement should feel nourishing, not painful. If you experience sharp pain, dizziness, shortness of breath, joint inflammation, or unexpected nausea, stop immediately and seek medical evaluation.",
      },
      {
        heading: "4. Perimenopause & Hormone Considerations",
        body: "Biological shifts during perimenopause and menopause can affect joint laxity, tissue recovery times, and cortisol sensitivity. Adjust training loads to match your daily energy baseline.",
      },
    ],
  },
  licenses: {
    title: "Open Source Licenses",
    subtitle: "Attribution and acknowledgments for open source technologies powering FortyWell.",
    badge: "SOFTWARE NOTICES",
    icon: ExternalLink,
    iconColor: colors.sageDark,
    lastUpdated: "August 2026",
    sections: [
      {
        heading: "React Native & React",
        body: "Copyright (c) Meta Platforms, Inc. and affiliates. Licensed under the MIT License.",
      },
      {
        heading: "Expo SDK Ecosystem",
        body: "Copyright (c) 650 Industries, Inc. Licensed under the MIT License.",
      },
      {
        heading: "Lucide Icons",
        body: "Copyright (c) Lucide Project contributors. Licensed under the ISC License.",
      },
      {
        heading: "React Native Reanimated",
        body: "Copyright (c) Software Mansion S.A. Licensed under the MIT License.",
      },
      {
        heading: "Supabase JS Client",
        body: "Copyright (c) Supabase, Inc. Licensed under the Apache License 2.0.",
      },
      {
        heading: "Google Fonts (Playfair Display, Martian Mono, Work Sans)",
        body: "Licensed under the SIL Open Font License (OFL 1.1).",
      },
    ],
  },
};

export function LegalDocumentModal({
  visible,
  docType,
  onClose,
}: LegalDocumentModalProps) {
  if (!docType || !LEGAL_DOCS[docType]) return null;

  const doc = LEGAL_DOCS[docType];
  const Icon = doc.icon;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

        <View style={styles.sheet}>
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconBox, { backgroundColor: `${doc.iconColor}18` }]}>
                <Icon size={18} color={doc.iconColor} strokeWidth={2.2} />
              </View>
              <View style={styles.headerTextWrap}>
                <View style={styles.badgeRow}>
                  <Text style={[styles.badgeText, { color: doc.iconColor }]}>{doc.badge}</Text>
                  <Text style={styles.dotSeparator}>•</Text>
                  <Text style={styles.dateText}>{doc.lastUpdated}</Text>
                </View>
                <Text style={styles.title}>{doc.title}</Text>
              </View>
            </View>

            <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={10}>
              <X size={18} color={colors.textPrimary} strokeWidth={2.2} />
            </Pressable>
          </View>

          {/* Body */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.subtitle}>{doc.subtitle}</Text>

            <View style={styles.divider} />

            {doc.sections.map((sec, idx) => (
              <View key={idx} style={styles.sectionBlock}>
                <Text style={styles.sectionHeading}>{sec.heading}</Text>
                <Text style={styles.sectionBody}>{sec.body}</Text>
              </View>
            ))}

            <View style={styles.footerCard}>
              <Sparkles size={16} color={colors.rose} />
              <Text style={styles.footerText}>
                FortyWell is designed to nurture your vitality with complete transparency and clinical safety.
              </Text>
            </View>

            <Pressable style={styles.doneBtn} onPress={onClose}>
              <LinearGradient
                colors={["#F39EB0", "#C9465B"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.doneGradient}
              >
                <Check size={16} color="#FFFFFF" strokeWidth={2.5} />
                <Text style={styles.doneBtnText}>Understood & Close</Text>
              </LinearGradient>
            </Pressable>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(35, 25, 20, 0.65)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FAF8F5",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "88%",
    minHeight: "65%",
    overflow: "hidden",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.18, shadowRadius: 20 },
      android: { elevation: 20 },
      default: {},
    }),
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(101, 78, 60, 0.2)",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(101, 78, 60, 0.08)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextWrap: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  badgeText: {
    fontSize: 9,
    fontFamily: fontFamilies.monoBold,
    letterSpacing: 0.8,
  },
  dotSeparator: {
    fontSize: 9,
    color: colors.textTertiary,
  },
  dateText: {
    fontSize: 9,
    fontFamily: fontFamilies.monoRegular,
    color: colors.textTertiary,
  },
  title: {
    fontSize: 17,
    fontFamily: fontFamilies.soria,
    color: colors.textPrimary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(101, 78, 60, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 30,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(101, 78, 60, 0.08)",
    marginVertical: 16,
  },
  sectionBlock: {
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 13,
    fontFamily: fontFamilies.monoBold,
    color: colors.textPrimary,
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  sectionBody: {
    fontSize: 13,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textSecondary,
    lineHeight: 21,
  },
  footerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(201, 70, 91, 0.06)",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(201, 70, 91, 0.14)",
    marginTop: 10,
    marginBottom: 24,
  },
  footerText: {
    flex: 1,
    fontSize: 11,
    fontFamily: fontFamilies.sansRegular,
    color: colors.primaryDark,
    lineHeight: 16,
  },
  doneBtn: {
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  doneGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  doneBtnText: {
    fontSize: 14,
    fontFamily: fontFamilies.monoBold,
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
});
