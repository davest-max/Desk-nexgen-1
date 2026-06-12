import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Eye, FileDown, FilePlus2, MessageSquare, Mic, Phone, Pin, PinOff, Send, Sparkles, Ticket, User, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import CustomerInfoPanel, { CustomerOverviewCard } from "@/components/CustomerInfoPanel";
import RecentInteractionsPanel from "@/components/RecentInteractionsPanel";
import { getCustomerRecord } from "@/lib/customer-database";
import { staticAssignments } from "@/lib/static-assignments";
import { cn } from "@/lib/utils";
import { addNoteForCustomer, getNotesForCustomer, type CustomerNote } from "@/lib/notes-database";
import {
  type CustomerTicket,
  getCustomerTickets,
  getRelevantCustomerTicket,
  getCustomerTicketById,
  formatNoteTimestamp,
  getPriorityTone,
  getStatusBadgeClasses,
} from "@/lib/ticket-data";
import { TicketsDataGrid } from "@/components/notes/TicketsDataGrid";

// ─── Contact History POC ───────────────────────────────────────────────────────

import {
  CHANNEL_STYLE,
  OUTCOME_CHIP,
  CONTACT_HISTORY_BY_CUSTOMER,
  type ContactChannel,
  type ContactInteraction,
} from "@/lib/contact-history-data";

// ─── ContactHistoryCard ────────────────────────────────────────────────────────

function NotesPanelChannelIcon({ channel }: { channel: ContactChannel }) {
  const cls = "h-3.5 w-3.5";
  switch (channel) {
    case "chat":   return <MessageSquare className={cls} />;
    case "voice":  return <Phone className={cls} />;
    case "email":  return <MessageSquare className={cls} />;
    case "ticket": return <AlertCircle className={cls} />;
    case "system": return <AlertCircle className={cls} />;
    default:       return <MessageSquare className={cls} />;
  }
}

function ContactHistoryCard({ interaction, defaultOpen = false }: { interaction: ContactInteraction; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const ch = CHANNEL_STYLE[interaction.channel];

  return (
    <div className={cn("rounded-xl border border-black/[0.07] bg-white overflow-hidden border-l-[3px]", ch.border)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start gap-3 px-3 py-3 text-left hover:bg-[#F9FAFB] transition-colors"
      >
        <span className={cn("mt-0.5 shrink-0", ch.color)}><NotesPanelChannelIcon channel={interaction.channel} /></span>
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
                      ? "bg-white border border-black/8 text-[#1D2939]"
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

// ─── ContactHistoryView ────────────────────────────────────────────────────────

const COPILOT_STEP_DURATIONS = [700, 800, 800, 1100];
const COPILOT_STEPS = [
  { title: "Scanning interaction history",       desc: "Reading all threads for this customer." },
  { title: "Cross-referencing agents & outcomes", desc: "Mapping handoffs, escalations, and resolutions." },
  { title: "Drafting response",                   desc: "Grounding reply in customer context." },
  { title: "Preparing answer",                    desc: "" },
];

function ContactHistoryView({ customerId }: { customerId?: string }) {
  const interactions = customerId ? (CONTACT_HISTORY_BY_CUSTOMER[customerId] ?? []) : [];

  const [input, setInput]         = useState("");
  const [phase, setPhase]         = useState<"idle" | "thinking" | "done">("idle");
  const [stepsDone, setStepsDone] = useState(0);
  const [answer, setAnswer]       = useState("");
  const inputRef                  = useRef<HTMLInputElement>(null);

  const submitQuery = (text: string) => {
    const q = text.trim();
    if (!q) return;
    setInput("");
    setPhase("thinking");
    setStepsDone(0);
    setAnswer("");

    let cancelled = false;
    const advance = (i: number) => {
      if (cancelled || i >= COPILOT_STEP_DURATIONS.length) return;
      setTimeout(() => {
        if (cancelled) return;
        setStepsDone(i + 1);
        if (i + 1 >= COPILOT_STEPS.length) {
          setTimeout(() => {
            if (cancelled) return;
            setAnswer(
              `Based on ${customerId === "marcus" ? "Marcus Webb's" : "this customer's"} contact history, here's what I found:\n\nThe address mismatch traces back to the Jan 2025 address update (confirmed via chat with Jeff Comstock) where the shipping label cache was not purged. When order #WB-88214 was placed in Apr 2026, the stale Denver address was used. The email confirmation flagged the error, but no agent responded before Marcus escalated via chat.\n\nRecommended action: Overnight reship to Austin, TX with a goodwill discount code given his 3-year loyalty and zero prior complaint record.`
            );
            setPhase("done");
          }, 300);
        } else {
          advance(i + 1);
        }
      }, COPILOT_STEP_DURATIONS[i]);
    };
    advance(0);
    return () => { cancelled = true; };
  };

  if (interactions.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
        <Sparkles className="h-8 w-8 text-[#D0D5DD]" />
        <p className="text-[13px] font-medium text-[#7A7A7A]">No contact history</p>
        <p className="text-[11px] text-[#B0B7C3]">Interaction history will appear here once available.</p>
      </div>
    );
  }

  return (
    <div className="flex h-0 min-h-0 flex-1 flex-col overflow-hidden">
      {/* ── Interaction timeline ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#98A2B3]">
              Contact history · {interactions.length} records
            </p>
            <div className="flex flex-wrap gap-1">
              {Array.from(new Set(interactions.map((i) => i.channel))).map((ch) => (
                <span key={ch} className={cn("text-[10px] font-medium rounded-full px-2 py-0.5 border border-black/[0.07] bg-white", CHANNEL_STYLE[ch].color)}>
                  {CHANNEL_STYLE[ch].label}
                </span>
              ))}
            </div>
          </div>

          {/* Cards */}
          {interactions.map((interaction, i) => (
            <ContactHistoryCard
              key={interaction.id}
              interaction={interaction}
              defaultOpen={i === 4 || i === 3}
            />
          ))}
        </div>
      </div>

      {/* ── Copilot assist ── */}
      <div className="shrink-0 border-t border-[#E4E7EC] bg-white">
        {/* Thinking / response */}
        {phase === "thinking" && (
          <div className="px-4 pt-3 pb-2 space-y-2">
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="h-3.5 w-3.5 text-[#166CCA]" />
              <span className="text-[11px] font-semibold text-[#166CCA]">AI Assist · Thinking…</span>
            </div>
            <div className="rounded-lg bg-[#EBF4FD] px-3 py-2.5 space-y-2">
              {COPILOT_STEPS.map((step, i) => {
                const done = i < stepsDone;
                const active = i === stepsDone;
                if (!done && !active) return null;
                return (
                  <div key={i} className="flex items-start gap-2">
                    <div className="mt-0.5 shrink-0">
                      {done ? (
                        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-[#166CCA]" fill="none">
                          <path d="M3 8.5L6.5 12L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <svg className="h-3.5 w-3.5 animate-spin text-[#166CCA]" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold text-[#1260B0] leading-snug">{step.title}</p>
                      {done && step.desc && <p className="text-[11px] text-[#667085]">{step.desc}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {phase === "done" && answer && (
          <div className="px-4 pt-3 pb-2">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#166CCA]" />
              <span className="text-[11px] font-semibold text-[#166CCA]">AI Assist</span>
              <button type="button" onClick={() => { setPhase("idle"); setAnswer(""); }} className="ml-auto text-[10px] text-[#98A2B3] hover:text-[#667085]">Clear</button>
            </div>
            <div className="rounded-lg bg-[#EBF4FD] border border-[#166CCA]/20 px-3 py-2.5">
              <p className="text-[12px] leading-relaxed text-[#1260B0] whitespace-pre-line">{answer}</p>
            </div>
          </div>
        )}

        {/* Input row */}
        <div className="px-3 py-3">
          <div className="flex items-center gap-2 rounded-xl border border-black/10 bg-[#F8F8F9] px-3 py-2 focus-within:border-[#166CCA]/40 focus-within:bg-white transition-colors">
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#166CCA]" />
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitQuery(input); } }}
              placeholder="Ask AI about this customer's history…"
              disabled={phase === "thinking"}
              className="min-w-0 flex-1 bg-transparent text-[12px] text-[#333333] placeholder:text-[#AAAAAA] focus:outline-none disabled:opacity-50"
            />
            {input.trim() ? (
              <button type="button" onClick={() => submitQuery(input)} disabled={phase === "thinking"} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#166CCA] text-white hover:bg-[#1260B0] disabled:opacity-40 transition-colors">
                <Send className="h-3 w-3" />
              </button>
            ) : (
              <button type="button" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[#7A7A7A] hover:text-[#166CCA] transition-colors">
                <Mic className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const PRIMARY_TABS = ["Overview", "Details"] as const;
const SWITCHABLE_TABS = ["Accounts", "Tickets", "Interactions", "Directory", "Cases", "Tasks", "Emails", "Contacts", "History", "Notes"] as const;
const DEFAULT_SWITCHABLE_TAB = "Accounts";

const COPILOT_REASONING_STEPS = [
  "Reviewing case history and prior customer interactions...",
  "Analysing account details and transaction patterns...",
  "Cross-referencing similar resolved cases in the knowledge base...",
  "Synthesising a recommended response...",
] as const;
const TICKET_PAGE_SIZE = 6;

export const NOTES_PANEL_MENU_ITEMS = [...PRIMARY_TABS, ...SWITCHABLE_TABS];

// Re-export types and functions from ticket-data for backwards compatibility
export type { CustomerTicket };
export { getCustomerTickets, getRelevantCustomerTicket, getCustomerTicketById };

const DEFAULT_NOTE_AGENT = {
  name: "Jeff Comstock",
  id: "AGT-10984",
};

function NoteItem({ note }: { note: CustomerNote }) {
  const initials = note.agentName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="rounded-xl border border-black/[0.06] bg-white px-3 py-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-colors hover:border-[#BFDBFE] hover:bg-[#EBF4FD]">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#F8F8F9] text-[11px] font-semibold text-[#166CCA]">
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-[12px] font-semibold leading-5 text-[#333333]">{note.createdAt}</div>
          <div className="mt-2 flex items-center gap-2 text-[12px] leading-5 text-[#6B7280]">
            <span className="truncate font-medium text-[#333333]">{note.agentName}</span>
            <span className="flex-shrink-0 text-[#C0C4CC]">•</span>
            <span className="flex-shrink-0 text-[#6B7280]">{note.agentId}</span>
          </div>
          <p className="mt-1 text-[12px] leading-5 text-[#6B7280]">{note.body}</p>
        </div>
      </div>
    </div>
  );
}

function TicketRecordView({ ticket }: { ticket: CustomerTicket }) {
  return (
    <div className="flex h-0 min-h-0 flex-1 flex-col overflow-hidden bg-white p-4">
      <ScrollArea className="h-full min-h-0 w-full">
        <div className="space-y-4 pb-4">
          <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#BFDBFE] bg-[#EBF4FD] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#166CCA]">
                    <Ticket className="h-3.5 w-3.5" />
                    {ticket.id}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] font-medium text-[#475467]">
                    <span className={cn("h-2.5 w-2.5 rounded-full", getPriorityTone(ticket.priority))} />
                    {ticket.priority} Priority
                  </span>
                </div>
                <h3 className="mt-3 text-base font-semibold text-[#111827]">{ticket.subject}</h3>
                <p className="mt-1 text-sm text-[#667085]">
                  {ticket.type} case owned by {ticket.agent} in {ticket.agentTeam}.
                </p>
              </div>

              <button
                type="button"
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium shadow-sm",
                  getStatusBadgeClasses(ticket.status),
                )}
              >
                <span>{ticket.status}</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#667085]">Ticket Details</div>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-[#667085]">Ticket Number</dt>
                  <dd className="font-medium text-[#111827]">{ticket.id}</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-[#667085]">Type</dt>
                  <dd className="font-medium text-[#111827]">{ticket.type}</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-[#667085]">Modified By</dt>
                  <dd className="font-medium text-[#111827]">{ticket.modifiedBy}</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-[#667085]">Assigned Team</dt>
                  <dd className="font-medium text-[#111827]">{ticket.agentTeam}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#667085]">Summary</div>
              <p className="mt-4 text-sm leading-6 text-[#475467]">
                This ticket record was opened directly from the tickets table so agents can review the case without leaving the Customer
                Record. The tab can be closed with the cancel icon in the tab header at any time.
              </p>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

export function OverviewTabContent({ customerId, customerName, onCopilotSubmit, takeoverCard }: { customerId?: string; customerName?: string; onCopilotSubmit: (query: string) => void; takeoverCard?: TakeoverCardData }) {
  const [isProfileOpen, setIsProfileOpen] = useState(true);
  const [isCaseOpen, setIsCaseOpen] = useState(true);
  const [copilotQuery, setCopilotQuery] = useState("");

  const handleCopilotSubmit = () => {
    if (!copilotQuery.trim()) return;
    onCopilotSubmit(copilotQuery);
    setCopilotQuery("");
  };

  const rec = customerId ? getCustomerRecord(customerId) : null;
  const sa = customerId
    ? staticAssignments.find((s) => s.customerRecordId === customerId)
    : null;
  const actions = sa?.aiOverview?.actions ?? [];
  const profile = rec?.profile;
  const initials = (customerName ?? rec?.name ?? "")
    .split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-3 p-4">

          {/* Takeover case overview card — shown above Customer Profile on takeover */}
          {takeoverCard && (
            <div className="rounded-xl border border-[#BFDBFE] bg-[#EBF4FD] p-4 space-y-3">
              <div className="flex items-center gap-2">
                <img src={takeoverCard.botAvatarUrl} alt={takeoverCard.botType} className="h-7 w-7 rounded-full object-cover shrink-0" />
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1260B0]">{takeoverCard.botType}</p>
              </div>
              <p className="text-[13px] font-medium leading-5 text-[#344054]">{takeoverCard.customerContext}</p>
            </div>
          )}

          {/* Customer Profile */}
          {rec && profile && (
            <div className="rounded-xl border border-[#E4E7EC] bg-white overflow-hidden">
              <button
                type="button"
                onClick={() => setIsProfileOpen((v) => !v)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1260B0]">Customer Profile</p>
                <ChevronDown className={cn("h-3.5 w-3.5 text-[#1260B0] transition-transform duration-200", isProfileOpen && "rotate-180")} />
              </button>
              <div className={cn("grid transition-all duration-200 ease-out", isProfileOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                <div className="overflow-hidden">
                  <div className="px-4 pb-4 space-y-3">
                    {/* Identity */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#C5DEF5] text-[13px] font-bold text-[#1260B0]">
                          {initials}
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-[#111827] leading-tight">{customerName ?? rec.name}</p>
                          <p className="text-[11px] text-[#667085] leading-snug">
                            {profile.department} · {profile.tenureYears} yr{profile.tenureYears !== 1 ? "s" : ""} tenure
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] text-[#98A2B3]">Balance</p>
                        <p className="text-[13px] font-semibold text-[#111827]">{profile.totalAUM}</p>
                      </div>
                    </div>
                    {/* Tags */}
                    {profile.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {profile.tags.map((tag) => (
                          <span
                            key={tag}
                            className={cn(
                              "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium border",
                              tag === "Premier" ? "bg-[#EBF4FD] text-[#1260B0] border-[#BFDBFE]" :
                              tag.includes("IVR") ? "bg-[#EFFBF1] text-[#208337] border-[#24943E]" :
                              "bg-[#EBF4FD] text-[#166CCA] border-[#BFDBFE]",
                            )}
                          >
                            {tag}{(tag.includes("Auth") || tag.includes("Biometrics")) ? " ✓" : ""}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Customer Snapshot */}
          {rec?.customerSnapshot && rec.customerSnapshot.length > 0 && (
            <div className="rounded-xl border border-[#E4E7EC] bg-white overflow-hidden">
              <button
                type="button"
                onClick={() => setIsCaseOpen((v) => !v)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1260B0]">Customer Snapshot</p>
                <ChevronDown className={cn("h-3.5 w-3.5 text-[#1260B0] transition-transform duration-200", isCaseOpen && "rotate-180")} />
              </button>
              <div className={cn("grid transition-all duration-200 ease-out", isCaseOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                <div className="overflow-hidden">
                  <ul className="px-4 pb-4 space-y-2">
                    {rec.customerSnapshot.map((bullet, i) => (
                      <li key={i} className="flex items-start gap-2 text-[12px] text-[#344054] leading-relaxed">
                        <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#1260B0]" />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Fallback when no customer loaded */}
          {!rec && (
            <div className="flex min-h-[200px] items-center justify-center text-xs text-[#9CA3AF]">
              No customer data to display
            </div>
          )}

        </div>
      </ScrollArea>

      {/* Ask Copilot — pinned to bottom */}
      <div className="shrink-0 border-t border-[#E4E7EC] px-4 py-3">
        <div className="flex items-center gap-2 rounded-lg border border-[#BFDBFE] bg-white px-3 py-2">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#166CCA]" />
          <input
            type="text"
            value={copilotQuery}
            onChange={(e) => setCopilotQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleCopilotSubmit(); }}
            placeholder="Ask Copilot about this Case"
            className="min-w-0 flex-1 bg-transparent text-[12px] text-[#344054] placeholder:text-[#98A2B3] outline-none"
          />
          <button
            type="button"
            onClick={handleCopilotSubmit}
            className="shrink-0 text-[#166CCA] hover:text-[#1260B0] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

interface TakeoverCardData {
  botType: string;
  botAvatarUrl: string;
  customerContext: string;
  aiConfidence: number;
  aiConfidenceReason: string;
}

interface NotesPanelProps {
  initialTab?: string;
  initialTicketId?: string;
  notesOnly?: boolean;
  /** When true, hides the tab bar so only the active tab's content is shown. */
  hideTabs?: boolean;
  addNoteTrigger?: number;
  customerId?: string;
  customerName?: string;
  takeoverCard?: TakeoverCardData;
}

export default function NotesPanel({
  initialTab,
  initialTicketId,
  notesOnly = false,
  hideTabs = false,
  addNoteTrigger = 0,
  customerId,
  customerName,
  takeoverCard,
}: NotesPanelProps) {
  const availableTickets = useMemo(() => getCustomerTickets(customerId), [customerId]);
  const requestedTicket = useMemo(() => getCustomerTicketById(initialTicketId, customerId), [customerId, initialTicketId]);
  const defaultInitialTab = notesOnly ? (initialTab ?? "Notes") : (initialTab ?? "Overview");
  const [activeTab, setActiveTab] = useState(requestedTicket?.id ?? defaultInitialTab);
  const [activeSwitchableTab, setActiveSwitchableTab] = useState<string>(
    requestedTicket
      ? "Tickets"
      : !notesOnly && initialTab && SWITCHABLE_TABS.includes(initialTab as (typeof SWITCHABLE_TABS)[number])
        ? initialTab
        : DEFAULT_SWITCHABLE_TAB,
  );
  const [showMoreTabs, setShowMoreTabs] = useState(false);
  const [pinnedTabs, setPinnedTabs] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem("customer-info-pinned-tabs");
      return new Set(stored ? JSON.parse(stored) : []);
    } catch { return new Set<string>(); }
  });
  const togglePin = (tab: string) => {
    setPinnedTabs((prev) => {
      const next = new Set(prev);
      next.has(tab) ? next.delete(tab) : next.add(tab);
      try { localStorage.setItem("customer-info-pinned-tabs", JSON.stringify([...next])); } catch {}
      return next;
    });
  };
  const [notesData, setNotesData] = useState<CustomerNote[]>(() =>
    customerId ? getNotesForCustomer(customerId) : [],
  );
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [openTickets, setOpenTickets] = useState<CustomerTicket[]>([]);
  const [moreMenuPosition, setMoreMenuPosition] = useState<{ left: number; top: number } | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const moreMenuButtonRef = useRef<HTMLButtonElement | null>(null);

  // Copilot tab state
  const [isCopilotTabOpen, setIsCopilotTabOpen] = useState(false);
  const [copilotSubmittedQuery, setCopilotSubmittedQuery] = useState("");
  const [copilotPhase, setCopilotPhase] = useState<"idle" | "reasoning" | "done">("idle");
  const [copilotReasoningVisible, setCopilotReasoningVisible] = useState(0);
  const [copilotResponse, setCopilotResponse] = useState("");
  const [copilotFollowUp, setCopilotFollowUp] = useState("");
  const copilotTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const handleCopilotSubmit = (query: string) => {
    if (!query.trim()) return;
    // Clear any previous timers
    copilotTimersRef.current.forEach(clearTimeout);
    copilotTimersRef.current = [];
    setCopilotSubmittedQuery(query);
    setCopilotPhase("reasoning");
    setCopilotReasoningVisible(0);
    setIsCopilotTabOpen(true);
    setActiveTab("Copilot");
    // Build a contextual response from the customer record and static assignment
    const rec = customerId ? getCustomerRecord(customerId) : null;
    const sa = customerId ? staticAssignments.find((s) => s.customerRecordId === customerId) : null;
    const customerCtx = sa?.customerContext ?? rec?.name ?? "this customer";
    const response = `Based on the case details for ${rec?.name ?? "this customer"}, here is what I found:\n\n${customerCtx}\n\nRegarding your question — "${query}" — I recommend reviewing the case overview actions and confirming the next steps with the customer directly. If additional account changes are needed, they can be applied from the Details tab.`;
    setCopilotResponse(response);
    // Animate reasoning steps, then reveal response
    COPILOT_REASONING_STEPS.forEach((_, i) => {
      const t = setTimeout(() => setCopilotReasoningVisible(i + 1), 800 + i * 900);
      copilotTimersRef.current.push(t);
    });
    const doneTimer = setTimeout(
      () => setCopilotPhase("done"),
      800 + COPILOT_REASONING_STEPS.length * 900 + 400,
    );
    copilotTimersRef.current.push(doneTimer);
  };

  // Cleanup copilot timers on unmount
  useEffect(() => () => { copilotTimersRef.current.forEach(clearTimeout); }, []);

  useEffect(() => {
    if (requestedTicket) {
      setOpenTickets((current) => (current.some((ticket) => ticket.id === requestedTicket.id) ? current : [...current, requestedTicket]));
      setActiveSwitchableTab("Tickets");
      setActiveTab(requestedTicket.id);
      return;
    }

    setActiveTab(defaultInitialTab);

    if (!notesOnly && initialTab && SWITCHABLE_TABS.includes(initialTab as (typeof SWITCHABLE_TABS)[number])) {
      setActiveSwitchableTab(initialTab);
      return;
    }

    setActiveSwitchableTab(DEFAULT_SWITCHABLE_TAB);
  }, [defaultInitialTab, initialTab, notesOnly, requestedTicket]);

  useEffect(() => {
    if (addNoteTrigger === 0) return;

    setActiveTab("Notes");
    setIsComposerOpen(true);
  }, [addNoteTrigger]);

  // Reload notes from the store whenever the selected customer changes.
  useEffect(() => {
    setNotesData(customerId ? getNotesForCustomer(customerId) : []);
  }, [customerId]);

  useEffect(() => {
    if (!showMoreTabs) return;

    const updateMoreMenuPosition = () => {
      const rect = moreMenuButtonRef.current?.getBoundingClientRect();
      const panelRect = panelRef.current?.getBoundingClientRect();
      if (!rect || !panelRect) return;

      setMoreMenuPosition({
        left: rect.left - panelRect.left,
        top: rect.bottom - panelRect.top + 4,
      });
    };

    updateMoreMenuPosition();
    window.addEventListener("resize", updateMoreMenuPosition);
    window.addEventListener("scroll", updateMoreMenuPosition, true);

    return () => {
      window.removeEventListener("resize", updateMoreMenuPosition);
      window.removeEventListener("scroll", updateMoreMenuPosition, true);
    };
  }, [showMoreTabs]);

  const handleSaveNote = () => {
    const nextBody = noteDraft.trim();
    if (!nextBody || !customerId) return;

    addNoteForCustomer(customerId, {
      agentName: DEFAULT_NOTE_AGENT.name,
      agentId: DEFAULT_NOTE_AGENT.id,
      createdAt: formatNoteTimestamp(new Date()),
      body: nextBody,
    });
    // Refresh from the store so the new note appears at the top.
    setNotesData(getNotesForCustomer(customerId));
    setNoteDraft("");
    setIsComposerOpen(false);
  };

  const handleCancelNote = () => {
    setNoteDraft("");
    setIsComposerOpen(false);
  };

  // Pinned switchable tabs always appear after primary tabs; activeSwitchableTab is
  // the last visible non-pinned switchable tab (if it isn't already pinned).
  const pinnedSwitchable = SWITCHABLE_TABS.filter((t) => pinnedTabs.has(t));
  const unpinnedActive = !pinnedTabs.has(activeSwitchableTab) ? activeSwitchableTab : null;
  const visibleTabs: string[] = isCopilotTabOpen
    ? [...PRIMARY_TABS, ...pinnedSwitchable, "Copilot"]
    : [...PRIMARY_TABS, ...pinnedSwitchable, ...(unpinnedActive ? [unpinnedActive] : [])];
  const moreTabs: string[] = isCopilotTabOpen
    ? [...SWITCHABLE_TABS]
    : SWITCHABLE_TABS.filter((t) => !pinnedTabs.has(t) && t !== activeSwitchableTab);
  const activeTicket = openTickets.find((ticket) => ticket.id === activeTab) ?? null;

  const handleOpenTicket = (ticket: CustomerTicket) => {
    setOpenTickets((current) => (current.some((openTicket) => openTicket.id === ticket.id) ? current : [...current, ticket]));
    setActiveTab(ticket.id);
  };

  const handleCloseTicketTab = (ticketId: string) => {
    setOpenTickets((current) => {
      const nextTickets = current.filter((ticket) => ticket.id !== ticketId);

      setActiveTab((currentTab) => {
        if (currentTab !== ticketId) return currentTab;
        return nextTickets[nextTickets.length - 1]?.id ?? activeSwitchableTab;
      });

      return nextTickets;
    });
  };

  return (
    <div ref={panelRef} className="relative flex h-full w-full min-w-0 flex-1 flex-col overflow-hidden">
      {!notesOnly && !hideTabs && (
        <>
          <div className="shrink-0 border-b border-[rgba(0,0,0,0.1)] px-1">
            <div className="overflow-x-auto overflow-y-hidden">
              <div className="flex min-w-max items-center">
              {visibleTabs.map((tab) => {
                const isPinned = pinnedTabs.has(tab);
                const isPrimary = (PRIMARY_TABS as readonly string[]).includes(tab);
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => { setActiveTab(tab); setShowMoreTabs(false); }}
                    className={cn(
                      "group/tab relative flex items-center gap-1 whitespace-nowrap px-3 py-2.5 text-xs font-medium transition-colors",
                      activeTab === tab
                        ? "text-[#166CCA] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-t after:bg-[#166CCA]"
                        : "text-[#6B7280] hover:text-[#333]",
                    )}
                  >
                    {tab === "Copilot" && <Sparkles className="h-3 w-3 flex-shrink-0" />}
                    {tab}
                    {/* Unpin button — shown on hover for pinned switchable tabs */}
                    {isPinned && !isPrimary && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => { e.stopPropagation(); togglePin(tab); if (activeTab === tab) setActiveTab("Overview"); }}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); togglePin(tab); } }}
                        className="ml-0.5 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-[#98A2B3] opacity-0 transition-opacity group-hover/tab:opacity-100 hover:text-[#344054]"
                        aria-label={`Unpin ${tab}`}
                        title="Unpin"
                      >
                        <PinOff className="h-2.5 w-2.5" />
                      </span>
                    )}
                    {tab === "Copilot" && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => { e.stopPropagation(); setIsCopilotTabOpen(false); setCopilotPhase("idle"); setActiveTab("Overview"); }}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); setIsCopilotTabOpen(false); setCopilotPhase("idle"); setActiveTab("Overview"); } }}
                        className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#CBD5E1] text-[#F8FAFC] transition-colors hover:bg-[#94A3B8]"
                        aria-label="Close Copilot tab"
                      >
                        <X className="h-3 w-3" />
                      </span>
                    )}
                  </button>
                );
              })}
              <div>
                <button
                  ref={moreMenuButtonRef}
                  type="button"
                  onClick={() => {
                    if (!showMoreTabs) {
                      const rect = moreMenuButtonRef.current?.getBoundingClientRect();
                      const panelRect = panelRef.current?.getBoundingClientRect();
                      if (rect && panelRect) {
                        setMoreMenuPosition({
                          left: rect.left - panelRect.left,
                          top: rect.bottom - panelRect.top + 4,
                        });
                      }
                    }
                    setShowMoreTabs((value) => !value);
                  }}
                  className="flex items-center gap-0.5 whitespace-nowrap px-3 py-2.5 text-xs font-medium text-[#6B7280] hover:text-[#333]"
                >
                  {moreTabs.length} More
                  <ChevronDown className="h-3 w-3" />
                </button>
              </div>

              {openTickets.map((ticket) => (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => setActiveTab(ticket.id)}
                  className={cn(
                    "relative ml-1 flex items-center gap-2 whitespace-nowrap px-3 py-2.5 text-xs font-medium transition-colors",
                    activeTab === ticket.id
                      ? "text-[#166CCA] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-t after:bg-[#166CCA]"
                      : "text-[#6B7280] hover:text-[#333]",
                  )}
                >
                  <Ticket className="h-4 w-4 flex-shrink-0 text-[#111827]" />
                  <span className="max-w-[180px] truncate">{ticket.id}</span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleCloseTicketTab(ticket.id);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        event.stopPropagation();
                        handleCloseTicketTab(ticket.id);
                      }
                    }}
                    className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#CBD5E1] text-[#F8FAFC] transition-colors hover:bg-[#94A3B8]"
                    aria-label={`Close ${ticket.id}`}
                  >
                    <X className="h-3 w-3" />
                  </span>
                </button>
              ))}
              </div>
            </div>
          </div>

          {showMoreTabs && moreMenuPosition ? (
            <div
              className="absolute z-20 w-44 rounded-lg border border-[rgba(0,0,0,0.1)] bg-white py-1 shadow-lg"
              style={{ left: moreMenuPosition.left, top: moreMenuPosition.top }}
            >
              {moreTabs.map((tab) => (
                <div key={tab} className="group/row flex items-center gap-1 hover:bg-[#F8F8F9]">
                  <button
                    type="button"
                    onClick={() => { setActiveSwitchableTab(tab); setActiveTab(tab); setShowMoreTabs(false); }}
                    className="flex-1 px-3 py-1.5 text-left text-xs text-[#333]"
                  >
                    {tab}
                  </button>
                  {/* Pin button */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); togglePin(tab); }}
                    title={pinnedTabs.has(tab) ? "Unpin" : "Pin to tab bar"}
                    className="mr-2 flex h-5 w-5 shrink-0 items-center justify-center rounded text-[#D0D5DD] opacity-0 transition-all group-hover/row:opacity-100 hover:text-[#166CCA]"
                  >
                    <Pin className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {pinnedTabs.size > 0 && (
                <>
                  <div className="mx-2 my-1 border-t border-[#F2F4F7]" />
                  <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#98A2B3]">Pinned</p>
                  {[...pinnedTabs].filter(t => SWITCHABLE_TABS.includes(t as any)).map((tab) => (
                    <div key={tab} className="group/row flex items-center gap-1 hover:bg-[#F8F8F9]">
                      <button
                        type="button"
                        onClick={() => { setActiveTab(tab); setShowMoreTabs(false); }}
                        className="flex-1 px-3 py-1.5 text-left text-xs font-medium text-[#166CCA]"
                      >
                        {tab}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); togglePin(tab); }}
                        title="Unpin"
                        className="mr-2 flex h-5 w-5 shrink-0 items-center justify-center rounded text-[#166CCA] opacity-70 hover:opacity-100"
                      >
                        <PinOff className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>
          ) : null}
        </>
      )}

      {activeTab === "Notes" && (
        <div className="flex flex-1 flex-col overflow-hidden">
          {!notesOnly && !hideTabs && (
            <div className="flex shrink-0 items-center justify-between border-b border-[rgba(0,0,0,0.08)] px-4 py-2.5">
              <span className="text-xs font-semibold text-[#333]">Latest Notes</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="text-[#6B7280] transition-colors hover:text-[#333]"
                  aria-label="Add note"
                  onClick={() => setIsComposerOpen(true)}
                >
                  <FilePlus2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="text-[#6B7280] transition-colors hover:text-[#333]"
                  aria-label="Export notes"
                >
                  <FileDown className="h-4 w-4" />
                </button>
                <button type="button" className="text-[#6B7280] transition-colors hover:text-[#333]" aria-label="View notes">
                  <Eye className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="space-y-3 pb-2">
              {isComposerOpen && (
                <div className="rounded-xl border border-[#BFDBFE] bg-[#EBF4FD] p-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
                  <div className="text-[12px] font-semibold leading-5 text-[#333333]">New Note</div>
                  <div className="mt-1 flex items-center gap-2 text-[12px] leading-5 text-[#6B7280]">
                    <span className="font-medium text-[#333333]">{DEFAULT_NOTE_AGENT.name}</span>
                    <span className="text-[#C0C4CC]">•</span>
                    <span>{DEFAULT_NOTE_AGENT.id}</span>
                  </div>
                  <Textarea
                    value={noteDraft}
                    onChange={(event) => setNoteDraft(event.target.value)}
                    placeholder="Add a note"
                    className="mt-3 min-h-[112px] resize-none border-black/10 bg-white text-sm text-[#333333] placeholder:text-[#9CA3AF] focus-visible:border-[#BFDBFE] focus-visible:ring-0 focus-visible:shadow-[inset_0_0_0_1px_#BFDBFE]"
                  />
                  <div className="mt-3 flex items-center justify-end gap-2">
                    <Button type="button" variant="outline" className="h-8 rounded-lg px-3" onClick={handleCancelNote}>
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      className="h-8 rounded-lg bg-[#166CCA] px-3 hover:bg-[#1260B0] disabled:bg-[#BFDBFE] dark:disabled:bg-[#0C3D7A] dark:disabled:text-[#4B96DA]"
                      onClick={handleSaveNote}
                      disabled={!noteDraft.trim()}
                    >
                      Save note
                    </Button>
                  </div>
                </div>
              )}

              {notesData.map((note) => (
                <NoteItem key={note.id} note={note} />
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "Overview" && (
        <div className="flex h-0 min-h-0 flex-1 flex-col overflow-hidden">
          <OverviewTabContent customerId={customerId} customerName={customerName} onCopilotSubmit={handleCopilotSubmit} takeoverCard={takeoverCard} />
        </div>
      )}

      {activeTab === "Copilot" && (
        <div className="flex h-0 min-h-0 flex-1 flex-col overflow-hidden">
          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-4 p-4">
              {/* Query bubble */}
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-[#166CCA] px-3 py-2 text-[12px] text-white leading-relaxed">
                  {copilotSubmittedQuery}
                </div>
              </div>

              {/* Reasoning steps */}
              <div className="space-y-2">
                {COPILOT_REASONING_STEPS.slice(0, copilotReasoningVisible).map((step, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-[#BFDBFE] bg-[#EBF4FD]" />
                    <p className="text-[11px] text-[#98A2B3] leading-snug">{step}</p>
                  </div>
                ))}
                {copilotPhase === "reasoning" && copilotReasoningVisible < COPILOT_REASONING_STEPS.length && (
                  <div className="flex items-center gap-1.5 pl-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#166CCA] animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-[#166CCA] animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-[#166CCA] animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                )}
              </div>

              {/* Response */}
              {copilotPhase === "done" && (
                <div className="rounded-xl border border-[#E4E7EC] bg-white p-4 space-y-2">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles className="h-3.5 w-3.5 text-[#166CCA]" />
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1260B0]">Copilot</p>
                  </div>
                  {copilotResponse.split("\n\n").map((para, i) => (
                    <p key={i} className="text-[12px] text-[#344054] leading-relaxed">{para}</p>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Follow-up input */}
          <div className="shrink-0 border-t border-[#E4E7EC] px-4 py-3">
            <div className="flex items-center gap-2 rounded-lg border border-[#BFDBFE] bg-white px-3 py-2">
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#166CCA]" />
              <input
                type="text"
                value={copilotFollowUp}
                onChange={(e) => setCopilotFollowUp(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && copilotFollowUp.trim()) {
                    handleCopilotSubmit(copilotFollowUp);
                    setCopilotFollowUp("");
                  }
                }}
                placeholder="Ask a follow-up question..."
                className="min-w-0 flex-1 bg-transparent text-[12px] text-[#344054] placeholder:text-[#98A2B3] outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (copilotFollowUp.trim()) {
                    handleCopilotSubmit(copilotFollowUp);
                    setCopilotFollowUp("");
                  }
                }}
                className="shrink-0 text-[#166CCA] hover:text-[#1260B0] transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "Details" && (
        <div className="flex h-0 min-h-0 flex-1 flex-col overflow-hidden">
          <CustomerInfoPanel className="h-full" customerId={customerId} />
        </div>
      )}

      {activeTab === "Tickets" && <TicketsDataGrid tickets={availableTickets} onOpenTicket={handleOpenTicket} />}

      {activeTab === "Accounts" && (
        <div className="flex h-0 min-h-0 flex-1 flex-col overflow-hidden p-4">
          <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            <ScrollArea className="h-full min-h-0 w-full">
              {customerId ? (
                <CustomerOverviewCard customerId={customerId} customerName={customerName} />
              ) : (
                <div className="flex min-h-[280px] items-center justify-center text-xs text-[#9CA3AF]">
                  No account details to display
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      )}

      {activeTab === "Interactions" && (
        <div className="flex h-0 min-h-0 flex-1 flex-col overflow-hidden">
          <RecentInteractionsPanel />
        </div>
      )}

      {activeTicket && <TicketRecordView ticket={activeTicket} />}

      {activeTab === "History" && !activeTicket && (
        <ContactHistoryView customerId={customerId} />
      )}

      {activeTab !== "Notes" && activeTab !== "Overview" && activeTab !== "Details" && activeTab !== "Accounts" && activeTab !== "Tickets" && activeTab !== "Interactions" && activeTab !== "Copilot" && activeTab !== "History" && !activeTicket && (
        <div className="flex flex-1 items-center justify-center text-xs text-[#9CA3AF]">
          No {activeTab.toLowerCase()} to display
        </div>
      )}
    </div>
  );
}
