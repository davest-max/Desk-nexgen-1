import type { Meta, StoryObj } from "@storybook/react-vite";
import { Textarea } from "../textarea";

const meta: Meta<typeof Textarea> = {
  title: "Components/UI/Textarea",
  component: Textarea,
  tags: ["autodocs"],
  argTypes: {
    disabled: { control: "boolean" },
    placeholder: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  args: { placeholder: "Enter text..." },
};

export const Disabled: Story = {
  args: { placeholder: "Disabled", disabled: true },
};

export const WithValue: Story = {
  args: { defaultValue: "Some content here\nLine two" },
};
