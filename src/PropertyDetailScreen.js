import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { GameContext } from '../GameContext';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons'; // Import Ionicons
import { getDynamicPropertyImage } from '../utils/imageHelpers';

const AGENT_FEE = 2500;
const PropertyDetailScreen = ({ route, navigation }) => {
  const { property } = route.params;
  const { gameMoney, buyProperty, agentReports, hireAgent } = useContext(GameContext);
  const [offerPrice, setOfferPrice] = useState(property.askingPrice);

const report = agentReports[property.id];
const handleHireAgent = () => {
    if (gameMoney < AGENT_FEE) {
      Alert.alert("Insufficient Funds", "You can't afford the agent's fee.");
      return;
    }
    hireAgent(property.id, AGENT_FEE);
  };
  const makeOffer = () => {
    if (offerPrice < property.baseValue) {
      Alert.alert("Offer Rejected!", "Your offer is too low for the seller to even consider.");
      return;
    }
    
    const successChance = (offerPrice - property.baseValue) / (property.askingPrice - property.baseValue);
    if (Math.random() < successChance || offerPrice >= property.askingPrice) {
      if (buyProperty(property, offerPrice)) {
        Alert.alert("Offer Accepted!", `Congratulations on your new property! $${offerPrice.toLocaleString()} has been deducted.`);
        
        // --- FIX 2: Navigation logic updated ---
        // Replace the current screen with the Portfolio screen instead of just navigating.
        // This removes the "Make Offer" screen from the back-stack.
        navigation.replace('Portfolio');

      } else {
        Alert.alert("Transaction Failed", "You don't have enough funds for this offer.");
      }
    } else {
      Alert.alert("Offer Rejected!", "The seller decided to hold out for a better price. Try offering more.");
    }
  };

  return (
    <SafeAreaView style={{flex: 1}}>
        <ImageBackground source={getDynamicPropertyImage(property)}style={styles.bgImage} blurRadius={5}>
            <View style={styles.overlay}>
                {/* --- FIX 1: Back button added to a proper header --- */}
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
                        <Text style={styles.label}>Your Offer</Text>
                        <Text style={styles.value}>${offerPrice.toLocaleString()}</Text>
                        <Slider
                            minimumValue={property.baseValue * 0.9}
                            maximumValue={property.askingPrice * 1.05}
                            step={100}
                            value={offerPrice}
                            onValueChange={setOfferPrice}
                            minimumTrackTintColor="#43e97b"
                            thumbTintColor="#fff"
                        />
                        {!report ? (
              <TouchableOpacity style={styles.agentButton} onPress={handleHireAgent}>
                <Text style={styles.agentButtonText}>Hire Agent to Inspect (${AGENT_FEE.toLocaleString()})</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.reportCard}>
                  <Text style={styles.reportTitle}>Agent's Report</Text>
                  <Text style={styles.reportText}>- Hidden Damage Repairs: <Text style={{color: '#e63946'}}>${report.hiddenDamage.toLocaleString()}</Text></Text>
                  <Text style={styles.reportText}>- Renovated Area Value: <Text style={{color: '#43e97b'}}>${report.areaAverage.toLocaleString()}</Text></Text>
              </View>
            )}
                        <TouchableOpacity style={[styles.button, offerPrice > gameMoney && {backgroundColor: '#e63946'}]} onPress={makeOffer}>
                            <Text style={styles.buttonText}>Make Offer</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    bgImage: { flex: 1 },
    overlay: { backgroundColor: 'rgba(0,0,0,0.6)', flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: 10,
    },
    backButton: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 16,
    },
    content: {
        flex: 1,
        justifyContent: 'flex-end',
        padding: 20,
    },
    title: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginBottom: 5 },
    subtitle: { color: '#ccc', fontSize: 18, marginBottom: 20 },
    detailsCard: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 20, borderRadius: 15 },
    label: { color: '#ccc', fontSize: 16 },
    value: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 15 },
    button: { backgroundColor: '#43e97b', padding: 15, borderRadius: 10, alignItems: 'center' },
    buttonText: { color: 'black', fontSize: 18, fontWeight: 'bold' },
     agentButton: { backgroundColor: '#ffae42', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
    agentButtonText: { color: 'black', fontSize: 16, fontWeight: 'bold' },
    reportCard: { backgroundColor: 'rgba(0,0,0,0.3)', padding: 15, borderRadius: 10, marginBottom: 10 },
    reportTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
    reportText: { color: '#ccc', fontSize: 16, marginBottom: 3 },
});

export default PropertyDetailScreen;