import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Dimensions } from 'react-native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { LinearGradient } from 'expo-linear-gradient';
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
  });  const renderTabBar = props => (
    <TabBar
      {...props}
      indicatorStyle={{ backgroundColor: '#FFD700' }}
      style={{ backgroundColor: 'transparent' }} // Transparent to show main gradient
      labelStyle={{ fontWeight: 'bold', color: '#fff' }}
      testID="market-tab-bar"
    />
  );return (
    <View style={{ flex: 1 }} testID="market-container">
            <LinearGradient colors={['#0f2027', '#203a43', '#2c5364']} style={styles.background} testID="background-gradient" />
    <SafeAreaView style={styles.container}>
      <View style={styles.header} testID="market-header">
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} testID="back-button">
            <Ionicons name="chevron-back-outline" size={32} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Marketplace</Text>
        <View style={{width: 42}}/>
      </View>      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={initialLayout}
        renderTabBar={renderTabBar}
        style={{ backgroundColor: 'transparent' }}
        testID="market-tab-view"
      />
    </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f2027' }, // Fallback background color
    background: { position: 'absolute', left: 0, right: 0, top: 0, height: '100%' }, // Full screen background
    header: { paddingVertical: 10, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'transparent' }, // Transparent to show gradient
    backButton: { padding: 5 },
    headerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
});

export default MarketScreen;