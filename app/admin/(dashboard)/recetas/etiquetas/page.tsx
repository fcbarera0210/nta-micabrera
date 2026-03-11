import { getRecipeTagsAdmin } from "./actions";
import { EtiquetasClient } from "./EtiquetasClient";

export const dynamic = "force-dynamic";

export default async function AdminRecetasEtiquetasPage() {
  const tags = await getRecipeTagsAdmin();
  return <EtiquetasClient initialTags={tags} />;
}

