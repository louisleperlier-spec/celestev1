import type { HTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export default function GlassCard({ children, className, ...rest }: GlassCardProps) {
  return (
    <div className={clsx("glass-panel rounded-3xl", className)} {...rest}>
      {children}
    </div>
  );
}
