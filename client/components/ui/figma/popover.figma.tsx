import figma from "@figma/code-connect";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";
import { Button } from "../button";

figma.connect(Popover, "https://www.figma.com/design/qyCq4jUOrpYcpHhpNCdgA5?node-id=17015:33010", {
  props: {
    side: figma.enum("Arrow location", {
      up: "bottom",
      down: "top",
      left: "right",
      right: "left",
    }),
  },
  example: ({ side }) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Open</Button>
      </PopoverTrigger>
      <PopoverContent side={side}>
        Popover content
      </PopoverContent>
    </Popover>
  ),
});
