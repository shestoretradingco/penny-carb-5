import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Banner } from '@/types/database';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';

const BannerCarousel: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const { data, error } = await supabase
          .from('banners')
          .select('*')
          .eq('is_active', true)
          .order('display_order');

        if (error) throw error;
        setBanners(data as Banner[]);
      } catch (error) {
        console.error('Error fetching banners:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBanners();
  }, []);

  if (isLoading) {
    return (
      <div className="px-4 py-4">
        <Skeleton className="h-40 w-full rounded-xl sm:h-48" />
      </div>
    );
  }

  if (banners.length === 0) {
    // Show placeholder banners
    return (
      <div className="px-4 py-4">
        <Carousel
          plugins={[
            Autoplay({
              delay: 4000,
            }),
          ]}
          opts={{
            align: 'start',
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent>
            {[
              { title: 'Order Event Food', bg: 'from-indoor-events/80 to-indoor-events', emoji: '🎉' },
              { title: 'Fresh Cloud Kitchen', bg: 'from-cloud-kitchen/80 to-cloud-kitchen', emoji: '👨‍🍳' },
              { title: 'Homemade Specials', bg: 'from-homemade/80 to-homemade', emoji: '🏠' },
            ].map((item, index) => (
              <CarouselItem key={index}>
                <div className={`relative h-40 w-full overflow-hidden rounded-xl bg-gradient-to-r ${item.bg} sm:h-48`}>
                  <div className="absolute inset-0 flex items-center justify-between p-6">
                    <div>
                      <h3 className="text-2xl font-bold text-white">{item.title}</h3>
                      <p className="mt-1 text-sm text-white/80">Explore our menu</p>
                    </div>
                    <span className="text-6xl">{item.emoji}</span>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      <Carousel
        plugins={[
          Autoplay({
            delay: 4000,
          }),
        ]}
        opts={{
          align: 'start',
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent>
          {banners.map((banner) => (
            <CarouselItem key={banner.id}>
              <a
                href={banner.link_url || '#'}
                className="relative block h-40 w-full overflow-hidden rounded-xl sm:h-48"
              >
                <img
                  src={banner.image_url}
                  alt={banner.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <h3 className="text-xl font-bold text-white">{banner.title}</h3>
                </div>
              </a>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
};

export default BannerCarousel;
