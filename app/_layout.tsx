import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { PartidosProvider } from "../context/PartidosContext";

if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

// Guarda de rutas: equivalente al ProtectedRoute web
function RouteGuard() {
  const { isLogged, loading } = useAuth();
  const segments = useSegments();
  const router   = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuth = segments[0] === "(auth)";

    if (!isLogged && !inAuth) {
      // Sin sesión fuera de auth → login
      router.replace("/(auth)/login");
    } else if (isLogged && inAuth) {
      // Con sesión dentro de auth → home
      router.replace("/(app)/home");
    }
  }, [isLogged, loading, segments]);

  return null;
}

function AppWithProviders() {
  const { user } = useAuth();
  const router   = useRouter();
  const listenerRef = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    if (Platform.OS === "web") return;

    function handleResponse(response: Notifications.NotificationResponse) {
      const data = response.notification.request.content.data as Record<string, any>;
      const matchId = data?.matchId ?? data?.match_id;
      if (matchId) {
        router.push(`/(app)/partido/${matchId}` as any);
      }
    }

    listenerRef.current = Notifications.addNotificationResponseReceivedListener(handleResponse);
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) handleResponse(response);
    });

    return () => { listenerRef.current?.remove(); };
  }, []);

  return (
    <PartidosProvider userId={user?.id} userZone={user?.zone}>
      <RouteGuard />
      <Stack screenOptions={{ headerShown: false }} />
    </PartidosProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" backgroundColor="#0a0a12" />
      <AppWithProviders />
    </AuthProvider>
  );
}
