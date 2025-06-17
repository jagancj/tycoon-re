import React, { useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { GameContext } from '../GameContext';
import { useNavigation } from '@react-navigation/native';
import { getDynamicPropertyImage } from '../utils/imageHelpers';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from "expo-linear-gradient";

const PropertyMarketScreen = () => {
  const navigation = useNavigation();
  const { 
    currentMarketplaceBatch = [], 
    marketplaceBatchPurchased = [], 
    generateNewMarketplaceBatch, 
    isCurrentBatchCompleted 
  } = useContext(GameContext);

  // Check if we should show the "Show Properties" button
  const shouldShowButton = currentMarketplaceBatch.length === 0 || isCurrentBatchCompleted();

  // Get available properties from current batch (those not yet purchased)
  const availableProperties = currentMarketplaceBatch.filter(
    property => !marketplaceBatchPurchased.includes(property.id)
  );

  const handleShowProperties = () => {
    generateNewMarketplaceBatch();
  };

  const ShowPropertiesButton = () => (
    <View style={styles.buttonContainer}>      <TouchableOpacity 
        style={styles.showPropertiesButton} 
        onPress={handleShowProperties}
        testID="show-properties-button"
      >
        <Ionicons name="eye-outline" size={24} color="#000" style={styles.buttonIcon} />
        <Text style={styles.showPropertiesButtonText}>
          {currentMarketplaceBatch.length === 0 ? 'Show Properties' : 'Show New Properties'}
        </Text>
      </TouchableOpacity>
      <Text style={styles.buttonSubtext}>
        Discover 5 new properties on the market
      </Text>
    </View>
  );

  const ListEmptyMessage = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="storefront-outline" size={80} color="#667" />
      <Text style={styles.emptyTitle}>No Properties Available</Text>
      <Text style={styles.emptySubtitle}>
        All properties from the current batch have been purchased.
      </Text>
      <Text style={styles.emptyHint}>
        Use the "Show New Properties" button to see more options.
      </Text>
    </View>
  );  return (
    <View style={styles.sceneContainer} testID="property-market-container">
      {/* Background now provided by parent MarketScreen */}

      {shouldShowButton ? (
        <ShowPropertiesButton />
      ) : (
        <FlatList
          data={availableProperties}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingHorizontal: 15, paddingTop: 20, flexGrow: 1 }}
          ListEmptyComponent={ListEmptyMessage}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.itemCard} 
              onPress={() => navigation.navigate('PropertyDetail', { property: item })}
              testID={`property-card-${item.id}`}
            >
              <Image source={getDynamicPropertyImage(item)} style={styles.itemImage} />
              <View style={styles.itemOverlay}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>Asking: ${item.askingPrice.toLocaleString()}</Text>
                <Text style={styles.itemType}>{item.type}</Text>
              </View>
              {marketplaceBatchPurchased.includes(item.id) && (
                <View style={styles.soldOverlay}>
                  <Text style={styles.soldText}>SOLD</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      )}      {/* Batch Progress Indicator */}
      {currentMarketplaceBatch.length > 0 && !shouldShowButton && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Properties: {marketplaceBatchPurchased.length} / {currentMarketplaceBatch.length} sold
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressBarFill, 
                { width: `${(marketplaceBatchPurchased.length / currentMarketplaceBatch.length) * 100}%` }
              ]} 
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  sceneContainer: {
    flex: 1,
    backgroundColor: 'transparent', // Transparent to show parent background
  },
  // Removed background style since it's no longer needed
  buttonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  showPropertiesButton: {
    backgroundColor: '#43e97b',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonIcon: {
    marginRight: 12,
  },
  showPropertiesButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonSubtext: {
    color: '#99a',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 15,
    fontStyle: 'italic',
  },  itemCard: { 
    height: 200, 
    borderRadius: 15, 
    overflow: 'hidden', 
    marginBottom: 15, 
    elevation: 5, 
    backgroundColor: 'rgba(51, 51, 68, 0.8)', // Adjusted to blend better with gradient
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    position: 'relative',
  },
  itemImage: { 
    width: '100%', 
    height: '100%' 
  },
  itemOverlay: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    padding: 10 
  },
  itemName: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  itemPrice: { 
    color: '#43e97b', 
    fontSize: 16 
  },
  itemType: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 2,
  },
  soldOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldText: {
    color: '#ff4444',
    fontSize: 24,
    fontWeight: 'bold',
    transform: [{ rotate: '-15deg' }],
  },
  emptyContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 15,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#99a',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
  emptyHint: {
    color: '#43e97b',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 15,
    fontStyle: 'italic',
  },  progressContainer: {
    backgroundColor: 'rgba(44, 83, 100, 0.6)', // Match gradient bottom color with transparency
    padding: 15,
    margin: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#43e97b',
    borderRadius: 3,
  },
});

export default PropertyMarketScreen;