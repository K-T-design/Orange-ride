

'use client';

import { RideSearchForm } from '@/components/ride-search-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { History, Star, User, Bell } from 'lucide-react';
import Link from 'next/link';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';


export default function CustomerHomePage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);


  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold font-headline">Customer Dashboard</h1>
          <p className="text-lg text-muted-foreground mt-2">Manage your rides and profile.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <Card>
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
               <CardTitle className="text-sm font-medium">
                 My Profile
               </CardTitle>
               <User className="h-4 w-4 text-muted-foreground" />
             </CardHeader>
             <CardContent>
               <p className="text-xs text-muted-foreground">
                 Update your contact details and password.
               </p>
               <Button variant="outline" size="sm" className="mt-4" asChild>
                   <Link href="/profile">Go to Profile</Link>
               </Button>
             </CardContent>
           </Card>
           <Card>
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
               <CardTitle className="text-sm font-medium">
                 Booking History
               </CardTitle>
               <History className="h-4 w-4 text-muted-foreground" />
             </CardHeader>
             <CardContent>
               <p className="text-xs text-muted-foreground">
                 View your past and current ride bookings.
               </p>
                <Button variant="outline" size="sm" className="mt-4" asChild>
                   <Link href="/my-rides">View History</Link>
               </Button>
             </CardContent>
           </Card>
           <Card>
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
               <CardTitle className="text-sm font-medium">
                 Saved Rides
               </CardTitle>
               <Star className="h-4 w-4 text-muted-foreground" />
             </CardHeader>
             <CardContent>
               <p className="text-xs text-muted-foreground">
                 Access your favorite and saved rides.
               </p>
                <Button variant="outline" size="sm" className="mt-4" asChild>
                   <Link href="/saved-rides">View Saved</Link>
               </Button>
             </CardContent>
           </Card>
            <Card>
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
               <CardTitle className="text-sm font-medium">
                 Notifications
               </CardTitle>
               <Bell className="h-4 w-4 text-muted-foreground" />
             </CardHeader>
             <CardContent>
               <p className="text-xs text-muted-foreground">
                 Check for updates and announcements.
               </p>
                <Button variant="outline" size="sm" className="mt-4" asChild>
                   <Link href="/customer/notifications">View Notifications</Link>
               </Button>
             </CardContent>
           </Card>
         </div>
          <div className="text-center pt-8">
             <Button asChild>
                <Link href="/">Back to Homepage</Link>
             </Button>
        </div>

      </div>
    </div>
  );
}
