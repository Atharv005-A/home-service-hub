import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import StatCard from '@/components/stats/StatCard';
import BookingCard from '@/components/booking/BookingCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { bookings } from '@/data/mockData';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Clock, CheckCircle, XCircle, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [isLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('name')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.name) {
            setUserName(data.name);
          } else {
            setUserName(user.email?.split('@')[0] || 'User');
          }
        });
    }
  }, [user]);

  const customerBookings = bookings.filter(b => b.customerId === 'c1');
  
  const stats = {
    total: customerBookings.length,
    active: customerBookings.filter(b => ['pending', 'confirmed', 'assigned', 'in_progress'].includes(b.status)).length,
    completed: customerBookings.filter(b => b.status === 'completed').length,
    cancelled: customerBookings.filter(b => b.status === 'cancelled').length,
  };

  const filteredBookings = activeTab === 'all' 
    ? customerBookings 
    : customerBookings.filter(b => {
        if (activeTab === 'active') return ['pending', 'confirmed', 'assigned', 'in_progress'].includes(b.status);
        if (activeTab === 'completed') return b.status === 'completed';
        if (activeTab === 'cancelled') return b.status === 'cancelled';
        return true;
      });

  const handleCancel = (booking: typeof bookings[0]) => {
    toast.success(`Booking #${booking.id} cancelled successfully`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-8">
        <div className="container">
          {/* Welcome */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">
                Welcome back, {userName.split(' ')[0] || 'there'}!
              </h1>
              <p className="text-muted-foreground">Manage your home service bookings</p>
            </div>
            <Button variant="hero" onClick={() => navigate('/services')}>
              <Plus className="mr-2 h-4 w-4" />
              Book New Service
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="Total Bookings"
              value={stats.total}
              icon={Calendar}
            />
            <StatCard
              title="Active"
              value={stats.active}
              icon={Clock}
              variant="accent"
            />
            <StatCard
              title="Completed"
              value={stats.completed}
              icon={CheckCircle}
              variant="success"
            />
            <StatCard
              title="Cancelled"
              value={stats.cancelled}
              icon={XCircle}
            />
          </div>

          {/* Bookings */}
          <div className="bg-card rounded-2xl p-6 shadow-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="font-display text-xl font-semibold">Your Bookings</h2>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                  <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {filteredBookings.length > 0 ? (
              <div className="space-y-4">
                {filteredBookings.map((booking, index) => (
                  <div key={booking.id} className="animate-slide-up" style={{ animationDelay: `${index * 0.05}s` }}>
                    <BookingCard
                      booking={booking}
                      onViewDetails={(b) => toast.info(`Viewing details for booking #${b.id}`)}
                      onCancel={handleCancel}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No bookings found</p>
                <Button onClick={() => navigate('/services')}>Book a Service</Button>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
