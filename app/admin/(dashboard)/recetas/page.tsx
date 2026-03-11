import { db } from "@/lib/db";
import { recipeCategories, recipeTags } from "@/lib/db/schema";
import { getRecipesForAdmin } from "@/lib/db/recipes";
import { RecetasClient } from "./RecetasClient";

export default async function AdminRecetasPage() {
  const [recipes, categories, tags] = await Promise.all([
    getRecipesForAdmin(),
    db.query.recipeCategories.findMany({
      where: (c, { eq }) => eq(c.active, true),
      orderBy: (c, { asc }) => [asc(c.order), asc(c.name)],
    }),
    db.query.recipeTags.findMany({
      where: (t, { eq }) => eq(t.active, true),
      orderBy: (t, { asc }) => [asc(t.name)],
    }),
  ]);

  return (
    <RecetasClient
      initialRecipes={recipes}
      categories={categories}
      tags={tags}
    />
  );
}

