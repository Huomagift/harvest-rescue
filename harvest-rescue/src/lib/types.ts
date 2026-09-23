export interface FarmCreate {
  name: string;
  owner_name?: string | null;
  farmer_email?: string | null;
  latitude: number;
  longitude: number;
  elevation?: number | null;
  crop_type: string;
  planting_date?: string | null;
  size_hectares?: number | null;
  location_name?: string | null;
  boundary_geojson?: any;
  risk_zones?: any;
  is_demo?: boolean;
}

export interface RiskZone {
  zone_name: string;
  risk_type: string;
  severity: RiskSeverity;
  label: string;
  coordinates: [number, number][]; // [lon, lat] pairs
}

export interface Farm {
  id: string;
  name: string;
  owner_name?: string | null;
  farmer_email?: string | null;
  latitude: number;
  longitude: number;
  elevation?: number | null;
  crop_type: string;
  planting_date?: string | null;
  size_hectares?: number | null;
  location_name?: string | null;
  boundary_geojson?: {
    type: string;
    coordinates: number[][][];
  } | null;
  risk_zones?: RiskZone[] | null;
  is_demo?: boolean;
  created_at: string;
  last_monitored_at?: string | null;
  last_email_notification_at?: string | null;
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

export interface RiskOutlookDay {
  day_offset: number;
  date: string;
  day_label: string;       // "Today", "Tomorrow", "Sep 25"
  severity: RiskSeverity;  // "low" | "medium" | "high"
  risk_label: string;      // "Low Risk", "Moderate", "High"
  summary: string;
}

export interface RecommendedAction {
  action_title: string;
  action_description: string;
  urgency: "immediate" | "advisory" | "standard";
  protocol_code?: string;
}

export interface SignalSeries {
  value: number;
  forecast_value?: number;
  unit: string;
  trend: string;
  threshold_label?: string;
  status: "optimal" | "caution" | "warning";
  series_15d: number[];
  why_it_matters?: string;
}

export interface SignalResponse {
  farm_id: string;
  farm_name: string;
  crop_stage?: string;
  days_since_planting?: number;
  agronomic_status_text?: string;
  current_severity?: RiskSeverity;
  risk_trend?: "increasing" | "decreasing" | "stable";
  headline?: string;
  why_factors?: string[];
  recommended_action?: RecommendedAction;
  outlook?: RiskOutlookDay[];
  signals?: {
    rainfall: SignalSeries;
    soil_moisture: SignalSeries;
    crop_condition: SignalSeries;
    temperature: SignalSeries;
    humidity?: SignalSeries;
  };
  weather?: {
    daily_dates?: string[];
    daily_rainfall_mm?: number[];
    daily_max_temp_c?: number[];
    rainfall_next_48h_mm?: number;
    max_temp_next_48h_c?: number;
    soil_moisture_root_zone_pct?: number;
    source: string;
  };
  ndvi?: {
    ndvi_current?: number;
    ndvi_trend_delta?: number;
    source: string;
  };
  last_monitored_at?: string | null;
}
