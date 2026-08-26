import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  X,
  Sparkles,
  BookOpen,
  Check,
  Bookmark,
  ShieldCheck,
  Wind,
  Zap,
  Moon,
  HeartPulse,
  Leaf,
  Flame,
  Activity,
  Sun,
  Droplet,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { fontFamilies } from '../theme/typography';
import { EducationalArticle } from '../data/educationalArticles';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ── Consistent strokeWidth across all icons in this modal
const ICON_PROPS = { strokeWidth: 1.8 };

interface ArticleDetailModalProps {
  article: EducationalArticle | null;
  visible: boolean;
  onClose: () => void;
}

function renderIcon(type: string, color: string, size = 18) {
  const p = { ...ICON_PROPS, size, color };
  switch (type) {
    case 'wind':     return <Wind {...p} />;
    case 'zap':      return <Zap {...p} />;
    case 'moon':     return <Moon {...p} />;
    case 'heart':    return <HeartPulse {...p} />;
    case 'shield':   return <ShieldCheck {...p} />;
    case 'sparkles': return <Sparkles {...p} />;
    case 'leaf':     return <Leaf {...p} />;
    case 'flame':    return <Flame {...p} />;
    case 'activity': return <Activity {...p} />;
    case 'sun':      return <Sun {...p} />;
    case 'droplet':  return <Droplet {...p} />;
    default:         return <BookOpen {...p} />;
  }
}

export const ArticleDetailModal: React.FC<ArticleDetailModalProps> = ({
  article,
  visible,
  onClose,
}) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Reset state when a new article opens
  useEffect(() => {
    if (visible) {
      setIsBookmarked(false);
      setIsCompleted(false);
    }
  }, [visible, article?.id]);

  // ESC key closes on web
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && visible) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [visible, onClose]);

  if (!article) return null;

  const haptic = (style: 'light' | 'success') => {
    try {
      if (Platform.OS !== 'web') {
        if (style === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (_) {}
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={s.overlay}>
        {/* Backdrop */}
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} accessibilityLabel="Close" />

        <View style={s.sheet}>
          {/* Grabber */}
          <View style={s.grabberWrap}>
            <View style={s.grabber} />
          </View>

          {/* ── STICKY HEADER ── */}
          <View style={s.header}>
            <View style={s.headerLeft}>
              <View style={[s.headerIconWrap, { backgroundColor: article.bgColor }]}>
                {renderIcon(article.iconType, article.accentColor, 13)}
              </View>
              <Text style={s.headerKicker} numberOfLines={1}>{article.tag}</Text>
            </View>
            <View style={s.headerActions}>
              <Pressable
                onPress={() => { setIsBookmarked((p) => !p); haptic('light'); }}
                style={[s.iconBtn, isBookmarked && { backgroundColor: article.bgColor }]}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Bookmark article"
              >
                <Bookmark
                  size={16}
                  color={isBookmarked ? article.accentColor : colors.textTertiary}
                  fill={isBookmarked ? article.accentColor : 'transparent'}
                  strokeWidth={1.8}
                />
              </Pressable>
              <Pressable
                onPress={onClose}
                style={s.iconBtn}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Close article"
              >
                <X size={17} color={colors.textPrimary} strokeWidth={2} />
              </Pressable>
            </View>
          </View>

          {/* ── SCROLLABLE BODY ── */}
          <ScrollView
            style={s.scrollBody}
            contentContainerStyle={s.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Meta row */}
            <View style={s.metaRow}>
              <View style={[s.catPill, { backgroundColor: article.bgColor }]}>
                <Text style={[s.catPillText, { color: article.accentColor }]}>
                  {article.category.toUpperCase()}
                </Text>
              </View>
              <Text style={s.readTime}>· {article.readTime}</Text>
            </View>

            {/* Article title — Soria serif */}
            <Text style={s.articleTitle}>{article.title}</Text>

            {/* Key Takeaway box */}
            <View style={[s.takeawayBox, { backgroundColor: article.bgColor }]}>
              <View style={s.takeawayHeader}>
                <Sparkles size={13} color={article.accentColor} strokeWidth={1.8} />
                <Text style={[s.takeawayLabel, { color: article.accentColor }]}>KEY TAKEAWAY</Text>
              </View>
              <Text style={s.takeawayBody}>{article.fullContent.takeaway}</Text>
            </View>

            {/* Sections — WorkSans body text */}
            {article.fullContent.sections.map((section, i) => (
              <View key={i} style={s.sectionBlock}>
                <Text style={s.sectionHeading}>{section.heading}</Text>
                {section.paragraphs.map((p, j) => (
                  <Text key={j} style={s.sectionParagraph}>{p}</Text>
                ))}
              </View>
            ))}

            {/* Action Step card */}
            <View style={s.actionCard}>
              <LinearGradient
                colors={['#F9EDF1', '#F5EFDE']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={s.actionHeader}>
                <Check size={13} color={colors.primaryDark} strokeWidth={2.5} />
                <Text style={s.actionLabel}>TODAY'S STEP</Text>
              </View>
              <Text style={s.actionBody}>{article.fullContent.actionStep}</Text>
            </View>

            {/* Evidence footer */}
            {article.fullContent.evidenceBadge && (
              <View style={s.evidenceRow}>
                <ShieldCheck size={13} color={colors.sageDark} strokeWidth={1.8} />
                <Text style={s.evidenceText}>{article.fullContent.evidenceBadge}</Text>
              </View>
            )}

            <View style={{ height: 100 }} />
          </ScrollView>

          {/* ── BOTTOM ACTION BAR ── */}
          <View style={s.bottomBar}>
            <Pressable
              onPress={() => { setIsCompleted(true); haptic('success'); }}
              style={s.completeBtn}
              accessibilityRole="button"
              accessibilityLabel="Mark lesson complete"
            >
              <LinearGradient
                colors={isCompleted ? [colors.sage, colors.sageDark] : ['#D07887', '#9F4252']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.completeBtnGradient}
              >
                {isCompleted ? (
                  <>
                    <Check size={16} color="#FFF5EF" strokeWidth={2.5} />
                    <Text style={s.completeBtnText}>Lesson Completed</Text>
                  </>
                ) : (
                  <>
                    <BookOpen size={16} color="#FFF5EF" strokeWidth={1.8} />
                    <Text style={s.completeBtnText}>Got It · Finish Reading</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#2A2320', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
  android: { elevation: 3 },
  default: { boxShadow: '0 2px 8px rgba(42,35,32,0.08)' },
});

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 18, 16, 0.62)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sheet: {
    width: '100%',
    maxWidth: 600,
    height: Platform.OS === 'web' ? '92%' : '88%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#1A1210', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 14 },
      android: { elevation: 8 },
      default: { boxShadow: '0 -4px 14px rgba(26,18,16,0.15)' },
    }),
  },
  grabberWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
  grabber: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.borderMedium },

  // ── HEADER ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    backgroundColor: colors.surface,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 12,
  },
  headerIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerKicker: {
    fontSize: 10,
    fontFamily: fontFamilies.monoBold,
    letterSpacing: 1.8,
    color: colors.textTertiary,
    textTransform: 'uppercase',
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── SCROLL ──
  scrollBody: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 32 },

  // ── META ──
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  catPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  catPillText: {
    fontSize: 10,
    fontFamily: fontFamilies.monoBold,
    letterSpacing: 1.2,
  },
  readTime: {
    fontSize: 12,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textTertiary,
  },

  // ── ARTICLE TITLE — Soria serif ──
  articleTitle: {
    fontSize: 26,
    fontFamily: fontFamilies.soria,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 33,
    letterSpacing: -0.6,
    marginBottom: 18,
  },

  // ── TAKEAWAY ──
  takeawayBox: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  takeawayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  takeawayLabel: {
    fontSize: 10,
    fontFamily: fontFamilies.monoBold,
    letterSpacing: 1.5,
  },
  takeawayBody: {
    fontSize: 13,
    fontFamily: fontFamilies.sansMedium,
    color: colors.textPrimary,
    lineHeight: 20,
  },

  // ── SECTIONS — WorkSans body ──
  sectionBlock: { marginBottom: 20 },
  sectionHeading: {
    fontSize: 14,
    fontFamily: fontFamilies.sansSemiBold,
    color: colors.textPrimary,
    marginBottom: 8,
    letterSpacing: 0.1,
  },
  sectionParagraph: {
    fontSize: 13,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textSecondary,
    lineHeight: 21,
    marginBottom: 10,
  },

  // ── ACTION STEP ──
  actionCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.primarySoft,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 18,
    ...CARD_SHADOW,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 7,
  },
  actionLabel: {
    fontSize: 10,
    fontFamily: fontFamilies.monoBold,
    letterSpacing: 1.5,
    color: colors.primaryDark,
  },
  actionBody: {
    fontSize: 13,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textPrimary,
    lineHeight: 20,
  },

  // ── EVIDENCE ──
  evidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    marginTop: 8,
  },
  evidenceText: {
    fontSize: 11,
    fontFamily: fontFamilies.sansRegular,
    color: colors.textTertiary,
    flex: 1,
    lineHeight: 16,
  },

  // ── BOTTOM BAR ──
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  completeBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  completeBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
  },
  completeBtnText: {
    fontSize: 13,
    fontFamily: fontFamilies.sansBold,
    letterSpacing: 0.5,
    color: '#FFF5EF',
    textTransform: 'uppercase',
  },
});
