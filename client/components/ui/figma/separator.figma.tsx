import figma from "@figma/code-connect";
import { Separator } from "../separator";

// Lyra divider → shadcn Separator
figma.connect(Separator, "https://www.figma.com/design/qyCq4jUOrpYcpHhpNCdgA5?node-id=17015:32978", {
  props: {},
  example: () => (
    <Separator />
  ),
});
