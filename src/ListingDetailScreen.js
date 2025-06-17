import React, { useState, useMemo, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Image, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GameContext } from '../GameContext';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { getDynamicPropertyImage } from '../utils/imageHelpers';

const ListingDetailScreen = ({ route, navigation }) => {
  const { assetId } = route.params;
  const { playerAssets, listPropertyWithPrice } = useContext(GameContext);
  // Find the asset from the context.
  const asset = playerAssets.find(a => a.id === assetId);
  
  // This useMemo hook calculates key values only when the asset changes.
  const { totalInvestment, initialAskingPrice, maxAskingPrice } = useMemo(() => {
    if (!asset) return { totalInvestment: 0, initialAskingPrice: 0, maxAskingPrice: 0 };
      // Calculate total investments - use totalInvestment for completed construction projects
    const investment = asset.totalInvestment || asset.invested || asset.purchasePrice || 0;
    
    // Calculate current market value including all improvements
    const baseMarketValue = asset.marketValue || asset.areaAverageValue || investment;
    const marketValue = baseMarketValue + (asset.addedValue || 0); // Include value from add-ons
    
    // Suggest an initial price of 110% of investment (10% profit)
    const initialPrice = Math.round(investment * 1.10);
    
    // Set max list price to 150% of total investment value
    const maxPrice = Math.round(investment * 1.50);
    
    return { 
      totalInvestment: investment,
      initialAskingPrice: Math.max(investment, initialPrice),
      maxAskingPrice: maxPrice
    };
  }, [asset]);
  
  // State for the slider, initialized by the memoized value.
  const [askingPrice, setAskingPrice] = useState(initialAskingPrice);

  // This effect runs if the asset disappears (e.g., sold) to prevent crashes.
  useEffect(() => {
    if (asset === undefined) {
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    }
  }, [asset, navigation]);

  // If the asset doesn't exist yet, render a safe loading state.
  if (!asset) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#0f2027', '#203a43']} style={styles.background} />
      </SafeAreaView>
    );
  }

  // Calculate potential profit dynamically as the slider moves.
  const potentialProfit = askingPrice - totalInvestment;

  // Function to handle the final listing confirmation.
  const handleConfirmListing = () => {
    if (askingPrice <= 0) {
      Alert.alert("Invalid Price", "Please set a valid asking price.");
      return;
    }
    listPropertyWithPrice(asset, askingPrice);
    navigation.navigate('Home');
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={['#0f2027', '#203a43']} style={styles.background} />
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="chevron-back" size={32} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>List Your Property</Text>
      </View>      <ScrollView contentContainerStyle={styles.content}>
        <Image source={getDynamicPropertyImage(asset)} style={styles.image} />
        <Text style={styles.title}>{asset.name}</Text>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Financial Summary</Text>
            {/* Show different breakdown for completed construction vs regular properties */}
          {asset.constructionCompleted ? (
            <>
              <View style={styles.row}>
                <Text style={styles.label}>Land Cost:</Text>
                <Text style={styles.value}>${(asset.landCost || asset.purchasePrice || 0).toLocaleString()}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Architect Fee:</Text>
                <Text style={styles.value}>${(asset.architectCost || 0).toLocaleString()}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Construction Cost:</Text>
                <Text style={styles.value}>${(asset.constructionCost || 0).toLocaleString()}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Supervisor Fee:</Text>
                <Text style={styles.value}>${(asset.supervisorFee || 0).toLocaleString()}</Text>
              </View>
              {asset.addedValue > 0 && (
                <View style={styles.row}>
                  <Text style={styles.label}>Upgrades Value:</Text>
                  <Text style={styles.value}>${asset.addedValue.toLocaleString()}</Text>
                </View>
              )}
            </>
          ) : (
            <>
              <View style={styles.row}>
                <Text style={styles.label}>Purchase Price:</Text>
                <Text style={styles.value}>${(asset.purchasePrice || 0).toLocaleString()}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Invested (Reno/Upgrades):</Text>
                <Text style={styles.value}>${((asset.invested || 0) - (asset.purchasePrice || 0)).toLocaleString()}</Text>
              </View>
            </>
          )}
          
          <View style={styles.separator} />
          <View style={styles.row}>
            <Text style={styles.labelTotal}>Total Investment:</Text>
            <Text style={styles.valueTotal}>${totalInvestment.toLocaleString()}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.labelTotal}>Market Value:</Text>
            <Text style={styles.valueTotal}>${(asset.marketValue || 0).toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Set Your Asking Price</Text>
          <Text style={styles.askingPriceValue}>${askingPrice.toLocaleString()}</Text>
          <Slider
            style={{width: '100%', height: 40}}
            minimumValue={totalInvestment}
            maximumValue={maxAskingPrice}
            step={1000}
            value={askingPrice}
            onValueChange={setAskingPrice}
            minimumTrackTintColor="#FFD700"
            maximumTrackTintColor="rgba(255,255,255,0.3)"
            thumbTintColor="#FFD700"
          />
          
          <View style={styles.row}>
            <Text style={styles.labelProfit}>Potential Profit:</Text>
            <Text style={[styles.valueProfit, potentialProfit < 0 && styles.loss]}>
              {potentialProfit >= 0 ? '$' : '-$'}{Math.abs(potentialProfit).toLocaleString()}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmListing}>
          <Text style={styles.confirmButtonText}>Confirm Listing</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { position: 'absolute', left: 0, right: 0, top: 0, height: '100%' },
  header: { paddingHorizontal: 20, paddingTop: 10, flexDirection: 'row', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginLeft: 15 },
  content: { paddingHorizontal: 20, paddingBottom: 50 },
  image: { width: '100%', height: 200, borderRadius: 15, marginBottom: 15, marginTop: 10 },
  title: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  card: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 20, borderRadius: 10, marginBottom: 20 },
  cardTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 5 },
  label: { color: '#ccc', fontSize: 16 },
  value: { color: '#fff', fontSize: 16, fontWeight: '600' },
  separator: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 10 },
  labelTotal: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  valueTotal: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  askingPriceValue: { color: 'white', fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 10, },
  labelProfit: { color: '#43e97b', fontSize: 18, fontWeight: 'bold' },
  valueProfit: { color: '#43e97b', fontSize: 18, fontWeight: 'bold' },
  loss: { color: '#e63946' },
  confirmButton: { backgroundColor: '#3a7bd5', padding: 18, borderRadius: 10, alignItems: 'center' },
  confirmButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default ListingDetailScreen;