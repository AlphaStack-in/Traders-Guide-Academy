"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Download,
  Mail,
  Megaphone,
  MessageSquare,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { formatSignalDate, formatSignalTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  inviteSubscriber,
  updateSubscriber,
  type SubscriberInput,
} from "@/app/admin/(protected)/subscribers/actions";
import { exportMembersToExcel, type MemberExportRow } from "@/lib/export-excel";

export interface SubscriberRow {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  plan: string;
  batchNumber: number | null;
  referralStatus: "JOINED" | "INVITED" | "NOT_JOINED";
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

type SortKey = "createdAt" | "name" | "batchNumber" | "referralStatus";
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

function ReferralChip({ status }: { status: SubscriberRow["referralStatus"] }) {
  if (status === "JOINED") {
    return (
      <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs">
        Joined
      </Badge>
    );
  }
  if (status === "INVITED") {
    return (
      <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs">
        Invited
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-white/10 bg-white/5 text-muted-foreground text-xs">
      Not Joined
    </Badge>
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
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <Input
          value={draft.name}
          onChange={(e) => onChange({ ...draft, name: e.target.value })}
          placeholder="Name"
          className="h-9"
        />
      </div>
      <div>
        <Input
          value={draft.phone}
          onChange={(e) => onChange({ ...draft, phone: e.target.value })}
          placeholder="Phone"
          className="h-9"
        />
      </div>
      <div>
        <Input
          value={draft.email}
          onChange={(e) => onChange({ ...draft, email: e.target.value })}
          placeholder="Email (optional)"
          className="h-9"
        />
      </div>
      <div>
        <Input
          value={draft.batchNumber}
          onChange={(e) => onChange({ ...draft, batchNumber: e.target.value })}
          placeholder="Batch # (optional)"
          className="h-9"
          inputMode="numeric"
        />
      </div>
    </div>
  );
}

function AddMemberFullWidthPanel({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
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
        onOpenChange(false);
      } else {
        toast.error(result.error ?? "Failed to add member.");
      }
    });
  }

  if (!open) return null;

  return (
    <div className="thc-glass w-full flex flex-col gap-3 rounded-xl border border-white/10 p-4 transition-all">
      <div className="flex items-center justify-between">
        <Label className="font-heading text-sm font-semibold text-foreground">New Member Registration</Label>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          onClick={() => {
            setDraft(EMPTY_DRAFT);
            onOpenChange(false);
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <MemberDraftFields draft={draft} onChange={setDraft} />

      <div className="flex items-center justify-end gap-2 pt-1">
        <Button
          size="sm"
          variant="outline"
          className="h-8"
          disabled={isSaving}
          onClick={() => {
            setDraft(EMPTY_DRAFT);
            onOpenChange(false);
          }}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          className="thc-glow thc-btn-gradient h-8 px-4"
          disabled={isSaving}
          onClick={handleAdd}
        >
          {isSaving ? "Adding…" : "Add Member"}
        </Button>
      </div>
    </div>
  );
}

function SubscriberRowItem({
  subscriber,
  selected,
  onSelectChange,
}: {
  subscriber: SubscriberRow;
  selected: boolean;
  onSelectChange: (selected: boolean) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<MemberDraft>(() => toDraft(subscriber));
  const [deleteArmed, setDeleteArmed] = useState(false);
  const [isSaving, startSaving] = useTransition();
  const [isDeleting, startDeleting] = useTransition();
  const [isInviting, startInviting] = useTransition();

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

  function handleInviteClick() {
    if (!subscriber.email) {
      toast.error("Member does not have an email address.");
      return;
    }
    startInviting(async () => {
      const origin = typeof window !== "undefined" ? window.location.origin : undefined;
      const result = await inviteSubscriber(subscriber.id, origin);
      if (result.success) {
        toast.success(`Referral invitation sent to ${subscriber.email}.`);
      } else {
        toast.error(result.error || "Failed to send invitation.");
      }
    });
  }

  if (isEditing) {
    return (
      <TableRow className="border-b-white/5 bg-white/[0.02]">
        <TableCell />
        <TableCell className="whitespace-nowrap text-muted-foreground">
          {formatSignalDate(subscriber.createdAt)}{" "}
          <span className="text-xs">{formatSignalTime(subscriber.createdAt)}</span>
        </TableCell>
        <TableCell colSpan={6}>
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
    <TableRow className={selected ? "border-b-white/5 bg-white/[0.04]" : "border-b-white/5"}>
      <TableCell className="w-10">
        <Checkbox
          checked={selected}
          onCheckedChange={(checked) => onSelectChange(!!checked)}
          aria-label={`Select ${subscriber.name}`}
        />
      </TableCell>
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
        <ReferralChip status={subscriber.referralStatus} />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button
            asChild
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0"
            title="Send WhatsApp message"
            aria-label="Send WhatsApp message"
          >
            <a href={toWhatsAppLink(subscriber.phone)} target="_blank" rel="noopener noreferrer">
              <MessageSquare className="h-3.5 w-3.5 text-primary" />
            </a>
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0"
            disabled={isInviting}
            title={
              subscriber.referralStatus === "JOINED"
                ? "Member has already joined"
                : subscriber.email
                  ? `Send Referral Invite to ${subscriber.email}`
                  : "Add an email address to send invitation"
            }
            aria-label="Send Referral Invite"
            onClick={handleInviteClick}
          >
            <Mail
              className={
                subscriber.referralStatus === "JOINED"
                  ? "h-3.5 w-3.5 text-muted-foreground/40"
                  : "h-3.5 w-3.5 text-amber-400"
              }
            />
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0"
            title="Edit member"
            aria-label="Edit member"
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
                : "h-8 w-8 p-0 text-muted-foreground"
            }
            title={deleteArmed ? "Click again to confirm delete" : "Remove member"}
            aria-label="Delete member"
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
  const [addPanelOpen, setAddPanelOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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
        [s.name, s.phone, s.email ?? "", s.referralStatus].some((field) =>
          field.toLowerCase().includes(q),
        ),
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
      if (sort.key === "referralStatus") return sign * a.referralStatus.localeCompare(b.referralStatus);
      if (sort.key === "batchNumber") {
        return sign * ((a.batchNumber ?? -1) - (b.batchNumber ?? -1));
      }
      return sign * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    });
  }, [subscribers, query, batchFilter, sort]);

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((s) => selectedIds.has(s.id));
  const someFilteredSelected =
    filtered.some((s) => selectedIds.has(s.id)) && !allFilteredSelected;

  function toggleSelectAll(checked: boolean) {
    const next = new Set(selectedIds);
    if (checked) {
      for (const s of filtered) next.add(s.id);
    } else {
      for (const s of filtered) next.delete(s.id);
    }
    setSelectedIds(next);
  }

  function toggleSelectRow(id: string, selected: boolean) {
    const next = new Set(selectedIds);
    if (selected) next.add(id);
    else next.delete(id);
    setSelectedIds(next);
  }

  function mapToExportRow(s: SubscriberRow): MemberExportRow {
    return {
      "Registered Date": `${formatSignalDate(s.createdAt)} ${formatSignalTime(s.createdAt)}`,
      Name: s.name,
      Phone: s.phone,
      Email: s.email ?? "—",
      Plan: s.plan,
      Batch: s.batchNumber != null ? `Batch ${s.batchNumber}` : "—",
      "Referral Status":
        s.referralStatus === "JOINED"
          ? "Joined"
          : s.referralStatus === "INVITED"
            ? "Invited"
            : "Not Joined",
    };
  }

  function handleExportFiltered() {
    if (filtered.length === 0) {
      toast.error("No members match current filters.");
      return;
    }
    const exportData = filtered.map(mapToExportRow);
    exportMembersToExcel(exportData, `Registered_Members_Filtered_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success(`Exported ${filtered.length} member(s) to Excel.`);
  }

  function handleExportSelected() {
    const selectedRows = subscribers.filter((s) => selectedIds.has(s.id));
    if (selectedRows.length === 0) {
      toast.error("No members selected.");
      return;
    }
    const exportData = selectedRows.map(mapToExportRow);
    exportMembersToExcel(exportData, `Registered_Members_Selected_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success(`Exported ${selectedRows.length} selected member(s) to Excel.`);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, phone, email..."
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

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-9 gap-1.5"
            onClick={handleExportFiltered}
          >
            <Download className="h-4 w-4 text-primary" />
            Export Excel
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="h-9 gap-1.5"
            onClick={() => toast.info("Announcement feature development underway.")}
          >
            <Megaphone className="h-4 w-4" />
            Announcement
          </Button>

          <Button
            size="sm"
            className="thc-glow thc-btn-gradient h-9 gap-1.5"
            onClick={() => setAddPanelOpen((prev) => !prev)}
          >
            <Plus className="h-4 w-4" />
            Add Member
          </Button>
        </div>
      </div>

      <AddMemberFullWidthPanel open={addPanelOpen} onOpenChange={setAddPanelOpen} />

      {selectedIds.size > 0 && (
        <div className="thc-glass flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-primary">{selectedIds.size}</span>
            <span className="text-muted-foreground">member{selectedIds.size === 1 ? "" : "s"} selected</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 border-primary/40 bg-black/40 text-primary hover:bg-primary/20"
              onClick={handleExportSelected}
            >
              <Download className="h-3.5 w-3.5" />
              Export Selected (.xlsx)
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setSelectedIds(new Set())}
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      <div className="thc-glass overflow-hidden rounded-xl border border-white/5">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b-white/10 hover:bg-transparent">
                <TableHead className="w-10">
                  <Checkbox
                    checked={allFilteredSelected ? true : someFilteredSelected ? "indeterminate" : false}
                    onCheckedChange={(checked) => toggleSelectAll(!!checked)}
                    aria-label="Select all visible members"
                  />
                </TableHead>
                <SortableHead label="Registered" sortKey="createdAt" sort={sort} onSort={handleSort} />
                <SortableHead label="Name" sortKey="name" sort={sort} onSort={handleSort} />
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Plan</TableHead>
                <SortableHead label="Batch" sortKey="batchNumber" sort={sort} onSort={handleSort} />
                <SortableHead label="Referral" sortKey="referralStatus" sort={sort} onSort={handleSort} />
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={9}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    {subscribers.length === 0
                      ? "No members registered yet."
                      : "No members match your search or filter."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((s) => (
                  <SubscriberRowItem
                    key={s.id}
                    subscriber={s}
                    selected={selectedIds.has(s.id)}
                    onSelectChange={(selected) => toggleSelectRow(s.id, selected)}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
