
'use client';

import { useEffect, useState } from "react";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type Owner = {
  id: string;
  name: string;
  contact: string;
  plan: string;
  status: string;
};

const getStatusVariant = (status: string) => {
    switch (status) {
        case 'Active': return 'default';
        case 'Suspended': return 'destructive';
        case 'Pending Approval': return 'secondary';
        default: return 'outline';
    }
}

export default function ManageOwnersPage() {
    const [owners, setOwners] = useState<Owner[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "rideOwners"), (snapshot) => {
            const ownersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Owner));
            setOwners(ownersData);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <div className="flex flex-col gap-8">
            <h1 className="text-3xl font-bold font-headline">Manage Ride Owners</h1>

             <Card>
                <CardHeader>
                    <CardTitle>All Ride Owners</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                         <div className="space-y-4">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    ) : owners.length === 0 ? (
                        <div className="text-center py-12">
                            <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-medium">No ride owners found</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                As new ride owners sign up, they will appear here.
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Contact Info</TableHead>
                                    <TableHead>Subscription Plan</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {owners.map((owner) => (
                                    <TableRow key={owner.id}>
                                        <TableCell className="font-medium">{owner.name}</TableCell>
                                        <TableCell>{owner.contact}</TableCell>
                                        <TableCell>{owner.plan}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(owner.status)}>{owner.status}</Badge>
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
                                                    <DropdownMenuItem>View Details</DropdownMenuItem>
                                                    <DropdownMenuItem>Approve</DropdownMenuItem>
                                                    <DropdownMenuItem>Suspend</DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
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
