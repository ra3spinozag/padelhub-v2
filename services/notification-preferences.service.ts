import { apiFetch } from "./api";
import { getStoredToken } from "./auth.service";

export interface NotificationPreferences {
  match_invitation: boolean;
  match_reminder: boolean;
  chat_message: boolean;
  match_result: boolean;
  match_rating: boolean;
  suspension: boolean;
}

export async function getNotificationPreferences(rut: number): Promise<NotificationPreferences> {
  const token = await getStoredToken();
  const res = await apiFetch<{ preferences: NotificationPreferences }>(
    `/users/${rut}/notification-preferences`,
    {},
    token ?? undefined
  );
  return res.preferences;
}

export async function updateNotificationPreferences(
  rut: number,
  updates: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  const token = await getStoredToken();
  const res = await apiFetch<{ preferences: NotificationPreferences }>(
    `/users/${rut}/notification-preferences`,
    { method: "PATCH", body: JSON.stringify(updates) },
    token ?? undefined
  );
  return res.preferences;
}
