import { NextRequest, NextResponse } from 'next/server';
import { getVehicles, createVehicle } from '@/lib/db';
import { VehicleFilters } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filters: VehicleFilters = {};

    const type             = searchParams.get('type');
    const brand            = searchParams.get('brand');
    const seats            = searchParams.get('seats');
    const transmissionType = searchParams.get('transmissionType');
    const fuelType         = searchParams.get('fuelType');
    const locationId       = searchParams.get('locationId');
    const availableFrom    = searchParams.get('availableFrom');
    const availableTo      = searchParams.get('availableTo');

    if (type)             filters.type             = type;
    if (brand)            filters.brand            = brand;
    if (seats)            filters.seats            = Number(seats);
    if (transmissionType) filters.transmissionType = transmissionType;
    if (fuelType)         filters.fuelType         = fuelType;
    if (locationId)       filters.locationId       = Number(locationId);
    if (availableFrom)    filters.availableFrom    = availableFrom;
    if (availableTo)      filters.availableTo      = availableTo;

    const vehicles = await getVehicles(Object.keys(filters).length > 0 ? filters : undefined);
    return NextResponse.json(vehicles);
  } catch (err) {
    console.error('GET /api/vehicles error:', err);
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const id = await createVehicle(data);
    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    console.error('POST /api/vehicles error:', err);
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 });
  }
}
