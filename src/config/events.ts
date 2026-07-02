import type { EventKey } from "@/types";

export interface EventDef {
  key: Exclude<EventKey, "all">;
  name: string;
  /** Local meaning, shown as a subtitle */
  subtitle: string;
  date: string; // ISO
  /** Tailwind utility classes for badge styling */
  badge: string;
  dot: string;
}

export const COUPLE = {
  bride: "Afra",
  groom: "Atiha",
  hashtag: "#AfraAtiha2026",
} as const;

export const EVENTS: EventDef[] = [
  {
    key: "engagement",
    name: "Engagement",
    subtitle: "Paka Dekha",
    date: "2026-06-19",
    badge: "bg-rose-100 text-plum-700 border border-plum-100",
    dot: "bg-plum-400",
  },
  {
    key: "akd",
    name: "Akd",
    subtitle: "Nikah ceremony",
    date: "2026-07-31",
    badge: "bg-sage/15 text-sage border border-sage/30",
    dot: "bg-sage",
  },
  {
    key: "ceremony",
    name: "Wedding Ceremony",
    subtitle: "Bou Bhat & reception",
    date: "2027-01-22",
    badge: "bg-marigold-100 text-marigold-700 border border-marigold-400/40",
    dot: "bg-marigold",
  },
];

export const EVENT_MAP: Record<string, EventDef> = Object.fromEntries(
  EVENTS.map((e) => [e.key, e]),
);

export function eventLabel(key: EventKey): string {
  if (key === "all") return "All events";
  return EVENT_MAP[key]?.name ?? key;
}

/** Days remaining until a given ISO date (negative if past). */
export function daysUntil(iso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(iso + "T00:00:00");
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

/** The next upcoming event, or the last one if all have passed. */
export function nextEvent(): EventDef {
  const upcoming = EVENTS.filter((e) => daysUntil(e.date) >= 0).sort(
    (a, b) => daysUntil(a.date) - daysUntil(b.date),
  );
  return upcoming[0] ?? EVENTS[EVENTS.length - 1];
}
