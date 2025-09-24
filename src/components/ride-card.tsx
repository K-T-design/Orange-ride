import Image from 'next/image';
import type { Ride } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, Phone, Calendar as CalendarIcon, MessageCircle } from 'lucide-react';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import { placeholderImages } from '@/lib/placeholder-images';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
        <div className="flex items-center text-sm text-muted-foreground mt-2">
            <CalendarIcon className="h-4 w-4 mr-2" />
            <span>{ride.schedule}</span>
        </div>
      </CardContent>
      <CardFooter className="p-4 bg-muted/50 flex justify-end gap-2">
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
                        <MessageCircle className="mr-2 h-4 w-4" />
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
      </CardFooter>
    </Card>
  );
}
