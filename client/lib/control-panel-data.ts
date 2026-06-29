// Control Panel static data and configuration

import type { Channel, Priority, AiOverview } from "@/lib/static-assignments";

export const CURRENT_AGENT_NAME = "Jeff Common";

export const priorityStyles: Record<Priority, string> = {
  Critical: "border-[#E53935] bg-[#FDEAEA] text-[#C71D1A]",
  High: "border-[#FFB800] bg-[#FFF6E0] text-[#A37A00]",
  Medium: "border-[#BFDBFE] bg-[#EBF4FD] text-[#166CCA]",
  Low: "border-[#24943E] bg-[#EFFBF1] text-[#208337]",
};

export const priorityRank: Record<Priority, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const channelIconMap: Record<Channel, any> = {
  chat: "MessageCircle",
  sms: "MessageSquare",
  email: "Mail",
  voice: "Phone",
  whatsapp: "WhatsAppIcon",
};

export const companyByCustomerId: Record<string, string> = {
  alex: "Apex Financial Group",
  sarah: "Summit Healthcare Inc.",
  priya: "Priya Sharma (Personal)",
  david: "BlueLine Logistics",
  priyaNair: "Coastal Realty Partners",
  olivia: "Meridian Tech Solutions",
  noah: "Noah Patel (Personal)",
  ethan: "Westfield Capital",
};

// Customer context per live customerRecordId
export const liveCustomerContext: Record<string, string> = {
  noah: "Individual account. Technically proficient user. First data-export failure. Sentiment: Frustrated but methodical — expects a clear resolution path.",
  olivia: "Mid-market tech client. Growing subscription. Billing discrepancy tied to a mid-cycle plan upgrade. Sentiment: Confused but calm — has contacted support twice already.",
  ethan: "High-value client. Frequent wire transfers to known payees. Transaction flagged as a false positive. Sentiment: Concerned — expects swift manual clearance.",
};

export const liveAiOverview: Record<string, AiOverview> = {
  noah: {
    actions: [
      "Reviewed the full SMS thread and extracted the core data-export failure from Noah's messages.",
      "Cross-referenced Noah's account permissions and recent failed export job logs.",
      "Confirmed the issue is tied to a quarterly report generation timeout — not a permissions error.",
      "Prepared a step-by-step remediation draft and flagged the relevant knowledge base article.",
    ],
    whyNeeded:
      "The export failure requires a manual queue reset that the AI cannot trigger autonomously. A human agent is needed to confirm the correct reporting period, initiate the fix, and validate the output before sending it to Noah.",
    nextSteps: [
      "Confirm the correct reporting period with Noah",
      "Initiate a manual queue reset for the failed export job",
      "Validate the export output before delivering it",
      "Send the completed report and close the case",
    ],
  },
  olivia: {
    actions: [
      "Reviewed the full chat thread and identified a billing discrepancy tied to a mid-cycle plan upgrade.",
      "Checked Olivia's subscription history and confirmed the pro-rated charge was applied incorrectly.",
      "Assessed tone — Olivia is frustrated after two prior contacts on the same issue.",
      "Drafted an apology response and prepared a credit memo for agent review.",
    ],
    whyNeeded:
      "Olivia has contacted support twice for the same billing issue without resolution. She is showing clear frustration signals. A human agent is needed to acknowledge the repeated failure, issue the correct credit, and personally confirm the account is now accurate.",
    nextSteps: [
      "Acknowledge the repeated billing failure and apologise",
      "Issue the correct credit and confirm the amount with Olivia",
      "Verify the account balance is now accurate",
      "Confirm resolution and close the case with a personal note",
    ],
  },
  ethan: {
    actions: [
      "Reviewed Ethan's transaction history and flagged wire transfer activity.",
      "Compared the flagged transaction against known payee list — recipient is in whitelist.",
      "Assessed fraud risk as low; issue is a false positive from rule-tuning change.",
      "Drafted a wire transfer clearance request and prepared account release instructions.",
    ],
    whyNeeded:
      "Ethan's high-value wire transfer was flagged by our anti-fraud system, even though the recipient is in his whitelist. A human agent is needed to manually clear the transaction and resolve the issue quickly to maintain his confidence.",
    nextSteps: [
      "Verify the recipient is in Ethan's trusted payee whitelist",
      "Manually clear the flagged transaction",
      "Explain the false positive and confirm his account is no longer restricted",
      "Offer a service credit or goodwill gesture for the inconvenience",
    ],
  },
};

export const priorityFilterOptions: { value: Priority; label: string }[] = [
  { value: "Critical", label: "Critical" },
  { value: "High", label: "High" },
  { value: "Medium", label: "Medium" },
  { value: "Low", label: "Low" },
];

export type ChannelFilterValue = "chat" | "email" | "sms" | "whatsapp" | "voice";

export const channelFilterOptions: { value: ChannelFilterValue; label: string }[] = [
  { value: "chat", label: "Chat" },
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "voice", label: "Voice" },
];

export const ISSUE_GROUPS: { label: string; keywords: string[] }[] = [
  { label: "Login & Authentication", keywords: ["login", "password", "auth", "sign in", "access", "locked out"] },
  { label: "Payment & Billing", keywords: ["payment", "charge", "billing", "invoice", "refund", "transfer", "transaction", "wire", "funds"] },
  { label: "System & Technical", keywords: ["system", "error", "outage", "down", "crash", "bug", "technical", "ai ", "virtual agent", "incorrect", "compliance"] },
  { label: "Account Management", keywords: ["account", "profile", "settings", "update", "plan", "subscription"] },
  { label: "Security & Fraud", keywords: ["security", "breach", "fraud", "suspicious", "unauthori", "data", "export"] },
  { label: "Service & Support", keywords: ["delay", "sla", "service", "support", "escalat", "complaint"] },
];

export const connectedApps = [
  { name: "Salesforce", latency: "42ms", uptime: "99.9%", status: "healthy" },
  { name: "ADP Workforce", latency: "88ms", uptime: "99.7%", status: "healthy" },
  { name: "Outlook 365", latency: "31ms", uptime: "100%", status: "healthy" },
  { name: "MS Teams", latency: "29ms", uptime: "100%", status: "healthy" },
  { name: "Zendesk", latency: "340ms", uptime: "97.2%", status: "degraded" },
  { name: "Jira Cloud", latency: "67ms", uptime: "99.8%", status: "healthy" },
  { name: "Knowledge Base", latency: "12ms", uptime: "100%", status: "healthy" },
  { name: "Desktop CTI", latency: "8ms", uptime: "100%", status: "healthy" },
];

export const appIconLetters: Record<string, string> = {
  Salesforce: "S",
  "ADP Workforce": "A",
  "Outlook 365": "O",
  "MS Teams": "T",
  Zendesk: "Z",
  "Jira Cloud": "J",
  "Knowledge Base": "K",
  "Desktop CTI": "D",
};

export const COPILOT_REASONING_STEPS = [
  "Reviewing case history and prior customer interactions...",
  "Analyzing attempted resolutions and their outcomes...",
  "Cross-referencing similar resolved cases in the knowledge base...",
  "Synthesizing recommended next steps and action items...",
];

export const CARD_COPILOT_STEPS = [
  "Reviewing case history and prior customer interactions...",
  "Analyzing attempted resolutions and their outcomes...",
  "Cross-referencing similar resolved cases in the knowledge base...",
  "Synthesizing recommended next steps and action items...",
];

export const BULK_AI_RESPONSES: Record<string, string> = {
  "Login & Authentication": "We're aware of an issue affecting login access and are actively working to resolve it. Our engineering team expects a fix within the next 30 minutes. We apologize for the inconvenience and appreciate your patience.",
  "Payment & Billing": "We've identified an issue affecting payment processing. Our team is investigating urgently to restore normal service. We'll ensure no incorrect charges are applied and will notify you once resolved.",
  "System & Technical": "We're currently experiencing a technical issue that may be impacting your experience. Our engineering team is aware and actively working on a resolution. We appreciate your patience.",
  "Account Management": "We're aware of an issue affecting account management features and are working to resolve it quickly. Your account data is safe. We'll notify you once full functionality is restored.",
  "Security & Fraud": "Our security team has been alerted and is investigating immediately. As a precaution, please review your recent account activity and contact us directly if you notice anything suspicious.",
  "Service & Support": "We sincerely apologize for the delay. We're aware this doesn't meet our standards and are prioritising your case. A dedicated agent will be in touch shortly.",
};
