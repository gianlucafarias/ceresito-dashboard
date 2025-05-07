export interface Contact {
  id: number;
  phone: string | null;
  contact_name: string | null;
  createdAt: string;
  updatedIn: string | null;
  lastInteraction: string | null;
  values: Record<string, any> | null;
} 