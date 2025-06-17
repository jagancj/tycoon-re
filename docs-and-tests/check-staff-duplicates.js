// Check for duplicate staff IDs
const { STAFF_LIST } = require('./data/staffMembers.js');

console.log('🔍 Checking for duplicate staff IDs...\n');

const idCounts = {};
const duplicates = [];

STAFF_LIST.forEach((staff, index) => {
  if (idCounts[staff.id]) {
    idCounts[staff.id].count++;
    idCounts[staff.id].indices.push(index);
    if (!duplicates.includes(staff.id)) {
      duplicates.push(staff.id);
    }
  } else {
    idCounts[staff.id] = {
      count: 1,
      indices: [index],
      name: staff.name
    };
  }
});

console.log('Staff List Summary:');
console.log(`Total staff members: ${STAFF_LIST.length}`);
console.log(`Unique IDs: ${Object.keys(idCounts).length}`);

if (duplicates.length > 0) {
  console.log('\n❌ DUPLICATE IDs FOUND:');
  duplicates.forEach(id => {
    const info = idCounts[id];
    console.log(`  ${id}: ${info.count} occurrences at indices [${info.indices.join(', ')}]`);
    info.indices.forEach(index => {
      console.log(`    [${index}] ${STAFF_LIST[index].name} - ${STAFF_LIST[index].role}`);
    });
  });
} else {
  console.log('\n✅ No duplicate IDs found');
}

console.log('\nAll staff IDs:');
STAFF_LIST.forEach((staff, index) => {
  console.log(`  [${index}] ${staff.id}: ${staff.name}`);
});
