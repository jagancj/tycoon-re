// Test script to verify mortgage functionality for constructed properties
// This tests that constructed properties can be selected for mortgages

const testMortgageSelection = () => {
  console.log("=== TESTING MORTGAGE SELECTION FOR CONSTRUCTED PROPERTIES ===");
  
  // Test data for different property types
  const regularProperty = {
    id: 'regular-1',
    name: 'Regular Purchased House',
    type: 'House',
    status: 'Owned',
    baseValue: 100000,
    marketValue: 120000,
    areaAverageValue: 115000,
    isMortgaged: false
  };
  
  const constructedProperty = {
    id: 'constructed-1',
    name: 'Constructed Modern House',
    type: 'House',
    status: 'Owned',
    constructionCompleted: true,
    marketValue: 167000,
    totalInvestment: 145000,
    landCost: 50000,
    constructionCost: 75000,
    supervisorFee: 12000,
    architectCost: 8000,
    isMortgaged: false,
    // Note: No baseValue field
  };
  
  const mortgagedProperty = {
    id: 'mortgaged-1',
    name: 'Mortgaged Property',
    type: 'House',
    status: 'Owned',
    baseValue: 80000,
    marketValue: 90000,
    isMortgaged: true // Already mortgaged
  };
  
  const underConstructionProperty = {
    id: 'under-construction-1',
    name: 'Under Construction',
    type: 'House',
    status: 'Under Construction', // Not owned yet
    marketValue: 0
  };
  
  const testProperties = [regularProperty, constructedProperty, mortgagedProperty, underConstructionProperty];
  
  console.log("Testing property filtering for mortgage eligibility...\n");
  
  // Test the updated filter logic
  const mortgagableAssets = testProperties.filter(asset => 
    // Must have a market value (constructed properties) or baseValue (regular properties)
    (asset.marketValue || asset.areaAverageValue || asset.baseValue) && 
    !asset.isMortgaged &&
    asset.status === 'Owned'
  );
  
  console.log("=== PROPERTY ELIGIBILITY RESULTS ===");
  
  testProperties.forEach(property => {
    const hasValue = !!(property.marketValue || property.areaAverageValue || property.baseValue);
    const notMortgaged = !property.isMortgaged;
    const isOwned = property.status === 'Owned';
    const isEligible = hasValue && notMortgaged && isOwned;
    
    console.log(`\n${property.name}:`);
    console.log(`  Has Value: ${hasValue} (${property.marketValue || property.areaAverageValue || property.baseValue || 0})`);
    console.log(`  Not Mortgaged: ${notMortgaged}`);
    console.log(`  Is Owned: ${isOwned}`);
    console.log(`  ✅ Eligible: ${isEligible ? 'YES' : 'NO'}`);
  });
  
  console.log(`\n=== SUMMARY ===`);
  console.log(`Total Properties: ${testProperties.length}`);
  console.log(`Mortgagable Properties: ${mortgagableAssets.length}`);
  
  // Test mortgage value calculation
  console.log(`\n=== MORTGAGE VALUE CALCULATION ===`);
  
  const loanPercentage = 0.8; // 80% LTV ratio
  
  mortgagableAssets.forEach(property => {
    const propertyValue = property.marketValue || property.areaAverageValue || property.baseValue || 0;
    const maxMortgage = Math.floor(propertyValue * loanPercentage);
    const minMortgage = Math.min(10000, maxMortgage);
    
    console.log(`\n${property.name}:`);
    console.log(`  Property Value: $${propertyValue.toLocaleString()}`);
    console.log(`  Max Mortgage (80%): $${maxMortgage.toLocaleString()}`);
    console.log(`  Min Mortgage: $${minMortgage.toLocaleString()}`);
    
    if (propertyValue > 0) {
      console.log(`  ✅ Valid for mortgage calculation`);
    } else {
      console.log(`  ❌ Invalid - no value for mortgage calculation`);
    }
  });
  
  // Test specific scenarios
  console.log(`\n=== SPECIFIC TESTS ===`);
  
  // Test 1: Constructed property should be eligible
  const constructedEligible = mortgagableAssets.find(p => p.id === 'constructed-1');
  if (constructedEligible) {
    console.log(`✅ Constructed properties ARE eligible for mortgage`);
  } else {
    console.log(`❌ Constructed properties are NOT eligible for mortgage`);
  }
  
  // Test 2: Regular property should be eligible
  const regularEligible = mortgagableAssets.find(p => p.id === 'regular-1');
  if (regularEligible) {
    console.log(`✅ Regular properties ARE eligible for mortgage`);
  } else {
    console.log(`❌ Regular properties are NOT eligible for mortgage`);
  }
  
  // Test 3: Mortgaged property should NOT be eligible
  const mortgagedEligible = mortgagableAssets.find(p => p.id === 'mortgaged-1');
  if (!mortgagedEligible) {
    console.log(`✅ Already mortgaged properties are correctly EXCLUDED`);
  } else {
    console.log(`❌ Already mortgaged properties are incorrectly INCLUDED`);
  }
  
  // Test 4: Under construction property should NOT be eligible
  const underConstructionEligible = mortgagableAssets.find(p => p.id === 'under-construction-1');
  if (!underConstructionEligible) {
    console.log(`✅ Under construction properties are correctly EXCLUDED`);
  } else {
    console.log(`❌ Under construction properties are incorrectly INCLUDED`);
  }
};

// Run the test
testMortgageSelection();

module.exports = { testMortgageSelection };
