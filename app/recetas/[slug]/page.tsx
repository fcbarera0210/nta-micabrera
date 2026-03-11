import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getRecipeBySlugWithDetails } from "@/lib/db/recipes";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicPageTransition } from "@/components/PublicPageTransition";

interface Props {
  params: { slug: string };
}

export default async function RecetaDetallePage({ params }: Props) {
  const recipe = await getRecipeBySlugWithDetails(params.slug);
  if (!recipe) {
    notFound();
  }

  const { category, ingredients, steps, tags } = recipe;

  return (
    <div className="min-h-screen bg-[#faf8ff] font-sans text-slate-800 overflow-x-hidden selection:bg-purple-200">
      <PublicHeader />

      <PublicPageTransition className="max-w-5xl mx-auto px-6 pt-32 pb-12 md:pb-16">
        <main>
          <Link
            href="/recetas"
            className="inline-flex items-center gap-2 rounded-xl border border-purple-100 bg-white px-4 py-2 text-xs font-semibold text-purple-800 shadow-sm hover:bg-purple-50 mb-6"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Volver al recetario
          </Link>

          <article className="bg-white rounded-[40px] shadow-xl overflow-hidden border border-purple-50">
            <div className="relative h-72 w-full bg-muted">
              <Image
                src={recipe.imageUrl || "/mica-2.jpeg"}
                alt={recipe.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 896px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
              <div className="absolute bottom-6 left-6 space-y-2">
                <span className="inline-block px-3 py-1 rounded-full bg-white/80 text-[11px] font-semibold text-purple-900">
                  {category?.name ?? "Sin categoría"}
                </span>
                <h1 className="text-3xl md:text-4xl font-serif text-white">
                  {recipe.title}
                </h1>
                {recipe.excerpt && (
                  <p className="max-w-xl text-sm text-white/80">
                    {recipe.excerpt}
                  </p>
                )}
              </div>
            </div>

            <div className="p-6 md:p-10 space-y-8">
              <div className="flex flex-wrap gap-4 text-xs text-slate-600">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-900">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>
                    {recipe.prepTimeMinutes
                      ? `${recipe.prepTimeMinutes} min aprox.`
                      : "Tiempo variable"}
                  </span>
                </div>
                {recipe.servings && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50">
                    <span>Porciones: {recipe.servings}</span>
                  </div>
                )}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50">
                  <span>
                    Dificultad:{" "}
                    {recipe.difficulty === "easy"
                      ? "Fácil"
                      : recipe.difficulty === "medium"
                      ? "Media"
                      : "Difícil"}
                  </span>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 items-center">
                    {tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-[11px] font-semibold text-emerald-800 border border-emerald-100"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid gap-10 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1.6fr)]">
                <section>
                  <h2 className="text-lg font-semibold text-purple-950 mb-3">
                    Ingredientes
                  </h2>
                  {ingredients.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      Próximamente se agregarán los ingredientes detallados.
                    </p>
                  ) : (
                    <ul className="space-y-2 text-sm text-slate-800">
                      {ingredients.map((ing) => (
                        <li key={ing.id} className="flex gap-2">
                          <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-purple-400" />
                          <span>
                            {ing.quantity ? `${ing.quantity} ` : ""}
                            {ing.name}
                            {ing.notes ? (
                              <span className="text-slate-500 italic">
                                {" "}
                                – {ing.notes}
                              </span>
                            ) : null}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section>
                  <h2 className="text-lg font-semibold text-purple-950 mb-3">
                    Preparación
                  </h2>
                  {steps.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      Próximamente se agregarán los pasos de preparación.
                    </p>
                  ) : (
                    <div className="space-y-4 text-sm text-slate-800">
                      {steps.map((step) => (
                        <div key={step.id} className="flex gap-3">
                          <div>
                            {step.title && (
                              <h3 className="text-sm font-semibold text-purple-950 mb-1">
                                {step.title}
                              </h3>
                            )}
                            <p className="leading-relaxed">{step.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>

              {recipe.videoUrl && (
                <section className="pt-4 border-t border-slate-100">
                  <h2 className="text-sm font-semibold text-purple-950 mb-2">
                    Video relacionado
                  </h2>
                  <a
                    href={recipe.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-purple-700 hover:text-purple-900"
                  >
                    Ver video de la receta
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </a>
                </section>
              )}
            </div>
          </article>
        </main>
      </PublicPageTransition>

      <PublicFooter />
    </div>
  );
}

