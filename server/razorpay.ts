import Razorpay from 'razorpay';
import crypto from 'crypto';

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set');
}

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export function verifyWebhookSignature(rawBody: Buffer | string, signature: string): boolean {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error('RAZORPAY_WEBHOOK_SECRET is not set');
  }

  const bodyString = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : rawBody;

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(bodyString)
    .digest('hex');

  return expectedSignature === signature;
}

export const SUBSCRIPTION_PLANS = {
  monthly: {
    amount: 29900, // ₹299
    currency: 'INR',
    interval: 1,
    period: 'monthly' as const,
  },
  yearly: {
    amount: 299900, // ₹2999
    currency: 'INR',
    interval: 1,
    period: 'yearly' as const,
  },
};
