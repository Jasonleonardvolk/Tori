import type { Meta, StoryObj } from '@storybook/react';
import { CodeWorkspace } from './CodeWorkspace';

const meta = {
  title: 'Components/CodeWorkspace',
  component: CodeWorkspace,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    value: { 
      control: 'text',
      description: 'The initial content of the editor'
    },
    onChange: { 
      action: 'content changed',
      description: 'Called when the content changes'
    },
    language: { 
      control: 'select',
      options: ['json', 'elfin'],
      description: 'The language mode to use'
    },
    height: {
      control: 'text',
      description: 'The height of the editor'
    },
    readOnly: {
      control: 'boolean',
      description: 'Whether the editor is read-only'
    }
  },
  decorators: [
    (Story) => (
      <div style={{ height: '400px', width: '100%' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CodeWorkspace>;

export default meta;
type Story = StoryObj<typeof meta>;

export const JSONEditor: Story = {
  args: {
    value: `{
  "name": "ITORI IDE",
  "version": "0.3.0",
  "description": "Integrated development environment for ITORI platform",
  "features": [
    "WebSocket integration",
    "Real-time updates",
    "Code editing",
    "Visualization"
  ],
  "settings": {
    "theme": "light",
    "fontSize": 14,
    "lineNumbers": true
  }
}`,
    language: 'json',
    height: '100%',
    readOnly: false
  },
};

export const ReadOnly: Story = {
  args: {
    ...JSONEditor.args,
    readOnly: true
  },
};

export const Empty: Story = {
  args: {
    value: '',
    language: 'json',
    height: '100%',
    readOnly: false
  },
};
