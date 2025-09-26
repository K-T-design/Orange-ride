
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
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

// This type will be used on the server and includes the unserialized Timestamp
type FirestoreAd = Omit<Ad, 'createdAt'> & { createdAt: Timestamp };

async function getActiveAds() {
    try {
        const q = query(
            collection(db, 'advertisements'), 
            where('isActive', '==', true),
            orderBy('priority', 'desc'),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        
        const adsData = snapshot.docs.map((doc) => {
            const data = doc.data() as FirestoreAd;
            // Serialize the createdAt field before passing to the client
            return { 
                id: doc.id, 
                ...data,
                createdAt: data.createdAt.toDate().toISOString(), 
            }
        });
        
        return adsData;
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

  