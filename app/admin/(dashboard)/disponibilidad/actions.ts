"use server";

import { db } from "@/lib/db";
import { availabilityPatterns, availabilityBlocks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { intervalsOverlap } from "@/lib/availability/slots";

export type Modality = "presencial" | "online";

export interface BlockInput {
  id?: number;
  startTime: string;
  endTime: string;
}

export interface DayAvailability {
  dayOfWeek: number;
  enabled: boolean;
  blocks: BlockInput[];
}

export interface WeeklyAvailability {
  modality: Modality;
  days: DayAvailability[];
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getAvailabilityByModality(
  modality: Modality
): Promise<WeeklyAvailability> {
  const patterns = await db.query.availabilityPatterns.findMany({
    where: eq(availabilityPatterns.modality, modality),
    with: { blocks: true },
  });

  const days: DayAvailability[] = Array.from({ length: 7 }, (_, i) => {
    const pattern = patterns.find((p) => p.dayOfWeek === i);
    const blocks = pattern?.blocks ?? [];
    return {
      dayOfWeek: i,
      enabled: pattern?.enabled ?? false,
      blocks: blocks.map((b) => ({
        id: b.id,
        startTime: b.startTime,
        endTime: b.endTime,
      })),
    };
  });

  return { modality, days };
}

// ── Mutations ─────────────────────────────────────────────────────────────────

/**
 * Persists the full weekly availability for a given modality.
 * Uses upsert logic: one pattern row per (modality, dayOfWeek),
 * then replaces all blocks for that pattern.
 */
export async function saveAvailability(
  data: WeeklyAvailability
): Promise<{ success: boolean; error?: string }> {
  try {
    for (const day of data.days) {
      // Validate block integrity
      if (day.enabled && day.blocks.length > 0) {
        for (const block of day.blocks) {
          if (block.startTime >= block.endTime) {
            return {
              success: false,
              error: `Bloque inválido: hora inicio debe ser menor que hora término (${block.startTime} – ${block.endTime})`,
            };
          }
        }
        // Check for overlaps within the same day
        for (let i = 0; i < day.blocks.length; i++) {
          for (let j = i + 1; j < day.blocks.length; j++) {
            if (intervalsOverlap(day.blocks[i], day.blocks[j])) {
              return {
                success: false,
                error: `Bloques solapados en el mismo día: ${day.blocks[i].startTime}–${day.blocks[i].endTime} y ${day.blocks[j].startTime}–${day.blocks[j].endTime}`,
              };
            }
          }
        }
      }

      // Upsert the pattern row
      const existing = await db.query.availabilityPatterns.findFirst({
        where: and(
          eq(availabilityPatterns.modality, data.modality),
          eq(availabilityPatterns.dayOfWeek, day.dayOfWeek)
        ),
      });

      let patternId: number;

      if (existing) {
        await db
          .update(availabilityPatterns)
          .set({ enabled: day.enabled })
          .where(eq(availabilityPatterns.id, existing.id));
        patternId = existing.id;
      } else {
        const [created] = await db
          .insert(availabilityPatterns)
          .values({
            modality: data.modality,
            dayOfWeek: day.dayOfWeek,
            enabled: day.enabled,
          })
          .returning({ id: availabilityPatterns.id });
        patternId = created.id;
      }

      // Replace blocks for this pattern
      await db
        .delete(availabilityBlocks)
        .where(eq(availabilityBlocks.patternId, patternId));

      if (day.enabled && day.blocks.length > 0) {
        await db.insert(availabilityBlocks).values(
          day.blocks.map((b) => ({
            patternId,
            startTime: b.startTime,
            endTime: b.endTime,
          }))
        );
      }
    }

    revalidatePath("/admin/disponibilidad");
    return { success: true };
  } catch (err) {
    console.error("saveAvailability error:", err);
    return { success: false, error: "Error al guardar disponibilidad." };
  }
}
