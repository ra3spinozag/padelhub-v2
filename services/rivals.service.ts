import { apiFetch } from "./api";
import { getStoredToken } from "./auth.service";

export interface SuggestedRival {
  id: string;
  name: string;
  photo_url: string | null;
  level: string;
  zone: string;
  mmr: number;
  mmr_diff: number;
}

export interface SuggestRivalsResponse {
  requester: { mmr: number; zone: string };
  filters: { mmr_range: number; zone: string };
  total: number;
  rivals: SuggestedRival[];
}

export async function getSuggestedRivals(
  rut: number,
  params?: { limit?: number; mmr_range?: number; zone?: boolean }
): Promise<SuggestRivalsResponse> {
  const token = await getStoredToken();
  const query = new URLSearchParams();
  if (params?.limit     != null) query.set("limit",     String(params.limit));
  if (params?.mmr_range != null) query.set("mmr_range", String(params.mmr_range));
  if (params?.zone      != null) query.set("zone",      String(params.zone));
  const qs = query.toString();
  return apiFetch<SuggestRivalsResponse>(
    `/users/${rut}/suggest-rivals${qs ? `?${qs}` : ""}`,
    {},
    token ?? undefined
  );
}
