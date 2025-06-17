import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Modal, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GameContext } from '../GameContext';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';

const LandMarketScreen = ({ navigation }) => {
  const { 
    currentLandBatch = [], 
    landBatchPurchased = [], 
    generateNewLandBatch, 
    isCurrentLandBatchCompleted,
    buyLand, 
    gameMoney 
  } = useContext(GameContext);
  // State to manage the pop-up modal
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedLand, setSelectedLand] = useState(null);
  const [offerPrice, setOfferPrice] = useState(0);

  // Check if we should show the "Show Land Plots" button
  const shouldShowButton = currentLandBatch.length === 0 || isCurrentLandBatchCompleted();

  // Get available land plots from current batch (those not yet purchased)
  const availableLandPlots = currentLandBatch.filter(
    plot => !landBatchPurchased.includes(plot.id)
  );

  const handleShowLandPlots = () => {
    generateNewLandBatch();
  };

  const ShowLandPlotsButton = () => (
    <View style={styles.buttonContainer}>
      <TouchableOpacity 
        style={styles.showLandPlotsButton} 
        onPress={handleShowLandPlots}
      >
        <Ionicons name="map-outline" size={24} color="#000" style={styles.buttonIcon} />
        <Text style={styles.showLandPlotsButtonText}>
          {currentLandBatch.length === 0 ? 'Show Land Plots' : 'Show New Land Plots'}
        </Text>
      </TouchableOpacity>
      <Text style={styles.buttonSubtext}>
        Discover 5 new land plots sorted by price
      </Text>
    </View>
  );

  const ListEmptyMessage = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="map-outline" size={80} color="#667" />
      <Text style={styles.emptyTitle}>No Land Plots Available</Text>
      <Text style={styles.emptySubtitle}>
        All land plots from the current batch have been purchased.
      </Text>
      <Text style={styles.emptyHint}>
        Use the "Show New Land Plots" button to see more options.
      </Text>
    </View>
  );
  const handleOpenModal = (landPlot) => {
    setSelectedLand(landPlot);
    setOfferPrice(landPlot.askingPrice); // Default offer to asking price
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedLand(null);
  };

  const handleMakeOffer = () => {
    if (!selectedLand) return;

    if (offerPrice < selectedLand.baseValue) {
      Alert.alert("Offer Rejected!", "Your offer is too low for the seller to even consider.");
      return;
    }
    
    // Simple negotiation logic
    const successChance = (offerPrice - selectedLand.baseValue) / (selectedLand.askingPrice - selectedLand.baseValue);
    if (Math.random() < successChance || offerPrice >= selectedLand.askingPrice) {
      if (buyLand(selectedLand, offerPrice)) {
        Alert.alert("Purchase Successful!", `Congratulations! You have acquired ${selectedLand.name}.`);
        handleCloseModal();
      } else {
        Alert.alert("Transaction Failed", "You do not have enough funds to cover the purchase and fees.");
      }
    } else {
      Alert.alert("Offer Rejected!", "The seller decided to hold out for a better price. Try offering more.");
    }
  };  return (
    <View style={styles.sceneContainer}>
      {/* Background now provided by parent MarketScreen */}

      {shouldShowButton ? (
        <ShowLandPlotsButton />
      ) : (
        <FlatList
          data={availableLandPlots}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingHorizontal: 15, paddingTop: 20, flexGrow: 1 }}
          ListEmptyComponent={ListEmptyMessage}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => handleOpenModal(item)}>
              <Ionicons name="map-outline" size={40} color="#43e97b" />
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardSubtitle}>{item.locationType} - {item.sizeSqFt.toLocaleString()} sq. ft.</Text>
              </View>
              <Text style={styles.cardPrice}>${item.askingPrice.toLocaleString()}</Text>
              {landBatchPurchased.includes(item.id) && (
                <View style={styles.soldOverlay}>
                  <Text style={styles.soldText}>SOLD</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      )}

      {/* Batch Progress Indicator */}
      {currentLandBatch.length > 0 && !shouldShowButton && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Land Plots: {landBatchPurchased.length} / {currentLandBatch.length} sold
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressBarFill, 
                { width: `${(landBatchPurchased.length / currentLandBatch.length) * 100}%` }
              ]} 
            />
          </View>
        </View>
      )}

      {/* --- The Negotiation and Purchase Modal --- */}
      <Modal visible={isModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalBackdrop}>
          <LinearGradient colors={['#434343', '#1c1c1c']} style={styles.modalContainer}>
            {selectedLand && (
              <>
                <TouchableOpacity style={styles.closeButton} onPress={handleCloseModal}>
                  <Ionicons name="close-circle-outline" size={32} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>{selectedLand.name}</Text>
                <Text style={styles.modalSubtitle}>{selectedLand.locationType} - {selectedLand.sizeSqFt.toLocaleString()} sq. ft.</Text>
                <View style={styles.modalCard}>
                  <Text style={styles.label}>Asking Price: <Text style={styles.value}>${selectedLand.askingPrice.toLocaleString()}</Text></Text>
                  <Text style={styles.label}>Your Offer:</Text>
                  <Text style={styles.offerValue}>${offerPrice.toLocaleString()}</Text>
                  <Slider
                    style={{width: '100%', height: 40}}
                    minimumValue={selectedLand.baseValue * 0.9}
                    maximumValue={selectedLand.askingPrice * 1.05}
                    step={500}
                    value={offerPrice}
                    onValueChange={setOfferPrice}
                    minimumTrackTintColor="#43e97b"
                    maximumTrackTintColor="rgba(255,255,255,0.3)"
                    thumbTintColor="#fff"
                  />
                </View>
                <TouchableOpacity 
                  style={[styles.confirmButton, offerPrice > gameMoney && {backgroundColor: '#666'}]}
                  onPress={handleMakeOffer}
                  disabled={offerPrice > gameMoney}
                >
                  <Text style={styles.confirmButtonText}>Make Offer</Text>
                </TouchableOpacity>
              </>
            )}
          </LinearGradient>
        </View>
      </Modal>
    </View>
  );
};

// Stylesheet now includes modal styles and batch system styles
const styles = StyleSheet.create({
  sceneContainer: { 
    flex: 1,
    backgroundColor: 'transparent' // Transparent to show parent background
  },
  // Removed background style since it's no longer needed
  
  // Button Container Styles
  buttonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20
  },
  showLandPlotsButton: {
    backgroundColor: '#43e97b',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  buttonIcon: {
    marginRight: 12
  },
  showLandPlotsButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold'
  },
  buttonSubtext: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 15,
    paddingHorizontal: 20
  },

  // Empty State Styles
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center'
  },
  emptySubtitle: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 24
  },
  emptyHint: {
    color: '#43e97b',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 15,
    fontStyle: 'italic'
  },
  // Card Styles
  card: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(32, 58, 67, 0.7)', // Blend with gradient middle color 
    padding: 20, 
    borderRadius: 10, 
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    position: 'relative'
  },
  cardInfo: { 
    flex: 1, 
    marginHorizontal: 15 
  },
  cardTitle: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  cardSubtitle: { 
    color: '#ccc', 
    fontSize: 14, 
    marginTop: 4 
  },
  cardPrice: { 
    color: '#43e97b', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },

  // Sold Overlay
  soldOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5
  },
  soldText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  // Progress Indicator
  progressContainer: {
    padding: 20,
    backgroundColor: 'rgba(44, 83, 100, 0.6)', // Match gradient bottom color with transparency
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressText: {
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 16
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#43e97b',
    borderRadius: 3
  },

  // Modal Styles
  modalBackdrop: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.7)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 
  },
  modalContainer: { 
    width: '100%', 
    padding: 20, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.2)' 
  },
  closeButton: { 
    alignSelf: 'flex-end', 
    marginBottom: 10 
  },
  modalTitle: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#fff', 
    textAlign: 'center' 
  },
  modalSubtitle: { 
    fontSize: 16, 
    color: '#ccc', 
    textAlign: 'center', 
    marginBottom: 20 
  },
  modalCard: { 
    backgroundColor: 'rgba(0,0,0,0.3)', 
    padding: 20, 
    borderRadius: 15, 
    width: '100%' 
  },
  label: { 
    color: '#ccc', 
    fontSize: 16 
  },
  value: { 
    color: '#fff', 
    fontWeight: 'bold' 
  },
  offerValue: { 
    color: '#43e97b', 
    fontSize: 28, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    marginVertical: 10 
  },
  confirmButton: { 
    backgroundColor: '#43e97b', 
    padding: 15, 
    borderRadius: 10, 
    alignItems: 'center', 
    marginTop: 20 
  },
  confirmButtonText: { 
    color: 'black', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
});

export default LandMarketScreen;