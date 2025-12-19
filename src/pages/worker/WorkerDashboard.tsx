import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import StatCard from '@/components/stats/StatCard';
import BookingCard from '@/components/booking/BookingCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { bookings, workers } from '@/data/mockData';
import { useAuth } from '@/context/AuthContext';
import { Briefcase, Clock, CheckCircle, DollarSign, Star, MapPin, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export default function WorkerDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('assigned');
  const [availability, setAvailability] = useState<'available' | 'busy' | 'offline'>('available');

  const worker = workers[0]; // Mock current worker
  const workerBookings = bookings.filter(b => b.workerId === 'w1');

  const stats = {
    assigned: workerBookings.filter(b => ['assigned', 'in_progress'].includes(b.status)).length,
    completed: workerBookings.filter(b => b.status === 'completed').length,
    earnings: workerBookings.filter(b => b.paymentStatus === 'paid').reduce((sum, b) => sum + b.totalAmount, 0),
    rating: worker.rating,
  };

  const filteredBookings = activeTab === 'assigned'
    ? workerBookings.filter(b => ['assigned', 'confirmed', 'in_progress'].includes(b.status))
    : workerBookings.filter(b => b.status === 'completed');

  const handleStatusUpdate = (bookingId: string, newStatus: string) => {
    toast.success(`Booking #${bookingId} updated to ${newStatus}`);
  };

  const availabilityColors = {
    available: 'bg-success/10 text-success border-success/20',
    busy: 'bg-warning/10 text-warning border-warning/20',
    offline: 'bg-muted text-muted-foreground border-muted',
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-8">
        <div className="container">
          {/* Profile Header */}
          <div className="bg-gradient-primary text-primary-foreground rounded-2xl p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-primary-foreground/20 flex items-center justify-center text-3xl font-bold">
                  {worker.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="font-display text-2xl font-bold">{worker.name}</h1>
                    {worker.verified && (
                      <Badge variant="secondary" className="bg-accent text-accent-foreground">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-primary-foreground/80">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-accent fill-accent" />
                      <span>{worker.rating} rating</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      <span>{worker.completedJobs} jobs</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-sm">
                  <p className="text-primary-foreground/70">Status</p>
                  <Select value={availability} onValueChange={(v: typeof availability) => setAvailability(v)}>
                    <SelectTrigger className="w-[140px] bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="busy">Busy</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Badge variant="outline" className={availabilityColors[availability]}>
                  {availability.charAt(0).toUpperCase() + availability.slice(1)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="Active Jobs"
              value={stats.assigned}
              icon={Briefcase}
              variant="accent"
            />
            <StatCard
              title="Completed"
              value={stats.completed}
              icon={CheckCircle}
              variant="success"
            />
            <StatCard
              title="Total Earnings"
              value={`$${stats.earnings}`}
              icon={DollarSign}
              variant="primary"
            />
            <StatCard
              title="Rating"
              value={stats.rating}
              subtitle="out of 5.0"
              icon={Star}
            />
          </div>

          {/* Jobs */}
          <div className="bg-card rounded-2xl p-6 shadow-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="font-display text-xl font-semibold">Your Jobs</h2>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="assigned">Active</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {filteredBookings.length > 0 ? (
              <div className="space-y-4">
                {filteredBookings.map((booking, index) => (
                  <div 
                    key={booking.id} 
                    className="bg-muted/50 rounded-xl p-5 animate-slide-up"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-foreground">{booking.serviceName}</h3>
                          <Badge variant="outline" className={
                            booking.status === 'in_progress' ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary'
                          }>
                            {booking.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(booking.scheduledDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{booking.scheduledTime}</span>
                          </div>
                          <div className="flex items-center gap-2 col-span-full">
                            <MapPin className="h-4 w-4" />
                            <span>{booking.address}</span>
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground">{booking.description}</p>
                      </div>

                      <div className="flex flex-col items-end gap-3">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Earnings</p>
                          <p className="font-display text-xl font-bold text-foreground">${booking.totalAmount}</p>
                        </div>
                        
                        {booking.status !== 'completed' && (
                          <div className="flex gap-2">
                            {booking.status === 'assigned' && (
                              <Button size="sm" onClick={() => handleStatusUpdate(booking.id, 'in_progress')}>
                                Start Job
                              </Button>
                            )}
                            {booking.status === 'in_progress' && (
                              <Button size="sm" variant="success" onClick={() => handleStatusUpdate(booking.id, 'completed')}>
                                Complete
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No jobs found in this category</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
