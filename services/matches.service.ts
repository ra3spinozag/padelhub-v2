import { type Partido } from "../context/PartidosContext";
import { apiFetch } from "./api";
import { getStoredToken } from "./auth.service";

export interface CreateMatchPayload {
  organizer_id: string;
  club: string;
  format: "doubles" | "singles";
  match_date: string;
  match_time: string;
}

export async function createMatch(payload: CreateMatchPayload): Promise<Partido> {
  const token = await getStoredToken();
  return apiFetch<Partido>(
    "/matches",
    { method: "POST", body: JSON.stringify(payload) },
    token ?? undefined
  );
}
