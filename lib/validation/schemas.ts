import { z } from "zod";
import { isValidRut, normalizeRut } from "./rut";
import { isValidChilePhone, normalizePhone } from "./phone";

const rutSchema = z
  .string()
  .min(1, "El RUT es obligatorio")
  .refine(isValidRut, "RUT inválido (verifique formato y dígito verificador)");

const phoneSchema = z
  .string()
  .min(1, "El teléfono es obligatorio")
  .refine(
    isValidChilePhone,
    "El teléfono debe tener 9 dígitos numéricos (ej: 987654321)"
  );

export const reservationFormSchema = z.object({
  patientRut: rutSchema,
  patientName: z.string().min(1, "El nombre es obligatorio").trim(),
  patientEmail: z.string().min(1, "El correo es obligatorio").email("Correo electrónico inválido"),
  patientPhone: phoneSchema,
  notes: z.string().optional(),
  professionalNotes: z.string().optional(),
});

export type ReservationFormData = z.infer<typeof reservationFormSchema>;

export const patientFormSchema = z.object({
  rut: rutSchema,
  name: z.string().min(1, "El nombre es obligatorio").trim(),
  email: z.string().min(1, "El correo es obligatorio").email("Correo electrónico inválido"),
  phone: phoneSchema,
});

export type PatientFormData = z.infer<typeof patientFormSchema>;

/** Helpers para transformar a valores normalizados al validar */
export function getNormalizedRut(rut: string): string {
  return normalizeRut(rut);
}

export function getNormalizedPhone(phone: string): string {
  return normalizePhone(phone);
}
