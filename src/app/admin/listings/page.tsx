
'use client';

import { useEffect, useState } from "react";
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, PlusCircle, Car, CheckCircle, Star, Trash2, Edit } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Listing = {
    id: string;
    type: string;
    model: string;
    price: number;
    owner: string;
    status: 'Pending' | 'Approved' | 'Promoted' | 'Expired';
}

const getStatusVariant = (status: string) => {
    switch (status) {
        case 'Approved': return 'default';
        case 'Promoted': return 'default';
        case 'Pending': return 'secondary';
        case 'Expired': return 'destructive';
        default: return 'outline';
    }
}

export default function ManageListingsPage() {
    const [listings, setListings] = useState<Listing[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "listings"), (snapshot) => {
            const listingsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing));
            setListings(listingsData);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleUpdateStatus = async (listingId: string, newStatus: 'Approved' | 'Promoted') => {
        const listingRef = doc(db, 'listings', listingId);
        try {
            await updateDoc(listingRef, { status: newStatus });
            toast({
                title: "Status Updated",
                description: `Listing has been successfully ${newStatus === 'Approved' ? 'approved' : 'promoted'}.`,
            });
        } catch (error) {
            console.error("Error updating status:", error);
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: "Could not update listing status. Please try again.",
            });
        }
    };

    const handleDeleteListing = async (listingId: string) => {
        const listingRef = doc(db, 'listings', listingId);
        try {
            await deleteDoc(listingRef);
            toast({
                title: "Listing Deleted",
                description: "The listing has been successfully deleted.",
            });
        } catch (error) {
            console.error("Error deleting listing:", error);
            toast({
                variant: "destructive",
                title: "Deletion Failed",
                description: "Could not delete the listing. Please try again.",
            });
        }
    };
    
    const handleEdit = (listingId: string) => {
        router.push(`/admin/listings/edit/${listingId}`);
    };

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold font-headline">Manage Listings</h1>
                <Button asChild>
                    <Link href="/admin/listings/add">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Listing
                    </Link>
                </Button>
            </div>

             <Card>
                <CardHeader>
                    <CardTitle>All Listings</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    ) : listings.length === 0 ? (
                        <div className="text-center py-12">
                            <Car className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-medium">No listings found</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                When ride owners add new listings, they will appear here.
                            </p>
                        </div>
                    ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Vehicle Type</TableHead>
                                <TableHead>Model</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Owner</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {listings.map((listing) => (
                                <TableRow key={listing.id}>
                                    <TableCell>{listing.type}</TableCell>
                                    <TableCell className="font-medium">{listing.model}</TableCell>
                                    <TableCell>₦{listing.price.toLocaleString()}</TableCell>
                                    <TableCell>{listing.owner}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(listing.status)}>{listing.status}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <AlertDialog>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button aria-haspopup="true" size="icon" variant="ghost">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">Toggle menu</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onSelect={() => handleUpdateStatus(listing.id, 'Approved')} disabled={listing.status === 'Approved' || listing.status === 'Promoted'}>
                                                        <CheckCircle /> Approve
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onSelect={() => handleUpdateStatus(listing.id, 'Promoted')} disabled={listing.status === 'Promoted'}>
                                                        <Star /> Promote
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onSelect={() => handleEdit(listing.id)}>
                                                        <Edit /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <AlertDialogTrigger asChild>
                                                        <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                                                            <Trash2 /> Delete
                                                        </DropdownMenuItem>
                                                    </AlertDialogTrigger>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This action cannot be undone. This will permanently delete this vehicle listing.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteListing(listing.id)} className="bg-destructive hover:bg-destructive/90">
                                                        Yes, delete listing
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
