"use client";

import React from "react";
import { CloudRain, Thermometer, Sprout, Droplets, Wind, TrendingUp, TrendingDown, Minus, Info } from "lucide-react";

export interface SignalIndicatorProps {
  type: "rainfall" | "soil_moisture" | "crop_condition" | "temperature" | "humidity" | string;
  value: string | number;
  forecastValue?: string | number;
  unit?: string;
  subtitle?: string;
  thresholdLabel?: string;
  trendDelta?: number;
  trendDirection?: string;
  status?: "optimal" | "normal" | "caution" | "warning" | "alert";
  series15d?: number[];
  whyItMatters?: string;
  className?: string;
}

export const SignalIndicator: React.FC<SignalIndicatorProps> = ({
  type,
  value,
  forecastValue,
  unit,
  subtitle,
  thresholdLabel,
  trendDelta,
  trendDirection,
  status = "normal",
  series15d,
  whyItMatters,
  className = "",
}) => {
  let title = "Environmental Signal";
  let iconNode = <Sprout className="w-5 h-5 text-emerald-700" />;

  switch (type) {
    case "rainfall":
      title = "Precipitation";
      iconNode = <CloudRain className="w-5 h-5 text-blue-600" />;
      break;
    case "soil_moisture":
      title = "Soil Moisture";
      iconNode = <Droplets className="w-5 h-5 text-cyan-600" />;
      break;
    case "crop_condition":
    case "ndvi":
      title = "Crop Canopy Health";
      iconNode = <Sprout className="w-5 h-5 text-emerald-600" />;
      break;
    case "temperature":
      title = "Field Temperature";
      iconNode = <Thermometer className="w-5 h-5 text-amber-600" />;
      break;
    case "humidity":
      title = "Relative Humidity";
      iconNode = <Wind className="w-5 h-5 text-teal-600" />;
      break;
  }

  let statusBg = "bg-[#F0F4EF] border-[#E0E4DF]";
  let statusBadge = "bg-[#D8ECE0] text-[#052119]";

  if (status === "warning" || status === "alert") {
    statusBg = "bg-[#FFDAD6]/60 border-[#FFB4AB]";
    statusBadge = "bg-[#BA1A1A] text-white";
  } else if (status === "caution") {
    statusBg = "bg-[#FFDCC2]/60 border-[#FFB68F]";
    statusBadge = "bg-[#8B5000] text-white";
  }

  // Calculate mini-bar heights if series15d is provided
  let normalizedBars: number[] = [];
  if (series15d && series15d.length > 0) {
    const min = Math.min(...series15d);
    const max = Math.max(...series15d);
    const range = max - min || 1;
    normalizedBars = series15d.map((v) => Math.max(15, Math.round(((v - min) / range) * 85)));
  }

  let trendIcon = null;
  if (trendDelta !== undefined) {
    if (trendDelta < 0) {
      trendIcon = (
        <span className="inline-flex items-center text-xs text-[#BA1A1A] font-bold gap-0.5">
          <TrendingDown className="w-3.5 h-3.5" />
          {trendDelta.toFixed(2)}
        </span>
      );
    } else if (trendDelta > 0) {
      trendIcon = (
        <span className="inline-flex items-center text-xs text-[#1B4D3E] font-bold gap-0.5">
          <TrendingUp className="w-3.5 h-3.5" />
          +{trendDelta.toFixed(2)}
        </span>
      );
    }
  } else if (trendDirection) {
    const isUp = trendDirection.toLowerCase() === "increasing" || trendDirection.toLowerCase() === "improving" || trendDirection.toLowerCase() === "elevated";
    const isDown = trendDirection.toLowerCase() === "declining";
    trendIcon = (
      <span
        className={`inline-flex items-center text-xs font-bold gap-0.5 ${
          isDown ? "text-[#BA1A1A]" : isUp ? "text-[#1B4D3E]" : "text-[#717973]"
        }`}
      >
        {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : isDown ? <TrendingDown className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
        {trendDirection}
      </span>
    );
  }

  return (
    <div
      className={`p-4 rounded-3xl border transition-all duration-200 shadow-xs flex flex-col justify-between ${statusBg} ${className}`}
    >
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-white shadow-xs">{iconNode}</div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#414943]">{title}</span>
          </div>
          {status !== "optimal" && status !== "normal" && (
            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${statusBadge}`}>
              {status}
            </span>
          )}
        </div>

        <div className="flex items-baseline justify-between mt-1">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-[#191C1A]">{value}</span>
            {unit && <span className="text-xs font-semibold text-[#414943]">{unit}</span>}
          </div>
          {trendIcon}
        </div>

        {/* Threshold reference badge */}
        {thresholdLabel && (
          <div className="mt-1 text-[11px] font-semibold text-[#414943]">
            <span className="opacity-75">Reference: </span>
            <strong className="text-[#191C1A]">{thresholdLabel}</strong>
          </div>
        )}

        {subtitle && (
          <p className="text-xs text-[#717973] font-medium mt-1 truncate" title={subtitle}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Why it matters explanation */}
      {whyItMatters && (
        <div className="mt-2.5 pt-2 border-t border-black/5 text-[11px] text-[#414943] leading-relaxed flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 text-[#1B4D3E] shrink-0 mt-0.5" />
          <span>{whyItMatters}</span>
        </div>
      )}

      {/* 15-Day Coherent Progression Mini Sparkline */}
      {normalizedBars.length > 0 && (
        <div className="mt-3 pt-2 border-t border-black/5">
          <div className="flex items-center justify-between text-[10px] text-[#717973] mb-1 font-semibold">
            <span>Past 7d Actuals</span>
            <span className="font-bold text-[#1B4D3E]">Today</span>
            <span>Next 7d Forecast</span>
          </div>
          <div className="flex items-end gap-1 h-7 w-full">
            {normalizedBars.map((heightPercent, idx) => {
              const isToday = idx === 7 || idx === Math.floor(normalizedBars.length / 2);
              return (
                <div
                  key={idx}
                  className="flex-1 rounded-xs transition-all duration-300 relative group"
                  style={{
                    height: `${heightPercent}%`,
                    backgroundColor: isToday
                      ? status === "warning" || status === "alert"
                        ? "#BA1A1A"
                        : "#1B4D3E"
                      : idx < 7
                      ? "#717973"
                      : "#A0A8A2",
                    opacity: isToday ? 1 : 0.7,
                  }}
                  title={`Day ${idx + 1}: ${series15d?.[idx]}`}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SignalIndicator;
