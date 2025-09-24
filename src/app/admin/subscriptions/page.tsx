
'use client';

import { useEffect, useState } from "react";
import { collection, onSnapshot, doc, updateDoc, Timestamp, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, CreditCard, Loader2, PlusCircle, Ban, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Owner = {
  id: string;
  name: string;
};

type Listing = {
  id: string;
  ownerId: string;
}

type Subscription = {
  id: string;
  ownerId: string;
  ownerName: string;
  plan: 'Weekly' | 'Monthly' | 'Yearly';
  startDate: Timestamp;
  expiryDate: Timestamp;
  status: 'Active' | 'Expired' | 'Suspended';
  listingsUsed: number;
  listingsLimit: number | 'Unlimited';
};

const planLimits = {
  'Weekly': 9,
  'Monthly': 50,
  'Yearly': 'Unlimited'
};

const getStatusVariant = (status: string) => {
    switch (status) {
        case 'Active': return 'default';
        case 'Expired': return 'destructive';
        case 'Suspended': return 'secondary';
        default: return 'outline';
    }
}

const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return 'N/A';
    return format(timestamp.toDate(), 'PPP');
}

export default function ManageSubscriptionsPage() {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [owners, setOwners] = useState<Owner[]>([]);
    const [listings, setListings] = useState<Listing[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'All' | 'Active' | 'Expired' | 'Suspended'>('All');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentSub, setCurrentSub] = useState<Partial<Subscription> | null>(null);

    const { toast } = useToast();

    // This function creates a notification in Firestore
    const createNotification = async (message: string, eventType: string, ownerName?: string, plan?: string) => {
        try {
            await addDoc(collection(db, 'notifications'), {
                message,
                ownerName: ownerName || 'System',
                plan: plan || 'N/A',
                eventType,
                createdAt: serverTimestamp(),
                read: false
            });
        } catch (error) {
            console.error("Failed to create notification:", error);
        }
    };


    useEffect(() => {
        const unsubOwners = onSnapshot(collection(db, "rideOwners"), (snapshot) => {
            setOwners(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Owner)));
        });
        
        const unsubListings = onSnapshot(collection(db, "listings"), (snapshot) => {
            const listingsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing));
            setListings(listingsData);
        });

        const unsubSubscriptions = onSnapshot(query(collection(db, "subscriptions")), async (snapshot) => {
            const subsDataPromises = snapshot.docs.map(async (doc) => {
                const data = doc.data();
                
                // Don't auto-update status if it's manually suspended
                if (data.status === 'Suspended') {
                    return { id: doc.id, ...data } as Subscription;
                }
                
                const now = Timestamp.now();
                let status = data.status;

                // Check for expiry if it's currently active
                if (data.status === 'Active' && data.expiryDate && data.expiryDate < now) {
                    status = 'Expired';
                    // Update status in Firestore and create notification
                    await updateDoc(doc.ref, { status: 'Expired' });
                    await createNotification(
                        `Subscription for ${data.ownerName} has expired.`,
                        'subscription_expired',
                        data.ownerName,
                        data.plan
                    );
                }
                
                return { id: doc.id, ...data, status } as Subscription;
            });
            
            const subsData = await Promise.all(subsDataPromises);
            setSubscriptions(subsData);
            setIsLoading(false);
        });

        return () => {
            unsubOwners();
            unsubListings();
            unsubSubscriptions();
        };
    }, []);

    const handleOpenDialog = (sub: Partial<Subscription> | null = null) => {
        setCurrentSub(sub);
        setIsDialogOpen(true);
    };

    const handleUpdateStatus = async (sub: Subscription, newStatus: 'Suspended' | 'Reactivated') => {
        const subRef = doc(db, 'subscriptions', sub.id);
        try {
            if (newStatus === 'Suspended') {
                await updateDoc(subRef, { status: 'Suspended' });
                await createNotification(
                    `Subscription for ${sub.ownerName} has been suspended.`,
                    'subscription_suspended',
                    sub.ownerName,
                    sub.plan
                );
                toast({ title: "Subscription Suspended" });
            } else { // Reactivating
                const isExpired = sub.expiryDate.toDate() < new Date();
                const finalStatus = isExpired ? 'Expired' : 'Active';
                await updateDoc(subRef, { status: finalStatus });
                toast({ title: "Subscription Reactivated", description: `Status set to ${finalStatus}.` });
            }
        } catch (error) {
            console.error("Error updating subscription status:", error);
            toast({ variant: 'destructive', title: "Update Failed" });
        }
    };


    const handleSaveSubscription = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const ownerId = formData.get('ownerId') as string;
        const plan = formData.get('plan') as 'Weekly' | 'Monthly' | 'Yearly';

        if (!ownerId || !plan) {
            toast({ variant: "destructive", title: "Owner and Plan are required." });
            return;
        }

        const selectedOwner = owners.find(o => o.id === ownerId);
        if (!selectedOwner) return;

        const now = new Date();
        let expiryDate = new Date(now);
        if (plan === 'Weekly') expiryDate.setDate(now.getDate() + 7);
        if (plan === 'Monthly') expiryDate.setMonth(now.getMonth() + 1);
        if (plan === 'Yearly') expiryDate.setFullYear(now.getFullYear() + 1);

        const subData = {
            ownerId: selectedOwner.id,
            ownerName: selectedOwner.name,
            plan,
            status: 'Active',
            startDate: Timestamp.fromDate(now),
            expiryDate: Timestamp.fromDate(expiryDate),
        };

        try {
            if (currentSub && currentSub.id) { // Editing
                await updateDoc(doc(db, 'subscriptions', currentSub.id), subData);
                toast({ title: "Subscription Updated" });
            } else { // Adding
                await addDoc(collection(db, 'subscriptions'), subData);
                toast({ title: "Subscription Assigned" });
            }
            setIsDialogOpen(false);
            setCurrentSub(null);
        } catch (error) {
            console.error("Error saving subscription:", error);
            toast({ variant: 'destructive', title: "Save Failed" });
        }
    };

    const filteredSubscriptions = subscriptions.filter(sub => {
        if (filter === 'All') return true;
        return sub.status === filter;
    }).map(sub => {
        const listingsUsed = listings.filter(l => l.ownerId === sub.ownerId).length;
        const listingsLimit = planLimits[sub.plan];
        return { ...sub, listingsUsed, listingsLimit };
    });

    return (
        <div className="flex flex-col gap-8">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Owner Subscriptions</CardTitle>
                        <div className="flex items-center gap-4">
                            <div className="flex gap-2">
                               <Button variant={filter === 'All' ? 'default' : 'outline'} onClick={() => setFilter('All')}>All</Button>
                               <Button variant={filter === 'Active' ? 'default' : 'outline'} onClick={() => setFilter('Active')}>Active</Button>
                               <Button variant={filter === 'Suspended' ? 'default' : 'outline'} onClick={() => setFilter('Suspended')}>Suspended</Button>
                               <Button variant={filter === 'Expired' ? 'default' : 'outline'} onClick={() => setFilter('Expired')}>Expired</Button>
                            </div>
                            <Button onClick={() => handleOpenDialog()}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Assign Plan
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : filteredSubscriptions.length === 0 ? (
                         <div className="text-center py-12">
                            <CreditCard className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-medium">No subscriptions found</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {filter === 'All' ? 'Assign a subscription to get started.' : `No ${filter.toLowerCase()} subscriptions.`}
                            </p>
                        </div>
                    ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Owner</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead>Listings</TableHead>
                                <TableHead>Start Date</TableHead>
                                <TableHead>Expiry Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredSubscriptions.map((sub) => (
                                <TableRow key={sub.id}>
                                    <TableCell className="font-medium">{sub.ownerName}</TableCell>
                                    <TableCell>{sub.plan}</TableCell>
                                    <TableCell>{sub.listingsUsed} / {sub.listingsLimit}</TableCell>
                                    <TableCell>{formatDate(sub.startDate)}</TableCell>
                                    <TableCell>{formatDate(sub.expiryDate)}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(sub.status)}>{sub.status}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Toggle menu</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                {sub.status !== 'Suspended' && (
                                                    <DropdownMenuItem onSelect={() => handleOpenDialog(sub)}>Edit Plan</DropdownMenuItem>
                                                )}
                                                {sub.status === 'Active' && (
                                                    <DropdownMenuItem onSelect={() => handleUpdateStatus(sub, 'Suspended')}>
                                                        <Ban className="mr-2 h-4 w-4" />
                                                        Suspend
                                                    </DropdownMenuItem>
                                                )}
                                                {sub.status === 'Suspended' && (
                                                    <DropdownMenuItem onSelect={() => handleUpdateStatus(sub, 'Reactivated')}>
                                                        <CheckCircle className="mr-2 h-4 w-4" />
                                                        Reactivate
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{currentSub?.id ? 'Edit' : 'Assign'} Subscription</DialogTitle>
                        <DialogDescription>
                           {currentSub?.id ? 'Change the plan for this owner.' : 'Assign a new subscription plan to a ride owner.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSaveSubscription} className="space-y-4">
                         <div className="space-y-2">
                            <Label htmlFor="ownerId">Ride Owner</Label>
                            <Select name="ownerId" defaultValue={currentSub?.ownerId} required disabled={!!currentSub?.id}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select an owner" />
                                </SelectTrigger>
                                <SelectContent>
                                    {owners.map(owner => (
                                        <SelectItem key={owner.id} value={owner.id}>{owner.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="plan">Subscription Plan</Label>
                            <Select name="plan" defaultValue={currentSub?.plan} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a plan" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Weekly">Weekly (₦10,000)</SelectItem>
                                    <SelectItem value="Monthly">Monthly (₦30,000)</SelectItem>
                                    <SelectItem value="Yearly">Yearly (₦120,000)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                            <Button type="submit">Save</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

    
