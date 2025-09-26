
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Bell, BellRing, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useAdminNotifications } from '@/context/AdminNotificationsContext';
import { Skeleton } from '../ui/skeleton';

export function NotificationsDropdown() {
    const { 
        notifications, 
        unreadCount, 
        isLoading, 
        markAllAsRead, 
        markAsRead, 
        deleteNotification 
    } = useAdminNotifications();
    
    const [isOpen, setIsOpen] = useState(false);

    const handleItemSelect = (e: Event, id: string) => {
        e.preventDefault();
        markAsRead(id);
    };
    
    if (isLoading) {
        return <Skeleton className="h-9 w-9 rounded-full" />;
    }

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    {unreadCount > 0 ? <BellRing className="h-5 w-5 animate-in" /> : <Bell className="h-5 w-5" />}
                    {unreadCount > 0 && (
                        <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 justify-center p-0">{unreadCount}</Badge>
                    )}
                    <span className="sr-only">Toggle notifications</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex justify-between items-center">
                    <span>Notifications</span>
                    {unreadCount > 0 && <Button variant="link" size="sm" className="h-auto p-0" onClick={markAllAsRead}>Mark all as read</Button>}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                     <DropdownMenuItem disabled>
                        <div className="text-center text-muted-foreground py-4">No new notifications</div>
                    </DropdownMenuItem>
                ) : (
                    notifications.slice(0, 7).map((notif) => (
                        <DropdownMenuItem key={notif.id} className="flex items-start gap-2 data-[highlighted]:bg-accent" onSelect={(e) => handleItemSelect(e, notif.id)}>
                           <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${notif.read ? 'bg-transparent' : 'bg-primary'}`} />
                           <div className="flex-1">
                                <p className={`text-sm whitespace-pre-wrap ${!notif.read && 'font-bold'}`}>{notif.message}</p>
                                <p className={`text-xs ${notif.read ? 'text-muted-foreground' : 'text-primary'}`}>
                                    {notif.createdAt ? formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true }) : 'just now'}
                                </p>
                           </div>
                           <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0" 
                                onClick={(e) => {e.stopPropagation(); deleteNotification(notif.id);}}
                           >
                                <Trash2 className="h-4 w-4" />
                           </Button>
                        </DropdownMenuItem>
                    ))
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
