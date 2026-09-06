export default function AuroraBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-void-900" />
      <div
        className="absolute -top-40 -left-40 h-[560px] w-[560px] rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--color-aurora-violet), transparent 70%)" }}
      />
      <div
        className="absolute top-1/3 -right-40 h-[520px] w-[520px] rounded-full opacity-25 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--color-aurora-teal), transparent 70%)" }}
      />
      <div
        className="absolute bottom-0 left-1/4 h-[480px] w-[480px] rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--color-aurora-rose), transparent 70%)" }}
      />
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, transparent 0%, rgba(7,7,15,0.4) 70%, rgba(7,7,15,0.95) 100%)",
        }}
      />
    </div>
  );
}
