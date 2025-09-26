
'use server';

import { doc, getDoc, updateDoc, addDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { plans } from '@/lib/data';
import type { PlanKey } from '@/lib/types';


/**
 * Initializes a one-time payment transaction with Paystack.
 *
 * @param planKey The selected plan identifier ('Weekly', 'Monthly', 'Yearly').
 * @param userId The Firebase UID of the user making the payment.
 * @param userEmail The email address of the user.
 * @returns An object containing the success status and either the authorization URL or an error message.
 */
export async function initializePayment(planKey: PlanKey, userId: string, userEmail:string) {
    const planDetails = plans[planKey];
    if (!planDetails || planDetails.price === 0) {
        return { success: false, message: 'Invalid subscription plan selected.' };
    }

    const amountInKobo = planDetails.price * 100;
    const callback_url = "/owner/subscriptions/verify";

    const payload = {
        email: userEmail,
        amount: amountInKobo,
        plan: planDetails.code,
        callback_url,
        metadata: {
            user_id: userId,
            plan: planKey,
        },
    };

    try {
        const response = await fetch('https://api.paystack.co/transaction/initialize', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok || !data.status) {
            console.error('Detailed Paystack API Error:', data);
            return { success: false, message: data.message || 'Failed to initialize payment.' };
        }

        return {
            success: true,
            url: data.data.authorization_url,
        };

    } catch (error) {
        console.error('Detailed Paystack API Error:', error);
        return { success: false, message: 'Could not connect to the payment gateway. Please try again later.' };
    }
}


type PaystackVerifyResponse = {
    status: boolean;
    message: string;
    data: {
        id: number;
        status: 'success' | 'failed' | 'abandoned';
        reference: string;
        amount: number;
        gateway_response: string;
        paid_at: string;
        created_at: string;
        channel: string;
        currency: string;
        metadata: {
            user_id: string;
            plan: PlanKey;
            custom_fields: any[];
        };
        customer: {
            email: string;
        }
    };
}


/**
 * Verifies a payment transaction with Paystack using a reference.
 * @param reference The transaction reference from Paystack.
 * @returns An object containing the status and data of the verification.
 */
export async function verifyPayment(reference: string) {
    try {
        const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            },
        });

        const data: PaystackVerifyResponse = await response.json();

        if (!response.ok || !data.status) {
            throw new Error(data.message || 'Failed to verify payment.');
        }

        // Check if the transaction was successful
        if (data.data.status !== 'success') {
            return { success: false, message: 'Payment was not successful.', data: data.data };
        }
        
        // Optional: Verify that the amount paid matches the expected amount for the plan
        const planKey = data.data.metadata.plan;
        const expectedAmount = plans[planKey].price * 100;
        if (data.data.amount !== expectedAmount) {
             console.error(`Amount mismatch: Expected ${expectedAmount}, got ${data.data.amount}`);
             return { success: false, message: 'Paid amount does not match plan price.', data: data.data };
        }

        // If successful, activate the subscription
        const activationResult = await activateSubscription(data.data.metadata.user_id, data.data.metadata.plan);
        if (!activationResult.success) {
             return { success: false, message: activationResult.message, data: data.data };
        }
        
        return { success: true, message: 'Payment verified and subscription activated.', data: data.data };

    } catch (error) {
        console.error('Error verifying payment:', error);
        return { success: false, message: 'An error occurred during payment verification.' };
    }
}


/**
 * Activates or updates a user's subscription plan in Firestore.
 * @param userId The ID of the user.
 * @param planKey The key of the new plan.
 */
export async function activateSubscription(userId: string, planKey: PlanKey) {
    if (!userId || !planKey) {
        return { success: false, message: 'User ID or Plan Key missing.' };
    }
    
    const owner = await getDoc(doc(db, 'users', userId));
    if (!owner.exists()) {
        return { success: false, message: 'User not found.' };
    }

    const now = new Date();
    let expiryDate = new Date(now);
    if (planKey === 'Weekly') expiryDate.setDate(now.getDate() + 7);
    if (planKey === 'Monthly') expiryDate.setMonth(now.getMonth() + 1);
    if (planKey === 'Yearly') expiryDate.setFullYear(now.getFullYear() + 1);

    const subscriptionData = {
        ownerId: userId,
        ownerName: owner.data().businessName || owner.data().fullName,
        plan: planKey,
        status: 'Active',
        startDate: Timestamp.fromDate(now),
        expiryDate: Timestamp.fromDate(expiryDate),
    };

    try {
        const subsQuery = query(collection(db, 'subscriptions'), where('ownerId', '==', userId));
        const existingSubSnapshot = await getDocs(subsQuery);

        if (!existingSubSnapshot.empty) {
            const subDocRef = existingSubSnapshot.docs[0].ref;
            await updateDoc(subDocRef, subscriptionData);
        } else {
            await addDoc(collection(db, 'subscriptions'), subscriptionData);
        }

        // Also update the summary on the rideOwners document
        await updateDoc(doc(db, 'rideOwners', userId), { plan: planKey, status: 'Active' });
        
        return { success: true };

    } catch (error) {
        console.error("Error activating subscription: ", error);
        return { success: false, message: 'Failed to update subscription in database.' };
    }
}
