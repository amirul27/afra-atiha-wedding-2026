import { useMemo, useState } from "react";
import { Users, Plus, Pencil, Trash2, Check } from "lucide-react";
import { useGuests } from "@/hooks/useGuests";
import { useDebounce } from "@/hooks/useDebounce";
import type { EventKey, Guest, RsvpStatus } from "@/types";
import { EVENTS } from "@/config/events";
import { sumBy } from "@/lib/utils";

import { PageHeader, SearchBar, EmptyState } from "@/components/shared/SearchBar";
import { EventBadge, EventFilter } from "@/components/shared/EventBadge";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

const rsvpMeta: Record<RsvpStatus, { label: string; variant: "success" | "warning" | "danger" | "secondary" }> = {
  yes: { label: "Confirmed", variant: "success" },
  pending: { label: "Pending", variant: "secondary" },
  maybe: { label: "Maybe", variant: "warning" },
  no: { label: "Declined", variant: "danger" },
};

const emptyGuest: Partial<Guest> = {
  name: "",
  phone: "",
  email: "",
  side: "bride",
  event: "ceremony",
  rsvp: "pending",
  partySize: 1,
  tableNo: "",
  notes: "",
  invitationSent: false,
};

export default function Guests() {
  const { rows, isLoading, create, update, remove } = useGuests();
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState<EventKey>("all");
  const [rsvpFilter, setRsvpFilter] = useState<RsvpStatus | "all">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState<Partial<Guest>>(emptyGuest);

  const q = useDebounce(search);

  const filtered = useMemo(
    () =>
      rows
        .filter((g) => (eventFilter === "all" ? true : g.event === eventFilter))
        .filter((g) => (rsvpFilter === "all" ? true : g.rsvp === rsvpFilter))
        .filter((g) =>
          q.trim()
            ? `${g.name} ${g.phone ?? ""} ${g.email ?? ""}`.toLowerCase().includes(q.toLowerCase())
            : true,
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [rows, eventFilter, rsvpFilter, q],
  );

  const confirmed = rows.filter((g) => g.rsvp === "yes");
  const headcount = sumBy(confirmed, (g) => g.partySize);
  const pendingInvites = rows.filter((g) => !g.invitationSent).length;

  function openNew() {
    setDraft({ ...emptyGuest, event: eventFilter === "all" ? "ceremony" : eventFilter });
    setDialogOpen(true);
  }
  function openEdit(g: Guest) {
    setDraft(g);
    setDialogOpen(true);
  }
  function save() {
    if (!draft.name?.trim()) return;
    const payload = { ...draft, partySize: Number(draft.partySize) || 1 };
    if (draft.id) update(payload as Guest);
    else create(payload);
    setDialogOpen(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Guests"
        subtitle={`${headcount} confirmed heads across ${rows.length} invitations`}
        action={
          <Button onClick={openNew} variant="accent">
            <Plus /> Add guest
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total invitations" value={rows.length} icon={Users} accent="plum" />
        <StatCard label="Confirmed heads" value={headcount} hint={`${confirmed.length} parties`} icon={Check} accent="sage" />
        <StatCard label="Invitations to send" value={pendingInvites} icon={Users} accent="marigold" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by name, phone, email…" className="sm:max-w-xs" />
        <EventFilter value={eventFilter} onChange={setEventFilter} />
        <Select value={rsvpFilter} onValueChange={(v) => setRsvpFilter(v as RsvpStatus | "all")}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="RSVP" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All RSVPs</SelectItem>
            <SelectItem value="yes">Confirmed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="maybe">Maybe</SelectItem>
            <SelectItem value="no">Declined</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Skeleton className="h-72 w-full" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No guests yet"
          description="Start your guest list. You can sort everyone by event and track RSVPs as replies come in."
          action={<Button onClick={openNew} variant="accent"><Plus /> Add guest</Button>}
        />
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Side</TableHead>
                <TableHead>Party</TableHead>
                <TableHead>RSVP</TableHead>
                <TableHead>Invite</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((g) => (
                <TableRow key={g.id}>
                  <TableCell>
                    <div className="font-medium">{g.name}</div>
                    <div className="text-xs text-muted-foreground">{g.phone || g.email || "—"}</div>
                  </TableCell>
                  <TableCell><EventBadge event={g.event} /></TableCell>
                  <TableCell className="capitalize text-sm text-muted-foreground">{g.side}</TableCell>
                  <TableCell className="text-sm">{g.partySize}{g.tableNo ? ` · T${g.tableNo}` : ""}</TableCell>
                  <TableCell>
                    <Select value={g.rsvp} onValueChange={(v) => update({ id: g.id, rsvp: v as RsvpStatus })}>
                      <SelectTrigger className="h-8 w-[130px]">
                        <Badge variant={rsvpMeta[g.rsvp].variant}>{rsvpMeta[g.rsvp].label}</Badge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Confirmed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="maybe">Maybe</SelectItem>
                        <SelectItem value="no">Declined</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant={g.invitationSent ? "secondary" : "outline"}
                      onClick={() => update({ id: g.id, invitationSent: !g.invitationSent })}
                    >
                      {g.invitationSent ? "Sent" : "Mark sent"}
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(g)} aria-label="Edit"><Pencil /></Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(g.id)} aria-label="Delete"><Trash2 className="text-red-500" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{draft.id ? "Edit guest" : "Add guest"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={draft.name ?? ""} onChange={(e) => setDraft({ ...draft, name: e.target.value })} autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={draft.phone ?? ""} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} placeholder="+880…" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={draft.email ?? ""} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Event</Label>
                <Select value={draft.event} onValueChange={(v) => setDraft({ ...draft, event: v as EventKey })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EVENTS.map((e) => <SelectItem key={e.key} value={e.key}>{e.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Side</Label>
                <Select value={draft.side} onValueChange={(v) => setDraft({ ...draft, side: v as Guest["side"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bride">Bride</SelectItem>
                    <SelectItem value="groom">Groom</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="party">Party size</Label>
                <Input id="party" type="number" min={1} value={draft.partySize ?? 1} onChange={(e) => setDraft({ ...draft, partySize: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="table">Table no.</Label>
                <Input id="table" value={draft.tableNo ?? ""} onChange={(e) => setDraft({ ...draft, tableNo: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gnotes">Notes</Label>
              <Textarea id="gnotes" value={draft.notes ?? ""} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} placeholder="Dietary needs, relation, etc." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save} variant="accent">{draft.id ? "Save changes" : "Add guest"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
