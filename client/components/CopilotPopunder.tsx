import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Columns2,
  Expand,
  Filter,
  GripHorizontal,
  Layers,
  MessageSquare,
  Mic,
  Phone,
  Plus,
  Send,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface CopilotDragActivation {
  id: number;
  offset: {
    x: number;
    y: number;
  };
}

interface CopilotPopunderProps {
  position: { x: number; y: number };
  size: { width: number; height: number };
  onPositionChange: (position: { x: number; y: number }) => void;
  onSizeChange: (size: { width: number; height: number }) => void;
  onClose: () => void;
  onDock?: () => void;
  dragActivation?: CopilotDragActivation | null;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ChatView = "empty" | "thinking" | "response";

interface ThinkingStep {
  title: string;
  description: string;
}

interface CopilotResponse {
  type: "standard";
  reasoning: string;
  answer: string;
}

interface HistoryInteraction {
  id: string;
  date: string;
  channel: "chat" | "voice" | "email" | "system" | "web" | "ticket";
  title: string;
  agent: string;
  summary: string;
  outcome?: string;
  outcomeVariant?: "resolved" | "escalated" | "pending" | "info";
  linkedTo?: string[];
  messages?: { role: "customer" | "agent"; text: string }[];
}

interface CopilotHistoryResponse {
  type: "history";
  customer: {
    name: string;
    customerId: string;
    tenure: string;
    totalContacts: number;
    channelCount: number;
    agentsInvolved: string[];
  };
  interactions: HistoryInteraction[];
  aiSummary: string;
}

type CopilotResponseData = CopilotResponse | CopilotHistoryResponse;

type GroupMode = "chronological" | "channel" | "agent";

// ─── Data ─────────────────────────────────────────────────────────────────────

const ANIMATED_SUBTEXTS = [
  "Ask anything about your resolution rates…",
  "Get help drafting a response to a customer…",
  "Summarize this conversation in seconds…",
  "Find the right escalation path instantly…",
  "Research a customer's full contact history…",
];

const SUGGESTION_PILLS = [
  "What are the key insights here?",
  "What should I focus on first?",
  "What changed recently?",
  "What actions do you recommend?",
  "Research Marcus Webb's contact history",
];

const STEP_DURATIONS = [950, 950, 950, 1400];
const RESEARCH_STEP_DURATIONS = [800, 900, 900, 1200];

function getThinkingSteps(question: string, isResearch: boolean): ThinkingStep[] {
  if (isResearch) {
    return [
      { title: "Searching contact history",        description: "Scanning CRM for all interactions linked to this customer." },
      { title: "Scanning conversation threads",     description: "Pulling chat, voice, and email threads across channels." },
      { title: "Cross-referencing agents & outcomes", description: "Mapping handoffs, escalations, and resolutions." },
      { title: "Building interaction timeline",     description: "" },
    ];
  }
  return [
    { title: "Parse prompt and intent",     description: `Detected question focus from "${question}".` },
    { title: "Resolve page context",        description: "Used what's visible on this page and the active time range." },
    { title: "Draft answer with references", description: "Grounded the reply in on-screen context and doc-style citations." },
    { title: "Preparing reply",             description: "" },
  ];
}

// ─── Marcus Webb POC data ─────────────────────────────────────────────────────

const MARCUS_HISTORY_RESPONSE: CopilotHistoryResponse = {
  type: "history",
  customer: {
    name: "Marcus Webb",
    customerId: "CST-13317",
    tenure: "3 years (Apr 2023)",
    totalContacts: 6,
    channelCount: 4,
    agentsInvolved: ["Emily (Virtual)", "Priya Nair", "Jeff Common"],
  },
  aiSummary:
    "Marcus is a loyal 3-year customer with zero prior complaints. The current issue traces to a cached shipping label not refreshed after his Jan 2025 address change (confirmed via chat with Jeff Common). Six interaction points across web, chat, email, and ticket — the shipping confirmation email went to his old Denver address, he flagged it by email reply, then escalated via chat with virtual agent Emily to Priya Nair. Recommend expedited resolution with goodwill gesture given his tenure.",
  interactions: [
    {
      id: "h-signup",
      date: "Apr 2023",
      channel: "web",
      title: "Account created — first order",
      agent: "System (self-service)",
      summary: "Marcus created his account via westbrook.com checkout. Shipping address on file: 419 Elm St, Denver, CO 80203. First order: Navy Crewneck Sweater ($89).",
      outcome: "Account active",
      outcomeVariant: "resolved",
    },
    {
      id: "h-address",
      date: "Jan 14, 2025 · 2:18 PM",
      channel: "chat",
      title: "Chat — address change request",
      agent: "Jeff Common",
      summary: "Marcus initiated a chat to confirm his shipping address had been updated following his move from Denver to Austin. Jeff verified the profile update and confirmed the new address was saved. No label cache purge was triggered at the time.",
      outcome: "Address updated — label cache not cleared",
      outcomeVariant: "pending",
      linkedTo: ["h-shipped"],
      messages: [
        { role: "customer", text: "Hi, I moved to Austin about two weeks ago and want to make sure my shipping address is updated before I place any new orders." },
        { role: "agent",    text: "Hi Marcus! Happy to help. I can see your account — you have 419 Elm St, Denver on file. I'll update that now. What's the new address?" },
        { role: "customer", text: "It's 2847 Ridgewood Ave, Austin, TX 78704." },
        { role: "agent",    text: "Done — I've updated your default shipping address to 2847 Ridgewood Ave, Austin, TX 78704. You're all set for future orders." },
        { role: "customer", text: "Perfect, thank you!" },
      ],
    },
    {
      id: "h-order",
      date: "Apr 18, 2026 · 2:31 PM",
      channel: "web",
      title: "Order #WB-88214 placed — Charcoal Merino Sweater",
      agent: "System",
      summary: "1× Charcoal Merino Sweater (Size L) — $129.00. Mastercard ****7731. Estimated delivery Apr 22. Customer note: \"It's a gift for my dad's birthday party.\" Stale Denver address pulled at checkout.",
      outcome: "Order confirmed",
      outcomeVariant: "info",
      linkedTo: ["h-address", "h-shipped"],
    },
    {
      id: "h-shipped",
      date: "Apr 19, 2026 · 9:42 AM",
      channel: "email",
      title: "Email — shipping confirmation to wrong address",
      agent: "marcus.webb@email.com",
      summary: "Automated shipping confirmation sent to Marcus's email for order #WB-88214. Confirmation listed 419 Elm St, Denver, CO 80203 as the delivery address — Marcus's old address. Marcus replied immediately flagging the error. No agent response was sent before he escalated via chat.",
      outcome: "Wrong address flagged by customer",
      outcomeVariant: "escalated",
      linkedTo: ["h-address", "h-order", "h-chat"],
      messages: [
        { role: "agent",    text: "Hi Marcus, your order #WB-88214 (Charcoal Merino Sweater, Size L) has shipped! Estimated delivery: Tuesday Apr 22.\n\nShipping to: 419 Elm St, Denver, CO 80203\nCarrier: UPS · Tracking: 1Z9F8R460346243817" },
        { role: "customer", text: "Hi — this is wrong. I updated my address to Austin, TX over a year ago. Why did this ship to Denver? I need this by Saturday for my dad's birthday. Can you intercept the package?" },
        { role: "customer", text: "I haven't heard back. I'm going to contact support via chat." },
      ],
    },
    {
      id: "h-chat",
      date: "Today · 10:07 AM",
      channel: "chat",
      title: "Chat — Marcus contacted support",
      agent: "Emily (Virtual Agent)",
      summary: "Marcus reported missing shipping confirmation and noticed wrong address in order history. Emily confirmed the address mismatch, reviewed carrier options, and determined human agent needed for carrier intercept or reship.",
      outcome: "Escalated to human agent",
      outcomeVariant: "escalated",
      linkedTo: ["h-shipped", "h-escalation"],
      messages: [
        { role: "customer", text: "Hi — I placed an order #WB-88214 and it looks like it shipped to my old Denver address. I moved to Austin over a year ago." },
        { role: "agent",    text: "I'm sorry about that, Marcus. I can see the order shipped to 419 Elm St, Denver. Your profile shows your Austin address — it looks like the label used a cached address. Let me check carrier intercept options." },
        { role: "customer", text: "I need this by Saturday — it's a birthday gift for my dad." },
        { role: "agent",    text: "Understood. I'm going to connect you with a specialist who can arrange an overnight reship or issue a full refund. One moment." },
      ],
    },
    {
      id: "h-escalation",
      date: "Today · 10:14 AM",
      channel: "ticket",
      title: "Case escalated — Priya Nair assigned",
      agent: "Priya Nair",
      summary: "Emily escalated to Priya Nair. Case notes include three resolution paths: (1) overnight reship to Austin, (2) full refund + reorder, (3) carrier intercept if feasible. Goodwill discount code recommended for loyal customer.",
      outcome: "Open — awaiting resolution",
      outcomeVariant: "pending",
      linkedTo: ["h-chat"],
    },
  ],
};

function isResearchQuery(q: string): boolean {
  const lower = q.toLowerCase();
  return (
    lower.includes("marcus") ||
    lower.includes("cst-13317") ||
    lower.includes("contact history") ||
    lower.includes("past interaction") ||
    lower.includes("research customer") ||
    lower.includes("interaction history") ||
    lower.includes("customer history")
  );
}

function getCopilotResponse(question: string): CopilotResponseData {
  if (isResearchQuery(question)) return MARCUS_HISTORY_RESPONSE;

  const map: Record<string, CopilotResponse> = {
    "What are the key insights here?": {
      type: "standard",
      reasoning: "Scanned the active queue for volume, SLA risk, and priority distribution. Cross-referenced channel mix and resolution velocity to surface the most actionable signals on screen right now.",
      answer: "You have 3 critical cases approaching SLA breach in the next 30 minutes, all via email. Chat volume is 40% above your daily average, and your first-response time is trending 12% slower than yesterday. Those are the three threads worth watching first.",
    },
    "What should I focus on first?": {
      type: "standard",
      reasoning: "From your wording we identified what you're asking about, scoped it to the current page, time range, and what's on screen, and grounded the answer in those signals plus documentation-style references.",
      answer: "I can explain what you're seeing, suggest filters or comparisons, spot trends, or help export what's on screen. What should we tackle first?",
    },
    "What changed recently?": {
      type: "standard",
      reasoning: "Compared the current queue snapshot against the rolling 24-hour baseline. Flagged cases that escalated, channels that spiked, and any priority changes in the last two hours.",
      answer: "In the last two hours, two cases were escalated to critical, WhatsApp volume jumped by 3 new cases, and one previously resolved case was reopened by the customer. The overall queue grew by 4 items since your last session.",
    },
    "What actions do you recommend?": {
      type: "standard",
      reasoning: "Assessed open cases by priority and SLA proximity, then matched available actions against your current workload and queue depth to surface the highest-leverage next steps.",
      answer: "Start with the two critical email cases — both are within 20 minutes of breach. Then acknowledge the three unresponded WhatsApp messages to reset SLA timers. After that, park the two low-priority chat cases and circle back once the critical backlog is clear.",
    },
  };

  return map[question] ?? {
    type: "standard",
    reasoning: "Parsed your question, resolved the current page context, and drafted a response grounded in what's visible on screen.",
    answer: "Here's what I found based on your current queue and context. Let me know if you'd like me to dig deeper into any specific area.",
  };
}

// ─── Shared channel/outcome meta ──────────────────────────────────────────────

const CHANNEL_META: Record<HistoryInteraction["channel"], { icon: React.ReactNode; label: string; color: string; border: string; bg: string }> = {
  chat:   { icon: <MessageSquare className="h-3.5 w-3.5" />, label: "Chat",    color: "text-[#166CCA]", border: "border-l-[#166CCA]", bg: "bg-[#EBF4FD]" },
  voice:  { icon: <Phone className="h-3.5 w-3.5" />,         label: "Voice",   color: "text-[#027A48]", border: "border-l-[#027A48]", bg: "bg-[#ECFDF3]" },
  email:  { icon: <MessageSquare className="h-3.5 w-3.5" />, label: "Email",   color: "text-[#B54708]", border: "border-l-[#B54708]", bg: "bg-[#FFF4ED]" },
  system: { icon: <AlertCircle className="h-3.5 w-3.5" />,   label: "System",  color: "text-[#D92D20]", border: "border-l-[#D92D20]", bg: "bg-[#FEF3F2]" },
  web:    { icon: <User className="h-3.5 w-3.5" />,           label: "Web",     color: "text-[#667085]", border: "border-l-[#667085]", bg: "bg-[#F9FAFB]" },
  ticket: { icon: <AlertCircle className="h-3.5 w-3.5" />,   label: "Ticket",  color: "text-[#6941C6]", border: "border-l-[#6941C6]", bg: "bg-[#F4F0FF]" },
};

const OUTCOME_STYLES: Record<NonNullable<HistoryInteraction["outcomeVariant"]>, string> = {
  resolved:  "bg-[#ECFDF3] text-[#027A48]",
  escalated: "bg-[#FFF4ED] text-[#B54708]",
  pending:   "bg-[#F9FAFB] text-[#344054]",
  info:      "bg-[#EBF4FD] text-[#166CCA]",
};

// AI filter preset queries
const AI_FILTER_PRESETS = [
  { label: "Escalations only",   fn: (i: HistoryInteraction) => i.outcomeVariant === "escalated" },
  { label: "Today's threads",    fn: (i: HistoryInteraction) => i.date.toLowerCase().startsWith("today") },
  { label: "Root cause",         fn: (i: HistoryInteraction) => ["h-address", "h-order", "h-shipped"].includes(i.id) },
  { label: "Human agents",       fn: (i: HistoryInteraction) => !i.agent.toLowerCase().includes("system") && !i.agent.toLowerCase().includes("virtual") },
];

// ─── Animated subtext ─────────────────────────────────────────────────────────

function AnimatedSubtext() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [displayed, setDisplayed] = useState("");
  const [charIndex, setCharIndex] = useState(0);
  const [phase, setPhase] = useState<"typing" | "pause" | "fading">("typing");
  const currentText = ANIMATED_SUBTEXTS[index];

  useEffect(() => {
    if (phase !== "typing") return;
    if (charIndex < currentText.length) {
      const t = setTimeout(() => { setDisplayed(currentText.slice(0, charIndex + 1)); setCharIndex((c) => c + 1); }, 38);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => setPhase("pause"), 2200);
      return () => clearTimeout(t);
    }
  }, [phase, charIndex, currentText]);

  useEffect(() => {
    if (phase !== "pause") return;
    setVisible(false);
    const t = setTimeout(() => setPhase("fading"), 400);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "fading") return;
    const t = setTimeout(() => { setIndex((i) => (i + 1) % ANIMATED_SUBTEXTS.length); setCharIndex(0); setDisplayed(""); setVisible(true); setPhase("typing"); }, 300);
    return () => clearTimeout(t);
  }, [phase]);

  return (
    <p className="text-sm text-[#7A7A7A] transition-opacity duration-300 min-h-[1.25rem]" style={{ opacity: visible ? 1 : 0 }}>
      {displayed}
      {phase === "typing" && charIndex < currentText.length && (
        <span className="inline-block w-[2px] h-[0.9em] bg-[#166CCA] ml-[1px] align-middle animate-pulse" />
      )}
    </p>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin text-[#166CCA]" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

// ─── Thinking view ────────────────────────────────────────────────────────────

function ThinkingView({ question, steps, completedCount }: { question: string; steps: ThinkingStep[]; completedCount: number }) {
  const activeIndex = completedCount;
  return (
    <div className="flex flex-1 flex-col min-h-0 overflow-y-auto">
      <div className="flex flex-col gap-4 px-4 py-5">
        <div className="flex justify-end">
          <div className="max-w-[80%] rounded-2xl bg-white dark:bg-[#1C2A3A] border border-black/8 dark:border-white/10 px-4 py-2.5 text-[14px] text-[#1D2939] dark:text-[#E2E8F0] shadow-sm">
            {question}
          </div>
        </div>
        <div className="rounded-xl border border-black/8 dark:border-white/8 bg-[#EBF4FD] dark:bg-[#0B2040] px-4 py-4">
          <div className="space-y-4">
            {steps.map((step, i) => {
              const isDone = i < completedCount;
              const isActive = i === activeIndex;
              if (!isDone && !isActive) return null;
              return (
                <div key={i} className="flex items-start gap-3" style={{ animation: "fadeSlideIn 0.35s cubic-bezier(0.22,1,0.36,1) both" }}>
                  <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
                    {isDone ? (
                      <svg viewBox="0 0 16 16" className="h-4 w-4 text-[#166CCA]" fill="none">
                        <path d="M3 8.5L6.5 12L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : <Spinner />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-[#1D2939] dark:text-[#BFDBFE] leading-snug">{step.title}</p>
                    {isDone && step.description && (
                      <p className="mt-0.5 text-[12px] leading-snug text-[#6B7280] dark:text-[#7A8FAA]">{step.description}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Standard response view ───────────────────────────────────────────────────

function StandardResponseView({ question, response }: { question: string; response: CopilotResponse }) {
  const [reasoningOpen, setReasoningOpen] = useState(true);
  const [answerVisible, setAnswerVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnswerVisible(true), 200); return () => clearTimeout(t); }, []);
  return (
    <div className="flex flex-1 flex-col min-h-0 overflow-y-auto">
      <div className="flex flex-col gap-4 px-4 py-5">
        <div className="flex justify-end">
          <div className="max-w-[80%] rounded-2xl bg-white dark:bg-[#1C2A3A] border border-black/8 dark:border-white/10 px-4 py-2.5 text-[14px] text-[#1D2939] dark:text-[#E2E8F0] shadow-sm">{question}</div>
        </div>
        <div style={{ animation: "fadeSlideIn 0.4s cubic-bezier(0.22,1,0.36,1) both" }}>
          <button type="button" onClick={() => setReasoningOpen((o) => !o)} className="flex items-center gap-1.5 text-[13px] font-semibold text-[#1D2939] dark:text-[#E2E8F0] mb-2">
            Reasoning
            {reasoningOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          {reasoningOpen && (
            <div className="rounded-xl border border-[#166CCA]/20 bg-[#EBF4FD] dark:bg-[#0B1E35] px-4 py-3">
              <p className="text-[13px] leading-relaxed text-[#1260B0] dark:text-[#BFDBFE]">{response.reasoning}</p>
            </div>
          )}
        </div>
        <div className="transition-opacity duration-500" style={{ opacity: answerVisible ? 1 : 0, animation: answerVisible ? "fadeSlideIn 0.45s cubic-bezier(0.22,1,0.36,1) both" : undefined }}>
          <p className="text-[15px] font-medium leading-relaxed text-[#1D2939] dark:text-[#E2E8F0]">{response.answer}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Interaction card (shared by inline + expanded views) ─────────────────────

function InteractionCard({
  interaction,
  index,
  isLast,
  forceOpen,
  compact = false,
}: {
  interaction: HistoryInteraction;
  index: number;
  isLast: boolean;
  forceOpen?: boolean;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(forceOpen ?? false);
  const ch = CHANNEL_META[interaction.channel];

  // Sync forceOpen changes
  useEffect(() => { if (forceOpen !== undefined) setOpen(forceOpen); }, [forceOpen]);

  return (
    <div className="relative" style={{ animation: compact ? undefined : `fadeSlideIn 0.4s cubic-bezier(0.22,1,0.36,1) ${index * 60}ms both` }}>
      {!isLast && !compact && (
        <div className="absolute left-[18px] top-[44px] bottom-[-12px] w-px bg-[#E4E7EC] dark:bg-[#1C2536] z-0" />
      )}
      <div className={cn("relative z-10 rounded-xl border border-black/[0.07] dark:border-white/[0.07] bg-white dark:bg-[#0F1629] overflow-hidden border-l-[3px]", ch.border)}>
        <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-start gap-3 px-3 py-3 text-left hover:bg-[#F9FAFB] dark:hover:bg-[#141E2F] transition-colors">
          <span className={cn("mt-0.5 shrink-0", ch.color)}>{ch.icon}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[13px] font-semibold leading-snug text-[#1D2939] dark:text-[#E2E8F0]">{interaction.title}</p>
              {open ? <ChevronUp className="h-3.5 w-3.5 shrink-0 mt-0.5 text-[#98A2B3]" /> : <ChevronDown className="h-3.5 w-3.5 shrink-0 mt-0.5 text-[#98A2B3]" />}
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="text-[11px] text-[#98A2B3]">{interaction.date}</span>
              <span className="text-[11px] text-[#D0D5DD]">·</span>
              <span className="text-[11px] text-[#667085] dark:text-[#8EA4C0]">{interaction.agent}</span>
            </div>
          </div>
        </button>

        {open && (
          <div className="px-3 pb-3 space-y-3 border-t border-[#F2F4F7] dark:border-[#1C2536]">
            <p className="pt-2.5 text-[12px] leading-relaxed text-[#475467] dark:text-[#8EA4C0]">{interaction.summary}</p>
            {interaction.messages && interaction.messages.length > 0 && (
              <div className="rounded-lg bg-[#F8F9FB] dark:bg-[#0B1525] p-2.5 space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#98A2B3]">Conversation thread</p>
                {interaction.messages.map((msg, i) => (
                  <div key={i} className={cn("flex gap-2", msg.role === "agent" ? "justify-start" : "justify-end")}>
                    <div className={cn("max-w-[85%] rounded-xl px-3 py-2 text-[11px] leading-relaxed", msg.role === "customer" ? "bg-white dark:bg-[#1C2A3A] border border-black/8 text-[#1D2939] dark:text-[#E2E8F0]" : "bg-[#EBF4FD] dark:bg-[#0B1E35] text-[#1260B0] dark:text-[#BFDBFE]")}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2">
              {interaction.outcome && (
                <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", OUTCOME_STYLES[interaction.outcomeVariant ?? "info"])}>
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
    </div>
  );
}

// ─── AI Filter Bar (shared) ───────────────────────────────────────────────────

function AiFilterBar({
  query,
  onQuery,
  activePreset,
  onPreset,
  resultCount,
  total,
}: {
  query: string;
  onQuery: (q: string) => void;
  activePreset: string | null;
  onPreset: (label: string | null) => void;
  resultCount: number;
  total: number;
}) {
  return (
    <div className="space-y-2">
      {/* Search input */}
      <div className="flex items-center gap-2 rounded-lg border border-[#E4E7EC] bg-white dark:bg-[#0B1525] dark:border-[#1C2536] px-2.5 py-1.5 focus-within:border-[#166CCA]/50 transition-colors">
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#166CCA]" />
        <input
          type="text"
          value={query}
          onChange={(e) => { onQuery(e.target.value); onPreset(null); }}
          placeholder="Ask AI to filter or reorganize…"
          className="min-w-0 flex-1 bg-transparent text-[12px] text-[#344054] placeholder:text-[#98A2B3] focus:outline-none"
        />
        {query && (
          <button type="button" onClick={() => onQuery("")} className="text-[#98A2B3] hover:text-[#667085]">
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Preset pills */}
      <div className="flex flex-wrap gap-1.5">
        {AI_FILTER_PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => { onPreset(activePreset === p.label ? null : p.label); onQuery(""); }}
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[11px] font-medium border transition-colors",
              activePreset === p.label
                ? "bg-[#166CCA] border-[#166CCA] text-white"
                : "bg-white dark:bg-[#0B1525] border-[#E4E7EC] dark:border-[#1C2536] text-[#667085] dark:text-[#8EA4C0] hover:border-[#166CCA]/40 hover:text-[#166CCA]",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Result count banner */}
      {(query || activePreset) && (
        <div className="flex items-center gap-1.5 rounded-md bg-[#F4F0FF] dark:bg-[#1A1040] px-2.5 py-1.5">
          <Filter className="h-3 w-3 text-[#6941C6]" />
          <span className="text-[11px] text-[#6941C6]">
            {activePreset
              ? `AI filtered: "${activePreset}" — showing ${resultCount} of ${total}`
              : `Showing ${resultCount} of ${total} matching "${query}"`}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Expanded full-panel history overlay ─────────────────────────────────────

function ExpandedHistoryPanel({
  response,
  onClose,
}: {
  response: CopilotHistoryResponse;
  onClose: () => void;
}) {
  const [groupMode, setGroupMode]       = useState<GroupMode>("chronological");
  const [channelFilter, setChannelFilter] = useState<string | null>(null);
  const [aiQuery, setAiQuery]           = useState("");
  const [aiPreset, setAiPreset]         = useState<string | null>(null);
  const [expandAll, setExpandAll]       = useState(true);
  const [summaryOpen, setSummaryOpen]   = useState(true);

  const channels = Array.from(new Set(response.interactions.map((i) => i.channel)));

  // Filter logic
  const filteredInteractions = useMemo(() => {
    let items = response.interactions;
    if (channelFilter) items = items.filter((i) => i.channel === channelFilter);
    const preset = AI_FILTER_PRESETS.find((p) => p.label === aiPreset);
    if (preset) items = items.filter(preset.fn);
    if (aiQuery.trim()) {
      const q = aiQuery.trim().toLowerCase();
      items = items.filter((i) =>
        [i.title, i.agent, i.summary, i.date, i.outcome ?? ""].join(" ").toLowerCase().includes(q)
      );
    }
    return items;
  }, [response.interactions, channelFilter, aiPreset, aiQuery]);

  // Grouped render
  const grouped = useMemo(() => {
    if (groupMode === "chronological") return [{ label: "All interactions", items: filteredInteractions }];
    if (groupMode === "channel") {
      const map = new Map<string, HistoryInteraction[]>();
      filteredInteractions.forEach((i) => {
        const key = CHANNEL_META[i.channel].label;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(i);
      });
      return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
    }
    // by agent
    const map = new Map<string, HistoryInteraction[]>();
    filteredInteractions.forEach((i) => {
      if (!map.has(i.agent)) map.set(i.agent, []);
      map.get(i.agent)!.push(i);
    });
    return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
  }, [filteredInteractions, groupMode]);

  const panel = (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-[2px]" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <style>{`@keyframes expandPanelIn { from { opacity:0; transform:scale(0.96) translateY(12px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
      <div
        className="relative flex flex-col bg-white dark:bg-[#0F1629] rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.28)] overflow-hidden"
        style={{ width: "min(1080px, calc(100vw - 48px))", height: "min(820px, calc(100vh - 48px))", animation: "expandPanelIn 0.35s cubic-bezier(0.22,1,0.36,1) both" }}
      >
        {/* ── Header ── */}
        <div className="shrink-0 flex items-center justify-between gap-4 border-b border-[#E4E7EC] dark:border-[#1C2536] bg-white dark:bg-[#0F1629] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EBF4FD]">
              <Sparkles className="h-4 w-4 text-[#166CCA]" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-[#1D2939] dark:text-[#E2E8F0]">Contact History — {response.customer.name}</h2>
              <p className="text-[11px] text-[#98A2B3]">{response.customer.customerId} · {response.customer.tenure} · {response.customer.totalContacts} interactions</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#98A2B3] bg-[#F2F4F7] dark:bg-[#1C2536] rounded-full px-2.5 py-1">from AI Assistant</span>
            <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-[#667085] hover:bg-[#F2F4F7] dark:hover:bg-[#1C2536] transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* ── Left sidebar: customer card + AI filter ── */}
          <div className="w-[280px] shrink-0 flex flex-col gap-4 border-r border-[#E4E7EC] dark:border-[#1C2536] bg-[#F9FAFB] dark:bg-[#0B1121] overflow-y-auto p-4">

            {/* Customer card */}
            <div className="rounded-xl border border-[#166CCA]/25 bg-[#EBF4FD] dark:bg-[#0B1E35] px-4 py-3">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="text-[13px] font-semibold text-[#166CCA]">{response.customer.name}</p>
                  <p className="text-[11px] text-[#98A2B3]">{response.customer.customerId}</p>
                </div>
                <div className="flex gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-[15px] font-bold text-[#1260B0]">{response.customer.totalContacts}</p>
                    <p className="text-[10px] text-[#98A2B3]">interactions</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[15px] font-bold text-[#1260B0]">{response.customer.channelCount}</p>
                    <p className="text-[10px] text-[#98A2B3]">channels</p>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-[#667085] dark:text-[#8EA4C0] mb-2">Since {response.customer.tenure}</p>
              <div className="flex flex-wrap gap-1">
                {response.customer.agentsInvolved.map((a) => (
                  <span key={a} className="rounded-full bg-white/70 dark:bg-[#1C2A3A]/70 border border-[#166CCA]/20 px-2 py-0.5 text-[10px] text-[#344054] dark:text-[#CBD5E1]">{a}</span>
                ))}
              </div>
            </div>

            {/* AI summary */}
            <div className="rounded-xl border border-[#E4E7EC] dark:border-[#1C2536] bg-white dark:bg-[#0F1629] overflow-hidden">
              <button type="button" onClick={() => setSummaryOpen((o) => !o)} className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-[#F9FAFB] dark:hover:bg-[#141E2F]">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-[#166CCA]" />
                  <span className="text-[12px] font-semibold text-[#1D2939] dark:text-[#E2E8F0]">AI Summary</span>
                </div>
                {summaryOpen ? <ChevronUp className="h-3.5 w-3.5 text-[#98A2B3]" /> : <ChevronDown className="h-3.5 w-3.5 text-[#98A2B3]" />}
              </button>
              {summaryOpen && (
                <div className="px-3 pb-3 border-t border-[#F2F4F7] dark:border-[#1C2536]">
                  <p className="pt-2 text-[12px] leading-relaxed text-[#475467] dark:text-[#8EA4C0]">{response.aiSummary}</p>
                </div>
              )}
            </div>

            {/* AI Filter */}
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#98A2B3]">AI Filter & Search</p>
              <AiFilterBar
                query={aiQuery}
                onQuery={setAiQuery}
                activePreset={aiPreset}
                onPreset={setAiPreset}
                resultCount={filteredInteractions.length}
                total={response.interactions.length}
              />
            </div>

            {/* Channel filter */}
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#98A2B3]">Filter by channel</p>
              <div className="flex flex-wrap gap-1.5">
                <button type="button" onClick={() => setChannelFilter(null)} className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-medium border transition-colors", !channelFilter ? "bg-[#344054] border-[#344054] text-white" : "bg-white dark:bg-[#0B1525] border-[#E4E7EC] dark:border-[#1C2536] text-[#667085]")}>All</button>
                {channels.map((ch) => {
                  const meta = CHANNEL_META[ch as HistoryInteraction["channel"]];
                  return (
                    <button key={ch} type="button" onClick={() => setChannelFilter(channelFilter === ch ? null : ch)} className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-medium border transition-colors", channelFilter === ch ? cn("text-white border-transparent", meta.bg.replace("bg-", "bg-").replace("[", "[").replace("]", "]")) : "bg-white dark:bg-[#0B1525] border-[#E4E7EC] dark:border-[#1C2536] text-[#667085] hover:border-[#D0D5DD]")}>
                      {meta.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Main content area ── */}
          <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
            {/* Toolbar */}
            <div className="shrink-0 flex items-center justify-between gap-3 border-b border-[#E4E7EC] dark:border-[#1C2536] px-5 py-3 bg-white dark:bg-[#0F1629]">
              <div className="flex items-center gap-1">
                <span className="text-[12px] font-semibold text-[#667085] dark:text-[#8EA4C0]">
                  {filteredInteractions.length} interaction{filteredInteractions.length !== 1 ? "s" : ""}
                  {(aiPreset || aiQuery || channelFilter) ? " (filtered)" : ""}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {/* View all threads / Close all threads toggle */}
                <button
                  type="button"
                  onClick={() => setExpandAll((v) => !v)}
                  className={cn("flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] font-medium transition-colors", expandAll ? "border-[#166CCA]/40 bg-[#EBF4FD] text-[#166CCA]" : "border-[#E4E7EC] bg-white dark:bg-[#0B1525] dark:border-[#1C2536] text-[#667085] hover:bg-[#F9FAFB]")}
                >
                  <Layers className="h-3.5 w-3.5" />
                  {expandAll ? "Close all threads" : "View all threads"}
                </button>

                {/* Group by */}
                <div className="flex items-center gap-0.5 rounded-md border border-[#E4E7EC] dark:border-[#1C2536] bg-[#F9FAFB] dark:bg-[#0B1525] p-0.5">
                  {([["chronological", "Timeline"], ["channel", "Channel"], ["agent", "Agent"]] as [GroupMode, string][]).map(([mode, label]) => (
                    <button key={mode} type="button" onClick={() => setGroupMode(mode)} className={cn("rounded px-2.5 py-1 text-[11px] font-medium transition-colors", groupMode === mode ? "bg-white dark:bg-[#1C2A3A] text-[#1D2939] dark:text-[#E2E8F0] shadow-sm" : "text-[#667085] hover:text-[#344054]")}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Cards */}
            <div className="flex-1 overflow-y-auto">
              {groupMode === "chronological" ? (
                <div className="p-5 space-y-4">
                  {filteredInteractions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <Filter className="h-8 w-8 text-[#D0D5DD] mb-3" />
                      <p className="text-sm font-medium text-[#7A7A7A]">No interactions match</p>
                      <p className="text-xs text-[#B0B7C3] mt-1">Try clearing the filter or search.</p>
                    </div>
                  ) : (
                    filteredInteractions.map((interaction, i) => (
                      <InteractionCard key={interaction.id} interaction={interaction} index={i} isLast={i === filteredInteractions.length - 1} forceOpen={expandAll} compact />
                    ))
                  )}
                </div>
              ) : (
                <div className="p-5 space-y-6">
                  {grouped.map((group) => (
                    <div key={group.label}>
                      <div className="flex items-center gap-2 mb-3">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-[#98A2B3]">{group.label}</p>
                        <div className="flex-1 h-px bg-[#E4E7EC] dark:bg-[#1C2536]" />
                        <span className="text-[11px] text-[#D0D5DD]">{group.items.length}</span>
                      </div>
                      <div className="space-y-3">
                        {group.items.map((interaction, i) => (
                          <InteractionCard key={interaction.id} interaction={interaction} index={i} isLast={i === group.items.length - 1} forceOpen={expandAll} compact />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(panel, document.body);
}

// ─── History response view (inline in copilot popunder) ───────────────────────

function HistoryResponseView({
  question,
  response,
  onExpandedPanelChange,
}: {
  question: string;
  response: CopilotHistoryResponse;
  onExpandedPanelChange?: (open: boolean) => void;
}) {
  const [summaryOpen, setSummaryOpen]         = useState(true);
  const [contentVisible, setContentVisible]   = useState(false);
  const [expandAll, setExpandAll]             = useState<boolean | undefined>(undefined);
  const [showExpanded, setShowExpanded]       = useState(false);
  const [aiQuery, setAiQuery]                 = useState("");
  const [aiPreset, setAiPreset]               = useState<string | null>(null);

  useEffect(() => { const t = setTimeout(() => setContentVisible(true), 150); return () => clearTimeout(t); }, []);

  const openExpanded  = () => { setShowExpanded(true);  onExpandedPanelChange?.(true);  };
  const closeExpanded = () => { setShowExpanded(false); onExpandedPanelChange?.(false); };

  const filteredInteractions = useMemo(() => {
    let items = response.interactions;
    const preset = AI_FILTER_PRESETS.find((p) => p.label === aiPreset);
    if (preset) items = items.filter(preset.fn);
    if (aiQuery.trim()) {
      const q = aiQuery.trim().toLowerCase();
      items = items.filter((i) =>
        [i.title, i.agent, i.summary, i.date, i.outcome ?? ""].join(" ").toLowerCase().includes(q)
      );
    }
    return items;
  }, [response.interactions, aiPreset, aiQuery]);

  return (
    <>
      {showExpanded && <ExpandedHistoryPanel response={response} onClose={closeExpanded} />}

      <div className="flex flex-1 flex-col min-h-0 overflow-y-auto">
        <div className="flex flex-col gap-3 px-4 py-5">
          {/* User message bubble */}
          <div className="flex justify-end">
            <div className="max-w-[80%] rounded-2xl bg-white dark:bg-[#1C2A3A] border border-black/8 dark:border-white/10 px-4 py-2.5 text-[14px] text-[#1D2939] dark:text-[#E2E8F0] shadow-sm">{question}</div>
          </div>

          {/* Customer summary card */}
          <div style={{ animation: "fadeSlideIn 0.4s cubic-bezier(0.22,1,0.36,1) both" }} className="rounded-xl border border-[#166CCA]/25 bg-[#EBF4FD] dark:bg-[#0B1E35] px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-[#166CCA]" />
                  <p className="text-[13px] font-semibold text-[#166CCA]">{response.customer.name}</p>
                  <span className="text-[11px] text-[#98A2B3]">{response.customer.customerId}</span>
                </div>
                <p className="mt-0.5 text-[11px] text-[#667085] dark:text-[#8EA4C0]">Customer since {response.customer.tenure}</p>
              </div>
              <div className="flex gap-3 shrink-0 text-right">
                <div><p className="text-[15px] font-bold text-[#1260B0]">{response.customer.totalContacts}</p><p className="text-[10px] text-[#98A2B3]">interactions</p></div>
                <div><p className="text-[15px] font-bold text-[#1260B0]">{response.customer.channelCount}</p><p className="text-[10px] text-[#98A2B3]">channels</p></div>
              </div>
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[#98A2B3]">Agents</span>
              {response.customer.agentsInvolved.map((a) => (
                <span key={a} className="rounded-full bg-white/70 dark:bg-[#1C2A3A]/70 border border-[#166CCA]/20 px-2 py-0.5 text-[11px] text-[#344054] dark:text-[#CBD5E1]">{a}</span>
              ))}
            </div>
            {/* Summary toggle */}
            <div className="mt-2.5 border-t border-[#166CCA]/15 pt-2">
              <button type="button" onClick={() => setSummaryOpen((o) => !o)} className="flex w-full items-center gap-1.5 text-[11px] font-semibold text-[#1260B0] dark:text-[#BFDBFE]">
                AI Summary
                {summaryOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
              {summaryOpen && <p className="mt-1.5 text-[12px] leading-relaxed text-[#1260B0] dark:text-[#BFDBFE]">{response.aiSummary}</p>}
            </div>
          </div>

          {/* Action toolbar */}
          <div style={{ animation: "fadeSlideIn 0.4s cubic-bezier(0.22,1,0.36,1) 80ms both" }} className="flex items-center gap-2 flex-wrap">
            {/* Expand all */}
            <button
              type="button"
              onClick={() => setExpandAll((v) => v === true ? false : true)}
              className={cn("flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] font-medium transition-colors", expandAll === true ? "border-[#166CCA]/40 bg-[#EBF4FD] text-[#166CCA]" : "border-[#E4E7EC] dark:border-[#1C2536] bg-white dark:bg-[#0B1525] text-[#667085] hover:bg-[#F9FAFB]")}
            >
              <Layers className="h-3.5 w-3.5" />
              {expandAll === true ? "Close all threads" : "Expand all"}
            </button>

            {/* View all threads side-by-side */}
            <button
              type="button"
              onClick={openExpanded}
              className="flex items-center gap-1.5 rounded-md border border-[#E4E7EC] dark:border-[#1C2536] bg-white dark:bg-[#0B1525] px-2.5 py-1.5 text-[11px] font-medium text-[#667085] hover:bg-[#F9FAFB] hover:border-[#166CCA]/40 hover:text-[#166CCA] transition-colors"
            >
              <Columns2 className="h-3.5 w-3.5" />
              View all threads
            </button>

            {/* Open in full panel */}
            <button
              type="button"
              onClick={openExpanded}
              className="flex items-center gap-1.5 rounded-md border border-[#E4E7EC] dark:border-[#1C2536] bg-white dark:bg-[#0B1525] px-2.5 py-1.5 text-[11px] font-medium text-[#667085] hover:bg-[#F9FAFB] hover:border-[#166CCA]/40 hover:text-[#166CCA] transition-colors ml-auto"
            >
              <Expand className="h-3.5 w-3.5" />
              Full view
            </button>
          </div>

          {/* Inline AI filter bar */}
          {contentVisible && (
            <div style={{ animation: "fadeSlideIn 0.4s cubic-bezier(0.22,1,0.36,1) 120ms both" }}>
              <AiFilterBar
                query={aiQuery}
                onQuery={setAiQuery}
                activePreset={aiPreset}
                onPreset={setAiPreset}
                resultCount={filteredInteractions.length}
                total={response.interactions.length}
              />
            </div>
          )}

          {/* Interaction timeline */}
          {contentVisible && (
            <div>
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-[#98A2B3]">
                Interaction timeline · {filteredInteractions.length} record{filteredInteractions.length !== 1 ? "s" : ""}
              </p>
              {filteredInteractions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Filter className="h-6 w-6 text-[#D0D5DD] mb-2" />
                  <p className="text-[13px] text-[#7A7A7A]">No interactions match</p>
                  <button type="button" onClick={() => { setAiQuery(""); setAiPreset(null); }} className="mt-2 text-[12px] text-[#166CCA] hover:underline">Clear filter</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredInteractions.map((interaction, i) => (
                    <InteractionCard
                      key={interaction.id}
                      interaction={interaction}
                      index={i}
                      isLast={i === filteredInteractions.length - 1}
                      forceOpen={expandAll}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Chat input ───────────────────────────────────────────────────────────────

function ChatInput({ value, onChange, onSend, placeholder = "Ask a question…" }: { value: string; onChange: (v: string) => void; onSend: (text?: string) => void; placeholder?: string }) {
  return (
    <div className="shrink-0 border-t border-border bg-background px-4 py-3">
      <div className="flex items-center gap-2 rounded-xl border border-black/10 bg-[#F8F8F9] px-3 py-2 focus-within:border-[#166CCA]/40 focus-within:bg-white transition-colors">
        <button type="button" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[#7A7A7A] hover:text-[#166CCA] transition-colors" aria-label="Attach"><Plus className="h-4 w-4" /></button>
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent text-sm text-[#333333] placeholder:text-[#AAAAAA] focus:outline-none" />
        {value.trim() ? (
          <button type="button" onClick={() => onSend()} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#166CCA] text-white transition-colors hover:bg-[#1260B0]" aria-label="Send"><Send className="h-3.5 w-3.5" /></button>
        ) : (
          <button type="button" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#7A7A7A] hover:text-[#166CCA] transition-colors" aria-label="Voice input"><Mic className="h-4 w-4" /></button>
        )}
      </div>
    </div>
  );
}

// ─── CopilotContent ───────────────────────────────────────────────────────────

export function CopilotContent({ onExpandedPanelChange }: { onExpandedPanelChange?: (open: boolean) => void } = {}) {
  const [view, setView]                     = useState<ChatView>("empty");
  const [chatInput, setChatInput]           = useState("");
  const [question, setQuestion]             = useState("");
  const [completedSteps, setCompletedSteps] = useState(0);
  const [copilotResponse, setCopilotResponse] = useState<CopilotResponseData | null>(null);

  const isResearch    = isResearchQuery(question);
  const thinkingSteps = question ? getThinkingSteps(question, isResearch) : [];
  const stepDurations = isResearch ? RESEARCH_STEP_DURATIONS : STEP_DURATIONS;

  useEffect(() => {
    if (view !== "thinking") return;
    let cancelled = false;
    const advanceStep = (stepIndex: number) => {
      if (cancelled || stepIndex >= stepDurations.length) return;
      const duration = stepDurations[stepIndex];
      setTimeout(() => {
        if (cancelled) return;
        const nextCompleted = stepIndex + 1;
        setCompletedSteps(nextCompleted);
        if (nextCompleted >= thinkingSteps.length) {
          setTimeout(() => { if (cancelled) return; setCopilotResponse(getCopilotResponse(question)); setView("response"); }, 300);
        } else {
          advanceStep(nextCompleted);
        }
      }, duration);
    };
    advanceStep(0);
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, question]);

  const startChat = (text: string) => {
    if (!text.trim()) return;
    setQuestion(text);
    setChatInput("");
    setCompletedSteps(0);
    setCopilotResponse(null);
    setView("thinking");
  };

  if (view === "empty") {
    return (
      <>
        <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 py-8 min-h-0 overflow-y-auto">
          <img src={`${import.meta.env.BASE_URL}ai-indicator.svg`} alt="" className="h-24 w-24" />
          <div className="text-center space-y-2">
            <h2 className="text-[17px] font-semibold text-[#1D2939] dark:text-[#E2E8F0] leading-snug">How can I help you today?</h2>
            <AnimatedSubtext />
          </div>
          <div className="w-full space-y-2 pt-1">
            {SUGGESTION_PILLS.map((pill) => (
              <button key={pill} type="button" onClick={() => startChat(pill)} className="w-full rounded-full border border-black/10 dark:border-white/10 bg-[#F8F8F9] dark:bg-[#1C2A3A] px-4 py-2.5 text-left text-sm text-[#1D2939] dark:text-[#CBD5E1] transition-colors hover:bg-[#EBF4FD] dark:hover:bg-[#0B1E35] hover:border-[#166CCA]/30 hover:text-[#166CCA] dark:hover:text-[#BFDBFE]">
                {pill}
              </button>
            ))}
          </div>
        </div>
        <ChatInput value={chatInput} onChange={setChatInput} onSend={(t) => startChat(t ?? chatInput)} />
      </>
    );
  }

  if (view === "thinking") {
    return (
      <>
        <ThinkingView question={question} steps={thinkingSteps} completedCount={completedSteps} />
        <ChatInput value={chatInput} onChange={setChatInput} onSend={(t) => startChat(t ?? chatInput)} placeholder="Ask a follow-up…" />
      </>
    );
  }

  return (
    <>
      {copilotResponse?.type === "history" ? (
        <HistoryResponseView question={question} response={copilotResponse} onExpandedPanelChange={onExpandedPanelChange} />
      ) : (
        <StandardResponseView question={question} response={copilotResponse as CopilotResponse} />
      )}
      <ChatInput value={chatInput} onChange={setChatInput} onSend={(t) => startChat(t ?? chatInput)} placeholder="Ask a follow-up…" />
    </>
  );
}

// ─── CopilotPopunder (shell) ──────────────────────────────────────────────────

export default function CopilotPopunder({
  position,
  size,
  onPositionChange,
  onSizeChange,
  onClose,
  dragActivation = null,
}: CopilotPopunderProps) {
  const dragOffsetRef         = useRef({ x: 0, y: 0 });
  const resizeStartRef        = useRef({ mouseX: 0, mouseY: 0, width: 360, height: 720 });
  const isDraggingRef         = useRef(false);
  const isResizingRef         = useRef(false);
  const [isExpandedPanelOpen, setIsExpandedPanelOpen] = useState(false);

  useEffect(() => {
    if (!dragActivation) return;
    isDraggingRef.current  = true;
    dragOffsetRef.current  = dragActivation.offset;
    document.body.style.userSelect = "none";
  }, [dragActivation]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const margin = 16;
      if (isDraggingRef.current) {
        onPositionChange({ x: Math.min(Math.max(margin, event.clientX - dragOffsetRef.current.x), window.innerWidth - size.width - margin), y: Math.min(Math.max(margin, event.clientY - dragOffsetRef.current.y), window.innerHeight - size.height - margin) });
        return;
      }
      if (!isResizingRef.current) return;
      const dx = event.clientX - resizeStartRef.current.mouseX;
      const dy = event.clientY - resizeStartRef.current.mouseY;
      onSizeChange({ width: Math.min(Math.max(320, resizeStartRef.current.width + dx), window.innerWidth - position.x - margin), height: Math.min(Math.max(420, resizeStartRef.current.height + dy), window.innerHeight - position.y - margin) });
    };
    const handleMouseUp = () => { isDraggingRef.current = false; isResizingRef.current = false; document.body.style.userSelect = ""; };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => { window.removeEventListener("mousemove", handleMouseMove); window.removeEventListener("mouseup", handleMouseUp); document.body.style.userSelect = ""; };
  }, [onPositionChange, onSizeChange, position.x, position.y, size.height, size.width]);

  // Collapsed pill shown while the full-view panel is open
  if (isExpandedPanelOpen) {
    return (
      <div
        className="fixed z-[210] flex items-center gap-2 rounded-full border border-[#166CCA]/30 bg-white dark:bg-[#0F1629] shadow-[0_4px_16px_rgba(0,0,0,0.14)] px-3 py-2 cursor-grab active:cursor-grabbing transition-all"
        style={{ left: position.x, top: position.y }}
        onMouseDown={(e) => { isDraggingRef.current = true; dragOffsetRef.current = { x: e.clientX - position.x, y: e.clientY - position.y }; document.body.style.userSelect = "none"; }}
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#EBF4FD]">
          <Sparkles className="h-3.5 w-3.5 text-[#166CCA]" />
        </div>
        <span className="text-[12px] font-semibold text-[#166CCA] pr-1">AI Assistant</span>
        <div className="flex items-center gap-0.5" onMouseDown={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setIsExpandedPanelOpen(false)}
            className="flex h-6 w-6 items-center justify-center rounded-full text-[#667085] hover:bg-[#F2F4F7] hover:text-[#166CCA] transition-colors"
            title="Return to chat"
            aria-label="Return to chat"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded-full text-[#667085] hover:bg-[#F2F4F7] transition-colors"
            aria-label="Close AI Assistant"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes fadeSlideIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
      <div
        className="fixed z-[70] flex min-h-[420px] min-w-[320px] flex-col overflow-hidden rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0F1629] shadow-[0_20px_50px_rgba(0,0,0,0.18)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.55)]"
        style={{ left: position.x, top: position.y, width: size.width, height: size.height, maxWidth: "calc(100vw - 2rem)", maxHeight: "calc(100vh - 2rem)" }}
      >
        <div className="flex cursor-grab items-center justify-between gap-3 border-b border-border bg-background/50 px-5 py-4 active:cursor-grabbing shrink-0" onMouseDown={(e) => { isDraggingRef.current = true; dragOffsetRef.current = { x: e.clientX - position.x, y: e.clientY - position.y }; document.body.style.userSelect = "none"; }}>
          <div className="flex items-center gap-3">
            <GripHorizontal className="h-4 w-4 flex-shrink-0 text-[#7A7A7A]" />
            <h3 className="text-sm font-semibold tracking-tight text-[#333333]">AI Assistant</h3>
          </div>
          <div className="flex items-center gap-1" onMouseDown={(e) => e.stopPropagation()}>
            <button type="button" className="flex h-7 w-7 items-center justify-center rounded-full text-[#7A7A7A] transition-colors hover:bg-[#EBF4FD] hover:text-[#166CCA]" aria-label="New chat" title="New chat"><Plus className="h-4 w-4" /></button>
            <button type="button" className="flex h-7 w-7 items-center justify-center rounded-full text-[#7A7A7A] transition-colors hover:bg-[#EBF4FD] hover:text-[#166CCA]" aria-label="Chat history" title="Chat history"><Clock className="h-4 w-4" /></button>
            <button type="button" onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-full text-[#7A7A7A] transition-colors hover:bg-white hover:text-[#333333]" aria-label="Close AI Assistant"><X className="h-4 w-4" /></button>
          </div>
        </div>

        <CopilotContent onExpandedPanelChange={setIsExpandedPanelOpen} />

        <button type="button" aria-label="Resize AI Assistant" className="absolute bottom-0 right-0 h-5 w-5 cursor-se-resize" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); isResizingRef.current = true; resizeStartRef.current = { mouseX: e.clientX, mouseY: e.clientY, width: size.width, height: size.height }; document.body.style.userSelect = "none"; }}>
          <span className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-sm border-b-2 border-r-2 border-[#A1A1AA]" />
        </button>
      </div>
    </>
  );
}
