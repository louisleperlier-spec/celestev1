import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import GlassCard from "../../components/GlassCard";
import EmotionWheel from "../../components/EmotionWheel";
import { useEmotionEntries } from "../../lib/useAppData";
import { familyById, nuanceLabel, type EmotionEntry } from "../../lib/emotions";

function buildSky(entries: EmotionEntry[], days: number) {
  const cells = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayEntries = entries.filter((e) => new Date(e.createdAt).toDateString() === date.toDateString());
    cells.push({ date, entries: dayEntries });
  }
  return cells;
}

export default function EmotionMapPage() {
  const [entries, setEntries] = useEmotionEntries();
  const [selection, setSelection] = useState<{ familyId: string; intensity: 1 | 2 | 3 } | null>(null);
  const [note, setNote] = useState("");
  const [justSaved, setJustSaved] = useState(false);

  const sky = useMemo(() => buildSky(entries, 35), [entries]);

  const save = () => {
    if (!selection) return;
    const entry: EmotionEntry = {
      id: crypto.randomUUID(),
      familyId: selection.familyId,
      intensity: selection.intensity,
      note,
      createdAt: new Date().toISOString(),
    };
    setEntries([entry, ...entries]);
    setNote("");
    setSelection(null);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2200);
  };

  const recent = [...entries]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  return (
    <div className="animate-rise space-y-8">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl">Carte des émotions</h1>
        <p className="mt-2 max-w-xl text-mist-400">
          Choisissez la famille qui résonne le plus avec ce que vous ressentez maintenant, puis son intensité.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <GlassCard className="flex flex-col items-center gap-8 p-8">
          <EmotionWheel
            size={380}
            selectedFamilyId={selection?.familyId}
            selectedIntensity={selection?.intensity}
            onSelect={(familyId, intensity) => setSelection({ familyId, intensity })}
          />

          <div className="w-full max-w-md space-y-4">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Un mot sur ce qui déclenche ce ressenti ? (optionnel)"
              rows={2}
              className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-mist-100 placeholder:text-mist-500 outline-none focus:border-gold-400/50 focus:ring-2 focus:ring-gold-400/20"
            />
            <button
              onClick={save}
              disabled={!selection}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-400 to-aurora-violet py-3 text-sm font-semibold text-void-950 transition disabled:cursor-not-allowed disabled:opacity-40"
            >
              {justSaved ? (
                <>
                  <Check size={16} /> Étoile déposée
                </>
              ) : (
                "Déposer cette étoile sur ma carte"
              )}
            </button>
          </div>
        </GlassCard>

        <GlassCard className="p-7">
          <h2 className="mb-5 font-display text-xl">Votre ciel — 5 dernières semaines</h2>
          <div className="grid grid-cols-7 gap-2">
            {sky.map((cell, i) => {
              const dominant = cell.entries[cell.entries.length - 1];
              const family = dominant ? familyById(dominant.familyId) : undefined;
              return (
                <div
                  key={i}
                  title={cell.date.toLocaleDateString("fr-FR")}
                  className="flex aspect-square items-center justify-center rounded-lg border border-white/5"
                  style={{
                    background: family ? `${family.color}33` : "rgba(255,255,255,0.02)",
                  }}
                >
                  {family && (
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: family.color, boxShadow: `0 0 6px ${family.color}` }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <h3 className="mb-3 mt-8 text-xs font-semibold uppercase tracking-wider text-mist-500">Historique récent</h3>
          <ul className="space-y-3">
            {recent.map((e) => {
              const f = familyById(e.familyId);
              if (!f) return null;
              return (
                <li key={e.id} className="flex items-center gap-3 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: f.color }} />
                  <span className="flex-1 text-mist-200">{nuanceLabel(f, e.intensity)}</span>
                  <span className="text-xs text-mist-500">
                    {new Date(e.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                  </span>
                </li>
              );
            })}
          </ul>
        </GlassCard>
      </div>
    </div>
  );
}
