// data/architectFirms.js
export const ARCHITECT_FIRMS = [
  {
    id: 'FIRM01',
    name: 'SwiftBuild Planners',
    motto: '"Fast, functional, and affordable."',
    hireCost: 5000,
    costModifier: 0.95,      // -5% construction cost
    qualityModifier: 0.98,   // -2% final value
    efficiencyModifier: 1.1, // +10% speed
    unlockLevel: 1,
  },
  {
    id: 'FIRM02',
    name: 'Prestige Designs',
    motto: '"Perfection, at any price."',
    hireCost: 100000,
    costModifier: 1.20,      // +20% construction cost
    qualityModifier: 1.15,   // +15% final value
    efficiencyModifier: 0.9, // -10% speed (they take their time)
    unlockLevel: 15,
  },
  {
    id: 'FIRM03',
    name: 'EcoConstruct Solutions',
    motto: '"Building a greener tomorrow."',
    hireCost: 25000,
    costModifier: 1.05,      // +5% cost for special materials
    qualityModifier: 1.05,   // +5% value (highly desirable)
    efficiencyModifier: 1.0, // Standard speed
    unlockLevel: 10,
  },
];