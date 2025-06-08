import React, { useState, useMemo, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Image, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GameContext } from '../GameContext';
import { Ionicons } from '@expo/vector-icons';

const ListingDetailScreen = ({ route, navigation }) => {
  const { assetId } = route.params;
  const { playerAssets, listPropertyWithPrice } = useContext(GameContext);
  const asset = playerAssets.find(a => a.id === assetId);

  const [askingPrice, setAskingPrice] = useState('');

  useEffect(() => {
    if (asset) {
      const suggestedPrice = Math.round(asset.marketValue * 1.10);
      setAskingPrice(suggestedPrice.toString());
    } else {
      // --- THE FIX ---
      // If the asset disappears (because it was sold), this screen is stale.
      // Instead of navigating forward, we just go back, removing this
      // stale screen from the navigation history and breaking the loop.
      if (navigation.canGoBack()) {
          navigation.goBack();
      }
    }
  }, [asset, navigation]);

  const { totalInvestment, potentialProfit } = useMemo(() => {
    if (!asset) {
      return { totalInvestment: 0, potentialProfit: 0 };
    }
    const numericAskingPrice = parseInt(askingPrice, 10) || 0;
    const totalInv = asset.invested || asset.purchasePrice;
    const potentialPft = numericAskingPrice - totalInv;
    return { totalInvestment: totalInv, potentialProfit: potentialPft };
  }, [askingPrice, asset]);

  if (!asset) {
    // This now serves as a brief loading/fallback state while the useEffect navigates away.
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#0f2027', '#203a43']} style={styles.background} />
      </SafeAreaView>
    );
  }

  const handleConfirmListing = () => {
    const numericAskingPrice = parseInt(askingPrice, 10);
    if (isNaN(numericAskingPrice) || numericAskingPrice <= 0) {
      Alert.alert("Invalid Price", "Please enter a valid asking price.");
      return;
    }
    listPropertyWithPrice(assetId, numericAskingPrice);
    navigation.navigate('Portfolio');
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0f2027', '#203a43']} style={styles.background} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="chevron-back" size={32} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>List Your Property</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Image source={{ uri: asset.image }} style={styles.image} />
        <Text style={styles.title}>{asset.name}</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Financial Summary</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Purchase Price:</Text>
            <Text style={styles.value}>${asset.purchasePrice.toLocaleString()}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Total Invested (Reno/Upgrades):</Text>
            <Text style={styles.value}>${((totalInvestment || 0) - (asset.purchasePrice || 0)).toLocaleString()}</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.row}>
            <Text style={styles.labelTotal}>Total Investment:</Text>
            <Text style={styles.valueTotal}>${totalInvestment.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Set Your Price</Text>
          <Text style={styles.label}>Current Market Value: ${asset.marketValue.toLocaleString()}</Text>
          <TextInput
            style={styles.input}
            value={askingPrice}
            onChangeText={setAskingPrice}
            keyboardType="numeric"
            placeholder="Enter Your Asking Price"
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
  );
};

// Your styles remain the same
const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { position: 'absolute', left: 0, right: 0, top: 0, height: '100%' },
  header: { paddingHorizontal: 20, paddingTop: 10, flexDirection: 'row', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginLeft: 15 },
  content: { padding: 20, paddingBottom: 50 },
  image: { width: '100%', height: 200, borderRadius: 15, marginBottom: 15 },
  title: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  card: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 20, borderRadius: 10, marginBottom: 20 },
  cardTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 5 },
  label: { color: '#ccc', fontSize: 16 },
  value: { color: '#fff', fontSize: 16, fontWeight: '600' },
  separator: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 10 },
  labelTotal: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  valueTotal: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  input: { backgroundColor: 'rgba(0,0,0,0.3)', color: '#fff', padding: 15, borderRadius: 8, fontSize: 18, marginVertical: 10 },
  labelProfit: { color: '#43e97b', fontSize: 18, fontWeight: 'bold' },
  valueProfit: { color: '#43e97b', fontSize: 18, fontWeight: 'bold' },
  loss: { color: '#e63946' },
  confirmButton: { backgroundColor: '#3a7bd5', padding: 18, borderRadius: 10, alignItems: 'center' },
  confirmButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default ListingDetailScreen;