import { useMemo, useState } from "react";
import { Wallet, Plus, Pencil, Trash2, TrendingUp } from "lucide-react";
import { useBudget } from "@/hooks/useBudget";
import { useDebounce } from "@/hooks/useDebounce";
import type { BudgetItem, EventKey } from "@/types";
import { EVENTS } from "@/config/events";
import { cn, formatBDT, sumBy } from "@/lib/utils";

import { PageHeader, SearchBar, EmptyState } from "@/components/shared/SearchBar";
import { EventBadge, EventFilter } from "@/components/shared/EventBadge";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

const CATEGORIES = [
  "Venue", "Catering", "Decor", "Photography", "Outfits & Jewelry",
  "Beauty & Mehndi", "Music & Entertainment", "Invitations", "Transport", "Gifts", "Other",
];

const emptyItem: Partial<BudgetItem> = {
  category: "Venue", item: "", event: "ceremony",
  estimated: 0, actual: 0, paid: 0, vendor: "", notes: "",
};

export default function Budget() {
  const { rows, isLoading, create, update, remove } = useBudget();
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState<EventKey>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState<Partial<BudgetItem>>(emptyItem);
  const q = useDebounce(search);

  const filtered = useMemo(
    () =>
      rows
        .filter((b) => (eventFilter === "all" ? true : b.event === eventFilter))
        .filter((b) =>
          q.trim() ? `${b.item} ${b.category} ${b.vendor ?? ""}`.toLowerCase().includes(q.toLowerCase()) : true,
        ),
    [rows, eventFilter, q],
  );

  const estimated = sumBy(filtered, (b) => b.estimated);
  const actual = sumBy(filtered, (b) => b.actual);
  const paid = sumBy(filtered, (b) => b.paid);
  const remaining = actual - paid;
  const paidPct = actual ? Math.round((paid / actual) * 100) : 0;

  function openNew() {
    setDraft({ ...emptyItem, event: eventFilter === "all" ? "ceremony" : eventFilter });
    setDialogOpen(true);
  }
  function openEdit(b: BudgetItem) { setDraft(b); setDialogOpen(true); }
  function save() {
    if (!draft.item?.trim()) return;
    const payload = {
      ...draft,
      estimated: Number(draft.estimated) || 0,
      actual: Number(draft.actual) || 0,
      paid: Number(draft.paid) || 0,
    };
    if (draft.id) update(payload as BudgetItem);
    else create(payload);
    setDialogOpen(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Budget"
        subtitle="Plan estimates, log actual costs, and track what's been paid"
        action={<Button onClick={openNew} variant="accent"><Plus /> Add item</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Estimated" value={formatBDT(estimated)} icon={Wallet} accent="rose" />
        <StatCard label="Actual cost" value={formatBDT(actual)} icon={TrendingUp} accent="plum" />
        <StatCard label="Paid" value={formatBDT(paid)} hint={`${paidPct}% of actual`} icon={Wallet} accent="sage" />
        <StatCard label="Outstanding" value={formatBDT(remaining)} icon={Wallet} accent="marigold" />
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-2 flex justify-between text-sm">
          <span className="font-medium">Paid {formatBDT(paid)}</span>
          <span className="text-muted-foreground">of {formatBDT(actual || estimated)}</span>
        </div>
        <Progress value={paidPct} indicatorClassName="bg-sage" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar value={search} onChange={setSearch} placeholder="Search items, categories…" className="sm:max-w-xs" />
        <EventFilter value={eventFilter} onChange={setEventFilter} />
      </div>

      {isLoading ? (
        <Skeleton className="h-72 w-full" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No budget items"
          description="Add line items to see estimates, actuals, and what's still owed in real Taka."
          action={<Button onClick={openNew} variant="accent"><Plus /> Add item</Button>}
        />
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Event</TableHead>
                <TableHead className="text-right">Estimated</TableHead>
                <TableHead className="text-right">Actual</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Owed</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((b) => {
                const owed = (b.actual || 0) - (b.paid || 0);
                return (
                  <TableRow key={b.id}>
                    <TableCell>
                      <div className="font-medium">{b.item}</div>
                      <div className="text-xs text-muted-foreground">{b.category}{b.vendor ? ` · ${b.vendor}` : ""}</div>
                    </TableCell>
                    <TableCell><EventBadge event={b.event} /></TableCell>
                    <TableCell className="text-right text-muted-foreground">{formatBDT(b.estimated)}</TableCell>
                    <TableCell className="text-right">{formatBDT(b.actual)}</TableCell>
                    <TableCell className="text-right text-sage">{formatBDT(b.paid)}</TableCell>
                    <TableCell className={cn("text-right font-medium", owed > 0 ? "text-marigold-700" : "text-muted-foreground")}>
                      {formatBDT(owed)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(b)} aria-label="Edit"><Pencil /></Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(b.id)} aria-label="Delete"><Trash2 className="text-red-500" /></Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{draft.id ? "Edit item" : "Add budget item"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="item">Item</Label>
              <Input id="item" value={draft.item ?? ""} onChange={(e) => setDraft({ ...draft, item: e.target.value })} placeholder="e.g. Community hall booking" autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={draft.category} onValueChange={(v) => setDraft({ ...draft, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Event</Label>
                <Select value={draft.event} onValueChange={(v) => setDraft({ ...draft, event: v as EventKey })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{EVENTS.map((e) => <SelectItem key={e.key} value={e.key}>{e.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="est">Estimated (৳)</Label>
                <Input id="est" type="number" value={draft.estimated ?? 0} onChange={(e) => setDraft({ ...draft, estimated: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="act">Actual (৳)</Label>
                <Input id="act" type="number" value={draft.actual ?? 0} onChange={(e) => setDraft({ ...draft, actual: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="paid">Paid (৳)</Label>
                <Input id="paid" type="number" value={draft.paid ?? 0} onChange={(e) => setDraft({ ...draft, paid: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vendor">Vendor</Label>
                <Input id="vendor" value={draft.vendor ?? ""} onChange={(e) => setDraft({ ...draft, vendor: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bnotes">Notes</Label>
              <Textarea id="bnotes" value={draft.notes ?? ""} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save} variant="accent">{draft.id ? "Save changes" : "Add item"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
