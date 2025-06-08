import React, { useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { GameContext } from '../GameContext';
import { LAND_PLOT_LIST } from '../data/landPlots';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const LandMarketScreen = () => {
  const navigation = useNavigation();
  const { playerLevel, playerAssets } = useContext(GameContext);

  const ownedLandIds = playerAssets.filter(asset => asset.assetType === 'Land').map(asset => asset.id.split('_')[0]);
  const availablePlots = LAND_PLOT_LIST.filter(
    plot => plot.minLevel <= playerLevel && !ownedLandIds.includes(plot.id)
  );

  return (
    // FIX 1: Wrap FlatList in a transparent View.
    <View style={styles.sceneContainer}>
      <FlatList
        data={availablePlots}
        keyExtractor={item => item.id}
        // FIX 2: Use consistent padding for spacing.
        contentContainerStyle={{ padding: 20, flexGrow: 1 }}
        ListEmptyComponent={<Text style={styles.emptyText}>No land available at your current level.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('LandDetail', { landPlot: item })}>
            <Ionicons name="map-outline" size={40} color="#43e97b" />
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardSubtitle}>{item.locationType} - {item.sizeSqFt.toLocaleString()} sq. ft.</Text>
            </View>
            <Text style={styles.cardPrice}>${item.askingPrice.toLocaleString()}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
    sceneContainer: {
        flex: 1,
        backgroundColor: 'transparent', // This makes the gradient from the parent show through
    },
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: 20, borderRadius: 10, marginBottom: 15 },
    cardInfo: { flex: 1, marginHorizontal: 15 },
    cardTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    cardSubtitle: { color: '#ccc', fontSize: 14, marginTop: 4 },
    cardPrice: { color: '#43e97b', fontSize: 18, fontWeight: 'bold' },
    emptyText: { color: '#ccc', textAlign: 'center', marginTop: 50, fontSize: 16 }
});

export default LandMarketScreen;