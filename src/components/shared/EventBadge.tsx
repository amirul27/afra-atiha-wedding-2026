import { EVENT_MAP, EVENTS } from "@/config/events";
import type { EventKey } from "@/types";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Small coloured pill that names which event a row belongs to. */
export function EventBadge({ event }: { event: EventKey }) {
  if (event === "all") {
    return (
      <span className="inline-flex items-center rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
        All events
      </span>
    );
  }
  const def = EVENT_MAP[event];
  if (!def) return null;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium", def.badge)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", def.dot)} />
      {def.name}
    </span>
  );
}

/** Dropdown to filter a list by event (includes an "All" option). */
export function EventFilter({
  value,
  onChange,
  includeAll = true,
}: {
  value: EventKey;
  onChange: (v: EventKey) => void;
  includeAll?: boolean;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as EventKey)}>
      <SelectTrigger className="w-[170px]">
        <SelectValue placeholder="Event" />
      </SelectTrigger>
      <SelectContent>
        {includeAll && <SelectItem value="all">All events</SelectItem>}
        {EVENTS.map((e) => (
          <SelectItem key={e.key} value={e.key}>
            {e.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
