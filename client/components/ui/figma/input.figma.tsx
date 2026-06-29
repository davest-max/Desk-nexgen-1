import figma from "@figma/code-connect";
import { Input } from "../input";

figma.connect(Input, "https://www.figma.com/design/qyCq4jUOrpYcpHhpNCdgA5?node-id=16926:23018", {
  links: [
    { name: "Storybook", url: "http://localhost:6006/?path=/story/components-ui-input--default" },
  ],

  props: {
    disabled: figma.enum("State", {
      disabled: true,
      Default: false,
      hover: false,
      active: false,
      "read-only": false,
      error: false,
    }),
  },
  example: ({ disabled }) => (
    <Input placeholder="Enter value..." disabled={disabled} />
  ),
});
