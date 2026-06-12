import { useState, useRef } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Phone,
  AlertCircle,
  Send,
  Sparkles,
  X,
  RotateCcw,
  Plus,
  FileEdit,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CHANNEL_STYLE,
  OUTCOME_CHIP,
  CONTACT_HISTORY_BY_CUSTOMER,
  CLOSED_CONTACT_META,
  type ContactInteraction,
  type ContactChannel,
} from "@/lib/contact-history-data";

// ─── RowData minimal interface ─────────────────────────────────────────────────
// Mirror only the fields we need so we don't create a circular import.

export interface ClosedRowSummary {
  id: string;
  name: string;
  customerId: string;
  customerRecordId?: string;
  company: string;
  channel: string;
  caseType: string;
  preview: string;
  resolvedAt?: string;
  onReopen: () => void;
}

// ─── Channel icons (rendered at runtime, not in data) ─────────────────────────

function ChannelIcon({ channel, className }: { channel: ContactChannel; className?: string }) {
  const cls = cn("h-3.5 w-3.5", className);
  switch (channel) {
    case "chat":   return <MessageSquare className={cls} />;
    case "voice":  return <Phone className={cls} />;
    case "email":  return <MessageSquare className={cls} />;
    case "ticket": return <AlertCircle className={cls} />;
    case "system": return <AlertCircle className={cls} />;
    default:       return <MessageSquare className={cls} />;
  }
}

// ─── ContactHistoryCard ────────────────────────────────────────────────────────

function ContactHistoryCard({ interaction, defaultOpen = true }: { interaction: ContactInteraction; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const ch = CHANNEL_STYLE[interaction.channel];

  return (
    <div className={cn("rounded-xl border border-black/[0.07] bg-white overflow-hidden border-l-[3px]", ch.border)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start gap-3 px-3 py-3 text-left hover:bg-[#F9FAFB] transition-colors"
      >
        <span className={cn("mt-0.5 shrink-0", ch.color)}>
          <ChannelIcon channel={interaction.channel} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[13px] font-semibold leading-snug text-[#1D2939]">{interaction.title}</p>
            {open ? <ChevronUp className="h-3.5 w-3.5 shrink-0 mt-0.5 text-[#98A2B3]" /> : <ChevronDown className="h-3.5 w-3.5 shrink-0 mt-0.5 text-[#98A2B3]" />}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="text-[11px] text-[#98A2B3]">{interaction.date}</span>
            <span className="text-[11px] text-[#D0D5DD]">·</span>
            <span className="text-[11px] text-[#667085]">{interaction.agent}</span>
          </div>
        </div>
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-3 border-t border-[#F2F4F7]">
          <p className="pt-2.5 text-[12px] leading-relaxed text-[#475467]">{interaction.summary}</p>

          {interaction.messages && interaction.messages.length > 0 && (
            <div className="rounded-lg bg-[#F8F9FB] p-2.5 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#98A2B3]">Conversation thread</p>
              {interaction.messages.map((msg, i) => (
                <div key={i} className={cn("flex gap-2", msg.role === "agent" ? "justify-start" : "justify-end")}>
                  <div className={cn(
                    "max-w-[85%] rounded-xl px-3 py-2 text-[11px] leading-relaxed whitespace-pre-line",
                    msg.role === "customer"
                      ? "bg-white border border-black/[0.08] text-[#1D2939]"
                      : "bg-[#EBF4FD] text-[#1260B0]",
                  )}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {interaction.outcome && (
              <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", OUTCOME_CHIP[interaction.outcomeVariant ?? "info"])}>
                <CheckCircle2 className="h-3 w-3" />
                {interaction.outcome}
              </span>
            )}
            {interaction.linkedTo && interaction.linkedTo.length > 0 && (
              <span className="text-[11px] text-[#98A2B3]">
                Linked to {interaction.linkedTo.length} related {interaction.linkedTo.length === 1 ? "thread" : "threads"}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ClosedContactPanel ────────────────────────────────────────────────────────

export function ClosedContactPanel({
  row,
  allClosedRows,
  onClose,
}: {
  row: ClosedRowSummary;
  allClosedRows: ClosedRowSummary[];
  onClose: () => void;
}) {
  const interactions = CONTACT_HISTORY_BY_CUSTOMER[row.customerRecordId ?? ""] ?? [];
  const meta = CLOSED_CONTACT_META[row.customerRecordId ?? ""];
  const noteRef = useRef<HTMLInputElement>(null);

  const [channelTab, setChannelTab] = useState("all");
  const [note, setNote] = useState("");
  const [savedNote, setSavedNote] = useState("");

  // Related contacts from same customerRecordId (other closed rows)
  const relatedRows = allClosedRows.filter(
    (r) => r.id !== row.id && r.customerRecordId === row.customerRecordId,
  );

  // Unique channels present in the interactions
  const presentChannels = Array.from(new Set(interactions.map((i) => i.channel)));

  const filteredInteractions =
    channelTab === "all"
      ? interactions
      : interactions.filter((i) => i.channel === channelTab);

  const initials = row.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#F9FAFB]">
      {/* ── Header ── */}
      <div className="flex shrink-0 items-center gap-3 border-b border-[#E4E7EC] bg-white px-4 py-3">
        <button type="button" onClick={onClose} className="flex items-center gap-1 text-[12px] font-medium text-[#667085] hover:text-[#344054] transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>
        <Separator orientation="vertical" className="h-4" />
        <div className="flex flex-1 min-w-0 items-center gap-2">
          <span className="text-[13px] font-semibold text-[#1D2939] truncate">{row.name}</span>
          <Badge variant="outline" className="text-[10px] shrink-0">{row.customerId}</Badge>
          <Badge variant="secondary" className="text-[10px] shrink-0">
            Closed {row.resolvedAt ?? meta?.resolvedAt ?? ""}
          </Badge>
        </div>
        <button type="button" onClick={onClose} className="ml-auto text-[#98A2B3] hover:text-[#667085] transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* ── Body — two columns ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── LEFT SIDEBAR ── */}
        <div className="flex w-[200px] shrink-0 flex-col overflow-y-auto border-r border-[#E4E7EC] bg-white">
          <div className="flex flex-col gap-4 p-4">

            {/* Customer card */}
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EBF4FD] text-[14px] font-bold text-[#166CCA]">
                {initials}
              </div>
              <div>
                <p className="text-[13px] font-semibold text-[#1D2939] leading-tight">{row.name}</p>
                <p className="text-[11px] text-[#667085]">{row.company}</p>
              </div>
              <div className="flex flex-wrap justify-center gap-1">
                {meta?.tenure && <Badge variant="outline" className="text-[10px]">{meta.tenure}</Badge>}
                {meta?.totalContacts && (
                  <Badge variant="outline" className="text-[10px]">{meta.totalContacts} contacts</Badge>
                )}
              </div>
            </div>

            <Separator />

            {/* AI case summary */}
            {meta?.aiSummary && (
              <div>
                <div className="mb-1.5 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-[#166CCA]" />
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[#98A2B3]">AI Summary</span>
                </div>
                <Alert variant="default" className="p-2.5">
                  <AlertDescription className="text-[11px] leading-relaxed text-[#344054]">
                    {meta.aiSummary}
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <Separator />

            {/* Related contacts */}
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#98A2B3]">
                Related contacts
              </p>
              {relatedRows.length === 0 ? (
                <p className="text-[11px] text-[#B0B7C3]">No other cases from this customer.</p>
              ) : (
                <div className="space-y-1.5">
                  {relatedRows.map((r) => (
                    <div key={r.id} className="flex items-center gap-1.5 rounded-lg border border-[#E4E7EC] bg-[#F9FAFB] p-2">
                      <ChannelIcon channel={r.channel as ContactChannel} className="text-[#98A2B3]" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-medium text-[#344054]">{r.caseType}</p>
                        <p className="text-[10px] text-[#98A2B3]">{r.resolvedAt}</p>
                      </div>
                      <Badge variant="secondary" className="text-[9px] shrink-0">Closed</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Quick actions */}
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#98A2B3]">
                Quick actions
              </p>
              <div className="flex flex-col gap-1.5">
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full justify-start gap-1.5 text-[11px]"
                  onClick={() => { row.onReopen(); onClose(); }}
                >
                  <RotateCcw className="h-3 w-3" />
                  Reopen case
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-1.5 text-[11px]"
                >
                  <Plus className="h-3 w-3" />
                  Create follow-up
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-1.5 text-[11px]"
                  onClick={() => { setTimeout(() => noteRef.current?.focus(), 50); }}
                >
                  <FileEdit className="h-3 w-3" />
                  Add note
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT — Interaction timeline ── */}
        <div className="flex flex-1 min-w-0 flex-col overflow-hidden">
          <Tabs value={channelTab} onValueChange={setChannelTab} className="flex flex-1 min-h-0 flex-col">
            {/* Channel tabs */}
            <div className="shrink-0 border-b border-[#E4E7EC] bg-white px-4 pt-3 pb-0">
              <TabsList className="h-8">
                <TabsTrigger value="all" className="text-[11px]">All</TabsTrigger>
                {presentChannels.map((ch) => (
                  <TabsTrigger key={ch} value={ch} className="text-[11px] capitalize">
                    {CHANNEL_STYLE[ch].label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Timeline content */}
            <TabsContent value={channelTab} className="flex-1 overflow-y-auto mt-0 border-0">
              <div className="p-4 space-y-3">
                {filteredInteractions.length === 0 ? (
                  <Alert variant="default">
                    <AlertDescription className="text-[12px]">
                      No {channelTab} interactions recorded for this case.
                    </AlertDescription>
                  </Alert>
                ) : (
                  filteredInteractions.map((interaction, i) => (
                    <div key={interaction.id}>
                      <ContactHistoryCard interaction={interaction} defaultOpen />
                      {i < filteredInteractions.length - 1 && <Separator className="mt-3" />}
                    </div>
                  ))
                )}

                {/* Saved note display */}
                {savedNote && (
                  <div className="rounded-xl border border-[#E4E7EC] bg-[#FFFAEB] p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#B54708] mb-1">Agent note</p>
                    <p className="text-[12px] text-[#344054]">{savedNote}</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* ── Pinned note input ── */}
          <div className="shrink-0 border-t border-[#E4E7EC] bg-white px-4 py-3">
            <div className="flex items-center gap-2">
              <Input
                ref={noteRef}
                placeholder="Add a note to this case…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && note.trim()) {
                    setSavedNote(note.trim());
                    setNote("");
                    setChannelTab("all");
                  }
                }}
                className="text-[12px]"
              />
              <Button
                variant="default"
                size="sm"
                disabled={!note.trim()}
                onClick={() => {
                  if (note.trim()) { setSavedNote(note.trim()); setNote(""); setChannelTab("all"); }
                }}
              >
                <Send className="h-3.5 w-3.5" />
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
