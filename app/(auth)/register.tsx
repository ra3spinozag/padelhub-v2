import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator, KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text, TextInput, TouchableOpacity,
  View,
} from "react-native";
import { signUpUser } from "../../services/auth.service";
import { C, S } from "../../theme";

const ZONAS = [
  "Valparaíso", "Viña del Mar", "Quilpué", "Concón",
  "Santiago", "Concepción", "Temuco", "La Serena",
  "Antofagasta", "Iquique", "Puerto Montt", "Otra",
];

export default function RegisterScreen() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "", rut: "", dv_rut: "", phone: "", zone: "", password: "",
  });
  const [showZonas,  setShowZonas]  = useState(false);
  const [submitting, setSub]        = useState(false);
  const [error,      setError]      = useState("");

  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    setError("");
    if (!form.name.trim())            { setError("Ingresa tu nombre completo."); return; }
    if (!form.rut.trim() || isNaN(Number(form.rut))) { setError("Ingresa un RUT válido (solo números)."); return; }
    if (!form.dv_rut.trim())          { setError("Ingresa el dígito verificador del RUT."); return; }
    if (!form.phone.trim())           { setError("Ingresa tu número de teléfono."); return; }
    if (!form.zone)                   { setError("Selecciona tu zona."); return; }
    if (form.password.length < 8)     { setError("La contraseña debe tener al menos 8 caracteres."); return; }

    setSub(true);
    try {
      await signUpUser({
        rut:    Number(form.rut),
        dv_rut: form.dv_rut.trim().toUpperCase(),
        name:   form.name.trim(),
        phone:  form.phone.trim(),
        zone:   form.zone,
        password: form.password,
      });
      router.replace({ pathname: "/(auth)/login", params: { rut: form.rut } });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSub(false);
    }
  };

  return (
    <KeyboardAvoidingView style={S.screen} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 28 }} keyboardShouldPersistTaps="handled">

        {/* Logo */}
        <View style={{ alignItems: "center", marginBottom: 36 }}>
          <View style={{ width: 72, height: 72, backgroundColor: C.accent, borderRadius: 22, alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
            <Text style={{ fontSize: 32, fontWeight: "800", color: "#fff" }}>H</Text>
          </View>
          <Text style={{ fontSize: 28, fontWeight: "800", color: C.text }}>PadelHub</Text>
          <Text style={{ fontSize: 13, color: C.text2, marginTop: 4 }}>Encuentra tu próximo partido</Text>
        </View>

        {/* Tabs */}
        <View style={{ flexDirection: "row", backgroundColor: C.bg3, borderRadius: 14, padding: 4, marginBottom: 20, borderWidth: 1, borderColor: C.border }}>
          <TouchableOpacity style={{ flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: "center" }} onPress={() => router.push("/(auth)/login")}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: C.text2 }}>Iniciar sesión</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, paddingVertical: 9, borderRadius: 10, backgroundColor: C.accent, alignItems: "center" }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: "#fff" }}>Registrarse</Text>
          </View>
        </View>

        {/* Error */}
        {error ? <View style={S.error}><Text style={S.errorText}>⚠️ {error}</Text></View> : null}

        {/* Nombre */}
        <View style={S.inputGroup}>
          <Text style={S.label}>Nombre completo</Text>
          <TextInput style={S.input} placeholder="Tu nombre" placeholderTextColor={C.text2}
            value={form.name} onChangeText={(v) => set("name", v)} autoComplete="name" />
        </View>

        {/* RUT */}
        <View style={S.inputGroup}>
          <Text style={S.label}>RUT</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TextInput
              style={[S.input, { flex: 1 }]}
              placeholder="12345678"
              placeholderTextColor={C.text2}
              value={form.rut}
              onChangeText={(v) => set("rut", v.replace(/\D/g, ""))}
              keyboardType="number-pad"
              maxLength={8}
            />
            <View style={{ justifyContent: "center", paddingHorizontal: 4 }}>
              <Text style={{ color: C.text2, fontSize: 18 }}>–</Text>
            </View>
            <TextInput
              style={[S.input, { width: 52, textAlign: "center" }]}
              placeholder="K"
              placeholderTextColor={C.text2}
              value={form.dv_rut}
              onChangeText={(v) => set("dv_rut", v.replace(/[^0-9kK]/g, "").slice(0, 1))}
              autoCapitalize="characters"
              maxLength={1}
            />
          </View>
        </View>

        {/* Teléfono */}
        <View style={S.inputGroup}>
          <Text style={S.label}>Teléfono</Text>
          <TextInput style={S.input} placeholder="+56 9 1234 5678" placeholderTextColor={C.text2}
            value={form.phone} onChangeText={(v) => set("phone", v)} keyboardType="phone-pad" />
        </View>

        {/* Zona */}
        <View style={S.inputGroup}>
          <Text style={S.label}>Zona</Text>
          <TouchableOpacity
            style={[S.input, { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }]}
            onPress={() => setShowZonas(true)}
          >
            <Text style={{ fontSize: 14, color: form.zone ? C.text : C.text2 }}>
              {form.zone || "Selecciona tu zona"}
            </Text>
            <Text style={{ color: C.text2 }}>▾</Text>
          </TouchableOpacity>
        </View>

        {/* Contraseña */}
        <View style={S.inputGroup}>
          <Text style={S.label}>Contraseña</Text>
          <TextInput style={S.input} placeholder="Mínimo 8 caracteres" placeholderTextColor={C.text2}
            value={form.password} onChangeText={(v) => set("password", v)} secureTextEntry />
        </View>

        <TouchableOpacity style={[S.btn, { marginTop: 4 }, submitting && S.btnDisabled]} onPress={handleSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={S.btnText}>Crear cuenta</Text>}
        </TouchableOpacity>

        {/* Divider + WhatsApp */}
        <View style={S.divider}>
          <View style={S.dividerLine} />
          <Text style={S.dividerText}>o continúa con</Text>
          <View style={S.dividerLine} />
        </View>
        <TouchableOpacity style={S.btnGhost}>
          <View style={{ width: 16, height: 16, backgroundColor: "#25d366", borderRadius: 8 }} />
          <Text style={S.btnGhostText}>Continuar con WhatsApp</Text>
        </TouchableOpacity>

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
                onPress={() => { set("zone", z); setShowZonas(false); }}
                style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: z === form.zone ? "rgba(79,70,229,0.1)" : "transparent" }}
              >
                <Text style={{ fontSize: 14, color: z === form.zone ? C.accent : C.text }}>{z}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

    </KeyboardAvoidingView>
  );
}
