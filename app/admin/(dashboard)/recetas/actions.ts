"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  recipes,
  recipeIngredients,
  recipeSteps,
  recipeTagsRel,
  type Recipe,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { deleteBlobByUrl } from "@/lib/blob";

export interface RecipeFormStepInput {
  id?: number;
  order: number;
  title?: string | null;
  content: string;
}

export interface RecipeFormIngredientInput {
  id?: number;
  order: number;
  name: string;
  quantity?: string | null;
  notes?: string | null;
}

export interface RecipeFormInput {
  id?: number;
  slug: string;
  title: string;
  excerpt?: string | null;
  categoryId: number;
  prepTimeMinutes?: number | null;
  difficulty: "easy" | "medium" | "hard";
  servings?: number | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
  status: "draft" | "published";
  tagIds: number[];
  ingredients: RecipeFormIngredientInput[];
  steps: RecipeFormStepInput[];
}

function normalizeRecipeInput(input: RecipeFormInput): RecipeFormInput {
  return {
    ...input,
    title: input.title.trim(),
    slug: input.slug.trim().toLowerCase(),
    excerpt: input.excerpt?.trim() || null,
    videoUrl: input.videoUrl?.trim() || null,
    prepTimeMinutes: input.prepTimeMinutes ?? null,
    servings: input.servings ?? null,
    ingredients: input.ingredients
      .map((ing, index) => ({
        ...ing,
        order: ing.order ?? index,
        name: ing.name.trim(),
        quantity: ing.quantity?.trim() || null,
        notes: ing.notes?.trim() || null,
      }))
      .filter((ing) => ing.name.length > 0),
    steps: input.steps
      .map((step, index) => ({
        ...step,
        order: step.order ?? index,
        title: step.title?.trim() || null,
        content: step.content.trim(),
      }))
      .filter((step) => step.content.length > 0),
  };
}

export async function createRecipe(
  rawInput: RecipeFormInput
): Promise<{ success: boolean; error?: string; recipe?: Recipe }> {
  const input = normalizeRecipeInput(rawInput);

  if (!input.title) {
    return { success: false, error: "El título es obligatorio." };
  }
  if (!input.slug) {
    return { success: false, error: "El slug es obligatorio." };
  }
  if (!input.categoryId) {
    return { success: false, error: "La categoría es obligatoria." };
  }
  if (!input.ingredients.length) {
    return { success: false, error: "Agrega al menos un ingrediente." };
  }
  if (!input.steps.length) {
    return { success: false, error: "Agrega al menos un paso de preparación." };
  }

  try {
    const [recipe] = await db
      .insert(recipes)
      .values({
        slug: input.slug,
        title: input.title,
        excerpt: input.excerpt,
        categoryId: input.categoryId,
        prepTimeMinutes: input.prepTimeMinutes,
        difficulty: input.difficulty,
        servings: input.servings,
        imageUrl: input.imageUrl ?? null,
        videoUrl: input.videoUrl ?? null,
        status: input.status,
      })
      .returning();

    if (!recipe) {
      return { success: false, error: "No se pudo crear la receta." };
    }

    if (input.ingredients.length) {
      await db.insert(recipeIngredients).values(
        input.ingredients.map((ing) => ({
          recipeId: recipe.id,
          order: ing.order,
          name: ing.name,
          quantity: ing.quantity,
          notes: ing.notes,
        }))
      );
    }

    if (input.steps.length) {
      await db.insert(recipeSteps).values(
        input.steps.map((step) => ({
          recipeId: recipe.id,
          order: step.order,
          title: step.title,
          content: step.content,
        }))
      );
    }

    if (input.tagIds.length) {
      await db.insert(recipeTagsRel).values(
        input.tagIds.map((tagId) => ({
          recipeId: recipe.id,
          tagId,
        }))
      );
    }

    revalidatePath("/admin/recetas");
    return { success: true, recipe };
  } catch (error) {
    console.error("Error al crear receta:", error);
    return { success: false, error: "Error al crear la receta." };
  }
}

export async function updateRecipe(
  id: number,
  rawInput: RecipeFormInput
): Promise<{ success: boolean; error?: string }> {
  const input = normalizeRecipeInput(rawInput);

  if (!input.title) {
    return { success: false, error: "El título es obligatorio." };
  }
  if (!input.slug) {
    return { success: false, error: "El slug es obligatorio." };
  }
  if (!input.categoryId) {
    return { success: false, error: "La categoría es obligatoria." };
  }
  if (!input.ingredients.length) {
    return { success: false, error: "Agrega al menos un ingrediente." };
  }
  if (!input.steps.length) {
    return { success: false, error: "Agrega al menos un paso de preparación." };
  }

  try {
    const existing = await db.query.recipes.findFirst({
      where: (r, { eq }) => eq(r.id, id),
    });
    if (!existing) {
      return { success: false, error: "Receta no encontrada." };
    }

    if (existing.imageUrl && existing.imageUrl !== input.imageUrl) {
      await deleteBlobByUrl(existing.imageUrl);
    }

    await db
      .update(recipes)
      .set({
        slug: input.slug,
        title: input.title,
        excerpt: input.excerpt,
        categoryId: input.categoryId,
        prepTimeMinutes: input.prepTimeMinutes,
        difficulty: input.difficulty,
        servings: input.servings,
        imageUrl: input.imageUrl ?? null,
        videoUrl: input.videoUrl ?? null,
        status: input.status,
        updatedAt: new Date(),
      })
      .where(eq(recipes.id, id));

    await db.delete(recipeIngredients).where(eq(recipeIngredients.recipeId, id));
    await db.delete(recipeSteps).where(eq(recipeSteps.recipeId, id));
    await db.delete(recipeTagsRel).where(eq(recipeTagsRel.recipeId, id));

    if (input.ingredients.length) {
      await db.insert(recipeIngredients).values(
        input.ingredients.map((ing) => ({
          recipeId: id,
          order: ing.order,
          name: ing.name,
          quantity: ing.quantity,
          notes: ing.notes,
        }))
      );
    }

    if (input.steps.length) {
      await db.insert(recipeSteps).values(
        input.steps.map((step) => ({
          recipeId: id,
          order: step.order,
          title: step.title,
          content: step.content,
        }))
      );
    }

    if (input.tagIds.length) {
      await db.insert(recipeTagsRel).values(
        input.tagIds.map((tagId) => ({
          recipeId: id,
          tagId,
        }))
      );
    }

    revalidatePath("/admin/recetas");
    return { success: true };
  } catch (error) {
    console.error("Error al actualizar receta:", error);
    return { success: false, error: "Error al actualizar la receta." };
  }
}

export async function deleteRecipe(
  id: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const existing = await db.query.recipes.findFirst({
      where: (r, { eq }) => eq(r.id, id),
    });

    if (!existing) {
      return { success: false, error: "Receta no encontrada." };
    }

    if (existing.imageUrl) {
      await deleteBlobByUrl(existing.imageUrl);
    }

    await db.delete(recipes).where(eq(recipes.id, id));

    revalidatePath("/admin/recetas");
    return { success: true };
  } catch (error) {
    console.error("Error al eliminar receta:", error);
    return { success: false, error: "Error al eliminar la receta." };
  }
}

export async function toggleRecipeStatus(
  id: number,
  status: "draft" | "published"
): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .update(recipes)
      .set({ status, updatedAt: new Date() })
      .where(eq(recipes.id, id));

    revalidatePath("/admin/recetas");
    return { success: true };
  } catch (error) {
    console.error("Error al cambiar estado de receta:", error);
    return { success: false, error: "Error al cambiar estado de la receta." };
  }
}

