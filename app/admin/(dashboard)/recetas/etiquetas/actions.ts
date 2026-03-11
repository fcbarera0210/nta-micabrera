"use server";

import { db } from "@/lib/db";
import { recipeTags, type RecipeTag } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface RecipeTagInput {
  name: string;
  slug: string;
  description?: string | null;
  active?: boolean;
}

export async function getRecipeTagsAdmin(): Promise<RecipeTag[]> {
  return db.query.recipeTags.findMany({
    orderBy: (t, { asc }) => [asc(t.name)],
  });
}

export async function createRecipeTag(
  input: RecipeTagInput
): Promise<{ success: boolean; error?: string }> {
  const name = input.name.trim();
  const slug = input.slug.trim().toLowerCase();

  if (!name) {
    return { success: false, error: "El nombre es obligatorio." };
  }
  if (!slug) {
    return { success: false, error: "El slug es obligatorio." };
  }

  try {
    await db.insert(recipeTags).values({
      name,
      slug,
      description: input.description?.trim() || null,
      active: input.active ?? true,
    });
    revalidatePath("/admin/recetas/etiquetas");
    revalidatePath("/admin/recetas");
    return { success: true };
  } catch (error) {
    console.error("Error al crear etiqueta de receta:", error);
    return { success: false, error: "Error al crear la etiqueta." };
  }
}

export async function updateRecipeTag(
  id: number,
  input: RecipeTagInput
): Promise<{ success: boolean; error?: string }> {
  const name = input.name.trim();
  const slug = input.slug.trim().toLowerCase();

  if (!name) {
    return { success: false, error: "El nombre es obligatorio." };
  }
  if (!slug) {
    return { success: false, error: "El slug es obligatorio." };
  }

  try {
    await db
      .update(recipeTags)
      .set({
        name,
        slug,
        description: input.description?.trim() || null,
        active: input.active ?? true,
      })
      .where(eq(recipeTags.id, id));

    revalidatePath("/admin/recetas/etiquetas");
    revalidatePath("/admin/recetas");
    return { success: true };
  } catch (error) {
    console.error("Error al actualizar etiqueta de receta:", error);
    return { success: false, error: "Error al actualizar la etiqueta." };
  }
}

export async function toggleRecipeTagActive(
  id: number,
  active: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    await db.update(recipeTags).set({ active }).where(eq(recipeTags.id, id));

    revalidatePath("/admin/recetas/etiquetas");
    revalidatePath("/admin/recetas");
    return { success: true };
  } catch (error) {
    console.error("Error al cambiar estado de etiqueta de receta:", error);
    return {
      success: false,
      error: "Error al cambiar el estado de la etiqueta.",
    };
  }
}

export async function deleteRecipeTag(
  id: number
): Promise<{ success: boolean; error?: string }> {
  try {
    await db.delete(recipeTags).where(eq(recipeTags.id, id));
    revalidatePath("/admin/recetas/etiquetas");
    revalidatePath("/admin/recetas");
    return { success: true };
  } catch (error) {
    console.error("Error al eliminar etiqueta de receta:", error);
    return {
      success: false,
      error: "No se puede eliminar la etiqueta (puede estar en uso).",
    };
  }
}

