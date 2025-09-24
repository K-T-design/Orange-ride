
'use client';

import { useEffect, useState } from "react";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, Users, CheckCircle, XCircle, AlertTriangle, Trash2, Edit } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


type Owner = {
  id: string;
  name: string;
  contact: string;
  plan: string;
  status: string;
  lastEditedAt?: any;
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
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [currentOwner, setCurrentOwner] = useState<Owner | null>(null);

    const { toast } = useToast();

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "rideOwners"), (snapshot) => {
            const ownersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Owner));
            setOwners(ownersData);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleUpdateStatus = async (ownerId: string, newStatus: 'Active' | 'Suspended') => {
        const ownerRef = doc(db, 'rideOwners', ownerId);
        try {
            await updateDoc(ownerRef, { status: newStatus, lastEditedAt: serverTimestamp() });
            toast({
                title: "Status Updated",
                description: `Owner has been successfully ${newStatus === 'Active' ? 'activated' : 'suspended'}.`,
            });
        } catch (error) {
            console.error("Error updating status:", error);
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: "Could not update owner status. Please try again.",
            });
        }
    };

    const handleDeleteOwner = async (ownerId: string) => {
        const ownerRef = doc(db, 'rideOwners', ownerId);
        try {
            await deleteDoc(ownerRef);
            toast({
                title: "Owner Deleted",
                description: "The ride owner has been successfully deleted.",
            });
        } catch (error) {
            console.error("Error deleting owner:", error);
            toast({
                variant: "destructive",
                title: "Deletion Failed",
                description: "Could not delete the owner. Please try again.",
            });
        }
    };
    
    const openEditDialog = (owner: Owner) => {
        setCurrentOwner(owner);
        setIsEditDialogOpen(true);
    };

    const handleSaveChanges = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!currentOwner) return;

        const formData = new FormData(e.currentTarget);
        const updatedData = {
            name: formData.get('name') as string,
            contact: formData.get('contact') as string,
            plan: formData.get('plan') as string,
            status: formData.get('status') as string,
            lastEditedAt: serverTimestamp(),
        };

        const ownerRef = doc(db, 'rideOwners', currentOwner.id);
        try {
            await updateDoc(ownerRef, updatedData);
            toast({
                title: "Owner Updated",
                description: "The owner's details have been successfully saved.",
            });
            setIsEditDialogOpen(false);
        } catch (error) {
            console.error("Error updating owner:", error);
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: "Could not save changes. Please try again.",
            });
        }
    };


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
                                            <AlertDialog>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button aria-haspopup="true" size="icon" variant="ghost">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                            <span className="sr-only">Toggle menu</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onSelect={() => openEditDialog(owner)}>
                                                            <Edit /> Edit Owner
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onSelect={() => handleUpdateStatus(owner.id, 'Active')} disabled={owner.status === 'Active'}>
                                                            <CheckCircle /> Approve/Activate
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onSelect={() => handleUpdateStatus(owner.id, 'Suspended')} disabled={owner.status === 'Suspended'}>
                                                            <AlertTriangle/> Suspend
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <AlertDialogTrigger asChild>
                                                            <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                                                                <Trash2/> Delete
                                                            </DropdownMenuItem>
                                                        </AlertDialogTrigger>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone. This will permanently delete the owner and all associated data.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteOwner(owner.id)} className="bg-destructive hover:bg-destructive/90">
                                                            Yes, delete owner
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

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Ride Owner</DialogTitle>
                        <DialogDescription>
                           Make changes to the owner's details here. Click save when you're done.
                        </DialogDescription>
                    </DialogHeader>
                    {currentOwner && (
                        <form onSubmit={handleSaveChanges} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Owner Name</Label>
                                <Input id="name" name="name" defaultValue={currentOwner.name} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contact">Contact Info (Email/Phone)</Label>
                                <Input id="contact" name="contact" defaultValue={currentOwner.contact} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="plan">Subscription Plan</Label>
                                <Select name="plan" defaultValue={currentOwner.plan}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a plan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="None">None</SelectItem>
                                        <SelectItem value="Weekly">Weekly</SelectItem>
                                        <SelectItem value="Monthly">Monthly</SelectItem>
                                        <SelectItem value="Yearly">Yearly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select name="status" defaultValue={currentOwner.status}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Active">Active</SelectItem>
                                        <SelectItem value="Suspended">Suspended</SelectItem>
                                        <SelectItem value="Pending Approval">Pending Approval</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                                <Button type="submit">Save Changes</Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

    