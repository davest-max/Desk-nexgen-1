import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, AudioLines, Bot, Check, ChevronDown, ChevronLeft, ChevronRight, Loader2, MoreHorizontal, NotebookPen, Paperclip, Pause, Play, Plus, Send, SlidersHorizontal, Ticket, Trash2, X } from "lucide-react";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { conversationChannelOptions } from "@/components/ConversationChannelToggleGroup";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { getRelevantCustomerTicket, type CustomerTicket } from "@/components/NotesPanel";
import { VoiceAIGuidanceCard, VoiceGuidancePanel } from "@/components/VoiceGuidanceContent";
import { getCustomerRecord, type CustomerChannel } from "@/lib/customer-database";
import { getCustomerAssignmentEntry } from "@/lib/customer-assignment-tasks";
import { cn } from "@/lib/utils";

export type ConversationMessage = {
  id: number;
  role: "customer" | "agent";
  content: string;
  time: string;
  channel?: CustomerChannel;
  sentiment?: "frustrated" | "critical" | "positive";
  isInternal?: boolean;
  ticket?: CustomerTicket;
  /**
   * When set, identifies the bot (e.g. "Jacob", "Aria", "Emily") that originally sent
   * this message before a human agent took over. The bot's avatar is shown instead of
   * the human agent's avatar.
   */
  author?: string;
  /**
   * When true, renders as the green "handoff notice" card (internal agent-only notification
   * that the assignment has been transferred). Treated as internal — not visible to customer.
   */
  isHandoffCard?: boolean;
  /**
   * When true, this message is part of the agent handoff sequence (warm farewell + internal
   * context card) and should be hidden while the case is in review/pending-acceptance mode.
   */
  isHandoffMessage?: boolean;
};

export type ConversationStatus = "open" | "pending";

export type SharedConversationData = {
  customerName: string;
  label: string;
  timelineLabel: string;
  status: ConversationStatus;
  draft: string;
  messages: ConversationMessage[];
  isCustomerTyping?: boolean;
};

interface ConversationPanelProps {
  conversation: SharedConversationData;
  openChannels: CustomerChannel[];
  activeChannel: CustomerChannel;
  draftKey: string;
  className?: string;
  customerId?: string;
  onConversationChange?: (conversation: SharedConversationData, channel?: CustomerChannel) => void;
  onSelectChannel: (channel: CustomerChannel) => void;
  onOpenDeskPanel?: (selection?: { initialTab?: string; ticketId?: string }) => void;
  onResolveAssignment?: () => void;
  showAiPanel?: boolean;
  hideTranscript?: boolean;
  /** When true, hides the reply input footer and suggested next steps (e.g. monitor mode). */
  hideInput?: boolean;
  performAllActionsKey?: number;
  isPendingAcceptance?: boolean;
  onAcceptAssignment?: () => void;
  /** True when the containing panel is ≥1280px wide — used to center conversation content. */
  isWidePanel?: boolean;
  /** Called whenever the agentTasks list changes length, so the parent can show/hide the portal slot. */
  onAgentTasksChange?: (hasTasks: boolean) => void;
  /** When provided, shows this image as the agent avatar instead of initials on agent messages. */
  agentAvatarUrl?: string;
  /** Optional content rendered at the very end of the messages scroll area (inside the scroll container). */
  appendContent?: React.ReactNode;
  /** Increment this value to force a scroll-to-bottom (e.g. when appendContent is shown). */
  scrollToBottomTrigger?: number;
  /** When true, hides the AI-generated "Suggested Next Steps" task list entirely. */
  suppressAgentTasks?: boolean;
  /** When set, overrides/injects a suggested reply into the AI suggestion panel (used for custom post-action responses). */
  forcedSuggestedReply?: string | null;
  /** When set, replaces the auto-generated suggestion carousel variants with these custom cards. */
  forcedSuggestionVariants?: InlineSuggestion[] | null;
  /** Extra padding (px) added to the top of the scroll area — used to clear floating tab bars. */
  scrollTopPadding?: number;
  /** AI confidence score (0–100) for the pending handoff — shown inline when isPendingAcceptance=true. */
  aiConfidence?: number;
  /** Short reason text below the confidence bar. */
  aiConfidenceReason?: string;
  /** Name of the bot agent (e.g. "Aria", "Jacob", "Emily") for the inline review card avatar. */
  botLabel?: string;
  /** Context summary from the bot for the inline review card. */
  customerContext?: string;
  /** When set, shows AI-suggested opening lines at the top of a voice call conversation. */
  voiceOpeningLines?: Array<{ intro: string; question: string }> | null;
  /** Optional content injected at the very top of the voice call content area (above opening lines). */
  voiceTopContent?: React.ReactNode;
  /** Optional panel rendered to the right of the voice conversation (like Event Detail). */
  voiceRightPanel?: React.ReactNode;
  /** Optional overlay rendered absolutely in the top-right of the voice conversation area. */
  voiceContentOverlay?: React.ReactNode;
  /** Called when the agent clicks one of the opening lines (e.g. to start a demo script). */
  onVoiceOpeningLineClick?: () => void;
}

const conversationFooterMenuItems = [
  "Add files or photos",
  "Take a screenshot",
  "Add to project",
] as const;

const conversationFooterSecondaryMenuItems = [
  "Web search",
  "Connect Supervisor",
  "Add connectors",
] as const;

function formatConversationTimestamp(date: Date) {
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getConversationChannelLabel(channel: CustomerChannel) {
  return conversationChannelOptions.find((option) => option.channel === channel)?.label ?? channel;
}

function formatConversationMessageTimestamp(time: string) {
  return `Today, ${time.replace(/\s/g, "")}`;
}

function isScrolledToBottom(viewport: HTMLDivElement) {
  return viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight <= 24;
}

export type InlineSuggestion = {
  summary: string;
  suggestedReply: string;
};

type SuggestionAction = {
  id: string;
  label: string;
  initialTab?: string;
  ticketId?: string;
  ticket?: CustomerTicket;
};

const MESSAGE_TAG_DEFS = [
  {
    id: "complaint",
    label: "Complaint",
    activeClass: "bg-[#FDEAEA] text-[#C71D1A] border-[#E53935]",
    ghostClass: "bg-white text-[#98A2B3] border-[#E4E7EC] hover:bg-[#FDEAEA] hover:text-[#C71D1A] hover:border-[#E53935]",
  },
  {
    id: "help",
    label: "Help",
    activeClass: "bg-[#EEF4FF] text-[#3538CD] border-[#C7D7FD]",
    ghostClass: "bg-white text-[#98A2B3] border-[#E4E7EC] hover:bg-[#EEF4FF] hover:text-[#3538CD] hover:border-[#C7D7FD]",
  },
  {
    id: "praise",
    label: "Praise",
    activeClass: "bg-[#EFFBF1] text-[#208337] border-[#24943E]",
    ghostClass: "bg-white text-[#98A2B3] border-[#E4E7EC] hover:bg-[#EFFBF1] hover:text-[#208337] hover:border-[#24943E]",
  },
  {
    id: "share",
    label: "Share",
    activeClass: "bg-[#F9F5FF] text-[#1260B0] border-[#E9D7FE]",
    ghostClass: "bg-white text-[#98A2B3] border-[#E4E7EC] hover:bg-[#F9F5FF] hover:text-[#1260B0] hover:border-[#E9D7FE]",
  },
] as const;

type AgentTask = {
  id: string;
  label: string;
};

const TASK_COMPLETION_NOTES: Record<string, string> = {
  "create-ticket": "ADP ticket created",
  "update-salesforce": "Salesforce record updated",
  "send-coupon": "Discount coupon email sent",
  "escalate": "Escalated to supervisor",
  "callback": "Callback scheduled",
  "upgrade-beverage-package": "Beverage package upgraded",
  "confirm-credit-line": "Credit line confirmed",
  "set-resolved": "Case resolved",
};

const TASK_COMPLETION_REPLIES: Record<string, string> = {
  "create-ticket": "I've created a support ticket for you and it's been assigned to our queue. Is there anything else I can help you with in the meantime?",
  "update-salesforce": "I've updated your account record on our end. Is there anything else I can help you with?",
  "send-coupon": "I've sent a discount coupon to your email address on file. Is there anything else I can do for you?",
  "escalate": "I've escalated this to a supervisor who will be with you shortly. Is there anything else you need while you wait?",
  "callback": "I've scheduled a callback for you. You'll receive a confirmation shortly. Is there anything else I can help you with?",
  "upgrade-beverage-package": "I've processed the upgrade to your beverage package. You should receive a confirmation email shortly.",
  "confirm-credit-line": "I've confirmed your credit line details. Everything looks good on our end.",
  "set-resolved": "Thank you so much for reaching out! I'm glad we could help. Have a great day!",
};

const TASK_ACTION_TITLES: Record<string, string> = {
  "create-ticket": "Creating ADP Ticket...",
  "update-salesforce": "Creating Salesforce Record...",
  "send-coupon": "Sending Discount Coupon...",
  "escalate": "Escalating to Supervisor...",
  "callback": "Scheduling Callback...",
  "upgrade-beverage-package": "Upgrading Beverage Package...",
  "confirm-credit-line": "Confirming Credit Line...",
  "set-resolved": "Resolving Case...",
  "initiate-dispute": "Initiating Dispute...",
  "issue-temp-credit": "Applying Temporary Credit...",
  "issue-replacement-card": "Issuing Replacement Card...",
};

const TASK_STEPS: Record<string, string[]> = {
  "create-ticket": [
    "Searching for customer ID",
    "Pulling conversation history",
    "Creating ADP ticket record",
    "Assigning to support queue",
  ],
  "update-salesforce": [
    "Searching for customer ID",
    "Processing updating payment amount",
    "Emailing confirmation to customer",
  ],
  "send-coupon": [
    "Looking up customer email",
    "Generating discount code",
    "Sending coupon email to customer",
  ],
  "escalate": [
    "Finding available supervisor",
    "Transferring conversation notes",
    "Notifying supervisor",
  ],
  "callback": [
    "Checking agent availability",
    "Creating callback appointment",
    "Sending confirmation to customer",
  ],
  "upgrade-beverage-package": [
    "Checking current package tier",
    "Verifying upgrade eligibility",
    "Processing package change",
    "Sending confirmation to customer",
  ],
  "confirm-credit-line": [
    "Pulling account credit details",
    "Verifying authorisation status",
    "Confirming credit line terms",
  ],
  "set-resolved": [
    "Closing conversation thread",
    "Updating case status",
    "Removing from queue",
  ],
  "initiate-dispute": [
    "Verifying account and transaction details",
    "Filing dispute for $2,159 in unauthorized charges",
    "Issuing provisional credit to account",
    "Sending dispute confirmation to customer",
  ],
  "issue-temp-credit": [
    "Verifying account balance",
    "Applying provisional credit of $2,159",
    "Logging credit memo to case record",
    "Notifying customer via email",
  ],
  "issue-replacement-card": [
    "Permanently blocking compromised card",
    "Generating replacement card number",
    "Scheduling delivery to address on file",
    "Sending tracking confirmation to customer",
  ],
};

// Maps natural-language copilot requests to known task IDs.
const COPILOT_TASK_MATCHERS: Array<{ keywords: string[]; task: AgentTask }> = [
  { keywords: ["ticket", "case", "adp", "support ticket", "create ticket", "open ticket"], task: { id: "create-ticket", label: "Create ADP Ticket" } },
  { keywords: ["salesforce", "crm", "record", "account", "update salesforce"], task: { id: "update-salesforce", label: "Update Salesforce Record" } },
  { keywords: ["coupon", "discount", "voucher", "promo", "send coupon"], task: { id: "send-coupon", label: "Send Discount Coupon" } },
  { keywords: ["escalat", "supervisor", "manager", "escalate"], task: { id: "escalate", label: "Escalate to Supervisor" } },
  { keywords: ["callback", "call back", "schedule call", "schedule callback"], task: { id: "callback", label: "Schedule Callback" } },
];

function matchCopilotInput(input: string): AgentTask | null {
  const lower = input.toLowerCase();
  for (const { keywords, task } of COPILOT_TASK_MATCHERS) {
    if (keywords.some((k) => lower.includes(k))) return task;
  }
  return null;
}

function getSuggestedAgentTasks(conversation: SharedConversationData, latestCustomerMessage: ConversationMessage | null): AgentTask[] {
  // Marcus Webb uses a custom resolve box — suppress generic tasks entirely
  if (conversation.customerName === "Marcus Webb") return [];

  // Always use per-customer entry if available
  const entryEarly = latestCustomerMessage ? null : getCustomerAssignmentEntry(conversation.customerName);
  if (entryEarly) return entryEarly.suggestedActions;

  // If no customer message yet, return universal fallback tasks
  if (!latestCustomerMessage) {
    return [
      { id: "update-case-record", label: "Update Case Record" },
      { id: "set-resolved", label: "Set Case to Resolved" },
    ];
  }

  // Prefer per-customer database entry for unique, context-specific suggested actions.
  const entry = getCustomerAssignmentEntry(conversation.customerName);
  if (entry) return entry.suggestedActions;

  // Fallback: keyword-based generic tasks.
  const allContent = conversation.messages.map((m) => m.content).join(" ").toLowerCase();
  const tasks: AgentTask[] = [];

  if (["ticket", "case", "error", "retry", "blocked", "declined", "failed", "issue", "problem"].some((k) => allContent.includes(k))) {
    tasks.push({ id: "create-ticket", label: "Create ADP Ticket" });
  }

  if (["account", "billing", "payment", "record", "status", "profile", "update", "crm", "salesforce"].some((k) => allContent.includes(k))) {
    tasks.push({ id: "update-salesforce", label: "Update Salesforce Record" });
  }

  if (["discount", "coupon", "compensation", "charged twice", "double charge", "trouble", "frustrated", "inconvenience", "sorry", "billing"].some((k) => allContent.includes(k))) {
    tasks.push({ id: "send-coupon", label: "Send Discount Coupon" });
  }

  if (["supervisor", "escalate", "manager", "speak to someone", "call me"].some((k) => allContent.includes(k))) {
    tasks.push({ id: "escalate", label: "Escalate to Supervisor" });
  }

  if (["callback", "call back", "schedule", "appointment", "call me"].some((k) => allContent.includes(k))) {
    tasks.push({ id: "callback", label: "Schedule Callback" });
  }

  const latestContent = latestCustomerMessage.content.toLowerCase();
  if (["thank you", "thanks", "that's great", "that was helpful", "resolved", "satisfied", "happy", "all set", "appreciate", "perfect", "wonderful", "great help", "problem solved", "sorted"].some((k) => latestContent.includes(k))) {
    tasks.push({ id: "set-resolved", label: "Set Case to Resolved" });
  }

  // Always ensure at least two tasks — universal fallbacks fill any gaps
  if (!tasks.some((t) => t.id === "update-case-record")) {
    tasks.push({ id: "update-case-record", label: "Update Case Record" });
  }
  if (!tasks.some((t) => t.id === "set-resolved")) {
    tasks.push({ id: "set-resolved", label: "Set Case to Resolved" });
  }

  return tasks;
}

function getSuggestionVariant<T>(variants: T[], refreshKey: number) {
  return variants[((refreshKey % variants.length) + variants.length) % variants.length];
}

function applySuggestionEdit(
  suggestion: InlineSuggestion,
  instruction: string,
  conversation: SharedConversationData,
): InlineSuggestion {
  const normalizedInstruction = instruction.trim().toLowerCase();
  const customerFirstName = conversation.customerName.split(" ")[0] ?? conversation.customerName;
  const updateClauses: string[] = [];
  const replyClauses: string[] = [];

  if (normalizedInstruction.includes("attachment") || normalizedInstruction.includes("file") || normalizedInstruction.includes("screenshot")) {
    updateClauses.push("mention that the customer can attach a file or screenshot in this thread");
    replyClauses.push("If it helps, please attach a screenshot or file here and I’ll review it with you right away.");
  }

  if (normalizedInstruction.includes("ticket") || normalizedInstruction.includes("case")) {
    updateClauses.push("confirm that you will update the support ticket as part of the next step");
    replyClauses.push("I’ll document this in the support ticket so the latest update is captured while we continue here.");
  }

  if (normalizedInstruction.includes("account number") || normalizedInstruction.includes("account #") || normalizedInstruction.includes("account")) {
    updateClauses.push(`ask ${customerFirstName} to confirm the account number needed for verification`);
    replyClauses.push("Please share the account number tied to this request so I can verify the record before the next step.");
  }

  if (normalizedInstruction.includes("billing") || normalizedInstruction.includes("payment")) {
    updateClauses.push("include a billing verification step before the customer retries");
    replyClauses.push("I’m also going to verify the billing details tied to the latest attempt before we move forward.");
  }

  if (updateClauses.length === 0) {
    updateClauses.push(`incorporate this agent request: ${instruction.trim()}`);
    replyClauses.push(`I’m also taking this additional step into account: ${instruction.trim()}.`);
  }

  return {
    summary: `${suggestion.summary} Update it to ${updateClauses.join(", ")}.`,
    suggestedReply: `${suggestion.suggestedReply} ${replyClauses.join(" ")}`.trim(),
  };
}

function getInlineSuggestionVariants(
  conversation: SharedConversationData,
  customerMessage: ConversationMessage,
): InlineSuggestion[] {
  const normalizedMessage = customerMessage.content.toLowerCase();
  const customerFirstName = conversation.customerName.split(" ")[0] ?? conversation.customerName;

  // ── Sofia fraud / transfer handoff scenario ───────────────────────────────
  if (
    normalizedMessage.includes("fraud") ||
    normalizedMessage.includes("unauthorized") ||
    normalizedMessage.includes("scared") ||
    normalizedMessage.includes("rent") ||
    normalizedMessage.includes("temporary credit") ||
    normalizedMessage.includes("fraudulent") ||
    (normalizedMessage.includes("sorry") && normalizedMessage.includes("upset"))
  ) {
    return [
      {
        summary: `Introduce yourself warmly as the agent who has been monitoring, and immediately reassure ${customerFirstName} that the situation is being taken seriously at every level.`,
        suggestedReply: `Hi ${customerFirstName}, this is Jeff — I've been monitoring this conversation and I want you to know we take this extremely seriously. You're in safe hands and we're going to make sure everything is fully resolved for you.`,
      },
      {
        summary: `Acknowledge the distress ${customerFirstName} has been through and personally commit to seeing this through to resolution.`,
        suggestedReply: `${customerFirstName}, I'm so sorry this happened to you. My name is Jeff and I've been following along this entire conversation. I want to personally make sure this is completely taken care of — you have my full attention right now.`,
      },
      {
        summary: `Validate how stressful this must be and confirm that the protective actions already taken are solid.`,
        suggestedReply: `${customerFirstName}, I can only imagine how stressful this has been, especially with your rent due. I'm Jeff, and I want to reassure you — the credit has been applied, your card is protected, and I'm right here if anything else comes up.`,
      },
      {
        summary: `Reassure ${customerFirstName} about the case status and offer a direct line of escalation if anything else surfaces.`,
        suggestedReply: `Hi ${customerFirstName}, this is Jeff. I've reviewed everything Jacob did on your case and it was handled correctly. Your temporary credit is in place and the investigation is underway. I'll be keeping a close eye on this personally.`,
      },
      {
        summary: `Empathize with the emotional weight of the situation and confirm that the fraud investigation is moving forward with urgency.`,
        suggestedReply: `${customerFirstName}, please don't apologize — what happened to your account was serious and your reaction was completely understandable. I'm Jeff, and I want you to know our fraud team is already working on this. You did the right thing by reaching out.`,
      },
      {
        summary: `Acknowledge the transfer, introduce yourself, and give ${customerFirstName} confidence that no details will be lost.`,
        suggestedReply: `Hi ${customerFirstName}, I'm Jeff. Jacob has transferred you over to me, and I've read through everything — you won't have to repeat yourself. We have the dispute filed, your credit applied, and a replacement card on its way. Is there anything else I can help you with right now?`,
      },
      {
        summary: `Open with warmth, confirm everything that has been done, and give ${customerFirstName} a clear sense of what happens next.`,
        suggestedReply: `${customerFirstName}, my name is Jeff and I'll be with you from here. Everything Jacob set up is in place — the dispute is filed under reference #FRD-2159-SM and your balance is protected. You should see the credit reflected shortly. I'll follow up if our investigation team needs anything from you.`,
      },
      {
        summary: `Acknowledge the handoff and immediately focus on ${customerFirstName}'s most pressing concern — the rent deadline.`,
        suggestedReply: `Hi ${customerFirstName}, this is Jeff. I know your rent is due tomorrow and that's exactly why I'm stepping in personally. The $2,159 credit is on your account right now — your payment should go through without any issue. I'm here if you need anything else at all.`,
      },
      {
        summary: `Close with confidence and warmth, making ${customerFirstName} feel cared for as the handoff wraps up.`,
        suggestedReply: `${customerFirstName}, you're all set on our end. I'm Jeff and I'll be your point of contact from here on. Please don't hesitate to reach back out if you notice anything unusual on your account — we'll be watching it closely on our side too.`,
      },
    ];
  }

  if (normalizedMessage.includes("same error") || normalizedMessage.includes("tried again") || normalizedMessage.includes("retry") || normalizedMessage.includes("retried") || normalizedMessage.includes("still")) {
    return [
      {
        summary:
          "Recommend confirming the latest account status, then offer a manual refresh so the customer can retry without leaving the conversation.",
        suggestedReply:
          "I’ve confirmed the latest account status on my side. I’m running a manual refresh now so you can retry without leaving this conversation.",
      },
      {
        summary:
          "Acknowledge that the retry failed again, confirm you are checking the latest status, and keep the customer in the same thread while you reset the flow.",
        suggestedReply:
          "Thanks for trying that again. I’m checking the latest status now, and I’ll reset the flow from my side so you can retry here without starting over.",
      },
      {
        summary:
          "Show ownership of the repeated failure, explain you are refreshing the account state, and give the customer one immediate next step.",
        suggestedReply:
          "I can see the same error is still blocking the attempt. I’m refreshing the account state now, and I’ll let you know as soon as it’s ready for one more retry.",
      },
      {
        summary:
          "Validate the customer’s frustration, confirm you are escalating the check internally, and set a short response time expectation.",
        suggestedReply:
          "I understand this has happened more than once and that’s frustrating. I’m escalating the check on my end now and I’ll have an update for you within just a few minutes.",
      },
      {
        summary:
          "Confirm you can see the repeated error pattern, explain you are reviewing the underlying cause, and reassure the customer you will not ask them to retry blindly.",
        suggestedReply:
          "I can see the repeated error pattern on the account. I’m reviewing the underlying cause now, and I won’t ask you to retry until I know exactly what needs to change.",
      },
      {
        summary:
          "Acknowledge the persistence of the issue, explain that you are clearing any cached state on the account, and ask the customer to stand by.",
        suggestedReply:
          "I hear you — the same issue keeps coming back. I’m clearing any cached state on the account right now. Please stand by and I’ll confirm when it’s ready for another attempt.",
      },
      {
        summary:
          "Take direct ownership, confirm the specific step where the error occurs, and commit to staying on the issue until it is resolved.",
        suggestedReply:
          "I’m taking direct ownership of this. I’ve identified the step where the error is occurring and I’m working on it now. I’ll stay with you until this is resolved.",
      },
      {
        summary:
          "Show empathy for the repeated attempts, confirm you are pulling the full error log, and give the customer a clear next action.",
        suggestedReply:
          "I appreciate your patience through multiple attempts. I’m pulling the full error log now so I can find the root cause and give you one clear next step.",
      },
      {
        summary:
          "Reassure the customer that no action is needed on their end right now, confirm you are running a backend reset, and give a short time estimate.",
        suggestedReply:
          "No action needed on your end right now. I’m running a backend reset on the account, and it should be ready for a clean retry within the next two to three minutes.",
      },
    ];
  }

  if (normalizedMessage.includes("charged twice") || normalizedMessage.includes("double charge")) {
    return [
      {
        summary: "Reassure the customer they will not be charged twice, then guide them through a safe retry.",
        suggestedReply:
          "You will not be charged twice for the same upgrade attempt. I’ll verify the previous authorization, then I’ll let you know the safest time to retry.",
      },
      {
        summary: "Reduce anxiety about duplicate billing, confirm you are reviewing the payment authorization, and set up the next action clearly.",
        suggestedReply:
          "I understand the concern. I’m reviewing the previous authorization now to make sure there isn’t a duplicate charge, and then I’ll guide you through the next safe step.",
      },
      {
        summary: "Confirm you are checking the billing history, reassure them the original attempt is being reviewed, and avoid asking them to retry too early.",
        suggestedReply:
          "I’m checking the billing history on my side first so we do not risk a duplicate charge. Once I confirm the original attempt status, I’ll tell you whether it’s safe to retry.",
      },
      {
        summary: "Immediately address the duplicate charge concern, confirm you are placing a hold on further retries until billing is verified.",
        suggestedReply:
          "I want to address the possible duplicate charge first. I’m placing a hold on any further retries until I’ve verified both authorization records. I’ll update you here shortly.",
      },
      {
        summary: "Confirm you can see both charge attempts, explain you are reviewing which one settled, and reassure the customer any duplicate will be reversed.",
        suggestedReply:
          "I can see both attempts on the account. I’m reviewing which one settled so we can confirm there’s no duplicate. If there is, I’ll make sure it gets reversed.",
      },
      {
        summary: "Set clear expectations about the billing review process, reassure the customer no further charges will occur, and give a time estimate.",
        suggestedReply:
          "No further charges will occur while I review this. I’ll have a clear answer on the billing status within a few minutes and I’ll update you here.",
      },
      {
        summary: "Acknowledge the customer’s concern directly, confirm the specific charge amounts you are reviewing, and explain the next step.",
        suggestedReply:
          "I completely understand why that’s concerning. I’m reviewing the charge amounts from both attempts now and I’ll confirm which one processed and whether anything needs to be reversed.",
      },
      {
        summary: "Apologize for the confusion, confirm you are escalating to the billing team if needed, and keep the customer informed.",
        suggestedReply:
          "I apologize for the confusion around the charges. I’m reviewing this now and if I need to escalate to the billing team I’ll loop them in immediately and keep you updated here.",
      },
      {
        summary: "Validate the concern, confirm the account is safe from further charges, and commit to a resolution within the current conversation.",
        suggestedReply:
          "Your account is protected from any further charges while I sort this out. I’m committed to resolving the billing question before we close this conversation.",
      },
    ];
  }

  if (normalizedMessage.includes("billing") || normalizedMessage.includes("zip") || normalizedMessage.includes("match")) {
    return [
      {
        summary: "Confirm the billing details on file, then guide the customer to the field most likely causing the mismatch.",
        suggestedReply:
          "I can see a billing detail mismatch on the latest attempt. Please confirm the billing zip code on the card, and I’ll stay with you while you try it again.",
      },
      {
        summary: "Point the customer to the billing field most likely causing the failure and keep the instruction focused on one correction at a time.",
        suggestedReply:
          "The latest attempt looks like it failed on a billing detail check. Please verify the billing zip code exactly as it appears with your card issuer, and I’ll stay with you for the retry.",
      },
      {
        summary: "Keep the response specific, ask for the most important billing confirmation, and reduce the chance of another mismatch.",
        suggestedReply:
          "Before we try again, please confirm the billing zip code tied to the card. That is the field most likely causing the mismatch I’m seeing on the payment check.",
      },
      {
        summary: "Explain what a billing mismatch means in plain terms, then ask the customer to double-check the address on file with their bank.",
        suggestedReply:
          "A billing mismatch usually means the address or zip code entered doesn’t match what your bank has on file. Can you double-check the billing address registered with your card issuer?",
      },
      {
        summary: "Confirm you are updating the billing details from your side where possible, and ask the customer to confirm the card’s registered details.",
        suggestedReply:
          "I’m reviewing what we have on file and I want to make sure the details match your card exactly. Can you confirm the billing address and zip code as your card issuer has it?",
      },
      {
        summary: "Reduce friction by narrowing down whether the issue is the name, address, or zip code, and focus the customer on one field at a time.",
        suggestedReply:
          "Let’s narrow this down together. Can you first confirm whether the cardholder name on the card matches what you entered? That’s sometimes the source of the mismatch.",
      },
      {
        summary: "Reassure the customer that billing mismatches are common and fixable, then walk them through the two most likely fields to correct.",
        suggestedReply:
          "Billing mismatches are common and easy to fix. The two fields that usually cause this are the billing zip code and the cardholder name — can you confirm both match your card exactly?",
      },
      {
        summary: "Ask the customer to try a different card if the billing details cannot be verified, and keep the conversation moving.",
        suggestedReply:
          "If you’re not able to confirm the billing details on that card, it may be quicker to try a different payment method. I can stay with you through either option.",
      },
      {
        summary: "Confirm you are temporarily updating the billing record to attempt a clean match, and ask the customer to stand by.",
        suggestedReply:
          "I’m making a note on the billing record to flag the mismatch for review. In the meantime, please double-check the zip code and try the payment again — I’ll stay here with you.",
      },
    ];
  }

  if (normalizedMessage.includes("today") || normalizedMessage.includes("urgent") || normalizedMessage.includes("meeting")) {
    return [
      {
        summary: "Acknowledge the urgency, confirm the next action, and keep the customer in the conversation while you resolve it.",
        suggestedReply:
          "I understand this is time-sensitive. I’m checking the blocking step now, and I’ll keep you updated here so you can complete the upgrade as quickly as possible.",
      },
      {
        summary: "Lead with urgency, explain that you are actively checking the blocker, and reassure the customer they will not need to repeat everything.",
        suggestedReply:
          "I know this is urgent. I’m reviewing the blocking step right now, and I’ll stay with you here so we can move this forward without making you repeat the process.",
      },
      {
        summary: "Recognize the deadline, confirm immediate ownership, and give the customer confidence that the next update is coming soon.",
        suggestedReply:
          "Thanks for flagging the urgency. I’m on the blocking issue now, and I’ll update you here with the next step as soon as I confirm what’s holding it up.",
      },
      {
        summary: "Prioritize the time constraint, confirm you are expediting the review, and give a realistic time estimate.",
        suggestedReply:
          "I’m treating this as a priority given the time constraint. I’m expediting the review on my end and expect to have a resolution or a clear next step for you within the next few minutes.",
      },
      {
        summary: "Acknowledge the deadline, skip unnecessary back-and-forth, and commit to the fastest possible path to resolution.",
        suggestedReply:
          "Given your deadline I want to skip any unnecessary steps. I’m going straight to the fastest resolution path on my end and I’ll have an update for you momentarily.",
      },
      {
        summary: "Validate the urgency and confirm that you are escalating internally to meet the customer’s timeline.",
        suggestedReply:
          "I hear you — this needs to be done today. I’m escalating internally right now to make sure we can meet your timeline. I’ll have a direct update for you shortly.",
      },
      {
        summary: "Show empathy for the deadline pressure, confirm the one step blocking resolution, and commit to completing it immediately.",
        suggestedReply:
          "I understand the pressure you’re under. There’s one blocking step I need to clear on my side, and I’m working on it right now. I’ll be back with you in just a moment.",
      },
      {
        summary: "Confirm you are removing any queued delays on the account and give the customer a clear window to complete their task.",
        suggestedReply:
          "I’m removing any queued delays on the account so you have a clean window to complete this today. I’ll confirm as soon as it’s ready and walk you through the final step.",
      },
      {
        summary: "Offer to stay on the conversation actively until the deadline is met, so the customer knows they have continuous support.",
        suggestedReply:
          "I’m going to stay active on this conversation until we get this resolved for you today. Tell me where things are right now and I’ll take it from there.",
      },
    ];
  }

  if (normalizedMessage.includes("worked") || normalizedMessage.includes("thank you")) {
    return [
      {
        summary: "Confirm the issue is resolved and tell the customer what to watch for next.",
        suggestedReply:
          "Glad that worked. Your upgrade should now continue normally, and I’ll stay available here in case anything else comes up.",
      },
      {
        summary: "Close the loop clearly, confirm the path forward is back on track, and keep the tone supportive.",
        suggestedReply:
          "Great, that means the issue is resolved and the upgrade flow should continue normally from here. I’ll stay available in case anything unexpected comes up.",
      },
      {
        summary: "Acknowledge the positive update and let the customer know what should happen next so the thread can wind down cleanly.",
        suggestedReply:
          "Happy to hear that worked. Everything should move forward normally now, but I’ll remain here if you need help with the next step.",
      },
      {
        summary: "Confirm resolution and set expectations about what a successful completion looks like, so the customer knows what to expect.",
        suggestedReply:
          "That’s great news. You should see the change reflected on your account within a few minutes. Feel free to reach back out if anything looks off.",
      },
      {
        summary: "Acknowledge the customer’s thanks, confirm the case is resolved, and offer a warm close.",
        suggestedReply:
          "You’re welcome — I’m glad we got that sorted out. Is there anything else I can help you with before I close the case?",
      },
      {
        summary: "Confirm success, summarize what was done, and let the customer know how to follow up if needed.",
        suggestedReply:
          "Perfect. I’ve noted the resolution on your account. If the same issue comes up again or anything else needs attention, don’t hesitate to reach back out.",
      },
      {
        summary: "Celebrate the success briefly, confirm there are no further actions needed on the customer’s end, and offer to close the conversation.",
        suggestedReply:
          "Excellent — no further action needed on your end. I’ll go ahead and mark this as resolved unless you have anything else you’d like to cover.",
      },
      {
        summary: "Respond warmly to the thanks, confirm the issue is fully closed, and invite the customer to return if needed.",
        suggestedReply:
          "My pleasure — that’s exactly what I’m here for. The issue is fully resolved on my end. Feel free to come back anytime if you need further assistance.",
      },
      {
        summary: "Confirm the fix, note any follow-up steps the customer should be aware of, and end on a positive note.",
        suggestedReply:
          "Glad that’s working now. Just keep an eye out for a confirmation email in the next few minutes. It was great helping you today.",
      },
    ];
  }

  return [
    {
      summary: `Recommend acknowledging ${conversation.customerName.split(" ")[0]}’s latest update and giving them one clear next step.`,
      suggestedReply: "Thanks for the update. I’m checking the latest attempt now and I’ll give you the next step in just a moment.",
    },
    {
      summary: `Recommend confirming ${conversation.customerName.split(" ")[0]}’s latest update, then setting expectations for the next follow-up in this thread.`,
      suggestedReply: "Thanks for the update. I’m reviewing the latest activity now, and I’ll follow up here with the clearest next step in just a moment.",
    },
    {
      summary: `Recommend acknowledging ${conversation.customerName.split(" ")[0]}’s message and giving them one immediate action while you continue checking the issue.`,
      suggestedReply: "I appreciate the update. I’m checking the latest attempt now and I’ll reply here with the best next step shortly.",
    },
    {
      summary: `Confirm you have received ${conversation.customerName.split(" ")[0]}’s message and let them know you are actively reviewing the details before responding.`,
      suggestedReply: "Got it, thank you. I’m reviewing the details on my end right now and I’ll come back to you with the clearest path forward shortly.",
    },
    {
      summary: `Show ${conversation.customerName.split(" ")[0]} that you are actively engaged, confirm you are checking the account, and set a short response window.`,
      suggestedReply: "I’m on it. Let me pull up the account details and I’ll have a more specific update for you in just a moment.",
    },
    {
      summary: `Acknowledge ${conversation.customerName.split(" ")[0]}’s message promptly, confirm ownership of the next step, and avoid asking for information you may already have.`,
      suggestedReply: "Thanks for letting me know. I’m checking what I need on my end and will follow up here as soon as I have something concrete for you.",
    },
    {
      summary: `Keep ${conversation.customerName.split(" ")[0]} informed without over-promising, confirm you are checking the relevant details, and invite them to ask if they have other questions.`,
      suggestedReply: "I hear you. I’m reviewing everything related to this and I’ll be back with a clear next step shortly. Let me know if there’s anything else you’d like me to look at in the meantime.",
    },
    {
      summary: `Acknowledge the message, confirm you are taking the right action on the account, and reassure ${conversation.customerName.split(" ")[0]} they are in good hands.`,
      suggestedReply: "Thanks for the message. I’m taking a look at the account right now and I’ll make sure we get this sorted out for you as quickly as possible.",
    },
    {
      summary: `Use a reassuring tone, confirm you understand the situation, and let ${conversation.customerName.split(" ")[0]} know the next update is imminent.`,
      suggestedReply: "I completely understand. I’m working through the details now and you’ll have an update from me very shortly — I want to make sure I give you the right answer.",
    },
  ];
}

function getInlineSuggestion(
  conversation: SharedConversationData,
  customerMessage: ConversationMessage,
  refreshKey = 0,
) {
  return getSuggestionVariant(getInlineSuggestionVariants(conversation, customerMessage), refreshKey);
}

function getSummarySnippet(content: string | undefined, maxLength = 170) {
  const normalizedContent = content?.replace(/\s+/g, " ").trim();

  if (!normalizedContent) {
    return null;
  }

  return normalizedContent.length > maxLength
    ? `${normalizedContent.slice(0, maxLength - 3)}...`
    : normalizedContent;
}

function getRemainingSupportNeed(issueSummary: string | null, latestCustomerMessage: ConversationMessage | undefined) {
  const normalizedReply = latestCustomerMessage?.content.toLowerCase() ?? "";
  const normalizedIssue = issueSummary?.toLowerCase() ?? "";
  const evaluationText = `${normalizedReply} ${normalizedIssue}`.trim();

  if (normalizedReply.includes("where should i update") || normalizedReply.includes("old zip") || normalizedReply.includes("recently moved")) {
    return "Show the customer exactly where to update the billing details, point to the field that is wrong, and ask them to wait to retry until that profile update is complete.";
  }

  if (normalizedReply.includes("duplicate charge") || normalizedReply.includes("charged twice") || normalizedReply.includes("double charge")) {
    return "Check whether any duplicate authorization exists, explain the billing risk clearly, and then tell the customer if it is safe to retry.";
  }

  if (normalizedReply.includes("payment link") || normalizedReply.includes("secure link") || normalizedReply.includes("send it over") || normalizedReply.includes("inbox")) {
    return "Send the promised follow-up now, confirm where it was delivered, and tell the customer the exact step to take once it arrives.";
  }

  if (normalizedReply.includes("full page") || normalizedReply.includes("payment section") || normalizedReply.includes("screenshot") || normalizedReply.includes("photo")) {
    return "Specify exactly what screenshot or evidence the customer should send, confirm how to send it, and review it before asking for another retry.";
  }

  if (normalizedReply.includes("should i retry") || normalizedReply.includes("retry it now") || normalizedReply.includes("what should i do next")) {
    return "Answer the customer's question directly with one clear next action and make it explicit whether they should retry now or wait for another fix first.";
  }

  if (normalizedReply.includes("worked") || normalizedReply.includes("thank you")) {
    return "Confirm the issue is resolved, tell the customer what to watch for next, and close the loop cleanly unless another problem appears.";
  }

  if (evaluationText.includes("same error") || evaluationText.includes("still") || evaluationText.includes("retry") || evaluationText.includes("declined") || evaluationText.includes("blocked")) {
    return "Explain what is still blocking the latest attempt, describe what changed since the failed retry, and give the customer one new action instead of repeating the previous step.";
  }

  if (evaluationText.includes("billing") || evaluationText.includes("zip") || evaluationText.includes("card") || evaluationText.includes("payment")) {
    return "Verify the billing details on file, call out the exact field that needs attention, and confirm when the customer should try again.";
  }

  if (evaluationText.includes("urgent") || evaluationText.includes("today") || evaluationText.includes("meeting") || evaluationText.includes("deadline")) {
    return "Take immediate ownership of the blocker and reply with a time-sensitive resolution path the customer can act on right away.";
  }

  return "Respond directly to the customer's latest reply and turn it into one specific next action they can take now.";
}

function getDetectedIntent(messages: SharedConversationData["messages"]): string {
  const text = messages
    .filter((m) => m.role === "customer")
    .map((m) => m.content.toLowerCase())
    .join(" ");

  if (text.match(/\b(subscription|plan|upgrade|downgrade|tier)\b/) && text.match(/\b(payment|billing|charge|fail|decline)\b/)) {
    return "Subscription Upgrade / Payment Failure";
  }
  if (text.match(/\b(cancel|cancellation|unsubscribe)\b/)) {
    return "Cancellation Request";
  }
  if (text.match(/\b(subscription|plan|upgrade|downgrade|tier)\b/)) {
    return "Subscription Upgrade / Change";
  }
  if (text.match(/\b(payment|billing|charge|invoice|refund|overpaid|overcharg)\b/)) {
    return "Billing / Payment Issue";
  }
  if (text.match(/\b(delivery|shipping|package|parcel|reroute|transit|exception)\b/)) {
    return "Delivery / Shipping Issue";
  }
  if (text.match(/\b(broken|error|bug|crash|not work|issue|problem|fail)\b/)) {
    return "Technical Issue";
  }
  return "General Inquiry";
}

function getChurnRisk(messages: SharedConversationData["messages"]): { label: string; level: "low" | "medium" | "high" } {
  const hasFrustration = messages.some((m) => m.sentiment === "frustrated" || m.sentiment === "critical");
  const text = messages.map((m) => m.content.toLowerCase()).join(" ");
  const highRiskWords = /\b(cancel|leave|competitor|refund|lawsuit|terrible|unacceptable|never again)\b/;

  if (hasFrustration && highRiskWords.test(text)) return { label: "High", level: "high" };
  if (hasFrustration) return { label: "Medium", level: "medium" };
  return { label: "Low", level: "low" };
}

function getConversationOverview(conversation: SharedConversationData) {
  const customerFirstName = conversation.customerName.split(" ")[0] ?? conversation.customerName;
  const latestCustomerMessage = [...conversation.messages].reverse().find((message) => message.role === "customer");
  const latestAgentMessage = [...conversation.messages].reverse().find((message) => message.role === "agent");
  const issueSummary = getSummarySnippet(latestCustomerMessage?.content);
  const priorHelpSummary = getSummarySnippet(latestAgentMessage?.content, 150);
  const assignmentReason = (latestCustomerMessage?.sentiment === "frustrated" || latestCustomerMessage?.sentiment === "critical")
    ? `${customerFirstName} was routed to this agent because the issue is still unresolved and the customer is showing frustration in the current ${conversation.label.toLowerCase()} thread.`
    : `${customerFirstName} was routed to this agent because the current ${conversation.label.toLowerCase()} thread still needs active ownership to move the issue forward.`;
  const customerIssue = issueSummary
    ? `${customerFirstName} is dealing with this issue: ${issueSummary}`
    : `${customerFirstName}'s current issue has not been fully captured in the thread yet.`;
  const priorHelp = priorHelpSummary
    ? `The previous agent or AI already tried to help by saying or doing this: ${priorHelpSummary}`
    : "The previous agent or AI has not yet documented a meaningful action that would unblock the issue.";
  const remainingNeed = getRemainingSupportNeed(issueSummary, latestCustomerMessage);

  const detectedIntent = getDetectedIntent(conversation.messages);
  const churnRisk = getChurnRisk(conversation.messages);
  const sentiment = latestCustomerMessage?.sentiment ?? null;

  return {
    assignmentReason,
    customerIssue,
    priorHelp,
    remainingNeed,
    detectedIntent,
    churnRisk,
    sentiment,
  };
}

function getEmailAddress(name: string) {
  const localPart = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");

  return `${localPart || "support"}@nice.com`;
}

function getEmailThreadContent(content: string) {
  const [firstLine = "", ...remainingLines] = content.split("\n");
  const hasSubjectLine = firstLine.toLowerCase().startsWith("subject:");
  const subject = hasSubjectLine ? firstLine.slice("subject:".length).trim() : "";
  const body = (hasSubjectLine ? remainingLines : [firstLine, ...remainingLines]).join("\n").trim();

  return { subject, body };
}

function getReplyEmailSubject(conversation: SharedConversationData) {
  const firstCustomerEmail = conversation.messages.find((message) => message.role === "customer");
  const parsedEmail = firstCustomerEmail ? getEmailThreadContent(firstCustomerEmail.content) : null;
  const baseSubject = parsedEmail?.subject || `${conversation.customerName} follow-up`;

  return /^re:/i.test(baseSubject) ? baseSubject : `Re: ${baseSubject}`;
}

function getTicketPriorityDotClassName(priority: CustomerTicket["priority"]) {
  switch (priority) {
    case "Low":
      return "bg-[#208337]";
    case "Medium":
      return "bg-[#166CCA]";
    case "High":
      return "bg-[#FFB800]";
    default:
      return "bg-[#E32926]";
  }
}

function getTicketStatusBadgeClasses(status: CustomerTicket["status"]) {
  switch (status) {
    case "Open":
      return "border-[#24943E] bg-[#EFFBF1] text-[#208337]";
    case "In Progress":
      return "border-[#A37A00] bg-[#FFF6E0] text-[#A37A00]";
    case "Pending Customer":
    case "On-Hold":
    case "Training Rescheduled":
      return "border-[#A37A00] bg-[#FFF6E0] text-[#A37A00]";
    case "Escalated":
    case "Needing Attention":
      return "border-[#E53935] bg-[#FDEAEA] text-[#C71D1A]";
    default:
      return "border-black/10 bg-white text-[#475467]";
  }
}

function InlineTicketRecord({
  ticket,
  isOpen,
  onToggle,
}: {
  ticket: CustomerTicket;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="mt-4 overflow-hidden rounded-[8px] border border-black/10 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full flex-col gap-2 border-b border-black/10 px-4 py-3 text-left"
      >
        <div className="flex w-full items-start justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#BFDBFE] bg-[#EBF4FD] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#166CCA]">
              <Ticket className="h-3 w-3" />
              {ticket.id}
            </span>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-black/10 bg-white px-2.5 py-0.5 text-[11px] font-medium text-[#475467]">
              <span className={cn("h-2 w-2 shrink-0 rounded-full", getTicketPriorityDotClassName(ticket.priority))} />
              {ticket.priority} Priority
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium shadow-sm",
                getTicketStatusBadgeClasses(ticket.status),
              )}
            >
              {ticket.status}
            </span>
            <ChevronDown className={cn("h-4 w-4 shrink-0 text-[#667085] transition-transform", !isOpen && "-rotate-90")} />
          </div>
        </div>
        <div className="min-w-0">
          <h3 className="text-[14px] font-semibold leading-snug text-[#111827]">{ticket.subject}</h3>
          <p className="mt-0.5 text-xs text-[#667085]">
            {ticket.type} case owned by {ticket.agent} in {ticket.agentTeam}.
          </p>
        </div>
      </button>

      {isOpen ? (
        <div className="flex flex-col gap-3 bg-[#FCFCFD] p-3">
          <div className="rounded-xl border border-black/10 bg-white p-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#667085]">Ticket Details</div>
            <dl className="mt-3 space-y-2 text-xs">
              <div className="flex items-start justify-between gap-2">
                <dt className="text-[#667085]">Ticket Number</dt>
                <dd className="font-medium text-[#111827]">{ticket.id}</dd>
              </div>
              <div className="flex items-start justify-between gap-2">
                <dt className="text-[#667085]">Type</dt>
                <dd className="font-medium text-[#111827]">{ticket.type}</dd>
              </div>
              <div className="flex items-start justify-between gap-2">
                <dt className="text-[#667085]">Modified By</dt>
                <dd className="font-medium text-[#111827]">{ticket.modifiedBy}</dd>
              </div>
              <div className="flex items-start justify-between gap-2">
                <dt className="text-[#667085]">Assigned Team</dt>
                <dd className="font-medium text-[#111827]">{ticket.agentTeam}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-black/10 bg-white p-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#667085]">Summary</div>
            <p className="mt-2 text-xs leading-5 text-[#475467]">
              This ticket record was opened directly from the AI suggestion so agents can review the case without leaving the active conversation. Collapse this section any time to return to the message thread.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function EmailConversationView({
  conversation,
  customerId,
  draft,
  hasDraft,
  isDraftFocused,
  textareaRef,
  onDraftChange,
  onDraftFocus,
  onDraftBlur,
  onClearDraft,
  onSend,
}: {
  conversation: SharedConversationData;
  customerId?: string;
  draft: string;
  hasDraft: boolean;
  isDraftFocused: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  onDraftChange: (nextDraft: string) => void;
  onDraftFocus: () => void;
  onDraftBlur: () => void;
  onClearDraft: () => void;
  onSend: () => void;
}) {
  const customerRecord = customerId ? getCustomerRecord(customerId) : null;
  const agentName = customerRecord?.overview.assignedAgent ?? "Jeff Comstock";
  const agentEmail = getEmailAddress(agentName);
  const customerEmail = getEmailAddress(conversation.customerName);
  const firstCustomerEmail = conversation.messages.find((message) => message.role === "customer");
  const emailThread = getEmailThreadContent(firstCustomerEmail?.content ?? "");
  const replySubject = getReplyEmailSubject(conversation);
  const threadDate = conversation.timelineLabel.replace(/^Email thread\s·\s/i, "");

  return (
    <div className="mx-auto flex w-full max-w-[780px] flex-col overflow-hidden rounded-[10px] border border-black/10 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.08)]">
      <div className="border-b border-black/10 px-5 py-3">
        <div className="grid gap-3 text-[15px] text-[#333333]">
          <div className="flex items-center gap-3 border-b border-black/10 pb-2">
            <span className="w-16 shrink-0 text-[#7A7A7A]">From:</span>
            <span className="truncate">{agentName} ({agentEmail})</span>
          </div>
          <div className="flex items-center gap-3 border-b border-black/10 pb-2">
            <span className="w-16 shrink-0 text-[#7A7A7A]">To:</span>
            <span className="truncate">{conversation.customerName} ({customerEmail})</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-16 shrink-0 text-[#7A7A7A]">Subject:</span>
            <span className="truncate font-medium text-[#111827]">{replySubject}</span>
          </div>
        </div>
      </div>

      <div className="border-b border-black/10 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2 text-[#444444]">
          <button type="button" className="rounded-md bg-[#F3F4F6] px-3 py-1.5 text-sm">Aptos</button>
          <button type="button" className="rounded-md bg-[#F3F4F6] px-3 py-1.5 text-sm">12</button>
          <button type="button" className="rounded-md px-2 py-1 text-sm text-[#666666] hover:bg-[#F8F8F9]">A</button>
          <button type="button" className="rounded-md px-2 py-1 text-sm text-[#666666] hover:bg-[#F8F8F9]">
            <Paperclip className="h-4 w-4" />
          </button>
          <button type="button" className="rounded-md px-2 py-1 text-sm font-semibold hover:bg-[#F8F8F9]">B</button>
          <button type="button" className="rounded-md px-2 py-1 text-sm italic hover:bg-[#F8F8F9]">I</button>
          <button type="button" className="rounded-md px-2 py-1 text-sm underline hover:bg-[#F8F8F9]">U</button>
          <button type="button" className="rounded-md px-2 py-1 text-sm hover:bg-[#F8F8F9]">•</button>
          <button type="button" className="rounded-md px-2 py-1 text-sm hover:bg-[#F8F8F9]">
            <MoreHorizontal className="h-4 w-4" />
          </button>
          <div className="ml-auto flex items-center gap-2">
            {hasDraft ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClearDraft}
                className="h-8 rounded-full border-black/10 px-3 text-[#666666]"
              >
                Clear
              </Button>
            ) : null}
            <Button type="button" size="sm" onClick={onSend} disabled={!hasDraft} className="h-8 rounded-full bg-[#111827] px-4 text-white hover:bg-[#1F2937] disabled:bg-[#D1D5DB]">
              Send
            </Button>
          </div>
        </div>
      </div>

      <div className="px-5 py-4">
        <Textarea
          key={`email-${replySubject}`}
          ref={textareaRef}
          placeholder="Write your email reply..."
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          onFocus={onDraftFocus}
          onBlur={onDraftBlur}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.preventDefault();
              onSend();
            }
          }}
          rows={8}
          className={cn(
            "min-h-[220px] resize-none border-0 bg-transparent px-0 py-0 text-[15px] leading-7 text-[#111827] shadow-none placeholder:text-[#8A8A8A] focus-visible:ring-0",
            isDraftFocused && "opacity-100",
          )}
        />
      </div>

      <div className="border-t border-black/10 bg-[#FCFCFD] px-5 py-4 text-[15px] leading-7 text-[#111827]">
        <div className="font-semibold text-[#111827]">From: {conversation.customerName} &lt;{customerEmail}&gt;</div>
        <div className="font-semibold text-[#111827]">Date: {threadDate}</div>
        <div className="font-semibold text-[#111827]">To: {agentName} &lt;{agentEmail}&gt;</div>
        <div className="font-semibold text-[#111827]">Subject: {emailThread.subject || replySubject.replace(/^Re:\s*/i, "")}</div>
        <div className="mt-3 whitespace-pre-wrap text-[#111827]">{emailThread.body || "No prior email content yet."}</div>
      </div>
    </div>
  );
}

export default function ConversationPanel({
  conversation,
  activeChannel,
  draftKey,
  className,
  customerId,
  onConversationChange,
  onSelectChannel,
  onOpenDeskPanel,
  onResolveAssignment,
  showAiPanel = true,
  hideTranscript = false,
  hideInput = false,
  performAllActionsKey = 0,
  isPendingAcceptance = false,
  onAcceptAssignment,
  isWidePanel = false,
  onAgentTasksChange,
  agentAvatarUrl,
  appendContent,
  scrollToBottomTrigger,
  suppressAgentTasks = false,
  forcedSuggestedReply,
  forcedSuggestionVariants,
  scrollTopPadding = 0,
  aiConfidence,
  aiConfidenceReason,
  botLabel,
  customerContext,
  voiceOpeningLines,
  voiceTopContent,
  voiceRightPanel,
  voiceContentOverlay,
  onVoiceOpeningLineClick,
}: ConversationPanelProps) {
  const customerFirstName = conversation.customerName.split(" ")[0] ?? conversation.customerName;
  const customerRecord = customerId ? getCustomerRecord(customerId) : null;
  // Always show Jeff Comstock as the agent — the logged-in user is always JC regardless
  // of which agent the customer database has listed as the assigned agent.
  const agentFullName = "Jeff Comstock";

  const isVoiceChannel = activeChannel === "voice";
  const isEmailChannel = activeChannel === "email";

  // AI opening lines dismissed state — resets when new lines arrive (new case / new call).
  const [openingLinesDismissed, setOpeningLinesDismissed] = useState(false);
  const prevOpeningLinesRef = useRef(voiceOpeningLines);
  if (voiceOpeningLines !== prevOpeningLinesRef.current) {
    prevOpeningLinesRef.current = voiceOpeningLines;
    setOpeningLinesDismissed(false);
  }
  // Also suppress opening lines once the conversation has started (voiceTopContent present = agent clicked an opener).
  const showOpeningLines = isVoiceChannel && !!voiceOpeningLines?.length && !openingLinesDismissed && !voiceTopContent;

  // Inline review card approve phase — mirrors the toast card in Layout.tsx
  const [inlineApprovePhase, setInlineApprovePhase] = useState<"idle" | "approving" | "resolved">("idle");
  const inlineApproveTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const narrowOverlayRef = useRef<HTMLDivElement>(null);
  const narrowAiScrollRef = useRef<HTMLDivElement>(null);
  const wideAiScrollRef = useRef<HTMLDivElement>(null);
  const [isNarrowPanel, setIsNarrowPanel] = useState(false);
  const [narrowTab, setNarrowTab] = useState<"conversation" | "copilot">("conversation");
  const [footerHeight, setFooterHeight] = useState(0);
  // Tracks the bounding rect of the container so the portalled footer can be
  // positioned correctly with position:fixed (escaping stacking-context isolation).
  const [containerBounds, setContainerBounds] = useState<{ left: number; width: number; bottom: number } | null>(null);

  const previousMessageCountRef = useRef(conversation.messages.length);
  const initialMessageCountRef = useRef(conversation.messages.length);
  const shouldStickToBottomRef = useRef(true);
  // Suggestion panel is hidden until the customer sends a NEW message after the agent's
  // first reply. This prevents showing suggestions on an already-open conversation.
  const [suggestionUnlocked, setSuggestionUnlocked] = useState(false);
  const [draft, setDraft] = useState(conversation.draft);
  const [isDraftFocused, setIsDraftFocused] = useState(false);
  const [isInputHovered, setIsInputHovered] = useState(false);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const [suggestionRefreshKey, setSuggestionRefreshKey] = useState(0);
  const [suggestionEditPrompt, setSuggestionEditPrompt] = useState("");
  const [editedInlineSuggestion, setEditedInlineSuggestion] = useState<InlineSuggestion | null>(null);
  const [suggestionAccordionValue, setSuggestionAccordionValue] = useState<string>("ai-suggestion");
  const [aiPanelWidth, setAiPanelWidth] = useState(550); // default width
  const aiPanelDragRef = useRef<{ startX: number; startWidth: number } | null>(null);
  // Wide AI panel animation states — content hides before width collapses so nothing looks squished
  const [isAiContentVisible, setIsAiContentVisible] = useState(showAiPanel);
  const [isAiContentEntered, setIsAiContentEntered] = useState(showAiPanel);
  const [aiDisplayWidth, setAiDisplayWidth] = useState(showAiPanel ? 550 : 0);
  const [isSuggestionEditorOpen, setIsSuggestionEditorOpen] = useState(false);
  const [isSuggestionAdded, setIsSuggestionAdded] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<number | null>(null);
  const [suggestionPage, setSuggestionPage] = useState(0);
  const [suggestionPageDir, setSuggestionPageDir] = useState<"next" | "prev">("next");
  const [openedTicketId, setOpenedTicketId] = useState<string | null>(null);
  const [expandedNoteIds, setExpandedNoteIds] = useState<Set<number>>(new Set());
  const [agentTasks, setAgentTasks] = useState<AgentTask[]>([]);
  const [revealedTaskIds, setRevealedTaskIds] = useState<Set<string>>(new Set());
  const [checkedTaskIds, setCheckedTaskIds] = useState<Set<string>>(new Set());
  const [taskProgress, setTaskProgress] = useState<Record<string, { stepIndex: number; paused: boolean }>>({});
  const [hoveredProgressStep, setHoveredProgressStep] = useState<string | null>(null);
  const [postActionSuggestion, setPostActionSuggestion] = useState<string | null>(null);
  const [postActionAnimKey, setPostActionAnimKey] = useState(0);
  const [aiNewCount, setAiNewCount] = useState(0);
  const [copilotInput, setCopilotInput] = useState("");
  const [copilotThinking, setCopilotThinking] = useState(false);
  const [inlineActionInput, setInlineActionInput] = useState("");
  const [inlineActionThinking, setInlineActionThinking] = useState(false);
  const inlineActionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAiScrolledToBottomRef = useRef(true);
  const prevAiSuggestionRef = useRef<string | null>(null);
  const prevRevealedCountRef = useRef(0);
  const taskRevealTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const copilotThinkingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // ── Message animation & tagging ─────────────────────────────────────────
  // Track which messages are pre-existing so only new arrivals animate in.
  const _convAnimKey = `${conversation.label}-${draftKey}`;
  const convAnimKeyRef = useRef(_convAnimKey);
  const seenMessageIdsRef = useRef(new Set(conversation.messages.map((m) => m.id)));
  if (convAnimKeyRef.current !== _convAnimKey) {
    convAnimKeyRef.current = _convAnimKey;
    seenMessageIdsRef.current = new Set(conversation.messages.map((m) => m.id));
  }
  const [messageTags, setMessageTags] = useState<Record<number, string[]>>({});
  const handleToggleTag = (messageId: number, tag: string) => {
    setMessageTags((prev) => {
      const current = prev[messageId] ?? [];
      const next = current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag];
      return { ...prev, [messageId]: next };
    });
  };
  // ────────────────────────────────────────────────────────────────────────

  const conversationRef = useRef(conversation);
  conversationRef.current = conversation;
  const notedTaskIdsRef = useRef<Set<string>>(new Set());
  const latestMessage = conversation.messages[conversation.messages.length - 1];
  const latestCustomerMessage = [...conversation.messages].reverse().find((message) => message.role === "customer") ?? null;
  // Internal notes are agent-side records, not real conversation turns — ignore them
  // when deciding whether the latest turn was from the customer.
  const latestNonInternalMessage = [...conversation.messages].reverse().find((m) => !m.isInternal) ?? null;
  // Suggestions should appear when:
  //   a) the latest turn is from the customer, OR
  //   b) the latest turn is a bot-authored handoff message (author field set) — this happens
  //      immediately after a takeover, and the human agent still needs to compose their first reply.
  // Suppress suggestions only when the human agent themselves sent the most recent message.
  const latestMessageIsCustomer =
    latestNonInternalMessage?.role === "customer" ||
    (latestNonInternalMessage?.role === "agent" && !!latestNonInternalMessage?.author);
  const suggestionVariants = forcedSuggestionVariants && forcedSuggestionVariants.length > 0
    ? forcedSuggestionVariants
    : (latestCustomerMessage ? getInlineSuggestionVariants(conversation, latestCustomerMessage) : []);
  const generatedInlineSuggestion = latestCustomerMessage
    ? getSuggestionVariant(suggestionVariants, suggestionRefreshKey)
    : null;
  const inlineSuggestion = editedInlineSuggestion ?? generatedInlineSuggestion;
  const conversationOverview = getConversationOverview(conversation);
  const shouldShowSuggestion =
    (latestMessageIsCustomer || !!postActionSuggestion) &&
    latestCustomerMessage !== null &&
    (inlineSuggestion !== null || !!postActionSuggestion) &&
    !conversation.isCustomerTyping;
  // True when the suggestion tray is actually visible above the input
  const showingSuggestions = shouldShowSuggestion && isDraftFocused;
  const suggestionActions = useMemo(() => {
    if (!inlineSuggestion || !latestCustomerMessage || !customerId) {
      return [] as SuggestionAction[];
    }

    const actionContext = `${inlineSuggestion.summary} ${inlineSuggestion.suggestedReply} ${conversationOverview.remainingNeed} ${latestCustomerMessage.content}`.toLowerCase();
    const nextActions: SuggestionAction[] = [];
    const relevantTicket = getRelevantCustomerTicket(customerId, actionContext);

    if (
      relevantTicket
      && ["ticket", "case", "billing", "payment", "retry", "declined", "charge", "blocked", "flag", "issue", "support", "upgrade"].some((keyword) => actionContext.includes(keyword))
    ) {
      nextActions.push({
        id: `ticket-${relevantTicket.id}`,
        label: "View ticket",
        initialTab: "Tickets",
        ticketId: relevantTicket.id,
        ticket: relevantTicket,
      });
    }

    if (["account", "billing", "profile", "verification", "status", "zip", "security", "refresh"].some((keyword) => actionContext.includes(keyword))) {
      nextActions.push({
        id: "review-account",
        label: "Review account",
        initialTab: "Accounts",
      });
    }

    return nextActions;
  }, [conversationOverview.remainingNeed, customerId, inlineSuggestion, latestCustomerMessage, onOpenDeskPanel]);
  const hasDraft = draft.trim().length > 0;

  useEffect(() => {
    setDraft(conversation.draft);
  }, [conversation.draft, draftKey]);

  // Track panel width to switch AI panel between inline and overlay mode.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? container.offsetWidth;
      const nextNarrow = width < 640;
      setIsNarrowPanel(nextNarrow);
      if (!nextNarrow) setNarrowTab("conversation");
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Track container bounds so the portalled footer can be placed correctly with position:fixed.
  // We use useLayoutEffect to update synchronously before paint to avoid position flicker.
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const update = () => {
      const rect = container.getBoundingClientRect();
      setContainerBounds({ left: rect.left, width: rect.width, bottom: rect.bottom });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(container);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, []);

  // Track footer height so the overlay stops exactly where the footer begins.
  // Re-run when activeChannel changes so we pick up the footer if it wasn't rendered initially.
  useEffect(() => {
    const footer = footerRef.current;
    if (!footer) {
      setFooterHeight(0);
      return;
    }
    const observer = new ResizeObserver(() => {
      setFooterHeight(footer.offsetHeight);
    });
    observer.observe(footer);
    setFooterHeight(footer.offsetHeight);
    return () => observer.disconnect();
  }, [activeChannel]);


  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "0px";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [draft]);

  // Sequence the wide AI panel open/close animation:
  // Closing — fade content out first, then collapse width so nothing gets squished.
  // Opening — expand width first, then fade content in once the panel is visible.
  useEffect(() => {
    if (isNarrowPanel) return;
    if (showAiPanel) {
      setAiDisplayWidth(aiPanelWidth);
      setIsAiContentVisible(true);
      const t = window.setTimeout(() => setIsAiContentEntered(true), 260);
      return () => window.clearTimeout(t);
    } else {
      setIsAiContentEntered(false);
      const t = window.setTimeout(() => {
        setAiDisplayWidth(0);
        setIsAiContentVisible(false);
      }, 210);
      return () => window.clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAiPanel, isNarrowPanel]);

  // Keep display width in sync when the agent drags the resize handle.
  useEffect(() => {
    if (showAiPanel && !isNarrowPanel) setAiDisplayWidth(aiPanelWidth);
  }, [aiPanelWidth, showAiPanel, isNarrowPanel]);

  // Reset agent tasks and all related state whenever the conversation changes (new customer/channel).
  useEffect(() => {
    setAgentTasks([]);
    setRevealedTaskIds(new Set());
    setCheckedTaskIds(new Set());
    setTaskProgress({});
    setExpandedNoteIds(new Set());
    taskRevealTimersRef.current.forEach(clearTimeout);
    taskRevealTimersRef.current = [];
    notedTaskIdsRef.current = new Set();
    setMessageTags({});
    // Cancel any pending copilot thinking animation so it doesn't fire on the new assignment.
    if (copilotThinkingTimerRef.current !== null) {
      clearTimeout(copilotThinkingTimerRef.current);
      copilotThinkingTimerRef.current = null;
    }
    setCopilotInput("");
    setCopilotThinking(false);
  }, [conversation.label, draftKey]);

  // When "Perform All Actions" is clicked in the summary panel, auto-check and start all tasks.
  useEffect(() => {
    if (!performAllActionsKey) return;
    // Ensure all tasks are visible, checked, and have progress started.
    setRevealedTaskIds(new Set(agentTasks.map((t) => t.id)));
    setCheckedTaskIds(new Set(agentTasks.map((t) => t.id)));
    setTaskProgress((prev) => {
      const additions = Object.fromEntries(
        agentTasks
          .filter((t) => !prev[t.id])
          .map((t) => [t.id, { stepIndex: 0, paused: false }]),
      );
      return { ...prev, ...additions };
    });
    requestAnimationFrame(() => requestAnimationFrame(scrollAiPanelsToBottom));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [performAllActionsKey]);

  // Notify parent whenever task presence changes so it can show/hide the portal slot
  const hasAgentTasks = agentTasks.length > 0;
  useEffect(() => {
    onAgentTasksChange?.(hasAgentTasks);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAgentTasks]);

  // Generate and stagger-reveal suggested agent tasks when a new customer message arrives
  // OR when the conversation itself changes (conversation.label ensures this re-runs after
  // the reset effect above clears the task list for the incoming assignment).
  useEffect(() => {
    if (!latestCustomerMessage) return;

    const freshTasks = getSuggestedAgentTasks(conversation, latestCustomerMessage);
    if (freshTasks.length === 0) return;

    setAgentTasks((prev) => {
      const existingIds = new Set(prev.map((t) => t.id));
      const newTasks = freshTasks.filter((t) => !existingIds.has(t.id));
      if (newTasks.length === 0) return prev;

      // Stagger-reveal each new task with a 180ms delay between them.
      taskRevealTimersRef.current.forEach(clearTimeout);
      taskRevealTimersRef.current = [];
      newTasks.forEach((task, i) => {
        const timer = setTimeout(() => {
          setRevealedTaskIds((ids) => new Set([...ids, task.id]));
        }, 400 + i * 180);
        taskRevealTimersRef.current.push(timer);
      });

      return [...prev, ...newTasks];
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestCustomerMessage?.id, conversation.label]);

  // Animate in voice-specific suggested tasks when the call is connected.
  useEffect(() => {
    if (!isVoiceChannel) return;

    const voiceTasks: AgentTask[] = [
      { id: "upgrade-beverage-package", label: "Upgrade beverage package" },
      { id: "confirm-credit-line", label: "Confirm credit line" },
    ];

    setAgentTasks((prev) => {
      const existingIds = new Set(prev.map((t) => t.id));
      const newTasks = voiceTasks.filter((t) => !existingIds.has(t.id));
      if (newTasks.length === 0) return prev;

      newTasks.forEach((task, i) => {
        const timer = setTimeout(() => {
          setRevealedTaskIds((ids) => new Set([...ids, task.id]));
        }, 500 + i * 220);
        taskRevealTimersRef.current.push(timer);
      });

      return [...prev, ...newTasks];
    });
  }, [isVoiceChannel]);

  // Advance in-progress task steps one at a time (1.8s per step) unless paused.
  // stepIndex === steps.length means all steps completed (one past the last).
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    Object.entries(taskProgress).forEach(([taskId, progress]) => {
      if (progress.paused) return;
      const steps = TASK_STEPS[taskId] ?? [];
      if (progress.stepIndex >= steps.length) return; // all done
      const timer = setTimeout(() => {
        setTaskProgress((prev) => {
          const current = prev[taskId];
          if (!current || current.paused || current.stepIndex !== progress.stepIndex) return prev;
          return { ...prev, [taskId]: { ...current, stepIndex: current.stepIndex + 1 } };
        });
      }, 1800);
      timers.push(timer);
    });
    return () => timers.forEach(clearTimeout);
  }, [taskProgress]);

  // When all steps finish, add an internal note to the conversation timeline,
  // then remove the completed task from the AI list after a brief pause.
  useEffect(() => {
    Object.entries(taskProgress).forEach(([taskId, progress]) => {
      const steps = TASK_STEPS[taskId] ?? [];
      const isAllDone = progress.stepIndex >= steps.length;
      if (!isAllDone || notedTaskIdsRef.current.has(taskId)) return;
      notedTaskIdsRef.current.add(taskId);
      const noteLabel = TASK_COMPLETION_NOTES[taskId];
      if (!noteLabel || !onConversationChange) return;
      const dateStr = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
      const conv = conversationRef.current;
      // Attach a ticket record to ticket-creation notes so the note can be expanded
      const noteTicket = taskId === "create-ticket"
        ? getRelevantCustomerTicket(customerId, "ticket issue error")
        : undefined;
      onConversationChange({
        ...conv,
        messages: [
          ...conv.messages,
          {
            id: Date.now(),
            role: "agent",
            content: `${noteLabel} — ${dateStr}`,
            time: formatConversationTimestamp(new Date()),
            isInternal: true,
            ticket: noteTicket ?? undefined,
          },
        ],
      });
      // Update the Suggested Response to reflect the completed action.
      const completionReply = TASK_COMPLETION_REPLIES[taskId];
      if (completionReply) setPostActionSuggestion(completionReply);
      // Remove the completed task from the AI list after a short delay so the
      // agent briefly sees the completed state before it disappears.
      setTimeout(() => {
        setAgentTasks((prev) => prev.filter((t) => t.id !== taskId));
        setCheckedTaskIds((prev) => { const next = new Set(prev); next.delete(taskId); return next; });
        setRevealedTaskIds((prev) => { const next = new Set(prev); next.delete(taskId); return next; });
        setTaskProgress((prev) => { const { [taskId]: _, ...rest } = prev; return rest; });
        if (taskId === "set-resolved") {
          onResolveAssignment?.();
        }
      }, 1200);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskProgress]);

  const handleToggleTaskCheck = (taskId: string) => {
    setCheckedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
        setTaskProgress((p) => { const { [taskId]: _, ...rest } = p; return rest; });
      } else {
        next.add(taskId);
        setTaskProgress((p) => ({ ...p, [taskId]: { stepIndex: 0, paused: false } }));
        // Auto-accept a pending assignment the moment the agent acts on a suggested next step.
        if (isPendingAcceptance) onAcceptAssignment?.();
        // Always scroll to bottom when checking a task — the card is expanding and the
        // agent needs to see the in-progress steps that are about to appear below it.
        requestAnimationFrame(() => requestAnimationFrame(scrollAiPanelsToBottom));
      }
      return next;
    });
  };

  const handlePerformAllActions = () => {
    setRevealedTaskIds(new Set(agentTasks.map((t) => t.id)));
    setCheckedTaskIds(new Set(agentTasks.map((t) => t.id)));
    setTaskProgress((prev) => {
      const additions = Object.fromEntries(
        agentTasks
          .filter((t) => !prev[t.id])
          .map((t) => [t.id, { stepIndex: 0, paused: false }]),
      );
      return { ...prev, ...additions };
    });
    requestAnimationFrame(() => requestAnimationFrame(scrollAiPanelsToBottom));
  };

  const toggleTaskPause = (taskId: string) => {
    setTaskProgress((prev) => {
      const current = prev[taskId];
      if (!current) return prev;
      return { ...prev, [taskId]: { ...current, paused: !current.paused } };
    });
  };

  // When a step advances inside an expanded task card, scroll to bottom if the agent
  // is already there so they continue to see the latest step without interrupting scrolling.
  useEffect(() => {
    if (!isAiScrolledToBottomRef.current) return;
    const id = requestAnimationFrame(scrollAiPanelsToBottom);
    return () => cancelAnimationFrame(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskProgress]);

  const scrollAiPanelsToBottom = () => {
    [narrowAiScrollRef.current, wideAiScrollRef.current].forEach((el) => {
      if (el) el.scrollTop = el.scrollHeight;
    });
    isAiScrolledToBottomRef.current = true;
    setAiNewCount(0);
  };

  const handleAiScroll = (el: HTMLDivElement) => {
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 32;
    isAiScrolledToBottomRef.current = atBottom;
    if (atBottom) setAiNewCount(0);
  };

  const handleAiChipClick = () => {
    requestAnimationFrame(scrollAiPanelsToBottom);
  };

  const handleCopilotSubmit = () => {
    const trimmed = copilotInput.trim();
    if (!trimmed || copilotThinking) return;
    const matched = matchCopilotInput(trimmed);
    setCopilotInput("");
    setCopilotThinking(true);
    copilotThinkingTimerRef.current = setTimeout(() => {
      copilotThinkingTimerRef.current = null;
      setCopilotThinking(false);
      if (matched) {
        // Add the task if not already present
        setAgentTasks((prev) =>
          prev.some((t) => t.id === matched.id) ? prev : [...prev, matched],
        );
        requestAnimationFrame(scrollAiPanelsToBottom);
      }
    }, 900);
  };

  const handleInlineActionSubmit = () => {
    const trimmed = inlineActionInput.trim();
    if (!trimmed || inlineActionThinking) return;
    setInlineActionInput("");
    setInlineActionThinking(true);
    inlineActionTimerRef.current = setTimeout(() => {
      inlineActionTimerRef.current = null;
      setInlineActionThinking(false);
      if (!onConversationChange) return;
      const dateStr = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
      const conv = conversationRef.current;
      // Capitalise the first letter of the action for the note label
      const actionLabel = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
      onConversationChange({
        ...conv,
        messages: [
          ...conv.messages,
          {
            id: Date.now(),
            role: "agent",
            content: `Copilot: ${actionLabel} — ${dateStr}`,
            time: formatConversationTimestamp(new Date()),
            isInternal: true,
          },
        ],
      });
    }, 1400);
  };

  // On mount: scroll AI panels to bottom after the DOM has painted.
  useEffect(() => {
    const id = requestAnimationFrame(scrollAiPanelsToBottom);
    return () => cancelAnimationFrame(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When genuinely new content arrives, auto-scroll if already at bottom,
  // or increment the chip counter if the agent has scrolled up.
  useEffect(() => {
    const newSuggestion = inlineSuggestion?.suggestedReply ?? null;
    const newRevealedCount = revealedTaskIds.size;

    const hasNewContent =
      newSuggestion !== prevAiSuggestionRef.current ||
      newRevealedCount > prevRevealedCountRef.current;

    prevAiSuggestionRef.current = newSuggestion;
    prevRevealedCountRef.current = newRevealedCount;

    if (!hasNewContent) return;

    const id = requestAnimationFrame(() => {
      if (isAiScrolledToBottomRef.current) {
        scrollAiPanelsToBottom();
      } else {
        setAiNewCount((c) => c + 1);
      }
    });
    return () => cancelAnimationFrame(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inlineSuggestion?.suggestedReply, revealedTaskIds.size]);

  const getScrollViewport = () => {
    return scrollAreaRef.current ?? null;
  };

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    const viewport = getScrollViewport();
    if (!viewport) return;

    viewport.scrollTo({
      top: viewport.scrollHeight,
      behavior,
    });
  };

  const queueScrollToBottomAfterLayout = () => {
    let settleFrameId = 0;
    const frameId = window.requestAnimationFrame(() => {
      scrollToBottom("auto");
      settleFrameId = window.requestAnimationFrame(() => {
        scrollToBottom("auto");
      });
    });
    const timeoutId = window.setTimeout(() => {
      scrollToBottom("auto");
    }, 320);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.cancelAnimationFrame(settleFrameId);
      window.clearTimeout(timeoutId);
    };
  };

  useEffect(() => {
    const viewport = getScrollViewport();
    if (!viewport) return;

    const handleScroll = () => {
      const atBottom = isScrolledToBottom(viewport);
      shouldStickToBottomRef.current = atBottom;

      if (atBottom) {
        setNewMessagesCount(0);
      }
    };

    handleScroll();
    viewport.addEventListener("scroll", handleScroll, { passive: true });

    const cleanupQueuedScroll = queueScrollToBottomAfterLayout();

    return () => {
      cleanupQueuedScroll();
      viewport.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    previousMessageCountRef.current = conversation.messages.length;
    initialMessageCountRef.current = conversation.messages.length;
    shouldStickToBottomRef.current = true;
    setNewMessagesCount(0);
    setSuggestionUnlocked(false);

    return queueScrollToBottomAfterLayout();
  }, [draftKey]);

  useEffect(() => {
    const previousMessageCount = previousMessageCountRef.current;
    const nextMessageCount = conversation.messages.length;

    if (nextMessageCount <= previousMessageCount) {
      previousMessageCountRef.current = nextMessageCount;
      return;
    }

    const addedMessagesCount = nextMessageCount - previousMessageCount;

    // Unlock the suggestion panel the first time a new customer message arrives
    // after the agent has sent at least one message since opening the conversation.
    if (!suggestionUnlocked && nextMessageCount > initialMessageCountRef.current) {
      const newMessages = conversation.messages.slice(previousMessageCount);
      const hasNewCustomerMessage = newMessages.some((m) => m.role === "customer");
      if (hasNewCustomerMessage) {
        setSuggestionUnlocked(true);
      }
    }

    if (shouldStickToBottomRef.current) {
      const frameId = window.requestAnimationFrame(() => {
        scrollToBottom("smooth");
      });

      setNewMessagesCount(0);
      previousMessageCountRef.current = nextMessageCount;

      return () => window.cancelAnimationFrame(frameId);
    }

    setNewMessagesCount((currentCount) => currentCount + addedMessagesCount);
    previousMessageCountRef.current = nextMessageCount;
  }, [conversation.messages]);

  useEffect(() => {
    if (!conversation.isCustomerTyping || !shouldStickToBottomRef.current) return;

    const frameId = window.requestAnimationFrame(() => {
      scrollToBottom("smooth");
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [conversation.isCustomerTyping]);

  useEffect(() => {
    if (!scrollToBottomTrigger) return;
    // Give the DOM a frame to render appendContent before scrolling
    const frameId = window.requestAnimationFrame(() => {
      shouldStickToBottomRef.current = true;
      scrollToBottom("smooth");
    });
    return () => window.cancelAnimationFrame(frameId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollToBottomTrigger]);

  const handleJumpToLatest = () => {
    shouldStickToBottomRef.current = true;
    setNewMessagesCount(0);
    scrollToBottom("smooth");
  };

  useEffect(() => {
    setSuggestionRefreshKey(0);
    setSuggestionEditPrompt("");
    setEditedInlineSuggestion(null);
    setSuggestionAccordionValue("ai-suggestion");
    setIsSuggestionEditorOpen(false);
    setIsSuggestionAdded(false);
    setSelectedSuggestionIndex(null);
    setPostActionSuggestion(null);
    setOpenedTicketId(null);
  }, [latestCustomerMessage?.id, draftKey]);

  useEffect(() => {
    if (!shouldShowSuggestion) {
      return;
    }

    if (suggestionAccordionValue !== "ai-suggestion" && !isSuggestionEditorOpen) {
      return;
    }

    shouldStickToBottomRef.current = true;
    return queueScrollToBottomAfterLayout();
  }, [isSuggestionEditorOpen, shouldShowSuggestion, suggestionAccordionValue]);

  useEffect(() => {
    if (draft.trim().length === 0) {
      setIsSuggestionAdded(false);
    setSelectedSuggestionIndex(null);
    }
  }, [draft]);

  const activeSuggestedReply = postActionSuggestion ?? inlineSuggestion?.suggestedReply ?? "";

  // When a post-action suggestion is set, open the accordion and trigger the entrance animation.
  useEffect(() => {
    if (!postActionSuggestion) return;
    setSuggestionAccordionValue("ai-suggestion");
    setPostActionAnimKey((k) => k + 1);
    setIsSuggestionAdded(false);
    setSelectedSuggestionIndex(null);
  }, [postActionSuggestion]);

  // When forcedSuggestedReply prop changes to a non-null value, inject it as the post-action suggestion.
  useEffect(() => {
    if (!forcedSuggestedReply) return;
    setPostActionSuggestion(forcedSuggestedReply);
  }, [forcedSuggestedReply]);

  const handleUseSuggestion = () => {
    if (!activeSuggestedReply || isSuggestionAdded) return;

    setDraft(activeSuggestedReply);
    setIsSuggestionAdded(true);
    onConversationChange?.({
      ...conversation,
      draft: activeSuggestedReply,
    });
    textareaRef.current?.focus({ preventScroll: true });
  };

  const handleCycleSuggestion = (direction: -1 | 1) => {
    if (suggestionVariants.length <= 1) return;

    setSuggestionRefreshKey((currentValue) => currentValue + direction);
    setSuggestionEditPrompt("");
    setEditedInlineSuggestion(null);
    setSuggestionAccordionValue("ai-suggestion");
    setIsSuggestionEditorOpen(false);
    setIsSuggestionAdded(false);
    setSelectedSuggestionIndex(null);
  };

  const handleOpenSuggestionEditor = () => {
    setSuggestionAccordionValue("ai-suggestion");
    setIsSuggestionEditorOpen(true);
  };

  const handleApplySuggestionEdit = () => {
    const nextInstruction = suggestionEditPrompt.trim();
    if (!inlineSuggestion || !nextInstruction) return;

    setEditedInlineSuggestion(applySuggestionEdit(inlineSuggestion, nextInstruction, conversation));
    setSuggestionEditPrompt("");
    setIsSuggestionEditorOpen(false);
    setIsSuggestionAdded(false);
    setSelectedSuggestionIndex(null);
  };

  const handleOpenSuggestionAction = (action: SuggestionAction) => {
    if (action.ticketId) {
      setOpenedTicketId(action.ticketId);
    }
    onOpenDeskPanel?.({ initialTab: action.initialTab, ticketId: action.ticketId });
  };

  const handleClearDraft = () => {
    setDraft("");
    onConversationChange?.({
      ...conversation,
      draft: "",
    });
    textareaRef.current?.focus({ preventScroll: true });
  };

  const handleSend = (replyChannel: CustomerChannel = activeChannel) => {
    if (replyChannel !== activeChannel) {
      onSelectChannel(replyChannel);
    }

    const nextDraft = draft.trim();
    if (!nextDraft) return;

    const nextConversation: SharedConversationData = {
      ...conversation,
      draft: "",
      isCustomerTyping: true,
      messages: [
        ...conversation.messages,
        {
          id: conversation.messages.reduce((maxId, message) => Math.max(maxId, message.id), 0) + 1,
          role: "agent",
          content: nextDraft,
          time: formatConversationTimestamp(new Date()),
          channel: replyChannel,
        },
      ],
    };

    setDraft("");
    onConversationChange?.(nextConversation, replyChannel);
    textareaRef.current?.blur();
  };

  return (
    <div ref={containerRef} className={cn("relative flex min-h-0 flex-1 flex-row", className)}>
      <div className={cn("relative flex min-h-0 flex-col overflow-hidden", hideTranscript ? "w-0 pointer-events-none overflow-hidden" : "flex-1")}>

        {/* Narrow-mode tabs — shown below the header when width < 640 and AI panel is active */}
        {isNarrowPanel && showAiPanel && (
          <div className="shrink-0 flex border-b border-border bg-background">
            {(["conversation", "copilot"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setNarrowTab(tab)}
                className={cn(
                  "relative flex items-center gap-1.5 px-5 py-2.5 text-[13px] font-medium capitalize transition-colors",
                  narrowTab === tab ? "text-[#166CCA]" : "text-[#7A7A7A] hover:text-[#333333]",
                )}
              >
                {tab}
                {tab === "copilot" && aiNewCount > 0 && (
                  <span className={cn(
                    "inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-semibold",
                    narrowTab === "copilot" ? "bg-[#EBF4FD] text-[#166CCA]" : "bg-[#F2F4F7] text-[#667085]",
                  )}>
                    {aiNewCount}
                  </span>
                )}
                {narrowTab === tab && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full bg-[#166CCA]" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Conversation view — hidden on copilot tab when narrow */}
        {(!isNarrowPanel || !showAiPanel || narrowTab === "conversation") && (
        <div className="relative min-h-0 flex-1 flex flex-col overflow-hidden">
          {/* Absolute overlay — e.g. transcript toggle button in top-right of voice area */}
          {isVoiceChannel && voiceContentOverlay && (
            <div className="absolute top-3 right-3 z-10 pointer-events-none">
              <div className="pointer-events-auto">{voiceContentOverlay}</div>
            </div>
          )}
          <div className={cn("flex-1 min-h-0 overflow-hidden", isVoiceChannel && voiceRightPanel ? "flex" : "flex flex-col")}>
          <div ref={scrollAreaRef} className="flex-1 min-h-0 overflow-y-auto py-6" style={{ paddingBottom: isPendingAcceptance ? 0 : 120, ...(scrollTopPadding ? { paddingTop: scrollTopPadding } : {}) }}>
            <div className={cn("space-y-6 px-6", isWidePanel ? "m-8 mx-auto max-w-[800px]" : "m-8")}>
            <div className="text-left">
              <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                {conversation.timelineLabel}
              </span>
            </div>

            {isVoiceChannel ? (
              <>
                {/* Case-specific live panel (e.g. sales intelligence form) */}
                {voiceTopContent}
                {/* Internal notes generated by completed voice actions — shown above the transcript */}
                {conversation.messages.filter((m) => m.isInternal).map((message) => (
                  <div key={message.id} className="rounded-xl border border-dashed border-[#D0D5DD] bg-[#F9FAFB] overflow-hidden">
                    <button
                      type="button"
                      className={cn(
                        "flex w-full items-start gap-2.5 px-3.5 py-2.5 text-left",
                        message.ticket ? "cursor-pointer hover:bg-[#F3F4F6] transition-colors" : "cursor-default",
                      )}
                      onClick={() => {
                        if (!message.ticket) return;
                        setExpandedNoteIds((prev) => {
                          const next = new Set(prev);
                          if (next.has(message.id)) { next.delete(message.id); } else { next.add(message.id); }
                          return next;
                        });
                      }}
                    >
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E4E7EC]">
                        <NotebookPen className="h-2.5 w-2.5 text-[#667085]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#667085]">Internal Note</span>
                          <span className="text-[10px] text-[#98A2B3]">{formatConversationMessageTimestamp(message.time)}</span>
                        </div>
                        <p className="text-[13px] leading-5 text-[#344054]">{message.content}</p>
                      </div>
                      {message.ticket && (
                        <ChevronDown className={cn("mt-0.5 h-4 w-4 shrink-0 text-[#98A2B3] transition-transform", expandedNoteIds.has(message.id) && "rotate-180")} />
                      )}
                    </button>
                    {message.ticket && (
                      <div
                        className={cn(
                          "grid transition-all duration-200 ease-out",
                          expandedNoteIds.has(message.id) ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                        )}
                      >
                        <div className="overflow-hidden">
                          <div className="border-t border-dashed border-[#D0D5DD] p-2">
                            <InlineTicketRecord ticket={message.ticket} isOpen onToggle={() => {}} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {/* AI Suggested Opening Lines — shown at the start of a voice call */}
                {showOpeningLines && (
                  <div className="rounded-xl border border-[#E4E7EC] bg-white overflow-hidden">
                    <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#667085]">💡 AI Suggested Opening Lines</p>
                      <button
                        type="button"
                        onClick={() => setOpeningLinesDismissed(true)}
                        className="flex h-5 w-5 items-center justify-center rounded-full text-[#98A2B3] transition-colors hover:bg-[#F3F4F6] hover:text-[#667085]"
                        aria-label="Dismiss opening lines"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                    <ul className="flex flex-col gap-2 px-4 pb-4">
                      {voiceOpeningLines!.map((line, i) => (
                        <li
                          key={i}
                          role="button"
                          onClick={() => {
                            onVoiceOpeningLineClick?.();
                            setOpeningLinesDismissed(true);
                          }}
                          className="rounded-lg border border-[#E4E7EC] bg-[#F9FAFB] px-3 py-2.5 text-[13px] text-[#344054] leading-relaxed cursor-pointer hover:bg-[#EFF6FF] hover:border-[#BFDBFE] transition-colors"
                        >
                          <span className="font-medium">{line.intro}</span>{" "}
                          <span className="text-[#667085]">{line.question}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : isEmailChannel ? (
              <EmailConversationView
                conversation={conversation}
                customerId={customerId}
                draft={draft}
                hasDraft={hasDraft}
                isDraftFocused={isDraftFocused}
                textareaRef={textareaRef}
                onDraftChange={(nextDraft) => {
                  setDraft(nextDraft);
                  onConversationChange?.({
                    ...conversation,
                    draft: nextDraft,
                  }, activeChannel);
                }}
                onDraftFocus={() => setIsDraftFocused(true)}
                onDraftBlur={() => setIsDraftFocused(false)}
                onClearDraft={handleClearDraft}
                onSend={() => handleSend("email")}
              />
            ) : (
              <>
                {/* Conversation Started — AI handoff context */}
                <div className="py-3">
                  <div className="mb-0.5 flex items-baseline gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#98A2B3]">Conversation Started</span>
                    <span className="text-[10px] text-[#98A2B3]">
                      {conversation.messages[0] ? `Today, ${conversation.messages[0].time.replace(/\s/g, "")}` : ""} | {getConversationChannelLabel(activeChannel)}
                    </span>
                  </div>
                  <p className="text-sm leading-6 text-[#98A2B3]">
                    {customerFirstName} was assisted by the AI attendant and requested to speak with a live agent.
                  </p>
                </div>

                {conversation.messages.filter((message) =>
                  // In review mode: hide handoff cards/messages but keep isInternal action notes
                  // (those are injected by the agent during supervise and must be visible)
                  isPendingAcceptance ? !(message.isHandoffCard || message.isHandoffMessage) : true
                ).map((message) => {
                  const isNewMessage = !seenMessageIdsRef.current.has(message.id);
                  if (isNewMessage) seenMessageIdsRef.current.add(message.id);
                  const appliedTags = messageTags[message.id] ?? [];
                  const isMsgAgent = message.role === "agent";
                  const isMsgLatest = message.id === latestNonInternalMessage?.id;
                  // Bot messages have message.author set to the bot's name (e.g. "Jacob", "Aria", "Emily").
                  // These use the bot's avatar rather than the human agent's avatar.
                  const isBotMessage = isMsgAgent && !!message.author;
                  const BOT_AVATARS: Record<string, string> = {
                    Aria: "https://cdn.builder.io/api/v1/image/assets%2F9d3d716b4b844ab4bcf3267b33310813%2F054057b71e64441097a4902d7dcea754?format=webp&width=800&height=1200",
                    Jacob: "https://cdn.builder.io/api/v1/image/assets%2F9d3d716b4b844ab4bcf3267b33310813%2F9f1a8ec85d5f478b9a015a2b7eece268?format=webp&width=800&height=1200",
                    Emily: `${import.meta.env.BASE_URL}emily-avatar.jpg`,
                  };
                  const effectiveAvatarUrl = isBotMessage
                    ? (BOT_AVATARS[message.author!] ?? null)
                    : agentAvatarUrl ?? null;
                  const msgName = isMsgAgent && !isBotMessage ? agentFullName : conversation.customerName;
                  const msgInitials = isBotMessage
                    ? (message.author ?? "").slice(0, 2).toUpperCase()
                    : msgName.split(" ").filter(Boolean).map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
                  const messageEl = (
                  <div
                    key={message.id}
                    className={cn(
                      "space-y-3 transition-all duration-300 ease-out",
                      isNewMessage && "animate-in fade-in slide-in-from-bottom-3",
                    )}
                  >
                    {/* Handoff notice card — internal, agent-only green card */}
                    {message.isHandoffCard && (
                      <div className="rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] p-3 animate-in fade-in duration-300">
                        <div className="mb-1.5 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {message.author === "Emily" ? (
                              <img src={`${import.meta.env.BASE_URL}emily-avatar.jpg`} alt="Emily avatar" className="h-5 w-5 rounded-full object-cover shrink-0" />
                            ) : (
                              <img
                                src={message.author === "Jacob"
                                  ? "https://cdn.builder.io/api/v1/image/assets%2F9d3d716b4b844ab4bcf3267b33310813%2F9f1a8ec85d5f478b9a015a2b7eece268?format=webp&width=800&height=1200"
                                  : "https://cdn.builder.io/api/v1/image/assets%2F9d3d716b4b844ab4bcf3267b33310813%2F054057b71e64441097a4902d7dcea754?format=webp&width=800&height=1200"}
                                alt={`${message.author ?? "Aria"} avatar`}
                                className="h-5 w-5 rounded-full object-cover shrink-0"
                              />
                            )}
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#166744]">{message.author ?? "Aria"}</p>
                          </div>
                          <span className="rounded-full border border-[#24943E] px-2 py-0.5 text-[10px] font-medium text-[#166744]">Internal note</span>
                        </div>
                        <p className="text-[13px] font-medium leading-5 text-[#166744]">{message.content}</p>
                      </div>
                    )}

                    {/* Internal note */}
                    {message.isInternal && !message.isHandoffCard && (
                      <div className="rounded-xl border border-dashed border-[#D0D5DD] bg-[#F9FAFB] overflow-hidden">
                        <button
                          type="button"
                          className={cn(
                            "flex w-full items-start gap-2.5 px-3.5 py-2.5 text-left",
                            message.ticket ? "cursor-pointer hover:bg-[#F3F4F6] transition-colors" : "cursor-default",
                          )}
                          onClick={() => {
                            if (!message.ticket) return;
                            setExpandedNoteIds((prev) => {
                              const next = new Set(prev);
                              if (next.has(message.id)) { next.delete(message.id); } else { next.add(message.id); }
                              return next;
                            });
                          }}
                        >
                          <div className="shrink-0 h-7 w-7 rounded-full bg-[#F2F4F7] border border-[#E4E7EC] flex items-center justify-center">
                            <NotebookPen className="h-3.5 w-3.5 text-[#667085]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#667085]">Internal Note</span>
                              <span className="text-[10px] text-[#98A2B3]">{formatConversationMessageTimestamp(message.time)}</span>
                            </div>
                            <p className="text-[13px] leading-5 text-[#344054]">{message.content}</p>
                          </div>
                          {message.ticket && (
                            <ChevronDown className={cn("mt-0.5 h-4 w-4 shrink-0 text-[#98A2B3] transition-transform", expandedNoteIds.has(message.id) && "rotate-180")} />
                          )}
                        </button>
                        {message.ticket && (
                          <div className={cn("grid transition-all duration-200 ease-out", expandedNoteIds.has(message.id) ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                            <div className="overflow-hidden">
                              <div className="border-t border-dashed border-[#D0D5DD] p-2">
                                <InlineTicketRecord ticket={message.ticket} isOpen onToggle={() => {}} />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {/* Chat bubble — tag options live inside bubble so hover never breaks */}
                    {!message.isInternal && (
                      <div className={cn("group/msg flex items-start gap-2.5 py-1", isMsgAgent && "justify-end")}>
                        {!isMsgAgent && (
                          <div className="shrink-0 mt-0.5 h-7 w-7 rounded-full bg-[#EBF4FD] border border-[#BFDBFE] flex items-center justify-center text-[10px] font-bold text-[#166CCA] select-none">
                            {msgInitials}
                          </div>
                        )}
                        <div className={cn("max-w-[75%]", isMsgAgent && "flex flex-col items-end")}>
                          {/* Bubble + absolutely-positioned tag strip so hover never shifts layout */}
                          <div className="relative">
                            <div className={cn(
                              "px-4 pt-2.5 pb-2",
                              isMsgAgent
                                ? "rounded-2xl rounded-tr-sm bg-[#166CCA]"
                                : cn("rounded-2xl rounded-tl-sm bg-[#F2F4F7]", isMsgLatest && "ring-2 ring-[#166CCA]/30"),
                            )}>
                              <p className={cn("text-[13px] leading-relaxed", isMsgAgent ? "text-white" : "text-[#344054]")}>
                                {message.content}
                              </p>
                              {appliedTags.length > 0 && (
                                <div className={cn("mt-2 flex flex-wrap gap-1", isMsgAgent && "justify-end")}>
                                  {appliedTags.map((tagId) => {
                                    const tag = MESSAGE_TAG_DEFS.find((t) => t.id === tagId);
                                    return tag ? (
                                      <span key={tagId} className={cn(
                                        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                                        isMsgAgent ? "border-white/30 bg-white/20 text-white" : tag.activeClass,
                                      )}>{tag.label}</span>
                                    ) : null;
                                  })}
                                </div>
                              )}
                            </div>
                            {/* Tag options — absolute, below the bubble, no layout shift */}
                            <div className={cn(
                              "absolute top-full mt-1 z-10 opacity-0 pointer-events-none group-hover/msg:opacity-100 group-hover/msg:pointer-events-auto transition-opacity duration-150",
                              isMsgAgent ? "right-0" : "left-0",
                            )}>
                              <div className="flex flex-wrap items-center gap-1 rounded-xl border border-black/10 bg-white shadow-sm px-3 py-1.5">
                                <span className="text-[10px] mr-0.5 text-[#C4C9D4]">Tag:</span>
                                {MESSAGE_TAG_DEFS.map((tag) => {
                                  const isApplied = appliedTags.includes(tag.id);
                                  return (
                                    <button
                                      key={tag.id}
                                      type="button"
                                      onClick={() => handleToggleTag(message.id, tag.id)}
                                      className={cn(
                                        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors",
                                        isApplied ? tag.activeClass : tag.ghostClass,
                                      )}
                                    >{tag.label}</button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                          <p className={cn("mt-1 text-[10px] text-[#98A2B3]", isMsgAgent ? "mr-1" : "ml-1")}>
                            {formatConversationMessageTimestamp(message.time)} · {getConversationChannelLabel(message.channel ?? activeChannel)}
                          </p>
                          {message.sentiment === "frustrated" && (
                            <div className={cn("mt-0.5 flex items-center gap-1 text-xs font-medium text-[#A37A00]", isMsgAgent && "justify-end")}>
                              <AlertTriangle className="h-3.5 w-3.5" />
                              Frustrated sentiment detected
                            </div>
                          )}
                          {message.sentiment === "critical" && (
                            <div className={cn("mt-0.5 flex items-center gap-1 text-xs font-medium text-[#C71D1A]", isMsgAgent && "justify-end")}>
                              <AlertTriangle className="h-3.5 w-3.5" />
                              Critical sentiment detected
                            </div>
                          )}
                          {message.sentiment === "positive" && (
                            <div className={cn("mt-0.5 flex items-center gap-1 text-xs font-medium text-[#208337]", isMsgAgent && "justify-end")}>
                              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 13s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
                              Positive sentiment detected
                            </div>
                          )}
                        </div>
                        {isMsgAgent && (
                          effectiveAvatarUrl ? (
                            <img
                              src={effectiveAvatarUrl}
                              alt={isBotMessage ? `${message.author} avatar` : "Agent avatar"}
                              className="shrink-0 mt-0.5 h-7 w-7 rounded-full object-cover select-none"
                            />
                          ) : (
                            <div className="shrink-0 mt-0.5 h-7 w-7 rounded-full bg-[#C5DEF5] flex items-center justify-center text-[10px] font-bold text-[#1260B0] select-none">
                              {msgInitials}
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                  );
                  return messageEl;
                })}

                {/* Suggested Next Steps — always inline */}
                {!hideInput && agentTasks.length > 0 && (() => {
                  const assignmentEntry = getCustomerAssignmentEntry(conversation.customerName);
                  const taskSummary = assignmentEntry?.summary ?? "I've reviewed the conversation and identified the key actions needed to resolve this case. Here are my suggested next steps, or feel free to ask for more assistance.";
                  const nextStepsContent = (
                  <div className="overflow-hidden rounded-2xl border border-black/10 bg-[#F8F8F9]">
                    <div className="px-4 pt-3 pb-2">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#333333]">Suggested Next Steps</span>
                      <p className="mt-1.5 text-[12px] leading-relaxed text-[#667085]">{taskSummary}</p>
                    </div>
                    <div className="px-3 pb-2 pt-1 space-y-1.5" id="inline-task-list-main">
                      {agentTasks.map((task) => {
                        const progress = taskProgress[task.id];
                        const isChecked = checkedTaskIds.has(task.id);
                        const steps = TASK_STEPS[task.id] ?? [];
                        return (
                          <div
                            key={task.id}
                            className={cn(
                              "rounded-xl border border-black/[0.06] bg-white overflow-hidden transition-[opacity,transform] duration-300 ease-out",
                              revealedTaskIds.has(task.id)
                                ? "opacity-100 translate-y-0"
                                : "opacity-0 translate-y-2 pointer-events-none",
                            )}
                          >
                            <div className="flex items-center gap-3 px-3 py-2.5">
                              <button
                                type="button"
                                onClick={() => handleToggleTaskCheck(task.id)}
                                className={cn(
                                  "shrink-0 h-[18px] w-[18px] rounded-[5px] border-2 flex items-center justify-center transition-colors",
                                  isChecked ? "border-[#166CCA] bg-[#166CCA]" : "border-[#D0D5DD] bg-white hover:border-[#166CCA]",
                                )}
                              >
                                {isChecked && <Check className="h-2.5 w-2.5 text-white" />}
                              </button>
                              <span className={cn(
                                "flex-1 text-[13px] leading-5 text-[#111827] transition-colors",
                                isChecked && progress && progress.stepIndex >= steps.length - 1 && "line-through text-[#9CA3AF]",
                              )}>
                                {task.label}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setAgentTasks((prev) => prev.filter((t) => t.id !== task.id));
                                  setRevealedTaskIds((prev) => { const next = new Set(prev); next.delete(task.id); return next; });
                                  setTaskProgress((p) => { const { [task.id]: _, ...rest } = p; return rest; });
                                }}
                                className="shrink-0 text-[#AAAAAA] hover:text-[#EF4444] transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            {isChecked && progress && (
                              <div className="border-t border-black/[0.05] px-3 pb-3 pt-2.5">
                                <p className="mb-2.5 text-[12px] font-semibold text-[#111827]">
                                  {TASK_ACTION_TITLES[task.id] ?? `${task.label}...`}
                                </p>
                                <div className="space-y-2.5">
                                  {steps.map((step, stepIdx) => {
                                    const isStepCompleted = stepIdx < progress.stepIndex;
                                    const isStepInProgress = stepIdx === progress.stepIndex;
                                    const isPaused = progress.paused && isStepInProgress;
                                    const hoverKey = `inline-${task.id}-${stepIdx}`;
                                    const isHovered = hoveredProgressStep === hoverKey;
                                    return (
                                      <div
                                        key={stepIdx}
                                        className="flex items-center gap-2.5"
                                        onMouseEnter={() => isStepInProgress && setHoveredProgressStep(hoverKey)}
                                        onMouseLeave={() => setHoveredProgressStep(null)}
                                      >
                                        <div className="shrink-0 h-6 w-6 flex items-center justify-center">
                                          {isStepCompleted ? (
                                            <div className="h-6 w-6 rounded-full bg-[#0B9A8A] flex items-center justify-center">
                                              <Check className="h-3.5 w-3.5 text-white" />
                                            </div>
                                          ) : isStepInProgress ? (
                                            (isHovered || isPaused) ? (
                                              <button
                                                type="button"
                                                onClick={() => toggleTaskPause(task.id)}
                                                className="h-6 w-6 rounded-full border-2 border-[#0B9A8A] flex items-center justify-center hover:bg-[#F0FDFB] transition-colors"
                                              >
                                                {isPaused
                                                  ? <Play className="h-2.5 w-2.5 text-[#0B9A8A] fill-[#0B9A8A]" />
                                                  : <Pause className="h-2.5 w-2.5 text-[#0B9A8A] fill-[#0B9A8A]" />}
                                              </button>
                                            ) : (
                                              <div className="h-6 w-6 rounded-full border-2 border-[#E5E7EB] border-t-[#0B9A8A] animate-spin" />
                                            )
                                          ) : (
                                            <div className="h-6 w-6 rounded-full border-2 border-[#E5E7EB]" />
                                          )}
                                        </div>
                                        <span className={cn(
                                          "text-[13px] leading-5",
                                          isStepCompleted ? "text-[#6B7280]" : "text-[#111827]",
                                        )}>
                                          {step}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {/* Perform All Actions — shown when at least one task hasn't started yet */}
                    {agentTasks.some((t) => !taskProgress[t.id]) && (
                      <div className="px-3 pb-2.5 pt-1">
                        <button
                          type="button"
                          onClick={handlePerformAllActions}
                          className="rounded-md bg-[#166CCA] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#1260B0] transition-colors"
                        >
                          Perform All Actions
                        </button>
                      </div>
                    )}
                    {/* Inline Copilot action input */}
                    <div className="border-t border-black/[0.06] px-3 py-2.5">
                      <div className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
                        {inlineActionThinking ? (
                          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-[#166CCA]" />
                        ) : (
                          <Bot className="h-3.5 w-3.5 shrink-0 text-[#AAAAAA]" />
                        )}
                        <input
                          type="text"
                          value={inlineActionInput}
                          onChange={(e) => setInlineActionInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleInlineActionSubmit(); } }}
                          placeholder={inlineActionThinking ? "Working on it…" : "Ask Copilot to perform another action"}
                          disabled={inlineActionThinking}
                          className="min-w-0 flex-1 bg-transparent text-[13px] text-[#111827] placeholder:text-[#AAAAAA] focus:outline-none disabled:opacity-50"
                        />
                        <button
                          type="button"
                          onClick={handleInlineActionSubmit}
                          disabled={!inlineActionInput.trim() || inlineActionThinking}
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#EBF4FD] text-[#166CCA] transition-colors hover:bg-[#C5DEF5] disabled:pointer-events-none disabled:opacity-40"
                        >
                          <Send className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                  );
                  return nextStepsContent;
                })()
                }

                {/* Inline AI review card — shown in place of the green handoff note during pending-acceptance mode */}
                {isPendingAcceptance && (customerContext || aiConfidence !== undefined) && (
                  <div className="rounded-xl border border-[#BFDBFE] bg-[#EBF4FD] p-3 animate-in fade-in duration-300">
                    {/* Bot header */}
                    <div className="mb-1.5 flex items-center gap-2">
                      {botLabel === "Emily" ? (
                        <img src={`${import.meta.env.BASE_URL}emily-avatar.jpg`} alt="Emily avatar" className="h-5 w-5 rounded-full object-cover shrink-0" />
                      ) : (
                        <img
                          src={botLabel === "Jacob"
                            ? "https://cdn.builder.io/api/v1/image/assets%2F9d3d716b4b844ab4bcf3267b33310813%2F9f1a8ec85d5f478b9a015a2b7eece268?format=webp&width=800&height=1200"
                            : "https://cdn.builder.io/api/v1/image/assets%2F9d3d716b4b844ab4bcf3267b33310813%2F054057b71e64441097a4902d7dcea754?format=webp&width=800&height=1200"}
                          alt={`${botLabel ?? "Aria"} avatar`}
                          className="h-5 w-5 rounded-full object-cover shrink-0"
                        />
                      )}
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1260B0]">{botLabel ?? "Aria"}</p>
                    </div>

                    {/* Context text */}
                    {customerContext && (
                      <p className="text-[13px] font-medium leading-5 text-[#344054]">{customerContext}</p>
                    )}

                    {/* AI Confidence meter + Approve button */}
                    {aiConfidence !== undefined && (
                      inlineApprovePhase === "approving" ? (
                        <div className="mt-3 flex items-center gap-2">
                          <span className="text-[13px] font-medium text-[#344054]">Approving request</span>
                          <span className="flex items-center gap-0.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#166CCA] animate-bounce [animation-delay:0ms]" />
                            <span className="h-1.5 w-1.5 rounded-full bg-[#166CCA] animate-bounce [animation-delay:150ms]" />
                            <span className="h-1.5 w-1.5 rounded-full bg-[#166CCA] animate-bounce [animation-delay:300ms]" />
                          </span>
                        </div>
                      ) : inlineApprovePhase === "resolved" ? (
                        <div className="mt-3 flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-[#208337]" />
                          <span className="text-[12px] font-semibold text-[#208337]">Approved</span>
                        </div>
                      ) : (
                        <>
                          <div className="mt-3 rounded-lg border border-[#BFDBFE] bg-white px-3 py-2.5 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-semibold uppercase tracking-widest text-[#667085]">AI Confidence</span>
                              <span className="text-[12px] font-bold text-[#166CCA]">{aiConfidence}%</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-[#E4E7EC] overflow-hidden">
                              <div className="h-full rounded-full bg-gradient-to-r from-[#166CCA] to-[#4B96DA]" style={{ width: `${aiConfidence}%` }} />
                            </div>
                            {aiConfidenceReason && (
                              <p className="text-[10px] text-[#98A2B3] leading-relaxed">{aiConfidenceReason}</p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              inlineApproveTimersRef.current.forEach(clearTimeout);
                              inlineApproveTimersRef.current = [];
                              setInlineApprovePhase("approving");
                              inlineApproveTimersRef.current.push(
                                setTimeout(() => {
                                  setInlineApprovePhase("resolved");
                                  onAcceptAssignment?.();
                                }, 2800)
                              );
                            }}
                            className="mt-2 w-full rounded-lg border border-[#166CCA] bg-white px-3 py-2 text-[13px] font-semibold text-[#166CCA] hover:bg-[#EBF4FD] transition-colors"
                          >
                            Approve
                          </button>
                        </>
                      )
                    )}

                    {/* If no confidence data, just show a plain Approve button */}
                    {aiConfidence === undefined && (
                      <button
                        type="button"
                        onClick={() => onAcceptAssignment?.()}
                        className="mt-2 w-full rounded-lg border border-[#166CCA] bg-white px-3 py-2 text-[13px] font-semibold text-[#166CCA] hover:bg-[#EBF4FD] transition-colors"
                      >
                        Approve
                      </button>
                    )}
                  </div>
                )}

                {appendContent}

                {conversation.isCustomerTyping && (
                  <div className="py-3 flex items-start gap-3">
                    {/* Customer avatar */}
                    {(() => {
                      const initials = conversation.customerName.split(" ").filter(Boolean).map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
                      return (
                        <div className="mt-0.5 shrink-0 h-7 w-7 rounded-full bg-[#EBF4FD] border border-[#BFDBFE] flex items-center justify-center text-[10px] font-bold text-[#166CCA] select-none">
                          {initials}
                        </div>
                      );
                    })()}
                    <div>
                      <div className="mb-0.5 flex items-baseline gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#344054]">
                          {conversation.customerName.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 pt-1">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-[#6B7280]" />
                        <span className="h-2 w-2 animate-pulse rounded-full bg-[#6B7280] [animation-delay:120ms]" />
                        <span className="h-2 w-2 animate-pulse rounded-full bg-[#6B7280] [animation-delay:240ms]" />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          </div>
          {isVoiceChannel && voiceRightPanel && (
            <div className="shrink-0 min-h-0 overflow-hidden flex">
              {voiceRightPanel}
            </div>
          )}
        </div>

      </div>
        )} {/* end conversation view conditional */}

        {/* Copilot tab content — inline when narrow and copilot tab is active */}
        {isNarrowPanel && showAiPanel && narrowTab === "copilot" && (
          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="relative flex-1 min-h-0">
              <div ref={narrowAiScrollRef} onScroll={(e) => handleAiScroll(e.currentTarget)} className="h-full overflow-y-auto p-3 space-y-3">
                {isVoiceChannel && <VoiceAIGuidanceCard />}
                {shouldShowSuggestion && (inlineSuggestion || postActionSuggestion) && (
                  <div className="rounded-2xl border border-[#24943E] bg-[#EFFBF1] px-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
                    <Accordion type="single" collapsible value={suggestionAccordionValue} onValueChange={setSuggestionAccordionValue}>
                      <AccordionItem value="ai-suggestion" className="border-b-0">
                        <AccordionTrigger className="py-4 text-left hover:no-underline">
                          <div className="flex flex-1 items-center justify-between mr-2">
                            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#208337]">
                              <span>Suggested Response</span>
                            </div>
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <Button type="button" size="icon" variant="outline" className="h-7 w-7 rounded-full border-black/10 bg-white text-[#7A7A7A] hover:bg-white/70 hover:text-[#333333]" onClick={() => handleCycleSuggestion(-1)} disabled={suggestionVariants.length <= 1}><ChevronLeft className="h-3.5 w-3.5" /></Button>
                              <Button type="button" size="icon" variant="outline" className="h-7 w-7 rounded-full border-black/10 bg-white text-[#7A7A7A] hover:bg-white/70 hover:text-[#333333]" onClick={() => handleCycleSuggestion(1)} disabled={suggestionVariants.length <= 1}><ChevronRight className="h-3.5 w-3.5" /></Button>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-4">
                          <p key={postActionAnimKey} className="text-sm leading-6 text-[#25403B] animate-in fade-in duration-500">{activeSuggestedReply}</p>
                          {!isVoiceChannel && (
                            <div className="mt-4 flex flex-wrap gap-2">
                              <Button
                                type="button"
                                size="sm"
                                className={cn(
                                  "h-9 rounded-lg px-4",
                                  isSuggestionAdded
                                    ? "bg-[#EFFBF1] text-[#208337] hover:bg-[#EFFBF1]"
                                    : "bg-[#166CCA] text-white hover:bg-[#0A5E92]",
                                )}
                                onClick={handleUseSuggestion}
                                disabled={isSuggestionAdded}
                              >
                                {isSuggestionAdded ? <Check className="mr-2 h-4 w-4" /> : null}
                                {isSuggestionAdded ? "Added" : "Use response"}
                              </Button>
                              <Button type="button" size="sm" variant="outline" className="h-9 rounded-lg border-black/10 bg-white px-4 text-[#333333] hover:bg-[#F8F8F9]" onClick={handleOpenSuggestionEditor}>Edit</Button>
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                )}
                {agentTasks.length > 0 && !suppressAgentTasks && (
                  <div className="overflow-hidden rounded-2xl border border-black/10 bg-[#F8F8F9]">
                    <div className="px-4 pt-3 pb-2">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#333333]">Suggested Next Steps</span>
                      <p className="mt-1.5 text-[12px] leading-relaxed text-[#667085]">
                        {getCustomerAssignmentEntry(conversation.customerName)?.summary ?? "I've reviewed the conversation and identified the key actions needed to resolve this case. Here are my suggested next steps, or feel free to ask for more assistance."}
                      </p>
                    </div>
                    <div className="px-3 pb-3 pt-1 space-y-1.5">
                      {agentTasks.map((task) => {
                        const progress = taskProgress[task.id];
                        const isChecked = checkedTaskIds.has(task.id);
                        const steps = TASK_STEPS[task.id] ?? [];
                        return (
                          <div
                            key={task.id}
                            className={cn(
                              "rounded-xl border border-black/[0.06] bg-white overflow-hidden transition-[opacity,transform] duration-300 ease-out",
                              revealedTaskIds.has(task.id)
                                ? "opacity-100 translate-y-0"
                                : "opacity-0 translate-y-2 pointer-events-none",
                            )}
                          >
                            <div className="flex items-center gap-3 px-3 py-2.5">
                              <button
                                type="button"
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={() => handleToggleTaskCheck(task.id)}
                                className={cn(
                                  "shrink-0 h-[18px] w-[18px] rounded-[5px] border-2 flex items-center justify-center transition-colors",
                                  isChecked ? "border-[#166CCA] bg-[#166CCA]" : "border-[#D0D5DD] bg-white hover:border-[#166CCA]",
                                )}
                              >
                                {isChecked && <Check className="h-2.5 w-2.5 text-white" />}
                              </button>
                              <span className={cn(
                                "flex-1 text-[13px] leading-5 text-[#111827] transition-colors",
                                isChecked && progress && progress.stepIndex >= steps.length - 1 && "line-through text-[#9CA3AF]",
                              )}>
                                {task.label}
                              </span>
                              <button
                                type="button"
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={() => {
                                  setAgentTasks((prev) => prev.filter((t) => t.id !== task.id));
                                  setRevealedTaskIds((prev) => { const next = new Set(prev); next.delete(task.id); return next; });
                                  setTaskProgress((p) => { const { [task.id]: _, ...rest } = p; return rest; });
                                }}
                                className="shrink-0 text-[#AAAAAA] hover:text-[#EF4444] transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            {isChecked && progress && (
                              <div className="border-t border-black/[0.05] px-3 pb-3 pt-2.5">
                                <p className="mb-2.5 text-[12px] font-semibold text-[#111827]">
                                  {TASK_ACTION_TITLES[task.id] ?? `${task.label}...`}
                                </p>
                                <div className="space-y-2.5">
                                  {steps.map((step, stepIdx) => {
                                    const isStepCompleted = stepIdx < progress.stepIndex;
                                    const isStepInProgress = stepIdx === progress.stepIndex;
                                    const isPaused = progress.paused && isStepInProgress;
                                    const hoverKey = `${task.id}-${stepIdx}`;
                                    const isHovered = hoveredProgressStep === hoverKey;
                                    return (
                                      <div
                                        key={stepIdx}
                                        className="flex items-center gap-2.5"
                                        onMouseEnter={() => isStepInProgress && setHoveredProgressStep(hoverKey)}
                                        onMouseLeave={() => setHoveredProgressStep(null)}
                                      >
                                        <div className="shrink-0 h-6 w-6 flex items-center justify-center">
                                          {isStepCompleted ? (
                                            <div className="h-6 w-6 rounded-full bg-[#0B9A8A] flex items-center justify-center">
                                              <Check className="h-3.5 w-3.5 text-white" />
                                            </div>
                                          ) : isStepInProgress ? (
                                            (isHovered || isPaused) ? (
                                              <button
                                                type="button"
                                                onMouseDown={(e) => e.stopPropagation()}
                                                onClick={() => toggleTaskPause(task.id)}
                                                className="h-6 w-6 rounded-full border-2 border-[#0B9A8A] flex items-center justify-center hover:bg-[#F0FDFB] transition-colors"
                                              >
                                                {isPaused
                                                  ? <Play className="h-2.5 w-2.5 text-[#0B9A8A] fill-[#0B9A8A]" />
                                                  : <Pause className="h-2.5 w-2.5 text-[#0B9A8A] fill-[#0B9A8A]" />}
                                              </button>
                                            ) : (
                                              <div className="h-6 w-6 rounded-full border-2 border-[#E5E7EB] border-t-[#0B9A8A] animate-spin" />
                                            )
                                          ) : (
                                            <div className="h-6 w-6 rounded-full border-2 border-[#E5E7EB]" />
                                          )}
                                        </div>
                                        <span className={cn(
                                          "text-[13px] leading-5",
                                          isStepCompleted ? "text-[#6B7280]" : "text-[#111827]",
                                        )}>
                                          {step}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {/* Perform All Actions — shown when at least one task hasn't started yet */}
                    {agentTasks.some((t) => !taskProgress[t.id]) && (
                      <div className="px-3 pb-2.5 pt-1">
                        <button
                          type="button"
                          onClick={handlePerformAllActions}
                          className="rounded-md bg-[#166CCA] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#1260B0] transition-colors"
                        >
                          Perform All Actions
                        </button>
                      </div>
                    )}
                    {/* Inline Copilot action input */}
                    <div className="border-t border-black/[0.06] px-3 py-2.5">
                      <div className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
                        {inlineActionThinking ? (
                          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-[#166CCA]" />
                        ) : (
                          <Bot className="h-3.5 w-3.5 shrink-0 text-[#AAAAAA]" />
                        )}
                        <input
                          type="text"
                          value={inlineActionInput}
                          onChange={(e) => setInlineActionInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleInlineActionSubmit(); } }}
                          placeholder={inlineActionThinking ? "Working on it…" : "Ask Copilot to perform another action"}
                          disabled={inlineActionThinking}
                          className="min-w-0 flex-1 bg-transparent text-[13px] text-[#111827] placeholder:text-[#AAAAAA] focus:outline-none disabled:opacity-50"
                        />
                        <button
                          type="button"
                          onClick={handleInlineActionSubmit}
                          disabled={!inlineActionInput.trim() || inlineActionThinking}
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#EBF4FD] text-[#166CCA] transition-colors hover:bg-[#C5DEF5] disabled:pointer-events-none disabled:opacity-40"
                        >
                          <Send className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {aiNewCount > 0 && (
                <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center px-3">
                  <button
                    type="button"
                    onClick={handleAiChipClick}
                    className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-[#111827] px-3 py-1.5 text-[11px] font-medium text-white shadow-lg hover:bg-[#1F2937] transition-colors"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[#0B9A8A]" />
                    {aiNewCount} new message{aiNewCount !== 1 ? "s" : ""}
                  </button>
                </div>
              )}
            </div>
            {/* Copilot input */}
            <div className="shrink-0 border-t border-black/[0.06] p-3">
              <div className="flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 py-2 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
                {copilotThinking ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#166CCA]" />
                ) : (
                  <Bot className="h-4 w-4 shrink-0 text-[#AAAAAA]" />
                )}
                <input
                  type="text"
                  value={copilotInput}
                  onChange={(e) => setCopilotInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleCopilotSubmit(); } }}
                  placeholder={copilotThinking ? "Thinking…" : "Ask Copilot anything..."}
                  disabled={copilotThinking}
                  className="min-w-0 flex-1 bg-transparent text-[13px] text-[#111827] placeholder:text-[#AAAAAA] focus:outline-none disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={handleCopilotSubmit}
                  disabled={!copilotInput.trim() || copilotThinking}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#EBF4FD] text-[#166CCA] transition-colors hover:bg-[#C5DEF5] disabled:pointer-events-none disabled:opacity-40"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

      {/* "N new messages" chip — portalled so it escapes stacking context and always sits
          above the portalled footer. z-[10001] keeps it above the focused footer (10000). */}
      {!isVoiceChannel && !isEmailChannel && newMessagesCount > 0 && containerBounds && createPortal(
        <div
          className="pointer-events-none flex justify-center px-6"
          style={{
            position: "fixed",
            left: containerBounds.left,
            width: containerBounds.width,
            bottom: window.innerHeight - containerBounds.bottom + 96,
            zIndex: 10001,
          }}
        >
          <Button
            type="button"
            size="sm"
            onClick={handleJumpToLatest}
            className="pointer-events-auto rounded-full bg-[#111827] px-4 text-white shadow-lg hover:bg-[#1F2937]"
          >
            {newMessagesCount} new {newMessagesCount === 1 ? "message" : "messages"}
          </Button>
        </div>,
        document.body,
      )}

      {!hideInput && !isVoiceChannel && !isEmailChannel && (!isNarrowPanel || !showAiPanel || narrowTab === "conversation") && containerBounds && createPortal(
        <>
          {/* Live response input — portalled to document.body to escape parent stacking context */}
          <div
            ref={footerRef}
            style={{
              position: "fixed",
              left: containerBounds.left,
              width: containerBounds.width,
              bottom: window.innerHeight - containerBounds.bottom,
              zIndex: isDraftFocused ? 10000 : 60,
            }}
          >
            <div className="mx-auto w-full max-w-[1100px] px-[36px] pb-[36px]">
              {/* When suggestions are visible, wrap everything in a single white card */}
              <div className={cn(
                showingSuggestions && "overflow-hidden rounded-2xl bg-white shadow-[0_-8px_32px_rgba(16,24,40,0.12),0_4px_16px_rgba(16,24,40,0.06)]",
              )}>

            {/* Suggested response cards — rendered in-flow above the input when focused */}
            {shouldShowSuggestion && suggestionVariants.length > 0 && isDraftFocused && (() => {
              const PAGE_SIZE = 3;
              const capped = suggestionVariants.slice(0, 9);
              const totalPages = Math.ceil(capped.length / PAGE_SIZE);
              const safePage = Math.min(suggestionPage, totalPages - 1);
              const pageVariants = capped.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
              return (
                <div className="animate-suggestion-panel-enter overflow-hidden">
                  {/* Header row with prev/next controls */}
                  <div className="flex items-center justify-between px-4 pt-2.5 pb-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#98A2B3]">
                      Suggested Responses
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#98A2B3]">
                        {safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, capped.length)} of {capped.length}
                      </span>
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => { setSuggestionPageDir("prev"); setSuggestionPage((p) => Math.max(0, p - 1)); }}
                          disabled={safePage === 0}
                          className="flex h-5 w-5 items-center justify-center rounded text-[#98A2B3] transition-colors hover:bg-black/[0.06] hover:text-[#475467] disabled:pointer-events-none disabled:opacity-30"
                          aria-label="Previous suggestions"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => { setSuggestionPageDir("next"); setSuggestionPage((p) => Math.min(totalPages - 1, p + 1)); }}
                          disabled={safePage >= totalPages - 1}
                          className="flex h-5 w-5 items-center justify-center rounded text-[#98A2B3] transition-colors hover:bg-black/[0.06] hover:text-[#475467] disabled:pointer-events-none disabled:opacity-30"
                          aria-label="Next suggestions"
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                  {/* 3 cards for current page — key forces re-mount to retrigger animation */}
                  <div
                    key={safePage}
                    className={cn(
                      "flex gap-2.5 px-4 pb-3",
                      suggestionPageDir === "next" ? "animate-suggestion-slide-next" : "animate-suggestion-slide-prev",
                    )}
                  >
                    {pageVariants.map((variant, pageIdx) => {
                      const i = safePage * PAGE_SIZE + pageIdx;
                      const isSelected = selectedSuggestionIndex === i;
                      return (
                        <button
                          key={i}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            const text = variant.suggestedReply;
                            setDraft(text);
                            setIsSuggestionAdded(true);
                            setSelectedSuggestionIndex(i);
                            onConversationChange?.({ ...conversation, draft: text }, activeChannel);
                            textareaRef.current?.focus({ preventScroll: true });
                          }}
                          className={cn(
                            "relative min-w-0 flex-1 rounded-xl border p-3 text-left text-[13px] leading-5 transition-colors",
                            isSelected
                              ? "border-[#166CCA] bg-[#EBF4FD] text-[#00457A] shadow-[inset_0_0_0_1px_#166CCA]"
                              : "border-[#24943E] bg-[#EFFBF1] text-[#25403B] hover:bg-[#EFFBF1]",
                          )}
                        >
                          {isSelected && (
                            <span className="absolute right-2.5 top-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#166CCA]">
                              <Check className="h-2.5 w-2.5 text-white stroke-[2.5]" />
                            </span>
                          )}
                          <span className={cn("block line-clamp-3", isSelected && "pr-5")}>{variant.suggestedReply}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
            {/* Padding around the pill when it's inside the white suggestion container */}
            <div className={cn(showingSuggestions && "px-3 pb-3 pt-2")}>
            <div
              onMouseEnter={() => setIsInputHovered(true)}
              onMouseLeave={() => setIsInputHovered(false)}
              className={cn(
                "flex items-center gap-2 rounded-2xl px-3 py-2.5 transition-[border-color,background-color,box-shadow]",
                isInputHovered || isDraftFocused ? "bg-white" : "bg-white/90",
                showingSuggestions
                  ? isDraftFocused
                    ? "border border-[#166CCA]/40 shadow-[0_0_0_3px_rgba(0,109,173,0.08)]"
                    : isInputHovered
                      ? "border border-black/[0.14]"
                      : "border border-black/[0.06]"
                  : isDraftFocused
                    ? "border border-[#166CCA]/40 shadow-[0_0_0_3px_rgba(0,109,173,0.08),0_-6px_24px_rgba(16,24,40,0.10),0_4px_12px_rgba(16,24,40,0.06)]"
                    : isInputHovered
                      ? "border border-black/[0.14] shadow-[0_-6px_24px_rgba(16,24,40,0.10),0_4px_12px_rgba(16,24,40,0.06)]"
                      : "border border-black/[0.06] shadow-[0_-6px_24px_rgba(16,24,40,0.10),0_4px_12px_rgba(16,24,40,0.06)]",
              )}
            >
              {/* + add menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 rounded-full border border-black/10 bg-white text-[#5B5B5B] hover:bg-[#F8F8F9] hover:text-[#333333]"
                    aria-label="Open conversation actions"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  side="top"
                  sideOffset={12}
                  className="z-[120] w-[320px] rounded-[8px] border border-black/10 bg-white p-0 shadow-[0_20px_50px_rgba(0,0,0,0.16)]"
                >
                  <div>
                    {conversationFooterMenuItems.map((item) => (
                      <DropdownMenuItem
                        key={item}
                        className="rounded-xl px-4 py-4 text-[15px] text-[#333333] focus:bg-[#F8F8F9]"
                      >
                        {item}
                      </DropdownMenuItem>
                    ))}
                  </div>
                  <DropdownMenuSeparator className="my-0 bg-black/10" />
                  <div>
                    {conversationFooterSecondaryMenuItems.map((item) => (
                      <DropdownMenuItem
                        key={item}
                        className={cn(
                          "rounded-xl px-4 py-4 text-[15px] text-[#333333] focus:bg-[#F8F8F9]",
                          item === "Web search" && "text-[#0B7C86] focus:text-[#0B7C86]",
                        )}
                      >
                        {item}
                      </DropdownMenuItem>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Text input */}
              <Textarea
                key={draftKey}
                ref={textareaRef}
                placeholder="Type your response..."
                value={draft}
                onChange={(event) => {
                  const nextDraft = event.target.value;
                  setDraft(nextDraft);
                  onConversationChange?.({
                    ...conversation,
                    draft: nextDraft,
                  }, activeChannel);
                }}
                onFocus={() => setIsDraftFocused(true)}
                onBlur={() => setIsDraftFocused(false)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    handleSend();
                  }
                }}
                rows={1}
                className="!min-h-0 flex-1 resize-none overflow-hidden border-0 bg-transparent px-0 py-0 text-[15px] shadow-none placeholder:text-[#8A8A8A] focus:outline-none focus-visible:outline-none focus-visible:ring-0"
              />

              {/* Clear button — only visible when there's a draft */}
              {hasDraft && (
                <button
                  type="button"
                  onClick={() => {
                    setDraft("");
                    setIsSuggestionAdded(false);
                    setSelectedSuggestionIndex(null);
                    onConversationChange?.({ ...conversation, draft: "" }, activeChannel);
                    textareaRef.current?.focus({ preventScroll: true });
                  }}
                  aria-label="Clear message"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#98A2B3] transition-colors hover:bg-black/[0.06] hover:text-[#475467]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}

              {/* Send button — inside input.
                  onMouseDown prevents the textarea blur so the DOM doesn't shift before onClick fires.
                  This ensures a single click sends even when the suggestion panel is open. */}
              <Button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSend()}
                className={cn(
                  "h-8 w-8 shrink-0 rounded-full bg-[#166CCA] text-white hover:bg-[#0A5E92]",
                  !hasDraft && "cursor-not-allowed bg-[#D1D5DB] hover:bg-[#D1D5DB]",
                )}
                size="icon"
                aria-label={hasDraft ? `Send via ${getConversationChannelLabel(activeChannel)}` : "Enter a response to send"}
                disabled={!hasDraft}
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>{/* end input pill */}
            </div>{/* end pill padding wrapper */}
              </div>{/* end white suggestion container */}
            </div>{/* end centering wrapper */}
          </div>{/* end footerRef */}
        </>,
        document.body,
      )}
      </div>

    </div>
  );
}
