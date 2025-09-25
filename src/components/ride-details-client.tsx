
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, collection, addDoc, deleteDoc, query, where, getDocs, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import Image from 'next/image';
import { useAuthState } from 'react-firebase-hooks/auth';
import type { Ride } from '@/lib/types';
import { placeholderImages } from '@/lib/placeholder-images';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import { Calendar, Car, Mail, Phone, Star, Users, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export function RideDetailsClient({ ride }: { ride: Ride }) {
  const [isSaved, setIsSaved] = useState(false);
  const [user] = useAuthState(auth);
  const { toast } = useToast();
  const rideId = ride.id;

  useEffect(() => {
      if (!user || !rideId) return;
      const savedRidesQuery = query(collection(db, 'savedRides'), where('userId', '==', user.uid), where('listingId', '==', rideId));
      const unsubscribe = onSnapshot(savedRidesQuery, (snapshot) => {
          setIsSaved(!snapshot.empty);
      });
      return () => unsubscribe();
  }, [user, rideId]);


  const handleSaveToggle = async () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Please log in',
        description: 'You need to be logged in to save rides.',
      });
      return;
    }
    
    try {
        const savedRideQuery = query(collection(db, 'savedRides'), where('userId', '==', user.uid), where('listingId', '==', rideId));
        const querySnapshot = await getDocs(savedRideQuery);

        if (querySnapshot.empty) {
            await addDoc(collection(db, 'savedRides'), {
                userId: user.uid,
                listingId: rideId,
                savedAt: serverTimestamp(),
            });
            toast({ title: 'Ride Saved!', description: `${ride?.name} has been added to your favorites.` });
        } else {
            querySnapshot.forEach(async (document) => {
                await deleteDoc(doc(db, 'savedRides', document.id));
            });
            toast({ title: 'Ride Unsaved', description: `${ride?.name} has been removed from your favorites.` });
        }
    } catch (error) {
        console.error("Error toggling saved state: ", error);
        toast({ variant: 'destructive', title: 'Something went wrong' });
    }
  };
  
  const image = placeholderImages.find(p => p.id === ride.image);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6">
            <Button asChild variant="outline">
                <Link href="/search">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Search
                </Link>
            </Button>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
            <div>
                 <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg shadow-lg">
                    {image && (
                      <Image
                        src={image.imageUrl}
                        alt={ride.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        priority
                      />
                    )}
                     {ride.isPromoted && (
                      <Badge className="absolute top-4 left-4 z-10 bg-primary">Promoted</Badge>
                    )}
                 </div>
            </div>
            <div className="space-y-6">
                <div>
                    <Badge variant="secondary" className="mb-2">{ride.type}</Badge>
                    <h1 className="text-4xl font-bold font-headline">{ride.name}</h1>
                    <p className="text-3xl font-bold text-primary mt-2">₦{ride.price.toLocaleString()}</p>
                </div>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Ride Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="flex items-center gap-3"><Users className="h-5 w-5 text-muted-foreground" /> <span>{ride.capacity || 'N/A'} Seats</span></div>
                        <div className="flex items-center gap-3"><Calendar className="h-5 w-5 text-muted-foreground" /> <span>{ride.schedule}</span></div>
                        <div className="flex items-center gap-3"><Car className="h-5 w-5 text-muted-foreground" /> <span>Pickup: {ride.pickup}</span></div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Owner Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="font-semibold">{ride.owner?.name ?? 'Owner information not available'}</p>
                        <div className="flex flex-wrap gap-2">
                             <Button asChild>
                                <a href={`tel:${ride.owner?.contact?.phone}`}><Phone className="mr-2"/> Call</a>
                            </Button>
                            <Button asChild variant="secondary">
                                <a href={`https://wa.me/${ride.owner?.contact?.whatsapp}`} target="_blank" rel="noopener noreferrer"><WhatsAppIcon className="mr-2"/> WhatsApp</a>
                            </Button>
                            <Button asChild variant="secondary">
                                <a href={`mailto:${ride.owner?.contact?.email}`}><Mail className="mr-2"/> Email</a>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                
                 <Button onClick={handleSaveToggle} variant="outline" className="w-full">
                    <Star className={`mr-2 h-5 w-5 transition-colors ${isSaved ? 'fill-yellow-400 text-yellow-400' : 'fill-transparent'}`} /> 
                    {isSaved ? 'Remove from Favorites' : 'Save to Favorites'}
                </Button>
            </div>
        </div>

        {ride.description && (
            <div className="mt-12">
                <h2 className="text-2xl font-bold font-headline mb-4">Description</h2>
                <p className="text-muted-foreground leading-relaxed">{ride.description}</p>
            </div>
        )}
    </div>
  );
}
