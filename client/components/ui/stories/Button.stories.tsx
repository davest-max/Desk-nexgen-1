import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../button";

const meta: Meta<typeof Button> = {
  title: "Components/UI/Button",
  component: Button,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "secondary", "ghost", "destructive", "outline", "link"],
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg", "icon"],
    },
    disabled: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: { variant: "default", children: "Button" },
};

export const Secondary: Story = {
  args: { variant: "secondary", children: "Button" },
};

export const Ghost: Story = {
  args: { variant: "ghost", children: "Button" },
};

export const Destructive: Story = {
  args: { variant: "destructive", children: "Button" },
};

export const Outline: Story = {
  args: { variant: "outline", children: "Button" },
};

export const Disabled: Story = {
  args: { variant: "default", children: "Button", disabled: true },
};
