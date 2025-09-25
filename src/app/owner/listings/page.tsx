
'use client';

import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { auth, db, storage } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, List, Loader2, MoreHorizontal, Edit, Trash2, Car } from 'lucide-react';
import type { ListingFormData } from '@/components/owner/listing-form';

type Listing = Partial<ListingFormData> & {
    id: string;
    status: 'Pending' | 'Approved' | 'Rejected' | 'Suspended';
    image: string; // URL
};

const getStatusVariant = (status: string) => {
    switch (status) {
        case 'Approved': return 'default';
        case 'Pending': return 'secondary';
        case 'Rejected':
        case 'Suspended':
            return 'destructive';
        default: return 'outline';
    }
};

export default function ManageListingsPage() {
    const [user, loadingAuth] = useAuthState(auth);
    const [listings, setListings] = useState<Listing[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        if (user) {
            const q = query(collection(db, 'listings'), where('ownerId', '==', user.uid));
            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const listingsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing));
                setListings(listingsData);
                setIsLoading(false);
            }, (error) => {
                console.error("Error fetching listings:", error);
                toast({ variant: 'destructive', title: 'Failed to load listings.' });
                setIsLoading(false);
            });

            return () => unsubscribe();
        } else if (!loadingAuth) {
            setIsLoading(false);
        }
    }, [user, loadingAuth, toast]);

    const handleEdit = (listingId: string) => {
        router.push(`/owner/listings/edit/${listingId}`);
    };

    const handleDelete = async (listing: Listing) => {
        try {
            // Delete Firestore document
            await deleteDoc(doc(db, 'listings', listing.id));

            // Delete image from Firebase Storage
            if (listing.image) {
                const imageRef = ref(storage, listing.image);
                await deleteObject(imageRef);
            }

            toast({
                title: 'Listing Deleted',
                description: `"${listing.name}" has been successfully removed.`,
            });

        } catch (error: any) {
            console.error("Error deleting listing:", error);
            // Handle cases where the image URL might be invalid or object doesn't exist
            if (error.code === 'storage/object-not-found') {
                toast({
                    title: 'Listing Deleted',
                    description: 'The listing data was removed, but the associated image was not found in storage.',
                    variant: 'default'
                });
            } else {
                 toast({
                    variant: 'destructive',
                    title: 'Deletion Failed',
                    description: 'Could not delete the listing. Please try again.',
                });
            }
        }
    };
    
    const PageSkeleton = () => (
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-4 w-2/3 mt-2" />
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            </CardContent>
        </Card>
    );

    if (isLoading || loadingAuth) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-10 w-1/4" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <PageSkeleton />
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
             <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline">My Vehicle Listings</h1>
                    <p className="text-muted-foreground">View, edit, or delete your vehicle listings.</p>
                </div>
                <Button asChild>
                    <Link href="/owner/listings/add">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add New Listing
                    </Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Your Fleet</CardTitle>
                    <CardDescription>
                        {listings.length} vehicle(s) listed.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {listings.length === 0 ? (
                        <div className="text-center py-12">
                            <Car className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-medium">No listings yet</h3>
                            <p className="mt-1 text-sm text-muted-foreground">Add a new vehicle to get started.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">Image</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {listings.map((listing) => (
                                    <TableRow key={listing.id}>
                                        <TableCell>
                                            <div className="relative h-12 w-20 rounded-md bg-muted">
                                                <Image src={listing.image} alt={listing.name || 'Vehicle'} layout="fill" className="object-cover rounded-md" />
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">{listing.name}</TableCell>
                                        <TableCell><Badge variant={getStatusVariant(listing.status)}>{listing.status}</Badge></TableCell>
                                        <TableCell>₦{listing.price?.toLocaleString()}</TableCell>
                                        <TableCell>{listing.type}</TableCell>
                                        <TableCell>
                                            <AlertDialog>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onSelect={() => handleEdit(listing.id)}>
                                                            <Edit className="mr-2" /> Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <AlertDialogTrigger asChild>
                                                            <DropdownMenuItem className="text-destructive" onSelect={e => e.preventDefault()}>
                                                                <Trash2 className="mr-2" /> Delete
                                                            </DropdownMenuItem>
                                                        </AlertDialogTrigger>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone. This will permanently delete the listing for "{listing.name}".
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDelete(listing)} className="bg-destructive hover:bg-destructive/90">
                                                            Yes, delete
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
