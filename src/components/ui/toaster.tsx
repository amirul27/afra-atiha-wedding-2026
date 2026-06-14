import { CheckCircle2, AlertCircle, Info } from "lucide-react";
import { useToast } from "./use-toast";
import { cn } from "@/lib/utils";

const icons = {
  default: Info,
  success: CheckCircle2,
  error: AlertCircle,
};

export function Toaster() {
  const { toasts } = useToast();
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => {
        const Icon = icons[t.variant ?? "default"];
        return (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-lg border bg-white p-4 shadow-lg animate-fade-up",
              t.variant === "success" && "border-sage/40",
              t.variant === "error" && "border-red-300",
            )}
          >
            <Icon
              className={cn(
                "mt-0.5 h-5 w-5 shrink-0",
                t.variant === "success" && "text-sage",
                t.variant === "error" && "text-red-600",
                (!t.variant || t.variant === "default") && "text-plum-600",
              )}
            />
            <div className="space-y-0.5">
              {t.title && <p className="text-sm font-semibold text-foreground">{t.title}</p>}
              {t.description && <p className="text-sm text-muted-foreground">{t.description}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
