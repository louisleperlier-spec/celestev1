import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Starfield from "../Starfield";

export default function CTA() {
  const navigate = useNavigate();
  return (
    <section className="relative overflow-hidden border-t border-white/5 py-28">
      <Starfield count={80} />
      <div
        className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--color-aurora-violet), transparent 70%)" }}
      />
      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <h2 className="font-display text-4xl leading-tight sm:text-5xl">
          Votre carte du ciel <span className="text-gradient-aurora italic">vous attend</span>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-mist-400">
          Créez votre compte en 30 secondes et déposez votre première étoile ce soir.
        </p>
        <button
          onClick={() => navigate("/signup")}
          className="group mx-auto mt-9 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gold-400 via-gold-300 to-aurora-violet px-8 py-4 text-sm font-semibold text-void-950 shadow-[0_0_30px_-6px_rgba(245,212,138,0.55)] transition hover:shadow-[0_0_40px_-2px_rgba(245,212,138,0.8)]"
        >
          Essayer Céleste gratuitement
          <ArrowRight size={16} className="transition group-hover:translate-x-1" />
        </button>
      </div>
    </section>
  );
}
