import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GameContext } from '../GameContext';

const BankCard = ({ bankName, description, maxLoan, active, onPress }) => (
  <TouchableOpacity onPress={onPress} disabled={!active}>
    <LinearGradient
      colors={active ? ['#43e97b', '#38f9d7'] : ['#485563', '#29323c']}
      style={[styles.card, !active && styles.disabledCard]}
    >
      <View>
        <Text style={styles.bankName}>{bankName}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <View style={{alignItems: 'flex-end'}}>
        <Text style={styles.maxLoanLabel}>Max Loan</Text>
        <Text style={styles.maxLoan}>${maxLoan / 1000}K</Text>
      </View>
    </LinearGradient>
    {!active && (
      <View style={styles.lockIcon}>
        <Ionicons name="lock-closed" size={24} color="#fff" />
      </View>
    )}
  </TouchableOpacity>
);
const ActiveLoanCard = ({ loan, onPreClose }) => {
  const fee = loan.outstandingPrincipal * 0.025; // 2.5%
  const totalPayoff = loan.outstandingPrincipal + fee;

  const handlePreClose = () => {
    Alert.alert(
      "Confirm Pre-Closure",
      `Are you sure you want to close this loan? \n\nOutstanding: $${loan.outstandingPrincipal.toLocaleString()}\nFee (2.5%): $${Math.round(fee).toLocaleString()}\n\nTotal to Pay: $${Math.round(totalPayoff).toLocaleString()}`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Confirm Payment", onPress: onPreClose }
      ]
    );
  };

  return (
    <View style={styles.activeLoanCard}>
        <View style={styles.loanInfo}>
            <Text style={styles.loanBank}>{loan.bank} - {loan.type} Loan</Text>
            <Text style={styles.loanDetails}>Principal Left: ${Math.round(loan.outstandingPrincipal).toLocaleString()}</Text>
            <Text style={styles.loanDetails}>EMI: ${loan.emi.toLocaleString()}</Text>
        </View>
        <TouchableOpacity style={styles.preCloseButton} onPress={handlePreClose}>
            <Text style={styles.preCloseText}>Pre-Close</Text>
        </TouchableOpacity>
    </View>
  )
}
const BankHubScreen = ({ navigation }) => {
  const { activeLoans, preCloseLoan } = useContext(GameContext);
  const activeLoanTypes = Object.keys(activeLoans || {});

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0f2027', '#203a43', '#2c5364']} style={styles.background} />
      <View style={styles.header}>
         <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="close-circle" size={40} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Banking Hub</Text>
          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.navigate('Home')}>
            <Ionicons name="home-outline" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeLoanTypes.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Your Active Loans</Text>
            {activeLoanTypes.map(type => (
              <ActiveLoanCard 
                key={type} 
                loan={activeLoans[type]}
                onPreClose={() => preCloseLoan(type)}
              />
            ))}
          </View>
        )}
        <Text style={styles.sectionTitle}>Apply for New Loan</Text>
        <BankCard
          bankName="Small Bank Inc."
          description="Your first step into high finance. Fair rates for new entrepreneurs."
          maxLoan={200000}
          active={true}
          onPress={() => navigation.navigate('LoanScreen', { bank: 'Small Bank' })}
        />
        <BankCard
          bankName="Mega Capital Group"
          description="Unlocks at Level 25. Big loans for bigger ventures."
          maxLoan={1000000}
          active={false}
        />
         <BankCard
          bankName="Quantum Financial"
          description="End-game loans for global tycoons. Unlocks after 5 mergers."
          maxLoan={50000000}
          active={false}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { position: 'absolute', left: 0, right: 0, top: 0, height: '100%' },
header: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between', // This is the key change for layout
    },
    headerTitle: { 
        color: '#fff', 
        fontSize: 24, 
        fontWeight: 'bold',
        flex: 1, // This allows the title to take available space
        textAlign: 'center', // Center the title 
    },
    headerButton: {
        padding: 5,
    },  backButton: { position: 'absolute', left: 15, top: 5, zIndex: 1 },
  scrollContent: { padding: 20 },
  card: { padding: 20, borderRadius: 15, marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  disabledCard: { opacity: 0.5 },
  bankName: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 5 },
  description: { color: 'rgba(255,255,255,0.8)', fontSize: 14, maxWidth: 200 },
  maxLoanLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  maxLoan: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  lockIcon: { position: 'absolute', top: '50%', left: '50%', transform: [{translateX: -12}, {translateY: -22}]},
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    paddingLeft: 5,
  },
  activeLoanCard: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderLeftWidth: 5,
    borderLeftColor: '#F09819'
  },
  loanInfo: {},
  loanBank: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  loanDetails: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 5,
  },
  preCloseButton: {
    backgroundColor: '#EDDE5D',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  preCloseText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 14
  }
});

export default BankHubScreen;