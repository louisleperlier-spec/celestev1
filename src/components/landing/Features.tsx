import { BookHeart, CalendarHeart, LineChart, MoonStar, Sparkles, Users } from "lucide-react";

const features = [
  {
    icon: MoonStar,
    title: "Carte des émotions",
    text: "Une roue constellée en 8 familles et 3 intensités pour nommer précisément ce que vous ressentez, en quelques secondes.",
    color: "var(--color-aurora-violet)",
  },
  {
    icon: BookHeart,
    title: "Journal intime guidé",
    text: "Des invitations d'écriture douces liées à votre émotion du moment, pour aller plus loin quand vous en avez besoin.",
    color: "var(--color-aurora-rose)",
  },
  {
    icon: LineChart,
    title: "Constellations & tendances",
    text: "Visualisez l'évolution de votre météo intérieure sur 7, 30 ou 365 jours et repérez vos cycles.",
    color: "var(--color-aurora-teal)",
  },
  {
    icon: CalendarHeart,
    title: "Rituels quotidiens",
    text: "Respiration guidée, ancrage, gratitude : des micro-rituels de 2 à 10 minutes glissés dans votre journée.",
    color: "var(--color-gold-400)",
  },
  {
    icon: Sparkles,
    title: "Éclairages personnalisés",
    text: "Céleste détecte les schémas dans votre carte et vous propose des pistes de compréhension, sans jugement.",
    color: "var(--color-confiance)",
  },
  {
    icon: Users,
    title: "Partage choisi",
    text: "Partagez votre carte avec un proche ou votre thérapeute d'un simple lien, révocable à tout moment.",
    color: "var(--color-peur)",
  },
];

export default function Features() {
  return (
    <section id="fonctionnalites" className="relative border-t border-white/5 py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-400">Fonctionnalités</p>
          <h2 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">
            Tout ce qu'il faut pour habiter <span className="text-gradient-aurora italic">vos émotions</span>
          </h2>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="group animate-rise rounded-3xl border border-white/8 bg-white/[0.03] p-8 transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.06]"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div
                className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ background: `${f.color}22`, color: f.color }}
              >
                <f.icon size={22} />
              </div>
              <h3 className="font-display text-xl">{f.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-mist-400">{f.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
