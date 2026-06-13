import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { getMmrHistory, getProfile, type MmrHistoryEntry, type ProfileStats } from "../../services/auth.service";
import { C, S } from "../../theme";
import { UserAvatar } from "../../components/UserAvatar";

const MESES_ES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function formatMatchDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCDate()} ${MESES_ES[d.getUTCMonth()]}`;
}

export default function PerfilScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [history,     setHistory]     = useState<MmrHistoryEntry[]>([]);
  const [total,       setTotal]       = useState(0);
  const [loadingHist, setLoadingHist] = useState(true);
  const [stats,       setStats]       = useState<ProfileStats | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!user?.rut) { setLoadingHist(false); return; }
      let cancelled = false;
      setLoadingHist(true);
      getMmrHistory(user.rut, 20)
        .then((res) => {
          if (cancelled) return;
          setHistory(res.history);
          setTotal(res.total);
        })
        .catch(() => {})
        .finally(() => { if (!cancelled) setLoadingHist(false); });
      getProfile(user.rut)
        .then((res) => { if (!cancelled) setStats(res.stats); })
        .catch(() => {});
      return () => { cancelled = true; };
    }, [user?.rut])
  );

  const victorias    = history.filter((e) => e.delta > 0).length;
  const pctVictorias = total > 0 ? Math.round((victorias / total) * 100) : 0;
  const esNuevo      = !loadingHist && total === 0;

  // Últimas 7 entradas en orden cronológico para el gráfico
  const chartData = [...history].reverse().slice(-7);
  const maxMMR    = chartData.length > 0 ? Math.max(...chartData.map((e) => e.mmr_after)) : 1000;

  // Delta del último mes
  const cutoff      = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const deltaRecent = history
    .filter((e) => new Date(e.calculated_at).getTime() >= cutoff)
    .reduce((acc, e) => acc + e.delta, 0);

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  return (
    <View style={S.screen}>
      <ScrollView style={S.scroll} contentContainerStyle={{ paddingBottom: 16 }}>

        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, paddingBottom: 16 }}>
          <TouchableOpacity style={S.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace("/(app)/home")}>
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
            <UserAvatar name={user?.name ?? "?"} photoUrl={user?.photo_url} size={64} borderRadius={20} />
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

          {/* Editar */}
          <TouchableOpacity onPress={() => router.push("/(app)/perfil-editar" as any)} style={{ alignSelf: "flex-end", marginBottom: 14 }}>
            <Text style={{ fontSize: 13, color: C.accent, textDecorationLine: "underline" }}>Editar →</Text>
          </TouchableOpacity>

          {/* MMR card */}
          <TouchableOpacity style={S.mmrBar} onPress={() => router.push("/(app)/ranking" as any)}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, color: C.text2, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>MMR</Text>
              <Text style={S.mmrNum}>{user?.mmr ?? 1000}</Text>
              <Text style={{ fontSize: 12, color: C.text2, marginTop: 4 }}>
                {esNuevo ? "Juega partidos para obtener ranking" : `${user?.zone ?? "tu zona"}`}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end", gap: 4 }}>
              {!esNuevo && deltaRecent !== 0 && (
                <>
                  <Text style={{ fontSize: 13, color: deltaRecent > 0 ? "#4ade80" : "#f87171", fontWeight: "600" }}>
                    {deltaRecent > 0 ? `▲ +${deltaRecent}` : `▼ ${deltaRecent}`}
                  </Text>
                  <Text style={{ fontSize: 11, color: C.text2 }}>último mes</Text>
                </>
              )}
              <Text style={{ fontSize: 12, color: C.accent, marginTop: esNuevo ? 0 : 4 }}>Ver ranking →</Text>
            </View>
          </TouchableOpacity>

          {/* Stats */}
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
            {[
              { val: loadingHist ? "…" : String(total),                                                     label: "Partidos"  },
              { val: loadingHist ? "…" : esNuevo ? "—" : `${pctVictorias}%`,                               label: "Victorias" },
              { val: stats && stats.rating_count > 0 ? `${stats.rating_average.toFixed(1)} ⭐` : "—",      label: "Fair Play" },
            ].map((st) => (
              <View key={st.label} style={[S.card, { flex: 1, alignItems: "center", padding: 14 }]}>
                <Text style={{ fontSize: 20, fontWeight: "800", color: st.val === "—" || st.val === "…" ? C.text2 : C.text, marginBottom: 4 }}>
                  {st.val}
                </Text>
                <Text style={{ fontSize: 11, color: C.text2, textTransform: "uppercase", letterSpacing: 0.6 }}>{st.label}</Text>
              </View>
            ))}
          </View>

          {/* Evolución MMR */}
          <View style={[S.card, { marginBottom: 14 }]}>
            <Text style={{ fontSize: 11, color: C.text2, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 14 }}>
              Evolución MMR — Últimos partidos
            </Text>
            {loadingHist ? (
              <View style={{ height: 80, alignItems: "center", justifyContent: "center" }}>
                <ActivityIndicator color={C.accent} size="small" />
              </View>
            ) : esNuevo ? (
              <View style={{ height: 80, alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Text style={{ fontSize: 24 }}>📈</Text>
                <Text style={{ fontSize: 12, color: C.text2, textAlign: "center" }}>Tu evolución aparecerá aquí cuando juegues partidos</Text>
              </View>
            ) : (
              <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 6, height: 80 }}>
                {chartData.map((e, i) => (
                  <View key={e.id} style={{ flex: 1, alignItems: "center", gap: 4 }}>
                    <View style={{
                      width: "100%",
                      height: Math.max(4, (e.mmr_after / maxMMR) * 72),
                      backgroundColor: i === chartData.length - 1 ? C.accent : "rgba(79,70,229,0.35)",
                      borderRadius: 4,
                    }} />
                    <Text style={{ fontSize: 10, color: C.text2 }}>{formatMatchDate(e.match.match_date)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Últimos partidos */}
          <Text style={[S.sectionLabel, { marginBottom: 10 }]}>Últimos partidos</Text>

          {loadingHist ? (
            <View style={[S.card, { alignItems: "center", padding: 28, marginBottom: 8 }]}>
              <ActivityIndicator color={C.accent} />
            </View>
          ) : esNuevo ? (
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
              {history.map((e, i) => {
                const win = e.delta > 0;
                return (
                  <View key={e.id} style={{
                    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                    paddingVertical: 12,
                    borderBottomWidth: i < history.length - 1 ? 1 : 0,
                    borderBottomColor: C.border,
                  }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: win ? C.green : C.red }} />
                      <View>
                        <Text style={{ fontSize: 14, fontWeight: "600", color: C.text }}>
                          {win ? "Victoria" : "Derrota"} · {e.match.club}
                        </Text>
                        <Text style={{ fontSize: 12, color: C.text2 }}>
                          {formatMatchDate(e.match.match_date)} · {e.match.format === "doubles" ? "Dobles" : "Individual"}
                        </Text>
                      </View>
                    </View>
                    <View style={[S.pill, win ? S.pillGreen : S.pillRed]}>
                      <Text style={[S.pillText, win ? S.pillGreenText : S.pillRedText]}>
                        {e.delta > 0 ? `+${e.delta}` : e.delta}
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
