import type { ConversationMessage, SharedConversationData } from "@/components/ConversationPanel";

export type CustomerChannel = "chat" | "sms" | "whatsapp" | "email" | "voice";
export type CustomerQueueIcon = "phone" | "clipboardList" | "messageSquare";
export type CustomerOverviewTimelineTone = "critical" | "warning" | "info" | "default";

export type CustomerOverviewTimelineItem = {
  id: string;
  title: string;
  timestamp: string;
  detail: string;
  tone: CustomerOverviewTimelineTone;
  sortOrder: number;
};

export type CustomerHistoryDot = "purple" | "orange" | "gray" | "red" | "green" | "blue";

export type CustomerHistoryItemType =
  | "search"       // Google / web search
  | "web"          // Website page visit
  | "chat"         // Bot or live-agent chat
  | "purchase"     // Order placed
  | "shipping"     // Shipping / delivery event
  | "registration" // Product or account registration
  | "ticket"       // Auto-generated system ticket
  | "email"        // System or agent email
  | "system"       // Internal system event
  | "handoff"      // Human-agent handoff
  | "lead";        // CRM lead form created by agent

// ── Interaction types ────────────────────────────────────────────────────────

export type CustomerHistoryChatMessage = {
  sender: "customer" | "bot" | "agent";
  name?: string;
  text: string;
  time?: string;
};

export type CustomerHistoryInteraction =
  | {
      kind: "chat";
      botName?: string;
      agentName?: string;
      messages: CustomerHistoryChatMessage[];
    }
  | {
      kind: "search";
      query: string;
      results: { title: string; url: string; snippet: string; clicked?: boolean }[];
    }
  | {
      kind: "web";
      url: string;
      title: string;
      description?: string;
      sectionsViewed?: string[];
    }
  | {
      kind: "purchase";
      orderId: string;
      items: { name: string; qty: number; price: string }[];
      total: string;
      paymentMethod?: string;
      shippingAddress?: string;
    }
  | {
      kind: "shipping";
      carrier: string;
      trackingNumber: string;
      events: { status: string; location: string; time: string; isDelivered?: boolean }[];
    }
  | {
      kind: "ticket";
      ticketId: string;
      subject: string;
      notes: { author: string; isInternal?: boolean; text: string; time: string }[];
    }
  | {
      kind: "email";
      from: string;
      to: string;
      subject: string;
      sentAt: string;
      body: string;
      opened?: boolean;
    }
  | {
      kind: "registration";
      fields: { label: string; value: string }[];
    }
  | {
      kind: "lead";
    };

// ── History item ─────────────────────────────────────────────────────────────

export type CustomerHistoryItem = {
  id: string;
  title: string;
  timestamp: string;
  detail: string;
  dot: CustomerHistoryDot;
  /** Categorises the event for icon rendering and filtering. */
  type?: CustomerHistoryItemType;
  /** Optional structured metadata shown in the detail panel (e.g. order numbers, URLs). */
  meta?: { label: string; value: string }[];
  /** Short customer quote shown as an interstitial message bubble beneath the event row. */
  customerMessage?: string;
  /** Phase label shown as a section separator above this item when it is the first in its group. */
  phase?: string;
  /** Full interaction content rendered when the agent clicks "View [interaction]". Stored here to keep Layout.tsx lean. */
  interaction?: CustomerHistoryInteraction;
};

type SeedConversationChannel = Exclude<CustomerChannel, "voice">;

export type CustomerProfile = {
  department: string;
  tenureYears: number;
  totalAUM: string;
  financialReadiness: number; // 0–100
  financialAdvisor: string;
  advisorTitle: string;
  tags: string[];
  fraudRiskScore: number; // 0–100 (higher = higher risk)
  priorDisputeCount: number;
  cardBlocked: boolean;
};

export type CustomerAccount = {
  id: string;
  type: "Checking" | "Savings" | "Credit" | "Investment" | "Mortgage" | "Business";
  number: string;        // masked, e.g. "****4521"
  balance: string;       // formatted, e.g. "$12,450.00"
  availableBalance?: string;
  status: "active" | "frozen" | "closed";
  openedDate: string;    // e.g. "Mar 2019"
  currency?: string;     // defaults to USD
};

export type CustomerAddress = {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
};

export type CustomerSeedRecord = {
  id: string;
  initials: string;
  name: string;
  customerId: string;
  lastUpdated: string;
  profile: CustomerProfile;
  conversationTopics: string[];
  contact: {
    email: string;
    phone: string;
    address: CustomerAddress;
  };
  accounts: CustomerAccount[];
  /** @deprecated use contact.address for structured access; overview.address kept for backward compat */
  overview: {
    contactNumber: string;
    assignedAgent: string;
    pronoun: "she" | "he" | "they";
    lastContactTime: string;
    address: string;
  };
  interactionTimeline: CustomerOverviewTimelineItem[];
  customerHistory: CustomerHistoryItem[];
  queue: {
    time: string;
    preview: string;
    priority: string;
    priorityClassName: string;
    badgeColor: string;
    icon: CustomerQueueIcon;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  conversations: Record<
    SeedConversationChannel,
    {
      label: string;
      timelineLabel: string;
      draft: string;
      messages: ConversationMessage[];
    }
  >;
  /**
   * Scripted bot responses shown in the Escalated Case Modal for this customer.
   * Each entry is one approved response, in the order they should be presented.
   * The modal reads these so content is data-driven rather than hard-coded.
   */
  escalationResponses?: string[];
  /** Quick-read customer personality / behavior bullets shown in the Customer Snapshot card. */
  customerSnapshot?: string[];
  /**
   * Optional resolve-flow configuration for customers with scripted resolution workflows.
   * The conversation panel reads this to render the "Suggested Next Step" box.
   */
  resolveFlow?: {
    /** Type: "supervisor" for single-action resolve, "options" for multi-option resolve */
    type: "supervisor" | "options";
    /** Steps shown during the animated progress indicator */
    steps: string[];
    /** For "supervisor" type: supervisor name to assign to */
    supervisorName?: string;
    /** For "options" type: label for each option (keyed 1, 2, 3) */
    optionLabels?: Record<number, string>;
    /** For "options" type: suggested reply variants per option */
    replyVariants?: Record<number, { summary: string; suggestedReply: string }[]>;
    /** For "options" type: the internal note template. Use {option} and {goodwill} placeholders */
    noteTemplate?: string;
    /** For "options" type: goodwill note text when discount applied */
    goodwillNote?: string;
    /** For "options" type: goodwill line appended to suggested replies */
    goodwillReplyLine?: string;
  };
  /** Fallback copilot analysis text shown when the AI copilot panel first loads for this customer. */
  copilotFallbackResponse?: string;
  /** When true, the takeover flow won't inject a duplicate transfer message (seed data already has one). */
  seedHasTransferMessage?: boolean;
  /** Pre-populated reply draft shown in the conversation input when the agent takes over this customer. */
  takeoverDraft?: string;
};

export const customerDatabase: CustomerSeedRecord[] = [
  {
    id: "alex",
    initials: "AK",
    name: "Alex Kowalski",
    customerId: "CST-10482",
    lastUpdated: "02/23/26 | 04:22 PM",
    profile: {
      department: "Business Banking",
      tenureYears: 5,
      totalAUM: "$1,240,800.00",
      financialReadiness: 78,
      financialAdvisor: "Jeff Comstock",
      advisorTitle: "Business Banking Advisor",
      tags: ["Premier", "IVR Auth"],
      fraudRiskScore: 34,
      priorDisputeCount: 1,
      cardBlocked: false,
    },
    conversationTopics: [
      "Dispute a fraudulent Costco charge",
      "Clear the billing zip mismatch flag",
      "Retry Pro upgrade after security clearance",
    ],
    contact: {
      email: "alex.kowalski@vertexsystems.com",
      phone: "(415) 555-4092",
      address: { street: "245 Market St, Apt 8C", city: "San Francisco", state: "CA", zip: "94105", country: "US" },
    },
    accounts: [
      { id: "ak-chk", type: "Business", number: "****4521", balance: "$48,250.00", availableBalance: "$48,250.00", status: "active", openedDate: "Jan 2021" },
      { id: "ak-sav", type: "Savings",  number: "****8832", balance: "$125,000.00", status: "active", openedDate: "Mar 2021" },
      { id: "ak-crd", type: "Credit",   number: "****2017", balance: "-$18,400.00", availableBalance: "$31,600.00", status: "active", openedDate: "Jun 2022" },
    ],
    overview: {
      contactNumber: "(415) 555-4092",
      assignedAgent: "Jeff Comstock",
      pronoun: "he",
      lastContactTime: "Today, 10:26 AM",
      address: "245 Market St, Apt 8C, San Francisco, CA 94105",
    },
    interactionTimeline: [
      {
        id: "alex-risk-flag",
        title: "Security rule triggered",
        timestamp: "Today · 10:23 AM",
        detail: "Fraud screening flagged a billing zip mismatch against the saved payment profile during the Pro upgrade flow.",
        tone: "warning",
        sortOrder: 1,
      },
      {
        id: "alex-chat-open",
        title: "Customer opened live chat",
        timestamp: "Today · 10:24 AM",
        detail: "Alex reported a blocked Pro upgrade from the pricing page and asked for immediate help before an upcoming meeting.",
        tone: "default",
        sortOrder: 2,
      },
      {
        id: "alex-sms-agent",
        title: "Agent responded on SMS",
        timestamp: "Today · 10:25 AM",
        detail: "Jordan acknowledged the failed payment attempts and started reviewing the account security flags.",
        tone: "info",
        sortOrder: 3,
      },
      {
        id: "alex-retry-failed",
        title: "Upgrade retry blocked",
        timestamp: "Today · 10:26 AM",
        detail: "A follow-up checkout attempt was declined again after billing verification failed on the Pro upgrade request.",
        tone: "critical",
        sortOrder: 4,
      },
      {
        id: "alex-whatsapp-followup",
        title: "Customer requested mobile follow-up",
        timestamp: "Today · 10:27 AM",
        detail: "Alex switched to WhatsApp and asked for a faster path to enable Pro features before a client call.",
        tone: "info",
        sortOrder: 5,
      },
      {
        id: "alex-email-log",
        title: "Billing logs attached to case",
        timestamp: "Today · 10:28 AM",
        detail: "The failed transaction details were attached to the customer record so support could clear the payment hold.",
        tone: "default",
        sortOrder: 6,
      },
    ],
    customerHistory: [
      {
        id: "alex-h1",
        title: "Billing dispute opened",
        timestamp: "Today · 10:24 AM",
        detail: "Alex reported a blocked Pro upgrade and a Costco charge discrepancy. Case escalated to billing team.",
        dot: "orange",
      },
      {
        id: "alex-h2",
        title: "Payment method updated",
        timestamp: "Feb 3, 2026 · 2:11 PM",
        detail: "Alex replaced the Visa ending in 4092 with a new card after the old card expired. Identity verified via IVR.",
        dot: "gray",
      },
      {
        id: "alex-h3",
        title: "Billing dispute resolved",
        timestamp: "Nov 14, 2025 · 11:45 AM",
        detail: "A $142 disputed charge was credited back to Alex's account after the merchant confirmed the error.",
        dot: "green",
      },
      {
        id: "alex-h4",
        title: "Account limit increased",
        timestamp: "Sep 2, 2025 · 9:30 AM",
        detail: "Monthly transfer limit raised from $25,000 to $50,000 following a credit review and advisor recommendation.",
        dot: "purple",
      },
      {
        id: "alex-h5",
        title: "Upgraded to Premier tier",
        timestamp: "Mar 18, 2024 · 3:00 PM",
        detail: "Account upgraded from Standard to Premier after AUM crossed the $1M threshold. New advisor assigned.",
        dot: "purple",
      },
      {
        id: "alex-h6",
        title: "Account opened",
        timestamp: "Feb 10, 2021 · 10:00 AM",
        detail: "Business Banking account opened for Alex Kowalski. Initial deposit of $85,000 via wire transfer.",
        dot: "gray",
      },
    ],
    queue: {
      time: "Now",
      preview: "Need help resolving a blocked upgrade.",
      priority: "Critical",
      priorityClassName: "border-[#E53935] bg-[#FDEAEA] text-[#C71D1A]",
      badgeColor: "bg-[#E32926]",
      icon: "phone",
      isActive: true,
      createdAt: "2026-03-11T08:30:00",
      updatedAt: "2026-03-11T10:24:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 10:24 AM",
        draft:
          "I can see the upgrade failure in your live chat session. I’m clearing the billing mismatch now so you can retry without leaving this window.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "Hi, I'm on the pricing page and the upgrade button keeps failing after I submit my card details.",
            time: "10:24 AM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "Thanks for flagging it. I’m reviewing the failed checkout event from your session now.",
            time: "10:25 AM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "It says the payment details don't match, but everything is copied directly from my profile.",
            time: "10:26 AM",
            sentiment: "frustrated",
          },
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 10:24 AM",
        draft:
          "I see the transaction block. It appears our security system flagged it due to a recent mismatch in billing zip codes. Let me clear that flag for you.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "Hi, I'm trying to upgrade my subscription to the Pro tier, but my credit card keeps getting declined even though I know I have sufficient funds.",
            time: "10:24 AM",
            sentiment: "frustrated",
          },
          {
            id: 2,
            role: "agent",
            content:
              "Hello Alex! I'm sorry to hear you're experiencing issues upgrading your account. I can certainly help you look into this right away.",
            time: "10:25 AM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Thank you. It's the Visa ending in 4092. I just tried it again 5 minutes ago and got the same error.",
            time: "10:26 AM",
          },
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 10:24 AM",
        draft:
          "Thanks for sending that over on WhatsApp. I’ve cleared the payment security flag, so please try the upgrade once more and let me know what you see.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "Hey team, my upgrade still isn't going through. I tried again from my phone and it failed immediately.",
            time: "10:24 AM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "I’ve got your account open now. Give me a moment to review the latest payment attempt.",
            time: "10:25 AM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Appreciate it — I need the Pro features enabled before my meeting starts.",
            time: "10:27 AM",
            sentiment: "frustrated",
          },
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 10:24 AM",
        draft:
          "Hi Alex — I found the billing mismatch that caused the failed upgrade attempts. I’ve removed the security hold, so please try again when convenient and reply if you still see an error.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "Subject: Upgrade payment failing\n\nHi team, I’m trying to move to the Pro plan and the payment form keeps rejecting my card even though the card is valid.",
            time: "10:24 AM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "Hi Alex, thanks for the details. I’m checking the payment logs and fraud rules tied to your most recent attempt now.",
            time: "10:25 AM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Thanks. I retried just before sending this and got the same billing mismatch message.",
            time: "10:28 AM",
            sentiment: "frustrated",
          },
        ],
      },
    },
    customerSnapshot: [
      "5-year Premier customer with $1.2M+ in AUM",
      "Business Banking client managing cash flow across 3 accounts",
      "1 prior dispute; security-conscious with billing verification",
      "Technologically literate, proactive problem-solver",
      "Time-sensitive — often needs quick resolutions for client meetings",
    ],
  },
  {
    id: "sarah",
    initials: "SM",
    name: "Sarah Miller",
    customerId: "CST-10591",
    lastUpdated: "02/24/26 | 09:18 AM",
    profile: {
      department: "Personal Investing",
      tenureYears: 6,
      totalAUM: "$892,150.00",
      financialReadiness: 84,
      financialAdvisor: "Priya Shah",
      advisorTitle: "Wealth Management Advisor",
      tags: ["Premier", "IVR Auth", "Voice Biometrics"],
      fraudRiskScore: 18,
      priorDisputeCount: 0,
      cardBlocked: false,
    },
    conversationTopics: [
      "Review portfolio rebalancing options",
      "Discuss tax-loss harvesting strategy",
      "Schedule quarterly advisor review",
    ],
    contact: {
      email: "sarah.miller@harborbridge.com",
      phone: "(206) 555-0184",
      address: { street: "881 Pine St", city: "Seattle", state: "WA", zip: "98101", country: "US" },
    },
    accounts: [
      { id: "sm-chk", type: "Checking",   number: "****7104", balance: "$12,430.00",    availableBalance: "$12,430.00", status: "active", openedDate: "Apr 2020" },
      { id: "sm-sav", type: "Savings",    number: "****5521", balance: "$45,000.00",    status: "active", openedDate: "Apr 2020" },
      { id: "sm-inv", type: "Investment", number: "****0038", balance: "$834,720.00",   status: "active", openedDate: "Aug 2020" },
    ],
    overview: {
      contactNumber: "(206) 555-0184",
      assignedAgent: "Priya Shah",
      pronoun: "she",
      lastContactTime: "Today, 9:23 AM",
      address: "881 Pine St, Seattle, WA 98101",
    },
    interactionTimeline: [
      {
        id: "sarah-delay-posted",
        title: "Inbound delay recorded",
        timestamp: "Today · 9:16 AM",
        detail: "Operations posted a late-arriving inbound segment that put Sarah’s Seattle connection at risk.",
        tone: "warning",
        sortOrder: 1,
      },
      {
        id: "sarah-chat-open",
        title: "Customer requested rebooking help",
        timestamp: "Today · 9:18 AM",
        detail: "Sarah opened support after missing her connection and asked for a same-day replacement flight.",
        tone: "default",
        sortOrder: 2,
      },
      {
        id: "sarah-agent-review",
        title: "Agent reviewed standby options",
        timestamp: "Today · 9:19 AM",
        detail: "Priya began checking confirmed-seat and standby inventory for flights that would still arrive before the event.",
        tone: "info",
        sortOrder: 3,
      },
      {
        id: "sarah-bag-transfer",
        title: "Bag transfer constraint added",
        timestamp: "Today · 9:22 AM",
        detail: "The case was updated to prioritize itineraries that could transfer Sarah’s checked bag without manual reclaim.",
        tone: "default",
        sortOrder: 4,
      },
      {
        id: "sarah-waiver-check",
        title: "Fee waiver requested",
        timestamp: "Today · 9:23 AM",
        detail: "Support requested a change-fee waiver because the missed connection followed an airline-caused delay.",
        tone: "info",
        sortOrder: 5,
      },
      {
        id: "sarah-final-seat-hold",
        title: "Replacement seat held",
        timestamp: "Today · 9:24 AM",
        detail: "A same-day Seattle seat was temporarily held while pricing and bag transfer eligibility were confirmed.",
        tone: "critical",
        sortOrder: 6,
      },
    ],
    customerHistory: [
      {
        id: "sarah-h1",
        title: "Flight rebooking support",
        timestamp: "Today · 9:18 AM",
        detail: "Sarah missed her connection due to an airline delay and contacted support for a same-day rebooking to Seattle.",
        dot: "orange",
      },
      {
        id: "sarah-h2",
        title: "Quarterly advisor review completed",
        timestamp: "Mar 14, 2026 · 11:00 AM",
        detail: "Annual review meeting completed with Priya Shah. Portfolio allocation adjusted to increase bond exposure.",
        dot: "purple",
      },
      {
        id: "sarah-h3",
        title: "Tax-loss harvesting strategy implemented",
        timestamp: "Jan 8, 2026 · 2:30 PM",
        detail: "Priya initiated a tax-loss harvesting position on three underperforming holdings totaling $62,000.",
        dot: "green",
      },
      {
        id: "sarah-h4",
        title: "IRA contribution maxed for the year",
        timestamp: "Sep 25, 2025 · 10:15 AM",
        detail: "Sarah completed her annual IRA contribution of $7,000, reaching the federal limit for the 2025 tax year.",
        dot: "purple",
      },
      {
        id: "sarah-h5",
        title: "Referral bonus credited",
        timestamp: "May 3, 2025 · 3:45 PM",
        detail: "$500 referral credit applied after a referred contact opened an investing account and met the deposit threshold.",
        dot: "green",
      },
      {
        id: "sarah-h6",
        title: "Account opened",
        timestamp: "Mar 1, 2020 · 9:00 AM",
        detail: "Personal Investing account opened. Initial deposit of $120,000 transferred from an external brokerage.",
        dot: "gray",
      },
    ],
    queue: {
      time: "2m ago",
      preview: "Missed flight and needs a same-day rebooking.",
      priority: "High",
      priorityClassName: "border-[#FFB800] bg-[#FFF6E0] text-[#A37A00]",
      badgeColor: "bg-[#FFB800]",
      icon: "phone",
      isActive: false,
      createdAt: "2026-03-11T09:02:00",
      updatedAt: "2026-03-11T10:22:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 9:18 AM",
        draft:
          "I can see the missed segment and the available replacement options. I’m holding the earliest same-day route now while I confirm the fare difference.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "Hi, my first flight was delayed and I missed the connection. The kiosk is telling me to call support to get rebooked.",
            time: "9:18 AM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "I’m sorry you were caught in that connection delay. I’m checking the available replacement flights now.",
            time: "9:19 AM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Thank you. I need to get to Seattle today because I’m speaking at an event tonight.",
            time: "9:20 AM",
            sentiment: "frustrated",
          },
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 9:18 AM",
        draft:
          "I found a same-day replacement flight leaving this afternoon. I’m checking whether I can waive the change fee because the missed connection was delay-related.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "My connection was missed after your delay and I still do not have a new seat. Can you help over text?",
            time: "9:18 AM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "Yes — I’ve pulled up your reservation and I’m reviewing the same-day options now.",
            time: "9:19 AM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "I just need to make sure I arrive before 6 PM, even if I have to connect one more time.",
            time: "9:21 AM",
          },
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 9:18 AM",
        draft:
          "I’m seeing two same-day flights with open seats. I’ll confirm which one gets you in earliest and message you the boarding details here.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "Hello, I’m at the gate and the agents are overwhelmed. Can you help me switch to the next available flight?",
            time: "9:18 AM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "Absolutely. I’m checking the real-time standby and confirmed-seat options for you now.",
            time: "9:19 AM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Please prioritize the option with checked bag transfer if possible.",
            time: "9:22 AM",
          },
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 9:18 AM",
        draft:
          "Hi Sarah — I found two same-day rebooking options and I’m verifying whether the change can be processed without additional cost because the missed segment followed an airline delay.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "Subject: Missed connection due to delay\n\nHi support, my incoming flight landed late and I missed the Seattle connection. The app still shows my original itinerary and I need a replacement today.",
            time: "9:18 AM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "Hi Sarah, thanks for the details. I’m reviewing the disrupted itinerary and the replacement inventory now.",
            time: "9:19 AM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Thanks. Please let me know if there is anything I need to approve quickly from my side.",
            time: "9:23 AM",
          },
        ],
      },
    },
    customerSnapshot: [
      "6-year Premier client with $892K investment portfolio",
      "Sophisticated investor interested in tax optimization strategies",
      "Zero prior disputes — excellent account standing",
      "High financial literacy with strong advisor relationship",
      "Uses voice biometrics; values privacy and quick service",
    ],
  },
  {
    id: "emily",
    initials: "EC",
    name: "Emily Chen",
    customerId: "CST-10814",
    lastUpdated: "02/25/26 | 11:47 AM",
    profile: {
      department: "Retail Banking",
      tenureYears: 3,
      totalAUM: "$345,600.00",
      financialReadiness: 71,
      financialAdvisor: "Marcus Lee",
      advisorTitle: "Retail Banking Advisor",
      tags: ["IVR Auth"],
      fraudRiskScore: 22,
      priorDisputeCount: 0,
      cardBlocked: false,
    },
    conversationTopics: [
      "Resolve ATM deposit discrepancy",
      "Request fee waiver for overdraft",
      "Update contact information on file",
    ],
    contact: {
      email: "emily.chen@apexfinancial.com",
      phone: "(646) 555-0117",
      address: { street: "117 Orchard St", city: "New York", state: "NY", zip: "10002", country: "US" },
    },
    accounts: [
      { id: "ec-chk", type: "Checking", number: "****3317", balance: "$5,840.00",  availableBalance: "$5,840.00", status: "active", openedDate: "Feb 2023" },
      { id: "ec-sav", type: "Savings",  number: "****8841", balance: "$18,000.00", status: "active", openedDate: "Feb 2023" },
      { id: "ec-crd", type: "Credit",   number: "****7722", balance: "-$2,340.00", availableBalance: "$7,660.00", status: "active", openedDate: "Jun 2023" },
    ],
    overview: {
      contactNumber: "(646) 555-0117",
      assignedAgent: "Marcus Lee",
      pronoun: "she",
      lastContactTime: "Today, 11:51 AM",
      address: "117 Orchard St, New York, NY 10002",
    },
    interactionTimeline: [
      {
        id: "emily-campaign-live",
        title: "Launch-week campaign activated",
        timestamp: "Today · 11:45 AM",
        detail: "The promotion banner went live for Emily’s segment with item-level eligibility rules applied at checkout.",
        tone: "info",
        sortOrder: 1,
      },
      {
        id: "emily-customer-report",
        title: "Customer reported invalid promo code",
        timestamp: "Today · 11:47 AM",
        detail: "Emily reported that the advertised discount code was failing even though her cart matched the campaign email.",
        tone: "default",
        sortOrder: 2,
      },
      {
        id: "emily-agent-audit",
        title: "Agent audited promotion rules",
        timestamp: "Today · 11:48 AM",
        detail: "Marcus started reviewing the banner campaign, cart restrictions, and checkout validation logs.",
        tone: "info",
        sortOrder: 3,
      },
      {
        id: "emily-validation-failure",
        title: "Checkout validation mismatch found",
        timestamp: "Today · 11:49 AM",
        detail: "One item in the cart was incorrectly excluded by a promotion rule, causing the entire discount to fail.",
        tone: "warning",
        sortOrder: 4,
      },
      {
        id: "emily-cart-preserved",
        title: "Cart preservation requested",
        timestamp: "Today · 11:50 AM",
        detail: "The customer record was updated to keep Emily’s configured cart intact while the promotion issue was corrected.",
        tone: "default",
        sortOrder: 5,
      },
      {
        id: "emily-code-reissue",
        title: "Corrected promo path prepared",
        timestamp: "Today · 11:51 AM",
        detail: "Support prepared a corrected validation path so Emily could retry checkout without rebuilding the order.",
        tone: "critical",
        sortOrder: 6,
      },
    ],
    queue: {
      time: "5m ago",
      preview: "Discount code is failing during checkout.",
      priority: "Medium",
      priorityClassName: "border-[#BFDBFE] bg-[#EBF4FD] text-[#166CCA]",
      badgeColor: "bg-[#166CCA]",
      icon: "clipboardList",
      isActive: false,
      createdAt: "2026-03-11T08:55:00",
      updatedAt: "2026-03-11T10:19:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 11:47 AM",
        draft:
          "I found the promotion rule that is blocking your discount code. I’m testing a corrected checkout session now so you can try it again immediately.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "Hi, the launch-week discount code keeps failing at checkout even though the banner says it is still valid.",
            time: "11:47 AM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "Thanks for reporting that. I’m reviewing the promotion setup and the checkout logs now.",
            time: "11:48 AM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "It says the code does not apply to my cart, but I only have the items listed in the campaign email.",
            time: "11:49 AM",
            sentiment: "frustrated",
          },
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 11:47 AM",
        draft:
          "I can see the promo validation failing on one item in your cart. I’m removing the bad restriction so you can retry the code in a moment.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "Can someone help? My discount code keeps getting rejected and checkout is about to expire.",
            time: "11:47 AM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "Yes — I’m checking the promotion rules now so we can get your order through.",
            time: "11:48 AM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "I tried it on desktop and mobile and got the same invalid-code message both times.",
            time: "11:49 AM",
          },
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 11:47 AM",
        draft:
          "Thanks for sending the cart screenshot. I can see the promo rule mismatch and I’m correcting it now so you can retry without rebuilding the cart.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "I sent a screenshot — the code is shown in the banner but the cart keeps rejecting it.",
            time: "11:47 AM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "Got it. I’m comparing the banner campaign and the checkout restrictions now.",
            time: "11:48 AM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Please keep this cart intact if possible. It took me a while to configure everything.",
            time: "11:50 AM",
          },
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 11:47 AM",
        draft:
          "Hi Emily — I found the promotion mismatch causing the code to fail. I’m updating the rule set and will let you know as soon as it is safe to retry checkout.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "Subject: Discount code not applying\n\nHello, I received a promo email this morning, but the code listed there is not applying during checkout for the advertised items.",
            time: "11:47 AM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "Hi Emily, thanks for sending the details. I’m reviewing the campaign configuration and item eligibility now.",
            time: "11:48 AM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Thank you. Please let me know if there is a corrected code I should use instead.",
            time: "11:51 AM",
          },
        ],
      },
    },
    customerHistory: [
      { id: "emily-h1", title: "Account opened — Retail Banking", timestamp: "Mar 2023", detail: "Emily opened a Retail Banking account with an initial deposit of $12,000. IVR authentication enrolled on first login.", dot: "green" },
      { id: "emily-h2", title: "ATM deposit discrepancy reported", timestamp: "Jun 2023", detail: "Emily reported a $200 ATM deposit that did not post correctly. Case escalated to branch ops and resolved within 48 hours.", dot: "orange" },
      { id: "emily-h3", title: "Overdraft fee waiver granted", timestamp: "Nov 2023", detail: "First-time overdraft of $34 reversed as a goodwill gesture. Emily updated her low-balance alert threshold to $100.", dot: "purple" },
      { id: "emily-h4", title: "Contact information updated", timestamp: "Feb 2024", detail: "Emily updated her mailing address and mobile number following a move to New York. Identity verified via IVR.", dot: "gray" },
      { id: "emily-h5", title: "Promotion code issue — checkout blocked", timestamp: "Jan 2025", detail: "A campaign validation rule incorrectly excluded one item in Emily's cart, causing the promo code to fail. Rule corrected by support.", dot: "orange" },
      { id: "emily-h6", title: "Advisor relationship — Marcus Lee assigned", timestamp: "Mar 2026", detail: "Emily was paired with Marcus Lee as her dedicated Retail Banking Advisor following the bank's advisory tier restructure.", dot: "purple" },
    ],
    customerSnapshot: [
      "2-year customer with modest personal checking account",
      "Occasional user with straightforward banking needs",
      "No prior disputes; low fraud risk profile",
      "Prefers email communication; rarely escalates issues",
      "Stable account history with consistent deposits",
    ],
  },
  {
    id: "david",
    initials: "DB",
    name: "David Brown",
    customerId: "CST-10363",
    lastUpdated: "02/26/26 | 03:06 PM",
    profile: {
      department: "Business Banking",
      tenureYears: 11,
      totalAUM: "$3,187,900.00",
      financialReadiness: 88,
      financialAdvisor: "Alex Bogush",
      advisorTitle: "High Net Worth Advisor",
      tags: ["Premier", "IVR Auth", "Voice Biometrics"],
      fraudRiskScore: 47,
      priorDisputeCount: 1,
      cardBlocked: false,
    },
    conversationTopics: [
      "Review commercial line of credit terms",
      "Discuss business expansion financing",
      "Escalate to a senior relationship manager",
    ],
    contact: {
      email: "david.brown@crescentmedia.com",
      phone: "(312) 555-0146",
      address: { street: "410 W Lake St", city: "Chicago", state: "IL", zip: "60606", country: "US" },
    },
    accounts: [
      { id: "db-chk", type: "Business",   number: "****9912", balance: "$280,000.00",   availableBalance: "$280,000.00", status: "active", openedDate: "Mar 2015" },
      { id: "db-sav", type: "Savings",    number: "****4470", balance: "$540,000.00",   status: "active", openedDate: "Mar 2015" },
      { id: "db-inv", type: "Investment", number: "****0028", balance: "$2,367,900.00", status: "active", openedDate: "Nov 2015" },
    ],
    overview: {
      contactNumber: "(312) 555-0146",
      assignedAgent: "Alex Bogush",
      pronoun: "he",
      lastContactTime: "Today, 3:10 PM",
      address: "410 W Lake St, Chicago, IL 60606",
    },
    interactionTimeline: [
      {
        id: "david-plan-change",
        title: "Plan change initiated",
        timestamp: "Today · 3:05 PM",
        detail: "David started a subscription update that created two closely timed authorization attempts on the same card.",
        tone: "default",
        sortOrder: 1,
      },
      {
        id: "david-duplicate-hold",
        title: "Duplicate authorization detected",
        timestamp: "Today · 3:06 PM",
        detail: "Billing systems flagged a second pending hold while the first authorization was still unresolved.",
        tone: "warning",
        sortOrder: 2,
      },
      {
        id: "david-agent-audit",
        title: "Agent reviewed payment audit trail",
        timestamp: "Today · 3:07 PM",
        detail: "Alex began checking the subscription ledger and card authorization history to confirm whether a duplicate capture occurred.",
        tone: "info",
        sortOrder: 3,
      },
      {
        id: "david-customer-risk",
        title: "Customer paused retry",
        timestamp: "Today · 3:08 PM",
        detail: "David held off on another submission because he needed the new plan active without creating a second billable charge.",
        tone: "critical",
        sortOrder: 4,
      },
      {
        id: "david-reversal-request",
        title: "Reversal request submitted",
        timestamp: "Today · 3:09 PM",
        detail: "Support initiated reversal handling for the extra authorization hold before advising the customer to retry.",
        tone: "info",
        sortOrder: 5,
      },
      {
        id: "david-screenshot-offer",
        title: "Customer offered banking proof",
        timestamp: "Today · 3:10 PM",
        detail: "David offered to send a screenshot from his banking app to help confirm the duplicate pending charge.",
        tone: "default",
        sortOrder: 6,
      },
    ],
    queue: {
      time: "24m ago",
      preview: "Subscription change and duplicate-charge concern.",
      priority: "Low",
      priorityClassName: "border-[#24943E] bg-[#EFFBF1] text-[#208337]",
      badgeColor: "bg-[#208337]",
      icon: "messageSquare",
      isActive: false,
      createdAt: "2026-03-11T07:40:00",
      updatedAt: "2026-03-11T10:00:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 3:06 PM",
        draft:
          "I found the duplicate authorization and I’m clearing it now. Once it drops, I’ll help you retry the subscription change without risking a second charge.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "I’m trying to switch plans, but I think the system tried to charge me twice and now I’m afraid to submit again.",
            time: "3:06 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "I understand the concern. I’m reviewing the payment authorizations and the subscription audit trail now.",
            time: "3:07 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Thanks. I do need the new plan active today, but I do not want two charges pending on the card.",
            time: "3:08 PM",
            sentiment: "frustrated",
          },
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 3:06 PM",
        draft:
          "I can confirm one of the attempts is still only an authorization hold. I’m clearing the duplicate and then I’ll tell you the safest time to retry.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "Can you verify whether I got charged twice? I was trying to switch my subscription and the second attempt looked stuck.",
            time: "3:06 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "Yes — I’m checking the payment statuses and the subscription update attempts now.",
            time: "3:07 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Okay, thank you. I can retry once you confirm the extra hold is gone.",
            time: "3:08 PM",
          },
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 3:06 PM",
        draft:
          "I’ve isolated the duplicate authorization and I’m escalating the reversal. I’ll stay with you here and let you know when it is safe to complete the plan change.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "Hi, I changed plans from my phone and now I’m seeing two pending charges in my banking app.",
            time: "3:06 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "Thanks for the heads-up. I’m reviewing both payment attempts and the subscription events now.",
            time: "3:07 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Please let me know whether I should retry here or wait until the extra pending charge disappears.",
            time: "3:09 PM",
          },
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 3:06 PM",
        draft:
          "Hi David — I confirmed that one of the two charges is still a temporary authorization rather than a completed capture. I’m clearing the duplicate attempt and will reply once it is safe to retry the subscription change.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "Subject: Possible duplicate charge after plan change\n\nHello, I was updating my subscription and now I’m seeing two pending card charges. I need the new plan active today but I don’t want to be billed twice.",
            time: "3:06 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "Hi David, thanks for reporting it. I’m reviewing the payment captures and authorization holds tied to your account now.",
            time: "3:07 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Thanks. If you need a screenshot from my banking app, I can send that over.",
            time: "3:10 PM",
          },
        ],
      },
    },
    customerHistory: [
      { id: "david-h1", title: "Business Banking account opened", timestamp: "Jan 2015", detail: "David opened a Business Banking account with an initial wire transfer of $500,000. Premier tier and Voice Biometrics enrolled.", dot: "green" },
      { id: "david-h2", title: "Commercial line of credit — first draw", timestamp: "Apr 2017", detail: "David drew $250,000 against a $1M commercial credit line to fund a supply chain expansion. Repaid within 14 months.", dot: "purple" },
      { id: "david-h3", title: "Dispute filed — vendor double-charge", timestamp: "Sep 2020", detail: "A $4,800 duplicate charge from a supplier was disputed. Merchant confirmed the error and a full reversal was posted.", dot: "orange" },
      { id: "david-h4", title: "Plan upgrade — subscription change attempt", timestamp: "Feb 2025", detail: "David attempted a subscription tier upgrade but the system generated a duplicate authorization hold. Agent cleared the hold and completed the upgrade.", dot: "orange" },
      { id: "david-h5", title: "High Net Worth Advisor assigned — Alex Bogush", timestamp: "Jul 2025", detail: "Following portfolio growth past $3M AUM, David was assigned to Alex Bogush for dedicated high net worth advisory services.", dot: "purple" },
      { id: "david-h6", title: "Annual account review completed", timestamp: "Feb 2026", detail: "Year-end review confirmed all credit facilities in good standing and AUM at $3.19M. No flags or compliance issues noted.", dot: "green" },
    ],
    customerSnapshot: [
      "3-year personal banking customer on standard plan",
      "Dual accounts (checking + savings); typical monthly activity",
      "1 prior dispute resolved amicably",
      "Moderate tech comfort; prefers phone support",
      "Consistent payer; no risk indicators",
    ],
  },
  {
    id: "priya",
    initials: "PN",
    name: "Priya Nair",
    customerId: "CST-11024",
    lastUpdated: "02/27/26 | 08:41 AM",
    profile: {
      department: "Personal Investing",
      tenureYears: 4,
      totalAUM: "$628,400.00",
      financialReadiness: 91,
      financialAdvisor: "Jeff Comstock",
      advisorTitle: "Wealth Management Advisor",
      tags: ["Premier", "Voice Biometrics"],
      fraudRiskScore: 12,
      priorDisputeCount: 0,
      cardBlocked: false,
    },
    conversationTopics: [
      "Discuss Roth IRA conversion strategy",
      "Review beneficiary designations",
      "Schedule annual financial plan review",
    ],
    contact: {
      email: "priya.nair@nakamurawg.com",
      phone: "(512) 555-0172",
      address: { street: "1812 Nueces St", city: "Austin", state: "TX", zip: "78701", country: "US" },
    },
    accounts: [
      { id: "pn-chk", type: "Checking",   number: "****6614", balance: "$8,920.00",   availableBalance: "$8,920.00", status: "active", openedDate: "Sep 2022" },
      { id: "pn-sav", type: "Savings",    number: "****3302", balance: "$42,500.00",  status: "active", openedDate: "Sep 2022" },
      { id: "pn-inv", type: "Investment", number: "****8810", balance: "$577,000.00", status: "active", openedDate: "Jan 2023" },
    ],
    overview: {
      contactNumber: "(512) 555-0172",
      assignedAgent: "Jeff Comstock",
      pronoun: "she",
      lastContactTime: "Today, 8:44 AM",
      address: "1812 Nueces St, Austin, TX 78701",
    },
    interactionTimeline: [
      {
        id: "priya-lockout-detected",
        title: "Repeated login failures detected",
        timestamp: "Today · 8:39 AM",
        detail: "Security systems detected repeated failed login attempts before Priya’s account was temporarily locked.",
        tone: "warning",
        sortOrder: 1,
      },
      {
        id: "priya-customer-chat",
        title: "Customer requested access recovery",
        timestamp: "Today · 8:40 AM",
        detail: "Priya opened a support thread because she could not access her dashboard ahead of the morning reporting cutoff.",
        tone: "default",
        sortOrder: 2,
      },
      {
        id: "priya-identity-check",
        title: "Identity verification started",
        timestamp: "Today · 8:41 AM",
        detail: "Jordan started identity verification and reviewed recent device history before clearing the lockout.",
        tone: "info",
        sortOrder: 3,
      },
      {
        id: "priya-device-risk",
        title: "New-device sign-in flagged",
        timestamp: "Today · 8:42 AM",
        detail: "The login attempt was tied to a new laptop, which triggered a manual review requirement before access could be restored.",
        tone: "critical",
        sortOrder: 4,
      },
      {
        id: "priya-reset-link",
        title: "Password reset link prepared",
        timestamp: "Today · 8:43 AM",
        detail: "Support prepared a fresh password reset path with extended validity so Priya could complete recovery without starting over.",
        tone: "info",
        sortOrder: 5,
      },
      {
        id: "priya-session-restore",
        title: "Session restoration pending",
        timestamp: "Today · 8:44 AM",
        detail: "The case was updated to restore dashboard access as soon as Priya completed the verification prompt.",
        tone: "default",
        sortOrder: 6,
      },
    ],
    customerHistory: [
      {
        id: "priya-h1",
        title: "Account lockout — login support",
        timestamp: "Today · 8:40 AM",
        detail: "Priya was locked out after repeated failed login attempts from a new device. Identity verification initiated.",
        dot: "orange",
      },
      {
        id: "priya-h2",
        title: "Annual financial plan review",
        timestamp: "Feb 21, 2026 · 10:00 AM",
        detail: "Completed annual plan review with Jeff Comstock. Roth IRA conversion strategy flagged for follow-up in Q2.",
        dot: "purple",
      },
      {
        id: "priya-h3",
        title: "Beneficiary designations updated",
        timestamp: "Nov 10, 2025 · 1:15 PM",
        detail: "Priya updated primary and contingent beneficiary designations across her IRA and brokerage accounts.",
        dot: "gray",
      },
      {
        id: "priya-h4",
        title: "401k rollover processed",
        timestamp: "Jun 3, 2025 · 11:30 AM",
        detail: "Direct rollover of $148,000 from a prior employer 401k completed into Priya's traditional IRA.",
        dot: "green",
      },
      {
        id: "priya-h5",
        title: "Financial wellness assessment completed",
        timestamp: "Apr 14, 2024 · 2:00 PM",
        detail: "Priya completed the platform's financial wellness assessment, scoring 91/100. Personalized recommendations issued.",
        dot: "purple",
      },
      {
        id: "priya-h6",
        title: "Account opened",
        timestamp: "Jan 15, 2022 · 9:00 AM",
        detail: "Personal Investing account opened. Initial deposit of $50,000 transferred from an external savings account.",
        dot: "gray",
      },
    ],
    queue: {
      time: "1m ago",
      preview: "Locked out after failed sign-in attempts.",
      priority: "Critical",
      priorityClassName: "border-[#E53935] bg-[#FDEAEA] text-[#C71D1A]",
      badgeColor: "bg-[#E32926]",
      icon: "phone",
      isActive: false,
      createdAt: "2026-03-11T08:15:00",
      updatedAt: "2026-03-11T08:44:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 8:40 AM",
        draft:
          "I can see the temporary account lock on your profile. I’m validating the sign-in attempt now so I can safely restore access.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "Hi, I’m locked out of my account and I need to pull this morning’s report before my team meeting starts.",
            time: "8:40 AM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "I’m reviewing the security lock now and I’ll walk you through the fastest path to regain access.",
            time: "8:41 AM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Thank you. I tried resetting it twice, but I still get kicked back to the lock screen.",
            time: "8:42 AM",
            sentiment: "frustrated",
          },
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 8:40 AM",
        draft:
          "I found the lockout trigger and I’m clearing it after one quick identity check. I’ll text the reset instructions as soon as it’s ready.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "Can you help me unlock my account? I keep getting blocked after I enter my password.",
            time: "8:40 AM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "Yes — I’m looking at the sign-in history now and I’ll confirm the safest next step.",
            time: "8:41 AM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "I’m on a new laptop today, so that may be why it suddenly flagged me.",
            time: "8:43 AM",
          },
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 8:40 AM",
        draft:
          "Thanks for confirming the new device. I’m clearing the review hold now so you can finish the reset from that laptop.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "Hey, I’m fully locked out and support in the portal won’t load because I can’t get past sign-in.",
            time: "8:40 AM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "I’ve got your account open. I’m checking whether the lock was triggered by a password issue or a device flag.",
            time: "8:41 AM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Please keep this moving fast if possible — the dashboard is how I brief leadership every morning.",
            time: "8:44 AM",
          },
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 8:40 AM",
        draft:
          "Hi Priya — I confirmed that the temporary lock was triggered by a new-device check rather than a permanent credential problem. I’m preparing a fresh recovery link now.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "Subject: Urgent account lockout\n\nHello, I’m unable to access my account this morning and need help restoring access as soon as possible.",
            time: "8:40 AM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "Hi Priya, thanks for contacting us. I’m checking the sign-in security events attached to your profile now.",
            time: "8:41 AM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Thanks. If you need me to verify the new device or location, I can do that immediately.",
            time: "8:44 AM",
          },
        ],
      },
    },
    customerSnapshot: [
      "4-year Premier customer with $650K in managed wealth",
      "Wealth Management client seeking portfolio diversification",
      "Zero disputes; strong credit standing",
      "High financial readiness; actively engaged with advisor",
      "Interested in long-term planning and tax strategies",
    ],
  },
  {
    id: "miguel",
    initials: "MS",
    name: "Miguel Santos",
    customerId: "CST-11137",
    lastUpdated: "02/27/26 | 12:12 PM",
    profile: {
      department: "Retail Banking",
      tenureYears: 2,
      totalAUM: "$187,300.00",
      financialReadiness: 63,
      financialAdvisor: "Marcus Lee",
      advisorTitle: "Retail Banking Advisor",
      tags: ["IVR Auth"],
      fraudRiskScore: 81,
      priorDisputeCount: 2,
      cardBlocked: true,
    },
    conversationTopics: [
      "Dispute a fraudulent Costco charge",
      "Escalate to a supervisor",
      "Document the information around it",
    ],
    contact: {
      email: "miguel.santos@dupont-fs.com",
      phone: "(305) 555-0143",
      address: { street: "922 Biscayne Blvd", city: "Miami", state: "FL", zip: "33132", country: "US" },
    },
    accounts: [
      { id: "ms-chk", type: "Checking", number: "****2241", balance: "$3,180.00",  availableBalance: "$3,180.00", status: "active", openedDate: "Jul 2024" },
      { id: "ms-sav", type: "Savings",  number: "****6605", balance: "$14,700.00", status: "active", openedDate: "Jul 2024" },
      { id: "ms-crd", type: "Credit",   number: "****4423", balance: "-$1,840.00", availableBalance: "$8,160.00", status: "active", openedDate: "Oct 2024" },
    ],
    overview: {
      contactNumber: "(305) 555-0143",
      assignedAgent: "Marcus Lee",
      pronoun: "he",
      lastContactTime: "Today, 12:14 PM",
      address: "922 Biscayne Blvd, Miami, FL 33132",
    },
    interactionTimeline: [
      {
        id: "miguel-refund-opened",
        title: "Refund case opened",
        timestamp: "Today · 12:09 PM",
        detail: "Miguel opened a billing case after seeing a completed charge for an order that was canceled minutes later.",
        tone: "default",
        sortOrder: 1,
      },
      {
        id: "miguel-ledger-check",
        title: "Payment ledger review started",
        timestamp: "Today · 12:10 PM",
        detail: "Marcus began tracing the order cancellation event against the refund queue and settlement timeline.",
        tone: "info",
        sortOrder: 2,
      },
      {
        id: "miguel-bank-delay",
        title: "Settlement delay identified",
        timestamp: "Today · 12:11 PM",
        detail: "The refund could not post immediately because the original charge had already moved into settlement.",
        tone: "warning",
        sortOrder: 3,
      },
      {
        id: "miguel-escalation",
        title: "Finance escalation submitted",
        timestamp: "Today · 12:12 PM",
        detail: "Support escalated the refund request to finance so the reversal could be prioritized before end-of-day batch processing.",
        tone: "critical",
        sortOrder: 4,
      },
      {
        id: "miguel-receipt-note",
        title: "Receipt evidence attached",
        timestamp: "Today · 12:13 PM",
        detail: "The customer attached the cancellation receipt and the posted card charge to help confirm the discrepancy.",
        tone: "info",
        sortOrder: 5,
      },
      {
        id: "miguel-followup-window",
        title: "Refund window communicated",
        timestamp: "Today · 12:14 PM",
        detail: "The case was updated with an expected refund window and a promise of proactive follow-up once the reversal was accepted.",
        tone: "default",
        sortOrder: 6,
      },
    ],
    queue: {
      time: "3m ago",
      preview: "Canceled order still posted a completed charge.",
      priority: "High",
      priorityClassName: "border-[#FFB800] bg-[#FFF6E0] text-[#A37A00]",
      badgeColor: "bg-[#166CCA]",
      icon: "clipboardList",
      isActive: false,
      createdAt: "2026-03-11T11:55:00",
      updatedAt: "2026-03-11T12:14:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 12:10 PM",
        draft:
          "I confirmed the cancellation on your order and I’m escalating the posted charge now so the refund can move faster.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "Hi, I canceled the order almost immediately, but the charge still went through on my card.",
            time: "12:10 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "I’m reviewing the order and payment timeline now so I can confirm whether the refund has already been queued.",
            time: "12:11 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "I need help quickly because it was a large charge and I cannot leave it hanging for several days.",
            time: "12:12 PM",
            sentiment: "frustrated",
          },
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 12:10 PM",
        draft:
          "I can see the cancellation and the posted payment. I’m pushing the refund request to finance so you do not have to wait on the normal queue.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "The order was canceled, but my bank still shows the full charge. Can someone fix this?",
            time: "12:10 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "Yes — I’m checking whether it is still pending or whether it has already settled.",
            time: "12:11 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "It looks completed on my side, not just pending.",
            time: "12:13 PM",
          },
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 12:10 PM",
        draft:
          "Thanks for sending the receipt. I matched it to the canceled order and I’m moving the refund through manual review now.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "I sent screenshots from my bank app and the canceled order email. Please tell me what else you need.",
            time: "12:10 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "That helps a lot. I’m cross-checking both records against the refund queue right now.",
            time: "12:11 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "If there’s a way to speed it up, I’d really appreciate it.",
            time: "12:14 PM",
          },
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 12:10 PM",
        draft:
          "Hi Miguel — I verified that the order was canceled, but the charge had already entered settlement. I’ve escalated the refund so it can be reversed as quickly as possible.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "Subject: Charge posted after cancellation\n\nHello, I canceled my order, but the payment still completed on my credit card. Please advise on next steps.",
            time: "12:10 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "Hi Miguel, I’m reviewing the payment settlement status and the cancellation record now.",
            time: "12:11 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Thank you. Please let me know if you need the cancellation confirmation forwarded again.",
            time: "12:14 PM",
          },
        ],
      },
    },
    customerHistory: [
      { id: "miguel-h1", title: "Account opened — Retail Banking", timestamp: "Apr 2024", detail: "Miguel opened a Retail Banking account and enrolled in IVR authentication. Initial deposit of $8,500.", dot: "green" },
      { id: "miguel-h2", title: "First chargeback filed — subscription service", timestamp: "Aug 2024", detail: "Miguel disputed a $29.99 charge from a streaming service he had cancelled. Chargeback approved and credit posted.", dot: "orange" },
      { id: "miguel-h3", title: "Second dispute — gym membership", timestamp: "Nov 2024", detail: "Miguel filed a second chargeback for a gym membership that continued billing after cancellation. Resolved in his favour.", dot: "orange" },
      { id: "miguel-h4", title: "Fraud risk flag raised", timestamp: "Jan 2025", detail: "Two consecutive chargebacks within 90 days triggered an elevated fraud risk score. Account flagged for manual review.", dot: "red" },
      { id: "miguel-h5", title: "Refund dispute — third-party vendor", timestamp: "Feb 2026", detail: "Miguel reported a $149 charge from a vendor he claimed to have no relationship with. Investigation ongoing.", dot: "red" },
      { id: "miguel-h6", title: "Manual review completed — account retained", timestamp: "Mar 2026", detail: "Compliance review confirmed no fraudulent account behaviour. Risk score recalculated and account status maintained.", dot: "gray" },
    ],
    customerSnapshot: [
      "2-year Business Banking customer with active operations",
      "Small business owner managing multiple revenue streams",
      "1 prior dispute related to deposit timing",
      "Growing account balance; upward trajectory",
      "Values hands-on support and clear explanations",
    ],
  },
  {
    id: "olivia",
    initials: "OR",
    name: "Olivia Reed",
    customerId: "CST-11192",
    lastUpdated: "02/27/26 | 01:26 PM",
    profile: {
      department: "Personal Investing",
      tenureYears: 7,
      totalAUM: "$1,956,700.00",
      financialReadiness: 95,
      financialAdvisor: "Priya Shah",
      advisorTitle: "Wealth Management Advisor",
      tags: ["Premier", "IVR Auth", "Voice Biometrics"],
      fraudRiskScore: 29,
      priorDisputeCount: 2,
      cardBlocked: false,
    },
    conversationTopics: [
      "Review estate planning options",
      "Transfer assets to trust account",
      "Confirm power of attorney documentation",
    ],
    contact: {
      email: "olivia.reed@reedcapital.com",
      phone: "(617) 555-0198",
      address: { street: "41 Charles St", city: "Boston", state: "MA", zip: "02114", country: "US" },
    },
    accounts: [
      { id: "or-chk", type: "Checking",   number: "****5518", balance: "$21,000.00",   availableBalance: "$21,000.00", status: "active", openedDate: "Jun 2019" },
      { id: "or-sav", type: "Savings",    number: "****2290", balance: "$95,000.00",   status: "active", openedDate: "Jun 2019" },
      { id: "or-inv", type: "Investment", number: "****8800", balance: "$1,840,700.00",status: "active", openedDate: "Dec 2019" },
    ],
    overview: {
      contactNumber: "(617) 555-0198",
      assignedAgent: "Priya Shah",
      pronoun: "she",
      lastContactTime: "Today, 1:28 PM",
      address: "41 Charles St, Boston, MA 02114",
    },
    interactionTimeline: [
      {
        id: "olivia-shipping-alert",
        title: "Shipment exception posted",
        timestamp: "Today · 1:23 PM",
        detail: "Carrier tracking showed a delivery exception after Olivia’s package reached the local hub.",
        tone: "warning",
        sortOrder: 1,
      },
      {
        id: "olivia-address-check",
        title: "Address verification started",
        timestamp: "Today · 1:24 PM",
        detail: "Support reviewed the final delivery address after the carrier marked the package as undeliverable.",
        tone: "info",
        sortOrder: 2,
      },
      {
        id: "olivia-customer-request",
        title: "Customer requested reroute",
        timestamp: "Today · 1:25 PM",
        detail: "Olivia asked for the package to be rerouted before an event later this week.",
        tone: "default",
        sortOrder: 3,
      },
      {
        id: "olivia-carrier-hold",
        title: "Carrier hold placed",
        timestamp: "Today · 1:26 PM",
        detail: "A temporary hold was placed with the carrier to avoid the package being returned to sender.",
        tone: "critical",
        sortOrder: 4,
      },
      {
        id: "olivia-alt-destination",
        title: "Alternate destination reviewed",
        timestamp: "Today · 1:27 PM",
        detail: "Support reviewed nearby pickup and workplace delivery options to speed up final handoff.",
        tone: "info",
        sortOrder: 5,
      },
      {
        id: "olivia-followup-scheduled",
        title: "Carrier follow-up scheduled",
        timestamp: "Today · 1:28 PM",
        detail: "The case was updated with a follow-up window once the carrier confirmed whether rerouting would be accepted.",
        tone: "default",
        sortOrder: 6,
      },
    ],
    queue: {
      time: "7m ago",
      preview: "Delivery exception needs an address reroute.",
      priority: "Medium",
      priorityClassName: "border-[#BFDBFE] bg-[#EBF4FD] text-[#166CCA]",
      badgeColor: "bg-[#FFB800]",
      icon: "messageSquare",
      isActive: false,
      createdAt: "2026-03-11T13:05:00",
      updatedAt: "2026-03-11T13:28:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 1:24 PM",
        draft:
          "I can see the carrier exception on the shipment. I’m placing a hold now so we can reroute it before it gets returned.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "My package says delivery exception and I need it before Friday. Can someone reroute it?",
            time: "1:24 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "I’m pulling up the carrier event history now and I’ll check what reroute options are available.",
            time: "1:25 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Please stop it from being sent back. I can even pick it up if that’s faster.",
            time: "1:26 PM",
            sentiment: "frustrated",
          },
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 1:24 PM",
        draft:
          "I’ve put a hold on the return path and I’m checking whether the package can be rerouted or held for pickup.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "Tracking says my package couldn’t be delivered. Can you help me redirect it?",
            time: "1:24 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "Yes — I’m contacting the carrier tools now to see whether we can intercept it.",
            time: "1:25 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "A pickup hold would work if home delivery isn’t possible anymore.",
            time: "1:27 PM",
          },
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 1:24 PM",
        draft:
          "Thanks for confirming the alternate address. I’m validating that reroute request with the carrier now.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "I can send a different delivery address if that helps. The current one may be what caused the problem.",
            time: "1:24 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "That may help. I’m checking whether the carrier still allows edits after the local hub scan.",
            time: "1:25 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Thanks — I just really need to keep it from getting bounced back.",
            time: "1:28 PM",
          },
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 1:24 PM",
        draft:
          "Hi Olivia — I confirmed the shipment exception and placed a carrier hold to keep the package from being returned. I’m now checking reroute and pickup options for you.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "Subject: Delivery exception on package\n\nHello, my shipment is showing a delivery exception and I need help rerouting it before it gets sent back.",
            time: "1:24 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "Hi Olivia, I’m reviewing the carrier details and the address validation results now.",
            time: "1:25 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Thank you. Please let me know whether pickup would be the faster option.",
            time: "1:28 PM",
          },
        ],
      },
    },
    customerHistory: [
      { id: "olivia-h1", title: "Personal Investing account opened", timestamp: "Sep 2021", detail: "Olivia opened a Personal Investing account with an initial portfolio transfer of $45,000 from an external brokerage.", dot: "green" },
      { id: "olivia-h2", title: "First trade placed — ETF portfolio", timestamp: "Oct 2021", detail: "Olivia placed her first order, building a diversified ETF portfolio. Financial readiness score assessed at 74.", dot: "purple" },
      { id: "olivia-h3", title: "Address update — relocation", timestamp: "Mar 2023", detail: "Olivia updated her registered address following a move. Identity verified via IVR before changes were saved.", dot: "gray" },
      { id: "olivia-h4", title: "Shipment delay — physical card", timestamp: "Nov 2024", detail: "Replacement debit card reported as delayed in transit. Agent confirmed the shipment was rerouted and redelivered.", dot: "orange" },
      { id: "olivia-h5", title: "Portfolio rebalance — advisor review", timestamp: "Jan 2026", detail: "Olivia's portfolio was reviewed and rebalanced following a risk tolerance reassessment. Equity allocation reduced by 8%.", dot: "purple" },
      { id: "olivia-h6", title: "Shipping issue — order fulfilment", timestamp: "Mar 2026", detail: "Olivia reported a delayed order with an address validation error flagged by the carrier. Support investigating redelivery options.", dot: "orange" },
    ],
    customerSnapshot: [
      "5-year customer with diversified account mix",
      "Manages personal and investment portfolios independently",
      "No prior disputes; excellent payment history",
      "Technically savvy; comfortable with digital-first banking",
      "Prefers self-service tools with live chat backup",
    ],
  },
  {
    id: "jamal",
    initials: "JC",
    name: "Jamal Carter",
    customerId: "CST-11244",
    lastUpdated: "02/27/26 | 02:03 PM",
    profile: {
      department: "Business Banking",
      tenureYears: 9,
      totalAUM: "$2,741,500.00",
      financialReadiness: 82,
      financialAdvisor: "Alex Bogush",
      advisorTitle: "High Net Worth Advisor",
      tags: ["Premier", "Voice Biometrics"],
      fraudRiskScore: 15,
      priorDisputeCount: 0,
      cardBlocked: false,
    },
    conversationTopics: [
      "Resolve wire transfer delay",
      "Set up international payment alerts",
      "Review business credit card limits",
    ],
    contact: {
      email: "jamal.carter@blakeInvestments.com",
      phone: "(404) 555-0121",
      address: { street: "290 Peachtree St NW", city: "Atlanta", state: "GA", zip: "30303", country: "US" },
    },
    accounts: [
      { id: "jc-chk", type: "Business",   number: "****5517", balance: "$145,000.00",   availableBalance: "$145,000.00", status: "active", openedDate: "May 2017" },
      { id: "jc-sav", type: "Savings",    number: "****8831", balance: "$380,000.00",   status: "active", openedDate: "May 2017" },
      { id: "jc-inv", type: "Investment", number: "****2215", balance: "$2,216,500.00", status: "active", openedDate: "Jan 2018" },
    ],
    overview: {
      contactNumber: "(404) 555-0121",
      assignedAgent: "Alex Bogush",
      pronoun: "he",
      lastContactTime: "Today, 2:05 PM",
      address: "290 Peachtree St NW, Atlanta, GA 30303",
    },
    interactionTimeline: [
      {
        id: "jamal-device-sync",
        title: "Device sync failure logged",
        timestamp: "Today · 2:00 PM",
        detail: "A mobile sync failure prevented Jamal’s latest project changes from appearing on desktop.",
        tone: "warning",
        sortOrder: 1,
      },
      {
        id: "jamal-customer-reachout",
        title: "Customer reported missing updates",
        timestamp: "Today · 2:01 PM",
        detail: "Jamal opened support because edits made on mobile were not visible in the shared workspace.",
        tone: "default",
        sortOrder: 2,
      },
      {
        id: "jamal-conflict-check",
        title: "Conflict review started",
        timestamp: "Today · 2:02 PM",
        detail: "Support started comparing device versions and offline conflict markers across Jamal’s account.",
        tone: "info",
        sortOrder: 3,
      },
      {
        id: "jamal-publish-block",
        title: "Pending publish blocked sync",
        timestamp: "Today · 2:03 PM",
        detail: "A stale publish job was blocking the newest workspace state from syncing to other devices.",
        tone: "critical",
        sortOrder: 4,
      },
      {
        id: "jamal-restore-path",
        title: "Recovery path prepared",
        timestamp: "Today · 2:04 PM",
        detail: "Support prepared a recovery path that would preserve Jamal’s unsynced changes while clearing the blocked publish job.",
        tone: "info",
        sortOrder: 5,
      },
      {
        id: "jamal-sync-validation",
        title: "Cross-device validation pending",
        timestamp: "Today · 2:05 PM",
        detail: "The case was updated to verify that the desktop workspace refreshed correctly once the queue blockage was removed.",
        tone: "default",
        sortOrder: 6,
      },
    ],
    queue: {
      time: "9m ago",
      preview: "Changes saved on mobile are missing on desktop.",
      priority: "High",
      priorityClassName: "border-[#FFB800] bg-[#FFF6E0] text-[#A37A00]",
      badgeColor: "bg-[#208337]",
      icon: "phone",
      isActive: false,
      createdAt: "2026-03-11T13:40:00",
      updatedAt: "2026-03-11T14:05:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 2:01 PM",
        draft:
          "I found the blocked sync job on your account. I’m preserving your recent edits now and then I’ll force the devices back into sync.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "I made edits from my phone this morning, but they’re not showing up on desktop and I’m worried they disappeared.",
            time: "2:01 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "I’m checking the sync queue and the version history now so we can confirm those edits are still intact.",
            time: "2:02 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Please don’t overwrite anything — some of those updates were for a client review this afternoon.",
            time: "2:03 PM",
            sentiment: "frustrated",
          },
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 2:01 PM",
        draft:
          "I can see the stuck sync job and I’m protecting your latest version before I clear it.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "My mobile updates aren’t appearing on desktop. Can someone check whether sync is broken?",
            time: "2:01 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "Yes — I’m tracing the device sync history now.",
            time: "2:02 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "I just need to know the edits are safe before I refresh anything.",
            time: "2:04 PM",
          },
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 2:01 PM",
        draft:
          "Thanks for sending the screenshots of both devices. I can see the version mismatch and I’m correcting it now.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "I’ve sent screenshots from phone and desktop — the mobile version has changes that the desktop one does not.",
            time: "2:01 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "I’m comparing those versions now and I’ll make sure the newest edits win before anything refreshes.",
            time: "2:02 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Perfect. I mostly need confidence that my client notes aren’t gone.",
            time: "2:05 PM",
          },
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 2:01 PM",
        draft:
          "Hi Jamal — I located the stalled sync job that is preventing your latest mobile edits from appearing on desktop. I’m preserving those updates before restarting the sync process.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "Subject: Mobile changes not appearing on desktop\n\nHello, edits I made on my phone today are not showing up on the desktop app. Please help me avoid losing them.",
            time: "2:01 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "Hi Jamal, I’m reviewing the sync queue and version history tied to your workspace now.",
            time: "2:02 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Thanks. Please let me know whether I should avoid making any new edits until you confirm it’s stable.",
            time: "2:05 PM",
          },
        ],
      },
    },
    customerHistory: [
      { id: "jamal-h1", title: "Business Banking account opened", timestamp: "Jun 2017", detail: "Jamal opened a Business Banking account. Premier tier activated and Voice Biometrics enrolled at account creation.", dot: "green" },
      { id: "jamal-h2", title: "International payment alerts configured", timestamp: "Feb 2019", detail: "Jamal requested threshold-based alerts for all outbound wire transfers over $10,000. Configured and tested successfully.", dot: "purple" },
      { id: "jamal-h3", title: "Business credit card limit increased", timestamp: "Oct 2021", detail: "Jamal’s business credit card limit was raised from $50,000 to $100,000 following a credit review. Approved same day.", dot: "green" },
      { id: "jamal-h4", title: "Wire transfer delay — international beneficiary", timestamp: "Sep 2024", detail: "A $75,000 outbound wire to an overseas supplier was held for correspondent bank review. Released after 48 hours.", dot: "orange" },
      { id: "jamal-h5", title: "Document sync conflict reported", timestamp: "Feb 2026", detail: "Jamal reported an edit conflict in a shared workspace document after a version rollback. Agent reviewing sync queue.", dot: "orange" },
      { id: "jamal-h6", title: "Annual credit review — facilities renewed", timestamp: "Mar 2026", detail: "All credit lines and facilities reviewed. AUM at $2.74M. No compliance issues noted. Advisor relationship confirmed.", dot: "green" },
    ],
    customerSnapshot: [
      "3-year customer in good standing",
      "Balanced checking and savings user",
      "No prior disputes or risk flags",
      "Moderate engagement; prefers straightforward transactions",
      "Responsive to communication; easy to work with",
    ],
  },
  {
    id: "hannah",
    initials: "HB",
    name: "Hannah Brooks",
    customerId: "CST-11307",
    lastUpdated: "02/27/26 | 02:47 PM",
    profile: {
      department: "Retail Banking",
      tenureYears: 5,
      totalAUM: "$512,200.00",
      financialReadiness: 76,
      financialAdvisor: "Jeff Comstock",
      advisorTitle: "Retail Banking Advisor",
      tags: ["IVR Auth"],
      fraudRiskScore: 9,
      priorDisputeCount: 0,
      cardBlocked: false,
    },
    conversationTopics: [
      "Dispute incorrect mortgage payment posting",
      "Request escrow account analysis",
      "Update insurance information on loan",
    ],
    contact: {
      email: "hannah.brooks@volkovasset.com",
      phone: "(720) 555-0115",
      address: { street: "1980 Wazee St", city: "Denver", state: "CO", zip: "80202", country: "US" },
    },
    accounts: [
      { id: "hb-chk", type: "Checking",   number: "****4481", balance: "$9,310.00",   availableBalance: "$9,310.00", status: "active", openedDate: "Aug 2021" },
      { id: "hb-sav", type: "Savings",    number: "****7723", balance: "$68,000.00",  status: "active", openedDate: "Aug 2021" },
      { id: "hb-inv", type: "Investment", number: "****0091", balance: "$434,890.00", status: "active", openedDate: "Feb 2022" },
    ],
    overview: {
      contactNumber: "(720) 555-0115",
      assignedAgent: "Jeff Comstock",
      pronoun: "she",
      lastContactTime: "Today, 2:49 PM",
      address: "1980 Wazee St, Denver, CO 80202",
    },
    interactionTimeline: [
      {
        id: "hannah-billing-cycle",
        title: "Invoice cycle generated",
        timestamp: "Today · 2:44 PM",
        detail: "Hannah’s renewal invoice generated with a line item that did not match the quoted annual rate.",
        tone: "warning",
        sortOrder: 1,
      },
      {
        id: "hannah-customer-dispute",
        title: "Customer disputed renewal total",
        timestamp: "Today · 2:45 PM",
        detail: "Hannah contacted support because the renewal total was higher than the approved quote on file.",
        tone: "default",
        sortOrder: 2,
      },
      {
        id: "hannah-contract-review",
        title: "Contract review started",
        timestamp: "Today · 2:46 PM",
        detail: "Support began reviewing the signed renewal quote against the invoiced line items and seat counts.",
        tone: "info",
        sortOrder: 3,
      },
      {
        id: "hannah-seat-audit",
        title: "Seat overage mismatch found",
        timestamp: "Today · 2:47 PM",
        detail: "A stale seat overage setting incorrectly carried into the renewal invoice and inflated the billed amount.",
        tone: "critical",
        sortOrder: 4,
      },
      {
        id: "hannah-credit-hold",
        title: "Payment hold prevented",
        timestamp: "Today · 2:48 PM",
        detail: "The invoice was prevented from auto-charging while the billing discrepancy was under review.",
        tone: "info",
        sortOrder: 5,
      },
      {
        id: "hannah-corrected-total",
        title: "Corrected invoice path prepared",
        timestamp: "Today · 2:49 PM",
        detail: "Support prepared a corrected invoice total that aligned with the quoted annual renewal amount.",
        tone: "default",
        sortOrder: 6,
      },
    ],
    queue: {
      time: "11m ago",
      preview: "Renewal invoice total doesn’t match the quoted rate.",
      priority: "Critical",
      priorityClassName: "border-[#E53935] bg-[#FDEAEA] text-[#C71D1A]",
      badgeColor: "bg-[#E32926]",
      icon: "clipboardList",
      isActive: false,
      createdAt: "2026-03-11T14:25:00",
      updatedAt: "2026-03-11T14:49:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 2:45 PM",
        draft:
          "I found the invoice mismatch and I’ve stopped the payment from auto-processing while I correct the renewal total.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "Our renewal invoice looks higher than the quote we approved. Can someone review this before it charges?",
            time: "2:45 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "I’m comparing the invoice lines to your signed renewal quote now.",
            time: "2:46 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Please pause anything automatic until we know where the extra amount came from.",
            time: "2:47 PM",
            sentiment: "frustrated",
          },
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 2:45 PM",
        draft:
          "I’ve frozen the invoice while I validate the seat count and quote terms. I’ll confirm the corrected total shortly.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "The renewal total is wrong and I need to stop it before finance processes it.",
            time: "2:45 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "Understood — I’m reviewing the quote and invoice setup right now.",
            time: "2:46 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "It looks like extra seats were added, but we never approved that.",
            time: "2:48 PM",
          },
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 2:45 PM",
        draft:
          "Thanks for sending the quote screenshot. I confirmed the invoice pulled the wrong seat count and I’m correcting it now.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "I just sent the quote and invoice screenshots. The totals definitely don’t match.",
            time: "2:45 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "I can already see the discrepancy. I’m verifying which line item created the overage.",
            time: "2:46 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Great, thank you. We just need the corrected amount before procurement signs off.",
            time: "2:49 PM",
          },
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 2:45 PM",
        draft:
          "Hi Hannah — I confirmed that the renewal invoice pulled an incorrect seat overage setting. I’ve stopped the payment workflow and I’m issuing a corrected total now.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "Subject: Renewal invoice mismatch\n\nHello, the annual renewal invoice we received today does not match our approved quote. Please review before payment is collected.",
            time: "2:45 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "Hi Hannah, I’m reviewing the invoice lines and contract details attached to your renewal now.",
            time: "2:46 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Thanks. Please confirm once the corrected invoice is ready so I can forward it internally.",
            time: "2:49 PM",
          },
        ],
      },
    },
    customerHistory: [
      { id: "hannah-h1", title: "Retail Banking account opened", timestamp: "Jan 2021", detail: "Hannah opened a Retail Banking account and enrolled in IVR authentication. Initial deposit of $22,000.", dot: "green" },
      { id: "hannah-h2", title: "Savings goal configured", timestamp: "Apr 2021", detail: "Hannah set up an automated monthly savings goal of $500 toward an emergency fund. Target reached within 18 months.", dot: "purple" },
      { id: "hannah-h3", title: "Advisor assigned — Jeff Comstock", timestamp: "Jun 2022", detail: "Hannah was paired with Jeff Comstock following a review of her growing portfolio. Advisor relationship confirmed.", dot: "purple" },
      { id: "hannah-h4", title: "Fee waiver requested — annual maintenance", timestamp: "Sep 2023", detail: "Hannah requested a waiver for the annual account maintenance fee. Approved as a retention gesture for a 5-year customer.", dot: "gray" },
      { id: "hannah-h5", title: "Invoice discrepancy reported", timestamp: "Jan 2026", detail: "Hannah flagged a billing mismatch on her account statement. Agent identified a duplicate line item and initiated a correction.", dot: "orange" },
      { id: "hannah-h6", title: "Corrected invoice confirmed", timestamp: "Mar 2026", detail: "Corrected invoice was issued and Hannah confirmed receipt. Case closed with no outstanding balance discrepancy.", dot: "green" },
    ],
    customerSnapshot: [
      "2-year newer customer building banking relationship",
      "Single account user with growing balance",
      "Zero disputes; clean transaction history",
      "Learning-oriented; appreciates educational resources",
      "Reliable communicator; quick to respond to outreach",
    ],
  },
  {
    id: "noah",
    initials: "NP",
    name: "Noah Patel",
    customerId: "CST-11368",
    lastUpdated: "02/27/26 | 04:11 PM",
    profile: {
      department: "Personal Investing",
      tenureYears: 12,
      totalAUM: "$5,830,100.00",
      financialReadiness: 97,
      financialAdvisor: "Marcus Lee",
      advisorTitle: "Private Wealth Advisor",
      tags: ["Premier", "IVR Auth", "Voice Biometrics"],
      fraudRiskScore: 38,
      priorDisputeCount: 1,
      cardBlocked: false,
    },
    conversationTopics: [
      "Review private equity fund allocation",
      "Discuss charitable giving strategy",
      "Coordinate with tax advisor on year-end planning",
    ],
    contact: {
      email: "noah.patel@patelbridgecap.com",
      phone: "(213) 555-0179",
      address: { street: "775 S Grand Ave", city: "Los Angeles", state: "CA", zip: "90017", country: "US" },
    },
    accounts: [
      { id: "np-chk", type: "Checking",   number: "****3309", balance: "$44,000.00",   availableBalance: "$44,000.00", status: "active", openedDate: "Oct 2014" },
      { id: "np-sav", type: "Savings",    number: "****6612", balance: "$220,000.00",  status: "active", openedDate: "Oct 2014" },
      { id: "np-inv", type: "Investment", number: "****0017", balance: "$5,566,100.00",status: "active", openedDate: "Mar 2015" },
    ],
    overview: {
      contactNumber: "(213) 555-0179",
      assignedAgent: "Marcus Lee",
      pronoun: "he",
      lastContactTime: "Today, 4:13 PM",
      address: "775 S Grand Ave, Los Angeles, CA 90017",
    },
    interactionTimeline: [
      {
        id: "noah-export-job",
        title: "Export job failed",
        timestamp: "Today · 4:08 PM",
        detail: "Noah’s scheduled analytics export failed after timing out on a large report bundle.",
        tone: "warning",
        sortOrder: 1,
      },
      {
        id: "noah-customer-outreach",
        title: "Customer requested urgent file delivery",
        timestamp: "Today · 4:09 PM",
        detail: "Noah contacted support because he needed the report export for an external stakeholder meeting the same day.",
        tone: "default",
        sortOrder: 2,
      },
      {
        id: "noah-queue-review",
        title: "Background queue reviewed",
        timestamp: "Today · 4:10 PM",
        detail: "Support reviewed the export queue and identified a timeout on one oversized report segment.",
        tone: "info",
        sortOrder: 3,
      },
      {
        id: "noah-manual-rerun",
        title: "Manual rerun queued",
        timestamp: "Today · 4:11 PM",
        detail: "A manual rerun was queued with a narrower data range so the export could complete before the meeting deadline.",
        tone: "critical",
        sortOrder: 4,
      },
      {
        id: "noah-download-link",
        title: "Secure download path prepared",
        timestamp: "Today · 4:12 PM",
        detail: "Support prepared a secure download link to deliver the rerun export as soon as the file generated.",
        tone: "info",
        sortOrder: 5,
      },
      {
        id: "noah-followup-note",
        title: "Meeting deadline noted",
        timestamp: "Today · 4:13 PM",
        detail: "The case was tagged with Noah’s meeting deadline to keep the rerun at the top of the queue.",
        tone: "default",
        sortOrder: 6,
      },
    ],
    queue: {
      time: "14m ago",
      preview: "Analytics export failed before a stakeholder meeting.",
      priority: "High",
      priorityClassName: "border-[#FFB800] bg-[#FFF6E0] text-[#A37A00]",
      badgeColor: "bg-[#166CCA]",
      icon: "messageSquare",
      isActive: false,
      createdAt: "2026-03-11T15:45:00",
      updatedAt: "2026-03-11T16:13:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 4:09 PM",
        draft:
          "I found the export timeout and I’ve started a manual rerun with a safer range so we can get you the file before your meeting.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "My analytics export failed and I need the file before I present to stakeholders later today.",
            time: "4:09 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "I’m checking the export queue now and I’ll see whether I can rerun it faster for you.",
            time: "4:10 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Please do — the meeting is soon and I can’t walk in without those numbers.",
            time: "4:11 PM",
            sentiment: "frustrated",
          },
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 4:09 PM",
        draft:
          "I can see the timed-out export job and I’m rerunning it now. I’ll text you the secure download link as soon as it finishes.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "Can you help with a failed export? I need the report today.",
            time: "4:09 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "Yes — I’m checking the export log and queue status now.",
            time: "4:10 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "If it helps, I only need the current quarter, not the full year.",
            time: "4:12 PM",
          },
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 4:09 PM",
        draft:
          "Thanks for clarifying the timeframe. I’m rerunning the export with that smaller range to get it back faster.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "I can narrow the report if needed. I mainly need the quarter-over-quarter numbers right away.",
            time: "4:09 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "That helps. I’m adjusting the rerun parameters now to reduce the file size and finish sooner.",
            time: "4:10 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Perfect. Send the link here if that’s the quickest path once it’s ready.",
            time: "4:13 PM",
          },
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 4:09 PM",
        draft:
          "Hi Noah — I confirmed that your export failed because one large report segment timed out. I’ve started a manual rerun with a narrower range so we can get you the file before your meeting.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "Subject: Export failed before meeting\n\nHello, my scheduled export failed and I need the report file today for an external meeting. Please help me recover it quickly.",
            time: "4:09 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "Hi Noah, I’m reviewing the export queue and timeout logs for your report now.",
            time: "4:10 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Thanks. If a smaller report can finish sooner, I’m happy to use that version.",
            time: "4:13 PM",
          },
        ],
      },
    },
    customerHistory: [
      { id: "noah-h1", title: "Personal Investing account opened", timestamp: "Feb 2014", detail: "Noah opened a high net worth investing account. Portfolio seeded with $850,000. IVR authentication and voice biometrics enrolled.", dot: "green" },
      { id: "noah-h2", title: "Portfolio milestone — $2M AUM", timestamp: "Jan 2017", detail: "Noah’s portfolio crossed $2M AUM. Upgraded to Premier tier with dedicated advisory access.", dot: "purple" },
      { id: "noah-h3", title: "Tax document request — annual filing", timestamp: "Feb 2020", detail: "Noah requested consolidated tax statements for three account years. Delivered within the SLA window.", dot: "gray" },
      { id: "noah-h4", title: "Report export failure — timeout", timestamp: "Nov 2025", detail: "Noah reported that a large portfolio export was timing out before completion. Queue configuration adjusted to increase limits.", dot: "orange" },
      { id: "noah-h5", title: "Portfolio milestone — $5M AUM", timestamp: "Jan 2026", detail: "Portfolio reached $5.83M AUM. Advisor reviewed allocation and confirmed strategy alignment. No changes required.", dot: "green" },
      { id: "noah-h6", title: "Export queue issue — recurring", timestamp: "Mar 2026", detail: "Noah opened a second report timeout case. Agent investigating whether a scoped export can be delivered sooner.", dot: "orange" },
    ],
    customerSnapshot: [
      "6-year loyal customer with established patterns",
      "Multiple accounts; consistent monthly activity",
      "No prior disputes or security concerns",
      "Prefers routine interactions; low maintenance",
      "Values reliability and predictability in service",
    ],
  },
  {
    id: "lauren",
    initials: "LK",
    name: "Lauren Kim",
    customerId: "CST-11412",
    lastUpdated: "02/27/26 | 04:39 PM",
    profile: {
      department: "Business Banking",
      tenureYears: 8,
      totalAUM: "$4,504,340.00",
      financialReadiness: 92,
      financialAdvisor: "Priya Shah",
      advisorTitle: "High Net Worth Advisor",
      tags: ["Premier", "IVR Auth", "Voice Biometrics"],
      fraudRiskScore: 25,
      priorDisputeCount: 0,
      cardBlocked: false,
    },
    conversationTopics: [
      "Review business succession planning",
      "Set up employee benefits account",
      "Discuss SBA loan refinancing options",
    ],
    contact: {
      email: "lauren.kim@beaumontlegal.com",
      phone: "(503) 555-0132",
      address: { street: "622 NW Everett St", city: "Portland", state: "OR", zip: "97209", country: "US" },
    },
    accounts: [
      { id: "lk-chk", type: "Business",   number: "****8826", balance: "$312,000.00",   availableBalance: "$312,000.00", status: "active", openedDate: "Nov 2018" },
      { id: "lk-sav", type: "Savings",    number: "****3314", balance: "$820,000.00",   status: "active", openedDate: "Nov 2018" },
      { id: "lk-inv", type: "Investment", number: "****5521", balance: "$3,372,340.00", status: "active", openedDate: "Apr 2019" },
    ],
    overview: {
      contactNumber: "(503) 555-0132",
      assignedAgent: "Priya Shah",
      pronoun: "she",
      lastContactTime: "Today, 4:41 PM",
      address: "622 NW Everett St, Portland, OR 97209",
    },
    interactionTimeline: [
      {
        id: "lauren-seat-add",
        title: "Seat expansion started",
        timestamp: "Today · 4:36 PM",
        detail: "Lauren attempted to add seats for a new team rollout and hit an admin-permission restriction during checkout.",
        tone: "warning",
        sortOrder: 1,
      },
      {
        id: "lauren-admin-check",
        title: "Permission review started",
        timestamp: "Today · 4:37 PM",
        detail: "Support reviewed the workspace roles after the seat expansion failed under Lauren’s current admin scope.",
        tone: "info",
        sortOrder: 2,
      },
      {
        id: "lauren-customer-urgency",
        title: "Customer needs rollout today",
        timestamp: "Today · 4:38 PM",
        detail: "Lauren contacted support because new hires needed access before the end of the business day.",
        tone: "default",
        sortOrder: 3,
      },
      {
        id: "lauren-escalated-role",
        title: "Temporary role elevation requested",
        timestamp: "Today · 4:39 PM",
        detail: "A temporary role elevation request was submitted so Lauren could complete the seat purchase without waiting for another admin.",
        tone: "critical",
        sortOrder: 4,
      },
      {
        id: "lauren-seat-quote",
        title: "Updated seat quote prepared",
        timestamp: "Today · 4:40 PM",
        detail: "Support prepared an updated seat quote so the order could be approved immediately once access was restored.",
        tone: "info",
        sortOrder: 5,
      },
      {
        id: "lauren-completion-path",
        title: "Completion path documented",
        timestamp: "Today · 4:41 PM",
        detail: "The case was updated with the exact steps Lauren would need to complete once the admin permission was fixed.",
        tone: "default",
        sortOrder: 6,
      },
    ],
    queue: {
      time: "18m ago",
      preview: "Seat expansion blocked by admin permissions.",
      priority: "Low",
      priorityClassName: "border-[#24943E] bg-[#EFFBF1] text-[#208337]",
      badgeColor: "bg-[#208337]",
      icon: "phone",
      isActive: false,
      createdAt: "2026-03-11T16:20:00",
      updatedAt: "2026-03-11T16:41:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 4:37 PM",
        draft:
          "I found the permission block on your admin role. I’m escalating a temporary elevation now so you can finish adding the seats today.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "I’m trying to add seats for new hires, but the admin tools keep blocking me at the final step.",
            time: "4:37 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "I’m checking your workspace role and the seat-purchase permissions now.",
            time: "4:38 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "I need to finish this today because onboarding starts tomorrow morning.",
            time: "4:39 PM",
            sentiment: "frustrated",
          },
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 4:37 PM",
        draft:
          "I can see the permission mismatch and I’m requesting a temporary role fix so you can add the seats today.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "Can you help me add seats? The system says I don’t have the right admin access.",
            time: "4:37 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "Yes — I’m reviewing the workspace admin settings now.",
            time: "4:38 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Thanks. If I need another approver, I can pull them in fast.",
            time: "4:40 PM",
          },
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 4:37 PM",
        draft:
          "Thanks for the screenshot. I confirmed the role gate and I’m pushing a faster approval path for the seat add.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "I sent the screen where it blocks me. It looks like a permissions issue, not a billing problem.",
            time: "4:37 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "I agree. I’m tracing the admin role settings and purchase policy now.",
            time: "4:38 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Great — I just need the quickest route to get those seats live.",
            time: "4:41 PM",
          },
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 4:37 PM",
        draft:
          "Hi Lauren — I confirmed that the seat expansion is blocked by an admin-permission setting rather than a billing failure. I’ve escalated a temporary access fix so you can complete the purchase today.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "Subject: Unable to add seats\n\nHello, I’m trying to purchase additional seats for new team members, but the admin settings are blocking me at checkout.",
            time: "4:37 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "Hi Lauren, I’m reviewing the role permissions and seat-purchase policy attached to your workspace now.",
            time: "4:38 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Thank you. Please let me know whether I should involve our main account owner to speed approval.",
            time: "4:41 PM",
          },
        ],
      },
    },
    customerHistory: [
      { id: "lauren-h1", title: "Business Banking account opened", timestamp: "Apr 2018", detail: "Lauren opened a Business Banking account for her advisory firm. Premier tier, IVR Auth, and Voice Biometrics enrolled.", dot: "green" },
      { id: "lauren-h2", title: "AUM milestone — $1M", timestamp: "Nov 2019", detail: "Lauren's assets under management reached $1M. Relationship transferred to dedicated High Net Worth Advisor Priya Shah.", dot: "purple" },
      { id: "lauren-h3", title: "Fee schedule renegotiated", timestamp: "Feb 2022", detail: "Following AUM growth past $3M, Lauren's advisory fee schedule was reviewed and reduced by 0.1% as a loyalty discount.", dot: "purple" },
      { id: "lauren-h4", title: "AUM milestone — $4M", timestamp: "Aug 2023", detail: "Portfolio crossed $4M AUM. Annual strategy review confirmed allocation targets met. No changes to risk profile.", dot: "green" },
      { id: "lauren-h5", title: "Workspace permission issue", timestamp: "Jan 2026", detail: "Lauren reported that a team member could not access a shared workspace. Role permission gap identified and resolved.", dot: "orange" },
      { id: "lauren-h6", title: "Seat-purchase approval pending", timestamp: "Mar 2026", detail: "Lauren requested additional workspace seats for her growing team. Approval routing under review by account owner.", dot: "gray" },
    ],
    customerSnapshot: [
      "4-year customer with $400K+ in accounts",
      "Investment-focused; interested in growth strategies",
      "Zero disputes; strong advisor relationship",
      "Financially literate; reads all account statements",
      "Proactive about reviewing and optimizing accounts",
    ],
  },
  {
    id: "ethan",
    initials: "EZ",
    name: "Ethan Zhang",
    customerId: "CST-11458",
    lastUpdated: "02/27/26 | 05:07 PM",
    profile: {
      department: "Business Banking",
      tenureYears: 6,
      totalAUM: "$2,098,600.00",
      financialReadiness: 85,
      financialAdvisor: "Alex Bogush",
      advisorTitle: "High Net Worth Advisor",
      tags: ["Premier", "IVR Auth"],
      fraudRiskScore: 76,
      priorDisputeCount: 1,
      cardBlocked: false,
    },
    conversationTopics: [
      "Review commercial real estate loan status",
      "Discuss interest rate lock options",
      "Escalate underwriting timeline concern",
    ],
    contact: {
      email: "ethan.zhang@madison-trading.com",
      phone: "(646) 555-0163",
      address: { street: "515 Madison Ave", city: "New York", state: "NY", zip: "10022", country: "US" },
    },
    accounts: [
      { id: "ez-chk", type: "Business",   number: "****7741", balance: "$88,500.00",   availableBalance: "$88,500.00", status: "active", openedDate: "Sep 2020" },
      { id: "ez-sav", type: "Savings",    number: "****4428", balance: "$310,000.00",  status: "active", openedDate: "Sep 2020" },
      { id: "ez-inv", type: "Investment", number: "****8801", balance: "$1,700,100.00",status: "active", openedDate: "Feb 2021" },
    ],
    overview: {
      contactNumber: "(646) 555-0163",
      assignedAgent: "Alex Bogush",
      pronoun: "he",
      lastContactTime: "Today, 5:09 PM",
      address: "515 Madison Ave, New York, NY 10022",
    },
    interactionTimeline: [
      {
        id: "ethan-api-rate-limit",
        title: "Rate limit spike detected",
        timestamp: "Today · 5:04 PM",
        detail: "Ethan’s API integration began returning rate-limit errors after a sudden spike in scheduled requests.",
        tone: "warning",
        sortOrder: 1,
      },
      {
        id: "ethan-integration-ticket",
        title: "Customer reported failed sync jobs",
        timestamp: "Today · 5:05 PM",
        detail: "Ethan contacted support because downstream sync jobs stopped updating once the API errors began.",
        tone: "default",
        sortOrder: 2,
      },
      {
        id: "ethan-throttle-review",
        title: "Throttle policy reviewed",
        timestamp: "Today · 5:06 PM",
        detail: "Support reviewed Ethan’s request pattern and identified a burst window exceeding the account’s allowed threshold.",
        tone: "info",
        sortOrder: 3,
      },
      {
        id: "ethan-priority-window",
        title: "Temporary priority window requested",
        timestamp: "Today · 5:07 PM",
        detail: "A temporary throughput increase was requested so Ethan could clear the sync backlog without manual retries.",
        tone: "critical",
        sortOrder: 4,
      },
      {
        id: "ethan-backoff-plan",
        title: "Backoff guidance prepared",
        timestamp: "Today · 5:08 PM",
        detail: "Support prepared recommended retry spacing so the integration could remain stable after the backlog cleared.",
        tone: "info",
        sortOrder: 5,
      },
      {
        id: "ethan-recovery-check",
        title: "Recovery monitoring added",
        timestamp: "Today · 5:09 PM",
        detail: "The case was updated with monitoring to confirm the sync backlog drained once the priority window opened.",
        tone: "default",
        sortOrder: 6,
      },
    ],
    queue: {
      time: "22m ago",
      preview: "API sync jobs stalled after rate-limit errors.",
      priority: "Medium",
      priorityClassName: "border-[#BFDBFE] bg-[#EBF4FD] text-[#166CCA]",
      badgeColor: "bg-[#FFB800]",
      icon: "messageSquare",
      isActive: false,
      createdAt: "2026-03-11T16:52:00",
      updatedAt: "2026-03-11T17:09:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 5:05 PM",
        draft:
          "I found the burst pattern that triggered the rate limit. I’m requesting a temporary throughput increase and I’ll share the retry guidance once the backlog starts clearing.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "Our integration started throwing rate-limit errors and now none of the sync jobs are catching up.",
            time: "5:05 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "I’m reviewing the request burst and current queue backlog now.",
            time: "5:06 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "If we can’t clear this today, several downstream systems will be stale by tomorrow morning.",
            time: "5:07 PM",
            sentiment: "frustrated",
          },
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 5:05 PM",
        draft:
          "I can see the rate-limit spike and I’m requesting a temporary increase while I also prepare the safer retry spacing for your integration.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "Can you check our API rate limit? Sync jobs are failing across the board.",
            time: "5:05 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "Yes — I’m checking the request pattern and the failure window now.",
            time: "5:06 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "We had a large scheduled burst this afternoon, so that may be the trigger.",
            time: "5:08 PM",
          },
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 5:05 PM",
        draft:
          "Thanks for confirming the burst timing. I’m opening a temporary priority window now and I’ll monitor the backlog here with you.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "I’ve sent the error screenshots and request counts. It looks like we hit the cap hard.",
            time: "5:05 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "That matches what I’m seeing. I’m escalating a throughput exception now.",
            time: "5:06 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Great — please keep me posted as soon as the queue starts moving again.",
            time: "5:09 PM",
          },
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 5:05 PM",
        draft:
          "Hi Ethan — I confirmed that the sync failures line up with a request burst that exceeded the current API threshold. I’ve requested a temporary increase and I’m preparing guidance to prevent repeat throttling.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "Subject: API rate limits breaking sync\n\nHello, our API integration began failing this afternoon with rate-limit errors, and now our sync jobs are backed up. Please advise.",
            time: "5:05 PM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "Hi Ethan, I’m reviewing the rate-limit events and queued retries tied to your integration now.",
            time: "5:06 PM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Thanks. We can adjust the retry cadence if needed once the backlog is cleared.",
            time: "5:09 PM",
          },
        ],
      },
    },
    customerHistory: [
      { id: "ethan-h1", title: "Business Banking account opened", timestamp: "Jul 2020", detail: "Ethan opened a Business Banking account for his tech startup. Premier tier and IVR Auth enrolled. Initial deposit $180,000.", dot: "green" },
      { id: "ethan-h2", title: "First dispute filed — contractor charge", timestamp: "Mar 2022", detail: "Ethan disputed a $3,200 charge from a contractor who had not delivered agreed work. Resolved in Ethan's favour after review.", dot: "orange" },
      { id: "ethan-h3", title: "AUM milestone — $1M", timestamp: "Sep 2022", detail: "Business portfolio crossed $1M AUM. Transferred to Alex Bogush as dedicated High Net Worth Advisor.", dot: "purple" },
      { id: "ethan-h4", title: "API rate-limit incident", timestamp: "Jun 2024", detail: "Ethan's integration hit repeated rate-limit errors during a high-volume batch job. Queue retry cadence adjusted to resolve.", dot: "orange" },
      { id: "ethan-h5", title: "Fraud risk score elevated", timestamp: "Oct 2024", detail: "Irregular API activity pattern triggered an elevated fraud risk score. Manual review confirmed legitimate automated traffic.", dot: "red" },
      { id: "ethan-h6", title: "Integration backlog — rate-limit recurrence", timestamp: "Mar 2026", detail: "Ethan reported a repeat rate-limit backlog on his integration. Agent reviewing queued retries and proposing a permanent fix.", dot: "orange" },
    ],
    customerSnapshot: [
      "3-year customer with active trading activity",
      "Frequent portfolio adjustments and rebalancing",
      "No prior disputes; moderate fraud risk score",
      "Very tech-savvy; uses mobile app daily",
      "Self-directed investor; minimal advisor interaction",
    ],
  },
  {
    id: "darius",
    initials: "DK",
    name: "Darius Knox",
    customerId: "CST-12187",
    lastUpdated: "04/08/26 | 10:14 AM",
    profile: {
      department: "Wealth Management",
      tenureYears: 3,
      totalAUM: "$2,875,000.00",
      financialReadiness: 62,
      financialAdvisor: "Jeff Comstock",
      advisorTitle: "Senior Wealth Advisor",
      tags: ["Premier", "High-Value"],
      fraudRiskScore: 72,
      priorDisputeCount: 2,
      cardBlocked: false,
    },
    conversationTopics: [
      "Reverse $47,500 transfer sent to wrong account",
      "Contact receiving bank to initiate recall",
      "Confirm funds returned and close incident",
    ],
    contact: {
      email: "darius.knox@pinnaclewealth.com",
      phone: "(312) 555-0877",
      address: { street: "1420 N Lake Shore Dr, Unit 22B", city: "Chicago", state: "IL", zip: "60610", country: "US" },
    },
    accounts: [
      { id: "dk-chk", type: "Checking",   number: "****9934", balance: "$95,000.00",   availableBalance: "$95,000.00", status: "active", openedDate: "Feb 2023" },
      { id: "dk-sav", type: "Savings",    number: "****1178", balance: "$280,000.00",  status: "active", openedDate: "Feb 2023" },
      { id: "dk-inv", type: "Investment", number: "****4490", balance: "$2,500,000.00",status: "active", openedDate: "Jun 2023" },
    ],
    overview: {
      contactNumber: "(312) 555-0877",
      assignedAgent: "Jeff Comstock",
      pronoun: "he",
      lastContactTime: "Today, 10:11 AM",
      address: "1420 N Lake Shore Dr, Unit 22B, Chicago, IL 60610",
    },
    interactionTimeline: [
      {
        id: "darius-transfer-sent",
        title: "Transfer completed to wrong account",
        timestamp: "Today · 10:03 AM",
        detail: "A $47,500 wire transfer was processed to an incorrect beneficiary. Darius noticed the error shortly after submission.",
        tone: "critical",
        sortOrder: 1,
      },
      {
        id: "darius-chat-open",
        title: "Customer opened live chat",
        timestamp: "Today · 10:08 AM",
        detail: "Darius contacted support immediately and requested an urgent reversal of the misdirected transfer.",
        tone: "default",
        sortOrder: 2,
      },
      {
        id: "darius-recall-initiated",
        title: "Recall request initiated",
        timestamp: "Today · 10:10 AM",
        detail: "AI flagged the case as a priority incident and initiated a recall request through the payments network.",
        tone: "warning",
        sortOrder: 3,
      },
      {
        id: "darius-payments-team",
        title: "Payments team notified",
        timestamp: "Today · 10:14 AM",
        detail: "The payments team was alerted and a reversal brief was prepared for the assigned human agent.",
        tone: "info",
        sortOrder: 4,
      },
    ],
    customerHistory: [
      {
        id: "darius-h1",
        title: "Misdirected wire transfer — recall initiated",
        timestamp: "Today · 10:08 AM",
        detail: "Darius sent $47,500 to an incorrect beneficiary. Recall request submitted through the payments network.",
        dot: "red",
      },
      {
        id: "darius-h2",
        title: "Dispute #2 resolved — advisory fee refunded",
        timestamp: "Dec 5, 2025 · 3:20 PM",
        detail: "An unauthorized $1,200 advisory fee was disputed and refunded after the advisor confirmed the billing error.",
        dot: "green",
      },
      {
        id: "darius-h3",
        title: "Large transfer flagged and cleared",
        timestamp: "Jun 18, 2025 · 2:45 PM",
        detail: "A $95,000 international wire was temporarily held by fraud systems. Darius verified the transaction and it was released.",
        dot: "orange",
      },
      {
        id: "darius-h4",
        title: "Dispute #1 resolved — international wire fee waived",
        timestamp: "Mar 2, 2025 · 11:00 AM",
        detail: "Darius disputed a $150 wire transfer fee citing advisor guidance. Fee was waived as a goodwill gesture.",
        dot: "green",
      },
      {
        id: "darius-h5",
        title: "Upgraded to High-Value tier",
        timestamp: "Sep 10, 2024 · 10:30 AM",
        detail: "Account reclassified to High-Value after AUM exceeded $2.5M. Priority support and dedicated advisor access unlocked.",
        dot: "purple",
      },
      {
        id: "darius-h6",
        title: "Account opened",
        timestamp: "Jan 22, 2023 · 9:00 AM",
        detail: "Wealth Management account opened. Initial portfolio of $1.8M transferred from a previous private bank.",
        dot: "gray",
      },
    ],
    queue: {
      time: "3m ago",
      preview: "I just realized I sent money to the wrong account — I need this fixed right away",
      priority: "Critical",
      priorityClassName: "border-[#E53935] bg-[#FDEAEA] text-[#C71D1A]",
      badgeColor: "bg-[#E32926]",
      icon: "messageSquare",
      isActive: false,
      createdAt: "2026-04-08T10:08:00",
      updatedAt: "2026-04-08T10:14:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 10:08 AM",
        draft:
          "I've reviewed the transfer details and initiated a recall request with the receiving bank. I'm escalating this now and will keep you updated every step of the way.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "I just realized I sent money to the wrong account — I need this fixed right away",
            time: "10:08 AM",
            sentiment: "frustrated",
          },
          {
            id: 2,
            role: "agent",
            content:
              "I can see the transfer in your account. I'm pulling up the details now — can you confirm the amount and when it was sent?",
            time: "10:09 AM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "It was $47,500 sent about 10 minutes ago. The beneficiary name looks completely wrong. Is there any way to stop it?",
            time: "10:11 AM",
            sentiment: "frustrated",
          },
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 10:08 AM",
        draft:
          "Hi Darius — we've flagged the misdirected transfer and a recall has been submitted. I'll notify you as soon as we have a status update from the receiving bank.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "Hi, I sent a wire transfer to the wrong account by mistake. $47,500. How do I get it back?",
            time: "10:08 AM",
            sentiment: "frustrated",
          },
          {
            id: 2,
            role: "agent",
            content:
              "Hi Darius, I'm on this right away. I can see the transaction — I'm initiating a recall request now.",
            time: "10:10 AM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Please hurry — that's a large amount and I can't afford for it to disappear.",
            time: "10:12 AM",
            sentiment: "frustrated",
          },
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 10:08 AM",
        draft:
          "I've escalated this to our payments team and they're coordinating the recall with the receiving institution. I'll send you a confirmation as soon as it's confirmed.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "Hey, urgent — I accidentally wired $47,500 to the wrong person. What can be done?",
            time: "10:08 AM",
          },
          {
            id: 2,
            role: "agent",
            content:
              "I have your account open now and can see the transfer. I'm working with our payments team to submit a recall.",
            time: "10:10 AM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "OK, thank you. Please keep me posted — I'm really worried about this.",
            time: "10:13 AM",
            sentiment: "frustrated",
          },
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 10:08 AM",
        draft:
          "Hi Darius — I've reviewed the transfer and submitted an urgent recall request. Our payments team is now in direct contact with the receiving institution. I'll follow up with a full status update within the hour.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "Subject: Urgent — wrong wire transfer\n\nHi, I just sent a $47,500 wire to the wrong account. I realized the mistake moments after submitting. Please tell me what options I have.",
            time: "10:08 AM",
            sentiment: "frustrated",
          },
          {
            id: 2,
            role: "agent",
            content:
              "Hi Darius, I've received your message and I'm treating this as a priority case. I'm reviewing the transfer now and will initiate a recall immediately.",
            time: "10:10 AM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Thank you. The beneficiary account number I used was completely wrong — I must have copied an old entry. Please do everything you can.",
            time: "10:14 AM",
            sentiment: "frustrated",
          },
        ],
      },
    },
    customerSnapshot: [
      "5-year customer with $800K+ portfolio",
      "Business and personal banking combined",
      "Zero prior disputes; Premier tier member",
      "Strategic thinker; prefers quarterly business reviews",
      "Delegated account access to business partner",
    ],
  },
  {
    id: "sofia",
    initials: "SM",
    name: "Sofia Martinez",
    customerId: "CST-12045",
    lastUpdated: "04/20/26 | 09:52 AM",
    profile: {
      department: "Retail Banking",
      tenureYears: 11,
      totalAUM: "$4,280.00",
      financialReadiness: 42,
      financialAdvisor: "Jeff Comstock",
      advisorTitle: "Fraud & Security Specialist",
      tags: ["Checking Account", "Debit Card", "Fraud Alert"],
      fraudRiskScore: 94,
      priorDisputeCount: 0,
      cardBlocked: false,
    },
    conversationTopics: [
      "Confirm 2 fraudulent transactions totaling $2,159",
      "Initiate dispute process and freeze card",
      "Provide rent-due context and escalate for immediate support",
    ],
    contact: {
      email: "sofia.martinez@email.com",
      phone: "(602) 555-0147",
      address: { street: "1134 W McDowell Rd", city: "Phoenix", state: "AZ", zip: "85007", country: "US" },
    },
    accounts: [
      { id: "sm-checking", type: "Checking", number: "****7714", balance: "$4,280.00", availableBalance: "$2,121.00", status: "active", openedDate: "Mar 2015" },
    ],
    overview: {
      contactNumber: "(602) 555-0147",
      assignedAgent: "Jeff Comstock",
      pronoun: "she",
      lastContactTime: "Today, 9:52 AM",
      address: "1134 W McDowell Rd, Phoenix, AZ 85007",
    },
    interactionTimeline: [
      {
        id: "sofia-fraud-detected",
        title: "Behavioral anomaly detected",
        timestamp: "Today · 9:44 AM",
        detail: "Jacob's fraud engine flagged 4 transactions from the past 6 hours that deviate from Sofia's spending patterns.",
        tone: "critical",
        sortOrder: 1,
      },
      {
        id: "sofia-chat-open",
        title: "Proactive chat initiated by Jacob",
        timestamp: "Today · 9:45 AM",
        detail: "Jacob opened a secure chat session with Sofia to review flagged transactions.",
        tone: "info",
        sortOrder: 2,
      },
      {
        id: "sofia-transactions-reviewed",
        title: "2 transactions confirmed fraudulent",
        timestamp: "Today · 9:48 AM",
        detail: "Sofia confirmed she did not make the $1,847 or $312 charges from an out-of-state electronics retailer.",
        tone: "warning",
        sortOrder: 3,
      },
      {
        id: "sofia-distress",
        title: "Customer distress flagged — critical sentiment",
        timestamp: "Today · 9:50 AM",
        detail: "Sofia's sentiment score crossed critical threshold. Rent is due tomorrow. Immediate emotional support required.",
        tone: "critical",
        sortOrder: 4,
      },
      {
        id: "sofia-escalated",
        title: "Case escalated — human agent required",
        timestamp: "Today · 9:52 AM",
        detail: "Jacob escalated to Jeff Comstock for dispute authorization and immediate customer support.",
        tone: "critical",
        sortOrder: 5,
      },
    ],
    customerHistory: [
      // ── Phase 1: Account History ────────────────────────────────────────────
      {
        id: "sofia-h1",
        type: "registration",
        phase: "Account History",
        title: "Checking account opened",
        timestamp: "Mar 2015",
        detail: "Sofia opened a personal checking account and linked a debit card. No prior fraud history. Initial deposit of $800.",
        dot: "green",
        meta: [
          { label: "Customer ID", value: "CST-12045" },
          { label: "Account", value: "Checking ****7714" },
          { label: "Opened", value: "March 2015" },
          { label: "Initial deposit", value: "$800.00" },
          { label: "Branch", value: "Phoenix — W McDowell Rd" },
        ],
        interaction: {
          kind: "registration",
          fields: [
            { label: "Customer ID", value: "CST-12045" },
            { label: "Name", value: "Sofia Martinez" },
            { label: "Email", value: "sofia.martinez@email.com" },
            { label: "Phone", value: "(602) 555-0147" },
            { label: "Address", value: "1134 W McDowell Rd, Phoenix, AZ 85007" },
            { label: "Account type", value: "Personal Checking" },
            { label: "Account number", value: "****7714" },
            { label: "Debit card issued", value: "Yes — Visa Debit ****7714" },
            { label: "Initial deposit", value: "$800.00" },
            { label: "Branch", value: "Phoenix — W McDowell Rd" },
            { label: "Opened", value: "March 12, 2015" },
          ],
        },
      },
      {
        id: "sofia-h2",
        type: "system",
        title: "11-year customer — zero disputes",
        timestamp: "Mar 2015 – Mar 2026",
        detail: "Sofia has maintained her checking account for 11 years with no fraud disputes, chargebacks, or overdraft incidents on record. Consistent monthly deposits and regular spending patterns.",
        dot: "green",
        meta: [
          { label: "Tenure", value: "11 years" },
          { label: "Fraud disputes", value: "0" },
          { label: "Chargebacks", value: "0" },
          { label: "Overdrafts", value: "0" },
          { label: "Avg monthly deposits", value: "~$3,200" },
        ],
        interaction: {
          kind: "ticket",
          ticketId: "CST-12045 — Account History",
          subject: "11-year account history summary",
          notes: [
            { author: "System", time: "As of Apr 20, 2026", isInternal: true, text: "Account CST-12045 active since March 2015. 11 years of clean account history: zero fraud disputes, zero chargebacks, zero overdraft incidents. Consistent spending patterns — monthly deposits averaging $3,200, routine transactions at grocery, gas, dining, and utilities. Customer flagged as low-risk. First fraud incident recorded today (Apr 20, 2026)." },
          ],
        },
      },

      // ── Phase 2: Normal Activity ────────────────────────────────────────────
      {
        id: "sofia-h3",
        type: "system",
        phase: "Normal Activity",
        title: "Legitimate transactions — this morning",
        timestamp: "Today · 7:15 AM – 8:30 AM",
        detail: "Two routine transactions confirmed as Sofia's own: $67.42 at Safeway (grocery) and $5.89 at Dutch Bros Coffee. These match her established spending patterns and were not flagged.",
        dot: "green",
        meta: [
          { label: "Transaction 1", value: "$67.42 — Safeway #2281, Phoenix AZ · 7:15 AM" },
          { label: "Transaction 2", value: "$5.89 — Dutch Bros Coffee, Phoenix AZ · 8:30 AM" },
          { label: "Status", value: "Both confirmed legitimate — not disputed" },
        ],
        interaction: {
          kind: "ticket",
          ticketId: "TXN-LEGIT-042026",
          subject: "Legitimate transactions — Apr 20, 2026",
          notes: [
            { author: "System (Fraud Engine)", time: "Today · 9:44 AM", isInternal: true, text: "Reviewed 4 transactions from the past 6 hours. 2 flagged as legitimate based on location, merchant history, and spending pattern match:\n• $67.42 — Safeway #2281, 1400 W McDowell Rd, Phoenix AZ · 7:15 AM — LEGITIMATE\n• $5.89 — Dutch Bros Coffee, Phoenix AZ · 8:30 AM — LEGITIMATE\n\n2 flagged as anomalous (see fraud detection tickets)." },
          ],
        },
      },

      // ── Phase 3: Fraud Detected ─────────────────────────────────────────────
      {
        id: "sofia-h4",
        type: "ticket",
        phase: "Fraud Detected",
        title: "Unauthorized charge — $1,847.32 — TechXpress Electronics",
        timestamp: "Today · 8:58 AM",
        detail: "A $1,847.32 charge from TechXpress Electronics in Orlando, FL appeared on Sofia's debit card. The merchant, location, and amount are outside all established spending patterns. No prior transactions in Florida on record.",
        dot: "red",
        meta: [
          { label: "Amount", value: "$1,847.32" },
          { label: "Merchant", value: "TechXpress Electronics — Orlando, FL" },
          { label: "Time", value: "Apr 20, 2026 · 8:58 AM" },
          { label: "Card used", value: "Visa Debit ****7714" },
          { label: "Flag", value: "Out-of-state, unknown merchant, high value" },
        ],
        interaction: {
          kind: "ticket",
          ticketId: "FRD-04201",
          subject: "Suspicious transaction — $1,847.32 — TechXpress Electronics",
          notes: [
            { author: "System (Fraud Engine)", time: "Today · 9:44 AM", isInternal: true, text: "Flagged: $1,847.32 charge posted to debit card ****7714 at 8:58 AM. Merchant: TechXpress Electronics, 4800 E Colonial Dr, Orlando, FL 32803. Card present transaction. Risk factors: (1) out-of-state merchant, no prior FL transactions on record, (2) merchant category code 5732 — electronics, never used by this customer, (3) amount >50% of available balance, (4) followed by second charge at same merchant 12 minutes later. Anomaly score: 97/100." },
          ],
        },
      },
      {
        id: "sofia-h5",
        type: "ticket",
        title: "Unauthorized charge — $312.15 — TechXpress Electronics",
        timestamp: "Today · 9:10 AM",
        detail: "A second charge of $312.15 from the same out-of-state electronics retailer appeared 12 minutes after the first. The rapid back-to-back pattern from an unknown merchant triggered automatic fraud escalation.",
        dot: "red",
        customerMessage: "Wait — I didn't make any of those purchases. I haven't been to any electronics store, and definitely not out of state.",
        meta: [
          { label: "Amount", value: "$312.15" },
          { label: "Merchant", value: "TechXpress Electronics — Orlando, FL" },
          { label: "Time", value: "Apr 20, 2026 · 9:10 AM (12 min after first charge)" },
          { label: "Card used", value: "Visa Debit ****7714" },
          { label: "Flag", value: "Repeat merchant, rapid succession — auto-escalated" },
        ],
        interaction: {
          kind: "ticket",
          ticketId: "FRD-04202",
          subject: "Suspicious transaction — $312.15 — TechXpress Electronics (follow-up charge)",
          notes: [
            { author: "System (Fraud Engine)", time: "Today · 9:44 AM", isInternal: true, text: "Flagged: $312.15 charge posted to debit card ****7714 at 9:10 AM — same merchant as FRD-04201 (TechXpress Electronics, Orlando FL), 12 minutes later. Two-charge pattern at unknown out-of-state electronics merchant is consistent with card testing or split-purchase fraud. Combined unauthorized exposure: $2,159.47. Escalation threshold met — proactive customer contact initiated." },
          ],
        },
      },
      {
        id: "sofia-h6",
        type: "ticket",
        title: "Behavioral anomaly confirmed — fraud engine alert",
        timestamp: "Today · 9:44 AM",
        detail: "Jacob's fraud detection engine reviewed 6 hours of transaction data and confirmed a behavioral anomaly. Two out-of-state charges totaling $2,159.47 from an unknown electronics retailer triggered a critical alert and proactive customer outreach.",
        dot: "orange",
        meta: [
          { label: "Ticket #", value: "FRD-04203" },
          { label: "Anomaly score", value: "97/100 — Critical" },
          { label: "Transactions flagged", value: "2 (FRD-04201, FRD-04202)" },
          { label: "Total exposure", value: "$2,159.47" },
          { label: "Action", value: "Proactive chat initiated with customer" },
        ],
        interaction: {
          kind: "ticket",
          ticketId: "FRD-04203",
          subject: "Behavioral anomaly — fraud engine critical alert",
          notes: [
            { author: "Jacob (Fraud Engine)", time: "Today · 9:44 AM", isInternal: true, text: "Behavioral anomaly confirmed. Analysis window: 6 hours. Total transactions reviewed: 4. Legitimate: 2 (grocery $67.42, coffee $5.89). Fraudulent: 2 (TechXpress Electronics, FL — $1,847.32 + $312.15 = $2,159.47). Pattern match: card-present fraud at out-of-state retailer. No prior merchant relationship. Anomaly score: 97/100 — Critical. Action: initiating proactive secure chat with account holder." },
            { author: "System", time: "Today · 9:44 AM", isInternal: true, text: "Proactive contact triggered. Secure chat session opened with sofia.martinez@email.com. Card ****7714 flagged for monitoring — not yet blocked pending customer confirmation." },
          ],
        },
      },

      // ── Phase 4: Current Case ───────────────────────────────────────────────
      {
        id: "sofia-h7",
        type: "chat",
        phase: "Current Case",
        title: "Proactive fraud alert chat — Jacob",
        timestamp: "Today · 9:45 AM",
        detail: "Jacob proactively opened a secure chat with Sofia to review the flagged transactions. Sofia confirmed she did not make the two charges. She disclosed that rent is due tomorrow, escalating urgency significantly.",
        dot: "blue",
        customerMessage: "This is outrageous. I've been a customer for 11 years and this is how I find out my account has been robbed?",
        meta: [
          { label: "Channel", value: "Secure in-app chat (proactive)" },
          { label: "Bot", value: "Jacob — Fraud Detection" },
          { label: "Outcome", value: "Both charges confirmed unauthorized — escalated" },
          { label: "Urgency", value: "Rent due tomorrow — provisional credit required" },
        ],
        interaction: {
          kind: "chat",
          botName: "Jacob",
          messages: [
            { sender: "bot", name: "Jacob", text: "Hi Sofia — we've detected activity on your account that doesn't match your usual patterns. I want to make sure you're protected. Can you take a moment to review a few transactions with me?", time: "9:45 AM" },
            { sender: "customer", name: "Sofia Martinez", text: "Sure, what's going on?", time: "9:46 AM" },
            { sender: "bot", name: "Jacob", text: "I've flagged 4 transactions from the past 6 hours. Two look like yours — a grocery store and a coffee shop. But I'm seeing a $1,847 charge from an electronics retailer in another state, posted 40 minutes ago. And then a $312 charge from the same location, just 12 minutes later.", time: "9:47 AM" },
            { sender: "customer", name: "Sofia Martinez", text: "Wait — I didn't make any of those purchases. I haven't been to any electronics store, and definitely not out of state. This is really upsetting.", time: "9:48 AM" },
            { sender: "bot", name: "Jacob", text: "I completely understand how upsetting this is, and I want you to know we're going to take care of this right now. These charges are being flagged as fraudulent and I'm escalating your case immediately to a specialist who can authorize the dispute and walk you through next steps.", time: "9:50 AM" },
            { sender: "customer", name: "Sofia Martinez", text: "This is outrageous. I've been a customer for 11 years and this is how I find out my account has been robbed?? I want to speak to someone who can actually FIX this right now.", time: "9:51 AM" },
            { sender: "bot", name: "Jacob", text: "I'm going to transfer you to a live customer service agent, please hold.", time: "9:52 AM" },
          ],
        },
      },
      {
        id: "sofia-h8",
        type: "ticket",
        title: "2 transactions confirmed fraudulent",
        timestamp: "Today · 9:48 AM",
        detail: "Sofia confirmed she did not initiate either charge from TechXpress Electronics. Both transactions ($1,847.32 + $312.15) formally flagged as unauthorized. Card ****7714 queued for block pending agent authorization.",
        dot: "red",
        meta: [
          { label: "Confirmed unauthorized", value: "$1,847.32 + $312.15 = $2,159.47" },
          { label: "Customer confirmation", value: "Verbal — did not visit any electronics retailer" },
          { label: "Card status", value: "Flagged — block pending agent authorization" },
          { label: "Next step", value: "Dispute authorization + provisional credit" },
        ],
        interaction: {
          kind: "ticket",
          ticketId: "FRD-04204",
          subject: "Transactions confirmed fraudulent — dispute initiated",
          notes: [
            { author: "Jacob (Fraud Engine)", time: "Today · 9:48 AM", isInternal: true, text: "Customer confirmed via secure chat: neither TechXpress Electronics charge was authorized. Confirmation recorded. Both transactions (FRD-04201: $1,847.32, FRD-04202: $312.15) updated to status: Confirmed Fraudulent. Total disputed: $2,159.47." },
            { author: "Jacob (Fraud Engine)", time: "Today · 9:48 AM", isInternal: true, text: "Card ****7714 queued for immediate block. Awaiting human agent authorization. Dispute case FRD-04204 opened. Provisional credit of $2,159.47 recommended — customer has disclosed rent payment due tomorrow (Apr 21, 2026). Critical urgency." },
          ],
        },
      },
      {
        id: "sofia-h9",
        type: "system",
        title: "Customer distress flagged — critical sentiment",
        timestamp: "Today · 9:50 AM",
        detail: "Sofia's sentiment score crossed the critical threshold during the chat. Combined financial stress (rent due tomorrow, $2,159 missing) and emotional distress triggered mandatory escalation flag.",
        dot: "orange",
        meta: [
          { label: "Sentiment score", value: "Critical (threshold exceeded)" },
          { label: "Trigger", value: "Rent due tomorrow + $2,159 unauthorized exposure" },
          { label: "Flag", value: "Mandatory escalation — human agent required" },
        ],
        interaction: {
          kind: "ticket",
          ticketId: "SNT-09204",
          subject: "Critical sentiment — mandatory escalation triggered",
          notes: [
            { author: "System (Sentiment Engine)", time: "Today · 9:50 AM", isInternal: true, text: "Customer sentiment score crossed critical threshold (score: 91/100). Trigger: customer disclosed rent payment of ~$1,100 due April 21, 2026 — the following day. Combined with $2,159.47 unauthorized exposure on primary checking account (available balance: $2,121.00 before charges), customer may be unable to meet rent obligation without same-day provisional credit. Mandatory escalation to human agent required." },
          ],
        },
      },
      {
        id: "sofia-h10",
        type: "handoff",
        title: "Escalated to Jeff Comstock — fraud specialist",
        timestamp: "Today · 9:52 AM",
        detail: "Jacob escalated to Jeff Comstock (Fraud & Security Specialist) to authorize the dispute, apply provisional credit of $2,159.47, block card ****7714, and issue a replacement card. Rent deadline tomorrow adds critical urgency.",
        dot: "red",
        customerMessage: "I want to speak to someone who can actually FIX this right now.",
        meta: [
          { label: "Case #", value: "CST-12045" },
          { label: "Escalated to", value: "Jeff Comstock — Fraud & Security Specialist" },
          { label: "Actions required", value: "Authorize dispute, provisional credit, block card, issue replacement" },
          { label: "Provisional credit", value: "$2,159.47" },
          { label: "Urgency", value: "Rent due Apr 21 — same-day resolution required" },
        ],
        interaction: {
          kind: "ticket",
          ticketId: "CST-12045",
          subject: "Escalation — fraud dispute, provisional credit, card block",
          notes: [
            { author: "Jacob (Fraud Engine)", time: "Today · 9:52 AM", isInternal: true, text: "Transferring to fraud specialist. Context: 11-year customer, first fraud dispute — two unauthorized charges ($1,847.32 + $312.15 = $2,159.47) from TechXpress Electronics, Orlando FL. Card-present fraud at unknown out-of-state merchant. Customer confirmed both unauthorized. Rent payment due tomorrow (Apr 21). Actions required: (1) authorize dispute on FRD-04204, (2) apply provisional credit $2,159.47 immediately, (3) block card ****7714, (4) issue replacement card to address on file. Goodwill acknowledgment recommended — 11-year clean history." },
            { author: "System", time: "Today · 9:52 AM", isInternal: true, text: "Case CST-12045 assigned to Jeff Comstock (Fraud & Security Specialist). Priority: Critical. Customer is live in chat and awaiting response." },
          ],
        },
      },
    ],
    queue: {
      time: "8m ago",
      preview: "Proactive fraud alert — 2 unauthorized transactions totaling $2,159 detected",
      priority: "Critical",
      priorityClassName: "border-[#E53935] bg-[#FDEAEA] text-[#C71D1A]",
      badgeColor: "bg-[#E32926]",
      icon: "messageSquare",
      isActive: false,
      createdAt: "2026-04-20T09:45:00",
      updatedAt: "2026-04-20T09:52:00",
    },
    escalationResponses: [
      "I completely understand, Sofia, and I'm so sorry this has happened. I want to assure you we are taking this seriously. I'm initiating a dispute for both fraudulent transactions right now and will have a resolution specialist on this immediately.",
      "The dispute has been filed and you'll receive a confirmation number by email. To protect your account, I'd also like to send you a replacement card — could you confirm your current mailing address so I can get that issued for you right away?",
      "Thank you, Sofia. I've applied a temporary credit of $2,159 to your account, your balance will be restored while we complete our investigation. You'll be able to make your rent payment without any issue. We've also permanently blocked your current card and are issuing a new one to your address on file. Is there anything else I can help you with?",
    ],
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 9:45 AM",
        draft: "",
        messages: [
          {
            id: 1,
            role: "agent",
            author: "Jacob",
            content: "Hi Sofia — we've detected activity on your account that doesn't match your usual patterns. I want to make sure you're protected. Can you take a moment to review a few transactions with me?",
            time: "9:45 AM",
          },
          {
            id: 2,
            role: "customer",
            content: "Sure, what's going on?",
            time: "9:46 AM",
          },
          {
            id: 3,
            role: "agent",
            author: "Jacob",
            content: "I've flagged 4 transactions from the past 6 hours. Two look like yours — a grocery store and a coffee shop. But I'm seeing a $1,847 charge from an electronics retailer in another state, posted 40 minutes ago. And then a $312 charge from the same location, just 12 minutes later.",
            time: "9:47 AM",
          },
          {
            id: 4,
            role: "customer",
            content: "Wait — I didn't make any of those purchases. I haven't been to any electronics store, and definitely not out of state. This is really upsetting.",
            time: "9:48 AM",
            sentiment: "frustrated",
          },
          {
            id: 5,
            role: "agent",
            author: "Jacob",
            content: "I completely understand how upsetting this is, and I want you to know we're going to take care of this right now. These charges are being flagged as fraudulent and I'm escalating your case immediately to a specialist who can authorize the dispute and walk you through next steps.",
            time: "9:50 AM",
          },
          {
            id: 6,
            role: "customer",
            content: "This is outrageous. I've been a customer for 11 years and this is how I find out my account has been robbed?? I want to speak to someone who can actually FIX this right now.",
            time: "9:51 AM",
            sentiment: "critical",
          },
          {
            id: 7,
            role: "agent",
            author: "Jacob",
            content: "Transferring to a fraud specialist now. Context: 11-year customer, first fraud dispute — two unauthorized charges ($1,847 + $312) from an out-of-state electronics retailer within 12 minutes of each other. Rent payment due tomorrow. Actions needed: authorize dispute, apply provisional credit, block current card, issue replacement.",
            time: "9:52 AM",
            isInternal: true,
            isHandoffCard: true,
          },
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 9:45 AM",
        draft: "Hi Sofia — I've reviewed the two disputed charges ($1,847 and $312) and I'm ready to begin the formal dispute process. Can you confirm you'd like to proceed?",
        messages: [
          { id: 1, role: "customer", content: "I just got an alert about charges I didn't make. Can someone help me?", time: "9:45 AM" },
          { id: 2, role: "agent",
 author: "Jacob", content: "Hi Sofia — I can see two flagged transactions on your account. I'm escalating to a fraud specialist right now.", time: "9:47 AM" },
          { id: 3, role: "customer", content: "Please hurry — my rent is due tomorrow and I can't afford to have this money missing.", time: "9:49 AM", sentiment: "frustrated" },
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 9:45 AM",
        draft: "Sofia, I've flagged both transactions for dispute. A specialist will be with you shortly to authorise the provisional credit given your rent deadline.",
        messages: [
          { id: 1, role: "customer", content: "Someone used my card — two charges from an electronics store out of state. I didn't do this.", time: "9:45 AM" },
          { id: 2, role: "agent",
 author: "Jacob", content: "I can see those transactions and they've been flagged. I'm getting a specialist to help you immediately.", time: "9:46 AM" },
          { id: 3, role: "customer", content: "Thank you — please make this fast, I have rent due tomorrow.", time: "9:48 AM", sentiment: "frustrated" },
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 9:45 AM",
        draft: "Hi Sofia — I've reviewed the two unauthorized transactions ($1,847 and $312) on your account. I'm escalating your case to a fraud specialist who can authorize the dispute and apply a provisional credit given the urgency.",
        messages: [
          { id: 1, role: "customer", content: "Subject: Unauthorized charges on my account\n\nHello, I've just been alerted to two charges I did not make — $1,847 and $312 from an electronics retailer. Please help me dispute these immediately.", time: "9:45 AM" },
          { id: 2, role: "agent",
 author: "Jacob", content: "Hi Sofia — I've reviewed both transactions and they've been flagged as suspicious. I'm escalating this to our fraud team now.", time: "9:47 AM" },
          { id: 3, role: "customer", content: "Please act fast — I have rent due tomorrow and this money needs to be back in my account.", time: "9:49 AM", sentiment: "frustrated" },
        ],
      },
    },
    resolveFlow: {
      type: "supervisor",
      steps: [
        "Updating case status to resolved",
        "Assigning to supervisor queue",
        "Notifying supervisor — Rachel Kim",
        "Removing from your active cases",
      ],
      supervisorName: "Rachel Kim",
    },
    customerSnapshot: [
      "2-year customer with focused investment goals",
      "Primary account shows rapid growth",
      "No disputes; low risk profile",
      "Motivated by long-term wealth building",
      "Attends all advisor consultations; engaged participant",
    ],
  },
  {
    id: "jordan",
    initials: "JD",
    name: "Jordan Davis",
    customerId: "CST-11621",
    lastUpdated: "04/19/26 | 09:45 AM",
    profile: {
      department: "Residential",
      tenureYears: 2,
      totalAUM: "$89.99",
      financialReadiness: 68,
      financialAdvisor: "Jeff Comstock",
      advisorTitle: "Home Services Advisor",
      tags: ["Home Broadband", "CloudMesh Pro v3", "Fiber 500"],
      fraudRiskScore: 12,
      priorDisputeCount: 1,
      cardBlocked: false,
    },
    conversationTopics: [
      "Confirm port forwarding config backup before factory reset",
      "Complete firmware update to CloudMesh Pro v3 4.1.2",
      "Verify connection stability post-reset",
    ],
    contact: {
      email: "jordan.davis@email.com",
      phone: "(512) 555-0183",
      address: { street: "2847 Ridgewood Dr", city: "Austin", state: "TX", zip: "78704", country: "US" },
    },
    accounts: [
      { id: "jd-plan", type: "Checking", number: "****3821", balance: "$89.99", availableBalance: "$89.99", status: "active", openedDate: "Feb 2024" },
    ],
    overview: {
      contactNumber: "(512) 555-0183",
      assignedAgent: "Jeff Comstock",
      pronoun: "he",
      lastContactTime: "Today, 9:44 AM",
      address: "2847 Ridgewood Dr, Austin, TX 78704",
    },
    interactionTimeline: [
      {
        id: "jordan-telemetry",
        title: "Diagnostic telemetry reviewed",
        timestamp: "Today · 9:33 AM",
        detail: "Aria pulled 24h of router diagnostics; firmware mismatch detected — running 4.0.8, stable is 4.1.2.",
        tone: "warning",
        sortOrder: 1,
      },
      {
        id: "jordan-chat-open",
        title: "Customer opened live chat",
        timestamp: "Today · 9:33 AM",
        detail: "Jordan reported router dropping all connections after 3 reboots.",
        tone: "default",
        sortOrder: 2,
      },
      {
        id: "jordan-reset-started",
        title: "AI agent initiated guided reset",
        timestamp: "Today · 9:35 AM",
        detail: "Aria began a step-by-step guided factory reset sequence with Jordan, confirming each action in real time.",
        tone: "info",
        sortOrder: 3,
      },
      {
        id: "jordan-port-forward-concern",
        title: "Reset paused — port forwarding concern raised",
        timestamp: "Today · 9:41 AM",
        detail: "Jordan asked about preserving custom port forwarding rules before factory reset — critical for his home office setup.",
        tone: "critical",
        sortOrder: 4,
      },
      {
        id: "jordan-flagged",
        title: "Conversation flagged for human assist",
        timestamp: "Today · 9:42 AM",
        detail: "Aria flagged firmware-specific backup behavior as outside its confidence threshold and requested human intervention.",
        tone: "warning",
        sortOrder: 5,
      },
      {
        id: "jordan-escalated",
        title: "Case escalated — awaiting firmware backup confirmation",
        timestamp: "Today · 9:44 AM",
        detail: "Human agent required to confirm CloudMesh Pro v3 config backup behavior before reset proceeds.",
        tone: "critical",
        sortOrder: 6,
      },
    ],
    customerHistory: [
      // ── Phase 1: Research ─────────────────────────────────────────────────
      {
        id: "jordan-h1",
        type: "search",
        phase: "Research",
        title: "Searched for home-office fiber routers",
        timestamp: "Feb 2024",
        detail: "Jordan searched Google for the best routers for a home-office fiber setup and followed a WirelessReview.com link comparing gigabit-ready options.",
        dot: "gray",
        meta: [
          { label: "Query", value: "best routers for home office fiber internet 2023" },
          { label: "Result clicked", value: "WirelessReview.com — Top 10 Routers for Gigabit Fiber" },
          { label: "Time on page", value: "~3 min" },
        ],
        interaction: {
          kind: "search",
          query: "best routers for home office fiber internet 2023",
          results: [
            { title: "WirelessReview.com — Top 10 Routers for Gigabit Fiber", url: "wirelessreview.com/top-10-routers-gigabit-fiber", snippet: "Comparing the best routers for fiber internet speeds — our top pick for Gigabit+ plans is the CloudMesh Pro v3, praised for port forwarding flexibility and throughput stability.", clicked: true },
            { title: "Tom's Hardware — Best Wi-Fi Routers for Home Offices 2023", url: "tomshardware.com/best-picks/best-home-office-routers", snippet: "From budget to premium, these are the routers worth buying for home offices and remote workers needing low latency and VPN support." },
            { title: "Reddit r/HomeNetworking — Fiber router recommendations", url: "reddit.com/r/HomeNetworking/fiber-router-rec", snippet: "\"I switched to Fiber 500 and needed something that could handle my NAS and VPN ports — ended up with the CloudMesh Pro v3 after months of research.\"" },
            { title: "PCMag — Best Routers for Gigabit Internet 2023", url: "pcmag.com/picks/best-gigabit-routers", snippet: "Whether you're on a Fiber 500 or Fiber 1Gig plan, these routers deliver the speed, range, and advanced features you need." },
          ],
        },
      },
      {
        id: "jordan-h2",
        type: "search",
        title: "Searched CloudMesh Pro v3 reviews",
        timestamp: "Feb 2024",
        detail: "Jordan searched specifically for CloudMesh Pro v3 reviews focusing on port forwarding — a key requirement for his home-office VPN and NAS setup.",
        dot: "gray",
        meta: [
          { label: "Query", value: "CloudMesh Pro v3 review port forwarding" },
          { label: "Result clicked", value: "cloudmesh.com — Pro v3 product page (specifications)" },
          { label: "Section viewed", value: "Port forwarding & advanced networking" },
        ],
        interaction: {
          kind: "search",
          query: "CloudMesh Pro v3 review port forwarding",
          results: [
            { title: "cloudmesh.com — Pro v3 Product Page (Specifications)", url: "cloudmesh.com/products/pro-v3/specs", snippet: "The CloudMesh Pro v3 supports up to 32 custom port forwarding rules, all firmware-managed via the admin panel. Includes QoS, VPN passthrough, and VLAN segmentation.", clicked: true },
            { title: "TechRadar — CloudMesh Pro v3 Review", url: "techradar.com/reviews/cloudmesh-pro-v3", snippet: "An excellent router for power users needing granular networking controls. Port forwarding works flawlessly with up to 32 active rules under firmware 4.0+." },
            { title: "r/HomeNetworking — CloudMesh Pro v3 port forwarding issues?", url: "reddit.com/r/HomeNetworking/cloudmesh-pf-issues", snippet: "\"Works perfectly for me on firmware 4.0+ with NAS and Plex ports — just make sure you back up your config before any firmware update.\"" },
            { title: "SmallNetBuilder — CloudMesh Pro v3 In-Depth", url: "smallnetbuilder.com/cloudmesh-pro-v3-review", snippet: "Advanced networking features are well above average for this price point. The firmware UI is clean and rule management is intuitive." },
          ],
        },
      },
      {
        id: "jordan-h3",
        type: "web",
        title: "Compared CloudMesh Pro v3 vs competitors",
        timestamp: "Feb 2024",
        detail: "Jordan visited Reddit r/HomeNetworking and compared CloudMesh Pro v3 against Netgear Orbi before returning to the CloudMesh product page to review pricing.",
        dot: "gray",
        meta: [
          { label: "Query", value: "CloudMesh Pro v3 vs Netgear Orbi home office" },
          { label: "Community", value: "Reddit r/HomeNetworking (7 min, 3 thread links)" },
          { label: "Follow-up", value: "Returned to cloudmesh.com — pricing & compatibility" },
        ],
        interaction: {
          kind: "web",
          url: "reddit.com/r/HomeNetworking/cloudmesh-vs-orbi-home-office",
          title: "CloudMesh Pro v3 vs Netgear Orbi — home office setup?",
          description: "Jordan spent ~7 minutes reading a community thread comparing CloudMesh Pro v3 against Netgear Orbi for home offices requiring NAS and VPN port forwarding.",
          sectionsViewed: [
            "Top comment — CloudMesh port forwarding vs Orbi comparison (3 min)",
            "Reply thread — firmware stability on Orbi vs CloudMesh (2 min)",
            "cloudmesh.com — Pricing & compatibility page (follow-up, 2 min)",
          ],
        },
      },

      // ── Phase 2: Pre-Purchase Chat ────────────────────────────────────────
      {
        id: "jordan-h4",
        type: "chat",
        phase: "Pre-Purchase",
        title: "Pre-purchase bot chat — port forwarding query",
        timestamp: "Feb 2024",
        detail: "Jordan started a chat on CloudMesh.com asking whether the Pro v3 supports custom port forwarding for a home office. Bot confirmed up to 32 custom rules, firmware-managed. Jordan also asked about warranty (2-yr limited) and self-setup feasibility.",
        dot: "blue",
        customerMessage: "Does the Pro v3 support custom port forwarding rules for a home office setup?",
        meta: [
          { label: "Channel", value: "CloudMesh.com website chat" },
          { label: "Bot", value: "CloudMesh Sales Assistant" },
          { label: "Topics covered", value: "Port forwarding limits, warranty, self-install, Fiber 500 compatibility" },
          { label: "Outcome", value: "Confirmed Pro v3 recommended for Fiber 500 tier" },
        ],
        interaction: {
          kind: "chat",
          botName: "CloudMesh Sales Assistant",
          messages: [
            { sender: "bot", name: "CloudMesh Sales Assistant", text: "Hi there! I'm the CloudMesh Sales Assistant. How can I help you today?", time: "10:14 AM" },
            { sender: "customer", name: "Jordan Davis", text: "Does the Pro v3 support custom port forwarding rules for a home office setup?", time: "10:14 AM" },
            { sender: "bot", name: "CloudMesh Sales Assistant", text: "Great question! Yes — the CloudMesh Pro v3 supports up to 32 custom port forwarding rules, all firmware-managed through the admin panel. You can configure rules for specific devices, ports, and protocols.", time: "10:15 AM" },
            { sender: "customer", name: "Jordan Davis", text: "Perfect. And what's the warranty on it?", time: "10:15 AM" },
            { sender: "bot", name: "CloudMesh Sales Assistant", text: "The Pro v3 comes with a 2-year limited warranty covering hardware defects. Extended coverage is also available through CloudMesh Care+.", time: "10:16 AM" },
            { sender: "customer", name: "Jordan Davis", text: "Can I set it up myself or do I need a technician?", time: "10:17 AM" },
            { sender: "bot", name: "CloudMesh Sales Assistant", text: "The Pro v3 is designed for self-installation! The CloudMesh mobile app walks you through every step — most customers are up and running in under 20 minutes. If you run into any issues, our support team is available 24/7.", time: "10:17 AM" },
            { sender: "customer", name: "Jordan Davis", text: "I'm on a Fiber 500 plan — is it compatible?", time: "10:18 AM" },
            { sender: "bot", name: "CloudMesh Sales Assistant", text: "Absolutely — the Pro v3 is optimized for Fiber 500 and above, with throughput up to 2.5 Gbps on the WAN port. It's our recommended device for that tier.", time: "10:18 AM" },
          ],
        },
      },

      // ── Phase 3: Purchase & Shipping ──────────────────────────────────────
      {
        id: "jordan-h5",
        type: "purchase",
        phase: "Purchase & Shipping",
        title: "CloudMesh Pro v3 purchased",
        timestamp: "Feb 2024",
        detail: "Jordan placed an order for the CloudMesh Pro v3 at $189.00, paid by Visa ending 4422. Order confirmation sent to jordan.davis@email.com.",
        dot: "green",
        meta: [
          { label: "Order #", value: "CM-40291" },
          { label: "Amount", value: "$189.00" },
          { label: "Payment", value: "Visa ****4422" },
          { label: "Status", value: "Confirmed" },
        ],
        interaction: {
          kind: "purchase",
          orderId: "CM-40291",
          items: [{ name: "CloudMesh Pro v3 Router", qty: 1, price: "$189.00" }],
          total: "$189.00",
          paymentMethod: "Visa ****4422",
          shippingAddress: "Jordan Davis · 4821 Maple Creek Dr, Portland OR 97201",
        },
      },
      {
        id: "jordan-h6",
        type: "shipping",
        title: "Router shipped — FedEx",
        timestamp: "Feb 2024",
        detail: "CloudMesh Pro v3 shipped via FedEx. Jordan received a shipping confirmation and tracking number. The following day he contacted support about a tracking delay — resolved within 24 hours.",
        dot: "gray",
        customerMessage: "My tracking says 'in transit' but it hasn't moved in 24 hours — is it delayed?",
        meta: [
          { label: "Carrier", value: "FedEx" },
          { label: "Tracking #", value: "779004821355" },
          { label: "Estimated delivery", value: "3 business days" },
          { label: "Delay query", value: "Bot confirmed no weather alerts; advised 24hr patience" },
        ],
        interaction: {
          kind: "shipping",
          carrier: "FedEx",
          trackingNumber: "779004821355",
          events: [
            { status: "Delivered", location: "Portland, OR — Front Door", time: "Feb 19, 2024 · 2:18 PM", isDelivered: true },
            { status: "Out for Delivery", location: "Portland, OR", time: "Feb 19, 2024 · 7:45 AM" },
            { status: "In Transit", location: "Portland, OR Hub", time: "Feb 18, 2024 · 11:30 PM" },
            { status: "In Transit — No movement (24 hr)", location: "Salt Lake City, UT Hub", time: "Feb 17, 2024 · 3:02 AM" },
            { status: "Departed FedEx Facility", location: "Memphis, TN", time: "Feb 15, 2024 · 9:45 PM" },
            { status: "Label Created", location: "CloudMesh Fulfillment — Austin, TX", time: "Feb 14, 2024 · 2:30 PM" },
          ],
        },
      },
      {
        id: "jordan-h7",
        type: "shipping",
        title: "Package delivered",
        timestamp: "Feb 2024",
        detail: "FedEx confirmed delivery — signed for at Jordan's front door. No damage reported.",
        dot: "green",
        meta: [
          { label: "Status", value: "Delivered — signature confirmed" },
          { label: "Condition", value: "No damage reported" },
        ],
        interaction: {
          kind: "shipping",
          carrier: "FedEx",
          trackingNumber: "779004821355",
          events: [
            { status: "Delivered — Signature: J. Davis", location: "Portland, OR — Front Door", time: "Feb 19, 2024 · 2:18 PM", isDelivered: true },
            { status: "Out for Delivery", location: "Portland, OR", time: "Feb 19, 2024 · 7:45 AM" },
            { status: "In Transit", location: "Portland, OR Hub", time: "Feb 18, 2024 · 11:30 PM" },
            { status: "Departed FedEx Facility", location: "Memphis, TN", time: "Feb 15, 2024 · 9:45 PM" },
          ],
        },
      },

      // ── Phase 4: Setup & Registration ─────────────────────────────────────
      {
        id: "jordan-h8",
        type: "registration",
        phase: "Setup & Registration",
        title: "Router registered — Fiber 500 provisioned",
        timestamp: "Feb 2024",
        detail: "Jordan registered the CloudMesh Pro v3 via the mobile app and linked it to his account. Fiber 500 provisioned — connection confirmed stable at 487 Mbps down / 493 Mbps up.",
        dot: "green",
        meta: [
          { label: "Serial #", value: "CMV3-8829-4401" },
          { label: "Plan", value: "Fiber 500" },
          { label: "Speed confirmed", value: "487 Mbps ↓ / 493 Mbps ↑" },
          { label: "Setup method", value: "Self-install via CloudMesh mobile app" },
        ],
        interaction: {
          kind: "registration",
          fields: [
            { label: "Product", value: "CloudMesh Pro v3" },
            { label: "Serial Number", value: "CMV3-8829-4401" },
            { label: "Account", value: "jordan.davis@email.com" },
            { label: "Service Plan", value: "Fiber 500" },
            { label: "Registration Date", value: "Feb 22, 2024" },
            { label: "Registered via", value: "CloudMesh Mobile App (iOS)" },
            { label: "Speed Test Result", value: "487 Mbps ↓ / 493 Mbps ↑ — PASSED" },
            { label: "Firmware at Setup", value: "4.0.6 (updated to 4.0.8 on Mar 3, 2024)" },
            { label: "Setup Status", value: "Complete" },
          ],
        },
      },
      {
        id: "jordan-h9",
        type: "chat",
        title: "Post-setup chat — config backup question",
        timestamp: "Feb 2024",
        detail: "After configuring 6 custom port forwarding rules for his NAS and work VPN, Jordan asked the support bot how to back up his configuration. Bot walked him through Settings → Advanced → Backup Config.",
        dot: "blue",
        customerMessage: "I've set up 6 custom port forwarding rules for my NAS and work VPN — how do I back these up?",
        meta: [
          { label: "Channel", value: "CloudMesh.com support chat" },
          { label: "Topic", value: "Config backup for 6 custom port forwarding rules" },
          { label: "Resolution", value: "Agent demonstrated admin panel backup path" },
          { label: "Outcome", value: "Customer confirmed setup successful" },
        ],
        interaction: {
          kind: "chat",
          botName: "CloudMesh Support Bot",
          messages: [
            { sender: "bot", name: "CloudMesh Support Bot", text: "Welcome back, Jordan! How can I help you with your CloudMesh Pro v3 today?", time: "3:02 PM" },
            { sender: "customer", name: "Jordan Davis", text: "I've set up 6 custom port forwarding rules for my NAS and work VPN — how do I back these up?", time: "3:02 PM" },
            { sender: "bot", name: "CloudMesh Support Bot", text: "Great question! You can back up your entire router configuration — including all port forwarding rules — from the admin panel. Here's how:\n1. Open your browser and go to 192.168.1.1\n2. Log in with your admin credentials\n3. Navigate to Settings → Advanced → Backup Config\n4. Click 'Download Backup' to save a .json config file to your computer.", time: "3:03 PM" },
            { sender: "customer", name: "Jordan Davis", text: "Does this include all 6 of my port forwarding rules?", time: "3:04 PM" },
            { sender: "bot", name: "CloudMesh Support Bot", text: "Yes — the backup file includes all custom port forwarding rules, VLAN settings, QoS configurations, and Wi-Fi settings. You can restore from this file at any time.", time: "3:04 PM" },
            { sender: "customer", name: "Jordan Davis", text: "Perfect, downloaded it. Thanks!", time: "3:05 PM" },
            { sender: "bot", name: "CloudMesh Support Bot", text: "You're all set! Keep that file somewhere safe — it'll be very handy if you ever need to restore after a firmware reset. Is there anything else I can help with?", time: "3:05 PM" },
            { sender: "customer", name: "Jordan Davis", text: "No, that's it. Thanks.", time: "3:06 PM" },
          ],
        },
      },

      // ── Phase 5: Auto Diagnostic Tickets ─────────────────────────────────
      {
        id: "jordan-h10",
        type: "ticket",
        phase: "Diagnostic Tickets",
        title: "Auto ticket — intermittent packet loss detected",
        timestamp: "Oct 2025",
        detail: "System detected packet loss exceeding 2% over a 4-hour window on Jordan's CloudMesh Pro v3. Auto-ticket created and auto-closed after signal stabilized — no action taken.",
        dot: "orange",
        meta: [
          { label: "Ticket #", value: "CT-7741" },
          { label: "Trigger", value: "Packet loss >2% over 4hr window" },
          { label: "Device", value: "CloudMesh Pro v3 — Serial CMV3-8829-4401" },
          { label: "Status", value: "Auto-closed — signal self-stabilized" },
        ],
        interaction: {
          kind: "ticket",
          ticketId: "CT-7741",
          subject: "Intermittent packet loss detected — CloudMesh Pro v3",
          notes: [
            { author: "System (Auto)", time: "Oct 14, 2025 · 2:18 AM", isInternal: true, text: "Auto-generated ticket: Packet loss exceeded 2% threshold over a 4-hour monitoring window. Device: CloudMesh Pro v3 — Serial CMV3-8829-4401. Running firmware 4.0.8. No customer action required at this time." },
            { author: "System (Auto)", time: "Oct 14, 2025 · 6:44 AM", isInternal: true, text: "Signal stabilized. Packet loss returned to <0.1% sustained over 2-hour window. No root cause confirmed — possible ISP-side fluctuation. Ticket auto-closed. No customer notification sent." },
          ],
        },
      },
      {
        id: "jordan-h11",
        type: "email",
        title: "Firmware update notification — v4.1.2 available",
        timestamp: "Jan 2026",
        detail: "System detected Jordan's router running firmware 4.0.8 with stable release 4.1.2 available. Auto-notification sent to jordan.davis@email.com. Email was opened but the update link was not clicked.",
        dot: "orange",
        meta: [
          { label: "Ticket #", value: "CT-8103" },
          { label: "Current firmware", value: "4.0.8" },
          { label: "Available firmware", value: "4.1.2 (stable)" },
          { label: "Email status", value: "Opened — update link not clicked" },
          { label: "Status", value: "Open — pending customer action" },
        ],
        interaction: {
          kind: "email",
          from: "noreply@cloudmesh.com",
          to: "jordan.davis@email.com",
          subject: "Firmware Update Available: CloudMesh Pro v3 — v4.1.2",
          sentAt: "Jan 8, 2026 · 9:00 AM",
          opened: true,
          body: "Hi Jordan,\n\nA new stable firmware update (v4.1.2) is available for your CloudMesh Pro v3 (Serial: CMV3-8829-4401).\n\nCurrent version: 4.0.8\nNew version: 4.1.2 (Stable Release)\n\nWhat's new in 4.1.2:\n• Improved Wi-Fi stability under high concurrent connection loads\n• Fixed packet loss regression on Fiber 500+ plans with 4+ port forwarding rules\n• Security patches for CVE-2025-8841 and CVE-2025-9012\n• Improved config backup compatibility across firmware versions\n\nWe recommend updating at your earliest convenience. The update takes approximately 3 minutes and will briefly restart your router. Your settings and port forwarding rules will not be affected by this update.\n\n[ Update Now → ]\n\nQuestions? Visit support.cloudmesh.com or contact us 24/7 at 1-800-CLOUDMESH.\n\n— The CloudMesh Team",
        },
      },
      {
        id: "jordan-h12",
        type: "ticket",
        title: "Auto ticket — repeated restart cycles detected",
        timestamp: "Feb 2026",
        detail: "System detected 3 router reboots within a 6-hour window. Auto-ticket created as a potential indicator of hardware instability or firmware conflict. Auto-closed with no escalation requested.",
        dot: "orange",
        meta: [
          { label: "Ticket #", value: "CT-8819" },
          { label: "Trigger", value: "3 reboots in 6-hour window" },
          { label: "Flag", value: "Possible hardware instability or firmware issue" },
          { label: "Status", value: "Auto-closed — no escalation" },
        ],
        interaction: {
          kind: "ticket",
          ticketId: "CT-8819",
          subject: "Repeated restart cycles detected — possible firmware instability",
          notes: [
            { author: "System (Auto)", time: "Feb 3, 2026 · 11:45 PM", isInternal: true, text: "Auto-generated ticket: 3 router reboots detected within a 6-hour window. Device: CloudMesh Pro v3 — Serial CMV3-8829-4401. Current firmware: 4.0.8. Flag raised: Possible hardware instability or firmware conflict. No customer notification sent." },
            { author: "System (Auto)", time: "Feb 4, 2026 · 6:01 AM", isInternal: true, text: "No further reboots detected in 6-hour follow-up monitoring window. Pattern not sustained. Ticket auto-closed with no escalation. Note: firmware update CT-8103 still open and pending customer action. Correlated risk: elevated if disconnections recur." },
          ],
        },
      },
      {
        id: "jordan-h13",
        type: "ticket",
        title: "Auto ticket — 14 disconnections in 48 hrs (escalated)",
        timestamp: "Apr 2026",
        detail: "System detected 14 disconnection events in a 48-hour window. Correlated with firmware 4.0.8 known instability flag. Auto-escalated to 'Needs Review'. System email sent to Jordan — link not clicked.",
        dot: "red",
        meta: [
          { label: "Ticket #", value: "CT-9204" },
          { label: "Trigger", value: "14 disconnections in 48hrs" },
          { label: "Correlated flag", value: "Firmware 4.0.8 — known instability" },
          { label: "Email", value: "Sent to jordan.davis@email.com — link not clicked" },
          { label: "Status", value: "Open — Needs Review" },
        ],
        interaction: {
          kind: "ticket",
          ticketId: "CT-9204",
          subject: "14 disconnections in 48 hrs — escalated to Needs Review",
          notes: [
            { author: "System (Auto)", time: "Apr 28, 2026 · 4:12 AM", isInternal: true, text: "Auto-generated ticket: 14 connection drop events detected over 48-hour window. Device: CloudMesh Pro v3 — Serial CMV3-8829-4401. Firmware: 4.0.8." },
            { author: "System (Auto)", time: "Apr 28, 2026 · 4:12 AM", isInternal: true, text: "Correlation match: Firmware 4.0.8 — confirmed instability flag for Fiber 500+ plans with >4 active port forwarding rules. This device has 6 active rules. Escalation threshold exceeded." },
            { author: "System (Auto)", time: "Apr 28, 2026 · 4:13 AM", isInternal: true, text: "Ticket escalated to status: Needs Review. System email sent to jordan.davis@email.com with link to diagnostic report. Priority: High." },
            { author: "System (Auto)", time: "Apr 29, 2026 · 9:00 AM", isInternal: true, text: "Email opened at 9:02 AM — diagnostic report link not clicked. Customer has not initiated contact. Ticket remains Open — Needs Review. Related open ticket: CT-8103 (firmware update pending)." },
          ],
        },
      },

      // ── Phase 6: Current Case ─────────────────────────────────────────────
      {
        id: "jordan-h14",
        type: "web",
        phase: "Current Case",
        title: "Visited support site — searched factory reset guide",
        timestamp: "Today · 9:30 AM",
        detail: "Jordan visited support.cloudmesh.com and searched 'router keeps dropping connection', then clicked the 'Factory reset CloudMesh Pro v3' help article.",
        dot: "gray",
        meta: [
          { label: "Site", value: "support.cloudmesh.com" },
          { label: "Search query", value: "router keeps dropping connection" },
          { label: "Article clicked", value: "Factory reset CloudMesh Pro v3" },
        ],
        interaction: {
          kind: "web",
          url: "support.cloudmesh.com",
          title: "CloudMesh Support — Factory Reset Guide",
          description: "Jordan visited the CloudMesh support site and searched for help with his router dropping connections, then spent ~4 minutes reading the factory reset article.",
          sectionsViewed: [
            "Search: 'router keeps dropping connection' — 11 results returned",
            "Article: 'Factory reset CloudMesh Pro v3' (clicked — 4 min read)",
            "Section expanded: 'Will a factory reset delete my settings?'",
            "Section expanded: 'Port forwarding rules after reset' (left page without completing reset)",
          ],
        },
      },
      {
        id: "jordan-h15",
        type: "chat",
        title: "Live chat opened — connection drops reported",
        timestamp: "Today · 9:33 AM",
        detail: "Jordan initiated a chat with Aria reporting the router was dropping all connections. Aria pulled diagnostics and identified a firmware mismatch (4.0.8 vs stable 4.1.2), then initiated a guided factory reset sequence.",
        dot: "blue",
        customerMessage: "My router keeps dropping all my connections. I've tried restarting it but it keeps happening.",
        meta: [
          { label: "Channel", value: "CloudMesh.com website chat" },
          { label: "Bot", value: "Aria" },
          { label: "Issue reported", value: "Router dropping all connections after 3 reboots" },
          { label: "Diagnostics", value: "24hr telemetry pulled — firmware mismatch confirmed" },
        ],
        interaction: {
          kind: "chat",
          botName: "Aria",
          messages: [
            { sender: "bot", name: "Aria", text: "Hi Jordan! I'm Aria, your CloudMesh support assistant. I can see you've been reading our factory reset guide — are you having trouble with your router?", time: "9:33 AM" },
            { sender: "customer", name: "Jordan Davis", text: "My router keeps dropping all my connections. I've tried restarting it but it keeps happening.", time: "9:33 AM" },
            { sender: "bot", name: "Aria", text: "I'm sorry to hear that — let me pull up your device diagnostics right now.", time: "9:34 AM" },
            { sender: "bot", name: "Aria", text: "I've retrieved the last 24 hours of telemetry for your CloudMesh Pro v3 (Serial: CMV3-8829-4401). I can see 14 disconnection events in the past 48 hours. This pattern is consistent with a known instability affecting firmware 4.0.8 on Fiber 500+ plans with more than 4 active port forwarding rules.", time: "9:35 AM" },
            { sender: "customer", name: "Jordan Davis", text: "Why wasn't I told about this sooner?", time: "9:35 AM" },
            { sender: "bot", name: "Aria", text: "We did send you a firmware update notification on January 8th — I can see the email was opened but the update wasn't applied. Firmware 4.1.2, which resolves this issue, is still available. I can walk you through updating the firmware directly, or — if the instability is severe — a factory reset followed by the firmware update would fully resolve it.", time: "9:36 AM" },
            { sender: "customer", name: "Jordan Davis", text: "OK let's do the factory reset then.", time: "9:37 AM" },
            { sender: "bot", name: "Aria", text: "Before we proceed — I want to make sure you know: a factory reset will erase all current settings, including Wi-Fi names, passwords, and any custom configurations. Are you ready to continue?", time: "9:37 AM" },
            { sender: "customer", name: "Jordan Davis", text: "Wait — I have port forwarding rules set up for my home office. Will those be wiped if I do a factory reset?", time: "9:40 AM" },
            { sender: "bot", name: "Aria", text: "That's a really important question. Yes — a factory reset would erase your custom port forwarding rules. However, if you previously saved a configuration backup, you can restore those settings after the reset.", time: "9:41 AM" },
            { sender: "customer", name: "Jordan Davis", text: "I backed it up a while ago but I'm not sure if the backup still works on the new firmware. I have 6 rules critical for my home office VPN and NAS.", time: "9:42 AM" },
            { sender: "bot", name: "Aria", text: "I understand — this is an important concern. The behavior of configuration backups across firmware versions, particularly from 4.0.8 to 4.1.2, is outside my confidence threshold to advise on definitively. I'm connecting you with a human agent who can confirm the safest path forward.", time: "9:43 AM" },
            { sender: "bot", name: "Aria", text: "Escalating your case now. An agent will review your port forwarding configuration and confirm whether your backup will restore correctly after the update. Your case number is CST-11621.", time: "9:44 AM" },
          ],
        },
      },
      {
        id: "jordan-h16",
        type: "handoff",
        title: "Escalated — port forwarding backup unresolved",
        timestamp: "Today · 9:44 AM",
        detail: "Mid-reset, Jordan raised concern about losing 6 custom port forwarding rules critical to his home office. Aria paused the reset — firmware-specific backup behavior outside its confidence threshold — and escalated to a human agent.",
        dot: "red",
        customerMessage: "Wait — I have port forwarding rules set up for my home office. Will those be wiped if I do a factory reset?",
        meta: [
          { label: "Case #", value: "CST-11621" },
          { label: "Escalated to", value: "Jeff Comstock" },
          { label: "Reason", value: "Port forwarding config backup behavior on firmware 4.0.8 requires expert confirmation" },
          { label: "Status", value: "Live — awaiting agent response" },
        ],
        interaction: {
          kind: "ticket",
          ticketId: "CST-11621",
          subject: "Escalation — port forwarding backup unresolved pre-factory-reset",
          notes: [
            { author: "Aria (Bot)", time: "Today · 9:44 AM", isInternal: true, text: "Escalating to human agent. Customer is mid-factory-reset sequence and has raised concern about losing 6 custom port forwarding rules critical to home office VPN/NAS. Config backup exists from Feb 2024 on firmware 4.0.8. Customer's query: will this backup restore correctly to firmware 4.1.2 post-factory-reset? This is outside my confidence threshold — requires expert confirmation before proceeding." },
            { author: "System", time: "Today · 9:44 AM", isInternal: true, text: "Case CST-11621 created and assigned to Jeff Comstock (Tier 2 — Network Specialist). Priority: Critical. Customer is live and waiting. Do not proceed with factory reset without agent confirmation." },
          ],
        },
      },
    ],
    queue: {
      time: "11m ago",
      preview: "Router dropping all connections — port forwarding config blocking factory reset",
      priority: "Critical",
      priorityClassName: "border-[#E53935] bg-[#FDEAEA] text-[#C71D1A]",
      badgeColor: "bg-[#E32926]",
      icon: "messageSquare",
      isActive: true,
      createdAt: "2026-04-19T09:33:00",
      updatedAt: "2026-04-19T09:44:00",
    },
    escalationResponses: [
      "Great news — I checked with our team and confirmed that your port forwarding settings are automatically backed up in your firmware version, so they'll be fully restored after the reset. You're safe to proceed.",
    ],
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 9:33 AM",
        draft:
          "I've reviewed the CloudMesh Pro v3 documentation. Before we proceed with the factory reset, I can confirm your port forwarding rules can be exported from the router admin panel at 192.168.1.1 under Advanced > Backup Config. Let me walk you through it.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "My router keeps dropping all connections. I've rebooted it three times and nothing works.",
            time: "9:33 AM",
          },
          {
            id: 2,
            role: "agent",
            author: "Aria",
            content:
              "Hi Jordan, I've pulled your account and identified your router as a CloudMesh Pro v3. I can see you're running firmware 4.0.8 — the current stable version is 4.1.2. This mismatch is likely causing your connection drops. I'll walk you through a reset sequence step by step.",
            time: "9:34 AM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Before I do the factory reset, will I lose my custom port forwarding rules? I set those up for my home office and I really can't afford to lose them.",
            time: "9:41 AM",
            sentiment: "frustrated",
          },
          {
            id: 4,
            role: "agent",
            author: "Aria",
            content:
              "That's a great question about firmware-specific backup behavior — I want to make sure I give you the right answer before we proceed. I'm flagging this conversation for a human agent who can confirm exactly how port forwarding configs are handled during a factory reset on firmware 4.0.8.",
            time: "9:42 AM",
          },
          {
            id: 5,
            role: "customer",
            content: "Okay, I'll wait. Just please make sure I don't lose those port forwarding rules — my whole home office setup depends on them.",
            time: "9:44 AM",
            sentiment: "frustrated",
          },
          {
            id: 6,
            role: "agent",
            author: "Aria",
            content: "Flagging for human agent now. Context: Jordan is mid-reset on CloudMesh Pro v3 (firmware 4.0.8) and needs confirmation that port forwarding rules survive a factory reset before proceeding. Customer is anxious about losing home office configuration. Confirm: port forwarding configs are backed up automatically on this firmware and will be fully restored after reset.",
            time: "9:44 AM",
            isInternal: true,
            isHandoffCard: true,
          },
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 9:33 AM",
        draft:
          "I can confirm CloudMesh Pro v3 supports config backup before a factory reset. I'll send you the steps to export your port forwarding rules right now.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "My router is constantly dropping. Been rebooting for 20 mins — nothing is working.",
            time: "9:33 AM",
          },
          {
            id: 2,
            role: "agent",
            author: "Aria",
            content:
              "I see your CloudMesh Pro v3 is on firmware 4.0.8 — there's a known issue with connection drops on this version. Can you do a factory reset? I'll guide you through it.",
            time: "9:35 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Will I lose my port forwarding rules? I use them for my home office.",
            time: "9:41 AM",
            sentiment: "frustrated",
          },
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 9:33 AM",
        draft:
          "Hi Jordan — a human agent is now reviewing your case. We'll confirm the port forwarding backup process for CloudMesh Pro v3 firmware 4.0.8 before we proceed with the reset.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hi, my internet has been down for 20 minutes. Router keeps dropping. Already rebooted 3 times.",
            time: "9:33 AM",
          },
          {
            id: 2,
            role: "agent",
            author: "Aria",
            content:
              "Hi Jordan! I can see your CloudMesh Pro v3 is running an outdated firmware version. A factory reset followed by a firmware update should resolve this. I'll walk you through it step by step.",
            time: "9:34 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "OK but I need my port forwarding settings kept — I have a home office setup that depends on them.",
            time: "9:41 AM",
            sentiment: "frustrated",
          },
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 9:33 AM",
        draft:
          "Hi Jordan — I've reviewed the CloudMesh Pro v3 firmware documentation. Your port forwarding configuration can be exported before the factory reset via the admin panel. I'll outline the exact steps in my next message.",
        messages: [
          {
            id: 1,
            role: "customer",
            content:
              "Subject: Router dropping all connections\n\nHi, my router has been dropping all connections for the past 20 minutes. I've rebooted it three times and nothing works. Please help urgently — I work from home.",
            time: "9:33 AM",
            sentiment: "frustrated",
          },
          {
            id: 2,
            role: "agent",
            author: "Aria",
            content:
              "Hi Jordan, I've reviewed your account and identified a firmware mismatch on your CloudMesh Pro v3. You're running 4.0.8 and the stable release is 4.1.2. A factory reset followed by a firmware update should resolve your connection drops.",
            time: "9:35 AM",
          },
          {
            id: 3,
            role: "customer",
            content:
              "Before I do the factory reset — I have custom port forwarding rules set up for my home office. Will those be lost? I really can't afford to lose that configuration.",
            time: "9:41 AM",
            sentiment: "frustrated",
          },
        ],
      },
    },
    customerSnapshot: [
      "2-year residential customer on Fiber 500 plan",
      "Technically savvy; comfortable with firmware and port forwarding",
      "No prior support tickets; first contact with support",
      "Single-product household, loyal but low-touch",
      "Proactive about maintaining own equipment",
    ],
  },
  {
    id: "marcus",
    initials: "MW",
    name: "Marcus Webb",
    customerId: "CST-13317",
    lastUpdated: "04/21/26 | 10:14 AM",
    profile: {
      department: "E-Commerce",
      tenureYears: 3,
      totalAUM: null,
      financialReadiness: null,
      financialAdvisor: null,
      advisorTitle: null,
      tags: ["Online Orders", "Apparel", "Loyal Customer"],
      fraudRiskScore: null,
      priorDisputeCount: 0,
      cardBlocked: false,
    },
    conversationTopics: [
      "Order #WB-88214 shipped to wrong address",
      "Reship, refund, or carrier intercept options",
      "Goodwill gesture for shipping error",
    ],
    contact: {
      email: "marcus.webb@email.com",
      phone: "(512) 555-0193",
      address: { street: "2847 Ridgewood Ave", city: "Austin", state: "TX", zip: "78704", country: "US" },
    },
    accounts: [
      { id: "mw-ecomm", type: "Business", number: "CST-13317", balance: null, availableBalance: null, status: "active", openedDate: "Apr 2023" },
    ],
    overview: {
      contactNumber: "(512) 555-0193",
      assignedAgent: "Jeff Comstock",
      pronoun: "he",
      lastContactTime: "Today, 10:14 AM",
      address: "2847 Ridgewood Ave, Austin, TX 78704",
    },
    interactionTimeline: [
      {
        id: "marcus-order-placed",
        title: "Order #WB-88214 placed",
        timestamp: "Apr 18, 2026 · 2:31 PM",
        detail: "Marcus ordered 1x Charcoal Merino Sweater ($129). Estimated delivery Apr 22.",
        tone: "info",
        sortOrder: 1,
      },
      {
        id: "marcus-shipped",
        title: "Order shipped — wrong address",
        timestamp: "Apr 19, 2026 · 8:05 AM",
        detail: "Package shipped to 419 Elm St, Denver, CO 80203 — Marcus's old address. Correct address is 2847 Ridgewood Ave, Austin, TX 78704.",
        tone: "warning",
        sortOrder: 2,
      },
      {
        id: "marcus-contact",
        title: "Marcus contacted support via chat",
        timestamp: "Today · 10:07 AM",
        detail: "Marcus reported he never received a shipping confirmation to his current email and noticed the wrong delivery address in his order history.",
        tone: "info",
        sortOrder: 3,
      },
      {
        id: "marcus-escalated",
        title: "Case escalated — human agent required",
        timestamp: "Today · 10:14 AM",
        detail: "Emily escalated to Priya Nair. Resolution options include reship overnight, refund + reorder, or carrier intercept. Goodwill gesture recommended.",
        tone: "critical",
        sortOrder: 4,
      },
    ],
    customerHistory: [
      // ── Phase 1: Account & Order History ───────────────────────────────────
      {
        id: "marcus-h1",
        type: "registration",
        phase: "Account History",
        title: "Account opened — first apparel order",
        timestamp: "Apr 2023",
        detail: "Marcus created his account and placed his first order — a navy crewneck sweater. No complaints on record at time of joining.",
        dot: "green",
        meta: [
          { label: "Customer ID", value: "CST-13317" },
          { label: "Account type", value: "E-Commerce" },
          { label: "Email", value: "marcus.webb@email.com" },
          { label: "Joined via", value: "Web checkout — westbrook.com" },
        ],
        interaction: {
          kind: "registration",
          fields: [
            { label: "Customer ID", value: "CST-13317" },
            { label: "Name", value: "Marcus Webb" },
            { label: "Email", value: "marcus.webb@email.com" },
            { label: "Phone", value: "(512) 555-0193" },
            { label: "Address at signup", value: "419 Elm St, Denver, CO 80203" },
            { label: "Account type", value: "E-Commerce" },
            { label: "Joined via", value: "Web checkout — westbrook.com" },
            { label: "First order", value: "Navy Crewneck Sweater — $89.00" },
            { label: "Member since", value: "April 2023" },
          ],
        },
      },
      {
        id: "marcus-h2",
        type: "system",
        title: "14 lifetime orders — zero complaints",
        timestamp: "Apr 2023 – Mar 2026",
        detail: "Marcus has placed 14 orders over 3 years with no prior complaints, return requests, or escalations on record. Loyal, high-value customer.",
        dot: "green",
        meta: [
          { label: "Total orders", value: "14" },
          { label: "Total spend", value: "~$1,740" },
          { label: "Categories", value: "Knitwear, outerwear, accessories" },
          { label: "Complaints", value: "None" },
          { label: "Returns", value: "0" },
        ],
        interaction: {
          kind: "ticket",
          ticketId: "CST-13317 — Order History",
          subject: "3-year order history summary",
          notes: [
            { author: "System", time: "As of Apr 21, 2026", isInternal: true, text: "14 confirmed orders placed between Apr 2023 and Mar 2026. Estimated total spend: $1,740. Categories: knitwear, outerwear, accessories. Zero complaint or return records on file. Customer flagged as high-value loyal segment." },
          ],
        },
      },

      // ── Phase 2: Address Update ─────────────────────────────────────────────
      {
        id: "marcus-h3",
        type: "system",
        phase: "Address Update",
        title: "Shipping address updated — Denver → Austin",
        timestamp: "Jan 2025",
        detail: "Marcus submitted an address change from 419 Elm St, Denver, CO to 2847 Ridgewood Ave, Austin, TX via his account settings. Update was saved to his account profile.",
        dot: "blue",
        meta: [
          { label: "Previous address", value: "419 Elm St, Denver, CO 80203" },
          { label: "New address", value: "2847 Ridgewood Ave, Austin, TX 78704" },
          { label: "Updated via", value: "Account Settings — westbrook.com" },
          { label: "Confirmed by", value: "System (self-service)" },
        ],
        interaction: {
          kind: "registration",
          fields: [
            { label: "Change type", value: "Shipping address update" },
            { label: "Previous address", value: "419 Elm St, Denver, CO 80203" },
            { label: "New address", value: "2847 Ridgewood Ave, Austin, TX 78704" },
            { label: "Updated via", value: "Account Settings — westbrook.com" },
            { label: "Date", value: "January 14, 2025" },
            { label: "Confirmed by", value: "System — self-service account update" },
            { label: "Status", value: "Saved to account profile" },
            { label: "Note", value: "Address was not propagated to cached shipping label at Apr 2026 order cutoff" },
          ],
        },
      },

      // ── Phase 3: Browsing & Purchase ───────────────────────────────────────
      {
        id: "marcus-h4",
        type: "web",
        phase: "Purchase",
        title: "Browsed knitwear collection — westbrook.com",
        timestamp: "Apr 18, 2026 · 1:45 PM",
        detail: "Marcus visited the knitwear section of westbrook.com, spending ~12 minutes browsing the Merino sweater range and comparing colorways before clicking through to the Charcoal product page.",
        dot: "gray",
        meta: [
          { label: "Site", value: "westbrook.com/knitwear" },
          { label: "Time on site", value: "~12 min" },
          { label: "Page viewed", value: "Merino Sweater — Charcoal (product detail)" },
          { label: "Action", value: "Added to cart" },
        ],
        interaction: {
          kind: "web",
          url: "westbrook.com/knitwear/merino-sweater-charcoal",
          title: "Charcoal Merino Sweater — Product Detail",
          description: "Marcus spent ~12 minutes browsing the knitwear collection before landing on the Charcoal Merino Sweater product page. He reviewed sizing, read 3 customer reviews, and added the Large to his cart.",
          sectionsViewed: [
            "Knitwear category page — 8 products browsed",
            "Charcoal Merino Sweater — product detail page (6 min)",
            "Size guide — Men's Large selected",
            "Customer reviews — 3 reviews read (avg 4.7 ★)",
            "Added to cart: Charcoal Merino Sweater, Size Large",
          ],
        },
      },
      {
        id: "marcus-h5",
        type: "purchase",
        title: "Order #WB-88214 placed — Charcoal Merino Sweater",
        timestamp: "Apr 18, 2026 · 2:31 PM",
        detail: "Marcus placed an order for 1x Charcoal Merino Sweater (Size L) at $129.00, paid by Mastercard ending 7731. Shipping address pulled from cached profile — outdated Denver address used instead of current Austin address.",
        dot: "green",
        customerMessage: "I need this by Saturday — it's a gift for my dad's birthday party.",
        meta: [
          { label: "Order #", value: "WB-88214" },
          { label: "Item", value: "Charcoal Merino Sweater — Size L" },
          { label: "Amount", value: "$129.00" },
          { label: "Payment", value: "Mastercard ****7731" },
          { label: "Ship-to used", value: "419 Elm St, Denver, CO 80203 (cached — outdated)" },
        ],
        interaction: {
          kind: "purchase",
          orderId: "WB-88214",
          items: [{ name: "Charcoal Merino Sweater — Size Large", qty: 1, price: "$129.00" }],
          total: "$129.00",
          paymentMethod: "Mastercard ****7731",
          shippingAddress: "Marcus Webb · 419 Elm St, Denver, CO 80203  ⚠ Outdated — current address is Austin, TX",
        },
      },

      // ── Phase 4: Post-Purchase / Shipping Error ─────────────────────────────
      {
        id: "marcus-h6",
        type: "email",
        phase: "Shipping Error",
        title: "Order confirmation email sent",
        timestamp: "Apr 18, 2026 · 2:32 PM",
        detail: "Automated order confirmation sent to marcus.webb@email.com showing the Denver shipping address. Email was opened but Marcus did not flag the address discrepancy at the time.",
        dot: "orange",
        meta: [
          { label: "To", value: "marcus.webb@email.com" },
          { label: "Subject", value: "Your order is confirmed — #WB-88214" },
          { label: "Address shown", value: "419 Elm St, Denver, CO 80203" },
          { label: "Status", value: "Delivered — opened (address not flagged)" },
        ],
        interaction: {
          kind: "email",
          from: "noreply@westbrook.com",
          to: "marcus.webb@email.com",
          subject: "Your order is confirmed — #WB-88214",
          sentAt: "Apr 18, 2026 · 2:32 PM",
          opened: true,
          body: "Hi Marcus,\n\nThank you for your order! Here's your confirmation:\n\nOrder #WB-88214\nCharcoal Merino Sweater — Size Large × 1 ......... $129.00\n\nTotal: $129.00\nPayment: Mastercard ****7731\n\nShipping to:\nMarcus Webb\n419 Elm St\nDenver, CO 80203\n\nEstimated Delivery: Tuesday, Apr 22, 2026\n\nYou'll receive a shipping confirmation with tracking once your order is on its way.\n\nQuestions? Contact us at support@westbrook.com\n\n— The Westbrook Team",
        },
      },
      {
        id: "marcus-h7",
        type: "shipping",
        title: "Order shipped via FedEx — wrong address",
        timestamp: "Apr 19, 2026 · 8:05 AM",
        detail: "Package shipped via FedEx to 419 Elm St, Denver, CO — Marcus's outdated address. Package is in transit and cannot be intercepted once with the carrier.",
        dot: "red",
        customerMessage: "I just noticed my order is headed to Denver. I moved over a year ago — that's not my address anymore.",
        meta: [
          { label: "Carrier", value: "FedEx" },
          { label: "Tracking #", value: "784912033651" },
          { label: "Shipped to", value: "419 Elm St, Denver, CO 80203 ⚠" },
          { label: "Status", value: "In transit — cannot intercept" },
        ],
        interaction: {
          kind: "shipping",
          carrier: "FedEx",
          trackingNumber: "784912033651",
          events: [
            { status: "In Transit", location: "Kansas City, MO Hub", time: "Apr 21, 2026 · 6:14 AM" },
            { status: "In Transit", location: "Albuquerque, NM Hub", time: "Apr 20, 2026 · 9:30 PM" },
            { status: "Departed FedEx Facility", location: "Dallas, TX", time: "Apr 19, 2026 · 11:45 PM" },
            { status: "Picked Up", location: "Westbrook Fulfillment — Dallas, TX", time: "Apr 19, 2026 · 8:05 AM" },
            { status: "Label Created", location: "Westbrook Fulfillment — Dallas, TX", time: "Apr 18, 2026 · 5:00 PM" },
          ],
        },
      },

      // ── Phase 5: Current Case ───────────────────────────────────────────────
      {
        id: "marcus-h8",
        type: "web",
        phase: "Current Case",
        title: "Checked order status — noticed wrong address",
        timestamp: "Today · 10:05 AM",
        detail: "Marcus logged into westbrook.com to check his order status and discovered the package was shipped to his old Denver address. He then launched the support chat.",
        dot: "gray",
        meta: [
          { label: "Site", value: "westbrook.com — My Orders" },
          { label: "Order checked", value: "WB-88214" },
          { label: "Address shown", value: "419 Elm St, Denver, CO 80203" },
          { label: "Next action", value: "Opened support chat" },
        ],
        interaction: {
          kind: "web",
          url: "westbrook.com/account/orders/WB-88214",
          title: "Order Status — #WB-88214",
          description: "Marcus logged in to check the delivery status of his sweater order and noticed the shipping address listed as his old Denver address — not the Austin address he'd updated over a year earlier.",
          sectionsViewed: [
            "My Orders — order list viewed",
            "Order #WB-88214 detail — shipping address: 419 Elm St, Denver, CO 80203",
            "Tracking status: In Transit (no delivery estimate shown)",
            "Support chat widget launched",
          ],
        },
      },
      {
        id: "marcus-h9",
        type: "chat",
        title: "Support chat — wrong address reported",
        timestamp: "Today · 10:07 AM",
        detail: "Marcus contacted support via chat and reported the shipping error to Emily. Emily confirmed the address mismatch but was unable to intercept the in-transit package. Marcus escalated, requesting a human agent due to the Saturday birthday deadline.",
        dot: "blue",
        customerMessage: "That can't be right. I placed this order less than 24 hours ago. There has to be something you can do — this is a birthday gift for my dad and the party is Saturday.",
        meta: [
          { label: "Channel", value: "westbrook.com website chat" },
          { label: "Bot", value: "Emily" },
          { label: "Issue reported", value: "Order shipped to outdated Denver address" },
          { label: "Outcome", value: "Unable to intercept — escalated to Priya Nair" },
        ],
        interaction: {
          kind: "chat",
          botName: "Emily",
          messages: [
            { sender: "bot", name: "Emily", text: "Hi Marcus — I can see you've been with us for 3 years and have 14 orders on record. How can I help you today?", time: "10:07 AM" },
            { sender: "customer", name: "Marcus Webb", text: "Hi, I ordered a charcoal merino sweater a few days ago and I just checked my order status — it says it was shipped to an old address in Denver. I moved to Austin over a year ago.", time: "10:08 AM" },
            { sender: "bot", name: "Emily", text: "I'm really sorry about this, Marcus. I can see order #WB-88214 — the Charcoal Merino Sweater for $129 — was shipped to 419 Elm St, Denver, CO. Your current address on file is 2847 Ridgewood Ave, Austin, TX. It looks like the shipping label may have used a cached address before your update took effect.", time: "10:09 AM" },
            { sender: "customer", name: "Marcus Webb", text: "That's really frustrating. I updated my address a while back. Is there any way to get it redirected or sent again? I need this for an event this weekend.", time: "10:10 AM" },
            { sender: "bot", name: "Emily", text: "I'm sorry, Marcus — your order shipped early this morning and is already in transit. Once an order is with the carrier, we're unable to redirect or intercept it. I know that's not what you were hoping to hear.", time: "10:12 AM" },
            { sender: "customer", name: "Marcus Webb", text: "That can't be right. I placed this order less than 24 hours ago. There has to be something you can do — this is a birthday gift for my dad and the party is Saturday. Please, I need a real person.", time: "10:13 AM" },
            { sender: "bot", name: "Emily", text: "I'm going to transfer you to a live customer service agent, please hold.", time: "10:14 AM" },
          ],
        },
      },
      {
        id: "marcus-h10",
        type: "handoff",
        title: "Escalated to Jeff Comstock — time-sensitive",
        timestamp: "Today · 10:14 AM",
        detail: "Emily escalated to Jeff Comstock (Senior Care). Resolution paths: reship overnight to Austin, full refund + reorder, or carrier intercept attempt. Birthday deadline Saturday — goodwill gesture recommended.",
        dot: "red",
        customerMessage: "I need a real person.",
        meta: [
          { label: "Case #", value: "CST-13317" },
          { label: "Escalated to", value: "Jeff Comstock — Senior Care" },
          { label: "Reason", value: "Package in transit to wrong address — time-sensitive birthday gift" },
          { label: "Resolution paths", value: "Reship overnight, refund + reorder, or carrier intercept" },
          { label: "Goodwill", value: "CARE20 — 20% off next order recommended" },
        ],
        interaction: {
          kind: "ticket",
          ticketId: "CST-13317",
          subject: "Escalation — order #WB-88214 shipped to wrong address",
          notes: [
            { author: "Emily (Bot)", time: "Today · 10:14 AM", isInternal: true, text: "Escalating to Priya Nair (Senior Care). Order #WB-88214 — Charcoal Merino Sweater ($129) shipped to outdated Denver address (419 Elm St). Current address: 2847 Ridgewood Ave, Austin, TX. Package in transit — cannot intercept. Time-sensitive: birthday event Saturday. Resolution paths: (1) reship overnight to Austin, (2) full refund + reorder, (3) carrier intercept attempt. Goodwill code CARE20 (20% off next order) recommended." },
            { author: "System", time: "Today · 10:14 AM", isInternal: true, text: "Case CST-13317 assigned to Priya Nair (Senior Care Agent). Priority: Critical. Customer is live and awaiting response." },
          ],
        },
      },
    ],
    queue: {
      time: "6m ago",
      preview: "Order shipped to wrong address - request for Human Agent",
      priority: "Critical",
      priorityClassName: "border-[#E53935] bg-[#FDEAEA] text-[#C71D1A]",
      badgeColor: "bg-[#E32926]",
      icon: "messageSquare",
      isActive: false,
      createdAt: "2026-04-21T10:08:00",
      updatedAt: "2026-04-21T10:14:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 10:07 AM",
        draft: "",
        messages: [
          {
            id: 1,
            role: "agent",
            author: "Emily",
            content: "Hi Marcus — I can see you've been with us for 3 years and have 14 orders on record. How can I help you today?",
            time: "10:07 AM",
          },
          {
            id: 2,
            role: "customer",
            content: "Hi, I ordered a charcoal merino sweater a few days ago and I just checked my order status — it says it was shipped to an old address in Denver. I moved to Austin over a year ago.",
            time: "10:08 AM",
            sentiment: "frustrated",
          },
          {
            id: 3,
            role: "agent",
            author: "Emily",
            content: "I'm really sorry about this, Marcus. I can see order #WB-88214 — the Charcoal Merino Sweater for $129 — was shipped to 419 Elm St, Denver, CO. Your current address on file is 2847 Ridgewood Ave, Austin, TX. It looks like the shipping label may have used a cached address before your update took effect.",
            time: "10:09 AM",
          },
          {
            id: 4,
            role: "customer",
            content: "That's really frustrating. I updated my address a while back. Is there any way to get it redirected or sent again? I need this for an event this weekend.",
            time: "10:10 AM",
            sentiment: "frustrated",
          },
          {
            id: 5,
            role: "agent",
            author: "Emily",
            content: "I'm sorry, Marcus — your order shipped early this morning and is already in transit. Once an order is with the carrier, we're unable to redirect or intercept it. I know that's not what you were hoping to hear.",
            time: "10:12 AM",
          },
          {
            id: 6,
            role: "customer",
            content: "That can't be right. I placed this order less than 24 hours ago. There has to be something you can do — this is a birthday gift for my dad and the party is Saturday. Please, I need a real person.",
            time: "10:13 AM",
            sentiment: "critical",
          },
          {
            id: 7,
            role: "agent",
            author: "Emily",
            content: "I'm going to transfer you to a live customer service agent, please hold.",
            time: "10:14 AM",
            isHandoffMessage: true,
          },
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 10:07 AM",
        draft: "Hi Marcus — a senior agent is now reviewing your case and will confirm the best resolution for order #WB-88214.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hi, my order says it shipped to an old address. Order number WB-88214. Can you fix this?",
            time: "10:07 AM",
            sentiment: "frustrated",
          },
          {
            id: 2,
            role: "agent",
            author: "Emily",
            content: "Hi Marcus — I can see the issue. Order #WB-88214 was shipped to 419 Elm St, Denver, CO instead of your Austin address. I'm escalating this to our team right now to get it resolved quickly.",
            time: "10:09 AM",
          },
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 10:07 AM",
        draft: "Hi Marcus — our senior care team is reviewing your case now. We'll get back to you with a resolution for the #WB-88214 shipment shortly.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hello, I just saw my order #WB-88214 was sent to the wrong address. I moved a year ago. Can this be fixed?",
            time: "10:07 AM",
            sentiment: "frustrated",
          },
          {
            id: 2,
            role: "agent",
            author: "Emily",
            content: "Hi Marcus! I'm really sorry about that. I can see the package went to your previous Denver address. I'm connecting you with our senior care team to get this sorted immediately — they'll confirm the fastest resolution for you.",
            time: "10:10 AM",
          },
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 10:07 AM",
        draft: "Hi Marcus — I've reviewed your case and confirmed the shipping label for order #WB-88214 used an outdated address from our system. Our team is reviewing your options now and will follow up shortly.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Subject: Order shipped to wrong address — #WB-88214\n\nHi, I just checked my order status and it looks like my order was shipped to an old address in Denver. I moved to Austin over a year ago and updated my address. I need this resolved urgently as it's a gift for this weekend.",
            time: "10:07 AM",
            sentiment: "frustrated",
          },
          {
            id: 2,
            role: "agent",
            author: "Emily",
            content: "Hi Marcus, thank you for reaching out. I've pulled up order #WB-88214 — a Charcoal Merino Sweater — and confirmed it was shipped to 419 Elm St, Denver, CO. Your current address on file shows 2847 Ridgewood Ave, Austin, TX. I'm escalating this to our senior care team to authorize the fastest resolution.",
            time: "10:09 AM",
          },
        ],
      },
    },
    resolveFlow: {
      type: "options",
      steps: [
        "Confirming resolution with carrier",
        "Applying goodwill discount code (20% off)",
        "Updating default shipping address to Austin",
        "Sending confirmation to Marcus",
      ],
      optionLabels: {
        1: "Reship overnight to Austin address (2847 Ridgewood Ave)",
        2: "Issue full refund — let Marcus reorder at his convenience",
        3: "Attempt carrier intercept to redirect Denver package",
      },
      noteTemplate: "[Internal Note] Resolution actioned for order #WB-88214: {option}.{goodwill}",
      goodwillNote: " Goodwill discount code CARE20 (20%) applied to account.",
      goodwillReplyLine: " I've also applied a 20% discount code (CARE20) to your account as a goodwill gesture.",
      replyVariants: {
        1: [
          {
            summary: "Confirm the overnight reship to the correct Austin address and set delivery expectation.",
            suggestedReply: "Great news, Marcus — I've arranged an overnight reship of order #WB-88214 to your Austin address at 2847 Ridgewood Ave. You should receive it by tomorrow.{goodwill}",
          },
          {
            summary: "Acknowledge the shipping error, confirm the reship, and reassure the customer.",
            suggestedReply: "I'm sorry for the mix-up on the address, Marcus. I've gone ahead and set up an overnight reship to 2847 Ridgewood Ave, Austin — you'll have it by tomorrow.{goodwill}",
          },
          {
            summary: "Lead with the resolution and confirm the corrected delivery timeline.",
            suggestedReply: "Your replacement shipment is on its way to the right address, Marcus. I've arranged overnight delivery to 2847 Ridgewood Ave, Austin, so you should have it by tomorrow.{goodwill}",
          },
        ],
        2: [
          {
            summary: "Confirm the full refund has been processed and give the expected timeline.",
            suggestedReply: "Marcus, I've processed a full refund for order #WB-88214. You should see it back in your account within 3–5 business days.{goodwill}",
          },
          {
            summary: "Apologise for the inconvenience, confirm the refund, and offer to help reorder.",
            suggestedReply: "I'm sorry for the trouble with this order, Marcus. I've issued a full refund for #WB-88214 — it will appear within 3–5 business days. Feel free to reorder whenever you're ready.{goodwill}",
          },
          {
            summary: "Lead with the refund confirmation and set clear expectations on timing.",
            suggestedReply: "Your full refund for order #WB-88214 has been issued, Marcus. Expect it to hit your account within 3–5 business days.{goodwill}",
          },
        ],
        3: [
          {
            summary: "Confirm the carrier intercept request has been submitted and set timeline expectations.",
            suggestedReply: "I've submitted a carrier intercept request to redirect your package to 2847 Ridgewood Ave, Austin. These typically take 24–48 hours to confirm — I'll keep you updated as soon as I hear back.",
          },
          {
            summary: "Reassure the customer the intercept is in motion and commit to a follow-up.",
            suggestedReply: "Good news — I've initiated a carrier intercept to redirect your order to the correct Austin address. It usually takes 24–48 hours to confirm, and I'll follow up the moment I have an update.",
          },
          {
            summary: "Acknowledge the error, confirm the intercept action, and set realistic expectations.",
            suggestedReply: "I'm on it, Marcus. I've contacted the carrier to intercept the package and redirect it to 2847 Ridgewood Ave, Austin. I'll reach out within 24–48 hours to confirm the outcome.",
          },
        ],
      },
    },
    seedHasTransferMessage: true,
    takeoverDraft: "Hi Marcus, this is Jeff. I've reviewed everything and I want to help you fix this. I can see the party is Saturday — let's make sure your dad gets his gift in time.",
    customerSnapshot: [
      "7-year customer with $1.5M+ in combined accounts",
      "Premier Business Banking client with high activity",
      "1 prior dispute quickly resolved",
      "Sophisticated in financial decisions; strategic planner",
      "Values executive-level service and white-glove support",
    ],
  },
  {
    id: "maria_chen",
    initials: "MC",
    name: "Maria Chen",
    customerId: "CST-21001",
    lastUpdated: "04/27/26 | 09:00 AM",
    profile: {
      department: "Commercial Banking",
      tenureYears: 8,
      totalAUM: "$139,137.00",
      financialReadiness: 51,
      financialAdvisor: "Marcus Lee",
      advisorTitle: "Senior Account Manager",
      tags: ["Standard"],
      fraudRiskScore: 23,
      priorDisputeCount: 1,
      cardBlocked: false,
    },
    conversationTopics: [
      "Resolve payment issue issue",
      "Review account status",
      "Confirm resolution and next steps",
    ],
    contact: {
      email: "maria.chen@apexfinancialgroup.com",
      phone: "(217) 555-1053",
      address: { street: "100 Main St", city: "New York", state: "NY", zip: "10001", country: "US" },
    },
    accounts: [
      { id: "maria_chen-chk", type: "Business", number: "***1037", balance: "$30,237.00",
          availableBalance: "$30,237.00", status: "active", openedDate: "Apr 2021" },
      { id: "maria_chen-sav", type: "Savings", number: "***2053", balance: "$54,173.00", status: "active", openedDate: "May 2021" },
    ],
    overview: {
      contactNumber: "(217) 555-1053",
      assignedAgent: "Marcus Lee",
      pronoun: "she",
      lastContactTime: "Today, 9:05 AM",
      address: "100 Main St, New York, NY 10001",
    },
    interactionTimeline: [
      {
        id: "maria_chen-case-opened",
        title: "Case opened — Payment Issue",
        timestamp: "Today · 9:00 AM",
        detail: "Maria Chen contacted support regarding: Payment processing failure on recurring transactions.",
        tone: "warning",
        sortOrder: 1,
      },
      {
        id: "maria_chen-bot-review",
        title: "Virtual agent reviewed case",
        timestamp: "Today · 9:02 AM",
        detail: "AI assistant reviewed the case details and initiated payment issue resolution workflow.",
        tone: "info",
        sortOrder: 2,
      },
      {
        id: "maria_chen-escalated",
        title: "Escalated to human agent",
        timestamp: "Today · 9:05 AM",
        detail: "Case escalated to human agent due to complexity of payment issue issue requiring manual intervention.",
        tone: "warning",
        sortOrder: 3,
      },
    ],
    customerHistory: [
      {
        id: "maria_chen-h1",
        title: "Payment Issue case opened",
        timestamp: "Today · 9:00 AM",
        detail: "New payment issue case opened for Maria Chen at Apex Financial Group.",
        dot: "orange",
      },
      {
        id: "maria_chen-h2",
        title: "Account verified",
        timestamp: "Jan 22, 2026 · 2:00 PM",
        detail: "Identity and account details verified for Maria Chen.",
        dot: "gray",
      },
      {
        id: "maria_chen-h3",
        title: "Account created",
        timestamp: "Jun 2020, 2021 · 10:00 AM",
        detail: "Maria Chen joined Apex Financial Group. Account created and onboarding completed.",
        dot: "green",
      },
    ],
    queue: {
      time: "12m",
      preview: "Payment processing failure on recurring transactions",
      priority: "High",
      priorityClassName: "border-[#FFB800] bg-[#FFF6E0] text-[#A37A00]",
      badgeColor: "bg-[#166CCA]",
      icon: "messageSquare",
      isActive: false,
      createdAt: "2026-04-27T09:00:00",
      updatedAt: "2026-04-27T09:05:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 9:00 AM",
        draft: "I've reviewed your payment issue case, Maria. Here's what I can see and the steps I'm taking to resolve this for you right now.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hi, I'm reaching out about: Payment processing failure on recurring transactions. Can you help?",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Maria, I've reviewed your case regarding payment issue. Let me look into this for you.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "I appreciate that — this has been an ongoing issue and I need it resolved today.",
            time: "9:04 AM",
          }
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 9:00 AM",
        draft: "Hi Maria — I've looked into your case. I'm working on a resolution and will update you shortly.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Need help — payment processing failure on recurring transactions.",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Maria — I can see your case. Reviewing details now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thanks. Please let me know as soon as you have an update.",
            time: "9:04 AM",
          }
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 9:00 AM",
        draft: "Hi Maria — I've reviewed your case. I have what I need to help you resolve this payment issue issue.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hello, I need help with a payment issue issue — payment processing failure on recurring transactions",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Maria! I can see your case details. I'm reviewing everything now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Great — please update me here when you have news.",
            time: "9:04 AM",
          }
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 9:00 AM",
        draft: "Hi Maria — thank you for your patience. I've reviewed your payment issue case in detail and I'm ready to walk you through the next steps.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Subject: Payment Issue - Urgent Assistance Needed\n\nHello,\n\nI need assistance with the following: Payment processing failure on recurring transactions. Please respond as soon as possible.\n\nThank you,\nMaria Chen",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Maria,\n\nThank you for reaching out. I've reviewed your case and I'm working on resolving your payment issue issue. I'll have an update for you shortly.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thank you for the quick response. Please prioritise this — it's time-sensitive.",
            time: "9:04 AM",
          }
        ],
      },
    },
    customerSnapshot: [
      "4-year customer building investment portfolio",
      "Balance-conscious with moderate risk tolerance",
      "No prior disputes; steady account growth",
      "Culturally diverse perspective; multilingual communications",
      "Family-oriented; includes spouse in discussions",
    ],
  },
  {
    id: "james_whitfield",
    initials: "JW",
    name: "James Whitfield",
    customerId: "CST-21002",
    lastUpdated: "04/27/26 | 09:00 AM",
    profile: {
      department: "Healthcare Services",
      tenureYears: 7,
      totalAUM: "$228,274.00",
      financialReadiness: 62,
      financialAdvisor: "Sarah Chen",
      advisorTitle: "Senior Account Manager",
      tags: ["Premier"],
      fraudRiskScore: 36,
      priorDisputeCount: 2,
      cardBlocked: false,
    },
    conversationTopics: [
      "Resolve contract & renewal issue",
      "Review account status",
      "Confirm resolution and next steps",
    ],
    contact: {
      email: "james.whitfield@summithealthcare.com",
      phone: "(234) 555-1106",
      address: { street: "250 Park Ave", city: "Chicago", state: "IL", zip: "60601", country: "US" },
    },
    accounts: [
      { id: "james_whitfield-chk", type: "Business", number: "***1074", balance: "$35,474.00",
          availableBalance: "$35,474.00", status: "active", openedDate: "Jul 2022" },
      { id: "james_whitfield-sav", type: "Savings", number: "***2106", balance: "$58,346.00", status: "active", openedDate: "Aug 2022" },
    ],
    overview: {
      contactNumber: "(234) 555-1106",
      assignedAgent: "Sarah Chen",
      pronoun: "he",
      lastContactTime: "Today, 9:05 AM",
      address: "250 Park Ave, Chicago, IL 60601",
    },
    interactionTimeline: [
      {
        id: "james_whitfield-case-opened",
        title: "Case opened — Contract & Renewal",
        timestamp: "Today · 9:00 AM",
        detail: "James Whitfield contacted support regarding: Enterprise license renewal dispute — pricing discrepancy.",
        tone: "warning",
        sortOrder: 1,
      },
      {
        id: "james_whitfield-bot-review",
        title: "Virtual agent reviewed case",
        timestamp: "Today · 9:02 AM",
        detail: "AI assistant reviewed the case details and initiated contract & renewal resolution workflow.",
        tone: "info",
        sortOrder: 2,
      },
      {
        id: "james_whitfield-escalated",
        title: "Escalated to human agent",
        timestamp: "Today · 9:05 AM",
        detail: "Case escalated to human agent due to complexity of contract & renewal issue requiring manual intervention.",
        tone: "critical",
        sortOrder: 3,
      },
    ],
    customerHistory: [
      {
        id: "james_whitfield-h1",
        title: "Contract & Renewal case opened",
        timestamp: "Today · 9:00 AM",
        detail: "New contract & renewal case opened for James Whitfield at Summit Healthcare Inc..",
        dot: "orange",
      },
      {
        id: "james_whitfield-h2",
        title: "Account verified",
        timestamp: "Mar 5, 2026 · 2:00 PM",
        detail: "Identity and account details verified for James Whitfield.",
        dot: "gray",
      },
      {
        id: "james_whitfield-h3",
        title: "Account created",
        timestamp: "Sep 2021, 2022 · 10:00 AM",
        detail: "James Whitfield joined Summit Healthcare Inc.. Account created and onboarding completed.",
        dot: "green",
      },
    ],
    queue: {
      time: "5m",
      preview: "Enterprise license renewal dispute — pricing discrepancy",
      priority: "Critical",
      priorityClassName: "border-[#E53935] bg-[#FDEAEA] text-[#C71D1A]",
      badgeColor: "bg-[#E32926]",
      icon: "phone",
      isActive: false,
      createdAt: "2026-04-27T09:00:00",
      updatedAt: "2026-04-27T09:05:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 9:00 AM",
        draft: "I've reviewed your contract & renewal case, James. Here's what I can see and the steps I'm taking to resolve this for you right now.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hi, I'm reaching out about: Enterprise license renewal dispute — pricing discrepancy. Can you help?",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi James, I've reviewed your case regarding contract & renewal. Let me look into this for you.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "I appreciate that — this has been an ongoing issue and I need it resolved today.",
            time: "9:04 AM",
          }
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 9:00 AM",
        draft: "Hi James — I've looked into your case. I'm working on a resolution and will update you shortly.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Need help — enterprise license renewal dispute — pricing discrepancy.",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi James — I can see your case. Reviewing details now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thanks. Please let me know as soon as you have an update.",
            time: "9:04 AM",
          }
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 9:00 AM",
        draft: "Hi James — I've reviewed your case. I have what I need to help you resolve this contract & renewal issue.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hello, I need help with a contract & renewal issue — enterprise license renewal dispute — pricing discrepancy",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi James! I can see your case details. I'm reviewing everything now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Great — please update me here when you have news.",
            time: "9:04 AM",
          }
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 9:00 AM",
        draft: "Hi James — thank you for your patience. I've reviewed your contract & renewal case in detail and I'm ready to walk you through the next steps.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Subject: Contract & Renewal - Urgent Assistance Needed\n\nHello,\n\nI need assistance with the following: Enterprise license renewal dispute — pricing discrepancy. Please respond as soon as possible.\n\nThank you,\nJames Whitfield",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi James,\n\nThank you for reaching out. I've reviewed your case and I'm working on resolving your contract & renewal issue. I'll have an update for you shortly.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thank you for the quick response. Please prioritise this — it's time-sensitive.",
            time: "9:04 AM",
          }
        ],
      },
    },
    customerSnapshot: [
      "6-year established customer in good standing",
      "Multiple account types; real estate investment focus",
      "Zero disputes; strong payment history",
      "Conservative investor; prefers low-volatility options",
      "Quarterly advisor check-ins; long-term relationship",
    ],
  },
  {
    id: "priya_sharma",
    initials: "PS",
    name: "Priya Sharma",
    customerId: "CST-21003",
    lastUpdated: "04/27/26 | 09:00 AM",
    profile: {
      department: "Personal Banking",
      tenureYears: 6,
      totalAUM: "$317,411.00",
      financialReadiness: 73,
      financialAdvisor: "David Park",
      advisorTitle: "Senior Account Manager",
      tags: ["Standard"],
      fraudRiskScore: 49,
      priorDisputeCount: 0,
      cardBlocked: false,
    },
    conversationTopics: [
      "Resolve security alert issue",
      "Review account status",
      "Confirm resolution and next steps",
    ],
    contact: {
      email: "priya.sharma@gmail.com",
      phone: "(251) 555-1159",
      address: { street: "88 Harbor Blvd", city: "Seattle", state: "WA", zip: "98101", country: "US" },
    },
    accounts: [
      { id: "priya_sharma-chk", type: "Checking", number: "***1111", balance: "$26,373.00",
          availableBalance: "$26,373.00", status: "active", openedDate: "Oct 2023" },
      { id: "priya_sharma-sav", type: "Savings", number: "***2159", balance: "$62,519.00", status: "active", openedDate: "Nov 2023" },
    ],
    overview: {
      contactNumber: "(251) 555-1159",
      assignedAgent: "David Park",
      pronoun: "she",
      lastContactTime: "Today, 9:05 AM",
      address: "88 Harbor Blvd, Seattle, WA 98101",
    },
    interactionTimeline: [
      {
        id: "priya_sharma-case-opened",
        title: "Case opened — Security Alert",
        timestamp: "Today · 9:00 AM",
        detail: "Priya Sharma contacted support regarding: Account security alert — unauthorized login detected.",
        tone: "warning",
        sortOrder: 1,
      },
      {
        id: "priya_sharma-bot-review",
        title: "Virtual agent reviewed case",
        timestamp: "Today · 9:02 AM",
        detail: "AI assistant reviewed the case details and initiated security alert resolution workflow.",
        tone: "info",
        sortOrder: 2,
      },
      {
        id: "priya_sharma-escalated",
        title: "Escalated to human agent",
        timestamp: "Today · 9:05 AM",
        detail: "Case escalated to human agent due to complexity of security alert issue requiring manual intervention.",
        tone: "warning",
        sortOrder: 3,
      },
    ],
    customerHistory: [
      {
        id: "priya_sharma-h1",
        title: "Security Alert case opened",
        timestamp: "Today · 9:00 AM",
        detail: "New security alert case opened for Priya Sharma at Priya Sharma (Personal).",
        dot: "orange",
      },
      {
        id: "priya_sharma-h2",
        title: "Account verified",
        timestamp: "Feb 10, 2026 · 2:00 PM",
        detail: "Identity and account details verified for Priya Sharma.",
        dot: "gray",
      },
      {
        id: "priya_sharma-h3",
        title: "Account created",
        timestamp: "Dec 2022, 2023 · 10:00 AM",
        detail: "Priya Sharma joined Priya Sharma (Personal). Account created and onboarding completed.",
        dot: "green",
      },
    ],
    queue: {
      time: "10m",
      preview: "Account security alert — unauthorized login detected",
      priority: "High",
      priorityClassName: "border-[#FFB800] bg-[#FFF6E0] text-[#A37A00]",
      badgeColor: "bg-[#166CCA]",
      icon: "clipboardList",
      isActive: false,
      createdAt: "2026-04-27T09:00:00",
      updatedAt: "2026-04-27T09:05:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 9:00 AM",
        draft: "I've reviewed your security alert case, Priya. Here's what I can see and the steps I'm taking to resolve this for you right now.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hi, I'm reaching out about: Account security alert — unauthorized login detected. Can you help?",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Priya, I've reviewed your case regarding security alert. Let me look into this for you.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "I appreciate that — this has been an ongoing issue and I need it resolved today.",
            time: "9:04 AM",
          }
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 9:00 AM",
        draft: "Hi Priya — I've looked into your case. I'm working on a resolution and will update you shortly.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Need help — account security alert — unauthorized login detected.",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Priya — I can see your case. Reviewing details now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thanks. Please let me know as soon as you have an update.",
            time: "9:04 AM",
          }
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 9:00 AM",
        draft: "Hi Priya — I've reviewed your case. I have what I need to help you resolve this security alert issue.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hello, I need help with a security alert issue — account security alert — unauthorized login detected",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Priya! I can see your case details. I'm reviewing everything now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Great — please update me here when you have news.",
            time: "9:04 AM",
          }
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 9:00 AM",
        draft: "Hi Priya — thank you for your patience. I've reviewed your security alert case in detail and I'm ready to walk you through the next steps.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Subject: Security Alert - Urgent Assistance Needed\n\nHello,\n\nI need assistance with the following: Account security alert — unauthorized login detected. Please respond as soon as possible.\n\nThank you,\nPriya Sharma",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Priya,\n\nThank you for reaching out. I've reviewed your case and I'm working on resolving your security alert issue. I'll have an update for you shortly.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thank you for the quick response. Please prioritise this — it's time-sensitive.",
            time: "9:04 AM",
          }
        ],
      },
    },
    customerSnapshot: [
      "3-year customer with specialized investment needs",
      "Portfolio includes both US and international holdings",
      "No disputes; excellent credit standing",
      "Highly educated with strong financial literacy",
      "Global perspective; interested in currency hedging",
    ],
  },
  {
    id: "robert_okafor",
    initials: "RO",
    name: "Robert Okafor",
    customerId: "CST-21004",
    lastUpdated: "04/27/26 | 09:00 AM",
    profile: {
      department: "Business Banking",
      tenureYears: 5,
      totalAUM: "$406,548.00",
      financialReadiness: 84,
      financialAdvisor: "Emma Wilson",
      advisorTitle: "Senior Account Manager",
      tags: ["Premier"],
      fraudRiskScore: 62,
      priorDisputeCount: 1,
      cardBlocked: false,
    },
    conversationTopics: [
      "Resolve technical error issue",
      "Review account status",
      "Confirm resolution and next steps",
    ],
    contact: {
      email: "robert.okafor@bluelinelogistics.com",
      phone: "(268) 555-1212",
      address: { street: "312 Commerce St", city: "Dallas", state: "TX", zip: "75201", country: "US" },
    },
    accounts: [
      { id: "robert_okafor-chk", type: "Checking", number: "***1148", balance: "$30,164.00",
          availableBalance: "$30,164.00", status: "active", openedDate: "Jan 2024" },
      { id: "robert_okafor-sav", type: "Savings", number: "***2212", balance: "$66,692.00", status: "active", openedDate: "Feb 2024" },
    ],
    overview: {
      contactNumber: "(268) 555-1212",
      assignedAgent: "Emma Wilson",
      pronoun: "he",
      lastContactTime: "Today, 9:05 AM",
      address: "312 Commerce St, Dallas, TX 75201",
    },
    interactionTimeline: [
      {
        id: "robert_okafor-case-opened",
        title: "Case opened — Technical Error",
        timestamp: "Today · 9:00 AM",
        detail: "Robert Okafor contacted support regarding: API integration errors after platform migration.",
        tone: "default",
        sortOrder: 1,
      },
      {
        id: "robert_okafor-bot-review",
        title: "Virtual agent reviewed case",
        timestamp: "Today · 9:02 AM",
        detail: "AI assistant reviewed the case details and initiated technical error resolution workflow.",
        tone: "info",
        sortOrder: 2,
      },
      {
        id: "robert_okafor-escalated",
        title: "Escalated to human agent",
        timestamp: "Today · 9:05 AM",
        detail: "Case escalated to human agent due to complexity of technical error issue requiring manual intervention.",
        tone: "warning",
        sortOrder: 3,
      },
    ],
    customerHistory: [
      {
        id: "robert_okafor-h1",
        title: "Technical Error case opened",
        timestamp: "Today · 9:00 AM",
        detail: "New technical error case opened for Robert Okafor at BlueLine Logistics.",
        dot: "orange",
      },
      {
        id: "robert_okafor-h2",
        title: "Account verified",
        timestamp: "Jan 22, 2026 · 2:00 PM",
        detail: "Identity and account details verified for Robert Okafor.",
        dot: "gray",
      },
      {
        id: "robert_okafor-h3",
        title: "Account created",
        timestamp: "Mar 2023, 2020 · 10:00 AM",
        detail: "Robert Okafor joined BlueLine Logistics. Account created and onboarding completed.",
        dot: "green",
      },
    ],
    queue: {
      time: "22m",
      preview: "API integration errors after platform migration",
      priority: "Medium",
      priorityClassName: "border-[#0288D1] bg-[#E3F4FD] text-[#0277BD]",
      badgeColor: "bg-[#0288D1]",
      icon: "phone",
      isActive: false,
      createdAt: "2026-04-27T09:00:00",
      updatedAt: "2026-04-27T09:05:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 9:00 AM",
        draft: "I've reviewed your technical error case, Robert. Here's what I can see and the steps I'm taking to resolve this for you right now.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hi, I'm reaching out about: API integration errors after platform migration. Can you help?",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Robert, I've reviewed your case regarding technical error. Let me look into this for you.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "I appreciate that — this has been an ongoing issue and I need it resolved today.",
            time: "9:04 AM",
          }
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 9:00 AM",
        draft: "Hi Robert — I've looked into your case. I'm working on a resolution and will update you shortly.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Need help — api integration errors after platform migration.",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Robert — I can see your case. Reviewing details now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thanks. Please let me know as soon as you have an update.",
            time: "9:04 AM",
          }
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 9:00 AM",
        draft: "Hi Robert — I've reviewed your case. I have what I need to help you resolve this technical error issue.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hello, I need help with a technical error issue — api integration errors after platform migration",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Robert! I can see your case details. I'm reviewing everything now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Great — please update me here when you have news.",
            time: "9:04 AM",
          }
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 9:00 AM",
        draft: "Hi Robert — thank you for your patience. I've reviewed your technical error case in detail and I'm ready to walk you through the next steps.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Subject: Technical Error - Urgent Assistance Needed\n\nHello,\n\nI need assistance with the following: API integration errors after platform migration. Please respond as soon as possible.\n\nThank you,\nRobert Okafor",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Robert,\n\nThank you for reaching out. I've reviewed your case and I'm working on resolving your technical error issue. I'll have an update for you shortly.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thank you for the quick response. Please prioritise this — it's time-sensitive.",
            time: "9:04 AM",
          }
        ],
      },
    },
    customerSnapshot: [
      "5-year customer with $700K in combined accounts",
      "Business owner with business and personal banking",
      "1 prior dispute related to business payment processing",
      "Detail-oriented; meticulous record keeper",
      "Prefers documentation; wants full audit trails",
    ],
  },
  {
    id: "lisa_montenegro",
    initials: "LM",
    name: "Lisa Montenegro",
    customerId: "CST-21005",
    lastUpdated: "04/27/26 | 09:00 AM",
    profile: {
      department: "Commercial Real Estate",
      tenureYears: 4,
      totalAUM: "$495,685.00",
      financialReadiness: 40,
      financialAdvisor: "Jeff Comstock",
      advisorTitle: "Senior Account Manager",
      tags: ["Standard"],
      fraudRiskScore: 75,
      priorDisputeCount: 2,
      cardBlocked: false,
    },
    conversationTopics: [
      "Resolve compliance request issue",
      "Review account status",
      "Confirm resolution and next steps",
    ],
    contact: {
      email: "lisa.montenegro@coastalrealty.com",
      phone: "(285) 555-1265",
      address: { street: "500 Peachtree Rd", city: "Atlanta", state: "GA", zip: "30308", country: "US" },
    },
    accounts: [
      { id: "lisa_montenegro-chk", type: "Checking", number: "***1185", balance: "$33,955.00",
          availableBalance: "$33,955.00", status: "active", openedDate: "Apr 2020" },
      { id: "lisa_montenegro-sav", type: "Savings", number: "***2265", balance: "$70,865.00", status: "active", openedDate: "May 2020" },
    ],
    overview: {
      contactNumber: "(285) 555-1265",
      assignedAgent: "Jeff Comstock",
      pronoun: "she",
      lastContactTime: "Today, 9:05 AM",
      address: "500 Peachtree Rd, Atlanta, GA 30308",
    },
    interactionTimeline: [
      {
        id: "lisa_montenegro-case-opened",
        title: "Case opened — Compliance Request",
        timestamp: "Today · 9:00 AM",
        detail: "Lisa Montenegro contacted support regarding: Bulk data export request — compliance deadline.",
        tone: "default",
        sortOrder: 1,
      },
      {
        id: "lisa_montenegro-bot-review",
        title: "Virtual agent reviewed case",
        timestamp: "Today · 9:02 AM",
        detail: "AI assistant reviewed the case details and initiated compliance request resolution workflow.",
        tone: "info",
        sortOrder: 2,
      },
      {
        id: "lisa_montenegro-escalated",
        title: "Escalated to human agent",
        timestamp: "Today · 9:05 AM",
        detail: "Case escalated to human agent due to complexity of compliance request issue requiring manual intervention.",
        tone: "warning",
        sortOrder: 3,
      },
    ],
    customerHistory: [
      {
        id: "lisa_montenegro-h1",
        title: "Compliance Request case opened",
        timestamp: "Today · 9:00 AM",
        detail: "New compliance request case opened for Lisa Montenegro at Coastal Realty Partners.",
        dot: "orange",
      },
      {
        id: "lisa_montenegro-h2",
        title: "Account verified",
        timestamp: "Mar 5, 2026 · 2:00 PM",
        detail: "Identity and account details verified for Lisa Montenegro.",
        dot: "gray",
      },
      {
        id: "lisa_montenegro-h3",
        title: "Account created",
        timestamp: "Jun 2019, 2021 · 10:00 AM",
        detail: "Lisa Montenegro joined Coastal Realty Partners. Account created and onboarding completed.",
        dot: "green",
      },
    ],
    queue: {
      time: "30m",
      preview: "Bulk data export request — compliance deadline",
      priority: "Medium",
      priorityClassName: "border-[#0288D1] bg-[#E3F4FD] text-[#0277BD]",
      badgeColor: "bg-[#0288D1]",
      icon: "clipboardList",
      isActive: false,
      createdAt: "2026-04-27T09:00:00",
      updatedAt: "2026-04-27T09:05:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 9:00 AM",
        draft: "I've reviewed your compliance request case, Lisa. Here's what I can see and the steps I'm taking to resolve this for you right now.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hi, I'm reaching out about: Bulk data export request — compliance deadline. Can you help?",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Lisa, I've reviewed your case regarding compliance request. Let me look into this for you.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "I appreciate that — this has been an ongoing issue and I need it resolved today.",
            time: "9:04 AM",
          }
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 9:00 AM",
        draft: "Hi Lisa — I've looked into your case. I'm working on a resolution and will update you shortly.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Need help — bulk data export request — compliance deadline.",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Lisa — I can see your case. Reviewing details now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thanks. Please let me know as soon as you have an update.",
            time: "9:04 AM",
          }
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 9:00 AM",
        draft: "Hi Lisa — I've reviewed your case. I have what I need to help you resolve this compliance request issue.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hello, I need help with a compliance request issue — bulk data export request — compliance deadline",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Lisa! I can see your case details. I'm reviewing everything now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Great — please update me here when you have news.",
            time: "9:04 AM",
          }
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 9:00 AM",
        draft: "Hi Lisa — thank you for your patience. I've reviewed your compliance request case in detail and I'm ready to walk you through the next steps.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Subject: Compliance Request - Urgent Assistance Needed\n\nHello,\n\nI need assistance with the following: Bulk data export request — compliance deadline. Please respond as soon as possible.\n\nThank you,\nLisa Montenegro",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Lisa,\n\nThank you for reaching out. I've reviewed your case and I'm working on resolving your compliance request issue. I'll have an update for you shortly.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thank you for the quick response. Please prioritise this — it's time-sensitive.",
            time: "9:04 AM",
          }
        ],
      },
    },
    customerSnapshot: [
      "4-year customer with modest personal accounts",
      "Consistent saver; interested in retirement planning",
      "No prior disputes; stable income",
      "Participates in financial literacy workshops",
      "Warm personality; appreciates personalized service",
    ],
  },
  {
    id: "kevin_tran",
    initials: "KT",
    name: "Kevin Tran",
    customerId: "CST-11130",
    lastUpdated: "04/27/26 | 09:00 AM",
    profile: {
      department: "Enterprise Accounts",
      tenureYears: 3,
      totalAUM: "$584,822.00",
      financialReadiness: 51,
      financialAdvisor: "Marcus Lee",
      advisorTitle: "Senior Account Manager",
      tags: ["Premier"],
      fraudRiskScore: 18,
      priorDisputeCount: 0,
      cardBlocked: false,
    },
    conversationTopics: [
      "Resolve billing dispute issue",
      "Review account status",
      "Confirm resolution and next steps",
    ],
    contact: {
      email: "kevin.tran@orionpharma.com",
      phone: "(302) 555-1318",
      address: { street: "700 Mission St", city: "San Francisco", state: "CA", zip: "94103", country: "US" },
    },
    accounts: [
      { id: "kevin_tran-chk", type: "Business", number: "***1222", balance: "$56,422.00",
          availableBalance: "$56,422.00", status: "active", openedDate: "Jul 2021" },
      { id: "kevin_tran-sav", type: "Savings", number: "***2318", balance: "$75,038.00", status: "active", openedDate: "Aug 2021" },
    ],
    overview: {
      contactNumber: "(302) 555-1318",
      assignedAgent: "Marcus Lee",
      pronoun: "he",
      lastContactTime: "Today, 9:05 AM",
      address: "700 Mission St, San Francisco, CA 94103",
    },
    interactionTimeline: [
      {
        id: "kevin_tran-case-opened",
        title: "Case opened — Billing Dispute",
        timestamp: "Today · 9:00 AM",
        detail: "Kevin Tran contacted support regarding: Billing system discrepancy causing double invoices.",
        tone: "warning",
        sortOrder: 1,
      },
      {
        id: "kevin_tran-bot-review",
        title: "Virtual agent reviewed case",
        timestamp: "Today · 9:02 AM",
        detail: "AI assistant reviewed the case details and initiated billing dispute resolution workflow.",
        tone: "info",
        sortOrder: 2,
      },
      {
        id: "kevin_tran-escalated",
        title: "Escalated to human agent",
        timestamp: "Today · 9:05 AM",
        detail: "Case escalated to human agent due to complexity of billing dispute issue requiring manual intervention.",
        tone: "critical",
        sortOrder: 3,
      },
    ],
    customerHistory: [
      {
        id: "kevin_tran-h1",
        title: "Billing Dispute case opened",
        timestamp: "Today · 9:00 AM",
        detail: "New billing dispute case opened for Kevin Tran at Orion Pharma Group.",
        dot: "orange",
      },
      {
        id: "kevin_tran-h2",
        title: "Account verified",
        timestamp: "Feb 10, 2026 · 2:00 PM",
        detail: "Identity and account details verified for Kevin Tran.",
        dot: "gray",
      },
      {
        id: "kevin_tran-h3",
        title: "Account created",
        timestamp: "Sep 2020, 2022 · 10:00 AM",
        detail: "Kevin Tran joined Orion Pharma Group. Account created and onboarding completed.",
        dot: "green",
      },
    ],
    queue: {
      time: "5m",
      preview: "Billing system discrepancy causing double invoices",
      priority: "Critical",
      priorityClassName: "border-[#E53935] bg-[#FDEAEA] text-[#C71D1A]",
      badgeColor: "bg-[#E32926]",
      icon: "phone",
      isActive: false,
      createdAt: "2026-04-27T09:00:00",
      updatedAt: "2026-04-27T09:05:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 9:00 AM",
        draft: "I've reviewed your billing dispute case, Kevin. Here's what I can see and the steps I'm taking to resolve this for you right now.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hi, I'm reaching out about: Billing system discrepancy causing double invoices. Can you help?",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Kevin, I've reviewed your case regarding billing dispute. Let me look into this for you.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "I appreciate that — this has been an ongoing issue and I need it resolved today.",
            time: "9:04 AM",
          }
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 9:00 AM",
        draft: "Hi Kevin — I've looked into your case. I'm working on a resolution and will update you shortly.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Need help — billing system discrepancy causing double invoices.",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Kevin — I can see your case. Reviewing details now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thanks. Please let me know as soon as you have an update.",
            time: "9:04 AM",
          }
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 9:00 AM",
        draft: "Hi Kevin — I've reviewed your case. I have what I need to help you resolve this billing dispute issue.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hello, I need help with a billing dispute issue — billing system discrepancy causing double invoices",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Kevin! I can see your case details. I'm reviewing everything now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Great — please update me here when you have news.",
            time: "9:04 AM",
          }
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 9:00 AM",
        draft: "Hi Kevin — thank you for your patience. I've reviewed your billing dispute case in detail and I'm ready to walk you through the next steps.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Subject: Billing Dispute - Urgent Assistance Needed\n\nHello,\n\nI need assistance with the following: Billing system discrepancy causing double invoices. Please respond as soon as possible.\n\nThank you,\nKevin Tran",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Kevin,\n\nThank you for reaching out. I've reviewed your case and I'm working on resolving your billing dispute issue. I'll have an update for you shortly.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thank you for the quick response. Please prioritise this — it's time-sensitive.",
            time: "9:04 AM",
          }
        ],
      },
    },
    customerSnapshot: [
      "2-year newer customer with growth trajectory",
      "Tech startup founder; accelerating account activity",
      "Zero disputes; clean background check",
      "Very digitally native; expects seamless integrations",
      "Fast-paced communication style; values brevity",
    ],
  },
  {
    id: "angela_russo",
    initials: "AR",
    name: "Angela Russo",
    customerId: "CST-11247",
    lastUpdated: "04/27/26 | 09:00 AM",
    profile: {
      department: "Corporate Services",
      tenureYears: 2,
      totalAUM: "$673,959.00",
      financialReadiness: 62,
      financialAdvisor: "Sarah Chen",
      advisorTitle: "Senior Account Manager",
      tags: ["Standard"],
      fraudRiskScore: 31,
      priorDisputeCount: 1,
      cardBlocked: false,
    },
    conversationTopics: [
      "Resolve payment issue issue",
      "Review account status",
      "Confirm resolution and next steps",
    ],
    contact: {
      email: "angela.russo@clearwaterconsulting.com",
      phone: "(319) 555-1371",
      address: { street: "1200 Brickell Ave", city: "Miami", state: "FL", zip: "33131", country: "US" },
    },
    accounts: [
      { id: "angela_russo-chk", type: "Checking", number: "***1259", balance: "$41,537.00",
          availableBalance: "$41,537.00", status: "active", openedDate: "Oct 2022" },
      { id: "angela_russo-sav", type: "Savings", number: "***2371", balance: "$79,211.00", status: "active", openedDate: "Nov 2022" },
    ],
    overview: {
      contactNumber: "(319) 555-1371",
      assignedAgent: "Sarah Chen",
      pronoun: "she",
      lastContactTime: "Today, 9:05 AM",
      address: "1200 Brickell Ave, Miami, FL 33131",
    },
    interactionTimeline: [
      {
        id: "angela_russo-case-opened",
        title: "Case opened — Payment Issue",
        timestamp: "Today · 9:00 AM",
        detail: "Angela Russo contacted support regarding: Request to update payment method on file.",
        tone: "default",
        sortOrder: 1,
      },
      {
        id: "angela_russo-bot-review",
        title: "Virtual agent reviewed case",
        timestamp: "Today · 9:02 AM",
        detail: "AI assistant reviewed the case details and initiated payment issue resolution workflow.",
        tone: "info",
        sortOrder: 2,
      },
      {
        id: "angela_russo-escalated",
        title: "Escalated to human agent",
        timestamp: "Today · 9:05 AM",
        detail: "Case escalated to human agent due to complexity of payment issue issue requiring manual intervention.",
        tone: "warning",
        sortOrder: 3,
      },
    ],
    customerHistory: [
      {
        id: "angela_russo-h1",
        title: "Payment Issue case opened",
        timestamp: "Today · 9:00 AM",
        detail: "New payment issue case opened for Angela Russo at Clearwater Consulting.",
        dot: "orange",
      },
      {
        id: "angela_russo-h2",
        title: "Account verified",
        timestamp: "Jan 22, 2026 · 2:00 PM",
        detail: "Identity and account details verified for Angela Russo.",
        dot: "gray",
      },
      {
        id: "angela_russo-h3",
        title: "Account created",
        timestamp: "Dec 2021, 2023 · 10:00 AM",
        detail: "Angela Russo joined Clearwater Consulting. Account created and onboarding completed.",
        dot: "green",
      },
    ],
    queue: {
      time: "55m",
      preview: "Request to update payment method on file",
      priority: "Low",
      priorityClassName: "border-[#43A047] bg-[#E8F5E9] text-[#2E7D32]",
      badgeColor: "bg-[#43A047]",
      icon: "messageSquare",
      isActive: false,
      createdAt: "2026-04-27T09:00:00",
      updatedAt: "2026-04-27T09:05:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 9:00 AM",
        draft: "I've reviewed your payment issue case, Angela. Here's what I can see and the steps I'm taking to resolve this for you right now.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hi, I'm reaching out about: Request to update payment method on file. Can you help?",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Angela, I've reviewed your case regarding payment issue. Let me look into this for you.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "I appreciate that — this has been an ongoing issue and I need it resolved today.",
            time: "9:04 AM",
          }
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 9:00 AM",
        draft: "Hi Angela — I've looked into your case. I'm working on a resolution and will update you shortly.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Need help — request to update payment method on file.",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Angela — I can see your case. Reviewing details now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thanks. Please let me know as soon as you have an update.",
            time: "9:04 AM",
          }
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 9:00 AM",
        draft: "Hi Angela — I've reviewed your case. I have what I need to help you resolve this payment issue issue.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hello, I need help with a payment issue issue — request to update payment method on file",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Angela! I can see your case details. I'm reviewing everything now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Great — please update me here when you have news.",
            time: "9:04 AM",
          }
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 9:00 AM",
        draft: "Hi Angela — thank you for your patience. I've reviewed your payment issue case in detail and I'm ready to walk you through the next steps.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Subject: Payment Issue - Urgent Assistance Needed\n\nHello,\n\nI need assistance with the following: Request to update payment method on file. Please respond as soon as possible.\n\nThank you,\nAngela Russo",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Angela,\n\nThank you for reaching out. I've reviewed your case and I'm working on resolving your payment issue issue. I'll have an update for you shortly.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thank you for the quick response. Please prioritise this — it's time-sensitive.",
            time: "9:04 AM",
          }
        ],
      },
    },
    customerSnapshot: [
      "8-year long-term customer with $900K+ AUM",
      "Business Banking advisor relationship",
      "Zero prior disputes; exemplary account standing",
      "Detail-focused; reviews statements thoroughly",
      "Refers other business owners; advocates for bank",
    ],
  },
  {
    id: "marcus_bell",
    initials: "MB",
    name: "Marcus Bell",
    customerId: "CST-11389",
    lastUpdated: "04/27/26 | 09:00 AM",
    profile: {
      department: "Technology Accounts",
      tenureYears: 1,
      totalAUM: "$763,096.00",
      financialReadiness: 73,
      financialAdvisor: "David Park",
      advisorTitle: "Senior Account Manager",
      tags: ["Premier"],
      fraudRiskScore: 44,
      priorDisputeCount: 2,
      cardBlocked: false,
    },
    conversationTopics: [
      "Resolve technical error issue",
      "Review account status",
      "Confirm resolution and next steps",
    ],
    contact: {
      email: "marcus.bell@vertexsystems.com",
      phone: "(336) 555-1424",
      address: { street: "45 Congress St", city: "Boston", state: "MA", zip: "02109", country: "US" },
    },
    accounts: [
      { id: "marcus_bell-chk", type: "Checking", number: "***1296", balance: "$45,328.00",
          availableBalance: "$45,328.00", status: "active", openedDate: "Jan 2023" },
      { id: "marcus_bell-sav", type: "Savings", number: "***2424", balance: "$83,384.00", status: "active", openedDate: "Feb 2023" },
    ],
    overview: {
      contactNumber: "(336) 555-1424",
      assignedAgent: "David Park",
      pronoun: "he",
      lastContactTime: "Today, 9:05 AM",
      address: "45 Congress St, Boston, MA 02109",
    },
    interactionTimeline: [
      {
        id: "marcus_bell-case-opened",
        title: "Case opened — Technical Error",
        timestamp: "Today · 9:00 AM",
        detail: "Marcus Bell contacted support regarding: SSO configuration broken after directory sync.",
        tone: "warning",
        sortOrder: 1,
      },
      {
        id: "marcus_bell-bot-review",
        title: "Virtual agent reviewed case",
        timestamp: "Today · 9:02 AM",
        detail: "AI assistant reviewed the case details and initiated technical error resolution workflow.",
        tone: "info",
        sortOrder: 2,
      },
      {
        id: "marcus_bell-escalated",
        title: "Escalated to human agent",
        timestamp: "Today · 9:05 AM",
        detail: "Case escalated to human agent due to complexity of technical error issue requiring manual intervention.",
        tone: "warning",
        sortOrder: 3,
      },
    ],
    customerHistory: [
      {
        id: "marcus_bell-h1",
        title: "Technical Error case opened",
        timestamp: "Today · 9:00 AM",
        detail: "New technical error case opened for Marcus Bell at Vertex Systems.",
        dot: "orange",
      },
      {
        id: "marcus_bell-h2",
        title: "Account verified",
        timestamp: "Mar 5, 2026 · 2:00 PM",
        detail: "Identity and account details verified for Marcus Bell.",
        dot: "gray",
      },
      {
        id: "marcus_bell-h3",
        title: "Account created",
        timestamp: "Mar 2022, 2020 · 10:00 AM",
        detail: "Marcus Bell joined Vertex Systems. Account created and onboarding completed.",
        dot: "green",
      },
    ],
    queue: {
      time: "8m",
      preview: "SSO configuration broken after directory sync",
      priority: "High",
      priorityClassName: "border-[#FFB800] bg-[#FFF6E0] text-[#A37A00]",
      badgeColor: "bg-[#166CCA]",
      icon: "clipboardList",
      isActive: false,
      createdAt: "2026-04-27T09:00:00",
      updatedAt: "2026-04-27T09:05:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 9:00 AM",
        draft: "I've reviewed your technical error case, Marcus. Here's what I can see and the steps I'm taking to resolve this for you right now.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hi, I'm reaching out about: SSO configuration broken after directory sync. Can you help?",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Marcus, I've reviewed your case regarding technical error. Let me look into this for you.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "I appreciate that — this has been an ongoing issue and I need it resolved today.",
            time: "9:04 AM",
          }
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 9:00 AM",
        draft: "Hi Marcus — I've looked into your case. I'm working on a resolution and will update you shortly.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Need help — sso configuration broken after directory sync.",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Marcus — I can see your case. Reviewing details now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thanks. Please let me know as soon as you have an update.",
            time: "9:04 AM",
          }
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 9:00 AM",
        draft: "Hi Marcus — I've reviewed your case. I have what I need to help you resolve this technical error issue.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hello, I need help with a technical error issue — sso configuration broken after directory sync",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Marcus! I can see your case details. I'm reviewing everything now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Great — please update me here when you have news.",
            time: "9:04 AM",
          }
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 9:00 AM",
        draft: "Hi Marcus — thank you for your patience. I've reviewed your technical error case in detail and I'm ready to walk you through the next steps.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Subject: Technical Error - Urgent Assistance Needed\n\nHello,\n\nI need assistance with the following: SSO configuration broken after directory sync. Please respond as soon as possible.\n\nThank you,\nMarcus Bell",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Marcus,\n\nThank you for reaching out. I've reviewed your case and I'm working on resolving your technical error issue. I'll have an update for you shortly.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thank you for the quick response. Please prioritise this — it's time-sensitive.",
            time: "9:04 AM",
          }
        ],
      },
    },
    customerSnapshot: [
      "3-year customer with moderately sized portfolio",
      "Mixed account usage; balanced savings approach",
      "No disputes; good standing",
      "Steady contributor; disciplined about budgeting",
      "Appreciates transparent fee structures and reporting",
    ],
  },
  {
    id: "sandra_yip",
    initials: "SY",
    name: "Sandra Yip",
    customerId: "CST-21006",
    lastUpdated: "04/27/26 | 09:00 AM",
    profile: {
      department: "Investment Services",
      tenureYears: 8,
      totalAUM: "$852,233.00",
      financialReadiness: 84,
      financialAdvisor: "Emma Wilson",
      advisorTitle: "Senior Account Manager",
      tags: ["Standard"],
      fraudRiskScore: 57,
      priorDisputeCount: 0,
      cardBlocked: false,
    },
    conversationTopics: [
      "Resolve account locked issue",
      "Review account status",
      "Confirm resolution and next steps",
    ],
    contact: {
      email: "sandra.yip@harborbridgecap.com",
      phone: "(353) 555-1477",
      address: { street: "3800 Las Vegas Blvd", city: "Las Vegas", state: "NV", zip: "89109", country: "US" },
    },
    accounts: [
      { id: "sandra_yip-chk", type: "Checking", number: "***1333", balance: "$49,119.00",
          availableBalance: "$49,119.00", status: "active", openedDate: "Apr 2024" },
      { id: "sandra_yip-sav", type: "Savings", number: "***2477", balance: "$87,557.00", status: "active", openedDate: "May 2024" },
    ],
    overview: {
      contactNumber: "(353) 555-1477",
      assignedAgent: "Emma Wilson",
      pronoun: "she",
      lastContactTime: "Today, 9:05 AM",
      address: "3800 Las Vegas Blvd, Las Vegas, NV 89109",
    },
    interactionTimeline: [
      {
        id: "sandra_yip-case-opened",
        title: "Case opened — Account Locked",
        timestamp: "Today · 9:00 AM",
        detail: "Sandra Yip contacted support regarding: Unable to access quarterly reports in portal.",
        tone: "default",
        sortOrder: 1,
      },
      {
        id: "sandra_yip-bot-review",
        title: "Virtual agent reviewed case",
        timestamp: "Today · 9:02 AM",
        detail: "AI assistant reviewed the case details and initiated account locked resolution workflow.",
        tone: "info",
        sortOrder: 2,
      },
      {
        id: "sandra_yip-escalated",
        title: "Escalated to human agent",
        timestamp: "Today · 9:05 AM",
        detail: "Case escalated to human agent due to complexity of account locked issue requiring manual intervention.",
        tone: "warning",
        sortOrder: 3,
      },
    ],
    customerHistory: [
      {
        id: "sandra_yip-h1",
        title: "Account Locked case opened",
        timestamp: "Today · 9:00 AM",
        detail: "New account locked case opened for Sandra Yip at Harbor Bridge Capital.",
        dot: "orange",
      },
      {
        id: "sandra_yip-h2",
        title: "Account verified",
        timestamp: "Feb 10, 2026 · 2:00 PM",
        detail: "Identity and account details verified for Sandra Yip.",
        dot: "gray",
      },
      {
        id: "sandra_yip-h3",
        title: "Account created",
        timestamp: "Jun 2023, 2021 · 10:00 AM",
        detail: "Sandra Yip joined Harbor Bridge Capital. Account created and onboarding completed.",
        dot: "green",
      },
    ],
    queue: {
      time: "30m",
      preview: "Unable to access quarterly reports in portal",
      priority: "Medium",
      priorityClassName: "border-[#0288D1] bg-[#E3F4FD] text-[#0277BD]",
      badgeColor: "bg-[#0288D1]",
      icon: "phone",
      isActive: false,
      createdAt: "2026-04-27T09:00:00",
      updatedAt: "2026-04-27T09:05:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 9:00 AM",
        draft: "I've reviewed your account locked case, Sandra. Here's what I can see and the steps I'm taking to resolve this for you right now.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hi, I'm reaching out about: Unable to access quarterly reports in portal. Can you help?",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Sandra, I've reviewed your case regarding account locked. Let me look into this for you.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "I appreciate that — this has been an ongoing issue and I need it resolved today.",
            time: "9:04 AM",
          }
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 9:00 AM",
        draft: "Hi Sandra — I've looked into your case. I'm working on a resolution and will update you shortly.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Need help — unable to access quarterly reports in portal.",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Sandra — I can see your case. Reviewing details now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thanks. Please let me know as soon as you have an update.",
            time: "9:04 AM",
          }
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 9:00 AM",
        draft: "Hi Sandra — I've reviewed your case. I have what I need to help you resolve this account locked issue.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hello, I need help with a account locked issue — unable to access quarterly reports in portal",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Sandra! I can see your case details. I'm reviewing everything now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Great — please update me here when you have news.",
            time: "9:04 AM",
          }
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 9:00 AM",
        draft: "Hi Sandra — thank you for your patience. I've reviewed your account locked case in detail and I'm ready to walk you through the next steps.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Subject: Account Locked - Urgent Assistance Needed\n\nHello,\n\nI need assistance with the following: Unable to access quarterly reports in portal. Please respond as soon as possible.\n\nThank you,\nSandra Yip",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Sandra,\n\nThank you for reaching out. I've reviewed your case and I'm working on resolving your account locked issue. I'll have an update for you shortly.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thank you for the quick response. Please prioritise this — it's time-sensitive.",
            time: "9:04 AM",
          }
        ],
      },
    },
    customerSnapshot: [
      "5-year customer with $650K in managed assets",
      "Primary focus on retirement and college savings",
      "Zero disputes; trusted customer",
      "Values expert guidance; relies on advisor recommendations",
      "Family-first approach; long-term planning focus",
    ],
  },
  {
    id: "derek_owens",
    initials: "DO",
    name: "Derek Owens",
    customerId: "CST-11508",
    lastUpdated: "04/27/26 | 09:00 AM",
    profile: {
      department: "Industrial Accounts",
      tenureYears: 7,
      totalAUM: "$941,370.00",
      financialReadiness: 40,
      financialAdvisor: "Jeff Comstock",
      advisorTitle: "Senior Account Manager",
      tags: ["Premier"],
      fraudRiskScore: 70,
      priorDisputeCount: 1,
      cardBlocked: false,
    },
    conversationTopics: [
      "Resolve contract & renewal issue",
      "Review account status",
      "Confirm resolution and next steps",
    ],
    contact: {
      email: "derek.owens@stonewallmfg.com",
      phone: "(370) 555-1530",
      address: { street: "200 SW 5th Ave", city: "Portland", state: "OR", zip: "97204", country: "US" },
    },
    accounts: [
      { id: "derek_owens-chk", type: "Checking", number: "***1370", balance: "$52,910.00",
          availableBalance: "$52,910.00", status: "active", openedDate: "Jul 2020" },
      { id: "derek_owens-sav", type: "Savings", number: "***2530", balance: "$91,730.00", status: "active", openedDate: "Aug 2020" },
    ],
    overview: {
      contactNumber: "(370) 555-1530",
      assignedAgent: "Jeff Comstock",
      pronoun: "he",
      lastContactTime: "Today, 9:05 AM",
      address: "200 SW 5th Ave, Portland, OR 97204",
    },
    interactionTimeline: [
      {
        id: "derek_owens-case-opened",
        title: "Case opened — Contract & Renewal",
        timestamp: "Today · 9:00 AM",
        detail: "Derek Owens contacted support regarding: Contract renewal terms need urgent clarification.",
        tone: "warning",
        sortOrder: 1,
      },
      {
        id: "derek_owens-bot-review",
        title: "Virtual agent reviewed case",
        timestamp: "Today · 9:02 AM",
        detail: "AI assistant reviewed the case details and initiated contract & renewal resolution workflow.",
        tone: "info",
        sortOrder: 2,
      },
      {
        id: "derek_owens-escalated",
        title: "Escalated to human agent",
        timestamp: "Today · 9:05 AM",
        detail: "Case escalated to human agent due to complexity of contract & renewal issue requiring manual intervention.",
        tone: "warning",
        sortOrder: 3,
      },
    ],
    customerHistory: [
      {
        id: "derek_owens-h1",
        title: "Contract & Renewal case opened",
        timestamp: "Today · 9:00 AM",
        detail: "New contract & renewal case opened for Derek Owens at Stonewall Manufacturing.",
        dot: "orange",
      },
      {
        id: "derek_owens-h2",
        title: "Account verified",
        timestamp: "Jan 22, 2026 · 2:00 PM",
        detail: "Identity and account details verified for Derek Owens.",
        dot: "gray",
      },
      {
        id: "derek_owens-h3",
        title: "Account created",
        timestamp: "Sep 2019, 2022 · 10:00 AM",
        detail: "Derek Owens joined Stonewall Manufacturing. Account created and onboarding completed.",
        dot: "green",
      },
    ],
    queue: {
      time: "15m",
      preview: "Contract renewal terms need urgent clarification",
      priority: "High",
      priorityClassName: "border-[#FFB800] bg-[#FFF6E0] text-[#A37A00]",
      badgeColor: "bg-[#166CCA]",
      icon: "phone",
      isActive: false,
      createdAt: "2026-04-27T09:00:00",
      updatedAt: "2026-04-27T09:05:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 9:00 AM",
        draft: "I've reviewed your contract & renewal case, Derek. Here's what I can see and the steps I'm taking to resolve this for you right now.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hi, I'm reaching out about: Contract renewal terms need urgent clarification. Can you help?",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Derek, I've reviewed your case regarding contract & renewal. Let me look into this for you.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "I appreciate that — this has been an ongoing issue and I need it resolved today.",
            time: "9:04 AM",
          }
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 9:00 AM",
        draft: "Hi Derek — I've looked into your case. I'm working on a resolution and will update you shortly.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Need help — contract renewal terms need urgent clarification.",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Derek — I can see your case. Reviewing details now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thanks. Please let me know as soon as you have an update.",
            time: "9:04 AM",
          }
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 9:00 AM",
        draft: "Hi Derek — I've reviewed your case. I have what I need to help you resolve this contract & renewal issue.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hello, I need help with a contract & renewal issue — contract renewal terms need urgent clarification",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Derek! I can see your case details. I'm reviewing everything now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Great — please update me here when you have news.",
            time: "9:04 AM",
          }
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 9:00 AM",
        draft: "Hi Derek — thank you for your patience. I've reviewed your contract & renewal case in detail and I'm ready to walk you through the next steps.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Subject: Contract & Renewal - Urgent Assistance Needed\n\nHello,\n\nI need assistance with the following: Contract renewal terms need urgent clarification. Please respond as soon as possible.\n\nThank you,\nDerek Owens",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Derek,\n\nThank you for reaching out. I've reviewed your case and I'm working on resolving your contract & renewal issue. I'll have an update for you shortly.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thank you for the quick response. Please prioritise this — it's time-sensitive.",
            time: "9:04 AM",
          }
        ],
      },
    },
    customerSnapshot: [
      "4-year customer with business account emphasis",
      "Small contracting business; irregular monthly patterns",
      "1 prior dispute about business tax deposit timing",
      "Hands-on business owner; stays very engaged",
      "Prefers talking directly to decision makers",
    ],
  },
  {
    id: "tom_hargrove",
    initials: "TH",
    name: "Tom Hargrove",
    customerId: "CST-11734",
    lastUpdated: "04/27/26 | 09:00 AM",
    profile: {
      department: "Retail Banking",
      tenureYears: 6,
      totalAUM: "$1,030,507.00",
      financialReadiness: 51,
      financialAdvisor: "Marcus Lee",
      advisorTitle: "Senior Account Manager",
      tags: ["Standard"],
      fraudRiskScore: 13,
      priorDisputeCount: 2,
      cardBlocked: false,
    },
    conversationTopics: [
      "Resolve billing dispute issue",
      "Review account status",
      "Confirm resolution and next steps",
    ],
    contact: {
      email: "tom.hargrove@greenleafretail.com",
      phone: "(387) 555-1583",
      address: { street: "601 N King Dr", city: "Milwaukee", state: "WI", zip: "53203", country: "US" },
    },
    accounts: [
      { id: "tom_hargrove-chk", type: "Checking", number: "***1407", balance: "$56,701.00",
          availableBalance: "$56,701.00", status: "active", openedDate: "Oct 2021" },
      { id: "tom_hargrove-sav", type: "Savings", number: "***2583", balance: "$95,903.00", status: "active", openedDate: "Nov 2021" },
    ],
    overview: {
      contactNumber: "(387) 555-1583",
      assignedAgent: "Marcus Lee",
      pronoun: "he",
      lastContactTime: "Today, 9:05 AM",
      address: "601 N King Dr, Milwaukee, WI 53203",
    },
    interactionTimeline: [
      {
        id: "tom_hargrove-case-opened",
        title: "Case opened — Billing Dispute",
        timestamp: "Today · 9:00 AM",
        detail: "Tom Hargrove contacted support regarding: Follow-up on last month's refund — confirmation needed.",
        tone: "default",
        sortOrder: 1,
      },
      {
        id: "tom_hargrove-bot-review",
        title: "Virtual agent reviewed case",
        timestamp: "Today · 9:02 AM",
        detail: "AI assistant reviewed the case details and initiated billing dispute resolution workflow.",
        tone: "info",
        sortOrder: 2,
      },
      {
        id: "tom_hargrove-escalated",
        title: "Escalated to human agent",
        timestamp: "Today · 9:05 AM",
        detail: "Case escalated to human agent due to complexity of billing dispute issue requiring manual intervention.",
        tone: "warning",
        sortOrder: 3,
      },
    ],
    customerHistory: [
      {
        id: "tom_hargrove-h1",
        title: "Billing Dispute case opened",
        timestamp: "Today · 9:00 AM",
        detail: "New billing dispute case opened for Tom Hargrove at GreenLeaf Retail.",
        dot: "orange",
      },
      {
        id: "tom_hargrove-h2",
        title: "Account verified",
        timestamp: "Mar 5, 2026 · 2:00 PM",
        detail: "Identity and account details verified for Tom Hargrove.",
        dot: "gray",
      },
      {
        id: "tom_hargrove-h3",
        title: "Account created",
        timestamp: "Dec 2020, 2023 · 10:00 AM",
        detail: "Tom Hargrove joined GreenLeaf Retail. Account created and onboarding completed.",
        dot: "green",
      },
    ],
    queue: {
      time: "55m",
      preview: "Follow-up on last month's refund — confirmation needed",
      priority: "Low",
      priorityClassName: "border-[#43A047] bg-[#E8F5E9] text-[#2E7D32]",
      badgeColor: "bg-[#43A047]",
      icon: "clipboardList",
      isActive: false,
      createdAt: "2026-04-27T09:00:00",
      updatedAt: "2026-04-27T09:05:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 9:00 AM",
        draft: "I've reviewed your billing dispute case, Tom. Here's what I can see and the steps I'm taking to resolve this for you right now.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hi, I'm reaching out about: Follow-up on last month's refund — confirmation needed. Can you help?",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Tom, I've reviewed your case regarding billing dispute. Let me look into this for you.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "I appreciate that — this has been an ongoing issue and I need it resolved today.",
            time: "9:04 AM",
          }
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 9:00 AM",
        draft: "Hi Tom — I've looked into your case. I'm working on a resolution and will update you shortly.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Need help — follow-up on last month's refund — confirmation needed.",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Tom — I can see your case. Reviewing details now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thanks. Please let me know as soon as you have an update.",
            time: "9:04 AM",
          }
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 9:00 AM",
        draft: "Hi Tom — I've reviewed your case. I have what I need to help you resolve this billing dispute issue.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hello, I need help with a billing dispute issue — follow-up on last month's refund — confirmation needed",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Tom! I can see your case details. I'm reviewing everything now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Great — please update me here when you have news.",
            time: "9:04 AM",
          }
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 9:00 AM",
        draft: "Hi Tom — thank you for your patience. I've reviewed your billing dispute case in detail and I'm ready to walk you through the next steps.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Subject: Billing Dispute - Urgent Assistance Needed\n\nHello,\n\nI need assistance with the following: Follow-up on last month's refund — confirmation needed. Please respond as soon as possible.\n\nThank you,\nTom Hargrove",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Tom,\n\nThank you for reaching out. I've reviewed your case and I'm working on resolving your billing dispute issue. I'll have an update for you shortly.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thank you for the quick response. Please prioritise this — it's time-sensitive.",
            time: "9:04 AM",
          }
        ],
      },
    },
    customerSnapshot: [
      "7-year veteran customer with $1.2M+ portfolio",
      "Business Banking Premier tier member",
      "Zero prior disputes; stellar relationship",
      "Executive-level account management required",
      "Strategic business advisor; values partnership approach",
    ],
  },
  {
    id: "nadia_petrov",
    initials: "NP",
    name: "Nadia Petrov",
    customerId: "CST-11856",
    lastUpdated: "04/27/26 | 09:00 AM",
    profile: {
      department: "International Trade",
      tenureYears: 5,
      totalAUM: "$1,119,644.00",
      financialReadiness: 62,
      financialAdvisor: "Sarah Chen",
      advisorTitle: "Senior Account Manager",
      tags: ["Premier"],
      fraudRiskScore: 26,
      priorDisputeCount: 0,
      cardBlocked: false,
    },
    conversationTopics: [
      "Resolve payment issue issue",
      "Review account status",
      "Confirm resolution and next steps",
    ],
    contact: {
      email: "nadia.petrov@eurozoneTrade.com",
      phone: "(404) 555-1636",
      address: { street: "1400 Market St", city: "Philadelphia", state: "PA", zip: "19103", country: "US" },
    },
    accounts: [
      { id: "nadia_petrov-chk", type: "Business", number: "***1444", balance: "$87,844.00",
          availableBalance: "$87,844.00", status: "active", openedDate: "Jan 2022" },
      { id: "nadia_petrov-sav", type: "Savings", number: "***2636", balance: "$100,076.00", status: "active", openedDate: "Feb 2022" },
    ],
    overview: {
      contactNumber: "(404) 555-1636",
      assignedAgent: "Sarah Chen",
      pronoun: "she",
      lastContactTime: "Today, 9:05 AM",
      address: "1400 Market St, Philadelphia, PA 19103",
    },
    interactionTimeline: [
      {
        id: "nadia_petrov-case-opened",
        title: "Case opened — Payment Issue",
        timestamp: "Today · 9:00 AM",
        detail: "Nadia Petrov contacted support regarding: International wire transfer delay beyond SLA window.",
        tone: "default",
        sortOrder: 1,
      },
      {
        id: "nadia_petrov-bot-review",
        title: "Virtual agent reviewed case",
        timestamp: "Today · 9:02 AM",
        detail: "AI assistant reviewed the case details and initiated payment issue resolution workflow.",
        tone: "info",
        sortOrder: 2,
      },
      {
        id: "nadia_petrov-escalated",
        title: "Escalated to human agent",
        timestamp: "Today · 9:05 AM",
        detail: "Case escalated to human agent due to complexity of payment issue issue requiring manual intervention.",
        tone: "warning",
        sortOrder: 3,
      },
    ],
    customerHistory: [
      {
        id: "nadia_petrov-h1",
        title: "Payment Issue case opened",
        timestamp: "Today · 9:00 AM",
        detail: "New payment issue case opened for Nadia Petrov at Eurozone Trade Ltd..",
        dot: "orange",
      },
      {
        id: "nadia_petrov-h2",
        title: "Account verified",
        timestamp: "Feb 10, 2026 · 2:00 PM",
        detail: "Identity and account details verified for Nadia Petrov.",
        dot: "gray",
      },
      {
        id: "nadia_petrov-h3",
        title: "Account created",
        timestamp: "Mar 2021, 2020 · 10:00 AM",
        detail: "Nadia Petrov joined Eurozone Trade Ltd.. Account created and onboarding completed.",
        dot: "green",
      },
    ],
    queue: {
      time: "22m",
      preview: "International wire transfer delay beyond SLA window",
      priority: "Medium",
      priorityClassName: "border-[#0288D1] bg-[#E3F4FD] text-[#0277BD]",
      badgeColor: "bg-[#0288D1]",
      icon: "phone",
      isActive: false,
      createdAt: "2026-04-27T09:00:00",
      updatedAt: "2026-04-27T09:05:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 9:00 AM",
        draft: "I've reviewed your payment issue case, Nadia. Here's what I can see and the steps I'm taking to resolve this for you right now.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hi, I'm reaching out about: International wire transfer delay beyond SLA window. Can you help?",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Nadia, I've reviewed your case regarding payment issue. Let me look into this for you.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "I appreciate that — this has been an ongoing issue and I need it resolved today.",
            time: "9:04 AM",
          }
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 9:00 AM",
        draft: "Hi Nadia — I've looked into your case. I'm working on a resolution and will update you shortly.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Need help — international wire transfer delay beyond sla window.",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Nadia — I can see your case. Reviewing details now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thanks. Please let me know as soon as you have an update.",
            time: "9:04 AM",
          }
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 9:00 AM",
        draft: "Hi Nadia — I've reviewed your case. I have what I need to help you resolve this payment issue issue.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hello, I need help with a payment issue issue — international wire transfer delay beyond sla window",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Nadia! I can see your case details. I'm reviewing everything now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Great — please update me here when you have news.",
            time: "9:04 AM",
          }
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 9:00 AM",
        draft: "Hi Nadia — thank you for your patience. I've reviewed your payment issue case in detail and I'm ready to walk you through the next steps.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Subject: Payment Issue - Urgent Assistance Needed\n\nHello,\n\nI need assistance with the following: International wire transfer delay beyond SLA window. Please respond as soon as possible.\n\nThank you,\nNadia Petrov",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Nadia,\n\nThank you for reaching out. I've reviewed your case and I'm working on resolving your payment issue issue. I'll have an update for you shortly.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thank you for the quick response. Please prioritise this — it's time-sensitive.",
            time: "9:04 AM",
          }
        ],
      },
    },
    customerSnapshot: [
      "3-year customer with solid account growth",
      "Balanced personal and investment portfolio mix",
      "No disputes; reliable payment history",
      "European background; multilingual capabilities helpful",
      "Thorough planner; prefers detailed written summaries",
    ],
  },
  {
    id: "carlos_mendez",
    initials: "CM",
    name: "Carlos Mendez",
    customerId: "CST-11972",
    lastUpdated: "04/27/26 | 09:00 AM",
    profile: {
      department: "Energy Sector",
      tenureYears: 4,
      totalAUM: "$1,208,781.00",
      financialReadiness: 73,
      financialAdvisor: "David Park",
      advisorTitle: "Senior Account Manager",
      tags: ["Standard"],
      fraudRiskScore: 39,
      priorDisputeCount: 1,
      cardBlocked: false,
    },
    conversationTopics: [
      "Resolve service outage issue",
      "Review account status",
      "Confirm resolution and next steps",
    ],
    contact: {
      email: "carlos.mendez@southstarenergy.com",
      phone: "(421) 555-1689",
      address: { street: "900 W Olympic Blvd", city: "Los Angeles", state: "CA", zip: "90015", country: "US" },
    },
    accounts: [
      { id: "carlos_mendez-chk", type: "Checking", number: "***1481", balance: "$64,283.00",
          availableBalance: "$64,283.00", status: "active", openedDate: "Apr 2023" },
      { id: "carlos_mendez-sav", type: "Savings", number: "***2689", balance: "$104,249.00", status: "active", openedDate: "May 2023" },
    ],
    overview: {
      contactNumber: "(421) 555-1689",
      assignedAgent: "David Park",
      pronoun: "he",
      lastContactTime: "Today, 9:05 AM",
      address: "900 W Olympic Blvd, Los Angeles, CA 90015",
    },
    interactionTimeline: [
      {
        id: "carlos_mendez-case-opened",
        title: "Case opened — Service Outage",
        timestamp: "Today · 9:00 AM",
        detail: "Carlos Mendez contacted support regarding: Service outage impacting production pipeline monitoring.",
        tone: "warning",
        sortOrder: 1,
      },
      {
        id: "carlos_mendez-bot-review",
        title: "Virtual agent reviewed case",
        timestamp: "Today · 9:02 AM",
        detail: "AI assistant reviewed the case details and initiated service outage resolution workflow.",
        tone: "info",
        sortOrder: 2,
      },
      {
        id: "carlos_mendez-escalated",
        title: "Escalated to human agent",
        timestamp: "Today · 9:05 AM",
        detail: "Case escalated to human agent due to complexity of service outage issue requiring manual intervention.",
        tone: "warning",
        sortOrder: 3,
      },
    ],
    customerHistory: [
      {
        id: "carlos_mendez-h1",
        title: "Service Outage case opened",
        timestamp: "Today · 9:00 AM",
        detail: "New service outage case opened for Carlos Mendez at SouthStar Energy.",
        dot: "orange",
      },
      {
        id: "carlos_mendez-h2",
        title: "Account verified",
        timestamp: "Jan 22, 2026 · 2:00 PM",
        detail: "Identity and account details verified for Carlos Mendez.",
        dot: "gray",
      },
      {
        id: "carlos_mendez-h3",
        title: "Account created",
        timestamp: "Jun 2022, 2021 · 10:00 AM",
        detail: "Carlos Mendez joined SouthStar Energy. Account created and onboarding completed.",
        dot: "green",
      },
    ],
    queue: {
      time: "12m",
      preview: "Service outage impacting production pipeline monitoring",
      priority: "High",
      priorityClassName: "border-[#FFB800] bg-[#FFF6E0] text-[#A37A00]",
      badgeColor: "bg-[#166CCA]",
      icon: "phone",
      isActive: false,
      createdAt: "2026-04-27T09:00:00",
      updatedAt: "2026-04-27T09:05:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 9:00 AM",
        draft: "I've reviewed your service outage case, Carlos. Here's what I can see and the steps I'm taking to resolve this for you right now.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hi, I'm reaching out about: Service outage impacting production pipeline monitoring. Can you help?",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Carlos, I've reviewed your case regarding service outage. Let me look into this for you.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "I appreciate that — this has been an ongoing issue and I need it resolved today.",
            time: "9:04 AM",
          }
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 9:00 AM",
        draft: "Hi Carlos — I've looked into your case. I'm working on a resolution and will update you shortly.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Need help — service outage impacting production pipeline monitoring.",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Carlos — I can see your case. Reviewing details now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thanks. Please let me know as soon as you have an update.",
            time: "9:04 AM",
          }
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 9:00 AM",
        draft: "Hi Carlos — I've reviewed your case. I have what I need to help you resolve this service outage issue.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hello, I need help with a service outage issue — service outage impacting production pipeline monitoring",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Carlos! I can see your case details. I'm reviewing everything now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Great — please update me here when you have news.",
            time: "9:04 AM",
          }
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 9:00 AM",
        draft: "Hi Carlos — thank you for your patience. I've reviewed your service outage case in detail and I'm ready to walk you through the next steps.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Subject: Service Outage - Urgent Assistance Needed\n\nHello,\n\nI need assistance with the following: Service outage impacting production pipeline monitoring. Please respond as soon as possible.\n\nThank you,\nCarlos Mendez",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Carlos,\n\nThank you for reaching out. I've reviewed your case and I'm working on resolving your service outage issue. I'll have an update for you shortly.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thank you for the quick response. Please prioritise this — it's time-sensitive.",
            time: "9:04 AM",
          }
        ],
      },
    },
    customerSnapshot: [
      "2-year customer with $450K in accounts",
      "Real estate investor and business owner",
      "Zero disputes; strong financial discipline",
      "Bilingual Spanish/English; community advocate",
      "Wants transparent rates and fee schedules",
    ],
  },
  {
    id: "ingrid_holmberg",
    initials: "IH",
    name: "Ingrid Holmberg",
    customerId: "CST-21007",
    lastUpdated: "04/27/26 | 09:00 AM",
    profile: {
      department: "Logistics & Freight",
      tenureYears: 3,
      totalAUM: "$1,297,918.00",
      financialReadiness: 84,
      financialAdvisor: "Emma Wilson",
      advisorTitle: "Senior Account Manager",
      tags: ["Premier"],
      fraudRiskScore: 52,
      priorDisputeCount: 2,
      cardBlocked: false,
    },
    conversationTopics: [
      "Resolve compliance request issue",
      "Review account status",
      "Confirm resolution and next steps",
    ],
    contact: {
      email: "ingrid.holmberg@nordicfreight.com",
      phone: "(438) 555-1742",
      address: { street: "222 N LaSalle St", city: "Chicago", state: "IL", zip: "60601", country: "US" },
    },
    accounts: [
      { id: "ingrid_holmberg-chk", type: "Checking", number: "***1518", balance: "$68,074.00",
          availableBalance: "$68,074.00", status: "active", openedDate: "Jul 2024" },
      { id: "ingrid_holmberg-sav", type: "Savings", number: "***2742", balance: "$108,422.00", status: "active", openedDate: "Aug 2024" },
    ],
    overview: {
      contactNumber: "(438) 555-1742",
      assignedAgent: "Emma Wilson",
      pronoun: "she",
      lastContactTime: "Today, 9:05 AM",
      address: "222 N LaSalle St, Chicago, IL 60601",
    },
    interactionTimeline: [
      {
        id: "ingrid_holmberg-case-opened",
        title: "Case opened — Compliance Request",
        timestamp: "Today · 9:00 AM",
        detail: "Ingrid Holmberg contacted support regarding: Customs documentation error on recent shipment.",
        tone: "default",
        sortOrder: 1,
      },
      {
        id: "ingrid_holmberg-bot-review",
        title: "Virtual agent reviewed case",
        timestamp: "Today · 9:02 AM",
        detail: "AI assistant reviewed the case details and initiated compliance request resolution workflow.",
        tone: "info",
        sortOrder: 2,
      },
      {
        id: "ingrid_holmberg-escalated",
        title: "Escalated to human agent",
        timestamp: "Today · 9:05 AM",
        detail: "Case escalated to human agent due to complexity of compliance request issue requiring manual intervention.",
        tone: "warning",
        sortOrder: 3,
      },
    ],
    customerHistory: [
      {
        id: "ingrid_holmberg-h1",
        title: "Compliance Request case opened",
        timestamp: "Today · 9:00 AM",
        detail: "New compliance request case opened for Ingrid Holmberg at Nordic Freight Solutions.",
        dot: "orange",
      },
      {
        id: "ingrid_holmberg-h2",
        title: "Account verified",
        timestamp: "Mar 5, 2026 · 2:00 PM",
        detail: "Identity and account details verified for Ingrid Holmberg.",
        dot: "gray",
      },
      {
        id: "ingrid_holmberg-h3",
        title: "Account created",
        timestamp: "Sep 2023, 2022 · 10:00 AM",
        detail: "Ingrid Holmberg joined Nordic Freight Solutions. Account created and onboarding completed.",
        dot: "green",
      },
    ],
    queue: {
      time: "45m",
      preview: "Customs documentation error on recent shipment",
      priority: "Medium",
      priorityClassName: "border-[#0288D1] bg-[#E3F4FD] text-[#0277BD]",
      badgeColor: "bg-[#0288D1]",
      icon: "clipboardList",
      isActive: false,
      createdAt: "2026-04-27T09:00:00",
      updatedAt: "2026-04-27T09:05:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 9:00 AM",
        draft: "I've reviewed your compliance request case, Ingrid. Here's what I can see and the steps I'm taking to resolve this for you right now.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hi, I'm reaching out about: Customs documentation error on recent shipment. Can you help?",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Ingrid, I've reviewed your case regarding compliance request. Let me look into this for you.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "I appreciate that — this has been an ongoing issue and I need it resolved today.",
            time: "9:04 AM",
          }
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 9:00 AM",
        draft: "Hi Ingrid — I've looked into your case. I'm working on a resolution and will update you shortly.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Need help — customs documentation error on recent shipment.",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Ingrid — I can see your case. Reviewing details now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thanks. Please let me know as soon as you have an update.",
            time: "9:04 AM",
          }
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 9:00 AM",
        draft: "Hi Ingrid — I've reviewed your case. I have what I need to help you resolve this compliance request issue.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hello, I need help with a compliance request issue — customs documentation error on recent shipment",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Ingrid! I can see your case details. I'm reviewing everything now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Great — please update me here when you have news.",
            time: "9:04 AM",
          }
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 9:00 AM",
        draft: "Hi Ingrid — thank you for your patience. I've reviewed your compliance request case in detail and I'm ready to walk you through the next steps.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Subject: Compliance Request - Urgent Assistance Needed\n\nHello,\n\nI need assistance with the following: Customs documentation error on recent shipment. Please respond as soon as possible.\n\nThank you,\nIngrid Holmberg",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Ingrid,\n\nThank you for reaching out. I've reviewed your case and I'm working on resolving your compliance request issue. I'll have an update for you shortly.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thank you for the quick response. Please prioritise this — it's time-sensitive.",
            time: "9:04 AM",
          }
        ],
      },
    },
    customerSnapshot: [
      "6-year customer with $850K+ portfolio",
      "Nordic background; values efficiency and clarity",
      "No prior disputes; excellent standing",
      "Preference for email communication over phone",
      "Expects correct information first time every time",
    ],
  },
  {
    id: "yuki_tanaka",
    initials: "YT",
    name: "Yuki Tanaka",
    customerId: "CST-12301",
    lastUpdated: "04/27/26 | 09:00 AM",
    profile: {
      department: "Technology Accounts",
      tenureYears: 2,
      totalAUM: "$1,387,055.00",
      financialReadiness: 40,
      financialAdvisor: "Jeff Comstock",
      advisorTitle: "Senior Account Manager",
      tags: ["Standard"],
      fraudRiskScore: 65,
      priorDisputeCount: 0,
      cardBlocked: false,
    },
    conversationTopics: [
      "Resolve subscription upgrade issue",
      "Review account status",
      "Confirm resolution and next steps",
    ],
    contact: {
      email: "yuki.tanaka@tanakainnovations.com",
      phone: "(455) 555-1795",
      address: { street: "88 Broad St", city: "New York", state: "NY", zip: "10004", country: "US" },
    },
    accounts: [
      { id: "yuki_tanaka-chk", type: "Checking", number: "***1555", balance: "$71,865.00",
          availableBalance: "$71,865.00", status: "active", openedDate: "Oct 2020" },
      { id: "yuki_tanaka-sav", type: "Savings", number: "***2795", balance: "$112,595.00", status: "active", openedDate: "Nov 2020" },
    ],
    overview: {
      contactNumber: "(455) 555-1795",
      assignedAgent: "Jeff Comstock",
      pronoun: "she",
      lastContactTime: "Today, 9:05 AM",
      address: "88 Broad St, New York, NY 10004",
    },
    interactionTimeline: [
      {
        id: "yuki_tanaka-case-opened",
        title: "Case opened — Subscription Upgrade",
        timestamp: "Today · 9:00 AM",
        detail: "Yuki Tanaka contacted support regarding: Virtual agent unable to process my subscription upgrade.",
        tone: "warning",
        sortOrder: 1,
      },
      {
        id: "yuki_tanaka-bot-review",
        title: "Virtual agent reviewed case",
        timestamp: "Today · 9:02 AM",
        detail: "AI assistant reviewed the case details and initiated subscription upgrade resolution workflow.",
        tone: "info",
        sortOrder: 2,
      },
      {
        id: "yuki_tanaka-escalated",
        title: "Escalated to human agent",
        timestamp: "Today · 9:05 AM",
        detail: "Case escalated to human agent due to complexity of subscription upgrade issue requiring manual intervention.",
        tone: "warning",
        sortOrder: 3,
      },
    ],
    customerHistory: [
      {
        id: "yuki_tanaka-h1",
        title: "Subscription Upgrade case opened",
        timestamp: "Today · 9:00 AM",
        detail: "New subscription upgrade case opened for Yuki Tanaka at Tanaka Innovations.",
        dot: "orange",
      },
      {
        id: "yuki_tanaka-h2",
        title: "Account verified",
        timestamp: "Feb 10, 2026 · 2:00 PM",
        detail: "Identity and account details verified for Yuki Tanaka.",
        dot: "gray",
      },
      {
        id: "yuki_tanaka-h3",
        title: "Account created",
        timestamp: "Dec 2019, 2023 · 10:00 AM",
        detail: "Yuki Tanaka joined Tanaka Innovations. Account created and onboarding completed.",
        dot: "green",
      },
    ],
    queue: {
      time: "10m",
      preview: "Virtual agent unable to process my subscription upgrade",
      priority: "High",
      priorityClassName: "border-[#FFB800] bg-[#FFF6E0] text-[#A37A00]",
      badgeColor: "bg-[#166CCA]",
      icon: "messageSquare",
      isActive: false,
      createdAt: "2026-04-27T09:00:00",
      updatedAt: "2026-04-27T09:05:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 9:00 AM",
        draft: "I've reviewed your subscription upgrade case, Yuki. Here's what I can see and the steps I'm taking to resolve this for you right now.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hi, I'm reaching out about: Virtual agent unable to process my subscription upgrade. Can you help?",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Yuki, I've reviewed your case regarding subscription upgrade. Let me look into this for you.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "I appreciate that — this has been an ongoing issue and I need it resolved today.",
            time: "9:04 AM",
          }
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 9:00 AM",
        draft: "Hi Yuki — I've looked into your case. I'm working on a resolution and will update you shortly.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Need help — virtual agent unable to process my subscription upgrade.",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Yuki — I can see your case. Reviewing details now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thanks. Please let me know as soon as you have an update.",
            time: "9:04 AM",
          }
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 9:00 AM",
        draft: "Hi Yuki — I've reviewed your case. I have what I need to help you resolve this subscription upgrade issue.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hello, I need help with a subscription upgrade issue — virtual agent unable to process my subscription upgrade",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Yuki! I can see your case details. I'm reviewing everything now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Great — please update me here when you have news.",
            time: "9:04 AM",
          }
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 9:00 AM",
        draft: "Hi Yuki — thank you for your patience. I've reviewed your subscription upgrade case in detail and I'm ready to walk you through the next steps.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Subject: Subscription Upgrade - Urgent Assistance Needed\n\nHello,\n\nI need assistance with the following: Virtual agent unable to process my subscription upgrade. Please respond as soon as possible.\n\nThank you,\nYuki Tanaka",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Yuki,\n\nThank you for reaching out. I've reviewed your case and I'm working on resolving your subscription upgrade issue. I'll have an update for you shortly.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thank you for the quick response. Please prioritise this — it's time-sensitive.",
            time: "9:04 AM",
          }
        ],
      },
    },
    customerSnapshot: [
      "4-year customer with international focus",
      "Manages cross-border payments and holdings",
      "Zero disputes; compliance-aware mindset",
      "Appreciates cultural sensitivity in communications",
      "Interested in ESG investment options",
    ],
  },
  {
    id: "amara_osei",
    initials: "AO",
    name: "Amara Osei",
    customerId: "CST-12415",
    lastUpdated: "04/27/26 | 09:00 AM",
    profile: {
      department: "Investment Services",
      tenureYears: 1,
      totalAUM: "$1,476,192.00",
      financialReadiness: 51,
      financialAdvisor: "Marcus Lee",
      advisorTitle: "Senior Account Manager",
      tags: ["Premier"],
      fraudRiskScore: 78,
      priorDisputeCount: 1,
      cardBlocked: false,
    },
    conversationTopics: [
      "Resolve identity verification issue",
      "Review account status",
      "Confirm resolution and next steps",
    ],
    contact: {
      email: "amara.osei@oseicapital.com",
      phone: "(472) 555-1848",
      address: { street: "1001 Fulton St", city: "San Francisco", state: "CA", zip: "94102", country: "US" },
    },
    accounts: [
      { id: "amara_osei-chk", type: "Checking", number: "***1592", balance: "$75,656.00",
          availableBalance: "$75,656.00", status: "active", openedDate: "Jan 2021" },
      { id: "amara_osei-sav", type: "Savings", number: "***2848", balance: "$116,768.00", status: "active", openedDate: "Feb 2021" },
    ],
    overview: {
      contactNumber: "(472) 555-1848",
      assignedAgent: "Marcus Lee",
      pronoun: "she",
      lastContactTime: "Today, 9:05 AM",
      address: "1001 Fulton St, San Francisco, CA 94102",
    },
    interactionTimeline: [
      {
        id: "amara_osei-case-opened",
        title: "Case opened — Identity Verification",
        timestamp: "Today · 9:00 AM",
        detail: "Amara Osei contacted support regarding: Bot keeps looping on my account verification — need a human.",
        tone: "default",
        sortOrder: 1,
      },
      {
        id: "amara_osei-bot-review",
        title: "Virtual agent reviewed case",
        timestamp: "Today · 9:02 AM",
        detail: "AI assistant reviewed the case details and initiated identity verification resolution workflow.",
        tone: "info",
        sortOrder: 2,
      },
      {
        id: "amara_osei-escalated",
        title: "Escalated to human agent",
        timestamp: "Today · 9:05 AM",
        detail: "Case escalated to human agent due to complexity of identity verification issue requiring manual intervention.",
        tone: "warning",
        sortOrder: 3,
      },
    ],
    customerHistory: [
      {
        id: "amara_osei-h1",
        title: "Identity Verification case opened",
        timestamp: "Today · 9:00 AM",
        detail: "New identity verification case opened for Amara Osei at Osei Capital Partners.",
        dot: "orange",
      },
      {
        id: "amara_osei-h2",
        title: "Account verified",
        timestamp: "Jan 22, 2026 · 2:00 PM",
        detail: "Identity and account details verified for Amara Osei.",
        dot: "gray",
      },
      {
        id: "amara_osei-h3",
        title: "Account created",
        timestamp: "Mar 2020, 2020 · 10:00 AM",
        detail: "Amara Osei joined Osei Capital Partners. Account created and onboarding completed.",
        dot: "green",
      },
    ],
    queue: {
      time: "22m",
      preview: "Bot keeps looping on my account verification — need a human",
      priority: "Medium",
      priorityClassName: "border-[#0288D1] bg-[#E3F4FD] text-[#0277BD]",
      badgeColor: "bg-[#0288D1]",
      icon: "phone",
      isActive: false,
      createdAt: "2026-04-27T09:00:00",
      updatedAt: "2026-04-27T09:05:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 9:00 AM",
        draft: "I've reviewed your identity verification case, Amara. Here's what I can see and the steps I'm taking to resolve this for you right now.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hi, I'm reaching out about: Bot keeps looping on my account verification — need a human. Can you help?",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Amara, I've reviewed your case regarding identity verification. Let me look into this for you.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "I appreciate that — this has been an ongoing issue and I need it resolved today.",
            time: "9:04 AM",
          }
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 9:00 AM",
        draft: "Hi Amara — I've looked into your case. I'm working on a resolution and will update you shortly.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Need help — bot keeps looping on my account verification — need a human.",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Amara — I can see your case. Reviewing details now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thanks. Please let me know as soon as you have an update.",
            time: "9:04 AM",
          }
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 9:00 AM",
        draft: "Hi Amara — I've reviewed your case. I have what I need to help you resolve this identity verification issue.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hello, I need help with a identity verification issue — bot keeps looping on my account verification — need a human",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Amara! I can see your case details. I'm reviewing everything now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Great — please update me here when you have news.",
            time: "9:04 AM",
          }
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 9:00 AM",
        draft: "Hi Amara — thank you for your patience. I've reviewed your identity verification case in detail and I'm ready to walk you through the next steps.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Subject: Identity Verification - Urgent Assistance Needed\n\nHello,\n\nI need assistance with the following: Bot keeps looping on my account verification — need a human. Please respond as soon as possible.\n\nThank you,\nAmara Osei",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Amara,\n\nThank you for reaching out. I've reviewed your case and I'm working on resolving your identity verification issue. I'll have an update for you shortly.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thank you for the quick response. Please prioritise this — it's time-sensitive.",
            time: "9:04 AM",
          }
        ],
      },
    },
    customerSnapshot: [
      "3-year customer with $500K in combined accounts",
      "Personal banking and small investment portfolio",
      "No prior disputes; building credit history",
      "First-generation investor; education-focused",
      "Wants clear explanations and learning resources",
    ],
  },
  {
    id: "patrick_obrien",
    initials: "PO",
    name: "Patrick O'Brien",
    customerId: "CST-12528",
    lastUpdated: "04/27/26 | 09:00 AM",
    profile: {
      department: "Professional Services",
      tenureYears: 8,
      totalAUM: "$1,565,329.00",
      financialReadiness: 62,
      financialAdvisor: "Sarah Chen",
      advisorTitle: "Senior Account Manager",
      tags: ["Standard"],
      fraudRiskScore: 21,
      priorDisputeCount: 2,
      cardBlocked: false,
    },
    conversationTopics: [
      "Resolve incorrect ai guidance issue",
      "Review account status",
      "Confirm resolution and next steps",
    ],
    contact: {
      email: "patrick.obrien@obrienassoc.com",
      phone: "(489) 555-1901",
      address: { street: "200 Granite Way", city: "Denver", state: "CO", zip: "80203", country: "US" },
    },
    accounts: [
      { id: "patrick_obrien-chk", type: "Checking", number: "***1629", balance: "$79,447.00",
          availableBalance: "$79,447.00", status: "active", openedDate: "Apr 2022" },
      { id: "patrick_obrien-sav", type: "Savings", number: "***2901", balance: "$120,941.00", status: "active", openedDate: "May 2022" },
    ],
    overview: {
      contactNumber: "(489) 555-1901",
      assignedAgent: "Sarah Chen",
      pronoun: "he",
      lastContactTime: "Today, 9:05 AM",
      address: "200 Granite Way, Denver, CO 80203",
    },
    interactionTimeline: [
      {
        id: "patrick_obrien-case-opened",
        title: "Case opened — Incorrect AI Guidance",
        timestamp: "Today · 9:00 AM",
        detail: "Patrick O'Brien contacted support regarding: AI suggested the wrong product — need correct recommendation.",
        tone: "default",
        sortOrder: 1,
      },
      {
        id: "patrick_obrien-bot-review",
        title: "Virtual agent reviewed case",
        timestamp: "Today · 9:02 AM",
        detail: "AI assistant reviewed the case details and initiated incorrect ai guidance resolution workflow.",
        tone: "info",
        sortOrder: 2,
      },
      {
        id: "patrick_obrien-escalated",
        title: "Escalated to human agent",
        timestamp: "Today · 9:05 AM",
        detail: "Case escalated to human agent due to complexity of incorrect ai guidance issue requiring manual intervention.",
        tone: "warning",
        sortOrder: 3,
      },
    ],
    customerHistory: [
      {
        id: "patrick_obrien-h1",
        title: "Incorrect AI Guidance case opened",
        timestamp: "Today · 9:00 AM",
        detail: "New incorrect ai guidance case opened for Patrick O'Brien at O'Brien & Associates.",
        dot: "orange",
      },
      {
        id: "patrick_obrien-h2",
        title: "Account verified",
        timestamp: "Mar 5, 2026 · 2:00 PM",
        detail: "Identity and account details verified for Patrick O'Brien.",
        dot: "gray",
      },
      {
        id: "patrick_obrien-h3",
        title: "Account created",
        timestamp: "Jun 2021, 2021 · 10:00 AM",
        detail: "Patrick O'Brien joined O'Brien & Associates. Account created and onboarding completed.",
        dot: "green",
      },
    ],
    queue: {
      time: "1h 30m",
      preview: "AI suggested the wrong product — need correct recommendation",
      priority: "Low",
      priorityClassName: "border-[#43A047] bg-[#E8F5E9] text-[#2E7D32]",
      badgeColor: "bg-[#43A047]",
      icon: "messageSquare",
      isActive: false,
      createdAt: "2026-04-27T09:00:00",
      updatedAt: "2026-04-27T09:05:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 9:00 AM",
        draft: "I've reviewed your incorrect ai guidance case, Patrick. Here's what I can see and the steps I'm taking to resolve this for you right now.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hi, I'm reaching out about: AI suggested the wrong product — need correct recommendation. Can you help?",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Patrick, I've reviewed your case regarding incorrect ai guidance. Let me look into this for you.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "I appreciate that — this has been an ongoing issue and I need it resolved today.",
            time: "9:04 AM",
          }
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 9:00 AM",
        draft: "Hi Patrick — I've looked into your case. I'm working on a resolution and will update you shortly.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Need help — ai suggested the wrong product — need correct recommendation.",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Patrick — I can see your case. Reviewing details now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thanks. Please let me know as soon as you have an update.",
            time: "9:04 AM",
          }
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 9:00 AM",
        draft: "Hi Patrick — I've reviewed your case. I have what I need to help you resolve this incorrect ai guidance issue.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hello, I need help with a incorrect ai guidance issue — ai suggested the wrong product — need correct recommendation",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Patrick! I can see your case details. I'm reviewing everything now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Great — please update me here when you have news.",
            time: "9:04 AM",
          }
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 9:00 AM",
        draft: "Hi Patrick — thank you for your patience. I've reviewed your incorrect ai guidance case in detail and I'm ready to walk you through the next steps.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Subject: Incorrect AI Guidance - Urgent Assistance Needed\n\nHello,\n\nI need assistance with the following: AI suggested the wrong product — need correct recommendation. Please respond as soon as possible.\n\nThank you,\nPatrick O'Brien",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Patrick,\n\nThank you for reaching out. I've reviewed your case and I'm working on resolving your incorrect ai guidance issue. I'll have an update for you shortly.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thank you for the quick response. Please prioritise this — it's time-sensitive.",
            time: "9:04 AM",
          }
        ],
      },
    },
    customerSnapshot: [
      "5-year customer with business banking focus",
      "Runs mid-sized professional services firm",
      "1 prior dispute resolved cooperatively",
      "Irish background; warm interpersonal style",
      "Values relationship banking and personal touch",
    ],
  },
  {
    id: "chloe_beaumont",
    initials: "CB",
    name: "Chloe Beaumont",
    customerId: "CST-12639",
    lastUpdated: "04/27/26 | 09:00 AM",
    profile: {
      department: "Legal Services",
      tenureYears: 7,
      totalAUM: "$1,654,466.00",
      financialReadiness: 73,
      financialAdvisor: "David Park",
      advisorTitle: "Senior Account Manager",
      tags: ["Premier"],
      fraudRiskScore: 34,
      priorDisputeCount: 0,
      cardBlocked: false,
    },
    conversationTopics: [
      "Resolve general inquiry issue",
      "Review account status",
      "Confirm resolution and next steps",
    ],
    contact: {
      email: "chloe.beaumont@beaumonlegal.com",
      phone: "(506) 555-1954",
      address: { street: "450 Riverside Dr", city: "Austin", state: "TX", zip: "78701", country: "US" },
    },
    accounts: [
      { id: "chloe_beaumont-chk", type: "Business", number: "***1666", balance: "$119,266.00",
          availableBalance: "$119,266.00", status: "active", openedDate: "Jul 2023" },
      { id: "chloe_beaumont-sav", type: "Savings", number: "***2954", balance: "$125,114.00", status: "active", openedDate: "Aug 2023" },
    ],
    overview: {
      contactNumber: "(506) 555-1954",
      assignedAgent: "David Park",
      pronoun: "she",
      lastContactTime: "Today, 9:05 AM",
      address: "450 Riverside Dr, Austin, TX 78701",
    },
    interactionTimeline: [
      {
        id: "chloe_beaumont-case-opened",
        title: "Case opened — General Inquiry",
        timestamp: "Today · 9:00 AM",
        detail: "Chloe Beaumont contacted support regarding: Virtual agent closed my case without resolving it.",
        tone: "warning",
        sortOrder: 1,
      },
      {
        id: "chloe_beaumont-bot-review",
        title: "Virtual agent reviewed case",
        timestamp: "Today · 9:02 AM",
        detail: "AI assistant reviewed the case details and initiated general inquiry resolution workflow.",
        tone: "info",
        sortOrder: 2,
      },
      {
        id: "chloe_beaumont-escalated",
        title: "Escalated to human agent",
        timestamp: "Today · 9:05 AM",
        detail: "Case escalated to human agent due to complexity of general inquiry issue requiring manual intervention.",
        tone: "warning",
        sortOrder: 3,
      },
    ],
    customerHistory: [
      {
        id: "chloe_beaumont-h1",
        title: "General Inquiry case opened",
        timestamp: "Today · 9:00 AM",
        detail: "New general inquiry case opened for Chloe Beaumont at Beaumont Legal Group.",
        dot: "orange",
      },
      {
        id: "chloe_beaumont-h2",
        title: "Account verified",
        timestamp: "Feb 10, 2026 · 2:00 PM",
        detail: "Identity and account details verified for Chloe Beaumont.",
        dot: "gray",
      },
      {
        id: "chloe_beaumont-h3",
        title: "Account created",
        timestamp: "Sep 2022, 2022 · 10:00 AM",
        detail: "Chloe Beaumont joined Beaumont Legal Group. Account created and onboarding completed.",
        dot: "green",
      },
    ],
    queue: {
      time: "15m",
      preview: "Virtual agent closed my case without resolving it",
      priority: "High",
      priorityClassName: "border-[#FFB800] bg-[#FFF6E0] text-[#A37A00]",
      badgeColor: "bg-[#166CCA]",
      icon: "phone",
      isActive: false,
      createdAt: "2026-04-27T09:00:00",
      updatedAt: "2026-04-27T09:05:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 9:00 AM",
        draft: "I've reviewed your general inquiry case, Chloe. Here's what I can see and the steps I'm taking to resolve this for you right now.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hi, I'm reaching out about: Virtual agent closed my case without resolving it. Can you help?",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Chloe, I've reviewed your case regarding general inquiry. Let me look into this for you.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "I appreciate that — this has been an ongoing issue and I need it resolved today.",
            time: "9:04 AM",
          }
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 9:00 AM",
        draft: "Hi Chloe — I've looked into your case. I'm working on a resolution and will update you shortly.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Need help — virtual agent closed my case without resolving it.",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Chloe — I can see your case. Reviewing details now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thanks. Please let me know as soon as you have an update.",
            time: "9:04 AM",
          }
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 9:00 AM",
        draft: "Hi Chloe — I've reviewed your case. I have what I need to help you resolve this general inquiry issue.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hello, I need help with a general inquiry issue — virtual agent closed my case without resolving it",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Chloe! I can see your case details. I'm reviewing everything now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Great — please update me here when you have news.",
            time: "9:04 AM",
          }
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 9:00 AM",
        draft: "Hi Chloe — thank you for your patience. I've reviewed your general inquiry case in detail and I'm ready to walk you through the next steps.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Subject: General Inquiry - Urgent Assistance Needed\n\nHello,\n\nI need assistance with the following: Virtual agent closed my case without resolving it. Please respond as soon as possible.\n\nThank you,\nChloe Beaumont",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Chloe,\n\nThank you for reaching out. I've reviewed your case and I'm working on resolving your general inquiry issue. I'll have an update for you shortly.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thank you for the quick response. Please prioritise this — it's time-sensitive.",
            time: "9:04 AM",
          }
        ],
      },
    },
    customerSnapshot: [
      "2-year customer with $320K in accounts",
      "Younger demographic; digital-first preferences",
      "No disputes; clean background",
      "Social media-savvy; shares positive experiences",
      "Expects 24/7 digital support availability",
    ],
  },
  {
    id: "rajiv_menon",
    initials: "RM",
    name: "Rajiv Menon",
    customerId: "CST-12750",
    lastUpdated: "04/27/26 | 09:00 AM",
    profile: {
      department: "Technology Accounts",
      tenureYears: 6,
      totalAUM: "$1,743,603.00",
      financialReadiness: 84,
      financialAdvisor: "Emma Wilson",
      advisorTitle: "Senior Account Manager",
      tags: ["Standard"],
      fraudRiskScore: 47,
      priorDisputeCount: 1,
      cardBlocked: false,
    },
    conversationTopics: [
      "Resolve incorrect ai guidance issue",
      "Review account status",
      "Confirm resolution and next steps",
    ],
    contact: {
      email: "rajiv.menon@menontech.com",
      phone: "(523) 555-2007",
      address: { street: "1600 Pacific Ave", city: "San Diego", state: "CA", zip: "92101", country: "US" },
    },
    accounts: [
      { id: "rajiv_menon-chk", type: "Checking", number: "***1703", balance: "$87,029.00",
          availableBalance: "$87,029.00", status: "active", openedDate: "Oct 2024" },
      { id: "rajiv_menon-sav", type: "Savings", number: "***3007", balance: "$129,287.00", status: "active", openedDate: "Nov 2024" },
    ],
    overview: {
      contactNumber: "(523) 555-2007",
      assignedAgent: "Emma Wilson",
      pronoun: "he",
      lastContactTime: "Today, 9:05 AM",
      address: "1600 Pacific Ave, San Diego, CA 92101",
    },
    interactionTimeline: [
      {
        id: "rajiv_menon-case-opened",
        title: "Case opened — Incorrect AI Guidance",
        timestamp: "Today · 9:00 AM",
        detail: "Rajiv Menon contacted support regarding: AI provided incorrect compliance guidance — urgent correction.",
        tone: "warning",
        sortOrder: 1,
      },
      {
        id: "rajiv_menon-bot-review",
        title: "Virtual agent reviewed case",
        timestamp: "Today · 9:02 AM",
        detail: "AI assistant reviewed the case details and initiated incorrect ai guidance resolution workflow.",
        tone: "info",
        sortOrder: 2,
      },
      {
        id: "rajiv_menon-escalated",
        title: "Escalated to human agent",
        timestamp: "Today · 9:05 AM",
        detail: "Case escalated to human agent due to complexity of incorrect ai guidance issue requiring manual intervention.",
        tone: "critical",
        sortOrder: 3,
      },
    ],
    customerHistory: [
      {
        id: "rajiv_menon-h1",
        title: "Incorrect AI Guidance case opened",
        timestamp: "Today · 9:00 AM",
        detail: "New incorrect ai guidance case opened for Rajiv Menon at Menon Tech Solutions.",
        dot: "orange",
      },
      {
        id: "rajiv_menon-h2",
        title: "Account verified",
        timestamp: "Jan 22, 2026 · 2:00 PM",
        detail: "Identity and account details verified for Rajiv Menon.",
        dot: "gray",
      },
      {
        id: "rajiv_menon-h3",
        title: "Account created",
        timestamp: "Dec 2023, 2023 · 10:00 AM",
        detail: "Rajiv Menon joined Menon Tech Solutions. Account created and onboarding completed.",
        dot: "green",
      },
    ],
    queue: {
      time: "1m",
      preview: "AI provided incorrect compliance guidance — urgent correction",
      priority: "Critical",
      priorityClassName: "border-[#E53935] bg-[#FDEAEA] text-[#C71D1A]",
      badgeColor: "bg-[#E32926]",
      icon: "messageSquare",
      isActive: false,
      createdAt: "2026-04-27T09:00:00",
      updatedAt: "2026-04-27T09:05:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 9:00 AM",
        draft: "I've reviewed your incorrect ai guidance case, Rajiv. Here's what I can see and the steps I'm taking to resolve this for you right now.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hi, I'm reaching out about: AI provided incorrect compliance guidance — urgent correction. Can you help?",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Rajiv, I've reviewed your case regarding incorrect ai guidance. Let me look into this for you.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "I appreciate that — this has been an ongoing issue and I need it resolved today.",
            time: "9:04 AM",
          }
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 9:00 AM",
        draft: "Hi Rajiv — I've looked into your case. I'm working on a resolution and will update you shortly.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Need help — ai provided incorrect compliance guidance — urgent correction.",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Rajiv — I can see your case. Reviewing details now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thanks. Please let me know as soon as you have an update.",
            time: "9:04 AM",
          }
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 9:00 AM",
        draft: "Hi Rajiv — I've reviewed your case. I have what I need to help you resolve this incorrect ai guidance issue.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hello, I need help with a incorrect ai guidance issue — ai provided incorrect compliance guidance — urgent correction",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Rajiv! I can see your case details. I'm reviewing everything now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Great — please update me here when you have news.",
            time: "9:04 AM",
          }
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 9:00 AM",
        draft: "Hi Rajiv — thank you for your patience. I've reviewed your incorrect ai guidance case in detail and I'm ready to walk you through the next steps.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Subject: Incorrect AI Guidance - Urgent Assistance Needed\n\nHello,\n\nI need assistance with the following: AI provided incorrect compliance guidance — urgent correction. Please respond as soon as possible.\n\nThank you,\nRajiv Menon",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Rajiv,\n\nThank you for reaching out. I've reviewed your case and I'm working on resolving your incorrect ai guidance issue. I'll have an update for you shortly.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thank you for the quick response. Please prioritise this — it's time-sensitive.",
            time: "9:04 AM",
          }
        ],
      },
    },
    customerSnapshot: [
      "4-year customer with $700K+ portfolio",
      "IT professional; very tech-competent",
      "Zero disputes; excellent credit score",
      "Prefers data-driven presentations and analytics",
      "May use API integrations; wants developer support",
    ],
  },
  {
    id: "sophie_hartmann",
    initials: "SH",
    name: "Sophie Hartmann",
    customerId: "CST-12863",
    lastUpdated: "04/27/26 | 09:00 AM",
    profile: {
      department: "International Logistics",
      tenureYears: 5,
      totalAUM: "$1,832,740.00",
      financialReadiness: 40,
      financialAdvisor: "Jeff Comstock",
      advisorTitle: "Senior Account Manager",
      tags: ["Premier"],
      fraudRiskScore: 60,
      priorDisputeCount: 2,
      cardBlocked: false,
    },
    conversationTopics: [
      "Resolve general inquiry issue",
      "Review account status",
      "Confirm resolution and next steps",
    ],
    contact: {
      email: "sophie.hartmann@hartmannlogistics.de",
      phone: "(540) 555-2060",
      address: { street: "300 Canal St", city: "New Orleans", state: "LA", zip: "70130", country: "US" },
    },
    accounts: [
      { id: "sophie_hartmann-chk", type: "Checking", number: "***1740", balance: "$90,820.00",
          availableBalance: "$90,820.00", status: "active", openedDate: "Jan 2020" },
      { id: "sophie_hartmann-sav", type: "Savings", number: "***3060", balance: "$133,460.00", status: "active", openedDate: "Feb 2020" },
    ],
    overview: {
      contactNumber: "(540) 555-2060",
      assignedAgent: "Jeff Comstock",
      pronoun: "she",
      lastContactTime: "Today, 9:05 AM",
      address: "300 Canal St, New Orleans, LA 70130",
    },
    interactionTimeline: [
      {
        id: "sophie_hartmann-case-opened",
        title: "Case opened — General Inquiry",
        timestamp: "Today · 9:00 AM",
        detail: "Sophie Hartmann contacted support regarding: Bot couldn't understand my shipment tracking query.",
        tone: "default",
        sortOrder: 1,
      },
      {
        id: "sophie_hartmann-bot-review",
        title: "Virtual agent reviewed case",
        timestamp: "Today · 9:02 AM",
        detail: "AI assistant reviewed the case details and initiated general inquiry resolution workflow.",
        tone: "info",
        sortOrder: 2,
      },
      {
        id: "sophie_hartmann-escalated",
        title: "Escalated to human agent",
        timestamp: "Today · 9:05 AM",
        detail: "Case escalated to human agent due to complexity of general inquiry issue requiring manual intervention.",
        tone: "warning",
        sortOrder: 3,
      },
    ],
    customerHistory: [
      {
        id: "sophie_hartmann-h1",
        title: "General Inquiry case opened",
        timestamp: "Today · 9:00 AM",
        detail: "New general inquiry case opened for Sophie Hartmann at Hartmann Logistics GmbH.",
        dot: "orange",
      },
      {
        id: "sophie_hartmann-h2",
        title: "Account verified",
        timestamp: "Mar 5, 2026 · 2:00 PM",
        detail: "Identity and account details verified for Sophie Hartmann.",
        dot: "gray",
      },
      {
        id: "sophie_hartmann-h3",
        title: "Account created",
        timestamp: "Mar 2019, 2020 · 10:00 AM",
        detail: "Sophie Hartmann joined Hartmann Logistics GmbH. Account created and onboarding completed.",
        dot: "green",
      },
    ],
    queue: {
      time: "22m",
      preview: "Bot couldn't understand my shipment tracking query",
      priority: "Medium",
      priorityClassName: "border-[#0288D1] bg-[#E3F4FD] text-[#0277BD]",
      badgeColor: "bg-[#0288D1]",
      icon: "phone",
      isActive: false,
      createdAt: "2026-04-27T09:00:00",
      updatedAt: "2026-04-27T09:05:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 9:00 AM",
        draft: "I've reviewed your general inquiry case, Sophie. Here's what I can see and the steps I'm taking to resolve this for you right now.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hi, I'm reaching out about: Bot couldn't understand my shipment tracking query. Can you help?",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Sophie, I've reviewed your case regarding general inquiry. Let me look into this for you.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "I appreciate that — this has been an ongoing issue and I need it resolved today.",
            time: "9:04 AM",
          }
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 9:00 AM",
        draft: "Hi Sophie — I've looked into your case. I'm working on a resolution and will update you shortly.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Need help — bot couldn't understand my shipment tracking query.",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Sophie — I can see your case. Reviewing details now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thanks. Please let me know as soon as you have an update.",
            time: "9:04 AM",
          }
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 9:00 AM",
        draft: "Hi Sophie — I've reviewed your case. I have what I need to help you resolve this general inquiry issue.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hello, I need help with a general inquiry issue — bot couldn't understand my shipment tracking query",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Sophie! I can see your case details. I'm reviewing everything now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Great — please update me here when you have news.",
            time: "9:04 AM",
          }
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 9:00 AM",
        draft: "Hi Sophie — thank you for your patience. I've reviewed your general inquiry case in detail and I'm ready to walk you through the next steps.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Subject: General Inquiry - Urgent Assistance Needed\n\nHello,\n\nI need assistance with the following: Bot couldn't understand my shipment tracking query. Please respond as soon as possible.\n\nThank you,\nSophie Hartmann",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Sophie,\n\nThank you for reaching out. I've reviewed your case and I'm working on resolving your general inquiry issue. I'll have an update for you shortly.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thank you for the quick response. Please prioritise this — it's time-sensitive.",
            time: "9:04 AM",
          }
        ],
      },
    },
    customerSnapshot: [
      "6-year customer with $950K in managed wealth",
      "French heritage; multilingual communication benefit",
      "No prior disputes; stable long-term client",
      "Sophisticated in financial matters",
      "Prefers quarterly business reviews with advisor",
    ],
  },
  {
    id: "terrence_vance",
    initials: "TV",
    name: "Terrence Vance",
    customerId: "CST-12974",
    lastUpdated: "04/27/26 | 09:00 AM",
    profile: {
      department: "Wealth Management",
      tenureYears: 4,
      totalAUM: "$1,921,877.00",
      financialReadiness: 51,
      financialAdvisor: "Marcus Lee",
      advisorTitle: "Senior Account Manager",
      tags: ["Standard"],
      fraudRiskScore: 73,
      priorDisputeCount: 0,
      cardBlocked: false,
    },
    conversationTopics: [
      "Resolve billing dispute issue",
      "Review account status",
      "Confirm resolution and next steps",
    ],
    contact: {
      email: "terrence.vance@vancecapital.com",
      phone: "(557) 555-2113",
      address: { street: "1800 Commerce Blvd", city: "Minneapolis", state: "MN", zip: "55402", country: "US" },
    },
    accounts: [
      { id: "terrence_vance-chk", type: "Checking", number: "***1777", balance: "$94,611.00",
          availableBalance: "$94,611.00", status: "active", openedDate: "Apr 2021" },
      { id: "terrence_vance-sav", type: "Savings", number: "***3113", balance: "$137,633.00", status: "active", openedDate: "May 2021" },
    ],
    overview: {
      contactNumber: "(557) 555-2113",
      assignedAgent: "Marcus Lee",
      pronoun: "he",
      lastContactTime: "Today, 9:05 AM",
      address: "1800 Commerce Blvd, Minneapolis, MN 55402",
    },
    interactionTimeline: [
      {
        id: "terrence_vance-case-opened",
        title: "Case opened — Billing Dispute",
        timestamp: "Today · 9:00 AM",
        detail: "Terrence Vance contacted support regarding: Virtual agent gave wrong account balance — discrepancy of $18,000.",
        tone: "warning",
        sortOrder: 1,
      },
      {
        id: "terrence_vance-bot-review",
        title: "Virtual agent reviewed case",
        timestamp: "Today · 9:02 AM",
        detail: "AI assistant reviewed the case details and initiated billing dispute resolution workflow.",
        tone: "info",
        sortOrder: 2,
      },
      {
        id: "terrence_vance-escalated",
        title: "Escalated to human agent",
        timestamp: "Today · 9:05 AM",
        detail: "Case escalated to human agent due to complexity of billing dispute issue requiring manual intervention.",
        tone: "warning",
        sortOrder: 3,
      },
    ],
    customerHistory: [
      {
        id: "terrence_vance-h1",
        title: "Billing Dispute case opened",
        timestamp: "Today · 9:00 AM",
        detail: "New billing dispute case opened for Terrence Vance at Vance Capital Management.",
        dot: "orange",
      },
      {
        id: "terrence_vance-h2",
        title: "Account verified",
        timestamp: "Feb 10, 2026 · 2:00 PM",
        detail: "Identity and account details verified for Terrence Vance.",
        dot: "gray",
      },
      {
        id: "terrence_vance-h3",
        title: "Account created",
        timestamp: "Jun 2020, 2021 · 10:00 AM",
        detail: "Terrence Vance joined Vance Capital Management. Account created and onboarding completed.",
        dot: "green",
      },
    ],
    queue: {
      time: "12m",
      preview: "Virtual agent gave wrong account balance — discrepancy of $18,000",
      priority: "High",
      priorityClassName: "border-[#FFB800] bg-[#FFF6E0] text-[#A37A00]",
      badgeColor: "bg-[#166CCA]",
      icon: "messageSquare",
      isActive: false,
      createdAt: "2026-04-27T09:00:00",
      updatedAt: "2026-04-27T09:05:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 9:00 AM",
        draft: "I've reviewed your billing dispute case, Terrence. Here's what I can see and the steps I'm taking to resolve this for you right now.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hi, I'm reaching out about: Virtual agent gave wrong account balance — discrepancy of $18,000. Can you help?",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Terrence, I've reviewed your case regarding billing dispute. Let me look into this for you.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "I appreciate that — this has been an ongoing issue and I need it resolved today.",
            time: "9:04 AM",
          }
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 9:00 AM",
        draft: "Hi Terrence — I've looked into your case. I'm working on a resolution and will update you shortly.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Need help — virtual agent gave wrong account balance — discrepancy of $18,000.",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Terrence — I can see your case. Reviewing details now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thanks. Please let me know as soon as you have an update.",
            time: "9:04 AM",
          }
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 9:00 AM",
        draft: "Hi Terrence — I've reviewed your case. I have what I need to help you resolve this billing dispute issue.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hello, I need help with a billing dispute issue — virtual agent gave wrong account balance — discrepancy of $18,000",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Terrence! I can see your case details. I'm reviewing everything now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Great — please update me here when you have news.",
            time: "9:04 AM",
          }
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 9:00 AM",
        draft: "Hi Terrence — thank you for your patience. I've reviewed your billing dispute case in detail and I'm ready to walk you through the next steps.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Subject: Billing Dispute - Urgent Assistance Needed\n\nHello,\n\nI need assistance with the following: Virtual agent gave wrong account balance — discrepancy of $18,000. Please respond as soon as possible.\n\nThank you,\nTerrence Vance",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Terrence,\n\nThank you for reaching out. I've reviewed your case and I'm working on resolving your billing dispute issue. I'll have an update for you shortly.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thank you for the quick response. Please prioritise this — it's time-sensitive.",
            time: "9:04 AM",
          }
        ],
      },
    },
    customerSnapshot: [
      "5-year customer with $800K+ in accounts",
      "Business owner with complex financial structure",
      "Zero disputes; trusted partnership with advisor",
      "Values proactive recommendations and planning",
      "Expects white-glove service and attention",
    ],
  },
  {
    id: "isabella_moreno",
    initials: "IM",
    name: "Isabella Moreno",
    customerId: "CST-13085",
    lastUpdated: "04/27/26 | 09:00 AM",
    profile: {
      department: "Legal Services",
      tenureYears: 3,
      totalAUM: "$2,011,014.00",
      financialReadiness: 62,
      financialAdvisor: "Sarah Chen",
      advisorTitle: "Senior Account Manager",
      tags: ["Premier"],
      fraudRiskScore: 16,
      priorDisputeCount: 1,
      cardBlocked: false,
    },
    conversationTopics: [
      "Resolve general inquiry issue",
      "Review account status",
      "Confirm resolution and next steps",
    ],
    contact: {
      email: "isabella.moreno@morenolaw.com",
      phone: "(574) 555-2166",
      address: { street: "550 N Michigan Ave", city: "Chicago", state: "IL", zip: "60611", country: "US" },
    },
    accounts: [
      { id: "isabella_moreno-chk", type: "Checking", number: "***1814", balance: "$98,402.00",
          availableBalance: "$98,402.00", status: "active", openedDate: "Jul 2022" },
      { id: "isabella_moreno-sav", type: "Savings", number: "***3166", balance: "$141,806.00", status: "active", openedDate: "Aug 2022" },
    ],
    overview: {
      contactNumber: "(574) 555-2166",
      assignedAgent: "Sarah Chen",
      pronoun: "she",
      lastContactTime: "Today, 9:05 AM",
      address: "550 N Michigan Ave, Chicago, IL 60611",
    },
    interactionTimeline: [
      {
        id: "isabella_moreno-case-opened",
        title: "Case opened — General Inquiry",
        timestamp: "Today · 9:00 AM",
        detail: "Isabella Moreno contacted support regarding: Need to speak to a human — AI not helpful for my situation.",
        tone: "default",
        sortOrder: 1,
      },
      {
        id: "isabella_moreno-bot-review",
        title: "Virtual agent reviewed case",
        timestamp: "Today · 9:02 AM",
        detail: "AI assistant reviewed the case details and initiated general inquiry resolution workflow.",
        tone: "info",
        sortOrder: 2,
      },
      {
        id: "isabella_moreno-escalated",
        title: "Escalated to human agent",
        timestamp: "Today · 9:05 AM",
        detail: "Case escalated to human agent due to complexity of general inquiry issue requiring manual intervention.",
        tone: "warning",
        sortOrder: 3,
      },
    ],
    customerHistory: [
      {
        id: "isabella_moreno-h1",
        title: "General Inquiry case opened",
        timestamp: "Today · 9:00 AM",
        detail: "New general inquiry case opened for Isabella Moreno at Moreno & Partners Law.",
        dot: "orange",
      },
      {
        id: "isabella_moreno-h2",
        title: "Account verified",
        timestamp: "Jan 22, 2026 · 2:00 PM",
        detail: "Identity and account details verified for Isabella Moreno.",
        dot: "gray",
      },
      {
        id: "isabella_moreno-h3",
        title: "Account created",
        timestamp: "Sep 2021, 2022 · 10:00 AM",
        detail: "Isabella Moreno joined Moreno & Partners Law. Account created and onboarding completed.",
        dot: "green",
      },
    ],
    queue: {
      time: "2h 10m",
      preview: "Need to speak to a human — AI not helpful for my situation",
      priority: "Low",
      priorityClassName: "border-[#43A047] bg-[#E8F5E9] text-[#2E7D32]",
      badgeColor: "bg-[#43A047]",
      icon: "phone",
      isActive: false,
      createdAt: "2026-04-27T09:00:00",
      updatedAt: "2026-04-27T09:05:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 9:00 AM",
        draft: "I've reviewed your general inquiry case, Isabella. Here's what I can see and the steps I'm taking to resolve this for you right now.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hi, I'm reaching out about: Need to speak to a human — AI not helpful for my situation. Can you help?",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Isabella, I've reviewed your case regarding general inquiry. Let me look into this for you.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "I appreciate that — this has been an ongoing issue and I need it resolved today.",
            time: "9:04 AM",
          }
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 9:00 AM",
        draft: "Hi Isabella — I've looked into your case. I'm working on a resolution and will update you shortly.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Need help — need to speak to a human — ai not helpful for my situation.",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Isabella — I can see your case. Reviewing details now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thanks. Please let me know as soon as you have an update.",
            time: "9:04 AM",
          }
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 9:00 AM",
        draft: "Hi Isabella — I've reviewed your case. I have what I need to help you resolve this general inquiry issue.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hello, I need help with a general inquiry issue — need to speak to a human — ai not helpful for my situation",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Isabella! I can see your case details. I'm reviewing everything now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Great — please update me here when you have news.",
            time: "9:04 AM",
          }
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 9:00 AM",
        draft: "Hi Isabella — thank you for your patience. I've reviewed your general inquiry case in detail and I'm ready to walk you through the next steps.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Subject: General Inquiry - Urgent Assistance Needed\n\nHello,\n\nI need assistance with the following: Need to speak to a human — AI not helpful for my situation. Please respond as soon as possible.\n\nThank you,\nIsabella Moreno",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Isabella,\n\nThank you for reaching out. I've reviewed your case and I'm working on resolving your general inquiry issue. I'll have an update for you shortly.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thank you for the quick response. Please prioritise this — it's time-sensitive.",
            time: "9:04 AM",
          }
        ],
      },
    },
    customerSnapshot: [
      "3-year customer with $480K portfolio",
      "Healthcare professional; W2 income stability",
      "No prior disputes; consistent saver",
      "Values work-life balance; prefers brief interactions",
      "Interested in simplified investment options",
    ],
  },
  {
    id: "david_park",
    initials: "DP",
    name: "David Park",
    customerId: "CST-13196",
    lastUpdated: "04/27/26 | 09:00 AM",
    profile: {
      department: "Digital Services",
      tenureYears: 2,
      totalAUM: "$100,151.00",
      financialReadiness: 73,
      financialAdvisor: "David Park",
      advisorTitle: "Senior Account Manager",
      tags: ["Standard"],
      fraudRiskScore: 29,
      priorDisputeCount: 2,
      cardBlocked: false,
    },
    conversationTopics: [
      "Resolve account locked issue",
      "Review account status",
      "Confirm resolution and next steps",
    ],
    contact: {
      email: "david.park@parkdigital.com",
      phone: "(591) 555-2219",
      address: { street: "700 Jefferson Ave", city: "Nashville", state: "TN", zip: "37203", country: "US" },
    },
    accounts: [
      { id: "david_park-chk", type: "Checking", number: "***1851", balance: "$17,193.00",
          availableBalance: "$17,193.00", status: "active", openedDate: "Oct 2023" },
      { id: "david_park-sav", type: "Savings", number: "***3219", balance: "$145,979.00", status: "active", openedDate: "Nov 2023" },
    ],
    overview: {
      contactNumber: "(591) 555-2219",
      assignedAgent: "David Park",
      pronoun: "he",
      lastContactTime: "Today, 9:05 AM",
      address: "700 Jefferson Ave, Nashville, TN 37203",
    },
    interactionTimeline: [
      {
        id: "david_park-case-opened",
        title: "Case opened — Account Locked",
        timestamp: "Today · 9:00 AM",
        detail: "David Park contacted support regarding: Virtual agent escalated my password reset — token not arriving.",
        tone: "default",
        sortOrder: 1,
      },
      {
        id: "david_park-bot-review",
        title: "Virtual agent reviewed case",
        timestamp: "Today · 9:02 AM",
        detail: "AI assistant reviewed the case details and initiated account locked resolution workflow.",
        tone: "info",
        sortOrder: 2,
      },
      {
        id: "david_park-escalated",
        title: "Escalated to human agent",
        timestamp: "Today · 9:05 AM",
        detail: "Case escalated to human agent due to complexity of account locked issue requiring manual intervention.",
        tone: "warning",
        sortOrder: 3,
      },
    ],
    customerHistory: [
      {
        id: "david_park-h1",
        title: "Account Locked case opened",
        timestamp: "Today · 9:00 AM",
        detail: "New account locked case opened for David Park at Park Digital Agency.",
        dot: "orange",
      },
      {
        id: "david_park-h2",
        title: "Account verified",
        timestamp: "Mar 5, 2026 · 2:00 PM",
        detail: "Identity and account details verified for David Park.",
        dot: "gray",
      },
      {
        id: "david_park-h3",
        title: "Account created",
        timestamp: "Dec 2022, 2023 · 10:00 AM",
        detail: "David Park joined Park Digital Agency. Account created and onboarding completed.",
        dot: "green",
      },
    ],
    queue: {
      time: "18m",
      preview: "Virtual agent escalated my password reset — token not arriving",
      priority: "Medium",
      priorityClassName: "border-[#0288D1] bg-[#E3F4FD] text-[#0277BD]",
      badgeColor: "bg-[#0288D1]",
      icon: "messageSquare",
      isActive: false,
      createdAt: "2026-04-27T09:00:00",
      updatedAt: "2026-04-27T09:05:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 9:00 AM",
        draft: "I've reviewed your account locked case, David. Here's what I can see and the steps I'm taking to resolve this for you right now.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hi, I'm reaching out about: Virtual agent escalated my password reset — token not arriving. Can you help?",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi David, I've reviewed your case regarding account locked. Let me look into this for you.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "I appreciate that — this has been an ongoing issue and I need it resolved today.",
            time: "9:04 AM",
          }
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 9:00 AM",
        draft: "Hi David — I've looked into your case. I'm working on a resolution and will update you shortly.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Need help — virtual agent escalated my password reset — token not arriving.",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi David — I can see your case. Reviewing details now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thanks. Please let me know as soon as you have an update.",
            time: "9:04 AM",
          }
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 9:00 AM",
        draft: "Hi David — I've reviewed your case. I have what I need to help you resolve this account locked issue.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hello, I need help with a account locked issue — virtual agent escalated my password reset — token not arriving",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi David! I can see your case details. I'm reviewing everything now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Great — please update me here when you have news.",
            time: "9:04 AM",
          }
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 9:00 AM",
        draft: "Hi David — thank you for your patience. I've reviewed your account locked case in detail and I'm ready to walk you through the next steps.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Subject: Account Locked - Urgent Assistance Needed\n\nHello,\n\nI need assistance with the following: Virtual agent escalated my password reset — token not arriving. Please respond as soon as possible.\n\nThank you,\nDavid Park",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi David,\n\nThank you for reaching out. I've reviewed your case and I'm working on resolving your account locked issue. I'll have an update for you shortly.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thank you for the quick response. Please prioritise this — it's time-sensitive.",
            time: "9:04 AM",
          }
        ],
      },
    },
    customerSnapshot: [
      "4-year customer with $620K in accounts",
      "Corporate executive; senior management level",
      "Zero disputes; high net worth individual",
      "Expects executive-grade service and responsiveness",
      "Values strategic tax planning guidance",
    ],
  },
  {
    id: "aaliya_nasser",
    initials: "AN",
    name: "Aaliya Nasser",
    customerId: "CST-13307",
    lastUpdated: "04/27/26 | 09:00 AM",
    profile: {
      department: "International Trade",
      tenureYears: 1,
      totalAUM: "$189,288.00",
      financialReadiness: 84,
      financialAdvisor: "Emma Wilson",
      advisorTitle: "Senior Account Manager",
      tags: ["Premier"],
      fraudRiskScore: 42,
      priorDisputeCount: 0,
      cardBlocked: false,
    },
    conversationTopics: [
      "Resolve payment issue issue",
      "Review account status",
      "Confirm resolution and next steps",
    ],
    contact: {
      email: "aaliya.nasser@nassertrading.com",
      phone: "(608) 555-2272",
      address: { street: "120 Harbor View Ct", city: "Baltimore", state: "MD", zip: "21201", country: "US" },
    },
    accounts: [
      { id: "aaliya_nasser-chk", type: "Checking", number: "***1888", balance: "$20,984.00",
          availableBalance: "$20,984.00", status: "active", openedDate: "Jan 2024" },
      { id: "aaliya_nasser-sav", type: "Savings", number: "***3272", balance: "$150,152.00", status: "active", openedDate: "Feb 2024" },
    ],
    overview: {
      contactNumber: "(608) 555-2272",
      assignedAgent: "Emma Wilson",
      pronoun: "she",
      lastContactTime: "Today, 9:05 AM",
      address: "120 Harbor View Ct, Baltimore, MD 21201",
    },
    interactionTimeline: [
      {
        id: "aaliya_nasser-case-opened",
        title: "Case opened — Payment Issue",
        timestamp: "Today · 9:00 AM",
        detail: "Aaliya Nasser contacted support regarding: Bot approved a transaction it should have flagged for review.",
        tone: "warning",
        sortOrder: 1,
      },
      {
        id: "aaliya_nasser-bot-review",
        title: "Virtual agent reviewed case",
        timestamp: "Today · 9:02 AM",
        detail: "AI assistant reviewed the case details and initiated payment issue resolution workflow.",
        tone: "info",
        sortOrder: 2,
      },
      {
        id: "aaliya_nasser-escalated",
        title: "Escalated to human agent",
        timestamp: "Today · 9:05 AM",
        detail: "Case escalated to human agent due to complexity of payment issue issue requiring manual intervention.",
        tone: "warning",
        sortOrder: 3,
      },
    ],
    customerHistory: [
      {
        id: "aaliya_nasser-h1",
        title: "Payment Issue case opened",
        timestamp: "Today · 9:00 AM",
        detail: "New payment issue case opened for Aaliya Nasser at Nasser Trading Co..",
        dot: "orange",
      },
      {
        id: "aaliya_nasser-h2",
        title: "Account verified",
        timestamp: "Feb 10, 2026 · 2:00 PM",
        detail: "Identity and account details verified for Aaliya Nasser.",
        dot: "gray",
      },
      {
        id: "aaliya_nasser-h3",
        title: "Account created",
        timestamp: "Mar 2023, 2020 · 10:00 AM",
        detail: "Aaliya Nasser joined Nasser Trading Co.. Account created and onboarding completed.",
        dot: "green",
      },
    ],
    queue: {
      time: "8m",
      preview: "Bot approved a transaction it should have flagged for review",
      priority: "High",
      priorityClassName: "border-[#FFB800] bg-[#FFF6E0] text-[#A37A00]",
      badgeColor: "bg-[#166CCA]",
      icon: "phone",
      isActive: false,
      createdAt: "2026-04-27T09:00:00",
      updatedAt: "2026-04-27T09:05:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 9:00 AM",
        draft: "I've reviewed your payment issue case, Aaliya. Here's what I can see and the steps I'm taking to resolve this for you right now.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hi, I'm reaching out about: Bot approved a transaction it should have flagged for review. Can you help?",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Aaliya, I've reviewed your case regarding payment issue. Let me look into this for you.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "I appreciate that — this has been an ongoing issue and I need it resolved today.",
            time: "9:04 AM",
          }
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 9:00 AM",
        draft: "Hi Aaliya — I've looked into your case. I'm working on a resolution and will update you shortly.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Need help — bot approved a transaction it should have flagged for review.",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Aaliya — I can see your case. Reviewing details now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thanks. Please let me know as soon as you have an update.",
            time: "9:04 AM",
          }
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 9:00 AM",
        draft: "Hi Aaliya — I've reviewed your case. I have what I need to help you resolve this payment issue issue.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hello, I need help with a payment issue issue — bot approved a transaction it should have flagged for review",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Aaliya! I can see your case details. I'm reviewing everything now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Great — please update me here when you have news.",
            time: "9:04 AM",
          }
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 9:00 AM",
        draft: "Hi Aaliya — thank you for your patience. I've reviewed your payment issue case in detail and I'm ready to walk you through the next steps.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Subject: Payment Issue - Urgent Assistance Needed\n\nHello,\n\nI need assistance with the following: Bot approved a transaction it should have flagged for review. Please respond as soon as possible.\n\nThank you,\nAaliya Nasser",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Aaliya,\n\nThank you for reaching out. I've reviewed your case and I'm working on resolving your payment issue issue. I'll have an update for you shortly.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thank you for the quick response. Please prioritise this — it's time-sensitive.",
            time: "9:04 AM",
          }
        ],
      },
    },
    customerSnapshot: [
      "2-year customer with $350K starting portfolio",
      "International background; building US investments",
      "No prior disputes; security-conscious",
      "Bilingual English/Arabic; appreciates cultural awareness",
      "Education-focused about investment options",
    ],
  },
  {
    id: "finn_johansson",
    initials: "FJ",
    name: "Finn Johansson",
    customerId: "CST-13418",
    lastUpdated: "04/27/26 | 09:00 AM",
    profile: {
      department: "International Business",
      tenureYears: 8,
      totalAUM: "$278,425.00",
      financialReadiness: 40,
      financialAdvisor: "Jeff Comstock",
      advisorTitle: "Senior Account Manager",
      tags: ["Standard"],
      fraudRiskScore: 55,
      priorDisputeCount: 1,
      cardBlocked: false,
    },
    conversationTopics: [
      "Resolve subscription upgrade issue",
      "Review account status",
      "Confirm resolution and next steps",
    ],
    contact: {
      email: "finn.johansson@johanssonordic.com",
      phone: "(625) 555-2325",
      address: { street: "44 Broadway", city: "New York", state: "NY", zip: "10006", country: "US" },
    },
    accounts: [
      { id: "finn_johansson-chk", type: "Checking", number: "***1925", balance: "$24,775.00",
          availableBalance: "$24,775.00", status: "active", openedDate: "Apr 2020" },
      { id: "finn_johansson-sav", type: "Savings", number: "***3325", balance: "$154,325.00", status: "active", openedDate: "May 2020" },
    ],
    overview: {
      contactNumber: "(625) 555-2325",
      assignedAgent: "Jeff Comstock",
      pronoun: "he",
      lastContactTime: "Today, 9:05 AM",
      address: "44 Broadway, New York, NY 10006",
    },
    interactionTimeline: [
      {
        id: "finn_johansson-case-opened",
        title: "Case opened — Subscription Upgrade",
        timestamp: "Today · 9:00 AM",
        detail: "Finn Johansson contacted support regarding: AI couldn't answer questions about my new plan features.",
        tone: "default",
        sortOrder: 1,
      },
      {
        id: "finn_johansson-bot-review",
        title: "Virtual agent reviewed case",
        timestamp: "Today · 9:02 AM",
        detail: "AI assistant reviewed the case details and initiated subscription upgrade resolution workflow.",
        tone: "info",
        sortOrder: 2,
      },
      {
        id: "finn_johansson-escalated",
        title: "Escalated to human agent",
        timestamp: "Today · 9:05 AM",
        detail: "Case escalated to human agent due to complexity of subscription upgrade issue requiring manual intervention.",
        tone: "warning",
        sortOrder: 3,
      },
    ],
    customerHistory: [
      {
        id: "finn_johansson-h1",
        title: "Subscription Upgrade case opened",
        timestamp: "Today · 9:00 AM",
        detail: "New subscription upgrade case opened for Finn Johansson at Johansson Nordic AB.",
        dot: "orange",
      },
      {
        id: "finn_johansson-h2",
        title: "Account verified",
        timestamp: "Jan 22, 2026 · 2:00 PM",
        detail: "Identity and account details verified for Finn Johansson.",
        dot: "gray",
      },
      {
        id: "finn_johansson-h3",
        title: "Account created",
        timestamp: "Jun 2019, 2021 · 10:00 AM",
        detail: "Finn Johansson joined Johansson Nordic AB. Account created and onboarding completed.",
        dot: "green",
      },
    ],
    queue: {
      time: "1h 30m",
      preview: "AI couldn't answer questions about my new plan features",
      priority: "Low",
      priorityClassName: "border-[#43A047] bg-[#E8F5E9] text-[#2E7D32]",
      badgeColor: "bg-[#43A047]",
      icon: "messageSquare",
      isActive: false,
      createdAt: "2026-04-27T09:00:00",
      updatedAt: "2026-04-27T09:05:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 9:00 AM",
        draft: "I've reviewed your subscription upgrade case, Finn. Here's what I can see and the steps I'm taking to resolve this for you right now.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hi, I'm reaching out about: AI couldn't answer questions about my new plan features. Can you help?",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Finn, I've reviewed your case regarding subscription upgrade. Let me look into this for you.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "I appreciate that — this has been an ongoing issue and I need it resolved today.",
            time: "9:04 AM",
          }
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 9:00 AM",
        draft: "Hi Finn — I've looked into your case. I'm working on a resolution and will update you shortly.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Need help — ai couldn't answer questions about my new plan features.",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Finn — I can see your case. Reviewing details now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thanks. Please let me know as soon as you have an update.",
            time: "9:04 AM",
          }
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 9:00 AM",
        draft: "Hi Finn — I've reviewed your case. I have what I need to help you resolve this subscription upgrade issue.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hello, I need help with a subscription upgrade issue — ai couldn't answer questions about my new plan features",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Finn! I can see your case details. I'm reviewing everything now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Great — please update me here when you have news.",
            time: "9:04 AM",
          }
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 9:00 AM",
        draft: "Hi Finn — thank you for your patience. I've reviewed your subscription upgrade case in detail and I'm ready to walk you through the next steps.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Subject: Subscription Upgrade - Urgent Assistance Needed\n\nHello,\n\nI need assistance with the following: AI couldn't answer questions about my new plan features. Please respond as soon as possible.\n\nThank you,\nFinn Johansson",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Finn,\n\nThank you for reaching out. I've reviewed your case and I'm working on resolving your subscription upgrade issue. I'll have an update for you shortly.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thank you for the quick response. Please prioritise this — it's time-sensitive.",
            time: "9:04 AM",
          }
        ],
      },
    },
    customerSnapshot: [
      "5-year customer with $750K+ in holdings",
      "Scandinavian background; minimalist preferences",
      "Zero disputes; straightforward dealings",
      "Values simplicity and clear communication",
      "Prefers email; dislikes excessive contact",
    ],
  },
  {
    id: "grace_kim",
    initials: "GK",
    name: "Grace Kim",
    customerId: "CST-13529",
    lastUpdated: "04/27/26 | 09:00 AM",
    profile: {
      department: "Professional Services",
      tenureYears: 7,
      totalAUM: "$367,562.00",
      financialReadiness: 51,
      financialAdvisor: "Marcus Lee",
      advisorTitle: "Senior Account Manager",
      tags: ["Premier"],
      fraudRiskScore: 68,
      priorDisputeCount: 2,
      cardBlocked: false,
    },
    conversationTopics: [
      "Resolve account locked issue",
      "Review account status",
      "Confirm resolution and next steps",
    ],
    contact: {
      email: "grace.kim@kimcpa.com",
      phone: "(642) 555-2378",
      address: { street: "900 Water St", city: "Pittsburgh", state: "PA", zip: "15222", country: "US" },
    },
    accounts: [
      { id: "grace_kim-chk", type: "Checking", number: "***1962", balance: "$28,566.00",
          availableBalance: "$28,566.00", status: "active", openedDate: "Jul 2021" },
      { id: "grace_kim-sav", type: "Savings", number: "***3378", balance: "$158,498.00", status: "active", openedDate: "Aug 2021" },
    ],
    overview: {
      contactNumber: "(642) 555-2378",
      assignedAgent: "Marcus Lee",
      pronoun: "she",
      lastContactTime: "Today, 9:05 AM",
      address: "900 Water St, Pittsburgh, PA 15222",
    },
    interactionTimeline: [
      {
        id: "grace_kim-case-opened",
        title: "Case opened — Account Locked",
        timestamp: "Today · 9:00 AM",
        detail: "Grace Kim contacted support regarding: Urgent: Virtual agent locked my account during tax filing season.",
        tone: "warning",
        sortOrder: 1,
      },
      {
        id: "grace_kim-bot-review",
        title: "Virtual agent reviewed case",
        timestamp: "Today · 9:02 AM",
        detail: "AI assistant reviewed the case details and initiated account locked resolution workflow.",
        tone: "info",
        sortOrder: 2,
      },
      {
        id: "grace_kim-escalated",
        title: "Escalated to human agent",
        timestamp: "Today · 9:05 AM",
        detail: "Case escalated to human agent due to complexity of account locked issue requiring manual intervention.",
        tone: "critical",
        sortOrder: 3,
      },
    ],
    customerHistory: [
      {
        id: "grace_kim-h1",
        title: "Account Locked case opened",
        timestamp: "Today · 9:00 AM",
        detail: "New account locked case opened for Grace Kim at Kim & Associates CPA.",
        dot: "orange",
      },
      {
        id: "grace_kim-h2",
        title: "Account verified",
        timestamp: "Mar 5, 2026 · 2:00 PM",
        detail: "Identity and account details verified for Grace Kim.",
        dot: "gray",
      },
      {
        id: "grace_kim-h3",
        title: "Account created",
        timestamp: "Sep 2020, 2022 · 10:00 AM",
        detail: "Grace Kim joined Kim & Associates CPA. Account created and onboarding completed.",
        dot: "green",
      },
    ],
    queue: {
      time: "5m",
      preview: "Urgent: Virtual agent locked my account during tax filing season",
      priority: "Critical",
      priorityClassName: "border-[#E53935] bg-[#FDEAEA] text-[#C71D1A]",
      badgeColor: "bg-[#E32926]",
      icon: "phone",
      isActive: false,
      createdAt: "2026-04-27T09:00:00",
      updatedAt: "2026-04-27T09:05:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 9:00 AM",
        draft: "I've reviewed your account locked case, Grace. Here's what I can see and the steps I'm taking to resolve this for you right now.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hi, I'm reaching out about: Urgent: Virtual agent locked my account during tax filing season. Can you help?",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Grace, I've reviewed your case regarding account locked. Let me look into this for you.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "I appreciate that — this has been an ongoing issue and I need it resolved today.",
            time: "9:04 AM",
          }
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 9:00 AM",
        draft: "Hi Grace — I've looked into your case. I'm working on a resolution and will update you shortly.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Need help — urgent: virtual agent locked my account during tax filing season.",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Grace — I can see your case. Reviewing details now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thanks. Please let me know as soon as you have an update.",
            time: "9:04 AM",
          }
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 9:00 AM",
        draft: "Hi Grace — I've reviewed your case. I have what I need to help you resolve this account locked issue.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hello, I need help with a account locked issue — urgent: virtual agent locked my account during tax filing season",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Grace! I can see your case details. I'm reviewing everything now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Great — please update me here when you have news.",
            time: "9:04 AM",
          }
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 9:00 AM",
        draft: "Hi Grace — thank you for your patience. I've reviewed your account locked case in detail and I'm ready to walk you through the next steps.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Subject: Account Locked - Urgent Assistance Needed\n\nHello,\n\nI need assistance with the following: Urgent: Virtual agent locked my account during tax filing season. Please respond as soon as possible.\n\nThank you,\nGrace Kim",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Grace,\n\nThank you for reaching out. I've reviewed your case and I'm working on resolving your account locked issue. I'll have an update for you shortly.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thank you for the quick response. Please prioritise this — it's time-sensitive.",
            time: "9:04 AM",
          }
        ],
      },
    },
    customerSnapshot: [
      "3-year customer with $500K portfolio",
      "Tech industry professional; analytical mindset",
      "No prior disputes; high financial literacy",
      "Wants automation and self-service optimization",
      "Reviews account quarterly for rebalancing",
    ],
  },
  {
    id: "liam_foster",
    initials: "LF",
    name: "Liam Foster",
    customerId: "CST-13640",
    lastUpdated: "04/27/26 | 09:00 AM",
    profile: {
      department: "Engineering Services",
      tenureYears: 6,
      totalAUM: "$456,699.00",
      financialReadiness: 62,
      financialAdvisor: "Sarah Chen",
      advisorTitle: "Senior Account Manager",
      tags: ["Standard"],
      fraudRiskScore: 11,
      priorDisputeCount: 0,
      cardBlocked: false,
    },
    conversationTopics: [
      "Resolve billing dispute issue",
      "Review account status",
      "Confirm resolution and next steps",
    ],
    contact: {
      email: "liam.foster@fosterengineering.com",
      phone: "(659) 555-2431",
      address: { street: "2400 Wilshire Blvd", city: "Los Angeles", state: "CA", zip: "90057", country: "US" },
    },
    accounts: [
      { id: "liam_foster-chk", type: "Business", number: "***1999", balance: "$166,399.00",
          availableBalance: "$166,399.00", status: "active", openedDate: "Oct 2022" },
      { id: "liam_foster-sav", type: "Savings", number: "***3431", balance: "$162,671.00", status: "active", openedDate: "Nov 2022" },
    ],
    overview: {
      contactNumber: "(659) 555-2431",
      assignedAgent: "Sarah Chen",
      pronoun: "he",
      lastContactTime: "Today, 9:05 AM",
      address: "2400 Wilshire Blvd, Los Angeles, CA 90057",
    },
    interactionTimeline: [
      {
        id: "liam_foster-case-opened",
        title: "Case opened — Billing Dispute",
        timestamp: "Today · 9:00 AM",
        detail: "Liam Foster contacted support regarding: Bot couldn't process my bulk invoice submission.",
        tone: "default",
        sortOrder: 1,
      },
      {
        id: "liam_foster-bot-review",
        title: "Virtual agent reviewed case",
        timestamp: "Today · 9:02 AM",
        detail: "AI assistant reviewed the case details and initiated billing dispute resolution workflow.",
        tone: "info",
        sortOrder: 2,
      },
      {
        id: "liam_foster-escalated",
        title: "Escalated to human agent",
        timestamp: "Today · 9:05 AM",
        detail: "Case escalated to human agent due to complexity of billing dispute issue requiring manual intervention.",
        tone: "warning",
        sortOrder: 3,
      },
    ],
    customerHistory: [
      {
        id: "liam_foster-h1",
        title: "Billing Dispute case opened",
        timestamp: "Today · 9:00 AM",
        detail: "New billing dispute case opened for Liam Foster at Foster Engineering Ltd..",
        dot: "orange",
      },
      {
        id: "liam_foster-h2",
        title: "Account verified",
        timestamp: "Feb 10, 2026 · 2:00 PM",
        detail: "Identity and account details verified for Liam Foster.",
        dot: "gray",
      },
      {
        id: "liam_foster-h3",
        title: "Account created",
        timestamp: "Dec 2021, 2023 · 10:00 AM",
        detail: "Liam Foster joined Foster Engineering Ltd.. Account created and onboarding completed.",
        dot: "green",
      },
    ],
    queue: {
      time: "18m",
      preview: "Bot couldn't process my bulk invoice submission",
      priority: "Medium",
      priorityClassName: "border-[#0288D1] bg-[#E3F4FD] text-[#0277BD]",
      badgeColor: "bg-[#0288D1]",
      icon: "messageSquare",
      isActive: false,
      createdAt: "2026-04-27T09:00:00",
      updatedAt: "2026-04-27T09:05:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 9:00 AM",
        draft: "I've reviewed your billing dispute case, Liam. Here's what I can see and the steps I'm taking to resolve this for you right now.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hi, I'm reaching out about: Bot couldn't process my bulk invoice submission. Can you help?",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Liam, I've reviewed your case regarding billing dispute. Let me look into this for you.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "I appreciate that — this has been an ongoing issue and I need it resolved today.",
            time: "9:04 AM",
          }
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 9:00 AM",
        draft: "Hi Liam — I've looked into your case. I'm working on a resolution and will update you shortly.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Need help — bot couldn't process my bulk invoice submission.",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Liam — I can see your case. Reviewing details now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thanks. Please let me know as soon as you have an update.",
            time: "9:04 AM",
          }
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 9:00 AM",
        draft: "Hi Liam — I've reviewed your case. I have what I need to help you resolve this billing dispute issue.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hello, I need help with a billing dispute issue — bot couldn't process my bulk invoice submission",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Liam! I can see your case details. I'm reviewing everything now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Great — please update me here when you have news.",
            time: "9:04 AM",
          }
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 9:00 AM",
        draft: "Hi Liam — thank you for your patience. I've reviewed your billing dispute case in detail and I'm ready to walk you through the next steps.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Subject: Billing Dispute - Urgent Assistance Needed\n\nHello,\n\nI need assistance with the following: Bot couldn't process my bulk invoice submission. Please respond as soon as possible.\n\nThank you,\nLiam Foster",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Liam,\n\nThank you for reaching out. I've reviewed your case and I'm working on resolving your billing dispute issue. I'll have an update for you shortly.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thank you for the quick response. Please prioritise this — it's time-sensitive.",
            time: "9:04 AM",
          }
        ],
      },
    },
    customerSnapshot: [
      "6-year customer with $1M+ in combined accounts",
      "Business Banking Premier customer",
      "Zero prior disputes; exemplary standing",
      "Irish-American; strong community ties",
      "Generous with referrals; brand advocate",
    ],
  },
  {
    id: "nadia_volkov",
    initials: "NV",
    name: "Nadia Volkov",
    customerId: "CST-13751",
    lastUpdated: "04/27/26 | 09:00 AM",
    profile: {
      department: "Asset Management",
      tenureYears: 5,
      totalAUM: "$545,836.00",
      financialReadiness: 73,
      financialAdvisor: "David Park",
      advisorTitle: "Senior Account Manager",
      tags: ["Premier"],
      fraudRiskScore: 24,
      priorDisputeCount: 1,
      cardBlocked: false,
    },
    conversationTopics: [
      "Resolve identity verification issue",
      "Review account status",
      "Confirm resolution and next steps",
    ],
    contact: {
      email: "nadia.volkov@volkovassets.com",
      phone: "(676) 555-2484",
      address: { street: "333 W 35th St", city: "New York", state: "NY", zip: "10001", country: "US" },
    },
    accounts: [
      { id: "nadia_volkov-chk", type: "Checking", number: "***2036", balance: "$36,148.00",
          availableBalance: "$36,148.00", status: "active", openedDate: "Jan 2023" },
      { id: "nadia_volkov-sav", type: "Savings", number: "***3484", balance: "$166,844.00", status: "active", openedDate: "Feb 2023" },
    ],
    overview: {
      contactNumber: "(676) 555-2484",
      assignedAgent: "David Park",
      pronoun: "she",
      lastContactTime: "Today, 9:05 AM",
      address: "333 W 35th St, New York, NY 10001",
    },
    interactionTimeline: [
      {
        id: "nadia_volkov-case-opened",
        title: "Case opened — Identity Verification",
        timestamp: "Today · 9:00 AM",
        detail: "Nadia Volkov contacted support regarding: AI couldn't verify my identity — account changes are urgent.",
        tone: "warning",
        sortOrder: 1,
      },
      {
        id: "nadia_volkov-bot-review",
        title: "Virtual agent reviewed case",
        timestamp: "Today · 9:02 AM",
        detail: "AI assistant reviewed the case details and initiated identity verification resolution workflow.",
        tone: "info",
        sortOrder: 2,
      },
      {
        id: "nadia_volkov-escalated",
        title: "Escalated to human agent",
        timestamp: "Today · 9:05 AM",
        detail: "Case escalated to human agent due to complexity of identity verification issue requiring manual intervention.",
        tone: "warning",
        sortOrder: 3,
      },
    ],
    customerHistory: [
      {
        id: "nadia_volkov-h1",
        title: "Identity Verification case opened",
        timestamp: "Today · 9:00 AM",
        detail: "New identity verification case opened for Nadia Volkov at Volkov Asset Management.",
        dot: "orange",
      },
      {
        id: "nadia_volkov-h2",
        title: "Account verified",
        timestamp: "Jan 22, 2026 · 2:00 PM",
        detail: "Identity and account details verified for Nadia Volkov.",
        dot: "gray",
      },
      {
        id: "nadia_volkov-h3",
        title: "Account created",
        timestamp: "Mar 2022, 2020 · 10:00 AM",
        detail: "Nadia Volkov joined Volkov Asset Management. Account created and onboarding completed.",
        dot: "green",
      },
    ],
    queue: {
      time: "8m",
      preview: "AI couldn't verify my identity — account changes are urgent",
      priority: "High",
      priorityClassName: "border-[#FFB800] bg-[#FFF6E0] text-[#A37A00]",
      badgeColor: "bg-[#166CCA]",
      icon: "phone",
      isActive: false,
      createdAt: "2026-04-27T09:00:00",
      updatedAt: "2026-04-27T09:05:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 9:00 AM",
        draft: "I've reviewed your identity verification case, Nadia. Here's what I can see and the steps I'm taking to resolve this for you right now.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hi, I'm reaching out about: AI couldn't verify my identity — account changes are urgent. Can you help?",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Nadia, I've reviewed your case regarding identity verification. Let me look into this for you.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "I appreciate that — this has been an ongoing issue and I need it resolved today.",
            time: "9:04 AM",
          }
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 9:00 AM",
        draft: "Hi Nadia — I've looked into your case. I'm working on a resolution and will update you shortly.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Need help — ai couldn't verify my identity — account changes are urgent.",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Nadia — I can see your case. Reviewing details now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thanks. Please let me know as soon as you have an update.",
            time: "9:04 AM",
          }
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 9:00 AM",
        draft: "Hi Nadia — I've reviewed your case. I have what I need to help you resolve this identity verification issue.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hello, I need help with a identity verification issue — ai couldn't verify my identity — account changes are urgent",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Nadia! I can see your case details. I'm reviewing everything now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Great — please update me here when you have news.",
            time: "9:04 AM",
          }
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 9:00 AM",
        draft: "Hi Nadia — thank you for your patience. I've reviewed your identity verification case in detail and I'm ready to walk you through the next steps.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Subject: Identity Verification - Urgent Assistance Needed\n\nHello,\n\nI need assistance with the following: AI couldn't verify my identity — account changes are urgent. Please respond as soon as possible.\n\nThank you,\nNadia Volkov",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Nadia,\n\nThank you for reaching out. I've reviewed your case and I'm working on resolving your identity verification issue. I'll have an update for you shortly.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thank you for the quick response. Please prioritise this — it's time-sensitive.",
            time: "9:04 AM",
          }
        ],
      },
    },
    customerSnapshot: [
      "4-year customer with $650K portfolio",
      "Russian heritage; analytical and detailed approach",
      "No disputes; excellent payment discipline",
      "Prefers comprehensive documentation always",
      "Values expertise and direct communication style",
    ],
  },
  {
    id: "ethan_blake",
    initials: "EB",
    name: "Ethan Blake",
    customerId: "CST-13862",
    lastUpdated: "04/27/26 | 09:00 AM",
    profile: {
      department: "Investment Services",
      tenureYears: 4,
      totalAUM: "$634,973.00",
      financialReadiness: 84,
      financialAdvisor: "Emma Wilson",
      advisorTitle: "Senior Account Manager",
      tags: ["Standard"],
      fraudRiskScore: 37,
      priorDisputeCount: 2,
      cardBlocked: false,
    },
    conversationTopics: [
      "Resolve general inquiry issue",
      "Review account status",
      "Confirm resolution and next steps",
    ],
    contact: {
      email: "ethan.blake@blakeinvestments.com",
      phone: "(693) 555-2537",
      address: { street: "1100 Larimer St", city: "Denver", state: "CO", zip: "80204", country: "US" },
    },
    accounts: [
      { id: "ethan_blake-chk", type: "Checking", number: "***2073", balance: "$39,939.00",
          availableBalance: "$39,939.00", status: "active", openedDate: "Apr 2024" },
      { id: "ethan_blake-sav", type: "Savings", number: "***3537", balance: "$171,017.00", status: "active", openedDate: "May 2024" },
    ],
    overview: {
      contactNumber: "(693) 555-2537",
      assignedAgent: "Emma Wilson",
      pronoun: "he",
      lastContactTime: "Today, 9:05 AM",
      address: "1100 Larimer St, Denver, CO 80204",
    },
    interactionTimeline: [
      {
        id: "ethan_blake-case-opened",
        title: "Case opened — General Inquiry",
        timestamp: "Today · 9:00 AM",
        detail: "Ethan Blake contacted support regarding: Virtual agent sent me in circles — need someone to actually help.",
        tone: "default",
        sortOrder: 1,
      },
      {
        id: "ethan_blake-bot-review",
        title: "Virtual agent reviewed case",
        timestamp: "Today · 9:02 AM",
        detail: "AI assistant reviewed the case details and initiated general inquiry resolution workflow.",
        tone: "info",
        sortOrder: 2,
      },
      {
        id: "ethan_blake-escalated",
        title: "Escalated to human agent",
        timestamp: "Today · 9:05 AM",
        detail: "Case escalated to human agent due to complexity of general inquiry issue requiring manual intervention.",
        tone: "warning",
        sortOrder: 3,
      },
    ],
    customerHistory: [
      {
        id: "ethan_blake-h1",
        title: "General Inquiry case opened",
        timestamp: "Today · 9:00 AM",
        detail: "New general inquiry case opened for Ethan Blake at Blake & Co. Investments.",
        dot: "orange",
      },
      {
        id: "ethan_blake-h2",
        title: "Account verified",
        timestamp: "Mar 5, 2026 · 2:00 PM",
        detail: "Identity and account details verified for Ethan Blake.",
        dot: "gray",
      },
      {
        id: "ethan_blake-h3",
        title: "Account created",
        timestamp: "Jun 2023, 2021 · 10:00 AM",
        detail: "Ethan Blake joined Blake & Co. Investments. Account created and onboarding completed.",
        dot: "green",
      },
    ],
    queue: {
      time: "1h 30m",
      preview: "Virtual agent sent me in circles — need someone to actually help",
      priority: "Low",
      priorityClassName: "border-[#43A047] bg-[#E8F5E9] text-[#2E7D32]",
      badgeColor: "bg-[#43A047]",
      icon: "messageSquare",
      isActive: false,
      createdAt: "2026-04-27T09:00:00",
      updatedAt: "2026-04-27T09:05:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 9:00 AM",
        draft: "I've reviewed your general inquiry case, Ethan. Here's what I can see and the steps I'm taking to resolve this for you right now.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hi, I'm reaching out about: Virtual agent sent me in circles — need someone to actually help. Can you help?",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Ethan, I've reviewed your case regarding general inquiry. Let me look into this for you.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "I appreciate that — this has been an ongoing issue and I need it resolved today.",
            time: "9:04 AM",
          }
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 9:00 AM",
        draft: "Hi Ethan — I've looked into your case. I'm working on a resolution and will update you shortly.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Need help — virtual agent sent me in circles — need someone to actually help.",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Ethan — I can see your case. Reviewing details now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thanks. Please let me know as soon as you have an update.",
            time: "9:04 AM",
          }
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 9:00 AM",
        draft: "Hi Ethan — I've reviewed your case. I have what I need to help you resolve this general inquiry issue.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hello, I need help with a general inquiry issue — virtual agent sent me in circles — need someone to actually help",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Ethan! I can see your case details. I'm reviewing everything now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Great — please update me here when you have news.",
            time: "9:04 AM",
          }
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 9:00 AM",
        draft: "Hi Ethan — thank you for your patience. I've reviewed your general inquiry case in detail and I'm ready to walk you through the next steps.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Subject: General Inquiry - Urgent Assistance Needed\n\nHello,\n\nI need assistance with the following: Virtual agent sent me in circles — need someone to actually help. Please respond as soon as possible.\n\nThank you,\nEthan Blake",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Ethan,\n\nThank you for reaching out. I've reviewed your case and I'm working on resolving your general inquiry issue. I'll have an update for you shortly.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thank you for the quick response. Please prioritise this — it's time-sensitive.",
            time: "9:04 AM",
          }
        ],
      },
    },
    customerSnapshot: [
      "3-year customer with growing portfolio",
      "Young professional; millennial generation",
      "Zero disputes; digitally native",
      "Expects mobile-first and app-based interactions",
      "Sustainability and social impact matter",
    ],
  },
  {
    id: "mei_lin",
    initials: "ML",
    name: "Mei Lin",
    customerId: "CST-13973",
    lastUpdated: "04/27/26 | 09:00 AM",
    profile: {
      department: "Healthcare Services",
      tenureYears: 3,
      totalAUM: "$724,110.00",
      financialReadiness: 40,
      financialAdvisor: "Jeff Comstock",
      advisorTitle: "Senior Account Manager",
      tags: ["Premier"],
      fraudRiskScore: 50,
      priorDisputeCount: 0,
      cardBlocked: false,
    },
    conversationTopics: [
      "Resolve incorrect ai guidance issue",
      "Review account status",
      "Confirm resolution and next steps",
    ],
    contact: {
      email: "mei.lin@linpharma.com",
      phone: "(710) 555-2590",
      address: { street: "88 Pine Ridge Rd", city: "Charlotte", state: "NC", zip: "28202", country: "US" },
    },
    accounts: [
      { id: "mei_lin-chk", type: "Checking", number: "***2110", balance: "$43,730.00",
          availableBalance: "$43,730.00", status: "active", openedDate: "Jul 2020" },
      { id: "mei_lin-sav", type: "Savings", number: "***3590", balance: "$175,190.00", status: "active", openedDate: "Aug 2020" },
    ],
    overview: {
      contactNumber: "(710) 555-2590",
      assignedAgent: "Jeff Comstock",
      pronoun: "she",
      lastContactTime: "Today, 9:05 AM",
      address: "88 Pine Ridge Rd, Charlotte, NC 28202",
    },
    interactionTimeline: [
      {
        id: "mei_lin-case-opened",
        title: "Case opened — Incorrect AI Guidance",
        timestamp: "Today · 9:00 AM",
        detail: "Mei Lin contacted support regarding: Automated agent gave incorrect dosage calculation guidance.",
        tone: "warning",
        sortOrder: 1,
      },
      {
        id: "mei_lin-bot-review",
        title: "Virtual agent reviewed case",
        timestamp: "Today · 9:02 AM",
        detail: "AI assistant reviewed the case details and initiated incorrect ai guidance resolution workflow.",
        tone: "info",
        sortOrder: 2,
      },
      {
        id: "mei_lin-escalated",
        title: "Escalated to human agent",
        timestamp: "Today · 9:05 AM",
        detail: "Case escalated to human agent due to complexity of incorrect ai guidance issue requiring manual intervention.",
        tone: "warning",
        sortOrder: 3,
      },
    ],
    customerHistory: [
      {
        id: "mei_lin-h1",
        title: "Incorrect AI Guidance case opened",
        timestamp: "Today · 9:00 AM",
        detail: "New incorrect ai guidance case opened for Mei Lin at Lin Pharmaceuticals.",
        dot: "orange",
      },
      {
        id: "mei_lin-h2",
        title: "Account verified",
        timestamp: "Feb 10, 2026 · 2:00 PM",
        detail: "Identity and account details verified for Mei Lin.",
        dot: "gray",
      },
      {
        id: "mei_lin-h3",
        title: "Account created",
        timestamp: "Sep 2019, 2022 · 10:00 AM",
        detail: "Mei Lin joined Lin Pharmaceuticals. Account created and onboarding completed.",
        dot: "green",
      },
    ],
    queue: {
      time: "15m",
      preview: "Automated agent gave incorrect dosage calculation guidance",
      priority: "High",
      priorityClassName: "border-[#FFB800] bg-[#FFF6E0] text-[#A37A00]",
      badgeColor: "bg-[#166CCA]",
      icon: "phone",
      isActive: false,
      createdAt: "2026-04-27T09:00:00",
      updatedAt: "2026-04-27T09:05:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 9:00 AM",
        draft: "I've reviewed your incorrect ai guidance case, Mei. Here's what I can see and the steps I'm taking to resolve this for you right now.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hi, I'm reaching out about: Automated agent gave incorrect dosage calculation guidance. Can you help?",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Mei, I've reviewed your case regarding incorrect ai guidance. Let me look into this for you.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "I appreciate that — this has been an ongoing issue and I need it resolved today.",
            time: "9:04 AM",
          }
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 9:00 AM",
        draft: "Hi Mei — I've looked into your case. I'm working on a resolution and will update you shortly.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Need help — automated agent gave incorrect dosage calculation guidance.",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Mei — I can see your case. Reviewing details now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thanks. Please let me know as soon as you have an update.",
            time: "9:04 AM",
          }
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 9:00 AM",
        draft: "Hi Mei — I've reviewed your case. I have what I need to help you resolve this incorrect ai guidance issue.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hello, I need help with a incorrect ai guidance issue — automated agent gave incorrect dosage calculation guidance",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Mei! I can see your case details. I'm reviewing everything now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Great — please update me here when you have news.",
            time: "9:04 AM",
          }
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 9:00 AM",
        draft: "Hi Mei — thank you for your patience. I've reviewed your incorrect ai guidance case in detail and I'm ready to walk you through the next steps.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Subject: Incorrect AI Guidance - Urgent Assistance Needed\n\nHello,\n\nI need assistance with the following: Automated agent gave incorrect dosage calculation guidance. Please respond as soon as possible.\n\nThank you,\nMei Lin",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Mei,\n\nThank you for reaching out. I've reviewed your case and I'm working on resolving your incorrect ai guidance issue. I'll have an update for you shortly.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thank you for the quick response. Please prioritise this — it's time-sensitive.",
            time: "9:04 AM",
          }
        ],
      },
    },
    customerSnapshot: [
      "5-year customer with $800K+ in accounts",
      "Chinese-American background; family-focused",
      "No prior disputes; traditional values",
      "Appreciates long-term relationship building",
      "Wants multi-generational wealth planning",
    ],
  },
  {
    id: "oliver_svensson",
    initials: "OS",
    name: "Oliver Svensson",
    customerId: "CST-14084",
    lastUpdated: "04/27/26 | 09:00 AM",
    profile: {
      department: "International Business",
      tenureYears: 2,
      totalAUM: "$813,247.00",
      financialReadiness: 51,
      financialAdvisor: "Marcus Lee",
      advisorTitle: "Senior Account Manager",
      tags: ["Standard"],
      fraudRiskScore: 63,
      priorDisputeCount: 1,
      cardBlocked: false,
    },
    conversationTopics: [
      "Resolve scheduling issue",
      "Review account status",
      "Confirm resolution and next steps",
    ],
    contact: {
      email: "oliver.svensson@svenssongroup.com",
      phone: "(727) 555-2643",
      address: { street: "740 State St", city: "Salt Lake City", state: "UT", zip: "84111", country: "US" },
    },
    accounts: [
      { id: "oliver_svensson-chk", type: "Business", number: "***2147", balance: "$37,347.00",
          availableBalance: "$37,347.00", status: "active", openedDate: "Oct 2021" },
      { id: "oliver_svensson-sav", type: "Savings", number: "***3643", balance: "$179,363.00", status: "active", openedDate: "Nov 2021" },
    ],
    overview: {
      contactNumber: "(727) 555-2643",
      assignedAgent: "Marcus Lee",
      pronoun: "he",
      lastContactTime: "Today, 9:05 AM",
      address: "740 State St, Salt Lake City, UT 84111",
    },
    interactionTimeline: [
      {
        id: "oliver_svensson-case-opened",
        title: "Case opened — Scheduling",
        timestamp: "Today · 9:00 AM",
        detail: "Oliver Svensson contacted support regarding: Bot failed to book my appointment — double booking risk.",
        tone: "default",
        sortOrder: 1,
      },
      {
        id: "oliver_svensson-bot-review",
        title: "Virtual agent reviewed case",
        timestamp: "Today · 9:02 AM",
        detail: "AI assistant reviewed the case details and initiated scheduling resolution workflow.",
        tone: "info",
        sortOrder: 2,
      },
      {
        id: "oliver_svensson-escalated",
        title: "Escalated to human agent",
        timestamp: "Today · 9:05 AM",
        detail: "Case escalated to human agent due to complexity of scheduling issue requiring manual intervention.",
        tone: "warning",
        sortOrder: 3,
      },
    ],
    customerHistory: [
      {
        id: "oliver_svensson-h1",
        title: "Scheduling case opened",
        timestamp: "Today · 9:00 AM",
        detail: "New scheduling case opened for Oliver Svensson at Svensson Group AB.",
        dot: "orange",
      },
      {
        id: "oliver_svensson-h2",
        title: "Account verified",
        timestamp: "Jan 22, 2026 · 2:00 PM",
        detail: "Identity and account details verified for Oliver Svensson.",
        dot: "gray",
      },
      {
        id: "oliver_svensson-h3",
        title: "Account created",
        timestamp: "Dec 2020, 2023 · 10:00 AM",
        detail: "Oliver Svensson joined Svensson Group AB. Account created and onboarding completed.",
        dot: "green",
      },
    ],
    queue: {
      time: "18m",
      preview: "Bot failed to book my appointment — double booking risk",
      priority: "Medium",
      priorityClassName: "border-[#0288D1] bg-[#E3F4FD] text-[#0277BD]",
      badgeColor: "bg-[#0288D1]",
      icon: "messageSquare",
      isActive: false,
      createdAt: "2026-04-27T09:00:00",
      updatedAt: "2026-04-27T09:05:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 9:00 AM",
        draft: "I've reviewed your scheduling case, Oliver. Here's what I can see and the steps I'm taking to resolve this for you right now.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hi, I'm reaching out about: Bot failed to book my appointment — double booking risk. Can you help?",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Oliver, I've reviewed your case regarding scheduling. Let me look into this for you.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "I appreciate that — this has been an ongoing issue and I need it resolved today.",
            time: "9:04 AM",
          }
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 9:00 AM",
        draft: "Hi Oliver — I've looked into your case. I'm working on a resolution and will update you shortly.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Need help — bot failed to book my appointment — double booking risk.",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Oliver — I can see your case. Reviewing details now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thanks. Please let me know as soon as you have an update.",
            time: "9:04 AM",
          }
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 9:00 AM",
        draft: "Hi Oliver — I've reviewed your case. I have what I need to help you resolve this scheduling issue.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hello, I need help with a scheduling issue — bot failed to book my appointment — double booking risk",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Oliver! I can see your case details. I'm reviewing everything now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Great — please update me here when you have news.",
            time: "9:04 AM",
          }
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 9:00 AM",
        draft: "Hi Oliver — thank you for your patience. I've reviewed your scheduling case in detail and I'm ready to walk you through the next steps.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Subject: Scheduling - Urgent Assistance Needed\n\nHello,\n\nI need assistance with the following: Bot failed to book my appointment — double booking risk. Please respond as soon as possible.\n\nThank you,\nOliver Svensson",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Oliver,\n\nThank you for reaching out. I've reviewed your case and I'm working on resolving your scheduling issue. I'll have an update for you shortly.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thank you for the quick response. Please prioritise this — it's time-sensitive.",
            time: "9:04 AM",
          }
        ],
      },
    },
    customerSnapshot: [
      "7-year customer with $1.1M+ portfolio",
      "Business Banking Premier tier customer",
      "Zero disputes; prestigious client",
      "Swedish heritage; efficiency-oriented",
      "Expects top-tier service and expertise",
    ],
  },
  {
    id: "priscilla_nakamura",
    initials: "PN",
    name: "Priscilla Nakamura",
    customerId: "CST-14195",
    lastUpdated: "04/27/26 | 09:00 AM",
    profile: {
      department: "Wealth Management",
      tenureYears: 1,
      totalAUM: "$902,384.00",
      financialReadiness: 62,
      financialAdvisor: "Sarah Chen",
      advisorTitle: "Senior Account Manager",
      tags: ["Premier"],
      fraudRiskScore: 76,
      priorDisputeCount: 2,
      cardBlocked: false,
    },
    conversationTopics: [
      "Resolve account locked issue",
      "Review account status",
      "Confirm resolution and next steps",
    ],
    contact: {
      email: "priscilla.nakamura@nakamurawealth.com",
      phone: "(744) 555-2696",
      address: { street: "300 Congress Ave", city: "Austin", state: "TX", zip: "78701", country: "US" },
    },
    accounts: [
      { id: "priscilla_nakamura-chk", type: "Business", number: "***2184", balance: "$42,584.00",
          availableBalance: "$42,584.00", status: "active", openedDate: "Jan 2022" },
      { id: "priscilla_nakamura-sav", type: "Savings", number: "***3696", balance: "$183,536.00", status: "active", openedDate: "Feb 2022" },
    ],
    overview: {
      contactNumber: "(744) 555-2696",
      assignedAgent: "Sarah Chen",
      pronoun: "she",
      lastContactTime: "Today, 9:05 AM",
      address: "300 Congress Ave, Austin, TX 78701",
    },
    interactionTimeline: [
      {
        id: "priscilla_nakamura-case-opened",
        title: "Case opened — Account Locked",
        timestamp: "Today · 9:00 AM",
        detail: "Priscilla Nakamura contacted support regarding: AI triggered an account freeze I didn't authorize.",
        tone: "warning",
        sortOrder: 1,
      },
      {
        id: "priscilla_nakamura-bot-review",
        title: "Virtual agent reviewed case",
        timestamp: "Today · 9:02 AM",
        detail: "AI assistant reviewed the case details and initiated account locked resolution workflow.",
        tone: "info",
        sortOrder: 2,
      },
      {
        id: "priscilla_nakamura-escalated",
        title: "Escalated to human agent",
        timestamp: "Today · 9:05 AM",
        detail: "Case escalated to human agent due to complexity of account locked issue requiring manual intervention.",
        tone: "critical",
        sortOrder: 3,
      },
    ],
    customerHistory: [
      {
        id: "priscilla_nakamura-h1",
        title: "Account Locked case opened",
        timestamp: "Today · 9:00 AM",
        detail: "New account locked case opened for Priscilla Nakamura at Nakamura Wealth Group.",
        dot: "orange",
      },
      {
        id: "priscilla_nakamura-h2",
        title: "Account verified",
        timestamp: "Mar 5, 2026 · 2:00 PM",
        detail: "Identity and account details verified for Priscilla Nakamura.",
        dot: "gray",
      },
      {
        id: "priscilla_nakamura-h3",
        title: "Account created",
        timestamp: "Mar 2021, 2020 · 10:00 AM",
        detail: "Priscilla Nakamura joined Nakamura Wealth Group. Account created and onboarding completed.",
        dot: "green",
      },
    ],
    queue: {
      time: "2m",
      preview: "AI triggered an account freeze I didn't authorize",
      priority: "Critical",
      priorityClassName: "border-[#E53935] bg-[#FDEAEA] text-[#C71D1A]",
      badgeColor: "bg-[#E32926]",
      icon: "phone",
      isActive: false,
      createdAt: "2026-04-27T09:00:00",
      updatedAt: "2026-04-27T09:05:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 9:00 AM",
        draft: "I've reviewed your account locked case, Priscilla. Here's what I can see and the steps I'm taking to resolve this for you right now.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hi, I'm reaching out about: AI triggered an account freeze I didn't authorize. Can you help?",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Priscilla, I've reviewed your case regarding account locked. Let me look into this for you.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "I appreciate that — this has been an ongoing issue and I need it resolved today.",
            time: "9:04 AM",
          }
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 9:00 AM",
        draft: "Hi Priscilla — I've looked into your case. I'm working on a resolution and will update you shortly.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Need help — ai triggered an account freeze i didn't authorize.",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Priscilla — I can see your case. Reviewing details now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thanks. Please let me know as soon as you have an update.",
            time: "9:04 AM",
          }
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 9:00 AM",
        draft: "Hi Priscilla — I've reviewed your case. I have what I need to help you resolve this account locked issue.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hello, I need help with a account locked issue — ai triggered an account freeze i didn't authorize",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Priscilla! I can see your case details. I'm reviewing everything now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Great — please update me here when you have news.",
            time: "9:04 AM",
          }
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 9:00 AM",
        draft: "Hi Priscilla — thank you for your patience. I've reviewed your account locked case in detail and I'm ready to walk you through the next steps.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Subject: Account Locked - Urgent Assistance Needed\n\nHello,\n\nI need assistance with the following: AI triggered an account freeze I didn't authorize. Please respond as soon as possible.\n\nThank you,\nPriscilla Nakamura",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Priscilla,\n\nThank you for reaching out. I've reviewed your case and I'm working on resolving your account locked issue. I'll have an update for you shortly.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thank you for the quick response. Please prioritise this — it's time-sensitive.",
            time: "9:04 AM",
          }
        ],
      },
    },
    customerSnapshot: [
      "4-year customer with $600K in holdings",
      "Japanese-American; cultural awareness appreciated",
      "No prior disputes; reliable payer",
      "Prefers harmony in relationships",
      "Interested in ESG and ethical investing",
    ],
  },
  {
    id: "hugo_fernandez",
    initials: "HF",
    name: "Hugo Fernandez",
    customerId: "CST-14306",
    lastUpdated: "04/27/26 | 09:00 AM",
    profile: {
      department: "International Trade",
      tenureYears: 8,
      totalAUM: "$991,521.00",
      financialReadiness: 73,
      financialAdvisor: "David Park",
      advisorTitle: "Senior Account Manager",
      tags: ["Standard"],
      fraudRiskScore: 19,
      priorDisputeCount: 0,
      cardBlocked: false,
    },
    conversationTopics: [
      "Resolve general inquiry issue",
      "Review account status",
      "Confirm resolution and next steps",
    ],
    contact: {
      email: "hugo.fernandez@fernandezimportexport.com",
      phone: "(761) 555-2749",
      address: { street: "600 Olive Way", city: "Seattle", state: "WA", zip: "98101", country: "US" },
    },
    accounts: [
      { id: "hugo_fernandez-chk", type: "Checking", number: "***2221", balance: "$55,103.00",
          availableBalance: "$55,103.00", status: "active", openedDate: "Apr 2023" },
      { id: "hugo_fernandez-sav", type: "Savings", number: "***3749", balance: "$187,709.00", status: "active", openedDate: "May 2023" },
    ],
    overview: {
      contactNumber: "(761) 555-2749",
      assignedAgent: "David Park",
      pronoun: "he",
      lastContactTime: "Today, 9:05 AM",
      address: "600 Olive Way, Seattle, WA 98101",
    },
    interactionTimeline: [
      {
        id: "hugo_fernandez-case-opened",
        title: "Case opened — General Inquiry",
        timestamp: "Today · 9:00 AM",
        detail: "Hugo Fernandez contacted support regarding: Virtual agent can't locate my order history from last year.",
        tone: "default",
        sortOrder: 1,
      },
      {
        id: "hugo_fernandez-bot-review",
        title: "Virtual agent reviewed case",
        timestamp: "Today · 9:02 AM",
        detail: "AI assistant reviewed the case details and initiated general inquiry resolution workflow.",
        tone: "info",
        sortOrder: 2,
      },
      {
        id: "hugo_fernandez-escalated",
        title: "Escalated to human agent",
        timestamp: "Today · 9:05 AM",
        detail: "Case escalated to human agent due to complexity of general inquiry issue requiring manual intervention.",
        tone: "warning",
        sortOrder: 3,
      },
    ],
    customerHistory: [
      {
        id: "hugo_fernandez-h1",
        title: "General Inquiry case opened",
        timestamp: "Today · 9:00 AM",
        detail: "New general inquiry case opened for Hugo Fernandez at Fernandez Import-Export.",
        dot: "orange",
      },
      {
        id: "hugo_fernandez-h2",
        title: "Account verified",
        timestamp: "Feb 10, 2026 · 2:00 PM",
        detail: "Identity and account details verified for Hugo Fernandez.",
        dot: "gray",
      },
      {
        id: "hugo_fernandez-h3",
        title: "Account created",
        timestamp: "Jun 2022, 2021 · 10:00 AM",
        detail: "Hugo Fernandez joined Fernandez Import-Export. Account created and onboarding completed.",
        dot: "green",
      },
    ],
    queue: {
      time: "1h 30m",
      preview: "Virtual agent can't locate my order history from last year",
      priority: "Low",
      priorityClassName: "border-[#43A047] bg-[#E8F5E9] text-[#2E7D32]",
      badgeColor: "bg-[#43A047]",
      icon: "messageSquare",
      isActive: false,
      createdAt: "2026-04-27T09:00:00",
      updatedAt: "2026-04-27T09:05:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 9:00 AM",
        draft: "I've reviewed your general inquiry case, Hugo. Here's what I can see and the steps I'm taking to resolve this for you right now.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hi, I'm reaching out about: Virtual agent can't locate my order history from last year. Can you help?",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Hugo, I've reviewed your case regarding general inquiry. Let me look into this for you.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "I appreciate that — this has been an ongoing issue and I need it resolved today.",
            time: "9:04 AM",
          }
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 9:00 AM",
        draft: "Hi Hugo — I've looked into your case. I'm working on a resolution and will update you shortly.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Need help — virtual agent can't locate my order history from last year.",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Hugo — I can see your case. Reviewing details now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thanks. Please let me know as soon as you have an update.",
            time: "9:04 AM",
          }
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 9:00 AM",
        draft: "Hi Hugo — I've reviewed your case. I have what I need to help you resolve this general inquiry issue.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hello, I need help with a general inquiry issue — virtual agent can't locate my order history from last year",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Hugo! I can see your case details. I'm reviewing everything now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Great — please update me here when you have news.",
            time: "9:04 AM",
          }
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 9:00 AM",
        draft: "Hi Hugo — thank you for your patience. I've reviewed your general inquiry case in detail and I'm ready to walk you through the next steps.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Subject: General Inquiry - Urgent Assistance Needed\n\nHello,\n\nI need assistance with the following: Virtual agent can't locate my order history from last year. Please respond as soon as possible.\n\nThank you,\nHugo Fernandez",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Hugo,\n\nThank you for reaching out. I've reviewed your case and I'm working on resolving your general inquiry issue. I'll have an update for you shortly.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thank you for the quick response. Please prioritise this — it's time-sensitive.",
            time: "9:04 AM",
          }
        ],
      },
    },
    customerSnapshot: [
      "2-year customer with $420K starting portfolio",
      "Spanish business owner; bilingual communication",
      "Zero disputes; strong work ethic evident",
      "Growing business; account activity increasing",
      "Values personal relationships and handshake deals",
    ],
  },
  {
    id: "thandi_mokoena",
    initials: "TM",
    name: "Thandi Mokoena",
    customerId: "CST-14417",
    lastUpdated: "04/27/26 | 09:00 AM",
    profile: {
      department: "Mining & Resources",
      tenureYears: 7,
      totalAUM: "$1,080,658.00",
      financialReadiness: 84,
      financialAdvisor: "Emma Wilson",
      advisorTitle: "Senior Account Manager",
      tags: ["Premier"],
      fraudRiskScore: 32,
      priorDisputeCount: 1,
      cardBlocked: false,
    },
    conversationTopics: [
      "Resolve billing dispute issue",
      "Review account status",
      "Confirm resolution and next steps",
    ],
    contact: {
      email: "thandi.mokoena@mokoenamining.com",
      phone: "(778) 555-2802",
      address: { street: "1050 N Flagler Dr", city: "West Palm Beach", state: "FL", zip: "33401", country: "US" },
    },
    accounts: [
      { id: "thandi_mokoena-chk", type: "Business", number: "***2258", balance: "$53,058.00",
          availableBalance: "$53,058.00", status: "active", openedDate: "Jul 2024" },
      { id: "thandi_mokoena-sav", type: "Savings", number: "***3802", balance: "$191,882.00", status: "active", openedDate: "Aug 2024" },
    ],
    overview: {
      contactNumber: "(778) 555-2802",
      assignedAgent: "Emma Wilson",
      pronoun: "she",
      lastContactTime: "Today, 9:05 AM",
      address: "1050 N Flagler Dr, West Palm Beach, FL 33401",
    },
    interactionTimeline: [
      {
        id: "thandi_mokoena-case-opened",
        title: "Case opened — Billing Dispute",
        timestamp: "Today · 9:00 AM",
        detail: "Thandi Mokoena contacted support regarding: Bot can't process my VAT exemption certificate.",
        tone: "warning",
        sortOrder: 1,
      },
      {
        id: "thandi_mokoena-bot-review",
        title: "Virtual agent reviewed case",
        timestamp: "Today · 9:02 AM",
        detail: "AI assistant reviewed the case details and initiated billing dispute resolution workflow.",
        tone: "info",
        sortOrder: 2,
      },
      {
        id: "thandi_mokoena-escalated",
        title: "Escalated to human agent",
        timestamp: "Today · 9:05 AM",
        detail: "Case escalated to human agent due to complexity of billing dispute issue requiring manual intervention.",
        tone: "warning",
        sortOrder: 3,
      },
    ],
    customerHistory: [
      {
        id: "thandi_mokoena-h1",
        title: "Billing Dispute case opened",
        timestamp: "Today · 9:00 AM",
        detail: "New billing dispute case opened for Thandi Mokoena at Mokoena Mining Corp.",
        dot: "orange",
      },
      {
        id: "thandi_mokoena-h2",
        title: "Account verified",
        timestamp: "Jan 22, 2026 · 2:00 PM",
        detail: "Identity and account details verified for Thandi Mokoena.",
        dot: "gray",
      },
      {
        id: "thandi_mokoena-h3",
        title: "Account created",
        timestamp: "Sep 2023, 2022 · 10:00 AM",
        detail: "Thandi Mokoena joined Mokoena Mining Corp. Account created and onboarding completed.",
        dot: "green",
      },
    ],
    queue: {
      time: "15m",
      preview: "Bot can't process my VAT exemption certificate",
      priority: "High",
      priorityClassName: "border-[#FFB800] bg-[#FFF6E0] text-[#A37A00]",
      badgeColor: "bg-[#166CCA]",
      icon: "phone",
      isActive: false,
      createdAt: "2026-04-27T09:00:00",
      updatedAt: "2026-04-27T09:05:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 9:00 AM",
        draft: "I've reviewed your billing dispute case, Thandi. Here's what I can see and the steps I'm taking to resolve this for you right now.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hi, I'm reaching out about: Bot can't process my VAT exemption certificate. Can you help?",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Thandi, I've reviewed your case regarding billing dispute. Let me look into this for you.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "I appreciate that — this has been an ongoing issue and I need it resolved today.",
            time: "9:04 AM",
          }
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 9:00 AM",
        draft: "Hi Thandi — I've looked into your case. I'm working on a resolution and will update you shortly.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Need help — bot can't process my vat exemption certificate.",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Thandi — I can see your case. Reviewing details now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thanks. Please let me know as soon as you have an update.",
            time: "9:04 AM",
          }
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 9:00 AM",
        draft: "Hi Thandi — I've reviewed your case. I have what I need to help you resolve this billing dispute issue.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hello, I need help with a billing dispute issue — bot can't process my vat exemption certificate",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Thandi! I can see your case details. I'm reviewing everything now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Great — please update me here when you have news.",
            time: "9:04 AM",
          }
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 9:00 AM",
        draft: "Hi Thandi — thank you for your patience. I've reviewed your billing dispute case in detail and I'm ready to walk you through the next steps.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Subject: Billing Dispute - Urgent Assistance Needed\n\nHello,\n\nI need assistance with the following: Bot can't process my VAT exemption certificate. Please respond as soon as possible.\n\nThank you,\nThandi Mokoena",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Thandi,\n\nThank you for reaching out. I've reviewed your case and I'm working on resolving your billing dispute issue. I'll have an update for you shortly.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thank you for the quick response. Please prioritise this — it's time-sensitive.",
            time: "9:04 AM",
          }
        ],
      },
    },
    customerSnapshot: [
      "3-year customer with $480K in accounts",
      "South African background; international perspective",
      "No prior disputes; excellent standing",
      "Appreciates diversity and inclusion efforts",
      "Interested in sustainable investment options",
    ],
  },
  {
    id: "jerome_dupont",
    initials: "JD",
    name: "Jerome Dupont",
    customerId: "CST-14528",
    lastUpdated: "04/27/26 | 09:00 AM",
    profile: {
      department: "Financial Services",
      tenureYears: 6,
      totalAUM: "$1,169,795.00",
      financialReadiness: 40,
      financialAdvisor: "Jeff Comstock",
      advisorTitle: "Senior Account Manager",
      tags: ["Standard"],
      fraudRiskScore: 45,
      priorDisputeCount: 2,
      cardBlocked: false,
    },
    conversationTopics: [
      "Resolve payment issue issue",
      "Review account status",
      "Confirm resolution and next steps",
    ],
    contact: {
      email: "jerome.dupont@dupontfinancial.com",
      phone: "(795) 555-2855",
      address: { street: "220 W Washington St", city: "Indianapolis", state: "IN", zip: "46204", country: "US" },
    },
    accounts: [
      { id: "jerome_dupont-chk", type: "Checking", number: "***2295", balance: "$62,685.00",
          availableBalance: "$62,685.00", status: "active", openedDate: "Oct 2020" },
      { id: "jerome_dupont-sav", type: "Savings", number: "***3855", balance: "$196,055.00", status: "active", openedDate: "Nov 2020" },
    ],
    overview: {
      contactNumber: "(795) 555-2855",
      assignedAgent: "Jeff Comstock",
      pronoun: "he",
      lastContactTime: "Today, 9:05 AM",
      address: "220 W Washington St, Indianapolis, IN 46204",
    },
    interactionTimeline: [
      {
        id: "jerome_dupont-case-opened",
        title: "Case opened — Payment Issue",
        timestamp: "Today · 9:00 AM",
        detail: "Jerome Dupont contacted support regarding: AI couldn't process my multi-currency transfer request.",
        tone: "default",
        sortOrder: 1,
      },
      {
        id: "jerome_dupont-bot-review",
        title: "Virtual agent reviewed case",
        timestamp: "Today · 9:02 AM",
        detail: "AI assistant reviewed the case details and initiated payment issue resolution workflow.",
        tone: "info",
        sortOrder: 2,
      },
      {
        id: "jerome_dupont-escalated",
        title: "Escalated to human agent",
        timestamp: "Today · 9:05 AM",
        detail: "Case escalated to human agent due to complexity of payment issue issue requiring manual intervention.",
        tone: "warning",
        sortOrder: 3,
      },
    ],
    customerHistory: [
      {
        id: "jerome_dupont-h1",
        title: "Payment Issue case opened",
        timestamp: "Today · 9:00 AM",
        detail: "New payment issue case opened for Jerome Dupont at Dupont Financial Services.",
        dot: "orange",
      },
      {
        id: "jerome_dupont-h2",
        title: "Account verified",
        timestamp: "Mar 5, 2026 · 2:00 PM",
        detail: "Identity and account details verified for Jerome Dupont.",
        dot: "gray",
      },
      {
        id: "jerome_dupont-h3",
        title: "Account created",
        timestamp: "Dec 2019, 2023 · 10:00 AM",
        detail: "Jerome Dupont joined Dupont Financial Services. Account created and onboarding completed.",
        dot: "green",
      },
    ],
    queue: {
      time: "18m",
      preview: "AI couldn't process my multi-currency transfer request",
      priority: "Medium",
      priorityClassName: "border-[#0288D1] bg-[#E3F4FD] text-[#0277BD]",
      badgeColor: "bg-[#0288D1]",
      icon: "messageSquare",
      isActive: false,
      createdAt: "2026-04-27T09:00:00",
      updatedAt: "2026-04-27T09:05:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 9:00 AM",
        draft: "I've reviewed your payment issue case, Jerome. Here's what I can see and the steps I'm taking to resolve this for you right now.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hi, I'm reaching out about: AI couldn't process my multi-currency transfer request. Can you help?",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Jerome, I've reviewed your case regarding payment issue. Let me look into this for you.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "I appreciate that — this has been an ongoing issue and I need it resolved today.",
            time: "9:04 AM",
          }
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 9:00 AM",
        draft: "Hi Jerome — I've looked into your case. I'm working on a resolution and will update you shortly.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Need help — ai couldn't process my multi-currency transfer request.",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Jerome — I can see your case. Reviewing details now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thanks. Please let me know as soon as you have an update.",
            time: "9:04 AM",
          }
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 9:00 AM",
        draft: "Hi Jerome — I've reviewed your case. I have what I need to help you resolve this payment issue issue.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hello, I need help with a payment issue issue — ai couldn't process my multi-currency transfer request",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Jerome! I can see your case details. I'm reviewing everything now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Great — please update me here when you have news.",
            time: "9:04 AM",
          }
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 9:00 AM",
        draft: "Hi Jerome — thank you for your patience. I've reviewed your payment issue case in detail and I'm ready to walk you through the next steps.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Subject: Payment Issue - Urgent Assistance Needed\n\nHello,\n\nI need assistance with the following: AI couldn't process my multi-currency transfer request. Please respond as soon as possible.\n\nThank you,\nJerome Dupont",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Jerome,\n\nThank you for reaching out. I've reviewed your case and I'm working on resolving your payment issue issue. I'll have an update for you shortly.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thank you for the quick response. Please prioritise this — it's time-sensitive.",
            time: "9:04 AM",
          }
        ],
      },
    },
    customerSnapshot: [
      "6-year customer with $900K+ portfolio",
      "French background; sophisticated investor",
      "Zero disputes; excellent credit standing",
      "Values expertise and intellectual engagement",
      "Wants detailed analysis with each recommendation",
    ],
  },
  {
    id: "vera_sokolova",
    initials: "VS",
    name: "Vera Sokolova",
    customerId: "CST-14639",
    lastUpdated: "04/27/26 | 09:00 AM",
    profile: {
      department: "Corporate Holdings",
      tenureYears: 5,
      totalAUM: "$1,258,932.00",
      financialReadiness: 51,
      financialAdvisor: "Marcus Lee",
      advisorTitle: "Senior Account Manager",
      tags: ["Premier"],
      fraudRiskScore: 58,
      priorDisputeCount: 0,
      cardBlocked: false,
    },
    conversationTopics: [
      "Resolve general inquiry issue",
      "Review account status",
      "Confirm resolution and next steps",
    ],
    contact: {
      email: "vera.sokolova@sokolovagroup.com",
      phone: "(212) 555-2908",
      address: { street: "830 Third Ave", city: "New York", state: "NY", zip: "10022", country: "US" },
    },
    accounts: [
      { id: "vera_sokolova-chk", type: "Business", number: "***2332", balance: "$63,532.00",
          availableBalance: "$63,532.00", status: "active", openedDate: "Jan 2021" },
      { id: "vera_sokolova-sav", type: "Savings", number: "***3908", balance: "$200,228.00", status: "active", openedDate: "Feb 2021" },
    ],
    overview: {
      contactNumber: "(212) 555-2908",
      assignedAgent: "Marcus Lee",
      pronoun: "she",
      lastContactTime: "Today, 9:05 AM",
      address: "830 Third Ave, New York, NY 10022",
    },
    interactionTimeline: [
      {
        id: "vera_sokolova-case-opened",
        title: "Case opened — General Inquiry",
        timestamp: "Today · 9:00 AM",
        detail: "Vera Sokolova contacted support regarding: Virtual agent closed my chat before I finished explaining.",
        tone: "default",
        sortOrder: 1,
      },
      {
        id: "vera_sokolova-bot-review",
        title: "Virtual agent reviewed case",
        timestamp: "Today · 9:02 AM",
        detail: "AI assistant reviewed the case details and initiated general inquiry resolution workflow.",
        tone: "info",
        sortOrder: 2,
      },
      {
        id: "vera_sokolova-escalated",
        title: "Escalated to human agent",
        timestamp: "Today · 9:05 AM",
        detail: "Case escalated to human agent due to complexity of general inquiry issue requiring manual intervention.",
        tone: "warning",
        sortOrder: 3,
      },
    ],
    customerHistory: [
      {
        id: "vera_sokolova-h1",
        title: "General Inquiry case opened",
        timestamp: "Today · 9:00 AM",
        detail: "New general inquiry case opened for Vera Sokolova at Sokolova Group Holdings.",
        dot: "orange",
      },
      {
        id: "vera_sokolova-h2",
        title: "Account verified",
        timestamp: "Feb 10, 2026 · 2:00 PM",
        detail: "Identity and account details verified for Vera Sokolova.",
        dot: "gray",
      },
      {
        id: "vera_sokolova-h3",
        title: "Account created",
        timestamp: "Mar 2020, 2020 · 10:00 AM",
        detail: "Vera Sokolova joined Sokolova Group Holdings. Account created and onboarding completed.",
        dot: "green",
      },
    ],
    queue: {
      time: "1h 5m",
      preview: "Virtual agent closed my chat before I finished explaining",
      priority: "Low",
      priorityClassName: "border-[#43A047] bg-[#E8F5E9] text-[#2E7D32]",
      badgeColor: "bg-[#43A047]",
      icon: "phone",
      isActive: false,
      createdAt: "2026-04-27T09:00:00",
      updatedAt: "2026-04-27T09:05:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 9:00 AM",
        draft: "I've reviewed your general inquiry case, Vera. Here's what I can see and the steps I'm taking to resolve this for you right now.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hi, I'm reaching out about: Virtual agent closed my chat before I finished explaining. Can you help?",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Vera, I've reviewed your case regarding general inquiry. Let me look into this for you.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "I appreciate that — this has been an ongoing issue and I need it resolved today.",
            time: "9:04 AM",
          }
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 9:00 AM",
        draft: "Hi Vera — I've looked into your case. I'm working on a resolution and will update you shortly.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Need help — virtual agent closed my chat before i finished explaining.",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Vera — I can see your case. Reviewing details now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thanks. Please let me know as soon as you have an update.",
            time: "9:04 AM",
          }
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 9:00 AM",
        draft: "Hi Vera — I've reviewed your case. I have what I need to help you resolve this general inquiry issue.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hello, I need help with a general inquiry issue — virtual agent closed my chat before i finished explaining",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Vera! I can see your case details. I'm reviewing everything now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Great — please update me here when you have news.",
            time: "9:04 AM",
          }
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 9:00 AM",
        draft: "Hi Vera — thank you for your patience. I've reviewed your general inquiry case in detail and I'm ready to walk you through the next steps.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Subject: General Inquiry - Urgent Assistance Needed\n\nHello,\n\nI need assistance with the following: Virtual agent closed my chat before I finished explaining. Please respond as soon as possible.\n\nThank you,\nVera Sokolova",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Vera,\n\nThank you for reaching out. I've reviewed your case and I'm working on resolving your general inquiry issue. I'll have an update for you shortly.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thank you for the quick response. Please prioritise this — it's time-sensitive.",
            time: "9:04 AM",
          }
        ],
      },
    },
    customerSnapshot: [
      "5-year customer with $750K in holdings",
      "Russian-American; detail-oriented professional",
      "No prior disputes; meticulous record keeper",
      "Prefers comprehensive documentation always",
      "Values stability and long-term relationships",
    ],
  },
  {
    id: "nathan_kowalski",
    initials: "NK",
    name: "Nathan Kowalski",
    customerId: "CST-14750",
    lastUpdated: "04/27/26 | 09:00 AM",
    profile: {
      department: "Industrial Accounts",
      tenureYears: 4,
      totalAUM: "$1,348,069.00",
      financialReadiness: 62,
      financialAdvisor: "Sarah Chen",
      advisorTitle: "Senior Account Manager",
      tags: ["Standard"],
      fraudRiskScore: 71,
      priorDisputeCount: 1,
      cardBlocked: false,
    },
    conversationTopics: [
      "Resolve incorrect ai guidance issue",
      "Review account status",
      "Confirm resolution and next steps",
    ],
    contact: {
      email: "nathan.kowalski@kowalskiindustrial.com",
      phone: "(229) 555-2961",
      address: { street: "2200 Renaissance Blvd", city: "Detroit", state: "MI", zip: "48243", country: "US" },
    },
    accounts: [
      { id: "nathan_kowalski-chk", type: "Checking", number: "***2369", balance: "$70,267.00",
          availableBalance: "$70,267.00", status: "active", openedDate: "Apr 2022" },
      { id: "nathan_kowalski-sav", type: "Savings", number: "***3961", balance: "$204,401.00", status: "active", openedDate: "May 2022" },
    ],
    overview: {
      contactNumber: "(229) 555-2961",
      assignedAgent: "Sarah Chen",
      pronoun: "he",
      lastContactTime: "Today, 9:05 AM",
      address: "2200 Renaissance Blvd, Detroit, MI 48243",
    },
    interactionTimeline: [
      {
        id: "nathan_kowalski-case-opened",
        title: "Case opened — Incorrect AI Guidance",
        timestamp: "Today · 9:00 AM",
        detail: "Nathan Kowalski contacted support regarding: AI gave conflicting answers about my warranty claim eligibility.",
        tone: "warning",
        sortOrder: 1,
      },
      {
        id: "nathan_kowalski-bot-review",
        title: "Virtual agent reviewed case",
        timestamp: "Today · 9:02 AM",
        detail: "AI assistant reviewed the case details and initiated incorrect ai guidance resolution workflow.",
        tone: "info",
        sortOrder: 2,
      },
      {
        id: "nathan_kowalski-escalated",
        title: "Escalated to human agent",
        timestamp: "Today · 9:05 AM",
        detail: "Case escalated to human agent due to complexity of incorrect ai guidance issue requiring manual intervention.",
        tone: "warning",
        sortOrder: 3,
      },
    ],
    customerHistory: [
      {
        id: "nathan_kowalski-h1",
        title: "Incorrect AI Guidance case opened",
        timestamp: "Today · 9:00 AM",
        detail: "New incorrect ai guidance case opened for Nathan Kowalski at Kowalski Industrial.",
        dot: "orange",
      },
      {
        id: "nathan_kowalski-h2",
        title: "Account verified",
        timestamp: "Jan 22, 2026 · 2:00 PM",
        detail: "Identity and account details verified for Nathan Kowalski.",
        dot: "gray",
      },
      {
        id: "nathan_kowalski-h3",
        title: "Account created",
        timestamp: "Jun 2021, 2021 · 10:00 AM",
        detail: "Nathan Kowalski joined Kowalski Industrial. Account created and onboarding completed.",
        dot: "green",
      },
    ],
    queue: {
      time: "12m",
      preview: "AI gave conflicting answers about my warranty claim eligibility",
      priority: "High",
      priorityClassName: "border-[#FFB800] bg-[#FFF6E0] text-[#A37A00]",
      badgeColor: "bg-[#166CCA]",
      icon: "messageSquare",
      isActive: false,
      createdAt: "2026-04-27T09:00:00",
      updatedAt: "2026-04-27T09:05:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 9:00 AM",
        draft: "I've reviewed your incorrect ai guidance case, Nathan. Here's what I can see and the steps I'm taking to resolve this for you right now.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hi, I'm reaching out about: AI gave conflicting answers about my warranty claim eligibility. Can you help?",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Nathan, I've reviewed your case regarding incorrect ai guidance. Let me look into this for you.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "I appreciate that — this has been an ongoing issue and I need it resolved today.",
            time: "9:04 AM",
          }
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 9:00 AM",
        draft: "Hi Nathan — I've looked into your case. I'm working on a resolution and will update you shortly.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Need help — ai gave conflicting answers about my warranty claim eligibility.",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Nathan — I can see your case. Reviewing details now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thanks. Please let me know as soon as you have an update.",
            time: "9:04 AM",
          }
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 9:00 AM",
        draft: "Hi Nathan — I've reviewed your case. I have what I need to help you resolve this incorrect ai guidance issue.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hello, I need help with a incorrect ai guidance issue — ai gave conflicting answers about my warranty claim eligibility",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Nathan! I can see your case details. I'm reviewing everything now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Great — please update me here when you have news.",
            time: "9:04 AM",
          }
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 9:00 AM",
        draft: "Hi Nathan — thank you for your patience. I've reviewed your incorrect ai guidance case in detail and I'm ready to walk you through the next steps.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Subject: Incorrect AI Guidance - Urgent Assistance Needed\n\nHello,\n\nI need assistance with the following: AI gave conflicting answers about my warranty claim eligibility. Please respond as soon as possible.\n\nThank you,\nNathan Kowalski",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Nathan,\n\nThank you for reaching out. I've reviewed your case and I'm working on resolving your incorrect ai guidance issue. I'll have an update for you shortly.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thank you for the quick response. Please prioritise this — it's time-sensitive.",
            time: "9:04 AM",
          }
        ],
      },
    },
    customerSnapshot: [
      "4-year customer with $580K portfolio",
      "Polish-American background; family values",
      "Zero disputes; steady account growth",
      "Prefers conservative investment approach",
      "Appreciates personalized service and attention",
    ],
  },
  {
    id: "aisha_kamara",
    initials: "AK",
    name: "Aisha Kamara",
    customerId: "CST-14861",
    lastUpdated: "04/27/26 | 09:00 AM",
    profile: {
      department: "Venture Capital",
      tenureYears: 3,
      totalAUM: "$1,437,206.00",
      financialReadiness: 73,
      financialAdvisor: "David Park",
      advisorTitle: "Senior Account Manager",
      tags: ["Premier"],
      fraudRiskScore: 14,
      priorDisputeCount: 2,
      cardBlocked: false,
    },
    conversationTopics: [
      "Resolve security alert issue",
      "Review account status",
      "Confirm resolution and next steps",
    ],
    contact: {
      email: "aisha.kamara@kamaraventures.com",
      phone: "(246) 555-3014",
      address: { street: "100 E Wisconsin Ave", city: "Milwaukee", state: "WI", zip: "53202", country: "US" },
    },
    accounts: [
      { id: "aisha_kamara-chk", type: "Checking", number: "***2406", balance: "$74,058.00",
          availableBalance: "$74,058.00", status: "active", openedDate: "Jul 2023" },
      { id: "aisha_kamara-sav", type: "Savings", number: "***4014", balance: "$208,574.00", status: "active", openedDate: "Aug 2023" },
    ],
    overview: {
      contactNumber: "(246) 555-3014",
      assignedAgent: "David Park",
      pronoun: "she",
      lastContactTime: "Today, 9:05 AM",
      address: "100 E Wisconsin Ave, Milwaukee, WI 53202",
    },
    interactionTimeline: [
      {
        id: "aisha_kamara-case-opened",
        title: "Case opened — Security Alert",
        timestamp: "Today · 9:00 AM",
        detail: "Aisha Kamara contacted support regarding: Bot sent my sensitive documents to the wrong recipient.",
        tone: "warning",
        sortOrder: 1,
      },
      {
        id: "aisha_kamara-bot-review",
        title: "Virtual agent reviewed case",
        timestamp: "Today · 9:02 AM",
        detail: "AI assistant reviewed the case details and initiated security alert resolution workflow.",
        tone: "info",
        sortOrder: 2,
      },
      {
        id: "aisha_kamara-escalated",
        title: "Escalated to human agent",
        timestamp: "Today · 9:05 AM",
        detail: "Case escalated to human agent due to complexity of security alert issue requiring manual intervention.",
        tone: "critical",
        sortOrder: 3,
      },
    ],
    customerHistory: [
      {
        id: "aisha_kamara-h1",
        title: "Security Alert case opened",
        timestamp: "Today · 9:00 AM",
        detail: "New security alert case opened for Aisha Kamara at Kamara Ventures.",
        dot: "orange",
      },
      {
        id: "aisha_kamara-h2",
        title: "Account verified",
        timestamp: "Mar 5, 2026 · 2:00 PM",
        detail: "Identity and account details verified for Aisha Kamara.",
        dot: "gray",
      },
      {
        id: "aisha_kamara-h3",
        title: "Account created",
        timestamp: "Sep 2022, 2022 · 10:00 AM",
        detail: "Aisha Kamara joined Kamara Ventures. Account created and onboarding completed.",
        dot: "green",
      },
    ],
    queue: {
      time: "5m",
      preview: "Bot sent my sensitive documents to the wrong recipient",
      priority: "Critical",
      priorityClassName: "border-[#E53935] bg-[#FDEAEA] text-[#C71D1A]",
      badgeColor: "bg-[#E32926]",
      icon: "phone",
      isActive: false,
      createdAt: "2026-04-27T09:00:00",
      updatedAt: "2026-04-27T09:05:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 9:00 AM",
        draft: "I've reviewed your security alert case, Aisha. Here's what I can see and the steps I'm taking to resolve this for you right now.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hi, I'm reaching out about: Bot sent my sensitive documents to the wrong recipient. Can you help?",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Aisha, I've reviewed your case regarding security alert. Let me look into this for you.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "I appreciate that — this has been an ongoing issue and I need it resolved today.",
            time: "9:04 AM",
          }
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 9:00 AM",
        draft: "Hi Aisha — I've looked into your case. I'm working on a resolution and will update you shortly.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Need help — bot sent my sensitive documents to the wrong recipient.",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Aisha — I can see your case. Reviewing details now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thanks. Please let me know as soon as you have an update.",
            time: "9:04 AM",
          }
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 9:00 AM",
        draft: "Hi Aisha — I've reviewed your case. I have what I need to help you resolve this security alert issue.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hello, I need help with a security alert issue — bot sent my sensitive documents to the wrong recipient",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Aisha! I can see your case details. I'm reviewing everything now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Great — please update me here when you have news.",
            time: "9:04 AM",
          }
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 9:00 AM",
        draft: "Hi Aisha — thank you for your patience. I've reviewed your security alert case in detail and I'm ready to walk you through the next steps.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Subject: Security Alert - Urgent Assistance Needed\n\nHello,\n\nI need assistance with the following: Bot sent my sensitive documents to the wrong recipient. Please respond as soon as possible.\n\nThank you,\nAisha Kamara",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Aisha,\n\nThank you for reaching out. I've reviewed your case and I'm working on resolving your security alert issue. I'll have an update for you shortly.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thank you for the quick response. Please prioritise this — it's time-sensitive.",
            time: "9:04 AM",
          }
        ],
      },
    },
    customerSnapshot: [
      "2-year customer with $350K in accounts",
      "West African heritage; entrepreneurial spirit",
      "No prior disputes; strong financial discipline",
      "Building family wealth; multi-generational focus",
      "Values financial education and empowerment",
    ],
  },
  {
    id: "sarah_collins",
    initials: "SC",
    name: "Sarah Collins",
    customerId: "CST-20101",
    lastUpdated: "04/27/26 | 09:00 AM",
    profile: {
      department: "Healthcare Services",
      tenureYears: 2,
      totalAUM: "$1,526,343.00",
      financialReadiness: 84,
      financialAdvisor: "Emma Wilson",
      advisorTitle: "Senior Account Manager",
      tags: ["Standard"],
      fraudRiskScore: 27,
      priorDisputeCount: 0,
      cardBlocked: false,
    },
    conversationTopics: [
      "Resolve account locked issue",
      "Review account status",
      "Confirm resolution and next steps",
    ],
    contact: {
      email: "sarah.collins@summithealthcare.com",
      phone: "(263) 555-3067",
      address: { street: "660 Market St", city: "San Francisco", state: "CA", zip: "94104", country: "US" },
    },
    accounts: [
      { id: "sarah_collins-chk", type: "Business", number: "***2443", balance: "$79,243.00",
          availableBalance: "$79,243.00", status: "active", openedDate: "Oct 2024" },
      { id: "sarah_collins-sav", type: "Savings", number: "***4067", balance: "$212,747.00", status: "active", openedDate: "Nov 2024" },
    ],
    overview: {
      contactNumber: "(263) 555-3067",
      assignedAgent: "Emma Wilson",
      pronoun: "she",
      lastContactTime: "Today, 9:05 AM",
      address: "660 Market St, San Francisco, CA 94104",
    },
    interactionTimeline: [
      {
        id: "sarah_collins-case-opened",
        title: "Case opened — Account Locked",
        timestamp: "Today · 9:00 AM",
        detail: "Sarah Collins contacted support regarding: Patient portal access issue — urgent appointment needed.",
        tone: "warning",
        sortOrder: 1,
      },
      {
        id: "sarah_collins-bot-review",
        title: "Virtual agent reviewed case",
        timestamp: "Today · 9:02 AM",
        detail: "AI assistant reviewed the case details and initiated account locked resolution workflow.",
        tone: "info",
        sortOrder: 2,
      },
      {
        id: "sarah_collins-escalated",
        title: "Escalated to human agent",
        timestamp: "Today · 9:05 AM",
        detail: "Case escalated to human agent due to complexity of account locked issue requiring manual intervention.",
        tone: "warning",
        sortOrder: 3,
      },
    ],
    customerHistory: [
      {
        id: "sarah_collins-h1",
        title: "Account Locked case opened",
        timestamp: "Today · 9:00 AM",
        detail: "New account locked case opened for Sarah Collins at Summit Healthcare Inc..",
        dot: "orange",
      },
      {
        id: "sarah_collins-h2",
        title: "Account verified",
        timestamp: "Feb 10, 2026 · 2:00 PM",
        detail: "Identity and account details verified for Sarah Collins.",
        dot: "gray",
      },
      {
        id: "sarah_collins-h3",
        title: "Account created",
        timestamp: "Dec 2023, 2023 · 10:00 AM",
        detail: "Sarah Collins joined Summit Healthcare Inc.. Account created and onboarding completed.",
        dot: "green",
      },
    ],
    queue: {
      time: "10m",
      preview: "Patient portal access issue — urgent appointment needed",
      priority: "High",
      priorityClassName: "border-[#FFB800] bg-[#FFF6E0] text-[#A37A00]",
      badgeColor: "bg-[#166CCA]",
      icon: "messageSquare",
      isActive: false,
      createdAt: "2026-04-27T09:00:00",
      updatedAt: "2026-04-27T09:05:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 9:00 AM",
        draft: "I've reviewed your account locked case, Sarah. Here's what I can see and the steps I'm taking to resolve this for you right now.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hi, I'm reaching out about: Patient portal access issue — urgent appointment needed. Can you help?",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Sarah, I've reviewed your case regarding account locked. Let me look into this for you.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "I appreciate that — this has been an ongoing issue and I need it resolved today.",
            time: "9:04 AM",
          }
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 9:00 AM",
        draft: "Hi Sarah — I've looked into your case. I'm working on a resolution and will update you shortly.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Need help — patient portal access issue — urgent appointment needed.",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Sarah — I can see your case. Reviewing details now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thanks. Please let me know as soon as you have an update.",
            time: "9:04 AM",
          }
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 9:00 AM",
        draft: "Hi Sarah — I've reviewed your case. I have what I need to help you resolve this account locked issue.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hello, I need help with a account locked issue — patient portal access issue — urgent appointment needed",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Sarah! I can see your case details. I'm reviewing everything now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Great — please update me here when you have news.",
            time: "9:04 AM",
          }
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 9:00 AM",
        draft: "Hi Sarah — thank you for your patience. I've reviewed your account locked case in detail and I'm ready to walk you through the next steps.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Subject: Account Locked - Urgent Assistance Needed\n\nHello,\n\nI need assistance with the following: Patient portal access issue — urgent appointment needed. Please respond as soon as possible.\n\nThank you,\nSarah Collins",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Sarah,\n\nThank you for reaching out. I've reviewed your case and I'm working on resolving your account locked issue. I'll have an update for you shortly.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thank you for the quick response. Please prioritise this — it's time-sensitive.",
            time: "9:04 AM",
          }
        ],
      },
    },
    customerSnapshot: [
      "7-year veteran customer with $1M+ portfolio",
      "Business Banking Premier relationship",
      "Zero prior disputes; exemplary standing",
      "Expects executive-level service and access",
      "Strategic advisor; long-term partnership",
    ],
  },
  {
    id: "james_okafor",
    initials: "JO",
    name: "James Okafor",
    customerId: "CST-20202",
    lastUpdated: "04/27/26 | 09:00 AM",
    profile: {
      department: "Business Banking",
      tenureYears: 1,
      totalAUM: "$1,615,480.00",
      financialReadiness: 40,
      financialAdvisor: "Jeff Comstock",
      advisorTitle: "Senior Account Manager",
      tags: ["Premier"],
      fraudRiskScore: 40,
      priorDisputeCount: 1,
      cardBlocked: false,
    },
    conversationTopics: [
      "Resolve billing dispute issue",
      "Review account status",
      "Confirm resolution and next steps",
    ],
    contact: {
      email: "james.okafor@bluelinelogistics.com",
      phone: "(280) 555-3120",
      address: { street: "500 Capital Mall Dr", city: "Sacramento", state: "CA", zip: "95814", country: "US" },
    },
    accounts: [
      { id: "james_okafor-chk", type: "Checking", number: "***2480", balance: "$81,640.00",
          availableBalance: "$81,640.00", status: "active", openedDate: "Jan 2020" },
      { id: "james_okafor-sav", type: "Savings", number: "***4120", balance: "$216,920.00", status: "active", openedDate: "Feb 2020" },
    ],
    overview: {
      contactNumber: "(280) 555-3120",
      assignedAgent: "Jeff Comstock",
      pronoun: "he",
      lastContactTime: "Today, 9:05 AM",
      address: "500 Capital Mall Dr, Sacramento, CA 95814",
    },
    interactionTimeline: [
      {
        id: "james_okafor-case-opened",
        title: "Case opened — Billing Dispute",
        timestamp: "Today · 9:00 AM",
        detail: "James Okafor contacted support regarding: Overcharged on last three invoices — requesting immediate refund.",
        tone: "warning",
        sortOrder: 1,
      },
      {
        id: "james_okafor-bot-review",
        title: "Virtual agent reviewed case",
        timestamp: "Today · 9:02 AM",
        detail: "AI assistant reviewed the case details and initiated billing dispute resolution workflow.",
        tone: "info",
        sortOrder: 2,
      },
      {
        id: "james_okafor-escalated",
        title: "Escalated to human agent",
        timestamp: "Today · 9:05 AM",
        detail: "Case escalated to human agent due to complexity of billing dispute issue requiring manual intervention.",
        tone: "critical",
        sortOrder: 3,
      },
    ],
    customerHistory: [
      {
        id: "james_okafor-h1",
        title: "Billing Dispute case opened",
        timestamp: "Today · 9:00 AM",
        detail: "New billing dispute case opened for James Okafor at BlueLine Logistics.",
        dot: "orange",
      },
      {
        id: "james_okafor-h2",
        title: "Account verified",
        timestamp: "Jan 22, 2026 · 2:00 PM",
        detail: "Identity and account details verified for James Okafor.",
        dot: "gray",
      },
      {
        id: "james_okafor-h3",
        title: "Account created",
        timestamp: "Mar 2019, 2020 · 10:00 AM",
        detail: "James Okafor joined BlueLine Logistics. Account created and onboarding completed.",
        dot: "green",
      },
    ],
    queue: {
      time: "2m",
      preview: "Overcharged on last three invoices — requesting immediate refund",
      priority: "Critical",
      priorityClassName: "border-[#E53935] bg-[#FDEAEA] text-[#C71D1A]",
      badgeColor: "bg-[#E32926]",
      icon: "phone",
      isActive: false,
      createdAt: "2026-04-27T09:00:00",
      updatedAt: "2026-04-27T09:05:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 9:00 AM",
        draft: "I've reviewed your billing dispute case, James. Here's what I can see and the steps I'm taking to resolve this for you right now.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hi, I'm reaching out about: Overcharged on last three invoices — requesting immediate refund. Can you help?",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi James, I've reviewed your case regarding billing dispute. Let me look into this for you.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "I appreciate that — this has been an ongoing issue and I need it resolved today.",
            time: "9:04 AM",
          }
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 9:00 AM",
        draft: "Hi James — I've looked into your case. I'm working on a resolution and will update you shortly.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Need help — overcharged on last three invoices — requesting immediate refund.",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi James — I can see your case. Reviewing details now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thanks. Please let me know as soon as you have an update.",
            time: "9:04 AM",
          }
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 9:00 AM",
        draft: "Hi James — I've reviewed your case. I have what I need to help you resolve this billing dispute issue.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hello, I need help with a billing dispute issue — overcharged on last three invoices — requesting immediate refund",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi James! I can see your case details. I'm reviewing everything now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Great — please update me here when you have news.",
            time: "9:04 AM",
          }
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 9:00 AM",
        draft: "Hi James — thank you for your patience. I've reviewed your billing dispute case in detail and I'm ready to walk you through the next steps.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Subject: Billing Dispute - Urgent Assistance Needed\n\nHello,\n\nI need assistance with the following: Overcharged on last three invoices — requesting immediate refund. Please respond as soon as possible.\n\nThank you,\nJames Okafor",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi James,\n\nThank you for reaching out. I've reviewed your case and I'm working on resolving your billing dispute issue. I'll have an update for you shortly.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thank you for the quick response. Please prioritise this — it's time-sensitive.",
            time: "9:04 AM",
          }
        ],
      },
    },
    customerSnapshot: [
      "4-year customer with $620K in accounts",
      "Nigerian-American; diverse portfolio holdings",
      "No prior disputes; excellent standing",
      "Family-oriented; includes children in planning",
      "Interested in education savings and legacy planning",
    ],
  },
  {
    id: "priya_nair",
    initials: "PN",
    name: "Priya Nair",
    customerId: "CST-20303",
    lastUpdated: "04/27/26 | 09:00 AM",
    profile: {
      department: "Commercial Real Estate",
      tenureYears: 8,
      totalAUM: "$1,704,617.00",
      financialReadiness: 51,
      financialAdvisor: "Marcus Lee",
      advisorTitle: "Senior Account Manager",
      tags: ["Standard"],
      fraudRiskScore: 53,
      priorDisputeCount: 2,
      cardBlocked: false,
    },
    conversationTopics: [
      "Resolve general inquiry issue",
      "Review account status",
      "Confirm resolution and next steps",
    ],
    contact: {
      email: "priya.nair@coastalrealty.com",
      phone: "(297) 555-3173",
      address: { street: "1200 N Meridian St", city: "Indianapolis", state: "IN", zip: "46204", country: "US" },
    },
    accounts: [
      { id: "priya_nair-chk", type: "Checking", number: "***2517", balance: "$85,431.00",
          availableBalance: "$85,431.00", status: "active", openedDate: "Apr 2021" },
      { id: "priya_nair-sav", type: "Savings", number: "***4173", balance: "$221,093.00", status: "active", openedDate: "May 2021" },
    ],
    overview: {
      contactNumber: "(297) 555-3173",
      assignedAgent: "Marcus Lee",
      pronoun: "she",
      lastContactTime: "Today, 9:05 AM",
      address: "1200 N Meridian St, Indianapolis, IN 46204",
    },
    interactionTimeline: [
      {
        id: "priya_nair-case-opened",
        title: "Case opened — General Inquiry",
        timestamp: "Today · 9:00 AM",
        detail: "Priya Nair contacted support regarding: Requesting account ownership transfer following company acquisition.",
        tone: "default",
        sortOrder: 1,
      },
      {
        id: "priya_nair-bot-review",
        title: "Virtual agent reviewed case",
        timestamp: "Today · 9:02 AM",
        detail: "AI assistant reviewed the case details and initiated general inquiry resolution workflow.",
        tone: "info",
        sortOrder: 2,
      },
      {
        id: "priya_nair-escalated",
        title: "Escalated to human agent",
        timestamp: "Today · 9:05 AM",
        detail: "Case escalated to human agent due to complexity of general inquiry issue requiring manual intervention.",
        tone: "warning",
        sortOrder: 3,
      },
    ],
    customerHistory: [
      {
        id: "priya_nair-h1",
        title: "General Inquiry case opened",
        timestamp: "Today · 9:00 AM",
        detail: "New general inquiry case opened for Priya Nair at Coastal Realty Partners.",
        dot: "orange",
      },
      {
        id: "priya_nair-h2",
        title: "Account verified",
        timestamp: "Mar 5, 2026 · 2:00 PM",
        detail: "Identity and account details verified for Priya Nair.",
        dot: "gray",
      },
      {
        id: "priya_nair-h3",
        title: "Account created",
        timestamp: "Jun 2020, 2021 · 10:00 AM",
        detail: "Priya Nair joined Coastal Realty Partners. Account created and onboarding completed.",
        dot: "green",
      },
    ],
    queue: {
      time: "30m",
      preview: "Requesting account ownership transfer following company acquisition",
      priority: "Medium",
      priorityClassName: "border-[#0288D1] bg-[#E3F4FD] text-[#0277BD]",
      badgeColor: "bg-[#0288D1]",
      icon: "messageSquare",
      isActive: false,
      createdAt: "2026-04-27T09:00:00",
      updatedAt: "2026-04-27T09:05:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 9:00 AM",
        draft: "I've reviewed your general inquiry case, Priya. Here's what I can see and the steps I'm taking to resolve this for you right now.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hi, I'm reaching out about: Requesting account ownership transfer following company acquisition. Can you help?",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Priya, I've reviewed your case regarding general inquiry. Let me look into this for you.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "I appreciate that — this has been an ongoing issue and I need it resolved today.",
            time: "9:04 AM",
          }
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 9:00 AM",
        draft: "Hi Priya — I've looked into your case. I'm working on a resolution and will update you shortly.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Need help — requesting account ownership transfer following company acquisition.",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Priya — I can see your case. Reviewing details now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thanks. Please let me know as soon as you have an update.",
            time: "9:04 AM",
          }
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 9:00 AM",
        draft: "Hi Priya — I've reviewed your case. I have what I need to help you resolve this general inquiry issue.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hello, I need help with a general inquiry issue — requesting account ownership transfer following company acquisition",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Priya! I can see your case details. I'm reviewing everything now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Great — please update me here when you have news.",
            time: "9:04 AM",
          }
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 9:00 AM",
        draft: "Hi Priya — thank you for your patience. I've reviewed your general inquiry case in detail and I'm ready to walk you through the next steps.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Subject: General Inquiry - Urgent Assistance Needed\n\nHello,\n\nI need assistance with the following: Requesting account ownership transfer following company acquisition. Please respond as soon as possible.\n\nThank you,\nPriya Nair",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Priya,\n\nThank you for reaching out. I've reviewed your case and I'm working on resolving your general inquiry issue. I'll have an update for you shortly.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thank you for the quick response. Please prioritise this — it's time-sensitive.",
            time: "9:04 AM",
          }
        ],
      },
    },
    customerSnapshot: [
      "3-year customer with $500K portfolio",
      "Indian-American; strong financial discipline",
      "Zero disputes; high credit score",
      "Technology-comfortable; uses all digital tools",
      "Values wealth preservation and steady growth",
    ],
  },
  {
    id: "marcus_webb_2",
    initials: "MW",
    name: "Marcus Webb",
    customerId: "CST-20404",
    lastUpdated: "04/27/26 | 09:00 AM",
    profile: {
      department: "Technology Accounts",
      tenureYears: 7,
      totalAUM: "$1,793,754.00",
      financialReadiness: 62,
      financialAdvisor: "Sarah Chen",
      advisorTitle: "Senior Account Manager",
      tags: ["Premier"],
      fraudRiskScore: 66,
      priorDisputeCount: 0,
      cardBlocked: false,
    },
    conversationTopics: [
      "Resolve service outage issue",
      "Review account status",
      "Confirm resolution and next steps",
    ],
    contact: {
      email: "marcus.webb@vertexsystems.com",
      phone: "(314) 555-3226",
      address: { street: "400 Convention Blvd", city: "Raleigh", state: "NC", zip: "27601", country: "US" },
    },
    accounts: [
      { id: "marcus_webb_2-chk", type: "Checking", number: "***2554", balance: "$89,222.00",
          availableBalance: "$89,222.00", status: "active", openedDate: "Jul 2022" },
      { id: "marcus_webb_2-sav", type: "Savings", number: "***4226", balance: "$225,266.00", status: "active", openedDate: "Aug 2022" },
    ],
    overview: {
      contactNumber: "(314) 555-3226",
      assignedAgent: "Sarah Chen",
      pronoun: "he",
      lastContactTime: "Today, 9:05 AM",
      address: "400 Convention Blvd, Raleigh, NC 27601",
    },
    interactionTimeline: [
      {
        id: "marcus_webb_2-case-opened",
        title: "Case opened — Service Outage",
        timestamp: "Today · 9:00 AM",
        detail: "Marcus Webb contacted support regarding: Production API down — critical integration failure.",
        tone: "warning",
        sortOrder: 1,
      },
      {
        id: "marcus_webb_2-bot-review",
        title: "Virtual agent reviewed case",
        timestamp: "Today · 9:02 AM",
        detail: "AI assistant reviewed the case details and initiated service outage resolution workflow.",
        tone: "info",
        sortOrder: 2,
      },
      {
        id: "marcus_webb_2-escalated",
        title: "Escalated to human agent",
        timestamp: "Today · 9:05 AM",
        detail: "Case escalated to human agent due to complexity of service outage issue requiring manual intervention.",
        tone: "warning",
        sortOrder: 3,
      },
    ],
    customerHistory: [
      {
        id: "marcus_webb_2-h1",
        title: "Service Outage case opened",
        timestamp: "Today · 9:00 AM",
        detail: "New service outage case opened for Marcus Webb at Vertex Systems.",
        dot: "orange",
      },
      {
        id: "marcus_webb_2-h2",
        title: "Account verified",
        timestamp: "Feb 10, 2026 · 2:00 PM",
        detail: "Identity and account details verified for Marcus Webb.",
        dot: "gray",
      },
      {
        id: "marcus_webb_2-h3",
        title: "Account created",
        timestamp: "Sep 2021, 2022 · 10:00 AM",
        detail: "Marcus Webb joined Vertex Systems. Account created and onboarding completed.",
        dot: "green",
      },
    ],
    queue: {
      time: "15m",
      preview: "Production API down — critical integration failure",
      priority: "High",
      priorityClassName: "border-[#FFB800] bg-[#FFF6E0] text-[#A37A00]",
      badgeColor: "bg-[#166CCA]",
      icon: "phone",
      isActive: false,
      createdAt: "2026-04-27T09:00:00",
      updatedAt: "2026-04-27T09:05:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 9:00 AM",
        draft: "I've reviewed your service outage case, Marcus. Here's what I can see and the steps I'm taking to resolve this for you right now.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hi, I'm reaching out about: Production API down — critical integration failure. Can you help?",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Marcus, I've reviewed your case regarding service outage. Let me look into this for you.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "I appreciate that — this has been an ongoing issue and I need it resolved today.",
            time: "9:04 AM",
          }
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 9:00 AM",
        draft: "Hi Marcus — I've looked into your case. I'm working on a resolution and will update you shortly.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Need help — production api down — critical integration failure.",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Marcus — I can see your case. Reviewing details now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thanks. Please let me know as soon as you have an update.",
            time: "9:04 AM",
          }
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 9:00 AM",
        draft: "Hi Marcus — I've reviewed your case. I have what I need to help you resolve this service outage issue.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hello, I need help with a service outage issue — production api down — critical integration failure",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Marcus! I can see your case details. I'm reviewing everything now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Great — please update me here when you have news.",
            time: "9:04 AM",
          }
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 9:00 AM",
        draft: "Hi Marcus — thank you for your patience. I've reviewed your service outage case in detail and I'm ready to walk you through the next steps.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Subject: Service Outage - Urgent Assistance Needed\n\nHello,\n\nI need assistance with the following: Production API down — critical integration failure. Please respond as soon as possible.\n\nThank you,\nMarcus Webb",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Marcus,\n\nThank you for reaching out. I've reviewed your case and I'm working on resolving your service outage issue. I'll have an update for you shortly.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thank you for the quick response. Please prioritise this — it's time-sensitive.",
            time: "9:04 AM",
          }
        ],
      },
    },
    customerSnapshot: [
      "7-year customer with $1.79M+ in combined accounts",
      "Technology Accounts Premier customer with business focus",
      "Zero prior disputes; low-to-moderate fraud risk",
      "Experiences critical operational emergencies; time-sensitive",
      "Technical background; appreciates quick decisive action",
    ],
  },
  {
    id: "lena_fischer",
    initials: "LF",
    name: "Lena Fischer",
    customerId: "CST-20505",
    lastUpdated: "04/27/26 | 09:00 AM",
    profile: {
      department: "Legal Services",
      tenureYears: 6,
      totalAUM: "$1,882,891.00",
      financialReadiness: 73,
      financialAdvisor: "David Park",
      advisorTitle: "Senior Account Manager",
      tags: ["Standard"],
      fraudRiskScore: 79,
      priorDisputeCount: 1,
      cardBlocked: false,
    },
    conversationTopics: [
      "Resolve security alert issue",
      "Review account status",
      "Confirm resolution and next steps",
    ],
    contact: {
      email: "lena.fischer@beaumonlegal.com",
      phone: "(331) 555-3279",
      address: { street: "750 E Pratt St", city: "Baltimore", state: "MD", zip: "21202", country: "US" },
    },
    accounts: [
      { id: "lena_fischer-chk", type: "Business", number: "***2591", balance: "$100,191.00",
          availableBalance: "$100,191.00", status: "active", openedDate: "Oct 2023" },
      { id: "lena_fischer-sav", type: "Savings", number: "***4279", balance: "$229,439.00", status: "active", openedDate: "Nov 2023" },
    ],
    overview: {
      contactNumber: "(331) 555-3279",
      assignedAgent: "David Park",
      pronoun: "she",
      lastContactTime: "Today, 9:05 AM",
      address: "750 E Pratt St, Baltimore, MD 21202",
    },
    interactionTimeline: [
      {
        id: "lena_fischer-case-opened",
        title: "Case opened — Security Alert",
        timestamp: "Today · 9:00 AM",
        detail: "Lena Fischer contacted support regarding: Suspicious login activity detected — possible credential compromise.",
        tone: "warning",
        sortOrder: 1,
      },
      {
        id: "lena_fischer-bot-review",
        title: "Virtual agent reviewed case",
        timestamp: "Today · 9:02 AM",
        detail: "AI assistant reviewed the case details and initiated security alert resolution workflow.",
        tone: "info",
        sortOrder: 2,
      },
      {
        id: "lena_fischer-escalated",
        title: "Escalated to human agent",
        timestamp: "Today · 9:05 AM",
        detail: "Case escalated to human agent due to complexity of security alert issue requiring manual intervention.",
        tone: "critical",
        sortOrder: 3,
      },
    ],
    customerHistory: [
      {
        id: "lena_fischer-h1",
        title: "Security Alert case opened",
        timestamp: "Today · 9:00 AM",
        detail: "New security alert case opened for Lena Fischer at Beaumont Legal Group.",
        dot: "orange",
      },
      {
        id: "lena_fischer-h2",
        title: "Account verified",
        timestamp: "Jan 22, 2026 · 2:00 PM",
        detail: "Identity and account details verified for Lena Fischer.",
        dot: "gray",
      },
      {
        id: "lena_fischer-h3",
        title: "Account created",
        timestamp: "Dec 2022, 2023 · 10:00 AM",
        detail: "Lena Fischer joined Beaumont Legal Group. Account created and onboarding completed.",
        dot: "green",
      },
    ],
    queue: {
      time: "1m",
      preview: "Suspicious login activity detected — possible credential compromise",
      priority: "Critical",
      priorityClassName: "border-[#E53935] bg-[#FDEAEA] text-[#C71D1A]",
      badgeColor: "bg-[#E32926]",
      icon: "phone",
      isActive: false,
      createdAt: "2026-04-27T09:00:00",
      updatedAt: "2026-04-27T09:05:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 9:00 AM",
        draft: "I've reviewed your security alert case, Lena. Here's what I can see and the steps I'm taking to resolve this for you right now.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hi, I'm reaching out about: Suspicious login activity detected — possible credential compromise. Can you help?",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Lena, I've reviewed your case regarding security alert. Let me look into this for you.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "I appreciate that — this has been an ongoing issue and I need it resolved today.",
            time: "9:04 AM",
          }
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 9:00 AM",
        draft: "Hi Lena — I've looked into your case. I'm working on a resolution and will update you shortly.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Need help — suspicious login activity detected — possible credential compromise.",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Lena — I can see your case. Reviewing details now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thanks. Please let me know as soon as you have an update.",
            time: "9:04 AM",
          }
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 9:00 AM",
        draft: "Hi Lena — I've reviewed your case. I have what I need to help you resolve this security alert issue.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hello, I need help with a security alert issue — suspicious login activity detected — possible credential compromise",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Lena! I can see your case details. I'm reviewing everything now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Great — please update me here when you have news.",
            time: "9:04 AM",
          }
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 9:00 AM",
        draft: "Hi Lena — thank you for your patience. I've reviewed your security alert case in detail and I'm ready to walk you through the next steps.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Subject: Security Alert - Urgent Assistance Needed\n\nHello,\n\nI need assistance with the following: Suspicious login activity detected — possible credential compromise. Please respond as soon as possible.\n\nThank you,\nLena Fischer",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Lena,\n\nThank you for reaching out. I've reviewed your case and I'm working on resolving your security alert issue. I'll have an update for you shortly.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thank you for the quick response. Please prioritise this — it's time-sensitive.",
            time: "9:04 AM",
          }
        ],
      },
    },
    customerSnapshot: [
      "5-year customer with $800K+ in holdings",
      "German background; precision and accuracy required",
      "No prior disputes; meticulous account management",
      "Expects perfection in all interactions",
      "Detailed record-keeper; wants full transparency",
    ],
  },
  {
    id: "david_mensah",
    initials: "DM",
    name: "David Mensah",
    customerId: "CST-20606",
    lastUpdated: "04/27/26 | 09:00 AM",
    profile: {
      department: "International Business",
      tenureYears: 5,
      totalAUM: "$1,972,028.00",
      financialReadiness: 84,
      financialAdvisor: "Emma Wilson",
      advisorTitle: "Senior Account Manager",
      tags: ["Premier"],
      fraudRiskScore: 22,
      priorDisputeCount: 2,
      cardBlocked: false,
    },
    conversationTopics: [
      "Resolve payment issue issue",
      "Review account status",
      "Confirm resolution and next steps",
    ],
    contact: {
      email: "david.mensah@svenssongroup.com",
      phone: "(348) 555-3332",
      address: { street: "1300 Post Oak Blvd", city: "Houston", state: "TX", zip: "77056", country: "US" },
    },
    accounts: [
      { id: "david_mensah-chk", type: "Business", number: "***2628", balance: "$105,428.00",
          availableBalance: "$105,428.00", status: "active", openedDate: "Jan 2024" },
      { id: "david_mensah-sav", type: "Savings", number: "***4332", balance: "$233,612.00", status: "active", openedDate: "Feb 2024" },
    ],
    overview: {
      contactNumber: "(348) 555-3332",
      assignedAgent: "Emma Wilson",
      pronoun: "he",
      lastContactTime: "Today, 9:05 AM",
      address: "1300 Post Oak Blvd, Houston, TX 77056",
    },
    interactionTimeline: [
      {
        id: "david_mensah-case-opened",
        title: "Case opened — Payment Issue",
        timestamp: "Today · 9:00 AM",
        detail: "David Mensah contacted support regarding: International wire transfer blocked — compliance hold.",
        tone: "warning",
        sortOrder: 1,
      },
      {
        id: "david_mensah-bot-review",
        title: "Virtual agent reviewed case",
        timestamp: "Today · 9:02 AM",
        detail: "AI assistant reviewed the case details and initiated payment issue resolution workflow.",
        tone: "info",
        sortOrder: 2,
      },
      {
        id: "david_mensah-escalated",
        title: "Escalated to human agent",
        timestamp: "Today · 9:05 AM",
        detail: "Case escalated to human agent due to complexity of payment issue issue requiring manual intervention.",
        tone: "warning",
        sortOrder: 3,
      },
    ],
    customerHistory: [
      {
        id: "david_mensah-h1",
        title: "Payment Issue case opened",
        timestamp: "Today · 9:00 AM",
        detail: "New payment issue case opened for David Mensah at Svensson Group AB.",
        dot: "orange",
      },
      {
        id: "david_mensah-h2",
        title: "Account verified",
        timestamp: "Mar 5, 2026 · 2:00 PM",
        detail: "Identity and account details verified for David Mensah.",
        dot: "gray",
      },
      {
        id: "david_mensah-h3",
        title: "Account created",
        timestamp: "Mar 2023, 2020 · 10:00 AM",
        detail: "David Mensah joined Svensson Group AB. Account created and onboarding completed.",
        dot: "green",
      },
    ],
    queue: {
      time: "8m",
      preview: "International wire transfer blocked — compliance hold",
      priority: "High",
      priorityClassName: "border-[#FFB800] bg-[#FFF6E0] text-[#A37A00]",
      badgeColor: "bg-[#166CCA]",
      icon: "messageSquare",
      isActive: false,
      createdAt: "2026-04-27T09:00:00",
      updatedAt: "2026-04-27T09:05:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 9:00 AM",
        draft: "I've reviewed your payment issue case, David. Here's what I can see and the steps I'm taking to resolve this for you right now.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hi, I'm reaching out about: International wire transfer blocked — compliance hold. Can you help?",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi David, I've reviewed your case regarding payment issue. Let me look into this for you.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "I appreciate that — this has been an ongoing issue and I need it resolved today.",
            time: "9:04 AM",
          }
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 9:00 AM",
        draft: "Hi David — I've looked into your case. I'm working on a resolution and will update you shortly.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Need help — international wire transfer blocked — compliance hold.",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi David — I can see your case. Reviewing details now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thanks. Please let me know as soon as you have an update.",
            time: "9:04 AM",
          }
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 9:00 AM",
        draft: "Hi David — I've reviewed your case. I have what I need to help you resolve this payment issue issue.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hello, I need help with a payment issue issue — international wire transfer blocked — compliance hold",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi David! I can see your case details. I'm reviewing everything now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Great — please update me here when you have news.",
            time: "9:04 AM",
          }
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 9:00 AM",
        draft: "Hi David — thank you for your patience. I've reviewed your payment issue case in detail and I'm ready to walk you through the next steps.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Subject: Payment Issue - Urgent Assistance Needed\n\nHello,\n\nI need assistance with the following: International wire transfer blocked — compliance hold. Please respond as soon as possible.\n\nThank you,\nDavid Mensah",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi David,\n\nThank you for reaching out. I've reviewed your case and I'm working on resolving your payment issue issue. I'll have an update for you shortly.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thank you for the quick response. Please prioritise this — it's time-sensitive.",
            time: "9:04 AM",
          }
        ],
      },
    },
    customerSnapshot: [
      "3-year customer with $480K portfolio",
      "Ghanaian heritage; building American wealth",
      "Zero disputes; reliable payer",
      "Community-minded; gives back regularly",
      "Values personal connections and trust",
    ],
  },
  {
    id: "amara_diallo",
    initials: "AD",
    name: "Amara Diallo",
    customerId: "CST-20707",
    lastUpdated: "04/27/26 | 09:00 AM",
    profile: {
      department: "Retail Banking",
      tenureYears: 4,
      totalAUM: "$61,165.00",
      financialReadiness: 40,
      financialAdvisor: "Jeff Comstock",
      advisorTitle: "Senior Account Manager",
      tags: ["Standard"],
      fraudRiskScore: 35,
      priorDisputeCount: 0,
      cardBlocked: false,
    },
    conversationTopics: [
      "Resolve subscription upgrade issue",
      "Review account status",
      "Confirm resolution and next steps",
    ],
    contact: {
      email: "amara.diallo@greenleafretail.com",
      phone: "(365) 555-3385",
      address: { street: "230 N Michigan Ave", city: "Chicago", state: "IL", zip: "60601", country: "US" },
    },
    accounts: [
      { id: "amara_diallo-chk", type: "Checking", number: "***2665", balance: "$15,595.00",
          availableBalance: "$15,595.00", status: "active", openedDate: "Apr 2020" },
      { id: "amara_diallo-sav", type: "Savings", number: "***4385", balance: "$237,785.00", status: "active", openedDate: "May 2020" },
    ],
    overview: {
      contactNumber: "(365) 555-3385",
      assignedAgent: "Jeff Comstock",
      pronoun: "she",
      lastContactTime: "Today, 9:05 AM",
      address: "230 N Michigan Ave, Chicago, IL 60601",
    },
    interactionTimeline: [
      {
        id: "amara_diallo-case-opened",
        title: "Case opened — Subscription Upgrade",
        timestamp: "Today · 9:00 AM",
        detail: "Amara Diallo contacted support regarding: Enterprise plan upgrade — needs custom pricing and contract terms.",
        tone: "default",
        sortOrder: 1,
      },
      {
        id: "amara_diallo-bot-review",
        title: "Virtual agent reviewed case",
        timestamp: "Today · 9:02 AM",
        detail: "AI assistant reviewed the case details and initiated subscription upgrade resolution workflow.",
        tone: "info",
        sortOrder: 2,
      },
      {
        id: "amara_diallo-escalated",
        title: "Escalated to human agent",
        timestamp: "Today · 9:05 AM",
        detail: "Case escalated to human agent due to complexity of subscription upgrade issue requiring manual intervention.",
        tone: "warning",
        sortOrder: 3,
      },
    ],
    customerHistory: [
      {
        id: "amara_diallo-h1",
        title: "Subscription Upgrade case opened",
        timestamp: "Today · 9:00 AM",
        detail: "New subscription upgrade case opened for Amara Diallo at GreenLeaf Retail.",
        dot: "orange",
      },
      {
        id: "amara_diallo-h2",
        title: "Account verified",
        timestamp: "Feb 10, 2026 · 2:00 PM",
        detail: "Identity and account details verified for Amara Diallo.",
        dot: "gray",
      },
      {
        id: "amara_diallo-h3",
        title: "Account created",
        timestamp: "Jun 2019, 2021 · 10:00 AM",
        detail: "Amara Diallo joined GreenLeaf Retail. Account created and onboarding completed.",
        dot: "green",
      },
    ],
    queue: {
      time: "1h 30m",
      preview: "Enterprise plan upgrade — needs custom pricing and contract terms",
      priority: "Low",
      priorityClassName: "border-[#43A047] bg-[#E8F5E9] text-[#2E7D32]",
      badgeColor: "bg-[#43A047]",
      icon: "messageSquare",
      isActive: false,
      createdAt: "2026-04-27T09:00:00",
      updatedAt: "2026-04-27T09:05:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 9:00 AM",
        draft: "I've reviewed your subscription upgrade case, Amara. Here's what I can see and the steps I'm taking to resolve this for you right now.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hi, I'm reaching out about: Enterprise plan upgrade — needs custom pricing and contract terms. Can you help?",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Amara, I've reviewed your case regarding subscription upgrade. Let me look into this for you.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "I appreciate that — this has been an ongoing issue and I need it resolved today.",
            time: "9:04 AM",
          }
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 9:00 AM",
        draft: "Hi Amara — I've looked into your case. I'm working on a resolution and will update you shortly.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Need help — enterprise plan upgrade — needs custom pricing and contract terms.",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Amara — I can see your case. Reviewing details now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thanks. Please let me know as soon as you have an update.",
            time: "9:04 AM",
          }
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 9:00 AM",
        draft: "Hi Amara — I've reviewed your case. I have what I need to help you resolve this subscription upgrade issue.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hello, I need help with a subscription upgrade issue — enterprise plan upgrade — needs custom pricing and contract terms",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Amara! I can see your case details. I'm reviewing everything now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Great — please update me here when you have news.",
            time: "9:04 AM",
          }
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 9:00 AM",
        draft: "Hi Amara — thank you for your patience. I've reviewed your subscription upgrade case in detail and I'm ready to walk you through the next steps.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Subject: Subscription Upgrade - Urgent Assistance Needed\n\nHello,\n\nI need assistance with the following: Enterprise plan upgrade — needs custom pricing and contract terms. Please respond as soon as possible.\n\nThank you,\nAmara Diallo",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Amara,\n\nThank you for reaching out. I've reviewed your case and I'm working on resolving your subscription upgrade issue. I'll have an update for you shortly.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thank you for the quick response. Please prioritise this — it's time-sensitive.",
            time: "9:04 AM",
          }
        ],
      },
    },
    customerSnapshot: [
      "2-year customer with $380K in accounts",
      "Senegalese background; growing account activity",
      "No prior disputes; strong financial ethics",
      "Appreciates cultural competence in service",
      "Interested in community investment opportunities",
    ],
  },
  {
    id: "raj_patel",
    initials: "RP",
    name: "Raj Patel",
    customerId: "CST-20808",
    lastUpdated: "04/27/26 | 09:00 AM",
    profile: {
      department: "Enterprise Accounts",
      tenureYears: 3,
      totalAUM: "$150,302.00",
      financialReadiness: 51,
      financialAdvisor: "Marcus Lee",
      advisorTitle: "Senior Account Manager",
      tags: ["Premier"],
      fraudRiskScore: 48,
      priorDisputeCount: 1,
      cardBlocked: false,
    },
    conversationTopics: [
      "Resolve compliance request issue",
      "Review account status",
      "Confirm resolution and next steps",
    ],
    contact: {
      email: "raj.patel@orionpharma.com",
      phone: "(382) 555-3438",
      address: { street: "800 W Olympic Dr", city: "Denver", state: "CO", zip: "80203", country: "US" },
    },
    accounts: [
      { id: "raj_patel-chk", type: "Business", number: "***2702", balance: "$115,902.00",
          availableBalance: "$115,902.00", status: "active", openedDate: "Jul 2021" },
      { id: "raj_patel-sav", type: "Savings", number: "***4438", balance: "$241,958.00", status: "active", openedDate: "Aug 2021" },
    ],
    overview: {
      contactNumber: "(382) 555-3438",
      assignedAgent: "Marcus Lee",
      pronoun: "he",
      lastContactTime: "Today, 9:05 AM",
      address: "800 W Olympic Dr, Denver, CO 80203",
    },
    interactionTimeline: [
      {
        id: "raj_patel-case-opened",
        title: "Case opened — Compliance Request",
        timestamp: "Today · 9:00 AM",
        detail: "Raj Patel contacted support regarding: Regulatory audit request — GDPR data subject access request.",
        tone: "warning",
        sortOrder: 1,
      },
      {
        id: "raj_patel-bot-review",
        title: "Virtual agent reviewed case",
        timestamp: "Today · 9:02 AM",
        detail: "AI assistant reviewed the case details and initiated compliance request resolution workflow.",
        tone: "info",
        sortOrder: 2,
      },
      {
        id: "raj_patel-escalated",
        title: "Escalated to human agent",
        timestamp: "Today · 9:05 AM",
        detail: "Case escalated to human agent due to complexity of compliance request issue requiring manual intervention.",
        tone: "critical",
        sortOrder: 3,
      },
    ],
    customerHistory: [
      {
        id: "raj_patel-h1",
        title: "Compliance Request case opened",
        timestamp: "Today · 9:00 AM",
        detail: "New compliance request case opened for Raj Patel at Orion Pharma Group.",
        dot: "orange",
      },
      {
        id: "raj_patel-h2",
        title: "Account verified",
        timestamp: "Jan 22, 2026 · 2:00 PM",
        detail: "Identity and account details verified for Raj Patel.",
        dot: "gray",
      },
      {
        id: "raj_patel-h3",
        title: "Account created",
        timestamp: "Sep 2020, 2022 · 10:00 AM",
        detail: "Raj Patel joined Orion Pharma Group. Account created and onboarding completed.",
        dot: "green",
      },
    ],
    queue: {
      time: "5m",
      preview: "Regulatory audit request — GDPR data subject access request",
      priority: "Critical",
      priorityClassName: "border-[#E53935] bg-[#FDEAEA] text-[#C71D1A]",
      badgeColor: "bg-[#E32926]",
      icon: "phone",
      isActive: false,
      createdAt: "2026-04-27T09:00:00",
      updatedAt: "2026-04-27T09:05:00",
    },
    conversations: {
      chat: {
        label: "Chat",
        timelineLabel: "Web chat · Today, 9:00 AM",
        draft: "I've reviewed your compliance request case, Raj. Here's what I can see and the steps I'm taking to resolve this for you right now.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hi, I'm reaching out about: Regulatory audit request — GDPR data subject access request. Can you help?",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Raj, I've reviewed your case regarding compliance request. Let me look into this for you.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "I appreciate that — this has been an ongoing issue and I need it resolved today.",
            time: "9:04 AM",
          }
        ],
      },
      sms: {
        label: "SMS",
        timelineLabel: "SMS · Today, 9:00 AM",
        draft: "Hi Raj — I've looked into your case. I'm working on a resolution and will update you shortly.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Need help — regulatory audit request — gdpr data subject access request.",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Raj — I can see your case. Reviewing details now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thanks. Please let me know as soon as you have an update.",
            time: "9:04 AM",
          }
        ],
      },
      whatsapp: {
        label: "WhatsApp",
        timelineLabel: "WhatsApp · Today, 9:00 AM",
        draft: "Hi Raj — I've reviewed your case. I have what I need to help you resolve this compliance request issue.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Hello, I need help with a compliance request issue — regulatory audit request — gdpr data subject access request",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Raj! I can see your case details. I'm reviewing everything now.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Great — please update me here when you have news.",
            time: "9:04 AM",
          }
        ],
      },
      email: {
        label: "Email",
        timelineLabel: "Email thread · Today, 9:00 AM",
        draft: "Hi Raj — thank you for your patience. I've reviewed your compliance request case in detail and I'm ready to walk you through the next steps.",
        messages: [
          {
            id: 1,
            role: "customer",
            content: "Subject: Compliance Request - Urgent Assistance Needed\n\nHello,\n\nI need assistance with the following: Regulatory audit request — GDPR data subject access request. Please respond as soon as possible.\n\nThank you,\nRaj Patel",
            time: "9:00 AM",
          },
          {
            id: 2,
            role: "agent",
            content: "Hi Raj,\n\nThank you for reaching out. I've reviewed your case and I'm working on resolving your compliance request issue. I'll have an update for you shortly.",
            time: "9:02 AM",
          },
          {
            id: 3,
            role: "customer",
            content: "Thank you for the quick response. Please prioritise this — it's time-sensitive.",
            time: "9:04 AM",
          }
        ],
      },
    },
    customerSnapshot: [
      "6-year customer with $950K+ portfolio",
      "Indian-American business owner; complex finances",
      "1 prior dispute resolved positively",
      "Highly analytical; expects data-backed recommendations",
      "Values long-term advisor relationships",
    ],
  },
  {
    id: "terry",
    initials: "TW",
    name: "Terry Williams",
    customerId: "CST-14201",
    lastUpdated: "Today",
    profile: {
      department: "Operations",
      tenureYears: 0,
      totalAUM: "",
      financialReadiness: 0,
      financialAdvisor: "",
      advisorTitle: "",
      tags: ["Prospect", "Enterprise", "Logistics", "TMS Evaluation"],
      fraudRiskScore: 0,
      priorDisputeCount: 0,
      cardBlocked: false,
    },
    conversationTopics: [
      "TMS replacement evaluation for 200-person logistics team",
      "Browsed Enterprise Pricing, Integrations, and ROI Calculator",
      "Inbound callback request from nexusfreight.com",
    ],
    contact: {
      email: "terry.williams@nexusfreight.com",
      phone: "(408) 555-0174",
      address: { street: "1200 Harbor Bay Pkwy", city: "San Jose", state: "CA", zip: "95002", country: "US" },
    },
    accounts: [
      { id: "tw-prospect", type: "Business", number: "CST-14201", balance: "", availableBalance: "", status: "active", openedDate: "Today" },
    ],
    overview: {
      contactNumber: "(408) 555-0174",
      assignedAgent: "Jeff Comstock",
      pronoun: "he",
      lastContactTime: "Today (inbound callback request)",
      address: "1200 Harbor Bay Pkwy, San Jose, CA 95002",
    },
    interactionTimeline: [
      {
        id: "terry-form-submit",
        title: "Inbound callback request submitted",
        timestamp: "Today",
        detail: "Terry submitted a callback request after browsing Enterprise Pricing, Integrations, and the ROI Calculator. Spent 4 min 12 sec on pricing. Form answer: 'Looking to replace our current TMS. 200-person team.'",
        tone: "info" as const,
        sortOrder: 1,
      },
    ],
    customerHistory: [
      {
        id: "terry-web-session",
        title: "Enterprise web session",
        timestamp: "Today",
        detail: "Visited Enterprise Pricing (4m 12s), Integrations page, and ROI Calculator before submitting callback form.",
        dot: "blue" as const,
        type: "web" as const,
        interaction: {
          kind: "web" as const,
          url: "https://nexgen.ai/enterprise",
          title: "Enterprise Pricing — Nexgen",
          sectionsViewed: ["Enterprise Pricing", "Integrations", "ROI Calculator"],
        },
      },
      {
        id: "terry-form",
        title: "Callback form submitted",
        timestamp: "Today",
        detail: "\"Looking to replace our current TMS. 200-person team.\" — Company: Nexus Freight (auto-resolved from domain)",
        dot: "green" as const,
        type: "registration" as const,
        interaction: {
          kind: "registration" as const,
          fields: [
            { label: "Name", value: "Terry Williams" },
            { label: "Title", value: "VP of Operations" },
            { label: "Company", value: "Nexus Freight" },
            { label: "Email", value: "terry.williams@nexusfreight.com" },
            { label: "Phone", value: "(408) 555-0174" },
            { label: "Message", value: "Looking to replace our current TMS. 200-person team." },
          ],
        },
      },
    ],
    queue: {
      time: "0m ago",
      preview: "Inbound callback request — VP of Ops at Nexus Freight evaluating TMS replacement",
      priority: "High",
      priorityClassName: "border-[#F79009] bg-[#FEF0C7] text-[#B54708]",
      badgeColor: "bg-[#F79009]",
      icon: "phone",
      isActive: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    conversations: {
      chat: { label: "Chat", timelineLabel: "Chat · New conversation", draft: "", messages: [] },
      sms: { label: "SMS", timelineLabel: "SMS · New conversation", draft: "", messages: [] },
      whatsapp: { label: "WhatsApp", timelineLabel: "WhatsApp · New conversation", draft: "", messages: [] },
      email: { label: "Email", timelineLabel: "Email · New conversation", draft: "", messages: [] },
    },
    customerSnapshot: [
      "4-year customer with $640K in combined accounts",
      "Independent professional; diverse income sources",
      "Zero disputes; excellent standing",
      "Values transparency and straightforward dealings",
      "Appreciates efficient service without extra steps",
    ],
  },
];

export const defaultCustomerId = customerDatabase.find((customer) => customer.queue.isActive)?.id ?? customerDatabase[0]?.id ?? "alex";

export function getCustomerRecord(customerId: string) {
  return customerDatabase.find((customer) => customer.id === customerId) ?? customerDatabase[0];
}

export function getRandomizedCustomerInteractionTimeline(customerId: string, count = 4) {
  const customer = getCustomerRecord(customerId);
  const shuffled = [...customer.interactionTimeline]
    .map((item) => ({ item, random: Math.random() }))
    .sort((left, right) => left.random - right.random)
    .map(({ item }) => item);

  return shuffled
    .slice(0, Math.min(count, shuffled.length))
    .sort((left, right) => right.sortOrder - left.sortOrder);
}

export function getChannelFromConversationLabel(label: string): CustomerChannel {
  if (label.toLowerCase() === "chat") return "chat";
  if (label.toLowerCase() === "sms") return "sms";
  if (label.toLowerCase() === "whatsapp") return "whatsapp";
  if (label.toLowerCase() === "voice") return "voice";
  return "email";
}

/**
 * Build the initial conversation state for a customer.
 * @param botAuthor  When provided (e.g. "Aria", "Jacob", "Emily"), every pre-existing
 *                   agent-role message is stamped with `author: botAuthor` so the
 *                   conversation panel renders the bot's avatar rather than the human
 *                   agent's avatar for those messages.
 */
export function createConversationState(customerId: string, channel: CustomerChannel, botAuthor?: string): SharedConversationData {
  const customer = getCustomerRecord(customerId);

  if (channel === "voice") {
    return {
      customerName: customer.name,
      label: "Voice",
      timelineLabel: "Voice call · Live guidance",
      status: "open",
      draft: "",
      messages: [],
      isCustomerTyping: false,
    };
  }

  const conversation = customer.conversations[channel];

  // Graceful fallback for customers that don't have a template for this channel.
  if (!conversation) {
    const label = channel === "sms" ? "SMS" : channel.charAt(0).toUpperCase() + channel.slice(1);
    return {
      customerName: customer.name,
      label,
      timelineLabel: `${label} · New conversation`,
      status: "open",
      draft: "",
      messages: [],
      isCustomerTyping: false,
    };
  }

  return {
    customerName: customer.name,
    label: conversation.label,
    timelineLabel: conversation.timelineLabel,
    status: "open",
    draft: "",
    messages: conversation.messages.map((message) => ({
      ...message,
      // Stamp pre-existing bot messages so the conversation panel renders the
      // bot avatar instead of the human agent's avatar after takeover.
      ...(botAuthor && message.role === "agent" && !message.author ? { author: botAuthor } : {}),
    })),
    isCustomerTyping: false,
  };
}

export function getRandomCustomerSeed() {
  return customerDatabase[Math.floor(Math.random() * customerDatabase.length)] ?? customerDatabase[0];
}
