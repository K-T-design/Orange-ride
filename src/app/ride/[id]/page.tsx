
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { doc, getDoc, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Ride } from '@/lib/types';

import { RideDetailsClient } from '@/components/ride-details-client';
import { Skeleton } from '@/components/ui/skeleton';


async function getRideDetails(rideId: string): Promise<Ride | null> {
    if (!rideId) return null;

    try {
        const listingRef = doc(db, 'listings', rideId);
        const listingSnap = await getDoc(listingRef);

        if (!listingSnap.exists()) {
            return null;
        }

        const listingData = listingSnap.data() as DocumentData;
        let ownerContact = listingData.contact || { phone: '', whatsapp: '', email: '' };

        // If ownerId exists, fetch owner's document for the most up-to-date contact info
        if (listingData.ownerId) {
            const ownerRef = doc(db, 'rideOwners', listingData.ownerId);
            const ownerSnap = await getDoc(ownerRef);
            if (ownerSnap.exists()) {
                const ownerDocData = ownerSnap.data();
                // Override listing contact with owner's primary contact if available
                ownerContact.phone = ownerDocData.contact || ownerContact.phone;
                ownerContact.email = ownerDocData.email || ownerContact.email;
            }
        }

        return {
            id: listingSnap.id,
            name: listingData.name || 'Unnamed Ride',
            type: listingData.type || 'Car',
            price: listingData.price || 0,
            pickup: listingData.pickup || 'N/A',
            destination: listingData.destination || 'N/A',
            owner: {
                name: listingData.owner || 'Information unavailable',
                contact: ownerContact,
            },
            image: listingData.image || '',
            isPromoted: listingData.isPromoted || false,
            schedule: listingData.schedule || 'Not specified',
            capacity: listingData.capacity,
            description: listingData.description
        } as Ride;

    } catch (error) {
        console.error("Error fetching ride details:", error);
        return null;
    }
}


const RideDetailsSkeleton = () => (
    <div className="container mx-auto max-w-5xl px-4 py-8">
        <Skeleton className="h-10 w-48 mb-6" />
        <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="aspect-[4/3] w-full rounded-lg" />
            <div className="space-y-6">
                <div className="space-y-2">
                    <Skeleton className="h-6 w-1/4" />
                    <Skeleton className="h-12 w-3/4" />
                    <Skeleton className="h-10 w-1/2" />
                </div>
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        </div>
        <div className="mt-12">
            <Skeleton className="h-8 w-1/3 mb-4" />
            <div className="space-y-2">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-2/3" />
            </div>
        </div>
    </div>
);


export default async function RideDetailsPage({ params }: { params: { id: string } }) {
    const ride = await getRideDetails(params.id);

    if (!ride) {
        notFound();
    }
    
    return (
        <Suspense fallback={<RideDetailsSkeleton />}>
            <RideDetailsClient ride={ride} />
        </Suspense>
    )
}
