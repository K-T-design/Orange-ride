
'use client';

import { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, onSnapshot, DocumentData, deleteDoc, doc } from 'firebase/firestore';
import { RideCard } from '@/components/ride-card';
import type { Ride } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { History, Star, User, Bell, Loader2, Frown } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function CustomerDashboardPage() {
  const [user, loadingAuth] = useAuthState(auth);
  const router = useRouter();
  const { toast } = useToast();

  const [savedRides, setSavedRides] = useState<Ride[]>([]);
  const [promotedRides, setPromotedRides] = useState<Ride[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState('savedAt_desc');

  useEffect(() => {
    if (!loadingAuth && !user) {
      router.push('/login');
    }
  }, [user, loadingAuth, router]);

  useEffect(() => {
    if (user) {
      // Fetch Saved Rides
      const savedRidesQuery = query(collection(db, 'savedRides'), where('userId', '==', user.uid));
      const unsubscribeSaved = onSnapshot(savedRidesQuery, async (snapshot) => {
        const savedRideIds = snapshot.docs.map(doc => doc.data().listingId);
        
        if (savedRideIds.length > 0) {
          const listingsQuery = query(collection(db, 'listings'), where('__name__', 'in', savedRideIds));
          const listingsSnapshot = await getDocs(listingsQuery);
          const ridesData = listingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ride));
          
          // Attach savedAt timestamp
          const ridesWithTimestamp = ridesData.map(ride => {
              const savedDoc = snapshot.docs.find(doc => doc.data().listingId === ride.id);
              return {...ride, savedAt: savedDoc?.data().savedAt };
          });

          setSavedRides(ridesWithTimestamp);
        } else {
            setSavedRides([]);
        }
        setIsLoading(false);
      }, (error) => {
          console.error("Error fetching saved rides:", error);
          toast({ variant: "destructive", title: "Could not load saved rides." });
          setIsLoading(false);
      });

      // Fetch Promoted Rides
      const promotedQuery = query(collection(db, 'listings'), where('isPromoted', '==', true));
      const unsubscribePromoted = onSnapshot(promotedQuery, (snapshot) => {
        const promotedData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ride));
        setPromotedRides(promotedData);
      });


      return () => {
        unsubscribeSaved();
        unsubscribePromoted();
      };
    }
  }, [user, toast]);
  
  const handleRemoveSaved = async (listingId: string) => {
      if (!user) return;
      try {
          const savedRideQuery = query(collection(db, 'savedRides'), where('userId', '==', user.uid), where('listingId', '==', listingId));
          const querySnapshot = await getDocs(savedRideQuery);
          
          querySnapshot.forEach(async (document) => {
              await deleteDoc(doc(db, 'savedRides', document.id));
          });

          toast({ title: "Ride removed from saved." });
      } catch (error) {
          console.error("Error removing saved ride: ", error);
          toast({ variant: "destructive", title: "Failed to remove ride." });
      }
  }

  const sortedSavedRides = [...savedRides].sort((a, b) => {
    switch (sortOrder) {
      case 'price_asc':
        return a.price - b.price;
      case 'price_desc':
        return b.price - a.price;
      case 'type_asc':
        return a.type.localeCompare(b.type);
      case 'savedAt_desc':
      default:
        return (b.savedAt?.toMillis() || 0) - (a.savedAt?.toMillis() || 0);
    }
  });


  if (loadingAuth || isLoading) {
      return (
          <div className="container mx-auto px-4 py-8 space-y-8">
              <Skeleton className="h-10 w-1/3" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-40" />)}
              </div>
              <div className="space-y-4">
                  <Skeleton className="h-8 w-1/4" />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-80" />)}
                  </div>
              </div>
          </div>
      )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-12">
        <div>
          <h1 className="text-4xl font-bold font-headline">Customer Dashboard</h1>
          <p className="text-lg text-muted-foreground mt-2">Manage your rides and profile.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <Card>
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
               <CardTitle className="text-sm font-medium">My Profile</CardTitle>
               <User className="h-4 w-4 text-muted-foreground" />
             </CardHeader>
             <CardContent>
               <p className="text-xs text-muted-foreground">Update your contact details and password.</p>
               <Button variant="outline" size="sm" className="mt-4" asChild>
                   <Link href="/profile">Go to Profile</Link>
               </Button>
             </CardContent>
           </Card>
           <Card>
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
               <CardTitle className="text-sm font-medium">Booking History</CardTitle>
               <History className="h-4 w-4 text-muted-foreground" />
             </CardHeader>
             <CardContent>
               <p className="text-xs text-muted-foreground">View your past and current ride bookings.</p>
                <Button variant="outline" size="sm" className="mt-4" asChild>
                   <Link href="/my-rides">View History</Link>
               </Button>
             </CardContent>
           </Card>
           <Card>
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
               <CardTitle className="text-sm font-medium">Notifications</CardTitle>
               <Bell className="h-4 w-4 text-muted-foreground" />
             </CardHeader>
             <CardContent>
               <p className="text-xs text-muted-foreground">Check for updates and announcements.</p>
                <Button variant="outline" size="sm" className="mt-4" asChild>
                   <Link href="/customer/notifications">View Notifications</Link>
               </Button>
             </CardContent>
           </Card>
            <Card className="bg-primary/10 border-primary/20">
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
               <CardTitle className="text-sm font-medium text-primary">Find a New Ride</CardTitle>
               <Star className="h-4 w-4 text-primary" />
             </CardHeader>
             <CardContent>
               <p className="text-xs text-muted-foreground">Explore and book your next journey.</p>
                <Button variant="default" size="sm" className="mt-4" asChild>
                   <Link href="/">Back to Homepage</Link>
               </Button>
             </CardContent>
           </Card>
         </div>

        <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <h2 className="text-3xl font-bold font-headline">Your Saved Rides</h2>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Sort by:</span>
                    <Select value={sortOrder} onValueChange={setSortOrder}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Sort rides" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="savedAt_desc">Date Saved</SelectItem>
                            <SelectItem value="price_asc">Price: Low to High</SelectItem>
                            <SelectItem value="price_desc">Price: High to Low</SelectItem>
                            <SelectItem value="type_asc">Ride Type</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            {savedRides.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {sortedSavedRides.map(ride => (
                       <div key={ride.id} className="relative group">
                         <RideCard ride={ride} />
                         <Button 
                            variant="destructive" 
                            size="sm" 
                            className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleRemoveSaved(ride.id)}
                          >
                           Remove
                         </Button>
                       </div>
                    ))}
                </div>
            ) : (
                <Card className="text-center py-16 text-muted-foreground">
                    <CardContent>
                        <Frown className="mx-auto h-12 w-12" />
                        <h3 className="mt-4 text-lg font-semibold">No saved rides yet</h3>
                        <p className="mt-1 text-sm">Click the star on any ride to save it for later.</p>
                    </CardContent>
                </Card>
            )}
        </div>

         {promotedRides.length > 0 && (
            <div>
                <h2 className="text-3xl font-bold font-headline mb-6">Featured For You</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {promotedRides.map(ride => (
                        <RideCard key={ride.id} ride={ride} />
                    ))}
                </div>
            </div>
         )}
      </div>
    </div>
  );
}
