import React, { useState } from "react";
import {
  Search,
  Globe,
  MessageCircle,
  ShoppingCart,
  Package,
  UserCheck,
  Ticket,
  Mail,
  Activity,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type CustomerHistoryItem,
  type CustomerHistoryItemType,
  type CustomerHistoryDot,
  type CustomerHistoryInteraction,
} from "@/lib/customer-database";

const historyTypeConfig: Record<
  CustomerHistoryItemType,
  { icon: React.ElementType; accent: string; iconBg: string }
> = {
  search: { icon: Search, accent: "#667085", iconBg: "#F2F4F7" },
  web: { icon: Globe, accent: "#667085", iconBg: "#F2F4F7" },
  chat: { icon: MessageCircle, accent: "#166CCA", iconBg: "#EBF4FD" },
  purchase: { icon: ShoppingCart, accent: "#208337", iconBg: "#F0FDF4" },
  shipping: { icon: Package, accent: "#667085", iconBg: "#F2F4F7" },
  registration: { icon: UserCheck, accent: "#208337", iconBg: "#F0FDF4" },
  ticket: { icon: Ticket, accent: "#F59E0B", iconBg: "#FFFBEB" },
  email: { icon: Mail, accent: "#F59E0B", iconBg: "#FFFBEB" },
  system: { icon: Activity, accent: "#667085", iconBg: "#F2F4F7" },
  handoff: { icon: UserCheck, accent: "#E32926", iconBg: "#FEF2F2" },
  lead: { icon: ClipboardList, accent: "#166CCA", iconBg: "#EBF4FD" },
};

const dotColorClass = (dot: CustomerHistoryDot) =>
  dot === "blue"
    ? "bg-[#166CCA]"
    : dot === "green"
      ? "bg-[#208337]"
      : dot === "orange"
        ? "bg-[#F59E0B]"
        : dot === "red"
          ? "bg-[#E32926]"
          : dot === "purple"
            ? "bg-[#7C3AED]"
            : "bg-[#D0D5DD]";

const interactionViewLabel = (interaction: CustomerHistoryInteraction): string => {
  switch (interaction.kind) {
    case "chat":
      return "Chat Transcript";
    case "search":
      return "Search Results";
    case "web":
      return "Page Visit";
    case "purchase":
      return "Order Details";
    case "shipping":
      return "Shipment Tracking";
    case "ticket":
      return "Ticket Thread";
    case "email":
      return "Email";
    case "registration":
      return "Registration Record";
    case "lead":
      return "Lead Form";
  }
};

const renderInteractionContent = (interaction: CustomerHistoryInteraction, customerInitials: string) => {
  if (interaction.kind === "chat") {
    return (
      <div className="space-y-3">
        {interaction.messages.map((msg, i) => {
          const isCustomer = msg.sender === "customer";
          return (
            <div key={i} className={cn("flex gap-2.5", isCustomer ? "flex-row" : "flex-row-reverse")}>
              <div
                className={cn(
                  "shrink-0 mt-0.5 h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-bold select-none",
                  isCustomer
                    ? "bg-[#C5DEF5] text-[#1260B0]"
                    : "bg-[#E8F0FE] text-[#166CCA]"
                )}
              >
                {isCustomer ? customerInitials : msg.name?.[0] ?? "B"}
              </div>
              <div className={cn("max-w-[80%] space-y-0.5", isCustomer ? "items-start" : "items-end")}>
                <div
                  className={cn(
                    "rounded-2xl px-3.5 py-2.5",
                    isCustomer
                      ? "rounded-tl-sm bg-[#F2F4F7] dark:bg-[#141E2C] text-[#344054] dark:text-[#CBD5E1]"
                      : "rounded-tr-sm bg-[#166CCA] text-white"
                  )}
                >
                  <p className="text-[12px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                </div>
                {msg.time && (
                  <p
                    className={cn(
                      "text-[10px] text-[#98A2B3] px-1",
                      isCustomer ? "" : "text-right"
                    )}
                  >
                    {msg.time}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (interaction.kind === "search") {
    return (
      <div className="space-y-1">
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-[#E4E7EC] dark:border-[#1B3A52] bg-white dark:bg-[#0F1629] px-3 py-2">
          <Search className="h-3.5 w-3.5 shrink-0 text-[#98A2B3]" />
          <span className="text-[12px] text-[#344054] dark:text-[#CBD5E1]">{interaction.query}</span>
        </div>
        {interaction.results.map((r, i) => (
          <div
            key={i}
            className={cn(
              "rounded-xl border px-3.5 py-3 space-y-0.5",
              r.clicked
                ? "border-[#166CCA]/30 bg-[#EBF4FD] dark:bg-[#0C1F33] dark:border-[#166CCA]/30"
                : "border-[#E4E7EC] dark:border-[#1B3A52] bg-white dark:bg-[#0F1629]"
            )}
          >
            <div className="flex items-center gap-1.5">
              {r.clicked && <div className="h-1.5 w-1.5 rounded-full bg-[#166CCA] shrink-0" />}
              <p
                className={cn(
                  "text-[12px] font-semibold leading-snug",
                  r.clicked
                    ? "text-[#166CCA]"
                    : "text-[#344054] dark:text-white"
                )}
              >
                {r.title}
              </p>
            </div>
            <p className="text-[10px] text-[#98A2B3]">{r.url}</p>
            <p className="text-[11px] text-[#667085] dark:text-[#8BACC4] leading-relaxed">
              {r.snippet}
            </p>
            {r.clicked && (
              <p className="text-[10px] font-medium text-[#166CCA]">← Clicked</p>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (interaction.kind === "web") {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-[#E4E7EC] dark:border-[#1B3A52] bg-white dark:bg-[#0F1629] px-4 py-3 space-y-1">
          <p className="text-[10px] text-[#98A2B3] uppercase tracking-widest font-semibold">URL</p>
          <p className="text-[11px] font-mono text-[#166CCA] break-all">{interaction.url}</p>
          <p className="text-[12px] font-semibold text-[#111827] dark:text-white pt-0.5">
            {interaction.title}
          </p>
        </div>
        {interaction.description && (
          <div className="rounded-xl border border-[#E4E7EC] dark:border-[#1B3A52] bg-[#F9FAFB] dark:bg-[#0F1629] px-4 py-3">
            <p className="text-[12px] leading-relaxed text-[#344054] dark:text-[#CBD5E1]">
              {interaction.description}
            </p>
          </div>
        )}
        {interaction.sectionsViewed && interaction.sectionsViewed.length > 0 && (
          <div className="rounded-xl border border-[#E4E7EC] dark:border-[#1B3A52] bg-white dark:bg-[#0F2233] overflow-hidden">
            <p className="px-3 pt-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#98A2B3]">
              Sections Viewed
            </p>
            <div className="divide-y divide-[#F2F4F7] dark:divide-[#1B3A52]">
              {interaction.sectionsViewed.map((s, i) => (
                <div key={i} className="flex items-start gap-2 px-3 py-2">
                  <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#D0D5DD] shrink-0" />
                  <p className="text-[11px] text-[#344054] dark:text-[#CBD5E1] leading-relaxed">
                    {s}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (interaction.kind === "purchase") {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-[#E4E7EC] dark:border-[#1B3A52] bg-white dark:bg-[#0F2233] overflow-hidden">
          <p className="px-3 pt-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#98A2B3]">
            Order #{interaction.orderId}
          </p>
          <div className="divide-y divide-[#F2F4F7] dark:divide-[#1B3A52]">
            {interaction.items.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-3 py-2.5 gap-3"
              >
                <div>
                  <p className="text-[12px] font-medium text-[#344054] dark:text-[#CBD5E1]">
                    {item.name}
                  </p>
                  <p className="text-[10px] text-[#98A2B3]">Qty: {item.qty}</p>
                </div>
                <p className="text-[12px] font-semibold text-[#344054] dark:text-white">
                  {item.price}
                </p>
              </div>
            ))}
            <div className="flex items-center justify-between px-3 py-2.5 bg-[#F9FAFB] dark:bg-[#0C1A26]">
              <p className="text-[12px] font-semibold text-[#344054] dark:text-[#CBD5E1]">
                Total
              </p>
              <p className="text-[13px] font-bold text-[#166CCA]">{interaction.total}</p>
            </div>
          </div>
        </div>
        {(interaction.paymentMethod || interaction.shippingAddress) && (
          <div className="rounded-xl border border-[#E4E7EC] dark:border-[#1B3A52] bg-white dark:bg-[#0F2233] overflow-hidden">
            <p className="px-3 pt-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#98A2B3]">
              Details
            </p>
            <div className="divide-y divide-[#F2F4F7] dark:divide-[#1B3A52]">
              {interaction.paymentMethod && (
                <div className="flex items-start gap-3 px-3 py-2">
                  <span className="shrink-0 text-[11px] font-medium text-[#98A2B3] w-[90px]">
                    Payment
                  </span>
                  <span className="text-[11px] text-[#344054] dark:text-[#CBD5E1]">
                    {interaction.paymentMethod}
                  </span>
                </div>
              )}
              {interaction.shippingAddress && (
                <div className="flex items-start gap-3 px-3 py-2">
                  <span className="shrink-0 text-[11px] font-medium text-[#98A2B3] w-[90px]">
                    Ship to
                  </span>
                  <span className="text-[11px] text-[#344054] dark:text-[#CBD5E1]">
                    {interaction.shippingAddress}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (interaction.kind === "shipping") {
    return (
      <div className="space-y-2">
        <div className="rounded-xl border border-[#E4E7EC] dark:border-[#1B3A52] bg-white dark:bg-[#0F1629] px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-[#98A2B3] uppercase tracking-widest font-semibold">
              {interaction.carrier}
            </p>
            <p className="text-[12px] font-mono text-[#344054] dark:text-[#CBD5E1] mt-0.5">
              {interaction.trackingNumber}
            </p>
          </div>
          <Package className="h-4 w-4 text-[#98A2B3]" />
        </div>
        <div className="space-y-0">
          {interaction.events.map((ev, i) => (
            <div key={i} className="relative pl-7">
              <div className="absolute left-[9px] top-0 bottom-0 w-px bg-[#E4E7EC] dark:bg-[#1B3A52]" />
              <div
                className={cn(
                  "absolute left-[5px] top-3 h-[9px] w-[9px] rounded-full border-2",
                  ev.isDelivered
                    ? "bg-[#12B76A] border-[#12B76A]"
                    : i === 0
                      ? "bg-[#166CCA] border-[#166CCA]"
                      : "bg-white dark:bg-[#0C1A26] border-[#D0D5DD] dark:border-[#2D4A63]"
                )}
              />
              <div className="py-2.5">
                <p
                  className={cn(
                    "text-[12px] font-semibold",
                    ev.isDelivered
                      ? "text-[#12B76A]"
                      : "text-[#344054] dark:text-white"
                  )}
                >
                  {ev.status}
                </p>
                <p className="text-[11px] text-[#667085] dark:text-[#8BACC4]">
                  {ev.location}
                </p>
                <p className="text-[10px] text-[#98A2B3] mt-0.5">{ev.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (interaction.kind === "ticket") {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-[#E4E7EC] dark:border-[#1B3A52] bg-white dark:bg-[#0F1629] px-4 py-3">
          <p className="text-[10px] text-[#98A2B3] uppercase tracking-widest font-semibold mb-0.5">
            {interaction.ticketId}
          </p>
          <p className="text-[13px] font-semibold text-[#111827] dark:text-white leading-snug">
            {interaction.subject}
          </p>
        </div>
        <div className="space-y-2">
          {interaction.notes.map((note, i) => (
            <div
              key={i}
              className={cn(
                "rounded-xl border px-3.5 py-3 space-y-1",
                note.isInternal
                  ? "border-[#FEC84B]/40 bg-[#FFFCF0] dark:bg-[#1F1A00] dark:border-[#FEC84B]/20"
                  : "border-[#E4E7EC] dark:border-[#1B3A52] bg-white dark:bg-[#0F1629]"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold text-[#344054] dark:text-[#CBD5E1]">
                  {note.author}
                </p>
                <p className="text-[10px] text-[#98A2B3] shrink-0">{note.time}</p>
              </div>
              {note.isInternal && (
                <p className="text-[9px] font-semibold uppercase tracking-widest text-[#B54708]">
                  Internal
                </p>
              )}
              <p className="text-[11px] text-[#667085] dark:text-[#8BACC4] leading-relaxed">
                {note.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (interaction.kind === "email") {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-[#E4E7EC] dark:border-[#1B3A52] bg-white dark:bg-[#0F2233] overflow-hidden">
          <div className="divide-y divide-[#F2F4F7] dark:divide-[#1B3A52]">
            {[
              { label: "From", value: interaction.from },
              { label: "To", value: interaction.to },
              { label: "Subject", value: interaction.subject },
              { label: "Sent", value: interaction.sentAt },
              {
                label: "Status",
                value: interaction.opened ? "Opened" : "Not opened",
              },
            ].map((row) => (
              <div key={row.label} className="flex items-start gap-3 px-3 py-2">
                <span className="shrink-0 text-[11px] font-medium text-[#98A2B3] w-[54px]">
                  {row.label}
                </span>
                <span className="text-[11px] text-[#344054] dark:text-[#CBD5E1] leading-relaxed">
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-[#E4E7EC] dark:border-[#1B3A52] bg-[#F9FAFB] dark:bg-[#0F1629] px-4 py-3">
          <p className="text-[12px] leading-relaxed text-[#344054] dark:text-[#CBD5E1] whitespace-pre-wrap font-mono text-[11px]">
            {interaction.body}
          </p>
        </div>
      </div>
    );
  }

  if (interaction.kind === "registration") {
    return (
      <div className="rounded-xl border border-[#E4E7EC] dark:border-[#1B3A52] bg-white dark:bg-[#0F2233] overflow-hidden">
        <p className="px-3 pt-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#98A2B3]">
          Registration Record
        </p>
        <div className="divide-y divide-[#F2F4F7] dark:divide-[#1B3A52]">
          {interaction.fields.map((f) => (
            <div key={f.label} className="flex items-start gap-3 px-3 py-2">
              <span className="shrink-0 text-[11px] font-medium text-[#98A2B3] w-[110px]">
                {f.label}
              </span>
              <span className="text-[11px] text-[#344054] dark:text-[#CBD5E1] leading-relaxed">
                {f.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (interaction.kind === "lead") {
    const leadFields = [
      { section: "Contact", fields: [
        { label: "Name", value: "Terry Williams" },
        { label: "Title", value: "VP of Operations" },
        { label: "Company", value: "Nexus Freight" },
        { label: "Email", value: "t.williams@nexusfreight.com" },
        { label: "Phone", value: "+1 (408) 555-0134" },
        { label: "Location", value: "San Jose, CA" },
      ]},
      { section: "Opportunity", fields: [
        { label: "Lead Type", value: "Enterprise — New logo" },
        { label: "Lead Source", value: "Web callback — pricing page" },
        { label: "Annual Budget", value: "$400,000" },
        { label: "Timeline", value: "Before Q4 2025" },
        { label: "Industry", value: "Freight & Logistics" },
        { label: "Company Size", value: "~200 employees" },
      ]},
      { section: "Qualification", fields: [
        { label: "Pain Point", value: "Legacy TMS replacement; warehouse integration failures" },
        { label: "Stakeholders", value: "Terry Williams (primary); CTO (to be confirmed)" },
        { label: "Next Step", value: "Technical deep-dive with solutions engineer — this week" },
      ]},
    ];
    return (
      <div className="flex flex-col gap-5">
        {leadFields.map((section) => (
          <div key={section.section} className="flex flex-col gap-2.5">
            <div className="flex items-center gap-3">
              <span className="text-[9px] font-semibold uppercase tracking-widest text-[#98A2B3]">{section.section}</span>
              <div className="flex-1 h-px bg-[#F2F4F7]" />
            </div>
            <div className="flex flex-col gap-2">
              {section.fields.map((f) => (
                <div key={f.label} className="flex items-baseline gap-2">
                  <span className="shrink-0 text-[11px] font-medium text-[#98A2B3] w-[110px]">{f.label}</span>
                  <span className="text-[11px] text-[#344054] dark:text-[#CBD5E1] leading-relaxed">{f.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return null;
};

export default function CustomerHistoryTimeline({
  historyItems,
  selectedHistoryItemId: controlledSelectedId,
  onSelectedHistoryItemIdChange,
  viewingInteraction: controlledViewingInteraction,
  onViewingInteractionChange,
}: {
  historyItems: CustomerHistoryItem[];
  /** When provided, the component runs in controlled mode — selection state lives in the parent. */
  selectedHistoryItemId?: string | null;
  onSelectedHistoryItemIdChange?: (id: string | null) => void;
  viewingInteraction?: boolean;
  onViewingInteractionChange?: (viewing: boolean) => void;
}) {
  // Uncontrolled (local) state — used only when the parent doesn't supply controlled props.
  const [localSelectedId, setLocalSelectedId] = useState<string | null>(null);
  const [localViewingInteraction, setLocalViewingInteraction] = useState(false);

  const isControlled = controlledSelectedId !== undefined;
  const selectedHistoryItemId = isControlled ? controlledSelectedId : localSelectedId;
  const setSelectedHistoryItemId = isControlled
    ? (id: string | null) => onSelectedHistoryItemIdChange?.(id)
    : setLocalSelectedId;
  const viewingInteraction = isControlled ? (controlledViewingInteraction ?? false) : localViewingInteraction;
  const setViewingInteraction = isControlled
    ? (v: boolean) => onViewingInteractionChange?.(v)
    : setLocalViewingInteraction;

  const selectedHistoryItem =
    historyItems.find((h) => h.id === selectedHistoryItemId) ?? null;

  const renderHistoryTimeline = (historyItems: CustomerHistoryItem[]) => {
    if (historyItems.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
          <p className="text-[12px] font-medium text-[#344054] dark:text-[#CBD5E1]">
            No history yet
          </p>
          <p className="text-[11px] text-[#98A2B3] dark:text-[#4E6A85]">
            Past interactions will appear here.
          </p>
        </div>
      );
    }

    const seenPhases = new Set<string>();
    return (
      <div className="space-y-0">
        {historyItems.map((item, idx) => {
          const isSelected = selectedHistoryItemId === item.id;
          const cfg = item.type ? historyTypeConfig[item.type] : null;
          const IconComponent = cfg?.icon ?? null;
          const showPhaseSeparator = item.phase && !seenPhases.has(item.phase);
          if (item.phase) seenPhases.add(item.phase);

          return (
            <div key={item.id}>
              {/* Phase separator */}
              {showPhaseSeparator && (
                <div
                  className={cn(
                    "flex items-center gap-2",
                    idx === 0 ? "mb-3" : "mt-5 mb-3"
                  )}
                >
                  <div className="h-px flex-1 bg-[#E4E7EC] dark:bg-[#1B3A52]" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#98A2B3] dark:text-[#4E6A85] shrink-0">
                    {item.phase}
                  </span>
                  <div className="h-px flex-1 bg-[#E4E7EC] dark:bg-[#1B3A52]" />
                </div>
              )}

              {/* Event row */}
              <div className="relative pl-8">
                {/* Vertical connector line */}
                <div className="absolute left-[13px] top-0 bottom-0 w-px bg-[#E4E7EC] dark:bg-[#1B3A52]" />

                {/* Type icon badge */}
                <div
                  className="absolute left-[5px] top-2 flex h-[18px] w-[18px] items-center justify-center rounded-full border border-white dark:border-[#0C1A26]"
                  style={{ backgroundColor: cfg?.iconBg ?? "#F2F4F7" }}
                >
                  {IconComponent ? (
                    <IconComponent
                      className="h-2.5 w-2.5"
                      style={{ color: cfg?.accent ?? "#667085" }}
                    />
                  ) : (
                    <span
                      className={cn("h-2 w-2 rounded-full", dotColorClass(item.dot))}
                    />
                  )}
                </div>

                {/* Event card */}
                <button
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      setSelectedHistoryItemId(null);
                      setViewingInteraction(false);
                    } else {
                      setSelectedHistoryItemId(item.id);
                      setViewingInteraction(false);
                    }
                  }}
                  className={cn(
                    "w-full text-left rounded-xl border px-3 py-2.5 transition-all duration-150 hover:shadow-sm",
                    isSelected
                      ? "border-[#166CCA]/40 bg-[#EBF4FD] dark:bg-[#0C1F33] dark:border-[#166CCA]/40"
                      : "border-[#E4E7EC] bg-white dark:border-[#1B3A52] dark:bg-[#0F1629] hover:border-[#C5DEF5] hover:bg-[#F8FBFF]"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={cn(
                        "text-[12px] font-semibold leading-snug",
                        isSelected
                          ? "text-[#166CCA]"
                          : "text-[#111827] dark:text-white"
                      )}
                    >
                      {item.title}
                    </p>
                    <span className="shrink-0 text-[10px] text-[#98A2B3] dark:text-[#4E6A85] whitespace-nowrap mt-0.5">
                      {item.timestamp}
                    </span>
                  </div>
                  {/* Short detail line */}
                  <p className="mt-0.5 text-[11px] leading-relaxed text-[#667085] dark:text-[#8BACC4] line-clamp-1">
                    {item.detail}
                  </p>
                </button>

                {/* Customer message bubble */}
                {item.customerMessage && (
                  <div className="mt-2 mb-1 ml-2 flex items-start gap-2">
                    <div className="shrink-0 mt-0.5 h-5 w-5 rounded-full bg-[#C5DEF5] flex items-center justify-center text-[8px] font-bold text-[#1260B0] select-none">
                      C
                    </div>
                    <div className="rounded-xl rounded-tl-sm bg-[#F2F4F7] dark:bg-[#141E2C] border border-[#E4E7EC] dark:border-[#1B3A52] px-3 py-2 max-w-[88%]">
                      <p className="text-[11px] leading-relaxed text-[#344054] dark:text-[#CBD5E1] italic">
                        "{item.customerMessage}"
                      </p>
                    </div>
                  </div>
                )}

                {/* Bottom spacer between events */}
                <div className="h-3" />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const typeLabel: Record<string, string> = {
    search: "Web Search", web: "Website Visit", chat: "Chat",
    purchase: "Purchase", shipping: "Shipping", registration: "Registration",
    ticket: "Support Ticket", email: "Email", system: "System Event", handoff: "Escalation",
    lead: "Lead Form",
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-row">
      {/* Timeline list */}
      <div className="flex-1 min-w-0 overflow-y-auto px-4 py-3">
        <div className="max-w-[800px] mx-auto w-full">
          {renderHistoryTimeline(historyItems)}
        </div>
      </div>

      {/* Detail side panel — slides in from right */}
      <div
        className={cn(
          "flex-shrink-0 border-l border-[#E4E7EC] dark:border-[#1B3A52] flex flex-col bg-card dark:bg-[#0C1A26] overflow-hidden transition-[width,opacity] duration-300 ease-in-out",
          selectedHistoryItem ? "w-[320px] opacity-100" : "w-0 opacity-0 border-l-0",
        )}
      >
        {selectedHistoryItem && (
          <div className="flex flex-col h-full min-w-[320px] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#E4E7EC] dark:border-[#1B3A52] px-4 py-3 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                {viewingInteraction && (
                  <button
                    type="button"
                    onClick={() => setViewingInteraction(false)}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[#667085] hover:bg-[#F2F4F7] dark:hover:bg-[#1B3A52] hover:text-[#344054] transition-colors"
                    aria-label="Back to event detail"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </button>
                )}
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#98A2B3] truncate">
                  {viewingInteraction && selectedHistoryItem.interaction
                    ? interactionViewLabel(selectedHistoryItem.interaction)
                    : "Event Detail"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setViewingInteraction(false);
                  setSelectedHistoryItemId(null);
                }}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[#667085] hover:bg-[#F2F4F7] dark:hover:bg-[#1B3A52] hover:text-[#344054] transition-colors"
                aria-label="Close event detail"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Sliding content area */}
            <div className="relative flex-1 overflow-hidden">
              {/* Page 1 — Event Detail */}
              <div className={cn(
                "absolute inset-0 overflow-y-auto p-4 space-y-4 transition-transform duration-300 ease-out",
                viewingInteraction ? "-translate-x-full" : "translate-x-0",
              )}>
                {/* Type badge + title */}
                <div>
                  {selectedHistoryItem.type && (() => {
                    const cfg = historyTypeConfig[selectedHistoryItem.type!];
                    const Icon = cfg.icon;
                    return (
                      <div className="mb-2 flex items-center gap-1.5">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full" style={{ backgroundColor: cfg.iconBg }}>
                          <Icon className="h-3 w-3" style={{ color: cfg.accent }} />
                        </div>
                        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: cfg.accent }}>
                          {typeLabel[selectedHistoryItem.type!] ?? selectedHistoryItem.type}
                        </span>
                        {selectedHistoryItem.phase && (
                          <>
                            <span className="text-[10px] text-[#D0D5DD]">·</span>
                            <span className="text-[10px] text-[#98A2B3]">{selectedHistoryItem.phase}</span>
                          </>
                        )}
                      </div>
                    );
                  })()}
                  <p className="text-[14px] font-semibold text-[#111827] dark:text-white leading-snug">
                    {selectedHistoryItem.title}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#98A2B3]">{selectedHistoryItem.timestamp}</p>
                </div>

                {/* Full detail */}
                <div className="rounded-xl border border-[#E4E7EC] dark:border-[#1B3A52] bg-[#F9FAFB] dark:bg-[#0F1629] px-4 py-3">
                  <p className="text-[12px] leading-relaxed text-[#344054] dark:text-[#CBD5E1]">
                    {selectedHistoryItem.detail}
                  </p>
                </div>

                {/* Meta key-value pairs */}
                {selectedHistoryItem.meta && selectedHistoryItem.meta.length > 0 && (
                  <div className="rounded-xl border border-[#E4E7EC] dark:border-[#1B3A52] bg-white dark:bg-[#0F2233] overflow-hidden">
                    <p className="px-3 pt-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#98A2B3]">Details</p>
                    <div className="divide-y divide-[#F2F4F7] dark:divide-[#1B3A52]">
                      {selectedHistoryItem.meta.map((row) => (
                        <div key={row.label} className="flex items-start gap-3 px-3 py-2">
                          <span className="shrink-0 text-[11px] font-medium text-[#98A2B3] dark:text-[#4E6A85] w-[90px]">{row.label}</span>
                          <span className="text-[11px] text-[#344054] dark:text-[#CBD5E1] leading-relaxed">{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Customer message */}
                {selectedHistoryItem.customerMessage && (
                  <div>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#98A2B3]">Customer Said</p>
                    <div className="flex items-start gap-2.5">
                      <div className="shrink-0 mt-0.5 h-7 w-7 rounded-full bg-[#C5DEF5] flex items-center justify-center text-[10px] font-bold text-[#1260B0]">
                        C
                      </div>
                      <div className="flex-1 rounded-xl rounded-tl-sm bg-white dark:bg-[#0F1629] border border-[#E4E7EC] dark:border-[#1B3A52] px-3.5 py-2.5">
                        <p className="text-[12px] leading-relaxed text-[#344054] dark:text-[#CBD5E1]">
                          &ldquo;{selectedHistoryItem.customerMessage}&rdquo;
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* View interaction button */}
                {selectedHistoryItem.interaction && (
                  <button
                    type="button"
                    onClick={() => setViewingInteraction(true)}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#166CCA]/30 bg-[#EBF4FD] dark:bg-[#0C1F33] dark:border-[#166CCA]/30 px-4 py-2.5 text-[12px] font-semibold text-[#166CCA] hover:bg-[#DBEAFE] dark:hover:bg-[#0F2848] transition-colors"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                    View {interactionViewLabel(selectedHistoryItem.interaction)}
                  </button>
                )}
              </div>

              {/* Page 2 — Full interaction view */}
              <div className={cn(
                "absolute inset-0 overflow-y-auto p-4 transition-transform duration-300 ease-out",
                viewingInteraction ? "translate-x-0" : "translate-x-full",
              )}>
                {selectedHistoryItem.interaction && renderInteractionContent(selectedHistoryItem.interaction, "C")}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
