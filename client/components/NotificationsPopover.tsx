import { useEffect, useRef, useState } from "react";
import {
  GripHorizontal,
  X,
  UserPlus,
  MessageSquare,
  AlertTriangle,
  Phone,
  CheckCircle2,
  Bell,
} from "lucide-react";

import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type NotificationType =
  | "new_assignment"
  | "new_chat"
  | "escalation"
  | "call_missed"
  | "resolved";

export type AppNotification = {
  id: string;
  type: NotificationType;
  customerName: string;
  timestamp: Date;
  read: boolean;
};

// ─── Seed data ─────────────────────────────────────────────────────────────────

const now = new Date();
const mins = (n: number) => new Date(now.getTime() - n * 60_000);
const hrs = (n: number) => new Date(now.getTime() - n * 60 * 60_000);

export const seedNotifications: AppNotification[] = [
  { id: "n1", type: "new_assignment", customerName: "Noah Patel",      timestamp: mins(3),  read: false },
  { id: "n2", type: "new_chat",       customerName: "Sarah Miller",    timestamp: mins(8),  read: false },
  { id: "n3", type: "escalation",     customerName: "Lauren Kim",      timestamp: mins(14), read: false },
  { id: "n4", type: "new_assignment", customerName: "Ethan Zhang",     timestamp: mins(27), read: false },
  { id: "n5", type: "new_chat",       customerName: "Olivia Reed",     timestamp: mins(41), read: true  },
  { id: "n6", type: "call_missed",    customerName: "David Brown",     timestamp: hrs(1),   read: true  },
  { id: "n7", type: "resolved",       customerName: "Alex Kowalski",   timestamp: hrs(2),   read: true  },
  { id: "n8", type: "new_assignment", customerName: "Priya Nair",      timestamp: hrs(3),   read: true  },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_META: Record<NotificationType, { label: string; Icon: typeof Bell; iconClass: string }> = {
  new_assignment: { label: "New Case",        Icon: UserPlus,     iconClass: "text-[#166CCA] bg-[#C5DEF5] dark:bg-[#0C3D7A]" },
  new_chat:       { label: "New Chat",        Icon: MessageSquare,iconClass: "text-[#059669] bg-[#ECFDF5] dark:bg-[#0A2E1A]" },
  escalation:     { label: "Escalation",      Icon: AlertTriangle,iconClass: "text-[#A37A00] bg-[#FFF6E0] dark:bg-[#2A2000]" },
  call_missed:    { label: "Missed Call",     Icon: Phone,        iconClass: "text-[#E32926] bg-[#FDEAEA] dark:bg-[#2E0D0D]" },
  resolved:       { label: "Resolved",        Icon: CheckCircle2, iconClass: "text-[#7A7A7A] bg-[#F2F4F7] dark:bg-[#1C2A3A]" },
};

function formatTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1)  return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24)  return `${diffHrs}h ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatFullDateTime(date: Date): string {
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ─── Notification row ──────────────────────────────────────────────────────────

function NotificationRow({
  notification,
  onDismiss,
}: {
  notification: AppNotification;
  onDismiss: (id: string) => void;
}) {
  const { label, Icon, iconClass } = TYPE_META[notification.type];

  return (
    <div
      className={cn(
        "group flex items-start gap-3 border-b border-black/[0.06] px-4 py-3.5 transition-colors hover:bg-[#F8F8F9]",
        !notification.read && "bg-[#F0F7FF]",
      )}
    >
      {/* Icon */}
      <div className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full", iconClass)}>
        <Icon className="h-3.5 w-3.5" />
      </div>

      {/* Body */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[13px] font-semibold leading-snug text-[#111827]">{label}</p>
            <p className="mt-0.5 truncate text-[12px] text-[#667085]">{notification.customerName}</p>
          </div>
          {/* Dismiss */}
          <button
            type="button"
            onClick={() => onDismiss(notification.id)}
            aria-label={`Dismiss notification for ${notification.customerName}`}
            className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[#98A2B3] opacity-0 transition-all hover:bg-[#F2F4F7] dark:hover:bg-[#1C2A3A] hover:text-[#475467] dark:hover:text-[#8898AB] group-hover:opacity-100"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
        <p
          className="mt-1 text-[11px] text-[#98A2B3]"
          title={formatFullDateTime(notification.timestamp)}
        >
          {formatTime(notification.timestamp)}
        </p>
      </div>

      {/* Unread dot */}
      {!notification.read && (
        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#166CCA]" />
      )}
    </div>
  );
}

// ─── NotificationsPopoverContent ──────────────────────────────────────────────

const MARGIN = 16;
const MIN_WIDTH = 280;
const MIN_HEIGHT = 300;

export default function NotificationsPopoverContent({
  visible,
  position,
  size,
  zIndex,
  onPositionChange,
  onSizeChange,
  onClose,
  onInteractStart,
  onUnreadCountChange,
  initialNotifications,
}: {
  visible?: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  onPositionChange: (p: { x: number; y: number }) => void;
  onSizeChange: (s: { width: number; height: number }) => void;
  onClose: () => void;
  onInteractStart?: () => void;
  onUnreadCountChange?: (count: number) => void;
  initialNotifications?: AppNotification[];
}) {
  const [notifications, setNotifications] = useState<AppNotification[]>(
    initialNotifications ?? seedNotifications,
  );

  const isDraggingRef = useRef(false);
  const isResizingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const resizeStartRef = useRef({ mouseX: 0, mouseY: 0, width: size.width, height: size.height });

  // Mark all as read when panel opens; report unread count to parent
  useEffect(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  useEffect(() => {
    const unread = notifications.filter((n) => !n.read).length;
    onUnreadCountChange?.(unread);
  }, [notifications, onUnreadCountChange]);

  const handleDismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleClearAll = () => setNotifications([]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        onPositionChange({
          x: Math.min(Math.max(MARGIN, e.clientX - dragOffsetRef.current.x), window.innerWidth - size.width - MARGIN),
          y: Math.min(Math.max(MARGIN, e.clientY - dragOffsetRef.current.y), window.innerHeight - size.height - MARGIN),
        });
        return;
      }
      if (!isResizingRef.current) return;
      const dx = e.clientX - resizeStartRef.current.mouseX;
      const dy = e.clientY - resizeStartRef.current.mouseY;
      onSizeChange({
        width:  Math.min(Math.max(MIN_WIDTH,  resizeStartRef.current.width  + dx), window.innerWidth  - position.x - MARGIN),
        height: Math.min(Math.max(MIN_HEIGHT, resizeStartRef.current.height + dy), window.innerHeight - position.y - MARGIN),
      });
    };
    const onMouseUp = () => {
      isDraggingRef.current = false;
      isResizingRef.current = false;
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      document.body.style.userSelect = "";
    };
  }, [onPositionChange, onSizeChange, position.x, position.y, size.width, size.height]);

  return (
    <div
      className={cn(
        "fixed flex flex-col overflow-hidden rounded-xl border border-black/10 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.18)] transition-[opacity,transform] duration-[280ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[opacity,transform]",
        visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-[0.97] translate-y-1",
      )}
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        zIndex,
        maxWidth: "calc(100vw - 2rem)",
        maxHeight: "calc(100vh - 2rem)",
      }}
      onMouseDown={onInteractStart}
    >
      {/* Drag header */}
      <div
        className="flex shrink-0 cursor-grab items-center justify-between gap-3 border-b border-black/[0.08] bg-background/50 px-5 py-4 active:cursor-grabbing"
        onMouseDown={(e) => {
          onInteractStart?.();
          isDraggingRef.current = true;
          dragOffsetRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
          document.body.style.userSelect = "none";
        }}
      >
        <div className="flex items-center gap-3">
          <GripHorizontal className="h-4 w-4 shrink-0 text-[#7A7A7A]" />
          <h3 className="text-sm font-semibold text-[#333333]">Notifications</h3>
          {notifications.length > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#EBF4FD] px-1.5 text-[11px] font-semibold text-[#166CCA]">
              {notifications.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {notifications.length > 0 && (
            <button
              type="button"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={handleClearAll}
              className="rounded-md px-2 py-1 text-[11px] font-medium text-[#667085] dark:text-[#8898AB] transition-colors hover:bg-[#F2F4F7] dark:hover:bg-[#1C2A3A] hover:text-[#333333] dark:hover:text-[#E2E8F0]"
            >
              Clear all
            </button>
          )}
          <button
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={onClose}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#7A7A7A] dark:text-[#8898AB] transition-colors hover:bg-[#F2F4F7] dark:hover:bg-[#1C2A3A] hover:text-[#333333] dark:hover:text-[#E2E8F0]"
            aria-label="Close notifications"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-12 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F2F4F7] dark:bg-[#1C2A3A]">
              <Bell className="h-5 w-5 text-[#98A2B3] dark:text-[#4E6A85]" />
            </div>
            <p className="text-sm font-medium text-[#344054] dark:text-[#CBD5E1]">All caught up</p>
            <p className="text-xs text-[#98A2B3] dark:text-[#4E6A85]">No notifications right now</p>
          </div>
        ) : (
          notifications.map((n) => (
            <NotificationRow key={n.id} notification={n} onDismiss={handleDismiss} />
          ))
        )}
      </div>

      {/* Resize handle */}
      <button
        type="button"
        aria-label="Resize notifications panel"
        className="absolute bottom-0 right-0 h-5 w-5 cursor-se-resize"
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          isResizingRef.current = true;
          resizeStartRef.current = { mouseX: e.clientX, mouseY: e.clientY, width: size.width, height: size.height };
          document.body.style.userSelect = "none";
        }}
      >
        <span className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-sm border-b-2 border-r-2 border-[#A1A1AA]" />
      </button>
    </div>
  );
}
