// Minimal test suite to verify basic functionality

describe('Basic Functionality', () => {
  test('basic Jest functionality works', () => {
    expect(1 + 1).toBe(2);
  });
  
  test('can import React', () => {
    const React = require('react');
    expect(React).toBeDefined();
    expect(React.createElement).toBeDefined();
  });
  
  test('Jest is working properly', () => {
    expect(jest).toBeDefined();
    expect(jest.fn).toBeDefined();
  });
  
  test('basic JavaScript features work', () => {
    const arr = [1, 2, 3];
    const doubled = arr.map(x => x * 2);
    expect(doubled).toEqual([2, 4, 6]);
  });
});
