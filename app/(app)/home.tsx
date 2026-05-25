import { useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../context/AuthContext";
import {
  getAvatarColor, getFormatoLabel, getInitials, getStatusLabel, parseMatchDate,
  parseMatchTime, usePartidos
} from "../../context/PartidosContext";
import { C, S } from "../../theme";

// Demo de actividad reciente usando la estructura del backend
const ACTIVIDAD_DEMO: Record<string, {
  club: string;
  match_date: string;
  match_results: { score_team_a: string; score_team_b: string; winner: "team_a" | "team_b" };
  mmr_history: { delta: number };
  myTeam: "team_a" | "team_b";
  hace: string;
}[]> = {
  "e8a1b3c4-ad56-4d23-9871-bcde12345678": [
    {
      club: "Club Pádel Viña del Mar",
      match_date: "2026-05-18T00:00:00.000Z",
      match_results: { score_team_a: "6-3 / 6-4", score_team_b: "3-6 / 4-6", winner: "team_a" },
      mmr_history: { delta: 18 },
      myTeam: "team_a",
      hace: "Hace 3 días",
    },
    {
      club: "BluePadel",
      match_date: "2026-05-16T00:00:00.000Z",
      match_results: { score_team_a: "7-5 / 6-2", score_team_b: "5-7 / 2-6", winner: "team_a" },
      mmr_history: { delta: 22 },
      myTeam: "team_a",
      hace: "Hace 5 días",
    },
    {
      club: "Viña Pádel Club",
      match_date: "2026-05-14T00:00:00.000Z",
      match_results: { score_team_a: "3-6 / 4-6", score_team_b: "6-3 / 6-4", winner: "team_b" },
      mmr_history: { delta: -14 },
      myTeam: "team_a",
      hace: "Hace 7 días",
    },
  ],
};

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const { partidos }     = usePartidos();
  const router           = useRouter();

  const initiales      = user?.name ? getInitials(user.name) : "?";
  const proximoPartido = partidos.find(p => p.players.some(pl => pl.id === user?.id)) ?? null;
  const actividad      = user?.id ? (ACTIVIDAD_DEMO[user.id] ?? []) : [];
  const esNuevo        = actividad.length === 0;

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  return (
    <View style={S.screen}>
      <ScrollView style={S.scroll} contentContainerStyle={{ padding: 20, paddingBottom: 16 }}>

        {/* Top bar */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <View>
            <Text style={{ fontSize: 22, fontWeight: "800", color: C.text }}>
              Hola, {user?.name?.split(" ")[0]} 👋
            </Text>
            <Text style={{ fontSize: 13, color: C.text2, marginTop: 2 }}>
              {user?.zone ? `${user.zone} · ` : ""}MMR {user?.mmr ?? 1000}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(app)/perfil")}
            style={{ width: 44, height: 44, backgroundColor: C.accent, borderRadius: 14, alignItems: "center", justifyContent: "center" }}
          >
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>{initiales}</Text>
          </TouchableOpacity>
        </View>

        {/* MMR card */}
        <View style={S.mmrBar}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, color: C.text2, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>Tu MMR</Text>
            <Text style={S.mmrNum}>{user?.mmr ?? 1000}</Text>
            <Text style={{ fontSize: 12, color: C.text2, marginTop: 4 }}>
              {esNuevo ? "Juega partidos para obtener ranking" : `#14 en ${user?.zone ?? "tu zona"}`}
            </Text>
          </View>
          {!esNuevo && (
            <Text style={{ fontSize: 12, color: "#4ade80", fontWeight: "600" }}>▲ +127 este mes</Text>
          )}
        </View>

        {/* Próximo partido */}
        <Text style={[S.sectionLabel, { marginBottom: 8 }]}>Próximo partido</Text>

        {proximoPartido ? (
          <TouchableOpacity style={S.upcomingCard} onPress={() => router.push(`/(app)/partido/${proximoPartido.id}` as any)}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <View style={{ flexDirection: "row", gap: 6 }}>
                <View style={[S.pill, S.pillPurple]}>
                  <Text style={[S.pillText, S.pillPurpleText]}>{getFormatoLabel(proximoPartido.format)}</Text>
                </View>
                <View style={[S.pill, S.pillGreen]}>
                  <Text style={[S.pillText, S.pillGreenText]}>{getStatusLabel(proximoPartido.status)}</Text>
                </View>
              </View>
              <Text style={{ fontSize: 12, color: C.text2 }}>{parseMatchDate(proximoPartido.match_date)}</Text>
            </View>
            <Text style={{ fontSize: 17, fontWeight: "700", color: C.text, marginBottom: 4 }}>{proximoPartido.club}</Text>
            <Text style={{ fontSize: 13, color: C.text2, marginBottom: 12 }}>
              {parseMatchTime(proximoPartido.match_time)}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              {proximoPartido.players.map((mp, i) => (
                <View key={mp.id} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  {proximoPartido.format === "doubles" && i === 2 && (
                    <Text style={{ fontSize: 11, color: C.text2 }}>vs</Text>
                  )}
                  <View style={[S.avatar, { width: 32, height: 32, backgroundColor: getAvatarColor(i) }]}>
                    <Text style={[S.avatarText, { fontSize: 12 }]}>{getInitials(mp.name)}</Text>
                  </View>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[S.card, { marginBottom: 20, alignItems: "center", borderStyle: "dashed" }]}
            onPress={() => router.push("/(app)/crear")}
          >
            <Text style={{ fontSize: 28, marginBottom: 8 }}>🎾</Text>
            <Text style={{ fontSize: 14, fontWeight: "600", color: C.text, marginBottom: 4 }}>Sin partido próximo</Text>
            <Text style={{ fontSize: 12, color: C.accent }}>+ Crear uno ahora</Text>
          </TouchableOpacity>
        )}

        {/* Acciones rápidas */}
        <Text style={S.sectionLabel}>Acciones rápidas</Text>
        <View style={S.quickGrid}>
          {[
            { icon: "🏓", title: "Crear partido", sub: "Organiza un juego",    path: "/(app)/crear"       },
            { icon: "🎯", title: "Ver partidos",  sub: "Abiertos en tu zona",  path: "/(app)/partidos"    },
            { icon: "✉️", title: "Invitaciones",  sub: "Partidos recibidos",             path: "/(app)/invitaciones" },
            { icon: "📊", title: "Mi perfil",     sub: "Stats y historial",    path: "/(app)/perfil"      },
          ].map((a) => (
            <TouchableOpacity key={a.title} style={S.quickCard} onPress={() => router.push(a.path as any)}>
              <Text style={{ fontSize: 28, marginBottom: 8 }}>{a.icon}</Text>
              <Text style={{ fontSize: 14, fontWeight: "700", color: C.text, marginBottom: 2 }}>{a.title}</Text>
              <Text style={{ fontSize: 12, color: C.text2 }}>{a.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Actividad reciente */}
        <Text style={S.sectionLabel}>Actividad reciente</Text>
        {esNuevo ? (
          <View style={[S.card, { alignItems: "center", padding: 24, marginBottom: 24 }]}>
            <Text style={{ fontSize: 28, marginBottom: 8 }}>📋</Text>
            <Text style={{ fontSize: 14, fontWeight: "600", color: C.text, marginBottom: 4 }}>Sin actividad aún</Text>
            <Text style={{ fontSize: 12, color: C.text2 }}>Tus partidos jugados aparecerán aquí</Text>
          </View>
        ) : (
          <View style={[S.card, { marginBottom: 24 }]}>
            {actividad.map((a, i) => {
              const win   = a.match_results.winner === a.myTeam;
              const score = win ? a.match_results.score_team_a : a.match_results.score_team_b;
              const delta = a.mmr_history.delta;
              return (
                <View key={i} style={{
                  flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                  paddingVertical: 12,
                  borderBottomWidth: i < actividad.length - 1 ? 1 : 0,
                  borderBottomColor: C.border,
                }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: win ? C.green : C.red }} />
                    <View>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: C.text }}>
                        {win ? "Victoria" : "Derrota"} · {a.club}
                      </Text>
                      <Text style={{ fontSize: 12, color: C.text2 }}>{score} · {a.hace}</Text>
                    </View>
                  </View>
                  <View style={[S.pill, win ? S.pillGreen : S.pillRed]}>
                    <Text style={[S.pillText, win ? S.pillGreenText : S.pillRedText]}>
                      {delta > 0 ? `+${delta}` : delta} MMR
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Cerrar sesión */}
        <TouchableOpacity onPress={handleLogout} style={{ alignItems: "center", marginBottom: 16 }}>
          <Text style={{ fontSize: 12, color: C.text2, textDecorationLine: "underline" }}>Cerrar sesión</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}
