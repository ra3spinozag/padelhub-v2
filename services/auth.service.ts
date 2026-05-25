import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiFetch } from "./api";

export interface User {
  id: string;
  rut?: number;
  dv_rut?: string;
  phone: string;
  name: string;
  photo_url: string | null;
  level: string | null;
  zone: string | null;
  mmr: number;
  role: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface RegisterData {
  rut: number;
  dv_rut: string;
  name: string;
  phone: string;
  password: string;
  zone: string;
}

// ── HU-002: Login (rut + password) ────────────────────────────────────────────
export async function loginUser(
  rut: number,
  password: string
): Promise<{ user: User }> {
  const data = await apiFetch<{ message: string; user: User; token?: string }>(
    "/auth/login",
    { method: "POST", body: JSON.stringify({ rut, password }) }
  );
  if (data.token) await AsyncStorage.setItem("ph_token", data.token);
  await AsyncStorage.setItem("ph_user", JSON.stringify(data.user));
  return { user: data.user };
}

// ── HU-001a: Solo registrar (sin iniciar sesión) ───────────────────────────────
export async function signUpUser(data: RegisterData): Promise<void> {
  await apiFetch<{ message: string }>("/users", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ── HU-001b: Registro + login automático ──────────────────────────────────────
export async function registerUser(
  data: RegisterData
): Promise<{ user: User }> {
  await signUpUser(data);
  return loginUser(data.rut, data.password);
}

// ── HU-003: Editar perfil ──────────────────────────────────────────────────────
export async function updateProfile(
  userId: string,
  data: Partial<User>
): Promise<User> {
  const token = await getStoredToken();
  const updated = await apiFetch<User>(
    `/users/${userId}/profile`,
    { method: "PUT", body: JSON.stringify(data) },
    token ?? undefined
  );
  await AsyncStorage.setItem("ph_user", JSON.stringify(updated));
  return updated;
}

// ── HU-003b: Subir foto de perfil ─────────────────────────────────────────────
export async function uploadProfilePhoto(
  userId: string,
  imageUri: string
): Promise<string> {
  const token = await getStoredToken();
  const BASE_URL = "https://padelhub-backend-phi.vercel.app/api";

  const form = new FormData();
  const ext  = imageUri.split(".").pop() ?? "jpg";
  form.append("photo", {
    uri:  imageUri,
    name: `avatar.${ext}`,
    type: `image/${ext === "jpg" ? "jpeg" : ext}`,
  } as any);

  const res = await fetch(`${BASE_URL}/users/${userId}/photo`, {
    method:  "POST",
    headers: {
      "Content-Type":  "multipart/form-data",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: form,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any)?.message ?? `Error ${res.status}`);
  return (data as { photo_url: string }).photo_url;
}

// ── Listar usuarios (para picker de invitaciones) ─────────────────────────────
export interface PublicUser {
  id: string;
  name: string;
  level: string | null;
  zone: string | null;
  photo_url: string | null;
  mmr: number;
}

export async function listUsers(): Promise<PublicUser[]> {
  const token = await getStoredToken();
  return apiFetch<PublicUser[]>("/users", {}, token ?? undefined);
}

// ── HU-004: Logout ─────────────────────────────────────────────────────────────
export async function logoutUser(): Promise<void> {
  await AsyncStorage.multiRemove(["ph_token", "ph_user"]);
}

// ── Helpers ────────────────────────────────────────────────────────────────────
export async function getStoredUser(): Promise<User | null> {
  const raw = await AsyncStorage.getItem("ph_user");
  return raw ? JSON.parse(raw) : null;
}

export async function getStoredToken(): Promise<string | null> {
  return AsyncStorage.getItem("ph_token");
}

export async function isAuthenticated(): Promise<boolean> {
  const raw = await AsyncStorage.getItem("ph_user");
  return !!raw;
}
