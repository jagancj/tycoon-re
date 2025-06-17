// Validate blueprint data structure
const { BLUEPRINT_LIST } = require('./data/buildingBlueprints.js');

console.log('🔍 Validating Blueprint Data Structure...\n');

let allValid = true;
const issues = [];

BLUEPRINT_LIST.forEach((blueprint, index) => {
  console.log(`\n[${index}] Checking blueprint: ${blueprint.id} - ${blueprint.name}`);
  
  if (!blueprint.phases) {
    console.log(`  ❌ Missing 'phases' property`);
    issues.push(`${blueprint.id}: Missing phases property`);
    allValid = false;
  } else if (!Array.isArray(blueprint.phases)) {
    console.log(`  ❌ 'phases' is not an array`);
    issues.push(`${blueprint.id}: Phases is not an array`);
    allValid = false;
  } else if (blueprint.phases.length === 0) {
    console.log(`  ❌ 'phases' array is empty`);
    issues.push(`${blueprint.id}: Phases array is empty`);
    allValid = false;
  } else {
    console.log(`  ✅ Has ${blueprint.phases.length} phases`);
    
    // Check each phase
    blueprint.phases.forEach((phase, phaseIndex) => {
      if (!phase.name || !phase.cost || !phase.duration) {
        console.log(`    ❌ Phase ${phaseIndex} missing required properties:`, {
          name: !!phase.name,
          cost: !!phase.cost,
          duration: !!phase.duration
        });
        issues.push(`${blueprint.id}: Phase ${phaseIndex} incomplete`);
        allValid = false;
      } else {
        console.log(`    ✅ Phase ${phaseIndex}: ${phase.name} ($${phase.cost}, ${phase.duration} days)`);
      }
    });
  }
});

console.log('\n📊 Summary:');
console.log(`Total blueprints: ${BLUEPRINT_LIST.length}`);
console.log(`All valid: ${allValid ? '✅ YES' : '❌ NO'}`);

if (issues.length > 0) {
  console.log('\n🚨 Issues found:');
  issues.forEach(issue => console.log(`  - ${issue}`));
} else {
  console.log('\n🎉 All blueprints have valid phase data!');
}

// Test sample blueprint access
console.log('\n🧪 Testing sample blueprint access:');
const sampleBlueprint = BLUEPRINT_LIST[0];
if (sampleBlueprint) {
  console.log('Sample blueprint:', sampleBlueprint.name);
  console.log('Sample phases access:', sampleBlueprint.phases ? 'SUCCESS' : 'FAIL');
  if (sampleBlueprint.phases && sampleBlueprint.phases[0]) {
    console.log('First phase access:', sampleBlueprint.phases[0].name);
  }
}
