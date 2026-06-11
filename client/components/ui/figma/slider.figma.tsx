import figma from "@figma/code-connect";
import { Slider } from "../slider";

// Lyra Slider (Type=Single) → shadcn Slider
// Show Marks and Show Label have no direct code prop equivalents in the base Slider
figma.connect(Slider, "https://www.figma.com/design/qyCq4jUOrpYcpHhpNCdgA5?node-id=16926:21329", {
  props: {},
  example: () => (
    <Slider
      defaultValue={[50]}
      min={0}
      max={100}
      step={1}
    />
  ),
});
