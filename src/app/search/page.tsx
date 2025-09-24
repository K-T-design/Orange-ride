import { Suspense } from 'react';
import { RideCard } from '@/components/ride-card';
import { expandRideSearchResults } from '@/ai/flows/expand-ride-search-results';
import { RIDES } from '@/lib/data';
import type { Ride } from '@/lib/types';
import { Car, Route, Sparkles } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

type SearchPageProps = {
  searchParams: {
    from?: string;
    to?: string;
    type?: string;
  };
};

const findRides = (pickup: string, destination?: string, type?: string): Ride[] => {
  if (!pickup) return [];

  return RIDES.filter((ride) => {
    const pickupMatch = ride.pickup.toLowerCase().includes(pickup.toLowerCase());
    const destinationMatch = !destination || ride.destination.toLowerCase().includes(destination.toLowerCase());
    const typeMatch = !type || type === 'Any' || ride.type === type;
    return pickupMatch && destinationMatch && typeMatch;
  });
};

const SearchResults = async ({ searchParams }: SearchPageProps) => {
  const pickup = searchParams.from || '';
  const destination = searchParams.to || '';
  const rideType = searchParams.type || 'Any';

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
      // Silently fail, so the user at least gets direct results
    }
  }

  const allResults = [
    ...directResults,
    ...suggestedPickupRides,
    ...alternativeDestinationRides,
  ];

  const promotedRides = allResults.filter(r => r.isPromoted);
  const regularRides = allResults.filter(r => !r.isPromoted);
  const uniquePromotedIds = new Set(promotedRides.map(r => r.id));
  const uniqueRegularRides = regularRides.filter(r => !uniquePromotedIds.has(r.id));
  
  const finalResults = [...promotedRides, ...uniqueRegularRides];

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

      {finalResults.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-lg">
          <Car className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">No rides found</h2>
          <p className="mt-2 text-muted-foreground">Try adjusting your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {finalResults.map((ride) => (
            <RideCard key={ride.id} ride={ride} />
          ))}
        </div>
      )}

      {directResults.length > 0 && (suggestedPickupRides.length > 0 || alternativeDestinationRides.length > 0) && <Separator className="my-12" />}

      {suggestedPickupRides.length > 0 && (
         <div>
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="h-8 w-8 text-primary" />
              <h2 className="text-2xl font-bold font-headline">AI Suggestion: Similar Pickup Locations</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {suggestedPickupRides.map((ride) => (
                <RideCard key={ride.id} ride={ride} />
              ))}
            </div>
         </div>
       )}

      {alternativeDestinationRides.length > 0 && (
         <div className="mt-12">
            <div className="flex items-center gap-3 mb-6">
              <Route className="h-8 w-8 text-primary" />
              <h2 className="text-2xl font-bold font-headline">AI Suggestion: Alternative Destinations</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {alternativeDestinationRides.map((ride) => (
                <RideCard key={ride.id} ride={ride} />
              ))}
            </div>
         </div>
       )}
    </div>
  );
};

const SearchPage = ({ searchParams }: SearchPageProps) => {
  return (
    <Suspense fallback={<SearchSkeleton />}>
      <SearchResults searchParams={searchParams} />
    </Suspense>
  );
};

const SearchSkeleton = () => (
  <div className="container mx-auto px-4 py-8">
    <div className="h-9 w-1/3 bg-muted rounded-md animate-pulse mb-2" />
    <div className="h-6 w-1/2 bg-muted rounded-md animate-pulse mb-6" />
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
