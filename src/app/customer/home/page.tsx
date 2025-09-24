
import { RideSearchForm } from '@/components/ride-search-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { History, Star, User } from 'lucide-react';
import Link from 'next/link';

export default function CustomerHomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold font-headline">Welcome, Customer!</h1>
          <p className="text-lg text-muted-foreground mt-2">Ready to book your next ride? Start here.</p>
        </div>

        <div className="max-w-4xl mx-auto">
           <RideSearchForm />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
         </div>

      </div>
    </div>
  );
}
