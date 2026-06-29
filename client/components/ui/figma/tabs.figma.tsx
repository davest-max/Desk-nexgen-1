import figma from "@figma/code-connect";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../tabs";

figma.connect(Tabs, "https://www.figma.com/design/qyCq4jUOrpYcpHhpNCdgA5?node-id=16950:30986", {
  links: [
    { name: "Storybook", url: "http://localhost:6006/?path=/story/components-ui-tabs--default" },
  ],

  props: {
    alignment: figma.enum("Alignment", {
      left: "start",
      fit: "stretch",
    }),
  },
  example: ({ alignment }) => (
    <Tabs defaultValue="tab1">
      <TabsList>
        <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab2">Tab 2</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">Content 1</TabsContent>
      <TabsContent value="tab2">Content 2</TabsContent>
    </Tabs>
  ),
});
