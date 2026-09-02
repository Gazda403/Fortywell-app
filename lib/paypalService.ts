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
// IMPORTANT: Set EXPO_PUBLIC_API_URL in .env to point to the Next.js app
// (e.g. https://fortywell-app.vercel.app). Without it on the web build, all
// /api/* requests hit the static Expo site which returns HTML, not JSON.
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === 'web' && typeof window !== 'undefined'
    ? window.location.origin
    : 'https://fortywell-app.vercel.app');

/**
 * Safely parse JSON from a fetch Response.
 * If the response body is empty or non-JSON (e.g. an HTML 404 page returned
 * by Vercel's static rewrite), throw a descriptive error instead of the
 * cryptic "Unexpected end of JSON input" browser message.
 */
async function safeJson(res: Response): Promise<any> {
  const text = await res.text();
  if (!text || text.trim() === '') {
    throw new Error(
      'The payment API returned an empty response. Check that EXPO_PUBLIC_API_URL points to the correct server.'
    );
  }
  try {
    return JSON.parse(text);
  } catch {
    // Likely received an HTML page (wrong URL / CORS / 404)
    const preview = text.slice(0, 120).replace(/\n/g, ' ');
    throw new Error(
      `Payment API returned non-JSON response (URL may be wrong). Preview: ${preview}`
    );
  }
}

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

    const data = await safeJson(res);

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

    const data = await safeJson(res);

    if (!res.ok) {
      throw new Error(data.error || data.message || 'Failed to capture PayPal order');
    }

    return data;
  } catch (err: any) {
    console.error('capturePayPalOrder error:', err);
    throw err;
  }
}
