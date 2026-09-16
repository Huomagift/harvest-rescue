"use client";

import React, { useState } from "react";
import { Alert, AlertStatus, Farm } from "@/lib/types";
import { api } from "@/lib/api";
import { RiskSeverityBadge } from "./RiskSeverityBadge";
import { X, Bell, Check, Trash2, Clock, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./Button";

interface AlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: Alert[];
  farms: Farm[];
  onAlertUpdated: () => void;
  onTriggerSweep: () => void;
  isSweeping: boolean;
}

export const AlertsModal: React.FC<AlertsModalProps> = ({
  isOpen,
  onClose,
  alerts,
  farms,
  onAlertUpdated,
  onTriggerSweep,
  isSweeping,
}) => {
  const [filter, setFilter] = useState<AlertStatus | "all">("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const farmMap = new Map(farms.map((f) => [f.id, f.name]));

  const filteredAlerts = alerts.filter((a) => {
    if (filter === "all") return a.status !== "dismissed";
    return a.status === filter;
  });

  const handleUpdateStatus = async (alertId: string, status: AlertStatus) => {
    setUpdatingId(alertId);
    try {
      await api.updateAlertStatus(alertId, status);
      onAlertUpdated();
    } catch (err) {
      console.error("Failed to update alert status:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg h-full max-h-[90vh] bg-[#FBFDFA] rounded-3xl border border-[#E0E4DF] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#E0E4DF] bg-[#F0F4EF] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#1B4D3E] text-white flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="m3-title-large font-bold text-[#191C1A]">Persistent Risk Alerts</h2>
              <p className="m3-body-medium text-xs text-[#717973]">Real-Time Continuous Farm Monitoring</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#414943] hover:bg-[#E0E4DF] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Filter Tabs */}
        <div className="p-4 border-b border-[#E0E4DF] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 bg-[#F0F4EF] p-1 rounded-2xl">
            {(["all", "unread", "read", "dismissed"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-xl m3-label-medium text-xs capitalize transition-all cursor-pointer ${
                  filter === tab
                    ? "bg-white text-[#1B4D3E] font-bold shadow-xs"
                    : "text-[#414943] hover:text-[#191C1A]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <Button
            size="sm"
            variant="tonal"
            onClick={onTriggerSweep}
            isLoading={isSweeping}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isSweeping ? "animate-spin" : ""}`} />}
          >
            Run Sweep
          </Button>
        </div>

        {/* Alerts List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredAlerts.length === 0 ? (
            <div className="py-12 text-center text-[#717973] space-y-2">
              <AlertTriangle className="w-8 h-8 mx-auto opacity-40" />
              <p className="m3-body-medium font-medium">No alerts matching "{filter}"</p>
              <p className="m3-label-medium text-xs opacity-75">
                Continuous background scheduler is active and monitoring registered farms.
              </p>
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const farmName = farmMap.get(alert.farm_id) || "Farm";
              const dateStr = new Date(alert.created_at).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={alert.id}
                  className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                    alert.status === "unread"
                      ? "bg-[#F0F4EF]/80 border-[#1B4D3E]/30 shadow-xs"
                      : "bg-white border-[#E0E4DF] opacity-90"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="m3-label-medium text-xs font-bold text-[#1B4D3E] uppercase tracking-wider">
                          {farmName}
                        </span>
                        {alert.days_to_impact !== null && alert.days_to_impact !== undefined && (
                          <span className="m3-label-medium text-xs bg-[#FFDCC2] text-[#341200] px-2 py-0.5 rounded-full font-bold">
                            Impact in ~{alert.days_to_impact}d
                          </span>
                        )}
                      </div>
                      <h4 className="m3-title-medium font-bold text-[#191C1A] mt-0.5">{alert.title}</h4>
                    </div>
                    <RiskSeverityBadge severity={alert.severity} size="sm" />
                  </div>

                  <p className="m3-body-medium text-sm text-[#414943] leading-snug">{alert.message}</p>

                  <div className="pt-2 border-t border-[#E0E4DF] flex items-center justify-between text-xs text-[#717973]">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Detected {dateStr}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {alert.status === "unread" && (
                        <button
                          disabled={updatingId === alert.id}
                          onClick={() => handleUpdateStatus(alert.id, "read")}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#E0E4DF] hover:bg-[#F0F4EF] text-[#1B4D3E] font-semibold text-xs transition-colors cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" /> Mark Read
                        </button>
                      )}
                      {alert.status !== "dismissed" && (
                        <button
                          disabled={updatingId === alert.id}
                          onClick={() => handleUpdateStatus(alert.id, "dismissed")}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-[#FFDAD6] text-[#BA1A1A] font-medium text-xs transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Dismiss
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
