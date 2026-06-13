import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../context/AuthContext";
import {
  getAvatarColor, getFormatoLabel, getStatusLabel, parseMatchDate,
  parseMatchTime, usePartidos, type Partido
} from "../../context/PartidosContext";
import { listMatches } from "../../services/matches.service";
import { getSuggestedRivals, type SuggestedRival } from "../../services/rivals.service";
import { C, S } from "../../theme";
import { UserAvatar } from "../../components/UserAvatar";

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const { partidos }     = usePartidos();
  const router           = useRouter();
  const [misActivos, setMisActivos] = useState<Partido[]>([]);
  const [rivals,     setRivals]     = useState<SuggestedRival[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;
      let cancelled = false;
      (async () => {
        try {
          const [inProgress, confirmed] = await Promise.all([
            listMatches({ zone: user.zone ?? undefined, status: "in_progress" }),
            listMatches({ zone: user.zone ?? undefined, status: "confirmed" }),
          ]);
          if (cancelled) return;
          const all = [...inProgress, ...confirmed];
          setMisActivos(all.filter(m =>
            m.players.some(p => p.id === user.id) || m.organizer?.id === user.id
          ));
        } catch {
          // keep existing state
        }
      })();

      if (user.rut) {
        getSuggestedRivals(user.rut, { limit: 5 })
          .then((res) => { if (!cancelled) setRivals(res.rivals); })
          .catch(() => {});
      }

      return () => { cancelled = true; };
    }, [user?.id, user?.zone, user?.rut])
  );

  const proximoPartido: Partido | null =
    misActivos[0] ??
    partidos.find(p => p.players.some(pl => pl.id === user?.id)) ??
    null;

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
          <TouchableOpacity onPress={() => router.push("/(app)/perfil")}>
            <UserAvatar name={user?.name ?? "?"} photoUrl={user?.photo_url} size={44} borderRadius={14} />
          </TouchableOpacity>
        </View>

        {/* MMR card */}
        <View style={S.mmrBar}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, color: C.text2, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>Tu MMR</Text>
            <Text style={S.mmrNum}>{user?.mmr ?? 1000}</Text>
            <Text style={{ fontSize: 12, color: C.text2, marginTop: 4 }}>
              Juega partidos para obtener ranking
            </Text>
          </View>
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
                  <UserAvatar name={mp.name} photoUrl={mp.photo_url} size={32} color={getAvatarColor(i)} />
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

        {/* Rivales sugeridos */}
        {rivals.length > 0 && (
          <>
            <Text style={S.sectionLabel}>Rivales sugeridos</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10, paddingBottom: 4, marginBottom: 20 }}
            >
              {rivals.map((rival) => (
                <TouchableOpacity
                  key={rival.id}
                  style={[S.card, { width: 140, padding: 14, alignItems: "center", gap: 8 }]}
                  onPress={() => router.push("/(app)/crear")}
                >
                  <UserAvatar name={rival.name} photoUrl={rival.photo_url} size={48} borderRadius={15} />
                  <View style={{ alignItems: "center", gap: 2 }}>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: C.text, textAlign: "center" }} numberOfLines={1}>
                      {rival.name.split(" ")[0]}
                    </Text>
                    <Text style={{ fontSize: 11, color: C.text2 }}>{rival.zone}</Text>
                  </View>
                  <View style={{ alignItems: "center", gap: 4 }}>
                    <Text style={{ fontSize: 14, fontWeight: "800", color: C.text }}>{rival.mmr}</Text>
                    <View style={[S.pill, rival.mmr_diff <= 30 ? S.pillGreen : S.pillGray]}>
                      <Text style={[S.pillText, rival.mmr_diff <= 30 ? S.pillGreenText : S.pillGrayText]}>
                        Δ {rival.mmr_diff} MMR
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* Actividad reciente */}
        <Text style={S.sectionLabel}>Actividad reciente</Text>
        <View style={[S.card, { alignItems: "center", padding: 24, marginBottom: 24 }]}>
          <Text style={{ fontSize: 28, marginBottom: 8 }}>📋</Text>
          <Text style={{ fontSize: 14, fontWeight: "600", color: C.text, marginBottom: 4 }}>Sin actividad aún</Text>
          <Text style={{ fontSize: 12, color: C.text2 }}>Tus partidos jugados aparecerán aquí</Text>
        </View>

        {/* Cerrar sesión */}
        <TouchableOpacity onPress={handleLogout} style={{ alignItems: "center", marginBottom: 16 }}>
          <Text style={{ fontSize: 12, color: C.text2, textDecorationLine: "underline" }}>Cerrar sesión</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}
