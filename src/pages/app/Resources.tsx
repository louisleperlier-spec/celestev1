import { useState } from "react";
import GlassCard from "../../components/GlassCard";
import { resources, type Resource } from "../../data/resources";

const categories: Array<Resource["category"] | "Tout"> = ["Tout", "Méditation", "Exercice", "Article", "Son apaisant"];

export default function Resources() {
  const [active, setActive] = useState<(typeof categories)[number]>("Tout");

  const filtered = active === "Tout" ? resources : resources.filter((r) => r.category === active);

  return (
    <div className="animate-rise space-y-8">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl">Ressources</h1>
        <p className="mt-2 max-w-xl text-mist-400">
          Méditations, exercices, lectures et sons pour accompagner chaque émotion que vous traversez.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setActive(c)}
            className={`rounded-full border px-4 py-2 text-sm transition ${
              active === c
                ? "border-gold-400/50 bg-gold-400/10 text-gold-300"
                : "border-white/10 text-mist-400 hover:border-white/25"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((r) => (
          <GlassCard key={r.id} className="relative p-6">
            {r.isNew && (
              <span className="absolute right-5 top-5 rounded-full bg-gold-400/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gold-400">
                Nouveau
              </span>
            )}
            <div
              className="mb-6 inline-flex rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: `${r.color}1f`, color: r.color }}
            >
              {r.category}
            </div>
            <h3 className="font-display text-lg leading-snug">{r.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-mist-400">{r.description}</p>
            <div className="mt-6 flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-mist-500">{r.duration}</span>
              <button className="text-xs font-semibold text-mist-100 underline decoration-white/30 underline-offset-4">
                Ouvrir
              </button>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
