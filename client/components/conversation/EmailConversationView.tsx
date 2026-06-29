import { MoreHorizontal, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getCustomerRecord } from "@/lib/customer-database";
import { getEmailAddress, getEmailThreadContent, getReplyEmailSubject } from "@/lib/conversation-utils";
import { cn } from "@/lib/utils";
import type { SharedConversationData } from "@/lib/conversation-types";

export function EmailConversationView({
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
  const agentName = customerRecord?.overview.assignedAgent ?? "Jeff Common";
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
