/**
 * Example test suite demonstrating Jest testing framework
 */

describe('Example Test Suite', () => {
  test('should pass basic assertion', () => {
    expect(true).toBe(true);
  });

  test('should perform arithmetic correctly', () => {
    expect(2 + 2).toBe(4);
  });

  test('should check string equality', () => {
    const greeting = 'Hello, World!';
    expect(greeting).toBe('Hello, World!');
  });

  test('should verify array contains value', () => {
    const fruits = ['apple', 'banana', 'orange'];
    expect(fruits).toContain('banana');
  });

  test('should check object properties', () => {
    const user = {
      name: 'Test User',
      email: 'test@example.com'
    };
    expect(user).toHaveProperty('name');
    expect(user.email).toBe('test@example.com');
  });
});
