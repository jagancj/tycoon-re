import React, { useState, useContext, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Modal, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GameContext } from '../GameContext';
import { LAND_PLOT_LIST } from '../data/landPlots';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';

const LandMarketScreen = ({ navigation }) => {
  const { playerLevel, playerAssets, buyLand, gameMoney } = useContext(GameContext);
const shuffleArray = (array) => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex > 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
};
  // State to manage the pop-up modal
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedLand, setSelectedLand] = useState(null);
  const [offerPrice, setOfferPrice] = useState(0);
  const PROPERTIES_TO_SHOW = 7;
  const ownedLandIds = playerAssets.filter(asset => asset.assetType === 'Land').map(asset => asset.id.split('_')[0]);

  // --- Modal & Purchase Functions ---
   const availableProperties = useMemo(() => {
    const filteredPlots = LAND_PLOT_LIST.filter(
    plot => plot.minLevel <= playerLevel && !ownedLandIds.includes(plot.id)
  );
  const availablePlots = shuffleArray(filteredPlots).slice(0, PROPERTIES_TO_SHOW);
      // Filter out properties that have been sold
      return availablePlots;
  
    }, [playerLevel, playerAssets]);
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
  };

  return (
    <View style={styles.sceneContainer}>
      {/* <LinearGradient colors={['#0f2027', '#1D2B64']} style={styles.background} /> */}

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

      <FlatList
        data={availableProperties}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 20, flexGrow: 1 }}
        ListEmptyComponent={<Text style={styles.emptyText}>No land available at your current level.</Text>}
        renderItem={({ item }) => (
          // The onPress now opens the modal instead of navigating
          <TouchableOpacity style={styles.card} onPress={() => handleOpenModal(item)}>
            <Ionicons name="map-outline" size={40} color="#43e97b" />
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardSubtitle}>{item.locationType} - {item.sizeSqFt.toLocaleString()} sq. ft.</Text>
            </View>
            <Text style={styles.cardPrice}>${item.askingPrice.toLocaleString()}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

// Stylesheet now includes modal styles
const styles = StyleSheet.create({
    sceneContainer: { flex: 1 },
    background: { position: 'absolute', left: 0, right: 0, top: 0, height: '100%' },
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: 20, borderRadius: 10, marginBottom: 15 },
    cardInfo: { flex: 1, marginHorizontal: 15 },
    cardTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    cardSubtitle: { color: '#ccc', fontSize: 14, marginTop: 4 },
    cardPrice: { color: '#43e97b', fontSize: 18, fontWeight: 'bold' },
    emptyText: { color: '#ccc', textAlign: 'center', marginTop: 50, fontSize: 16 },
    // Modal Styles
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContainer: { width: '100%', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    closeButton: { alignSelf: 'flex-end', marginBottom: 10 },
    modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
    modalSubtitle: { fontSize: 16, color: '#ccc', textAlign: 'center', marginBottom: 20 },
    modalCard: { backgroundColor: 'rgba(0,0,0,0.3)', padding: 20, borderRadius: 15, width: '100%' },
    label: { color: '#ccc', fontSize: 16 },
    value: { color: '#fff', fontWeight: 'bold' },
    offerValue: { color: '#43e97b', fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginVertical: 10 },
    confirmButton: { backgroundColor: '#43e97b', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 20 },
    confirmButtonText: { color: 'black', fontSize: 18, fontWeight: 'bold' },
});

export default LandMarketScreen;