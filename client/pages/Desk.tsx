import { Bell, ChevronDown, GripHorizontal, Mail, MessageSquare, Phone, X } from "lucide-react";
import { useLocation } from "react-router-dom";

import AddPanelContent from "@/components/AddPanelContent";
import { Button } from "@/components/ui/button";
import { CopilotContent } from "@/components/CopilotPopunder";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLayoutContext } from "@/components/layout-context";
import DeskDataTable from "@/components/DeskDataTable";
import NotesPanel from "@/components/NotesPanel";

import Placeholder from "./Placeholder";

export default function Desk() {
  const location = useLocation();
  const {
    closeAppSpacePanel,
    selectedAssignment,
    undockDeskPanel,
    toggleCallPopunder,
    isAgentInCall,
    isAgentAvailable,
    openCustomerConversation,
  } = useLayoutContext();
  const view = new URLSearchParams(location.search).get("view");
  const isCopilotView = view === "copilot";
  const isNotesView = view === "notes";
  const isAddView = view === "add";
  const isCustomerView = view === "customer";
  const isNotificationsView = view === "notifications";
  const panelLabel = isCopilotView
    ? "AI Assistant"
    : isNotesView
      ? "Notes"
      : isAddView
        ? "Add"
        : isCustomerView
          ? "Customer Information"
          : isNotificationsView
            ? "Notifications"
            : "Directory";
  const panelView = isCopilotView
    ? "copilot"
    : isNotesView
      ? "notes"
      : isAddView
        ? "add"
        : isCustomerView
          ? "customer"
          : isNotificationsView
            ? "notifications"
            : "desk";

  const handleOpenChannel = (channel: "sms" | "email") => {
    openCustomerConversation(selectedAssignment.customerRecordId, channel);
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div
        data-desk-panel-header
        className="flex min-h-[68px] items-center justify-between gap-3 border-b border-border bg-background/50 px-5 py-4"
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label={`Undock ${panelLabel} panel`}
            onMouseDown={(event) => undockDeskPanel(panelView, event)}
            className="flex h-6 w-6 flex-shrink-0 cursor-grab items-center justify-center rounded-full text-[#7A7A7A] transition-colors hover:bg-white hover:text-[#333333] active:cursor-grabbing"
          >
            <GripHorizontal className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold tracking-tight text-[#333333]">{panelLabel}</h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isCustomerView ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onMouseDown={(event) => event.stopPropagation()}
                  className="h-8 rounded-full border-black/10 px-3 text-[#333333]"
                >
                  Contact <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-44 rounded-2xl border border-black/10 bg-white p-1 shadow-[0_18px_50px_rgba(15,23,42,0.14)]"
              >
                <DropdownMenuItem
                  onClick={(event) => toggleCallPopunder(event.currentTarget.getBoundingClientRect(), selectedAssignment.customerRecordId)}
                  disabled={isAgentInCall || !isAgentAvailable}
                  className="rounded-xl px-3 py-2 text-sm text-[#111827]"
                >
                  <Phone className="mr-2 h-4 w-4" />
                  Call
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleOpenChannel("email")}
                  className="rounded-xl px-3 py-2 text-sm text-[#111827]"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Email
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleOpenChannel("sms")}
                  className="rounded-xl px-3 py-2 text-sm text-[#111827]"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  SMS
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
          <button
            type="button"
            aria-label={`Close ${panelLabel} container`}
            onMouseDown={(event) => event.stopPropagation()}
            onClick={closeAppSpacePanel}
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[#7A7A7A] transition-colors hover:bg-white hover:text-[#333333]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isCopilotView
        ? <CopilotContent />
        : isNotesView
          ? <NotesPanel notesOnly />
          : isAddView
            ? <AddPanelContent />
            : isCustomerView
              ? <NotesPanel key={selectedAssignment.customerRecordId} customerId={selectedAssignment.customerRecordId} />
              : isNotificationsView
                ? (
                  <Placeholder
                    title="Notifications"
                    description="Review alerts, workflow updates, and queue notices alongside the current conversation."
                    icon={Bell}
                  />
                )
                : <DeskDataTable />}
    </div>
  );
}
