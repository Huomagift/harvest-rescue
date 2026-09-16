"use client";

import React, { useState } from "react";
import { Sprout, MapPin, Calendar, User, ArrowRight, AlertCircle, Navigation, FileText } from "lucide-react";
import { Button } from "../ui/Button";
import { SkeletonCard } from "../ui/SkeletonCard";
import { api } from "@/lib/api";
import { Farm } from "@/lib/types";

export interface FarmSetupViewProps {
  onFarmCreated: (farm: Farm) => void;
  onCancel: () => void;
}

export const FarmSetupView: React.FC<FarmSetupViewProps> = ({
  onFarmCreated,
  onCancel,
}) => {
  const [name, setName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [elevation, setElevation] = useState("");
  const [cropType, setCropType] = useState("maize");
  const [plantingDate, setPlantingDate] = useState("");
  const [notes, setNotes] = useState("");

  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusStep, setStatusStep] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-detect GPS location helper
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setIsLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(5));
        setLongitude(position.coords.longitude.toFixed(5));
        setIsLocating(false);
      },
      (err) => {
        setError(`Unable to detect location: ${err.message}. Please enter coordinates manually.`);
        setIsLocating(false);
      },
      { timeout: 10000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const latNum = parseFloat(latitude);
    const lngNum = parseFloat(longitude);

    if (!name.trim()) {
      setError("Please enter your farm name.");
      return;
    }

    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      setError("Please enter a valid latitude between -90 and 90.");
      return;
    }

    if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      setError("Please enter a valid longitude between -180 and 180.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const elevNum = elevation.trim() ? parseFloat(elevation) : undefined;

      setStatusStep("Registering farm details with backend...");
      const createdFarm = await api.createFarm({
        name: name.trim(),
        owner_name: ownerName.trim() || undefined,
        latitude: latNum,
        longitude: lngNum,
        elevation: !isNaN(elevNum as number) ? elevNum : undefined,
        crop_type: cropType.trim(),
        planting_date: plantingDate || undefined,
      });

      // Submit optional note if provided
      if (notes.trim()) {
        await api.submitFarmerReport(createdFarm.id, {
          note: notes.trim(),
          category: "onboarding_profile",
        }).catch(() => null);
      }

      setStatusStep("Connecting Sentinel-2 satellite feed & Open-Meteo 16-day forecast...");
      await api.evaluateRisk(createdFarm.id);

      setStatusStep("Calibration complete!");
      setTimeout(() => {
        onFarmCreated(createdFarm);
      }, 400);
    } catch (err: any) {
      setError(err.message || "Failed to setup farm. Please check backend connection.");
      setIsSubmitting(false);
      setStatusStep(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-10 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <span className="m3-label-medium text-[#1B4D3E] uppercase font-bold tracking-wider">
          Farmer Account &amp; Field Onboarding
        </span>
        <h2 className="m3-headline-medium text-[#191C1A] font-extrabold">Create Account &amp; Register Farm</h2>
        <p className="m3-body-medium text-[#414943]">
          Create your account and enter your farm coordinates to start 24/7 predictive monitoring with Google Earth Engine satellite imagery and 16-day Open-Meteo forecasts.
        </p>
      </div>

      {/* Submission Loading State (Skeleton card pattern) */}
      {isSubmitting ? (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#D8ECE0] text-[#052119] text-sm font-semibold flex items-center gap-2 animate-pulse">
            <Sprout className="w-5 h-5 text-[#1B4D3E] animate-spin" />
            <span>{statusStep || "Processing registration..."}</span>
          </div>
          <SkeletonCard count={2} />
        </div>
      ) : (
        /* Un-Prefilled Form */
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-3xl bg-[#F0F4EF] border border-[#E0E4DF] space-y-5 shadow-sm">
          {error && (
            <div className="p-4 rounded-2xl bg-[#FFDAD6] border border-[#FFB4AB] text-[#410E0B] text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Account / Farmer Name */}
          <div>
            <label className="m3-label-medium text-[#191C1A] block mb-1 font-semibold">
              Farmer / Account Name *
            </label>
            <div className="relative">
              <User className="w-5 h-5 absolute left-3.5 top-3.5 text-[#717973]" />
              <input
                type="text"
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="e.g. Ibrahim Abubakar"
                className="w-full h-12 pl-11 pr-4 rounded-2xl bg-white border border-[#C1C9C3] text-[#191C1A] m3-body-medium focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]"
              />
            </div>
          </div>

          {/* Farm Name */}
          <div>
            <label className="m3-label-medium text-[#191C1A] block mb-1 font-semibold">
              Farm Field Name *
            </label>
            <div className="relative">
              <Sprout className="w-5 h-5 absolute left-3.5 top-3.5 text-[#717973]" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Green Valley Maize Farm"
                className="w-full h-12 pl-11 pr-4 rounded-2xl bg-white border border-[#C1C9C3] text-[#191C1A] m3-body-medium focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]"
              />
            </div>
          </div>

          {/* Location & GPS Helper */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="m3-label-medium text-[#191C1A] font-semibold">
                Field Coordinates *
              </label>
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={isLocating}
                className="inline-flex items-center gap-1.5 text-xs text-[#1B4D3E] font-bold hover:underline cursor-pointer"
              >
                <Navigation className={`w-3.5 h-3.5 ${isLocating ? "animate-spin" : ""}`} />
                <span>{isLocating ? "Detecting GPS..." : "Use Current GPS Location"}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <div className="relative">
                  <MapPin className="w-5 h-5 absolute left-3.5 top-3.5 text-[#717973]" />
                  <input
                    type="number"
                    step="any"
                    required
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="Lat (e.g. 10.4866)"
                    className="w-full h-12 pl-11 pr-3 rounded-2xl bg-white border border-[#C1C9C3] text-[#191C1A] m3-body-medium focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]"
                  />
                </div>
              </div>

              <div>
                <div className="relative">
                  <MapPin className="w-5 h-5 absolute left-3.5 top-3.5 text-[#717973]" />
                  <input
                    type="number"
                    step="any"
                    required
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="Long (e.g. 7.4435)"
                    className="w-full h-12 pl-11 pr-3 rounded-2xl bg-white border border-[#C1C9C3] text-[#191C1A] m3-body-medium focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]"
                  />
                </div>
              </div>

              <div>
                <div className="relative">
                  <MapPin className="w-5 h-5 absolute left-3.5 top-3.5 text-[#717973]" />
                  <input
                    type="number"
                    step="any"
                    value={elevation}
                    onChange={(e) => setElevation(e.target.value)}
                    placeholder="Elevation m (e.g. 578)"
                    className="w-full h-12 pl-11 pr-3 rounded-2xl bg-white border border-[#C1C9C3] text-[#191C1A] m3-body-medium focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Crop Type & Planting Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="m3-label-medium text-[#191C1A] block mb-1 font-semibold">
                Crop Type *
              </label>
              <select
                value={cropType}
                onChange={(e) => setCropType(e.target.value)}
                className="w-full h-12 px-4 rounded-2xl bg-white border border-[#C1C9C3] text-[#191C1A] m3-body-medium focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]"
              >
                <option value="maize">Maize (Corn)</option>
                <option value="rice">Rice</option>
                <option value="cassava">Cassava</option>
                <option value="sorghum">Sorghum</option>
                <option value="wheat">Wheat</option>
                <option value="yam">Yam</option>
                <option value="soybeans">Soybeans</option>
              </select>
            </div>

            <div>
              <label className="m3-label-medium text-[#191C1A] block mb-1 font-semibold">
                Planting Date
              </label>
              <div className="relative">
                <Calendar className="w-5 h-5 absolute left-3.5 top-3.5 text-[#717973]" />
                <input
                  type="date"
                  value={plantingDate}
                  onChange={(e) => setPlantingDate(e.target.value)}
                  className="w-full h-12 pl-11 pr-4 rounded-2xl bg-white border border-[#C1C9C3] text-[#191C1A] m3-body-medium focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]"
                />
              </div>
            </div>
          </div>

          {/* Optional Additional Farm Info */}
          <div>
            <label className="m3-label-medium text-[#191C1A] block mb-1 font-semibold">
              Field Notes / Soil &amp; Irrigation Setup (Optional)
            </label>
            <div className="relative">
              <FileText className="w-5 h-5 absolute left-3.5 top-3.5 text-[#717973]" />
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Clay-loam soil, rainfed field near riverbank"
                className="w-full h-12 pl-11 pr-4 rounded-2xl bg-white border border-[#C1C9C3] text-[#191C1A] m3-body-medium focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3">
            <Button type="button" variant="text" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="filled"
              isLoading={isSubmitting}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Register &amp; Start Monitoring
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default FarmSetupView;
