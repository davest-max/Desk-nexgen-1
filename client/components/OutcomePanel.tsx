import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { X, GripHorizontal, Sparkles, ChevronDown, Check } from "lucide-react";
import { CALL_DISPOSITION_OPTIONS } from "@/lib/layout-constants";
import { createPortal } from "react-dom";

// ─── Types ────────────────────────────────────────────────────────────────────

export type OutcomeResult = {
  status: string;
  tags: string[];
  disposition: string | null;
  summary: string;
};

export interface OutcomePanelProps {
  channel: "voice" | "digital";
  customerInfo?: {
    name: string;
    customerId: string;
    customerRecordId?: string;
    preview: string;
  };
  /** Digital: anchor the panel near this button */
  anchorRef?: React.RefObject<HTMLButtonElement | null>;
  /** Voice: initial absolute position */
  initialPosition?: { x: number; y: number };
  onClose: () => void;
  onConfirm: (result: OutcomeResult) => void;
}

// ─── Options ─────────────────────────────────────────────────────────────────

const DIGITAL_STATUS_OPTIONS = [
  "Resolved",
  "Follow-up needed",
  "Transferred",
  "Duplicate case",
  "Escalated",
];

const TAG_OPTIONS = [
  "Billing",
  "Refund",
  "Subscription",
  "Technical",
  "Account",
  "Fraud",
  "Escalated",
  "VIP",
  "First Contact",
  "Callback",
];

const DISPOSITION_OPTIONS = [
  "Issue Resolved",
  "Partial Resolution",
  "Pending Follow-up",
  "Transferred to Tier 2",
  "Transferred to Billing",
  "Supervisor Override",
  "Refund Issued",
  "Credit Applied",
  "Information Provided",
  "No Action Required",
  "Customer Declined",
  "Callback Scheduled",
];

// ─── AI suggestion seeding ────────────────────────────────────────────────────

type AiSuggestions = {
  summary: string;
  status: string;
  tags: string[];
  disposition: string;
};

function getAiSuggestions(
  channel: "voice" | "digital",
  customerRecordId?: string,
  customerName?: string,
): AiSuggestions {
  const name = customerName ?? "the customer";

  if (customerRecordId === "marcus") {
    return {
      summary: `Chat interaction with ${name} — order shipped to wrong address due to a system-side address caching error. Customer requested expedited reship or refund. Appropriate resolution options presented and agent confirmed next steps with customer.`,
      status: "Resolved",
      tags: ["Billing", "Refund", "Account"],
      disposition: "Refund Issued",
    };
  }
  if (customerRecordId === "terry") {
    return {
      summary: `Inbound voice call with ${name} — VP of Operations at Nexus Freight evaluating TMS replacement. Lead call in progress. Key decision criteria discussed: Q4 deadline, $400K budget. Sales Intelligence captured.`,
      status: "Follow-up needed",
      tags: ["VIP", "Account", "First Contact"],
      disposition: "Pending Follow-up",
    };
  }
  if (customerRecordId === "jordan") {
    return {
      summary: `Chat interaction with ${name} — technical issue escalated from AI assistant. Customer frustrated with repeated contact. Empathy shown and issue resolved at first human contact.`,
      status: "Resolved",
      tags: ["Technical", "Escalated"],
      disposition: "Issue Resolved",
    };
  }
  if (customerRecordId === "sofia") {
    return {
      summary: `Chat interaction with ${name} — billing dispute regarding subscription renewal charge. Partial credit applied and account reviewed. Customer expressed satisfaction with outcome.`,
      status: "Resolved",
      tags: ["Billing", "Subscription", "Account"],
      disposition: "Credit Applied",
    };
  }

  if (channel === "voice") {
    return {
      summary: `Voice interaction with ${name} — issue identified and addressed. Call handled professionally within expected handle time. Customer confirmed satisfaction before call end.`,
      status: "Resolved",
      tags: ["Account", "First Contact"],
      disposition: "Issue Resolved",
    };
  }
  return {
    summary: `Chat interaction with ${name} — customer concern reviewed and resolved. Agent provided clear guidance and confirmed next steps. Follow-up actions logged where applicable.`,
    status: "Resolved",
    tags: ["Technical", "Account"],
    disposition: "Issue Resolved",
  };
}

// ─── Single-select dropdown ───────────────────────────────────────────────────

function SelectDropdown({
  label,
  value,
  options,
  aiSuggested,
  accentColor,
  onChange,
}: {
  label: string;
  value: string | null;
  options: readonly string[];
  aiSuggested: string;
  accentColor: string;
  onChange: (val: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="px-4 py-3">
      <div className="mb-1.5 flex items-center gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#98A2B3]">
          {label}
        </p>
      </div>

      <div ref={ref} className="relative">
        {/* Trigger */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-[12px] transition-colors",
            value
              ? "border-[#D0D5DD] bg-white text-[#1D2939]"
              : "border-[#D0D5DD] bg-white text-[#98A2B3]",
            open && "border-[#166CCA] ring-1 ring-[#166CCA]",
          )}
        >
          <span className={cn("flex-1 text-left", !value && "text-[#98A2B3]")}>
            {value ?? `Select ${label.toLowerCase()}…`}
          </span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 shrink-0 text-[#98A2B3] transition-transform",
              open && "rotate-180",
            )}
          />
        </button>

        {/* Dropdown list */}
        {open && (
          <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-10 overflow-hidden rounded-lg border border-[#E4E7EC] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
            {/* Clear option */}
            {value && (
              <button
                type="button"
                onClick={() => { onChange(null); setOpen(false); }}
                className="flex w-full items-center px-3 py-2 text-[11px] text-[#98A2B3] hover:bg-[#F9FAFB] border-b border-[#F2F4F7]"
              >
                Clear selection
              </button>
            )}
            {options.map((opt) => {
              const isSelected = value === opt;
              const isAi = opt === aiSuggested;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => { onChange(opt); setOpen(false); }}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2.5 text-left text-[12px] transition-colors",
                    isSelected ? "bg-[#EBF4FD] text-[#166CCA] font-semibold" : "text-[#344054] hover:bg-[#F9FAFB]",
                  )}
                >
                  {/* Checkmark for selected */}
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                    {isSelected && <Check className="h-3.5 w-3.5 text-[#166CCA]" strokeWidth={2.5} />}
                  </span>
                  <span className="flex-1">{opt}</span>
                  {isAi && (
                    <span className="flex shrink-0 items-center gap-1 text-[10px] text-[#166CCA]">
                      <Sparkles className="h-3 w-3" />
                      AI
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Multi-select tag chips ───────────────────────────────────────────────────

function TagMultiSelect({
  selected,
  aiSuggested,
  onChange,
}: {
  selected: Set<string>;
  aiSuggested: string[];
  onChange: (next: Set<string>) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const toggle = (tag: string) => {
    const next = new Set(selected);
    next.has(tag) ? next.delete(tag) : next.add(tag);
    onChange(next);
  };

  return (
    <div className="px-4 py-3">
      <div className="mb-1.5 flex items-center gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#98A2B3]">
          Tags
        </p>
      </div>

      {/* Selected chips */}
      <div className="mb-2 flex flex-wrap gap-1.5">
        {[...selected].map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-full border border-[#6941C6]/30 bg-[#F4F0FF] py-0.5 pl-2.5 pr-1.5 text-[11px] font-medium text-[#6941C6]"
          >
            {tag}
            <button
              type="button"
              onClick={() => toggle(tag)}
              className="flex h-3.5 w-3.5 items-center justify-center rounded-full hover:bg-[#6941C6]/10 transition-colors"
              aria-label={`Remove ${tag}`}
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
        {selected.size === 0 && (
          <span className="text-[12px] text-[#98A2B3]">No tags selected</span>
        )}
      </div>

      {/* Dropdown trigger */}
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "flex w-full items-center justify-between rounded-lg border border-[#D0D5DD] bg-white px-3 py-2 text-[12px] text-[#98A2B3] transition-colors hover:border-[#6941C6]/30",
            open && "border-[#6941C6] ring-1 ring-[#6941C6]",
          )}
        >
          <span>Add tags…</span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 shrink-0 text-[#98A2B3] transition-transform",
              open && "rotate-180",
            )}
          />
        </button>

        {open && (
          <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-10 overflow-hidden rounded-lg border border-[#E4E7EC] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
            {TAG_OPTIONS.map((tag) => {
              const isSelected = selected.has(tag);
              const isAi = aiSuggested.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggle(tag)}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2.5 text-left text-[12px] transition-colors",
                    isSelected ? "bg-[#F4F0FF] text-[#6941C6] font-semibold" : "text-[#344054] hover:bg-[#F9FAFB]",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors",
                      isSelected ? "border-[#6941C6] bg-[#6941C6]" : "border-[#D0D5DD] bg-white",
                    )}
                  >
                    {isSelected && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                  </span>
                  <span className="flex-1">{tag}</span>
                  {isAi && (
                    <span className="flex shrink-0 items-center gap-1 text-[10px] text-[#166CCA]">
                      <Sparkles className="h-3 w-3" />
                      AI
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function OutcomePanel({
  channel,
  customerInfo,
  anchorRef,
  initialPosition,
  onClose,
  onConfirm,
}: OutcomePanelProps) {
  const aiSuggestions = getAiSuggestions(
    channel,
    customerInfo?.customerRecordId,
    customerInfo?.name,
  );

  const [summary, setSummary] = useState(aiSuggestions.summary);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(aiSuggestions.status);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set(aiSuggestions.tags));
  const [selectedDisposition, setSelectedDisposition] = useState<string | null>(aiSuggestions.disposition);

  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  useEffect(() => {
    if (initialPosition) {
      setPos(initialPosition);
      return;
    }
    if (anchorRef?.current) {
      const r = anchorRef.current.getBoundingClientRect();
      const panelWidth = 400;
      const panelHeight = 640;
      const gap = 8;
      // Prefer opening to the right; clamp so it never goes off-screen
      const x = Math.min(r.right + gap, window.innerWidth - panelWidth - gap);
      // Align top of panel with top of button; clamp bottom
      const y = Math.min(r.top, window.innerHeight - panelHeight - gap);
      setPos({ x: Math.max(gap, x), y: Math.max(gap, y) });
    }
  }, [anchorRef, initialPosition]);

  const statusOptions =
    channel === "voice"
      ? (CALL_DISPOSITION_OPTIONS as readonly string[])
      : DIGITAL_STATUS_OPTIONS;

  const handleConfirm = () => {
    if (!selectedStatus) return;
    onConfirm({ status: selectedStatus, tags: [...selectedTags], disposition: selectedDisposition, summary });
  };

  const panel = (
    <div
      className="fixed z-[9999] w-[400px] overflow-hidden rounded-xl border border-black/10 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.18)]"
      style={{ left: pos.x, top: pos.y }}
    >
      {/* ── Header ── */}
      <div
        className="flex cursor-grab select-none items-center justify-between border-b border-black/[0.06] bg-[#F8F8F9] px-4 py-3 active:cursor-grabbing"
        onMouseDown={(e) => {
          if ((e.target as HTMLElement).closest("button")) return;
          dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
          const onMove = (me: MouseEvent) => {
            if (!dragRef.current) return;
            setPos({
              x: Math.max(0, dragRef.current.origX + me.clientX - dragRef.current.startX),
              y: Math.max(0, dragRef.current.origY + me.clientY - dragRef.current.startY),
            });
          };
          const onUp = () => {
            dragRef.current = null;
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
          };
          window.addEventListener("mousemove", onMove);
          window.addEventListener("mouseup", onUp);
        }}
      >
        <div className="flex items-center gap-2">
          <GripHorizontal className="h-3.5 w-3.5 text-[#98A2B3]" />
          <span className="text-[13px] font-semibold text-[#333333]">Outcome</span>
          {customerInfo && (
            <span className="text-[11px] text-[#98A2B3]">· {customerInfo.name}</span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-6 w-6 items-center justify-center rounded-full text-[#98A2B3] transition-colors hover:bg-black/[0.06] hover:text-[#344054]"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* ── Scrollable content ── */}
      <div className="overflow-y-auto" style={{ maxHeight: 560 }}>

        {/* AI Suggested banner */}
        <div className="flex items-center gap-1.5 border-b border-[#EBF4FD] bg-[#F5F9FF] px-4 py-2">
          <Sparkles className="h-3 w-3 text-[#166CCA]" />
          <span className="text-[11px] font-medium text-[#166CCA]">AI Suggested</span>
          <span className="text-[11px] text-[#98A2B3]">— review and edit before saving</span>
        </div>

        {/* Resolution dropdown */}
        <SelectDropdown
          label="Resolution"
          value={selectedStatus}
          options={statusOptions}
          aiSuggested={aiSuggestions.status}
          accentColor="#166CCA"
          onChange={setSelectedStatus}
        />

        <div className="mx-4 border-t border-[#F2F4F7]" />

        {/* Tags multi-select */}
        <TagMultiSelect
          selected={selectedTags}
          aiSuggested={aiSuggestions.tags}
          onChange={setSelectedTags}
        />

        <div className="mx-4 border-t border-[#F2F4F7]" />

        {/* Disposition dropdown */}
        <SelectDropdown
          label="Disposition Code"
          value={selectedDisposition}
          options={DISPOSITION_OPTIONS}
          aiSuggested={aiSuggestions.disposition}
          accentColor="#027A48"
          onChange={setSelectedDisposition}
        />

        <div className="mx-4 border-t border-[#F2F4F7]" />

        {/* Summary — at the bottom */}
        <div className="px-4 py-3">
          <div className="mb-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#98A2B3]">
              Summary
            </p>
          </div>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={6}
            className="w-full resize-none rounded-lg border border-l-2 border-[#D0D5DD] border-l-[#166CCA]/50 bg-[#FAFCFF] px-3 py-2 text-[12px] leading-relaxed text-[#1D2939] placeholder:text-[#98A2B3] focus:border-[#166CCA] focus:border-l-[#166CCA] focus:outline-none focus:ring-1 focus:ring-[#166CCA]"
          />
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="flex gap-2 border-t border-[#F2F4F7] px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-lg border border-black/10 py-2 text-[12px] font-medium text-[#344054] transition-colors hover:bg-[#F9FAFB]"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!selectedStatus}
          onClick={handleConfirm}
          className={cn(
            "flex-1 rounded-lg py-2 text-[12px] font-semibold transition-colors",
            selectedStatus
              ? "bg-[#166CCA] text-white hover:bg-[#1260B0]"
              : "cursor-not-allowed bg-[#F2F4F7] text-[#98A2B3]",
          )}
        >
          {selectedStatus ? `Approve & Save · ${selectedStatus}` : "Select a resolution"}
        </button>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(panel, document.body);
}
