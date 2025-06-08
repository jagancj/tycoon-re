import React, { useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { GameContext } from '../GameContext';

const LandDetailScreen = ({ route, navigation }) => {
    const { landPlot } = route.params;
    const { buyLand } = useContext(GameContext);

    const handleBuy = () => {
        // Negotiation logic could be added here later
        const price = landPlot.askingPrice;
        if (buyLand(landPlot, price)) {
            Alert.alert("Purchase Successful!", `You have acquired ${landPlot.name}.`);
            navigation.replace('Portfolio'); // Use replace for a clean nav stack
        } else {
            Alert.alert("Purchase Failed", "You do not have enough funds.");
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>{landPlot.name}</Text>
            <Text style={styles.subtitle}>{landPlot.locationType} - {landPlot.sizeSqFt.toLocaleString()} sq. ft.</Text>
            <TouchableOpacity style={styles.buyButton} onPress={handleBuy}>
                <Text>Buy for ${landPlot.askingPrice.toLocaleString()}</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f2027', alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 28, color: 'white', fontWeight: 'bold' },
    subtitle: { fontSize: 18, color: '#ccc', marginTop: 10, marginBottom: 40 },
    buyButton: { backgroundColor: '#43e97b', padding: 20, borderRadius: 10 },
});

export default LandDetailScreen;