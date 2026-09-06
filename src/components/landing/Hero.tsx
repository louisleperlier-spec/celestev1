import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import Starfield from "../Starfield";
import AuroraBackdrop from "../AuroraBackdrop";
import EmotionWheel from "../EmotionWheel";
import { useState } from "react";

export default function Hero() {
  const navigate = useNavigate();
  const [selection, setSelection] = useState<{ familyId: string; intensity: 1 | 2 | 3 } | null>(null);

  return (
    <section className="relative overflow-hidden pb-28 pt-40 lg:pt-48">
      <AuroraBackdrop />
      <Starfield count={160} />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:px-10">
        <div className="animate-rise">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium tracking-wide text-mist-300">
            <Sparkles size={14} className="text-gold-400" />
            Nouveau · La carte des émotions en temps réel
          </div>

          <h1 className="font-display text-5xl leading-[1.05] tracking-tight sm:text-6xl lg:text-[4.2rem]">
            Cartographiez
            <br />
            <span className="text-gradient-aurora italic">vos émotions</span>
            <br />
            comme un ciel étoilé.
          </h1>

          <p className="mt-7 max-w-lg text-lg leading-relaxed text-mist-400">
            Céleste transforme chaque ressenti en une étoile sur votre propre carte du ciel intérieur.
            Un journal doux, une carte des émotions interactive et des ressources pensées pour mieux
            vous comprendre — jour après jour, nuit après nuit.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <button
              onClick={() => navigate("/signup")}
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-gold-400 via-gold-300 to-aurora-violet px-7 py-3.5 text-sm font-semibold text-void-950 shadow-[0_0_30px_-6px_rgba(245,212,138,0.55)] transition hover:shadow-[0_0_40px_-2px_rgba(245,212,138,0.8)]"
            >
              Commencer ma carte du ciel
              <ArrowRight size={16} className="transition group-hover:translate-x-1" />
            </button>
            <a
              href="#carte"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-7 py-3.5 text-sm font-semibold text-mist-100 transition hover:border-white/30 hover:bg-white/5"
            >
              Explorer la carte
            </a>
          </div>

          <div className="mt-14 flex flex-wrap items-center gap-x-6 gap-y-5 text-mist-500 sm:gap-x-8">
            <div className="min-w-[104px]">
              <p className="font-display text-2xl text-mist-100">12k+</p>
              <p className="text-xs uppercase tracking-wider">Constellations créées</p>
            </div>
            <div className="hidden h-8 w-px bg-white/10 sm:block" />
            <div className="min-w-[104px]">
              <p className="font-display text-2xl text-mist-100">4.9/5</p>
              <p className="text-xs uppercase tracking-wider">Satisfaction utilisateurs</p>
            </div>
            <div className="hidden h-8 w-px bg-white/10 sm:block" />
            <div className="min-w-[104px]">
              <p className="font-display text-2xl text-mist-100">50+</p>
              <p className="text-xs uppercase tracking-wider">Ressources guidées</p>
            </div>
          </div>
        </div>

        <div className="relative flex justify-center lg:justify-end">
          <div className="absolute -inset-10 -z-10 rounded-full bg-aurora-violet/10 blur-3xl" />
          <div
            className="glass-panel animate-rise w-full max-w-[380px] rounded-[2.5rem] p-6 sm:p-8"
            style={{ animationDelay: "0.15s" }}
          >
            <EmotionWheel
              size={380}
              selectedFamilyId={selection?.familyId}
              selectedIntensity={selection?.intensity}
              onSelect={(familyId, intensity) => setSelection({ familyId, intensity })}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
