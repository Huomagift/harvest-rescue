"use client";

import React from "react";
import { Sliders, ShieldCheck, AlertTriangle, AlertOctagon, Info, ArrowUpRight } from "lucide-react";
import { RiskEvent, SignalResponse } from "@/lib/types";

interface ThresholdComparisonCardProps {
  riskEvents: RiskEvent[];
  signalsData: SignalResponse | null;
  cropType: string;
}

export const ThresholdComparisonCard: React.FC<ThresholdComparisonCardProps> = ({
  riskEvents,
  signalsData,
  cropType,
}) => {
  // Extract real readings from signalsData or risk events
  const dailyRainfall = signalsData?.weather?.daily_rainfall_mm || [];
  const dailyTemps = signalsData?.weather?.daily_max_temp_c || [];
  const ndviDelta = signalsData?.ndvi?.ndvi_trend_delta ?? -0.04;

  // Calculate 16-day peaks
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

  // Threshold constants (matching risk_engine.py)
  const RAIN_THRESHOLD = 40.0;
  const TEMP_THRESHOLD = 35.0;
  const NDVI_THRESHOLD = -0.08;

  const isRainBreached = peak3DayRain >= RAIN_THRESHOLD;
  const isTempBreached = peakTemp >= TEMP_THRESHOLD;
  const isNdviBreached = ndviDelta <= NDVI_THRESHOLD;

  const floodEvent = riskEvents.find((e) => e.risk_type === "flood");
  const heatEvent = riskEvents.find((e) => e.risk_type === "drought_heat");
  const vigorEvent = riskEvents.find((e) => e.risk_type === "vigor_decline");

  return (
    <div className="p-6 rounded-3xl bg-white border border-[#E0E4DF] shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#E0E4DF]">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-[#D8ECE0] text-[#1B4D3E] flex items-center justify-center">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="m3-title-large font-bold text-[#191C1A]">Agronomic Risk Thresholds</h3>
            <p className="m3-body-medium text-xs text-[#717973]">
              Comparing 16-day Open-Meteo &amp; Sentinel-2 live forecast against safety limits for {cropType.toUpperCase()}
            </p>
          </div>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-[#F0F4EF] text-[#414943] font-semibold self-start sm:self-center">
          Explainable Rules Engine
        </span>
      </div>

      {/* Comparison Grid (3 Rows) */}
      <div className="space-y-4">
        {/* 1. Rainfall / Flood Threshold */}
        <div className={`p-4 rounded-2xl border transition-all ${isRainBreached ? "bg-[#FFDAD6]/40 border-[#BA1A1A]/30" : "bg-[#F0F4EF]/50 border-[#E0E4DF]"}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="m3-title-medium font-bold text-[#191C1A]">3-Day Cumulative Rainfall</span>
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
              <p className="m3-body-medium text-xs text-[#717973] mt-0.5">
                Root saturation &amp; flooding trigger threshold: <strong>≥ {RAIN_THRESHOLD.toFixed(1)} mm</strong>
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className={`text-base font-extrabold ${isRainBreached ? "text-[#BA1A1A]" : "text-[#1B4D3E]"}`}>
                {peak3DayRain.toFixed(1)} mm
              </span>
              <span className="text-xs text-[#717973] block">
                {isRainBreached ? `Impact in ~${floodEvent?.days_to_impact ?? peakRainDay}d` : "Peak forecast safe"}
              </span>
            </div>
          </div>

          {/* Comparative Progress Bar */}
          <div className="w-full bg-[#E0E4DF] h-2.5 rounded-full overflow-hidden relative">
            <div
              className={`h-full transition-all duration-500 ${isRainBreached ? "bg-[#BA1A1A]" : "bg-[#1B4D3E]"}`}
              style={{ width: `${Math.min(100, (peak3DayRain / (RAIN_THRESHOLD * 1.5)) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-[#717973] mt-1">
            <span>0 mm</span>
            <span className="font-bold text-[#8B5000]">Threshold: {RAIN_THRESHOLD} mm</span>
            <span>60+ mm</span>
          </div>
        </div>

        {/* 2. Temperature / Heatwave Threshold */}
        <div className={`p-4 rounded-2xl border transition-all ${isTempBreached ? "bg-[#FFDAD6]/40 border-[#BA1A1A]/30" : "bg-[#F0F4EF]/50 border-[#E0E4DF]"}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="m3-title-medium font-bold text-[#191C1A]">Peak Daytime Temperature</span>
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
              <p className="m3-body-medium text-xs text-[#717973] mt-0.5">
                Pollen sterility &amp; blossom drop threshold: <strong>≥ {TEMP_THRESHOLD.toFixed(1)} °C</strong>
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className={`text-base font-extrabold ${isTempBreached ? "text-[#BA1A1A]" : "text-[#1B4D3E]"}`}>
                {peakTemp.toFixed(1)} °C
              </span>
              <span className="text-xs text-[#717973] block">
                {isTempBreached ? `Heatwave in ~${heatEvent?.days_to_impact ?? peakTempDay}d` : "Within growing range"}
              </span>
            </div>
          </div>

          {/* Comparative Progress Bar */}
          <div className="w-full bg-[#E0E4DF] h-2.5 rounded-full overflow-hidden relative">
            <div
              className={`h-full transition-all duration-500 ${isTempBreached ? "bg-[#BA1A1A]" : "bg-[#1B4D3E]"}`}
              style={{ width: `${Math.min(100, (peakTemp / 45.0) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-[#717973] mt-1">
            <span>20 °C</span>
            <span className="font-bold text-[#8B5000]">Threshold: {TEMP_THRESHOLD} °C</span>
            <span>45 °C</span>
          </div>
        </div>

        {/* 3. Sentinel-2 NDVI Canopy Trend Threshold */}
        <div className={`p-4 rounded-2xl border transition-all ${isNdviBreached ? "bg-[#FFDAD6]/40 border-[#BA1A1A]/30" : "bg-[#F0F4EF]/50 border-[#E0E4DF]"}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="m3-title-medium font-bold text-[#191C1A]">Sentinel-2 14-Day Canopy Trend</span>
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
              <p className="m3-body-medium text-xs text-[#717973] mt-0.5">
                Vegetative chlorosis &amp; pest vector alert threshold: <strong>delta ≤ {NDVI_THRESHOLD.toFixed(2)}</strong>
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className={`text-base font-extrabold ${isNdviBreached ? "text-[#BA1A1A]" : "text-[#1B4D3E]"}`}>
                {ndviDelta > 0 ? `+${ndviDelta.toFixed(3)}` : ndviDelta.toFixed(3)}
              </span>
              <span className="text-xs text-[#717973] block">
                {isNdviBreached ? "Immediate field scouting advised" : "Healthy leaf chlorophyll"}
              </span>
            </div>
          </div>

          {/* Comparative Progress Bar */}
          <div className="w-full bg-[#E0E4DF] h-2.5 rounded-full overflow-hidden relative">
            <div
              className={`h-full transition-all duration-500 ${isNdviBreached ? "bg-[#BA1A1A]" : "bg-[#1B4D3E]"}`}
              style={{ width: `${Math.min(100, Math.max(10, ((ndviDelta + 0.2) / 0.4) * 100))}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-[#717973] mt-1">
            <span>-0.20 (Severe)</span>
            <span className="font-bold text-[#8B5000]">Threshold: {NDVI_THRESHOLD}</span>
            <span>+0.20 (Vigorous)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThresholdComparisonCard;
