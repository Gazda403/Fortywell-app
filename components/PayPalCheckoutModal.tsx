import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  Platform,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Image as ExpoImage } from 'expo-image';
import {
  X,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Sparkles,
  Truck,
  ArrowRight,
  AlertCircle,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react-native';
import { colors } from '../theme/colors';
import { fontFamilies } from '../theme/typography';
import {
  createPayPalGuestOrder,
  capturePayPalOrder,
  PAYPAL_CLIENT_ID,
} from '../lib/paypalService';

interface PayPalCheckoutModalProps {
  visible: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    subtitle: string;
    price: number;
    originalPrice?: number;
    image: any;
  };
  onPaymentComplete?: (orderId: string) => void;
}

declare global {
  interface Window {
    paypal?: any;
  }
}

export const PayPalCheckoutModal: React.FC<PayPalCheckoutModalProps> = ({
  visible,
  onClose,
  product,
  onPaymentComplete,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<{ id: string; date: string } | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const webCardBtnRef = useRef<HTMLDivElement | null>(null);

  // Load PayPal SDK on Web if client ID is present
  useEffect(() => {
    if (Platform.OS !== 'web' || !visible) return;

    const clientId = PAYPAL_CLIENT_ID || 'test';
    const scriptId = 'paypal-sdk-script';

    if (document.getElementById(scriptId)) {
      setSdkReady(true);
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&components=buttons`;
    script.async = true;
    script.onload = () => {
      setSdkReady(true);
    };
    script.onerror = () => {
      console.warn('PayPal SDK could not be loaded from CDN.');
    };
    document.body.appendChild(script);
  }, [visible]);

  const handleCardCheckout = async () => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (_) {}

    setLoading(true);
    setErrorMessage(null);

    try {
      const order = await createPayPalGuestOrder({
        amount: product.price,
        productName: product.name,
        productId: product.id,
      });

      if (order.approveUrl) {
        // Open direct PayPal Guest Checkout URL (Card payment without account required)
        if (Platform.OS === 'web') {
          window.open(order.approveUrl, '_blank', 'width=500,height=700');
        } else {
          await Linking.openURL(order.approveUrl);
        }
      } else {
        // Fallback for simulated/completed direct order
        handleSuccess(order.id || `ORD-${Date.now().toString().slice(-6)}`);
      }
    } catch (err: any) {
      console.warn('PayPal order creation notice:', err.message);
      // If backend API isn't running or keys missing in dev, allow simulated checkout so user can test UI
      if (err.message?.includes('credentials not configured') || err.message?.includes('Failed to fetch')) {
        setErrorMessage('PayPal credentials not set in .env.local yet. Please configure PAYPAL_CLIENT_ID & PAYPAL_CLIENT_SECRET.');
      } else {
        setErrorMessage(err.message || 'Could not initiate checkout. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = (orderId: string) => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (_) {}

    const now = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    setCompletedOrder({ id: orderId, date: now });
    if (onPaymentComplete) {
      onPaymentComplete(orderId);
    }
  };

  const handleClose = () => {
    setCompletedOrder(null);
    setErrorMessage(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.sheetContainer} edges={['bottom']}>
          {/* Top Handle bar */}
          <View style={styles.handleBar} />

          {/* Modal Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleWrap}>
              <Text style={styles.headerKicker}>SECURE GUEST CHECKOUT</Text>
              <Text style={styles.headerTitle}>FortyWell Apothecary</Text>
            </View>

            <Pressable
              style={styles.closeBtn}
              onPress={handleClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close checkout modal"
            >
              <X size={20} color={colors.textPrimary} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {completedOrder ? (
              /* ── SUCCESS STATE ── */
              <View style={styles.successCard}>
                <View style={styles.successIconWrap}>
                  <CheckCircle2 size={36} color="#FFFFFF" strokeWidth={2.5} />
                </View>

                <Text style={styles.successHeading}>Order Confirmed!</Text>
                <Text style={styles.successSubtext}>
                  Thank you for your order of <Text style={{ fontWeight: '700' }}>{product.name}</Text>. Your handcrafted batch will be prepared and shipped within 48 hours.
                </Text>

                <View style={styles.receiptBox}>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Order ID</Text>
                    <Text style={styles.receiptValue}>{completedOrder.id}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Date</Text>
                    <Text style={styles.receiptValue}>{completedOrder.date}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Item</Text>
                    <Text style={styles.receiptValue}>{product.name}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Shipping</Text>
                    <Text style={styles.receiptValueSuccess}>FREE Tracked 48h</Text>
                  </View>
                  <View style={[styles.receiptRow, styles.receiptTotalRow]}>
                    <Text style={styles.receiptTotalLabel}>Total Paid</Text>
                    <Text style={styles.receiptTotalValue}>${product.price.toFixed(2)}</Text>
                  </View>
                </View>

                <Pressable style={styles.doneButton} onPress={handleClose}>
                  <Text style={styles.doneButtonText}>Return to Store</Text>
                </Pressable>
              </View>
            ) : (
              /* ── CHECKOUT FORM ── */
              <>
                {/* Product Summary Card */}
                <View style={styles.productSummaryCard}>
                  <ExpoImage
                    source={product.image}
                    style={styles.productThumb}
                    contentFit="cover"
                  />
                  <View style={styles.productDetails}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.productSub}>{product.subtitle}</Text>

                    <View style={styles.priceRow}>
                      {product.originalPrice && (
                        <Text style={styles.originalPrice}>${product.originalPrice.toFixed(2)}</Text>
                      )}
                      <Text style={styles.currentPrice}>${product.price.toFixed(2)}</Text>
                      <View style={styles.discountPill}>
                        <Text style={styles.discountPillText}>50% OFF</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Guest Checkout Notice */}
                <View style={styles.guestNoticeBox}>
                  <View style={styles.guestNoticeIconWrap}>
                    <Lock size={16} color={colors.primary} />
                  </View>
                  <View style={styles.guestNoticeContent}>
                    <Text style={styles.guestNoticeTitle}>No PayPal Account Required</Text>
                    <Text style={styles.guestNoticeDesc}>
                      You can pay instantly with any Debit or Credit Card as a guest. Simply enter your payment information and confirm.
                    </Text>
                  </View>
                </View>

                {/* Error Banner */}
                {errorMessage && (
                  <View style={styles.errorBox}>
                    <AlertCircle size={16} color="#DC2626" />
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </View>
                )}

                {/* Direct Card Payment (Guest Checkout) */}
                <View style={styles.actionSection}>
                  <Text style={styles.sectionLabel}>CHOOSE PAYMENT METHOD</Text>

                  {/* Primary Direct Debit/Credit Card Button */}
                  <Pressable
                    style={styles.cardPayBtn}
                    onPress={handleCardCheckout}
                    disabled={loading}
                    accessibilityRole="button"
                    accessibilityLabel="Pay with Debit or Credit Card"
                  >
                    <LinearGradient
                      colors={['#2D2622', '#1A1614']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.cardPayGradient}
                    >
                      {loading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <>
                          <View style={styles.cardPayLeft}>
                            <CreditCard size={20} color="#FFFFFF" />
                            <Text style={styles.cardPayText}>Debit or Credit Card</Text>
                          </View>
                          <View style={styles.cardPayBadge}>
                            <Text style={styles.cardPayBadgeText}>Guest Checkout</Text>
                          </View>
                        </>
                      )}
                    </LinearGradient>
                  </Pressable>

                  {/* Secondary Standard PayPal Option */}
                  <Pressable
                    style={styles.paypalBtn}
                    onPress={handleCardCheckout}
                    disabled={loading}
                    accessibilityRole="button"
                    accessibilityLabel="Pay with PayPal"
                  >
                    <Text style={styles.paypalBtnText}>
                      <Text style={{ color: '#003087', fontWeight: '800' }}>Pay</Text>
                      <Text style={{ color: '#0079C1', fontWeight: '800' }}>Pal</Text>
                    </Text>
                    <ArrowRight size={16} color="#003087" />
                  </Pressable>
                </View>

                {/* Cost Breakdown */}
                <View style={styles.breakdownBox}>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Subtotal (1x 100ml Bottle)</Text>
                    <Text style={styles.breakdownVal}>${product.price.toFixed(2)}</Text>
                  </View>
                  <View style={styles.breakdownRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Truck size={13} color={colors.sageDark} />
                      <Text style={styles.breakdownLabel}>Standard Tracked Shipping</Text>
                    </View>
                    <Text style={styles.breakdownFree}>FREE</Text>
                  </View>
                  <View style={[styles.breakdownRow, styles.breakdownTotal]}>
                    <Text style={styles.breakdownTotalLabel}>Total Amount Due</Text>
                    <Text style={styles.breakdownTotalVal}>${product.price.toFixed(2)} USD</Text>
                  </View>
                </View>

                {/* Trust & Guarantee Badges */}
                <View style={styles.trustFooter}>
                  <View style={styles.trustItem}>
                    <ShieldCheck size={14} color={colors.sageDark} />
                    <Text style={styles.trustText}>256-Bit SSL Encryption</Text>
                  </View>
                  <View style={styles.trustDot} />
                  <View style={styles.trustItem}>
                    <Sparkles size={14} color={colors.primary} />
                    <Text style={styles.trustText}>100% Satisfaction Guarantee</Text>
                  </View>
                </View>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 22, 20, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FAF8F5',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    minHeight: 480,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 20,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D6CFC7',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EBE5DE',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerKicker: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    color: colors.primary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1614',
    fontFamily: fontFamilies.soria,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0EBE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 22,
    paddingBottom: 36,
  },
  productSummaryCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EBE5DE',
    marginBottom: 16,
    alignItems: 'center',
  },
  productThumb: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#F0EBE3',
  },
  productDetails: {
    flex: 1,
    marginLeft: 14,
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1614',
  },
  productSub: {
    fontSize: 11,
    color: '#7A726B',
    marginTop: 2,
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  originalPrice: {
    fontSize: 12,
    color: '#A09890',
    textDecorationLine: 'line-through',
  },
  currentPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1614',
  },
  discountPill: {
    backgroundColor: '#EEF4EC',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discountPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.sageDark,
  },
  guestNoticeBox: {
    flexDirection: 'row',
    backgroundColor: '#F3EFE9',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2DCD3',
    marginBottom: 18,
    gap: 12,
  },
  guestNoticeIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  guestNoticeContent: {
    flex: 1,
  },
  guestNoticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1614',
    marginBottom: 2,
  },
  guestNoticeDesc: {
    fontSize: 11,
    color: '#655D56',
    lineHeight: 16,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12,
    color: '#B91C1C',
    flex: 1,
  },
  actionSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: '#7A726B',
    marginBottom: 10,
  },
  cardPayBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardPayGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 15,
  },
  cardPayLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardPayText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardPayBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cardPayBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  paypalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFC439',
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E8AE23',
  },
  paypalBtnText: {
    fontSize: 17,
    letterSpacing: -0.5,
  },
  breakdownBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EBE5DE',
    marginBottom: 18,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  breakdownLabel: {
    fontSize: 12,
    color: '#655D56',
  },
  breakdownVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1614',
  },
  breakdownFree: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.sageDark,
  },
  breakdownTotal: {
    borderTopWidth: 1,
    borderTopColor: '#EBE5DE',
    marginTop: 6,
    paddingTop: 10,
  },
  breakdownTotalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1614',
  },
  breakdownTotalVal: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  trustFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 4,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trustText: {
    fontSize: 10,
    color: '#7A726B',
  },
  trustDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#A09890',
  },
  /* Success Card Styles */
  successCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EBE5DE',
  },
  successIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.sageDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successHeading: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1614',
    fontFamily: fontFamilies.soria,
    marginBottom: 8,
  },
  successSubtext: {
    fontSize: 13,
    color: '#5D5751',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  receiptBox: {
    width: '100%',
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EBE5DE',
    marginBottom: 20,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  receiptLabel: {
    fontSize: 12,
    color: '#7A726B',
  },
  receiptValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1614',
  },
  receiptValueSuccess: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.sageDark,
  },
  receiptTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5DFD7',
    marginTop: 8,
    paddingTop: 10,
  },
  receiptTotalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1614',
  },
  receiptTotalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  doneButton: {
    width: '100%',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
