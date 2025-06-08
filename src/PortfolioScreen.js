import React, { useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { GameContext } from "../GameContext";
import { Ionicons } from "@expo/vector-icons";
import { getDynamicPropertyImage } from "../utils/imageHelpers";

const PortfolioScreen = ({ navigation }) => {
  const {
    playerAssets,
    offers,
    startRenovation,
    listPropertyWithPrice,
    acceptOffer,
  } = useContext(GameContext);

  const handleRenovate = (asset) => {
    const cost = asset.renovationData?.cost || 0;
    const valueIncrease = asset.renovationData?.valueIncrease || 0;
    Alert.alert(
      "Confirm Renovation",
      `Are you sure you want to renovate "${
        asset.name
      }"?\n\nCost: $${cost.toLocaleString()}\nValue Increase: +$${valueIncrease.toLocaleString()}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () => {
            if (!startRenovation(asset.id)) {
              Alert.alert(
                "Not Enough Funds",
                `You need $${cost.toLocaleString()} to renovate.`
              );
            }
          },
        },
      ]
    );
  };
  const handleAcceptOffer = (asset, offerAmount) => {
    // 1. Calculate all the numbers needed for the summary screen
    const totalInvestment = asset.invested || asset.purchasePrice;
    const profitOrLoss = offerAmount - totalInvestment;
    const summaryData = {
      propertyName: asset.name,
      finalSalePrice: offerAmount,
      purchasePrice: asset.purchasePrice,
      totalInvestment: totalInvestment,
      profitOrLoss: profitOrLoss,
    };

    // 2. Call the context function to update the game state (money and assets)
    acceptOffer(asset.id, offerAmount);

    // 3. Use navigation.reset to create a fresh, clean navigation stack.
    // This completely removes the old Portfolio and ListingDetail screens from history,
    // preventing all race conditions and dead ends.
    navigation.reset({
      index: 1, // The active screen will be the one at index 1 in the routes array
      routes: [
        { name: "Home" }, // The Home screen is now at the bottom of the stack
        {
          name: "TransactionSummary", // The summary screen is on top
          params: summaryData, // Pass the financial data to it
        },
      ],
    });
  };
  const ListEmptyMessage = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="briefcase-outline" size={80} color="#667" />
      <Text style={styles.emptyTitle}>Your Portfolio is Empty</Text>
      <Text style={styles.emptySubtitle}>
        Buy properties from the market to start building your real estate
        empire.
      </Text>
      <TouchableOpacity
        style={styles.marketButton}
        onPress={() => navigation.navigate("Market")}
      >
        <Text style={styles.marketButtonText}>Go to Market</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAssetCard = ({ item }) => {
    // This is a "Guard Clause". If an item is invalid, we render nothing instead of crashing.
    if (!item) {
      return null;
    }

    // Safely get data needed for rendering
    const currentOffers = offers[item.id] || [];
    const renovationCost = item.renovationData?.cost || 0;

    // This function will be called when the user accepts an offer
    const handleAcceptOffer = (asset, offerAmount) => {
      const totalInvestment = asset.invested || asset.purchasePrice;
      const profitOrLoss = offerAmount - totalInvestment;
      const summaryData = {
        propertyName: asset.name,
        finalSalePrice: offerAmount,
        purchasePrice: asset.purchasePrice,
        totalInvestment: totalInvestment,
        profitOrLoss: profitOrLoss,
      };
      acceptOffer(asset.id, offerAmount);
      navigation.reset({
        index: 1,
        routes: [
          { name: "Home" },
          { name: "TransactionSummary", params: summaryData },
        ],
      });
    };

    return (
      <View style={styles.card}>
        {/* --- IMAGE SECTION --- */}
        {/* It now correctly displays an image for a Property or an icon for Land */}
        {item.assetType === "Land" ? (
          <View style={styles.landIconContainer}>
            <Ionicons
              name="map-outline"
              size={80}
              color="rgba(67, 233, 123, 0.7)"
            />
          </View>
        ) : (
          <Image
            source={getDynamicPropertyImage(item)}
            style={styles.cardImage}
          />
        )}

        <View style={styles.cardBody}>
          {/* --- DETAILS SECTION (Works for both Land and Properties) --- */}
          <Text style={styles.cardTitle}>{item?.name || "Unknown Asset"}</Text>
          <Text style={styles.cardSubtitle}>
            {item.assetType === "Land"
              ? `Size: ${(item?.sizeSqFt || 0).toLocaleString()} sq. ft.`
              : `Market Value: $${(item?.marketValue || 0).toLocaleString()}`}
          </Text>
          {item.purchasePrice != null && (
            <Text style={styles.cardSubtitle}>
              Purchase Price: ${(item?.purchasePrice || 0).toLocaleString()}
            </Text>
          )}

          {/* --- ACTION SECTION (Conditionally renders the correct buttons) --- */}

          {/* === RENDER IF ASSET IS A PROPERTY === */}
          {item.assetType !== "Land" && item?.status === "Owned" && (
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.button}
                onPress={() => handleRenovate(item)}
              >
                <Ionicons name="construct-outline" size={24} color="#3a7bd5" />
                <Text style={styles.buttonActionText}>Renovate</Text>
                <Text style={styles.buttonDetailText}>
                  Cost: ${renovationCost.toLocaleString()}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.button}
                onPress={() =>
                  navigation.navigate("AddOns", { assetId: item.id })
                }
              >
                <Ionicons name="add-circle-outline" size={24} color="#ffae42" />
                <Text style={styles.buttonActionText}>Upgrades</Text>
                <Text style={styles.buttonDetailText}>Add Features</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.button}
                onPress={() =>
                  navigation.navigate("ListingDetail", { assetId: item.id })
                }
              >
                <Ionicons name="pricetag-outline" size={24} color="#e63946" />
                <Text style={styles.buttonActionText}>List for Sale</Text>
                <Text style={styles.buttonDetailText}>Start Selling</Text>
              </TouchableOpacity>
            </View>
          )}

          {item.assetType !== "Land" && item?.status === "Renovating" && (
            <View style={styles.renoStatus}>
              <Text style={styles.renoText}>Renovating...</Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${item?.renovationProgress || 0}%` },
                  ]}
                />
              </View>
            </View>
          )}

          {item.assetType !== "Land" && item?.status === "For Sale" && (
            <View style={styles.forSaleContainer}>
              <Text style={styles.forSaleText}>
                Listed on Market. Awaiting Offers...
              </Text>
              {currentOffers.length > 0 ? (
                currentOffers.map((offer) => (
                  <View key={offer.id} style={styles.offerRow}>
                    <Text style={styles.offerText}>
                      Offer: ${offer.amount.toLocaleString()}
                    </Text>
                    <TouchableOpacity
                      style={styles.acceptButton}
                      onPress={() => handleAcceptOffer(item, offer.amount)}
                    >
                      <Text style={styles.buttonText}>Accept</Text>
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <Text style={styles.noOffersText}>No current offers.</Text>
              )}
            </View>
          )}

          {/* === RENDER IF ASSET IS LAND === */}
          {item.assetType === "Land" && item.status === "Owned" && (
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.developButton}
                onPress={() =>
                  navigation.navigate("BlueprintSelection", { landAsset: item })
                }
              >
                <Ionicons name="business-outline" size={24} color="#43e97b" />
                <Text style={styles.developButtonText}>Develop Property</Text>
              </TouchableOpacity>
            </View>
          )}

          {item.assetType === "Land" &&
            item.status === "Under Construction" && (
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.developButton}
                  onPress={() =>
                    navigation.navigate("Construction", { projectId: item.id })
                  }
                >
                  <Ionicons name="hammer-outline" size={24} color="#ffae42" />
                  <Text style={styles.developButtonText}>
                    View Construction
                  </Text>
                </TouchableOpacity>
              </View>
            )}
        </View>
      </View>
    );
  };
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#141E30", "#243B55"]}
        style={styles.background}
      />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back-outline" size={32} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Portfolio</Text>
           <TouchableOpacity style={styles.headerButton} onPress={() => navigation.navigate('Home')}>
            <Ionicons name="home-outline" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={playerAssets}
        renderItem={renderAssetCard}
        keyExtractor={(item, index) => item?.id || `portfolio-item-${index}`}
        contentContainerStyle={{ padding: 20, flexGrow: 1 }}
        ListEmptyComponent={ListEmptyMessage}
      />
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
   header: {
        paddingVertical: 10,
        paddingHorizontal: 15, // A little less padding on the sides
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between', // This is the key change
    },
    headerTitle: { 
        color: '#fff', 
        fontSize: 24, 
        fontWeight: 'bold',
        marginLeft: 75
    },
    headerButton: {
        padding: 5, // Add padding to make the touch area larger
    },
  backButton: { position: "absolute", left: 25 },
  card: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 15,
    marginBottom: 20,
    overflow: "hidden",
  },
  cardImage: { width: "100%", height: 150 },
  cardBody: { padding: 15 },
  cardTitle: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  cardSubtitle: { color: "#ccc", fontSize: 16, marginTop: 5 },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  buttonReno: {
    backgroundColor: "#3a7bd5",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 2,
    alignItems: "center",
  },
  buttonUpgrade: {
    backgroundColor: "#ffae42",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 2,
    alignItems: "center",
  },
  buttonSell: {
    backgroundColor: "#e63946",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 2,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 12 },
  renoStatus: { marginTop: 15 },
  renoText: { color: "#43e97b", marginBottom: 5 },
  progressBar: {
    height: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 5,
    overflow: "hidden",
  },
  forSaleContainer: { marginTop: 15 },
  forSaleText: { color: "#ffae42", fontStyle: "italic", marginBottom: 10 },
  offerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
    padding: 10,
    borderRadius: 5,
    marginBottom: 5,
  },
  offerText: { color: "#fff", fontSize: 16 },
  acceptButton: {
    backgroundColor: "#43e97b",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 15,
  },
  emptySubtitle: {
    color: "#99a",
    fontSize: 16,
    textAlign: "center",
    marginTop: 10,
    marginBottom: 30,
  },
  marketButton: {
    backgroundColor: "#3a7bd5",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
  },
  marketButtonText: { color: "white", fontSize: 18, fontWeight: "bold" },
  noOffersText: {
    color: "#99a",
    textAlign: "center",
    fontStyle: "italic",
    marginTop: 10,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-around", // Distribute buttons evenly
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  button: {
    alignItems: "center",
    padding: 5,
    width: 100, // Give each button a fixed width for alignment
  },
  buttonActionText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
    marginTop: 5,
  },
  buttonDetailText: {
    color: "#aaa",
    fontSize: 12,
    marginTop: 2,
  },
  landIconContainer: {
        width: '100%',
        height: 150,
        backgroundColor: 'rgba(0,0,0,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    // And this style for the "Develop" button
    developButton: {
        flex: 1,
        backgroundColor: 'rgba(67, 233, 123, 0.2)',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(67, 233, 123, 0.5)',
    },
    developButtonText: {
        color: '#43e97b',
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 10,
    }
});

export default PortfolioScreen;
