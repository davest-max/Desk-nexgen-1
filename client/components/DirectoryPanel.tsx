import { useMemo, useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowUpDown, ChevronDown, Mail, MessageCircle, MessageSquare, Phone, Search, SlidersHorizontal, Users, X } from "lucide-react";

import { useLayoutContext } from "@/components/layout-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type CustomerChannel, customerDatabase } from "@/lib/customer-database";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type DirectoryTab = "Customers" | "Agents" | "Agent Teams" | "Skills";

type AgentAvailability = "Available" | "In a Call" | "Away" | "Offline";

type DirectoryAgent = {
  id: string;
  name: string;
  initials: string;
  role: "Agent" | "Supervisor";
  team: string;
  availability: AgentAvailability;
  skills: string[];
  activeCount: number;
  avatarColor: string;
};

type AgentTeam = {
  id: string;
  name: string;
  focus: string;
  memberIds: string[];
};

// ─── Seed data ────────────────────────────────────────────────────────────────

export const directoryAgents: DirectoryAgent[] = [
  { id: "agent-1", name: "Jeff Common",   initials: "JC", role: "Agent",      team: "Billing Support",    availability: "Available",  skills: ["Billing", "Account Management", "Escalations"],       activeCount: 2, avatarColor: "#166CCA" },
  { id: "agent-2", name: "Priya Mehra",     initials: "PM", role: "Agent",      team: "Digital Care",       availability: "Available",  skills: ["Technical Support", "API Integration", "Security"],   activeCount: 1, avatarColor: "#7C3AED" },
  { id: "agent-3", name: "Sam Torres",      initials: "ST", role: "Agent",      team: "Compliance Team",    availability: "Available",  skills: ["Compliance", "Data Exports", "Contract Renewals"],    activeCount: 3, avatarColor: "#059669" },
  { id: "agent-4", name: "Kenji Watanabe",  initials: "KW", role: "Agent",      team: "Risk Response",      availability: "In a Call",  skills: ["Payments", "Fraud", "Wire Transfers"],                activeCount: 4, avatarColor: "#BE123C" },
  { id: "agent-5", name: "Amara Osei",      initials: "AO", role: "Agent",      team: "Enterprise Billing", availability: "Available",  skills: ["Enterprise Accounts", "Licensing", "Escalations"],    activeCount: 2, avatarColor: "#0891B2" },
  { id: "agent-6", name: "Lena Fischer",    initials: "LF", role: "Agent",      team: "Billing Support",    availability: "Away",       skills: ["Billing", "Refunds", "Account Management"],           activeCount: 1, avatarColor: "#9333EA" },
  { id: "agent-7", name: "Marcus Webb",     initials: "MW", role: "Agent",      team: "Authentication Ops", availability: "Available",  skills: ["Security", "Identity Management", "SSO"],             activeCount: 2, avatarColor: "#D97706" },
  { id: "agent-8", name: "Chloe Nguyen",    initials: "CN", role: "Agent",      team: "Document Review",    availability: "Offline",    skills: ["Technical Support", "Logistics", "Customs"],          activeCount: 0, avatarColor: "#DB2777" },
  { id: "sup-1",   name: "Rachel Kim",      initials: "RK", role: "Supervisor", team: "Enterprise Billing", availability: "Available",  skills: ["Escalations", "Enterprise Accounts", "Compliance"],   activeCount: 3, avatarColor: "#EA580C" },
  { id: "sup-2",   name: "David Okafor",    initials: "DO", role: "Supervisor", team: "Risk Response",      availability: "Available",  skills: ["Fraud", "Risk Management", "Wire Transfers"],         activeCount: 2, avatarColor: "#16A34A" },
  { id: "sup-3",   name: "Sandra Howell",   initials: "SH", role: "Supervisor", team: "Billing Support",    availability: "In a Call",  skills: ["Billing", "Licensing", "Contract Renewals"],          activeCount: 4, avatarColor: "#0E7490" },
  { id: "sup-4",   name: "Tom Ellison",     initials: "TE", role: "Supervisor", team: "Authentication Ops", availability: "Away",       skills: ["Security", "Identity Management", "Escalations"],     activeCount: 1, avatarColor: "#6D28D9" },
  // ── Customer Onboarding pool (35 agents) ──────────────────────────────────
  { id: "co-1",  name: "Aisha Patel",      initials: "AP", role: "Agent", team: "Customer Onboarding", availability: "Available",  skills: ["Customer Onboarding", "Account Setup"],       activeCount: 2, avatarColor: "#0891B2" },
  { id: "co-2",  name: "Brandon Lee",      initials: "BL", role: "Agent", team: "Customer Onboarding", availability: "Available",  skills: ["Customer Onboarding", "Product Training"],    activeCount: 1, avatarColor: "#166CCA" },
  { id: "co-3",  name: "Carmen Ruiz",      initials: "CR", role: "Agent", team: "Customer Onboarding", availability: "Away",       skills: ["Customer Onboarding", "Account Setup"],       activeCount: 0, avatarColor: "#7C3AED" },
  { id: "co-4",  name: "Derek Chang",      initials: "DC", role: "Agent", team: "Customer Onboarding", availability: "Available",  skills: ["Customer Onboarding", "Product Training"],    activeCount: 3, avatarColor: "#059669" },
  { id: "co-5",  name: "Elena Vasquez",    initials: "EV", role: "Agent", team: "Customer Onboarding", availability: "In a Call",  skills: ["Customer Onboarding", "Account Setup"],       activeCount: 4, avatarColor: "#BE123C" },
  { id: "co-6",  name: "Felix Okonkwo",    initials: "FO", role: "Agent", team: "Customer Onboarding", availability: "Available",  skills: ["Customer Onboarding", "Product Training"],    activeCount: 2, avatarColor: "#D97706" },
  { id: "co-7",  name: "Grace Tanaka",     initials: "GT", role: "Agent", team: "Customer Onboarding", availability: "Available",  skills: ["Customer Onboarding", "Account Setup"],       activeCount: 1, avatarColor: "#DB2777" },
  { id: "co-8",  name: "Hassan Ali",       initials: "HA", role: "Agent", team: "Customer Onboarding", availability: "Offline",    skills: ["Customer Onboarding", "Product Training"],    activeCount: 0, avatarColor: "#EA580C" },
  { id: "co-9",  name: "Ingrid Svensson",  initials: "IS", role: "Agent", team: "Customer Onboarding", availability: "Available",  skills: ["Customer Onboarding", "Account Setup"],       activeCount: 2, avatarColor: "#16A34A" },
  { id: "co-10", name: "James Obi",        initials: "JO", role: "Agent", team: "Customer Onboarding", availability: "Available",  skills: ["Customer Onboarding", "Product Training"],    activeCount: 3, avatarColor: "#0E7490" },
  { id: "co-11", name: "Keiko Yamamoto",   initials: "KY", role: "Agent", team: "Customer Onboarding", availability: "Away",       skills: ["Customer Onboarding", "Account Setup"],       activeCount: 1, avatarColor: "#6D28D9" },
  { id: "co-12", name: "Liam Brennan",     initials: "LB", role: "Agent", team: "Customer Onboarding", availability: "Available",  skills: ["Customer Onboarding", "Product Training"],    activeCount: 2, avatarColor: "#9333EA" },
  { id: "co-13", name: "Mia Johansson",    initials: "MJ", role: "Agent", team: "Customer Onboarding", availability: "Available",  skills: ["Customer Onboarding", "Account Setup"],       activeCount: 4, avatarColor: "#166CCA" },
  { id: "co-14", name: "Noah Adeyemi",     initials: "NA", role: "Agent", team: "Customer Onboarding", availability: "In a Call",  skills: ["Customer Onboarding", "Product Training"],    activeCount: 2, avatarColor: "#0891B2" },
  { id: "co-15", name: "Olivia Park",      initials: "OP", role: "Agent", team: "Customer Onboarding", availability: "Available",  skills: ["Customer Onboarding", "Account Setup"],       activeCount: 1, avatarColor: "#7C3AED" },
  { id: "co-16", name: "Pedro Morales",    initials: "PM", role: "Agent", team: "Customer Onboarding", availability: "Available",  skills: ["Customer Onboarding", "Product Training"],    activeCount: 3, avatarColor: "#059669" },
  { id: "co-17", name: "Quinn Foster",     initials: "QF", role: "Agent", team: "Customer Onboarding", availability: "Offline",    skills: ["Customer Onboarding", "Account Setup"],       activeCount: 0, avatarColor: "#BE123C" },
  { id: "co-18", name: "Rosa Nakamura",    initials: "RN", role: "Agent", team: "Customer Onboarding", availability: "Available",  skills: ["Customer Onboarding", "Product Training"],    activeCount: 2, avatarColor: "#D97706" },
  { id: "co-19", name: "Stefan Kovacs",    initials: "SK", role: "Agent", team: "Customer Onboarding", availability: "Away",       skills: ["Customer Onboarding", "Account Setup"],       activeCount: 1, avatarColor: "#DB2777" },
  { id: "co-20", name: "Tanya Williams",   initials: "TW", role: "Agent", team: "Customer Onboarding", availability: "Available",  skills: ["Customer Onboarding", "Product Training"],    activeCount: 4, avatarColor: "#EA580C" },
  { id: "co-21", name: "Uma Krishnan",     initials: "UK", role: "Agent", team: "Customer Onboarding", availability: "Available",  skills: ["Customer Onboarding", "Account Setup"],       activeCount: 2, avatarColor: "#16A34A" },
  { id: "co-22", name: "Victor Santos",    initials: "VS", role: "Agent", team: "Customer Onboarding", availability: "In a Call",  skills: ["Customer Onboarding", "Product Training"],    activeCount: 3, avatarColor: "#0E7490" },
  { id: "co-23", name: "Wendy Zhao",       initials: "WZ", role: "Agent", team: "Customer Onboarding", availability: "Available",  skills: ["Customer Onboarding", "Account Setup"],       activeCount: 1, avatarColor: "#6D28D9" },
  { id: "co-24", name: "Xander Bell",      initials: "XB", role: "Agent", team: "Customer Onboarding", availability: "Available",  skills: ["Customer Onboarding", "Product Training"],    activeCount: 2, avatarColor: "#9333EA" },
  { id: "co-25", name: "Yara Mensah",      initials: "YM", role: "Agent", team: "Customer Onboarding", availability: "Away",       skills: ["Customer Onboarding", "Account Setup"],       activeCount: 0, avatarColor: "#166CCA" },
  { id: "co-26", name: "Zoe Andersen",     initials: "ZA", role: "Agent", team: "Customer Onboarding", availability: "Available",  skills: ["Customer Onboarding", "Product Training"],    activeCount: 1, avatarColor: "#0891B2" },
  { id: "co-27", name: "Aaron Diaz",       initials: "AD", role: "Agent", team: "Customer Onboarding", availability: "Available",  skills: ["Customer Onboarding", "Account Setup"],       activeCount: 3, avatarColor: "#7C3AED" },
  { id: "co-28", name: "Beth Nguyen",      initials: "BN", role: "Agent", team: "Customer Onboarding", availability: "Available",  skills: ["Customer Onboarding", "Product Training"],    activeCount: 2, avatarColor: "#059669" },
  { id: "co-29", name: "Carlos Mbeki",     initials: "CM", role: "Agent", team: "Customer Onboarding", availability: "In a Call",  skills: ["Customer Onboarding", "Account Setup"],       activeCount: 4, avatarColor: "#BE123C" },
  { id: "co-30", name: "Dana Popescu",     initials: "DP", role: "Agent", team: "Customer Onboarding", availability: "Available",  skills: ["Customer Onboarding", "Product Training"],    activeCount: 1, avatarColor: "#D97706" },
  { id: "co-31", name: "Ethan Johal",      initials: "EJ", role: "Agent", team: "Customer Onboarding", availability: "Offline",    skills: ["Customer Onboarding", "Account Setup"],       activeCount: 0, avatarColor: "#DB2777" },
  { id: "co-32", name: "Fiona McLaren",    initials: "FM", role: "Agent", team: "Customer Onboarding", availability: "Available",  skills: ["Customer Onboarding", "Product Training"],    activeCount: 2, avatarColor: "#EA580C" },
  { id: "co-33", name: "George Ihejirika", initials: "GI", role: "Agent", team: "Customer Onboarding", availability: "Available",  skills: ["Customer Onboarding", "Account Setup"],       activeCount: 3, avatarColor: "#16A34A" },
  { id: "co-34", name: "Hana Sato",        initials: "HS", role: "Agent", team: "Customer Onboarding", availability: "Away",       skills: ["Customer Onboarding", "Product Training"],    activeCount: 1, avatarColor: "#0E7490" },
  { id: "co-35", name: "Ivan Petrov",      initials: "IP", role: "Agent", team: "Customer Onboarding", availability: "Available",  skills: ["Customer Onboarding", "Account Setup"],       activeCount: 2, avatarColor: "#6D28D9" },
  // ── Retention & Winback pool (35 agents) ──────────────────────────────────
  { id: "rw-1",  name: "Aaliyah Brooks",   initials: "AB", role: "Agent", team: "Retention", availability: "Available",  skills: ["Retention & Winback", "Churn Prevention"],    activeCount: 2, avatarColor: "#DB2777" },
  { id: "rw-2",  name: "Blake Hudson",     initials: "BH", role: "Agent", team: "Retention", availability: "In a Call",  skills: ["Retention & Winback", "Upsell"],               activeCount: 3, avatarColor: "#166CCA" },
  { id: "rw-3",  name: "Camille Dubois",   initials: "CD", role: "Agent", team: "Retention", availability: "Available",  skills: ["Retention & Winback", "Churn Prevention"],    activeCount: 1, avatarColor: "#7C3AED" },
  { id: "rw-4",  name: "Darnell Green",    initials: "DG", role: "Agent", team: "Retention", availability: "Away",       skills: ["Retention & Winback", "Upsell"],               activeCount: 0, avatarColor: "#059669" },
  { id: "rw-5",  name: "Elif Yilmaz",      initials: "EY", role: "Agent", team: "Retention", availability: "Available",  skills: ["Retention & Winback", "Churn Prevention"],    activeCount: 4, avatarColor: "#BE123C" },
  { id: "rw-6",  name: "Finn Larsson",     initials: "FL", role: "Agent", team: "Retention", availability: "Available",  skills: ["Retention & Winback", "Upsell"],               activeCount: 2, avatarColor: "#D97706" },
  { id: "rw-7",  name: "Gabrielle Martin", initials: "GM", role: "Agent", team: "Retention", availability: "Available",  skills: ["Retention & Winback", "Churn Prevention"],    activeCount: 1, avatarColor: "#EA580C" },
  { id: "rw-8",  name: "Hugo Ferreira",    initials: "HF", role: "Agent", team: "Retention", availability: "Offline",    skills: ["Retention & Winback", "Upsell"],               activeCount: 0, avatarColor: "#16A34A" },
  { id: "rw-9",  name: "Isla MacPherson",  initials: "IM", role: "Agent", team: "Retention", availability: "Available",  skills: ["Retention & Winback", "Churn Prevention"],    activeCount: 3, avatarColor: "#0E7490" },
  { id: "rw-10", name: "Jabari Owusu",     initials: "JO", role: "Agent", team: "Retention", availability: "In a Call",  skills: ["Retention & Winback", "Upsell"],               activeCount: 2, avatarColor: "#6D28D9" },
  { id: "rw-11", name: "Kira Volkova",     initials: "KV", role: "Agent", team: "Retention", availability: "Available",  skills: ["Retention & Winback", "Churn Prevention"],    activeCount: 1, avatarColor: "#9333EA" },
  { id: "rw-12", name: "Lorenzo Bianchi",  initials: "LB", role: "Agent", team: "Retention", availability: "Available",  skills: ["Retention & Winback", "Upsell"],               activeCount: 4, avatarColor: "#166CCA" },
  { id: "rw-13", name: "Maya Osei",        initials: "MO", role: "Agent", team: "Retention", availability: "Away",       skills: ["Retention & Winback", "Churn Prevention"],    activeCount: 0, avatarColor: "#0891B2" },
  { id: "rw-14", name: "Nate Eriksson",    initials: "NE", role: "Agent", team: "Retention", availability: "Available",  skills: ["Retention & Winback", "Upsell"],               activeCount: 2, avatarColor: "#7C3AED" },
  { id: "rw-15", name: "Ora Shapiro",      initials: "OS", role: "Agent", team: "Retention", availability: "Available",  skills: ["Retention & Winback", "Churn Prevention"],    activeCount: 3, avatarColor: "#059669" },
  { id: "rw-16", name: "Pablo Reyes",      initials: "PR", role: "Agent", team: "Retention", availability: "In a Call",  skills: ["Retention & Winback", "Upsell"],               activeCount: 1, avatarColor: "#BE123C" },
  { id: "rw-17", name: "Quinn Nakagawa",   initials: "QN", role: "Agent", team: "Retention", availability: "Available",  skills: ["Retention & Winback", "Churn Prevention"],    activeCount: 2, avatarColor: "#D97706" },
  { id: "rw-18", name: "Rania Hassan",     initials: "RH", role: "Agent", team: "Retention", availability: "Offline",    skills: ["Retention & Winback", "Upsell"],               activeCount: 0, avatarColor: "#DB2777" },
  { id: "rw-19", name: "Soren Berg",       initials: "SB", role: "Agent", team: "Retention", availability: "Available",  skills: ["Retention & Winback", "Churn Prevention"],    activeCount: 4, avatarColor: "#EA580C" },
  { id: "rw-20", name: "Tina Okafor",      initials: "TO", role: "Agent", team: "Retention", availability: "Available",  skills: ["Retention & Winback", "Upsell"],               activeCount: 2, avatarColor: "#16A34A" },
  { id: "rw-21", name: "Ulrich Baumann",   initials: "UB", role: "Agent", team: "Retention", availability: "Away",       skills: ["Retention & Winback", "Churn Prevention"],    activeCount: 1, avatarColor: "#0E7490" },
  { id: "rw-22", name: "Vera Sokolova",    initials: "VS", role: "Agent", team: "Retention", availability: "Available",  skills: ["Retention & Winback", "Upsell"],               activeCount: 3, avatarColor: "#6D28D9" },
  { id: "rw-23", name: "Wade Kimura",      initials: "WK", role: "Agent", team: "Retention", availability: "Available",  skills: ["Retention & Winback", "Churn Prevention"],    activeCount: 2, avatarColor: "#9333EA" },
  { id: "rw-24", name: "Xena Papadopoulos",initials: "XP", role: "Agent", team: "Retention", availability: "In a Call",  skills: ["Retention & Winback", "Upsell"],               activeCount: 1, avatarColor: "#166CCA" },
  { id: "rw-25", name: "Yusuf Al-Rashid",  initials: "YA", role: "Agent", team: "Retention", availability: "Available",  skills: ["Retention & Winback", "Churn Prevention"],    activeCount: 4, avatarColor: "#0891B2" },
  { id: "rw-26", name: "Zara Anand",       initials: "ZA", role: "Agent", team: "Retention", availability: "Available",  skills: ["Retention & Winback", "Upsell"],               activeCount: 2, avatarColor: "#7C3AED" },
  { id: "rw-27", name: "Axel Lindqvist",   initials: "AL", role: "Agent", team: "Retention", availability: "Away",       skills: ["Retention & Winback", "Churn Prevention"],    activeCount: 0, avatarColor: "#059669" },
  { id: "rw-28", name: "Bianca Costa",     initials: "BC", role: "Agent", team: "Retention", availability: "Available",  skills: ["Retention & Winback", "Upsell"],               activeCount: 3, avatarColor: "#BE123C" },
  { id: "rw-29", name: "Cyrus Tehrani",    initials: "CT", role: "Agent", team: "Retention", availability: "Available",  skills: ["Retention & Winback", "Churn Prevention"],    activeCount: 1, avatarColor: "#D97706" },
  { id: "rw-30", name: "Demi Papadakis",   initials: "DP", role: "Agent", team: "Retention", availability: "Available",  skills: ["Retention & Winback", "Upsell"],               activeCount: 2, avatarColor: "#DB2777" },
  { id: "rw-31", name: "Emeka Eze",        initials: "EE", role: "Agent", team: "Retention", availability: "Offline",    skills: ["Retention & Winback", "Churn Prevention"],    activeCount: 0, avatarColor: "#EA580C" },
  { id: "rw-32", name: "Fatou Diallo",     initials: "FD", role: "Agent", team: "Retention", availability: "Available",  skills: ["Retention & Winback", "Upsell"],               activeCount: 4, avatarColor: "#16A34A" },
  { id: "rw-33", name: "Glen MacLeod",     initials: "GM", role: "Agent", team: "Retention", availability: "In a Call",  skills: ["Retention & Winback", "Churn Prevention"],    activeCount: 2, avatarColor: "#0E7490" },
  { id: "rw-34", name: "Hira Qureshi",     initials: "HQ", role: "Agent", team: "Retention", availability: "Available",  skills: ["Retention & Winback", "Upsell"],               activeCount: 1, avatarColor: "#6D28D9" },
  { id: "rw-35", name: "Idris Kamara",     initials: "IK", role: "Agent", team: "Retention", availability: "Available",  skills: ["Retention & Winback", "Churn Prevention"],    activeCount: 3, avatarColor: "#9333EA" },
];

const agentTeams: AgentTeam[] = [
  { id: "team-1", name: "Billing Support",    focus: "Billing disputes, refunds, account charges",             memberIds: ["agent-1", "agent-6", "sup-3"] },
  { id: "team-2", name: "Digital Care",        focus: "Chat, email, and digital channel support",               memberIds: ["agent-2"] },
  { id: "team-3", name: "Compliance Team",     focus: "Regulatory compliance, data exports, contract renewals", memberIds: ["agent-3"] },
  { id: "team-4", name: "Risk Response",       focus: "Fraud detection, payments, wire transfer escalations",   memberIds: ["agent-4", "sup-2"] },
  { id: "team-5", name: "Enterprise Billing",  focus: "Large account billing, licensing, enterprise deals",     memberIds: ["agent-5", "sup-1"] },
  { id: "team-6", name: "Authentication Ops",  focus: "SSO, identity management, security incidents",          memberIds: ["agent-7", "sup-4"] },
  { id: "team-7", name: "Document Review",     focus: "Logistics documentation, customs, technical support",   memberIds: ["agent-8"] },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AVAILABILITY_DOT: Record<AgentAvailability, string> = {
  Available:  "bg-[#208337]",
  "In a Call": "bg-[#FFB800]",
  Away:        "bg-[#D0D5DD]",
  Offline:     "bg-[#D0D5DD]",
};

const AVAILABILITY_LABEL: Record<AgentAvailability, string> = {
  Available:  "Available",
  "In a Call": "In a Call",
  Away:        "Away",
  Offline:     "Offline",
};

const AVAILABILITY_LABEL_COLOR: Record<AgentAvailability, string> = {
  Available:  "text-[#208337]",
  "In a Call": "text-[#A37A00]",
  Away:        "text-[#667085]",
  Offline:     "text-[#98A2B3]",
};

const AVAILABILITY_TO_STATUS: Record<AgentAvailability, "online" | "away" | "offline"> = {
  Available:   "online",
  "In a Call": "online",
  Away:        "away",
  Offline:     "offline",
};

// ─── Agent sort ───────────────────────────────────────────────────────────────

type AgentSortKey = "first-name" | "last-name" | "specialty" | "availability";

const AGENT_SORT_LABELS: Record<AgentSortKey, string> = {
  "first-name":   "First Name",
  "last-name":    "Last Name",
  "specialty":    "Specialty",
  "availability": "Availability",
};

const AVAILABILITY_SORT_ORDER: Record<AgentAvailability, number> = {
  "Available":  0,
  "In a Call":  1,
  "Away":       2,
  "Offline":    3,
};

function sortAgents(agents: DirectoryAgent[], key: AgentSortKey): DirectoryAgent[] {
  return [...agents].sort((a, b) => {
    switch (key) {
      case "first-name":   return a.name.split(" ")[0]!.localeCompare(b.name.split(" ")[0]!);
      case "last-name": {
        const aLast = a.name.split(" ").slice(1).join(" ");
        const bLast = b.name.split(" ").slice(1).join(" ");
        return aLast.localeCompare(bLast);
      }
      case "specialty":    return a.team.localeCompare(b.team);
      case "availability": return AVAILABILITY_SORT_ORDER[a.availability] - AVAILABILITY_SORT_ORDER[b.availability];
      default:             return 0;
    }
  });
}

// ─── Filter dropdown ──────────────────────────────────────────────────────────

type CustomerFilterKey = "agent";
type CustomerActiveFilters = Record<CustomerFilterKey, string[]>;
const EMPTY_CUSTOMER_FILTERS: CustomerActiveFilters = { agent: [] };

function CustomerFilterDropdown({
  agents,
  activeFilters,
  onToggle,
  onClearAll,
  onClose,
}: {
  agents: string[];
  activeFilters: CustomerActiveFilters;
  onToggle: (value: string) => void;
  onClearAll: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const totalActive = activeFilters.agent.length;

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full z-50 mt-1.5 w-56 rounded-xl border border-border bg-white shadow-[0_8px_24px_rgba(16,24,40,0.12)] overflow-hidden"
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <span className="text-[12px] font-semibold text-[#333333]">Filter</span>
        {totalActive > 0 && (
          <button type="button" onClick={onClearAll} className="text-[11px] font-medium text-[#166CCA] hover:underline">
            Clear all
          </button>
        )}
      </div>
      <div className="max-h-60 overflow-y-auto px-4 py-3">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#98A2B3]">Agent</p>
        <div className="space-y-1">
          {agents.map((agent) => (
            <label key={agent} className="flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-1 hover:bg-[#F9FAFB]">
              <input
                type="checkbox"
                checked={activeFilters.agent.includes(agent)}
                onChange={() => onToggle(agent)}
                className="h-3.5 w-3.5 rounded border-[#D0D5DD] accent-[#166CCA]"
              />
              <span className="text-[12px] text-[#344054]">{agent}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────

function DirectoryTabBar({ active, onChange }: { active: DirectoryTab; onChange: (t: DirectoryTab) => void }) {
  const tabs: DirectoryTab[] = ["Customers", "Agents", "Agent Teams", "Skills"];
  return (
    <div className="flex border-b border-black/10 bg-white">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={cn(
            "relative px-4 py-3 text-[12px] font-medium whitespace-nowrap transition-colors",
            active === tab ? "text-[#166CCA]" : "text-[#7A7A7A] hover:text-[#333333]",
          )}
        >
          {tab}
          {active === tab && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full bg-[#166CCA]" />
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DirectoryPanel({
  onSelectCustomer,
}: {
  onSelectCustomer?: (customerRecordId: string) => void;
}) {
  const navigate = useNavigate();
  const {
    selectedAssignment,
    toggleCallPopunder,
    openCustomerConversation,
    openChatPopover,
    isAgentAvailable,
    isAgentInCall,
  } = useLayoutContext();

  const [activeTab, setActiveTab] = useState<DirectoryTab>("Customers");
  const [searchQuery, setSearchQuery] = useState("");
  const [customerFilters, setCustomerFilters] = useState<CustomerActiveFilters>(EMPTY_CUSTOMER_FILTERS);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [agentSort, setAgentSort] = useState<AgentSortKey>("first-name");
  const [drilldown, setDrilldown] = useState<{ type: "team" | "skill"; id: string; label: string; agents: DirectoryAgent[] } | null>(null);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isSortOpen) return;
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setIsSortOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isSortOpen]);

  const handleTabChange = (tab: DirectoryTab) => {
    setActiveTab(tab);
    setDrilldown(null);
    setSearchQuery("");
    setCustomerFilters(EMPTY_CUSTOMER_FILTERS);
    setIsFilterOpen(false);
  };

  // ── Customer data ──
  const customerRows = useMemo(
    () =>
      customerDatabase.map((c) => {
        const [firstName = c.name, ...rest] = c.name.split(" ");
        return {
          id: c.id,
          customerId: c.customerId,
          firstName,
          lastName: rest.join(" "),
          lastUpdated: c.lastUpdated,
          agent: c.profile.financialAdvisor,
        };
      }),
    [],
  );

  const uniqueCustomerAgents = useMemo(
    () => [...new Set(customerRows.map((r) => r.agent))].sort(),
    [customerRows],
  );

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return customerRows.filter((r) => {
      if (q && ![r.customerId, r.firstName, r.lastName, `${r.firstName} ${r.lastName}`].join(" ").toLowerCase().includes(q)) return false;
      if (customerFilters.agent.length > 0 && !customerFilters.agent.includes(r.agent)) return false;
      return true;
    });
  }, [customerRows, searchQuery, customerFilters]);

  // ── Agent data ──
  const filteredAgents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = q
      ? directoryAgents.filter((a) =>
          [a.name, a.role, a.team, ...a.skills].join(" ").toLowerCase().includes(q),
        )
      : directoryAgents;
    return sortAgents(filtered, agentSort);
  }, [searchQuery, agentSort]);

  // ── Team data ──
  const agentById = useMemo(
    () => Object.fromEntries(directoryAgents.map((a) => [a.id, a])),
    [],
  );

  const filteredTeams = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return agentTeams;
    return agentTeams.filter((t) =>
      [t.name, t.focus].join(" ").toLowerCase().includes(q),
    );
  }, [searchQuery]);

  // ── Skills data ──
  const allSkills = useMemo(() => {
    const map = new Map<string, DirectoryAgent[]>();
    for (const agent of directoryAgents) {
      for (const skill of agent.skills) {
        if (!map.has(skill)) map.set(skill, []);
        map.get(skill)!.push(agent);
      }
    }
    return [...map.entries()]
      .map(([skill, agents]) => ({ skill, agents }))
      .sort((a, b) => a.skill.localeCompare(b.skill));
  }, []);

  const filteredSkills = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allSkills;
    return allSkills.filter((s) =>
      s.skill.toLowerCase().includes(q) || s.agents.some((a) => a.name.toLowerCase().includes(q)),
    );
  }, [allSkills, searchQuery]);

  // ── Counts ──
  const displayCount =
    activeTab === "Customers" ? filteredCustomers.length
    : activeTab === "Agents"  ? filteredAgents.length
    : activeTab === "Agent Teams" ? filteredTeams.length
    : filteredSkills.length;

  const totalCount =
    activeTab === "Customers" ? customerRows.length
    : activeTab === "Agents"  ? directoryAgents.length
    : activeTab === "Agent Teams" ? agentTeams.length
    : allSkills.length;

  const activeFilterCount = customerFilters.agent.length;

  const searchPlaceholder =
    activeTab === "Customers" ? "Search customers…"
    : activeTab === "Agents"  ? "Search agents or skills…"
    : activeTab === "Agent Teams" ? "Search teams…"
    : "Search skills or agents…";

  const handleOpenChannel = (id: string, channel: Extract<CustomerChannel, "sms" | "email">) => {
    openCustomerConversation(id, channel);
    navigate("/activity");
  };

  const handleStartCall = (id: string, anchorRect?: DOMRect | null) => {
    toggleCallPopunder(anchorRect, id);
    navigate("/activity");
  };

  // Active filter chips (customers tab only)
  const activeChips = customerFilters.agent.map((v) => ({ key: "agent" as const, value: v }));

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#F4F6F8] dark:bg-[#0F1629]">

      {/* Header */}
      <div className="border-b border-black/10 bg-[#F4F6F8] px-5 pt-4 pb-0 dark:bg-[#0F1629]">
        <div className="pb-3">

          {/* Count row + filter button */}
          <div className="flex items-center justify-between gap-3">
            <p className="text-[13px] font-semibold text-[#333333]">
              {displayCount === totalCount
                ? `${totalCount} record${totalCount !== 1 ? "s" : ""}`
                : `${displayCount} of ${totalCount} record${totalCount !== 1 ? "s" : ""}`}
            </p>

            {/* Sort button — agents only */}
            {activeTab === "Agents" && (
              <div className="relative shrink-0" ref={sortRef}>
                <button
                  type="button"
                  onClick={() => setIsSortOpen((v) => !v)}
                  className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-2.5 py-1.5 text-[12px] font-medium text-[#344054] transition-colors hover:bg-[#F9FAFB]"
                >
                  <ArrowUpDown className="h-3.5 w-3.5" />
                  {AGENT_SORT_LABELS[agentSort]}
                </button>
                {isSortOpen && (
                  <div className="absolute right-0 top-full z-50 mt-1.5 w-44 rounded-xl border border-border bg-white shadow-[0_8px_24px_rgba(16,24,40,0.12)] overflow-hidden">
                    <div className="border-b border-border px-4 py-2.5">
                      <span className="text-[12px] font-semibold text-[#333333]">Sort by</span>
                    </div>
                    <div className="py-1">
                      {(Object.keys(AGENT_SORT_LABELS) as AgentSortKey[]).map((key) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => { setAgentSort(key); setIsSortOpen(false); }}
                          className={cn(
                            "flex w-full items-center justify-between px-4 py-2 text-[12px] transition-colors hover:bg-[#F9FAFB]",
                            agentSort === key ? "font-semibold text-[#166CCA]" : "text-[#344054]",
                          )}
                        >
                          {AGENT_SORT_LABELS[key]}
                          {agentSort === key && (
                            <span className="h-1.5 w-1.5 rounded-full bg-[#166CCA]" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Filter button — customers only */}
            {activeTab === "Customers" && (
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setIsFilterOpen((v) => !v)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] font-medium transition-colors",
                    activeFilterCount > 0
                      ? "border-[#166CCA] bg-[#EBF4FD] text-[#166CCA]"
                      : "border-border bg-white text-[#344054] hover:bg-[#F9FAFB]",
                  )}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Filter
                  {activeFilterCount > 0 && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#166CCA] text-[10px] font-bold text-white">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
                {isFilterOpen && (
                  <CustomerFilterDropdown
                    agents={uniqueCustomerAgents}
                    activeFilters={customerFilters}
                    onToggle={(v) =>
                      setCustomerFilters((prev) => ({
                        agent: prev.agent.includes(v)
                          ? prev.agent.filter((x) => x !== v)
                          : [...prev.agent, v],
                      }))
                    }
                    onClearAll={() => setCustomerFilters(EMPTY_CUSTOMER_FILTERS)}
                    onClose={() => setIsFilterOpen(false)}
                  />
                )}
              </div>
            )}
          </div>

          {/* Active filter chips */}
          {activeChips.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {activeChips.map(({ value }) => (
                <span
                  key={value}
                  className="inline-flex items-center gap-1 rounded-full bg-[#EBF4FD] px-2.5 py-1 text-[11px] font-medium text-[#166CCA]"
                >
                  {value}
                  <button
                    type="button"
                    onClick={() =>
                      setCustomerFilters((prev) => ({
                        agent: prev.agent.filter((v) => v !== value),
                      }))
                    }
                    className="ml-0.5 text-[#166CCA] opacity-70 hover:opacity-100"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Search */}
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#98A2B3]" />
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 rounded-full border-black/10 bg-[#F8F8F9] pl-9 text-[12px] text-[#111827] placeholder:text-[#98A2B3]"
            />
          </div>
        </div>

        <DirectoryTabBar active={activeTab} onChange={handleTabChange} />
      </div>

      {/* Content */}
      {/* ── Drilldown view (Skills / Agent Teams) ── */}
      {drilldown && (
        <div className="flex min-h-0 flex-1 flex-col">
          {/* Drilldown header */}
          <div className="flex items-center gap-2 border-b border-black/[0.08] bg-[#F4F6F8] px-4 py-3 dark:bg-[#0F1629]">
            <button
              type="button"
              onClick={() => setDrilldown(null)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#667085] transition-colors hover:bg-black/[0.06] hover:text-[#1D2939] dark:hover:bg-white/[0.08]"
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-[#1D2939] dark:text-[#E2E8F0] leading-tight">{drilldown.label}</p>
              <p className="text-[11px] text-[#667085] dark:text-[#6B7FA0]">{drilldown.agents.length} agent{drilldown.agents.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          {/* Agent list */}
          <ScrollArea className="min-h-0 flex-1">
            <div className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
              {drilldown.agents.map((agent) => {
                const canCall = agent.availability === "Available";
                const isOffline = agent.availability === "Offline";
                const agentStatus = AVAILABILITY_TO_STATUS[agent.availability];
                return (
                  <div key={agent.id} data-agent-row className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                    <div className="relative shrink-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ backgroundColor: agent.avatarColor }}>
                        {agent.initials}
                      </div>
                      <span className={cn("absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-white dark:border-[#0F1629]", AVAILABILITY_DOT[agent.availability])} />
                    </div>
                    <div className="w-[300px] min-w-0 shrink-0">
                      <p className="text-[13px] font-semibold text-[#1D2939] dark:text-[#E2E8F0] leading-tight">{agent.name}</p>
                      <p className="text-[11px] text-[#667085] dark:text-[#6B7FA0]">
                        {agent.role} · <span className={cn("font-medium", AVAILABILITY_LABEL_COLOR[agent.availability])}>{AVAILABILITY_LABEL[agent.availability]}</span>
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button type="button" title={canCall ? `Call ${agent.name}` : `${agent.name} unavailable`} disabled={!canCall}
                        onClick={(e) => { const rect = (e.currentTarget as HTMLElement).closest("[data-agent-row]")?.getBoundingClientRect() ?? null; openChatPopover(rect, { id: agent.id, name: agent.name, initials: agent.initials, role: `${agent.role} · ${agent.team}`, avatarColor: agent.avatarColor, status: agentStatus }, true); }}
                        className={cn("flex h-6 w-6 items-center justify-center rounded-full transition-colors", canCall ? "bg-[#EFFBF1] text-[#208337] hover:bg-[#D1FAD7]" : "bg-[#F2F4F7] text-[#D0D5DD] cursor-not-allowed dark:bg-[#1C2A3A]")}
                      ><Phone className="h-3 w-3" /></button>
                      <button type="button" title={isOffline ? `${agent.name} is offline` : `Message ${agent.name}`} disabled={isOffline}
                        onClick={(e) => { const rect = (e.currentTarget as HTMLElement).closest("[data-agent-row]")?.getBoundingClientRect() ?? null; openChatPopover(rect, { id: agent.id, name: agent.name, initials: agent.initials, role: `${agent.role} · ${agent.team}`, avatarColor: agent.avatarColor, status: agentStatus }); }}
                        className={cn("flex h-6 w-6 items-center justify-center rounded-full transition-colors", isOffline ? "bg-[#F2F4F7] text-[#D0D5DD] cursor-not-allowed dark:bg-[#1C2A3A]" : "bg-[#EBF4FD] text-[#166CCA] hover:bg-[#D6EBFB]")}
                      ><MessageCircle className="h-3 w-3" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      )}

      <div className={cn("min-h-0 flex-1", drilldown ? "hidden" : "")}>
        <ScrollArea className="h-full min-h-0">
          <div className="space-y-2 p-3 max-w-[600px]">

            {/* ── Customers ── */}
            {activeTab === "Customers" && (
              filteredCustomers.length === 0 ? <EmptyState message="No customers found." /> :
              filteredCustomers.map((row) => {
                const isSelected = selectedAssignment.customerRecordId === row.id;
                return (
                  <div
                    key={row.id}
                    className={cn(
                      "rounded-xl border bg-white p-3.5 shadow-[0_2px_8px_rgba(15,23,42,0.05)] transition-all",
                      isSelected
                        ? "border-[#166CCA] shadow-[0_4px_16px_rgba(0,109,173,0.12)]"
                        : "border-black/10 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(15,23,42,0.08)]",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectCustomer?.(row.id)}
                        className="flex min-w-0 flex-1 flex-col items-start text-left"
                      >
                        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#667085]">
                          {row.customerId}
                        </span>
                        <span className="mt-0.5 text-[13px] font-semibold text-[#111827]">
                          {row.firstName} {row.lastName}
                        </span>
                        <span className="mt-1 text-[11px] text-[#98A2B3]">Updated {row.lastUpdated}</span>
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 shrink-0 rounded-full border-black/10 bg-white px-2.5 text-[12px] text-[#333333] hover:bg-[#F8F8F9]"
                          >
                            Contact <ChevronDown className="ml-1.5 h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-40 rounded-2xl border border-black/10 bg-white p-1 shadow-[0_18px_50px_rgba(15,23,42,0.14)]"
                        >
                          <DropdownMenuItem
                            onClick={(e) => handleStartCall(row.id, e.currentTarget.getBoundingClientRect())}
                            disabled={!isAgentAvailable || isAgentInCall}
                            className="rounded-xl px-3 py-2 text-sm text-[#111827]"
                          >
                            <Phone className="mr-2 h-3.5 w-3.5" /> Call
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleOpenChannel(row.id, "email")}
                            className="rounded-xl px-3 py-2 text-sm text-[#111827]"
                          >
                            <Mail className="mr-2 h-3.5 w-3.5" /> Email
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleOpenChannel(row.id, "sms")}
                            className="rounded-xl px-3 py-2 text-sm text-[#111827]"
                          >
                            <MessageSquare className="mr-2 h-3.5 w-3.5" /> SMS
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })
            )}

            {/* ── Agents ── */}
            {activeTab === "Agents" && (
              filteredAgents.length === 0 ? <EmptyState message="No agents found." /> : (
                <div className="space-y-2">
                  {filteredAgents.map((agent) => {
                    const canCall = agent.availability === "Available";
                    const isOffline = agent.availability === "Offline";
                    const agentStatus = AVAILABILITY_TO_STATUS[agent.availability];
                    return (
                      <div
                        key={agent.id}
                        data-agent-row
                        className="flex items-center gap-3 rounded-xl border border-black/10 bg-white p-3.5 shadow-[0_2px_8px_rgba(15,23,42,0.05)] transition-all hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(15,23,42,0.08)] dark:border-white/[0.08] dark:bg-[#131F35]"
                      >
                        {/* Avatar with status dot */}
                        <div className="relative shrink-0">
                          <div
                            className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold text-white"
                            style={{ backgroundColor: agent.avatarColor }}
                          >
                            {agent.initials}
                          </div>
                          <span className={cn("absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-white dark:border-[#0F1629]", AVAILABILITY_DOT[agent.availability])} />
                        </div>

                        {/* Name / role / skills */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-[13px] font-semibold text-[#1D2939] dark:text-[#E2E8F0]">{agent.name}</p>
                            <span className={cn("text-[11px] font-medium", AVAILABILITY_LABEL_COLOR[agent.availability])}>
                              · {AVAILABILITY_LABEL[agent.availability]}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#667085] dark:text-[#6B7FA0]">
                            {agent.role} · {agent.team}
                          </p>
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {agent.skills.map((skill) => (
                              <span
                                key={skill}
                                className="rounded-full bg-[#F2F4F7] dark:bg-[#1C2A3A] px-2 py-0.5 text-[10px] font-medium text-[#475467] dark:text-[#8898AB]"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex shrink-0 items-center gap-1">

                          {/* Call */}
                          <button
                            type="button"
                            title={canCall ? `Call ${agent.name}` : agent.availability === "In a Call" ? "Agent is in a call" : `${agent.name} is ${agent.availability.toLowerCase()}`}
                            disabled={!canCall}
                            onClick={(e) => {
                              const rowEl = (e.currentTarget as HTMLElement).closest("[data-agent-row]");
                              const rect = rowEl?.getBoundingClientRect() ?? null;
                              openChatPopover(rect, { id: agent.id, name: agent.name, initials: agent.initials, role: `${agent.role} · ${agent.team}`, avatarColor: agent.avatarColor, status: agentStatus }, true);
                            }}
                            className={cn(
                              "flex h-7 w-7 items-center justify-center rounded-full transition-colors",
                              canCall
                                ? "bg-[#EFFBF1] text-[#208337] hover:bg-[#D1FAD7]"
                                : isOffline
                                ? "bg-[#F2F4F7] text-[#D0D5DD] cursor-not-allowed dark:bg-[#1C2A3A]"
                                : "bg-[#FFF8E1] text-[#A37A00] cursor-not-allowed",
                            )}
                          >
                            <Phone className="h-3.5 w-3.5" />
                          </button>

                          {/* Chat */}
                          <button
                            type="button"
                            title={isOffline ? `${agent.name} is offline` : `Message ${agent.name}`}
                            disabled={isOffline}
                            onClick={(e) => {
                              const rowEl = (e.currentTarget as HTMLElement).closest("[data-agent-row]");
                              const rect = rowEl?.getBoundingClientRect() ?? null;
                              openChatPopover(rect, { id: agent.id, name: agent.name, initials: agent.initials, role: `${agent.role} · ${agent.team}`, avatarColor: agent.avatarColor, status: agentStatus });
                            }}
                            className={cn(
                              "flex h-7 w-7 items-center justify-center rounded-full transition-colors",
                              isOffline
                                ? "bg-[#F2F4F7] text-[#D0D5DD] cursor-not-allowed dark:bg-[#1C2A3A]"
                                : "bg-[#EBF4FD] text-[#166CCA] hover:bg-[#D6EBFB]",
                            )}
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {/* ── Agent Teams ── */}
            {activeTab === "Agent Teams" && !drilldown && (
              filteredTeams.length === 0 ? <EmptyState message="No teams found." /> :
              filteredTeams.map((team) => {
                const members = team.memberIds.map((id) => agentById[id]).filter(Boolean);
                return (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() => setDrilldown({ type: "team", id: team.id, label: team.name, agents: members })}
                    className="flex w-full items-start gap-3 rounded-xl border border-black/10 dark:border-white/8 bg-white dark:bg-[#0F1629] p-3.5 shadow-[0_2px_8px_rgba(15,23,42,0.05)] text-left transition-all hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(15,23,42,0.08)]"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EBF4FD] dark:bg-[#0B1E35]">
                      <Users className="h-4 w-4 text-[#166CCA]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-[#1D2939] dark:text-[#E2E8F0]">{team.name}</p>
                      <p className="mt-0.5 text-[11px] text-[#667085] dark:text-[#6B7FA0] leading-relaxed">{team.focus}</p>
                      <div className="mt-2.5 flex items-center gap-1.5">
                        <div className="flex -space-x-1.5">
                          {members.slice(0, 5).map((m) => (
                            <div key={m.id} title={m.name} className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white dark:border-[#0F1629] text-[9px] font-bold bg-[#F2F4F7] dark:bg-[#1C2A3A] text-[#475467] dark:text-[#8898AB]">
                              {m.initials}
                            </div>
                          ))}
                        </div>
                        <span className="text-[11px] text-[#98A2B3] dark:text-[#4E6A85]">
                          {members.length} member{members.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                    <ChevronDown className="mt-1 h-4 w-4 shrink-0 -rotate-90 text-[#98A2B3]" />
                  </button>
                );
              })
            )}

            {/* ── Skills ── */}
            {activeTab === "Skills" && !drilldown && (
              filteredSkills.length === 0 ? <EmptyState message="No skills found." /> :
              filteredSkills.map(({ skill, agents }) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => setDrilldown({ type: "skill", id: skill, label: skill, agents })}
                  className="flex w-full items-center gap-3 rounded-xl border border-black/10 dark:border-white/8 bg-white dark:bg-[#0F1629] p-3.5 shadow-[0_2px_8px_rgba(15,23,42,0.05)] text-left transition-all hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(15,23,42,0.08)]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-[#1D2939] dark:text-[#E2E8F0]">{skill}</p>
                    <p className="mt-0.5 text-[11px] text-[#667085] dark:text-[#6B7FA0]">{agents.length} agent{agents.length !== 1 ? "s" : ""}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {agents.slice(0, 6).map((a) => (
                        <span key={a.id} className="inline-flex items-center gap-1 rounded-full bg-[#F2F4F7] dark:bg-[#1C2A3A] px-2 py-0.5 text-[10px] font-medium text-[#475467] dark:text-[#8898AB]">
                          <span className={cn("h-1.5 w-1.5 rounded-full", AVAILABILITY_DOT[a.availability])} />
                          {a.name}
                        </span>
                      ))}
                      {agents.length > 6 && (
                        <span className="inline-flex items-center rounded-full bg-[#F2F4F7] dark:bg-[#1C2A3A] px-2 py-0.5 text-[10px] font-medium text-[#98A2B3]">
                          +{agents.length - 6} more
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 shrink-0 -rotate-90 text-[#98A2B3]" />
                </button>
              ))
            )}

          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-black/10 bg-white px-4 py-8 text-center text-[13px] text-[#98A2B3]">
      {message}
    </div>
  );
}
