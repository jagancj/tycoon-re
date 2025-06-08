import React, { useState, useMemo, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { GameContext } from '../GameContext';

// --- Constants for Loan Logic ---
const LTV_RATIO_SMALL_BANK = 0.75; // 75%
const COST_PER_SQFT_CONSTRUCTION = 110; // $110 per sq. ft.

const LoanScreen = ({ navigation, route }) => {
  const { bank, selectedAsset } = route.params;
  const { takeLoan, activeLoans } = useContext(GameContext);
  
  // Determine loan mode based on passed parameters
  const initialMode = selectedAsset ? (selectedAsset.type === 'Empty Land' ? 'Construction' : 'Mortgage') : 'Personal';
  const [loanMode, setLoanMode] = useState(initialMode);

  // State for inputs
  const [amount, setAmount] = useState(50000);
  const [tenure, setTenure] = useState(loanMode === 'Personal' ? 12 : 36); // Longer default tenure for mortgages
  const [plannedSqFt, setPlannedSqFt] = useState(800);

  // --- Effect to reset state when mode changes ---
  useEffect(() => {
    // If we have an asset, we are in a mortgage mode
    if (selectedAsset) {
      const mode = selectedAsset.type === 'Empty Land' ? 'Construction' : 'Mortgage';
      setLoanMode(mode);
      setTenure(36); // Default to longer tenure
      if(mode === 'Mortgage') {
        setAmount(selectedAsset.marketValue * 0.25); // Default to 25% of value
      } else {
        setPlannedSqFt(selectedAsset.areaSqFt * 0.5); // Default to 50% of land area
      }
    } else {
      setLoanMode('Personal');
      setTenure(12);
      setAmount(50000);
    }
  }, [selectedAsset]);
  

  const loanType = loanMode === 'Construction' ? 'Mortgage' : loanMode; // Construction is a type of Mortgage
  const existingLoan = activeLoans[loanType];
  
  // --- DYNAMIC CALCULATIONS ---
  const { maxLoan, loanAmount, interestRate, emi } = useMemo(() => {
    let maxL = 0, currentLoanAmount = 0, baseInterest = 12;

    if (loanMode === 'Personal') {
        maxL = 100000;
        currentLoanAmount = amount;
        baseInterest = 12;
    } 
    // THE FIX: Only enter if loanMode is 'Mortgage' AND selectedAsset exists.
    else if (loanMode === 'Mortgage' && selectedAsset) {
        maxL = selectedAsset.marketValue * LTV_RATIO_SMALL_BANK;
        currentLoanAmount = amount;
        baseInterest = 6.5;
    } 
    // THE FIX: Also protect the 'Construction' block.
    else if (loanMode === 'Construction' && selectedAsset) {
        maxL = selectedAsset.areaSqFt * COST_PER_SQFT_CONSTRUCTION;
        currentLoanAmount = plannedSqFt * COST_PER_SQFT_CONSTRUCTION;
        baseInterest = 7.5;
    }
    
    // ... the rest of the useMemo hook is the same ...
    const tenureOptions = loanMode === 'Personal' ? [12, 18, 24] : [36, 48, 60];
    const tenureDiscount = tenure > 48 ? 1.5 : tenure > 36 ? 1 : 0;
    const finalInterest = baseInterest - tenureDiscount;
    const monthlyRate = finalInterest / 100 / 12;

    if (currentLoanAmount === 0) {
      return { maxLoan: maxL, loanAmount: 0, interestRate: finalInterest, emi: 0 };
    }
    const calculatedEmi = (currentLoanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / (Math.pow(1 + monthlyRate, tenure) - 1);
    
    return { 
        maxLoan: maxL, 
        loanAmount: currentLoanAmount,
        interestRate: finalInterest, 
        emi: Math.round(calculatedEmi) 
    };
}, [amount, tenure, plannedSqFt, loanMode, selectedAsset]);


  const handleConfirmLoan = () => {
    takeLoan({ bank, amount: loanAmount, emi, type: loanType });
    alert("Loan Approved!");
    navigation.navigate('Home');
  };

  // --- RENDER FUNCTIONS FOR UI CLEANLINESS ---
  const renderPersonalLoanControls = () => (
    <View style={styles.controlBlock}>
        <Text style={styles.label}>Loan Amount: <Text style={styles.value}>${amount.toLocaleString()}</Text></Text>
        <Slider value={amount} onValueChange={setAmount} minimumValue={50000} maximumValue={maxLoan} step={1000} {...sliderStyles} />
    </View>
  );

  const renderMortgageControls = () => (
    selectedAsset && (
      <View style={styles.controlBlock}>
          <Text style={styles.label}>Pledging: <Text style={styles.value}>{selectedAsset.name}</Text></Text>
          <Text style={styles.label}>Loan Amount: <Text style={styles.value}>${amount.toLocaleString()}</Text></Text>
          <Slider value={amount} onValueChange={setAmount} minimumValue={10000} maximumValue={maxLoan} step={1000} {...sliderStyles} />
      </View>
    )
  );

  const renderConstructionControls = () => (
     <View style={styles.controlBlock}>
        <Text style={styles.label}>On Land: <Text style={styles.value}>{selectedAsset.name}</Text></Text>
        <Text style={styles.label}>Planned Area: <Text style={styles.value}>{plannedSqFt.toLocaleString()} sq. ft.</Text></Text>
        <Slider value={plannedSqFt} onValueChange={setPlannedSqFt} minimumValue={500} maximumValue={selectedAsset.areaSqFt} step={50} {...sliderStyles} />
        <Text style={styles.label}>Resulting Loan: <Text style={styles.value}>${loanAmount.toLocaleString()}</Text></Text>
     </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#232526', '#414345']} style={styles.background} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('BankHub')}><Ionicons name="chevron-back" size={32} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>{loanMode} Loan</Text>
      </View>

      <View style={styles.content}>
        {/* Loan Type Selector */}
        <View style={styles.loanTypeSelector}>
            <TouchableOpacity 
                style={[styles.typeButton, loanMode === 'Personal' && styles.activeType]} 
                onPress={() => navigation.setParams({ selectedAsset: null })}>
                <Text style={styles.typeButtonText}>Personal</Text>
            </TouchableOpacity>
            <TouchableOpacity 
                style={[styles.typeButton, (loanMode === 'Mortgage' || loanMode === 'Construction') && styles.activeType]} 
                onPress={() => navigation.navigate('SelectAssetScreen', { bank })}>
                <Text style={styles.typeButtonText}>Mortgage</Text>
            </TouchableOpacity>
        </View>

        {existingLoan ? (
            <View style={styles.noticeCard}>
                <Ionicons name="information-circle" size={40} color="#F09819" />
                <Text style={styles.noticeText}>You already have an active {loanType} loan.</Text>
            </View>
        ) : (
          <>
            {loanMode === 'Personal' && renderPersonalLoanControls()}
            {loanMode === 'Mortgage' && renderMortgageControls()}
            {loanMode === 'Construction' && renderConstructionControls()}
            
            {/* Tenure and Summary */}
            <View style={styles.controlBlock}>
              <Text style={styles.label}>Loan Tenure (Game Months)</Text>
              <View style={styles.tenureOptions}>
                {(loanMode === 'Personal' ? [12, 18, 24] : [36, 48, 60]).map(t => (
                    <TouchableOpacity key={t} style={[styles.tenureButton, tenure === t && styles.activeTenure]} onPress={() => setTenure(t)}>
                        <Text style={styles.tenureText}>{t} mo</Text>
                    </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.summaryCard}>
                <Text style={styles.summaryText}>Interest Rate: <Text style={styles.summaryValue}>{interestRate.toFixed(2)}%</Text></Text>
                <Text style={styles.summaryText}>EMI (Auto-Debit): <Text style={styles.summaryValue}>${emi.toLocaleString()}</Text></Text>
            </View>
            <TouchableOpacity onPress={handleConfirmLoan}><LinearGradient colors={['#43e97b', '#38f9d7']} style={styles.confirmButton}><Text style={styles.confirmButtonText}>Confirm Loan</Text></LinearGradient></TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};
const sliderStyles = { minimumTrackTintColor: "#38f9d7", maximumTrackTintColor: "#fff", thumbTintColor: "#43e97b" };
// All other styles from the previous step should be kept and used here.
const styles = StyleSheet.create({
    container: { flex: 1 },
    background: { position: 'absolute', left: 0, right: 0, top: 0, height: '100%' },
    header: { paddingHorizontal: 20, paddingTop: 10, flexDirection: 'row', alignItems: 'center' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginLeft: 15 },
    content: { flex: 1, padding: 20 },
    loanTypeSelector: { flexDirection: 'row', borderWidth: 1, borderColor: '#43e97b', borderRadius: 10, overflow: 'hidden', marginBottom: 30 },
    typeButton: { flex: 1, padding: 15, alignItems: 'center' },
    activeType: { backgroundColor: '#43e97b' },
    typeButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    controlBlock: { marginBottom: 30 },
    label: { color: '#ccc', fontSize: 16, marginBottom: 15 },
    value: { color: '#fff', fontWeight: 'bold' },
    tenureOptions: { flexDirection: 'row', justifyContent: 'space-between' },
    tenureButton: { padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#555', width: '30%', alignItems: 'center' },
    activeTenure: { borderColor: '#43e97b', backgroundColor: 'rgba(67, 233, 123, 0.2)' },
    tenureText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    summaryCard: { backgroundColor: 'rgba(0,0,0,0.3)', padding: 20, borderRadius: 10, marginTop: 20 },
    summaryText: { color: '#ccc', fontSize: 16, marginBottom: 10 },
    summaryValue: { color: '#fff', fontWeight: 'bold' },
    confirmButton: { padding: 20, borderRadius: 15, alignItems: 'center', marginTop: 30 },
    confirmButtonText: { color: 'black', fontSize: 18, fontWeight: 'bold' },
    noticeCard: {
        backgroundColor: 'rgba(240, 152, 25, 0.1)',
        borderRadius: 15,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(240, 152, 25, 0.5)'
      },
      noticeText: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 10,
        lineHeight: 24,
      },
});
export default LoanScreen;