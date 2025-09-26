'use server';

import { plans } from '@/lib/data';
import type { PlanKey } from '@/lib/types';
import { db } from './firebase';
import { collection, query, where, getDocs, doc, setDoc, updateDoc, Timestamp, addDoc, serverTimestamp, getDoc } from 'firebase/firestore';

/**
 * Verifies a Paystack transaction.
 * @param reference The transaction reference.
 * @returns An object indicating success or failure.
 */
export async function verifyPayment(reference: string) {
  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
  if (!PAYSTACK_SECRET_KEY) {
    return { status: 'error', message: 'Payment gateway is not configured.' };
  }

  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    });

    const data = await response.json();

    if (data.data.status === 'success') {
      const planKey = data.data.metadata.plan_key as PlanKey;
      const userId = data.data.metadata.user_id;

      // Security check: Verify amount paid matches the plan
      const planDetails = plans[planKey];
      const amountPaid = data.data.amount; // in kobo

      if (planDetails.price * 100 !== amountPaid) {
          await createNotification(
            `Payment verification failed for ${userId}. Amount mismatch.`,
            'payment_failed',
          );
          return { status: 'error', message: 'Amount paid does not match plan price.' };
      }

      await activateSubscription(userId, planKey, reference);
      return { status: 'success', message: 'Payment verified and subscription activated.' };
    } else {
      return { status: 'error', message: `Payment not successful. Status: ${data.data.status}` };
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
    let expiryDate = new Date(now);

    if (plan.name === 'Weekly') expiryDate.setDate(now.getDate() + 7);
    if (plan.name === 'Monthly') expiryDate.setMonth(now.getMonth() + 1);
    if (plan.name === 'Yearly') expiryDate.setFullYear(now.getFullYear() + 1);

    const subscriptionData = {
        ownerId: userId,
        ownerName: ownerName,
        plan: plan.name,
        status: 'Active',
        startDate: Timestamp.fromDate(now),
        expiryDate: Timestamp.fromDate(expiryDate),
        lastPaymentReference: reference,
    };
    
    // Check if user already has a subscription document
    const subsQuery = query(collection(db, 'subscriptions'), where('ownerId', '==', userId));
    const subSnapshot = await getDocs(subsQuery);

    if (subSnapshot.empty) {
        await addDoc(collection(db, 'subscriptions'), subscriptionData);
    } else {
        const subDocRef = subSnapshot.docs[0].ref;
        await updateDoc(subDocRef, subscriptionData);
    }
    
    // Update the `plan` field on the owner document for quick access
    await updateDoc(ownerDocRef, { plan: plan.name, status: 'Active' });

    // Create a notification for the admin
    await createNotification(
      `New subscription for ${ownerName} (${plan.name} Plan) was successful.`,
      'new_subscription',
      ownerName,
      plan.name
    );
}

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
