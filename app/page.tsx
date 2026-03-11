import HomePage from "@/components/HomePage";
import {
  getActiveRecipeCategories,
  getPublishedRecipesWithRelations,
} from "@/lib/db/recipes";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [recipes, categories] = await Promise.all([
    getPublishedRecipesWithRelations(),
    getActiveRecipeCategories(),
  ]);

  return (
    <HomePage
      initialRecipes={recipes}
      initialRecipeCategories={categories}
    />
  );
}


