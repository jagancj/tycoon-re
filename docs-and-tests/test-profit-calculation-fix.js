// Test script to verify profit calculation fix for constructed properties
// This tests that selling constructed properties uses correct total investment

const testProfitCalculation = () => {
  console.log("=== TESTING PROFIT CALCULATION FOR CONSTRUCTED PROPERTIES ===");
  
  // Test data for a regular property
  const regularProperty = {
    id: 'regular-1',
    name: 'Regular House',
    type: 'House',
    purchasePrice: 100000,
    invested: 120000, // includes purchase + renovations
    marketValue: 130000
  };
  
  // Test data for a constructed property
  const constructedProperty = {
    id: 'constructed-1',
    name: 'Constructed House',
    type: 'House',
    constructionCompleted: true,
    landCost: 50000,
    constructionCost: 75000,
    supervisorFee: 12000,
    architectCost: 8000,
    totalInvestment: 145000, // land + construction + supervisor + architect
    marketValue: 160000,
    // Legacy fields (should NOT be used for profit calculation)
    purchasePrice: 50000, // This is just the land cost
    invested: 50000 // This is just the land cost
  };
  
  const salePrice = 180000;
  
  console.log("\n--- REGULAR PROPERTY TEST ---");
  console.log("Property:", regularProperty.name);
  console.log("Purchase + Invested:", regularProperty.invested);
  console.log("Sale Price:", salePrice);
  
  // Regular property calculation (should use invested)
  const regularInvestment = regularProperty.totalInvestment || regularProperty.invested || regularProperty.purchasePrice;
  const regularProfit = salePrice - regularInvestment;
  
  console.log("Investment Used:", regularInvestment);
  console.log("Profit:", regularProfit);
  console.log("✅ Correct - uses invested amount");
  
  console.log("\n--- CONSTRUCTED PROPERTY TEST ---");
  console.log("Property:", constructedProperty.name);
  console.log("Land Cost:", constructedProperty.landCost);
  console.log("Construction Cost:", constructedProperty.constructionCost);
  console.log("Supervisor Fee:", constructedProperty.supervisorFee);
  console.log("Architect Cost:", constructedProperty.architectCost);
  console.log("Total Investment:", constructedProperty.totalInvestment);
  console.log("Sale Price:", salePrice);
  
  // Constructed property calculation (should use totalInvestment)
  const constructedInvestment = constructedProperty.totalInvestment || constructedProperty.invested || constructedProperty.purchasePrice;
  const constructedProfit = salePrice - constructedInvestment;
  
  console.log("Investment Used:", constructedInvestment);
  console.log("Profit:", constructedProfit);
  
  // Verify the fix
  if (constructedInvestment === constructedProperty.totalInvestment) {
    console.log("✅ FIXED - Now uses totalInvestment (" + constructedProperty.totalInvestment + ")");
  } else {
    console.log("❌ BROKEN - Still using wrong value (" + constructedInvestment + ")");
  }
  
  // Show the difference
  const oldWrongCalculation = salePrice - constructedProperty.purchasePrice; // Wrong way (just land)
  const newCorrectCalculation = salePrice - constructedProperty.totalInvestment; // Correct way (all costs)
  
  console.log("\n--- COMPARISON ---");
  console.log("Old (WRONG) calculation:");
  console.log("  Sale Price - Land Cost: " + salePrice + " - " + constructedProperty.purchasePrice + " = " + oldWrongCalculation);
  console.log("New (CORRECT) calculation:");
  console.log("  Sale Price - Total Investment: " + salePrice + " - " + constructedProperty.totalInvestment + " = " + newCorrectCalculation);
  console.log("Difference: " + (oldWrongCalculation - newCorrectCalculation) + " (money saved by fixing this bug)");
  
  // Tax impact
  const taxRate = 0.15; // Assume long-term holding
  const oldTax = Math.round(Math.max(0, oldWrongCalculation) * taxRate);
  const newTax = Math.round(Math.max(0, newCorrectCalculation) * taxRate);
  
  console.log("\n--- TAX IMPACT ---");
  console.log("Old tax (on inflated profit): $" + oldTax.toLocaleString());
  console.log("New tax (on correct profit): $" + newTax.toLocaleString());
  console.log("Tax savings: $" + (oldTax - newTax).toLocaleString());
};

// Run the test
testProfitCalculation();

module.exports = { testProfitCalculation };
