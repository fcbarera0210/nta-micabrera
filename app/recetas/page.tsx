import Image from "next/image";
import Link from "next/link";
import {
  getActiveRecipeCategories,
  getPublishedRecipesWithRelations,
} from "@/lib/db/recipes";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicPageTransition } from "@/components/PublicPageTransition";

const PlayIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="text-white"
  >
    <path d="m7 4 12 8-12 8V4z" />
  </svg>
);

export default async function RecetasListadoPage() {
  const [recipes, categories] = await Promise.all([
    getPublishedRecipesWithRelations(),
    getActiveRecipeCategories(),
  ]);

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  return (
    <div className="min-h-screen bg-[#faf8ff] font-sans text-slate-800 overflow-x-hidden selection:bg-purple-200">
      <PublicHeader />

      <PublicPageTransition className="max-w-7xl mx-auto px-6 pt-32 pb-16">
        <main>
          <header className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-serif text-purple-950 mb-3 tracking-tight">
                Recetario <span className="italic text-purple-600">Completo</span>
              </h1>
              <p className="text-slate-600 max-w-xl">
                Todas las recetas que la profesional ha creado, para que puedas
                explorarlas con calma y encontrar inspiración saludable.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-purple-100 bg-white text-sm font-semibold text-purple-800 hover:bg-purple-50"
              >
                ← Volver al inicio
              </Link>
            </div>
          </header>

          {recipes.length === 0 ? (
            <p className="text-slate-500">
              Pronto encontrarás recetas aquí.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recipes.map((recipe) => (
                <div
                  key={recipe.id}
                  className="group relative aspect-[9/16] rounded-[40px] overflow-hidden shadow-xl cursor-pointer"
                >
                  <Link
                    href={`/recetas/${recipe.slug}`}
                    className="block w-full h-full relative"
                  >
                    <Image
                      src={recipe.imageUrl || "/mica-2.jpeg"}
                      alt={recipe.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-purple-950/90 via-purple-900/20 to-transparent" />

                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                        <PlayIcon />
                      </div>
                    </div>

                    <div className="absolute bottom-0 left-0 p-8 w-full">
                      <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md text-[10px] font-bold text-white rounded-lg mb-3 uppercase tracking-widest">
                        {categoryMap.get(recipe.categoryId) ?? "Sin categoría"}
                      </span>
                      <h2 className="text-xl font-bold text-white leading-tight mb-2 line-clamp-2">
                        {recipe.title}
                      </h2>
                      <p className="text-white/60 text-xs font-medium flex items-center gap-2">
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        {recipe.prepTimeMinutes
                          ? `${recipe.prepTimeMinutes} min`
                          : "Tiempo variable"}
                      </p>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </main>
      </PublicPageTransition>

      <PublicFooter />
    </div>
  );
}


