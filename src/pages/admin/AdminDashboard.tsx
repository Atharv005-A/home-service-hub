import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import StatCard from '@/components/stats/StatCard';
import BookingCard from '@/components/booking/BookingCard';
import WorkerCard from '@/components/workers/WorkerCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { bookings, workers, services } from '@/data/mockData';
import { Users, Briefcase, Calendar, DollarSign, TrendingUp, Search, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [assignDialog, setAssignDialog] = useState<{ open: boolean; bookingId: string | null }>({
    open: false,
    bookingId: null,
  });

  const stats = {
    totalUsers: 1523,
    totalWorkers: workers.length,
    totalBookings: bookings.length,
    revenue: bookings.filter(b => b.paymentStatus === 'paid').reduce((sum, b) => sum + b.totalAmount, 0),
    pendingBookings: bookings.filter(b => b.status === 'pending').length,
    activeBookings: bookings.filter(b => ['confirmed', 'assigned', 'in_progress'].includes(b.status)).length,
  };

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const availableWorkers = workers.filter(w => w.availability === 'available');

  const handleAssignWorker = (workerId: string) => {
    toast.success(`Worker assigned to booking #${assignDialog.bookingId}`);
    setAssignDialog({ open: false, bookingId: null });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-8">
        <div className="container">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-muted-foreground">Manage your platform operations</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">Export Report</Button>
              <Button>Add Worker</Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="Total Users"
              value={stats.totalUsers.toLocaleString()}
              icon={Users}
              trend={{ value: 12, positive: true }}
            />
            <StatCard
              title="Active Workers"
              value={stats.totalWorkers}
              icon={Briefcase}
              variant="primary"
            />
            <StatCard
              title="Total Bookings"
              value={stats.totalBookings}
              icon={Calendar}
              variant="accent"
            />
            <StatCard
              title="Revenue"
              value={`$${stats.revenue.toLocaleString()}`}
              icon={DollarSign}
              variant="success"
              trend={{ value: 8, positive: true }}
            />
          </div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 max-w-lg">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
              <TabsTrigger value="workers">Workers</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Pending Assignments */}
                <div className="bg-card rounded-2xl p-6 shadow-card">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display text-lg font-semibold">Pending Assignments</h2>
                    <Badge variant="outline" className="bg-warning/10 text-warning">
                      {stats.pendingBookings} pending
                    </Badge>
                  </div>
                  
                  {pendingBookings.length > 0 ? (
                    <div className="space-y-3">
                      {pendingBookings.slice(0, 3).map(booking => (
                        <div key={booking.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{booking.serviceName}</p>
                            <p className="text-xs text-muted-foreground">{booking.customerName}</p>
                          </div>
                          <Button 
                            size="sm"
                            onClick={() => setAssignDialog({ open: true, bookingId: booking.id })}
                          >
                            Assign
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-8 text-muted-foreground">No pending assignments</p>
                  )}
                </div>

                {/* Available Workers */}
                <div className="bg-card rounded-2xl p-6 shadow-card">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display text-lg font-semibold">Available Workers</h2>
                    <Badge variant="outline" className="bg-success/10 text-success">
                      {availableWorkers.length} online
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    {availableWorkers.slice(0, 4).map(worker => (
                      <div key={worker.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                            {worker.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{worker.name}</p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <span>{worker.rating}</span>
                              <span>•</span>
                              <span>{worker.completedJobs} jobs</span>
                            </div>
                          </div>
                        </div>
                        <Badge className="bg-success/10 text-success border-success/20">
                          Available
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-card rounded-2xl p-6 shadow-card">
                <h2 className="font-display text-lg font-semibold mb-4">Recent Bookings</h2>
                <div className="space-y-4">
                  {bookings.slice(0, 4).map((booking, index) => (
                    <div 
                      key={booking.id} 
                      className="animate-slide-up"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <BookingCard booking={booking} showActions={false} />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="bookings">
              <div className="bg-card rounded-2xl p-6 shadow-card">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-xl font-semibold">All Bookings</h2>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search bookings..." 
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  {bookings.map((booking, index) => (
                    <div 
                      key={booking.id}
                      className="animate-slide-up"
                      style={{ animationDelay: `${index * 0.03}s` }}
                    >
                      <BookingCard 
                        booking={booking}
                        onViewDetails={(b) => toast.info(`Viewing booking #${b.id}`)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="workers">
              <div className="bg-card rounded-2xl p-6 shadow-card">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-xl font-semibold">All Workers</h2>
                  <Button>Add New Worker</Button>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {workers.map((worker, index) => (
                    <div 
                      key={worker.id}
                      className="animate-slide-up"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <WorkerCard 
                        worker={worker}
                        onViewProfile={(w) => toast.info(`Viewing ${w.name}'s profile`)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="services">
              <div className="bg-card rounded-2xl p-6 shadow-card">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-xl font-semibold">Service Categories</h2>
                  <Button>Add Service</Button>
                </div>
                
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {services.map((service, index) => (
                    <div 
                      key={service.id}
                      className="p-4 bg-muted/50 rounded-xl animate-slide-up"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{service.name}</h3>
                        <Badge variant="secondary">{service.category}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{service.description}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span>Base: ${service.basePrice}</span>
                        <Button variant="ghost" size="sm">Edit</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Assign Worker Dialog */}
      <Dialog open={assignDialog.open} onOpenChange={(open) => setAssignDialog({ ...assignDialog, open })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign Worker</DialogTitle>
            <DialogDescription>
              Select an available worker for booking #{assignDialog.bookingId}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {availableWorkers.map(worker => (
              <div 
                key={worker.id}
                className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                onClick={() => handleAssignWorker(worker.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold">
                    {worker.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">{worker.name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>⭐ {worker.rating}</span>
                      <span>•</span>
                      <span>{worker.completedJobs} jobs</span>
                      <span>•</span>
                      <span>${worker.hourlyRate}/hr</span>
                    </div>
                  </div>
                </div>
                <Button size="sm">Assign</Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
