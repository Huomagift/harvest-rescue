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

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  created_at?: string;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

const API_BASE_URL = "/api";

function getStoredToken(): string | null {
  if (typeof window !== "undefined") {
    try {
      return localStorage.getItem("harvest_rescue_token");
    } catch {
      return null;
    }
  }
  return null;
}

function setStoredToken(token: string | null) {
  if (typeof window !== "undefined") {
    try {
      if (token) {
        localStorage.setItem("harvest_rescue_token", token);
      } else {
        localStorage.removeItem("harvest_rescue_token");
      }
    } catch {}
  }
}

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  const token = getStoredToken();
  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

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
  // Auth endpoints
  register: async (name: string, email: string, password: string): Promise<AuthResponse> => {
    const res = await apiFetch<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
    setStoredToken(res.token);
    return res;
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const res = await apiFetch<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setStoredToken(res.token);
    return res;
  },

  getMe: async (): Promise<UserProfile> => {
    return apiFetch<UserProfile>("/auth/me");
  },

  logout: async (): Promise<void> => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {}
    setStoredToken(null);
  },

  getToken: getStoredToken,
  setToken: setStoredToken,

  // Farm endpoints
  createFarm: (farm: FarmCreate): Promise<Farm> => {
    return apiFetch<Farm>("/farms/", {
      method: "POST",
      body: JSON.stringify(farm),
    });
  },

  listFarms: (email?: string, isDemo?: boolean): Promise<Farm[]> => {
    const params = new URLSearchParams();
    if (email) params.set("email", email);
    if (isDemo !== undefined) params.set("is_demo", String(isDemo));
    const qs = params.toString() ? `?${params.toString()}` : "";
    return apiFetch<Farm[]>(`/farms/${qs}`);
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
  listAlerts: (email?: string, status?: string): Promise<Alert[]> => {
    const params = new URLSearchParams();
    if (email) params.set("email", email);
    if (status) params.set("status", status);
    const qs = params.toString() ? `?${params.toString()}` : "";
    return apiFetch<Alert[]>(`/alerts/${qs}`);
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
