// Jest setup for React Native testing
import '@testing-library/jest-native/extend-expect';

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve())
}));

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, ...props }) => {
    const React = require('react');
    return React.createElement('div', { ...props, 'data-testid': 'linear-gradient' }, children);
  }
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name, size, color, testID, ...props }) => {
    const React = require('react');
    return React.createElement('div', { 
      ...props, 
      'data-testid': testID || `icon-${name}`,
      'data-icon': name,
      'data-size': size,
      'data-color': color
    });
  }
}));

// Global test timeout
jest.setTimeout(10000);
