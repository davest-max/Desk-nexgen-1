import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { getSmartPopoverPosition } from "@/lib/agent-roster";

export function TakeoverPopover({
  botType,
  customerName,
  triggerRect,
  onClose,
  onConfirm,
}: {
  botType: string;
  customerName: string;
  triggerRect: DOMRect;
  onClose: () => void;
  onConfirm: (reason: string, alertBot: boolean) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [alertBot, setAlertBot] = useState(true);
  const [reason, setReason] = useState("");
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(onClose, 150);
  }, [isClosing, onClose]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) handleClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [handleClose]);

  const POPOVER_WIDTH = 320;
  const ESTIMATED_HEIGHT = 260;
  const { left, top, transform } = getSmartPopoverPosition(triggerRect, POPOVER_WIDTH, ESTIMATED_HEIGHT);

  return createPortal(
    <div
      ref={ref}
      className={`fixed z-[9999] rounded-xl border border-border bg-white shadow-[0_8px_24px_rgba(16,24,40,0.14)] overflow-hidden ${isClosing ? "animate-popover-fade-out" : "animate-popover-fade-in"}`}
      style={{ left, top, width: POPOVER_WIDTH, transform }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <p className="text-[12px] font-semibold text-[#1D2939]">Take over conversation</p>
          <p className="text-[11px] text-[#667085] mt-0.5">
            Currently handled by <span className="font-medium text-[#344054]">{botType}</span>
          </p>
        </div>
        <button type="button" onClick={handleClose} className="text-[#98A2B3] hover:text-[#475467] transition-colors ml-3 shrink-0">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-3">
        {/* Alert checkbox */}
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={alertBot}
            onChange={(e) => setAlertBot(e.target.checked)}
            className="mt-0.5 h-3.5 w-3.5 rounded border-[#D0D5DD] accent-[#166CCA] cursor-pointer shrink-0"
          />
          <span className="text-[12px] text-[#344054] leading-snug">
            Notify <span className="font-medium">{botType}</span> that you are taking over
          </span>
        </label>

        {/* Reason textarea */}
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for taking over (optional)"
          rows={3}
          className="w-full resize-none rounded-lg border border-[#D0D5DD] px-3 py-2 text-[12px] text-[#344054] placeholder:text-[#98A2B3] focus:border-[#166CCA] focus:outline-none focus:ring-1 focus:ring-[#166CCA]/20 transition-colors"
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 border-t border-border bg-[#F9FAFB] px-4 py-2.5">
        <button
          type="button"
          onClick={handleClose}
          className="rounded-md border border-[#D0D5DD] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#344054] hover:bg-[#F9FAFB] transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onConfirm(reason, alertBot)}
          className="rounded-md bg-[#166CCA] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#1260B0] transition-colors"
        >
          Confirm Takeover
        </button>
      </div>
    </div>,
    document.body,
  );
}
