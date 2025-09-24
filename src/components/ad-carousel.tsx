
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Image from 'next/image';
import Link from 'next/link';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Autoplay from "embla-carousel-autoplay";

type Ad = {
  id: string;
  imageUrl: string;
  description: string;
  link?: string;
  isActive: boolean;
  priority?: number;
};

export function AdCarousel() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(
        collection(db, 'advertisements'), 
        where('isActive', '==', true),
        orderBy('priority', 'desc'),
        orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const adsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Ad));
      setAds(adsData);
      setIsLoading(false);
    }, (error) => {
        console.error("Error fetching ads: ", error);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <div className="w-full">
        <Skeleton className="aspect-[16/6] w-full rounded-lg" />
      </div>
    );
  }

  if (ads.length === 0) {
    return null; // Don't render anything if there are no active ads
  }

  return (
    <Carousel
      opts={{
        align: 'start',
        loop: true,
      }}
      plugins={[
        Autoplay({
          delay: 5000,
        }),
      ]}
      className="w-full"
    >
      <CarouselContent>
        {ads.map((ad) => (
          <CarouselItem key={ad.id}>
            <Card className="overflow-hidden">
              <CardContent className="relative aspect-[16/6] p-0 bg-muted">
                 <Skeleton className="absolute inset-0" />
                <Image
                  src={ad.imageUrl}
                  alt={ad.description}
                  fill
                  className="object-cover transition-opacity opacity-0 duration-500"
                  onLoadingComplete={(image) => image.classList.remove('opacity-0')}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6 text-white">
                  <h3 className="text-2xl font-bold font-headline">{ad.description}</h3>
                  {ad.link && (
                    <Button asChild variant="secondary" className="mt-2">
                        <Link href={ad.link} target="_blank" rel="noopener noreferrer">
                            Learn More
                        </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="ml-16" />
      <CarouselNext className="mr-16"/>
    </Carousel>
  );
}
