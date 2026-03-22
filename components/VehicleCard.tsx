import React from 'react';
import { Users, Gauge, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Vehicle } from '@/types';

interface VehicleCardProps {
  vehicle: Vehicle;
  onReserve?: (vehicle: Vehicle) => void;
}

export default function VehicleCard({ vehicle, onReserve }: VehicleCardProps) {
  const isAvailable = vehicle.isAvailable ?? false;

  const availabilityVariant =
    vehicle.availabilityStatus === 'Beschikbaar'      ? 'available'    :
    vehicle.availabilityStatus === 'Verhuurd'         ? 'reserved'     :
    vehicle.availabilityStatus === 'Gereserveerd'     ? 'reserved'     :
    vehicle.availabilityStatus === 'Onderhoud'        ? 'maintenance'  : 'unavailable';

  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">
            {vehicle.brand} {vehicle.model}
          </CardTitle>
          <Badge variant={availabilityVariant} className="shrink-0 text-xs">
            {vehicle.availabilityStatus}
          </Badge>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs">{vehicle.type}</Badge>
          {vehicle.color && (
            <Badge variant="outline" className="text-xs">{vehicle.color}</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm text-[#616161]">
          {vehicle.seats && (
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-brand-600" />
              <span>{vehicle.seats} zitplaatsen</span>
            </div>
          )}
          {vehicle.engineCC && (
            <div className="flex items-center gap-1.5">
              <Gauge className="h-3.5 w-3.5 text-brand-600" />
              <span>{vehicle.engineCC} cc</span>
            </div>
          )}
          {vehicle.locationCity && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-brand-600" />
              <span className="truncate">{vehicle.locationCity}</span>
            </div>
          )}
        </div>

        {vehicle.options && (
          <p className="text-xs text-[#616161] border border-[#d6d6d6] rounded-md px-3 py-2">
            {vehicle.options}
          </p>
        )}

        {/* Pricing table */}
        {(vehicle.halfDayPrice || vehicle.fullDayPrice || vehicle.weekPrice) ? (
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
                {vehicle.weekPrice && (
                  <tr className="border-b border-[#d6d6d6]">
                    <td className="px-3 py-1.5 text-[#616161]">Week</td>
                    <td className="px-3 py-1.5 text-right font-semibold text-brand-600">
                      €{Number(vehicle.weekPrice).toFixed(2)}
                    </td>
                  </tr>
                )}
                {vehicle.monthPrice && (
                  <tr>
                    <td className="px-3 py-1.5 text-[#616161]">Maand</td>
                    <td className="px-3 py-1.5 text-right font-semibold text-brand-600">
                      €{Number(vehicle.monthPrice).toFixed(2)}
                    </td>
                  </tr>
                )}
                <tr className="bg-[#f9f9f9]">
                  <td className="px-3 py-1.5 text-[#616161]">&gt; 1 maand</td>
                  <td className="px-3 py-1.5 text-right text-xs text-[#616161] italic">prijs op aanvraag</td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-[#616161] italic">Prijs op aanvraag</p>
        )}

        <div className="text-xs text-[#616161] font-mono">{vehicle.licensePlate}</div>
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
