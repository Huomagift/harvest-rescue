import { RiskEvent, RiskSeverity, RiskType } from "./types";

export interface ThemeConfig {
  bgClass: string;
  borderClass: string;
  textClass: string;
  badgeBg: string;
  badgeText: string;
  bannerBg: string;
  bannerText: string;
  bannerBorder: string;
  label: string;
}

export const getSeverityTheme = (severity: RiskSeverity | undefined | null): ThemeConfig => {
  switch (severity) {
    case "high":
      return {
        bgClass: "bg-[#FFDAD6]",
        borderClass: "border-[#FFB4AB]",
        textClass: "text-[#410E0B]",
        badgeBg: "bg-[#BA1A1A]",
        badgeText: "text-[#FFFFFF]",
        bannerBg: "bg-[#FFDAD6]",
        bannerText: "text-[#410E0B]",
        bannerBorder: "border-[#BA1A1A]/40",
        label: "High Risk",
      };
    case "medium":
      return {
        bgClass: "bg-[#FFDCC2]",
        borderClass: "border-[#FFB68F]",
        textClass: "text-[#341200]",
        badgeBg: "bg-[#8B5000]",
        badgeText: "text-[#FFFFFF]",
        bannerBg: "bg-[#FFDCC2]",
        bannerText: "text-[#341200]",
        bannerBorder: "border-[#8B5000]/40",
        label: "Medium Risk",
      };
    case "low":
    default:
      return {
        bgClass: "bg-[#D8ECE0]",
        borderClass: "border-[#A3D9B5]",
        textClass: "text-[#052119]",
        badgeBg: "bg-[#1B4D3E]",
        badgeText: "text-[#FFFFFF]",
        bannerBg: "bg-[#D8ECE0]",
        bannerText: "text-[#052119]",
        bannerBorder: "border-[#1B4D3E]/30",
        label: "Low Risk",
      };
  }
};

export const getHighestSeverity = (events: RiskEvent[]): RiskSeverity => {
  if (!events || events.length === 0) return "low";
  if (events.some((e) => e.severity === "high")) return "high";
  if (events.some((e) => e.severity === "medium")) return "medium";
  return "low";
};

export interface AgronomicRecommendation {
  id: string;
  title: string;
  description: string;
  urgency: "immediate" | "scheduled" | "preventative";
  riskType: RiskType;
  actionText: string;
}

export const getRiskRecommendations = (events: RiskEvent[]): AgronomicRecommendation[] => {
  if (!events || events.length === 0) {
    return [
      {
        id: "routine_1",
        title: "Regular Canopy Inspection",
        description: "Maintain bi-weekly visual checks of leaf underside for early pest vectors.",
        urgency: "preventative",
        riskType: "routine",
        actionText: "Log Field Observation",
      },
      {
        id: "routine_2",
        title: "Soil Moisture Calibration",
        description: "Current soil moisture levels are within optimal range. Next satellite pass in 48h.",
        urgency: "scheduled",
        riskType: "routine",
        actionText: "View Satellite Log",
      },
    ];
  }

  const recommendations: AgronomicRecommendation[] = [];

  events.forEach((event) => {
    if (event.risk_type === "flood") {
      recommendations.push(
        {
          id: `flood_drainage_${event.id}`,
          title: "Drainage Channel Clearance",
          description: `Heavy rainfall forecasted (${event.contributing_data?.rainfall_next_48h_mm ?? 40}+ mm). Immediately inspect perimeter drainage trenches and unblock runoff outlets to prevent root zone saturation.`,
          urgency: "immediate",
          riskType: "flood",
          actionText: "Mark Drainage Checked",
        },
        {
          id: `flood_harvest_${event.id}`,
          title: "Pre-storm Crop Protection",
          description: "Move harvested yield and equipment to elevated ground. Secure temporary soil mounds along field slopes.",
          urgency: "immediate",
          riskType: "flood",
          actionText: "View Protection Protocol",
        }
      );
    } else if (event.risk_type === "drought_heat") {
      recommendations.push(
        {
          id: `heat_irrigation_${event.id}`,
          title: "Targeted Evening Drip Irrigation",
          description: `High temp spike expected (${event.contributing_data?.max_temp_next_48h_c ?? 38}°C). Irrigate during low-evaporation evening hours to maintain root moisture without leaf scorching.`,
          urgency: "immediate",
          riskType: "drought_heat",
          actionText: "Schedule Irrigation Cycle",
        },
        {
          id: `heat_mulch_${event.id}`,
          title: "Mulch & Organic Soil Shading",
          description: "Apply crop residue or organic mulch over exposed topsoil to reduce moisture loss and root thermal stress.",
          urgency: "scheduled",
          riskType: "drought_heat",
          actionText: "Review Mulch Guidance",
        }
      );
    } else if (event.risk_type === "vigor_decline") {
      recommendations.push(
        {
          id: `vigor_fertilizer_${event.id}`,
          title: "Nitrogen & Micronutrient Soil Sample",
          description: `Satellite Sentinel-2 NDVI trend shows vigor drop (delta ${event.contributing_data?.ndvi_trend_delta?.toFixed(2) ?? "-0.08"}). Scout for leaf chlorosis and test soil N-P-K balance.`,
          urgency: "immediate",
          riskType: "vigor_decline",
          actionText: "Order Soil Test Kit",
        },
        {
          id: `vigor_scout_${event.id}`,
          title: "Pest & Armyworm Field Scouting",
          description: "Rapid canopy decline often signals stem borer or fall armyworm activity. Perform 5-point field walk.",
          urgency: "scheduled",
          riskType: "vigor_decline",
          actionText: "Report Pest Sighting",
        }
      );
    } else {
      recommendations.push({
        id: `custom_${event.id}`,
        title: "Farmer-Reported Field Action",
        description: `Observation noted: "${event.contributing_data?.note || "Field note recorded"}". Monitor affected area closely over next 3 days.`,
        urgency: "scheduled",
        riskType: event.risk_type,
        actionText: "Update Note",
      });
    }
  });

  return recommendations;
};

export const isDataStale = (createdAt: string | undefined | null): boolean => {
  if (!createdAt) return true;
  const createdDate = new Date(createdAt);
  if (isNaN(createdDate.getTime())) return false;
  const now = new Date();
  const diffHours = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
  return diffHours > 24;
};

export interface ExtractedSignals {
  rainfall: { value: number; unit: string; trend: string; status: "normal" | "warning" | "alert" };
  temp: { value: number; unit: string; trend: string; status: "normal" | "warning" | "alert" };
  ndvi: { value: number; delta: number; status: "normal" | "warning" | "alert" };
}

export const extractSignalIndicators = (events: RiskEvent[]): ExtractedSignals => {
  let maxRainfall = 12.4; // normal baseline default
  let maxTemp = 31.5; // normal baseline default
  let ndviCurrent = 0.72; // healthy baseline default
  let ndviDelta = +0.03;

  events.forEach((e) => {
    if (e.contributing_data?.rainfall_next_48h_mm !== undefined) {
      maxRainfall = Math.max(maxRainfall, e.contributing_data.rainfall_next_48h_mm);
    }
    if (e.contributing_data?.max_temp_next_48h_c !== undefined) {
      maxTemp = Math.max(maxTemp, e.contributing_data.max_temp_next_48h_c);
    }
    if (e.contributing_data?.ndvi_current !== undefined) {
      ndviCurrent = e.contributing_data.ndvi_current;
    }
    if (e.contributing_data?.ndvi_trend_delta !== undefined) {
      ndviDelta = e.contributing_data.ndvi_trend_delta;
    }
  });

  const rainStatus: "normal" | "warning" | "alert" = maxRainfall >= 40 ? "alert" : maxRainfall >= 25 ? "warning" : "normal";
  const tempStatus: "normal" | "warning" | "alert" = maxTemp >= 38 ? "alert" : maxTemp >= 34 ? "warning" : "normal";
  const ndviStatus: "normal" | "warning" | "alert" = ndviDelta <= -0.08 ? "alert" : ndviDelta < 0 ? "warning" : "normal";

  return {
    rainfall: {
      value: maxRainfall,
      unit: "mm / 48h",
      trend: maxRainfall >= 40 ? "Heavy Downpour Alert" : "Moderate Precipitation",
      status: rainStatus,
    },
    temp: {
      value: maxTemp,
      unit: "°C max",
      trend: maxTemp >= 38 ? "Heatwave Threshold Exceeded" : "Optimal Growing Temp",
      status: tempStatus,
    },
    ndvi: {
      value: ndviCurrent,
      delta: ndviDelta,
      status: ndviStatus,
    },
  };
};
