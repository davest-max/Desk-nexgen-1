// Agent roster, types, and scoring utilities

export type AgentAvailability = "Available" | "In a Call" | "Away" | "Offline";

export interface Agent {
  id: string;
  name: string;
  initials: string;
  availability: AgentAvailability;
  skills: string[];
  activeCount: number; // current assignment count
}

export const CURRENT_AGENT_NAME = "Jeff Comstock";

export const agentRoster: Agent[] = [
  {
    id: "agent-1",
    name: "Jeff Comstock",
    initials: "JC",
    availability: "Available",
    skills: ["Billing", "Account Management", "Escalations"],
    activeCount: 2,
  },
  {
    id: "agent-2",
    name: "Priya Mehra",
    initials: "PM",
    availability: "Available",
    skills: ["Technical Support", "API Integration", "Security"],
    activeCount: 1,
  },
  {
    id: "agent-3",
    name: "Sam Torres",
    initials: "ST",
    availability: "Available",
    skills: ["Compliance", "Data Exports", "Contract Renewals"],
    activeCount: 3,
  },
  {
    id: "agent-4",
    name: "Kenji Watanabe",
    initials: "KW",
    availability: "In a Call",
    skills: ["Payments", "Fraud", "Wire Transfers"],
    activeCount: 4,
  },
  {
    id: "agent-5",
    name: "Amara Osei",
    initials: "AO",
    availability: "Available",
    skills: ["Enterprise Accounts", "Licensing", "Escalations"],
    activeCount: 2,
  },
  {
    id: "agent-6",
    name: "Lena Fischer",
    initials: "LF",
    availability: "Away",
    skills: ["Billing", "Refunds", "Account Management"],
    activeCount: 1,
  },
  {
    id: "agent-7",
    name: "Marcus Webb",
    initials: "MW",
    availability: "Available",
    skills: ["Security", "Identity Management", "SSO"],
    activeCount: 2,
  },
  {
    id: "agent-8",
    name: "Chloe Nguyen",
    initials: "CN",
    availability: "Offline",
    skills: ["Technical Support", "Logistics", "Customs"],
    activeCount: 0,
  },
];

export const supervisorRoster: Agent[] = [
  {
    id: "sup-1",
    name: "Rachel Kim",
    initials: "RK",
    availability: "Available",
    skills: ["Escalations", "Enterprise Accounts", "Compliance"],
    activeCount: 3,
  },
  {
    id: "sup-2",
    name: "David Okafor",
    initials: "DO",
    availability: "Available",
    skills: ["Fraud", "Risk Management", "Wire Transfers"],
    activeCount: 2,
  },
  {
    id: "sup-3",
    name: "Sandra Howell",
    initials: "SH",
    availability: "In a Call",
    skills: ["Billing", "Licensing", "Contract Renewals"],
    activeCount: 4,
  },
  {
    id: "sup-4",
    name: "Tom Ellison",
    initials: "TE",
    availability: "Away",
    skills: ["Security", "Identity Management", "Escalations"],
    activeCount: 1,
  },
];

export const availabilityOrder: Record<AgentAvailability, number> = {
  Available: 0,
  "In a Call": 1,
  Away: 2,
  Offline: 3,
};

export const availabilityDot: Record<AgentAvailability, string> = {
  Available: "bg-[#208337]",
  "In a Call": "bg-[#FFB800]",
  Away: "bg-[#D0D5DD]",
  Offline: "bg-[#98A2B3]",
};

// Score an agent against an issue's channel/priority to surface best matches
export function scoreAgent(agent: Agent, priority: string, preview: string): number {
  const text = preview.toLowerCase();
  let score = 0;
  for (const skill of agent.skills) {
    if (text.includes(skill.toLowerCase().split(" ")[0])) score += 2;
  }
  if (priority === "Critical" || priority === "High") {
    if (agent.skills.some((s) => s.toLowerCase().includes("escalation"))) score += 3;
  }
  score -= agent.activeCount * 0.5;
  return score;
}

// Smart popover positioning
export function getSmartPopoverPosition(
  triggerRect: DOMRect,
  popoverWidth: number,
  estimatedHeight: number,
  gap = 6,
  margin = 8,
) {
  const spaceBelow = window.innerHeight - triggerRect.bottom - gap - margin;
  const spaceAbove = triggerRect.top - gap - margin;
  const openBelow = spaceBelow >= estimatedHeight || spaceBelow >= spaceAbove;
  const left = Math.max(margin, Math.min(triggerRect.left, window.innerWidth - popoverWidth - margin));
  if (openBelow) {
    return { left, top: triggerRect.bottom + gap, maxHeight: Math.max(160, spaceBelow), transform: "none" as const };
  }
  return { left, top: triggerRect.top - gap, maxHeight: Math.max(160, spaceAbove), transform: "translateY(-100%)" as const };
}
