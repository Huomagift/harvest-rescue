import React, { useState, useEffect } from "react";
import {
  RefreshCw,
  Clock,
  AlertOctagon,
  ShieldCheck,
  AlertTriangle,
  FileText,
  MapPin,
  Calendar,
  Sprout,
  User,
  PlusCircle,
  AlertCircle,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { Farm, RiskEvent, RiskSeverity } from "@/lib/types";
import { api } from "@/lib/api";
import {
  getHighestSeverity,
  getSeverityTheme,
  getRiskRecommendations,
  isDataStale,
  extractSignalIndicators,
} from "@/lib/risk-utils";
import { RiskSeverityBadge } from "../ui/RiskSeverityBadge";
import { SignalIndicator } from "../ui/SignalIndicator";
import { Button } from "../ui/Button";
import { FarmerReportModal } from "../ui/FarmerReportModal";

export interface FarmDashboardViewProps {
  farm: Farm;
  onNavigateToSetup: () => void;
}

export const FarmDashboardView: React.FC<FarmDashboardViewProps> = ({
  farm,
  onNavigateToSetup,
}) => {
  const [riskEvents, setRiskEvents] = useState<RiskEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);

  // Fetch initial latest risk events on farm mount
  const fetchRiskEvents = async (farmId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const events = await api.getLatestRisk(farmId);
      setRiskEvents(events);
    } catch (err: any) {
      setError(err.message || "Unable to reach Harvest Rescue API server.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (farm?.id) {
      fetchRiskEvents(farm.id);
    }
  }, [farm?.id]);

  // Trigger fresh risk evaluation over HTTP POST /risk/{farm_id}/evaluate
  const handleRecheckRisk = async () => {
    if (!farm?.id) return;
    setIsEvaluating(true);
    setError(null);
    try {
      const freshEvents = await api.evaluateRisk(farm.id);
      setRiskEvents(freshEvents);
    } catch (err: any) {
      setError(err.message || "Failed to complete risk evaluation scan.");
    } finally {
      setIsEvaluating(false);
    }
  };

  // Operational State 1: API Error State
  if (error && !isLoading && riskEvents.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="p-8 rounded-3xl bg-[#FFDAD6] border border-[#FFB4AB] text-[#410E0B] space-y-4 text-center max-w-lg mx-auto shadow-md">
          <div className="w-12 h-12 rounded-full bg-[#BA1A1A] text-white flex items-center justify-center mx-auto">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <h3 className="m3-title-large font-bold">API Connection Error</h3>
          <p className="m3-body-medium text-[#410E0B]/90">{error}</p>
          <div className="pt-2 flex justify-center gap-3">
            <Button
              variant="error"
              onClick={() => fetchRiskEvents(farm.id)}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Retry API Request
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Operational State 2: Loading State
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-pulse">
        {/* Farm Header Skeleton */}
        <div className="h-24 bg-[#E0E4DF] rounded-3xl" />
        {/* Risk Banner Skeleton */}
        <div className="h-32 bg-[#E0E4DF] rounded-3xl" />
        {/* Indicators Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="h-32 bg-[#E0E4DF] rounded-2xl" />
          <div className="h-32 bg-[#E0E4DF] rounded-2xl" />
          <div className="h-32 bg-[#E0E4DF] rounded-2xl" />
        </div>
      </div>
    );
  }

  // Operational State 3: Empty State (Never evaluated)
  const isNeverEvaluated = riskEvents.length === 0 && !isLoading && !error;

  const highestSeverity: RiskSeverity = getHighestSeverity(riskEvents);
  const theme = getSeverityTheme(highestSeverity);
  const recommendations = getRiskRecommendations(riskEvents);
  const signals = extractSignalIndicators(riskEvents);

  const lastEvent = riskEvents[0];
  const lastUpdatedText = lastEvent
    ? new Date(lastEvent.created_at).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Never";

  const dataStale = isDataStale(lastEvent?.created_at);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Inline Error Toast (if evaluation re-check fails while showing cached data) */}
      {error && (
        <div className="p-4 rounded-2xl bg-[#FFDAD6] border border-[#FFB4AB] text-[#410E0B] text-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-xs font-bold underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Operational State 4: Data Stale Banner (> 24h old) */}
      {dataStale && !isNeverEvaluated && (
        <div className="p-4 rounded-2xl bg-[#FFDCC2] border border-[#FFB68F] text-[#341200] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-[#8B5000] shrink-0" />
            <div>
              <p className="m3-label-large font-bold">Data is stale (Older than 24h)</p>
              <p className="m3-body-medium">
                Last risk analysis was conducted on {lastUpdatedText}. Weather patterns may have shifted.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="tonal"
            onClick={handleRecheckRisk}
            isLoading={isEvaluating}
            leftIcon={<RefreshCw className="w-4 h-4" />}
            className="shrink-0 bg-white"
          >
            Update Analysis Now
          </Button>
        </div>
      )}

      {/* Single-Farm Header Card */}
      <div className="p-6 rounded-3xl bg-[#F0F4EF] border border-[#E0E4DF] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="m3-label-medium uppercase text-[#1B4D3E] font-bold tracking-wider">
              {farm.crop_type} Farm
            </span>
            {farm.owner_name && (
              <span className="m3-label-medium text-[#717973]">
                • Owner: {farm.owner_name}
              </span>
            )}
          </div>
          <h1 className="m3-headline-large text-[#191C1A] font-extrabold">{farm.name}</h1>
          <div className="flex flex-wrap items-center gap-3 text-[#414943] m3-body-medium">
            <span className="inline-flex items-center gap-1 text-xs">
              <MapPin className="w-3.5 h-3.5 text-[#1B4D3E]" />
              {farm.latitude.toFixed(4)}, {farm.longitude.toFixed(4)}
            </span>
            {farm.planting_date && (
              <span className="inline-flex items-center gap-1 text-xs">
                <Calendar className="w-3.5 h-3.5 text-[#1B4D3E]" />
                Planted: {farm.planting_date}
              </span>
            )}
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="tonal"
            size="sm"
            onClick={() => setIsReportModalOpen(true)}
            leftIcon={<FileText className="w-4 h-4" />}
          >
            Report Observation
          </Button>

          <Button
            variant="filled"
            size="sm"
            onClick={handleRecheckRisk}
            isLoading={isEvaluating}
            leftIcon={<RefreshCw className={`w-4 h-4 ${isEvaluating ? "animate-spin" : ""}`} />}
          >
            Re-check Risk
          </Button>
        </div>
      </div>

      {/* Main Risk State Banner (Driven dynamically by backend state: Normal vs High Risk) */}
      <div
        className={`p-6 sm:p-8 rounded-3xl border transition-all duration-300 shadow-sm ${theme.bannerBg} ${theme.bannerBorder} ${theme.bannerText}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-current/10">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${theme.badgeBg} ${theme.badgeText}`}
            >
              {highestSeverity === "high" ? (
                <AlertOctagon className="w-6 h-6" />
              ) : highestSeverity === "medium" ? (
                <AlertTriangle className="w-6 h-6" />
              ) : (
                <ShieldCheck className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="m3-title-large font-bold">
                  {highestSeverity === "high"
                    ? "Severe Agronomic Risk Triggered"
                    : highestSeverity === "medium"
                    ? "Moderate Risk Advisory"
                    : "Normal / Low Risk Standing"}
                </h2>
              </div>
              <p className="m3-body-medium opacity-90 mt-0.5">
                {highestSeverity === "high"
                  ? "Live weather and satellite imagery indicate imminent crop stress. Take immediate protective action below."
                  : highestSeverity === "medium"
                  ? "Signals show elevated heat or precipitation parameters exceeding standard baseline."
                  : "All weather and satellite NDVI canopy signals are operating within healthy crop thresholds."}
              </p>
            </div>
          </div>

          <RiskSeverityBadge severity={highestSeverity} size="lg" className="self-start sm:self-center" />
        </div>

        {/* Active Risk Event Breakdown */}
        {riskEvents.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="m3-label-medium uppercase tracking-wider font-semibold opacity-80">
              Active Risk Drivers ({riskEvents.length})
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {riskEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-3 rounded-2xl bg-white/70 backdrop-blur-xs border border-current/10 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Sprout className="w-4 h-4 text-[#1B4D3E]" />
                    <span className="m3-title-medium capitalize font-semibold">
                      {evt.risk_type.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {evt.days_to_impact && (
                      <span className="m3-label-medium text-xs opacity-75">
                        Impact: ~{evt.days_to_impact}d
                      </span>
                    )}
                    <RiskSeverityBadge severity={evt.severity} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-current/10 flex items-center justify-between text-xs opacity-75">
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Last evaluated: {lastUpdatedText}
          </span>
          <span className="font-semibold">FastAPI Live Signal Engine</span>
        </div>
      </div>

      {/* Empty State Banner (if never evaluated) */}
      {isNeverEvaluated && (
        <div className="p-8 rounded-3xl bg-[#F0F4EF] border border-[#E0E4DF] text-center space-y-3">
          <Sparkles className="w-8 h-8 text-[#1B4D3E] mx-auto" />
          <h3 className="m3-title-large text-[#191C1A]">No Risk Scan Performed Yet</h3>
          <p className="m3-body-medium text-[#414943] max-w-md mx-auto">
            Click "Re-check Risk" to run the first live satellite and weather analysis for this farm.
          </p>
          <Button
            variant="filled"
            onClick={handleRecheckRisk}
            isLoading={isEvaluating}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Run First Analysis
          </Button>
        </div>
      )}

      {/* Contributing Signals Grid (3 compact indicators) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="m3-title-large text-[#191C1A]">Contributing Signals</h3>
          <span className="m3-label-medium text-[#717973]">Real-Time Data Feed</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SignalIndicator
            type="rainfall"
            value={signals.rainfall.value}
            unit={signals.rainfall.unit}
            subtitle={signals.rainfall.trend}
            status={signals.rainfall.status}
          />
          <SignalIndicator
            type="temperature"
            value={signals.temp.value}
            unit={signals.temp.unit}
            subtitle={signals.temp.trend}
            status={signals.temp.status}
          />
          <SignalIndicator
            type="ndvi"
            value={signals.ndvi.value}
            unit="Index"
            trendDelta={signals.ndvi.delta}
            subtitle="Sentinel-2 Crop Canopy"
            status={signals.ndvi.status}
          />
        </div>
      </div>

      {/* Recommended Next Steps Section (Driven by risk event type) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="m3-title-large text-[#191C1A]">Recommended Next Steps</h3>
          <span className="m3-label-medium text-[#1B4D3E] font-semibold">
            Driven by {riskEvents.length} Active Events
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className={`p-5 rounded-3xl border transition-all duration-200 shadow-xs space-y-3 flex flex-col justify-between ${
                rec.urgency === "immediate"
                  ? "bg-white border-[#BA1A1A]/30 hover:border-[#BA1A1A]"
                  : "bg-white border-[#E0E4DF] hover:border-[#1B4D3E]"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`m3-label-medium text-xs uppercase px-2.5 py-0.5 rounded-full font-bold ${
                      rec.urgency === "immediate"
                        ? "bg-[#FFDAD6] text-[#410E0B]"
                        : "bg-[#D8ECE0] text-[#052119]"
                    }`}
                  >
                    {rec.urgency} Action
                  </span>
                  <span className="m3-label-medium text-[#717973] capitalize">
                    {rec.riskType.replace("_", " ")}
                  </span>
                </div>
                <h4 className="m3-title-medium text-[#191C1A] font-bold">{rec.title}</h4>
                <p className="m3-body-medium text-[#414943] leading-relaxed">
                  {rec.description}
                </p>
              </div>

              <div className="pt-2 border-t border-[#E0E4DF] flex items-center justify-between">
                <span className="m3-label-medium text-[#1B4D3E] font-semibold">
                  Agronomic Protocol #82
                </span>
                <Button
                  variant="text"
                  size="sm"
                  onClick={() => setIsReportModalOpen(true)}
                  rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                >
                  {rec.actionText}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Farmer Report Modal */}
      <FarmerReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        farmId={farm.id}
        farmName={farm.name}
        onReportSubmitted={() => fetchRiskEvents(farm.id)}
      />
    </div>
  );
};
