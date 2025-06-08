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

// This function gets a random image from a given pool.
export const getDynamicPropertyImage = (property) => {
    if (!property || !property.type) {
        // Return a default placeholder if property or type is missing
        return IMAGE_POOLS.HOUSE[0]; 
    }
    const pool = getImagePoolForType(property.type);
    // Use the property ID to make the "random" choice consistent for the same property
    const hash = property.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return pool[hash % pool.length];
};