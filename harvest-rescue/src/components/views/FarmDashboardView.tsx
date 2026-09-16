import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
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
  AlertCircle,
  ExternalLink,
  Sparkles,
  Radio,
  Trash2,
} from "lucide-react";
import { Farm, RiskEvent, RiskSeverity, SignalResponse } from "@/lib/types";
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
import { SkeletonCard } from "../ui/SkeletonCard";
import { ThresholdComparisonCard } from "../ui/ThresholdComparisonCard";

// Client-only dynamic import of Leaflet FarmMap (prevents SSR window errors)
const FarmMap = dynamic(() => import("../ui/FarmMap"), { ssr: false });

export interface FarmDashboardViewProps {
  farm: Farm;
  onNavigateToSetup: () => void;
  onDeleteFarm?: (farmId: string) => void;
}

export const FarmDashboardView: React.FC<FarmDashboardViewProps> = ({
  farm,
  onNavigateToSetup,
  onDeleteFarm,
}) => {
  const [riskEvents, setRiskEvents] = useState<RiskEvent[]>([]);
  const [signalsData, setSignalsData] = useState<SignalResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);

  // Fetch latest risk events and raw signals on farm mount or change
  const fetchRiskData = async (farmId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      let [events, signals] = await Promise.all([
        api.getLatestRisk(farmId).catch(() => []),
        api.getSignals(farmId).catch(() => null),
      ]);

      // If no events found yet (e.g. first time viewing demo farm), auto-trigger scan
      if (events.length === 0) {
        events = await api.evaluateRisk(farmId).catch(() => []);
        signals = await api.getSignals(farmId).catch(() => null);
      }

      setRiskEvents(events);
      if (signals) setSignalsData(signals);
    } catch (err: any) {
      console.warn("Could not fetch risk data:", err);
      // For demo farms, provide immediate fallback
      if (farm?.is_demo) {
        setRiskEvents([]);
      } else {
        setError(err.message || "Unable to reach Harvest Rescue API server.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (farm?.id) {
      fetchRiskData(farm.id);
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
      const freshSignals = await api.getSignals(farm.id).catch(() => null);
      if (freshSignals) setSignalsData(freshSignals);
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
              onClick={() => fetchRiskData(farm.id)}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Retry API Request
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Operational State 2: Loading State (Matching user's requested feed skeleton card pattern)
  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-2 text-sm text-[#717973] font-semibold">
          <Sprout className="w-4 h-4 text-[#1B4D3E] animate-spin" />
          <span>Ingesting 16-day Open-Meteo weather &amp; Sentinel-2 GEE satellite feed...</span>
        </div>
        <SkeletonCard count={3} />
      </div>
    );
  }


  const isNeverEvaluated = riskEvents.length === 0 && !isLoading && !error;
  const highestSeverity: RiskSeverity = getHighestSeverity(riskEvents);
  const theme = getSeverityTheme(highestSeverity);
  const recommendations = getRiskRecommendations(riskEvents);
  const signals = extractSignalIndicators(riskEvents);

  const lastEvent = riskEvents[0];
  const lastMonitoredDate = farm.last_monitored_at || signalsData?.last_monitored_at || lastEvent?.created_at;
  const lastUpdatedText = lastMonitoredDate
    ? new Date(lastMonitoredDate).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Not monitored yet";

  const dataStale = isDataStale(lastMonitoredDate);

  // Extract earliest days_to_impact across active events
  const activeImpactEvent = riskEvents.find(
    (e) => e.days_to_impact !== null && e.days_to_impact !== undefined
  );
  const impactDays = activeImpactEvent?.days_to_impact;

  // Source labels
  const weatherSource = signalsData?.weather?.source || "live_open_meteo";
  const ndviSource = signalsData?.ndvi?.source || "live_gee";
  const isLiveFeed = weatherSource.startsWith("live") || ndviSource.startsWith("live");

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Toast Error Banner */}
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

      {/* Prominent High Severity Alert Top Banner */}
      {highestSeverity === "high" && activeImpactEvent && (
        <div className="p-4 sm:p-5 rounded-3xl bg-[#FFDAD6] border-2 border-[#BA1A1A] text-[#410E0B] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#BA1A1A] text-white flex items-center justify-center shrink-0">
              <AlertOctagon className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#BA1A1A] text-white text-xs font-extrabold uppercase tracking-wider">
                  Imminent Risk Alert
                </span>
                <span className="text-xs font-bold opacity-80">
                  {farm.name}
                </span>
              </div>
              <h3 className="m3-title-large font-black mt-0.5 text-[#410E0B]">
                {activeImpactEvent.risk_type.replace("_", " ").toUpperCase()} RISK IN{" "}
                {impactDays === 0 ? "TODAY" : `${impactDays} DAYS`}
              </h3>
              <p className="m3-body-medium text-xs opacity-90">
                1-2 week advance warning scanner flagged threshold breach. Immediate protective protocol required.
              </p>
            </div>
          </div>
          <RiskSeverityBadge severity="high" size="lg" className="shrink-0" />
        </div>
      )}

      {/* Data Stale Banner (> 24h old) */}
      {dataStale && !isNeverEvaluated && (
        <div className="p-4 rounded-2xl bg-[#FFDCC2] border border-[#FFB68F] text-[#341200] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-[#8B5000] shrink-0" />
            <div>
              <p className="m3-label-large font-bold">Continuous Monitor Status: Stale (&gt;24h)</p>
              <p className="m3-body-medium text-xs">
                Last monitoring sweep occurred on {lastUpdatedText}.
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
            Run Sweep Now
          </Button>
        </div>
      )}

      {/* Single-Farm Header Card & Map Widget Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Farm Header & Info */}
        <div className="md:col-span-2 p-6 rounded-3xl bg-[#F0F4EF] border border-[#E0E4DF] flex flex-col justify-between space-y-4 shadow-xs">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="m3-label-medium uppercase text-[#1B4D3E] font-bold tracking-wider">
                  {farm.crop_type} Farm
                </span>
                {farm.is_demo && (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#1B4D3E] text-white text-[10px] font-extrabold uppercase tracking-wider">
                    Demo Benchmark
                  </span>
                )}
              </div>
              {/* Data Source Status Badge */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-[#E0E4DF] text-xs font-semibold text-[#414943]">
                <Radio className={`w-3.5 h-3.5 ${isLiveFeed ? "text-[#1B4D3E] animate-pulse" : "text-[#8B5000]"}`} />
                <span>
                  Source: {isLiveFeed ? "Live Open-Meteo & Sentinel-2" : "Fallback Mock Data"}
                </span>
              </div>
            </div>

            <h1 className="m3-headline-large text-[#191C1A] font-extrabold">{farm.name}</h1>
            
            <div className="flex flex-wrap items-center gap-3 text-[#414943] m3-body-medium">
              {farm.owner_name && (
                <span className="text-xs font-medium">Farmer: {farm.owner_name}</span>
              )}
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
              {farm.elevation !== undefined && farm.elevation !== null && (
                <span className="inline-flex items-center gap-1 text-xs bg-white px-2 py-0.5 rounded-md border border-[#E0E4DF]">
                  Elevation: <strong>{Math.round(farm.elevation)}m</strong>
                </span>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-[#E0E4DF] flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-[#717973] inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#1B4D3E]" />
              <span>Last Monitored: <strong className="text-[#191C1A]">{lastUpdatedText}</strong></span>
            </div>

            <div className="flex items-center gap-2">
              {!farm.is_demo && onDeleteFarm && (
                <Button
                  variant="outlined"
                  size="sm"
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete ${farm.name}? This will remove all alerts and risk history.`)) {
                      onDeleteFarm(farm.id);
                    }
                  }}
                  leftIcon={<Trash2 className="w-4 h-4 text-[#BA1A1A]" />}
                  className="text-[#BA1A1A] border-[#FFB4AB] hover:bg-[#FFDAD6]"
                >
                  Delete Farm
                </Button>
              )}
              <Button
                variant="tonal"
                size="sm"
                onClick={() => setIsReportModalOpen(true)}
                leftIcon={<FileText className="w-4 h-4" />}
              >
                Report Note
              </Button>
              <Button
                variant="filled"
                size="sm"
                onClick={handleRecheckRisk}
                isLoading={isEvaluating}
                leftIcon={<RefreshCw className={`w-4 h-4 ${isEvaluating ? "animate-spin" : ""}`} />}
              >
                Evaluate
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column: Leaflet Map Widget */}
        <div className="md:col-span-1">
          <FarmMap
            latitude={farm.latitude}
            longitude={farm.longitude}
            farmName={farm.name}
            cropType={farm.crop_type}
            severity={highestSeverity}
          />
        </div>
      </div>

      {/* Main Risk State Banner with Advance Warning Prominently Displayed */}
      <div
        className={`p-6 sm:p-8 rounded-3xl border transition-all duration-300 shadow-sm ${theme.bannerBg} ${theme.bannerBorder} ${theme.bannerText}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-current/10">
          <div className="flex items-center gap-3.5">
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
                    ? "Severe Agronomic Threat Ahead"
                    : highestSeverity === "medium"
                    ? "Moderate Risk Advisory"
                    : "Normal / Low Risk Standing"}
                </h2>
              </div>
              <p className="m3-body-medium opacity-90 mt-0.5">
                {highestSeverity === "high"
                  ? "Continuous 16-day horizon scanning indicates imminent weather impact. Review preventive steps below."
                  : highestSeverity === "medium"
                  ? "Forecasted 16-day signals show elevated temperature or precipitation parameters crossing warning bounds."
                  : "All Open-Meteo weather and Sentinel-2 satellite canopy signals are within optimal growing thresholds."}
              </p>
            </div>
          </div>

          <RiskSeverityBadge severity={highestSeverity} size="lg" className="self-start sm:self-center" />
        </div>

        {/* Active Risk Event Breakdown with Advance Warning Prominently Highlighted */}
        {riskEvents.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="m3-label-medium uppercase tracking-wider font-semibold opacity-80">
              Active Advance Warning Risk Drivers ({riskEvents.length})
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {riskEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-3.5 rounded-2xl bg-white/80 backdrop-blur-xs border border-current/10 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <Sprout className="w-4 h-4 text-[#1B4D3E]" />
                    <div>
                      <span className="m3-title-medium capitalize font-bold block leading-tight">
                        {evt.risk_type.replace("_", " ")}
                      </span>
                      {evt.days_to_impact !== null && evt.days_to_impact !== undefined ? (
                        <span className="m3-label-medium text-xs text-[#8B5000] font-extrabold block">
                          Impact in ~{intOrZero(evt.days_to_impact)} day(s) ({evt.contributing_data?.impact_date || "Forecasted"})
                        </span>
                      ) : (
                        <span className="m3-label-medium text-xs opacity-75 block">
                          Current Standing Signal
                        </span>
                      )}
                    </div>
                  </div>
                  <RiskSeverityBadge severity={evt.severity} size="sm" />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-current/10 flex items-center justify-between text-xs opacity-75">
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Monitored: {lastUpdatedText}
          </span>
          <span className="font-semibold">FastAPI Continuous Monitoring Engine</span>
        </div>
      </div>

      {/* Agronomic Risk Thresholds Comparison Card */}
      <ThresholdComparisonCard
        riskEvents={riskEvents}
        signalsData={signalsData}
        cropType={farm.crop_type}
      />

      {/* Empty State Banner (if never evaluated) */}
      {isNeverEvaluated && (
        <div className="p-8 rounded-3xl bg-[#F0F4EF] border border-[#E0E4DF] text-center space-y-3">
          <Sparkles className="w-8 h-8 text-[#1B4D3E] mx-auto" />
          <h3 className="m3-title-large text-[#191C1A]">No Risk Scan Performed Yet</h3>
          <p className="m3-body-medium text-[#414943] max-w-md mx-auto">
            Click "Evaluate" to scan the 16-day forecast horizon and Sentinel-2 imagery for this farm.
          </p>
          <Button
            variant="filled"
            onClick={handleRecheckRisk}
            isLoading={isEvaluating}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Run First 16-Day Horizon Scan
          </Button>
        </div>
      )}

      {/* Contributing Signals Grid (3 compact indicators) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="m3-title-large text-[#191C1A]">Contributing Signals (16-Day Feed)</h3>
          <span className="m3-label-medium text-[#717973]">Open-Meteo &amp; Sentinel-2 GEE</span>
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
          <h3 className="m3-title-large text-[#191C1A]">Recommended Agronomic Actions</h3>
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
        onReportSubmitted={() => fetchRiskData(farm.id)}
      />
    </div>
  );
};

function intOrZero(val: number | null | undefined): number {
  if (val === null || val === undefined) return 0;
  return Math.round(val);
}

