import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { resources } from "../../data/resources";

export default function ResourcesPreview() {
  const featured = resources.slice(0, 4);

  return (
    <section id="ressources" className="relative border-t border-white/5 py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-aurora-rose">Nouvelles ressources</p>
            <h2 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">
              De quoi nourrir <span className="text-gradient-aurora italic">chaque état</span>
            </h2>
          </div>
          <Link
            to="/signup"
            className="inline-flex items-center gap-1 text-sm font-semibold text-mist-100 underline decoration-white/20 underline-offset-4 hover:decoration-white/60"
          >
            Voir toute la bibliothèque <ArrowUpRight size={15} />
          </Link>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((r) => (
            <div
              key={r.id}
              className="group relative overflow-hidden rounded-3xl border border-white/8 bg-white/[0.03] p-6 transition duration-300 hover:-translate-y-1 hover:border-white/20"
            >
              {r.isNew && (
                <span className="absolute right-5 top-5 rounded-full bg-gold-400/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gold-400">
                  Nouveau
                </span>
              )}
              <div
                className="mb-8 inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                style={{ background: `${r.color}1f`, color: r.color }}
              >
                {r.category}
              </div>
              <h3 className="font-display text-lg leading-snug">{r.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-mist-400">{r.description}</p>
              <p className="mt-6 text-xs uppercase tracking-wider text-mist-500">{r.duration}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
