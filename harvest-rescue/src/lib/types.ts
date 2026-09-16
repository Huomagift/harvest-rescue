export interface FarmCreate {
  name: string;
  owner_name?: string | null;
  latitude: number;
  longitude: number;
  elevation?: number | null;
  crop_type: string;
  planting_date?: string | null;
  is_demo?: boolean;
}

export interface Farm {
  id: string;
  name: string;
  owner_name?: string | null;
  latitude: number;
  longitude: number;
  elevation?: number | null;
  crop_type: string;
  planting_date?: string | null;
  is_demo?: boolean;
  created_at: string;
  last_monitored_at?: string | null;
}

export type RiskType = "flood" | "drought_heat" | "vigor_decline" | "farmer_reported" | string;
export type RiskSeverity = "low" | "medium" | "high";
export type AlertStatus = "unread" | "read" | "dismissed";

export interface ContributingData {
  impact_day_index?: number;
  impact_date?: string | null;
  window_rainfall_mm?: number;
  max_temp_c?: number;
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

export interface Alert {
  id: string;
  farm_id: string;
  risk_event_id?: string | null;
  risk_type: RiskType;
  title: string;
  message: string;
  severity: RiskSeverity;
  status: AlertStatus;
  days_to_impact?: number | null;
  created_at: string;
}

export interface SweepResult {
  farms_checked: number;
  risks_found: number;
  alerts_created_or_updated: number;
  timestamp: string;
}

export interface FarmerReportCreate {
  note: string;
  category?: string | null;
}

export interface FarmerReportResponse {
  id: string;
  status: string;
}

export interface SignalResponse {
  farm_id: string;
  farm_name: string;
  weather: {
    daily_dates?: string[];
    daily_rainfall_mm?: number[];
    daily_max_temp_c?: number[];
    rainfall_next_48h_mm?: number;
    max_temp_next_48h_c?: number;
    source: string;
    fallback_reason?: string;
  };
  ndvi: {
    ndvi_current?: number;
    ndvi_trend_delta?: number;
    source: string;
    fallback_reason?: string;
  };
  last_monitored_at?: string | null;
}


