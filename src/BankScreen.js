import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const BankScreen = ({ navigation }) => {
  const [bankedMoney, setBankedMoney] = useState(500000);
  const interestRate = 0.5; // 0.5% per cycle
  const capacity = 2000000;

  const formatNumber = (num) => {
    return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#0f2027', '#203a43', '#2c5364']}
        style={styles.background}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="close-circle" size={40} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>The Vault</Text>
      </View>

      {/* Banked Balance */}
      <View style={styles.balanceContainer}>
        <Text style={styles.balanceLabel}>Current Balance</Text>
        <Text style={styles.balanceAmount}>${formatNumber(bankedMoney)}</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity style={styles.actionButton}>
          <LinearGradient colors={['#38ef7d', '#11998e']} style={styles.buttonGradient}>
            <Ionicons name="arrow-down-circle" size={24} color="#fff" />
            <Text style={styles.buttonText}>Deposit</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
           <LinearGradient colors={['#F09819', '#EDDE5D']} style={styles.buttonGradient}>
            <Ionicons name="arrow-up-circle" size={24} color="#fff" />
            <Text style={styles.buttonText}>Withdraw</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Bank Stats */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>Bank Statistics</Text>
        <View style={styles.statItem}>
            <Ionicons name="analytics-outline" size={24} color="#38ef7d" />
            <Text style={styles.statLabel}>Interest Rate</Text>
            <Text style={styles.statValue}>{interestRate}% / min</Text>
        </View>
        <View style={styles.statItem}>
            <Ionicons name="server-outline" size={24} color="#F09819" />
            <Text style={styles.statLabel}>Capacity</Text>
            <Text style={styles.statValue}>${formatNumber(capacity)}</Text>
        </View>
      </View>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute', left: 0, right: 0, top: 0, height: '100%',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center', // Center title
  },
  backButton: {
    position: 'absolute',
    left: 15,
    top: 5,
    zIndex: 1, // Ensure it's clickable
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    fontFamily: 'monospace',
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowRadius: 10,
  },
  balanceContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  balanceLabel: {
    fontSize: 20,
    color: '#ccc',
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 20,
    marginBottom: 50,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 10,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },
  buttonGradient: {
    paddingVertical: 15,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  statsContainer: {
    marginHorizontal: 20,
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  statLabel: {
    fontSize: 18,
    color: '#eee',
    marginLeft: 15,
    flex: 1, // Take available space
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default BankScreen;