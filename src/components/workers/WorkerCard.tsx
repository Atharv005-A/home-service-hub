import React from 'react';
import { Worker } from '@/types';
import { services } from '@/data/mockData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, MapPin, CheckCircle, Briefcase } from 'lucide-react';

interface WorkerCardProps {
  worker: Worker;
  onAssign?: (worker: Worker) => void;
  onViewProfile?: (worker: Worker) => void;
}

const availabilityColors: Record<string, string> = {
  available: 'bg-success/10 text-success border-success/20',
  busy: 'bg-warning/10 text-warning border-warning/20',
  offline: 'bg-muted text-muted-foreground border-muted',
};

export default function WorkerCard({ worker, onAssign, onViewProfile }: WorkerCardProps) {
  const workerServices = worker.services.map(id => services.find(s => s.id === id)?.name).filter(Boolean);

  return (
    <div className="bg-card rounded-xl p-5 shadow-card border border-border/50 hover:shadow-lg transition-all duration-300">
      <div className="flex items-start gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground text-xl font-bold">
            {worker.name.charAt(0)}
          </div>
          {worker.verified && (
            <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-success flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-success-foreground" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-display font-semibold text-foreground truncate">{worker.name}</h3>
            <Badge variant="outline" className={availabilityColors[worker.availability]}>
              {worker.availability}
            </Badge>
          </div>

          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-accent fill-accent" />
              <span className="font-medium">{worker.rating}</span>
            </div>
            <div className="flex items-center gap-1">
              <Briefcase className="h-4 w-4" />
              <span>{worker.completedJobs} jobs</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {workerServices.slice(0, 3).map((service, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {service}
              </Badge>
            ))}
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2">{worker.bio}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
        <div className="text-sm">
          <span className="text-muted-foreground">Rate: </span>
          <span className="font-semibold text-foreground">${worker.hourlyRate}/hr</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onViewProfile?.(worker)}>
            View Profile
          </Button>
          {worker.availability === 'available' && onAssign && (
            <Button size="sm" onClick={() => onAssign(worker)}>
              Assign
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
