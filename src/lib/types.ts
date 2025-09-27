
import type { Timestamp } from 'firebase/firestore';
import { plans } from './data';

export type PlanKey = keyof typeof plans;

export type Ride = {
  id: string;
  name: string;
  type: 'Bike' | 'Car' | 'Keke' | 'Bus' | 'VIP';
  price: number;
  pickup: string;
  destination: string;
  owner: {
    name: string;
    contact: {
      phone: string;
      whatsapp: string;
      email: string;
    };
  };
  image: string;
  isPromoted: boolean;
  schedule: string;
  savedAt?: Timestamp;
  capacity?: number;
  description?: string;
};

    
