import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ListChecks,
  Users,
  Wallet,
  Store,
  ShoppingBag,
  FolderOpen,
  CalendarDays,
  Heart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { COUPLE, nextEvent, daysUntil } from "@/config/events";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/tasks", label: "Tasks", icon: ListChecks },
  { to: "/guests", label: "Guests", icon: Users },
  { to: "/budget", label: "Budget", icon: Wallet },
  { to: "/vendors", label: "Vendors", icon: Store },
  { to: "/shopping", label: "Shopping", icon: ShoppingBag },
  { to: "/documents", label: "Documents", icon: FolderOpen },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const upcoming = nextEvent();
  const days = daysUntil(upcoming.date);

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-white/80 backdrop-blur">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-plum-600 text-marigold-400">
          <Heart className="h-5 w-5 fill-current" />
        </div>
        <div className="leading-tight">
          <p className="font-display text-base font-semibold text-plum-700">
            {COUPLE.bride} &amp; {COUPLE.groom}
          </p>
          <p className="text-xs text-muted-foreground">Wedding 2026</p>
        </div>
      </div>

      <div className="mx-4 mb-3 rounded-lg bg-gradient-to-br from-plum-600 to-plum-700 p-4 text-white">
        <p className="text-xs uppercase tracking-wide text-rose-100/80">Next up · {upcoming.name}</p>
        <p className="mt-1 font-display text-2xl font-semibold">
          {days >= 0 ? `${days} days` : "Today 🎉"}
        </p>
        <p className="text-xs text-rose-100/80">{upcoming.subtitle}</p>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-plum-50 text-plum-700"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )
            }
          >
            <Icon className="h-[18px] w-[18px]" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-4 text-xs text-muted-foreground">
        <div className="henna-rule mb-3 text-plum-100" />
        {COUPLE.hashtag}
      </div>
    </aside>
  );
}
