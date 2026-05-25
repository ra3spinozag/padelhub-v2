import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import {
  createMatch, joinMatch, leaveMatch, listMatches,
  type CreateMatchPayload,
} from "../services/matches.service";

// ── Backend-aligned types ──────────────────────────────────────────────────────

export interface MatchPlayer {
  id: string;
  name: string;
  level: string;
  photo_url: string | null;
  team: "team_a" | "team_b";
  joined: string;
}

export interface MatchOrganizer {
  id: string;
  name: string;
  level?: string;
  zone?: string;
  photo_url?: string;
}

export interface MatchResult {
  id: string;
  score_team_a: string;
  score_team_b: string;
  winner: "team_a" | "team_b" | "draw";
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
  status: "open" | "confirmed" | "in_progress" | "finished" | "cancelled";
  match_date: string;
  match_time: string;
  zone?: string;
  organizer?: MatchOrganizer;
  players: MatchPlayer[];
  max_players?: number;
  player_count?: number;
  spots_left?: number;
  is_full?: boolean;
  created_at?: string;
  match_results?: MatchResult;
  mmr_history?: MmrHistory[];
}

// ── Display helpers ────────────────────────────────────────────────────────────

const DIAS_ES  = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const MESES_ES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

export function parseMatchDate(isoDate: string): string {
  const d = new Date(isoDate);
  return `${DIAS_ES[d.getUTCDay()]} ${d.getUTCDate()} ${MESES_ES[d.getUTCMonth()]}`;
}

export function parseMatchTime(isoTime: string): string {
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(isoTime)) return isoTime.slice(0, 5);
  const d = new Date(isoTime);
  if (isNaN(d.getTime())) return isoTime;
  const h = d.getUTCHours().toString().padStart(2, "0");
  const m = d.getUTCMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

export function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

export function getFormatoLabel(format: "doubles" | "singles"): string {
  return format === "doubles" ? "Dobles" : "Individual";
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case "open":        return "Abierto";
    case "confirmed":   return "Confirmado";
    case "in_progress": return "En curso";
    case "finished":    return "Finalizado";
    case "cancelled":   return "Cancelado";
    default:            return status;
  }
}

const AVATAR_COLORS = ["#4f46e5","#059669","#d97706","#7c3aed","#db2777","#0891b2"];
export function getAvatarColor(index: number): string {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

// ── Context ────────────────────────────────────────────────────────────────────

interface PartidosContextType {
  partidos:       Partido[];
  loading:        boolean;
  fetchPartidos:  (zone?: string) => Promise<void>;
  agregarPartido: (payload: CreateMatchPayload) => Promise<void>;
  unirsePartido:  (matchId: string) => Promise<void>;
  salirPartido:   (matchId: string) => Promise<void>;
}

const PartidosContext = createContext<PartidosContextType | null>(null);

export function PartidosProvider({
  children,
  userId,
  userZone,
}: {
  children:  ReactNode;
  userId:    string | undefined;
  userZone?: string | null;
}) {
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [loading,  setLoading]  = useState(false);

  const fetchPartidos = useCallback(async (zone?: string) => {
    setLoading(true);
    try {
      const data = await listMatches({ zone: zone ?? userZone ?? undefined, status: "open" });
      setPartidos(data);
    } catch {
      // keep existing state on error
    } finally {
      setLoading(false);
    }
  }, [userZone]);

  useEffect(() => {
    if (userId) fetchPartidos();
  }, [userId, fetchPartidos]);

  const agregarPartido = async (payload: CreateMatchPayload) => {
    await createMatch(payload);
    await fetchPartidos();
  };

  const unirsePartido = async (matchId: string) => {
    if (!userId) throw new Error("No autenticado");
    await joinMatch(matchId, userId);
    await fetchPartidos();
  };

  const salirPartido = async (matchId: string) => {
    if (!userId) throw new Error("No autenticado");
    await leaveMatch(matchId, userId);
    await fetchPartidos();
  };

  return (
    <PartidosContext.Provider value={{ partidos, loading, fetchPartidos, agregarPartido, unirsePartido, salirPartido }}>
      {children}
    </PartidosContext.Provider>
  );
}

export function usePartidos() {
  const ctx = useContext(PartidosContext);
  if (!ctx) throw new Error("usePartidos debe usarse dentro de PartidosProvider");
  return ctx;
}
