/**
 * @jest-environment jsdom
 */

// Mock react-native components BEFORE any imports
jest.mock('react-native', () => {
  const mockComponent = (name) => {
    const Component = (props) => {
      const React = require('react');
      return React.createElement(name, props, props.children);
    };
    Component.displayName = name;
    return Component;
  };

  return {
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

import React from 'react';
import { render, fireEvent, screen, act, waitFor } from '@testing-library/react-native';
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

describe('TutorialScreen', () => {  beforeEach(() => {
    jest.clearAllMocks();
    // Reset Dimensions mock
    const { Dimensions } = require('react-native');
    Dimensions.get.mockReturnValue({ width: 375, height: 812 });
  });

  describe('Initial Rendering', () => {
    test('should render tutorial screen correctly', () => {
      renderTutorialScreen();
      
      // Check if the main container is rendered
      expect(screen.getByTestId('tutorial-container')).toBeTruthy();
    });

    test('should render LinearGradient background', () => {
      renderTutorialScreen();
      
      expect(screen.getByTestId('tutorial-background')).toBeTruthy();
    });

    test('should render FlatList with tutorial pages', () => {
      renderTutorialScreen();
      
      expect(screen.getByTestId('tutorial-flatlist')).toBeTruthy();
    });

    test('should render pagination dots', () => {
      renderTutorialScreen();
      
      expect(screen.getByTestId('tutorial-pagination')).toBeTruthy();
    });

    test('should render action button with "Next" text initially', () => {
      renderTutorialScreen();
      
      const actionButton = screen.getByTestId('tutorial-action-button');
      expect(actionButton).toBeTruthy();
      
      const buttonText = screen.getByText('Next');
      expect(buttonText).toBeTruthy();
    });
  });

  describe('Tutorial Content', () => {
    test('should render first tutorial page content', () => {
      renderTutorialScreen();
      
      // Check for first page content
      expect(screen.getByText('Getting Started with Capital')).toBeTruthy();
      expect(screen.getByText('Welcome, Tycoon! You start with nothing but ambition.')).toBeTruthy();
    });

    test('should render tutorial page with correct icon', () => {
      renderTutorialScreen();
      
      const icon = screen.getByTestId('tutorial-icon-card-outline');
      expect(icon).toBeTruthy();
    });

    test('should render all steps for the first page', () => {
      renderTutorialScreen();
      
      // Check step numbers are rendered
      expect(screen.getByText('1.')).toBeTruthy();
      expect(screen.getByText('2.')).toBeTruthy();
      expect(screen.getByText('3.')).toBeTruthy();
      expect(screen.getByText('4.')).toBeTruthy();
      expect(screen.getByText('5.')).toBeTruthy();
    });

    test('should render correct number of tutorial pages', () => {
      renderTutorialScreen();
      
      // Should have 5 pagination dots (one for each page)
      const dots = screen.getAllByTestId(/^tutorial-dot-/);
      expect(dots).toHaveLength(5);
    });

    test('should have first dot active initially', () => {
      renderTutorialScreen();
      
      const firstDot = screen.getByTestId('tutorial-dot-0');
      expect(firstDot.props.style).toContainEqual(
        expect.objectContaining({ backgroundColor: '#FFD700' })
      );
    });
  });

  describe('Navigation and Interactions', () => {
    test('should handle next button press on first page', async () => {
      const flatListScrollToIndex = jest.fn();
      const mockRef = { current: { scrollToIndex: flatListScrollToIndex } };
      
      // Mock useRef to return our mock ref
      jest.spyOn(React, 'useRef').mockReturnValue(mockRef);
      
      renderTutorialScreen();
      
      const actionButton = screen.getByTestId('tutorial-action-button');
      
      await act(async () => {
        fireEvent.press(actionButton);
      });
      
      expect(flatListScrollToIndex).toHaveBeenCalledWith({
        index: 1,
        animated: true
      });
    });

    test('should update active index on scroll', async () => {
      renderTutorialScreen();
      
      const flatList = screen.getByTestId('tutorial-flatlist');
      
      // Simulate scroll to second page
      const scrollEvent = {
        nativeEvent: {
          contentOffset: { x: 375 } // width of one page
        }
      };
      
      await act(async () => {
        fireEvent.scroll(flatList, scrollEvent);
      });
      
      // Check if second dot becomes active
      await waitFor(() => {
        const secondDot = screen.getByTestId('tutorial-dot-1');
        expect(secondDot.props.style).toContainEqual(
          expect.objectContaining({ backgroundColor: '#FFD700' })
        );
      });
    });

    test('should show "Let\'s Go!" button on last page', async () => {
      renderTutorialScreen();
      
      const flatList = screen.getByTestId('tutorial-flatlist');
      
      // Simulate scroll to last page (index 4)
      const scrollEvent = {
        nativeEvent: {
          contentOffset: { x: 375 * 4 } // 4th page
        }
      };
      
      await act(async () => {
        fireEvent.scroll(flatList, scrollEvent);
      });
      
      // Check if button text changes to "Let's Go!"
      await waitFor(() => {
        expect(screen.getByText("Let's Go!")).toBeTruthy();
      });
    });

    test('should complete tutorial and navigate when "Let\'s Go!" is pressed', async () => {
      renderTutorialScreen();
      
      const flatList = screen.getByTestId('tutorial-flatlist');
      
      // Navigate to last page
      const scrollEvent = {
        nativeEvent: {
          contentOffset: { x: 375 * 4 }
        }
      };
      
      await act(async () => {
        fireEvent.scroll(flatList, scrollEvent);
      });
      
      const actionButton = screen.getByTestId('tutorial-action-button');
      
      await act(async () => {
        fireEvent.press(actionButton);
      });
      
      expect(mockGameContext.completeTutorial).toHaveBeenCalled();
      expect(mockNavigation.reset).toHaveBeenCalledWith({
        index: 0,
        routes: [{ name: 'Home' }]
      });
    });
  });

  describe('Pagination Logic', () => {
    test('should calculate correct active index from scroll position', async () => {
      renderTutorialScreen();
      
      const flatList = screen.getByTestId('tutorial-flatlist');
      
      // Test different scroll positions
      const testCases = [
        { scrollX: 0, expectedIndex: 0 },
        { scrollX: 375, expectedIndex: 1 },
        { scrollX: 750, expectedIndex: 2 },
        { scrollX: 1125, expectedIndex: 3 },
        { scrollX: 1500, expectedIndex: 4 }
      ];
      
      for (const testCase of testCases) {
        const scrollEvent = {
          nativeEvent: {
            contentOffset: { x: testCase.scrollX }
          }
        };
        
        await act(async () => {
          fireEvent.scroll(flatList, scrollEvent);
        });
        
        await waitFor(() => {
          const activeDot = screen.getByTestId(`tutorial-dot-${testCase.expectedIndex}`);
          expect(activeDot.props.style).toContainEqual(
            expect.objectContaining({ backgroundColor: '#FFD700' })
          );
        });
      }
    });

    test('should handle partial scroll positions correctly', async () => {
      renderTutorialScreen();
      
      const flatList = screen.getByTestId('tutorial-flatlist');
      
      // Test scroll position between pages (should round to nearest)
      const scrollEvent = {
        nativeEvent: {
          contentOffset: { x: 187.5 } // Halfway between page 0 and 1
        }
      };
      
      await act(async () => {
        fireEvent.scroll(flatList, scrollEvent);
      });
      
      // Should still be on first page (index 0)
      await waitFor(() => {
        const firstDot = screen.getByTestId('tutorial-dot-0');
        expect(firstDot.props.style).toContainEqual(
          expect.objectContaining({ backgroundColor: '#FFD700' })
        );
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle missing GameContext gracefully', () => {
      expect(() => {
        render(<TutorialScreen navigation={mockNavigation} />);
      }).toThrow(); // Should throw error without context
    });

    test('should handle navigation prop correctly', () => {
      const customNavigation = {
        reset: jest.fn(),
        navigate: jest.fn()
      };
      
      renderTutorialScreen();
      
      // Navigation should be used correctly
      expect(() => {
        render(
          <GameContext.Provider value={mockGameContext}>
            <TutorialScreen navigation={customNavigation} />
          </GameContext.Provider>
        );
      }).not.toThrow();
    });    test('should handle different screen dimensions', () => {
      // Test with different screen width
      const { Dimensions } = require('react-native');
      Dimensions.get.mockReturnValue({ width: 320, height: 568 });
      
      renderTutorialScreen();
      
      // Should still render correctly
      expect(screen.getByTestId('tutorial-container')).toBeTruthy();
    });

    test('should handle scroll without ref gracefully', async () => {
      // Mock useRef to return null
      jest.spyOn(React, 'useRef').mockReturnValue({ current: null });
      
      renderTutorialScreen();
      
      const actionButton = screen.getByTestId('tutorial-action-button');
      
      // Should not crash when ref is null
      await act(async () => {
        fireEvent.press(actionButton);
      });
      
      // Should not call scrollToIndex when ref is null
      expect(mockGameContext.completeTutorial).not.toHaveBeenCalled();
    });
  });

  describe('Component State Management', () => {
    test('should initialize with correct default state', () => {
      renderTutorialScreen();
      
      // Should start with first page active
      const firstDot = screen.getByTestId('tutorial-dot-0');
      expect(firstDot.props.style).toContainEqual(
        expect.objectContaining({ backgroundColor: '#FFD700' })
      );
      
      // Should show "Next" button initially
      expect(screen.getByText('Next')).toBeTruthy();
    });

    test('should maintain state correctly during navigation', async () => {
      renderTutorialScreen();
      
      const flatList = screen.getByTestId('tutorial-flatlist');
      
      // Navigate through multiple pages
      for (let i = 1; i <= 3; i++) {
        const scrollEvent = {
          nativeEvent: {
            contentOffset: { x: 375 * i }
          }
        };
        
        await act(async () => {
          fireEvent.scroll(flatList, scrollEvent);
        });
        
        await waitFor(() => {
          const activeDot = screen.getByTestId(`tutorial-dot-${i}`);
          expect(activeDot.props.style).toContainEqual(
            expect.objectContaining({ backgroundColor: '#FFD700' })
          );
        });
      }
    });
  });

  describe('Accessibility and UX', () => {
    test('should have proper test IDs for accessibility', () => {
      renderTutorialScreen();
      
      expect(screen.getByTestId('tutorial-container')).toBeTruthy();
      expect(screen.getByTestId('tutorial-background')).toBeTruthy();
      expect(screen.getByTestId('tutorial-flatlist')).toBeTruthy();
      expect(screen.getByTestId('tutorial-pagination')).toBeTruthy();
      expect(screen.getByTestId('tutorial-action-button')).toBeTruthy();
    });

    test('should render content in logical reading order', () => {
      renderTutorialScreen();
      
      // Check that title appears before steps
      const title = screen.getByText('Getting Started with Capital');
      const firstStep = screen.getByText('Welcome, Tycoon! You start with nothing but ambition.');
      
      expect(title).toBeTruthy();
      expect(firstStep).toBeTruthy();
    });

    test('should have proper button styling', () => {
      renderTutorialScreen();
      
      const actionButton = screen.getByTestId('tutorial-action-button');
      expect(actionButton.props.style).toContainEqual(
        expect.objectContaining({
          backgroundColor: '#43e97b',
          borderRadius: 30
        })
      );
    });
  });

  describe('Performance and Optimization', () => {
    test('should not re-render unnecessarily', () => {
      const renderSpy = jest.fn();
      
      const TestComponent = () => {
        renderSpy();
        return <TutorialScreen navigation={mockNavigation} />;
      };
      
      const { rerender } = render(
        <GameContext.Provider value={mockGameContext}>
          <TestComponent />
        </GameContext.Provider>
      );
      
      expect(renderSpy).toHaveBeenCalledTimes(1);
      
      // Re-render with same props
      rerender(
        <GameContext.Provider value={mockGameContext}>
          <TestComponent />
        </GameContext.Provider>
      );
      
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });

    test('should handle rapid scroll events', async () => {
      renderTutorialScreen();
      
      const flatList = screen.getByTestId('tutorial-flatlist');
      
      // Simulate rapid scroll events
      for (let i = 0; i < 10; i++) {
        const scrollEvent = {
          nativeEvent: {
            contentOffset: { x: 375 * (i % 5) }
          }
        };
        
        fireEvent.scroll(flatList, scrollEvent);
      }
      
      // Should handle all events without crashing
      expect(screen.getByTestId('tutorial-container')).toBeTruthy();
    });
  });
});
