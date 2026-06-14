import { useMemo, useState } from "react";
import { ListChecks, Plus, Pencil, Trash2, Flag } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { useDebounce } from "@/hooks/useDebounce";
import type { EventKey, Priority, Task, TaskStatus } from "@/types";
import { EVENTS } from "@/config/events";
import { cn, formatDate } from "@/lib/utils";

import { PageHeader, SearchBar, EmptyState } from "@/components/shared/SearchBar";
import { EventBadge, EventFilter } from "@/components/shared/EventBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

const priorityMeta: Record<Priority, { label: string; cls: string }> = {
  high: { label: "High", cls: "text-red-600" },
  medium: { label: "Medium", cls: "text-marigold-700" },
  low: { label: "Low", cls: "text-sage" },
};

const emptyTask: Partial<Task> = {
  title: "",
  notes: "",
  event: "engagement",
  priority: "medium",
  status: "todo",
  assignee: "",
  dueDate: "",
};

export default function Tasks() {
  const { rows, isLoading, create, update, remove } = useTasks();
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState<EventKey>("all");
  const [showDone, setShowDone] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState<Partial<Task>>(emptyTask);

  const q = useDebounce(search);

  const filtered = useMemo(() => {
    return rows
      .filter((t) => (eventFilter === "all" ? true : t.event === eventFilter))
      .filter((t) => (showDone ? true : t.status !== "done"))
      .filter((t) =>
        q.trim()
          ? `${t.title} ${t.notes ?? ""} ${t.assignee ?? ""}`
              .toLowerCase()
              .includes(q.toLowerCase())
          : true,
      )
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === "done" ? 1 : -1;
        return (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999");
      });
  }, [rows, eventFilter, showDone, q]);

  const done = rows.filter((t) => t.status === "done").length;
  const pct = rows.length ? Math.round((done / rows.length) * 100) : 0;

  function toggle(task: Task) {
    const next: TaskStatus = task.status === "done" ? "todo" : "done";
    update({ id: task.id, status: next });
  }

  function openNew() {
    setDraft({ ...emptyTask, event: eventFilter === "all" ? "engagement" : eventFilter });
    setDialogOpen(true);
  }
  function openEdit(t: Task) {
    setDraft(t);
    setDialogOpen(true);
  }
  function save() {
    if (!draft.title?.trim()) return;
    if (draft.id) update(draft as Task);
    else create(draft);
    setDialogOpen(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        subtitle={`${done} of ${rows.length} done · ${pct}% complete`}
        action={
          <Button onClick={openNew} variant="accent">
            <Plus /> Add task
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar value={search} onChange={setSearch} placeholder="Search tasks…" className="sm:max-w-xs" />
        <EventFilter value={eventFilter} onChange={setEventFilter} />
        <Button
          variant={showDone ? "outline" : "secondary"}
          onClick={() => setShowDone((s) => !s)}
          className="sm:ml-auto"
        >
          {showDone ? "Hide completed" : "Show completed"}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No tasks yet"
          description="Break the big day into small steps. Add your first task to get going."
          action={
            <Button onClick={openNew} variant="accent">
              <Plus /> Add task
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => {
            const isDone = t.status === "done";
            return (
              <Card
                key={t.id}
                className={cn(
                  "group flex items-start gap-3 p-4 transition-colors",
                  isDone && "bg-secondary/40",
                )}
              >
                <Checkbox
                  checked={isDone}
                  onCheckedChange={() => toggle(t)}
                  className="mt-0.5"
                  aria-label={isDone ? "Mark as not done" : "Mark as done"}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Strike-through on completion */}
                    <span
                      className={cn(
                        "font-medium transition-all",
                        isDone && "text-muted-foreground line-through decoration-plum-400/60",
                      )}
                    >
                      {t.title}
                    </span>
                    <EventBadge event={t.event} />
                    <span className={cn("inline-flex items-center gap-1 text-xs", priorityMeta[t.priority].cls)}>
                      <Flag className="h-3 w-3" />
                      {priorityMeta[t.priority].label}
                    </span>
                  </div>
                  {t.notes && (
                    <p className={cn("mt-1 text-sm text-muted-foreground", isDone && "line-through")}>
                      {t.notes}
                    </p>
                  )}
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {t.assignee && <span>Assigned to {t.assignee}</span>}
                    {t.dueDate && <span>Due {formatDate(t.dueDate)}</span>}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(t)} aria-label="Edit task">
                    <Pencil />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(t.id)} aria-label="Delete task">
                    <Trash2 className="text-red-500" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{draft.id ? "Edit task" : "Add task"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Task</Label>
              <Input
                id="title"
                value={draft.title ?? ""}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="e.g. Book the qazi for Akd"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={draft.notes ?? ""}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                placeholder="Optional details"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Event</Label>
                <Select value={draft.event} onValueChange={(v) => setDraft({ ...draft, event: v as EventKey })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EVENTS.map((e) => (
                      <SelectItem key={e.key} value={e.key}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={draft.priority} onValueChange={(v) => setDraft({ ...draft, priority: v as Priority })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="assignee">Assignee</Label>
                <Input
                  id="assignee"
                  value={draft.assignee ?? ""}
                  onChange={(e) => setDraft({ ...draft, assignee: e.target.value })}
                  placeholder="Who's on it?"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="due">Due date</Label>
                <Input
                  id="due"
                  type="date"
                  value={draft.dueDate ?? ""}
                  onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })}
                />
              </div>
            </div>
            {draft.id && (
              <Badge variant={draft.status === "done" ? "success" : "secondary"}>
                {draft.status === "done" ? "Completed" : "Open"}
              </Badge>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save} variant="accent">{draft.id ? "Save changes" : "Add task"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
