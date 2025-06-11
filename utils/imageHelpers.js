// utils/imageHelpers.js

// This object holds all our image pools.
const IMAGE_POOLS = {
  APARTMENT: [
    require('../assets/properties/type_apartment_A.jpg'),
    require('../assets/properties/type_apartment_B.jpg'),
  ],
  HOUSE: [
    require('../assets/properties/type_house_A.jpg'),
    require('../assets/properties/type_house_B.jpg'),
    require('../assets/properties/type_house_C.jpg'),
  ],
  CONDO: [
    require('../assets/properties/type_condo_A.jpg'),
    require('../assets/properties/type_condo_B.jpg'),
  ],
  LUXURY: [
    require('../assets/properties/type_luxury_A.jpg'),
    require('../assets/properties/type_luxury_B.jpg'),
  ],
};

// This function determines which image pool to use based on the property's type.
const getImagePoolForType = (type = '') => {
  const upperCaseType = type.toUpperCase();
  if (upperCaseType.includes('APARTMENT') || upperCaseType.includes('FLAT')) return IMAGE_POOLS.APARTMENT;
  if (upperCaseType.includes('HOUSE') || upperCaseType.includes('SHACK') || upperCaseType.includes('COTTAGE')) return IMAGE_POOLS.HOUSE;
  if (upperCaseType.includes('CONDO') || upperCaseType.includes('PENTHOUSE') || upperCaseType.includes('DUPLEX') || upperCaseType.includes('LOFT')) return IMAGE_POOLS.CONDO;
  if (upperCaseType.includes('VILLA') || upperCaseType.includes('MANSION') || upperCaseType.includes('ESTATE') || upperCaseType.includes('PALACE')) return IMAGE_POOLS.LUXURY;
  return IMAGE_POOLS.HOUSE; // Default fallback
};

// This is the new, stable image selection function.
export const getDynamicPropertyImage = (property) => {
    // Failsafe for invalid data
    if (!property || !property.id || !property.type) {
        return IMAGE_POOLS.HOUSE[0]; 
    }
    
    // 1. Get the correct pool of images based on the property's type.
    const pool = getImagePoolForType(property.type);

    // 2. Create a simple, deterministic "hash" from the property's unique ID.
    // This ensures that the same property ID will always produce the same number.
    const hash = property.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    // 3. Use the hash to pick a consistent index from the pool.
    // The '%' (modulo) operator guarantees the index is always valid.
    const index = hash % pool.length;
    
    return pool[index];
};