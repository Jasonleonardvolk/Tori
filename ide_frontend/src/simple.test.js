// Simple test to verify Jest is working
describe('Basic Jest Test', () => {
  test('simple test that should pass', () => {
    expect(1 + 1).toBe(2);
  });
  
  test('checks if testing environment works', () => {
    expect(typeof jest).toBe('object');
  });
});
