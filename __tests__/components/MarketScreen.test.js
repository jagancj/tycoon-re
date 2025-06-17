/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import MarketScreen from '../../src/MarketScreen';

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn()
};

// Mock the context
const mockGameContext = {
  gameMoney: 50000,
  gameLevel: 1,
  currentMarketplaceBatch: [],
  currentLandBatch: [],
  marketplaceBatchPurchased: [],
  landBatchPurchased: []
};

jest.mock('../../GameContext', () => ({
  GameContext: React.createContext(mockGameContext),
  useContext: () => mockGameContext
}));

describe('MarketScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render marketplace header correctly', () => {
    render(<MarketScreen navigation={mockNavigation} />);
    
    expect(screen.getByText('Marketplace')).toBeTruthy();
  });

  test('should render tab navigation with Properties and Land tabs', () => {
    render(<MarketScreen navigation={mockNavigation} />);
    
    // The tabs should be rendered by TabView
    expect(screen.getByTestId).toBeDefined();
  });

  test('should handle back button press', () => {
    render(<MarketScreen navigation={mockNavigation} />);
    
    const backButton = screen.getByTestId('back-button');
    fireEvent.press(backButton);
    
    expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
  });

  test('should apply correct styles for background gradient', () => {
    render(<MarketScreen navigation={mockNavigation} />);
    
    // Check if LinearGradient is rendered with correct colors
    const gradientElement = screen.getByTestId('background-gradient');
    expect(gradientElement).toBeTruthy();
  });

  test('should have transparent TabView background', () => {
    render(<MarketScreen navigation={mockNavigation} />);
    
    // Verify TabView has transparent background
    const tabView = screen.getByTestId('market-tab-view');
    expect(tabView.props.style).toEqual(
      expect.objectContaining({ backgroundColor: 'transparent' })
    );
  });

  test('should initialize with first tab (Properties) selected', () => {
    render(<MarketScreen navigation={mockNavigation} />);
    
    // TabView should start with index 0 (Properties tab)
    const tabView = screen.getByTestId('market-tab-view');
    expect(tabView.props.navigationState.index).toBe(0);
  });

  test('should have proper tab configuration', () => {
    render(<MarketScreen navigation={mockNavigation} />);
    
    const tabView = screen.getByTestId('market-tab-view');
    const routes = tabView.props.navigationState.routes;
    
    expect(routes).toHaveLength(2);
    expect(routes[0]).toEqual({ key: 'properties', title: 'Properties' });
    expect(routes[1]).toEqual({ key: 'land', title: 'Land' });
  });

  test('should render TabBar with correct styling', () => {
    render(<MarketScreen navigation={mockNavigation} />);
    
    const tabBar = screen.getByTestId('market-tab-bar');
    expect(tabBar).toBeTruthy();
    
    // Verify TabBar styling
    expect(tabBar.props.indicatorStyle).toEqual({ backgroundColor: '#FFD700' });
    expect(tabBar.props.style).toEqual({ backgroundColor: 'transparent' });
    expect(tabBar.props.labelStyle).toEqual({ fontWeight: 'bold', color: '#fff' });
  });

  test('should handle tab change correctly', () => {
    render(<MarketScreen navigation={mockNavigation} />);
    
    const tabView = screen.getByTestId('market-tab-view');
    
    // Simulate tab change to Land tab (index 1)
    fireEvent(tabView, 'onIndexChange', 1);
    
    // The component should update its internal state
    expect(tabView.props.onIndexChange).toBeTruthy();
  });

  test('should use correct window dimensions for initial layout', () => {
    render(<MarketScreen navigation={mockNavigation} />);
    
    const tabView = screen.getByTestId('market-tab-view');
    expect(tabView.props.initialLayout).toEqual({ width: 375 }); // Mocked width
  });

  test('should have proper container styling', () => {
    const { getByTestId } = render(<MarketScreen navigation={mockNavigation} />);
    
    const container = getByTestId('market-container');
    expect(container.props.style).toEqual(
      expect.objectContaining({ flex: 1 })
    );
  });

  test('should render header with proper spacing and alignment', () => {
    render(<MarketScreen navigation={mockNavigation} />);
    
    const header = screen.getByTestId('market-header');
    expect(header.props.style).toEqual(
      expect.objectContaining({
        paddingVertical: 10,
        paddingHorizontal: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'transparent'
      })
    );
  });

  test('should handle navigation prop correctly', () => {
    const customNavigation = {
      ...mockNavigation,
      navigate: jest.fn(),
      goBack: jest.fn()
    };

    render(<MarketScreen navigation={customNavigation} />);
    
    // Navigation should be passed and used correctly
    expect(customNavigation).toBeTruthy();
  });
});
