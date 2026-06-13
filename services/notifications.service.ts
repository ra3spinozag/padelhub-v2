import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { apiFetch } from "./api";
import { getStoredToken } from "./auth.service";

const PUSH_TOKEN_KEY = "ph_push_token";

export async function getPushToken(): Promise<string | null> {
  if (!Device.isDevice) return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "PadelHub",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#4f46e5",
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as any).easConfig?.projectId;

  const { data } = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : {}
  );
  await AsyncStorage.setItem(PUSH_TOKEN_KEY, data);
  return data;
}

export async function registerDeviceToken(rut: number, token: string): Promise<void> {
  const authToken = await getStoredToken();
  await apiFetch(
    `/users/${rut}/device-token`,
    { method: "POST", body: JSON.stringify({ token, platform: Platform.OS }) },
    authToken ?? undefined
  );
}

export async function unregisterDeviceToken(rut: number): Promise<void> {
  const token = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
  if (!token) return;
  const authToken = await getStoredToken();
  try {
    await apiFetch(
      `/users/${rut}/device-token`,
      { method: "DELETE", body: JSON.stringify({ token }) },
      authToken ?? undefined
    );
  } finally {
    await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
  }
}
