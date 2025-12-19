export type UserRole = 'customer' | 'worker' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  address?: string;
  createdAt: Date;
}

export interface Worker extends User {
  role: 'worker';
  services: string[];
  rating: number;
  completedJobs: number;
  availability: 'available' | 'busy' | 'offline';
  hourlyRate: number;
  location: {
    lat: number;
    lng: number;
  };
  bio?: string;
  verified: boolean;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  basePrice: number;
  estimatedDuration: string;
}

export interface Booking {
  id: string;
  customerId: string;
  customerName: string;
  workerId?: string;
  workerName?: string;
  serviceId: string;
  serviceName: string;
  status: BookingStatus;
  scheduledDate: Date;
  scheduledTime: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  description: string;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type BookingStatus = 
  | 'pending'
  | 'confirmed'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'refunded';

export interface Review {
  id: string;
  bookingId: string;
  customerId: string;
  workerId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}
