import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { GameContext } from '../GameContext';
import Slider from '@react-native-community/slider';
import { getDynamicPropertyImage } from '../utils/imageHelpers';
import TransactionModal from './TransactionModal';
import { Ionicons } from '@expo/vector-icons';

const PropertyDetailScreen = ({ route, navigation }) => {
  const { property } = route.params;
  // FIX: Get agent-related data and functions from the context
  const { gameMoney, buyProperty, hireAgent, agentReports } = useContext(GameContext);
  
  const [offerPrice, setOfferPrice] = useState(property.askingPrice);
  const [modalState, setModalState] = useState({ isVisible: false, status: '', details: {} });
  const agentFee = 1000 + Math.round(property.askingPrice * 0.005); 

  // Check if a report for this specific property exists
  const report = agentReports[property.id];

  // FIX: The handler function for the "Hire Agent" button
  const handleHireAgent = () => {
    if (gameMoney < agentFee) {
      Alert.alert("Insufficient Funds", "You can't afford the agent's fee.");
      return;
    }
    // Call the context function to hire the agent
    hireAgent(property, agentFee);
  };
  const makeOffer = () => {
    console.log(report);
    if(report) {
      const feePercentage = 0.02 + Math.random() * 0.03;
      const acquisitionFee = Math.round(report.agentPrice * feePercentage);
      const totalCost = report.agentPrice + acquisitionFee;
      setOfferPrice(report.agentPrice);
      setModalState({
        isVisible: true,
        status: 'confirm',
        details: { itemName: property.name, itemPrice: report.agentPrice, fee: acquisitionFee, totalCost: totalCost }
      });
    } else {
      if (offerPrice < property.baseValue) {
        Alert.alert("Offer Rejected!", "Your offer is too low for the seller to even consider.");
        return;
      }
      const feePercentage = 0.02 + Math.random() * 0.03;
      const acquisitionFee = Math.round(offerPrice * feePercentage);
      const totalCost = offerPrice + acquisitionFee;
      setModalState({
        isVisible: true,
        status: 'confirm',
        details: { itemName: property.name, itemPrice: offerPrice, fee: acquisitionFee, totalCost: totalCost }
      });
    }
  };
  const handleConfirmPurchase = () => {
    const purchasePrice = modalState.details.itemPrice;
    if (buyProperty(property, purchasePrice)) {
      setModalState(prev => ({ ...prev, status: 'success' }));
    } else {
      const totalCost = modalState.details.totalCost;
      setModalState(prev => ({ ...prev, status: 'insufficient_funds', details: { ...prev.details, playerMoney: gameMoney, totalCost: totalCost } }));
    }
  };

  const handleCloseModal = () => {
    const success = modalState.status === 'success';
    setModalState({ isVisible: false, status: '', details: {} });
    if (success) {
      navigation.replace('Portfolio');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TransactionModal 
        isVisible={modalState.isVisible}
        status={modalState.status}
        details={modalState.details}
        onClose={handleCloseModal}
        onConfirm={handleConfirmPurchase}
      />
      <ImageBackground source={getDynamicPropertyImage(property)} style={styles.bgImage} blurRadius={5}>
        <View style={styles.overlay}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="close-outline" size={32} color="#fff" />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <Text style={styles.title}>{property.name}</Text>
                <Text style={styles.subtitle}>{property.type}</Text>

                <View style={styles.detailsCard}>
                    <Text style={styles.label}>Asking Price</Text>
                    <Text style={styles.value}>${property.askingPrice.toLocaleString()}</Text>
                    
                    {/* --- FIX: UI for Agent feature is re-integrated --- */}                    {!report ? (
                      <View>
                        <TouchableOpacity style={styles.agentButton} onPress={handleHireAgent}>
                          <Text style={styles.agentButtonText}>Hire Agent to Negotiate (${agentFee.toLocaleString()})</Text>                        </TouchableOpacity>

                        <Text style={styles.label}>Your Offer</Text>
                        <Text style={styles.value}>${offerPrice.toLocaleString()}</Text>
                        <Slider
                            minimumValue={property.baseValue * 0.9}
                            maximumValue={property.askingPrice * 1.05}
                            step={100}
                            value={offerPrice}
                            onValueChange={setOfferPrice}
                            minimumTrackTintColor="#43e97b"
                            maximumTrackTintColor="rgba(255,255,255,0.3)"
                            thumbTintColor="#fff"
                        />
                      </View>
                    ) : (
                      <View style={styles.reportCard}>
                          <Text style={styles.reportTitle}>Agent's Deal</Text>
                          <Text style={styles.reportText}>- Agent Negotiated Price: <Text style={styles.reportValueRed}>${report.agentPrice.toLocaleString()}</Text></Text>
                          <Text style={styles.reportSubText}>Agent got a discount of <Text style={styles.reportValueRed}>${(property.askingPrice - report.agentPrice).toLocaleString()} </Text>from the asking price.</Text>
                      </View>
                    )}

                
                    <TouchableOpacity 
                        style={[styles.button, offerPrice > gameMoney && {backgroundColor: '#666'}]} 
                        onPress={makeOffer}
                        disabled={offerPrice > gameMoney}
                    >
                        <Text style={styles.buttonText}>Make Offer</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

// --- Stylesheet now includes styles for the Agent button and report ---
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'black' },
    bgImage: { flex: 1 },
    overlay: { backgroundColor: 'rgba(0,0,0,0.6)', flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'flex-end', padding: 10 },
    backButton: { backgroundColor: 'rgba(0,0,0,0.5)', padding: 4, borderRadius: 20 },
    content: { flex: 1, justifyContent: 'flex-end', padding: 20 },
    title: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginBottom: 5, textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: {width: -1, height: 1}, textShadowRadius: 10 },
    subtitle: { color: '#ccc', fontSize: 18, marginBottom: 20, textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: {width: -1, height: 1}, textShadowRadius: 10 },
    detailsCard: { backgroundColor: 'rgba(0,0,0,0.7)', padding: 20, borderRadius: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    label: { color: '#ccc', fontSize: 16 },
    value: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 15 },
    button: { backgroundColor: '#43e97b', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 15 },
    buttonText: { color: 'black', fontSize: 18, fontWeight: 'bold' },
    agentButton: { backgroundColor: '#ffae42', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 20 },
    agentButtonText: { color: 'black', fontSize: 16, fontWeight: 'bold' },
    reportCard: { backgroundColor: 'rgba(0,0,0,0.3)', padding: 15, borderRadius: 10, marginBottom: 20 },
    reportTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
    reportText: { color: '#ccc', fontSize: 16, marginBottom: 3 },
    reportSubText: { color: '#ccc', fontSize: 14, marginBottom: 3 },
    reportValueRed: { color: '#e63946', fontWeight: 'bold' },
    reportValueGreen: { color: '#43e97b', fontWeight: 'bold' },
});

export default PropertyDetailScreen;