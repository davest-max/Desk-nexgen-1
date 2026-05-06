import type { AgentTask } from "./conversation-types";

export const conversationFooterMenuItems = [
  "Add files or photos",
  "Take a screenshot",
  "Add to project",
] as const;

export const conversationFooterSecondaryMenuItems = [
  "Web search",
  "Connect Supervisor",
  "Add connectors",
] as const;

export const MESSAGE_TAG_DEFS = [
  {
    id: "complaint",
    label: "Complaint",
    activeClass: "bg-[#FDEAEA] text-[#C71D1A] border-[#E53935]",
    ghostClass: "bg-white text-[#98A2B3] border-[#E4E7EC] hover:bg-[#FDEAEA] hover:text-[#C71D1A] hover:border-[#E53935]",
  },
  {
    id: "help",
    label: "Help",
    activeClass: "bg-[#EEF4FF] text-[#3538CD] border-[#C7D7FD]",
    ghostClass: "bg-white text-[#98A2B3] border-[#E4E7EC] hover:bg-[#EEF4FF] hover:text-[#3538CD] hover:border-[#C7D7FD]",
  },
  {
    id: "praise",
    label: "Praise",
    activeClass: "bg-[#EFFBF1] text-[#208337] border-[#24943E]",
    ghostClass: "bg-white text-[#98A2B3] border-[#E4E7EC] hover:bg-[#EFFBF1] hover:text-[#208337] hover:border-[#24943E]",
  },
  {
    id: "share",
    label: "Share",
    activeClass: "bg-[#F9F5FF] text-[#1260B0] border-[#E9D7FE]",
    ghostClass: "bg-white text-[#98A2B3] border-[#E4E7EC] hover:bg-[#F9F5FF] hover:text-[#1260B0] hover:border-[#E9D7FE]",
  },
] as const;

export const TASK_COMPLETION_NOTES: Record<string, string> = {
  "create-ticket": "ADP ticket created",
  "update-salesforce": "Salesforce record updated",
  "send-coupon": "Discount coupon email sent",
  "escalate": "Escalated to supervisor",
  "callback": "Callback scheduled",
  "upgrade-beverage-package": "Beverage package upgraded",
  "confirm-credit-line": "Credit line confirmed",
  "set-resolved": "Case resolved",
};

export const TASK_COMPLETION_REPLIES: Record<string, string> = {
  "create-ticket": "I've created a support ticket for you and it's been assigned to our queue. Is there anything else I can help you with in the meantime?",
  "update-salesforce": "I've updated your account record on our end. Is there anything else I can help you with?",
  "send-coupon": "I've sent a discount coupon to your email address on file. Is there anything else I can do for you?",
  "escalate": "I've escalated this to a supervisor who will be with you shortly. Is there anything else you need while you wait?",
  "callback": "I've scheduled a callback for you. You'll receive a confirmation shortly. Is there anything else I can help you with?",
  "upgrade-beverage-package": "I've processed the upgrade to your beverage package. You should receive a confirmation email shortly.",
  "confirm-credit-line": "I've confirmed your credit line details. Everything looks good on our end.",
  "set-resolved": "Thank you so much for reaching out! I'm glad we could help. Have a great day!",
};

export const TASK_ACTION_TITLES: Record<string, string> = {
  "create-ticket": "Creating ADP Ticket...",
  "update-salesforce": "Creating Salesforce Record...",
  "send-coupon": "Sending Discount Coupon...",
  "escalate": "Escalating to Supervisor...",
  "callback": "Scheduling Callback...",
  "upgrade-beverage-package": "Upgrading Beverage Package...",
  "confirm-credit-line": "Confirming Credit Line...",
  "set-resolved": "Resolving Case...",
  "initiate-dispute": "Initiating Dispute...",
  "issue-temp-credit": "Applying Temporary Credit...",
  "issue-replacement-card": "Issuing Replacement Card...",
};

export const TASK_STEPS: Record<string, string[]> = {
  "create-ticket": [
    "Searching for customer ID",
    "Pulling conversation history",
    "Creating ADP ticket record",
    "Assigning to support queue",
  ],
  "update-salesforce": [
    "Searching for customer ID",
    "Processing updating payment amount",
    "Emailing confirmation to customer",
  ],
  "send-coupon": [
    "Looking up customer email",
    "Generating discount code",
    "Sending coupon email to customer",
  ],
  "escalate": [
    "Finding available supervisor",
    "Transferring conversation notes",
    "Notifying supervisor",
  ],
  "callback": [
    "Checking agent availability",
    "Creating callback appointment",
    "Sending confirmation to customer",
  ],
  "upgrade-beverage-package": [
    "Checking current package tier",
    "Verifying upgrade eligibility",
    "Processing package change",
    "Sending confirmation to customer",
  ],
  "confirm-credit-line": [
    "Pulling account credit details",
    "Verifying authorisation status",
    "Confirming credit line terms",
  ],
  "set-resolved": [
    "Closing conversation thread",
    "Updating case status",
    "Removing from queue",
  ],
  "initiate-dispute": [
    "Verifying account and transaction details",
    "Filing dispute for $2,159 in unauthorized charges",
    "Issuing provisional credit to account",
    "Sending dispute confirmation to customer",
  ],
  "issue-temp-credit": [
    "Verifying account balance",
    "Applying provisional credit of $2,159",
    "Logging credit memo to case record",
    "Notifying customer via email",
  ],
  "issue-replacement-card": [
    "Permanently blocking compromised card",
    "Generating replacement card number",
    "Scheduling delivery to address on file",
    "Sending tracking confirmation to customer",
  ],
};

// Maps natural-language copilot requests to known task IDs.
export const COPILOT_TASK_MATCHERS: Array<{ keywords: string[]; task: AgentTask }> = [
  { keywords: ["ticket", "case", "adp", "support ticket", "create ticket", "open ticket"], task: { id: "create-ticket", label: "Create ADP Ticket" } },
  { keywords: ["salesforce", "crm", "record", "account", "update salesforce"], task: { id: "update-salesforce", label: "Update Salesforce Record" } },
  { keywords: ["coupon", "discount", "voucher", "promo", "send coupon"], task: { id: "send-coupon", label: "Send Discount Coupon" } },
  { keywords: ["escalat", "supervisor", "manager", "escalate"], task: { id: "escalate", label: "Escalate to Supervisor" } },
  { keywords: ["callback", "call back", "schedule call", "schedule callback"], task: { id: "callback", label: "Schedule Callback" } },
];
