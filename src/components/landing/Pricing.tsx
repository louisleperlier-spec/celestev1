import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Étoile filante",
    price: "0€",
    period: "toujours",
    tagline: "Pour découvrir votre carte du ciel",
    features: ["Carte des émotions illimitée", "Journal simple", "7 jours d'historique", "3 ressources par semaine"],
    highlight: false,
  },
  {
    name: "Constellation",
    price: "9€",
    period: "/ mois",
    tagline: "Pour un suivi émotionnel complet",
    features: [
      "Tout Étoile filante",
      "Historique illimité",
      "Bibliothèque de ressources complète",
      "Éclairages personnalisés",
      "Rituels quotidiens guidés",
    ],
    highlight: true,
  },
  {
    name: "Galaxie",
    price: "19€",
    period: "/ mois",
    tagline: "Pour les professionnels de l'accompagnement",
    features: [
      "Tout Constellation",
      "Partage avec 5 proches ou patients",
      "Exports PDF de la carte",
      "Support prioritaire",
    ],
    highlight: false,
  },
];

export default function Pricing() {
  const navigate = useNavigate();

  return (
    <section id="tarifs" className="relative border-t border-white/5 py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-400">Tarifs</p>
          <h2 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">
            Choisissez <span className="text-gradient-aurora italic">votre ciel</span>
          </h2>
          <p className="mt-4 text-mist-400">Sans engagement. Résiliable en un clic, comme une étoile qui file.</p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative flex flex-col rounded-3xl border p-8 ${
                p.highlight
                  ? "border-gold-400/40 bg-gradient-to-b from-white/[0.08] to-white/[0.02] shadow-[0_0_50px_-15px_rgba(245,212,138,0.4)]"
                  : "border-white/8 bg-white/[0.03]"
              }`}
            >
              {p.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-gold-400 to-aurora-violet px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-void-950">
                  Le plus choisi
                </span>
              )}
              <h3 className="font-display text-2xl">{p.name}</h3>
              <p className="mt-1 text-sm text-mist-400">{p.tagline}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="font-display text-4xl">{p.price}</span>
                <span className="text-sm text-mist-500">{p.period}</span>
              </div>
              <ul className="mt-8 flex-1 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-mist-300">
                    <Check size={16} className="mt-0.5 shrink-0 text-aurora-teal" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate("/signup")}
                className={`mt-8 rounded-full px-6 py-3 text-sm font-semibold transition ${
                  p.highlight
                    ? "bg-gradient-to-r from-gold-400 to-aurora-violet text-void-950 hover:shadow-[0_0_30px_-4px_rgba(245,212,138,0.6)]"
                    : "border border-white/15 text-mist-100 hover:border-white/30 hover:bg-white/5"
                }`}
              >
                Choisir {p.name}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
