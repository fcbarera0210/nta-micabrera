import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { nanoid } from "nanoid";

export const dynamic = "force-dynamic";

const MAX_SIZE_BYTES = 300 * 1024; // 300 KB aprox
const WEBP_MIME = "image/webp";

function normalizeSlug(slug: string): string {
  return String(slug).trim().toLowerCase().replace(/\s+/g, "-");
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const recipeSlug = (formData.get("recipeSlug") as string | null) ?? null;

    if (!file) {
      return NextResponse.json(
        { error: "No se recibió ninguna imagen." },
        { status: 400 }
      );
    }

    if (file.type !== WEBP_MIME) {
      return NextResponse.json(
        {
          error:
            "Solo se permiten imágenes WebP. Optimiza la imagen en el navegador antes de subirla.",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: `La imagen no puede superar ${Math.round(
            MAX_SIZE_BYTES / 1024
          )} KB. Intenta una imagen más liviana.`,
        },
        { status: 400 }
      );
    }

    const baseSlug = recipeSlug ? normalizeSlug(recipeSlug) : "recipe";
    const path = `recipes/${baseSlug}/${nanoid()}.webp`;

    const blob = await put(path, file, {
      access: "public",
    });

    return NextResponse.json({ url: blob.url });
  } catch (e) {
    console.error("Error al subir imagen de receta:", e);
    return NextResponse.json(
      { error: "Error al subir la imagen." },
      { status: 500 }
    );
  }
}

