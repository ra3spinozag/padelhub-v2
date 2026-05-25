import { type Partido } from "../context/PartidosContext";
import { apiFetch } from "./api";
import { getStoredToken } from "./auth.service";

export interface CreateMatchPayload {
  organizer_id: string;
  club: string;
  format: "doubles" | "singles";
  match_date: string; // "YYYY-MM-DD"
  match_time: string; // "HH:MM:SS"
}

export async function createMatch(payload: CreateMatchPayload): Promise<Partido> {
  const token = await getStoredToken();
  return apiFetch<Partido>(
    "/matches",
    { method: "POST", body: JSON.stringify(payload) },
    token ?? undefined
  );
}

export async function listMatches(params?: { zone?: string; status?: string }): Promise<Partido[]> {
  const token = await getStoredToken();
  const query = new URLSearchParams();
  if (params?.zone)   query.set("zone", params.zone);
  if (params?.status) query.set("status", params.status);
  const qs = query.toString();
  return apiFetch<Partido[]>(
    `/matches${qs ? `?${qs}` : ""}`,
    {},
    token ?? undefined
  );
}

export async function joinMatch(matchId: string, userId: string): Promise<void> {
  const token = await getStoredToken();
  await apiFetch<{ message: string }>(
    `/matches/${matchId}/join`,
    { method: "POST", body: JSON.stringify({ user_id: userId }) },
    token ?? undefined
  );
}

export async function leaveMatch(matchId: string, userId: string): Promise<void> {
  const token = await getStoredToken();
  await apiFetch<{ message: string }>(
    `/matches/${matchId}/join`,
    { method: "DELETE", body: JSON.stringify({ user_id: userId }) },
    token ?? undefined
  );
}

export async function getMatch(matchId: string): Promise<Partido> {
  const token = await getStoredToken();
  return apiFetch<Partido>(
    `/matches/${matchId}`,
    {},
    token ?? undefined
  );
}
