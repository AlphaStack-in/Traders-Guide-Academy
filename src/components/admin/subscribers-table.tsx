"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Megaphone,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { formatSignalDate, formatSignalTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createSubscriber,
  deleteSubscriber,
  updateSubscriber,
  type SubscriberInput,
} from "@/app/admin/(protected)/subscribers/actions";

export interface SubscriberRow {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  plan: string;
  batchNumber: number | null;
  createdAt: string;
}

interface MemberDraft {
  name: string;
  phone: string;
  email: string;
  batchNumber: string;
}

const EMPTY_DRAFT: MemberDraft = { name: "", phone: "", email: "", batchNumber: "" };

function toDraft(subscriber: SubscriberRow): MemberDraft {
  return {
    name: subscriber.name,
    phone: subscriber.phone,
    email: subscriber.email ?? "",
    batchNumber: subscriber.batchNumber != null ? String(subscriber.batchNumber) : "",
  };
}

function draftToInput(draft: MemberDraft): SubscriberInput | { error: string } {
  const name = draft.name.trim();
  const phone = draft.phone.trim();
  if (!name || !phone) {
    return { error: "Name and phone are required." };
  }
  const batchNumber = draft.batchNumber.trim() === "" ? null : parseInt(draft.batchNumber, 10);
  if (batchNumber != null && !Number.isFinite(batchNumber)) {
    return { error: "Batch must be a valid number." };
  }
  return { name, phone, email: draft.email.trim() || null, batchNumber };
}

function toWhatsAppLink(phone: string) {
  return `https://wa.me/${phone.replace(/\D/g, "")}`;
}

type SortKey = "createdAt" | "name" | "batchNumber";
type SortDirection = "asc" | "desc";
interface SortState {
  key: SortKey;
  direction: SortDirection;
}

function SortableHead({
  label,
  sortKey,
  sort,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  sort: SortState;
  onSort: (key: SortKey) => void;
}) {
  const isActive = sort.key === sortKey;
  return (
    <TableHead>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
      >
        {label}
        {isActive ? (
          sort.direction === "asc" ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-40" />
        )}
      </button>
    </TableHead>
  );
}

function MemberDraftFields({
  draft,
  onChange,
}: {
  draft: MemberDraft;
  onChange: (draft: MemberDraft) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <Input
        value={draft.name}
        onChange={(e) => onChange({ ...draft, name: e.target.value })}
        placeholder="Name"
        className="h-8"
      />
      <Input
        value={draft.phone}
        onChange={(e) => onChange({ ...draft, phone: e.target.value })}
        placeholder="Phone"
        className="h-8"
      />
      <Input
        value={draft.email}
        onChange={(e) => onChange({ ...draft, email: e.target.value })}
        placeholder="Email (optional)"
        className="h-8"
      />
      <Input
        value={draft.batchNumber}
        onChange={(e) => onChange({ ...draft, batchNumber: e.target.value })}
        placeholder="Batch # (optional)"
        className="h-8"
        inputMode="numeric"
      />
    </div>
  );
}

function AddMemberPanel() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<MemberDraft>(EMPTY_DRAFT);
  const [isSaving, startSaving] = useTransition();

  function handleAdd() {
    const input = draftToInput(draft);
    if ("error" in input) {
      toast.error(input.error);
      return;
    }
    startSaving(async () => {
      const result = await createSubscriber(input);
      if (result.success) {
        toast.success(`${input.name} added.`);
        setDraft(EMPTY_DRAFT);
        setOpen(false);
      } else {
        toast.error(result.error ?? "Failed to add member.");
      }
    });
  }

  if (!open) {
    return (
      <Button size="sm" className="thc-glow thc-btn-gradient h-9 gap-1.5" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Add Member
      </Button>
    );
  }

  return (
    <div className="thc-glass flex flex-col gap-2 rounded-xl border border-white/5 p-3">
      <Label className="text-xs text-muted-foreground">New member</Label>
      <MemberDraftFields draft={draft} onChange={setDraft} />
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          className="thc-glow thc-btn-gradient h-8"
          disabled={isSaving}
          onClick={handleAdd}
        >
          {isSaving ? "Adding…" : "Add"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8"
          disabled={isSaving}
          onClick={() => {
            setDraft(EMPTY_DRAFT);
            setOpen(false);
          }}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function SubscriberRowItem({ subscriber }: { subscriber: SubscriberRow }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<MemberDraft>(() => toDraft(subscriber));
  const [deleteArmed, setDeleteArmed] = useState(false);
  const [isSaving, startSaving] = useTransition();
  const [isDeleting, startDeleting] = useTransition();

  function startEdit() {
    setDraft(toDraft(subscriber));
    setIsEditing(true);
  }

  function handleSave() {
    const input = draftToInput(draft);
    if ("error" in input) {
      toast.error(input.error);
      return;
    }
    startSaving(async () => {
      const result = await updateSubscriber(subscriber.id, input);
      if (result.success) {
        toast.success(`${input.name} updated.`);
        setIsEditing(false);
      } else {
        toast.error(result.error ?? "Failed to update member.");
      }
    });
  }

  function handleDeleteClick() {
    if (!deleteArmed) {
      setDeleteArmed(true);
      setTimeout(() => setDeleteArmed(false), 4000);
      return;
    }
    startDeleting(async () => {
      const result = await deleteSubscriber(subscriber.id);
      if (result.success) {
        toast.success(`${subscriber.name} removed.`);
      } else {
        toast.error("Failed to delete member.");
      }
    });
  }

  if (isEditing) {
    return (
      <TableRow className="border-b-white/5 bg-white/[0.02]">
        <TableCell className="whitespace-nowrap text-muted-foreground">
          {formatSignalDate(subscriber.createdAt)}{" "}
          <span className="text-xs">{formatSignalTime(subscriber.createdAt)}</span>
        </TableCell>
        <TableCell colSpan={5}>
          <MemberDraftFields draft={draft} onChange={setDraft} />
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              className="thc-glow thc-btn-gradient h-8"
              disabled={isSaving}
              onClick={handleSave}
            >
              {isSaving ? "Saving…" : "Save"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8"
              disabled={isSaving}
              onClick={() => setIsEditing(false)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow className="border-b-white/5">
      <TableCell className="whitespace-nowrap text-muted-foreground">
        {formatSignalDate(subscriber.createdAt)}{" "}
        <span className="text-xs">{formatSignalTime(subscriber.createdAt)}</span>
      </TableCell>
      <TableCell className="whitespace-nowrap font-medium">{subscriber.name}</TableCell>
      <TableCell className="whitespace-nowrap">
        <a href={`tel:${subscriber.phone}`} className="text-primary">
          {subscriber.phone}
        </a>
      </TableCell>
      <TableCell className="whitespace-nowrap text-muted-foreground">
        {subscriber.email ?? "—"}
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="thc-gold-border text-xs">
          {subscriber.plan}
        </Badge>
      </TableCell>
      <TableCell className="whitespace-nowrap text-muted-foreground">
        {subscriber.batchNumber != null ? `Batch ${subscriber.batchNumber}` : "—"}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1.5">
          <Button asChild size="sm" variant="outline" className="thc-glow h-8">
            <a href={toWhatsAppLink(subscriber.phone)} target="_blank" rel="noopener noreferrer">
              Message
            </a>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0"
            title="Edit member"
            onClick={startEdit}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={isDeleting}
            className={
              deleteArmed
                ? "h-8 gap-1 px-2 border-[var(--thc-loss)]/60 text-[var(--thc-loss)]"
                : "h-8 gap-1 px-2 text-muted-foreground"
            }
            title={deleteArmed ? "Click again to confirm delete" : "Remove member"}
            onClick={handleDeleteClick}
          >
            <Trash2 className="h-3.5 w-3.5" />
            {deleteArmed && <span className="text-xs">Confirm?</span>}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function SubscribersTable({ subscribers }: { subscribers: SubscriberRow[] }) {
  const [query, setQuery] = useState("");
  const [batchFilter, setBatchFilter] = useState("all");
  const [sort, setSort] = useState<SortState>({ key: "createdAt", direction: "desc" });

  const batchNumbers = useMemo(() => {
    const set = new Set<number>();
    for (const s of subscribers) {
      if (s.batchNumber != null) set.add(s.batchNumber);
    }
    return Array.from(set).sort((a, b) => b - a);
  }, [subscribers]);
  const hasUnassigned = subscribers.some((s) => s.batchNumber == null);

  function handleSort(key: SortKey) {
    setSort((prev) => {
      if (prev.key !== key) return { key, direction: key === "createdAt" ? "desc" : "asc" };
      return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
    });
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = subscribers;
    if (q) {
      rows = rows.filter((s) =>
        [s.name, s.phone, s.email ?? ""].some((field) => field.toLowerCase().includes(q)),
      );
    }
    if (batchFilter !== "all") {
      rows = rows.filter((s) =>
        batchFilter === "unassigned" ? s.batchNumber == null : String(s.batchNumber) === batchFilter,
      );
    }

    const sign = sort.direction === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      if (sort.key === "name") return sign * a.name.localeCompare(b.name);
      if (sort.key === "batchNumber") {
        return sign * ((a.batchNumber ?? -1) - (b.batchNumber ?? -1));
      }
      return sign * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    });
  }, [subscribers, query, batchFilter, sort]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, phone, or email…"
              className="pl-9"
            />
          </div>
          <Select value={batchFilter} onValueChange={setBatchFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Batch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All batches</SelectItem>
              {batchNumbers.map((b) => (
                <SelectItem key={b} value={String(b)}>
                  Batch {b}
                </SelectItem>
              ))}
              {hasUnassigned && <SelectItem value="unassigned">Unassigned</SelectItem>}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-9 gap-1.5"
            onClick={() => toast.info("Feature development underway.")}
          >
            <Megaphone className="h-4 w-4" />
            Announcement
          </Button>
          <AddMemberPanel />
        </div>
      </div>

      <div className="thc-glass overflow-hidden rounded-xl border border-white/5">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b-white/10 hover:bg-transparent">
                <SortableHead label="Registered" sortKey="createdAt" sort={sort} onSort={handleSort} />
                <SortableHead label="Name" sortKey="name" sort={sort} onSort={handleSort} />
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Plan</TableHead>
                <SortableHead label="Batch" sortKey="batchNumber" sort={sort} onSort={handleSort} />
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={7}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    {subscribers.length === 0
                      ? "No members registered yet."
                      : "No members match your filters."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((s) => <SubscriberRowItem key={s.id} subscriber={s} />)
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
