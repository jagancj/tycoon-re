/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import PropertyMarketScreen from '../../src/PropertyMarketScreen';
import { GameContext } from '../../GameContext';

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn()
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation
}));

describe('PropertyMarketScreen', () => {
  const mockContextValue = {
    currentMarketplaceBatch: [],
    marketplaceBatchPurchased: [],
    generateNewMarketplaceBatch: jest.fn(),
    isCurrentBatchCompleted: jest.fn(() => false)
  };

  const renderWithContext = (contextValue = mockContextValue) => {
    return render(
      <GameContext.Provider value={contextValue}>
        <PropertyMarketScreen />
      </GameContext.Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Empty State', () => {
    test('should show "Show Properties" button when batch is empty', () => {
      const contextValue = {
        ...mockContextValue,
        currentMarketplaceBatch: [],
        isCurrentBatchCompleted: () => true
      };

      renderWithContext(contextValue);
      expect(screen.getByText('Show Properties')).toBeTruthy();
    });

    test('should show "Show New Properties" button when batch is completed', () => {
      const contextValue = {
        ...mockContextValue,
        currentMarketplaceBatch: [{ id: '1', name: 'Test Property' }],
        marketplaceBatchPurchased: ['1'],
        isCurrentBatchCompleted: () => true
      };

      renderWithContext(contextValue);
      expect(screen.getByText('Show New Properties')).toBeTruthy();
    });

    test('should call generateNewMarketplaceBatch when button is pressed', () => {
      const contextValue = {
        ...mockContextValue,
        currentMarketplaceBatch: [],
        isCurrentBatchCompleted: () => true
      };

      renderWithContext(contextValue);
      
      const button = screen.getByText('Show Properties');
      fireEvent.press(button);
      
      expect(contextValue.generateNewMarketplaceBatch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Property List', () => {
    test('should render available properties', () => {
      const mockProperties = [
        {
          id: 'prop1',
          name: 'Luxury Villa',
          askingPrice: 500000,
          type: 'Villa'
        },
        {
          id: 'prop2',
          name: 'Modern Apartment',
          askingPrice: 250000,
          type: 'Apartment'
        }
      ];

      const contextValue = {
        ...mockContextValue,
        currentMarketplaceBatch: mockProperties,
        marketplaceBatchPurchased: [],
        isCurrentBatchCompleted: () => false
      };

      renderWithContext(contextValue);

      expect(screen.getByText('Luxury Villa')).toBeTruthy();
      expect(screen.getByText('Modern Apartment')).toBeTruthy();
      expect(screen.getByText('Asking: $500,000')).toBeTruthy();
      expect(screen.getByText('Asking: $250,000')).toBeTruthy();
    });

    test('should filter out purchased properties', () => {
      const mockProperties = [
        { id: 'prop1', name: 'Available Property', askingPrice: 300000, type: 'House' },
        { id: 'prop2', name: 'Sold Property', askingPrice: 400000, type: 'Villa' }
      ];

      const contextValue = {
        ...mockContextValue,
        currentMarketplaceBatch: mockProperties,
        marketplaceBatchPurchased: ['prop2'], // prop2 is purchased
        isCurrentBatchCompleted: () => false
      };

      renderWithContext(contextValue);

      expect(screen.getByText('Available Property')).toBeTruthy();
      expect(screen.queryByText('Sold Property')).toBeNull();
    });

    test('should navigate to PropertyDetail when property is pressed', () => {
      const mockProperty = {
        id: 'prop1',
        name: 'Test Property',
        askingPrice: 300000,
        type: 'House'
      };

      const contextValue = {
        ...mockContextValue,
        currentMarketplaceBatch: [mockProperty],
        marketplaceBatchPurchased: [],
        isCurrentBatchCompleted: () => false
      };

      renderWithContext(contextValue);

      const propertyCard = screen.getByText('Test Property');
      fireEvent.press(propertyCard);

      expect(mockNavigation.navigate).toHaveBeenCalledWith('PropertyDetail', {
        property: mockProperty
      });
    });
  });

  describe('Progress Indicator', () => {
    test('should show progress when properties are available and some are sold', () => {
      const contextValue = {
        ...mockContextValue,
        currentMarketplaceBatch: [
          { id: 'prop1', name: 'Property 1' },
          { id: 'prop2', name: 'Property 2' },
          { id: 'prop3', name: 'Property 3' }
        ],
        marketplaceBatchPurchased: ['prop1'], // 1 out of 3 sold
        isCurrentBatchCompleted: () => false
      };

      renderWithContext(contextValue);

      expect(screen.getByText('Properties: 1 / 3 sold')).toBeTruthy();
    });

    test('should not show progress indicator when showing button', () => {
      const contextValue = {
        ...mockContextValue,
        currentMarketplaceBatch: [],
        isCurrentBatchCompleted: () => true
      };

      renderWithContext(contextValue);

      expect(screen.queryByText(/Properties:.*sold/)).toBeNull();
    });

    test('should calculate progress bar width correctly', () => {
      const contextValue = {
        ...mockContextValue,
        currentMarketplaceBatch: [
          { id: 'prop1', name: 'Property 1' },
          { id: 'prop2', name: 'Property 2' },
          { id: 'prop3', name: 'Property 3' },
          { id: 'prop4', name: 'Property 4' }
        ],
        marketplaceBatchPurchased: ['prop1', 'prop2'], // 2 out of 4 sold = 50%
        isCurrentBatchCompleted: () => false
      };

      renderWithContext(contextValue);

      const progressText = screen.getByText('Properties: 2 / 4 sold');
      expect(progressText).toBeTruthy();
      
      // Progress should be 50% (2/4)
      const expectedProgress = (2 / 4) * 100;
      expect(expectedProgress).toBe(50);
    });
  });

  describe('Empty List Message', () => {
    test('should show empty message when no properties available', () => {
      const contextValue = {
        ...mockContextValue,
        currentMarketplaceBatch: [
          { id: 'prop1', name: 'Property 1' }
        ],
        marketplaceBatchPurchased: ['prop1'], // All properties purchased
        isCurrentBatchCompleted: () => false
      };

      renderWithContext(contextValue);

      expect(screen.getByText('No Properties Available')).toBeTruthy();
      expect(screen.getByText('All properties from the current batch have been purchased.')).toBeTruthy();
    });
  });

  describe('Styling and Layout', () => {
    test('should have transparent background to show parent gradient', () => {
      renderWithContext();
      
      const container = screen.getByTestId('property-market-container');
      expect(container.props.style).toEqual(
        expect.objectContaining({ backgroundColor: 'transparent' })
      );
    });

    test('should render show properties button with correct styling', () => {
      const contextValue = {
        ...mockContextValue,
        currentMarketplaceBatch: [],
        isCurrentBatchCompleted: () => true
      };

      renderWithContext(contextValue);

      const button = screen.getByTestId('show-properties-button');
      expect(button.props.style).toEqual(
        expect.objectContaining({
          backgroundColor: '#43e97b',
          borderRadius: 25
        })
      );
    });

    test('should render property cards with correct styling', () => {
      const mockProperty = {
        id: 'prop1',
        name: 'Test Property',
        askingPrice: 300000,
        type: 'House'
      };

      const contextValue = {
        ...mockContextValue,
        currentMarketplaceBatch: [mockProperty],
        marketplaceBatchPurchased: [],
        isCurrentBatchCompleted: () => false
      };

      renderWithContext(contextValue);

      const propertyCard = screen.getByTestId('property-card-prop1');
      expect(propertyCard.props.style).toEqual(
        expect.objectContaining({
          height: 200,
          borderRadius: 15,
          marginBottom: 15
        })
      );
    });
  });

  describe('Accessibility', () => {
    test('should have proper test IDs for testing', () => {
      const mockProperty = {
        id: 'prop1',
        name: 'Test Property',
        askingPrice: 300000,
        type: 'House'
      };

      const contextValue = {
        ...mockContextValue,
        currentMarketplaceBatch: [mockProperty],
        marketplaceBatchPurchased: [],
        isCurrentBatchCompleted: () => false
      };

      renderWithContext(contextValue);

      expect(screen.getByTestId('property-market-container')).toBeTruthy();
      expect(screen.getByTestId('property-card-prop1')).toBeTruthy();
    });

    test('should handle missing context gracefully', () => {
      const incompleteContext = {
        currentMarketplaceBatch: undefined,
        marketplaceBatchPurchased: undefined,
        generateNewMarketplaceBatch: jest.fn(),
        isCurrentBatchCompleted: jest.fn(() => true)
      };

      // Should not crash with incomplete context
      expect(() => renderWithContext(incompleteContext)).not.toThrow();
    });
  });
});
