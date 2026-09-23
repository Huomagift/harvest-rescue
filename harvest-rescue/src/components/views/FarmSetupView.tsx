"use client";

import React, { useState } from "react";
import { Farm } from "@/lib/types";
import { api } from "@/lib/api";
import { Button } from "../ui/Button";
import { SkeletonCard } from "../ui/SkeletonCard";
import { MapPin, Sprout, Calendar, Navigation, AlertCircle, User, ArrowLeft, Mail, Compass } from "lucide-react";

export interface FarmSetupViewProps {
  onFarmCreated: (farm: Farm) => void;
  onCancel: () => void;
  defaultEmail?: string;
  defaultOwnerName?: string;
}

export const FarmSetupView: React.FC<FarmSetupViewProps> = ({
  onFarmCreated,
  onCancel,
  defaultEmail,
  defaultOwnerName,
}) => {
  const [ownerName, setOwnerName] = useState(defaultOwnerName || "");
  const [farmerEmail, setFarmerEmail] = useState(defaultEmail || "");
  const [name, setName] = useState("");
  const [locationName, setLocationName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [elevation, setElevation] = useState("");
  const [sizeHectares, setSizeHectares] = useState("");
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
      const sizeNum = sizeHectares.trim() ? parseFloat(sizeHectares) : undefined;

      setStatusStep("Registering farm details with risk intelligence backend...");
      const createdFarm = await api.createFarm({
        name: name.trim(),
        owner_name: ownerName.trim() || undefined,
        farmer_email: farmerEmail.trim() || undefined,
        location_name: locationName.trim() || undefined,
        size_hectares: !isNaN(sizeNum as number) ? sizeNum : undefined,
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

      setStatusStep("Calibrating environmental baseline and multi-day risk horizon...");
      await api.evaluateRisk(createdFarm.id);

      setStatusStep("Continuous monitoring active!");
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
        <span className="text-xs font-bold text-[#1B4D3E] uppercase tracking-wider">
          Field Onboarding &amp; Intelligence Setup
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-[#191C1A]">Register Farm for Early Warning</h2>
        <p className="text-sm text-[#414943] leading-relaxed">
          Enter your farm location and crop information to activate continuous environmental risk monitoring and receive predictive alerts.
        </p>
      </div>

      {/* Submission Loading State */}
      {isSubmitting ? (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#D8ECE0] text-[#052119] text-sm font-semibold flex items-center gap-2 animate-pulse">
            <Sprout className="w-5 h-5 text-[#1B4D3E] animate-spin" />
            <span>{statusStep || "Processing registration..."}</span>
          </div>
          <SkeletonCard count={2} />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-3xl bg-[#F0F4EF] border border-[#E0E4DF] space-y-5 shadow-sm">
          {error && (
            <div className="p-4 rounded-2xl bg-[#FFDAD6] border border-[#FFB4AB] text-[#410E0B] text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Farmer Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#191C1A] block mb-1 font-bold">
                Farmer / Manager Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3.5 text-[#717973]" />
                <input
                  type="text"
                  required
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="e.g. Farm Manager"
                  className="w-full h-11 pl-10 pr-4 rounded-2xl bg-white border border-[#C1C9C3] text-[#191C1A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-[#191C1A] block mb-1 font-bold">
                Alert Email (Compounded Briefings)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-[#717973]" />
                <input
                  type="email"
                  value={farmerEmail}
                  onChange={(e) => setFarmerEmail(e.target.value)}
                  placeholder="e.g. farmer@domain.com"
                  className="w-full h-11 pl-10 pr-4 rounded-2xl bg-white border border-[#C1C9C3] text-[#191C1A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]"
                />
              </div>
            </div>
          </div>

          {/* Farm Name & Location Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#191C1A] block mb-1 font-bold">
                Farm Field Name *
              </label>
              <div className="relative">
                <Sprout className="w-4 h-4 absolute left-3.5 top-3.5 text-[#717973]" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Green Valley Plot A"
                  className="w-full h-11 pl-10 pr-4 rounded-2xl bg-white border border-[#C1C9C3] text-[#191C1A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-[#191C1A] block mb-1 font-bold">
                Location (LGA / State)
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3.5 top-3.5 text-[#717973]" />
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="e.g. District / State"
                  className="w-full h-11 pl-10 pr-4 rounded-2xl bg-white border border-[#C1C9C3] text-[#191C1A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]"
                />
              </div>
            </div>
          </div>

          {/* Location & GPS Helper */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-[#191C1A] font-bold">
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
                <input
                  type="number"
                  step="any"
                  required
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="Latitude (e.g. 5.0935)"
                  className="w-full h-11 px-3 rounded-2xl bg-white border border-[#C1C9C3] text-[#191C1A] text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]"
                />
              </div>

              <div>
                <input
                  type="number"
                  step="any"
                  required
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="Longitude (e.g. 7.2154)"
                  className="w-full h-11 px-3 rounded-2xl bg-white border border-[#C1C9C3] text-[#191C1A] text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]"
                />
              </div>

              <div>
                <input
                  type="number"
                  step="any"
                  value={elevation}
                  onChange={(e) => setElevation(e.target.value)}
                  placeholder="Elevation m (e.g. 42)"
                  className="w-full h-11 px-3 rounded-2xl bg-white border border-[#C1C9C3] text-[#191C1A] text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]"
                />
              </div>
            </div>
          </div>

          {/* Crop Type, Size (ha) & Planting Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-[#191C1A] block mb-1 font-bold">
                Crop Type *
              </label>
              <select
                value={cropType}
                onChange={(e) => setCropType(e.target.value)}
                className="w-full h-11 px-3 rounded-2xl bg-white border border-[#C1C9C3] text-[#191C1A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]"
              >
                <option value="maize">Maize (Corn)</option>
                <option value="rice">Rice</option>
                <option value="sorghum">Sorghum</option>
                <option value="soybeans">Soybeans</option>
                <option value="cassava">Cassava</option>
                <option value="yam">Yam</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-[#191C1A] block mb-1 font-bold">
                Farm Size (Hectares)
              </label>
              <input
                type="number"
                step="0.1"
                value={sizeHectares}
                onChange={(e) => setSizeHectares(e.target.value)}
                placeholder="e.g. 12.4"
                className="w-full h-11 px-3 rounded-2xl bg-white border border-[#C1C9C3] text-[#191C1A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]"
              />
            </div>

            <div>
              <label className="text-xs text-[#191C1A] block mb-1 font-bold">
                Planting Date
              </label>
              <input
                type="date"
                value={plantingDate}
                onChange={(e) => setPlantingDate(e.target.value)}
                className="w-full h-11 px-3 rounded-2xl bg-white border border-[#C1C9C3] text-[#191C1A] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]"
              />
            </div>
          </div>

          {/* Field Notes */}
          <div>
            <label className="text-xs text-[#191C1A] block mb-1 font-bold">
              Field Characteristics &amp; Drainage Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Lower section has mild slope near seasonal stream; loam soil."
              className="w-full p-3 rounded-2xl bg-white border border-[#C1C9C3] text-[#191C1A] text-xs focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-[#E0E4DF] flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="text"
              onClick={onCancel}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="filled"
              disabled={isSubmitting}
            >
              Activate Monitoring
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default FarmSetupView;
