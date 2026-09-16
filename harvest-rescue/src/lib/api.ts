import {
  Alert,
  AlertStatus,
  Farm,
  FarmCreate,
  FarmerReportCreate,
  FarmerReportResponse,
  RiskEvent,
  SignalResponse,
  SweepResult,
} from "./types";

const API_BASE_URL = "/api";

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
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

  deleteFarm: (farmId: string): Promise<{ id: string; status: string }> => {
    return apiFetch<{ id: string; status: string }>(`/farms/${farmId}`, {
      method: "DELETE",
    });
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

  getSignals: (farmId: string): Promise<SignalResponse> => {
    return apiFetch<SignalResponse>(`/risk/${farmId}/signals`);
  },

  triggerSweep: (): Promise<SweepResult> => {
    return apiFetch<SweepResult>("/risk/sweep", {
      method: "POST",
    });
  },

  // Alert endpoints
  listAlerts: (status?: string): Promise<Alert[]> => {
    const query = status ? `?status=${encodeURIComponent(status)}` : "";
    return apiFetch<Alert[]>(`/alerts/${query}`);
  },

  getFarmAlerts: (farmId: string, status?: string): Promise<Alert[]> => {
    const query = status ? `?status=${encodeURIComponent(status)}` : "";
    return apiFetch<Alert[]>(`/alerts/farm/${farmId}${query}`);
  },

  updateAlertStatus: (alertId: string, status: AlertStatus): Promise<Alert> => {
    return apiFetch<Alert>(`/alerts/${alertId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },
};


