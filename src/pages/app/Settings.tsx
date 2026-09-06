import { useState } from "react";
import { Bell, Download, Moon, Trash2 } from "lucide-react";
import GlassCard from "../../components/GlassCard";

export default function Settings() {
  const [name, setName] = useState(window.localStorage.getItem("celeste-user-name") || "");
  const [email, setEmail] = useState(window.localStorage.getItem("celeste-user-email") || "");
  const [dailyReminder, setDailyReminder] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [saved, setSaved] = useState(false);

  const save = () => {
    window.localStorage.setItem("celeste-user-name", name);
    window.localStorage.setItem("celeste-user-email", email);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const exportData = () => {
    const data = {
      emotions: JSON.parse(window.localStorage.getItem("celeste-emotion-entries") || "[]"),
      journal: JSON.parse(window.localStorage.getItem("celeste-journal-entries") || "[]"),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "celeste-export.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetData = () => {
    if (!window.confirm("Effacer toutes vos étoiles et pages de journal ? Cette action est irréversible.")) return;
    window.localStorage.removeItem("celeste-emotion-entries");
    window.localStorage.removeItem("celeste-journal-entries");
    window.location.reload();
  };

  return (
    <div className="animate-rise space-y-8">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl">Paramètres</h1>
        <p className="mt-2 max-w-xl text-mist-400">Personnalisez votre expérience Céleste.</p>
      </div>

      <GlassCard className="p-7">
        <h2 className="mb-5 font-display text-xl">Profil</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-mist-500">Prénom</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-mist-100 outline-none focus:border-gold-400/50 focus:ring-2 focus:ring-gold-400/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-mist-500">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-mist-100 outline-none focus:border-gold-400/50 focus:ring-2 focus:ring-gold-400/20"
            />
          </div>
        </div>
        <button
          onClick={save}
          className="mt-5 rounded-full bg-gradient-to-r from-gold-400 to-aurora-violet px-6 py-2.5 text-sm font-semibold text-void-950"
        >
          {saved ? "Enregistré ✓" : "Enregistrer"}
        </button>
      </GlassCard>

      <GlassCard className="p-7">
        <h2 className="mb-5 flex items-center gap-2 font-display text-xl">
          <Bell size={18} className="text-gold-400" /> Notifications
        </h2>
        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <span className="text-sm text-mist-300">Rappel quotidien pour déposer une étoile</span>
            <input
              type="checkbox"
              checked={dailyReminder}
              onChange={(e) => setDailyReminder(e.target.checked)}
              className="h-5 w-5 accent-gold-400"
            />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm text-mist-300">Résumé hebdomadaire de votre ciel</span>
            <input
              type="checkbox"
              checked={weeklyDigest}
              onChange={(e) => setWeeklyDigest(e.target.checked)}
              className="h-5 w-5 accent-gold-400"
            />
          </label>
        </div>
      </GlassCard>

      <GlassCard className="p-7">
        <h2 className="mb-5 flex items-center gap-2 font-display text-xl">
          <Moon size={18} className="text-aurora-violet" /> Apparence
        </h2>
        <p className="text-sm text-mist-400">
          Céleste vit actuellement sous un ciel nocturne. Le thème diurne "Aube" arrive bientôt.
        </p>
      </GlassCard>

      <GlassCard className="p-7">
        <h2 className="mb-5 font-display text-xl">Données</h2>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={exportData}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm text-mist-100 hover:border-white/30"
          >
            <Download size={15} /> Exporter mes données
          </button>
          <button
            onClick={resetData}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-aurora-rose/30 px-5 py-2.5 text-sm text-aurora-rose hover:bg-aurora-rose/10"
          >
            <Trash2 size={15} /> Réinitialiser ma carte
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
