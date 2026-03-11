/**
 * Booking logic: slots, reservations, active services.
 * Used by admin reservas actions and public booking actions.
 */

import { db } from "@/lib/db";
import {
  reservations,
  patients,
  availabilityPatterns,
  availabilityBlocks,
  services,
  type Service,
} from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import {
  generateSlots,
  getDayOfWeek,
  type TimeBlock,
  type TimeSlot,
  intervalsOverlap,
} from "@/lib/availability/slots";
import { isValidRut, normalizeRut } from "@/lib/validation/rut";
import { isValidChilePhone, normalizePhone } from "@/lib/validation/phone";

export type Modality = "presencial" | "online";

export interface ReservationInput {
  serviceId: number;
  modality: Modality;
  date: string;
  startTime: string;
  endTime: string;
  patientRut: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  notes?: string;
  professionalNotes?: string;
}

export async function getAvailableSlots(
  date: string,
  modality: Modality,
  serviceId: number
): Promise<TimeSlot[]> {
  const dateObj = new Date(date + "T12:00:00");
  const dayOfWeek = getDayOfWeek(dateObj);

  const pattern = await db.query.availabilityPatterns.findFirst({
    where: and(
      eq(availabilityPatterns.modality, modality),
      eq(availabilityPatterns.dayOfWeek, dayOfWeek)
    ),
  });

  if (!pattern || !pattern.enabled) return [];

  const blocks = await db.query.availabilityBlocks.findMany({
    where: eq(availabilityBlocks.patternId, pattern.id),
  });

  if (blocks.length === 0) return [];

  const service = await db.query.services.findFirst({
    where: eq(services.id, serviceId),
  });

  if (!service) return [];

  const existingReservations = await db.query.reservations.findMany({
    where: eq(reservations.date, date),
  });

  const existingBlocks: TimeBlock[] = existingReservations
    .filter((r) => r.status !== "cancelled")
    .map((r) => ({ startTime: r.startTime, endTime: r.endTime }));

  return generateSlots(blocks, service.durationMinutes, existingBlocks);
}

export async function createReservation(
  input: ReservationInput
): Promise<{ success: boolean; error?: string }> {
  const slots = await getAvailableSlots(
    input.date,
    input.modality,
    input.serviceId
  );
  const slotMatch = slots.find(
    (s) => s.startTime === input.startTime && s.endTime === input.endTime
  );

  if (!slotMatch) {
    return {
      success: false,
      error:
        "El horario seleccionado no está disponible (puede haber sido tomado o no corresponder a la disponibilidad configurada).",
    };
  }

  if (!slotMatch.available) {
    return {
      success: false,
      error: "Este horario ya está reservado.",
    };
  }

  const existing = await db.query.reservations.findMany({
    where: eq(reservations.date, input.date),
  });

  const conflict = existing
    .filter((r) => r.status !== "cancelled")
    .some((r) =>
      intervalsOverlap(
        { startTime: input.startTime, endTime: input.endTime },
        { startTime: r.startTime, endTime: r.endTime }
      )
    );

  if (conflict) {
    return { success: false, error: "Conflicto de horario. Intenta de nuevo." };
  }

  if (!isValidRut(input.patientRut)) {
    return { success: false, error: "RUT inválido (verifique formato y dígito verificador)." };
  }
  if (!isValidChilePhone(input.patientPhone)) {
    return {
      success: false,
      error: "El teléfono debe tener 9 dígitos numéricos (ej: 987654321).",
    };
  }

  const normalizedRut = normalizeRut(input.patientRut);
  const normalizedPhone = normalizePhone(input.patientPhone);

  let patientId: number | null = null;
  const existingPatient = await db.query.patients.findFirst({
    where: eq(patients.rut, normalizedRut),
  });
  if (existingPatient) {
    patientId = existingPatient.id;
    await db
      .update(patients)
      .set({
        name: input.patientName.trim(),
        email: input.patientEmail.trim(),
        phone: normalizedPhone,
      })
      .where(eq(patients.id, existingPatient.id));
  } else {
    const [newPatient] = await db
      .insert(patients)
      .values({
        rut: normalizedRut,
        name: input.patientName.trim(),
        email: input.patientEmail.trim(),
        phone: normalizedPhone,
      })
      .returning({ id: patients.id });
    patientId = newPatient?.id ?? null;
  }

  try {
    await db.insert(reservations).values({
      serviceId: input.serviceId,
      patientId,
      modality: input.modality,
      date: input.date,
      startTime: input.startTime,
      endTime: input.endTime,
      patientRut: normalizedRut,
      patientName: input.patientName.trim(),
      patientEmail: input.patientEmail.trim(),
      patientPhone: normalizedPhone,
      notes: input.notes?.trim() || null,
      professionalNotes: input.professionalNotes?.trim() || null,
      status: "confirmed",
    });
    return { success: true };
  } catch {
    return { success: false, error: "Error al crear la reserva." };
  }
}

export async function getActiveServices(): Promise<Service[]> {
  return db
    .select()
    .from(services)
    .where(eq(services.active, true))
    .orderBy(asc(services.name));
}
