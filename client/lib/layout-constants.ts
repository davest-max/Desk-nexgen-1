// Layout constants, types, and dimension calculations
import type {
  QueueAssignmentStatus,
  QueuePreviewItem,
  DeskCanvasView,
  AssignmentChannel,
} from "@/components/layout-context";
import type { SharedConversationData } from "@/components/ConversationPanel";
import type { CustomerChannel } from "@/lib/customer-database";
import { createConversationState } from "@/lib/customer-database";

// ─── Types ─────────────────────────────────────────────────────────────

export type FloatingPanelId = "conversation" | "customerInfo" | "deskCanvas" | "call" | "addNew" | "chat" | "notifications" | "transcript";
export type CombinedInteractionPanelTab = "conversation" | "customerInfo" | "canvas";

// Agent roster used for the Transfer sub-menu in the case header dropdown
export type AgentChatNotification = {
  id: string;
  conversationId: string;
  agentName: string;
  agentRole: string;
  agentInitials: string;
  agentAvatarColor: string;
  message: string;
  time: string;
};

export type AgentStatus = "Available" | "Busy" | "Away" | "Offline" | "In a Call";
export type WorkspaceOption = {
  id: string;
  name: string;
  description: string;
  routePath?: string;
};

export type QueueSortOption = "created-desc" | "created-asc" | "updated-desc" | "updated-asc";

export type GroupedQueueItem = {
  customerRecordId: string;
  name: string;
  initials: string;
  channels: QueuePreviewItem[];
  lastActiveChannel: QueuePreviewItem;
  isAnyActive: boolean;
  priority: string;
  priorityClassName: string;
  badgeColor: string;
};

export type CallPopunderPosition = {
  x: number;
  y: number;
};

export type CallPopunderSize = {
  width: number;
  height: number;
};

export type ConversationPopunderPosition = {
  x: number;
  y: number;
};

export type ConversationPopunderSize = {
  width: number;
  height: number;
};

export type CustomerInfoPopunderPosition = {
  x: number;
  y: number;
};

export type CustomerInfoPopunderSize = {
  width: number;
  height: number;
};

export type DeskCanvasPopunderPosition = {
  x: number;
  y: number;
};

export type DeskCanvasPopunderSize = {
  width: number;
  height: number;
};

export type TranscriptLine = {
  id: string;
  speaker: "agent" | "customer" | "system";
  text: string;
  elapsed: number;
};

export type TranscriptPopunderPosition = { x: number; y: number };
export type TranscriptPopunderSize = { width: number; height: number };

export type CallPopunderMode = "setup" | "connecting" | "controls" | "disposition";

// ─── Status Options ────────────────────────────────────────────────────

export const statusOptions: Array<{
  label: AgentStatus;
  dotClassName: string;
  textClassName: string;
}> = [
  { label: "Available", dotClassName: "bg-[#208337]", textClassName: "text-[#208337]" },
  { label: "Busy", dotClassName: "bg-[#E32926]", textClassName: "text-[#C71D1A]" },
  { label: "Away", dotClassName: "bg-[#FFB800]", textClassName: "text-[#A37A00]" },
  { label: "Offline", dotClassName: "bg-[#A3A3A3]", textClassName: "text-[#A3A3A3]" },
  { label: "In a Call", dotClassName: "bg-[#E32926]", textClassName: "text-[#C71D1A]" },
];

export const initialWorkspaceOptions: WorkspaceOption[] = [
  { id: "control-panel", name: "Control Center", description: "", routePath: "/control-center" },
  { id: "review", name: "Activity", description: "", routePath: "/activity" },
  { id: "wem", name: "WEM", description: "", routePath: "/wem" },
  { id: "schedule", name: "Schedule", description: "", routePath: "/schedule" },
  { id: "settings", name: "Settings", description: "", routePath: "/settings" },
  { id: "reporting", name: "Reporting", description: "", routePath: "/reporting" },
];

export const conversationStatusOptions: Array<{ value: QueueAssignmentStatus; label: string }> = [
  { value: "open", label: "Open" },
  { value: "pending", label: "Pending" },
  { value: "resolved", label: "Resolved" },
  { value: "escalated", label: "Escalated" },
];

// ─── Conversation Status Functions ─────────────────────────────────────

export function getConversationStatusChipClasses(status: QueueAssignmentStatus) {
  if (status === "open") {
    return "border-[#24943E] bg-[#EFFBF1] text-[#208337] hover:bg-[#EFFBF1]";
  }

  if (status === "pending") {
    return "border-[#D0D5DD] bg-[#F2F4F7] text-[#667085] hover:bg-[#E4E7EC]";
  }

  if (status === "resolved") {
    return "border-[#24943E] bg-[#EFFBF1] text-[#208337] hover:bg-[#EFFBF1]";
  }

  if (status === "escalated") {
    return "border-[#E53935] bg-[#FDEAEA] text-[#C71D1A] hover:bg-[#FDEAEA]";
  }

  if (status === "parked") {
    return "border-[#D0D5DD] bg-[#F2F4F7] text-[#344054] hover:bg-[#E4E7EC]";
  }

  return "border-[#D0D5DD] bg-white text-[#667085] hover:bg-[#F9FAFB]";
}

export function getConversationStateKey(assignmentId: string) {
  return assignmentId;
}

// ─── Conversation State Helpers ────────────────────────────────────────

export function createFreshConversationState(customerId: string, channel: CustomerChannel): SharedConversationData {
  const conversation = createConversationState(customerId, channel);

  return {
    ...conversation,
    timelineLabel: `${conversation.label} · New conversation`,
    messages: [],
    draft: "",
    status: "open",
    isCustomerTyping: false,
  };
}

// Note: createCustomConversationState is exported from conversation-state-helpers.ts

// ─── Dimension Constants ────────────────────────────────────────────────

export const CALL_POPUNDER_WIDTH = 272;
export const CALL_POPUNDER_MARGIN = 16;
export const CALL_POPUNDER_GAP = 12;
export const CONVERSATION_POPOUNDER_MARGIN = 16;
export const CONVERSATION_POPOUNDER_GAP = 12;
export const DOCKED_CONVERSATION_MIN_WIDTH = 360;
export const DOCKED_CONVERSATION_DEFAULT_WIDTH = 450;
export const DOCKED_CONVERSATION_MAX_WIDTH = 560;
export const DOCKED_CONVERSATION_GAP = 16;
export const DOCKED_CONVERSATION_CONTENT_ENTER_DELAY_MS = 0;
export const DOCKED_CONVERSATION_CONTENT_TRANSITION_MS = 520;
export const CUSTOMER_INFO_PANEL_CONTENT_ENTER_DELAY_MS = 120;
export const CUSTOMER_INFO_PANEL_CONTENT_TRANSITION_MS = 220;
export const INLINE_APP_SPACE_PANEL_ENTER_DELAY_MS = 20;
export const MIN_MAIN_WORKSPACE_WIDTH = 360;
export const CUSTOMER_INFO_PANEL_MIN_WIDTH = 360;
export const CUSTOMER_INFO_PANEL_DEFAULT_WIDTH = 425;
export const CUSTOMER_INFO_PANEL_MAX_WIDTH = 560;
export const CUSTOMER_INFO_PANEL_GAP = 16;
export const CUSTOMER_INFO_PANEL_BREAKPOINT = 1024;
export const CUSTOMER_INFO_POPOUNDER_MARGIN = 16;
export const CUSTOMER_INFO_POPOUNDER_GAP = 12;
export const DESK_CANVAS_POPOUNDER_MARGIN = 16;
export const DESK_CANVAS_POPOUNDER_MIN_HEIGHT = 420;
export const DESK_CANVAS_POPOUNDER_DESK_MIN_WIDTH = 360;
export const DESK_CANVAS_POPOUNDER_COPILOT_MIN_WIDTH = 360;
export const DESK_CANVAS_POPOUNDER_DESK_DEFAULT_WIDTH = 360;
export const DESK_CANVAS_POPOUNDER_COPILOT_DEFAULT_WIDTH = 360;
export const ASSIGNMENTS_POPOVER_Z_INDEX = 90;
export const FLOATING_PANEL_BASE_Z_INDEX = 300;
export const COPILOT_DOCK_BREAKPOINT = 1280;
export const COMBINED_INTERACTION_PANEL_BREAKPOINT = 1024;
export const COMBINED_INTERACTION_PANEL_CANVAS_BREAKPOINT = 1280;

export const CALL_DISPOSITION_OPTIONS = [
  "Resolved",
  "Escalated",
  "Follow-up needed",
  "Transferred",
  "No answer / Voicemail",
  "Customer callback requested",
  "Wrong number",
  "Duplicate case",
] as const;

// ─── Layout Dimension Functions ────────────────────────────────────────

export function getDeskCanvasPopunderMinWidth(view: DeskCanvasView) {
  return view === "copilot"
    ? DESK_CANVAS_POPOUNDER_COPILOT_MIN_WIDTH
    : DESK_CANVAS_POPOUNDER_DESK_MIN_WIDTH;
}

export function getDeskCanvasPopunderDefaultWidth(view: DeskCanvasView) {
  return view === "copilot"
    ? DESK_CANVAS_POPOUNDER_COPILOT_DEFAULT_WIDTH
    : DESK_CANVAS_POPOUNDER_DESK_DEFAULT_WIDTH;
}

export function getAvailableDockedPanelWidth({
  hasDesktopRightPanel,
  reserveMainWorkspace,
  visiblePanelCount,
  hasMainCanvas,
}: {
  hasDesktopRightPanel: boolean;
  reserveMainWorkspace: boolean;
  visiblePanelCount: number;
  hasMainCanvas: boolean;
}) {
  if (typeof window === "undefined") {
    return 0;
  }

  const rightPanelWidth = hasDesktopRightPanel && window.innerWidth >= 1024 ? 380 : 0;
  const reservedMainWorkspaceWidth = reserveMainWorkspace ? MIN_MAIN_WORKSPACE_WIDTH : 0;
  const gapCount = visiblePanelCount === 0 ? 0 : Math.max(0, visiblePanelCount - 1) + (hasMainCanvas ? 1 : 0);

  return Math.max(
    0,
    window.innerWidth - 56 - rightPanelWidth - reservedMainWorkspaceWidth - gapCount * DOCKED_CONVERSATION_GAP - 16,
  );
}

export function getDockedConversationMaxWidth({
  hasDesktopRightPanel,
  customerInfoPanelWidth,
  hasCustomerInfoPanel,
  reserveMainWorkspace,
  hasMainCanvas,
}: {
  hasDesktopRightPanel: boolean;
  customerInfoPanelWidth: number;
  hasCustomerInfoPanel: boolean;
  reserveMainWorkspace: boolean;
  hasMainCanvas: boolean;
}) {
  if (typeof window === "undefined") {
    return DOCKED_CONVERSATION_MAX_WIDTH;
  }

  const availableWidth = getAvailableDockedPanelWidth({
    hasDesktopRightPanel,
    reserveMainWorkspace,
    visiblePanelCount: hasCustomerInfoPanel ? 2 : 1,
    hasMainCanvas,
  });

  return Math.max(
    DOCKED_CONVERSATION_MIN_WIDTH,
    availableWidth - (hasCustomerInfoPanel ? customerInfoPanelWidth : 0),
  );
}

export function getDockedCustomerInfoMaxWidth({
  hasDesktopRightPanel,
  isConversationPanelOpen,
  dockedConversationWidth,
  reserveMainWorkspace,
  hasMainCanvas,
}: {
  hasDesktopRightPanel: boolean;
  isConversationPanelOpen: boolean;
  dockedConversationWidth: number;
  reserveMainWorkspace: boolean;
  hasMainCanvas: boolean;
}) {
  if (typeof window === "undefined") {
    return CUSTOMER_INFO_PANEL_MAX_WIDTH;
  }

  const hasDockedConversation = isConversationPanelOpen && window.innerWidth >= 800;
  const availableWidth = getAvailableDockedPanelWidth({
    hasDesktopRightPanel,
    reserveMainWorkspace,
    visiblePanelCount: hasDockedConversation ? 2 : 1,
    hasMainCanvas,
  });

  return Math.max(
    CUSTOMER_INFO_PANEL_MIN_WIDTH,
    availableWidth - (hasDockedConversation ? dockedConversationWidth : 0),
  );
}

export function getDockedCopilotMaxWidth({
  hasDesktopRightPanel,
  isConversationPanelOpen,
  dockedConversationWidth,
}: {
  hasDesktopRightPanel: boolean;
  isConversationPanelOpen: boolean;
  dockedConversationWidth: number;
}) {
  if (typeof window === "undefined") {
    return 320;
  }

  const rightPanelWidth = hasDesktopRightPanel && window.innerWidth >= 1024 ? 380 : 0;
  const conversationWidth = isConversationPanelOpen && window.innerWidth >= 800
    ? dockedConversationWidth + DOCKED_CONVERSATION_GAP
    : 0;

  return Math.max(
    315,
    window.innerWidth - 56 - conversationWidth - rightPanelWidth - MIN_MAIN_WORKSPACE_WIDTH - 16,
  );
}

export function getBalancedDockedPanelWidths({
  hasDesktopRightPanel,
  reserveMainWorkspace,
  showConversation,
  showCustomerInfo,
  hasMainCanvas,
  currentConversationWidth,
  currentCustomerInfoWidth,
}: {
  hasDesktopRightPanel: boolean;
  reserveMainWorkspace: boolean;
  showConversation: boolean;
  showCustomerInfo: boolean;
  hasMainCanvas: boolean;
  currentConversationWidth?: number;
  currentCustomerInfoWidth?: number;
}) {
  if (typeof window === "undefined") {
    return {
      conversationWidth: DOCKED_CONVERSATION_DEFAULT_WIDTH,
      customerInfoWidth: CUSTOMER_INFO_PANEL_DEFAULT_WIDTH,
    };
  }

  const visiblePanelCount = (showConversation ? 1 : 0) + (showCustomerInfo ? 1 : 0);
  const availableWidth = getAvailableDockedPanelWidth({
    hasDesktopRightPanel,
    reserveMainWorkspace,
    visiblePanelCount,
    hasMainCanvas,
  });

  if (!showCustomerInfo) {
    return {
      conversationWidth: Math.max(DOCKED_CONVERSATION_MIN_WIDTH, availableWidth),
      customerInfoWidth: CUSTOMER_INFO_PANEL_DEFAULT_WIDTH,
    };
  }

  if (!showConversation) {
    return {
      conversationWidth: DOCKED_CONVERSATION_DEFAULT_WIDTH,
      customerInfoWidth: Math.max(CUSTOMER_INFO_PANEL_MIN_WIDTH, availableWidth),
    };
  }

  const fallbackCustomerInfoWidth = Math.min(
    availableWidth - DOCKED_CONVERSATION_MIN_WIDTH,
    Math.max(CUSTOMER_INFO_PANEL_MIN_WIDTH, Math.round(availableWidth * 0.25)),
  );
  const fallbackConversationWidth = Math.max(DOCKED_CONVERSATION_MIN_WIDTH, availableWidth - fallbackCustomerInfoWidth);
  const nextConversationWidth = Math.max(DOCKED_CONVERSATION_MIN_WIDTH, currentConversationWidth ?? fallbackConversationWidth);
  const nextCustomerInfoWidth = Math.max(CUSTOMER_INFO_PANEL_MIN_WIDTH, currentCustomerInfoWidth ?? fallbackCustomerInfoWidth);
  const combinedWidth = nextConversationWidth + nextCustomerInfoWidth;

  if (combinedWidth <= 0) {
    return {
      conversationWidth: fallbackConversationWidth,
      customerInfoWidth: Math.max(CUSTOMER_INFO_PANEL_MIN_WIDTH, fallbackCustomerInfoWidth),
    };
  }

  const conversationRatio = nextConversationWidth / combinedWidth;
  const maxConversationWidth = availableWidth - CUSTOMER_INFO_PANEL_MIN_WIDTH;
  const conversationWidth = Math.min(
    maxConversationWidth,
    Math.max(DOCKED_CONVERSATION_MIN_WIDTH, Math.round(availableWidth * conversationRatio)),
  );
  const customerInfoWidth = Math.max(CUSTOMER_INFO_PANEL_MIN_WIDTH, availableWidth - conversationWidth);

  return {
    conversationWidth: availableWidth - customerInfoWidth,
    customerInfoWidth,
  };
}

export function formatRecentInteractionTimestamp(date: Date) {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const year = date.getFullYear().toString().slice(-2);
  const hours = date.getHours();
  const hours12 = hours % 12 || 12;
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  const meridiem = hours >= 12 ? "PM" : "AM";

  return `${month}/${day}/${year} ${hours12}:${minutes} ${meridiem}`;
}

export function getDispositionStatusColor(disposition: (typeof CALL_DISPOSITION_OPTIONS)[number]) {
  if (disposition === "Resolved") return "bg-[#208337]";
  if (disposition === "Escalated") return "bg-[#E32926]";
  return "bg-[#FFB800]";
}
