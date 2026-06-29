import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input } from "../input";

const meta: Meta<typeof Input> = {
  title: "Components/UI/Input",
  component: Input,
  tags: ["autodocs"],
  argTypes: {
    disabled: { control: "boolean" },
    placeholder: { control: "text" },
    type: { control: "select", options: ["text", "email", "password", "number", "search"] },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: { placeholder: "Enter text..." },
};

export const Disabled: Story = {
  args: { placeholder: "Disabled", disabled: true },
};

export const WithValue: Story = {
  args: { defaultValue: "Hello world" },
};

export const Password: Story = {
  args: { type: "password", placeholder: "Password" },
};
