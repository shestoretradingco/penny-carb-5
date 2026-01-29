import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Panchayat, Ward } from '@/types/database';

interface LocationContextType {
  panchayats: Panchayat[];
  wards: Ward[];
  selectedPanchayat: Panchayat | null;
  selectedWard: Ward | null;
  setSelectedPanchayat: (panchayat: Panchayat | null) => void;
  setSelectedWard: (ward: Ward | null) => void;
  isLoading: boolean;
  getWardsForPanchayat: (panchayatId: string) => Ward[];
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [panchayats, setPanchayats] = useState<Panchayat[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedPanchayat, setSelectedPanchayat] = useState<Panchayat | null>(null);
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const [panchayatsRes, wardsRes] = await Promise.all([
          supabase.from('panchayats').select('*').eq('is_active', true).order('name'),
          supabase.from('wards').select('*').eq('is_active', true).order('ward_number'),
        ]);

        if (panchayatsRes.data) {
          setPanchayats(panchayatsRes.data as Panchayat[]);
        }
        if (wardsRes.data) {
          setWards(wardsRes.data as Ward[]);
        }
      } catch (error) {
        console.error('Error fetching locations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocations();
  }, []);

  // Load saved selection from localStorage
  useEffect(() => {
    const savedPanchayatId = localStorage.getItem('selectedPanchayatId');
    const savedWardId = localStorage.getItem('selectedWardId');

    if (savedPanchayatId && panchayats.length > 0) {
      const panchayat = panchayats.find(p => p.id === savedPanchayatId);
      if (panchayat) {
        setSelectedPanchayat(panchayat);
      }
    }

    if (savedWardId && wards.length > 0) {
      const ward = wards.find(w => w.id === savedWardId);
      if (ward) {
        setSelectedWard(ward);
      }
    }
  }, [panchayats, wards]);

  // Save selection to localStorage
  useEffect(() => {
    if (selectedPanchayat) {
      localStorage.setItem('selectedPanchayatId', selectedPanchayat.id);
    } else {
      localStorage.removeItem('selectedPanchayatId');
    }
  }, [selectedPanchayat]);

  useEffect(() => {
    if (selectedWard) {
      localStorage.setItem('selectedWardId', selectedWard.id);
    } else {
      localStorage.removeItem('selectedWardId');
    }
  }, [selectedWard]);

  const getWardsForPanchayat = (panchayatId: string): Ward[] => {
    return wards.filter(w => w.panchayat_id === panchayatId);
  };

  return (
    <LocationContext.Provider
      value={{
        panchayats,
        wards,
        selectedPanchayat,
        selectedWard,
        setSelectedPanchayat,
        setSelectedWard,
        isLoading,
        getWardsForPanchayat,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};
