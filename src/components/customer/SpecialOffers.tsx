import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';

interface SpecialOffer {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  background_color: string | null;
  link_url: string | null;
  display_order: number;
}

const SpecialOffers: React.FC = () => {
  const navigate = useNavigate();
  
  const { data: offers, isLoading } = useQuery({
    queryKey: ['special-offers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('special_offers')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as SpecialOffer[];
    },
  });

  const handleOfferClick = (offer: SpecialOffer) => {
    if (offer.link_url) {
      if (offer.link_url.startsWith('http')) {
        window.open(offer.link_url, '_blank');
      } else {
        navigate(offer.link_url);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="px-4 py-3">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-24 flex-shrink-0 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!offers || offers.length === 0) {
    return null;
  }

  return (
    <div className="px-4 py-3">
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
        {offers.map((offer) => (
          <div
            key={offer.id}
            onClick={() => handleOfferClick(offer)}
            className="flex-shrink-0 w-24 h-20 rounded-xl cursor-pointer overflow-hidden shadow-sm hover:shadow-md transition-shadow relative"
            style={{ backgroundColor: offer.background_color || '#16a34a' }}
          >
            {offer.image_url ? (
              <img
                src={offer.image_url}
                alt={offer.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="p-2 h-full flex flex-col justify-between text-white">
                <p className="text-[10px] font-medium leading-tight line-clamp-2">
                  {offer.title}
                </p>
                {offer.subtitle && (
                  <p className="text-xs font-bold leading-tight">
                    {offer.subtitle}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpecialOffers;
