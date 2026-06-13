import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiFetch } from "./api";

const RESET_RUT_KEY  = "ph_reset_rut";
const RESET_CODE_KEY = "ph_reset_code";

export async function sendSmsOtp(rut: number): Promise<void> {
  await apiFetch<{ message: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ rut }),
  });
}

export async function verifyOtp(rut: number, code: string): Promise<void> {
  await apiFetch<{ message: string; valid: boolean }>("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({ rut, code }),
  });
  await AsyncStorage.multiSet([
    [RESET_RUT_KEY,  String(rut)],
    [RESET_CODE_KEY, code],
  ]);
}

export async function resetPasswordWithOtp(newPassword: string): Promise<void> {
  const [[, rutStr], [, code]] = await AsyncStorage.multiGet([RESET_RUT_KEY, RESET_CODE_KEY]);
  if (!rutStr || !code) throw new Error("Sesión de recuperación expirada. Inicia el proceso de nuevo.");

  await apiFetch<{ message: string }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ rut: Number(rutStr), code, new_password: newPassword }),
  });

  await AsyncStorage.multiRemove([RESET_RUT_KEY, RESET_CODE_KEY]);
}
