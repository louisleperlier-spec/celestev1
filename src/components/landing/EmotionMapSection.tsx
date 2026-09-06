import { emotionFamilies } from "../../lib/emotions";

const sampleSky = [
  { top: "18%", left: "22%", family: emotionFamilies[0], size: 10 },
  { top: "30%", left: "68%", family: emotionFamilies[2], size: 7 },
  { top: "55%", left: "12%", family: emotionFamilies[4], size: 8 },
  { top: "68%", left: "48%", family: emotionFamilies[1], size: 11 },
  { top: "22%", left: "48%", family: emotionFamilies[7], size: 6 },
  { top: "78%", left: "78%", family: emotionFamilies[6], size: 9 },
  { top: "45%", left: "85%", family: emotionFamilies[3], size: 7 },
  { top: "10%", left: "80%", family: emotionFamilies[5], size: 8 },
];

const steps = [
  {
    n: "01",
    title: "Choisissez votre étoile",
    text: "Huit familles d'émotions, inspirées de la roue de Plutchik, réparties comme des constellations.",
  },
  {
    n: "02",
    title: "Précisez son intensité",
    text: "Trois niveaux — du frémissement à l'embrasement — pour une nuance juste, jamais réductrice.",
  },
  {
    n: "03",
    title: "Regardez votre ciel se dessiner",
    text: "Chaque entrée devient une étoile sur votre carte personnelle, consultable jour, semaine ou année.",
  },
];

export default function EmotionMapSection() {
  return (
    <section id="carte" className="relative overflow-hidden border-t border-white/5 py-28">
      <div className="absolute left-1/2 top-0 h-full w-full -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,rgba(183,148,246,0.12),transparent_60%)]" />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-6 lg:grid-cols-2 lg:px-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-aurora-teal">La carte des émotions</p>
          <h2 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">
            Votre ciel intérieur, <span className="text-gradient-aurora italic">nuit après nuit</span>
          </h2>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-mist-400">
            Fini les cases "bien / pas bien". La carte des émotions de Céleste vous permet de nommer
            précisément ce qui vous traverse et de voir, avec le temps, vos propres constellations
            émotionnelles se former.
          </p>

          <div className="mt-10 space-y-7">
            {steps.map((s) => (
              <div key={s.n} className="flex gap-5">
                <span className="font-display text-2xl text-gold-400/70">{s.n}</span>
                <div>
                  <h3 className="font-semibold text-mist-100">{s.title}</h3>
                  <p className="mt-1 text-sm text-mist-400">{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative aspect-square w-full max-w-lg justify-self-center overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-void-800 to-void-950 p-4">
          <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)", backgroundSize: "22px 22px" }} />
          {sampleSky.map((s, i) => (
            <div
              key={i}
              className="absolute rounded-full animate-pulse"
              style={{
                top: s.top,
                left: s.left,
                width: s.size,
                height: s.size,
                background: s.family.color,
                boxShadow: `0 0 ${s.size * 2}px ${s.family.color}`,
                animationDuration: `${2 + i * 0.4}s`,
              }}
              title={s.family.name}
            />
          ))}
          <svg className="absolute inset-0 h-full w-full opacity-30" aria-hidden="true">
            <line x1="22%" y1="18%" x2="48%" y2="22%" stroke="#f5d48a" strokeWidth="1" />
            <line x1="48%" y1="22%" x2="68%" y2="30%" stroke="#f5d48a" strokeWidth="1" />
            <line x1="12%" y1="55%" x2="48%" y2="68%" stroke="#f5d48a" strokeWidth="1" />
            <line x1="48%" y1="68%" x2="78%" y2="78%" stroke="#f5d48a" strokeWidth="1" />
          </svg>
          <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/10 bg-void-900/70 p-4 backdrop-blur">
            <p className="text-xs uppercase tracking-wider text-mist-500">Aperçu — semaine du 1er septembre</p>
            <p className="mt-1 font-display text-lg">8 étoiles déposées · tendance à la confiance</p>
          </div>
        </div>
      </div>
    </section>
  );
}
