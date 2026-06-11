import figma from "@figma/code-connect";
import { Alert, AlertDescription } from "../alert";

// Lyra Inline Notification → shadcn Alert
// Status: warning/error map to destructive; info/success map to default
// Show dismiss Button has no direct code equivalent in the base Alert component
figma.connect(Alert, "https://www.figma.com/design/qyCq4jUOrpYcpHhpNCdgA5?node-id=17022:34138", {
  props: {
    variant: figma.enum("Status", {
      error:   "destructive",
      warning: "destructive",
      info:    "default",
      success: "default",
    }),
  },
  example: ({ variant }) => (
    <Alert variant={variant}>
      <AlertDescription>
        Notification message goes here.
      </AlertDescription>
    </Alert>
  ),
});
