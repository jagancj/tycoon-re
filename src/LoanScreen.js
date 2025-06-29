import React, { useState, useMemo, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { GameContext } from '../GameContext';
import TransactionModal from './TransactionModal';
import { getDynamicPropertyImage } from '../utils/imageHelpers';

const LoanScreen = ({ navigation, route }) => {
  const { bank, selectedAsset, type } = route.params;
  const { takeLoan, activeLoans, playerAssets } = useContext(GameContext);
  
  const [loanType, setLoanType] = useState(type || 'Personal');
  const [tenure, setTenure] = useState(36);
  const [modalState, setModalState] = useState({ isVisible: false, status: '', details: {} });
  const [selectedProperty, setSelectedProperty] = useState(selectedAsset || null);
  // Get a list of properties that are available to be mortgaged (both regular and constructed)
  const mortgagableProperties = useMemo(() => 
    playerAssets.filter(asset => 
      // Must have a market value (constructed properties) or baseValue (regular properties)
      (asset.marketValue || asset.areaAverageValue || asset.baseValue) && 
      !asset.isMortgaged &&
      asset.status === 'Owned'
    ), 
    [playerAssets]
  );
  
  // This hook calculates all the core terms for the selected loan type and property
  const { terms, maxLoan, minLoan } = useMemo(() => {
    const currentTerms = bank.loanTerms[loanType.toLowerCase()];
    if (!currentTerms) return { terms: null, maxLoan: 0, minLoan: 0 };    if (loanType === 'Mortgage') {
      // If no property is selected yet, we can't determine the loan amounts.
      if (!selectedProperty) return { terms: currentTerms, maxLoan: 0, minLoan: 0 };
      
      // Get property value from available fields (constructed properties use marketValue, regular properties might use marketValue, areaAverageValue, or baseValue)
      const propertyValue = selectedProperty.marketValue || selectedProperty.areaAverageValue || selectedProperty.baseValue || 0;
      
      if (propertyValue <= 0) {
        console.warn('Property has no valid value for mortgage calculation:', selectedProperty);
        return { terms: currentTerms, maxLoan: 0, minLoan: 0 };
      }
      
      const maxMortgage = Math.floor(propertyValue * currentTerms.maxLoanPercentage);
      const minMortgage = Math.min(10000, maxMortgage);
      return { terms: currentTerms, maxLoan: maxMortgage, minLoan: minMortgage };
    }
    
    // For Personal loans
    return { terms: currentTerms, maxLoan: currentTerms.maxLoan, minLoan: currentTerms.minLoan };
  }, [loanType, bank, selectedProperty]);

  const [amount, setAmount] = useState(0);

  // This effect resets the slider's amount whenever the loan details change
  useEffect(() => {
    setAmount(minLoan);
  }, [minLoan]);
  useEffect(() => { 
    console.log(playerAssets, 'Player Assets');
  },[])

  // This effect handles setting initial amount when property or loan type changes
  useEffect(() => {
    if (minLoan > 0) {
      setAmount(minLoan);
    }
  }, [minLoan, selectedProperty, loanType]);

  const { interestRate, emi } = useMemo(() => {
    if (!terms || amount === 0 || tenure === 0) return { interestRate: terms?.baseInterestRate || 0, emi: 0 };
    const baseInterest = terms.baseInterestRate;
    const monthlyRate = baseInterest / 100 / 12;
    const calculatedEmi = (amount * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / (Math.pow(1 + monthlyRate, tenure) - 1);
    return { interestRate: baseInterest, emi: Math.round(calculatedEmi) };
  }, [amount, tenure, terms]);
  // Check if a loan of this type exists for this specific bank/asset
  const existingLoan = useMemo(() => {
    return activeLoans.find(loan => {
      if (loanType === 'Personal') {
        // For personal loans, check if there's already a personal loan from this bank
        return loan.type === 'Personal' && loan.bank === bank.name;
      } else {
        // For mortgage loans, check if this property already has a mortgage
        return loan.type === 'Mortgage' && loan.assetId === selectedProperty?.id;
      }
    });
  }, [activeLoans, loanType, bank.name, selectedProperty?.id]);

  const handleOpenConfirmation = () => {
    setModalState({
        isVisible: true, status: 'confirm',
        details: {
            itemName: `a ${loanType} loan`, itemPrice: amount, fee: emi, totalCost: amount,
            title: 'Confirm Loan', confirmText: `Take Loan`, feeLabel: 'Monthly EMI:',
        }
    });
  };

  const handleConfirmLoan = () => {
    if (amount <= 0 || amount > maxLoan) {
      Alert.alert("Invalid Amount", "Please select a valid loan amount.");
      return;
    }

    const loanDetails = {
      bank: bank.name,
      amount,
      emi,
      type: loanType,
      outstandingPrincipal: amount,
      interestRate: terms?.baseInterestRate || 0,
      tenure,
      assetId: selectedProperty?.id || null,
      date: Date.now()
    };

    takeLoan(loanDetails);
    setModalState(prev => ({ 
      ...prev, 
      status: 'success', 
      details: { 
        ...prev.details, 
        title: "Loan Approved!", 
        subtitle: `$${amount.toLocaleString()} has been credited.` 
      } 
    }));
  };

  const handleCloseModal = () => {
    const success = modalState.status === 'success';
    setModalState({ isVisible: false, status: '', details: {} });
    if (success) { navigation.reset({ index: 0, routes: [{ name: 'Home' }] }); }
  };

  // --- UI RENDER FUNCTIONS ---

  const renderPersonalLoanUI = () => (
    <>
      <View style={styles.controlBlock}>
        <Text style={styles.label}>Loan Amount: <Text style={styles.value}>${amount.toLocaleString()}</Text></Text>
        <Slider value={amount} onValueChange={setAmount} minimumValue={minLoan} maximumValue={maxLoan} step={1000} minimumTrackTintColor="#38f9d7" thumbTintColor="#43e97b" />
      </View>
      {renderTenureAndSummary()}
      {renderConfirmButton()}
    </>
  );

  const renderMortgageApplicationUI = () => (
    <>
      <TouchableOpacity style={styles.selectedPropertyHeader} onPress={() => setSelectedProperty(null)}>
        <Ionicons name="arrow-back-outline" size={20} color="#fff" />
        <Text style={styles.selectedPropertyText}>Back to Property List</Text>
      </TouchableOpacity>
      <View style={styles.propertyCard}>
        <Ionicons name="home" size={40} color="#43e97b" />
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{selectedProperty.name}</Text>          <Text style={styles.cardSubtitle}>
            Value: ${(selectedProperty.marketValue || selectedProperty.areaAverageValue || selectedProperty.baseValue || 0).toLocaleString()}
          </Text>
        </View>
      </View>
      <View style={styles.controlBlock}>
        <Text style={styles.label}>Mortgage Amount</Text>
        <Text style={styles.value}>${amount.toLocaleString()}</Text>
        <Slider
          value={amount}
          onValueChange={setAmount}
          minimumValue={minLoan}
          maximumValue={maxLoan}
          step={1000}
          minimumTrackTintColor="#38f9d7"
          thumbTintColor="#43e97b"
        />
        <Text style={styles.interestText}>
          Maximum {terms?.maxLoanPercentage * 100}% of property value
        </Text>
      </View>
      {renderTenureAndSummary()}
      {renderConfirmButton()}
    </>
  );

  const renderPropertySelection = () => (
    <View>
        <Text style={styles.label}>Select a Property to Mortgage:</Text>
        {mortgagableProperties.length > 0 ? mortgagableProperties.map(prop => (
            <TouchableOpacity key={prop.id} style={styles.propertyCard} onPress={() => setSelectedProperty(prop)}>
                <Image source={getDynamicPropertyImage(prop)} style={styles.propertyImage} />
                <View style={{flex: 1}}>
                    <Text style={styles.cardTitle}>{prop.name}</Text>
                    <Text style={styles.cardSubtitle}>
                      Value: ${(prop.marketValue || prop.areaAverageValue || prop.baseValue || 0).toLocaleString()}
                    </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#fff" />
            </TouchableOpacity>
        )) : (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeText}>No un-mortgaged properties available.</Text>
          </View>
        )}
    </View>
  );

  const renderTenureAndSummary = () => (
    <>
        <View style={styles.controlBlock}>
          <Text style={styles.label}>Loan Tenure (Months)</Text>
          <View style={styles.tenureOptions}>              {[12, 24, 36, 48].map(t => (
                  <TouchableOpacity key={t} style={[styles.tenureButton, tenure === t && styles.activeTenure]} onPress={() => setTenure(t)}>
                    <Text style={styles.tenureText}>{t} mo</Text>
                  </TouchableOpacity>
              ))}
          </View>
        </View>        <View style={styles.summaryCard}>
            <View style={styles.row}>
              <Text style={styles.label}>Interest Rate:</Text>
              <Text style={styles.value}>{interestRate.toFixed(2)}%</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Monthly Payment (EMI):</Text>
              <Text style={styles.value}>${emi.toLocaleString()}</Text>
            </View>
        </View>
    </>
  );

  const renderConfirmButton = () => (    <TouchableOpacity onPress={handleOpenConfirmation} disabled={maxLoan <= 0 || amount <= 0}>
        <LinearGradient colors={(maxLoan > 0 && amount > 0) ? ['#38ef7d', '#11998e'] : ['#555', '#333']} style={styles.confirmButton}>
          <Text style={styles.confirmButtonText}>Take Loan</Text>
        </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1 }}>
    <LinearGradient colors={['#232526', '#414345']} style={styles.background} />

    <SafeAreaView style={styles.container}>
      <TransactionModal isVisible={modalState.isVisible} status={modalState.status} details={modalState.details} onClose={handleCloseModal} onConfirm={handleConfirmLoan} />      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={32} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{bank.name}</Text>
      </View>

      <ScrollView style={styles.content}>        <View style={styles.typeSelector}>
          <TouchableOpacity style={[styles.typeButton, loanType === 'Personal' && styles.activeTypeButton]} onPress={() => { setLoanType('Personal'); setSelectedProperty(null); }}>
            <Text style={styles.typeButtonText}>Personal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.typeButton, loanType === 'Mortgage' && styles.activeTypeButton]} onPress={() => setLoanType('Mortgage')}>
            <Text style={styles.typeButtonText}>Mortgage</Text>
          </TouchableOpacity>
        </View>        {existingLoan ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeText}>
              {loanType === 'Personal' 
                ? `You already have an active Personal loan from ${bank.name}.` 
                : `You already have an active Mortgage loan on ${selectedProperty?.name}.`
              }
            </Text>
          </View>
        ) : (
          <>
            {loanType === 'Personal' && renderPersonalLoanUI()}
            {loanType === 'Mortgage' && !selectedProperty && renderPropertySelection()}
            {loanType === 'Mortgage' && selectedProperty && renderMortgageApplicationUI()}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
    </View>
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
    tenureButton: { paddingVertical: 12, width: '23%', borderRadius: 10, borderWidth: 1, borderColor: '#555', alignItems: 'center' },
    activeTenure: { borderColor: '#38f9d7', backgroundColor: 'rgba(56, 249, 215, 0.1)' },
    tenureText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
    summaryCard: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 15, borderRadius: 10, marginTop: 10 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 4 },
    propertyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', padding: 10, borderRadius: 10, marginBottom: 10 },
    propertyImage: { width: 60, height: 60, borderRadius: 8, marginRight: 15 },
    cardTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    cardSubtitle: { color: '#ccc', fontSize: 12 },
    selectedPropertyHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    selectedPropertyText: { color: '#fff', marginLeft: 10, fontSize: 16 },
    cardInfo: { flex: 1, marginLeft: 10 }
});

export default LoanScreen;