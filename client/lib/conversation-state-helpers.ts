// Conversation state and overview helpers
import type { SharedConversationData } from "@/components/ConversationPanel";
import type { CustomerChannel } from "@/lib/customer-database";
import { createConversationState, customerDatabase } from "@/lib/customer-database";
import { getCustomerAssignmentEntry } from "./customer-assignment-tasks";
import { initialSelectedAssignment, initialVisibleAssignments } from "./queue-helpers";

// ─── Default Conversation State ────────────────────────────────────────

export const defaultConversationState: SharedConversationData = createConversationState(
  initialSelectedAssignment.customerRecordId,
  initialSelectedAssignment.channel,
);

// ─── Conversation State Creation ───────────────────────────────────────

export function createCustomConversationState(
  name: string,
  channel: CustomerChannel,
  preview: string,
): SharedConversationData {
  const base = createConversationState(initialSelectedAssignment.customerRecordId, channel);
  const timestamp = new Date();
  return {
    ...base,
    customerName: name,
    timelineLabel: `${base.label} · Accepted from queue`,
    messages: [
      {
        id: 1,
        role: "customer" as const,
        content: preview,
        time: timestamp.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
        isInternal: false,
      },
    ],
    draft: "",
    status: "open",
    isCustomerTyping: false,
  };
}

// ─── Task AI Overview Data ────────────────────────────────────────────

export const taskAiOverviewByCustomerId: Record<string, { actions: string[]; whyNeeded: string }> = {
  noah: {
    actions: [
      "Reviewed the full SMS thread and extracted the core data-export failure from Noah's messages.",
      "Cross-referenced Noah's account permissions and recent failed export job logs.",
      "Confirmed the issue is tied to a quarterly report generation timeout — not a permissions error.",
      "Prepared a step-by-step remediation draft and flagged the relevant knowledge base article.",
    ],
    whyNeeded: "The export failure requires a manual queue reset that the AI cannot trigger autonomously. A human agent is needed to confirm the correct reporting period, initiate the fix, and validate the output before sending it to Noah.",
  },
  olivia: {
    actions: [
      "Reviewed the full chat thread and identified a billing discrepancy tied to a mid-cycle plan upgrade.",
      "Checked Olivia's subscription history and confirmed the pro-rated charge was applied incorrectly.",
      "Assessed tone — Olivia is frustrated after two prior contacts on the same issue.",
      "Drafted an apology response and prepared a credit memo for agent review.",
    ],
    whyNeeded: "Olivia has contacted support twice for the same billing issue without resolution. She is showing clear frustration signals. A human agent is needed to acknowledge the repeated failure, issue the correct credit, and personally confirm the account is now accurate.",
  },
  ethan: {
    actions: [
      "Reviewed the SMS thread and identified a wire transfer flagged incorrectly by the fraud filter.",
      "Cross-referenced Ethan's transaction history and confirmed the transfer destination is a known payee.",
      "Checked compliance flags and found no active holds — the block appears to be a false positive.",
      "Prepared a suggested resolution path and escalation note for the payments team.",
    ],
    whyNeeded: "Releasing a flagged wire transfer requires agent-level authorisation that cannot be granted autonomously. A human agent must verify Ethan's identity, confirm the payee details, and manually clear the hold in the payments system.",
  },
};

export function getTaskAiOverview(customerRecordId: string, name: string, channel: string) {
  if (taskAiOverviewByCustomerId[customerRecordId]) return taskAiOverviewByCustomerId[customerRecordId];
  const firstName = name.split(" ")[0] ?? name;
  return {
    actions: [
      `Reviewed the full ${channel} thread and extracted the core issue from ${firstName}'s messages.`,
      "Checked account history and cross-referenced any recent interactions flagged on the account.",
      "Assessed conversation tone and confirmed standard escalation path was appropriate.",
      "Prepared a suggested response draft and identified relevant knowledge base articles.",
    ],
    whyNeeded: `The issue ${firstName} raised requires judgment and account-level context that the AI cannot act on autonomously. A human agent is needed to review the details, confirm the right course of action, and deliver a personalised resolution that closes the loop.`,
  };
}

// ─── Customer Issue Messages ───────────────────────────────────────────

export const lastCustomerMessageByKey: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const customer of customerDatabase) {
    for (const [channel, convo] of Object.entries(customer.conversations)) {
      const messages = (convo as { messages: Array<{ role: string; content: string }> }).messages;
      const last = [...messages].reverse().find((m) => m.role === "customer");
      if (last) map[`${customer.id}::${channel}`] = last.content;
    }
  }
  return map;
})();

export function getIncomingCustomerIssue(customerRecordId: string, name: string, channel: string): string {
  const firstName = name.split(" ")[0] ?? name;
  const msg = lastCustomerMessageByKey[`${customerRecordId}::${channel}`];
  if (!msg) return `${firstName}'s current issue has not been fully captured in the thread yet.`;
  const snippet = msg.length > 160 ? `${msg.slice(0, 157)}…` : msg;
  return `${firstName} is reporting: "${snippet}"`;
}

// ─── Overview Actions by Customer ──────────────────────────────────────

export const overviewActionsByCustomerName: Record<string, string[]> = {
  "maria chen": [
    "Reviewed the full chat thread and identified a recurring payment failure tied to an expired card token.",
    "Cross-referenced Maria's billing profile and confirmed the card on file expired two billing cycles ago.",
    "Checked if the failure triggered any automated retry logic — no retries were attempted due to hard decline.",
    "Prepared a card-update prompt and drafted a payment link for agent delivery.",
  ],
  "james whitfield": [
    "Reviewed James's enterprise contract and identified a tier pricing change applied at last renewal.",
    "Cross-referenced the original quote with the invoiced amount — a $4,200 discrepancy was found.",
    "Checked account notes and confirmed a verbal pricing commitment was made by the previous account manager.",
    "Flagged the case for revenue operations review and prepared a dispute summary for the agent.",
  ],
  "priya sharma": [
    "Reviewed the security alert and confirmed an unrecognised login from a foreign IP address.",
    "Checked session history — the suspicious session accessed personal details but no transactions were made.",
    "Initiated a temporary account lock and triggered a password reset notification to Priya's verified email.",
    "Prepared an incident summary and recommended MFA enablement steps for the agent to walk Priya through.",
  ],
  "robert okafor": [
    "Reviewed Robert's SMS thread and identified API authentication errors starting immediately post-migration.",
    "Checked the developer portal — BlueLine's API keys were not re-issued after the platform version upgrade.",
    "Confirmed the error pattern matches a known breaking change introduced in API v3.1.",
    "Prepared a migration guide and new key generation steps for the agent to share.",
  ],
  "lisa montenegro": [
    "Reviewed Lisa's email thread and confirmed a GDPR-mandated data export was requested 18 days ago.",
    "Checked the data export queue — the request stalled due to a missing data-owner approval in the system.",
    "Identified the responsible internal team and flagged the overdue approval to compliance ops.",
    "Prepared an export status summary and escalation note for the agent.",
  ],
  "kevin tran": [
    "Reviewed Kevin's billing history and confirmed duplicate invoices were generated for three consecutive months.",
    "Identified a billing system sync error introduced during last quarter's ERP migration as the root cause.",
    "Calculated the total overbilling: $12,600 across three invoices — all currently marked as overdue.",
    "Prepared a credit memo draft and flagged the case to the billing engineering team.",
  ],
  "angela russo": [
    "Reviewed Angela's chat and confirmed she is requesting a payment method update for her corporate account.",
    "Verified Angela's identity meets the account's security threshold for payment detail changes.",
    "Confirmed no active transactions are pending that would be affected by the card change.",
    "Prepared a secure payment update link and draft confirmation message for the agent.",
  ],
  "marcus bell": [
    "Reviewed Marcus's email thread and confirmed SSO broke immediately after an Azure AD directory sync.",
    "Checked Vertex's SSO configuration — the entity ID and assertion consumer URL are now mismatched.",
    "Confirmed the sync overwrote a custom attribute mapping that was set manually.",
    "Prepared a re-configuration guide and flagged the issue to the identity team.",
  ],
  "sandra yip": [
    "Reviewed Sandra's SMS thread and confirmed she cannot access the Q1 and Q2 report documents in the portal.",
    "Checked her account permissions — the reports portal role was inadvertently removed during a user audit.",
    "Confirmed the reports are available and the issue is entirely permission-based, not a data problem.",
    "Prepared a permission restoration request and flagged it to the admin team.",
  ],
  "derek owens": [
    "Reviewed Derek's account and identified his annual contract expires in 11 days with no renewal initiated.",
    "Cross-referenced the contract terms — a 30-day notice clause means renewal is technically overdue.",
    "Identified two pricing options available under the current commercial framework.",
    "Prepared a contract summary and renewal options brief for the agent.",
  ],
  "jordan davis": [
    "Pulled Jordan's account and identified router model: CloudMesh Pro v3 running firmware 4.0.8 — a known mismatch against the current stable release 4.1.2.",
    "Reviewed 24 hours of diagnostic telemetry — confirmed recurring connection drops consistent with the firmware version mismatch.",
    "Initiated a step-by-step guided factory reset sequence with Jordan, confirming each action in real time.",
    "Flagged the conversation for human assist — Jordan's custom port forwarding rules may not survive the factory reset; firmware-specific backup behavior requires expert confirmation.",
  ],
  "tom hargrove": [
    "Reviewed Tom's email and confirmed he is following up on a refund issued 22 days ago.",
    "Checked the refund status — the credit was processed but the bank return is still pending clearance.",
    "Confirmed the refund amount of $340 is within the expected processing window for Tom's bank.",
    "Prepared a refund status update and estimated clearance timeline for the agent to share.",
  ],
  "nadia petrov": [
    "Reviewed Nadia's SMS thread and confirmed her international wire transfer is 3 days past the SLA window.",
    "Checked with the correspondent bank — the transfer is held pending SWIFT compliance screening.",
    "Identified a flag on the beneficiary country code that triggered an automated compliance hold.",
    "Prepared a compliance hold explanation and escalation path for the agent.",
  ],
  "carlos mendez": [
    "Reviewed Carlos's call notes and confirmed a real-time data feed outage affecting pipeline monitoring dashboards.",
    "Checked system status — the outage is caused by a broken WebSocket connection in the v4.2 API gateway.",
    "Confirmed the engineering team is aware and a fix is in progress, estimated resolution in 2 hours.",
    "Prepared an outage briefing and interim monitoring workaround for the agent to share.",
  ],
  "ingrid holmberg": [
    "Reviewed Ingrid's email and identified an HS code classification error on a recent shipment declaration.",
    "Cross-referenced the declared goods with the correct tariff schedule — the error affects duty calculations.",
    "Confirmed the shipment is currently held at customs pending a corrected declaration.",
    "Prepared a corrected HS code recommendation and amendment filing instructions for the agent.",
  ],
  "darius knox": [
    "Reviewed Darius's chat and confirmed a $47,500 transfer was sent to an incorrect beneficiary account.",
    "Checked the transfer status — the transaction completed 8 minutes ago and has not yet been settled.",
    "Identified the receiving institution and initiated a recall request through the payments network.",
    "Flagged the case as a priority incident and prepared a reversal brief for the agent.",
  ],
  "alex kowalski": [
    "Reviewed the full SMS thread and identified a payment-blocking error on Alex's upgrade attempt.",
    "Checked Alex's account and confirmed the Visa ending in 4092 is valid but encountering a recurring gateway error.",
    "Identified the error is tied to a temporary payment processing hold, not the card itself.",
    "Prepared a payment unlock step and drafted a confirmation message for the agent to share.",
  ],
  "sarah miller": [
    "Reviewed Sarah's case and confirmed she missed her scheduled flight and needs a same-day rebooking.",
    "Checked available same-day options on the relevant route and identified two viable alternatives.",
    "Confirmed Sarah's booking terms allow a same-day change without a rebooking fee given the circumstances.",
    "Prepared a rebooking summary with available flight options for the agent to present.",
  ],
  "emily chen": [
    "Reviewed Emily's chat and confirmed her discount code is returning an error at checkout.",
    "Checked the promo code validity — the code is active but has a tier restriction not shown on the landing page.",
    "Identified the issue is a backend eligibility mismatch between the code and Emily's current account tier.",
    "Prepared a manual discount override request and a corrected promo option for the agent to apply.",
  ],
  "david brown": [
    "Reviewed David's inquiry and confirmed a subscription plan change coincided with a potential duplicate charge.",
    "Checked billing history — two charges were posted during the plan transition window, one of which is a duplicate.",
    "Confirmed the duplicate is tied to the mid-cycle proration logic and has not yet been reversed.",
    "Prepared a credit memo for the duplicate charge and a corrected subscription state for agent review.",
  ],
  "priya nair": [
    "Reviewed Priya's case and confirmed her account was locked after five consecutive failed sign-in attempts.",
    "Checked the sign-in logs — the failed attempts originated from a recognised device and IP address.",
    "Confirmed the lockout is a standard security trigger and no unauthorised access has occurred.",
    "Prepared an account unlock flow and identity verification steps for the agent to walk Priya through.",
  ],
  "miguel santos": [
    "Reviewed Miguel's complaint and confirmed an order cancellation did not prevent a charge from completing.",
    "Checked the order lifecycle — the cancellation was submitted after the payment had already been captured.",
    "Confirmed a full refund is eligible and the charge has not yet been disputed with the card issuer.",
    "Prepared a refund initiation summary and estimated processing timeline for the agent to share.",
  ],
  "olivia reed": [
    "Reviewed Olivia's request and confirmed her shipment has a delivery exception due to an address issue.",
    "Checked the carrier tracking — the package is held at a regional depot and eligible for address correction.",
    "Confirmed the reroute window is open but closes within 24 hours if no action is taken.",
    "Prepared the reroute request and carrier contact details for the agent to process immediately.",
  ],
  "jamal carter": [
    "Reviewed Jamal's report and confirmed recent changes saved on mobile are not syncing to desktop.",
    "Checked the sync logs — a conflict error is preventing the mobile save from propagating to the cloud account state.",
    "Confirmed the data is not lost — it is queued locally on the mobile device pending a sync resolution.",
    "Prepared a manual sync trigger procedure and conflict resolution guide for the agent to walk Jamal through.",
  ],
  "hannah brooks": [
    "Reviewed Hannah's invoice query and confirmed the renewal amount is higher than the rate quoted at last renewal.",
    "Checked account pricing history — a rate adjustment was applied automatically at renewal without notice.",
    "Confirmed the original quoted rate was documented in account notes but not locked in the billing system.",
    "Prepared a billing correction request and draft response honouring the original quoted rate for agent review.",
  ],
  "noah patel": [
    "Reviewed the full SMS thread and confirmed an analytics export failed ahead of a stakeholder meeting.",
    "Cross-referenced Noah's account permissions and recent failed export job logs.",
    "Confirmed the issue is tied to a report generation timeout — not a permissions error.",
    "Prepared a step-by-step remediation draft and flagged the relevant knowledge base article.",
  ],
  "lauren kim": [
    "Reviewed Lauren's request and confirmed a seat expansion is blocked by an admin permission error.",
    "Checked the account admin settings — the billing contact role does not have seat management permissions enabled.",
    "Confirmed the seat expansion is within plan limits and the only blocker is a permission configuration issue.",
    "Prepared a permission update request and seat expansion steps for the agent to process with Lauren.",
  ],
  "ethan zhang": [
    "Reviewed Ethan's report and confirmed multiple API sync jobs are stalled due to repeated rate-limit errors.",
    "Checked the API usage logs — Ethan's integration is hitting the hourly rate cap due to a misconfigured retry interval.",
    "Identified the retry logic is set to an aggressive interval that compounds the rate-limit violations.",
    "Prepared a rate-limit configuration fix and backoff strategy guide for the agent to share with Ethan.",
  ],
};

export function getOverviewActions(conversation: SharedConversationData): string[] | null {
  const key = conversation.customerName.toLowerCase().trim();
  return overviewActionsByCustomerName[key] ?? null;
}

// ─── Summary and Overview Functions ────────────────────────────────────

export const SUMMARY_COPILOT_REASONING_STEPS = [
  "Reviewing case history and prior customer interactions...",
  "Analyzing attempted resolutions and their outcomes...",
  "Cross-referencing similar resolved cases in the knowledge base...",
  "Synthesizing recommended next steps and action items...",
];

export function getCustomerIssueSummary(conversation: SharedConversationData) {
  const customerFirstName = conversation.customerName.split(" ")[0] ?? conversation.customerName;
  const latestCustomerMessage = [...conversation.messages].reverse().find((m) => m.role === "customer");
  const content = latestCustomerMessage?.content?.replace(/\s+/g, " ").trim() ?? "";
  const snippet = content.length > 170 ? `${content.slice(0, 167)}...` : content;
  return snippet
    ? `${customerFirstName} is dealing with this issue: ${snippet}`
    : `${customerFirstName}'s current issue has not been fully captured in the thread yet.`;
}

export function getConversationOverviewSummary(conversation: SharedConversationData) {
  const customerFirstName = conversation.customerName.split(" ")[0] ?? conversation.customerName;
  const latestCustomerMessage = [...conversation.messages].reverse().find((message) => message.role === "customer");

  return latestCustomerMessage?.sentiment === "frustrated"
    ? `${customerFirstName} was routed to this agent because the issue is still unresolved and the customer is showing frustration in the current ${conversation.label.toLowerCase()} thread.`
    : `${customerFirstName} was routed to this agent because the current ${conversation.label.toLowerCase()} thread still needs active ownership to move the issue forward.`;
}

export function getInteractionOverview(conversation: SharedConversationData): string {
  const customerFirstName = conversation.customerName.split(" ")[0] ?? conversation.customerName;
  const latestCustomerMessage = [...conversation.messages].reverse().find((m) => m.role === "customer");
  const isFrustrated = latestCustomerMessage?.sentiment === "frustrated";
  const channel = conversation.label;

  const firstCustomerMessage = conversation.messages.find((m) => m.role === "customer");
  const ticketTime = firstCustomerMessage?.time ?? "today";

  const base = latestCustomerMessage?.content
    ? `${customerFirstName} reached out via ${channel} regarding: ${latestCustomerMessage.content.slice(0, 120).trim()}${latestCustomerMessage.content.length > 120 ? "…" : ""}`
    : `${customerFirstName} reached out via ${channel} with an open issue that requires agent follow-up.`;

  const tone = isFrustrated
    ? ` ${customerFirstName} has expressed frustration — a de-escalation approach is recommended.`
    : "";

  const ticket = firstCustomerMessage
    ? ` A ticket has been opened as of ${ticketTime}.`
    : "";

  return `${base}${tone}${ticket}`;
}

export function getAgentNextSteps(conversation: SharedConversationData): string[] {
  const entry = getCustomerAssignmentEntry(conversation.customerName);
  if (entry) return entry.nextSteps;

  const latestCustomerMessage = [...conversation.messages].reverse().find((m) => m.role === "customer");
  const content = latestCustomerMessage?.content?.toLowerCase() ?? "";
  const isFrustrated = latestCustomerMessage?.sentiment === "frustrated";

  if (content.includes("billing") || content.includes("charged") || content.includes("payment")) {
    return [
      "Update Salesforce Record with the billing discrepancy details",
      "Create ADP Ticket to document the charge issue",
      "Send Discount Coupon as goodwill if a billing error is confirmed",
      "Set Case to Resolved after communicating the outcome",
    ];
  }
  if (isFrustrated || content.includes("frustrated") || content.includes("escalat")) {
    return [
      "Escalate to Supervisor given the elevated frustration signals",
      "Update Salesforce Record with the escalation notes",
      "Set Case to Resolved once the supervisor has taken over",
    ];
  }
  if (content.includes("error") || content.includes("failed") || content.includes("retry")) {
    return [
      "Create ADP Ticket to document the error and assign it for investigation",
      "Update Salesforce Record with the root cause and remediation steps",
      "Schedule Callback to verify the issue is resolved after the fix is applied",
    ];
  }
  return [
    "Update Salesforce Record with the latest interaction details",
    "Create ADP Ticket to log the open issue for the support team",
    "Schedule Callback to follow up on the resolution",
    "Set Case to Resolved once the customer confirms the issue is closed",
  ];
}

export function getAiActionsTaken(conversation: SharedConversationData) {
  const customerFirstName = conversation.customerName.split(" ")[0] ?? conversation.customerName;
  const channel = conversation.label.toLowerCase();
  const latestCustomerMessage = [...conversation.messages].reverse().find((m) => m.role === "customer");
  const isFrustrated = latestCustomerMessage?.sentiment === "frustrated";

  const actions = [
    `Reviewed the full ${channel} thread and extracted the core issue from ${customerFirstName}'s messages.`,
    `Checked account history and cross-referenced any recent interactions flagged on the account.`,
    isFrustrated
      ? `Detected elevated frustration signals and applied de-escalation routing criteria.`
      : `Assessed conversation tone and confirmed standard escalation path was appropriate.`,
    `Prepared a suggested response draft and identified relevant knowledge base articles.`,
  ];
  return actions;
}

export function getWhyAgentIsNeeded(conversation: SharedConversationData) {
  const customerFirstName = conversation.customerName.split(" ")[0] ?? conversation.customerName;
  const latestCustomerMessage = [...conversation.messages].reverse().find((m) => m.role === "customer");
  const isFrustrated = latestCustomerMessage?.sentiment === "frustrated";

  if (isFrustrated) {
    return `${customerFirstName} is showing clear signs of frustration after prior interactions left the issue unresolved. Automated responses have reached their limit — a human agent is needed to rebuild trust, acknowledge the experience empathetically, and drive a concrete resolution in this session.`;
  }
  return `The issue ${customerFirstName} raised requires judgment and account-level context that the AI cannot act on autonomously. A human agent is needed to review the details, confirm the right course of action, and deliver a personalised resolution that closes the loop.`;
}

export function generateSimulatedCustomerReply(customerName: string, issue: string): string {
  const firstName = customerName.split(" ")[0] ?? customerName;
  const thanks = ["Thanks for your help!", "I appreciate it!", "That sounds good.", "Perfect, thanks!", "Got it, thank you!"];
  const randomThanks = thanks[Math.floor(Math.random() * thanks.length)];
  return `${firstName} replies: "${randomThanks}"`;
}
