import type { LucideIcon } from "lucide-react";
import GlassCard from "../GlassCard";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  accent?: string;
}

export default function StatCard({ icon: Icon, label, value, accent = "var(--color-gold-400)" }: StatCardProps) {
  return (
    <GlassCard className="flex items-center gap-4 p-5">
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
        style={{ background: `${accent}22`, color: accent }}
      >
        <Icon size={20} />
      </div>
      <div>
        <p className="font-display text-2xl leading-none">{value}</p>
        <p className="mt-1 text-xs uppercase tracking-wider text-mist-500">{label}</p>
      </div>
    </GlassCard>
  );
}
