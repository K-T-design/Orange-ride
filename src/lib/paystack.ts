
'use server';

import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { plans } from '@/lib/data';

type PlanKey = keyof typeof plans;

interface InitializePaymentResponse {
    status: boolean;
    message: string;
    data?: {
        authorization_url: string;
        access_code: string;
        reference: string;
    };
}

export async function initializePayment(plan: PlanKey, userId: string): Promise<InitializePaymentResponse> {
    if (plan === 'None') {
        return { status: false, message: 'Cannot initialize payment for a free plan.' };
    }

    const planDetails = plans[plan];
    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
        throw new Error('Paystack secret key is not configured.');
    }
    
    try {
        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
            throw new Error('User not found.');
        }
        const userEmail = userDoc.data().email;

        const response = await fetch('https://api.paystack.co/transaction/initialize', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${secretKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: userEmail,
                plan: planDetails.code, // Use the plan code for subscriptions
                metadata: {
                    user_id: userId,
                    plan: plan,
                    cancel_action: 'https://admin.orangerides.com/owner/subscriptions', // ToDo update link
                }
            }),
        });

        const data = await response.json();

        if (!data.status) {
            console.error('Paystack API Error:', data.message);
            throw new Error(data.message);
        }

        return data;

    } catch (error) {
        console.error('Payment initialization failed:', error);
        // In a real app, you'd want more robust error logging here
        throw new Error('Failed to initialize payment with Paystack.');
    }
}


interface VerificationResponse {
  status: boolean;
  message: string;
  data?: any;
}


export async function verifyPayment(reference: string): Promise<VerificationResponse> {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
        throw new Error('Paystack secret key is not configured.');
    }
    
    try {
        const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: {
                Authorization: `Bearer ${secretKey}`,
            },
        });
        
        const data = await response.json();
        
        if (data.status && data.data.status === 'success') {
            const { metadata } = data.data;
            const userId = metadata.user_id;
            const plan = metadata.plan as PlanKey;

            await activateSubscription(userId, plan, reference);
            
            return { status: true, message: "Payment verified successfully", data: data.data };
        } else {
            return { status: false, message: data.message || "Payment verification failed" };
        }
    } catch (error) {
        console.error("Verification error:", error);
        throw new Error("Failed to verify payment with Paystack.");
    }
}

export async function activateSubscription(userId: string, plan: PlanKey, reference: string) {
    if (!userId || !plan) {
        throw new Error("User ID and Plan are required to activate subscription.");
    }

    const ownerDocRef = doc(db, 'rideOwners', userId);
    const ownerDoc = await getDoc(ownerDocRef);
    if (!ownerDoc.exists()) {
        throw new Error("Ride owner not found.");
    }

    const now = new Date();
    let expiryDate = new Date(now);
    if (plan === 'Weekly') expiryDate.setDate(now.getDate() + 7);
    if (plan === 'Monthly') expiryDate.setMonth(now.getMonth() + 1);
    if (plan === 'Yearly') expiryDate.setFullYear(now.getFullYear() + 1);

    const subscriptionData = {
        ownerId: userId,
        ownerName: ownerDoc.data().name,
        plan,
        status: 'Active',
        startDate: Timestamp.fromDate(now),
        expiryDate: Timestamp.fromDate(expiryDate),
        paymentReference: reference,
        lastUpdatedAt: serverTimestamp(),
    };
    
    // In a real scenario, you'd query for an existing subscription to update it.
    // For this implementation, we'll add a new one, but a more robust system would update or archive old ones.
    await addDoc(collection(db, 'subscriptions'), subscriptionData);
    
    // Also update the plan on the rideOwners document for quick access
    await updateDoc(ownerDocRef, { plan: plan, status: 'Active' });
}
