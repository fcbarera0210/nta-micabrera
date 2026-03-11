const HEIC_MIMES = [
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
];

const HEIC_EXT = /\.(heic|heif)$/i;

function isHeic(file: File): boolean {
  return HEIC_MIMES.includes(file.type) || HEIC_EXT.test(file.name);
}

const HEIC_ERROR_MESSAGE =
  "Este archivo HEIC/HEIF no pudo convertirse. Conviértelo a JPG o PNG en tu dispositivo (Fotos, o una app de conversión) y súbelo de nuevo.";

/**
 * Convierte HEIC/HEIF a JPG. Si el archivo no es HEIC, lo devuelve sin cambios.
 * Usa heic-to (libheif) para mejor soporte de HEIC de iPhones recientes.
 * Se carga dinámicamente para evitar problemas en SSR.
 */
export async function convertHeicToJpgIfNeeded(file: File): Promise<File> {
  if (!isHeic(file)) return file;

  try {
    const { heicTo } = await import("heic-to");
    const blob = await heicTo({
      blob: file,
      type: "image/jpeg",
      quality: 0.9,
    });
    const name = file.name.replace(HEIC_EXT, ".jpg");
    return new File([blob], name, { type: "image/jpeg" });
  } catch (e) {
    const msg =
      e && typeof e === "object" && "message" in e
        ? String((e as { message: unknown }).message)
        : "";
    if (/HEIF|HEIC|format not supported|ERR_LIBHEIF|decode|parse/i.test(msg)) {
      throw new Error(HEIC_ERROR_MESSAGE);
    }
    throw e;
  }
}

const compressionOptions = {
  maxSizeMB: 0.25,
  maxWidthOrHeight: 1920,
  // En algunos navegadores los web workers pueden \"pausar\" el procesamiento
  // en segundo plano; usamos el hilo principal para evitar bloqueos aparentes.
  useWebWorker: false,
  fileType: "image/webp" as const,
};

/**
 * Optimiza una imagen: convierte a WebP, comprime y limita tamaño/dimensiones.
 * Objetivo aproximado: 150–250 KB, máx 1920px, buena calidad visual.
 * Para HEIC usar primero convertHeicToJpgIfNeeded.
 */
export async function optimizeImage(file: File): Promise<File> {
  const imageCompression = (await import("browser-image-compression")).default;
  const compressed = await imageCompression(file, compressionOptions);
  return compressed;
}

