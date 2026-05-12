import { useRef, useState } from "react";
import type { SharedConversationData } from "@/components/ConversationPanel";
import { buildTakeoverConversation } from "@/lib/customer-database";
import { pendingHandoffConversations } from "@/lib/queue-state";
import { staticAssignments } from "@/lib/static-assignments";
import { TakeoverPopover } from "./TakeoverPopover";

// TakeoverButton shows the TakeoverPopover. On confirm it builds the handoff-stamped
// initial conversation synchronously (before acceptIssue is called) so the correct
// messages are stored from the very first render — avoiding the navigate() race.

export function TakeoverButton({
  botType,
  customerName,
  customerRecordId,
  channel,
  onTakeover,
  className,
}: {
  botType: string;
  customerName: string;
  customerRecordId: string;
  channel: string;
  onTakeover: (handoffConversation: SharedConversationData) => void;
  className?: string;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [showPopover, setShowPopover] = useState(false);
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);

  const handleConfirm = (_reason: string, _alertBot: boolean) => {
    setShowPopover(false);
    const sa = staticAssignments.find((s) => s.customerRecordId === customerRecordId);
    const handoff = buildTakeoverConversation({
      customerRecordId,
      customerName,
      botType,
      channel: (channel === "sms" ? "sms" : "chat") as "chat" | "sms",
      aiWhyNeeded: sa?.aiOverview?.whyNeeded ?? null,
    });
    // Write to the module-level store BEFORE calling onTakeover.
    // Layout.tsx reads this in both acceptIssue (new assignment path) and
    // setConversationStateForAssignment (already-open path), so it is applied
    // regardless of React state batching or navigation timing.
    if (customerRecordId) pendingHandoffConversations.set(customerRecordId, handoff);
    onTakeover(handoff);
  };

  return (
    <>
      {showPopover && triggerRect && (
        <TakeoverPopover
          botType={botType}
          customerName={customerName}
          triggerRect={triggerRect}
          onClose={() => setShowPopover(false)}
          onConfirm={handleConfirm}
        />
      )}
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          const rect = buttonRef.current?.getBoundingClientRect();
          if (rect) {
            setTriggerRect(rect);
            setShowPopover(true);
          }
        }}
        className={
          className ??
          "rounded-md bg-[#166CCA] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#1260B0] transition-colors"
        }
      >
        Takeover
      </button>
    </>
  );
}
