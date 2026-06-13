import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator, ScrollView, Text, TouchableOpacity, View,
} from "react-native";
import { useAuth } from "../../../context/AuthContext";
import {
  getMatchRatings, submitRatings, type RatingPlayer,
} from "../../../services/ratings.service";
import { UserAvatar } from "../../../components/UserAvatar";
import { C, S } from "../../../theme";

function StarRow({ score, onRate }: { score: number; onRate: (s: number) => void }) {
  return (
    <View style={{ flexDirection: "row", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <TouchableOpacity key={s} onPress={() => onRate(s)} hitSlop={6}>
          <Text style={{ fontSize: 30, color: s <= score ? C.gold : C.bg4, lineHeight: 36 }}>
            {s <= score ? "★" : "☆"}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function ValoracionScreen() {
  const { id }   = useLocalSearchParams<{ id: string }>();
  const router   = useRouter();
  const { user } = useAuth();

  const [players,     setPlayers]     = useState<RatingPlayer[]>([]);
  const [scores,      setScores]      = useState<Record<string, number>>({});
  const [hasRatedAll, setHasRatedAll] = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState("");
  const [success,     setSuccess]     = useState(false);

  useEffect(() => {
    if (!user?.id || !id) return;
    getMatchRatings(id, user.id)
      .then((res) => {
        setHasRatedAll(res.has_rated_all);
        setPlayers(res.players_to_rate);
        const init: Record<string, number> = {};
        res.players_to_rate.forEach((p) => { init[p.id] = 0; });
        setScores(init);
      })
      .catch((e: any) => setError(e.message ?? "Error al cargar"))
      .finally(() => setLoading(false));
  }, [id, user?.id]);

  const allRated = players.length > 0 && players.every((p) => (scores[p.id] ?? 0) >= 1);

  const handleSubmit = async () => {
    if (!user?.id || !id || !allRated || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await submitRatings(id, user.id, players.map((p) => ({ ratee_id: p.id, score: scores[p.id] })));
      setSuccess(true);
    } catch (e: any) {
      setError(e.message ?? "Error al enviar valoraciones");
    } finally {
      setSubmitting(false);
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
    <View style={S.screen}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 20, paddingBottom: 16 }}>
        <TouchableOpacity
          style={S.backBtn}
          onPress={() => router.canGoBack() ? router.back() : router.replace("/(app)/home")}
        >
          <Text style={S.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: "700", color: C.text }}>Valorar jugadores</Text>
      </View>

      {/* Error */}
      {error ? (
        <View style={[S.error, { marginHorizontal: 20, marginBottom: 4 }]}>
          <Text style={S.errorText}>⚠️ {error}</Text>
        </View>
      ) : null}

      {/* Done state */}
      {hasRatedAll || success ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
          <Text style={{ fontSize: 52, marginBottom: 16 }}>🏆</Text>
          <Text style={{ fontSize: 18, fontWeight: "800", color: C.text, marginBottom: 8 }}>
            ¡Valoraciones enviadas!
          </Text>
          <Text style={{ fontSize: 14, color: C.text2, textAlign: "center", marginBottom: 32, lineHeight: 20 }}>
            Ya valoraste a todos los jugadores de este partido
          </Text>
          <TouchableOpacity
            style={[S.btn, { paddingHorizontal: 36 }]}
            onPress={() => router.canGoBack() ? router.back() : router.replace("/(app)/home")}
          >
            <Text style={S.btnText}>Volver al partido</Text>
          </TouchableOpacity>
        </View>
      ) : players.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
          <Text style={{ fontSize: 40, marginBottom: 14 }}>👥</Text>
          <Text style={{ fontSize: 16, fontWeight: "700", color: C.text, marginBottom: 8 }}>
            Sin jugadores para valorar
          </Text>
          <Text style={{ fontSize: 13, color: C.text2, textAlign: "center" }}>
            No hay jugadores pendientes de valoración en este partido
          </Text>
        </View>
      ) : (
        <ScrollView style={S.scroll} contentContainerStyle={{ padding: 20, paddingBottom: 36 }}>
          <Text style={{ fontSize: 13, color: C.text2, marginBottom: 20, lineHeight: 20 }}>
            Valora del 1 al 5 a cada jugador. Debes valorar a todos para poder enviar.
          </Text>

          <View style={{ gap: 12 }}>
            {players.map((player) => {
              const score = scores[player.id] ?? 0;
              return (
                <View key={player.id} style={[S.card, { flexDirection: "row", alignItems: "center", gap: 14 }]}>
                  <UserAvatar name={player.name} photoUrl={player.photo_url} size={50} borderRadius={14} />
                  <View style={{ flex: 1, gap: 8 }}>
                    <Text style={{ fontSize: 15, fontWeight: "700", color: C.text }}>
                      {player.name.split(" ")[0]}
                    </Text>
                    <StarRow
                      score={score}
                      onRate={(s) => setScores((prev) => ({ ...prev, [player.id]: s }))}
                    />
                    {score === 0 && (
                      <Text style={{ fontSize: 11, color: C.text2 }}>Toca las estrellas para valorar</Text>
                    )}
                  </View>
                  {score > 0 && (
                    <View style={{ alignItems: "center", minWidth: 28 }}>
                      <Text style={{ fontSize: 24, fontWeight: "800", color: C.gold, lineHeight: 28 }}>
                        {score}
                      </Text>
                      <Text style={{ fontSize: 10, color: C.text2 }}>/5</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          <View style={{ marginTop: 28 }}>
            <TouchableOpacity
              style={[S.btn, (!allRated || submitting) && S.btnDisabled]}
              onPress={handleSubmit}
              disabled={!allRated || submitting}
            >
              {submitting
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={S.btnText}>Enviar valoraciones</Text>}
            </TouchableOpacity>
            {!allRated && (
              <Text style={{ fontSize: 12, color: C.text2, textAlign: "center", marginTop: 10 }}>
                Valora a todos los jugadores para continuar
              </Text>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
