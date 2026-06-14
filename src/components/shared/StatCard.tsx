import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Compact metric tile used on the dashboard. */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = "plum",
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: "plum" | "marigold" | "sage" | "rose";
}) {
  const accents: Record<string, string> = {
    plum: "bg-plum-50 text-plum-600",
    marigold: "bg-marigold-100 text-marigold-700",
    sage: "bg-sage/15 text-sage",
    rose: "bg-rose-100 text-plum-700",
  };
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 font-display text-2xl font-semibold text-foreground">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", accents[accent])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}
