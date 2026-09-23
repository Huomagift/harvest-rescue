"use client";

import React, { useState, useEffect } from "react";
import { Alert, Farm } from "@/lib/types";
import { api, UserProfile } from "@/lib/api";
import { TopAppBar } from "@/components/ui/TopAppBar";
import { WelcomeView } from "@/components/views/WelcomeView";
import { FarmSetupView } from "@/components/views/FarmSetupView";
import { FarmDashboardView } from "@/components/views/FarmDashboardView";
import { FarmerOverviewView } from "@/components/views/FarmerOverviewView";
import { AlertsModal } from "@/components/ui/AlertsModal";
import { AuthModal } from "@/components/ui/AuthModal";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { Sprout } from "lucide-react";

export const FALLBACK_DEMO_FARMS: Farm[] = [
  {
    id: "demo-majek-kaduna",
    name: "Majek Farms Kaduna",
    owner_name: "Alhaji Majekodunmi & Sons",
    farmer_email: "operations@majek-kaduna.com",
    location_name: "Kaduna Grain Belt",
    latitude: 10.486619,
    longitude: 7.443472,
    elevation: 578.0,
    crop_type: "maize",
    size_hectares: 8.5,
    planting_date: "2026-05-20",
    is_demo: true,
    created_at: "2026-05-20T00:00:00Z",
    boundary_geojson: {
      type: "Polygon",
      coordinates: [[
        [7.4422, 10.4879],
        [7.4447, 10.4879],
        [7.4447, 10.4853],
        [7.4422, 10.4853],
        [7.4422, 10.4879],
      ]],
    },
    risk_zones: [],
  },
  {
    id: "demo-adum-yala",
    name: "Adum, Yala LGA",
    owner_name: "Adum Rice Growers Association",
    farmer_email: "monitoring@adum-rice.org",
    location_name: "Yala LGA, Cross River",
    latitude: 6.642178,
    longitude: 8.357275,
    elevation: 78.0,
    crop_type: "rice",
    size_hectares: 2.2,
    planting_date: "2026-06-01",
    is_demo: true,
    created_at: "2026-06-01T00:00:00Z",
    boundary_geojson: {
      type: "Polygon",
      coordinates: [[
        [8.3566, 6.6428],
        [8.3580, 6.6428],
        [8.3580, 6.6415],
        [8.3566, 6.6415],
        [8.3566, 6.6428],
      ]],
    },
    risk_zones: [
      {
        zone_name: "Northern Paddy Inlet",
        risk_type: "flood",
        severity: "medium",
        label: "Rising Soil Moisture Zone",
        coordinates: [
          [8.3568, 6.6426],
          [8.3578, 6.6426],
          [8.3578, 6.6420],
          [8.3568, 6.6420],
          [8.3568, 6.6426],
        ],
      },
    ],
  },
  {
    id: "demo-shiroro-mokwa",
    name: "Shiroro Mokwa",
    owner_name: "Sunrise Agro-Allied Ltd",
    farmer_email: "agronomy@sunrise-mokwa.ng",
    location_name: "Mokwa, Niger State",
    latitude: 9.982164,
    longitude: 6.809422,
    elevation: 278.0,
    crop_type: "sorghum",
    size_hectares: 2.0,
    planting_date: "2026-06-15",
    is_demo: true,
    created_at: "2026-06-15T00:00:00Z",
    boundary_geojson: {
      type: "Polygon",
      coordinates: [[
        [6.8087, 9.9828],
        [6.8101, 9.9828],
        [6.8101, 9.9815],
        [6.8087, 9.9815],
        [6.8087, 9.9828],
      ]],
    },
    risk_zones: [
      {
        zone_name: "Central Ridge Sector",
        risk_type: "drought_heat",
        severity: "medium",
        label: "Moisture Deficit & Evaporative Stress Zone",
        coordinates: [
          [6.8090, 9.9825],
          [6.8098, 9.9825],
          [6.8098, 9.9818],
          [6.8090, 9.9818],
          [6.8090, 9.9825],
        ],
      },
    ],
  },
  {
    id: "demo-riverside-omuma",
    name: "Riverside Farm",
    owner_name: "Riverside Agricultural Cooperative",
    farmer_email: "farm-manager@riverside-agri.ng",
    location_name: "Omuma, Rivers State",
    latitude: 5.0935,
    longitude: 7.2154,
    elevation: 42.0,
    crop_type: "maize",
    size_hectares: 1.4,
    planting_date: "2026-05-15",
    is_demo: true,
    created_at: "2026-05-15T00:00:00Z",
    boundary_geojson: {
      type: "Polygon",
      coordinates: [[
        [7.2148, 5.0941],
        [7.2160, 5.0941],
        [7.2160, 5.0929],
        [7.2148, 5.0929],
        [7.2148, 5.0941],
      ]],
    },
    risk_zones: [
      {
        zone_name: "Lower Basin Furrows",
        risk_type: "flood",
        severity: "high",
        label: "Water Accumulation Risk Zone",
        coordinates: [
          [7.2150, 5.0938],
          [7.2158, 5.0938],
          [7.2158, 5.0931],
          [7.2150, 5.0931],
          [7.2150, 5.0938],
        ],
      },
    ],
  },
  {
    id: "demo-jos-plateau",
    name: "Jos Plateau Farm",
    owner_name: "Plateau Growers Union",
    farmer_email: "contact@jos-plateau-farms.ng",
    location_name: "Jos, Plateau State",
    latitude: 9.8965,
    longitude: 8.8583,
    elevation: 1217.0,
    crop_type: "maize",
    size_hectares: 6.5,
    planting_date: "2026-05-25",
    is_demo: true,
    created_at: "2026-05-25T00:00:00Z",
    boundary_geojson: {
      type: "Polygon",
      coordinates: [[
        [8.8571, 9.8977],
        [8.8595, 9.8977],
        [8.8595, 9.8953],
        [8.8571, 9.8953],
        [8.8571, 9.8977],
      ]],
    },
    risk_zones: [],
  },
];

export default function Home() {
  const [allFarms, setAllFarms] = useState<Farm[]>(FALLBACK_DEMO_FARMS);
  const [currentFarm, setCurrentFarm] = useState<Farm | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [activeTab, setActiveTab] = useState<"welcome" | "setup" | "overview" | "dashboard">("welcome");
  const [isLoadingFarms, setIsLoadingFarms] = useState<boolean>(true);
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState<boolean>(false);
  const [isSweeping, setIsSweeping] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalInitialMode, setAuthModalInitialMode] = useState<"signin" | "register">("signin");
  const [postAuthRedirect, setPostAuthRedirect] = useState<"setup" | null>(null);

  // Navigation handlers: intercept unauthenticated requests to add farm
  const handleNavigateToSetup = () => {
    if (!currentUser) {
      setAuthModalInitialMode("register");
      setPostAuthRedirect("setup");
      setIsAuthModalOpen(true);
    } else {
      setActiveTab("setup");
    }
  };

  // Home navigation: for logged-in farmers, always go to Farmer Portfolio Dashboard
  const handleNavigateToHome = () => {
    if (currentUser) {
      setActiveTab("overview");
    } else {
      setActiveTab("welcome");
    }
  };

  const handleOpenAuth = (mode: "signin" | "register" = "signin") => {
    setAuthModalInitialMode(mode);
    setPostAuthRedirect(null);
    setIsAuthModalOpen(true);
  };

  // Load farms from backend database filtered by authentication status
  const loadFarms = async (autoSelectId?: string, overrideEmail?: string | null) => {
    setIsLoadingFarms(true);
    try {
      const targetEmail =
        overrideEmail !== undefined
          ? overrideEmail || undefined
          : currentUser?.email || undefined;

      const fetchedFarms = await api.listFarms(targetEmail);
      if (fetchedFarms) {
        setAllFarms(fetchedFarms);

        if (autoSelectId) {
          const match = fetchedFarms.find((f) => f.id === autoSelectId);
          if (match) {
            setCurrentFarm(match);
            setActiveTab("dashboard");
          }
        } else if (targetEmail) {
          if (fetchedFarms.length > 0) {
            if (!currentFarm) setCurrentFarm(fetchedFarms[0]);
          } else {
            setCurrentFarm(null);
          }
        }
      }
    } catch (err) {
      console.warn("Could not fetch farms from backend API, using benchmark fallback:", err);
    } finally {
      setIsLoadingFarms(false);
    }
  };

  // Load alerts scoped to current user or demo visitor
  const loadAlerts = async (overrideEmail?: string | null) => {
    try {
      const targetEmail =
        overrideEmail !== undefined
          ? overrideEmail || undefined
          : currentUser?.email || undefined;
      const fetchedAlerts = await api.listAlerts(targetEmail);
      setAlerts(fetchedAlerts);
    } catch (err) {
      console.warn("Could not fetch alerts:", err);
    }
  };

  useEffect(() => {
    // Clear any legacy mock storage
    try {
      localStorage.removeItem("harvest_rescue_user");
    } catch {}

    const token = api.getToken();
    if (token) {
      api
        .getMe()
        .then((user) => {
          setCurrentUser(user);
          loadFarms(undefined, user.email);
          loadAlerts(user.email);
          setActiveTab("overview");
        })
        .catch(() => {
          api.setToken(null);
          setCurrentUser(null);
          loadFarms(undefined, null);
          loadAlerts(null);
        });
    } else {
      loadFarms(undefined, null);
      loadAlerts(null);
    }
  }, []);

  const handleAuthSuccess = async (user: UserProfile) => {
    setCurrentUser(user);
    await Promise.all([
      loadFarms(undefined, user.email),
      loadAlerts(user.email),
    ]);
    if (postAuthRedirect === "setup") {
      setActiveTab("setup");
      setPostAuthRedirect(null);
    } else {
      setActiveTab("overview");
    }
  };

  const handleLogout = async () => {
    await api.logout();
    setCurrentUser(null);
    setCurrentFarm(null);
    setActiveTab("welcome");
    loadFarms(undefined, null);
    loadAlerts(null);
  };

  const handleTriggerSweep = async () => {
    setIsSweeping(true);
    try {
      await api.triggerSweep();
      await Promise.all([loadFarms(currentFarm?.id), loadAlerts(currentUser?.email)]);
    } catch (err) {
      console.error("Monitoring sweep error:", err);
    } finally {
      setIsSweeping(false);
    }
  };

  const handleFarmCreated = (newFarm: Farm) => {
    setAllFarms((prev) => [newFarm, ...prev.filter((f) => f.id !== newFarm.id)]);
    setCurrentFarm(newFarm);
    setActiveTab("dashboard");
    loadAlerts(currentUser?.email);
  };

  const handleDeleteFarm = async (farmId: string) => {
    try {
      await api.deleteFarm(farmId);
      const remainingAll = allFarms.filter((f) => f.id !== farmId);
      setAllFarms(remainingAll);

      if (currentFarm?.id === farmId) {
        if (remainingAll.length > 0) {
          setCurrentFarm(remainingAll[0]);
        } else {
          setCurrentFarm(null);
        }
      }
      if (currentUser) {
        setActiveTab("overview");
      } else {
        setActiveTab("welcome");
      }
      loadAlerts(currentUser?.email);
    } catch (err: any) {
      alert(err.message || "Failed to delete farm.");
    }
  };

  const handleSelectDemoFarm = (farmName: string) => {
    const searchPool = allFarms.length > 0 ? allFarms : FALLBACK_DEMO_FARMS;
    const nameLower = farmName.toLowerCase();
    
    let demo = searchPool.find(
      (f) => f.name.toLowerCase().includes(nameLower) || nameLower.includes(f.name.toLowerCase())
    );
    
    if (!demo) {
      demo = searchPool.find(
        (f) => f.name.toLowerCase().includes(nameLower.split(" ")[0])
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
        farms={allFarms}
        currentFarm={currentFarm}
        currentUser={currentUser}
        onOpenAuth={() => handleOpenAuth("signin")}
        onSelectFarm={(farm) => {
          setCurrentFarm(farm);
          setActiveTab("dashboard");
        }}
        onNavigateToSetup={handleNavigateToSetup}
        onNavigateToHome={handleNavigateToHome}
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
              <span>Connecting to Harvest Rescue Risk Intelligence...</span>
            </div>
            <SkeletonCard count={3} />
          </div>
        ) : (
          <>
            {activeTab === "welcome" && (
              <WelcomeView
                onStartSetup={handleNavigateToSetup}
                onSelectDemoFarm={handleSelectDemoFarm}
              />
            )}

            {activeTab === "overview" && currentUser && (
              <FarmerOverviewView
                currentUser={currentUser}
                farms={allFarms}
                alerts={alerts}
                onSelectFarm={(farm) => {
                  setCurrentFarm(farm);
                  setActiveTab("dashboard");
                }}
                onNavigateToSetup={handleNavigateToSetup}
                onDeleteFarm={handleDeleteFarm}
                onOpenAlerts={() => setIsAlertsModalOpen(true)}
              />
            )}

            {activeTab === "setup" && (
              <FarmSetupView
                onFarmCreated={handleFarmCreated}
                onCancel={() => {
                  if (currentUser) setActiveTab("overview");
                  else if (currentFarm) setActiveTab("dashboard");
                  else setActiveTab("welcome");
                }}
                defaultEmail={currentUser?.email}
                defaultOwnerName={currentUser?.name}
              />
            )}

            {activeTab === "dashboard" && currentFarm && (
              <FarmDashboardView
                farm={currentFarm}
                onNavigateToSetup={handleNavigateToSetup}
                onDeleteFarm={handleDeleteFarm}
                onBackToOverview={currentUser ? () => setActiveTab("overview") : () => setActiveTab("welcome")}
              />
            )}
          </>
        )}
      </main>

      {/* Farmer Account & Identity Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        initialMode={authModalInitialMode}
        onAuthSuccess={handleAuthSuccess}
        onLogout={handleLogout}
      />

      {/* Persistent Alerts Modal */}
      <AlertsModal
        isOpen={isAlertsModalOpen}
        onClose={() => setIsAlertsModalOpen(false)}
        alerts={alerts}
        farms={allFarms}
        onAlertUpdated={() => loadAlerts(currentUser?.email)}
        onTriggerSweep={handleTriggerSweep}
        isSweeping={isSweeping}
      />

      {/* Material 3 Bottom Footer */}
      <footer className="border-t border-[#E0E4DF] bg-[#F0F4EF] py-6 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#717973]">
          <p>© 2026 Harvest Rescue — Agricultural Risk Intelligence &amp; Early Warning</p>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#1B4D3E] animate-pulse"></span>
              Continuous Agronomic Monitoring Active
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
