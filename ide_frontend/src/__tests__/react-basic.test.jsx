// Basic React functionality test
import React from 'react';
import { render } from '@testing-library/react';

describe('Basic React Tests', () => {
  test('can render a simple React component', () => {
    const SimpleComponent = () => <div>Hello Test</div>;
    
    const { getByText } = render(<SimpleComponent />);
    expect(getByText('Hello Test')).toBeInTheDocument();
  });
  
  test('React Testing Library is working', () => {
    expect(render).toBeDefined();
  });
});
