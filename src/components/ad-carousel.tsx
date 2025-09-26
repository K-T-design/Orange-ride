
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AdCarouselClient } from './ad-carousel-client';

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

export async function AdCarousel() {
    const ads = await getActiveAds();

    if (ads.length === 0) {
        return null;
    }

    return <AdCarouselClient ads={ads} />;
}
