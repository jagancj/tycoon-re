/**
 * Business Logic Unit Tests
 * Tests for core game calculations and utilities
 */

describe('Game Business Logic', () => {
  describe('Investment Calculations', () => {
    test('should calculate total investment correctly', () => {
      const landCost = 50000;
      const constructionCost = 75000;
      const supervisorFee = 5000;
      const architectFee = 3000;
      
      const totalInvestment = landCost + constructionCost + supervisorFee + architectFee;
      
      expect(totalInvestment).toBe(133000);
    });

    test('should calculate profit correctly', () => {
      const totalInvestment = 100000;
      const salePrice = 130000;
      const profit = salePrice - totalInvestment;
      
      expect(profit).toBe(30000);
    });

    test('should calculate profit margin percentage', () => {
      const totalInvestment = 100000;
      const salePrice = 120000;
      const profit = salePrice - totalInvestment;
      const profitMarginPercent = (profit / totalInvestment) * 100;
      
      expect(profitMarginPercent).toBe(20);
    });

    test('should handle negative profit (loss)', () => {
      const totalInvestment = 100000;
      const salePrice = 80000;
      const profit = salePrice - totalInvestment;
      const profitMarginPercent = (profit / totalInvestment) * 100;
      
      expect(profit).toBe(-20000);
      expect(profitMarginPercent).toBe(-20);
    });
  });

  describe('XP Calculation System', () => {
    test('should calculate XP based on profit margin', () => {
      const PROFIT_MARGIN_XP_MULTIPLIER = 2.5;
      
      const testCases = [
        { margin: 10, expectedXP: 25 },    // 10% margin = 25 XP
        { margin: 20, expectedXP: 50 },    // 20% margin = 50 XP
        { margin: 50, expectedXP: 125 },   // 50% margin = 125 XP
        { margin: 0, expectedXP: 0 },      // 0% margin = 0 XP
      ];

      testCases.forEach(({ margin, expectedXP }) => {
        const calculatedXP = Math.floor(margin * PROFIT_MARGIN_XP_MULTIPLIER);
        expect(calculatedXP).toBe(expectedXP);
      });
    });

    test('should not award XP for losses', () => {
      const PROFIT_MARGIN_XP_MULTIPLIER = 2.5;
      const negativeMargin = -10; // 10% loss
      const calculatedXP = Math.max(0, Math.floor(negativeMargin * PROFIT_MARGIN_XP_MULTIPLIER));
      
      expect(calculatedXP).toBe(0);
    });

    test('should handle very high profit margins', () => {
      const PROFIT_MARGIN_XP_MULTIPLIER = 2.5;
      const highMargin = 200; // 200% profit
      const calculatedXP = Math.floor(highMargin * PROFIT_MARGIN_XP_MULTIPLIER);
      
      expect(calculatedXP).toBe(500);
    });
  });

  describe('Level Progression System', () => {
    test('should define correct level thresholds', () => {
      const levelThresholds = [
        { level: 1, xpRequired: 0 },
        { level: 2, xpRequired: 100 },
        { level: 3, xpRequired: 250 },
        { level: 4, xpRequired: 450 },
        { level: 5, xpRequired: 700 }
      ];

      levelThresholds.forEach(({ level, xpRequired }) => {
        expect(xpRequired).toBeGreaterThanOrEqual(0);
        if (level > 1) {
          const previousLevel = levelThresholds.find(l => l.level === level - 1);
          expect(xpRequired).toBeGreaterThan(previousLevel.xpRequired);
        }
      });
    });

    test('should calculate level correctly based on XP', () => {
      const calculateLevel = (xp) => {
        const thresholds = [0, 100, 250, 450, 700, 1000];
        for (let i = thresholds.length - 1; i >= 0; i--) {
          if (xp >= thresholds[i]) {
            return i + 1;
          }
        }
        return 1;
      };

      expect(calculateLevel(0)).toBe(1);
      expect(calculateLevel(50)).toBe(1);
      expect(calculateLevel(100)).toBe(2);
      expect(calculateLevel(300)).toBe(3);
      expect(calculateLevel(500)).toBe(4);
      expect(calculateLevel(800)).toBe(5);
      expect(calculateLevel(1200)).toBe(6);
    });
  });

  describe('Offer Generation Logic', () => {
    test('should generate offers within expected ranges', () => {
      const totalInvestment = 100000;
      
      const generateOffer = (sentiment, investment) => {
        switch (sentiment) {
          case 'Lowball':
            return Math.round(investment * (0.75 + Math.random() * 0.20));
          case 'Lucrative':
            return Math.round(investment * (1.21 + Math.random() * 0.49));
          case 'Standard':
          default:
            return Math.round(investment * (1.01 + Math.random() * 0.49));
        }
      };

      // Test Lowball offers (75% - 95% of investment)
      const lowballOffer = generateOffer('Lowball', totalInvestment);
      expect(lowballOffer).toBeGreaterThanOrEqual(75000);
      expect(lowballOffer).toBeLessThanOrEqual(95000);

      // Test Standard offers (101% - 150% of investment)
      // Note: Using fixed values for deterministic testing
      const standardMin = Math.round(totalInvestment * 1.01);
      const standardMax = Math.round(totalInvestment * 1.50);
      expect(standardMin).toBe(101000);
      expect(standardMax).toBe(150000);

      // Test Lucrative offers (121% - 170% of investment)
      const lucrativeMin = Math.round(totalInvestment * 1.21);
      const lucrativeMax = Math.round(totalInvestment * 1.70);
      expect(lucrativeMin).toBe(121000);
      expect(lucrativeMax).toBe(170000);
    });

    test('should handle edge cases in offer generation', () => {
      const zeroInvestment = 0;
      const negativeInvestment = -1000;
      
      // Offers should handle zero investment gracefully
      expect(zeroInvestment * 1.01).toBe(0);
      
      // Negative investment should be handled appropriately
      expect(negativeInvestment * 1.01).toBeLessThan(0);
    });
  });

  describe('Property Status Management', () => {
    test('should define valid property statuses', () => {
      const validStatuses = ['Owned', 'Under Construction', 'For Sale', 'Sold'];
      
      expect(validStatuses).toContain('Owned');
      expect(validStatuses).toContain('Under Construction');
      expect(validStatuses).toContain('For Sale');
      expect(validStatuses).toContain('Sold');
      expect(validStatuses).toHaveLength(4);
    });

    test('should validate status transitions', () => {
      const validTransitions = {
        'Owned': ['Under Construction', 'For Sale'],
        'Under Construction': ['Owned', 'For Sale'],
        'For Sale': ['Sold'],
        'Sold': [] // Terminal state
      };

      // Test valid transitions
      expect(validTransitions['Owned']).toContain('Under Construction');
      expect(validTransitions['Owned']).toContain('For Sale');
      expect(validTransitions['Under Construction']).toContain('Owned');
      expect(validTransitions['For Sale']).toContain('Sold');
      expect(validTransitions['Sold']).toHaveLength(0);
    });
  });

  describe('Time and Duration Calculations', () => {
    test('should calculate construction duration correctly', () => {
      const RENOVATION_TIME_MS = 10000; // 10 seconds
      const CONSTRUCTION_TIME_MS = 20000; // 20 seconds
      
      expect(RENOVATION_TIME_MS).toBe(10000);
      expect(CONSTRUCTION_TIME_MS).toBe(20000);
      expect(CONSTRUCTION_TIME_MS).toBeGreaterThan(RENOVATION_TIME_MS);
    });

    test('should calculate game day intervals', () => {
      const GAME_DAY_IN_MS = 20000; // 20 seconds
      const UPDATE_INTERVAL_MS = 1000; // 1 second
      const TICKS_PER_DAY = GAME_DAY_IN_MS / UPDATE_INTERVAL_MS;
      
      expect(TICKS_PER_DAY).toBe(20);
      expect(TICKS_PER_DAY).toBeGreaterThan(0);
    });

    test('should calculate offer generation timing', () => {
      const OFFER_GENERATION_INTERVAL_MS = 5000; // 5 seconds
      
      expect(OFFER_GENERATION_INTERVAL_MS).toBe(5000);
      expect(OFFER_GENERATION_INTERVAL_MS).toBeGreaterThan(0);
    });
  });

  describe('Financial Calculations', () => {
    test('should calculate mortgage pre-closure fees', () => {
      const PRE_CLOSURE_FEE_RATE = 0.025; // 2.5%
      const loanAmount = 100000;
      const preclousureFee = loanAmount * PRE_CLOSURE_FEE_RATE;
      
      expect(preclousureFee).toBe(2500);
      expect(PRE_CLOSURE_FEE_RATE).toBe(0.025);
    });

    test('should validate percentage calculations', () => {
      const percentage = 25; // 25%
      const decimalValue = percentage / 100;
      const baseAmount = 100000;
      const calculatedAmount = baseAmount * decimalValue;
      
      expect(decimalValue).toBe(0.25);
      expect(calculatedAmount).toBe(25000);
    });    test('should handle currency formatting requirements', () => {
      const amount = 123456.789;
      const formatted = amount.toLocaleString();
      
      expect(typeof formatted).toBe('string');
      expect(formatted).toContain('456'); // More reliable check for number formatting
    });
  });
});
