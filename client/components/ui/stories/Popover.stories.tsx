import type { Meta, StoryObj } from "@storybook/react-vite";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";
import { Button } from "../button";

const meta: Meta = {
  title: "Components/UI/Popover",
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary">Open Popover</Button>
      </PopoverTrigger>
      <PopoverContent>
        <p className="text-sm">This is the popover content.</p>
      </PopoverContent>
    </Popover>
  ),
};
