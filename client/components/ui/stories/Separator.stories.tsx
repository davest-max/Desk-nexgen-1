import type { Meta, StoryObj } from "@storybook/react-vite";
import { Separator } from "../separator";

const meta: Meta<typeof Separator> = {
  title: "Components/UI/Separator",
  component: Separator,
  tags: ["autodocs"],
  argTypes: {
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Separator>;

export const Horizontal: Story = {
  render: (args) => (
    <div className="w-64">
      <p className="text-sm mb-2">Above</p>
      <Separator {...args} />
      <p className="text-sm mt-2">Below</p>
    </div>
  ),
  args: { orientation: "horizontal" },
};

export const Vertical: Story = {
  render: (args) => (
    <div className="flex h-8 items-center gap-2">
      <span className="text-sm">Left</span>
      <Separator {...args} className="h-full" />
      <span className="text-sm">Right</span>
    </div>
  ),
  args: { orientation: "vertical" },
};
