// Test script for land batch system
// This simulates the land batch flow to verify our implementation works correctly

console.log("🏞️ TESTING LAND BATCH SYSTEM");
console.log("=".repeat(50));

// Mock land plot data (sample from LAND_PLOT_LIST)
const mockLandPlots = [
  {
    "id": "LAND300",
    "name": "Barnside Lot",
    "locationType": "Countryside (Rural)",
    "sizeSqFt": 45438,
    "baseValue": 545256,
    "askingPrice": 681570,
    "minLevel": 5
  },
  {
    "id": "LAND301", 
    "name": "Barnside Grounds",
    "locationType": "Countryside (Rural)", 
    "sizeSqFt": 13949,
    "baseValue": 167388,
    "askingPrice": 234343,
    "minLevel": 5
  },
  {
    "id": "LAND302",
    "name": "Farmland Plot",
    "locationType": "Countryside (Rural)",
    "sizeSqFt": 48610,
    "baseValue": 583320,
    "askingPrice": 664984,
    "minLevel": 5
  },
  {
    "id": "LAND303",
    "name": "City Center Plot",
    "locationType": "Urban (Downtown)",
    "sizeSqFt": 8500,
    "baseValue": 850000,
    "askingPrice": 1200000,
    "minLevel": 8
  },
  {
    "id": "LAND304",
    "name": "Waterfront Land",
    "locationType": "Waterfront",
    "sizeSqFt": 12000,
    "baseValue": 960000,
    "askingPrice": 1350000,
    "minLevel": 10
  }
];

const mockGameState = {
  playerLevel: 10,
  gameMoney: 2000000,
  playerAssets: [],
  currentLandBatch: [],
  landBatchPurchased: []
};

// Simulate the getEligibleLandPlotsForLevel function
function simulateGetEligibleLandPlots(level, landPlots, excludeOwned = true) {
  console.log(`\n🔍 Getting eligible land plots for level ${level}...`);
  
  let eligiblePlots = landPlots.filter(plot => {
    const meetsLevelRequirement = level >= plot.minLevel;
    console.log(`${plot.name}: Level ${plot.minLevel} ${meetsLevelRequirement ? '✅' : '❌'}`);
    return meetsLevelRequirement;
  });

  if (excludeOwned && mockGameState.playerAssets.length > 0) {
    const ownedLandIds = mockGameState.playerAssets
      .filter(asset => asset.assetType === 'Land')
      .map(asset => asset.id.split('_')[0]);
    eligiblePlots = eligiblePlots.filter(plot => !ownedLandIds.includes(plot.id));
  }

  console.log(`Found ${eligiblePlots.length} eligible land plots`);
  return eligiblePlots;
}

// Simulate the generateNewLandBatch function
function simulateGenerateNewLandBatch() {
  console.log("\n🎲 Generating new land batch...");
  
  const eligiblePlots = simulateGetEligibleLandPlots(mockGameState.playerLevel, mockLandPlots);
  
  if (eligiblePlots.length === 0) {
    console.log("❌ No eligible land plots available");
    mockGameState.currentLandBatch = [];
    mockGameState.landBatchPurchased = [];
    return;
  }

  // Sort by price (asking price) and take up to 5 land plots
  const sorted = [...eligiblePlots].sort((a, b) => a.askingPrice - b.askingPrice);
  const newBatch = sorted.slice(0, Math.min(5, sorted.length));

  mockGameState.currentLandBatch = newBatch;
  mockGameState.landBatchPurchased = [];

  console.log("✅ New land batch generated:");
  newBatch.forEach((plot, index) => {
    console.log(`${index + 1}. ${plot.name} - $${plot.askingPrice.toLocaleString()} (${plot.locationType})`);
  });
}

// Simulate land purchase from batch
function simulateBuyLandFromBatch(landPlotId, price) {
  console.log(`\n💰 Attempting to buy land plot ${landPlotId} for $${price.toLocaleString()}...`);
  
  const plot = mockGameState.currentLandBatch.find(p => p.id === landPlotId);
  if (!plot) {
    console.log("❌ ERROR: Land plot not found in current batch");
    return false;
  }

  if (mockGameState.gameMoney < price) {
    console.log("❌ ERROR: Insufficient funds");
    return false;
  }

  if (mockGameState.landBatchPurchased.includes(landPlotId)) {
    console.log("❌ ERROR: Land plot already purchased");
    return false;
  }

  // Simulate successful purchase
  const newLandAsset = {
    ...plot,
    assetType: 'Land',
    id: `${plot.id}_${Date.now()}`,
    purchasePrice: price,
    status: 'Owned'
  };

  mockGameState.playerAssets.push(newLandAsset);
  mockGameState.gameMoney -= price;
  mockGameState.landBatchPurchased.push(landPlotId);

  console.log("✅ Land purchase successful!");
  console.log(`New asset: ${newLandAsset.name}`);
  console.log(`Remaining money: $${mockGameState.gameMoney.toLocaleString()}`);
  console.log(`Batch progress: ${mockGameState.landBatchPurchased.length}/${mockGameState.currentLandBatch.length} sold`);
  
  return true;
}

// Simulate batch completion check
function simulateIsCurrentLandBatchCompleted() {
  if (!mockGameState.currentLandBatch || mockGameState.currentLandBatch.length === 0) return true;
  if (!mockGameState.landBatchPurchased) return false;
  return mockGameState.landBatchPurchased.length >= mockGameState.currentLandBatch.length;
}

// Test the land batch system
function testLandBatchSystem() {
  console.log("\n1. Testing initial batch generation...");
  simulateGenerateNewLandBatch();
  
  console.log("\n2. Testing first land purchase...");
  const firstPlot = mockGameState.currentLandBatch[0];
  const success1 = simulateBuyLandFromBatch(firstPlot.id, firstPlot.askingPrice);
  
  console.log("\n3. Testing second land purchase...");
  const secondPlot = mockGameState.currentLandBatch[1];
  const success2 = simulateBuyLandFromBatch(secondPlot.id, secondPlot.askingPrice);
  
  console.log("\n4. Testing duplicate purchase (should fail)...");
  const duplicate = simulateBuyLandFromBatch(firstPlot.id, firstPlot.askingPrice);
  
  console.log("\n5. Testing insufficient funds...");
  const expensivePlot = {
    id: "LAND999",
    name: "Super Expensive Plot",
    askingPrice: 10000000,
    locationType: "Premium"
  };
  mockGameState.currentLandBatch.push(expensivePlot);
  const insufficientFunds = simulateBuyLandFromBatch("LAND999", 10000000);
  
  console.log("\n6. Testing batch completion...");
  const isCompleted = simulateIsCurrentLandBatchCompleted();
  console.log(`Batch completed: ${isCompleted ? 'Yes' : 'No'}`);
  
  // Final state
  console.log("\n📊 FINAL STATE:");
  console.log(`Player level: ${mockGameState.playerLevel}`);
  console.log(`Owned land plots: ${mockGameState.playerAssets.filter(a => a.assetType === 'Land').length}`);
  console.log(`Current batch size: ${mockGameState.currentLandBatch.length}`);
  console.log(`Purchased from batch: ${mockGameState.landBatchPurchased.length}`);
  console.log(`Remaining money: $${mockGameState.gameMoney.toLocaleString()}`);
  
  console.log("\n🎉 LAND BATCH SYSTEM TEST COMPLETED");
  console.log("=".repeat(50));
}

// Run the test
testLandBatchSystem();
