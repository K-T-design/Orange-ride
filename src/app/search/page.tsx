
'use client';

import { Suspense, useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { RideCard } from '@/components/ride-card';
import { expandRideSearchResults } from '@/ai/flows/expand-ride-search-results';
import { RIDES } from '@/lib/data';
import type { Ride } from '@/lib/types';
import { Car, Route, Sparkles, Filter, SlidersHorizontal } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// This new client component will handle the interactive filtering and sorting
function SearchResultsClient({ initialResults }: { initialResults: Ride[] }) {
  const [sortOrder, setSortOrder] = useState('promoted_desc');
  const [priceRange, setPriceRange] = useState([0, 200000]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // This ensures the slider only renders on the client to avoid hydration issues
    setIsClient(true);
    const maxPrice = Math.max(...initialResults.map(r => r.price), 200000);
    setPriceRange([0, maxPrice]);
  }, [initialResults]);

  const filteredAndSortedRides = useMemo(() => {
    return initialResults
      .filter(ride => ride.price >= priceRange[0] && ride.price <= priceRange[1])
      .sort((a, b) => {
        switch (sortOrder) {
          case 'price_asc':
            return a.price - b.price;
          case 'price_desc':
            return b.price - a.price;
          case 'name_asc':
            return a.name.localeCompare(b.name);
          case 'promoted_desc':
          default:
            if (a.isPromoted && !b.isPromoted) return -1;
            if (!a.isPromoted && b.isPromoted) return 1;
            return a.price - b.price; // Default to price asc for secondary sort
        }
      });
  }, [initialResults, sortOrder, priceRange]);

  return (
    <>
      <Card className="mb-8">
        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-2">
                <Filter className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold">Filter & Sort</h3>
              </div>
               <p className="text-sm text-muted-foreground">Refine your results</p>
            </div>
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="sort" className="text-sm font-medium text-muted-foreground">Sort by</label>
                  <Select value={sortOrder} onValueChange={setSortOrder}>
                      <SelectTrigger id="sort" className="w-full">
                          <SelectValue placeholder="Sort rides" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="promoted_desc">Recommended</SelectItem>
                          <SelectItem value="price_asc">Price: Low to High</SelectItem>
                          <SelectItem value="price_desc">Price: High to Low</SelectItem>
                          <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                      </SelectContent>
                  </Select>
                </div>
                <div>
                     <label htmlFor="price" className="text-sm font-medium text-muted-foreground">
                        Max Price: ₦{priceRange[1].toLocaleString()}
                    </label>
                    {isClient && (
                      <Slider
                        id="price"
                        min={0}
                        max={Math.max(...initialResults.map(r => r.price), 200000)}
                        step={1000}
                        value={[priceRange[1]]}
                        onValueChange={(value) => setPriceRange([0, value[0]])}
                      />
                    )}
                </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredAndSortedRides.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-lg">
          <Car className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">No rides match your filters</h2>
          <p className="mt-2 text-muted-foreground">Try adjusting your price range or sorting.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAndSortedRides.map((ride) => (
            <RideCard key={ride.id} ride={ride} />
          ))}
        </div>
      )}
    </>
  );
}


const SearchResults = async () => {
  const searchParams = useSearchParams();
  const pickup = searchParams.get('from') || '';
  const destination = searchParams.get('to') || '';
  const rideType = searchParams.get('type') || 'Any';

  const findRides = (p: string, d?: string, t?: string): Ride[] => {
    if (!p) return [];
    return RIDES.filter((ride) => {
      const pickupMatch = ride.pickup.toLowerCase().includes(p.toLowerCase());
      const destinationMatch = !d || ride.destination.toLowerCase().includes(d.toLowerCase());
      const typeMatch = !t || t === 'Any' || ride.type === t;
      return pickupMatch && destinationMatch && typeMatch;
    });
  };

  // Fetch all possible results on the server first
  const directResults = findRides(pickup, destination, rideType);
  const foundRideIds = new Set(directResults.map((r) => r.id));
  
  let suggestedPickupRides: Ride[] = [];
  let alternativeDestinationRides: Ride[] = [];

  if (pickup && destination) {
    try {
      const aiSuggestions = await expandRideSearchResults({
        pickupLocation: pickup,
        destination: destination,
        rideType: rideType,
      });

      for (const location of aiSuggestions.suggestedPickupLocations) {
        const rides = findRides(location, destination, rideType);
        rides.forEach((ride) => {
          if (!foundRideIds.has(ride.id)) {
            suggestedPickupRides.push(ride);
            foundRideIds.add(ride.id);
          }
        });
      }

      for (const altDest of aiSuggestions.alternativeDestinations) {
        const rides = findRides(pickup, altDest, rideType);
        rides.forEach((ride) => {
          if (!foundRideIds.has(ride.id)) {
            alternativeDestinationRides.push(ride);
            foundRideIds.add(ride.id);
          }
        });
      }
    } catch (error) {
      console.error('AI search expansion failed:', error);
    }
  }

  const allInitialResults = [
    ...directResults,
    ...suggestedPickupRides,
    ...alternativeDestinationRides,
  ];
  
  // Remove duplicates before sending to client
  const uniqueInitialResults = allInitialResults.filter(
    (ride, index, self) => index === self.findIndex((r) => r.id === ride.id)
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2 font-headline">
        Search Results
      </h1>
      <p className="text-muted-foreground mb-6">
        Showing rides
        {pickup && <> from <span className="font-semibold text-primary">{pickup}</span></>}
        {destination && <> to <span className="font-semibold text-primary">{destination}</span></>}
      </p>

      {uniqueInitialResults.length === 0 ? (
         <div className="text-center py-20 bg-card rounded-lg">
          <Car className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">No rides found</h2>
          <p className="mt-2 text-muted-foreground">Try adjusting your search criteria.</p>
        </div>
      ) : (
         <SearchResultsClient initialResults={uniqueInitialResults} />
      )}
    </div>
  );
};

const SearchPage = () => {
  return (
    <Suspense fallback={<SearchSkeleton />}>
      <SearchResults />
    </Suspense>
  );
};

const SearchSkeleton = () => (
  <div className="container mx-auto px-4 py-8">
    <div className="h-9 w-1/3 bg-muted rounded-md animate-pulse mb-2" />
    <div className="h-6 w-1/2 bg-muted rounded-md animate-pulse mb-6" />
    <Skeleton className="h-32 w-full mb-8" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="bg-card p-4 rounded-lg shadow-sm animate-pulse">
          <div className="h-40 bg-muted rounded-md" />
          <div className="mt-4 h-5 w-3/4 bg-muted rounded-md" />
          <div className="mt-2 h-4 w-1/2 bg-muted rounded-md" />
          <div className="mt-4 h-4 w-1/4 bg-muted rounded-md" />
        </div>
      ))}
    </div>
  </div>
);

export default SearchPage;
