import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  GripHorizontal,
  Mic,
  Plus,
  Send,
  Sparkles,
  X,
} from "lucide-react";

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
  reasoning: string;
  answer: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const ANIMATED_SUBTEXTS = [
  "Ask anything about your resolution rates…",
  "Get help drafting a response to a customer…",
  "Summarize this conversation in seconds…",
  "Find the right escalation path instantly…",
  "Ask about customer history or trends…",
];

const SUGGESTION_PILLS = [
  "What are the key insights here?",
  "What should I focus on first?",
  "What changed recently?",
  "What actions do you recommend?",
  "Help me build a widget for my dashboard",
];

// Step timings (ms): how long each step takes before completing
const STEP_DURATIONS = [950, 950, 950, 1400];

function getThinkingSteps(question: string): ThinkingStep[] {
  return [
    {
      title: "Parse prompt and intent",
      description: `Detected question focus from "${question}".`,
    },
    {
      title: "Resolve page context",
      description: "Used what's visible on this page and the active time range.",
    },
    {
      title: "Draft answer with references",
      description: "Grounded the reply in on-screen context and doc-style citations.",
    },
    {
      title: "Preparing reply",
      description: "",
    },
  ];
}

function getCopilotResponse(question: string): CopilotResponse {
  const map: Record<string, CopilotResponse> = {
    "What are the key insights here?": {
      reasoning:
        "Scanned the active queue for volume, SLA risk, and priority distribution. Cross-referenced channel mix and resolution velocity to surface the most actionable signals on screen right now.",
      answer:
        "You have 3 critical cases approaching SLA breach in the next 30 minutes, all via email. Chat volume is 40% above your daily average, and your first-response time is trending 12% slower than yesterday. Those are the three threads worth watching first.",
    },
    "What should I focus on first?": {
      reasoning:
        "From your wording we identified what you're asking about, scoped it to the current page, time range, and what's on screen, and grounded the answer in those signals plus documentation-style references. That keeps the reply aligned with what you can see here and traceable back to sources.",
      answer:
        "I can explain what you're seeing, suggest filters or comparisons, spot trends, or help export what's on screen. What should we tackle first?",
    },
    "What changed recently?": {
      reasoning:
        "Compared the current queue snapshot against the rolling 24-hour baseline. Flagged cases that escalated, channels that spiked, and any priority changes in the last two hours.",
      answer:
        "In the last two hours, two cases were escalated to critical, WhatsApp volume jumped by 3 new cases, and one previously resolved case was reopened by the customer. The overall queue grew by 4 items since your last session.",
    },
    "What actions do you recommend?": {
      reasoning:
        "Assessed open cases by priority and SLA proximity, then matched available actions against your current workload and queue depth to surface the highest-leverage next steps.",
      answer:
        "Start with the two critical email cases — both are within 20 minutes of breach. Then acknowledge the three unresponded WhatsApp messages to reset SLA timers. After that, park the two low-priority chat cases and circle back once the critical backlog is clear.",
    },
  };

  return (
    map[question] ?? {
      reasoning:
        "Parsed your question, resolved the current page context, and drafted a response grounded in what's visible on screen.",
      answer:
        "Here's what I found based on your current queue and context. Let me know if you'd like me to dig deeper into any specific area.",
    }
  );
}

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
      const t = setTimeout(() => {
        setDisplayed(currentText.slice(0, charIndex + 1));
        setCharIndex((c) => c + 1);
      }, 38);
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
    const t = setTimeout(() => {
      setIndex((i) => (i + 1) % ANIMATED_SUBTEXTS.length);
      setCharIndex(0);
      setDisplayed("");
      setVisible(true);
      setPhase("typing");
    }, 300);
    return () => clearTimeout(t);
  }, [phase]);

  return (
    <p
      className="text-sm text-[#7A7A7A] transition-opacity duration-300 min-h-[1.25rem]"
      style={{ opacity: visible ? 1 : 0 }}
    >
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
    <svg
      className="h-4 w-4 animate-spin text-[#166CCA]"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12" cy="12" r="10"
        stroke="currentColor" strokeWidth="3"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

// ─── Thinking view ────────────────────────────────────────────────────────────

function ThinkingView({
  question,
  steps,
  completedCount,
}: {
  question: string;
  steps: ThinkingStep[];
  completedCount: number; // 0 = none done, 1 = first done, etc. steps[completedCount] is current
}) {
  const activeIndex = completedCount; // the currently-in-progress step index

  return (
    <div className="flex flex-1 flex-col min-h-0 overflow-y-auto">
      <div className="flex flex-col gap-4 px-4 py-5">
        {/* User message bubble */}
        <div className="flex justify-end">
          <div className="max-w-[80%] rounded-2xl bg-white dark:bg-[#1C2A3A] border border-black/8 dark:border-white/10 px-4 py-2.5 text-[14px] text-[#1D2939] dark:text-[#E2E8F0] shadow-sm">
            {question}
          </div>
        </div>

        {/* Thinking card */}
        <div className="rounded-xl border border-black/8 dark:border-white/8 bg-[#EBF4FD] dark:bg-[#0B2040] px-4 py-4">
          <div className="space-y-4">
            {steps.map((step, i) => {
              const isDone = i < completedCount;
              const isActive = i === activeIndex;
              if (!isDone && !isActive) return null; // not yet reached

              return (
                <div
                  key={i}
                  className="flex items-start gap-3"
                  style={{
                    animation: "fadeSlideIn 0.35s cubic-bezier(0.22,1,0.36,1) both",
                  }}
                >
                  {/* Icon */}
                  <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
                    {isDone ? (
                      <svg viewBox="0 0 16 16" className="h-4 w-4 text-[#166CCA]" fill="none">
                        <path
                          d="M3 8.5L6.5 12L13 5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <Spinner />
                    )}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-[#1D2939] dark:text-[#BFDBFE] leading-snug">
                      {step.title}
                    </p>
                    {isDone && step.description && (
                      <p className="mt-0.5 text-[12px] leading-snug text-[#6B7280] dark:text-[#7A8FAA]">
                        {step.description}
                      </p>
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

// ─── Response view ────────────────────────────────────────────────────────────

function ResponseView({
  question,
  response,
}: {
  question: string;
  response: CopilotResponse;
}) {
  const [reasoningOpen, setReasoningOpen] = useState(true);
  const [answerVisible, setAnswerVisible] = useState(false);

  // Stagger the answer appearing after reasoning
  useEffect(() => {
    const t = setTimeout(() => setAnswerVisible(true), 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex flex-1 flex-col min-h-0 overflow-y-auto">
      <div className="flex flex-col gap-4 px-4 py-5">
        {/* User message bubble */}
        <div className="flex justify-end">
          <div className="max-w-[80%] rounded-2xl bg-white dark:bg-[#1C2A3A] border border-black/8 dark:border-white/10 px-4 py-2.5 text-[14px] text-[#1D2939] dark:text-[#E2E8F0] shadow-sm">
            {question}
          </div>
        </div>

        {/* Reasoning collapsible */}
        <div
          style={{ animation: "fadeSlideIn 0.4s cubic-bezier(0.22,1,0.36,1) both" }}
        >
          <button
            type="button"
            onClick={() => setReasoningOpen((o) => !o)}
            className="flex items-center gap-1.5 text-[13px] font-semibold text-[#1D2939] dark:text-[#E2E8F0] mb-2"
          >
            Reasoning
            {reasoningOpen ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>

          {reasoningOpen && (
            <div className="rounded-xl border border-[#166CCA]/20 dark:border-[#166CCA]/30 bg-[#EBF4FD] dark:bg-[#0B1E35] px-4 py-3">
              <p className="text-[13px] leading-relaxed text-[#1260B0] dark:text-[#BFDBFE]">
                {response.reasoning}
              </p>
            </div>
          )}
        </div>

        {/* AI answer */}
        <div
          className="transition-opacity duration-500"
          style={{
            opacity: answerVisible ? 1 : 0,
            animation: answerVisible
              ? "fadeSlideIn 0.45s cubic-bezier(0.22,1,0.36,1) both"
              : undefined,
          }}
        >
          <p className="text-[15px] font-medium leading-relaxed text-[#1D2939] dark:text-[#E2E8F0]">
            {response.answer}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Chat input ───────────────────────────────────────────────────────────────

function ChatInput({
  value,
  onChange,
  onSend,
  placeholder = "Ask a question…",
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: (text?: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="shrink-0 border-t border-border bg-background px-4 py-3">
      <div className="flex items-center gap-2 rounded-xl border border-black/10 bg-[#F8F8F9] px-3 py-2 focus-within:border-[#166CCA]/40 focus-within:bg-white transition-colors">
        <button
          type="button"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[#7A7A7A] hover:text-[#166CCA] transition-colors"
          aria-label="Attach"
        >
          <Plus className="h-4 w-4" />
        </button>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-sm text-[#333333] placeholder:text-[#AAAAAA] focus:outline-none"
        />
        {value.trim() ? (
          <button
            type="button"
            onClick={() => onSend()}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#166CCA] text-white transition-colors hover:bg-[#1260B0]"
            aria-label="Send"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button
            type="button"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#7A7A7A] hover:text-[#166CCA] transition-colors"
            aria-label="Voice input"
          >
            <Mic className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── CopilotContent ───────────────────────────────────────────────────────────

export function CopilotContent() {
  const [view, setView] = useState<ChatView>("empty");
  const [chatInput, setChatInput] = useState("");
  const [question, setQuestion] = useState("");
  const [completedSteps, setCompletedSteps] = useState(0);
  const [copilotResponse, setCopilotResponse] = useState<CopilotResponse | null>(null);

  const thinkingSteps = question ? getThinkingSteps(question) : [];

  // Drive the thinking animation step by step
  useEffect(() => {
    if (view !== "thinking") return;

    let cancelled = false;
    let elapsed = 0;

    const advanceStep = (stepIndex: number) => {
      if (cancelled || stepIndex >= STEP_DURATIONS.length) return;
      const duration = STEP_DURATIONS[stepIndex];
      elapsed += duration;

      const t = setTimeout(() => {
        if (cancelled) return;
        const nextCompleted = stepIndex + 1;
        setCompletedSteps(nextCompleted);

        if (nextCompleted >= thinkingSteps.length) {
          // All steps done → transition to response
          setTimeout(() => {
            if (cancelled) return;
            setCopilotResponse(getCopilotResponse(question));
            setView("response");
          }, 300);
        } else {
          advanceStep(nextCompleted);
        }
      }, duration);

      return t;
    };

    advanceStep(0);

    return () => {
      cancelled = true;
    };
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

  const resetToEmpty = () => {
    setView("empty");
    setQuestion("");
    setCompletedSteps(0);
    setCopilotResponse(null);
    setChatInput("");
  };

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (view === "empty") {
    return (
      <>
        <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 py-8 min-h-0 overflow-y-auto">
          <img src={`${import.meta.env.BASE_URL}ai-indicator.svg`} alt="" className="h-24 w-24" />

          <div className="text-center space-y-2">
            <h2 className="text-[17px] font-semibold text-[#1D2939] dark:text-[#E2E8F0] leading-snug">
              How can I help you today?
            </h2>
            <AnimatedSubtext />
          </div>

          <div className="w-full space-y-2 pt-1">
            {SUGGESTION_PILLS.map((pill) => (
              <button
                key={pill}
                type="button"
                onClick={() => startChat(pill)}
                className="w-full rounded-full border border-black/10 dark:border-white/10 bg-[#F8F8F9] dark:bg-[#1C2A3A] px-4 py-2.5 text-left text-sm text-[#1D2939] dark:text-[#CBD5E1] transition-colors hover:bg-[#EBF4FD] dark:hover:bg-[#0B1E35] hover:border-[#166CCA]/30 hover:text-[#166CCA] dark:hover:text-[#BFDBFE]"
              >
                {pill}
              </button>
            ))}
          </div>
        </div>

        <ChatInput
          value={chatInput}
          onChange={setChatInput}
          onSend={(t) => startChat(t ?? chatInput)}
        />
      </>
    );
  }

  // ── Thinking state ───────────────────────────────────────────────────────────
  if (view === "thinking") {
    return (
      <>
        <ThinkingView
          question={question}
          steps={thinkingSteps}
          completedCount={completedSteps}
        />
        <ChatInput
          value={chatInput}
          onChange={setChatInput}
          onSend={(t) => startChat(t ?? chatInput)}
          placeholder="Ask a follow-up…"
        />
      </>
    );
  }

  // ── Response state ───────────────────────────────────────────────────────────
  return (
    <>
      <ResponseView question={question} response={copilotResponse!} />
      <ChatInput
        value={chatInput}
        onChange={setChatInput}
        onSend={(t) => startChat(t ?? chatInput)}
        placeholder="Ask a follow-up…"
      />
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
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const resizeStartRef = useRef({ mouseX: 0, mouseY: 0, width: 360, height: 720 });
  const isDraggingRef = useRef(false);
  const isResizingRef = useRef(false);

  useEffect(() => {
    if (!dragActivation) return;
    isDraggingRef.current = true;
    dragOffsetRef.current = dragActivation.offset;
    document.body.style.userSelect = "none";
  }, [dragActivation]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const margin = 16;
      if (isDraggingRef.current) {
        onPositionChange({
          x: Math.min(Math.max(margin, event.clientX - dragOffsetRef.current.x), window.innerWidth - size.width - margin),
          y: Math.min(Math.max(margin, event.clientY - dragOffsetRef.current.y), window.innerHeight - size.height - margin),
        });
        return;
      }
      if (!isResizingRef.current) return;
      const dx = event.clientX - resizeStartRef.current.mouseX;
      const dy = event.clientY - resizeStartRef.current.mouseY;
      onSizeChange({
        width: Math.min(Math.max(320, resizeStartRef.current.width + dx), window.innerWidth - position.x - margin),
        height: Math.min(Math.max(420, resizeStartRef.current.height + dy), window.innerHeight - position.y - margin),
      });
    };
    const handleMouseUp = () => {
      isDraggingRef.current = false;
      isResizingRef.current = false;
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
    };
  }, [onPositionChange, onSizeChange, position.x, position.y, size.height, size.width]);

  return (
    <>
      {/* Keyframe for step/answer fade-in */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        className="fixed z-[70] flex min-h-[420px] min-w-[320px] flex-col overflow-hidden rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0F1629] shadow-[0_20px_50px_rgba(0,0,0,0.18)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.55)]"
        style={{
          left: position.x,
          top: position.y,
          width: size.width,
          height: size.height,
          maxWidth: "calc(100vw - 2rem)",
          maxHeight: "calc(100vh - 2rem)",
        }}
      >
        {/* Header */}
        <div
          className="flex cursor-grab items-center justify-between gap-3 border-b border-border bg-background/50 px-5 py-4 active:cursor-grabbing shrink-0"
          onMouseDown={(e) => {
            isDraggingRef.current = true;
            dragOffsetRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
            document.body.style.userSelect = "none";
          }}
        >
          <div className="flex items-center gap-3">
            <GripHorizontal className="h-4 w-4 flex-shrink-0 text-[#7A7A7A]" />
            <h3 className="text-sm font-semibold tracking-tight text-[#333333]">AI Assistant</h3>
          </div>

          <div className="flex items-center gap-1" onMouseDown={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-full text-[#7A7A7A] transition-colors hover:bg-[#EBF4FD] hover:text-[#166CCA]"
              aria-label="New chat"
              title="New chat"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-full text-[#7A7A7A] transition-colors hover:bg-[#EBF4FD] hover:text-[#166CCA]"
              aria-label="Chat history"
              title="Chat history"
            >
              <Clock className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-full text-[#7A7A7A] transition-colors hover:bg-white hover:text-[#333333]"
              aria-label="Close AI Assistant"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <CopilotContent />

        {/* Resize handle */}
        <button
          type="button"
          aria-label="Resize AI Assistant"
          className="absolute bottom-0 right-0 h-5 w-5 cursor-se-resize"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            isResizingRef.current = true;
            resizeStartRef.current = {
              mouseX: e.clientX,
              mouseY: e.clientY,
              width: size.width,
              height: size.height,
            };
            document.body.style.userSelect = "none";
          }}
        >
          <span className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-sm border-b-2 border-r-2 border-[#A1A1AA]" />
        </button>
      </div>
    </>
  );
}
