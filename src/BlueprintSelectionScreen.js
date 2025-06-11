import React, { useState, useContext, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Modal, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GameContext } from '../GameContext';
import { BLUEPRINT_LIST } from '../data/buildingBlueprints';
import { Ionicons } from '@expo/vector-icons';

const BlueprintSelectionScreen = ({ route, navigation }) => {
  const { landAsset, architectFirm } = route.params;
  const { playerLevel, gameMoney, startConstruction, staff } = useContext(GameContext);
  
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedBlueprint, setSelectedBlueprint] = useState(null);

  const idleSupervisors = staff.hired.filter(s => s.role === 'Construction' && s.status === 'Idle');

  const availableBlueprints = useMemo(() => 
    BLUEPRINT_LIST.filter(bp => 
      playerLevel >= bp.unlockLevel && landAsset.sizeSqFt >= bp.requiredLandSizeSqFt
    ), 
    [playerLevel, landAsset]
  );

  const handleSelectBlueprint = (blueprint) => {
    if (idleSupervisors.length === 0) {
      Alert.alert(
        "No Supervisor Available",
        "You must hire a Construction Supervisor or wait for one to finish their current project.",
        [
          { text: "OK" },
          { text: "Go to Staff Center", onPress: () => navigation.navigate('StaffCenter') }
        ]
      );
      return;
    }
    setSelectedBlueprint(blueprint);
    setModalVisible(true);
  };

  const handleConfirmConstruction = (blueprint, supervisor) => {
    if (startConstruction(landAsset, blueprint, architectFirm, supervisor)) {
      setModalVisible(false);
      navigation.replace('Construction', { projectId: landAsset.id });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0f2027', '#2c5364']} style={styles.background} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={32} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose a Blueprint</Text>
        <View style={{width: 42}} />
      </View>
      
      <FlatList
        data={availableBlueprints}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 20 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => handleSelectBlueprint(item)}>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardSubtitle}>Type: {item.type}</Text>
            </View>
            <Ionicons name="construct-outline" size={32} color="#43e97b" />
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No blueprints available for this land plot.</Text>}
      />

      <Modal visible={isModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalBackdrop}>
          <LinearGradient colors={['#434343', '#1c1c1c']} style={styles.modalContainer}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Ionicons name="close-circle-outline" size={32} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Assign a Supervisor</Text>
            <Text style={styles.modalSubtitle}>for {selectedBlueprint?.name}</Text>
            
            {idleSupervisors.map(supervisor => {
              if (!selectedBlueprint) return null;
              const totalCost = selectedBlueprint.phases.reduce((sum, phase) => sum + (phase.cost * (architectFirm.costModifier * (supervisor.costModifier || 1))), 0);
              const canAfford = gameMoney >= totalCost;

              return (
                <View key={supervisor.id} style={[styles.bidCard, !canAfford && {opacity: 0.5}]}>
                  <View style={styles.bidInfo}>
                    <Text style={styles.contractorName}>{supervisor.name}</Text>
                    <Text style={styles.bidDetail}>Final Project Cost: <Text style={{color: '#fff'}}>${Math.round(totalCost).toLocaleString()}</Text></Text>
                  </View>
                  <TouchableOpacity disabled={!canAfford} style={[styles.selectButton, !canAfford && {backgroundColor: '#555'}]} onPress={() => handleConfirmConstruction(selectedBlueprint, supervisor)}>
                    <Text style={styles.selectButtonText}>Assign</Text>
                  </TouchableOpacity>
                </View>
              )
            })}
          </LinearGradient>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { position: 'absolute', left: 0, right: 0, top: 0, height: '100%' },
  header: { paddingVertical: 10, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  headerButton: { padding: 5, width: 42, alignItems: 'center' },
  card: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    padding: 20, 
    borderRadius: 10, 
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  cardInfo: { flex: 1 },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  cardSubtitle: { color: '#ccc', fontSize: 14, marginTop: 4 },
  emptyText: { color: '#999', textAlign: 'center', marginTop: 50 },
  // Modal Styles
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContainer: { 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20, 
    padding: 20, 
    paddingTop: 40,
    backgroundColor: '#2c3e50', 
    borderTopWidth: 1, 
    borderColor: '#ffae42' 
  },
  closeButton: { position: 'absolute', top: 10, right: 10 },
  modalTitle: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: '#fff', 
    textAlign: 'center' 
  },
  modalSubtitle: { 
    fontSize: 16, 
    color: '#ccc', 
    textAlign: 'center', 
    marginBottom: 20,
    marginTop: 4,
  },
  bidCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0,0,0,0.2)', 
    padding: 15, 
    borderRadius: 10, 
    marginBottom: 10 
  },
  bidInfo: {
    flex: 1,
  },
  contractorName: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  bidDetail: { 
    color: '#ccc', 
    fontSize: 14, 
    marginTop: 4 
  },
  selectButton: { 
    backgroundColor: '#43e97b', 
    padding: 15, 
    borderRadius: 8, 
    alignItems: 'center',
    marginLeft: 15,
  },
  selectButtonText: { 
    color: 'black', 
    fontWeight: 'bold' 
  },
});

export default BlueprintSelectionScreen;