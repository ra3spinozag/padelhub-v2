import { apiFetch } from "./api";
import { getStoredToken } from "./auth.service";

export interface QRData {
  token: string;
  expires_at: string;
  qr_payload: string;
}

export interface PresenceResponse {
  message: string;
  match_started?: boolean;
  confirmed_count?: number;
  total_players?: number;
  already_confirmed?: boolean;
}

export interface MatchResultData {
  id: string;
  match_id: string;
  registered_by: string;
  score_team_a: string;
  score_team_b: string;
  winner: "team_a" | "team_b" | "draw";
  confirmed: boolean;
  confirmed_by: string | null;
  confirmed_at: string | null;
  registered_at: string;
  users?: { id: string; name: string };
}

export interface SubmitResultPayload {
  submitted_by: string;
  score_team_a: string;
  score_team_b: string;
  winner: "team_a" | "team_b" | "draw";
}

export async function generateQR(matchId: string, userId: string): Promise<QRData> {
  const token = await getStoredToken();
  return apiFetch<QRData>(
    `/matches/${matchId}/qr?user_id=${userId}`,
    {},
    token ?? undefined
  );
}

export async function confirmPresence(
  matchId: string,
  userId: string,
  qrToken: string
): Promise<PresenceResponse> {
  const token = await getStoredToken();
  return apiFetch<PresenceResponse>(
    `/matches/${matchId}/confirm-presence`,
    { method: "POST", body: JSON.stringify({ user_id: userId, token: qrToken }) },
    token ?? undefined
  );
}

export async function submitResult(
  matchId: string,
  payload: SubmitResultPayload
): Promise<{ message: string; result: MatchResultData }> {
  const token = await getStoredToken();
  return apiFetch<{ message: string; result: MatchResultData }>(
    `/matches/${matchId}/result`,
    { method: "POST", body: JSON.stringify(payload) },
    token ?? undefined
  );
}

export async function getResult(matchId: string): Promise<MatchResultData> {
  const token = await getStoredToken();
  return apiFetch<MatchResultData>(
    `/matches/${matchId}/result`,
    {},
    token ?? undefined
  );
}

export async function confirmResult(
  matchId: string,
  confirmedBy: string
): Promise<{ message: string; winner: string; score_team_a: string; score_team_b: string }> {
  const token = await getStoredToken();
  return apiFetch<{ message: string; winner: string; score_team_a: string; score_team_b: string }>(
    `/matches/${matchId}/result/confirm`,
    { method: "POST", body: JSON.stringify({ confirmed_by: confirmedBy }) },
    token ?? undefined
  );
}
