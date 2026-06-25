import { LucideIcon } from "lucide-react";
import { useInView } from "@/hooks/useInView";

interface BenefitCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  index?: number;
}

export function BenefitCard({ icon: Icon, title, description, index = 0 }: BenefitCardProps) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`group relative overflow-hidden rounded-2xl border bg-card p-6 transition-all duration-500 hover:-translate-y-1 hover:shadow-lg ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
      style={{ transitionDelay: `${index * 90}ms` }}
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent/10 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
      <div className="relative mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:bg-accent group-hover:text-accent-foreground">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="relative text-lg font-semibold tracking-tight">{title}</h3>
      <p className="relative mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
