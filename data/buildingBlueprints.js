// data/buildingBlueprints.js
export const BLUEPRINT_LIST = [
  {
    id: 'BLD01',
    name: 'Cozy Bungalow',
    type: 'Residential',
    requiredLandSizeSqFt: 4000, // Minimum size required
    // Construction is now phased
    phases: [
      { name: 'Permits & Planning', cost: 10000, duration: 5 }, // duration in seconds
      { name: 'Foundation & Framing', cost: 50000, duration: 20 },
      { name: 'Utilities & Finishing', cost: 40000, duration: 15 },
    ],
    finalValue: 250000, // The market value of the completed property
    xpReward: 500,
    unlockLevel: 1,
  },
  {
    id: 'BLD02',
    name: 'Suburban Family Home',
    type: 'Residential',
    requiredLandSizeSqFt: 6000,
    phases: [
      { name: 'Permits & Planning', cost: 25000, duration: 5 },
      { name: 'Foundation & Framing', cost: 120000, duration: 30 },
      { name: 'Interior & Exterior', cost: 90000, duration: 25 },
      { name: 'Landscaping', cost: 30000, duration: 10 },
    ],
    finalValue: 550000,
    xpReward: 1200,
    unlockLevel: 8,
  },
  {
    id: 'BLD03',
    name: 'Local Shops Plaza',
    type: 'Commercial',
    requiredLandSizeSqFt: 15000,
    phases: [
      { name: 'Commercial Zoning', cost: 100000, duration: 10 },
      { name: 'Foundation & Steel Frame', cost: 400000, duration: 60 },
      { name: 'Storefronts & Parking', cost: 350000, duration: 45 },
    ],
    finalValue: 1500000,
    xpReward: 5000,
    unlockLevel: 18,
  },
];