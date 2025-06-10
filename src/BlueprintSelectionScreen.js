import React, { useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GameContext } from '../GameContext';
import { BLUEPRINT_LIST } from '../data/buildingBlueprints';
import { Ionicons } from '@expo/vector-icons';

const BlueprintSelectionScreen = ({ route, navigation }) => {
  const { landAsset } = route.params;
  const { playerLevel, gameMoney, startConstruction, staff } = useContext(GameContext);

  // Check for an available supervisor right at the top
  const idleSupervisor = staff.hired.find(s => s.role === 'Construction' && s.status === 'Idle');

  const availableBlueprints = BLUEPRINT_LIST.filter(bp => 
    playerLevel >= bp.unlockLevel && landAsset.sizeSqFt >= bp.requiredLandSizeSqFt
  );

  const handleSelectBlueprint = (blueprint) => {
    if (startConstruction(landAsset, blueprint)) {
      navigation.replace('Construction', { projectId: landAsset.id });
    }
  };

  // --- NEW: A dedicated component for the "No Staff" message ---
  const NoStaffAvailable = () => (
    <View style={styles.emptyContainer}>
        <Ionicons name="people-circle-outline" size={90} color="#ffae42" />
        <Text style={styles.emptyTitle}>No Supervisor Available</Text>
        <Text style={styles.emptySubtitle}>
            A Construction Supervisor must be hired and idle to start a new project.
        </Text>
        <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => navigation.navigate('StaffCenter')}
        >
            <Text style={styles.actionButtonText}>Go to Staff Center</Text>
        </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0f2027', '#2c5364']} style={styles.background} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={32} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose a Blueprint</Text>
      </View>

      {/* --- NEW: Conditional rendering for the whole screen --- */}
      {/* If a supervisor is available, show the list. If not, show the call-to-action. */}
      {!idleSupervisor ? (
        <NoStaffAvailable />
      ) : (
        <FlatList
          data={availableBlueprints}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 20 }}
          renderItem={({ item }) => {
            const canAfford = gameMoney >= item.phases[0].cost;
            return (
              <View style={[styles.card, !canAfford && styles.disabledCard]}>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.cardSubtitle}>Type: {item.type}</Text>
                  <Text style={styles.cardSubtitle}>Requires: {item.requiredLandSizeSqFt.toLocaleString()} sq. ft.</Text>
                  <Text style={styles.cardSubtitle}>Final Value: ~${item.finalValue.toLocaleString()}</Text>
                </View>
                <TouchableOpacity 
                  style={[styles.buildButton, !canAfford && styles.disabledButton]} 
                  disabled={!canAfford}
                  onPress={() => handleSelectBlueprint(item)}
                >
                  <Text style={styles.buildButtonText}>Build</Text>
                  <Text style={styles.buildButtonCost}>${item.phases[0].cost.toLocaleString()}</Text>
                </TouchableOpacity>
              </View>
            )
          }}
          ListEmptyComponent={
              <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No blueprints available for this land plot at your current level.</Text>
              </View>
          }
        />
      )}
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
  emptyContainer: { 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center', 
      padding: 20,
  },
  emptyTitle: {
      color: '#ffae42',
      fontSize: 22,
      fontWeight: 'bold',
      textAlign: 'center',
      marginTop: 15,
  },
  emptySubtitle: {
      color: '#99a',
      fontSize: 16,
      textAlign: 'center',
      marginTop: 10,
      marginBottom: 30,
  },
  actionButton: {
      backgroundColor: '#DA70D6', // Using the staff color
      paddingVertical: 15,
      paddingHorizontal: 40,
      borderRadius: 30,
  },
  actionButtonText: {
      color: 'white',
      fontSize: 18,
      fontWeight: 'bold',
  },
  emptyText: { color: '#999', textAlign: 'center', fontSize: 16 },
});

export default BlueprintSelectionScreen;