import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Dimensions, FlatList, ScrollView } from 'react-native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { LinearGradient } from 'expo-linear-gradient';
import { GameContext } from '../GameContext';
import { Ionicons } from '@expo/vector-icons';

// --- Tab 1: Financial Statements ---
const StatementsRoute = () => {
    const { gameMoney, playerAssets, activeLoans, transactionLog } = useContext(GameContext);

    // This is a simplified calculation logic for demonstration
    const allTime = processTransactions(transactionLog);
    
    const assetsValue = playerAssets.reduce((sum, asset) => sum + (asset.marketValue || 0), 0);
    const totalAssets = gameMoney + assetsValue;
    const totalLiabilities = Object.values(activeLoans || {}).reduce((sum, loan) => sum + loan.outstandingPrincipal, 0);
    const netWorth = totalAssets - totalLiabilities;

    return (
        <ScrollView style={styles.sceneContainer} contentContainerStyle={styles.scrollContent}>
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Balance Sheet</Text>
                <View style={styles.row}><Text style={styles.label}>Cash:</Text><Text style={styles.value}>${gameMoney.toLocaleString()}</Text></View>
                <View style={styles.row}><Text style={styles.label}>Real Estate Value:</Text><Text style={styles.value}>${assetsValue.toLocaleString()}</Text></View>
                <View style={styles.separator} />
                <View style={styles.row}><Text style={styles.labelTotal}>Total Assets:</Text><Text style={styles.valueTotal}>${totalAssets.toLocaleString()}</Text></View>
                <View style={styles.row}><Text style={styles.label}>Total Loans:</Text><Text style={[styles.value, {color: '#e63946'}]}>-${totalLiabilities.toLocaleString()}</Text></View>
                <View style={styles.separator} />
                <View style={styles.row}><Text style={styles.labelTotal}>Net Worth:</Text><Text style={[styles.valueTotal, {color: '#43e97b'}]}>${netWorth.toLocaleString()}</Text></View>
            </View>
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Profit & Loss (All Time)</Text>
                <View style={styles.row}><Text style={styles.label}>Total Revenue:</Text><Text style={[styles.value, {color: '#43e97b'}]}>+ ${allTime.revenue.toLocaleString()}</Text></View>
                <View style={styles.row}><Text style={styles.label}>Total Expenses:</Text><Text style={[styles.value, {color: '#e63946'}]}>- ${allTime.expenses.toLocaleString()}</Text></View>
                 <View style={styles.separator} />
                <View style={styles.row}><Text style={styles.labelTotal}>Net Profit:</Text><Text style={[styles.valueTotal, allTime.net > 0 ? {color: '#43e97b'} : {color: '#e63946'}]}>${allTime.net.toLocaleString()}</Text></View>
            </View>
        </ScrollView>
    );
};

// --- Tab 2: Property Ledger ---
const LedgerRoute = () => {
    const { soldPropertiesLog } = useContext(GameContext);
    return (
        <View style={styles.sceneContainer}>
            <FlatList
                data={soldPropertiesLog}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.scrollContent}
                renderItem={({item}) => (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>{item.name}</Text>
                        <View style={styles.row}><Text style={styles.label}>Sale Price:</Text><Text style={styles.value}>${item.salePrice.toLocaleString()}</Text></View>
                        <View style={styles.row}><Text style={styles.label}>Total Investment:</Text><Text style={styles.value}>-${item.totalInvestment.toLocaleString()}</Text></View>
                        <View style={styles.separator} />
                        <View style={styles.row}><Text style={styles.labelTotal}>{item.profit >= 0 ? 'Profit:' : 'Loss:'}</Text><Text style={[styles.valueTotal, item.profit >= 0 ? {color: '#43e97b'} : {color: '#e63946'}]}>${item.profit.toLocaleString()}</Text></View>
                    </View>
                )}
                ListEmptyComponent={<Text style={styles.emptyText}>No properties sold yet.</Text>}
            />
        </View>
    );
};


// --- Main Finance Screen Component ---
const FinanceScreen = ({ navigation }) => {
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'statements', title: 'Statements' },
    { key: 'ledger', title: 'Property Ledger' },
  ]);

  const renderScene = SceneMap({
    statements: StatementsRoute,
    ledger: LedgerRoute,
  });

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#1D2B64', '#0f2027']} style={styles.background} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}><Ionicons name="chevron-back" size={32} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Financial Center</Text>
        <View style={{width: 42}} />
      </View>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: Dimensions.get('window').width }}
        renderTabBar={props => <TabBar {...props} indicatorStyle={{backgroundColor: '#FFD700'}} style={{backgroundColor: 'transparent'}} />}
      />
    </SafeAreaView>
  );
};


// --- Helper to process transactions ---
function processTransactions(log) {
    console.log("Processing transaction log:", log);
    if (!log || log.length === 0) return { revenue: 0, expenses: 0, net: 0 };
    const revenue = log.filter(tx => tx.amount > 0).reduce((sum, tx) => sum + tx.amount, 0);
    const expenses = log.filter(tx => tx.amount < 0).reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    return { revenue, expenses, net: revenue - expenses }; 
}


// --- Styles ---
const styles = StyleSheet.create({
    container: { flex: 1 },
    background: { position: 'absolute', left: 0, right: 0, top: 0, height: '100%' },
    sceneContainer: { flex: 1 },
    scrollContent: { padding: 20 },
    header: { paddingVertical: 10, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
    headerButton: { padding: 5 },
    card: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 20, borderRadius: 10, marginBottom: 20 },
    cardTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 5 },
    label: { color: '#ccc', fontSize: 16 },
    value: { color: '#fff', fontSize: 16, fontWeight: '600' },
    separator: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 10 },
    labelTotal: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    valueTotal: { fontSize: 18, fontWeight: 'bold' },
    emptyText: { color: '#999', textAlign: 'center', marginTop: 50, fontSize: 16 },
});

export default FinanceScreen;