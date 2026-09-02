import { Platform } from 'react-native';

export interface CreateOrderParams {
  amount: number | string;
  productName: string;
  productId: string;
}

export interface PayPalOrderResult {
  id: string;
  status: string;
  approveUrl?: string;
  raw?: any;
}

// Next.js API base URL or local dev endpoint
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === 'web' && typeof window !== 'undefined'
    ? window.location.origin
    : 'https://fortywell.app');

export const PAYPAL_CLIENT_ID =
  process.env.EXPO_PUBLIC_PAYPAL_CLIENT_ID ||
  process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ||
  '';

/**
 * Creates a PayPal Guest Checkout order.
 * landing_page: "GUEST_CHECKOUT" instructs PayPal to render direct Card inputs
 * without requiring the user to create or log into a PayPal account.
 */
export async function createPayPalGuestOrder(
  params: CreateOrderParams
): Promise<PayPalOrderResult> {
  const formattedAmount = Number(params.amount).toFixed(2);

  try {
    const res = await fetch(`${API_BASE_URL}/api/paypal/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: formattedAmount,
        productName: params.productName,
        productId: params.productId,
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.id) {
      // If the backend returns an error (e.g. missing API keys in local demo), throw detailed message
      throw new Error(data.error || data.message || 'Failed to create PayPal order');
    }

    const approveLink = data.links?.find(
      (link: any) => link.rel === 'approve' || link.rel === 'payer-action'
    )?.href;

    return {
      id: data.id,
      status: data.status || 'CREATED',
      approveUrl: approveLink,
      raw: data,
    };
  } catch (err: any) {
    console.error('createPayPalGuestOrder error:', err);
    throw err;
  }
}

/**
 * Captures an approved PayPal order.
 */
export async function capturePayPalOrder(orderId: string): Promise<any> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/paypal/capture-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orderID: orderId }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || data.message || 'Failed to capture PayPal order');
    }

    return data;
  } catch (err: any) {
    console.error('capturePayPalOrder error:', err);
    throw err;
  }
}
