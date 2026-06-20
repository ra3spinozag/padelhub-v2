import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator, FlatList, KeyboardAvoidingView,
  Platform, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../../context/AuthContext";
import {
  getChatMessages, sendChatMessage, type ChatMessage,
} from "../../../services/chat.service";
import { UserAvatar } from "../../../components/UserAvatar";
import { getAvatarColor } from "../../../context/PartidosContext";
import { C, S } from "../../../theme";

const MAX_CHARS = 500;
const POLL_MS   = 5000;

function userColorIndex(userId: string): number {
  let h = 0;
  for (let i = 0; i < userId.length; i++) h = (h * 31 + userId.charCodeAt(i)) & 0xffff;
  return h;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

export default function ChatScreen() {
  const { id }   = useLocalSearchParams<{ id: string }>();
  const router   = useRouter();
  const { user } = useAuth();
  const insets   = useSafeAreaInsets();

  const [messages,     setMessages]    = useState<ChatMessage[]>([]);
  const [loading,      setLoading]     = useState(true);
  const [loadingMore,  setLoadingMore] = useState(false);
  const [hasMore,      setHasMore]     = useState(false);
  const [text,         setText]        = useState("");
  const [sending,      setSending]     = useState(false);
  const [error,        setError]       = useState("");

  const seenIds       = useRef(new Set<string>());
  const oldestDateRef = useRef<string | null>(null);

  const sorted = (msgs: ChatMessage[]) =>
    [...msgs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const merge = useCallback((incoming: ChatMessage[]) => {
    const fresh = incoming.filter((m) => !seenIds.current.has(m.id));
    if (!fresh.length) return;
    fresh.forEach((m) => seenIds.current.add(m.id));
    setMessages((prev) => sorted([...fresh, ...prev]));
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!user?.id || !id) return;
      let cancelled = false;

      (async () => {
        try {
          const res = await getChatMessages(id, user.id, { limit: 30 });
          if (cancelled) return;
          seenIds.current = new Set(res.messages.map((m) => m.id));
          const s = sorted(res.messages);
          setMessages(s);
          setHasMore(res.has_more ?? res.messages.length >= 30);
          oldestDateRef.current = s.at(-1)?.created_at ?? null;
        } catch (e: any) {
          if (!cancelled) setError(e.message ?? "Error al cargar el chat");
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();

      const interval = setInterval(async () => {
        if (cancelled || !user?.id || !id) return;
        try {
          const res = await getChatMessages(id, user.id, { limit: 30 });
          merge(res.messages);
        } catch { /* silent */ }
      }, POLL_MS);

      return () => { cancelled = true; clearInterval(interval); };
    }, [id, user?.id, merge])
  );

  const handleLoadMore = async () => {
    if (!user?.id || !id || !oldestDateRef.current || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await getChatMessages(id, user.id, { limit: 30, before: oldestDateRef.current });
      const older = res.messages.filter((m) => !seenIds.current.has(m.id));
      older.forEach((m) => seenIds.current.add(m.id));
      const s = sorted(older);
      setMessages((prev) => [...prev, ...s]);
      setHasMore(res.has_more ?? res.messages.length >= 30);
      if (s.length) oldestDateRef.current = s.at(-1)!.created_at;
    } catch { /* silent */ } finally {
      setLoadingMore(false);
    }
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || !user?.id || !id || sending) return;
    setSending(true);
    setText("");
    try {
      const msg = await sendChatMessage(id, user.id, trimmed);
      if (!seenIds.current.has(msg.id)) {
        seenIds.current.add(msg.id);
        setMessages((prev) => [msg, ...prev]);
      }
    } catch (e: any) {
      setText(trimmed);
      setError(e.message ?? "Error al enviar");
      setTimeout(() => setError(""), 3000);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View style={[S.screen, { alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator color={C.accent} size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={S.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View style={{
        flexDirection: "row", alignItems: "center", gap: 12,
        padding: 16, paddingTop: 20,
        borderBottomWidth: 1, borderBottomColor: C.border,
        backgroundColor: C.bg2,
      }}>
        <TouchableOpacity
          style={S.backBtn}
          onPress={() => router.canGoBack() ? router.back() : router.replace("/(app)/home")}
        >
          <Text style={S.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 17, fontWeight: "700", color: C.text }}>Chat del partido</Text>
          <Text style={{ fontSize: 11, color: C.text2, marginTop: 1 }}>
            Actualiza cada {POLL_MS / 1000}s
          </Text>
        </View>
      </View>

      {/* Error banner */}
      {error ? (
        <View style={{ backgroundColor: "rgba(239,68,68,0.12)", borderBottomWidth: 1, borderBottomColor: "rgba(239,68,68,0.25)", paddingHorizontal: 16, paddingVertical: 8 }}>
          <Text style={{ fontSize: 13, color: "#fca5a5" }}>{error}</Text>
        </View>
      ) : null}

      {/* Messages */}
      <FlatList
        inverted
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingVertical: 48 }}>
            <Text style={{ fontSize: 28, marginBottom: 10 }}>💬</Text>
            <Text style={{ fontSize: 14, fontWeight: "600", color: C.text, marginBottom: 4 }}>Sin mensajes aún</Text>
            <Text style={{ fontSize: 13, color: C.text2 }}>¡Rompe el hielo con tu equipo!</Text>
          </View>
        }
        ListFooterComponent={
          hasMore ? (
            <TouchableOpacity
              onPress={handleLoadMore}
              disabled={loadingMore}
              style={{ alignItems: "center", paddingVertical: 14 }}
            >
              {loadingMore
                ? <ActivityIndicator color={C.accent} size="small" />
                : <Text style={{ fontSize: 13, color: C.accent }}>Cargar mensajes anteriores</Text>}
            </TouchableOpacity>
          ) : null
        }
        renderItem={({ item }) => {
          const isMe       = item.user_id === user?.id;
          const senderName = item.users?.name ?? item.user_name ?? null;
          const senderPhoto = item.users?.photo_url ?? item.user_photo_url ?? null;
          const displayName = isMe ? "Tú" : (senderName?.split(" ")[0] ?? "?");
          const color      = getAvatarColor(userColorIndex(item.user_id));

          return (
            <View style={{
              flexDirection: isMe ? "row-reverse" : "row",
              alignItems: "flex-end",
              gap: 10,
              marginBottom: 6,
            }}>
              {/* Avatar */}
              <UserAvatar
                name={senderName ?? "?"}
                photoUrl={isMe ? null : senderPhoto}
                size={36}
                borderRadius={12}
                color={color}
              />

              <View style={{ maxWidth: "72%" }}>
                {/* Nombre */}
                <Text style={{
                  fontSize: 11, fontWeight: "700",
                  color: isMe ? C.accent : color,
                  marginBottom: 4,
                  textAlign: isMe ? "right" : "left",
                  marginHorizontal: 4,
                }}>
                  {displayName}
                </Text>

                {/* Burbuja */}
                <View style={{
                  backgroundColor: isMe ? C.accent : C.bg3,
                  borderRadius: 16,
                  borderBottomRightRadius: isMe ? 4 : 16,
                  borderBottomLeftRadius:  isMe ? 16 : 4,
                  paddingHorizontal: 13,
                  paddingVertical: 9,
                  borderWidth: isMe ? 0 : 1,
                  borderColor: C.border,
                }}>
                  <Text style={{ fontSize: 14, color: isMe ? "#fff" : C.text, lineHeight: 20 }}>
                    {item.content}
                  </Text>
                </View>

                {/* Hora */}
                <Text style={{
                  fontSize: 10, color: C.text2, marginTop: 3,
                  textAlign: isMe ? "right" : "left",
                  marginHorizontal: 4,
                }}>
                  {formatTime(item.created_at)}
                </Text>
              </View>
            </View>
          );
        }}
      />

      {/* Input bar */}
      <View style={{
        flexDirection: "row", alignItems: "flex-end", gap: 10,
        paddingHorizontal: 16, paddingTop: 12,
        paddingBottom: Math.max(12, insets.bottom),
        borderTopWidth: 1, borderTopColor: C.border,
        backgroundColor: C.bg2,
      }}>
        <View style={{ flex: 1 }}>
          <TextInput
            style={[S.input, { maxHeight: 100, paddingTop: 10 }]}
            value={text}
            onChangeText={(v) => setText(v.slice(0, MAX_CHARS))}
            placeholder="Mensaje..."
            placeholderTextColor={C.text2}
            multiline
          />
          {text.length > MAX_CHARS * 0.8 && (
            <Text style={{
              fontSize: 10, textAlign: "right", marginTop: 3,
              color: text.length >= MAX_CHARS ? C.red : C.text2,
            }}>
              {text.length}/{MAX_CHARS}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={[{
            width: 44, height: 44,
            backgroundColor: C.accent,
            borderRadius: 13,
            alignItems: "center", justifyContent: "center",
          }, (!text.trim() || sending) && S.btnDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || sending}
        >
          {sending
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={{ color: "#fff", fontSize: 20, lineHeight: 24 }}>↑</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
