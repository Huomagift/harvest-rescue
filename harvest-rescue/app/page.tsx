"use client";

import React, { useState, useEffect } from "react";
import { Farm } from "@/lib/types";
import { api } from "@/lib/api";
import { TopAppBar } from "@/components/ui/TopAppBar";
import { WelcomeView } from "@/components/views/WelcomeView";
import { FarmSetupView } from "@/components/views/FarmSetupView";
import { FarmDashboardView } from "@/components/views/FarmDashboardView";
import { Loader2 } from "lucide-react";

export default function Home() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [currentFarm, setCurrentFarm] = useState<Farm | null>(null);
  const [activeTab, setActiveTab] = useState<"welcome" | "setup" | "dashboard">("dashboard");
  const [isLoadingFarms, setIsLoadingFarms] = useState<boolean>(true);
  const [presetConfig, setPresetConfig] = useState<{
    name: string;
    latitude: number;
    longitude: number;
    crop_type: string;
  } | null>(null);

  const loadFarms = async (autoSelectId?: string) => {
    setIsLoadingFarms(true);
    try {
      const fetchedFarms = await api.listFarms();
      setFarms(fetchedFarms);

      if (fetchedFarms.length > 0) {
        if (autoSelectId) {
          const match = fetchedFarms.find((f) => f.id === autoSelectId);
          if (match) setCurrentFarm(match);
          else setCurrentFarm(fetchedFarms[0]);
        } else if (!currentFarm) {
          setCurrentFarm(fetchedFarms[0]);
        }
        if (activeTab === "welcome" && !presetConfig) {
          setActiveTab("dashboard");
        }
      } else {
        setActiveTab("welcome");
      }
    } catch (err) {
      console.warn("Could not fetch farms from backend API:", err);
      setActiveTab("welcome");
    } finally {
      setIsLoadingFarms(false);
    }
  };

  useEffect(() => {
    loadFarms();
  }, []);

  const handleSelectPreset = (name: string, lat: number, lng: number, crop: string) => {
    setPresetConfig({
      name,
      latitude: lat,
      longitude: lng,
      crop_type: crop,
    });
    setActiveTab("setup");
  };

  const handleFarmCreated = (newFarm: Farm) => {
    setFarms((prev) => [newFarm, ...prev]);
    setCurrentFarm(newFarm);
    setPresetConfig(null);
    setActiveTab("dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFDFA] text-[#191C1A]">
      <TopAppBar
        farms={farms}
        currentFarm={currentFarm}
        onSelectFarm={(farm) => {
          setCurrentFarm(farm);
          setActiveTab("dashboard");
        }}
        onNavigateToSetup={() => {
          setPresetConfig(null);
          setActiveTab("setup");
        }}
        onNavigateToHome={() => setActiveTab("welcome")}
        activeTab={activeTab}
      />

      <main className="flex-1 pb-16">
        {isLoadingFarms && farms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-[#1B4D3E]">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="m3-label-large">Connecting to Harvest Rescue AI...</span>
          </div>
        ) : (
          <>
            {activeTab === "welcome" && (
              <WelcomeView
                onStartSetup={() => {
                  setPresetConfig(null);
                  setActiveTab("setup");
                }}
                onSelectPresetFarm={handleSelectPreset}
              />
            )}

            {activeTab === "setup" && (
              <FarmSetupView
                onFarmCreated={handleFarmCreated}
                onCancel={() => {
                  if (currentFarm) setActiveTab("dashboard");
                  else setActiveTab("welcome");
                }}
                initialPreset={presetConfig}
              />
            )}

            {activeTab === "dashboard" && currentFarm && (
              <FarmDashboardView
                farm={currentFarm}
                onNavigateToSetup={() => {
                  setPresetConfig(null);
                  setActiveTab("setup");
                }}
              />
            )}
          </>
        )}
      </main>

      {/* Material 3 Bottom Footer */}
      <footer className="border-t border-[#E0E4DF] bg-[#F0F4EF] py-6 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#717973]">
          <p>© 2026 Harvest Rescue AI — Agronomic Early Warning System</p>
          <div className="flex items-center gap-4">
            <span>Sentinel-2 Satellite Feed</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
