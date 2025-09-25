
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, getDocs, orderBy } from 'firebase/firestore';
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
  createdAt: any;
};

async function getActiveAds(): Promise<Ad[]> {
    try {
        const q = query(
            collection(db, 'advertisements'), 
            where('isActive', '==', true)
        );
        const snapshot = await getDocs(q);
        const adsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Ad));
        
        // Sort on the server side
        const sortedAds = adsData.sort((a, b) => {
            const priorityA = a.priority || 0;
            const priorityB = b.priority || 0;
            if (priorityA !== priorityB) {
                return priorityB - priorityA;
            }
            // Firestore Timestamps need to be converted for sorting
            const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
            const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
            return timeB - timeA;
        });
        return sortedAds;
    } catch (error) {
        console.error("Error fetching ads: ", error);
        return [];
    }
}


function AdCarouselClient({ ads }: { ads: Ad[] }) {
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
                <Image
                  src={ad.imageUrl}
                  alt={ad.description}
                  fill
                  className="object-cover"
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


export async function AdCarousel() {
    const ads = await getActiveAds();

    // The Skeleton can be part of the Server Component during suspense
    if (ads.length === 0) {
        return null; // Or return a placeholder if desired
    }

    return <AdCarouselClient ads={ads} />;
}
