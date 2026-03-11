"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { convertHeicToJpgIfNeeded, optimizeImage } from "@/lib/image-upload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type UploadStep = "receiving" | "heic" | "optimizing" | "uploading" | "done";

const UPLOAD_STEP_LABELS: Record<UploadStep, string> = {
  receiving: "Recibiendo imagen",
  heic: "Transformando HEIC a JPG",
  optimizing: "Optimizando imagen (WebP)",
  uploading: "Subiendo a la nube",
  done: "Listo",
};

interface RecipeImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  recipeSlug: string;
}

export function RecipeImageUploader({
  value,
  onChange,
  recipeSlug,
}: RecipeImageUploaderProps) {
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [urlInput, setUrlInput] = useState(value ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState<UploadStep>("receiving");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setUrlInput(value ?? "");
  }, [value]);

  const handleOptimizedUpload = useCallback(
    async (file: File) => {
      setUploading(true);
      setError(null);
      setUploadStep("receiving");
      setUploadProgress(5);
      try {
        // Paso 1: HEIC -> JPG si aplica
        let forOptimization: File;
        if (file.type.startsWith("image/") || /\.(heic|heif)$/i.test(file.name)) {
          if (
            ["image/heic", "image/heif", "image/heic-sequence", "image/heif-sequence"].includes(
              file.type
            ) || /\.(heic|heif)$/i.test(file.name)
          ) {
            setUploadStep("heic");
            setUploadProgress(20);
            forOptimization = await convertHeicToJpgIfNeeded(file);
            setUploadProgress(35);
          } else {
            forOptimization = file;
            setUploadProgress(30);
          }
        } else {
          throw new Error(
            "Selecciona una imagen (JPG, PNG, WebP o HEIC/HEIF)."
          );
        }

        // Paso 2: optimizar a WebP
        setUploadStep("optimizing");
        setUploadProgress(50);
        const optimized = await optimizeImage(forOptimization);
        setUploadProgress(70);

        // Paso 3: subir a endpoint de recetas
        setUploadStep("uploading");
        const formData = new FormData();
        formData.append("file", optimized);
        formData.append("recipeSlug", recipeSlug || "recipe");

        const res = await fetch("/api/recipes/image-upload", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(
            data.error ??
              "No se pudo subir la imagen. Intenta con una imagen más liviana."
          );
        }
        const data = (await res.json()) as { url?: string };
        if (!data.url) {
          throw new Error("La respuesta de subida no contiene una URL válida.");
        }
        setUploadProgress(100);
        setUploadStep("done");
        onChange(data.url);
      } catch (e) {
        console.error(e);
        setUploadStep("receiving");
        setUploadProgress(0);
        setError(
          e instanceof Error
            ? e.message
            : "Ocurrió un error al procesar la imagen."
        );
      } finally {
        setUploading(false);
        setTimeout(() => setUploadProgress(0), 500);
      }
    },
    [onChange, recipeSlug]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void handleOptimizedUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void handleOptimizedUpload(file);
    }
  };

  const applyUrl = () => {
    if (!urlInput.trim()) {
      setError("Ingresa una URL antes de aplicar.");
      return;
    }
    setError(null);
    onChange(urlInput.trim());
  };

  return (
    <Card className="transition-all duration-200 hover:shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">
          Imagen de la receta
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            type="button"
            variant={mode === "upload" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setMode("upload");
              setError(null);
            }}
          >
            Subir
          </Button>
          <Button
            type="button"
            variant={mode === "url" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setMode("url");
              setError(null);
            }}
          >
            URL
          </Button>
        </div>

        {mode === "upload" ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 text-center text-xs text-muted-foreground transition",
              dragOver
                ? "border-purple-500 bg-purple-50/70"
                : "border-muted-foreground/30 hover:border-purple-400 hover:bg-muted"
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.heic,.heif"
              onChange={handleFileSelect}
              className="hidden"
            />
            {uploading ? (
              <div className="flex w-full max-w-xs flex-col gap-2 text-left">
                <p className="text-xs font-medium text-purple-700">
                  {UPLOAD_STEP_LABELS[uploadStep]}
                </p>
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-[11px] text-muted-foreground">
                  {uploadProgress}% · Las fotos HEIC pueden tardar más tiempo en
                  procesarse.
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-foreground">
                  Arrastra una imagen o haz clic para seleccionar
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Se acepta JPG, PNG, WebP o HEIC. Se optimizará a WebP y se
                  reducirá automáticamente.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://ejemplo.com/imagen.webp"
            />
            <Button type="button" size="sm" onClick={applyUrl}>
              Aplicar
            </Button>
          </div>
        )}

        {value && (
          <div className="mt-2 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Vista previa actual
            </p>
            {/* Usamos img nativo aquí para simplificar; Next/Image ya se usa en la card de receta */}
            <div className="overflow-hidden rounded-md border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value}
                alt="Imagen de la receta"
                className="h-40 w-full object-cover"
              />
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onChange("");
                  setUrlInput("");
                }}
              >
                Quitar imagen
              </Button>
            </div>
          </div>
        )}

        {error && <p className="text-xs text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}

