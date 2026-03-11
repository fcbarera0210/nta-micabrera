"use server";

import { db } from "@/lib/db";
import {
  recipeCategories,
  type RecipeCategory,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface RecipeCategoryInput {
  name: string;
  slug: string;
  order?: number | null;
  active?: boolean;
}

export async function getRecipeCategoriesAdmin(): Promise<RecipeCategory[]> {
  return db.query.recipeCategories.findMany({
    orderBy: (c, { asc }) => [asc(c.order), asc(c.name)],
  });
}

export async function createRecipeCategory(
  input: RecipeCategoryInput
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
    await db.insert(recipeCategories).values({
      name,
      slug,
      order: input.order ?? null,
      active: input.active ?? true,
    });
    revalidatePath("/admin/recetas/categorias");
    revalidatePath("/admin/recetas");
    return { success: true };
  } catch (error) {
    console.error("Error al crear categoría de receta:", error);
    return { success: false, error: "Error al crear la categoría." };
  }
}

export async function updateRecipeCategory(
  id: number,
  input: RecipeCategoryInput
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
      .update(recipeCategories)
      .set({
        name,
        slug,
        order: input.order ?? null,
        active: input.active ?? true,
      })
      .where(eq(recipeCategories.id, id));

    revalidatePath("/admin/recetas/categorias");
    revalidatePath("/admin/recetas");
    return { success: true };
  } catch (error) {
    console.error("Error al actualizar categoría de receta:", error);
    return { success: false, error: "Error al actualizar la categoría." };
  }
}

export async function toggleRecipeCategoryActive(
  id: number,
  active: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .update(recipeCategories)
      .set({ active })
      .where(eq(recipeCategories.id, id));

    revalidatePath("/admin/recetas/categorias");
    revalidatePath("/admin/recetas");
    return { success: true };
  } catch (error) {
    console.error("Error al cambiar estado de categoría de receta:", error);
    return {
      success: false,
      error: "Error al cambiar el estado de la categoría.",
    };
  }
}

export async function deleteRecipeCategory(
  id: number
): Promise<{ success: boolean; error?: string }> {
  try {
    await db.delete(recipeCategories).where(eq(recipeCategories.id, id));
    revalidatePath("/admin/recetas/categorias");
    revalidatePath("/admin/recetas");
    return { success: true };
  } catch (error) {
    console.error("Error al eliminar categoría de receta:", error);
    return {
      success: false,
      error:
        "No se puede eliminar la categoría (puede tener recetas asociadas).",
    };
  }
}

