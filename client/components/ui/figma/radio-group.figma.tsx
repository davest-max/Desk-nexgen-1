import figma from "@figma/code-connect";
import { RadioGroup, RadioGroupItem } from "../radio-group";

// Lyra RadioButton Group → shadcn RadioGroup
// Direction: horizontal/vertical maps to orientation prop
// Show Group Title, Show error Message have no direct code equivalents
figma.connect(RadioGroup, "https://www.figma.com/design/qyCq4jUOrpYcpHhpNCdgA5?node-id=16926:21289", {
  props: {
    orientation: figma.enum("Direction", {
      horizontal: "horizontal",
      vertical:   "vertical",
    }),
  },
  example: ({ orientation }) => (
    <RadioGroup orientation={orientation} defaultValue="option-1">
      <RadioGroupItem value="option-1" id="option-1" />
      <RadioGroupItem value="option-2" id="option-2" />
      <RadioGroupItem value="option-3" id="option-3" />
    </RadioGroup>
  ),
});
