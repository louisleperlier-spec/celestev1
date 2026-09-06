import { Link } from "react-router-dom";
import { ArrowUpRight, BookHeart, Flame, MoonStar, Sparkles } from "lucide-react";
import GlassCard from "../../components/GlassCard";
import StatCard from "../../components/app/StatCard";
import { useEmotionEntries, useJournalEntries, computeStreak } from "../../lib/useAppData";
import { familyById, nuanceLabel } from "../../lib/emotions";
import { resources } from "../../data/resources";

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Bonne nuit";
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bel après-midi";
  return "Bonsoir";
}

export default function Dashboard() {
  const [entries] = useEmotionEntries();
  const [journal] = useJournalEntries();
  const name = window.localStorage.getItem("celeste-user-name") || "voyageur·se";
  const streak = computeStreak(entries);

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const thisWeek = entries.filter((e) => new Date(e.createdAt) >= weekAgo);

  const counts: Record<string, number> = {};
  thisWeek.forEach((e) => {
    counts[e.familyId] = (counts[e.familyId] ?? 0) + 1;
  });
  const topFamilyId = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topFamily = topFamilyId ? familyById(topFamilyId) : undefined;

  const recent = [...entries]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const recentJournal = [...journal]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  return (
    <div className="animate-rise space-y-8">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-mist-500">
          {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
        <h1 className="font-display text-3xl sm:text-4xl">
          {greeting()}, <span className="text-gradient-aurora italic">{name}</span>
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Flame} label="Jours de suite" value={String(streak)} accent="var(--color-colere)" />
        <StatCard icon={MoonStar} label="Étoiles cette semaine" value={String(thisWeek.length)} accent="var(--color-aurora-violet)" />
        <StatCard
          icon={Sparkles}
          label="Émotion dominante"
          value={topFamily ? topFamily.name : "—"}
          accent={topFamily?.color ?? "var(--color-gold-400)"}
        />
        <StatCard icon={BookHeart} label="Pages de journal" value={String(journal.length)} accent="var(--color-aurora-teal)" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2 p-7">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-xl">Dernières étoiles déposées</h2>
            <Link to="/app/emotions" className="inline-flex items-center gap-1 text-xs font-semibold text-mist-400 hover:text-mist-100">
              Nouvelle entrée <ArrowUpRight size={13} />
            </Link>
          </div>

          {recent.length === 0 ? (
            <p className="text-sm text-mist-500">Votre ciel est encore vide. Déposez votre première étoile.</p>
          ) : (
            <ul className="space-y-3">
              {recent.map((e) => {
                const f = familyById(e.familyId);
                if (!f) return null;
                return (
                  <li key={e.id} className="flex items-center gap-4 rounded-2xl bg-white/[0.03] px-4 py-3">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ background: f.color, boxShadow: `0 0 10px ${f.color}` }}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-mist-100">{nuanceLabel(f, e.intensity)}</p>
                      {e.note && <p className="text-xs text-mist-500">{e.note}</p>}
                    </div>
                    <span className="text-xs text-mist-500">
                      {new Date(e.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </GlassCard>

        <GlassCard className="p-7">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-xl">Journal récent</h2>
            <Link to="/app/journal" className="inline-flex items-center gap-1 text-xs font-semibold text-mist-400 hover:text-mist-100">
              Écrire <ArrowUpRight size={13} />
            </Link>
          </div>
          {recentJournal.length === 0 ? (
            <p className="text-sm text-mist-500">Aucune page pour l'instant. Écrivez votre premier ressenti.</p>
          ) : (
            <ul className="space-y-4">
              {recentJournal.map((j) => (
                <li key={j.id}>
                  <p className="text-sm font-medium text-mist-100">{j.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-mist-500">{j.body}</p>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      </div>

      <GlassCard className="flex flex-col items-start gap-4 p-7 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gold-400">Suggestion du jour</p>
          <h3 className="mt-2 font-display text-xl">{resources[0].title}</h3>
          <p className="mt-1 text-sm text-mist-400">{resources[0].description}</p>
        </div>
        <Link
          to="/app/ressources"
          className="shrink-0 rounded-full bg-gradient-to-r from-gold-400 to-aurora-violet px-5 py-2.5 text-sm font-semibold text-void-950"
        >
          Découvrir
        </Link>
      </GlassCard>
    </div>
  );
}
