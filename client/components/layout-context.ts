/**
 * Layout context — extracted into its own module so that Vite Fast Refresh
 * can hot-reload Layout.tsx without recreating the context object.
 *
 * All consumers should import from this file instead of from Layout.tsx.
 */
import React, { createContext, useContext } from "react";
import type { CustomerChannel } from "@/lib/customer-database";
import type { LeadIntelligenceData } from "@/lib/static-assignments";
import type { ConversationStatus, SharedConversationData } from "@/components/ConversationPanel";
import type { RecentInteractionItem } from "@/components/RecentInteractionsPanel";

// ─── Primitive types ──────────────────────────────────────────────────────────

export type RightPanelView = "info" | "desk" | "interactions" | null;
export type DeskCanvasView = "desk" | "copilot" | "notes" | "add" | "customer" | "notifications";
export type DeskPanelSelection = {
  initialTab?: string;
  ticketId?: string;
} | null;

export type AssignmentChannel = Extract<CustomerChannel, "chat" | "sms" | "email" | "voice" | "whatsapp">;

export type QueueAssignmentStatus = ConversationStatus | "resolved" | "escalated" | "parked";

export type QueuePreviewItem = {
  id: string;
  customerRecordId: string;
  channel: AssignmentChannel;
  initials: string;
  name: string;
  customerId: string;
  lastUpdated: string;
  time: string;
  preview: string;
  label?: string;
  statusLabel?: string;
  priority: string;
  priorityClassName: string;
  badgeColor: string;
  icon: React.ElementType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  /** Timestamp (ms) when this notification was first shown — used to sync the live escalation timer. */
  escalatedAt?: number;
  /** When set, the toast shows the AI Confidence meter and Approve button. */
  aiConfidence?: number;
  /** Reason shown beneath the confidence bar. */
  aiConfidenceReason?: string;
  /** Present on Sales Lead notifications — renders the Lead Intelligence Card variant. */
  leadIntelligence?: LeadIntelligenceData;
};

export type ResolvedAssignment = {
  id: string;
  name: string;
  preview: string;
  priority: string;
  channel: AssignmentChannel;
  resolvedAt: number;
  customerRecordId: string;
  /** The status of the case at the time it was dismissed from the rail. */
  status: QueueAssignmentStatus;
  /** The agent it was assigned to when dismissed — preserved so the queue row still shows "Assigned". */
  assignedTo: string | null;
  /**
   * The static assignment id (e.g. "static-11") that this live assignment was accepted from.
   * Used to correctly key into acceptedStaticsStore and rejectedIds, both of which use static ids.
   */
  staticId?: string;
  /**
   * Extra channels that were open alongside the primary channel when the case was dismissed.
   * Stored so they can be restored when the agent re-opens the case.
   */
  additionalChannels?: Array<{ channel: AssignmentChannel; preview: string }>;
};

export type AcceptIssueData = {
  id: string;
  name: string;
  customerId: string;
  customerRecordId?: string;
  channel: AssignmentChannel;
  priority: string;
  preview: string;
  status: QueueAssignmentStatus;
  waitTime: string;
  isOutbound?: boolean;
  /** When provided, seeds the conversation panel with this state instead of a blank preview. */
  initialConversation?: SharedConversationData;
  onCreated?: (assignmentId: string) => void;
};

// ─── Context value ─────────────────────────────────────────────────────────────

export interface LayoutContextValue {
  activeRightPanel: RightPanelView;
  isRightPanelOpen: boolean;
  isInfoOpen: boolean;
  isDeskOpen: boolean;
  isInteractionsOpen: boolean;
  isAddNewOpen: boolean;
  isAgentInCall: boolean;
  isAgentAvailable: boolean;
  isConversationPanelOpen: boolean;
  isConversationPopunderOpen: boolean;
  activeConversationChannel: CustomerChannel;
  activeConversationTabs: CustomerChannel[];
  selectedAssignment: QueuePreviewItem;
  visibleAssignments: QueuePreviewItem[];
  assignmentStatusesById: Record<string, QueueAssignmentStatus>;
  deskPanelSelection: DeskPanelSelection;
  recentInteractions: RecentInteractionItem[];
  conversationState: SharedConversationData;
  activeCallAssignmentId: QueuePreviewItem["id"] | null;
  toggleInfo: () => void;
  toggleDesk: () => void;
  openDeskPanel: (selection?: Exclude<DeskPanelSelection, null>) => void;
  closeAppSpacePanel: () => void;
  closeFloatingAppSpacePanel: () => void;
  isAppSpacePanelInDragMode: boolean;
  toggleInteractions: () => void;
  toggleConversationPanel: () => void;
  openConversationPanel: () => void;
  openConversationPopunder: (anchorRect?: DOMRect | null) => void;
  closeConversationPopunder: () => void;
  setActiveConversationChannel: (channel: CustomerChannel) => void;
  openCustomerConversation: (customerRecordId: string, channel: AssignmentChannel) => void;
  openRecentInteractionAssignment: (interaction: RecentInteractionItem) => void;
  setConversationState: (conversation: SharedConversationData) => void;
  /** Update the stored conversation for a specific assignment ID (not just the selected one). */
  setConversationStateForAssignment: (assignmentId: string, conversation: SharedConversationData) => void;
  closeRightPanel: () => void;
  resolvedAssignments: ResolvedAssignment[];
  selectAssignment: (assignmentId: QueuePreviewItem["id"]) => void;
  acceptIssue: (data: AcceptIssueData) => void;
  undockDeskPanel: (view: DeskCanvasView, event: React.MouseEvent<HTMLElement>) => void;
  toggleCallPopunder: (anchorRect?: DOMRect | null, customerRecordId?: string) => void;
  openCallDisposition: (anchorRect?: DOMRect | null) => void;
  startCallStatus: () => void;
  endCallStatus: () => void;
  pendingAcceptanceIds: Set<string>;
  acceptPendingAssignment: (assignmentId: string) => void;
  rejectPendingAssignment: (assignmentId: string) => void;
  reviewPendingAssignment: (assignmentId: string) => void;
  taskSummaryIds: Set<string>;
  closeChannelKeepTask: (assignmentId: string) => void;
  activatedChannelIds: Set<string>;
  liveLastCustomerCommentByAssignmentId: Record<string, string>;
  setAssignmentStatus: (assignmentId: string, status: QueueAssignmentStatus) => void;
  openCopilot: () => void;
  openChatPopover: () => void;
  isBriefingDismissed: boolean;
  incomingNotifications: QueuePreviewItem[];
  pushToIncomingNotifications: (item: QueuePreviewItem) => void;
  /** Dismiss the incoming toast for a customer (by customerRecordId) when an action is taken from the queue/alert. */
  dismissIncomingByCustomer: (customerRecordId: string) => void;
  pendingMonitorCaseId: string | null;
  clearPendingMonitorCaseId: () => void;
  pendingTakeoverCaseId: string | null;
  clearPendingTakeoverCaseId: () => void;
  /** Decrement the escalated rail badge count by 1 (min 0). Call when a case is resolved without going through the active rail. */
  decrementEscalatedCount: () => void;
  /** Signal that Jordan's (Aria's) case has been resolved — triggers the second escalation (Sofia / Jacob). */
  onJordanCaseResolved: () => void;
  /** Signal that Sofia's (Jacob's) case has been resolved — triggers the third escalation (Marcus / Emily). */
  onSofiaCaseResolved: () => void;
  /** Signal that Marcus's (Emily's) case has been resolved — triggers the fourth escalation (Terry / Aria). */
  onMarcusCaseResolved: () => void;
  /** Show the dismissal confirmation toast (bottom-right) with case summary + external system writes. */
  showDismissalToast: (summary: { customerName: string; customerId: string; status: string; resolvedStatus: string; actions: string[]; preview: string; botType: string; channel: string }) => void;
  /** Always shows a "transferred" handoff toast for the given item, even if the original toast was already dismissed. */
  pushTransferredToast: (item: {
    name: string;
    customerRecordId: string;
    customerId?: string;
    id?: string;
    channel: AssignmentChannel;
    label?: string;
    priority?: string;
    preview?: string;
  }) => void;
}

// ─── Context + hook ───────────────────────────────────────────────────────────

export const LayoutContext = createContext<LayoutContextValue | null>(null);

export function useLayoutContext(): LayoutContextValue {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error("useLayoutContext must be used within Layout");
  }
  return context;
}
