import { useMemo, useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Mail, MessageCircle, MessageSquare, Phone, Search, SlidersHorizontal, Users, X } from "lucide-react";

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
  { id: "agent-1", name: "Jeff Comstock",   initials: "JC", role: "Agent",      team: "Billing Support",    availability: "Available",  skills: ["Billing", "Account Management", "Escalations"],       activeCount: 2, avatarColor: "#166CCA" },
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

  const handleTabChange = (tab: DirectoryTab) => {
    setActiveTab(tab);
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
    if (!q) return directoryAgents;
    return directoryAgents.filter((a) =>
      [a.name, a.role, a.team, ...a.skills].join(" ").toLowerCase().includes(q),
    );
  }, [searchQuery]);

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
    <div className="flex min-h-0 flex-1 flex-col bg-[#F8F8F9]">

      {/* Header */}
      <div className="border-b border-black/10 bg-white px-5 pt-4 pb-0">
        <div className="pb-3">

          {/* Count row + filter button */}
          <div className="flex items-center justify-between gap-3">
            <p className="text-[13px] font-semibold text-[#333333]">
              {displayCount === totalCount
                ? `${totalCount} record${totalCount !== 1 ? "s" : ""}`
                : `${displayCount} of ${totalCount} record${totalCount !== 1 ? "s" : ""}`}
            </p>

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
      <div className="min-h-0 flex-1">
        <ScrollArea className="h-full min-h-0">
          <div className="space-y-2 p-3">

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
              filteredAgents.length === 0 ? <EmptyState message="No agents found." /> :
              filteredAgents.map((agent) => {
                const canCall = agent.availability === "Available";
                const isOffline = agent.availability === "Offline";
                const agentStatus = AVAILABILITY_TO_STATUS[agent.availability];
                return (
                  <div
                    key={agent.id}
                    className="rounded-xl border border-black/10 dark:border-white/8 bg-white dark:bg-[#0F1629] p-3.5 shadow-[0_2px_8px_rgba(15,23,42,0.05)] transition-all hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(15,23,42,0.08)]"
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar with status dot */}
                      <div className="relative shrink-0">
                        <div
                          className="flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-bold text-white"
                          style={{ backgroundColor: agent.avatarColor }}
                        >
                          {agent.initials}
                        </div>
                        <span className={cn("absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-[#0F1629]", AVAILABILITY_DOT[agent.availability])} />
                      </div>

                      {/* Name / role / skills */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] font-semibold text-[#1D2939] dark:text-[#E2E8F0]">{agent.name}</p>
                          <span className={cn("text-[11px] font-medium", AVAILABILITY_LABEL_COLOR[agent.availability])}>
                            · {AVAILABILITY_LABEL[agent.availability]}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-[#667085] dark:text-[#6B7FA0]">
                          {agent.role} · {agent.team}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
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
                      <div className="flex shrink-0 items-center gap-1.5">
                        {/* Voice call */}
                        <button
                          type="button"
                          title={canCall ? `Call ${agent.name}` : agent.availability === "In a Call" ? "Agent is in a call" : `${agent.name} is ${agent.availability.toLowerCase()}`}
                          disabled={!canCall}
                          onClick={(e) => {
                            const cardEl = (e.currentTarget as HTMLElement).closest(".rounded-xl");
                            const rect = cardEl?.getBoundingClientRect() ?? null;
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

                        {/* Chat / message */}
                        <button
                          type="button"
                          title={isOffline ? `${agent.name} is offline` : `Message ${agent.name}`}
                          disabled={isOffline}
                          onClick={(e) => {
                            const cardEl = (e.currentTarget as HTMLElement).closest(".rounded-xl");
                            const rect = cardEl?.getBoundingClientRect() ?? null;
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
                  </div>
                );
              })
            )}

            {/* ── Agent Teams ── */}
            {activeTab === "Agent Teams" && (
              filteredTeams.length === 0 ? <EmptyState message="No teams found." /> :
              filteredTeams.map((team) => {
                const members = team.memberIds.map((id) => agentById[id]).filter(Boolean);
                return (
                  <div
                    key={team.id}
                    className="rounded-xl border border-black/10 dark:border-white/8 bg-white dark:bg-[#0F1629] p-3.5 shadow-[0_2px_8px_rgba(15,23,42,0.05)] transition-all hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(15,23,42,0.08)]"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EBF4FD] dark:bg-[#0B1E35]">
                        <Users className="h-4 w-4 text-[#166CCA]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold text-[#1D2939] dark:text-[#E2E8F0]">{team.name}</p>
                        <p className="mt-0.5 text-[11px] text-[#667085] dark:text-[#6B7FA0] leading-relaxed">{team.focus}</p>
                        {/* Member avatars */}
                        <div className="mt-2.5 flex items-center gap-1.5">
                          <div className="flex -space-x-1.5">
                            {members.slice(0, 5).map((m) => (
                              <div
                                key={m.id}
                                title={m.name}
                                className={cn(
                                  "flex h-6 w-6 items-center justify-center rounded-full border-2 border-white dark:border-[#0F1629] text-[9px] font-bold",
                                  "bg-[#F2F4F7] dark:bg-[#1C2A3A] text-[#475467] dark:text-[#8898AB]",
                                )}
                              >
                                {m.initials}
                              </div>
                            ))}
                          </div>
                          <span className="text-[11px] text-[#98A2B3] dark:text-[#4E6A85]">
                            {members.length} member{members.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* ── Skills ── */}
            {activeTab === "Skills" && (
              filteredSkills.length === 0 ? <EmptyState message="No skills found." /> :
              filteredSkills.map(({ skill, agents }) => (
                <div
                  key={skill}
                  className="rounded-xl border border-black/10 dark:border-white/8 bg-white dark:bg-[#0F1629] p-3.5 shadow-[0_2px_8px_rgba(15,23,42,0.05)] transition-all hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(15,23,42,0.08)]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-[#1D2939] dark:text-[#E2E8F0]">{skill}</p>
                      <p className="mt-0.5 text-[11px] text-[#667085] dark:text-[#6B7FA0]">
                        {agents.length} agent{agents.length !== 1 ? "s" : ""}
                      </p>
                      {/* Agent name pills */}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {agents.map((a) => (
                          <span
                            key={a.id}
                            className="inline-flex items-center gap-1 rounded-full bg-[#F2F4F7] dark:bg-[#1C2A3A] border border-transparent dark:border-white/8 px-2 py-0.5 text-[10px] font-medium text-[#475467] dark:text-[#8898AB]"
                          >
                            <span className={cn("h-1.5 w-1.5 rounded-full", AVAILABILITY_DOT[a.availability])} />
                            {a.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
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
