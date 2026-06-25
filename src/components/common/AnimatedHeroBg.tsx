export function AnimatedHeroBg() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(to right, hsl(var(--primary-foreground)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--primary-foreground)) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />
      <div className="absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full bg-accent/30 blur-3xl animate-blob-drift" />
      <div
        className="absolute -left-24 top-1/4 h-[480px] w-[480px] rounded-full bg-primary-foreground/10 blur-3xl animate-blob-drift"
        style={{ animationDelay: "-6s" }}
      />
      <div
        className="absolute bottom-[-180px] left-1/3 h-[400px] w-[400px] rounded-full bg-accent/20 blur-3xl animate-blob-drift"
        style={{ animationDelay: "-12s" }}
      />
      {Array.from({ length: 18 }).map((_, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-accent/60"
          style={{
            top: `${(i * 53) % 95}%`,
            left: `${(i * 37) % 95}%`,
            width: 4 + (i % 3) * 2,
            height: 4 + (i % 3) * 2,
            opacity: 0.35,
            animation: `float-y ${5 + (i % 5)}s ease-in-out ${i * 0.3}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
