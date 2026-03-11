import { put, del } from "@vercel/blob";

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.warn(
    "BLOB_READ_WRITE_TOKEN no está definido. La subida de imágenes de recetas no funcionará."
  );
}

export async function uploadRecipeImage(
  file: File | Blob,
  recipeSlugOrId: string
): Promise<string> {
  const filename = `recipes/${recipeSlugOrId}-${Date.now()}`;

  const result = await put(filename, file, {
    access: "public",
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });

  return result.url;
}

export async function deleteBlobByUrl(url: string | null | undefined) {
  if (!url) return;

  try {
    await del(url, {
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
  } catch (error) {
    console.error("Error al borrar blob de Vercel:", error);
  }
}

