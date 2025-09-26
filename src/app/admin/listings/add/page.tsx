
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ListingForm } from '@/components/admin/listing-form';
import type { ListingFormData } from '@/components/admin/listing-form';
import { rideOwners, planLimits } from '@/lib/data'; // Assuming rideOwners and planLimits are in data
import { useState } from 'react';
import { uploadToCloudinary } from '@/lib/cloudinary';


export default function AddListingPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function handleAddListing(values: ListingFormData) {
    setIsSubmitting(true);
    try {
        let ownerName = values.companyName || 'Admin';

        // If an owner is selected, check their subscription limit (unless bypassed)
        if (values.ownerId && !values.bypassLimit) {
            const ownerId = values.ownerId;
            
            const ownerRef = doc(db, 'rideOwners', ownerId);
            const ownerSnap = await getDoc(ownerRef);

            if (!ownerSnap.exists()) {
                 toast({
                    variant: 'destructive',
                    title: 'Owner not found',
                    description: 'The selected owner does not exist.',
                });
                setIsSubmitting(false);
                return;
            }
            
            ownerName = ownerSnap.data().name || 'Unknown Owner';

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
                    const errorMsg = `This owner has reached the maximum of ${limit} listings for their ${plan} plan. Please upgrade their plan or use the bypass option to add more.`;
                    toast({
                        variant: 'destructive',
                        title: 'Listing Limit Reached',
                        description: errorMsg,
                    });
                    
                    // Create a notification for the admin
                    await addDoc(collection(db, 'notifications'), {
                        message: `Attempted to exceed listing limit for ${ownerName} on ${plan} plan.`,
                        ownerName: ownerName,
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
                        message: `${ownerName} is at ${Math.round(usagePercentage * 100)}% of their listing limit.`,
                        ownerName: ownerName,
                        plan: plan,
                        eventType: 'limit_warning',
                        createdAt: serverTimestamp(),
                        read: false
                    });
                }
            }
        } else if (values.ownerId) {
             const ownerRef = doc(db, 'rideOwners', values.ownerId);
             const ownerSnap = await getDoc(ownerRef);
             if (ownerSnap.exists()) {
                ownerName = ownerSnap.data().name || 'Unknown Owner';
             }
        }


      // Upload image to Cloudinary
      const imageFile = values.image as File;
      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64String = buffer.toString('base64');
      const uploadResult = await uploadToCloudinary(base64String, {
        public_id: `listings/admin/${Date.now()}-${imageFile.name}`,
        resource_type: 'image',
      });
      const imageUrl = uploadResult.secure_url;

      await addDoc(collection(db, 'listings'), {
        name: values.name,
        type: values.type,
        pickup: values.location,
        destination: '', // Admin-added listings might not have a fixed destination
        price: values.price,
        owner: ownerName,
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
        image: imageUrl, // Use Cloudinary URL
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
