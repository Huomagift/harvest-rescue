import React from "react";
import { AlertTriangle, ShieldCheck, AlertOctagon, Info } from "lucide-react";
import { RiskSeverity } from "@/lib/types";
import { getSeverityTheme } from "@/lib/risk-utils";

export interface RiskSeverityBadgeProps {
  severity?: RiskSeverity | null;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
  customLabel?: string;
  className?: string;
}

export const RiskSeverityBadge: React.FC<RiskSeverityBadgeProps> = ({
  severity = "low",
  showIcon = true,
  size = "md",
  customLabel,
  className = "",
}) => {
  const theme = getSeverityTheme(severity);

  let iconNode = null;
  if (showIcon) {
    switch (severity) {
      case "high":
        iconNode = <AlertOctagon className="w-4 h-4 shrink-0" />;
        break;
      case "medium":
        iconNode = <AlertTriangle className="w-4 h-4 shrink-0" />;
        break;
      case "low":
      default:
        iconNode = <ShieldCheck className="w-4 h-4 shrink-0" />;
        break;
    }
  }

  let sizeClasses = "px-3 py-1 text-xs gap-1.5";
  if (size === "sm") {
    sizeClasses = "px-2 py-0.5 text-[11px] gap-1";
  } else if (size === "lg") {
    sizeClasses = "px-4 py-1.5 text-sm gap-2 font-semibold";
  }

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium transition-colors ${theme.bgClass} ${theme.textClass} border ${theme.borderClass} ${sizeClasses} ${className}`}
    >
      {iconNode}
      <span className="capitalize">{customLabel || theme.label}</span>
    </span>
  );
};
