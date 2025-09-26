
'use client';

import { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, getDocs, writeBatch, serverTimestamp, query, where, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Send } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const notificationSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters long.'),
  message: z.string().min(10, 'Message must be at least 10 characters long.'),
  recipientType: z.enum(['all', 'owners', 'customers', 'specific']),
  specificUserId: z.string().optional(),
  link: z.string().url().optional().or(z.literal('')),
}).refine(data => {
    if (data.recipientType === 'specific') {
        return !!data.specificUserId;
    }
    return true;
}, {
    message: "Please select a specific user.",
    path: ["specificUserId"],
});


type NotificationFormData = z.infer<typeof notificationSchema>;

type User = {
    id: string;
    fullName: string;
    email: string;
};

export default function BroadcastPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const { toast } = useToast();

  const form = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      title: '',
      message: '',
      recipientType: 'all',
      link: '',
    },
  });

  const recipientType = form.watch('recipientType');

  useEffect(() => {
    async function fetchUsers() {
      setIsLoadingUsers(true);
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersList = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as User));
        setUsers(usersList);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast({ variant: 'destructive', title: 'Failed to load users.' });
      } finally {
        setIsLoadingUsers(false);
      }
    }
    if (recipientType === 'specific') {
      fetchUsers();
    }
  }, [recipientType, toast]);

  const onSubmit: SubmitHandler<NotificationFormData> = async (values) => {
    setIsSubmitting(true);
    try {
      const usersCollectionRef = collection(db, 'users');
      let usersQuery;

      if (values.recipientType === 'specific') {
        if (!values.specificUserId) {
            toast({ variant: 'destructive', title: 'Please select a user.' });
            setIsSubmitting(false);
            return;
        }
        usersQuery = query(usersCollectionRef, where('__name__', '==', values.specificUserId));
      } else {
        switch (values.recipientType) {
            case 'owners':
            usersQuery = query(usersCollectionRef, where('role', '==', 'Ride Owner'));
            break;
            case 'customers':
            usersQuery = query(usersCollectionRef, where('role', '==', 'Customer'));
            break;
            case 'all':
            default:
            usersQuery = query(usersCollectionRef);
            break;
        }
      }


      const querySnapshot = await getDocs(usersQuery);
      if (querySnapshot.empty) {
        toast({
          variant: 'destructive',
          title: 'No recipients found',
          description: 'There are no users matching the selected criteria.',
        });
        setIsSubmitting(false);
        return;
      }

      const batch = writeBatch(db);
      const notificationData = {
        title: values.title,
        message: values.message,
        link: values.link || null,
        read: false,
        createdAt: serverTimestamp(),
        eventType: 'announcement',
      };

      querySnapshot.forEach((userDoc) => {
        const userNotificationsRef = collection(db, 'users', userDoc.id, 'notifications');
        const newNotifRef = doc(userNotificationsRef);
        batch.set(newNotifRef, notificationData);
      });

      await batch.commit();

      toast({
        title: 'Notifications Sent!',
        description: `Your message has been sent to ${querySnapshot.size} user(s).`,
      });
      form.reset();
    } catch (error) {
      console.error('Error sending notifications:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to send notifications',
        description: 'An error occurred. Please check the console for details.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Send Broadcast</h1>
        <p className="text-muted-foreground">
          Send announcements or messages to all users or specific groups.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Compose Message</CardTitle>
          <CardDescription>
            The message will be sent to the selected user group's notification inbox immediately.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Platform Update" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Your detailed message goes here..."
                        rows={5}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="recipientType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recipient Group</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a group to send to" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="all">All Users</SelectItem>
                          <SelectItem value="owners">Ride Owners Only</SelectItem>
                          <SelectItem value="customers">Customers Only</SelectItem>
                          <SelectItem value="specific">Specific User</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose which group of users will receive this notification.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="link"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Optional Link</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/promo" {...field} />
                      </FormControl>
                      <FormDescription>
                        Include a URL for users to click.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {recipientType === 'specific' && (
                isLoadingUsers ? (
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ) : (
                    <FormField
                    control={form.control}
                    name="specificUserId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Select Specific User</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a user to send to" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {users.map(user => (
                                <SelectItem key={user.id} value={user.id}>
                                    {user.fullName} ({user.email})
                                </SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                )
              )}

              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSubmitting ? 'Sending...' : 'Send Notification'}
                  <Send className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
