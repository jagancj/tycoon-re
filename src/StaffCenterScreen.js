import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, Dimensions, Alert } from 'react-native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GameContext } from '../GameContext';

// --- Tab 1: "My Team" Component ---
const MyTeamRoute = () => {
  const { staff } = useContext(GameContext);
  
  const renderHiredMember = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardSubtitle}>{item.role} - {item.specialty}</Text>
        <Text style={styles.salaryText}>Salary: ${item.salaryPerDay.toLocaleString()}/day</Text>
      </View>
      <View style={styles.statusContainer}>
        <View style={[styles.statusIndicator, { backgroundColor: item.status === 'Idle' ? '#43e97b' : '#ffae42' }]} />
        <Text style={styles.statusText}>{item.status}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.sceneContainer}>
      <FlatList
        data={staff.hired}
        renderItem={renderHiredMember}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 20 }}
        ListEmptyComponent={<Text style={styles.emptyText}>You haven't hired any staff yet.</Text>}
      />
    </View>
  );
};

// --- Tab 2: "Hiring Agency" Component ---
const HiringAgencyRoute = () => {
  const { staff, playerLevel, gameMoney, hireStaff } = useContext(GameContext);
  
  const availableToHire = staff.availableToHire.filter(s => playerLevel >= s.unlockLevel);

  return (
    <View style={styles.sceneContainer}>
      <FlatList
        data={availableToHire}
        renderItem={({ item }) => {
          const canAfford = gameMoney >= item.hireCost;
          return (
            <View style={[styles.card, !canAfford && styles.disabledCard]}>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardSubtitle}>{item.role} - {item.specialty}</Text>
                <Text style={styles.salaryText}>Salary: ${item.salaryPerDay.toLocaleString()}/day</Text>
              </View>
              <TouchableOpacity
                style={[styles.hireButton, !canAfford && styles.disabledButton]}
                disabled={!canAfford}
                onPress={() => hireStaff(item)}
              >
                <Text style={styles.hireButtonText}>HIRE</Text>
                <Text style={styles.hireCostText}>${item.hireCost.toLocaleString()}</Text>
              </TouchableOpacity>
            </View>
          );
        }}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 20 }}
        ListEmptyComponent={<Text style={styles.emptyText}>No one is available for hire at your level.</Text>}
      />
    </View>
  );
};

// --- Main Parent Component ---
const StaffCenterScreen = ({ navigation }) => {
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'myTeam', title: 'My Team' },
    { key: 'hiring', title: 'Hiring Agency' },
  ]);

  const renderScene = SceneMap({
    myTeam: MyTeamRoute,
    hiring: HiringAgencyRoute,
  });

  const renderTabBar = props => (
    <TabBar
      {...props}
      indicatorStyle={{ backgroundColor: '#DA70D6' }} // Using the staff button color
      style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
      labelStyle={{ fontWeight: 'bold' }}
    />
  );

  return (
    <View style={{ flex: 1 }}>
          <LinearGradient colors={['#232526', '#414345']} style={styles.background} />
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back-outline" size={32} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Staff Center</Text>
        <View style={{ width: 42 }} />
      </View>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: Dimensions.get('window').width }}
        renderTabBar={renderTabBar}
      />
    </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { position: 'absolute', left: 0, right: 0, top: 0, height: '100%' },
  sceneContainer: { flex: 1,}, // Dark BG for tabs
  header: { paddingVertical: 10, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  headerButton: { padding: 5 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: 15, borderRadius: 10, marginBottom: 15 },
  cardInfo: { flex: 1 },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  cardSubtitle: { color: '#ccc', fontSize: 14, marginTop: 4 },
  salaryText: { color: '#DA70D6', fontSize: 12, fontStyle: 'italic', marginTop: 4 },
  statusContainer: { alignItems: 'center', marginLeft: 10 },
  statusIndicator: { width: 12, height: 12, borderRadius: 6, marginBottom: 4 },
  statusText: { color: '#fff', fontSize: 12 },
  hireButton: { backgroundColor: '#DA70D6', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, alignItems: 'center' },
  hireButtonText: { color: '#fff', fontWeight: 'bold' },
  hireCostText: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  disabledCard: { opacity: 0.4 },
  disabledButton: { backgroundColor: '#555' },
  emptyText: { color: '#999', textAlign: 'center', marginTop: 50, fontSize: 16 },
});

export default StaffCenterScreen;