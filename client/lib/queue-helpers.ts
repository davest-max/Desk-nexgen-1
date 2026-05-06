// Queue data and helper functions
import {
  MessageCircle,
  MessageSquare,
  Mail,
  Phone,
  ClipboardList,
} from "lucide-react";
import type { RecentInteractionItem } from "@/components/RecentInteractionsPanel";
import type {
  QueuePreviewItem,
  QueueAssignmentStatus,
  AssignmentChannel,
} from "@/components/layout-context";
import type { CustomerQueueIcon, CustomerChannel } from "@/lib/customer-database";
import { customerDatabase, defaultCustomerId, createConversationState } from "@/lib/customer-database";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { formatRecentInteractionTimestamp } from "./layout-constants";
import type { GroupedQueueItem } from "./layout-constants";

// ─── Queue Maps and Data ────────────────────────────────────────────────

export const queueIconMap: Record<CustomerQueueIcon, typeof Phone> = {
  phone: Phone,
  clipboardList: ClipboardList,
  messageSquare: MessageSquare,
};

export const launchedAssignmentIconMap: Record<AssignmentChannel, React.ElementType> = {
  chat: MessageCircle,
  sms: MessageSquare,
  email: Mail,
  voice: Phone,
  whatsapp: WhatsAppIcon,
};

export const baseAssignmentChannelByCustomerRecordId: Partial<Record<string, AssignmentChannel>> = {
  olivia: "chat",
};

export const randomIncomingChannels: AssignmentChannel[] = ["sms", "email", "whatsapp", "chat", "whatsapp", "sms", "email", "whatsapp"];

export const queuePreviewItems: QueuePreviewItem[] = customerDatabase.map((customer, index) => {
  const assignmentChannel =
    baseAssignmentChannelByCustomerRecordId[customer.id] ??
    randomIncomingChannels[index % randomIncomingChannels.length];

  return {
    id: customer.id,
    customerRecordId: customer.id,
    channel: assignmentChannel,
    initials: customer.initials,
    name: customer.name,
    customerId: customer.customerId,
    lastUpdated: customer.lastUpdated,
    time: customer.queue.time,
    preview: customer.queue.preview,
    priority: customer.queue.priority,
    priorityClassName: customer.queue.priorityClassName,
    badgeColor: customer.queue.badgeColor,
    icon: launchedAssignmentIconMap[assignmentChannel],
    isActive: customer.queue.isActive,
    createdAt: customer.queue.createdAt,
    updatedAt: customer.queue.updatedAt,
  };
});

export const queuePreviewItemsByCustomerRecordId = Object.fromEntries(
  queuePreviewItems.map((item) => [item.customerRecordId, item]),
) as Record<string, QueuePreviewItem>;

export const priorityRankMap: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export const priorityClassNameMap: Record<string, string> = {
  critical: "border-[#E53935] bg-[#FDEAEA] text-[#C71D1A]",
  high:     "border-[#FFB800] bg-[#FFF6E0] text-[#A37A00]",
  medium:   "border-[#BFDBFE] bg-[#EBF4FD] text-[#166CCA]",
  low:      "border-[#24943E] bg-[#EFFBF1] text-[#208337]",
};

export const priorityBadgeColorMap: Record<string, string> = {
  critical: "bg-[#E32926]",
  high:     "bg-[#FFB800]",
  medium:   "bg-[#166CCA]",
  low:      "bg-[#208337]",
};

export const priorityDotClassNameMap: Record<string, string> = {
  critical: "bg-[#E32926]",
  high: "bg-[#FFB800]",
  medium: "bg-[#166CCA]",
  low: "bg-[#208337]",
};

export const priorityIconClassNameMap: Record<string, string> = {
  critical: "text-[#E32926]",
  high: "text-[#FFB800]",
  medium: "text-[#166CCA]",
  low: "text-[#208337]",
};

// ─── Visible Assignments ───────────────────────────────────────────────

const visibleAssignmentNames = new Set([
  "Noah Patel",
  "Olivia Reed",
  "Ethan Zhang",
]);

export const initialVisibleAssignments = queuePreviewItems.filter((item) => visibleAssignmentNames.has(item.name));
export const initialVisibleAssignmentIds = initialVisibleAssignments.map((item) => item.id);
export const initialSelectedAssignment =
  initialVisibleAssignments.find((item) => item.name === "Noah Patel") ??
  initialVisibleAssignments[0] ??
  queuePreviewItemsByCustomerRecordId[defaultCustomerId] ??
  queuePreviewItems[0];
export const initialSelectedAssignmentId = initialSelectedAssignment.id;

// ─── Queue Helper Functions ────────────────────────────────────────────

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

// ─── Assignment Creation Functions ─────────────────────────────────────

export function getLaunchedAssignmentPreview(channel: AssignmentChannel) {
  if (channel === "voice") {
    return "Live call in progress.";
  }

  return `New ${channel.toUpperCase()} conversation started.`;
}

export function createLaunchedAssignment(customerRecordId: string, channel: AssignmentChannel, existingAssignment?: QueuePreviewItem): QueuePreviewItem {
  const baseAssignment = queuePreviewItemsByCustomerRecordId[customerRecordId] ?? existingAssignment ?? queuePreviewItems[0];
  const timestamp = new Date();
  const isoTimestamp = timestamp.toISOString();

  return {
    ...baseAssignment,
    id: `${customerRecordId}-${channel}-${timestamp.getTime()}`,
    customerRecordId: customerRecordId,
    channel,
    icon: launchedAssignmentIconMap[channel],
    isActive: false,
    time: "Now",
    lastUpdated: formatRecentInteractionTimestamp(timestamp),
    preview: getLaunchedAssignmentPreview(channel),
    createdAt: isoTimestamp,
    updatedAt: isoTimestamp,
  };
}

export function getRecentInteractionAssignmentStatus(status: string): QueueAssignmentStatus {
  const normalizedStatus = status.trim().toLowerCase();

  if (normalizedStatus === "resolved") {
    return "resolved";
  }

  if (normalizedStatus === "pending") {
    return "pending";
  }

  if (normalizedStatus === "escalated") {
    return "escalated";
  }

  return "open";
}

export function getAssignmentChannelFromRecentInteractionType(type: RecentInteractionItem["type"]): AssignmentChannel {
  if (type === "email") {
    return "email";
  }

  if (type === "voice") {
    return "voice";
  }

  if (type === "ai-agent") {
    return "chat";
  }

  return "sms";
}

export function formatRecentInteractionAssignmentTime(createdAt: string) {
  const timeParts = createdAt.trim().split(" ");

  return timeParts.slice(-2).join(" ") || createdAt;
}

export function createRecentInteractionAssignment(
  interaction: RecentInteractionItem,
  customerRecordId: string,
): QueuePreviewItem {
  const baseAssignment = queuePreviewItemsByCustomerRecordId[customerRecordId] ?? queuePreviewItems[0];
  const channel = getAssignmentChannelFromRecentInteractionType(interaction.type);
  const directionLabel = interaction.direction === "inbound" ? "Inbound" : "Outbound";

  return {
    ...baseAssignment,
    id: `recent-interaction-${customerRecordId}-${interaction.id}`,
    customerRecordId: baseAssignment.customerRecordId,
    channel,
    icon: launchedAssignmentIconMap[channel],
    isActive: false,
    time: formatRecentInteractionAssignmentTime(interaction.createdAt),
    lastUpdated: interaction.createdAt,
    preview: `${directionLabel} · ${interaction.channel}`,
    createdAt: interaction.createdAt,
    updatedAt: interaction.createdAt,
  };
}

export function groupQueueItems(items: QueuePreviewItem[], selectedAssignmentId: string): GroupedQueueItem[] {
  const orderMap = new Map<string, number>();
  const groupMap = new Map<string, QueuePreviewItem[]>();

  for (const item of items) {
    if (!groupMap.has(item.customerRecordId)) {
      orderMap.set(item.customerRecordId, orderMap.size);
      groupMap.set(item.customerRecordId, []);
    }
    groupMap.get(item.customerRecordId)!.push(item);
  }

  return [...orderMap.entries()]
    .sort(([, a], [, b]) => a - b)
    .map(([customerRecordId]) => {
      const channels = groupMap.get(customerRecordId)!;
      const sortedChannels = [...channels].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
      const isAnyActive = channels.some((c) => c.id === selectedAssignmentId || c.isActive);
      const lastActiveChannel =
        sortedChannels.find((c) => c.id === selectedAssignmentId) ??
        [...channels].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
      const highestPriority = [...channels].sort(
        (a, b) =>
          (priorityRankMap[a.priority.toLowerCase()] ?? Number.MAX_SAFE_INTEGER) -
          (priorityRankMap[b.priority.toLowerCase()] ?? Number.MAX_SAFE_INTEGER),
      )[0];

      return {
        customerRecordId,
        name: channels[0].name,
        initials: channels[0].initials,
        channels: sortedChannels,
        lastActiveChannel,
        isAnyActive,
        priority: highestPriority.priority,
        priorityClassName: highestPriority.priorityClassName,
        badgeColor: highestPriority.badgeColor,
      };
    });
}
