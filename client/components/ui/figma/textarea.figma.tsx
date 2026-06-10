import figma from "@figma/code-connect";
import { Textarea } from "../textarea";

figma.connect(Textarea, "https://www.figma.com/design/qyCq4jUOrpYcpHhpNCdgA5?node-id=16926:20918", {
  props: {
    disabled: figma.enum("State", {
      disabled: true,
      Default: false,
      hover: false,
      active: false,
      "read-only": false,
      error: false,
      AI: false,
    }),
  },
  example: ({ disabled }) => (
    <Textarea placeholder="Enter text..." disabled={disabled} />
  ),
});
