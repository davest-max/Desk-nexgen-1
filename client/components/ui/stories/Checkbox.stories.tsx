import type { Meta, StoryObj } from "@storybook/react-vite";
import { Checkbox } from "../checkbox";

const meta: Meta<typeof Checkbox> = {
  title: "Components/UI/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
  argTypes: {
    checked: { control: "boolean" },
    disabled: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {
  args: { checked: false },
};

export const Checked: Story = {
  args: { checked: true },
};

export const Disabled: Story = {
  args: { checked: false, disabled: true },
};

export const CheckedDisabled: Story = {
  args: { checked: true, disabled: true },
};
