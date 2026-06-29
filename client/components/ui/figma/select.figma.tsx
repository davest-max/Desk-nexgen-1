import figma from "@figma/code-connect";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../select";

// Lyra Select Dropdown (Type=multi select) → shadcn Select
// Note: Lyra has a multi-select variant; the code Select is single-select only.
// Show Search, Show Footer, Show select all bar have no direct code equivalents.
figma.connect(Select, "https://www.figma.com/design/qyCq4jUOrpYcpHhpNCdgA5?node-id=17015:32856", {
  links: [
    { name: "Storybook", url: "http://localhost:6006/?path=/story/components-ui-select--default" },
  ],

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
