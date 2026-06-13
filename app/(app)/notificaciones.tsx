import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../context/AuthContext";
import {
  getNotifications, markAllRead, markOneRead,
  type AppNotification,
} from "../../services/notifications-center.service";
import { C, S } from "../../theme";

const TYPE_ICON: Record<string, string> = {
  match_invitation: "🎾",
  match_result:     "🏆",
  chat_message:     "💬",
  match_reminder:   "⏰",
  match_cancelled:  "❌",
  match_suspension: "⚠️",
};

function notifIcon(type: string) {
  return TYPE_ICON[type] ?? "🔔";
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min  = Math.floor(diff / 60_000);
  const hr   = Math.floor(diff / 3_600_000);
  const day  = Math.floor(diff / 86_400_000);
  if (min < 1)  return "Ahora";
  if (min < 60) return `Hace ${min} min`;
  if (hr  < 24) return `Hace ${hr} h`;
  if (day < 7)  return `Hace ${day} día${day > 1 ? "s" : ""}`;
  const d = new Date(iso);
  return `${d.getUTCDate()}/${d.getUTCMonth() + 1}/${d.getUTCFullYear()}`;
}

function resolveRoute(notif: AppNotification): string | null {
  const matchId = notif.data?.matchId ?? notif.data?.match_id;
  switch (notif.type) {
    case "chat_message":     return matchId ? `/(app)/chat/${matchId}`    : null;
    case "match_invitation": return matchId ? `/(app)/partido/${matchId}` : "/(app)/invitaciones";
    case "match_result":
    case "match_reminder":
    case "match_cancelled":  return matchId ? `/(app)/partido/${matchId}` : null;
    default:                 return matchId ? `/(app)/partido/${matchId}` : null;
  }
}

export default function NotificacionesScreen() {
  const { user }  = useAuth();
  const router    = useRouter();

  const [notifs,      setNotifs]     = useState<AppNotification[]>([]);
  const [loading,     setLoading]    = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore,     setHasMore]    = useState(false);
  const [markingAll,  setMarkingAll] = useState(false);
  const [error,       setError]      = useState("");

  const oldestRef = { current: null as string | null };

  useFocusEffect(
    useCallback(() => {
      if (!user?.rut) return;
      let cancelled = false;
      setLoading(true);
      getNotifications(user.rut, { limit: 20 })
        .then((res) => {
          if (cancelled) return;
          setNotifs(res.notifications);
          setHasMore(res.has_more ?? res.notifications.length >= 20);
          oldestRef.current = res.notifications.at(-1)?.created_at ?? null;
        })
        .catch((e) => { if (!cancelled) setError(e.message ?? "Error al cargar"); })
        .finally(() => { if (!cancelled) setLoading(false); });
      return () => { cancelled = true; };
    }, [user?.rut])
  );

  const handleLoadMore = async () => {
    if (!user?.rut || loadingMore || !hasMore) return;
    const before = notifs.at(-1)?.created_at;
    if (!before) return;
    setLoadingMore(true);
    try {
      const res = await getNotifications(user.rut, { limit: 20, before });
      setNotifs((prev) => [...prev, ...res.notifications]);
      setHasMore(res.has_more ?? res.notifications.length >= 20);
    } catch { /* silent */ } finally {
      setLoadingMore(false);
    }
  };

  const handleMarkAll = async () => {
    if (!user?.rut || markingAll) return;
    setMarkingAll(true);
    try {
      await markAllRead(user.rut);
      setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch { /* silent */ } finally {
      setMarkingAll(false);
    }
  };

  const handleTap = async (notif: AppNotification) => {
    if (!user?.rut) return;
    if (!notif.read) {
      markOneRead(user.rut, notif.id).catch(() => {});
      setNotifs((prev) => prev.map((n) => n.id === notif.id ? { ...n, read: true } : n));
    }
    const route = resolveRoute(notif);
    if (route) router.push(route as any);
  };

  const unread = notifs.filter((n) => !n.read).length;

  return (
    <View style={S.screen}>
      {/* Header */}
      <View style={{
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        padding: 20, paddingBottom: 16,
      }}>
        <TouchableOpacity
          style={S.backBtn}
          onPress={() => router.canGoBack() ? router.back() : router.replace("/(app)/home")}
        >
          <Text style={S.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: C.text }}>Notificaciones</Text>
          {unread > 0 && (
            <Text style={{ fontSize: 11, color: C.text2, marginTop: 2 }}>
              {unread} sin leer
            </Text>
          )}
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <TouchableOpacity onPress={() => router.push("/(app)/notificaciones-preferencias" as any)}>
            <Text style={{ fontSize: 18 }}>⚙️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleMarkAll}
            disabled={markingAll || unread === 0}
            style={{ opacity: unread === 0 ? 0.3 : 1 }}
          >
            {markingAll
              ? <ActivityIndicator color={C.accent} size="small" />
              : <Text style={{ fontSize: 12, color: C.accent, fontWeight: "600" }}>Leer todo</Text>}
          </TouchableOpacity>
        </View>
      </View>

      {/* Error */}
      {error ? (
        <View style={[S.error, { marginHorizontal: 20, marginBottom: 8 }]}>
          <Text style={S.errorText}>⚠️ {error}</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={C.accent} size="large" />
        </View>
      ) : notifs.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
          <Text style={{ fontSize: 40, marginBottom: 14 }}>🔔</Text>
          <Text style={{ fontSize: 16, fontWeight: "700", color: C.text, marginBottom: 8 }}>
            Sin notificaciones
          </Text>
          <Text style={{ fontSize: 13, color: C.text2, textAlign: "center" }}>
            Aquí aparecerán tus invitaciones, resultados y mensajes de chat
          </Text>
        </View>
      ) : (
        <ScrollView
          style={S.scroll}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        >
          <View style={S.card}>
            {notifs.map((notif, i) => (
              <TouchableOpacity
                key={notif.id}
                onPress={() => handleTap(notif)}
                style={{
                  flexDirection: "row", alignItems: "flex-start", gap: 12,
                  paddingVertical: 14,
                  borderBottomWidth: i < notifs.length - 1 ? 1 : 0,
                  borderBottomColor: C.border,
                  backgroundColor: notif.read ? "transparent" : "rgba(79,70,229,0.04)",
                }}
              >
                {/* Icon */}
                <View style={{
                  width: 40, height: 40, borderRadius: 12,
                  backgroundColor: notif.read ? C.bg4 : "rgba(79,70,229,0.15)",
                  alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Text style={{ fontSize: 18 }}>{notifIcon(notif.type)}</Text>
                </View>

                {/* Content */}
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={{
                      fontSize: 14, fontWeight: notif.read ? "500" : "700",
                      color: C.text, flex: 1,
                    }} numberOfLines={1}>
                      {notif.title}
                    </Text>
                    {!notif.read && (
                      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: C.accent }} />
                    )}
                  </View>
                  <Text style={{ fontSize: 13, color: C.text2, lineHeight: 18 }} numberOfLines={2}>
                    {notif.body}
                  </Text>
                  <Text style={{ fontSize: 11, color: C.text2, marginTop: 2 }}>
                    {relativeTime(notif.created_at)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {hasMore && (
            <TouchableOpacity
              onPress={handleLoadMore}
              disabled={loadingMore}
              style={{ alignItems: "center", paddingVertical: 16 }}
            >
              {loadingMore
                ? <ActivityIndicator color={C.accent} size="small" />
                : <Text style={{ fontSize: 13, color: C.accent }}>Cargar más</Text>}
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </View>
  );
}
