import { useState } from "react";
import { Feather, Trash2 } from "lucide-react";
import GlassCard from "../../components/GlassCard";
import { useJournalEntries } from "../../lib/useAppData";
import { emotionFamilies, familyById } from "../../lib/emotions";
import type { JournalEntry } from "../../lib/storage";

const prompts = [
  "Qu'est-ce qui a marqué cette journée ?",
  "Qu'aimeriez-vous vous rappeler de ce moment ?",
  "De quoi êtes-vous reconnaissant·e aujourd'hui ?",
];

export default function Journal() {
  const [entries, setEntries] = useJournalEntries();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [familyId, setFamilyId] = useState<string>("");
  const prompt = prompts[entries.length % prompts.length];

  const addEntry = () => {
    if (!body.trim()) return;
    const entry: JournalEntry = {
      id: crypto.randomUUID(),
      title: title.trim() || "Sans titre",
      body: body.trim(),
      familyId: familyId || undefined,
      createdAt: new Date().toISOString(),
    };
    setEntries([entry, ...entries]);
    setTitle("");
    setBody("");
    setFamilyId("");
  };

  const remove = (id: string) => setEntries(entries.filter((e) => e.id !== id));

  const sorted = [...entries].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="animate-rise space-y-8">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl">Journal</h1>
        <p className="mt-2 max-w-xl text-mist-400">
          Un espace libre pour poser des mots sur vos étoiles. Personne d'autre que vous n'y a accès.
        </p>
      </div>

      <GlassCard className="p-7">
        <p className="mb-4 flex items-center gap-2 text-sm italic text-mist-400">
          <Feather size={14} className="text-gold-400" /> {prompt}
        </p>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titre de la page"
          className="mb-3 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-mist-100 placeholder:text-mist-500 outline-none focus:border-gold-400/50 focus:ring-2 focus:ring-gold-400/20"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Écrivez librement…"
          rows={5}
          className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-mist-100 placeholder:text-mist-500 outline-none focus:border-gold-400/50 focus:ring-2 focus:ring-gold-400/20"
        />

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-mist-500">Émotion liée :</span>
          <button
            onClick={() => setFamilyId("")}
            className={`rounded-full border px-3 py-1 text-xs ${
              familyId === "" ? "border-white/30 bg-white/10 text-mist-100" : "border-white/10 text-mist-500"
            }`}
          >
            Aucune
          </button>
          {emotionFamilies.map((f) => (
            <button
              key={f.id}
              onClick={() => setFamilyId(f.id)}
              className="rounded-full border px-3 py-1 text-xs transition"
              style={{
                borderColor: familyId === f.id ? f.color : "rgba(255,255,255,0.1)",
                color: familyId === f.id ? f.color : "#948dae",
                background: familyId === f.id ? `${f.color}1a` : "transparent",
              }}
            >
              {f.name}
            </button>
          ))}
        </div>

        <button
          onClick={addEntry}
          className="mt-6 rounded-full bg-gradient-to-r from-gold-400 to-aurora-violet px-6 py-3 text-sm font-semibold text-void-950"
        >
          Ajouter au journal
        </button>
      </GlassCard>

      <div className="space-y-4">
        {sorted.length === 0 && (
          <p className="text-sm text-mist-500">Votre journal est vide pour le moment.</p>
        )}
        {sorted.map((entry) => {
          const f = entry.familyId ? familyById(entry.familyId) : undefined;
          return (
            <GlassCard key={entry.id} className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    {f && <span className="h-2 w-2 rounded-full" style={{ background: f.color }} />}
                    <h3 className="font-display text-lg">{entry.title}</h3>
                  </div>
                  <p className="mt-1 text-xs text-mist-500">
                    {new Date(entry.createdAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <button onClick={() => remove(entry.id)} className="text-mist-600 hover:text-aurora-rose" aria-label="Supprimer">
                  <Trash2 size={16} />
                </button>
              </div>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-mist-300">{entry.body}</p>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
