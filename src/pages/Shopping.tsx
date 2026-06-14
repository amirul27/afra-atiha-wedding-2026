import { useMemo, useState } from "react";
import { ShoppingBag, Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import { useShopping } from "@/hooks/useShopping";
import { useDebounce } from "@/hooks/useDebounce";
import type { EventKey, ShoppingItem, ShoppingStatus } from "@/types";
import { EVENTS } from "@/config/events";
import { cn, formatBDT, sumBy } from "@/lib/utils";

import { PageHeader, SearchBar, EmptyState } from "@/components/shared/SearchBar";
import { EventBadge, EventFilter } from "@/components/shared/EventBadge";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

const COLUMNS: { key: ShoppingStatus; label: string; accent: string }[] = [
  { key: "to_buy", label: "To buy", accent: "border-t-marigold" },
  { key: "ordered", label: "Ordered", accent: "border-t-plum-400" },
  { key: "received", label: "Received", accent: "border-t-sage" },
];

const CATEGORIES = ["Outfits", "Jewelry", "Shoes", "Gifts & Tattwa", "Decor", "Beauty", "Stationery", "Other"];

const emptyItem: Partial<ShoppingItem> = {
  item: "", category: "Outfits", event: "ceremony", forWhom: "",
  status: "to_buy", price: 0, store: "", link: "", notes: "",
};

export default function Shopping() {
  const { rows, isLoading, create, update, remove } = useShopping();
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState<EventKey>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState<Partial<ShoppingItem>>(emptyItem);
  const q = useDebounce(search);

  const filtered = useMemo(
    () =>
      rows
        .filter((s) => (eventFilter === "all" ? true : s.event === eventFilter))
        .filter((s) =>
          q.trim() ? `${s.item} ${s.category} ${s.forWhom ?? ""} ${s.store ?? ""}`.toLowerCase().includes(q.toLowerCase()) : true,
        ),
    [rows, eventFilter, q],
  );

  const received = rows.filter((s) => s.status === "received").length;
  const totalSpend = sumBy(rows.filter((s) => s.status === "received"), (s) => s.price);
  const planned = sumBy(rows, (s) => s.price);

  function openNew() {
    setDraft({ ...emptyItem, event: eventFilter === "all" ? "ceremony" : eventFilter });
    setDialogOpen(true);
  }
  function openEdit(s: ShoppingItem) { setDraft(s); setDialogOpen(true); }
  function save() {
    if (!draft.item?.trim()) return;
    const payload = { ...draft, price: Number(draft.price) || 0 };
    if (draft.id) update(payload as ShoppingItem);
    else create(payload);
    setDialogOpen(false);
  }

  function advance(s: ShoppingItem) {
    const order: ShoppingStatus[] = ["to_buy", "ordered", "received"];
    const next = order[(order.indexOf(s.status) + 1) % order.length];
    update({ id: s.id, status: next });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shopping"
        subtitle="Track outfits, jewelry, gifts and everything in between"
        action={<Button onClick={openNew} variant="accent"><Plus /> Add item</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Items received" value={`${received}/${rows.length}`} icon={ShoppingBag} accent="sage" />
        <StatCard label="Spent so far" value={formatBDT(totalSpend)} icon={ShoppingBag} accent="plum" />
        <StatCard label="Planned total" value={formatBDT(planned)} icon={ShoppingBag} accent="marigold" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar value={search} onChange={setSearch} placeholder="Search items…" className="sm:max-w-xs" />
        <EventFilter value={eventFilter} onChange={setEventFilter} />
      </div>

      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-72 w-full" />)}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Nothing on the list yet"
          description="Add your first item and move it from 'To buy' to 'Received' as you shop."
          action={<Button onClick={openNew} variant="accent"><Plus /> Add item</Button>}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {COLUMNS.map((col) => {
            const items = filtered.filter((s) => s.status === col.key);
            return (
              <div key={col.key} className={cn("rounded-xl border border-t-4 border-border bg-secondary/30 p-3", col.accent)}>
                <div className="mb-3 flex items-center justify-between px-1">
                  <h3 className="font-display text-sm font-semibold uppercase tracking-wide">{col.label}</h3>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-muted-foreground">{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.length === 0 && <p className="px-1 py-6 text-center text-xs text-muted-foreground">Nothing here</p>}
                  {items.map((s) => (
                    <Card key={s.id} className="group p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{s.item}</p>
                          <p className="text-xs text-muted-foreground">
                            {s.category}{s.forWhom ? ` · for ${s.forWhom}` : ""}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-medium">{formatBDT(s.price)}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <EventBadge event={s.event} />
                        {s.link && (
                          <a href={s.link} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-plum-600">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-1">
                        <Button size="sm" variant="outline" className="h-7 flex-1 text-xs" onClick={() => advance(s)}>
                          {s.status === "received" ? "Reset" : "Move →"}
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100" onClick={() => openEdit(s)} aria-label="Edit"><Pencil /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100" onClick={() => remove(s.id)} aria-label="Delete"><Trash2 className="text-red-500" /></Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{draft.id ? "Edit item" : "Add shopping item"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="sitem">Item</Label>
              <Input id="sitem" value={draft.item ?? ""} onChange={(e) => setDraft({ ...draft, item: e.target.value })} placeholder="e.g. Bridal lehenga" autoFocus />
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
                <Label htmlFor="forwhom">For whom</Label>
                <Input id="forwhom" value={draft.forWhom ?? ""} onChange={(e) => setDraft({ ...draft, forWhom: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v as ShoppingStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="to_buy">To buy</SelectItem>
                    <SelectItem value="ordered">Ordered</SelectItem>
                    <SelectItem value="received">Received</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="price">Price (৳)</Label>
                <Input id="price" type="number" value={draft.price ?? 0} onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="store">Store</Label>
                <Input id="store" value={draft.store ?? ""} onChange={(e) => setDraft({ ...draft, store: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="link">Link</Label>
              <Input id="link" value={draft.link ?? ""} onChange={(e) => setDraft({ ...draft, link: e.target.value })} placeholder="https://…" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="snotes">Notes</Label>
              <Textarea id="snotes" value={draft.notes ?? ""} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
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
