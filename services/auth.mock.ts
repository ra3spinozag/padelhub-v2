// Mock-only helpers kept for the ForgotPassword flow (no real endpoint yet)

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Minimal local store for the forgot-password dev flow
const _mockPhones = new Set(["+56987654321"]);

// ── HU-005: Recuperar contraseña (mock) ───────────────────────────────────────
export async function forgotPassword(phone: string): Promise<void> {
  await delay(1200);
  if (!_mockPhones.has(phone)) {
    throw new Error("No existe una cuenta con ese número");
  }
  console.log(`[MOCK] OTP enviado a ${phone}: 123456`);
}

export async function resetPassword(
  _phone: string,
  _newPassword: string
): Promise<void> {
  await delay(800);
}
