import type { CustomerChannel } from "@/lib/customer-database";
import type { CustomerTicket } from "./ticket-data";

export type ConversationMessage = {
  id: number;
  role: "customer" | "agent";
  content: string;
  time: string;
  channel?: CustomerChannel;
  sentiment?: "frustrated" | "critical" | "positive";
  isInternal?: boolean;
  ticket?: CustomerTicket;
  /**
   * When set, identifies the bot (e.g. "Jacob", "Aria", "Emily") that originally sent
   * this message before a human agent took over. The bot's avatar is shown instead of
   * the human agent's avatar.
   */
  author?: string;
  /**
   * When true, renders as the green "handoff notice" card (internal agent-only notification
   * that the assignment has been transferred). Treated as internal — not visible to customer.
   */
  isHandoffCard?: boolean;
  /**
   * When true, this message is part of the agent handoff sequence (warm farewell + internal
   * context card) and should be hidden while the case is in review/pending-acceptance mode.
   */
  isHandoffMessage?: boolean;
};

export type ConversationStatus = "open" | "pending";

export type SharedConversationData = {
  customerName: string;
  label: string;
  timelineLabel: string;
  status: ConversationStatus;
  draft: string;
  messages: ConversationMessage[];
  isCustomerTyping?: boolean;
};

export type InlineSuggestion = {
  summary: string;
  suggestedReply: string;
};

export type SuggestionAction = {
  id: string;
  label: string;
  initialTab?: string;
  ticketId?: string;
  ticket?: CustomerTicket;
};

export type AgentTask = {
  id: string;
  label: string;
};
