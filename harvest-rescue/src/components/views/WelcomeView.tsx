"use client";

import React from "react";
import { ArrowRight, Sprout, ShieldCheck, AlertOctagon, AlertTriangle, TrendingDown, MapPin, Eye } from "lucide-react";
import { Button } from "../ui/Button";

export interface WelcomeViewProps {
  onStartSetup: () => void;
  onSelectDemoFarm?: (farmName: string) => void;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({ onStartSetup, onSelectDemoFarm }) => {
  const benchmarkScenarios = [
    {
      name: "Majek Farms Kaduna",
      location: "Kaduna Grain Belt",
      crop: "Maize · 8.5 ha",
      scenarioBadge: "Stable Guinea Savannah",
      badgeColor: "bg-[#D8ECE0] text-[#052119] border-[#1B4D3E]/30",
      icon: <ShieldCheck className="w-4 h-4 text-[#1B4D3E]" />,
      summary: "Guinea Savannah: Favorable moisture and stable canopy development across vegetative stages.",
      callToAction: "View Kaduna Baseline",
    },
    {
      name: "Adum, Yala LGA",
      location: "Yala LGA, Cross River",
      crop: "Rice · 2.2 ha",
      scenarioBadge: "Rising Soil Moisture Zone",
      badgeColor: "bg-[#FFDCC2] text-[#341200] border-[#8B5000]/30",
      icon: <AlertTriangle className="w-4 h-4 text-[#8B5000]" />,
      summary: "River basin: Cumulative precipitation climbing toward paddy threshold. Deserves water inlet regulation.",
      callToAction: "View Adum Emerging Risk",
    },
    {
      name: "Shiroro Mokwa",
      location: "Mokwa, Niger State",
      crop: "Sorghum · 2.0 ha",
      scenarioBadge: "Moisture Deficit & Thermal Advisory",
      badgeColor: "bg-[#FFDCC2] text-[#341200] border-[#8B5000]/30",
      icon: <AlertTriangle className="w-4 h-4 text-[#8B5000]" />,
      summary: "Southern Guinea Savannah: Elevated evaporative demand and low root moisture in central ridge sector.",
      callToAction: "View Mokwa Risk Alert",
    },
    {
      name: "Riverside Farm",
      location: "Omuma, Rivers State",
      crop: "Maize · 1.4 ha",
      scenarioBadge: "Imminent Flood Risk (48h)",
      badgeColor: "bg-[#FFDAD6] text-[#410E0B] border-[#BA1A1A]/30",
      icon: <AlertOctagon className="w-4 h-4 text-[#BA1A1A]" />,
      summary: "Rainforest belt: 49%+ root moisture with intense rain forecast. Lower drainage furrows at high risk.",
      callToAction: "View Riverside Risk",
    },
    {
      name: "Jos Plateau Farm",
      location: "Jos, Plateau State",
      crop: "Maize · 6.5 ha",
      scenarioBadge: "Stable Midland Climate",
      badgeColor: "bg-[#D8ECE0] text-[#052119] border-[#1B4D3E]/30",
      icon: <ShieldCheck className="w-4 h-4 text-[#1B4D3E]" />,
      summary: "Highland temperate zone: Balanced moisture, mild 26°C peak temps, and vigorous vegetative vigor.",
      callToAction: "View Plateau Baseline",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12 space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-5">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D8ECE0] text-[#052119] border border-[#A3D9B5]">
          <Sprout className="w-4 h-4 text-[#1B4D3E]" />
          <span className="text-xs font-bold uppercase tracking-wider">
            Continuous Agricultural Risk Intelligence &amp; Early Warning
          </span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-[#191C1A] max-w-3xl mx-auto tracking-tight leading-tight">
          Protect your harvest before risks become irreversible losses.
        </h1>

        <p className="text-base sm:text-lg text-[#414943] max-w-2xl mx-auto leading-relaxed">
          Harvest Rescue continuously evaluates weather patterns, soil moisture, and crop canopy health to give farmers 1–2 weeks advance warning and concrete action steps.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Button
            size="lg"
            variant="filled"
            onClick={onStartSetup}
            rightIcon={<ArrowRight className="w-5 h-5" />}
            className="w-full sm:w-auto shadow-lg text-base font-bold py-3.5 px-8"
          >
            Register Your Farm
          </Button>
        </div>
      </div>

      {/* Realistic Benchmark Scenarios */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#191C1A]">
              Live Agronomic Benchmark Scenarios
            </h2>
            <p className="text-xs sm:text-sm text-[#717973]">
              Explore realistic farm scenarios demonstrating how Harvest Rescue detects, interprets, and warns of changing conditions.
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#E0E4DF] text-[#414943] self-start sm:self-center">
            5 Distinct Risk States
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {benchmarkScenarios.map((demo, idx) => (
            <div
              key={idx}
              className="p-5 rounded-3xl bg-[#F0F4EF] border border-[#E0E4DF] flex flex-col justify-between space-y-4 hover:border-[#1B4D3E] hover:shadow-md transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full border ${demo.badgeColor}`}
                  >
                    {demo.icon}
                    <span>{demo.scenarioBadge}</span>
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-[#191C1A]">{demo.name}</h3>
                  <p className="text-xs text-[#717973] flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-[#1B4D3E]" />
                    <span>{demo.location} · {demo.crop}</span>
                  </p>
                </div>

                <p className="text-xs text-[#414943] leading-relaxed pt-1 border-t border-[#E0E4DF]">
                  {demo.summary}
                </p>
              </div>

              {onSelectDemoFarm && (
                <Button
                  variant="tonal"
                  size="sm"
                  onClick={() => onSelectDemoFarm(demo.name)}
                  leftIcon={<Eye className="w-4 h-4 text-[#1B4D3E]" />}
                  className="w-full justify-center bg-white text-xs font-bold"
                >
                  {demo.callToAction}
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WelcomeView;
