import React from 'react';
import { Users, Gauge, Fuel, Calendar, MapPin, Settings2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Vehicle } from '@/types';

interface VehicleCardProps {
  vehicle: Vehicle;
  onReserve?: (vehicle: Vehicle) => void;
}

export default function VehicleCard({ vehicle, onReserve }: VehicleCardProps) {
  const isAvailable = vehicle.availabilityStatus === 'available';

  const availabilityVariant =
    vehicle.availabilityStatus === 'available'   ? 'available'   :
    vehicle.availabilityStatus === 'rented'      ? 'reserved'    :
    vehicle.availabilityStatus === 'reserved'    ? 'reserved'    :
    vehicle.availabilityStatus === 'maintenance' ? 'maintenance' : 'unavailable';

  const availabilityLabel =
    vehicle.availabilityStatus === 'available'   ? 'Beschikbaar'   :
    vehicle.availabilityStatus === 'rented'      ? 'Verhuurd'      :
    vehicle.availabilityStatus === 'reserved'    ? 'Gereserveerd'  :
    vehicle.availabilityStatus === 'maintenance' ? 'Onderhoud'     : 'Niet beschikbaar';

  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">
            {vehicle.year} {vehicle.brand} {vehicle.model}
          </CardTitle>
          <Badge variant={availabilityVariant} className="shrink-0 text-xs">
            {availabilityLabel}
          </Badge>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs">{vehicle.type}</Badge>
          {vehicle.fuelType && (
            <Badge variant="outline" className="text-xs">{vehicle.fuelType}</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        {/* Specs */}
        <div className="grid grid-cols-2 gap-2 text-sm text-[#616161]">
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-brand-600" />
            <span>{vehicle.seats} zitplaatsen</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Settings2 className="h-3.5 w-3.5 text-brand-600" />
            <span>{vehicle.transmissionType || '—'}</span>
          </div>
          {vehicle.powerKW && (
            <div className="flex items-center gap-1.5">
              <Gauge className="h-3.5 w-3.5 text-brand-600" />
              <span>{vehicle.powerKW} kW</span>
            </div>
          )}
          {vehicle.engineTypeName && (
            <div className="flex items-center gap-1.5">
              <Fuel className="h-3.5 w-3.5 text-brand-600" />
              <span>{vehicle.engineTypeName}</span>
            </div>
          )}
          {vehicle.year && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-brand-600" />
              <span>{vehicle.year}</span>
            </div>
          )}
          {vehicle.locationCity && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-brand-600" />
              <span className="truncate">{vehicle.locationCity}</span>
            </div>
          )}
        </div>

        {/* Pricing table */}
        {(vehicle.halfDayPrice || vehicle.fullDayPrice || vehicle.weekPrice) && (
          <div className="border border-[#d6d6d6] rounded-md overflow-hidden">
            <table className="w-full text-xs">
              <tbody>
                {vehicle.halfDayPrice && (
                  <tr className="border-b border-[#d6d6d6]">
                    <td className="px-3 py-1.5 text-[#616161]">½ dag</td>
                    <td className="px-3 py-1.5 text-right font-semibold text-[#494949]">
                      €{Number(vehicle.halfDayPrice).toFixed(2)}
                    </td>
                  </tr>
                )}
                {vehicle.fullDayPrice && (
                  <tr className="border-b border-[#d6d6d6]">
                    <td className="px-3 py-1.5 text-[#616161]">Dag</td>
                    <td className="px-3 py-1.5 text-right font-semibold text-[#494949]">
                      €{Number(vehicle.fullDayPrice).toFixed(2)}
                    </td>
                  </tr>
                )}
                {vehicle.weekendPrice && (
                  <tr className="border-b border-[#d6d6d6]">
                    <td className="px-3 py-1.5 text-[#616161]">Weekend</td>
                    <td className="px-3 py-1.5 text-right font-semibold text-[#494949]">
                      €{Number(vehicle.weekendPrice).toFixed(2)}
                    </td>
                  </tr>
                )}
                {vehicle.weekPrice && (
                  <tr>
                    <td className="px-3 py-1.5 text-[#616161]">Week</td>
                    <td className="px-3 py-1.5 text-right font-semibold text-brand-600">
                      €{Number(vehicle.weekPrice).toFixed(2)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      <CardFooter className="gap-2 pt-3">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          disabled={!isAvailable}
          onClick={() => onReserve?.(vehicle)}
        >
          Meer info
        </Button>
        <Button
          variant="default"
          size="sm"
          className="flex-1"
          disabled={!isAvailable}
          onClick={() => onReserve?.(vehicle)}
        >
          Reserveer
        </Button>
      </CardFooter>
    </Card>
  );
}
