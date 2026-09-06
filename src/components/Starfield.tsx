import { useMemo } from "react";

interface StarfieldProps {
  count?: number;
  className?: string;
}

export default function Starfield({ count = 140, className = "" }: StarfieldProps) {
  const stars = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: Math.random() * 1.8 + 0.6,
        delay: Math.random() * 6,
        duration: Math.random() * 4 + 3,
        opacity: Math.random() * 0.6 + 0.3,
      })),
    [count]
  );

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      {stars.map((s) => (
        <span
          key={s.id}
          className="absolute rounded-full bg-white"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            animation: `twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
            ["--tw" as string]: s.opacity,
          }}
        />
      ))}
    </div>
  );
}
