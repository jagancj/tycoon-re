// Test script to verify profit margin-based XP calculation
// This tests that XP is awarded based on profit percentage rather than absolute profit

const testXpCalculation = () => {
  console.log("=== TESTING PROFIT MARGIN-BASED XP CALCULATION ===");
  
  const PROFIT_MARGIN_XP_MULTIPLIER = 2.5; // XP per 1% profit margin
  
  // Test scenarios with different investment amounts but same profit margins
  const testScenarios = [
    {
      name: "Small Investment - 20% Margin",
      investment: 50000,
      salePrice: 60000,
      expectedMargin: 20
    },
    {
      name: "Medium Investment - 20% Margin", 
      investment: 200000,
      salePrice: 240000,
      expectedMargin: 20
    },
    {
      name: "Large Investment - 20% Margin",
      investment: 1000000,
      salePrice: 1200000,
      expectedMargin: 20
    },
    {
      name: "Small Investment - 10% Margin",
      investment: 100000,
      salePrice: 110000,
      expectedMargin: 10
    },
    {
      name: "Large Investment - 10% Margin",
      investment: 500000,
      salePrice: 550000,
      expectedMargin: 10
    },
    {
      name: "Excellent Deal - 50% Margin",
      investment: 150000,
      salePrice: 225000,
      expectedMargin: 50
    },
    {
      name: "Break Even - 0% Margin",
      investment: 100000,
      salePrice: 100000,
      expectedMargin: 0
    },
    {
      name: "Small Loss",
      investment: 100000,
      salePrice: 95000,
      expectedMargin: -5
    }
  ];
  
  console.log("Testing XP calculation scenarios...\n");
  
  testScenarios.forEach(scenario => {
    const profitOrLoss = scenario.salePrice - scenario.investment;
    const profitMargin = (profitOrLoss / scenario.investment) * 100;
    
    console.log(`${scenario.name}:`);
    console.log(`  Investment: $${scenario.investment.toLocaleString()}`);
    console.log(`  Sale Price: $${scenario.salePrice.toLocaleString()}`);
    console.log(`  Profit/Loss: $${profitOrLoss.toLocaleString()}`);
    console.log(`  Profit Margin: ${profitMargin.toFixed(1)}%`);
    
    // Old XP calculation (absolute profit)
    const oldXpAmount = profitOrLoss > 0 ? Math.floor(profitOrLoss / 4) : 0;
    
    // New XP calculation (profit margin)
    const newXpAmount = (profitOrLoss > 0 && scenario.investment > 0) 
      ? Math.floor(profitMargin * PROFIT_MARGIN_XP_MULTIPLIER) 
      : 0;
    
    console.log(`  Old XP (absolute): ${oldXpAmount}`);
    console.log(`  New XP (margin): ${newXpAmount}`);
    console.log(`  XP Difference: ${newXpAmount - oldXpAmount}`);
    
    if (Math.abs(profitMargin - scenario.expectedMargin) < 0.1) {
      console.log(`  ✅ Margin calculation correct`);
    } else {
      console.log(`  ❌ Margin calculation error - expected ${scenario.expectedMargin}%`);
    }
    
    console.log('');
  });
  
  console.log("=== ANALYSIS ===");
  console.log("Comparing old vs new XP system:\n");
  
  console.log("**Same Profit Margin, Different Investment Amounts:**");
  
  // Compare scenarios with same margin but different investments
  const scenario1 = testScenarios[0]; // Small - 20% margin
  const scenario2 = testScenarios[1]; // Medium - 20% margin  
  const scenario3 = testScenarios[2]; // Large - 20% margin
  
  [scenario1, scenario2, scenario3].forEach(scenario => {
    const profit = scenario.salePrice - scenario.investment;
    const margin = (profit / scenario.investment) * 100;
    const oldXp = Math.floor(profit / 4);
    const newXp = Math.floor(margin * PROFIT_MARGIN_XP_MULTIPLIER);
    
    console.log(`  ${scenario.name}:`);
    console.log(`    Profit: $${profit.toLocaleString()}`);
    console.log(`    Old XP: ${oldXp} | New XP: ${newXp}`);
  });
  
  console.log("\n**Benefits of New System:**");
  console.log("✅ Same profit margin = Same XP (regardless of property value)");
  console.log("✅ Prevents rapid leveling from expensive properties");
  console.log("✅ Rewards smart trading over high-value flipping");
  console.log("✅ More balanced progression system");
  
  console.log("\n**XP Calculation Formula:**");
  console.log("• Profit Margin = (Profit ÷ Investment) × 100");
  console.log("• XP = Profit Margin × 2.5");
  console.log("• Examples:");
  console.log("  - 10% margin = 25 XP");
  console.log("  - 20% margin = 50 XP");
  console.log("  - 50% margin = 125 XP");
};

// Run the test
testXpCalculation();

module.exports = { testXpCalculation };
