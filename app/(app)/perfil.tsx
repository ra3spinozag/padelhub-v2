import { useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { getInitials } from "../../context/PartidosContext";
import { C, S } from "../../theme";

const MMR_EVOLUCION = [980, 1020, 1005, 1080, 1120, 1190, 1248];
const SEMANAS       = ["S1","S2","S3","S4","S5","S6","S7"];

// Demo de historial usando la estructura del backend (match_results + mmr_history)
const HISTORIAL_DEMO: Record<string, {
  id: string;
  club: string;
  format: "doubles" | "singles";
  match_date: string;
  match_results: { score_team_a: string; score_team_b: string; winner: "team_a" | "team_b" };
  mmr_history: { delta: number; mmr_before: number; mmr_after: number };
  myTeam: "team_a" | "team_b";
}[]> = {
  "e8a1b3c4-ad56-4d23-9871-bcde12345678": [
    {
      id: "match-hist-001",
      club: "Club Pádel Viña del Mar",
      format: "doubles",
      match_date: "2026-05-18T00:00:00.000Z",
      match_results: { score_team_a: "6-3 / 6-4", score_team_b: "3-6 / 4-6", winner: "team_a" },
      mmr_history: { delta: 18, mmr_before: 1230, mmr_after: 1248 },
      myTeam: "team_a",
    },
    {
      id: "match-hist-002",
      club: "BluePadel",
      format: "doubles",
      match_date: "2026-05-16T00:00:00.000Z",
      match_results: { score_team_a: "7-5 / 6-2", score_team_b: "5-7 / 2-6", winner: "team_a" },
      mmr_history: { delta: 22, mmr_before: 1208, mmr_after: 1230 },
      myTeam: "team_a",
    },
    {
      id: "match-hist-003",
      club: "Viña Pádel Club",
      format: "doubles",
      match_date: "2026-05-14T00:00:00.000Z",
      match_results: { score_team_a: "3-6 / 4-6", score_team_b: "6-3 / 6-4", winner: "team_b" },
      mmr_history: { delta: -14, mmr_before: 1222, mmr_after: 1208 },
      myTeam: "team_a",
    },
  ],
};

export default function PerfilScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const initiales    = user?.name ? getInitials(user.name) : "?";
  const historial    = user?.id ? (HISTORIAL_DEMO[user.id] ?? []) : [];
  const numPartidos  = historial.length;
  const victorias    = historial.filter((p) => p.match_results.winner === p.myTeam).length;
  const pctVictorias = numPartidos > 0 ? Math.round((victorias / numPartidos) * 100) : 0;
  const esNuevo      = numPartidos === 0;
  const maxMMR       = Math.max(...MMR_EVOLUCION);

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  return (
    <View style={S.screen}>
      <ScrollView style={S.scroll} contentContainerStyle={{ paddingBottom: 16 }}>

        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, paddingBottom: 16 }}>
          <TouchableOpacity style={S.backBtn} onPress={() => router.back()}>
            <Text style={S.backBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: "700", color: C.text }}>Mi perfil</Text>
          <TouchableOpacity
            onPress={handleLogout}
            style={{ backgroundColor: "rgba(239,68,68,0.1)", borderWidth: 1, borderColor: "rgba(239,68,68,0.25)", borderRadius: 10, paddingVertical: 6, paddingHorizontal: 12 }}
          >
            <Text style={{ fontSize: 12, color: "#fca5a5", fontWeight: "600" }}>Salir</Text>
          </TouchableOpacity>
        </View>

        <View style={{ paddingHorizontal: 20 }}>

          {/* Cabecera usuario */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 16 }}>
            <View style={[S.avatar, { width: 64, height: 64, backgroundColor: C.accent, borderRadius: 20 }]}>
              <Text style={[S.avatarText, { fontSize: 22 }]}>{initiales}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: "800", color: C.text, textTransform: "uppercase", lineHeight: 22, marginBottom: 6 }}>
                {user?.name ?? "Usuario"}
              </Text>
              <Text style={{ fontSize: 13, color: C.text2, marginBottom: 8 }}>
                {user?.zone ?? "—"}
              </Text>
              <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
                {user?.level
                  ? <View style={[S.pill, S.pillPurple]}><Text style={[S.pillText, S.pillPurpleText]}>{user.level}</Text></View>
                  : <View style={[S.pill, S.pillGray]}><Text style={[S.pillText, S.pillGrayText]}>Sin categoría aún</Text></View>
                }
                {!esNuevo && (
                  <View style={[S.pill, S.pillGreen]}><Text style={[S.pillText, S.pillGreenText]}>{victorias} victorias</Text></View>
                )}
              </View>
            </View>
          </View>

          {/* Datos adicionales */}
          <TouchableOpacity onPress={() => router.push("/(app)/perfil-editar" as any)} style={{ alignSelf: "flex-end", marginBottom: 14 }}>
            <Text style={{ fontSize: 13, color: C.accent, textDecorationLine: "underline" }}>Datos adicionales →</Text>
          </TouchableOpacity>

          {/* MMR card */}
          <View style={S.mmrBar}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, color: C.text2, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>MMR</Text>
              <Text style={S.mmrNum}>{user?.mmr ?? 1000}</Text>
              <Text style={{ fontSize: 12, color: C.text2, marginTop: 4 }}>
                {esNuevo ? "Juega partidos para obtener ranking" : `#14 en ${user?.zone ?? "tu zona"}`}
              </Text>
            </View>
            {!esNuevo && (
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ fontSize: 13, color: "#4ade80", fontWeight: "600" }}>▲ +127</Text>
                <Text style={{ fontSize: 11, color: C.text2 }}>último mes</Text>
              </View>
            )}
          </View>

          {/* Stats */}
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
            {[
              { val: esNuevo ? "0" : String(numPartidos), label: "Partidos"  },
              { val: esNuevo ? "—" : `${pctVictorias}%`, label: "Victorias" },
              { val: esNuevo ? "—" : "4.8",              label: "Fair Play" },
            ].map((st) => (
              <View key={st.label} style={[S.card, { flex: 1, alignItems: "center", padding: 14 }]}>
                <Text style={{ fontSize: 20, fontWeight: "800", color: st.val === "—" ? C.text2 : C.text, marginBottom: 4 }}>{st.val}</Text>
                <Text style={{ fontSize: 11, color: C.text2, textTransform: "uppercase", letterSpacing: 0.6 }}>{st.label}</Text>
              </View>
            ))}
          </View>

          {/* Evolución MMR */}
          <View style={[S.card, { marginBottom: 14 }]}>
            <Text style={{ fontSize: 11, color: C.text2, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 14 }}>
              Evolución MMR — Últimas 7 semanas
            </Text>
            {esNuevo ? (
              <View style={{ height: 80, alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Text style={{ fontSize: 24 }}>📈</Text>
                <Text style={{ fontSize: 12, color: C.text2, textAlign: "center" }}>Tu evolución aparecerá aquí cuando juegues partidos</Text>
              </View>
            ) : (
              <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 6, height: 80 }}>
                {MMR_EVOLUCION.map((v, i) => (
                  <View key={i} style={{ flex: 1, alignItems: "center", gap: 4 }}>
                    <View style={{
                      width: "100%",
                      height: (v / maxMMR) * 72,
                      backgroundColor: i === MMR_EVOLUCION.length - 1 ? C.accent : "rgba(79,70,229,0.35)",
                      borderRadius: 4,
                    }} />
                    <Text style={{ fontSize: 10, color: C.text2 }}>{SEMANAS[i]}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Últimos partidos */}
          <Text style={[S.sectionLabel, { marginBottom: 10 }]}>Últimos partidos</Text>
          {esNuevo ? (
            <View style={[S.card, { alignItems: "center", padding: 28, marginBottom: 8 }]}>
              <Text style={{ fontSize: 32, marginBottom: 10 }}>🎾</Text>
              <Text style={{ fontSize: 14, fontWeight: "600", color: C.text, marginBottom: 6 }}>Sin partidos aún</Text>
              <Text style={{ fontSize: 13, color: C.text2, textAlign: "center", marginBottom: 16 }}>
                Crea o únete a un partido para empezar a construir tu historial
              </Text>
              <TouchableOpacity style={[S.btn, { paddingHorizontal: 24 }]} onPress={() => router.push("/(app)/crear")}>
                <Text style={S.btnText}>Crear partido</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[S.card, { marginBottom: 8 }]}>
              {historial.map((p, i) => {
                const win   = p.match_results.winner === p.myTeam;
                const score = win ? p.match_results.score_team_a : p.match_results.score_team_b;
                const delta = p.mmr_history.delta;
                return (
                  <View key={p.id} style={{
                    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                    paddingVertical: 12,
                    borderBottomWidth: i < historial.length - 1 ? 1 : 0,
                    borderBottomColor: C.border,
                  }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: win ? C.green : C.red }} />
                      <View>
                        <Text style={{ fontSize: 14, fontWeight: "600", color: C.text }}>
                          {win ? "Victoria" : "Derrota"} · {p.club}
                        </Text>
                        <Text style={{ fontSize: 12, color: C.text2 }}>{score}</Text>
                      </View>
                    </View>
                    <View style={[S.pill, win ? S.pillGreen : S.pillRed]}>
                      <Text style={[S.pillText, win ? S.pillGreenText : S.pillRedText]}>
                        {delta > 0 ? `+${delta}` : delta}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

        </View>
      </ScrollView>
    </View>
  );
}
