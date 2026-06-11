import figma from "@figma/code-connect";
import { Checkbox } from "../checkbox";

// Lyra Checkbox → shadcn Checkbox
// Checked: "yes"/"no" maps to the checked boolean prop
// State (default/hover/pressed/read-only/disabled) and Focus frame have no direct code prop equivalents
// With Label maps to wrapping with a <label> element in code
figma.connect(Checkbox, "https://www.figma.com/design/qyCq4jUOrpYcpHhpNCdgA5?node-id=16926:21018", {
  props: {
    checked: figma.enum("Checked", {
      yes: true,
      no:  false,
    }),
    disabled: figma.enum("State", {
      disabled: true,
      default:  false,
      hover:    false,
      pressed:  false,
    }),
  },
  example: ({ checked, disabled }) => (
    <Checkbox checked={checked} disabled={disabled} />
  ),
});
