"use client";

import React, { useState, useEffect } from "react";
import { Alert, Farm } from "@/lib/types";
import { api } from "@/lib/api";
import { TopAppBar } from "@/components/ui/TopAppBar";
import { WelcomeView } from "@/components/views/WelcomeView";
import { FarmSetupView } from "@/components/views/FarmSetupView";
import { FarmDashboardView } from "@/components/views/FarmDashboardView";
import { AlertsModal } from "@/components/ui/AlertsModal";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { Sprout } from "lucide-react";

const USER_FARMS_STORAGE_KEY = "harvest_rescue_user_farms";

export const FALLBACK_DEMO_FARMS: Farm[] = [
  {
    id: "demo-majek-kaduna",
    name: "Majek farms kaduna",
    owner_name: "Demo Farmer - Kaduna",
    latitude: 10.486619,
    longitude: 7.443472,
    elevation: 578.0,
    crop_type: "maize",
    planting_date: "2026-05-20",
    is_demo: true,
    created_at: "2026-05-20T00:00:00Z",
  },
  {
    id: "demo-adum-yala",
    name: "Adum, Yala LGA",
    owner_name: "Demo Farmer - Yala",
    latitude: 6.642178,
    longitude: 8.357275,
    elevation: 78.0,
    crop_type: "rice",
    planting_date: "2026-06-01",
    is_demo: true,
    created_at: "2026-06-01T00:00:00Z",
  },
  {
    id: "demo-shiroro-mokwa",
    name: "Shiroro Mokwa",
    owner_name: "Demo Farmer - Niger",
    latitude: 9.982164,
    longitude: 6.809422,
    elevation: 278.0,
    crop_type: "sorghum",
    planting_date: "2026-06-15",
    is_demo: true,
    created_at: "2026-06-15T00:00:00Z",
  },
];

export default function Home() {
  const [allFarms, setAllFarms] = useState<Farm[]>(FALLBACK_DEMO_FARMS);
  const [userFarmIds, setUserFarmIds] = useState<string[]>([]);
  const [currentFarm, setCurrentFarm] = useState<Farm | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [activeTab, setActiveTab] = useState<"welcome" | "setup" | "dashboard">("welcome");
  const [isLoadingFarms, setIsLoadingFarms] = useState<boolean>(true);
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState<boolean>(false);
  const [isSweeping, setIsSweeping] = useState<boolean>(false);

  // Initialize userFarmIds from localStorage on client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(USER_FARMS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setUserFarmIds(parsed);
        }
      }
    } catch {
      // ignore JSON parse errors
    }
  }, []);

  // Compute visible farms for the current session:
  // - If new unregistered user: sees ONLY demo benchmark farms (is_demo: true)
  // - If registered user: sees their registered farm(s) + demo benchmark farms
  const visibleFarms = allFarms.filter(
    (f) => f.is_demo || userFarmIds.includes(f.id)
  );

  const loadFarms = async (autoSelectId?: string) => {
    setIsLoadingFarms(true);
    try {
      const fetchedFarms = await api.listFarms();
      if (fetchedFarms && fetchedFarms.length > 0) {
        setAllFarms(fetchedFarms);

        if (autoSelectId) {
          const match = fetchedFarms.find((f) => f.id === autoSelectId);
          if (match) {
            setCurrentFarm(match);
            setActiveTab("dashboard");
          }
        }
      }
    } catch (err) {
      console.warn("Could not fetch farms from backend API, using benchmark fallback:", err);
    } finally {
      setIsLoadingFarms(false);
    }
  };

  const loadAlerts = async () => {
    try {
      const fetchedAlerts = await api.listAlerts();
      setAlerts(fetchedAlerts);
    } catch (err) {
      console.warn("Could not fetch alerts:", err);
    }
  };

  useEffect(() => {
    loadFarms();
    loadAlerts();
  }, []);

  const handleTriggerSweep = async () => {
    setIsSweeping(true);
    try {
      await api.triggerSweep();
      await Promise.all([loadFarms(currentFarm?.id), loadAlerts()]);
    } catch (err) {
      console.error("Monitoring sweep error:", err);
    } finally {
      setIsSweeping(false);
    }
  };

  const handleFarmCreated = (newFarm: Farm) => {
    // Save to userFarmIds in localStorage
    const updatedUserFarms = [newFarm.id, ...userFarmIds.filter((id) => id !== newFarm.id)];
    setUserFarmIds(updatedUserFarms);
    try {
      localStorage.setItem(USER_FARMS_STORAGE_KEY, JSON.stringify(updatedUserFarms));
    } catch {
      // ignore
    }

    setAllFarms((prev) => [newFarm, ...prev]);
    setCurrentFarm(newFarm);
    setActiveTab("dashboard");
    loadAlerts();
  };

  const handleDeleteFarm = async (farmId: string) => {
    try {
      await api.deleteFarm(farmId);
      
      // Remove from userFarmIds and localStorage
      const updatedUserFarms = userFarmIds.filter((id) => id !== farmId);
      setUserFarmIds(updatedUserFarms);
      try {
        localStorage.setItem(USER_FARMS_STORAGE_KEY, JSON.stringify(updatedUserFarms));
      } catch {
        // ignore
      }

      const remainingAll = allFarms.filter((f) => f.id !== farmId);
      setAllFarms(remainingAll);

      const remainingVisible = remainingAll.filter(
        (f) => f.is_demo || updatedUserFarms.includes(f.id)
      );

      if (currentFarm?.id === farmId) {
        if (remainingVisible.length > 0) {
          setCurrentFarm(remainingVisible[0]);
        } else {
          setCurrentFarm(null);
          setActiveTab("welcome");
        }
      }
      loadAlerts();
    } catch (err: any) {
      alert(err.message || "Failed to delete farm.");
    }
  };

  const handleSelectDemoFarm = (farmName: string) => {
    const searchPool = allFarms.length > 0 ? allFarms : FALLBACK_DEMO_FARMS;
    const nameLower = farmName.toLowerCase();
    
    let demo = searchPool.find(
      (f) => f.is_demo && f.name.toLowerCase() === nameLower
    );
    
    if (!demo) {
      demo = searchPool.find(
        (f) =>
          f.is_demo &&
          (f.name.toLowerCase().includes(nameLower.split(" ")[0]) ||
           nameLower.includes(f.name.toLowerCase().split(" ")[0]))
      );
    }

    if (!demo) {
      demo = FALLBACK_DEMO_FARMS.find((f) => f.name.toLowerCase().includes(nameLower.split(" ")[0]));
    }

    if (demo) {
      setCurrentFarm(demo);
      setActiveTab("dashboard");
    }
  };

  const unreadAlertsCount = alerts.filter((a) => a.status === "unread").length;

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFDFA] text-[#191C1A]">
      <TopAppBar
        farms={visibleFarms}
        currentFarm={currentFarm}
        onSelectFarm={(farm) => {
          setCurrentFarm(farm);
          setActiveTab("dashboard");
        }}
        onNavigateToSetup={() => {
          setActiveTab("setup");
        }}
        onNavigateToHome={() => setActiveTab("welcome")}
        onDeleteFarm={handleDeleteFarm}
        onOpenAlerts={() => setIsAlertsModalOpen(true)}
        unreadAlertsCount={unreadAlertsCount}
        activeTab={activeTab}
      />

      <main className="flex-1 pb-16">
        {isLoadingFarms && allFarms.length === 0 ? (
          <div className="max-w-2xl mx-auto px-4 py-12 space-y-5">
            <div className="flex items-center gap-2 text-[#1B4D3E] font-bold text-sm">
              <Sprout className="w-5 h-5 animate-spin" />
              <span>Connecting to Harvest Rescue AI &amp; loading farms...</span>
            </div>
            {/* Feed Skeleton matching requested screenshot */}
            <SkeletonCard count={3} />
          </div>
        ) : (
          <>
            {activeTab === "welcome" && (
              <WelcomeView
                onStartSetup={() => {
                  setActiveTab("setup");
                }}
                onSelectDemoFarm={handleSelectDemoFarm}
              />
            )}

            {activeTab === "setup" && (
              <FarmSetupView
                onFarmCreated={handleFarmCreated}
                onCancel={() => {
                  if (currentFarm) setActiveTab("dashboard");
                  else setActiveTab("welcome");
                }}
              />
            )}

            {activeTab === "dashboard" && currentFarm && (
              <FarmDashboardView
                farm={currentFarm}
                onNavigateToSetup={() => {
                  setActiveTab("setup");
                }}
                onDeleteFarm={handleDeleteFarm}
              />
            )}
          </>
        )}
      </main>

      {/* Persistent Alerts Modal / Drawer */}
      <AlertsModal
        isOpen={isAlertsModalOpen}
        onClose={() => setIsAlertsModalOpen(false)}
        alerts={alerts}
        farms={visibleFarms}
        onAlertUpdated={loadAlerts}
        onTriggerSweep={handleTriggerSweep}
        isSweeping={isSweeping}
      />

      {/* Material 3 Bottom Footer */}
      <footer className="border-t border-[#E0E4DF] bg-[#F0F4EF] py-6 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#717973]">
          <p>© 2026 Harvest Rescue AI — Continuous Agronomic Monitoring &amp; Early Warning</p>
          <div className="flex items-center gap-4">
            <span>Sentinel-2 GEE &amp; Open-Meteo Feed</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
