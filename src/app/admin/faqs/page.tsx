
'use client';

import { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, MoreHorizontal, HelpCircle, Edit, Trash2, Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';


type Faq = {
  id: string;
  question: string;
  answer: string;
  category: 'Customer' | 'Ride Owner';
  isActive: boolean;
  createdAt: any;
};

const faqSchema = z.object({
    question: z.string().min(10, "Question must be at least 10 characters long."),
    answer: z.string().min(20, "Answer must be at least 20 characters long."),
    category: z.enum(['Customer', 'Ride Owner']),
    isActive: z.boolean(),
});

type FaqFormData = z.infer<typeof faqSchema>;


const getStatusVariant = (isActive: boolean) => {
    return isActive ? 'default' : 'secondary';
};

export default function FaqsPage() {
    const [faqs, setFaqs] = useState<Faq[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const { toast } = useToast();

    const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FaqFormData>({
        resolver: zodResolver(faqSchema),
        defaultValues: {
            question: '',
            answer: '',
            category: 'Customer',
            isActive: true,
        }
    });

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
    
    const handleAddFaq: SubmitHandler<FaqFormData> = async (data) => {
        setIsSubmitting(true);
        try {
            await addDoc(collection(db, 'faqs'), {
                ...data,
                createdAt: serverTimestamp(),
            });
            toast({ title: 'FAQ Added Successfully' });
            setIsDialogOpen(false);
            reset();
        } catch (error) {
            console.error("Error adding FAQ:", error);
            toast({ variant: 'destructive', title: 'Failed to add FAQ.' });
        } finally {
            setIsSubmitting(false);
        }
    }


    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Manage FAQs</h1>
                    <p className="text-muted-foreground">Add, edit, or remove frequently asked questions.</p>
                </div>
                <Button onClick={() => setIsDialogOpen(true)}>
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

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New FAQ</DialogTitle>
                        <DialogDescription>Create a new frequently asked question to display on the Help page.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(handleAddFaq)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="question">Question</Label>
                            <Input id="question" {...register('question')} />
                            {errors.question && <p className="text-sm text-destructive">{errors.question.message}</p>}
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="answer">Answer</Label>
                            <Textarea id="answer" rows={5} {...register('answer')} />
                            {errors.answer && <p className="text-sm text-destructive">{errors.answer.message}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <Controller
                                    name="category"
                                    control={control}
                                    render={({ field }) => (
                                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <SelectTrigger id="category">
                                                <SelectValue placeholder="Select a category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Customer">Customer</SelectItem>
                                                <SelectItem value="Ride Owner">Ride Owner</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>
                            <div className="space-y-2">
                                 <Label htmlFor="isActive">Status</Label>
                                 <Controller
                                    name="isActive"
                                    control={control}
                                    render={({ field }) => (
                                         <div className="flex items-center space-x-2 pt-2">
                                            <Switch
                                                id="isActive"
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                            <Label htmlFor="isActive">{field.value ? 'Active' : 'Inactive'}</Label>
                                        </div>
                                    )}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isSubmitting ? 'Saving...' : 'Save FAQ'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
