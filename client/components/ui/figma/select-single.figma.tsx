import figma from "@figma/code-connect";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../select";

// Lyra Select Dropdown (Type=single select) → shadcn Select
// This is the single-select variant — the primary usage pattern in the codebase.
// Show Search has no direct code equivalent in the base Select component.
figma.connect(Select, "https://www.figma.com/design/qyCq4jUOrpYcpHhpNCdgA5?node-id=17015:32875", {
  props: {},
  example: () => (
    <Select>
      <SelectTrigger>
        <SelectValue placeholder="Select an option" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="option-1">Option 1</SelectItem>
        <SelectItem value="option-2">Option 2</SelectItem>
        <SelectItem value="option-3">Option 3</SelectItem>
      </SelectContent>
    </Select>
  ),
});
