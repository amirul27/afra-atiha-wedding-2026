import { useMemo, useState } from "react";
import { Store, Plus, Pencil, Trash2, Phone, Mail } from "lucide-react";
import { useVendors } from "@/hooks/useVendors";
import { useDebounce } from "@/hooks/useDebounce";
import type { EventKey, Vendor, VendorStatus } from "@/types";
import { EVENTS } from "@/config/events";
import { formatBDT, sumBy } from "@/lib/utils";

import { PageHeader, SearchBar, EmptyState } from "@/components/shared/SearchBar";
import { EventBadge, EventFilter } from "@/components/shared/EventBadge";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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

const statusMeta: Record<VendorStatus, { label: string; variant: "secondary" | "warning" | "success" | "danger" }> = {
  researching: { label: "Researching", variant: "secondary" },
  contacted: { label: "Contacted", variant: "warning" },
  booked: { label: "Booked", variant: "success" },
  paid: { label: "Paid", variant: "success" },
  cancelled: { label: "Cancelled", variant: "danger" },
};

const CATEGORIES = [
  "Venue", "Caterer", "Photographer", "Videographer", "Decorator",
  "Makeup Artist", "Mehndi Artist", "DJ / Band", "Card Printer", "Car Rental", "Other",
];

const emptyVendor: Partial<Vendor> = {
  name: "", category: "Venue", event: "ceremony", contactName: "",
  phone: "", email: "", status: "researching", cost: 0, deposit: 0, notes: "",
};

export default function Vendors() {
  const { rows, isLoading, create, update, remove } = useVendors();
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState<EventKey>("all");
  const [statusFilter, setStatusFilter] = useState<VendorStatus | "all">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState<Partial<Vendor>>(emptyVendor);
  const q = useDebounce(search);

  const filtered = useMemo(
    () =>
      rows
        .filter((v) => (eventFilter === "all" ? true : v.event === eventFilter))
        .filter((v) => (statusFilter === "all" ? true : v.status === statusFilter))
        .filter((v) =>
          q.trim() ? `${v.name} ${v.category} ${v.contactName ?? ""}`.toLowerCase().includes(q.toLowerCase()) : true,
        ),
    [rows, eventFilter, statusFilter, q],
  );

  const booked = rows.filter((v) => v.status === "booked" || v.status === "paid").length;
  const totalCost = sumBy(rows, (v) => v.cost);
  const deposits = sumBy(rows, (v) => v.deposit);

  function openNew() {
    setDraft({ ...emptyVendor, event: eventFilter === "all" ? "ceremony" : eventFilter });
    setDialogOpen(true);
  }
  function openEdit(v: Vendor) { setDraft(v); setDialogOpen(true); }
  function save() {
    if (!draft.name?.trim()) return;
    const payload = { ...draft, cost: Number(draft.cost) || 0, deposit: Number(draft.deposit) || 0 };
    if (draft.id) update(payload as Vendor);
    else create(payload);
    setDialogOpen(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendors"
        subtitle={`${booked} booked · ${rows.length} in the pipeline`}
        action={<Button onClick={openNew} variant="accent"><Plus /> Add vendor</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Vendors booked" value={`${booked}/${rows.length}`} icon={Store} accent="sage" />
        <StatCard label="Total quoted" value={formatBDT(totalCost)} icon={Store} accent="plum" />
        <StatCard label="Deposits paid" value={formatBDT(deposits)} icon={Store} accent="marigold" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar value={search} onChange={setSearch} placeholder="Search vendors…" className="sm:max-w-xs" />
        <EventFilter value={eventFilter} onChange={setEventFilter} />
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as VendorStatus | "all")}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {Object.entries(statusMeta).map(([k, m]) => <SelectItem key={k} value={k}>{m.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Store}
          title="No vendors yet"
          description="Track every caterer, photographer, and decorator from first call to final payment."
          action={<Button onClick={openNew} variant="accent"><Plus /> Add vendor</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((v) => (
            <Card key={v.id} className="group flex flex-col">
              <CardContent className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-display text-base font-semibold">{v.name}</h3>
                    <p className="text-xs text-muted-foreground">{v.category}</p>
                  </div>
                  <Select value={v.status} onValueChange={(s) => update({ id: v.id, status: s as VendorStatus })}>
                    <SelectTrigger className="h-7 w-auto border-0 bg-transparent p-0 shadow-none">
                      <Badge variant={statusMeta[v.status].variant}>{statusMeta[v.status].label}</Badge>
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusMeta).map(([k, m]) => <SelectItem key={k} value={k}>{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="mt-3"><EventBadge event={v.event} /></div>

                <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                  {v.contactName && <p>{v.contactName}</p>}
                  {v.phone && <a href={`tel:${v.phone}`} className="flex items-center gap-1.5 hover:text-plum-600"><Phone className="h-3.5 w-3.5" />{v.phone}</a>}
                  {v.email && <a href={`mailto:${v.email}`} className="flex items-center gap-1.5 hover:text-plum-600"><Mail className="h-3.5 w-3.5" />{v.email}</a>}
                </div>

                <div className="mt-auto flex items-end justify-between pt-4">
                  <div>
                    <p className="font-display text-lg font-semibold">{formatBDT(v.cost)}</p>
                    {v.deposit > 0 && <p className="text-xs text-muted-foreground">Deposit {formatBDT(v.deposit)}</p>}
                  </div>
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(v)} aria-label="Edit"><Pencil /></Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(v.id)} aria-label="Delete"><Trash2 className="text-red-500" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{draft.id ? "Edit vendor" : "Add vendor"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="vname">Business name</Label>
                <Input id="vname" value={draft.name ?? ""} onChange={(e) => setDraft({ ...draft, name: e.target.value })} autoFocus />
              </div>
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
                <Label htmlFor="contact">Contact person</Label>
                <Input id="contact" value={draft.contactName ?? ""} onChange={(e) => setDraft({ ...draft, contactName: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v as VendorStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(statusMeta).map(([k, m]) => <SelectItem key={k} value={k}>{m.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vphone">Phone</Label>
                <Input id="vphone" value={draft.phone ?? ""} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vemail">Email</Label>
                <Input id="vemail" type="email" value={draft.email ?? ""} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cost">Total cost (৳)</Label>
                <Input id="cost" type="number" value={draft.cost ?? 0} onChange={(e) => setDraft({ ...draft, cost: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="deposit">Deposit (৳)</Label>
                <Input id="deposit" type="number" value={draft.deposit ?? 0} onChange={(e) => setDraft({ ...draft, deposit: Number(e.target.value) })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vnotes">Notes</Label>
              <Textarea id="vnotes" value={draft.notes ?? ""} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save} variant="accent">{draft.id ? "Save changes" : "Add vendor"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
