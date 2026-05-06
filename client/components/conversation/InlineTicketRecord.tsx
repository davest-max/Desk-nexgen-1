import { ChevronDown, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTicketPriorityDotClassName, getTicketStatusBadgeClasses } from "@/lib/conversation-utils";
import type { CustomerTicket } from "@/lib/ticket-data";

export function InlineTicketRecord({
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
