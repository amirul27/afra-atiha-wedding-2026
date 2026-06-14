import { useMemo, useRef, useState } from "react";
import {
  FileText,
  Plus,
  Trash2,
  ExternalLink,
  UploadCloud,
  Image as ImageIcon,
  File as FileIcon,
  Loader2,
} from "lucide-react";
import { useDocuments } from "@/hooks/useDocuments";
import { useDebounce } from "@/hooks/useDebounce";
import { uploadFile, fileToBase64 } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import type { EventKey, WeddingDocument } from "@/types";
import { EVENTS } from "@/config/events";
import { formatDate } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

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

const CATEGORIES = [
  "Contracts",
  "Invoices & Receipts",
  "Inspiration",
  "Photos",
  "Guest List",
  "Permits & ID",
  "Other",
];

const MAX_BYTES = 25 * 1024 * 1024; // 25MB — keep Apps Script payloads sane

function isImage(doc: WeddingDocument) {
  return (doc.mimeType ?? "").startsWith("image/");
}

interface DraftMeta {
  name: string;
  category: string;
  event: EventKey;
  notes: string;
}

const emptyMeta: DraftMeta = {
  name: "",
  category: "Contracts",
  event: "ceremony",
  notes: "",
};

export default function Documents() {
  const { rows, isLoading, remove } = useDocuments();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState<EventKey>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [meta, setMeta] = useState<DraftMeta>(emptyMeta);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const q = useDebounce(search);

  const filtered = useMemo(
    () =>
      rows
        .filter((d) => (eventFilter === "all" ? true : d.event === eventFilter))
        .filter((d) => (categoryFilter === "all" ? true : d.category === categoryFilter))
        .filter((d) =>
          q.trim()
            ? `${d.name} ${d.category} ${d.notes ?? ""}`.toLowerCase().includes(q.toLowerCase())
            : true,
        ),
    [rows, eventFilter, categoryFilter, q],
  );

  const photoCount = rows.filter(isImage).length;

  function openNew() {
    setMeta({ ...emptyMeta, event: eventFilter === "all" ? "ceremony" : eventFilter });
    setFile(null);
    setDialogOpen(true);
  }

  function onPickFile(f: File | null) {
    if (!f) return;
    if (f.size > MAX_BYTES) {
      toast({ variant: "error", title: "File too large", description: "Please keep uploads under 25 MB." });
      return;
    }
    setFile(f);
    // Default the document name to the file name (without extension) if empty.
    setMeta((m) => ({ ...m, name: m.name.trim() || f.name.replace(/\.[^./]+$/, "") }));
  }

  async function save() {
    if (!file) {
      toast({ variant: "error", title: "Choose a file", description: "Select a document or photo to upload." });
      return;
    }
    if (!meta.name.trim()) {
      toast({ variant: "error", title: "Name required" });
      return;
    }
    setUploading(true);
    try {
      const base64 = await fileToBase64(file);
      await uploadFile({
        collection: "documents",
        filename: file.name,
        mimeType: file.type || "application/octet-stream",
        base64,
        meta: {
          name: meta.name.trim(),
          category: meta.category,
          event: meta.event,
          notes: meta.notes,
        },
      });
      toast({ variant: "success", title: "Uploaded", description: "Saved to Google Drive." });
      qc.invalidateQueries({ queryKey: ["documents"] });
      setDialogOpen(false);
    } catch (err) {
      toast({
        variant: "error",
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        subtitle="Contracts, receipts, inspiration and photos — kept safe in Google Drive"
        action={<Button onClick={openNew} variant="accent"><Plus /> Upload</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Files stored" value={rows.length} icon={FileText} accent="plum" />
        <StatCard label="Photos" value={photoCount} icon={ImageIcon} accent="rose" />
        <StatCard label="Categories" value={new Set(rows.map((d) => d.category)).size} icon={FileIcon} accent="marigold" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        <SearchBar value={search} onChange={setSearch} placeholder="Search documents…" className="sm:max-w-xs" />
        <EventFilter value={eventFilter} onChange={setEventFilter} />
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[190px]"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44 w-full" />)}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={UploadCloud}
          title="No documents yet"
          description="Upload contracts, invoices, inspiration boards or photos. Everything lives in your Google Drive."
          action={<Button onClick={openNew} variant="accent"><Plus /> Upload a file</Button>}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nothing matches"
          description="Try a different search term or clear the filters."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((d) => (
            <Card key={d.id} className="group flex flex-col overflow-hidden">
              <a
                href={d.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="flex h-32 items-center justify-center border-b border-border bg-secondary/40 transition-colors hover:bg-secondary"
              >
                {isImage(d) && d.fileUrl ? (
                  <img
                    src={d.fileUrl}
                    alt={d.name}
                    loading="lazy"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      // Drive view links don't always render inline; fall back to an icon.
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <FileText className="h-10 w-10 text-plum-300" />
                )}
              </a>
              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 flex-1 truncate font-medium" title={d.name}>{d.name}</p>
                  <EventBadge event={d.event} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {d.category}{d.uploadedAt ? ` · ${formatDate(d.uploadedAt)}` : ""}
                </p>
                {d.notes && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{d.notes}</p>}
                <div className="mt-auto flex items-center gap-1 pt-3">
                  <Button asChild size="sm" variant="outline" className="h-8 flex-1 text-xs">
                    <a href={d.fileUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" /> Open
                    </a>
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => remove(d.id)}
                    aria-label="Delete"
                  >
                    <Trash2 className="text-red-500" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(o) => !uploading && setDialogOpen(o)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upload to Drive</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-secondary/30 px-4 py-8 text-center transition-colors hover:border-plum-300 hover:bg-secondary"
            >
              <UploadCloud className="mb-2 h-8 w-8 text-plum-400" />
              {file ? (
                <span className="text-sm font-medium text-foreground">{file.name}</span>
              ) : (
                <>
                  <span className="text-sm font-medium text-foreground">Click to choose a file</span>
                  <span className="mt-0.5 text-xs text-muted-foreground">PDF, image or document · up to 25 MB</span>
                </>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
            />

            <div className="space-y-1.5">
              <Label htmlFor="docname">Name</Label>
              <Input
                id="docname"
                value={meta.name}
                onChange={(e) => setMeta({ ...meta, name: e.target.value })}
                placeholder="e.g. Venue contract"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={meta.category} onValueChange={(v) => setMeta({ ...meta, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Event</Label>
                <Select value={meta.event} onValueChange={(v) => setMeta({ ...meta, event: v as EventKey })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{EVENTS.map((e) => <SelectItem key={e.key} value={e.key}>{e.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="docnotes">Notes</Label>
              <Textarea id="docnotes" value={meta.notes} onChange={(e) => setMeta({ ...meta, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={uploading}>Cancel</Button>
            <Button onClick={save} variant="accent" disabled={uploading}>
              {uploading ? (<><Loader2 className="animate-spin" /> Uploading…</>) : (<><UploadCloud /> Upload</>)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
