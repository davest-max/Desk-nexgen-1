import { createPortal } from "react-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  CircleStop,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ConversationPanel, { type ConversationMessage } from "@/components/ConversationPanel";
import { createConversationState, getCustomerRecord } from "@/lib/customer-database";
import { getEscalationStart } from "@/lib/escalation-timers";
import { EscalationTimer } from "@/components/EscalationTimer";
import { priorityStyles } from "@/lib/priority-styles";
import {
  Agent,
  agentRoster,
  supervisorRoster,
  availabilityOrder,
  availabilityDot,
  scoreAgent,
  getSmartPopoverPosition,
} from "@/lib/agent-roster";
import { TransferPopover } from "@/components/TransferPopover";
import { CopilotResponseCard } from "@/components/CopilotResponseCard";

// ─── Types ────────────────────────────────────────────────────────────────────

export type EscalatedCaseModalData = {
  id: string;
  name: string;
  customerId: string;
  customerRecordId?: string;
  channel: string;
  priority: string;
  botType: string;
  waitTime: string;
  preview: string;
  customerContext?: string;
  aiOverview: { actions: string[] };
  status: string;
  /** AI confidence score (0–100) for the pending handoff — shown in the inline internal note card. */
  aiConfidence?: number;
  /** Short reason text below the confidence bar. */
  aiConfidenceReason?: string;
  /** Timestamp (ms) when the escalation first appeared — keeps the modal timer in sync with the toast. */
  escalatedAt?: number;
  /** When true the modal auto-fires the approve sequence immediately on open */
  autoApprove?: boolean;
};

// ─── Copilot constants ────────────────────────────────────────────────────────

const COPILOT_REASONING_STEPS = [
  "Reviewing case history and prior customer interactions...",
  "Analyzing attempted resolutions and their outcomes...",
  "Cross-referencing similar resolved cases in the knowledge base...",
  "Synthesizing recommended next steps and action items...",
];

const QUICK_ACTION_OPTIONS = [
  "Notify data protection officer",
  "Suspend account access temporarily",
  "Escalate to security team",
  "Send breach notification to customer",
];

const POTENTIAL_NEXT_STEPS = [
  "Back up port forwarding rules to customer account before reset",
  "Initiate factory reset and confirm each step with Jordan",
  "Apply firmware update from 4.0.8 to stable release 4.1.2",
  "Restore saved port forwarding configuration post-reset",
  "Run connection diagnostics to confirm stability",
];


// ─── EscalatedCaseModal ───────────────────────────────────────────────────────

export function EscalatedCaseModal({
  caseData,
  onTakeover,
  onSupervise,
  onTransfer,
  onResolve,
  onClose,
  onDismissed,
}: {
  caseData: EscalatedCaseModalData;
  onTakeover: (conversation: import("@/components/ConversationPanel").SharedConversationData, status: string, priority: string) => void;
  onSupervise: () => void;
  onTransfer: () => void;
  onResolve: () => void;
  onClose: () => void;
  /** Called when the agent clicks Dismiss after a case is resolved — passes case summary for the dismissal toast. */
  onDismissed?: (summary: { customerName: string; customerId: string; status: string; resolvedStatus: string; actions: string[]; preview: string; botType: string; channel: string }) => void;
}) {
  const [isClosing, setIsClosing] = useState(false);
  const handleClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(onClose, 180);
  }, [isClosing, onClose]);

  const [copilotQuery, setCopilotQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [copilotPhase, setCopilotPhase] = useState<"idle" | "thinking" | "done">("idle");
  const [copilotReasoningVisible, setCopilotReasoningVisible] = useState(0);
  const [isCopilotOpen, setIsCopilotOpen] = useState(true);
  const [isAttemptedResolutionOpen, setIsAttemptedResolutionOpen] = useState(true);
  const [isCustomerProfileOpen, setIsCustomerProfileOpen] = useState(true);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [superviseScrollTrigger, setSuperviseScrollTrigger] = useState(0);
  const [approveContext, setApproveContext] = useState(false);
  const [showResolvedMessage, setShowResolvedMessage] = useState(false);
  const [declinePopoverOpen, setDeclinePopoverOpen] = useState(false);
  const [isRegeneratingNote, setIsRegeneratingNote] = useState(false);
  const [regeneratedNoteContext, setRegeneratedNoteContext] = useState<string | null>(null);
  const [regeneratedConfidence, setRegeneratedConfidence] = useState<number | null>(null);
  const [resolvedInlineStatus, setResolvedInlineStatus] = useState("Resolved");
  const [resolvedInlineStatusOpen, setResolvedInlineStatusOpen] = useState(false);
  const [jordanTyping, setJordanTyping] = useState(false);

  // Avatar URLs — component-level so all JSX (both columns) can reference them
  const jacobAvatar = "https://cdn.builder.io/api/v1/image/assets%2F9d3d716b4b844ab4bcf3267b33310813%2F9f1a8ec85d5f478b9a015a2b7eece268?format=webp&width=800&height=1200";
  const ariaAvatar = "https://cdn.builder.io/api/v1/image/assets%2F9d3d716b4b844ab4bcf3267b33310813%2F054057b71e64441097a4902d7dcea754?format=webp&width=800&height=1200";
  const emilyAvatar = `${import.meta.env.BASE_URL}emily-avatar.jpg`;
  const botAvatar = caseData.botType === "Jacob" ? jacobAvatar : caseData.botType === "Emily" ? emilyAvatar : ariaAvatar;
  const [localStatus, setLocalStatus] = useState(caseData.status);
  const [localPriority, setLocalPriority] = useState(caseData.priority);
  const approveTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  // Load scripted responses from the customer database so content is data-driven.
  // Falls back to empty strings if no escalationResponses are defined for this customer.
  const dbResponses = getCustomerRecord(caseData.customerRecordId)?.escalationResponses ?? [];
  const [aiCommentIndex, setAiCommentIndex] = useState(0);
  const [aiComment, setAiComment] = useState(dbResponses[0] ?? "");
  const [aiCommentApproved, setAiCommentApproved] = useState<"approved" | "rejected" | null>(null);
  const [aiCommentRegenerating, setAiCommentRegenerating] = useState(false);
  const [secondAiCommentIndex, setSecondAiCommentIndex] = useState(1);
  const [secondAiComment, setSecondAiComment] = useState(dbResponses[1] ?? "");
  const [secondAiCommentApproved, setSecondAiCommentApproved] = useState<"approved" | "rejected" | null>(null);
  const [secondAiCommentRegenerating, setSecondAiCommentRegenerating] = useState(false);
  const [thirdAiCommentIndex, setThirdAiCommentIndex] = useState(2);
  const [thirdAiComment, setThirdAiComment] = useState(dbResponses[2] ?? "");
  const [thirdAiCommentApproved, setThirdAiCommentApproved] = useState<"approved" | "rejected" | null>(null);
  const [thirdAiCommentRegenerating, setThirdAiCommentRegenerating] = useState(false);
  const [sofiaAddressInjected, setSofiaAddressInjected] = useState(false);
  // Gate: only show the second AI card after Sofia has replied to the first approved message
  const [sofiaFirstReplyVisible, setSofiaFirstReplyVisible] = useState(false);
  // Thinking placeholders — true while AI is "composing" the next response after customer replies
  const [secondCardReady, setSecondCardReady] = useState(false);
  const [thirdCardReady, setThirdCardReady] = useState(false);
  // Third card two-phase split: actions approved → thinking → bot comment
  const [thirdActionsApproved, setThirdActionsApproved] = useState(false);
  const [thirdBotCommentReady, setThirdBotCommentReady] = useState(false);
  const [thirdActionRejectPopoverOpen, setThirdActionRejectPopoverOpen] = useState(false);
  const [sofiaTyping, setSofiaTyping] = useState(false);
  // Temporary credit state — pre-checked and open by default
  const [creditChecked, setCreditChecked] = useState(true);
  const [creditExpanded, setCreditExpanded] = useState(true);
  const [creditAmount, setCreditAmount] = useState("2,159.00");
  const [creditConfirmed, setCreditConfirmed] = useState(false);

  // Replacement card shipping speed — pre-checked, Standard pre-selected, open by default
  type ShippingSpeed = "3-5 days" | "overnight" | "one week";
  const SHIPPING_OPTIONS: { label: string; value: ShippingSpeed; badge: string }[] = [
    { label: "Standard (3–5 business days)", value: "3-5 days", badge: "Free" },
    { label: "Overnight delivery", value: "overnight", badge: "Expedited" },
    { label: "Economy (up to 1 week)", value: "one week", badge: "Economy" },
  ];
  const [shippingChecked, setShippingChecked] = useState(true);
  const [shippingExpanded, setShippingExpanded] = useState(true);
  const [selectedShipping, setSelectedShipping] = useState<ShippingSpeed | null>("3-5 days");
  const [shippingConfirmed, setShippingConfirmed] = useState(false);
  // Dispute checkbox state (Sofia only)
  const DISPUTE_STEPS = [
    "Verifying account and transaction details",
    "Filing dispute for $2,159 in unauthorized charges",
    "Issuing provisional credit to account",
    "Sending dispute confirmation to Sofia",
  ];
  const [disputeChecked, setDisputeChecked] = useState(true); // pre-checked by default
  const [disputeExpanded, setDisputeExpanded] = useState(true); // preview open by default
  const [disputeRunning, setDisputeRunning] = useState(false); // only true after Approve
  const [disputePaused, setDisputePaused] = useState(false);
  const [disputeStepIndex, setDisputeStepIndex] = useState(0);
  const [disputeComplete, setDisputeComplete] = useState(false);
  const [disputeRejectPopoverOpen, setDisputeRejectPopoverOpen] = useState(false);
  const [disputeRejectedReason, setDisputeRejectedReason] = useState<string | null>(null);
  const [disputeAltPhase, setDisputeAltPhase] = useState<"idle" | "thinking" | "ready">("idle");
  const disputeTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const disputeStepIndexRef = useRef(0); // mirrors disputeStepIndex for use in closures
  const [injectedMessages, setInjectedMessages] = useState<ConversationMessage[]>([]);
  const [lastApprovedMsgCount, setLastApprovedMsgCount] = useState<number | null>(null);
  const [transferTriggerRect, setTransferTriggerRect] = useState<DOMRect | null>(null);
  const transferBtnRef = useRef<HTMLButtonElement>(null);
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
    const done = setTimeout(
      () => setCopilotPhase("done"),
      1000 + COPILOT_REASONING_STEPS.length * 600 + 600,
    );
    copilotTimersRef.current.push(done);
  }

  useEffect(() => () => { copilotTimersRef.current.forEach(clearTimeout); }, []);
  useEffect(() => () => { approveTimersRef.current.forEach(clearTimeout); }, []);
  useEffect(() => () => { disputeTimersRef.current.forEach(clearTimeout); }, []);

  // Shared approve logic — called by the Approve button in the modal AND by autoApprove on mount
  function triggerApprove() {
    setApproveContext(true);
    approveTimersRef.current.forEach(clearTimeout);
    approveTimersRef.current = [];
    const ariaTime = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    setInjectedMessages((prev) => [
      ...prev,
      { id: Date.now(), role: "agent" as const, author: caseData.botType, content: dbResponses[0] ?? "", time: ariaTime },
    ]);
    approveTimersRef.current.push(setTimeout(() => setJordanTyping(true), 1500));
    approveTimersRef.current.push(setTimeout(() => {
      setJordanTyping(false);
      const t1 = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      setInjectedMessages((prev) => [...prev, { id: Date.now(), role: "customer" as const, content: "That's amazing, thank you!", time: t1 }]);
    }, 3500));
    approveTimersRef.current.push(setTimeout(() => {
      const t2 = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      setInjectedMessages((prev) => [...prev, { id: Date.now(), role: "customer" as const, content: "\u2605\u2605\u2605\u2605\u2605  Case resolution rated 5 stars", time: t2 }]);
      setSuperviseScrollTrigger((n) => n + 1);
    }, 4500));
    approveTimersRef.current.push(setTimeout(() => {
      setLocalStatus("resolved");
      setLocalPriority("Low");
      setShowResolvedMessage(true);
      setSuperviseScrollTrigger((n) => n + 1);
      onResolve();
    }, 5500));
  }

  // Auto-approve on open when triggered from the toast
  useEffect(() => {
    if (caseData.autoApprove && caseData.customerRecordId === "jordan") {
      triggerApprove();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [handleClose]);

  // ── Case Overview card (AI internal note + confidence meter) — rendered in left panel ──
  const confidence = caseData.aiConfidence ?? 78;
  const confidenceReason = caseData.aiConfidenceReason ?? "Based on 3 similar resolved cases and firmware documentation match.";
  const DECLINE_REASONS = [
    "Cannot verify this information",
    "Incorrect approach",
    "Need more information",
    "Risk is too high",
    "Requires escalation",
  ];
  const REGENERATED_NOTE: Record<string, string> = {
    jordan: "Understood. As an alternative, I can guide Jordan through manually exporting his port forwarding rules from the router admin panel (192.168.1.1 › Advanced › Backup Config) before the factory reset — this ensures his configuration is fully preserved regardless of firmware backup behaviour. Would you like me to proceed with these instructions instead?",
    sofia: "Understood. As an additional safeguard, I recommend we first have our fraud prevention team independently verify the transaction details before initiating the dispute. I can flag this case for priority review and arrange for a fraud specialist to contact Sofia directly within the next 30 minutes. Shall I proceed?",
  };
  const regeneratedNote = regeneratedNoteContext
    ?? REGENERATED_NOTE[caseData.customerRecordId ?? ""]
    ?? "Understood. I've re-evaluated the situation and would like to propose an alternative approach. Could you clarify what additional information is needed so I can update my recommendation accordingly?";

  const caseOverviewCard = caseData.customerContext ? (
    <div className="rounded-xl border border-[#BFDBFE] bg-[#EBF4FD] p-4 space-y-3">
      {/* Header — always shown */}
      <div className="flex items-center gap-2">
        <img src={botAvatar} alt={`${caseData.botType} avatar`} className="h-7 w-7 rounded-full object-cover shrink-0" />
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1260B0]">
          {caseData.botType}
        </p>
      </div>

      {/* ── State 3: Resolved ── */}
      {showResolvedMessage ? (
        <>
          <p className="text-[13px] font-medium leading-5 text-[#344054]">
            Wow! Great job, Jeff! Looks like we have another happy customer. I've updated the case to resolved!
          </p>
          {/* Case Status dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setResolvedInlineStatusOpen((v) => !v)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg border px-3 py-2 transition-colors",
                resolvedInlineStatus === "Resolved" ? "border-[#24943E] bg-[#EFFBF1]" :
                resolvedInlineStatus === "Pending"  ? "border-[#FFB800] bg-[#FFF6E0]" :
                resolvedInlineStatus === "Escalated"? "border-[#E53935] bg-[#FDEAEA]" :
                                                     "border-[#BFDBFE] bg-white",
              )}
            >
              <span className={cn("text-[11px] font-semibold uppercase tracking-widest",
                resolvedInlineStatus === "Resolved" ? "text-[#208337]" :
                resolvedInlineStatus === "Pending"  ? "text-[#A37A00]" :
                resolvedInlineStatus === "Escalated"? "text-[#C71D1A]" : "text-[#166CCA]",
              )}>Case Status</span>
              <div className="flex items-center gap-1.5">
                <div className={cn("h-2 w-2 rounded-full",
                  resolvedInlineStatus === "Resolved" ? "bg-[#208337]" :
                  resolvedInlineStatus === "Pending"  ? "bg-[#FFB800]" :
                  resolvedInlineStatus === "Escalated"? "bg-[#E32926]" : "bg-[#166CCA]",
                )} />
                <span className={cn("text-[12px] font-semibold",
                  resolvedInlineStatus === "Resolved" ? "text-[#208337]" :
                  resolvedInlineStatus === "Pending"  ? "text-[#A37A00]" :
                  resolvedInlineStatus === "Escalated"? "text-[#C71D1A]" : "text-[#166CCA]",
                )}>{resolvedInlineStatus}</span>
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform",
                  resolvedInlineStatus === "Resolved" ? "text-[#208337]" :
                  resolvedInlineStatus === "Pending"  ? "text-[#A37A00]" :
                  resolvedInlineStatus === "Escalated"? "text-[#C71D1A]" : "text-[#166CCA]",
                  resolvedInlineStatusOpen && "rotate-180",
                )} />
              </div>
            </button>
            {resolvedInlineStatusOpen && (
              <div className="absolute bottom-[calc(100%+4px)] left-0 right-0 z-30 rounded-xl border border-[#E4E7EC] bg-white shadow-[0_8px_24px_rgba(16,24,40,0.12)] overflow-hidden">
                {[
                  { label: "Resolved",  dot: "bg-[#208337]", text: "text-[#208337]" },
                  { label: "Open",      dot: "bg-[#166CCA]", text: "text-[#166CCA]" },
                  { label: "Pending",   dot: "bg-[#FFB800]", text: "text-[#A37A00]" },
                  { label: "Escalated", dot: "bg-[#E32926]", text: "text-[#C71D1A]" },
                ].map(({ label, dot, text }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => { setResolvedInlineStatus(label); setResolvedInlineStatusOpen(false); }}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-[#F9FAFB] transition-colors"
                  >
                    <span className={cn("h-2 w-2 rounded-full shrink-0", dot)} />
                    <span className={cn("text-[13px] font-medium", text)}>{label}</span>
                    {resolvedInlineStatus === label && (
                      <Check className="ml-auto h-3.5 w-3.5 text-[#166CCA]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              onDismissed?.({
                customerName: caseData.name,
                customerId: caseData.customerId,
                status: localStatus,
                resolvedStatus: resolvedInlineStatus,
                actions: caseData.aiOverview.actions,
                preview: caseData.preview,
                botType: caseData.botType,
                channel: caseData.channel,
              });
              handleClose();
            }}
            className="w-full rounded-lg border border-[#D0D5DD] bg-white px-3 py-2 text-[12px] font-semibold text-[#344054] hover:bg-[#F9FAFB] transition-colors"
          >
            Dismiss
          </button>
        </>
      ) : approveContext ? (
        /* ── State 2: Approving in progress ── */
        <>
          <p className="text-[13px] font-medium leading-5 text-[#344054]">
            {regeneratedNoteContext ? regeneratedNote : caseData.customerContext}
          </p>
          <p className="text-[12px] font-medium text-[#344054] flex items-center gap-1.5">
            Approving request
            <span className="inline-flex gap-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#166CCA] animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="h-1.5 w-1.5 rounded-full bg-[#166CCA] animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="h-1.5 w-1.5 rounded-full bg-[#166CCA] animate-bounce" style={{ animationDelay: "300ms" }} />
            </span>
          </p>
        </>
      ) : (
        /* ── State 1: Normal — show message, confidence, Approve/Reject ── */
        <>
          {/* Body — regenerating spinner OR context / regenerated text */}
          {isRegeneratingNote ? (
            <div className="flex items-center gap-2.5 py-2">
              <span className="h-4 w-4 rounded-full border-2 border-[#BFDBFE] border-t-[#166CCA] animate-spin shrink-0" />
              <span className="text-[12px] text-[#1260B0] font-medium">Reconsidering suggestion…</span>
            </div>
          ) : (
            <p className="text-[13px] font-medium leading-5 text-[#344054]">
              {regeneratedNoteContext ? regeneratedNote : caseData.customerContext}
            </p>
          )}

          {/* Confidence meter — only for escalated cases, hidden while regenerating */}
          {caseData.status === "escalated" && !isRegeneratingNote && (() => {
            const displayConfidence = regeneratedNoteContext
              ? (regeneratedConfidence ?? confidence)
              : confidence;
            return (
              <div className="rounded-lg border border-[#BFDBFE] bg-white px-3 py-2.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[#667085]">AI Confidence</span>
                  <span className="text-[12px] font-bold text-[#166CCA]">{displayConfidence}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-[#E4E7EC] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#166CCA] to-[#4B96DA] transition-all duration-700"
                    style={{ width: `${displayConfidence}%` }}
                  />
                </div>
                <p className="text-[10px] text-[#98A2B3] leading-relaxed">{confidenceReason}</p>
              </div>
            );
          })()}

          {/* Action buttons — only for escalated cases, hidden in supervise mode */}
          {caseData.status === "escalated" && !isRegeneratingNote && !showQuickActions && (
            caseData.customerRecordId === "marcus" ? (
              <button
                type="button"
                onClick={() => {
                  const ch = (caseData.channel === "sms" ? "sms" : "chat") as "chat" | "sms";
                  const base = caseData.customerRecordId
                    ? createConversationState(caseData.customerRecordId, ch, caseData.botType === "Jacob" ? "Jacob" : caseData.botType === "Emily" ? "Emily" : "Aria")
                    : { customerName: caseData.name, label: "Chat", timelineLabel: "", status: "open" as const, draft: "", messages: [], isCustomerTyping: false };
                  const fullConversation = injectedMessages.length > 0
                    ? { ...base, messages: [...base.messages, ...injectedMessages] }
                    : base;
                  onTakeover(fullConversation, localStatus, localPriority);
                }}
                className="w-full rounded-lg bg-[#166CCA] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#1260B0] transition-colors"
              >
                Take Over
              </button>
            ) : (
              <div className="relative flex gap-2">
                {/* Decline popover */}
                {declinePopoverOpen && (
                  <div className="absolute bottom-[calc(100%+8px)] left-0 right-0 z-20 rounded-xl border border-[#E4E7EC] bg-white shadow-[0_8px_24px_rgba(16,24,40,0.12)] overflow-hidden">
                    <div className="px-3 py-2 border-b border-[#F2F4F7]">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#667085]">Reason for rejecting</p>
                    </div>
                    {DECLINE_REASONS.map((reason) => (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => {
                          setDeclinePopoverOpen(false);
                          setIsRegeneratingNote(true);
                          const delta = Math.floor(Math.random() * 6) + 3;
                          const newConfidence = Math.min(99, Math.max(60, confidence + (Math.random() > 0.4 ? delta : -delta)));
                          approveTimersRef.current.push(setTimeout(() => {
                            setIsRegeneratingNote(false);
                            setRegeneratedNoteContext(regeneratedNote);
                            setRegeneratedConfidence(newConfidence);
                          }, 1800));
                        }}
                        className="w-full px-3 py-2 text-left text-[13px] text-[#344054] hover:bg-[#F9FAFB] transition-colors"
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={triggerApprove}
                  className="flex-1 rounded-lg bg-[#166CCA] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#1260B0] transition-colors"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => setDeclinePopoverOpen((v) => !v)}
                  className={cn(
                    "flex-1 rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition-colors",
                    declinePopoverOpen
                      ? "border-[#D0D5DD] bg-[#F2F4F7] text-[#344054]"
                      : "border-[#D0D5DD] bg-white text-[#344054] hover:bg-[#F2F4F7]",
                  )}
                >
                  Reject
                </button>
              </div>
            )
          )}
        </>
      )}
    </div>
  ) : null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-white/80 backdrop-blur-[3px] ${isClosing ? "animate-backdrop-fade-out" : "animate-backdrop-fade-in"}`}
        onClick={handleClose}
      />

      {/* Modal */}
      <div className={`${isClosing ? "animate-modal-fade-out" : "animate-modal-fade-in"} relative z-10 flex flex-col w-[90vw] max-w-[1280px] max-h-[90vh] rounded-2xl bg-white shadow-[0_24px_64px_rgba(0,0,0,0.18)] overflow-hidden`}>

        {/* ── Full-width header ── */}
        <div className="shrink-0 border-b border-border px-5 pt-3 pb-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <span className="text-[14px] font-bold text-[#101828]">{caseData.name}</span>
              {localStatus === "resolved" ? (
                <span className="rounded border border-[#24943E] bg-[#EFFBF1] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-[#208337] transition-all duration-500">
                  resolved
                </span>
              ) : localStatus === "escalated" ? (
                <>
                  <span className="rounded border border-[#E53935] bg-[#FDEAEA] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-[#C71D1A]">
                    escalated
                  </span>
                  <EscalationTimer customerId={caseData.customerRecordId} />
                </>
              ) : (
                <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-semibold leading-none transition-all duration-500", priorityStyles[localPriority] ?? "border-border bg-[#F9FAFB] text-[#344054]")}>
                  {localPriority}
                </span>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-3">
              {localStatus === "resolved" ? (
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#208337] transition-all duration-500">
                  Case Resolved
                </p>
              ) : localStatus === "escalated" ? (
                <>
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FEE2E2]">
                    <AlertTriangle className="h-3 w-3 text-[#E53935]" />
                  </div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#E53935]">
                    Escalated — Immediate Action Required
                  </p>
                </>
              ) : (
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#667085]">
                  Reviewing
                </p>
              )}
              <button
                type="button"
                onClick={handleClose}
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[#98A2B3] hover:bg-[#F2F4F7] hover:text-[#344054] transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <p className="mt-0.5 text-[12px] text-[#475467] leading-snug">{caseData.preview}</p>
          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[#98A2B3]">
            <span>{caseData.botType}</span>
            <span>·</span>
            <span className="capitalize">{caseData.channel}</span>
            <span>·</span>
            <span>⏱ {caseData.waitTime}</span>
            <span>·</span>
            <span>{caseData.customerId}</span>
          </div>
        </div>

        {/* ── Two-column body ── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* Left column: AI analysis */}
          <div className="flex flex-col w-[380px] shrink-0 border-r border-border overflow-hidden">
            {/* Scrollable body */}
            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3">

              {/* Case Overview — AI internal note + confidence meter */}
              {caseOverviewCard}

              {/* Customer Profile Card */}
              {(() => {
                const rec = caseData.customerRecordId ? getCustomerRecord(caseData.customerRecordId) : null;
                if (!rec) return null;
                const initials = caseData.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
                const profile = rec.profile;
                return (
                  <div className="rounded-xl border border-[#E4E7EC] bg-white overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setIsCustomerProfileOpen((v) => !v)}
                      className="flex w-full items-center justify-between px-4 py-3 text-left"
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1260B0]">Customer Profile</p>
                      <ChevronDown className={cn("h-3.5 w-3.5 text-[#1260B0] transition-transform duration-200", isCustomerProfileOpen && "rotate-180")} />
                    </button>
                    <div className={cn("grid transition-all duration-200 ease-out", isCustomerProfileOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                      <div className="overflow-hidden">
                        <div className="px-4 pb-4 space-y-3">
                          {/* Identity */}
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#C5DEF5] text-[13px] font-bold text-[#1260B0]">
                                {initials}
                              </div>
                              <div>
                                <p className="text-[13px] font-semibold text-[#111827] leading-tight">{caseData.name}</p>
                                <p className="text-[11px] text-[#667085] leading-snug">{profile.department} · {profile.tenureYears} yr{profile.tenureYears !== 1 ? "s" : ""} tenure</p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-[10px] text-[#98A2B3]">Balance</p>
                              <p className="text-[13px] font-semibold text-[#111827]">{profile.totalAUM}</p>
                            </div>
                          </div>
                          {/* Stats */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="rounded-lg bg-[#F9FAFB] border border-[#E4E7EC] p-2.5">
                              <p className="mb-1 text-[10px] text-[#667085]">Fraud Risk Score</p>
                              <p className={cn("text-[15px] font-bold leading-none mb-1.5", profile.fraudRiskScore >= 70 ? "text-[#E32926]" : profile.fraudRiskScore >= 40 ? "text-[#A37A00]" : "text-[#208337]")}>
                                {profile.fraudRiskScore} <span className="text-[11px] font-normal text-[#98A2B3]">/ 100</span>
                              </p>
                              <div className="h-1.5 rounded-full bg-[#E4E7EC] overflow-hidden">
                                <div
                                  className={cn("h-full rounded-full", profile.fraudRiskScore >= 70 ? "bg-[#E32926]" : profile.fraudRiskScore >= 40 ? "bg-[#A37A00]" : "bg-[#208337]")}
                                  style={{ width: `${profile.fraudRiskScore}%` }}
                                />
                              </div>
                            </div>
                            <div className="rounded-lg bg-[#F9FAFB] border border-[#E4E7EC] p-2.5">
                              <p className="mb-1 text-[10px] text-[#667085]">Prior Disputes</p>
                              <p className="text-[15px] font-bold leading-none text-[#111827]">{profile.priorDisputeCount === 0 ? "None" : profile.priorDisputeCount}</p>
                              <p className={cn("mt-1 text-[10px]", profile.cardBlocked ? "text-[#E32926] font-medium" : "text-[#667085]")}>
                                Card: {profile.cardBlocked ? "BLOCKED" : "NOT blocked"}
                              </p>
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
                );
              })()}

              {/* Attempted Resolution accordion */}
              <div className="rounded-xl border border-[#E4E7EC] bg-white overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsAttemptedResolutionOpen((v) => !v)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1260B0]">Case Overview</p>
                  <ChevronDown className={cn("h-3.5 w-3.5 text-[#1260B0] transition-transform duration-200", isAttemptedResolutionOpen && "rotate-180")} />
                </button>
                <div className={cn("grid transition-all duration-200 ease-out", isAttemptedResolutionOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                  <div className="overflow-hidden">
                    <ul className="px-4 pb-4 space-y-2">
                      {caseData.aiOverview.actions.map((action, i) => (
                        <li key={i} className="flex items-start gap-2 text-[12px] text-[#344054] leading-relaxed">
                          <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#1260B0]" />
                          {action}
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

              {/* Potential Next Steps — shown in left column after AI response is approved */}
              {showQuickActions && aiCommentApproved === "approved" && (() => {
                const channel = (caseData.channel === "sms" ? "sms" : "chat") as "chat" | "sms";
                const baseConv = caseData.customerRecordId
                  ? createConversationState(caseData.customerRecordId, channel, caseData.botType === "Jacob" ? "Jacob" : caseData.botType === "Emily" ? "Emily" : "Aria")
                  : { messages: [] as ConversationMessage[] };
                const allMessages = [...baseConv.messages, ...injectedMessages];
                const customerRespondedAfterApproval =
                  lastApprovedMsgCount !== null &&
                  allMessages.some((m, idx) => m.role === "customer" && idx >= lastApprovedMsgCount);
                if (customerRespondedAfterApproval) return null;
                return (
                  <div className="rounded-xl border border-[#BFDBFE] bg-white p-3 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3 text-[#166CCA]" />
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1260B0]">Potential Next Steps</p>
                    </div>
                    <p className="text-[11px] text-[#98A2B3]">Waiting for customer to respond before preparing next AI message.</p>
                    <ul className="space-y-1.5 pt-0.5">
                      {POTENTIAL_NEXT_STEPS.map((step, i) => (
                        <li key={i} className="flex items-start gap-2 text-[12px] text-[#344054] leading-relaxed">
                          <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#166CCA]" />
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })()}
            </div>

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

          {/* Right column: live conversation */}
          <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
            {(() => {
              const channel = (caseData.channel === "sms" ? "sms" : "chat") as "chat" | "sms";
              const baseConversation = caseData.customerRecordId
                ? createConversationState(caseData.customerRecordId, channel, caseData.botType === "Jacob" ? "Jacob" : caseData.botType === "Emily" ? "Emily" : "Aria")
                : {
                    customerName: caseData.name,
                    label: "Chat",
                    timelineLabel: "",
                    status: "open" as const,
                    draft: "",
                    messages: [{ id: 1, role: "customer" as const, content: caseData.preview, time: caseData.waitTime || "now" }],
                    isCustomerTyping: false,
                  };
              const isSofia = caseData.customerRecordId === "sofia";
              const allMessages = [...baseConversation.messages, ...injectedMessages];
              const conversation = {
                ...baseConversation,
                messages: injectedMessages.length > 0 ? allMessages : baseConversation.messages,
                isCustomerTyping: isSofia ? sofiaTyping : jordanTyping,
              };

              // Second AI response card (Sofia only) — shown after first is approved
              const showSecondCard = isSofia && showQuickActions && aiCommentApproved === "approved" && secondCardReady && secondAiCommentApproved !== "approved";
              const showThirdCard = isSofia && showQuickActions && thirdCardReady && thirdAiCommentApproved !== "approved";
              // "Thinking" placeholder — shown after Sofia provides her address, before Issue Temp Credit card appears
              const showThinkingThird = isSofia && showQuickActions && sofiaAddressInjected && !thirdCardReady && aiCommentApproved === "approved" && thirdAiCommentApproved !== "approved";

              // ── Third card Phase 1: Action Authorization (credit + shipping) ────────
              const showThinkingBetweenActions = isSofia && showQuickActions && thirdActionsApproved && !thirdBotCommentReady && thirdAiCommentApproved !== "approved";
              const thirdActionAuthBubble = showThirdCard && !thirdActionsApproved ? (
                <div className="px-4 py-3 flex items-start gap-2">
                  <div className="flex-1 rounded-xl border border-[#166CCA] bg-[#EBF4FD] p-3 space-y-2.5">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3 text-[#166CCA]" />
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1260B0]">Action Authorization</p>
                    </div>
                    {/* Summary */}
                    <p className="text-[12px] text-[#344054] leading-relaxed px-1">
                      Sofia has confirmed her mailing address. Review the actions below to issue her temporary credit and a replacement card, then approve to proceed.
                    </p>

                    {/* Temporary credit */}
                    <div className="rounded-xl border border-black/[0.06] bg-white overflow-hidden">
                      <div className="flex items-center gap-3 px-3 py-2.5">
                        <button
                          type="button"
                          disabled={creditConfirmed}
                          onClick={() => {
                            if (creditConfirmed) return;
                            const next = !creditChecked;
                            setCreditChecked(next);
                            setCreditExpanded(next);
                          }}
                          className={cn(
                            "shrink-0 h-[18px] w-[18px] rounded-[5px] border-2 flex items-center justify-center transition-colors",
                            creditChecked ? "border-[#166CCA] bg-[#166CCA]" : "border-[#D0D5DD] bg-white hover:border-[#166CCA]",
                            creditConfirmed && "opacity-60 cursor-not-allowed",
                          )}
                        >
                          {creditChecked && <Check className="h-2.5 w-2.5 text-white" />}
                        </button>
                        <span className={cn(
                          "flex-1 text-[13px] leading-5 text-[#111827] transition-colors",
                          creditConfirmed && "line-through text-[#9CA3AF]",
                        )}>
                          Issue Temporary Credit to Account
                        </span>
                        {creditChecked && !creditConfirmed && (
                          <button
                            type="button"
                            onClick={() => setCreditExpanded((v) => !v)}
                            className="shrink-0 text-[#98A2B3] hover:text-[#166CCA] transition-colors"
                          >
                            <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", creditExpanded && "rotate-180")} />
                          </button>
                        )}
                      </div>
                      {creditChecked && creditExpanded && (
                        <div className="border-t border-black/[0.05] px-3 pb-3 pt-2.5 space-y-2.5">
                          <p className="text-[12px] font-semibold text-[#111827]">Credit amount</p>
                          <div className={cn(
                            "flex items-center gap-2 rounded-lg border bg-white px-3 py-2 transition-colors",
                            creditConfirmed ? "border-[#E4E7EC] opacity-60" : "border-[#BFDBFE] focus-within:border-[#166CCA] focus-within:ring-1 focus-within:ring-[#166CCA]",
                          )}>
                            <span className="text-[13px] font-semibold text-[#344054]">$</span>
                            <input
                              type="text"
                              value={creditAmount}
                              readOnly={creditConfirmed}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9.,]/g, "");
                                setCreditAmount(val);
                              }}
                              className="flex-1 bg-transparent text-[13px] font-semibold text-[#344054] outline-none placeholder:text-[#98A2B3]"
                              placeholder="0.00"
                            />
                            <span className="text-[11px] text-[#98A2B3] shrink-0">USD</span>
                          </div>
                          <p className="text-[10px] text-[#98A2B3] leading-relaxed">
                            Provisional credit will be applied immediately and held pending dispute resolution.
                          </p>
                          {creditConfirmed && (
                            <div className="flex items-center gap-1.5 rounded-lg bg-[#EFFBF1] border border-[#24943E] px-3 py-2">
                              <Check className="h-3.5 w-3.5 text-[#208337]" />
                              <span className="text-[11px] font-semibold text-[#208337]">
                                Temporary credit of ${creditAmount} applied to Sofia's account
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Replacement card shipping speed */}
                    <div className="rounded-xl border border-black/[0.06] bg-white overflow-hidden">
                      <div className="flex items-center gap-3 px-3 py-2.5">
                        <button
                          type="button"
                          disabled={shippingConfirmed}
                          onClick={() => {
                            if (shippingConfirmed) return;
                            const next = !shippingChecked;
                            setShippingChecked(next);
                            setShippingExpanded(next);
                          }}
                          className={cn(
                            "shrink-0 h-[18px] w-[18px] rounded-[5px] border-2 flex items-center justify-center transition-colors",
                            shippingChecked ? "border-[#166CCA] bg-[#166CCA]" : "border-[#D0D5DD] bg-white hover:border-[#166CCA]",
                            shippingConfirmed && "opacity-60 cursor-not-allowed",
                          )}
                        >
                          {shippingChecked && <Check className="h-2.5 w-2.5 text-white" />}
                        </button>
                        <span className={cn(
                          "flex-1 text-[13px] leading-5 text-[#111827] transition-colors",
                          shippingConfirmed && "line-through text-[#9CA3AF]",
                        )}>
                          Select Replacement Card Shipping Speed
                        </span>
                        {shippingChecked && !shippingConfirmed && (
                          <button
                            type="button"
                            onClick={() => setShippingExpanded((v) => !v)}
                            className="shrink-0 text-[#98A2B3] hover:text-[#166CCA] transition-colors"
                          >
                            <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", shippingExpanded && "rotate-180")} />
                          </button>
                        )}
                      </div>
                      {shippingChecked && shippingExpanded && (
                        <div className="border-t border-black/[0.05] px-3 pb-3 pt-2.5 space-y-2">
                          <p className="text-[12px] font-semibold text-[#111827] mb-2">Shipping method</p>
                          {SHIPPING_OPTIONS.map((opt) => {
                            const isSelected = selectedShipping === opt.value;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                  if (shippingConfirmed) return;
                                  setSelectedShipping(opt.value);
                                  const deliveryText =
                                    opt.value === "overnight"
                                      ? "overnight — you'll have it tomorrow"
                                      : opt.value === "one week"
                                      ? "within up to one week"
                                      : "within 3–5 business days";
                                  setThirdAiComment(
                                    `Thank you, Sofia. I've applied a temporary credit of $2,159 to your account, your balance will be restored while we complete our investigation. You'll be able to make your rent payment without any issue. We've also permanently blocked your current card and are issuing a new one to your address on file — it will arrive ${deliveryText}. Is there anything else I can help you with?`
                                  );
                                }}
                                className={cn(
                                  "w-full flex items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors",
                                  isSelected ? "border-[#166CCA] bg-[#EBF4FD]" : "border-[#E4E7EC] bg-white hover:border-[#166CCA] hover:bg-[#F9FAFB]",
                                  shippingConfirmed && "opacity-60 cursor-default",
                                )}
                              >
                                <span className={cn("text-[12px]", isSelected ? "font-semibold text-[#1260B0]" : "text-[#344054]")}>
                                  {opt.label}
                                </span>
                                <span className={cn(
                                  "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                                  isSelected ? "bg-[#166CCA] border-[#166CCA] text-white" : "bg-[#F2F4F7] border-[#E4E7EC] text-[#667085]",
                                )}>
                                  {opt.badge}
                                </span>
                              </button>
                            );
                          })}
                          {shippingConfirmed && (
                            <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-[#EFFBF1] border border-[#24943E] px-3 py-2">
                              <Check className="h-3.5 w-3.5 text-[#208337]" />
                              <span className="text-[11px] font-semibold text-[#208337]">
                                Shipping confirmed —{" "}
                                {selectedShipping === "overnight" ? "Overnight delivery" : selectedShipping === "one week" ? "Economy (up to 1 week)" : "Standard 3–5 business days"}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Phase 1 Approve/Reject */}
                    <div className="relative flex items-center gap-2">
                      {/* Reject reasons popover */}
                      {thirdActionRejectPopoverOpen && (
                        <div className="absolute bottom-[calc(100%+8px)] left-0 right-0 z-20 rounded-xl border border-[#E4E7EC] bg-white shadow-[0_8px_24px_rgba(16,24,40,0.12)] overflow-hidden">
                          <div className="px-3 py-2 border-b border-[#F2F4F7]">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#667085]">Reason for rejecting</p>
                          </div>
                          {[
                            "Credit amount is incorrect",
                            "Cannot verify mailing address",
                            "Shipping speed not appropriate",
                            "Need supervisor approval",
                            "Requires additional verification",
                          ].map((reason) => (
                            <button
                              key={reason}
                              type="button"
                              onClick={() => {
                                setThirdActionRejectPopoverOpen(false);
                                const noteTime = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
                                setInjectedMessages((prev) => [...prev, { id: Date.now(), role: "agent" as const, content: `Agent rejected action authorization — Reason: ${reason}`, time: noteTime, isInternal: true }]);
                                setSuperviseScrollTrigger((n) => n + 1);
                                // Reset actions back to defaults
                                setShippingChecked(true);
                                setShippingExpanded(true);
                                setSelectedShipping("3-5 days");
                                setShippingConfirmed(false);
                                setCreditChecked(true);
                                setCreditExpanded(true);
                                setCreditAmount("2,159.00");
                                setCreditConfirmed(false);
                                setThirdActionsApproved(false);
                                setThirdBotCommentReady(false);
                              }}
                              className="w-full px-3 py-2.5 text-left text-[13px] text-[#344054] hover:bg-[#F9FAFB] transition-colors"
                            >
                              {reason}
                            </button>
                          ))}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setThirdActionRejectPopoverOpen(false);
                          // Fire internal notes for checked actions
                          if (creditChecked && !creditConfirmed) {
                            setCreditConfirmed(true);
                            const creditNote = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
                            setInjectedMessages((prev) => [...prev, { id: Date.now() + 1, role: "agent" as const, content: `Temporary credit of $${creditAmount} applied to Sofia's account — held pending dispute resolution`, time: creditNote, isInternal: true }]);
                          }
                          if (shippingChecked && !shippingConfirmed) {
                            setShippingConfirmed(true);
                            const shipNote = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
                            const deliveryLabel = selectedShipping === "overnight" ? "Overnight delivery" : selectedShipping === "one week" ? "Economy — up to 1 week" : "Standard 3–5 business days";
                            setInjectedMessages((prev) => [...prev, { id: Date.now() + 2, role: "agent" as const, content: `Replacement card issued to 847 Westmont Avenue, Apt 2C, Chicago, IL 60614 · ${deliveryLabel}`, time: shipNote, isInternal: true }]);
                          }
                          setThirdActionsApproved(true);
                          setSuperviseScrollTrigger((n) => n + 1);
                          // Brief thinking pause then reveal bot comment card
                          approveTimersRef.current.push(setTimeout(() => {
                            setThirdBotCommentReady(true);
                            setSuperviseScrollTrigger((n) => n + 1);
                          }, 2200));
                        }}
                        className="flex-1 rounded-lg bg-[#166CCA] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#1260B0] transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => setThirdActionRejectPopoverOpen((v) => !v)}
                        className={cn(
                          "flex-1 rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition-colors",
                          thirdActionRejectPopoverOpen
                            ? "border-[#D0D5DD] bg-[#F2F4F7] text-[#344054]"
                            : "border-[#D0D5DD] bg-white text-[#344054] hover:bg-[#F2F4F7]",
                        )}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                  <img src={jacobAvatar} alt="Jacob avatar" className="shrink-0 mt-0.5 h-7 w-7 rounded-full object-cover" />
                </div>
              ) : undefined;

              // ── Third card Phase 2: Bot Comment (after actions approved) ─────────
              const thirdBotCommentBubble = showThirdCard && thirdBotCommentReady && thirdAiCommentApproved !== "approved" ? (
                <div className="px-4 py-3 flex items-start gap-2">
                  <div className="flex-1 rounded-xl border border-[#166CCA] bg-[#EBF4FD] p-3 space-y-2.5">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3 text-[#166CCA]" />
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1260B0]">AI Next Response</p>
                    </div>
                    <textarea
                      value={thirdAiComment}
                      onChange={(e) => { setThirdAiComment(e.target.value); setThirdAiCommentApproved(null); }}
                      rows={4}
                      className="w-full resize-none rounded-lg border border-[#BFDBFE] bg-white px-3 py-2.5 text-[12px] text-[#344054] leading-relaxed outline-none focus:border-[#166CCA] focus:ring-1 focus:ring-[#166CCA] transition-colors"
                    />
                    {thirdAiCommentRegenerating ? (
                      <div className="flex items-center gap-2 rounded-lg bg-[#EBF4FD] border border-[#BFDBFE] px-3 py-2">
                        <span className="h-3.5 w-3.5 rounded-full border-2 border-[#BFDBFE] border-t-[#166CCA] animate-spin shrink-0" />
                        <span className="text-[12px] text-[#1260B0] font-medium">Regenerating response…</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setThirdAiCommentApproved("approved");
                            const time = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
                            setInjectedMessages((prev) => [...prev, { id: Date.now(), role: "agent" as const, author: caseData.botType, content: thirdAiComment, time }]);
                            setSuperviseScrollTrigger((n) => n + 1);
                            // Sofia's final reply — typing indicator then message
                            approveTimersRef.current.push(setTimeout(() => {
                              setSofiaTyping(true);
                              setSuperviseScrollTrigger((n) => n + 1);
                              approveTimersRef.current.push(setTimeout(() => {
                                setSofiaTyping(false);
                                const sofiaTime = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
                                setInjectedMessages((prev) => [...prev, {
                                  id: Date.now(), role: "customer" as const,
                                  content: "thank you. I'm sorry I got so upset. I was just really scared.",
                                  time: sofiaTime,
                                }]);
                                setSuperviseScrollTrigger((n) => n + 1);
                              }, 2500));
                            }, 3000));
                          }}
                          className="flex-1 rounded-lg bg-[#166CCA] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#1260B0] transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setThirdAiCommentRegenerating(true);
                            approveTimersRef.current.push(setTimeout(() => {
                              const nextIndex = (thirdAiCommentIndex + 1) % Math.max(dbResponses.length, 1);
                              setThirdAiCommentIndex(nextIndex);
                              setThirdAiComment(dbResponses[nextIndex] ?? dbResponses[2] ?? "");
                              setThirdAiCommentApproved(null);
                              setThirdAiCommentRegenerating(false);
                            }, 1800));
                          }}
                          className="flex-1 rounded-lg border border-[#D0D5DD] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#344054] hover:bg-[#F2F4F7] transition-colors"
                        >
                          Generate New
                        </button>
                      </div>
                    )}
                  </div>
                  <img src={jacobAvatar} alt="Jacob avatar" className="shrink-0 mt-0.5 h-7 w-7 rounded-full object-cover" />
                </div>
              ) : undefined;

              const secondAiResponseBubble = showSecondCard ? (
                <div className="px-4 py-3 flex items-start gap-2">
                  <div className="flex-1 rounded-xl border border-[#166CCA] bg-[#EBF4FD] p-3 space-y-2.5">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3 text-[#166CCA]" />
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1260B0]">AI Next Response</p>
                    </div>
                    <textarea
                      value={secondAiComment}
                      onChange={(e) => { setSecondAiComment(e.target.value); setSecondAiCommentApproved(null); }}
                      rows={4}
                      className="w-full resize-none rounded-lg border border-[#BFDBFE] bg-white px-3 py-2.5 text-[12px] text-[#344054] leading-relaxed outline-none focus:border-[#166CCA] focus:ring-1 focus:ring-[#166CCA] transition-colors"
                    />
                    {secondAiCommentRegenerating ? (
                      <div className="flex items-center gap-2 rounded-lg bg-[#EBF4FD] border border-[#BFDBFE] px-3 py-2">
                        <span className="h-3.5 w-3.5 rounded-full border-2 border-[#BFDBFE] border-t-[#166CCA] animate-spin shrink-0" />
                        <span className="text-[12px] text-[#1260B0] font-medium">Regenerating response…</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSecondAiCommentApproved("approved");
                            const time = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
                            const newMessage = { id: Date.now(), role: "agent" as const, author: caseData.botType, content: secondAiComment, time };
                            setInjectedMessages((prev) => [...prev, newMessage]);
                            setSuperviseScrollTrigger((n) => n + 1);
                            // Sofia replies with her mailing address — typing indicator then reply
                            if (!sofiaAddressInjected) {
                              setSofiaAddressInjected(true);
                              approveTimersRef.current.push(setTimeout(() => {
                                setSofiaTyping(true);
                                setSuperviseScrollTrigger((n) => n + 1);
                                approveTimersRef.current.push(setTimeout(() => {
                                  setSofiaTyping(false);
                                  const sofiaTime = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
                                  setInjectedMessages((prev) => [
                                    ...prev,
                                    {
                                      id: Date.now(),
                                      role: "customer" as const,
                                      content: "Of course. It's 847 Westmont Avenue, Apartment 2C, Chicago, IL 60614.",
                                      time: sofiaTime,
                                    },
                                  ]);
                                  setSuperviseScrollTrigger((n) => n + 1);
                                  // Show thinking placeholder then reveal third card
                                  approveTimersRef.current.push(setTimeout(() => {
                                    setThirdCardReady(true);
                                    setSuperviseScrollTrigger((n) => n + 1);
                                  }, 2200));
                                }, 2500));
                              }, 2500));
                            }
                          }}
                          className="flex-1 rounded-lg bg-[#166CCA] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#1260B0] transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSecondAiCommentRegenerating(true);
                            approveTimersRef.current.push(setTimeout(() => {
                              const nextIndex = (secondAiCommentIndex + 1) % Math.max(dbResponses.length, 1);
                              setSecondAiCommentIndex(nextIndex);
                              setSecondAiComment(dbResponses[nextIndex] ?? dbResponses[1] ?? "");
                              setSecondAiCommentApproved(null);
                              setSecondAiCommentRegenerating(false);
                            }, 1800));
                          }}
                          className="flex-1 rounded-lg border border-[#D0D5DD] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#344054] hover:bg-[#F2F4F7] transition-colors"
                        >
                          Generate New
                        </button>
                      </div>
                    )}
                  </div>
                  <img
                    src="https://cdn.builder.io/api/v1/image/assets%2F9d3d716b4b844ab4bcf3267b33310813%2F9f1a8ec85d5f478b9a015a2b7eece268?format=webp&width=800&height=1200"
                    alt="Jacob avatar"
                    className="shrink-0 mt-0.5 h-7 w-7 rounded-full object-cover"
                  />
                </div>
              ) : undefined;

              // Thinking placeholder — shown while AI is composing after customer replies
              const thinkingBubble = (
                <div className="px-4 py-3 flex items-start gap-2">
                  <div className="flex-1 rounded-xl border border-[#166CCA] bg-[#EBF4FD] p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Sparkles className="h-3 w-3 text-[#166CCA]" />
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1260B0]">AI Next Response</p>
                    </div>
                    <div className="flex items-center gap-1.5 px-1 py-1">
                      <span className="text-[12px] text-[#9CA3AF] italic">Composing response</span>
                      <span className="flex gap-[3px] items-center ml-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#9CA3AF] animate-bounce [animation-delay:0ms]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-[#9CA3AF] animate-bounce [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-[#9CA3AF] animate-bounce [animation-delay:300ms]" />
                      </span>
                    </div>
                  </div>
                  <img
                    src={botAvatar}
                    alt="AI avatar"
                    className="shrink-0 mt-0.5 h-7 w-7 rounded-full object-cover"
                  />
                </div>
              );

              // ── Sofia: Dispute Authorization Card ─────────────────────────────────
              // Shows the summary + dispute steps. Agent approves to run the animation.
              // Bot comment card appears separately after dispute completes.
              const sofiaDisputeAuthCard = showQuickActions && isSofia && !disputeComplete ? (
                <div className="px-4 py-3 flex items-start gap-2">
                  <div className="flex-1 rounded-xl border border-[#166CCA] bg-[#EBF4FD] p-3 space-y-2.5">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3 text-[#166CCA]" />
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1260B0]">Dispute Authorization</p>
                    </div>
                    {/* Summary context */}
                    <p className="text-[12px] text-[#344054] leading-relaxed px-1">
                      Sofia is indicating she did not make these charges and would like to initiate a dispute. Please review the steps below and approve to proceed.
                    </p>

                    {/* Initiate Dispute checkbox — pre-checked */}
                    {true && (
                      <div className="rounded-xl border border-black/[0.06] bg-white overflow-hidden">
                        <div className="flex items-center gap-3 px-3 py-2.5">
                          {/* Checkbox — uncheck to opt out */}
                          <button
                            type="button"
                            disabled={disputeRunning || disputeComplete}
                            onClick={() => {
                              if (disputeRunning || disputeComplete) return;
                              const next = !disputeChecked;
                              setDisputeChecked(next);
                              setDisputeExpanded(next);
                            }}
                            className={cn(
                              "shrink-0 h-[18px] w-[18px] rounded-[5px] border-2 flex items-center justify-center transition-colors",
                              disputeChecked ? "border-[#166CCA] bg-[#166CCA]" : "border-[#D0D5DD] bg-white hover:border-[#166CCA]",
                              (disputeRunning || disputeComplete) && "opacity-60 cursor-not-allowed",
                            )}
                          >
                            {disputeChecked && <Check className="h-2.5 w-2.5 text-white" />}
                          </button>
                          <span className={cn(
                            "flex-1 text-[13px] leading-5 text-[#111827] transition-colors",
                            disputeComplete && "line-through text-[#9CA3AF]",
                          )}>
                            Initiate Dispute
                          </span>
                          {/* Expand/collapse toggle — only when checked and not running */}
                          {disputeChecked && !disputeRunning && !disputeComplete && (
                            <button
                              type="button"
                              onClick={() => setDisputeExpanded((v) => !v)}
                              className="shrink-0 text-[#98A2B3] hover:text-[#166CCA] transition-colors"
                            >
                              <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", disputeExpanded && "rotate-180")} />
                            </button>
                          )}
                        </div>
                        {/* Steps panel — preview when not running, animated when running */}
                        {disputeChecked && disputeExpanded && (
                          <div className="border-t border-black/[0.05] px-3 pb-3 pt-2.5">
                            <div className="flex items-center justify-between mb-2.5">
                              <p className="text-[12px] font-semibold text-[#111827]">
                                {disputeRunning
                                  ? disputePaused ? "Dispute paused" : "Filing Dispute..."
                                  : "Steps that will run on Approve"}
                              </p>
                              {/* Pause / Resume button — only shown while running and not complete */}
                              {disputeRunning && !disputeComplete && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!disputePaused) {
                                      // Pause: clear remaining timers
                                      disputeTimersRef.current.forEach(clearTimeout);
                                      disputeTimersRef.current = [];
                                      setDisputePaused(true);
                                    } else {
                                      // Resume: restart from current step
                                      setDisputePaused(false);
                                      const runStep = (disputeTimersRef as any).runStep;
                                      if (runStep) runStep(disputeStepIndexRef.current);
                                    }
                                  }}
                                  className="flex items-center gap-1 text-[11px] font-semibold text-[#166CCA] hover:text-[#1260B0] transition-colors"
                                >
                                  {disputePaused ? (
                                    <>
                                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                                      Resume
                                    </>
                                  ) : (
                                    <>
                                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                                      Pause
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                            <div className="space-y-2.5">
                              {DISPUTE_STEPS.map((step, stepIdx) => {
                                const isComplete = disputeRunning && stepIdx < disputeStepIndex;
                                const isInProgress = disputeRunning && !disputePaused && stepIdx === disputeStepIndex;
                                const isPausedHere = disputeRunning && disputePaused && stepIdx === disputeStepIndex;
                                return (
                                  <div key={stepIdx} className="flex items-center gap-2.5">
                                    <div className="shrink-0 h-6 w-6 flex items-center justify-center">
                                      {isComplete ? (
                                        <div className="h-6 w-6 rounded-full bg-[#0B9A8A] flex items-center justify-center">
                                          <Check className="h-3.5 w-3.5 text-white" />
                                        </div>
                                      ) : isInProgress ? (
                                        <div className="h-6 w-6 rounded-full border-2 border-[#E5E7EB] border-t-[#0B9A8A] animate-spin" />
                                      ) : isPausedHere ? (
                                        <div className="h-6 w-6 rounded-full border-2 border-[#FFB800] bg-[#FFF6E0] flex items-center justify-center">
                                          <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="#A37A00"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                                        </div>
                                      ) : (
                                        <div className={cn(
                                          "h-6 w-6 rounded-full border-2 flex items-center justify-center",
                                          disputeRunning ? "border-[#E5E7EB]" : "border-[#BFDBFE]",
                                        )}>
                                          {!disputeRunning && <span className="text-[10px] font-semibold text-[#166CCA]">{stepIdx + 1}</span>}
                                        </div>
                                      )}
                                    </div>
                                    <span className={cn(
                                      "text-[12px]",
                                      isComplete ? "text-[#6B7280] line-through"
                                        : (isInProgress || isPausedHere) ? "text-[#111827] font-medium"
                                        : disputeRunning ? "text-[#9CA3AF]"
                                        : "text-[#344054]",
                                    )}>
                                      {step}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                            {disputeComplete && (
                              <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-[#EFFBF1] border border-[#24943E] px-3 py-2">
                                <Check className="h-3.5 w-3.5 text-[#208337]" />
                                <span className="text-[11px] font-semibold text-[#208337]">Dispute successfully initiated — reference #FRD-2159-SM</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Approve / Reject — hidden while dispute is running */}
                    {!disputeRunning && (
                      disputeAltPhase === "thinking" ? (
                        /* ── Reconsidering spinner ── */
                        <div className="flex items-center gap-2.5 py-1">
                          <span className="h-4 w-4 rounded-full border-2 border-[#BFDBFE] border-t-[#166CCA] animate-spin shrink-0" />
                          <span className="text-[12px] text-[#1260B0] font-medium">Reconsidering approach…</span>
                        </div>
                      ) : disputeAltPhase === "ready" ? (
                        /* ── Alternative approach card ── */
                        <div className="rounded-xl border border-[#E4E7EC] bg-white p-3 space-y-3 animate-in fade-in duration-300">
                          <div className="flex items-center gap-1.5">
                            <Sparkles className="h-3 w-3 text-[#1260B0]" />
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1260B0]">Alternative Approach</p>
                          </div>
                          <p className="text-[12px] text-[#344054] leading-relaxed">
                            Understood. As an alternative, I recommend we first place a temporary hold on Sofia's card ****7714 to prevent further unauthorized charges, then initiate a manual fraud review with our specialist team. This gives the fraud team 24 hours to independently verify the transactions before we commit to the full dispute and provisional credit. Shall I proceed with the card hold and escalation to the fraud team?
                          </p>
                          <div className="relative flex gap-2">
                            {disputeRejectPopoverOpen && (
                              <div className="absolute bottom-[calc(100%+8px)] left-0 right-0 z-20 rounded-xl border border-[#E4E7EC] bg-white shadow-[0_8px_24px_rgba(16,24,40,0.12)] overflow-hidden">
                                <div className="px-3 py-2 border-b border-[#F2F4F7]">
                                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#667085]">Reason for rejecting</p>
                                </div>
                                {[
                                  "Still cannot verify the transactions",
                                  "Alternative approach not appropriate",
                                  "Need specialist involvement",
                                  "Risk remains too high",
                                  "Escalate to supervisor",
                                ].map((reason) => (
                                  <button
                                    key={reason}
                                    type="button"
                                    onClick={() => {
                                      setDisputeRejectPopoverOpen(false);
                                      const noteTime = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
                                      setInjectedMessages((prev) => [...prev, { id: Date.now(), role: "agent" as const, content: `Agent rejected alternative approach — Reason: ${reason}`, time: noteTime, isInternal: true }]);
                                      setSuperviseScrollTrigger((n) => n + 1);
                                      setDisputeAltPhase("idle");
                                      setDisputeRejectedReason(null);
                                    }}
                                    className="w-full px-3 py-2.5 text-left text-[13px] text-[#344054] hover:bg-[#F9FAFB] transition-colors"
                                  >
                                    {reason}
                                  </button>
                                ))}
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setDisputeRejectPopoverOpen(false);
                                setDisputeAltPhase("idle");
                                setDisputeRejectedReason(null);
                                setSuperviseScrollTrigger((n) => n + 1);
                                setDisputeRunning(true);
                                setDisputePaused(false);
                                disputeStepIndexRef.current = 0;
                                disputeTimersRef.current.forEach(clearTimeout);
                                disputeTimersRef.current = [];
                                const runStep = (fromStep: number) => {
                                  for (let i = fromStep; i < DISPUTE_STEPS.length; i++) {
                                    const delay = (i - fromStep) * 1200 + 800;
                                    const t = setTimeout(() => {
                                      disputeStepIndexRef.current = i + 1;
                                      setDisputeStepIndex(i + 1);
                                    }, delay);
                                    disputeTimersRef.current.push(t);
                                  }
                                  const doneDelay = (DISPUTE_STEPS.length - fromStep) * 1200 + 800;
                                  const done = setTimeout(() => {
                                    setDisputeComplete(true);
                                    const noteTime = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
                                    setInjectedMessages((prev) => [...prev, { id: Date.now(), role: "agent" as const, content: `Dispute filed — reference #FRD-2159-SM · $2,159 in unauthorized charges submitted for review`, time: noteTime, isInternal: true }]);
                                    setSuperviseScrollTrigger((n) => n + 1);
                                  }, doneDelay);
                                  disputeTimersRef.current.push(done);
                                };
                                (disputeTimersRef as any).runStep = runStep;
                                runStep(0);
                              }}
                              className="flex-1 rounded-lg bg-[#166CCA] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#1260B0] transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => setDisputeRejectPopoverOpen((v) => !v)}
                              className={cn(
                                "flex-1 rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition-colors",
                                disputeRejectPopoverOpen
                                  ? "border-[#D0D5DD] bg-[#F2F4F7] text-[#344054]"
                                  : "border-[#D0D5DD] bg-white text-[#344054] hover:bg-[#F2F4F7]",
                              )}
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* ── Default: original Approve / Reject ── */
                        <div className="relative flex gap-2">
                          {disputeRejectPopoverOpen && (
                            <div className="absolute bottom-[calc(100%+8px)] left-0 right-0 z-20 rounded-xl border border-[#E4E7EC] bg-white shadow-[0_8px_24px_rgba(16,24,40,0.12)] overflow-hidden">
                              <div className="px-3 py-2 border-b border-[#F2F4F7]">
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#667085]">Reason for rejecting</p>
                              </div>
                              {[
                                "Cannot verify the transactions",
                                "Incorrect dispute amount",
                                "Need more customer verification",
                                "Risk is too high",
                                "Requires manual review",
                              ].map((reason) => (
                                <button
                                  key={reason}
                                  type="button"
                                  onClick={() => {
                                    setDisputeRejectPopoverOpen(false);
                                    setDisputeRejectedReason(reason);
                                    // Inject internal note
                                    const noteTime = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
                                    setInjectedMessages((prev) => [...prev, { id: Date.now(), role: "agent" as const, content: `Agent rejected dispute authorization — Reason: ${reason}`, time: noteTime, isInternal: true }]);
                                    setSuperviseScrollTrigger((n) => n + 1);
                                    // Show reconsidering spinner then alternative approach
                                    setDisputeAltPhase("thinking");
                                    approveTimersRef.current.push(setTimeout(() => {
                                      setDisputeAltPhase("ready");
                                      setSuperviseScrollTrigger((n) => n + 1);
                                    }, 2000));
                                  }}
                                  className="w-full px-3 py-2.5 text-left text-[13px] text-[#344054] hover:bg-[#F9FAFB] transition-colors"
                                >
                                  {reason}
                                </button>
                              ))}
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setDisputeRejectPopoverOpen(false);
                              setSuperviseScrollTrigger((n) => n + 1);
                              if (disputeChecked) {
                                setDisputeRunning(true);
                                setDisputePaused(false);
                                disputeStepIndexRef.current = 0;
                                disputeTimersRef.current.forEach(clearTimeout);
                                disputeTimersRef.current = [];
                                const runStep = (fromStep: number) => {
                                  for (let i = fromStep; i < DISPUTE_STEPS.length; i++) {
                                    const delay = (i - fromStep) * 1200 + 800;
                                    const t = setTimeout(() => {
                                      disputeStepIndexRef.current = i + 1;
                                      setDisputeStepIndex(i + 1);
                                    }, delay);
                                    disputeTimersRef.current.push(t);
                                  }
                                  const doneDelay = (DISPUTE_STEPS.length - fromStep) * 1200 + 800;
                                  const done = setTimeout(() => {
                                    setDisputeComplete(true);
                                    const noteTime = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
                                    setInjectedMessages((prev) => [...prev, { id: Date.now(), role: "agent" as const, content: `Dispute filed — reference #FRD-2159-SM · $2,159 in unauthorized charges submitted for review`, time: noteTime, isInternal: true }]);
                                    setSuperviseScrollTrigger((n) => n + 1);
                                  }, doneDelay);
                                  disputeTimersRef.current.push(done);
                                };
                                (disputeTimersRef as any).runStep = runStep;
                                runStep(0);
                              } else {
                                setDisputeComplete(true);
                              }
                            }}
                            className="flex-1 rounded-lg bg-[#166CCA] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#1260B0] transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => setDisputeRejectPopoverOpen((v) => !v)}
                            className={cn(
                              "flex-1 rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition-colors",
                              disputeRejectPopoverOpen
                                ? "border-[#D0D5DD] bg-[#F2F4F7] text-[#344054]"
                                : "border-[#D0D5DD] bg-white text-[#344054] hover:bg-[#F2F4F7]",
                            )}
                          >
                            Reject
                          </button>
                        </div>
                      )
                    )}
                  </div>
                  <img
                    src={jacobAvatar}
                    alt="Jacob avatar"
                    className="shrink-0 mt-0.5 h-7 w-7 rounded-full object-cover"
                  />
                </div>
              ) : undefined;

              // ── Sofia: Bot Comment Card ──────────────────────────────────────────────
              // Appears after dispute animation completes. Agent reviews/edits Jacob's message then approves.
              // Approve injects the message and starts Sofia's reply sequence.
              const sofiaBotCommentCard = showQuickActions && isSofia && disputeComplete && aiCommentApproved !== "approved" ? (
                <div className="px-4 py-3 flex items-start gap-2">
                  <div className="flex-1 rounded-xl border border-[#166CCA] bg-[#EBF4FD] p-3 space-y-2.5">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3 text-[#166CCA]" />
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1260B0]">AI Next Response</p>
                    </div>
                    <textarea
                      value={aiComment}
                      onChange={(e) => { setAiComment(e.target.value); setAiCommentApproved(null); }}
                      rows={5}
                      className="w-full resize-none rounded-lg border border-[#BFDBFE] bg-white px-3 py-2.5 text-[12px] text-[#344054] leading-relaxed outline-none focus:border-[#166CCA] focus:ring-1 focus:ring-[#166CCA] transition-colors"
                    />
                    {aiCommentRegenerating ? (
                      <div className="flex items-center gap-2 rounded-lg bg-[#EBF4FD] border border-[#BFDBFE] px-3 py-2">
                        <span className="h-3.5 w-3.5 rounded-full border-2 border-[#BFDBFE] border-t-[#166CCA] animate-spin shrink-0" />
                        <span className="text-[12px] text-[#1260B0] font-medium">Regenerating response…</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            // Bot comment approved — inject bot's message then start Sofia reply sequence
                            setAiCommentApproved("approved");
                            const time = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
                            setInjectedMessages((prev) => [...prev, { id: Date.now(), role: "agent" as const, author: caseData.botType, content: aiComment, time }]);
                            setLastApprovedMsgCount(allMessages.length + 1);
                            setSuperviseScrollTrigger((n) => n + 1);
                            // Start Sofia reply chain
                            approveTimersRef.current.push(setTimeout(() => {
                              setSofiaTyping(true);
                              setSuperviseScrollTrigger((n) => n + 1);
                              approveTimersRef.current.push(setTimeout(() => {
                                setSofiaTyping(false);
                                const sofiaTme = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
                                setInjectedMessages((prev) => [...prev, {
                                  id: Date.now(), role: "customer" as const,
                                  content: "Okay, thank you. I appreciate you taking this seriously. I just need this resolved today — my rent is due tomorrow and I can't afford to be short. Please keep me updated.",
                                  time: sofiaTme, sentiment: "positive" as const,
                                }]);
                                setSofiaFirstReplyVisible(true);
                                setSuperviseScrollTrigger((n) => n + 1);
                                // Sofia proactively provides her mailing address
                                approveTimersRef.current.push(setTimeout(() => {
                                  setSofiaTyping(true);
                                  setSuperviseScrollTrigger((n) => n + 1);
                                  approveTimersRef.current.push(setTimeout(() => {
                                    setSofiaTyping(false);
                                    const addrTime = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
                                    setInjectedMessages((prev) => [...prev, {
                                      id: Date.now(), role: "customer" as const,
                                      content: "Also — if you need my mailing address for the replacement card, it's 847 Westmont Avenue, Apartment 2C, Chicago, IL 60614.",
                                      time: addrTime,
                                    }]);
                                    setSofiaAddressInjected(true);
                                    setSuperviseScrollTrigger((n) => n + 1);
                                    approveTimersRef.current.push(setTimeout(() => {
                                      setThirdCardReady(true);
                                      setSuperviseScrollTrigger((n) => n + 1);
                                    }, 2200));
                                  }, 2000));
                                }, 2000));
                              }, 2500));
                            }, 2000));
                          }}
                          className="flex-1 rounded-lg bg-[#166CCA] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#1260B0] transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAiCommentRegenerating(true);
                            approveTimersRef.current.push(setTimeout(() => {
                              const nextIndex = (aiCommentIndex + 1) % Math.max(dbResponses.length, 1);
                              setAiCommentIndex(nextIndex);
                              setAiComment(dbResponses[nextIndex] ?? dbResponses[0] ?? "");
                              setAiCommentApproved(null);
                              setAiCommentRegenerating(false);
                            }, 1800));
                          }}
                          className="flex-1 rounded-lg border border-[#D0D5DD] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#344054] hover:bg-[#F2F4F7] transition-colors"
                        >
                          Generate New
                        </button>
                      </div>
                    )}
                  </div>
                  <img src={jacobAvatar} alt="Jacob avatar" className="shrink-0 mt-0.5 h-7 w-7 rounded-full object-cover" />
                </div>
              ) : undefined;

              // ── Jordan / non-Sofia: Regular editable card ─────────────────────────
              const aiNextResponseBubble = showQuickActions && !isSofia && aiCommentApproved !== "approved" ? (
                <div className="px-4 py-3 flex items-start gap-2">
                  <div className="flex-1 rounded-xl border border-[#166CCA] bg-[#EBF4FD] p-3 space-y-2.5">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3 text-[#166CCA]" />
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1260B0]">AI Next Response</p>
                    </div>
                    <textarea
                      value={aiComment}
                      onChange={(e) => { setAiComment(e.target.value); setAiCommentApproved(null); }}
                      rows={5}
                      className="w-full resize-none rounded-lg border border-[#BFDBFE] bg-white px-3 py-2.5 text-[12px] text-[#344054] leading-relaxed outline-none focus:border-[#166CCA] focus:ring-1 focus:ring-[#166CCA] transition-colors"
                    />
                    {aiCommentRegenerating ? (
                      <div className="flex items-center gap-2 rounded-lg bg-[#EBF4FD] border border-[#BFDBFE] px-3 py-2">
                        <span className="h-3.5 w-3.5 rounded-full border-2 border-[#BFDBFE] border-t-[#166CCA] animate-spin shrink-0" />
                        <span className="text-[12px] text-[#1260B0] font-medium">Regenerating response…</span>
                      </div>
                    ) : aiCommentApproved === "approved" ? null : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setAiCommentApproved("approved");
                            const time = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
                            setInjectedMessages((prev) => [...prev, { id: Date.now(), role: "agent" as const, author: caseData.botType, content: aiComment, time }]);
                            setLastApprovedMsgCount(allMessages.length + 1);
                          }}
                          className="flex-1 rounded-lg bg-[#166CCA] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#1260B0] transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAiCommentRegenerating(true);
                            approveTimersRef.current.push(setTimeout(() => {
                              const nextIndex = (aiCommentIndex + 1) % Math.max(dbResponses.length, 1);
                              setAiCommentIndex(nextIndex);
                              setAiComment(dbResponses[nextIndex] ?? dbResponses[0] ?? "");
                              setAiCommentApproved(null);
                              setAiCommentRegenerating(false);
                            }, 1800));
                          }}
                          className="flex-1 rounded-lg border border-[#D0D5DD] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#344054] hover:bg-[#F2F4F7] transition-colors"
                        >
                          Generate New
                        </button>
                      </div>
                    )}
                  </div>
                  <img
                    src={botAvatar}
                    alt={`${caseData.botType ?? "AI"} avatar`}
                    className="shrink-0 mt-0.5 h-7 w-7 rounded-full object-cover"
                  />
                </div>
              ) : undefined;

              // ── "Great job" resolved note — appears inline after the 5-star message ──
              const resolvedNoteInlineCard = !showQuickActions && showResolvedMessage ? (
                <div className="px-4 py-3 flex items-start gap-2">
                  <div className="flex-1 rounded-xl border border-[#BFDBFE] bg-[#EBF4FD] p-4 space-y-3">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3 text-[#1260B0]" />
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1260B0]">
                        Internal Note · {caseData.botType}
                      </p>
                    </div>
                    <p className="text-[13px] font-medium leading-5 text-[#344054]">
                      Wow! Great job, Jeff! Looks like we have another happy customer. I've updated the case to resolved!
                    </p>
                    {/* Case Status dropdown */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setResolvedInlineStatusOpen((v) => !v)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-lg border px-3 py-2 transition-colors",
                          resolvedInlineStatus === "Resolved" ? "border-[#24943E] bg-[#EFFBF1]" :
                          resolvedInlineStatus === "Pending"  ? "border-[#FFB800] bg-[#FFF6E0]" :
                          resolvedInlineStatus === "Escalated"? "border-[#E53935] bg-[#FDEAEA]" :
                                                               "border-[#BFDBFE] bg-white",
                        )}
                      >
                        <span className={cn("text-[11px] font-semibold uppercase tracking-widest",
                          resolvedInlineStatus === "Resolved" ? "text-[#208337]" :
                          resolvedInlineStatus === "Pending"  ? "text-[#A37A00]" :
                          resolvedInlineStatus === "Escalated"? "text-[#C71D1A]" : "text-[#166CCA]",
                        )}>Case Status</span>
                        <div className="flex items-center gap-1.5">
                          <div className={cn("h-2 w-2 rounded-full",
                            resolvedInlineStatus === "Resolved" ? "bg-[#208337]" :
                            resolvedInlineStatus === "Pending"  ? "bg-[#FFB800]" :
                            resolvedInlineStatus === "Escalated"? "bg-[#E32926]" : "bg-[#166CCA]",
                          )} />
                          <span className={cn("text-[12px] font-semibold",
                            resolvedInlineStatus === "Resolved" ? "text-[#208337]" :
                            resolvedInlineStatus === "Pending"  ? "text-[#A37A00]" :
                            resolvedInlineStatus === "Escalated"? "text-[#C71D1A]" : "text-[#166CCA]",
                          )}>{resolvedInlineStatus}</span>
                          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform",
                            resolvedInlineStatus === "Resolved" ? "text-[#208337]" :
                            resolvedInlineStatus === "Pending"  ? "text-[#A37A00]" :
                            resolvedInlineStatus === "Escalated"? "text-[#C71D1A]" : "text-[#166CCA]",
                            resolvedInlineStatusOpen && "rotate-180",
                          )} />
                        </div>
                      </button>
                      {resolvedInlineStatusOpen && (
                        <div className="absolute bottom-[calc(100%+4px)] left-0 right-0 z-30 rounded-xl border border-[#E4E7EC] bg-white shadow-[0_8px_24px_rgba(16,24,40,0.12)] overflow-hidden">
                          {[
                            { label: "Resolved",  dot: "bg-[#208337]", text: "text-[#208337]" },
                            { label: "Open",      dot: "bg-[#166CCA]", text: "text-[#166CCA]" },
                            { label: "Pending",   dot: "bg-[#FFB800]", text: "text-[#A37A00]" },
                            { label: "Escalated", dot: "bg-[#E32926]", text: "text-[#C71D1A]" },
                          ].map(({ label, dot, text }) => (
                            <button
                              key={label}
                              type="button"
                              onClick={() => { setResolvedInlineStatus(label); setResolvedInlineStatusOpen(false); }}
                              className="flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-[#F9FAFB] transition-colors"
                            >
                              <span className={cn("h-2 w-2 rounded-full shrink-0", dot)} />
                              <span className={cn("text-[13px] font-medium", text)}>{label}</span>
                              {resolvedInlineStatus === label && (
                                <Check className="ml-auto h-3.5 w-3.5 text-[#166CCA]" />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Dismiss button */}
                    <button
                      type="button"
                      onClick={handleClose}
                      className="w-full rounded-lg border border-[#D0D5DD] bg-white px-3 py-2 text-[12px] font-semibold text-[#344054] hover:bg-[#F9FAFB] transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                  <img src={botAvatar} alt={`${caseData.botType} avatar`} className="shrink-0 mt-0.5 h-7 w-7 rounded-full object-cover" />
                </div>
              ) : undefined;

              return (
                <ConversationPanel
                  key={caseData.id}
                  draftKey={`escalated-modal-${caseData.id}`}
                  conversation={conversation}
                  activeChannel={channel}
                  openChannels={[channel]}
                  customerId={caseData.customerRecordId}
                  showAiPanel={false}
                  hideTranscript={false}
                  hideInput={true}
                  isPendingAcceptance={true}
                  onSelectChannel={() => {}}
                  onConversationChange={() => {}}
                  agentAvatarUrl={botAvatar}
                  appendContent={
                    !showQuickActions
                      ? undefined
                      : (sofiaDisputeAuthCard ??
                         sofiaBotCommentCard ??
                         (showThinkingThird ? thinkingBubble : thirdActionAuthBubble) ??
                         (showThinkingBetweenActions ? thinkingBubble : thirdBotCommentBubble) ??
                         aiNextResponseBubble)
                  }
                  scrollToBottomTrigger={superviseScrollTrigger}
                />
              );
            })()}
          </div>

        </div>

        {/* ── Full-width footer ── */}
        <div
          className={cn(
            "shrink-0 border-t px-5 py-3 flex items-center justify-between gap-3 transition-colors duration-200",
            showQuickActions
              ? "border-[#FEC84B]/60 bg-[#FFFCF0]"
              : "border-border bg-[#F9FAFB]",
          )}
        >
          {/* Supervise mode alert — left side, only visible when active */}
          {showQuickActions ? (
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FEC84B]/25">
                <AlertTriangle className="h-3.5 w-3.5 text-[#B54708]" />
              </div>
              <div>
                <p className="text-[12px] font-semibold text-[#B54708] leading-tight">Monitoring this conversation</p>
                <p className="text-[11px] text-[#92400E]/70 leading-tight">You are monitoring the AI agent in real time</p>
              </div>
            </div>
          ) : (
            <div />
          )}

          {/* Right-side actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowQuickActions((v) => {
                if (!v) {
                  setAiCommentApproved(null);
                  setSofiaFirstReplyVisible(false);
                  setSofiaAddressInjected(false);
                  setSecondCardReady(false);
                  setThirdCardReady(false);
                  setSofiaTyping(false);
                  setSuperviseScrollTrigger((n) => n + 1);
                }
                return !v;
              })}
              className={cn(
                "rounded-lg border px-3.5 py-1.5 text-[12px] font-medium transition-colors",
                showQuickActions
                  ? "border-[#FEC84B] bg-[#FEF3C7] text-[#B54708] hover:bg-[#FDE68A]"
                  : "border-border bg-white text-[#344054] hover:bg-[#F2F4F7]",
              )}
            >
              {showQuickActions ? <><CircleStop className="inline h-3.5 w-3.5 mr-1.5 -mt-px" />Stop Monitoring</> : "Monitor"}
            </button>
            <button
              ref={transferBtnRef}
              type="button"
              onClick={() => {
                const rect = transferBtnRef.current?.getBoundingClientRect();
                if (rect) setTransferTriggerRect(rect);
              }}
              className="rounded-lg border border-border bg-white px-3.5 py-1.5 text-[12px] font-medium text-[#344054] hover:bg-[#F2F4F7] transition-colors"
            >
              Transfer
            </button>
            <button
              type="button"
              onClick={() => {
                const channel = (caseData.channel === "sms" ? "sms" : "chat") as "chat" | "sms";
                const base = caseData.customerRecordId
                  ? createConversationState(caseData.customerRecordId, channel, caseData.botType === "Jacob" ? "Jacob" : caseData.botType === "Emily" ? "Emily" : "Aria")
                  : { customerName: caseData.name, label: "Chat", timelineLabel: "", status: "open" as const, draft: "", messages: [], isCustomerTyping: false };
                const fullConversation = injectedMessages.length > 0
                  ? { ...base, messages: [...base.messages, ...injectedMessages] }
                  : base;
                onTakeover(fullConversation, localStatus, localPriority);
              }}
              className="rounded-lg bg-[#E53935] px-4 py-1.5 text-[12px] font-semibold text-white hover:bg-[#C71D1A] transition-colors"
            >
              Takeover
            </button>
          </div>
        </div>

      </div>

      {transferTriggerRect && (
        <TransferPopover
          priority={caseData.priority}
          preview={caseData.preview}
          triggerRect={transferTriggerRect}
          onClose={() => setTransferTriggerRect(null)}
          onAssign={() => {
            setTransferTriggerRect(null);
            onTransfer();
          }}
        />
      )}
    </div>,
    document.body,
  );
}
