
'use client';

import Image from 'next/image';
import type { Ride } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, Phone, Calendar as CalendarIcon, Star } from 'lucide-react';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, addDoc, deleteDoc, query, where, getDocs, serverTimestamp, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import Link from 'next/link';

type RideCardProps = {
  ride: Ride;
};

export function RideCard({ ride }: RideCardProps) {
  const [user] = useAuthState(auth);
  const { toast } = useToast();
  const [isSaved, setIsSaved] = useState(false);
  
  const defaultImage = "https://picsum.photos/seed/placeholder/600/400";

  useEffect(() => {
      if (!user) return;
      const savedRidesQuery = query(collection(db, 'savedRides'), where('userId', '==', user.uid), where('listingId', '==', ride.id));
      const unsubscribe = onSnapshot(savedRidesQuery, (snapshot) => {
          setIsSaved(!snapshot.empty);
      });
      return () => unsubscribe();
  }, [user, ride.id]);

  const handleSaveToggle = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card link navigation
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Please log in',
        description: 'You need to be logged in to save rides.',
      });
      return;
    }
    
    try {
        const savedRideQuery = query(collection(db, 'savedRides'), where('userId', '==', user.uid), where('listingId', '==', ride.id));
        const querySnapshot = await getDocs(savedRideQuery);

        if (querySnapshot.empty) { // Not saved, so save it
            // We need to fetch the listing to store some data for server-side sorting
            const listingRef = doc(db, 'listings', ride.id);
            const listingSnap = await getDoc(listingRef);
            if (!listingSnap.exists()) {
                toast({ variant: 'destructive', title: 'Ride not found' });
                return;
            }
            const listingData = listingSnap.data();

            await addDoc(collection(db, 'savedRides'), {
                userId: user.uid,
                listingId: ride.id,
                savedAt: serverTimestamp(),
                // Denormalized data for sorting
                listingPrice: listingData.price,
                listingType: listingData.type,
            });
            toast({ title: 'Ride Saved!', description: `${ride.name} has been added to your favorites.` });
        } else { // Already saved, so unsave it
            querySnapshot.forEach(async (document) => {
                await deleteDoc(doc(db, 'savedRides', document.id));
            });
            toast({ title: 'Ride Unsaved', description: `${ride.name} has been removed from your favorites.` });
        }
    } catch (error) {
        console.error("Error toggling saved state: ", error);
        toast({ variant: 'destructive', title: 'Something went wrong' });
    }
  };


  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full group">
        <Link href={`/ride/${ride.id}`} className="flex flex-col flex-grow">
          <CardHeader className="p-0 relative">
            <div className="absolute top-2 right-2 z-10 flex gap-2">
                {ride.isPromoted && (
                  <Badge className="bg-primary">Promoted</Badge>
                )}
            </div>
             <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-2 left-2 z-10 bg-black/30 text-white hover:bg-black/50 hover:text-white"
                onClick={handleSaveToggle}
                aria-label={isSaved ? 'Unsave ride' : 'Save ride'}
            >
                <Star className={`h-5 w-5 transition-colors ${isSaved ? 'fill-yellow-400 text-yellow-400' : 'fill-transparent'}`} />
            </Button>
            <div className="aspect-[3/2] w-full relative bg-muted">
              <Image
                  src={ride.image || defaultImage}
                  alt={ride.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          </CardHeader>
          <CardContent className="p-4 flex-grow">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm text-muted-foreground">{ride.type}</p>
                    <h3 className="text-lg font-bold font-headline group-hover:text-primary transition-colors">{ride.name}</h3>
                </div>
                <p className="text-xl font-bold text-primary whitespace-nowrap">
                    ₦{ride.price.toLocaleString()}
                </p>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
                Owner: {ride.owner.name}
            </p>
            <div className="flex items-center text-sm text-muted-foreground mt-2">
                <CalendarIcon className="h-4 w-4 mr-2" />
                <span>{ride.schedule}</span>
            </div>
          </CardContent>
          <CardFooter className="p-4 bg-muted/50 mt-auto">
             <span className="text-sm font-semibold text-primary w-full text-center">View Details &rarr;</span>
          </CardFooter>
      </Link>
      <div className="p-4 border-t flex justify-end gap-2">
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button>Contact Owner</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                    <a href={`tel:${ride.owner.contact.phone}`}>
                        <Phone className="mr-2 h-4 w-4" />
                        Call
                    </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                     <a href={`https://wa.me/${ride.owner.contact.whatsapp}`} target="_blank" rel="noopener noreferrer">
                        <WhatsAppIcon className="mr-2 h-4 w-4" />
                        WhatsApp
                    </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <a href={`mailto:${ride.owner.contact.email}`}>
                        <Mail className="mr-2 h-4 w-4" />
                        Email
                    </a>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
}
