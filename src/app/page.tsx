
import Image from 'next/image';
import { RideSearchForm } from '@/components/ride-search-form';
import { RideCard } from '@/components/ride-card';
import { placeholderImages } from '@/lib/placeholder-images';
import { AdCarousel } from '@/components/ad-carousel';
import { collection, query, where, getDocs, limit, orderBy, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Ride } from '@/lib/types';
import { Search, CheckCircle, Phone } from 'lucide-react';

async function getFeaturedRides(): Promise<Ride[]> {
  try {
    const processSnapshot = (snapshot: any): Ride[] => {
      return snapshot.docs.map((doc: DocumentData) => {
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
          image: data.image || 'sedan-1',
          isPromoted: data.isPromoted || data.status === 'Promoted' || false,
          schedule: data.schedule || 'Not specified',
          capacity: data.capacity,
          description: data.description,
        } as Ride;
      });
    };

    const promotedQuery = query(
      collection(db, 'listings'),
      where('status', '==', 'Promoted'),
      limit(4)
    );
    const promotedSnapshot = await getDocs(promotedQuery);
    let rides = processSnapshot(promotedSnapshot);

    if (rides.length < 4) {
      const needed = 4 - rides.length;
      const recentQuery = query(
        collection(db, 'listings'),
        where('status', '==', 'Approved'),
        orderBy('createdAt', 'desc'),
        limit(needed)
      );
      const recentSnapshot = await getDocs(recentQuery);
      
      const existingIds = new Set(rides.map(r => r.id));
      const recentRides = processSnapshot(recentSnapshot);
      const filteredRecentRides = recentRides.filter(r => !existingIds.has(r.id));
      
      rides = [...rides, ...filteredRecentRides];
    }
    
    return rides;
  } catch (error) {
    console.error("Error fetching featured rides: ", error);
    return [];
  }
}


export default async function Home() {
  const featuredRides = await getFeaturedRides();
  const heroImage = placeholderImages.find(p => p.id === 'hero');

  return (
    <div className="flex flex-col gap-8 md:gap-16">
      <section className="relative h-[400px] md:h-[500px] w-full">
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            fill
            className="object-cover"
            priority
            data-ai-hint={heroImage.imageHint}
          />
        )}
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 flex h-full flex-col items-center justify-center gap-6 text-center text-primary-foreground px-4">
          <h1 className="text-4xl md:text-6xl font-bold font-headline animate-fade-in-down">
            Your Journey, Your Way.
          </h1>
          <p className="text-lg md:text-xl max-w-2xl animate-fade-in-up">
            Find the perfect ride for any destination. Reliable, affordable, and just a few clicks away.
          </p>
          <div className="w-full max-w-4xl pt-4 animate-fade-in-up animation-delay-300">
            <RideSearchForm />
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4">
        <AdCarousel />
      </section>

      {featuredRides.length > 0 && (
        <section className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8 font-headline">Featured Rides</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {featuredRides.map((ride, index) => (
              <div
                key={ride.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${200 * index}ms` }}
              >
                <RideCard ride={ride} />
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="bg-muted py-16">
        <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold font-headline mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-12">Getting on your way has never been easier. Follow these simple steps to find your next ride.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="flex flex-col items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Search className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-semibold">1. Search for a Ride</h3>
                    <p className="text-muted-foreground">Enter your pickup and destination to browse a wide variety of available vehicles.</p>
                </div>
                 <div className="flex flex-col items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <CheckCircle className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-semibold">2. Choose the Best Fit</h3>
                    <p className="text-muted-foreground">Compare prices, schedules, and vehicle types to find the perfect ride for your needs.</p>
                </div>
                 <div className="flex flex-col items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Phone className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-semibold">3. Contact the Owner</h3>
                    <p className="text-muted-foreground">Connect directly with the ride owner via phone or WhatsApp to finalize details.</p>
                </div>
            </div>
        </div>
      </section>
    </div>
  );
}

declare module 'react' {
  interface CSSProperties {
    [key: `--${string}`]: string | number;
  }
}
