import { getRecipeCategoriesAdmin } from "./actions";
import { CategoriasClient } from "./CategoriasClient";

export const dynamic = "force-dynamic";

export default async function AdminRecetasCategoriasPage() {
  const categories = await getRecipeCategoriesAdmin();
  return <CategoriasClient initialCategories={categories} />;
}

