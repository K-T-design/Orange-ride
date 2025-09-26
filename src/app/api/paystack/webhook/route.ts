
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { activateSubscription } from '@/lib/paystack';

export async function POST(req: NextRequest) {
  const secret = process.env.PAYSTACK_WEBHOOK_SECRET;
  if (!secret) {
    console.error("Paystack webhook secret is not set.");
    return NextResponse.json({ message: 'Webhook secret not configured.' }, { status: 500 });
  }

  // Read the request body text ONCE
  const body = await req.text();
  
  const hash = crypto.createHmac('sha512', secret).update(body).digest('hex');
  const paystackSignature = req.headers.get('x-paystack-signature');

  if (hash !== paystackSignature) {
    console.warn("Invalid Paystack webhook signature received.");
    return NextResponse.json({ message: 'Invalid signature' }, { status: 401 });
  }

  // Now, parse the body text that we've already read
  const event = JSON.parse(body);

  if (event.event === 'charge.success') {
    const { metadata, reference } = event.data;
    // Paystack might send metadata as a string, so we ensure it's parsed
    const parsedMetadata = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
    
    const { user_id: userId, plan } = parsedMetadata;

    if (userId && plan) {
      try {
        await activateSubscription(userId, plan, reference);
        console.log(`Webhook: Successfully activated subscription for user ${userId} with plan ${plan}.`);
      } catch (error) {
        console.error(`Webhook Error: Failed to activate subscription for user ${userId}.`, error);
        // Return a 500 so Paystack retries the webhook
        return NextResponse.json({ message: 'Failed to activate subscription.' }, { status: 500 });
      }
    } else {
        console.warn('Webhook received charge.success but metadata was missing or malformed.', metadata);
    }
  }

  // Acknowledge receipt of the event
  return NextResponse.json({ received: true }, { status: 200 });
}
