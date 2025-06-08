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

  const renderScene = SceneMap({
    properties: PropertyMarketScreen,
    land: LandMarketScreen,
  });

  const renderTabBar = props => (
    <TabBar
      {...props}
      indicatorStyle={{ backgroundColor: '#FFD700' }}
      style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
      labelStyle={{ fontWeight: 'bold' }}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#1a2a6c', '#0f2027']} style={styles.background} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back-outline" size={32} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Marketplace</Text>
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
    container: { flex: 1 },
    background: { position: 'absolute', left: 0, right: 0, top: 0, height: '100%', backgroundColor: 'rgba(255,255,255,0.05)' },
    header: { paddingVertical: 10, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    backButton: { position: 'absolute', left: 15 },
    headerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
});

export default MarketScreen;