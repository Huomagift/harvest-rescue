import React from "react";
import { Sprout, Plus, ChevronDown, RefreshCw, Home, Layers } from "lucide-react";
import { Farm } from "@/lib/types";
import { Button } from "./Button";

export interface TopAppBarProps {
  farms: Farm[];
  currentFarm: Farm | null;
  onSelectFarm: (farm: Farm) => void;
  onNavigateToSetup: () => void;
  onNavigateToHome: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  activeTab: "welcome" | "setup" | "dashboard";
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  farms,
  currentFarm,
  onSelectFarm,
  onNavigateToSetup,
  onNavigateToHome,
  onRefresh,
  isRefreshing = false,
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
            className="flex items-center gap-2 text-left focus:outline-none focus:ring-2 focus:ring-[#1B4D3E] rounded-xl p-1"
          >
            <div className="w-9 h-9 rounded-xl bg-[#1B4D3E] text-white flex items-center justify-center shadow-xs">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <span className="m3-title-medium text-[#1B4D3E] tracking-tight block leading-tight font-bold">
                Harvest Rescue AI
              </span>
              <span className="m3-label-medium text-[#717973] hidden sm:block">
                Early Risk Warning System
              </span>
            </div>
          </button>
        </div>

        {/* Center / Right Controls */}
        <div className="flex items-center gap-2">
          {/* Farm Switcher Dropdown (when farms exist) */}
          {farms.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="m3-touch-target flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#D8ECE0] text-[#052119] hover:bg-[#c2e4cf] transition-colors border border-[#A3D9B5]"
                aria-label="Select Farm"
              >
                <Layers className="w-4 h-4 text-[#1B4D3E]" />
                <span className="m3-label-large max-w-[120px] sm:max-w-[180px] truncate">
                  {currentFarm ? currentFarm.name : "Select Farm"}
                </span>
                <ChevronDown className="w-4 h-4 text-[#1B4D3E]" />
              </button>

              {isDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-[#E0E4DF] shadow-xl py-2 z-20 overflow-hidden">
                    <div className="px-3 py-2 border-b border-[#E0E4DF] bg-[#F0F4EF]">
                      <p className="m3-label-medium text-[#717973] uppercase tracking-wider">
                        Registered Farms ({farms.length})
                      </p>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {farms.map((farm) => (
                        <button
                          key={farm.id}
                          onClick={() => {
                            onSelectFarm(farm);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3 flex flex-col hover:bg-[#F0F4EF] transition-colors ${
                            currentFarm?.id === farm.id
                              ? "bg-[#D8ECE0]/50 font-semibold border-l-4 border-[#1B4D3E]"
                              : ""
                          }`}
                        >
                          <span className="m3-body-medium text-[#191C1A] truncate">{farm.name}</span>
                          <span className="m3-label-medium text-[#717973] capitalize">
                            {farm.crop_type} • ({farm.latitude.toFixed(2)}, {farm.longitude.toFixed(2)})
                          </span>
                        </button>
                      ))}
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
          )}

          {/* Setup CTA button */}
          <Button
            variant={activeTab === "setup" ? "filled" : "tonal"}
            size="sm"
            onClick={onNavigateToSetup}
            leftIcon={<Plus className="w-4 h-4" />}
            className="hidden xs:inline-flex"
          >
            Add Farm
          </Button>

          {/* Navigation to Home/Welcome */}
          {activeTab !== "welcome" && (
            <button
              onClick={onNavigateToHome}
              className="p-2 rounded-full text-[#414943] hover:bg-[#E0E4DF] transition-colors"
              title="Welcome & Onboarding"
            >
              <Home className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
