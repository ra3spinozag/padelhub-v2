import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator, Modal, ScrollView,
  Text, TouchableOpacity, View,
} from "react-native";
import { Image } from "expo-image";
import { useAuth } from "../../context/AuthContext";
import { getInitials } from "../../context/PartidosContext";
import { uploadProfilePhoto } from "../../services/auth.service";
import { C, S } from "../../theme";

const ZONAS = [
  "Valparaíso", "Viña del Mar", "Quilpué", "Concón",
  "Santiago", "Concepción", "Temuco", "La Serena",
  "Antofagasta", "Iquique", "Puerto Montt", "Otra",
];

export default function PerfilEditarScreen() {
  const { user, editarPerfil } = useAuth();
  const router = useRouter();

  const [zone,        setZone]        = useState(user?.zone ?? "");
  const [photoUri,    setPhotoUri]    = useState<string | null>(user?.photo_url ?? null);
  const [showZonas,   setShowZonas]   = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error,       setError]       = useState("");
  const [success,     setSuccess]     = useState(false);

  const initiales = user?.name ? getInitials(user.name) : "?";

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      setError("Se necesita permiso para acceder a tu galería.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setError("");
      setUploadingPhoto(true);
      try {
        const url = await uploadProfilePhoto(user!.id, uri);
        setPhotoUri(url);
      } catch (e: any) {
        setError(e.message ?? "No se pudo subir la foto. Intenta de nuevo.");
      } finally {
        setUploadingPhoto(false);
      }
    }
  };

  const handleSave = async () => {
    if (!zone) { setError("Selecciona una zona."); return; }
    setError("");
    setSubmitting(true);
    try {
      await editarPerfil({
        zone,
        photo_url: photoUri,
      });
      setSuccess(true);
      setTimeout(() => router.canGoBack() ? router.back() : router.replace("/(app)/home"), 1200);
    } catch (e: any) {
      setError(e.message ?? "No se pudo guardar los cambios.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={S.screen}>
      <ScrollView style={S.scroll} contentContainerStyle={{ paddingBottom: 32 }}>

        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, paddingBottom: 16 }}>
          <TouchableOpacity style={S.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace("/(app)/home")}>
            <Text style={S.backBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: "700", color: C.text }}>Editar perfil</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={{ paddingHorizontal: 20 }}>

          {/* Avatar */}
          <View style={{ alignItems: "center", marginBottom: 28 }}>
            <TouchableOpacity onPress={handlePickPhoto} disabled={uploadingPhoto}>
              <View style={{
                width: 96, height: 96, borderRadius: 28,
                backgroundColor: C.accent,
                borderWidth: 2, borderColor: C.border2,
                alignItems: "center", justifyContent: "center",
                overflow: "hidden",
              }}>
                {uploadingPhoto ? (
                  <ActivityIndicator color="#fff" size="large" />
                ) : photoUri ? (
                  <Image
                    source={{ uri: photoUri }}
                    style={{ width: 96, height: 96 }}
                    contentFit="cover"
                  />
                ) : (
                  <Text style={{ fontSize: 32, fontWeight: "800", color: "#fff" }}>
                    {initiales}
                  </Text>
                )}
              </View>
              {/* Badge cámara */}
              <View style={{
                position: "absolute", bottom: 0, right: 0,
                width: 28, height: 28, borderRadius: 14,
                backgroundColor: C.accent, borderWidth: 2, borderColor: C.bg,
                alignItems: "center", justifyContent: "center",
              }}>
                <Text style={{ fontSize: 13 }}>📷</Text>
              </View>
            </TouchableOpacity>

            <Text style={{ fontSize: 13, color: C.text2, marginTop: 10 }}>
              Toca para cambiar tu foto
            </Text>
          </View>

          {/* Info no editable */}
          <View style={[S.card, { marginBottom: 20 }]}>
            <Text style={[S.label, { marginBottom: 10 }]}>Información de cuenta</Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border }}>
              <Text style={{ fontSize: 13, color: C.text2 }}>Nombre</Text>
              <Text style={{ fontSize: 13, color: C.text, fontWeight: "600" }}>{user?.name ?? "—"}</Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 }}>
              <Text style={{ fontSize: 13, color: C.text2 }}>RUT</Text>
              <Text style={{ fontSize: 13, color: C.text, fontWeight: "600" }}>
                {user?.rut ? `${user.rut}-${user.dv_rut ?? ""}` : "—"}
              </Text>
            </View>
          </View>

          {/* Zona */}
          <View style={S.inputGroup}>
            <Text style={S.label}>Zona</Text>
            <TouchableOpacity
              style={[S.input, { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }]}
              onPress={() => setShowZonas(true)}
            >
              <Text style={{ fontSize: 14, color: zone ? C.text : C.text2 }}>
                {zone || "Selecciona tu zona"}
              </Text>
              <Text style={{ color: C.text2 }}>▾</Text>
            </TouchableOpacity>
          </View>

          {/* Error */}
          {error ? (
            <View style={[S.error, { marginBottom: 16 }]}>
              <Text style={S.errorText}>⚠️ {error}</Text>
            </View>
          ) : null}

          {/* Éxito */}
          {success ? (
            <View style={{ backgroundColor: "rgba(34,197,94,0.1)", borderWidth: 1, borderColor: "rgba(34,197,94,0.3)", borderRadius: 10, padding: 12, marginBottom: 16 }}>
              <Text style={{ fontSize: 13, color: "#86efac", textAlign: "center" }}>✓ Cambios guardados</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[S.btn, (submitting || uploadingPhoto) && S.btnDisabled]}
            onPress={handleSave}
            disabled={submitting || uploadingPhoto}
          >
            {submitting
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={S.btnText}>Guardar cambios</Text>}
          </TouchableOpacity>

        </View>
      </ScrollView>

      {/* Modal zonas */}
      <Modal visible={showZonas} transparent animationType="fade">
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 32 }}
          onPress={() => setShowZonas(false)}
        >
          <View style={{ backgroundColor: C.bg3, borderWidth: 1, borderColor: C.border, borderRadius: 16, overflow: "hidden" }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: C.text, padding: 16, borderBottomWidth: 1, borderBottomColor: C.border }}>
              Selecciona tu zona
            </Text>
            {ZONAS.map((z) => (
              <TouchableOpacity
                key={z}
                onPress={() => { setZone(z); setShowZonas(false); }}
                style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: z === zone ? "rgba(79,70,229,0.1)" : "transparent" }}
              >
                <Text style={{ fontSize: 14, color: z === zone ? C.accent : C.text }}>{z}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
