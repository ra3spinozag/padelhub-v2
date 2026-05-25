import { createContext, useContext, useState, type ReactNode } from "react";
import { createMatch } from "../services/matches.service";

// ── Backend-aligned types ──────────────────────────────────────────────────────

export interface MatchPlayerUser {
  id: string;
  name: string;
  level: string;
  mmr: number;
}

export interface MatchPlayer {
  id: string;
  team: "team_a" | "team_b";
  status: "confirmed" | "pending";
  joined_at: string;
  users: MatchPlayerUser;
}

export interface MatchOrganizer {
  id: string;
  name: string;
  photo_url?: string;
}

export interface MatchResult {
  id: string;
  score_team_a: string;
  score_team_b: string;
  winner: "team_a" | "team_b";
  registered_at: string;
}

export interface MmrHistory {
  user_id: string;
  mmr_before: number;
  mmr_after: number;
  delta: number;
}

export interface Partido {
  id: string;
  club: string;
  format: "doubles" | "singles";
  status: "open" | "finished" | "pending" | "cancelled";
  match_date: string;
  match_time: string;
  created_at?: string;
  organizer?: MatchOrganizer;
  match_players: MatchPlayer[];
  match_results?: MatchResult;
  mmr_history?: MmrHistory[];
}

// ── Display helpers ────────────────────────────────────────────────────────────

const DIAS_ES  = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const MESES_ES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

/** "2026-05-25T00:00:00.000Z" → "Dom 25 May" */
export function parseMatchDate(isoDate: string): string {
  const d = new Date(isoDate);
  return `${DIAS_ES[d.getUTCDay()]} ${d.getUTCDate()} ${MESES_ES[d.getUTCMonth()]}`;
}

/** "1970-01-01T19:30:00.000Z" → "19:30" */
export function parseMatchTime(isoTime: string): string {
  const d = new Date(isoTime);
  const h = d.getUTCHours().toString().padStart(2, "0");
  const m = d.getUTCMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

/** "Juan Pablo Belasteguín" → "JP" */
export function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

export function getFormatoLabel(format: "doubles" | "singles"): string {
  return format === "doubles" ? "Dobles" : "Individual";
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case "open":      return "Abierto";
    case "finished":  return "Finalizado";
    case "pending":   return "Pendiente";
    case "cancelled": return "Cancelado";
    default:          return status;
  }
}

const AVATAR_COLORS = ["#4f46e5","#059669","#d97706","#7c3aed","#db2777","#0891b2"];
export function getAvatarColor(index: number): string {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

// ── Context ────────────────────────────────────────────────────────────────────

interface PartidosContextType {
  partidos:       Partido[];
  agregarPartido: (p: Omit<Partido, "id">) => Promise<void>;
}

const PartidosContext = createContext<PartidosContextType | null>(null);

const _now      = new Date();
const _nextWeek = new Date(_now.getTime() + 7 * 24 * 60 * 60 * 1000);
const DEMO_USER_ID = "e8a1b3c4-ad56-4d23-9871-bcde12345678";

const PARTIDOS_DEMO: Partido[] = [
  {
    id: "demo-partido-0001",
    club: "Club Pádel Viña del Mar",
    format: "doubles",
    status: "open",
    match_date: _nextWeek.toISOString(),
    match_time: "1970-01-01T10:00:00.000Z",
    created_at: _now.toISOString(),
    organizer: {
      id: DEMO_USER_ID,
      name: "Felipe Martínez",
    },
    match_players: [
      {
        id: "mp-demo-001",
        team: "team_a",
        status: "confirmed",
        joined_at: _now.toISOString(),
        users: { id: DEMO_USER_ID, name: "Felipe Martínez", level: "4ta", mmr: 1248 },
      },
      {
        id: "mp-demo-002",
        team: "team_a",
        status: "confirmed",
        joined_at: _now.toISOString(),
        users: { id: "mock-player-002", name: "Miguel Ríos", level: "4ta", mmr: 1261 },
      },
      {
        id: "mp-demo-003",
        team: "team_b",
        status: "confirmed",
        joined_at: _now.toISOString(),
        users: { id: "mock-player-003", name: "Ana Paredes", level: "4ta", mmr: 1195 },
      },
      {
        id: "mp-demo-004",
        team: "team_b",
        status: "confirmed",
        joined_at: _now.toISOString(),
        users: { id: "mock-player-004", name: "Javier Vega", level: "3ra", mmr: 1219 },
      },
    ],
  },
];

export function PartidosProvider({
  children,
  userId,
}: {
  children: ReactNode;
  userId: string | undefined;
}) {
  const [partidos, setPartidos] = useState<Partido[]>(
    userId === DEMO_USER_ID ? PARTIDOS_DEMO : []
  );

  const agregarPartido = async (p: Omit<Partido, "id">) => {
    try {
      const created = await createMatch({
        organizer_id: p.organizer?.id ?? "",
        club:         p.club,
        format:       p.format,
        match_date:   p.match_date,
        match_time:   p.match_time,
      });
      setPartidos((prev) => [created, ...prev]);
    } catch {
      // Fallback to local state when API is unavailable or rejects
      setPartidos((prev) => [{ ...p, id: `local-${Date.now()}` }, ...prev]);
    }
  };

  return (
    <PartidosContext.Provider value={{ partidos, agregarPartido }}>
      {children}
    </PartidosContext.Provider>
  );
}

export function usePartidos() {
  const ctx = useContext(PartidosContext);
  if (!ctx) throw new Error("usePartidos debe usarse dentro de PartidosProvider");
  return ctx;
}
