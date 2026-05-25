import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { PartidosProvider } from "../context/PartidosContext";

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
