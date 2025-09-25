
'use client';

import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { Loader2, Paperclip, Send } from 'lucide-react';
import { X } from 'lucide-react';


const contactSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters.'),
    email: z.string().email('Please enter a valid email address.'),
    subject: z.string().min(5, 'Subject must be at least 5 characters.'),
    message: z.string().min(10, 'Message must be at least 10 characters.'),
    attachment: z.any().optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

export function ContactForm() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const [fileName, setFileName] = useState<string | null>(null);

    const form = useForm<ContactFormData>({
        resolver: zodResolver(contactSchema),
        defaultValues: { name: '', email: '', subject: '', message: '' },
    });
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            form.setValue('attachment', file);
            setFileName(file.name);
        }
    };
    
    const removeAttachment = () => {
        form.setValue('attachment', null);
        setFileName(null);
        // Also reset the file input visually
        const fileInput = document.getElementById('attachment-upload') as HTMLInputElement;
        if(fileInput) fileInput.value = '';
    }

    const onSubmit: SubmitHandler<ContactFormData> = async (data) => {
        setIsSubmitting(true);
        try {
            let attachmentURL: string | null = null;
            if (data.attachment instanceof File) {
                const fileRef = ref(storage, `contact-attachments/${Date.now()}_${data.attachment.name}`);
                await uploadBytes(fileRef, data.attachment);
                attachmentURL = await getDownloadURL(fileRef);
            }
            
            await addDoc(collection(db, 'contactMessages'), {
                name: data.name,
                email: data.email,
                subject: data.subject,
                message: data.message,
                status: 'Unread',
                createdAt: serverTimestamp(),
                attachmentURL,
            });

            toast({
                title: 'Message Sent!',
                description: 'Thank you for contacting us. We will get back to you shortly.',
            });
            form.reset();
            setFileName(null);

        } catch (error) {
            console.error("Error sending message:", error);
            toast({
                variant: 'destructive',
                title: 'Submission Failed',
                description: 'Could not send your message. Please try again later.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section id="contact">
             <Card>
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl font-bold font-headline">Contact Us</CardTitle>
                    <CardDescription>Have a question or need support? Fill out the form below.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField control={form.control} name="name" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Full Name</FormLabel>
                                        <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="email" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email Address</FormLabel>
                                        <FormControl><Input type="email" placeholder="you@example.com" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                            <FormField control={form.control} name="subject" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Subject</FormLabel>
                                    <FormControl><Input placeholder="How can we help?" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="message" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Message</FormLabel>
                                    <FormControl><Textarea rows={5} placeholder="Your detailed message..." {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField
                                control={form.control}
                                name="attachment"
                                render={() => (
                                <FormItem>
                                    <FormLabel>Attachment (Optional)</FormLabel>
                                     <FormControl>
                                        <div className="flex items-center gap-2">
                                            <Button asChild variant="outline" className="cursor-pointer">
                                                <label htmlFor="attachment-upload" className="flex items-center">
                                                    <Paperclip className="mr-2 h-4 w-4" />
                                                    Choose File
                                                </label>
                                            </Button>
                                             <Input id="attachment-upload" type="file" className="hidden" onChange={handleFileChange} />
                                             {fileName && (
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted p-2 rounded-md">
                                                    <span>{fileName}</span>
                                                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={removeAttachment}>
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                             )}
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />

                            <div className="text-right">
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isSubmitting ? 'Sending...' : 'Send Message'}
                                    <Send className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
             </Card>
        </section>
    )
}
