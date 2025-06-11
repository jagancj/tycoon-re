import React, { useContext, useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  SafeAreaView,
  FlatList,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { GameContext } from "../GameContext";
import CircularProgress from "./CircularProgress";
import { BLUEPRINT_LIST } from "../data/buildingBlueprints";
import { PROPERTY_LIST } from "../data/properties";
import { LAND_PLOT_LIST } from "../data/landPlots";
import { getDynamicPropertyImage } from "../utils/imageHelpers";

const HomePage = ({ navigation }) => {
  const {
    gameMoney,
    playerLevel,
    playerXp,
    xpForNextLevel,
    playerAssets,
    offers,
    constructionProjects,
    soldPropertiesLog
  } = useContext(GameContext);

  const [featuredDeal, setFeaturedDeal] = useState(null);

  const xpPercentage =
    xpForNextLevel > 0 ? (playerXp / xpForNextLevel) * 100 : 0;

  useEffect(() => {
    const soldPropertyOriginalIds = soldPropertiesLog.map(log => log.id.split("_")[0]);
    const ownedAssetIds = playerAssets.map((asset) => asset.id.split("_")[0]);
    const allPossibleAssets = [
      ...PROPERTY_LIST.map((p) => ({ ...p, assetType: "Property" })),
      ...LAND_PLOT_LIST.map((l) => ({ ...l, assetType: "Land" })),
    ];
    const eligibleAssets = allPossibleAssets.filter((asset) => {
        // --- NEW VALIDATION: Check if the property has ever been sold ---
        const hasBeenSold = soldPropertyOriginalIds.includes(asset.id);

        return (
            playerLevel >= asset.minLevel &&
            gameMoney >= asset.askingPrice &&
            !ownedAssetIds.includes(asset.id) &&
            !hasBeenSold // <-- The crucial new check
        );
    });

    if (eligibleAssets.length > 0) {
      eligibleAssets.forEach((asset) => {
        asset.bargainScore =
          (asset.areaAverageValue || asset.baseValue) / asset.askingPrice;
      });
      eligibleAssets.sort((a, b) => b.bargainScore - a.bargainScore);
      setFeaturedDeal(eligibleAssets[0]);
    }
  }, [playerAssets, playerLevel, gameMoney, soldPropertiesLog]);

  const activeProjects = useMemo(() => {
    return playerAssets.filter(
      (asset) =>
        asset.status === "For Sale" || asset.status === "Under Construction"
    );
  }, [playerAssets]);

  const formatMoney = (amount) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(2)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
    return amount.toString();
  };

  const NavButton = ({ onPress, iconName, iconColor, text }) => (
    <TouchableOpacity style={styles.navButton} onPress={onPress}>
      <View style={[styles.navIconContainer, { borderColor: iconColor }]}>
        <Ionicons name={iconName} size={30} color={iconColor} />
      </View>
      <Text style={styles.navButtonText}>{text}</Text>
    </TouchableOpacity>
  );

  const renderActiveProjectCard = ({ item }) => {
    if (item.status === "For Sale") {
      const propertyOffers = offers[item.id] || [];
      const topOffer = propertyOffers.reduce(
        (max, offer) => (offer.amount > max ? offer.amount : max),
        0
      );

      return (
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate("Portfolio")}
        >
          <View style={[styles.cardBanner, styles.forSaleBanner]}>
            <Text style={styles.cardBannerText}>FOR SALE</Text>
          </View>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardSubtitle}>Top Offer</Text>
          <Text style={styles.cardValue}>${topOffer.toLocaleString()}</Text>
        </TouchableOpacity>
      );
    }

    if (item.status === "Under Construction") {
      const project = constructionProjects[item.id];
      const blueprint = BLUEPRINT_LIST.find(
        (b) => b.id === project?.blueprintId
      );

      return (
        <TouchableOpacity
          style={styles.card}
          onPress={() =>
            navigation.navigate("Construction", { projectId: item.id })
          }
        >
          <View style={[styles.cardBanner, styles.constructionBanner]}>
            <Text style={styles.cardBannerText}>UNDER CONSTRUCTION</Text>
          </View>
          <Text style={styles.cardTitle}>{blueprint?.name || "New Build"}</Text>
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              {Math.floor(project?.progress || 0)}%
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${project?.progress || 0}%` },
                ]}
              />
            </View>
          </View>
        </TouchableOpacity>
      );
    }
    return null;
  };

  const FeaturedDealCard = () => {
    if (!featuredDeal) {
      return (
        <View style={styles.emptyDashboard}>
          <TouchableOpacity
            style={styles.marketButton}
            onPress={() => navigation.navigate("PropertyMarket")}
          >
            <Text style={styles.marketButtonText}>Go to Property Market</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const isLand = featuredDeal.assetType === "Land";
    const destination = isLand ? "LandDetail" : "PropertyDetail";
    const params = isLand
      ? { landPlot: featuredDeal }
      : { property: featuredDeal };

    return (
      <View style={styles.emptyDashboard}>
        <Text style={styles.dealHeaderText}>🔥 Today's Hot Deal! 🔥</Text>
        <TouchableOpacity
          style={styles.dealCard}
          onPress={() => navigation.navigate(destination, params)}
        >
          {/* {isLand ? (
            <Ionicons name="map-outline" size={80} color="#43e97b" />
          ) : (
            <Image
              source={getDynamicPropertyImage(featuredDeal)}
              style={styles.dealImage}
            />
          )} */}
          <View style={styles.dealInfo}>
            <Text style={styles.dealName}>{featuredDeal.name}</Text>
            <Text style={styles.dealSubtitle}>
              {featuredDeal.type || featuredDeal.locationType}
            </Text>
            <Text style={styles.dealPrice}>
              Asking: ${featuredDeal.askingPrice.toLocaleString()}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={["#1a2a6c", "#b21f1f", "#fdbb2d"]}
        style={styles.background}
      />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.topBar}>
          <View style={styles.moneyContainer}>
            <Image
              source={require("../assets/coin.png")}
              style={styles.coinIcon}
            />
            <Text style={styles.moneyText}>{formatMoney(gameMoney)}</Text>
          </View>
          <View style={styles.levelContainer}>
            <CircularProgress
              size={70}
              strokeWidth={6}
              progress={xpPercentage}
              bgColor="rgba(0,0,0,0.5)"
              progressColor="#4dffc3"
            />
            <View style={styles.levelTextContainer}>
              <Text style={styles.levelTextLabel}>LVL</Text>
              <Text style={styles.levelTextNumber}>{playerLevel}</Text>
            </View>
          </View>
        </View>

        <View style={styles.mainContent}>
          <FlatList
            data={activeProjects}
            renderItem={renderActiveProjectCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 20,
              flexGrow: 1,
            }}
            ListEmptyComponent={<FeaturedDealCard />}
          />
        </View>

        {/* --- BOTTOM NAVIGATION BAR (Restored and Complete) --- */}
        <View style={styles.bottomNavBar}>
          <NavButton
            onPress={() => navigation.navigate("Market")} // The new unified Market button
            iconName="storefront-outline"
            iconColor="#43e97b"
            text="Market"
          />
          <NavButton
            onPress={() => navigation.navigate("Portfolio")}
            iconName="business-outline"
            iconColor="#00BFFF"
            text="Portfolio"
          />
          <NavButton
            onPress={() => navigation.navigate("BankHub")}
            iconName="shield-checkmark-outline"
            iconColor="#FFD700"
            text="Bank"
          />
          <NavButton
            onPress={() => navigation.navigate("StaffCenter")} // <-- THE NEW BUTTON
            iconName="people-outline"
            iconColor="#DA70D6" // A new color for Staff
            text="Staff"
          />
        </View>
      </SafeAreaView>
    </View>
  );
};

// --- This is the complete stylesheet ---
const styles = StyleSheet.create({
  container: { flex: 1 },
  background: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: "100%",
  },
  xpProgressBorderContainer: {
    height: 5,
    width: "100%",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  xpProgressBorderFill: {
    height: "100%",
    backgroundColor: "#4dffc3",
    borderRadius: 2,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  moneyContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  coinIcon: { width: 25, height: 25, marginRight: 8 },
  moneyText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "monospace",
  },
  levelContainer: {
    width: 70,
    height: 70,
    alignItems: "center",
    justifyContent: "center",
  },
  levelTextContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  levelTextLabel: { color: "#aaa", fontSize: 12, fontWeight: "bold" },
  levelTextNumber: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    lineHeight: 24,
  },
  mainContent: { flex: 1 },
  emptyDashboard: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyDashboardText: {
    fontSize: 18,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 20,
  },
  marketButton: {
    backgroundColor: "#FFD700",
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 30,
    elevation: 8,
  },
  marketButtonText: { color: "black", fontSize: 22, fontWeight: "bold" },
  card: {
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  cardBanner: {
    position: "absolute",
    top: -1,
    right: 15,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  forSaleBanner: { backgroundColor: "#e63946" },
  constructionBanner: { backgroundColor: "#ffae42" },
  cardBannerText: { color: "#fff", fontWeight: "bold", fontSize: 12 },
  cardTitle: { color: "#fff", fontSize: 22, fontWeight: "bold" },
  cardSubtitle: { color: "#ccc", fontSize: 16, marginTop: 10 },
  cardValue: {
    color: "#43e97b",
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 4,
  },
  progressContainer: { marginTop: 15 },
  progressText: {
    color: "#ffae42",
    fontSize: 14,
    alignSelf: "flex-end",
    marginBottom: 4,
  },
  progressBar: {
    height: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 6,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#ffae42",
    borderRadius: 6,
  },
  dealHeaderText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFD700",
    marginBottom: 15,
    textAlign: "center",
  },
  dealCard: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
    width: "100%",
    padding: 20,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  dealImage: { width: "100%", height: 150, borderRadius: 15, marginBottom: 15 },
  dealInfo: { alignItems: "center" },
  dealName: { fontSize: 24, color: "#fff", fontWeight: "bold" },
  dealSubtitle: { fontSize: 16, color: "#ccc", marginTop: 4 },
  dealPrice: {
    fontSize: 20,
    color: "#43e97b",
    fontWeight: "bold",
    marginTop: 10,
  },
  bottomNavBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-start",
    paddingTop: 10,
    paddingBottom: 20,
  },
  navButton: { alignItems: "center", width: 80 },
  navIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    marginBottom: 5,
    borderWidth: 2,
  },
  navButtonText: { color: "#fff", fontSize: 12, fontWeight: "600" },
});

export default HomePage;
