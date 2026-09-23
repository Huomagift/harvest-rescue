"use client";

import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Farm, RiskSeverity, RiskZone } from "@/lib/types";
import { Layers, ShieldAlert, Sparkles, MapPin, AlertCircle, Compass } from "lucide-react";

interface FarmMapProps {
  farm: Farm;
  severity: RiskSeverity;
  heightClass?: string;
}

// Controller to smoothly fit map view to the farm's boundary or coordinates
const MapViewController: React.FC<{
  latitude: number;
  longitude: number;
  boundaryCoords?: [number, number][];
}> = ({ latitude, longitude, boundaryCoords }) => {
  const map = useMap();

  useEffect(() => {
    if (boundaryCoords && boundaryCoords.length > 2) {
      const bounds = L.latLngBounds(boundaryCoords.map(([lat, lng]) => [lat, lng]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    } else {
      map.setView([latitude, longitude], 15);
    }
  }, [latitude, longitude, boundaryCoords, map]);

  return null;
};

// Generates tight rectangular boundary around coordinates (~1.0 - 1.5 ha pure crop plot)
function getDerivedBoundary(lat: number, lon: number): [number, number][] {
  const dLat = 0.0005;
  const dLon = 0.0005;
  return [
    [lat + dLat, lon - dLon],
    [lat + dLat, lon + dLon],
    [lat - dLat, lon + dLon],
    [lat - dLat, lon - dLon],
  ];
}

export const FarmMap: React.FC<FarmMapProps> = ({
  farm,
  severity,
  heightClass = "h-[400px] sm:h-[480px] lg:h-[520px]",
}) => {
  const [showBoundary, setShowBoundary] = useState(true);
  const [showRiskZones, setShowRiskZones] = useState(true);

  // Extract boundary coordinates from GeoJSON or compute derived polygon
  const rawGeoJson = farm.boundary_geojson?.coordinates?.[0];
  const boundaryLatLons: [number, number][] = rawGeoJson && Array.isArray(rawGeoJson)
    ? rawGeoJson.map((pt: any) => [Number(pt[1]), Number(pt[0])] as [number, number])
    : getDerivedBoundary(farm.latitude, farm.longitude);

  const riskZones: RiskZone[] = farm.risk_zones || [];

  const severityColor =
    severity === "high" ? "#BA1A1A" : severity === "medium" ? "#8B5000" : "#1B4D3E";

  return (
    <div
      className={`w-full ${heightClass} rounded-3xl overflow-hidden border border-[#E0E4DF] shadow-md relative z-0 flex flex-col`}
    >
      <MapContainer
        center={[farm.latitude, farm.longitude]}
        zoom={15}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        {/* Google Earth-style High-Resolution Satellite / Aerial Imagery */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="&copy; Earth Observation Imagery"
          maxZoom={18}
        />

        {/* Farm Parcel Boundary (Prominent agricultural boundary naturally resting on imagery) */}
        {showBoundary && (
          <Polygon
            positions={boundaryLatLons}
            pathOptions={{
              color: "#34D399",
              weight: 3,
              fillColor: "#10B981",
              fillOpacity: 0.18,
              dashArray: "6, 4",
            }}
          >
            <Popup>
              <div className="p-1 font-sans text-xs">
                <strong className="block text-sm text-[#191C1A]">{farm.name}</strong>
                <span className="text-[#717973]">
                  {farm.location_name || `${farm.latitude.toFixed(4)}, ${farm.longitude.toFixed(4)}`}
                </span>
                <div className="mt-1 font-bold text-[#1B4D3E]">
                  {farm.crop_type.toUpperCase()} · {farm.size_hectares || 12.4} Hectares
                </div>
              </div>
            </Popup>
          </Polygon>
        )}

        {/* High-Risk Zones Highlighted Directly on the Land */}
        {showRiskZones &&
          riskZones.map((zone, idx) => {
            const isFlood = zone.risk_type === "flood";
            const zoneColor = isFlood ? "#0284C7" : "#EA580C";
            const zonePositions: [number, number][] = (zone.coordinates || []).map(
              (pt: any) => [Number(pt[1]), Number(pt[0])] as [number, number]
            );

            return (
              <Polygon
                key={idx}
                positions={zonePositions}
                pathOptions={{
                  color: zoneColor,
                  weight: 2.5,
                  fillColor: zoneColor,
                  fillOpacity: 0.42,
                }}
              >
                <Popup>
                  <div className="p-1 font-sans text-xs">
                    <strong className="block text-sm text-[#BA1A1A]">{zone.label}</strong>
                    <p className="mt-0.5 text-[#414943]">{zone.zone_name}</p>
                    <span className="inline-block mt-1 font-bold text-xs uppercase px-1.5 py-0.5 rounded bg-[#FFDAD6] text-[#410E0B]">
                      {zone.severity} Attention Required
                    </span>
                  </div>
                </Popup>
              </Polygon>
            );
          })}

        <MapViewController
          latitude={farm.latitude}
          longitude={farm.longitude}
          boundaryCoords={boundaryLatLons}
        />
      </MapContainer>

      {/* Floating HUD Top-Left: Earth View Farm Identification */}
      <div className="absolute top-4 left-4 z-1000 pointer-events-auto bg-black/65 backdrop-blur-md text-white rounded-2xl p-3 sm:p-4 border border-white/15 max-w-[280px] sm:max-w-sm shadow-lg">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#34D399] animate-pulse"></span>
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#34D399]">
            Earth Observation View
          </span>
        </div>
        <h3 className="font-bold text-base sm:text-lg leading-tight mt-1 text-white">
          {farm.name}
        </h3>
        <p className="text-xs text-white/80 flex items-center gap-1 mt-0.5">
          <MapPin className="w-3 h-3 text-[#34D399] shrink-0" />
          <span>{farm.location_name || `${farm.latitude.toFixed(4)}, ${farm.longitude.toFixed(4)}`}</span>
        </p>
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/15 text-xs text-white/90">
          <span className="font-semibold text-[#A7F3D0]">{farm.crop_type.toUpperCase()}</span>
          <span>•</span>
          <span>{farm.size_hectares ? `${farm.size_hectares} Hectares` : "Commercial Plot"}</span>
          {farm.elevation && (
            <>
              <span>•</span>
              <span>{Math.round(farm.elevation)}m El.</span>
            </>
          )}
        </div>
      </div>

      {/* Floating HUD Top-Right: Layer Controls */}
      <div className="absolute top-4 right-4 z-1000 pointer-events-auto bg-black/65 backdrop-blur-md text-white rounded-2xl p-2.5 border border-white/15 shadow-lg flex flex-col gap-2">
        <div className="text-[10px] font-bold uppercase tracking-wider text-white/70 px-1 flex items-center gap-1">
          <Layers className="w-3 h-3" />
          <span>Layers</span>
        </div>
        <button
          onClick={() => setShowBoundary(!showBoundary)}
          className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
            showBoundary ? "bg-[#10B981] text-white" : "bg-white/10 text-white/70 hover:bg-white/20"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-white"></span>
          <span>Boundary</span>
        </button>
        {riskZones.length > 0 && (
          <button
            onClick={() => setShowRiskZones(!showRiskZones)}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              showRiskZones
                ? "bg-[#EA580C] text-white"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
          >
            <ShieldAlert className="w-3 h-3" />
            <span>Risk Zones</span>
          </button>
        )}
      </div>

      {/* Floating Bottom HUD: Risk Zone Callout Banner or Legend */}
      <div className="absolute bottom-4 left-4 right-4 z-1000 pointer-events-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-black/75 backdrop-blur-md text-white rounded-2xl px-4 py-2.5 border border-white/15 shadow-lg text-xs">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-[#34D399]" />
          <span>
            {riskZones.length > 0 ? (
              <span className="font-medium">
                Highlighted Area: <strong className="text-amber-300">{riskZones[0].label}</strong>
              </span>
            ) : (
              <span className="text-white/80">Aerial terrain and vegetative canopy standing normal.</span>
            )}
          </span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] text-white/80 self-end sm:self-auto">
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#10B981] border border-white/50"></span>
            Farm Bounds
          </span>
          {riskZones.some((z) => z.risk_type === "flood") && (
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#0284C7] border border-white/50"></span>
              Water Accumulation
            </span>
          )}
          {riskZones.some((z) => z.risk_type === "vigor_decline") && (
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#EA580C] border border-white/50"></span>
              Crop Stress
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default FarmMap;
