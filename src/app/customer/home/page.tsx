
'use client';

import { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, onSnapshot, DocumentData, deleteDoc, doc, orderBy, limit } from 'firebase/firestore';
import { RideCard } from '@/components/ride-card';
import type { Ride } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { History, Star, User, Bell, Loader2, Frown, Search } from 'lucide-react';
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
      const processRides = (docs: DocumentData[]): Ride[] => {
        return docs.map((doc) => {
            const data = doc.data();
            const ownerContact = data.contact || {};
            return {
                id: doc.id,
                name: data.name || 'Unnamed Ride',
                type: data.type || 'Car',
                price: data.price || 0,
                pickup: data.pickup || 'N/A',
                destination: data.destination || 'N/A',
                owner: {
                    name: data.owner || 'Information unavailable',
                    contact: {
                        phone: ownerContact.phone || '',
                        whatsapp: ownerContact.whatsapp || '',
                        email: ownerContact.email || ''
                    }
                },
                image: data.image || 'https://picsum.photos/seed/placeholder/600/400',
                isPromoted: data.isPromoted || data.status === 'Promoted' || false,
                schedule: data.schedule || 'Not specified',
                capacity: data.capacity,
                description: data.description,
            } as Ride;
        });
      };

      // Fetch Saved Rides
      let savedRidesQuery;
      const baseSavedQuery = query(collection(db, 'savedRides'), where('userId', '==', user.uid));
      
      switch(sortOrder) {
          case 'price_asc':
              savedRidesQuery = query(baseSavedQuery, orderBy('listingPrice', 'asc'));
              break;
          case 'price_desc':
              savedRidesQuery = query(baseSavedQuery, orderBy('listingPrice', 'desc'));
              break;
          case 'type_asc':
              savedRidesQuery = query(baseSavedQuery, orderBy('listingType', 'asc'));
              break;
          case 'savedAt_desc':
          default:
              savedRidesQuery = query(baseSavedQuery, orderBy('savedAt', 'desc'));
              break;
      }
      
      const unsubscribeSaved = onSnapshot(savedRidesQuery, async (snapshot) => {
        const savedRideIds = snapshot.docs.map(doc => doc.data().listingId);
        
        if (savedRideIds.length > 0) {
          // Firestore 'in' queries are limited to 30 elements. For larger lists, chunk the requests.
          const CHUNK_SIZE = 30;
          const rideChunks: Ride[] = [];
          for (let i = 0; i < savedRideIds.length; i += CHUNK_SIZE) {
              const chunkIds = savedRideIds.slice(i, i + CHUNK_SIZE);
              const listingsQuery = query(collection(db, 'listings'), where('__name__', 'in', chunkIds));
              const listingsSnapshot = await getDocs(listingsQuery);
              const ridesData = processRides(listingsSnapshot.docs);
              rideChunks.push(...ridesData);
          }
          
          // Re-order based on the original sorted list of IDs from savedRides query
          const orderedRides = savedRideIds.map(id => rideChunks.find(ride => ride.id === id)).filter(Boolean) as Ride[];

          setSavedRides(orderedRides);
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
      const promotedQuery = query(collection(db, 'listings'), where('isPromoted', '==', true), limit(4));
      const unsubscribePromoted = onSnapshot(promotedQuery, (snapshot) => {
        const promotedData = processRides(snapshot.docs);
        setPromotedRides(promotedData);
      });


      return () => {
        unsubscribeSaved();
        unsubscribePromoted();
      };
    }
  }, [user, toast, sortOrder]);
  
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


  if (loadingAuth || isLoading) {
      return (
          <div className="container mx-auto px-4 py-8 space-y-8">
              <Skeleton className="h-10 w-1/3" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40" />)}
              </div>
              <div className="space-y-4">
                  <Skeleton className="h-8 w-1/4" />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           <Card>
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
               <CardTitle className="text-sm font-medium">My Profile</CardTitle>
               <User className="h-4 w-4 text-muted-foreground" />
             </CardHeader>
             <CardContent>
               <p className="text-xs text-muted-foreground">Update your contact details and password.</p>
               <Button variant="outline" size="sm" className="mt-4" asChild>
                   <Link href="/customer/profile">Go to Profile</Link>
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
                   <Link href="/search">Find New Rides</Link>
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
                            <SelectItem value="savedAt_desc">Recently Added</SelectItem>
                            <SelectItem value="price_asc">Price: Low to High</SelectItem>
                            <SelectItem value="price_desc">Price: High to Low</SelectItem>
                            <SelectItem value="type_asc">Ride Type (A-Z)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            {savedRides.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {savedRides.map(ride => (
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
                <Card className="text-center py-16 text-muted-foreground animate-fade-in-up">
                    <CardContent>
                        <Frown className="mx-auto h-12 w-12" />
                        <h3 className="mt-4 text-lg font-semibold">You haven’t saved any rides yet.</h3>
                        <p className="mt-2 text-sm">Click the star on any ride to save it for later.</p>
                        <Button asChild className="mt-6">
                            <Link href="/search">
                                <Search className="mr-2 h-4 w-4" />
                                Find a Ride
                            </Link>
                        </Button>
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
