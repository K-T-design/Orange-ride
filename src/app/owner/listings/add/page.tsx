
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db, storage } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { ListingForm } from '@/components/owner/listing-form';
import type { ListingFormData } from '@/components/owner/listing-form';
import { planLimits } from '@/lib/data';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

type OwnerInfo = {
  businessName: string;
  businessType: string;
  plan: keyof typeof planLimits;
  status: string;
};

export default function AddListingPage() {
  const [user, loadingAuth] = useAuthState(auth);
  const [ownerInfo, setOwnerInfo] = useState<OwnerInfo | null>(null);
  const [listingCount, setListingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      const fetchOwnerData = async () => {
        setIsLoading(true);
        try {
          // Fetch owner details (plan, name, etc.)
          const ownerDocRef = doc(db, 'rideOwners', user.uid);
          const ownerDoc = await getDoc(ownerDocRef);

          if (ownerDoc.exists()) {
            const data = ownerDoc.data();
            setOwnerInfo({
              businessName: data.name,
              businessType: data.businessType || 'N/A',
              plan: data.plan || 'None',
              status: data.status,
            });
          } else {
            setOwnerInfo({ businessName: 'Unknown', businessType: 'N/A', plan: 'None', status: 'Inactive' });
          }

          // Fetch current listing count
          const listingsQuery = query(collection(db, 'listings'), where('ownerId', '==', user.uid));
          const listingsSnapshot = await getDocs(listingsQuery);
          setListingCount(listingsSnapshot.size);

        } catch (error) {
          console.error("Error fetching owner data:", error);
          toast({ variant: 'destructive', title: 'Could not fetch your data.' });
        } finally {
          setIsLoading(false);
        }
      };
      fetchOwnerData();
    } else if (!loadingAuth) {
      setIsLoading(false);
    }
  }, [user, loadingAuth, toast]);

  const uploadImage = async (imageFile: File, userId: string): Promise<string> => {
    const fileRef = ref(storage, `listings/${userId}/${Date.now()}-${imageFile.name}`);
    await uploadBytes(fileRef, imageFile);
    const downloadURL = await getDownloadURL(fileRef);
    return downloadURL;
  };

  async function handleAddListing(values: ListingFormData) {
    if (!user || !ownerInfo || !canCreateListing()) {
      toast({
        variant: 'destructive',
        title: 'Action Prohibited',
        description: 'You cannot add a new listing at this time. Please check your subscription status.'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Re-check limit just before submission
      const limit = ownerInfo.plan ? planLimits[ownerInfo.plan] : 0;
      if (limit !== Infinity && listingCount >= limit) {
        toast({
          variant: 'destructive',
          title: 'Listing Limit Reached',
          description: `You have reached the maximum of ${limit} listings for your ${ownerInfo.plan} plan.`,
        });
        setIsSubmitting(false);
        return;
      }

      // 1. Upload image to Firebase Storage
      const imageUrl = await uploadImage(values.image, user.uid);

      // 2. Check for 80% warning
      if (limit !== Infinity) {
        const usagePercentage = (listingCount + 1) / limit;
        if (usagePercentage >= 0.8) {
          await addDoc(collection(db, 'notifications'), {
            message: `${ownerInfo.businessName} is at ${Math.round(usagePercentage * 100)}% of their listing limit.`,
            ownerName: ownerInfo.businessName,
            plan: ownerInfo.plan,
            eventType: 'limit_warning',
            createdAt: serverTimestamp(),
            read: false,
          });
        }
      }
      
      // 3. Save listing to Firestore
      await addDoc(collection(db, 'listings'), {
        name: values.name,
        type: values.type,
        color: values.color,
        registration: values.registration,
        capacity: values.capacity,
        price: values.price,
        pickup: values.location,
        schedule: values.schedule,
        contact: {
          phone: values.phone,
          whatsapp: values.whatsapp,
        },
        altContact: values.altContact,
        description: values.description,
        ownerId: user.uid,
        owner: ownerInfo.businessName,
        businessType: ownerInfo.businessType,
        status: 'Pending',
        postedBy: 'owner',
        isPromoted: false,
        image: imageUrl,
        createdAt: serverTimestamp(),
      });

      toast({
        title: 'Listing Submitted!',
        description: 'Your new vehicle has been submitted for review.',
      });
      router.push('/owner/listings');

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

  const canCreateListing = () => {
    if (isLoading || !ownerInfo) return false;
    if (ownerInfo.status !== 'Active') return false;
    if (!ownerInfo.plan || ownerInfo.plan === 'None') return false;
    const limit = planLimits[ownerInfo.plan];
    if (limit === Infinity) return true;
    return listingCount < limit;
  };

  if (isLoading || loadingAuth) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="space-y-8">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Add New Vehicle Listing</h1>
        <p className="text-muted-foreground">Fill out the details below to add a new ride to your fleet.</p>
      </div>

      {!canCreateListing() && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Cannot Add Listing</AlertTitle>
          <AlertDescription>
            {ownerInfo?.status !== 'Active' ? `Your account is currently ${ownerInfo?.status}. You must be active to add a listing.` :
              (ownerInfo?.plan === 'None' ? "You do not have an active subscription." : "You have reached the listing limit for your current plan.")}
            &nbsp;Please <Button variant="link" asChild className="p-0 h-auto"><Link href="/owner/subscriptions">upgrade your plan</Link></Button> or contact support.
          </AlertDescription>
        </Alert>
      )}

      <ListingForm
        onSubmit={handleAddListing}
        isSubmitting={isSubmitting}
        isDisabled={!canCreateListing()}
        submitButtonText="Submit for Review"
      />
    </div>
  );
}
