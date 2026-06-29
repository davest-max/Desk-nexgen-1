import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type AddNewType = "customer" | "account" | "ticket" | "work-item";

type SavedRecord = {
  type: AddNewType;
  title: string;
  subtitle: string;
  fields: Array<{
    key: string;
    label: string;
    value: string;
  }>;
};

const addNewFieldConfig: Record<
  AddNewType,
  Array<{
    key: string;
    label: string;
    placeholder: string;
    type: "input" | "textarea";
  }>
> = {
  customer: [
    { key: "firstName", label: "First Name", placeholder: "Enter first name", type: "input" },
    { key: "lastName", label: "Last Name", placeholder: "Enter last name", type: "input" },
    { key: "email", label: "Email", placeholder: "name@example.com", type: "input" },
    { key: "phone", label: "Phone", placeholder: "(555) 123-4567", type: "input" },
    { key: "customerId", label: "Customer ID", placeholder: "CST-10482", type: "input" },
    { key: "notes", label: "Notes", placeholder: "Add customer notes", type: "textarea" },
  ],
  account: [
    { key: "accountName", label: "Account Name", placeholder: "Premier Account", type: "input" },
    { key: "accountNumber", label: "Account Number", placeholder: "ACC-20391", type: "input" },
    { key: "owner", label: "Owner", placeholder: "Alex Kowalski", type: "input" },
    { key: "status", label: "Status", placeholder: "Active", type: "input" },
    { key: "billingAddress", label: "Billing Address", placeholder: "Add billing address", type: "textarea" },
  ],
  ticket: [
    { key: "title", label: "Ticket Title", placeholder: "Payment mismatch preventing upgrade", type: "input" },
    { key: "priority", label: "Priority", placeholder: "High", type: "input" },
    { key: "category", label: "Category", placeholder: "Billing", type: "input" },
    { key: "customer", label: "Customer", placeholder: "Alex Kowalski", type: "input" },
    { key: "description", label: "Description", placeholder: "Describe the issue", type: "textarea" },
  ],
  "work-item": [
    { key: "name", label: "Work Item Name", placeholder: "Resolve billing mismatch", type: "input" },
    { key: "assignee", label: "Assignee", placeholder: "Jeff Common", type: "input" },
    { key: "dueDate", label: "Due Date", placeholder: "03/15/26", type: "input" },
    { key: "relatedTo", label: "Related To", placeholder: "Ticket TCK-2091", type: "input" },
    { key: "details", label: "Details", placeholder: "Add work item details", type: "textarea" },
  ],
};

const addNewTypeLabel: Record<AddNewType, string> = {
  customer: "Customer",
  account: "Account",
  ticket: "Ticket",
  "work-item": "Work Item",
};

function buildSavedRecord(type: AddNewType, formValues: Record<string, string>): SavedRecord {
  const fields = addNewFieldConfig[type].map((field) => ({
    key: field.key,
    label: field.label,
    value: (formValues[field.key] ?? "").trim(),
  }));

  const preferredTitle =
    type === "customer"
      ? [formValues.firstName, formValues.lastName].map((value) => value?.trim()).filter(Boolean).join(" ")
      : type === "account"
        ? formValues.accountName?.trim()
        : type === "ticket"
          ? formValues.title?.trim()
          : formValues.name?.trim();

  const preferredSubtitle =
    type === "customer"
      ? formValues.customerId?.trim()
      : type === "account"
        ? formValues.accountNumber?.trim()
        : type === "ticket"
          ? formValues.customer?.trim()
          : formValues.relatedTo?.trim();

  return {
    type,
    title: preferredTitle || `New ${addNewTypeLabel[type]}`,
    subtitle: preferredSubtitle || `${addNewTypeLabel[type]} record`,
    fields,
  };
}

export default function AddPanelContent() {
  const [selectedType, setSelectedType] = useState<AddNewType>("customer");
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [savedRecord, setSavedRecord] = useState<SavedRecord | null>(null);
  const [isViewingSavedRecord, setIsViewingSavedRecord] = useState(false);

  const fields = addNewFieldConfig[selectedType];
  const isSaveDisabled = fields.some((field) => !(formValues[field.key] ?? "").trim());

  const clearForm = () => {
    setFormValues({});
    setIsViewingSavedRecord(false);
  };

  const handleSave = () => {
    if (isSaveDisabled) return;

    const nextSavedRecord = buildSavedRecord(selectedType, formValues);
    setSavedRecord(nextSavedRecord);
    clearForm();
    toast.success(`${addNewTypeLabel[selectedType]} saved successfully`, {
      description: `${nextSavedRecord.title} is ready to review.`,
      action: {
        label: "Open Record",
        onClick: () => {
          setSelectedType(nextSavedRecord.type);
          setIsViewingSavedRecord(true);
        },
      },
    });
  };

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {isViewingSavedRecord && savedRecord ? (
          <div className="space-y-5">
            <div className="rounded-2xl border border-[#D8E5EE] bg-[#F7FBFE] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#166CCA]">
                {addNewTypeLabel[savedRecord.type]} record
              </p>
              <h3 className="mt-2 text-lg font-semibold tracking-tight text-[#1F2937]">{savedRecord.title}</h3>
              <p className="mt-1 text-sm text-[#5B5B5B]">{savedRecord.subtitle}</p>
            </div>

            <div className="space-y-3">
              {savedRecord.fields.map((field) => (
                <div key={field.key} className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-[#9CA3AF]">{field.label}</p>
                  <p className="mt-1 text-sm text-[#333333]">{field.value}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="block text-[10px] font-medium uppercase tracking-wider text-[#9CA3AF]">
                Item Type
              </label>
              <Select
                value={selectedType}
                onValueChange={(value) => {
                  setSelectedType(value as AddNewType);
                  setIsViewingSavedRecord(false);
                }}
              >
                <SelectTrigger className="h-9 rounded border border-[#E5E7EB] bg-[#F8F8F9] px-2.5 py-1.5 text-sm text-[#333333] focus:ring-1 focus:ring-[#166CCA]/30 focus:ring-offset-0 focus:border-[#166CCA]">
                  <SelectValue placeholder="Select item type" />
                </SelectTrigger>
                <SelectContent className="z-[80] rounded border border-[#E5E7EB] bg-white">
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="account">Account</SelectItem>
                  <SelectItem value="ticket">Ticket</SelectItem>
                  <SelectItem value="work-item">Work Item</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              {fields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <label className="block text-[10px] font-medium uppercase tracking-wider text-[#9CA3AF]">
                    {field.label}
                  </label>
                  {field.type === "textarea" ? (
                    <Textarea
                      value={formValues[field.key] ?? ""}
                      onChange={(event) =>
                        setFormValues((current) => ({ ...current, [field.key]: event.target.value }))
                      }
                      placeholder={field.placeholder}
                      className="min-h-[96px] rounded border border-[#E5E7EB] bg-[#F8F8F9] px-2.5 py-1.5 text-sm text-[#333333] placeholder:text-transparent focus-visible:border-[#166CCA] focus-visible:ring-1 focus-visible:ring-[#166CCA]/30"
                    />
                  ) : (
                    <Input
                      value={formValues[field.key] ?? ""}
                      onChange={(event) =>
                        setFormValues((current) => ({ ...current, [field.key]: event.target.value }))
                      }
                      placeholder={field.placeholder}
                      className="h-9 rounded border border-[#E5E7EB] bg-[#F8F8F9] px-2.5 py-1.5 text-sm text-[#333333] placeholder:text-transparent focus-visible:border-[#166CCA] focus-visible:ring-1 focus-visible:ring-[#166CCA]/30"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-border px-5 py-4">
        {isViewingSavedRecord ? (
          <>
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setIsViewingSavedRecord(false)}>
              Back to Form
            </Button>
            <Button
              type="button"
              className="rounded-xl bg-[#166CCA] hover:bg-[#0A5E92]"
              onClick={() => {
                setSelectedType(savedRecord?.type ?? "customer");
                clearForm();
              }}
            >
              Create Another
            </Button>
          </>
        ) : (
          <>
            <Button type="button" variant="outline" className="rounded-xl" onClick={clearForm}>
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-xl bg-[#166CCA] hover:bg-[#0A5E92] disabled:bg-[#BFDBFE] disabled:text-white"
              onClick={handleSave}
              disabled={isSaveDisabled}
            >
              Save
            </Button>
          </>
        )}
      </div>
    </>
  );
}
