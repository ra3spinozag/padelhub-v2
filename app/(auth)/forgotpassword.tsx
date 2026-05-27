import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text, TextInput, TouchableOpacity,
  View,
} from "react-native";
import { resetPasswordWithOtp, sendSmsOtp, verifyOtp } from "../../services/passwordreset";
import { C, S } from "../../theme";

type Step = "rut" | "otp" | "newpass" | "done";

const OTP_COUNTDOWN = 60;

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("rut");

  // Paso 1
  const [rut,        setRut]        = useState("");
  const [rutFocused, setRutFocused] = useState(false);

  // Paso 2
  const [otp,       setOtp]       = useState("");
  const [countdown, setCountdown] = useState(OTP_COUNTDOWN);
  const otpRef = useRef<TextInput>(null);

  // Paso 3
  const [newPass,     setNewPass]     = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passFocused, setPassFocused] = useState(false);
  const [confFocused, setConfFocused] = useState(false);

  // Estado compartido
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  // Countdown para reenviar OTP
  useEffect(() => {
    if (step !== "otp") return;
    setCountdown(OTP_COUNTDOWN);
    const id = setInterval(() => {
      setCountdown((s) => {
        if (s <= 1) { clearInterval(id); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [step]);

  // Auto-focus al campo OTP
  useEffect(() => {
    if (step === "otp") setTimeout(() => otpRef.current?.focus(), 300);
  }, [step]);

  const clearError = () => setError("");

  const rutNum = () => Number(rut.trim());

  // ── Paso 1: Enviar OTP ────────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    clearError();
    const n = rutNum();
    if (!rut.trim() || isNaN(n) || n <= 0) {
      setError("Ingresa un RUT válido (solo números, sin dígito verificador).");
      return;
    }
    setLoading(true);
    try {
      await sendSmsOtp(n);
      setOtp("");
      setStep("otp");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Paso 2: Verificar OTP ─────────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    clearError();
    if (otp.length !== 6) { setError("El código debe tener 6 dígitos."); return; }
    setLoading(true);
    try {
      await verifyOtp(rutNum(), otp);
      setNewPass("");
      setConfirmPass("");
      setStep("newpass");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Paso 3: Nueva contraseña ──────────────────────────────────────────────────
  const handleResetPassword = async () => {
    clearError();
    if (newPass.length < 8) { setError("La contraseña debe tener al menos 8 caracteres."); return; }
    if (newPass !== confirmPass) { setError("Las contraseñas no coinciden."); return; }
    setLoading(true);
    try {
      await resetPasswordWithOtp(newPass);
      setStep("done");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Reenviar OTP ──────────────────────────────────────────────────────────────
  const handleResend = async () => {
    clearError();
    setLoading(true);
    try {
      await sendSmsOtp(rutNum());
      setOtp("");
      setCountdown(OTP_COUNTDOWN);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const ErrorBox = ({ msg }: { msg: string }) =>
    msg ? (
      <View style={[S.error, { marginBottom: 16 }]}>
        <Text style={S.errorText}>⚠️ {msg}</Text>
      </View>
    ) : null;

  return (
    <KeyboardAvoidingView
      style={S.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 28, paddingTop: 56 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Botón volver */}
        {step !== "done" && (
          <TouchableOpacity
            style={[S.backBtn, { marginBottom: 28 }]}
            onPress={() => {
              if (step === "rut")     router.canGoBack() ? router.back() : router.replace("/(auth)/login");
              else if (step === "otp")     setStep("rut");
              else if (step === "newpass") setStep("otp");
            }}
          >
            <Text style={S.backBtnText}>←</Text>
          </TouchableOpacity>
        )}

        {/* ── Paso 1: RUT ───────────────────────────────────────────────────── */}
        {step === "rut" && (
          <>
            <View style={{ alignItems: "center", marginBottom: 28 }}>
              <View style={{
                width: 72, height: 72, borderRadius: 22,
                backgroundColor: "rgba(79,70,229,0.15)",
                borderWidth: 1, borderColor: C.border2,
                alignItems: "center", justifyContent: "center", marginBottom: 16,
              }}>
                <Text style={{ fontSize: 36 }}>📱</Text>
              </View>
              <Text style={{ fontSize: 22, fontWeight: "800", color: C.text, marginBottom: 6 }}>
                Recuperar contraseña
              </Text>
              <Text style={{ fontSize: 13, color: C.text2, textAlign: "center", lineHeight: 20 }}>
                Ingresa tu RUT y te enviaremos{"\n"}un código por SMS.
              </Text>
            </View>

            <ErrorBox msg={error} />

            <View style={S.inputGroup}>
              <Text style={S.label}>RUT (sin dígito verificador)</Text>
              <TextInput
                style={[S.input, rutFocused && S.inputFocused]}
                placeholder="12345678"
                placeholderTextColor={C.text2}
                value={rut}
                onChangeText={(v) => { setRut(v.replace(/\D/g, "")); clearError(); }}
                keyboardType="number-pad"
                maxLength={8}
                onFocus={() => setRutFocused(true)}
                onBlur={() => setRutFocused(false)}
              />
            </View>

            <View style={{
              backgroundColor: "rgba(79,70,229,0.06)",
              borderWidth: 1, borderColor: C.border2,
              borderRadius: 10, padding: 12, marginBottom: 20,
              flexDirection: "row", gap: 8, alignItems: "flex-start",
            }}>
              <Text style={{ fontSize: 14 }}>💬</Text>
              <Text style={{ fontSize: 12, color: "#a5b4fc", flex: 1, lineHeight: 18 }}>
                El código se enviará al número registrado en tu cuenta. Expira en 10 minutos.
              </Text>
            </View>

            <TouchableOpacity
              style={[S.btn, loading && S.btnDisabled]}
              onPress={handleSendOtp}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={S.btnText}>Enviar código por SMS</Text>}
            </TouchableOpacity>
          </>
        )}

        {/* ── Paso 2: OTP ───────────────────────────────────────────────────── */}
        {step === "otp" && (
          <>
            <View style={{ alignItems: "center", marginBottom: 28 }}>
              <View style={{
                width: 72, height: 72, borderRadius: 22,
                backgroundColor: "rgba(79,70,229,0.15)",
                borderWidth: 1, borderColor: C.border2,
                alignItems: "center", justifyContent: "center", marginBottom: 16,
              }}>
                <Text style={{ fontSize: 36 }}>🔑</Text>
              </View>
              <Text style={{ fontSize: 22, fontWeight: "800", color: C.text, marginBottom: 6 }}>
                Código enviado
              </Text>
              <Text style={{ fontSize: 13, color: C.text2, textAlign: "center", lineHeight: 20 }}>
                Revisa los SMS del número{"\n"}registrado en tu cuenta.
              </Text>
            </View>

            <ErrorBox msg={error} />

            <View style={S.inputGroup}>
              <Text style={S.label}>Código de verificación</Text>
              <TextInput
                ref={otpRef}
                style={[S.input, {
                  fontSize: 32, textAlign: "center",
                  letterSpacing: 12, fontWeight: "700", paddingVertical: 16,
                }]}
                placeholder="• • • • • •"
                placeholderTextColor={C.text2}
                value={otp}
                onChangeText={(v) => { setOtp(v.replace(/\D/g, "").slice(0, 6)); clearError(); }}
                keyboardType="numeric"
                maxLength={6}
              />
            </View>

            <View style={{ alignItems: "center", marginBottom: 20 }}>
              {countdown > 0 ? (
                <Text style={{ fontSize: 13, color: C.text2 }}>
                  Reenviar código en{" "}
                  <Text style={{ color: C.text, fontWeight: "600" }}>{countdown}s</Text>
                </Text>
              ) : (
                <TouchableOpacity onPress={handleResend} disabled={loading}>
                  <Text style={{ fontSize: 13, color: C.accent, fontWeight: "600" }}>
                    ¿No llegó? Reenviar SMS
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={[S.btn, (loading || otp.length !== 6) && S.btnDisabled]}
              onPress={handleVerifyOtp}
              disabled={loading || otp.length !== 6}
            >
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={S.btnText}>Verificar código</Text>}
            </TouchableOpacity>
          </>
        )}

        {/* ── Paso 3: Nueva contraseña ──────────────────────────────────────── */}
        {step === "newpass" && (
          <>
            <View style={{ alignItems: "center", marginBottom: 28 }}>
              <View style={{
                width: 72, height: 72, borderRadius: 22,
                backgroundColor: "rgba(79,70,229,0.15)",
                borderWidth: 1, borderColor: C.border2,
                alignItems: "center", justifyContent: "center", marginBottom: 16,
              }}>
                <Text style={{ fontSize: 36 }}>🔒</Text>
              </View>
              <Text style={{ fontSize: 22, fontWeight: "800", color: C.text, marginBottom: 6 }}>
                Nueva contraseña
              </Text>
              <Text style={{ fontSize: 13, color: C.text2, textAlign: "center" }}>
                Elige una contraseña segura de al menos 8 caracteres.
              </Text>
            </View>

            <ErrorBox msg={error} />

            <View style={S.inputGroup}>
              <Text style={S.label}>Nueva contraseña</Text>
              <View style={{ position: "relative" }}>
                <TextInput
                  style={[S.input, passFocused && S.inputFocused, { paddingRight: 48 }]}
                  placeholder="Mínimo 8 caracteres"
                  placeholderTextColor={C.text2}
                  value={newPass}
                  onChangeText={(v) => { setNewPass(v); clearError(); }}
                  secureTextEntry={!showPass}
                  onFocus={() => setPassFocused(true)}
                  onBlur={() => setPassFocused(false)}
                />
                <TouchableOpacity
                  onPress={() => setShowPass((p) => !p)}
                  style={{ position: "absolute", right: 14, top: 0, bottom: 0, justifyContent: "center" }}
                >
                  <Text style={{ fontSize: 16, color: C.text2 }}>{showPass ? "🙈" : "👁"}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={S.inputGroup}>
              <Text style={S.label}>Confirmar contraseña</Text>
              <View style={{ position: "relative" }}>
                <TextInput
                  style={[S.input, confFocused && S.inputFocused, { paddingRight: 48 }]}
                  placeholder="Repite tu contraseña"
                  placeholderTextColor={C.text2}
                  value={confirmPass}
                  onChangeText={(v) => { setConfirmPass(v); clearError(); }}
                  secureTextEntry={!showConfirm}
                  onFocus={() => setConfFocused(true)}
                  onBlur={() => setConfFocused(false)}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirm((p) => !p)}
                  style={{ position: "absolute", right: 14, top: 0, bottom: 0, justifyContent: "center" }}
                >
                  <Text style={{ fontSize: 16, color: C.text2 }}>{showConfirm ? "🙈" : "👁"}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Indicador de fortaleza */}
            {newPass.length > 0 && (
              <View style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: "row", gap: 4, marginBottom: 4 }}>
                  {[8, 12, 16].map((threshold, i) => (
                    <View key={i} style={{
                      flex: 1, height: 3, borderRadius: 2,
                      backgroundColor: newPass.length >= threshold
                        ? i === 0 ? C.red : i === 1 ? C.gold : C.green
                        : C.border,
                    }} />
                  ))}
                </View>
                <Text style={{ fontSize: 11, color: C.text2 }}>
                  {newPass.length < 8 ? "Muy corta" : newPass.length < 12 ? "Aceptable" : newPass.length < 16 ? "Buena" : "Excelente"}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[S.btn, loading && S.btnDisabled]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={S.btnText}>Guardar nueva contraseña</Text>}
            </TouchableOpacity>
          </>
        )}

        {/* ── Done ──────────────────────────────────────────────────────────── */}
        {step === "done" && (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 72, marginBottom: 20 }}>✅</Text>
            <Text style={{ fontSize: 24, fontWeight: "800", color: C.text, marginBottom: 8 }}>
              ¡Contraseña actualizada!
            </Text>
            <Text style={{ fontSize: 14, color: C.text2, textAlign: "center", lineHeight: 22, marginBottom: 32 }}>
              Ya puedes iniciar sesión con tu nueva contraseña.
            </Text>
            <TouchableOpacity
              style={[S.btn, { paddingHorizontal: 32 }]}
              onPress={() => router.replace("/(auth)/login")}
            >
              <Text style={S.btnText}>Ir al inicio de sesión</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
