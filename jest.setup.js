// Simple Jest setup for testing
console.log('Jest setup loaded');

// Mock common React Native components
global.alert = jest.fn();
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Mock AsyncStorage
const mockAsyncStorage = {
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve())
};

// Global mocks
global.AsyncStorage = mockAsyncStorage;

// Global test timeout
jest.setTimeout(10000);
