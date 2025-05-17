declare module '@storybook/react' {
  import React from 'react';
  
  // Simplify the Meta and StoryObj types for basic usage
  export type Meta<TArgs> = {
    title: string;
    component: any;
    parameters?: any;
    tags?: string[];
    argTypes?: any;
    args?: Partial<TArgs>;
    decorators?: any[];
  };

  export type StoryObj<TArgs> = {
    name?: string;
    storyName?: string;
    args?: Partial<TArgs>;
    argTypes?: any;
    parameters?: any;
    decorators?: any[];
  };
}
