import type { Meta, StoryObj } from '@storybook/react';
import { CodeWorkspace } from './CodeWorkspace';

const meta = {
  title: 'Components/CodeWorkspace/ELFIN',
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
    language: { 
      control: 'select',
      options: ['json', 'elfin'],
      description: 'The language mode to use'
    },
    readOnly: {
      control: 'boolean',
      description: 'Whether the editor is read-only'
    }
  },
  decorators: [
    (Story) => (
      <div style={{ height: '500px', width: '100%' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CodeWorkspace>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ElfinSample: Story = {
  args: {
    value: `;; ELFIN Example - Basic Agent Definition

;; Define an agent with beliefs, intents, and actions
agent ExampleAgent {
  ;; Beliefs represent the agent's understanding of the world
  beliefs {
    world_state: {
      position: [0, 0, 0],
      objects: ["book", "table", "chair"],
      temperature: 72
    },
    
    goals: [
      "learn_new_concepts",
      "organize_knowledge"
    ]
  }
  
  ;; Intents represent what the agent wants to accomplish
  intents {
    primary: "explore_environment",
    secondary: ["gather_information", "update_knowledge_base"]
  }
  
  ;; Decision function - how the agent chooses actions
  fn decide(perception) {
    if perception.contains("new_information") {
      return actions.learn(perception.data)
    } else {
      return actions.explore()
    }
  }
  
  ;; Actions the agent can take
  actions {
    explore() {
      ;; Movement logic here
      return {
        type: "movement",
        direction: [1, 0, 0],
        speed: 1.0
      }
    },
    
    learn(data) {
      ;; Learning algorithm implementation
      let concept = extract_concept(data)
      return {
        type: "concept_integration",
        concept: concept,
        confidence: 0.85
      }
    }
  }
}

;; Helper function for concept extraction
fn extract_concept(data) {
  ;; Pattern recognition logic
  return {
    name: "identified_concept",
    properties: data.properties,
    relationships: []
  }
}`,
    language: 'elfin',
    height: '100%',
    readOnly: false
  },
};

export const ElfinReadOnly: Story = {
  args: {
    ...ElfinSample.args,
    readOnly: true
  },
};
