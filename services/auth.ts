import AsyncStorage from "@react-native-async-storage/async-storage";

// Tipado estricto basado exactamente en las columnas de tu PostgreSQL de Pádel
export interface User {
  id: string;
  rut: number;
  dv_rut: string;
  phone: string;
  name: string;
  photo_url: string | null;
  level: "primera" | "segunda" | "tercera" | "cuarta" | "quinta" | "sexta" | "septima_mas";
  zone: string;
  mmr: number;
  role: "player" | "admin";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RegisterData {
  rut: number;
  dv_rut: string;
  phone: string;
  name: string;
  password?: string;
  zone: string;
  level?: string;
}

// ⚠️ Usa tu dirección IP local si estás probando con un dispositivo celular físico en Expo Go
const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.XX:3000/api";

const STORAGE_KEY = "@PadelHub:user_session";

async function handleResponse(response: Response) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Error procesando la solicitud.");
  }
  return data;
}

// Iniciar sesión contra Next.js
export async function loginUser(phone: string, password: string): Promise<{ user: User }> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: phone.trim(), password }),
  });
  
  const data = await handleResponse(response);
  // Almacenamos el JSON del usuario de forma persistente en el dispositivo móvil
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
  return data;
}

// Registrar un nuevo perfil en el servidor
export async function registerUser(registerData: RegisterData): Promise<{ user: User }> {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(registerData),
  });
  
  const data = await handleResponse(response);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
  return data;
}

// Eliminar los datos del Storage al salir
export async function logoutUser(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

// Modificar datos del perfil (Se integra perfecto con Cloudinary más adelante para la foto)
export async function updateProfile(userId: string, profileData: Partial<User>): Promise<User> {
  const response = await fetch(`${API_URL}/users/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profileData),
  });
  
  const data = await handleResponse(response);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data.user || data));
  return data.user || data;
}

// Auxiliar: Verifica si el usuario cuenta con una sesión iniciada al abrir la app
export async function isAuthenticated(): Promise<boolean> {
  const user = await AsyncStorage.getItem(STORAGE_KEY);
  return user !== null;
}

// Auxiliar: Extrae el objeto de usuario activo del Storage
export async function getStoredUser(): Promise<User | null> {
  const userStr = await AsyncStorage.getItem(STORAGE_KEY);
  return userStr ? JSON.parse(userStr) : null;
}
// ─── FUNCIONES DE RECUPERACIÓN DE CONTRASEÑA ─────────────────────────────────

/**
 * 1. Solicita el envío de un código OTP al WhatsApp del usuario
 */
export async function forgotPassword(phone: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: phone.trim() }), // Aseguramos que no haya espacios al inicio o final del número 
  });

  const data = await handleResponse(response);
  return data;
}

/**
 * 2. Verifica si el código OTP ingresado por el jugador es correcto
 */
export async function verifyOtpApi(phone: string, otp: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_URL}/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: phone.trim(), otp: otp.trim() }),
  });

  const data = await handleResponse(response);
  return data;
}

/**
 * 3. Establece la nueva contraseña en la base de datos usando el código verificado
 */
export async function resetPassword(phone: string, otp: string, newPassword: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      phone: phone.trim(), 
      otp: otp.trim(), 
      password: newPassword 
    }),
  });

  const data = await handleResponse(response);
  return data;
}