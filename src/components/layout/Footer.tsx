import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <Home className="h-5 w-5" />
              </div>
              <span className="font-display text-xl font-bold">
                Home<span className="text-accent">Fix</span>
              </span>
            </Link>
            <p className="text-primary-foreground/70 text-sm leading-relaxed">
              Your trusted platform for all home service needs. Connect with verified professionals for quality work.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-primary-foreground/60 hover:text-accent transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-primary-foreground/60 hover:text-accent transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-primary-foreground/60 hover:text-accent transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-primary-foreground/60 hover:text-accent transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-display font-semibold mb-4">Services</h3>
            <ul className="space-y-2">
              {['Plumbing', 'Electrical', 'AC Repair', 'Cleaning', 'Painting', 'Carpentry'].map((service) => (
                <li key={service}>
                  <Link to="/services" className="text-sm text-primary-foreground/70 hover:text-accent transition-colors">
                    {service}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-display font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              {[
                { name: 'About Us', href: '/about' },
                { name: 'Careers', href: '#' },
                { name: 'Blog', href: '#' },
                { name: 'Press', href: '#' },
                { name: 'Partner with Us', href: '#' },
              ].map((item) => (
                <li key={item.name}>
                  <Link to={item.href} className="text-sm text-primary-foreground/70 hover:text-accent transition-colors">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-display font-semibold mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm text-primary-foreground/70">
                <Mail className="h-4 w-4 text-accent" />
                support@homefix.com
              </li>
              <li className="flex items-center gap-3 text-sm text-primary-foreground/70">
                <Phone className="h-4 w-4 text-accent" />
                +1 (555) 123-4567
              </li>
              <li className="flex items-start gap-3 text-sm text-primary-foreground/70">
                <MapPin className="h-4 w-4 text-accent mt-0.5" />
                123 Service Street, New York, NY 10001
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-primary-foreground/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-primary-foreground/60">
            © 2024 HomeFix. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link to="#" className="text-sm text-primary-foreground/60 hover:text-accent transition-colors">
              Privacy Policy
            </Link>
            <Link to="#" className="text-sm text-primary-foreground/60 hover:text-accent transition-colors">
              Terms of Service
            </Link>
            <Link to="#" className="text-sm text-primary-foreground/60 hover:text-accent transition-colors">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
