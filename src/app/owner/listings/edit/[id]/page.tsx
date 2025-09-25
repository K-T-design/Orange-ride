
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db, storage } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { ListingForm } from '@/components/owner/listing-form';
import type { ListingFormData } from '@/components/owner/listing-form';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

type ListingData = ListingFormData & { image: string | File };

export default function EditListingPage() {
    const [user, loadingAuth] = useAuthState(auth);
    const [initialData, setInitialData] = useState<ListingData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const listingId = params.id as string;

    useEffect(() => {
        if (!user || !listingId) return;

        const fetchListing = async () => {
            try {
                const listingRef = doc(db, 'listings', listingId);
                const docSnap = await getDoc(listingRef);

                if (docSnap.exists() && docSnap.data().ownerId === user.uid) {
                    const data = docSnap.data();
                    setInitialData({
                        name: data.name || '',
                        type: data.type || '',
                        color: data.color || '',
                        registration: data.registration || '',
                        capacity: data.capacity || 1,
                        price: data.price || 0,
                        location: data.pickup || '',
                        schedule: data.schedule || '',
                        phone: data.contact?.phone || '',
                        whatsapp: data.contact?.whatsapp || '',
                        description: data.description || '',
                        altContact: data.altContact || '',
                        image: data.image || '', // This will be the image URL
                    });
                } else {
                    toast({ variant: 'destructive', title: 'Listing not found or access denied.' });
                    router.push('/owner/listings');
                }
            } catch (error) {
                console.error("Error fetching listing:", error);
                toast({ variant: 'destructive', title: 'Failed to fetch listing data.' });
            } finally {
                setIsLoading(false);
            }
        };

        fetchListing();
    }, [user, listingId, router, toast]);

    const uploadImage = async (imageFile: File, userId: string): Promise<string> => {
        const fileRef = ref(storage, `listings/${userId}/${Date.now()}-${imageFile.name}`);
        await uploadBytes(fileRef, imageFile);
        return await getDownloadURL(fileRef);
    };

    async function handleUpdateListing(values: ListingFormData) {
        if (!user || !initialData) return;

        setIsSubmitting(true);
        try {
            let imageUrl = initialData.image as string; // Assume old URL initially
            
            // If a new image file is provided, upload it and delete the old one
            if (values.image instanceof File) {
                imageUrl = await uploadImage(values.image, user.uid);
                
                // Delete the old image from storage if it exists
                if (initialData.image && typeof initialData.image === 'string') {
                    try {
                        const oldImageRef = ref(storage, initialData.image);
                        await deleteObject(oldImageRef);
                    } catch (storageError: any) {
                        // Log if deletion fails but don't block the update
                        if(storageError.code !== 'storage/object-not-found'){
                            console.warn("Could not delete old image:", storageError);
                        }
                    }
                }
            }
            
            const listingRef = doc(db, 'listings', listingId);
            await updateDoc(listingRef, {
                name: values.name,
                type: values.type,
                color: values.color,
                registration: values.registration,
                capacity: values.capacity,
                price: values.price,
                pickup: values.location, // Note: field name in Firestore is pickup
                schedule: values.schedule,
                'contact.phone': values.phone,
                'contact.whatsapp': values.whatsapp,
                description: values.description,
                altContact: values.altContact,
                image: imageUrl,
                status: 'Pending', // Force re-approval on edit
                lastEditedAt: serverTimestamp(),
            });

            toast({
                title: 'Listing Updated',
                description: 'Your changes have been submitted for review.',
            });
            router.push('/owner/listings');

        } catch (error) {
            console.error('Error updating document: ', error);
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: 'Could not save your changes. Please try again.',
            });
        } finally {
            setIsSubmitting(false);
        }
    }
    
    const PageSkeleton = () => (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <div className="space-y-8">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );

    if (isLoading || loadingAuth) {
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
                    <Link href="/owner/listings">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold font-headline">Edit Vehicle Listing</h1>
                    <p className="text-muted-foreground">Update the details of your vehicle. Changes will require re-approval.</p>
                </div>
            </div>

            {initialData ? (
                 <ListingForm
                    onSubmit={handleUpdateListing}
                    isSubmitting={isSubmitting}
                    isDisabled={false} // Always enable form for editing
                    initialData={initialData}
                    submitButtonText="Save Changes & Resubmit"
                />
            ) : (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            )}
        </div>
    );
}
