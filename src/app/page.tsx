import Image from 'next/image';
import { RideSearchForm } from '@/components/ride-search-form';
import { RideCard } from '@/components/ride-card';
import { RIDES } from '@/lib/data';
import { placeholderImages } from '@/lib/placeholder-images';

export default function Home() {
  const featuredRides = RIDES.slice(0, 3);
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
        <h2 className="text-3xl font-bold text-center mb-8 font-headline">Featured Rides</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
    </div>
  );
}

declare module 'react' {
  interface CSSProperties {
    [key: `--${string}`]: string | number;
  }
}
