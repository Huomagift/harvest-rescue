import { Farm, FarmCreate, FarmerReportCreate, FarmerReportResponse, RiskEvent } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const BACKEND_API_KEY =
  process.env.NEXT_PUBLIC_BACKEND_API_KEY || "604e89b1d82a1759554e71dffb59428ebc472936fd7aabadbe8863bcf4d4187b";

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-API-Key": BACKEND_API_KEY,
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `API Error: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData.detail) {
        if (typeof errorData.detail === "string") {
          errorMessage = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map((err: any) => `${err.loc?.join(".") || "field"}: ${err.msg}`).join(", ");
        }
      }
    } catch {
      // Keep default status error message
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export const api = {
  // Farm endpoints
  createFarm: (farm: FarmCreate): Promise<Farm> => {
    return apiFetch<Farm>("/farms/", {
      method: "POST",
      body: JSON.stringify(farm),
    });
  },

  listFarms: (): Promise<Farm[]> => {
    return apiFetch<Farm[]>("/farms/");
  },

  getFarm: (farmId: string): Promise<Farm> => {
    return apiFetch<Farm>(`/farms/${farmId}`);
  },

  submitFarmerReport: (farmId: string, report: FarmerReportCreate): Promise<FarmerReportResponse> => {
    return apiFetch<FarmerReportResponse>(`/farms/${farmId}/reports`, {
      method: "POST",
      body: JSON.stringify(report),
    });
  },

  // Risk endpoints
  evaluateRisk: (farmId: string): Promise<RiskEvent[]> => {
    return apiFetch<RiskEvent[]>(`/risk/${farmId}/evaluate`, {
      method: "POST",
    });
  },

  getLatestRisk: (farmId: string): Promise<RiskEvent[]> => {
    return apiFetch<RiskEvent[]>(`/risk/${farmId}/latest`);
  },
};
