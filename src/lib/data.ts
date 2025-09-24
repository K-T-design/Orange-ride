
import type { Ride } from './types';
import { Timestamp } from 'firebase/firestore';

const NIGERIAN_CITIES = [
  'Lagos',
  'Abuja',
  'Kano',
  'Ibadan',
  'Port Harcourt',
  'Benin City',
  'Kaduna',
  'Enugu',
  'Aba',
  'Jos',
  'Ilorin',
  'Warri',
  'Calabar',
  'Uyo',
  'Owerri',
  'Abeokuta',
  'Onitsha',
  'Maiduguri',
  'Zaria',
  'Akure'
];


export const RIDES: Ride[] = [
  {
    id: '1',
    name: 'Toyota Camry 2021',
    type: 'Car',
    price: 15000,
    pickup: 'Ikeja',
    destination: 'Lekki',
    owner: {
      name: 'John Adebayo',
      contact: {
        phone: '2348012345678',
        whatsapp: '2348012345678',
        email: 'john.adebayo@example.com',
      },
    },
    image: 'sedan-1',
    isPromoted: true,
    schedule: 'Mon-Fri, 9am-5pm'
  },
  {
    id: '2',
    name: 'Honda CR-V 2022',
    type: 'Car',
    price: 25000,
    pickup: 'Surulere',
    destination: 'Victoria Island',
    owner: {
      name: 'City Movers Ltd.',
      contact: {
        phone: '2348023456789',
        whatsapp: '2348023456789',
        email: 'contact@citymovers.com',
      },
    },
    image: 'suv-1',
    isPromoted: false,
    schedule: 'Daily, 24 hours'
  },
  {
    id: '3',
    name: 'Mercedes-Benz E-Class',
    type: 'VIP',
    price: 45000,
    pickup: 'Banana Island',
    destination: 'Ikeja GRA',
    owner: {
      name: 'Prestige Rides',
      contact: {
        phone: '2348034567890',
        whatsapp: '2348034567890',
        email: 'bookings@prestigerides.ng',
      },
    },
    image: 'luxury-1',
    isPromoted: true,
    schedule: 'Weekends, 10am-10pm'
  },
  {
    id: '4',
    name: 'Ford Transit',
    type: 'Bus',
    price: 5000,
    pickup: 'Yaba',
    destination: 'Marina',
    owner: {
      name: 'Go-Together Shuttles',
      contact: {
        phone: '2348045678901',
        whatsapp: '2348045678901',
        email: 'support@gotogether.ng',
      },
    },
    image: 'van-1',
    isPromoted: false,
    schedule: 'Mon-Sat, 6am-8pm'
  },
  {
    id: '5',
    name: 'Bajaj RE',
    type: 'Keke',
    price: 2000,
    pickup: 'Lekki',
    destination: 'Ajah',
    owner: {
      name: 'Chioma Nwosu',
      contact: {
        phone: '2348056789012',
        whatsapp: '2348056789012',
        email: 'chioma.n@example.com',
      },
    },
    image: 'keke-1',
    isPromoted: false,
    schedule: 'Daily, 7am-9pm'
  },
  {
    id: '6',
    name: 'Gokada Bike',
    type: 'Bike',
    price: 1500,
    pickup: 'Victoria Island',
    destination: 'Ikoyi',
    owner: {
      name: 'Safe Journey Ltd.',
      contact: {
        phone: '2348067890123',
        whatsapp: '2348067890123',
        email: 'safe@journey.com',
      },
    },
    image: 'bike-1',
    isPromoted: false,
    schedule: 'Mon-Fri, 8am-6pm'
  },
  {
    id: '7',
    name: 'Rolls-Royce Phantom',
    type: 'VIP',
    price: 150000,
    pickup: 'Ikoyi',
    destination: 'Eko Atlantic',
    owner: {
      name: 'Prestige Rides',
      contact: {
        phone: '2348034567890',
        whatsapp: '2348034567890',
        email: 'bookings@prestigerides.ng',
      },
    },
    image: 'luxury-2',
    isPromoted: false,
    schedule: 'By Appointment'
  },
  {
    id: '8',
    name: 'Toyota Coaster',
    type: 'Bus',
    price: 7000,
    pickup: 'Ajah',
    destination: 'CMS',
    owner: {
      name: 'Go-Together Shuttles',
      contact: {
        phone: '2348045678901',
        whatsapp: '2348045678901',
        email: 'support@gotogether.ng',
      },
    },
    image: 'shared-1',
    isPromoted: false,
    schedule: 'Daily, 5am-9pm'
  },
  {
    id: '9',
    name: 'Honda Accord',
    type: 'Car',
    price: 16000,
    pickup: 'Maryland',
    destination: 'Apapa',
    owner: {
      name: 'Tunde Bello',
      contact: {
        phone: '2348078901234',
        whatsapp: '2348078901234',
        email: 'tunde.b@example.com',
      },
    },
    image: 'sedan-3',
    isPromoted: false,
    schedule: 'Mon-Fri, 7am-7pm'
  },
  {
    id: '10',
    name: 'TVS King',
    type: 'Keke',
    price: 2500,
    pickup: 'Gbagada',
    destination: 'Oshodi',
    owner: {
      name: 'Comfort Drives',
      contact: {
        phone: '2348089012345',
        whatsapp: '2348089012345',
        email: 'info@comfortdrives.com',
      },
    },
    image: 'keke-2',
    isPromoted: true,
    schedule: 'Daily, 6am-10pm'
  }
];

export const seedableOwners = [
  { id: 'O001', name: 'John Adebayo', contact: '2348012345678', plan: 'Monthly', status: 'Active' },
  { id: 'O002', name: 'City Movers Ltd.', contact: 'contact@citymovers.com', plan: 'Yearly', status: 'Active' },
  { id: 'O003', name: 'Prestige Rides', contact: 'bookings@prestigerides.ng', plan: 'Yearly', status: 'Suspended' },
  { id: 'O004', name: 'Bayo Adekunle', contact: 'bayo@example.com', plan: 'None', status: 'Pending Approval' },
  { id: 'O005', name: 'Chioma Nwosu', contact: '2348056789012', plan: 'Weekly', status: 'Active' },
];

export const seedableListings = [
  { id: 'L001', type: 'Car', model: 'Toyota Camry', price: 15000, owner: 'John Adebayo', status: 'Approved' },
  { id: 'L002', type: 'VIP', model: 'Mercedes-Benz E-Class', price: 45000, owner: 'Prestige Rides', status: 'Promoted' },
  { id: 'L003', type: 'Bus', model: 'Ford Transit', price: 5000, owner: 'Go-Together', status: 'Pending' },
  { id: 'L004', type: 'Keke', model: 'Bajaj RE', price: 2000, owner: 'Chioma Nwosu', status: 'Approved' },
  { id: 'L005', type: 'Bike', model: 'Gokada Bike', price: 1500, owner: 'Safe Journey Ltd.', status: 'Expired' },
];

export const seedableNotifications = [
    { id: 'N001', message: "New subscription payment: ₦10,000 (Weekly)", createdAt: Timestamp.now() },
    { id: 'N002', message: "New ride owner 'Bayo Adekunle' pending approval.", createdAt: Timestamp.now() },
    { id: 'N003', message: "New listing 'Toyota Camry 2022' pending approval.", createdAt: Timestamp.now() },
    { id: 'N004', message: "Subscription for 'City Movers Ltd.' has expired.", createdAt: Timestamp.now() },
];


export { NIGERIAN_CITIES };
