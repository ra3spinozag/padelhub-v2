import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import {
  getAvatarColor, getFormatoLabel, getStatusLabel,
  parseMatchDate, parseMatchTime, usePartidos, type Partido,
} from "../../context/PartidosContext";
import { UserAvatar } from "../../components/UserAvatar";
import { listMatches } from "../../services/matches.service";
import { listUsers, type PublicUser } from "../../services/auth.service";
import { sendInvitation } from "../../services/invitations.service";
import { C, S } from "../../theme";

export default function PartidosScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { partidos, loading, fetchPartidos, unirsePartido, salirPartido } = usePartidos();

  // Mis partidos activos (confirmed + in_progress)
  const [misPartidos,   setMisPartidos]   = useState<Partido[]>([]);
  const [loadingMios,   setLoadingMios]   = useState(false);

  // Join / Leave
  const [joining, setJoining] = useState<string | null>(null);

  // Invite modal
  const [inviteMatchId, setInviteMatchId]  = useState<string | null>(null);
  const [allUsers,      setAllUsers]       = useState<PublicUser[]>([]);
  const [loadingUsers,  setLoadingUsers]   = useState(false);
  const [userFilter,    setUserFilter]     = useState("");
  const [sendingInvite, setSendingInvite]  = useState<string | null>(null);
  const [invitedIds,    setInvitedIds]     = useState<Set<string>>(new Set());

  const [toast, setToast] = useState("");
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  // ── Fetch mis partidos activos ──────────────────────────────────────────
  const fetchMisPartidos = useCallback(async () => {
    if (!user?.id) return;
    setLoadingMios(true);
    try {
      const [confirmed, inProgress] = await Promise.all([
        listMatches({ zone: user.zone ?? undefined, status: "confirmed" }),
        listMatches({ zone: user.zone ?? undefined, status: "in_progress" }),
      ]);
      const all = [...confirmed, ...inProgress];
      setMisPartidos(
        all.filter(m => m.players.some(p => p.id === user.id) || m.organizer?.id === user.id)
      );
    } catch {
      // keep state
    } finally {
      setLoadingMios(false);
    }
  }, [user?.id, user?.zone]);

  useEffect(() => { fetchMisPartidos(); }, [fetchMisPartidos]);

  const handleRefreshAll = () => {
    fetchPartidos();
    fetchMisPartidos();
  };

  // ── Join / Leave ──────────────────────────────────────────────────────
  const handleJoinOrLeave = async (matchId: string, isJoined: boolean) => {
    setJoining(matchId);
    try {
      if (isJoined) {
        await salirPartido(matchId);
        showToast("Saliste del partido");
      } else {
        await unirsePartido(matchId);
        showToast("¡Te uniste al partido!");
      }
    } catch (e: any) {
      showToast(e.message ?? "Error al procesar la solicitud");
    } finally {
      setJoining(null);
    }
  };

  // ── Invite modal ──────────────────────────────────────────────────────
  const openInviteModal = async (matchId: string) => {
    setInviteMatchId(matchId);
    setUserFilter("");
    setInvitedIds(new Set());
    setLoadingUsers(true);
    try {
      const data = await listUsers();
      setAllUsers(data);
    } catch {
      setAllUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSendInvite = async (targetUserId: string) => {
    if (!user?.id || !inviteMatchId) return;
    setSendingInvite(targetUserId);
    try {
      await sendInvitation(inviteMatchId, user.id, targetUserId);
      setInvitedIds(prev => new Set(prev).add(targetUserId));
      showToast("Invitación enviada");
    } catch (e: any) {
      showToast(e.message ?? "No se pudo enviar la invitación");
    } finally {
      setSendingInvite(null);
    }
  };

  const matchForInvite = inviteMatchId ? partidos.find(p => p.id === inviteMatchId) : null;
  const filteredUsers  = allUsers
    .filter(u => u.id !== user?.id)
    .filter(u => !matchForInvite?.players.some(p => p.id === u.id))
    .filter(u => userFilter === "" || u.name.toLowerCase().includes(userFilter.toLowerCase()));

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <View style={S.screen}>
      <ScrollView
        style={S.scroll}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={loading || loadingMios} onRefresh={handleRefreshAll} tintColor={C.accent} />
        }
      >
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, paddingBottom: 16 }}>
          <TouchableOpacity style={S.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace("/(app)/home")}>
            <Text style={S.backBtnText}>←</Text>
          </TouchableOpacity>
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: C.text }}>Partidos</Text>
            <Text style={{ fontSize: 12, color: C.text2 }}>{user?.zone ?? "tu zona"}</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        <View style={{ paddingHorizontal: 20 }}>

          {/* ── Mis partidos activos ────────────────────────────────── */}
          {misPartidos.length > 0 && (
            <>
              <Text style={[S.sectionLabel, { marginBottom: 10 }]}>Mis partidos activos</Text>
              {misPartidos.map((p) => {
                const isInProgress = p.status === "in_progress";
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[S.card, { marginBottom: 12 }]}
                    onPress={() => router.push(`/(app)/partido/${p.id}` as any)}
                    activeOpacity={0.75}
                  >
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <View style={{ flexDirection: "row", gap: 6 }}>
                        <View style={[S.pill, S.pillPurple]}>
                          <Text style={[S.pillText, S.pillPurpleText]}>{getFormatoLabel(p.format)}</Text>
                        </View>
                        <View style={[S.pill, isInProgress
                          ? { backgroundColor: "rgba(14,165,233,0.1)", borderWidth: 1, borderColor: "rgba(14,165,233,0.3)" }
                          : S.pillGreen
                        ]}>
                          <Text style={[S.pillText, isInProgress ? { color: "#38bdf8" } : S.pillGreenText]}>
                            {getStatusLabel(p.status)}
                          </Text>
                        </View>
                      </View>
                      <Text style={{ fontSize: 12, color: C.accent, fontWeight: "600" }}>Ver →</Text>
                    </View>
                    <Text style={{ fontSize: 15, fontWeight: "700", color: C.text, marginBottom: 2 }}>{p.club}</Text>
                    <Text style={{ fontSize: 12, color: C.text2 }}>
                      {parseMatchDate(p.match_date)} · {parseMatchTime(p.match_time)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </>
          )}

          {/* ── Partidos abiertos ───────────────────────────────────── */}
          <Text style={[S.sectionLabel, { marginBottom: 10, marginTop: misPartidos.length > 0 ? 8 : 0 }]}>
            Partidos abiertos
          </Text>

          {/* Loading inicial */}
          {loading && partidos.length === 0 && (
            <View style={{ alignItems: "center", marginTop: 40 }}>
              <ActivityIndicator color={C.accent} size="large" />
              <Text style={{ color: C.text2, fontSize: 13, marginTop: 12 }}>Buscando partidos...</Text>
            </View>
          )}

          {/* Sin partidos */}
          {!loading && partidos.length === 0 && (
            <View style={[S.card, { alignItems: "center", padding: 32, marginTop: 4 }]}>
              <Text style={{ fontSize: 36, marginBottom: 12 }}>🎾</Text>
              <Text style={{ fontSize: 15, fontWeight: "700", color: C.text, marginBottom: 6 }}>
                No hay partidos abiertos
              </Text>
              <Text style={{ fontSize: 12, color: C.text2, textAlign: "center", marginBottom: 20, lineHeight: 18 }}>
                Sé el primero en publicar un partido{"\n"}en {user?.zone ?? "tu zona"}
              </Text>
              <TouchableOpacity style={[S.btn, { paddingHorizontal: 24 }]} onPress={() => router.push("/(app)/crear")}>
                <Text style={S.btnText}>Crear partido</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Lista de partidos abiertos */}
          {partidos.map((p) => {
            const isJoined    = !!user && p.players.some(pl => pl.id === user.id);
            const isOrganizer = p.organizer?.id === user?.id;
            const loadingThis = joining === p.id;
            const spotsLeft   = p.spots_left ?? Math.max(0, (p.max_players ?? 4) - p.players.length);
            const canInvite   = isJoined || isOrganizer;

            return (
              <View key={p.id} style={[S.card, { marginBottom: 14 }]}>

                {/* Badges + cupos */}
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <View style={{ flexDirection: "row", gap: 6 }}>
                    <View style={[S.pill, S.pillPurple]}>
                      <Text style={[S.pillText, S.pillPurpleText]}>{getFormatoLabel(p.format)}</Text>
                    </View>
                    <View style={[S.pill, S.pillGreen]}>
                      <Text style={[S.pillText, S.pillGreenText]}>{getStatusLabel(p.status)}</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 12, color: spotsLeft === 0 ? C.red : C.text2, fontWeight: "600" }}>
                    {spotsLeft === 0 ? "Lleno" : `${spotsLeft} cupo${spotsLeft !== 1 ? "s" : ""}`}
                  </Text>
                </View>

                {/* Club y fecha */}
                <Text style={{ fontSize: 16, fontWeight: "700", color: C.text, marginBottom: 2 }}>{p.club}</Text>
                <Text style={{ fontSize: 13, color: C.text2, marginBottom: 12 }}>
                  {parseMatchDate(p.match_date)} · {parseMatchTime(p.match_time)}
                  {p.zone ? ` · ${p.zone}` : ""}
                </Text>

                {/* Jugadores */}
                <View style={{ flexDirection: "row", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                  {p.players.map((pl, i) => (
                    <View key={pl.id} style={{ alignItems: "center", gap: 3 }}>
                      <UserAvatar name={pl.name} photoUrl={pl.photo_url} size={38} color={getAvatarColor(i)} />
                      <Text style={{ fontSize: 10, color: pl.id === user?.id ? C.accent : C.text2, fontWeight: pl.id === user?.id ? "700" : "400" }}>
                        {pl.id === user?.id ? "Tú" : pl.name.split(" ")[0]}
                      </Text>
                    </View>
                  ))}
                  {Array.from({ length: spotsLeft }).map((_, i) => (
                    <View key={`empty-${i}`} style={{ alignItems: "center", gap: 3 }}>
                      <View style={{ width: 38, height: 38, borderRadius: 10, borderWidth: 1, borderColor: C.border, borderStyle: "dashed", alignItems: "center", justifyContent: "center" }}>
                        <Text style={{ color: C.text2, fontSize: 18 }}>+</Text>
                      </View>
                      <Text style={{ fontSize: 10, color: C.text2 }}>Libre</Text>
                    </View>
                  ))}
                </View>

                {/* Organizador */}
                {p.organizer && (
                  <Text style={{ fontSize: 11, color: C.text2, marginBottom: 12 }}>
                    Organiza: {p.organizer.name}{p.organizer.level ? ` · ${p.organizer.level}` : ""}
                  </Text>
                )}

                {/* Botones */}
                {isOrganizer ? (
                  <View style={{ gap: 8 }}>
                    <View style={{ backgroundColor: "rgba(79,70,229,0.1)", borderRadius: 10, paddingVertical: 11, alignItems: "center" }}>
                      <Text style={{ fontSize: 13, color: C.accent, fontWeight: "600" }}>Eres el organizador</Text>
                    </View>
                    {spotsLeft > 0 && (
                      <TouchableOpacity
                        style={{ borderWidth: 1, borderColor: C.accent, borderRadius: 12, paddingVertical: 11, alignItems: "center" }}
                        onPress={() => openInviteModal(p.id)}
                      >
                        <Text style={{ fontSize: 14, fontWeight: "600", color: C.accent }}>✉ Invitar jugador</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  <View style={{ gap: 8 }}>
                    <TouchableOpacity
                      style={[
                        isJoined
                          ? { borderWidth: 1, borderColor: C.red, borderRadius: 12, paddingVertical: 13, alignItems: "center" }
                          : S.btn,
                        (loadingThis || (p.is_full && !isJoined)) && S.btnDisabled,
                      ]}
                      onPress={() => handleJoinOrLeave(p.id, isJoined)}
                      disabled={loadingThis || (!!p.is_full && !isJoined)}
                    >
                      {loadingThis ? (
                        <ActivityIndicator color={isJoined ? C.red : "#fff"} size="small" />
                      ) : (
                        <Text style={{ fontSize: 15, fontWeight: "700", color: isJoined ? C.red : "#fff" }}>
                          {p.is_full && !isJoined ? "Partido lleno" : isJoined ? "Salir del partido" : "Unirse"}
                        </Text>
                      )}
                    </TouchableOpacity>

                    {canInvite && spotsLeft > 0 && (
                      <TouchableOpacity
                        style={{ borderWidth: 1, borderColor: C.accent, borderRadius: 12, paddingVertical: 11, alignItems: "center" }}
                        onPress={() => openInviteModal(p.id)}
                      >
                        <Text style={{ fontSize: 14, fontWeight: "600", color: C.accent }}>✉ Invitar jugador</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* FAB crear partido */}
      <TouchableOpacity
        style={{
          position: "absolute", bottom: 24, right: 24,
          width: 56, height: 56, borderRadius: 18,
          backgroundColor: C.accent,
          alignItems: "center", justifyContent: "center",
          elevation: 6, shadowColor: C.accent, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
        }}
        onPress={() => router.push("/(app)/crear")}
      >
        <Text style={{ fontSize: 28, color: "#fff", lineHeight: 32 }}>+</Text>
      </TouchableOpacity>

      {/* Toast */}
      {toast ? (
        <View style={{ position: "absolute", bottom: 90, alignSelf: "center", backgroundColor: C.bg3, borderWidth: 1, borderColor: C.border, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 }}>
          <Text style={{ color: C.text, fontSize: 14, fontWeight: "500" }}>{toast}</Text>
        </View>
      ) : null}

      {/* ── Modal invitar jugador ──────────────────────────────────────── */}
      <Modal visible={!!inviteMatchId} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: C.bg3, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, borderTopColor: C.border, maxHeight: "75%" }}>

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: C.border }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: C.text }}>Invitar jugador</Text>
              <TouchableOpacity
                style={{ backgroundColor: C.bg4, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingVertical: 5, paddingHorizontal: 12 }}
                onPress={() => setInviteMatchId(null)}
              >
                <Text style={{ color: C.text2, fontSize: 13 }}>Cerrar</Text>
              </TouchableOpacity>
            </View>

            <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
              <TextInput
                style={[S.input, { marginBottom: 0 }]}
                placeholder="Buscar por nombre..."
                placeholderTextColor={C.text2}
                value={userFilter}
                onChangeText={setUserFilter}
                autoCorrect={false}
              />
            </View>

            {loadingUsers ? (
              <View style={{ alignItems: "center", padding: 32 }}>
                <ActivityIndicator color={C.accent} />
                <Text style={{ color: C.text2, fontSize: 13, marginTop: 8 }}>Cargando jugadores...</Text>
              </View>
            ) : filteredUsers.length === 0 ? (
              <View style={{ alignItems: "center", padding: 32 }}>
                <Text style={{ color: C.text2, fontSize: 14 }}>
                  {userFilter ? "Sin resultados" : "No hay jugadores disponibles"}
                </Text>
              </View>
            ) : (
              <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}>
                {filteredUsers.map((u, i) => {
                  const alreadyInvited = invitedIds.has(u.id);
                  const sending        = sendingInvite === u.id;
                  return (
                    <View key={u.id} style={{
                      flexDirection: "row", alignItems: "center", gap: 12,
                      paddingVertical: 12,
                      borderBottomWidth: i < filteredUsers.length - 1 ? 1 : 0,
                      borderBottomColor: C.border,
                    }}>
                      <UserAvatar name={u.name} photoUrl={u.photo_url} size={40} color={getAvatarColor(i)} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: "600", color: C.text }}>{u.name}</Text>
                        <Text style={{ fontSize: 12, color: C.text2 }}>
                          {[u.level, u.zone, u.mmr ? `${u.mmr} MMR` : null].filter(Boolean).join(" · ")}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={[
                          { borderRadius: 10, paddingVertical: 7, paddingHorizontal: 14, minWidth: 80, alignItems: "center" },
                          alreadyInvited
                            ? { backgroundColor: "rgba(34,197,94,0.1)", borderWidth: 1, borderColor: "rgba(34,197,94,0.3)" }
                            : { backgroundColor: C.accent },
                          (sending || alreadyInvited) && { opacity: 0.7 },
                        ]}
                        onPress={() => handleSendInvite(u.id)}
                        disabled={sending || alreadyInvited}
                      >
                        {sending
                          ? <ActivityIndicator color="#fff" size="small" />
                          : <Text style={{ fontSize: 13, fontWeight: "700", color: alreadyInvited ? "#4ade80" : "#fff" }}>
                              {alreadyInvited ? "Enviado ✓" : "Invitar"}
                            </Text>}
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
