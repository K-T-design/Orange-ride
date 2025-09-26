
'use server';

import { plans } from '@/lib/data';
import type { PlanKey } from '@/lib/types';

type PaystackInitResponse = {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
};

/**
 * Initializes a payment transaction with Paystack.
 * This function is intended to be called from the server-side.
 * @param planKey The selected plan key (e.g., 'Weekly', 'Monthly').
 * @param userId The ID of the user initiating the payment.
 * @param userEmail The email of the user.
 * @returns An object containing the access code and reference, or an error.
 */
export async function initializePayment(planKey: PlanKey, userId: string, userEmail: string) {
  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
  if (!PAYSTACK_SECRET_KEY) {
    console.error('Paystack secret key is not configured.');
    return { error: 'Payment gateway is not configured.' };
  }

  const planDetails = plans[planKey];
  if (!planDetails || planDetails.price <= 0) {
    return { error: 'Invalid plan selected.' };
  }

  const amountInKobo = planDetails.price * 100;

  const payload = {
    email: userEmail,
    amount: amountInKobo,
    plan: planDetails.code, // Paystack Plan Code
    metadata: {
      user_id: userId,
      plan_key: planKey,
      // Custom metadata can be added here
    },
  };

  try {
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data: PaystackInitResponse = await response.json();

    if (!response.ok || !data.status) {
      console.error('Paystack API Error:', data.message);
      return { error: data.message || 'Failed to initialize payment.' };
    }

    return {
      accessCode: data.data.access_code,
      reference: data.data.reference,
    };
  } catch (error) {
    console.error('Error initializing payment with Paystack:', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}
