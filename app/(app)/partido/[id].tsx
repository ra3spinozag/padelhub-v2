import { CameraView, useCameraPermissions } from "expo-camera";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator, Modal, ScrollView, Text,
  TextInput, TouchableOpacity, View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useAuth } from "../../../context/AuthContext";
import {
  getAvatarColor, getFormatoLabel, getInitials, getStatusLabel,
  parseMatchDate, parseMatchTime,
  type Partido,
} from "../../../context/PartidosContext";
import { getMatch, joinMatch, leaveMatch } from "../../../services/matches.service";
import {
  confirmPresence, confirmResult, generateQR,
  getResult, submitResult,
  type MatchResultData, type QRData,
} from "../../../services/results.service";
import { C, S } from "../../../theme";

function formatExpiry(iso: string) {
  const d = new Date(iso);
  return `Expira a las ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function StatusPill({ status }: { status: string }) {
  if (status === "in_progress") {
    return (
      <View style={[S.pill, { backgroundColor: "rgba(14,165,233,0.1)", borderWidth: 1, borderColor: "rgba(14,165,233,0.3)" }]}>
        <Text style={[S.pillText, { color: "#38bdf8" }]}>{getStatusLabel(status)}</Text>
      </View>
    );
  }
  if (status === "finished" || status === "cancelled") {
    return (
      <View style={[S.pill, { backgroundColor: C.bg4, borderWidth: 1, borderColor: C.border }]}>
        <Text style={[S.pillText, { color: C.text2 }]}>{getStatusLabel(status)}</Text>
      </View>
    );
  }
  return (
    <View style={[S.pill, S.pillGreen]}>
      <Text style={[S.pillText, S.pillGreenText]}>{getStatusLabel(status)}</Text>
    </View>
  );
}

export default function PartidoDetailScreen() {
  const { id }   = useLocalSearchParams<{ id: string }>();
  const router   = useRouter();
  const { user } = useAuth();

  const [partido,   setPartido]   = useState<Partido | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [resultado, setResultado] = useState<MatchResultData | null>(null);

  // QR
  const [qrData,       setQrData]       = useState<QRData | null>(null);
  const [showQR,       setShowQR]       = useState(false);
  const [generatingQR, setGeneratingQR] = useState(false);

  // Scanner
  const [showScanner, setShowScanner] = useState(false);
  const [scanned,     setScanned]     = useState(false);
  const [confirming,  setConfirming]  = useState(false);
  const [permission,  requestPermission] = useCameraPermissions();

  // Result form
  const [showResultForm, setShowResultForm] = useState(false);
  const [scoreA,     setScoreA]     = useState("");
  const [scoreB,     setScoreB]     = useState("");
  const [winner,     setWinner]     = useState<"team_a" | "team_b" | "draw" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirming2, setConfirming2] = useState(false);

  const [toast, setToast] = useState("");
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  // ── Fetch ─────────────────────────────────────────────────────────────
  const fetchPartido = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getMatch(id);
      setPartido(data);
      if (data.status === "in_progress" || data.status === "finished") {
        try { setResultado(await getResult(id)); } catch { /* no result yet */ }
      }
    } catch (e: any) {
      showToast(e.message ?? "Error al cargar el partido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPartido(); }, [id]);

  // ── Derived ───────────────────────────────────────────────────────────
  const isOrganizer = !!user && partido?.organizer?.id === user.id;
  const isPlayer    = !!user && !!partido?.players.some(p => p.id === user.id);
  const myTeam      = partido?.players.find(p => p.id === user?.id)?.team;
  const teamA       = partido?.players.filter(p => p.team === "team_a") ?? [];
  const teamB       = partido?.players.filter(p => p.team === "team_b") ?? [];
  const spotsLeft   = partido
    ? (partido.spots_left ?? Math.max(0, (partido.max_players ?? 4) - partido.players.length))
    : 0;

  const registrarByTeam = resultado
    ? partido?.players.find(p => p.id === resultado.registered_by)?.team
    : null;
  const canConfirmResult = !!myTeam && !!registrarByTeam && myTeam !== registrarByTeam;

  // ── Actions ───────────────────────────────────────────────────────────
  const handleJoin = async () => {
    if (!user?.id || !partido) return;
    try { await joinMatch(partido.id, user.id); fetchPartido(); }
    catch (e: any) { showToast(e.message ?? "Error al unirse"); }
  };

  const handleLeave = async () => {
    if (!user?.id || !partido) return;
    try { await leaveMatch(partido.id, user.id); fetchPartido(); }
    catch (e: any) { showToast(e.message ?? "Error al salir"); }
  };

  const handleGenerateQR = async () => {
    if (!user?.id || !partido) return;
    setGeneratingQR(true);
    try {
      const data = await generateQR(partido.id, user.id);
      setQrData(data);
      setShowQR(true);
    } catch (e: any) { showToast(e.message ?? "Error al generar QR"); }
    finally { setGeneratingQR(false); }
  };

  const handleScan = async ({ data }: { data: string }) => {
    if (scanned || !user?.id) return;
    setScanned(true);
    setConfirming(true);

    const matchIdMatch = data.match(/match_id=([^&]+)/);
    const tokenMatch   = data.match(/[?&]token=(.+)/);

    if (!matchIdMatch || !tokenMatch) {
      showToast("QR inválido");
      setShowScanner(false);
      setConfirming(false);
      return;
    }

    try {
      const res = await confirmPresence(
        decodeURIComponent(matchIdMatch[1]),
        user.id,
        decodeURIComponent(tokenMatch[1])
      );
      setShowScanner(false);
      showToast(res.already_confirmed ? "Ya habías confirmado tu presencia" : (res.message ?? "¡Presencia confirmada!"));
      fetchPartido();
    } catch (e: any) {
      showToast(e.message ?? "Error al confirmar presencia");
      setShowScanner(false);
    } finally {
      setConfirming(false);
    }
  };

  const handleSubmitResult = async () => {
    if (!user?.id || !partido || !winner || !scoreA.trim() || !scoreB.trim()) {
      showToast("Completa todos los campos");
      return;
    }
    setSubmitting(true);
    try {
      const { result } = await submitResult(partido.id, {
        submitted_by: user.id,
        score_team_a: scoreA.trim(),
        score_team_b: scoreB.trim(),
        winner,
      });
      setResultado(result);
      setShowResultForm(false);
      showToast("Resultado registrado. Esperando confirmación del equipo contrario.");
      fetchPartido();
    } catch (e: any) { showToast(e.message ?? "Error al registrar resultado"); }
    finally { setSubmitting(false); }
  };

  const handleConfirmResult = async () => {
    if (!user?.id || !partido) return;
    setConfirming2(true);
    try {
      await confirmResult(partido.id, user.id);
      showToast("¡Resultado confirmado! Partido finalizado.");
      fetchPartido();
    } catch (e: any) { showToast(e.message ?? "Error al confirmar resultado"); }
    finally { setConfirming2(false); }
  };

  // ── Loading / error states ─────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[S.screen, { alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator color={C.accent} size="large" />
      </View>
    );
  }

  if (!partido) {
    return (
      <View style={[S.screen, { alignItems: "center", justifyContent: "center", padding: 24 }]}>
        <Text style={{ color: C.text2, fontSize: 15 }}>No se encontró el partido</Text>
        <TouchableOpacity style={{ marginTop: 16 }} onPress={() => router.back()}>
          <Text style={{ color: C.accent, fontSize: 14 }}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <View style={S.screen}>
      <ScrollView style={S.scroll} contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>

        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <TouchableOpacity style={S.backBtn} onPress={() => router.back()}>
            <Text style={S.backBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 17, fontWeight: "700", color: C.text }}>Detalle del partido</Text>
          <TouchableOpacity
            style={{ backgroundColor: C.bg3, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 }}
            onPress={fetchPartido}
          >
            <Text style={{ fontSize: 14, color: C.text2 }}>↻</Text>
          </TouchableOpacity>
        </View>

        {/* Match info */}
        <View style={[S.card, { marginBottom: 16 }]}>
          <View style={{ flexDirection: "row", gap: 6, marginBottom: 10 }}>
            <View style={[S.pill, S.pillPurple]}>
              <Text style={[S.pillText, S.pillPurpleText]}>{getFormatoLabel(partido.format)}</Text>
            </View>
            <StatusPill status={partido.status} />
          </View>
          <Text style={{ fontSize: 19, fontWeight: "700", color: C.text, marginBottom: 4 }}>{partido.club}</Text>
          <Text style={{ fontSize: 13, color: C.text2 }}>
            {parseMatchDate(partido.match_date)} · {parseMatchTime(partido.match_time)}
            {partido.zone ? ` · ${partido.zone}` : ""}
          </Text>
          {partido.organizer && (
            <Text style={{ fontSize: 11, color: C.text2, marginTop: 8 }}>
              Organiza: {partido.organizer.name}
            </Text>
          )}
        </View>

        {/* Players */}
        <Text style={[S.sectionLabel, { marginBottom: 10 }]}>Jugadores</Text>
        {partido.format === "doubles" ? (
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
            {([
              { label: "Equipo A", players: teamA, color: C.accent },
              { label: "Equipo B", players: teamB, color: "#059669" },
            ] as const).map(({ label, players, color }) => (
              <View key={label} style={[S.card, { flex: 1, padding: 12 }]}>
                <Text style={{ fontSize: 10, color: C.text2, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.8 }}>
                  {label}
                </Text>
                {players.length === 0 ? (
                  <Text style={{ fontSize: 11, color: C.text2 }}>Esperando...</Text>
                ) : players.map((pl, i) => (
                  <View key={pl.id} style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: i < players.length - 1 ? 8 : 0 }}>
                    <View style={[S.avatar, { width: 30, height: 30, backgroundColor: color }]}>
                      <Text style={[S.avatarText, { fontSize: 10 }]}>{getInitials(pl.name)}</Text>
                    </View>
                    <Text style={{ fontSize: 12, fontWeight: "600", color: pl.id === user?.id ? C.accent : C.text }}>
                      {pl.id === user?.id ? "Tú" : pl.name.split(" ")[0]}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        ) : (
          <View style={[S.card, { marginBottom: 16 }]}>
            {partido.players.map((pl, i) => (
              <View key={pl.id} style={{
                flexDirection: "row", alignItems: "center", gap: 10,
                paddingVertical: 10,
                borderBottomWidth: i < partido.players.length - 1 ? 1 : 0,
                borderBottomColor: C.border,
              }}>
                <View style={[S.avatar, { width: 36, height: 36, backgroundColor: getAvatarColor(i) }]}>
                  <Text style={[S.avatarText, { fontSize: 12 }]}>{getInitials(pl.name)}</Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: "600", color: pl.id === user?.id ? C.accent : C.text }}>
                  {pl.id === user?.id ? `Tú (${pl.name})` : pl.name}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Action zone ─────────────────────────────────────────────── */}

        {/* OPEN */}
        {partido.status === "open" && (
          <View style={{ gap: 10 }}>
            {isOrganizer ? (
              <View style={{ backgroundColor: "rgba(79,70,229,0.1)", borderRadius: 12, paddingVertical: 14, alignItems: "center" }}>
                <Text style={{ fontSize: 14, color: C.accent, fontWeight: "600" }}>Eres el organizador</Text>
                <Text style={{ fontSize: 11, color: C.text2, marginTop: 4 }}>
                  {spotsLeft} cupo{spotsLeft !== 1 ? "s" : ""} disponible{spotsLeft !== 1 ? "s" : ""}
                </Text>
              </View>
            ) : isPlayer ? (
              <TouchableOpacity
                style={{ borderWidth: 1, borderColor: C.red, borderRadius: 12, paddingVertical: 14, alignItems: "center" }}
                onPress={handleLeave}
              >
                <Text style={{ fontSize: 15, fontWeight: "700", color: C.red }}>Salir del partido</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[S.btn, !spotsLeft && S.btnDisabled]}
                onPress={handleJoin}
                disabled={!spotsLeft}
              >
                <Text style={S.btnText}>{spotsLeft ? "Unirse al partido" : "Partido lleno"}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* CONFIRMED: QR flow */}
        {partido.status === "confirmed" && (
          <View style={{ gap: 10 }}>
            <View style={{ backgroundColor: "rgba(79,70,229,0.08)", borderWidth: 1, borderColor: "rgba(79,70,229,0.2)", borderRadius: 14, padding: 14 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: C.accent, marginBottom: 4 }}>
                ✓ Todos los jugadores se unieron
              </Text>
              <Text style={{ fontSize: 12, color: C.text2 }}>
                {isOrganizer
                  ? "Genera el QR para que los jugadores confirmen su presencia al inicio del partido."
                  : "El organizador generará un QR. Escanéalo para confirmar tu presencia."}
              </Text>
            </View>
            {isOrganizer ? (
              <TouchableOpacity
                style={[S.btn, generatingQR && S.btnDisabled]}
                onPress={handleGenerateQR}
                disabled={generatingQR}
              >
                {generatingQR
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={S.btnText}>Generar QR de presencia</Text>}
              </TouchableOpacity>
            ) : isPlayer ? (
              <TouchableOpacity
                style={S.btn}
                onPress={() => { setScanned(false); setShowScanner(true); }}
              >
                <Text style={S.btnText}>Escanear QR · Confirmar presencia</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}

        {/* IN_PROGRESS: result flow */}
        {partido.status === "in_progress" && (
          <View style={{ gap: 10 }}>
            <View style={{ backgroundColor: "rgba(14,165,233,0.08)", borderWidth: 1, borderColor: "rgba(14,165,233,0.25)", borderRadius: 14, padding: 14 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#38bdf8", marginBottom: 2 }}>
                🎾 Partido en curso
              </Text>
              <Text style={{ fontSize: 12, color: C.text2 }}>
                Cuando finalice, registra el resultado.
              </Text>
            </View>

            {/* No result yet */}
            {!resultado && isPlayer && !showResultForm && (
              <TouchableOpacity style={S.btn} onPress={() => setShowResultForm(true)}>
                <Text style={S.btnText}>Registrar resultado</Text>
              </TouchableOpacity>
            )}

            {/* Result form */}
            {showResultForm && !resultado && (
              <View style={[S.card, { gap: 14 }]}>
                <Text style={{ fontSize: 15, fontWeight: "700", color: C.text }}>Resultado del partido</Text>

                <View style={{ flexDirection: "row", gap: 10 }}>
                  {([
                    {
                      key: "a" as const,
                      label: teamA.length > 0 ? `Equipo A (${teamA.map(p => p.name.split(" ")[0]).join(", ")})` : "Equipo A",
                      value: scoreA,
                      onChange: setScoreA,
                    },
                    {
                      key: "b" as const,
                      label: teamB.length > 0 ? `Equipo B (${teamB.map(p => p.name.split(" ")[0]).join(", ")})` : "Equipo B",
                      value: scoreB,
                      onChange: setScoreB,
                    },
                  ]).map(({ key, label, value, onChange }) => (
                    <View key={key} style={{ flex: 1 }}>
                      <Text style={{ fontSize: 10, color: C.text2, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.6 }}>
                        {label}
                      </Text>
                      <TextInput
                        style={S.input}
                        value={value}
                        onChangeText={onChange}
                        placeholder="ej. 6-3"
                        placeholderTextColor={C.text2}
                        autoCorrect={false}
                      />
                    </View>
                  ))}
                </View>

                <View>
                  <Text style={{ fontSize: 11, color: C.text2, marginBottom: 8 }}>Ganador</Text>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    {([
                      { val: "team_a" as const, label: "Equipo A" },
                      { val: "draw"   as const, label: "Empate"   },
                      { val: "team_b" as const, label: "Equipo B" },
                    ]).map(({ val, label }) => (
                      <TouchableOpacity
                        key={val}
                        style={[
                          { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: "center", borderWidth: 1 },
                          winner === val
                            ? { backgroundColor: C.accent, borderColor: C.accent }
                            : { backgroundColor: C.bg4, borderColor: C.border },
                        ]}
                        onPress={() => setWinner(val)}
                      >
                        <Text style={{ fontSize: 11, fontWeight: "700", color: winner === val ? "#fff" : C.text2 }}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={{ flexDirection: "row", gap: 10 }}>
                  <TouchableOpacity
                    style={{ flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingVertical: 13, alignItems: "center" }}
                    onPress={() => setShowResultForm(false)}
                  >
                    <Text style={{ color: C.text2, fontWeight: "600" }}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[S.btn, { flex: 1 }, (submitting || !winner || !scoreA.trim() || !scoreB.trim()) && S.btnDisabled]}
                    onPress={handleSubmitResult}
                    disabled={submitting || !winner || !scoreA.trim() || !scoreB.trim()}
                  >
                    {submitting
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={S.btnText}>Enviar</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Pending result */}
            {resultado && !resultado.confirmed && (
              <View style={[S.card, { gap: 12 }]}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: C.text }}>Resultado registrado</Text>
                  <View style={{ backgroundColor: "rgba(251,191,36,0.12)", borderWidth: 1, borderColor: "rgba(251,191,36,0.35)", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                    <Text style={{ fontSize: 11, color: "#fbbf24", fontWeight: "700" }}>Sin confirmar</Text>
                  </View>
                </View>

                <View style={{ flexDirection: "row", gap: 12, justifyContent: "space-around", paddingVertical: 4 }}>
                  {[
                    { label: "Equipo A", score: resultado.score_team_a },
                    { label: "Equipo B", score: resultado.score_team_b },
                  ].map(({ label, score }) => (
                    <View key={label} style={{ alignItems: "center" }}>
                      <Text style={{ fontSize: 11, color: C.text2, marginBottom: 4 }}>{label}</Text>
                      <Text style={{ fontSize: 26, fontWeight: "800", color: C.text }}>{score}</Text>
                    </View>
                  ))}
                </View>

                <Text style={{ fontSize: 12, color: C.text2, textAlign: "center" }}>
                  Ganador: {resultado.winner === "team_a" ? "Equipo A" : resultado.winner === "team_b" ? "Equipo B" : "Empate"}
                </Text>
                <Text style={{ fontSize: 11, color: C.text2, textAlign: "center" }}>
                  Por: {partido.players.find(p => p.id === resultado.registered_by)?.name ?? "—"}
                </Text>

                {canConfirmResult ? (
                  <TouchableOpacity
                    style={[S.btn, confirming2 && S.btnDisabled]}
                    onPress={handleConfirmResult}
                    disabled={confirming2}
                  >
                    {confirming2
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={S.btnText}>Confirmar resultado</Text>}
                  </TouchableOpacity>
                ) : (
                  <View style={{ backgroundColor: C.bg4, borderRadius: 10, paddingVertical: 12, alignItems: "center" }}>
                    <Text style={{ fontSize: 12, color: C.text2 }}>Esperando confirmación del equipo contrario...</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* FINISHED */}
        {partido.status === "finished" && resultado && (
          <View style={[S.card, { gap: 12 }]}>
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 32, marginBottom: 4 }}>🏆</Text>
              <Text style={{ fontSize: 16, fontWeight: "800", color: C.text }}>Partido finalizado</Text>
            </View>
            <View style={{ flexDirection: "row", gap: 12, justifyContent: "space-around", paddingVertical: 6 }}>
              {[
                { label: "Equipo A", score: resultado.score_team_a },
                { label: "Equipo B", score: resultado.score_team_b },
              ].map(({ label, score }) => (
                <View key={label} style={{ alignItems: "center" }}>
                  <Text style={{ fontSize: 11, color: C.text2, marginBottom: 4 }}>{label}</Text>
                  <Text style={{ fontSize: 32, fontWeight: "800", color: C.text }}>{score}</Text>
                </View>
              ))}
            </View>
            <Text style={{ textAlign: "center", fontSize: 15, fontWeight: "700", color: resultado.winner === "draw" ? C.text2 : "#4ade80" }}>
              {resultado.winner === "draw" ? "Empate" : resultado.winner === "team_a" ? "Ganó Equipo A" : "Ganó Equipo B"}
            </Text>
          </View>
        )}

        {/* CANCELLED */}
        {partido.status === "cancelled" && (
          <View style={[S.card, { alignItems: "center", padding: 28 }]}>
            <Text style={{ fontSize: 15, fontWeight: "700", color: C.text2 }}>Partido cancelado</Text>
          </View>
        )}

      </ScrollView>

      {/* ── QR Modal ──────────────────────────────────────────────────── */}
      <Modal visible={showQR} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" }}>
          <View style={{
            backgroundColor: C.bg3, borderTopLeftRadius: 24, borderTopRightRadius: 24,
            borderTopWidth: 1, borderTopColor: C.border, padding: 28, alignItems: "center",
          }}>
            <Text style={{ fontSize: 17, fontWeight: "700", color: C.text, marginBottom: 4 }}>
              QR de presencia
            </Text>
            <Text style={{ fontSize: 12, color: C.text2, marginBottom: 24, textAlign: "center" }}>
              Muéstralo a los jugadores para que escaneen con la app
            </Text>
            <View style={{ backgroundColor: "#fff", padding: 16, borderRadius: 16, marginBottom: 16 }}>
              {qrData?.qr_payload ? <QRCode value={qrData.qr_payload} size={220} /> : null}
            </View>
            {qrData && (
              <Text style={{ fontSize: 11, color: C.text2, marginBottom: 24 }}>
                {formatExpiry(qrData.expires_at)}
              </Text>
            )}
            <TouchableOpacity style={[S.btn, { paddingHorizontal: 48 }]} onPress={() => setShowQR(false)}>
              <Text style={S.btnText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Scanner Modal ─────────────────────────────────────────────── */}
      <Modal visible={showScanner} animationType="slide">
        <View style={{ flex: 1, backgroundColor: "#000" }}>
          {!permission?.granted ? (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
              <Text style={{ color: "#fff", fontSize: 16, textAlign: "center", marginBottom: 24 }}>
                Se necesita acceso a la cámara para escanear el QR
              </Text>
              <TouchableOpacity style={[S.btn, { marginBottom: 16 }]} onPress={requestPermission}>
                <Text style={S.btnText}>Permitir acceso</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowScanner(false)}>
                <Text style={{ color: "#aaa", fontSize: 14 }}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <CameraView
                style={{ flex: 1 }}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                onBarcodeScanned={scanned ? undefined : handleScan}
              />
              {/* Viewfinder overlay */}
              <View
                style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" }}
                pointerEvents="none"
              >
                <View style={{ width: 240, height: 240, borderWidth: 2, borderColor: C.accent, borderRadius: 20 }} />
              </View>
              {/* Instruction */}
              <View
                style={{ position: "absolute", top: 80, width: "100%", alignItems: "center" }}
                pointerEvents="none"
              >
                <View style={{ backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 }}>
                  <Text style={{ color: "#fff", fontSize: 14 }}>Apunta al QR del organizador</Text>
                </View>
              </View>
              {/* Cancel button */}
              <View style={{ position: "absolute", bottom: 52, width: "100%", alignItems: "center" }}>
                {confirming ? (
                  <View style={{ alignItems: "center", gap: 10 }}>
                    <ActivityIndicator color="#fff" size="large" />
                    <Text style={{ color: "#fff", fontSize: 14 }}>Confirmando presencia...</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={{ backgroundColor: "rgba(0,0,0,0.65)", borderWidth: 1, borderColor: "rgba(255,255,255,0.25)", borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32 }}
                    onPress={() => setShowScanner(false)}
                  >
                    <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>Cancelar</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </View>
      </Modal>

      {/* Toast */}
      {toast ? (
        <View style={{
          position: "absolute", bottom: 32, alignSelf: "center",
          backgroundColor: C.bg3, borderWidth: 1, borderColor: C.border,
          paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12,
        }}>
          <Text style={{ color: C.text, fontSize: 14, fontWeight: "500" }}>{toast}</Text>
        </View>
      ) : null}
    </View>
  );
}
