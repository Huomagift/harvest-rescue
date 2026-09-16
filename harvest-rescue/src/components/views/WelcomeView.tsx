import React from "react";
import { CloudSun, Satellite, ShieldAlert, CheckCircle2, ArrowRight, Sprout, MapPin, Zap } from "lucide-react";
import { Button } from "../ui/Button";

export interface WelcomeViewProps {
  onStartSetup: () => void;
  onSelectPresetFarm?: (name: string, lat: number, lng: number, crop: string) => void;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({
  onStartSetup,
  onSelectPresetFarm,
}) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D8ECE0] text-[#052119] border border-[#A3D9B5]">
          <Sprout className="w-4 h-4 text-[#1B4D3E]" />
          <span className="m3-label-large">AI-Powered Agronomic Early Warning</span>
        </div>

        <h1 className="m3-display-medium text-[#191C1A] max-w-2xl mx-auto tracking-tight font-extrabold">
          Know the risk <span className="text-[#1B4D3E]">before</span> you lose the harvest.
        </h1>

        <p className="m3-body-large text-[#414943] max-w-xl mx-auto">
          Harvest Rescue AI fuses high-resolution satellite imagery (Sentinel-2 NDVI) with real-time weather forecasts to protect smallholder yield from floods, heatwaves, and crop vigor decline.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Button
            size="lg"
            variant="filled"
            onClick={onStartSetup}
            rightIcon={<ArrowRight className="w-5 h-5" />}
            className="w-full sm:w-auto shadow-lg"
          >
            Register Your Farm
          </Button>

          {onSelectPresetFarm && (
            <Button
              size="lg"
              variant="tonal"
              onClick={() => onSelectPresetFarm("Lokoja Confluence Farm", 7.8023, 6.7333, "maize")}
              leftIcon={<Zap className="w-5 h-5 text-[#1B4D3E]" />}
              className="w-full sm:w-auto"
            >
              Test Demo Farm (Flood Risk)
            </Button>
          )}
        </div>
      </div>

      {/* Value Proposition Workflow Cards */}
      <div className="space-y-4">
        <h2 className="m3-title-large text-[#191C1A] text-center font-bold">
          How Harvest Rescue AI Works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Step 1 */}
          <div className="p-5 rounded-3xl bg-[#F0F4EF] border border-[#E0E4DF] flex flex-col justify-between space-y-4 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-2xl bg-[#1B4D3E] text-white flex items-center justify-center">
              <CloudSun className="w-5 h-5" />
            </div>
            <div>
              <span className="m3-label-medium text-[#717973] uppercase tracking-wider block mb-1">
                Step 01
              </span>
              <h3 className="m3-title-medium text-[#191C1A] mb-1">Weather Ingestion</h3>
              <p className="m3-body-medium text-[#414943]">
                Monitors 48h precipitation, temperature extreme thresholds, and storm paths.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-5 rounded-3xl bg-[#F0F4EF] border border-[#E0E4DF] flex flex-col justify-between space-y-4 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-2xl bg-[#2D6A4F] text-white flex items-center justify-center">
              <Satellite className="w-5 h-5" />
            </div>
            <div>
              <span className="m3-label-medium text-[#717973] uppercase tracking-wider block mb-1">
                Step 02
              </span>
              <h3 className="m3-title-medium text-[#191C1A] mb-1">Satellite NDVI</h3>
              <p className="m3-body-medium text-[#414943]">
                Scans multispectral Sentinel-2 imagery to track 14-day crop canopy vigor trends.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-5 rounded-3xl bg-[#F0F4EF] border border-[#E0E4DF] flex flex-col justify-between space-y-4 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-2xl bg-[#8B5000] text-white flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="m3-label-medium text-[#717973] uppercase tracking-wider block mb-1">
                Step 03
              </span>
              <h3 className="m3-title-medium text-[#191C1A] mb-1">Risk Evaluation</h3>
              <p className="m3-body-medium text-[#414943]">
                Calculates composite risk scores for flood, drought stress, and canopy decline.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="p-5 rounded-3xl bg-[#F0F4EF] border border-[#E0E4DF] flex flex-col justify-between space-y-4 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-2xl bg-[#1B4D3E] text-white flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="m3-label-medium text-[#717973] uppercase tracking-wider block mb-1">
                Step 04
              </span>
              <h3 className="m3-title-medium text-[#191C1A] mb-1">Prescriptive Action</h3>
              <p className="m3-body-medium text-[#414943]">
                Delivers practical agronomic steps to protect crops before damage spreads.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Seed Farm Quick Selectors */}
      <div className="p-6 rounded-3xl bg-[#D8ECE0]/40 border border-[#A3D9B5] space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-[#1B4D3E]" />
          <h3 className="m3-title-medium text-[#052119]">Explore Real Agronomic Scenarios</h3>
        </div>
        <p className="m3-body-medium text-[#052119]/80">
          Try these pre-configured benchmark locations to observe real-time risk engine responses:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <button
            onClick={() => onSelectPresetFarm && onSelectPresetFarm("Lokoja Confluence Farm", 7.8023, 6.7333, "maize")}
            className="p-4 rounded-2xl bg-white border border-[#A3D9B5] text-left hover:border-[#1B4D3E] transition-all shadow-xs group cursor-pointer"
          >
            <span className="m3-label-large text-[#1B4D3E] block group-hover:underline">Lokoja Farm</span>
            <span className="m3-label-medium text-[#BA1A1A] font-bold block mt-1">High Flood Exposure</span>
            <span className="m3-label-medium text-[#717973]">Maize • Lat 7.80, Lng 6.73</span>
          </button>

          <button
            onClick={() => onSelectPresetFarm && onSelectPresetFarm("Kaduna Maize Belt Farm", 10.5105, 7.4165, "maize")}
            className="p-4 rounded-2xl bg-white border border-[#A3D9B5] text-left hover:border-[#1B4D3E] transition-all shadow-xs group cursor-pointer"
          >
            <span className="m3-label-large text-[#1B4D3E] block group-hover:underline">Kaduna Farm</span>
            <span className="m3-label-medium text-[#8B5000] font-bold block mt-1">Vigor Decline Alert</span>
            <span className="m3-label-medium text-[#717973]">Maize • Lat 10.51, Lng 7.41</span>
          </button>

          <button
            onClick={() => onSelectPresetFarm && onSelectPresetFarm("Makurdi Riverside Farm", 7.7322, 8.5391, "rice")}
            className="p-4 rounded-2xl bg-white border border-[#A3D9B5] text-left hover:border-[#1B4D3E] transition-all shadow-xs group cursor-pointer"
          >
            <span className="m3-label-large text-[#1B4D3E] block group-hover:underline">Makurdi Farm</span>
            <span className="m3-label-medium text-[#1B4D3E] font-bold block mt-1">Normal / Control Farm</span>
            <span className="m3-label-medium text-[#717973]">Rice • Lat 7.73, Lng 8.54</span>
          </button>
        </div>
      </div>
    </div>
  );
};
