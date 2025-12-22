import React, { useState } from 'react';
import { Booking } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, User, DollarSign, Navigation } from 'lucide-react';
import { format } from 'date-fns';
import WorkerTrackingMap from '@/components/maps/WorkerTrackingMap';

interface BookingCardProps {
  booking: Booking;
  showActions?: boolean;
  onViewDetails?: (booking: Booking) => void;
  onCancel?: (booking: Booking) => void;
}

const statusColors: Record<string, string> = {
  pending: 'bg-warning/10 text-warning border-warning/20',
  confirmed: 'bg-primary/10 text-primary border-primary/20',
  assigned: 'bg-accent/10 text-accent border-accent/20',
  in_progress: 'bg-accent/10 text-accent border-accent/20',
  completed: 'bg-success/10 text-success border-success/20',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
};

const paymentColors: Record<string, string> = {
  pending: 'bg-warning/10 text-warning border-warning/20',
  paid: 'bg-success/10 text-success border-success/20',
  refunded: 'bg-muted text-muted-foreground border-muted',
};

export default function BookingCard({ booking, showActions = true, onViewDetails, onCancel }: BookingCardProps) {
  const [showTracking, setShowTracking] = useState(false);
  const statusLabel = booking.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  const paymentLabel = booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1);
  
  const isActiveBooking = ['assigned', 'in_progress'].includes(booking.status);
  const canTrack = isActiveBooking && booking.workerId;

  return (
    <div className="bg-card rounded-xl p-5 shadow-card border border-border/50 hover:shadow-lg transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="font-display text-lg font-semibold text-foreground">{booking.serviceName}</h3>
          <p className="text-sm text-muted-foreground">Booking #{booking.id}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className={statusColors[booking.status]}>
            {statusLabel}
          </Badge>
          <Badge variant="outline" className={paymentColors[booking.paymentStatus]}>
            {paymentLabel}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 text-primary" />
          <span>{format(new Date(booking.scheduledDate), 'MMM dd, yyyy')}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4 text-primary" />
          <span>{booking.scheduledTime}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="truncate">{booking.address}</span>
        </div>
        {booking.workerName && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4 text-primary" />
            <span>{booking.workerName}</span>
          </div>
        )}
      </div>

      {/* Worker Tracking Map */}
      {showTracking && canTrack && (
        <div className="mb-4 animate-fade-in">
          <WorkerTrackingMap
            workerId={booking.workerId}
            serviceLatitude={booking.location?.lat}
            serviceLongitude={booking.location?.lng}
            height="200"
            showWorkerInfo={true}
          />
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="flex items-center gap-1.5">
          <DollarSign className="h-5 w-5 text-accent" />
          <span className="font-display text-lg font-bold text-foreground">${booking.totalAmount}</span>
        </div>
        
        {showActions && (
          <div className="flex gap-2">
            {canTrack && (
              <Button 
                variant={showTracking ? "secondary" : "outline"} 
                size="sm" 
                onClick={() => setShowTracking(!showTracking)}
              >
                <Navigation className="h-4 w-4 mr-1" />
                {showTracking ? 'Hide Map' : 'Track Worker'}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => onViewDetails?.(booking)}>
              View Details
            </Button>
            {booking.status === 'pending' && (
              <Button variant="destructive" size="sm" onClick={() => onCancel?.(booking)}>
                Cancel
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
