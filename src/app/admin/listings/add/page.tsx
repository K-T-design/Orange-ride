
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc } from 'firebase/firestore';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ListingForm } from '@/components/admin/listing-form';
import type { ListingFormData } from '@/components/admin/listing-form';
import { rideOwners, planLimits } from '@/lib/data'; // Assuming rideOwners and planLimits are in data
import { useState } from 'react';


export default function AddListingPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function handleAddListing(values: ListingFormData) {
    setIsSubmitting(true);
    try {
        // If an owner is selected, check their subscription limit
        if (values.ownerId) {
            const ownerId = values.ownerId;
            const selectedOwner = rideOwners.find(o => o.id === ownerId);

            // 1. Find the owner's subscription
            const subQuery = query(collection(db, 'subscriptions'), where('ownerId', '==', ownerId));
            const subSnapshot = await getDocs(subQuery);

            if (subSnapshot.empty) {
                toast({
                    variant: 'destructive',
                    title: 'Action Blocked',
                    description: 'This owner does not have an active subscription. Cannot add listing.',
                });
                setIsSubmitting(false);
                return;
            }

            const subscription = subSnapshot.docs[0].data();

            if (subscription.status === 'Suspended') {
                toast({
                    variant: 'destructive',
                    title: 'Subscription Suspended',
                    description: 'This owner\'s subscription is suspended. They cannot add new listings.',
                });
                setIsSubmitting(false);
                return;
            }

            if (subscription.status !== 'Active') {
                 toast({
                    variant: 'destructive',
                    title: 'Action Blocked',
                    description: 'This owner does not have an active subscription. Cannot add listing.',
                });
                setIsSubmitting(false);
                return;
            }

            const plan = subscription.plan as keyof typeof planLimits;
            const limit = planLimits[plan];

            if (limit !== Infinity) {
                // 2. Count owner's current listings
                const listingsQuery = query(collection(db, 'listings'), where('ownerId', '==', ownerId));
                const listingsSnapshot = await getDocs(listingsQuery);
                const currentListingsCount = listingsSnapshot.size;

                 // 3. Enforce the limit
                if (currentListingsCount >= limit) {
                    const errorMsg = `This owner has reached the maximum of ${limit} listings for their ${plan} plan. Please upgrade their plan to add more.`;
                    toast({
                        variant: 'destructive',
                        title: 'Listing Limit Reached',
                        description: errorMsg,
                    });
                    
                    // Create a notification for the admin
                    await addDoc(collection(db, 'notifications'), {
                        message: `Listing limit reached for ${selectedOwner?.name} on ${plan} plan.`,
                        ownerName: selectedOwner?.name,
                        plan: plan,
                        eventType: 'limit_reached',
                        createdAt: serverTimestamp(),
                        read: false
                    });

                    setIsSubmitting(false);
                    return;
                }
                
                // 4. Check for 80% warning
                const usagePercentage = (currentListingsCount + 1) / limit;
                if (usagePercentage >= 0.8) {
                     await addDoc(collection(db, 'notifications'), {
                        message: `${selectedOwner?.name} is at ${Math.round(usagePercentage * 100)}% of their listing limit.`,
                        ownerName: selectedOwner?.name,
                        plan: plan,
                        eventType: 'limit_warning',
                        createdAt: serverTimestamp(),
                        read: false
                    });
                }
            }
        }


      // NOTE: In a real app, you'd upload the image to Firebase Storage first
      // and get the download URL. For this demo, we are skipping the upload.
      // const imageUrl = await uploadImage(values.image);
      const selectedOwner = rideOwners.find(o => o.id === values.ownerId);

      await addDoc(collection(db, 'listings'), {
        name: values.name,
        type: values.type,
        pickup: values.location,
        destination: '', // Admin-added listings might not have a fixed destination
        price: values.price,
        owner: selectedOwner?.name || values.companyName || 'Admin',
        ownerId: values.ownerId || null,
        model: `${values.name} ${values.modelYear}`,
        contact: {
            phone: values.phone,
            whatsapp: values.whatsapp,
        },
        schedule: values.schedule,
        capacity: values.capacity,
        description: values.description,
        altContact: values.altContact,
        image: 'sedan-1', // Placeholder
        isPromoted: false,
        status: 'Approved', // Admin-added listings are pre-approved
        postedBy: 'admin',
        createdAt: serverTimestamp(),
      });

      toast({
        title: 'Listing Added',
        description: 'The new vehicle has been successfully added.',
      });
      router.push('/admin/listings');
    } catch (error) {
      console.error('Error adding document: ', error);
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: 'Could not add the vehicle. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
        <div className="flex items-center gap-4">
            <Button asChild variant="outline" size="icon">
                <Link href="/admin/listings">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Back</span>
                </Link>
            </Button>
            <h1 className="text-3xl font-bold font-headline">Add New Vehicle Listing</h1>
        </div>

        <ListingForm
            onSubmit={handleAddListing}
            isSubmitting={isSubmitting}
            submitButtonText="Add Vehicle"
        />
    </div>
  );
}
