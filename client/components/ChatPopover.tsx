import { useEffect, useRef, useState } from "react";
import { GripHorizontal, Phone, PhoneOff, Send, X } from "lucide-react";

import { cn } from "@/lib/utils";

// ─── Seed data ────────────────────────────────────────────────────────────────

type ChatMessage = {
  id: number;
  sender: string;
  text: string;
  time: string;
  isMe: boolean;
};

type Conversation = {
  id: string;
  name: string;
  role: string;
  initials: string;
  avatarColor: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  messages: ChatMessage[];
};

const seedConversations: Conversation[] = [
  {
    id: "sarah-kim",
    name: "Sarah Kim",
    role: "Senior Agent",
    initials: "SK",
    avatarColor: "#166CCA",
    lastMessage: "Let me know when you're free to review Case 271",
    timestamp: "2:14 PM",
    unread: 2,
    messages: [
      { id: 1, sender: "Sarah Kim",  text: "Hey, do you have bandwidth to help with a Case 271 escalation?", time: "2:08 PM", isMe: false },
      { id: 2, sender: "Me",         text: "Sure, what's the issue?", time: "2:10 PM", isMe: true },
      { id: 3, sender: "Sarah Kim",  text: "VIP customer Lauren Kim can't access same-day settlement funds. She's been on hold for 20 mins.", time: "2:12 PM", isMe: false },
      { id: 4, sender: "Sarah Kim",  text: "Let me know when you're free to review Case 271", time: "2:14 PM", isMe: false },
    ],
  },
  {
    id: "mike-torres",
    name: "Mike Torres",
    role: "Team Lead",
    initials: "MT",
    avatarColor: "#7C3AED",
    lastMessage: "Thanks for handling the David Brown account",
    timestamp: "1:45 PM",
    unread: 0,
    messages: [
      { id: 1, sender: "Mike Torres", text: "Quick heads up — David Brown's Enterprise plan change is flagging in the system.", time: "1:30 PM", isMe: false },
      { id: 2, sender: "Me",          text: "On it. Looks like a duplicate hold — I'll clear it now.", time: "1:38 PM", isMe: true },
      { id: 3, sender: "Mike Torres", text: "Thanks for handling the David Brown account", time: "1:45 PM", isMe: false },
    ],
  },
  {
    id: "emma-larsen",
    name: "Emma Larsen",
    role: "Quality Coach",
    initials: "EL",
    avatarColor: "#059669",
    lastMessage: "Your CSAT scores look great this week 🎉",
    timestamp: "11:22 AM",
    unread: 1,
    messages: [
      { id: 1, sender: "Emma Larsen", text: "Just finished reviewing your last five interactions.", time: "11:18 AM", isMe: false },
      { id: 2, sender: "Emma Larsen", text: "Your CSAT scores look great this week 🎉", time: "11:22 AM", isMe: false },
    ],
  },
  {
    id: "carlos-mendez",
    name: "Carlos Mendez",
    role: "IT Support",
    initials: "CM",
    avatarColor: "#BE123C",
    lastMessage: "Ticket for the portal fix has been submitted",
    timestamp: "Yesterday",
    unread: 0,
    messages: [
      { id: 1, sender: "Me",            text: "Hey Carlos, the document upload portal is throwing a 500 error for some customers.", time: "Yesterday", isMe: true },
      { id: 2, sender: "Carlos Mendez", text: "Got it, I'll look into it right away.", time: "Yesterday", isMe: false },
      { id: 3, sender: "Carlos Mendez", text: "Ticket for the portal fix has been submitted", time: "Yesterday", isMe: false },
    ],
  },
];

type Agent = {
  id: string;
  name: string;
  role: string;
  initials: string;
  avatarColor: string;
  status: "online" | "away" | "offline";
};

const seedAgents: Agent[] = [
  { id: "sarah-kim",     name: "Sarah Kim",     role: "Senior Agent",     initials: "SK", avatarColor: "#166CCA", status: "online"  },
  { id: "mike-torres",   name: "Mike Torres",   role: "Team Lead",         initials: "MT", avatarColor: "#7C3AED", status: "online"  },
  { id: "emma-larsen",   name: "Emma Larsen",   role: "Quality Coach",     initials: "EL", avatarColor: "#059669", status: "online"  },
  { id: "carlos-mendez", name: "Carlos Mendez", role: "IT Support",        initials: "CM", avatarColor: "#BE123C", status: "away"    },
  { id: "lina-park",     name: "Lina Park",     role: "Enablement Desk",   initials: "LP", avatarColor: "#0891B2", status: "online"  },
  { id: "sofia-ramirez", name: "Sofia Ramirez", role: "Enterprise Billing", initials: "SR", avatarColor: "#9333EA", status: "offline" },
  { id: "owen-brooks",   name: "Owen Brooks",   role: "Checkout Ops",      initials: "OB", avatarColor: "#D97706", status: "away"    },
  { id: "marcus-lee",    name: "Marcus Lee",    role: "Billing Support",   initials: "ML", avatarColor: "#16A34A", status: "offline" },
  { id: "ava-thompson",  name: "Ava Thompson",  role: "Rewards Support",   initials: "AT", avatarColor: "#DB2777", status: "online"  },
  { id: "noah-kim",      name: "Noah Kim",      role: "Claims Resolution", initials: "NK", avatarColor: "#EA580C", status: "away"    },
  { id: "mila-fischer",  name: "Mila Fischer",  role: "Premier Support",   initials: "MF", avatarColor: "#7C3AED", status: "online"  },
  { id: "ben-carter",    name: "Ben Carter",    role: "Document Review",   initials: "BC", avatarColor: "#0E7490", status: "offline" },
];

const STATUS_DOT: Record<Agent["status"], string> = {
  online:  "bg-[#208337]",
  away:    "bg-[#FFB800]",
  offline: "bg-[#D0D5DD]",
};

const seedTeams: Conversation[] = [
  {
    id: "team-digital-care",
    name: "Digital Care",
    role: "14 members",
    initials: "DC",
    avatarColor: "#D97706",
    lastMessage: "Reminder: system maintenance tonight at 10 PM",
    timestamp: "10:05 AM",
    unread: 0,
    messages: [
      { id: 1, sender: "Mike Torres",   text: "Morning everyone — high volume on chat today, please keep handle times tight.", time: "9:15 AM", isMe: false },
      { id: 2, sender: "Emma Larsen",   text: "CSAT trend is up 4 pts vs last week — great work!", time: "9:45 AM", isMe: false },
      { id: 3, sender: "Carlos Mendez", text: "Reminder: system maintenance tonight at 10 PM", time: "10:05 AM", isMe: false },
    ],
  },
  {
    id: "team-risk-compliance",
    name: "Risk & Compliance",
    role: "8 members",
    initials: "RC",
    avatarColor: "#7C3AED",
    lastMessage: "New fraud pattern flagged — review before EOD",
    timestamp: "9:30 AM",
    unread: 3,
    messages: [
      { id: 1, sender: "Elena Petrova", text: "We're seeing a new transaction fraud pattern across 3 accounts this morning.", time: "9:10 AM", isMe: false },
      { id: 2, sender: "Elena Petrova", text: "New fraud pattern flagged — review before EOD", time: "9:30 AM", isMe: false },
    ],
  },
  {
    id: "team-billing-support",
    name: "Billing Support",
    role: "11 members",
    initials: "BS",
    avatarColor: "#059669",
    lastMessage: "Monthly billing cycle closes at midnight",
    timestamp: "Yesterday",
    unread: 0,
    messages: [
      { id: 1, sender: "Marcus Lee", text: "Heads up — we had 12 duplicate charge reports come in this morning.", time: "Yesterday", isMe: false },
      { id: 2, sender: "Me",         text: "I'll flag the cases on my end and route to the refund team.", time: "Yesterday", isMe: true },
      { id: 3, sender: "Marcus Lee", text: "Monthly billing cycle closes at midnight", time: "Yesterday", isMe: false },
    ],
  },
  {
    id: "team-it-support",
    name: "IT Support",
    role: "6 members",
    initials: "IT",
    avatarColor: "#BE123C",
    lastMessage: "Portal fix deployed to staging",
    timestamp: "Yesterday",
    unread: 0,
    messages: [
      { id: 1, sender: "Carlos Mendez", text: "Document upload portal fix has been deployed to staging for review.", time: "Yesterday", isMe: false },
      { id: 2, sender: "Carlos Mendez", text: "Portal fix deployed to staging", time: "Yesterday", isMe: false },
    ],
  },
];

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ initials, color, size = "md", status }: { initials: string; color: string; size?: "sm" | "md"; status?: Agent["status"] }) {
  return (
    <div className="relative shrink-0 inline-flex">
      <div
        className={cn(
          "flex items-center justify-center rounded-full font-semibold text-white",
          size === "sm" ? "h-7 w-7 text-[10px]" : "h-9 w-9 text-[11px]",
        )}
        style={{ backgroundColor: color }}
      >
        {initials}
      </div>
      {status && (
        <span className={cn(
          "absolute rounded-full border-2 border-white dark:border-[#0D1525]",
          size === "sm" ? "h-2 w-2 -bottom-0.5 -right-0.5" : "h-2.5 w-2.5 bottom-0 right-0",
          STATUS_DOT[status],
        )} />
      )}
    </div>
  );
}

// ─── Conversation list ────────────────────────────────────────────────────────

function ConversationRow({ conv, onSelect }: { conv: Conversation; onSelect: (id: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(conv.id)}
      className="flex w-full items-center gap-3 border-b border-black/[0.06] dark:border-border px-4 py-3.5 text-left transition-colors hover:bg-[#F8F8F9] dark:hover:bg-[#1C2536]"
    >
      <Avatar initials={conv.initials} color={conv.avatarColor} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-[#111827] dark:text-[#E2E8F0]">{conv.name}</span>
          <span className="shrink-0 text-[11px] text-[#98A2B3]">{conv.timestamp}</span>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p className="truncate text-xs text-[#667085]">{conv.lastMessage}</p>
          {conv.unread > 0 && (
            <span className="flex h-4 min-w-[16px] shrink-0 items-center justify-center rounded-full bg-[#166CCA] px-1 text-[10px] font-semibold text-white">
              {conv.unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function AgentRow({ agent, onNewMessage }: { agent: Agent; onNewMessage: (agent: Agent) => void }) {
  return (
    <button
      type="button"
      onClick={() => onNewMessage(agent)}
      className="flex w-full items-center gap-3 border-b border-black/[0.06] dark:border-border px-4 py-3 text-left transition-colors hover:bg-[#F8F8F9] dark:hover:bg-[#1C2536]"
    >
      <div className="relative shrink-0">
        <Avatar initials={agent.initials} color={agent.avatarColor} />
        <span
          className={cn(
            "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-[#0D1525]",
            STATUS_DOT[agent.status],
          )}
        />
      </div>
      <div className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-[#111827] dark:text-[#E2E8F0]">{agent.name}</span>
        <span className="block truncate text-xs text-[#667085]">{agent.role}</span>
      </div>
    </button>
  );
}

type ListTab = "Recents" | "Agents" | "Teams";

function ConversationList({
  conversations,
  teams,
  onSelect,
  onNewMessage,
}: {
  conversations: Conversation[];
  teams: Conversation[];
  onSelect: (id: string) => void;
  onNewMessage: (agent: Agent | Conversation) => void;
}) {
  const [activeTab, setActiveTab] = useState<ListTab>("Recents");

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Tabs */}
      <div className="flex shrink-0 border-b border-black/10 dark:border-border bg-white dark:bg-[#0D1525]">
        {(["Recents", "Agents", "Teams"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              "relative px-4 py-3 text-[13px] font-medium transition-colors",
              activeTab === tab ? "text-[#166CCA]" : "text-[#7A7A7A] dark:text-[#8898AB] hover:text-[#333333] dark:hover:text-[#CBD5E1]",
            )}
          >
            {tab}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full bg-[#166CCA]" />
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "Recents" && conversations.map((conv) => (
          <ConversationRow key={conv.id} conv={conv} onSelect={onSelect} />
        ))}
        {activeTab === "Agents" && seedAgents.map((agent) => (
          <AgentRow key={agent.id} agent={agent} onNewMessage={onNewMessage} />
        ))}
        {activeTab === "Teams" && teams.map((team) => (
          <ConversationRow key={team.id} conv={team} onSelect={(id) => {
            const found = teams.find((t) => t.id === id);
            if (found) onNewMessage(found);
          }} />
        ))}
      </div>
    </div>
  );
}

// ─── Thread view ──────────────────────────────────────────────────────────────

function ThreadView({ conversation, agentStatus }: { conversation: Conversation; agentStatus?: Agent["status"] }) {
  const [messages, setMessages] = useState<ChatMessage[]>(conversation.messages);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), sender: "Me", text, time: "Just now", isMe: true },
    ]);
    setDraft("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraft(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Messages */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-[#98A2B3]">Start of conversation with {conversation.name}</p>
          </div>
        ) : (
          <>
            <p className="mb-4 text-center text-xs text-[#98A2B3]">
              Start of conversation with {conversation.name}
            </p>
            <div className="flex flex-col gap-2">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn("flex items-end gap-2", msg.isMe ? "flex-row-reverse" : "flex-row")}
                >
                  {!msg.isMe && (
                    <Avatar initials={conversation.initials} color={conversation.avatarColor} size="sm" status={agentStatus} />
                  )}
                  <div className={cn("flex max-w-[75%] flex-col gap-0.5", msg.isMe ? "items-end" : "items-start")}>
                    {!msg.isMe && (
                      <span className="px-1 text-[10px] text-[#98A2B3]">{msg.sender}</span>
                    )}
                    <div
                      className={cn(
                        "rounded-2xl px-3 py-2 text-sm leading-relaxed",
                        msg.isMe
                          ? "rounded-br-sm bg-[#166CCA] text-white"
                          : "rounded-bl-sm bg-[#F2F4F7] dark:bg-[#1C2A3A] text-[#111827] dark:text-[#E2E8F0]",
                      )}
                    >
                      {msg.text}
                    </div>
                    <span className="px-1 text-[10px] text-[#98A2B3]">{msg.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-black/10 dark:border-border bg-white dark:bg-[#0D1525] p-3">
        <div className="flex items-end gap-2 rounded-2xl border border-black/10 dark:border-border bg-[#F8F8F9] dark:bg-[#1C2A3A] px-3 py-2">
          <textarea
            ref={textareaRef}
            rows={1}
            value={draft}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="max-h-32 min-h-[20px] flex-1 resize-none bg-transparent text-sm text-[#111827] dark:text-[#E2E8F0] placeholder:text-[#98A2B3] focus:outline-none"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!draft.trim()}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#166CCA] text-white transition-colors hover:bg-[#0A5E92] disabled:opacity-40"
            aria-label="Send message"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ChatPopoverContent ───────────────────────────────────────────────────────

const MARGIN = 16;
const MIN_WIDTH = 280;
const MIN_HEIGHT = 400;

export type PendingChatAgent = {
  id: string;
  name: string;
  initials: string;
  role: string;
  avatarColor?: string;
  status?: Agent["status"];
};

export default function ChatPopoverContent({
  visible,
  position,
  size,
  zIndex,
  onPositionChange,
  onSizeChange,
  onClose,
  onInteractStart,
  onUnreadCountChange,
  initialConversationId,
  pendingAgent,
  autoStartCall,
  onPendingAgentConsumed,
}: {
  visible?: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  onPositionChange: (p: { x: number; y: number }) => void;
  onSizeChange: (s: { width: number; height: number }) => void;
  onClose: () => void;
  onInteractStart?: () => void;
  onUnreadCountChange?: (count: number) => void;
  initialConversationId?: string;
  pendingAgent?: PendingChatAgent | null;
  autoStartCall?: boolean;
  onPendingAgentConsumed?: () => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(initialConversationId ?? null);
  const [conversations, setConversations] = useState<Conversation[]>(seedConversations);
  const [isCallingAgent, setIsCallingAgent] = useState(false);
  const isDraggingRef = useRef(false);
  const isResizingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const resizeStartRef = useRef({ mouseX: 0, mouseY: 0, width: size.width, height: size.height });

  // Bubble total unread count up to parent whenever it changes
  useEffect(() => {
    const total = [...conversations, ...seedTeams].reduce((sum, c) => sum + (c.unread ?? 0), 0);
    onUnreadCountChange?.(total);
  }, [conversations, onUnreadCountChange]);

  // All conversations = recents + any created from agents/teams
  const allConversations = [...conversations, ...seedTeams];
  const selectedConversation =
    allConversations.find((c) => c.id === selectedId) ?? null;

  const handleSelect = (id: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c)),
    );
    setSelectedId(id);
  };

  // Open or create a thread from an Agent or Team entry
  const handleNewMessage = (source: Agent | Conversation) => {
    const existing = conversations.find((c) => c.id === source.id)
      ?? seedTeams.find((t) => t.id === source.id);
    if (existing) {
      setConversations((prev) =>
        prev.map((c) => (c.id === existing.id ? { ...c, unread: 0 } : c)),
      );
      setSelectedId(existing.id);
      return;
    }
    // Create a fresh conversation and add to recents
    const fresh: Conversation = {
      id: source.id,
      name: source.name,
      role: source.role,
      initials: source.initials,
      avatarColor: source.avatarColor,
      lastMessage: "",
      timestamp: "Just now",
      unread: 0,
      messages: [],
    };
    setConversations((prev) => [fresh, ...prev]);
    setSelectedId(fresh.id);
  };

  // When a pending agent is passed (e.g. from Directory), open/create their thread
  useEffect(() => {
    if (!pendingAgent) return;
    const agentSource: Agent = {
      id: pendingAgent.id,
      name: pendingAgent.name,
      initials: pendingAgent.initials,
      role: pendingAgent.role,
      avatarColor: pendingAgent.avatarColor ?? "#475467",
      status: pendingAgent.status ?? "offline",
    };
    handleNewMessage(agentSource);
    if (autoStartCall) setIsCallingAgent(true);
    onPendingAgentConsumed?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAgent]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        onPositionChange({
          x: Math.min(Math.max(MARGIN, e.clientX - dragOffsetRef.current.x), window.innerWidth - size.width - MARGIN),
          y: Math.min(Math.max(MARGIN, e.clientY - dragOffsetRef.current.y), window.innerHeight - size.height - MARGIN),
        });
        return;
      }
      if (!isResizingRef.current) return;
      const dx = e.clientX - resizeStartRef.current.mouseX;
      const dy = e.clientY - resizeStartRef.current.mouseY;
      onSizeChange({
        width: Math.min(Math.max(MIN_WIDTH, resizeStartRef.current.width + dx), window.innerWidth - position.x - MARGIN),
        height: Math.min(Math.max(MIN_HEIGHT, resizeStartRef.current.height + dy), window.innerHeight - position.y - MARGIN),
      });
    };
    const onMouseUp = () => {
      isDraggingRef.current = false;
      isResizingRef.current = false;
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      document.body.style.userSelect = "";
    };
  }, [onPositionChange, onSizeChange, position.x, position.y, size.width, size.height]);

  return (
    <div
      className={cn(
        "fixed flex flex-col overflow-hidden rounded-xl border border-black/10 dark:border-border bg-white dark:bg-[#0D1525] shadow-[0_20px_50px_rgba(0,0,0,0.18)] transition-[opacity,transform] duration-[280ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[opacity,transform]",
        visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-[0.97] translate-y-1",
      )}
      style={{ left: position.x, top: position.y, width: size.width, height: size.height, zIndex, maxWidth: "calc(100vw - 2rem)", maxHeight: "calc(100vh - 2rem)" }}
      onMouseDown={onInteractStart}
    >
      {/* Drag header */}
      <div
        className="flex shrink-0 cursor-grab items-start justify-between gap-3 border-b border-border bg-background/50 px-5 py-4 active:cursor-grabbing"
        onMouseDown={(e) => {
          onInteractStart?.();
          isDraggingRef.current = true;
          dragOffsetRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
          document.body.style.userSelect = "none";
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <GripHorizontal className="h-4 w-4 shrink-0 text-[#7A7A7A]" />
          {selectedConversation ? (
            <button
              type="button"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => { setSelectedId(null); setIsCallingAgent(false); }}
              className="flex items-center gap-1 text-sm font-semibold text-[#166CCA] transition-colors hover:text-[#0A5E92]"
              aria-label="Back to messages"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 12L6 8l4-4" />
              </svg>
            </button>
          ) : null}
          {selectedConversation ? (() => {
            const agent = seedAgents.find((a) => a.id === selectedConversation.id);
            return (
              <div className="flex items-center gap-2 min-w-0">
                <Avatar initials={selectedConversation.initials} color={selectedConversation.avatarColor} size="sm" status={agent?.status} />
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-[#333333] dark:text-[#E2E8F0] truncate leading-tight">{selectedConversation.name}</p>
                  {agent && (
                    <p className={cn("text-[10px] font-medium leading-tight", agent.status === "online" ? "text-[#208337]" : agent.status === "away" ? "text-[#D97706]" : "text-[#98A2B3]")}>
                      {agent.status === "online" ? "Available" : agent.status === "away" ? "Away" : "Offline"}
                    </p>
                  )}
                </div>
              </div>
            );
          })() : (
            <h3 className="text-sm font-semibold text-[#333333]">Messages</h3>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1" onMouseDown={(e) => e.stopPropagation()}>
          {selectedConversation && (() => {
            const agent = seedAgents.find((a) => a.id === selectedConversation.id);
            const canCall = agent && agent.status !== "offline";
            return (
              <button
                type="button"
                disabled={!canCall}
                onClick={() => setIsCallingAgent((v) => !v)}
                title={isCallingAgent ? "End call" : canCall ? `Call ${selectedConversation.name}` : "Agent offline"}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full transition-colors",
                  isCallingAgent
                    ? "bg-[#E32926] text-white hover:bg-[#C71D1A]"
                    : canCall
                      ? "text-[#208337] hover:bg-[#EFFBF1]"
                      : "text-[#D0D5DD] cursor-not-allowed",
                )}
              >
                {isCallingAgent ? <PhoneOff className="h-3.5 w-3.5" /> : <Phone className="h-3.5 w-3.5" />}
              </button>
            );
          })()}
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#7A7A7A] dark:text-[#94A3B8] transition-colors hover:bg-[#F2F4F7] dark:hover:bg-[#1C2536] hover:text-[#333333] dark:hover:text-[#E2E8F0]"
            aria-label="Close messages"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {selectedConversation ? (
          <ThreadView key={selectedConversation.id} conversation={selectedConversation} />
        ) : (
          <ConversationList
            conversations={conversations}
            teams={seedTeams}
            onSelect={handleSelect}
            onNewMessage={handleNewMessage}
          />
        )}
      </div>

      {/* Resize handle */}
      <button
        type="button"
        aria-label="Resize messages panel"
        className="absolute bottom-0 right-0 h-5 w-5 cursor-se-resize"
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          isResizingRef.current = true;
          resizeStartRef.current = { mouseX: e.clientX, mouseY: e.clientY, width: size.width, height: size.height };
          document.body.style.userSelect = "none";
        }}
      >
        <span className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-sm border-b-2 border-r-2 border-[#A1A1AA]" />
      </button>
    </div>
  );
}
