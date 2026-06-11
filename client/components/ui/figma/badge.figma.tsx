import figma from "@figma/code-connect";
import { Badge } from "../badge";

// Lyra Badge → shadcn Badge
// Color mapping: blue→default, gray→secondary, red→destructive, all others→outline
// Note: Lyra has 10 colors; code only has 4 variants. Inversed and Size have no direct code equivalent.
figma.connect(Badge, "https://www.figma.com/design/qyCq4jUOrpYcpHhpNCdgA5?node-id=17780:58157", {
  props: {
    variant: figma.enum("Color", {
      blue:   "default",
      gray:   "secondary",
      red:    "destructive",
      orange: "outline",
      yellow: "outline",
      lime:   "outline",
      green:  "outline",
      teal:   "outline",
      purple: "outline",
      pink:   "outline",
    }),
  },
  example: ({ variant }) => (
    <Badge variant={variant}>Label</Badge>
  ),
});
