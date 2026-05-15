import { useState } from "react";
import DirectoryPanel from "@/components/DirectoryPanel";
import AddPanelContent from "@/components/AddPanelContent";
import NotesPanel from "@/components/NotesPanel";
import { ChevronLeft, Plus, PanelRight } from "lucide-react";
import { useLayoutContext } from "@/components/layout-context";

/**
 * Full-page wrapper for the Directory.
 *
 * Mirrors the inline-overlay behaviour that the old floating popunder had:
 *   - Default view → DirectoryPanel (customer / agent / team / skills list)
 *   - "Add" overlay → AddPanelContent (create new record)
 *   - Customer detail → NotesPanel for a specific customer
 */
export default function DirectoryPage() {
  const [inlineCustomerId, setInlineCustomerId] = useState<string | null>(null);
  const [inlineAddOpen, setInlineAddOpen] = useState(false);
  const { openDirectoryPanel } = useLayoutContext();

  const showingInlineAdd = inlineAddOpen && !inlineCustomerId;
  const showingInlineCustomer = !!inlineCustomerId && !inlineAddOpen;

  const panelLabel = showingInlineAdd
    ? "Add"
    : showingInlineCustomer
      ? "Customer Information"
      : "Directory";

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white dark:bg-[#0F1629]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E4E7EC] dark:border-[#1C2536] px-5 py-3">
        <div className="flex items-center gap-2">
          {(showingInlineAdd || showingInlineCustomer) ? (
            <button
              type="button"
              onClick={() => { setInlineCustomerId(null); setInlineAddOpen(false); }}
              className="flex items-center gap-1.5 rounded-lg text-sm font-semibold text-[#166CCA] transition-colors hover:text-[#0A5E92]"
              aria-label="Back to directory"
            >
              <ChevronLeft className="h-4 w-4 shrink-0" />
              {panelLabel}
            </button>
          ) : (
            <h1 className="text-sm font-semibold tracking-tight text-[#333333] dark:text-white">{panelLabel}</h1>
          )}
        </div>

        {!showingInlineCustomer && !showingInlineAdd && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={openDirectoryPanel}
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[#7A7A7A] transition-colors hover:bg-[#F2F4F7] dark:hover:bg-[#1C2536] hover:text-[#333333] dark:hover:text-[#CBD5E1]"
              aria-label="Pop out as floating panel"
              title="Pop out as floating panel"
            >
              <PanelRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setInlineAddOpen(true)}
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[#7A7A7A] transition-colors hover:bg-[#F2F4F7] dark:hover:bg-[#1C2536] hover:text-[#333333] dark:hover:text-[#CBD5E1]"
              aria-label="Add new"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {showingInlineAdd
          ? <AddPanelContent />
          : showingInlineCustomer
            ? <NotesPanel key={inlineCustomerId!} customerId={inlineCustomerId!} />
            : <DirectoryPanel onSelectCustomer={(id) => { setInlineCustomerId(id); setInlineAddOpen(false); }} />}
      </div>
    </div>
  );
}
