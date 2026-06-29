import figma from "@figma/code-connect";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../dialog";
import { Button } from "../button";

figma.connect(Dialog, "https://www.figma.com/design/qyCq4jUOrpYcpHhpNCdgA5?node-id=17022:36232", {
  links: [
    { name: "Storybook", url: "http://localhost:6006/?path=/story/components-ui-dialog--default" },
  ],

  props: {},
  example: () => (
    <Dialog>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dialog Title</DialogTitle>
          <DialogDescription>Dialog description goes here.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
});
