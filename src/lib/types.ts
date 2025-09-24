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
};
