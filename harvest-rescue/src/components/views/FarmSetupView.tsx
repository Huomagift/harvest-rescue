import React, { useState } from "react";
import { Sprout, MapPin, Calendar, User, ArrowRight, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "../ui/Button";
import { api } from "@/lib/api";
import { Farm } from "@/lib/types";

export interface FarmSetupViewProps {
  onFarmCreated: (farm: Farm) => void;
  onCancel: () => void;
  initialPreset?: { name: string; latitude: number; longitude: number; crop_type: string } | null;
}

const PRESET_LOCATIONS = [
  {
    name: "Lokoja Confluence Farm",
    owner_name: "Demo Farmer A",
    latitude: 7.8023,
    longitude: 6.7333,
    crop_type: "maize",
    planting_date: "2026-06-15",
    tag: "Flood Risk Demo",
  },
  {
    name: "Kaduna Maize Belt Farm",
    owner_name: "Demo Farmer C",
    latitude: 10.5105,
    longitude: 7.4165,
    crop_type: "maize",
    planting_date: "2026-05-20",
    tag: "Vigor Decline Demo",
  },
  {
    name: "Makurdi Riverside Farm",
    owner_name: "Demo Farmer B",
    latitude: 7.7322,
    longitude: 8.5391,
    crop_type: "rice",
    planting_date: "2026-06-01",
    tag: "Benue Basin Control",
  },
];

export const FarmSetupView: React.FC<FarmSetupViewProps> = ({
  onFarmCreated,
  onCancel,
  initialPreset,
}) => {
  const [name, setName] = useState(initialPreset?.name || "My Farm Field 1");
  const [ownerName, setOwnerName] = useState("Demo Farmer");
  const [latitude, setLatitude] = useState<string>(
    initialPreset?.latitude ? String(initialPreset.latitude) : "7.8023"
  );
  const [longitude, setLongitude] = useState<string>(
    initialPreset?.longitude ? String(initialPreset.longitude) : "6.7333"
  );
  const [cropType, setCropType] = useState(initialPreset?.crop_type || "maize");
  const [plantingDate, setPlantingDate] = useState("2026-06-01");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusStep, setStatusStep] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const applyPreset = (preset: typeof PRESET_LOCATIONS[0]) => {
    setName(preset.name);
    setOwnerName(preset.owner_name);
    setLatitude(String(preset.latitude));
    setLongitude(String(preset.longitude));
    setCropType(preset.crop_type);
    setPlantingDate(preset.planting_date);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const latNum = parseFloat(latitude);
    const lngNum = parseFloat(longitude);

    if (!name.trim()) {
      setError("Please enter a farm name.");
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
      // Step 1: POST /farms/
      setStatusStep("Registering farm details with backend...");
      const createdFarm = await api.createFarm({
        name: name.trim(),
        owner_name: ownerName.trim() || undefined,
        latitude: latNum,
        longitude: lngNum,
        crop_type: cropType.trim(),
        planting_date: plantingDate || undefined,
      });

      // Step 2: POST /risk/{id}/evaluate
      setStatusStep("Ingesting satellite imagery & weather risk data...");
      await api.evaluateRisk(createdFarm.id);

      setStatusStep("Analysis complete!");
      setTimeout(() => {
        onFarmCreated(createdFarm);
      }, 500);
    } catch (err: any) {
      setError(err.message || "Failed to setup farm. Please check backend connection.");
      setIsSubmitting(false);
      setStatusStep(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-10 space-y-6">
      {/* Header */}
      <div className="space-y-2 text-center sm:text-left">
        <span className="m3-label-medium text-[#1B4D3E] font-bold uppercase tracking-wider">
          Step 1 of 2
        </span>
        <h2 className="m3-headline-medium text-[#191C1A]">Register Farm & Run First Risk Scan</h2>
        <p className="m3-body-medium text-[#414943]">
          Provide your field coordinates and crop details to calibrate real-time satellite imagery and weather signals.
        </p>
      </div>

      {/* Preset Quick-Fill selector */}
      <div className="p-4 rounded-2xl bg-[#D8ECE0]/50 border border-[#A3D9B5] space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#1B4D3E]" />
          <span className="m3-label-large text-[#052119]">Quick-Fill Benchmark Locations</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {PRESET_LOCATIONS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyPreset(preset)}
              className="p-2.5 rounded-xl bg-white border border-[#C1C9C3] text-left hover:border-[#1B4D3E] hover:bg-[#F0F4EF] transition-all cursor-pointer"
            >
              <p className="m3-label-large text-[#191C1A] truncate">{preset.name.split(" ")[0]}</p>
              <p className="m3-label-medium text-[#1B4D3E] font-semibold">{preset.tag}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 rounded-3xl bg-[#F0F4EF] border border-[#E0E4DF] space-y-5 shadow-sm">
        {error && (
          <div className="p-4 rounded-2xl bg-[#FFDAD6] border border-[#FFB4AB] text-[#410E0B] text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Farm Name */}
        <div>
          <label className="m3-label-medium text-[#191C1A] block mb-1 font-semibold">
            Farm Name *
          </label>
          <div className="relative">
            <Sprout className="w-5 h-5 absolute left-3.5 top-3.5 text-[#717973]" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Lokoja Confluence Farm"
              className="w-full h-12 pl-11 pr-4 rounded-2xl bg-white border border-[#C1C9C3] text-[#191C1A] m3-body-medium focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]"
            />
          </div>
        </div>

        {/* Owner Name */}
        <div>
          <label className="m3-label-medium text-[#191C1A] block mb-1 font-semibold">
            Farmer / Owner Name
          </label>
          <div className="relative">
            <User className="w-5 h-5 absolute left-3.5 top-3.5 text-[#717973]" />
            <input
              type="text"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full h-12 pl-11 pr-4 rounded-2xl bg-white border border-[#C1C9C3] text-[#191C1A] m3-body-medium focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]"
            />
          </div>
        </div>

        {/* Coordinates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="m3-label-medium text-[#191C1A] block mb-1 font-semibold">
              Latitude (-90 to 90) *
            </label>
            <div className="relative">
              <MapPin className="w-5 h-5 absolute left-3.5 top-3.5 text-[#717973]" />
              <input
                type="number"
                step="any"
                required
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="7.8023"
                className="w-full h-12 pl-11 pr-4 rounded-2xl bg-white border border-[#C1C9C3] text-[#191C1A] m3-body-medium focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]"
              />
            </div>
          </div>

          <div>
            <label className="m3-label-medium text-[#191C1A] block mb-1 font-semibold">
              Longitude (-180 to 180) *
            </label>
            <div className="relative">
              <MapPin className="w-5 h-5 absolute left-3.5 top-3.5 text-[#717973]" />
              <input
                type="number"
                step="any"
                required
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="6.7333"
                className="w-full h-12 pl-11 pr-4 rounded-2xl bg-white border border-[#C1C9C3] text-[#191C1A] m3-body-medium focus:outline-none focus:ring-2 focus:ring-[#1B4D3E]"
              />
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

        {/* Progress status step */}
        {statusStep && (
          <div className="p-3 rounded-xl bg-[#D8ECE0] text-[#052119] text-xs font-semibold flex items-center gap-2 animate-pulse">
            <Sparkles className="w-4 h-4 text-[#1B4D3E]" />
            <span>{statusStep}</span>
          </div>
        )}

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
            Run Initial Risk Evaluation
          </Button>
        </div>
      </form>
    </div>
  );
};
