const testimonials = [
  {
    quote:
      "La carte des émotions a changé ma façon de me parler à moi-même. Je ne dis plus \"ça va pas\", je dis \"je suis dans ma zone tristesse, intensité 2\".",
    name: "Léa M.",
    role: "Utilise Céleste depuis 8 mois",
  },
  {
    quote:
      "En tant que thérapeute, je recommande Céleste à mes patients pour le suivi entre les séances. Le partage de carte est un vrai plus.",
    name: "Dr. Amadou K.",
    role: "Psychologue clinicien",
  },
  {
    quote:
      "Les rituels du soir sont devenus un vrai réflexe. 3 minutes qui changent la qualité de mon sommeil.",
    name: "Chloé R.",
    role: "Abonnée Constellation",
  },
];

export default function Testimonials() {
  return (
    <section className="relative border-t border-white/5 py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-aurora-teal">Témoignages</p>
          <h2 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">
            Des ciels, <span className="text-gradient-aurora italic">des histoires</span>
          </h2>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {testimonials.map((t) => (
            <figure
              key={t.name}
              className="flex flex-col justify-between rounded-3xl border border-white/8 bg-white/[0.03] p-8"
            >
              <blockquote className="font-display text-lg italic leading-relaxed text-mist-100">
                "{t.quote}"
              </blockquote>
              <figcaption className="mt-8">
                <p className="font-semibold text-mist-100">{t.name}</p>
                <p className="text-sm text-mist-500">{t.role}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
