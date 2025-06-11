import React, { useContext, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { GameContext } from '../GameContext';
import { PROPERTY_LIST } from '../data/properties';
import { useNavigation } from '@react-navigation/native';
import { getDynamicPropertyImage } from '../utils/imageHelpers';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from "expo-linear-gradient";


// --- HELPER FUNCTIONS (Full Implementation) ---

const getPriceRangeForLevel = (level) => {
  if (level < 5) return { min: 40000, max: 150000 };
  if (level < 10) return { min: 100000, max: 500000 };
  if (level < 25) return { min: 400000, max: 1500000 };
  if (level < 40) return { min: 1000000, max: 4000000 };
  return { min: 3000000, max: 10000000 };
};

const shuffleArray = (array) => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex > 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
};

// --- CONSTANTS ---
const PROPERTIES_TO_SHOW = 7;

const PropertyMarketScreen = () => {
  const navigation = useNavigation();
  const { playerLevel, playerAssets, soldPropertiesLog } = useContext(GameContext);

  const availableProperties = useMemo(() => {
    const soldPropertyOriginalIds = soldPropertiesLog.map(log => log.id.split("_")[0]);

    // Filter out properties that have been sold
    const AVL_PROPERTY_LIST = PROPERTY_LIST.filter(p => !soldPropertyOriginalIds.includes(p.id));
    const ownedPropertyIds = playerAssets.map(asset => asset.id.split('_')[0]);
    const priceRange = getPriceRangeForLevel(playerLevel);
    const eligibleProperties = AVL_PROPERTY_LIST.filter(p => {

      const isOwned = ownedPropertyIds.includes(p.id);
      // Ensure priceRange is valid before using it
      const meetsLevelRequirement = playerLevel >= p.minLevel;
      
      return !isOwned && meetsLevelRequirement;
    });
    const shuffled = shuffleArray(eligibleProperties);
    return shuffled.slice(0, PROPERTIES_TO_SHOW);

  }, [playerLevel, playerAssets]);

  const ListEmptyMessage = () => (
    <View style={styles.emptyContainer}>
        <Ionicons name="sad-outline" size={60} color="#667" />
        <Text style={styles.emptyText}>No new properties available at your current level or price range.</Text>
    </View>
  );

  return (
    <View style={styles.sceneContainer}>
      <LinearGradient colors={['#0f2027', '#1D2B64']} style={styles.background} />

      <FlatList
          data={availableProperties}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingHorizontal: 15, paddingTop: 20, flexGrow: 1 }}
          ListEmptyComponent={ListEmptyMessage}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.itemCard} onPress={() => navigation.navigate('PropertyDetail', { property: item })}>
              <Image source={getDynamicPropertyImage(item)} style={styles.itemImage} />
              <View style={styles.itemOverlay}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>Asking: ${item.askingPrice.toLocaleString()}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
    </View>
  );
};

const styles = StyleSheet.create({
    sceneContainer: {
        flex: 1,
    },
    itemCard: { height: 200, borderRadius: 15, overflow: 'hidden', marginBottom: 15, elevation: 5, backgroundColor: '#334' },
    itemImage: { width: '100%', height: '100%' },
    itemOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', padding: 10 },
    itemName: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    itemPrice: { color: '#43e97b', fontSize: 16 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    emptyText: { color: '#99a', fontSize: 18, textAlign: 'center', marginTop: 10 },
});

export default PropertyMarketScreen;