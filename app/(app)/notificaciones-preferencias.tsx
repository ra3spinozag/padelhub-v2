import { useEffect, useState } from "react";
import { ActivityIndicator, Switch, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import {
  getNotificationPreferences, updateNotificationPreferences,
  type NotificationPreferences,
} from "../../services/notification-preferences.service";
import { C, S } from "../../theme";

const PREF_CONFIG: { key: keyof NotificationPreferences; icon: string; title: string; sub: string }[] = [
  { key: "match_invitation", icon: "🎾", title: "Invitaciones",  sub: "Cuando alguien te invita a un partido"  },
  { key: "match_reminder",   icon: "⏰", title: "Recordatorios", sub: "Antes de que empiece un partido"        },
  { key: "chat_message",     icon: "💬", title: "Chat",          sub: "Mensajes en partidos confirmados"       },
  { key: "match_result",     icon: "🏆", title: "Resultados",    sub: "Cuando se confirma el resultado"        },
  { key: "match_rating",     icon: "⭐", title: "Valoraciones",  sub: "Cuando alguien te valora"               },
  { key: "suspension",       icon: "⚠️", title: "Suspensiones",  sub: "Avisos sobre tu cuenta"                 },
];

export default function NotificacionesPreferenciasScreen() {
  const { user } = useAuth();
  const router   = useRouter();

  const [prefs,   setPrefs]   = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (!user?.rut) return;
    getNotificationPreferences(user.rut)
      .then(setPrefs)
      .catch((e: any) => setError(e.message ?? "Error al cargar preferencias"))
      .finally(() => setLoading(false));
  }, [user?.rut]);

  const handleToggle = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!user?.rut || !prefs) return;
    const snapshot = { ...prefs };
    setPrefs({ ...prefs, [key]: value });
    try {
      const updated = await updateNotificationPreferences(user.rut, { [key]: value });
      setPrefs(updated);
    } catch {
      setPrefs(snapshot);
      setError("No se pudo guardar. Inténtalo de nuevo.");
      setTimeout(() => setError(""), 3000);
    }
  };

  return (
    <View style={S.screen}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 20, paddingBottom: 16 }}>
        <TouchableOpacity
          style={S.backBtn}
          onPress={() => router.canGoBack() ? router.back() : router.replace("/(app)/notificaciones" as any)}
        >
          <Text style={S.backBtnText}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={{ fontSize: 18, fontWeight: "700", color: C.text }}>Preferencias</Text>
          <Text style={{ fontSize: 12, color: C.text2, marginTop: 1 }}>Notificaciones push</Text>
        </View>
      </View>

      {/* Error */}
      {error ? (
        <View style={[S.error, { marginHorizontal: 20, marginBottom: 4 }]}>
          <Text style={S.errorText}>⚠️ {error}</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={C.accent} size="large" />
        </View>
      ) : !prefs ? null : (
        <View style={{ paddingHorizontal: 20 }}>
          <Text style={{ fontSize: 12, color: C.text2, marginBottom: 16, lineHeight: 18 }}>
            Controla qué notificaciones push recibes. Las desactivadas siguen apareciendo en el centro de notificaciones.
          </Text>
          <View style={S.card}>
            {PREF_CONFIG.map((cfg, i) => (
              <View
                key={cfg.key}
                style={{
                  flexDirection: "row", alignItems: "center", gap: 12,
                  paddingVertical: 14,
                  borderBottomWidth: i < PREF_CONFIG.length - 1 ? 1 : 0,
                  borderBottomColor: C.border,
                }}
              >
                <View style={{
                  width: 40, height: 40, borderRadius: 12,
                  backgroundColor: prefs[cfg.key] ? "rgba(79,70,229,0.15)" : C.bg4,
                  alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Text style={{ fontSize: 18 }}>{cfg.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: C.text, marginBottom: 2 }}>
                    {cfg.title}
                  </Text>
                  <Text style={{ fontSize: 12, color: C.text2, lineHeight: 16 }}>
                    {cfg.sub}
                  </Text>
                </View>
                <Switch
                  value={prefs[cfg.key]}
                  onValueChange={(v) => handleToggle(cfg.key, v)}
                  trackColor={{ false: C.bg4, true: "rgba(79,70,229,0.5)" }}
                  thumbColor={prefs[cfg.key] ? C.accent : C.text2}
                  ios_backgroundColor={C.bg4}
                />
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
