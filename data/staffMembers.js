// data/staffMembers.js
export const STAFF_LIST = [
  {
    id: 'STAFF01',
    name: 'Frank "The Foundation" Miller',
    role: 'Construction',
    specialty: 'Rough-in Specialist',
    hireCost: 10000,
    salaryPerDay: 500, // We'll deduct this per game day
    efficiencyModifier: 1.0, // 1.0x is standard speed
    unlockLevel: 1,
  },
  {
    id: 'STAFF02',
    name: 'Isabelle "Izzy" Garcia',
    role: 'Renovation',
    specialty: 'Interior Finishes Pro',
    hireCost: 15000,
    salaryPerDay: 750,
    efficiencyModifier: 1.1, // 10% faster on renovations
    unlockLevel: 5,
  },
  {
    id: 'STAFF03',
    name: 'Kenji Tanaka',
    role: 'Construction',
    specialty: 'Master Planner',
    hireCost: 50000,
    salaryPerDay: 2000,
    efficiencyModifier: 1.5, // 50% faster on construction
    unlockLevel: 15,
  },
  // Add more staff members for different levels and roles
];