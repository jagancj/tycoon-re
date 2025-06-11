import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Dimensions } from 'react-native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { Ionicons } from '@expo/vector-icons';
import PropertyMarketScreen from './PropertyMarketScreen';
import LandMarketScreen from './LandMarketScreen';

const initialLayout = { width: Dimensions.get('window').width };

const MarketScreen = ({ navigation }) => {
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'properties', title: 'Properties' },
    { key: 'land', title: 'Land' },
  ]);

  // SceneMap remains the same
  const renderScene = SceneMap({
    properties: PropertyMarketScreen,
    land: LandMarketScreen,
  });

  const renderTabBar = props => (
    <TabBar
      {...props}
      indicatorStyle={{ backgroundColor: '#FFD700' }}
      style={{ backgroundColor: '#1a2a6c' }} // A solid color for the tab bar itself
      labelStyle={{ fontWeight: 'bold' }}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* The LinearGradient has been removed from here */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back-outline" size={32} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Marketplace</Text>
        <View style={{width: 42}}/>
      </View>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={initialLayout}
        renderTabBar={renderTabBar}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f2027' }, // Main container gets a fallback dark color
    header: { paddingVertical: 10, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1a2a6c' },
    backButton: { padding: 5 },
    headerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
});

export default MarketScreen;