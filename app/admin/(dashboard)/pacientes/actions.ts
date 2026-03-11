"use server";

import { unstable_noStore } from "next/cache";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  patients,
  patientDataHistory,
  type Patient,
  type PatientDataHistoryRecord,
} from "@/lib/db/schema";
import { eq, asc, desc } from "drizzle-orm";
import { isValidRut, normalizeRut } from "@/lib/validation/rut";
import { isValidChilePhone, normalizePhone } from "@/lib/validation/phone";

export interface PatientWithReservationCount extends Patient {
  reservationCount: number;
}

export async function listPatients(filters?: {
  search?: string;
}): Promise<PatientWithReservationCount[]> {
  unstable_noStore();
  const all = await db.query.patients.findMany({
    orderBy: [asc(patients.name)],
    with: {
      reservations: true,
    },
  });
  let result: PatientWithReservationCount[] = all.map((p) => {
    const { reservations, ...patient } = p;
    return {
      ...patient,
      reservationCount: reservations?.length ?? 0,
    };
  });
  const search = filters?.search?.trim();
  if (search) {
    const term = `%${search}%`;
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.email.toLowerCase().includes(search.toLowerCase()) ||
        p.rut.includes(normalizeRut(search)) ||
        p.rut.toLowerCase().includes(search.toLowerCase()) ||
        p.phone.includes(search.replace(/\D/g, ""))
    );
  }
  return result;
}

export async function getPatientById(id: number): Promise<Patient | null> {
  unstable_noStore();
  const p = await db.query.patients.findFirst({
    where: eq(patients.id, id),
  });
  return p ?? null;
}

export interface PatientInput {
  rut: string;
  name: string;
  email: string;
  phone: string;
  /** Datos nutrición (opcionales) */
  weightKg?: number | null;
  heightCm?: number | null;
  imc?: number | null;
  birthDate?: string | null;
  gender?: string | null;
  medicalHistory?: string | null;
  nutritionGoals?: string | null;
  activityLevel?: string | null;
  clinicalNotes?: string | null;
}

function validatePatientInput(input: PatientInput): string | null {
  if (!input.rut.trim()) return "El RUT es obligatorio.";
  if (!isValidRut(input.rut)) return "RUT inválido (verifique formato y dígito verificador).";
  if (!input.name.trim()) return "El nombre es obligatorio.";
  if (!input.email.trim()) return "El correo es obligatorio.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) return "Correo electrónico inválido.";
  if (!input.phone.trim()) return "El teléfono es obligatorio.";
  if (!isValidChilePhone(input.phone)) return "El teléfono debe tener 9 dígitos numéricos (ej: 987654321).";
  return null;
}

export async function createPatient(
  input: PatientInput
): Promise<{ success: boolean; error?: string }> {
  const err = validatePatientInput(input);
  if (err) return { success: false, error: err };
  const normalizedRut = normalizeRut(input.rut);
  const normalizedPhone = normalizePhone(input.phone);
  const existing = await db.query.patients.findFirst({
    where: eq(patients.rut, normalizedRut),
  });
  if (existing) {
    return {
      success: false,
      error: "Ya existe un paciente con ese RUT. Use ese paciente al agendar.",
    };
  }
  const hasNutritionData =
    input.weightKg != null ||
    input.heightCm != null ||
    input.imc != null ||
    (input.birthDate?.trim() ?? "") !== "" ||
    (input.gender?.trim() ?? "") !== "" ||
    (input.medicalHistory?.trim() ?? "") !== "" ||
    (input.nutritionGoals?.trim() ?? "") !== "" ||
    (input.activityLevel?.trim() ?? "") !== "" ||
    (input.clinicalNotes?.trim() ?? "") !== "";

  try {
    const [inserted] = await db
      .insert(patients)
      .values({
        rut: normalizedRut,
        name: input.name.trim(),
        email: input.email.trim(),
        phone: normalizedPhone,
        weightKg: input.weightKg ?? null,
        heightCm: input.heightCm ?? null,
        imc: input.imc ?? null,
        birthDate: input.birthDate?.trim() || null,
        gender: input.gender?.trim() || null,
        medicalHistory: input.medicalHistory?.trim() || null,
        nutritionGoals: input.nutritionGoals?.trim() || null,
        activityLevel: input.activityLevel?.trim() || null,
        clinicalNotes: input.clinicalNotes?.trim() || null,
      })
      .returning({ id: patients.id });

    if (inserted && hasNutritionData) {
      await db.insert(patientDataHistory).values({
        patientId: inserted.id,
        weightKg: input.weightKg ?? null,
        heightCm: input.heightCm ?? null,
        imc: input.imc ?? null,
        birthDate: input.birthDate?.trim() || null,
        gender: input.gender?.trim() || null,
        medicalHistory: input.medicalHistory?.trim() || null,
        nutritionGoals: input.nutritionGoals?.trim() || null,
        activityLevel: input.activityLevel?.trim() || null,
        clinicalNotes: input.clinicalNotes?.trim() || null,
      });
    }
    revalidatePath("/admin/pacientes");
    return { success: true };
  } catch {
    return { success: false, error: "Error al crear el paciente." };
  }
}

export async function updatePatient(
  id: number,
  input: PatientInput
): Promise<{ success: boolean; error?: string }> {
  const err = validatePatientInput(input);
  if (err) return { success: false, error: err };
  const normalizedRut = normalizeRut(input.rut);
  const normalizedPhone = normalizePhone(input.phone);
  const existing = await db.query.patients.findFirst({
    where: eq(patients.id, id),
  });
  if (!existing) return { success: false, error: "Paciente no encontrado." };
  const duplicateRut = await db.query.patients.findFirst({
    where: eq(patients.rut, normalizedRut),
  });
  if (duplicateRut && duplicateRut.id !== id) {
    return {
      success: false,
      error: "Ya existe otro paciente con ese RUT.",
    };
  }
  const setObj: Record<string, unknown> = {
    rut: normalizedRut,
    name: input.name.trim(),
    email: input.email.trim(),
    phone: normalizedPhone,
  };
  if (input.weightKg !== undefined) setObj.weightKg = input.weightKg ?? null;
  if (input.heightCm !== undefined) setObj.heightCm = input.heightCm ?? null;
  if (input.imc !== undefined) setObj.imc = input.imc ?? null;
  if (input.birthDate !== undefined) setObj.birthDate = input.birthDate?.trim() || null;
  if (input.gender !== undefined) setObj.gender = input.gender?.trim() || null;
  if (input.medicalHistory !== undefined) setObj.medicalHistory = input.medicalHistory?.trim() || null;
  if (input.nutritionGoals !== undefined) setObj.nutritionGoals = input.nutritionGoals?.trim() || null;
  if (input.activityLevel !== undefined) setObj.activityLevel = input.activityLevel?.trim() || null;
  if (input.clinicalNotes !== undefined) setObj.clinicalNotes = input.clinicalNotes?.trim() || null;

  const hasNutritionUpdate =
    input.weightKg !== undefined ||
    input.heightCm !== undefined ||
    input.imc !== undefined ||
    input.birthDate !== undefined ||
    input.gender !== undefined ||
    input.medicalHistory !== undefined ||
    input.nutritionGoals !== undefined ||
    input.activityLevel !== undefined ||
    input.clinicalNotes !== undefined;

  try {
    await db.update(patients).set(setObj as typeof patients.$inferInsert).where(eq(patients.id, id));
    if (hasNutritionUpdate) {
      const updated = await db.query.patients.findFirst({
        where: eq(patients.id, id),
      });
      if (updated) {
        await db.insert(patientDataHistory).values({
          patientId: id,
          weightKg: updated.weightKg ?? null,
          heightCm: updated.heightCm ?? null,
          imc: updated.imc ?? null,
          birthDate: updated.birthDate ?? null,
          gender: updated.gender ?? null,
          medicalHistory: updated.medicalHistory ?? null,
          nutritionGoals: updated.nutritionGoals ?? null,
          activityLevel: updated.activityLevel ?? null,
          clinicalNotes: updated.clinicalNotes ?? null,
        });
      }
    }
    revalidatePath("/admin/pacientes");
    return { success: true };
  } catch {
    return { success: false, error: "Error al actualizar el paciente." };
  }
}

export async function getPatientDataHistory(
  patientId: number
): Promise<PatientDataHistoryRecord[]> {
  unstable_noStore();
  return db.query.patientDataHistory.findMany({
    where: eq(patientDataHistory.patientId, patientId),
    orderBy: [desc(patientDataHistory.recordedAt)],
  });
}

export async function deletePatient(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    await db.delete(patients).where(eq(patients.id, id));
    revalidatePath("/admin/pacientes");
    return { success: true };
  } catch {
    return { success: false, error: "Error al eliminar el paciente." };
  }
}
