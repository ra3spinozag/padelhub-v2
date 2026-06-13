import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView,
  Text, TextInput, TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { ApiError } from "../../services/api";
import { C, S } from "../../theme";

function loginErrorMsg(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.status === 401 || e.status === 400) return "RUT o contraseña incorrectos.";
    if (e.status === 404) return "No existe una cuenta con ese RUT.";
    if (e.status >= 500)  return "Error del servidor. Intenta más tarde.";
    return e.message;
  }
  if (e instanceof TypeError) return "Sin conexión. Verifica tu red.";
  return "Ocurrió un error inesperado. Intenta de nuevo.";
}

export default function LoginScreen() {
  const { isLogged, loading, login } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ rut?: string }>();

  const [rut,        setRut]        = useState(params.rut ?? "");
  const [pass,       setPass]       = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");
  const [rutFocused, setRutFocused] = useState(false);
  const [passFocused,setPassFocused]= useState(false);

  useEffect(() => {
    if (isLogged) router.replace("/(app)/home");
  }, [isLogged]);

  const handleSubmit = async () => {
    setError("");
    const rutNum = Number(rut.trim());
    if (!rut.trim() || isNaN(rutNum) || rutNum <= 0) {
      setError("Ingresa un RUT válido (solo números, sin dígito verificador).");
      return;
    }
    setSubmitting(true);
    try {
      await login(rutNum, pass);
    } catch (e) {
      setError(loginErrorMsg(e));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <View style={[S.screen, { alignItems: "center", justifyContent: "center" }]}>
      <ActivityIndicator color={C.accent} size="large" />
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={S.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 28 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={{ alignItems: "center", marginBottom: 36 }}>
          <View style={{
            width: 72, height: 72, backgroundColor: C.accent, borderRadius: 22,
            alignItems: "center", justifyContent: "center", marginBottom: 14,
          }}>
            <Text style={{ fontSize: 32, fontWeight: "800", color: "#fff" }}>H</Text>
          </View>
          <Text style={{ fontSize: 28, fontWeight: "800", color: C.text }}>PadelHub</Text>
          <Text style={{ fontSize: 13, color: C.text2, marginTop: 4 }}>
            Encuentra tu próximo partido
          </Text>
        </View>

        {/* Tabs */}
        <View style={{
          flexDirection: "row", backgroundColor: C.bg3, borderRadius: 14,
          padding: 4, marginBottom: 20, borderWidth: 1, borderColor: C.border,
        }}>
          <View style={{
            flex: 1, paddingVertical: 9, borderRadius: 10,
            backgroundColor: C.accent, alignItems: "center",
          }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: "#fff" }}>Iniciar sesión</Text>
          </View>
          <TouchableOpacity
            style={{ flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: "center" }}
            onPress={() => router.push("/(auth)/register")}
          >
            <Text style={{ fontSize: 13, fontWeight: "600", color: C.text2 }}>Registrarse</Text>
          </TouchableOpacity>
        </View>

        {/* Error */}
        {error ? (
          <View style={S.error}>
            <Text style={S.errorText}>⚠️ {error}</Text>
          </View>
        ) : null}

        {/* RUT */}
        <View style={S.inputGroup}>
          <Text style={S.label}>RUT (sin dígito verificador)</Text>
          <TextInput
            style={[S.input, rutFocused && S.inputFocused]}
            placeholder="12345678"
            placeholderTextColor={C.text2}
            value={rut}
            onChangeText={(v) => setRut(v.replace(/\D/g, ""))}
            keyboardType="number-pad"
            maxLength={8}
            onFocus={() => setRutFocused(true)}
            onBlur={() => setRutFocused(false)}
          />
        </View>

        {/* Contraseña */}
        <View style={S.inputGroup}>
          <Text style={S.label}>Contraseña</Text>
          <TextInput
            style={[S.input, passFocused && S.inputFocused]}
            placeholder="••••••••"
            placeholderTextColor={C.text2}
            value={pass}
            onChangeText={setPass}
            secureTextEntry
            autoComplete="password"
            onFocus={() => setPassFocused(true)}
            onBlur={() => setPassFocused(false)}
          />
        </View>

        {/* ¿Olvidaste? */}
        <TouchableOpacity
          onPress={() => router.push("/(auth)/forgotpassword" as any)}
          style={{ alignSelf: "flex-end", marginBottom: 16 }}
        >
          <Text style={{ fontSize: 12, color: C.accent }}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>

        {/* Botón entrar */}
        <TouchableOpacity
          style={[S.btn, submitting && S.btnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={S.btnText}>Entrar</Text>}
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}
