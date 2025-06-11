import React, { useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GameContext } from '../GameContext';
import { BANK_LIST } from '../data/banks'; // Import the new bank data

const BankHubScreen = ({ navigation }) => {
  const { activeLoans, preCloseLoan, playerLevel } = useContext(GameContext);
  const activeLoanArray = Object.values(activeLoans || {});

  const handlePreClose = (loan) => {
    const fee = loan.outstandingPrincipal * 0.025; // Example fee rate
    const totalPayoff = loan.outstandingPrincipal + fee;
    Alert.alert(
      "Confirm Pre-Closure",
      `Are you sure you want to pay off your ${loan.type} loan? This will cost $${totalPayoff.toLocaleString()} (including fees).`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Confirm", onPress: () => preCloseLoan(loan) }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0f2027', '#2c5364']} style={styles.background} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}><Ionicons name="chevron-back" size={32} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Banking Hub</Text>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.navigate('Home')}><Ionicons name="home-outline" size={28} color="#fff" /></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* <TouchableOpacity style={styles.sectionCard} onPress={() => navigation.navigate('Finance')}><View style={styles.cardHeader}><Ionicons name="stats-chart" size={28} color="#FFD700" /><Text style={styles.sectionTitle}>Financial Center</Text></View><Text style={styles.cardDescription}>Review statements and property history.</Text><Ionicons name="chevron-forward" size={24} color="#FFD700" style={styles.chevron} /></TouchableOpacity> */}

      {activeLoanArray.length > 0 && (
          <View style={styles.sectionCard}>
            <View style={styles.cardHeader}><Ionicons name="document-text-outline" size={28} color="#00BFFF" /><Text style={styles.sectionTitle}>Your Loan Portfolio</Text></View>
            <View style={styles.loanListContainer}>
              {activeLoanArray.map(loan => (
                // --- NEW, REDESIGNED LOAN ITEM STRUCTURE ---
                <View  key={loan.id} style={styles.loanItemContainer}>
                  {/* Row 1: Bank Name */}
                  <Text style={styles.loanBankName}>{loan.bank}</Text>
                  
                  {/* Row 2: Amount and Pre-Close Button */}
                  <View style={styles.loanDetailsRow}>
                    <Text style={styles.loanAmount}>Outstanding: ${loan.outstandingPrincipal.toLocaleString()}</Text>
                    <TouchableOpacity style={styles.preCloseButton} onPress={() => handlePreClose(loan)}>
                      <Text style={styles.preCloseText}>Pre-Close</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.sectionCard}>
          <View style={styles.cardHeader}><Ionicons name="cash-outline" size={28} color="#43e97b" /><Text style={styles.sectionTitle}>Loan Services</Text></View>
          {BANK_LIST.map(bank => {
            const isUnlocked = playerLevel >= bank.unlockLevel;
            return (
              <TouchableOpacity 
                key={bank.id}
                style={[styles.bankButton, !isUnlocked && styles.disabledBankButton]}
                disabled={!isUnlocked}
                onPress={() => navigation.navigate('LoanScreen', { bank: bank })}
              >
                <View>
                  <Text style={styles.bankButtonText}>{bank.name}</Text>
                  {!isUnlocked && <Text style={styles.unlockText}>Unlocks at Level {bank.unlockLevel}</Text>}
                </View>
                {isUnlocked ? <Ionicons name="chevron-forward" size={24} color="#fff" /> : <Ionicons name="lock-closed" size={20} color="rgba(255,255,255,0.5)" />}
              </TouchableOpacity>
            )
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { position: 'absolute', left: 0, right: 0, top: 0, height: '100%' },
  header: { paddingVertical: 10, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  headerButton: { padding: 5 },
  scrollContent: { paddingHorizontal: 15, paddingTop: 10, paddingBottom: 40 },
  loanInfo: {
    flex: 1, // This makes the container take up all available space
    marginRight: 10, // Adds a small gap between the text and the button
  },
  sectionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  cardDescription: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 8,
    marginBottom: 15,
    paddingLeft: 40, // Aligns with the title
  },
  chevron: {
    position: 'absolute',
    right: 20,
    top: '50%',
  },
  loanRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    marginLeft: 40, // Aligns with the description
  },
  loanType: {
    color: '#fff',
    fontSize: 16,
  },
  loanAmount: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bankButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  disabledBankButton: {
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  bankButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
preCloseButton: { backgroundColor: 'rgba(230, 57, 70, 0.8)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8, flex:1 },
  preCloseText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  unlockText: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },
   loanItemContainer: {
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  loanBankName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  loanDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loanAmount: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
  },
  preCloseButton: {
    backgroundColor: 'rgba(230, 57, 70, 0.8)',
    paddingHorizontal: 12, // smaller padding
    paddingVertical: 6,   // smaller padding
    borderRadius: 8,
  },
  preCloseText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12, // smaller text
  },
});

export default BankHubScreen;