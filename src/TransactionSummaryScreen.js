import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const TransactionSummaryScreen = ({ route, navigation }) => {
  // Receive all the financial data from the route params
  const {
    propertyName,
    finalSalePrice,
    grossProfit,
    capitalGainsTax,
    netProfit,
  } = route.params;

  const isProfit = netProfit >= 0;

  // This function clears the entire navigation history and returns to the Home screen.
  // This is the key to fixing the navigation dead-end issue permanently.
  const returnToHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: "Home" }],
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={isProfit ? ["#134E5E", "#71B280"] : ["#4B1212", "#A33B3B"]}
        style={styles.background}
      />

      <View style={styles.content}>
        <Ionicons
          name={isProfit ? "trending-up-outline" : "trending-down-outline"}
          size={80}
          color="#fff"
        />
        <Text style={styles.title}>
          {isProfit ? "Property Sold!" : "Sold at a Loss"}
        </Text>
        <Text style={styles.subtitle}>{propertyName}</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Final Tally</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Final Sale Price:</Text>
            <Text style={styles.value}>
              + ${finalSalePrice.toLocaleString()}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Gross Profit:</Text>
            <Text style={styles.value}>${grossProfit.toLocaleString()}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Capital Gains Tax:</Text>
            <Text style={styles.value}>
              - ${capitalGainsTax.toLocaleString()}
            </Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.row}>
            <Text
              style={[
                styles.labelTotal,
                { color: isProfit ? "#43e97b" : "#e63946" },
              ]}
            >
              {isProfit ? "Net Profit:" : "Net Loss:"}
            </Text>
            <Text
              style={[
                styles.valueTotal,
                { color: isProfit ? "#43e97b" : "#e63946" },
              ]}
            >
              {isProfit ? "$" : "-$"}
              {Math.abs(netProfit).toLocaleString()}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.homeButton} onPress={returnToHome}>
          <Text style={styles.homeButtonText}>Return to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: "100%",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: { fontSize: 32, fontWeight: "bold", color: "#fff", marginTop: 15 },
  subtitle: { fontSize: 18, color: "rgba(255,255,255,0.8)", marginBottom: 40 },
  card: {
    backgroundColor: "rgba(0,0,0,0.3)",
    padding: 25,
    borderRadius: 15,
    width: "100%",
    marginBottom: 40,
  },
  cardTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 8,
  },
  label: { color: "#ccc", fontSize: 16 },
  value: { color: "#fff", fontSize: 16, fontWeight: "600" },
  separator: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginVertical: 15,
  },
  labelTotal: { fontSize: 20, fontWeight: "bold" },
  valueTotal: { fontSize: 20, fontWeight: "bold" },
  homeButton: {
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingVertical: 18,
    paddingHorizontal: 50,
    borderRadius: 30,
  },
  homeButtonText: { color: "#111", fontSize: 18, fontWeight: "bold" },
});

export default TransactionSummaryScreen;
