
'use client';

import { useState, useEffect } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
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
    const [currentFaq, setCurrentFaq] = useState<Faq | null>(null);

    const { toast } = useToast();

    const { register, handleSubmit, reset, control, setValue, formState: { errors } } = useForm<FaqFormData>({
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
    
    const openDialog = (faq: Faq | null) => {
        setCurrentFaq(faq);
        if (faq) {
            setValue('question', faq.question);
            setValue('answer', faq.answer);
            setValue('category', faq.category);
            setValue('isActive', faq.isActive);
        } else {
            reset();
        }
        setIsDialogOpen(true);
    }
    
    const handleFormSubmit: SubmitHandler<FaqFormData> = async (data) => {
        setIsSubmitting(true);
        try {
            if (currentFaq) {
                // Update existing FAQ
                const faqRef = doc(db, 'faqs', currentFaq.id);
                await updateDoc(faqRef, { ...data, updatedAt: serverTimestamp() });
                toast({ title: 'FAQ Updated Successfully' });
            } else {
                // Add new FAQ
                await addDoc(collection(db, 'faqs'), {
                    ...data,
                    createdAt: serverTimestamp(),
                });
                toast({ title: 'FAQ Added Successfully' });
            }
            setIsDialogOpen(false);
            reset();
            setCurrentFaq(null);
        } catch (error) {
            console.error("Error saving FAQ:", error);
            toast({ variant: 'destructive', title: 'Failed to save FAQ.' });
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleDeleteFaq = async (faqId: string) => {
        try {
            await deleteDoc(doc(db, 'faqs', faqId));
            toast({ title: 'FAQ Deleted' });
        } catch (error) {
            console.error("Error deleting FAQ:", error);
            toast({ variant: 'destructive', title: 'Failed to delete FAQ.' });
        }
    }

    const handleToggleActive = async (faq: Faq) => {
        const faqRef = doc(db, 'faqs', faq.id);
        try {
            await updateDoc(faqRef, { isActive: !faq.isActive });
            toast({ title: `FAQ ${faq.isActive ? 'deactivated' : 'activated'}` });
        } catch (error) {
            console.error("Error toggling status:", error);
            toast({ variant: 'destructive', title: 'Failed to update status.' });
        }
    }


    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Manage FAQs</h1>
                    <p className="text-muted-foreground">Add, edit, or remove frequently asked questions.</p>
                </div>
                <Button onClick={() => openDialog(null)}>
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
                                            <AlertDialog>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onSelect={() => openDialog(faq)}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                         <DropdownMenuItem onSelect={() => handleToggleActive(faq)}>
                                                            <Switch checked={faq.isActive} className="mr-2 h-4 w-4" />
                                                            Toggle Status
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <AlertDialogTrigger asChild>
                                                            <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </AlertDialogTrigger>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                                 <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This will permanently delete the FAQ: "{faq.question}"
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteFaq(faq.id)} className="bg-destructive hover:bg-destructive/90">
                                                            Yes, delete
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

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{currentFaq ? 'Edit' : 'Add New'} FAQ</DialogTitle>
                        <DialogDescription>
                            {currentFaq ? 'Update this frequently asked question.' : 'Create a new frequently asked question to display on the Help page.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
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
                                         <Select onValueChange={field.onChange} value={field.value}>
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
