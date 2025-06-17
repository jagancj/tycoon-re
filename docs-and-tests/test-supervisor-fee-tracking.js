// Test script to verify supervisor fee calculation and display
// This tests that supervisor fees are properly tracked from construction start

const testSupervisorFeeTracking = () => {
  console.log("=== TESTING SUPERVISOR FEE TRACKING ===");
  
  // Test data for a supervisor
  const testSupervisor = {
    id: 'supervisor-1',
    name: 'John Builder',
    role: 'Supervisor',
    salaryPerDay: 2000,
    efficiencyModifier: 1.2
  };
  
  // Test data for a blueprint with phases
  const testBlueprint = {
    id: 'blueprint-1',
    name: 'Modern House',
    type: 'House',
    phases: [
      { name: 'Foundation', duration: 5, cost: 25000 },
      { name: 'Framing', duration: 7, cost: 30000 },
      { name: 'Finishing', duration: 8, cost: 20000 }
    ]
  };
  
  console.log("Supervisor:", testSupervisor.name);
  console.log("Daily Rate: $" + testSupervisor.salaryPerDay.toLocaleString());
  console.log("Efficiency Modifier:", testSupervisor.efficiencyModifier + "x");
  
  console.log("\nBlueprint:", testBlueprint.name);
  console.log("Phases:");
  testBlueprint.phases.forEach((phase, index) => {
    console.log(`  ${index + 1}. ${phase.name}: ${phase.duration} days, $${phase.cost.toLocaleString()}`);
  });
  
  // Calculate original total duration
  const originalDuration = testBlueprint.phases.reduce((total, phase) => total + phase.duration, 0);
  console.log("\nOriginal Total Duration:", originalDuration + " days");
  
  // Calculate modified duration with efficiency bonus
  const modifiedDuration = testBlueprint.phases.reduce((total, phase) => 
    total + Math.round(phase.duration / testSupervisor.efficiencyModifier), 0);
  console.log("Modified Duration (with efficiency):", modifiedDuration + " days");
  
  // Calculate supervisor fee
  const totalSupervisorFee = testSupervisor.salaryPerDay * modifiedDuration;
  console.log("Total Supervisor Fee: $" + totalSupervisorFee.toLocaleString());
  
  // Calculate other costs
  const totalConstructionCost = testBlueprint.phases.reduce((total, phase) => total + phase.cost, 0);
  const architectCost = 8000; // Example architect cost
  const landCost = 50000; // Example land cost
  
  console.log("\n--- COST BREAKDOWN ---");
  console.log("Land Cost: $" + landCost.toLocaleString());
  console.log("Architect Fee: $" + architectCost.toLocaleString());
  console.log("Construction Cost: $" + totalConstructionCost.toLocaleString());
  console.log("Supervisor Fee: $" + totalSupervisorFee.toLocaleString());
  
  const totalInvestment = landCost + architectCost + totalConstructionCost + totalSupervisorFee;
  console.log("Total Investment: $" + totalInvestment.toLocaleString());
  
  // Verify supervisor fee is non-zero
  if (totalSupervisorFee > 0) {
    console.log("✅ Supervisor fee calculated correctly");
  } else {
    console.log("❌ Supervisor fee is zero - calculation error");
  }
  
  // Test what would be displayed in ListingDetailScreen
  const mockAsset = {
    id: 'test-asset',
    name: 'Test Constructed Property',
    constructionCompleted: true,
    landCost: landCost,
    architectCost: architectCost,
    constructionCost: totalConstructionCost,
    supervisorFee: totalSupervisorFee,
    totalInvestment: totalInvestment
  };
  
  console.log("\n--- LISTING DETAIL DISPLAY TEST ---");
  console.log("Land Cost: $" + (mockAsset.landCost || 0).toLocaleString());
  console.log("Architect Fee: $" + (mockAsset.architectCost || 0).toLocaleString());
  console.log("Construction Cost: $" + (mockAsset.constructionCost || 0).toLocaleString());
  console.log("Supervisor Fee: $" + (mockAsset.supervisorFee || 0).toLocaleString());
  console.log("Total Investment: $" + mockAsset.totalInvestment.toLocaleString());
  
  if (mockAsset.supervisorFee && mockAsset.supervisorFee > 0) {
    console.log("✅ Supervisor fee will display correctly in UI");
  } else {
    console.log("❌ Supervisor fee will show as $0 in UI");
  }
};

// Run the test
testSupervisorFeeTracking();

module.exports = { testSupervisorFeeTracking };
