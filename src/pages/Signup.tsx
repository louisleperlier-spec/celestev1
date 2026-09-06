import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Starfield from "../components/Starfield";
import AuroraBackdrop from "../components/AuroraBackdrop";
import GlassCard from "../components/GlassCard";

export default function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    window.localStorage.setItem("celeste-user-name", name || "Voyageur·se");
    window.localStorage.setItem("celeste-user-email", email || "vous@celeste.app");
    navigate("/app");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-void-900 px-6 py-16">
      <AuroraBackdrop />
      <Starfield count={100} />

      <Link to="/" className="absolute left-6 top-6 z-10 inline-flex items-center gap-2 text-sm text-mist-400 hover:text-mist-100">
        <ArrowLeft size={16} /> Retour
      </Link>

      <GlassCard className="relative w-full max-w-md animate-rise p-10">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 font-display text-2xl">
            <span className="text-gold-400">✦</span> Céleste
          </Link>
          <h1 className="mt-6 font-display text-2xl">Créez votre carte du ciel</h1>
          <p className="mt-2 text-sm text-mist-400">Gratuit, sans carte bancaire. Votre première étoile en 30 secondes.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-mist-500">Prénom</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Votre prénom"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-mist-100 placeholder:text-mist-500 outline-none focus:border-gold-400/50 focus:ring-2 focus:ring-gold-400/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-mist-500">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@celeste.app"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-mist-100 placeholder:text-mist-500 outline-none focus:border-gold-400/50 focus:ring-2 focus:ring-gold-400/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-mist-500">Mot de passe</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-mist-100 placeholder:text-mist-500 outline-none focus:border-gold-400/50 focus:ring-2 focus:ring-gold-400/20"
            />
          </div>

          <button
            type="submit"
            className="mt-2 w-full rounded-xl bg-gradient-to-r from-gold-400 to-aurora-violet py-3 text-sm font-semibold text-void-950 shadow-[0_0_24px_-6px_rgba(245,212,138,0.6)] transition hover:shadow-[0_0_32px_-2px_rgba(245,212,138,0.8)]"
          >
            Créer mon compte
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-mist-500">
          Déjà membre ?{" "}
          <Link to="/login" className="font-semibold text-mist-100 underline decoration-white/30 underline-offset-4">
            Se connecter
          </Link>
        </p>
      </GlassCard>
    </div>
  );
}
