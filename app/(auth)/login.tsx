import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView,
  Text, TextInput, TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { forgotPassword, resetPassword } from "../../services/auth.mock";
import { C, S } from "../../theme";

export default function LoginScreen() {
  const { isLogged, loading, login } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ rut?: string }>();

  const [rut,        setRut]        = useState(params.rut ?? "");
  const [pass,       setPass]       = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");
  const [showForgot, setShowForgot] = useState(false);
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
    } catch (e: any) {
      setError(e?.message ?? "RUT o contraseña inválidos. Intenta nuevamente.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <View style={[S.screen, { alignItems: "center", justifyContent: "center" }]}>
      <ActivityIndicator color={C.accent} size="large" />
    </View>
  );

  if (showForgot) return <ForgotPasswordScreen onBack={() => setShowForgot(false)} />;

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
          onPress={() => setShowForgot(true)}
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

        {/* Divider */}
        <View style={S.divider}>
          <View style={S.dividerLine} />
          <Text style={S.dividerText}>o continúa con</Text>
          <View style={S.dividerLine} />
        </View>

        {/* WhatsApp */}
        <TouchableOpacity style={S.btnGhost}>
          <View style={{ width: 16, height: 16, backgroundColor: "#25d366", borderRadius: 8 }} />
          <Text style={S.btnGhostText}>Continuar con WhatsApp</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Recuperar contraseña (mock) ───────────────────────────────────────────────
function ForgotPasswordScreen({ onBack }: { onBack: () => void }) {
  const [step,      setStep]      = useState<1 | 2 | 3 | "done">(1);
  const [tel,       setTel]       = useState("");
  const [otp,       setOtp]       = useState("");
  const [pass,      setPass]      = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [countdown, setCountdown] = useState(60);

  const sendOtp = async () => {
    setError("");
    if (!tel) { setError("Ingresa tu teléfono"); return; }
    setLoading(true);
    try {
      await forgotPassword(tel);
      setStep(2);
      let s = 60; setCountdown(60);
      const t = setInterval(() => { s--; setCountdown(s); if (s <= 0) clearInterval(t); }, 1000);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const verifyOtp = () => {
    setError("");
    if (otp !== "123456") { setError("Código incorrecto (usa 123456 en modo dev)"); return; }
    setStep(3);
  };

  const resetPass = async () => {
    setError("");
    if (pass.length < 8) { setError("Mínimo 8 caracteres"); return; }
    setLoading(true);
    try { await resetPassword(tel, pass); setStep("done"); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <ScrollView style={S.screen} contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 28 }}>
      <TouchableOpacity style={[S.backBtn, { marginBottom: 24, alignSelf: "flex-start" }]} onPress={onBack}>
        <Text style={S.backBtnText}>←</Text>
      </TouchableOpacity>

      {step === 1 && (
        <>
          <Text style={{ fontSize: 48, textAlign: "center", marginBottom: 12 }}>📲</Text>
          <Text style={{ fontSize: 22, fontWeight: "700", color: C.text, textAlign: "center", marginBottom: 8 }}>
            ¿Olvidaste tu contraseña?
          </Text>
          <Text style={{ fontSize: 13, color: C.text2, textAlign: "center", marginBottom: 24 }}>
            Te enviamos un código por WhatsApp.
          </Text>
          {error ? <View style={S.error}><Text style={S.errorText}>⚠️ {error}</Text></View> : null}
          <Text style={S.label}>Teléfono</Text>
          <TextInput style={[S.input, { marginBottom: 14 }]} placeholder="+56 9 1234 5678"
            placeholderTextColor={C.text2} value={tel} onChangeText={setTel} keyboardType="phone-pad" />
          <TouchableOpacity style={[S.btn, loading && S.btnDisabled]} onPress={sendOtp} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={S.btnText}>Enviar código</Text>}
          </TouchableOpacity>
        </>
      )}

      {step === 2 && (
        <>
          <Text style={{ fontSize: 48, textAlign: "center", marginBottom: 12 }}>🔑</Text>
          <Text style={{ fontSize: 22, fontWeight: "700", color: C.text, textAlign: "center", marginBottom: 8 }}>
            Código enviado
          </Text>
          <View style={{ backgroundColor: "rgba(245,158,11,0.08)", borderWidth: 1, borderColor: "rgba(245,158,11,0.3)", borderRadius: 10, padding: 12, marginBottom: 16 }}>
            <Text style={{ fontSize: 12, color: "#fcd34d" }}>🧪 Dev: usa 123456</Text>
          </View>
          {error ? <View style={S.error}><Text style={S.errorText}>⚠️ {error}</Text></View> : null}
          <TextInput style={[S.input, { marginBottom: 8, fontSize: 28, textAlign: "center", letterSpacing: 8, fontWeight: "700" }]}
            maxLength={6} placeholder="000000" placeholderTextColor={C.text2}
            value={otp} onChangeText={(v) => setOtp(v.replace(/\D/g, ""))} keyboardType="numeric" />
          <Text style={{ fontSize: 12, color: C.text2, textAlign: "center", marginBottom: 16 }}>
            {countdown > 0 ? `Reenviar en ${countdown}s` : ""}
          </Text>
          {countdown === 0 && (
            <TouchableOpacity onPress={sendOtp}>
              <Text style={{ fontSize: 12, color: C.accent, textAlign: "center", marginBottom: 16 }}>Reenviar código</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={S.btn} onPress={verifyOtp}>
            <Text style={S.btnText}>Verificar código</Text>
          </TouchableOpacity>
        </>
      )}

      {step === 3 && (
        <>
          <Text style={{ fontSize: 48, textAlign: "center", marginBottom: 12 }}>🔒</Text>
          <Text style={{ fontSize: 22, fontWeight: "700", color: C.text, textAlign: "center", marginBottom: 24 }}>Nueva contraseña</Text>
          {error ? <View style={S.error}><Text style={S.errorText}>⚠️ {error}</Text></View> : null}
          <Text style={S.label}>Nueva contraseña</Text>
          <TextInput style={[S.input, { marginBottom: 14 }]} placeholder="Mínimo 8 caracteres"
            placeholderTextColor={C.text2} value={pass} onChangeText={setPass} secureTextEntry />
          <TouchableOpacity style={[S.btn, loading && S.btnDisabled]} onPress={resetPass} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={S.btnText}>Guardar contraseña</Text>}
          </TouchableOpacity>
        </>
      )}

      {step === "done" && (
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 64, marginBottom: 16 }}>✅</Text>
          <Text style={{ fontSize: 22, fontWeight: "700", color: C.text, marginBottom: 8 }}>¡Listo!</Text>
          <Text style={{ fontSize: 13, color: C.text2, marginBottom: 24, textAlign: "center" }}>
            Ya puedes iniciar sesión con tu nueva contraseña.
          </Text>
          <TouchableOpacity style={S.btn} onPress={onBack}>
            <Text style={S.btnText}>Ir al login</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}
