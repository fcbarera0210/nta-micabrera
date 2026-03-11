import HomePage from "@/components/HomePage";
import {
  getActiveRecipeCategories,
  getPublishedRecipesWithRelations,
} from "@/lib/db/recipes";
import { getSiteSettingsPublic } from "@/lib/db/settings";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [recipes, categories, settings] = await Promise.all([
    getPublishedRecipesWithRelations(),
    getActiveRecipeCategories(),
    getSiteSettingsPublic(),
  ]);

  return (
    <HomePage
      initialRecipes={recipes}
      initialRecipeCategories={categories}
      siteSettings={settings}
    />
  );
}


