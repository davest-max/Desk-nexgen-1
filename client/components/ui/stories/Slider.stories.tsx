import type { Meta, StoryObj } from "@storybook/react-vite";
import { Slider } from "../slider";

const meta: Meta<typeof Slider> = {
  title: "Components/UI/Slider",
  component: Slider,
  tags: ["autodocs"],
  argTypes: {
    disabled: { control: "boolean" },
    min: { control: "number" },
    max: { control: "number" },
    step: { control: "number" },
  },
};

export default meta;
type Story = StoryObj<typeof Slider>;

export const Default: Story = {
  args: { defaultValue: [50], min: 0, max: 100, step: 1, className: "w-64" },
};

export const Disabled: Story = {
  args: { defaultValue: [50], min: 0, max: 100, disabled: true, className: "w-64" },
};
