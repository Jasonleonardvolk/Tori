import type { Meta, StoryObj } from '@storybook/react';
import { WebSocketStatus } from './WebSocketStatus';

// Meta information for the component
const meta = {
  title: 'Components/WebSocketStatus',
  component: WebSocketStatus,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    status: { 
      control: 'select', 
      options: ['connecting', 'open', 'disconnected'],
      description: 'Current WebSocket connection status'
    },
    onReconnect: { 
      action: 'reconnect clicked',
      description: 'Callback triggered when the reconnect button is clicked'
    },
  },
} satisfies Meta<typeof WebSocketStatus>;

export default meta;
type Story = StoryObj<typeof meta>;

// Connected state
export const Connected: Story = {
  args: {
    status: 'open',
    onReconnect: () => console.log('Reconnect clicked'),
  },
};

// Connecting state
export const Connecting: Story = {
  args: {
    status: 'connecting',
    onReconnect: () => console.log('Reconnect clicked'),
  },
};

// Disconnected state
export const Disconnected: Story = {
  args: {
    status: 'disconnected',
    onReconnect: () => console.log('Reconnect clicked'),
  },
};
