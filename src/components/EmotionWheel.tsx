import { useState } from "react";
import { emotionFamilies, nuanceLabel, type EmotionFamily } from "../lib/emotions";

interface EmotionWheelProps {
  selectedFamilyId?: string;
  selectedIntensity?: 1 | 2 | 3;
  onSelect?: (familyId: string, intensity: 1 | 2 | 3) => void;
  size?: number;
  interactive?: boolean;
}

const CX = 220;
const CY = 220;
const RINGS: [number, number][] = [
  [56, 108],
  [108, 158],
  [158, 206],
];
const WEDGE = 45;
const GAP = 1.6;

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function ringPath(innerR: number, outerR: number, startDeg: number, endDeg: number) {
  const p1 = polar(CX, CY, outerR, startDeg);
  const p2 = polar(CX, CY, outerR, endDeg);
  const p3 = polar(CX, CY, innerR, endDeg);
  const p4 = polar(CX, CY, innerR, startDeg);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return [
    `M ${p1.x} ${p1.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${p4.x} ${p4.y}`,
    "Z",
  ].join(" ");
}

export default function EmotionWheel({
  selectedFamilyId,
  selectedIntensity,
  onSelect,
  size = 440,
  interactive = true,
}: EmotionWheelProps) {
  const [hover, setHover] = useState<{ family: EmotionFamily; intensity: 1 | 2 | 3 } | null>(null);
  const active = hover
    ? hover
    : selectedFamilyId
      ? {
          family: emotionFamilies.find((f) => f.id === selectedFamilyId)!,
          intensity: (selectedIntensity ?? 2) as 1 | 2 | 3,
        }
      : null;

  return (
    <div className="relative flex w-full flex-col items-center gap-6" style={{ maxWidth: size }}>
      <svg
        viewBox="-40 -40 520 520"
        style={{ width: "100%", height: "auto", maxWidth: size }}
        role="img"
        aria-label="Carte des émotions : sélectionnez une famille et son intensité"
      >
        <defs>
          <radialGradient id="core-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f6f3ee" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#f6f3ee" stopOpacity="0" />
          </radialGradient>
          {emotionFamilies.map((f) => (
            <filter key={f.id} id={`glow-${f.id}`} x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          ))}
        </defs>

        <circle cx={CX} cy={CY} r={210} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
        <circle cx={CX} cy={CY} r={40} fill="url(#core-glow)" opacity={0.5} />

        {emotionFamilies.map((family) => {
          const start = family.angle - WEDGE / 2 + GAP;
          const end = family.angle + WEDGE / 2 - GAP;
          return (
            <g key={family.id}>
              {RINGS.map(([inner, outer], idx) => {
                const intensity = (idx + 1) as 1 | 2 | 3;
                const isSelected = selectedFamilyId === family.id && selectedIntensity === intensity;
                const isHover = hover?.family.id === family.id && hover.intensity === intensity;
                const path = ringPath(inner, outer, start, end);
                return (
                  <path
                    key={intensity}
                    d={path}
                    fill={family.color}
                    opacity={isSelected ? 0.95 : isHover ? 0.8 : 0.28 + idx * 0.08}
                    filter={isSelected || isHover ? `url(#glow-${family.id})` : undefined}
                    stroke={isSelected ? family.glow : "transparent"}
                    strokeWidth={isSelected ? 2 : 0}
                    className={interactive ? "cursor-pointer transition-opacity duration-200" : undefined}
                    onMouseEnter={() => interactive && setHover({ family, intensity })}
                    onMouseLeave={() => interactive && setHover(null)}
                    onClick={() => interactive && onSelect?.(family.id, intensity)}
                  />
                );
              })}
              {(() => {
                const labelPos = polar(CX, CY, 226, family.angle);
                return (
                  <text
                    x={labelPos.x}
                    y={labelPos.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={13}
                    fontFamily="Manrope, sans-serif"
                    fontWeight={600}
                    fill={selectedFamilyId === family.id ? family.color : "#b8b2cc"}
                    className="pointer-events-none select-none"
                  >
                    {family.name}
                  </text>
                );
              })()}
            </g>
          );
        })}
      </svg>

      <div className="min-h-[64px] max-w-sm text-center animate-rise" key={active ? `${active.family.id}-${active.intensity}` : "empty"}>
        {active ? (
          <>
            <p className="font-display text-xl" style={{ color: active.family.color }}>
              {nuanceLabel(active.family, active.intensity)}
            </p>
            <p className="mt-1 text-sm text-mist-400">{active.family.description}</p>
          </>
        ) : (
          <p className="text-sm text-mist-500">
            Survolez ou touchez une étoile pour explorer une émotion, cliquez pour la déposer sur votre carte du jour.
          </p>
        )}
      </div>
    </div>
  );
}
