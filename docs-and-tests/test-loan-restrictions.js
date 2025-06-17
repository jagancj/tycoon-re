// Test script for loan restriction logic
// This simulates the loan system to verify our fixes work correctly

console.log("🏦 TESTING LOAN RESTRICTION SYSTEM");
console.log("=".repeat(50));

// Mock game state with some active loans
const mockGameState = {
  activeLoans: [
    {
      id: "LOAN_001",
      type: "Personal", 
      bank: "Small Bank Inc.",
      amount: 50000,
      outstandingPrincipal: 45000
    },
    {
      id: "LOAN_002",
      type: "Mortgage",
      bank: "National Bank",
      amount: 200000,
      outstandingPrincipal: 180000,
      assetId: "PROP001_123456789"
    }
  ]
};

// Simulate the new takeLoan logic
function simulateTakeLoan(loanDetails) {
  console.log(`\n🏦 Attempting to take ${loanDetails.type} loan from ${loanDetails.bank}...`);
  console.log(`Amount: $${loanDetails.amount.toLocaleString()}`);
  if (loanDetails.assetId) {
    console.log(`Property: ${loanDetails.assetId}`);
  }

  // Check if there's an existing loan of this type for this asset/bank
  const existingLoan = mockGameState.activeLoans.find(loan => {
    if (loanDetails.type === 'Personal') {
      // For personal loans, only restrict if taking from the same bank
      return loan.type === 'Personal' && loan.bank === loanDetails.bank;
    } else {
      // For mortgage loans, restrict if same property (regardless of bank)
      return loan.type === 'Mortgage' && loan.assetId === loanDetails.assetId;
    }
  });

  if (existingLoan) {
    if (loanDetails.type === 'Personal') {
      console.log(`❌ REJECTED: You already have an active Personal loan from ${loanDetails.bank}.`);
    } else {
      console.log(`❌ REJECTED: You already have an active Mortgage loan on this property.`);
    }
    return false;
  }

  // Simulate successful loan
  mockGameState.activeLoans.push({
    id: `LOAN_${Date.now()}`,
    ...loanDetails,
    outstandingPrincipal: loanDetails.amount
  });

  console.log("✅ APPROVED: Loan successfully taken!");
  return true;
}

// Test scenarios
function testLoanRestrictions() {
  console.log("\n📋 CURRENT ACTIVE LOANS:");
  mockGameState.activeLoans.forEach((loan, index) => {
    console.log(`${index + 1}. ${loan.type} loan from ${loan.bank}${loan.assetId ? ` (Property: ${loan.assetId})` : ''}`);
  });

  console.log("\n🧪 TEST SCENARIOS:");

  // Test 1: Personal loan from same bank (should fail)
  console.log("\n1. Testing Personal loan from same bank (Small Bank Inc.)...");
  simulateTakeLoan({
    type: "Personal",
    bank: "Small Bank Inc.",
    amount: 25000
  });

  // Test 2: Personal loan from different bank (should succeed)
  console.log("\n2. Testing Personal loan from different bank (National Bank)...");
  simulateTakeLoan({
    type: "Personal", 
    bank: "National Bank",
    amount: 75000
  });

  // Test 3: Another personal loan from different bank (should succeed)
  console.log("\n3. Testing Personal loan from another different bank (Prestige Worldwide)...");
  simulateTakeLoan({
    type: "Personal",
    bank: "Prestige Worldwide Finance", 
    amount: 100000
  });

  // Test 4: Mortgage on same property (should fail)
  console.log("\n4. Testing Mortgage on already mortgaged property...");
  simulateTakeLoan({
    type: "Mortgage",
    bank: "Small Bank Inc.",
    amount: 50000,
    assetId: "PROP001_123456789"
  });

  // Test 5: Mortgage on different property (should succeed)
  console.log("\n5. Testing Mortgage on different property...");
  simulateTakeLoan({
    type: "Mortgage",
    bank: "Small Bank Inc.",
    amount: 150000,
    assetId: "PROP002_987654321"
  });

  // Test 6: Mortgage from different bank on different property (should succeed)
  console.log("\n6. Testing Mortgage from different bank on different property...");
  simulateTakeLoan({
    type: "Mortgage",
    bank: "National Bank",
    amount: 300000,
    assetId: "PROP003_555666777"
  });

  // Test 7: Personal loan from bank where we now have personal loan (should fail)
  console.log("\n7. Testing Personal loan from National Bank (where we now have one)...");
  simulateTakeLoan({
    type: "Personal",
    bank: "National Bank",
    amount: 50000
  });

  // Final state
  console.log("\n📊 FINAL LOAN PORTFOLIO:");
  mockGameState.activeLoans.forEach((loan, index) => {
    console.log(`${index + 1}. ${loan.type} loan from ${loan.bank} - $${loan.amount.toLocaleString()}${loan.assetId ? ` (Property: ${loan.assetId})` : ''}`);
  });
  
  console.log(`\nTotal loans: ${mockGameState.activeLoans.length}`);
  console.log(`Personal loans: ${mockGameState.activeLoans.filter(l => l.type === 'Personal').length}`);
  console.log(`Mortgage loans: ${mockGameState.activeLoans.filter(l => l.type === 'Mortgage').length}`);

  console.log("\n🎉 LOAN RESTRICTION TEST COMPLETED");
  console.log("=".repeat(50));
}

// Expected results summary
console.log("\n📝 EXPECTED BEHAVIOR:");
console.log("✅ Personal loans: Can have multiple from DIFFERENT banks");
console.log("❌ Personal loans: Cannot have multiple from SAME bank");
console.log("✅ Mortgage loans: Can have multiple on DIFFERENT properties");
console.log("❌ Mortgage loans: Cannot have multiple on SAME property");
console.log("✅ Mixed loans: Can have personal + mortgage from same bank");

// Run the test
testLoanRestrictions();
