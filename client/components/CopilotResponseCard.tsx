import { useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const COPILOT_REASONING_STEPS = [
  "Reviewing case history and prior customer interactions...",
  "Analyzing attempted resolutions and their outcomes...",
  "Cross-referencing similar resolved cases in the knowledge base...",
  "Synthesizing recommended next steps and action items...",
];

export function CopilotResponseCard({
  query,
  phase,
  reasoningVisible,
  isOpen,
  onToggle,
}: {
  query: string;
  phase: "thinking" | "done";
  reasoningVisible: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const [isReasoningOpen, setIsReasoningOpen] = useState(false);

  return (
    <div className="rounded-xl border border-[#BFDBFE] bg-white overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-[#166CCA]" />
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1260B0]">
            Copilot Response
          </p>
          {phase === "thinking" && (
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#166CCA] animate-bounce [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#166CCA] animate-bounce [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#166CCA] animate-bounce [animation-delay:300ms]" />
            </span>
          )}
        </div>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-[#1260B0] transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>

      <div
        className={cn(
          "grid transition-all duration-200 ease-out",
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4 space-y-3">
            <p className="text-[11px] text-[#98A2B3] italic">"{query}"</p>

            {reasoningVisible > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setIsReasoningOpen((v) => !v)}
                  className="flex items-center gap-1 text-[11px] text-[#98A2B3] hover:text-[#667085] transition-colors"
                >
                  <span>{phase === "thinking" ? "Thinking…" : "Thought process"}</span>
                  <ChevronDown
                    className={cn(
                      "h-3 w-3 transition-transform duration-200",
                      isReasoningOpen && "rotate-180",
                    )}
                  />
                </button>
                <div
                  className={cn(
                    "grid transition-all duration-200 ease-out",
                    isReasoningOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="pt-2 space-y-1.5 border-l-2 border-[#C5DEF5] ml-1 pl-3">
                      {COPILOT_REASONING_STEPS.slice(0, reasoningVisible).map((step, i) => (
                        <div
                          key={i}
                          className="text-[11px] text-[#98A2B3] animate-in fade-in slide-in-from-bottom-1 duration-300"
                        >
                          {step}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {phase === "done" && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-400 rounded-lg bg-[#EBF4FD] border border-[#BFDBFE] px-3 py-2.5">
                <p className="text-[12px] text-[#344054] leading-relaxed">
                  Based on the case analysis, the customer's issue appears to stem from an account configuration mismatch. The previous resolution attempts addressed symptoms but not the root cause. I recommend verifying the account settings directly, issuing a service credit for the disruption, and scheduling a follow-up within 48 hours to confirm resolution.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
