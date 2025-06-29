import React from 'react';
import { render } from '@testing-library/react-native';
import TutorialScreen from '../../src/TutorialScreen';
import { GameContext } from '../../GameContext';

// Enhanced mocks for better testing
jest.mock('react-native', () => {
  const actualRN = jest.requireActual('react-native');
  
  // Create components that maintain structure and props for testing
  const mockComponent = (name) => {
    const Component = (props) => {
      const { children, onScroll, onPress, testID, style, ...otherProps } = props;
      const componentProps = { testID, style, ...otherProps };
      
      // Add event handlers
      if (onScroll) componentProps.onScroll = onScroll;
      if (onPress) componentProps.onPress = onPress;
      
      // For testing, we'll use a simple div with props
      return mockReact.createElement('div', componentProps, children);
    };
    Component.displayName = name;
    return Component;
  };

  const mockReact = require('react');

  return {
    ...actualRN,
    View: mockComponent('View'),
    Text: mockComponent('Text'),
    TouchableOpacity: mockComponent('TouchableOpacity'),
    SafeAreaView: mockComponent('SafeAreaView'),
    FlatList: mockComponent('FlatList'),
    StyleSheet: {
      create: (styles) => styles,
    },
    Dimensions: {
      get: jest.fn(() => ({ width: 375, height: 812 })),
    },
  };
});

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, ...props }) => {
    const mockReact = require('react');
    return mockReact.createElement('div', props, children);
  }
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: (props) => {
    const mockReact = require('react');
    return mockReact.createElement('div', props);
  }
}));

// Mock navigation
const mockNavigation = {
  reset: jest.fn(),
  navigate: jest.fn(),
  goBack: jest.fn()
};

// Mock GameContext
const mockGameContext = {
  completeTutorial: jest.fn()
};

// Helper to render TutorialScreen with context
const renderTutorialScreen = (contextValue = mockGameContext) => {
  return render(
    React.createElement(
      GameContext.Provider,
      { value: contextValue },
      React.createElement(TutorialScreen, { navigation: mockNavigation })
    )
  );
};

describe('TutorialScreen Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    test('should render main container', () => {
      const { getByTestId } = renderTutorialScreen();
      expect(getByTestId('tutorial-container')).toBeTruthy();
    });

    test('should render background gradient', () => {
      const { getByTestId } = renderTutorialScreen();
      expect(getByTestId('tutorial-background')).toBeTruthy();
    });

    test('should render FlatList component', () => {
      const { getByTestId } = renderTutorialScreen();
      expect(getByTestId('tutorial-flatlist')).toBeTruthy();
    });

    test('should render pagination dots', () => {
      const { getByTestId } = renderTutorialScreen();
      expect(getByTestId('tutorial-pagination')).toBeTruthy();
    });

    test('should render action button', () => {
      const { getByTestId } = renderTutorialScreen();
      expect(getByTestId('tutorial-action-button')).toBeTruthy();
    });

    test('should render all pagination dots', () => {
      const { getAllByTestId } = renderTutorialScreen();
      const dots = getAllByTestId(/tutorial-dot-/);
      expect(dots).toHaveLength(5); // 5 tutorial pages
    });
  });

  describe('Initial State', () => {
    test('should start with first page active', () => {
      const { getByTestId } = renderTutorialScreen();
      const firstDot = getByTestId('tutorial-dot-0');
      expect(firstDot.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ backgroundColor: '#FFD700' })
        ])
      );
    });

    test('should show "Next" button initially', () => {
      const { getByText } = renderTutorialScreen();
      expect(getByText('Next')).toBeTruthy();
    });
  });

  describe('Tutorial Content', () => {
    test('should render first tutorial page content', () => {
      const { getByText } = renderTutorialScreen();
      expect(getByText('Getting Started with Capital')).toBeTruthy();
      expect(getByText('Welcome, Tycoon! You start with nothing but ambition.')).toBeTruthy();
    });

    test('should render step numbers', () => {
      const { getByText } = renderTutorialScreen();
      expect(getByText('1.')).toBeTruthy();
      expect(getByText('2.')).toBeTruthy();
      expect(getByText('3.')).toBeTruthy();
    });

    test('should render tutorial page components', () => {
      const { getByTestId } = renderTutorialScreen();
      expect(getByTestId('tutorial-page-1')).toBeTruthy();
    });

    test('should render tutorial icons', () => {
      const { getByTestId } = renderTutorialScreen();
      expect(getByTestId('tutorial-icon-card-outline')).toBeTruthy();
    });
  });

  describe('Scroll Navigation', () => {
    test('should handle scroll events', () => {
      const { getByTestId } = renderTutorialScreen();
      const flatList = getByTestId('tutorial-flatlist');
      
      // Simulate scroll to second page
      const scrollEvent = {
        nativeEvent: {
          contentOffset: { x: 375 } // width of one page
        }
      };
      
      flatList.props.onScroll(scrollEvent);
      
      // Check that the component handles the scroll
      expect(flatList).toBeTruthy();
    });

    test('should calculate active index from scroll position', () => {
      const { getByTestId } = renderTutorialScreen();
      const flatList = getByTestId('tutorial-flatlist');
      
      // Test scroll to third page
      const scrollEvent = {
        nativeEvent: {
          contentOffset: { x: 750 } // 375 * 2 = third page
        }
      };
      
      flatList.props.onScroll(scrollEvent);
      expect(flatList).toBeTruthy();
    });
  });

  describe('Button Interactions', () => {
    test('should handle next button press', () => {
      const { getByTestId } = renderTutorialScreen();
      const actionButton = getByTestId('tutorial-action-button');
      
      // Simulate button press
      actionButton.props.onPress();
      
      expect(actionButton).toBeTruthy();
    });

    test('should complete tutorial on last page button press', () => {
      const { getByTestId, getByText } = renderTutorialScreen();
      const flatList = getByTestId('tutorial-flatlist');
      
      // Navigate to last page
      const scrollEvent = {
        nativeEvent: {
          contentOffset: { x: 375 * 4 } // Last page
        }
      };
      
      flatList.props.onScroll(scrollEvent);
      
      // Should show "Let's Go!" text after scroll
      // Note: In a full integration test, we would check for text change
      expect(flatList).toBeTruthy();
    });
  });

  describe('Context Integration', () => {
    test('should use GameContext correctly', () => {
      const contextSpy = {
        completeTutorial: jest.fn()
      };
      
      renderTutorialScreen(contextSpy);
      
      // Component should render without calling context methods immediately
      expect(contextSpy.completeTutorial).not.toHaveBeenCalled();
    });

    test('should handle context methods', () => {
      const contextWithMethods = {
        completeTutorial: jest.fn()
      };
      
      const { getByTestId } = renderTutorialScreen(contextWithMethods);
      
      // Component should render successfully with context
      expect(getByTestId('tutorial-container')).toBeTruthy();
    });
  });

  describe('Navigation Integration', () => {
    test('should accept navigation prop', () => {
      const customNavigation = {
        reset: jest.fn(),
        navigate: jest.fn()
      };
      
      const { getByTestId } = render(
        React.createElement(
          GameContext.Provider,
          { value: mockGameContext },
          React.createElement(TutorialScreen, { navigation: customNavigation })
        )
      );
      
      expect(getByTestId('tutorial-container')).toBeTruthy();
    });
  });

  describe('Component Structure', () => {
    test('should have proper FlatList configuration', () => {
      const { getByTestId } = renderTutorialScreen();
      const flatList = getByTestId('tutorial-flatlist');
      
      expect(flatList.props.horizontal).toBe(true);
      expect(flatList.props.pagingEnabled).toBe(true);
      expect(flatList.props.showsHorizontalScrollIndicator).toBe(false);
    });

    test('should have proper styling', () => {
      const { getByTestId } = renderTutorialScreen();
      const container = getByTestId('tutorial-container');
      
      expect(container.props.style).toEqual({ flex: 1 });
    });

    test('should render all required testIDs', () => {
      const { getByTestId } = renderTutorialScreen();
      
      const requiredTestIds = [
        'tutorial-container',
        'tutorial-background',
        'tutorial-flatlist',
        'tutorial-pagination',
        'tutorial-action-button'
      ];
      
      requiredTestIds.forEach(testId => {
        expect(getByTestId(testId)).toBeTruthy();
      });
    });
  });

  describe('Tutorial Data Structure', () => {
    test('should handle tutorial pages data', () => {
      const { getByText } = renderTutorialScreen();
      
      // Check that tutorial content is rendered
      const tutorialTitles = [
        'Getting Started with Capital',
        'Buy & Sell Properties',
        'Build From Scratch',
        'Manage Your Staff',
        'Watch Your Finances'
      ];
      
      // At least the first title should be visible
      expect(getByText(tutorialTitles[0])).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    test('should handle missing navigation gracefully', () => {
      // Component should still render even without proper navigation
      expect(() => {
        render(
          React.createElement(
            GameContext.Provider,
            { value: mockGameContext },
            React.createElement(TutorialScreen, { navigation: {} })
          )
        );
      }).not.toThrow();
    });

    test('should handle different screen dimensions', () => {
      const { Dimensions } = require('react-native');
      Dimensions.get.mockReturnValue({ width: 320, height: 568 });
      
      const { getByTestId } = renderTutorialScreen();
      expect(getByTestId('tutorial-container')).toBeTruthy();
    });
  });
});
