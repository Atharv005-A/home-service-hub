import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Service } from '@/types';
import { Button } from '@/components/ui/button';
import { Wrench, Zap, Snowflake, Sparkles, Paintbrush, Hammer, Bug, Settings, Clock, DollarSign } from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  wrench: Wrench,
  zap: Zap,
  snowflake: Snowflake,
  sparkles: Sparkles,
  paintbrush: Paintbrush,
  hammer: Hammer,
  bug: Bug,
  settings: Settings,
};

interface ServiceCardProps {
  service: Service;
}

export default function ServiceCard({ service }: ServiceCardProps) {
  const navigate = useNavigate();
  const Icon = iconMap[service.icon] || Wrench;

  return (
    <div className="group relative bg-card rounded-2xl p-6 shadow-card hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-border/50">
      <div className="absolute inset-0 bg-gradient-accent opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300" />
      
      <div className="relative">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-md group-hover:scale-110 transition-transform duration-300">
            <Icon className="h-7 w-7" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground">{service.name}</h3>
            <span className="text-xs text-muted-foreground">{service.category}</span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {service.description}
        </p>

        <div className="flex items-center gap-4 mb-4 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <DollarSign className="h-4 w-4 text-accent" />
            <span>From ${service.basePrice}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-4 w-4 text-accent" />
            <span>{service.estimatedDuration}</span>
          </div>
        </div>

        <Button 
          variant="outline" 
          className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
          onClick={() => navigate(`/book/${service.id}`)}
        >
          Book Now
        </Button>
      </div>
    </div>
  );
}
