/**
 * Validación y normalización de RUT chileno (algoritmo módulo 11).
 * Formato aceptado: 12.345.678-9 o 12345678-9
 */

/**
 * Normaliza el RUT quitando puntos y guión. Retorna solo dígitos + dígito verificador.
 * Ej: "12.345.678-K" -> "12345678k"
 */
export function normalizeRut(rut: string): string {
  const cleaned = rut.trim().toLowerCase().replace(/\./g, "").replace(/-/g, "");
  if (!cleaned) return "";
  const body = cleaned.slice(0, -1).replace(/\D/g, "");
  const dv = cleaned.slice(-1);
  if (dv !== "k" && dv !== "0" && !/^[1-9]$/.test(dv)) return "";
  return body + dv;
}

/**
 * Calcula el dígito verificador para el cuerpo del RUT (solo números).
 */
function calculateDv(body: string): string {
  let sum = 0;
  let mul = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]!, 10) * mul;
    mul = mul === 7 ? 2 : mul + 1;
  }
  const rest = 11 - (sum % 11);
  if (rest === 11) return "0";
  if (rest === 10) return "k";
  return String(rest);
}

/**
 * Valida que el RUT tenga formato y dígito verificador correcto (módulo 11).
 */
export function isValidRut(rut: string): boolean {
  const normalized = normalizeRut(rut);
  if (normalized.length < 2) return false;
  const body = normalized.slice(0, -1);
  const dv = normalized.slice(-1);
  if (!/^\d+$/.test(body)) return false;
  return calculateDv(body) === dv;
}

/**
 * Formatea el RUT con puntos y guión para mostrar en UI.
 * Ej: "12345678k" -> "12.345.678-K"
 */
export function formatRut(rut: string): string {
  const normalized = normalizeRut(rut);
  if (normalized.length < 2) return rut;
  const body = normalized.slice(0, -1);
  const dv = normalized.slice(-1).toUpperCase();
  const withDots = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${withDots}-${dv}`;
}
