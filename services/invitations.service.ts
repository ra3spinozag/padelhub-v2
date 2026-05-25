import { apiFetch } from "./api";
import { getStoredToken } from "./auth.service";

export interface Invitation {
  id: string;
  match_id: string;
  invited_by: string;
  user_id: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  responded_at: string | null;
  invitee?: {
    id: string;
    name: string;
    level: string;
    photo_url: string | null;
  };
  inviter?: {
    id: string;
    name: string;
    photo_url?: string | null;
  };
  matches?: {
    id: string;
    club: string;
    format: "doubles" | "singles";
    status: string;
    match_date: string;
    match_time: string;
    users?: {
      id: string;
      name: string;
      zone: string;
    };
  };
}

export async function sendInvitation(
  matchId: string,
  invitedBy: string,
  userId: string
): Promise<void> {
  const token = await getStoredToken();
  await apiFetch<{ message: string }>(
    `/matches/${matchId}/invite`,
    { method: "POST", body: JSON.stringify({ invited_by: invitedBy, user_id: userId }) },
    token ?? undefined
  );
}

export async function getMatchInvitations(
  matchId: string,
  status?: "pending" | "accepted" | "declined"
): Promise<Invitation[]> {
  const token = await getStoredToken();
  const qs = status ? `?status=${status}` : "";
  return apiFetch<Invitation[]>(
    `/matches/${matchId}/invitations${qs}`,
    {},
    token ?? undefined
  );
}

export async function getUserInvitations(
  userId: string,
  status?: "pending" | "accepted" | "declined" | "all"
): Promise<Invitation[]> {
  const token = await getStoredToken();
  const qs = status ? `?status=${status}` : "";
  return apiFetch<Invitation[]>(
    `/users/${userId}/invitations${qs}`,
    {},
    token ?? undefined
  );
}

export async function respondInvitation(
  invitationId: string,
  userId: string,
  status: "accepted" | "declined"
): Promise<void> {
  const token = await getStoredToken();
  await apiFetch<{ message: string }>(
    `/invitations/${invitationId}`,
    { method: "PATCH", body: JSON.stringify({ user_id: userId, status }) },
    token ?? undefined
  );
}
