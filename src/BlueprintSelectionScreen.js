import React, { useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GameContext } from '../GameContext';
import { BLUEPRINT_LIST } from '../data/buildingBlueprints';
import { Ionicons } from '@expo/vector-icons';

const BlueprintSelectionScreen = ({ route, navigation }) => {
  const { landAsset } = route.params;
  const { playerLevel, gameMoney, startConstruction } = useContext(GameContext);
  const idleSupervisor = staff.hired.find(s => s.role === 'Construction' && s.status === 'Idle');

  // Filter blueprints to show only those the player can build on this land
  const availableBlueprints = BLUEPRINT_LIST.filter(bp => 
    playerLevel >= bp.unlockLevel && landAsset.sizeSqFt >= bp.requiredLandSizeSqFt
  );

  const handleSelectBlueprint = (blueprint) => {
    // The startConstruction function now returns true or false
    if (startConstruction(landAsset, blueprint)) {
      // Navigate to the construction screen, passing the land's unique ID as the projectId
      navigation.replace('Construction', { projectId: landAsset.id });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0f2027', '#2c5364']} style={styles.background} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={32} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose a Blueprint</Text>
      </View>
      <FlatList
        data={availableBlueprints}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 20 }}
        renderItem={({ item }) => {
          const canAfford = gameMoney >= item.phases[0].cost;
          const canBuild = canAfford && idleSupervisor;

          return (
            <View style={[styles.card, !canAfford && styles.disabledCard]}>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardSubtitle}>Type: {item.type}</Text>
                <Text style={styles.cardSubtitle}>Requires: {item.requiredLandSizeSqFt.toLocaleString()} sq. ft. lot</Text>
                <Text style={styles.cardSubtitle}>Final Value: ~${item.finalValue.toLocaleString()}</Text>
              </View>
              <TouchableOpacity 
                style={[styles.buildButton, !canAfford && styles.disabledButton]} 
                disabled={!canBuild}
                onPress={() => handleSelectBlueprint(item)}
              >
                <Text style={styles.buildButtonText}>Build</Text>
                <Text style={styles.buildButtonCost}>${item.phases[0].cost.toLocaleString()}</Text>
              </TouchableOpacity>
            </View>
          )
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { position: 'absolute', left: 0, right: 0, top: 0, height: '100%' },
  header: { padding: 20, flexDirection: 'row', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginLeft: 15 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: 20, borderRadius: 10, marginBottom: 15 },
  disabledCard: { opacity: 0.5 },
  cardInfo: { flex: 1 },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  cardSubtitle: { color: '#ccc', fontSize: 14, marginTop: 4 },
  buildButton: { backgroundColor: '#43e97b', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, alignItems: 'center' },
  disabledButton: { backgroundColor: '#666' },
  buildButtonText: { color: 'black', fontWeight: 'bold' },
  buildButtonCost: { color: 'black', fontSize: 12 },
});

export default BlueprintSelectionScreen;