
'use client';

import { UserNotifications } from '@/components/user-notifications';

export default function CustomerNotificationsPage() {
  return (
    <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold font-headline mb-2">Your Notifications</h1>
        <p className="text-muted-foreground mb-6">Updates, alerts, and messages from the Orange Rides team.</p>
        <UserNotifications />
    </div>
  )
}
