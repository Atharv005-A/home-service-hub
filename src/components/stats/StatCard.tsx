import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    positive: boolean;
  };
  variant?: 'default' | 'primary' | 'accent' | 'success';
}

const variantStyles = {
  default: 'bg-card border-border/50',
  primary: 'bg-gradient-primary text-primary-foreground border-transparent',
  accent: 'bg-gradient-accent text-accent-foreground border-transparent',
  success: 'bg-gradient-success text-success-foreground border-transparent',
};

const iconVariantStyles = {
  default: 'bg-primary/10 text-primary',
  primary: 'bg-primary-foreground/20 text-primary-foreground',
  accent: 'bg-accent-foreground/20 text-accent-foreground',
  success: 'bg-success-foreground/20 text-success-foreground',
};

export default function StatCard({ title, value, subtitle, icon: Icon, trend, variant = 'default' }: StatCardProps) {
  return (
    <div className={`rounded-xl p-5 border shadow-card ${variantStyles[variant]}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${iconVariantStyles[variant]}`}>
          <Icon className="h-6 w-6" />
        </div>
        {trend && (
          <div className={`text-sm font-medium ${trend.positive ? 'text-success' : 'text-destructive'}`}>
            {trend.positive ? '+' : ''}{trend.value}%
          </div>
        )}
      </div>
      
      <div>
        <p className={`text-sm font-medium ${variant === 'default' ? 'text-muted-foreground' : 'opacity-80'}`}>
          {title}
        </p>
        <p className="font-display text-2xl font-bold mt-1">{value}</p>
        {subtitle && (
          <p className={`text-xs mt-1 ${variant === 'default' ? 'text-muted-foreground' : 'opacity-70'}`}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
