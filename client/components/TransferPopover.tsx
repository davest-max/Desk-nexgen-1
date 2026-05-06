import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Agent,
  agentRoster,
  supervisorRoster,
  availabilityOrder,
  availabilityDot,
  scoreAgent,
  getSmartPopoverPosition,
} from "@/lib/agent-roster";

type TransferTab = "Agents" | "Supervisors";

export function TransferPopover({
  priority,
  preview,
  triggerRect,
  onClose,
  onAssign,
}: {
  priority: string;
  preview: string;
  triggerRect: DOMRect;
  onClose: () => void;
  onAssign: (agent: Agent) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [assigned, setAssigned] = useState<string | null>(null);
  const [tab, setTab] = useState<TransferTab>("Agents");

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const sortedAgents = [...agentRoster].sort((a, b) => {
    const avail = availabilityOrder[a.availability] - availabilityOrder[b.availability];
    if (avail !== 0) return avail;
    return scoreAgent(b, priority, preview) - scoreAgent(a, priority, preview);
  });
  const sortedSupervisors = [...supervisorRoster].sort(
    (a, b) => availabilityOrder[a.availability] - availabilityOrder[b.availability],
  );
  const roster = tab === "Agents" ? sortedAgents : sortedSupervisors;

  const handleAssign = (agent: Agent) => {
    setAssigned(agent.id);
    setTimeout(() => {
      onAssign(agent);
      onClose();
    }, 800);
  };

  const POPOVER_WIDTH = 300;
  const { left, top, maxHeight, transform } = getSmartPopoverPosition(triggerRect, POPOVER_WIDTH, 370);

  return createPortal(
    <div
      ref={ref}
      className="fixed z-[10001] rounded-xl border border-border bg-white shadow-[0_8px_24px_rgba(16,24,40,0.12)] overflow-hidden"
      style={{ left, top, width: POPOVER_WIDTH, transform }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <p className="text-[12px] font-semibold text-[#333333]">Transfer to</p>
        <button type="button" onClick={onClose} className="text-[#98A2B3] hover:text-[#475467] transition-colors">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex border-b border-border">
        {(["Agents", "Supervisors"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "relative flex-1 py-2.5 text-[12px] font-medium transition-colors",
              tab === t ? "text-[#166CCA]" : "text-[#667085] hover:text-[#344054]",
            )}
          >
            {t}
            {tab === t && <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full bg-[#166CCA]" />}
          </button>
        ))}
      </div>
      <div className="overflow-y-auto divide-y divide-border" style={{ maxHeight: Math.min(224, maxHeight - 120) }}>
        {roster.map((agent) => {
          const isAssigned = assigned === agent.id;
          const isDisabled = agent.availability === "Offline" || (assigned !== null && !isAssigned);
          return (
            <button
              key={agent.id}
              type="button"
              disabled={isDisabled}
              onClick={() => handleAssign(agent)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                isAssigned ? "bg-[#EBF4FD]" : "hover:bg-[#F9FAFB]",
                isDisabled && "opacity-40 cursor-not-allowed",
              )}
            >
              <div className="relative shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F2F4F7] text-[11px] font-bold text-[#475467]">
                  {agent.initials}
                </div>
                <span className={cn("absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white", availabilityDot[agent.availability])} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[12px] font-semibold text-[#1D2939] truncate">{agent.name}</p>
                  {isAssigned && <span className="text-[10px] font-semibold text-[#166CCA]">Transferred</span>}
                </div>
                <p className="text-[10px] text-[#98A2B3] truncate">{agent.skills.join(" · ")}</p>
              </div>
              <span className="shrink-0 text-[10px] text-[#667085]">{agent.activeCount} active</span>
            </button>
          );
        })}
      </div>
      <div className="px-4 py-2.5 border-t border-border bg-[#F9FAFB]">
        <p className="text-[10px] text-[#98A2B3]">Sorted by availability · best skill match</p>
      </div>
    </div>,
    document.body,
  );
}
