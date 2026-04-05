const API_URL = process.env.NEXT_PUBLIC_BOT_API_URL || "http://localhost:3001";
const API_SECRET = process.env.NEXT_PUBLIC_BOT_API_SECRET || "";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Bot-API-Secret": API_SECRET,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return res.json();
}

async function proxyRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export interface Match {
  id: string;
  sede_name: string;
  def_name: string;
  atk_name: string;
  winner_name: string;
  score_def: number;
  score_atk: number;
  rounds: number;
  capacity: string;
  created_at: string;
  iso_year_week: string;
  event_subtype: string;
  creatorid: string | null;
  staffapoyo: string[];
  fecha: string;
}

export interface Sede {
  id: number;
  name: string;
  capacidad: string;
  coords_defensa: string;
  coords_ataque: string;
}

export interface Faccion {
  key: string;
  nombre: string;
  coordenadas: string;
}

export interface RankingEntry {
  userId: string;
  count: number;
  assaults: Array<{
    sede: string;
    fecha: string;
    winner: string;
    def: string;
    atk: string;
    score: string;
    id: string;
    rol: string;
    tipo: string;
  }>;
}

export interface TeamInfo {
  name: string;
  points: number;
  role: string;
}

export interface SessionData {
  id: string;
  sede: string;
  capacity: string;
  isBicicleta: boolean;
  currentRound: number;
  teamA: TeamInfo;
  teamB: TeamInfo;
  staff: string[];
  creatorId: string;
}

export type WsMessage =
  | { type: "score_update"; sessionId: string; team: string; score: number; round: number; teamA: TeamInfo; teamB: TeamInfo }
  | { type: "round_change"; sessionId: string; round: number }
  | { type: "roles_swapped"; sessionId: string; teamA: TeamInfo; teamB: TeamInfo }
  | { type: "announcement"; channelId: string; message: string }
  | { type: "event_finished"; sessionId: string; result: any }
  | { type: "event_cancelled"; sessionId: string }
  | { type: "staff_added"; sessionId: string; staff: string[] };

export const apiClient = {
  getMatches: (params?: { week?: string; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.week) qs.set("week", params.week);
    if (params?.limit) qs.set("limit", String(params.limit));
    return request<Match[]>(`/api/data/matches?${qs}`);
  },

  getSedes: () => request<Sede[]>("/api/data/sedes"),

  getFacciones: (br = false) => request<Faccion[]>(`/api/data/facciones?br=${br}`),

  getRanking: (week?: string) => {
    const qs = week ? `?week=${week}` : "";
    return request<RankingEntry[]>(`/api/data/ranking${qs}`);
  },

  getWeeks: () => request<string[]>("/api/data/weeks"),

  postScore: (sessionId: string, team: "def" | "atk", round: number) =>
    proxyRequest<{ ok: boolean; teamA: TeamInfo; teamB: TeamInfo }>("/api/actions/score", {
      method: "POST",
      body: JSON.stringify({ sessionId, team, round }),
    }),

  postNextRound: (sessionId: string) =>
    proxyRequest<{ ok: boolean; round: number }>("/api/actions/next-round", {
      method: "POST",
      body: JSON.stringify({ sessionId }),
    }),

  postSwapRoles: (sessionId: string) =>
    proxyRequest<{ ok: boolean; teamA: TeamInfo; teamB: TeamInfo }>("/api/actions/swap-roles", {
      method: "POST",
      body: JSON.stringify({ sessionId }),
    }),

  postAnnounce: (channelId: string, message: string) =>
    proxyRequest<{ ok: boolean }>("/api/actions/announce", {
      method: "POST",
      body: JSON.stringify({ channelId, message }),
    }),

  postFinishEvent: (sessionId: string) =>
    proxyRequest<{ ok: boolean; result: any }>("/api/actions/finish-event", {
      method: "POST",
      body: JSON.stringify({ sessionId }),
    }),

  postCancelEvent: (sessionId: string) =>
    proxyRequest<{ ok: boolean }>("/api/actions/cancel-event", {
      method: "POST",
      body: JSON.stringify({ sessionId }),
    }),

  postAddStaff: (sessionId: string, userId: string) =>
    proxyRequest<{ ok: boolean; staff: string[] }>("/api/actions/add-staff", {
      method: "POST",
      body: JSON.stringify({ sessionId, userId }),
    }),
};

export function createWebSocket(onMessage: (msg: WsMessage) => void): WebSocket | null {
  if (!API_SECRET) return null;

  try {
    const wsUrl = API_URL.replace("http", "ws").replace("https", "wss");
    const ws = new WebSocket(`${wsUrl}?secret=${API_SECRET}`);

    ws.onopen = () => console.log("[WS] Connected to bot API");
    ws.onclose = () => console.log("[WS] Disconnected from bot API");
    ws.onerror = () => {
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as WsMessage;
        onMessage(msg);
      } catch (err) {
        console.error("[WS] Failed to parse message:", err);
      }
    };

    return ws;
  } catch {
    return null;
  }
}
