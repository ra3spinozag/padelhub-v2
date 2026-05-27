import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { C, S } from "../../theme";

const JUGADORES = [
  { id: 2, ini: "MR", nombre: "Miguel Ríos",  zona: "Viña del Mar", cat: "4°", edad: 31, mmr: 1261, dif: +13, match: 98, color: "#4f46e5" },
  { id: 3, ini: "JV", nombre: "Javier Vega",  zona: "Quilpué",      cat: "3°", edad: 27, mmr: 1219, dif: -29, match: 91, color: "#059669" },
  { id: 4, ini: "AP", nombre: "Ana Paredes",  zona: "Valparaíso",   cat: "4°", edad: 29, mmr: 1195, dif: -53, match: 78, color: "#d97706" },
  { id: 5, ini: "RP", nombre: "Roberto Pino", zona: "Concón",       cat: "5°", edad: 33, mmr: 1311, dif: +63, match: 72, color: "#db2777" },
  { id: 6, ini: "CM", nombre: "Carla Méndez", zona: "Valparaíso",   cat: "4°", edad: 26, mmr: 1230, dif: -18, match: 68, color: "#7c3aed" },
];

// Ring de compatibilidad usando View anidados (sin SVG nativo)
function MatchRing({ pct, color }: { pct: number; color: string }) {
  return (
    <View style={{ width: 48, height: 48, borderRadius: 24, borderWidth: 3, borderColor: color, alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Text style={{ fontSize: 11, fontWeight: "700", color, lineHeight: 14 }}>{pct}%</Text>
      <Text style={{ fontSize: 9, color: C.text2, lineHeight: 12 }}>match</Text>
    </View>
  );
}

export default function MatchmakingScreen() {
  const { user }   = useAuth();
  const router     = useRouter();
  const [selected, setSelected] = useState<typeof JUGADORES[0] | null>(null);
  const [toast,    setToast]    = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const handleDesafiar = () => {
    if (!selected) return;
    showToast(`Desafío enviado a ${selected.nombre}`);
    setSelected(null);
  };

  return (
    <View style={S.screen}>
      <ScrollView style={S.scroll} contentContainerStyle={{ paddingBottom: 16 }}>

        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, paddingBottom: 16 }}>
          <TouchableOpacity style={S.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace("/(app)/home")}>
            <Text style={S.backBtnText}>←</Text>
          </TouchableOpacity>
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: C.text }}>Matchmaking</Text>
            <Text style={{ fontSize: 12, color: C.text2 }}>MMR ±150 · {user?.zone ?? "tu zona"}</Text>
          </View>
          <TouchableOpacity style={{ backgroundColor: C.bg3, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingVertical: 6, paddingHorizontal: 12 }}>
            <Text style={{ fontSize: 12, color: C.text2 }}>Filtrar</Text>
          </TouchableOpacity>
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          <Text style={S.sectionLabel}>Mejores compatibilidades para ti</Text>

          {JUGADORES.map((j) => {
            const isSelected = selected?.id === j.id;
            const ringColor  = j.match >= 90 ? "#22c55e" : j.match >= 75 ? "#f59e0b" : C.accent;
            return (
              <TouchableOpacity
                key={j.id}
                style={[S.playerCard, isSelected && { borderColor: C.accent, backgroundColor: "rgba(79,70,229,0.08)" }]}
                onPress={() => setSelected(isSelected ? null : j)}
              >
                <View style={[S.avatar, { width: 44, height: 44, backgroundColor: j.color }]}>
                  <Text style={[S.avatarText, { fontSize: 15 }]}>{j.ini}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: C.text }}>{j.nombre}</Text>
                  <Text style={{ fontSize: 12, color: C.text2, marginBottom: 4 }}>
                    {j.zona} · {j.cat} · {j.edad} años
                  </Text>
                  <View style={{ flexDirection: "row", gap: 6 }}>
                    <View style={[S.pill, S.pillPurple]}>
                      <Text style={[S.pillText, S.pillPurpleText]}>{j.mmr} MMR</Text>
                    </View>
                    <View style={[S.pill, j.dif >= 0 ? S.pillGreen : S.pillRed]}>
                      <Text style={[S.pillText, j.dif >= 0 ? S.pillGreenText : S.pillRedText]}>
                        Dif. {j.dif > 0 ? `+${j.dif}` : j.dif}
                      </Text>
                    </View>
                  </View>
                </View>
                <MatchRing pct={j.match} color={ringColor} />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Botón desafiar fijo */}
      {selected && (
        <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
          <TouchableOpacity style={S.btn} onPress={handleDesafiar}>
            <Text style={S.btnText}>Desafiar a {selected.nombre}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Toast */}
      {toast ? (
        <View style={{ position: "absolute", bottom: 90, alignSelf: "center", backgroundColor: C.green, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 }}>
          <Text style={{ color: "#fff", fontSize: 14, fontWeight: "500" }}>{toast}</Text>
        </View>
      ) : null}
    </View>
  );
}
