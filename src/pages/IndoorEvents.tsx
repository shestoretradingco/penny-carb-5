import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Zap, Calculator, CalendarHeart } from 'lucide-react';
import BottomNav from '@/components/customer/BottomNav';

const IndoorEvents: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-indoor-events text-white">
        <div className="container flex h-14 items-center gap-4 px-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <CalendarHeart className="h-6 w-6" />
          <h1 className="text-lg font-semibold">Indoor Events</h1>
        </div>
      </header>

      <main className="container px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-display font-bold text-foreground mb-2">
            Plan Your Perfect Event
          </h2>
          <p className="text-muted-foreground">
            Choose your booking style
          </p>
        </div>

        {/* Booking Cards */}
        <div className="space-y-4">
          {/* Quick Booking Card */}
          <div 
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 p-6 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
            onClick={() => navigate('/indoor-events/quick-booking')}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                <Zap className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white">Quick Booking</h3>
                <p className="text-white/80 text-sm mt-1">
                  Simple & fast • Admin sends quotation
                </p>
              </div>
            </div>
          </div>

          {/* Plan & Estimate Card */}
          <div 
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-700 p-6 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
            onClick={() => navigate('/indoor-events/planner')}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
            
            {/* Recommended Badge */}
            <div className="absolute top-3 right-3">
              <span className="bg-white/20 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full font-medium">
                Recommended
              </span>
            </div>
            
            <div className="relative z-10 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                <Calculator className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white">Plan & Estimate</h3>
                <p className="text-white/80 text-sm mt-1">
                  Build menu • Real-time pricing
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Text */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          All bookings require admin approval. No instant payment.
        </p>
      </main>

      <BottomNav />
    </div>
  );
};

export default IndoorEvents;
