"use client";

import React from "react";
import { CloudSun, Satellite, Sliders, ArrowRight, Sprout, ShieldCheck, MapPin, Layers } from "lucide-react";
import { Button } from "../ui/Button";

export interface WelcomeViewProps {
  onStartSetup: () => void;
  onSelectDemoFarm?: (farmName: string) => void;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({ onStartSetup, onSelectDemoFarm }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D8ECE0] text-[#052119] border border-[#A3D9B5]">
          <Sprout className="w-4 h-4 text-[#1B4D3E]" />
          <span className="m3-label-large">Continuous Agronomic Early Warning System</span>
        </div>

        <h1 className="m3-display-medium text-[#191C1A] max-w-2xl mx-auto tracking-tight font-extrabold">
          Predict crop risks 1-2 weeks ahead with Harvest Rescue.
        </h1>

        <p className="m3-body-large text-[#414943] max-w-xl mx-auto">
          Register your farm to start continuous predictive monitoring. Harvest Rescue tracks 16-day rainfall horizons, temperature extremes, and satellite canopy vigor to protect your harvest.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Button
            size="lg"
            variant="filled"
            onClick={onStartSetup}
            rightIcon={<ArrowRight className="w-5 h-5" />}
            className="w-full sm:w-auto shadow-lg text-base font-bold py-3 px-6"
          >
            Register Your Farm (Farmer Onboarding)
          </Button>
        </div>
      </div>

      {/* Demo Benchmark Farms Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="m3-title-large text-[#191C1A] font-bold">
              Benchmark Demo Farms
            </h2>
            <p className="text-xs text-[#717973]">
              Pre-configured field locations with genuine agronomic data and elevations.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#E0E4DF] text-[#414943]">
            3 Verified Basins
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Demo Farm 1 */}
          <div className="p-5 rounded-3xl bg-[#F0F4EF] border border-[#E0E4DF] flex flex-col justify-between space-y-3 hover:border-[#1B4D3E] transition-all">
            <div>
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#1B4D3E] text-white">
                  Kaduna
                </span>
                <span className="text-xs font-bold text-[#1B4D3E]">578 m</span>
              </div>
              <h3 className="m3-title-medium text-[#191C1A] font-bold">Majek farms kaduna</h3>
              <p className="m3-body-medium text-xs text-[#414943] mt-1 font-mono">
                10°29'11.83"N 7°26'36.50"E
              </p>
              <p className="text-xs text-[#717973] mt-1">
                Maize grain belt — Sentinel-2 vigor scanning.
              </p>
            </div>
            {onSelectDemoFarm && (
              <Button
                variant="tonal"
                size="sm"
                onClick={() => onSelectDemoFarm("Majek farms kaduna")}
                leftIcon={<Layers className="w-3.5 h-3.5" />}
                className="w-full justify-center bg-white text-xs"
              >
                View Kaduna Demo
              </Button>
            )}
          </div>

          {/* Demo Farm 2 */}
          <div className="p-5 rounded-3xl bg-[#F0F4EF] border border-[#E0E4DF] flex flex-col justify-between space-y-3 hover:border-[#1B4D3E] transition-all">
            <div>
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#2D6A4F] text-white">
                  Cross River
                </span>
                <span className="text-xs font-bold text-[#2D6A4F]">78 m</span>
              </div>
              <h3 className="m3-title-medium text-[#191C1A] font-bold">Adum, Yala LGA</h3>
              <p className="m3-body-medium text-xs text-[#414943] mt-1 font-mono">
                6°38'31.84"N 8°21'26.19"E
              </p>
              <p className="text-xs text-[#717973] mt-1">
                River basin rice fields — Flood &amp; rain tracking.
              </p>
            </div>
            {onSelectDemoFarm && (
              <Button
                variant="tonal"
                size="sm"
                onClick={() => onSelectDemoFarm("Adum, Yala LGA")}
                leftIcon={<Layers className="w-3.5 h-3.5" />}
                className="w-full justify-center bg-white text-xs"
              >
                View Yala Demo
              </Button>
            )}
          </div>

          {/* Demo Farm 3 */}
          <div className="p-5 rounded-3xl bg-[#F0F4EF] border border-[#E0E4DF] flex flex-col justify-between space-y-3 hover:border-[#1B4D3E] transition-all">
            <div>
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#8B5000] text-white">
                  Niger State
                </span>
                <span className="text-xs font-bold text-[#8B5000]">278 m</span>
              </div>
              <h3 className="m3-title-medium text-[#191C1A] font-bold">Shiroro Mokwa</h3>
              <p className="m3-body-medium text-xs text-[#414943] mt-1 font-mono">
                9°58'55.79"N 6°48'33.92"E
              </p>
              <p className="text-xs text-[#717973] mt-1">
                Shiroro basin sorghum — Temperature &amp; drought alert.
              </p>
            </div>
            {onSelectDemoFarm && (
              <Button
                variant="tonal"
                size="sm"
                onClick={() => onSelectDemoFarm("Shiroro Mokwa")}
                leftIcon={<Layers className="w-3.5 h-3.5" />}
                className="w-full justify-center bg-white text-xs"
              >
                View Mokwa Demo
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* How It Works: 3 Pillar Workflow Cards */}
      <div className="space-y-4">
        <h2 className="m3-title-large text-[#191C1A] text-center font-bold">
          The Harvest Rescue AI Early Warning System
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Step 1 */}
          <div className="p-5 rounded-3xl bg-[#F0F4EF] border border-[#E0E4DF] flex flex-col justify-between space-y-4 shadow-xs">
            <div className="w-10 h-10 rounded-2xl bg-[#1B4D3E] text-white flex items-center justify-center">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <span className="m3-label-medium text-[#717973] uppercase tracking-wider block mb-1">
                Step 01
              </span>
              <h3 className="m3-title-medium text-[#191C1A] mb-1">Farm Registration</h3>
              <p className="m3-body-medium text-xs text-[#414943]">
                Register with your exact field coordinates, crop type, and planting dates.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-5 rounded-3xl bg-[#F0F4EF] border border-[#E0E4DF] flex flex-col justify-between space-y-4 shadow-xs">
            <div className="w-10 h-10 rounded-2xl bg-[#2D6A4F] text-white flex items-center justify-center">
              <Satellite className="w-5 h-5" />
            </div>
            <div>
              <span className="m3-label-medium text-[#717973] uppercase tracking-wider block mb-1">
                Step 02
              </span>
              <h3 className="m3-title-medium text-[#191C1A] mb-1">16-Day Forecast &amp; GEE</h3>
              <p className="m3-body-medium text-xs text-[#414943]">
                Continuous monitoring scans day-by-day to detect extreme rainfall, heatwaves, or canopy loss.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-5 rounded-3xl bg-[#F0F4EF] border border-[#E0E4DF] flex flex-col justify-between space-y-4 shadow-xs">
            <div className="w-10 h-10 rounded-2xl bg-[#8B5000] text-white flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <span className="m3-label-medium text-[#717973] uppercase tracking-wider block mb-1">
                Step 03
              </span>
              <h3 className="m3-title-medium text-[#191C1A] mb-1">Threshold Comparison</h3>
              <p className="m3-body-medium text-xs text-[#414943]">
                Directly compare live weather &amp; satellite metrics against safety thresholds (40mm rain, 35°C temp).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeView;
