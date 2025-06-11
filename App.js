import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomePage from "./src/HomePage";
import BankHubScreen from "./src/BankHubScreen";
import LoanScreen from "./src/LoanScreen";
import React, { useContext } from "react";
import { GameProvider } from "./GameContext"; // Import the GameContext
import SelectAssetScreen from "./src/SelectAssetScreen";
import PortfolioScreen from "./src/PortfolioScreen";
import PropertyMarketScreen from "./src/PropertyMarketScreen";
import PropertyDetailScreen from "./src/PropertyDetailScreen";
import AddOnScreen from "./src/AddOnScreen";
import ListingDetailScreen from "./src/ListingDetailScreen";
import TransactionSummaryScreen from "./src/TransactionSummaryScreen";
import LandMarketScreen from "./src/LandMarketScreen";
import BlueprintSelectionScreen from "./src/BlueprintSelectionScreen";
import ConstructionScreen from "./src/ConstructionScreen";
import MarketScreen from "./src/MarketScreen";
import StaffCenterScreen from "./src/StaffCenterScreen";
import FinanceScreen from "./src/FinanceScreen";
import ArchitectSelectionScreen from "./src/ArchitectSelectionScreen";
const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <GameProvider>
      <NavigationContainer>
        <Stack.Navigator
          // Hide the default header created by the navigator
          screenOptions={{
            headerShown: false, // We already had this, it hides the default header
            
            // This makes the screen's container transparent, allowing our
            // LinearGradient backgrounds on each screen to be visible.
            contentStyle: { backgroundColor: 'transparent' },
            
            // This animation looks much better with transparent screens
            // than the default slide animation.
            animation: 'fade', 
          }}
        >
          <Stack.Screen name="Home" component={HomePage} />
          <Stack.Screen name="BankHub" component={BankHubScreen} />
          <Stack.Screen name="LoanScreen" component={LoanScreen} />
          <Stack.Screen
            name="SelectAssetScreen"
            component={SelectAssetScreen}
          />
          <Stack.Screen name="Portfolio" component={PortfolioScreen} />
          <Stack.Screen
            name="PropertyMarket"
            component={PropertyMarketScreen}
          />
          <Stack.Screen
            name="PropertyDetail"
            component={PropertyDetailScreen}
          />
          <Stack.Screen name="AddOns" component={AddOnScreen} />
          <Stack.Screen name="ListingDetail" component={ListingDetailScreen} />
          <Stack.Screen
            name="TransactionSummary"
            component={TransactionSummaryScreen}
          />
          <Stack.Screen name="LandMarket" component={LandMarketScreen} />
          <Stack.Screen name="ArchitectSelection" component={ArchitectSelectionScreen} />
          <Stack.Screen
            name="BlueprintSelection"
            component={BlueprintSelectionScreen}
          />
          <Stack.Screen name="Construction" component={ConstructionScreen} />
          <Stack.Screen name="Market" component={MarketScreen} />
          <Stack.Screen name="StaffCenter" component={StaffCenterScreen} />
          <Stack.Screen name="Finance" component={FinanceScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </GameProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
