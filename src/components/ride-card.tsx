import Image from 'next/image';
import type { Ride } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, Phone } from 'lucide-react';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import { placeholderImages } from '@/lib/placeholder-images';

type RideCardProps = {
  ride: Ride;
};

export function RideCard({ ride }: RideCardProps) {
  const image = placeholderImages.find(p => p.id === ride.image);

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
      <CardHeader className="p-0 relative">
        {ride.isPromoted && (
          <Badge className="absolute top-2 right-2 z-10 bg-primary">Promoted</Badge>
        )}
        {image && (
          <Image
            src={image.imageUrl}
            alt={image.description}
            width={600}
            height={400}
            className="aspect-[3/2] w-full object-cover"
            data-ai-hint={image.imageHint}
          />
        )}
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm text-muted-foreground">{ride.type}</p>
                <h3 className="text-lg font-bold font-headline">{ride.name}</h3>
            </div>
            <p className="text-xl font-bold text-primary whitespace-nowrap">
                ₦{ride.price.toLocaleString()}
            </p>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
            Owner: {ride.owner.name}
        </p>
      </CardContent>
      <CardFooter className="p-4 bg-muted/50 flex justify-end gap-2">
        <Button variant="outline" size="icon" asChild>
          <a href={`tel:${ride.owner.contact.phone}`} aria-label="Call owner">
            <Phone className="h-4 w-4" />
          </a>
        </Button>
        <Button variant="outline" size="icon" asChild>
          <a href={`https://wa.me/${ride.owner.contact.whatsapp}`} target="_blank" rel="noopener noreferrer" aria-label="Message on WhatsApp">
            <WhatsAppIcon className="text-green-500"/>
          </a>
        </Button>
        <Button variant="outline" size="icon" asChild>
          <a href={`mailto:${ride.owner.contact.email}`} aria-label="Email owner">
            <Mail className="h-4 w-4" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
