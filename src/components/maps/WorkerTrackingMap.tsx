import { useWorkerTracking } from '@/hooks/useWorkerTracking';
import GoogleMapEmbed from './GoogleMapEmbed';
import { MapPin, Navigation, Loader2, User, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkerTrackingMapProps {
  workerId?: string | null;
  serviceLatitude?: number;
  serviceLongitude?: number;
  height?: string;
  className?: string;
  showWorkerInfo?: boolean;
}

const WorkerTrackingMap = ({
  workerId,
  serviceLatitude = 18.563072,
  serviceLongitude = 73.82958,
  height = "300",
  className = "",
  showWorkerInfo = true,
}: WorkerTrackingMapProps) => {
  const { workerLocation, isTracking, error } = useWorkerTracking(workerId);

  // Use worker's location if available, otherwise use service location
  const displayLat = workerLocation?.latitude ?? serviceLatitude;
  const displayLng = workerLocation?.longitude ?? serviceLongitude;
  const hasWorkerLocation = workerLocation?.latitude && workerLocation?.longitude;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Tracking Status Header */}
      {showWorkerInfo && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="font-medium">
              {hasWorkerLocation ? 'Worker Location' : 'Service Location'}
            </span>
          </div>

          {workerId && (
            <div className={cn(
              "flex items-center gap-1.5 text-xs px-2 py-1 rounded-full",
              isTracking 
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                : "bg-muted text-muted-foreground"
            )}>
              {isTracking ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  Live Tracking
                </>
              ) : (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Connecting...
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Map */}
      <GoogleMapEmbed
        latitude={displayLat}
        longitude={displayLng}
        height={height}
        zoom={hasWorkerLocation ? 15 : 12}
        className="shadow-sm"
      />

      {/* Worker Info Card */}
      {showWorkerInfo && workerId && (
        <div className={cn(
          "flex items-center justify-between p-3 rounded-lg",
          hasWorkerLocation 
            ? "bg-primary/5 border border-primary/20" 
            : "bg-muted/50 border border-border"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "h-10 w-10 rounded-full flex items-center justify-center",
              hasWorkerLocation ? "bg-primary/10" : "bg-muted"
            )}>
              <User className={cn(
                "h-5 w-5",
                hasWorkerLocation ? "text-primary" : "text-muted-foreground"
              )} />
            </div>
            <div>
              <p className="text-sm font-medium">
                {hasWorkerLocation ? 'Worker En Route' : 'Waiting for Worker'}
              </p>
              <p className="text-xs text-muted-foreground">
                {hasWorkerLocation 
                  ? `Last updated: ${workerLocation.lastUpdated.toLocaleTimeString()}`
                  : 'Location updates will appear here'
                }
              </p>
            </div>
          </div>

          {hasWorkerLocation && (
            <div className="flex items-center gap-1 text-xs text-primary">
              <Navigation className="h-3 w-3" />
              <span>
                {displayLat?.toFixed(4)}, {displayLng?.toFixed(4)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Error State */}
      {error && (
        <p className="text-xs text-destructive">
          Tracking error: {error}
        </p>
      )}

      {/* No Worker Assigned */}
      {!workerId && showWorkerInfo && (
        <div className="flex items-center gap-2 p-3 bg-accent/10 border border-accent/20 rounded-lg">
          <Clock className="h-4 w-4 text-accent" />
          <p className="text-sm text-muted-foreground">
            Worker tracking will be available once a professional is assigned to your booking.
          </p>
        </div>
      )}
    </div>
  );
};

export default WorkerTrackingMap;
