
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp, DocumentData, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { ListingForm } from '@/components/admin/listing-form';
import type { ListingFormData } from '@/components/admin/listing-form';
import { Skeleton } from '@/components/ui/skeleton';
import { planLimits } from '@/lib/data';

export default function EditListingPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialData, setInitialData] = useState<ListingFormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const listingId = params.id as string;

  useEffect(() => {
    if (!listingId) return;

    const fetchListing = async () => {
      try {
        const listingRef = doc(db, 'listings', listingId);
        const docSnap = await getDoc(listingRef);

        if (docSnap.exists()) {
            const data = docSnap.data() as DocumentData;
            const modelYear = data.model ? data.model.split(' ').pop() : '';
            
            setInitialData({
                name: data.name || '',
                type: data.type || '',
                location: data.pickup || '',
                price: data.price || 0,
                phone: data.contact?.phone || '',
                whatsapp: data.contact?.whatsapp || '',
                schedule: data.schedule || '',
                capacity: data.capacity || 1,
                modelYear: modelYear,
                ownerId: data.ownerId || '',
                companyName: data.ownerId ? '' : data.owner,
                description: data.description || '',
                altContact: data.altContact || '',
                image: data.image || null, // You might need to handle image URL fetching differently
            });

        } else {
          toast({ variant: 'destructive', title: 'Listing not found' });
          router.push('/admin/listings');
        }
      } catch (error) {
        console.error("Error fetching listing:", error);
        toast({ variant: 'destructive', title: 'Failed to fetch listing' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchListing();
  }, [listingId, router, toast]);

  async function handleUpdateListing(values: ListingFormData) {
    setIsSubmitting(true);
    try {
      // If owner is changed, check their subscription limit
      if (values.ownerId && values.ownerId !== initialData?.ownerId) {
        const ownerId = values.ownerId;
        const ownerRef = doc(db, 'rideOwners', ownerId);
        const ownerSnap = await getDoc(ownerRef);
        const ownerName = ownerSnap.exists() ? ownerSnap.data().name : 'Unknown Owner';

        const subQuery = query(collection(db, 'subscriptions'), where('ownerId', '==', ownerId));
        const subSnapshot = await getDocs(subQuery);

        if (subSnapshot.empty || subSnapshot.docs[0].data().status !== 'Active') {
          toast({
            variant: 'destructive',
            title: 'Action Blocked',
            description: `${ownerName} does not have an active subscription.`,
          });
          setIsSubmitting(false);
          return;
        }

        const subscription = subSnapshot.docs[0].data();
        const plan = subscription.plan as keyof typeof planLimits;
        const limit = planLimits[plan];

        if (limit !== Infinity) {
          const listingsQuery = query(collection(db, 'listings'), where('ownerId', '==', ownerId));
          const listingsSnapshot = await getDocs(listingsQuery);
          const currentListingsCount = listingsSnapshot.size;

          if (currentListingsCount >= limit) {
            toast({
              variant: 'destructive',
              title: 'Listing Limit Reached',
              description: `${ownerName} has reached the maximum of ${limit} listings for their ${plan} plan.`,
            });
            setIsSubmitting(false);
            return;
          }
        }
      }
      
      const listingRef = doc(db, 'listings', listingId);
      
      await updateDoc(listingRef, {
        name: values.name,
        type: values.type,
        pickup: values.location,
        price: values.price,
        'contact.phone': values.phone,
        'contact.whatsapp': values.whatsapp,
        schedule: values.schedule,
        capacity: values.capacity,
        model: `${values.name} ${values.modelYear}`,
        ownerId: values.ownerId || null,
        owner: values.ownerId ? (await getDoc(doc(db, 'rideOwners', values.ownerId))).data()?.name : values.companyName || 'Admin',
        description: values.description,
        altContact: values.altContact,
        // Image update logic would go here
        lastEditedAt: serverTimestamp(),
      });

      toast({
        title: 'Listing Updated',
        description: 'The vehicle details have been successfully saved.',
      });
      router.push('/admin/listings');
    } catch (error) {
      console.error('Error updating document: ', error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'Could not save changes. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const PageSkeleton = () => (
      <div className="space-y-8">
           <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10" />
                <Skeleton className="h-9 w-64" />
            </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                  <Skeleton className="h-64 w-full" />
                  <Skeleton className="h-64 w-full" />
              </div>
              <div className="space-y-8">
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-64 w-full" />
              </div>
          </div>
      </div>
  )


  if (isLoading) {
    return (
        <div className="flex flex-col gap-8">
            <PageSkeleton />
        </div>
    );
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
            <h1 className="text-3xl font-bold font-headline">Edit Vehicle Listing</h1>
        </div>

        {initialData ? (
             <ListingForm
                onSubmit={handleUpdateListing}
                isSubmitting={isSubmitting}
                initialData={initialData}
                submitButtonText="Save Changes"
            />
        ) : (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )}
    </div>
  );
}
