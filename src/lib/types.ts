export type Ride = {
  id: string;
  name: string;
  type: 'Standard' | 'SUV' | 'Luxury' | 'Shared';
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
};
