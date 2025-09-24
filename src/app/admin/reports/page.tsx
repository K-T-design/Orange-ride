
'use client';

import { useEffect, useState } from "react";
import { collection, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, serverTimestamp, query, where, getDoc, DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, Flag, AlertTriangle, CheckCircle, Trash2, UserX, MessageSquare, Send } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { format, formatDistanceToNow } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


type Note = {
  id: string;
  author: string;
  message: string;
  createdAt: any;
}

type Report = {
  id: string;
  listingId: string;
  reason: string;
  reporterName?: string;
  reporterEmail?: string;
  notes?: Note[];
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
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [newNote, setNewNote] = useState('');

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
        }, (error) => {
            console.error("Error fetching reports:", error);
            setIsLoading(false);
            toast({ variant: 'destructive', title: "Failed to load reports." });
        });

        return () => unsubscribe();
    }, [filter, toast]);

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

            const ownerRef = doc(db, 'rideOwners', ownerId);
            await updateDoc(ownerRef, { status: 'Suspended' });

            toast({ title: 'Owner Suspended', description: `The owner has been successfully suspended.` });
        } catch (error) {
            console.error("Error suspending owner: ", error);
            toast({ variant: 'destructive', title: 'Failed to Suspend Owner' });
        }
    };

    const handleAddNote = async () => {
        if (!selectedReport || !newNote.trim()) {
            toast({ variant: 'destructive', title: 'Note cannot be empty.' });
            return;
        }

        const reportRef = doc(db, 'reports', selectedReport.id);
        const noteToAdd: Note = {
            id: new Date().toISOString() + Math.random(),
            author: "Admin", // In a real app, this would be the current user's name
            message: newNote,
            createdAt: new Date(),
        };
        
        try {
            await updateDoc(reportRef, {
                notes: arrayUnion(noteToAdd)
            });
            toast({ title: "Note added." });
            setNewNote('');
            // Manually update the state to show the new note instantly
            setSelectedReport(prev => prev ? ({...prev, notes: [...(prev.notes || []), noteToAdd]}) : null);
        } catch (error) {
            console.error("Error adding note:", error);
            toast({ variant: 'destructive', title: "Failed to add note." });
        }
    };

    const handleDeleteNote = async (noteId: string) => {
        if (!selectedReport) return;

        const noteToDelete = selectedReport.notes?.find(note => note.id === noteId);
        if (!noteToDelete) return;
        
        const reportRef = doc(db, 'reports', selectedReport.id);
        try {
            await updateDoc(reportRef, {
                notes: arrayRemove(noteToDelete)
            });

            // Optimistically update the UI
            setSelectedReport(prev => {
                if (!prev || !prev.notes) return prev;
                return {
                    ...prev,
                    notes: prev.notes.filter(note => note.id !== noteId)
                };
            });
            
            toast({ title: "Note deleted." });
        } catch (error) {
            console.error("Error deleting note:", error);
            toast({ variant: "destructive", title: "Failed to delete note." });
        }
    };

    const openDetails = (report: Report) => {
        setSelectedReport(report);
        setIsDetailOpen(true);
    };

    return (
        <div className="flex flex-col gap-8">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Reports & Moderation</CardTitle>
                         <div className="flex items-center gap-4">
                            <Button variant={filter === 'All' ? 'default' : 'outline'} onClick={() => setFilter('All')}>All</Button>
                            <Button variant={filter === 'Pending' ? 'destructive' : 'outline'} onClick={() => setFilter('Pending')}>Pending</Button>
                            <Button variant={filter === 'Reviewed' ? 'secondary' : 'outline'} onClick={() => setFilter('Reviewed')}>Reviewed</Button>
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
                                <TableRow key={report.id} onClick={() => openDetails(report)} className="cursor-pointer">
                                    <TableCell className="font-medium">
                                        <Button variant="link" asChild className="p-0 h-auto" onClick={(e) => e.stopPropagation()}>
                                             <Link href={`/admin/listings/edit/${report.listingId}`} target="_blank">
                                                {report.listingId.substring(0, 8)}...
                                            </Link>
                                        </Button>
                                    </TableCell>
                                    <TableCell>{report.reason}</TableCell>
                                    <TableCell>{report.reporterName || report.reporterEmail || 'Anonymous'}</TableCell>
                                    <TableCell>{formatDate(report.dateReported)}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(report.status)}>{report.status}</Badge>
                                    </TableCell>
                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Toggle menu</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onSelect={() => openDetails(report)}>View Details & Notes</DropdownMenuItem>
                                                <DropdownMenuSeparator />
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

            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Report Details</DialogTitle>
                        <DialogDescription>
                            Review the report details and take necessary actions.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedReport && (
                        <div className="grid gap-6 py-4">
                           <div className="grid grid-cols-2 gap-4">
                                <div><strong>Listing ID:</strong> <Link href={`/admin/listings/edit/${selectedReport.listingId}`} className="text-primary hover:underline">{selectedReport.listingId}</Link></div>
                                <div><strong>Status:</strong> <Badge variant={getStatusVariant(selectedReport.status)}>{selectedReport.status}</Badge></div>
                                <div><strong>Reported On:</strong> {formatDate(selectedReport.dateReported)}</div>
                                <div><strong>Reason:</strong> {selectedReport.reason}</div>
                           </div>
                           <div>
                             <h4 className="font-semibold mb-2">Reporter Information</h4>
                             <div className="text-sm p-4 bg-muted rounded-md">
                                <p><strong>Name:</strong> {selectedReport.reporterName || 'N/A'}</p>
                                <p><strong>Email:</strong> {selectedReport.reporterEmail || 'N/A'}</p>
                             </div>
                           </div>

                           <div className="space-y-4">
                               <h4 className="font-semibold">Internal Notes</h4>
                               <div className="space-y-3 max-h-48 overflow-y-auto pr-4">
                                   {Array.isArray(selectedReport.notes) && selectedReport.notes.length > 0 ? (
                                       selectedReport.notes.map((note) => (
                                           <div key={note.id} className="flex gap-3 group">
                                                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                                                    {note.author.substring(0,1)}
                                                </div>
                                                <div className="flex-grow">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <span className="font-semibold">{note.author}</span>
                                                            <span className="text-xs text-muted-foreground ml-2">
                                                                {note.createdAt?.toDate ? formatDistanceToNow(note.createdAt.toDate(), { addSuffix: true }) : 'sending...'}
                                                            </span>
                                                        </div>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive">
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Delete this note?</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        This action cannot be undone. The note will be permanently deleted.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={() => handleDeleteNote(note.id)} className="bg-destructive hover:bg-destructive/90">
                                                                        Delete
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                    <p className="text-sm">{note.message}</p>
                                                </div>
                                           </div>
                                       ))
                                   ) : (
                                       <p className="text-sm text-muted-foreground">No notes added yet.</p>
                                   )}
                               </div>
                                <div className="flex gap-2">
                                    <Textarea 
                                        placeholder="Add a new note..." 
                                        value={newNote} 
                                        onChange={(e) => setNewNote(e.target.value)}
                                        rows={2}
                                    />
                                    <Button onClick={handleAddNote} size="icon" className="flex-shrink-0">
                                        <Send className="h-4 w-4" />
                                        <span className="sr-only">Add Note</span>
                                    </Button>
                               </div>
                           </div>

                        </div>
                    )}
                     <DialogClose asChild>
                        <Button type="button" variant="outline">Close</Button>
                    </DialogClose>
                </DialogContent>
            </Dialog>
        </div>
    );
}
