// Test script to verify the duplicate staff fix
console.log('🔧 TESTING DUPLICATE STAFF FIX');

// Test the addStaffToAvailable helper function
const addStaffToAvailable = (availableStaff, newStaff) => {
  const updatedStaff = [...availableStaff];
  newStaff.forEach(staffMember => {
    if (!updatedStaff.some(existing => existing.id === staffMember.id)) {
      updatedStaff.push(staffMember);
    }
  });
  return updatedStaff;
};

// Test data
const existingStaff = [
  { id: 'STAFF01', name: 'Frank Miller' },
  { id: 'STAFF02', name: 'Isabelle Garcia' }
];

const returningStaff = [
  { id: 'STAFF03', name: 'Kenji Tanaka' }, // New staff
  { id: 'STAFF01', name: 'Frank Miller' }  // Duplicate
];

console.log('\n📊 Test Results:');
console.log('Existing staff:', existingStaff.map(s => s.id));
console.log('Returning staff:', returningStaff.map(s => s.id));

const result = addStaffToAvailable(existingStaff, returningStaff);
console.log('Final result:', result.map(s => s.id));

const hasDuplicates = result.length !== new Set(result.map(s => s.id)).size;
console.log(`\n✅ Duplicates prevented: ${!hasDuplicates}`);
console.log(`Staff count: ${result.length}`);

// Test edge cases
console.log('\n🧪 Edge Case Tests:');

// Test 1: All returning staff are duplicates
const allDuplicates = addStaffToAvailable(existingStaff, [
  { id: 'STAFF01', name: 'Frank Miller' },
  { id: 'STAFF02', name: 'Isabelle Garcia' }
]);
console.log('All duplicates test:', allDuplicates.length === existingStaff.length ? '✅ PASS' : '❌ FAIL');

// Test 2: Empty returning staff
const emptyReturning = addStaffToAvailable(existingStaff, []);
console.log('Empty returning test:', emptyReturning.length === existingStaff.length ? '✅ PASS' : '❌ FAIL');

// Test 3: Empty existing staff
const emptyExisting = addStaffToAvailable([], returningStaff);
console.log('Empty existing test:', emptyExisting.length === returningStaff.length ? '✅ PASS' : '❌ FAIL');

console.log('\n🎉 DUPLICATE STAFF FIX TESTED!');
console.log('\nThis fix should resolve the React warning:');
console.log('"Encountered two children with the same key, `.$STAFF03`"');
