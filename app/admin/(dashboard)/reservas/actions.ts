"use server";

import { unstable_noStore } from "next/cache";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { reservations, services, type Reservation, type Service } from "@/lib/db/schema";
import { eq, asc, desc } from "drizzle-orm";
import * as booking from "@/lib/booking";
import type { TimeSlot } from "@/lib/availability/slots";

export type Modality = booking.Modality;
export type ReservationInput = booking.ReservationInput;

export async function getAvailableSlots(
  date: string,
  modality: booking.Modality,
  serviceId: number
): Promise<TimeSlot[]> {
  unstable_noStore();
  return booking.getAvailableSlots(date, modality, serviceId);
}

export async function createReservation(
  input: booking.ReservationInput
): Promise<{ success: boolean; error?: string }> {
  const result = await booking.createReservation(input);
  if (result.success) revalidatePath("/admin/reservas");
  return result;
}

export interface ReservationWithService extends Reservation {
  service: Service | null;
}

export async function listReservations(filters?: {
  date?: string;
  modality?: booking.Modality;
  status?: "pending" | "confirmed" | "cancelled";
}): Promise<ReservationWithService[]> {
  const rows = await db.query.reservations.findMany({
    orderBy: (r, { asc }) => [asc(r.date), asc(r.startTime)],
    with: { service: true },
  });

  return rows.filter((r) => {
    if (filters?.date && r.date !== filters.date) return false;
    if (filters?.modality && r.modality !== filters.modality) return false;
    if (filters?.status && r.status !== filters.status) return false;
    return true;
  }) as ReservationWithService[];
}

export async function updateReservationStatus(
  id: number,
  status: "pending" | "confirmed" | "cancelled"
): Promise<{ success: boolean; error?: string }> {
  try {
    await db.update(reservations).set({ status }).where(eq(reservations.id, id));
    revalidatePath("/admin/reservas");
    return { success: true };
  } catch {
    return { success: false, error: "Error al actualizar el estado." };
  }
}

export async function updateReservationProfessionalNotes(
  id: number,
  professionalNotes: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .update(reservations)
      .set({ professionalNotes: professionalNotes?.trim() || null })
      .where(eq(reservations.id, id));
    revalidatePath("/admin/reservas");
    return { success: true };
  } catch {
    return { success: false, error: "Error al actualizar las notas." };
  }
}

/** Historial de sesiones (reservas) de un paciente por ID. */
export async function getReservationsByPatientId(
  patientId: number
): Promise<ReservationWithService[]> {
  const rows = await db.query.reservations.findMany({
    where: eq(reservations.patientId, patientId),
    orderBy: (r, { desc }) => [desc(r.date), desc(r.startTime)],
    with: { service: true },
  });
  return rows as ReservationWithService[];
}

export async function getActiveServices(): Promise<Service[]> {
  unstable_noStore();
  return booking.getActiveServices();
}

/** Lista todos los servicios para la pantalla de reservas (admin). */
export async function getServicesForReservations(): Promise<Service[]> {
  unstable_noStore();
  return db.select().from(services).orderBy(asc(services.name));
}
