import { useRouter } from "expo-router";
import { useState } from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { C, S } from "../../theme";

const ZONAS = ["Valparaíso", "Viña del Mar", "Quilpué", "Concón", "Santiago"];

const RANKING_DATA = [
  { pos: 1,  ini: "LP", nombre: "Luis P.",         zona: "Valparaíso",   cat: "5°", mmr: 1445, delta: +31,  color: "#d97706" },
  { pos: 2,  ini: "RS", nombre: "Roberto S.",      zona: "Valparaíso",   cat: "5°", mmr: 1389, delta: +12,  color: "#7c3aed" },
  { pos: 3,  ini: "DM", nombre: "Diego M.",        zona: "Valparaíso",   cat: "4°", mmr: 1356, delta: -5,   color: "#b45309" },
  { pos: 4,  ini: "PR", nombre: "Pedro Rojas",     zona: "Valparaíso",   cat: "5°", mmr: 1312, delta: +31,  color: "#0891b2" },
  { pos: 5,  ini: "AP", nombre: "Ana Paredes",     zona: "Valparaíso",   cat: "4°", mmr: 1295, delta: -12,  color: "#d97706" },
  { pos: 6,  ini: "MR", nombre: "Miguel Ríos",     zona: "Viña del Mar", cat: "4°", mmr: 1261, delta: +44,  color: "#059669" },
  { pos: 7,  ini: "CM", nombre: "Carla Méndez",    zona: "Valparaíso",   cat: "4°", mmr: 1250, delta: +19,  color: "#7c3aed" },
  { pos: 14, ini: "FM", nombre: "Felipe Martínez", zona: "Valparaíso",   cat: "4°", mmr: 1248, delta: +127, color: "#4f46e5", isMe: true },
  { pos: 15, ini: "JV", nombre: "Javier Vega",     zona: "Quilpué",      cat: "3°", mmr: 1219, delta: -8,   color: "#4f46e5" },
  { pos: 16, ini: "LV", nombre: "Luis Vera",       zona: "Viña del Mar", cat: "3°", mmr: 1201, delta: 0,    color: "#0891b2" },
];

const MEDAL = ["🥇", "🥈", "🥉"];

export default function RankingScreen() {
  const { user } = useAuth();
  const router   = useRouter();
  const [zona,      setZona]      = useState(user?.zone ?? "Valparaíso");
  const [showZonas, setShowZonas] = useState(false);

  const podio = RANKING_DATA.slice(0, 3);
  const lista = RANKING_DATA.slice(3);

  return (
    <View style={S.screen}>
      <ScrollView style={S.scroll} contentContainerStyle={{ paddingBottom: 16 }}>

        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, paddingBottom: 16 }}>
          <TouchableOpacity style={S.backBtn} onPress={() => router.back()}>
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

        <View style={{ paddingHorizontal: 20 }}>

          {/* Podio */}
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 20, alignItems: "flex-end" }}>
            {[podio[1], podio[0], podio[2]].map((p, i) => {
              const realPos = i === 0 ? 2 : i === 1 ? 1 : 3;
              const sizes   = [56, 68, 56];
              return (
                <View key={p.ini} style={{ flex: i === 1 ? 1.15 : 1, alignItems: "center" }}>
                  <View style={[S.avatar, { width: sizes[i], height: sizes[i], backgroundColor: p.color, borderRadius: 18, marginBottom: 6 }]}>
                    <Text style={[S.avatarText, { fontSize: i === 1 ? 20 : 16 }]}>{p.ini}</Text>
                  </View>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: C.text, marginBottom: 2 }}>
                    {p.nombre.split(" ")[0]} {p.nombre.split(" ")[1]?.[0]}.
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

          {/* Lista */}
          <View style={S.card}>
            {lista.map((j, i) => (
              <View key={j.pos} style={{
                flexDirection: "row", alignItems: "center", gap: 12,
                paddingVertical: 11,
                borderBottomWidth: i < lista.length - 1 ? 1 : 0,
                borderBottomColor: C.border,
                backgroundColor: (j as any).isMe ? "rgba(79,70,229,0.05)" : "transparent",
                borderRadius: (j as any).isMe ? 8 : 0,
              }}>
                <Text style={{ width: 22, fontSize: 13, color: C.text2, fontWeight: "600", textAlign: "center" }}>{j.pos}</Text>
                <View style={[S.avatar, { width: 36, height: 36, backgroundColor: j.color }]}>
                  <Text style={[S.avatarText, { fontSize: 13 }]}>{j.ini}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: (j as any).isMe ? "700" : "500", color: (j as any).isMe ? C.accent : C.text }}>
                    {j.nombre}{(j as any).isMe ? " · Tú" : ""}
                  </Text>
                  <Text style={{ fontSize: 12, color: C.text2 }}>{j.zona} · {j.cat}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ fontSize: 15, fontWeight: "800", color: C.text }}>{j.mmr.toLocaleString()}</Text>
                  {j.delta !== 0 && (
                    <Text style={{ fontSize: 11, color: j.delta > 0 ? "#4ade80" : "#f87171", fontWeight: "600" }}>
                      {j.delta > 0 ? `▲ +${j.delta}` : `▼ ${j.delta}`}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Modal zonas */}
      <Modal visible={showZonas} transparent animationType="fade">
        <TouchableOpacity style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }} onPress={() => setShowZonas(false)}>
          <View style={{ position: "absolute", top: 100, right: 20, backgroundColor: C.bg3, borderWidth: 1, borderColor: C.border, borderRadius: 12, minWidth: 160, overflow: "hidden" }}>
            {ZONAS.map((z) => (
              <TouchableOpacity key={z} onPress={() => { setZona(z); setShowZonas(false); }}
                style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: z === zona ? "rgba(79,70,229,0.1)" : "transparent" }}>
                <Text style={{ fontSize: 13, color: z === zona ? C.accent : C.text }}>{z}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
