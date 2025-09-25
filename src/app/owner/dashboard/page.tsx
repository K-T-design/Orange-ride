
'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Car, Star, Users, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

type RideOwnerData = {
  businessName: string;
  businessType: string;
  listingCount: number;
  plan: string;
};

export default function OwnerDashboardPage() {
  const [user, loadingAuth] = useAuthState(auth);
  const [ownerData, setOwnerData] = useState<RideOwnerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOwnerData = async () => {
      if (user) {
        setIsLoading(true);
        try {
          const ownerDocRef = doc(db, 'rideOwners', user.uid);
          const listingsQuery = query(collection(db, 'listings'), where('ownerId', '==', user.uid));

          const unsubOwner = onSnapshot(ownerDocRef, (doc) => {
             if (doc.exists()) {
                const data = doc.data();
                setOwnerData(prev => ({
                    ...prev,
                    businessName: data.name || 'Ride Owner',
                    businessType: data.businessType || 'Not Specified',
                    plan: data.plan || 'None',
                    listingCount: prev?.listingCount ?? 0,
                }));
             }
          });

          const unsubListings = onSnapshot(listingsQuery, (snapshot) => {
              setOwnerData(prev => ({
                  ...(prev || { businessName: '', businessType: '', plan: '', listingCount: 0 }),
                  listingCount: snapshot.size,
              }));
          });
          
          // Initial fetch to set loading to false
          const ownerDoc = await getDoc(ownerDocRef);
           if (ownerDoc.exists()) {
                const data = ownerDoc.data();
                setOwnerData(prev => ({
                    ...prev,
                    businessName: data.name || 'Ride Owner',
                    businessType: data.businessType || 'Not Specified',
                    plan: data.plan || 'None',
                    listingCount: prev?.listingCount ?? 0,
                }));
             }

          setIsLoading(false);
          
          return () => {
              unsubOwner();
              unsubListings();
          }

        } catch (error) {
          console.error("Error fetching ride owner data:", error);
          setIsLoading(false);
        }
      }
    };

    if (!loadingAuth) {
      fetchOwnerData();
    }
  }, [user, loadingAuth]);

  if (isLoading || loadingAuth) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/2" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-8 w-1/4" /></CardContent></Card>
          <Card><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-8 w-1/4" /></CardContent></Card>
          <Card><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-8 w-1/4" /></CardContent></Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline text-foreground">
          Welcome, {ownerData?.businessName || 'Ride Owner'}!
        </h1>
        <p className="text-muted-foreground">
          Here is an overview of your ride business.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Listings</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ownerData?.listingCount ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              Vehicles you have listed on the platform.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscription Plan</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ownerData?.plan ?? 'N/A'}</div>
            <p className="text-xs text-muted-foreground">
              Your current active plan.
            </p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Business Type</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ownerData?.businessType ?? 'N/A'}</div>
            <p className="text-xs text-muted-foreground">
              Your registered business category.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Placeholder for future components */}
      <Card>
        <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
            <CardDescription>A list of your most recent ride requests will appear here.</CardDescription>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground py-12">
            <p>No recent bookings to display.</p>
        </CardContent>
      </Card>
       <div className="text-center pt-8">
         <Button asChild>
            <Link href="/">Back to Homepage</Link>
         </Button>
       </div>
    </div>
  );
}
