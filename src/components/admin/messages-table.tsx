"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Mail, Trash2 } from "lucide-react";
import { formatSignalDate, formatSignalTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WhatsAppIcon } from "@/components/site/icons";
import { replyToMessage, deleteMessage } from "@/app/admin/(protected)/messages/actions";

export interface MessageRow {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  message: string;
  status: string;
  replyText: string | null;
  repliedAt: string | null;
  createdAt: string;
}

function toWhatsAppLink(phone: string) {
  return `https://wa.me/${phone.replace(/\D/g, "")}`;
}

function MessageRowItem({ message }: { message: MessageRow }) {
  const [expanded, setExpanded] = useState(false);
  const [replyText, setReplyText] = useState(message.replyText ?? "");
  const [deleteArmed, setDeleteArmed] = useState(false);
  const [isReplying, startReplying] = useTransition();
  const [isDeleting, startDeleting] = useTransition();

  function handleReply() {
    startReplying(async () => {
      const result = await replyToMessage(message.id, replyText);
      if (result.success) {
        toast.success(`Reply saved for ${message.name}.`);
      } else {
        toast.error(result.error ?? "Failed to save reply.");
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
      const result = await deleteMessage(message.id);
      if (result.success) {
        toast.success(`Message from ${message.name} deleted.`);
      } else {
        toast.error("Failed to delete message.");
      }
    });
  }

  return (
    <>
      <TableRow className="border-b-white/5 cursor-pointer" onClick={() => setExpanded((v) => !v)}>
        <TableCell className="whitespace-nowrap text-muted-foreground">
          {formatSignalDate(message.createdAt)}{" "}
          <span className="text-xs">{formatSignalTime(message.createdAt)}</span>
        </TableCell>
        <TableCell className="whitespace-nowrap font-medium">
          {message.name}
          <div className="text-xs text-muted-foreground">{message.phone}</div>
        </TableCell>
        <TableCell className="max-w-xs truncate text-muted-foreground">
          {message.message}
        </TableCell>
        <TableCell>
          <Badge variant={message.status === "REPLIED" ? "secondary" : "default"}>
            {message.status === "REPLIED" ? "Replied" : "New"}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1 px-2 text-muted-foreground"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded((v) => !v);
              }}
            >
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={isDeleting}
              className={
                deleteArmed
                  ? "h-8 gap-1 px-2 border-[var(--signalflow-loss)]/60 text-[var(--signalflow-loss)]"
                  : "h-8 gap-1 px-2 text-muted-foreground"
              }
              title={deleteArmed ? "Click again to confirm delete" : "Delete message"}
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteClick();
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              {deleteArmed && <span className="text-xs">Confirm?</span>}
            </Button>
          </div>
        </TableCell>
      </TableRow>
      {expanded && (
        <TableRow className="border-b-white/5 hover:bg-transparent">
          <TableCell colSpan={5} className="bg-black/20">
            <div className="flex flex-col gap-4 py-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Message</p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{message.message}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline" className="signalflow-glow">
                  <a href={toWhatsAppLink(message.phone)} target="_blank" rel="noopener noreferrer">
                    <WhatsAppIcon className="h-4 w-4" />
                    WhatsApp
                  </a>
                </Button>
                {message.email && (
                  <Button asChild size="sm" variant="outline" className="signalflow-glow">
                    <a href={`mailto:${message.email}`}>
                      <Mail className="h-4 w-4" />
                      Email
                    </a>
                  </Button>
                )}
                <Button asChild size="sm" variant="outline" className="signalflow-glow">
                  <a href={`tel:${message.phone}`}>Call</a>
                </Button>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor={`reply-${message.id}`} className="text-xs font-medium text-muted-foreground">
                  Reply / Internal note
                </label>
                <Textarea
                  id={`reply-${message.id}`}
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Reach out via WhatsApp/email above, then log what you replied with…"
                />
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    disabled={isReplying}
                    className="signalflow-glow signalflow-btn-gradient w-fit"
                    onClick={handleReply}
                  >
                    {isReplying ? "Saving…" : "Mark Replied"}
                  </Button>
                  {message.repliedAt && (
                    <span className="text-xs text-muted-foreground">
                      Last replied {formatSignalDate(message.repliedAt)}{" "}
                      {formatSignalTime(message.repliedAt)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export function MessagesTable({ messages }: { messages: MessageRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return messages;
    return messages.filter((m) =>
      [m.name, m.phone, m.email ?? "", m.message].some((field) =>
        field.toLowerCase().includes(q),
      ),
    );
  }, [messages, query]);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative w-full sm:max-w-xs">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, phone, or message…"
        />
      </div>

      <div className="signalflow-glass overflow-hidden rounded-xl border border-white/5">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b-white/10 hover:bg-transparent">
                <TableHead>Date</TableHead>
                <TableHead>From</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                    {messages.length === 0
                      ? "No messages submitted yet."
                      : "No messages match your search."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((m) => <MessageRowItem key={m.id} message={m} />)
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
