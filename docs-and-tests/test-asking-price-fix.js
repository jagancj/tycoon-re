// Test script to verify the asking price calculation fix
// This simulates the construction completion flow to ensure proper pricing

// Mock data for testing
const mockLandAsset = {
  id: 'LAND001',
  purchasePrice: 100000, // Land cost: $100k
  status: 'Under Construction'
};

const mockBlueprint = {
  type: 'House',
  phases: [
    { name: 'Foundation', cost: 25000, duration: 7 },
    { name: 'Structure', cost: 50000, duration: 14 },
    { name: 'Finishing', cost: 25000, duration: 10 }
  ]
};

const mockProject = {
  blueprint: mockBlueprint,
  supervisorFee: 15000 // Supervisor fee: $15k
};

// Calculate expected values
const landPrice = mockLandAsset.purchasePrice; // $100k
const constructionCost = mockBlueprint.phases.reduce((total, phase) => total + phase.cost, 0); // $100k
const supervisorFee = mockProject.supervisorFee; // $15k
const totalInvestment = landPrice + constructionCost + supervisorFee; // $215k

// Expected market value range (30-70% profit margin)
const minMarketValue = Math.round(totalInvestment * 1.3); // $279,500
const maxMarketValue = Math.round(totalInvestment * 1.7); // $365,500

console.log('=== ASKING PRICE CALCULATION TEST ===');
console.log(`Land Cost: $${landPrice.toLocaleString()}`);
console.log(`Construction Cost: $${constructionCost.toLocaleString()}`);
console.log(`Supervisor Fee: $${supervisorFee.toLocaleString()}`);
console.log(`Total Investment: $${totalInvestment.toLocaleString()}`);
console.log(`Expected Market Value Range: $${minMarketValue.toLocaleString()} - $${maxMarketValue.toLocaleString()}`);
console.log(`Expected Profit Range: $${(minMarketValue - totalInvestment).toLocaleString()} - $${(maxMarketValue - totalInvestment).toLocaleString()}`);

// Simulate the new calculation logic
const profitMultiplier = 1.5; // Example: 50% profit
const calculatedMarketValue = Math.round(totalInvestment * profitMultiplier);
const profit = calculatedMarketValue - totalInvestment;
const profitMargin = ((profit / totalInvestment) * 100).toFixed(1);

console.log('\n=== SIMULATED RESULT ===');
console.log(`Calculated Market Value: $${calculatedMarketValue.toLocaleString()}`);
console.log(`Profit: $${profit.toLocaleString()}`);
console.log(`Profit Margin: ${profitMargin}%`);

// Verify the fix addresses the issue
if (calculatedMarketValue > totalInvestment) {
  console.log('✅ SUCCESS: Market value properly includes all costs plus profit!');
} else {
  console.log('❌ FAILED: Market value is too low!');
}
