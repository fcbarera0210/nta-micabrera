import { NextRequest, NextResponse } from "next/server";
import { uploadRecipeImage } from "@/lib/blob";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file");
  const slug = formData.get("slug")?.toString() || "recipe";

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Archivo de imagen inválido." },
      { status: 400 }
    );
  }

  try {
    const url = await uploadRecipeImage(file, slug);
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Error al subir imagen de receta:", error);
    return NextResponse.json(
      { error: "Error al subir la imagen." },
      { status: 500 }
    );
  }
}

