import React, { useState, useMemo, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { GameContext } from '../GameContext';
import TransactionModal from './TransactionModal';
import { getDynamicPropertyImage } from "../utils/imageHelpers";

const LoanScreen = ({ navigation, route }) => {
  const { bank } = route.params;
  const { takeLoan, activeLoans, playerAssets, gameMoney } = useContext(GameContext);
  
  const [loanType, setLoanType] = useState('Personal');
  const [tenure, setTenure] = useState(36);
  const [modalState, setModalState] = useState({ isVisible: false, status: '', details: {} });
 const [selectedProperty, setSelectedProperty] = useState(null); // NEW: To hold the chosen property for a mortgage

  // Find properties that are available for a mortgage
  const mortgagableProperties = useMemo(() => 
    playerAssets.filter(asset => asset.assetType === 'Property' && !asset.isMortgaged), 
    [playerAssets]
  );
  
  // This hook calculates all the core terms for the selected loan type
  const { terms, maxLoan, minLoan } = useMemo(() => {
    // Gracefully handle if terms for the selected type don't exist
    const currentTerms = bank.loanTerms[loanType.toLowerCase()];
    if (!currentTerms) {
      return { terms: null, maxLoan: 0, minLoan: 0 };
    }

    if (loanType === 'Mortgage') {
      const totalPropertyValue = playerAssets
        .filter(asset => asset.assetType === 'Property')
        .reduce((sum, asset) => sum + asset.marketValue, 0);
      
      const maxMortgage = Math.floor(totalPropertyValue * currentTerms.maxLoanPercentage);
      // Ensure minLoan for mortgage isn't higher than the max possible loan
      const minMortgage = Math.min(10000, maxMortgage);
      return { terms: currentTerms, maxLoan: maxMortgage, minLoan: minMortgage };
    }
    
    // For Personal loans
    return { terms: currentTerms, maxLoan: currentTerms.maxLoan, minLoan: currentTerms.minLoan };
  }, [loanType, playerAssets, bank]);

  // This is the state for the loan amount slider
  const [amount, setAmount] = useState(minLoan);

  // This effect resets the slider's amount whenever the loan type changes
  useEffect(() => {
    setAmount(minLoan);
  }, [minLoan]);

  // This hook calculates the EMI based on amount and tenure
  const { interestRate, emi } = useMemo(() => {
    if (!terms || amount === 0 || tenure === 0) return { interestRate: terms?.baseInterestRate || 0, emi: 0 };

    const baseInterest = terms.baseInterestRate;
    const monthlyRate = baseInterest / 100 / 12;
    const calculatedEmi = (amount * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / (Math.pow(1 + monthlyRate, tenure) - 1);
    return { interestRate: baseInterest, emi: Math.round(calculatedEmi) };
  }, [amount, tenure, terms]);

  // Check if a loan of the currently selected type already exists
  const existingLoan = activeLoans[loanType.toLowerCase()];

  // --- Modal Handler Functions ---
  const handleOpenConfirmation = () => {
    setModalState({
        isVisible: true,
        status: 'confirm',
        details: {
            itemName: `a ${loanType} loan from ${bank.name}`,
            itemPrice: amount,
            fee: emi,
            totalCost: amount, // 'Total Cost' here means the principal amount
            title: 'Confirm Loan',
            confirmText: `Take Loan`,
            feeLabel: 'First Monthly EMI:',
        }
    });
  };

  const handleConfirmLoan = () => {
    const loanDetails = { bank: bank.name, amount, emi, type: loanType, outstandingPrincipal: amount };
    takeLoan(loanDetails);
    setModalState(prev => ({ 
        ...prev, 
        status: 'success', 
        details: { 
            ...prev.details, 
            title: "Loan Approved!", 
            subtitle: `$${amount.toLocaleString()} has been credited to your account.` 
        } 
    }));
  };

  const handleCloseModal = () => {
    const success = modalState.status === 'success';
    setModalState({ isVisible: false, status: '', details: {} });
    if (success) {
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    }
  };
const renderPropertySelection = () => (
    <View>
        <Text style={styles.label}>Select a Property to Mortgage:</Text>
        {mortgagableProperties.length > 0 ? mortgagableProperties.map(prop => (
            <TouchableOpacity key={prop.id} style={styles.propertyCard} onPress={() => setSelectedProperty(prop)}>
                <View style={{flex: 1}}>
                    <Text style={styles.cardTitle}>{prop.name}</Text>
                    <Text style={styles.cardSubtitle}>Value: ${prop.marketValue.toLocaleString()}</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#fff" />
            </TouchableOpacity>
        )) : <Text style={styles.noticeText}>No un-mortgaged properties available.</Text>}
    </View>
  );
  return (
    <SafeAreaView style={styles.container}>
      <TransactionModal 
        isVisible={modalState.isVisible}
        status={modalState.status}
        details={modalState.details}
        onClose={handleCloseModal}
        onConfirm={handleConfirmLoan}
      />
      <LinearGradient colors={['#232526', '#414345']} style={styles.background} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="chevron-back" size={32} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>{bank.name}</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.typeSelector}>
          <TouchableOpacity 
            style={[styles.typeButton, loanType === 'Personal' && styles.activeTypeButton]}
            onPress={() => setLoanType('Personal')}>
            <Text style={styles.typeButtonText}>Personal</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.typeButton, loanType === 'Mortgage' && styles.activeTypeButton, maxLoan === 0 && styles.disabledButton]}
            onPress={() => setLoanType('Mortgage')}
            disabled={maxLoan === 0}>
            <Text style={styles.typeButtonText}>Mortgage</Text>
          </TouchableOpacity>
        </View>

        {existingLoan ? (
          <View style={styles.noticeCard}><Text style={styles.noticeText}>You already have an active {loanType} loan of this type.</Text></View>
        ) : loanType === 'Mortgage' && maxLoan === 0 ? (
          <View style={styles.noticeCard}><Text style={styles.noticeText}>You must own property to apply for a mortgage from this bank.</Text></View>
        ) : (
          <>
            <View style={styles.controlBlock}>
              {loanType === 'Mortgage' &&  renderPropertySelection()}

              <Text style={styles.label}>Loan Amount: <Text style={styles.value}>${amount.toLocaleString()}</Text></Text>
              <Slider 
                value={amount} 
                onValueChange={setAmount} 
                minimumValue={minLoan} 
                maximumValue={maxLoan} 
                step={1000}
                minimumTrackTintColor="#38f9d7"
                maximumTrackTintColor="rgba(255,255,255,0.3)"
                thumbTintColor="#43e97b"
              />
            </View>

            <View style={styles.controlBlock}>
              <Text style={styles.label}>Loan Tenure (Game Months)</Text>
              <View style={styles.tenureOptions}>
                  {[12, 24, 36, 48].map(t => (
                      <TouchableOpacity key={t} style={[styles.tenureButton, tenure === t && styles.activeTenure]} onPress={() => setTenure(t)}>
                          <Text style={styles.tenureText}>{t} mo</Text>
                      </TouchableOpacity>
                  ))}
              </View>
            </View>

            <View style={styles.summaryCard}>
                <View style={styles.row}><Text style={styles.label}>Interest Rate:</Text><Text style={styles.value}>{interestRate.toFixed(2)}%</Text></View>
                <View style={styles.row}><Text style={styles.label}>Monthly Payment (EMI):</Text><Text style={styles.value}>${emi.toLocaleString()}</Text></View>
            </View>

            <TouchableOpacity onPress={handleOpenConfirmation} disabled={maxLoan === 0 || amount === 0}>
              <LinearGradient colors={(maxLoan > 0 && amount > 0) ? ['#38ef7d', '#11998e'] : ['#555', '#333']} style={styles.confirmButton}>
                <Text style={styles.confirmButtonText}>Take Loan</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    background: { position: 'absolute', left: 0, right: 0, top: 0, height: '100%' },
    header: { paddingHorizontal: 20, paddingTop: 10, flexDirection: 'row', alignItems: 'center' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginLeft: 15 },
    content: { flex: 1, paddingHorizontal: 20 },
    typeSelector: { flexDirection: 'row', borderWidth: 1, borderColor: '#3a7bd5', borderRadius: 10, overflow: 'hidden', marginVertical: 20 },
    typeButton: { flex: 1, padding: 15, alignItems: 'center' },
    activeTypeButton: { backgroundColor: '#3a7bd5' },
    typeButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    noticeCard: { backgroundColor: 'rgba(240, 152, 25, 0.1)', borderRadius: 15, padding: 20, alignItems: 'center', justifyContent: 'center', minHeight: 150 },
    noticeText: { color: '#fff', fontSize: 16, textAlign: 'center', lineHeight: 24 },
    controlBlock: { marginBottom: 25 },
    label: { color: '#ccc', fontSize: 16, marginBottom: 15 },
    value: { color: '#fff', fontWeight: 'bold' },
    interestText: { color: '#ccc', fontSize: 14, textAlign: 'right', marginTop: 5 },
    confirmButton: { padding: 20, borderRadius: 15, alignItems: 'center', marginTop: 30 },
    confirmButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    disabledButton: { opacity: 0.5 },
    tenureOptions: { flexDirection: 'row', justifyContent: 'space-around' },
    tenureButton: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, borderWidth: 1, borderColor: '#555', alignItems: 'center' },
    activeTenure: { borderColor: '#38f9d7', backgroundColor: 'rgba(56, 249, 215, 0.1)' },
    tenureText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
    summaryCard: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 15, borderRadius: 10, marginTop: 10 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 4 },
});

export default LoanScreen;