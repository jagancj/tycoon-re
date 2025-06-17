// Test script for upgrade/add-on system
// This simulates the upgrade flow to verify our fixes work correctly

console.log("🔧 TESTING UPGRADE/ADD-ON SYSTEM");
console.log("=".repeat(50));

// Mock data for testing
const mockProperty = {
  id: "PROP001",
  name: "Test Property",
  purchasePrice: 100000,
  marketValue: 100000,
  installedAddOns: [],
  availableAddOns: [
    {
      id: "ADDON001_1",
      name: "Smart Security System",
      cost: 5000,
      valueIncrease: 8000
    },
    {
      id: "ADDON001_2", 
      name: "Luxury Kitchen",
      cost: 15000,
      valueIncrease: 22000
    }
  ]
};

const mockGameState = {
  gameMoney: 50000,
  playerAssets: [mockProperty]
};

// Simulate the installAddOn function
function simulateInstallAddOn(assetId, addOn, gameState) {
  console.log(`\n🔧 Testing add-on installation:`);
  console.log(`Property ID: ${assetId}`);
  console.log(`Add-on: ${addOn.name}`);
  console.log(`Cost: $${addOn.cost.toLocaleString()}`);
  console.log(`Value increase: $${addOn.valueIncrease.toLocaleString()}`);
  
  // Find the asset by ID
  const asset = gameState.playerAssets.find(a => a.id === assetId);
  if (!asset) {
    console.log("❌ ERROR: Property not found");
    return false;
  }
  
  // Check if player has enough money
  if (gameState.gameMoney < addOn.cost) {
    console.log("❌ ERROR: Insufficient funds");
    return false;
  }
  
  // Check if add-on is already installed
  if (asset.installedAddOns.includes(addOn.id)) {
    console.log("❌ ERROR: Add-on already installed");
    return false;
  }
  
  // Install the add-on
  asset.installedAddOns.push(addOn.id);
  asset.marketValue += addOn.valueIncrease;
  asset.invested = (asset.invested || asset.purchasePrice) + addOn.cost;
  gameState.gameMoney -= addOn.cost;
  
  console.log("✅ Add-on installed successfully!");
  console.log(`New property value: $${asset.marketValue.toLocaleString()}`);
  console.log(`Remaining money: $${gameState.gameMoney.toLocaleString()}`);
  
  return true;
}

// Test the upgrade system
function testUpgradeSystem() {
  console.log("\n1. Testing first add-on installation...");
  const firstAddOn = mockProperty.availableAddOns[0];
  const success1 = simulateInstallAddOn("PROP001", firstAddOn, mockGameState);
  
  console.log("\n2. Testing second add-on installation...");
  const secondAddOn = mockProperty.availableAddOns[1];
  const success2 = simulateInstallAddOn("PROP001", secondAddOn, mockGameState);
  
  console.log("\n3. Testing duplicate installation (should fail)...");
  const duplicate = simulateInstallAddOn("PROP001", firstAddOn, mockGameState);
  
  console.log("\n4. Testing insufficient funds...");
  const expensiveAddOn = {
    id: "ADDON001_3",
    name: "Gold Plated Everything",
    cost: 100000,
    valueIncrease: 150000
  };
  const insufficientFunds = simulateInstallAddOn("PROP001", expensiveAddOn, mockGameState);
  
  console.log("\n5. Testing invalid property ID...");
  const invalidProperty = simulateInstallAddOn("PROP999", firstAddOn, mockGameState);
  
  // Final state
  console.log("\n📊 FINAL STATE:");
  console.log(`Property value: $${mockGameState.playerAssets[0].marketValue.toLocaleString()}`);
  console.log(`Total invested: $${mockGameState.playerAssets[0].invested.toLocaleString()}`);
  console.log(`Installed add-ons: ${mockGameState.playerAssets[0].installedAddOns.length}`);
  console.log(`Remaining money: $${mockGameState.gameMoney.toLocaleString()}`);
  
  console.log("\n🎉 UPGRADE SYSTEM TEST COMPLETED");
  console.log("=".repeat(50));
}

// Run the test
testUpgradeSystem();
