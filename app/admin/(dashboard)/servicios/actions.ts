"use server";

import { db } from "@/lib/db";
import { services, type Service } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface ServiceInput {
  name: string;
  description?: string;
  durationMinutes: number;
  active?: boolean;
}

export async function getServices(): Promise<Service[]> {
  return db.query.services.findMany({
    orderBy: (s, { asc }) => [asc(s.name)],
  });
}

export async function createService(
  input: ServiceInput
): Promise<{ success: boolean; error?: string }> {
  if (!input.name.trim()) {
    return { success: false, error: "El nombre del servicio es obligatorio." };
  }
  if (input.durationMinutes < 5 || input.durationMinutes > 480) {
    return {
      success: false,
      error: "La duración debe estar entre 5 y 480 minutos.",
    };
  }

  try {
    await db.insert(services).values({
      name: input.name.trim(),
      description: input.description?.trim() || null,
      durationMinutes: input.durationMinutes,
      active: input.active ?? true,
    });
    revalidatePath("/admin/servicios");
    revalidatePath("/admin/reservas");
    return { success: true };
  } catch {
    return { success: false, error: "Error al crear el servicio." };
  }
}

export async function updateService(
  id: number,
  input: ServiceInput
): Promise<{ success: boolean; error?: string }> {
  if (!input.name.trim()) {
    return { success: false, error: "El nombre del servicio es obligatorio." };
  }
  if (input.durationMinutes < 5 || input.durationMinutes > 480) {
    return {
      success: false,
      error: "La duración debe estar entre 5 y 480 minutos.",
    };
  }

  try {
    await db
      .update(services)
      .set({
        name: input.name.trim(),
        description: input.description?.trim() || null,
        durationMinutes: input.durationMinutes,
        active: input.active ?? true,
      })
      .where(eq(services.id, id));
    revalidatePath("/admin/servicios");
    revalidatePath("/admin/reservas");
    return { success: true };
  } catch {
    return { success: false, error: "Error al actualizar el servicio." };
  }
}

export async function toggleService(
  id: number,
  active: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    await db.update(services).set({ active }).where(eq(services.id, id));
    revalidatePath("/admin/servicios");
    revalidatePath("/admin/reservas");
    return { success: true };
  } catch {
    return { success: false, error: "Error al cambiar el estado del servicio." };
  }
}

export async function deleteService(
  id: number
): Promise<{ success: boolean; error?: string }> {
  try {
    await db.delete(services).where(eq(services.id, id));
    revalidatePath("/admin/servicios");
    revalidatePath("/admin/reservas");
    return { success: true };
  } catch {
    return {
      success: false,
      error:
        "No se puede eliminar el servicio (puede tener reservas asociadas).",
    };
  }
}
