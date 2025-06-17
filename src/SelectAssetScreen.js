import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GameContext } from '../GameContext';

const SelectAssetScreen = ({ navigation, route }) => {
  const { playerAssets } = useContext(GameContext);
  const { bank } = route.params;
  // Filter only mortgagable properties (both regular and constructed)
  const mortgagableAssets = playerAssets.filter(asset => 
    // Must have a market value (constructed properties) or baseValue (regular properties)
    (asset.marketValue || asset.areaAverageValue || asset.baseValue) && 
    !asset.isMortgaged &&
    asset.status === 'Owned'
  );

  const renderAsset = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('LoanScreen', {
        bank,
        selectedAsset: item,
        type: 'Mortgage'
      })}
    >
      <Ionicons name={item.type === 'House' ? 'home' : 'map'} size={40} color="#43e97b" />      <View style={styles.cardInfo}>
        <Text style={styles.assetName}>{item.name}</Text>
        <Text style={styles.assetDetails}>
          Value: ${(item.marketValue || item.areaAverageValue || item.baseValue || 0).toLocaleString()}
        </Text>
        {item.areaSqFt && <Text style={styles.assetDetails}>Area: {item.areaSqFt.toLocaleString()} sq. ft.</Text>}
      </View>
      <Ionicons name="chevron-forward" size={24} color="#fff" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0f2027', '#203a43', '#2c5364']} style={styles.background} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={32} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Property to Mortgage</Text>
      </View>
      <FlatList
        data={mortgagableAssets}
        renderItem={renderAsset}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            You have no properties available for mortgage. Properties must be fully owned and not already mortgaged.
          </Text>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  background: { 
    position: 'absolute', 
    left: 0, 
    right: 0, 
    top: 0, 
    height: '100%' 
  },
  header: { 
    paddingHorizontal: 20, 
    paddingTop: 10, 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  headerTitle: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#fff', 
    marginLeft: 15 
  },
  list: { 
    padding: 20 
  },
  card: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0,0,0,0.3)', 
    padding: 15, 
    borderRadius: 10, 
    marginBottom: 15 
  },
  cardInfo: { 
    flex: 1, 
    marginLeft: 15 
  },
  assetName: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  assetDetails: { 
    color: '#ccc', 
    fontSize: 14, 
    marginTop: 4 
  },
  emptyText: { 
    color: '#ccc', 
    textAlign: 'center', 
    marginTop: 50, 
    fontSize: 16,
    paddingHorizontal: 20,
    lineHeight: 24
  }
});

export default SelectAssetScreen;