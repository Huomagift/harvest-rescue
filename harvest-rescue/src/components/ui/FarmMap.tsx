"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { RiskSeverity } from "@/lib/types";

interface FarmMapProps {
  latitude: number;
  longitude: number;
  farmName: string;
  cropType: string;
  severity: RiskSeverity;
}

// Custom icon creator based on Material 3 severity role colors
const createCustomMarkerIcon = (severity: RiskSeverity) => {
  let color = "#1B4D3E"; // Low risk green
  let border = "#052119";
  if (severity === "high") {
    color = "#BA1A1A"; // High risk red
    border = "#410E0B";
  } else if (severity === "medium") {
    color = "#8B5000"; // Medium risk orange
    border = "#341200";
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 42" width="32" height="42">
      <path d="M16 0 C7.163 0 0 7.163 0 16 C0 28 16 42 16 42 C16 42 32 28 32 16 C32 7.163 24.837 0 16 0 Z" fill="${color}" stroke="${border}" stroke-width="2"/>
      <circle cx="16" cy="14" r="6" fill="#FFFFFF"/>
    </svg>
  `;

  return L.divIcon({
    className: "custom-leaflet-marker",
    html: svg,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -38],
  });
};

// Component to handle map view reset when coordinates change
const MapController: React.FC<{ latitude: number; longitude: number }> = ({ latitude, longitude }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([latitude, longitude], map.getZoom());
  }, [latitude, longitude, map]);
  return null;
};

export const FarmMap: React.FC<FarmMapProps> = ({
  latitude,
  longitude,
  farmName,
  cropType,
  severity,
}) => {
  const icon = createCustomMarkerIcon(severity);

  return (
    <div className="w-full h-64 sm:h-72 rounded-3xl overflow-hidden border border-[#E0E4DF] shadow-xs relative z-0">
      <MapContainer
        center={[latitude, longitude]}
        zoom={12}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[latitude, longitude]} icon={icon}>
          <Popup>
            <div className="p-1 text-sm font-sans">
              <strong className="block text-base text-[#191C1A]">{farmName}</strong>
              <span className="text-xs text-[#717973] font-medium uppercase tracking-wider">{cropType} Farm</span>
              <div className="mt-1 text-xs">
                Status: <span className="font-bold capitalize" style={{ color: severity === "high" ? "#BA1A1A" : severity === "medium" ? "#8B5000" : "#1B4D3E" }}>{severity} Risk</span>
              </div>
            </div>
          </Popup>
        </Marker>
        <MapController latitude={latitude} longitude={longitude} />
      </MapContainer>
    </div>
  );
};

export default FarmMap;
