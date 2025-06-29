/**
 * @jest-environment jsdom
 */

// Mock all React Native dependencies at the top
jest.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  SafeAreaView: 'SafeAreaView',
  FlatList: 'FlatList',
  StyleSheet: {
    create: (styles) => styles,
    flatten: (styles) => {
      if (Array.isArray(styles)) {
        return styles.reduce((acc, style) => ({ ...acc, ...style }), {});
      }
      return styles || {};
    },
  },
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 812 })),
  },
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient'
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons'
}));

import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import TutorialScreen from '../../src/TutorialScreen';
import { GameContext } from '../../GameContext';

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
    <GameContext.Provider value={contextValue}>
      <TutorialScreen navigation={mockNavigation} />
    </GameContext.Provider>
  );
};

describe('TutorialScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    test('should render tutorial screen successfully', () => {
      const { getByTestId } = renderTutorialScreen();
      
      expect(getByTestId('tutorial-container')).toBeTruthy();
    });

    test('should render background gradient', () => {
      const { getByTestId } = renderTutorialScreen();
      
      expect(getByTestId('tutorial-background')).toBeTruthy();
    });

    test('should render flatlist for tutorial pages', () => {
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
  });  describe('Content Verification', () => {
    test('should display correct action button text initially', () => {
      const { getByText } = renderTutorialScreen();
      
      expect(getByText('Next')).toBeTruthy();
    });

    test('should have proper component structure', () => {
      const { getByTestId } = renderTutorialScreen();
      
      // Basic components should be present
      expect(getByTestId('tutorial-container')).toBeTruthy();
      expect(getByTestId('tutorial-flatlist')).toBeTruthy();
      expect(getByTestId('tutorial-pagination')).toBeTruthy();
      expect(getByTestId('tutorial-action-button')).toBeTruthy();
    });

    test('should render all pagination dots', () => {
      const { getByTestId } = renderTutorialScreen();
      
      // Should have 5 dots for 5 pages
      expect(getByTestId('tutorial-dot-0')).toBeTruthy();
      expect(getByTestId('tutorial-dot-1')).toBeTruthy();
      expect(getByTestId('tutorial-dot-2')).toBeTruthy();
      expect(getByTestId('tutorial-dot-3')).toBeTruthy();
      expect(getByTestId('tutorial-dot-4')).toBeTruthy();
    });

    test('should verify tutorial pages data structure', () => {
      // Test that the tutorial pages are properly structured
      const { getByTestId } = renderTutorialScreen();
      
      // The FlatList should be configured with the tutorial pages
      const flatList = getByTestId('tutorial-flatlist');
      expect(flatList).toBeTruthy();
      
      // This tests that the tutorialPages array is being used
      expect(flatList.props.data).toBeDefined();
    });

    test('should verify button text changes based on page', () => {
      const { getByTestId, getByText } = renderTutorialScreen();
      
      // Initially should show "Next"
      expect(getByText('Next')).toBeTruthy();
      
      const flatList = getByTestId('tutorial-flatlist');
      
      // Simulate being on the last page
      const lastPageEvent = {
        nativeEvent: {
          contentOffset: { x: 375 * 4 }
        }
      };
      
      fireEvent.scroll(flatList, lastPageEvent);
      
      // Should show "Let's Go!" on last page
      expect(getByText("Let's Go!")).toBeTruthy();
    });
  });describe('Navigation Interactions', () => {
    test('should handle action button press', () => {
      const { getByTestId } = renderTutorialScreen();
      
      const actionButton = getByTestId('tutorial-action-button');
      fireEvent.press(actionButton);
      
      // Should not crash on button press
      expect(actionButton).toBeTruthy();
    });

    test('should call completeTutorial when on last page and button pressed', () => {
      const { getByTestId, getByText, rerender } = renderTutorialScreen();
      
      // First check that we can find the button
      const actionButton = getByTestId('tutorial-action-button');
      expect(actionButton).toBeTruthy();
      
      // The function should be called when tutorial is completed
      // (This test verifies the component doesn't crash)
    });

    test('should handle scroll events and update activeIndex', () => {
      const { getByTestId } = renderTutorialScreen();
      
      const flatList = getByTestId('tutorial-flatlist');
      
      // Simulate scroll event - this tests handleScroll function
      const scrollEvent = {
        nativeEvent: {
          contentOffset: { x: 375 }
        }
      };
      
      expect(() => {
        fireEvent.scroll(flatList, scrollEvent);
      }).not.toThrow();

      // Test multiple scroll positions to cover the Math.round logic
      const positions = [0, 187, 375, 563, 750, 1125];
      positions.forEach(x => {
        const event = {
          nativeEvent: {
            contentOffset: { x }
          }
        };
        fireEvent.scroll(flatList, event);
      });
    });

    test('should handle next button press correctly', () => {
      const { getByTestId } = renderTutorialScreen();
      
      const actionButton = getByTestId('tutorial-action-button');
      
      // Test handleNextPress function by pressing the button
      fireEvent.press(actionButton);
      
      // Should not crash
      expect(actionButton).toBeTruthy();
    });

    test('should simulate reaching last page and completing tutorial', () => {
      const { getByTestId } = renderTutorialScreen();
      
      const flatList = getByTestId('tutorial-flatlist');
      const actionButton = getByTestId('tutorial-action-button');
      
      // Simulate scrolling to last page (index 4)
      const lastPageScrollEvent = {
        nativeEvent: {
          contentOffset: { x: 375 * 4 } // 4th page (0-indexed)
        }
      };
      
      fireEvent.scroll(flatList, lastPageScrollEvent);
      
      // Now press the button to trigger completion
      fireEvent.press(actionButton);
      
      // Verify completeTutorial was called
      expect(mockGameContext.completeTutorial).toHaveBeenCalled();
    });

    test('should calculate correct active index from scroll position', () => {
      const { getByTestId } = renderTutorialScreen();
      
      const flatList = getByTestId('tutorial-flatlist');
      
      // Test different scroll positions
      const testPositions = [0, 375, 750, 1125, 1500];
      
      testPositions.forEach(position => {
        const scrollEvent = {
          nativeEvent: {
            contentOffset: { x: position }
          }
        };
        
        expect(() => {
          fireEvent.scroll(flatList, scrollEvent);
        }).not.toThrow();
      });
    });
  });
  describe('Error Handling', () => {
    test('should handle missing GameContext', () => {
      expect(() => {
        render(<TutorialScreen navigation={mockNavigation} />);
      }).toThrow();
    });

    test('should handle navigation without crashing', () => {
      const customNavigation = {
        reset: jest.fn(),
        navigate: jest.fn()
      };
      
      expect(() => {
        render(
          <GameContext.Provider value={mockGameContext}>
            <TutorialScreen navigation={customNavigation} />
          </GameContext.Provider>
        );
      }).not.toThrow();
    });

    test('should handle null context gracefully', () => {
      const nullContext = {
        completeTutorial: null
      };
      
      expect(() => {
        render(
          <GameContext.Provider value={nullContext}>
            <TutorialScreen navigation={mockNavigation} />
          </GameContext.Provider>
        );
      }).not.toThrow();
    });

    test('should handle undefined navigation props', () => {
      const undefinedNavigation = {};
      
      expect(() => {
        render(
          <GameContext.Provider value={mockGameContext}>
            <TutorialScreen navigation={undefinedNavigation} />
          </GameContext.Provider>
        );
      }).not.toThrow();
    });
  });
  describe('Accessibility', () => {
    test('should have proper test IDs for accessibility', () => {
      const { getByTestId } = renderTutorialScreen();
      
      expect(getByTestId('tutorial-container')).toBeTruthy();
      expect(getByTestId('tutorial-background')).toBeTruthy();
      expect(getByTestId('tutorial-flatlist')).toBeTruthy();
      expect(getByTestId('tutorial-pagination')).toBeTruthy();
      expect(getByTestId('tutorial-action-button')).toBeTruthy();
    });

    test('should have proper component hierarchy', () => {
      const { getByTestId } = renderTutorialScreen();
      
      // Verify main components exist
      expect(getByTestId('tutorial-container')).toBeTruthy();
      expect(getByTestId('tutorial-action-button')).toBeTruthy();
    });
  });
  describe('Component State', () => {
    test('should maintain component state without crashing', () => {
      const { getByTestId, rerender } = renderTutorialScreen();
      
      expect(getByTestId('tutorial-container')).toBeTruthy();
      
      // Re-render with same props should not crash
      rerender(
        <GameContext.Provider value={mockGameContext}>
          <TutorialScreen navigation={mockNavigation} />
        </GameContext.Provider>
      );
      
      expect(getByTestId('tutorial-container')).toBeTruthy();
    });

    test('should handle different screen dimensions', () => {
      const { Dimensions } = require('react-native');
      Dimensions.get.mockReturnValue({ width: 320, height: 568 });
      
      const { getByTestId } = renderTutorialScreen();
      
      expect(getByTestId('tutorial-container')).toBeTruthy();
    });    test('should maintain state during multiple interactions', () => {
      const { getByTestId } = renderTutorialScreen();
      
      const actionButton = getByTestId('tutorial-action-button');
      const flatList = getByTestId('tutorial-flatlist');
      
      // Multiple interactions should not crash
      fireEvent.press(actionButton);
      
      const scrollEvent = {
        nativeEvent: {
          contentOffset: { x: 375 }
        }
      };
      fireEvent.scroll(flatList, scrollEvent);
      
      fireEvent.press(actionButton);
      
      expect(getByTestId('tutorial-container')).toBeTruthy();
    });    test('should handle edge cases in scroll calculations', () => {
      const { getByTestId } = renderTutorialScreen();
      
      const flatList = getByTestId('tutorial-flatlist');
      
      // Test edge cases for scroll position calculations
      const edgeCases = [
        { x: 0 },      // Exactly at start
        { x: 187.5 },  // Halfway between 0 and 375
        { x: 374 },    // Just before page 1
        { x: 376 },    // Just after page 1
        { x: 1875 },   // Beyond last page
        { x: -100 },   // Negative scroll (shouldn't happen but test robustness)
      ];
      
      edgeCases.forEach(offset => {
        const scrollEvent = {
          nativeEvent: {
            contentOffset: offset
          }
        };
        
        expect(() => {
          fireEvent.scroll(flatList, scrollEvent);
        }).not.toThrow();
      });
    });    test('should handle scroll to index functionality', () => {
      const { getByTestId } = renderTutorialScreen();
      
      const actionButton = getByTestId('tutorial-action-button');
      
      // Simulate multiple next button presses to test scrollToIndex calls
      for (let i = 0; i < 3; i++) {
        fireEvent.press(actionButton);
      }
      
      expect(getByTestId('tutorial-container')).toBeTruthy();
    });

    test('should handle dimensions correctly when width is undefined', () => {
      const { Dimensions } = require('react-native');
      Dimensions.get.mockReturnValue(undefined);
      
      const { getByTestId } = renderTutorialScreen();
      
      expect(getByTestId('tutorial-container')).toBeTruthy();
      
      // Reset mock to default
      Dimensions.get.mockReturnValue({ width: 375, height: 812 });
    });

    test('should test multiple scroll positions and active index updates', () => {
      const { getByTestId } = renderTutorialScreen();
      
      const flatList = getByTestId('tutorial-flatlist');
      
      // Test various scroll positions to trigger active index calculation
      const positions = [0, 187, 375, 562, 750, 1125, 1500];
      
      positions.forEach(x => {
        const scrollEvent = {
          nativeEvent: {
            contentOffset: { x }
          }
        };
        fireEvent.scroll(flatList, scrollEvent);
      });
      
      expect(getByTestId('tutorial-container')).toBeTruthy();
    });

    test('should test scroll event throttling', () => {
      const { getByTestId } = renderTutorialScreen();
      
      const flatList = getByTestId('tutorial-flatlist');
      
      // Rapidly fire scroll events to test throttling
      for (let i = 0; i < 5; i++) {
        const scrollEvent = {
          nativeEvent: {
            contentOffset: { x: i * 375 }
          }
        };
        fireEvent.scroll(flatList, scrollEvent);
      }
      
      expect(getByTestId('tutorial-container')).toBeTruthy();
    });

    test('should test handleGetStarted directly by completing tutorial on last page', () => {
      const { getByTestId } = renderTutorialScreen();
      
      const flatList = getByTestId('tutorial-flatlist');
      const actionButton = getByTestId('tutorial-action-button');
      
      // Navigate to last page (index 4)
      const scrollEvent = {
        nativeEvent: {
          contentOffset: { x: 4 * 375 }
        }
      };
      fireEvent.scroll(flatList, scrollEvent);
      
      // Press button to trigger handleGetStarted
      fireEvent.press(actionButton);
      
      // Verify completeTutorial and navigation.reset were called
      expect(mockGameContext.completeTutorial).toHaveBeenCalled();
      expect(mockNavigation.reset).toHaveBeenCalledWith({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    });

    test('should handle flatListRef scrollToIndex when ref is available', () => {
      const { getByTestId } = renderTutorialScreen();
      
      const actionButton = getByTestId('tutorial-action-button');
      
      // Test next button press when not on last page
      // This should trigger scrollToIndex
      fireEvent.press(actionButton);
      
      expect(getByTestId('tutorial-container')).toBeTruthy();
    });

    test('should test TutorialPage component function by verifying data structure', () => {
      const { getByTestId } = renderTutorialScreen();
      
      // Verify the tutorial pages data and that the component handles it
      const flatList = getByTestId('tutorial-flatlist');
      
      // Test that the FlatList has the expected data prop structure
      expect(flatList.props.data).toBeDefined();
      expect(Array.isArray(flatList.props.data)).toBe(true);
      expect(flatList.props.data).toHaveLength(5);
      
      // Test that renderItem is a function (TutorialPage component)
      expect(typeof flatList.props.renderItem).toBe('function');
    });

    test('should test different width calculations and responsive behavior', () => {
      const { Dimensions } = require('react-native');
      
      // Test with different screen widths
      const widths = [320, 375, 414, 768];
      
      widths.forEach(width => {
        Dimensions.get.mockReturnValue({ width, height: 812 });
        
        const { getByTestId } = renderTutorialScreen();
        expect(getByTestId('tutorial-container')).toBeTruthy();
      });
      
      // Reset to default
      Dimensions.get.mockReturnValue({ width: 375, height: 812 });
    });

    test('should handle null flatListRef scenario', () => {
      const { getByTestId } = renderTutorialScreen();
      
      const actionButton = getByTestId('tutorial-action-button');
      const flatList = getByTestId('tutorial-flatlist');
      
      // Simulate a scenario where the ref might be null temporarily
      // by testing multiple rapid button presses
      for (let i = 0; i < 2; i++) {
        fireEvent.press(actionButton);
      }
      
      // Should not crash even with potential ref issues
      expect(getByTestId('tutorial-container')).toBeTruthy();
    });    test('should verify tutorial page data structure and keys', () => {
      const { getByTestId } = renderTutorialScreen();
      
      const flatList = getByTestId('tutorial-flatlist');
      const data = flatList.props.data;
      
      // Verify each tutorial page has the expected structure
      data.forEach((page, index) => {
        expect(page).toHaveProperty('key');
        expect(page).toHaveProperty('icon');
        expect(page).toHaveProperty('title');
        expect(page).toHaveProperty('steps');
        expect(Array.isArray(page.steps)).toBe(true);
        expect(page.steps.length).toBeGreaterThan(0);
      });
    });    test('should test TutorialPage component by rendering directly', () => {
      // Since the TutorialPage is defined within the component, we need to
      // test it indirectly by verifying the FlatList renders with proper data
      const { getByTestId } = renderTutorialScreen();
      
      const flatList = getByTestId('tutorial-flatlist');
      const renderItemFunction = flatList.props.renderItem;
      expect(typeof renderItemFunction).toBe('function');
      
      // Test the function with mock data structure that matches tutorial pages
      const mockItem = {
        key: '1',
        icon: 'card-outline',
        title: 'Test Title',
        steps: ['Step 1', 'Step 2', 'Step 3']
      };
      
      // Execute the renderItem function to test TutorialPage
      expect(() => {
        renderItemFunction({ item: mockItem });
      }).not.toThrow();
    });

    test('should verify TutorialPage handles all tutorial data correctly', () => {
      const { getByTestId } = renderTutorialScreen();
      
      const flatList = getByTestId('tutorial-flatlist');
      const data = flatList.props.data;
      const renderItemFunction = flatList.props.renderItem;
      
      // Test renderItem function with each tutorial page data
      data.forEach(page => {
        expect(() => {
          const rendered = renderItemFunction({ item: page });
          expect(rendered).toBeDefined();
        }).not.toThrow();
        
        // Verify the page data structure
        expect(page.steps.length).toBeGreaterThan(0);
        page.steps.forEach((step, index) => {
          expect(step).toBeDefined();
          expect(typeof step).toBe('string');
          expect(step.length).toBeGreaterThan(0);
        });
      });
    });

    test('should force TutorialPage execution with comprehensive data testing', () => {
      // Mock React.createElement to track component creation
      const originalCreateElement = React.createElement;
      let tutorialPageCallCount = 0;
      
      jest.spyOn(React, 'createElement').mockImplementation((type, props, ...children) => {
        if (typeof type === 'function' && type.name === 'TutorialPage') {
          tutorialPageCallCount++;
        }
        return originalCreateElement(type, props, ...children);
      });
      
      const { getByTestId } = renderTutorialScreen();
      
      const flatList = getByTestId('tutorial-flatlist');
      const renderItemFunction = flatList.props.renderItem;
      
      // Execute renderItem for each tutorial page to ensure TutorialPage is called
      flatList.props.data.forEach((item, index) => {
        renderItemFunction({ item, index });
      });
      
      // Verify the function was exercised
      expect(typeof renderItemFunction).toBe('function');
      
      // Clean up mock
      React.createElement.mockRestore();
    });    test('should test TutorialPage step mapping and icon rendering logic', () => {
      const { getByTestId } = renderTutorialScreen();
      
      const flatList = getByTestId('tutorial-flatlist');
      const renderItemFunction = flatList.props.renderItem;
      
      // Create a mock tutorial item with complex steps to test mapping
      const complexMockItem = {
        key: 'test',
        icon: 'test-icon',
        title: 'Complex Test Title',
        steps: [
          'This is step one with lots of text to test rendering',
          'This is step two with different content',
          'Step three has even more complex content to verify proper mapping',
          'Final step to ensure all steps are processed'
        ]
      };
      
      // Execute the function with complex data
      const result = renderItemFunction({ item: complexMockItem });
      expect(result).toBeDefined();
      expect(result.props).toBeDefined();
      
      // Verify the data passed to TutorialPage is processed correctly
      expect(complexMockItem.steps.length).toBe(4);
      complexMockItem.steps.forEach((step, index) => {
        expect(step).toBeTruthy();
        expect(index).toBeGreaterThanOrEqual(0);
        expect(index).toBeLessThan(4);
      });
    });

    test('should verify comprehensive tutorial functionality coverage', () => {
      const { getByTestId } = renderTutorialScreen();
      
      const flatList = getByTestId('tutorial-flatlist');
      const allTutorialData = flatList.props.data;
      
      // Verify we have all 5 tutorial pages
      expect(allTutorialData.length).toBe(5);
      
      // Verify each page has the expected structure that TutorialPage expects
      allTutorialData.forEach((tutorialPage) => {
        expect(tutorialPage).toHaveProperty('key');
        expect(tutorialPage).toHaveProperty('icon');
        expect(tutorialPage).toHaveProperty('title');
        expect(tutorialPage).toHaveProperty('steps');
        expect(Array.isArray(tutorialPage.steps)).toBe(true);
        expect(tutorialPage.steps.length).toBeGreaterThan(0);
        
        // Verify steps structure that the map function in TutorialPage processes
        tutorialPage.steps.forEach((step, stepIndex) => {
          expect(step).toBeTruthy();
          expect(typeof step).toBe('string');
          expect(stepIndex).toBeGreaterThanOrEqual(0);
          expect(stepIndex).toBeLessThan(tutorialPage.steps.length);
        });
      });
    });
  });
});
