import React, { useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity } from 'react-native';
import { GameContext } from '../GameContext';
import { Ionicons } from '@expo/vector-icons';

const StaffCenterScreen = ({ navigation }) => {
  const { staff, hireStaff, playerLevel } = useContext(GameContext);

  const availableToHire = staff.availableToHire.filter(s => playerLevel >= s.unlockLevel);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerTitle}>My Team</Text>
      {staff.hired.map(member => (
        <View key={member.id} style={styles.card}>
          <Text style={styles.cardTitle}>{member.name}</Text>
          <Text style={styles.cardSubtitle}>{member.role} - {member.status}</Text>
        </View>
      ))}

      <Text style={styles.headerTitle}>Hiring Agency</Text>
      <FlatList
        data={availableToHire}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{flex: 1}}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardSubtitle}>{item.role} - {item.specialty}</Text>
            </View>
            <TouchableOpacity style={styles.hireButton} onPress={() => hireStaff(item)}>
              <Text>Hire (${item.hireCost.toLocaleString()})</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  hireButton: {
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 4,
    marginLeft: 12,
  },
});

export default StaffCenterScreen;