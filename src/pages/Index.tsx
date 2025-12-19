import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ServiceCard from '@/components/services/ServiceCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { services, workers } from '@/data/mockData';
import { Search, Shield, Clock, Star, CheckCircle, ArrowRight, Users, Zap, Award } from 'lucide-react';

export default function Index() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = [
    { icon: Users, value: '50K+', label: 'Happy Customers' },
    { icon: Award, value: '2K+', label: 'Verified Experts' },
    { icon: Zap, value: '100K+', label: 'Services Completed' },
    { icon: Star, value: '4.9', label: 'Average Rating' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-hero text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-accent rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary-foreground rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
        </div>

        <div className="container relative py-20 lg:py-32">
          <div className="max-w-3xl mx-auto text-center animate-fade-in">
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Your Home, Our{' '}
              <span className="text-accent">Expertise</span>
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              Connect with trusted professionals for all your home service needs. 
              From plumbing to painting, we've got you covered.
            </p>

            {/* Search Bar */}
            <div className="relative max-w-xl mx-auto mb-8">
              <div className="flex bg-card/10 backdrop-blur-md rounded-2xl p-2 border border-primary-foreground/20">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary-foreground/60" />
                  <Input
                    type="text"
                    placeholder="What service do you need?"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 pr-4 h-12 bg-transparent border-0 text-primary-foreground placeholder:text-primary-foreground/50 focus-visible:ring-0"
                  />
                </div>
                <Button variant="hero" size="lg" onClick={() => navigate('/services')}>
                  Search
                </Button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
              {stats.map((stat, index) => (
                <div 
                  key={stat.label}
                  className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-4 border border-primary-foreground/10 animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <stat.icon className="h-6 w-6 text-accent mx-auto mb-2" />
                  <p className="font-display text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-primary-foreground/70">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="hsl(var(--background))"/>
          </svg>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Popular Services
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Choose from our wide range of home services, delivered by verified professionals
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {(searchQuery ? filteredServices : services.slice(0, 8)).map((service, index) => (
              <div key={service.id} className="animate-slide-up" style={{ animationDelay: `${index * 0.05}s` }}>
                <ServiceCard service={service} />
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button variant="outline" size="lg" onClick={() => navigate('/services')}>
              View All Services
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-secondary/50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Choose HomeFix?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We're committed to providing the best home service experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: 'Verified Professionals',
                description: 'All our service providers undergo thorough background checks and skill verification.',
              },
              {
                icon: Clock,
                title: 'On-Time Service',
                description: 'We value your time. Our professionals arrive on schedule, every time.',
              },
              {
                icon: CheckCircle,
                title: 'Quality Guaranteed',
                description: 'Not satisfied? We\'ll make it right. 100% satisfaction guarantee on all services.',
              },
            ].map((feature, index) => (
              <div 
                key={feature.title}
                className="bg-card rounded-2xl p-8 shadow-card text-center group hover:shadow-xl transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground mb-6 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="h-8 w-8" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Rated Workers */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Top Rated Professionals
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Meet our highest-rated service providers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workers.filter(w => w.rating >= 4.7).slice(0, 3).map((worker, index) => (
              <div
                key={worker.id}
                className="bg-card rounded-2xl p-6 shadow-card border border-border/50 hover:shadow-xl transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center gap-4 mb-4">
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
                  <div>
                    <h3 className="font-display font-semibold text-foreground">{worker.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Star className="h-4 w-4 text-accent fill-accent" />
                      <span>{worker.rating}</span>
                      <span>•</span>
                      <span>{worker.completedJobs} jobs</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{worker.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-primary text-primary-foreground">
        <div className="container text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8">
            Join thousands of happy customers who trust HomeFix for their home service needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="xl" onClick={() => navigate('/register')}>
              Book a Service
            </Button>
            <Button variant="glass" size="xl" onClick={() => navigate('/register?role=worker')}>
              Become a Provider
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
