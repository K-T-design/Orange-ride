
import { NextRequest, NextResponse } from 'next/server';
import * as crypto from 'crypto';
import { activateSubscription } from '@/lib/paystack';

export async function POST(req: NextRequest) {
  const secret = process.env.PAYSTACK_SECRET_KEY!;

  try {
    const text = await req.text();
    const signature = req.headers.get('x-paystack-signature')!;

    const hash = crypto
      .createHmac('sha512', secret)
      .update(text)
      .digest('hex');

    if (hash !== signature) {
      console.warn('Paystack webhook signature mismatch.');
      return NextResponse.json({ status: 'Signature mismatch' }, { status: 401 });
    }

    const event = JSON.parse(text);

    if (event.event === 'charge.success') {
      const { user_id, plan } = event.data.metadata;
      
      if (user_id && plan) {
        console.log(`Activating subscription for user ${user_id} with plan ${plan}`);
        const result = await activateSubscription(user_id, plan);
        if (!result.success) {
            console.error(`Webhook: Failed to activate subscription for user ${user_id}. Reason: ${result.message}`);
        } else {
             console.log(`Webhook: Successfully activated subscription for user ${user_id}.`);
        }
      } else {
        console.warn('Webhook received charge.success but metadata was missing.');
      }
    }

    return NextResponse.json({ status: 'success' });

  } catch (error) {
    console.error('Error handling Paystack webhook:', error);
    return NextResponse.json({ status: 'error', message: 'Internal Server Error' }, { status: 500 });
  }
}
