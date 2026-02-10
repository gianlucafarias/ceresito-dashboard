export interface Pharmacy {
  code: string;
  name: string;
  address: string;
  phone: string;
  lat: number | null;
  lng: number | null;
  googleMapsAddress: string | null;
}

export interface DutyAssignment {
  date: string;
  pharmacyCode: string;
  scheduleYear: number;
  source: string | null;
  createdAt?: string;
  updatedAt?: string;
  pharmacy?: Pharmacy;
}

export interface DutyRangeResponse {
  from: string;
  to: string;
  count: number;
  rows: DutyAssignment[];
}

export interface DutyCalendarSlot {
  date: string;
  schedule: DutyAssignment | null;
}

export interface DutyCalendarResponse {
  today: DutyCalendarSlot;
  tomorrow: DutyCalendarSlot;
  dayAfterTomorrow: DutyCalendarSlot;
}

export interface DutyBootstrapResponse {
  from: string;
  to: string;
  count: number;
  quickPreview: DutyCalendarResponse;
  rows: DutyAssignment[];
  pharmacies: Pharmacy[];
}

export type TabKey = "calendar" | "duty" | "pharmacies";

export type QuickPreviewItem = {
  key: "today" | "tomorrow" | "dayAfterTomorrow";
  label: string;
  date: string;
  schedule: DutyAssignment | null;
  pharmacy?: Pharmacy;
};

export type RequestError = Error & {
  status?: number;
  payload?: unknown;
};
