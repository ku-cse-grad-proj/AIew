import { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ButtonLink } from './ButtonLink'

const meta = {
  component: ButtonLink,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    variant: {
      control: 'select',
      description: 'ButtonLink의 variant 스타일을 설정합니다.',
      options: ['primary', 'secondary', 'outline'],
    },
    size: {
      control: 'radio',
      description: 'ButtonLink의 크기를 설정합니다.',
      options: ['md', 'lg'],
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ButtonLink>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Button Link',
    disabled: false,
    size: 'md',
    href: '#',
  },
}

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Button Link',
    disabled: false,
    size: 'md',
    href: '#',
  },
}

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Button Link',
    disabled: false,
    size: 'md',
    href: '#',
  },
}
