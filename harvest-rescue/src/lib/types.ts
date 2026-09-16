export interface FarmCreate {
  name: string;
  owner_name?: string | null;
  latitude: number;
  longitude: number;
  crop_type: string;
  planting_date?: string | null;
}

export interface Farm {
  id: string;
  name: string;
  owner_name?: string | null;
  latitude: number;
  longitude: number;
  crop_type: string;
  planting_date?: string | null;
  created_at: string;
}

export type RiskType = "flood" | "drought_heat" | "vigor_decline" | "farmer_reported" | string;
export type RiskSeverity = "low" | "medium" | "high";

export interface ContributingData {
  rainfall_next_48h_mm?: number;
  max_temp_next_48h_c?: number;
  ndvi_current?: number;
  ndvi_trend_delta?: number;
  note?: string;
  [key: string]: any;
}

export interface RiskEvent {
  id: string;
  farm_id: string;
  risk_type: RiskType;
  severity: RiskSeverity;
  days_to_impact?: number | null;
  contributing_data?: ContributingData | null;
  created_at: string;
}

export interface FarmerReportCreate {
  note: string;
  category?: string | null;
}

export interface FarmerReportResponse {
  id: string;
  status: string;
}
