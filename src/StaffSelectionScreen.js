import React, { useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GameContext } from '../GameContext';

const StaffSelectionScreen = ({ navigation, route }) => {
  const { staff, assignStaffToProject, gameMoney, startConstruction } = useContext(GameContext);
  const { projectId, projectType, requiredRole, phases, blueprint, landAsset, architectFirm } = route.params;

  // Debug logging to help identify the issue
  console.log('StaffSelectionScreen Debug:', {
    projectType,
    phasesExists: !!phases,
    phasesLength: phases ? phases.length : 0,
    blueprintExists: !!blueprint,
    blueprintPhasesExists: blueprint ? !!blueprint.phases : false,
    blueprintName: blueprint ? blueprint.name : 'undefined'
  });

  // Filter available staff for this project type
  const availableStaff = staff.availableToHire.filter(s => 
    s.role === requiredRole &&
    !staff.hired.some(hired => hired.id === s.id)
  );
  const handleSelectStaff = (staffMember) => {    if (projectType === 'Construction') {
      // For construction projects, start construction directly with the selected supervisor
      const architectCost = architectFirm?.hireCost || 0;
      const success = startConstruction(landAsset, blueprint, staffMember, architectCost);
      if (success) {
        navigation.navigate('Construction', { projectId: landAsset.id });
      }
    } else {
      // For renovation projects, assign staff and go back
      const success = assignStaffToProject(staffMember, projectId, projectType, phases);
      if (success) {
        navigation.goBack();
      }
    }
  };
  const renderStaffMember = ({ item }) => {
    const durationDays = projectType === 'Construction' 
      ? (phases && phases.length > 0 ? phases.reduce((total, phase) => total + phase.duration, 0) : 30) // Default 30 days if phases undefined
      : 14; // Default renovation duration in days
    
    const totalSalary = item.salaryPerDay * durationDays;
    const canAfford = gameMoney >= totalSalary;

    return (
      <TouchableOpacity
        style={[styles.card, !canAfford && styles.disabledCard]}
        onPress={() => handleSelectStaff(item)}
        disabled={!canAfford}
      >
        <View style={styles.cardInfo}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.specialty}>{item.specialty}</Text>
          <View style={styles.statsContainer}>
            <Text style={styles.stat}>Efficiency: {(item.efficiencyModifier * 100).toFixed(0)}%</Text>
            <Text style={styles.stat}>Quality: {(item.qualityModifier * 100).toFixed(0)}%</Text>
          </View>
          <Text style={styles.salary}>
            Total Cost: ${totalSalary.toLocaleString()} (${item.salaryPerDay.toLocaleString()}/day × {durationDays} days)
          </Text>
        </View>
        {canAfford && <Ionicons name="chevron-forward" size={24} color="#fff" />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0f2027', '#203a43', '#2c5364']} style={styles.background} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={32} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Project Staff</Text>
      </View>
      <FlatList
        data={availableStaff}
        renderItem={renderStaffMember}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No staff members available for this project type.
          </Text>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  background: { 
    position: 'absolute', 
    left: 0, 
    right: 0, 
    top: 0, 
    height: '100%' 
  },
  header: { 
    paddingHorizontal: 20, 
    paddingTop: 10, 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  headerTitle: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#fff', 
    marginLeft: 15 
  },
  list: { 
    padding: 20 
  },
  card: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    padding: 15, 
    borderRadius: 10, 
    marginBottom: 15 
  },
  disabledCard: {
    opacity: 0.5
  },
  cardInfo: { 
    flex: 1 
  },
  name: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  specialty: { 
    color: '#ccc', 
    fontSize: 14, 
    marginTop: 4 
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 8
  },
  stat: {
    color: '#43e97b',
    fontSize: 12,
    marginRight: 15
  },
  salary: {
    color: '#DA70D6',
    fontSize: 12,
    marginTop: 8
  },
  emptyText: { 
    color: '#ccc', 
    textAlign: 'center', 
    marginTop: 50, 
    fontSize: 16 
  }
});

export default StaffSelectionScreen;
