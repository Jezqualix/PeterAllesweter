export interface RentalLocation {
  id: number;
  name: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  isActive: boolean;
  verantwoordelijke?: string | null;
}

export interface Vehicle {
  id: number;
  licensePlate: string;
  modelId: number;
  color: string | null;
  options: string | null;
  locationId: number;
  availabilityStatus: string;   // Dutch string from DB: 'Beschikbaar', 'Verhuurd', etc.
  statusId: number;
  statusNote: string | null;
  // Joined from Modellen
  type: string;
  brand: string;
  model: string;
  seats: number | null;
  engineCC: number | null;
  // Joined from Locaties
  locationName?: string;
  locationCity?: string;
  // Joined from VoertuigStatussen
  isAvailable?: boolean;
  // Joined from ModelPrijzen
  halfDayPrice?: number | null;
  fullDayPrice?: number | null;
  weekPrice?: number | null;
  monthPrice?: number | null;
}

export interface Rental {
  id: number;
  vehicleId: number;
  locationId: number;
  customerName: string;
  customerEmail: string;
  startDateTime: string;
  endDateTime: string;
  rentalPeriodType: string;
  totalPrice: number;
  status: string;
  createdAt: string;
}

export interface Conversation {
  conversationId: string;
  userId: string;
  timestamp: string;
  messageCount?: number;
}

export interface Message {
  messageId: number;
  conversationId: string;
  role: string;
  content: string;
  timestamp: string;
  llmModelUsed?: string | null;
}

export interface VehicleQuery {
  id: number;
  conversationId: string;
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
  rentalPeriodType: string;
  totalPrice: number;
}
