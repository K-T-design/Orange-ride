
'use client';

import { useEffect, useState } from "react";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy, where, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, Mail, Loader2, Trash2, CheckCircle, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import Link from 'next/link';

type Message = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  attachmentURL?: string;
  status: 'Unread' | 'In Progress' | 'Resolved';
  createdAt: any;
};

const getStatusVariant = (status: string) => {
    switch (status) {
        case 'Unread': return 'default';
        case 'In Progress': return 'secondary';
        case 'Resolved': return 'outline';
        default: return 'outline';
    }
}

const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    return formatDistanceToNow(timestamp.toDate(), { addSuffix: true });
}

export default function MessagesPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    
    const { toast } = useToast();

    useEffect(() => {
        const q = query(collection(db, "contactMessages"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const messagesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
            setMessages(messagesData);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching messages:", error);
            setIsLoading(false);
            toast({ variant: 'destructive', title: "Failed to load messages." });
        });

        return () => unsubscribe();
    }, [toast]);
    
    const openDetails = (message: Message) => {
        setSelectedMessage(message);
        setIsDetailOpen(true);
        if (message.status === 'Unread') {
            handleUpdateStatus(message.id, 'In Progress');
        }
    }

    const handleUpdateStatus = async (messageId: string, status: Message['status']) => {
        const messageRef = doc(db, 'contactMessages', messageId);
        try {
            await updateDoc(messageRef, { status });
            toast({ title: `Message marked as ${status}.` });
        } catch (error) {
            toast({ variant: 'destructive', title: "Update Failed." });
        }
    }

    const handleDeleteMessage = async (messageId: string) => {
        try {
            await deleteDoc(doc(db, 'contactMessages', messageId));
            toast({ title: 'Message Deleted' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Failed to delete message.' });
        }
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">Contact Messages</h1>
                <p className="text-muted-foreground">Review and respond to customer inquiries.</p>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Inbox</CardTitle>
                    <CardDescription>Messages from the website contact form.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center py-20 text-muted-foreground">
                            <Mail className="mx-auto h-12 w-12" />
                            <h3 className="mt-4 text-lg font-medium">No messages yet</h3>
                            <p className="mt-1 text-sm">New messages from your contact form will appear here.</p>
                        </div>
                    ) : (
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>From</TableHead>
                                    <TableHead>Subject</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Received</TableHead>
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {messages.map((msg) => (
                                    <TableRow key={msg.id} onClick={() => openDetails(msg)} className={`cursor-pointer ${msg.status === 'Unread' ? 'font-bold' : ''}`}>
                                        <TableCell>
                                            <div>{msg.name}</div>
                                            <div className={`text-xs ${msg.status === 'Unread' ? 'text-foreground' : 'text-muted-foreground'}`}>{msg.email}</div>
                                        </TableCell>
                                        <TableCell>{msg.subject}</TableCell>
                                        <TableCell><Badge variant={getStatusVariant(msg.status)}>{msg.status}</Badge></TableCell>
                                        <TableCell>{formatDate(msg.createdAt)}</TableCell>
                                        <TableCell onClick={e => e.stopPropagation()}>
                                            <AlertDialog>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button aria-haspopup="true" size="icon" variant="ghost">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onSelect={() => openDetails(msg)}>View Message</DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onSelect={() => handleUpdateStatus(msg.id, 'In Progress')} disabled={msg.status === 'In Progress'}>
                                                            <Clock className="mr-2 h-4 w-4"/>Mark In Progress
                                                        </DropdownMenuItem>
                                                         <DropdownMenuItem onSelect={() => handleUpdateStatus(msg.id, 'Resolved')} disabled={msg.status === 'Resolved'}>
                                                            <CheckCircle className="mr-2 h-4 w-4"/>Mark as Resolved
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <AlertDialogTrigger asChild>
                                                            <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                                                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                            </DropdownMenuItem>
                                                        </AlertDialogTrigger>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader><AlertDialogTitle>Delete this message?</AlertDialogTitle></AlertDialogHeader>
                                                    <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteMessage(msg.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
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

             <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{selectedMessage?.subject}</DialogTitle>
                        <DialogDescription>
                            From: {selectedMessage?.name} ({selectedMessage?.email})
                        </DialogDescription>
                    </DialogHeader>
                    {selectedMessage && (
                        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                            <p className="text-sm bg-muted p-4 rounded-md whitespace-pre-wrap">{selectedMessage.message}</p>
                            {selectedMessage.attachmentURL && (
                                <div>
                                    <h4 className="text-sm font-medium mb-2">Attachment</h4>
                                    <Button asChild variant="outline">
                                        <Link href={selectedMessage.attachmentURL} target="_blank" download>
                                            Download Attachment
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                     <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between">
                        <span className="text-xs text-muted-foreground">Received: {selectedMessage && formatDate(selectedMessage.createdAt)}</span>
                        <div className="flex justify-end gap-2">
                            <DialogClose asChild><Button type="button" variant="outline">Close</Button></DialogClose>
                            {selectedMessage?.status !== 'Resolved' && (
                                <Button onClick={() => handleUpdateStatus(selectedMessage!.id, 'Resolved')}>Mark as Resolved</Button>
                            )}
                        </div>
                     </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
