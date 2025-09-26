'use server';

import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { plans } from '@/lib/data';
import type { PlanKey } from '@/lib/types';
import { headers } from 'next/headers';

type PaystackInitResponse = {
    status: boolean;
    message: string;
    data: {
        authorization_url: string;
        access_code: string;
        reference: string;
    };
}

/**
 * Initializes a one-time payment transaction with Paystack.
 *
 * @param planKey The selected plan identifier ('Weekly', 'Monthly', 'Yearly').
 * @param userId The Firebase UID of the user making the payment.
 * @param userEmail The email address of the user.
 * @returns An object containing the success status and either the authorization URL or an error message.
 */
export async function initializePayment(planKey: PlanKey, userId: string, userEmail: string) {
    // 1. Get plan details from our centralized data file.
    const planDetails = plans[planKey];
    if (!planDetails || planDetails.price === 0) {
        return { success: false, message: 'Invalid subscription plan selected.' };
    }

    // 2. The amount must be in the smallest currency unit (kobo).
    const amountInKobo = planDetails.price * 100;

    // 3. Define the callback URL where Paystack will redirect the user after payment.
    const host = headers().get('host');
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const callback_url = `${protocol}://${host}/owner/subscriptions/verify`;
    
    // 4. Construct the request payload for Paystack.
    const payload = {
        email: userEmail,
        amount: amountInKobo,
        callback_url,
        metadata: {
            user_id: userId,
            plan: planKey,
        },
    };

    try {
        // 5. Make the secure, server-to-server API call to Paystack.
        const response = await fetch('https://api.paystack.co/transaction/initialize', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const data: PaystackInitResponse = await response.json();

        if (!response.ok || !data.status) {
            console.error('Paystack API Error:', data);
            throw new Error(data.message || 'Failed to initialize payment.');
        }

        // 6. Return the secure payment URL.
        return {
            success: true,
            url: data.data.authorization_url,
        };

    } catch (error) {
        console.error('Detailed Paystack API Error:', error);
        return { success: false, message: 'Could not connect to the payment gateway. Please try again later.' };
    }
}
