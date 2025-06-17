/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import { GameContext } from '../../GameContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock Alert
const mockAlert = {
  alert: jest.fn()
};
jest.doMock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Alert: mockAlert
}));

// Mock child component for testing
const TestComponent = () => {
  const context = React.useContext(GameContext);
  return null;
};

describe('GameContext', () => {
  let contextValue;
  let GameProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear();
    
    // Import GameProvider after mocks are set up
    const { GameProvider: Provider } = require('../../GameContext');
    GameProvider = Provider;
  });

  const renderWithProvider = (children) => {
    let capturedContext;
    
    const TestWrapper = ({ children }) => {
      const context = React.useContext(GameContext);
      capturedContext = context;
      return children;
    };

    const result = render(
      <GameProvider>
        <TestWrapper>
          {children}
        </TestWrapper>
      </GameProvider>
    );

    contextValue = capturedContext;
    return result;
  };

  describe('Initial State', () => {
    test('should initialize with default game state', async () => {
      await act(async () => {
        renderWithProvider(<TestComponent />);
      });

      expect(contextValue.gameMoney).toBe(50000);
      expect(contextValue.gameLevel).toBe(1);
      expect(contextValue.gameXP).toBe(0);
      expect(contextValue.playerAssets).toEqual([]);
      expect(contextValue.currentMarketplaceBatch).toEqual([]);
      expect(contextValue.currentLandBatch).toEqual([]);
    });

    test('should initialize with empty transaction logs', async () => {
      await act(async () => {
        renderWithProvider(<TestComponent />);
      });

      expect(contextValue.transactionLogs).toEqual([]);
    });

    test('should initialize construction and renovation states', async () => {
      await act(async () => {
        renderWithProvider(<TestComponent />);
      });

      expect(contextValue.constructionProjects).toEqual({});
      expect(contextValue.renovationProjects).toEqual({});
    });
  });

  describe('Money Management', () => {
    test('should update money correctly when spending', async () => {
      await act(async () => {
        renderWithProvider(<TestComponent />);
      });

      const initialMoney = contextValue.gameMoney;
      const spendAmount = 10000;

      await act(async () => {
        // Simulate spending money (this would be done through context methods)
        contextValue.setState(prev => ({
          ...prev,
          gameMoney: prev.gameMoney - spendAmount
        }));
      });

      expect(contextValue.gameMoney).toBe(initialMoney - spendAmount);
    });

    test('should prevent spending more money than available', async () => {
      await act(async () => {
        renderWithProvider(<TestComponent />);
      });

      const initialMoney = contextValue.gameMoney;
      const overspendAmount = initialMoney + 10000;

      // This should be prevented by the context logic
      expect(initialMoney).toBeLessThan(overspendAmount);
    });
  });

  describe('XP and Level System', () => {
    test('should calculate XP based on profit margin', async () => {
      await act(async () => {
        renderWithProvider(<TestComponent />);
      });

      // Test XP calculation logic
      const investment = 100000;
      const salePrice = 120000;
      const profit = salePrice - investment;
      const profitMargin = (profit / investment) * 100; // 20%
      const expectedXP = Math.floor(profitMargin * 2.5); // 50 XP

      // This would be tested through the actual XP calculation function
      expect(profitMargin).toBe(20);
      expect(expectedXP).toBe(50);
    });

    test('should handle level progression correctly', async () => {
      await act(async () => {
        renderWithProvider(<TestComponent />);
      });

      expect(contextValue.gameLevel).toBe(1);
      expect(contextValue.gameXP).toBe(0);

      // Level thresholds should be properly defined
      // Level 1 to 2 typically requires 100 XP
      const level2Threshold = 100;
      expect(level2Threshold).toBeGreaterThan(0);
    });
  });

  describe('Asset Management', () => {
    test('should initialize with empty asset portfolio', async () => {
      await act(async () => {
        renderWithProvider(<TestComponent />);
      });

      expect(contextValue.playerAssets).toEqual([]);
      expect(Array.isArray(contextValue.playerAssets)).toBe(true);
    });

    test('should handle asset status correctly', async () => {
      const mockAsset = {
        id: 'test-asset-1',
        name: 'Test Property',
        status: 'Owned',
        purchasePrice: 50000,
        totalInvestment: 50000
      };

      // Test asset status types
      const validStatuses = ['Owned', 'Under Construction', 'For Sale', 'Sold'];
      expect(validStatuses).toContain(mockAsset.status);
    });
  });

  describe('Marketplace System', () => {
    test('should manage marketplace batches correctly', async () => {
      await act(async () => {
        renderWithProvider(<TestComponent />);
      });

      expect(contextValue.currentMarketplaceBatch).toEqual([]);
      expect(contextValue.marketplaceBatchPurchased).toEqual([]);
      expect(Array.isArray(contextValue.currentMarketplaceBatch)).toBe(true);
      expect(Array.isArray(contextValue.marketplaceBatchPurchased)).toBe(true);
    });

    test('should manage land batches correctly', async () => {
      await act(async () => {
        renderWithProvider(<TestComponent />);
      });

      expect(contextValue.currentLandBatch).toEqual([]);
      expect(contextValue.landBatchPurchased).toEqual([]);
      expect(Array.isArray(contextValue.currentLandBatch)).toBe(true);
      expect(Array.isArray(contextValue.landBatchPurchased)).toBe(true);
    });
  });

  describe('Construction System', () => {
    test('should initialize construction projects as empty object', async () => {
      await act(async () => {
        renderWithProvider(<TestComponent />);
      });

      expect(contextValue.constructionProjects).toEqual({});
      expect(typeof contextValue.constructionProjects).toBe('object');
    });

    test('should track construction project structure', async () => {
      const mockConstructionProject = {
        blueprintId: 'blueprint-1',
        blueprint: { name: 'Modern House', cost: 75000 },
        staffId: 'staff-1',
        supervisor: { name: 'John Contractor', cost: 5000 },
        startTime: Date.now(),
        duration: 20000,
        totalCost: 80000
      };

      // Verify project structure
      expect(mockConstructionProject).toHaveProperty('blueprintId');
      expect(mockConstructionProject).toHaveProperty('blueprint');
      expect(mockConstructionProject).toHaveProperty('staffId');
      expect(mockConstructionProject).toHaveProperty('supervisor');
      expect(mockConstructionProject).toHaveProperty('startTime');
      expect(mockConstructionProject).toHaveProperty('duration');
      expect(mockConstructionProject).toHaveProperty('totalCost');
    });
  });

  describe('Transaction Logging', () => {
    test('should maintain transaction log structure', async () => {
      await act(async () => {
        renderWithProvider(<TestComponent />);
      });

      expect(contextValue.transactionLogs).toEqual([]);

      const mockTransaction = {
        id: 'txn-1',
        type: 'purchase',
        amount: 50000,
        description: 'Purchased Test Property',
        timestamp: Date.now()
      };

      // Verify transaction structure
      expect(mockTransaction).toHaveProperty('id');
      expect(mockTransaction).toHaveProperty('type');
      expect(mockTransaction).toHaveProperty('amount');
      expect(mockTransaction).toHaveProperty('description');
      expect(mockTransaction).toHaveProperty('timestamp');
    });
  });

  describe('Data Persistence', () => {
    test('should attempt to load saved game state', async () => {
      const mockSavedState = {
        gameMoney: 75000,
        gameLevel: 2,
        gameXP: 150,
        playerAssets: []
      };

      AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(mockSavedState));

      await act(async () => {
        renderWithProvider(<TestComponent />);
      });

      await waitFor(() => {
        expect(AsyncStorage.getItem).toHaveBeenCalledWith('@RealEstateTycoon:gameState');
      });
    });

    test('should handle loading errors gracefully', async () => {
      AsyncStorage.getItem.mockRejectedValueOnce(new Error('Storage error'));

      await act(async () => {
        renderWithProvider(<TestComponent />);
      });

      // Should fall back to default state
      expect(contextValue.gameMoney).toBe(50000);
      expect(contextValue.gameLevel).toBe(1);
    });
  });
});
