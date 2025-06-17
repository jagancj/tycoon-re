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

const formatTimeRemaining = (timeMs) => {
  const seconds = Math.floor(timeMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};

const PortfolioScreen = ({ navigation }) => {
  const {
    playerAssets,
    offers,
    startRenovation,
    listPropertyWithPrice,
    acceptOffer,
    GAME_DAY_IN_MS,
    activeLoans,
    soldPropertiesLog, // <-- Add this line
  } = useContext(GameContext);

  // In PortfolioScreen.js
  const handleRenovate = (asset) => {
    const costData = asset.renovationCost?.total;
    // If costData doesn't exist, we can't proceed.
    if (!costData) {
      Alert.alert(
        "Error",
        "Renovation cost data is missing for this property."
      );
      return;
    }

    // FIX: Directly use the 'total' property for the total cost.
    const renoCost = asset.renovationCost || {};
    const totalCost = renoCost.total || 0;

    // Get value increase from property data
    const valueIncrease = asset.valueIncreaseAfterReno || 0;

    // The Alert now directly displays the breakdown from your data object.
    Alert.alert(
      "Confirm Renovation",
      `Materials: ${(renoCost.materials || 0).toLocaleString()}\nLabor: ${(
        renoCost.labor || 0
      ).toLocaleString()}\nPermits: ${(
        renoCost.permits || 0
      ).toLocaleString()}\n\nTotal Cost: $${totalCost.toLocaleString()}\nValue Increase: +$${valueIncrease.toLocaleString()}`,
      [
        { text: "Cancel", style: "cancel" },
        {          text: "Confirm",
          onPress: () => {
            if (!startRenovation(asset, { navigation })) {
              // The alert logic is now handled inside startRenovation
            }
          },
        },
      ]
    );
  };
  const handleAcceptOffer = (asset, offerAmount) => {
    // Verify the asset isn't already sold
    const originalId = asset.id.split("_")[0];
    if (soldPropertiesLog.some((sp) => sp.id.split("_")[0] === originalId)) {
      Alert.alert("Error", "This property has already been sold.");
      return;
    }

    // Verify the offer still exists
    const currentOffers = offers[asset.id] || [];
    const offerStillValid = currentOffers.some(
      (offer) => offer.amount === offerAmount
    );
    if (!offerStillValid) {
      Alert.alert("Error", "This offer is no longer valid.");
      return;
    }    // 1. Calculate all the numbers needed for the summary screen
    // Use totalInvestment for constructed properties, fallback to invested/purchasePrice for regular properties
    const totalInvestment = asset.totalInvestment || asset.invested || asset.purchasePrice;
    const profitOrLoss = offerAmount - totalInvestment;
    let capitalGainsTax = 0;
    if (profitOrLoss > 0) {
      const holdingDurationDays =
        (Date.now() - asset.purchaseTimestamp) / GAME_DAY_IN_MS;
      const taxRate = holdingDurationDays < 10 ? 0.3 : 0.15;
      capitalGainsTax = Math.round(profitOrLoss * taxRate);
    }

    const summaryData = {
      propertyName: asset.name,
      finalSalePrice: offerAmount,
      grossProfit: profitOrLoss,
      capitalGainsTax: capitalGainsTax,
      netProfit: profitOrLoss - capitalGainsTax,
    };

    // 2. Accept the offer through the context
    if (acceptOffer(asset.id, offerAmount)) {
      // 3. Reset navigation stack to prevent back-navigation to sold property
      navigation.reset({
        index: 1,
        routes: [
          { name: "Home" },
          { name: "TransactionSummary", params: summaryData },
        ],
      });
    }
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
    const renovationCost = item.renovationCost?.total || 0;
    const canListForSale = item.status === "Owned" && !item.isMortgaged;

    // This function will be called when the user accepts an offer

    return (
      <View style={styles.card}>        {/* --- IMAGE SECTION --- */}
        {/* Show land icon for undeveloped land, property image for developed properties and completed construction */}
        {item.assetType === "Land" && !item.constructionCompleted ? (
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

        <View style={styles.cardBody}>          {/* --- DETAILS SECTION (Works for both Land and Properties) --- */}
          <Text style={styles.cardTitle}>{item?.name || "Unknown Asset"}</Text>
          <Text style={styles.cardSubtitle}>
            {item.assetType === "Land" && !item.constructionCompleted
              ? `Size: ${(item?.sizeSqFt || 0).toLocaleString()} sq. ft.`
              : `Market Value: $${(
                  item?.marketValue || item?.areaAverageValue || 0
                ).toLocaleString()}`}
          </Text>
          {item.purchasePrice != null && (
            <Text style={styles.cardSubtitle}>
              Purchase Price: ${(item?.purchasePrice || 0).toLocaleString()}
            </Text>
          )}
          {item.constructionCompleted && item.type && (
            <Text style={styles.cardSubtitle}>
              Property Type: {item.type}
            </Text>
          )}

          {/* --- ACTION SECTION (Conditionally renders the correct buttons) --- */}          {/* === RENDER IF ASSET IS A PROPERTY === */}
          {item.assetType !== "Land" && item?.status === "Owned" && (
            <View style={styles.actions}>
              {!item.renovationCompleted && (
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
              )}
              {item.renovationCompleted && (
                <View style={[styles.button, styles.disabledButton]}>
                  <Ionicons name="checkmark-circle" size={24} color="#43e97b" />
                  <Text style={[styles.buttonActionText, { color: '#43e97b' }]}>Renovated</Text>
                  <Text style={styles.buttonDetailText}>
                    +${(item.lastRenovationValue || 0).toLocaleString()} value
                  </Text>
                </View>
              )}
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
                style={[
                  styles.button,
                  !canListForSale && styles.disabledButton,
                ]}
                disabled={!canListForSale}
                onPress={() =>
                  navigation.navigate("ListingDetail", { assetId: item.id })
                }
              >
                <Ionicons
                  name="pricetag-outline"
                  size={24}
                  color={!canListForSale ? "#666" : "#e63946"}
                />
                <Text style={styles.buttonActionText}>List for Sale</Text>
                <Text style={styles.buttonDetailText}>
                  {canListForSale ? "Start Selling" : "Mortgaged"}
                </Text>
              </TouchableOpacity>
            </View>
          )}          {item.assetType !== "Land" && item?.status === "Renovating" && (
            <View style={styles.renoStatus}>
              <View style={styles.renoHeader}>
                <Text style={styles.renoText}>Renovating...</Text>
                <Text style={styles.progressPercentage}>
                  {Math.floor(item?.renovationProgress || 0)}%
                </Text>
              </View>
              {item.renovationTimeRemaining > 0 && (
                <Text style={styles.timeRemaining}>
                  Time remaining: {formatTimeRemaining(item.renovationTimeRemaining)}
                </Text>
              )}
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${item?.renovationProgress || 0}%` },
                  ]}
                />
              </View>
            </View>
          )}          {/* Show offers for regular properties and completed construction projects */}
          {((item.assetType !== "Land") || (item.assetType === "Land" && item.constructionCompleted)) && item?.status === "For Sale" && (
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
          )}{/* === RENDER IF ASSET IS LAND === */}
          {/* Land that hasn't been developed yet */}
          {item.assetType === "Land" && item.status === "Owned" && !item.constructionCompleted && (
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.developButton}
                onPress={() =>
                  navigation.navigate("ArchitectSelection", { landAsset: item })
                }
              >
                <Text style={styles.developButtonText}>Develop Property</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Land under construction */}
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

          {/* Land with completed construction - treat as developed property */}
          {item.assetType === "Land" && item.status === "Owned" && item.constructionCompleted && (
            <View style={styles.actions}>
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
                style={[
                  styles.button,
                  !canListForSale && styles.disabledButton,
                ]}
                disabled={!canListForSale}
                onPress={() =>
                  navigation.navigate("ListingDetail", { assetId: item.id })
                }
              >
                <Ionicons
                  name="pricetag-outline"
                  size={24}
                  color={!canListForSale ? "#666" : "#e63946"}
                />
                <Text style={styles.buttonActionText}>List for Sale</Text>
                <Text style={styles.buttonDetailText}>
                  {canListForSale ? "Start Selling" : "Mortgaged"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#141E30", "#243B55"]}
        style={styles.background}
      />
    <SafeAreaView style={styles.container}>

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back-outline" size={32} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Portfolio</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.navigate("Home")}
        >
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
    </View>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // This is the key change
  },
  headerTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginLeft: 75,
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
    width: "100%",
    height: 150,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  // And this style for the "Develop" button
  developButton: {
    flex: 1,
    backgroundColor: "rgba(67, 233, 123, 0.2)",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(67, 233, 123, 0.5)",
  },  developButtonText: {
    color: "#43e97b",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 10,
  },
  disabledButton: {
    opacity: 0.7,
  },
  renoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  progressPercentage: {
    color: "#ffae42",
    fontWeight: "bold",
    fontSize: 14,
  },
  timeRemaining: {
    color: "#aaa",
    fontSize: 12,
    marginBottom: 8,
    textAlign: "center",
  },
});

export default PortfolioScreen;
