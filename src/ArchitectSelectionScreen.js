import React, { useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity } from 'react-native';
import { GameContext } from '../GameContext';
import { ARCHITECT_FIRMS } from '../data/architectFirms';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const ArchitectSelectionScreen = ({ route, navigation }) => {
  const { landAsset } = route.params;
  const { playerLevel, gameMoney } = useContext(GameContext);

  const availableFirms = ARCHITECT_FIRMS.filter(firm => playerLevel >= firm.unlockLevel);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0f2027', '#2c5364']} style={styles.background} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back-outline" size={32} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hire an Architect</Text>
        <View style={{ width: 42 }} />
      </View>

      <FlatList
        data={availableFirms}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 20 }}
        ListHeaderComponent={<Text style={styles.listHeader}>Choose a firm to design your new building. Their expertise will affect the project's cost, quality, and speed.</Text>}
        renderItem={({ item }) => {
          const canAfford = gameMoney >= item.hireCost;
          return (
            <TouchableOpacity 
              style={[styles.card, !canAfford && styles.disabledCard]}
              disabled={!canAfford}
              onPress={() => navigation.navigate('BlueprintSelection', { landAsset, architectFirm: item })}
            >
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.motto}>"{item.motto}"</Text>
              <View style={styles.separator} />
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Cost</Text>
                    <Text style={[styles.statValue, item.costModifier > 1 ? styles.negativeStat : styles.positiveStat]}>{item.costModifier}x</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Quality</Text>
                    <Text style={[styles.statValue, item.qualityModifier > 1 ? styles.positiveStat : styles.negativeStat]}>{item.qualityModifier}x</Text>
                </View>
                 <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Speed</Text>
                    <Text style={[styles.statValue, {color: '#ffae42'}]}>{item.efficiencyModifier}x</Text>
                </View>
              </View>
              <View style={styles.footer}>
                <Text style={styles.costLabel}>Hiring Fee: <Text style={styles.costValue}>${item.hireCost.toLocaleString()}</Text></Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { position: 'absolute', left: 0, right: 0, top: 0, height: '100%' },
  header: { paddingVertical: 10, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  headerButton: { padding: 5, width: 42, },
  listHeader: { color: '#ccc', fontSize: 16, textAlign: 'center', marginBottom: 20, paddingHorizontal: 10 },
  card: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 15, marginBottom: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  disabledCard: { opacity: 0.5 },
  cardTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
  motto: { color: '#ccc', fontSize: 14, fontStyle: 'italic', textAlign: 'center', marginTop: 5, marginBottom: 15 },
  separator: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 15 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 15 },
  statItem: { alignItems: 'center' },
  statLabel: { color: '#aaa', fontSize: 14 },
  statValue: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 4 },
  positiveStat: { color: '#43e97b' },
  negativeStat: { color: '#e63946' },
  footer: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 15, marginTop: 10, alignItems: 'center' },
  costLabel: { color: '#ccc', fontSize: 16 },
  costValue: { color: '#fff', fontWeight: 'bold' },
});

export default ArchitectSelectionScreen;