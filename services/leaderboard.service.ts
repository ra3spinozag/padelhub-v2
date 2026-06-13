import { apiFetch } from "./api";
import { getStoredToken } from "./auth.service";

export interface LeaderboardPlayer {
  rank: number;
  id: string;
  name: string;
  photo_url: string | null;
  level: string;
  zone: string;
  mmr: number;
  matches_played: number;
}

export interface LeaderboardResponse {
  scope: "national" | "zone";
  zone: string | null;
  level: string | null;
  total: number;
  players: LeaderboardPlayer[];
}

export async function getLeaderboard(params?: {
  zone?: string;
  level?: string;
  limit?: number;
}): Promise<LeaderboardResponse> {
  const token = await getStoredToken();
  const query = new URLSearchParams();
  if (params?.zone)  query.set("zone",  params.zone);
  if (params?.level) query.set("level", params.level);
  if (params?.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  return apiFetch<LeaderboardResponse>(
    `/leaderboard${qs ? `?${qs}` : ""}`,
    {},
    token ?? undefined
  );
}
