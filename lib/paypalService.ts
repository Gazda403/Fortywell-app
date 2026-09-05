import { Platform } from 'react-native';

export interface CreateOrderParams {
  amount: number | string;
  productName: string;
  productId: string;
  /** AliExpress product ID for automatic order fulfillment after payment */
  aliExpressProductId?: string;
}

export interface PayPalOrderResult {
  id: string;
  status: string;
  approveUrl?: string;
  raw?: any;
}

// Next.js API base URL
// fortywell.vercel.app is the Next.js API backend (where /api/paypal/* lives)
// Guard against pointing to fortywell-app.vercel.app (the static Expo frontend)
const rawBaseUrl =
  process.env.EXPO_PUBLIC_API_URL || 'https://fortywell.vercel.app';
const API_BASE_URL = rawBaseUrl.replace(
  'fortywell-app.vercel.app',
  'fortywell.vercel.app'
);

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
      `API at ${API_BASE_URL} returned an empty response (HTTP ${res.status}).`
    );
  }
  try {
    return JSON.parse(text);
  } catch {
    // Likely received an HTML page (wrong URL / CORS / 404)
    const preview = text.slice(0, 100).replace(/\n/g, ' ');
    throw new Error(
      `Payment API returned HTTP ${res.status} HTML instead of JSON. Ensure backend API is at https://fortywell.vercel.app (Preview: ${preview})`
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
        ...(params.aliExpressProductId ? { aliExpressProductId: params.aliExpressProductId } : {}),
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
export async function capturePayPalOrder(
  orderId: string,
  meta?: { productName?: string; productId?: string; amount?: number | string }
): Promise<any> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/paypal/capture-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderID: orderId,
        productName: meta?.productName,
        productId: meta?.productId,
        amount: meta?.amount,
      }),
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
