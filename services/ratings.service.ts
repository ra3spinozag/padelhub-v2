import { apiFetch } from "./api";
import { getStoredToken } from "./auth.service";

export interface RatingPlayer {
  id: string;
  name: string;
  photo_url?: string;
}

export interface MatchRatingsResponse {
  players_to_rate: RatingPlayer[];
  already_rated: RatingPlayer[];
  has_rated_all: boolean;
}

export interface UserRatingsResponse {
  average: number;
  total_ratings: number;
  breakdown: Record<string, number>;
}

export async function getMatchRatings(
  matchId: string,
  raterId: string
): Promise<MatchRatingsResponse> {
  const token = await getStoredToken();
  return apiFetch<MatchRatingsResponse>(
    `/matches/${matchId}/ratings?rater_id=${raterId}`,
    {},
    token ?? undefined
  );
}

export async function submitRatings(
  matchId: string,
  raterId: string,
  ratings: { ratee_id: string; score: number }[]
): Promise<void> {
  const token = await getStoredToken();
  await apiFetch(
    `/matches/${matchId}/ratings`,
    { method: "POST", body: JSON.stringify({ rater_id: raterId, ratings }) },
    token ?? undefined
  );
}

export async function getUserRatings(rut: number): Promise<UserRatingsResponse> {
  const token = await getStoredToken();
  return apiFetch<UserRatingsResponse>(
    `/users/${rut}/ratings`,
    {},
    token ?? undefined
  );
}
