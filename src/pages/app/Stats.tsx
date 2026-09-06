import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import GlassCard from "../../components/GlassCard";
import { useEmotionEntries } from "../../lib/useAppData";
import { emotionFamilies } from "../../lib/emotions";

function buildDaily(entries: ReturnType<typeof useEmotionEntries>[0], days: number) {
  const out = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const count = entries.filter((e) => new Date(e.createdAt).toDateString() === date.toDateString()).length;
    out.push({ day: date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }), count });
  }
  return out;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-void-950/95 px-3 py-2 text-xs text-mist-100 shadow-xl">
      <p className="text-mist-500">{label}</p>
      <p className="font-semibold">{payload[0].value} étoile{payload[0].value > 1 ? "s" : ""}</p>
    </div>
  );
}

export default function Stats() {
  const [entries] = useEmotionEntries();

  const daily = useMemo(() => buildDaily(entries, 30), [entries]);

  const distribution = useMemo(
    () =>
      emotionFamilies.map((f) => ({
        name: f.name,
        value: entries.filter((e) => e.familyId === f.id).length,
        color: f.color,
      })),
    [entries]
  );

  const avgIntensity = useMemo(() => {
    if (entries.length === 0) return 0;
    return (entries.reduce((sum, e) => sum + e.intensity, 0) / entries.length).toFixed(1);
  }, [entries]);

  const mostFrequent = distribution.reduce((a, b) => (b.value > a.value ? b : a), distribution[0]);

  return (
    <div className="animate-rise space-y-8">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl">Statistiques</h1>
        <p className="mt-2 max-w-xl text-mist-400">Votre météo intérieure, visualisée sur les 30 derniers jours.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <GlassCard className="p-6">
          <p className="text-xs uppercase tracking-wider text-mist-500">Étoiles au total</p>
          <p className="mt-2 font-display text-3xl">{entries.length}</p>
        </GlassCard>
        <GlassCard className="p-6">
          <p className="text-xs uppercase tracking-wider text-mist-500">Intensité moyenne</p>
          <p className="mt-2 font-display text-3xl">{avgIntensity} / 3</p>
        </GlassCard>
        <GlassCard className="p-6">
          <p className="text-xs uppercase tracking-wider text-mist-500">Émotion la plus fréquente</p>
          <p className="mt-2 font-display text-3xl" style={{ color: mostFrequent?.color }}>
            {mostFrequent?.value ? mostFrequent.name : "—"}
          </p>
        </GlassCard>
      </div>

      <GlassCard className="p-7">
        <h2 className="mb-6 font-display text-xl">Étoiles déposées — 30 derniers jours</h2>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={daily} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="day" stroke="#948dae" fontSize={11} interval={4} />
              <YAxis stroke="#948dae" fontSize={11} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#f5d48a"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: "#f5d48a" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      <GlassCard className="p-7">
        <h2 className="mb-6 font-display text-xl">Répartition par famille d'émotion</h2>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={distribution} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="name" stroke="#948dae" fontSize={11} angle={-20} textAnchor="end" height={60} />
              <YAxis stroke="#948dae" fontSize={11} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {distribution.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
    </div>
  );
}
