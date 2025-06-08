import React from 'react';
import { View } from 'react-native';
import Svg, { Rect, Polygon } from 'react-native-svg';

// A predefined palette of nice, modern colors for our houses.
const PALETTE = {
  walls: ['#BDBDBD', '#A1887F', '#FFD54F', '#AED581', '#90A4AE', '#FFAB91'],
  roofs: ['#757575', '#6D4C41', '#EF6C00', '#558B2F', '#546E7A', '#D84315'],
  doors: ['#c62828', '#283593', '#00695c', '#f9a825', '#4e342e'],
};

// This component generates a unique visual based on the property's ID.
const GeneratedPropertyImage = ({ property, style }) => {
  // If there's no property, render a simple placeholder.
  if (!property) {
    return <View style={[style, { backgroundColor: '#333' }]} />;
  }

  // Create a simple, deterministic "hash" from the property ID string.
  // This ensures the same property always gets the same colors.
  const hash = property.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  // Use the hash to pick colors from our palette.
  const wallColor = PALETTE.walls[hash % PALETTE.walls.length];
  const roofColor = PALETTE.roofs[hash % PALETTE.roofs.length];
  const doorColor = PALETTE.doors[hash % PALETTE.doors.length];

  // Use the hash to create slight variations in the building shape.
  const buildingHeight = 80 + (hash % 40); // Height varies between 80 and 120

  return (
    <View style={style}>
      <Svg height="100%" width="100%" viewBox="0 0 100 150">
        {/* Sky */}
        <Rect x="0" y="0" width="100" height="150" fill="#E3F2FD" />

        {/* Building Walls */}
        <Rect 
          x="10" 
          y={150 - buildingHeight} 
          width="80" 
          height={buildingHeight} 
          fill={wallColor} 
        />
        
        {/* Roof */}
        <Polygon
          points={`5,${150 - buildingHeight} 100,${150 - buildingHeight} 50,${150 - buildingHeight - 30}`}
          fill={roofColor}
        />

        {/* Door */}
        <Rect 
          x="40" 
          y="120" 
          width="20" 
          height="30" 
          fill={doorColor} 
        />
      </Svg>
    </View>
  );
};

export default GeneratedPropertyImage;