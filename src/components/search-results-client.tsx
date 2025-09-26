
'use client';

import { useState, useMemo, useEffect } from 'react';
import type { Ride } from '@/lib/types';
import { RideCard } from '@/components/ride-card';
import { Car, Filter } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';

// This new client component will handle the interactive filtering and sorting
export function SearchResultsClient({ initialResults }: { initialResults: Ride[] }) {
  const [sortOrder, setSortOrder] = useState('promoted_desc');
  const [priceRange, setPriceRange] = useState([0, 200000]);
  const [isClient, setIsClient] = useState(false);
  const [maxPrice, setMaxPrice] = useState(200000);

  useEffect(() => {
    // This ensures the slider only renders on the client to avoid hydration issues
    setIsClient(true);
    const calculatedMaxPrice = Math.max(...initialResults.map(r => r.price), 200000);
    setMaxPrice(calculatedMaxPrice);
    setPriceRange([0, calculatedMaxPrice]);
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
                        max={maxPrice}
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


export const SearchSkeleton = () => (
  <div className="space-y-8">
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
