
'use client';

import { useEffect, useState } from "react";
import { collection, onSnapshot, doc, updateDoc, serverTimestamp, query, where, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, Flag, AlertTriangle, CheckCircle, Trash2, UserX } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { format } from 'date-fns';
import { DocumentData } from "firebase/firestore";

type Report = {
  id: string;
  listingId: string;
  reason: string;
  reporterName?: string;
  reporterEmail?: string;
  notes?: string;
  status: 'Pending' | 'Reviewed' | 'Resolved';
  dateReported: any;
};

const getStatusVariant = (status: string) => {
    switch (status) {
        case 'Pending': return 'destructive';
        case 'Reviewed': return 'secondary';
        case 'Resolved': return 'default';
        default: return 'outline';
    }
}

const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    return format(timestamp.toDate(), 'PPP');
}

export default function ReportsPage() {
    const [reports, setReports] = useState<Report[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'All' | 'Pending' | 'Reviewed' | 'Resolved'>('All');
    const { toast } = useToast();

    useEffect(() => {
        let q;
        const reportsCollection = collection(db, "reports");
        if (filter !== 'All') {
            q = query(reportsCollection, where("status", "==", filter));
        } else {
            q = query(reportsCollection);
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const reportsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
            setReports(reportsData);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [filter]);

    const handleUpdateStatus = async (reportId: string, newStatus: 'Reviewed' | 'Resolved') => {
        const reportRef = doc(db, 'reports', reportId);
        try {
            await updateDoc(reportRef, { status: newStatus });
            toast({ title: "Report Status Updated" });
        } catch (error) {
            toast({ variant: 'destructive', title: "Update Failed" });
        }
    };
    
    const handleSuspendListing = async (listingId: string) => {
        const listingRef = doc(db, 'listings', listingId);
        try {
            await updateDoc(listingRef, { status: 'Suspended' });
            toast({ title: "Listing Suspended", description: `Listing ${listingId} has been suspended.`});
        } catch (error) {
             toast({ variant: 'destructive', title: "Failed to Suspend Listing" });
        }
    };

    const handleSuspendOwner = async (listingId: string) => {
        try {
            // 1. Get the listing to find the owner
            const listingRef = doc(db, 'listings', listingId);
            const listingSnap = await getDoc(listingRef);

            if (!listingSnap.exists()) {
                toast({ variant: 'destructive', title: 'Listing not found.' });
                return;
            }

            const listingData = listingSnap.data() as DocumentData;
            const ownerId = listingData.ownerId;

            if (!ownerId) {
                toast({ variant: 'destructive', title: 'No owner assigned to this listing.' });
                return;
            }

            // 2. Update the owner's status
            const ownerRef = doc(db, 'rideOwners', ownerId);
            await updateDoc(ownerRef, { status: 'Suspended' });

            toast({
                title: 'Owner Suspended',
                description: `The owner has been successfully suspended.`,
            });
            
        } catch (error) {
            console.error("Error suspending owner: ", error);
            toast({ variant: 'destructive', title: 'Failed to Suspend Owner' });
        }
    };

    return (
        <div className="flex flex-col gap-8">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Reports & Moderation</CardTitle>
                         <div className="flex items-center gap-4">
                            <Button variant={filter === 'All' ? 'default' : 'outline'} onClick={() => setFilter('All')}>All</Button>
                            <Button variant={filter === 'Pending' ? 'default' : 'outline'} onClick={() => setFilter('Pending')}>Pending</Button>
                            <Button variant={filter === 'Reviewed' ? 'default' : 'outline'} onClick={() => setFilter('Reviewed')}>Reviewed</Button>
                            <Button variant={filter === 'Resolved' ? 'default' : 'outline'} onClick={() => setFilter('Resolved')}>Resolved</Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                         <div className="space-y-4">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    ) : reports.length === 0 ? (
                        <div className="text-center py-12">
                            <Flag className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-medium">No reports found</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                No reports match the current filter.
                            </p>
                        </div>
                    ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Listing ID</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead>Reported By</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reports.map((report) => (
                                <TableRow key={report.id}>
                                    <TableCell className="font-medium">
                                        <Button variant="link" asChild className="p-0 h-auto">
                                             <Link href={`/admin/listings/edit/${report.listingId}`} target="_blank">
                                                {report.listingId}
                                            </Link>
                                        </Button>
                                    </TableCell>
                                    <TableCell>{report.reason}</TableCell>
                                    <TableCell>{report.reporterName || report.reporterEmail || 'Anonymous'}</TableCell>
                                    <TableCell>{formatDate(report.dateReported)}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(report.status)}>{report.status}</Badge>
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
                                                <DropdownMenuItem onSelect={() => handleUpdateStatus(report.id, 'Reviewed')} disabled={report.status === 'Reviewed' || report.status === 'Resolved'}>
                                                    <CheckCircle className="mr-2"/> Mark as Reviewed
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => handleUpdateStatus(report.id, 'Resolved')} disabled={report.status === 'Resolved'}>
                                                    <CheckCircle className="mr-2 text-green-500" /> Mark as Resolved
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onSelect={() => handleSuspendListing(report.listingId)}>
                                                    <AlertTriangle className="mr-2" /> Suspend Listing
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => handleSuspendOwner(report.listingId)}>
                                                    <UserX className="mr-2" /> Suspend Owner
                                                </DropdownMenuItem>
                                                <DropdownMenuItem disabled>
                                                    <Trash2 className="mr-2" /> Delete Report
                                                </DropdownMenuItem>
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
    