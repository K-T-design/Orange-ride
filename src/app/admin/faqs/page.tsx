
'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, MoreHorizontal, HelpCircle, Edit, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

type Faq = {
  id: string;
  question: string;
  category: 'Customer' | 'Ride Owner';
  isActive: boolean;
  createdAt: any;
};

const getStatusVariant = (isActive: boolean) => {
    return isActive ? 'default' : 'secondary';
};

export default function FaqsPage() {
    const [faqs, setFaqs] = useState<Faq[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const q = query(collection(db, 'faqs'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const faqsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Faq));
            setFaqs(faqsData);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching FAQs:", error);
            toast({ variant: 'destructive', title: 'Failed to load FAQs.' });
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [toast]);

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Manage FAQs</h1>
                    <p className="text-muted-foreground">Add, edit, or remove frequently asked questions.</p>
                </div>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add FAQ
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All FAQs</CardTitle>
                    <CardDescription>Manage the questions that appear on your public Help page.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                        </div>
                    ) : faqs.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <HelpCircle className="mx-auto h-12 w-12" />
                            <h3 className="mt-4 text-lg font-medium">No FAQs Found</h3>
                            <p className="mt-1 text-sm">Click "Add FAQ" to create the first one.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Question</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {faqs.map((faq) => (
                                    <TableRow key={faq.id}>
                                        <TableCell className="font-medium">{faq.question}</TableCell>
                                        <TableCell>{faq.category}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(faq.isActive)}>
                                                {faq.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive">
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete
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
