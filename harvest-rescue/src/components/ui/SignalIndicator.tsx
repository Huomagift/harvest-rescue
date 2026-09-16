import React from "react";
import { CloudRain, Thermometer, Satellite, TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface SignalIndicatorProps {
  type: "rainfall" | "temperature" | "ndvi";
  value: string | number;
  unit?: string;
  subtitle?: string;
  trendDelta?: number;
  status?: "normal" | "warning" | "alert";
  className?: string;
}

export const SignalIndicator: React.FC<SignalIndicatorProps> = ({
  type,
  value,
  unit,
  subtitle,
  trendDelta,
  status = "normal",
  className = "",
}) => {
  let title = "";
  let iconNode = null;

  switch (type) {
    case "rainfall":
      title = "Precipitation";
      iconNode = <CloudRain className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      break;
    case "temperature":
      title = "Max Heat Index";
      iconNode = <Thermometer className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      break;
    case "ndvi":
      title = "Satellite NDVI";
      iconNode = <Satellite className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      break;
  }

  let statusBg = "bg-[#F0F4EF] border-[#E0E4DF]";
  let statusBadge = "bg-[#D8ECE0] text-[#052119]";

  if (status === "alert") {
    statusBg = "bg-[#FFDAD6]/60 border-[#FFB4AB]";
    statusBadge = "bg-[#BA1A1A] text-white";
  } else if (status === "warning") {
    statusBg = "bg-[#FFDCC2]/60 border-[#FFB68F]";
    statusBadge = "bg-[#8B5000] text-white";
  }

  let trendIcon = null;
  if (type === "ndvi" && trendDelta !== undefined) {
    if (trendDelta < 0) {
      trendIcon = (
        <span className="inline-flex items-center text-xs text-[#BA1A1A] font-semibold gap-0.5">
          <TrendingDown className="w-3.5 h-3.5" />
          {trendDelta.toFixed(2)} (14d)
        </span>
      );
    } else if (trendDelta > 0) {
      trendIcon = (
        <span className="inline-flex items-center text-xs text-[#1B4D3E] font-semibold gap-0.5">
          <TrendingUp className="w-3.5 h-3.5" />
          +{trendDelta.toFixed(2)} (14d)
        </span>
      );
    } else {
      trendIcon = (
        <span className="inline-flex items-center text-xs text-[#717973] gap-0.5">
          <Minus className="w-3.5 h-3.5" />
          Stable
        </span>
      );
    }
  }

  return (
    <div
      className={`p-4 rounded-2xl border transition-all duration-200 shadow-sm ${statusBg} ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-white/80 shadow-xs">{iconNode}</div>
          <span className="m3-label-medium text-[#414943] uppercase tracking-wider">{title}</span>
        </div>
        {status !== "normal" && (
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${statusBadge}`}>
            {status}
          </span>
        )}
      </div>

      <div className="flex items-baseline justify-between mt-1">
        <div className="flex items-baseline gap-1">
          <span className="m3-headline-medium text-[#191C1A]">{value}</span>
          {unit && <span className="m3-body-medium text-[#414943]">{unit}</span>}
        </div>
        {trendIcon}
      </div>

      {subtitle && (
        <p className="m3-label-medium text-[#717973] mt-2 truncate" title={subtitle}>
          {subtitle}
        </p>
      )}
    </div>
  );
};
