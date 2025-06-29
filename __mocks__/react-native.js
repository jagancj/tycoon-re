// Mock implementation of React Native for Jest
const mockComponent = (name) => {
  const Component = (props) => {
    const React = require('react');
    return React.createElement(name, props, props.children);
  };
  Component.displayName = name;
  return Component;
};

const mockNativeComponent = (name) => {
  const Component = (props) => {
    const React = require('react');
    return React.createElement(name, props, props.children);
  };
  Component.displayName = name;
  return Component;
};

export const View = mockComponent('View');
export const Text = mockComponent('Text');
export const TouchableOpacity = mockComponent('TouchableOpacity');
export const SafeAreaView = mockComponent('SafeAreaView');
export const FlatList = mockComponent('FlatList');
export const ScrollView = mockComponent('ScrollView');
export const Image = mockComponent('Image');
export const TextInput = mockComponent('TextInput');

export const StyleSheet = {
  create: (styles) => styles,
  compose: (style1, style2) => [style1, style2],
  flatten: (styles) => {
    if (Array.isArray(styles)) {
      return styles.reduce((acc, style) => ({ ...acc, ...style }), {});
    }
    return styles || {};
  },
  hairlineWidth: 1,
  absoluteFill: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  absoluteFillObject: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
};

export const Dimensions = {
  get: jest.fn(() => ({ width: 375, height: 812 })),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  set: jest.fn(),
};

export const Platform = {
  OS: 'ios',
  Version: '11.0',
  select: (obj) => obj.ios,
};

export const Alert = {
  alert: jest.fn(),
};

export const PixelRatio = {
  get: () => 2,
  getFontScale: () => 2,
  getPixelSizeForLayoutSize: (size) => size * 2,
  roundToNearestPixel: (size) => size,
};

export const Keyboard = {
  addListener: jest.fn(),
  removeListener: jest.fn(),
  removeAllListeners: jest.fn(),
  dismiss: jest.fn(),
};

export const BackHandler = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

export const Linking = {
  openURL: jest.fn(),
  canOpenURL: jest.fn(() => Promise.resolve(true)),
  getInitialURL: jest.fn(() => Promise.resolve(null)),
};

export const StatusBar = mockComponent('StatusBar');

export const AppState = {
  currentState: 'active',
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

export const Animated = {
  Value: jest.fn(() => ({
    addListener: jest.fn(),
    removeListener: jest.fn(),
    removeAllListeners: jest.fn(),
    hasListeners: jest.fn(() => false),
    toJSON: jest.fn(() => 0),
    setValue: jest.fn(),
    setOffset: jest.fn(),
    flattenOffset: jest.fn(),
    extractOffset: jest.fn(),
    stopAnimation: jest.fn(),
    resetAnimation: jest.fn(),
    interpolate: jest.fn(() => ({
      addListener: jest.fn(),
      removeListener: jest.fn(),
      removeAllListeners: jest.fn(),
      hasListeners: jest.fn(() => false),
      toJSON: jest.fn(() => 0),
    })),
  })),
  timing: jest.fn(() => ({
    start: jest.fn(),
    stop: jest.fn(),
    reset: jest.fn(),
  })),
  spring: jest.fn(() => ({
    start: jest.fn(),
    stop: jest.fn(),
    reset: jest.fn(),
  })),
  decay: jest.fn(() => ({
    start: jest.fn(),
    stop: jest.fn(),
    reset: jest.fn(),
  })),
  sequence: jest.fn(() => ({
    start: jest.fn(),
    stop: jest.fn(),
    reset: jest.fn(),
  })),
  parallel: jest.fn(() => ({
    start: jest.fn(),
    stop: jest.fn(),
    reset: jest.fn(),
  })),
  stagger: jest.fn(() => ({
    start: jest.fn(),
    stop: jest.fn(),
    reset: jest.fn(),
  })),
  loop: jest.fn(() => ({
    start: jest.fn(),
    stop: jest.fn(),
    reset: jest.fn(),
  })),
  delay: jest.fn(() => ({
    start: jest.fn(),
    stop: jest.fn(),
    reset: jest.fn(),
  })),
  View: mockNativeComponent('Animated.View'),
  Text: mockNativeComponent('Animated.Text'),
  ScrollView: mockNativeComponent('Animated.ScrollView'),
  FlatList: mockNativeComponent('Animated.FlatList'),
  SectionList: mockNativeComponent('Animated.SectionList'),
  Image: mockNativeComponent('Animated.Image'),
  createAnimatedComponent: jest.fn(() => mockComponent('AnimatedComponent')),
  event: jest.fn(() => jest.fn()),
  forkEvent: jest.fn(),
  unforkEvent: jest.fn(),
};

// Default export
export default {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  ScrollView,
  Image,
  TextInput,
  StyleSheet,
  Dimensions,
  Platform,
  Alert,
  PixelRatio,
  Keyboard,
  BackHandler,
  Linking,
  StatusBar,
  AppState,
  Animated,
};
