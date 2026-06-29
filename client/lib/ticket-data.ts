import { cn } from "@/lib/utils";

export type CustomerTicket = {
  customerId?: string;
  id: string;
  priority: "Low" | "Medium" | "High" | "Urgent";
  type: "Complaint" | "Question" | "Task" | "Incident" | "Problem" | "Request";
  subject: string;
  status:
    | "Open"
    | "Cancelled"
    | "Closed"
    | "Duplicate"
    | "Escalated"
    | "In Progress"
    | "On-Hold"
    | "Pending Customer"
    | "Needing Attention"
    | "De-Escalated"
    | "Training Rescheduled";
  agent: string;
  agentTeam: string;
  modifiedBy: string;
};

export type TicketColumnKey = "priority" | "id" | "type" | "subject" | "status" | "agent" | "agentTeam" | "modifiedBy";

export type TicketColumn = {
  key: TicketColumnKey;
  label: string;
  minWidth: number;
  defaultWidth: number;
  renderCell: (ticket: CustomerTicket) => React.ReactNode;
};

const customerTickets: CustomerTicket[] = [
  {
    customerId: "alex",
    id: "CASE-56",
    priority: "High",
    type: "Incident",
    subject: "Pro plan upgrade blocked by billing mismatch",
    status: "Open",
    agent: "Jeff Common",
    agentTeam: "Digital Care",
    modifiedBy: "JEFF.COMSTOCK",
  },
  {
    customerId: "priya",
    id: "CASE-84",
    priority: "High",
    type: "Incident",
    subject: "Mobile app crashes after biometric login",
    status: "Escalated",
    agent: "Priya Shah",
    agentTeam: "Authentication Ops",
    modifiedBy: "PRIYA.SHAH",
  },
  {
    customerId: "noah",
    id: "CASE-112",
    priority: "Low",
    type: "Question",
    subject: "Customer asked how to export monthly statements",
    status: "Pending Customer",
    agent: "Marcus Lee",
    agentTeam: "Billing Support",
    modifiedBy: "MARCUS.LEE",
  },
  {
    customerId: "alex",
    id: "CASE-139",
    priority: "Urgent",
    type: "Problem",
    subject: "Billing security flag still blocking repeat checkout",
    status: "Needing Attention",
    agent: "Elena Petrova",
    agentTeam: "Risk Response",
    modifiedBy: "ELENA.PETROVA",
  },
  {
    customerId: "olivia",
    id: "CASE-147",
    priority: "Medium",
    type: "Request",
    subject: "Requested address update before policy renewal",
    status: "In Progress",
    agent: "Chris Nolan",
    agentTeam: "Account Services",
    modifiedBy: "CHRIS.NOLAN",
  },
  {
    customerId: "david",
    id: "CASE-163",
    priority: "High",
    type: "Complaint",
    subject: "Duplicate late fee applied to commercial account",
    status: "De-Escalated",
    agent: "Sofia Ramirez",
    agentTeam: "Enterprise Billing",
    modifiedBy: "SOFIA.RAMIREZ",
  },
  {
    customerId: "miguel",
    id: "CASE-188",
    priority: "Low",
    type: "Task",
    subject: "Follow up with customer on document upload status",
    status: "On-Hold",
    agent: "Ben Carter",
    agentTeam: "Document Review",
    modifiedBy: "BEN.CARTER",
  },
  {
    customerId: "sarah",
    id: "CASE-204",
    priority: "Medium",
    type: "Request",
    subject: "Reschedule onboarding training for branch admins",
    status: "Training Rescheduled",
    agent: "Lina Park",
    agentTeam: "Enablement Desk",
    modifiedBy: "LINA.PARK",
  },
  {
    customerId: "emily",
    id: "CASE-219",
    priority: "High",
    type: "Incident",
    subject: "Payment processor timeout during checkout confirmation",
    status: "Closed",
    agent: "Owen Brooks",
    agentTeam: "Checkout Operations",
    modifiedBy: "OWEN.BROOKS",
  },
  {
    customerId: "hannah",
    id: "CASE-233",
    priority: "Low",
    type: "Question",
    subject: "Asked whether rewards can be pooled across accounts",
    status: "Cancelled",
    agent: "Ava Thompson",
    agentTeam: "Rewards Support",
    modifiedBy: "AVA.THOMPSON",
  },
  {
    customerId: "jamal",
    id: "CASE-248",
    priority: "Medium",
    type: "Problem",
    subject: "Submitted claim appears twice in the case timeline",
    status: "Duplicate",
    agent: "Noah Kim",
    agentTeam: "Claims Resolution",
    modifiedBy: "NOAH.KIM",
  },
  {
    customerId: "lauren",
    id: "CASE-271",
    priority: "Urgent",
    type: "Complaint",
    subject: "VIP customer unable to access same-day settlement funds",
    status: "Open",
    agent: "Mila Fischer",
    agentTeam: "Premier Support",
    modifiedBy: "MILA.FISCHER",
  },
];

export function getCustomerTickets(customerId?: string) {
  return customerId ? customerTickets.filter((ticket) => ticket.customerId === customerId) : customerTickets;
}

export function getCustomerTicketById(ticketId?: string, customerId?: string) {
  if (!ticketId) return null;

  return getCustomerTickets(customerId).find((ticket) => ticket.id === ticketId)
    ?? customerTickets.find((ticket) => ticket.id === ticketId)
    ?? null;
}

export function getRelevantCustomerTicket(customerId: string | undefined, issueContext: string) {
  const availableTickets = getCustomerTickets(customerId);

  if (availableTickets.length === 0) {
    return null;
  }

  const normalizedContext = issueContext.toLowerCase();
  const keywordMatchers: Array<{ keywords: string[]; ticketKeywords: string[] }> = [
    {
      keywords: ["billing", "payment", "zip", "declined", "retry", "charge", "upgrade"],
      ticketKeywords: ["billing", "payment", "upgrade", "checkout", "duplicate"],
    },
    {
      keywords: ["urgent", "today", "meeting", "deadline"],
      ticketKeywords: ["urgent", "vip", "open", "attention"],
    },
    {
      keywords: ["account", "security", "flag", "review", "verification"],
      ticketKeywords: ["account", "risk", "review", "security", "profile"],
    },
  ];

  for (const matcher of keywordMatchers) {
    if (!matcher.keywords.some((keyword) => normalizedContext.includes(keyword))) {
      continue;
    }

    const matchingTicket = availableTickets.find((ticket) => {
      const ticketText = `${ticket.subject} ${ticket.type} ${ticket.status} ${ticket.agentTeam}`.toLowerCase();
      return matcher.ticketKeywords.some((keyword) => ticketText.includes(keyword));
    });

    if (matchingTicket) {
      return matchingTicket;
    }
  }

  return availableTickets.find((ticket) => ["Open", "In Progress", "Pending Customer", "Needing Attention"].includes(ticket.status))
    ?? availableTickets[0];
}

export function formatNoteTimestamp(date: Date) {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const year = date.getFullYear();
  const hours = date.getHours();
  const hours12 = hours % 12 || 12;
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  const seconds = `${date.getSeconds()}`.padStart(2, "0");
  const meridiem = hours >= 12 ? "PM" : "AM";

  return `${month}/${day}/${year} ${hours12.toString().padStart(2, "0")}:${minutes}:${seconds} ${meridiem}`;
}

export function getPriorityTone(priority: CustomerTicket["priority"]) {
  switch (priority) {
    case "Urgent":
      return "bg-[#E32926]";
    case "High":
      return "bg-[#FFB800]";
    case "Medium":
      return "bg-[#166CCA]";
    default:
      return "bg-[#208337]";
  }
}

export function getStatusBadgeClasses(status: CustomerTicket["status"]) {
  switch (status) {
    case "Open":
      return "border-[#24943E] bg-[#EFFBF1] text-[#208337]";
    case "Escalated":
    case "Needing Attention":
      return "border-[#E53935] bg-[#FDEAEA] text-[#C71D1A]";
    case "In Progress":
    case "Pending Customer":
    case "On-Hold":
    case "Training Rescheduled":
      return "border-[#A37A00] bg-[#FFF6E0] text-[#A37A00]";
    case "Closed":
    case "Cancelled":
    case "Duplicate":
      return "border-[#D0D5DD] bg-[#F9FAFB] text-[#667085]";
    case "De-Escalated":
      return "border-[#BFDBFE] bg-[#EBF4FD] text-[#166CCA]";
    default:
      return "border-[#24943E] bg-[#EFFBF1] text-[#208337]";
  }
}

// Note: TICKET_COLUMNS with renderCell is defined in TicketsDataGrid.tsx
// because it requires React/JSX. These constants are derived from it.

export const TICKET_COLUMN_DEFINITIONS: Omit<TicketColumn, 'renderCell'>[] = [
  { key: "priority", label: "Priority", minWidth: 120, defaultWidth: 140 },
  { key: "id", label: "Ticket Full Number", minWidth: 150, defaultWidth: 180 },
  { key: "type", label: "Type", minWidth: 120, defaultWidth: 140 },
  { key: "subject", label: "Subject", minWidth: 280, defaultWidth: 360 },
  { key: "status", label: "Status", minWidth: 180, defaultWidth: 190 },
  { key: "agent", label: "Agent", minWidth: 150, defaultWidth: 170 },
  { key: "agentTeam", label: "Agent Team", minWidth: 170, defaultWidth: 190 },
  { key: "modifiedBy", label: "Modified By", minWidth: 160, defaultWidth: 180 },
];

export const INITIAL_TICKET_COLUMN_ORDER: TicketColumnKey[] = [
  "priority",
  "id",
  "type",
  "subject",
  "status",
  "agent",
  "agentTeam",
  "modifiedBy",
];

export const INITIAL_TICKET_COLUMN_WIDTHS: Record<TicketColumnKey, number> = {
  priority: 140,
  id: 180,
  type: 140,
  subject: 360,
  status: 190,
  agent: 170,
  agentTeam: 190,
  modifiedBy: 180,
};

// TICKET_COLUMN_MAP will be created dynamically in TicketsDataGrid.tsx
// since it needs renderCell functions that require JSX

export function reorderTicketColumns(columnOrder: TicketColumnKey[], draggedKey: TicketColumnKey, targetKey: TicketColumnKey) {
  if (draggedKey === targetKey) return columnOrder;

  const nextOrder = [...columnOrder];
  const draggedIndex = nextOrder.indexOf(draggedKey);
  const targetIndex = nextOrder.indexOf(targetKey);

  if (draggedIndex === -1 || targetIndex === -1) return columnOrder;

  nextOrder.splice(draggedIndex, 1);
  nextOrder.splice(targetIndex, 0, draggedKey);

  return nextOrder;
}
