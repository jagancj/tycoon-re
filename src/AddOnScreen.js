// AddOnScreen.js
import React, { useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Alert } from 'react-native';
import { GameContext } from '../GameContext';
import { Ionicons } from '@expo/vector-icons';

const AddOnScreen = ({ route, navigation }) => {
  const { assetId } = route.params;
  const { playerAssets, installAddOn, gameMoney } = useContext(GameContext);
  const asset = playerAssets.find(a => a.id === assetId);

  const handleInstall = (addOn) => {
    if (gameMoney < addOn.cost) {
      Alert.alert("Insufficient Funds", "You can't afford this add-on right now.");
      return;
    }
    installAddOn(assetId, addOn);
  };

  const availableAddOns = asset.availableAddOns.filter(
    addOn => !(asset.installedAddOns || []).includes(addOn.id)
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="chevron-back" size={32} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Upgrades for {asset.name}</Text>
      </View>
      <FlatList
        data={availableAddOns}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 20 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{flex: 1}}>
                <Text style={styles.addOnName}>{item.name}</Text>
                <Text style={styles.addOnValue}>+${item.valueIncrease.toLocaleString()} Value</Text>
            </View>
            <TouchableOpacity style={styles.installButton} onPress={() => handleInstall(item)}>
                <Text style={styles.installButtonText}>${item.cost.toLocaleString()}</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>All available add-ons have been installed!</Text>}
      />
    </SafeAreaView>
  );
};
// Styles for AddOnScreen...
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#141E30' },
    header: { padding: 20, flexDirection: 'row', alignItems: 'center' },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginLeft: 10 },
    card: { backgroundColor: 'rgba(255,255,255,0.1)', flexDirection: 'row', padding: 20, borderRadius: 10, marginBottom: 15, alignItems: 'center' },
    addOnName: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    addOnValue: { color: '#43e97b', fontSize: 16, marginTop: 5 },
    installButton: { backgroundColor: '#3a7bd5', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
    installButtonText: { color: '#fff', fontWeight: 'bold' },
    emptyText: { color: '#ccc', textAlign: 'center', marginTop: 50, fontSize: 16 }
});

export default AddOnScreen;