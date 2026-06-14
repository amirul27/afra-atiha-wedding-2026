import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CheckSquare,
  Heart,
  Store,
  CalendarClock,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useTasks } from "@/hooks/useTasks";
import { useVendors } from "@/hooks/useVendors";
import { EVENTS, EVENT_MAP, daysUntil } from "@/config/events";
import { cn, formatDate } from "@/lib/utils";
import type { EventKey } from "@/types";

import { PageHeader } from "@/components/shared/SearchBar";
import { EventBadge } from "@/components/shared/EventBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type EntryKind = "event" | "task" | "vendor";

interface CalendarEntry {
  id: string;
  date: string; // ISO yyyy-mm-dd
  title: string;
  kind: EntryKind;
  event: EventKey;
  href: string;
  done?: boolean;
}

const KIND_META: Record<EntryKind, { icon: React.ComponentType<{ className?: string }>; dot: string; label: string }> = {
  event: { icon: Heart, dot: "bg-plum-500", label: "Event" },
  task: { icon: CheckSquare, dot: "bg-marigold", label: "Task due" },
  vendor: { icon: Store, dot: "bg-sage", label: "Vendor payment" },
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function Calendar() {
  const { rows: tasks } = useTasks();
  const { rows: vendors } = useVendors();

  // Start the calendar on the month of the next upcoming wedding event.
  const firstUpcoming = EVENTS.find((e) => daysUntil(e.date) >= 0) ?? EVENTS[0];
  const initial = new Date(firstUpcoming.date + "T00:00:00");
  const [cursor, setCursor] = useState(new Date(initial.getFullYear(), initial.getMonth(), 1));

  const entries = useMemo<CalendarEntry[]>(() => {
    const list: CalendarEntry[] = [];

    for (const e of EVENTS) {
      list.push({
        id: `event-${e.key}`,
        date: e.date,
        title: `${e.name} · ${e.subtitle}`,
        kind: "event",
        event: e.key,
        href: "/",
      });
    }
    for (const t of tasks) {
      if (t.dueDate) {
        list.push({
          id: `task-${t.id}`,
          date: t.dueDate,
          title: t.title,
          kind: "task",
          event: t.event,
          href: "/tasks",
          done: t.status === "done",
        });
      }
    }
    // Vendors don't carry a date field; surface unpaid bookings as their event date
    // so payments line up with the relevant celebration.
    for (const v of vendors) {
      if (v.status === "booked" && EVENT_MAP[v.event]) {
        list.push({
          id: `vendor-${v.id}`,
          date: EVENT_MAP[v.event].date,
          title: `${v.name} — balance due`,
          kind: "vendor",
          event: v.event,
          href: "/vendors",
        });
      }
    }
    return list.sort((a, b) => a.date.localeCompare(b.date));
  }, [tasks, vendors]);

  const byDate = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    for (const e of entries) {
      const arr = map.get(e.date) ?? [];
      arr.push(e);
      map.set(e.date, arr);
    }
    return map;
  }, [entries]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const todayStr = ymd(new Date());

  const grid = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [year, month]);

  const upcoming = useMemo(
    () => entries.filter((e) => e.date >= todayStr).slice(0, 40),
    [entries, todayStr],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendar"
        subtitle="Every milestone, task deadline and vendor payment in one view"
      />

      <Tabs defaultValue="month">
        <TabsList>
          <TabsTrigger value="month"><CalendarDays className="mr-1.5 h-4 w-4" /> Month</TabsTrigger>
          <TabsTrigger value="agenda"><CalendarClock className="mr-1.5 h-4 w-4" /> Agenda</TabsTrigger>
        </TabsList>

        {/* ---------------------------------------------------------------- Month */}
        <TabsContent value="month" className="mt-4">
          <Card className="p-3 sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-plum-700">
                {MONTHS[month]} {year}
              </h2>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="outline" onClick={() => setCursor(new Date(year, month - 1, 1))} aria-label="Previous month">
                  <ChevronLeft />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { const t = new Date(); setCursor(new Date(t.getFullYear(), t.getMonth(), 1)); }}>
                  Today
                </Button>
                <Button size="icon" variant="outline" onClick={() => setCursor(new Date(year, month + 1, 1))} aria-label="Next month">
                  <ChevronRight />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {WEEKDAYS.map((w) => (
                <div key={w} className="pb-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <span className="hidden sm:inline">{w}</span>
                  <span className="sm:hidden">{w[0]}</span>
                </div>
              ))}

              {grid.map((cell, i) => {
                if (!cell) return <div key={`empty-${i}`} className="min-h-[64px] rounded-lg sm:min-h-[96px]" />;
                const key = ymd(cell);
                const dayEntries = byDate.get(key) ?? [];
                const isToday = key === todayStr;
                return (
                  <div
                    key={key}
                    className={cn(
                      "min-h-[64px] rounded-lg border border-border/70 bg-white/60 p-1.5 sm:min-h-[96px]",
                      isToday && "ring-2 ring-marigold",
                    )}
                  >
                    <div className={cn(
                      "mb-1 text-right text-xs font-medium",
                      isToday ? "text-marigold-700" : "text-muted-foreground",
                    )}>
                      {cell.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayEntries.slice(0, 3).map((e) => {
                        const m = KIND_META[e.kind];
                        return (
                          <Link
                            key={e.id}
                            to={e.href}
                            title={e.title}
                            className="flex items-center gap-1 rounded bg-secondary/60 px-1 py-0.5 text-[10px] leading-tight transition-colors hover:bg-secondary sm:text-xs"
                          >
                            <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", m.dot)} />
                            <span className={cn("truncate", e.done && "text-muted-foreground line-through")}>{e.title}</span>
                          </Link>
                        );
                      })}
                      {dayEntries.length > 3 && (
                        <p className="px-1 text-[10px] text-muted-foreground">+{dayEntries.length - 3} more</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
              {(Object.keys(KIND_META) as EntryKind[]).map((k) => (
                <span key={k} className="flex items-center gap-1.5">
                  <span className={cn("h-2 w-2 rounded-full", KIND_META[k].dot)} />
                  {KIND_META[k].label}
                </span>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* --------------------------------------------------------------- Agenda */}
        <TabsContent value="agenda" className="mt-4">
          <Card className="divide-y divide-border">
            {upcoming.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-muted-foreground">Nothing scheduled ahead.</p>
            ) : (
              upcoming.map((e) => {
                const m = KIND_META[e.kind];
                const Icon = m.icon;
                const dleft = daysUntil(e.date);
                return (
                  <Link key={e.id} to={e.href} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-secondary/40">
                    <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", m.dot, "bg-opacity-15")}>
                      <Icon className="h-4 w-4 text-foreground/70" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cn("truncate font-medium", e.done && "text-muted-foreground line-through")}>{e.title}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(e.date)} · {m.label}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <EventBadge event={e.event} />
                      <span className="hidden text-xs font-medium text-muted-foreground sm:inline">
                        {dleft === 0 ? "Today" : dleft > 0 ? `in ${dleft}d` : `${-dleft}d ago`}
                      </span>
                    </div>
                  </Link>
                );
              })
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
