"use client";

import React from "react";
import { Farm, Alert } from "@/lib/types";
import { UserProfile } from "@/lib/api";
import { Button } from "../ui/Button";
import {
  Sprout,
  Plus,
  MapPin,
  Calendar,
  Layers,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Trash2,
  Bell,
  Activity,
  Compass,
} from "lucide-react";

export interface FarmerOverviewViewProps {
  currentUser: UserProfile;
  farms: Farm[];
  alerts: Alert[];
  onSelectFarm: (farm: Farm) => void;
  onNavigateToSetup: () => void;
  onDeleteFarm: (farmId: string) => void;
  onOpenAlerts?: () => void;
}

export const FarmerOverviewView: React.FC<FarmerOverviewViewProps> = ({
  currentUser,
  farms,
  alerts,
  onSelectFarm,
  onNavigateToSetup,
  onDeleteFarm,
  onOpenAlerts,
}) => {
  const unreadAlerts = alerts.filter((a) => a.status === "unread");
  const totalHectares = farms.reduce((sum, f) => sum + (f.size_hectares || 0), 0);
  const farmMap = new Map(farms.map((f) => [f.id, f]));

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#E8F5E9] via-[#F1F8F4] to-[#FBFDFA] border border-[#A3D9B5] shadow-xs">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1B4D3E]/10 text-[#1B4D3E] text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-[#1B4D3E] animate-pulse"></span>
            <span>Farmer Operations Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#191C1A] tracking-tight">
            Welcome back, {currentUser.name}
          </h1>
          <p className="text-sm text-[#414943]">
            {currentUser.email} · Continuous Risk Intelligence &amp; Sentinel Early Warning
          </p>
        </div>

        <Button
          size="md"
          variant="filled"
          onClick={onNavigateToSetup}
          leftIcon={<Plus className="w-4 h-4" />}
          className="shadow-sm font-bold shrink-0 self-start sm:self-center"
        >
          Add New Farm Parcel
        </Button>
      </div>

      {/* High-Level Agricultural Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1: Total Parcels */}
        <div className="p-5 rounded-2xl bg-white border border-[#E0E4DF] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#717973]">
              Registered Parcels
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#D8ECE0] text-[#1B4D3E] flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#191C1A]">{farms.length}</span>
            <span className="text-xs text-[#717973]">
              {farms.length === 1 ? "farm field" : "farm fields"}
            </span>
          </div>
          <p className="text-xs text-[#414943]">Calibrated with coordinate GPS boundaries</p>
        </div>

        {/* Metric 2: Total Hectares */}
        <div className="p-5 rounded-2xl bg-white border border-[#E0E4DF] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#717973]">
              Monitored Area
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#D8ECE0] text-[#1B4D3E] flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#191C1A]">
              {totalHectares > 0 ? totalHectares.toFixed(1) : "0.0"}
            </span>
            <span className="text-xs text-[#717973]">hectares under watch</span>
          </div>
          <p className="text-xs text-[#414943]">Continuous multispectral canopy index coverage</p>
        </div>

        {/* Metric 3: Active Risk Status */}
        <div className="p-5 rounded-2xl bg-white border border-[#E0E4DF] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#717973]">
              Active Alerts
            </span>
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                unreadAlerts.length > 0
                  ? "bg-[#FFDAD6] text-[#BA1A1A]"
                  : "bg-[#D8ECE0] text-[#1B4D3E]"
              }`}
            >
              {unreadAlerts.length > 0 ? (
                <AlertTriangle className="w-4 h-4" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-3xl font-black ${
                unreadAlerts.length > 0 ? "text-[#BA1A1A]" : "text-[#1B4D3E]"
              }`}
            >
              {unreadAlerts.length}
            </span>
            <span className="text-xs text-[#717973]">
              {unreadAlerts.length === 1 ? "incident detected" : "incidents detected"}
            </span>
          </div>
          <p className="text-xs text-[#414943]">
            {unreadAlerts.length > 0
              ? "Urgent advisory requires farmer attention"
              : "All monitored parcels currently nominal"}
          </p>
        </div>
      </div>

      {/* Available Farms Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#191C1A]">My Agricultural Parcels</h2>
            <p className="text-xs text-[#717973]">
              Select any parcel to open full satellite indices, soil moisture, and weather forecasts
            </p>
          </div>
          {farms.length > 0 && (
            <Button
              size="sm"
              variant="outlined"
              onClick={onNavigateToSetup}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              className="font-bold text-xs"
            >
              Add Farm
            </Button>
          )}
        </div>

        {/* Empty State: 0 Farms Registered */}
        {farms.length === 0 ? (
          <div className="p-8 sm:p-12 rounded-3xl bg-white border border-[#E0E4DF] shadow-xs text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-[#D8ECE0] text-[#1B4D3E] flex items-center justify-center mx-auto shadow-xs">
              <Sprout className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h3 className="text-xl font-bold text-[#191C1A]">No Farm Parcels Registered Yet</h3>
              <p className="text-sm text-[#414943] leading-relaxed">
                Connect your farm coordinates to start receiving automated Sentinel-2 canopy health
                tracking, soil moisture warnings, and 1–2 week advance risk outlooks.
              </p>
            </div>
            <div className="pt-2">
              <Button
                size="lg"
                variant="filled"
                onClick={onNavigateToSetup}
                leftIcon={<Plus className="w-5 h-5" />}
                className="font-bold py-3 px-8 shadow-md"
              >
                Register Your First Farm Parcel
              </Button>
            </div>
          </div>
        ) : (
          /* Grid of Available Farm Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {farms.map((farm) => {
              const farmAlerts = alerts.filter(
                (a) => a.farm_id === farm.id && a.status === "unread"
              );
              return (
                <div
                  key={farm.id}
                  className="rounded-3xl bg-white border border-[#E0E4DF] p-5 shadow-xs hover:shadow-md hover:border-[#A3D9B5] transition-all flex flex-col justify-between gap-4 group"
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-[#191C1A] group-hover:text-[#1B4D3E] transition-colors">
                            {farm.name}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-[#717973]">
                          <MapPin className="w-3.5 h-3.5 text-[#1B4D3E]" />
                          <span>
                            {farm.location_name ||
                              `(${farm.latitude.toFixed(2)}, ${farm.longitude.toFixed(2)})`}
                          </span>
                        </div>
                      </div>

                      {/* Status / Alert Indicator */}
                      {farmAlerts.length > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FFDAD6] text-[#BA1A1A] text-xs font-bold shrink-0 animate-pulse">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>{farmAlerts.length} Active Alert</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#D8ECE0] text-[#052119] text-xs font-bold shrink-0">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#1B4D3E]" />
                          <span>Nominal</span>
                        </span>
                      )}
                    </div>

                    {/* Metadata Badges */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                      <span className="px-2.5 py-1 rounded-xl bg-[#F0F4EF] text-[#191C1A] font-semibold capitalize">
                        🌾 Crop: {farm.crop_type}
                      </span>
                      {farm.size_hectares && (
                        <span className="px-2.5 py-1 rounded-xl bg-[#F0F4EF] text-[#191C1A] font-semibold">
                          📏 {farm.size_hectares} ha
                        </span>
                      )}
                      {farm.planting_date && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#F0F4EF] text-[#414943]">
                          <Calendar className="w-3 h-3" />
                          <span>Planted {farm.planting_date}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-[#E0E4DF]/60 flex items-center justify-between gap-2">
                    <Button
                      size="sm"
                      variant="filled"
                      onClick={() => onSelectFarm(farm)}
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                      className="font-bold text-xs flex-1 justify-center"
                    >
                      Open Parcel Monitoring
                    </Button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Are you sure you want to remove ${farm.name}?`)) {
                          onDeleteFarm(farm.id);
                        }
                      }}
                      className="p-2 rounded-xl text-[#717973] hover:text-[#BA1A1A] hover:bg-[#FFDAD6] transition-colors cursor-pointer"
                      title="Delete Farm Parcel"
                      aria-label="Delete Farm Parcel"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Quick Add Card */}
            <button
              onClick={onNavigateToSetup}
              className="rounded-3xl border-2 border-dashed border-[#C0C9C0] hover:border-[#1B4D3E] p-6 text-center flex flex-col items-center justify-center gap-2 text-[#717973] hover:text-[#1B4D3E] hover:bg-[#D8ECE0]/20 transition-all cursor-pointer min-h-[170px]"
            >
              <div className="w-10 h-10 rounded-2xl bg-[#F0F4EF] flex items-center justify-center text-[#1B4D3E]">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold">Register Another Parcel</span>
              <span className="text-xs text-[#717973]">Add coordinates &amp; crop details</span>
            </button>
          </div>
        )}
      </div>

      {/* Account Risk & Alert Summary Section */}
      {farms.length > 0 && (
        <div className="p-6 rounded-3xl bg-white border border-[#E0E4DF] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#1B4D3E]" />
              <h3 className="text-base font-bold text-[#191C1A]">Parcel Early-Warning Activity</h3>
            </div>
            {onOpenAlerts && (
              <button
                onClick={onOpenAlerts}
                className="text-xs text-[#1B4D3E] font-bold hover:underline cursor-pointer"
              >
                View All Alerts ({alerts.length})
              </button>
            )}
          </div>

          {unreadAlerts.length === 0 ? (
            <div className="p-4 rounded-2xl bg-[#D8ECE0]/40 border border-[#A3D9B5]/60 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-[#1B4D3E] shrink-0" />
              <div className="text-xs text-[#052119]">
                <span className="font-bold">No active warnings across your parcels. </span>
                <span>
                  Harvest Rescue is continuously evaluating daily weather, rainfall thresholds, and
                  vegetative health.
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {unreadAlerts.slice(0, 3).map((alert) => {
                const targetFarm = farmMap.get(alert.farm_id);
                return (
                  <div
                    key={alert.id}
                    className="p-3.5 rounded-2xl bg-[#FFDAD6]/40 border border-[#FFB4AB] flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-[#BA1A1A] shrink-0" />
                      <div>
                        <span className="font-bold text-[#410E0B]">
                          {targetFarm ? targetFarm.name : "Parcel"}:{" "}
                        </span>
                        <span className="text-[#191C1A]">{alert.message}</span>
                      </div>
                    </div>
                    {targetFarm && (
                      <Button
                        size="sm"
                        variant="outlined"
                        onClick={() => onSelectFarm(targetFarm)}
                        className="shrink-0 text-xs font-bold"
                      >
                        Inspect Parcel
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
