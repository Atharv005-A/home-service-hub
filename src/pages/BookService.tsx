import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { services } from '@/data/mockData';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { CalendarIcon, Clock, MapPin, DollarSign, CheckCircle, Loader2, Navigation } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import GoogleMapEmbed from '@/components/maps/GoogleMapEmbed';

export default function BookService() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const service = services.find(s => s.id === serviceId);
  
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [date, setDate] = useState<Date>();
  const [formData, setFormData] = useState({
    address: '',
    time: '',
    description: '',
  });

  if (!service) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold mb-4">Service Not Found</h1>
            <Button onClick={() => navigate('/services')}>Browse Services</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const timeSlots = [
    '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
    '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM',
    '4:00 PM', '5:00 PM', '6:00 PM'
  ];

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to book a service');
      navigate('/login');
      return;
    }

    setIsLoading(true);
    
    try {
      // Mock booking creation
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Booking confirmed! We will assign a professional shortly.');
      navigate('/customer');
    } catch (error) {
      toast.error('Failed to create booking. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return !!formData.address;
    if (step === 2) return !!date && !!formData.time;
    if (step === 3) return true;
    return false;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-12">
        <div className="container max-w-4xl">
          {/* Service Info */}
          <div className="bg-gradient-primary text-primary-foreground rounded-2xl p-6 mb-8">
            <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">
              Book {service.name}
            </h1>
            <p className="text-primary-foreground/80">{service.description}</p>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-accent" />
                <span>From ${service.basePrice}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-accent" />
                <span>{service.estimatedDuration}</span>
              </div>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8 px-4">
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center font-semibold transition-colors",
                    step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    {step > s ? <CheckCircle className="h-5 w-5" /> : s}
                  </div>
                  <span className={cn(
                    "text-sm font-medium hidden sm:block",
                    step >= s ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {s === 1 && 'Location'}
                    {s === 2 && 'Schedule'}
                    {s === 3 && 'Confirm'}
                  </span>
                </div>
                {s < 3 && (
                  <div className={cn(
                    "flex-1 h-1 mx-4 rounded",
                    step > s ? "bg-primary" : "bg-muted"
                  )} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Form */}
          <div className="bg-card rounded-2xl p-6 md:p-8 shadow-card">
            {step === 1 && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="font-display text-xl font-semibold">Where do you need the service?</h2>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Service Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Textarea
                      id="address"
                      placeholder="Enter your complete address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="pl-10 min-h-[100px]"
                    />
                  </div>
                </div>

                {/* Service Location Map */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Navigation className="h-4 w-4" />
                    Service Area Map
                  </Label>
                  <GoogleMapEmbed 
                    height="280"
                    zoom={12}
                    className="shadow-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Map shows default service area. Worker location will be tracked after booking confirmation.
                  </p>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="font-display text-xl font-semibold">When would you like us to come?</h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Select Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Select Time</Label>
                    <Select value={formData.time} onValueChange={(v) => setFormData({ ...formData, time: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a time slot" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map(slot => (
                          <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Additional Details (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the issue or any specific requirements..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="min-h-[120px]"
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="font-display text-xl font-semibold">Confirm Your Booking</h2>
                
                <div className="bg-muted rounded-xl p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-muted-foreground">Service</p>
                      <p className="font-semibold">{service.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Estimated Cost</p>
                      <p className="font-display text-xl font-bold text-primary">${service.basePrice}+</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                    <div>
                      <p className="text-sm text-muted-foreground">Date & Time</p>
                      <p className="font-medium">
                        {date ? format(date, "MMM dd, yyyy") : '-'} at {formData.time || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="font-medium">{service.estimatedDuration}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-medium">{formData.address}</p>
                  </div>

                  {formData.description && (
                    <div className="pt-4 border-t border-border">
                      <p className="text-sm text-muted-foreground">Description</p>
                      <p className="font-medium">{formData.description}</p>
                    </div>
                  )}
                </div>

                {/* Location Map with Worker Tracking Info */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Service Location
                    </h3>
                    <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded-full flex items-center gap-1">
                      <Navigation className="h-3 w-3" />
                      Worker tracking available after assignment
                    </span>
                  </div>
                  <GoogleMapEmbed 
                    height="200"
                    zoom={14}
                    className="shadow-sm"
                  />
                </div>

                {/* Payment Placeholder */}
                <div className="bg-accent/10 border border-accent/20 rounded-xl p-5">
                  <h3 className="font-semibold text-foreground mb-2">Payment</h3>
                  <p className="text-sm text-muted-foreground">
                    Payment will be processed after service completion. Enable Cloud for Stripe integration.
                  </p>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t border-border">
              <Button
                variant="outline"
                onClick={() => step > 1 ? setStep(step - 1) : navigate('/services')}
              >
                {step > 1 ? 'Back' : 'Cancel'}
              </Button>
              
              {step < 3 ? (
                <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
                  Continue
                </Button>
              ) : (
                <Button variant="hero" onClick={handleSubmit} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Confirming...
                    </>
                  ) : (
                    'Confirm Booking'
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
