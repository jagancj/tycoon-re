// Test script to verify toLocaleString fix for mortgage property mapping
// This tests that property value display doesn't crash with undefined values

const testPropertyValueDisplay = () => {
  console.log("=== TESTING PROPERTY VALUE DISPLAY FOR MORTGAGE MAPPING ===");
  
  // Test data with various property value scenarios
  const testProperties = [
    {
      id: 'complete-1',
      name: 'Property with All Values',
      marketValue: 150000,
      areaAverageValue: 140000,
      baseValue: 130000
    },
    {
      id: 'market-only-1', 
      name: 'Property with Market Value Only (Constructed)',
      marketValue: 167000,
      // areaAverageValue: undefined,
      // baseValue: undefined
    },
    {
      id: 'area-only-1',
      name: 'Property with Area Average Only',
      // marketValue: undefined,
      areaAverageValue: 120000,
      // baseValue: undefined
    },
    {
      id: 'base-only-1',
      name: 'Property with Base Value Only',
      // marketValue: undefined,
      // areaAverageValue: undefined,
      baseValue: 100000
    },
    {
      id: 'no-values-1',
      name: 'Property with No Values (Edge case)',
      // marketValue: undefined,
      // areaAverageValue: undefined,
      // baseValue: undefined
    }
  ];
  
  console.log("Testing property value fallback logic...\n");
  
  testProperties.forEach(prop => {
    console.log(`${prop.name}:`);
    console.log(`  marketValue: ${prop.marketValue || 'undefined'}`);
    console.log(`  areaAverageValue: ${prop.areaAverageValue || 'undefined'}`);
    console.log(`  baseValue: ${prop.baseValue || 'undefined'}`);
    
    // Test the fixed logic
    const displayValue = prop.marketValue || prop.areaAverageValue || prop.baseValue || 0;
    
    try {
      const formattedValue = displayValue.toLocaleString();
      console.log(`  ✅ Display Value: $${formattedValue}`);
      console.log(`  ✅ toLocaleString() works correctly`);
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
      console.log(`  ❌ Value that caused error: ${displayValue} (type: ${typeof displayValue})`);
    }
    
    console.log('');
  });
  
  // Test the specific scenarios that would cause crashes
  console.log("=== CRASH SCENARIO TESTS ===");
  
  const crashTest1 = {
    name: 'Undefined marketValue + areaAverageValue',
    marketValue: undefined,
    areaAverageValue: undefined,
    baseValue: 50000
  };
  
  const crashTest2 = {
    name: 'All undefined values',
    marketValue: undefined,
    areaAverageValue: undefined,
    baseValue: undefined
  };
  
  [crashTest1, crashTest2].forEach(test => {
    console.log(`${test.name}:`);
    
    // Old (broken) logic that would crash
    const oldLogic = test.marketValue || test.areaAverageValue;
    console.log(`  Old logic result: ${oldLogic} (type: ${typeof oldLogic})`);
    
    try {
      if (oldLogic !== undefined) {
        oldLogic.toLocaleString();
        console.log(`  Old logic: Would work`);
      } else {
        console.log(`  Old logic: Would crash with "Cannot read property 'toLocaleString' of undefined"`);
      }
    } catch (error) {
      console.log(`  Old logic: Would crash with "${error.message}"`);
    }
    
    // New (fixed) logic
    const newLogic = test.marketValue || test.areaAverageValue || test.baseValue || 0;
    console.log(`  New logic result: ${newLogic} (type: ${typeof newLogic})`);
    
    try {
      const formatted = newLogic.toLocaleString();
      console.log(`  New logic: ✅ Works - displays $${formatted}`);
    } catch (error) {
      console.log(`  New logic: ❌ Still crashes - ${error.message}`);
    }
    
    console.log('');
  });
  
  console.log("=== SUMMARY ===");
  console.log("✅ Fixed logic provides safe fallback to 0");
  console.log("✅ toLocaleString() will never be called on undefined");
  console.log("✅ Properties with any valid value will display correctly");
  console.log("✅ Properties with no values will display $0 instead of crashing");
};

// Run the test
testPropertyValueDisplay();

module.exports = { testPropertyValueDisplay };
