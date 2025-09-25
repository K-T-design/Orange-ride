
'use client';

import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, BellOff, ExternalLink, Mail, Check, Archive } from 'lucide-react';
import Link from 'next/link';

type Notification = {
  id: string;
  title: string;
  message: string;
  link?: string | null;
  read: boolean;
  createdAt: any;
};

export function UserNotifications() {
  const [user, authLoading] = useAuthState(auth);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      const notificationsRef = collection(db, 'users', user.uid, 'notifications');
      const q = query(notificationsRef, orderBy('createdAt', 'desc'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
        setNotifications(notifs);
        setIsLoading(false);
      }, (error) => {
        console.error("Error fetching notifications:", error);
        toast({ variant: 'destructive', title: 'Could not load notifications.' });
        setIsLoading(false);
      });

      return () => unsubscribe();
    } else if (!authLoading) {
      setIsLoading(false);
    }
  }, [user, authLoading, toast]);

  const handleMarkAsRead = async (id: string) => {
    if (!user) return;
    const notifRef = doc(db, 'users', user.uid, 'notifications', id);
    try {
      await updateDoc(notifRef, { read: true });
    } catch (error) {
      console.error("Error marking as read:", error);
      toast({ variant: 'destructive', title: 'Update failed.' });
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    const unreadNotifications = notifications.filter(n => !n.read);
    if (unreadNotifications.length === 0) return;

    const batch = writeBatch(db);
    unreadNotifications.forEach(notif => {
      const notifRef = doc(db, 'users', user.uid, 'notifications', notif.id);
      batch.update(notifRef, { read: true });
    });

    try {
      await batch.commit();
      toast({ title: 'All notifications marked as read.' });
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast({ variant: 'destructive', title: 'Could not mark all as read.' });
    }
  };
  
  if (isLoading || authLoading) {
    return (
       <Card>
        <CardHeader>
            <Skeleton className="h-8 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-4">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-4 p-4 border rounded-lg">
                    <Skeleton className="h-8 w-8 mt-1 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                         <Skeleton className="h-4 w-1/4" />
                    </div>
                </div>
            ))}
        </CardContent>
       </Card>
    )
  }

  if (!user) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Please <Link href="/login" className="text-primary underline">log in</Link> to view your notifications.</p>
            </CardContent>
        </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Inbox</CardTitle>
            <CardDescription>
                You have {notifications.filter(n => !n.read).length} unread message(s).
            </CardDescription>
        </div>
        <Button variant="outline" onClick={handleMarkAllAsRead} disabled={notifications.filter(n => !n.read).length === 0}>
            <Check className="mr-2 h-4 w-4" />
            Mark All as Read
        </Button>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <BellOff className="mx-auto h-12 w-12" />
            <h3 className="mt-4 text-lg font-semibold">No notifications yet</h3>
            <p className="mt-1 text-sm">We'll let you know when something important happens.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`flex gap-4 p-4 border rounded-lg transition-colors ${
                  notif.read ? 'bg-background' : 'bg-primary/5 border-primary/20'
                }`}
              >
                <div className={`mt-1 flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${notif.read ? 'bg-muted' : 'bg-primary'}`}>
                    <Mail className={`h-5 w-5 ${notif.read ? 'text-muted-foreground' : 'text-primary-foreground'}`} />
                </div>
                <div className="flex-1">
                  <h4 className={`font-semibold ${notif.read ? '' : 'text-primary'}`}>{notif.title}</h4>
                  <p className="text-sm text-muted-foreground">{notif.message}</p>
                   <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-muted-foreground">
                            {notif.createdAt ? formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true }) : '...'}
                        </p>
                        <div className="flex items-center gap-2">
                            {notif.link && (
                                <Button size="sm" variant="link" asChild className="h-auto p-0 text-xs">
                                    <Link href={notif.link} target="_blank">
                                        Learn More <ExternalLink className="ml-1 h-3 w-3" />
                                    </Link>
                                </Button>
                            )}
                            {!notif.read && (
                                <Button size="sm" variant="outline" onClick={() => handleMarkAsRead(notif.id)}>
                                    <Archive className="mr-2 h-3 w-3" />
                                    Mark as Read
                                </Button>
                            )}
                        </div>
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
