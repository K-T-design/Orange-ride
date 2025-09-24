
'use client';

import { useEffect, useState } from "react";
import { collection, onSnapshot, doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, CreditCard, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";

type Subscription = {
  id: string;
  ownerName: string;
  plan: 'Weekly' | 'Monthly' | 'Yearly';
  startDate: Timestamp;
  expiryDate: Timestamp;
  status: 'Active' | 'Expired';
};

const getStatusVariant = (status: string) => {
    switch (status) {
        case 'Active': return 'default';
        case 'Expired': return 'destructive';
        default: return 'outline';
    }
}

const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return 'N/A';
    return format(timestamp.toDate(), 'PPP');
}

export default function ManageSubscriptionsPage() {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "subscriptions"), (snapshot) => {
            const subsData = snapshot.docs.map(doc => {
                const data = doc.data();
                const now = Timestamp.now();
                let status: 'Active' | 'Expired' = 'Active';

                if (data.expiryDate && data.expiryDate < now) {
                    status = 'Expired';
                    // Auto-update status in Firestore if it's not already expired
                    if (data.status !== 'Expired') {
                        updateDoc(doc.ref, { status: 'Expired' });
                    }
                }
                
                return { id: doc.id, ...data, status } as Subscription;
            });
            setSubscriptions(subsData);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Placeholder for actions
    const handleAction = (subId: string, action: string) => {
        toast({
            title: "Action Triggered",
            description: `Triggered '${action}' for subscription ${subId}. Implementation pending.`,
        });
    }

    return (
        <div className="flex flex-col gap-8">
            <h1 className="text-3xl font-bold font-headline">Manage Subscriptions</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Owner Subscriptions</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : subscriptions.length === 0 ? (
                         <div className="text-center py-12">
                            <CreditCard className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-medium">No subscriptions found</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                When ride owners subscribe, their plans will appear here.
                            </p>
                        </div>
                    ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Owner</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead>Start Date</TableHead>
                                <TableHead>Expiry Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {subscriptions.map((sub) => (
                                <TableRow key={sub.id}>
                                    <TableCell className="font-medium">{sub.ownerName}</TableCell>
                                    <TableCell>{sub.plan}</TableCell>
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
                                                <DropdownMenuItem onSelect={() => handleAction(sub.id, 'Extend')}>Extend</DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => handleAction(sub.id, 'Upgrade')}>Upgrade Plan</DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => handleAction(sub.id, 'Downgrade')}>Downgrade Plan</DropdownMenuItem>
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
        </div>
    );
}

