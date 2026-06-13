import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { getLeaderboard, type LeaderboardPlayer } from "../../services/leaderboard.service";
import { C, S } from "../../theme";
import { UserAvatar } from "../../components/UserAvatar";

const ZONAS   = ["Nacional", "Valparaíso", "Viña del Mar", "Quilpué", "Concón", "Santiago"];
const NIVELES = ["Todos", "1ra", "2da", "3ra", "4ta", "5ta", "6ta", "7ma+"];
const MEDAL   = ["🥇", "🥈", "🥉"];

const AVATAR_COLORS = ["#4f46e5", "#0891b2", "#d97706", "#059669", "#7c3aed", "#b45309"];
function avatarColor(index: number) { return AVATAR_COLORS[index % AVATAR_COLORS.length]; }

export default function RankingScreen() {
  const { user } = useAuth();
  const router   = useRouter();

  const [zona,      setZona]      = useState(user?.zone ?? "Nacional");
  const [nivel,     setNivel]     = useState("Todos");
  const [showZonas, setShowZonas] = useState(false);
  const [showNivel, setShowNivel] = useState(false);
  const [players,   setPlayers]   = useState<LeaderboardPlayer[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    getLeaderboard({
      zone:  zona  !== "Nacional" ? zona  : undefined,
      level: nivel !== "Todos"   ? nivel : undefined,
      limit: 50,
    })
      .then((res) => { if (!cancelled) setPlayers(res.players); })
      .catch((e)  => { if (!cancelled) setError(e.message ?? "Error al cargar"); })
      .finally(()  => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [zona, nivel]);

  const podio = players.slice(0, 3);
  const lista = players.slice(3);

  return (
    <View style={S.screen}>
      <ScrollView style={S.scroll} contentContainerStyle={{ paddingBottom: 16 }}>

        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, paddingBottom: 16 }}>
          <TouchableOpacity style={S.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace("/(app)/home")}>
            <Text style={S.backBtnText}>←</Text>
          </TouchableOpacity>
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: C.text }}>Ranking</Text>
            <Text style={{ fontSize: 12, color: C.text2 }}>{zona} · Temporada 2026</Text>
          </View>
          <TouchableOpacity
            style={{ backgroundColor: C.bg3, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingVertical: 6, paddingHorizontal: 12 }}
            onPress={() => setShowZonas(true)}
          >
            <Text style={{ fontSize: 12, color: C.text }}>{zona} ▾</Text>
          </TouchableOpacity>
        </View>

        {/* Filtro nivel */}
        <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <TouchableOpacity
            style={{ flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start",
              backgroundColor: C.bg3, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingVertical: 6, paddingHorizontal: 12 }}
            onPress={() => setShowNivel(true)}
          >
            <Text style={{ fontSize: 12, color: C.text2 }}>Nivel:</Text>
            <Text style={{ fontSize: 12, color: C.text, fontWeight: "600" }}>{nivel} ▾</Text>
          </TouchableOpacity>
        </View>

        <View style={{ paddingHorizontal: 20 }}>

          {loading ? (
            <View style={{ alignItems: "center", paddingVertical: 60 }}>
              <ActivityIndicator color={C.accent} size="large" />
              <Text style={{ fontSize: 13, color: C.text2, marginTop: 12 }}>Cargando ranking…</Text>
            </View>
          ) : error ? (
            <View style={[S.card, { alignItems: "center", padding: 28 }]}>
              <Text style={{ fontSize: 28, marginBottom: 10 }}>⚠️</Text>
              <Text style={{ fontSize: 14, fontWeight: "600", color: C.text, marginBottom: 6 }}>Error al cargar</Text>
              <Text style={{ fontSize: 13, color: C.text2, textAlign: "center", marginBottom: 16 }}>{error}</Text>
              <TouchableOpacity style={S.btn} onPress={() => { setError(""); setLoading(true); }}>
                <Text style={S.btnText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : players.length === 0 ? (
            <View style={[S.card, { alignItems: "center", padding: 28 }]}>
              <Text style={{ fontSize: 28, marginBottom: 10 }}>🏆</Text>
              <Text style={{ fontSize: 14, fontWeight: "600", color: C.text, marginBottom: 6 }}>Sin jugadores aún</Text>
              <Text style={{ fontSize: 13, color: C.text2, textAlign: "center" }}>No hay datos para los filtros seleccionados</Text>
            </View>
          ) : (
            <>
              {/* Podio */}
              {podio.length >= 3 && (
                <View style={{ flexDirection: "row", gap: 8, marginBottom: 20, alignItems: "flex-end" }}>
                  {[podio[1], podio[0], podio[2]].map((p, i) => {
                    const realPos = i === 0 ? 2 : i === 1 ? 1 : 3;
                    const sizes   = [56, 68, 56];
                    const isMe    = p.id === user?.id;
                    return (
                      <View key={p.id} style={{ flex: i === 1 ? 1.15 : 1, alignItems: "center" }}>
                        <UserAvatar
                          name={p.name}
                          photoUrl={p.photo_url}
                          size={sizes[i]}
                          color={isMe ? C.accent : avatarColor(p.rank - 1)}
                          borderRadius={18}
                          fontSize={i === 1 ? 20 : 16}
                        />
                        <Text style={{ fontSize: 13, fontWeight: "700", color: isMe ? C.accent : C.text, marginTop: 6, marginBottom: 2 }}>
                          {p.name.split(" ")[0]} {p.name.split(" ")[1]?.[0] ?? ""}.
                        </Text>
                        <Text style={{ fontSize: 16, fontWeight: "800", color: realPos === 1 ? "#f59e0b" : C.text }}>
                          {p.mmr.toLocaleString()}
                        </Text>
                        <View style={{
                          backgroundColor: realPos === 1 ? "rgba(245,158,11,0.15)" : C.bg3,
                          borderWidth: 1, borderColor: realPos === 1 ? "rgba(245,158,11,0.4)" : C.border,
                          borderRadius: 10, paddingVertical: 6, paddingHorizontal: 12, marginTop: 6,
                        }}>
                          <Text style={{ fontSize: 18 }}>{MEDAL[realPos - 1]}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Lista */}
              <View style={S.card}>
                {(podio.length >= 3 ? lista : players).map((j, i) => {
                  const isMe = j.id === user?.id;
                  return (
                    <View key={j.id} style={{
                      flexDirection: "row", alignItems: "center", gap: 12,
                      paddingVertical: 11,
                      borderBottomWidth: i < (podio.length >= 3 ? lista : players).length - 1 ? 1 : 0,
                      borderBottomColor: C.border,
                      backgroundColor: isMe ? "rgba(79,70,229,0.05)" : "transparent",
                      borderRadius: isMe ? 8 : 0,
                    }}>
                      <Text style={{ width: 22, fontSize: 13, color: C.text2, fontWeight: "600", textAlign: "center" }}>{j.rank}</Text>
                      <UserAvatar
                        name={j.name}
                        photoUrl={j.photo_url}
                        size={36}
                        color={isMe ? C.accent : avatarColor(j.rank - 1)}
                        borderRadius={12}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: isMe ? "700" : "500", color: isMe ? C.accent : C.text }}>
                          {j.name}{isMe ? " · Tú" : ""}
                        </Text>
                        <Text style={{ fontSize: 12, color: C.text2 }}>{j.zone} · {j.level}</Text>
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={{ fontSize: 15, fontWeight: "800", color: C.text }}>{j.mmr.toLocaleString()}</Text>
                        <Text style={{ fontSize: 11, color: C.text2 }}>{j.matches_played}p</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Modal zonas */}
      <Modal visible={showZonas} transparent animationType="fade">
        <TouchableOpacity style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }} onPress={() => setShowZonas(false)}>
          <View style={{ position: "absolute", top: 100, right: 20, backgroundColor: C.bg3, borderWidth: 1, borderColor: C.border, borderRadius: 12, minWidth: 180, overflow: "hidden" }}>
            {ZONAS.map((z) => (
              <TouchableOpacity key={z} onPress={() => { setZona(z); setShowZonas(false); }}
                style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: z === zona ? "rgba(79,70,229,0.1)" : "transparent" }}>
                <Text style={{ fontSize: 13, color: z === zona ? C.accent : C.text }}>{z}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal nivel */}
      <Modal visible={showNivel} transparent animationType="fade">
        <TouchableOpacity style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }} onPress={() => setShowNivel(false)}>
          <View style={{ position: "absolute", top: 100, left: 20, backgroundColor: C.bg3, borderWidth: 1, borderColor: C.border, borderRadius: 12, minWidth: 160, overflow: "hidden" }}>
            {NIVELES.map((n) => (
              <TouchableOpacity key={n} onPress={() => { setNivel(n); setShowNivel(false); }}
                style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: n === nivel ? "rgba(79,70,229,0.1)" : "transparent" }}>
                <Text style={{ fontSize: 13, color: n === nivel ? C.accent : C.text }}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
