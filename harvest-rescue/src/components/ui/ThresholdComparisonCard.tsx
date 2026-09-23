"use client";

import React from "react";
import { Sliders, Droplets, Thermometer, Activity, Layers } from "lucide-react";
import { RiskEvent, SignalResponse } from "@/lib/types";

interface ThresholdComparisonCardProps {
  riskEvents: RiskEvent[];
  signalsData: SignalResponse | null;
  cropType: string;
}

interface CropThresholds {
  rainThreshold: number;
  tempThreshold: number;
  ndviThreshold: number;
  minMoisture: number;
  maxMoisture: number;
  rainDesc: string;
  tempDesc: string;
  moistureDesc: string;
}

const CROP_THRESHOLDS: Record<string, CropThresholds> = {
  maize: {
    rainThreshold: 40.0,
    tempThreshold: 35.0,
    ndviThreshold: -0.08,
    minMoisture: 18.0,
    maxMoisture: 55.0,
    rainDesc: "Root zone waterlogging & silk lodging risk trigger: ≥ 40.0 mm",
    tempDesc: "Pollen desiccation & thermal sterility trigger: ≥ 35.0 °C",
    moistureDesc: "Optimal vegetative root moisture range: 18% – 55%",
  },
  rice: {
    rainThreshold: 65.0,
    tempThreshold: 37.0,
    ndviThreshold: -0.07,
    minMoisture: 30.0,
    maxMoisture: 75.0,
    rainDesc: "Bund overtopping & seedling submergence trigger: ≥ 65.0 mm",
    tempDesc: "Panicle thermal scorch & floret sterility trigger: ≥ 37.0 °C",
    moistureDesc: "Optimal paddy saturation range: 30% – 75%",
  },
  sorghum: {
    rainThreshold: 45.0,
    tempThreshold: 38.0,
    ndviThreshold: -0.09,
    minMoisture: 14.0,
    maxMoisture: 50.0,
    rainDesc: "Drainage furrow logging & grain mold trigger: ≥ 45.0 mm",
    tempDesc: "Extreme flowering desiccation trigger: ≥ 38.0 °C",
    moistureDesc: "Drought-resilient root moisture range: 14% – 50%",
  },
  soybeans: {
    rainThreshold: 40.0,
    tempThreshold: 34.0,
    ndviThreshold: -0.08,
    minMoisture: 20.0,
    maxMoisture: 52.0,
    rainDesc: "Root rot & pod blight susceptibility trigger: ≥ 40.0 mm",
    tempDesc: "Blossom drop & reduced pod set trigger: ≥ 34.0 °C",
    moistureDesc: "Optimal pod development moisture range: 20% – 52%",
  },
  cassava: {
    rainThreshold: 35.0,
    tempThreshold: 36.0,
    ndviThreshold: -0.08,
    minMoisture: 16.0,
    maxMoisture: 48.0,
    rainDesc: "Subsurface tuber rot & anaerobic rot trigger: ≥ 35.0 mm",
    tempDesc: "Leaf drop & vegetative wilting trigger: ≥ 36.0 °C",
    moistureDesc: "Optimal tuber bulking moisture range: 16% – 48%",
  },
};

export const ThresholdComparisonCard: React.FC<ThresholdComparisonCardProps> = ({
  riskEvents,
  signalsData,
  cropType,
}) => {
  const normCrop = (cropType || "maize").toLowerCase();
  const cfg: CropThresholds = CROP_THRESHOLDS[normCrop] || CROP_THRESHOLDS["maize"];

  // Extract readings from signalsData
  const dailyRainfall = signalsData?.weather?.daily_rainfall_mm || [];
  const dailyTemps = signalsData?.weather?.daily_max_temp_c || [];
  const ndviDelta = signalsData?.ndvi?.ndvi_trend_delta ?? -0.04;
  const currentMoisture =
    signalsData?.signals?.soil_moisture?.value ??
    signalsData?.weather?.soil_moisture_root_zone_pct ??
    35.0;

  // Calculate 3-day peak rainfall
  let peak3DayRain = 0;
  let peakRainDay = 0;
  for (let i = 0; i < dailyRainfall.length; i++) {
    const windowSum = (dailyRainfall[i] || 0) + (dailyRainfall[i + 1] || 0) + (dailyRainfall[i + 2] || 0);
    if (windowSum > peak3DayRain) {
      peak3DayRain = windowSum;
      peakRainDay = i;
    }
  }
  if (peak3DayRain === 0 && signalsData?.weather?.rainfall_next_48h_mm) {
    peak3DayRain = signalsData.weather.rainfall_next_48h_mm;
  }

  const peakTemp = dailyTemps.length > 0 ? Math.max(...dailyTemps) : (signalsData?.weather?.max_temp_next_48h_c || 31.0);
  const peakTempDay = dailyTemps.indexOf(peakTemp);

  const isRainBreached = peak3DayRain >= cfg.rainThreshold;
  const isTempBreached = peakTemp >= cfg.tempThreshold;
  const isNdviBreached = ndviDelta <= cfg.ndviThreshold;
  const isMoistureTooHigh = currentMoisture > cfg.maxMoisture;
  const isMoistureTooLow = currentMoisture < cfg.minMoisture;
  const isMoistureBreached = isMoistureTooHigh || isMoistureTooLow;

  const floodEvent = riskEvents.find((e) => e.risk_type === "flood");
  const heatEvent = riskEvents.find((e) => e.risk_type === "drought_heat");

  return (
    <div className="p-6 rounded-3xl bg-white border border-[#E0E4DF] shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#E0E4DF]">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-[#D8ECE0] text-[#1B4D3E] flex items-center justify-center">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-[#191C1A]">Agronomic Risk Thresholds</h3>
            <p className="text-xs text-[#717973]">
              Evaluating live environmental readings against agronomic safety limits for <strong>{cropType.toUpperCase()}</strong>
            </p>
          </div>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-[#F0F4EF] text-[#414943] font-semibold self-start sm:self-center">
          Crop Safety Limits
        </span>
      </div>

      {/* Comparison Grid (4 Rows) */}
      <div className="space-y-4">
        {/* 1. Rainfall / Flood Threshold */}
        <div className={`p-4 rounded-2xl border transition-all ${isRainBreached ? "bg-[#FFDAD6]/40 border-[#BA1A1A]/30" : "bg-[#F0F4EF]/50 border-[#E0E4DF]"}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#191C1A]">3-Day Cumulative Rainfall</span>
                {isRainBreached ? (
                  <span className="px-2 py-0.5 rounded-full bg-[#BA1A1A] text-white text-[11px] font-extrabold uppercase">
                    Threshold Exceeded
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-[#1B4D3E] text-white text-[11px] font-semibold uppercase">
                    Safe Range
                  </span>
                )}
              </div>
              <p className="text-xs text-[#717973] mt-0.5">
                {cfg.rainDesc}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className={`text-base font-extrabold ${isRainBreached ? "text-[#BA1A1A]" : "text-[#1B4D3E]"}`}>
                {peak3DayRain.toFixed(1)} mm
              </span>
              <span className="text-xs text-[#717973] block">
                {isRainBreached ? `Impact in ~${floodEvent?.days_to_impact ?? peakRainDay}d` : "Forecast accumulation safe"}
              </span>
            </div>
          </div>

          <div className="w-full bg-[#E0E4DF] h-2.5 rounded-full overflow-hidden relative">
            <div
              className={`h-full transition-all duration-500 ${isRainBreached ? "bg-[#BA1A1A]" : "bg-[#1B4D3E]"}`}
              style={{ width: `${Math.min(100, (peak3DayRain / (cfg.rainThreshold * 1.5)) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-[#717973] mt-1">
            <span>0 mm</span>
            <span className="font-bold text-[#8B5000]">Critical: {cfg.rainThreshold} mm</span>
            <span>{Math.round(cfg.rainThreshold * 1.5)}+ mm</span>
          </div>
        </div>

        {/* 2. Root Zone Soil Moisture */}
        <div className={`p-4 rounded-2xl border transition-all ${isMoistureBreached ? "bg-[#FFDAD6]/40 border-[#BA1A1A]/30" : "bg-[#F0F4EF]/50 border-[#E0E4DF]"}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#191C1A]">Root Zone Soil Moisture</span>
                {isMoistureTooHigh ? (
                  <span className="px-2 py-0.5 rounded-full bg-[#BA1A1A] text-white text-[11px] font-extrabold uppercase">
                    Waterlogging Warning
                  </span>
                ) : isMoistureTooLow ? (
                  <span className="px-2 py-0.5 rounded-full bg-[#BA1A1A] text-white text-[11px] font-extrabold uppercase">
                    Moisture Deficit
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-[#1B4D3E] text-white text-[11px] font-semibold uppercase">
                    Optimal Range
                  </span>
                )}
              </div>
              <p className="text-xs text-[#717973] mt-0.5">
                {cfg.moistureDesc}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className={`text-base font-extrabold ${isMoistureBreached ? "text-[#BA1A1A]" : "text-[#1B4D3E]"}`}>
                {currentMoisture.toFixed(1)}%
              </span>
              <span className="text-xs text-[#717973] block">
                {isMoistureTooHigh
                  ? "Root suffocation risk"
                  : isMoistureTooLow
                  ? "Water stress conditions"
                  : "Adequate root moisture"}
              </span>
            </div>
          </div>

          <div className="w-full bg-[#E0E4DF] h-2.5 rounded-full overflow-hidden relative">
            <div
              className={`h-full transition-all duration-500 ${isMoistureBreached ? "bg-[#BA1A1A]" : "bg-[#1B4D3E]"}`}
              style={{ width: `${Math.min(100, Math.max(5, currentMoisture))}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-[#717973] mt-1">
            <span>0%</span>
            <span className="font-bold text-[#1B4D3E]">Optimal: {cfg.minMoisture}% – {cfg.maxMoisture}%</span>
            <span>100%</span>
          </div>
        </div>

        {/* 3. Temperature / Thermal Stress */}
        <div className={`p-4 rounded-2xl border transition-all ${isTempBreached ? "bg-[#FFDAD6]/40 border-[#BA1A1A]/30" : "bg-[#F0F4EF]/50 border-[#E0E4DF]"}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#191C1A]">Peak Daytime Temperature</span>
                {isTempBreached ? (
                  <span className="px-2 py-0.5 rounded-full bg-[#BA1A1A] text-white text-[11px] font-extrabold uppercase">
                    Thermal Stress Exceeded
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-[#1B4D3E] text-white text-[11px] font-semibold uppercase">
                    Safe Range
                  </span>
                )}
              </div>
              <p className="text-xs text-[#717973] mt-0.5">
                {cfg.tempDesc}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className={`text-base font-extrabold ${isTempBreached ? "text-[#BA1A1A]" : "text-[#1B4D3E]"}`}>
                {peakTemp.toFixed(1)} °C
              </span>
              <span className="text-xs text-[#717973] block">
                {isTempBreached ? `Thermal peak in ~${heatEvent?.days_to_impact ?? peakTempDay}d` : "Within growing bounds"}
              </span>
            </div>
          </div>

          <div className="w-full bg-[#E0E4DF] h-2.5 rounded-full overflow-hidden relative">
            <div
              className={`h-full transition-all duration-500 ${isTempBreached ? "bg-[#BA1A1A]" : "bg-[#1B4D3E]"}`}
              style={{ width: `${Math.min(100, Math.max(10, (peakTemp / 48.0) * 100))}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-[#717973] mt-1">
            <span>20 °C</span>
            <span className="font-bold text-[#8B5000]">Thermal Stress Limit: {cfg.tempThreshold} °C</span>
            <span>48 °C</span>
          </div>
        </div>

        {/* 4. Canopy Vigor Trend */}
        <div className={`p-4 rounded-2xl border transition-all ${isNdviBreached ? "bg-[#FFDAD6]/40 border-[#BA1A1A]/30" : "bg-[#F0F4EF]/50 border-[#E0E4DF]"}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#191C1A]">14-Day Crop Canopy Vigor Trend</span>
                {isNdviBreached ? (
                  <span className="px-2 py-0.5 rounded-full bg-[#BA1A1A] text-white text-[11px] font-extrabold uppercase">
                    Vigor Decline Detected
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-[#1B4D3E] text-white text-[11px] font-semibold uppercase">
                    Canopy Stable
                  </span>
                )}
              </div>
              <p className="text-xs text-[#717973] mt-0.5">
                Vegetative chlorosis &amp; pest vector alert trigger: <strong>delta ≤ {cfg.ndviThreshold.toFixed(2)}</strong>
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className={`text-base font-extrabold ${isNdviBreached ? "text-[#BA1A1A]" : "text-[#1B4D3E]"}`}>
                {ndviDelta > 0 ? `+${ndviDelta.toFixed(3)}` : ndviDelta.toFixed(3)}
              </span>
              <span className="text-xs text-[#717973] block">
                {isNdviBreached ? "Field scouting advised" : "Healthy leaf chlorophyll"}
              </span>
            </div>
          </div>

          <div className="w-full bg-[#E0E4DF] h-2.5 rounded-full overflow-hidden relative">
            <div
              className={`h-full transition-all duration-500 ${isNdviBreached ? "bg-[#BA1A1A]" : "bg-[#1B4D3E]"}`}
              style={{ width: `${Math.min(100, Math.max(10, ((ndviDelta + 0.2) / 0.4) * 100))}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-[#717973] mt-1">
            <span>-0.20 (Severe Loss)</span>
            <span className="font-bold text-[#8B5000]">Trigger: {cfg.ndviThreshold}</span>
            <span>+0.20 (Vigorous Growth)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThresholdComparisonCard;
