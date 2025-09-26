
'use client';

import { useAdminNotifications } from '@/context/AdminNotificationsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BellOff, Check, Trash2, Mail } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function AdminNotificationsPage() {
  const { 
    notifications, 
    isLoading, 
    markAsRead, 
    deleteNotification,
    markAllAsRead,
    unreadCount,
  } = useAdminNotifications();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-10 w-32" />
        </div>
        <Card>
            <CardContent className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex gap-4 p-4 border rounded-lg">
                        <Skeleton className="h-8 w-8 mt-1 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="h-4 w-1/4" />
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold font-headline">Admin Notifications</h1>
                <p className="text-muted-foreground">Recent activity across the platform.</p>
            </div>
            <Button onClick={markAllAsRead} disabled={unreadCount === 0}>
                <Check className="mr-2 h-4 w-4" />
                Mark All as Read
            </Button>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Activity Feed</CardTitle>
                <CardDescription>
                    You have {unreadCount} unread notification(s).
                </CardDescription>
            </CardHeader>
            <CardContent>
                {notifications.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                        <BellOff className="mx-auto h-12 w-12" />
                        <h3 className="mt-4 text-lg font-semibold">All caught up!</h3>
                        <p className="mt-1 text-sm">There are no new notifications.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {notifications.map((notif) => (
                        <div
                            key={notif.id}
                            className={`flex items-start gap-4 p-4 border rounded-lg transition-colors ${
                            !notif.read && 'bg-primary/5'
                            }`}
                        >
                            <div className={`mt-1 flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                                notif.read ? 'bg-muted' : 'bg-primary'
                            }`}>
                                <Mail className={`h-5 w-5 ${notif.read ? 'text-muted-foreground' : 'text-primary-foreground'}`} />
                            </div>
                            <div className="flex-1">
                                <p className={`text-sm ${!notif.read && 'font-semibold'}`}>{notif.message}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {notif.createdAt ? formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true }) : '...'}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                {!notif.read &&
                                    <Button variant="outline" size="sm" onClick={() => markAsRead(notif.id)}>
                                        Mark as Read
                                    </Button>
                                }
                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => deleteNotification(notif.id)}>
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Delete</span>
                                </Button>
                            </div>
                        </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
