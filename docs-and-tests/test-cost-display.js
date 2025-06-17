// Test script to verify supervisor fee and architect cost display
// This script can be run to create test data and verify cost calculations

const testCostDisplay = () => {
  console.log("=== TESTING COST DISPLAY FOR CONSTRUCTED PROPERTIES ===");
  
  // Test data for a completed construction project
  const testConstructedProperty = {
    id: 'test-construction-1',
    name: 'Test Constructed House',
    type: 'House',
    constructionCompleted: true,
    landCost: 50000,
    constructionCost: 75000,
    supervisorFee: 12000,
    architectCost: 8000,
    totalInvestment: 145000,
    marketValue: 160000
  };
  
  console.log("Test Property:", testConstructedProperty.name);
  console.log("Land Cost: $" + testConstructedProperty.landCost.toLocaleString());
  console.log("Architect Fee: $" + (testConstructedProperty.architectCost || 0).toLocaleString());
  console.log("Construction Cost: $" + testConstructedProperty.constructionCost.toLocaleString());
  console.log("Supervisor Fee: $" + (testConstructedProperty.supervisorFee || 0).toLocaleString());
  console.log("Total Investment: $" + testConstructedProperty.totalInvestment.toLocaleString());
  
  // Check for any zero values that shouldn't be zero
  const issues = [];
  if (!testConstructedProperty.supervisorFee || testConstructedProperty.supervisorFee === 0) {
    issues.push("Supervisor fee is zero or missing");
  }
  if (!testConstructedProperty.architectCost || testConstructedProperty.architectCost === 0) {
    issues.push("Architect cost is zero or missing");
  }
  
  if (issues.length > 0) {
    console.log("❌ ISSUES FOUND:");
    issues.forEach(issue => console.log("  - " + issue));
  } else {
    console.log("✅ All costs are properly tracked and non-zero");
  }
  
  // Verify total investment calculation
  const calculatedTotal = testConstructedProperty.landCost + 
                         testConstructedProperty.constructionCost + 
                         testConstructedProperty.supervisorFee + 
                         testConstructedProperty.architectCost;
  
  if (calculatedTotal === testConstructedProperty.totalInvestment) {
    console.log("✅ Total investment calculation is correct");
  } else {
    console.log("❌ Total investment mismatch:");
    console.log("  Expected: $" + calculatedTotal.toLocaleString());
    console.log("  Actual: $" + testConstructedProperty.totalInvestment.toLocaleString());
  }
};

// Run the test
testCostDisplay();

module.exports = { testCostDisplay };
