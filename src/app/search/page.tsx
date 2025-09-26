
import { Suspense } from 'react';
import { collection, query, where, getDocs, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Ride } from '@/lib/types';
import { SearchResultsClient, SearchSkeleton } from '@/components/search-results-client';
import { RideSearchForm } from '@/components/ride-search-form';
import { Button } from '@/components/ui/button';
import { Search as SearchIcon, Car } from 'lucide-react';

async function fetchRides(pickup: string, destination: string, rideType: string): Promise<Ride[]> {
  try {
    const listingsRef = collection(db, 'listings');
    const queryConstraints = [
        where('status', 'in', ['Approved', 'Promoted'])
    ];

    if (pickup) {
        queryConstraints.push(where('pickup', '==', pickup));
    }

    if (rideType && rideType !== 'Any') {
        queryConstraints.push(where('type', '==', rideType));
    }
    
    const q = query(listingsRef, ...queryConstraints);
    const querySnapshot = await getDocs(q);

    let rides = querySnapshot.docs.map(doc => {
        const data = doc.data() as DocumentData;
        return {
            id: doc.id,
            name: data.name || 'Unnamed Ride',
            type: data.type || 'Car',
            price: data.price || 0,
            pickup: data.pickup || 'N/A',
            destination: data.destination || 'N/A',
            owner: {
                name: data.owner || 'Information unavailable',
                contact: data.contact || { phone: '', whatsapp: '', email: '' }
            },
            image: data.image || `https://picsum.photos/seed/${doc.id}/600/400`,
            isPromoted: data.isPromoted || data.status === 'Promoted' || false,
            schedule: data.schedule || 'Not specified',
            capacity: data.capacity,
            description: data.description,
        } as Ride;
    });

    // Client-side filtering for destination if it's provided, as Firestore doesn't support partial text search well.
    if (destination) {
        rides = rides.filter(ride => 
            ride.destination && ride.destination.toLowerCase().includes(destination.toLowerCase())
        );
    }

    return rides;

  } catch (error) {
    console.error("Error fetching search results:", error);
    return [];
  }
}

// This is the main Server Component for the page
export default async function SearchPage({ searchParams }: { searchParams: { from?: string; to?: string; type?: string } }) {
  const pickup = searchParams.from || '';
  const destination = searchParams.to || '';
  const rideType = searchParams.type || 'Any';

  // Fetch data on the server
  const rides = await fetchRides(pickup, destination, rideType);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 p-3 rounded-lg -mt-4">
        <RideSearchForm />
      </div>

      <h2 className="text-3xl font-bold mb-2 font-headline">
        Search Results
      </h2>
      <p className="text-muted-foreground mb-6">
        Showing rides
        {pickup && <> from <span className="font-semibold text-primary">{pickup}</span></>}
        {destination && <> to <span className="font-semibold text-primary">{destination}</span></>}
        {` (${rides.length} found)`}
      </p>

      <Suspense fallback={<SearchSkeleton />}>
        {rides.length > 0 ? (
          <SearchResultsClient initialResults={rides} />
        ) : (
          <div className="text-center py-20 bg-card rounded-lg animate-fade-in-up">
            <Car className="mx-auto h-12 w-12 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-semibold">No rides found matching your search.</h2>
            <p className="mt-2 text-muted-foreground">Try using a different location or adjusting your filters.</p>
            {/* The button can't be used here as it's a client interaction, but it's not critical */}
          </div>
        )}
      </Suspense>
    </div>
  );
};
