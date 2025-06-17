// Simple sanity test to validate Jest setup
describe('Testing Setup', () => {
  test('Jest is working correctly', () => {
    expect(1 + 1).toBe(2);
  });

  test('can perform basic calculations', () => {
    const totalInvestment = 100000;
    const salePrice = 120000;
    const profit = salePrice - totalInvestment;
    
    expect(profit).toBe(20000);
  });

  test('can handle string operations', () => {
    const name = 'Real Estate Tycoon';
    expect(name.toLowerCase()).toBe('real estate tycoon');
    expect(name.includes('Estate')).toBe(true);
  });

  test('can work with arrays', () => {
    const properties = ['Villa', 'Apartment', 'House'];
    expect(properties).toHaveLength(3);
    expect(properties).toContain('Villa');
  });

  test('can work with objects', () => {
    const gameState = {
      money: 50000,
      level: 1,
      xp: 0
    };
    
    expect(gameState.money).toBe(50000);
    expect(gameState).toHaveProperty('level');
  });
});
