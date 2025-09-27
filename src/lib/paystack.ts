
'use server';

import { plans } from '@/lib/data';
import type { PlanKey } from '@/lib/types';
import { db } from './firebase';
import { collection, doc, setDoc, updateDoc, Timestamp, addDoc, serverTimestamp, getDoc } from 'firebase/firestore';


// Helper to create admin notifications
async function createNotification(message: string, eventType: string, ownerName?: string, plan?: string) {
    try {
        await addDoc(collection(db, 'notifications'), {
            message,
            ownerName: ownerName || 'System',
            plan: plan || 'N/A',
            eventType,
            createdAt: serverTimestamp(),
            read: false
        });
    } catch (error) {
        console.error("Failed to create notification:", error);
    }
};

/**
 * Initializes a payment transaction with Paystack and returns a redirect URL.
 * This should be called from the client to start the payment process.
 * @param email The user's email.
 * @param planKey The selected plan key.
 * @param userId The ID of the user initiating the payment.
 * @returns An object with the authorization_url or an error.
 */
export async function initializePaymentRedirect(email: string, planKey: PlanKey, userId: string) {
  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
  if (!PAYSTACK_SECRET_KEY) {
    console.error('Paystack secret key is not configured.');
    return { error: 'Payment gateway is not configured.' };
  }

  const plan = plans[planKey];
  if (!plan) {
    return { error: 'Invalid plan selected.' };
  }
   if (!userId) {
    return { error: 'User is not authenticated.' };
  }

  const url = "https://api.paystack.co/transaction/initialize";
  
  // Construct the callback URL from environment variables
  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/owner/payment/callback`;

  const fields = {
    email,
    plan: plan.planCode, // Use the plan code for subscriptions
    callback_url: callbackUrl,
    metadata: {
        user_id: userId,
        plan: planKey,
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fields),
    });

    const data = await response.json();

    if (!data.status || !data.data.authorization_url) {
      console.error('Paystack initialization failed:', data.message);
      return { error: data.message || 'Failed to initialize payment with Paystack.' };
    }

    return { authorization_url: data.data.authorization_url };
  } catch (error) {
    console.error('Error initializing Paystack payment:', error);
    return { error: 'An unexpected error occurred while initializing payment.' };
  }
}


/**
 * Verifies a Paystack transaction.
 * @param reference The transaction reference.
 * @returns An object indicating success or failure.
 */
export async function verifyPayment(reference: string): Promise<{status: 'success' | 'error', message: string, plan?: PlanKey}> {
  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
  if (!PAYSTACK_SECRET_KEY) {
    console.error('Paystack secret key is not configured.');
    return { status: 'error', message: 'Payment gateway is not configured.' };
  }

  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    });

    const data = await response.json();

    if (data.data && data.data.status === 'success') {
      const planKey = data.data.metadata.plan as PlanKey;
      const userId = data.data.metadata.user_id;

      if (!userId || !planKey) {
        await createNotification(
            `Payment verification failed. Missing metadata for reference: ${reference}`,
            'payment_failed',
        );
        return { status: 'error', message: 'Transaction metadata is missing.' };
      }
      
      const planDetails = plans[planKey];
      const amountPaid = data.data.amount; // in kobo

      // Security check: Verify amount paid matches the plan price
      if (planDetails.price * 100 !== amountPaid) {
          await createNotification(
            `Payment verification failed for ${userId}. Amount mismatch.`,
            'payment_failed',
          );
          return { status: 'error', message: 'Amount paid does not match plan price.' };
      }

      await activateSubscription(userId, planKey, reference);
      return { status: 'success', message: 'Payment verified and subscription activated.', plan: planKey };
    } else {
      return { status: 'error', message: `Payment not successful. Status: ${data.data.status || 'unknown'}` };
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    return { status: 'error', message: 'An unexpected error occurred during verification.' };
  }
}


/**
 * Activates or updates a user's subscription in Firestore.
 * @param userId The ID of the user.
 * @param planKey The new plan key.
 * @param reference The Paystack transaction reference.
 */
export async function activateSubscription(userId: string, planKey: PlanKey, reference: string) {
    const ownerDocRef = doc(db, 'rideOwners', userId);
    const ownerDoc = await getDoc(ownerDocRef);

    if (!ownerDoc.exists()) {
        throw new Error('Ride owner not found in database.');
    }

    const ownerName = ownerDoc.data().name;
    const now = new Date();
    const plan = plans[planKey];
    let expiryDate: Date | null = new Date(now);

    if (plan.durationInDays > 0) {
        expiryDate.setDate(now.getDate() + plan.durationInDays);
    } else {
        expiryDate = null; // For non-expiring plans like lifetime deals
    }
    
    const subscriptionData = {
        ownerId: userId,
        ownerName: ownerName,
        plan: planKey,
        status: 'Active',
        startDate: Timestamp.fromDate(now),
        expiryDate: expiryDate ? Timestamp.fromDate(expiryDate) : null,
        lastPaymentReference: reference,
    };
    
    // Use the user's UID as the document ID for their subscription for easy lookup
    const subDocRef = doc(db, 'subscriptions', userId);
    await setDoc(subDocRef, subscriptionData, { merge: true });
    
    // Update the `plan` field on the owner document for quick access
    await updateDoc(ownerDocRef, { plan: planKey, status: 'Active' });

    // Create a notification for the admin
    await createNotification(
      `New subscription for ${ownerName} (${plan.name} Plan) was successful.`,
      'new_subscription',
      ownerName,
      plan.name
    );
}
