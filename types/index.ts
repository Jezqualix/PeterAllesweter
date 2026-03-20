export interface EngineType {
  id: number;
  name: string;
  fuelType: string;
  co2Category: string;
  description?: string | null;
}

export interface RentalLocation {
  id: number;
  name: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  isActive: boolean;
}

export interface VehiclePricing {
  id: number;
  vehicleId: number;
  halfDayPrice: number;
  fullDayPrice: number;
  weekendPrice: number;
  weekPrice: number;
  monthPrice: number;
  validFrom: string;
  validUntil: string | null;
  lastUpdated: string;
}

export interface Vehicle {
  id: number;
  brand: string;      // DB column: brand (not make)
  model: string;
  type: string;       // lowercase: 'hatchback', 'sedan', 'suv', ...
  licensePlate: string;
  year: number;
  seats: number;
  engineTypeId: number;
  engineCC: number | null;
  powerKW: number | null;
  transmissionType: string;  // 'manual' | 'automatic'
  availabilityStatus: 'available' | 'unavailable' | 'rented' | 'reserved' | 'maintenance';
  locationId: number;
  mileage: number;
  lastUpdated?: string;
  notes: string | null;
  // Joined fields from EngineTypes
  engineTypeName?: string;
  fuelType?: string;
  co2Category?: string;
  // Joined fields from RentalLocations
  locationName?: string;
  locationCity?: string;
  // Joined fields from VehiclePricing (validUntil IS NULL)
  halfDayPrice?: number;
  fullDayPrice?: number;
  weekendPrice?: number;
  weekPrice?: number;
  monthPrice?: number;
}

export interface Rental {
  id: number;
  vehicleId: number;
  locationId: number;
  customerName: string;
  customerEmail: string;
  startDateTime: string;
  endDateTime: string;
  rentalPeriodType: 'halfDay' | 'fullDay' | 'weekend' | 'week' | 'month';
  totalPrice: number;
  status: 'confirmed' | 'active' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface Conversation {
  conversationId: string;   // e.g. "conv_1773937888165_0t8hfdb"
  userId: string;
  timestamp: string;
  messageCount?: number;
}

export interface Message {
  messageId: number;
  conversationId: string;   // FK → Conversations.conversationId (string)
  role: string;
  content: string;
  timestamp: string;
  llmModelUsed?: string | null;
}

export interface VehicleQuery {
  id: number;
  conversationId: string;   // FK → Conversations.conversationId (string)
  vehicleId?: number | null;
  queryType: string;
  response?: string | null;
  timestamp: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequest {
  message: string;
  sessionId: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'user';
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
  isActive: boolean;
  forcePasswordReset: boolean;
  lastLogin: string | null;
  createdAt: string;
}

export interface VehicleFilters {
  brand?: string;
  model?: string;
  type?: string;
  seats?: number;
  transmissionType?: string;
  fuelType?: string;
  locationId?: number;
  availableFrom?: string;
  availableTo?: string;
}

export interface CreateRentalInput {
  vehicleId: number;
  locationId: number;
  customerName: string;
  customerEmail: string;
  startDateTime: string;
  endDateTime: string;
  rentalPeriodType: Rental['rentalPeriodType'];
  totalPrice: number;
}
