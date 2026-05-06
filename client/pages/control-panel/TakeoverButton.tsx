import { useRef, useState } from "react";
import type { SharedConversationData } from "@/components/ConversationPanel";
import { createConversationState } from "@/lib/customer-database";
import { pendingHandoffConversations } from "@/lib/queue-state";
import { CURRENT_AGENT_NAME } from "@/lib/control-panel-data";
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

  const buildHandoffConversation = (): SharedConversationData => {
    const convChannel = (channel === "sms" ? "sms" : "chat") as "chat" | "sms";
    const seed = customerRecordId
      ? createConversationState(customerRecordId, convChannel)
      : {
          customerName,
          label: botType,
          timelineLabel: "",
          status: "open" as const,
          draft: "",
          messages: [],
        };
    const time = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    const firstName = customerName.split(" ")[0];
    const baseId = Date.now();
    return {
      ...seed,
      messages: [
        // Stamp every prior agent message with the bot's name so it renders as the bot, not JC
        ...seed.messages.map((msg) =>
          msg.role === "agent" && !msg.author ? { ...msg, author: botType } : msg
        ),
        // Customer-facing transfer notice authored by the bot
        {
          id: baseId,
          role: "agent" as const,
          author: botType,
          content: `${firstName}, I'm transferring you now to ${CURRENT_AGENT_NAME}, a human specialist who will take it from here.`,
          time,
        },
        // Internal-only handoff card — visible to the agent, not the customer
        {
          id: baseId + 1,
          role: "agent" as const,
          author: botType,
          content: `I have transferred the assignment. You are now live with customer ${customerName}.`,
          time,
          isInternal: true,
          isHandoffCard: true,
        },
      ],
    };
  };

  const handleConfirm = (_reason: string, _alertBot: boolean) => {
    setShowPopover(false);
    const handoff = buildHandoffConversation();
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
