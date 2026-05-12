import { conversationChannelOptions } from "@/components/ConversationChannelToggleGroup";
import { getCustomerAssignmentEntry } from "@/lib/customer-assignment-tasks";
import type { CustomerChannel } from "@/lib/customer-database";
import { COPILOT_TASK_MATCHERS } from "./conversation-constants";
import type { AgentTask, ConversationMessage, InlineSuggestion, SharedConversationData } from "./conversation-types";
import type { CustomerTicket } from "./ticket-data";

export function formatConversationTimestamp(date: Date) {
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function getConversationChannelLabel(channel: CustomerChannel) {
  return conversationChannelOptions.find((option) => option.channel === channel)?.label ?? channel;
}

export function formatConversationMessageTimestamp(time: string) {
  return `Today, ${time.replace(/\s/g, "")}`;
}

export function isScrolledToBottom(viewport: HTMLDivElement) {
  return viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight <= 24;
}

export function matchCopilotInput(input: string): AgentTask | null {
  const lower = input.toLowerCase();
  for (const { keywords, task } of COPILOT_TASK_MATCHERS) {
    if (keywords.some((k) => lower.includes(k))) return task;
  }
  return null;
}

export function getSuggestedAgentTasks(conversation: SharedConversationData, latestCustomerMessage: ConversationMessage | null): AgentTask[] {
  // Always use per-customer entry if available
  const entryEarly = latestCustomerMessage ? null : getCustomerAssignmentEntry(conversation.customerName);
  if (entryEarly) return entryEarly.suggestedActions;

  // If no customer message yet, return universal fallback tasks
  if (!latestCustomerMessage) {
    return [
      { id: "update-case-record", label: "Update Case Record" },
      { id: "set-resolved", label: "Set Case to Resolved" },
    ];
  }

  // Prefer per-customer database entry for unique, context-specific suggested actions.
  const entry = getCustomerAssignmentEntry(conversation.customerName);
  if (entry) return entry.suggestedActions;

  // Fallback: keyword-based generic tasks.
  const allContent = conversation.messages.map((m) => m.content).join(" ").toLowerCase();
  const tasks: AgentTask[] = [];

  if (["ticket", "case", "error", "retry", "blocked", "declined", "failed", "issue", "problem"].some((k) => allContent.includes(k))) {
    tasks.push({ id: "create-ticket", label: "Create ADP Ticket" });
  }

  if (["account", "billing", "payment", "record", "status", "profile", "update", "crm", "salesforce"].some((k) => allContent.includes(k))) {
    tasks.push({ id: "update-salesforce", label: "Update Salesforce Record" });
  }

  if (["discount", "coupon", "compensation", "charged twice", "double charge", "trouble", "frustrated", "inconvenience", "sorry", "billing"].some((k) => allContent.includes(k))) {
    tasks.push({ id: "send-coupon", label: "Send Discount Coupon" });
  }

  if (["supervisor", "escalate", "manager", "speak to someone", "call me"].some((k) => allContent.includes(k))) {
    tasks.push({ id: "escalate", label: "Escalate to Supervisor" });
  }

  if (["callback", "call back", "schedule", "appointment", "call me"].some((k) => allContent.includes(k))) {
    tasks.push({ id: "callback", label: "Schedule Callback" });
  }

  const latestContent = latestCustomerMessage.content.toLowerCase();
  if (["thank you", "thanks", "that's great", "that was helpful", "resolved", "satisfied", "happy", "all set", "appreciate", "perfect", "wonderful", "great help", "problem solved", "sorted"].some((k) => latestContent.includes(k))) {
    tasks.push({ id: "set-resolved", label: "Set Case to Resolved" });
  }

  // Always ensure at least two tasks — universal fallbacks fill any gaps
  if (!tasks.some((t) => t.id === "update-case-record")) {
    tasks.push({ id: "update-case-record", label: "Update Case Record" });
  }
  if (!tasks.some((t) => t.id === "set-resolved")) {
    tasks.push({ id: "set-resolved", label: "Set Case to Resolved" });
  }

  return tasks;
}

export function getSuggestionVariant<T>(variants: T[], refreshKey: number) {
  return variants[((refreshKey % variants.length) + variants.length) % variants.length];
}

export function applySuggestionEdit(
  suggestion: InlineSuggestion,
  instruction: string,
  conversation: SharedConversationData,
): InlineSuggestion {
  const normalizedInstruction = instruction.trim().toLowerCase();
  const customerFirstName = conversation.customerName.split(" ")[0] ?? conversation.customerName;
  const updateClauses: string[] = [];
  const replyClauses: string[] = [];

  if (normalizedInstruction.includes("attachment") || normalizedInstruction.includes("file") || normalizedInstruction.includes("screenshot")) {
    updateClauses.push("mention that the customer can attach a file or screenshot in this thread");
    replyClauses.push("If it helps, please attach a screenshot or file here and I'll review it with you right away.");
  }

  if (normalizedInstruction.includes("ticket") || normalizedInstruction.includes("case")) {
    updateClauses.push("confirm that you will update the support ticket as part of the next step");
    replyClauses.push("I'll document this in the support ticket so the latest update is captured while we continue here.");
  }

  if (normalizedInstruction.includes("account number") || normalizedInstruction.includes("account #") || normalizedInstruction.includes("account")) {
    updateClauses.push(`ask ${customerFirstName} to confirm the account number needed for verification`);
    replyClauses.push("Please share the account number tied to this request so I can verify the record before the next step.");
  }

  if (normalizedInstruction.includes("billing") || normalizedInstruction.includes("payment")) {
    updateClauses.push("include a billing verification step before the customer retries");
    replyClauses.push("I'm also going to verify the billing details tied to the latest attempt before we move forward.");
  }

  if (updateClauses.length === 0) {
    updateClauses.push(`incorporate this agent request: ${instruction.trim()}`);
    replyClauses.push(`I'm also taking this additional step into account: ${instruction.trim()}.`);
  }

  return {
    summary: `${suggestion.summary} Update it to ${updateClauses.join(", ")}.`,
    suggestedReply: `${suggestion.suggestedReply} ${replyClauses.join(" ")}`.trim(),
  };
}

export function getInlineSuggestionVariants(
  conversation: SharedConversationData,
  customerMessage: ConversationMessage,
): InlineSuggestion[] {
  const normalizedMessage = customerMessage.content.toLowerCase();
  const customerFirstName = conversation.customerName.split(" ")[0] ?? conversation.customerName;

  // ── Sofia fraud / transfer handoff scenario ───────────────────────────────
  if (
    normalizedMessage.includes("fraud") ||
    normalizedMessage.includes("unauthorized") ||
    normalizedMessage.includes("scared") ||
    normalizedMessage.includes("rent") ||
    normalizedMessage.includes("temporary credit") ||
    normalizedMessage.includes("fraudulent") ||
    normalizedMessage.includes("robbed") ||
    normalizedMessage.includes("outrageous") ||
    (normalizedMessage.includes("sorry") && normalizedMessage.includes("upset"))
  ) {
    return [
      {
        summary: `Lead with presence — let ${customerFirstName} know you've been here the whole time and she's safe.`,
        suggestedReply: `Hi ${customerFirstName}, this is Jeff. I've been with you through this entire conversation. You have absolutely nothing to apologize for — your account is safe. We've got you.`,
      },
      {
        summary: `Validate her anger, confirm you saw everything, and make her feel protected.`,
        suggestedReply: `${customerFirstName}, I'm Jeff. I've been following every step of this conversation and I want you to know — your anger is completely justified. Your account is secured, those charges are flagged, and I'm personally making sure this gets resolved.`,
      },
      {
        summary: `Reassure ${customerFirstName} that she's not alone and that everything is already being handled.`,
        suggestedReply: `Hi ${customerFirstName}, my name is Jeff. I've been right here watching this unfold and I want to be clear: none of this is your fault. Your money is protected, the charges are frozen, and I'm not going anywhere until you feel completely taken care of.`,
      },
      {
        summary: `Open with empathy and immediately address the rent concern — her most urgent worry.`,
        suggestedReply: `${customerFirstName}, this is Jeff — I've been with you since Jacob first flagged the issue. I know rent is due tomorrow and I want to put your mind at ease: the $2,159 credit is already on your account. Your rent payment will go through. You're safe.`,
      },
      {
        summary: `Introduce yourself warmly and make it personal — 11 years of loyalty matters.`,
        suggestedReply: `Hi ${customerFirstName}, I'm Jeff. After 11 years as a customer, you deserve better than this, and I'm sorry it happened. I've been monitoring this conversation from the start and I'm stepping in personally to make sure everything is made right.`,
      },
      {
        summary: `Keep it short and human — let ${customerFirstName} know she's heard and protected.`,
        suggestedReply: `${customerFirstName}, this is Jeff. I've been here the whole time. What happened to your account is serious and we're treating it that way. You're protected and I'm here for whatever you need.`,
      },
      {
        summary: `Acknowledge the handoff, confirm no details are lost, and give ${customerFirstName} confidence.`,
        suggestedReply: `Hi ${customerFirstName}, I'm Jeff — I've been following your conversation with Jacob and you won't need to repeat a single thing. The fraudulent charges are frozen, your account is protected, and I'm personally overseeing the rest of this. We've got you.`,
      },
      {
        summary: `Lead with action — confirm what's already done and what happens next.`,
        suggestedReply: `${customerFirstName}, my name is Jeff and I've been with you since the beginning of this conversation. Here's where we stand: both fraudulent charges are flagged, a $2,159 provisional credit is on your account, and a replacement card is being issued. You're in good hands.`,
      },
      {
        summary: `Close with warmth and a direct line of support.`,
        suggestedReply: `Hi ${customerFirstName}, this is Jeff. I want you to know I've seen everything in this conversation and I'm taking personal responsibility for your case. Your account is safe, your money is protected, and I'll be your direct contact from here on out.`,
      },
    ];
  }

  if (normalizedMessage.includes("same error") || normalizedMessage.includes("tried again") || normalizedMessage.includes("retry") || normalizedMessage.includes("retried") || normalizedMessage.includes("still")) {
    return [
      {
        summary:
          "Recommend confirming the latest account status, then offer a manual refresh so the customer can retry without leaving the conversation.",
        suggestedReply:
          "I've confirmed the latest account status on my side. I'm running a manual refresh now so you can retry without leaving this conversation.",
      },
      {
        summary:
          "Acknowledge that the retry failed again, confirm you are checking the latest status, and keep the customer in the same thread while you reset the flow.",
        suggestedReply:
          "Thanks for trying that again. I'm checking the latest status now, and I'll reset the flow from my side so you can retry here without starting over.",
      },
      {
        summary:
          "Show ownership of the repeated failure, explain you are refreshing the account state, and give the customer one immediate next step.",
        suggestedReply:
          "I can see the same error is still blocking the attempt. I'm refreshing the account state now, and I'll let you know as soon as it's ready for one more retry.",
      },
      {
        summary:
          "Validate the customer's frustration, confirm you are escalating the check internally, and set a short response time expectation.",
        suggestedReply:
          "I understand this has happened more than once and that's frustrating. I'm escalating the check on my end now and I'll have an update for you within just a few minutes.",
      },
      {
        summary:
          "Confirm you can see the repeated error pattern, explain you are reviewing the underlying cause, and reassure the customer you will not ask them to retry blindly.",
        suggestedReply:
          "I can see the repeated error pattern on the account. I'm reviewing the underlying cause now, and I won't ask you to retry until I know exactly what needs to change.",
      },
      {
        summary:
          "Acknowledge the persistence of the issue, explain that you are clearing any cached state on the account, and ask the customer to stand by.",
        suggestedReply:
          "I hear you — the same issue keeps coming back. I'm clearing any cached state on the account right now. Please stand by and I'll confirm when it's ready for another attempt.",
      },
      {
        summary:
          "Take direct ownership, confirm the specific step where the error occurs, and commit to staying on the issue until it is resolved.",
        suggestedReply:
          "I'm taking direct ownership of this. I've identified the step where the error is occurring and I'm working on it now. I'll stay with you until this is resolved.",
      },
      {
        summary:
          "Show empathy for the repeated attempts, confirm you are pulling the full error log, and give the customer a clear next action.",
        suggestedReply:
          "I appreciate your patience through multiple attempts. I'm pulling the full error log now so I can find the root cause and give you one clear next step.",
      },
      {
        summary:
          "Reassure the customer that no action is needed on their end right now, confirm you are running a backend reset, and give a short time estimate.",
        suggestedReply:
          "No action needed on your end right now. I'm running a backend reset on the account, and it should be ready for a clean retry within the next two to three minutes.",
      },
    ];
  }

  if (normalizedMessage.includes("charged twice") || normalizedMessage.includes("double charge")) {
    return [
      {
        summary: "Reassure the customer they will not be charged twice, then guide them through a safe retry.",
        suggestedReply:
          "You will not be charged twice for the same upgrade attempt. I'll verify the previous authorization, then I'll let you know the safest time to retry.",
      },
      {
        summary: "Reduce anxiety about duplicate billing, confirm you are reviewing the payment authorization, and set up the next action clearly.",
        suggestedReply:
          "I understand the concern. I'm reviewing the previous authorization now to make sure there isn't a duplicate charge, and then I'll guide you through the next safe step.",
      },
      {
        summary: "Confirm you are checking the billing history, reassure them the original attempt is being reviewed, and avoid asking them to retry too early.",
        suggestedReply:
          "I'm checking the billing history on my side first so we do not risk a duplicate charge. Once I confirm the original attempt status, I'll tell you whether it's safe to retry.",
      },
      {
        summary: "Immediately address the duplicate charge concern, confirm you are placing a hold on further retries until billing is verified.",
        suggestedReply:
          "I want to address the possible duplicate charge first. I'm placing a hold on any further retries until I've verified both authorization records. I'll update you here shortly.",
      },
      {
        summary: "Confirm you can see both charge attempts, explain you are reviewing which one settled, and reassure the customer any duplicate will be reversed.",
        suggestedReply:
          "I can see both attempts on the account. I'm reviewing which one settled so we can confirm there's no duplicate. If there is, I'll make sure it gets reversed.",
      },
      {
        summary: "Set clear expectations about the billing review process, reassure the customer no further charges will occur, and give a time estimate.",
        suggestedReply:
          "No further charges will occur while I review this. I'll have a clear answer on the billing status within a few minutes and I'll update you here.",
      },
      {
        summary: "Acknowledge the customer's concern directly, confirm the specific charge amounts you are reviewing, and explain the next step.",
        suggestedReply:
          "I completely understand why that's concerning. I'm reviewing the charge amounts from both attempts now and I'll confirm which one processed and whether anything needs to be reversed.",
      },
      {
        summary: "Apologize for the confusion, confirm you are escalating to the billing team if needed, and keep the customer informed.",
        suggestedReply:
          "I apologize for the confusion around the charges. I'm reviewing this now and if I need to escalate to the billing team I'll loop them in immediately and keep you updated here.",
      },
      {
        summary: "Validate the concern, confirm the account is safe from further charges, and commit to a resolution within the current conversation.",
        suggestedReply:
          "Your account is protected from any further charges while I sort this out. I'm committed to resolving the billing question before we close this conversation.",
      },
    ];
  }

  if (normalizedMessage.includes("billing") || normalizedMessage.includes("zip") || normalizedMessage.includes("match")) {
    return [
      {
        summary: "Confirm the billing details on file, then guide the customer to the field most likely causing the mismatch.",
        suggestedReply:
          "I can see a billing detail mismatch on the latest attempt. Please confirm the billing zip code on the card, and I'll stay with you while you try it again.",
      },
      {
        summary: "Point the customer to the billing field most likely causing the failure and keep the instruction focused on one correction at a time.",
        suggestedReply:
          "The latest attempt looks like it failed on a billing detail check. Please verify the billing zip code exactly as it appears with your card issuer, and I'll stay with you for the retry.",
      },
      {
        summary: "Keep the response specific, ask for the most important billing confirmation, and reduce the chance of another mismatch.",
        suggestedReply:
          "Before we try again, please confirm the billing zip code tied to the card. That is the field most likely causing the mismatch I'm seeing on the payment check.",
      },
      {
        summary: "Explain what a billing mismatch means in plain terms, then ask the customer to double-check the address on file with their bank.",
        suggestedReply:
          "A billing mismatch usually means the address or zip code entered doesn't match what your bank has on file. Can you double-check the billing address registered with your card issuer?",
      },
      {
        summary: "Confirm you are updating the billing details from your side where possible, and ask the customer to confirm the card's registered details.",
        suggestedReply:
          "I'm reviewing what we have on file and I want to make sure the details match your card exactly. Can you confirm the billing address and zip code as your card issuer has it?",
      },
      {
        summary: "Reduce friction by narrowing down whether the issue is the name, address, or zip code, and focus the customer on one field at a time.",
        suggestedReply:
          "Let's narrow this down together. Can you first confirm whether the cardholder name on the card matches what you entered? That's sometimes the source of the mismatch.",
      },
      {
        summary: "Reassure the customer that billing mismatches are common and fixable, then walk them through the two most likely fields to correct.",
        suggestedReply:
          "Billing mismatches are common and easy to fix. The two fields that usually cause this are the billing zip code and the cardholder name — can you confirm both match your card exactly?",
      },
      {
        summary: "Ask the customer to try a different card if the billing details cannot be verified, and keep the conversation moving.",
        suggestedReply:
          "If you're not able to confirm the billing details on that card, it may be quicker to try a different payment method. I can stay with you through either option.",
      },
      {
        summary: "Confirm you are temporarily updating the billing record to attempt a clean match, and ask the customer to stand by.",
        suggestedReply:
          "I'm making a note on the billing record to flag the mismatch for review. In the meantime, please double-check the zip code and try the payment again — I'll stay here with you.",
      },
    ];
  }

  if (normalizedMessage.includes("today") || normalizedMessage.includes("urgent") || normalizedMessage.includes("meeting")) {
    return [
      {
        summary: "Acknowledge the urgency, confirm the next action, and keep the customer in the conversation while you resolve it.",
        suggestedReply:
          "I understand this is time-sensitive. I'm checking the blocking step now, and I'll keep you updated here so you can complete the upgrade as quickly as possible.",
      },
      {
        summary: "Lead with urgency, explain that you are actively checking the blocker, and reassure the customer they will not need to repeat everything.",
        suggestedReply:
          "I know this is urgent. I'm reviewing the blocking step right now, and I'll stay with you here so we can move this forward without making you repeat the process.",
      },
      {
        summary: "Recognize the deadline, confirm immediate ownership, and give the customer confidence that the next update is coming soon.",
        suggestedReply:
          "Thanks for flagging the urgency. I'm on the blocking issue now, and I'll update you here with the next step as soon as I confirm what's holding it up.",
      },
      {
        summary: "Prioritize the time constraint, confirm you are expediting the review, and give a realistic time estimate.",
        suggestedReply:
          "I'm treating this as a priority given the time constraint. I'm expediting the review on my end and expect to have a resolution or a clear next step for you within the next few minutes.",
      },
      {
        summary: "Acknowledge the deadline, skip unnecessary back-and-forth, and commit to the fastest possible path to resolution.",
        suggestedReply:
          "Given your deadline I want to skip any unnecessary steps. I'm going straight to the fastest resolution path on my end and I'll have an update for you momentarily.",
      },
      {
        summary: "Validate the urgency and confirm that you are escalating internally to meet the customer's timeline.",
        suggestedReply:
          "I hear you — this needs to be done today. I'm escalating internally right now to make sure we can meet your timeline. I'll have a direct update for you shortly.",
      },
      {
        summary: "Show empathy for the deadline pressure, confirm the one step blocking resolution, and commit to completing it immediately.",
        suggestedReply:
          "I understand the pressure you're under. There's one blocking step I need to clear on my side, and I'm working on it right now. I'll be back with you in just a moment.",
      },
      {
        summary: "Confirm you are removing any queued delays on the account and give the customer a clear window to complete their task.",
        suggestedReply:
          "I'm removing any queued delays on the account so you have a clean window to complete this today. I'll confirm as soon as it's ready and walk you through the final step.",
      },
      {
        summary: "Offer to stay on the conversation actively until the deadline is met, so the customer knows they have continuous support.",
        suggestedReply:
          "I'm going to stay active on this conversation until we get this resolved for you today. Tell me where things are right now and I'll take it from there.",
      },
    ];
  }

  if (normalizedMessage.includes("worked") || normalizedMessage.includes("thank you")) {
    return [
      {
        summary: "Confirm the issue is resolved and tell the customer what to watch for next.",
        suggestedReply:
          "Glad that worked. Your upgrade should now continue normally, and I'll stay available here in case anything else comes up.",
      },
      {
        summary: "Close the loop clearly, confirm the path forward is back on track, and keep the tone supportive.",
        suggestedReply:
          "Great, that means the issue is resolved and the upgrade flow should continue normally from here. I'll stay available in case anything unexpected comes up.",
      },
      {
        summary: "Acknowledge the positive update and let the customer know what should happen next so the thread can wind down cleanly.",
        suggestedReply:
          "Happy to hear that worked. Everything should move forward normally now, but I'll remain here if you need help with the next step.",
      },
      {
        summary: "Confirm resolution and set expectations about what a successful completion looks like, so the customer knows what to expect.",
        suggestedReply:
          "That's great news. You should see the change reflected on your account within a few minutes. Feel free to reach back out if anything looks off.",
      },
      {
        summary: "Acknowledge the customer's thanks, confirm the case is resolved, and offer a warm close.",
        suggestedReply:
          "You're welcome — I'm glad we got that sorted out. Is there anything else I can help you with before I close the case?",
      },
      {
        summary: "Confirm success, summarize what was done, and let the customer know how to follow up if needed.",
        suggestedReply:
          "Perfect. I've noted the resolution on your account. If the same issue comes up again or anything else needs attention, don't hesitate to reach back out.",
      },
      {
        summary: "Celebrate the success briefly, confirm there are no further actions needed on the customer's end, and offer to close the conversation.",
        suggestedReply:
          "Excellent — no further action needed on your end. I'll go ahead and mark this as resolved unless you have anything else you'd like to cover.",
      },
      {
        summary: "Respond warmly to the thanks, confirm the issue is fully closed, and invite the customer to return if needed.",
        suggestedReply:
          "My pleasure — that's exactly what I'm here for. The issue is fully resolved on my end. Feel free to come back anytime if you need further assistance.",
      },
      {
        summary: "Confirm the fix, note any follow-up steps the customer should be aware of, and end on a positive note.",
        suggestedReply:
          "Glad that's working now. Just keep an eye out for a confirmation email in the next few minutes. It was great helping you today.",
      },
    ];
  }

  return [
    {
      summary: `Recommend acknowledging ${conversation.customerName.split(" ")[0]}'s latest update and giving them one clear next step.`,
      suggestedReply: "Thanks for the update. I'm checking the latest attempt now and I'll give you the next step in just a moment.",
    },
    {
      summary: `Recommend confirming ${conversation.customerName.split(" ")[0]}'s latest update, then setting expectations for the next follow-up in this thread.`,
      suggestedReply: "Thanks for the update. I'm reviewing the latest activity now, and I'll follow up here with the clearest next step in just a moment.",
    },
    {
      summary: `Recommend acknowledging ${conversation.customerName.split(" ")[0]}'s message and giving them one immediate action while you continue checking the issue.`,
      suggestedReply: "I appreciate the update. I'm checking the latest attempt now and I'll reply here with the best next step shortly.",
    },
    {
      summary: `Confirm you have received ${conversation.customerName.split(" ")[0]}'s message and let them know you are actively reviewing the details before responding.`,
      suggestedReply: "Got it, thank you. I'm reviewing the details on my end right now and I'll come back to you with the clearest path forward shortly.",
    },
    {
      summary: `Show ${conversation.customerName.split(" ")[0]} that you are actively engaged, confirm you are checking the account, and set a short response window.`,
      suggestedReply: "I'm on it. Let me pull up the account details and I'll have a more specific update for you in just a moment.",
    },
    {
      summary: `Acknowledge ${conversation.customerName.split(" ")[0]}'s message promptly, confirm ownership of the next step, and avoid asking for information you may already have.`,
      suggestedReply: "Thanks for letting me know. I'm checking what I need on my end and will follow up here as soon as I have something concrete for you.",
    },
    {
      summary: `Keep ${conversation.customerName.split(" ")[0]} informed without over-promising, confirm you are checking the relevant details, and invite them to ask if they have other questions.`,
      suggestedReply: "I hear you. I'm reviewing everything related to this and I'll be back with a clear next step shortly. Let me know if there's anything else you'd like me to look at in the meantime.",
    },
    {
      summary: `Acknowledge the message, confirm you are taking the right action on the account, and reassure ${conversation.customerName.split(" ")[0]} they are in good hands.`,
      suggestedReply: "Thanks for the message. I'm taking a look at the account right now and I'll make sure we get this sorted out for you as quickly as possible.",
    },
    {
      summary: `Use a reassuring tone, confirm you understand the situation, and let ${conversation.customerName.split(" ")[0]} know the next update is imminent.`,
      suggestedReply: "I completely understand. I'm working through the details now and you'll have an update from me very shortly — I want to make sure I give you the right answer.",
    },
  ];
}

export function getInlineSuggestion(
  conversation: SharedConversationData,
  customerMessage: ConversationMessage,
  refreshKey = 0,
) {
  return getSuggestionVariant(getInlineSuggestionVariants(conversation, customerMessage), refreshKey);
}

export function getSummarySnippet(content: string | undefined, maxLength = 170) {
  const normalizedContent = content?.replace(/\s+/g, " ").trim();

  if (!normalizedContent) {
    return null;
  }

  return normalizedContent.length > maxLength
    ? `${normalizedContent.slice(0, maxLength - 3)}...`
    : normalizedContent;
}

export function getRemainingSupportNeed(issueSummary: string | null, latestCustomerMessage: ConversationMessage | undefined) {
  const normalizedReply = latestCustomerMessage?.content.toLowerCase() ?? "";
  const normalizedIssue = issueSummary?.toLowerCase() ?? "";
  const evaluationText = `${normalizedReply} ${normalizedIssue}`.trim();

  if (normalizedReply.includes("where should i update") || normalizedReply.includes("old zip") || normalizedReply.includes("recently moved")) {
    return "Show the customer exactly where to update the billing details, point to the field that is wrong, and ask them to wait to retry until that profile update is complete.";
  }

  if (normalizedReply.includes("duplicate charge") || normalizedReply.includes("charged twice") || normalizedReply.includes("double charge")) {
    return "Check whether any duplicate authorization exists, explain the billing risk clearly, and then tell the customer if it is safe to retry.";
  }

  if (normalizedReply.includes("payment link") || normalizedReply.includes("secure link") || normalizedReply.includes("send it over") || normalizedReply.includes("inbox")) {
    return "Send the promised follow-up now, confirm where it was delivered, and tell the customer the exact step to take once it arrives.";
  }

  if (normalizedReply.includes("full page") || normalizedReply.includes("payment section") || normalizedReply.includes("screenshot") || normalizedReply.includes("photo")) {
    return "Specify exactly what screenshot or evidence the customer should send, confirm how to send it, and review it before asking for another retry.";
  }

  if (normalizedReply.includes("should i retry") || normalizedReply.includes("retry it now") || normalizedReply.includes("what should i do next")) {
    return "Answer the customer's question directly with one clear next action and make it explicit whether they should retry now or wait for another fix first.";
  }

  if (normalizedReply.includes("worked") || normalizedReply.includes("thank you")) {
    return "Confirm the issue is resolved, tell the customer what to watch for next, and close the loop cleanly unless another problem appears.";
  }

  if (evaluationText.includes("same error") || evaluationText.includes("still") || evaluationText.includes("retry") || evaluationText.includes("declined") || evaluationText.includes("blocked")) {
    return "Explain what is still blocking the latest attempt, describe what changed since the failed retry, and give the customer one new action instead of repeating the previous step.";
  }

  if (evaluationText.includes("billing") || evaluationText.includes("zip") || evaluationText.includes("card") || evaluationText.includes("payment")) {
    return "Verify the billing details on file, call out the exact field that needs attention, and confirm when the customer should try again.";
  }

  if (evaluationText.includes("urgent") || evaluationText.includes("today") || evaluationText.includes("meeting") || evaluationText.includes("deadline")) {
    return "Take immediate ownership of the blocker and reply with a time-sensitive resolution path the customer can act on right away.";
  }

  return "Respond directly to the customer's latest reply and turn it into one specific next action they can take now.";
}

export function getDetectedIntent(messages: SharedConversationData["messages"]): string {
  const text = messages
    .filter((m) => m.role === "customer")
    .map((m) => m.content.toLowerCase())
    .join(" ");

  if (text.match(/\b(subscription|plan|upgrade|downgrade|tier)\b/) && text.match(/\b(payment|billing|charge|fail|decline)\b/)) {
    return "Subscription Upgrade / Payment Failure";
  }
  if (text.match(/\b(cancel|cancellation|unsubscribe)\b/)) {
    return "Cancellation Request";
  }
  if (text.match(/\b(subscription|plan|upgrade|downgrade|tier)\b/)) {
    return "Subscription Upgrade / Change";
  }
  if (text.match(/\b(payment|billing|charge|invoice|refund|overpaid|overcharg)\b/)) {
    return "Billing / Payment Issue";
  }
  if (text.match(/\b(delivery|shipping|package|parcel|reroute|transit|exception)\b/)) {
    return "Delivery / Shipping Issue";
  }
  if (text.match(/\b(broken|error|bug|crash|not work|issue|problem|fail)\b/)) {
    return "Technical Issue";
  }
  return "General Inquiry";
}

export function getChurnRisk(messages: SharedConversationData["messages"]): { label: string; level: "low" | "medium" | "high" } {
  const hasFrustration = messages.some((m) => m.sentiment === "frustrated" || m.sentiment === "critical");
  const text = messages.map((m) => m.content.toLowerCase()).join(" ");
  const highRiskWords = /\b(cancel|leave|competitor|refund|lawsuit|terrible|unacceptable|never again)\b/;

  if (hasFrustration && highRiskWords.test(text)) return { label: "High", level: "high" };
  if (hasFrustration) return { label: "Medium", level: "medium" };
  return { label: "Low", level: "low" };
}

export function getConversationOverview(conversation: SharedConversationData) {
  const customerFirstName = conversation.customerName.split(" ")[0] ?? conversation.customerName;
  const latestCustomerMessage = [...conversation.messages].reverse().find((message) => message.role === "customer");
  const latestAgentMessage = [...conversation.messages].reverse().find((message) => message.role === "agent");
  const issueSummary = getSummarySnippet(latestCustomerMessage?.content);
  const priorHelpSummary = getSummarySnippet(latestAgentMessage?.content, 150);
  const assignmentReason = (latestCustomerMessage?.sentiment === "frustrated" || latestCustomerMessage?.sentiment === "critical")
    ? `${customerFirstName} was routed to this agent because the issue is still unresolved and the customer is showing frustration in the current ${conversation.label.toLowerCase()} thread.`
    : `${customerFirstName} was routed to this agent because the current ${conversation.label.toLowerCase()} thread still needs active ownership to move the issue forward.`;
  const customerIssue = issueSummary
    ? `${customerFirstName} is dealing with this issue: ${issueSummary}`
    : `${customerFirstName}'s current issue has not been fully captured in the thread yet.`;
  const priorHelp = priorHelpSummary
    ? `The previous agent or AI already tried to help by saying or doing this: ${priorHelpSummary}`
    : "The previous agent or AI has not yet documented a meaningful action that would unblock the issue.";
  const remainingNeed = getRemainingSupportNeed(issueSummary, latestCustomerMessage);

  const detectedIntent = getDetectedIntent(conversation.messages);
  const churnRisk = getChurnRisk(conversation.messages);
  const sentiment = latestCustomerMessage?.sentiment ?? null;

  return {
    assignmentReason,
    customerIssue,
    priorHelp,
    remainingNeed,
    detectedIntent,
    churnRisk,
    sentiment,
  };
}

export function getEmailAddress(name: string) {
  const localPart = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");

  return `${localPart || "support"}@nice.com`;
}

export function getEmailThreadContent(content: string) {
  const [firstLine = "", ...remainingLines] = content.split("\n");
  const hasSubjectLine = firstLine.toLowerCase().startsWith("subject:");
  const subject = hasSubjectLine ? firstLine.slice("subject:".length).trim() : "";
  const body = (hasSubjectLine ? remainingLines : [firstLine, ...remainingLines]).join("\n").trim();

  return { subject, body };
}

export function getReplyEmailSubject(conversation: SharedConversationData) {
  const firstCustomerEmail = conversation.messages.find((message) => message.role === "customer");
  const parsedEmail = firstCustomerEmail ? getEmailThreadContent(firstCustomerEmail.content) : null;
  const baseSubject = parsedEmail?.subject || `${conversation.customerName} follow-up`;

  return /^re:/i.test(baseSubject) ? baseSubject : `Re: ${baseSubject}`;
}

export function getTicketPriorityDotClassName(priority: CustomerTicket["priority"]) {
  switch (priority) {
    case "Low":
      return "bg-[#208337]";
    case "Medium":
      return "bg-[#166CCA]";
    case "High":
      return "bg-[#FFB800]";
    default:
      return "bg-[#E32926]";
  }
}

export function getTicketStatusBadgeClasses(status: CustomerTicket["status"]) {
  switch (status) {
    case "Open":
      return "border-[#24943E] bg-[#EFFBF1] text-[#208337]";
    case "In Progress":
      return "border-[#A37A00] bg-[#FFF6E0] text-[#A37A00]";
    case "Pending Customer":
    case "On-Hold":
    case "Training Rescheduled":
      return "border-[#A37A00] bg-[#FFF6E0] text-[#A37A00]";
    case "Escalated":
    case "Needing Attention":
      return "border-[#E53935] bg-[#FDEAEA] text-[#C71D1A]";
    default:
      return "border-black/10 bg-white text-[#475467]";
  }
}
