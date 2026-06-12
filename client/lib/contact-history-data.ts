// ─── Shared contact history types & data ──────────────────────────────────────
// Used by: NotesPanel (History tab), ClosedContactPanel (drill-in)

export type ContactChannel = "chat" | "voice" | "email" | "system" | "web" | "ticket";
export type OutcomeVariant = "resolved" | "escalated" | "pending" | "info";

export interface ContactInteraction {
  id: string;
  date: string;
  channel: ContactChannel;
  title: string;
  agent: string;
  summary: string;
  outcome?: string;
  outcomeVariant?: OutcomeVariant;
  linkedTo?: string[];
  messages?: { role: "customer" | "agent"; text: string }[];
}

export const CHANNEL_STYLE: Record<ContactChannel, { label: string; color: string; border: string; bg: string }> = {
  chat:   { label: "Chat",   color: "text-[#166CCA]", border: "border-l-[#166CCA]", bg: "bg-[#EBF4FD]" },
  voice:  { label: "Voice",  color: "text-[#027A48]", border: "border-l-[#027A48]", bg: "bg-[#ECFDF3]" },
  email:  { label: "Email",  color: "text-[#B54708]", border: "border-l-[#B54708]", bg: "bg-[#FFF6ED]" },
  system: { label: "System", color: "text-[#D92D20]", border: "border-l-[#D92D20]", bg: "bg-[#FEF2F2]" },
  web:    { label: "Web",    color: "text-[#667085]", border: "border-l-[#D0D5DD]", bg: "bg-[#F9FAFB]" },
  ticket: { label: "Ticket", color: "text-[#6941C6]", border: "border-l-[#6941C6]", bg: "bg-[#F4F3FF]" },
};

export const OUTCOME_CHIP: Record<OutcomeVariant, string> = {
  resolved:  "bg-[#ECFDF3] text-[#027A48]",
  escalated: "bg-[#FFF4ED] text-[#B54708]",
  pending:   "bg-[#F9FAFB] text-[#344054]",
  info:      "bg-[#EBF4FD] text-[#166CCA]",
};

// ─── Marcus Webb — 6 interactions ─────────────────────────────────────────────

export const MARCUS_INTERACTIONS: ContactInteraction[] = [
  {
    id: "h-signup",
    date: "Apr 2023",
    channel: "web",
    title: "Account created — first order",
    agent: "System (self-service)",
    summary: "Marcus created his account via westbrook.com checkout. Shipping address on file: 419 Elm St, Denver, CO 80203. First order: Navy Crewneck Sweater ($89).",
    outcome: "Account active",
    outcomeVariant: "resolved",
  },
  {
    id: "h-address",
    date: "Jan 14, 2025 · 2:18 PM",
    channel: "chat",
    title: "Chat — address change request",
    agent: "Jeff Comstock",
    summary: "Marcus initiated a chat to confirm his shipping address had been updated following his move from Denver to Austin. Jeff verified the profile update and confirmed the new address was saved. No label cache purge was triggered at the time.",
    outcome: "Address updated — label cache not cleared",
    outcomeVariant: "pending",
    linkedTo: ["h-shipped"],
    messages: [
      { role: "customer", text: "Hi, I moved to Austin about two weeks ago and want to make sure my shipping address is updated before I place any new orders." },
      { role: "agent",    text: "Hi Marcus! Happy to help. I can see your account — you have 419 Elm St, Denver on file. I'll update that now. What's the new address?" },
      { role: "customer", text: "It's 2847 Ridgewood Ave, Austin, TX 78704." },
      { role: "agent",    text: "Done — I've updated your default shipping address to 2847 Ridgewood Ave, Austin, TX 78704. You're all set for future orders." },
      { role: "customer", text: "Perfect, thank you!" },
    ],
  },
  {
    id: "h-order",
    date: "Apr 18, 2026 · 2:31 PM",
    channel: "web",
    title: "Order #WB-88214 placed — Charcoal Merino Sweater",
    agent: "System",
    summary: "1× Charcoal Merino Sweater (Size L) — $129.00. Mastercard ****7731. Estimated delivery Apr 22. Customer note: \"It's a gift for my dad's birthday party.\" Stale Denver address pulled at checkout.",
    outcome: "Order confirmed",
    outcomeVariant: "info",
    linkedTo: ["h-address", "h-shipped"],
  },
  {
    id: "h-shipped",
    date: "Apr 19, 2026 · 9:42 AM",
    channel: "email",
    title: "Email — shipping confirmation to wrong address",
    agent: "marcus.webb@email.com",
    summary: "Automated shipping confirmation sent for order #WB-88214. Confirmation listed 419 Elm St, Denver — Marcus's old address. Marcus replied immediately flagging the error. No agent response was sent before he escalated via chat.",
    outcome: "Wrong address flagged by customer",
    outcomeVariant: "escalated",
    linkedTo: ["h-address", "h-order", "h-chat"],
    messages: [
      { role: "agent",    text: "Hi Marcus, your order #WB-88214 (Charcoal Merino Sweater, Size L) has shipped!\n\nShipping to: 419 Elm St, Denver, CO 80203\nCarrier: UPS · Tracking: 1Z9F8R460346243817" },
      { role: "customer", text: "This is wrong. I updated my address to Austin, TX over a year ago. Why did this ship to Denver? I need this by Saturday for my dad's birthday." },
      { role: "customer", text: "I haven't heard back. I'm going to contact support via chat." },
    ],
  },
  {
    id: "h-chat",
    date: "Today · 10:07 AM",
    channel: "chat",
    title: "Chat — Marcus contacted support",
    agent: "Emily (Virtual Agent)",
    summary: "Marcus reported missing shipping confirmation and noticed wrong address in order history. Emily confirmed the address mismatch, reviewed carrier options, and determined human agent needed for carrier intercept or reship.",
    outcome: "Escalated to human agent",
    outcomeVariant: "escalated",
    linkedTo: ["h-shipped", "h-escalation"],
    messages: [
      { role: "customer", text: "Hi — I placed an order #WB-88214 and it looks like it shipped to my old Denver address. I moved to Austin over a year ago." },
      { role: "agent",    text: "I'm sorry about that, Marcus. I can see the order shipped to 419 Elm St, Denver. Your profile shows your Austin address — it looks like the label used a cached address. Let me check carrier intercept options." },
      { role: "customer", text: "I need this by Saturday — it's a birthday gift for my dad." },
      { role: "agent",    text: "Understood. I'm going to connect you with a specialist who can arrange an overnight reship or issue a full refund. One moment." },
    ],
  },
  {
    id: "h-escalation",
    date: "Today · 10:14 AM",
    channel: "ticket",
    title: "Case escalated — Priya Nair assigned",
    agent: "Priya Nair",
    summary: "Emily escalated to Priya Nair. Case notes include three resolution paths: (1) overnight reship to Austin, (2) full refund + reorder, (3) carrier intercept if feasible. Goodwill discount code recommended for loyal customer.",
    outcome: "Open — awaiting resolution",
    outcomeVariant: "pending",
    linkedTo: ["h-chat"],
  },
];

// ─── Sandra Okafor — billing dispute ──────────────────────────────────────────

export const SANDRA_INTERACTIONS: ContactInteraction[] = [
  {
    id: "so-email1",
    date: "Mar 3, 2026 · 11:14 AM",
    channel: "email",
    title: "Email — invoice discrepancy reported",
    agent: "sandra.okafor@apexfin.com",
    summary: "Sandra emailed billing support regarding a double-charge on her Feb statement — two identical $249 transactions on Feb 28. She attached the statement PDF and requested a refund for the duplicate.",
    outcome: "Ticket opened",
    outcomeVariant: "info",
    linkedTo: ["so-chat"],
    messages: [
      { role: "customer", text: "Hi, I'm seeing a duplicate charge on my February statement — $249.00 appears twice on Feb 28. I've attached the statement. Can you please investigate and refund the duplicate?" },
      { role: "agent",    text: "Hi Sandra, thank you for reaching out. I can see your message and the attached statement. I'm opening a billing case and will have a specialist review this within 1 business day." },
    ],
  },
  {
    id: "so-chat",
    date: "Mar 4, 2026 · 9:52 AM",
    channel: "chat",
    title: "Chat — billing agent reviewed double-charge",
    agent: "Tom Adeyemi",
    summary: "Tom confirmed the duplicate charge was caused by a payment gateway retry triggered by a 3-second timeout. The second charge captured successfully despite the first also clearing. Tom initiated the refund and applied a $25 goodwill credit.",
    outcome: "Refund issued — $249 + $25 credit",
    outcomeVariant: "resolved",
    linkedTo: ["so-email1"],
    messages: [
      { role: "agent",    text: "Hi Sandra, I'm Tom from billing. I've reviewed the Feb 28 transactions — the duplicate was caused by a payment gateway timeout that triggered a retry. Both charges cleared. I'm issuing a full refund of $249.00 and a $25 goodwill credit to your account." },
      { role: "customer", text: "Thank you Tom, I appreciate the quick resolution. How long will the refund take?" },
      { role: "agent",    text: "The refund will appear within 3–5 business days depending on your card issuer. The $25 credit is already on your account. Is there anything else I can help with?" },
      { role: "customer", text: "No, that's perfect. Thanks!" },
    ],
  },
];

// ─── James Tran — account access ──────────────────────────────────────────────

export const JAMES_TRAN_INTERACTIONS: ContactInteraction[] = [
  {
    id: "jt-voice1",
    date: "Feb 17, 2026 · 3:05 PM",
    channel: "voice",
    title: "Voice — account locked after failed logins",
    agent: "IVR (Auto-routing)",
    summary: "James called after 5 failed login attempts locked his account. IVR verified his phone number and routed to account security team. Call duration: 4 min.",
    outcome: "Routed to security team",
    outcomeVariant: "info",
    linkedTo: ["jt-ticket"],
  },
  {
    id: "jt-ticket",
    date: "Feb 17, 2026 · 3:11 PM",
    channel: "ticket",
    title: "Ticket — identity verification & account unlock",
    agent: "Anya Sharma",
    summary: "Anya completed a 3-factor identity check (DOB, billing address, last 4 of card). Account unlocked, temporary password issued. James confirmed access restored on the same call. Ticket closed.",
    outcome: "Account unlocked — access restored",
    outcomeVariant: "resolved",
    linkedTo: ["jt-voice1"],
    messages: [
      { role: "agent",    text: "James, I've verified your identity successfully. I'm unlocking your account now and sending a temporary password reset link to your registered email." },
      { role: "customer", text: "Got it, I can see the email. Let me reset… yes, I'm in. Thank you!" },
      { role: "agent",    text: "Great. For security, we recommend enabling two-factor authentication in your account settings. Is there anything else I can help with?" },
      { role: "customer", text: "No, I'm good. Thanks Anya." },
    ],
  },
];

// ─── Priya Mehta — return & exchange ──────────────────────────────────────────

export const PRIYA_MEHTA_INTERACTIONS: ContactInteraction[] = [
  {
    id: "pm-chat1",
    date: "Apr 10, 2026 · 1:47 PM",
    channel: "chat",
    title: "Chat — return request for wrong size",
    agent: "Lena (Virtual Agent)",
    summary: "Priya contacted support to return a Charcoal Merino Sweater received in size M instead of L. Lena confirmed the order, generated a prepaid return label, and initiated an exchange for size L.",
    outcome: "Exchange confirmed — label sent",
    outcomeVariant: "resolved",
    messages: [
      { role: "customer", text: "Hi, I received my sweater but it's a Medium — I ordered a Large. Can I exchange it?" },
      { role: "agent",    text: "Hi Priya! I'm sorry about the size mix-up. I can see your order — let me set up a free exchange for size L. I'll email you a prepaid return label right away." },
      { role: "customer", text: "That's great, thank you! How long will the exchange take?" },
      { role: "agent",    text: "Once we receive the return (usually 3–5 days), we'll ship the size L immediately with express delivery at no charge. You'll get a tracking email." },
      { role: "customer", text: "Perfect, thanks for sorting this out so quickly!" },
    ],
  },
];

// ─── Customer record index ─────────────────────────────────────────────────────

export const CONTACT_HISTORY_BY_CUSTOMER: Record<string, ContactInteraction[]> = {
  marcus:       MARCUS_INTERACTIONS,
  sandra_okafor: SANDRA_INTERACTIONS,
  james_tran:   JAMES_TRAN_INTERACTIONS,
  priya_mehta:  PRIYA_MEHTA_INTERACTIONS,
};

// ─── Closed contact metadata ───────────────────────────────────────────────────
// Per-customer summary and resolved-at date for the drill-in panel left sidebar.

export interface ClosedContactMeta {
  customerRecordId: string;
  resolvedAt: string;
  tenure: string;
  totalContacts: number;
  aiSummary: string;
}

export const CLOSED_CONTACT_META: Record<string, ClosedContactMeta> = {
  sandra_okafor: {
    customerRecordId: "sandra_okafor",
    resolvedAt: "Mar 4, 2026",
    tenure: "2yr customer",
    totalContacts: 2,
    aiSummary: "Sandra reported a duplicate $249 charge caused by a payment gateway retry timeout. Tom Adeyemi confirmed both charges cleared and issued a full refund plus a $25 goodwill credit. Case closed with positive resolution.",
  },
  james_tran: {
    customerRecordId: "james_tran",
    resolvedAt: "Feb 17, 2026",
    tenure: "3yr customer",
    totalContacts: 2,
    aiSummary: "James's account was locked after 5 failed login attempts. Anya Sharma completed identity verification and restored access via temporary password reset. No security breach detected. Case closed.",
  },
  priya_mehta: {
    customerRecordId: "priya_mehta",
    resolvedAt: "Apr 10, 2026",
    tenure: "1yr customer",
    totalContacts: 1,
    aiSummary: "Priya received a size M sweater instead of her ordered size L. Lena issued a prepaid return label and set up an express exchange. Customer confirmed satisfaction. Case closed.",
  },
  marcus: {
    customerRecordId: "marcus",
    resolvedAt: "Today",
    tenure: "3yr customer",
    totalContacts: 6,
    aiSummary: "Shipping label cache not cleared after Jan 2025 address update caused Apr 2026 order to ship to old Denver address. Priya Nair handling overnight reship or refund. High-priority — time-sensitive gift.",
  },
};
