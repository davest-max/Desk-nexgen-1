import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  BookOpen,
  CalendarCheck,
  CalendarDays,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  ClipboardCheck,
  Loader2,
  Mail,
  Maximize2,
  MessageCircle,
  MessageSquare,
  Minimize2,
  Phone,
  GalleryVertical,
  LayoutGrid,
  PauseCircle,
  LayoutList,
  SlidersHorizontal,
  Send,
  Sparkles,
  Star,
  TrendingUp,
  X,
} from "lucide-react";
import { useLayoutContext, type QueueAssignmentStatus, type AcceptIssueData, type ResolvedAssignment, type AssignmentChannel } from "@/components/layout-context";
import { buildTakeoverConversation, getCustomerRecord, createConversationState } from "@/lib/customer-database";
import type { SharedConversationData } from "@/components/ConversationPanel";
import { staticAssignments, type Channel, type Priority, type AiOverview, type StaticAssignment } from "@/lib/static-assignments";
import { EscalatedCaseModal, type EscalatedCaseModalData } from "@/components/EscalatedCaseModal";
import { pendingQueueRejections, pendingResolvedIds, pendingEscalatedIds, acceptedStaticsStore, pendingHandoffConversations } from "@/lib/queue-state";
import { getEscalationStart } from "@/lib/escalation-timers";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import DeskDataTable from "@/components/DeskDataTable";
import ConversationPanel from "@/components/ConversationPanel";
import { EscalationTimer } from "@/components/EscalationTimer";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { CopilotResponseCard } from "@/components/CopilotResponseCard";
import {
  CURRENT_AGENT_NAME,
  priorityStyles,
  priorityRank,
  channelIconMap,
  companyByCustomerId,
  liveCustomerContext,
  liveAiOverview,
  priorityFilterOptions,
  channelFilterOptions,
  ISSUE_GROUPS,
  connectedApps,
  appIconLetters,
  COPILOT_REASONING_STEPS,
  CARD_COPILOT_STEPS,
  BULK_AI_RESPONSES,
  type ChannelFilterValue,
} from "@/lib/control-panel-data";
import {
  Agent,
  agentRoster,
  supervisorRoster,
  availabilityOrder,
  availabilityDot,
  scoreAgent,
  getSmartPopoverPosition,
} from "@/lib/agent-roster";
import { RejectPopover } from "./control-panel/RejectPopover";
import { TakeoverButton } from "./control-panel/TakeoverButton";

type DeskPageTab = "queue" | "customers" | "tickets" | "accounts" | "contact-history";
type StatusFilter = "new" | "open" | "pending" | "escalated" | "closed";

const DESK_PAGE_TABS: Array<{ id: DeskPageTab; label: string }> = [
  { id: "queue",           label: "Queue"            },
  { id: "customers",       label: "Customers"       },
  { id: "tickets",         label: "Tickets"         },
  { id: "accounts",        label: "Accounts"        },
  { id: "contact-history", label: "Contact History" },
];




// staticAssignments is now imported from @/lib/static-assignments
// keeping a re-export for any consumers that still reference this module
export { staticAssignments } from "@/lib/static-assignments";

// (end of moved data)

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Per-customer AI overview for the 3 live assignments keyed by customerRecordId
function getLiveAiOverview(customerRecordId: string, name: string, preview: string, channel: string): AiOverview {
  if (liveAiOverview[customerRecordId]) return liveAiOverview[customerRecordId];
  const firstName = name.split(" ")[0];
  return {
    actions: [
      `Reviewed the full ${channel} thread and extracted the core issue from ${firstName}'s messages.`,
      `Checked account history and cross-referenced any recent interactions flagged on the account.`,
      `Assessed conversation tone and confirmed standard escalation path was appropriate.`,
      `Prepared a suggested response draft and identified relevant knowledge base articles.`,
    ],
    whyNeeded: `The issue ${firstName} raised requires judgment and account-level context that the AI cannot act on autonomously. A human agent is needed to review the details, confirm the right course of action, and deliver a personalised resolution that closes the loop.`,
    nextSteps: [
      `Review the customer's ticket and the latest thread activity`,
      `Check account history and any flagged interactions`,
      `Identify the most appropriate resolution path`,
      `Respond with a clear next step and keep the customer informed`,
    ],
  };
}



function getIssueGroup(preview: string, name: string): string {
  const text = (preview + " " + name).toLowerCase();
  for (const g of ISSUE_GROUPS) {
    if (g.keywords.some((kw) => text.includes(kw))) return g.label;
  }
  return "Other Issues";
}




// ─── Agent roster ─────────────────────────────────────────────────────────────










// ─── CopilotResponseCard ──────────────────────────────────────────────────────


// ─── Row component ────────────────────────────────────────────────────────────

// ─── TakeoverPopover ─────────────────────────────────────────────────────────



// ─── IssueRow ─────────────────────────────────────────────────────────────────

function IssueRow({
  id,
  name,
  customerId,
  customerRecordId,
  company,
  botType,
  channel,
  priority,
  status,
  preview,
  waitTime,
  aiOverview,
  customerContext,
  assignedTo,
  isLive,
  isAccepted,
  isClosed,
  isParkedFromToast,
  liveAssignmentId,
  onAccept,
  onReject,
  onReopen,
  onMonitor,
  onSupervise,
  onTakeoverAccept,
  isMonitored = false,
  isSelected = false,
  onSelect,
}: {
  id: string;
  name: string;
  customerId: string;
  customerRecordId?: string;
  company: string;
  botType: string;
  channel: Channel;
  priority: Priority;
  status: QueueAssignmentStatus;
  preview: string;
  waitTime: string;
  aiOverview: AiOverview;
  customerContext?: string;
  isLive: boolean;
  assignedTo?: string | null;
  isAccepted: boolean;
  isClosed: boolean;
  isParkedFromToast: boolean;
  liveAssignmentId: string | null;
  onAccept: () => void;
  onReject: () => void;
  onReopen: () => void;
  onMonitor: () => void;
  onSupervise: () => void;
  onTakeoverAccept: (handoffConversation: SharedConversationData) => void;
  isMonitored?: boolean;
  isSelected?: boolean;
  onSelect?: (id: string | null) => void;
}) {
  const { selectAssignment, pushTransferredToast } = useLayoutContext();
  const navigate = useNavigate();
  const [showReject, setShowReject] = useState(false);
  const [rejectTriggerRect, setRejectTriggerRect] = useState<DOMRect | null>(null);
  const rejectButtonRef = useRef<HTMLButtonElement>(null);
  const isInProgress = isAccepted && !isClosed;
  const [performActionsState, setPerformActionsState] = useState<"idle" | "running" | "done">("idle");
  const [performActionsCompletedCount, setPerformActionsCompletedCount] = useState(0);
  const performActionsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isCustomerProfileOpen, setIsCustomerProfileOpen] = useState(true);
  const [isAttemptedResolutionOpen, setIsAttemptedResolutionOpen] = useState(true);
  const customerRecord = customerRecordId ? getCustomerRecord(customerRecordId) : null;
  const [copilotQuery, setCopilotQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [copilotPhase, setCopilotPhase] = useState<"idle" | "thinking" | "done">("idle");
  const [copilotReasoningVisible, setCopilotReasoningVisible] = useState(0);
  const [isCopilotOpen, setIsCopilotOpen] = useState(true);
  const copilotTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  function handleCopilotSubmit() {
    if (!copilotQuery.trim()) return;
    copilotTimersRef.current.forEach(clearTimeout);
    copilotTimersRef.current = [];
    setSubmittedQuery(copilotQuery);
    setCopilotQuery("");
    setCopilotPhase("thinking");
    setCopilotReasoningVisible(0);
    setIsCopilotOpen(true);
    COPILOT_REASONING_STEPS.forEach((_, i) => {
      const t = setTimeout(() => setCopilotReasoningVisible(i + 1), 1000 + i * 600);
      copilotTimersRef.current.push(t);
    });
    const doneTimer = setTimeout(() => setCopilotPhase("done"), 1000 + COPILOT_REASONING_STEPS.length * 600 + 600);
    copilotTimersRef.current.push(doneTimer);
  }

  useEffect(() => () => { if (performActionsTimerRef.current) clearTimeout(performActionsTimerRef.current); }, []);
  useEffect(() => () => { copilotTimersRef.current.forEach(clearTimeout); }, []);

  // Scroll into view when this row becomes monitored
  const rowRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isMonitored) {
      const t = setTimeout(() => {
        rowRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
      return () => clearTimeout(t);
    }
  }, [isMonitored]);

  return (
    <div ref={rowRef} className={cn("group/row border-b border-border last:border-b-0 relative", isMonitored ? "bg-[#EBF4FD] dark:bg-[#0B1E35]" : status === "escalated" ? "bg-[#FEF2F2]" : isSelected && "bg-[#F2F4F7]")}>
      {(isMonitored || isSelected || status === "escalated") && <div className={cn("absolute left-0 inset-y-0 w-[3px] rounded-r-full z-[1]", isMonitored ? "bg-[#166CCA]" : status === "escalated" ? "bg-[#E53935]" : "bg-[#166CCA]/50")} />}
      {/* Header row — accordion toggle + hover-reveal action buttons */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelect?.(id)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect?.(id); } }}
        className={cn("relative w-full text-left flex items-center gap-3 px-5 py-4 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#166CCA]/30", isMonitored ? "hover:bg-[#D5E9F8] dark:hover:bg-[#0C2A4A]" : status === "escalated" ? "hover:bg-[#FEE2E2]" : "hover:bg-[#F9FAFB]")}
      >
        {(isLive || (isAccepted && !isClosed)) && !isParkedFromToast && (
          <div className="shrink-0 relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#208337] opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#208337]" />
          </div>
        )}
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] font-semibold text-[#1D2939]">{name}</span>
            <span className={cn(
              "rounded border px-1.5 py-0.5 text-[10px] font-semibold leading-none",
              status === "open"      && "border-[#B9E0B4] bg-[#F0FAF0] text-[#1E7B1E] dark:border-[#1E4A1E] dark:bg-[#0A2010] dark:text-[#4CAF50]",
              status === "pending"   && "border-[#D0D5DD] bg-[#F9FAFB] text-[#667085] dark:border-[#2A3448] dark:bg-[#151F30] dark:text-[#8898AB]",
              status === "resolved"  && "border-[#BFDBFE] bg-[#EBF4FD] text-[#166CCA] dark:border-[#0C3D7A] dark:bg-[#0B1E35] dark:text-[#BFDBFE]",
              status === "escalated" && "border-[#E53935] bg-[#FDEAEA] text-[#C71D1A] dark:border-[#6B1A1A] dark:bg-[#2E0D0D] dark:text-[#F87171]",
            )}>
              {status}
            </span>
            {assignedTo && (
              <span className="inline-flex items-center gap-1 rounded-full border border-[#BFDBFE] bg-[#EBF4FD] px-2 py-0.5 text-[10px] font-semibold text-[#166CCA]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#166CCA]" />
                Assigned — {assignedTo}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[12px] text-[#475467] leading-[1.4] truncate">{preview}</p>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[#98A2B3]">
            {assignedTo ? (
              <span className="font-medium text-[#166CCA]">{assignedTo}</span>
            ) : (
              <span>{botType}</span>
            )}
            <span>•</span>
            <span>⏱ Wait: {waitTime}</span>
            <span>•</span>
            <span>{customerId}</span>
          </div>
        </div>

        {/* Action buttons — revealed on hover, absolutely positioned */}
        <div
          className={cn(
            "absolute right-10 top-1/2 -translate-y-1/2 flex items-center gap-1.5 transition-opacity duration-150 z-10",
            (isInProgress || isClosed) ? "opacity-100" : "opacity-0 pointer-events-none group-hover/row:opacity-100 group-hover/row:pointer-events-auto",
          )}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {showReject && rejectTriggerRect && (
            <RejectPopover
              priority={priority}
              preview={preview}
              triggerRect={rejectTriggerRect}
              onClose={() => setShowReject(false)}
              onAssign={() => { setShowReject(false); onReject(); }}
            />
          )}
          {isInProgress ? (
            <button
              type="button"
              onClick={() => {
                if (liveAssignmentId) {
                  selectAssignment(liveAssignmentId);
                  navigate("/activity");
                }
              }}
              className="rounded-md border border-[#BFDBFE] bg-[#EBF4FD] px-3 py-1 text-[11px] font-semibold text-[#166CCA] hover:bg-[#DAEEFA] transition-colors"
            >
              In Progress
            </button>
          ) : isClosed ? (
            <button
              type="button"
              onClick={() => onReopen()}
              className="rounded-md border border-[#D0D5DD] bg-white px-3 py-1 text-[11px] font-semibold text-[#344054] hover:bg-[#F9FAFB] transition-colors"
            >
              View
            </button>
          ) : status !== "resolved" && (
            <>
              <button
                type="button"
                onClick={() => onMonitor()}
                className="flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-1 text-[11px] font-semibold text-[#344054] hover:bg-[#F9FAFB] transition-colors"
              >
                Review
              </button>
              <TakeoverButton
                botType={botType}
                customerName={name}
                customerRecordId={customerRecordId ?? ""}
                channel={channel}
                onTakeover={(handoffConversation) => {
                  pushTransferredToast({ id, name, customerId, customerRecordId: customerRecordId ?? "", channel: channel as AssignmentChannel, label: botType, priority, preview });
                  onTakeoverAccept(handoffConversation);
                }}
                className="rounded-md bg-[#166CCA] px-3 py-1 text-[11px] font-semibold text-white hover:bg-[#1260B0] transition-colors"
              />
            </>
          )}
        </div>

        <ChevronRight className={cn(
          "h-4 w-4 shrink-0 text-[#98A2B3] transition-colors duration-200",
          isSelected && "text-[#166CCA]",
        )} />
      </div>
    </div>
  );
}

// ─── Resolved Row component ───────────────────────────────────────────────────

function formatResolvedTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function ResolvedIssueRow({ item, onTransfer, onOpen }: {
  item: ResolvedAssignment;
  onTransfer: (rect: DOMRect) => void;
  onOpen: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [rejectTriggerRect, setRejectTriggerRect] = useState<DOMRect | null>(null);
  const rejectButtonRef = useRef<HTMLButtonElement>(null);
  const [isCustomerProfileOpen, setIsCustomerProfileOpen] = useState(true);
  const [isAttemptedResolutionOpen, setIsAttemptedResolutionOpen] = useState(true);
  const priorityKey = item.priority as Priority;
  const aiOverview = getLiveAiOverview(item.customerRecordId, item.name, item.preview, item.channel);
  const resolvedCustomerContext = liveCustomerContext[item.customerRecordId];
  const customerRecord = item.customerRecordId ? getCustomerRecord(item.customerRecordId) : null;
  const [copilotQuery, setCopilotQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [copilotPhase, setCopilotPhase] = useState<"idle" | "thinking" | "done">("idle");
  const [copilotReasoningVisible, setCopilotReasoningVisible] = useState(0);
  const [isCopilotOpen, setIsCopilotOpen] = useState(true);
  const copilotTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  function handleCopilotSubmit() {
    if (!copilotQuery.trim()) return;
    copilotTimersRef.current.forEach(clearTimeout);
    copilotTimersRef.current = [];
    setSubmittedQuery(copilotQuery);
    setCopilotQuery("");
    setCopilotPhase("thinking");
    setCopilotReasoningVisible(0);
    setIsCopilotOpen(true);
    COPILOT_REASONING_STEPS.forEach((_, i) => {
      const t = setTimeout(() => setCopilotReasoningVisible(i + 1), 1000 + i * 600);
      copilotTimersRef.current.push(t);
    });
    const doneTimer = setTimeout(() => setCopilotPhase("done"), 1000 + COPILOT_REASONING_STEPS.length * 600 + 600);
    copilotTimersRef.current.push(doneTimer);
  }

  useEffect(() => () => { copilotTimersRef.current.forEach(clearTimeout); }, []);

  return (
    <div className="border-b border-border last:border-b-0">
      {/* Header row */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="w-full text-left flex items-start gap-3 px-5 py-4 hover:bg-[#F9FAFB] transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] font-semibold text-[#1D2939]">{item.name}</span>
            <span className="rounded border border-[#B9E0B4] bg-[#F0FAF0] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-[#1E7B1E]">
              resolved
            </span>
          </div>
          <p className="mt-0.5 text-[12px] text-[#475467] leading-[1.4] truncate">{item.preview}</p>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[#98A2B3]">
            <span className="capitalize">{item.channel}</span>
            <span>•</span>
            <span>Resolved at {formatResolvedTime(item.resolvedAt)}</span>
          </div>
        </div>
        <ChevronDown className={cn(
          "mt-1 h-4 w-4 shrink-0 text-[#98A2B3] transition-transform duration-200",
          isOpen && "rotate-180",
        )} />
      </button>

      {/* Accordion body */}
      <div className={cn(
        "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
        isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 pointer-events-none",
      )}>
        <div className="overflow-hidden">
          <div className="px-5 pb-4 pt-2 space-y-3">
            {/* Attempted Resolution — collapsible */}
            <div className="rounded-xl border border-[#BFDBFE] bg-white dark:border-[#1B3A52] dark:bg-[#0F2233] overflow-hidden">
              <button
                type="button"
                onClick={() => setIsAttemptedResolutionOpen((v) => !v)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1260B0] dark:text-[#1260B0]">Customer Snapshot</p>
                <ChevronDown className={cn("h-3.5 w-3.5 text-[#1260B0] transition-transform duration-200 dark:text-[#1260B0]", isAttemptedResolutionOpen && "rotate-180")} />
              </button>
              <div className={cn("grid transition-all duration-200 ease-out", isAttemptedResolutionOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                <div className="overflow-hidden">
                  <div className="px-4 pb-4 space-y-3">
                    {/* Customer Context card */}
                    {resolvedCustomerContext && (
                      <div className="flex items-start gap-2.5 rounded-lg bg-[#EEF0FF] px-3 py-2.5">
                        <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#1260B0]" />
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1260B0] mb-0.5">Customer Context</p>
                          <p className="text-[12px] text-[#344054] dark:text-[#4E7D96] leading-relaxed">{resolvedCustomerContext}</p>
                        </div>
                      </div>
                    )}
                    <ul className="space-y-2">
                      {(customerRecord?.customerSnapshot ?? []).map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-[12px] text-[#344054] dark:text-[#4E7D96] leading-relaxed">
                          <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#1260B0] dark:bg-[#244D68]" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            {/* Ask Copilot — sits below the Attempted Resolution accordion */}
            {/* Copilot response card — appears above the Ask input after submission */}
            {copilotPhase !== "idle" && (
              <CopilotResponseCard
                query={submittedQuery}
                phase={copilotPhase}
                reasoningVisible={copilotReasoningVisible}
                isOpen={isCopilotOpen}
                onToggle={() => setIsCopilotOpen((v) => !v)}
              />
            )}
            {/* Ask Copilot input */}
            <div className="flex items-center gap-2 rounded-lg border border-[#BFDBFE] bg-white dark:bg-[#0C1A26] dark:border-[#1B3A52] px-3 py-2">
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#166CCA]" />
              <input
                type="text"
                value={copilotQuery}
                onChange={(e) => setCopilotQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleCopilotSubmit(); }}
                placeholder="Ask Copilot about this Case"
                className="min-w-0 flex-1 bg-transparent text-[12px] text-[#344054] dark:text-[#94A3B8] placeholder:text-[#98A2B3] outline-none"
              />
              <button type="button" onClick={handleCopilotSubmit} className="shrink-0 text-[#166CCA] hover:text-[#1260B0] transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </div>

            {/* Transfer / Open actions */}
            <div className="flex items-center justify-end gap-2 pt-1">
              {showReject && rejectTriggerRect && (
                <RejectPopover
                  priority={priorityKey}
                  preview={item.preview}
                  triggerRect={rejectTriggerRect}
                  onClose={() => setShowReject(false)}
                  onAssign={() => { setShowReject(false); }}
                />
              )}
              <button
                ref={rejectButtonRef}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const rect = rejectButtonRef.current?.getBoundingClientRect();
                  if (rect) { setRejectTriggerRect(rect); setShowReject((v) => !v); }
                }}
                className="rounded-md border border-border bg-white px-3.5 py-1.5 text-[12px] font-semibold text-[#344054] hover:bg-[#F9FAFB] transition-colors"
              >
                Review
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onOpen(); }}
                className="rounded-md bg-[#166CCA] px-3.5 py-1.5 text-[12px] font-semibold text-white hover:bg-[#1260B0] transition-colors"
              >
                Takeover
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Shared row data type ─────────────────────────────────────────────────────
type RowData = StaticAssignment & {
  isLive: boolean;
  isAccepted: boolean;
  isClosed: boolean;
  isParkedFromToast: boolean;
  liveAssignmentId: string | null;
  onAccept: () => void;
  onReject: () => void;
  onReopen: () => void;
  onMonitor: () => void;
  onSupervise: () => void;
  /** Takeover-specific accept: uses the pre-stamped handoff conversation as initialConversation. */
  onTakeoverAccept: (handoffConversation: SharedConversationData) => void;
};

// ─── BulkResponseModal ────────────────────────────────────────────────────────


function BulkResponseModal({
  label,
  count,
  onClose,
  onSent,
}: {
  label: string;
  count: number;
  onClose: () => void;
  onSent: () => void;
}) {
  const aiResponse = BULK_AI_RESPONSES[label] ?? "We're aware of the issue affecting your account and our team is actively working to resolve it. We appreciate your patience and will be in touch shortly.";
  const [response, setResponse] = useState(aiResponse);
  const [channels, setChannels] = useState({ email: true, sms: true, inApp: false });
  const [sent, setSent] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(onClose, 180);
  }, [isClosing, onClose]);

  function toggleChannel(key: keyof typeof channels) {
    setChannels((c) => ({ ...c, [key]: !c[key] }));
  }

  function handleSend() {
    setSent(true);
    onSent();
    // Show success state briefly, then fade out and close
    setTimeout(handleClose, 900);
  }

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] px-4 ${isClosing ? "animate-backdrop-fade-out" : ""}`}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className={`w-full max-w-lg rounded-2xl bg-white shadow-[0_24px_64px_rgba(0,0,0,0.18)] overflow-hidden ${isClosing ? "animate-modal-fade-out" : "animate-in fade-in slide-in-from-bottom-4 duration-300"}`}>
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-[#F2F4F7]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EBF4FD]">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#166CCA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div>
              <p className="text-[15px] font-semibold text-[#101828]">Bulk Response</p>
              <p className="text-[12px] text-[#667085]">{count} customers affected</p>
            </div>
          </div>
          <button type="button" onClick={handleClose} className="flex h-8 w-8 items-center justify-center rounded-full text-[#98A2B3] hover:bg-[#F2F4F7] hover:text-[#344054] transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
          {/* Issue */}
          <div className="px-6 pt-4 pb-3">
            <div className="rounded-xl border border-[#E4E7EC] bg-[#F9FAFB] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#98A2B3] mb-1">Issue</p>
              <p className="text-[13px] font-semibold text-[#101828]">{label}</p>
              <p className="text-[12px] text-[#667085] mt-0.5">{label} cases affecting multiple customers</p>
            </div>
          </div>

          {/* AI Suggested Response */}
          <div className="px-6 pb-3">
            <div className="rounded-xl border border-[#BFDBFE] bg-[#EBF4FD] px-4 py-3">
              <div className="flex items-center gap-2 mb-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#166CCA]">
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                </div>
                <p className="text-[13px] font-semibold text-[#1260B0]">AI Suggested Response</p>
              </div>
              <div className="rounded-lg bg-white border border-[#BFDBFE] px-3 py-2.5">
                <p className="text-[12px] text-[#344054] leading-relaxed">{aiResponse}</p>
              </div>
              <button type="button" onClick={() => setResponse(aiResponse)} className="mt-2 text-[11px] font-medium text-[#166CCA] hover:underline">
                Use this response →
              </button>
            </div>
          </div>

          {/* Your Response */}
          <div className="px-6 pb-3">
            <div className="flex items-baseline gap-2 mb-1.5">
              <p className="text-[13px] font-semibold text-[#101828]">Your Response</p>
              <p className="text-[11px] text-[#98A2B3]">(or use voice command)</p>
            </div>
            <div className="rounded-xl border border-[#D0D5DD] bg-white overflow-hidden">
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                rows={5}
                className="w-full resize-none px-4 pt-3 pb-2 text-[12px] text-[#344054] leading-relaxed outline-none"
                placeholder="Type your response here..."
              />
              <div className="flex items-center justify-between px-4 pb-3">
                <div className="flex items-center gap-1.5 text-[11px] text-[#98A2B3]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                  Click mic or type
                </div>
                <p className="text-[11px] text-[#98A2B3]">{count} recipients</p>
              </div>
            </div>
          </div>

          {/* Delivery Channels */}
          <div className="px-6 pb-5">
            <p className="text-[13px] font-semibold text-[#101828] mb-2">Delivery Channels</p>
            <div className="flex items-center gap-4">
              {([
                { key: "email", label: "Email" },
                { key: "sms",   label: "SMS"   },
                { key: "inApp", label: "In-App Notification" },
              ] as const).map(({ key, label: lbl }) => (
                <label key={key} className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input type="checkbox" checked={channels[key]} onChange={() => toggleChannel(key)} className="h-3.5 w-3.5 rounded border-[#D0D5DD] accent-[#166CCA] cursor-pointer" />
                  <span className="text-[12px] text-[#344054]">{lbl}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-[#F2F4F7]">
          <button
            type="button"
            onClick={handleSend}
            disabled={sent || !response.trim()}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-semibold text-white transition-colors",
              sent ? "bg-[#12B76A]" : "bg-[#166CCA] hover:bg-[#1260B0] disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          >
            {sent ? (
              <><Check className="h-4 w-4" /> Sent!</>
            ) : (
              <><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>Send to All {count} Customers</>
            )}
          </button>
          <button type="button" onClick={handleClose} className="rounded-xl border border-[#D0D5DD] bg-white px-5 py-2.5 text-[13px] font-semibold text-[#344054] hover:bg-[#F9FAFB] transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ─── QueueCardView — full-detail card grid for card view mode ────────────────


function QueueCard({ caseData }: { caseData: RowData }) {
  const { pushTransferredToast } = useLayoutContext();
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferTriggerRect, setTransferTriggerRect] = useState<DOMRect | null>(null);
  const transferBtnRef = useRef<HTMLButtonElement>(null);
  const [isResolutionOpen, setIsResolutionOpen] = useState(true);
  const [copilotQuery, setCopilotQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [copilotPhase, setCopilotPhase] = useState<"idle" | "thinking" | "done">("idle");
  const [reasoningVisible, setReasoningVisible] = useState(0);
  const [isCopilotOpen, setIsCopilotOpen] = useState(true);
  const [isReasoningOpen, setIsReasoningOpen] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => { timersRef.current.forEach(clearTimeout); }, []);

  function handleSubmit() {
    if (!copilotQuery.trim()) return;
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setSubmittedQuery(copilotQuery); setCopilotQuery("");
    setCopilotPhase("thinking"); setReasoningVisible(0); setIsCopilotOpen(true);
    CARD_COPILOT_STEPS.forEach((_, i) => {
      const t = setTimeout(() => setReasoningVisible(i + 1), 1000 + i * 600);
      timersRef.current.push(t);
    });
    timersRef.current.push(setTimeout(() => setCopilotPhase("done"), 1000 + CARD_COPILOT_STEPS.length * 600 + 600));
  }

  const statusBg = caseData.status === "escalated" ? "border-[#E53935] bg-[#FEF2F2]" : "border-border bg-white";

  return (
    <div className={cn("flex flex-col rounded-2xl border shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md", statusBg)}>
      {/* Card header */}
      <div className="px-5 pt-4 pb-3 border-b border-border">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="text-[14px] font-semibold text-[#1D2939] leading-snug">{caseData.name}</span>
            <span className={cn(
              "rounded border px-1.5 py-0.5 text-[10px] font-semibold leading-none",
              caseData.status === "escalated" && "border-[#E53935] bg-[#FDEAEA] text-[#C71D1A]",
              caseData.status === "open"      && "border-[#B9E0B4] bg-[#F0FAF0] text-[#1E7B1E]",
              caseData.status === "pending"   && "border-[#D0D5DD] bg-[#F9FAFB] text-[#667085]",
              caseData.status === "resolved"  && "border-[#BFDBFE] bg-[#EBF4FD] text-[#166CCA]",
            )}>
              {caseData.status}
            </span>
            {caseData.assignedTo && (
              <span className="inline-flex items-center gap-1 rounded-full border border-[#BFDBFE] bg-[#EBF4FD] px-2 py-0.5 text-[10px] font-semibold text-[#166CCA]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#166CCA]" />
                Assigned — {caseData.assignedTo}
              </span>
            )}
          </div>
        </div>
        <p className="text-[12px] text-[#475467] leading-snug mb-1">{caseData.preview}</p>
        <p className="text-[11px] text-[#98A2B3]">{caseData.botType} · ⏱ {caseData.waitTime}</p>

        {/* Actions */}
        {caseData.status !== "resolved" && (
          <div className="flex items-center gap-2 mt-3 relative">
            {showTransfer && transferTriggerRect && (
              <RejectPopover
                priority={caseData.priority}
                preview={caseData.preview}
                triggerRect={transferTriggerRect}
                onClose={() => setShowTransfer(false)}
                onAssign={() => { setShowTransfer(false); caseData.onReject(); }}
              />
            )}
            {caseData.assignedTo === CURRENT_AGENT_NAME && (
              <button
                type="button"
                ref={transferBtnRef}
                onClick={() => {
                  const rect = transferBtnRef.current?.getBoundingClientRect();
                  if (rect) { setTransferTriggerRect(rect); setShowTransfer(true); }
                }}
                className="flex items-center gap-1.5 rounded-md border border-[#D0D5DD] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#344054] hover:bg-[#F9FAFB] transition-colors"
              >
                Transfer
              </button>
            )}
            <button
              type="button"
              onClick={() => caseData.onMonitor()}
              className="flex items-center gap-1.5 rounded-md border border-[#D0D5DD] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#344054] hover:bg-[#F9FAFB] transition-colors"
            >
              Review
            </button>
            <TakeoverButton
              botType={caseData.botType}
              customerName={caseData.name}
              customerRecordId={caseData.customerRecordId ?? ""}
              channel={caseData.channel}
              onTakeover={(handoffConversation) => {
                pushTransferredToast({ id: caseData.id, name: caseData.name, customerId: caseData.customerId, customerRecordId: caseData.customerRecordId ?? "", channel: caseData.channel as AssignmentChannel, label: caseData.botType, priority: caseData.priority, preview: caseData.preview });
                caseData.onTakeoverAccept(handoffConversation);
              }}
              className="rounded-md bg-[#166CCA] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#1260B0] transition-colors"
            />
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="flex-1 px-4 py-4 space-y-3 overflow-hidden">
        {/* Customer Context */}
        {caseData.customerContext && (
          <div className="rounded-xl border border-[#BFDBFE] bg-[#EBF4FD] p-4">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#1260B0]">Customer Context</p>
            <p className="text-[12px] leading-5 text-[#344054]">{caseData.customerContext}</p>
          </div>
        )}

        {/* Attempted Resolution */}
        <div className="rounded-xl border border-[#BFDBFE] bg-white overflow-hidden">
          <button
            type="button"
            onClick={() => setIsResolutionOpen((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-3 text-left"
          >
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1260B0]">Customer Snapshot</p>
            <ChevronDown className={cn("h-3.5 w-3.5 text-[#1260B0] transition-transform duration-200", isResolutionOpen && "rotate-180")} />
          </button>
          <div className={cn("grid transition-all duration-200 ease-out", isResolutionOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
            <div className="overflow-hidden">
              <ul className="px-4 pb-4 space-y-2">
                {(getCustomerRecord(caseData.customerRecordId ?? "")?.customerSnapshot ?? []).map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px] text-[#344054] leading-relaxed">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#1260B0]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Copilot response */}
        {copilotPhase !== "idle" && (
          <div className="rounded-xl border border-[#BFDBFE] bg-white overflow-hidden">
            <button type="button" onClick={() => setIsCopilotOpen((v) => !v)} className="flex w-full items-center justify-between px-4 py-3 text-left">
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-[#166CCA]" />
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1260B0]">Copilot Response</p>
                {copilotPhase === "thinking" && (
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#166CCA] animate-bounce [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-[#166CCA] animate-bounce [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-[#166CCA] animate-bounce [animation-delay:300ms]" />
                  </span>
                )}
              </div>
              <ChevronDown className={cn("h-3.5 w-3.5 text-[#1260B0] transition-transform duration-200", isCopilotOpen && "rotate-180")} />
            </button>
            <div className={cn("grid transition-all duration-200 ease-out", isCopilotOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
              <div className="overflow-hidden px-4 pb-4 space-y-2">
                <p className="text-[11px] text-[#98A2B3] italic">"{submittedQuery}"</p>
                {reasoningVisible > 0 && (
                  <div>
                    <button type="button" onClick={() => setIsReasoningOpen((v) => !v)} className="flex items-center gap-1 text-[11px] text-[#98A2B3] hover:text-[#667085] transition-colors">
                      <span>{copilotPhase === "thinking" ? "Thinking…" : "Thought process"}</span>
                      <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", isReasoningOpen && "rotate-180")} />
                    </button>
                    <div className={cn("grid transition-all duration-200 ease-out", isReasoningOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                      <div className="overflow-hidden pt-2 space-y-1.5 border-l-2 border-[#C5DEF5] ml-1 pl-3">
                        {CARD_COPILOT_STEPS.slice(0, reasoningVisible).map((step, i) => (
                          <div key={i} className="text-[11px] text-[#98A2B3]">{step}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {copilotPhase === "done" && (
                  <div className="rounded-lg bg-[#EBF4FD] border border-[#BFDBFE] px-3 py-2.5">
                    <p className="text-[12px] text-[#344054] leading-relaxed">Based on the case analysis, I recommend verifying the account settings directly, issuing a service credit for the disruption, and scheduling a follow-up within 48 hours to confirm resolution.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Ask Copilot — pinned to bottom of card */}
      <div className="shrink-0 border-t border-[#E4E7EC] px-4 py-3">
        <div className="flex items-center gap-2 rounded-lg border border-[#BFDBFE] bg-white px-3 py-2">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#166CCA]" />
          <input
            type="text"
            value={copilotQuery}
            onChange={(e) => setCopilotQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
            placeholder="Ask Copilot about this Case"
            className="min-w-0 flex-1 bg-transparent text-[12px] text-[#344054] placeholder:text-[#98A2B3] outline-none"
          />
          <button type="button" onClick={handleSubmit} className="shrink-0 text-[#166CCA] hover:text-[#1260B0] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MonitorCard — full monitor-mode card for carousel ───────────────────────

function MonitorCard({ caseData, isActive }: { caseData: RowData; isActive: boolean }) {
  const { pushTransferredToast } = useLayoutContext();
  const [isResolutionOpen, setIsResolutionOpen] = useState(true);
  const [copilotQuery, setCopilotQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [copilotPhase, setCopilotPhase] = useState<"idle" | "thinking" | "done">("idle");
  const [reasoningVisible, setReasoningVisible] = useState(0);
  const [isCopilotOpen, setIsCopilotOpen] = useState(true);
  const [isReasoningOpen, setIsReasoningOpen] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => { timersRef.current.forEach(clearTimeout); }, []);

  function handleSubmit() {
    if (!copilotQuery.trim()) return;
    timersRef.current.forEach(clearTimeout); timersRef.current = [];
    setSubmittedQuery(copilotQuery); setCopilotQuery("");
    setCopilotPhase("thinking"); setReasoningVisible(0); setIsCopilotOpen(true);
    CARD_COPILOT_STEPS.forEach((_, i) => {
      const t = setTimeout(() => setReasoningVisible(i + 1), 1000 + i * 600);
      timersRef.current.push(t);
    });
    timersRef.current.push(setTimeout(() => setCopilotPhase("done"), 1000 + CARD_COPILOT_STEPS.length * 600 + 600));
  }

  const channel = (caseData.channel === "sms" ? "sms" : "chat") as "chat" | "sms";
  const conversation = caseData.customerRecordId
    ? createConversationState(caseData.customerRecordId, channel)
    : { customerName: caseData.name, label: "Chat", timelineLabel: "", status: "open" as const, draft: "", messages: [{ id: 1, role: "customer" as const, content: caseData.preview, time: caseData.waitTime || "now" }], isCustomerTyping: false };

  return (
    <div className={cn(
      "flex flex-col h-full rounded-2xl border shadow-md overflow-hidden bg-white transition-all duration-300",
      isActive ? "shadow-[0_8px_32px_rgba(22,108,202,0.14)] border-[#BFDBFE]" : "opacity-60 border-border",
      caseData.status === "escalated" && isActive && "border-[#E53935]/30 shadow-[0_8px_32px_rgba(229,57,53,0.12)]",
    )}>
      {/* Card header */}
      <div className={cn(
        "shrink-0 px-5 pt-3 pb-3 border-b border-border",
        caseData.status === "escalated" && "bg-[#FEF2F2]",
      )}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="text-[14px] font-bold text-[#101828]">{caseData.name}</span>
            <span className={cn(
              "rounded border px-1.5 py-0.5 text-[10px] font-semibold leading-none capitalize",
              caseData.status === "escalated" && "border-[#E53935] bg-[#FDEAEA] text-[#C71D1A]",
              caseData.status === "open"      && "border-[#B9E0B4] bg-[#F0FAF0] text-[#1E7B1E]",
              caseData.status === "pending"   && "border-[#D0D5DD] bg-[#F9FAFB] text-[#667085]",
              caseData.status === "resolved"  && "border-[#BFDBFE] bg-[#EBF4FD] text-[#166CCA]",
            )}>{caseData.status}</span>
            {caseData.assignedTo && (
              <span className="inline-flex items-center gap-1 rounded-full border border-[#BFDBFE] bg-[#EBF4FD] px-2 py-0.5 text-[10px] font-semibold text-[#166CCA]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#166CCA]" />
                Assigned — {caseData.assignedTo}
              </span>
            )}
          </div>
          {caseData.status !== "resolved" && (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => caseData.onMonitor()}
                className="rounded-md border border-[#D0D5DD] bg-white px-4 py-1.5 text-[11px] font-semibold text-[#344054] hover:bg-[#F9FAFB] transition-colors"
              >
                Review
              </button>
              <TakeoverButton
                botType={caseData.botType}
                customerName={caseData.name}
                customerRecordId={caseData.customerRecordId ?? ""}
                channel={caseData.channel}
                onTakeover={(handoffConversation) => {
                  pushTransferredToast({ id: caseData.id, name: caseData.name, customerId: caseData.customerId, customerRecordId: caseData.customerRecordId ?? "", channel: caseData.channel as AssignmentChannel, label: caseData.botType, priority: caseData.priority, preview: caseData.preview });
                  caseData.onTakeoverAccept(handoffConversation);
                }}
                className="rounded-md bg-[#E53935] px-4 py-1.5 text-[11px] font-semibold text-white hover:bg-[#C71D1A] transition-colors"
              />
            </div>
          )}
        </div>
        <p className="mt-0.5 text-[12px] text-[#475467] truncate">{caseData.preview}</p>
        <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-[#98A2B3]">
          <span>{caseData.botType}</span><span>·</span><span className="capitalize">{caseData.channel}</span><span>·</span><span>⏱ {caseData.waitTime}</span>
        </div>
      </div>

      {/* Two-column body */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left: AI analysis */}
        <div className="flex flex-col w-[320px] shrink-0 border-r border-border overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {caseData.customerContext && (
              <div className="rounded-xl border border-[#BFDBFE] bg-[#EBF4FD] p-4">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#1260B0]">Customer Context</p>
                <p className="text-[12px] leading-5 text-[#344054]">{caseData.customerContext}</p>
              </div>
            )}
            <div className="rounded-xl border border-[#BFDBFE] bg-white overflow-hidden">
              <button type="button" onClick={() => setIsResolutionOpen((v) => !v)} className="flex w-full items-center justify-between px-4 py-3 text-left">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1260B0]">Customer Snapshot</p>
                <ChevronDown className={cn("h-3.5 w-3.5 text-[#1260B0] transition-transform duration-200", isResolutionOpen && "rotate-180")} />
              </button>
              <div className={cn("grid transition-all duration-200 ease-out", isResolutionOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                <div className="overflow-hidden">
                  <ul className="px-4 pb-4 space-y-2">
                    {(getCustomerRecord(caseData.customerRecordId ?? "")?.customerSnapshot ?? []).map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-[12px] text-[#344054] leading-relaxed">
                        <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#1260B0]" />{item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            {copilotPhase !== "idle" && (
              <div className="rounded-xl border border-[#BFDBFE] bg-white overflow-hidden">
                <button type="button" onClick={() => setIsCopilotOpen((v) => !v)} className="flex w-full items-center justify-between px-4 py-3 text-left">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-[#166CCA]" />
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1260B0]">Copilot Response</p>
                    {copilotPhase === "thinking" && <span className="flex gap-1"><span className="h-1.5 w-1.5 rounded-full bg-[#166CCA] animate-bounce [animation-delay:0ms]"/><span className="h-1.5 w-1.5 rounded-full bg-[#166CCA] animate-bounce [animation-delay:150ms]"/><span className="h-1.5 w-1.5 rounded-full bg-[#166CCA] animate-bounce [animation-delay:300ms]"/></span>}
                  </div>
                  <ChevronDown className={cn("h-3.5 w-3.5 text-[#1260B0] transition-transform duration-200", isCopilotOpen && "rotate-180")} />
                </button>
                <div className={cn("grid transition-all duration-200 ease-out", isCopilotOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                  <div className="overflow-hidden px-4 pb-4 space-y-2">
                    <p className="text-[11px] text-[#98A2B3] italic">"{submittedQuery}"</p>
                    {reasoningVisible > 0 && (
                      <div>
                        <button type="button" onClick={() => setIsReasoningOpen((v) => !v)} className="flex items-center gap-1 text-[11px] text-[#98A2B3] hover:text-[#667085] transition-colors">
                          <span>{copilotPhase === "thinking" ? "Thinking…" : "Thought process"}</span>
                          <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", isReasoningOpen && "rotate-180")} />
                        </button>
                        <div className={cn("grid transition-all duration-200 ease-out", isReasoningOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                          <div className="overflow-hidden pt-2 space-y-1.5 border-l-2 border-[#C5DEF5] ml-1 pl-3">
                            {CARD_COPILOT_STEPS.slice(0, reasoningVisible).map((step, i) => <div key={i} className="text-[11px] text-[#98A2B3]">{step}</div>)}
                          </div>
                        </div>
                      </div>
                    )}
                    {copilotPhase === "done" && (
                      <div className="rounded-lg bg-[#EBF4FD] border border-[#BFDBFE] px-3 py-2.5">
                        <p className="text-[12px] text-[#344054] leading-relaxed">Based on the case analysis, I recommend verifying the account settings directly, issuing a service credit for the disruption, and scheduling a follow-up within 48 hours to confirm resolution.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="shrink-0 border-t border-[#E4E7EC] px-4 py-3">
            <div className="flex items-center gap-2 rounded-lg border border-[#BFDBFE] bg-white px-3 py-2">
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#166CCA]" />
              <input type="text" value={copilotQuery} onChange={(e) => setCopilotQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }} placeholder="Ask Copilot about this Case" className="min-w-0 flex-1 bg-transparent text-[12px] text-[#344054] placeholder:text-[#98A2B3] outline-none" />
              <button type="button" onClick={handleSubmit} className="shrink-0 text-[#166CCA] hover:text-[#1260B0] transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Right: live conversation */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <ConversationPanel
            key={caseData.id}
            draftKey={`carousel-${caseData.id}`}
            conversation={conversation}
            activeChannel={channel}
            openChannels={[channel]}
            customerId={caseData.customerRecordId}
            showAiPanel={false}
            hideTranscript={false}
            hideInput={true}
            isPendingAcceptance={false}
            onSelectChannel={() => {}}
            onConversationChange={() => {}}
            suppressAgentTasks={caseData.customerRecordId === "marcus"}
          />
        </div>
      </div>
    </div>
  );
}

// ─── QueueCarouselView — peek carousel with swipe/drag ───────────────────────

function QueueCarouselView({ rows, index, onIndexChange }: {
  rows: RowData[];
  index: number;
  onIndexChange: (i: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [containerW, setContainerW] = useState(0);

  // Measure container width — must be above any early returns
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([e]) => setContainerW(e.contentRect.width));
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  if (rows.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center px-8 h-full">
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          {/* Beach chair / relaxing agent */}
          <circle cx="60" cy="60" r="56" fill="#EBF4FD" stroke="#BFDBFE" strokeWidth="2"/>
          {/* Sun */}
          <circle cx="60" cy="38" r="12" fill="#FFD166"/>
          {/* Rays */}
          {[0,45,90,135,180,225,270,315].map((deg, i) => (
            <line key={i}
              x1={60 + Math.cos(deg * Math.PI/180) * 15}
              y1={38 + Math.sin(deg * Math.PI/180) * 15}
              x2={60 + Math.cos(deg * Math.PI/180) * 20}
              y2={38 + Math.sin(deg * Math.PI/180) * 20}
              stroke="#FFD166" strokeWidth="2" strokeLinecap="round"/>
          ))}
          {/* Hammock rope left */}
          <path d="M28 70 Q60 82 92 70" stroke="#4B96DA" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
          {/* Hammock body */}
          <path d="M28 70 Q60 90 92 70" stroke="#7C3AED" strokeWidth="0" fill="#BFDBFE" fillOpacity="0.5"/>
          <path d="M28 70 Q60 90 92 70 Q60 82 28 70Z" fill="#BFDBFE"/>
          {/* Person head */}
          <circle cx="80" cy="66" r="7" fill="#FDDCB5"/>
          {/* Zzz */}
          <text x="88" y="58" fontSize="10" fill="#166CCA" fontWeight="bold" fontFamily="sans-serif">z</text>
          <text x="93" y="52" fontSize="8" fill="#4B96DA" fontWeight="bold" fontFamily="sans-serif">z</text>
          <text x="97" y="47" fontSize="6" fill="#BFDBFE" fontWeight="bold" fontFamily="sans-serif">z</text>
          {/* Legs */}
          <line x1="34" y1="70" x2="28" y2="82" stroke="#166CCA" strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="92" y1="70" x2="98" y2="82" stroke="#166CCA" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
        <div>
          <p className="text-[15px] font-semibold text-[#344054]">Queue's clear — enjoy the break!</p>
          <p className="text-[12px] text-[#98A2B3] mt-1">No cases match your current filters.</p>
        </div>
      </div>
    );
  }

  function onPointerDown(e: React.PointerEvent) {
    // Don't start drag if the user pressed a button or other interactive element
    if ((e.target as HTMLElement).closest("button, input, textarea, a, select")) return;
    dragStartX.current = e.clientX;
    setIsDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (dragStartX.current === null) return;
    setDragOffset(e.clientX - dragStartX.current);
  }

  function onPointerUp() {
    const delta = dragOffset;
    setIsDragging(false);
    setDragOffset(0);
    dragStartX.current = null;
    if (delta < -60 && index < rows.length - 1) onIndexChange(index + 1);
    else if (delta > 60 && index > 0) onIndexChange(index - 1);
  }

  const CARD_MAX_W = 960;
  const PEEK = 48; // px of adjacent card visible on each side
  const GAP = 16;

  // Card width = min(CARD_MAX_W, containerW - 2*PEEK)
  const cardW = containerW > 0 ? Math.min(CARD_MAX_W, containerW - PEEK * 2) : CARD_MAX_W;
  const trackOffset = containerW > 0
    ? (containerW - cardW) / 2 - index * (cardW + GAP) + dragOffset
    : 0;

  return (
    <div ref={containerRef} className="flex flex-col h-full overflow-hidden py-3">
      {/* Track */}
      <div
        className="flex-1 min-h-0 max-h-[800px] overflow-hidden relative select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
      >
        {containerW > 0 && (
          <div
            className="flex h-full items-stretch absolute top-0 left-0"
            style={{
              transform: `translateX(${trackOffset}px)`,
              transition: isDragging ? "none" : "transform 0.38s cubic-bezier(0.22, 0.61, 0.36, 1)",
              gap: `${GAP}px`,
            }}
          >
            {rows.map((row, i) => (
              <div
                key={row.id}
                style={{ width: cardW, flexShrink: 0 }}
                className="h-full"
              >
                <MonitorCard caseData={row} isActive={i === index} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-1.5 pt-3 pb-1 shrink-0">
        {rows.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onIndexChange(i)}
            aria-label={`Go to card ${i + 1}`}
            className={cn(
              "rounded-full transition-all duration-300",
              i === index ? "w-5 h-1.5 bg-[#166CCA]" : "w-1.5 h-1.5 bg-[#D0D5DD] hover:bg-[#98A2B3]",
            )}
          />
        ))}
      </div>
    </div>
  );
}

function QueueCardView({ rows }: { rows: RowData[] }) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <CheckCircle className="h-8 w-8 text-[#D0D5DD] mb-3" />
        <p className="text-sm font-medium text-[#7A7A7A]">No cases</p>
        <p className="text-xs text-[#B0B7C3] mt-1">No tasks match the selected filter.</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 p-4">
      {rows.map((row) => (
        <QueueCard key={row.id} caseData={row} />
      ))}
    </div>
  );
}

// ─── CaseDetailPanel — right-side panel that opens when a row is clicked ────────

function CaseDetailPanel({ caseData, onClose }: { caseData: RowData; onClose: () => void }) {
  const { pushTransferredToast } = useLayoutContext();
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferTriggerRect, setTransferTriggerRect] = useState<DOMRect | null>(null);
  const transferBtnRef = useRef<HTMLButtonElement>(null);
  const [isAttemptedResolutionOpen, setIsAttemptedResolutionOpen] = useState(true);
  const [copilotQuery, setCopilotQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [copilotPhase, setCopilotPhase] = useState<"idle" | "thinking" | "done">("idle");
  const [copilotReasoningVisible, setCopilotReasoningVisible] = useState(0);
  const [isCopilotOpen, setIsCopilotOpen] = useState(true);
  const copilotTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Reset state when case changes
  useEffect(() => {
    setIsAttemptedResolutionOpen(true);
    setCopilotQuery(""); setSubmittedQuery(""); setCopilotPhase("idle");
    setCopilotReasoningVisible(0); setIsCopilotOpen(true);
    copilotTimersRef.current.forEach(clearTimeout);
    copilotTimersRef.current = [];
  }, [caseData.id]);

  useEffect(() => () => { copilotTimersRef.current.forEach(clearTimeout); }, []);

  function handleCopilotSubmit() {
    if (!copilotQuery.trim()) return;
    copilotTimersRef.current.forEach(clearTimeout);
    copilotTimersRef.current = [];
    setSubmittedQuery(copilotQuery); setCopilotQuery("");
    setCopilotPhase("thinking"); setCopilotReasoningVisible(0); setIsCopilotOpen(true);
    COPILOT_REASONING_STEPS.forEach((_, i) => {
      const t = setTimeout(() => setCopilotReasoningVisible(i + 1), 1000 + i * 600);
      copilotTimersRef.current.push(t);
    });
    copilotTimersRef.current.push(setTimeout(() => setCopilotPhase("done"), 1000 + COPILOT_REASONING_STEPS.length * 600 + 600));
  }

  return (
    <div className="w-[360px] h-full flex-shrink-0 border-l border-border flex flex-col bg-white dark:bg-[#0F1629] overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-5 py-4 border-b border-border">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <p className="text-[14px] font-semibold text-[#333333] dark:text-white leading-snug">{caseData.name}</p>
              {caseData.assignedTo && (
                <span className="inline-flex items-center gap-1 rounded-full border border-[#BFDBFE] bg-[#EBF4FD] px-2 py-0.5 text-[10px] font-semibold text-[#166CCA]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#166CCA]" />
                  Assigned — {caseData.assignedTo}
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#667085] mt-0.5 truncate">{caseData.preview}</p>
            <p className="text-[10px] text-[#98A2B3] mt-0.5">{caseData.botType} · Wait: {caseData.waitTime}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[#98A2B3] transition-colors hover:bg-[#F2F4F7] hover:text-[#344054]"
            aria-label="Close panel"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Review / Takeover / Transfer actions */}
        {caseData.status !== "resolved" && (
          <div className="flex items-center gap-2 mt-3">
            {showTransfer && transferTriggerRect && (
              <RejectPopover
                priority={caseData.priority}
                preview={caseData.preview}
                triggerRect={transferTriggerRect}
                onClose={() => setShowTransfer(false)}
                onAssign={() => { setShowTransfer(false); caseData.onReject(); }}
              />
            )}
            {caseData.assignedTo === CURRENT_AGENT_NAME && (
              <button
                type="button"
                ref={transferBtnRef}
                onClick={() => {
                  const rect = transferBtnRef.current?.getBoundingClientRect();
                  if (rect) { setTransferTriggerRect(rect); setShowTransfer(true); }
                }}
                className="flex items-center gap-1.5 rounded-md border border-[#D0D5DD] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#344054] hover:bg-[#F9FAFB] transition-colors"
              >
                Transfer
              </button>
            )}
            <button
              type="button"
              onClick={() => caseData.onMonitor()}
              className="flex items-center gap-1.5 rounded-md border border-[#D0D5DD] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#344054] hover:bg-[#F9FAFB] transition-colors"
            >
              Review
            </button>
            <TakeoverButton
              botType={caseData.botType}
              customerName={caseData.name}
              customerRecordId={caseData.customerRecordId ?? ""}
              channel={caseData.channel}
              onTakeover={(handoffConversation) => {
                pushTransferredToast({ id: caseData.id, name: caseData.name, customerId: caseData.customerId, customerRecordId: caseData.customerRecordId ?? "", channel: caseData.channel as AssignmentChannel, label: caseData.botType, priority: caseData.priority, preview: caseData.preview });
                caseData.onTakeoverAccept(handoffConversation);
              }}
              className="rounded-md bg-[#166CCA] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#1260B0] transition-colors"
            />
          </div>
        )}
      </div>

      {/* Body — scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Case metadata row: channel · priority · assignment */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-xl border border-border bg-[#FAFAFA] px-4 py-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#98A2B3]">Channel</span>
            <span className="text-[11px] font-medium capitalize text-[#344054]">{caseData.channel}</span>
          </div>
          <span className="text-[#D0D5DD]">·</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#98A2B3]">Priority</span>
            <span className={cn("text-[11px] font-semibold", caseData.priority === "Critical" && "text-[#C71D1A]", caseData.priority === "High" && "text-[#A37A00]", caseData.priority === "Medium" && "text-[#166CCA]", caseData.priority === "Low" && "text-[#208337]")}>{caseData.priority}</span>
          </div>
          <span className="text-[#D0D5DD]">·</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#98A2B3]">Assigned To</span>
            {caseData.assignedTo ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#166CCA]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#166CCA]" />
                {caseData.assignedTo}
              </span>
            ) : caseData.botType ? (
              <span className="text-[11px] font-medium text-[#475467]">{caseData.botType}</span>
            ) : (
              <span className="text-[11px] text-[#98A2B3]">Unassigned</span>
            )}
          </div>
        </div>

        {/* Customer Context */}
        {caseData.customerContext && (
          <div className="rounded-xl border border-[#BFDBFE] bg-[#EBF4FD] p-4">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#1260B0]">Customer Context</p>
            <p className="text-[12px] leading-5 text-[#344054]">{caseData.customerContext}</p>
          </div>
        )}

        {/* Attempted Resolution */}
        <div className="rounded-xl border border-[#BFDBFE] bg-white overflow-hidden">
          <button
            type="button"
            onClick={() => setIsAttemptedResolutionOpen((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-3 text-left"
          >
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1260B0]">Customer Snapshot</p>
            <ChevronDown className={cn("h-3.5 w-3.5 text-[#1260B0] transition-transform duration-200", isAttemptedResolutionOpen && "rotate-180")} />
          </button>
          <div className={cn("grid transition-all duration-200 ease-out", isAttemptedResolutionOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
            <div className="overflow-hidden">
              <ul className="px-4 pb-4 space-y-2">
                {(getCustomerRecord(caseData.customerRecordId ?? "")?.customerSnapshot ?? []).map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px] text-[#344054] leading-relaxed">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#1260B0]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Copilot response card */}
        {copilotPhase !== "idle" && (
          <CopilotResponseCard
            query={submittedQuery}
            phase={copilotPhase}
            reasoningVisible={copilotReasoningVisible}
            isOpen={isCopilotOpen}
            onToggle={() => setIsCopilotOpen((v) => !v)}
          />
        )}
      </div>

      {/* Ask Copilot — fixed at bottom */}
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
          <button type="button" onClick={handleCopilotSubmit} className="shrink-0 text-[#166CCA] hover:text-[#1260B0] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── AnimatedCaseDetailPanel — wrapper that slides the detail panel in/out ─────

function AnimatedCaseDetailPanel({
  caseData,
  onClose,
}: {
  caseData: RowData | null;
  onClose: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeCase, setActiveCase] = useState<RowData | null>(null);

  useEffect(() => {
    if (caseData) {
      // Opening: mount first, then trigger slide-in on next frame
      setActiveCase(caseData);
      setMounted(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
    } else {
      // Closing: trigger slide-out, then unmount after transition
      setVisible(false);
      const timer = setTimeout(() => {
        setMounted(false);
        setActiveCase(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [caseData]);

  if (!mounted || !activeCase) return null;

  return (
    <div
      className="flex-shrink-0 h-full overflow-hidden transition-all duration-300 ease-out"
      style={{
        width: visible ? 360 : 0,
      }}
    >
      <div
        className="w-[360px] h-full transition-transform duration-300 ease-out"
        style={{
          transform: visible ? "translateX(0)" : "translateX(100%)",
        }}
      >
        <CaseDetailPanel caseData={activeCase} onClose={onClose} />
      </div>
    </div>
  );
}

// ─── IssueGroup — grouped accordion wrapper ────────────────────────────────────

function IssueGroup({
  label,
  items,
  monitoredCaseId,
  onResolveAll,
  selectedCaseId,
  onSelectCase,
}: {
  label: string;
  items: RowData[];
  monitoredCaseId: string | null;
  onResolveAll: () => void;
  selectedCaseId?: string | null;
  onSelectCase?: (id: string | null) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const hasSelected = items.some((i) => i.id === selectedCaseId);
  return (
    <div className="border-b border-border last:border-b-0">
      {showBulkModal && (
        <BulkResponseModal
          label={label}
          count={items.length}
          onClose={() => setShowBulkModal(false)}
          onSent={onResolveAll}
        />
      )}
      {/* Group header */}
      <div className={cn("relative flex w-full items-center justify-between px-5 py-2.5 bg-[#F9FAFB] hover:bg-[#F2F4F7] transition-colors", hasSelected && "pl-[22px]")}>        {hasSelected && <div className="absolute left-0 inset-y-0 w-[3px] rounded-r-full bg-[#166CCA]/50 z-[1]" />}
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          className="flex flex-1 items-center gap-2 text-left min-w-0"
        >
          <span className="text-[11px] font-semibold text-[#344054]">{label}</span>
          <span className="flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[#C5DEF5] px-1.5 text-[9px] font-bold text-[#166CCA]">
            {items.length}
          </span>
        </button>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowBulkModal(true); }}
            className="inline-flex items-center gap-1 rounded-full border border-[#BFDBFE] bg-white px-2.5 py-0.5 text-[10px] font-semibold text-[#166CCA] hover:bg-[#EBF4FD] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 10 4 15 9 20"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/></svg>
            Respond to all
          </button>
          <ChevronDown
            className={cn("h-3.5 w-3.5 text-[#98A2B3] transition-transform duration-200", isOpen && "rotate-180")}
            onClick={() => setIsOpen((v) => !v)}
          />
        </div>
      </div>

      {/* Group body */}
      <div className={cn("grid transition-all duration-200 ease-out", isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
        <div className="overflow-hidden">
          {items.map((a) => (
            <IssueRow key={a.id} {...a} isMonitored={monitoredCaseId === a.id} isSelected={selectedCaseId === a.id} onSelect={onSelectCase} />
          ))}
        </div>
      </div>
    </div>
  );
}
// ─── CustomerGroup ─────────────────────────────────────────────────────────────

function CustomerGroup({
  customerRecord,
  caseCustomerName,
  caseCustomerId,
  items,
  monitoredCaseId,
  onResolveAll,
  selectedCaseId,
  onSelectCase,
}: {
  customerRecord: ReturnType<typeof getCustomerRecord> | null;
  caseCustomerName?: string;
  caseCustomerId?: string;
  items: RowData[];
  monitoredCaseId: string | null;
  onResolveAll: () => void;
  selectedCaseId?: string | null;
  onSelectCase?: (id: string | null) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const hasSelected = items.some((i) => i.id === selectedCaseId);

  // Use the actual case customer's name/ID (from the case row), not the potentially-mismatched DB record
  const displayName = caseCustomerName ?? items[0]?.name ?? "Unknown Customer";
  const initials = displayName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  const customerId = caseCustomerId ?? items[0]?.customerId ?? "";
  // Only show extended contact/account info if the customerRecord actually matches (same customerId)
  const recordMatches = customerRecord?.customerId === customerId;
  const contactEmail = recordMatches ? (customerRecord?.contact?.email ?? "") : "";
  const contactPhone = recordMatches ? (customerRecord?.contact?.phone ?? customerRecord?.overview?.contactNumber ?? "") : "";
  const address = recordMatches ? customerRecord?.contact?.address : undefined;
  const accounts = recordMatches ? (customerRecord?.accounts ?? []) : [];

  return (
    <div className="border-b border-border last:border-b-0">
      {showBulkModal && (
        <BulkResponseModal
          label={displayName}
          count={items.length}
          onClose={() => setShowBulkModal(false)}
          onSent={onResolveAll}
        />
      )}

      {/* Customer group header */}
      <div className={cn("relative flex w-full items-center justify-between px-5 py-2.5 bg-[#F9FAFB] hover:bg-[#F2F4F7] transition-colors", hasSelected && "pl-[22px]")}>        {hasSelected && <div className="absolute left-0 inset-y-0 w-[3px] rounded-r-full bg-[#166CCA]/50 z-[1]" />}
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          className="flex flex-1 items-center gap-2.5 text-left min-w-0"
        >
          {/* Avatar */}
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#C5DEF5] text-[9px] font-bold text-[#1260B0]">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[12px] font-semibold text-[#344054] truncate">{displayName}</span>
              <span className="flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[#C5DEF5] px-1.5 text-[9px] font-bold text-[#166CCA]">
                {items.length}
              </span>
              <span className="text-[10px] text-[#98A2B3] font-mono">{customerId}</span>
            </div>
            {(contactEmail || contactPhone || address) && (
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {contactPhone && <span className="text-[10px] text-[#667085]">{contactPhone}</span>}
                {contactEmail && <span className="text-[10px] text-[#667085]">{contactEmail}</span>}
                {address && <span className="text-[10px] text-[#667085]">{address.city}, {address.state}</span>}
              </div>
            )}
          </div>
        </button>

        <div className="flex items-center gap-2 shrink-0 ml-2">
          {/* Accounts summary */}
          {accounts.length > 0 && (
            <div className="hidden sm:flex items-center gap-1">
              {accounts.slice(0, 2).map((acc) => (
                <span
                  key={acc.id}
                  className="rounded border border-[#E4E7EC] bg-white px-1.5 py-0.5 text-[9px] font-medium text-[#344054]"
                >
                  {acc.type} {acc.number}
                </span>
              ))}
            </div>
          )}
          <ChevronDown
            className={cn("h-3.5 w-3.5 text-[#98A2B3] transition-transform duration-200", isOpen && "rotate-180")}
            onClick={() => setIsOpen((v) => !v)}
          />
        </div>
      </div>

      {/* Cases */}
      <div className={cn("grid transition-all duration-200 ease-out", isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
        <div className="overflow-hidden">
          {items.map((a) => (
            <IssueRow key={a.id} {...a} isMonitored={monitoredCaseId === a.id} isSelected={selectedCaseId === a.id} onSelect={onSelectCase} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Persistent state store (survives navigation away and back) ───────────────
// Stored at module scope so it outlives component unmount/remount cycles.
const persistedState = {
  issueTab: new Set<StatusFilter>(),
  priorityFilters: new Set<Priority>(),
  channelFilters: new Set<ChannelFilterValue>(),
  agentTypeFilter: "all" as "all" | "virtual" | "human",
  groupMode: "customer" as "customer" | "case",
  monitoredCaseId: null as string | null,
  viewMode: "list" as "list" | "card" | "carousel",
  carouselIndex: 0,
  // Tracks which static case IDs have been marked escalated — persists across
  // navigation so the escalated state is not lost on remount.
  escalatedIds: new Set<string>(),
  // Tracks which static case IDs have been manually resolved via the modal.
  resolvedIds: new Set<string>(),
  // Top-level tab inside the Control Center (Review vs Queue).
  controlCenterTab: "monitor" as "monitor" | "assigned" | "queue",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ControlCenterPage({ mode }: { mode?: "inbox" | "control-panel" } = {}) {
  const { resolvedAssignments, assignmentStatusesById, acceptIssue, visibleAssignments, setAssignmentStatus, selectAssignment, openCopilot, isAgentAvailable, pendingMonitorCaseId, clearPendingMonitorCaseId, pendingTakeoverCaseId, clearPendingTakeoverCaseId, openCustomerConversation, dismissIncomingByCustomer, decrementEscalatedCount, onJordanCaseResolved, onSofiaCaseResolved, onMarcusCaseResolved, showDismissalToast, pushTransferredToast, setConversationStateForAssignment, activeLeadNotifications, dismissLeadNotification, launchLeadCall } = useLayoutContext();
  const navigate = useNavigate();
  const peakEscalationCountRef = useRef(0);
  const [homeTrendSlide, setHomeTrendSlide] = useState(0);
  const homeTrendSlideCount = 5;
  useEffect(() => {
    const id = setInterval(() => setHomeTrendSlide((s) => (s + 1) % homeTrendSlideCount), 8000);
    return () => clearInterval(id);
  }, []);
  const [activePageTab, setActivePageTab] = useState<DeskPageTab>("queue");
  const [controlCenterTab, setControlCenterTab] = useState<"monitor" | "assigned" | "queue">(() => {
    if (mode === "inbox") return "queue";
    // Restore the last active tab, defaulting to Home ("monitor")
    return persistedState.controlCenterTab === "queue" ? "monitor" : persistedState.controlCenterTab;
  });
  const [issueTab, setIssueTab] = useState<Set<StatusFilter>>(() => new Set(persistedState.issueTab));
  const [priorityFilters, setPriorityFilters] = useState<Set<Priority>>(() => new Set(persistedState.priorityFilters));
  const [channelFilters, setChannelFilters] = useState<Set<ChannelFilterValue>>(() => new Set(persistedState.channelFilters));
  const [agentTypeFilter, setAgentTypeFilter] = useState<"all" | "virtual" | "human">(() => persistedState.agentTypeFilter);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "card" | "carousel">(() => persistedState.viewMode);
  const [carouselIndex, setCarouselIndex] = useState(() => persistedState.carouselIndex);
  const [carouselDir, setCarouselDir] = useState<"next" | "prev">("next");
  const [groupMode, setGroupMode] = useState<"customer" | "case">(() => persistedState.groupMode);
  const filterPanelRef = useRef<HTMLDivElement>(null);

  // ── Lead "Launch Call" connecting state ───────────────────────────────────────
  const [launchingCallLeadId, setLaunchingCallLeadId] = useState<string | null>(null);
  const leadCallTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (leadCallTimerRef.current !== null) clearTimeout(leadCallTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isFilterPanelOpen) return;
    const handler = (e: MouseEvent) => {
      if (filterPanelRef.current && !filterPanelRef.current.contains(e.target as Node)) {
        setIsFilterPanelOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isFilterPanelOpen]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [rejectedIds, setRejectedIds] = useState<Set<string>>(new Set());

  // Drain any cross-page rejections queued by the global Layout modal.
  // We snapshot the ids BEFORE clearing so the baseRows filter below can use them on
  // this same render — without the snapshot, both rejectedIds (not yet updated) and
  // pendingQueueRejections (already cleared) would miss the just-dismissed case,
  // causing it to flash in staticNormalised alongside its resolvedNormalised entry.
  const pendingRejectionSnapshot = pendingQueueRejections.size > 0 ? new Set(pendingQueueRejections) : null;
  if (pendingRejectionSnapshot) {
    pendingQueueRejections.clear();
    setRejectedIds((prev) => {
      const next = new Set(prev);
      pendingRejectionSnapshot.forEach((id) => next.add(id));
      return next;
    });
  }

  // Trigger re-renders when acceptedStaticsStore changes (the store itself lives at module scope
  // so it survives remounts when the agent navigates away and back).
  const [, forceUpdate] = useState(0);
  const [escalatedModalCase, setEscalatedModalCase] = useState<EscalatedCaseModalData | null>(null);
  // Initialise from persistedState so escalated status survives navigation away and back.
  const [escalatedOverrides, setEscalatedOverrides] = useState<Set<string>>(() => new Set(persistedState.escalatedIds));
  const [bulkResolvedIds, setBulkResolvedIds] = useState<Set<string>>(() => new Set(persistedState.resolvedIds));

  // Drain resolved IDs queued by the global Layout modal (when Review is opened from a toast
  // on a non-Home page). Must be after bulkResolvedIds/escalatedOverrides are declared.
  const pendingResolvedSnapshot = pendingResolvedIds.size > 0 ? new Set(pendingResolvedIds) : null;
  if (pendingResolvedSnapshot) {
    pendingResolvedIds.clear();
    setBulkResolvedIds((prev) => {
      const next = new Set([...prev, ...pendingResolvedSnapshot]);
      persistedState.resolvedIds = next;
      return next;
    });
    setEscalatedOverrides((prev) => {
      const next = new Set(prev);
      pendingResolvedSnapshot.forEach((id) => next.delete(id));
      persistedState.escalatedIds = next;
      return next;
    });
  }

  // Drain escalated IDs queued by Layout (fires at the same moment as each toast).
  // Handles the case where this page was already mounted when the escalation fired.
  const pendingEscalatedSnapshot = pendingEscalatedIds.size > 0 ? new Set(pendingEscalatedIds) : null;
  if (pendingEscalatedSnapshot) {
    pendingEscalatedIds.clear();
    setEscalatedOverrides((prev) => {
      const next = new Set([...prev, ...pendingEscalatedSnapshot]);
      persistedState.escalatedIds = next;
      return next;
    });
  }

  // Poll for resolved IDs added while this page is already mounted (e.g. agent resolves
  // a case from the active conversation without navigating away from Home).
  useEffect(() => {
    const interval = setInterval(() => {
      if (pendingResolvedIds.size === 0) return;
      const snapshot = new Set(pendingResolvedIds);
      pendingResolvedIds.clear();
      setBulkResolvedIds((prev) => {
        const next = new Set([...prev, ...snapshot]);
        persistedState.resolvedIds = next;
        return next;
      });
      setEscalatedOverrides((prev) => {
        const next = new Set(prev);
        snapshot.forEach((id) => next.delete(id));
        persistedState.escalatedIds = next;
        return next;
      });
    }, 300);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll for escalated IDs written by Layout at the same moment as each toast.
  // Runs at 300 ms so multiple escalations queued at once are all picked up together.
  useEffect(() => {
    const interval = setInterval(() => {
      if (pendingEscalatedIds.size === 0) return;
      const snapshot = new Set(pendingEscalatedIds);
      pendingEscalatedIds.clear();
      setEscalatedOverrides((prev) => {
        const next = new Set([...prev, ...snapshot]);
        persistedState.escalatedIds = next;
        return next;
      });
    }, 300);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ref so the toast callback (created once) always reads the latest rows
  const staticNormalisedRef = useRef<RowData[]>([]);

  // Sync filter/view state into the persistence store whenever it changes so
  // navigating away and back restores the last state.
  useEffect(() => { persistedState.issueTab = issueTab; }, [issueTab]);
  useEffect(() => { persistedState.priorityFilters = priorityFilters; }, [priorityFilters]);
  useEffect(() => { persistedState.channelFilters = channelFilters; }, [channelFilters]);
  useEffect(() => { persistedState.agentTypeFilter = agentTypeFilter; }, [agentTypeFilter]);
  useEffect(() => { persistedState.groupMode = groupMode; }, [groupMode]);
  useEffect(() => { persistedState.viewMode = viewMode; }, [viewMode]);
  useEffect(() => { persistedState.carouselIndex = carouselIndex; }, [carouselIndex]);
  useEffect(() => { persistedState.controlCenterTab = controlCenterTab; }, [controlCenterTab]);

  // Reset carousel to first item whenever any filter changes in carousel mode
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (viewMode === "carousel") setCarouselIndex(0); }, [issueTab, priorityFilters, channelFilters, agentTypeFilter]);

  // Nadia Petrov / Payments Bot — auto-trigger disabled for now, kept for future use.
  // setEscalatedOverrides((prev) => new Set([...prev, "static-13"]));


  // When Review is clicked on an incoming toast, always open the modal.
  useEffect(() => {
    if (!pendingMonitorCaseId) return;
    const match = staticNormalisedRef.current.find(
      (r) => r.customerRecordId === pendingMonitorCaseId || r.id === pendingMonitorCaseId,
    );
    if (match) {
      const effectiveStatus = escalatedOverrides.has(match.id) ? "escalated" : match.status;
      setEscalatedModalCase({ ...match, status: effectiveStatus });
    }
    clearPendingMonitorCaseId();
  }, [pendingMonitorCaseId, clearPendingMonitorCaseId, escalatedOverrides]);

  const rejectIssue = (id: string) => setRejectedIds((prev) => new Set([...prev, id]));

  const handleAcceptStatic = (a: StaticAssignment, statusOverride?: QueueAssignmentStatus, initialConversationOverride?: SharedConversationData) => {
    // If this case is already open in the rail, just navigate to it — don't create a duplicate channel.
    const existingAssignmentId = acceptedStaticsStore.get(a.id);
    const isAlreadyOpen = !!existingAssignmentId && visibleAssignments.some((v) => v.id === existingAssignmentId);
    if (isAlreadyOpen) {
      if (a.customerRecordId) dismissIncomingByCustomer(a.customerRecordId);
      // If a handoff conversation was supplied (e.g. Takeover after supervising), stamp the
      // existing channel's state before navigating so the correct messages are shown immediately.
      if (initialConversationOverride) {
        setConversationStateForAssignment(existingAssignmentId, initialConversationOverride);
      }
      selectAssignment(existingAssignmentId);
      navigate("/activity");
      return;
    }

    const channel = (a.channel === "sms" ? "sms" : "chat") as "chat" | "sms";
    const initialConversation = initialConversationOverride ?? (a.customerRecordId
      ? createConversationState(a.customerRecordId, channel)
      : undefined);

    const data: AcceptIssueData = {
      id: a.id,
      name: a.name,
      customerId: a.customerId,
      customerRecordId: a.customerRecordId,
      channel: a.channel,
      priority: a.priority,
      preview: a.preview,
      status: statusOverride ?? a.status,
      waitTime: a.waitTime,
      isOutbound: true,
      initialConversation,
      onCreated: (assignmentId) => {
        acceptedStaticsStore.set(a.id, assignmentId);
        forceUpdate((v) => v + 1);
      },
    };
    // Close the incoming toast for this customer if one is showing.
    if (a.customerRecordId) dismissIncomingByCustomer(a.customerRecordId);
    acceptIssue(data);
  };

  // When Takeover is clicked on an incoming toast, accept that case and highlight it.
  // This effect runs after handleAcceptStatic is defined.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!pendingTakeoverCaseId) return;
    const match = staticNormalisedRef.current.find(
      (r) => r.customerRecordId === pendingTakeoverCaseId || r.id === pendingTakeoverCaseId,
    );
    if (match) handleAcceptStatic(match);
    clearPendingTakeoverCaseId();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingTakeoverCaseId]);

  // RowData is defined at module level below

  // Static tasks — status syncs with the live assignment when accepted.
  // isClosed = the task was accepted but the assignment has since been removed from the left rail.
  // Voice-channel tasks are excluded from the static list — they only appear when
  // an agent explicitly accepts a voice transfer from the assignments panel.
  const staticNormalised: RowData[] = staticAssignments.filter((a) => a.channel !== "voice").map((a) => {
    const assignmentId = acceptedStaticsStore.get(a.id);
    const liveStatus = assignmentId ? (assignmentStatusesById[assignmentId] as QueueAssignmentStatus | undefined) : undefined;
    const isAccepted = acceptedStaticsStore.has(a.id);
    const isClosed = isAccepted && !!assignmentId && !visibleAssignments.some((v) => v.id === assignmentId);
    // A case is "assigned to me" when it's been taken over and is still actively in the rail.
    const isAssignedToMe = isAccepted && !isClosed;
    const row: RowData = {
      ...a,
      // Override assignedTo with the runtime value — "You" when actively in rail, null otherwise.
      assignedTo: isAssignedToMe ? CURRENT_AGENT_NAME : null,
      status: (bulkResolvedIds.has(a.id) || (pendingResolvedSnapshot?.has(a.id) ?? false)) ? "resolved" : escalatedOverrides.has(a.id) ? "escalated" : (liveStatus ?? a.status),
      isLive: false,
      isAccepted,
      isClosed,
      isParkedFromToast: false,
      liveAssignmentId: assignmentId ?? null,
      onAccept: () => handleAcceptStatic(a, row.status),
      onReject: () => rejectIssue(a.id),
      onReopen: () => handleAcceptStatic(a, liveStatus ?? a.status),
      onMonitor: () => {
        if (a.customerRecordId) dismissIncomingByCustomer(a.customerRecordId);
        const effectiveStatus = bulkResolvedIds.has(a.id) ? "resolved" : escalatedOverrides.has(a.id) ? "escalated" : (row.status);
        setEscalatedModalCase({ ...row, status: effectiveStatus });
      },
      onSupervise: () => handleAcceptStatic(a, row.status),
      onTakeoverAccept: (handoffConversation) => handleAcceptStatic(a, row.status, handoffConversation),
    };
    return row;
  // Exclude closed cases (taken over + dismissed) — they are represented in resolvedNormalised
  // and keeping them here would cause Fatima (or any other case) to appear twice in the queue.
  }).filter((row) => !row.isClosed);
  staticNormalisedRef.current = staticNormalised;

  // Live assignments currently open in the left rail. Exclude dynamically-created
  // assignments (from acceptIssue → "issue-" prefix, or openCustomerConversation →
  // contains a millisecond timestamp) to avoid duplicating static-task entries.
  const acceptedAssignmentIds = new Set(acceptedStaticsStore.values());
  // CustomerRecordIds already represented by a non-rejected static assignment
  const staticCoveredCustomerIds = new Set(
    staticAssignments
      .filter((s) => s.customerRecordId && !rejectedIds.has(s.id))
      .map((s) => s.customerRecordId as string),
  );
  const validPriorities = new Set<string>(["Critical", "High", "Medium", "Low"]);
  const liveNormalised: RowData[] = visibleAssignments
    .filter((a) =>
      !acceptedAssignmentIds.has(a.id) &&
      !/\d{10,}/.test(a.id) &&
      !staticCoveredCustomerIds.has(a.customerRecordId),
    )
    .map((a) => {
      const liveStatus = (assignmentStatusesById[a.id] as QueueAssignmentStatus | undefined) ?? "open";
      const isParkedFromToast = liveStatus === "parked";
      // Parked items are held out of the left rail but belong in the Open queue tab.
      // Show them as unaccepted "open" rows so the agent can Accept them later.
      const displayStatus = isParkedFromToast ? "open" : liveStatus;
      const priority = (validPriorities.has(a.priority) ? a.priority : "Medium") as Priority;
      return {
        id: a.id,
        name: a.name,
        customerId: a.customerId,
        customerRecordId: a.customerRecordId,
        company: companyByCustomerId[a.customerRecordId] ?? a.name,
        botType: "Service Bot",
        caseType: "General Inquiry" as const,
        agentType: "virtual" as const,
        channel: a.channel as Channel,
        priority,
        status: displayStatus as QueueAssignmentStatus,
        preview: a.preview,
        waitTime: a.time,
        aiOverview: getLiveAiOverview(a.customerRecordId, a.name, a.preview, a.channel),
        customerContext: liveCustomerContext[a.customerRecordId] ?? "No additional customer context available.",
        isLive: true,
        isAccepted: !isParkedFromToast,
        isClosed: false,
        isParkedFromToast,
        liveAssignmentId: a.id,
        assignedTo: isParkedFromToast ? null : CURRENT_AGENT_NAME,
        onAccept: isParkedFromToast
          ? () => { setAssignmentStatus(a.id, "open"); selectAssignment(a.id); navigate("/activity"); }
          : () => {},
        onReject: () => {},
        onReopen: () => {},
        onMonitor: () => {},
        onSupervise: () => {},
        onTakeoverAccept: () => {},
      };
    });

  // Static ids that have a dismissed/resolved entry — used to suppress the original static row
  // so it never co-appears with its resolvedNormalised counterpart, regardless of rejectedIds timing.
  const staticIdsWithResolvedEntry = new Set(
    resolvedAssignments
      .filter((r) => r.staticId && !acceptedStaticsStore.has(r.staticId))
      .map((r) => r.staticId as string),
  );

  const baseRows = [...liveNormalised, ...staticNormalised]
    // Suppress static rows that are already represented in resolvedNormalised (dismissed cases).
    // This is timing-independent — no need to wait for rejectedIds to be updated.
    .filter((a) => !staticIdsWithResolvedEntry.has(a.id))
    // Also filter by pendingRejectionSnapshot to prevent a one-render flash.
    .filter((a) => !rejectedIds.has(a.id) && !(pendingRejectionSnapshot?.has(a.id) ?? false))
    .filter((a) => a.channel !== "email")
    .filter((a) => priorityFilters.size === 0 || priorityFilters.has(a.priority as Priority))
    .filter((a) => channelFilters.size === 0 || channelFilters.has(a.channel as ChannelFilterValue))
    .filter((a) => agentTypeFilter === "all" || a.agentType === agentTypeFilter);

  const filteredResolvedAssignments = resolvedAssignments.filter(
    (r) => r.channel !== "email" &&
            // Exclude cases that have been re-accepted — they'll appear in staticNormalised instead.
            // Use staticId (the static assignment id) which is what acceptedStaticsStore keys on.
            !acceptedStaticsStore.has(r.staticId ?? r.id) &&
            (priorityFilters.size === 0 || priorityFilters.has(r.priority as Priority)) &&
            (channelFilters.size === 0 || channelFilters.has(r.channel as ChannelFilterValue)),
  );

  // Convert session-resolved assignments into RowData so they can be merged into
  // the grouped queue alongside active cases for the same customer.
  const resolvedNormalised: RowData[] = filteredResolvedAssignments.map((r) => {
    const sa = staticAssignments.find((s) => s.id === r.id) ??
               staticAssignments.find((s) => s.customerRecordId === r.customerRecordId);
    // If the static ID was queued for resolution (via pendingResolvedIds), override the
    // status to "resolved" regardless of what was stored in resolvedAssignments. This
    // prevents a stale closure bug where the auto-dismiss captures an old assignmentStatusesById
    // and records "escalated" as the dismissedStatus even though the agent resolved it.
    const staticId = r.staticId ?? sa?.id;
    const isMarkedResolved =
      (staticId && (bulkResolvedIds.has(staticId) || (pendingResolvedSnapshot?.has(staticId) ?? false))) ||
      r.status === "resolved";
    const effectiveStatus: QueueAssignmentStatus = isMarkedResolved ? "resolved" : r.status as QueueAssignmentStatus;
    return {
      id: r.id,
      name: r.name,
      customerId: sa?.customerId ?? r.customerRecordId ?? r.id,
      customerRecordId: r.customerRecordId,
      company: sa?.company ?? r.name,
      botType: sa?.botType ?? "Service Bot",
      caseType: sa?.caseType ?? "General Inquiry",
      agentType: (sa?.agentType ?? "virtual") as "virtual" | "human",
      channel: r.channel as Channel,
      priority: r.priority as Priority,
      status: effectiveStatus,
      preview: r.preview,
      waitTime: sa?.waitTime ?? "",
      aiOverview: sa?.aiOverview ?? { actions: [], whyNeeded: "", nextSteps: [] },
      customerContext: sa?.customerContext ?? "",
      assignedTo: r.assignedTo,
      isLive: false,
      isAccepted: true,
      isClosed: true,
      isParkedFromToast: false,
      liveAssignmentId: null,
      onAccept: () => {
        // Re-open a dismissed case: remove staticId from rejectedIds, then re-accept.
        if (!sa) return;
        const keyToRemove = r.staticId ?? sa.id;
        setRejectedIds((prev) => { const next = new Set(prev); next.delete(keyToRemove); return next; });
        handleAcceptStatic(sa, r.status);
        // Restore any additional channels that were open when the case was dismissed.
        r.additionalChannels?.forEach(({ channel }) => {
          openCustomerConversation(r.customerRecordId, channel);
        });
      },
      onReject: () => {},
      onReopen: () => {
        if (!sa) return;
        const keyToRemove = r.staticId ?? sa.id;
        setRejectedIds((prev) => { const next = new Set(prev); next.delete(keyToRemove); return next; });
        handleAcceptStatic(sa, r.status);
        // Restore any additional channels that were open when the case was dismissed.
        r.additionalChannels?.forEach(({ channel }) => {
          openCustomerConversation(r.customerRecordId, channel);
        });
      },
      onMonitor: () => {
        if (r.customerRecordId) dismissIncomingByCustomer(r.customerRecordId);
        if (sa) setEscalatedModalCase({ ...sa, status: r.status, customerRecordId: r.customerRecordId ?? sa.customerRecordId } as EscalatedCaseModalData);
      },
      onSupervise: () => {
        if (!sa) return;
        const keyToRemove = r.staticId ?? sa.id;
        setRejectedIds((prev) => { const next = new Set(prev); next.delete(keyToRemove); return next; });
        handleAcceptStatic(sa, r.status);
        // Restore any additional channels that were open when the case was dismissed.
        r.additionalChannels?.forEach(({ channel }) => {
          openCustomerConversation(r.customerRecordId, channel);
        });
      },
      onTakeoverAccept: (handoffConversation) => {
        if (!sa) return;
        handleAcceptStatic(sa, r.status, handoffConversation);
      },
    };
  });

  // Status rank for within-group and group-level sorting: escalated first, resolved last
  const statusRank: Record<string, number> = { escalated: 0, open: 1, pending: 2, resolved: 3 };

  const allRows = [...baseRows, ...resolvedNormalised]
    .filter((a) => {
      if (issueTab.size === 0) return true;
      return (
        (issueTab.has("new")       && a.status === "open"     && !a.isAccepted && !a.isLive) ||
        (issueTab.has("open")      && a.status === "open") ||
        (issueTab.has("pending")   && a.status === "pending") ||
        (issueTab.has("escalated") && a.status === "escalated") ||
        (issueTab.has("closed")    && a.status === "resolved")
      );
    })
    .sort((a, b) => (priorityRank[a.priority] ?? 99) - (priorityRank[b.priority] ?? 99));

  // If the currently-selected case is no longer visible after a filter change,
  // fall back to the first row in the filtered list.
  const allRowIds = allRows.map((r) => r.id).join(",");
  useEffect(() => {
    if (!selectedCaseId) return;
    const stillVisible = allRows.some((r) => r.id === selectedCaseId);
    if (!stillVisible) {
      setSelectedCaseId(allRows[0]?.id ?? null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allRowIds]);

  // Number of items parked from a toast — used for the red Queue tab badge
  const parkedCount = liveNormalised.filter((a) => a.isParkedFromToast).length;

  // Per-tab counts for badges
  const tabCounts: Record<StatusFilter, number> = {
    new:       baseRows.filter((a) => a.status === "open" && !a.isAccepted && !a.isLive).length,
    open:      baseRows.filter((a) => a.status === "open").length + filteredResolvedAssignments.filter((r) => r.status === "open").length,
    pending:   baseRows.filter((a) => a.status === "pending").length + filteredResolvedAssignments.filter((r) => r.status === "pending").length,
    escalated: baseRows.filter((a) => a.status === "escalated").length + resolvedNormalised.filter((r) => r.status === "escalated").length,
    closed:    baseRows.filter((a) => a.status === "resolved").length + filteredResolvedAssignments.filter((r) => r.status === "resolved").length,
  };
  const totalTasks = tabCounts.open + tabCounts.pending + tabCounts.closed + tabCounts.escalated;

  return (
    <div className="flex h-full flex-col">

      {/* ── Top-level Review / Queue tabs ────────────────────────────────────── */}
      {mode !== "inbox" && (
        <div className="shrink-0 flex items-center gap-0 border-b border-border bg-white dark:bg-[#0F1629] px-5">
          {([["Home", "monitor"], ["Assigned", "assigned"]] as const).map(([label, key]) => {
            const isActive = controlCenterTab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setControlCenterTab(key)}
                className={cn(
                  "relative py-3 px-1 mr-6 text-[13px] font-medium transition-colors",
                  isActive
                    ? "text-[#166CCA]"
                    : "text-[#667085] hover:text-[#344054]",
                )}
              >
                {label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-[#166CCA]" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Queue tab ─────────────────────────────────────────────────────────── */}

      {/* ── Summary cards row ────────────────────────────────────────────────── */}
      {mode !== "inbox" && controlCenterTab === "monitor" && (() => {
        const criticalCount = baseRows.filter((a) => a.priority === "Critical").length;
        const highCount     = baseRows.filter((a) => a.priority === "High").length;
        const resolvedCount = tabCounts.closed;
        const pendingCount  = tabCounts.pending;
        const openCount     = tabCounts.open;

        const resolvedNote = resolvedCount > 5
          ? `You've already resolved ${resolvedCount} cases — great momentum.`
          : resolvedCount > 0
          ? `You've resolved ${resolvedCount} case${resolvedCount !== 1 ? "s" : ""} so far today.`
          : "No cases resolved yet today.";

        const trendText = criticalCount > 0
          ? `You have ${criticalCount} critical case${criticalCount > 1 ? "s" : ""} that need immediate attention. ${resolvedNote} With ${openCount} open and ${pendingCount} pending, prioritise clearing blockers before your 09:00 callback. Keep an eye on handle time and aim to wrap responses within SLA windows.`
          : highCount > 0
          ? `You have ${highCount} high-priority case${highCount > 1 ? "s" : ""} requiring attention. ${resolvedNote} With ${openCount} open and ${pendingCount} pending, stay focused on timely responses and SLA compliance.`
          : `Your queue is looking manageable today. ${resolvedNote} With ${openCount} open and ${pendingCount} pending, keep up the momentum and aim to close pending cases before end of shift.`;

        const newChats = baseRows.filter((a) => a.channel === "chat" && a.status === "open").length;

        const escalationCount = [...baseRows, ...resolvedNormalised].filter((a) => a.status === "escalated").length;

        // Track peak escalation count so we know how many were handled when they drop to 0
        if (escalationCount > peakEscalationCountRef.current) {
          peakEscalationCountRef.current = escalationCount;
        }
        const escalationsHandled = peakEscalationCountRef.current;
        const hadEscalations = escalationsHandled > 0 && escalationCount === 0;

        return (
          <div className="relative flex flex-1 min-h-0 flex-col items-center gap-8 overflow-y-auto px-8 py-10">

            {/* Greeting */}
            <div className="w-full max-w-4xl">
              <h2 className="text-xl font-semibold text-[#101828] dark:text-[#E2E8F0]">Good morning, Jeff</h2>
              <p className="mt-0.5 text-[13px] text-[#667085] dark:text-[#8898AB]">Last login: Today at 8:42 AM</p>
              <p className="mt-3 text-[13px] leading-relaxed text-[#475467] dark:text-[#94A3B8]">{trendText}</p>
            </div>

            {/* New Lead alert — shown when a lead has been triggered (persists after toast dismiss) */}
            {(() => {
              const leadNotifications = activeLeadNotifications;
              if (leadNotifications.length === 0) return null;
              return (
                <div className="w-full max-w-4xl flex flex-col gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#B54708]">
                    New {leadNotifications.length === 1 ? "Lead" : "Leads"} Incoming
                  </p>
                  {leadNotifications.map((lead) => (
                    <div
                      key={lead.id}
                      className="relative rounded-xl border border-[#FEC84B] bg-[#FFFCF5] shadow-sm overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-300"
                    >
                      {/* left accent bar */}
                      <div className="absolute left-0 inset-y-0 w-[3px] bg-[#F79009] rounded-r-full" />
                      <div className="flex items-center gap-3 px-5 py-3.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FEF0C7]">
                          <Phone className="h-4 w-4 text-[#DC6803]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[13px] font-semibold text-[#1D2939]">{lead.name}</span>
                            <span className="rounded border border-[#F79009] bg-[#FEF0C7] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-[#B54708]">
                              Sales Lead
                            </span>
                            <span className="rounded border border-[#F79009]/40 bg-[#FEF0C7]/60 px-1.5 py-0.5 text-[10px] font-medium leading-none text-[#B54708]">
                              {lead.priority}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[12px] text-[#475467] leading-[1.4] truncate">{lead.preview}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {launchingCallLeadId !== lead.id && (
                            <button
                              type="button"
                              onClick={() => {
                                // Dismiss the Home tab alert
                                if (lead.customerRecordId) dismissLeadNotification(lead.customerRecordId);
                                // Push a "transferred" toast so the customer info panel auto-opens
                                pushTransferredToast({
                                  name: lead.name,
                                  customerRecordId: lead.customerRecordId,
                                  customerId: lead.customerId,
                                  channel: lead.channel as AssignmentChannel,
                                  label: lead.label,
                                  priority: lead.priority,
                                  preview: lead.preview,
                                });
                                // Accept the case in history-only mode (no channel tabs, Customer History active)
                                acceptIssue({
                                  id: lead.id,
                                  name: lead.name,
                                  customerId: lead.customerId,
                                  customerRecordId: lead.customerRecordId,
                                  channel: lead.channel as AssignmentChannel,
                                  priority: lead.priority,
                                  preview: lead.preview,
                                  status: "pending" as QueueAssignmentStatus,
                                  waitTime: lead.time ?? "0m",
                                  openAsHistoryOnly: true,
                                  onCreated: (assignmentId) => {
                                    // Link the static assignment so the queue updates correctly
                                    const sa = staticAssignments.find((s) => s.customerRecordId === lead.customerRecordId);
                                    if (sa) acceptedStaticsStore.set(sa.id, assignmentId);
                                  },
                                });
                              }}
                              className="rounded-md border border-border bg-white px-3 py-1 text-[11px] font-semibold text-[#344054] hover:bg-[#F9FAFB] transition-colors"
                            >
                              Review Lead
                            </button>
                          )}
                          {launchingCallLeadId === lead.id ? (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-md bg-[#EBF4FD] border border-[#BFDBFE] text-[#166CCA]">
                              <div className="h-3 w-3 rounded-full border-[1.5px] border-[#166CCA]/30 border-t-[#166CCA] animate-spin" />
                              Connecting call…
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                // Show connecting state on this alert card
                                setLaunchingCallLeadId(lead.id);
                                // Dismiss the toast if it's still showing
                                if (lead.customerRecordId) dismissIncomingByCustomer(lead.customerRecordId);
                                // Launch the call directly into in-call state (shared logic handles the 2s delay,
                                // opens voice conversation, copilot, customer info, and dismisses the lead alert)
                                launchLeadCall(lead);
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-md bg-[#166CCA] text-white hover:bg-[#1260B0] transition-colors"
                            >
                              <Phone className="h-3 w-3" />
                              Launch Call
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            <div className="w-full max-w-4xl grid grid-cols-2 gap-4">

            {/* Overview card */}
            <div className="rounded-xl border border-border bg-white dark:bg-[#0F1629] dark:border-[#1E293B] shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#98A2B3] dark:text-[#64748B]">Overview</p>
                <button
                  type="button"
                  onClick={() => navigate("/queue")}
                  className="text-[11px] font-medium text-[#166CCA] hover:underline"
                >
                  View Queue
                </button>
              </div>
              <div className="space-y-1">
                {/* Row shared layout: icon | label | fixed-width badge+chevron column */}
                <button
                  type="button"
                  onClick={() => {
                    setIssueTab(new Set(["escalated" as StatusFilter]));
                    navigate("/queue");
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg py-1.5 text-left transition-colors",
                    tabCounts.escalated > 0 ? "animate-escalated-flash hover:bg-[#FEF2F2]" : "hover:bg-[#F9FAFB]",
                  )}
                >
                  <div className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors",
                    tabCounts.escalated > 0 ? "bg-[#FEE2E2]" : "bg-[#F2F4F7] dark:bg-[#1C2A3A]",
                  )}>
                    <AlertTriangle className={cn(
                      "h-3.5 w-3.5",
                      tabCounts.escalated > 0 ? "text-[#E53935] animate-pulse" : "text-[#98A2B3]",
                    )} />
                  </div>
                  <span className={cn(
                    "flex-1 min-w-0 text-[13px]",
                    tabCounts.escalated > 0 ? "text-[#C71D1A] font-medium" : "text-[#344054] dark:text-[#CBD5E1]",
                  )}>Escalated Cases</span>
                  <div className="flex w-[52px] shrink-0 items-center justify-end gap-1.5">
                    <span className={cn(
                      "inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold text-white min-w-[24px]",
                      tabCounts.escalated > 0 ? "bg-[#E53935]" : "bg-[#D0D5DD] text-[#667085]",
                    )}>
                      {tabCounts.escalated}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[#98A2B3] -rotate-90" />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIssueTab(new Set(["pending" as StatusFilter]));
                    navigate("/queue");
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg py-1.5 text-left transition-colors hover:bg-[#FFFAEB]"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#FFFAEB] dark:bg-[#2A1F00]">
                    <Clock className="h-3.5 w-3.5 text-[#F59E0B]" />
                  </div>
                  <span className="flex-1 min-w-0 text-[13px] text-[#344054] dark:text-[#CBD5E1]">Pending Cases</span>
                  <div className="flex w-[52px] shrink-0 items-center justify-end gap-1.5">
                    <span className="inline-flex items-center justify-center rounded-full bg-[#F59E0B] px-2 py-0.5 text-[11px] font-semibold text-white min-w-[24px]">
                      {pendingCount}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[#98A2B3] -rotate-90" />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIssueTab(new Set(["open" as StatusFilter]));
                    navigate("/queue");
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg py-1.5 text-left transition-colors hover:bg-[#EFFBF1]"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#EFFBF1] dark:bg-[#0D2818]">
                    <MessageCircle className="h-3.5 w-3.5 text-[#16A34A]" />
                  </div>
                  <span className="flex-1 min-w-0 text-[13px] text-[#344054] dark:text-[#CBD5E1]">Open Cases</span>
                  <div className="flex w-[52px] shrink-0 items-center justify-end gap-1.5">
                    <span className="inline-flex items-center justify-center rounded-full bg-[#16A34A] px-2 py-0.5 text-[11px] font-semibold text-white min-w-[24px]">
                      {openCount}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[#98A2B3] -rotate-90" />
                  </div>
                </button>
              </div>
            </div>

            {/* Trend Detection card */}
            {(() => {
              const trendSlides = [
                "Login failure rates are up 18% compared to yesterday. Most failures are occurring between 08:00–10:00. Consider pre-emptively routing authentication cases to your fastest agents during this window.",
                "Average handle time for billing cases has dropped by 22 seconds this week. Your team is resolving payment disputes faster — keep reinforcing the current approach.",
                "3 cases have been waiting over 45 minutes without agent contact. Prioritise these immediately to avoid SLA breaches and escalation risk.",
                "Customer satisfaction scores for chat interactions are trending 8% higher than voice this month. Consider channel-routing lower-complexity cases to chat where possible.",
                "Peak case volume typically hits between 11:00–13:00. Ensure full agent coverage during this window to prevent queue build-up.",
              ];
              return (
                <div className="rounded-xl border border-border bg-white dark:bg-[#0F1629] dark:border-[#1E293B] shadow-sm p-4 flex flex-col">
                  <div className="mb-2.5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#98A2B3] dark:text-[#64748B]">Trend Detection</p>
                  </div>
                  <p
                    key={homeTrendSlide}
                    className="text-[12px] leading-[1.65] text-[#344054] dark:text-[#CBD5E1] flex-1 min-h-[72px] animate-in fade-in slide-in-from-bottom-2 duration-300"
                  >
                    {trendSlides[homeTrendSlide]}
                  </p>
                  <div className="flex items-center gap-1.5 mt-3">
                    {trendSlides.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setHomeTrendSlide(i)}
                        className={cn(
                          "rounded-full transition-all duration-200",
                          i === homeTrendSlide ? "h-1.5 w-5 bg-[#166CCA]" : "h-1.5 w-1.5 bg-[#D0D5DD] dark:bg-[#2A3448] hover:bg-[#BFDBFE]",
                        )}
                      />
                    ))}
                  </div>
                </div>
              );
            })()}

          </div>

            {/* Horizontal stat cards */}
            <div className="w-full max-w-4xl grid grid-cols-4 gap-4">
              {/* Schedule */}
              <div className="rounded-xl border border-border bg-white dark:bg-[#0F1629] dark:border-[#1E293B] shadow-sm p-4 flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#EFF4FF]">
                    <CalendarDays className="h-3.5 w-3.5 text-[#3B82F6]" />
                  </div>
                  <p className="text-[13px] font-semibold text-[#101828] dark:text-[#E2E8F0]">Schedule</p>
                </div>
                <div className="space-y-1.5 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-[#667085] dark:text-[#8898AB]">Total Events</span>
                    <span className="text-[13px] font-semibold text-[#101828] dark:text-[#E2E8F0]">6</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-[#667085] dark:text-[#8898AB]">Callbacks</span>
                    <span className="text-[13px] font-semibold text-[#F59E0B]">3</span>
                  </div>
                </div>
                <div className="mt-auto border-t border-border pt-2.5">
                  <p className="text-[11px] text-[#667085] dark:text-[#8898AB]">Next up:</p>
                  <p className="text-[12px] font-semibold text-[#101828] dark:text-[#E2E8F0] mt-0.5">Customer Callback</p>
                  <p className="text-[11px] text-[#98A2B3]">09:00 AM</p>
                </div>
              </div>

              {/* Performance */}
              <div className="rounded-xl border border-border bg-white dark:bg-[#0F1629] dark:border-[#1E293B] shadow-sm p-4 flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#EFFBF1]">
                    <TrendingUp className="h-3.5 w-3.5 text-[#16A34A]" />
                  </div>
                  <p className="text-[13px] font-semibold text-[#101828] dark:text-[#E2E8F0]">Performance</p>
                </div>
                <div className="space-y-1.5 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-[#667085] dark:text-[#8898AB]">Cases Resolved</span>
                    <span className="text-[13px] font-semibold text-[#101828] dark:text-[#E2E8F0]">12</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-[#667085] dark:text-[#8898AB]">CSAT Score</span>
                    <span className="text-[13px] font-semibold text-[#16A34A]">4.8</span>
                  </div>
                </div>
                <div className="mt-auto border-t border-border pt-2.5">
                  <p className="text-[11px] text-[#667085] dark:text-[#8898AB]">Handle Time:</p>
                  <p className="text-[12px] font-semibold text-[#101828] dark:text-[#E2E8F0] mt-0.5">8m 32s</p>
                  <p className="text-[11px] text-[#12B76A]">15% improvement</p>
                </div>
              </div>

              {/* Messages */}
              <div className="rounded-xl border border-border bg-white dark:bg-[#0F1629] dark:border-[#1E293B] shadow-sm p-4 flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#F3EEFF]">
                    <MessageSquare className="h-3.5 w-3.5 text-[#8B5CF6]" />
                  </div>
                  <p className="text-[13px] font-semibold text-[#101828] dark:text-[#E2E8F0]">Messages</p>
                </div>
                <div className="space-y-1.5 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-[#667085] dark:text-[#8898AB]">Unread</span>
                    <span className="text-[13px] font-semibold text-[#101828] dark:text-[#E2E8F0]">3</span>
                  </div>
                </div>
                <div className="mt-auto border-t border-border pt-2.5">
                  <p className="text-[11px] text-[#667085] dark:text-[#8898AB]">Latest from:</p>
                  <p className="text-[12px] font-semibold text-[#101828] dark:text-[#E2E8F0] mt-0.5">Sarah Johnson</p>
                  <p className="text-[11px] text-[#98A2B3] truncate">Great job on the customer escalation yes...</p>
                </div>
              </div>

              {/* My Zone — WEM */}
              {(() => {
                const [myZoneExpanded, setMyZoneExpanded] = useState(false);
                const wemData = {
                  shift: { label: "Today 2:00 – 10:00 PM", nextBid: "Jun 9", bidsOpen: 2, status: "Confirmed" },
                  training: { due: 2, modules: [
                    { name: "Advanced CX Techniques", pct: 60, dueIn: "3 days" },
                    { name: "Security & Compliance",  pct: 0,  dueIn: "1 week" },
                    { name: "Product Knowledge v4",   pct: 100, dueIn: "Done" },
                  ]},
                  evaluations: { lastScore: 87, maxScore: 100, trend: "+4", evaluator: "Sandra H.", nextDate: "Jun 12", feedback: "Strong empathy and resolution rate. Work on first-contact resolution speed." },
                };
                return (
                  <>
                    <div className="rounded-xl border border-border bg-white dark:bg-[#0F1629] dark:border-[#1E293B] shadow-sm p-4 flex flex-col">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#EBF4FD]">
                            <Star className="h-3.5 w-3.5 text-[#166CCA]" />
                          </div>
                          <p className="text-[13px] font-semibold text-[#101828] dark:text-[#E2E8F0]">My Zone</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setMyZoneExpanded(true)}
                          className="flex h-6 w-6 items-center justify-center rounded-md text-[#98A2B3] transition-colors hover:bg-[#F2F4F7] hover:text-[#344054]"
                          title="Expand"
                        >
                          <Maximize2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Shift */}
                      <div className="flex items-start gap-2 rounded-lg bg-[#F8F8F9] dark:bg-[#0B1120] px-3 py-2 mb-2">
                        <CalendarCheck className="h-3.5 w-3.5 text-[#166CCA] mt-0.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-semibold text-[#344054] dark:text-[#8898AB] uppercase tracking-wide">Shift</p>
                          <p className="text-[12px] font-medium text-[#101828] dark:text-[#E2E8F0] truncate">{wemData.shift.label}</p>
                          <p className="text-[10px] text-[#208337]">{wemData.shift.status}</p>
                        </div>
                      </div>

                      {/* Training & Evaluations row */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-lg border border-border px-2.5 py-2">
                          <div className="flex items-center gap-1 mb-1">
                            <BookOpen className="h-3 w-3 text-[#7C3AED]" />
                            <span className="text-[10px] font-semibold text-[#667085] dark:text-[#8898AB] uppercase tracking-wide">Training</span>
                          </div>
                          <p className="text-[18px] font-bold text-[#101828] dark:text-[#E2E8F0] leading-none">{wemData.training.due}</p>
                          <p className="text-[10px] text-[#667085]">modules due</p>
                        </div>
                        <div className="rounded-lg border border-border px-2.5 py-2">
                          <div className="flex items-center gap-1 mb-1">
                            <ClipboardCheck className="h-3 w-3 text-[#059669]" />
                            <span className="text-[10px] font-semibold text-[#667085] dark:text-[#8898AB] uppercase tracking-wide">Eval</span>
                          </div>
                          <p className="text-[18px] font-bold text-[#101828] dark:text-[#E2E8F0] leading-none">{wemData.evaluations.lastScore}<span className="text-[11px] font-normal text-[#98A2B3]">/{wemData.evaluations.maxScore}</span></p>
                          <p className="text-[10px] text-[#208337]">↑ {wemData.evaluations.trend} pts</p>
                        </div>
                      </div>
                    </div>

                    {/* Expanded overlay */}
                    {myZoneExpanded && createPortal(
                      <div className="fixed inset-0 z-[9998] flex items-stretch justify-end">
                        <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={() => setMyZoneExpanded(false)} />
                        <div className="relative z-[1] flex w-full max-w-[680px] flex-col bg-[#F8F8F9] shadow-[0_0_40px_rgba(0,0,0,0.18)] animate-in slide-in-from-right duration-300 overflow-y-auto">

                          {/* Header */}
                          <div className="flex shrink-0 items-center justify-between border-b border-black/10 bg-white px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EBF4FD]">
                                <Star className="h-4 w-4 text-[#166CCA]" />
                              </div>
                              <div>
                                <h2 className="text-[15px] font-semibold text-[#101828]">My Zone</h2>
                                <p className="text-[11px] text-[#667085]">Workforce Engagement</p>
                              </div>
                            </div>
                            <button type="button" onClick={() => setMyZoneExpanded(false)}
                              className="flex items-center gap-1.5 rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-[12px] font-medium text-[#344054] transition-colors hover:bg-[#F9FAFB]">
                              <Minimize2 className="h-3.5 w-3.5" />Minimize
                            </button>
                          </div>

                          <div className="flex-1 space-y-4 p-5">

                            {/* Shift Bidding */}
                            <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
                              <div className="flex items-center gap-2 mb-4">
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EBF4FD]">
                                  <CalendarCheck className="h-4 w-4 text-[#166CCA]" />
                                </div>
                                <h3 className="text-[14px] font-semibold text-[#101828]">Shift Bidding</h3>
                              </div>
                              <div className="rounded-lg bg-[#F8F8F9] border border-border px-4 py-3 mb-3">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#98A2B3] mb-1">Current Shift</p>
                                <p className="text-[14px] font-semibold text-[#101828]">{wemData.shift.label}</p>
                                <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-[#EFFBF1] border border-[#B9E0B4] px-2 py-0.5 text-[11px] font-semibold text-[#208337]">
                                  <Check className="h-2.5 w-2.5" />{wemData.shift.status}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-lg border border-border px-4 py-3">
                                  <p className="text-[11px] text-[#667085] mb-0.5">Next Bid Round</p>
                                  <p className="text-[13px] font-semibold text-[#101828]">{wemData.shift.nextBid}</p>
                                </div>
                                <div className="rounded-lg border border-border px-4 py-3">
                                  <p className="text-[11px] text-[#667085] mb-0.5">Shifts Available</p>
                                  <p className="text-[13px] font-semibold text-[#101828]">{wemData.shift.bidsOpen} open</p>
                                </div>
                              </div>
                            </div>

                            {/* Training */}
                            <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
                              <div className="flex items-center gap-2 mb-4">
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F5F3FF]">
                                  <BookOpen className="h-4 w-4 text-[#7C3AED]" />
                                </div>
                                <h3 className="text-[14px] font-semibold text-[#101828]">Training</h3>
                                <span className="ml-auto rounded-full bg-[#FDEAEA] px-2 py-0.5 text-[11px] font-semibold text-[#E32926]">{wemData.training.due} due</span>
                              </div>
                              <div className="space-y-3">
                                {wemData.training.modules.map((m) => (
                                  <div key={m.name}>
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-[12px] font-medium text-[#344054] truncate pr-3">{m.name}</span>
                                      <span className={cn("text-[11px] font-semibold shrink-0", m.pct === 100 ? "text-[#208337]" : "text-[#667085]")}>
                                        {m.pct === 100 ? "Done" : m.dueIn}
                                      </span>
                                    </div>
                                    <div className="h-1.5 w-full rounded-full bg-[#F2F4F7]">
                                      <div
                                        className={cn("h-full rounded-full transition-all", m.pct === 100 ? "bg-[#208337]" : m.pct > 0 ? "bg-[#7C3AED]" : "bg-[#D0D5DD]")}
                                        style={{ width: `${m.pct}%` }}
                                      />
                                    </div>
                                    <p className="text-[10px] text-[#98A2B3] mt-0.5">{m.pct}% complete</p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Evaluations */}
                            <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
                              <div className="flex items-center gap-2 mb-4">
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EFFBF1]">
                                  <ClipboardCheck className="h-4 w-4 text-[#059669]" />
                                </div>
                                <h3 className="text-[14px] font-semibold text-[#101828]">Evaluations</h3>
                              </div>
                              <div className="grid grid-cols-3 gap-3 mb-4">
                                <div className="rounded-lg bg-[#F8F8F9] border border-border px-3 py-2.5 text-center">
                                  <p className="text-[22px] font-bold text-[#101828] leading-none">{wemData.evaluations.lastScore}</p>
                                  <p className="text-[10px] text-[#667085] mt-0.5">Last Score</p>
                                </div>
                                <div className="rounded-lg bg-[#F8F8F9] border border-border px-3 py-2.5 text-center">
                                  <p className="text-[22px] font-bold text-[#208337] leading-none">{wemData.evaluations.trend}</p>
                                  <p className="text-[10px] text-[#667085] mt-0.5">Trend</p>
                                </div>
                                <div className="rounded-lg bg-[#F8F8F9] border border-border px-3 py-2.5 text-center">
                                  <p className="text-[13px] font-bold text-[#101828] leading-tight mt-0.5">{wemData.evaluations.nextDate}</p>
                                  <p className="text-[10px] text-[#667085] mt-0.5">Next Eval</p>
                                </div>
                              </div>
                              <div className="rounded-lg border border-[#BFDBFE] bg-[#EBF4FD] px-4 py-3">
                                <p className="text-[11px] font-semibold text-[#1260B0] mb-1">Latest Feedback · {wemData.evaluations.evaluator}</p>
                                <p className="text-[12px] text-[#344054] leading-relaxed">"{wemData.evaluations.feedback}"</p>
                              </div>
                            </div>

                          </div>
                        </div>
                      </div>,
                      document.body,
                    )}
                  </>
                );
              })()}
            </div>

            {/* AI input bar — sticky to bottom of scroll area */}
            <div className="sticky bottom-0 w-full max-w-4xl pt-3 pb-1">
              <div className="rounded-xl border border-[#E4E7EC] bg-white/80 dark:bg-[#0F1629]/80 dark:border-[#1E293B] shadow-[0_-2px_16px_rgba(0,0,0,0.06)] transition-colors duration-150 hover:bg-white hover:border-[#D0D5DD] dark:hover:bg-[#0F1629] dark:hover:border-[#334155]">
                <div className="flex items-center gap-3 px-4 py-3">
                  <Sparkles className="h-4 w-4 shrink-0 text-[#166CCA]" />
                  <input
                    type="text"
                    placeholder="What would you like to do today?"
                    className="flex-1 bg-transparent text-[13px] text-[#344054] dark:text-[#CBD5E1] placeholder:text-[#98A2B3] outline-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.currentTarget.value.trim()) {
                        openCopilot();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => openCopilot()}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#166CCA] text-white transition-colors hover:bg-[#1260B0]"
                    aria-label="Ask AI"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

          </div>
        );
      })()}

      {/* ── Assigned tab ─────────────────────────────────────────────────────── */}
      {mode !== "inbox" && controlCenterTab === "assigned" && (() => {
        // Include all cases assigned to the current agent:
        // 1. Static cases taken over via the review modal (active in rail)
        // 2. Live cases currently active in the rail
        // 3. Resolved/dismissed cases still attributed to this agent (shown in queue via resolvedNormalised)
        //    but NOT transferred to someone else.
        const staticAssigned = staticNormalised.filter(
          (r) => r.isAccepted && !r.isClosed && !bulkResolvedIds.has(r.id) && !rejectedIds.has(r.id),
        );
        const liveAssigned = liveNormalised.filter(
          (r) => r.isAccepted && !r.isParkedFromToast,
        );
        const resolvedAssigned = resolvedNormalised.filter(
          (r) => r.assignedTo === CURRENT_AGENT_NAME,
        );
        const seenIds = new Set(staticAssigned.map((r) => r.id));
        liveAssigned.forEach((r) => seenIds.add(r.id));
        const assignedRows = [
          ...staticAssigned,
          ...liveAssigned.filter((r) => !seenIds.has(r.id)),
          ...resolvedAssigned.filter((r) => !seenIds.has(r.id)),
        ];
        return (
          <div className="min-h-0 flex-1 overflow-hidden flex flex-col">
            <div className="flex flex-row flex-1 min-w-0 h-full overflow-hidden">
              <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

                {/* Header: view toggles + filter */}
                <div className="shrink-0 px-5 pt-4 pb-0">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => setViewMode("list")} className={cn("flex h-7 w-7 items-center justify-center rounded-md border transition-colors", viewMode === "list" ? "border-[#166CCA]/40 bg-[#EBF4FD] text-[#166CCA]" : "border-border bg-white text-[#667085] hover:bg-[#F9FAFB]")}><LayoutList className="h-3.5 w-3.5" /></button>
                      <button type="button" onClick={() => setViewMode("card")} className={cn("flex h-7 w-7 items-center justify-center rounded-md border transition-colors", viewMode === "card" ? "border-[#166CCA]/40 bg-[#EBF4FD] text-[#166CCA]" : "border-border bg-white text-[#667085] hover:bg-[#F9FAFB]")}><LayoutGrid className="h-3.5 w-3.5" /></button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] text-[#98A2B3]">{assignedRows.length} assigned case{assignedRows.length !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                  {/* Active filter chips */}
                  {(channelFilters.size > 0 || priorityFilters.size > 0 || agentTypeFilter !== "all" || issueTab.size > 0) && (
                    <div className="flex flex-wrap gap-1.5 pb-3">
                      {[...channelFilters].map((ch) => (
                        <span key={ch} className="inline-flex items-center gap-1 rounded-full border border-[#BFDBFE] bg-[#EBF4FD] pl-2.5 pr-1.5 py-0.5 text-[11px] font-medium text-[#166CCA]">
                          {channelFilterOptions.find(o => o.value === ch)?.label}
                          <button type="button" onClick={() => { const n = new Set(channelFilters); n.delete(ch); setChannelFilters(n); }} className="flex h-3.5 w-3.5 items-center justify-center rounded-full hover:bg-[#BFDBFE] transition-colors"><X className="h-2.5 w-2.5" /></button>
                        </span>
                      ))}
                      {[...priorityFilters].map((p) => (
                        <span key={p} className="inline-flex items-center gap-1 rounded-full border border-[#BFDBFE] bg-[#EBF4FD] pl-2.5 pr-1.5 py-0.5 text-[11px] font-medium text-[#166CCA]">
                          {p}
                          <button type="button" onClick={() => { const n = new Set(priorityFilters); n.delete(p); setPriorityFilters(n); }} className="flex h-3.5 w-3.5 items-center justify-center rounded-full hover:bg-[#BFDBFE] transition-colors"><X className="h-2.5 w-2.5" /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div key={viewMode} className={cn("flex-1 min-h-0 animate-view-crossfade", viewMode === "card" ? "overflow-y-auto" : "overflow-y-auto")}>
                  {assignedRows.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-center p-8">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EBF4FD]">
                        <Check className="h-5 w-5 text-[#166CCA]" />
                      </div>
                      <p className="text-[14px] font-semibold text-[#333333]">No assigned cases</p>
                      <p className="text-[12px] text-[#667085] max-w-xs">Cases you take over will appear here.</p>
                    </div>
                  ) : viewMode === "card" ? (
                    <QueueCardView rows={assignedRows} />
                  ) : (
                    (() => {
                      const customerMap = new Map<string, typeof assignedRows>();
                      assignedRows.forEach((a) => {
                        const key = a.customerId ?? `anon-${a.name}`;
                        if (!customerMap.has(key)) customerMap.set(key, []);
                        customerMap.get(key)!.push(a);
                      });
                      const sortedGroups = [...customerMap.entries()].sort(([, aItems], [, bItems]) => {
                        const statusRankLocal: Record<string, number> = { escalated: 0, open: 1, pending: 2, resolved: 3 };
                        const aHighest = Math.min(...aItems.map((i) => statusRankLocal[i.status] ?? 99));
                        const bHighest = Math.min(...bItems.map((i) => statusRankLocal[i.status] ?? 99));
                        return aHighest - bHighest;
                      });
                      return sortedGroups.map(([key, items]) => {
                        const sortedItems = [...items].sort((a, b) => {
                          const statusRankLocal: Record<string, number> = { escalated: 0, open: 1, pending: 2, resolved: 3 };
                          return (statusRankLocal[a.status] ?? 99) - (statusRankLocal[b.status] ?? 99);
                        });
                        if (sortedItems.length === 1) {
                          return <IssueRow key={key} {...sortedItems[0]} isMonitored={false} isSelected={selectedCaseId === sortedItems[0].id} onSelect={setSelectedCaseId} />;
                        }
                        const customerRecord = sortedItems[0]?.customerRecordId ? getCustomerRecord(sortedItems[0].customerRecordId) : null;
                        return (
                          <CustomerGroup
                            key={key}
                            customerRecord={customerRecord}
                            caseCustomerName={sortedItems[0]?.name}
                            items={sortedItems}
                            monitoredCaseId={null}
                            onResolveAll={() => setBulkResolvedIds((prev) => new Set([...prev, ...sortedItems.map((i) => i.id)]))}
                            selectedCaseId={selectedCaseId}
                            onSelectCase={setSelectedCaseId}
                          />
                        );
                      });
                    })()
                  )}
                </div>
              </div>

              {/* Detail panel */}
              <AnimatedCaseDetailPanel
                caseData={assignedRows.find((r) => r.id === selectedCaseId) ?? null}
                onClose={() => setSelectedCaseId(null)}
              />
            </div>
          </div>
        );
      })()}

      {/* ── Queue tab ─────────────────────────────────────────────────────────── */}
      {mode === "inbox" && <div className="min-h-0 flex-1 overflow-hidden flex flex-col">

        {/* ── Contacts page header ── */}
        <div className="shrink-0 border-b border-[#E4E7EC] dark:border-[#1C2536] bg-white dark:bg-[#0F1629] px-5 py-3">
          <h1 className="text-sm font-semibold tracking-tight text-[#333333] dark:text-white">Contacts</h1>
        </div>

        <div className="flex gap-0 flex-1 min-h-0 overflow-hidden">


          {/* Tasks card */}
          <div className="flex flex-row flex-1 min-w-0 h-full overflow-hidden">

            <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
            {/* Header: view toggles + filters */}
            <div className="shrink-0 px-5 pt-4 pb-0">
              <div className="flex items-center justify-between gap-3 mb-3">

                {/* Left side: view toggles */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-md border transition-colors",
                      viewMode === "list"
                        ? "border-[#166CCA]/40 bg-[#EBF4FD] text-[#166CCA]"
                        : "border-border bg-white text-[#98A2B3] hover:bg-[#F9FAFB] hover:text-[#344054]",
                    )}
                    aria-label="List view"
                  >
                    <LayoutList className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("card")}
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-md border transition-colors",
                      viewMode === "card"
                        ? "border-[#166CCA]/40 bg-[#EBF4FD] text-[#166CCA]"
                        : "border-border bg-white text-[#98A2B3] hover:bg-[#F9FAFB] hover:text-[#344054]",
                    )}
                    aria-label="Card view"
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => { setViewMode("carousel"); setCarouselIndex(0); }}
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-md border transition-colors",
                      viewMode === "carousel"
                        ? "border-[#166CCA]/40 bg-[#EBF4FD] text-[#166CCA]"
                        : "border-border bg-white text-[#98A2B3] hover:bg-[#F9FAFB] hover:text-[#344054]",
                    )}
                    aria-label="Carousel view"
                  >
                    <GalleryVertical className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Right side: carousel pagination + filter */}
                <div className="flex items-center gap-2 ml-auto">
                  {viewMode === "carousel" && allRows.length > 0 && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => { setCarouselDir("prev"); setCarouselIndex((i) => Math.max(0, i - 1)); }}
                        disabled={carouselIndex === 0}
                        className="flex h-6 w-6 items-center justify-center rounded-md border border-border bg-white text-[#667085] hover:bg-[#F9FAFB] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        aria-label="Previous case"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </button>
                      <span className="text-[10px] font-medium text-[#98A2B3] tabular-nums min-w-[32px] text-center">
                        {carouselIndex + 1}/{allRows.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => { setCarouselDir("next"); setCarouselIndex((i) => Math.min(allRows.length - 1, i + 1)); }}
                        disabled={carouselIndex >= allRows.length - 1}
                        className="flex h-6 w-6 items-center justify-center rounded-md border border-border bg-white text-[#667085] hover:bg-[#F9FAFB] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        aria-label="Next case"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Filter icon button */}
                  <div className="relative" ref={filterPanelRef}>
                  <button
                    type="button"
                    onClick={() => setIsFilterPanelOpen((v) => !v)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[12px] font-medium transition-colors",
                      (channelFilters.size > 0 || priorityFilters.size > 0 || agentTypeFilter !== "all" || issueTab.size > 0)
                        ? "border-[#166CCA]/40 bg-[#EBF4FD] text-[#166CCA] hover:bg-[#D8EBF8]"
                        : "border-border bg-white text-[#667085] hover:bg-[#F9FAFB] hover:text-[#333333]",
                    )}
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    {(channelFilters.size + priorityFilters.size > 0 || agentTypeFilter !== "all" || issueTab.size > 0) && (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#166CCA] text-[9px] font-bold text-white">
                        {channelFilters.size + priorityFilters.size + (agentTypeFilter !== "all" ? 1 : 0) + issueTab.size}
                      </span>
                    )}
                  </button>

                  {/* Combined filter panel */}
                  {isFilterPanelOpen && (
                    <div className="absolute right-0 top-full mt-1 z-20 w-56 rounded-xl border border-border bg-white shadow-lg overflow-hidden">
                      {/* Status section */}
                      <div className="px-3 pt-3 pb-1">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#98A2B3] mb-1.5">Status</p>
                        <div className="flex flex-wrap gap-1">
                          {(["new", "open", "pending", "escalated", "closed"] as const).map((tab) => {
                            const labels: Record<typeof tab, string> = { new: "New", open: "Open", pending: "Pending", escalated: "Escalated", closed: "Closed" };
                            const isSelected = issueTab.has(tab);
                            return (
                              <button
                                key={tab}
                                type="button"
                                onClick={() => setIssueTab((prev) => { const next = new Set(prev); next.has(tab) ? next.delete(tab) : next.add(tab); return next; })}
                                className={cn(
                                  "rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors",
                                  isSelected
                                    ? "border-[#166CCA] bg-[#166CCA] text-white"
                                    : "border-[#D0D5DD] bg-white text-[#344054] hover:bg-[#F9FAFB]",
                                )}
                              >{labels[tab]}</button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="mx-3 my-2 border-t border-border" />
                      {/* Agent Type section */}
                      <div className="px-3 pt-3 pb-1">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#98A2B3] mb-1.5">Agent Type</p>
                        <div className="flex gap-1">
                          {(["all", "virtual", "human"] as const).map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setAgentTypeFilter(type)}
                              className={cn(
                                "rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors",
                                agentTypeFilter === type
                                  ? "border-[#166CCA] bg-[#166CCA] text-white"
                                  : "border-[#D0D5DD] bg-white text-[#344054] hover:bg-[#F9FAFB]",
                              )}
                            >{type === "all" ? "All" : type === "virtual" ? "Virtual" : "Human"}</button>
                          ))}
                        </div>
                      </div>
                      <div className="mx-3 my-2 border-t border-border" />
                      {/* Channel section */}
                      <div className="px-3 pt-3 pb-1">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#98A2B3] mb-1.5">Channel</p>
                        <div className="flex flex-wrap gap-1">
                          {channelFilterOptions.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => {
                                const next = new Set(channelFilters);
                                next.has(option.value) ? next.delete(option.value) : next.add(option.value);
                                setChannelFilters(next);
                              }}
                              className={cn(
                                "rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors",
                                channelFilters.has(option.value)
                                  ? "border-[#166CCA] bg-[#166CCA] text-white"
                                  : "border-[#D0D5DD] bg-white text-[#344054] hover:bg-[#F9FAFB]",
                              )}
                            >{option.label}</button>
                          ))}
                        </div>
                      </div>
                      <div className="mx-3 my-2 border-t border-border" />
                      {/* Priority section */}
                      <div className="px-3 pb-1">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#98A2B3] mb-1.5">Priority</p>
                        <div className="flex flex-wrap gap-1">
                          {priorityFilterOptions.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => {
                                const next = new Set(priorityFilters);
                                next.has(option.value) ? next.delete(option.value) : next.add(option.value);
                                setPriorityFilters(next);
                              }}
                              className={cn(
                                "rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors",
                                priorityFilters.has(option.value)
                                  ? "border-[#166CCA] bg-[#166CCA] text-white"
                                  : "border-[#D0D5DD] bg-white text-[#344054] hover:bg-[#F9FAFB]",
                              )}
                            >{option.label}</button>
                          ))}
                        </div>
                      </div>
                      <div className="mx-3 my-2 border-t border-border" />
                      {/* Group mode */}
                      <div className="px-3 pb-3">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#98A2B3] mb-1.5">Group By</p>
                        <div className="flex flex-wrap gap-1">
                          {(["customer", "case"] as const).map((mode) => (
                            <button
                              key={mode}
                              type="button"
                              onClick={() => setGroupMode(mode)}
                              className={cn(
                                "rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors",
                                groupMode === mode
                                  ? "border-[#166CCA] bg-[#166CCA] text-white"
                                  : "border-[#D0D5DD] bg-white text-[#344054] hover:bg-[#F9FAFB]",
                              )}
                            >{mode === "customer" ? "Customer" : "Case Type"}</button>
                          ))}
                        </div>
                      </div>
                      {/* Clear all */}
                      {(channelFilters.size > 0 || priorityFilters.size > 0 || agentTypeFilter !== "all" || issueTab.size > 0) && (
                        <div className="border-t border-border px-3 py-2">
                          <button
                            type="button"
                            onClick={() => { setChannelFilters(new Set()); setPriorityFilters(new Set()); setAgentTypeFilter("all"); setIssueTab(new Set()); setIsFilterPanelOpen(false); }}
                            className="text-[11px] font-medium text-[#166CCA] hover:underline"
                          >Clear all</button>
                        </div>
                      )}
                    </div>
                  )}
                  </div>
                </div>
              </div>

              {/* Active filter chips */}
              {(channelFilters.size > 0 || priorityFilters.size > 0 || agentTypeFilter !== "all" || issueTab.size > 0) && (
                <div className="flex flex-wrap gap-1.5 pb-3">
                  {[...channelFilters].map((ch) => (
                    <span key={ch} className="inline-flex items-center gap-1 rounded-full border border-[#BFDBFE] bg-[#EBF4FD] pl-2.5 pr-1.5 py-0.5 text-[11px] font-medium text-[#166CCA]">
                      {channelFilterOptions.find(o => o.value === ch)?.label}
                      <button type="button" onClick={() => { const n = new Set(channelFilters); n.delete(ch); setChannelFilters(n); }} className="flex h-3.5 w-3.5 items-center justify-center rounded-full hover:bg-[#BFDBFE] transition-colors"><X className="h-2.5 w-2.5" /></button>
                    </span>
                  ))}
                  {[...priorityFilters].map((p) => (
                    <span key={p} className="inline-flex items-center gap-1 rounded-full border border-[#BFDBFE] bg-[#EBF4FD] pl-2.5 pr-1.5 py-0.5 text-[11px] font-medium text-[#166CCA]">
                      {p}
                      <button type="button" onClick={() => { const n = new Set(priorityFilters); n.delete(p); setPriorityFilters(n); }} className="flex h-3.5 w-3.5 items-center justify-center rounded-full hover:bg-[#BFDBFE] transition-colors"><X className="h-2.5 w-2.5" /></button>
                    </span>
                  ))}
                  {[...issueTab].map((s) => (
                    <span key={s} className="inline-flex items-center gap-1 rounded-full border border-[#BFDBFE] bg-[#EBF4FD] pl-2.5 pr-1.5 py-0.5 text-[11px] font-medium text-[#166CCA]">
                      {{ new: "New", open: "Open", pending: "Pending", escalated: "Escalated", closed: "Closed" }[s]}
                      <button type="button" onClick={() => setIssueTab((prev) => { const next = new Set(prev); next.delete(s); return next; })} className="flex h-3.5 w-3.5 items-center justify-center rounded-full hover:bg-[#BFDBFE] transition-colors"><X className="h-2.5 w-2.5" /></button>
                    </span>
                  ))}
                  {agentTypeFilter !== "all" && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#BFDBFE] bg-[#EBF4FD] pl-2.5 pr-1.5 py-0.5 text-[11px] font-medium text-[#166CCA]">
                      {agentTypeFilter === "virtual" ? "Virtual Agents" : "Human Agents"}
                      <button type="button" onClick={() => setAgentTypeFilter("all")} className="flex h-3.5 w-3.5 items-center justify-center rounded-full hover:bg-[#BFDBFE] transition-colors"><X className="h-2.5 w-2.5" /></button>
                    </span>
                  )}
                </div>
              )}
            </div>

            <div key={viewMode} className={cn("flex-1 min-h-0 animate-view-crossfade", viewMode === "carousel" ? "flex flex-col overflow-hidden" : "overflow-y-auto")}>
              {viewMode === "card" && <QueueCardView rows={allRows} />}
              {viewMode === "carousel" && <QueueCarouselView rows={allRows} index={carouselIndex} onIndexChange={(i) => { setCarouselDir(i > carouselIndex ? "next" : "prev"); setCarouselIndex(i); }} />}
              {viewMode === "list" && (() => {
                const renderRows = (rows: typeof allRows) => {
                  if (groupMode === "case") {
                    // Group by case type (semantic category) with accordion + Respond to all
                    const caseTypeMap = new Map<string, typeof allRows>();
                    rows.forEach((a) => {
                      const key = a.caseType ?? "General Inquiry";
                      if (!caseTypeMap.has(key)) caseTypeMap.set(key, []);
                      caseTypeMap.get(key)!.push(a);
                    });
                    return [...caseTypeMap.entries()].map(([label, items]) => (
                      <IssueGroup
                        key={label}
                        label={label}
                        items={items}
                        monitoredCaseId={null}
                        onResolveAll={() => setBulkResolvedIds((prev) => new Set([...prev, ...items.map((i) => i.id)]))}
                        selectedCaseId={selectedCaseId}
                        onSelectCase={setSelectedCaseId}
                      />
                    ));
                  }
                  // Group by Customer — key is customerId (unique per customer)
                  const customerMap = new Map<string, typeof allRows>();
                  rows.forEach((a) => {
                    const key = a.customerId ?? `anon-${a.name}`;
                    if (!customerMap.has(key)) customerMap.set(key, []);
                    customerMap.get(key)!.push(a);
                  });
                  // Sort customer groups by the highest (most urgent) status among their cases
                  const sortedGroups = [...customerMap.entries()].sort(([, aItems], [, bItems]) => {
                    const aHighest = Math.min(...aItems.map((i) => statusRank[i.status] ?? 99));
                    const bHighest = Math.min(...bItems.map((i) => statusRank[i.status] ?? 99));
                    return aHighest - bHighest;
                  });
                  return sortedGroups.map(([key, items]) => {
                    // Sort cases within each group: escalated → open → pending → resolved
                    const sortedItems = [...items].sort(
                      (a, b) => (statusRank[a.status] ?? 99) - (statusRank[b.status] ?? 99)
                    );
                    // Only wrap in accordion when there are 2+ cases for this customer
                    if (sortedItems.length === 1) {
                      return <IssueRow key={key} {...sortedItems[0]} isMonitored={false} isSelected={selectedCaseId === sortedItems[0].id} onSelect={setSelectedCaseId} />;
                    }
                    const customerRecord = sortedItems[0]?.customerRecordId
                      ? getCustomerRecord(sortedItems[0].customerRecordId)
                      : null;
                    return (
                      <CustomerGroup
                        key={key}
                        customerRecord={customerRecord}
                        caseCustomerName={sortedItems[0]?.name}
                        caseCustomerId={sortedItems[0]?.customerId}
                        items={sortedItems}
                        monitoredCaseId={null}
                        onResolveAll={() => setBulkResolvedIds((prev) => new Set([...prev, ...sortedItems.map((i) => i.id)]))}
                        selectedCaseId={selectedCaseId}
                        onSelectCase={setSelectedCaseId}
                      />
                    );
                  });
                };

                if (allRows.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <CheckCircle className="h-8 w-8 text-[#D0D5DD] mb-3" />
                      <p className="text-sm font-medium text-[#7A7A7A] capitalize">No {issueTab.size === 0 ? "" : [...issueTab].join("/") + " "}tasks</p>
                      <p className="text-xs text-[#B0B7C3] mt-1">No tasks match the selected filter.</p>
                    </div>
                  );
                }
                return renderRows(allRows);
              })()}
            </div>

            </div>{/* end queue list flex-col */}

            {/* Case detail panel — slides in from the right (list view only) */}
            {viewMode === "list" && (
              <AnimatedCaseDetailPanel
                caseData={allRows.find((r) => r.id === selectedCaseId) ?? null}
                onClose={() => setSelectedCaseId(null)}
              />
            )}
          </div>


        </div>
      </div>

      }

      {/* ── Review tab ────────────────────────────────────────────────────────── */}

      {/* Case Review Modal */}
      {escalatedModalCase && (
        <EscalatedCaseModal
          caseData={escalatedModalCase}
          onTakeover={(_conversation, localStatus, localPriority) => {
            const a = escalatedModalCase as any;
            // Use the shared buildTakeoverConversation — same function every other
            // takeover path uses, so the agent always sees identical output.
            const sa = staticAssignments.find(
              (s: any) => s.customerRecordId === a.customerRecordId || s.customerId === a.customerId,
            );
            const botAuthor = a.botType ?? "Aria";
            const takeoverConversation = a.customerRecordId
              ? buildTakeoverConversation({
                  customerRecordId: a.customerRecordId,
                  customerName: a.name,
                  botType: botAuthor,
                  channel: (a.channel === "sms" ? "sms" : "chat") as "chat" | "sms",
                  aiWhyNeeded: a.aiOverview?.whyNeeded ?? sa?.aiOverview?.whyNeeded ?? null,
                })
              : _conversation;
            if (a.customerRecordId) pendingHandoffConversations.set(a.customerRecordId, takeoverConversation as SharedConversationData);
            const data: AcceptIssueData = {
              id: a.id,
              name: a.name,
              customerId: a.customerId,
              customerRecordId: a.customerRecordId,
              channel: a.channel,
              priority: localPriority as Priority,
              preview: a.preview,
              status: localStatus as QueueAssignmentStatus,
              waitTime: a.waitTime,
              initialConversation: takeoverConversation,
              onCreated: (assignmentId) => {
                acceptedStaticsStore.set(a.id, assignmentId);
                forceUpdate((v) => v + 1);
              },
            };
            if (a.customerRecordId) dismissIncomingByCustomer(a.customerRecordId);
            pushTransferredToast({ id: a.id, name: a.name, customerId: a.customerId, customerRecordId: a.customerRecordId ?? "", channel: a.channel, label: a.botType, priority: localPriority, preview: a.preview });
            acceptIssue(data);
            rejectIssue(escalatedModalCase.id);
            setEscalatedModalCase(null);
          }}
          onSupervise={() => {
            handleAcceptStatic(escalatedModalCase as any);
            rejectIssue(escalatedModalCase.id); // remove from queue
            setEscalatedModalCase(null);
          }}
          onTransfer={() => {
            const id = escalatedModalCase.id;
            // Remove from queue / Assigned tab
            rejectIssue(id);
            // De-escalate — remove from overrides so it no longer shows in the escalated banner
            if (escalatedOverrides.has(id)) {
              setEscalatedOverrides((prev) => {
                const next = new Set(prev);
                next.delete(id);
                persistedState.escalatedIds = next;
                return next;
              });
              decrementEscalatedCount();
            }
            setEscalatedModalCase(null);
          }}
          onResolve={() => {
            const resolvedId = escalatedModalCase.id;
            // Decrement the left-rail escalated badge
            decrementEscalatedCount();
            // If this is Jordan's case, trigger the second escalation (Sofia / Jacob)
            if ((escalatedModalCase as any).customerRecordId === "jordan") onJordanCaseResolved();
            // If this is Sofia's case, trigger the third escalation (Marcus / Emily)
            if ((escalatedModalCase as any).customerRecordId === "sofia") onSofiaCaseResolved();
            // If this is Marcus's case, trigger the fourth escalation (Terry / Aria)
            if ((escalatedModalCase as any).customerRecordId === "marcus") onMarcusCaseResolved();
            // Mark as resolved (overrides escalated status) — keeps case visible in list as resolved
            setBulkResolvedIds((prev) => {
              const next = new Set([...prev, resolvedId]);
              persistedState.resolvedIds = next;
              return next;
            });
            // Remove from escalated overrides so it no longer shows in the escalated banner
            setEscalatedOverrides((prev) => {
              const next = new Set(prev);
              next.delete(resolvedId);
              persistedState.escalatedIds = next;
              return next;
            });
            if ((escalatedModalCase as any).customerRecordId) dismissIncomingByCustomer((escalatedModalCase as any).customerRecordId);
            // Do NOT close the modal — the user can see the resolved state and close it manually.
          }}
          onClose={() => setEscalatedModalCase(null)}
          onDismissed={(summary) => showDismissalToast(summary)}
        />
      )}

      {/* Other tabs hidden but code preserved for future use
      {activePageTab === "customers" && (
        <div className="min-h-0 flex-1 flex flex-col overflow-hidden">
          <DeskDataTable defaultTab="Customers" hideTabs />
        </div>
      )}
      {activePageTab === "tickets" && (
        <div className="min-h-0 flex-1 flex flex-col overflow-hidden">
          <DeskDataTable defaultTab="Tickets" hideTabs />
        </div>
      )}
      {activePageTab === "accounts" && (
        <div className="min-h-0 flex-1 flex flex-col overflow-hidden">
          <DeskDataTable defaultTab="Accounts" hideTabs />
        </div>
      )}
      {activePageTab === "contact-history" && (
        <div className="min-h-0 flex-1 overflow-hidden flex flex-col items-center justify-center gap-3 text-center p-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F2F4F7]">
            <Phone className="h-6 w-6 text-[#98A2B3]" />
          </div>
          <p className="text-[14px] font-semibold text-[#344054]">Contact History</p>
          <p className="text-[13px] text-[#98A2B3] max-w-xs">A full log of all customer contact interactions will appear here. Coming soon.</p>
        </div>
      )}
      */}

    </div>
  );
}
