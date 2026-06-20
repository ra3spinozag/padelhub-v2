import { apiFetch } from "./api";
import { getStoredToken } from "./auth.service";

export interface ChatMessage {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  users?: {
    name?: string | null;
    photo_url?: string | null;
  };
  // campos planos por compatibilidad
  user_name?: string | null;
  user_photo_url?: string | null;
}

export interface ChatResponse {
  messages: ChatMessage[];
  has_more?: boolean;
  oldest_message_date?: string | null;
}

export async function getChatMessages(
  matchId: string,
  userId: string,
  params?: { limit?: number; before?: string }
): Promise<ChatResponse> {
  const token = await getStoredToken();
  const query = new URLSearchParams({ user_id: userId });
  if (params?.limit)  query.set("limit",  String(params.limit));
  if (params?.before) query.set("before", params.before);
  return apiFetch<ChatResponse>(
    `/matches/${matchId}/chat?${query.toString()}`,
    {},
    token ?? undefined
  );
}

export async function sendChatMessage(
  matchId: string,
  userId: string,
  content: string
): Promise<ChatMessage> {
  const token = await getStoredToken();
  return apiFetch<ChatMessage>(
    `/matches/${matchId}/chat`,
    { method: "POST", body: JSON.stringify({ user_id: userId, content }) },
    token ?? undefined
  );
}
