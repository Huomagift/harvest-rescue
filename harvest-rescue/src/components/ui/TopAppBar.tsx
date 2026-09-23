import React from "react";
import { Sprout, Plus, ChevronDown, Bell, Home, Layers, Trash2, User, LogIn } from "lucide-react";
import { Farm } from "@/lib/types";
import { Button } from "./Button";
import { UserProfile } from "@/lib/api";

export interface TopAppBarProps {
  farms: Farm[];
  currentFarm: Farm | null;
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  onSelectFarm: (farm: Farm) => void;
  onNavigateToSetup: () => void;
  onNavigateToHome: () => void;
  onDeleteFarm?: (farmId: string) => void;
  onOpenAlerts?: () => void;
  unreadAlertsCount?: number;
  activeTab: "welcome" | "setup" | "overview" | "dashboard";
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  farms,
  currentFarm,
  currentUser,
  onOpenAuth,
  onSelectFarm,
  onNavigateToSetup,
  onNavigateToHome,
  onDeleteFarm,
  onOpenAlerts,
  unreadAlertsCount = 0,
  activeTab,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#FBFDFA]/95 backdrop-blur-md border-b border-[#E0E4DF] shadow-xs">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        {/* Brand & Home */}
        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateToHome}
            className="flex items-center gap-2 text-left focus:outline-none focus:ring-2 focus:ring-[#1B4D3E] rounded-xl p-1 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-[#1B4D3E] text-white flex items-center justify-center shadow-xs">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <span className="m3-title-medium text-[#1B4D3E] tracking-tight block leading-tight font-bold">
                Harvest Rescue
              </span>
              <span className="m3-label-medium text-[#717973] hidden sm:block">
                Continuous Agronomic Risk Warning
              </span>
            </div>
          </button>
        </div>

        {/* Center / Right Controls */}
        <div className="flex items-center gap-2">
          {/* Persistent Alerts Bell Indicator */}
          {onOpenAlerts && (
            <button
              onClick={onOpenAlerts}
              className="relative p-2 rounded-full text-[#1B4D3E] hover:bg-[#E0E4DF] transition-colors cursor-pointer"
              title="Persistent Risk Alerts"
              aria-label="View Alerts"
            >
              <Bell className="w-5 h-5" />
              {unreadAlertsCount > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#BA1A1A] text-white text-[10px] font-extrabold flex items-center justify-center animate-pulse border-2 border-[#FBFDFA]">
                  {unreadAlertsCount > 9 ? "9+" : unreadAlertsCount}
                </span>
              )}
            </button>
          )}

          {/* Farm Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="m3-touch-target flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#D8ECE0] text-[#052119] hover:bg-[#c2e4cf] transition-colors border border-[#A3D9B5] cursor-pointer"
              aria-label="Select Farm"
            >
              <Layers className="w-4 h-4 text-[#1B4D3E]" />
              <span className="m3-label-large max-w-[120px] sm:max-w-[170px] truncate">
                {activeTab === "overview" && currentUser
                  ? "All Parcels"
                  : currentFarm
                  ? currentFarm.name
                  : currentUser
                  ? "My Farm Parcels"
                  : "Demo Farms"}
              </span>
              <ChevronDown className="w-4 h-4 text-[#1B4D3E]" />
            </button>

            {isDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-[#E0E4DF] shadow-xl py-2 z-20 overflow-hidden">
                  <div className="px-3 py-2 border-b border-[#E0E4DF] bg-[#F0F4EF] flex items-center justify-between">
                    <p className="text-[11px] text-[#1B4D3E] uppercase tracking-wider font-extrabold">
                      {currentUser ? `My Farms (${farms.length})` : `Demo Scenarios (${farms.length})`}
                    </p>
                    {currentUser && (
                      <span className="text-[10px] font-bold text-[#717973] truncate max-w-[110px]">
                        {currentUser.email}
                      </span>
                    )}
                  </div>

                  {currentUser && (
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onNavigateToHome();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-[#1B4D3E] hover:bg-[#D8ECE0]/50 border-b border-[#E0E4DF]/60 text-left transition-colors"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>View All Parcels (Overview)</span>
                    </button>
                  )}

                  <div className="max-h-64 overflow-y-auto divide-y divide-[#E0E4DF]/60">
                    {farms.length === 0 ? (
                      <div className="p-4 text-center text-xs text-[#717973]">
                        No farms registered yet. Click &quot;Add Farm&quot; to register your first plot!
                      </div>
                    ) : (
                      farms.map((farm) => (
                        <div
                          key={farm.id}
                          className={`flex items-center justify-between px-3 py-2.5 hover:bg-[#F0F4EF] transition-colors ${
                            currentFarm?.id === farm.id && activeTab === "dashboard"
                              ? "bg-[#D8ECE0]/50 font-semibold border-l-4 border-[#1B4D3E]"
                              : ""
                          }`}
                        >
                          <button
                            onClick={() => {
                              onSelectFarm(farm);
                              setIsDropdownOpen(false);
                            }}
                            className="flex-1 text-left cursor-pointer min-w-0 pr-2"
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="m3-body-medium text-[#191C1A] truncate block font-bold">
                                {farm.name}
                              </span>
                              {farm.is_demo && (
                                <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.2 rounded-full bg-[#E0E4DF] text-[#414943]">
                                  Demo
                                </span>
                              )}
                            </div>
                            <span className="m3-label-medium text-[#717973] capitalize block text-xs truncate">
                              {farm.location_name ? `${farm.location_name} · ${farm.crop_type}` : `${farm.crop_type} • (${farm.latitude.toFixed(2)}, ${farm.longitude.toFixed(2)})`}
                              {farm.size_hectares ? ` • ${farm.size_hectares} ha` : ""}
                            </span>
                          </button>

                          {/* Delete Action (Disabled for Demo Farms) */}
                          {!farm.is_demo && onDeleteFarm && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Are you sure you want to remove ${farm.name}?`)) {
                                  onDeleteFarm(farm.id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-[#BA1A1A] hover:bg-[#FFDAD6] transition-colors cursor-pointer shrink-0"
                              title="Delete Farm"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-2 border-t border-[#E0E4DF] bg-[#FBFDFA]">
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onNavigateToSetup();
                      }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#1B4D3E] text-white text-xs font-semibold hover:bg-[#163E32]"
                    >
                      <Plus className="w-4 h-4" />
                      Add New Farm
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User Account / Profile Button */}
          {currentUser ? (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F0F4EF] hover:bg-[#E0E4DF] border border-[#E0E4DF] text-xs font-bold text-[#191C1A] transition-colors cursor-pointer"
              title={`Logged in as ${currentUser.name} (${currentUser.email})`}
            >
              <div className="w-5 h-5 rounded-full bg-[#1B4D3E] text-white flex items-center justify-center text-[10px]">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:inline max-w-[100px] truncate">{currentUser.name}</span>
            </button>
          ) : (
            <Button
              variant="outlined"
              size="sm"
              onClick={onOpenAuth}
              leftIcon={<LogIn className="w-3.5 h-3.5" />}
              className="text-xs font-bold"
            >
              Sign In
            </Button>
          )}

          {/* Navigation to Home/Welcome/Overview */}
          {activeTab !== "welcome" && (
            <button
              onClick={onNavigateToHome}
              className={`p-2 rounded-full transition-colors cursor-pointer ${
                currentUser && activeTab === "overview"
                  ? "text-[#1B4D3E] bg-[#D8ECE0]"
                  : "text-[#414943] hover:bg-[#E0E4DF]"
              }`}
              title={currentUser ? "Farmer Portfolio Dashboard" : "Welcome & Onboarding"}
              aria-label={currentUser ? "Farmer Portfolio Dashboard" : "Welcome & Onboarding"}
            >
              <Home className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

