import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  LayoutContext,
  useLayoutContext,
  type LayoutContextValue,
  type RightPanelView,
  type DeskCanvasView,
  type DeskPanelSelection,
  type AssignmentChannel,
  type QueueAssignmentStatus,
  type QueuePreviewItem,
  type ResolvedAssignment,
  type AcceptIssueData,
} from "@/components/layout-context";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  ArrowRightLeft,
  Bell,
  LogOut,
  BookUser,
  Bot,
  CalendarCheck,
  Check,
  ListChecks,
  Loader2,
  Settings,
  Minus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  GripHorizontal,
  Globe,
  Inbox,
  Mail,
  Package,
  ShoppingCart,
  Ticket,
  Trash2,
  MessageCircle,
  MessageSquare,
  Mic,
  Monitor,
  Moon,
  PanelLeft,
  PanelRight,
  Pin,
  Pause,
  TriangleAlert,
  RefreshCw,
  User,
  UserCheck,
  Phone,
  PhoneOff,
  Plus,
  Search,
  Sparkles,
  Sun,
  Volume2,
  X,
  UserX,
  MoreVertical,
  CheckCircle2,
  Building2,
  ExternalLink,
  FileSearch,
  FlaskConical,
  ScrollText,
  Layers2,
  Star,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import CopilotPopunder, { CopilotContent, type CopilotDragActivation } from "@/components/CopilotPopunder";
import ConversationPanel, { type ConversationMessage, type ConversationStatus, type InlineSuggestion, type SharedConversationData } from "@/components/ConversationPanel";
import DeskDataTable from "@/components/DeskDataTable";
import DirectoryPanel from "@/components/DirectoryPanel";
import AddPanelContent from "@/components/AddPanelContent";
import ChatPopoverContent from "@/components/ChatPopover";
import NotificationsPopoverContent, { seedNotifications, type AppNotification } from "@/components/NotificationsPopover";
import NotesPanel from "@/components/NotesPanel";
import CustomerHistoryTimeline from "@/components/CustomerHistoryTimeline";
import { conversationChannelOptions } from "@/components/ConversationChannelToggleGroup";
import { type RecentInteractionItem } from "@/components/RecentInteractionsPanel";
import { cn } from "@/lib/utils";
import {
  buildTakeoverConversation,
  createConversationState,
  customerDatabase,
  defaultCustomerId,
  getCustomerRecord,
  type CustomerChannel,
  type CustomerHistoryDot,
  type CustomerHistoryItem,
  type CustomerHistoryItemType,
  type CustomerHistoryInteraction,
  type CustomerQueueIcon,
} from "@/lib/customer-database";
import { getCustomerAssignmentEntry } from "@/lib/customer-assignment-tasks";
import { staticAssignments } from "@/lib/static-assignments";
import { EscalatedCaseModal, type EscalatedCaseModalData } from "@/components/EscalatedCaseModal";
import { pendingQueueRejections, pendingResolvedIds, pendingEscalatedIds, acceptedStaticsStore, pendingHandoffConversations } from "@/lib/queue-state";
import { getEscalationStart, recordEscalationStart } from "@/lib/escalation-timers";
import { SCENARIO_CHANNEL } from "@/lib/scenario-channel";
import type { AppMsg, ControllerMsg } from "@/lib/scenario-channel";
import { toast } from "sonner";
import { CURRENT_AGENT_NAME } from "@/lib/agent-roster";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import {
  type FloatingPanelId,
  type CombinedInteractionPanelTab,
  type AgentStatus,
  type WorkspaceOption,
  type QueueSortOption,
  type GroupedQueueItem,
  type CallPopunderPosition,
  type CallPopunderSize,
  type ConversationPopunderPosition,
  type ConversationPopunderSize,
  type CustomerInfoPopunderPosition,
  type CustomerInfoPopunderSize,
  type DeskCanvasPopunderPosition,
  type DeskCanvasPopunderSize,
  type TranscriptLine,
  type TranscriptPopunderPosition,
  type TranscriptPopunderSize,
  type CallPopunderMode,
  type AgentChatNotification,
  statusOptions,
  initialWorkspaceOptions,
  conversationStatusOptions,
  getConversationStatusChipClasses,
  getConversationStateKey,
  createFreshConversationState,
  CALL_POPUNDER_WIDTH,
  CALL_POPUNDER_MARGIN,
  CALL_POPUNDER_GAP,
  CONVERSATION_POPOUNDER_MARGIN,
  CONVERSATION_POPOUNDER_GAP,
  DOCKED_CONVERSATION_MIN_WIDTH,
  DOCKED_CONVERSATION_DEFAULT_WIDTH,
  DOCKED_CONVERSATION_MAX_WIDTH,
  DOCKED_CONVERSATION_GAP,
  DOCKED_CONVERSATION_CONTENT_ENTER_DELAY_MS,
  DOCKED_CONVERSATION_CONTENT_TRANSITION_MS,
  CUSTOMER_INFO_PANEL_CONTENT_ENTER_DELAY_MS,
  CUSTOMER_INFO_PANEL_CONTENT_TRANSITION_MS,
  INLINE_APP_SPACE_PANEL_ENTER_DELAY_MS,
  MIN_MAIN_WORKSPACE_WIDTH,
  CUSTOMER_INFO_PANEL_MIN_WIDTH,
  CUSTOMER_INFO_PANEL_DEFAULT_WIDTH,
  CUSTOMER_INFO_PANEL_MAX_WIDTH,
  CUSTOMER_INFO_PANEL_GAP,
  CUSTOMER_INFO_PANEL_BREAKPOINT,
  CUSTOMER_INFO_POPOUNDER_MARGIN,
  CUSTOMER_INFO_POPOUNDER_GAP,
  DESK_CANVAS_POPOUNDER_MARGIN,
  DESK_CANVAS_POPOUNDER_MIN_HEIGHT,
  DESK_CANVAS_POPOUNDER_DESK_MIN_WIDTH,
  DESK_CANVAS_POPOUNDER_COPILOT_MIN_WIDTH,
  DESK_CANVAS_POPOUNDER_DESK_DEFAULT_WIDTH,
  DESK_CANVAS_POPOUNDER_COPILOT_DEFAULT_WIDTH,
  ASSIGNMENTS_POPOVER_Z_INDEX,
  FLOATING_PANEL_BASE_Z_INDEX,
  COPILOT_DOCK_BREAKPOINT,
  COMBINED_INTERACTION_PANEL_BREAKPOINT,
  COMBINED_INTERACTION_PANEL_CANVAS_BREAKPOINT,
  CALL_DISPOSITION_OPTIONS,
  getDeskCanvasPopunderMinWidth,
  getDeskCanvasPopunderDefaultWidth,
  getAvailableDockedPanelWidth,
  getDockedConversationMaxWidth,
  getDockedCustomerInfoMaxWidth,
  getDockedCopilotMaxWidth,
  getBalancedDockedPanelWidths,
  formatRecentInteractionTimestamp,
  getDispositionStatusColor,
} from "@/lib/layout-constants";
import {
  queueIconMap,
  launchedAssignmentIconMap,
  baseAssignmentChannelByCustomerRecordId,
  randomIncomingChannels,
  queuePreviewItems,
  queuePreviewItemsByCustomerRecordId,
  priorityRankMap,
  priorityClassNameMap,
  priorityBadgeColorMap,
  priorityDotClassNameMap,
  priorityIconClassNameMap,
  initialVisibleAssignments,
  initialVisibleAssignmentIds,
  initialSelectedAssignment,
  initialSelectedAssignmentId,
  getLaunchedAssignmentPreview,
  createLaunchedAssignment,
  getRecentInteractionAssignmentStatus,
  getAssignmentChannelFromRecentInteractionType,
  formatRecentInteractionAssignmentTime,
  createRecentInteractionAssignment,
  groupQueueItems,
} from "@/lib/queue-helpers";
import {
  defaultConversationState,
  createCustomConversationState,
  taskAiOverviewByCustomerId,
  getTaskAiOverview,
  getIncomingCustomerIssue,
  lastCustomerMessageByKey,
  overviewActionsByCustomerName,
  getOverviewActions,
  SUMMARY_COPILOT_REASONING_STEPS,
  getCustomerIssueSummary,
  getConversationOverviewSummary,
  getInteractionOverview,
  getAgentNextSteps,
  getAiActionsTaken,
  getWhyAgentIsNeeded,
} from "@/lib/conversation-state-helpers";

// Default copilot analysis text used when no customer-specific response is configured.
const COPILOT_FALLBACK_RESPONSE = "Based on the case analysis, the customer's issue appears to stem from an account configuration mismatch. The previous resolution attempts addressed symptoms but not the root cause. I recommend verifying the account settings directly, issuing a service credit for the disruption, and scheduling a follow-up within 48 hours to confirm resolution.";

// When a case is transferred, this captures the recipient name so the resolved
// assignment record shows the correct "Assigned to" instead of the current agent.
let pendingTransferRecipient: string | null = null;

// Prevents the Jordan Davis escalation from re-firing if Layout remounts during navigation.
let escalationFired = false;
// Prevents the Sofia Martinez (Jacob) escalation from re-firing after Jordan's case resolves.
let escalation2Fired = false;
// Prevents the Marcus Webb (Emily) escalation from re-firing after Sofia's case resolves.
let escalation3Fired = false;
// Prevents the Terry Williams (Aria) sales-lead escalation from re-firing after Marcus's case resolves.
let escalation4Fired = false;
// Resolved flags — read by the BroadcastChannel HELLO handler to report current state.
let jordanResolvedFlag = false;
let sofiaResolvedFlag = false;
let marcusResolvedFlag = false;

interface LayoutProps {
  children: React.ReactNode;
}

// AgentChatNotification is imported below and re-exported
export type { AgentChatNotification } from "@/lib/layout-constants";

function ConversationStatusDropdown({
  status,
  onStatusChange,
  onOpenChange,
}: {
  status: QueueAssignmentStatus;
  onStatusChange: (status: QueueAssignmentStatus) => void;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors",
            getConversationStatusChipClasses(status),
          )}
        >
          <span>{conversationStatusOptions.find((option) => option.value === status)?.label ?? "Open"}</span>
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-32 rounded-xl border border-black/10 bg-white p-1 shadow-[0_16px_40px_rgba(0,0,0,0.12)]">
        {conversationStatusOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onStatusChange(option.value)}
            className={cn(
              "rounded-lg px-3 py-2 text-xs font-medium text-[#333333] focus:bg-[#F8F8F9]",
              option.value === status && "bg-[#F8F8F9]",
            )}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ConversationHeaderSubhead({
  conversation,
  activeChannel,
}: {
  conversation: SharedConversationData;
  activeChannel: CustomerChannel;
}) {
  const channelLabel = conversationChannelOptions.find((option) => option.channel === activeChannel)?.label ?? activeChannel;

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#7A7A7A]">
      <span className="font-medium text-[#5B5B5B]">{conversation.customerName}</span>
      <span aria-hidden="true">·</span>
      <span>{channelLabel}</span>
    </div>
  );
}

function CustomerContactDropdown({
  onOpenCall,
  onOpenChannel,
  isCallDisabled,
}: {
  onOpenCall: (anchorRect?: DOMRect | null) => void;
  onOpenChannel: (channel: Extract<CustomerChannel, "sms" | "email" | "whatsapp">) => void;
  isCallDisabled: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label="Add New Channel"
          onMouseDown={(event) => event.stopPropagation()}
          className="h-8 rounded-full border-[#166CCA] px-3 text-[#166CCA] hover:bg-[#166CCA]/5 hover:text-[#166CCA]"
        >
          <Plus className="mr-1.5 h-3.5 w-3.5 stroke-[2]" />
          New Channel
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-44 rounded-2xl border border-black/10 bg-white p-1 shadow-[0_18px_50px_rgba(15,23,42,0.14)]"
      >
        <DropdownMenuItem
          onClick={(event) => onOpenCall(event.currentTarget.getBoundingClientRect())}
          disabled={isCallDisabled}
          className="rounded-xl px-3 py-2 text-sm text-[#111827]"
        >
          <Phone className="mr-2 h-4 w-4" />
          Call
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onOpenChannel("email")}
          className="rounded-xl px-3 py-2 text-sm text-[#111827]"
        >
          <Mail className="mr-2 h-4 w-4" />
          Email
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onOpenChannel("sms")}
          className="rounded-xl px-3 py-2 text-sm text-[#111827]"
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          SMS
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onOpenChannel("whatsapp")}
          className="rounded-xl px-3 py-2 text-sm text-[#111827]"
        >
          <WhatsAppIcon className="mr-2 h-4 w-4" />
          WhatsApp
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ConversationOverviewButton({
  conversation,
  isOpen,
  onOpenChange,
}: {
  conversation: SharedConversationData;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const overviewSummary = getConversationOverviewSummary(conversation);

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange} modal={false}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onMouseDown={(event) => event.stopPropagation()}
          className="h-8 rounded-full border-black/10 px-3 text-[#333333]"
        >
          <span>Overview</span>
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={8}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
        className="z-[95] w-[320px] rounded-2xl border border-[#A37A00] bg-[#FFF6E0] p-0 shadow-[0_16px_40px_rgba(122,91,0,0.16)]"
      >
        <div className="flex items-center justify-between border-b border-[#A37A00] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#A37A00]">Context overview</p>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[#A37A00] transition-colors hover:bg-[#FFF6E0]"
            aria-label="Close context overview"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-4 py-3 text-sm leading-6 text-[#6B5A1B]">
          <p>{overviewSummary}</p>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function CallControlsPopunder({
  position,
  size,
  mode,
  zIndex,
  onPositionChange,
  onSizeChange,
  onClose,
  onLaunchCall,
  onEndCall,
  onSelectDisposition,
  onCancelDisposition,
  onInteractStart,
  isJoiningCall = false,
  joiningCallCustomerName = "",
  initialAccountNumber = "",
}: {
  position: CallPopunderPosition;
  size: CallPopunderSize;
  mode: CallPopunderMode;
  zIndex: number;
  onPositionChange: (position: CallPopunderPosition) => void;
  onSizeChange: (size: CallPopunderSize) => void;
  onClose: () => void;
  onLaunchCall: () => void;
  onEndCall: () => void;
  onSelectDisposition: (disposition: (typeof CALL_DISPOSITION_OPTIONS)[number]) => void;
  onCancelDisposition?: () => void;
  onInteractStart?: () => void;
  isJoiningCall?: boolean;
  joiningCallCustomerName?: string;
  /** Pre-populates the Account Number field on open (e.g. for inbound lead callbacks). */
  initialAccountNumber?: string;
}) {
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const resizeStartRef = useRef({ mouseX: 0, mouseY: 0, width: 360, height: 520 });
  const isDraggingRef = useRef(false);
  const isResizingRef = useRef(false);
  const [accountNumber, setAccountNumber] = useState(initialAccountNumber);
  const [isTestingAudio, setIsTestingAudio] = useState(false);
  const [audioLevels, setAudioLevels] = useState({ mic: 42, speaker: 58 });
  const [selectedDisposition, setSelectedDisposition] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== "setup") {
      setIsTestingAudio(false);
      return;
    }

    if (!isTestingAudio) return;

    const intervalId = window.setInterval(() => {
      setAudioLevels({
        mic: 20 + Math.round(Math.random() * 70),
        speaker: 25 + Math.round(Math.random() * 65),
      });
    }, 350);

    return () => window.clearInterval(intervalId);
  }, [isTestingAudio, mode]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const width = mode === "controls" ? size.width : CALL_POPUNDER_WIDTH;
    const height = mode === "setup" ? 320 : mode === "connecting" ? 296 : mode === "controls" ? size.height : 420;
    const nextPosition = {
      x: Math.min(
        Math.max(CALL_POPUNDER_MARGIN, position.x),
        window.innerWidth - width - CALL_POPUNDER_MARGIN,
      ),
      y: Math.min(
        Math.max(CALL_POPUNDER_MARGIN, position.y),
        window.innerHeight - height - CALL_POPUNDER_MARGIN,
      ),
    };

    if (nextPosition.x !== position.x || nextPosition.y !== position.y) {
      onPositionChange(nextPosition);
    }
  }, [mode, onPositionChange, position.x, position.y, size.height, size.width]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const width = mode === "controls" ? size.width : CALL_POPUNDER_WIDTH;
    const height = mode === "setup" ? 320 : mode === "connecting" ? 296 : mode === "controls" ? size.height : 420;

      if (isDraggingRef.current) {
        const nextX = event.clientX - dragOffsetRef.current.x;
        const nextY = event.clientY - dragOffsetRef.current.y;

        onPositionChange({
          x: Math.min(
            Math.max(CALL_POPUNDER_MARGIN, nextX),
            window.innerWidth - width - CALL_POPUNDER_MARGIN,
          ),
          y: Math.min(
            Math.max(CALL_POPUNDER_MARGIN, nextY),
            window.innerHeight - height - CALL_POPUNDER_MARGIN,
          ),
        });
        return;
      }

      if (!isResizingRef.current || mode !== "controls") return;

      const deltaX = event.clientX - resizeStartRef.current.mouseX;
      const deltaY = event.clientY - resizeStartRef.current.mouseY;

      onSizeChange({
        width: Math.min(
          Math.max(320, resizeStartRef.current.width + deltaX),
          window.innerWidth - position.x - CALL_POPUNDER_MARGIN,
        ),
        height: Math.min(
          Math.max(360, resizeStartRef.current.height + deltaY),
          window.innerHeight - position.y - CALL_POPUNDER_MARGIN,
        ),
      });
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      isResizingRef.current = false;
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
    };
  }, [mode, onPositionChange, onSizeChange, position.x, position.y, size.height, size.width]);

  return (
    <div
      className="fixed flex flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.18)]"
      style={{
        left: position.x,
        top: position.y,
        width: mode === "controls" ? size.width : CALL_POPUNDER_WIDTH,
        height: mode === "controls" ? size.height : undefined,
        zIndex,
      }}
    >
      <div
        className={cn(
          "flex items-center border-b border-black/10 bg-[#F8F8F9] px-3 py-2",
          mode === "disposition" ? "justify-between cursor-default" : "cursor-grab active:cursor-grabbing justify-between",
          (mode === "controls") && "justify-start",
        )}
        onMouseDown={(event) => {
          if (mode === "disposition") return;
          onInteractStart?.();
          const bounds = event.currentTarget.parentElement?.getBoundingClientRect();
          if (!bounds) return;

          isDraggingRef.current = true;
          dragOffsetRef.current = {
            x: event.clientX - bounds.left,
            y: event.clientY - bounds.top,
          };
          document.body.style.userSelect = "none";
        }}
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-[#333333]">
          {mode !== "disposition" && <GripHorizontal className="h-4 w-4 text-[#7A7A7A]" />}
          {mode === "setup"
            ? (isJoiningCall ? "Join Call" : "Start Call")
            : mode === "connecting"
              ? "Connecting Call"
              : mode === "controls"
                ? "Active Call"
                : "Disposition"}
        </div>
        {(mode === "setup" || mode === "connecting" || mode === "disposition") && (
          <button
            type="button"
            onClick={mode === "disposition" ? onCancelDisposition : onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-[#7A7A7A] transition-colors hover:bg-white dark:hover:bg-[#1C2536] hover:text-[#333333] dark:hover:text-[#CBD5E1]"
            aria-label={mode === "disposition" ? "Cancel disposition" : "Close call controls"}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className={cn("space-y-2 p-3", mode === "controls" && "flex min-h-0 flex-1 flex-col")}>
        {mode === "setup" ? (
          <>
            {isJoiningCall ? (
              <div className="rounded-xl border border-[#BFDBFE] bg-[#EBF4FD] px-4 py-3.5">
                <p className="text-[13px] leading-relaxed text-[#1D2939]">
                  You are about to join a call on hold with{" "}
                  <span className="font-semibold">{joiningCallCustomerName}</span>.
                  Please click <span className="font-semibold">"Launch Call"</span> when ready.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <label htmlFor="call-account-number" className="text-xs font-medium text-[#333333]">
                  Account Number
                </label>
                <Input
                  id="call-account-number"
                  value={accountNumber}
                  onChange={(event) => setAccountNumber(event.target.value)}
                  placeholder="Enter account number"
                  className="h-9 border-black/10 text-sm"
                />
              </div>
            )}

            <div className="space-y-2 rounded-xl border border-black/10 bg-[#F8F8F9] p-3">
              <div className="flex items-center justify-between gap-3 text-sm text-[#333333]">
                <div className="flex items-center gap-2">
                  <Mic className="h-4 w-4 text-[#7A7A7A]" />
                  <span>Microphone volume</span>
                </div>
                <span className="text-xs text-[#7A7A7A]">{audioLevels.mic}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-black/10">
                <div className="h-full rounded-full bg-[#166CCA] transition-[width] duration-300" style={{ width: `${audioLevels.mic}%` }} />
              </div>

              <div className="flex items-center justify-between gap-3 pt-1 text-sm text-[#333333]">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-[#7A7A7A]" />
                  <span>Speaker volume</span>
                </div>
                <span className="text-xs text-[#7A7A7A]">{audioLevels.speaker}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-black/10">
                <div className="h-full rounded-full bg-[#166CCA] transition-[width] duration-300" style={{ width: `${audioLevels.speaker}%` }} />
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => setIsTestingAudio((current) => !current)}
                className="mt-1 w-full justify-center border-black/10 text-[#333333]"
              >
                {isTestingAudio ? "Stop Test" : "Test Audio"}
              </Button>
            </div>

            <Button
              type="button"
              onClick={onLaunchCall}
              disabled={!isJoiningCall && !accountNumber.trim()}
              className="w-full bg-[#208337] text-white hover:bg-[#1C7330]"
            >
              Launch Call
            </Button>
          </>
        ) : mode === "connecting" ? (
          <div className="rounded-xl border border-black/10 bg-[#F8F8F9] px-3 py-4 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#C5DEF5] text-[#166CCA] animate-pulse">
              <Phone className="h-5 w-5" />
            </div>
            <div className="mt-3 text-sm font-semibold text-[#333333]">Connecting your call…</div>
            <p className="mt-1 text-xs leading-5 text-[#6B7280]">
              We’re reaching the customer now. The transcript will appear once the call is live.
            </p>
          </div>
        ) : mode === "controls" ? (
          <div className="flex flex-shrink-0 items-stretch gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-auto flex-1 flex-col gap-1 border-black/10 px-2 py-2 text-[11px] text-[#333333]"
            >
              <ArrowRightLeft className="h-4 w-4" />
              Transfer
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-auto flex-1 flex-col gap-1 border-black/10 px-2 py-2 text-[11px] text-[#333333]"
            >
              <Pause className="h-4 w-4" />
              Hold
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onEndCall}
              className="h-auto flex-1 flex-col gap-1 border-[#E32926]/20 px-2 py-2 text-[11px] text-[#E32926] hover:bg-[#FDEAEA] hover:text-[#E32926]"
            >
              <PhoneOff className="h-4 w-4" />
              End Call
            </Button>
          </div>
        ) : (
          <>
            <p className="text-[10px] leading-5 text-[#98A2B3]">
              Select a disposition to complete the call.
            </p>
            <div className="-mx-3 divide-y divide-[#F2F4F7] overflow-y-auto" style={{ maxHeight: 320 }}>
              {CALL_DISPOSITION_OPTIONS.map((option) => {
                const isSelected = selectedDisposition === option;
                const isDisabled = selectedDisposition !== null && !isSelected;
                return (
                  <button
                    key={option}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => {
                      if (selectedDisposition) return;
                      setSelectedDisposition(option);
                      setTimeout(() => {
                        onSelectDisposition(option);
                        setSelectedDisposition(null);
                      }, 700);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors",
                      isSelected ? "bg-[#EBF4FD] text-[#166CCA]" : "hover:bg-[#F9FAFB] text-[#344054]",
                      isDisabled && "opacity-40 cursor-not-allowed",
                    )}
                  >
                    <span className="text-[12px] font-medium">{option}</span>
                    {isSelected && <span className="text-[10px] font-semibold text-[#166CCA]">Selected</span>}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {mode === "controls" && (
        <button
          type="button"
          aria-label="Resize call controls"
          className="absolute bottom-0 right-0 h-5 w-5 cursor-se-resize"
          onMouseDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
            isResizingRef.current = true;
            resizeStartRef.current = {
              mouseX: event.clientX,
              mouseY: event.clientY,
              width: size.width,
              height: size.height,
            };
            document.body.style.userSelect = "none";
          }}
        >
          <span className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-sm border-b-2 border-r-2 border-[#A1A1AA]" />
        </button>
      )}
    </div>
  );
}

const NiceLogoIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="flex-shrink-0"
    aria-hidden="true"
  >
    <path
      d="M23.7188 5.81445C23.8757 5.8146 24.0015 5.94038 24 6.0957C23.8494 15.8179 15.9182 23.6985 6.13379 23.8477C5.97839 23.8493 5.85077 23.7237 5.85059 23.5684V19.3086C5.85059 19.1563 5.97502 19.0335 6.12891 19.0303C13.2448 18.8844 19.0048 13.1599 19.1523 6.08984C19.1556 5.93599 19.2788 5.81255 19.4326 5.8125L23.7188 5.81445ZM12.2559 0.000976562C13.8714 0.00104033 15.1804 1.30219 15.1807 2.90625C15.1807 4.51051 13.8716 5.81244 12.2559 5.8125C10.6401 5.8125 9.33008 4.51055 9.33008 2.90625C9.33031 1.30215 10.6402 0.000976562 12.2559 0.000976562ZM2.92578 0C4.5412 0.000213196 5.85033 1.30132 5.85059 2.90527C5.85059 4.50944 4.54135 5.81131 2.92578 5.81152C1.31003 5.81152 0 4.50957 0 2.90527C0.000253194 1.30119 1.31018 0 2.92578 0Z"
      fill="#6E00FD"
    />
  </svg>
);

function AddNewPopoverContent({
  visible,
  position,
  size,
  zIndex,
  onPositionChange,
  onSizeChange,
  onClose,
  onInteractStart,
}: {
  visible?: boolean;
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
  zIndex: number;
  onPositionChange: (position: { x: number; y: number }) => void;
  onSizeChange: (size: { width: number; height: number }) => void;
  onClose: () => void;
  onInteractStart?: () => void;
}) {
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const resizeStartRef = useRef({ mouseX: 0, mouseY: 0, width: 360, height: 720 });
  const isDraggingRef = useRef(false);
  const isResizingRef = useRef(false);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const margin = 16;

      if (isDraggingRef.current) {
        const nextX = event.clientX - dragOffsetRef.current.x;
        const nextY = event.clientY - dragOffsetRef.current.y;

        onPositionChange({
          x: Math.min(Math.max(margin, nextX), window.innerWidth - size.width - margin),
          y: Math.min(Math.max(margin, nextY), window.innerHeight - size.height - margin),
        });
        return;
      }

      if (!isResizingRef.current) return;

      const deltaX = event.clientX - resizeStartRef.current.mouseX;
      const deltaY = event.clientY - resizeStartRef.current.mouseY;

      onSizeChange({
        width: Math.min(
          Math.max(320, resizeStartRef.current.width + deltaX),
          window.innerWidth - position.x - margin,
        ),
        height: Math.min(
          Math.max(420, resizeStartRef.current.height + deltaY),
          window.innerHeight - position.y - margin,
        ),
      });
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      isResizingRef.current = false;
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
    };
  }, [onPositionChange, onSizeChange, position.x, position.y, size.height, size.width]);

  return (
    <div
      className={cn(
        "fixed flex min-h-[420px] min-w-[320px] flex-col overflow-hidden rounded-xl border border-black/10 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.18)] transition-[opacity,transform] duration-[280ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[opacity,transform]",
        visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-[0.97] translate-y-1",
      )}
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        maxWidth: "calc(100vw - 2rem)",
        maxHeight: "calc(100vh - 2rem)",
        zIndex,
      }}
    >
      <div
        className="flex cursor-grab items-center justify-between gap-3 border-b border-border bg-background/50 px-5 py-4 active:cursor-grabbing"
        onMouseDown={(event) => {
          onInteractStart?.();
          isDraggingRef.current = true;
          dragOffsetRef.current = {
            x: event.clientX - position.x,
            y: event.clientY - position.y,
          };
          document.body.style.userSelect = "none";
        }}
      >
        <div className="flex items-center gap-3">
          <GripHorizontal className="h-4 w-4 flex-shrink-0 text-[#7A7A7A]" />
          <h3 className="text-sm font-semibold tracking-tight text-[#333333]">Add New</h3>
        </div>
        <button
          type="button"
          onMouseDown={(event) => event.stopPropagation()}
          onClick={onClose}
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[#7A7A7A] transition-colors hover:bg-white dark:hover:bg-[#1C2536] hover:text-[#333333] dark:hover:text-[#CBD5E1]"
          aria-label="Close Add New popunder"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <AddPanelContent />

      <button
        type="button"
        aria-label="Resize Add New popunder"
        className="absolute bottom-0 right-0 h-5 w-5 cursor-se-resize"
        onMouseDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
          isResizingRef.current = true;
          resizeStartRef.current = {
            mouseX: event.clientX,
            mouseY: event.clientY,
            width: size.width,
            height: size.height,
          };
          document.body.style.userSelect = "none";
        }}
      >
        <span className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-sm border-b-2 border-r-2 border-[#A1A1AA]" />
      </button>
    </div>
  );
}

function CustomerProfilePopover({
  customerName,
}: {
  customerRecordId: string;
  customerName: string;
  onOpenCustomerInfo?: (event?: React.MouseEvent<HTMLElement>) => void;
  isCustomerInfoOpen?: boolean;
}) {
  return (
    <span className="text-sm font-semibold tracking-tight text-[#333333] dark:text-[#E2E8F0]">{customerName}</span>
  );
}

/** Standalone icon button that opens the Customer Information popunder. */
function CustomerInfoIconButton({
  onOpenCustomerInfo,
  isCustomerInfoOpen = false,
}: {
  onOpenCustomerInfo: (event?: React.MouseEvent<HTMLElement>) => void;
  isCustomerInfoOpen?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label="Open customer information"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => { e.stopPropagation(); onOpenCustomerInfo(e); }}
      className={cn(
        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors",
        isCustomerInfoOpen
          ? "bg-[#166CCA]/10 text-[#166CCA] hover:bg-[#166CCA]/20"
          : "text-[#7A7A7A] hover:bg-white dark:hover:bg-[#1C2536] hover:text-[#333333] dark:hover:text-[#CBD5E1]",
      )}
    >
      <User className="h-3.5 w-3.5 stroke-[1.5]" />
    </button>
  );
}

/** Standalone icon button that opens the live call Transcript popunder. */
function TranscriptIconButton({
  onOpen,
  isOpen = false,
}: {
  onOpen: (event?: React.MouseEvent<HTMLElement>) => void;
  isOpen?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label="Open call transcript"
      title="Call Transcript"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => { e.stopPropagation(); onOpen(e); }}
      className={cn(
        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors",
        isOpen
          ? "bg-[#166CCA]/10 text-[#166CCA] hover:bg-[#166CCA]/20"
          : "text-[#7A7A7A] hover:bg-white dark:hover:bg-[#1C2536] hover:text-[#333333] dark:hover:text-[#CBD5E1]",
      )}
    >
      <ScrollText className="h-3.5 w-3.5 stroke-[1.5]" />
    </button>
  );
}

function TaskSummaryView({
  assignment,
}: {
  assignment: QueuePreviewItem;
}) {
  const overview = getTaskAiOverview(assignment.customerRecordId, assignment.name, assignment.channel);
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-5">
      <div className="grid grid-cols-2 gap-4">
        {/* AI Actions Taken */}
        <div className="rounded-lg border border-[#BFDBFE] bg-[#EBF4FD] p-4 dark:border-[#1B3A52] dark:bg-[#0F2233]">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#166CCA] dark:text-[#4B96DA]">
            AI Actions Taken
          </p>
          <ul className="space-y-2">
            {overview.actions.map((action, i) => (
              <li key={i} className="flex items-start gap-2 text-[12px] text-[#344054] leading-relaxed dark:text-[#CBD5E1]">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#166CCA] dark:bg-[#244D68]" />
                {action}
              </li>
            ))}
          </ul>
        </div>
        {/* Why You're Needed */}
        <div className="rounded-lg border border-[#FFB800]/40 bg-[#FFF6E0] p-4 dark:border-[#A37A00]/40 dark:bg-[#1A1000]">
          <p className="mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#A37A00] dark:text-[#A37A00]">
            <TriangleAlert className="h-3 w-3" />
            Why You're Needed
          </p>
          <p className="text-[12px] text-[#344054] leading-relaxed dark:text-[#CBD5E1]">{overview.whyNeeded}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Transfer popover for the active-case header (tabbed: Department / Agent / Supervisor) ───
function CaseTransferPopover({
  triggerRef,
  onClose,
  onSelect,
}: {
  triggerRef: React.RefObject<HTMLButtonElement>;
  onClose: () => void;
  onSelect: (targetName: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<"Department" | "Agent" | "Supervisor">("Department");
  const [assigned, setAssigned] = useState<string | null>(null);
  const [pos, setPos] = useState({ top: 0, right: 0 });

  useEffect(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      setPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
    }
  }, [triggerRef]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const handleAssignAgent = (id: string, name: string) => {
    setAssigned(id);
    setTimeout(() => onSelect(name), 500);
  };
  const handleAssignDept = (id: string, name: string) => {
    setAssigned(id);
    setTimeout(() => onSelect(name), 500);
  };

  const humanAgents = [...notifAgentRoster].sort(
    (a, b) => notifAvailabilityOrder[a.availability] - notifAvailabilityOrder[b.availability],
  );
  const supervisors = [...notifSupervisorRoster].sort(
    (a, b) => notifAvailabilityOrder[a.availability] - notifAvailabilityOrder[b.availability],
  );

  return createPortal(
    <div
      ref={ref}
      className="fixed z-[999999] w-[300px] rounded-xl border border-border bg-white dark:bg-[#0F1629] shadow-[0_8px_24px_rgba(16,24,40,0.14)] overflow-hidden"
      style={{ top: pos.top, right: pos.right }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <p className="text-[12px] font-semibold text-[#333333] dark:text-[#E2E8F0]">Transfer to</p>
        <button type="button" onClick={onClose} className="text-[#98A2B3] hover:text-[#475467] transition-colors">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      {/* Tabs */}
      <div className="flex border-b border-border">
        {(["Department", "Agent", "Supervisor"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => { setTab(t); setAssigned(null); }}
            className={cn("relative flex-1 py-2.5 text-[11px] font-medium transition-colors",
              tab === t ? "text-[#166CCA]" : "text-[#667085] hover:text-[#344054]")}
          >
            {t}
            {tab === t && <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full bg-[#166CCA]" />}
          </button>
        ))}
      </div>
      {/* Content */}
      <div className="max-h-[260px] overflow-y-auto divide-y divide-border">
        {tab === "Department" && notifDepartmentRoster.map((dept) => {
          const isAssigned = assigned === dept.id;
          return (
            <button
              key={dept.id}
              type="button"
              onClick={() => handleAssignDept(dept.id, dept.name)}
              className={cn("w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                isAssigned ? "bg-[#EBF4FD]" : "hover:bg-[#F9FAFB]")}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EBF4FD] text-[15px]">
                {dept.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-[12px] font-semibold text-[#1D2939] truncate">{dept.name}</p>
                  {isAssigned && <span className="text-[10px] font-semibold text-[#166CCA]">Transferred</span>}
                </div>
                <p className="text-[10px] text-[#98A2B3] truncate">{dept.description}</p>
              </div>
              <span className="shrink-0 rounded-full bg-[#F2F4F7] px-1.5 py-0.5 text-[10px] font-semibold text-[#667085]">{dept.queue}</span>
            </button>
          );
        })}

        {tab === "Agent" && (
          <>
            {/* Human agents */}
            {humanAgents.map((agent) => {
              const isAssigned = assigned === agent.id;
              const isDisabled = agent.availability === "Offline" || (assigned !== null && !isAssigned);
              return (
                <button
                  key={agent.id}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleAssignAgent(agent.id, agent.name)}
                  className={cn("w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                    isAssigned ? "bg-[#EBF4FD]" : "hover:bg-[#F9FAFB]",
                    isDisabled && "opacity-40 cursor-not-allowed")}
                >
                  <div className="relative shrink-0">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F2F4F7] text-[10px] font-bold text-[#475467]">
                      {agent.initials}
                    </div>
                    <span className={cn("absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-white", notifAvailabilityDot[agent.availability])} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[12px] font-semibold text-[#1D2939] truncate">{agent.name}</p>
                      {isAssigned && <span className="text-[10px] font-semibold text-[#166CCA]">Transferred</span>}
                    </div>
                    <p className="text-[10px] text-[#98A2B3] truncate">{agent.skills.join(" · ")}</p>
                  </div>
                  <span className="shrink-0 text-[10px] text-[#667085]">{agent.activeCount}</span>
                </button>
              );
            })}
            {/* Virtual (bot) agents */}
            <div className="px-4 py-1.5 bg-[#FAFAFA]">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#98A2B3]">Virtual (Bot)</p>
            </div>
            {notifBotRoster.map((bot) => {
              const isAssigned = assigned === bot.id;
              const isDisabled = assigned !== null && !isAssigned;
              return (
                <button
                  key={bot.id}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleAssignAgent(bot.id, bot.name)}
                  className={cn("w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                    isAssigned ? "bg-[#EBF4FD]" : "hover:bg-[#F9FAFB]",
                    isDisabled && "opacity-40 cursor-not-allowed")}
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EBF4FD] text-[14px]">
                    {bot.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[12px] font-semibold text-[#1D2939] truncate">{bot.name}</p>
                      {isAssigned && <span className="text-[10px] font-semibold text-[#166CCA]">Transferred</span>}
                    </div>
                    <p className="text-[10px] text-[#98A2B3]">Virtual agent</p>
                  </div>
                  <span className="shrink-0 text-[10px] text-[#667085]">{bot.activeCount}</span>
                </button>
              );
            })}
          </>
        )}

        {tab === "Supervisor" && supervisors.map((sup) => {
          const isAssigned = assigned === sup.id;
          const isDisabled = sup.availability === "Offline" || (assigned !== null && !isAssigned);
          return (
            <button
              key={sup.id}
              type="button"
              disabled={isDisabled}
              onClick={() => handleAssignAgent(sup.id, sup.name)}
              className={cn("w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                isAssigned ? "bg-[#EBF4FD]" : "hover:bg-[#F9FAFB]",
                isDisabled && "opacity-40 cursor-not-allowed")}
            >
              <div className="relative shrink-0">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FFF6E0] text-[10px] font-bold text-[#A37A00]">
                  {sup.initials}
                </div>
                <span className={cn("absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-white", notifAvailabilityDot[sup.availability])} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-[12px] font-semibold text-[#1D2939] truncate">{sup.name}</p>
                  {isAssigned && <span className="text-[10px] font-semibold text-[#166CCA]">Transferred</span>}
                </div>
                <p className="text-[10px] text-[#98A2B3] truncate">{sup.skills.join(" · ")}</p>
              </div>
              <span className="shrink-0 text-[10px] text-[#667085]">{sup.activeCount}</span>
            </button>
          );
        })}
      </div>
    </div>,
    document.body,
  );
}

// ─── Disposition / wrap-up popover ───────────────────────────────────────────
const dispositionCodes = [
  "Resolved — Issue Fixed",
  "Transferred — Out of Scope",
  "Escalated to Supervisor",
  "Callback Requested",
  "Voicemail Left",
  "No Resolution — Customer Disconnected",
  "Follow-up Required",
  "Duplicate — Already Handled",
  "Other",
];

function DispositionPopover({
  triggerRef,
  mode,
  targetName,
  onConfirm,
  onCancel,
}: {
  triggerRef: React.RefObject<HTMLButtonElement>;
  mode: "dismiss" | "transfer";
  targetName?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [disposition, setDisposition] = useState("");
  const [notes, setNotes] = useState("");
  const [pos, setPos] = useState({ top: 0, right: 0 });

  useEffect(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      setPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
    }
  }, [triggerRef]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onCancel();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onCancel]);

  const actionLabel = mode === "dismiss" ? "Dismiss" : "Transfer";
  const title = mode === "dismiss" ? "Dismiss Case" : `Transfer to ${targetName ?? ""}`;

  return createPortal(
    <div
      ref={ref}
      className="fixed z-[9999999] w-[320px] rounded-xl border border-border bg-white dark:bg-[#0F1629] shadow-[0_8px_32px_rgba(16,24,40,0.16)] overflow-visible"
      style={{ top: pos.top, right: pos.right }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <p className="text-[12px] font-semibold text-[#1D2939]">{title}</p>
          <p className="text-[10px] text-[#98A2B3] mt-0.5">Select a disposition before closing</p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-[#98A2B3] hover:text-[#475467] transition-colors ml-3 shrink-0"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-3">
        {/* Disposition — custom list to avoid portal z-index issues */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#667085]">Disposition</p>
          <div className="rounded-md border border-input overflow-hidden divide-y divide-border max-h-[180px] overflow-y-auto">
            {dispositionCodes.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setDisposition(code)}
                className={cn(
                  "w-full px-3 py-2 text-left text-[12px] transition-colors",
                  disposition === code
                    ? "bg-[#EBF4FD] text-[#166CCA] font-semibold"
                    : "text-[#344054] hover:bg-[#F9FAFB]",
                )}
              >
                {code}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#667085]">
            Notes <span className="normal-case font-normal text-[#98A2B3]">(optional)</span>
          </p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any relevant notes…"
            rows={2}
            className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-[12px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-shadow"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border bg-[#FAFAFA] rounded-b-xl">
        <button
          type="button"
          onClick={onCancel}
          className="h-7 px-3 rounded-md text-[11px] font-medium text-[#475467] border border-border bg-white hover:bg-[#F9FAFB] transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!disposition}
          onClick={() => { if (disposition) onConfirm(); }}
          className={cn(
            "h-7 px-3 rounded-md text-[11px] font-semibold transition-colors",
            mode === "dismiss"
              ? "bg-[#C71D1A] text-white hover:bg-[#A81714] disabled:opacity-40 disabled:cursor-not-allowed"
              : "bg-[#166CCA] text-white hover:bg-[#1260B0] disabled:opacity-40 disabled:cursor-not-allowed",
          )}
        >
          {actionLabel}
        </button>
      </div>
    </div>,
    document.body,
  );
}

// ─── More-options dropdown for the active-case panel header ──────────────────

function CaseMoreOptionsMenu({ onDismiss, onClose, iconSize = "md", customerInfo }: { onDismiss: (transferRecipient?: string | null) => void; onClose?: () => void; iconSize?: "sm" | "md"; customerInfo?: { name: string; customerId: string; preview: string } }) {
  const { openChatPopover } = useLayoutContext();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <button
            ref={triggerRef}
            type="button"
            aria-label="More options"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "flex flex-shrink-0 items-center justify-center rounded-full text-[#7A7A7A] transition-colors hover:bg-[#F8F8F9] hover:text-[#333333]",
              iconSize === "sm" ? "h-6 w-6" : "h-7 w-7",
            )}
          >
            <MoreVertical className={iconSize === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="end" className="w-52">
          {/* Dismiss — removes assignment from rail and navigates to next case / Control Center */}
          <DropdownMenuItem
            className="gap-2 cursor-pointer text-[#C71D1A] focus:text-[#C71D1A] focus:bg-[#FEF2F2]"
            onClick={() => { setDropdownOpen(false); onDismiss(undefined); }}
          >
            <X className="h-4 w-4" />
            Dismiss
          </DropdownMenuItem>

          {/* Dismiss and Unassign — dismisses and clears agent assignment */}
          <DropdownMenuItem
            className="gap-2 cursor-pointer text-[#C71D1A] focus:text-[#C71D1A] focus:bg-[#FEF2F2]"
            onClick={() => { setDropdownOpen(false); onDismiss(null); }}
          >
            <UserX className="h-4 w-4" />
            Dismiss and Unassign
          </DropdownMenuItem>

          {/* Transfer — opens agent picker, then disposition */}
          <DropdownMenuItem
            className="gap-2 cursor-pointer"
            onClick={(e) => { e.preventDefault(); setDropdownOpen(false); setShowTransfer(true); }}
          >
            <ArrowRightLeft className="h-4 w-4" />
            Transfer
          </DropdownMenuItem>

          {/* Consult — opens the internal agent chat window */}
          <DropdownMenuItem
            className="gap-2 cursor-pointer"
            onClick={() => {
              // Walk up from the ⋮ button to find the enclosing card element
              let cardEl: HTMLElement | null = triggerRef.current;
              while (cardEl?.parentElement) {
                cardEl = cardEl.parentElement;
                if (cardEl.getBoundingClientRect().height >= 80) break;
              }
              const cardRect = cardEl?.getBoundingClientRect() ?? null;
              setDropdownOpen(false);
              openChatPopover(cardRect);
            }}
          >
            <MessageCircle className="h-4 w-4" />
            Consult
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {showTransfer && (
        <IncomingTransferPopover
          triggerRef={triggerRef}
          side="bottom"
          customerInfo={customerInfo}
          onClose={() => setShowTransfer(false)}
          onTransferred={(destination) => { setShowTransfer(false); onDismiss(destination || undefined); }}
        />
      )}
    </>
  );
}

/**
 * Hook that returns a "deferred" value and an opacity flag.
 * When `activeKey` changes, opacity drops to 0 for `duration` ms (fade-out),
 * then the deferred value updates and opacity returns to 1 (fade-in).
 * This lets the parent keep rendering its ternary against the *deferred* key
 * so old content stays visible during the fade-out.
 */
/**
 * Phase-based fade transition that guarantees no flash of new content.
 *
 * 1. "idle"     → opacity 1, visible, no CSS transition (steady state)
 * 2. "hide"     → opacity 0, visibility hidden, NO CSS transition (instant disappear)
 * 3. "swap"     → opacity 0, visibility hidden, content switches via setDeferredKey
 * 4. "settle"   → opacity 0, visibility hidden, new content renders & scrolls settle
 * 5. "enter"    → opacity 1, visible, WITH CSS transition (smooth fade-in)
 *
 * The fade-OUT is instant (no CSS transition) and uses visibility:hidden so there
 * is zero chance of a flash. Content only changes while truly invisible. The
 * settle phase gives the new content time to mount, layout, and scroll-to-bottom
 * before anything becomes visible. The only animated part is the fade-IN.
 */
function useFadeTransition<T extends string>(activeKey: T, fadeInMs = 200, settleMs = 120) {
  const [deferredKey, setDeferredKey] = useState(activeKey);
  const [phase, setPhase] = useState<"idle" | "hide" | "swap" | "settle" | "enter">("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const deferredKeyRef = useRef(deferredKey);
  deferredKeyRef.current = deferredKey;

  useEffect(() => {
    if (activeKey === deferredKeyRef.current) return;

    // Cancel any in-flight transition
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }

    // Phase 1 → instant hide (visibility:hidden + opacity:0, no CSS transition)
    setPhase("hide");

    // Phase 2 → after the browser paints the hidden state, swap the content key
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = requestAnimationFrame(() => {
        setDeferredKey(activeKey);
        setPhase("swap");

        // Phase 3 → settle: let the new content mount, layout, and scroll-to-bottom
        timerRef.current = setTimeout(() => {
          setPhase("settle");
          // Phase 4 → fade in: set opacity 1 with CSS transition, visibility visible
          timerRef.current = setTimeout(() => {
            rafRef.current = requestAnimationFrame(() => {
              setPhase("enter");
              // Return to idle after the CSS fade-in completes
              timerRef.current = setTimeout(() => setPhase("idle"), fadeInMs + 20);
            });
          }, settleMs);
        }, 0);
      });
    });

    return () => {
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey, fadeInMs, settleMs]);

  const isVisible = phase === "idle" || phase === "enter";
  const opacity = isVisible ? 1 : 0;
  const transition = phase === "enter" ? `opacity ${fadeInMs}ms ease-out` : "none";
  const visibility = isVisible ? ("visible" as const) : ("hidden" as const);

  return { deferredKey, opacity, transition, visibility } as const;
}

/**
 * Keeps a component mounted for `delay` ms after `isOpen` goes false,
 * so exit animations can play before the component unmounts.
 *
 * Returns `{ mounted, visible }`:
 *   - `mounted`: whether the component should be in the tree
 *   - `visible`: whether it should be at full opacity (drives the CSS class)
 */
function useAnimatedPresence(isOpen: boolean, delay = 200) {
  const [mounted, setMounted] = useState(isOpen);
  const [visible, setVisible] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      // Wait one frame so the element renders at opacity-0, then transition in.
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      setVisible(false);
      const id = setTimeout(() => setMounted(false), delay);
      return () => clearTimeout(id);
    }
  }, [isOpen, delay]);

  return { mounted, visible };
}

function DockedConversationPanel({
  isOpen,
  conversation,
  openChannels,
  activeChannel,
  customerRecordId,
  onConversationChange,
  onSelectChannel,
  onOpenDeskPanel,
  onOpenCall,
  onOpenChannel,
  onOpenCustomerInfo,
  isCustomerInfoOpen = false,
  onOpenTranscript,
  isTranscriptOpen = false,
  isCallActive = false,
  hasTranscript = false,
  voiceOpeningLines,
  voiceTopContent,
  voiceRightPanel,
  voiceContentOverlay,
  onVoiceOpeningLineClick,
  extraHistoryItems = [],
  onConversationStatusChange,
  onResolveAssignment,
  overviewIsOpen,
  onOverviewOpenChange,
  isCallDisabled,
  onClose,
  onUndockStart,
  showTrailingGap,
  isEqualSplit = false,
  equalSplitWidth,
  hideTranscript = false,
  showTaskSummary = false,
  initialSummaryOpen = false,
  onSummaryClose,
  isPendingAcceptance = false,
  onAcceptAssignment,
  casePreview,
  assignmentStatus,
  onAssignmentStatusChange,
  onRemoveAssignment,
  caseOverviewOpenTrigger = 0,
  activeCaseTransferredItem = null,
  onTakeoverOpen,
  aiConfidence,
  aiConfidenceReason,
  botLabel,
  customerContext,
  onAiActionClick,
}: {
  isOpen: boolean;
  conversation: SharedConversationData;
  openChannels: CustomerChannel[];
  activeChannel: CustomerChannel;
  customerRecordId: string;
  onConversationChange: (conversation: SharedConversationData, channel?: CustomerChannel) => void;
  onSelectChannel: (channel: CustomerChannel) => void;
  onOpenDeskPanel: (selection?: Exclude<DeskPanelSelection, null>) => void;
  onOpenCall: (anchorRect?: DOMRect | null) => void;
  onOpenChannel: (channel: Extract<CustomerChannel, "sms" | "email" | "whatsapp">) => void;
  onOpenCustomerInfo: (event?: React.MouseEvent<HTMLElement>) => void;
  isCustomerInfoOpen?: boolean;
  onOpenTranscript?: (event?: React.MouseEvent<HTMLElement>) => void;
  isTranscriptOpen?: boolean;
  isCallActive?: boolean;
  hasTranscript?: boolean;
  voiceOpeningLines?: Array<{ intro: string; question: string }> | null;
  voiceTopContent?: React.ReactNode;
  voiceRightPanel?: React.ReactNode;
  voiceContentOverlay?: React.ReactNode;
  onVoiceOpeningLineClick?: () => void;
  extraHistoryItems?: CustomerHistoryItem[];
  onConversationStatusChange: (status: ConversationStatus) => void;
  onResolveAssignment?: () => void;
  overviewIsOpen: boolean;
  onOverviewOpenChange: (open: boolean) => void;
  isCallDisabled: boolean;
  onClose: () => void;
  onUndockStart: (event: React.MouseEvent<HTMLElement>) => void;
  showTrailingGap: boolean;
  hideTranscript?: boolean;
  showTaskSummary?: boolean;
  isEqualSplit?: boolean;
  equalSplitWidth?: number;
  initialSummaryOpen?: boolean;
  onSummaryClose?: () => void;
  isPendingAcceptance?: boolean;
  onAcceptAssignment?: () => void;
  casePreview?: string;
  assignmentStatus?: QueueAssignmentStatus;
  onAssignmentStatusChange?: (status: QueueAssignmentStatus) => void;
  onRemoveAssignment?: (transferRecipient?: string) => void;
  /** Increment this to force the Case Overview accordion open (e.g. when a toast is dismissed). */
  caseOverviewOpenTrigger?: number;
  /** When set, used to trigger the customer info popunder at the panel's top-left on takeover. */
  activeCaseTransferredItem?: QueuePreviewItem | null;
  /** Called with the panel's top-left position once the takeover item lands and bounds are known. */
  onTakeoverOpen?: (position: { x: number; y: number }) => void;
  /** AI confidence score (0–100) for the pending handoff — shown inline when isPendingAcceptance=true. */
  aiConfidence?: number;
  /** Short reason text below the confidence bar. */
  aiConfidenceReason?: string;
  /** Name of the bot agent (e.g. "Aria", "Jacob", "Emily") for the inline review card avatar. */
  botLabel?: string;
  /** Context summary from the bot for the inline review card. */
  customerContext?: string;
  /** Called when the agent clicks an AI-suggested action card embedded in a message. */
  onAiActionClick?: (actionId: string) => void;
}) {
  const contentInitializedRef = useRef(false);
  const panelContainerRef = useRef<HTMLDivElement>(null);
  const [isContentVisible, setIsContentVisible] = useState(isOpen);
  const [isContentEntered, setIsContentEntered] = useState(isOpen);
  const [isAiPanelVisible, setIsAiPanelVisible] = useState(false);
  const [isNarrowPanel, setIsNarrowPanel] = useState(false);
  const [isHandoffSummaryOpen, setIsHandoffSummaryOpen] = useState(initialSummaryOpen ?? false);
  const [summaryTab, setSummaryTab] = useState<CustomerChannel | "history" | "conversation">(activeChannel);
  // Composite fade key so that BOTH tab switches AND case switches trigger a crossfade.
  const fadeKey = `${customerRecordId}::${summaryTab}`;
  const { deferredKey: deferredFadeKey, opacity: tabFadeOpacity, transition: tabFadeTransition, visibility: tabFadeVisibility } = useFadeTransition(fadeKey);
  const visibleTab = deferredFadeKey.split("::")[1] as CustomerChannel | "history" | "conversation";
  // Track which transferred item we've already opened the customer info popunder for, to avoid re-firing.
  const hasOpenedCustomerInfoForItemRef = useRef<string | null>(null);
  const [isAttemptedResolutionOpen, setIsAttemptedResolutionOpen] = useState(true);
  const [isCustomerProfileOpen, setIsCustomerProfileOpen] = useState(false);
  const [hasAgentTasks, setHasAgentTasks] = useState(false);
  const customerRecord = getCustomerRecord(customerRecordId);
  const [isWidePanel] = useState(true);
  const [panelHeight, setPanelHeight] = useState(0);
  const [panelBounds, setPanelBounds] = useState<{ left: number; top: number; width: number; height: number; headerBottom: number } | null>(null);
  const [performActionsState, setPerformActionsState] = useState<"idle" | "running" | "done">("idle");
  const [performActionsCompletedCount, setPerformActionsCompletedCount] = useState(0);
  const performActionsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [performAllActionsKey, setPerformAllActionsKey] = useState(0);

  // Customer history detail panel — tracks which item is expanded in the left sidebar.
  const [selectedHistoryItemId, setSelectedHistoryItemId] = useState<string | null>(null);
  const selectedHistoryItem =
    customerRecord?.customerHistory?.find((h) => h.id === selectedHistoryItemId) ??
    extraHistoryItems?.find((h) => h.id === selectedHistoryItemId) ??
    null;
  const [viewingInteraction, setViewingInteraction] = useState(false);

  // When the active case changes, clear any open event detail so the panel never shows
  // a stale (empty) event from the previous case.
  useEffect(() => {
    setSelectedHistoryItemId(null);
    setViewingInteraction(false);
    setResolveBoxVisible(false);
    setIsHandoffSummaryOpen((current) => {
      // Only collapse if the summary was opened by a history event click (not by
      // initialSummaryOpen / caseOverviewOpenTrigger, which are case-specific props).
      return initialSummaryOpen ? current : false;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerRecordId]);

  // When a toast is dismissed while this panel is active, open the summary sidebar
  // and ensure the Case Overview accordion is expanded.
  useEffect(() => {
    if (caseOverviewOpenTrigger > 0) {
      setIsHandoffSummaryOpen(true);
      setIsAttemptedResolutionOpen(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseOverviewOpenTrigger]);

  // Resolve-flow data (driven from customer database)
  const resolveFlow = customerRecord?.resolveFlow;
  const isSupervisorResolve = resolveFlow?.type === "supervisor";
  const isOptionsResolve = resolveFlow?.type === "options";
  const [resolveChecked, setResolveChecked] = useState(false);
  const [resolveStepIndex, setResolveStepIndex] = useState(0);
  const [resolveComplete, setResolveComplete] = useState(false);
  const resolveTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  // Gate resolve-flow boxes behind "Suggest Next Steps" so they don't auto-show on takeover.
  const [resolveBoxVisible, setResolveBoxVisible] = useState(false);

  // ── Customer history helpers ──────────────────────────────────────────────

  /** Icon + accent color config for each history item type. */
  const historyTypeConfig: Record<CustomerHistoryItemType, { icon: React.ElementType; accent: string; iconBg: string }> = {
    search:       { icon: Search,       accent: "#667085", iconBg: "#F2F4F7" },
    web:          { icon: Globe,        accent: "#667085", iconBg: "#F2F4F7" },
    chat:         { icon: MessageCircle,accent: "#166CCA", iconBg: "#EBF4FD" },
    purchase:     { icon: ShoppingCart, accent: "#208337", iconBg: "#F0FDF4" },
    shipping:     { icon: Package,      accent: "#667085", iconBg: "#F2F4F7" },
    registration: { icon: UserCheck,    accent: "#208337", iconBg: "#F0FDF4" },
    ticket:       { icon: Ticket,       accent: "#F59E0B", iconBg: "#FFFBEB" },
    email:        { icon: Mail,         accent: "#F59E0B", iconBg: "#FFFBEB" },
    system:       { icon: Activity,     accent: "#667085", iconBg: "#F2F4F7" },
    handoff:      { icon: UserCheck,    accent: "#E32926", iconBg: "#FEF2F2" },
    lead:         { icon: ClipboardList,accent: "#166CCA", iconBg: "#EBF4FD" },
  };

  const dotColorClass = (dot: CustomerHistoryDot) =>
    dot === "blue"   ? "bg-[#166CCA]" :
    dot === "green"  ? "bg-[#208337]" :
    dot === "orange" ? "bg-[#F59E0B]" :
    dot === "red"    ? "bg-[#E32926]" :
    dot === "purple" ? "bg-[#7C3AED]" :
    "bg-[#D0D5DD]";

  /** Returns the human-readable label for the "View" button based on interaction kind. */
  const interactionViewLabel = (interaction: CustomerHistoryInteraction): string => {
    switch (interaction.kind) {
      case "chat":         return "Chat Transcript";
      case "search":       return "Search Results";
      case "web":          return "Page Visit";
      case "purchase":     return "Order Details";
      case "shipping":     return "Shipment Tracking";
      case "ticket":       return "Ticket Thread";
      case "email":        return "Email";
      case "registration": return "Registration Record";
      case "lead":         return "Lead Form";
    }
  };

  /** Renders the full interaction view for the selected history item. */
  const renderInteractionContent = (interaction: CustomerHistoryInteraction, customerInitials: string) => {
    if (interaction.kind === "chat") {
      return (
        <div className="space-y-3">
          {interaction.messages.map((msg, i) => {
            const isCustomer = msg.sender === "customer";
            return (
              <div key={i} className={cn("flex gap-2.5", isCustomer ? "flex-row" : "flex-row-reverse")}>
                <div className={cn(
                  "shrink-0 mt-0.5 h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-bold select-none",
                  isCustomer ? "bg-[#C5DEF5] text-[#1260B0]" : "bg-[#E8F0FE] text-[#166CCA]"
                )}>
                  {isCustomer ? customerInitials : (msg.name?.[0] ?? "B")}
                </div>
                <div className={cn("max-w-[80%] space-y-0.5", isCustomer ? "items-start" : "items-end")}>
                  <div className={cn(
                    "rounded-2xl px-3.5 py-2.5",
                    isCustomer
                      ? "rounded-tl-sm bg-[#F2F4F7] dark:bg-[#141E2C] text-[#344054] dark:text-[#CBD5E1]"
                      : "rounded-tr-sm bg-[#166CCA] text-white"
                  )}>
                    <p className="text-[12px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  </div>
                  {msg.time && <p className={cn("text-[10px] text-[#98A2B3] px-1", isCustomer ? "" : "text-right")}>{msg.time}</p>}
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
            <div key={i} className={cn(
              "rounded-xl border px-3.5 py-3 space-y-0.5",
              r.clicked
                ? "border-[#166CCA]/30 bg-[#EBF4FD] dark:bg-[#0C1F33] dark:border-[#166CCA]/30"
                : "border-[#E4E7EC] dark:border-[#1B3A52] bg-white dark:bg-[#0F1629]"
            )}>
              <div className="flex items-center gap-1.5">
                {r.clicked && <div className="h-1.5 w-1.5 rounded-full bg-[#166CCA] shrink-0" />}
                <p className={cn("text-[12px] font-semibold leading-snug", r.clicked ? "text-[#166CCA]" : "text-[#344054] dark:text-white")}>{r.title}</p>
              </div>
              <p className="text-[10px] text-[#98A2B3]">{r.url}</p>
              <p className="text-[11px] text-[#667085] dark:text-[#8BACC4] leading-relaxed">{r.snippet}</p>
              {r.clicked && <p className="text-[10px] font-medium text-[#166CCA]">← Clicked</p>}
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
            <p className="text-[12px] font-semibold text-[#111827] dark:text-white pt-0.5">{interaction.title}</p>
          </div>
          {interaction.description && (
            <div className="rounded-xl border border-[#E4E7EC] dark:border-[#1B3A52] bg-[#F9FAFB] dark:bg-[#0F1629] px-4 py-3">
              <p className="text-[12px] leading-relaxed text-[#344054] dark:text-[#CBD5E1]">{interaction.description}</p>
            </div>
          )}
          {interaction.sectionsViewed && interaction.sectionsViewed.length > 0 && (
            <div className="rounded-xl border border-[#E4E7EC] dark:border-[#1B3A52] bg-white dark:bg-[#0F2233] overflow-hidden">
              <p className="px-3 pt-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#98A2B3]">Sections Viewed</p>
              <div className="divide-y divide-[#F2F4F7] dark:divide-[#1B3A52]">
                {interaction.sectionsViewed.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 px-3 py-2">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#D0D5DD] shrink-0" />
                    <p className="text-[11px] text-[#344054] dark:text-[#CBD5E1] leading-relaxed">{s}</p>
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
            <p className="px-3 pt-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#98A2B3]">Order #{interaction.orderId}</p>
            <div className="divide-y divide-[#F2F4F7] dark:divide-[#1B3A52]">
              {interaction.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2.5 gap-3">
                  <div>
                    <p className="text-[12px] font-medium text-[#344054] dark:text-[#CBD5E1]">{item.name}</p>
                    <p className="text-[10px] text-[#98A2B3]">Qty: {item.qty}</p>
                  </div>
                  <p className="text-[12px] font-semibold text-[#344054] dark:text-white">{item.price}</p>
                </div>
              ))}
              <div className="flex items-center justify-between px-3 py-2.5 bg-[#F9FAFB] dark:bg-[#0C1A26]">
                <p className="text-[12px] font-semibold text-[#344054] dark:text-[#CBD5E1]">Total</p>
                <p className="text-[13px] font-bold text-[#166CCA]">{interaction.total}</p>
              </div>
            </div>
          </div>
          {(interaction.paymentMethod || interaction.shippingAddress) && (
            <div className="rounded-xl border border-[#E4E7EC] dark:border-[#1B3A52] bg-white dark:bg-[#0F2233] overflow-hidden">
              <p className="px-3 pt-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#98A2B3]">Details</p>
              <div className="divide-y divide-[#F2F4F7] dark:divide-[#1B3A52]">
                {interaction.paymentMethod && (
                  <div className="flex items-start gap-3 px-3 py-2">
                    <span className="shrink-0 text-[11px] font-medium text-[#98A2B3] w-[90px]">Payment</span>
                    <span className="text-[11px] text-[#344054] dark:text-[#CBD5E1]">{interaction.paymentMethod}</span>
                  </div>
                )}
                {interaction.shippingAddress && (
                  <div className="flex items-start gap-3 px-3 py-2">
                    <span className="shrink-0 text-[11px] font-medium text-[#98A2B3] w-[90px]">Ship to</span>
                    <span className="text-[11px] text-[#344054] dark:text-[#CBD5E1]">{interaction.shippingAddress}</span>
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
              <p className="text-[10px] text-[#98A2B3] uppercase tracking-widest font-semibold">{interaction.carrier}</p>
              <p className="text-[12px] font-mono text-[#344054] dark:text-[#CBD5E1] mt-0.5">{interaction.trackingNumber}</p>
            </div>
            <Package className="h-4 w-4 text-[#98A2B3]" />
          </div>
          <div className="space-y-0">
            {interaction.events.map((ev, i) => (
              <div key={i} className="relative pl-7">
                <div className="absolute left-[9px] top-0 bottom-0 w-px bg-[#E4E7EC] dark:bg-[#1B3A52]" />
                <div className={cn(
                  "absolute left-[5px] top-3 h-[9px] w-[9px] rounded-full border-2",
                  ev.isDelivered
                    ? "bg-[#12B76A] border-[#12B76A]"
                    : i === 0 ? "bg-[#166CCA] border-[#166CCA]"
                    : "bg-white dark:bg-[#0C1A26] border-[#D0D5DD] dark:border-[#2D4A63]"
                )} />
                <div className="py-2.5">
                  <p className={cn("text-[12px] font-semibold", ev.isDelivered ? "text-[#12B76A]" : "text-[#344054] dark:text-white")}>{ev.status}</p>
                  <p className="text-[11px] text-[#667085] dark:text-[#8BACC4]">{ev.location}</p>
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
            <p className="text-[10px] text-[#98A2B3] uppercase tracking-widest font-semibold mb-0.5">{interaction.ticketId}</p>
            <p className="text-[13px] font-semibold text-[#111827] dark:text-white leading-snug">{interaction.subject}</p>
          </div>
          <div className="space-y-2">
            {interaction.notes.map((note, i) => (
              <div key={i} className={cn(
                "rounded-xl border px-3.5 py-3 space-y-1",
                note.isInternal
                  ? "border-[#FEC84B]/40 bg-[#FFFCF0] dark:bg-[#1F1A00] dark:border-[#FEC84B]/20"
                  : "border-[#E4E7EC] dark:border-[#1B3A52] bg-white dark:bg-[#0F1629]"
              )}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold text-[#344054] dark:text-[#CBD5E1]">{note.author}</p>
                  <p className="text-[10px] text-[#98A2B3] shrink-0">{note.time}</p>
                </div>
                {note.isInternal && <p className="text-[9px] font-semibold uppercase tracking-widest text-[#B54708]">Internal</p>}
                <p className="text-[11px] text-[#667085] dark:text-[#8BACC4] leading-relaxed">{note.text}</p>
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
                { label: "Status", value: interaction.opened ? "Opened" : "Not opened" },
              ].map((row) => (
                <div key={row.label} className="flex items-start gap-3 px-3 py-2">
                  <span className="shrink-0 text-[11px] font-medium text-[#98A2B3] w-[54px]">{row.label}</span>
                  <span className="text-[11px] text-[#344054] dark:text-[#CBD5E1] leading-relaxed">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-[#E4E7EC] dark:border-[#1B3A52] bg-[#F9FAFB] dark:bg-[#0F1629] px-4 py-3">
            <p className="text-[12px] leading-relaxed text-[#344054] dark:text-[#CBD5E1] whitespace-pre-wrap font-mono text-[11px]">{interaction.body}</p>
          </div>
        </div>
      );
    }

    if (interaction.kind === "registration") {
      return (
        <div className="rounded-xl border border-[#E4E7EC] dark:border-[#1B3A52] bg-white dark:bg-[#0F2233] overflow-hidden">
          <p className="px-3 pt-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#98A2B3]">Registration Record</p>
          <div className="divide-y divide-[#F2F4F7] dark:divide-[#1B3A52]">
            {interaction.fields.map((f) => (
              <div key={f.label} className="flex items-start gap-3 px-3 py-2">
                <span className="shrink-0 text-[11px] font-medium text-[#98A2B3] w-[110px]">{f.label}</span>
                <span className="text-[11px] text-[#344054] dark:text-[#CBD5E1] leading-relaxed">{f.value}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (interaction.kind === "lead") {
      return <TerryLeadForm onClose={() => setViewingInteraction(false)} />;
    }

    return null;
  };

  /**
   * Renders the Gladly-style history timeline.
   * Handles phase separators, event rows, customer message bubbles, and click-to-expand.
   */
  const renderHistoryTimeline = (historyItems: CustomerHistoryItem[]) => {
    if (historyItems.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
          <p className="text-[12px] font-medium text-[#344054] dark:text-[#CBD5E1]">No history yet</p>
          <p className="text-[11px] text-[#98A2B3] dark:text-[#4E6A85]">Past interactions will appear here.</p>
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
                <div className={cn("flex items-center gap-2", idx === 0 ? "mb-3" : "mt-5 mb-3")}>
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
                    <IconComponent className="h-2.5 w-2.5" style={{ color: cfg?.accent ?? "#667085" }} />
                  ) : (
                    <span className={cn("h-2 w-2 rounded-full", dotColorClass(item.dot))} />
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
                      setIsHandoffSummaryOpen(true);
                    }
                  }}
                  className={cn(
                    "w-full text-left rounded-xl border px-3 py-2.5 transition-all duration-150 hover:shadow-sm",
                    isSelected
                      ? "border-[#166CCA]/40 bg-[#EBF4FD] dark:bg-[#0C1F33] dark:border-[#166CCA]/40"
                      : "border-[#E4E7EC] bg-white dark:border-[#1B3A52] dark:bg-[#0F1629] hover:border-[#C5DEF5] hover:bg-[#F8FBFF]",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn(
                      "text-[12px] font-semibold leading-snug",
                      isSelected ? "text-[#166CCA]" : "text-[#111827] dark:text-white",
                    )}>
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
                      {customerRecord ? customerRecord.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2) : "JD"}
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

  const supervisorResolveBox = isSupervisorResolve ? (
    <div className="rounded-xl border border-black/[0.06] bg-[#F8F8F9] overflow-hidden">
        <div className="px-4 pt-3 pb-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#333333]">Suggested Next Step</span>
        </div>
        <div className="px-3 pb-3">
          <div className="rounded-xl border border-black/[0.06] bg-white overflow-hidden">
            <div className="flex items-center gap-3 px-3 py-2.5">
              <button
                type="button"
                onClick={() => {
                  if (resolveChecked) return;
                  setResolveChecked(true);
                  onAssignmentStatusChange?.("resolved");
                  const sa = staticAssignments.find((s) => s.customerRecordId === customerRecordId);
                  if (sa) pendingResolvedIds.add(sa.id);
                  resolveTimersRef.current.forEach(clearTimeout);
                  resolveTimersRef.current = [];
                  resolveFlow!.steps.forEach((_, i) => {
                    const t = setTimeout(() => setResolveStepIndex(i + 1), 1000 + i * 1200);
                    resolveTimersRef.current.push(t);
                  });
                  const done = setTimeout(() => {
                    setResolveComplete(true);
                    setTimeout(() => onRemoveAssignment?.(resolveFlow!.supervisorName ?? ""), 800);
                  }, 1000 + resolveFlow!.steps.length * 1200);
                  resolveTimersRef.current.push(done);
                }}
                className={cn(
                  "shrink-0 h-[18px] w-[18px] rounded-[5px] border-2 flex items-center justify-center transition-colors",
                  resolveChecked ? "border-[#166CCA] bg-[#166CCA]" : "border-[#D0D5DD] bg-white hover:border-[#166CCA]",
                )}
              >
                {resolveChecked && <Check className="h-2.5 w-2.5 text-white" />}
              </button>
              <span className={cn(
                "flex-1 text-[13px] leading-5 text-[#111827] transition-colors",
                resolveComplete && "line-through text-[#9CA3AF]",
              )}>
                Update status to resolved and assign to supervisor
              </span>
            </div>
            {resolveChecked && (
              <div className="border-t border-black/[0.05] px-3 pb-3 pt-2.5">
                <p className="mb-2.5 text-[12px] font-semibold text-[#111827]">Resolving &amp; transferring...</p>
                <div className="space-y-2.5">
                  {resolveFlow!.steps.map((step, idx) => {
                    const isComplete = idx < resolveStepIndex;
                    const isInProgress = idx === resolveStepIndex;
                    return (
                      <div key={idx} className="flex items-center gap-2.5">
                        <div className="shrink-0 h-6 w-6 flex items-center justify-center">
                          {isComplete ? (
                            <div className="h-6 w-6 rounded-full bg-[#0B9A8A] flex items-center justify-center">
                              <Check className="h-3.5 w-3.5 text-white" />
                            </div>
                          ) : isInProgress ? (
                            <div className="h-6 w-6 rounded-full border-2 border-[#E5E7EB] border-t-[#0B9A8A] animate-spin" />
                          ) : (
                            <div className="h-6 w-6 rounded-full border-2 border-[#E5E7EB]" />
                          )}
                        </div>
                        <span className={cn(
                          "text-[12px]",
                          isComplete ? "text-[#6B7280] line-through" : isInProgress ? "text-[#111827] font-medium" : "text-[#9CA3AF]",
                        )}>
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {resolveComplete && (
                  <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-[#EFFBF1] border border-[#24943E] px-3 py-2">
                    <Check className="h-3.5 w-3.5 text-[#208337]" />
                    <span className="text-[11px] font-semibold text-[#208337]">Case resolved and assigned to {resolveFlow!.supervisorName}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
  ) : undefined;

  // Options resolve-flow state (driven from customer database resolveFlow)
  const optionsFlowLabels = resolveFlow?.optionLabels ?? {};
  const optionKeys = Object.keys(optionsFlowLabels).map(Number) as (1 | 2 | 3)[];
  const [optionsSelectedOption, setOptionsSelectedOption] = useState<number | null>(null);
  const [optionsResolveOption, setOptionsResolveOption] = useState<number | null>(null);
  const [optionsGoodwillChecked, setOptionsGoodwillChecked] = useState(false);
  const [optionsResolveStepIndex, setOptionsResolveStepIndex] = useState(0);
  const [optionsResolveComplete, setOptionsResolveComplete] = useState(false);
  const [optionsResolveDismissed, setOptionsResolveDismissed] = useState(false);
  const [optionsForcedReply, setOptionsForcedReply] = useState<string | null>(null);
  const [optionsForcedVariants, setOptionsForcedVariants] = useState<InlineSuggestion[] | null>(null);
  const optionsResolveTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  function handleOptionsPerformTask() {
    if (optionsSelectedOption === null || optionsResolveOption !== null || !resolveFlow) return;
    const chosenOption = optionsSelectedOption;
    setOptionsResolveOption(chosenOption);
    optionsResolveTimersRef.current.forEach(clearTimeout);
    optionsResolveTimersRef.current = [];
    resolveFlow.steps.forEach((_, i) => {
      const t = setTimeout(() => setOptionsResolveStepIndex(i + 1), 1000 + i * 1200);
      optionsResolveTimersRef.current.push(t);
    });
    const done = setTimeout(() => {
      setOptionsResolveComplete(true);
      // Inject an internal note into the conversation
      const optLabel = resolveFlow.optionLabels?.[chosenOption] ?? "";
      const goodwillText = optionsGoodwillChecked ? (resolveFlow.goodwillNote ?? "") : "";
      const noteContent = resolveFlow.noteTemplate
        ? resolveFlow.noteTemplate.replace("{option}", optLabel).replace("{goodwill}", goodwillText)
        : `[Internal Note] Resolution: ${optLabel}.${goodwillText}`;
      const dateStr = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      onConversationChange({
        ...conversation,
        messages: [
          ...conversation.messages,
          { id: Date.now(), role: "agent" as const, content: noteContent, time: dateStr, isInternal: true },
        ],
      });
      // Populate suggested reply variants from database, interpolating goodwill line
      const goodwillLine = optionsGoodwillChecked ? (resolveFlow.goodwillReplyLine ?? "") : "";
      const variants = (resolveFlow.replyVariants?.[chosenOption] ?? []).map((v) => ({
        ...v,
        suggestedReply: v.suggestedReply.replace("{goodwill}", goodwillLine),
      }));
      if (variants.length > 0) {
        setOptionsForcedReply(variants[0].suggestedReply);
        setOptionsForcedVariants(variants);
      }
      setTimeout(() => setOptionsResolveDismissed(true), 1200);
    }, 1000 + resolveFlow.steps.length * 1200);
    optionsResolveTimersRef.current.push(done);
  }

  const optionsResolveBox = isOptionsResolve && !optionsResolveDismissed ? (
    <div className="rounded-xl border border-black/[0.06] bg-[#F8F8F9] overflow-hidden">
        <div className="px-4 pt-3 pb-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#333333]">Suggested Next Step</span>
        </div>
        <div className="px-3 pb-3 flex flex-col gap-2">
          {optionKeys.map((option) => (
            <div key={option} className="rounded-xl border border-black/[0.06] bg-white overflow-hidden">
              <div className="flex items-center gap-3 px-3 py-2.5">
                <button
                  type="button"
                  onClick={() => {
                    if (optionsResolveOption !== null) return;
                    setOptionsSelectedOption(option);
                  }}
                  className={cn(
                    "shrink-0 h-[18px] w-[18px] rounded-full border-2 flex items-center justify-center transition-colors",
                    optionsSelectedOption === option
                      ? "border-[#166CCA] bg-[#166CCA]"
                      : optionsResolveOption !== null
                        ? "border-[#E5E7EB] bg-white opacity-40 cursor-not-allowed"
                        : "border-[#D0D5DD] bg-white hover:border-[#166CCA]",
                  )}
                >
                  {optionsSelectedOption === option && <div className="h-2 w-2 rounded-full bg-white" />}
                </button>
                <div className="flex-1 min-w-0">
                  <span className={cn(
                    "block text-[12px] font-semibold text-[#344054]",
                    optionsResolveOption !== null && optionsResolveOption !== option && "opacity-40",
                  )}>
                    Option {option}
                  </span>
                  <span className={cn(
                    "block text-[13px] leading-5 text-[#111827] transition-colors",
                    optionsResolveComplete && optionsResolveOption === option && "line-through text-[#9CA3AF]",
                    optionsResolveOption !== null && optionsResolveOption !== option && "opacity-40",
                  )}>
                    {optionsFlowLabels[option]}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* Goodwill gesture — independently checkable (visible only when flow has goodwill config) */}
          {resolveFlow?.goodwillNote && (
            <button
              type="button"
              onClick={() => { if (optionsResolveOption === null) setOptionsGoodwillChecked((v) => !v); }}
              className="rounded-xl border border-[#BFDBFE] bg-[#EBF4FD] px-3 py-2.5 flex items-start gap-2 text-left w-full"
            >
              <div className="shrink-0 mt-0.5">
                <div className={cn(
                  "h-[18px] w-[18px] rounded-[5px] border-2 flex items-center justify-center transition-colors",
                  optionsGoodwillChecked ? "border-[#166CCA] bg-[#166CCA]" : "border-[#D0D5DD] bg-white",
                )}>
                  {optionsGoodwillChecked && <Check className="h-2.5 w-2.5 text-white" />}
                </div>
              </div>
              <div>
                <span className="block text-[11px] font-semibold uppercase tracking-widest text-[#1260B0] mb-0.5">Goodwill Gesture</span>
                <span className="text-[13px] leading-5 text-[#344054]">{resolveFlow.goodwillNote}</span>
              </div>
            </button>
          )}

          {/* Perform Task button */}
          {optionsSelectedOption !== null && optionsResolveOption === null && (
            <button
              type="button"
              onClick={handleOptionsPerformTask}
              className="w-full rounded-xl bg-[#166CCA] hover:bg-[#1260B0] active:bg-[#0D4F9A] text-white text-[13px] font-semibold py-2.5 px-4 transition-colors"
            >
              Perform Task
            </button>
          )}

          {/* Progress steps */}
          {optionsResolveOption !== null && (
            <div className="rounded-xl border border-black/[0.05] bg-white px-3 pb-3 pt-2.5">
              <p className="mb-2.5 text-[12px] font-semibold text-[#111827]">Resolving...</p>
              <div className="space-y-2.5">
                {resolveFlow!.steps.map((step, idx) => {
                  const isComplete = idx < optionsResolveStepIndex;
                  const isInProgress = idx === optionsResolveStepIndex;
                  return (
                    <div key={idx} className="flex items-center gap-2.5">
                      <div className="shrink-0 h-6 w-6 flex items-center justify-center">
                        {isComplete ? (
                          <div className="h-6 w-6 rounded-full bg-[#0B9A8A] flex items-center justify-center">
                            <Check className="h-3.5 w-3.5 text-white" />
                          </div>
                        ) : isInProgress ? (
                          <div className="h-6 w-6 rounded-full border-2 border-[#E5E7EB] border-t-[#0B9A8A] animate-spin" />
                        ) : (
                          <div className="h-6 w-6 rounded-full border-2 border-[#E5E7EB]" />
                        )}
                      </div>
                      <span className={cn(
                        "text-[12px]",
                        isComplete ? "text-[#6B7280] line-through" : isInProgress ? "text-[#111827] font-medium" : "text-[#9CA3AF]",
                      )}>
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
              {optionsResolveComplete && (
                <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-[#EFFBF1] border border-[#24943E] px-3 py-2">
                  <Check className="h-3.5 w-3.5 text-[#208337]" />
                  <span className="text-[11px] font-semibold text-[#208337]">Action complete — internal note added to case</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
  ) : undefined;

  // Ask Copilot state for summary panel
  const [summaryCopilotQuery, setSummaryCopilotQuery] = useState("");
  const [summarySubmittedQuery, setSummarySubmittedQuery] = useState("");
  const [summaryCopilotPhase, setSummaryCopilotPhase] = useState<"idle" | "thinking" | "done">("idle");
  const [summaryCopilotReasoningVisible, setSummaryCopilotReasoningVisible] = useState(0);
  const [isSummaryCopilotOpen, setIsSummaryCopilotOpen] = useState(true);
  const summaryCopilotTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  function handleSummaryCopilotSubmit() {
    if (!summaryCopilotQuery.trim()) return;
    summaryCopilotTimersRef.current.forEach(clearTimeout);
    summaryCopilotTimersRef.current = [];
    setSummarySubmittedQuery(summaryCopilotQuery);
    setSummaryCopilotQuery("");
    setSummaryCopilotPhase("thinking");
    setSummaryCopilotReasoningVisible(0);
    setIsSummaryCopilotOpen(true);
    SUMMARY_COPILOT_REASONING_STEPS.forEach((_, i) => {
      const t = setTimeout(() => setSummaryCopilotReasoningVisible(i + 1), 1000 + i * 600);
      summaryCopilotTimersRef.current.push(t);
    });
    const doneTimer = setTimeout(
      () => setSummaryCopilotPhase("done"),
      1000 + SUMMARY_COPILOT_REASONING_STEPS.length * 600 + 600,
    );
    summaryCopilotTimersRef.current.push(doneTimer);
  }

  // Reset the summary tab to the active channel whenever the customer changes.
  useEffect(() => {
    setSummaryTab(activeChannel);
  }, [customerRecordId]);

  // Keep the active tab in sync when the left rail changes the active channel.
  // Preserve "history" when switching between existing channels, but switch
  // to the new channel when a brand-new one is opened.
  const prevOpenChannelsLengthRef = useRef(openChannels.length);
  useEffect(() => {
    const newChannelAdded = openChannels.length > prevOpenChannelsLengthRef.current;
    prevOpenChannelsLengthRef.current = openChannels.length;
    setSummaryTab((prev) => (prev === "history" && !newChannelAdded ? "history" : activeChannel));
  }, [activeChannel, openChannels.length]);

  // If the channel currently shown in the tab bar is removed from the rail,
  // fall back to the first remaining channel (or history if none left).
  useEffect(() => {
    setSummaryTab((prev) => {
      if (prev === "history" || prev === "conversation") return prev;
      if (openChannels.includes(prev as CustomerChannel)) return prev;
      return openChannels[0] ?? "history";
    });
  }, [openChannels]);

  // When the panel is opened for a reviewed assignment, auto-expand the summary.
  useEffect(() => {
    if (initialSummaryOpen) {
      setIsHandoffSummaryOpen(true);
    }
  }, [initialSummaryOpen]);

  // Clean up perform-actions timer on unmount
  useEffect(() => {
    return () => {
      if (performActionsTimerRef.current) clearTimeout(performActionsTimerRef.current);
    };
  }, []);
  const shouldStackHeaderActions = false;



  useEffect(() => {
    const el = panelContainerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      const height = rect?.height ?? el.offsetHeight;
      const width = rect?.width ?? el.offsetWidth;
      setPanelHeight(height);
      setIsNarrowPanel(width < 768);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Track panel bounding rect so the toast portal can be positioned with `fixed` coords,
  // allowing it to appear above the ConversationPanel footer portal (z-index 10000).
  // Re-runs when `isOpen` changes.
  // Timing trap avoided: on initial open the panel runs a 500ms CSS entrance animation
  // (-translate-x-4 → translate-x-0). getBoundingClientRect() during that animation returns
  // the in-flight translated position, causing the toast to jump once the animation settles.
  // Fix: delay the first measurement by 520ms so panelBounds is only ever set at the final
  // resting position — the toast's own slide-in-from-left animation then plays from the
  // correct location with no jump.
  useLayoutEffect(() => {
    const el = panelContainerRef.current;
    if (!el || !isOpen) {
      setPanelBounds(null);
      return;
    }
    // `settled` gates every update path — ResizeObserver and transitionend can fire
    // during the 500ms entrance animation and would set stale in-flight coords.
    // Nothing is stored until the timeout fires at 520ms (just past the animation).
    let settled = false;
    const update = () => {
      if (!settled) return;
      const r = el.getBoundingClientRect();
      if (r.width > 0) {
        const headerEl = el.querySelector("[data-conversation-panel-header]");
        const headerBottom = headerEl
          ? headerEl.getBoundingClientRect().bottom
          : r.top + 64; // fallback if header not yet in DOM
        setPanelBounds({ left: r.left, top: r.top, width: r.width, height: r.height, headerBottom });
      }
    };
    const timer = setTimeout(() => { settled = true; update(); }, 520);
    el.addEventListener("transitionend", update);
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      clearTimeout(timer);
      el.removeEventListener("transitionend", update);
      ro.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [isOpen]);

  // Open the customer info popunder at the panel's top-left once both the transferred item
  // and the panel bounds are known (bounds settle after the 520ms entrance animation).
  useEffect(() => {
    if (!activeCaseTransferredItem || !panelBounds) return;
    if (hasOpenedCustomerInfoForItemRef.current === activeCaseTransferredItem.id) return;
    hasOpenedCustomerInfoForItemRef.current = activeCaseTransferredItem.id;
    onTakeoverOpen?.({ x: panelBounds.left + 12, y: panelBounds.headerBottom + 12 });
  }, [activeCaseTransferredItem, panelBounds, onTakeoverOpen]);

  useEffect(() => {
    if (!contentInitializedRef.current) {
      contentInitializedRef.current = true;
      return;
    }

    let timeoutId: number | undefined;
    let frameId: number | undefined;

    if (!isOpen) {
      setIsContentEntered(false);
      timeoutId = window.setTimeout(() => {
        setIsContentVisible(false);
      }, DOCKED_CONVERSATION_CONTENT_TRANSITION_MS);

      return () => {
        if (timeoutId !== undefined) {
          window.clearTimeout(timeoutId);
        }
      };
    }

    setIsContentVisible(true);
    timeoutId = window.setTimeout(() => {
      frameId = window.requestAnimationFrame(() => {
        setIsContentEntered(true);
      });
    }, DOCKED_CONVERSATION_CONTENT_ENTER_DELAY_MS);

    return () => {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }

      if (frameId !== undefined) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [isOpen]);

  return (
    <div
      ref={panelContainerRef}
      aria-hidden={!isOpen}
      className={cn(
        "relative min-h-0 overflow-visible",
        isOpen && (!isEqualSplit || equalSplitWidth === undefined) && "min-w-0 flex-1 basis-0",
        isOpen && isEqualSplit && equalSplitWidth !== undefined && "min-w-0 shrink-0",
        !isOpen && "pointer-events-none flex-grow-0 basis-0 w-0",
      )}
      style={{
        width: isOpen && isEqualSplit && equalSplitWidth !== undefined ? equalSplitWidth : undefined,
        marginRight: isOpen && showTrailingGap ? DOCKED_CONVERSATION_GAP : 0,
      }}
    >
      <div
        className={cn(
          "flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-black/[0.16] bg-card shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-[opacity,transform,box-shadow] duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
          "will-change-[opacity,transform]",
          isContentEntered ? "opacity-100 scale-100" : "scale-[0.97] opacity-0",
        )}
      >
        {isContentVisible && (
          <>
            <div
              data-conversation-panel-header
              className="relative flex flex-col border-b border-border px-5 py-4 gap-0"
            >
              {/* Top row: drag handle · summary toggle · name · actions · status chip · close */}
              <div className={cn(
                "flex",
                shouldStackHeaderActions ? "flex-col items-stretch gap-3" : "items-center justify-between gap-3",
              )}>
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    type="button"
                    aria-label="Undock conversation panel"
                    onMouseDown={onUndockStart}
                    className="flex h-6 w-6 flex-shrink-0 cursor-grab items-center justify-center rounded-full text-[#7A7A7A] transition-colors hover:bg-white hover:text-[#333333] active:cursor-grabbing"
                  >
                    <GripHorizontal className="h-4 w-4" />
                  </button>
                  <CustomerProfilePopover customerRecordId={customerRecordId} customerName={conversation.customerName} />
                  {/* Channel + history tabs in header */}
                  {(
                    <div className="inline-flex items-center gap-0.5 rounded-xl bg-[#F2F4F7] dark:bg-[#0D1525] px-1 py-1 border border-black/[0.08] dark:border-white/[0.08]">
                      {([...openChannels, "history" as const]).map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => {
                            setSummaryTab(tab);
                            if (tab !== "history") onSelectChannel(tab as CustomerChannel);
                          }}
                          title={isNarrowPanel ? (tab === "history" ? "Customer History" : tab === "sms" ? "SMS" : tab === "whatsapp" ? "WhatsApp" : tab === "email" ? "Email" : tab === "voice" ? "Voice" : "Chat") : undefined}
                          className={cn(
                            "rounded-lg text-[12px] font-medium transition-all duration-150",
                            isNarrowPanel ? "px-2 py-1.5" : "px-3 py-1",
                            summaryTab === tab
                              ? "bg-white dark:bg-[#1C2A3A] text-[#101828] dark:text-[#E2E8F0] shadow-sm"
                              : "text-[#667085] dark:text-[#8898AB] hover:text-[#333333] dark:hover:text-[#CBD5E1]",
                          )}
                        >
                          <span className="flex items-center gap-1.5">
                            {tab === "history" ? <Clock className={isNarrowPanel ? "h-3.5 w-3.5" : "h-3 w-3"} /> : tab === "voice" ? <Phone className={isNarrowPanel ? "h-3.5 w-3.5" : "h-3 w-3"} /> : tab === "email" ? <Mail className={isNarrowPanel ? "h-3.5 w-3.5" : "h-3 w-3"} /> : tab === "sms" ? <MessageSquare className={isNarrowPanel ? "h-3.5 w-3.5" : "h-3 w-3"} /> : tab === "whatsapp" ? <WhatsAppIcon className={isNarrowPanel ? "h-3.5 w-3.5" : "h-3 w-3"} /> : <MessageCircle className={isNarrowPanel ? "h-3.5 w-3.5" : "h-3 w-3"} />}
                            {!isNarrowPanel && (tab === "history" ? "Customer History" : tab === "sms" ? "SMS" : tab === "whatsapp" ? "WhatsApp" : tab === "email" ? "Email" : tab === "voice" ? "Voice" : "Chat")}
                          </span>
                        </button>
                      ))}
                      {/* + New Channel as icon button at end of tabs */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            title="Add channel"
                            onMouseDown={(e) => e.stopPropagation()}
                            className="flex h-6 w-6 items-center justify-center rounded-lg text-[#667085] dark:text-[#8898AB] hover:bg-white dark:hover:bg-[#1C2A3A] hover:text-[#333333] dark:hover:text-[#CBD5E1] hover:shadow-sm transition-all duration-150"
                            aria-label="Add channel"
                          >
                            <Plus className="h-3.5 w-3.5 stroke-[2]" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 rounded-2xl border border-black/10 bg-white p-1 shadow-[0_18px_50px_rgba(15,23,42,0.14)]">
                          <DropdownMenuItem onClick={(e) => onOpenCall(e.currentTarget.getBoundingClientRect())} disabled={isCallDisabled} className="rounded-xl px-3 py-2 text-sm text-[#111827]">
                            <Phone className="mr-2 h-4 w-4" /> Call
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onOpenChannel("email")} className="rounded-xl px-3 py-2 text-sm text-[#111827]">
                            <Mail className="mr-2 h-4 w-4" /> Email
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onOpenChannel("sms")} className="rounded-xl px-3 py-2 text-sm text-[#111827]">
                            <MessageSquare className="mr-2 h-4 w-4" /> SMS
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onOpenChannel("whatsapp")} className="rounded-xl px-3 py-2 text-sm text-[#111827]">
                            <WhatsAppIcon className="mr-2 h-4 w-4" /> WhatsApp
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>
                {/* Right side: customer info icon + status chip + close */}
                <div className="flex items-center gap-2 shrink-0">
                  <CustomerInfoIconButton onOpenCustomerInfo={onOpenCustomerInfo} isCustomerInfoOpen={isCustomerInfoOpen} />
                  {assignmentStatus && onAssignmentStatusChange && (
                    <div onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                      <ConversationStatusDropdown status={assignmentStatus} onStatusChange={onAssignmentStatusChange} />
                    </div>
                  )}
                  {onRemoveAssignment && assignmentStatus && (
                    <CaseMoreOptionsMenu
                      onDismiss={(recipient) => onRemoveAssignment(recipient)}
                      onClose={onClose}
                      customerInfo={customerRecord ? { name: customerRecord.name, customerId: customerRecord.customerId, preview: casePreview ?? customerRecord.queue?.preview ?? "" } : undefined}
                    />
                  )}
                </div>
              </div>

            </div>

            {/* Content area — flex-row when wide (>=991px) to show persistent sidebar */}
            <div className="relative min-h-0 flex-1 flex flex-row overflow-hidden">

              {/* Main conversation / customer history — tab bar above toggles content */}
              <div
                className="min-h-0 flex-1 overflow-hidden flex flex-col"
                style={{ opacity: tabFadeOpacity, transition: tabFadeTransition, visibility: tabFadeVisibility }}
              >
                {visibleTab === "history" ? (
                  /* Customer History timeline */
                  <CustomerHistoryTimeline
                    historyItems={[...(customerRecord?.customerHistory ?? []), ...extraHistoryItems]}
                    selectedHistoryItemId={selectedHistoryItemId}
                    onSelectedHistoryItemIdChange={setSelectedHistoryItemId}
                    viewingInteraction={viewingInteraction}
                    onViewingInteractionChange={setViewingInteraction}
                  />
                ) : showTaskSummary ? (
                  <TaskSummaryView
                    assignment={{
                      customerRecordId,
                      name: conversation.customerName,
                      channel: activeChannel,
                    } as QueuePreviewItem}
                  />
                ) : (
                  <ConversationPanel
                    key={visibleTab}
                    conversation={conversation}
                    openChannels={openChannels}
                    activeChannel={visibleTab as CustomerChannel}
                    customerId={customerRecordId}
                    draftKey={`docked-${conversation.label}-${conversation.customerName}`}
                    onConversationChange={onConversationChange}
                    onSelectChannel={onSelectChannel}
                    onOpenDeskPanel={onOpenDeskPanel}
                    onResolveAssignment={onResolveAssignment}
                    showAiPanel={false}
                    hideTranscript={hideTranscript}
                    performAllActionsKey={performAllActionsKey}
                    isPendingAcceptance={isPendingAcceptance}
                    onAcceptAssignment={onAcceptAssignment}
                    isWidePanel={isWidePanel}
                    onAgentTasksChange={setHasAgentTasks}
                    suppressAgentTasks={isOptionsResolve}
                    onNextStepsRequested={() => setResolveBoxVisible(true)}
                    appendContent={resolveBoxVisible ? (supervisorResolveBox ?? optionsResolveBox) : undefined}
                    forcedSuggestedReply={isOptionsResolve ? optionsForcedReply : null}
                    forcedSuggestionVariants={isOptionsResolve ? optionsForcedVariants : null}
                    aiConfidence={aiConfidence}
                    aiConfidenceReason={aiConfidenceReason}
                    botLabel={botLabel}
                    customerContext={customerContext}
                    voiceOpeningLines={voiceOpeningLines}
                    voiceTopContent={voiceTopContent}
                    voiceRightPanel={voiceRightPanel}
                    voiceContentOverlay={voiceContentOverlay}
                    onVoiceOpeningLineClick={onVoiceOpeningLineClick}
                    onAiActionClick={onAiActionClick}
                  />
                )}
              </div>

              {/* Narrow/medium-mode summary drawer — removed (no media queries) */}
              {false && (
                <>
                  {/* Drawer panel */}
                  <div
                    className={cn(
                      "absolute inset-y-0 left-0 z-50 w-[350px] flex flex-col bg-card dark:bg-[#0C1A26] border-r border-border shadow-[8px_0_24px_rgba(16,24,40,0.12)] transition-transform duration-300 ease-out",
                      isHandoffSummaryOpen ? "translate-x-0" : "-translate-x-full",
                    )}
                  >
                    {/* Tab bar */}
                    <div className="px-4 pt-4 pb-0">
                      <div className="inline-flex items-center rounded-xl bg-[#F2F4F7] dark:bg-[#0D1525] p-1 gap-0.5 w-full">
                        {(["overview", "history"] as const).map((tab) => (
                          <button
                            key={tab}
                            type="button"
                            onClick={() => setSummaryTab(tab)}
                            className={cn(
                              "flex-1 rounded-lg px-3 py-1.5 text-[12px] font-medium capitalize transition-all duration-150",
                              summaryTab === tab
                                ? "bg-white dark:bg-[#1C2A3A] text-[#101828] dark:text-[#E2E8F0] shadow-sm"
                                : "text-[#667085] dark:text-[#8898AB] hover:text-[#333333] dark:hover:text-[#CBD5E1]",
                            )}
                          >
                            {tab === "overview" ? (activeChannel === "sms" ? "SMS" : activeChannel === "whatsapp" ? "WhatsApp" : activeChannel === "email" ? "Email" : activeChannel === "voice" ? "Voice" : "Chat") : "Customer History"}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {summaryTab === "overview" ? (<>
                        {/* Customer Profile — collapsible */}
                      <div className="rounded-xl border border-[#E4E7EC] bg-white dark:border-[#1B3A52] dark:bg-[#0F2233] overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setIsCustomerProfileOpen((v) => !v)}
                          className="flex w-full items-center justify-between px-4 py-3 text-left"
                        >
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1260B0] dark:text-[#4B96DA]">
                            Customer Profile
                          </p>
                          <ChevronDown className={cn("h-3.5 w-3.5 text-[#1260B0] transition-transform duration-200 dark:text-[#4B96DA]", isCustomerProfileOpen && "rotate-180")} />
                        </button>
                        <div className={cn("grid transition-all duration-200 ease-out", isCustomerProfileOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                          <div className="overflow-hidden">
                            <div className="px-4 pb-4 space-y-3">
                              {/* Identity row */}
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5">
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#C5DEF5] text-[13px] font-bold text-[#1260B0] dark:bg-[#0C3D7A] dark:text-[#4B96DA]">
                                    {conversation.customerName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="text-[13px] font-semibold text-[#111827] dark:text-white leading-tight">{conversation.customerName}</p>
                                    <p className="text-[11px] text-[#667085] dark:text-[#8BACC4] leading-snug">{customerRecord.profile.department} · {customerRecord.profile.tenureYears} yr{customerRecord.profile.tenureYears !== 1 ? "s" : ""} tenure</p>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-[10px] text-[#98A2B3] dark:text-[#6B8FAD]">Balance</p>
                                  <p className="text-[13px] font-semibold text-[#111827] dark:text-white">{customerRecord.profile.totalAUM}</p>
                                </div>
                              </div>
                              {/* Tags */}
                              {customerRecord.profile.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                  {customerRecord.profile.tags.map((tag) => (
                                    <span
                                      key={tag}
                                      className={cn(
                                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                                        tag === "Premier" ? "bg-[#EBF4FD] text-[#1260B0] border border-[#BFDBFE] dark:bg-[#1B3A52] dark:text-[#4BADD6]" :
                                        tag.includes("IVR") ? "bg-[#EFFBF1] text-[#208337] border border-[#24943E] dark:bg-[#0A1F0D] dark:text-[#208337]" :
                                        "bg-[#EBF4FD] text-[#166CCA] border border-[#BFDBFE] dark:bg-[#0B2040] dark:text-[#4B96DA]",
                                      )}
                                    >
                                      {tag}{(tag.includes("Auth") || tag.includes("Biometrics")) ? " ✓" : ""}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    {/* Section 1: Customer Context */}
                      {(() => {
                        const sa = staticAssignments.find((s) => s.customerRecordId === customerRecordId || s.name.toLowerCase() === conversation.customerName.toLowerCase());
                        const customerContext = sa?.customerContext;
                        return customerContext ? (
                          <div className="rounded-xl border border-[#E4E7EC] bg-white p-4 dark:border-[#1B3A52] dark:bg-[#0F2233]">
                            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#1260B0] dark:text-[#4B96DA]">Customer Context</p>
                            <p className="text-[12px] leading-5 text-[#344054] dark:text-[#CBD5E1]">{customerContext}</p>
                          </div>
                        ) : (
                          <div className="rounded-xl border border-[#E4E7EC] bg-white p-4 dark:border-[#1B3A52] dark:bg-[#0F2233]">
                            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#1260B0] dark:text-[#4B96DA]">Customer Issue</p>
                            <p className="text-[12px] leading-5 text-[#344054] dark:text-[#CBD5E1]">{casePreview ?? getCustomerIssueSummary(conversation)}</p>
                          </div>
                        );
                      })()}
                      {/* Section 2: Customer Snapshot */}
                      {(() => {
                        const customerRecord = customerRecordId ? getCustomerRecord(customerRecordId) : null;
                        const snapshotBullets = customerRecord?.customerSnapshot;
                        if (!snapshotBullets || snapshotBullets.length === 0) return null;
                        return (
                          <div className="rounded-xl border border-[#E4E7EC] bg-white dark:border-[#1B3A52] dark:bg-[#0F2233] overflow-hidden">
                            <button
                              type="button"
                              onClick={() => setIsAttemptedResolutionOpen((v) => !v)}
                              className="flex w-full items-center justify-between px-4 py-3 text-left"
                            >
                              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1260B0] dark:text-[#4B96DA]">
                                Customer Snapshot
                              </p>
                              <ChevronDown className={cn("h-3.5 w-3.5 text-[#1260B0] transition-transform duration-200 dark:text-[#4B96DA]", isAttemptedResolutionOpen && "rotate-180")} />
                            </button>
                            <div className={cn("grid transition-all duration-200 ease-out", isAttemptedResolutionOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                              <div className="overflow-hidden">
                                <div className="px-4 pb-4">
                                  <ul className="space-y-2">
                                    {snapshotBullets.map((bullet, i) => (
                                      <li key={i} className="flex items-start gap-2 text-[12px] text-[#344054] dark:text-[#CBD5E1] leading-relaxed">
                                        <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#1260B0] dark:bg-[#244D68]" />
                                        {bullet}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Copilot response card */}
                      {summaryCopilotPhase !== "idle" && (
                        <div className="rounded-xl border border-[#BFDBFE] bg-white overflow-hidden">
                          <button type="button" onClick={() => setIsSummaryCopilotOpen((v) => !v)} className="flex w-full items-center justify-between px-4 py-3 text-left">
                            <div className="flex items-center gap-2">
                              <Sparkles className="h-3.5 w-3.5 text-[#166CCA]" />
                              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1260B0]">Copilot Response</p>
                              {summaryCopilotPhase === "thinking" && (
                                <span className="flex items-center gap-1">
                                  <span className="h-1.5 w-1.5 rounded-full bg-[#166CCA] animate-bounce [animation-delay:0ms]" />
                                  <span className="h-1.5 w-1.5 rounded-full bg-[#166CCA] animate-bounce [animation-delay:150ms]" />
                                  <span className="h-1.5 w-1.5 rounded-full bg-[#166CCA] animate-bounce [animation-delay:300ms]" />
                                </span>
                              )}
                            </div>
                            <ChevronDown className={cn("h-3.5 w-3.5 text-[#1260B0] transition-transform duration-200", isSummaryCopilotOpen && "rotate-180")} />
                          </button>
                          <div className={cn("grid transition-all duration-200 ease-out", isSummaryCopilotOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                            <div className="overflow-hidden">
                              <div className="px-4 pb-4 space-y-3">
                                <p className="text-[11px] text-[#98A2B3] italic">"{summarySubmittedQuery}"</p>
                                {summaryCopilotPhase === "done" && (
                                  <div className="rounded-lg bg-[#EBF4FD] border border-[#BFDBFE] px-3 py-2.5">
                                    <p className="text-[12px] text-[#344054] dark:text-[#CBD5E1] leading-relaxed">
                                      {COPILOT_FALLBACK_RESPONSE}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      </>) : (
                        /* Customer History timeline — narrow drawer */
                        <div className="px-1">
                          <div className="max-w-[800px] mx-auto w-full">
                            <CustomerHistoryTimeline
                              historyItems={[...(customerRecord?.customerHistory ?? []), ...extraHistoryItems]}
                              selectedHistoryItemId={selectedHistoryItemId}
                              onSelectedHistoryItemIdChange={setSelectedHistoryItemId}
                              viewingInteraction={viewingInteraction}
                              onViewingInteractionChange={setViewingInteraction}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    {summaryTab === "overview" && (
                      <div className="shrink-0 border-t border-[#E4E7EC] dark:border-[#1B3A52] bg-card dark:bg-[#0C1A26] px-4 py-3">
                        <div className="flex items-center gap-2 rounded-lg border border-[#BFDBFE] bg-white px-3 py-2">
                          <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#166CCA]" />
                          <input
                            type="text"
                            value={summaryCopilotQuery}
                            onChange={(e) => setSummaryCopilotQuery(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") handleSummaryCopilotSubmit(); }}
                            placeholder="Ask Copilot about this Case"
                            className="min-w-0 flex-1 bg-transparent text-[12px] text-[#344054] placeholder:text-[#98A2B3] outline-none"
                          />
                          <button type="button" onClick={handleSummaryCopilotSubmit} className="shrink-0 text-[#166CCA] hover:text-[#1260B0] transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Summary sidebar — animated slide open/close */}
              <div
                className={cn(
                  "flex-shrink-0 border-l border-border flex flex-col bg-card dark:bg-[#0C1A26] overflow-hidden transition-[width,opacity] duration-300 ease-in-out",
                  isHandoffSummaryOpen && (visibleTab === "history" || !selectedHistoryItemId) ? "w-[350px] opacity-100" : "w-0 opacity-0 border-l-0",
                )}
              >
                {/* ── History item detail panel ────────────────────────────── */}
                {selectedHistoryItem ? (() => {
                  const customerInitials = customerRecord
                    ? customerRecord.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2)
                    : "JD";
                  return (
                  <div className="flex flex-col h-full min-w-[350px] overflow-hidden">
                    {/* Header — title changes based on view */}
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
                          setIsHandoffSummaryOpen(false);
                          setViewingInteraction(false);
                          setTimeout(() => setSelectedHistoryItemId(null), 300);
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
                        viewingInteraction ? "-translate-x-full" : "translate-x-0"
                      )}>
                        {/* Type badge + title */}
                        <div>
                          {selectedHistoryItem.type && (() => {
                            const cfg = historyTypeConfig[selectedHistoryItem.type!];
                            const Icon = cfg.icon;
                            const typeLabel: Record<string, string> = {
                              search: "Web Search", web: "Website Visit", chat: "Chat",
                              purchase: "Purchase", shipping: "Shipping", registration: "Registration",
                              ticket: "Support Ticket", email: "Email", system: "System Event", handoff: "Escalation",
                            };
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
                                {customerInitials}
                              </div>
                              <div className="flex-1 rounded-xl rounded-tl-sm bg-white dark:bg-[#0F1629] border border-[#E4E7EC] dark:border-[#1B3A52] px-3.5 py-2.5">
                                <p className="text-[12px] leading-relaxed text-[#344054] dark:text-[#CBD5E1]">
                                  "{selectedHistoryItem.customerMessage}"
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
                        viewingInteraction ? "translate-x-0" : "translate-x-full"
                      )}>
                        {selectedHistoryItem.interaction && renderInteractionContent(selectedHistoryItem.interaction, customerInitials)}
                      </div>
                    </div>
                  </div>
                  );
                })() : (null)}
                {false && (<>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 min-w-[350px]">
                    {/* Always-visible overview content: Customer Profile / Context / Case Overview */}
                    {(<>

                    {/* Customer Profile — collapsible */}
                    <div className="rounded-xl border border-[#E4E7EC] bg-white dark:border-[#1B3A52] dark:bg-[#0F2233] overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setIsCustomerProfileOpen((v) => !v)}
                        className="flex w-full items-center justify-between px-4 py-3 text-left"
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1260B0] dark:text-[#4B96DA]">
                          Customer Profile
                        </p>
                        <ChevronDown className={cn("h-3.5 w-3.5 text-[#1260B0] transition-transform duration-200 dark:text-[#4B96DA]", isCustomerProfileOpen && "rotate-180")} />
                      </button>
                      <div className={cn("grid transition-all duration-200 ease-out", isCustomerProfileOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                        <div className="overflow-hidden">
                          <div className="px-4 pb-4 space-y-3">
                            {/* Identity row */}
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#C5DEF5] text-[13px] font-bold text-[#1260B0] dark:bg-[#0C3D7A] dark:text-[#4B96DA]">
                                  {conversation.customerName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-[13px] font-semibold text-[#111827] dark:text-white leading-tight">{conversation.customerName}</p>
                                  <p className="text-[11px] text-[#667085] dark:text-[#8BACC4] leading-snug">{customerRecord.profile.department} · {customerRecord.profile.tenureYears} yr{customerRecord.profile.tenureYears !== 1 ? "s" : ""} tenure</p>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-[10px] text-[#98A2B3] dark:text-[#6B8FAD]">Balance</p>
                                <p className="text-[13px] font-semibold text-[#111827] dark:text-white">{customerRecord.profile.totalAUM}</p>
                              </div>
                            </div>
                            {/* Tags */}
                            {customerRecord.profile.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {customerRecord.profile.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className={cn(
                                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                                      tag === "Premier" ? "bg-[#EBF4FD] text-[#1260B0] border border-[#BFDBFE] dark:bg-[#1B3A52] dark:text-[#4BADD6]" :
                                      tag.includes("IVR") ? "bg-[#EFFBF1] text-[#208337] border border-[#24943E] dark:bg-[#0A1F0D] dark:text-[#208337]" :
                                      "bg-[#EBF4FD] text-[#166CCA] border border-[#BFDBFE] dark:bg-[#0B2040] dark:text-[#4B96DA]",
                                    )}
                                  >
                                    {tag}{(tag.includes("Auth") || tag.includes("Biometrics")) ? " ✓" : ""}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Section 1: Customer Context */}
                    {(() => {
                      const sa = staticAssignments.find((s) => s.customerRecordId === customerRecordId || s.name.toLowerCase() === conversation.customerName.toLowerCase());
                      const customerContext = sa?.customerContext;
                      return customerContext ? (
                        <div className="rounded-xl border border-[#E4E7EC] bg-white p-4 dark:border-[#1B3A52] dark:bg-[#0F2233]">
                          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#1260B0] dark:text-[#4B96DA]">Customer Context</p>
                          <p className="text-[12px] leading-5 text-[#344054] dark:text-[#CBD5E1]">{customerContext}</p>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-[#E4E7EC] bg-white p-4 dark:border-[#1B3A52] dark:bg-[#0F2233]">
                          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#1260B0] dark:text-[#4B96DA]">Customer Issue</p>
                          <p className="text-[12px] leading-5 text-[#344054] dark:text-[#CBD5E1]">{casePreview ?? getCustomerIssueSummary(conversation)}</p>
                        </div>
                      );
                    })()}

                    {/* Section 2: Customer Snapshot */}
                    {(() => {
                      const customerRecord = customerRecordId ? getCustomerRecord(customerRecordId) : null;
                      const snapshotBullets = customerRecord?.customerSnapshot;
                      if (!snapshotBullets || snapshotBullets.length === 0) return null;
                      return (
                        <div className="rounded-xl border border-[#E4E7EC] bg-white dark:border-[#1B3A52] dark:bg-[#0F2233] overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setIsAttemptedResolutionOpen((v) => !v)}
                            className="flex w-full items-center justify-between px-4 py-3 text-left"
                          >
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1260B0] dark:text-[#4B96DA]">
                              Customer Snapshot
                            </p>
                            <ChevronDown className={cn("h-3.5 w-3.5 text-[#1260B0] transition-transform duration-200 dark:text-[#4B96DA]", isAttemptedResolutionOpen && "rotate-180")} />
                          </button>
                          <div className={cn("grid transition-all duration-200 ease-out", isAttemptedResolutionOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                            <div className="overflow-hidden">
                              <div className="px-4 pb-4">
                                <ul className="space-y-2">
                                  {snapshotBullets.map((bullet, i) => (
                                    <li key={i} className="flex items-start gap-2 text-[12px] text-[#344054] dark:text-[#CBD5E1] leading-relaxed">
                                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#1260B0] dark:bg-[#244D68]" />
                                      {bullet}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Copilot response card */}
                    {summaryCopilotPhase !== "idle" && (
                      <div className="rounded-xl border border-[#BFDBFE] bg-white overflow-hidden">
                        <button type="button" onClick={() => setIsSummaryCopilotOpen((v) => !v)} className="flex w-full items-center justify-between px-4 py-3 text-left">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-3.5 w-3.5 text-[#166CCA]" />
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1260B0]">Copilot Response</p>
                            {summaryCopilotPhase === "thinking" && (
                              <span className="flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#166CCA] animate-bounce [animation-delay:0ms]" />
                                <span className="h-1.5 w-1.5 rounded-full bg-[#166CCA] animate-bounce [animation-delay:150ms]" />
                                <span className="h-1.5 w-1.5 rounded-full bg-[#166CCA] animate-bounce [animation-delay:300ms]" />
                              </span>
                            )}
                          </div>
                          <ChevronDown className={cn("h-3.5 w-3.5 text-[#1260B0] transition-transform duration-200", isSummaryCopilotOpen && "rotate-180")} />
                        </button>
                        <div className={cn("grid transition-all duration-200 ease-out", isSummaryCopilotOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                          <div className="overflow-hidden">
                            <div className="px-4 pb-4 space-y-3">
                              <p className="text-[11px] text-[#98A2B3] italic">"{summarySubmittedQuery}"</p>
                              {summaryCopilotPhase === "done" && (
                                <div className="rounded-lg bg-[#EBF4FD] border border-[#BFDBFE] px-3 py-2.5">
                                  <p className="text-[12px] text-[#344054] dark:text-[#CBD5E1] leading-relaxed">
                                    {COPILOT_FALLBACK_RESPONSE}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                  </>)}
                  </div>
                  <div className="shrink-0 border-t border-[#E4E7EC] dark:border-[#1B3A52] bg-card dark:bg-[#0C1A26] px-4 py-3">
                      <div className="flex items-center gap-2 rounded-lg border border-[#BFDBFE] bg-white px-3 py-2">
                        <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#166CCA]" />
                        <input
                          type="text"
                          value={summaryCopilotQuery}
                          onChange={(e) => setSummaryCopilotQuery(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") handleSummaryCopilotSubmit(); }}
                          placeholder="Ask Copilot about this Case"
                          className="min-w-0 flex-1 bg-transparent text-[12px] text-[#344054] placeholder:text-[#98A2B3] outline-none"
                        />
                        <button type="button" onClick={handleSummaryCopilotSubmit} className="shrink-0 text-[#166CCA] hover:text-[#1260B0] transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                        </button>
                      </div>
                    </div>
                {/* end dead overview block */}
                </>)}
              </div>
            </div>
          </>
        )}
      </div>

    </div>
  );
}

function CombinedInteractionPanel({
  isOpen,
  width,
  maxWidth,
  activeTab,
  conversation,
  openChannels,
  activeChannel,
  customerRecordId,
  customerName,
  customerId,
  panelSelection,
  showConversationTab,
  showCanvasTab,
  canvasTabLabel,
  canvasContent,
  isFullWidth,
  showCloseButton = !isFullWidth,
  panelTitle,
  isEqualSplit = false,
  onConversationChange,
  onSelectChannel,
  onOpenDeskPanel,
  onResolveAssignment,
  onTabChange,
  onClose,
}: {
  isOpen: boolean;
  width: number;
  maxWidth: number;
  activeTab: CombinedInteractionPanelTab;
  conversation: SharedConversationData;
  openChannels: CustomerChannel[];
  activeChannel: CustomerChannel;
  customerRecordId: string;
  customerName: string;
  customerId: string;
  panelSelection: DeskPanelSelection;
  showConversationTab: boolean;
  showCanvasTab: boolean;
  canvasTabLabel: string;
  canvasContent: React.ReactNode;
  isFullWidth: boolean;
  showCloseButton?: boolean;
  panelTitle?: string;
  isEqualSplit?: boolean;
  onConversationChange: (conversation: SharedConversationData, channel?: CustomerChannel) => void;
  onSelectChannel: (channel: CustomerChannel) => void;
  onOpenDeskPanel: (selection?: Exclude<DeskPanelSelection, null>) => void;
  onResolveAssignment?: () => void;
  onTabChange: (tab: CombinedInteractionPanelTab) => void;
  onClose: () => void;
}) {
  const visibleTabCount = [showConversationTab, true, showCanvasTab].filter(Boolean).length;
  const resolvedPanelTitle = panelTitle ?? (showConversationTab ? "Conversation & Customer" : "App Space");
  const customerTabLabel = showConversationTab ? "Customer" : "Customer Information";

  return (
    <div
      aria-hidden={!isOpen}
      className={cn(
        "relative min-h-0 overflow-visible",
        (isFullWidth || isEqualSplit) && "min-w-0 flex-1 basis-0",
        !isOpen && "pointer-events-none",
      )}
      style={{
        width: isFullWidth || isEqualSplit ? undefined : isOpen ? width : 0,
        marginRight: isFullWidth ? 0 : isOpen ? DOCKED_CONVERSATION_GAP : 0,
      }}
    >
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-black/[0.16] bg-card shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <Tabs
          value={activeTab}
          onValueChange={(value) => onTabChange(value as CombinedInteractionPanelTab)}
          className="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div className="shrink-0 border-b border-border bg-background/50 px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold tracking-tight text-[#333333]">{resolvedPanelTitle}</h3>
                <p className="truncate text-xs text-[#7A7A7A]">
                  {customerName} · {customerId}
                </p>
              </div>
              {showCloseButton && (
                <button
                  type="button"
                  aria-label="Close combined interaction panel"
                  onClick={onClose}
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[#7A7A7A] transition-colors hover:bg-white dark:hover:bg-[#1C2536] hover:text-[#333333] dark:hover:text-[#CBD5E1]"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <TabsList
              className={cn(
                "mt-3 grid h-auto w-full gap-1 rounded-lg bg-[#F1F3F5] p-1",
                visibleTabCount === 3 ? "grid-cols-3" : visibleTabCount === 2 ? "grid-cols-2" : "grid-cols-1",
              )}
            >
              {showConversationTab && (
                <TabsTrigger value="conversation" className="rounded-md px-3 py-2 text-xs font-semibold text-[#5B5B5B] data-[state=active]:bg-white data-[state=active]:text-[#111827] data-[state=active]:shadow-sm">
                  Conversation
                </TabsTrigger>
              )}
              <TabsTrigger value="customerInfo" className="rounded-md px-3 py-2 text-xs font-semibold text-[#5B5B5B] data-[state=active]:bg-white data-[state=active]:text-[#111827] data-[state=active]:shadow-sm">
                {customerTabLabel}
              </TabsTrigger>
              {showCanvasTab && (
                <TabsTrigger value="canvas" className="rounded-md px-3 py-2 text-xs font-semibold text-[#5B5B5B] data-[state=active]:bg-white data-[state=active]:text-[#111827] data-[state=active]:shadow-sm">
                  {canvasTabLabel}
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          {showConversationTab && (
            <TabsContent value="conversation" className="mt-0 min-h-0 flex-1 overflow-hidden data-[state=active]:flex data-[state=active]:flex-col">
              <ConversationPanel
                className="min-h-0 flex-1"
                conversation={conversation}
                openChannels={openChannels}
                activeChannel={activeChannel}
                customerId={customerRecordId}
                draftKey={`combined-${conversation.label}-${conversation.customerName}`}
                onConversationChange={onConversationChange}
                onSelectChannel={onSelectChannel}
                onOpenDeskPanel={onOpenDeskPanel}
                onResolveAssignment={onResolveAssignment}
              />
            </TabsContent>
          )}
          <TabsContent value="customerInfo" className="mt-0 min-h-0 flex-1 overflow-hidden data-[state=active]:flex data-[state=active]:flex-col">
            <NotesPanel
              key={customerRecordId}
              initialTab={panelSelection?.initialTab ?? "Overview"}
              initialTicketId={panelSelection?.ticketId}
              customerId={customerRecordId}
              customerName={customerName}
            />
          </TabsContent>
          {showCanvasTab && (
            <TabsContent value="canvas" className="mt-0 min-h-0 flex-1 overflow-hidden data-[state=active]:flex data-[state=active]:flex-col">
              {canvasContent}
            </TabsContent>
          )}
        </Tabs>
      </div>

    </div>
  );
}

function InlineAppSpacePanel({
  isOpen,
  children,
}: {
  isOpen: boolean;
  children: React.ReactNode;
}) {
  const [isEntered, setIsEntered] = useState(false);

  useEffect(() => {
    let timeoutId: number | undefined;
    let frameId: number | undefined;

    if (!isOpen) {
      setIsEntered(false);
      return;
    }

    timeoutId = window.setTimeout(() => {
      frameId = window.requestAnimationFrame(() => {
        setIsEntered(true);
      });
    }, INLINE_APP_SPACE_PANEL_ENTER_DELAY_MS);

    return () => {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }

      if (frameId !== undefined) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [isOpen]);

  return (
    <div
      aria-hidden={!isOpen}
      className={cn(
        "min-h-0 overflow-hidden",
        isOpen ? "min-w-0 flex-1 basis-0" : "pointer-events-none flex-grow-0 basis-0 w-0",
      )}
    >
      <div
        className={cn(
          "h-full min-h-0 w-full transition-[opacity,transform] duration-[350ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
          isOpen && isEntered ? "opacity-100 scale-100" : "scale-[0.97] opacity-0",
        )}
      >
        {children}
      </div>
    </div>
  );
}

function DockedCustomerInfoPanel({
  isOpen,
  width,
  maxWidth,
  customerRecordId,
  customerName,
  customerId,
  panelSelection,
  onWidthChange,
  onOpenCall,
  isCallDisabled,
  onClose,
  onUndockStart,
  showTrailingGap,
  isEqualSplit = false,
  equalSplitWidth,
  takeoverCard = null,
}: {
  isOpen: boolean;
  width: number;
  maxWidth: number;
  customerRecordId: string;
  customerName: string;
  customerId: string;
  panelSelection: DeskPanelSelection;
  onWidthChange: (width: number) => void;
  onOpenCall: (anchorRect?: DOMRect | null) => void;
  isCallDisabled: boolean;
  onClose: () => void;
  onUndockStart: (event: React.MouseEvent<HTMLElement>) => void;
  showTrailingGap: boolean;
  isEqualSplit?: boolean;
  equalSplitWidth?: number;
  takeoverCard?: { botType: string; botAvatarUrl: string; customerContext: string; aiConfidence: number; aiConfidenceReason: string } | null;
}) {
  const resizeStartRef = useRef({ mouseX: 0, width });
  const isResizingRef = useRef(false);
  const contentInitializedRef = useRef(false);
  const [isContentVisible, setIsContentVisible] = useState(isOpen);
  const [isContentEntered, setIsContentEntered] = useState(isOpen);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isResizingRef.current) return;

      const deltaX = event.clientX - resizeStartRef.current.mouseX;

      onWidthChange(
        Math.min(
          maxWidth,
          Math.max(CUSTOMER_INFO_PANEL_MIN_WIDTH, resizeStartRef.current.width + deltaX),
        ),
      );
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
    };
  }, [maxWidth, onWidthChange]);

  useEffect(() => {
    if (!contentInitializedRef.current) {
      contentInitializedRef.current = true;
      return;
    }

    let timeoutId: number | undefined;
    let frameId: number | undefined;

    if (!isOpen) {
      setIsContentEntered(false);
      timeoutId = window.setTimeout(() => {
        setIsContentVisible(false);
      }, CUSTOMER_INFO_PANEL_CONTENT_TRANSITION_MS);

      return () => {
        if (timeoutId !== undefined) {
          window.clearTimeout(timeoutId);
        }
      };
    }

    setIsContentVisible(true);
    timeoutId = window.setTimeout(() => {
      frameId = window.requestAnimationFrame(() => {
        setIsContentEntered(true);
      });
    }, CUSTOMER_INFO_PANEL_CONTENT_ENTER_DELAY_MS);

    return () => {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }

      if (frameId !== undefined) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [isOpen]);

  return (
    <div
      aria-hidden={!isOpen}
      className={cn(
        "relative hidden min-h-0 overflow-visible min-[1024px]:block",
        isEqualSplit && equalSplitWidth === undefined && "min-w-0 flex-1 basis-0",
        isEqualSplit && equalSplitWidth !== undefined && "shrink-0",
        !isOpen && "pointer-events-none",
      )}
      style={{
        width: isEqualSplit ? equalSplitWidth : isOpen ? width : 0,
        marginRight: isOpen && showTrailingGap ? CUSTOMER_INFO_PANEL_GAP : 0,
      }}
    >
      <div
        className={cn(
          "flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-black/[0.16] bg-card shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-[opacity,transform,box-shadow] duration-[350ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[opacity,transform]",
          isContentEntered ? "opacity-100 scale-100" : "scale-[0.97] opacity-0",
        )}
      >
        {isContentVisible ? (
          <>
            <div
              className="flex min-h-[68px] cursor-grab items-center justify-between gap-3 border-b border-border bg-background/50 px-5 py-4 active:cursor-grabbing"
              onMouseDown={onUndockStart}
            >
              <div className="flex items-center gap-3">
                <GripHorizontal className="h-4 w-4 flex-shrink-0 text-[#7A7A7A]" />
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold tracking-tight text-[#333333]">Customer Information</h3>
                  <p className="truncate text-xs text-[#7A7A7A]">
                    {customerName} · {customerId}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onMouseDown={(event) => event.stopPropagation()}
                  onClick={onClose}
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[#7A7A7A] transition-colors hover:bg-white dark:hover:bg-[#1C2536] hover:text-[#333333] dark:hover:text-[#CBD5E1]"
                  aria-label="Close customer information panel"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <NotesPanel
              key={customerRecordId}
              initialTab={panelSelection?.initialTab ?? "Overview"}
              initialTicketId={panelSelection?.ticketId}
              customerId={customerRecordId}
              customerName={customerName}
              takeoverCard={takeoverCard ?? undefined}
            />
          </>
        ) : null}
      </div>

    </div>
  );
}

type CustomerInfoPopunderHandle = { triggerClose: () => void };

const CustomerInfoPopunder = forwardRef<CustomerInfoPopunderHandle, {
  position: CustomerInfoPopunderPosition;
  size: CustomerInfoPopunderSize;
  customerRecordId: string;
  customerName: string;
  customerId: string;
  panelSelection: DeskPanelSelection;
  zIndex: number;
  onPositionChange: (position: CustomerInfoPopunderPosition) => void;
  onSizeChange: (size: CustomerInfoPopunderSize) => void;
  onOpenCall: (anchorRect?: DOMRect | null) => void;
  isCallDisabled: boolean;
  onClose: () => void;
  onDock?: () => void;
  dragActivation?: CopilotDragActivation | null;
  onInteractStart?: () => void;
  /** When set, shows a live elapsed-time chip in the header. Dismissed on first interaction. */
  takeoverStartTime?: number | null;
  /** When set, shows the blue AI case overview card at the top of the Overview tab. */
  takeoverCard?: { botType: string; botAvatarUrl: string; customerContext: string; aiConfidence: number; aiConfidenceReason: string } | null;
}>(function CustomerInfoPopunder({
  position,
  size,
  customerRecordId,
  customerName,
  customerId,
  panelSelection,
  zIndex,
  onPositionChange,
  onSizeChange,
  onOpenCall,
  isCallDisabled,
  onClose,
  onDock,
  dragActivation = null,
  onInteractStart,
  takeoverStartTime = null,
  takeoverCard = null,
}, ref) {
  // Two-div architecture:
  //   containerRef  — outer, position-only div. Owns transform:translate(x,y) and explicit
  //                   width/height. No animations, no visual chrome. Because it has no CSS
  //                   animations, will-change:transform gives a clean compositor layer for
  //                   zero-latency drag. Explicit size avoids browser content-measurement on
  //                   every resize tick.
  //   innerRef      — inner content div. Owns CSS entry/exit animations and all visual chrome.
  //                   Its animation transform is on a separate element from the positioning
  //                   transform, so there is no compositor conflict.
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const resizeStartRef = useRef({ mouseX: 0, mouseY: 0, width: size.width, height: size.height });
  const isDraggingRef = useRef(false);
  const isResizingRef = useRef(false);
  const [isExiting, setIsExiting] = useState(false);
  // Live ref copies — read by event handlers without causing re-renders.
  const positionRef = useRef(position);
  const sizeRef = useRef(size);
  useEffect(() => { positionRef.current = position; }, [position]);
  useEffect(() => { sizeRef.current = size; }, [size]);

  // `transform`, `width`, and `height` are intentionally OMITTED from the React style props
  // so React can never overwrite mid-gesture values.
  // These useLayoutEffects are the sole owners when no gesture is active.

  // Position — compositor-only transform on the outer div (no animation transform on this element).
  useLayoutEffect(() => {
    if (!containerRef.current || isDraggingRef.current || isResizingRef.current) return;
    containerRef.current.style.transform = `translate(${position.x}px, ${position.y}px)`;
  }, [position]);

  // Size — direct DOM write on outer div; explicit dimensions eliminate content-measure on resize.
  useLayoutEffect(() => {
    if (!containerRef.current || isResizingRef.current) return;
    containerRef.current.style.width = `${size.width}px`;
    containerRef.current.style.height = `${size.height}px`;
  }, [size]);

  // Plays the slide-up exit animation then delegates the actual unmount to the caller.
  const handleClose = useCallback(() => {
    if (isExiting) return;
    setIsExiting(true);
    setTimeout(() => { onClose(); }, 280);
  }, [isExiting, onClose]);

  // Expose triggerClose so the parent can animate-out without immediately unmounting.
  useImperativeHandle(ref, () => ({ triggerClose: handleClose }), [handleClose]);

  // Auto-close after 5 s when opened via takeover (mirrors the old top-left toast behaviour).
  // Cancelled the moment the user interacts with the panel.
  const autoCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelAutoClose = useCallback(() => {
    if (autoCloseTimerRef.current !== null) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }
  }, []);
  // Keep a stable ref to handleClose so the timer callback always calls the latest version
  // without adding handleClose to the effect's dep array — which would reset the timer on
  // every Layout re-render (handleClose changes whenever the inline onClose prop changes).
  const handleCloseRef = useRef(handleClose);
  useEffect(() => { handleCloseRef.current = handleClose; }, [handleClose]);
  useEffect(() => {
    if (!takeoverStartTime) return;
    autoCloseTimerRef.current = setTimeout(() => {
      autoCloseTimerRef.current = null;
      handleCloseRef.current();
    }, 5_000);
    return () => {
      if (autoCloseTimerRef.current !== null) clearTimeout(autoCloseTimerRef.current);
    };
  }, [takeoverStartTime]); // intentionally excludes handleClose — use ref instead

  useEffect(() => {
    if (!dragActivation) return;
    isDraggingRef.current = true;
    dragOffsetRef.current = dragActivation.offset;
    document.body.style.userSelect = "none";
    if (containerRef.current) containerRef.current.style.willChange = "transform";
  }, [dragActivation]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (isDraggingRef.current) {
        // Compute the clamped absolute destination.
        const absX = Math.min(
          Math.max(CUSTOMER_INFO_POPOUNDER_MARGIN, event.clientX - dragOffsetRef.current.x),
          window.innerWidth - sizeRef.current.width - CUSTOMER_INFO_POPOUNDER_MARGIN,
        );
        const absY = Math.min(
          Math.max(CUSTOMER_INFO_POPOUNDER_MARGIN, event.clientY - dragOffsetRef.current.y),
          window.innerHeight - sizeRef.current.height - CUSTOMER_INFO_POPOUNDER_MARGIN,
        );
        // Write transform directly to the outer div — compositor-only, off the main thread.
        // No CSS animation on this element, so will-change:transform gives a clean layer.
        if (containerRef.current) {
          containerRef.current.style.transform = `translate(${absX}px, ${absY}px)`;
        }
        positionRef.current = { x: absX, y: absY };
        return;
      }

      if (!isResizingRef.current) return;

      const deltaX = event.clientX - resizeStartRef.current.mouseX;
      const deltaY = event.clientY - resizeStartRef.current.mouseY;
      const nextW = Math.min(
        Math.max(360, resizeStartRef.current.width + deltaX),
        window.innerWidth - positionRef.current.x - CUSTOMER_INFO_POPOUNDER_MARGIN,
      );
      const nextH = Math.min(
        Math.max(420, resizeStartRef.current.height + deltaY),
        window.innerHeight - positionRef.current.y - CUSTOMER_INFO_POPOUNDER_MARGIN,
      );
      // Direct DOM write to the outer div — no React re-render on every frame.
      sizeRef.current = { width: nextW, height: nextH };
      if (containerRef.current) {
        containerRef.current.style.width  = `${nextW}px`;
        containerRef.current.style.height = `${nextH}px`;
      }
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        // transform is already at the correct final position from the last mousemove
        // DOM write — no additional writes needed. Just notify React of the new position
        // so subsequent re-renders stay in sync.
        onPositionChange(positionRef.current);
        // Release the compositor layer promotion — not needed at rest.
        if (containerRef.current) containerRef.current.style.willChange = "auto";
      }
      if (isResizingRef.current) {
        isResizingRef.current = false;
        // Sync React state once on release so the rest of the app knows the final size.
        onSizeChange(sizeRef.current);
      }
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
    };
  }, [onPositionChange, onSizeChange]);

  return (
    // Outer div: position + size only. No animations — clean compositor layer for drag.
    // transform and width/height are DOM-managed (not in React style) to prevent overwrites.
    <div
      ref={containerRef}
      className="fixed"
      style={{ zIndex }}
    >
      {/* Inner div: CSS entry/exit animations + visual chrome. Animation transform is on a
          separate element from the outer div's positioning transform — no conflict. */}
      <div
        ref={innerRef}
        className={cn(
          "flex w-full min-h-[420px] min-w-0 flex-col overflow-hidden rounded-xl border border-black/10 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.18)]",
          isExiting
            ? "animate-out slide-out-to-top-4 fade-out duration-300"
            : "animate-in slide-in-from-top-4 fade-in duration-300",
        )}
        style={{
          width: "100%",
          height: "100%",
          maxWidth: "calc(100vw - 2rem)",
          maxHeight: "calc(100vh - 2rem)",
          animationFillMode: "both",
        }}
        onMouseEnter={cancelAutoClose}
        onMouseDown={cancelAutoClose}
      >
      <div
        className="flex cursor-grab items-center justify-between gap-3 border-b border-border bg-background/50 px-5 py-4 active:cursor-grabbing"
        onMouseDown={(event) => {
          onInteractStart?.();
          isDraggingRef.current = true;
          dragOffsetRef.current = {
            x: event.clientX - positionRef.current.x,
            y: event.clientY - positionRef.current.y,
          };
          document.body.style.userSelect = "none";
          if (containerRef.current) containerRef.current.style.willChange = "transform";
        }}
      >
        <div className="flex items-center gap-3">
          <GripHorizontal className="h-4 w-4 flex-shrink-0 text-[#7A7A7A]" />
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-[#333333]">Customer Information</h3>
            <p className="text-xs text-[#7A7A7A]">{customerName} · {customerId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onDock && (
            <button
              type="button"
              onMouseDown={(event) => event.stopPropagation()}
              onClick={onDock}
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[#7A7A7A] transition-colors hover:bg-white dark:hover:bg-[#1C2536] hover:text-[#333333] dark:hover:text-[#CBD5E1]"
              aria-label="Dock customer information panel"
              title="Dock to conversation"
            >
              <PanelRight className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onMouseDown={(event) => event.stopPropagation()}
            onClick={handleClose}
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[#7A7A7A] transition-colors hover:bg-white dark:hover:bg-[#1C2536] hover:text-[#333333] dark:hover:text-[#CBD5E1]"
            aria-label="Close customer information popunder"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <NotesPanel
        key={customerRecordId}
        initialTab={panelSelection?.initialTab ?? "Overview"}
        initialTicketId={panelSelection?.ticketId}
        customerId={customerRecordId}
        takeoverCard={takeoverCard ?? undefined}
      />

      <button
        type="button"
        aria-label="Resize customer information popunder"
        className="absolute bottom-0 right-0 h-5 w-5 cursor-se-resize"
        onMouseDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
          isResizingRef.current = true;
          resizeStartRef.current = {
            mouseX: event.clientX,
            mouseY: event.clientY,
            width: size.width,
            height: size.height,
          };
          document.body.style.userSelect = "none";
        }}
      >
        <span className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-sm border-b-2 border-r-2 border-[#A1A1AA]" />
      </button>
      </div>{/* end inner animation div */}
    </div>
  );
});

// Terry Williams call — specific script for the sales demo simulation.
const TERRY_TRANSCRIPT_LINES: Omit<TranscriptLine, "id">[] = [
  { speaker: "customer", text: "Hello? This is Terry Williams.", elapsed: 1 },
  { speaker: "agent",    text: "Hi Terry, this is Jeff from NovaTech — thanks for reaching out, I saw you were just on our pricing page. Perfect timing. What's driving the search right now?", elapsed: 5 },
  { speaker: "customer", text: "Yeah, we've been on a legacy TMS for about six years. It's falling apart and our warehouse integrations are a nightmare. We're under pressure to have something new in place before Q4.", elapsed: 9 },
  { speaker: "agent",    text: "Got it — Q4 is tight but doable. Has budget been approved yet, or are you still in the evaluation phase?", elapsed: 24 },
  { speaker: "customer", text: "Budget's approved. We set aside around $400K annually for this. I just need to make sure the product can handle the complexity of our routing logic before I bring it to our CTO.", elapsed: 33 },
  { speaker: "agent",    text: "That's great — and honestly, for routing logic at your scale, what I'd recommend is a technical deep-dive with one of our solutions engineers rather than a standard demo. They can get into the specifics of your warehouse setup. Does that sound useful?", elapsed: 43 },
  { speaker: "customer", text: "That's exactly what I'd want, yeah. Can we do that this week?", elapsed: 49 },
  { speaker: "agent",    text: "Absolutely — I'll get that set up. Can I confirm your email so the solutions engineer can send over a prep doc beforehand?", elapsed: 59 },
  { speaker: "customer", text: "Sure, it's t.williams@nexusfreight.com.", elapsed: 65 },
  { speaker: "agent",    text: "Perfect. I'll have someone reach out by end of day to confirm the time. Thanks Terry — this is going to be a great fit.", elapsed: 74 },
  { speaker: "customer", text: "Thanks, looking forward to next steps.", elapsed: 81 },
];

// Right-side call transcript panel — auto-scrolls to new lines unless the agent has scrolled up.
// Incoming lines are revealed word-by-word to simulate live transcription.
function TerryTranscriptPanel({
  transcriptLines,
  isVisible,
  isLive,
  customerName,
  scriptLength,
  onClose,
}: {
  transcriptLines: TranscriptLine[];
  isVisible: boolean;
  isLive: boolean;
  customerName: string;
  scriptLength: number;
  onClose: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const userScrolledUpRef = useRef(false);

  // Word-by-word reveal state
  const [animatingLineId, setAnimatingLineId] = useState<string | null>(null);
  const [revealedWordCount, setRevealedWordCount] = useState(0);
  const animIntervalRef = useRef<number | null>(null);
  // Initialise to the current length so pre-seeded lines are never animated.
  const prevLinesLengthRef = useRef(transcriptLines.length);

  // Detect newly appended non-system lines and start word-by-word reveal.
  useEffect(() => {
    const prevLen = prevLinesLengthRef.current;
    const newLen = transcriptLines.length;
    prevLinesLengthRef.current = newLen;

    if (newLen <= prevLen) return;

    const newestLine = transcriptLines[newLen - 1];
    if (!newestLine || newestLine.speaker === "system") return;

    // Cancel any in-progress animation before starting a new one.
    if (animIntervalRef.current !== null) {
      clearInterval(animIntervalRef.current);
      animIntervalRef.current = null;
    }

    const words = newestLine.text.split(" ");
    setAnimatingLineId(newestLine.id);
    setRevealedWordCount(1);

    let wordIdx = 1;
    animIntervalRef.current = window.setInterval(() => {
      wordIdx += 1;
      setRevealedWordCount(wordIdx);
      if (wordIdx >= words.length) {
        clearInterval(animIntervalRef.current!);
        animIntervalRef.current = null;
        setAnimatingLineId(null);
      }
    }, 90);
  }, [transcriptLines]);

  // Clean up interval on unmount.
  useEffect(() => {
    return () => {
      if (animIntervalRef.current !== null) clearInterval(animIntervalRef.current);
    };
  }, []);

  // Auto-scroll to bottom whenever new lines arrive or a word is revealed, unless user scrolled up.
  useEffect(() => {
    if (userScrolledUpRef.current || !scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [transcriptLines, revealedWordCount]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    userScrolledUpRef.current = distFromBottom > 40;
  };

  // Return partial text while a line is being animated, full text otherwise.
  const getDisplayText = (line: TranscriptLine) => {
    if (line.id !== animatingLineId) return line.text;
    return line.text.split(" ").slice(0, revealedWordCount).join(" ");
  };

  return (
    <div className={cn(
      "flex flex-col h-full border-l border-[#E4E7EC] bg-white overflow-hidden transition-[width] duration-300 ease-in-out",
      isVisible ? "w-[340px]" : "w-0 border-l-0",
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#F2F4F7] shrink-0 min-w-[340px]">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[#667085]">Call Transcript</span>
          <span className="text-[10px] text-[#98A2B3]">· {customerName}</span>
        </div>
        <div className="flex items-center gap-2">
          {isLive && (
            <div className="flex items-center gap-1.5 rounded-full bg-[#EFFBF1] px-2.5 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#208337] animate-pulse" />
              <span className="text-[10px] font-semibold uppercase tracking-wide text-[#208337]">Live</span>
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded-full text-[#98A2B3] transition-colors hover:bg-[#F2F4F7] hover:text-[#344054]"
            aria-label="Close transcript"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>
      {/* Scrollable transcript lines */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex flex-col gap-3 overflow-y-auto px-4 py-3 flex-1 min-w-[340px]"
      >
        {transcriptLines.map((line) => (
          line.speaker === "system" ? (
            <div key={line.id} className="flex items-center gap-2 py-1">
              <div className="h-px flex-1 bg-[#E4E7EC]" />
              <span className="flex-shrink-0 text-[11px] font-medium text-[#98A2B3]">{line.text}</span>
              <div className="h-px flex-1 bg-[#E4E7EC]" />
            </div>
          ) : (
            <div key={line.id} className={cn("flex flex-col gap-0.5", line.speaker === "agent" ? "items-end" : "items-start")}>
              <div className="flex items-center gap-1.5">
                <span className={cn("text-[10px] font-semibold uppercase tracking-wide", line.speaker === "agent" ? "text-[#166CCA]" : "text-[#667085]")}>
                  {line.speaker === "agent" ? "Jeff Comstock" : customerName}
                </span>
                <span className="text-[10px] text-[#98A2B3]">{formatElapsed(line.elapsed)}</span>
              </div>
              <div className={cn(
                "max-w-[88%] rounded-xl px-3 py-2 text-[13px] leading-relaxed",
                line.speaker === "agent" ? "bg-[#EBF4FD] text-[#1D2939]" : "bg-[#F9FAFB] border border-[#E4E7EC] text-[#344054]",
              )}>
                {getDisplayText(line)}
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
}

// Collapsible lead form shown when agent clicks "Review Lead Form".
function TerryLeadForm({ onClose }: { onClose: () => void }) {
  const sectionClass = "flex flex-col gap-3";
  const sectionHeaderClass = "flex items-center gap-3";
  const labelClass = "text-[11px] font-medium text-[#667085]";
  const inputClass = "h-9 rounded-lg border border-[#E4E7EC] bg-[#F9FAFB] px-3 text-[13px] text-[#1D2939] placeholder:text-[#98A2B3] focus:border-[#166CCA] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#166CCA]/20 transition-colors";

  const INITIAL_FIELDS = {
    firstName: "Terry",
    lastName: "Williams",
    title: "VP of Operations",
    company: "Nexus Freight",
    email: "t.williams@nexusfreight.com",
    phone: "+1 (408) 555-0134",
    location: "San Jose, CA",
    leadType: "Enterprise — New logo",
    leadSource: "Web callback — pricing page",
    annualBudget: "$400,000",
    decisionTimeline: "Before Q4 2025",
    industry: "Freight & Logistics",
    companySize: "~200 employees",
    painPoint: "Legacy TMS replacement; warehouse integration failures",
    keyStakeholders: "Terry Williams (primary); CTO (to be confirmed)",
    recommendedAction: "Technical deep-dive with solutions engineer — this week",
  };

  const [fields, setFields] = useState(INITIAL_FIELDS);

  const isDirty = (Object.keys(fields) as (keyof typeof fields)[]).some(
    (key) => fields[key] !== INITIAL_FIELDS[key],
  );

  const set = (key: keyof typeof fields) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFields((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="rounded-xl border border-[#E4E7EC] bg-white overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Form header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#F2F4F7]">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-[#667085]">Lead Form</span>
        <button
          type="button"
          onClick={onClose}
          className="flex h-6 w-6 items-center justify-center rounded-full text-[#98A2B3] hover:bg-[#F2F4F7] hover:text-[#344054] transition-colors"
          aria-label="Close lead form"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="px-4 py-4 flex flex-col gap-5 overflow-y-auto max-h-[560px]">

        {/* CONTACT */}
        <div className={sectionClass}>
          <div className={sectionHeaderClass}>
            <span className="text-[9px] font-semibold uppercase tracking-widest text-[#98A2B3]">Contact</span>
            <div className="flex-1 h-px bg-[#F2F4F7]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className={labelClass}>First name</label>
              <input className={inputClass} value={fields.firstName} onChange={set("firstName")} />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelClass}>Last name</label>
              <input className={inputClass} value={fields.lastName} onChange={set("lastName")} />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelClass}>Title</label>
              <input className={inputClass} value={fields.title} onChange={set("title")} />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelClass}>Company</label>
              <input className={inputClass} value={fields.company} onChange={set("company")} />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelClass}>Email</label>
              <input className={inputClass} value={fields.email} onChange={set("email")} />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelClass}>Phone</label>
              <input className={inputClass} value={fields.phone} onChange={set("phone")} />
            </div>
            <div className="col-span-2 flex flex-col gap-1">
              <label className={labelClass}>Location</label>
              <input className={inputClass} value={fields.location} onChange={set("location")} />
            </div>
          </div>
        </div>

        {/* QUALIFICATION */}
        <div className={sectionClass}>
          <div className={sectionHeaderClass}>
            <span className="text-[9px] font-semibold uppercase tracking-widest text-[#98A2B3]">Qualification</span>
            <div className="flex-1 h-px bg-[#F2F4F7]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className={labelClass}>Lead type</label>
              <input className={inputClass} value={fields.leadType} onChange={set("leadType")} />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelClass}>Lead source</label>
              <input className={inputClass} value={fields.leadSource} onChange={set("leadSource")} />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelClass}>Annual budget</label>
              <input className={inputClass} value={fields.annualBudget} onChange={set("annualBudget")} />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelClass}>Decision timeline</label>
              <input className={inputClass} value={fields.decisionTimeline} onChange={set("decisionTimeline")} />
            </div>
          </div>
        </div>

        {/* OPPORTUNITY */}
        <div className={sectionClass}>
          <div className={sectionHeaderClass}>
            <span className="text-[9px] font-semibold uppercase tracking-widest text-[#98A2B3]">Opportunity</span>
            <div className="flex-1 h-px bg-[#F2F4F7]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className={labelClass}>Industry</label>
              <div className="relative">
                <input className={cn(inputClass, "w-full pr-14 border-[#ABEFC6] bg-[#F0FDF4] text-[#166534] focus:border-[#166534] focus:ring-[#166534]/20")} value={fields.industry} onChange={set("industry")} />
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full bg-[#DCFCE7] px-1.5 py-0.5 text-[9px] font-semibold text-[#166534]">Edited</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelClass}>Company size</label>
              <input className={inputClass} value={fields.companySize} onChange={set("companySize")} />
            </div>
            <div className="col-span-2 flex flex-col gap-1">
              <label className={labelClass}>Pain point</label>
              <input className={inputClass} value={fields.painPoint} onChange={set("painPoint")} />
            </div>
            <div className="col-span-2 flex flex-col gap-1">
              <label className={labelClass}>Key stakeholders</label>
              <input className={inputClass} value={fields.keyStakeholders} onChange={set("keyStakeholders")} />
            </div>
          </div>
        </div>

        {/* NEXT STEP */}
        <div className={sectionClass}>
          <div className={sectionHeaderClass}>
            <span className="text-[9px] font-semibold uppercase tracking-widest text-[#98A2B3]">Next Step</span>
            <div className="flex-1 h-px bg-[#F2F4F7]" />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Recommended action</label>
            <input className={inputClass} value={fields.recommendedAction} onChange={set("recommendedAction")} />
          </div>
        </div>

      </div>

      {/* Footer buttons */}
      <div className="flex gap-2 border-t border-[#F2F4F7] px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-lg border border-[#D0D5DD] bg-white px-4 py-2 text-[13px] font-semibold text-[#344054] transition-colors hover:bg-[#F9FAFB]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={!isDirty}
          className="flex-1 rounded-lg px-4 py-2 text-[13px] font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:bg-[#93C5FD] disabled:opacity-60 bg-[#166CCA] hover:enabled:bg-[#1260B0]"
        >
          Save lead information
        </button>
      </div>
    </div>
  );
}

// Live Sales Intelligence panel — renders inside the conversation content during Terry's call.
// Phase is derived from how many transcript lines have appeared:
//   0 = call just started, 1 = after Terry's 1st reply, 2 = after 2nd, 3 = after 3rd, 4 = email captured.
// ── EditableField — stable component identity to avoid re-mount animation loops ──
const leadCaptureEditIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-0 group-hover:opacity-60 text-[#98A2B3]"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
);

function LeadCaptureField({ label, value, onChange, disabled }: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const [editing, setEditing] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setHasAnimated(true), 350); return () => clearTimeout(t); }, []);
  return (
    <div className={hasAnimated ? "" : "animate-in fade-in slide-in-from-bottom-1 duration-300"}>
      <p className="text-[9px] font-semibold uppercase tracking-wide text-[#98A2B3] mb-0.5">{label}</p>
      {editing && !disabled ? (
        <input
          autoFocus
          className="w-full rounded border border-[#166CCA] bg-[#EBF4FD] px-1.5 py-0.5 text-[12px] text-[#1D2939] outline-none"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setEditing(false)}
          onKeyDown={(e) => { if (e.key === "Enter") setEditing(false); }}
        />
      ) : (
        <button
          type="button"
          className="flex items-center gap-1 text-[12px] text-[#344054] font-medium hover:text-[#166CCA] group text-left"
          onClick={() => { if (!disabled) setEditing(true); }}
        >
          {value}
          {!disabled && leadCaptureEditIcon}
        </button>
      )}
    </div>
  );
}

function TerryCallPanel({ lineCount, callKey, isCallActive, onLeadSaved }: {
  lineCount: number;
  callKey: string;
  isCallActive: boolean;
  onLeadSaved?: () => void;
}) {
  // stableLineCount lags behind lineCount while a customer line is being word-animated
  // (90 ms per word, matching TerryTranscriptPanel's interval). This ensures the Analysis
  // and Suggested Response sections don't appear until the transcript has caught up.
  const [stableLineCount, setStableLineCount] = useState(lineCount);
  const phaseTimerRef = useRef<number | null>(null);
  const prevLineCountRef = useRef(lineCount);

  useEffect(() => {
    if (lineCount <= prevLineCountRef.current) {
      prevLineCountRef.current = lineCount;
      return;
    }
    prevLineCountRef.current = lineCount;

    const newLineIndex = lineCount - 1;
    const newLine = TERRY_TRANSCRIPT_LINES[newLineIndex];
    // Only delay for customer lines — those are the ones being word-animated.
    const delay = newLine?.speaker === "customer" ? newLine.text.split(" ").length * 90 : 0;

    if (phaseTimerRef.current !== null) clearTimeout(phaseTimerRef.current);
    if (delay > 0) {
      phaseTimerRef.current = window.setTimeout(() => {
        setStableLineCount(lineCount);
        phaseTimerRef.current = null;
      }, delay);
    } else {
      setStableLineCount(lineCount);
    }
  }, [lineCount]);

  // Clean up the pending timer if the component unmounts or the call resets.
  useEffect(() => {
    return () => { if (phaseTimerRef.current !== null) clearTimeout(phaseTimerRef.current); };
  }, []);

  const phase: 0 | 1 | 2 | 3 | 4 = stableLineCount >= 9 ? 4 : stableLineCount >= 7 ? 3 : stableLineCount >= 5 ? 2 : stableLineCount >= 3 ? 1 : 0;
  const [industryValue, setIndustryValue] = useState("Transportation");
  const [isEditingIndustry, setIsEditingIndustry] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
  // Reset editable state if a completely new call starts.
  // isSaved is intentionally excluded — saving a lead is a permanent action
  // and must not be reversed when the call ends (callKey flips to the fallback "terry").
  const prevKeyRef = useRef(callKey);
  if (callKey !== prevKeyRef.current) {
    prevKeyRef.current = callKey;
    setIndustryValue("Transportation");
    setIsEditingIndustry(false);
    setIsLeadFormOpen(false);
    if (phaseTimerRef.current !== null) { clearTimeout(phaseTimerRef.current); phaseTimerRef.current = null; }
    setStableLineCount(lineCount);
  }

  const aiSuggestions: Record<number, { analysis: string; response: string }> = {
    1: {
      analysis: "Timeline is tight — Terry needs a replacement before Q4, which is under 6 months out. This is a strong urgency signal, but budget status is still unconfirmed.",
      response: "\"Has budget been approved yet, or are you still in the evaluation phase?\"",
    },
    2: {
      analysis: "Budget confirmed at $400K annually. Terry needs CTO buy-in before committing — the technical fit is the deciding factor, not price.",
      response: "\"For routing logic at your scale, a technical deep-dive with one of our solutions engineers would be more valuable than a standard demo. Does that sound useful?\"",
    },
    3: {
      analysis: "Strong buying intent — Terry wants a session this week and is ready to move forward. Capturing direct contact now locks in the next step.",
      response: "\"Can I confirm your email so our solutions engineer can send over a prep doc beforehand?\"",
    },
    4: {
      analysis: "Lead fully qualified and captured. Budget confirmed, timeline urgent, technical session agreed. This is a high-intent enterprise opportunity ready to hand off.",
      response: "\"Perfect. I'll have someone reach out by end of day to confirm the time. Really glad we connected today, Terry — this sounds like a great fit.\"",
    },
  };
  const currentSuggestion = isCallActive && phase >= 1 && phase <= 4 ? aiSuggestions[phase] : null;

  // ── Editable form field state — seeded with AI-captured values, agent can modify ──
  const [formPainPoint, setFormPainPoint] = useState("Legacy TMS · Integration failures");
  const [formTimeline, setFormTimeline] = useState("Q4 deadline");
  const [formUrgency, setFormUrgency] = useState("High");
  const [formBudget, setFormBudget] = useState("$400K / yr");
  const [formDealType, setFormDealType] = useState("Enterprise — New Logo");
  const [formDecisionMaker, setFormDecisionMaker] = useState("CTO approval needed");
  const [formNextStep, setFormNextStep] = useState("Technical deep-dive · This week");
  const [formEngagement, setFormEngagement] = useState("High");
  const [formEmail, setFormEmail] = useState("t.williams@nexusfreight.com");

  // Snapshot of form values at last save — used to detect edits after saving
  const [savedSnapshot, setSavedSnapshot] = useState<Record<string, string> | null>(null);
  const currentFormValues = { formPainPoint, formTimeline, formUrgency, formBudget, formDealType, formDecisionMaker, formNextStep, formEngagement, formEmail };
  const isDirtyAfterSave = isSaved && savedSnapshot !== null && Object.keys(savedSnapshot).some((k) => savedSnapshot[k] !== (currentFormValues as any)[k]);

  // Reset form fields on new call
  if (callKey !== prevKeyRef.current) {
    // (prevKeyRef already updated above)
    setFormPainPoint("Legacy TMS · Integration failures");
    setFormTimeline("Q4 deadline");
    setFormUrgency("High");
    setFormBudget("$400K / yr");
    setFormDealType("Enterprise — New Logo");
    setFormDecisionMaker("CTO approval needed");
    setFormNextStep("Technical deep-dive · This week");
    setFormEngagement("High");
    setFormEmail("t.williams@nexusfreight.com");
  }

  return (
    <>
    {/* Sales Intelligence — identity card */}
    <div className="flex flex-col gap-3 rounded-xl border border-[#E4E7EC] bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[#667085]">Sales Intelligence</span>
          {!isSaved && (
            <span className="flex items-center gap-1 rounded-full bg-[#EFFBF1] px-2 py-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#208337] animate-pulse" />
              <span className="text-[9px] font-semibold uppercase tracking-wide text-[#208337]">Live</span>
            </span>
          )}
          {isSaved && (
            <span className="flex items-center gap-1 rounded-full bg-[#EBF4FD] px-2 py-0.5">
              <span className="text-[9px] font-semibold uppercase tracking-wide text-[#166CCA]">Saved ✓</span>
            </span>
          )}
        </div>
      </div>

      {/* Static identity fields */}
      <div className="px-4 pb-3 grid grid-cols-2 gap-x-4 gap-y-2">
        {[
          { label: "Lead Name", value: "Terry Williams" },
          { label: "Company", value: "Nexus Freight" },
          { label: "Channel", value: "Inbound Voice" },
        ].map((f) => (
          <div key={f.label}>
            <p className="text-[9px] font-semibold uppercase tracking-wide text-[#98A2B3] mb-0.5">{f.label}</p>
            <p className="text-[12px] text-[#344054] font-medium">{f.value}</p>
          </div>
        ))}
        {/* Editable Industry field */}
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-wide text-[#98A2B3] mb-0.5">Industry</p>
          {isEditingIndustry ? (
            <input
              autoFocus
              className="w-full rounded border border-[#166CCA] bg-[#EBF4FD] px-1.5 py-0.5 text-[12px] text-[#1D2939] outline-none"
              value={industryValue}
              onChange={(e) => setIndustryValue(e.target.value)}
              onBlur={() => setIsEditingIndustry(false)}
              onKeyDown={(e) => { if (e.key === "Enter") setIsEditingIndustry(false); }}
            />
          ) : (
            <button
              type="button"
              className="flex items-center gap-1 text-[12px] text-[#344054] font-medium hover:text-[#166CCA] group"
              onClick={() => { if (!isSaved) setIsEditingIndustry(true); }}
            >
              {industryValue}
              {!isSaved && <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 group-hover:opacity-60"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>}
            </button>
          )}
        </div>
      </div>
    </div>

    {/* AI cards — Analysis + Suggested Response */}
    {currentSuggestion && (
      <React.Fragment key={phase}>
        <div className="rounded-lg border border-[#E4E7EC] bg-white px-3 py-2.5 animate-in fade-in slide-in-from-bottom-2 duration-400">
          <div className="flex items-center gap-1.5 mb-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#667085] shrink-0"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <span className="text-[9px] font-semibold uppercase tracking-widest text-[#667085]">Analysis</span>
          </div>
          <p className="text-[12px] leading-relaxed text-[#344054]">{currentSuggestion.analysis}</p>
        </div>
        <div className="rounded-lg border border-[#BFDBFE] bg-[#EBF4FD] px-3 py-2.5 animate-in fade-in slide-in-from-bottom-2 duration-400">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Sparkles className="h-3 w-3 text-[#166CCA] shrink-0" />
            <span className="text-[9px] font-semibold uppercase tracking-widest text-[#1260B0]">Suggested Response</span>
          </div>
          <p className="text-[12px] leading-relaxed text-[#1D2939]">{currentSuggestion.response}</p>
        </div>
      </React.Fragment>
    )}

    {/* Lead Capture Form — builds progressively as data is captured from the call */}
    {phase >= 1 && (
      <div className="flex flex-col rounded-xl border border-[#E4E7EC] bg-white overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#667085]">Lead Capture</span>
            {phase < 4 && (
              <span className="flex items-center gap-1 rounded-full bg-[#FFF4E5] px-2 py-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#F79009] animate-pulse" />
                <span className="text-[9px] font-semibold uppercase tracking-wide text-[#B54708]">Capturing</span>
              </span>
            )}
            {phase >= 4 && !isSaved && (
              <span className="flex items-center gap-1 rounded-full bg-[#EFFBF1] px-2 py-0.5">
                <span className="text-[9px] font-semibold uppercase tracking-wide text-[#208337]">Complete</span>
              </span>
            )}
          </div>
        </div>

        <div className="px-4 pb-3 grid grid-cols-2 gap-x-4 gap-y-2.5">
          {/* Phase 1 fields */}
          <LeadCaptureField label="Pain Point" value={formPainPoint} onChange={setFormPainPoint} />
          <LeadCaptureField label="Timeline" value={formTimeline} onChange={setFormTimeline} />
          <LeadCaptureField label="Urgency" value={formUrgency} onChange={setFormUrgency} />

          {/* Phase 2 fields */}
          {phase >= 2 && (
            <>
              <LeadCaptureField label="Budget" value={formBudget} onChange={setFormBudget} />
              <LeadCaptureField label="Deal Type" value={formDealType} onChange={setFormDealType} />
              <LeadCaptureField label="Decision Maker" value={formDecisionMaker} onChange={setFormDecisionMaker} />
            </>
          )}

          {/* Phase 3 fields */}
          {phase >= 3 && (
            <>
              <LeadCaptureField label="Next Step" value={formNextStep} onChange={setFormNextStep} />
              <LeadCaptureField label="Engagement" value={formEngagement} onChange={setFormEngagement} />
            </>
          )}

          {/* Phase 4 fields */}
          {phase >= 4 && (
            <div className="col-span-2">
              <LeadCaptureField label="Contact Email" value={formEmail} onChange={setFormEmail} />
            </div>
          )}
        </div>

        {/* Save Lead / Lead Saved footer */}
        {phase >= 4 && (!isSaved || isDirtyAfterSave) && (
          <div className="px-4 pb-3 pt-1 border-t border-[#F2F4F7] animate-in fade-in duration-400">
            <button
              type="button"
              onClick={() => { setIsSaved(true); setSavedSnapshot({ ...currentFormValues }); onLeadSaved?.(); }}
              className="w-full rounded-lg bg-[#166CCA] px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#1260B0]"
            >
              Save Lead
            </button>
          </div>
        )}
        {phase >= 4 && isSaved && !isDirtyAfterSave && (
          <div className="px-4 pb-3 pt-1 border-t border-[#F2F4F7]">
            <div className="flex items-center justify-center gap-2 rounded-lg bg-[#EFFBF1] border border-[#ABEFC6] px-4 py-2">
              <CheckCircle2 className="h-4 w-4 text-[#208337]" />
              <span className="text-[13px] font-semibold text-[#208337]">Lead Saved</span>
            </div>
          </div>
        )}
      </div>
    )}

</>
  );
}

// Mock call transcript lines — revealed progressively as the call advances.
const MOCK_TRANSCRIPT_LINES: Omit<TranscriptLine, "id">[] = [
  { speaker: "agent",    text: "Thank you for calling, this is your agent. How can I help you today?",                                elapsed: 3  },
  { speaker: "customer", text: "Hi, yes — I'm calling about a charge on my account that I don't recognize.",                         elapsed: 8  },
  { speaker: "agent",    text: "Of course, I can help with that. Can you confirm the last four digits of your card?",                 elapsed: 14 },
  { speaker: "customer", text: "Sure, it's ending in 4821.",                                                                          elapsed: 19 },
  { speaker: "agent",    text: "Thank you. I can see your account here. Which charge are you seeing?",                                elapsed: 25 },
  { speaker: "customer", text: "There's a charge from yesterday — $147.50 to something called NX Digital Services. No idea what it is.", elapsed: 33 },
  { speaker: "agent",    text: "Let me look that up for you. One moment.",                                                            elapsed: 38 },
  { speaker: "agent",    text: "I can see that transaction. It does look unusual. Have you signed up for any new subscriptions recently?", elapsed: 46 },
  { speaker: "customer", text: "No, nothing new. That's why I'm calling.",                                                            elapsed: 52 },
  { speaker: "agent",    text: "Understood. I'm going to flag this as a potential unauthorized charge and initiate a dispute.",        elapsed: 59 },
  { speaker: "customer", text: "Okay, thank you. Will I get the money back?",                                                         elapsed: 65 },
  { speaker: "agent",    text: "Yes, we'll issue a provisional credit within 1 to 2 business days while we investigate.",             elapsed: 73 },
  { speaker: "customer", text: "And how long does the full investigation take?",                                                       elapsed: 79 },
  { speaker: "agent",    text: "Typically 5 to 10 business days. You'll receive email updates throughout the process.",               elapsed: 86 },
  { speaker: "customer", text: "Perfect. That works for me.",                                                                         elapsed: 91 },
  { speaker: "agent",    text: "Great. Is there anything else I can help you with today?",                                            elapsed: 96 },
  { speaker: "customer", text: "No, that's everything. Thanks so much.",                                                              elapsed: 100 },
  { speaker: "agent",    text: "You're very welcome. Have a great day!",                                                              elapsed: 104 },
];

function formatElapsed(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function TranscriptPopunder({
  position,
  size,
  zIndex,
  transcriptLines,
  scriptLength,
  isCallActive,
  customerName,
  onPositionChange,
  onSizeChange,
  onClose,
  dragActivation,
  onInteractStart,
  onDock,
}: {
  position: TranscriptPopunderPosition;
  size: TranscriptPopunderSize;
  zIndex: number;
  transcriptLines: TranscriptLine[];
  scriptLength: number;
  isCallActive: boolean;
  customerName: string;
  onPositionChange: (position: TranscriptPopunderPosition) => void;
  onSizeChange: (size: TranscriptPopunderSize) => void;
  onClose: () => void;
  dragActivation?: CopilotDragActivation | null;
  onInteractStart?: () => void;
  onDock?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const resizeStartRef = useRef({ mouseX: 0, mouseY: 0, width: size.width, height: size.height });
  const isDraggingRef = useRef(false);
  const isResizingRef = useRef(false);
  const [isExiting, setIsExiting] = useState(false);
  const positionRef = useRef(position);
  const sizeRef = useRef(size);
  const scrollRef = useRef<HTMLDivElement>(null);
  const wasNearBottomRef = useRef(true);
  useEffect(() => { positionRef.current = position; }, [position]);
  useEffect(() => { sizeRef.current = size; }, [size]);

  useLayoutEffect(() => {
    if (!containerRef.current || isDraggingRef.current || isResizingRef.current) return;
    containerRef.current.style.transform = `translate(${position.x}px, ${position.y}px)`;
  }, [position]);

  useLayoutEffect(() => {
    if (!containerRef.current || isResizingRef.current) return;
    containerRef.current.style.width = `${size.width}px`;
    containerRef.current.style.height = `${size.height}px`;
  }, [size]);

  const handleClose = useCallback(() => {
    if (isExiting) return;
    setIsExiting(true);
    setTimeout(() => { onClose(); }, 280);
  }, [isExiting, onClose]);

  // Auto-scroll to bottom when new lines arrive, if already near bottom.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    wasNearBottomRef.current = distFromBottom < 80;
    if (wasNearBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [transcriptLines.length]);

  useEffect(() => {
    if (!dragActivation) return;
    isDraggingRef.current = true;
    dragOffsetRef.current = dragActivation.offset;
    document.body.style.userSelect = "none";
    if (containerRef.current) containerRef.current.style.willChange = "transform";
  }, [dragActivation]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (isDraggingRef.current) {
        const margin = 16;
        const absX = Math.min(Math.max(margin, event.clientX - dragOffsetRef.current.x), window.innerWidth - sizeRef.current.width - margin);
        const absY = Math.min(Math.max(margin, event.clientY - dragOffsetRef.current.y), window.innerHeight - sizeRef.current.height - margin);
        if (containerRef.current) containerRef.current.style.transform = `translate(${absX}px, ${absY}px)`;
        positionRef.current = { x: absX, y: absY };
        return;
      }
      if (!isResizingRef.current) return;
      const deltaX = event.clientX - resizeStartRef.current.mouseX;
      const deltaY = event.clientY - resizeStartRef.current.mouseY;
      const nextW = Math.min(Math.max(320, resizeStartRef.current.width + deltaX), window.innerWidth - positionRef.current.x - 16);
      const nextH = Math.min(Math.max(300, resizeStartRef.current.height + deltaY), window.innerHeight - positionRef.current.y - 16);
      sizeRef.current = { width: nextW, height: nextH };
      if (containerRef.current) {
        containerRef.current.style.width  = `${nextW}px`;
        containerRef.current.style.height = `${nextH}px`;
      }
    };
    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        onPositionChange(positionRef.current);
        if (containerRef.current) containerRef.current.style.willChange = "auto";
      }
      if (isResizingRef.current) {
        isResizingRef.current = false;
        onSizeChange(sizeRef.current);
      }
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
    };
  }, [onPositionChange, onSizeChange]);

  return (
    <div ref={containerRef} className="fixed" style={{ zIndex }}>
      <div
        className={cn(
          "flex w-full flex-col overflow-hidden rounded-xl border border-black/10 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.18)]",
          isExiting ? "animate-out slide-out-to-top-4 fade-out duration-300" : "animate-in slide-in-from-top-4 fade-in duration-300",
        )}
        style={{ width: "100%", height: "100%", maxWidth: "calc(100vw - 2rem)", maxHeight: "calc(100vh - 2rem)", animationFillMode: "both" }}
      >
        {/* Header / drag handle */}
        <div
          className="flex cursor-grab items-center justify-between gap-3 border-b border-border bg-background/50 px-4 py-3.5 active:cursor-grabbing"
          onMouseDown={(event) => {
            onInteractStart?.();
            isDraggingRef.current = true;
            dragOffsetRef.current = { x: event.clientX - positionRef.current.x, y: event.clientY - positionRef.current.y };
            document.body.style.userSelect = "none";
            if (containerRef.current) containerRef.current.style.willChange = "transform";
          }}
        >
          <div className="flex items-center gap-2.5">
            <GripHorizontal className="h-4 w-4 flex-shrink-0 text-[#7A7A7A]" />
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-[#333333]">Call Transcript</h3>
              <p className="text-xs text-[#7A7A7A]">{customerName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isCallActive && (
              <div className="flex items-center gap-1.5 rounded-full bg-[#EFFBF1] px-2.5 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#208337] animate-pulse" />
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[#208337]">Live</span>
              </div>
            )}
            {onDock && (
              <button
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={onDock}
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[#7A7A7A] transition-colors hover:bg-[#F3F4F6] hover:text-[#333333]"
                aria-label="Dock transcript panel"
                title="Dock to conversation"
              >
                <PanelRight className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={handleClose}
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[#7A7A7A] transition-colors hover:bg-[#F3F4F6] hover:text-[#333333]"
              aria-label="Close transcript"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Transcript body */}
        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-y-auto px-4 py-3"
          style={{ scrollBehavior: "smooth" }}
        >
          {transcriptLines.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <ScrollText className="h-8 w-8 text-[#D0D5DD] mb-3" />
              <p className="text-sm font-medium text-[#667085]">Transcript will appear here</p>
              <p className="mt-1 text-xs text-[#98A2B3]">Lines are captured as the call progresses</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {transcriptLines.map((line) => (
                line.speaker === "system" ? (
                  <div key={line.id} className="flex items-center gap-2 py-1">
                    <div className="h-px flex-1 bg-[#E4E7EC]" />
                    <span className="flex-shrink-0 text-[11px] font-medium text-[#98A2B3]">{line.text}</span>
                    <div className="h-px flex-1 bg-[#E4E7EC]" />
                  </div>
                ) : (
                  <div key={line.id} className={cn("flex flex-col gap-0.5", line.speaker === "agent" ? "items-end" : "items-start")}>
                    <div className="flex items-center gap-1.5">
                      <span className={cn("text-[10px] font-semibold uppercase tracking-wide", line.speaker === "agent" ? "text-[#166CCA]" : "text-[#667085]")}>
                        {line.speaker === "agent" ? "Jeff Comstock" : customerName}
                      </span>
                      <span className="text-[10px] text-[#98A2B3]">{formatElapsed(line.elapsed)}</span>
                    </div>
                    <div
                      className={cn(
                        "max-w-[88%] rounded-xl px-3 py-2 text-[13px] leading-relaxed",
                        line.speaker === "agent"
                          ? "bg-[#EBF4FD] text-[#1D2939]"
                          : "bg-[#F9FAFB] border border-[#E4E7EC] text-[#344054]",
                      )}
                    >
                      {line.text}
                    </div>
                  </div>
                )
              ))}
              {isCallActive && transcriptLines.length < scriptLength && (
                <div className="flex items-center gap-1.5 py-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#98A2B3] animate-bounce [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#98A2B3] animate-bounce [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#98A2B3] animate-bounce [animation-delay:300ms]" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Resize handle */}
        <button
          type="button"
          aria-label="Resize transcript panel"
          className="absolute bottom-0 right-0 h-5 w-5 cursor-se-resize"
          onMouseDown={(event) => {
            event.preventDefault();
            isResizingRef.current = true;
            resizeStartRef.current = { mouseX: event.clientX, mouseY: event.clientY, width: sizeRef.current.width, height: sizeRef.current.height };
            document.body.style.userSelect = "none";
          }}
        >
          <span className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-sm border-b-2 border-r-2 border-[#A1A1AA]" />
        </button>
      </div>
    </div>
  );
}

function DockedTranscriptPanel({
  isOpen,
  width,
  maxWidth,
  onWidthChange,
  onUndockStart,
  onClose,
  showTrailingGap,
  transcriptLines,
  scriptLength,
  isCallActive,
  customerName,
}: {
  isOpen: boolean;
  width: number;
  maxWidth: number;
  onWidthChange: (width: number) => void;
  onUndockStart: (event: React.MouseEvent<HTMLElement>) => void;
  onClose: () => void;
  showTrailingGap: boolean;
  transcriptLines: TranscriptLine[];
  scriptLength: number;
  isCallActive: boolean;
  customerName: string;
}) {
  const resizeStartRef = useRef({ mouseX: 0, width });
  const isResizingRef = useRef(false);
  const contentInitializedRef = useRef(false);
  const [isContentVisible, setIsContentVisible] = useState(isOpen);
  const [isContentEntered, setIsContentEntered] = useState(isOpen);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isResizingRef.current) return;
      const deltaX = event.clientX - resizeStartRef.current.mouseX;
      onWidthChange(Math.min(maxWidth, Math.max(CUSTOMER_INFO_PANEL_MIN_WIDTH, resizeStartRef.current.width + deltaX)));
    };
    const handleMouseUp = () => { isResizingRef.current = false; document.body.style.userSelect = ""; };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => { window.removeEventListener("mousemove", handleMouseMove); window.removeEventListener("mouseup", handleMouseUp); };
  }, [maxWidth, onWidthChange]);

  useEffect(() => {
    if (!contentInitializedRef.current) { contentInitializedRef.current = true; return; }
    let timeoutId: number | undefined;
    let frameId: number | undefined;
    if (!isOpen) {
      setIsContentEntered(false);
      timeoutId = window.setTimeout(() => setIsContentVisible(false), CUSTOMER_INFO_PANEL_CONTENT_TRANSITION_MS);
      return () => { if (timeoutId !== undefined) window.clearTimeout(timeoutId); };
    }
    setIsContentVisible(true);
    timeoutId = window.setTimeout(() => {
      frameId = window.requestAnimationFrame(() => setIsContentEntered(true));
    }, CUSTOMER_INFO_PANEL_CONTENT_ENTER_DELAY_MS);
    return () => { if (timeoutId !== undefined) window.clearTimeout(timeoutId); if (frameId !== undefined) window.cancelAnimationFrame(frameId); };
  }, [isOpen]);

  // Auto-scroll to the latest transcript line.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcriptLines.length]);

  return (
    <div
      aria-hidden={!isOpen}
      className={cn(
        "relative hidden min-h-0 overflow-visible min-[1024px]:block",
        !isOpen && "pointer-events-none",
      )}
      style={{
        width: isOpen ? width : 0,
        marginRight: isOpen && showTrailingGap ? CUSTOMER_INFO_PANEL_GAP : 0,
      }}
    >
      <div
        className={cn(
          "flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-black/[0.16] bg-card shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-[opacity,transform,box-shadow] duration-[350ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[opacity,transform]",
          isContentEntered ? "opacity-100 scale-100" : "scale-[0.97] opacity-0",
        )}
      >
        {isContentVisible ? (
          <>
            {/* Header / drag handle */}
            <div
              className="flex min-h-[68px] cursor-grab items-center justify-between gap-3 border-b border-border bg-background/50 px-5 py-4 active:cursor-grabbing"
              onMouseDown={onUndockStart}
            >
              <div className="flex items-center gap-3">
                <GripHorizontal className="h-4 w-4 flex-shrink-0 text-[#7A7A7A]" />
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold tracking-tight text-[#333333]">Call Transcript</h3>
                  <p className="truncate text-xs text-[#7A7A7A]">{customerName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isCallActive && (
                  <div className="flex items-center gap-1.5 rounded-full bg-[#EFFBF1] px-2.5 py-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#208337] animate-pulse" />
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-[#208337]">Live</span>
                  </div>
                )}
                <button
                  type="button"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={onClose}
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[#7A7A7A] transition-colors hover:bg-white hover:text-[#333333]"
                  aria-label="Close transcript panel"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Transcript body */}
            <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-3" style={{ scrollBehavior: "smooth" }}>
              {transcriptLines.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <ScrollText className="h-8 w-8 text-[#D0D5DD] mb-3" />
                  <p className="text-sm font-medium text-[#667085]">Transcript will appear here</p>
                  <p className="mt-1 text-xs text-[#98A2B3]">Lines are captured as the call progresses</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {transcriptLines.map((line) => (
                    line.speaker === "system" ? (
                      <div key={line.id} className="flex items-center gap-2 py-1">
                        <div className="h-px flex-1 bg-[#E4E7EC]" />
                        <span className="flex-shrink-0 text-[11px] font-medium text-[#98A2B3]">{line.text}</span>
                        <div className="h-px flex-1 bg-[#E4E7EC]" />
                      </div>
                    ) : (
                      <div key={line.id} className={cn("flex flex-col gap-0.5", line.speaker === "agent" ? "items-end" : "items-start")}>
                        <div className="flex items-center gap-1.5">
                          <span className={cn("text-[10px] font-semibold uppercase tracking-wide", line.speaker === "agent" ? "text-[#166CCA]" : "text-[#667085]")}>
                            {line.speaker === "agent" ? "Jeff Comstock" : customerName}
                          </span>
                          <span className="text-[10px] text-[#98A2B3]">{formatElapsed(line.elapsed)}</span>
                        </div>
                        <div className={cn(
                          "max-w-[88%] rounded-xl px-3 py-2 text-[13px] leading-relaxed",
                          line.speaker === "agent" ? "bg-[#EBF4FD] text-[#1D2939]" : "bg-[#F9FAFB] border border-[#E4E7EC] text-[#344054]",
                        )}>
                          {line.text}
                        </div>
                      </div>
                    )
                  ))}
                  {isCallActive && transcriptLines.length < scriptLength && (
                    <div className="flex items-center gap-1.5 py-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#98A2B3] animate-bounce [animation-delay:0ms]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-[#98A2B3] animate-bounce [animation-delay:150ms]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-[#98A2B3] animate-bounce [animation-delay:300ms]" />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Resize handle */}
            <div
              className="absolute inset-y-0 left-0 w-1 cursor-col-resize"
              onMouseDown={(e) => {
                e.preventDefault();
                isResizingRef.current = true;
                resizeStartRef.current = { mouseX: e.clientX, width };
                document.body.style.userSelect = "none";
              }}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}

function DockedCopilotPanel({
  width,
  maxWidth,
  onClose,
  onWidthChange,
  onUndockStart,
}: {
  width: number;
  maxWidth: number;
  onClose: () => void;
  onWidthChange: (width: number) => void;
  onUndockStart: (event: React.MouseEvent<HTMLElement>) => void;
}) {
  const resizeStartRef = useRef({ mouseX: 0, width });
  const isResizingRef = useRef(false);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isResizingRef.current) return;

      const deltaX = event.clientX - resizeStartRef.current.mouseX;

      onWidthChange(
        Math.min(
          Math.max(320, resizeStartRef.current.width - deltaX),
          maxWidth,
        ),
      );
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
    };
  }, [maxWidth, onWidthChange]);

  return (
    <div
      className="relative ml-4 flex h-full min-h-0 min-w-[320px] flex-shrink-0 flex-col overflow-visible"
      style={{
        width,
        maxWidth: "calc(100vw - 2rem)",
      }}
    >
      <button
        type="button"
        aria-label="Resize docked NiCE Copilot panel"
        className="absolute inset-y-0 -left-2 z-10 hidden w-4 cursor-col-resize items-center justify-center min-[800px]:flex"
        onMouseDown={(event) => {
          event.preventDefault();
          isResizingRef.current = true;
          resizeStartRef.current = {
            mouseX: event.clientX,
            width,
          };
          document.body.style.userSelect = "none";
        }}
      >
        <span className="relative h-16 w-2 rounded-full border border-black/10 bg-white shadow-sm">
          <span className="absolute inset-y-3 left-1/2 w-px -translate-x-1/2 bg-black/15" />
        </span>
      </button>

      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-black/[0.16] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div
          className="flex min-h-[68px] cursor-grab items-center justify-between gap-3 border-b border-border bg-background/50 px-5 py-4 active:cursor-grabbing"
          onMouseDown={onUndockStart}
        >
          <div className="flex items-center gap-3">
            <GripHorizontal className="h-4 w-4 flex-shrink-0 text-[#7A7A7A]" />
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-[#333333]">NiCE Copilot</h3>
            </div>
          </div>
          <button
            type="button"
            onMouseDown={(event) => event.stopPropagation()}
            onClick={onClose}
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[#7A7A7A] transition-colors hover:bg-white dark:hover:bg-[#1C2536] hover:text-[#333333] dark:hover:text-[#CBD5E1]"
            aria-label="Close docked NiCE Copilot"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <CopilotContent />
      </div>
    </div>
  );
}

function DeskCanvasPopunder({
  visible,
  view,
  position,
  size,
  customerId,
  zIndex,
  onPositionChange,
  onSizeChange,
  onClose,
  onDock,
  dragActivation = null,
  onInteractStart,
}: {
  visible?: boolean;
  view: DeskCanvasView;
  position: DeskCanvasPopunderPosition;
  size: DeskCanvasPopunderSize;
  customerId: string;
  zIndex: number;
  onPositionChange: (position: DeskCanvasPopunderPosition) => void;
  onSizeChange: (size: DeskCanvasPopunderSize) => void;
  onClose: () => void;
  onDock?: () => void;
  dragActivation?: CopilotDragActivation | null;
  onInteractStart?: () => void;
}) {
  const [inlineCustomerId, setInlineCustomerId] = useState<string | null>(null);
  const [inlineAddOpen, setInlineAddOpen] = useState(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const resizeStartRef = useRef({ mouseX: 0, mouseY: 0, width: size.width, height: size.height });
  const isDraggingRef = useRef(false);
  const isResizingRef = useRef(false);
  const minWidth = getDeskCanvasPopunderMinWidth(view);

  // Derived: are we showing an inline overlay within the desk view?
  const isDeskView = view !== "copilot" && view !== "add" && view !== "customer" && view !== "notifications";
  const showingInlineAdd = isDeskView && inlineAddOpen && !inlineCustomerId;
  const showingInlineCustomer = isDeskView && !!inlineCustomerId && !inlineAddOpen;

  const panelLabel = view === "copilot"
    ? "AI Assistant"
    : view === "add"
      ? "Add"
      : view === "customer"
        ? "Customer Information"
        : showingInlineAdd
          ? "Add"
          : showingInlineCustomer
            ? "Customer Information"
            : "Directory";

  useEffect(() => {
    if (!dragActivation) return;

    isDraggingRef.current = true;
    dragOffsetRef.current = dragActivation.offset;
    document.body.style.userSelect = "none";
  }, [dragActivation]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (typeof window === "undefined") return;

      if (isDraggingRef.current) {
        const nextX = event.clientX - dragOffsetRef.current.x;
        const nextY = event.clientY - dragOffsetRef.current.y;

        onPositionChange({
          x: Math.min(
            Math.max(DESK_CANVAS_POPOUNDER_MARGIN, nextX),
            window.innerWidth - size.width - DESK_CANVAS_POPOUNDER_MARGIN,
          ),
          y: Math.min(
            Math.max(DESK_CANVAS_POPOUNDER_MARGIN, nextY),
            window.innerHeight - size.height - DESK_CANVAS_POPOUNDER_MARGIN,
          ),
        });
        return;
      }

      if (!isResizingRef.current) return;

      const deltaX = event.clientX - resizeStartRef.current.mouseX;
      const deltaY = event.clientY - resizeStartRef.current.mouseY;

      onSizeChange({
        width: Math.min(
          Math.max(minWidth, resizeStartRef.current.width + deltaX),
          window.innerWidth - position.x - DESK_CANVAS_POPOUNDER_MARGIN,
        ),
        height: Math.min(
          Math.max(DESK_CANVAS_POPOUNDER_MIN_HEIGHT, resizeStartRef.current.height + deltaY),
          window.innerHeight - position.y - DESK_CANVAS_POPOUNDER_MARGIN,
        ),
      });
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      isResizingRef.current = false;
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
    };
  }, [minWidth, onPositionChange, onSizeChange, position.x, position.y, size.height, size.width]);

  return (
    <div
      className={cn(
        "fixed flex min-h-[420px] flex-col overflow-hidden rounded-xl border border-black/10 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.18)] transition-[opacity,transform] duration-[280ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[opacity,transform]",
        visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-[0.97] translate-y-1",
      )}
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        minWidth,
        maxWidth: "calc(100vw - 2rem)",
        maxHeight: "calc(100vh - 2rem)",
        zIndex,
      }}
    >
      <div
        className="flex cursor-grab items-start justify-between gap-3 border-b border-border bg-background/50 px-5 py-4 active:cursor-grabbing"
        onMouseDown={(event) => {
          onInteractStart?.();
          isDraggingRef.current = true;
          dragOffsetRef.current = {
            x: event.clientX - position.x,
            y: event.clientY - position.y,
          };
          document.body.style.userSelect = "none";
        }}
      >
        <div className="flex items-start gap-3">
          <GripHorizontal className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#7A7A7A]" />
          {(showingInlineCustomer || showingInlineAdd) ? (
            <button
              type="button"
              onMouseDown={(event) => event.stopPropagation()}
              onClick={() => { setInlineCustomerId(null); setInlineAddOpen(false); }}
              className="flex items-center gap-1.5 rounded-lg text-sm font-semibold text-[#166CCA] transition-colors hover:text-[#0A5E92]"
              aria-label="Back to desk"
            >
              <ChevronLeft className="h-4 w-4 shrink-0" />
              {panelLabel}
            </button>
          ) : (
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-[#333333]">{panelLabel}</h3>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isDeskView && !showingInlineCustomer && !showingInlineAdd && (
            <button
              type="button"
              onMouseDown={(event) => event.stopPropagation()}
              onClick={() => setInlineAddOpen(true)}
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[#7A7A7A] transition-colors hover:bg-white dark:hover:bg-[#1C2536] hover:text-[#333333] dark:hover:text-[#CBD5E1]"
              aria-label="Add new"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onMouseDown={(event) => event.stopPropagation()}
            onClick={onClose}
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[#7A7A7A] transition-colors hover:bg-white dark:hover:bg-[#1C2536] hover:text-[#333333] dark:hover:text-[#CBD5E1]"
            aria-label={`Close ${panelLabel} popunder`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {view === "copilot"
          ? <CopilotContent />
          : view === "add"
            ? <AddPanelContent />
            : view === "customer"
              ? <NotesPanel key={customerId} customerId={customerId} />
              : showingInlineAdd
                ? <AddPanelContent />
                : showingInlineCustomer
                  ? <NotesPanel key={inlineCustomerId!} customerId={inlineCustomerId!} />
                  : <DirectoryPanel onSelectCustomer={(id) => { setInlineCustomerId(id); setInlineAddOpen(false); }} />}
      </div>

      <button
        type="button"
        aria-label={`Resize ${panelLabel} popunder`}
        className="absolute bottom-0 right-0 h-5 w-5 cursor-se-resize"
        onMouseDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
          isResizingRef.current = true;
          resizeStartRef.current = {
            mouseX: event.clientX,
            mouseY: event.clientY,
            width: size.width,
            height: size.height,
          };
          document.body.style.userSelect = "none";
        }}
      >
        <span className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-sm border-b-2 border-r-2 border-[#A1A1AA]" />
      </button>
    </div>
  );
}

function ConversationPopunder({
  visible,
  position,
  size,
  conversation,
  openChannels,
  activeChannel,
  customerRecordId,
  zIndex,
  onPositionChange,
  onSizeChange,
  onConversationChange,
  onSelectChannel,
  onOpenDeskPanel,
  onOpenCall,
  onOpenChannel,
  onOpenCustomerInfo,
  isCustomerInfoOpen = false,
  onConversationStatusChange,
  onResolveAssignment,
  overviewIsOpen,
  onOverviewOpenChange,
  isCallDisabled,
  onDock,
  dragActivation = null,
  onInteractStart,
}: {
  visible?: boolean;
  position: ConversationPopunderPosition;
  size: ConversationPopunderSize;
  conversation: SharedConversationData;
  openChannels: CustomerChannel[];
  activeChannel: CustomerChannel;
  customerRecordId: string;
  zIndex: number;
  onPositionChange: (position: ConversationPopunderPosition) => void;
  onSizeChange: (size: ConversationPopunderSize) => void;
  onConversationChange: (conversation: SharedConversationData, channel?: CustomerChannel) => void;
  onSelectChannel: (channel: CustomerChannel) => void;
  onOpenDeskPanel: (selection?: Exclude<DeskPanelSelection, null>) => void;
  onOpenCall: (anchorRect?: DOMRect | null) => void;
  onOpenChannel: (channel: Extract<CustomerChannel, "sms" | "email" | "whatsapp">) => void;
  onOpenCustomerInfo: (event?: React.MouseEvent<HTMLElement>) => void;
  isCustomerInfoOpen?: boolean;
  onConversationStatusChange: (status: ConversationStatus) => void;
  onResolveAssignment?: () => void;
  overviewIsOpen: boolean;
  onOverviewOpenChange: (open: boolean) => void;
  isCallDisabled: boolean;
  onDock?: () => void;
  dragActivation?: CopilotDragActivation | null;
  onInteractStart?: () => void;
}) {
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const resizeStartRef = useRef({ mouseX: 0, mouseY: 0, width: size.width, height: size.height });
  const isDraggingRef = useRef(false);
  const isResizingRef = useRef(false);
  const [isAiPanelVisible, setIsAiPanelVisible] = useState(false);
  const [popunderTab, setPopunderTab] = useState<"conversation" | "history">("conversation");
  // Fade transition for tab / channel switching inside the popunder.
  const popunderFadeKey = popunderTab === "history" ? "history" : activeChannel;
  const { deferredKey: popunderVisibleKey, opacity: popunderFadeOpacity, transition: popunderFadeTransition, visibility: popunderFadeVisibility } = useFadeTransition(popunderFadeKey);
  const shouldStackHeaderActions = size.width < 800;
  const isVeryNarrow = size.width < 640;

  useEffect(() => {
    if (!dragActivation) return;

    isDraggingRef.current = true;
    dragOffsetRef.current = dragActivation.offset;
    document.body.style.userSelect = "none";
  }, [dragActivation]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (isDraggingRef.current) {
        const nextX = event.clientX - dragOffsetRef.current.x;
        const nextY = event.clientY - dragOffsetRef.current.y;

        onPositionChange({
          x: Math.min(
            Math.max(CONVERSATION_POPOUNDER_MARGIN, nextX),
            window.innerWidth - size.width - CONVERSATION_POPOUNDER_MARGIN,
          ),
          y: Math.min(
            Math.max(CONVERSATION_POPOUNDER_MARGIN, nextY),
            window.innerHeight - size.height - CONVERSATION_POPOUNDER_MARGIN,
          ),
        });
        return;
      }

      if (!isResizingRef.current) return;

      const deltaX = event.clientX - resizeStartRef.current.mouseX;
      const deltaY = event.clientY - resizeStartRef.current.mouseY;

      onSizeChange({
        width: Math.min(
          Math.max(360, resizeStartRef.current.width + deltaX),
          window.innerWidth - position.x - CONVERSATION_POPOUNDER_MARGIN,
        ),
        height: Math.min(
          Math.max(420, resizeStartRef.current.height + deltaY),
          window.innerHeight - position.y - CONVERSATION_POPOUNDER_MARGIN,
        ),
      });
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      isResizingRef.current = false;
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
    };
  }, [onPositionChange, onSizeChange, position.x, position.y, size.height, size.width]);

  return (
    <div
      className={cn(
        "fixed flex min-h-[420px] min-w-[360px] flex-col overflow-hidden rounded-xl border border-black/10 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.18)] transition-[opacity,transform] duration-[280ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[opacity,transform]",
        visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-[0.97] translate-y-1",
      )}
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        maxWidth: "calc(100vw - 2rem)",
        maxHeight: "calc(100vh - 2rem)",
        zIndex,
      }}
    >
      <div
        className="flex cursor-grab flex-col border-b border-border px-5 py-4 gap-0 active:cursor-grabbing"
        onMouseDown={(event) => {
          onInteractStart?.();
          isDraggingRef.current = true;
          dragOffsetRef.current = {
            x: event.clientX - position.x,
            y: event.clientY - position.y,
          };
          document.body.style.userSelect = "none";
        }}
      >
        {/* Top row: drag handle · name · customer info · dock */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <GripHorizontal className="h-4 w-4 flex-shrink-0 text-[#7A7A7A]" />
            <CustomerProfilePopover customerRecordId={customerRecordId} customerName={conversation.customerName} />
            {/* Channel + history tabs */}
            <div className="inline-flex items-center gap-0.5 rounded-xl bg-[#F2F4F7] dark:bg-[#0D1525] px-1 py-1 border border-black/[0.08] dark:border-white/[0.08]">
              {([...openChannels, "history" as const]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={() => {
                    if (tab === "history") {
                      setPopunderTab("history");
                    } else {
                      onSelectChannel(tab as CustomerChannel);
                      setPopunderTab("conversation");
                    }
                  }}
                  className={cn(
                    "rounded-lg px-3 py-1 text-[12px] font-medium transition-all duration-150",
                    (tab === "history" ? popunderTab === "history" : tab === activeChannel && popunderTab === "conversation")
                      ? "bg-white dark:bg-[#1C2A3A] text-[#101828] dark:text-[#E2E8F0] shadow-sm"
                      : "text-[#667085] dark:text-[#8898AB] hover:text-[#333333] dark:hover:text-[#CBD5E1]",
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    {tab === "history" ? <Clock className="h-3 w-3" /> : tab === "voice" ? <Phone className="h-3 w-3" /> : tab === "email" ? <Mail className="h-3 w-3" /> : tab === "sms" ? <MessageSquare className="h-3 w-3" /> : tab === "whatsapp" ? <WhatsAppIcon className="h-3 w-3" /> : <MessageCircle className="h-3 w-3" />}
                    {tab === "history" ? "Customer History" : tab === "sms" ? "SMS" : tab === "whatsapp" ? "WhatsApp" : tab === "email" ? "Email" : tab === "voice" ? "Voice" : "Chat"}
                  </span>
                </button>
              ))}
              {/* + New Channel inside tab group */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    title="Add channel"
                    onMouseDown={(e) => e.stopPropagation()}
                    className="flex h-6 w-6 items-center justify-center rounded-lg text-[#667085] dark:text-[#8898AB] hover:bg-white dark:hover:bg-[#1C2A3A] hover:text-[#333333] dark:hover:text-[#CBD5E1] hover:shadow-sm transition-all duration-150"
                    aria-label="Add channel"
                  >
                    <Plus className="h-3.5 w-3.5 stroke-[2]" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 rounded-2xl border border-black/10 bg-white p-1 shadow-[0_18px_50px_rgba(15,23,42,0.14)]">
                  <DropdownMenuItem onMouseDown={(e) => e.stopPropagation()} onClick={(e) => { onOpenCall(e.currentTarget.getBoundingClientRect()); }} disabled={isCallDisabled} className="rounded-xl px-3 py-2 text-sm text-[#111827]">
                    <Phone className="mr-2 h-4 w-4" /> Call
                  </DropdownMenuItem>
                  <DropdownMenuItem onMouseDown={(e) => e.stopPropagation()} onClick={() => onOpenChannel("email")} className="rounded-xl px-3 py-2 text-sm text-[#111827]">
                    <Mail className="mr-2 h-4 w-4" /> Email
                  </DropdownMenuItem>
                  <DropdownMenuItem onMouseDown={(e) => e.stopPropagation()} onClick={() => onOpenChannel("sms")} className="rounded-xl px-3 py-2 text-sm text-[#111827]">
                    <MessageSquare className="mr-2 h-4 w-4" /> SMS
                  </DropdownMenuItem>
                  <DropdownMenuItem onMouseDown={(e) => e.stopPropagation()} onClick={() => onOpenChannel("whatsapp")} className="rounded-xl px-3 py-2 text-sm text-[#111827]">
                    <WhatsAppIcon className="mr-2 h-4 w-4" /> WhatsApp
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <CustomerInfoIconButton onOpenCustomerInfo={onOpenCustomerInfo} isCustomerInfoOpen={isCustomerInfoOpen} />
            {onDock && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onMouseDown={(event) => event.stopPropagation()}
                      onClick={onDock}
                      className="h-8 w-8 shrink-0 rounded-full border border-black/10 dark:border-border bg-white dark:bg-[#1C2A3A] text-[#333333] dark:text-[#CBD5E1] hover:bg-[#F8F8F9] dark:hover:bg-[#243041] hover:text-[#333333]"
                      aria-label="Dock panel"
                    >
                      <Pin className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Dock panel</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden flex flex-col" style={{ opacity: popunderFadeOpacity, transition: popunderFadeTransition, visibility: popunderFadeVisibility }}>
        {popunderVisibleKey === "history" ? (
          <CustomerHistoryTimeline historyItems={getCustomerRecord(customerRecordId)?.customerHistory ?? []} />
        ) : (
          <ConversationPanel
            key={popunderVisibleKey}
            conversation={conversation}
            openChannels={openChannels}
            activeChannel={popunderVisibleKey as CustomerChannel}
            customerId={customerRecordId}
            draftKey={`popunder-${conversation.label}-${conversation.customerName}`}
            onConversationChange={onConversationChange}
            onSelectChannel={onSelectChannel}
            onOpenDeskPanel={onOpenDeskPanel}
            onResolveAssignment={onResolveAssignment}
            showAiPanel={isAiPanelVisible}
            inlineFooter
          />
        )}
      </div>

      <button
        type="button"
        aria-label="Resize conversation popunder"
        className="absolute bottom-0 right-0 h-5 w-5 cursor-se-resize"
        onMouseDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
          isResizingRef.current = true;
          resizeStartRef.current = {
            mouseX: event.clientX,
            mouseY: event.clientY,
            width: size.width,
            height: size.height,
          };
          document.body.style.userSelect = "none";
        }}
      >
        <span className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-sm border-b-2 border-r-2 border-[#A1A1AA]" />
      </button>
    </div>
  );
}



function HeaderIconButton({
  children,
  onClick,
  ariaLabel,
  ariaExpanded,
  ariaControls,
  isActive = false,
  tooltip,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  ariaLabel?: string;
  ariaExpanded?: boolean;
  ariaControls?: string;
  isActive?: boolean;
  tooltip?: string;
}) {
  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        aria-expanded={ariaExpanded}
        aria-controls={ariaControls}
        aria-pressed={isActive}
        className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
          isActive
            ? "bg-[#166CCA]/10 text-[#166CCA] hover:bg-[#166CCA]/20"
            : "text-[#7A7A7A] hover:bg-[#F2F4F7] hover:text-[#333333]"
        }`}
      >
        {children}
      </button>
      {tooltip && (
        <div className="pointer-events-none absolute left-1/2 top-full z-[9999] mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-lg border border-[#E4E7EC] bg-white px-3 py-1.5 text-xs font-medium text-[#344054] opacity-0 shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-opacity duration-150 group-hover:opacity-100">
          {tooltip}
        </div>
      )}
    </div>
  );
}

function ActiveVoiceAssignmentControls({
  onOpenDisposition,
  customerInfo,
}: {
  onOpenDisposition: (anchorRect?: DOMRect | null) => void;
  customerInfo?: { name: string; customerId: string; preview: string };
}) {
  const [showTransfer, setShowTransfer] = useState(false);
  const transferBtnRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="mt-3 flex items-stretch gap-2">
      <Button
        ref={transferBtnRef}
        type="button"
        variant="outline"
        size="sm"
        onClick={(event) => { event.stopPropagation(); setShowTransfer(true); }}
        onMouseDown={(event) => event.stopPropagation()}
        className="h-auto flex-1 flex-col gap-1 border-black/10 px-2 py-2 text-[11px] text-[#333333]"
      >
        <ArrowRightLeft className="h-4 w-4" />
        Transfer
      </Button>
      {showTransfer && (
        <IncomingTransferPopover
          triggerRef={transferBtnRef}
          side="right"
          customerInfo={customerInfo}
          onClose={() => setShowTransfer(false)}
          onTransferred={(_destination) => { setShowTransfer(false); onOpenDisposition(); }}
        />
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        className="h-auto flex-1 flex-col gap-1 border-black/10 px-2 py-2 text-[11px] text-[#333333]"
      >
        <Pause className="h-4 w-4" />
        Hold
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={(event) => {
          event.stopPropagation();
          onOpenDisposition(event.currentTarget.getBoundingClientRect());
        }}
        onMouseDown={(event) => event.stopPropagation()}
        className="h-auto flex-1 flex-col gap-1 border-[#E32926]/20 px-2 py-2 text-[11px] text-[#E32926] hover:bg-[#FDEAEA] hover:text-[#E32926]"
      >
        <PhoneOff className="h-4 w-4" />
        End Call
      </Button>
    </div>
  );
}

function QueueAssignmentCard({
  item,
  status,
  onStatusChange,
  onRemove,
  onSelectAssignment,
  className,
  style,
}: {
  item: QueuePreviewItem;
  status: QueueAssignmentStatus;
  onStatusChange: (status: QueueAssignmentStatus) => void;
  onRemove: () => void;
  onSelectAssignment: (assignmentId: QueuePreviewItem["id"]) => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ItemIcon = item.icon;
  const canRemove = status !== "open" && status !== "escalated";
  const channelLabel = conversationChannelOptions.find((option) => option.channel === item.channel)?.label ?? item.channel;
  const { activeCallAssignmentId, isAgentInCall, openCallDisposition } = useLayoutContext();
  const showActiveVoiceControls = isAgentInCall && item.id === activeCallAssignmentId;

  const priorityKey = (item.priority ?? "medium").toLowerCase();
  const priorityBorderColors: Record<string, { idle: string; active: string; stripe: string; shadow: string }> = {
    critical: { idle: "#E53935", active: "#E32926", stripe: "#E32926", shadow: "rgba(240,68,56,0.14)" },
    high:     { idle: "#FECDA7", active: "#FFB800", stripe: "#FFB800", shadow: "rgba(247,144,9,0.14)" },
    medium:   { idle: "#BFDBFE", active: "#166CCA", stripe: "#166CCA", shadow: "rgba(22,108,202,0.14)" },
    low:      { idle: "#24943E", active: "#208337", stripe: "#208337", shadow: "rgba(54,157,63,0.14)" },
  };
  const pc = priorityBorderColors[priorityKey] ?? priorityBorderColors.medium;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelectAssignment(item.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelectAssignment(item.id);
        }
      }}
      className={cn(
        "group relative flex w-full items-start gap-3 overflow-hidden rounded-[8px] border bg-white px-4 py-4 text-left shadow-[0_6px_18px_rgba(15,23,42,0.08)] transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#166CCA]/30",
        !item.isActive && "hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(15,23,42,0.12)]",
        className,
      )}
      style={{
        ...style,
        borderColor: item.isActive ? pc.active : pc.idle,
        boxShadow: item.isActive ? `0 8px 22px ${pc.shadow}` : undefined,
      }}
    >
      {item.isActive ? <span className="absolute inset-y-0 left-0 w-1 rounded-l-[8px]" style={{ backgroundColor: pc.stripe }} /> : null}

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate text-[14px] font-semibold leading-5 text-[#333333]">{item.name}</span>
              <span className="inline-flex items-center rounded-full bg-[#F1F3F5] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#5B5B5B]">
                {channelLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-3 text-[12px] text-[#6B6B6B]">
          <span className="inline-flex items-center gap-1.5">
            <ItemIcon className="h-4 w-4 text-[#208337]" />
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {item.time}
          </span>
        </div>

        <div className="mt-2 text-[13px] leading-5 text-[#5B5B5B]">{item.preview}</div>
        {showActiveVoiceControls ? <ActiveVoiceAssignmentControls onOpenDisposition={openCallDisposition} customerInfo={{ name: item.name, customerId: item.customerId, preview: item.preview }} /> : null}
      </div>
    </div>
  );
}

// ─── Inline agent roster (for the Reject → Assign popover) ───────────────────

const inlineAgents = [
  { id: "a1", name: "Jeff Comstock",     initials: "JC", availability: "Available" as const, active: 2 },
  { id: "a2", name: "Priya Mehra",    initials: "PM", availability: "Available" as const, active: 1 },
  { id: "a3", name: "Sam Torres",     initials: "ST", availability: "Available" as const, active: 3 },
  { id: "a4", name: "Kenji Watanabe", initials: "KW", availability: "In a Call" as const, active: 4 },
  { id: "a5", name: "Amara Osei",     initials: "AO", availability: "Available" as const, active: 2 },
  { id: "a6", name: "Lena Fischer",   initials: "LF", availability: "Away"      as const, active: 1 },
];

const agentDot: Record<string, string> = {
  Available:  "bg-[#208337]",
  "In a Call": "bg-[#FFB800]",
  Away:       "bg-[#D0D5DD]",
};

const REJECT_REASONS = [
  "Not enough time",
  "Too many active cases",
  "Outside my skill set",
  "End of shift",
  "Requires supervisor review",
  "Duplicate case",
];

// ─── Add New Assignment two-step flow popover ─────────────────────────────────

type AddNewFlowStep = "channel" | "customer";
type AddNewFlowChannel = "voice" | "email" | "sms" | "whatsapp";

const ADD_NEW_CHANNEL_OPTIONS: Array<{ channel: AddNewFlowChannel; label: string; icon: React.ElementType }> = [
  { channel: "voice",    label: "Call",     icon: Phone },
  { channel: "email",    label: "Email",    icon: Mail },
  { channel: "sms",      label: "SMS",      icon: MessageSquare },
  { channel: "whatsapp", label: "WhatsApp", icon: WhatsAppIcon },
];

// ─── Connected Applications popover ──────────────────────────────────────────

type ConnectedApp = { name: string; latency: string; uptime: string; status: string };

const initialConnectedApps: ConnectedApp[] = [
  { name: "Salesforce",     latency: "42ms",  uptime: "99.9%", status: "healthy"  },
  { name: "ADP Workforce",  latency: "88ms",  uptime: "99.7%", status: "healthy"  },
  { name: "Outlook 365",    latency: "31ms",  uptime: "100%",  status: "healthy"  },
  { name: "MS Teams",       latency: "29ms",  uptime: "100%",  status: "healthy"  },
  { name: "Zendesk",        latency: "340ms", uptime: "97.2%", status: "degraded" },
  { name: "Jira Cloud",     latency: "67ms",  uptime: "99.8%", status: "healthy"  },
  { name: "Knowledge Base", latency: "12ms",  uptime: "100%",  status: "healthy"  },
  { name: "Desktop CTI",    latency: "8ms",   uptime: "100%",  status: "healthy"  },
];

// Keep a module-level snapshot so the header badge can read it without the popover being open
let connectedApps: ConnectedApp[] = initialConnectedApps;

const connectedAppIconLetters: Record<string, string> = {
  Salesforce: "S", "ADP Workforce": "A", "Outlook 365": "O",
  "MS Teams": "T", Zendesk: "Z", "Jira Cloud": "J",
  "Knowledge Base": "K", "Desktop CTI": "D",
};

// ── Inline toast ────────────────────────────────────────────────────────────

type AppToast = { id: number; message: string };
let _toastId = 0;

function AppToastContainer({ toasts, onDismiss }: { toasts: AppToast[]; onDismiss: (id: number) => void }) {
  // Newest toast sits on top of the rolodex stack (same physics as the notification card stack)
  const reversed = [...toasts].reverse();
  const STACK_PEEK   = 8;   // px each card peeks above the one in front
  const SCALE_STEP   = 0.04;
  const OPACITY_STEP = 0.28;

  return createPortal(
    <div
      className="fixed bottom-5 right-5 z-[99999] pointer-events-none"
      style={{ width: 400 }}
    >
      {reversed.map((t, i) => {
        const isTop      = i === 0;
        const translateY = isTop ? 0 : -(i * STACK_PEEK);
        const scale      = isTop ? 1 : Math.max(0.88, 1 - i * SCALE_STEP);
        const opacity    = isTop ? 1 : Math.max(0,    1 - i * OPACITY_STEP);
        return (
          <div
            key={t.id}
            className="absolute bottom-0 left-0 right-0"
            style={{
              transform: `translateY(${translateY}px) scale(${scale})`,
              transformOrigin: "bottom center",
              opacity,
              zIndex: toasts.length - i,
              transition: [
                `transform 320ms cubic-bezier(0.34,1.12,0.64,1)`,
                `opacity 200ms ease`,
              ].join(", "),
            }}
          >
            <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-border bg-white dark:bg-[#0F1629] px-4 py-3.5 shadow-[0_8px_32px_rgba(16,24,40,0.18)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.45)] animate-in slide-in-from-bottom-3 fade-in duration-300">
              <span className="h-2 w-2 shrink-0 rounded-full bg-[#208337]" />
              <span className="text-[13px] font-medium text-[#1D2939] dark:text-[#E2E8F0] flex-1">{t.message}</span>
              {isTop && (
                <button
                  onClick={() => onDismiss(t.id)}
                  className="ml-1 flex h-6 w-6 items-center justify-center rounded-full text-[#98A2B3] hover:bg-[#F2F4F7] dark:hover:bg-[#1C2536] hover:text-[#475467] dark:hover:text-[#CBD5E1] transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>,
    document.body,
  );
}

function ConnectedAppsPopover({
  anchorRef,
  onClose,
  onDegradedCountChange,
}: {
  anchorRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  onDegradedCountChange: (count: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const [apps, setApps] = useState<ConnectedApp[]>(initialConnectedApps);
  const [hoveredApp, setHoveredApp] = useState<string | null>(null);
  const [refreshingApp, setRefreshingApp] = useState<string | null>(null);
  const [toasts, setToasts] = useState<AppToast[]>([]);

  useEffect(() => {
    const rect = anchorRef.current?.getBoundingClientRect();
    if (rect) {
      setPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    }
  }, [anchorRef]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      // Exclude the anchor button — its own onClick handles the toggle
      if (
        ref.current && !ref.current.contains(target) &&
        anchorRef.current && !anchorRef.current.contains(target)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose, anchorRef]);

  const dismissToast = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const handleRefresh = (appName: string) => {
    if (refreshingApp) return;
    setRefreshingApp(appName);
    setTimeout(() => {
      setApps((prev) => {
        const next = prev.map((a) => a.name === appName ? { ...a, status: "healthy" } : a);
        connectedApps = next; // sync module-level snapshot
        onDegradedCountChange(next.filter((a) => a.status !== "healthy").length);
        return next;
      });
      setRefreshingApp(null);
      setHoveredApp(null);
      const id = ++_toastId;
      setToasts((prev) => [...prev, { id, message: `${appName} reconnected successfully` }]);
      setTimeout(() => dismissToast(id), 4000);
    }, 1800);
  };

  const healthyCount = apps.filter((a) => a.status === "healthy").length;

  return (
    <>
      {createPortal(
        <div
          ref={ref}
          className="fixed z-[9999] w-[272px] rounded-xl border border-border bg-white dark:bg-[#0F1629] shadow-[0_20px_50px_rgba(0,0,0,0.18)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.55)] overflow-hidden"
          style={{ top: pos.top, right: pos.right }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-semibold text-[#333333] dark:text-[#E2E8F0]">Connected Applications</p>
              <span className="text-[11px] text-[#98A2B3]">{healthyCount}/{apps.length} healthy</span>
            </div>
            <p className="text-[11px] text-[#98A2B3] mt-0.5">System health overview</p>
          </div>
          {/* App list */}
          <div className="max-h-[320px] overflow-y-auto divide-y divide-border">
            {apps.map((app) => {
              const isHovered = hoveredApp === app.name;
              const isRefreshing = refreshingApp === app.name;
              const isDegraded = app.status !== "healthy";
              return (
                <div
                  key={app.name}
                  className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[#F9FAFB] dark:hover:bg-[#1C2536]"
                  onMouseEnter={() => setHoveredApp(app.name)}
                  onMouseLeave={() => setHoveredApp(null)}
                >
                  <div className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg bg-[#F2F4F7] dark:bg-[#1C2A3A] text-[10px] font-bold text-[#475467] dark:text-[#94A3B8]">
                    {connectedAppIconLetters[app.name] ?? app.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-[#1D2939] dark:text-[#E2E8F0] truncate">{app.name}</p>
                    <p className={cn("text-[10px]", isRefreshing ? "text-[#F59E0B]" : "text-[#98A2B3]")}>
                      {isRefreshing ? "Reconnecting…" : `${app.latency} · ${app.uptime} uptime`}
                    </p>
                  </div>
                  {/* Status indicator / refresh button */}
                  <div className="shrink-0 flex h-6 w-6 items-center justify-center">
                    {(isHovered || isRefreshing) && isDegraded ? (
                      <button
                        onClick={() => handleRefresh(app.name)}
                        disabled={!!refreshingApp}
                        className="flex h-6 w-6 items-center justify-center rounded-full text-[#F59E0B] hover:bg-[#FEF3C7] dark:hover:bg-[#2A1E00] transition-colors disabled:cursor-not-allowed"
                        title="Reconnect"
                      >
                        <RefreshCw
                          className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")}
                        />
                      </button>
                    ) : (
                      <div className={cn(
                        "h-2 w-2 rounded-full",
                        app.status === "healthy" ? "bg-[#208337]" : "bg-[#F59E0B]",
                      )} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>,
        document.body,
      )}
      <AppToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}

/** Inline flyout submenu for the status dropdown — shows connected apps to the left on hover. */
function ConnectedAppsFlyout({
  isOpen,
  onOpen,
  onClose,
  degradedAppCount,
  onDegradedCountChange,
}: {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  degradedAppCount: number;
  onDegradedCountChange: (count: number) => void;
}) {
  const [apps, setApps] = useState<ConnectedApp[]>(initialConnectedApps);
  const [hoveredApp, setHoveredApp] = useState<string | null>(null);
  const [refreshingApp, setRefreshingApp] = useState<string | null>(null);
  const [toasts, setToasts] = useState<AppToast[]>([]);

  // Keep module-level snapshot in sync
  useEffect(() => { connectedApps = apps; }, [apps]);

  const dismissToast = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const handleRefresh = (appName: string) => {
    if (refreshingApp) return;
    setRefreshingApp(appName);
    setTimeout(() => {
      setApps((prev) => {
        const next = prev.map((a) => a.name === appName ? { ...a, status: "healthy" } : a);
        connectedApps = next;
        onDegradedCountChange(next.filter((a) => a.status !== "healthy").length);
        return next;
      });
      setRefreshingApp(null);
      setHoveredApp(null);
      const id = ++_toastId;
      setToasts((prev) => [...prev, { id, message: `${appName} reconnected successfully` }]);
      setTimeout(() => dismissToast(id), 4000);
    }, 1800);
  };

  const healthyCount = apps.filter((a) => a.status === "healthy").length;

  return (
    <>
      <div className="relative">
        <button
          type="button"
          onClick={() => isOpen ? onClose() : onOpen()}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-normal transition-colors duration-150",
            isOpen
              ? "bg-[#F2F4F7] text-[#333333] dark:bg-[#1C2536] dark:text-[#CBD5E1]"
              : "text-[#333333] dark:text-[#CBD5E1] hover:bg-[#F2F4F7] dark:hover:bg-[#1C2536]",
          )}
        >
          <Activity className="h-3.5 w-3.5 text-[#667085] dark:text-[#94A3B8]" />
          <span>Connected Apps</span>
          {degradedAppCount > 0 && (
            <span className="ml-auto mr-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#F59E0B] px-1 text-[10px] font-bold leading-none text-white">
              {degradedAppCount}
            </span>
          )}
          <ChevronLeft className={cn("h-3 w-3 text-[#98A2B3]", degradedAppCount > 0 ? "" : "ml-auto")} />
        </button>
        {/* Flyout panel — opens to the left */}
        {isOpen && (
          <div
            className="absolute right-full top-0 z-[9999] mr-2 w-[272px] rounded-xl border border-border bg-white dark:bg-[#0F1629] shadow-[0_20px_50px_rgba(0,0,0,0.18)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.55)] overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-border">
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-semibold text-[#333333] dark:text-[#E2E8F0]">Connected Applications</p>
                <span className="text-[11px] text-[#98A2B3]">{healthyCount}/{apps.length} healthy</span>
              </div>
              <p className="text-[11px] text-[#98A2B3] mt-0.5">System health overview</p>
            </div>
            {/* App list */}
            <div className="max-h-[320px] overflow-y-auto divide-y divide-border">
              {apps.map((app) => {
                const isHovered = hoveredApp === app.name;
                const isRefreshing = refreshingApp === app.name;
                const isDegraded = app.status !== "healthy";
                return (
                  <div
                    key={app.name}
                    className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[#F9FAFB] dark:hover:bg-[#1C2536]"
                    onMouseEnter={() => setHoveredApp(app.name)}
                    onMouseLeave={() => setHoveredApp(null)}
                  >
                    <div className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg bg-[#F2F4F7] dark:bg-[#1C2A3A] text-[10px] font-bold text-[#475467] dark:text-[#94A3B8]">
                      {connectedAppIconLetters[app.name] ?? app.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-[#1D2939] dark:text-[#E2E8F0] truncate">{app.name}</p>
                      <p className={cn("text-[10px]", isRefreshing ? "text-[#F59E0B]" : "text-[#98A2B3]")}>
                        {isRefreshing ? "Reconnecting…" : `${app.latency} · ${app.uptime} uptime`}
                      </p>
                    </div>
                    <div className="shrink-0 flex h-6 w-6 items-center justify-center">
                      {(isHovered || isRefreshing) && isDegraded ? (
                        <button
                          onClick={() => handleRefresh(app.name)}
                          disabled={!!refreshingApp}
                          className="flex h-6 w-6 items-center justify-center rounded-full text-[#F59E0B] hover:bg-[#FEF3C7] dark:hover:bg-[#2A1E00] transition-colors disabled:cursor-not-allowed"
                          title="Reconnect"
                        >
                          <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
                        </button>
                      ) : (
                        <div className={cn(
                          "h-2 w-2 rounded-full",
                          app.status === "healthy" ? "bg-[#208337]" : "bg-[#F59E0B]",
                        )} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <AppToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}

function AddNewAssignmentFlowPopover({
  anchorRect,
  onClose,
  onOpenCustomerConversation,
  onOpenCall,
}: {
  anchorRect: DOMRect;
  onClose: () => void;
  onOpenCustomerConversation: (customerRecordId: string, channel: "email" | "sms" | "whatsapp") => void;
  onOpenCall: (customerRecordId: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<AddNewFlowStep>("channel");
  const [selectedChannel, setSelectedChannel] = useState<AddNewFlowChannel | null>(null);
  const [search, setSearch] = useState("");

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  // Auto-focus search when reaching step 2
  useEffect(() => {
    if (step === "customer") {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [step]);

  const filteredCustomers = customerDatabase.filter((c) => {
    const q = search.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || c.customerId.toLowerCase().includes(q);
  });

  const POPOVER_WIDTH = 288;
  const estimatedHeight = step === "channel" ? 170 : 440;

  // Prefer opening to the right of the button (for rail buttons); fall back to smart vertical flip
  const margin = 8;
  const spaceRight = window.innerWidth - anchorRect.right - margin;
  const useRightSide = spaceRight >= POPOVER_WIDTH + margin;
  let posStyle: React.CSSProperties;
  if (useRightSide) {
    const top = Math.min(
      Math.max(margin, anchorRect.top),
      window.innerHeight - estimatedHeight - margin,
    );
    posStyle = { left: anchorRect.right + 8, top, width: POPOVER_WIDTH };
  } else {
    const { left, top, transform } = getSmartPopoverPositionFn(anchorRect, POPOVER_WIDTH, estimatedHeight);
    posStyle = { left, top, width: POPOVER_WIDTH, transform };
  }

  const handleChannelSelect = (ch: AddNewFlowChannel) => {
    setSelectedChannel(ch);
    setStep("customer");
    setSearch("");
  };

  const handleCustomerSelect = (customerRecordId: string) => {
    if (selectedChannel === "voice") {
      onOpenCall(customerRecordId);
    } else if (selectedChannel) {
      onOpenCustomerConversation(customerRecordId, selectedChannel);
    }
    onClose();
  };

  const channelLabel = ADD_NEW_CHANNEL_OPTIONS.find((o) => o.channel === selectedChannel)?.label ?? "";

  return createPortal(
    <div
      ref={ref}
      className="fixed z-[9999] flex flex-col rounded-xl border border-border bg-white shadow-[0_8px_28px_rgba(16,24,40,0.14)] overflow-hidden"
      style={posStyle}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-3">
        {step === "customer" && (
          <button
            type="button"
            onClick={() => { setStep("channel"); setSelectedChannel(null); }}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[#98A2B3] transition-colors hover:bg-[#F2F4F7] hover:text-[#344054]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
        )}
        <p className="flex-1 text-[12px] font-semibold text-[#333333]">
          {step === "channel" ? "New Case" : `${channelLabel} — Select Customer`}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[#98A2B3] transition-colors hover:bg-[#F2F4F7] hover:text-[#344054]"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {step === "channel" ? (
        /* Step 1: channel picker */
        <div className="py-1.5">
          {ADD_NEW_CHANNEL_OPTIONS.map(({ channel: ch, label, icon: Icon }) => (
            <button
              key={ch}
              type="button"
              onClick={() => handleChannelSelect(ch)}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[#F9FAFB]"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#F2F4F7] text-[#475467]">
                <Icon className="h-3.5 w-3.5" />
              </div>
              <span className="text-[13px] font-medium text-[#344054]">{label}</span>
            </button>
          ))}
        </div>
      ) : (
        /* Step 2: customer search + list */
        <>
          <div className="shrink-0 border-b border-border px-3 py-2.5">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-[#F9FAFB] px-3 py-1.5">
              <Search className="h-3.5 w-3.5 shrink-0 text-[#98A2B3]" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or ID…"
                className="flex-1 bg-transparent text-[12px] text-[#344054] placeholder:text-[#98A2B3] outline-none"
              />
              {search && (
                <button type="button" onClick={() => setSearch("")} className="text-[#98A2B3] hover:text-[#475467]">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border" style={{ maxHeight: 280 }}>
            {filteredCustomers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-[12px] text-[#98A2B3]">No customers found</p>
              </div>
            ) : (
              filteredCustomers.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => handleCustomerSelect(customer.id)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[#F9FAFB]"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EBF4FD] text-[11px] font-bold text-[#166CCA]">
                    {customer.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold text-[#1D2939] truncate">{customer.name}</p>
                    <p className="text-[11px] text-[#98A2B3]">{customer.customerId}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>,
    document.body,
  );
}

// ─── Smart popover positioning ───────────────────────────────────────────────
// (alias so AddNewAssignmentFlowPopover above can reference it before the real definition)
function getSmartPopoverPositionFn(
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

// ─── Smart popover positioning ───────────────────────────────────────────────
function getSmartPopoverPosition(
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

function AgentSelectPopover({
  triggerRect,
  onClose,
  onAssign,
}: {
  triggerRect: DOMRect;
  onClose: () => void;
  onAssign: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const POPOVER_WIDTH = 272;
  // 6 reasons × ~40px each + header ~49px = ~289px
  const ESTIMATED_HEIGHT = 289;
  const { left, top, maxHeight, transform } = getSmartPopoverPosition(triggerRect, POPOVER_WIDTH, ESTIMATED_HEIGHT);

  const handleSelect = (reason: string) => {
    setSelected(reason);
    setTimeout(() => { onAssign(); onClose(); }, 700);
  };

  return createPortal(
    <div
      ref={ref}
      className="fixed z-[9999] rounded-xl border border-border bg-white shadow-[0_8px_24px_rgba(16,24,40,0.14)] overflow-hidden"
      style={{ left, top, width: POPOVER_WIDTH, transform }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <p className="text-[12px] font-semibold text-[#333333]">Reason for Rejecting</p>
        <button type="button" onClick={onClose} className="text-[#98A2B3] hover:text-[#475467] transition-colors">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="divide-y divide-border overflow-y-auto" style={{ maxHeight: Math.min(240, maxHeight - 60) }}>
        {REJECT_REASONS.map((reason) => {
          const isSelected = selected === reason;
          const isDisabled = selected !== null && !isSelected;
          return (
            <button
              key={reason}
              type="button"
              disabled={isDisabled}
              onClick={() => handleSelect(reason)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors",
                isSelected ? "bg-[#FDEAEA] text-[#E32926]" : "hover:bg-[#F9FAFB] text-[#344054]",
                isDisabled && "opacity-40 cursor-not-allowed",
              )}
            >
              <span className="text-[12px] font-medium">{reason}</span>
              {isSelected && <span className="text-[10px] font-semibold text-[#E32926]">Selected</span>}
            </button>
          );
        })}
      </div>
    </div>,
    document.body,
  );
}

function GroupedQueueCard({
  group,
  queueStatuses,
  onStatusChange,
  onRemove,
  onRemoveAll,
  onCloseChannelKeepTask,
  taskSummaryIds,
  onSelectAssignment,
  onStatusDropdownOpenChange,
  className,
  style,
}: {
  group: GroupedQueueItem;
  queueStatuses: Record<string, QueueAssignmentStatus>;
  onStatusChange: (assignmentId: QueuePreviewItem["id"], status: QueueAssignmentStatus) => void;
  onRemove: (assignmentId: QueuePreviewItem["id"]) => void;
  onRemoveAll?: (assignmentIds: string[]) => void;
  onCloseChannelKeepTask?: (assignmentId: string) => void;
  taskSummaryIds?: Set<string>;
  onSelectAssignment: (assignmentId: QueuePreviewItem["id"]) => void;
  onStatusDropdownOpenChange?: (open: boolean) => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  const {
    isAgentInCall,
    openCallDisposition,
    activeCallAssignmentId,
    pendingAcceptanceIds,
    acceptPendingAssignment,
    rejectPendingAssignment,
    reviewPendingAssignment,
    activatedChannelIds,
    liveLastCustomerCommentByAssignmentId,
    historyOnlyAssignmentIds,
  } = useLayoutContext();

  // Task-level status — the case owns the status, not individual channels.
  // Use the highest-severity status across all channels so that opening a
  // new channel never silently downgrades an escalated case to "open".
  const statusSeverity: Record<string, number> = { escalated: 4, pending: 3, open: 2, resolved: 1, parked: 0 };
  const caseStatus: QueueAssignmentStatus = group.channels.length === 0 ? "open" : group.channels.reduce<QueueAssignmentStatus>((highest, ch) => {
    const chStatus = (queueStatuses[ch.id] ?? "open") as QueueAssignmentStatus;
    return (statusSeverity[chStatus] ?? 0) > (statusSeverity[highest] ?? 0) ? chStatus : highest;
  }, "parked");
  const handleGroupStatusChange = (newStatus: QueueAssignmentStatus) => {
    // Sync the new status to ALL channels so they stay in lockstep.
    group.channels.forEach((ch) => onStatusChange(ch.id, newStatus));
  };

  const priorityKey = (group.priority ?? "medium").toLowerCase();
  const priorityBorderColors: Record<string, { idle: string; active: string; stripe: string; shadow: string }> = {
    critical: { idle: "#E53935", active: "#E32926", stripe: "#E32926", shadow: "rgba(240,68,56,0.14)" },
    high:     { idle: "#FECDA7", active: "#FFB800", stripe: "#FFB800", shadow: "rgba(247,144,9,0.14)" },
    medium:   { idle: "#BFDBFE", active: "#166CCA", stripe: "#166CCA", shadow: "rgba(22,108,202,0.14)" },
    low:      { idle: "#24943E", active: "#208337", stripe: "#208337", shadow: "rgba(54,157,63,0.14)" },
  };
  const pc = priorityBorderColors[priorityKey] ?? priorityBorderColors.medium;

  // Which channel (if any) is awaiting the agent's action
  const pendingChannelId = group.channels.find((ch) => pendingAcceptanceIds.has(ch.id))?.id ?? null;

  // Reject popover state (per-card)
  const [showAgentPopover, setShowAgentPopover] = useState(false);
  const [agentPopoverRect, setAgentPopoverRect] = useState<DOMRect | null>(null);
  const rejectBtnRef = useRef<HTMLButtonElement>(null);

  return (
    <div
      className={cn(
        "group relative w-full overflow-hidden rounded-[8px] border bg-white shadow-[0_6px_18px_rgba(15,23,42,0.08)] transition-all duration-300",
        !group.isAnyActive && "hover:shadow-[0_10px_24px_rgba(15,23,42,0.12)]",
        className,
      )}
      style={{
        ...style,
        borderColor: group.isAnyActive ? pc.active : pc.idle,
        boxShadow: group.isAnyActive ? `0 8px 22px ${pc.shadow}` : undefined,
      }}
    >
      {group.isAnyActive && <span className="absolute inset-y-0 left-0 w-1 rounded-l-[8px]" style={{ backgroundColor: pc.stripe }} />}

      {/* Card header — name + task-level status + close */}
      <div className="px-4 pb-2 pt-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <span className="text-[14px] font-semibold leading-5 text-[#333333]">{group.name}</span>
            {(() => {
              const botLabel =
                group.lastActiveChannel.label ??
                group.channels.find(c => c.label)?.label ??
                queuePreviewItemsByCustomerRecordId[group.customerRecordId]?.label ??
                staticAssignments.find(s => s.customerRecordId === group.customerRecordId)?.botType;
              if (!botLabel) return null;
              const colors: Record<string, string> = {
                Aria:  "bg-[#EBF4FD] text-[#1260B0]",
                Jacob: "bg-[#EFFBF1] text-[#208337]",
                Emily: "bg-[#F5F3FF] text-[#7C3AED]",
              };
              const cls = colors[botLabel] ?? "bg-[#F2F4F7] text-[#475467]";
              return (
                <span className={cn("mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold", cls)}>
                  <Sparkles className="h-2.5 w-2.5 shrink-0" />
                  {botLabel}
                </span>
              );
            })()}
          </div>
          <div
            className="flex shrink-0 items-center gap-1"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <ConversationStatusDropdown
              status={caseStatus}
              onStatusChange={handleGroupStatusChange}
              onOpenChange={onStatusDropdownOpenChange}
            />
            <CaseMoreOptionsMenu
              onDismiss={() => {
                const allIds = group.channels.map((ch) => ch.id);
                if (onRemoveAll) {
                  onRemoveAll(allIds);
                } else {
                  allIds.forEach((id) => onRemove(id));
                }
              }}
              iconSize="sm"
              customerInfo={(() => {
                const isPlaceholder = (p: string) => p.startsWith("New ") || p === "Live call in progress.";
                const preview =
                  group.channels.find((ch) => !isPlaceholder(ch.preview))?.preview ??
                  queuePreviewItemsByCustomerRecordId[group.customerRecordId]?.preview ??
                  group.lastActiveChannel.preview ?? "";
                return { name: group.name, customerId: group.lastActiveChannel.customerId, preview };
              })()}
            />
          </div>
        </div>
        {/* Task description — task-level, shown once in the header.
            Use the first channel whose preview is a real task description (not a
            "New X…" / "Live call…" placeholder) so the description stays visible
            even when the agent switches to a freshly-launched channel.
            Also check the static queue data as a fallback for cases where all
            visible channels have placeholder previews (e.g. launched-call-only). */}
        {(() => {
          const isPlaceholder = (p: string) =>
            p.startsWith("New ") || p === "Live call in progress.";
          const taskPreview =
            group.channels.find((ch) => !isPlaceholder(ch.preview))?.preview ?? null;
          // Fallback: look up the static assignment data for the original case description
          const finalPreview = taskPreview
            ?? queuePreviewItemsByCustomerRecordId[group.customerRecordId]?.preview
            ?? null;
          return finalPreview ? (
            <p className="mt-1 line-clamp-2 text-[12px] leading-[1.45] text-[#444444] font-medium">
              {finalPreview}
            </p>
          ) : null;
        })()}
      </div>

      {/* Channel rows — omit rows that have been moved to task summary view or are in history-only mode */}
      {group.channels.filter((item) => !(taskSummaryIds?.has(item.id)) && !historyOnlyAssignmentIds.has(item.id)).map((item, index) => {
        const ItemIcon = item.icon;
        const channelLabel =
          conversationChannelOptions.find((o) => o.channel === item.channel)?.label ?? item.channel;
        const isChannelActive = item.isActive;
        const showActiveVoiceControls =
          isAgentInCall && item.id === activeCallAssignmentId;

        // Detect whether this is a freshly-launched channel (no prior messages)
        const isNewChannel =
          item.preview.startsWith("New ") || item.preview === "Live call in progress.";

        // Active voice call — always show "Live call in progress." regardless of the stored preview
        const isActiveVoiceCall = isAgentInCall && item.id === activeCallAssignmentId && item.channel === "voice";

        // Last customer comment: prefer the live conversation state (updated in real-time
        // as messages arrive), fall back to the static database snapshot, or null for voice
        // and channels with no history (omits the row entirely).
        const lastCustomerComment: string | null = isActiveVoiceCall
          ? "Live call in progress."
          : isNewChannel
            ? item.preview
            : (liveLastCustomerCommentByAssignmentId[item.id]
                ?? lastCustomerMessageByKey[`${item.customerRecordId}::${item.channel}`]
                ?? null);

        return (
          <div key={item.id}>
            {index > 0 && <div className="mx-4 border-t border-black/[0.06]" />}
            <div
              role="button"
              tabIndex={0}
              onClick={() => {
                onSelectAssignment(item.id);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectAssignment(item.id);
                }
              }}
              className={cn(
                "flex w-full cursor-pointer flex-col gap-1.5 px-4 py-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#166CCA]/30",
                isChannelActive ? "bg-[#EBF4FD]" : "hover:bg-[#F8F8F9]",
              )}
            >
              {/* Channel badge + timestamp + trash */}
              <div className="flex items-center gap-2">
                {/* Channel badge */}
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#F1F3F5] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#5B5B5B]">
                  <ItemIcon className="h-3 w-3 text-[#208337]" />
                  {channelLabel}
                </span>

                {/* Timestamp */}
                <span className="flex items-center gap-1 text-[11px] text-[#6B6B6B]">
                  <Clock className="h-3 w-3 shrink-0" />
                  {item.time}
                </span>

                {/* Trash — only shown for new channels where the agent hasn't sent anything yet */}
                {item.preview.startsWith("New ") && !activatedChannelIds.has(item.id) && (
                  <button
                    type="button"
                    aria-label={`Remove ${channelLabel} channel`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(item.id);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="ml-auto flex h-5 w-5 items-center justify-center rounded text-[#C0C5CE] transition-colors hover:bg-[#FDEAEA] hover:text-[#C71D1A]"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Last customer comment — omitted for voice and channels with no message history */}
              {lastCustomerComment !== null && (
                <div className="line-clamp-2 text-[12px] leading-[1.4] text-[#5B5B5B]">
                  {lastCustomerComment}
                </div>
              )}
              {showActiveVoiceControls ? (
                <ActiveVoiceAssignmentControls onOpenDisposition={openCallDisposition} customerInfo={{ name: group.name, customerId: item.customerId, preview: item.preview }} />
              ) : null}

              {/* Pending action buttons — Reject / Accept / Review */}
              {item.id === pendingChannelId && (
                <div
                  className="mt-1 flex items-center gap-1.5"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  {showAgentPopover && agentPopoverRect && (
                    <AgentSelectPopover
                      triggerRect={agentPopoverRect}
                      onClose={() => setShowAgentPopover(false)}
                      onAssign={() => rejectPendingAssignment(item.id)}
                    />
                  )}
                  <button
                    ref={rejectBtnRef}
                    type="button"
                    onClick={() => {
                      setAgentPopoverRect(rejectBtnRef.current?.getBoundingClientRect() ?? null);
                      setShowAgentPopover((v) => !v);
                    }}
                    className="flex-1 rounded-md border border-border bg-white py-1.5 text-[11px] font-semibold text-[#344054] hover:bg-[#F9FAFB] transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => acceptPendingAssignment(item.id)}
                    className="flex-1 rounded-md bg-[#166CCA] py-1.5 text-[11px] font-semibold text-white hover:bg-[#1260B0] transition-colors"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => reviewPendingAssignment(item.id)}
                    className="flex-1 rounded-md border border-[#166CCA] py-1.5 text-[11px] font-semibold text-[#166CCA] hover:bg-[#166CCA]/10 transition-colors"
                  >
                    Review
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function QueueOverlayList({
  groups,
  queueStatuses,
  onStatusChange,
  onRemove,
  onRemoveAll,
  onCloseChannelKeepTask,
  taskSummaryIds,
  isOpen,
  onSelectAssignment,
}: {
  groups: GroupedQueueItem[];
  queueStatuses: Record<string, QueueAssignmentStatus>;
  onStatusChange: (assignmentId: QueuePreviewItem["id"], status: QueueAssignmentStatus) => void;
  onRemove: (assignmentId: QueuePreviewItem["id"]) => void;
  onRemoveAll?: (assignmentIds: string[]) => void;
  onCloseChannelKeepTask: (assignmentId: string) => void;
  taskSummaryIds: Set<string>;
  isOpen: boolean;
  onSelectAssignment: (assignmentId: QueuePreviewItem["id"]) => void;
}) {
  return (
    <div className="space-y-3 bg-transparent p-3">
      {groups.map((group, index) => (
        <GroupedQueueCard
          key={group.customerRecordId}
          group={group}
          queueStatuses={queueStatuses}
          onStatusChange={onStatusChange}
          onRemove={onRemove}
          onRemoveAll={onRemoveAll}
          onCloseChannelKeepTask={onCloseChannelKeepTask}
          taskSummaryIds={taskSummaryIds}
          onSelectAssignment={onSelectAssignment}
          className={cn(isOpen ? "opacity-100" : "-translate-x-6 opacity-0")}
          style={{ transitionDelay: `${index * 35}ms` }}
        />
      ))}
    </div>
  );
}

// ── Shared roster data for the Transfer popover ───────────────────────────────
type NotifAgentAvailability = "Available" | "In a Call" | "Away" | "Offline";
type NotifAgent = { id: string; name: string; initials: string; availability: NotifAgentAvailability; skills: string[]; activeCount: number };

const notifAgentRoster: NotifAgent[] = [
  { id: "agent-1", name: "Jeff Comstock",   initials: "JC", availability: "Available",  skills: ["Billing", "Account Management", "Escalations"],        activeCount: 2 },
  { id: "agent-2", name: "Priya Mehra",     initials: "PM", availability: "Available",  skills: ["Technical Support", "API Integration", "Security"],    activeCount: 1 },
  { id: "agent-3", name: "Sam Torres",      initials: "ST", availability: "Available",  skills: ["Compliance", "Data Exports", "Contract Renewals"],     activeCount: 3 },
  { id: "agent-4", name: "Kenji Watanabe",  initials: "KW", availability: "In a Call", skills: ["Payments", "Fraud", "Wire Transfers"],                  activeCount: 4 },
  { id: "agent-5", name: "Amara Osei",      initials: "AO", availability: "Available",  skills: ["Enterprise Accounts", "Licensing", "Escalations"],     activeCount: 2 },
  { id: "agent-6", name: "Lena Fischer",    initials: "LF", availability: "Away",       skills: ["Billing", "Refunds", "Account Management"],            activeCount: 1 },
  { id: "agent-7", name: "Marcus Webb",     initials: "MW", availability: "Available",  skills: ["Security", "Identity Management", "SSO"],              activeCount: 2 },
  { id: "agent-8", name: "Chloe Nguyen",    initials: "CN", availability: "Offline",    skills: ["Technical Support", "Logistics", "Customs"],           activeCount: 0 },
];
type NotifBot = { id: string; name: string; icon: string; skills: string[]; activeCount: number };
const notifBotRoster: NotifBot[] = [
  { id: "bot-1", name: "Aria",          icon: "🤖", skills: ["FAQ", "Self-Service", "Account Lookup"],            activeCount: 24 },
  { id: "bot-2", name: "Billing Bot",   icon: "💳", skills: ["Invoices", "Payment Status", "Refunds"],            activeCount: 11 },
  { id: "bot-3", name: "Tech Assist",   icon: "🛠️", skills: ["Troubleshooting", "Diagnostics", "Reset Flows"],    activeCount: 8  },
  { id: "bot-4", name: "Security Bot",  icon: "🔒", skills: ["Identity Verification", "Access Resets", "MFA"],   activeCount: 6  },
];
const notifSupervisorRoster: NotifAgent[] = [
  { id: "sup-1", name: "Rachel Kim",    initials: "RK", availability: "Available",  skills: ["Escalations", "Enterprise Accounts", "Compliance"],  activeCount: 3 },
  { id: "sup-2", name: "David Okafor", initials: "DO", availability: "Available",  skills: ["Fraud", "Risk Management", "Wire Transfers"],         activeCount: 2 },
  { id: "sup-3", name: "Sandra Howell",initials: "SH", availability: "In a Call", skills: ["Billing", "Licensing", "Contract Renewals"],           activeCount: 4 },
  { id: "sup-4", name: "Tom Ellison",  initials: "TE", availability: "Away",       skills: ["Security", "Identity Management", "Escalations"],     activeCount: 1 },
];
const notifAvailabilityOrder: Record<NotifAgentAvailability, number> = { Available: 0, "In a Call": 1, Away: 2, Offline: 3 };
const notifAvailabilityDot: Record<NotifAgentAvailability, string> = {
  Available: "bg-[#208337]", "In a Call": "bg-[#FFB800]", Away: "bg-[#D0D5DD]", Offline: "bg-[#98A2B3]",
};

type NotifDepartment = { id: string; name: string; icon: string; queue: number; description: string };
const notifDepartmentRoster: NotifDepartment[] = [
  { id: "dept-1", name: "Billing & Payments",    icon: "💳", queue: 8,  description: "Invoices, refunds, payment issues" },
  { id: "dept-2", name: "Technical Support",     icon: "🛠️", queue: 12, description: "API, integrations, system errors" },
  { id: "dept-3", name: "Security & Compliance", icon: "🔒", queue: 5,  description: "Data breaches, access management" },
  { id: "dept-4", name: "Enterprise Accounts",   icon: "🏢", queue: 3,  description: "Licensing, contracts, renewals" },
  { id: "dept-5", name: "Fraud & Risk",          icon: "⚠️", queue: 6,  description: "Suspicious activity, wire transfers" },
];

// ── Transfer popover for incoming notification ────────────────────────────────
function IncomingTransferPopover({
  triggerRef,
  onClose,
  onTransferred,
  side = "left",
  customerInfo,
}: {
  triggerRef: React.RefObject<HTMLButtonElement>;
  onClose: () => void;
  onTransferred: (destination: string) => void;
  /** Which side of the trigger to open on. "left" (default) aligns right edge; "right" opens right of trigger; "bottom" appears below the card with a slight overlap. */
  side?: "left" | "right" | "bottom";
  customerInfo?: { name: string; customerId: string; preview: string };
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<"Favorites" | "Department" | "Agent" | "Supervisor">("Favorites");
  const [search, setSearch] = useState("");
  const [assigned, setAssigned] = useState<string | null>(null);
  const [pos, setPos] = useState<{ top?: number; bottom?: number; right?: number; left?: number }>({ bottom: 0, right: 0 });
  const [phase, setPhase] = useState<"select" | "handoff">("select");
  const [selectedDestination, setSelectedDestination] = useState<string>("");
  const [note, setNote] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem("transfer-favorites");
      return new Set(stored ? JSON.parse(stored) : []);
    } catch { return new Set<string>(); }
  });

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      try { localStorage.setItem("transfer-favorites", JSON.stringify([...next])); } catch { /* noop */ }
      return next;
    });
  };
  const [suggestionUsed, setSuggestionUsed] = useState(false);

  useEffect(() => {
    const triggerRect = triggerRef.current?.getBoundingClientRect();
    if (!triggerRect) return;

    if (side === "right") {
      // Anchor top edge to trigger top; open downward so card never clips above viewport
      setPos({ top: triggerRect.top, left: triggerRect.right + 8 });
    } else if (side === "bottom") {
      // Walk up the DOM from the trigger to find the card container (first ancestor ≥80px tall)
      let anchorEl: HTMLElement | null = triggerRef.current;
      while (anchorEl?.parentElement) {
        anchorEl = anchorEl.parentElement;
        if (anchorEl.getBoundingClientRect().height >= 80) break;
      }
      const cardRect = anchorEl?.getBoundingClientRect() ?? triggerRect;
      const OVERLAP = 10;
      const popoverWidth = 300; // select phase width
      const left = Math.max(8, Math.min(cardRect.right - popoverWidth, window.innerWidth - popoverWidth - 8));
      setPos({ top: cardRect.bottom - OVERLAP, left });
    } else {
      setPos({ bottom: window.innerHeight - triggerRect.top + 8, right: window.innerWidth - triggerRect.right });
    }
  }, [triggerRef, side]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  // Generate AI suggestion when entering handoff phase
  useEffect(() => {
    if (phase !== "handoff" || !customerInfo) return;
    setAiLoading(true);
    setAiSuggestion(null);
    setSuggestionUsed(false);
    const preview = customerInfo.preview ?? "";
    const name = customerInfo.name ?? "the customer";
    let suggestion = "";
    if (/fraud|unauthorized|transaction/i.test(preview)) {
      suggestion = `${name} is reporting 2 unauthorized transactions totaling $2,159. Account has been flagged, dispute process initiated. Customer verified identity and is distressed — requesting immediate specialist support to authorize dispute resolution and review account security.`;
    } else if (/router|connection|factory reset|port forward/i.test(preview)) {
      suggestion = `${name} is experiencing complete connectivity loss due to a port forwarding misconfiguration blocking the factory reset process. Basic troubleshooting exhausted. Escalating for advanced network configuration support.`;
    } else if (/wrong address|shipped|order/i.test(preview)) {
      suggestion = `${name}'s order was shipped to an incorrect address. Customer is requesting human intervention to reroute the shipment or issue a replacement. Order details have been pulled — ready for fulfillment team action.`;
    } else if (/callback|VP|freight|TMS|evaluating/i.test(preview)) {
      suggestion = `${name} is a VP of Operations at Nexus Freight evaluating a TMS replacement for a 200-person team. High-value inbound sales lead. Customer has specific questions about enterprise integrations and pricing — route to senior sales specialist.`;
    } else if (/live call/i.test(preview)) {
      suggestion = `${name} is currently on a live call. Transferring with full context. Please review call transcript for background before joining.`;
    } else {
      suggestion = `Transferring ${name} (${customerInfo.customerId}). Reason: ${preview || "customer-initiated contact"}. Please review prior interaction history before responding.`;
    }
    const t = setTimeout(() => {
      setAiSuggestion(suggestion);
      setNote(suggestion);
      setAiLoading(false);
    }, 800);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const handleAssignAgent = (agent: NotifAgent) => {
    setAssigned(agent.id);
    setSelectedDestination(agent.name);
    setPhase("handoff");
  };
  const handleAssignDept = (dept: NotifDepartment) => {
    setAssigned(dept.id);
    setSelectedDestination(dept.name);
    setPhase("handoff");
  };

  const agentRoster = tab === "Agent" ? notifAgentRoster : notifSupervisorRoster;
  const sortedAgents = [...agentRoster].sort((a, b) => notifAvailabilityOrder[a.availability] - notifAvailabilityOrder[b.availability]);

  return createPortal(
    <div
      ref={ref}
      className={cn(
        "fixed z-[999999] rounded-xl border border-border bg-white dark:bg-[#0F1629] shadow-[0_8px_24px_rgba(16,24,40,0.14)] overflow-hidden",
        phase === "handoff" ? "w-[340px]" : "w-[300px]",
      )}
      style={{
        ...(pos.top !== undefined ? { top: pos.top } : { bottom: pos.bottom }),
        ...(pos.left !== undefined ? { left: pos.left } : { right: pos.right }),
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {phase === "select" ? (
        <>
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <p className="text-[12px] font-semibold text-[#333333] dark:text-[#E2E8F0]">Transfer to</p>
            <button type="button" onClick={onClose} className="text-[#98A2B3] hover:text-[#475467] transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          {/* Tabs */}
          <div className="flex border-b border-border">
            {(["Favorites", "Department", "Agent", "Supervisor"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setTab(t); setAssigned(null); setSearch(""); }}
                className={cn("relative flex-1 py-2.5 text-[11px] font-medium transition-colors",
                  tab === t ? "text-[#166CCA]" : "text-[#667085] hover:text-[#344054]")}
              >
                {t === "Favorites" ? (
                  <span className="flex items-center justify-center gap-1">
                    <Star className={cn("h-3 w-3", favorites.size > 0 ? "fill-[#FFB800] text-[#FFB800]" : "")} />
                  </span>
                ) : t}
                {tab === t && <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full bg-[#166CCA]" />}
              </button>
            ))}
          </div>
          {/* Search */}
          <div className="px-3 py-2 border-b border-border">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-[#98A2B3]" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  tab === "Favorites" ? "Search favorites…"
                  : tab === "Department" ? "Search departments…"
                  : tab === "Agent" ? "Search agents…"
                  : "Search supervisors…"
                }
                className="w-full rounded-lg border border-black/10 bg-[#F8F8F9] py-1.5 pl-7 pr-3 text-[11px] text-[#1D2939] placeholder:text-[#98A2B3] focus:border-[#166CCA] focus:outline-none focus:ring-1 focus:ring-[#166CCA]"
              />
            </div>
          </div>

          <div className="max-h-[220px] overflow-y-auto divide-y divide-border">
            {tab === "Favorites" ? (
              favorites.size === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-8 px-4 text-center">
                  <Star className="h-6 w-6 text-[#D0D5DD]" />
                  <p className="text-[12px] font-medium text-[#667085]">No favorites yet</p>
                  <p className="text-[11px] text-[#98A2B3]">Star any department, agent, or supervisor to pin them here.</p>
                </div>
              ) : (
                (() => {
                  const q = search.trim().toLowerCase();
                  const favDepts = notifDepartmentRoster.filter((d) => favorites.has(d.id) && (!q || d.name.toLowerCase().includes(q) || d.description.toLowerCase().includes(q)));
                  const favAgents = notifAgentRoster.filter((a) => favorites.has(a.id) && (!q || a.name.toLowerCase().includes(q) || a.skills.join(" ").toLowerCase().includes(q)));
                  const favSups = notifSupervisorRoster.filter((s) => favorites.has(s.id) && (!q || s.name.toLowerCase().includes(q) || s.skills.join(" ").toLowerCase().includes(q)));
                  const hasResults = favDepts.length + favAgents.length + favSups.length > 0;
                  if (!hasResults) {
                    return (
                      <div className="flex flex-col items-center justify-center gap-1 py-8 px-4 text-center">
                        <p className="text-[12px] font-medium text-[#667085]">No results for "{search}"</p>
                      </div>
                    );
                  }
                  return (
                    <>
                      {favDepts.map((dept) => {
                        const isAssigned = assigned === dept.id;
                        return (
                          <div key={dept.id} className={cn("flex items-center gap-3 px-4 py-3 transition-colors", isAssigned ? "bg-[#EBF4FD]" : "hover:bg-[#F9FAFB]")}>
                            <button type="button" className="flex flex-1 items-center gap-3 text-left min-w-0" onClick={() => handleAssignDept(dept)}>
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EBF4FD] text-[15px]">{dept.icon}</div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-semibold text-[#1D2939] truncate">{dept.name}</p>
                                <p className="text-[10px] text-[#98A2B3] truncate">{dept.description}</p>
                              </div>
                              <span className="shrink-0 rounded-full bg-[#F2F4F7] px-1.5 py-0.5 text-[10px] font-semibold text-[#667085]">{dept.queue}</span>
                            </button>
                            <button type="button" onClick={(e) => toggleFavorite(dept.id, e)} className="shrink-0 p-1 text-[#FFB800] hover:text-[#D0A000] transition-colors">
                              <Star className="h-3.5 w-3.5 fill-current" />
                            </button>
                          </div>
                        );
                      })}
                      {favAgents.map((agent) => {
                        const isAssigned = assigned === agent.id;
                        const isDisabled = agent.availability === "Offline";
                        return (
                          <div key={agent.id} className={cn("flex items-center gap-3 px-4 py-3 transition-colors", isAssigned ? "bg-[#EBF4FD]" : "hover:bg-[#F9FAFB]", isDisabled && "opacity-40")}>
                            <button type="button" disabled={isDisabled} className="flex flex-1 items-center gap-3 text-left min-w-0" onClick={() => handleAssignAgent(agent)}>
                              <div className="relative shrink-0">
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F2F4F7] text-[10px] font-bold text-[#475467]">{agent.initials}</div>
                                <span className={cn("absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-white", notifAvailabilityDot[agent.availability])} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-semibold text-[#1D2939] truncate">{agent.name}</p>
                                <p className="text-[10px] text-[#98A2B3] truncate">{agent.skills.join(" · ")}</p>
                              </div>
                            </button>
                            <button type="button" onClick={(e) => toggleFavorite(agent.id, e)} className="shrink-0 p-1 text-[#FFB800] hover:text-[#D0A000] transition-colors">
                              <Star className="h-3.5 w-3.5 fill-current" />
                            </button>
                          </div>
                        );
                      })}
                      {favSups.map((sup) => {
                        const isAssigned = assigned === sup.id;
                        const isDisabled = sup.availability === "Offline";
                        return (
                          <div key={sup.id} className={cn("flex items-center gap-3 px-4 py-3 transition-colors", isAssigned ? "bg-[#EBF4FD]" : "hover:bg-[#F9FAFB]", isDisabled && "opacity-40")}>
                            <button type="button" disabled={isDisabled} className="flex flex-1 items-center gap-3 text-left min-w-0" onClick={() => handleAssignAgent(sup)}>
                              <div className="relative shrink-0">
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F2F4F7] text-[10px] font-bold text-[#475467]">{sup.initials}</div>
                                <span className={cn("absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-white", notifAvailabilityDot[sup.availability])} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-semibold text-[#1D2939] truncate">{sup.name}</p>
                                <p className="text-[10px] text-[#98A2B3] truncate">{sup.skills.join(" · ")}</p>
                              </div>
                            </button>
                            <button type="button" onClick={(e) => toggleFavorite(sup.id, e)} className="shrink-0 p-1 text-[#FFB800] hover:text-[#D0A000] transition-colors">
                              <Star className="h-3.5 w-3.5 fill-current" />
                            </button>
                          </div>
                        );
                      })}
                    </>
                  );
                })()
              )
            ) : tab === "Department" ? (
              (() => {
                const q = search.trim().toLowerCase();
                const filtered = notifDepartmentRoster.filter((d) => !q || d.name.toLowerCase().includes(q) || d.description.toLowerCase().includes(q));
                if (filtered.length === 0) return (
                  <div className="flex flex-col items-center justify-center gap-1 py-8 px-4 text-center">
                    <p className="text-[12px] font-medium text-[#667085]">No results for "{search}"</p>
                  </div>
                );
                return filtered.map((dept) => {
                const isAssigned = assigned === dept.id;
                const isFav = favorites.has(dept.id);
                return (
                  <div key={dept.id} className={cn("flex items-center gap-3 px-4 py-3 transition-colors", isAssigned ? "bg-[#EBF4FD]" : "hover:bg-[#F9FAFB]")}>
                    <button type="button" className="flex flex-1 items-center gap-3 text-left min-w-0" onClick={() => handleAssignDept(dept)}>
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EBF4FD] text-[15px]">{dept.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-[#1D2939] truncate">{dept.name}</p>
                        <p className="text-[10px] text-[#98A2B3] truncate">{dept.description}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-[#F2F4F7] px-1.5 py-0.5 text-[10px] font-semibold text-[#667085]">{dept.queue}</span>
                    </button>
                    <button type="button" onClick={(e) => toggleFavorite(dept.id, e)} className={cn("shrink-0 p-1 transition-colors", isFav ? "text-[#FFB800] hover:text-[#D0A000]" : "text-[#D0D5DD] hover:text-[#FFB800]")}>
                      <Star className={cn("h-3.5 w-3.5", isFav && "fill-current")} />
                    </button>
                  </div>
                );
              });
              })()
            ) : (
              (() => {
                const q = search.trim().toLowerCase();
                const filtered = sortedAgents.filter((a) => !q || a.name.toLowerCase().includes(q) || a.skills.join(" ").toLowerCase().includes(q));
                if (filtered.length === 0) return (
                  <div className="flex flex-col items-center justify-center gap-1 py-8 px-4 text-center">
                    <p className="text-[12px] font-medium text-[#667085]">No results for "{search}"</p>
                  </div>
                );
                return filtered.map((agent) => {
                const isAssigned = assigned === agent.id;
                const isDisabled = agent.availability === "Offline" || (assigned !== null && !isAssigned);
                const isFav = favorites.has(agent.id);
                return (
                  <div key={agent.id} className={cn("flex items-center gap-3 px-4 py-3 transition-colors", isAssigned ? "bg-[#EBF4FD] dark:bg-[#0C2A4A]" : "hover:bg-[#F9FAFB] dark:hover:bg-[#1C2536]", isDisabled && "opacity-40")}>
                    <button type="button" disabled={isDisabled} className="flex flex-1 items-center gap-3 text-left min-w-0" onClick={() => handleAssignAgent(agent)}>
                      <div className="relative shrink-0">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F2F4F7] dark:bg-[#1C2A3A] text-[10px] font-bold text-[#475467] dark:text-[#94A3B8]">{agent.initials}</div>
                        <span className={cn("absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-white dark:border-[#0F1629]", notifAvailabilityDot[agent.availability])} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-[#1D2939] dark:text-[#E2E8F0] truncate">{agent.name}</p>
                        <p className="text-[10px] text-[#98A2B3] truncate">{agent.skills.join(" · ")}</p>
                      </div>
                      <span className="shrink-0 text-[10px] text-[#667085]">{agent.activeCount}</span>
                    </button>
                    <button type="button" onClick={(e) => toggleFavorite(agent.id, e)} className={cn("shrink-0 p-1 transition-colors", isFav ? "text-[#FFB800] hover:text-[#D0A000]" : "text-[#D0D5DD] hover:text-[#FFB800]")}>
                      <Star className={cn("h-3.5 w-3.5", isFav && "fill-current")} />
                    </button>
                  </div>
                );
              });
              })()
            )}
          </div>
        </>
      ) : (
        <>
          {/* Handoff card header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { setPhase("select"); setAssigned(null); setNote(""); }}
                className="text-[#98A2B3] hover:text-[#475467] transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <p className="text-[12px] font-semibold text-[#333333]">Handoff to {selectedDestination}</p>
            </div>
            <button type="button" onClick={onClose} className="text-[#98A2B3] hover:text-[#475467] transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="px-4 py-4 space-y-4">
            {/* Customer info */}
            <div className="rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-3 space-y-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#98A2B3]">Customer</p>
                <p className="mt-0.5 text-[13px] font-semibold text-[#1D2939]">{customerInfo?.name ?? "—"}</p>
                <p className="text-[11px] text-[#667085]">{customerInfo?.customerId ?? ""}</p>
              </div>
              {customerInfo?.preview && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[#98A2B3]">Reason for contacting</p>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-[#344054]">{customerInfo.preview}</p>
                </div>
              )}
            </div>

            {/* Note field */}
            <div>
              <div className="flex items-center gap-1.5">
                <label className="text-[11px] font-semibold text-[#344054]">
                  Handoff note <span className="text-[#E32926]">*</span>
                </label>
                {aiLoading && <span className="flex items-center gap-1 text-[10px] text-[#166CCA]"><Sparkles className="h-3 w-3 animate-pulse" />Generating…</span>}
                {!aiLoading && aiSuggestion && <span className="flex items-center gap-1 text-[10px] text-[#166CCA]"><Sparkles className="h-3 w-3" />AI drafted</span>}
              </div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={aiLoading ? "Generating AI summary…" : "Add context for the receiving agent…"}
                rows={3}
                className="mt-1.5 w-full resize-none rounded-lg border border-[#D0D5DD] bg-white px-3 py-2 text-[12px] leading-relaxed text-[#1D2939] placeholder:text-[#98A2B3] focus:border-[#166CCA] focus:outline-none focus:ring-1 focus:ring-[#166CCA]"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => { setPhase("select"); setAssigned(null); setNote(""); }}
                className="flex-1 rounded-lg border border-[#D0D5DD] px-3 py-2 text-[12px] font-medium text-[#344054] hover:bg-[#F9FAFB] transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                disabled={note.trim().length === 0}
                onClick={() => { onTransferred(selectedDestination); onClose(); }}
                className="flex-1 rounded-lg bg-[#166CCA] px-3 py-2 text-[12px] font-semibold text-white hover:bg-[#1260B0] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Complete Transfer
              </button>
            </div>
          </div>
        </>
      )}
    </div>,
    document.body,
  );
}

// ─── Dismissal confirmation toast ─────────────────────────────────────────────
function DismissalToast({
  data,
  onClose,
}: {
  data: { customerName: string; customerId: string; status: string; resolvedStatus: string; actions: string[]; preview: string; botType: string; channel: string };
  onClose: () => void;
}) {
  // Entrance animation — starts off-screen, flips to visible on next paint
  const [entered, setEntered] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Auto-dismiss timer — stored in a ref so we can cancel it when details are opened
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerCancelledRef = useRef(false);

  useEffect(() => {
    // Trigger entrance on next paint
    const raf = requestAnimationFrame(() => setEntered(true));
    // Auto-dismiss after 12 s
    timerRef.current = setTimeout(() => handleClose(), 12000);
    return () => {
      cancelAnimationFrame(raf);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleClose() {
    setExiting(true);
    setTimeout(onClose, 300);
  }

  function handleToggleDetails() {
    const opening = !detailsOpen;
    setDetailsOpen(opening);
    // Cancel the auto-dismiss timer the first time the agent opens the accordion
    if (opening && !timerCancelledRef.current) {
      timerCancelledRef.current = true;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
  }

  // Derive external system mock data from case context
  const isShipping = data.customerId.startsWith("CST-133") || data.actions.some(a => /order|ship|address/i.test(a));
  const isFraud = data.actions.some(a => /fraud|dispute|transaction|unauthorized/i.test(a));
  const caseType = isFraud ? "Fraud Investigation" : isShipping ? "Order Issue" : "Technical Support";
  const sfCaseNum = `CS-${Math.abs(data.customerId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 90000 + 10000)}`;
  const snIncidentNum = `INC${String(Math.abs(data.customerId.split("").reduce((acc, c) => acc + c.charCodeAt(0) * 7, 0) % 9000000 + 1000000)).padStart(7, "0")}`;
  const timestamp = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

  const sfUpdates = [
    `Case Status → ${data.resolvedStatus}`,
    `Case Type → ${caseType}`,
    `Case Owner → Unassigned`,
    `Resolution Date → ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
    `Contact Record → Updated`,
  ];
  const snUpdates = [
    `State → ${data.resolvedStatus === "Resolved" ? "Resolved" : "Closed"}`,
    `Assignment Group → Cleared`,
    `Close Code → ${isFraud ? "Fraud Confirmed" : isShipping ? "Fulfillment Error" : "Resolved by AI"}`,
    `Work Notes → Case summary appended`,
    `SLA Status → Met`,
  ];

  const isVisible = entered && !exiting;

  return createPortal(
    <div
      className="fixed bottom-5 right-5 z-[10100] w-[380px]"
      style={{
        transform: isVisible ? "translateY(0)" : "translateY(calc(100% + 20px))",
        opacity: isVisible ? 1 : 0,
        transition: "transform 350ms cubic-bezier(0.34,1.56,0.64,1), opacity 300ms ease-out",
      }}
    >
      <div className="rounded-2xl border border-[#E4E7EC] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.18)] overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 bg-[#EFFBF1] border-b border-[#BBF7D0] px-4 py-3">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-[#208337] shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] font-semibold text-[#111827]">
                {data.status === "transferred" ? "Case Transferred" : data.status === "unassigned" ? "Case Dismissed & Unassigned" : "Case Dismissed"}
              </p>
              <p className="text-[11px] text-[#667085]">{data.customerName} · {data.customerId} · {timestamp}</p>
            </div>
          </div>
          <button type="button" onClick={handleClose} className="shrink-0 text-[#98A2B3] hover:text-[#344054] transition-colors mt-0.5">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Status pill — always visible */}
        <div className="flex items-center gap-2 border-b border-[#F2F4F7] bg-[#F9FAFB] px-4 py-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[#667085]">Status</span>
          <span className="ml-auto inline-flex items-center gap-1.5">
            <span className={cn(
              "h-1.5 w-1.5 rounded-full",
              data.resolvedStatus === "Resolved" ? "bg-[#208337]" : data.resolvedStatus === "Pending" ? "bg-[#FFB800]" : "bg-[#E32926]",
            )} />
            <span className={cn(
              "text-[12px] font-semibold",
              data.resolvedStatus === "Resolved" ? "text-[#208337]" : data.resolvedStatus === "Pending" ? "text-[#A37A00]" : "text-[#C71D1A]",
            )}>{data.resolvedStatus}</span>
          </span>
        </div>

        {/* Accordion toggle */}
        <button
          type="button"
          onClick={handleToggleDetails}
          className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-[#F9FAFB] transition-colors"
        >
          <span className="text-[12px] font-semibold text-[#344054]">Case Details</span>
          <span className="flex items-center gap-1.5 text-[11px] text-[#667085]">
            {timerCancelledRef.current ? null : <span className="text-[10px] text-[#98A2B3]">auto-closes in 12s</span>}
            <svg
              className={cn("h-3.5 w-3.5 text-[#98A2B3] transition-transform duration-200", detailsOpen && "rotate-180")}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </button>

        {/* Accordion body — CSS grid trick: 0fr → 1fr animates height without measuring */}
        <div
          style={{
            display: "grid",
            gridTemplateRows: detailsOpen ? "1fr" : "0fr",
            transition: "grid-template-rows 280ms cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          <div style={{ overflow: "hidden" }}>
            <div className="border-t border-[#F2F4F7] px-4 pb-3 space-y-3 max-h-[420px] overflow-y-auto">
              {/* Case summary */}
              <div className="pt-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#667085] mb-1.5">Case Summary</p>
                <p className="text-[12px] text-[#344054] leading-relaxed">{data.preview}</p>
              </div>

              {/* What changed */}
              {data.actions.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#667085] mb-1.5">Changes Made</p>
                  <ul className="space-y-1">
                    {data.actions.slice(0, 4).map((action, i) => (
                      <li key={i} className="flex items-start gap-2 text-[12px] text-[#344054] leading-relaxed">
                        <Check className="h-3 w-3 text-[#208337] shrink-0 mt-1" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Salesforce */}
              <div className="rounded-xl border border-[#E4E7EC] overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 bg-[#F9FAFB] border-b border-[#E4E7EC]">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-3 w-3 text-[#00A1E0]" />
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[#00A1E0]">Salesforce</span>
                  </div>
                  <span className="text-[10px] text-[#98A2B3] font-medium">{sfCaseNum}</span>
                </div>
                <ul className="px-3 py-2 space-y-1">
                  {sfUpdates.map((u, i) => (
                    <li key={i} className="flex items-center gap-2 text-[11px] text-[#344054]">
                      <ExternalLink className="h-2.5 w-2.5 text-[#98A2B3] shrink-0" />
                      {u}
                    </li>
                  ))}
                </ul>
              </div>

              {/* ServiceNow */}
              <div className="rounded-xl border border-[#E4E7EC] overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 bg-[#F9FAFB] border-b border-[#E4E7EC]">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-3 w-3 text-[#81B5A1]" />
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[#4A9E7F]">ServiceNow</span>
                  </div>
                  <span className="text-[10px] text-[#98A2B3] font-medium">{snIncidentNum}</span>
                </div>
                <ul className="px-3 py-2 space-y-1">
                  {snUpdates.map((u, i) => (
                    <li key={i} className="flex items-center gap-2 text-[11px] text-[#344054]">
                      <ExternalLink className="h-2.5 w-2.5 text-[#98A2B3] shrink-0" />
                      {u}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-[#F2F4F7] bg-[#F9FAFB]">
          <p className="text-[10px] text-[#98A2B3] text-center">All external systems updated · Changes may take up to 60 seconds to sync</p>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ─── Escalation live timer ────────────────────────────────────────────────────
function EscalationTimer({ customerId }: { customerId?: string }) {
  const startRef = useRef(customerId ? getEscalationStart(customerId) : Date.now());
  const [elapsed, setElapsed] = useState(() => Math.floor((Date.now() - startRef.current) / 1000));
  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, []);
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");
  const chip = elapsed >= 60
    ? "border-[#E32926] text-[#E32926]"
    : elapsed >= 30
    ? "border-[#FFB800] text-[#FFB800]"
    : "border-[#98A2B3] text-[#98A2B3]";
  return <span className={`rounded border bg-white px-1.5 py-0.5 text-[10px] font-semibold leading-none tabular-nums ${chip}`}>{mm}:{ss}</span>;
}

// ── Persistent incoming-assignment notification (bottom-right) ───────────────
function IncomingAssignmentCard({
  item,
  onMonitor,
  onTakeover,
  onTransfer,
  onDismiss,
  onApprove,
  onApproveResolved,
  onDismissResolved,
  onLaunchCall,
  onReviewLead,
  isLaunching = false,
  isInline = false,
  dismissDirection = "down",
  inlinePanelHeight = 0,
  inlineHeaderOffset = 0,
  dismissTrigger = 0,
}: {
  item: QueuePreviewItem;
  onMonitor: (item: QueuePreviewItem) => void;
  onTakeover: (item: QueuePreviewItem) => void;
  onTransfer: (item: QueuePreviewItem) => void;
  onDismiss: (item: QueuePreviewItem) => void;
  onApprove?: (item: QueuePreviewItem) => void;
  onApproveResolved?: (item: QueuePreviewItem) => void;
  /** Called when the agent clicks Dismiss on the resolved-state card — used to fire the confirmation toast. */
  onDismissResolved?: (item: QueuePreviewItem) => void;
  /** Called when the agent clicks Launch Call on a lead card — opens the call popunder. */
  onLaunchCall?: (item: QueuePreviewItem) => void;
  /** Called when the agent clicks Review on a lead card — opens the case in history-only mode. */
  onReviewLead?: (item: QueuePreviewItem) => void;
  /** When true, the lead card shows a "Connecting call…" state and hides the Launch Call button. */
  isLaunching?: boolean;
  /** When true, suppresses auto-minimize timer. Use for the active-case top-left overlay. */
  isInline?: boolean;
  /** Direction the card slides when dismissed. Defaults to "down" (bottom-right stack behaviour). */
  dismissDirection?: "down" | "left";
  /** Measured height of the panel container. Used to cap the inline scroll area so the card
   *  never overflows the conversation panel. 0 = unconstrained (falls back to viewport calc). */
  inlinePanelHeight?: number;
  /** Distance (px) from panel top to header bottom. Combined with inlinePanelHeight to compute
   *  the exact scroll area budget so the card stays within the panel. */
  inlineHeaderOffset?: number;
  /** Increment this to programmatically trigger the dismiss animation (e.g. when the summary
   *  panel toggle is clicked while the toast is visible). */
  dismissTrigger?: number;
}) {
  const [summaryOpen, setSummaryOpen] = useState(item.statusLabel === "transferred");
  const [approvePhase, setApprovePhase] = useState<"idle" | "approving" | "resolved">("idle");
  const [resolvedToastStatus, setResolvedToastStatus] = useState("Resolved");
  const [resolvedStatusOpen, setResolvedStatusOpen] = useState(false);
  const approveToastTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [showTransfer, setShowTransfer] = useState(false);
  const [isAttemptedResolutionOpen, setIsAttemptedResolutionOpen] = useState(false);
  // Open customer profile by default when the case has been taken over (transferred state)
  const [isToastProfileOpen, setIsToastProfileOpen] = useState(item.statusLabel === "transferred");
  const transferBtnRef = useRef<HTMLButtonElement>(null);
  const [copilotQuery, setCopilotQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [copilotPhase, setCopilotPhase] = useState<"idle" | "thinking" | "done">("idle");
  const [copilotReasoningVisible, setCopilotReasoningVisible] = useState(0);
  const [isCopilotOpen, setIsCopilotOpen] = useState(true);
  const [isReasoningOpen, setIsReasoningOpen] = useState(false);
  const copilotTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);
  /** Timer that auto-collapses the case summary accordion after takeover. Cancelled on user interaction. */
  const autoMinimizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Timer that auto-dismisses the inline top-left toast after 15 s of inactivity. */
  const autoIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Cancel the idle-dismiss timer — called whenever the agent opens an accordion. */
  const cancelIdleTimer = useCallback(() => {
    if (autoIdleTimerRef.current !== null) {
      clearTimeout(autoIdleTimerRef.current);
      autoIdleTimerRef.current = null;
    }
  }, []);

  /**
   * Smoothly slides the card down and fades it out by writing directly to the DOM element,
   * then calls onDismiss once the transition has finished.
   * Writing styles directly (rather than via React state) avoids any re-render that would
   * restart or conflict with the existing entry animation.
   */
  const handleDismiss = useCallback(() => {
    const el = cardRef.current;
    if (!el) { onDismiss(item); return; }
    el.style.transition = "opacity 200ms ease-in, transform 200ms ease-in";
    el.style.opacity = "0";
    el.style.transform = dismissDirection === "left" ? "translateX(-32px)" : "translateY(20px)";
    setTimeout(() => onDismiss(item), 210);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onDismiss, item.id, dismissDirection]);

  // Programmatic dismiss — e.g. summary panel toggle opens while toast is visible.
  // Skips the initial render (dismissTrigger=0).
  useEffect(() => {
    if (dismissTrigger > 0) handleDismiss();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dismissTrigger]);

  // Cleanup approve timers on unmount
  useEffect(() => () => { approveToastTimersRef.current.forEach(clearTimeout); }, []);

  // Auto-collapse (not dismiss) the case summary 10 s after takeover.
  // Cancelled if the agent interacts with any interior accordion.
  // Disabled for the inline top-left overlay — agent controls it manually there.
  useEffect(() => {
    if (item.statusLabel !== "transferred") return;
    if (isInline) return;
    const t = setTimeout(() => {
      setSummaryOpen(false);
      autoMinimizeTimerRef.current = null;
    }, 10_000);
    autoMinimizeTimerRef.current = t;
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.statusLabel, isInline]);

  // Inline cards persist until the agent takes action — no auto-dismiss timer.

  const REASONING_STEPS = [
    "Reviewing case history and prior customer interactions...",
    "Analyzing attempted resolutions and their outcomes...",
    "Cross-referencing similar resolved cases in the knowledge base...",
    "Synthesizing recommended next steps and action items...",
  ];

  function handleCopilotSubmit() {
    if (!copilotQuery.trim()) return;
    copilotTimersRef.current.forEach(clearTimeout);
    copilotTimersRef.current = [];
    setSubmittedQuery(copilotQuery);
    setCopilotQuery("");
    setCopilotPhase("thinking");
    setCopilotReasoningVisible(0);
    setIsCopilotOpen(true);
    setIsReasoningOpen(false);
    REASONING_STEPS.forEach((_, i) => {
      const t = setTimeout(() => setCopilotReasoningVisible(i + 1), 1000 + i * 600);
      copilotTimersRef.current.push(t);
    });
    const doneTimer = setTimeout(() => setCopilotPhase("done"), 1000 + REASONING_STEPS.length * 600 + 600);
    copilotTimersRef.current.push(doneTimer);
  }

  const ChannelIcon = launchedAssignmentIconMap[item.channel] ?? MessageSquare;
  const channelLabel = conversationChannelOptions.find((o) => o.channel === item.channel)?.label ?? item.channel;

  const assignmentEntry = getCustomerAssignmentEntry(item.name);
  const staticAssignment = staticAssignments.find(
    (s) => s.customerRecordId === item.customerRecordId || s.customerId === item.customerId
  );
  const aiOverview = staticAssignment?.aiOverview ?? getTaskAiOverview(item.customerRecordId, item.name, item.channel);
  const customerContext = staticAssignment?.customerContext;

  // ── Lead Intelligence Card — rendered for Sales Lead notifications ──────────
  if (item.statusLabel === "lead" && item.leadIntelligence) {
    const li = item.leadIntelligence;
    return (
      <div
        ref={cardRef}
        onMouseEnter={() => {
          if (autoIdleTimerRef.current !== null) { clearTimeout(autoIdleTimerRef.current); autoIdleTimerRef.current = null; }
        }}
        className="pointer-events-auto w-full rounded-2xl bg-white shadow-[0_8px_32px_rgba(16,24,40,0.18)] animate-in fade-in slide-in-from-bottom-3 duration-300 overflow-hidden border border-[#F79009]/30"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 bg-[#FFFBEB] border-b border-[#FDE68A] px-4 pt-3.5 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F59E0B] text-white">
              <Phone className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[13px] font-semibold text-[#111827]">{item.name}</p>
                <span className="rounded-full bg-[#FEF0C7] border border-[#FDE68A] px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-[#B54708]">New Lead</span>
              </div>
              <p className="text-[11px] text-[#667085]">VP of Operations · {li.company} · {li.location}</p>
            </div>
          </div>
          <button type="button" onClick={handleDismiss} className="shrink-0 text-[#98A2B3] hover:text-[#344054] transition-colors mt-0.5">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Case Overview accordion */}
        <div className="border-t border-black/[0.06]">
          <button
            type="button"
            onClick={() => setSummaryOpen((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-[#FFFBEB]"
          >
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#667085]">
              Case Overview
            </span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 text-[#667085] transition-transform duration-200",
                summaryOpen ? "rotate-180" : "rotate-0",
              )}
            />
          </button>

          <div
            className="overflow-hidden transition-all duration-300 ease-in-out"
            style={{ maxHeight: summaryOpen ? "600px" : "0px", opacity: summaryOpen ? 1 : 0 }}
          >
            <div className="overflow-y-auto max-h-[480px]">
              <div className="px-4 pb-3 flex flex-col gap-3">

                {/* Aria message card */}
                {li.ariaMessage && (
                  <div className="rounded-xl border border-[#BFDBFE] bg-[#EBF4FD] p-3">
                    <div className="mb-1.5 flex items-center gap-2">
                      <img
                        src="https://cdn.builder.io/api/v1/image/assets%2F9d3d716b4b844ab4bcf3267b33310813%2F054057b71e64441097a4902d7dcea754?format=webp&width=800&height=1200"
                        alt="Aria avatar"
                        className="h-5 w-5 rounded-full object-cover shrink-0"
                      />
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1260B0]">Aria</p>
                    </div>
                    <p className="text-[13px] leading-relaxed text-[#1D2939]">{li.ariaMessage}</p>
                  </div>
                )}

                {/* AI Suggested Opening Lines */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#667085] mb-1.5">💡 AI Suggested Opening Lines</p>
                  <ul className="space-y-1.5">
                    {li.openingLines.map((line, i) => (
                      <li key={i} className="rounded-lg border border-[#E4E7EC] bg-[#F9FAFB] px-2.5 py-2 text-[11px] text-[#344054] leading-relaxed">
                        <span className="font-medium">{line.intro}</span>{" "}
                        <span className="text-[#667085]">{line.question}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Footer — Review + Launch Call buttons */}
        <div className="flex items-center gap-2 border-t border-[#F2F4F7] px-4 py-2.5">
          {isLaunching ? (
            <div className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#EBF4FD] border border-[#BFDBFE] py-1.5 text-[12px] font-semibold text-[#166CCA]">
              <div className="h-3 w-3 rounded-full border-[1.5px] border-[#166CCA]/30 border-t-[#166CCA] animate-spin" />
              Connecting call…
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onReviewLead?.(item)}
                className="flex-1 rounded-lg border border-[#D0D5DD] bg-white py-1.5 text-[12px] font-semibold text-[#344054] transition-colors hover:bg-[#F9FAFB]"
              >
                Review
              </button>
              <button
                type="button"
                onClick={() => onLaunchCall?.(item)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#166CCA] py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#1260B0]"
              >
                <Phone className="h-3 w-3" />
                Launch Call
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => {
        // Cancel the 5-second auto-dismiss permanently once the agent hovers
        if (autoIdleTimerRef.current !== null) {
          clearTimeout(autoIdleTimerRef.current);
          autoIdleTimerRef.current = null;
        }
      }}
      className={cn(
        "pointer-events-auto w-full rounded-2xl bg-white dark:bg-[#0F1629] shadow-[0_8px_32px_rgba(16,24,40,0.18)] animate-in fade-in duration-300 overflow-hidden border transition-colors",
        isInline ? "slide-in-from-left-3" : "slide-in-from-bottom-3",
        (approvePhase === "resolved" || item.statusLabel === "resolved" || item.statusLabel === "transferred")
          ? "border-[#24943E]/30"
          : "border-[#E32926]/20",
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 px-4 pt-4 pb-3">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          {/* Bot avatar — shown for all variants; falls back to customer initials if no known bot */}
          {(() => {
            const botName = item.label ?? "Service Bot";
            if (botName === "Aria") return (
              <img src="https://cdn.builder.io/api/v1/image/assets%2F9d3d716b4b844ab4bcf3267b33310813%2F054057b71e64441097a4902d7dcea754?format=webp&width=800&height=1200" alt="Aria avatar" className="h-9 w-9 shrink-0 rounded-full object-cover mt-0.5" />
            );
            if (botName === "Jacob") return (
              <img src="https://cdn.builder.io/api/v1/image/assets%2F9d3d716b4b844ab4bcf3267b33310813%2F9f1a8ec85d5f478b9a015a2b7eece268?format=webp&width=800&height=1200" alt="Jacob avatar" className="h-9 w-9 shrink-0 rounded-full object-cover mt-0.5" />
            );
            if (botName === "Emily") return (
              <img src={`${import.meta.env.BASE_URL}emily-avatar.jpg`} alt="Emily avatar" className="h-9 w-9 shrink-0 rounded-full object-cover mt-0.5" />
            );
            return (
              <div className="h-9 w-9 shrink-0 rounded-full bg-[#1260B0] flex items-center justify-center mt-0.5">
                <span className="text-[13px] font-semibold text-white leading-none">
                  {item.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                </span>
              </div>
            );
          })()}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[13px] font-semibold text-[#1D2939] dark:text-[#E2E8F0]">
                {isInline ? item.name : (item.label ?? "Service Bot")}
              </span>
              {(() => {
                const isResolved = approvePhase === "resolved" || item.statusLabel === "resolved";
                const isTransferred = item.statusLabel === "transferred";
                return (
                  <>
                    <span className={cn(
                      "rounded border px-1.5 py-0.5 text-[10px] font-semibold leading-none",
                      isResolved
                        ? "border-[#24943E] bg-[#EFFBF1] text-[#208337]"
                        : isTransferred
                        ? "border-[#24943E] bg-[#EFFBF1] text-[#208337]"
                        : item.statusLabel === "Escalated"
                        ? "border-[#E53935] bg-[#FDEAEA] text-[#C71D1A]"
                        : "border-[#24943E] bg-[#EFFBF1] text-[#208337]",
                    )}>
                      {isResolved ? "Resolved" : isTransferred ? "Live" : item.statusLabel === "Escalated" ? "Escalated" : item.priority}
                    </span>
                    {!isResolved && !isTransferred && item.statusLabel === "Escalated" && <EscalationTimer customerId={item.customerRecordId} />}
                    {!isResolved && !isTransferred && item.statusLabel !== "Escalated" && <span className="text-[11px] text-[#98A2B3]">{item.time}</span>}
                  </>
                );
              })()}
            </div>
            <p className="mt-1 text-[12px] leading-[1.4] text-[#475467] dark:text-[#94A3B8] line-clamp-2">
              {item.preview}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[#98A2B3] hover:bg-[#F2F4F7] hover:text-[#344054] transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Summary — always visible, collapsible */}
      <div className="border-t border-black/[0.06]">
        <button
          type="button"
          onClick={() => {
            // Cancel auto-minimize: agent is actively using the accordion
            if (autoMinimizeTimerRef.current !== null) {
              clearTimeout(autoMinimizeTimerRef.current);
              autoMinimizeTimerRef.current = null;
            }
            cancelIdleTimer();
            setSummaryOpen((v) => !v);
          }}
          className="flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-[#F9FAFB]"
        >
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[#667085]">
            Case Summary
          </span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-[#667085] transition-transform duration-200",
              summaryOpen ? "rotate-180" : "rotate-0",
            )}
          />
        </button>

        <div
          className="overflow-hidden transition-all duration-300 ease-in-out"
          style={{ maxHeight: summaryOpen ? "calc(100vh - 180px)" : "0px", opacity: summaryOpen ? 1 : 0 }}
        >
          <div
            className="overflow-y-auto"
            style={{
              maxHeight: isInline && inlinePanelHeight > 0 && inlineHeaderOffset > 0
                ? Math.max(120, inlinePanelHeight - inlineHeaderOffset - 12 - 90 - 40 - 12)
                : "calc(100vh - 180px)",
            }}
          >
            <div className="px-4 pb-3 flex flex-col gap-3">
            {/* Human Assist Request / Approval flow */}
            {(customerContext || item.statusLabel === "transferred") && (
              item.statusLabel === "transferred" ? (
                /* ── Transferred: handoff confirmation card ── */
                <div className="rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] p-3 animate-in fade-in duration-300">
                  <div className="mb-1.5 flex items-center gap-2">
                    {item.label === "Emily" ? (
                      <img src={`${import.meta.env.BASE_URL}emily-avatar.jpg`} alt="Emily avatar" className="h-5 w-5 rounded-full object-cover shrink-0" />
                    ) : (
                      <img
                        src={item.label === "Jacob"
                          ? "https://cdn.builder.io/api/v1/image/assets%2F9d3d716b4b844ab4bcf3267b33310813%2F9f1a8ec85d5f478b9a015a2b7eece268?format=webp&width=800&height=1200"
                          : "https://cdn.builder.io/api/v1/image/assets%2F9d3d716b4b844ab4bcf3267b33310813%2F054057b71e64441097a4902d7dcea754?format=webp&width=800&height=1200"}
                        alt={`${item.label ?? "Aria"} avatar`}
                        className="h-5 w-5 rounded-full object-cover shrink-0"
                      />
                    )}
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#166744]">{item.label ?? "Aria"}</p>
                  </div>
                  <p className="text-[13px] font-medium leading-5 text-[#166744]">
                    I have transferred the assignment. You are now live with customer {item.name}.
                  </p>
                  <div className="mt-3 flex items-center justify-between rounded-lg border border-[#24943E] bg-white px-3 py-2">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[#208337]">Status</span>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-[#208337]" />
                      <span className="text-[12px] font-semibold text-[#208337]">Live</span>
                    </div>
                  </div>
                </div>
              ) : approvePhase === "resolved" ? (
                /* ── Resolved: full card replacement ── */
                <div className="rounded-xl border border-[#BFDBFE] bg-[#EBF4FD] p-3 animate-in fade-in duration-300">
                  <div className="mb-1.5 flex items-center gap-2">
                    <img
                      src="https://cdn.builder.io/api/v1/image/assets%2F9d3d716b4b844ab4bcf3267b33310813%2F054057b71e64441097a4902d7dcea754?format=webp&width=800&height=1200"
                      alt="Aria avatar"
                      className="h-5 w-5 rounded-full object-cover shrink-0"
                    />
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1260B0]">{item.label ?? "Aria"}</p>
                  </div>
                  <p className="text-[13px] font-medium leading-5 text-[#344054]">
                    Wow! Great job, Jeff! Looks like we have another happy customer. I've updated the case to resolved!
                  </p>
                  {/* Case Status dropdown */}
                  <div className="relative mt-3">
                    <button
                      type="button"
                      onClick={() => setResolvedStatusOpen((v) => !v)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg border px-3 py-2 transition-colors",
                        resolvedToastStatus === "Resolved" ? "border-[#24943E] bg-[#EFFBF1]" :
                        resolvedToastStatus === "Pending"  ? "border-[#FFB800] bg-[#FFF6E0]" :
                        resolvedToastStatus === "Escalated"? "border-[#E53935] bg-[#FDEAEA]" :
                                                             "border-[#BFDBFE] bg-white",
                      )}
                    >
                      <span className={cn("text-[10px] font-semibold uppercase tracking-widest",
                        resolvedToastStatus === "Resolved" ? "text-[#208337]" :
                        resolvedToastStatus === "Pending"  ? "text-[#A37A00]" :
                        resolvedToastStatus === "Escalated"? "text-[#C71D1A]" : "text-[#166CCA]",
                      )}>Case Status</span>
                      <div className="flex items-center gap-1.5">
                        <span className={cn("h-2 w-2 rounded-full",
                          resolvedToastStatus === "Resolved" ? "bg-[#208337]" :
                          resolvedToastStatus === "Pending"  ? "bg-[#FFB800]" :
                          resolvedToastStatus === "Escalated"? "bg-[#E32926]" : "bg-[#166CCA]",
                        )} />
                        <span className={cn("text-[12px] font-semibold",
                          resolvedToastStatus === "Resolved" ? "text-[#208337]" :
                          resolvedToastStatus === "Pending"  ? "text-[#A37A00]" :
                          resolvedToastStatus === "Escalated"? "text-[#C71D1A]" : "text-[#166CCA]",
                        )}>{resolvedToastStatus}</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                          className={cn(
                            resolvedToastStatus === "Resolved" ? "text-[#208337]" :
                            resolvedToastStatus === "Pending"  ? "text-[#A37A00]" :
                            resolvedToastStatus === "Escalated"? "text-[#C71D1A]" : "text-[#166CCA]",
                            resolvedStatusOpen && "rotate-180", "transition-transform"
                          )}>
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                      </div>
                    </button>
                    {resolvedStatusOpen && (
                      <div className="absolute bottom-[calc(100%+4px)] left-0 right-0 z-30 rounded-xl border border-[#E4E7EC] bg-white shadow-[0_8px_24px_rgba(16,24,40,0.12)] overflow-hidden">
                        {[
                          { label: "Resolved",  dot: "bg-[#208337]", text: "text-[#208337]" },
                          { label: "Open",      dot: "bg-[#166CCA]", text: "text-[#166CCA]" },
                          { label: "Pending",   dot: "bg-[#FFB800]", text: "text-[#A37A00]" },
                          { label: "Escalated", dot: "bg-[#E32926]", text: "text-[#C71D1A]" },
                        ].map(({ label, dot, text }) => (
                          <button
                            key={label}
                            type="button"
                            onClick={() => { setResolvedToastStatus(label); setResolvedStatusOpen(false); }}
                            className="flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-[#F9FAFB] transition-colors"
                          >
                            <span className={cn("h-2 w-2 rounded-full shrink-0", dot)} />
                            <span className={cn("text-[13px] font-medium", text)}>{label}</span>
                            {resolvedToastStatus === label && (
                              <svg className="ml-auto h-3.5 w-3.5 text-[#166CCA]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Takeover + Dismiss buttons */}
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => onTakeover(item)}
                      className="flex-1 rounded-lg bg-[#166CCA] px-3 py-2 text-[13px] font-semibold text-white hover:bg-[#1260B0] transition-colors"
                    >
                      Takeover
                    </button>
                    <button
                      type="button"
                      onClick={() => { onDismissResolved?.(item); handleDismiss(); }}
                      className="flex-1 rounded-lg border border-[#D0D5DD] bg-white px-3 py-2 text-[13px] font-semibold text-[#344054] hover:bg-[#F9FAFB] transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ) : (
                /* ── Idle / Approving: original card with confidence meter ── */
                <div className="rounded-xl border border-[#BFDBFE] bg-[#EBF4FD] p-3">
                  <div className="mb-1.5 flex items-center gap-2">
                    {item.label === "Emily" ? (
                      <img src={`${import.meta.env.BASE_URL}emily-avatar.jpg`} alt="Emily avatar" className="h-5 w-5 rounded-full object-cover shrink-0" />
                    ) : (
                      <img
                        src={item.label === "Jacob"
                          ? "https://cdn.builder.io/api/v1/image/assets%2F9d3d716b4b844ab4bcf3267b33310813%2F9f1a8ec85d5f478b9a015a2b7eece268?format=webp&width=800&height=1200"
                          : "https://cdn.builder.io/api/v1/image/assets%2F9d3d716b4b844ab4bcf3267b33310813%2F054057b71e64441097a4902d7dcea754?format=webp&width=800&height=1200"}
                        alt={`${item.label ?? "Aria"} avatar`}
                        className="h-5 w-5 rounded-full object-cover shrink-0"
                      />
                    )}
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1260B0]">{item.label ?? "Aria"}</p>
                  </div>
                  <p className="text-[13px] font-medium leading-5 text-[#344054]">{customerContext}</p>

                  {/* AI Confidence + Approve / Approving state — driven by aiConfidence in static assignment */}
                  {item.statusLabel === "Escalated" && item.aiConfidence !== undefined && (
                    approvePhase === "approving" ? (
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-[13px] font-medium text-[#344054]">Approving request</span>
                        <span className="flex items-center gap-0.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#166CCA] animate-bounce [animation-delay:0ms]" />
                          <span className="h-1.5 w-1.5 rounded-full bg-[#166CCA] animate-bounce [animation-delay:150ms]" />
                          <span className="h-1.5 w-1.5 rounded-full bg-[#166CCA] animate-bounce [animation-delay:300ms]" />
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="mt-3 rounded-lg border border-[#BFDBFE] bg-white px-3 py-2.5 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#667085]">AI Confidence</span>
                            <span className="text-[12px] font-bold text-[#166CCA]">{item.aiConfidence}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-[#E4E7EC] overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-[#166CCA] to-[#4B96DA]" style={{ width: `${item.aiConfidence}%` }} />
                          </div>
                          {item.aiConfidenceReason && (
                            <p className="text-[10px] text-[#98A2B3] leading-relaxed">{item.aiConfidenceReason}</p>
                          )}
                        </div>
                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              approveToastTimersRef.current.forEach(clearTimeout);
                              approveToastTimersRef.current = [];
                              setApprovePhase("approving");
                              approveToastTimersRef.current.push(
                                setTimeout(() => {
                                  setApprovePhase("resolved");
                                  onApproveResolved?.(item);
                                }, 2800)
                              );
                            }}
                            className="flex-1 rounded-lg bg-[#166CCA] px-3 py-2 text-[13px] font-semibold text-white hover:bg-[#1260B0] transition-colors"
                          >
                            Approve
                          </button>
                        </div>
                      </>
                    )
                  )}
                </div>
              )
            )}

            {/* Customer Profile — collapsible, starts collapsed */}
            {(() => {
              const toastCustomerRecord = getCustomerRecord(item.customerRecordId);
              if (!toastCustomerRecord) return null;
              const { profile } = toastCustomerRecord;
              return (
                <div className="rounded-xl border border-[#E4E7EC] bg-white overflow-hidden">
                  <button
                    type="button"
                    onClick={() => { cancelIdleTimer(); setIsToastProfileOpen((v) => !v); }}
                    className="flex w-full items-center justify-between px-3 py-2.5 text-left"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1260B0]">Customer Profile</p>
                    <ChevronDown className={cn("h-3.5 w-3.5 text-[#1260B0] transition-transform duration-200", isToastProfileOpen && "rotate-180")} />
                  </button>
                  <div className={cn("grid transition-all duration-200 ease-out", isToastProfileOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                    <div className="overflow-hidden">
                      <div className="px-3 pb-3 space-y-2.5">
                        {/* Identity row */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#C5DEF5] text-[13px] font-bold text-[#1260B0]">
                              {item.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-[13px] font-semibold text-[#111827] leading-tight">{item.name}</p>
                              <p className="text-[11px] text-[#667085] leading-snug">{profile.department} · {profile.tenureYears} yr{profile.tenureYears !== 1 ? "s" : ""} tenure</p>
                            </div>
                          </div>
                          {profile.totalAUM && (
                            <div className="text-right shrink-0">
                              <p className="text-[10px] text-[#98A2B3]">Balance</p>
                              <p className="text-[13px] font-semibold text-[#111827]">{profile.totalAUM}</p>
                            </div>
                          )}
                        </div>
                        {/* Tags */}
                        {profile.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {profile.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center rounded-full border border-[#E4E7EC] bg-[#F9FAFB] px-2.5 py-0.5 text-[11px] font-medium text-[#344054]"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Customer Snapshot — collapsible, white bg matching activity accordion */}
            {(() => {
              const snapshotRecord = item.customerRecordId ? getCustomerRecord(item.customerRecordId) : null;
              const snapshotBullets = snapshotRecord?.customerSnapshot;
              if (!snapshotBullets || snapshotBullets.length === 0) return null;
              return (
                <div className="rounded-xl border border-[#E4E7EC] bg-white overflow-hidden">
                  <button
                    type="button"
                    onClick={() => { cancelIdleTimer(); setIsAttemptedResolutionOpen((v) => !v); }}
                    className="flex w-full items-center justify-between px-3 py-2.5 text-left"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1260B0]">
                      Customer Snapshot
                    </p>
                    <ChevronDown className={cn("h-3.5 w-3.5 text-[#1260B0] transition-transform duration-200", isAttemptedResolutionOpen && "rotate-180")} />
                  </button>
                  <div className={cn("grid transition-all duration-200 ease-out", isAttemptedResolutionOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                    <div className="overflow-hidden">
                      <div className="px-3 pb-3">
                        <ul className="space-y-1.5">
                          {snapshotBullets.map((bullet, i) => (
                            <li key={i} className="flex items-start gap-2 text-[12px] leading-snug text-[#344054]">
                              <span className="mt-[3px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#1260B0]" />
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Copilot response card — appears after submission */}
            {copilotPhase !== "idle" && (
              <div className="rounded-xl border border-[#E4E7EC] bg-white overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsCopilotOpen((v) => !v)}
                  className="flex w-full items-center justify-between px-3 py-2.5 text-left"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3 w-3 text-[#166CCA]" />
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1260B0]">Copilot Response</p>
                    {copilotPhase === "thinking" && (
                      <span className="flex items-center gap-0.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#166CCA] animate-bounce [animation-delay:0ms]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-[#166CCA] animate-bounce [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-[#166CCA] animate-bounce [animation-delay:300ms]" />
                      </span>
                    )}
                  </div>
                  <ChevronDown className={cn("h-3.5 w-3.5 text-[#1260B0] transition-transform duration-200", isCopilotOpen && "rotate-180")} />
                </button>
                <div className={cn("grid transition-all duration-200 ease-out", isCopilotOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                  <div className="overflow-hidden">
                    <div className="px-3 pb-3 space-y-2">
                      <p className="text-[11px] text-[#98A2B3] italic">"{submittedQuery}"</p>
                      {copilotReasoningVisible > 0 && (
                        <div>
                          <button
                            type="button"
                            onClick={() => setIsReasoningOpen((v) => !v)}
                            className="flex items-center gap-1 text-[11px] text-[#98A2B3] hover:text-[#667085] transition-colors"
                          >
                            <span>{copilotPhase === "thinking" ? "Thinking…" : "Thought process"}</span>
                            <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", isReasoningOpen && "rotate-180")} />
                          </button>
                          <div className={cn("grid transition-all duration-200 ease-out", isReasoningOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                            <div className="overflow-hidden">
                              <div className="pt-1.5 space-y-1 border-l-2 border-[#C5DEF5] ml-1 pl-2.5">
                                {REASONING_STEPS.slice(0, copilotReasoningVisible).map((step, i) => (
                                  <div key={i} className="text-[11px] text-[#98A2B3]">{step}</div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      {copilotPhase === "done" && (
                        <div className="rounded-lg bg-[#EBF4FD] border border-[#BFDBFE] px-3 py-2">
                          <p className="text-[12px] text-[#344054] leading-relaxed">
                            {COPILOT_FALLBACK_RESPONSE}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Ask Copilot input */}
            <div className="flex items-center gap-2 rounded-lg border border-[#BFDBFE] bg-white px-3 py-2">
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#166CCA]" />
              <input
                type="text"
                value={copilotQuery}
                onChange={(e) => setCopilotQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleCopilotSubmit(); }}
                placeholder="Ask Copilot about this Case"
                className="min-w-0 flex-1 bg-transparent text-[12px] text-[#344054] placeholder:text-[#98A2B3] outline-none"
              />
              <button type="button" onClick={handleCopilotSubmit} className="shrink-0 text-[#166CCA] hover:text-[#1260B0] transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </div>
          </div>
        </div>
          </div>
        </div>

      {/* Actions footer — always show both Review and Takeover buttons */}
      {item.statusLabel !== "transferred" && approvePhase !== "resolved" && (
        <div className="flex items-center gap-2 border-t border-[#F2F4F7] px-4 py-2.5">
          <button
            type="button"
            onClick={() => onMonitor(item)}
            className="flex-1 rounded-lg border border-[#D0D5DD] bg-white py-1.5 text-[12px] font-semibold text-[#344054] transition-colors hover:bg-[#F9FAFB]"
          >
            Review
          </button>
          <button
            type="button"
            onClick={() => onTakeover(item)}
            className="flex-1 rounded-lg bg-[#166CCA] py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#1260B0]"
          >
            Takeover
          </button>
        </div>
      )}

    </div>
  );
}

// ─── Agent-to-agent inbound chat notification toast ───────────────────────────

function IncomingAgentChatCard({
  notif,
  onOpen,
  onDismiss,
}: {
  notif: AgentChatNotification;
  onOpen: (notif: AgentChatNotification) => void;
  onDismiss: (notif: AgentChatNotification) => void;
}) {
  return (
    <div className="pointer-events-auto w-full overflow-hidden rounded-2xl border border-[#166CCA]/20 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.18)] animate-in fade-in slide-in-from-bottom-3 duration-300">


      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-2">
        {/* Avatar */}
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white"
          style={{ backgroundColor: notif.agentAvatarColor }}
        >
          {notif.agentInitials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-[#1D2939] leading-none">{notif.agentName}</span>
            <span className="rounded-full border border-[#BFDBFE] bg-[#EBF4FD] px-2 py-0.5 text-[10px] font-semibold text-[#166CCA] leading-none">
              {notif.agentRole}
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-[#98A2B3]">{notif.time}</p>
        </div>
        <button
          type="button"
          onClick={() => onDismiss(notif)}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[#98A2B3] transition-colors hover:bg-[#F2F4F7] hover:text-[#344054]"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Message preview */}
      <div className="mx-4 mb-3 rounded-xl bg-[#F8F8F9] px-3 py-2.5">
        <div className="flex items-start gap-2">
          <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#166CCA]" />
          <p className="text-[12px] leading-[1.5] text-[#344054]">{notif.message}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 border-t border-[#F2F4F7] px-4 py-2.5">
        <button
          type="button"
          onClick={() => onDismiss(notif)}
          className="flex-1 rounded-lg border border-[#D0D5DD] bg-white py-1.5 text-[12px] font-semibold text-[#344054] transition-colors hover:bg-[#F9FAFB]"
        >
          Dismiss
        </button>
        <button
          type="button"
          onClick={() => onOpen(notif)}
          className="flex-1 rounded-lg bg-[#166CCA] py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#1260B0]"
        >
          Open Chat
        </button>
      </div>
    </div>
  );
}

// ─── Unified notification stack — assignment + chat toasts in one rolodex ──────

// Rolodex collapsed-mode constants
const NOTIF_PEEK_PX         = 72;   // px of each background card visible above the one in front
const NOTIF_SCALE_STEP      = 0.04; // each layer shrinks 4 %
const NOTIF_BRIGHTNESS_STEP = 0.12; // each layer darkens 12 %

// Expanded column spacing
const NOTIF_CARD_GAP = 8; // px gap between cards in expanded mode
// Estimated heights drive expand-position calculation (no DOM measurement needed)
const NOTIF_CARD_HEIGHT: Record<string, number> = {
  assignment: 172,
  chat: 146,
};

function NotificationStack({
  assignmentItems,
  chatItems,
  onMonitor,
  onTakeover,
  onTransfer,
  onDismiss,
  onApprove,
  onApproveResolved,
  onDismissResolved,
  onLaunchCall,
  onReviewLead,
  launchingAssignmentId = null,
  onChatOpen,
  onChatDismiss,
}: {
  assignmentItems: QueuePreviewItem[];
  chatItems: AgentChatNotification[];
  onMonitor: (item: QueuePreviewItem) => void;
  onTakeover: (item: QueuePreviewItem) => void;
  onTransfer: (item: QueuePreviewItem) => void;
  onDismiss: (item: QueuePreviewItem) => void;
  onApprove?: (item: QueuePreviewItem) => void;
  onApproveResolved?: (item: QueuePreviewItem) => void;
  onDismissResolved?: (item: QueuePreviewItem) => void;
  onLaunchCall?: (item: QueuePreviewItem) => void;
  onReviewLead?: (item: QueuePreviewItem) => void;
  launchingAssignmentId?: string | null;
  onChatOpen: (notif: AgentChatNotification) => void;
  onChatDismiss: (notif: AgentChatNotification) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Scroll container for expanded mode — scroll to bottom so the front card is always visible.
  const expandedScrollRef = useRef<HTMLDivElement>(null);

  // Hide/show toggle — lets agents temporarily slide toasts off-screen without dismissing them.
  // Must be declared before the early return to satisfy Rules of Hooks.
  const [isHidden, setIsHidden] = useState(false);

  // Track actual rendered card heights so expanded positions are accurate
  // even when a card's content is taller than the static NOTIF_CARD_HEIGHT estimate.
  const [cardHeights, setCardHeights] = useState<Record<string, number>>({});
  const observerRefs = useRef<Map<string, ResizeObserver>>(new Map());
  const assignCardRef = useCallback((key: string) => (el: HTMLDivElement | null) => {
    observerRefs.current.get(key)?.disconnect();
    if (!el) { observerRefs.current.delete(key); return; }
    const ro = new ResizeObserver(([entry]) => {
      const h = Math.round(
        entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height,
      );
      setCardHeights((prev) => (prev[key] === h ? prev : { ...prev, [key]: h }));
    });
    ro.observe(el);
    observerRefs.current.set(key, ro);
  }, []);
  useEffect(() => () => { observerRefs.current.forEach((ro) => ro.disconnect()); }, []);

  // Each time the stack opens, scroll to the bottom so the front card (item[0]) is visible.
  // In flex-col-reverse the front card lives at the visual bottom; overflow is at the top.
  // IMPORTANT: must be declared before the early-return below to satisfy Rules of Hooks.
  useEffect(() => {
    if (isExpanded && expandedScrollRef.current) {
      const el = expandedScrollRef.current;
      el.scrollTop = el.scrollHeight;
    }
  }, [isExpanded]);

  type StackItem =
    | { type: "assignment"; key: string; assignmentData: QueuePreviewItem }
    | { type: "chat";       key: string; chatData: AgentChatNotification  };

  // Cases first (index 0 = front/bottom, most prominent by default), chats peeking above.
  // On hover the chat card's z-index boosts to bring it forward without moving.
  // DOM order never changes — only CSS props update → pure CSS transitions, no re-mounts.
  const defaultOrder = useMemo<StackItem[]>(
    () => [
      ...assignmentItems.map((a) => ({ type: "assignment" as const, key: a.id, assignmentData: a })),
      ...chatItems.map(      (c) => ({ type: "chat"       as const, key: c.id, chatData: c       })),
    ],
    [assignmentItems, chatItems],
  );

  if (defaultOrder.length === 0) return null;

  const n = defaultOrder.length;

  const cancelLeave = () => {
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
  };
  const scheduleCollapse = () => {
    leaveTimerRef.current = setTimeout(() => { setIsExpanded(false); setHoveredKey(null); }, 250);
  };

  const renderCard = (item: StackItem) =>
    item.type === "assignment" ? (
      <IncomingAssignmentCard
        item={item.assignmentData}
        onMonitor={onMonitor}
        onTakeover={onTakeover}
        onTransfer={onTransfer}
        onDismiss={onDismiss}
        onApprove={onApprove}
        onApproveResolved={onApproveResolved}
        onDismissResolved={onDismissResolved}
        onLaunchCall={onLaunchCall}
        onReviewLead={onReviewLead}
        isLaunching={item.assignmentData.id === launchingAssignmentId}
      />
    ) : (
      <IncomingAgentChatCard
        notif={item.chatData}
        onOpen={onChatOpen}
        onDismiss={onChatDismiss}
      />
    );

  return (
    <>
      {/* ── Toggle pill ───────────────────────────────────────────────────── */}
      {createPortal(
        <button
          onClick={() => setIsHidden((h) => !h)}
          className="pointer-events-auto fixed bottom-5 z-[9999] flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium shadow-md transition-all duration-200"
          style={{
            right: isHidden ? 20 : 432,
            // When hidden: prominent amber pill with pulse badge; when visible: muted ghost pill
            background: isHidden ? "rgba(251,191,36,0.15)" : "rgba(255,255,255,0.85)",
            backdropFilter: "blur(6px)",
            borderColor: isHidden ? "rgba(251,191,36,0.6)" : "rgba(0,0,0,0.12)",
            color: isHidden ? "#92400e" : "#6b7280",
          }}
          title={isHidden ? "Show alert toasts" : "Hide alert toasts"}
        >
          {isHidden ? (
            <>
              <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-amber-400" />
              <Bell size={13} />
              {n} alert{n !== 1 ? "s" : ""}
            </>
          ) : (
            <>
              <Minus size={13} />
              Hide alerts
            </>
          )}
        </button>,
        document.body,
      )}

      {/* ── Toast stack ───────────────────────────────────────────────────── */}
      {createPortal(
    <div
      className="pointer-events-none fixed bottom-5 right-5 z-[9998]"
          style={{
            width: 400,
            transition: "opacity 250ms ease, transform 250ms ease",
            opacity: isHidden ? 0 : 1,
            transform: isHidden ? "translateY(16px)" : "translateY(0)",
            pointerEvents: isHidden ? "none" : undefined,
          }}
    >
      {isExpanded ? (
        // ── Expanded: scrollable column anchored at the bottom ─────────────
        // flex-col-reverse puts item[0] (front card) at the visual bottom.
        // Overflow cards (background) appear above and are reachable by scrolling up.
        // maxHeight caps the container to the viewport so it never pushes off-screen.
        <div
          ref={expandedScrollRef}
          className="pointer-events-auto flex flex-col-reverse gap-2 overflow-y-auto"
          style={{ maxHeight: "calc(100vh - 40px)" }}
          onMouseEnter={cancelLeave}
          onMouseLeave={scheduleCollapse}
        >
          {defaultOrder.map((item) => (
            <div key={item.key} ref={assignCardRef(item.key)}>
              {renderCard(item)}
            </div>
          ))}
        </div>
      ) : (
        // ── Collapsed: rolodex peek stack ────────────────────────────────────
        // Cards stay in their fixed peek positions at all times.
        // Hovering any card just raises its z-index so it appears in front
        // without moving anything.
        <>
          {defaultOrder.map((item, idx) => {
            const isHovered    = hoveredKey === item.key;
            // Only treat hover as active if the hovered key still exists in the stack.
            // Prevents a dismissed card's stale key from dimming the remaining card(s).
            const isAnyHovered = hoveredKey !== null && defaultOrder.some((it) => it.key === hoveredKey);

            // Position never changes — cards stay fixed in their peek slots.
            const cY = -(idx * NOTIF_PEEK_PX);

            // Scale: hovered card = full size; non-hovered cards while hovering =
            // slightly shrunk (depth-1 level, ~0.96) so Aria visibly steps back;
            // nothing hovered = normal idx-based sizing.
            const cScale = isHovered
              ? 1
              : isAnyHovered
                ? Math.max(0.88, 1 - NOTIF_SCALE_STEP)
                : Math.max(0.88, 1 - idx * NOTIF_SCALE_STEP);

            // Brightness:
            //   • Hovered card          → full (1) — looks like the screenshot-1 front card
            //   • Others while hovering → all dim to the depth-1 background level
            //   • Nothing hovered       → normal idx-based: idx 0 = full, others dimmed
            const cBrightness = isHovered
              ? 1
              : isAnyHovered
                ? Math.max(0.65, 1 - NOTIF_BRIGHTNESS_STEP)   // uniform background dim
                : idx === 0 ? 1 : Math.max(0.65, 1 - idx * NOTIF_BRIGHTNESS_STEP);

            const zIndex       = isHovered ? n + 1 : n - idx;
            const staggerDelay = `${(n - 1 - idx) * 28}ms`;

            return (
              <div
                key={item.key}
                ref={assignCardRef(item.key)}
                className="pointer-events-auto absolute bottom-0 left-0 right-0"
                style={{
                  transform: `translateY(${cY}px) scale(${cScale})`,
                  transformOrigin: "bottom center",
                  filter: cBrightness < 1 ? `brightness(${cBrightness})` : undefined,
                  zIndex,
                  transition: [
                    `transform 300ms cubic-bezier(0.34,1.12,0.64,1) ${isAnyHovered ? "0ms" : staggerDelay}`,
                    `filter 200ms ease-out ${isAnyHovered ? "0ms" : staggerDelay}`,
                    `opacity 200ms ease ${isAnyHovered ? "0ms" : staggerDelay}`,
                  ].join(", "),
                }}
                onMouseEnter={() => {
                  cancelLeave();
                  setHoveredKey(item.key);
                }}
                onMouseLeave={scheduleCollapse}
              >
                {renderCard(item)}
              </div>
            );
          })}
        </>
      )}
    </div>,
    document.body,
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function LeftQueueRail({
  visibleAssignments,
  queueStatuses,
  escalatedRailCount,
  onStatusChange,
  onRemoveAssignment,
  onRemoveGroupedAssignments,
  isOpen,
  onToggle,
  completedTodayCount,
  onAddNewAssignment,
  totalQueueCount,
  incomingItems = [],
  onIncomingTakeover,
  onIncomingMonitor,
  onIncomingTransfer,
  onIncomingDismiss,
  onIncomingApprove,
  onIncomingApproveResolved,
  onIncomingDismissResolved,
  onIncomingLaunchCall,
  onIncomingReviewLead,
  launchingAssignmentId = null,
}: {
  visibleAssignments: QueuePreviewItem[];
  queueStatuses: Record<string, QueueAssignmentStatus>;
  onStatusChange: (assignmentId: QueuePreviewItem["id"], status: QueueAssignmentStatus) => void;
  onRemoveAssignment: (assignmentId: QueuePreviewItem["id"]) => void;
  onRemoveGroupedAssignments?: (assignmentIds: string[]) => void;
  isOpen: boolean;
  onToggle: () => void;
  completedTodayCount: number;
  onAddNewAssignment: (rect: DOMRect) => void;
  totalQueueCount: number;
  escalatedRailCount: number;
  incomingItems?: QueuePreviewItem[];
  onIncomingTakeover?: (item: QueuePreviewItem) => void;
  onIncomingMonitor?: (item: QueuePreviewItem) => void;
  onIncomingTransfer?: (item: QueuePreviewItem) => void;
  onIncomingDismiss?: (item: QueuePreviewItem) => void;
  onIncomingApprove?: (item: QueuePreviewItem) => void;
  onIncomingApproveResolved?: (item: QueuePreviewItem) => void;
  onIncomingDismissResolved?: (item: QueuePreviewItem) => void;
  onIncomingLaunchCall?: (item: QueuePreviewItem) => void;
  onIncomingReviewLead?: (item: QueuePreviewItem) => void;
  launchingAssignmentId?: string | null;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const isOnControlCenter = location.pathname === "/control-center";
  const toggleLeftRailOpen = onToggle;
  const {
    closeFloatingAppSpacePanel,
    isAppSpacePanelInDragMode,
    selectedAssignment,
    selectAssignment,
    isAgentInCall,
    activeCallAssignmentId,
    taskSummaryIds,
    closeChannelKeepTask,
  } = useLayoutContext();

  // When an assignment is selected in the rail, suppress nav-item highlighting —
  // the active assignment card is the active context, not a nav section.
  const hasActiveAssignment = visibleAssignments.some((a) => a.id === selectedAssignment.id);

  // If the agent is on a top-level nav page (Desk / Inbox / Schedule / Settings), the
  // assignment icon should not appear "active" — the nav destination is the focus.
  const isOnNavPage = ["/control-center", "/queue", "/directory", "/schedule", "/settings"].includes(location.pathname);

  const visibleQueuePreviewItems = useMemo(() => {
    const nextItems = visibleAssignments.map((item) => ({
      ...item,
      isActive: item.id === selectedAssignment.id,
    }));

    return [...nextItems].sort(
      (left, right) =>
        (priorityRankMap[left.priority.toLowerCase()] ?? Number.MAX_SAFE_INTEGER) -
        (priorityRankMap[right.priority.toLowerCase()] ?? Number.MAX_SAFE_INTEGER),
    );
  }, [selectedAssignment.id, visibleAssignments]);

  // Group flat items by customer so multi-channel customers share one card
  const groupedQueueItems = useMemo(
    () => groupQueueItems(visibleQueuePreviewItems, selectedAssignment.id),
    [visibleQueuePreviewItems, selectedAssignment.id],
  );

  // Track which group's status dropdown is open so we can keep the HoverCard pinned open.
  // Also track pointer-inside state so the card stays open while the agent is interacting.
  // Both use debounced clears to survive the brief moment when a portaled dropdown disappears
  // and the browser re-fires pointerenter on the underlying card content.
  const [statusDropdownOpenGroupId, setStatusDropdownOpenGroupId] = useState<string | null>(null);
  const [pointerInsideGroupId, setPointerInsideGroupId] = useState<string | null>(null);
  const dropdownCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerLeaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // When the rail closes, the <aside> animates from w-0 → w-[60px] over 300ms.
  // If the active-call card is forced open immediately, Radix UI positions it
  // against the trigger at x≈0, landing the card inside the rail.
  // Wait for the rail transition to settle before allowing forced-open behaviour.
  const [railSettled, setRailSettled] = useState(!isOpen);
  const railSettleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (railSettleTimerRef.current) clearTimeout(railSettleTimerRef.current);
    if (!isOpen) {
      railSettleTimerRef.current = setTimeout(() => { setRailSettled(true); }, 320);
    } else {
      setRailSettled(false);
    }
    return () => {
      if (railSettleTimerRef.current) clearTimeout(railSettleTimerRef.current);
    };
  }, [isOpen]);

  const handleRemoveQueueItem = (assignmentId: QueuePreviewItem["id"]) => {
    onRemoveAssignment(assignmentId);
  };

  const handleRemoveGroupedQueueItems = (assignmentIds: string[]) => {
    if (onRemoveGroupedAssignments) {
      onRemoveGroupedAssignments(assignmentIds);
    } else {
      assignmentIds.forEach(onRemoveAssignment);
    }
  };

  return (
    <div
      className={cn(
        "relative z-[80] block h-full shrink-0 ease-out",
        isOpen ? "w-[347px]" : "w-[60px]",
      )}
      style={{
        transition: isOpen
          ? "width 300ms ease-out"                    /* opening: width starts immediately */
          : "width 300ms ease-out 150ms",             /* closing: width waits for content to fade out */
      }}
    >
      <div className="relative flex h-full bg-[#F8F8F9]">
        <aside
          className={cn(
            "flex h-full shrink-0 flex-col items-center overflow-visible bg-[#F8F8F9] pb-3 pt-0 ease-out",
            isOpen ? "w-0 opacity-0 pointer-events-none" : "w-[60px] opacity-100",
          )}
          style={{
            transition: isOpen
              ? "width 300ms ease-out, opacity 150ms ease-out"          /* rail opens → collapsed aside hides immediately */
              : "width 300ms ease-out 150ms, opacity 200ms ease-out 300ms", /* rail closes → collapsed aside appears after width settles */
          }}
          aria-hidden={isOpen}
        >
          <div className="flex h-full w-full flex-col items-center">
            {/* + New Assignment button — pinned top */}
            <div className="flex w-full shrink-0 flex-col items-center pt-2 pb-1 px-1">
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label="Add New Case"
                      onClick={(e) => onAddNewAssignment(e.currentTarget.getBoundingClientRect())}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/[0.14] bg-white text-[#344054] shadow-[0_1px_2px_rgba(16,24,40,0.05)] transition-colors hover:bg-[#F9FAFB] hover:text-[#1D2939]"
                    >
                      <Plus className="h-4 w-4 stroke-[1.5]" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Add New Case</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

          {/* Collapsed nav icons — static, pinned below + button */}
          <TooltipProvider delayDuration={300}>
            <div className="flex w-full shrink-0 flex-col items-center gap-1 py-2 border-b border-black/[0.06]">
              {([
                { icon: Monitor,       path: "/control-center", label: "Control Center" },
                { icon: FileSearch,    path: "/queue",         label: "Contacts"       },
                { icon: FlaskConical,  path: "/scenarios",     label: "Scenarios"      },
                { icon: BookUser,      path: "/directory",     label: "Directory"      },
                { icon: CalendarCheck, path: "/schedule",      label: "Schedule"       },
                { icon: Settings,      path: "/settings",      label: "Settings"       },
              ] as const).map(({ icon: Icon, path, label }) => {
                const isActive = location.pathname === path;
                const showDot = label === "Control Center" && escalatedRailCount > 0;
                return (
                  <Tooltip key={label}>
                    <TooltipTrigger asChild>
                      <div className="relative">
                        <button
                          type="button"
                          aria-label={label}
                          onClick={() => navigate(path)}
                          className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                            isActive
                              ? "bg-[#166CCA] text-white"
                              : "text-[#667085] dark:text-[#8898AB] hover:bg-[#EBEBEC] dark:hover:bg-[#1C2536] hover:text-[#1D2939] dark:hover:text-[#CBD5E1]",
                          )}
                        >
                          <Icon className="h-4 w-4 stroke-[1.5]" />
                        </button>
                        {showDot && (
                          <span className="pointer-events-none absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-[#E32926] animate-pulse" />
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <span>{label}</span>
                      {label === "Control Center" && escalatedRailCount > 0 && (
                        <span className="mt-0.5 block text-[11px] font-normal text-[#E53935]">
                          {escalatedRailCount} escalated
                        </span>
                      )}
                      {label === "Contacts" && totalQueueCount > 0 && (
                        <span className="mt-0.5 block text-[11px] font-normal opacity-75">
                          {totalQueueCount} in queue
                        </span>
                      )}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>

          {/* Assignments — scrollable area below nav */}
          <div className="flex min-h-0 w-full flex-1 flex-col items-center overflow-y-auto px-1 pt-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {/* Collapsed assignment icons */}
            <div
              className={cn(
                "w-full",
                isOpen ? "pointer-events-none opacity-0" : "opacity-100",
              )}
              aria-hidden={isOpen}
            >
              <div className="flex w-full flex-col items-center gap-2 transition-opacity duration-200 ease-out">
                {groupedQueueItems.map((group) => {
                  // Collapsed rail shows one chip per customer using their initials
                  const lastChannel = group.lastActiveChannel;
                  const customerInitials = group.name
                    .split(" ")
                    .map((w: string) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();
                  const priorityKey = group.priority.toLowerCase();
                  const priorityDotClassName = priorityDotClassNameMap[priorityKey] ?? "bg-[#98A2B3]";
                  const priorityIconClassName = priorityIconClassNameMap[priorityKey] ?? "text-[#98A2B3]";
                  // Show channel count badge when multiple channels are open
                  const multiChannel = group.channels.length > 1;
                  // Keep card pinned open if this group has an active call so controls are always reachable
                  const hasActiveCall =
                    isAgentInCall &&
                    group.channels.some((c) => c.id === activeCallAssignmentId);

                  const pcCollapsed = ({
                    critical: { border: "rgba(240,68,56,0.15)", shadow: "rgba(240,68,56,0.12)", accent: "#E32926" },
                    high:     { border: "rgba(247,144,9,0.15)",  shadow: "rgba(247,144,9,0.12)",  accent: "#FFB800" },
                    medium:   { border: "rgba(22,108,202,0.15)",  shadow: "rgba(22,108,202,0.12)",  accent: "#166CCA" },
                    low:      { border: "rgba(54,157,63,0.15)",  shadow: "rgba(54,157,63,0.12)",  accent: "#208337" },
                  } as Record<string, { border: string; shadow: string; accent: string }>)[priorityKey] ?? { border: "rgba(22,108,202,0.15)", shadow: "rgba(22,108,202,0.12)", accent: "#166CCA" };

                  const groupId = group.customerRecordId;
                  const isCardEngaged =
                    hasActiveCall ||
                    statusDropdownOpenGroupId === groupId ||
                    pointerInsideGroupId === groupId;

                  return (
                    <HoverCard
                      key={groupId}
                      openDelay={120}
                      closeDelay={200}
                      open={isCardEngaged && railSettled ? true : undefined}
                    >
                      <HoverCardTrigger asChild>
                        {(() => {
                          // Suppress "active" card styling when the agent has navigated
                          // to a top-level nav page — the nav destination is the focus.
                          const isActiveInRail = group.isAnyActive && !isOnNavPage;
                          return (
                            <button
                              type="button"
                              className={cn(
                                "relative flex h-[50px] w-[52px] flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1 text-center transition-all duration-200",
                                isActiveInRail
                                  ? "border bg-white"
                                  : "border border-transparent bg-transparent hover:border-black/5 hover:bg-white/80",
                              )}
                              style={isActiveInRail ? {
                                borderColor: pcCollapsed.border,
                                boxShadow: `0 6px 18px ${pcCollapsed.shadow}`,
                              } : undefined}
                              aria-label={`${group.name} queue item`}
                              onClick={() => selectAssignment(lastChannel.id)}
                            >
                              <span
                                aria-hidden="true"
                                className={cn("absolute right-1.5 top-1.5 h-2 w-2 rounded-full", priorityDotClassName)}
                              />
                              {multiChannel && (
                                <span
                                  className="absolute left-1 top-1 flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold text-white"
                                  style={{ backgroundColor: pcCollapsed.accent }}
                                >
                                  {group.channels.length}
                                </span>
                              )}
                              <span
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-bold"
                                style={{
                                  backgroundColor: `${pcCollapsed.accent}20`,
                                  color: pcCollapsed.accent,
                                }}
                              >
                                {customerInitials}
                              </span>
                              <span
                                className="text-[9px] font-semibold leading-none tabular-nums tracking-[-0.02em]"
                                style={{ color: isActiveInRail ? pcCollapsed.accent : "#667085" }}
                              >
                                {lastChannel.time}
                              </span>
                            </button>
                          );
                        })()}
                      </HoverCardTrigger>
                      <HoverCardContent
                        side="right"
                        align="start"
                        sideOffset={14}
                        className="w-[295px] border-none bg-transparent p-0 shadow-none"
                        onMouseEnter={() => {
                          if (pointerLeaveTimerRef.current) clearTimeout(pointerLeaveTimerRef.current);
                          setPointerInsideGroupId(groupId);
                        }}
                        onMouseLeave={() => {
                          pointerLeaveTimerRef.current = setTimeout(() => {
                            setPointerInsideGroupId((prev) => (prev === groupId ? null : prev));
                          }, 150);
                        }}
                      >
                        <GroupedQueueCard
                          group={group}
                          queueStatuses={queueStatuses}
                          onStatusChange={onStatusChange}
                          onRemove={handleRemoveQueueItem}
                          onRemoveAll={handleRemoveGroupedQueueItems}
                          onSelectAssignment={selectAssignment}
                          onStatusDropdownOpenChange={(open) => {
                            if (open) {
                              if (dropdownCloseTimerRef.current) clearTimeout(dropdownCloseTimerRef.current);
                              setStatusDropdownOpenGroupId(groupId);
                            } else {
                              dropdownCloseTimerRef.current = setTimeout(() => {
                                setStatusDropdownOpenGroupId((prev) => (prev === groupId ? null : prev));
                              }, 150);
                            }
                          }}
                        />
                      </HoverCardContent>
                    </HoverCard>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Incoming assignment chips — collapsed state */}
          {incomingItems.length > 0 && (
            <div className="flex w-full flex-col items-center gap-2 pt-2 px-1">
              {incomingItems.map((item) => (
                <TooltipProvider key={item.id} delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-label={`Incoming: ${item.name}`}
                        onClick={onToggle}
                        className="relative flex h-[50px] w-[52px] flex-col items-center justify-center gap-1 rounded-2xl border border-[rgba(240,68,56,0.25)] bg-white px-1 py-1 text-center shadow-[0_4px_12px_rgba(240,68,56,0.12)] transition-all hover:shadow-[0_6px_16px_rgba(240,68,56,0.18)]"
                      >
                        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#E32926] animate-pulse" />
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FDEAEA] text-[10px] font-bold text-[#C71D1A]">
                          {item.initials}
                        </span>
                        <span className="text-[8px] font-semibold text-[#E32926] truncate w-full text-center px-0.5 uppercase tracking-wide">
                          New
                        </span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <span className="font-semibold">{item.name}</span>
                      <span className="mt-0.5 block text-[11px] font-normal opacity-75">{item.preview}</span>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          )}

          {/* App logo mark — always pinned to bottom of collapsed rail */}
          <div className="flex w-full shrink-0 items-center justify-center pb-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path
                d="M23.7188 5.89062C23.8757 5.89077 24.0015 6.01655 24 6.17188C23.8494 15.8941 15.9182 23.7747 6.13379 23.9238C5.97839 23.9255 5.85077 23.7999 5.85059 23.6445V19.3848C5.85059 19.2325 5.97502 19.1097 6.12891 19.1064C13.2448 18.9606 19.0048 13.236 19.1523 6.16602C19.1556 6.01217 19.2788 5.88872 19.4326 5.88867L23.7188 5.89062ZM12.2559 0.0771484C13.8714 0.0772122 15.1804 1.37836 15.1807 2.98242C15.1807 4.58668 13.8716 5.88861 12.2559 5.88867C10.6401 5.88867 9.33008 4.58672 9.33008 2.98242C9.33031 1.37832 10.6402 0.0771484 12.2559 0.0771484ZM2.92578 0.0761719C4.5412 0.0763851 5.85033 1.3775 5.85059 2.98145C5.85059 4.58561 4.54135 5.88748 2.92578 5.8877C1.31003 5.8877 0 4.58574 0 2.98145C0.000253194 1.37736 1.31018 0.0761719 2.92578 0.0761719Z"
                fill="#2196F3"
              />
            </svg>
          </div>
          </div>
        </aside>

        <div
          className={cn(
            "h-full min-h-0 overflow-hidden ease-out",
            isOpen ? "w-[347px]" : "w-0",
          )}
          style={{
            transition: isOpen
              ? "width 300ms ease-out"            /* opening: width expands immediately */
              : "width 300ms ease-out 150ms",     /* closing: width waits for content to fade out */
          }}
        >
          <div
            className={cn(
              "flex h-full min-h-0 w-[347px] flex-col overflow-y-auto bg-[#F8F8F9] ease-out [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
              isOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-3",
            )}
            style={{
              transition: isOpen
                ? "opacity 200ms ease-out 200ms, transform 200ms ease-out 200ms"  /* opening: fade in after width expands */
                : "opacity 120ms ease-out, transform 120ms ease-out",              /* closing: fade out immediately */
            }}
          >
            {/* Assignments section — static at top */}
            <div className="shrink-0 px-3 pb-2 pt-3">
              <button
                type="button"
                onClick={(e) => onAddNewAssignment(e.currentTarget.getBoundingClientRect())}
                className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-black/[0.14] dark:border-border bg-white dark:bg-[#1C2A3A] px-3 py-1.5 text-[13px] font-medium text-[#344054] dark:text-[#CBD5E1] transition-colors hover:bg-[#F9FAFB] dark:hover:bg-[#243041]"
              >
                <Plus className="h-4 w-4 stroke-[1.5]" />
                New Case
              </button>
            </div>

            <div className="mx-3 border-t border-black/[0.08]" />

            {/* Nav */}
            <div className="shrink-0 px-3 pb-2 pt-3">
              <nav className="space-y-0.5">
                {[
                  { label: "Control Center", icon: Monitor, path: "/control-center" },
                  { label: "Contacts",   icon: FileSearch,    path: "/queue"         },
                  { label: "Scenarios",  icon: FlaskConical,  path: "/scenarios"     },
                  { label: "Directory",  icon: BookUser,      path: "/directory"     },
                  { label: "Schedule",   icon: CalendarCheck, path: "/schedule"      },
                  { label: "Settings",   icon: Settings,      path: "/settings"      },
                ].map(({ label, icon: Icon, path }) => {
                  const isActive = location.pathname === path;
                  const caseCount = label === "Contacts" ? totalQueueCount : 0;
                  const escalatedCount = label === "Control Center" ? escalatedRailCount : 0;
                  const badgeCount = caseCount || escalatedCount;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => navigate(path)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                        isActive
                          ? "bg-[#166CCA] text-white"
                          : "text-[#444444] dark:text-[#CBD5E1] hover:bg-[#EBEBEC] dark:hover:bg-[#1C2536] hover:text-[#1D2939] dark:hover:text-white",
                      )}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0 stroke-[1.5]", isActive ? "text-white" : "text-[#667085] dark:text-[#8898AB]")} />
                      <span className="flex-1 text-left">{label}</span>
                      {badgeCount > 0 && (
                        <span className={cn(
                          "flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold leading-none",
                          isActive
                            ? "bg-white/25 text-white"
                            : "bg-[#E32926] text-white",
                        )}>
                          {badgeCount > 99 ? "99+" : badgeCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {incomingItems.length > 0 && <div className="mx-3 border-t border-black/[0.08]" />}

            {/* Incoming assignments section */}
            {incomingItems.length > 0 && (
              <div className="shrink-0 pb-2 pt-3">
                <div className="flex items-center gap-1.5 px-3 pb-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#E32926] animate-pulse" />
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#E32926]">
                    Incoming · {incomingItems.length}
                  </h3>
                </div>
                <div className="space-y-2 px-2">
                  {incomingItems.map((item) => (
                    <IncomingAssignmentCard
                      key={item.id}
                      item={item}
                      isInline
                      dismissDirection="left"
                      onTakeover={onIncomingTakeover ?? (() => {})}
                      onMonitor={onIncomingMonitor ?? (() => {})}
                      onTransfer={onIncomingTransfer ?? (() => {})}
                      onDismiss={onIncomingDismiss ?? (() => {})}
                      onApprove={onIncomingApprove}
                      onApproveResolved={onIncomingApproveResolved}
                      onDismissResolved={onIncomingDismissResolved}
                      onLaunchCall={onIncomingLaunchCall}
                      onReviewLead={onIncomingReviewLead}
                      isLaunching={launchingAssignmentId === item.id}
                    />
                  ))}
                </div>
              </div>
            )}

            {groupedQueueItems.length > 0 && (
              <QueueOverlayList
                groups={groupedQueueItems}
                queueStatuses={queueStatuses}
                onStatusChange={onStatusChange}
                onRemove={handleRemoveQueueItem}
                onRemoveAll={handleRemoveGroupedQueueItems}
                onCloseChannelKeepTask={closeChannelKeepTask}
                taskSummaryIds={taskSummaryIds}
                isOpen={isOpen}
                onSelectAssignment={selectAssignment}
              />
            )}

            {/* CXone logo — pinned footer of open rail */}
            <div className="mt-auto shrink-0 px-4 py-3">
              {/* Light mode logo */}
              <svg viewBox="0 0 1953 277.14" xmlns="http://www.w3.org/2000/svg" aria-label="NICE CXone" className="block h-[18px] w-auto dark:hidden">
                <defs>
                  <linearGradient id="cxone-gradient-light" x1="1327.72" y1="146.68" x2="1953" y2="146.68" gradientUnits="userSpaceOnUse">
                    <stop offset=".45" stopColor="#3694fc"/>
                    <stop offset=".55" stopColor="#2d8afb"/>
                    <stop offset=".73" stopColor="#1771fb"/>
                    <stop offset=".86" stopColor="#025afb"/>
                  </linearGradient>
                </defs>
                <g>
                  <path fill="url(#cxone-gradient-light)" d="M1953,146.68c0,89.08-41.99,125.6-144.43,125.6h-336.41c-102.44,0-144.43-36.51-144.43-125.6s41.99-125.6,144.43-125.6h336.41c102.44,0,144.43,36.51,144.43,125.6Z"/>
                  <path d="M1122.16,178.19h-53.36c-1.44,0-2.7,1.02-2.96,2.44-2.47,13.59-7.12,24.42-13.94,32.51-7.69,9.1-18.56,13.65-32.63,13.65-10.83,0-20.13-3.31-27.92-9.93-7.79-6.62-13.8-15.96-18.02-28.01-4.22-12.06-6.33-26.36-6.33-42.9,0-16.07,2-30.26,6.01-42.55,4-12.29,9.95-21.86,17.86-28.72,7.9-6.85,17.48-10.28,28.74-10.28,12.77,0,23.16,4.26,31.17,12.76,7.01,7.46,11.87,17.46,14.57,29.99.3,1.38,1.53,2.35,2.94,2.35h53.16c1.89,0,3.3-1.72,2.96-3.58-5.29-28.91-16.13-51.27-32.55-67.06-17.21-16.54-41.29-24.82-72.24-24.82-22.52,0-42.1,5.44-58.77,16.31-16.67,10.88-29.5,26.18-38.48,45.92-8.98,19.74-13.47,42.97-13.47,69.68s4.71,51.24,14.12,70.74c9.42,19.5,22.4,34.46,38.96,44.86,16.56,10.4,35.44,15.6,56.66,15.6,20.56,0,38.2-3.9,52.92-11.7,14.72-7.8,26.62-19.09,35.72-33.86,8.52-13.85,14.48-30.46,17.86-49.83.32-1.85-1.08-3.56-2.96-3.56Z"/>
                  <path d="M1324.25,19.71h-53.45c-1.07,0-2.06.57-2.6,1.5l-41.34,71c-.39.67-1.35.67-1.74,0l-41.34-71c-.54-.93-1.53-1.5-2.6-1.5h-53.45c-2.32,0-3.77,2.52-2.6,4.53l70.36,120.84c.18.31.18.7,0,1.01l-70.36,120.84c-1.17,2.01.28,4.53,2.6,4.53h53.45c1.07,0,2.06-.57,2.6-1.5l41.34-71c.39-.67,1.35-.67,1.74,0l41.34,71c.54.93,1.53,1.5,2.6,1.5h53.45c2.32,0,3.77-2.52,2.6-4.53l-70.36-120.84c-.18-.31-.18-.7,0-1.01l70.36-120.84c1.17-2.01-.28-4.53-2.6-4.53Z"/>
                  <path fill="#fff" d="M1459.6,226.86c-15.98,0-29.96-3.24-41.95-9.74-11.98-6.49-21.27-15.78-27.86-27.87-6.59-12.08-9.89-26.41-9.89-43s3.34-31.61,10.04-43.9c6.69-12.29,16.03-21.72,28.01-28.32,11.99-6.59,25.77-9.89,41.35-9.89s29.86,3.4,41.65,10.19c11.78,6.79,20.97,16.28,27.57,28.46,6.59,12.19,9.89,26.77,9.89,43.74s-3.25,30.91-9.74,43c-6.49,12.09-15.58,21.32-27.27,27.72-11.69,6.4-25.62,9.59-41.8,9.59ZM1459,188.51c9.19,0,16.58-1.99,22.17-5.99,5.59-3.99,9.63-9.24,12.13-15.73,2.49-6.49,3.75-13.33,3.75-20.52s-1.25-14.08-3.75-20.67c-2.5-6.59-6.49-12.03-11.99-16.33-5.5-4.29-12.94-6.44-22.32-6.44s-16.28,2.15-21.87,6.44c-5.59,4.3-9.64,9.74-12.13,16.33-2.5,6.59-3.75,13.48-3.75,20.67s1.25,14.28,3.75,20.67c2.5,6.4,6.54,11.59,12.13,15.58,5.59,4,12.88,5.99,21.87,5.99Z"/>
                  <path fill="#fff" d="M1568.36,224.76V66.86h39.25l2.1,18.28c4.39-5.39,9.44-9.63,15.13-12.73,5.69-3.09,11.48-5.24,17.38-6.44,5.89-1.2,11.24-1.8,16.03-1.8,15.18,0,27.01,3.3,35.51,9.89,8.49,6.59,14.58,15.43,18.28,26.52,3.69,11.09,5.54,23.42,5.54,37v87.19h-41.95v-81.8c0-4.79-.4-9.59-1.2-14.38-.8-4.79-2.25-9.19-4.35-13.18-2.1-3.99-5.05-7.19-8.84-9.59-3.8-2.4-8.79-3.6-14.98-3.6-7.99,0-14.68,2-20.07,5.99-5.39,4-9.39,9.39-11.99,16.18-2.6,6.79-3.9,14.28-3.9,22.47v77.9h-41.95Z"/>
                  <path fill="#fff" d="M1825.73,227.01c-16.58,0-30.67-3.3-42.25-9.89-11.59-6.59-20.48-15.93-26.67-28.01-6.19-12.08-9.29-26.22-9.29-42.4s3.19-30.71,9.59-43c6.39-12.28,15.43-21.92,27.12-28.91,11.69-6.99,25.51-10.49,41.5-10.49,11.99,0,22.52,2,31.61,5.99,9.09,4,16.78,9.59,23.07,16.78,6.29,7.19,10.98,15.53,14.08,25.02,3.09,9.49,4.54,19.73,4.35,30.71,0,2.8-.1,5.5-.3,8.09-.2,2.6-.6,5.2-1.2,7.79h-108.16c.6,5.99,2.29,11.49,5.09,16.48,2.79,5,6.74,8.94,11.83,11.83,5.09,2.9,11.43,4.35,19.03,4.35,4.99,0,9.59-.55,13.78-1.65,4.19-1.1,7.79-2.85,10.79-5.24,3-2.4,5.09-5.19,6.29-8.39h41.35c-2.6,11.79-7.44,21.47-14.53,29.06-7.09,7.59-15.63,13.14-25.62,16.63-9.99,3.49-20.48,5.24-31.46,5.24ZM1790.07,129.33h68.61c-.2-5.39-1.55-10.44-4.05-15.13-2.5-4.69-6.19-8.49-11.09-11.39-4.9-2.89-11.14-4.34-18.73-4.34s-13.93,1.5-19.03,4.49c-5.09,3-8.89,6.84-11.39,11.54-2.5,4.7-3.95,9.64-4.34,14.83Z"/>
                  <path fill="#3694fd" d="M272.23.06c-18.93-1.2-34.54,14.41-33.34,33.34.99,15.61,13.66,28.28,29.27,29.27,18.93,1.19,34.54-14.41,33.34-33.34-.99-15.61-13.66-28.28-29.27-29.27"/>
                  <path d="M203.67,19.71h-50.47c-1.67,0-3.01,1.35-3.01,3.01v148.01c0,1.03-1.36,1.39-1.87.5L60.96,21.21c-.54-.93-1.53-1.49-2.6-1.49H3.01c-1.66,0-3.01,1.35-3.01,3.01v245.73c0,1.66,1.35,3.01,3.01,3.01h50.47c1.66,0,3.01-1.35,3.01-3.01V121.04c0-1.02,1.35-1.39,1.87-.5l87.35,149.44c.54.93,1.53,1.49,2.6,1.49h55.36c1.67,0,3.01-1.35,3.01-3.01V22.72c0-1.67-1.35-3.01-3.01-3.01"/>
                  <path d="M292.55,79.21c-7.05,1.52-14.56,2.34-22.36,2.34s-15.3-.82-22.36-2.34c-1.87-.4-3.64,1.02-3.64,2.94v186.31c0,1.66,1.35,3.01,3.01,3.01h45.97c1.66,0,3.01-1.35,3.01-3.01V82.15c0-1.92-1.77-3.34-3.64-2.94"/>
                  <path d="M739.33,225.37h-105.08c-.55,0-1-.45-1-1v-54.72c0-.55.45-1,1-1h85.76c1.66,0,3.01-1.35,3.01-3.01v-40.07c0-1.66-1.35-3.01-3.01-3.01h-85.76c-.55,0-1-.45-1-1v-54.72c0-.55.45-1,1-1h105.08c1.66,0,3.01-1.35,3.01-3.01V22.72c0-1.67-1.35-3.01-3.01-3.01h-159.57c-1.67,0-3.01,1.35-3.01,3.01v245.73c0,1.66,1.35,3.01,3.01,3.01h159.57c1.66,0,3.01-1.35,3.01-3.01v-40.07c0-1.66-1.35-3.01-3.01-3.01"/>
                  <path d="M541.63,178.19h-53.36c-1.44,0-2.7,1.02-2.96,2.44-2.47,13.59-7.12,24.42-13.94,32.5-7.69,9.1-18.56,13.65-32.63,13.65-10.83,0-20.13-3.31-27.92-9.93-7.79-6.61-13.8-15.96-18.02-28.01-4.22-12.06-6.33-26.36-6.33-42.91s2-30.25,6.01-42.55c4-12.29,9.95-21.86,17.86-28.72,7.9-6.86,17.48-10.28,28.74-10.28,12.77,0,23.16,4.26,31.17,12.77,7.01,7.46,11.87,17.46,14.57,29.99.3,1.37,1.53,2.35,2.94,2.35h53.16c1.89,0,3.3-1.72,2.96-3.58-5.29-28.91-16.13-51.27-32.55-67.06-17.21-16.54-41.29-24.82-72.24-24.82-22.52,0-42.11,5.44-58.77,16.31-16.67,10.87-29.5,26.18-38.48,45.92-8.98,19.74-13.47,42.97-13.47,69.67s4.71,51.24,14.12,70.74c9.42,19.5,22.4,34.46,38.96,44.85,16.56,10.4,35.44,15.6,56.66,15.6s38.2-3.9,52.93-11.7c14.72-7.8,26.62-19.09,35.72-33.87,8.52-13.85,14.48-30.46,17.86-49.83.33-1.85-1.08-3.56-2.96-3.56"/>
                </g>
              </svg>
              {/* Dark mode logo */}
              <svg viewBox="0 0 1953 277.14" xmlns="http://www.w3.org/2000/svg" aria-label="NICE CXone" className="hidden h-[18px] w-auto dark:block">
                <g>
                  <path fill="#fff" d="M1953,146.68c0,89.08-41.99,125.6-144.43,125.6h-336.41c-102.44,0-144.43-36.51-144.43-125.6s41.99-125.6,144.43-125.6h336.41c102.44,0,144.43,36.51,144.43,125.6Z"/>
                  <path fill="#fff" d="M1122.16,178.19h-53.36c-1.44,0-2.7,1.02-2.96,2.44-2.47,13.59-7.12,24.42-13.94,32.51-7.69,9.1-18.56,13.65-32.63,13.65-10.83,0-20.13-3.31-27.92-9.93-7.79-6.62-13.8-15.96-18.02-28.01-4.22-12.06-6.33-26.36-6.33-42.9,0-16.07,2-30.26,6.01-42.55,4-12.29,9.95-21.86,17.86-28.72,7.9-6.85,17.48-10.28,28.74-10.28,12.77,0,23.16,4.26,31.17,12.76,7.01,7.46,11.87,17.46,14.57,29.99.3,1.38,1.53,2.35,2.94,2.35h53.16c1.89,0,3.3-1.72,2.96-3.58-5.29-28.91-16.13-51.27-32.55-67.06-17.21-16.54-41.29-24.82-72.24-24.82-22.52,0-42.1,5.44-58.77,16.31-16.67,10.88-29.5,26.18-38.48,45.92-8.98,19.74-13.47,42.97-13.47,69.68s4.71,51.24,14.12,70.74c9.42,19.5,22.4,34.46,38.96,44.86,16.56,10.4,35.44,15.6,56.66,15.6,20.56,0,38.2-3.9,52.92-11.7,14.72-7.8,26.62-19.09,35.72-33.86,8.52-13.85,14.48-30.46,17.86-49.83.32-1.85-1.08-3.56-2.96-3.56Z"/>
                  <path fill="#fff" d="M1324.25,19.71h-53.45c-1.07,0-2.06.57-2.6,1.5l-41.34,71c-.39.67-1.35.67-1.74,0l-41.34-71c-.54-.93-1.53-1.5-2.6-1.5h-53.45c-2.32,0-3.77,2.52-2.6,4.53l70.36,120.84c.18.31.18.7,0,1.01l-70.36,120.84c-1.17,2.01.28,4.53,2.6,4.53h53.45c1.07,0,2.06-.57,2.6-1.5l41.34-71c.39-.67,1.35-.67,1.74,0l41.34,71c.54.93,1.53,1.5,2.6,1.5h53.45c2.32,0,3.77-2.52,2.6-4.53l-70.36-120.84c-.18-.31-.18-.7,0-1.01l70.36-120.84c1.17-2.01-.28-4.53-2.6-4.53Z"/>
                  <path fill="#3694fd" d="M1459.6,226.86c-15.98,0-29.96-3.24-41.95-9.74-11.98-6.49-21.27-15.78-27.86-27.87-6.59-12.08-9.89-26.41-9.89-43s3.34-31.61,10.04-43.9c6.69-12.29,16.03-21.72,28.01-28.32,11.99-6.59,25.77-9.89,41.35-9.89s29.86,3.4,41.65,10.19c11.78,6.79,20.97,16.28,27.57,28.46,6.59,12.19,9.89,26.77,9.89,43.74s-3.25,30.91-9.74,43c-6.49,12.09-15.58,21.32-27.27,27.72-11.69,6.4-25.62,9.59-41.8,9.59ZM1459,188.51c9.19,0,16.58-1.99,22.17-5.99,5.59-3.99,9.63-9.24,12.13-15.73,2.49-6.49,3.75-13.33,3.75-20.52s-1.25-14.08-3.75-20.67c-2.5-6.59-6.49-12.03-11.99-16.33-5.5-4.29-12.94-6.44-22.32-6.44s-16.28,2.15-21.87,6.44c-5.59,4.3-9.64,9.74-12.13,16.33-2.5,6.59-3.75,13.48-3.75,20.67s1.25,14.28,3.75,20.67c2.5,6.4,6.54,11.59,12.13,15.58,5.59,4,12.88,5.99,21.87,5.99Z"/>
                  <path fill="#3694fd" d="M1568.36,224.76V66.86h39.25l2.1,18.28c4.39-5.39,9.44-9.63,15.13-12.73,5.69-3.09,11.48-5.24,17.38-6.44,5.89-1.2,11.24-1.8,16.03-1.8,15.18,0,27.01,3.3,35.51,9.89,8.49,6.59,14.58,15.43,18.28,26.52,3.69,11.09,5.54,23.42,5.54,37v87.19h-41.95v-81.8c0-4.79-.4-9.59-1.2-14.38-.8-4.79-2.25-9.19-4.35-13.18-2.1-3.99-5.05-7.19-8.84-9.59-3.8-2.4-8.79-3.6-14.98-3.6-7.99,0-14.68,2-20.07,5.99-5.39,4-9.39,9.39-11.99,16.18-2.6,6.79-3.9,14.28-3.9,22.47v77.9h-41.95Z"/>
                  <path fill="#3694fd" d="M1825.73,227.01c-16.58,0-30.67-3.3-42.25-9.89-11.59-6.59-20.48-15.93-26.67-28.01-6.19-12.08-9.29-26.22-9.29-42.4s3.19-30.71,9.59-43c6.39-12.28,15.43-21.92,27.12-28.91,11.69-6.99,25.51-10.49,41.5-10.49,11.99,0,22.52,2,31.61,5.99,9.09,4,16.78,9.59,23.07,16.78,6.29,7.19,10.98,15.53,14.08,25.02,3.09,9.49,4.54,19.73,4.35,30.71,0,2.8-.1,5.5-.3,8.09-.2,2.6-.6,5.2-1.2,7.79h-108.16c.6,5.99,2.29,11.49,5.09,16.48,2.79,5,6.74,8.94,11.83,11.83,5.09,2.9,11.43,4.35,19.03,4.35,4.99,0,9.59-.55,13.78-1.65,4.19-1.1,7.79-2.85,10.79-5.24,3-2.4,5.09-5.19,6.29-8.39h41.35c-2.6,11.79-7.44,21.47-14.53,29.06-7.09,7.59-15.63,13.14-25.62,16.63-9.99,3.49-20.48,5.24-31.46,5.24ZM1790.07,129.33h68.61c-.2-5.39-1.55-10.44-4.05-15.13-2.5-4.69-6.19-8.49-11.09-11.39-4.9-2.89-11.14-4.34-18.73-4.34s-13.93,1.5-19.03,4.49c-5.09,3-8.89,6.84-11.39,11.54-2.5,4.7-3.95,9.64-4.34,14.83Z"/>
                  <path fill="#fff" d="M272.23.06c-18.93-1.2-34.54,14.41-33.34,33.34.99,15.61,13.66,28.28,29.27,29.27,18.93,1.19,34.54-14.41,33.34-33.34-.99-15.61-13.66-28.28-29.27-29.27"/>
                  <path fill="#fff" d="M203.67,19.71h-50.47c-1.67,0-3.01,1.35-3.01,3.01v148.01c0,1.03-1.36,1.39-1.87.5L60.96,21.21c-.54-.93-1.53-1.49-2.6-1.49H3.01c-1.66,0-3.01,1.35-3.01,3.01v245.73c0,1.66,1.35,3.01,3.01,3.01h50.47c1.66,0,3.01-1.35,3.01-3.01V121.04c0-1.02,1.35-1.39,1.87-.5l87.35,149.44c.54.93,1.53,1.49,2.6,1.49h55.36c1.67,0,3.01-1.35,3.01-3.01V22.72c0-1.67-1.35-3.01-3.01-3.01"/>
                  <path fill="#fff" d="M292.55,79.21c-7.05,1.52-14.56,2.34-22.36,2.34s-15.3-.82-22.36-2.34c-1.87-.4-3.64,1.02-3.64,2.94v186.31c0,1.66,1.35,3.01,3.01,3.01h45.97c1.66,0,3.01-1.35,3.01-3.01V82.15c0-1.92-1.77-3.34-3.64-2.94"/>
                  <path fill="#fff" d="M739.33,225.37h-105.08c-.55,0-1-.45-1-1v-54.72c0-.55.45-1,1-1h85.76c1.66,0,3.01-1.35,3.01-3.01v-40.07c0-1.66-1.35-3.01-3.01-3.01h-85.76c-.55,0-1-.45-1-1v-54.72c0-.55.45-1,1-1h105.08c1.66,0,3.01-1.35,3.01-3.01V22.72c0-1.67-1.35-3.01-3.01-3.01h-159.57c-1.67,0-3.01,1.35-3.01,3.01v245.73c0,1.66,1.35,3.01,3.01,3.01h159.57c1.66,0,3.01-1.35,3.01-3.01v-40.07c0-1.66-1.35-3.01-3.01-3.01"/>
                  <path fill="#fff" d="M541.63,178.19h-53.36c-1.44,0-2.7,1.02-2.96,2.44-2.47,13.59-7.12,24.42-13.94,32.5-7.69,9.1-18.56,13.65-32.63,13.65-10.83,0-20.13-3.31-27.92-9.93-7.79-6.61-13.8-15.96-18.02-28.01-4.22-12.06-6.33-26.36-6.33-42.91s2-30.25,6.01-42.55c4-12.29,9.95-21.86,17.86-28.72,7.9-6.86,17.48-10.28,28.74-10.28,12.77,0,23.16,4.26,31.17,12.77,7.01,7.46,11.87,17.46,14.57,29.99.3,1.37,1.53,2.35,2.94,2.35h53.16c1.89,0,3.3-1.72,2.96-3.58-5.29-28.91-16.13-51.27-32.55-67.06-17.21-16.54-41.29-24.82-72.24-24.82-22.52,0-42.11,5.44-58.77,16.31-16.67,10.87-29.5,26.18-38.48,45.92-8.98,19.74-13.47,42.97-13.47,69.67s4.71,51.24,14.12,70.74c9.42,19.5,22.4,34.46,38.96,44.85,16.56,10.4,35.44,15.6,56.66,15.6s38.2-3.9,52.93-11.7c14.72-7.8,26.62-19.09,35.72-33.87,8.52-13.85,14.48-30.46,17.86-49.83.33-1.85-1.08-3.56-2.96-3.56"/>
                </g>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatStatusDuration(totalSeconds: number) {
  const normalizedTotalSeconds = Math.max(0, totalSeconds);
  const hours = Math.floor(normalizedTotalSeconds / 3600) % 100;
  const minutes = Math.floor((normalizedTotalSeconds % 3600) / 60);
  const seconds = normalizedTotalSeconds % 60;

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

function formatConversationReplyTime(date: Date) {
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function generateSimulatedCustomerReply(conversation: SharedConversationData, agentMessage: string): string | { content: string; starRating?: number; aiAction?: ConversationMessage["aiAction"] } {
  const normalizedMessage = agentMessage.toLowerCase();
  const latestCustomerContext = [...conversation.messages]
    .reverse()
    .find((message) => message.role === "customer")
    ?.content.toLowerCase() ?? "";

  // ── Marcus Webb — happy reply after any resolution (refund/reship/intercept) ──
  if (
    conversation.customerName === "Marcus Webb" &&
    (normalizedMessage.includes("refund") || normalizedMessage.includes("processed") ||
     normalizedMessage.includes("reship") || normalizedMessage.includes("overnight") ||
     normalizedMessage.includes("intercept") || normalizedMessage.includes("redirect") ||
     normalizedMessage.includes("new order") || normalizedMessage.includes("on its way") ||
     normalizedMessage.includes("replacement")) &&
    (normalizedMessage.includes("wb-88214") || normalizedMessage.includes("order") ||
     normalizedMessage.includes("austin") || normalizedMessage.includes("sweater") ||
     normalizedMessage.includes("marcus") || normalizedMessage.includes("saturday"))
  ) {
    return {
      content: "Thank you so much! I really appreciate it.",
      starRating: 5,
      aiAction: {
        label: "Resolve & Close Case",
        description: "Customer gave a 5-star rating. Auto-resolve, dismiss, and unassign this case.",
        actionId: "auto-resolve-dismiss",
      },
    };
  }

  // ── Fraud / takeover handoff — Jeff introducing himself after Sofia's case ──
  if (
    (normalizedMessage.includes("monitoring") || normalizedMessage.includes("been following") || normalizedMessage.includes("been watching") || normalizedMessage.includes("stepped in")) &&
    (normalizedMessage.includes("fraud") || normalizedMessage.includes("credit") || normalizedMessage.includes("protected") || normalizedMessage.includes("dispute") || normalizedMessage.includes("seriously"))
  ) {
    return "Thank you so much! I really appreciate it. I'm just relieved this is being taken care of — I was honestly so scared earlier.";
  }

  if (
    normalizedMessage.includes("i'm jeff") || normalizedMessage.includes("i am jeff") ||
    normalizedMessage.includes("this is jeff") || normalizedMessage.includes("my name is jeff")
  ) {
    return "Thank you so much, Jeff! I'm so glad you were able to help. I feel a lot better knowing it's being handled.";
  }

  if (
    normalizedMessage.includes("screenshot") ||
    normalizedMessage.includes("screen shot") ||
    normalizedMessage.includes("photo") ||
    normalizedMessage.includes("image")
  ) {
    return "Yes — I can send a screenshot of the error. Do you want the full page or just the payment section?";
  }

  if (normalizedMessage.includes("refresh") || normalizedMessage.includes("reload")) {
    if (
      latestCustomerContext.includes("same error") ||
      latestCustomerContext.includes("billing mismatch") ||
      latestCustomerContext.includes("doesn't match")
    ) {
      return "I refreshed and tried it again, but I am still seeing the same billing mismatch message on my side.";
    }

    return "I refreshed and retried it just now, but the upgrade is still not going through.";
  }

  if (normalizedMessage.includes("retry") || normalizedMessage.includes("try again") || normalizedMessage.includes("try it again")) {
    if (normalizedMessage.includes("without leaving") || normalizedMessage.includes("stay in this conversation")) {
      return "Okay, I am retrying it now while staying in this chat. I will tell you exactly what happens.";
    }

    return "I just retried it and I am still getting blocked at the same step.";
  }

  if (normalizedMessage.includes("flag") || normalizedMessage.includes("block") || normalizedMessage.includes("cleared")) {
    return "I just tried it again and it worked this time. Thank you for getting that cleared so quickly.";
  }

  if (normalizedMessage.includes("zip") || normalizedMessage.includes("billing")) {
    return "That could be it. I recently moved, so the billing zip code may still be the old one. Where should I update it?";
  }

  if (normalizedMessage.includes("charged twice") || normalizedMessage.includes("double charge")) {
    return "That is my main concern too. I just want to make sure I will not end up with a duplicate charge if I retry it.";
  }

  if (normalizedMessage.includes("payment link") || normalizedMessage.includes("secure link")) {
    return "Yes, a payment link would be helpful. Please send it over and I will complete it right away.";
  }

  if (normalizedMessage.includes("email") || normalizedMessage.includes("inbox")) {
    return "Perfect — please send it over and I will watch for it in my inbox.";
  }

  if (normalizedMessage.includes("send") && normalizedMessage.includes("over")) {
    return "Yes, please send that over. I can review it right away once it comes through.";
  }

  if (normalizedMessage.includes("card") || normalizedMessage.includes("visa") || normalizedMessage.includes("payment")) {
    return "Understood. I have the same card ready to use again. Should I retry it now, or is there anything I should update first?";
  }

  if (normalizedMessage.includes("upgrade") || normalizedMessage.includes("subscription") || normalizedMessage.includes("pro tier")) {
    return "Okay, thanks. I mainly want to make sure the upgrade goes through today and that I do not get charged twice.";
  }

  if (normalizedMessage.includes("meeting") || normalizedMessage.includes("today") || normalizedMessage.includes("urgent")) {
    return "Thank you — I am on a bit of a deadline, so I appreciate you staying on this with me.";
  }

  return "Thanks for the update. That helps. What should I do next on my side?";
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<AgentStatus>("Offline");
  const [showLoginBriefing, setShowLoginBriefing] = useState(true);
  const [briefingClosing, setBriefingClosing] = useState(false);
  const [isBriefingDismissed, setIsBriefingDismissed] = useState(false);
  const [trendSlide, setTrendSlide] = useState(0);

  const closeBriefing = (callback?: () => void) => {
    setBriefingClosing(true);
    setTimeout(() => {
      callback?.();
      setShowLoginBriefing(false);
      setBriefingClosing(false);
      setIsBriefingDismissed(true);
    }, 280);
  };
  const [isLeftRailOpen, setIsLeftRailOpen] = useState(false);
  const [incomingNotifications, setIncomingNotifications] = useState<QueuePreviewItem[]>([]);
  // Auto-open the left rail whenever a new incoming assignment arrives.
  const prevIncomingCountRef = useRef(0);
  useEffect(() => {
    if (incomingNotifications.length > prevIncomingCountRef.current) {
      setIsLeftRailOpen(true);
    }
    prevIncomingCountRef.current = incomingNotifications.length;
  }, [incomingNotifications.length]);
  /** Notification IDs (by customerRecordId) where the agent has taken an action (monitor, takeover, review, launch call, etc.). */
  const [actedOnNotifications, setActedOnNotifications] = useState<Set<string>>(new Set());
  /** Lead notifications that persist on the Home tab even after the toast is dismissed. */
  const [activeLeadNotifications, setActiveLeadNotifications] = useState<QueuePreviewItem[]>([]);
  /** Assignment IDs that should display in history-only mode (no channel tabs, Customer History active). */
  const [historyOnlyAssignmentIds, setHistoryOnlyAssignmentIds] = useState<Set<string>>(new Set());
  /** Increment to imperatively expand the Case Overview accordion in the active DockedConversationPanel. */
  const [caseOverviewOpenTrigger, setCaseOverviewOpenTrigger] = useState(0);

  const [pendingMonitorCaseId, setPendingMonitorCaseId] = useState<string | null>(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const clearPendingMonitorCaseId = useMemo(() => () => setPendingMonitorCaseId(null), []);
  const [pendingTakeoverCaseId, setPendingTakeoverCaseId] = useState<string | null>(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const clearPendingTakeoverCaseId = useMemo(() => () => setPendingTakeoverCaseId(null), []);

  // Global escalation modal — renders on any page when agent clicks Review from a toast
  const [escalatedToastModal, setEscalatedToastModal] = useState<EscalatedCaseModalData | null>(null);
  // Dismissal confirmation toast — shown bottom-right when agent clicks Dismiss after resolving a case
  const [dismissalToast, setDismissalToast] = useState<{ customerName: string; customerId: string; status: string; resolvedStatus: string; actions: string[]; preview: string; botType: string; channel: string } | null>(null);

  // 5 s after the agent dismisses the login briefing, push the escalated-case notification.
  // Track how many cases are currently escalated (for the left rail badge + tooltip).
  const [escalatedRailCount, setEscalatedRailCount] = useState(0);
  // Keep agentStatusRef in sync so the BroadcastChannel HELLO handler can read the live status.
  useEffect(() => { agentStatusRef.current = status; }, [status]);
  /** True while the Scenario Controller tab is open and connected. Disables the built-in auto-timers. */
  const [isControllerConnected, setIsControllerConnected] = useState(false);
  const scenarioChannelRef = useRef<BroadcastChannel | null>(null);
  /** Ref mirror of `status` so the BroadcastChannel handler reads the live value without a stale closure. */
  const agentStatusRef = useRef<AgentStatus>("Offline");

  // Scenario escalations are controlled exclusively by the Scenario Controller tab.
  // The standalone auto-fire timers have been removed — scenarios only fire via
  // fireJordanEscalation / fireSofiaEscalation / fireMarcusEscalation (called on TRIGGER msg).
  const [isJordanResolved, setIsJordanResolved] = useState(false);
  const [isSofiaResolved, setIsSofiaResolved] = useState(false);
  const [isMarcusResolved, setIsMarcusResolved] = useState(false);

  // Broadcast resolved status to the Scenario Controller whenever a case resolves.
  useEffect(() => {
    if (!isJordanResolved) return;
    jordanResolvedFlag = true;
    scenarioChannelRef.current?.postMessage({ type: "CASE_STATUS", case: "jordan", status: "resolved" } satisfies AppMsg);
  }, [isJordanResolved]);
  useEffect(() => {
    if (!isSofiaResolved) return;
    sofiaResolvedFlag = true;
    scenarioChannelRef.current?.postMessage({ type: "CASE_STATUS", case: "sofia", status: "resolved" } satisfies AppMsg);
  }, [isSofiaResolved]);
  useEffect(() => {
    if (!isMarcusResolved) return;
    marcusResolvedFlag = true;
    scenarioChannelRef.current?.postMessage({ type: "CASE_STATUS", case: "marcus", status: "resolved" } satisfies AppMsg);
  }, [isMarcusResolved]);

  const [incomingChatNotifications, setIncomingChatNotifications] = useState<AgentChatNotification[]>([]);
  const [chatInitialConversationId, setChatInitialConversationId] = useState<string | undefined>(undefined);
  const [chatPendingAgent, setChatPendingAgent] = useState<{ id: string; name: string; initials: string; role: string; avatarColor?: string; status?: "online" | "away" | "offline" } | null>(null);
  const [chatAutoStartCall, setChatAutoStartCall] = useState(false);
  const [activeRightPanel, setActiveRightPanel] = useState<RightPanelView>(null);
  const [deskPanelSelection, setDeskPanelSelection] = useState<DeskPanelSelection>(null);
  const [isChatPopoverOpen, setIsChatPopoverOpen] = useState(false);
  const [chatPopunderPosition, setChatPopunderPosition] = useState(() => ({ x: 0, y: 0 }));
  const [chatPopunderSize, setChatPopunderSize] = useState(() => ({
    width: 360,
    height: typeof window === "undefined" ? 720 : Math.max(420, window.innerHeight - 80),
  }));
  const [isNotificationsPopoverOpen, setIsNotificationsPopoverOpen] = useState(false);
  const [notificationsPopunderPosition, setNotificationsPopunderPosition] = useState(() => ({ x: 0, y: 0 }));
  const [notificationsPopunderSize, setNotificationsPopunderSize] = useState(() => ({
    width: 360,
    height: typeof window === "undefined" ? 520 : Math.min(Math.max(360, window.innerHeight - 120), 600),
  }));
  const [notificationsData, setNotificationsData] = useState<AppNotification[]>(seedNotifications);
  const [isAddNewPopoverOpen, setIsAddNewPopoverOpen] = useState(false);
  const [isAddNewFlowOpen, setIsAddNewFlowOpen] = useState(false);
  const [addNewFlowAnchorRect, setAddNewFlowAnchorRect] = useState<DOMRect | null>(null);
  const [isCopilotPopoverOpen, setIsCopilotPopoverOpen] = useState(true);

  // Animated-presence wrappers – keep popunders mounted during exit animations.
  const notificationsPresence = useAnimatedPresence(isNotificationsPopoverOpen);
  const chatPresence = useAnimatedPresence(isChatPopoverOpen);
  const addNewPresence = useAnimatedPresence(isAddNewPopoverOpen);

  const [deskCanvasPopunderView, setDeskCanvasPopunderView] = useState<DeskCanvasView | null>(null);
  const deskCanvasPresence = useAnimatedPresence(!!deskCanvasPopunderView);
  // Independent popovers for Directory ("desk") and Copilot so they can be open simultaneously
  const [isDeskViewPopunderOpen, setIsDeskViewPopunderOpen] = useState(false);
  const [deskViewPopunderPosition, setDeskViewPopunderPosition] = useState<DeskCanvasPopunderPosition>(() => ({ x: 0, y: 0 }));
  const [deskViewPopunderSize, setDeskViewPopunderSize] = useState<DeskCanvasPopunderSize>(() => ({
    width: DESK_CANVAS_POPOUNDER_DESK_DEFAULT_WIDTH,
    height: typeof window === "undefined" ? 720 : Math.max(DESK_CANVAS_POPOUNDER_MIN_HEIGHT, window.innerHeight - 80),
  }));
  const [isCopilotViewPopunderOpen, setIsCopilotViewPopunderOpen] = useState(false);
  const copilotPopunderPresence = useAnimatedPresence(isCopilotViewPopunderOpen);
  const [copilotViewPopunderPosition, setCopilotViewPopunderPosition] = useState<DeskCanvasPopunderPosition>(() => ({ x: 0, y: 0 }));
  const [copilotViewPopunderSize, setCopilotViewPopunderSize] = useState<DeskCanvasPopunderSize>(() => ({
    width: getDeskCanvasPopunderDefaultWidth("copilot"),
    height: typeof window === "undefined" ? 720 : Math.max(DESK_CANVAS_POPOUNDER_MIN_HEIGHT, window.innerHeight - 80),
  }));
  const [isPageEntered, setIsPageEntered] = useState(false);
  const [contentRevealTrigger, setContentRevealTrigger] = useState(0);
  const [addNewPopunderPosition, setAddNewPopunderPosition] = useState(() => ({ x: 0, y: 0 }));
  const [addNewPopunderSize, setAddNewPopunderSize] = useState(() => ({
    width: 360,
    height: typeof window === "undefined" ? 720 : Math.max(420, window.innerHeight - 80),
  }));
  const [copilotPopunderPosition, setCopilotPopunderPosition] = useState(() => ({ x: 0, y: 0 }));
  const [copilotPopunderSize, setCopilotPopunderSize] = useState(() => ({
    width: 315,
    height: typeof window === "undefined" ? 720 : Math.max(420, window.innerHeight - 80),
  }));
  const [deskCanvasPopunderPosition, setDeskCanvasPopunderPosition] = useState<DeskCanvasPopunderPosition>(() => ({ x: 0, y: 0 }));
  const [deskCanvasPopunderSize, setDeskCanvasPopunderSize] = useState<DeskCanvasPopunderSize>(() => ({
    width: DESK_CANVAS_POPOUNDER_DESK_DEFAULT_WIDTH,
    height: typeof window === "undefined" ? 720 : Math.max(DESK_CANVAS_POPOUNDER_MIN_HEIGHT, window.innerHeight - 80),
  }));
  // Transcript popunder state
  // Post-call history mode: entered when a voice call is dispositioned.
  // The voice assignment stays in the visible list (so the customer panel remains open) but
  // openChannels is overridden to [] so the panel auto-switches to the History tab.
  // The assignment is fully cleaned up when the agent navigates away or closes the panel.
  const [isPostCallHistoryMode, setIsPostCallHistoryMode] = useState(false);
  const postCallAssignmentIdRef = useRef<string | null>(null);

  const [isTranscriptPopunderOpen, setIsTranscriptPopunderOpen] = useState(false);
  const [transcriptPopunderPosition, setTranscriptPopunderPosition] = useState<TranscriptPopunderPosition>(() => ({
    x: typeof window !== "undefined" ? Math.max(16, window.innerWidth - 400 - 16) : 400,
    y: 80,
  }));
  const [transcriptPopunderSize, setTranscriptPopunderSize] = useState<TranscriptPopunderSize>({ width: 380, height: 520 });
  const [transcriptDragActivation, setTranscriptDragActivation] = useState<CopilotDragActivation | null>(null);
  const [transcriptLines, setTranscriptLines] = useState<TranscriptLine[]>([]);
  const transcriptCallStartRef = useRef<number | null>(null);
  const transcriptTimerRef = useRef<number | null>(null);
  // For Terry's call, the demo doesn't auto-start — it waits for the agent to click an opening line.
  const [terryDemoStarted, setTerryDemoStarted] = useState(false);
  // Controls whether the right-side transcript panel is visible (user can close it and re-open via toggle).
  const [isTranscriptVisible, setIsTranscriptVisible] = useState(true);
  // Dynamically appended customer history items (e.g. "Lead Form Created" after saving the lead).
  const [dynamicHistoryItems, setDynamicHistoryItems] = useState<CustomerHistoryItem[]>([]);
  const [isCopilotDockingAllowed, setIsCopilotDockingAllowed] = useState(
    () => typeof window === "undefined" ? true : window.innerWidth >= COPILOT_DOCK_BREAKPOINT,
  );
  const [isCopilotDocked, setIsCopilotDocked] = useState(
    () => typeof window === "undefined" ? true : window.innerWidth >= COPILOT_DOCK_BREAKPOINT,
  );
  const [isCombinedInteractionPanelEnabled, setIsCombinedInteractionPanelEnabled] = useState(
    () => typeof window === "undefined" ? false : window.innerWidth < COMBINED_INTERACTION_PANEL_BREAKPOINT,
  );
  const [isCombinedInteractionPanelCanvasEnabled, setIsCombinedInteractionPanelCanvasEnabled] = useState(
    () => typeof window === "undefined" ? false : window.innerWidth < COMBINED_INTERACTION_PANEL_CANVAS_BREAKPOINT,
  );
  const [copilotDragActivation, setCopilotDragActivation] = useState<CopilotDragActivation | null>(null);
  const [deskCanvasDragActivation, setDeskCanvasDragActivation] = useState<CopilotDragActivation | null>(null);
  const [statusStartedAt, setStatusStartedAt] = useState(() => Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(
    () => localStorage.getItem("agentDarkMode") === "true",
  );
  const [workspaceOptions, setWorkspaceOptions] = useState(initialWorkspaceOptions);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<WorkspaceOption["id"]>("control-panel");
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const workspaceMenuTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openWorkspaceMenu = () => {
    if (workspaceMenuTimeout.current) clearTimeout(workspaceMenuTimeout.current);
    setWorkspaceMenuOpen(true);
  };
  const closeWorkspaceMenu = () => {
    workspaceMenuTimeout.current = setTimeout(() => setWorkspaceMenuOpen(false), 120);
  };
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const statusMenuTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openStatusMenu = () => {
    if (statusMenuTimeout.current) clearTimeout(statusMenuTimeout.current);
    setStatusMenuOpen(true);
  };
  const closeStatusMenu = () => {
    statusMenuTimeout.current = setTimeout(() => { setStatusMenuOpen(false); setIsConnectedAppsOpen(false); }, 120);
  };
  const [notificationCount, setNotificationCount] = useState(0);
  // Pre-seed with the unread messages already in the chat (Sarah Kim 2 + Emma Larsen 1 + Risk & Compliance 3 = 6)
  const [chatUnreadCount, setChatUnreadCount] = useState(6);
  const [assignmentItemsById, setAssignmentItemsById] = useState<Record<string, QueuePreviewItem>>({});
  const [visibleAssignmentIds, setVisibleAssignmentIds] = useState<QueuePreviewItem["id"][]>([]);
  const [pendingAcceptanceIds, setPendingAcceptanceIds] = useState<Set<string>>(new Set());
  const [completedTodayCount, setCompletedTodayCount] = useState(0);
  const [resolvedAssignments, setResolvedAssignments] = useState<ResolvedAssignment[]>([]);
  const [isConversationPanelOpen, setIsConversationPanelOpen] = useState(true);
  // Tracks assignments whose channel has been removed — shows task summary in the panel
  const [taskSummaryIds, setTaskSummaryIds] = useState<Set<string>>(new Set());
  // Tracks assignments opened via the "Review" button — summary auto-expands for these
  const [reviewedAssignmentIds, setReviewedAssignmentIds] = useState<Set<string>>(new Set());
  // Tracks cases where the agent has explicitly closed the summary panel
  const [closedSummaryIds, setClosedSummaryIds] = useState<Set<string>>(new Set());
  // Tracks assignment IDs where the agent has sent at least one message on a "new" channel.
  // Once activated the delete icon is hidden — the channel has real content and can't be discarded.
  const [activatedChannelIds, setActivatedChannelIds] = useState<Set<string>>(new Set());

  const [conversationStatesByKey, setConversationStatesByKey] = useState<Record<string, SharedConversationData>>(() => ({
    [getConversationStateKey(initialSelectedAssignmentId)]: defaultConversationState,
  }));

  // Derives the latest customer message per assignment from live conversation state,
  // so assignment card rows always reflect the most recent customer comment.
  const liveLastCustomerCommentByAssignmentId = useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const [assignmentId, state] of Object.entries(conversationStatesByKey)) {
      const last = [...state.messages].reverse().find((m) => m.role === "customer" && !m.isInternal);
      if (last) map[assignmentId] = last.content;
    }
    return map;
  }, [conversationStatesByKey]);
  const [dockedConversationWidth, setDockedConversationWidth] = useState(() =>
    getBalancedDockedPanelWidths({
      hasDesktopRightPanel: false,
      reserveMainWorkspace: false,
      showConversation: true,
      showCustomerInfo: false,
      hasMainCanvas: false,
    }).conversationWidth,
  );
  const [isConversationPopunderOpen, setIsConversationPopunderOpen] = useState(false);
  const conversationPopunderPresence = useAnimatedPresence(isConversationPopunderOpen);
  const [isCustomerInfoPanelOpen, setIsCustomerInfoPanelOpen] = useState(false);
  // When true, the customer info popunder is docked adjacent (to the right) of the
  // conversation panel on the activity route, rather than floating freely.
  const [isCustomerInfoDockedToConversation, setIsCustomerInfoDockedToConversation] = useState(false);
  const [isTranscriptDockedToConversation, setIsTranscriptDockedToConversation] = useState(false);
  // Within dock-mode, whether the panel is currently shown (toggled by the header icon).
  // Shared by both customer-info and transcript docking (they are mutually exclusive).
  const [isConversationDockedPanelOpen, setIsConversationDockedPanelOpen] = useState(true);
  const [dockedCustomerInfoWidth, setDockedCustomerInfoWidth] = useState(() =>
    getBalancedDockedPanelWidths({
      hasDesktopRightPanel: false,
      reserveMainWorkspace: false,
      showConversation: true,
      showCustomerInfo: false,
      hasMainCanvas: false,
    }).customerInfoWidth,
  );
  const [isCustomerInfoPopunderOpen, setIsCustomerInfoPopunderOpen] = useState(false);
  const [isCustomerInfoIconPopoverOpen, setIsCustomerInfoIconPopoverOpen] = useState(false);
  // Takeover-only popunder: shows CustomerInfoPopunder without touching isCustomerInfoPanelOpen
  // so the layout (docked panel widths) is never affected.
  const [isTakeoverInfoOpen, setIsTakeoverInfoOpen] = useState(false);
  // Epoch timestamp (ms) of the most recent takeover-open. Passed to CustomerInfoPopunder
  // to drive the elapsed-time header chip. Cleared when opened via icon (non-takeover path).
  const [customerInfoTakeoverStartTime, setCustomerInfoTakeoverStartTime] = useState<number | null>(null);
  // Blue AI overview card shown at the top of the Overview tab when a case is taken over.
  const [customerInfoTakeoverCard, setCustomerInfoTakeoverCard] = useState<{ botType: string; botAvatarUrl: string; customerContext: string; aiConfidence: number; aiConfidenceReason: string } | null>(null);
  const [isCustomerInfoPanelAllowed, setIsCustomerInfoPanelAllowed] = useState(
    () => typeof window === "undefined" ? true : window.innerWidth >= CUSTOMER_INFO_PANEL_BREAKPOINT,
  );
  const dockedConversationWidthRef = useRef(dockedConversationWidth);
  const dockedCustomerInfoWidthRef = useRef(dockedCustomerInfoWidth);
  const [combinedInteractionPanelTab, setCombinedInteractionPanelTab] = useState<CombinedInteractionPanelTab>("conversation");
  const [conversationDragActivation, setConversationDragActivation] = useState<CopilotDragActivation | null>(null);
  const [customerInfoDragActivation, setCustomerInfoDragActivation] = useState<CopilotDragActivation | null>(null);
  // Tracks whether the customer info popunder has ever been given a real position (so re-opens stay in place).
  const customerInfoHasBeenPositionedRef = useRef(false);
  const customerInfoPopunderRef = useRef<CustomerInfoPopunderHandle>(null);
  const wasExpandedCanvasRouteRef = useRef(false);
  const [floatingPanelOrder, setFloatingPanelOrder] = useState<FloatingPanelId[]>([
    "call",
    "addNew",
    "notifications",
    "chat",
    "conversation",
    "customerInfo",
    "deskCanvas",
    "transcript",
  ]);
  const [conversationPopunderSize, setConversationPopunderSize] = useState<ConversationPopunderSize>({ width: 315, height: 720 });
  const [conversationPopunderPosition, setConversationPopunderPosition] = useState<ConversationPopunderPosition>(() => ({
    x: 84,
    y: 72,
  }));
  const [customerInfoPopunderSize, setCustomerInfoPopunderSize] = useState<CustomerInfoPopunderSize>({ width: 360, height: 600 });
  // Ref so getAnchoredCustomerInfoPopunderPosition can read the latest size without
  // capturing it in useMemo/useEffect dep arrays (prevents context invalidation on resize).
  const customerInfoPopunderSizeRef = useRef(customerInfoPopunderSize);
  useEffect(() => { customerInfoPopunderSizeRef.current = customerInfoPopunderSize; }, [customerInfoPopunderSize]);
  // Tracks the measured bottom of the conversation panel header, updated on takeover events.
  // Used to position the Customer Info popunder just below the conversation tabs.
  const conversationPanelHeaderBottomRef = useRef(120);
  const [customerInfoPopunderPosition, setCustomerInfoPopunderPosition] = useState<CustomerInfoPopunderPosition>(() => ({
    x: typeof window !== "undefined" ? window.innerWidth - 360 - CUSTOMER_INFO_POPOUNDER_MARGIN : 420,
    y: 120,
  }));
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<QueuePreviewItem["id"]>(() => initialSelectedAssignmentId);
  const [overviewOpenByAssignmentId, setOverviewOpenByAssignmentId] = useState<Record<string, boolean>>({});
  const [assignmentStatusesById, setAssignmentStatusesById] = useState<Record<string, QueueAssignmentStatus>>(() => (
    Object.fromEntries(queuePreviewItems.map((item) => [item.id, "open"])) as Record<string, QueueAssignmentStatus>
  ));
  const [activeCallAssignmentId, setActiveCallAssignmentId] = useState<QueuePreviewItem["id"] | null>(null);
  const [recentInteractions, setRecentInteractions] = useState<RecentInteractionItem[]>([]);
  const [pendingCallCustomerRecordId, setPendingCallCustomerRecordId] = useState(initialSelectedAssignment.customerRecordId);
  const [isCallPopunderOpen, setIsCallPopunderOpen] = useState(false);
  const [pendingCallAccountNumber, setPendingCallAccountNumber] = useState("");
  const [launchingLeadId, setLaunchingLeadId] = useState<string | null>(null);
  const leadLaunchTimerRef = useRef<number | null>(null);

  /**
   * Shared lead-call launch logic — starts the 2-second connecting delay, then
   * transitions into the in-call state. Used by both the toast's Launch Call button
   * and the Home tab alert's Launch Call button.
   */
  const launchLeadCall = useCallback((item: QueuePreviewItem) => {
    if (leadLaunchTimerRef.current !== null) {
      window.clearTimeout(leadLaunchTimerRef.current);
    }
    if (item.customerRecordId === "terry") {
      setPendingCallAccountNumber("NF-408-0174");
    }
    setPendingCallCustomerRecordId(item.customerRecordId);
    setLaunchingLeadId(item.id);
    const capturedLeadItem = item;
    leadLaunchTimerRef.current = window.setTimeout(() => {
      leadLaunchTimerRef.current = null;
      layoutContextValue.startCallStatus();

      // If a history-only voice assignment already exists for this customer (created
      // by "Review Lead"), reuse it instead of creating a duplicate.
      // Use refs to get the current state (this callback has an empty dep array).
      const currentVisibleIds = visibleAssignmentIdsRef.current;
      const currentItemsById = assignmentItemsByIdRef.current;
      const currentHistoryOnlyIds = historyOnlyAssignmentIdsRef.current;
      const existingVoiceAssignment = currentVisibleIds
        .map((id) => currentItemsById[id])
        .find(
          (a) =>
            a?.customerRecordId === capturedLeadItem.customerRecordId &&
            a?.channel === "voice" &&
            currentHistoryOnlyIds.has(a.id),
        );

      let voiceAssignmentId: string;
      if (existingVoiceAssignment) {
        // Clear history-only flag so the channel row becomes visible in the rail
        setHistoryOnlyAssignmentIds((prev) => {
          const next = new Set(prev);
          next.delete(existingVoiceAssignment.id);
          return next;
        });
        setSelectedAssignmentId(existingVoiceAssignment.id);
        voiceAssignmentId = existingVoiceAssignment.id;
      } else {
        const nextVoiceAssignment = openCustomerConversation(capturedLeadItem.customerRecordId, "voice");
        voiceAssignmentId = nextVoiceAssignment.id;
      }
      setActiveCallAssignmentId(voiceAssignmentId);
      setPendingCallAccountNumber("");
      setIsLeftRailOpen(true);
      navigate("/activity");
      setCopilotPopunderPosition(getAnchoredCopilotPopunderPosition());
      setIsCopilotPopoverOpen(true);
      // Pre-populate the Customer Information takeover card data so it's ready when the agent
      // manually opens the panel, but don't auto-open the popunder on takeover.
      const li = capturedLeadItem.leadIntelligence;
      if (li) {
        const ariaAvatarUrl = "https://cdn.builder.io/api/v1/image/assets%2F9d3d716b4b844ab4bcf3267b33310813%2F054057b71e64441097a4902d7dcea754?format=webp&width=800&height=1200";
        setCustomerInfoTakeoverCard({
          botType: capturedLeadItem.label ?? "Aria",
          botAvatarUrl: ariaAvatarUrl,
          customerContext: li.ariaMessage ?? li.formMessage,
          aiConfidence: li.aiConfidence ?? 78,
          aiConfidenceReason: li.aiConfidenceReason ?? "Based on 3 similar resolved cases and firmware documentation match.",
        });
        setCustomerInfoTakeoverStartTime(Date.now());
      }
      setLaunchingLeadId(null);
      // Dismiss both the toast and the Home tab alert
      setIncomingNotifications((prev) => prev.filter((n) => n.id !== capturedLeadItem.id));
      layoutContextValue.dismissLeadNotification(capturedLeadItem.customerRecordId);
    }, 2000) as unknown as number;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [callPopunderMode, setCallPopunderMode] = useState<CallPopunderMode>("setup");
  const [isJoiningCallPopunder, setIsJoiningCallPopunder] = useState(false);
  const [joiningCallCustomerName, setJoiningCallCustomerName] = useState("");
  const [joiningCallAssignmentId, setJoiningCallAssignmentId] = useState<string | null>(null);
  const [callPopunderSize, setCallPopunderSize] = useState<CallPopunderSize>({ width: 360, height: 520 });
  const [callPopunderPosition, setCallPopunderPosition] = useState<CallPopunderPosition>(() => {
    if (typeof window === "undefined") {
      return { x: 24, y: 24 };
    }

    return {
      x: Math.max(window.innerWidth - (CALL_POPUNDER_WIDTH + 24), CALL_POPUNDER_MARGIN),
      y: CALL_POPUNDER_MARGIN,
    };
  });
  const previousAgentStatusRef = useRef<Exclude<AgentStatus, "In a Call">>("Available");
  const callConnectTimeoutRef = useRef<number | null>(null);
  const customerReplyTimeoutsRef = useRef<Record<string, number>>({});
  // Persists conversation state when a channel is trashed so it can be restored on reopen.
  // Key: `${customerRecordId}::${channel}`
  const channelStateArchiveRef = useRef<Map<string, SharedConversationData>>(new Map());
  const bellButtonRef = useRef<HTMLDivElement | null>(null);
  const chatButtonRef = useRef<HTMLDivElement | null>(null);
  const addNewButtonRef = useRef<HTMLDivElement | null>(null);
  const copilotButtonRef = useRef<HTMLDivElement | null>(null);
  const [isConnectedAppsOpen, setIsConnectedAppsOpen] = useState(false);
  const [degradedAppCount, setDegradedAppCount] = useState(
    () => initialConnectedApps.filter((a) => a.status !== "healthy").length,
  );

  useEffect(() => {
    setElapsedSeconds(0);

    const interval = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - statusStartedAt) / 1000));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [statusStartedAt]);

  useEffect(() => {
    setIsPageEntered(false);
    // Brief hold at opacity 0 so the fade-in is perceptible, then transition in.
    let timerId: ReturnType<typeof setTimeout>;
    const frameId = window.requestAnimationFrame(() => {
      timerId = setTimeout(() => {
        setIsPageEntered(true);
      }, 60);
    });
    return () => {
      window.cancelAnimationFrame(frameId);
      clearTimeout(timerId);
    };
  }, [location.pathname, contentRevealTrigger]);

  useEffect(() => {
    return () => {
      if (callConnectTimeoutRef.current !== null) {
        window.clearTimeout(callConnectTimeoutRef.current);
      }

      Object.values(customerReplyTimeoutsRef.current).forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
    };
  }, []);

  // Auto-assign: while Available with fewer than 3 assignments, drip in one assignment at a
  // time on a randomised delay (8–28 s, never more than 30 s). Re-arms itself after each
  // addition until the queue reaches 3 or the agent leaves Available.
  const autoAssignTimerRef = useRef<number | null>(null);
  const visibleAssignmentIdsRef = useRef(visibleAssignmentIds);
  visibleAssignmentIdsRef.current = visibleAssignmentIds;
  const assignmentItemsByIdRef = useRef(assignmentItemsById);
  assignmentItemsByIdRef.current = assignmentItemsById;
  const historyOnlyAssignmentIdsRef = useRef(historyOnlyAssignmentIds);
  historyOnlyAssignmentIdsRef.current = historyOnlyAssignmentIds;

  // ── Scenario Controller BroadcastChannel ───────────────────────────────────
  // Helpers that fire each escalation immediately (no setTimeout) when triggered by the controller.
  const fireJordanEscalation = useCallback(() => {
    if (escalationFired) return;
    escalationFired = true;
    if (visibleAssignmentIdsRef.current.includes("static-11")) return;
    setIncomingNotifications((prev) => {
      if (prev.some((n) => n.id === "escalation-static-11")) return prev;
      return [...prev, {
        id: "escalation-static-11", customerRecordId: "jordan", channel: "chat" as const,
        initials: "JD", name: "Jordan Davis", customerId: "CST-11621", label: "Aria",
        lastUpdated: "11m", time: "11m",
        preview: "Router dropping all connections — port forwarding config blocking factory reset",
        statusLabel: "Escalated", priority: "Critical",
        priorityClassName: "border-[#E53935] bg-[#FDEAEA] text-[#C71D1A]", badgeColor: "#E32926",
        icon: MessageCircle, isActive: true,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        escalatedAt: getEscalationStart("jordan"),
        aiConfidence: staticAssignments.find((s) => s.id === "static-11")?.aiConfidence,
        aiConfidenceReason: staticAssignments.find((s) => s.id === "static-11")?.aiConfidenceReason,
      }];
    });
    pendingEscalatedIds.add("static-11");
    setEscalatedRailCount((n) => n + 1);
    scenarioChannelRef.current?.postMessage({ type: "CASE_STATUS", case: "jordan", status: "active" } satisfies AppMsg);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const fireSofiaEscalation = useCallback(() => {
    if (escalation2Fired) return;
    escalation2Fired = true;
    if (visibleAssignmentIdsRef.current.includes("static-sofia")) return;
    setIncomingNotifications((prev) => {
      if (prev.some((n) => n.id === "escalation-static-sofia")) return prev;
      return [...prev, {
        id: "escalation-static-sofia", customerRecordId: "sofia", channel: "chat" as const,
        initials: "SM", name: "Sofia Martinez", customerId: "CST-12045", label: "Jacob",
        lastUpdated: "8m", time: "8m",
        preview: "Proactive fraud alert — 2 unauthorized transactions totaling $2,159 detected",
        statusLabel: "Escalated", priority: "Critical",
        priorityClassName: "border-[#E53935] bg-[#FDEAEA] text-[#C71D1A]", badgeColor: "#E32926",
        icon: MessageCircle, isActive: true,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        escalatedAt: getEscalationStart("sofia"),
        aiConfidence: staticAssignments.find((s) => s.id === "static-sofia")?.aiConfidence,
        aiConfidenceReason: staticAssignments.find((s) => s.id === "static-sofia")?.aiConfidenceReason,
      }];
    });
    pendingEscalatedIds.add("static-sofia");
    setEscalatedRailCount((n) => n + 1);
    scenarioChannelRef.current?.postMessage({ type: "CASE_STATUS", case: "sofia", status: "active" } satisfies AppMsg);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fireMarcusEscalation = useCallback(() => {
    if (escalation3Fired) return;
    escalation3Fired = true;
    if (visibleAssignmentIdsRef.current.includes("static-marcus")) return;
    if (visibleAssignmentIdsRef.current.some((id) => id.includes("marcus"))) return;
    setIncomingNotifications((prev) => {
      if (prev.some((n) => n.id === "escalation-static-marcus")) return prev;
      return [...prev, {
        id: "escalation-static-marcus", customerRecordId: "marcus", channel: "chat" as const,
        initials: "MW", name: "Marcus Webb", customerId: "CST-13317", label: "Emily",
        lastUpdated: "6m", time: "6m",
        preview: "Order shipped to wrong address - request for Human Agent",
        statusLabel: "Escalated", priority: "Critical",
        priorityClassName: "border-[#E53935] bg-[#FDEAEA] text-[#C71D1A]", badgeColor: "#E32926",
        icon: MessageCircle, isActive: true,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        escalatedAt: getEscalationStart("marcus"),
      }];
    });
    pendingEscalatedIds.add("static-marcus");
    setEscalatedRailCount((n) => n + 1);
    scenarioChannelRef.current?.postMessage({ type: "CASE_STATUS", case: "marcus", status: "active" } satisfies AppMsg);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fireTerryEscalation = useCallback(() => {
    if (escalation4Fired) return;
    escalation4Fired = true;
    if (visibleAssignmentIdsRef.current.includes("static-terry")) return;
    if (visibleAssignmentIdsRef.current.some((id) => id.includes("terry"))) return;
    const sa = staticAssignments.find((s) => s.customerRecordId === "terry");
    const leadItem: QueuePreviewItem = {
      id: "escalation-static-terry", customerRecordId: "terry", channel: "voice" as const,
      initials: "TW", name: "Terry Williams", customerId: "CST-14201", label: "Aria",
      lastUpdated: "0m", time: "0m",
      preview: "Inbound callback — VP of Ops at Nexus Freight evaluating TMS replacement",
      statusLabel: "lead", priority: "High",
      priorityClassName: "border-[#F79009] bg-[#FEF0C7] text-[#B54708]", badgeColor: "#F79009",
      icon: Phone, isActive: true,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      escalatedAt: Date.now(),
      leadIntelligence: sa?.leadIntelligence,
    };
    setIncomingNotifications((prev) => {
      if (prev.some((n) => n.id === "escalation-static-terry")) return prev;
      return [...prev, leadItem];
    });
    // Persist lead to the Home tab alert (survives toast dismissal)
    setActiveLeadNotifications((prev) => {
      if (prev.some((n) => n.id === "escalation-static-terry")) return prev;
      return [...prev, leadItem];
    });
    scenarioChannelRef.current?.postMessage({ type: "CASE_STATUS", case: "terry", status: "active" } satisfies AppMsg);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // BroadcastChannel — listen for controller messages and send status updates.
  useEffect(() => {
    const ch = new BroadcastChannel(SCENARIO_CHANNEL);
    scenarioChannelRef.current = ch;

    ch.onmessage = (e: MessageEvent<ControllerMsg>) => {
      const msg = e.data;
      if (msg.type === "HELLO") {
        setIsControllerConnected(true);
        // Only send APP_READY once the agent is Available — the controller uses
        // this as the signal to unlock buttons and start auto-timers.
        if (agentStatusRef.current === "Available") {
          ch.postMessage({
            type: "APP_READY",
            statuses: {
              jordan: escalationFired ? (jordanResolvedFlag ? "resolved" : "active") : "idle",
              sofia:  escalation2Fired ? (sofiaResolvedFlag ? "resolved" : "active") : "idle",
              marcus: escalation3Fired ? (marcusResolvedFlag ? "resolved" : "active") : "idle",
              terry:  escalation4Fired ? "active" : "idle",
            },
          } satisfies AppMsg);
        }
      }
      if (msg.type === "BYE") {
        setIsControllerConnected(false);
      }
      if (msg.type === "TRIGGER") {
        if (msg.case === "jordan") fireJordanEscalation();
        if (msg.case === "sofia")  fireSofiaEscalation();
        if (msg.case === "marcus") fireMarcusEscalation();
        if (msg.case === "terry")  fireTerryEscalation();
      }
    };

    return () => {
      scenarioChannelRef.current = null;
      ch.close();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fireJordanEscalation, fireSofiaEscalation, fireMarcusEscalation, fireTerryEscalation]);

  const [scenarioCaseStatuses, setScenarioCaseStatuses] = useState<Record<"jordan" | "sofia" | "marcus" | "terry", "idle" | "active" | "resolved">>({
    jordan: "idle", sofia: "idle", marcus: "idle", terry: "idle",
  });

  const triggerScenario = useCallback((key: "jordan" | "sofia" | "marcus" | "terry") => {
    setScenarioCaseStatuses((prev) => ({ ...prev, [key]: "active" }));
    switch (key) {
      case "jordan": { escalationFired = false; fireJordanEscalation(); break; }
      case "sofia":  { escalation2Fired = false; fireSofiaEscalation(); break; }
      case "marcus": { escalation3Fired = false; fireMarcusEscalation(); break; }
      case "terry":  { escalation4Fired = false; fireTerryEscalation(); break; }
    }
  }, [fireJordanEscalation, fireSofiaEscalation, fireMarcusEscalation, fireTerryEscalation]);

  // When the agent transitions to Available while the controller is already connected,
  // send APP_READY so the controller unlocks buttons and starts auto-timers.
  useEffect(() => {
    if (status !== "Available") return;
    if (!isControllerConnected) return;
    scenarioChannelRef.current?.postMessage({
      type: "APP_READY",
      statuses: {
        jordan: escalationFired ? (jordanResolvedFlag ? "resolved" : "active") : "idle",
        sofia:  escalation2Fired ? (sofiaResolvedFlag ? "resolved" : "active") : "idle",
        marcus: escalation3Fired ? "active" : "idle",
      },
    } satisfies AppMsg);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, isControllerConnected]);

  // Auto-open the Scenario Controller tab once per browser session.
  useEffect(() => {
    if (sessionStorage.getItem("desk-controller-opened")) return;
    sessionStorage.setItem("desk-controller-opened", "1");
    const base = (import.meta.env.BASE_URL as string).replace(/\/$/, "");
    window.open(`${window.location.origin}${base}/controller`, "desk-nexgen-controller");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (autoAssignTimerRef.current !== null) {
      window.clearTimeout(autoAssignTimerRef.current);
      autoAssignTimerRef.current = null;
    }

    if (status !== "Available") return;
    // Auto-assignment toast disabled — kept for future use.
    return;
    // Count only non-parked active assignments toward the 3-assignment cap.
    const activeCount = visibleAssignmentIds.filter(
      (id) => assignmentStatusesById[id] !== "parked",
    ).length;
    if (activeCount >= 3) return;
    // Do not push a new assignment while one is already awaiting action.
    if (incomingNotifications.length > 0) return;

    // Minimum 15 seconds of availability before pushing an assignment;
    // add up to 10 s of jitter so back-to-back assignments feel natural.
    const delay = Math.floor(Math.random() * 10_000) + 15_000;

    autoAssignTimerRef.current = window.setTimeout(() => {
      autoAssignTimerRef.current = null;

      // Find next item not already visible or pending.
      const allKnownIds = [
        ...visibleAssignmentIdsRef.current,
        ...incomingNotifications.map((n) => n.id),
      ];
      const nextItem = queuePreviewItems.find((item) => !allKnownIds.includes(item.id));
      if (!nextItem) return;

      const conversationStateKey = getConversationStateKey(nextItem.id);
      const conversationState = createConversationState(nextItem.customerRecordId, nextItem.channel);

      // Pre-load conversation state so Review works immediately.
      setAssignmentItemsById((current) => ({ ...current, [nextItem.id]: nextItem }));
      setAssignmentStatusesById((current) => ({ ...current, [nextItem.id]: "open" }));
      setConversationStatesByKey((current) => ({ ...current, [conversationStateKey]: conversationState }));
      setNotificationCount((n) => n + 1);

      // Add to the incoming notification queue (shown as a persistent bottom-right card).
      setIncomingNotifications((prev) => [...prev, nextItem]);
    }, delay);

    return () => {
      if (autoAssignTimerRef.current !== null) {
        window.clearTimeout(autoAssignTimerRef.current);
        autoAssignTimerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, visibleAssignmentIds.length, incomingNotifications.length]);

  // ── Agent-to-agent inbound chat notifications ──────────────────────────────
  // Pool of realistic inbound messages that correspond to ChatPopover conversations.
  const agentChatPool: Omit<AgentChatNotification, "id">[] = useMemo(() => [
    {
      conversationId: "sarah-kim",
      agentName: "Sarah Kim",
      agentRole: "Senior Agent",
      agentInitials: "SK",
      agentAvatarColor: "#166CCA",
      message: "Let me know when you're free to review Case 271",
      time: "2:14 PM",
    },
    {
      conversationId: "emma-larsen",
      agentName: "Emma Larsen",
      agentRole: "Quality Coach",
      agentInitials: "EL",
      agentAvatarColor: "#059669",
      message: "Your CSAT scores look great this week 🎉",
      time: "11:22 AM",
    },
    {
      conversationId: "mike-torres",
      agentName: "Mike Torres",
      agentRole: "Team Lead",
      agentInitials: "MT",
      agentAvatarColor: "#7C3AED",
      message: "Quick heads up — David Brown's Enterprise plan change is flagging in the system.",
      time: "1:30 PM",
    },
  ], []);

  const autoChatTimerRef = useRef<number | null>(null);
  const shownChatConversationIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (autoChatTimerRef.current !== null) {
      window.clearTimeout(autoChatTimerRef.current);
      autoChatTimerRef.current = null;
    }
    if (status !== "Available") return;
    // Auto-chat toast disabled — kept for future use.
    return;
    // Don't show a new chat notification while one is already visible.
    if (incomingChatNotifications.length > 0) return;

    // Chat notifications are less frequent than assignment toasts: 40–70 s.
    const delay = Math.floor(Math.random() * 30_000) + 40_000;

    autoChatTimerRef.current = window.setTimeout(() => {
      autoChatTimerRef.current = null;
      const next = agentChatPool.find((c) => !shownChatConversationIds.current.has(c.conversationId));
      if (!next) return;
      shownChatConversationIds.current.add(next.conversationId);
      const notification: AgentChatNotification = {
        ...next,
        id: `chat-notif-${Date.now()}`,
      };
      setIncomingChatNotifications((prev) => [...prev, notification]);
    }, delay);

    return () => {
      if (autoChatTimerRef.current !== null) {
        window.clearTimeout(autoChatTimerRef.current);
        autoChatTimerRef.current = null;
      }
    };
  }, [status, incomingChatNotifications.length, agentChatPool]);

  const dismissChatNotification = (notif: AgentChatNotification) =>
    setIncomingChatNotifications((prev) => prev.filter((n) => n.id !== notif.id));

  const openChatNotification = (notif: AgentChatNotification) => {
    dismissChatNotification(notif);
    setChatInitialConversationId(notif.conversationId);
    openChatPopover();
  };

  const activeStatus = useMemo(
    () => statusOptions.find((option) => option.label === status) ?? statusOptions[0],
    [status],
  );
  const selectedAssignment = useMemo(
    () =>
      assignmentItemsById[selectedAssignmentId] ??
      queuePreviewItems.find((item) => item.id === selectedAssignmentId || item.customerRecordId === selectedAssignmentId) ??
      initialSelectedAssignment,
    [assignmentItemsById, selectedAssignmentId],
  );

  // The "transferred" notification for the currently-active case is shown as a fixed portal
  // at top-3 left-3 (mirrors NotificationStack pattern) rather than in the bottom-right stack.
  // Must be declared after selectedAssignment to avoid temporal dead zone.
  const activeCaseTransferredItem = incomingNotifications.find(
    (n) => n.statusLabel === "transferred" && n.customerRecordId === selectedAssignment.customerRecordId,
  ) ?? null;

  const visibleAssignments = useMemo(
    () => visibleAssignmentIds.map((assignmentId) => assignmentItemsById[assignmentId]).filter(Boolean) as QueuePreviewItem[],
    [assignmentItemsById, visibleAssignmentIds],
  );
  const activeConversationChannel = selectedAssignment.channel;
  // Collect all channels open for this customer — order is stable (matches visibleAssignments order).
  // In post-call history mode the voice tab is suppressed (empty list) so the panel falls back
  // to the History tab automatically.
  const activeConversationTabs = useMemo(() => {
    if (isPostCallHistoryMode && postCallAssignmentIdRef.current === selectedAssignment.id) {
      return [] as CustomerChannel[];
    }
    // History-only mode (e.g. reviewing a lead) — suppress all channel tabs.
    if (historyOnlyAssignmentIds.has(selectedAssignment.id)) {
      return [] as CustomerChannel[];
    }
    const channels = visibleAssignments
      .filter((a) => a.customerRecordId === selectedAssignment.customerRecordId)
      .map((a) => a.channel);
    return [...new Set(channels)] as CustomerChannel[];
  }, [isPostCallHistoryMode, historyOnlyAssignmentIds, visibleAssignments, selectedAssignment.customerRecordId, selectedAssignment.id]);
  const activeConversationStateKey = useMemo(
    () => getConversationStateKey(selectedAssignment.id),
    [selectedAssignment.id],
  );
  const conversationState = useMemo(
    () =>
      conversationStatesByKey[activeConversationStateKey] ??
      createConversationState(selectedAssignment.customerRecordId, activeConversationChannel),
    [activeConversationChannel, activeConversationStateKey, conversationStatesByKey, selectedAssignment.customerRecordId],
  );
  const isActivityRoute = location.pathname === "/activity";

  // When the left rail empties (all assignments removed/resolved), send the agent
  // to the Desk dashboard so they're not left on a blank activity screen.
  const railAssignments = visibleAssignments.filter((a) => assignmentStatusesById[a.id] !== "parked");
  useEffect(() => {
    if (railAssignments.length === 0 && isActivityRoute) {
      navigate("/control-center");
    }
  }, [railAssignments.length, isActivityRoute, navigate]);

  const isExpandedCanvasRoute =
    isActivityRoute && ((location.state as { hideMainCanvasPanel?: boolean } | null)?.hideMainCanvasPanel ?? true);
  // Only treat /desk as an app-space panel route when an explicit ?view= param is
  // present. The bare /desk path is now the standalone Desk page (no panel popunder).
  const activeDeskRouteView: DeskCanvasView | null = location.pathname === "/desk"
    ? ((new URLSearchParams(location.search).get("view") as DeskCanvasView | null) ?? null)
    : null;
  const isCopilotDeskView = activeDeskRouteView === "copilot";
  const isDeskView = activeDeskRouteView === "desk";
  const isDeskRoute = activeDeskRouteView !== null;
  const isCustomerInfoCanvasVisible = isDeskRoute || (isExpandedCanvasRoute && isCustomerInfoPanelOpen);
  const isCombinedInteractionPanel = isCustomerInfoCanvasVisible && isCombinedInteractionPanelEnabled;
  const isAppSpaceSplitLayout = !isCombinedInteractionPanel && isCustomerInfoCanvasVisible;
  const isInlineConversationSplitPanelVisible = isAppSpaceSplitLayout && !isConversationPopunderOpen;
  // Only one panel can be docked at a time: desk canvas is inline only when conversation is NOT docked inline
  const isInlineAppSpacePanelVisible = isAppSpaceSplitLayout && !deskCanvasPopunderView && !isCustomerInfoPopunderOpen && !isInlineConversationSplitPanelVisible;
  const shouldCombineDockedCustomerAndDeskPanels =
    isDeskRoute &&
    !isCombinedInteractionPanel &&
    isCustomerInfoPanelOpen &&
    !isCustomerInfoPopunderOpen &&
    isCombinedInteractionPanelCanvasEnabled;
  const isCanvasMergedIntoCombinedPanel = isCombinedInteractionPanel || shouldCombineDockedCustomerAndDeskPanels || isAppSpaceSplitLayout;
  const isDeskCustomerInfoVisible =
    isCustomerInfoCanvasVisible &&
    isCustomerInfoPanelOpen &&
    !isCanvasMergedIntoCombinedPanel &&
    isCustomerInfoPanelAllowed &&
    !isCustomerInfoPopunderOpen;
  const isDockedConversationVisible = isActivityRoute && !isCombinedInteractionPanel && isConversationPanelOpen && visibleAssignments.length > 0;
  // Customer info in conversation-dock mode (true even when the panel is toggled closed).
  // Used to keep the header icon highlighted and suppress floating-popunder logic.
  const isCustomerInfoInConversationDockMode = isDockedConversationVisible && isCustomerInfoDockedToConversation;
  const isTranscriptInConversationDockMode = isDockedConversationVisible && isTranscriptDockedToConversation;
  // Panel is actually rendered/visible within dock mode (toggled by the header icon).
  const isConversationDockedCustomerInfoVisible = isCustomerInfoInConversationDockMode && isConversationDockedPanelOpen;
  const isConversationDockedTranscriptVisible = isTranscriptInConversationDockMode && isConversationDockedPanelOpen;
  const isMainCanvasVisible = !isExpandedCanvasRoute && !isCanvasMergedIntoCombinedPanel;
  const isDeskCustomerInfoPopunderVisible =
    isCustomerInfoPanelOpen && !isCombinedInteractionPanel && isCustomerInfoPopunderOpen;
  const shouldPreserveFloatingCustomerInfoPanel =
    isCustomerInfoPanelOpen && isCustomerInfoPopunderOpen;
  const conversationPanelMaxWidth = getDockedConversationMaxWidth({
    hasDesktopRightPanel: activeRightPanel !== null,
    customerInfoPanelWidth: isDeskCustomerInfoVisible ? dockedCustomerInfoWidth : 0,
    hasCustomerInfoPanel: isDeskCustomerInfoVisible,
    reserveMainWorkspace: isMainCanvasVisible,
    hasMainCanvas: isMainCanvasVisible,
  });
  const customerInfoPanelMaxWidth = getDockedCustomerInfoMaxWidth({
    hasDesktopRightPanel: activeRightPanel !== null,
    isConversationPanelOpen: isDockedConversationVisible,
    dockedConversationWidth,
    reserveMainWorkspace: isMainCanvasVisible,
    hasMainCanvas: isMainCanvasVisible,
  });
  const activeWorkspace = useMemo(
    () => workspaceOptions.find((workspace) => workspace.id === activeWorkspaceId) ?? workspaceOptions[0],
    [activeWorkspaceId, workspaceOptions],
  );

  useEffect(() => {
    const matchedWorkspace = workspaceOptions.find((workspace) => {
      if (!workspace.routePath) {
        return false;
      }

      if (workspace.id === "review") {
        return location.pathname === "/activity" || location.pathname === "/desk";
      }

      return location.pathname === workspace.routePath;
    });

    if (matchedWorkspace && matchedWorkspace.id !== activeWorkspaceId) {
      setActiveWorkspaceId(matchedWorkspace.id);
    }
  }, [activeWorkspaceId, location.pathname, workspaceOptions]);

  const deskCanvasTabLabel = isCopilotDeskView
    ? "AI"
    : new URLSearchParams(location.search).get("view") === "add"
      ? "Add"
      : new URLSearchParams(location.search).get("view") === "customer"
        ? "Customer Information"
        : new URLSearchParams(location.search).get("view") === "notifications"
          ? "Notifications"
          : "Desk";

  const setActiveConversationChannel = (_channel: CustomerChannel) => {};

  useEffect(() => {
    setConversationStatesByKey((currentStates) => {
      if (currentStates[activeConversationStateKey]) {
        return currentStates;
      }

      return {
        ...currentStates,
        [activeConversationStateKey]: createConversationState(selectedAssignment.customerRecordId, activeConversationChannel),
      };
    });
  }, [activeConversationChannel, activeConversationStateKey, selectedAssignment.customerRecordId]);

  const handleConversationStateChange = (nextConversation: SharedConversationData, _channel?: CustomerChannel) => {
    const targetAssignmentId = selectedAssignment.id;
    const targetCustomerRecordId = selectedAssignment.customerRecordId;
    const targetChannel = activeConversationChannel;
    const targetConversationStateKey = getConversationStateKey(targetAssignmentId);
    const currentConversationState =
      conversationStatesByKey[targetConversationStateKey] ?? createConversationState(targetCustomerRecordId, targetChannel);
    const currentLatestMessage = currentConversationState.messages[currentConversationState.messages.length - 1];

    if (customerReplyTimeoutsRef.current[targetConversationStateKey] !== undefined) {
      window.clearTimeout(customerReplyTimeoutsRef.current[targetConversationStateKey]);
      delete customerReplyTimeoutsRef.current[targetConversationStateKey];
    }

    const latestMessage = nextConversation.messages[nextConversation.messages.length - 1];
    const shouldScheduleCustomerReply =
      latestMessage?.role === "agent"
      && !latestMessage.isInternal
      && (
        currentConversationState.messages.length !== nextConversation.messages.length
        || currentLatestMessage?.id !== latestMessage.id
        || currentLatestMessage?.role !== latestMessage.role
      );
    const persistedConversationState = {
      ...nextConversation,
      isCustomerTyping: shouldScheduleCustomerReply,
    };

    // If the agent sent a message on a new (unactivated) channel, mark it as activated
    // so the delete icon is hidden — the channel now has real content.
    if (shouldScheduleCustomerReply && !activatedChannelIds.has(targetAssignmentId)) {
      setActivatedChannelIds((prev) => new Set([...prev, targetAssignmentId]));
    }

    // If the agent sent a reply while reviewing a pending assignment, auto-accept it.
    if (shouldScheduleCustomerReply && pendingAcceptanceIds.has(targetAssignmentId)) {
      setPendingAcceptanceIds((prev) => {
        const next = new Set(prev);
        next.delete(targetAssignmentId);
        return next;
      });
    }

    setConversationStatesByKey((currentStates) => ({
      ...currentStates,
      [targetConversationStateKey]: persistedConversationState,
    }));

    if (!latestMessage || !shouldScheduleCustomerReply) {
      return;
    }

    customerReplyTimeoutsRef.current[targetConversationStateKey] = window.setTimeout(() => {
      setConversationStatesByKey((currentStates) => {
        const currentConversationState =
          currentStates[targetConversationStateKey] ?? createConversationState(targetCustomerRecordId, targetChannel);
        const currentLatestMessage = currentConversationState.messages[currentConversationState.messages.length - 1];

        if (
          currentConversationState.customerName !== nextConversation.customerName ||
          currentConversationState.label !== nextConversation.label ||
          currentLatestMessage?.id !== latestMessage.id
        ) {
          return currentStates;
        }

        const replyResult = generateSimulatedCustomerReply(currentConversationState, latestMessage.content);
        const replyContent = typeof replyResult === "string" ? replyResult : replyResult.content;
        const replyStarRating = typeof replyResult === "object" ? replyResult.starRating : undefined;
        const replyAiAction = typeof replyResult === "object" ? replyResult.aiAction : undefined;

        return {
          ...currentStates,
          [targetConversationStateKey]: {
            ...currentConversationState,
            isCustomerTyping: false,
            messages: [
              ...currentConversationState.messages,
              {
                id: currentConversationState.messages.reduce((maxId, message) => Math.max(maxId, message.id), 0) + 1,
                role: "customer",
                content: replyContent,
                time: formatConversationReplyTime(new Date()),
                starRating: replyStarRating,
                aiAction: replyAiAction,
              },
            ],
          },
        };
      });
      delete customerReplyTimeoutsRef.current[targetConversationStateKey];
    }, 4500);
  };

  const handleConversationStatusChange = (nextStatus: ConversationStatus) => {
    handleConversationStateChange({
      ...conversationState,
      status: nextStatus,
    });
  };

  const handleResolveAssignment = () => {
    const assignmentName = selectedAssignment.name;
    if (selectedAssignment.channel === "voice") {
      // Enter post-call history mode: close the voice tab, show history, defer cleanup.
      setIsPostCallHistoryMode(true);
      postCallAssignmentIdRef.current = selectedAssignmentId;
      toast(`Call dispositioned — ${assignmentName}`, {
        description: "Voice call ended. Reviewing customer history.",
        position: "bottom-right",
        duration: 4000,
      });
      return;
    }
    // Remove escalation alert from home tab for known escalated cases
    const customerRecordId = selectedAssignment.customerRecordId;
    const staticId = staticAssignments.find((a) => a.customerRecordId === customerRecordId)?.id;
    if (staticId) pendingResolvedIds.add(staticId);
    // Also decrement escalated badge if this was an escalated case
    if (customerRecordId === "marcus") setIsMarcusResolved(true);

    // Gather data for the rich dismissal toast before removing the assignment
    const resolveAssignment = assignmentItemsById[selectedAssignmentId];
    const resolveSa = staticAssignments.find(
      (s) => s.customerRecordId === customerRecordId || s.customerId === resolveAssignment?.customerId,
    );
    handleRemoveVisibleAssignment(selectedAssignmentId);

    // Show rich DismissalToast instead of plain sonner toast
    if (resolveAssignment || resolveSa) {
      const custId = resolveAssignment?.customerId ?? resolveSa?.customerId ?? customerRecordId;
      const preview = resolveAssignment?.preview ?? resolveSa?.preview ?? "";
      const botType = resolveSa?.botType ?? "Aria";
      const chan = resolveAssignment?.channel ?? resolveSa?.channel ?? "chat";
      const actions = resolveSa?.aiOverview?.actions ?? [];
      setDismissalToast({
        customerName: assignmentName,
        customerId: custId,
        status: "resolved",
        resolvedStatus: "Resolved",
        actions,
        preview,
        botType,
        channel: chan,
      });
    }
  };

  // When the agent switches to a different case while in post-call history mode, finish the cleanup.
  useEffect(() => {
    if (
      isPostCallHistoryMode &&
      postCallAssignmentIdRef.current !== null &&
      selectedAssignmentId !== postCallAssignmentIdRef.current
    ) {
      const postCallId = postCallAssignmentIdRef.current;
      setIsPostCallHistoryMode(false);
      postCallAssignmentIdRef.current = null;
      handleRemoveVisibleAssignment(postCallId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAssignmentId, isPostCallHistoryMode]);

  const handleAssignmentStatusChange = (assignmentId: QueuePreviewItem["id"], status: QueueAssignmentStatus) => {
    setAssignmentStatusesById((currentStatuses) => ({
      ...currentStatuses,
      [assignmentId]: status,
    }));
  };

  /**
   * Returns the highest-severity status across all visible channels for a customer.
   * Used so the active record header shows the case status, not a single channel's status.
   */
  const getCaseStatus = (customerRecordId: string): QueueAssignmentStatus => {
    const severityMap: Record<string, number> = { escalated: 4, pending: 3, open: 2, resolved: 1, parked: 0 };
    const channels = visibleAssignmentIds
      .map((id) => assignmentItemsById[id])
      .filter((item) => item?.customerRecordId === customerRecordId);
    if (channels.length === 0) return "open";
    // Start from the lowest possible severity so any real status wins.
    return channels.reduce<QueueAssignmentStatus>((highest, item) => {
      const s = (assignmentStatusesById[item!.id] ?? "open") as QueueAssignmentStatus;
      return (severityMap[s] ?? 0) > (severityMap[highest] ?? 0) ? s : highest;
    }, "parked");
  };

  /**
   * Sets the status on ALL visible channels for a customer so status is case-owned.
   * Also syncs the home-tab escalation banner: any status other than "escalated"
   * removes the static assignment from escalatedOverrides via pendingResolvedIds.
   */
  const handleCaseStatusChange = (customerRecordId: string, status: QueueAssignmentStatus) => {
    const siblingIds = visibleAssignmentIds.filter(
      (id) => assignmentItemsById[id]?.customerRecordId === customerRecordId,
    );
    setAssignmentStatusesById((currentStatuses) => {
      const next = { ...currentStatuses };
      siblingIds.forEach((id) => { next[id] = status; });
      return next;
    });
    // When a case is moved out of "escalated" state, remove it from the home-tab
    // escalation banner by queuing its static ID into pendingResolvedIds.
    if (status !== "escalated") {
      const staticId = staticAssignments.find(
        (a) => a.customerRecordId === customerRecordId,
      )?.id;
      if (staticId) pendingResolvedIds.add(staticId);
    }
  };

  /**
   * Dismisses ALL visible channels for a customer (case-level dismiss from the active record header).
   */
  const handleDismissCase = (customerRecordId: string, transferRecipient?: string) => {
    const siblingIds = visibleAssignmentIds.filter(
      (id) => assignmentItemsById[id]?.customerRecordId === customerRecordId,
    );
    // Remove escalation alert from home tab by resolving the matching static assignment
    const dismissSa = staticAssignments.find((s) => s.customerRecordId === customerRecordId);
    if (dismissSa) pendingResolvedIds.add(dismissSa.id);
    handleRemoveGroupedAssignments(siblingIds, transferRecipient);

    // Fire the dismissal confirmation toast
    const assignment = Object.values(assignmentItemsById).find((a) => a?.customerRecordId === customerRecordId);
    const sa = staticAssignments.find((s) => s.customerRecordId === customerRecordId || s.customerId === assignment?.customerId);
    if (assignment || sa) {
      const name = assignment?.name ?? sa?.name ?? customerRecordId;
      const custId = assignment?.customerId ?? sa?.customerId ?? customerRecordId;
      const preview = assignment?.preview ?? sa?.preview ?? "";
      const botType = sa?.label ?? "Aria";
      const channel = assignment?.channel ?? sa?.channel ?? "chat";
      const actions = sa?.aiOverview?.actions ?? [];
      setDismissalToast({
        customerName: name,
        customerId: custId,
        status: transferRecipient === null ? "unassigned" : transferRecipient ? "transferred" : "dismissed",
        resolvedStatus: transferRecipient === null ? "Unassigned" : transferRecipient ? "Transferred" : "Resolved",
        actions,
        preview,
        botType,
        channel,
      });
    }
  };

  const getAnchoredCallPopunderPosition = (anchorRect?: DOMRect | null) => {
    if (typeof window === "undefined") {
      return { x: 24, y: 24 };
    }

    if (!anchorRect) {
      return {
        x: Math.max(window.innerWidth - (CALL_POPUNDER_WIDTH + 24), CALL_POPUNDER_MARGIN),
        y: CALL_POPUNDER_MARGIN,
      };
    }

    return {
      x: Math.min(
        Math.max(CALL_POPUNDER_MARGIN, anchorRect.right - CALL_POPUNDER_WIDTH),
        window.innerWidth - CALL_POPUNDER_WIDTH - CALL_POPUNDER_MARGIN,
      ),
      y: Math.max(CALL_POPUNDER_MARGIN, anchorRect.bottom + CALL_POPUNDER_GAP),
    };
  };

  const getAnchoredAddNewPopunderPosition = () => {
    if (typeof window === "undefined") {
      return { x: 16, y: 64 };
    }

    const margin = 16;
    const gap = 10;
    const popunderWidth = Math.min(addNewPopunderSize.width, window.innerWidth - margin * 2);
    const buttonBounds = addNewButtonRef.current?.getBoundingClientRect();

    return {
      x: Math.max(window.innerWidth - popunderWidth - margin, margin),
      y: Math.max(margin, (buttonBounds?.bottom ?? 48) + gap),
    };
  };

  const getAnchoredCopilotPopunderPosition = () => {
    if (typeof window === "undefined") {
      return { x: 16, y: 64 };
    }

    const margin = 16;
    const gap = 10;
    const popunderWidth = Math.min(copilotPopunderSize.width, window.innerWidth - margin * 2);
    const buttonBounds = copilotButtonRef.current?.getBoundingClientRect();

    return {
      x: Math.max(window.innerWidth - popunderWidth - margin, margin),
      y: Math.max(margin, (buttonBounds?.bottom ?? 48) + gap),
    };
  };

  const getAnchoredDeskCanvasPopunderPosition = (width: number, height: number) => {
    if (typeof window === "undefined") {
      return { x: DESK_CANVAS_POPOUNDER_MARGIN, y: 72 };
    }

    return {
      x: Math.max(window.innerWidth - width - DESK_CANVAS_POPOUNDER_MARGIN, DESK_CANVAS_POPOUNDER_MARGIN),
      y: Math.min(
        Math.max(DESK_CANVAS_POPOUNDER_MARGIN, 72),
        window.innerHeight - height - DESK_CANVAS_POPOUNDER_MARGIN,
      ),
    };
  };

  const getAnchoredConversationPopunderPosition = (anchorRect?: DOMRect | null) => {
    if (typeof window === "undefined") {
      return { x: 84, y: 72 };
    }

    const width = Math.min(conversationPopunderSize.width, window.innerWidth - CONVERSATION_POPOUNDER_MARGIN * 2);
    const height = Math.min(conversationPopunderSize.height, window.innerHeight - CONVERSATION_POPOUNDER_MARGIN * 2);

    if (!anchorRect) {
      return {
        x: CONVERSATION_POPOUNDER_MARGIN + 56 + CONVERSATION_POPOUNDER_GAP,
        y: 72,
      };
    }

    return {
      x: Math.min(
        Math.max(CONVERSATION_POPOUNDER_MARGIN, anchorRect.right + CONVERSATION_POPOUNDER_GAP),
        window.innerWidth - width - CONVERSATION_POPOUNDER_MARGIN,
      ),
      y: Math.min(
        Math.max(CONVERSATION_POPOUNDER_MARGIN, anchorRect.top),
        window.innerHeight - height - CONVERSATION_POPOUNDER_MARGIN,
      ),
    };
  };

  const getAnchoredCustomerInfoPopunderPosition = (_anchorRect?: DOMRect | null) => {
    if (typeof window === "undefined") {
      return { x: 420, y: 120 };
    }

    const width = Math.min(customerInfoPopunderSizeRef.current.width, window.innerWidth - CUSTOMER_INFO_POPOUNDER_MARGIN * 2);

    // Always anchor to the right edge, positioned just below the conversation panel header.
    return {
      x: window.innerWidth - width - CUSTOMER_INFO_POPOUNDER_MARGIN,
      y: conversationPanelHeaderBottomRef.current,
    };
  };

  useEffect(() => {
    if (!copilotDragActivation) return;

    const clearDragActivation = () => {
      setCopilotDragActivation(null);
    };

    window.addEventListener("mouseup", clearDragActivation);

    return () => window.removeEventListener("mouseup", clearDragActivation);
  }, [copilotDragActivation]);

  useEffect(() => {
    if (!deskCanvasDragActivation) return;

    const clearDragActivation = () => {
      setDeskCanvasDragActivation(null);
    };

    window.addEventListener("mouseup", clearDragActivation);

    return () => window.removeEventListener("mouseup", clearDragActivation);
  }, [deskCanvasDragActivation]);

  useEffect(() => {
    if (!customerInfoDragActivation) return;

    const clearDragActivation = () => {
      setCustomerInfoDragActivation(null);
    };

    window.addEventListener("mouseup", clearDragActivation);

    return () => window.removeEventListener("mouseup", clearDragActivation);
  }, [customerInfoDragActivation]);

  useEffect(() => {
    const syncCopilotDockingAvailability = () => {
      setIsCopilotDockingAllowed(window.innerWidth >= COPILOT_DOCK_BREAKPOINT);
    };

    syncCopilotDockingAvailability();
    window.addEventListener("resize", syncCopilotDockingAvailability);

    return () => window.removeEventListener("resize", syncCopilotDockingAvailability);
  }, []);

  useEffect(() => {
    const syncCombinedInteractionPanelAvailability = () => {
      setIsCombinedInteractionPanelEnabled(window.innerWidth < COMBINED_INTERACTION_PANEL_BREAKPOINT);
    };

    syncCombinedInteractionPanelAvailability();
    window.addEventListener("resize", syncCombinedInteractionPanelAvailability);

    return () => window.removeEventListener("resize", syncCombinedInteractionPanelAvailability);
  }, []);

  useEffect(() => {
    const syncCombinedInteractionPanelCanvasAvailability = () => {
      setIsCombinedInteractionPanelCanvasEnabled(window.innerWidth < COMBINED_INTERACTION_PANEL_CANVAS_BREAKPOINT);
    };

    syncCombinedInteractionPanelCanvasAvailability();
    window.addEventListener("resize", syncCombinedInteractionPanelCanvasAvailability);

    return () => window.removeEventListener("resize", syncCombinedInteractionPanelCanvasAvailability);
  }, []);

  useEffect(() => {
    if (isCopilotDockingAllowed || typeof window === "undefined") return;

    setIsCopilotDocked(false);
    setCopilotDragActivation(null);
    setCopilotPopunderPosition(getAnchoredCopilotPopunderPosition());
  }, [isCopilotDockingAllowed]);

  useEffect(() => {
    const syncDockedConversationWidth = () => {
      setDockedConversationWidth((current) => Math.min(current, conversationPanelMaxWidth));
    };

    syncDockedConversationWidth();
    window.addEventListener("resize", syncDockedConversationWidth);

    return () => window.removeEventListener("resize", syncDockedConversationWidth);
  }, [conversationPanelMaxWidth]);

  useEffect(() => {
    dockedConversationWidthRef.current = dockedConversationWidth;
  }, [dockedConversationWidth]);

  useEffect(() => {
    dockedCustomerInfoWidthRef.current = dockedCustomerInfoWidth;
  }, [dockedCustomerInfoWidth]);

  useEffect(() => {
    if (typeof window === "undefined" || isCombinedInteractionPanel || isAppSpaceSplitLayout) {
      return;
    }

    const syncDefaultDockedPanelWidths = () => {
      const showConversation = isConversationPanelOpen;
      const showCustomerInfo = isDeskCustomerInfoVisible;

      if (!showConversation && !showCustomerInfo) {
        return;
      }

      const { conversationWidth, customerInfoWidth } = getBalancedDockedPanelWidths({
        hasDesktopRightPanel: activeRightPanel !== null,
        reserveMainWorkspace: isMainCanvasVisible,
        showConversation,
        showCustomerInfo,
        hasMainCanvas: isMainCanvasVisible,
        currentConversationWidth: dockedConversationWidthRef.current,
        currentCustomerInfoWidth: dockedCustomerInfoWidthRef.current,
      });

      if (showConversation) {
        setDockedConversationWidth(conversationWidth);
      }

      if (showCustomerInfo) {
        setDockedCustomerInfoWidth(customerInfoWidth);
      }
    };

    syncDefaultDockedPanelWidths();
    window.addEventListener("resize", syncDefaultDockedPanelWidths);

    return () => window.removeEventListener("resize", syncDefaultDockedPanelWidths);
  }, [
    activeRightPanel,
    isCombinedInteractionPanel,
    isConversationPanelOpen,
    isDeskCustomerInfoVisible,
    isMainCanvasVisible,
  ]);

  useEffect(() => {
    const syncDockedCopilotWidth = () => {
      const maxWidth = getDockedCopilotMaxWidth({
        hasDesktopRightPanel: activeRightPanel !== null,
        isConversationPanelOpen,
        dockedConversationWidth,
      });
      setCopilotPopunderSize((current) => ({
        ...current,
        width: Math.min(current.width, maxWidth),
      }));
    };

    syncDockedCopilotWidth();
    window.addEventListener("resize", syncDockedCopilotWidth);

    return () => window.removeEventListener("resize", syncDockedCopilotWidth);
  }, [activeRightPanel, dockedConversationWidth, isConversationPanelOpen]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("agentDarkMode", String(isDarkMode));
    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, [isDarkMode]);

  useEffect(() => {
    const syncDockedCustomerInfoWidth = () => {
      setDockedCustomerInfoWidth((current) => Math.min(current, customerInfoPanelMaxWidth));
    };

    syncDockedCustomerInfoWidth();
    window.addEventListener("resize", syncDockedCustomerInfoWidth);

    return () => window.removeEventListener("resize", syncDockedCustomerInfoWidth);
  }, [customerInfoPanelMaxWidth]);

  useEffect(() => {
    const syncCustomerInfoPanelAvailability = () => {
      setIsCustomerInfoPanelAllowed(window.innerWidth >= CUSTOMER_INFO_PANEL_BREAKPOINT);
    };

    syncCustomerInfoPanelAvailability();
    window.addEventListener("resize", syncCustomerInfoPanelAvailability);

    return () => window.removeEventListener("resize", syncCustomerInfoPanelAvailability);
  }, []);

  useEffect(() => {
    if (!isCombinedInteractionPanel || !isCustomerInfoPopunderOpen) return;

    setIsCustomerInfoPopunderOpen(false);
    setCustomerInfoDragActivation(null);
  }, [isCombinedInteractionPanel, isCustomerInfoPopunderOpen]);

  useEffect(() => {
    if (
      !isCustomerInfoCanvasVisible ||
      !isCustomerInfoPanelOpen ||
      isCustomerInfoPanelAllowed ||
      isCustomerInfoPopunderOpen ||
      isCombinedInteractionPanel
    ) {
      return;
    }

    setCustomerInfoPopunderPosition(getAnchoredCustomerInfoPopunderPosition());
    setIsCustomerInfoPopunderOpen(true);
    setCustomerInfoDragActivation(null);
  }, [
    dockedConversationWidth,
    isCombinedInteractionPanel,
    isConversationPanelOpen,
    isCustomerInfoPanelAllowed,
    isCustomerInfoPanelOpen,
    isCustomerInfoPopunderOpen,
    isCustomerInfoCanvasVisible,
  ]);

  useEffect(() => {
    if (isExpandedCanvasRoute && !wasExpandedCanvasRouteRef.current) {
      if (isDeskCustomerInfoVisible) {
        setDockedCustomerInfoWidth(customerInfoPanelMaxWidth);
      } else if (isConversationPanelOpen) {
        setDockedConversationWidth(conversationPanelMaxWidth);
      }
    }

    wasExpandedCanvasRouteRef.current = isExpandedCanvasRoute;
  }, [
    conversationPanelMaxWidth,
    customerInfoPanelMaxWidth,
    isConversationPanelOpen,
    isDeskCustomerInfoVisible,
    isExpandedCanvasRoute,
  ]);

  // Dock mode (isCustomerInfoDockedToConversation) persists across case switches — no auto-reset
  // on conversation hide. It is only cleared when the user explicitly undocks (drag) or closes
  // the customer info panel. The isCustomerInfoInConversationDockMode derived value already gates
  // on isDockedConversationVisible, so the docked shell stays hidden while no conversation is open.

  // Desk canvas popunder is intentionally NOT auto-cleared when navigating to the desk route.
  // Panels stay floating until the agent explicitly clicks "Dock panel".

  // Live transcript — advance through the appropriate script while a voice call is active.
  // For Terry Williams we use a custom sales-demo script; all others use the generic fallback.
  const isAgentInCallForTranscript = status === "In a Call";
  const isTerryCall = selectedAssignment.customerRecordId === "terry";
  // For Terry's call the timer only fires after the agent clicks an opening line (terryDemoStarted).
  // For all other calls the timer starts as soon as the call is active.
  const transcriptShouldRun = isAgentInCallForTranscript && (!isTerryCall || terryDemoStarted);
  const transcriptScriptRef = useRef<Omit<TranscriptLine, "id">[]>(MOCK_TRANSCRIPT_LINES);

  // When Terry's call first goes active, pre-show his greeting in the transcript.
  // The rest of the conversation stays paused until the agent clicks an AI suggested opening line.
  useEffect(() => {
    if (!isAgentInCallForTranscript || !isTerryCall) return;
    // Re-show the transcript panel whenever a new call starts (in case agent had closed it).
    setIsTranscriptVisible(true);
    setTranscriptLines((prev) => {
      // Skip if already populated with live lines. If the last line is a system
      // "call ended" message this is a new call — reset and start fresh.
      if (prev.length > 0 && prev[prev.length - 1].speaker !== "system") return prev;
      return [{ ...TERRY_TRANSCRIPT_LINES[0], id: "tl-0" }];
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAgentInCallForTranscript, isTerryCall]);

  useEffect(() => {
    if (transcriptShouldRun) {
      // Record the wall-clock time when the demo began (only on first activation).
      if (transcriptCallStartRef.current === null) {
        transcriptCallStartRef.current = Date.now();
        transcriptScriptRef.current = isTerryCall ? TERRY_TRANSCRIPT_LINES : MOCK_TRANSCRIPT_LINES;
        // For Terry, seed the greeting + Jeff's first response immediately on click.
        // For other calls, reset to empty.
        if (!isTerryCall) {
          setTranscriptLines([]);
        } else {
          setTranscriptLines([
            { ...TERRY_TRANSCRIPT_LINES[0], id: "tl-0" },
            { ...TERRY_TRANSCRIPT_LINES[1], id: "tl-1" },
          ]);
        }
      }
      const tick = () => {
        const elapsed = Math.floor((Date.now() - (transcriptCallStartRef.current ?? Date.now())) / 1000);
        const script = transcriptScriptRef.current;
        setTranscriptLines((prev) => {
          const nextIdx = prev.length;
          if (nextIdx >= script.length) return prev;
          const nextLine = script[nextIdx];
          if (elapsed >= nextLine.elapsed) {
            return [...prev, { ...nextLine, id: `tl-${nextIdx}` }];
          }
          return prev;
        });
      };
      transcriptTimerRef.current = window.setInterval(tick, 1000);
      return () => {
        if (transcriptTimerRef.current !== null) window.clearInterval(transcriptTimerRef.current);
      };
    } else {
      // Call ended (or Terry demo not yet started) — stop timer.
      if (transcriptTimerRef.current !== null) {
        window.clearInterval(transcriptTimerRef.current);
        transcriptTimerRef.current = null;
      }
      if (!isAgentInCallForTranscript) {
        // Append a "call ended" system message with call duration before clearing the start time.
        if (transcriptCallStartRef.current !== null) {
          const durationSeconds = Math.floor((Date.now() - transcriptCallStartRef.current) / 1000);
          const durationStr = formatElapsed(durationSeconds);
          setTranscriptLines((prev) => {
            // Only append if not already appended.
            if (prev.length > 0 && prev[prev.length - 1].speaker === "system") return prev;
            return [...prev, { id: `tl-end`, speaker: "system", text: `Call ended · ${durationStr}`, elapsed: durationSeconds }];
          });
        }
        transcriptCallStartRef.current = null;
        // terryDemoStarted intentionally NOT reset here so the Sales Intelligence
        // card persists in the voice tab after the call ends.
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcriptShouldRun, isAgentInCallForTranscript]);

  useEffect(() => {
    if (!isCanvasMergedIntoCombinedPanel) {
      setCombinedInteractionPanelTab((current) => current === "canvas" ? "conversation" : current);
      return;
    }

    setCombinedInteractionPanelTab((current) => {
      if (isCombinedInteractionPanel) {
        return "canvas";
      }

      return current === "conversation" ? "canvas" : current;
    });
    setIsCustomerInfoPanelOpen(true);
    setIsCustomerInfoPopunderOpen(false);

    if (isCombinedInteractionPanel || isAppSpaceSplitLayout) {
      setIsConversationPanelOpen(true);
      setIsConversationPopunderOpen(false);
    }
  }, [isAppSpaceSplitLayout, isCanvasMergedIntoCombinedPanel, isCombinedInteractionPanel, location.pathname, location.search]);

  // One-panel-docked rule: if we land on the desk route with conversation already docked
  // inline, the desk canvas must open as a popunder (not inline alongside the conversation).
  useEffect(() => {
    if (!isAppSpaceSplitLayout || deskCanvasPopunderView || !activeDeskRouteView) return;
    // Conversation is docked inline → canvas would be invisible (step 1 fix).
    // Open canvas as a popunder and leave the desk route so conversation stays full-width.
    if (!isConversationPanelOpen || isConversationPopunderOpen) return;

    const view = activeDeskRouteView;
    const defaultWidth = getDeskCanvasPopunderDefaultWidth(view);
    const defaultHeight = typeof window !== "undefined"
      ? Math.min(Math.max(DESK_CANVAS_POPOUNDER_MIN_HEIGHT, window.innerHeight - 80), window.innerHeight - DESK_CANVAS_POPOUNDER_MARGIN * 2)
      : 720;
    const width = typeof window !== "undefined"
      ? Math.min(defaultWidth, window.innerWidth - DESK_CANVAS_POPOUNDER_MARGIN * 2)
      : defaultWidth;
    const anchoredPosition = getAnchoredDeskCanvasPopunderPosition(width, defaultHeight);
    setDeskCanvasPopunderView(view);
    setDeskCanvasPopunderSize({ width, height: defaultHeight });
    setDeskCanvasPopunderPosition(anchoredPosition);
    setDeskCanvasDragActivation(null);
    navigate("/activity", { state: { hideMainCanvasPanel: true } });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAppSpaceSplitLayout, deskCanvasPopunderView, activeDeskRouteView, isConversationPanelOpen, isConversationPopunderOpen]);

  const bringFloatingPanelToFront = (panelId: FloatingPanelId) => {
    setFloatingPanelOrder((current) => [...current.filter((id) => id !== panelId), panelId]);
  };

  // Count of free-floating panels currently open — used to show/hide the snap button.
  const openFloatingPanelCount = [
    isChatPopoverOpen,
    isNotificationsPopoverOpen,
    isCustomerInfoPopunderOpen,
    isConversationPopunderOpen,
    isTranscriptPopunderOpen,
    isCopilotViewPopunderOpen,
    isDeskViewPopunderOpen,
  ].filter(Boolean).length;

  const snapPanelsToRight = () => {
    type PanelEntry = {
      setPos: (p: { x: number; y: number }) => void;
      setSize: (s: { width: number; height: number }) => void;
    };
    const panels: PanelEntry[] = [];
    if (isChatPopoverOpen)           panels.push({ setPos: setChatPopunderPosition,           setSize: setChatPopunderSize });
    if (isNotificationsPopoverOpen)  panels.push({ setPos: setNotificationsPopunderPosition,  setSize: setNotificationsPopunderSize });
    if (isCopilotViewPopunderOpen)   panels.push({ setPos: setCopilotViewPopunderPosition,    setSize: setCopilotViewPopunderSize });
    if (isDeskViewPopunderOpen)      panels.push({ setPos: setDeskViewPopunderPosition,       setSize: setDeskViewPopunderSize });
    if (isCustomerInfoPopunderOpen)  panels.push({ setPos: setCustomerInfoPopunderPosition,   setSize: setCustomerInfoPopunderSize });
    if (isConversationPopunderOpen)  panels.push({ setPos: setConversationPopunderPosition,   setSize: setConversationPopunderSize });
    if (isTranscriptPopunderOpen)    panels.push({ setPos: setTranscriptPopunderPosition,     setSize: setTranscriptPopunderSize });
    if (panels.length < 2) return;

    const PANEL_W = 360;
    const MARGIN  = 12;
    const GAP     = 8;
    const TOP_Y   = 56 + MARGIN;
    const totalH  = window.innerHeight - TOP_Y - MARGIN;
    const panelH  = Math.floor((totalH - GAP * (panels.length - 1)) / panels.length);
    const x       = window.innerWidth - PANEL_W - MARGIN;

    panels.forEach((panel, i) => {
      panel.setPos({ x, y: TOP_Y + i * (panelH + GAP) });
      panel.setSize({ width: PANEL_W, height: panelH });
    });
  };

  const getFloatingPanelZIndex = (panelId: FloatingPanelId) => {
    const index = floatingPanelOrder.indexOf(panelId);
    return FLOATING_PANEL_BASE_Z_INDEX + (index === -1 ? 0 : index);
  };

  const handleCreateWorkspace = () => {
    const nextWorkspaceNumber = workspaceOptions.filter((workspace) => workspace.id.startsWith("custom-")).length + 1;
    const newWorkspace: WorkspaceOption = {
      id: `custom-${Date.now()}`,
      name: `New Workspace ${nextWorkspaceNumber}`,
      description: "Custom workspace created from scratch",
    };

    setWorkspaceOptions((current) => [...current, newWorkspace]);
    setActiveWorkspaceId(newWorkspace.id);
    toast.success(`${newWorkspace.name} created`, {
      description: "You can now tailor this workspace for a new team or workflow.",
    });
  };

  const closeCombinedInteractionPanel = () => {
    setConversationDragActivation(null);
    setCustomerInfoDragActivation(null);
    setIsConversationPopunderOpen(false);
    setIsCustomerInfoPopunderOpen(false);
    setIsConversationPanelOpen(false);
    setIsCustomerInfoPanelOpen(false);
  };

  const openCombinedInteractionPanel = (tab: CombinedInteractionPanelTab) => {
    setCombinedInteractionPanelTab(tab);
    setDockedConversationWidth((current) => Math.min(conversationPanelMaxWidth, Math.max(current, 360)));
    setIsConversationPanelOpen(true);
    setIsConversationPopunderOpen(false);
    setConversationDragActivation(null);
    setIsCustomerInfoPanelOpen(true);
    setIsCustomerInfoPopunderOpen(false);
    setCustomerInfoDragActivation(null);
  };

  // Remove a single-channel card's channel row but keep the task in the rail,
  // switching the conversation panel to the task summary view.
  const closeChannelKeepTask = (assignmentId: string) => {
    setTaskSummaryIds((prev) => new Set([...prev, assignmentId]));
    setIsConversationPanelOpen(true);
    setSelectedAssignmentId(assignmentId);
  };

  const closeConversationPanel = () => {
    // If closing while in post-call history mode, fully remove the call assignment first.
    if (isPostCallHistoryMode && postCallAssignmentIdRef.current !== null) {
      const postCallId = postCallAssignmentIdRef.current;
      setIsPostCallHistoryMode(false);
      postCallAssignmentIdRef.current = null;
      handleRemoveVisibleAssignment(postCallId);
    }
    if (isCombinedInteractionPanel) {
      closeCombinedInteractionPanel();
      return;
    }
    setIsConversationPanelOpen(false);
  };

  const openConversationPanel = () => {
    if (isCombinedInteractionPanel) {
      openCombinedInteractionPanel("conversation");
      return;
    }

    // Panel is already floating — preserve its drag state, just surface it
    if (isConversationPopunderOpen) {
      bringFloatingPanelToFront("conversation");
      return;
    }

    const { conversationWidth, customerInfoWidth } = getBalancedDockedPanelWidths({
      hasDesktopRightPanel: activeRightPanel !== null,
      reserveMainWorkspace: isMainCanvasVisible,
      showConversation: true,
      showCustomerInfo: isDeskCustomerInfoVisible,
      hasMainCanvas: isMainCanvasVisible,
      currentConversationWidth: dockedConversationWidth,
      currentCustomerInfoWidth: dockedCustomerInfoWidth,
    });

    setDockedConversationWidth(conversationWidth);
    if (isDeskCustomerInfoVisible) {
      setDockedCustomerInfoWidth(customerInfoWidth);
    }
    setIsConversationPanelOpen(true);
    setIsConversationPopunderOpen(false);
    setConversationDragActivation(null);
  };

  const openCustomerConversation = (customerRecordId: string, channel: AssignmentChannel) => {
    // SMS is a single thread per customer — if one is already open, switch to it instead of opening a new one
    if (channel === "sms") {
      const existingSms = visibleAssignmentIds
        .map((id) => assignmentItemsById[id])
        .find((item) => item?.customerRecordId === customerRecordId && item?.channel === "sms");

      if (existingSms) {
        setSelectedAssignmentId(existingSms.id);
        openConversationPanel();
        return existingSms;
      }
    }

    // Voice — reuse an existing history-only voice assignment if one exists (e.g. opened via "Review Lead")
    if (channel === "voice") {
      const existingVoice = visibleAssignmentIds
        .map((id) => assignmentItemsById[id])
        .find((item) => item?.customerRecordId === customerRecordId && item?.channel === "voice" && historyOnlyAssignmentIds.has(item.id));

      if (existingVoice) {
        setHistoryOnlyAssignmentIds((prev) => {
          const next = new Set(prev);
          next.delete(existingVoice.id);
          return next;
        });
        setSelectedAssignmentId(existingVoice.id);
        openConversationPanel();
        return existingVoice;
      }
    }

    // Find any existing assignment for this customer so display data (name, initials, etc.)
    // is taken from their real card rather than falling back to the first static item.
    const existingAssignment = visibleAssignmentIds
      .map((id) => assignmentItemsById[id])
      .find((item) => item?.customerRecordId === customerRecordId);

    const nextAssignment = createLaunchedAssignment(customerRecordId, channel, existingAssignment);

    // Inherit the case's current status so opening a new channel (e.g. email)
    // doesn't silently downgrade an escalated case back to "open".
    const statusSeverityMap: Record<string, number> = { escalated: 4, pending: 3, open: 2, resolved: 1, parked: 0 };
    const inheritedStatus = visibleAssignmentIds
      .map((id) => assignmentItemsById[id])
      .filter((item) => item?.customerRecordId === customerRecordId)
      .reduce<QueueAssignmentStatus>((highest, item) => {
        const s = (assignmentStatusesById[item!.id] ?? "open") as QueueAssignmentStatus;
        return (statusSeverityMap[s] ?? 0) > (statusSeverityMap[highest] ?? 0) ? s : highest;
      }, "open");

    setDeskPanelSelection(null);
    setAssignmentItemsById((currentItems) => ({
      ...currentItems,
      [nextAssignment.id]: nextAssignment,
    }));
    setVisibleAssignmentIds((currentIds) => [nextAssignment.id, ...currentIds]);
    setAssignmentStatusesById((currentStatuses) => ({
      ...currentStatuses,
      [nextAssignment.id]: inheritedStatus,
    }));
    setSelectedAssignmentId(nextAssignment.id);
    setConversationStatesByKey((currentStates) => {
      // Restore archived state if the agent previously removed this channel.
      const archiveKey = `${customerRecordId}::${channel}`;
      const archived = channelStateArchiveRef.current.get(archiveKey);
      if (archived) {
        channelStateArchiveRef.current.delete(archiveKey);
      }
      return {
        ...currentStates,
        [getConversationStateKey(nextAssignment.id)]: archived ?? createFreshConversationState(customerRecordId, channel),
      };
    });
    // Clear history-only mode for any assignments belonging to this customer — a channel is now open.
    setHistoryOnlyAssignmentIds((prev) => {
      const customerAssignmentIds = visibleAssignmentIds.filter(
        (id) => assignmentItemsById[id]?.customerRecordId === customerRecordId,
      );
      if (customerAssignmentIds.some((id) => prev.has(id))) {
        const next = new Set(prev);
        customerAssignmentIds.forEach((id) => next.delete(id));
        return next;
      }
      return prev;
    });
    openConversationPanel();

    return nextAssignment;
  };

  const openRecentInteractionAssignment = (interaction: RecentInteractionItem) => {
    const matchedCustomer = customerDatabase.find((customer) => customer.customerId === interaction.customerId);
    const customerRecordId = matchedCustomer?.id ?? selectedAssignment.customerRecordId;
    const nextAssignment = createRecentInteractionAssignment(interaction, customerRecordId);
    const nextStatus = getRecentInteractionAssignmentStatus(interaction.status);
    const conversationStateKey = getConversationStateKey(nextAssignment.id);

    setDeskPanelSelection(null);
    setAssignmentItemsById((currentItems) => ({
      ...currentItems,
      [nextAssignment.id]: nextAssignment,
    }));
    setVisibleAssignmentIds((currentIds) => [nextAssignment.id, ...currentIds.filter((currentId) => currentId !== nextAssignment.id)]);
    setAssignmentStatusesById((currentStatuses) => ({
      ...currentStatuses,
      [nextAssignment.id]: nextStatus,
    }));
    setSelectedAssignmentId(nextAssignment.id);
    setPendingCallCustomerRecordId(customerRecordId);
    setConversationStatesByKey((currentStates) => {
      if (currentStates[conversationStateKey]) {
        return currentStates;
      }

      return {
        ...currentStates,
        [conversationStateKey]: createConversationState(customerRecordId, nextAssignment.channel),
      };
    });
    openConversationPanel();
  };

  const openCallDisposition = (anchorRect?: DOMRect | null) => {
    bringFloatingPanelToFront("call");
    setCallPopunderMode("disposition");
    setCallPopunderPosition(getAnchoredCallPopunderPosition(anchorRect));
    setIsCallPopunderOpen(true);
  };

  const handleRemoveVisibleAssignment = (assignmentId: QueuePreviewItem["id"], transferRecipient?: string | null) => {
    const removedAssignment = assignmentItemsById[assignmentId];
    const conversationStateKey = getConversationStateKey(assignmentId);
    setCompletedTodayCount((n) => n + 1);

    // If this assignment is escalated, decrement the rail badge count
    const isEscalated =
      removedAssignment?.statusLabel === "Escalated" ||
      assignmentStatusesById[assignmentId] === "escalated";
    if (isEscalated) {
      setEscalatedRailCount((n) => Math.max(0, n - 1));
    }

    // Remove the case from the ControlPanel static queue by reverse-looking up
    // acceptedStaticsStore (staticId → assignmentId) and adding to pendingQueueRejections.
    let dismissedStaticId: string | undefined;
    for (const [staticId, acceptedId] of acceptedStaticsStore.entries()) {
      if (acceptedId === assignmentId) {
        dismissedStaticId = staticId;
        pendingQueueRejections.add(staticId);
        acceptedStaticsStore.delete(staticId);
        break;
      }
    }

    if (removedAssignment) {
      // Capture the status at the moment of dismissal so the queue row retains it
      // (e.g. "pending" stays "pending" — it should not be forced to "resolved").
      const dismissedStatus: QueueAssignmentStatus =
        (assignmentStatusesById[assignmentId] as QueueAssignmentStatus | undefined) ??
        (removedAssignment.statusLabel?.toLowerCase() as QueueAssignmentStatus | undefined) ??
        "open";
      setResolvedAssignments((prev) => {
        // Deduplicate: if we already have a dismissed entry for this static case, replace it
        // rather than appending — prevents multiple supervise→dismiss cycles from piling up.
        const filtered = dismissedStaticId
          ? prev.filter((r) => r.staticId !== dismissedStaticId)
          : prev;
        return [
          {
            id: removedAssignment.id,
            name: removedAssignment.name,
            preview: removedAssignment.preview,
            priority: removedAssignment.priority,
            channel: removedAssignment.channel,
            resolvedAt: Date.now(),
            customerRecordId: removedAssignment.customerRecordId,
            status: dismissedStatus,
            assignedTo: transferRecipient === null ? null : (transferRecipient ?? CURRENT_AGENT_NAME),
            staticId: dismissedStaticId,
          },
          ...filtered,
        ];
      });
    }

    if (customerReplyTimeoutsRef.current[conversationStateKey] !== undefined) {
      window.clearTimeout(customerReplyTimeoutsRef.current[conversationStateKey]);
      delete customerReplyTimeoutsRef.current[conversationStateKey];
    }

    setVisibleAssignmentIds((currentIds) => {
      const nextIds = currentIds.filter((currentId) => currentId !== assignmentId);

      if (selectedAssignmentId === assignmentId) {
        setSelectedAssignmentId(nextIds[0] ?? initialSelectedAssignmentId);
      }

      return nextIds;
    });
    setAssignmentItemsById((currentItems) => {
      const nextItems = { ...currentItems };
      delete nextItems[assignmentId];
      return nextItems;
    });
    setConversationStatesByKey((currentStates) => {
      // Archive the conversation state so it can be restored if the agent reopens this channel.
      if (removedAssignment && currentStates[conversationStateKey]) {
        const archiveKey = `${removedAssignment.customerRecordId}::${removedAssignment.channel}`;
        channelStateArchiveRef.current.set(archiveKey, currentStates[conversationStateKey]);
      }
      const nextStates = { ...currentStates };
      delete nextStates[conversationStateKey];
      return nextStates;
    });
    setOverviewOpenByAssignmentId((currentOverviewState) => {
      const nextOverviewState = { ...currentOverviewState };
      delete nextOverviewState[assignmentId];
      return nextOverviewState;
    });
    // Note: assignmentStatusesById intentionally NOT cleared here.
    // The last-known status is preserved so the Control Center can keep
    // closed tasks in their final tab (pending / escalated / etc.) and
    // show Transfer / Open buttons instead of "In Progress".

    if (activeCallAssignmentId === assignmentId) {
      setActiveCallAssignmentId(null);
    }
    // Clear any task-summary state for this assignment
    setTaskSummaryIds((prev) => {
      const next = new Set(prev);
      next.delete(assignmentId);
      return next;
    });
  };

  /**
   * Batch dismiss all channels that belong to a single customer's grouped card.
   * Compared to calling handleRemoveVisibleAssignment per-channel, this preserves
   * sibling channel state inside ONE ResolvedAssignment so the agent can restore
   * all channels when they re-open the case.
   */
  const handleRemoveGroupedAssignments = (assignmentIds: string[], transferRecipient?: string | null) => {
    if (assignmentIds.length === 0) return;
    if (assignmentIds.length === 1) {
      handleRemoveVisibleAssignment(assignmentIds[0], transferRecipient);
      return;
    }

    // Find the primary assignment (the one keyed in acceptedStaticsStore → has a staticId)
    let primaryId: string | undefined;
    let dismissedStaticId: string | undefined;
    for (const [staticId, acceptedId] of acceptedStaticsStore.entries()) {
      if (assignmentIds.includes(acceptedId)) {
        primaryId = acceptedId;
        dismissedStaticId = staticId;
        break;
      }
    }
    // Fall back to the first id if none has a static mapping
    if (!primaryId) primaryId = assignmentIds[0];

    const primaryAssignment = assignmentItemsById[primaryId];
    const additionalChannels: Array<{ channel: AssignmentChannel; preview: string }> = assignmentIds
      .filter((id) => id !== primaryId)
      .map((id) => assignmentItemsById[id])
      .filter(Boolean)
      .map((a) => ({ channel: a.channel as AssignmentChannel, preview: a.preview }));

    // Mark the static mapping as dismissed
    if (dismissedStaticId) {
      pendingQueueRejections.add(dismissedStaticId);
      acceptedStaticsStore.delete(dismissedStaticId);
    }

    // Decrement escalated rail badge if the primary is escalated
    const isEscalated =
      primaryAssignment?.statusLabel === "Escalated" ||
      assignmentStatusesById[primaryId] === "escalated";
    if (isEscalated) {
      setEscalatedRailCount((n) => Math.max(0, n - 1));
    }

    // Create ONE ResolvedAssignment for the primary, embedding additional channel info
    if (primaryAssignment) {
      const dismissedStatus: QueueAssignmentStatus =
        (assignmentStatusesById[primaryId] as QueueAssignmentStatus | undefined) ??
        (primaryAssignment.statusLabel?.toLowerCase() as QueueAssignmentStatus | undefined) ??
        "open";
      setResolvedAssignments((prev) => {
        const filtered = dismissedStaticId
          ? prev.filter((r) => r.staticId !== dismissedStaticId)
          : prev;
        return [
          {
            id: primaryAssignment.id,
            name: primaryAssignment.name,
            preview: primaryAssignment.preview,
            priority: primaryAssignment.priority,
            channel: primaryAssignment.channel,
            resolvedAt: Date.now(),
            customerRecordId: primaryAssignment.customerRecordId,
            status: dismissedStatus,
            assignedTo: transferRecipient === null ? null : (transferRecipient ?? CURRENT_AGENT_NAME),
            staticId: dismissedStaticId,
            additionalChannels: additionalChannels.length > 0 ? additionalChannels : undefined,
          },
          ...filtered,
        ];
      });
    }

    // Archive conversation state for ALL channels (primary + siblings)
    setConversationStatesByKey((currentStates) => {
      const nextStates = { ...currentStates };
      assignmentIds.forEach((assignmentId) => {
        const assignment = assignmentItemsById[assignmentId];
        const conversationStateKey = getConversationStateKey(assignmentId);
        if (assignment && currentStates[conversationStateKey]) {
          const archiveKey = `${assignment.customerRecordId}::${assignment.channel}`;
          channelStateArchiveRef.current.set(archiveKey, currentStates[conversationStateKey]);
        }
        delete nextStates[conversationStateKey];
      });
      return nextStates;
    });

    // Clear call timeouts for all channels
    assignmentIds.forEach((assignmentId) => {
      const conversationStateKey = getConversationStateKey(assignmentId);
      if (customerReplyTimeoutsRef.current[conversationStateKey] !== undefined) {
        window.clearTimeout(customerReplyTimeoutsRef.current[conversationStateKey]);
        delete customerReplyTimeoutsRef.current[conversationStateKey];
      }
    });

    // Clear active call if any channel was it
    if (assignmentIds.includes(activeCallAssignmentId ?? "")) {
      setActiveCallAssignmentId(null);
    }

    // Clear task-summary entries
    setTaskSummaryIds((prev) => {
      const next = new Set(prev);
      assignmentIds.forEach((id) => next.delete(id));
      return next;
    });

    // Clear overview-open entries
    setOverviewOpenByAssignmentId((currentOverviewState) => {
      const nextOverviewState = { ...currentOverviewState };
      assignmentIds.forEach((id) => delete nextOverviewState[id]);
      return nextOverviewState;
    });

    setCompletedTodayCount((n) => n + 1);

    // Remove all assignments from the visible rail
    setVisibleAssignmentIds((currentIds) => {
      const nextIds = currentIds.filter((id) => !assignmentIds.includes(id));
      if (assignmentIds.includes(selectedAssignmentId)) {
        setSelectedAssignmentId(nextIds[0] ?? initialSelectedAssignmentId);
      }
      return nextIds;
    });

    // Remove from items map
    setAssignmentItemsById((currentItems) => {
      const nextItems = { ...currentItems };
      assignmentIds.forEach((id) => delete nextItems[id]);
      return nextItems;
    });
  };

  const removePending = (assignmentId: string) =>
    setPendingAcceptanceIds((prev) => { const n = new Set(prev); n.delete(assignmentId); return n; });

  const acceptPendingAssignment = (assignmentId: string) => {
    removePending(assignmentId);
    // Advance the status badge from "open" → "pending" so the left rail
    // visually reflects that the agent has accepted and is working on it.
    setAssignmentStatusesById((prev) => {
      if ((prev[assignmentId] ?? "open") === "open") {
        return { ...prev, [assignmentId]: "pending" };
      }
      return prev;
    });
    setSelectedAssignmentId(assignmentId);
    const assignment = assignmentItemsById[assignmentId];
    if (assignment?.channel === "voice") {
      setJoiningCallAssignmentId(assignmentId);
      setCallPopunderMode("setup");
      setCallPopunderPosition(getAnchoredCallPopunderPosition());
      setIsCallPopunderOpen(true);
    }
    navigate("/activity");
  };

  const rejectPendingAssignment = (assignmentId: string) => {
    removePending(assignmentId);
    handleRemoveVisibleAssignment(assignmentId);
  };

  const reviewPendingAssignment = (assignmentId: string) => {
    // Do NOT remove from pending — buttons stay until the agent accepts.
    // Just select the assignment and navigate so the agent can read the conversation.
    setReviewedAssignmentIds((prev) => new Set([...prev, assignmentId]));
    setSelectedAssignmentId(assignmentId);
    navigate("/activity");
  };

  // ── Incoming notification actions ─────────────────────────────────────────
  const removeIncoming = (assignmentId: string) =>
    setIncomingNotifications((prev) => prev.filter((n) => n.id !== assignmentId));

  /** Dismiss the escalation toast that belongs to a given customer (if any).
   * Preserves "transferred" notifications — those should stay visible after takeover. */
  const dismissIncomingByCustomer = (customerRecordId: string) =>
    setIncomingNotifications((prev) =>
      prev.filter((n) => n.customerRecordId !== customerRecordId || n.statusLabel === "transferred"),
    );

  /**
   * Always shows a "transferred" handoff toast for the given item, regardless of whether
   * the original toast was visible or has already been dismissed.
   * Removes any existing notification for the same customer first to avoid duplicates,
   * then pushes a fresh one with statusLabel "transferred".
   *
   * Accepts minimal data and builds a full QueuePreviewItem with sensible defaults.
   */
  const pushTransferredToast = useCallback((data: {
    name: string;
    customerRecordId: string;
    customerId?: string;
    id?: string;
    channel: AssignmentChannel;
    label?: string;
    priority?: string;
    preview?: string;
  }) => {
    // Compute initials from name: first letter of first word + first letter of second word
    const parts = data.name.split(" ").filter(p => p.length > 0);
    const initials = (parts[0]?.[0] ?? "").toUpperCase() + (parts[1]?.[0] ?? "").toUpperCase();

    setIncomingNotifications((prev) => {
      const filtered = prev.filter((n) => n.customerRecordId !== data.customerRecordId);
      const id = data.id ?? `transferred-${data.customerRecordId}-${Date.now()}`;
      const now = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      const dateStr = new Date().toLocaleDateString([], { month: "short", day: "numeric" });

      const fullItem: QueuePreviewItem = {
        id,
        customerRecordId: data.customerRecordId,
        customerId: data.customerId ?? "",
        channel: data.channel,
        name: data.name,
        initials,
        label: data.label,
        priority: data.priority ?? "Medium",
        preview: data.preview ?? "",
        lastUpdated: dateStr,
        time: now,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        icon: MessageCircle,
        badgeColor: "#E32926",
        priorityClassName: "border-[#E53935] bg-[#FDEAEA] text-[#C71D1A]",
        statusLabel: "transferred",
      };

      return [...filtered, fullItem];
    });
  }, []);

  /**
   * Ref that caches the original QueuePreviewItem when the agent opens the review modal
   * (which removes it from incomingNotifications). Used to rebuild the transferred toast
   * when takeover happens via the modal.
   */
  const pendingTransferItemRef = useRef<QueuePreviewItem | null>(null);

  /** Called when the agent approves from the toast and the animation fully resolves. */
  const resolveIncomingByApprove = (item: QueuePreviewItem) => {
    markActedOn(item.customerRecordId);
    const sa = staticAssignments.find(
      (s) => s.customerRecordId === item.customerRecordId || s.customerId === item.customerId,
    );
    // Mark resolved in the shared queue-state so ControlPanelPage updates on next render
    pendingResolvedIds.add(sa?.id ?? item.id);
    setEscalatedRailCount((n) => Math.max(0, n - 1));
    // Advance the escalation chain for each known customer record
    if (item.customerRecordId === "jordan") setIsJordanResolved(true);
    if (item.customerRecordId === "sofia") setIsSofiaResolved(true);
    if (item.customerRecordId === "marcus") setIsMarcusResolved(true);
    // Flip the item's statusLabel in the notification list so the toast header
    // immediately reflects the resolved state without needing to dismiss first
    setIncomingNotifications((prev) =>
      prev.map((n) => n.id === item.id ? { ...n, statusLabel: "resolved" } : n)
    );
  };

  const markActedOn = (customerRecordId: string) => {
    setActedOnNotifications((prev) => { const next = new Set(prev); next.add(customerRecordId); return next; });
  };

  const monitorIncomingAssignment = (item: QueuePreviewItem) => {
    // Cache the original item so that if the agent takes over via the modal we can
    // push a transferred toast. The toast is intentionally NOT removed here —
    // it stays visible until the agent clicks ✕ to dismiss or takes over the case.
    markActedOn(item.customerRecordId);
    pendingTransferItemRef.current = item;
    // Always open the monitor modal on the current page — no navigation required
    const sa = staticAssignments.find(
      (s) => s.customerRecordId === item.customerRecordId || s.customerId === item.customerId,
    );
    // If the case was already resolved via toast Approve, open the modal in resolved state
    const effectiveStatus = item.statusLabel === "resolved" ? "resolved"
      : item.statusLabel === "Escalated" ? "escalated"
      : (sa?.status ?? "open");
    setEscalatedToastModal({
      id: sa?.id ?? item.id,
      name: item.name,
      customerId: item.customerId,
      customerRecordId: sa?.customerRecordId ?? item.customerRecordId,
      channel: item.channel,
      priority: item.priority,
      botType: sa?.botType ?? "Service Bot",
      waitTime: item.time,
      preview: item.preview,
      customerContext: sa?.customerContext,
      aiOverview: sa?.aiOverview ?? { actions: [] },
      status: effectiveStatus,
      escalatedAt: item.escalatedAt,
      aiConfidence: sa?.aiConfidence,
      aiConfidenceReason: sa?.aiConfidenceReason,
    });
  };

  // Approve directly from the toast — opens the modal with autoApprove so the sequence plays immediately
  const approveIncomingAssignment = (item: QueuePreviewItem) => {
    markActedOn(item.customerRecordId);
    removeIncoming(item.id);
    const sa = staticAssignments.find(
      (s) => s.customerRecordId === item.customerRecordId || s.customerId === item.customerId,
    );
    const effectiveStatus = item.statusLabel === "Escalated" ? "escalated" : (sa?.status ?? "open");
    setEscalatedToastModal({
      id: sa?.id ?? item.id,
      name: item.name,
      customerId: item.customerId,
      customerRecordId: sa?.customerRecordId ?? item.customerRecordId,
      channel: item.channel,
      priority: item.priority,
      botType: sa?.botType ?? "Service Bot",
      waitTime: item.time,
      preview: item.preview,
      customerContext: sa?.customerContext,
      aiOverview: sa?.aiOverview ?? { actions: [] },
      status: effectiveStatus,
      escalatedAt: item.escalatedAt,
      aiConfidence: sa?.aiConfidence,
      aiConfidenceReason: sa?.aiConfidenceReason,
      autoApprove: true,
    });
  };

  const takeoverIncomingAssignment = (item: QueuePreviewItem) => {
    markActedOn(item.customerRecordId);
    // Always show the handoff toast — even if the original toast was already dismissed.
    pushTransferredToast(item);
    // Find the matching static assignment so acceptedStaticsStore is kept in sync
    const sa = staticAssignments.find(
      (s) => s.customerRecordId === item.customerRecordId || s.customerId === item.customerId,
    );
    // Mark the static case as "handled" so the queue removes it on next render
    // (prevents double-entry when the live resolved assignment appears in resolvedNormalised).
    if (sa) pendingQueueRejections.add(sa.id);
    const customerRecordId = sa?.customerRecordId ?? item.customerRecordId;
    const botAuthor = item.label ?? "Aria";
    // Use the shared buildTakeoverConversation — same function TakeoverButton and the
    // toast modal use, so every takeover path produces identical output.
    const initialConversation = customerRecordId
      ? buildTakeoverConversation({
          customerRecordId,
          customerName: item.name,
          botType: botAuthor,
          channel: (item.channel === "sms" ? "sms" : "chat") as "chat" | "sms",
          aiWhyNeeded: sa?.aiOverview?.whyNeeded ?? null,
        })
      : undefined;

    acceptIssue({
      id: sa?.id ?? item.id,
      name: item.name,
      customerId: item.customerId,
      customerRecordId,
      channel: item.channel,
      priority: item.priority,
      preview: item.preview,
      status: (item.statusLabel?.toLowerCase() ?? sa?.status ?? "open") as QueueAssignmentStatus, // eslint-disable-line @typescript-eslint/no-unnecessary-type-assertion
      waitTime: item.time,
      initialConversation,
      onCreated: sa
        ? (assignmentId) => { acceptedStaticsStore.set(sa.id, assignmentId); }
        : undefined,
    });
  };

  const transferIncomingAssignment = (item: QueuePreviewItem) => {
    // Simply dismiss — no need to add to any queue; transfer is handled inside the popover.
    removeIncoming(item.id);
  };

  const parkIncomingAssignment = (item: QueuePreviewItem) => {
    removeIncoming(item.id);
    // Add to visible list with "parked" status — shows on control panel but not left rail.
    setVisibleAssignmentIds((current) => [...current, item.id]);
    setAssignmentStatusesById((prev) => ({ ...prev, [item.id]: "parked" }));
  };

  const acceptIncomingAssignment = (item: QueuePreviewItem) => {
    removeIncoming(item.id);
    setVisibleAssignmentIds((current) => [...current, item.id]);
    setAssignmentStatusesById((prev) => ({ ...prev, [item.id]: "pending" }));
    setSelectedAssignmentId(item.id);
    if (item.channel === "voice") {
      setJoiningCallAssignmentId(item.id);
      setCallPopunderMode("setup");
      setCallPopunderPosition(getAnchoredCallPopunderPosition());
      setIsCallPopunderOpen(true);
    }
    navigate("/activity");
  };

  const reviewIncomingAssignment = (item: QueuePreviewItem) => {
    removeIncoming(item.id);
    setVisibleAssignmentIds((current) => [...current, item.id]);
    setReviewedAssignmentIds((prev) => new Set([...prev, item.id]));
    setSelectedAssignmentId(item.id);
    navigate("/activity");
  };
  // ──────────────────────────────────────────────────────────────────────────

  const acceptIssue = (data: AcceptIssueData) => {
    const timestamp = new Date();
    const isoTimestamp = timestamp.toISOString();
    const initials = data.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
    const priorityKey = data.priority.toLowerCase();

    const newItem: QueuePreviewItem = {
      id: `issue-${data.id}-${timestamp.getTime()}`,
      customerRecordId: data.customerRecordId ?? `issue-${data.id}`,
      channel: data.channel,
      initials,
      name: data.name,
      customerId: data.customerId,
      lastUpdated: formatRecentInteractionTimestamp(timestamp),
      time: data.waitTime,
      preview: data.preview,
      priority: data.priority,
      priorityClassName: priorityClassNameMap[priorityKey] ?? priorityClassNameMap.medium,
      badgeColor: priorityBadgeColorMap[priorityKey] ?? priorityBadgeColorMap.medium,
      icon: launchedAssignmentIconMap[data.channel],
      isActive: false,
      createdAt: isoTimestamp,
      updatedAt: isoTimestamp,
    };

    const conversationStateKey = getConversationStateKey(newItem.id);
    // Check the module-level handoff store first — this is written synchronously by
    // TakeoverButton.handleConfirm before the navigation fires, so it is always up-to-date
    // regardless of React state batching. Clear after reading so it is only applied once.
    const pendingHandoff = data.customerRecordId
      ? pendingHandoffConversations.get(data.customerRecordId)
      : undefined;
    if (pendingHandoff && data.customerRecordId) pendingHandoffConversations.delete(data.customerRecordId);
    const conversationState = pendingHandoff ?? data.initialConversation ?? createCustomConversationState(data.name, data.channel, data.preview);

    setAssignmentItemsById((current) => ({ ...current, [newItem.id]: newItem }));
    setVisibleAssignmentIds((current) => [newItem.id, ...current]);
    setAssignmentStatusesById((current) => ({ ...current, [newItem.id]: data.status }));
    setSelectedAssignmentId(newItem.id);
    setConversationStatesByKey((current) => ({ ...current, [conversationStateKey]: conversationState }));
    // When opening as history-only (e.g. a lead review), suppress channel tabs and start on Customer History.
    if (data.openAsHistoryOnly) {
      setHistoryOnlyAssignmentIds((prev) => new Set([...prev, newItem.id]));
    }
    data.onCreated?.(newItem.id);
    setContentRevealTrigger((t) => t + 1);

    navigate("/activity");
  };

  const dockConversationPanel = () => {
    if (isCombinedInteractionPanel) {
      openCombinedInteractionPanel("conversation");
      return;
    }

    // Only one panel can be docked at a time — float/close all other docked panels.
    if (isDeskCustomerInfoVisible) {
      setCustomerInfoPopunderPosition(getAnchoredCustomerInfoPopunderPosition());
      setIsCustomerInfoPopunderOpen(true);
    }
    setActiveRightPanel(null);

    // On the desk route the canvas panel is displayed inline. Docking the conversation
    // panel means the canvas must become a floating popunder (one-panel-docked rule).
    if (isDeskRoute && !deskCanvasPopunderView) {
      const view = activeDeskRouteView ?? "desk";
      const defaultWidth = getDeskCanvasPopunderDefaultWidth(view);
      const defaultHeight = typeof window !== "undefined"
        ? Math.min(Math.max(DESK_CANVAS_POPOUNDER_MIN_HEIGHT, window.innerHeight - 80), window.innerHeight - DESK_CANVAS_POPOUNDER_MARGIN * 2)
        : 720;
      const width = typeof window !== "undefined"
        ? Math.min(defaultWidth, window.innerWidth - DESK_CANVAS_POPOUNDER_MARGIN * 2)
        : defaultWidth;
      const position = getAnchoredDeskCanvasPopunderPosition(width, defaultHeight);
      bringFloatingPanelToFront("deskCanvas");
      setDeskCanvasPopunderView(view);
      setDeskCanvasPopunderSize({ width, height: defaultHeight });
      setDeskCanvasPopunderPosition(position);
      setDeskCanvasDragActivation(null);
      navigate("/activity", { state: { hideMainCanvasPanel: true } });
    }

    const { conversationWidth } = getBalancedDockedPanelWidths({
      hasDesktopRightPanel: activeRightPanel !== null,
      reserveMainWorkspace: isMainCanvasVisible,
      showConversation: true,
      showCustomerInfo: false,
      hasMainCanvas: isMainCanvasVisible,
      currentConversationWidth: dockedConversationWidth,
      currentCustomerInfoWidth: dockedCustomerInfoWidth,
    });

    setDockedConversationWidth(conversationWidth);
    setIsConversationPanelOpen(true);
    setIsConversationPopunderOpen(false);
    setConversationDragActivation(null);
  };

  const toggleConversationPanel = () => {
    if (isConversationPanelOpen) {
      closeConversationPanel();
      return;
    }

    openConversationPanel();
  };

  const openConversationPopunder = (anchorRect?: DOMRect | null) => {
    if (isConversationPanelOpen) return;

    bringFloatingPanelToFront("conversation");
    if (!isConversationPopunderOpen) {
      setConversationPopunderPosition(getAnchoredConversationPopunderPosition(anchorRect));
    }
    setConversationDragActivation(null);
    setIsConversationPopunderOpen(true);
  };

  const closeConversationPopunder = () => {
    setConversationDragActivation(null);
    setIsConversationPopunderOpen(false);
  };

  const openCustomerInfoPanel = () => {
    if (isCombinedInteractionPanel) {
      openCombinedInteractionPanel("customerInfo");
      return;
    }

    if (isDeskRoute && isCombinedInteractionPanelCanvasEnabled) {
      setCombinedInteractionPanelTab("customerInfo");
      setIsCustomerInfoPanelOpen(true);
      if (!isCustomerInfoPopunderOpen) {
        setIsCustomerInfoPopunderOpen(false);
        setCustomerInfoDragActivation(null);
      }
      return;
    }

    // Panel is already floating — preserve its drag state, just surface it
    if (isCustomerInfoPopunderOpen) {
      bringFloatingPanelToFront("customerInfo");
      return;
    }

    // Only one panel can be docked at a time — float/close all other docked panels.
    if (isDockedConversationVisible) {
      setConversationPopunderPosition(getAnchoredConversationPopunderPosition());
      setIsConversationPanelOpen(false);
      setIsConversationPopunderOpen(true);
    }
    setActiveRightPanel(null);

    const { customerInfoWidth } = getBalancedDockedPanelWidths({
      hasDesktopRightPanel: false,
      reserveMainWorkspace: isMainCanvasVisible,
      showConversation: false,
      showCustomerInfo: true,
      hasMainCanvas: isMainCanvasVisible,
      currentConversationWidth: dockedConversationWidth,
      currentCustomerInfoWidth: dockedCustomerInfoWidth,
    });

    setIsCustomerInfoPanelOpen(true);
    setIsCustomerInfoPopunderOpen(false);
    setCustomerInfoDragActivation(null);
    setDockedCustomerInfoWidth(customerInfoWidth);
  };

  const openCustomerInfoPopunder = (event?: React.MouseEvent<HTMLElement>) => {
    if (isDeskRoute && activeDeskRouteView === "customer") {
      closeAppSpacePanel();
      return;
    }

    if (isCombinedInteractionPanel) {
      openCombinedInteractionPanel("customerInfo");
      return;
    }

    if (!isCustomerInfoPanelAllowed) {
      const anchorRect = event?.currentTarget.getBoundingClientRect();
      const nextPosition = getAnchoredCustomerInfoPopunderPosition(anchorRect);

      bringFloatingPanelToFront("customerInfo");
      setCustomerInfoPopunderPosition(nextPosition);
      setIsCustomerInfoPanelOpen(true);
      setIsCustomerInfoPopunderOpen(true);
      setCustomerInfoDragActivation(
        event
          ? {
              id: Date.now(),
              offset: {
                x: event.clientX - nextPosition.x,
                y: event.clientY - nextPosition.y,
              },
            }
          : null,
      );
      return;
    }

    setDeskPanelSelection({ initialTab: "Overview" });
    setIsCustomerInfoPanelOpen(false);
    setIsCustomerInfoPopunderOpen(false);
    setCustomerInfoDragActivation(null);
    navigate("/desk?view=customer");
  };

  // Always opens as a floating/drag panel — used by the inline customer icon button.
  const openCustomerInfoAsFloat = (event?: React.MouseEvent<HTMLElement>) => {
    const anchorRect = event?.currentTarget.getBoundingClientRect();
    const nextPosition = getAnchoredCustomerInfoPopunderPosition(anchorRect);

    bringFloatingPanelToFront("customerInfo");
    setCustomerInfoPopunderPosition(nextPosition);
    setIsCustomerInfoPanelOpen(true);
    setIsCustomerInfoPopunderOpen(true);
    setCustomerInfoDragActivation(
      event
        ? {
            id: Date.now(),
            offset: {
              x: event.clientX - nextPosition.x,
              y: event.clientY - nextPosition.y,
            },
          }
        : null,
    );
  };

  // Docks the transcript panel adjacent to the conversation panel.
  // Mutually exclusive with customer info docking — undocks customer info if it is currently docked.
  const dockTranscriptToConversation = () => {
    if (isCustomerInfoDockedToConversation) {
      setIsCustomerInfoDockedToConversation(false);
      setIsCustomerInfoPopunderOpen(true);
    }
    setIsTranscriptDockedToConversation(true);
    setIsConversationDockedPanelOpen(true);
    setIsTranscriptPopunderOpen(false);
    setTranscriptDragActivation(null);
  };

  const openChatPopover = (
    anchorRect?: DOMRect | null,
    agent?: { id: string; name: string; initials: string; role: string; avatarColor?: string; status?: "online" | "away" | "offline" },
    autoCall?: boolean,
  ) => {
    const margin = 16;
    const gap = 12;
    const popunderWidth = Math.min(chatPopunderSize.width, window.innerWidth - margin * 2);
    let x: number;
    let y: number;
    if (anchorRect) {
      // Position to the right of the card with a small gap
      x = Math.min(anchorRect.right + gap, window.innerWidth - popunderWidth - margin);
      x = Math.max(margin, x);
      y = Math.max(margin, anchorRect.top);
    } else {
      const buttonBounds = chatButtonRef.current?.getBoundingClientRect();
      x = buttonBounds
        ? Math.min(Math.max(margin, buttonBounds.right - popunderWidth), window.innerWidth - popunderWidth - margin)
        : Math.max(window.innerWidth - popunderWidth - margin, margin);
      y = buttonBounds ? Math.max(margin, buttonBounds.bottom + gap) : margin + 60;
    }
    const maxHeight = window.innerHeight - y - margin;
    setChatPopunderSize((prev) => ({ ...prev, height: Math.max(420, maxHeight) }));
    bringFloatingPanelToFront("chat");
    setChatPopunderPosition({ x, y });
    if (agent) {
      setChatPendingAgent(agent);
      setChatAutoStartCall(autoCall ?? false);
    }
    setIsChatPopoverOpen(true);
  };

  const openNotificationsPopover = () => {
    const margin = 16;
    const gap = 10;
    const buttonBounds = bellButtonRef.current?.getBoundingClientRect();
    const popunderWidth = Math.min(notificationsPopunderSize.width, window.innerWidth - margin * 2);
    const x = buttonBounds
      ? Math.min(Math.max(margin, buttonBounds.right - popunderWidth), window.innerWidth - popunderWidth - margin)
      : Math.max(window.innerWidth - popunderWidth - margin, margin);
    const y = buttonBounds
      ? Math.max(margin, buttonBounds.bottom + gap)
      : margin + 60;
    const maxHeight = window.innerHeight - y - margin;
    setNotificationsPopunderSize((prev) => ({ ...prev, height: Math.min(Math.max(360, maxHeight), 600) }));
    bringFloatingPanelToFront("notifications");
    setNotificationsPopunderPosition({ x, y });
    setIsNotificationsPopoverOpen(true);
  };

  const openCustomerInfoIconPopover = (event?: React.MouseEvent<HTMLElement>) => {
    // While in conversation-dock mode the icon simply toggles the panel open / closed
    // without ever leaving dock mode or opening a separate floating popunder.
    if (isCustomerInfoInConversationDockMode) {
      setIsConversationDockedPanelOpen((prev) => !prev);
      return;
    }

    // If the popunder is already visible (from icon click or takeover), animate it out.
    if (isCustomerInfoIconPopoverOpen || isTakeoverInfoOpen || isDeskCustomerInfoPopunderVisible) {
      // Trigger the slide-up exit animation; onClose will clear state after it finishes.
      customerInfoPopunderRef.current?.triggerClose();
      return;
    }

    bringFloatingPanelToFront("customerInfo");

    // Only anchor to the icon on first open; subsequent reopens restore the last position.
    if (!customerInfoHasBeenPositionedRef.current) {
      const anchorRect = event?.currentTarget.getBoundingClientRect();
      setCustomerInfoPopunderPosition(getAnchoredCustomerInfoPopunderPosition(anchorRect));
      customerInfoHasBeenPositionedRef.current = true;
    }

    // Never start in drag state from icon click — user drags via the grab handle.
    // This is not a takeover-open, so clear any stale takeover timestamp.
    setCustomerInfoTakeoverStartTime(null);
    setIsCustomerInfoIconPopoverOpen(true);
  };

  const dockCustomerInfoPanel = () => {
    if (isCombinedInteractionPanel) {
      openCombinedInteractionPanel("customerInfo");
      return;
    }

    // On the activity route with a visible docked conversation panel, dock customer info
    // directly adjacent (to the right) of the conversation panel instead of navigating.
    if (isActivityRoute && isDockedConversationVisible) {
      // Size the docked panel to a reasonable default if not already sized.
      const { customerInfoWidth } = getBalancedDockedPanelWidths({
        hasDesktopRightPanel: false,
        reserveMainWorkspace: isMainCanvasVisible,
        showConversation: true,
        showCustomerInfo: true,
        hasMainCanvas: isMainCanvasVisible,
        currentConversationWidth: dockedConversationWidth,
        currentCustomerInfoWidth: dockedCustomerInfoWidth,
      });
      setDockedCustomerInfoWidth(customerInfoWidth);
      // Mutual exclusivity: undock transcript if it is currently docked.
      if (isTranscriptDockedToConversation) {
        setIsTranscriptDockedToConversation(false);
        setIsTranscriptPopunderOpen(true);
      }
      setIsCustomerInfoDockedToConversation(true);
      setIsConversationDockedPanelOpen(true);
      setIsCustomerInfoPopunderOpen(false);
      setIsCustomerInfoIconPopoverOpen(false);
      setIsTakeoverInfoOpen(false);
      setCustomerInfoTakeoverStartTime(null);
      setCustomerInfoDragActivation(null);
      return;
    }

    if (isDeskRoute && isCombinedInteractionPanelCanvasEnabled) {
      setCombinedInteractionPanelTab("customerInfo");
      setIsCustomerInfoPanelOpen(true);
      setIsCustomerInfoPopunderOpen(false);
      setCustomerInfoDragActivation(null);
      return;
    }

    // Only one panel can be docked at a time — float/close all other docked panels.
    if (isDockedConversationVisible) {
      setConversationPopunderPosition(getAnchoredConversationPopunderPosition());
      setIsConversationPanelOpen(false);
      setIsConversationPopunderOpen(true);
    }
    setActiveRightPanel(null);

    const { customerInfoWidth } = getBalancedDockedPanelWidths({
      hasDesktopRightPanel: false,
      reserveMainWorkspace: isMainCanvasVisible,
      showConversation: false,
      showCustomerInfo: true,
      hasMainCanvas: isMainCanvasVisible,
      currentConversationWidth: dockedConversationWidth,
      currentCustomerInfoWidth: dockedCustomerInfoWidth,
    });

    setIsCustomerInfoPanelOpen(true);
    setIsCustomerInfoPopunderOpen(false);
    setCustomerInfoDragActivation(null);
    setDockedCustomerInfoWidth(customerInfoWidth);
  };

  const closeCustomerInfoPanel = () => {
    setDeskPanelSelection(null);

    if (isCombinedInteractionPanel) {
      closeCombinedInteractionPanel();
      return;
    }

    setCustomerInfoDragActivation(null);
    setIsCustomerInfoPopunderOpen(false);
    setIsCustomerInfoPanelOpen(false);
    setIsCustomerInfoDockedToConversation(false);
    setIsConversationDockedPanelOpen(true);
  };

  const clearDeskCanvasPopunderState = () => {
    setDeskCanvasDragActivation(null);
    setDeskCanvasPopunderView(null);
  };

  const closeDeskCanvasPopunder = () => {
    setDeskPanelSelection(null);
    clearDeskCanvasPopunderState();
    setIsCustomerInfoPanelOpen(false);
    setIsCustomerInfoPopunderOpen(false);
    setCustomerInfoDragActivation(null);
    if (isActivityRoute || isDeskRoute) {
      navigate("/activity", { state: { hideMainCanvasPanel: true } });
    }
  };

  const dockDeskCanvasPopunder = () => {
    if (!deskCanvasPopunderView) return;

    const nextRoute = deskCanvasPopunderView === "copilot"
      ? "/desk?view=copilot"
      : deskCanvasPopunderView === "add"
        ? "/desk?view=add"
        : deskCanvasPopunderView === "customer"
          ? "/desk?view=customer"
          : deskCanvasPopunderView === "notifications"
            ? "/desk?view=notifications"
            : "/desk";

    // One-panel-docked rule: docking the canvas means the conversation panel must float
    if (isDockedConversationVisible) {
      setConversationPopunderPosition(getAnchoredConversationPopunderPosition());
      setIsConversationPanelOpen(false);
      setIsConversationPopunderOpen(true);
    }

    clearDeskCanvasPopunderState();
    navigate(nextRoute);
  };

  const undockDeskPanel = (view: DeskCanvasView, event: React.MouseEvent<HTMLElement>) => {
    if (typeof window === "undefined") return;

    event.preventDefault();

    const minWidth = getDeskCanvasPopunderMinWidth(view);
    const defaultWidth = getDeskCanvasPopunderDefaultWidth(view);
    const bounds = event.currentTarget.closest("[data-desk-panel-header]")?.getBoundingClientRect()
      ?? event.currentTarget.parentElement?.getBoundingClientRect();
    const width = Math.min(
      Math.max(minWidth, bounds?.width ?? defaultWidth),
      window.innerWidth - DESK_CANVAS_POPOUNDER_MARGIN * 2,
    );
    const height = Math.min(
      Math.max(DESK_CANVAS_POPOUNDER_MIN_HEIGHT, bounds?.height ?? Math.max(DESK_CANVAS_POPOUNDER_MIN_HEIGHT, window.innerHeight - 80)),
      window.innerHeight - DESK_CANVAS_POPOUNDER_MARGIN * 2,
    );
    const anchoredPosition = getAnchoredDeskCanvasPopunderPosition(width, height);
    const nextPosition = bounds
      ? {
          x: Math.min(
            Math.max(DESK_CANVAS_POPOUNDER_MARGIN, bounds.left),
            window.innerWidth - width - DESK_CANVAS_POPOUNDER_MARGIN,
          ),
          y: Math.min(
            Math.max(DESK_CANVAS_POPOUNDER_MARGIN, bounds.top),
            window.innerHeight - height - DESK_CANVAS_POPOUNDER_MARGIN,
          ),
        }
      : anchoredPosition;

    bringFloatingPanelToFront("deskCanvas");
    setDeskCanvasPopunderView(view);
    setDeskCanvasPopunderSize({ width, height });
    setDeskCanvasPopunderPosition(nextPosition);
    setDeskCanvasDragActivation({
      id: Date.now(),
      offset: {
        x: event.clientX - nextPosition.x,
        y: event.clientY - nextPosition.y,
      },
    });
    if (isActivityRoute || isDeskRoute) {
      navigate("/activity", { state: { hideMainCanvasPanel: true } });
    }
  };

  const closeFloatingAppSpacePanel = () => {
    setDeskPanelSelection(null);
    clearDeskCanvasPopunderState();
    setIsCustomerInfoPanelOpen(false);
    setIsCustomerInfoPopunderOpen(false);
    setCustomerInfoDragActivation(null);
    if (isActivityRoute || isDeskRoute) {
      navigate("/activity", { state: { hideMainCanvasPanel: true } });
    }
  };

  const closeAppSpacePanel = () => {
    closeFloatingAppSpacePanel();
  };

  const openDeskPanel = (selection?: Exclude<DeskPanelSelection, null>) => {
    setDeskPanelSelection(selection ?? null);

    // If the customer info panel is already open as a docked panel, just update
    // the selection — NotesPanel's useEffect will open the ticket tab reactively.
    if (isDeskCustomerInfoVisible) {
      return;
    }

    setActiveRightPanel(null);
    // Only close customerInfo if it isn't already floating
    if (!isCustomerInfoPopunderOpen) {
      setIsCustomerInfoPanelOpen(false);
      setCustomerInfoDragActivation(null);
    }

    navigate("/desk?view=customer");
  };

  const openHeaderAppPanel = (view: DeskCanvasView) => {
    // Directory and Copilot each get their own independent floating window
    if (view === "desk") {
      if (isDeskViewPopunderOpen) {
        bringFloatingPanelToFront("deskCanvas");
        return;
      }
      const defaultWidth = getDeskCanvasPopunderDefaultWidth("desk");
      const defaultHeight = typeof window !== "undefined"
        ? Math.min(Math.max(DESK_CANVAS_POPOUNDER_MIN_HEIGHT, window.innerHeight - 80), window.innerHeight - DESK_CANVAS_POPOUNDER_MARGIN * 2)
        : 720;
      const width = typeof window !== "undefined"
        ? Math.min(defaultWidth, window.innerWidth - DESK_CANVAS_POPOUNDER_MARGIN * 2)
        : defaultWidth;
      const position = getAnchoredDeskCanvasPopunderPosition(width, defaultHeight);
      bringFloatingPanelToFront("deskCanvas");
      setDeskViewPopunderSize({ width, height: defaultHeight });
      setDeskViewPopunderPosition(position);
      setIsDeskViewPopunderOpen(true);
      return;
    }

    if (view === "copilot") {
      if (isCopilotViewPopunderOpen) {
        bringFloatingPanelToFront("deskCanvas");
        return;
      }
      const defaultWidth = getDeskCanvasPopunderDefaultWidth("copilot");
      const defaultHeight = typeof window !== "undefined"
        ? Math.min(Math.max(DESK_CANVAS_POPOUNDER_MIN_HEIGHT, window.innerHeight - 80), window.innerHeight - DESK_CANVAS_POPOUNDER_MARGIN * 2)
        : 720;
      const width = typeof window !== "undefined"
        ? Math.min(defaultWidth, window.innerWidth - DESK_CANVAS_POPOUNDER_MARGIN * 2)
        : defaultWidth;
      // Offset from Directory so they don't stack exactly
      const basePosition = getAnchoredDeskCanvasPopunderPosition(width, defaultHeight);
      const position = isDeskViewPopunderOpen
        ? { x: Math.max(DESK_CANVAS_POPOUNDER_MARGIN, basePosition.x - width - 12), y: basePosition.y }
        : basePosition;
      bringFloatingPanelToFront("deskCanvas");
      setCopilotViewPopunderSize({ width, height: defaultHeight });
      setCopilotViewPopunderPosition(position);
      setIsCopilotViewPopunderOpen(true);
      return;
    }

    setActiveRightPanel(null);
    setIsAddNewPopoverOpen(false);
    // Only open conversation panel in docked mode if it isn't already floating
    if (!isConversationPopunderOpen) {
      setIsConversationPanelOpen(true);
    }
    // Only reset customer info if it isn't already floating
    if (!isCustomerInfoPopunderOpen) {
      setIsCustomerInfoPanelOpen(false);
    }

    if (view === "customer") {
      setDeskPanelSelection({ initialTab: "Overview" });
    } else {
      setDeskPanelSelection(null);
    }

    // If the panel is already docked, update the route to switch content but keep it docked.
    // Exception: if conversation is currently docked inline (one-panel-docked rule), open as
    // a popunder instead so that the conversation stays docked.
    if (isDeskRoute) {
      const conversationIsDocked = isConversationPanelOpen && !isConversationPopunderOpen;
      if (conversationIsDocked) {
        // Canvas must float — open/update popunder without navigating to desk route
        if (deskCanvasPopunderView !== null) {
          bringFloatingPanelToFront("deskCanvas");
          setDeskCanvasPopunderView(view);
          return;
        }
        const defaultWidth = getDeskCanvasPopunderDefaultWidth(view);
        const defaultHeight = typeof window !== "undefined"
          ? Math.min(Math.max(DESK_CANVAS_POPOUNDER_MIN_HEIGHT, window.innerHeight - 80), window.innerHeight - DESK_CANVAS_POPOUNDER_MARGIN * 2)
          : 720;
        const width = typeof window !== "undefined"
          ? Math.min(defaultWidth, window.innerWidth - DESK_CANVAS_POPOUNDER_MARGIN * 2)
          : defaultWidth;
        const position = getAnchoredDeskCanvasPopunderPosition(width, defaultHeight);
        bringFloatingPanelToFront("deskCanvas");
        setDeskCanvasPopunderView(view);
        setDeskCanvasPopunderSize({ width, height: defaultHeight });
        setDeskCanvasPopunderPosition(position);
        setDeskCanvasDragActivation(null);
        if (isActivityRoute) {
          navigate("/activity", { state: { hideMainCanvasPanel: true } });
        }
        return;
      }
      const nextRoute = view === "add"
        ? "/desk?view=add"
        : view === "customer"
          ? "/desk?view=customer"
          : view === "notifications"
            ? "/desk?view=notifications"
            : "/desk";
      navigate(nextRoute);
      return;
    }

    // If a popunder is already visible just switch view
    if (deskCanvasPopunderView !== null) {
      bringFloatingPanelToFront("deskCanvas");
      setDeskCanvasPopunderView(view);
      return;
    }

    // Open a fresh popunder anchored to the top-right
    const defaultWidth = 360;
    const defaultHeight = typeof window !== "undefined"
      ? Math.min(
          Math.max(DESK_CANVAS_POPOUNDER_MIN_HEIGHT, window.innerHeight - 80),
          window.innerHeight - DESK_CANVAS_POPOUNDER_MARGIN * 2,
        )
      : 720;
    const width = typeof window !== "undefined"
      ? Math.min(defaultWidth, window.innerWidth - DESK_CANVAS_POPOUNDER_MARGIN * 2)
      : defaultWidth;
    const position = getAnchoredDeskCanvasPopunderPosition(width, defaultHeight);

    bringFloatingPanelToFront("deskCanvas");
    setDeskCanvasPopunderView(view);
    setDeskCanvasPopunderSize({ width, height: defaultHeight });
    setDeskCanvasPopunderPosition(position);
    setDeskCanvasDragActivation(null);
    if (isActivityRoute) {
      navigate("/activity", { state: { hideMainCanvasPanel: true } });
    }
  };

  const layoutContextValue = useMemo(
    () => ({
      activeRightPanel,
      isRightPanelOpen: activeRightPanel !== null,
      isInfoOpen: activeRightPanel === "info",
      isDeskOpen: activeRightPanel === "desk",
      isInteractionsOpen: activeRightPanel === "interactions",
      isAddNewOpen: isAddNewPopoverOpen,
      isAgentInCall: status === "In a Call",
      isAgentAvailable: status === "Available",
      isBriefingDismissed,
      incomingNotifications,
      activeLeadNotifications,
      dismissLeadNotification: (customerRecordId: string) =>
        setActiveLeadNotifications((prev) => prev.filter((n) => n.customerRecordId !== customerRecordId)),
      pushToIncomingNotifications: (item: QueuePreviewItem) => setIncomingNotifications((prev) => [...prev, item]),
      dismissIncomingByCustomer,
      pendingMonitorCaseId,
      clearPendingMonitorCaseId,
      pendingTakeoverCaseId,
      clearPendingTakeoverCaseId,
      decrementEscalatedCount: () => setEscalatedRailCount((n) => Math.max(0, n - 1)),
      onJordanCaseResolved: () => { setIsJordanResolved(true); setScenarioCaseStatuses((p) => ({ ...p, jordan: "resolved" })); },
      onSofiaCaseResolved: () => { setIsSofiaResolved(true); setScenarioCaseStatuses((p) => ({ ...p, sofia: "resolved" })); },
      onMarcusCaseResolved: () => { setIsMarcusResolved(true); setScenarioCaseStatuses((p) => ({ ...p, marcus: "resolved" })); },
      showDismissalToast: (summary) => setDismissalToast(summary),
      pushTransferredToast,
      historyOnlyAssignmentIds,
      triggerScenario,
      scenarioCaseStatuses,
      launchLeadCall,
      isConversationPanelOpen,
      isConversationPopunderOpen,
      activeConversationChannel,
      activeConversationTabs,
      selectedAssignment,
      visibleAssignments,
      resolvedAssignments,
      assignmentStatusesById,
      deskPanelSelection,
      recentInteractions,
      conversationState,
      activeCallAssignmentId,
      toggleInfo: () => {
        setDeskPanelSelection(null);
        const opening = activeRightPanel !== "info";
        if (opening) {
          // Only one panel docked at a time — float conversation/customer info if docked.
          if (isDockedConversationVisible) {
            setConversationPopunderPosition(getAnchoredConversationPopunderPosition());
            setIsConversationPanelOpen(false);
            setIsConversationPopunderOpen(true);
          }
          if (isDeskCustomerInfoVisible) {
            setCustomerInfoPopunderPosition(getAnchoredCustomerInfoPopunderPosition());
            setIsCustomerInfoPopunderOpen(true);
          }
        }
        setActiveRightPanel(opening ? "info" : null);
      },
      toggleDesk: () => {
        setDeskPanelSelection(null);
        const opening = activeRightPanel !== "desk";
        if (opening) {
          if (isDockedConversationVisible) {
            setConversationPopunderPosition(getAnchoredConversationPopunderPosition());
            setIsConversationPanelOpen(false);
            setIsConversationPopunderOpen(true);
          }
          if (isDeskCustomerInfoVisible) {
            setCustomerInfoPopunderPosition(getAnchoredCustomerInfoPopunderPosition());
            setIsCustomerInfoPopunderOpen(true);
          }
        }
        setActiveRightPanel(opening ? "desk" : null);
      },
      openDeskPanel,
      closeAppSpacePanel,
      closeFloatingAppSpacePanel,
      isAppSpacePanelInDragMode: deskCanvasPopunderView !== null,
      toggleInteractions: () => {
        const opening = activeRightPanel !== "interactions";
        if (opening) {
          if (isDockedConversationVisible) {
            setConversationPopunderPosition(getAnchoredConversationPopunderPosition());
            setIsConversationPanelOpen(false);
            setIsConversationPopunderOpen(true);
          }
          if (isDeskCustomerInfoVisible) {
            setCustomerInfoPopunderPosition(getAnchoredCustomerInfoPopunderPosition());
            setIsCustomerInfoPopunderOpen(true);
          }
        }
        setActiveRightPanel(opening ? "interactions" : null);
      },
      toggleConversationPanel,
      openConversationPanel,
      openConversationPopunder,
      closeConversationPopunder,
      setActiveConversationChannel,
      openCustomerConversation,
      openRecentInteractionAssignment,
      setConversationState: handleConversationStateChange,
      setConversationStateForAssignment: (assignmentId: string, conversation: SharedConversationData) => {
        const key = getConversationStateKey(assignmentId);
        // Also check the module-level handoff store — in case the caller passed
        // the override but the pendingHandoffConversations store has a fresher copy
        // (written synchronously by TakeoverButton just before this is called).
        const customerRecordId = assignmentItemsById[assignmentId]?.customerRecordId;
        const pendingHandoff = customerRecordId ? pendingHandoffConversations.get(customerRecordId) : undefined;
        if (pendingHandoff && customerRecordId) pendingHandoffConversations.delete(customerRecordId);
        setConversationStatesByKey((current) => ({ ...current, [key]: pendingHandoff ?? conversation }));
      },
      closeRightPanel: () => {
        setDeskPanelSelection(null);
        setActiveRightPanel(null);
      },
      undockDeskPanel,
      acceptIssue,
      selectAssignment: (assignmentId) => {
        setDeskPanelSelection(null);
        setSelectedAssignmentId(assignmentId);

        const nextAssignment = assignmentItemsById[assignmentId]
          ?? queuePreviewItems.find((item) => item.id === assignmentId || item.customerRecordId === assignmentId);

        if (nextAssignment) {
          setPendingCallCustomerRecordId(nextAssignment.customerRecordId);
        }

        if (location.pathname === "/desk" || isExpandedCanvasRoute) {
          if (!isCustomerInfoPanelOpen) {
            return;
          }

          if (shouldPreserveFloatingCustomerInfoPanel || isDeskCustomerInfoPopunderVisible) {
            bringFloatingPanelToFront("customerInfo");
            return;
          }

          if (isDeskCustomerInfoVisible || isCombinedInteractionPanel) {
            return;
          }

          if (!isCustomerInfoPanelAllowed && !isCombinedInteractionPanel) {
            bringFloatingPanelToFront("customerInfo");
            setCustomerInfoPopunderPosition(getAnchoredCustomerInfoPopunderPosition());
            setIsCustomerInfoPopunderOpen(true);
          }
          return;
        }

        navigate("/activity");
      },
      toggleCallPopunder: (anchorRect, customerRecordId = selectedAssignment.customerRecordId) => {
        if (status !== "In a Call" && isCallPopunderOpen) {
          if (callConnectTimeoutRef.current !== null) {
            window.clearTimeout(callConnectTimeoutRef.current);
            callConnectTimeoutRef.current = null;
          }
          setIsCallPopunderOpen(false);
          setCallPopunderMode("setup");
          return;
        }

        setPendingCallCustomerRecordId(customerRecordId);
        bringFloatingPanelToFront("call");
        setCallPopunderMode(status === "In a Call" ? "controls" : "setup");
        setCallPopunderPosition(getAnchoredCallPopunderPosition(anchorRect));
        setIsCallPopunderOpen(true);
      },
      openCallDisposition,
      startCallStatus: () => {
        if (status !== "In a Call") {
          previousAgentStatusRef.current = status;
        }
        setStatus("In a Call");
        setStatusStartedAt(Date.now());
      },
      endCallStatus: () => {
        setStatus(previousAgentStatusRef.current);
        setStatusStartedAt(Date.now());
      },
      pendingAcceptanceIds,
      acceptPendingAssignment,
      rejectPendingAssignment,
      reviewPendingAssignment,
      taskSummaryIds,
      closeChannelKeepTask,
      activatedChannelIds,
      liveLastCustomerCommentByAssignmentId,
      setAssignmentStatus: (assignmentId: string, newStatus: QueueAssignmentStatus) =>
        setAssignmentStatusesById((prev) => ({ ...prev, [assignmentId]: newStatus })),
      openCopilot: () => {
        if (isCopilotViewPopunderOpen) {
          bringFloatingPanelToFront("deskCanvas");
        } else {
          openHeaderAppPanel("copilot");
        }
      },
      openDirectoryPanel: () => {
        if (isDeskViewPopunderOpen) {
          bringFloatingPanelToFront("deskCanvas");
        } else {
          openHeaderAppPanel("desk");
        }
      },
      openChatPopover,
    }),
    [
      activeRightPanel,
      activeConversationChannel,
      activeConversationTabs,
      conversationState,
      deskPanelSelection,
      activeCallAssignmentId,
      dockedConversationWidth,
      isAddNewPopoverOpen,
      isCallPopunderOpen,
      isCustomerInfoPanelAllowed,
      isConversationPanelOpen,
      isConversationPopunderOpen,
      isDeskCustomerInfoPopunderVisible,
      isDeskCustomerInfoVisible,
      isDockedConversationVisible,
      isExpandedCanvasRoute,
      navigate,
      handleConversationStateChange,
      openCallDisposition,
      openConversationPanel,
      openCustomerConversation,
      openRecentInteractionAssignment,
      recentInteractions,
      location.pathname,
      openCustomerInfoPanel,
      openDeskPanel,
      shouldPreserveFloatingCustomerInfoPanel,
      deskCanvasPopunderView,
      selectedAssignment,
      visibleAssignments,
      resolvedAssignments,
      assignmentStatusesById,
      acceptIssue,
      status,
      toggleConversationPanel,
      undockDeskPanel,
      setActiveConversationChannel,
      isCombinedInteractionPanel,
      pendingAcceptanceIds,
      acceptPendingAssignment,
      rejectPendingAssignment,
      reviewPendingAssignment,
      taskSummaryIds,
      closeChannelKeepTask,
      activatedChannelIds,
      liveLastCustomerCommentByAssignmentId,
      setAssignmentStatusesById,
      isCopilotViewPopunderOpen,
      openHeaderAppPanel,
      openChatPopover,
      isBriefingDismissed,
      setIncomingNotifications,
      pendingMonitorCaseId,
      pendingTakeoverCaseId,
      triggerScenario,
      scenarioCaseStatuses,
    ],
  );

  return (
    <LayoutContext.Provider value={layoutContextValue}>
      <div className="flex h-screen w-full flex-col overflow-hidden bg-[#F8F8F9]">
      <header className="flex min-h-[60px] shrink-0 items-center justify-between gap-2 px-4 py-2">
        <div className="flex flex-none items-center lg:min-w-0 lg:gap-3">
          <div className="group relative flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsLeftRailOpen((v) => !v)}
              aria-label={isLeftRailOpen ? "Collapse cases rail" : "Expand cases rail"}
              aria-pressed={isLeftRailOpen}
              className="flex h-10 w-[30px] items-center justify-center rounded-xl text-[#333333] transition-colors hover:text-[#166CCA]"
            >
              <PanelLeft className="h-4 w-4" />
            </button>
            <div className="pointer-events-none absolute left-full top-1/2 z-[9999] ml-2 -translate-y-1/2 whitespace-nowrap rounded-lg border border-[#E4E7EC] bg-white px-3 py-1.5 text-xs font-medium text-[#344054] opacity-0 shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-opacity duration-150 group-hover:opacity-100">
              {isLeftRailOpen ? "Close navigation" : "Open navigation"}
            </div>
          </div>
          <div
            className="relative"
          >
            {/* Greeting message — no hover menu, nav items live in the left rail */}
            <div className="flex items-center gap-2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="hidden">
                <path d="M23.7188 5.89062C23.8757 5.89077 24.0015 6.01655 24 6.17188C23.8494 15.8941 15.9182 23.7747 6.13379 23.9238C5.97839 23.9255 5.85077 23.7999 5.85059 23.6445V19.3848C5.85059 19.2325 5.97502 19.1097 6.12891 19.1064C13.2448 18.9606 19.0048 13.236 19.1523 6.16602C19.1556 6.01217 19.2788 5.88872 19.4326 5.88867L23.7188 5.89062ZM12.2559 0.0771484C13.8714 0.0772122 15.1804 1.37836 15.1807 2.98242C15.1807 4.58668 13.8716 5.88861 12.2559 5.88867C10.6401 5.88867 9.33008 4.58672 9.33008 2.98242C9.33031 1.37832 10.6402 0.0771484 12.2559 0.0771484ZM2.92578 0.0761719C4.5412 0.0763851 5.85033 1.3775 5.85059 2.98145C5.85059 4.58561 4.54135 5.88748 2.92578 5.8877C1.31003 5.8877 0 4.58574 0 2.98145C0.000253194 1.37736 1.31018 0.0761719 2.92578 0.0761719Z" fill="#2196F3"/>
              </svg>
              <p className="text-base font-semibold text-[#333333] leading-none">Agent Workspace</p>
            </div>

            {/* Hover panel — kept in DOM but never shown */}
            {false && (
              <div className="absolute left-0 top-full z-50 mt-2.5 w-[300px] rounded-2xl border border-black/10 bg-white p-2 shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
                <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#7A7A7A]">
                  Workspaces
                </p>
                <div className="space-y-1">
                  {workspaceOptions.map((workspace) => {
                    const isActiveWorkspace = workspace.id === activeWorkspace.id;
                    return (
                      <button
                        key={workspace.id}
                        type="button"
                        onClick={() => {
                          setActiveWorkspaceId(workspace.id);
                          setWorkspaceMenuOpen(false);
                          if (workspace.routePath && location.pathname !== workspace.routePath) {
                            navigate(workspace.routePath);
                          }
                        }}
                        className="flex w-full min-w-0 items-start gap-3 rounded-xl px-3 py-3 text-left hover:bg-[#F8F8F9] transition-colors"
                      >
                        <span className={cn("mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full", isActiveWorkspace ? "bg-[#166CCA]" : "bg-black/10")} />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold text-[#333333]">{workspace.name}</div>
                          {workspace.description ? (
                            <div className="mt-0.5 text-xs leading-5 text-[#6B7280]">{workspace.description}</div>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="my-2 h-px bg-black/10" />
              <DropdownMenuSeparator className="my-2 bg-black/10" />
              <div className="flex items-center justify-start px-3 py-2">
                {isDarkMode ? (
                  /* White single-colour logo for dark mode */
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1953 277.14" className="h-5 w-auto" aria-label="CXone">
                    <path fill="#fff" d="M1122.16,178.19h-53.36c-1.44,0-2.7,1.02-2.96,2.44-2.47,13.59-7.12,24.42-13.94,32.51-7.69,9.1-18.56,13.65-32.63,13.65-10.83,0-20.13-3.31-27.92-9.93-7.79-6.62-13.8-15.96-18.02-28.01-4.22-12.06-6.33-26.36-6.33-42.9,0-16.07,2-30.26,6.01-42.55,4-12.29,9.95-21.86,17.86-28.72,7.9-6.85,17.48-10.28,28.74-10.28,12.77,0,23.16,4.26,31.17,12.76,7.01,7.46,11.87,17.46,14.57,29.99.3,1.38,1.53,2.35,2.94,2.35h53.16c1.89,0,3.3-1.72,2.96-3.58-5.29-28.91-16.13-51.27-32.55-67.06-17.21-16.54-41.29-24.82-72.24-24.82-22.52,0-42.1,5.44-58.77,16.31-16.67,10.88-29.5,26.18-38.48,45.92-8.98,19.74-13.47,42.97-13.47,69.68s4.71,51.24,14.12,70.74c9.42,19.5,22.4,34.46,38.96,44.86,16.56,10.4,35.44,15.6,56.66,15.6,20.56,0,38.2-3.9,52.92-11.7,14.72-7.8,26.62-19.09,35.72-33.86,8.52-13.85,14.48-30.46,17.86-49.83.32-1.85-1.08-3.56-2.96-3.56Z"/>
                    <path fill="#fff" d="M1324.25,19.71h-53.45c-1.07,0-2.06.57-2.6,1.5l-41.34,71c-.39.67-1.35.67-1.74,0l-41.34-71c-.54-.93-1.53-1.5-2.6-1.5h-53.45c-2.32,0-3.77,2.52-2.6,4.53l70.36,120.84c.18.31.18.7,0,1.01l-70.36,120.84c-1.17,2.01.28,4.53,2.6,4.53h53.45c1.07,0,2.06-.57,2.6-1.5l41.34-71c.39-.67,1.35-.67,1.74,0l41.34,71c.54.93,1.53,1.5,2.6,1.5h53.45c2.32,0,3.77-2.52,2.6-4.53l-70.36-120.84c-.18-.31-.18-.7,0-1.01l70.36-120.84c1.17-2.01-.28-4.53-2.6-4.53Z"/>
                    <path fill="#fff" d="M1481.32,109.26c-5.5-4.29-12.94-6.44-22.32-6.44s-16.28,2.15-21.87,6.44c-5.59,4.3-9.64,9.74-12.13,16.33-2.5,6.59-3.75,13.48-3.75,20.67s1.25,14.28,3.75,20.67c2.5,6.4,6.54,11.59,12.13,15.58,5.59,4,12.88,5.99,21.87,5.99s16.58-1.99,22.17-5.99c5.59-3.99,9.63-9.24,12.13-15.73,2.5-6.49,3.75-13.33,3.75-20.52s-1.25-14.08-3.75-20.67c-2.5-6.59-6.49-12.03-11.99-16.33Z"/>
                    <path fill="#fff" d="M1843.55,102.82c-4.9-2.89-11.14-4.34-18.73-4.34s-13.93,1.5-19.03,4.49c-5.09,3-8.89,6.84-11.39,11.54-2.5,4.7-3.95,9.64-4.34,14.83h68.61c-.2-5.39-1.55-10.44-4.04-15.13-2.5-4.69-6.19-8.49-11.09-11.39Z"/>
                    <path fill="#fff" d="M1808.57,21.08h-336.41c-102.44,0-144.43,36.51-144.43,125.59s41.99,125.6,144.43,125.6h336.41c102.44,0,144.44-36.51,144.44-125.6s-41.99-125.59-144.44-125.59ZM1528.67,189.56c-6.49,12.09-15.58,21.32-27.27,27.72-11.69,6.4-25.62,9.59-41.8,9.59s-29.96-3.24-41.95-9.74c-11.98-6.49-21.27-15.78-27.86-27.86-6.59-12.08-9.89-26.41-9.89-43s3.34-31.61,10.04-43.9c6.69-12.29,16.03-21.72,28.02-28.32,11.99-6.59,25.77-9.89,41.35-9.89s29.86,3.4,41.65,10.19c11.78,6.79,20.97,16.28,27.57,28.46,6.59,12.19,9.89,26.77,9.89,43.75s-3.25,30.91-9.74,43ZM1717.57,224.76h-41.95v-81.8c0-4.79-.4-9.59-1.2-14.38-.8-4.79-2.25-9.19-4.34-13.18-2.1-3.99-5.05-7.19-8.84-9.59-3.8-2.4-8.79-3.6-14.98-3.6-7.99,0-14.68,2-20.07,5.99-5.39,4-9.39,9.39-11.99,16.18-2.6,6.79-3.9,14.28-3.9,22.47v77.9h-41.95V66.86h39.25l2.1,18.28c4.39-5.39,9.44-9.63,15.13-12.73,5.69-3.09,11.48-5.24,17.38-6.44,5.89-1.2,11.24-1.8,16.03-1.8,15.18,0,27.01,3.3,35.51,9.89,8.49,6.59,14.58,15.43,18.28,26.52,3.69,11.09,5.54,23.42,5.54,37v87.19ZM1898.54,150.91c-.2,2.6-.6,5.2-1.2,7.79h-108.16c.6,5.99,2.29,11.49,5.09,16.48,2.79,5,6.74,8.94,11.83,11.83,5.09,2.9,11.43,4.35,19.03,4.35,4.99,0,9.59-.55,13.78-1.65,4.19-1.09,7.79-2.85,10.79-5.24,3-2.4,5.09-5.19,6.29-8.39h41.35c-2.6,11.79-7.44,21.47-14.53,29.06-7.09,7.59-15.63,13.14-25.62,16.63-9.99,3.49-20.48,5.24-31.46,5.24-16.58,0-30.67-3.3-42.25-9.89-11.59-6.59-20.48-15.93-26.67-28.01-6.19-12.08-9.29-26.22-9.29-42.4s3.19-30.71,9.59-43c6.39-12.28,15.43-21.92,27.12-28.91,11.69-6.99,25.51-10.49,41.5-10.49,11.98,0,22.52,2,31.61,5.99,9.09,4,16.78,9.59,23.07,16.78,6.29,7.19,10.98,15.53,14.08,25.02,3.09,9.49,4.54,19.73,4.35,30.71,0,2.8-.1,5.5-.3,8.09Z"/>
                    <path fill="#fff" d="M272.23.06c-18.93-1.2-34.54,14.41-33.34,33.34.99,15.61,13.66,28.28,29.27,29.27,18.93,1.19,34.54-14.41,33.34-33.34-.99-15.61-13.66-28.28-29.27-29.27"/>
                    <path fill="#fff" d="M203.67,19.71h-50.47c-1.67,0-3.01,1.35-3.01,3.01v148.01c0,1.03-1.36,1.39-1.87.5L60.96,21.21c-.54-.93-1.53-1.49-2.6-1.49H3.01c-1.66,0-3.01,1.35-3.01,3.01v245.73c0,1.66,1.35,3.01,3.01,3.01h50.47c1.66,0,3.01-1.35,3.01-3.01V121.04c0-1.02,1.35-1.39,1.87-.5l87.35,149.44c.54.93,1.53,1.49,2.6,1.49h55.36c1.67,0,3.01-1.35,3.01-3.01V22.72c0-1.67-1.35-3.01-3.01-3.01"/>
                    <path fill="#fff" d="M292.55,79.21c-7.05,1.52-14.56,2.34-22.36,2.34s-15.3-.82-22.36-2.34c-1.87-.4-3.64,1.02-3.64,2.94v186.31c0,1.66,1.35,3.01,3.01,3.01h45.97c1.66,0,3.01-1.35,3.01-3.01V82.15c0-1.92-1.77-3.34-3.64-2.94"/>
                    <path fill="#fff" d="M739.33,225.37h-105.08c-.55,0-1-.45-1-1v-54.72c0-.55.45-1,1-1h85.76c1.66,0,3.01-1.35,3.01-3.01v-40.07c0-1.66-1.35-3.01-3.01-3.01h-85.76c-.55,0-1-.45-1-1v-54.72c0-.55.45-1,1-1h105.08c1.66,0,3.01-1.35,3.01-3.01V22.72c0-1.67-1.35-3.01-3.01-3.01h-159.57c-1.67,0-3.01,1.35-3.01,3.01v245.73c0,1.66,1.35,3.01,3.01,3.01h159.57c1.66,0,3.01-1.35,3.01-3.01v-40.07c0-1.66-1.35-3.01-3.01-3.01"/>
                    <path fill="#fff" d="M541.63,178.19h-53.36c-1.44,0-2.7,1.02-2.96,2.44-2.47,13.59-7.12,24.42-13.94,32.5-7.69,9.1-18.56,13.65-32.63,13.65-10.83,0-20.13-3.31-27.92-9.93-7.79-6.61-13.8-15.96-18.02-28.01-4.22-12.06-6.33-26.36-6.33-42.91s2-30.25,6.01-42.55c4-12.29,9.95-21.86,17.86-28.72,7.9-6.86,17.48-10.28,28.74-10.28,12.77,0,23.16,4.26,31.17,12.77,7.01,7.46,11.87,17.46,14.57,29.99.3,1.37,1.53,2.35,2.94,2.35h53.16c1.89,0,3.3-1.72,2.96-3.58-5.29-28.91-16.13-51.27-32.55-67.06-17.21-16.54-41.29-24.82-72.24-24.82-22.52,0-42.11,5.44-58.77,16.31-16.67,10.87-29.5,26.18-38.48,45.92-8.98,19.74-13.47,42.97-13.47,69.67s4.71,51.24,14.12,70.74c9.42,19.5,22.4,34.46,38.96,44.85,16.56,10.4,35.44,15.6,56.66,15.6s38.2-3.9,52.93-11.7c14.72-7.8,26.62-19.09,35.72-33.87,8.52-13.85,14.48-30.46,17.86-49.83.33-1.85-1.08-3.56-2.96-3.56"/>
                  </svg>
                ) : (
                  /* Full-colour logo for light mode */
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1953 277.14" className="h-5 w-auto" aria-label="CXone">
                    <defs>
                      <linearGradient id="cxone-gradient" x1="1327.72" y1="146.68" x2="1953" y2="146.68" gradientUnits="userSpaceOnUse">
                        <stop offset=".45" stopColor="#3694fc"/>
                        <stop offset=".55" stopColor="#2d8afb"/>
                        <stop offset=".73" stopColor="#1771fb"/>
                        <stop offset=".86" stopColor="#025afb"/>
                      </linearGradient>
                    </defs>
                    <path fill="url(#cxone-gradient)" d="M1953,146.68c0,89.08-41.99,125.6-144.43,125.6h-336.41c-102.44,0-144.43-36.51-144.43-125.6s41.99-125.6,144.43-125.6h336.41c102.44,0,144.43,36.51,144.43,125.6Z"/>
                    <path d="M1122.16,178.19h-53.36c-1.44,0-2.7,1.02-2.96,2.44-2.47,13.59-7.12,24.42-13.94,32.51-7.69,9.1-18.56,13.65-32.63,13.65-10.83,0-20.13-3.31-27.92-9.93-7.79-6.62-13.8-15.96-18.02-28.01-4.22-12.06-6.33-26.36-6.33-42.9,0-16.07,2-30.26,6.01-42.55,4-12.29,9.95-21.86,17.86-28.72,7.9-6.85,17.48-10.28,28.74-10.28,12.77,0,23.16,4.26,31.17,12.76,7.01,7.46,11.87,17.46,14.57,29.99.3,1.38,1.53,2.35,2.94,2.35h53.16c1.89,0,3.3-1.72,2.96-3.58-5.29-28.91-16.13-51.27-32.55-67.06-17.21-16.54-41.29-24.82-72.24-24.82-22.52,0-42.1,5.44-58.77,16.31-16.67,10.88-29.5,26.18-38.48,45.92-8.98,19.74-13.47,42.97-13.47,69.68s4.71,51.24,14.12,70.74c9.42,19.5,22.4,34.46,38.96,44.86,16.56,10.4,35.44,15.6,56.66,15.6,20.56,0,38.2-3.9,52.92-11.7,14.72-7.8,26.62-19.09,35.72-33.86,8.52-13.85,14.48-30.46,17.86-49.83.32-1.85-1.08-3.56-2.96-3.56Z"/>
                    <path d="M1324.25,19.71h-53.45c-1.07,0-2.06.57-2.6,1.5l-41.34,71c-.39.67-1.35.67-1.74,0l-41.34-71c-.54-.93-1.53-1.5-2.6-1.5h-53.45c-2.32,0-3.77,2.52-2.6,4.53l70.36,120.84c.18.31.18.7,0,1.01l-70.36,120.84c-1.17,2.01.28,4.53,2.6,4.53h53.45c1.07,0,2.06-.57,2.6-1.5l41.34-71c.39-.67,1.35-.67,1.74,0l41.34,71c.54.93,1.53,1.5,2.6,1.5h53.45c2.32,0,3.77-2.52,2.6-4.53l-70.36-120.84c-.18-.31-.18-.7,0-1.01l70.36-120.84c1.17-2.01-.28-4.53-2.6-4.53Z"/>
                    <path fill="#fff" d="M1459.6,226.86c-15.98,0-29.96-3.24-41.95-9.74-11.98-6.49-21.27-15.78-27.86-27.87-6.59-12.08-9.89-26.41-9.89-43s3.34-31.61,10.04-43.9c6.69-12.29,16.03-21.72,28.01-28.32,11.99-6.59,25.77-9.89,41.35-9.89s29.86,3.4,41.65,10.19c11.78,6.79,20.97,16.28,27.57,28.46,6.59,12.19,9.89,26.77,9.89,43.74s-3.25,30.91-9.74,43c-6.49,12.09-15.58,21.32-27.27,27.72-11.69,6.4-25.62,9.59-41.8,9.59ZM1459,188.51c9.19,0,16.58-1.99,22.17-5.99,5.59-3.99,9.63-9.24,12.13-15.73,2.49-6.49,3.75-13.33,3.75-20.52s-1.25-14.08-3.75-20.67c-2.5-6.59-6.49-12.03-11.99-16.33-5.5-4.29-12.94-6.44-22.32-6.44s-16.28,2.15-21.87,6.44c-5.59,4.3-9.64,9.74-12.13,16.33-2.5,6.59-3.75,13.48-3.75,20.67s1.25,14.28,3.75,20.67c2.5,6.4,6.54,11.59,12.13,15.58,5.59,4,12.88,5.99,21.87,5.99Z"/>
                    <path fill="#fff" d="M1568.36,224.76V66.86h39.25l2.1,18.28c4.39-5.39,9.44-9.63,15.13-12.73,5.69-3.09,11.48-5.24,17.38-6.44,5.89-1.2,11.24-1.8,16.03-1.8,15.18,0,27.01,3.3,35.51,9.89,8.49,6.59,14.58,15.43,18.28,26.52,3.69,11.09,5.54,23.42,5.54,37v87.19h-41.95v-81.8c0-4.79-.4-9.59-1.2-14.38-.8-4.79-2.25-9.19-4.35-13.18-2.1-3.99-5.05-7.19-8.84-9.59-3.8-2.4-8.79-3.6-14.98-3.6-7.99,0-14.68,2-20.07,5.99-5.39,4-9.39,9.39-11.99,16.18-2.6,6.79-3.9,14.28-3.9,22.47v77.9h-41.95Z"/>
                    <path fill="#fff" d="M1825.73,227.01c-16.58,0-30.67-3.3-42.25-9.89-11.59-6.59-20.48-15.93-26.67-28.01-6.19-12.08-9.29-26.22-9.29-42.4s3.19-30.71,9.59-43c6.39-12.28,15.43-21.92,27.12-28.91,11.69-6.99,25.51-10.49,41.5-10.49,11.99,0,22.52,2,31.61,5.99,9.09,4,16.78,9.59,23.07,16.78,6.29,7.19,10.98,15.53,14.08,25.02,3.09,9.49,4.54,19.73,4.35,30.71,0,2.8-.1,5.5-.3,8.09-.2,2.6-.6,5.2-1.2,7.79h-108.16c.6,5.99,2.29,11.49,5.09,16.48,2.79,5,6.74,8.94,11.83,11.83,5.09,2.9,11.43,4.35,19.03,4.35,4.99,0,9.59-.55,13.78-1.65,4.19-1.1,7.79-2.85,10.79-5.24,3-2.4,5.09-5.19,6.29-8.39h41.35c-2.6,11.79-7.44,21.47-14.53,29.06-7.09,7.59-15.63,13.14-25.62,16.63-9.99,3.49-20.48,5.24-31.46,5.24ZM1790.07,129.33h68.61c-.2-5.39-1.55-10.44-4.05-15.13-2.5-4.69-6.19-8.49-11.09-11.39-4.9-2.89-11.14-4.34-18.73-4.34s-13.93,1.5-19.03,4.49c-5.09,3-8.89,6.84-11.39,11.54-2.5,4.7-3.95,9.64-4.34,14.83Z"/>
                    <path fill="#3694fd" d="M272.23.06c-18.93-1.2-34.54,14.41-33.34,33.34.99,15.61,13.66,28.28,29.27,29.27,18.93,1.19,34.54-14.41,33.34-33.34-.99-15.61-13.66-28.28-29.27-29.27"/>
                    <path d="M203.67,19.71h-50.47c-1.67,0-3.01,1.35-3.01,3.01v148.01c0,1.03-1.36,1.39-1.87.5L60.96,21.21c-.54-.93-1.53-1.49-2.6-1.49H3.01c-1.66,0-3.01,1.35-3.01,3.01v245.73c0,1.66,1.35,3.01,3.01,3.01h50.47c1.66,0,3.01-1.35,3.01-3.01V121.04c0-1.02,1.35-1.39,1.87-.5l87.35,149.44c.54.93,1.53,1.49,2.6,1.49h55.36c1.67,0,3.01-1.35,3.01-3.01V22.72c0-1.67-1.35-3.01-3.01-3.01"/>
                    <path d="M292.55,79.21c-7.05,1.52-14.56,2.34-22.36,2.34s-15.3-.82-22.36-2.34c-1.87-.4-3.64,1.02-3.64,2.94v186.31c0,1.66,1.35,3.01,3.01,3.01h45.97c1.66,0,3.01-1.35,3.01-3.01V82.15c0-1.92-1.77-3.34-3.64-2.94"/>
                    <path d="M739.33,225.37h-105.08c-.55,0-1-.45-1-1v-54.72c0-.55.45-1,1-1h85.76c1.66,0,3.01-1.35,3.01-3.01v-40.07c0-1.66-1.35-3.01-3.01-3.01h-85.76c-.55,0-1-.45-1-1v-54.72c0-.55.45-1,1-1h105.08c1.66,0,3.01-1.35,3.01-3.01V22.72c0-1.67-1.35-3.01-3.01-3.01h-159.57c-1.67,0-3.01,1.35-3.01,3.01v245.73c0,1.66,1.35,3.01,3.01,3.01h159.57c1.66,0,3.01-1.35,3.01-3.01v-40.07c0-1.66-1.35-3.01-3.01-3.01"/>
                    <path d="M541.63,178.19h-53.36c-1.44,0-2.7,1.02-2.96,2.44-2.47,13.59-7.12,24.42-13.94,32.5-7.69,9.1-18.56,13.65-32.63,13.65-10.83,0-20.13-3.31-27.92-9.93-7.79-6.61-13.8-15.96-18.02-28.01-4.22-12.06-6.33-26.36-6.33-42.91s2-30.25,6.01-42.55c4-12.29,9.95-21.86,17.86-28.72,7.9-6.86,17.48-10.28,28.74-10.28,12.77,0,23.16,4.26,31.17,12.77,7.01,7.46,11.87,17.46,14.57,29.99.3,1.37,1.53,2.35,2.94,2.35h53.16c1.89,0,3.3-1.72,2.96-3.58-5.29-28.91-16.13-51.27-32.55-67.06-17.21-16.54-41.29-24.82-72.24-24.82-22.52,0-42.11,5.44-58.77,16.31-16.67,10.87-29.5,26.18-38.48,45.92-8.98,19.74-13.47,42.97-13.47,69.67s4.71,51.24,14.12,70.74c9.42,19.5,22.4,34.46,38.96,44.85,16.56,10.4,35.44,15.6,56.66,15.6s38.2-3.9,52.93-11.7c14.72-7.8,26.62-19.09,35.72-33.87,8.52-13.85,14.48-30.46,17.86-49.83.33-1.85-1.08-3.56-2.96-3.56"/>
                  </svg>
                )}
              </div>
            </div>
          )}
          </div>
        </div>

        {/* Right: Icon buttons + status */}
        <div className="flex items-center justify-end gap-1 sm:gap-1.5">
          <div ref={bellButtonRef}>
            <HeaderIconButton
              ariaLabel="Open notifications"
              tooltip="Notifications"
              onClick={() => {
                if (isNotificationsPopoverOpen) {
                  setIsNotificationsPopoverOpen(false);
                } else {
                  setNotificationCount(0);
                  openNotificationsPopover();
                }
              }}
              isActive={isNotificationsPopoverOpen}
            >
              <div className="relative">
                <Bell className="h-4 w-4 stroke-[1.5]" />
                {notificationCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-[#E32926] px-0.5 text-[9px] font-bold leading-none text-white">
                    {notificationCount > 9 ? "9+" : notificationCount}
                  </span>
                )}
              </div>
            </HeaderIconButton>
          </div>

          <div ref={chatButtonRef}>
            <HeaderIconButton
              ariaLabel="Open messages"
              tooltip="Messages"
              onClick={() => {
                if (isChatPopoverOpen) {
                  setIsChatPopoverOpen(false);
                } else {
                  openChatPopover();
                }
              }}
              isActive={isChatPopoverOpen}
            >
              <div className="relative">
                <MessageCircle className="h-4 w-4 stroke-[1.5]" />
                {chatUnreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-[#E32926] px-0.5 text-[9px] font-bold leading-none text-white">
                    {chatUnreadCount > 9 ? "9+" : chatUnreadCount}
                  </span>
                )}
              </div>
            </HeaderIconButton>
          </div>

          <div ref={addNewButtonRef} className="hidden" aria-hidden="true" />

          <div ref={copilotButtonRef}>
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="Ask AI"
                    aria-pressed={isCopilotViewPopunderOpen}
                    onClick={() => isCopilotViewPopunderOpen ? setIsCopilotViewPopunderOpen(false) : openHeaderAppPanel("copilot")}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${isCopilotViewPopunderOpen ? "bg-[#166CCA]/10 hover:bg-[#166CCA]/20" : "hover:bg-[#F2F4F7]"}`}
                  >
                    <img src={`${import.meta.env.BASE_URL}ai-icon.svg`} alt="" className="h-5 w-5 shrink-0" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Ask AI</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {openFloatingPanelCount >= 2 && (
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="Snap panels to right"
                    onClick={snapPanelsToRight}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#166CCA]/10 text-[#166CCA] transition-colors hover:bg-[#166CCA]/20"
                  >
                    <Layers2 className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Snap panels to right</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <div
            className="relative"
            onMouseEnter={openStatusMenu}
            onMouseLeave={closeStatusMenu}
          >
            <button
              type="button"
              className="flex min-h-8 items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-1 text-[#333333] transition-colors hover:bg-[#C5DEF5] focus:outline-none"
            >
              <span className="relative shrink-0" aria-hidden="true">
                <img
                  src="https://randomuser.me/api/portraits/men/32.jpg"
                  alt="Agent avatar"
                  className="h-8 w-8 rounded-full object-cover shadow-[0_2px_6px_rgba(0,0,0,0.15)]"
                />
                {/* Status badge — bottom-right of avatar */}
                <span className={cn(
                  "absolute -bottom-0.5 -right-0.5 flex h-[14px] w-[14px] items-center justify-center rounded-full border-2 border-white",
                  activeStatus.dotClassName,
                )}>
                  {(status === "In a Call" || status === "Busy") ? (
                    <Minus className="h-2 w-2 text-white stroke-[3]" />
                  ) : status === "Offline" ? (
                    <span className="h-1 w-1 rounded-full bg-white/80" />
                  ) : null}
                </span>
              </span>
              <span className="hidden min-w-0 flex-col items-start sm:flex">
                <span className={`text-[15px] font-semibold leading-none tracking-[-0.02em] ${activeStatus.textClassName}`}>
                  {activeStatus.label}
                </span>
                <span className={`mt-1 text-[11px] font-medium leading-none ${activeStatus.textClassName}`}>
                  {formatStatusDuration(elapsedSeconds)}
                </span>
              </span>
              <ChevronDown className={cn("h-3.5 w-3.5 text-[#666666] transition-transform duration-150", statusMenuOpen && "rotate-180")} />
            </button>
            {statusMenuOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-[260px] rounded-2xl border border-black/10 bg-white p-2 shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
                <div className="space-y-1">
                  {statusOptions.filter((option) => option.label !== "In a Call").map((option) => (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => {
                        setStatus(option.label);
                        setStatusStartedAt(Date.now());
                        setStatusMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-normal text-[#333333] hover:bg-[#F8F8F9] transition-colors"
                    >
                      <span className={`h-3 w-3 rounded-full ${option.dotClassName}`} />
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
                <div className="mt-1 border-t border-[#F2F4F7] dark:border-border pt-1">
                  {/* Dark mode toggle */}
                  <button
                    type="button"
                    onClick={() => setIsDarkMode((v) => !v)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-normal text-[#333333] dark:text-[#CBD5E1] hover:bg-[#F2F4F7] dark:hover:bg-[#1C2536] transition-colors duration-150"
                  >
                    {isDarkMode ? (
                      <Sun className="h-3.5 w-3.5 text-[#667085] dark:text-[#94A3B8]" />
                    ) : (
                      <Moon className="h-3.5 w-3.5 text-[#667085] dark:text-[#94A3B8]" />
                    )}
                    <span>{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
                  </button>

                  {/* Connected Applications — hover flyout submenu */}
                  <ConnectedAppsFlyout
                    isOpen={isConnectedAppsOpen}
                    onOpen={() => setIsConnectedAppsOpen(true)}
                    onClose={() => setIsConnectedAppsOpen(false)}
                    degradedAppCount={degradedAppCount}
                    onDegradedCountChange={setDegradedAppCount}
                  />

                  {/* Log Out */}
                  <button
                    type="button"
                    onClick={() => {
                      setStatusMenuOpen(false);
                      navigate("/login");
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-normal text-[#C71D1A] hover:bg-[#FDEAEA] transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden gap-0 pb-4 pr-4 pt-0">
        <LeftQueueRail
          visibleAssignments={visibleAssignments.filter((a) => assignmentStatusesById[a.id] !== "parked")}
          queueStatuses={assignmentStatusesById}
          onStatusChange={handleAssignmentStatusChange}
          onRemoveAssignment={handleRemoveVisibleAssignment}
          onRemoveGroupedAssignments={handleRemoveGroupedAssignments}
          isOpen={isLeftRailOpen}
          onToggle={() => setIsLeftRailOpen((v) => !v)}
          completedTodayCount={completedTodayCount}
          onAddNewAssignment={(rect) => {
            setAddNewFlowAnchorRect(rect);
            setIsAddNewFlowOpen((v) => !v);
          }}
          totalQueueCount={staticAssignments.filter((a) => a.channel !== "voice" && a.channel !== "email").length}
          escalatedRailCount={escalatedRailCount}
          incomingItems={incomingNotifications.filter((n) => n.statusLabel !== "transferred")}
          onIncomingMonitor={monitorIncomingAssignment}
          onIncomingTakeover={takeoverIncomingAssignment}
          onIncomingTransfer={transferIncomingAssignment}
          onIncomingDismiss={(item) => {
            removeIncoming(item.id);
            if (actedOnNotifications.has(item.customerRecordId)) {
              const sa = staticAssignments.find(
                (s) => s.customerRecordId === item.customerRecordId || s.customerId === item.customerId,
              );
              setDismissalToast({
                customerName: item.name,
                customerId: item.customerId ?? "",
                status: "dismissed",
                resolvedStatus: "Resolved",
                actions: sa?.aiOverview?.actions ?? [],
                preview: item.preview ?? "",
                botType: item.label ?? "Aria",
                channel: item.channel,
              });
              setActedOnNotifications((prev) => { const next = new Set(prev); next.delete(item.customerRecordId); return next; });
            }
          }}
          onIncomingApprove={approveIncomingAssignment}
          onIncomingApproveResolved={resolveIncomingByApprove}
          onIncomingDismissResolved={(item) => {
            const sa = staticAssignments.find(
              (s) => s.customerRecordId === item.customerRecordId || s.customerId === item.customerId,
            );
            setDismissalToast({
              customerName: item.name,
              customerId: item.customerId ?? "",
              status: "dismissed",
              resolvedStatus: "Resolved",
              actions: sa?.aiOverview?.actions ?? [],
              preview: item.preview ?? "",
              botType: item.label ?? "Aria",
              channel: item.channel,
            });
          }}
          onIncomingLaunchCall={(item) => {
            markActedOn(item.customerRecordId);
            if (item.statusLabel === "lead") {
              launchLeadCall(item);
            } else {
              layoutContextValue.toggleCallPopunder(null, item.customerRecordId);
              removeIncoming(item.id);
            }
          }}
          onIncomingReviewLead={(item) => {
            markActedOn(item.customerRecordId);
            removeIncoming(item.id);
            if (item.customerRecordId) layoutContextValue.dismissLeadNotification(item.customerRecordId);
            layoutContextValue.pushTransferredToast({
              name: item.name,
              customerRecordId: item.customerRecordId,
              customerId: item.customerId,
              channel: item.channel as AssignmentChannel,
              label: item.label,
              priority: item.priority,
              preview: item.preview,
            });
            layoutContextValue.acceptIssue({
              id: item.id,
              name: item.name,
              customerId: item.customerId ?? "",
              customerRecordId: item.customerRecordId,
              channel: item.channel as AssignmentChannel,
              priority: item.priority,
              preview: item.preview,
              status: "pending" as QueueAssignmentStatus,
              waitTime: item.time ?? "0m",
              openAsHistoryOnly: true,
              onCreated: (assignmentId) => {
                const sa = staticAssignments.find((s) => s.customerRecordId === item.customerRecordId);
                if (sa) acceptedStaticsStore.set(sa.id, assignmentId);
              },
            });
          }}
          launchingAssignmentId={launchingLeadId}
        />
        {isActivityRoute && visibleAssignments.length === 0 && (
          <div className={cn(
            "flex min-w-0 flex-1 flex-col items-center justify-center gap-5 rounded-lg border border-black/[0.10] bg-white",
            "transition-[opacity,transform] duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[opacity,transform]",
            isPageEntered ? "opacity-100 scale-100" : "scale-[0.97] opacity-0",
          )}>
            <div className="flex flex-col items-center gap-4 text-center px-8 max-w-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F2F4F7]">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" className="h-9 w-9">
                  <rect x="6" y="10" width="36" height="30" rx="4" fill="#E4E7EC" stroke="#D0D5DD" strokeWidth="1.5"/>
                  <rect x="10" y="6" width="28" height="30" rx="4" fill="#F9FAFB" stroke="#D0D5DD" strokeWidth="1.5"/>
                  <rect x="15" y="13" width="18" height="2.5" rx="1.25" fill="#D0D5DD"/>
                  <rect x="15" y="19" width="13" height="2" rx="1" fill="#E4E7EC"/>
                  <rect x="15" y="24" width="16" height="2" rx="1" fill="#E4E7EC"/>
                  <circle cx="35" cy="34" r="8" fill="#EBF4FD" stroke="#BFDBFE" strokeWidth="1.5"/>
                  <path d="M32 34l2 2 4-4" stroke="#166CCA" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <p className="text-[15px] font-semibold text-[#1D2939]">No active assignments</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-[#667085]">
                  You're all caught up. New assignments will appear here automatically when they become available.
                </p>
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-[#BFDBFE] bg-[#EBF4FD] px-3.5 py-1.5">
                <span className="h-2 w-2 rounded-full bg-[#208337] animate-pulse" />
                <span className="text-[12px] font-medium text-[#166CCA]">Listening for new assignments</span>
              </div>
            </div>
          </div>
        )}
        {isCombinedInteractionPanel ? (
          <div className={cn(
            "flex min-w-0 flex-1",
            "transition-[opacity,transform] duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[opacity,transform]",
            isPageEntered ? "opacity-100 scale-100" : "scale-[0.97] opacity-0",
          )}>
            <CombinedInteractionPanel
              isOpen={isCanvasMergedIntoCombinedPanel ? true : isConversationPanelOpen || isCustomerInfoPanelOpen}
              width={dockedConversationWidth}
              maxWidth={conversationPanelMaxWidth}
              activeTab={combinedInteractionPanelTab}
              conversation={conversationState}
              openChannels={activeConversationTabs}
              activeChannel={activeConversationChannel}
              customerRecordId={selectedAssignment.customerRecordId}
              customerName={selectedAssignment.name}
              customerId={selectedAssignment.customerId}
              panelSelection={deskPanelSelection}
              showConversationTab
              showCanvasTab={isCanvasMergedIntoCombinedPanel}
              canvasTabLabel={deskCanvasTabLabel}
              canvasContent={children}
              isFullWidth={isCanvasMergedIntoCombinedPanel}
              onConversationChange={handleConversationStateChange}
              onSelectChannel={(channel) => {
                const target = visibleAssignments.find(
                  (a) => a.customerRecordId === selectedAssignment.customerRecordId && a.channel === channel,
                );
                if (target) {
                  // If the left panel is currently closed, keep it closed for the new channel tab
                  if (closedSummaryIds.has(selectedAssignment.id)) {
                    setClosedSummaryIds((prev) => new Set([...prev, target.id]));
                  }
                  setSelectedAssignmentId(target.id);
                }
              }}
              onOpenDeskPanel={openDeskPanel}
              onResolveAssignment={handleResolveAssignment}
              onTabChange={(tab) => {
                setCombinedInteractionPanelTab(tab);
                setIsConversationPanelOpen(true);
                setIsCustomerInfoPanelOpen(true);
                setIsConversationPopunderOpen(false);
                setIsCustomerInfoPopunderOpen(false);
              }}
              onClose={closeCombinedInteractionPanel}
            />
          </div>
        ) : isAppSpaceSplitLayout ? (
          <div className={cn(
            "flex min-w-0 flex-1 items-stretch gap-4",
            "transition-[opacity,transform] duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[opacity,transform]",
            isPageEntered ? "opacity-100 scale-100" : "scale-[0.97] opacity-0",
          )}>
            {isInlineConversationSplitPanelVisible ? (
              <DockedConversationPanel
                isOpen
                conversation={conversationState}
                openChannels={activeConversationTabs}
                activeChannel={activeConversationChannel}
                customerRecordId={selectedAssignment.customerRecordId}
                onConversationChange={handleConversationStateChange}
                onSelectChannel={(channel) => {
                const target = visibleAssignments.find(
                  (a) => a.customerRecordId === selectedAssignment.customerRecordId && a.channel === channel,
                );
                if (target) {
                  // If the left panel is currently closed, keep it closed for the new channel tab
                  if (closedSummaryIds.has(selectedAssignment.id)) {
                    setClosedSummaryIds((prev) => new Set([...prev, target.id]));
                  }
                  setSelectedAssignmentId(target.id);
                }
              }}
                onOpenDeskPanel={openDeskPanel}
                onOpenCall={layoutContextValue.toggleCallPopunder}
                onOpenChannel={(channel) => {
                  const newAssignment = openCustomerConversation(selectedAssignment.customerRecordId, channel);
                  if (newAssignment && closedSummaryIds.has(selectedAssignment.id)) {
                    setClosedSummaryIds((prev) => new Set([...prev, newAssignment.id]));
                  }
                }}
                onOpenCustomerInfo={openCustomerInfoIconPopover}
                isCustomerInfoOpen={isDeskCustomerInfoPopunderVisible || isCustomerInfoIconPopoverOpen || isTakeoverInfoOpen}

                onConversationStatusChange={handleConversationStatusChange}
                onResolveAssignment={handleResolveAssignment}
                overviewIsOpen={overviewOpenByAssignmentId[selectedAssignment.id] ?? true}
                onOverviewOpenChange={(open) => {
                  setOverviewOpenByAssignmentId((currentState) => ({
                    ...currentState,
                    [selectedAssignment.id]: open,
                  }));
                }}
                isCallDisabled={status === "In a Call" || status !== "Available"}
                onClose={closeConversationPanel}
                showTrailingGap={false}
                initialSummaryOpen={false}
                onSummaryClose={() => setClosedSummaryIds((prev) => new Set([...prev, selectedAssignment.id]))}
                isPendingAcceptance={pendingAcceptanceIds.has(selectedAssignment.id)}
                onAcceptAssignment={() => acceptPendingAssignment(selectedAssignment.id)}
                casePreview={selectedAssignment.preview}
                assignmentStatus={getCaseStatus(selectedAssignment.customerRecordId)}
                onAssignmentStatusChange={(s) => handleCaseStatusChange(selectedAssignment.customerRecordId, s)}
                onRemoveAssignment={(recipient) => handleDismissCase(selectedAssignment.customerRecordId, recipient)}
                isEqualSplit
                onUndockStart={(event) => {
                  if (typeof window === "undefined") return;

                  event.preventDefault();

                  const bounds = event.currentTarget.closest("[data-conversation-panel-header]")?.getBoundingClientRect()
                    ?? event.currentTarget.parentElement?.getBoundingClientRect();
                  if (!bounds) return;

                  const undockWidth = 750;
                  const margin = CONVERSATION_POPOUNDER_MARGIN;
                  const nextPosition = {
                    x: Math.min(
                      Math.max(margin, bounds.left),
                      window.innerWidth - undockWidth - margin,
                    ),
                    y: Math.min(
                      Math.max(margin, bounds.top),
                      window.innerHeight - conversationPopunderSize.height - margin,
                    ),
                  };

                  bringFloatingPanelToFront("conversation");
                  setConversationPopunderSize({ width: undockWidth, height: conversationPopunderSize.height });
                  setConversationPopunderPosition(nextPosition);
                  setIsConversationPanelOpen(false);
                  setIsConversationPopunderOpen(true);
                  setConversationDragActivation({
                    id: Date.now(),
                    offset: {
                      x: event.clientX - nextPosition.x,
                      y: event.clientY - nextPosition.y,
                    },
                  });
                }}
                caseOverviewOpenTrigger={caseOverviewOpenTrigger}
                activeCaseTransferredItem={activeCaseTransferredItem}
                onTakeoverOpen={(pos) => {
                  if (pos) conversationPanelHeaderBottomRef.current = pos.y;
                  // Pre-populate takeover card data but don't auto-open the popunder.
                  setCustomerInfoTakeoverStartTime(Date.now());
                  const botLabel = selectedAssignment.label ?? "Aria";
                  const botAvatarUrl = botLabel === "Emily"
                    ? `${import.meta.env.BASE_URL}emily-avatar.jpg`
                    : botLabel === "Jacob"
                      ? "https://cdn.builder.io/api/v1/image/assets%2F9d3d716b4b844ab4bcf3267b33310813%2F9f1a8ec85d5f478b9a015a2b7eece268?format=webp&width=800&height=1200"
                      : "https://cdn.builder.io/api/v1/image/assets%2F9d3d716b4b844ab4bcf3267b33310813%2F054057b71e64441097a4902d7dcea754?format=webp&width=800&height=1200";
                  const ctx = staticAssignments.find((s) =>
                    s.customerRecordId === selectedAssignment.customerRecordId ||
                    s.customerId === selectedAssignment.customerId
                  )?.customerContext;
                  if (ctx) {
                    setCustomerInfoTakeoverCard({
                      botType: botLabel,
                      botAvatarUrl,
                      customerContext: ctx,
                      aiConfidence: selectedAssignment.aiConfidence ?? 78,
                      aiConfidenceReason: selectedAssignment.aiConfidenceReason ?? "Based on 3 similar resolved cases and firmware documentation match.",
                    });
                  }
                }}
                aiConfidence={selectedAssignment.aiConfidence}
                aiConfidenceReason={selectedAssignment.aiConfidenceReason}
                botLabel={selectedAssignment.label}
                customerContext={staticAssignments.find((s) =>
                  s.customerRecordId === selectedAssignment.customerRecordId ||
                  s.customerId === selectedAssignment.customerId
                )?.customerContext}
                onAiActionClick={(actionId) => {
                  if (actionId === "auto-resolve-dismiss") {
                    handleResolveAssignment();
                  }
                }}
              />
            ) : null}
            <InlineAppSpacePanel isOpen={isInlineAppSpacePanelVisible && isDeskRoute}>
              <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-lg border border-black/[0.16] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
                {children}
              </div>
            </InlineAppSpacePanel>
            {isInlineAppSpacePanelVisible && !isDeskRoute ? (
              <DockedCustomerInfoPanel
                isOpen
                width={dockedCustomerInfoWidth}
                maxWidth={customerInfoPanelMaxWidth}
                customerRecordId={selectedAssignment.customerRecordId}
                customerName={selectedAssignment.name}
                customerId={selectedAssignment.customerId}
                panelSelection={deskPanelSelection}
                onWidthChange={setDockedCustomerInfoWidth}
                onOpenCall={layoutContextValue.toggleCallPopunder}
                isCallDisabled={status === "In a Call" || status !== "Available"}
                onClose={closeCustomerInfoPanel}
                showTrailingGap={false}
                isEqualSplit
                onUndockStart={(event) => {
                  if (typeof window === "undefined") return;

                  event.preventDefault();

                  const bounds = event.currentTarget.closest("[data-conversation-panel-header]")?.getBoundingClientRect()
                  ?? event.currentTarget.parentElement?.getBoundingClientRect();
                if (!bounds) return;

                  const margin = CUSTOMER_INFO_POPOUNDER_MARGIN;
                  const nextPosition = {
                    x: Math.min(
                      Math.max(margin, bounds.left),
                      window.innerWidth - customerInfoPopunderSize.width - margin,
                    ),
                    y: Math.min(
                      Math.max(margin, bounds.top),
                      window.innerHeight - customerInfoPopunderSize.height - margin,
                    ),
                  };

                  bringFloatingPanelToFront("customerInfo");
                  setCustomerInfoPopunderPosition(nextPosition);
                  setIsCustomerInfoPopunderOpen(true);
                  setCustomerInfoDragActivation({
                    id: Date.now(),
                    offset: {
                      x: event.clientX - nextPosition.x,
                      y: event.clientY - nextPosition.y,
                    },
                  });
                }}
              />
            ) : null}
          </div>
        ) : (
          <>
            <DockedConversationPanel
              isOpen={isDockedConversationVisible}
              conversation={conversationState}
              openChannels={activeConversationTabs}
              activeChannel={activeConversationChannel}
              customerRecordId={selectedAssignment.customerRecordId}
              onConversationChange={handleConversationStateChange}
              onSelectChannel={(channel) => {
                const target = visibleAssignments.find(
                  (a) => a.customerRecordId === selectedAssignment.customerRecordId && a.channel === channel,
                );
                if (target) {
                  // If the left panel is currently closed, keep it closed for the new channel tab
                  if (closedSummaryIds.has(selectedAssignment.id)) {
                    setClosedSummaryIds((prev) => new Set([...prev, target.id]));
                  }
                  setSelectedAssignmentId(target.id);
                }
              }}
              onOpenDeskPanel={openDeskPanel}
              onOpenCall={layoutContextValue.toggleCallPopunder}
              onOpenChannel={(channel) => openCustomerConversation(selectedAssignment.customerRecordId, channel)}
              isCustomerInfoOpen={isConversationDockedCustomerInfoVisible || isDeskCustomerInfoPopunderVisible || isCustomerInfoIconPopoverOpen || isTakeoverInfoOpen}
              onOpenCustomerInfo={openCustomerInfoIconPopover}
              isCallActive={status === "In a Call" && activeCallAssignmentId === selectedAssignment.id}
              hasTranscript={selectedAssignment.customerRecordId !== "terry" && transcriptLines.length > 0}
              voiceOpeningLines={
                status === "In a Call" && activeCallAssignmentId === selectedAssignment.id
                  ? (staticAssignments.find((s) =>
                      s.customerRecordId === selectedAssignment.customerRecordId ||
                      s.customerId === selectedAssignment.customerId
                    )?.leadIntelligence?.openingLines ?? null)
                  : null
              }
              voiceTopContent={
                selectedAssignment.customerRecordId === "terry" && status === "In a Call" && activeCallAssignmentId === selectedAssignment.id
                  ? <TerryCallPanel
                      lineCount={transcriptLines.length}
                      callKey={activeCallAssignmentId ?? "terry"}
                      isCallActive={status === "In a Call"}
                      onLeadSaved={() => {
                        setDynamicHistoryItems((prev) => {
                          // Don't duplicate if lead was already saved.
                          if (prev.some((h) => h.id === "terry-lead-form")) return prev;
                          return [...prev, {
                            id: "terry-lead-form",
                            title: "Lead Form Created",
                            timestamp: "Just now",
                            detail: "Lead form captured and saved during inbound voice call. Enterprise opportunity — Nexus Freight, $400K budget, Q4 deadline.",
                            dot: "blue" as const,
                            type: "lead" as const,
                            interaction: { kind: "lead" as const },
                          }];
                        });
                      }}
                    />
                  : undefined
              }
              voiceContentOverlay={
                selectedAssignment.customerRecordId === "terry" && transcriptLines.length > 0 && !isTranscriptVisible
                  ? (
                    <button
                      type="button"
                      onClick={() => setIsTranscriptVisible(true)}
                      className="flex items-center gap-1.5 rounded-full border border-[#E4E7EC] bg-white px-3 py-1.5 text-[11px] font-medium text-[#344054] shadow-sm transition-colors hover:bg-[#F9FAFB] hover:border-[#D0D5DD]"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      Show Transcript
                    </button>
                  )
                  : undefined
              }
              voiceRightPanel={
                selectedAssignment.customerRecordId === "terry" && transcriptLines.length > 0
                  ? (
                    <TerryTranscriptPanel
                      transcriptLines={transcriptLines}
                      isVisible={isTranscriptVisible}
                      isLive={status === "In a Call" && activeCallAssignmentId === selectedAssignment.id}
                      customerName={selectedAssignment.name}
                      scriptLength={transcriptScriptRef.current.length}
                      onClose={() => setIsTranscriptVisible(false)}
                    />
                  )
                  : undefined
              }
              onVoiceOpeningLineClick={selectedAssignment.customerRecordId === "terry" ? () => {
                setTerryDemoStarted(true);
              } : undefined}
              extraHistoryItems={selectedAssignment.customerRecordId === "terry" ? dynamicHistoryItems : []}
              isTranscriptOpen={selectedAssignment.customerRecordId !== "terry" && (isTranscriptPopunderOpen || isConversationDockedTranscriptVisible)}
              onOpenTranscript={selectedAssignment.customerRecordId !== "terry" ? () => {
                if (isTranscriptInConversationDockMode) {
                  // Transcript is docked — toggle its open/closed state.
                  setIsConversationDockedPanelOpen((prev) => !prev);
                } else {
                  bringFloatingPanelToFront("transcript");
                  setIsTranscriptPopunderOpen((prev) => !prev);
                }
              } : undefined}
              onConversationStatusChange={handleConversationStatusChange}
              onResolveAssignment={handleResolveAssignment}
              overviewIsOpen={overviewOpenByAssignmentId[selectedAssignment.id] ?? true}
              onOverviewOpenChange={(open) => {
                setOverviewOpenByAssignmentId((currentState) => ({
                  ...currentState,
                  [selectedAssignment.id]: open,
                }));
              }}
              isCallDisabled={status === "In a Call" || status !== "Available"}
              onClose={closeConversationPanel}
              showTrailingGap={isConversationDockedCustomerInfoVisible || isConversationDockedTranscriptVisible || isDeskCustomerInfoVisible || shouldCombineDockedCustomerAndDeskPanels || isMainCanvasVisible}
              showTaskSummary={taskSummaryIds.has(selectedAssignment.id)}
              initialSummaryOpen={false}
                onSummaryClose={() => setClosedSummaryIds((prev) => new Set([...prev, selectedAssignment.id]))}
              isPendingAcceptance={pendingAcceptanceIds.has(selectedAssignment.id)}
              onAcceptAssignment={() => acceptPendingAssignment(selectedAssignment.id)}
              casePreview={selectedAssignment.preview}
              assignmentStatus={getCaseStatus(selectedAssignment.customerRecordId)}
              onAssignmentStatusChange={(s) => handleCaseStatusChange(selectedAssignment.customerRecordId, s)}
              onRemoveAssignment={(recipient) => handleDismissCase(selectedAssignment.customerRecordId, recipient)}
              onUndockStart={(event) => {
                if (typeof window === "undefined") return;

                event.preventDefault();

                const bounds = event.currentTarget.closest("[data-conversation-panel-header]")?.getBoundingClientRect()
                  ?? event.currentTarget.parentElement?.getBoundingClientRect();
                if (!bounds) return;

                const undockWidth = 750;
                const margin = CONVERSATION_POPOUNDER_MARGIN;
                const nextPosition = {
                  x: Math.min(
                    Math.max(margin, bounds.left),
                    window.innerWidth - undockWidth - margin,
                  ),
                  y: Math.min(
                    Math.max(margin, bounds.top),
                    window.innerHeight - conversationPopunderSize.height - margin,
                  ),
                };

                bringFloatingPanelToFront("conversation");
                setConversationPopunderSize({ width: undockWidth, height: conversationPopunderSize.height });
                setConversationPopunderPosition(nextPosition);
                setIsConversationPanelOpen(false);
                setIsConversationPopunderOpen(true);
                setConversationDragActivation({
                  id: Date.now(),
                  offset: {
                    x: event.clientX - nextPosition.x,
                    y: event.clientY - nextPosition.y,
                  },
                });
              }}
              caseOverviewOpenTrigger={caseOverviewOpenTrigger}
              activeCaseTransferredItem={activeCaseTransferredItem}
              onTakeoverOpen={(pos) => {
                if (pos) conversationPanelHeaderBottomRef.current = pos.y;
                const botLabel = selectedAssignment.label ?? "Aria";
                const botAvatarUrl = botLabel === "Emily"
                  ? `${import.meta.env.BASE_URL}emily-avatar.jpg`
                  : botLabel === "Jacob"
                    ? "https://cdn.builder.io/api/v1/image/assets%2F9d3d716b4b844ab4bcf3267b33310813%2F9f1a8ec85d5f478b9a015a2b7eece268?format=webp&width=800&height=1200"
                    : "https://cdn.builder.io/api/v1/image/assets%2F9d3d716b4b844ab4bcf3267b33310813%2F054057b71e64441097a4902d7dcea754?format=webp&width=800&height=1200";
                const ctx = staticAssignments.find((s) =>
                  s.customerRecordId === selectedAssignment.customerRecordId ||
                  s.customerId === selectedAssignment.customerId
                )?.customerContext;
                if (ctx) {
                  setCustomerInfoTakeoverCard({
                    botType: botLabel,
                    botAvatarUrl,
                    customerContext: ctx,
                    aiConfidence: selectedAssignment.aiConfidence ?? 78,
                    aiConfidenceReason: selectedAssignment.aiConfidenceReason ?? "Based on 3 similar resolved cases and firmware documentation match.",
                  });
                }
                // Pre-populate takeover data but don't auto-open the popunder.
                setCustomerInfoTakeoverStartTime(Date.now());
              }}
              onAiActionClick={(actionId) => {
                if (actionId === "auto-resolve-dismiss") {
                  handleResolveAssignment();
                }
              }}
            />
            {/* Customer info docked directly to the right of the conversation panel
                (activity route only, triggered by the dock button in the floating popunder). */}
            <DockedCustomerInfoPanel
              isOpen={isConversationDockedCustomerInfoVisible}
              width={dockedCustomerInfoWidth}
              maxWidth={customerInfoPanelMaxWidth}
              customerRecordId={selectedAssignment.customerRecordId}
              customerName={selectedAssignment.name}
              customerId={selectedAssignment.customerId}
              panelSelection={deskPanelSelection}
              onWidthChange={setDockedCustomerInfoWidth}
              onOpenCall={layoutContextValue.toggleCallPopunder}
              isCallDisabled={status === "In a Call" || status !== "Available"}
              onClose={() => setIsConversationDockedPanelOpen(false)}
              showTrailingGap={isMainCanvasVisible}
              takeoverCard={customerInfoTakeoverCard}
              onUndockStart={(event) => {
                if (typeof window === "undefined") return;

                event.preventDefault();

                const bounds = event.currentTarget.parentElement?.getBoundingClientRect();
                if (!bounds) return;

                const margin = CUSTOMER_INFO_POPOUNDER_MARGIN;
                const nextPosition = {
                  x: Math.min(
                    Math.max(margin, bounds.left),
                    window.innerWidth - customerInfoPopunderSize.width - margin,
                  ),
                  y: Math.min(
                    Math.max(margin, bounds.top),
                    window.innerHeight - customerInfoPopunderSize.height - margin,
                  ),
                };

                bringFloatingPanelToFront("customerInfo");
                setIsCustomerInfoDockedToConversation(false);
                setIsConversationDockedPanelOpen(true);
                setCustomerInfoPopunderPosition(nextPosition);
                setIsCustomerInfoIconPopoverOpen(true);
                setCustomerInfoDragActivation({
                  id: Date.now(),
                  offset: {
                    x: event.clientX - nextPosition.x,
                    y: event.clientY - nextPosition.y,
                  },
                });
              }}
            />
            <DockedCustomerInfoPanel
              isOpen={isDeskCustomerInfoVisible}
              width={dockedCustomerInfoWidth}
              maxWidth={customerInfoPanelMaxWidth}
              customerRecordId={selectedAssignment.customerRecordId}
              customerName={selectedAssignment.name}
              customerId={selectedAssignment.customerId}
              panelSelection={deskPanelSelection}
              onWidthChange={setDockedCustomerInfoWidth}
              onOpenCall={layoutContextValue.toggleCallPopunder}
              isCallDisabled={status === "In a Call" || status !== "Available"}
              onClose={closeCustomerInfoPanel}
              showTrailingGap={isMainCanvasVisible}
              takeoverCard={customerInfoTakeoverCard}
              onUndockStart={(event) => {
                if (typeof window === "undefined") return;

                event.preventDefault();

                const bounds = event.currentTarget.parentElement?.getBoundingClientRect();
                if (!bounds) return;

                const margin = CUSTOMER_INFO_POPOUNDER_MARGIN;
                const nextPosition = {
                  x: Math.min(
                    Math.max(margin, bounds.left),
                    window.innerWidth - customerInfoPopunderSize.width - margin,
                  ),
                  y: Math.min(
                    Math.max(margin, bounds.top),
                    window.innerHeight - customerInfoPopunderSize.height - margin,
                  ),
                };

                bringFloatingPanelToFront("customerInfo");
                setCustomerInfoPopunderPosition(nextPosition);
                setIsCustomerInfoPopunderOpen(true);
                setCustomerInfoDragActivation({
                  id: Date.now(),
                  offset: {
                    x: event.clientX - nextPosition.x,
                    y: event.clientY - nextPosition.y,
                  },
                });
              }}
            />
            {/* Transcript panel docked directly to the right of the conversation panel
                (activity route only, triggered by the dock button in the floating transcript).
                Not shown for Terry's call — transcript is embedded inline in the voice area. */}
            <DockedTranscriptPanel
              isOpen={isConversationDockedTranscriptVisible && selectedAssignment.customerRecordId !== "terry"}
              width={dockedCustomerInfoWidth}
              maxWidth={customerInfoPanelMaxWidth}
              onWidthChange={setDockedCustomerInfoWidth}
              transcriptLines={transcriptLines}
              scriptLength={transcriptScriptRef.current.length}
              isCallActive={status === "In a Call"}
              customerName={selectedAssignment.name}
              showTrailingGap={isMainCanvasVisible}
              onClose={() => setIsConversationDockedPanelOpen(false)}
              onUndockStart={(event) => {
                if (typeof window === "undefined") return;
                event.preventDefault();
                const bounds = event.currentTarget.parentElement?.getBoundingClientRect();
                if (!bounds) return;
                const margin = CUSTOMER_INFO_POPOUNDER_MARGIN;
                const nextPosition = {
                  x: Math.min(Math.max(margin, bounds.left), window.innerWidth - transcriptPopunderSize.width - margin),
                  y: Math.min(Math.max(margin, bounds.top), window.innerHeight - transcriptPopunderSize.height - margin),
                };
                bringFloatingPanelToFront("transcript");
                setIsTranscriptDockedToConversation(false);
                setIsConversationDockedPanelOpen(true);
                setTranscriptPopunderPosition(nextPosition);
                setIsTranscriptPopunderOpen(true);
                setTranscriptDragActivation({
                  id: Date.now(),
                  offset: { x: event.clientX - nextPosition.x, y: event.clientY - nextPosition.y },
                });
              }}
            />
          </>
        )}
        {!isExpandedCanvasRoute && !isCanvasMergedIntoCombinedPanel && (
          <div
            className={cn(
              "flex min-w-0 flex-1 flex-col overflow-hidden min-[800px]:min-w-[360px]",
              "transition-[opacity,transform] duration-500 ease-out will-change-[opacity,transform]",
              isPageEntered ? "opacity-100" : "scale-[0.985] opacity-0",
              isActivityRoute ? "bg-transparent" : "rounded-lg border border-black/[0.16] bg-white",
            )}
          >
            {children}
          </div>
        )}
      </div>

      {conversationPopunderPresence.mounted && !isConversationPanelOpen && (
        <ConversationPopunder
          visible={conversationPopunderPresence.visible}
          position={conversationPopunderPosition}
          size={conversationPopunderSize}
          conversation={conversationState}
          openChannels={activeConversationTabs}
          activeChannel={activeConversationChannel}
          customerRecordId={selectedAssignment.customerRecordId}
          zIndex={getFloatingPanelZIndex("conversation")}
          onPositionChange={setConversationPopunderPosition}
          onSizeChange={setConversationPopunderSize}
          onConversationChange={handleConversationStateChange}
          onSelectChannel={setActiveConversationChannel}
          onOpenDeskPanel={openDeskPanel}
          onOpenCall={layoutContextValue.toggleCallPopunder}
          isCustomerInfoOpen={isDeskCustomerInfoPopunderVisible || isCustomerInfoIconPopoverOpen || isTakeoverInfoOpen}
          onOpenChannel={(channel) => openCustomerConversation(selectedAssignment.customerRecordId, channel)}
          onOpenCustomerInfo={openCustomerInfoIconPopover}
          onConversationStatusChange={handleConversationStatusChange}
          onResolveAssignment={handleResolveAssignment}
          overviewIsOpen={overviewOpenByAssignmentId[selectedAssignment.id] ?? true}
          onOverviewOpenChange={(open) => {
            setOverviewOpenByAssignmentId((currentState) => ({
              ...currentState,
              [selectedAssignment.id]: open,
            }));
          }}
          isCallDisabled={status === "In a Call" || status !== "Available"}
          onDock={dockConversationPanel}
          dragActivation={conversationDragActivation}
          onInteractStart={() => bringFloatingPanelToFront("conversation")}
        />
      )}

      {(isActivityRoute || isDeskRoute) && !isCustomerInfoInConversationDockMode && (isDeskCustomerInfoPopunderVisible || isCustomerInfoIconPopoverOpen || isTakeoverInfoOpen) && (
        <CustomerInfoPopunder
          ref={customerInfoPopunderRef}
          position={customerInfoPopunderPosition}
          size={customerInfoPopunderSize}
          customerRecordId={selectedAssignment.customerRecordId}
          customerName={selectedAssignment.name}
          customerId={selectedAssignment.customerId}
          panelSelection={deskPanelSelection}
          zIndex={getFloatingPanelZIndex("customerInfo")}
          onPositionChange={setCustomerInfoPopunderPosition}
          onSizeChange={setCustomerInfoPopunderSize}
          onOpenCall={layoutContextValue.toggleCallPopunder}
          isCallDisabled={status === "In a Call" || status !== "Available"}
          takeoverStartTime={customerInfoTakeoverStartTime}
          takeoverCard={customerInfoTakeoverCard}
          onClose={() => { setIsCustomerInfoIconPopoverOpen(false); setIsTakeoverInfoOpen(false); setCustomerInfoTakeoverStartTime(null); closeCustomerInfoPanel(); }}
          onDock={(isCustomerInfoPanelAllowed || (isActivityRoute && isDockedConversationVisible)) ? () => { setIsCustomerInfoIconPopoverOpen(false); dockCustomerInfoPanel(); } : undefined}
          dragActivation={customerInfoDragActivation}
          onInteractStart={() => bringFloatingPanelToFront("customerInfo")}
        />
      )}

      {/* Live call transcript popunder — not shown for Terry's call (transcript is inline) */}
      {isTranscriptPopunderOpen && selectedAssignment.customerRecordId !== "terry" && (
        <TranscriptPopunder
          position={transcriptPopunderPosition}
          size={transcriptPopunderSize}
          zIndex={getFloatingPanelZIndex("transcript")}
          transcriptLines={transcriptLines}
          scriptLength={transcriptScriptRef.current.length}
          isCallActive={status === "In a Call"}
          customerName={selectedAssignment.name}
          onPositionChange={setTranscriptPopunderPosition}
          onSizeChange={setTranscriptPopunderSize}
          onClose={() => setIsTranscriptPopunderOpen(false)}
          dragActivation={transcriptDragActivation}
          onInteractStart={() => bringFloatingPanelToFront("transcript")}
          onDock={isActivityRoute && isDockedConversationVisible ? dockTranscriptToConversation : undefined}
        />
      )}

      {/* Independent Directory (desk) popunder */}
      {isDeskViewPopunderOpen && (
        <DeskCanvasPopunder
          visible
          view="desk"
          position={deskViewPopunderPosition}
          size={deskViewPopunderSize}
          customerId={selectedAssignment.customerRecordId}
          zIndex={getFloatingPanelZIndex("deskCanvas")}
          onPositionChange={setDeskViewPopunderPosition}
          onSizeChange={setDeskViewPopunderSize}
          onClose={() => setIsDeskViewPopunderOpen(false)}
          onInteractStart={() => bringFloatingPanelToFront("deskCanvas")}
        />
      )}

      {/* Independent Copilot popunder */}
      {copilotPopunderPresence.mounted && (
        <DeskCanvasPopunder
          visible={copilotPopunderPresence.visible}
          view="copilot"
          position={copilotViewPopunderPosition}
          size={copilotViewPopunderSize}
          customerId={selectedAssignment.customerRecordId}
          zIndex={getFloatingPanelZIndex("deskCanvas") + 1}
          onPositionChange={setCopilotViewPopunderPosition}
          onSizeChange={setCopilotViewPopunderSize}
          onClose={() => setIsCopilotViewPopunderOpen(false)}
          onInteractStart={() => bringFloatingPanelToFront("deskCanvas")}
        />
      )}

      {/* Shared popunder for notes / add / customer / notifications */}
      {deskCanvasPresence.mounted && deskCanvasPopunderView && (
        <DeskCanvasPopunder
          visible={deskCanvasPresence.visible}
          view={deskCanvasPopunderView}
          position={deskCanvasPopunderPosition}
          size={deskCanvasPopunderSize}
          customerId={selectedAssignment.customerRecordId}
          zIndex={getFloatingPanelZIndex("deskCanvas")}
          onPositionChange={setDeskCanvasPopunderPosition}
          onSizeChange={setDeskCanvasPopunderSize}
          onClose={closeDeskCanvasPopunder}
          onDock={dockDeskCanvasPopunder}
          dragActivation={deskCanvasDragActivation}
          onInteractStart={() => bringFloatingPanelToFront("deskCanvas")}
        />
      )}

      {isCallPopunderOpen && (
        <CallControlsPopunder
          position={callPopunderPosition}
          size={callPopunderSize}
          mode={callPopunderMode}
          zIndex={getFloatingPanelZIndex("call")}
          onPositionChange={setCallPopunderPosition}
          onSizeChange={setCallPopunderSize}
          isJoiningCall={isJoiningCallPopunder}
          joiningCallCustomerName={joiningCallCustomerName}
          initialAccountNumber={pendingCallAccountNumber}
          onClose={() => {
            if (callConnectTimeoutRef.current !== null) {
              window.clearTimeout(callConnectTimeoutRef.current);
              callConnectTimeoutRef.current = null;
            }
            setIsCallPopunderOpen(false);
            setPendingCallAccountNumber("");
            setCallPopunderMode(status === "In a Call" ? "controls" : "setup");
            setIsJoiningCallPopunder(false);
            setJoiningCallCustomerName("");
            setJoiningCallAssignmentId(null);
          }}
          onLaunchCall={() => {
            if (callConnectTimeoutRef.current !== null) {
              window.clearTimeout(callConnectTimeoutRef.current);
            }

            const capturedJoiningAssignmentId = joiningCallAssignmentId;
            setIsJoiningCallPopunder(false);
            setJoiningCallCustomerName("");
            setJoiningCallAssignmentId(null);
            setCallPopunderMode("connecting");
            callConnectTimeoutRef.current = window.setTimeout(() => {
              layoutContextValue.startCallStatus();
              let resolvedAssignmentId: string;
              if (capturedJoiningAssignmentId) {
                // Re-use the card already created by acceptIssue — don't open a duplicate
                setSelectedAssignmentId(capturedJoiningAssignmentId);
                openConversationPanel();
                resolvedAssignmentId = capturedJoiningAssignmentId;
              } else {
                const nextVoiceAssignment = openCustomerConversation(pendingCallCustomerRecordId, "voice");
                resolvedAssignmentId = nextVoiceAssignment.id;
              }
              setActiveCallAssignmentId(resolvedAssignmentId);
              setIsCallPopunderOpen(false);
              setPendingCallAccountNumber("");
              setCallPopunderMode("controls");
              setIsLeftRailOpen(true);
              navigate("/activity");
              setCopilotPopunderPosition(getAnchoredCopilotPopunderPosition());
              setIsCopilotPopoverOpen(true);
              callConnectTimeoutRef.current = null;
            }, 2000);
          }}
          onEndCall={() => openCallDisposition()}
          onCancelDisposition={() => {
            if (callConnectTimeoutRef.current !== null) {
              window.clearTimeout(callConnectTimeoutRef.current);
              callConnectTimeoutRef.current = null;
            }
            setIsCallPopunderOpen(false);
            setCallPopunderMode("setup");
          }}
          onSelectDisposition={(disposition) => {
            const dispositionTimestamp = new Date();
            const formattedDispositionTimestamp = formatRecentInteractionTimestamp(dispositionTimestamp);
            setRecentInteractions((current) => [
              {
                id: Date.now(),
                direction: "outbound",
                type: "voice",
                createdAt: formattedDispositionTimestamp,
                status: disposition,
                customerName: selectedAssignment.name,
                customerId: selectedAssignment.customerId,
                channel: "Outbound Voice - Agent Workspace",
                statusColor: getDispositionStatusColor(disposition),
              },
              ...current,
            ]);
            if (activeCallAssignmentId) {
              setAssignmentStatusesById((currentStatuses) => ({
                ...currentStatuses,
                [activeCallAssignmentId]: getRecentInteractionAssignmentStatus(disposition),
              }));
              setAssignmentItemsById((currentItems) => {
                const activeCallAssignment = currentItems[activeCallAssignmentId];

                if (!activeCallAssignment) {
                  return currentItems;
                }

                return {
                  ...currentItems,
                  [activeCallAssignmentId]: {
                    ...activeCallAssignment,
                    preview: `Call ended · ${disposition}.`,
                    lastUpdated: formattedDispositionTimestamp,
                    updatedAt: dispositionTimestamp.toISOString(),
                  },
                };
              });
            }
            setActiveCallAssignmentId(null);
            layoutContextValue.endCallStatus();
            if (callConnectTimeoutRef.current !== null) {
              window.clearTimeout(callConnectTimeoutRef.current);
              callConnectTimeoutRef.current = null;
            }
            setIsCallPopunderOpen(false);
            setCallPopunderMode("setup");
            setCustomerInfoTakeoverCard(null);
            setIsTakeoverInfoOpen(false);
          }}
          onInteractStart={() => bringFloatingPanelToFront("call")}
        />
      )}

      {/* ConnectedAppsPopover is now rendered inline as a flyout submenu in the status dropdown */}

      {notificationsPresence.mounted && (
        <NotificationsPopoverContent
          visible={notificationsPresence.visible}
          position={notificationsPopunderPosition}
          size={notificationsPopunderSize}
          zIndex={getFloatingPanelZIndex("notifications")}
          onPositionChange={setNotificationsPopunderPosition}
          onSizeChange={setNotificationsPopunderSize}
          onClose={() => setIsNotificationsPopoverOpen(false)}
          onInteractStart={() => bringFloatingPanelToFront("notifications")}
          onUnreadCountChange={setNotificationCount}
          initialNotifications={notificationsData}
        />
      )}

      <NotificationStack
        assignmentItems={[]}
        chatItems={incomingChatNotifications}
        onMonitor={monitorIncomingAssignment}
        onTakeover={takeoverIncomingAssignment}
        onTransfer={transferIncomingAssignment}
        onDismiss={(item) => {
          removeIncoming(item.id);
          // If an action was taken on this notification, show the dismissal confirmation toast
          if (actedOnNotifications.has(item.customerRecordId)) {
            const sa = staticAssignments.find(
              (s) => s.customerRecordId === item.customerRecordId || s.customerId === item.customerId,
            );
            setDismissalToast({
              customerName: item.name,
              customerId: item.customerId ?? "",
              status: "dismissed",
              resolvedStatus: "Resolved",
              actions: sa?.aiOverview?.actions ?? [],
              preview: item.preview ?? "",
              botType: item.label ?? "Aria",
              channel: item.channel,
            });
            setActedOnNotifications((prev) => { const next = new Set(prev); next.delete(item.customerRecordId); return next; });
          }
        }}
        onApprove={approveIncomingAssignment}
        onApproveResolved={resolveIncomingByApprove}
        onDismissResolved={(item) => {
          const sa = staticAssignments.find(
            (s) => s.customerRecordId === item.customerRecordId || s.customerId === item.customerId,
          );
          setDismissalToast({
            customerName: item.name,
            customerId: item.customerId ?? "",
            status: "dismissed",
            resolvedStatus: "Resolved",
            actions: sa?.aiOverview?.actions ?? [],
            preview: item.preview ?? "",
            botType: item.label ?? "Aria",
            channel: item.channel,
          });
        }}
        onLaunchCall={(item) => {
          markActedOn(item.customerRecordId);
          if (item.statusLabel === "lead") {
            launchLeadCall(item);
          } else {
            layoutContextValue.toggleCallPopunder(null, item.customerRecordId);
            removeIncoming(item.id);
          }
        }}
        onReviewLead={(item) => {
          markActedOn(item.customerRecordId);
          // Dismiss the toast
          removeIncoming(item.id);
          // Dismiss the Home tab lead alert
          if (item.customerRecordId) layoutContextValue.dismissLeadNotification(item.customerRecordId);
          // Push a "transferred" toast so the customer info panel auto-opens
          layoutContextValue.pushTransferredToast({
            name: item.name,
            customerRecordId: item.customerRecordId,
            customerId: item.customerId,
            channel: item.channel as AssignmentChannel,
            label: item.label,
            priority: item.priority,
            preview: item.preview,
          });
          // Accept the case in history-only mode (no channel tabs, Customer History active)
          layoutContextValue.acceptIssue({
            id: item.id,
            name: item.name,
            customerId: item.customerId ?? "",
            customerRecordId: item.customerRecordId,
            channel: item.channel as AssignmentChannel,
            priority: item.priority,
            preview: item.preview,
            status: "pending" as QueueAssignmentStatus,
            waitTime: item.time ?? "0m",
            openAsHistoryOnly: true,
            onCreated: (assignmentId) => {
              const sa = staticAssignments.find((s) => s.customerRecordId === item.customerRecordId);
              if (sa) acceptedStaticsStore.set(sa.id, assignmentId);
            },
          });
        }}
        launchingAssignmentId={launchingLeadId}
        onChatOpen={openChatNotification}
        onChatDismiss={dismissChatNotification}
      />


      {/* Global escalated case modal — renders on any page without navigating away */}
      {escalatedToastModal && (
        <EscalatedCaseModal
          caseData={escalatedToastModal}
          onTakeover={(conversation, localStatus, localPriority) => {
            // Find the static assignment so acceptedStaticsStore stays in sync
            const sa = staticAssignments.find(
              (s) => s.customerRecordId === escalatedToastModal.customerRecordId || s.customerId === escalatedToastModal.customerId,
            );
            // Dismiss the toast and clear the escalated badge — agent has taken over
            if (escalatedToastModal.customerRecordId) dismissIncomingByCustomer(escalatedToastModal.customerRecordId);
            else removeIncoming(escalatedToastModal.id);
            setEscalatedRailCount((n) => Math.max(0, n - 1));
            // Remove from ControlPanelPage queue on next render — use static ID so the filter matches
            pendingQueueRejections.add(sa?.id ?? escalatedToastModal.id);
            setEscalatedToastModal(null);
            // Always show the handoff toast — use the cached item if available (preserves
            // all icon/badge fields), otherwise reconstruct from the modal data + static assignment.
            const cachedItem = pendingTransferItemRef.current;
            if (cachedItem?.customerRecordId === escalatedToastModal.customerRecordId) {
              pushTransferredToast(cachedItem);
              pendingTransferItemRef.current = null;
            } else {
              // Reconstruct a minimal QueuePreviewItem from what we have
              pushTransferredToast({
                id: escalatedToastModal.id,
                name: escalatedToastModal.name,
                customerId: escalatedToastModal.customerId,
                customerRecordId: escalatedToastModal.customerRecordId ?? "",
                channel: escalatedToastModal.channel as AssignmentChannel,
                label: escalatedToastModal.botType ?? "Service Bot",
                priority: escalatedToastModal.priority,
                preview: escalatedToastModal.preview,
              });
            }
            // Build the takeover conversation. Pass the modal's conversation through
            // so buildTakeoverConversation uses it as the authoritative message source
            // (preserving any injected messages from the guided review) rather than
            // rebuilding from the seed.
            const modalBotAuthor = escalatedToastModal.botType ?? "Aria";
            const customerRecordId = escalatedToastModal.customerRecordId;
            const takeoverConversation = customerRecordId
              ? buildTakeoverConversation({
                  customerRecordId,
                  customerName: escalatedToastModal.name,
                  botType: modalBotAuthor,
                  channel: (escalatedToastModal.channel === "sms" ? "sms" : "chat") as "chat" | "sms",
                  aiWhyNeeded: escalatedToastModal.aiOverview?.whyNeeded ?? sa?.aiOverview?.whyNeeded ?? null,
                  modalConversation: conversation ?? null,
                })
              : conversation;
            // Write to the module-level store so Layout reads it in acceptIssue / setConversationStateForAssignment
            if (customerRecordId) pendingHandoffConversations.set(customerRecordId, takeoverConversation as SharedConversationData);
            // Call acceptIssue directly — ONE navigation to /activity for a clean fade-in
            acceptIssue({
              id: escalatedToastModal.id,
              name: escalatedToastModal.name,
              customerId: escalatedToastModal.customerId,
              customerRecordId: escalatedToastModal.customerRecordId ?? undefined,
              channel: escalatedToastModal.channel as AssignmentChannel,
              priority: localPriority as import("@/lib/static-assignments").Priority,
              preview: escalatedToastModal.preview,
              status: localStatus as QueueAssignmentStatus,
              waitTime: escalatedToastModal.waitTime,
              initialConversation: takeoverConversation,
              onCreated: sa
                ? (assignmentId) => { acceptedStaticsStore.set(sa.id, assignmentId); }
                : undefined,
            });
          }}
          onSupervise={() => {
            // Monitor behaves like Takeover for now — dismiss toast and clear badge
            if (escalatedToastModal.customerRecordId) dismissIncomingByCustomer(escalatedToastModal.customerRecordId);
            else removeIncoming(escalatedToastModal.id);
            setEscalatedRailCount((n) => Math.max(0, n - 1));
            pendingQueueRejections.add(escalatedToastModal.id);
            setEscalatedToastModal(null);
            const sa = staticAssignments.find(
              (s) => s.customerRecordId === escalatedToastModal.customerRecordId || s.customerId === escalatedToastModal.customerId,
            );
            // Use the shared buildTakeoverConversation — identical to onTakeover path above.
            const superviseBotAuthor = escalatedToastModal.botType ?? "Aria";
            const superviseCustomerRecordId = escalatedToastModal.customerRecordId;
            const superviseConversation = superviseCustomerRecordId
              ? buildTakeoverConversation({
                  customerRecordId: superviseCustomerRecordId,
                  customerName: escalatedToastModal.name,
                  botType: superviseBotAuthor,
                  channel: (escalatedToastModal.channel === "sms" ? "sms" : "chat") as "chat" | "sms",
                  aiWhyNeeded: escalatedToastModal.aiOverview?.whyNeeded ?? sa?.aiOverview?.whyNeeded ?? null,
                })
              : undefined;
            if (superviseCustomerRecordId && superviseConversation) {
              pendingHandoffConversations.set(superviseCustomerRecordId, superviseConversation);
            }
            acceptIssue({
              id: escalatedToastModal.id,
              name: escalatedToastModal.name,
              customerId: escalatedToastModal.customerId,
              customerRecordId: escalatedToastModal.customerRecordId ?? undefined,
              channel: escalatedToastModal.channel as AssignmentChannel,
              priority: escalatedToastModal.priority,
              preview: escalatedToastModal.preview,
              status: escalatedToastModal.status as QueueAssignmentStatus,
              waitTime: escalatedToastModal.waitTime,
              initialConversation: superviseConversation,
              onCreated: sa
                ? (assignmentId) => { acceptedStaticsStore.set(sa.id, assignmentId); }
                : undefined,
            });
          }}
          onTransfer={() => {
            // Dismiss the toast and clear the escalated badge — case is fully handed off
            if (escalatedToastModal.customerRecordId) dismissIncomingByCustomer(escalatedToastModal.customerRecordId);
            else removeIncoming(escalatedToastModal.id);
            setEscalatedRailCount((n) => Math.max(0, n - 1));
            pendingQueueRejections.add(escalatedToastModal.id);
            setEscalatedToastModal(null);
          }}
          onResolve={() => {
            // Queue the resolved ID so ControlPanelPage updates its list on next render.
            // Use the static assignment ID (not the toast notification ID) so escalatedOverrides clears correctly.
            const sa = staticAssignments.find(
              (s) => s.customerRecordId === escalatedToastModal.customerRecordId || s.customerId === escalatedToastModal.customerId,
            );
            pendingResolvedIds.add(sa?.id ?? escalatedToastModal.id);
            setEscalatedRailCount((n) => Math.max(0, n - 1));
            if (escalatedToastModal.customerRecordId === "jordan") setIsJordanResolved(true);
            if (escalatedToastModal.customerRecordId === "marcus") setIsMarcusResolved(true);
            if (escalatedToastModal.customerRecordId) dismissIncomingByCustomer(escalatedToastModal.customerRecordId);
          }}
          onClose={() => setEscalatedToastModal(null)}
          onDismissed={(summary) => setDismissalToast(summary)}
        />
      )}

      {/* Dismissal confirmation toast */}
      {dismissalToast && (
        <DismissalToast
          data={dismissalToast}
          onClose={() => setDismissalToast(null)}
        />
      )}

      {isAddNewFlowOpen && addNewFlowAnchorRect && (
        <AddNewAssignmentFlowPopover
          anchorRect={addNewFlowAnchorRect}
          onClose={() => setIsAddNewFlowOpen(false)}
          onOpenCustomerConversation={(customerRecordId, channel) => {
            openCustomerConversation(customerRecordId, channel);
            navigate("/activity");
          }}
          onOpenCall={(customerRecordId) => {
            layoutContextValue.toggleCallPopunder(null, customerRecordId);
            navigate("/activity");
          }}
        />
      )}

      {chatPresence.mounted && (
        <ChatPopoverContent
          visible={chatPresence.visible}
          position={chatPopunderPosition}
          size={chatPopunderSize}
          zIndex={getFloatingPanelZIndex("chat")}
          onPositionChange={setChatPopunderPosition}
          onSizeChange={setChatPopunderSize}
          onClose={() => { setIsChatPopoverOpen(false); setChatInitialConversationId(undefined); setChatPendingAgent(null); setChatAutoStartCall(false); }}
          onInteractStart={() => bringFloatingPanelToFront("chat")}
          onUnreadCountChange={setChatUnreadCount}
          initialConversationId={chatInitialConversationId}
          pendingAgent={chatPendingAgent}
          autoStartCall={chatAutoStartCall}
          onPendingAgentConsumed={() => { setChatPendingAgent(null); setChatAutoStartCall(false); }}
        />
      )}


      {addNewPresence.mounted && (
        <AddNewPopoverContent
          visible={addNewPresence.visible}
          position={addNewPopunderPosition}
          size={addNewPopunderSize}
          zIndex={getFloatingPanelZIndex("addNew")}
          onPositionChange={setAddNewPopunderPosition}
          onSizeChange={setAddNewPopunderSize}
          onClose={() => setIsAddNewPopoverOpen(false)}
          onInteractStart={() => bringFloatingPanelToFront("addNew")}
        />
      )}

      {/* ── Login Briefing Modal ─────────────────────────────────────────── */}
      {showLoginBriefing && (
        <div className={cn(
          "fixed inset-0 z-[9999] flex items-center justify-center bg-white/60 dark:bg-black/60 backdrop-blur-[3px] transition-opacity duration-280",
          briefingClosing ? "opacity-0" : "animate-in fade-in duration-200",
        )}>
          <div className={cn(
            "w-[400px] rounded-2xl border border-black/[0.08] bg-white shadow-[0_8px_32px_rgba(0,0,0,0.10),0_2px_8px_rgba(0,0,0,0.06)] transition-all duration-280",
            briefingClosing
              ? "opacity-0 scale-95 translate-y-2"
              : "animate-in fade-in zoom-in-95 slide-in-from-bottom-3 duration-300",
          )}>

            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-[#F2F4F7] dark:border-border">
              <div className="flex items-center gap-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M23.7188 5.89062C23.8757 5.89077 24.0015 6.01655 24 6.17188C23.8494 15.8941 15.9182 23.7747 6.13379 23.9238C5.97839 23.9255 5.85077 23.7999 5.85059 23.6445V19.3848C5.85059 19.2325 5.97502 19.1097 6.12891 19.1064C13.2448 18.9606 19.0048 13.236 19.1523 6.16602C19.1556 6.01217 19.2788 5.88872 19.4326 5.88867L23.7188 5.89062ZM12.2559 0.0771484C13.8714 0.0772122 15.1804 1.37836 15.1807 2.98242C15.1807 4.58668 13.8716 5.88861 12.2559 5.88867C10.6401 5.88867 9.33008 4.58672 9.33008 2.98242C9.33031 1.37832 10.6402 0.0771484 12.2559 0.0771484ZM2.92578 0.0761719C4.5412 0.0763851 5.85033 1.3775 5.85059 2.98145C5.85059 4.58561 4.54135 5.88748 2.92578 5.8877C1.31003 5.8877 0 4.58574 0 2.98145C0.000253194 1.37736 1.31018 0.0761719 2.92578 0.0761719Z" fill="#2196F3"/>
                </svg>
                <div>
                  <p className="text-[15px] font-semibold text-[#101828] dark:text-[#E2E8F0]">Good morning, Jeff</p>
                  <p className="text-[12px] text-[#667085] dark:text-[#8898AB]">Here's what's waiting for you today</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="px-6 pt-4 pb-3 space-y-3">
              {/* Escalated Cases */}
              <div className="flex items-center justify-between rounded-xl border border-[#FECACA]/60 dark:border-[#7F1D1D]/60 bg-[#FEF2F2] dark:bg-[#2A0A0A] px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FEE2E2] dark:bg-[#450A0A]">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  </div>
                  <span className="text-[13px] font-medium text-[#991B1B] dark:text-[#FCA5A5]">Escalated Cases</span>
                </div>
                <span className="rounded-full bg-[#EF4444] px-2.5 py-0.5 text-[12px] font-semibold text-white">{queuePreviewItems.filter(i => i.statusLabel === "Escalated").length}</span>
              </div>

              {/* Pending Cases */}
              <div className="flex items-center justify-between rounded-xl border border-[#E4E7EC] dark:border-[#2A3448] bg-[#F9FAFB] dark:bg-[#1C2A3A] px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F2F4F7] dark:bg-[#1C2A3A]">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#667085" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                  </div>
                  <span className="text-[13px] font-medium text-[#344054] dark:text-[#CBD5E1]">Pending Cases</span>
                </div>
                <span className="rounded-full bg-[#475467] px-2.5 py-0.5 text-[12px] font-semibold text-white">{staticAssignments.filter(a => a.status === "pending" && a.channel !== "email").length}</span>
              </div>
            </div>

            {/* Trend Detection carousel */}
            {(() => {
              const trendSlides = [
                "Login failure rates are up 18% compared to yesterday. Most failures are occurring between 08:00–10:00. Consider pre-emptively routing authentication cases to your fastest agents during this window.",
                "Average handle time for billing cases has dropped by 22 seconds this week. Your team is resolving payment disputes faster — keep reinforcing the current approach.",
                "3 cases have been waiting over 45 minutes without agent contact. Prioritise these immediately to avoid SLA breaches and escalation risk.",
                "Customer satisfaction scores for chat interactions are trending 8% higher than voice this month. Consider channel-routing lower-complexity cases to chat where possible.",
                "Peak case volume typically hits between 11:00–13:00. Ensure full agent coverage during this window to prevent queue build-up.",
              ];
              return (
                <div className="mx-6 mb-4 rounded-xl border border-[#E4E7EC] dark:border-[#2A3448] bg-white dark:bg-[#0F1629] p-4">
                  <div className="mb-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#98A2B3] dark:text-[#64748B]">Trend Detection</p>
                  </div>
                  <p className="text-[12px] leading-[1.65] text-[#344054] dark:text-[#CBD5E1] min-h-[72px]">
                    {trendSlides[trendSlide]}
                  </p>
                  {/* Pagination dots */}
                  <div className="flex items-center gap-1.5 mt-3">
                    {trendSlides.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setTrendSlide(i)}
                        className={cn(
                          "rounded-full transition-all duration-200",
                          i === trendSlide ? "h-1.5 w-5 bg-[#166CCA]" : "h-1.5 w-1.5 bg-[#D0D5DD] dark:bg-[#2A3448] hover:bg-[#BFDBFE]"
                        )}
                      />
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Actions */}
            <div className="flex gap-2.5 px-6 pb-6">
              <button
                type="button"
                onClick={() => closeBriefing(() => {
                  setStatus("Available");
                  setStatusStartedAt(Date.now());
                })}
                className="flex-1 rounded-xl bg-[#166CCA] py-2.5 text-[14px] font-semibold text-white shadow-[0_1px_3px_rgba(22,108,202,0.20)] hover:bg-[#1260B0] active:bg-[#0D4F9A] transition-colors"
              >
                Go Available
              </button>
              <button
                type="button"
                onClick={() => closeBriefing()}
                className="flex-1 rounded-xl border border-[#D0D5DD] dark:border-[#2A3448] bg-white dark:bg-[#1C2A3A] py-2.5 text-[14px] font-semibold text-[#344054] dark:text-[#CBD5E1] hover:bg-[#F9FAFB] dark:hover:bg-[#243041] active:bg-[#F2F4F7] transition-colors"
              >
                Start Offline
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
    </LayoutContext.Provider>
  );
}
