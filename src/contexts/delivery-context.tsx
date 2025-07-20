// src/contexts/delivery-context.tsx
"use client";

import type { DeliveryLocation } from '@/types';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface DeliveryContextType {
  deliveryLocation: DeliveryLocation | null;
  setDeliveryLocationInfo: (location: DeliveryLocation | null) => void;
}

const DeliveryContext = createContext<DeliveryContextType | undefined>(undefined);

const DELIVERY_LOCATION_STORAGE_KEY = 'mediOrderDeliveryLocation';

export const DeliveryProvider = ({ children }: { children: ReactNode }) => {
  const [deliveryLocation, setDeliveryLocation] = useState<DeliveryLocation | null>(null);

  useEffect(() => {
    const storedLocation = localStorage.getItem(DELIVERY_LOCATION_STORAGE_KEY);
    if (storedLocation) {
      try {
        const parsedLocation = JSON.parse(storedLocation);
        // Robust check for essential DeliveryLocation properties
        if (parsedLocation && typeof parsedLocation.bedId === 'string' && typeof parsedLocation.details === 'string') {
          // parsedLocation might have more or fewer optional fields than current DeliveryLocation type,
          // but as long as bedId and details are there, it's usable.
          setDeliveryLocation(parsedLocation as DeliveryLocation); 
        } else {
          console.warn("Invalid or incomplete delivery location data found in localStorage. Clearing it.");
          localStorage.removeItem(DELIVERY_LOCATION_STORAGE_KEY);
        }
      } catch (error) {
        console.error("Error parsing delivery location from localStorage:", error);
        localStorage.removeItem(DELIVERY_LOCATION_STORAGE_KEY); // Clear corrupted data
      }
    }
  }, []);

  const setDeliveryLocationInfo = (location: DeliveryLocation | null) => {
    setDeliveryLocation(location);
    if (location) {
      localStorage.setItem(DELIVERY_LOCATION_STORAGE_KEY, JSON.stringify(location));
    } else {
      localStorage.removeItem(DELIVERY_LOCATION_STORAGE_KEY);
    }
  };

  return (
    <DeliveryContext.Provider value={{ deliveryLocation, setDeliveryLocationInfo }}>
      {children}
    </DeliveryContext.Provider>
  );
};

export const useDelivery = () => {
  const context = useContext(DeliveryContext);
  if (context === undefined) {
    throw new Error('useDelivery must be used within a DeliveryProvider');
  }
  return context;
};