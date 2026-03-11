import { db } from "./index";
import {
  recipes,
  recipeCategories,
  recipeTags,
  recipeTagsRel,
  recipeIngredients,
  recipeSteps,
  type Recipe,
  type RecipeCategory,
  type RecipeTag,
  type RecipeIngredient,
  type RecipeStep,
} from "./schema";
import { desc, eq, inArray } from "drizzle-orm";

export interface RecipeWithRelations extends Recipe {
  category: RecipeCategory | null;
  tags: RecipeTag[];
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
}

export async function getRecipeCategories(): Promise<RecipeCategory[]> {
  return db.query.recipeCategories.findMany({
    orderBy: (c, { asc }) => [asc(c.order), asc(c.name)],
  });
}

export async function getActiveRecipeCategories(): Promise<RecipeCategory[]> {
  return db.query.recipeCategories.findMany({
    where: (c, { eq }) => eq(c.active, true),
    orderBy: (c, { asc }) => [asc(c.order), asc(c.name)],
  });
}

export async function getRecipeTags(): Promise<RecipeTag[]> {
  return db.query.recipeTags.findMany({
    orderBy: (t, { asc }) => [asc(t.name)],
  });
}

export interface RecipeInput {
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
  ingredients: Array<{
    id?: number;
    order: number;
    name: string;
    quantity?: string | null;
    notes?: string | null;
  }>;
  steps: Array<{
    id?: number;
    order: number;
    title?: string | null;
    content: string;
  }>;
}

export async function getRecipesForAdmin(): Promise<RecipeWithRelations[]> {
  const baseRecipes = await db.query.recipes.findMany({
    orderBy: (r, { desc }) => [desc(r.updatedAt)],
  });

  const categoryIds = Array.from(
    new Set(baseRecipes.map((r) => r.categoryId).filter(Boolean))
  ) as number[];
  const recipeIds = baseRecipes.map((r) => r.id);

  const [categories, ingredients, steps, tagLinks, tags] = await Promise.all([
    categoryIds.length
      ? db
          .select()
          .from(recipeCategories)
          .where(inArray(recipeCategories.id, categoryIds))
      : Promise.resolve([]),
    recipeIds.length
      ? db
          .select()
          .from(recipeIngredients)
          .where(inArray(recipeIngredients.recipeId, recipeIds))
      : Promise.resolve([]),
    recipeIds.length
      ? db
          .select()
          .from(recipeSteps)
          .where(inArray(recipeSteps.recipeId, recipeIds))
      : Promise.resolve([]),
    recipeIds.length
      ? db
          .select()
          .from(recipeTagsRel)
          .where(inArray(recipeTagsRel.recipeId, recipeIds))
      : Promise.resolve([]),
    db.select().from(recipeTags),
  ]);

  const categoriesById = new Map<number, RecipeCategory>();
  for (const c of categories as RecipeCategory[]) {
    categoriesById.set(c.id, c);
  }

  const ingredientsByRecipe = new Map<number, RecipeIngredient[]>();
  for (const ing of ingredients as RecipeIngredient[]) {
    const arr = ingredientsByRecipe.get(ing.recipeId) ?? [];
    arr.push(ing);
    ingredientsByRecipe.set(ing.recipeId, arr);
  }

  const stepsByRecipe = new Map<number, RecipeStep[]>();
  for (const step of steps as RecipeStep[]) {
    const arr = stepsByRecipe.get(step.recipeId) ?? [];
    arr.push(step);
    stepsByRecipe.set(step.recipeId, arr);
  }

  const tagsById = new Map<number, RecipeTag>();
  for (const t of tags as RecipeTag[]) {
    tagsById.set(t.id, t);
  }

  const tagLinksByRecipe = new Map<number, RecipeTag[]>();
  for (const link of tagLinks) {
    const tag = tagsById.get(link.tagId);
    if (!tag) continue;
    const arr = tagLinksByRecipe.get(link.recipeId) ?? [];
    arr.push(tag);
    tagLinksByRecipe.set(link.recipeId, arr);
  }

  return baseRecipes.map((r) => ({
    ...r,
    category: categoriesById.get(r.categoryId) ?? null,
    ingredients: (ingredientsByRecipe.get(r.id) ?? []).sort(
      (a, b) => a.order - b.order
    ),
    steps: (stepsByRecipe.get(r.id) ?? []).sort((a, b) => a.order - b.order),
    tags: tagLinksByRecipe.get(r.id) ?? [],
  }));
}

export async function getPublishedRecipesWithRelations(): Promise<RecipeWithRelations[]> {
  const rows = await db.query.recipes.findMany({
    where: (r, { eq }) => eq(r.status, "published"),
    orderBy: (r, { desc }) => [desc(r.createdAt)],
  });

  // Reutilizamos la misma lógica de agregación que en admin
  const recipeIds = rows.map((r) => r.id);
  if (recipeIds.length === 0) return [];

  const [categories, ingredients, steps, tagLinks, tags] = await Promise.all([
    db.select().from(recipeCategories),
    db
      .select()
      .from(recipeIngredients)
      .where(inArray(recipeIngredients.recipeId, recipeIds)),
    db
      .select()
      .from(recipeSteps)
      .where(inArray(recipeSteps.recipeId, recipeIds)),
    db
      .select()
      .from(recipeTagsRel)
      .where(inArray(recipeTagsRel.recipeId, recipeIds)),
    db.select().from(recipeTags),
  ]);

  const categoriesById = new Map<number, RecipeCategory>();
  for (const c of categories as RecipeCategory[]) {
    categoriesById.set(c.id, c);
  }

  const ingredientsByRecipe = new Map<number, RecipeIngredient[]>();
  for (const ing of ingredients as RecipeIngredient[]) {
    const arr = ingredientsByRecipe.get(ing.recipeId) ?? [];
    arr.push(ing);
    ingredientsByRecipe.set(ing.recipeId, arr);
  }

  const stepsByRecipe = new Map<number, RecipeStep[]>();
  for (const step of steps as RecipeStep[]) {
    const arr = stepsByRecipe.get(step.recipeId) ?? [];
    arr.push(step);
    stepsByRecipe.set(step.recipeId, arr);
  }

  const tagsById = new Map<number, RecipeTag>();
  for (const t of tags as RecipeTag[]) {
    tagsById.set(t.id, t);
  }

  const tagLinksByRecipe = new Map<number, RecipeTag[]>();
  for (const link of tagLinks) {
    const tag = tagsById.get(link.tagId);
    if (!tag) continue;
    const arr = tagLinksByRecipe.get(link.recipeId) ?? [];
    arr.push(tag);
    tagLinksByRecipe.set(link.recipeId, arr);
  }

  return rows.map((r) => ({
    ...r,
    category: categoriesById.get(r.categoryId) ?? null,
    ingredients: (ingredientsByRecipe.get(r.id) ?? []).sort(
      (a, b) => a.order - b.order
    ),
    steps: (stepsByRecipe.get(r.id) ?? []).sort((a, b) => a.order - b.order),
    tags: tagLinksByRecipe.get(r.id) ?? [],
  }));
}

export async function getRecipeBySlugWithDetails(
  slug: string
): Promise<RecipeWithRelations | null> {
  const row = await db.query.recipes.findFirst({
    where: (r, { eq }) => eq(r.slug, slug),
  });
  if (!row) return null;

  const [category, ingredients, steps, tagLinks, tags] = await Promise.all([
    db.query.recipeCategories.findFirst({
      where: (c, { eq }) => eq(c.id, row.categoryId),
    }),
    db
      .select()
      .from(recipeIngredients)
      .where(eq(recipeIngredients.recipeId, row.id)),
    db
      .select()
      .from(recipeSteps)
      .where(eq(recipeSteps.recipeId, row.id)),
    db
      .select()
      .from(recipeTagsRel)
      .where(eq(recipeTagsRel.recipeId, row.id)),
    db.select().from(recipeTags),
  ]);

  const tagsById = new Map<number, RecipeTag>();
  for (const t of tags as RecipeTag[]) {
    tagsById.set(t.id, t);
  }

  const recipeTagsForRecipe: RecipeTag[] = [];
  for (const link of tagLinks) {
    const tag = tagsById.get(link.tagId);
    if (tag) recipeTagsForRecipe.push(tag);
  }

  return {
    ...row,
    category: (category as RecipeCategory) ?? null,
    ingredients: (ingredients as RecipeIngredient[]).sort(
      (a, b) => a.order - b.order
    ),
    steps: (steps as RecipeStep[]).sort((a, b) => a.order - b.order),
    tags: recipeTagsForRecipe,
  };
}

