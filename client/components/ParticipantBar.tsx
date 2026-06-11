import React from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ConferenceParticipant, ChatCoParticipant } from "./layout-context";

type BarAgent = (Omit<ConferenceParticipant, "joinedAt"> | Omit<ChatCoParticipant, "joinedAt">) & {
  joinedAt?: string;
  status?: "joining" | "live" | "left";
};

interface ParticipantBarProps {
  customer: { name: string; initials: string };
  agents: BarAgent[];
  context: "voice" | "chat";
  onRemove?: (agentId: string) => void;
  className?: string;
}

export function ParticipantBar({
  customer,
  agents,
  context,
  onRemove,
  className,
}: ParticipantBarProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          "flex shrink-0 items-center gap-3 border-b border-black/[0.06] bg-[#F8F9FB] px-4 dark:bg-[#0D1525] dark:border-white/[0.06]",
          "h-[48px]",
          className,
        )}
      >
        {/* Label */}
        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-widest text-[#98A2B3]">
          Participants
        </span>

        {/* Chips */}
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto scrollbar-none">
          {/* Customer chip — always first */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative shrink-0">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#475467] text-[10px] font-bold text-white">
                  {customer.initials}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[11px]">
              {customer.name} <span className="text-[#98A2B3]">· Customer</span>
            </TooltipContent>
          </Tooltip>

          {/* Divider pip */}
          <div className="h-3 w-px shrink-0 bg-black/10" />

          {/* Agent chips */}
          {agents.map((agent) => {
            const isJoining = context === "voice" && agent.status === "joining";
            const isLive    = context === "voice" && agent.status === "live";
            const isLeft    = context === "voice" && agent.status === "left";

            return (
              <Tooltip key={agent.id}>
                <TooltipTrigger asChild>
                  <div className={cn("relative shrink-0 group", isLeft && "opacity-50")}>
                    {/* Pulse ring — joining */}
                    {isJoining && (
                      <span
                        className="absolute inset-0 rounded-full animate-ping"
                        style={{ boxShadow: `0 0 0 2px ${agent.avatarColor}66` }}
                      />
                    )}
                    {/* Solid ring — live */}
                    {isLive && (
                      <span
                        className="absolute inset-[-2px] rounded-full"
                        style={{ boxShadow: `0 0 0 2px #208337` }}
                      />
                    )}

                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{ backgroundColor: agent.avatarColor }}
                    >
                      {agent.initials}
                    </div>

                    {/* Remove button — visible on hover when onRemove provided */}
                    {onRemove && (
                      <button
                        type="button"
                        aria-label={`Remove ${agent.name}`}
                        onClick={() => onRemove(agent.id)}
                        className="absolute -top-1 -right-1 hidden h-4 w-4 items-center justify-center rounded-full bg-[#344054] text-white group-hover:flex"
                      >
                        <svg viewBox="0 0 10 10" className="h-2 w-2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <line x1="2" y1="2" x2="8" y2="8" />
                          <line x1="8" y1="2" x2="2" y2="8" />
                        </svg>
                      </button>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-[11px]">
                  {agent.name}{" "}
                  <span className="text-[#98A2B3]">· {agent.role}</span>
                  {context === "voice" && agent.status === "joining" && (
                    <span className="ml-1 text-[#F59E0B]">Joining…</span>
                  )}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Participant count */}
        <span className="shrink-0 text-[10px] font-medium text-[#98A2B3]">
          {1 + agents.length} on call
        </span>
      </div>
    </TooltipProvider>
  );
}
