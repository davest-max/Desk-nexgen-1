import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight, GripVertical, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  CustomerTicket,
  INITIAL_TICKET_COLUMN_ORDER,
  INITIAL_TICKET_COLUMN_WIDTHS,
  type TicketColumnKey,
  reorderTicketColumns,
  getPriorityTone,
  getStatusBadgeClasses,
} from "@/lib/ticket-data";
import type { TicketColumn } from "@/lib/ticket-data";

const TICKET_PAGE_SIZE = 6;

// Create TICKET_COLUMNS with renderCell functions (requires JSX/React)
const TICKET_COLUMNS: TicketColumn[] = [
  {
    key: "priority",
    label: "Priority",
    minWidth: 120,
    defaultWidth: 140,
    renderCell: (ticket) => (
      <div className="flex items-center gap-2 whitespace-nowrap">
        <span className={cn("h-2.5 w-2.5 rounded-full", getPriorityTone(ticket.priority))} />
        <span className="font-medium text-[#344054]">{ticket.priority}</span>
      </div>
    ),
  },
  {
    key: "id",
    label: "Ticket Full Number",
    minWidth: 150,
    defaultWidth: 180,
    renderCell: (ticket) => <span className="block truncate font-medium text-[#344054]">{ticket.id}</span>,
  },
  {
    key: "type",
    label: "Type",
    minWidth: 120,
    defaultWidth: 140,
    renderCell: (ticket) => <span className="block truncate text-[#475467]">{ticket.type}</span>,
  },
  {
    key: "subject",
    label: "Subject",
    minWidth: 280,
    defaultWidth: 360,
    renderCell: (ticket) => <span className="block truncate text-[#101828]">{ticket.subject}</span>,
  },
  {
    key: "status",
    label: "Status",
    minWidth: 180,
    defaultWidth: 190,
    renderCell: (ticket) => (
      <button
        type="button"
        className={cn(
          "inline-flex max-w-full items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium shadow-sm",
          getStatusBadgeClasses(ticket.status),
        )}
      >
        <span className="truncate">{ticket.status}</span>
      </button>
    ),
  },
  {
    key: "agent",
    label: "Agent",
    minWidth: 150,
    defaultWidth: 170,
    renderCell: (ticket) => <span className="block truncate text-[#475467]">{ticket.agent}</span>,
  },
  {
    key: "agentTeam",
    label: "Agent Team",
    minWidth: 170,
    defaultWidth: 190,
    renderCell: (ticket) => <span className="block truncate text-[#475467]">{ticket.agentTeam}</span>,
  },
  {
    key: "modifiedBy",
    label: "Modified By",
    minWidth: 160,
    defaultWidth: 180,
    renderCell: (ticket) => <span className="block truncate text-[#475467]">{ticket.modifiedBy}</span>,
  },
];

const TICKET_COLUMN_MAP = Object.fromEntries(TICKET_COLUMNS.map((column) => [column.key, column])) as Record<
  TicketColumnKey,
  TicketColumn
>;

export function TicketsDataGrid({ tickets = [], onOpenTicket }: { tickets?: CustomerTicket[]; onOpenTicket: (ticket: CustomerTicket) => void }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [columnOrder, setColumnOrder] = useState<TicketColumnKey[]>(() => [...INITIAL_TICKET_COLUMN_ORDER]);
  const [columnWidths, setColumnWidths] = useState<Record<TicketColumnKey, number>>(() => ({ ...INITIAL_TICKET_COLUMN_WIDTHS }));
  const draggingColumnRef = useRef<TicketColumnKey | null>(null);
  const resizeStateRef = useRef<{
    key: TicketColumnKey;
    startX: number;
    startWidth: number;
  } | null>(null);

  const orderedColumns = useMemo(() => columnOrder.map((key) => TICKET_COLUMN_MAP[key]), [columnOrder]);

  const filteredTickets = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return tickets;

    return tickets.filter((ticket) =>
      [
        ticket.priority,
        ticket.id,
        ticket.type,
        ticket.subject,
        ticket.status,
        ticket.agent,
        ticket.agentTeam,
        ticket.modifiedBy,
      ].some((value) => value.toLowerCase().includes(query)),
    );
  }, [searchQuery, tickets]);

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / TICKET_PAGE_SIZE));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!resizeStateRef.current) return;

      const { key, startX, startWidth } = resizeStateRef.current;
      const minWidth = TICKET_COLUMN_MAP[key].minWidth;
      const nextWidth = Math.max(minWidth, startWidth + event.clientX - startX);

      setColumnWidths((current) =>
        current[key] === nextWidth
          ? current
          : {
              ...current,
              [key]: nextWidth,
            },
      );
    };

    const handleMouseUp = () => {
      resizeStateRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, []);

  const paginatedTickets = useMemo(() => {
    const startIndex = (currentPage - 1) * TICKET_PAGE_SIZE;
    return filteredTickets.slice(startIndex, startIndex + TICKET_PAGE_SIZE);
  }, [currentPage, filteredTickets]);

  const totalTableWidth = useMemo(
    () => 44 + orderedColumns.reduce((total, column) => total + columnWidths[column.key], 0),
    [columnWidths, orderedColumns],
  );

  const firstVisibleTicket = filteredTickets.length === 0 ? 0 : (currentPage - 1) * TICKET_PAGE_SIZE + 1;
  const lastVisibleTicket = filteredTickets.length === 0 ? 0 : Math.min(currentPage * TICKET_PAGE_SIZE, filteredTickets.length);

  const handleColumnDrop = (targetKey: TicketColumnKey) => {
    const draggedKey = draggingColumnRef.current;
    if (!draggedKey) return;

    setColumnOrder((current) => reorderTicketColumns(current, draggedKey, targetKey));
    draggingColumnRef.current = null;
  };

  const handleResizeStart = (event: React.MouseEvent<HTMLButtonElement>, key: TicketColumnKey) => {
    event.preventDefault();
    event.stopPropagation();

    resizeStateRef.current = {
      key,
      startX: event.clientX,
      startWidth: columnWidths[key],
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  return (
    <div className="flex h-0 min-h-0 flex-1 flex-col overflow-hidden bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(0,0,0,0.08)] px-4 py-3">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98A2B3]" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search tickets, status, agents, or subjects"
            className="h-9 border-black/10 bg-white pl-9 text-xs text-[#111827] placeholder:text-[#9CA3AF] focus-visible:ring-1 focus-visible:ring-[#BFDBFE]"
          />
        </div>

        <div className="text-[11px] text-[#667085]">
          {filteredTickets.length} tickets · Drag headers to reorder · Drag column edges to resize
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="table-fixed text-xs text-[#344054]" style={{ minWidth: totalTableWidth }}>
          <thead>
            <tr>
              <th className="sticky top-0 z-10 w-11 border-b border-[rgba(0,0,0,0.08)] bg-[#F9FAFB] px-3 py-3 text-left" />
              {orderedColumns.map((column) => (
                <th
                  key={column.key}
                  style={{ width: columnWidths[column.key], minWidth: column.minWidth }}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => handleColumnDrop(column.key)}
                  className="group sticky top-0 z-10 border-b border-[rgba(0,0,0,0.08)] bg-[#F9FAFB] px-3 py-3 text-left align-middle"
                >
                  <div
                    draggable
                    onDragStart={() => {
                      draggingColumnRef.current = column.key;
                    }}
                    onDragEnd={() => {
                      draggingColumnRef.current = null;
                    }}
                    className="flex cursor-grab items-center gap-2 pr-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#667085] active:cursor-grabbing"
                  >
                    <span className="truncate">{column.label}</span>
                    <GripVertical className="h-3.5 w-3.5 flex-shrink-0 text-[#98A2B3]" />
                  </div>
                  <button
                    type="button"
                    aria-label={`Resize ${column.label}`}
                    onMouseDown={(event) => handleResizeStart(event, column.key)}
                    className="absolute inset-y-0 right-0 w-2 cursor-col-resize bg-transparent transition-colors hover:bg-[#BFDBFE]/60 focus-visible:outline-none"
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedTickets.length > 0 ? (
              paginatedTickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  onClick={() => onOpenTicket(ticket)}
                  className="cursor-pointer border-b border-[rgba(0,0,0,0.08)] bg-white transition-colors hover:bg-[#FCFCFD]"
                >
                  <td className="w-11 px-3 py-3 align-middle text-[#98A2B3]">
                    <ChevronRight className="h-4 w-4" />
                  </td>
                  {orderedColumns.map((column) => (
                    <td
                      key={column.key}
                      style={{ width: columnWidths[column.key], minWidth: column.minWidth }}
                      className="px-3 py-3 align-middle"
                    >
                      <div className="min-w-0">{column.renderCell(ticket)}</div>
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={orderedColumns.length + 1} className="px-4 py-12 text-center text-sm text-[#98A2B3]">
                  No tickets match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[rgba(0,0,0,0.08)] px-4 py-3 text-xs text-[#667085]">
        <div>
          Showing {firstVisibleTicket}-{lastVisibleTicket} of {filteredTickets.length} tickets
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-8 rounded-lg px-3 text-xs"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="min-w-[84px] text-center text-[#475467]">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            className="h-8 rounded-lg px-3 text-xs"
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
