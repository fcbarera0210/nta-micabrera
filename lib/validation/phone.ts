/**
 * Validación de teléfono chileno: 9 dígitos numéricos (sin espacios ni guiones).
 * Formato: 987654321
 */

const CHILE_PHONE_LENGTH = 9;

/**
 * Normaliza el teléfono quitando espacios y guiones. Solo dígitos.
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

/**
 * Valida que el teléfono sea exactamente 9 caracteres numéricos.
 */
export function isValidChilePhone(phone: string): boolean {
  const digits = normalizePhone(phone);
  return digits.length === CHILE_PHONE_LENGTH && /^\d{9}$/.test(digits);
}
