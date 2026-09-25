"use client";

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
  TrendingUp,
  TrendingDown,
  Minus,
  Mail,
  HelpCircle,
  CheckCircle2,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Shield,
  Activity,
  Layers,
  Leaf,
} from "lucide-react";
import { Farm, RiskEvent, RiskSeverity, SignalResponse, RiskOutlookDay } from "@/lib/types";
import { api } from "@/lib/api";
import {
  getHighestSeverity,
  getSeverityTheme,
} from "@/lib/risk-utils";
import { RiskSeverityBadge } from "../ui/RiskSeverityBadge";
import { SignalIndicator } from "../ui/SignalIndicator";
import { Button } from "../ui/Button";
import { FarmerReportModal } from "../ui/FarmerReportModal";
import { SkeletonCard } from "../ui/SkeletonCard";
import { ThresholdComparisonCard } from "../ui/ThresholdComparisonCard";

// Dynamic import of Leaflet FarmMap (prevents SSR window errors)
const FarmMap = dynamic(() => import("../ui/FarmMap"), { ssr: false });

export interface FarmDashboardViewProps {
  farm: Farm;
  onNavigateToSetup: () => void;
  onDeleteFarm?: (farmId: string) => void;
  onBackToOverview?: () => void;
}

export const FarmDashboardView: React.FC<FarmDashboardViewProps> = ({
  farm,
  onNavigateToSetup,
  onDeleteFarm,
  onBackToOverview,
}) => {
  const [riskEvents, setRiskEvents] = useState<RiskEvent[]>([]);
  const [signalsData, setSignalsData] = useState<SignalResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false);
  const [emailResult, setEmailResult] = useState<{
    success: boolean;
    recipient?: string;
    method?: string;
    message: string;
    subject?: string;
  } | null>(null);

  const fetchRiskData = async (farmId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      let [events, signals] = await Promise.all([
        api.getLatestRisk(farmId).catch(() => []),
        api.getSignals(farmId).catch(() => null),
      ]);

      if (events.length === 0) {
        events = await api.evaluateRisk(farmId).catch(() => []);
        signals = await api.getSignals(farmId).catch(() => null);
      }

      setRiskEvents(events);
      if (signals) setSignalsData(signals);
    } catch (err: any) {
      console.warn("Could not fetch risk data:", err);
      if (farm?.is_demo) {
        setRiskEvents([]);
      } else {
        setError(err.message || "Unable to reach Harvest Rescue intelligence service.");
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
      setError(err.message || "Failed to complete risk assessment.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!farm?.id) return;
    setIsSendingEmail(true);
    setEmailResult(null);
    try {
      const res = await api.sendTestEmail(farm.id);
      setEmailResult(res);
    } catch (err: any) {
      setEmailResult({
        success: false,
        method: "error",
        message: err.message || "Failed to trigger risk alert test email.",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-2.5 text-sm text-[#1B4D3E] font-semibold">
          <Sprout className="w-5 h-5 animate-spin" />
          <span>Querying environmental telemetry and crop condition for this location...</span>
        </div>
        <SkeletonCard count={3} />
      </div>
    );
  }

  // Derive intelligence details strictly from backend calculation
  const currentSeverity: RiskSeverity =
    signalsData?.current_severity || getHighestSeverity(riskEvents);
  const theme = getSeverityTheme(currentSeverity);
  const riskTrend = signalsData?.risk_trend || (currentSeverity === "high" ? "increasing" : "stable");
  const headline =
    signalsData?.headline ||
    (currentSeverity === "high"
      ? "Severe environmental hazard detected across forecast horizon"
      : currentSeverity === "medium"
      ? "Moderate risk advisory: Weather parameters approaching warning limits"
      : "Conditions stable: Environmental signals within optimal growing bounds");

  const cropStage = signalsData?.crop_stage || "Active Growth";
  const computedDaysPlanted = farm.planting_date
    ? Math.max(1, Math.floor((new Date().getTime() - new Date(farm.planting_date).getTime()) / (1000 * 60 * 60 * 24)))
    : null;
  const daysPlanted = signalsData?.days_since_planting ?? computedDaysPlanted;
  const agronomicStatusText =
    signalsData?.agronomic_status_text ||
    `Crop condition: Stable. ${farm.crop_type.toUpperCase()} is developing within normal seasonal parameters at this location.`;

  const whyFactors: string[] = signalsData?.why_factors || [
    "Continuous assessment indicates environmental parameters are balanced.",
    "Soil moisture levels remain within retention limits.",
    "Crop canopy vigor reflects healthy vegetative development.",
  ];

  const primaryRecommendation = signalsData?.recommended_action || {
    action_title: currentSeverity === "high" ? "Inspect Drainage & Field Bounds" : "Continue Standard Crop Care",
    action_description:
      currentSeverity === "high"
        ? "Inspect lower-lying field plots and clear secondary drainage channels before expected rainfall."
        : "Field parameters remain favorable. Maintain scheduled weeding and standard crop monitoring.",
    urgency: currentSeverity === "high" ? "immediate" : "standard",
    protocol_code: "AGR-RISK-01",
  };

  // 5-Day Outlook Array
  const outlook: RiskOutlookDay[] = signalsData?.outlook || [
    { day_offset: 0, date: "Today", day_label: "Today", severity: currentSeverity, risk_label: currentSeverity === "high" ? "High" : currentSeverity === "medium" ? "Moderate" : "Low", summary: "Current baseline" },
    { day_offset: 1, date: "Tomorrow", day_label: "Tomorrow", severity: currentSeverity, risk_label: currentSeverity === "high" ? "High" : currentSeverity === "medium" ? "Moderate" : "Low", summary: "Forecasted conditions" },
    { day_offset: 2, date: "In 2 Days", day_label: "In 2 Days", severity: currentSeverity, risk_label: currentSeverity === "high" ? "High" : currentSeverity === "medium" ? "Moderate" : "Low", summary: "Predicted weather window" },
    { day_offset: 3, date: "In 3 Days", day_label: "In 3 Days", severity: "low", risk_label: "Low", summary: "Subsequent outlook" },
    { day_offset: 4, date: "In 4 Days", day_label: "In 4 Days", severity: "low", risk_label: "Low", summary: "Expected stabilization" },
  ];

  // Contributing signals strictly from location data
  const sig = signalsData?.signals;
  const rainfallSig = sig?.rainfall;
  const moistureSig = sig?.soil_moisture;
  const cropSig = sig?.crop_condition;
  const tempSig = sig?.temperature;
  const humiditySig = sig?.humidity;

  const lastMonitoredText = farm.last_monitored_at
    ? new Date(farm.last_monitored_at).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Active continuous monitor";

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Toast Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-[#FFDAD6] border border-[#FFB4AB] text-[#410E0B] text-sm flex items-center justify-between gap-3 shadow-xs">
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

      {/* Test Email Result Banner */}
      {emailResult && (
        <div
          className={`p-4 rounded-2xl border text-sm flex items-start justify-between gap-3 shadow-xs transition-all ${
            emailResult.success && emailResult.method === "smtp"
              ? "bg-[#D8ECE0] border-[#A3D9B5] text-[#052119]"
              : emailResult.success
              ? "bg-[#FFF8E1] border-[#FFE082] text-[#5D4037]"
              : "bg-[#FFDAD6] border-[#FFB4AB] text-[#410E0B]"
          }`}
        >
          <div className="flex items-start gap-2.5">
            {emailResult.success && emailResult.method === "smtp" ? (
              <CheckCircle2 className="w-5 h-5 text-[#1B4D3E] shrink-0 mt-0.5" />
            ) : emailResult.success ? (
              <Mail className="w-5 h-5 text-[#E65100] shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-[#BA1A1A] shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <div className="font-bold flex items-center gap-2">
                <span>
                  {emailResult.success && emailResult.method === "smtp"
                    ? "Live Risk Email Dispatched via Gmail SMTP"
                    : emailResult.success
                    ? "Agronomic Risk Briefing Generated"
                    : "Email Dispatch Advisory"}
                </span>
                {emailResult.recipient && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/70">
                    To: {emailResult.recipient}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm leading-relaxed">{emailResult.message}</p>
            </div>
          </div>
          <button
            onClick={() => setEmailResult(null)}
            className="text-xs font-bold underline cursor-pointer shrink-0 mt-0.5"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Breadcrumb */}
      {onBackToOverview && (
        <button
          onClick={onBackToOverview}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1B4D3E] hover:underline cursor-pointer group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to All Parcels Dashboard</span>
        </button>
      )}

      {/* QUESTION 1: WHERE IS MY FARM? — Farm Header Card */}
      <div className="p-6 rounded-3xl bg-[#F0F4EF] border border-[#E0E4DF] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#1B4D3E] text-white text-xs font-bold uppercase tracking-wider">
              {farm.crop_type} Farm
            </span>
            {farm.is_demo && (
              <span className="px-2.5 py-0.5 rounded-full bg-white border border-[#E0E4DF] text-[#414943] text-xs font-semibold">
                Benchmark Scenario
              </span>
            )}
            {farm.farmer_email && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-[#E0E4DF] text-xs text-[#1B4D3E] font-medium">
                <Mail className="w-3 h-3" />
                <span>Alerts sent to: {farm.farmer_email}</span>
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-[#191C1A] tracking-tight">
            {farm.name}
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-[#414943]">
            <span className="inline-flex items-center gap-1 font-semibold text-[#191C1A]">
              <MapPin className="w-4 h-4 text-[#1B4D3E]" />
              {farm.location_name || `${farm.latitude.toFixed(4)}, ${farm.longitude.toFixed(4)}`}
            </span>
            <span>•</span>
            <span className="font-semibold text-[#191C1A]">
              {farm.size_hectares ? `${farm.size_hectares} hectares` : "Field Parcel"}
            </span>
            {farm.elevation && (
              <>
                <span>•</span>
                <span>{Math.round(farm.elevation)}m elevation</span>
              </>
            )}
            {farm.planting_date && (
              <>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#717973]" />
                  Planted: {farm.planting_date}{daysPlanted !== null ? ` (${daysPlanted} days)` : ""}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#E0E4DF]">
          {!farm.is_demo && onDeleteFarm && (
            <Button
              variant="outlined"
              size="sm"
              onClick={() => {
                if (confirm(`Remove ${farm.name} from monitoring?`)) {
                  onDeleteFarm(farm.id);
                }
              }}
              leftIcon={<Trash2 className="w-4 h-4 text-[#BA1A1A]" />}
              className="text-[#BA1A1A] border-[#FFB4AB] hover:bg-[#FFDAD6]"
            >
              Delete
            </Button>
          )}
          <Button
            variant="tonal"
            size="sm"
            onClick={handleSendTestEmail}
            isLoading={isSendingEmail}
            leftIcon={<Mail className="w-4 h-4 text-[#1B4D3E]" />}
            title={farm.farmer_email ? `Send test agronomic email to ${farm.farmer_email}` : "Send test email"}
          >
            Test Email
          </Button>
          <Button
            variant="tonal"
            size="sm"
            onClick={() => setIsReportModalOpen(true)}
            leftIcon={<FileText className="w-4 h-4" />}
          >
            Record Note
          </Button>
          <Button
            variant="filled"
            size="sm"
            onClick={handleRecheckRisk}
            isLoading={isEvaluating}
            leftIcon={<RefreshCw className={`w-4 h-4 ${isEvaluating ? "animate-spin" : ""}`} />}
          >
            Check Now
          </Button>
        </div>
      </div>

      {/* AUDIT ITEM 2: AGRONOMIC STATUS & CROP STAGE CARD */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#E0E4DF] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E0E4DF]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#D8ECE0] text-[#1B4D3E] flex items-center justify-center">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#1B4D3E] block">
                Agronomic Crop Status
              </span>
              <h3 className="text-base sm:text-lg font-bold text-[#191C1A]">
                {farm.crop_type.toUpperCase()} · {cropStage}
              </h3>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#F0F4EF] text-[#414943] self-start sm:self-center">
            {daysPlanted !== null ? `Day ${daysPlanted} of Vegetative Cycle` : "Active Vegetative Cycle"}
          </span>
        </div>

        <p className="text-sm text-[#303833] leading-relaxed">
          {agronomicStatusText}
        </p>
      </div>

      {/* CONTINUOUS MONITORING ACTIVE BANNER */}
      <div className="px-5 py-3.5 rounded-2xl bg-white border border-[#E0E4DF] flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs text-xs text-[#414943]">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#1B4D3E] animate-pulse shrink-0"></span>
          <span>
            <strong>Monitoring active</strong> — Your farm is continuously assessed for changes that could affect crop health and harvest outcomes.
          </span>
        </div>
        <div className="text-[11px] text-[#717973] shrink-0">
          Last assessment: <strong>{lastMonitoredText}</strong>
        </div>
      </div>

      {/* COMPOUNDED EMAIL RISK CHANNEL CARD */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#E0E4DF] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E0E4DF]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#D8ECE0] text-[#1B4D3E] flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#1B4D3E] block">
                Farmer Email Notification Channel
              </span>
              <h3 className="text-base sm:text-lg font-bold text-[#191C1A]">
                Compounded Risk Early Warning System
              </h3>
            </div>
          </div>
          <Button
            variant="filled"
            size="sm"
            onClick={handleSendTestEmail}
            isLoading={isSendingEmail}
            leftIcon={<Mail className="w-4 h-4" />}
            className="self-start sm:self-center"
          >
            Send Test Alert Email
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-[#F0F4EF] space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#717973] block">
              Recipient Email
            </span>
            <span className="font-bold text-[#191C1A] text-sm break-all">
              {farm.farmer_email || "Not specified"}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#F0F4EF] space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#717973] block">
              Dispatch Policy
            </span>
            <span className="font-semibold text-[#191C1A] text-xs">
              Compounded once per threat cycle (prevents alert fatigue)
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#F0F4EF] space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#717973] block">
              Last Dispatched Alert
            </span>
            <span className="font-semibold text-[#191C1A] text-xs">
              {farm.last_email_notification_at
                ? new Date(farm.last_email_notification_at).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "No email dispatched yet"}
            </span>
          </div>
        </div>

        <p className="text-xs text-[#717973]">
          Alerts are automatically triggered when Sentinel-2 satellite or meteorological data detects elevated risk (e.g. soil saturation, precipitation spikes, or canopy vigor decline). Notifications are compounded into a single actionable briefing to protect farmers from message fatigue.
        </p>
      </div>

      {/* GOOGLE EARTH-STYLE FARM VIEW — Large, Immersive Aerial Visualization */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#191C1A] flex items-center gap-2">
            <Sprout className="w-4 h-4 text-[#1B4D3E]" />
            <span>Farm Aerial Intelligence &amp; Terrain View</span>
          </h2>
          <span className="text-xs text-[#717973] font-medium">
            Parcel boundaries &amp; risk zones layered on earth imagery
          </span>
        </div>
        <FarmMap
          farm={farm}
          severity={currentSeverity}
          heightClass="h-[400px] sm:h-[460px] md:h-[500px]"
        />
      </div>

      {/* QUESTIONS 2 & 3: WHAT IS HAPPENING? HOW RISKY IS IT? — Main Risk Intelligence Card */}
      <div
        className={`p-6 sm:p-7 rounded-3xl border transition-all duration-300 shadow-sm ${theme.bannerBg} ${theme.bannerBorder} ${theme.bannerText}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-current/10">
          <div className="flex items-start sm:items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${theme.badgeBg} ${theme.badgeText}`}
            >
              {currentSeverity === "high" ? (
                <AlertOctagon className="w-6 h-6 animate-pulse" />
              ) : currentSeverity === "medium" ? (
                <AlertTriangle className="w-6 h-6" />
              ) : (
                <ShieldCheck className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider opacity-85">
                  Agronomic Risk Assessment
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-white/70">
                  {riskTrend === "increasing" ? (
                    <TrendingUp className="w-3.5 h-3.5 text-[#BA1A1A]" />
                  ) : riskTrend === "decreasing" ? (
                    <TrendingDown className="w-3.5 h-3.5 text-[#1B4D3E]" />
                  ) : (
                    <Minus className="w-3.5 h-3.5 text-[#717973]" />
                  )}
                  <span className="capitalize">Risk {riskTrend}</span>
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black mt-1 leading-snug">
                {headline}
              </h2>
            </div>
          </div>

          <RiskSeverityBadge severity={currentSeverity} size="lg" className="self-start sm:self-center shrink-0" />
        </div>

        {/* QUESTIONS 4 & 5: WHY? WHAT SHOULD I DO? — Side-by-side Intelligence Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
          {/* Question 4: Why? */}
          <div className="p-5 rounded-2xl bg-white/90 backdrop-blur-xs border border-current/10 space-y-3">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#191C1A] flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#1B4D3E]" />
              <span>Why this risk was detected</span>
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm text-[#414943] leading-relaxed">
              {whyFactors.map((factor, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1B4D3E] mt-1.5 shrink-0"></span>
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Question 5: What should I do? */}
          <div className="p-5 rounded-2xl bg-white/90 backdrop-blur-xs border border-current/10 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-extrabold uppercase tracking-wider text-[#191C1A] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#1B4D3E]" />
                  <span>Recommended Action</span>
                </span>
                <span
                  className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                    primaryRecommendation.urgency === "immediate"
                      ? "bg-[#FFDAD6] text-[#410E0B]"
                      : "bg-[#D8ECE0] text-[#052119]"
                  }`}
                >
                  {primaryRecommendation.urgency} Action
                </span>
              </div>
              <h4 className="text-base font-bold text-[#191C1A]">
                {primaryRecommendation.action_title}
              </h4>
              <p className="text-xs sm:text-sm text-[#414943] leading-relaxed">
                {primaryRecommendation.action_description}
              </p>
            </div>

            <div className="pt-2 border-t border-black/5 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#1B4D3E]">
                Agronomic Protocol #{primaryRecommendation.protocol_code || "AGR-01"}
              </span>
              <Button
                variant="filled"
                size="sm"
                onClick={() => setIsReportModalOpen(true)}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Log Action
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* AUDIT ITEM 3: DYNAMIC MULTI-DAY RISK OUTLOOK */}
      <div className="p-6 rounded-3xl bg-white border border-[#E0E4DF] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-3 border-b border-[#E0E4DF]">
          <div>
            <h3 className="text-lg font-black text-[#191C1A]">Risk Outlook</h3>
            <p className="text-xs text-[#717973]">
              What is the risk now, and what is likely to happen next across the 5-day horizon?
            </p>
          </div>
          <span className="text-xs font-semibold text-[#1B4D3E] self-start sm:self-center">
            Day-by-Day Forecast Model
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {outlook.map((day, idx) => {
            const isHigh = day.severity === "high";
            const isMed = day.severity === "medium";
            return (
              <div
                key={idx}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between space-y-2 ${
                  isHigh
                    ? "bg-[#FFDAD6]/50 border-[#FFB4AB]"
                    : isMed
                    ? "bg-[#FFDCC2]/40 border-[#FFB68F]"
                    : "bg-[#F0F4EF] border-[#E0E4DF]"
                }`}
              >
                <div>
                  <span className="text-xs font-bold text-[#717973] uppercase tracking-wider block">
                    {day.day_label}
                  </span>
                  <span
                    className={`text-sm font-black block mt-0.5 ${
                      isHigh ? "text-[#BA1A1A]" : isMed ? "text-[#8B5000]" : "text-[#1B4D3E]"
                    }`}
                  >
                    {day.risk_label}
                  </span>
                </div>
                <p className="text-[11px] text-[#414943] leading-tight line-clamp-2">
                  {day.summary}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* AUDIT ITEM 1 & 4: LOCATION-SPECIFIC CONTRIBUTING SIGNALS GRID */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-[#191C1A]">Contributing Environmental Signals</h3>
          <span className="text-xs font-semibold text-[#1B4D3E]">
            Derived for {farm.location_name || `${farm.latitude.toFixed(2)}°, ${farm.longitude.toFixed(2)}°`}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {rainfallSig && (
            <SignalIndicator
              type="rainfall"
              value={rainfallSig.value}
              unit="mm (past 7d)"
              subtitle={`Next 48h: ${rainfallSig.forecast_value ?? 0} mm`}
              thresholdLabel={rainfallSig.threshold_label}
              trendDirection={rainfallSig.trend}
              status={rainfallSig.status}
              series15d={rainfallSig.series_15d}
              whyItMatters={rainfallSig.why_it_matters}
            />
          )}

          {moistureSig && (
            <SignalIndicator
              type="soil_moisture"
              value={moistureSig.value}
              unit="%"
              subtitle="Root Zone Water Content"
              thresholdLabel={moistureSig.threshold_label}
              trendDirection={moistureSig.trend}
              status={moistureSig.status}
              series15d={moistureSig.series_15d}
              whyItMatters={moistureSig.why_it_matters}
            />
          )}

          {tempSig && (
            <SignalIndicator
              type="temperature"
              value={tempSig.value}
              unit="°C"
              subtitle="Daily High Temperature"
              thresholdLabel={tempSig.threshold_label}
              trendDirection={tempSig.trend}
              status={tempSig.status}
              series15d={tempSig.series_15d}
              whyItMatters={tempSig.why_it_matters}
            />
          )}

          {cropSig && (
            <SignalIndicator
              type="crop_condition"
              value={cropSig.value}
              unit="Vigor Index"
              subtitle={`Stage: ${cropStage}`}
              thresholdLabel={cropSig.threshold_label}
              trendDirection={cropSig.trend}
              status={cropSig.status}
              series15d={cropSig.series_15d}
              whyItMatters={cropSig.why_it_matters}
            />
          )}
        </div>
      </div>

      {/* AUDIT ITEM 5: AGRONOMIC RISK THRESHOLDS (PLAIN LANGUAGE SAFETY BOUNDS) */}
      <ThresholdComparisonCard
        riskEvents={riskEvents}
        signalsData={signalsData}
        cropType={farm.crop_type}
      />

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

export default FarmDashboardView;
