'use client';

import React from 'react';
import VehicleCard from '@/components/VehicleCard';
import { Vehicle } from '@/types';

interface VehicleGridProps {
  vehicles: Vehicle[];
}

export default function VehicleGrid({ vehicles }: VehicleGridProps) {
  function handleReserve(vehicle: Vehicle) {
    // Open the chatbot and pre-fill a reservation message
    const event = new CustomEvent('open-chat', {
      detail: { message: `Ik wil graag de ${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate}) reserveren. Wat zijn de stappen?` },
    });
    window.dispatchEvent(event);
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {vehicles.map(vehicle => (
        <VehicleCard key={vehicle.id} vehicle={vehicle} onReserve={handleReserve} />
      ))}
    </div>
  );
}
