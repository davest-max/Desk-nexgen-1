import figma from "@figma/code-connect";
import { Button } from "../button";

figma.connect(Button, "https://www.figma.com/design/qyCq4jUOrpYcpHhpNCdgA5?node-id=16939:25782", {
  props: {
    variant: figma.enum("Type", {
      primary: "default",
      secondary: "secondary",
      ghost: "ghost",
      destructive: "destructive",
    }),
    disabled: figma.enum("State", {
      disabled: true,
      Default: false,
      hover: false,
      pressed: false,
    }),
  },
  example: ({ variant, disabled }) => (
    <Button variant={variant} disabled={disabled}>
      Button
    </Button>
  ),
});
