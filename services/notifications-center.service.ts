import { apiFetch } from "./api";
import { getStoredToken } from "./auth.service";

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, any>;
  read: boolean;
  created_at: string;
}

export interface NotificationsResponse {
  notifications: AppNotification[];
  unread_count: number;
  has_more?: boolean;
}

export async function getNotifications(
  rut: number,
  params?: { limit?: number; before?: string }
): Promise<NotificationsResponse> {
  const token = await getStoredToken();
  const query = new URLSearchParams();
  if (params?.limit)  query.set("limit",  String(params.limit));
  if (params?.before) query.set("before", params.before);
  const qs = query.toString();
  return apiFetch<NotificationsResponse>(
    `/users/${rut}/notifications${qs ? `?${qs}` : ""}`,
    {},
    token ?? undefined
  );
}

export async function getUnreadCount(rut: number): Promise<number> {
  const token = await getStoredToken();
  const res = await apiFetch<{ unread_count: number }>(
    `/users/${rut}/notifications/unread-count`,
    {},
    token ?? undefined
  );
  return res.unread_count;
}

export async function markAllRead(rut: number): Promise<void> {
  const token = await getStoredToken();
  await apiFetch(`/users/${rut}/notifications`, { method: "PATCH" }, token ?? undefined);
}

export async function markOneRead(rut: number, notifId: string): Promise<void> {
  const token = await getStoredToken();
  await apiFetch(
    `/users/${rut}/notifications/${notifId}`,
    { method: "PATCH" },
    token ?? undefined
  );
}
