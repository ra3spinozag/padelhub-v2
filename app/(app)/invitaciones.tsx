import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { parseMatchDate, parseMatchTime } from "../../context/PartidosContext";
import {
  getUserInvitations,
  respondInvitation,
  type Invitation,
} from "../../services/invitations.service";
import { C, S } from "../../theme";

function Initials({ name }: { name: string }) {
  const ini = name.split(" ").map(n => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  return (
    <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: C.accent, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: 13, fontWeight: "700", color: "#fff" }}>{ini}</Text>
    </View>
  );
}

export default function InvitacionesScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [invitaciones, setInvitaciones] = useState<Invitation[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [responding,   setResponding]   = useState<string | null>(null);
  const [toast,        setToast]        = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const fetchInvitaciones = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await getUserInvitations(user.id, "pending");
      setInvitaciones(data);
    } catch {
      // keep existing state
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchInvitaciones(); }, [fetchInvitaciones]);

  const handleResponder = async (inv: Invitation, status: "accepted" | "declined") => {
    if (!user?.id) return;
    setResponding(inv.id);
    try {
      const res = await respondInvitation(inv.id, user.id, status);
      setInvitaciones(prev => prev.filter(i => i.id !== inv.id));
      if (status === "accepted" && res.match?.id) {
        showToast("¡Te uniste al partido!");
        router.push(`/(app)/partido/${res.match.id}` as any);
      } else {
        showToast("Invitación rechazada");
      }
    } catch (e: any) {
      showToast(e.message ?? "Error al responder la invitación");
    } finally {
      setResponding(null);
    }
  };

  return (
    <View style={S.screen}>
      <ScrollView
        style={S.scroll}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchInvitaciones} tintColor={C.accent} />
        }
      >
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, paddingBottom: 16 }}>
          <TouchableOpacity style={S.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace("/(app)/home")}>
            <Text style={S.backBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: "700", color: C.text }}>Invitaciones</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={{ paddingHorizontal: 20 }}>

          {/* Loading */}
          {loading && invitaciones.length === 0 && (
            <View style={{ alignItems: "center", marginTop: 60 }}>
              <ActivityIndicator color={C.accent} size="large" />
              <Text style={{ color: C.text2, fontSize: 13, marginTop: 12 }}>Cargando invitaciones...</Text>
            </View>
          )}

          {/* Vacío */}
          {!loading && invitaciones.length === 0 && (
            <View style={[S.card, { alignItems: "center", padding: 32, marginTop: 20 }]}>
              <Text style={{ fontSize: 36, marginBottom: 12 }}>📭</Text>
              <Text style={{ fontSize: 15, fontWeight: "700", color: C.text, marginBottom: 6 }}>
                Sin invitaciones pendientes
              </Text>
              <Text style={{ fontSize: 12, color: C.text2, textAlign: "center", lineHeight: 18 }}>
                Cuando alguien te invite a un partido{"\n"}aparecerá aquí
              </Text>
            </View>
          )}

          {/* Lista */}
          {invitaciones.map((inv) => {
            const match = inv.matches;
            const loadingThis = responding === inv.id;

            return (
              <View key={inv.id} style={[S.card, { marginBottom: 14 }]}>

                {/* Quién invita */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <Initials name={inv.inviter?.name ?? "?"} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: C.text }}>
                      {inv.inviter?.name ?? "Un jugador"}
                    </Text>
                    <Text style={{ fontSize: 12, color: C.text2 }}>te invitó a un partido</Text>
                  </View>
                  <View style={{ backgroundColor: "rgba(251,191,36,0.12)", borderWidth: 1, borderColor: "rgba(251,191,36,0.35)", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                    <Text style={{ fontSize: 11, color: "#fbbf24", fontWeight: "700" }}>Pendiente</Text>
                  </View>
                </View>

                {/* Datos del partido */}
                {match && (
                  <View style={{ backgroundColor: C.bg4, borderRadius: 12, padding: 14, marginBottom: 14 }}>
                    <Text style={{ fontSize: 15, fontWeight: "700", color: C.text, marginBottom: 4 }}>
                      {match.club}
                    </Text>
                    <Text style={{ fontSize: 13, color: C.text2, marginBottom: 8 }}>
                      {parseMatchDate(match.match_date)} · {parseMatchTime(match.match_time)}
                    </Text>
                    <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
                      <View style={[S.pill, S.pillPurple]}>
                        <Text style={[S.pillText, S.pillPurpleText]}>
                          {match.format === "doubles" ? "Dobles" : "Individual"}
                        </Text>
                      </View>
                      {match.users?.zone ? (
                        <View style={[S.pill, { backgroundColor: "rgba(14,165,233,0.1)", borderColor: "rgba(14,165,233,0.3)" }]}>
                          <Text style={{ fontSize: 11, color: "#38bdf8", fontWeight: "600" }}>
                            {match.users.zone}
                          </Text>
                        </View>
                      ) : null}
                      {match.users?.name ? (
                        <Text style={{ fontSize: 11, color: C.text2, alignSelf: "center" }}>
                          Organiza: {match.users.name}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                )}

                {/* Botones */}
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <TouchableOpacity
                    style={[{
                      flex: 1, borderWidth: 1, borderColor: C.red,
                      borderRadius: 12, paddingVertical: 13, alignItems: "center",
                    }, loadingThis && S.btnDisabled]}
                    onPress={() => handleResponder(inv, "declined")}
                    disabled={loadingThis}
                  >
                    <Text style={{ fontSize: 14, fontWeight: "700", color: C.red }}>Rechazar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[S.btn, { flex: 1 }, loadingThis && S.btnDisabled]}
                    onPress={() => handleResponder(inv, "accepted")}
                    disabled={loadingThis}
                  >
                    {loadingThis
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={S.btnText}>Aceptar</Text>}
                  </TouchableOpacity>
                </View>

              </View>
            );
          })}
        </View>
      </ScrollView>

      {toast ? (
        <View style={{ position: "absolute", bottom: 32, alignSelf: "center", backgroundColor: C.bg3, borderWidth: 1, borderColor: C.border, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 }}>
          <Text style={{ color: C.text, fontSize: 14, fontWeight: "500" }}>{toast}</Text>
        </View>
      ) : null}
    </View>
  );
}
