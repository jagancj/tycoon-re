import React, { createContext, useState, useEffect } from "react";
import { PROPERTY_LIST } from "./data/properties";
import { LAND_PLOT_LIST } from "./data/landPlots";
import { BLUEPRINT_LIST } from "./data/buildingBlueprints";
import { Alert } from "react-native";
import { STAFF_LIST } from "./data/staffMembers";

export const GameContext = createContext();
const GAME_DAY_IN_MS = 15000;
const RENOVATION_CHECK_INTERVAL_MS = 1000;
const RENOVATION_TIME_MS = 30000;
const OFFER_GENERATION_INTERVAL_MS = 10000;
const PROFIT_XP_MODIFIER = 4;
const UPDATE_INTERVAL_MS = 1000; // For construction and renovation updates
const LEVEL_UP_THRESHOLDS = [
  0, // Level 1
  100, // Level 2
  250, // Level 3
  500, // Level 4
  1000, // Level 5
  1600, // Level 6
  2300, // Level 7
  3100, // Level 8
  4000, // Level 9
  5000, // Level 10
  6150, // Level 11
  7450, // Level 12
  8900, // Level 13
  10500, // Level 14
  12250, // Level 15
  14150, // Level 16
  16200, // Level 17
  18400, // Level 18
  20750, // Level 19
  23250, // Level 20
  25950, // Level 21
  28800, // Level 22
  31800, // Level 23
  34950, // Level 24
  38250, // Level 25
  41750, // Level 26
  45450, // Level 27
  49350, // Level 28
  53450, // Level 29
  57750, // Level 30
  62250, // Level 31
  66950, // Level 32
  71850, // Level 33
  76950, // Level 34
  82250, // Level 35
  87750, // Level 36
  93450, // Level 37
  99350, // Level 38
  105450, // Level 39
  111750, // Level 40
  118250, // Level 41
  124950, // Level 42
  131850, // Level 43
  138950, // Level 44
  146250, // Level 45
  153750, // Level 46
  161450, // Level 47
  169350, // Level 48
  177450, // Level 49
  185750, // Level 50
  194250, // Level 51
  202950, // Level 52
  211850, // Level 53
  220950, // Level 54
  230250, // Level 55
  239750, // Level 56
  249450, // Level 57
  259350, // Level 58
  269450, // Level 59
  279750, // Level 60
  290250, // Level 61
  300950, // Level 62
  311850, // Level 63
  322950, // Level 64
  334250, // Level 65
  345750, // Level 66
  357450, // Level 67
  369350, // Level 68
  381450, // Level 69
  393750, // Level 70
  406250, // Level 71
  418950, // Level 72
  431850, // Level 73
  444950, // Level 74
  458250, // Level 75
  471750, // Level 76
  485450, // Level 77
  499350, // Level 78
  513450, // Level 79
  527750, // Level 80
  542250, // Level 81
  556950, // Level 82
  571850, // Level 83
  586950, // Level 84
  602250, // Level 85
  617750, // Level 86
  633450, // Level 87
  649350, // Level 88
  665450, // Level 89
  681750, // Level 90
  698250, // Level 91
  714950, // Level 92
  731850, // Level 93
  748950, // Level 94
  766250, // Level 95
  783750, // Level 96
  801450, // Level 97
  819350, // Level 98
  837450, // Level 99
  855750, // Level 100
];
export const GameProvider = ({ children }) => {
  const [gameMoney, setGameMoney] = useState(500000); // Increased starting money for testing
  const [playerLevel, setPlayerLevel] = useState(1);
  const [playerXp, setPlayerXp] = useState(0);

  // --- FEATURE-SPECIFIC STATE ---
  const [playerAssets, setPlayerAssets] = useState([]);
  const [activeLoans, setActiveLoans] = useState([]); // <--- FIX: Re-added the missing state
  const [offers, setOffers] = useState({});
  const [constructionProjects, setConstructionProjects] = useState({});
  const [agentReports, setAgentReports] = useState({});
  const [renovationProjects, setRenovationProjects] = useState({});
  const [transactionLog, setTransactionLog] = useState([]);
  const [soldPropertiesLog, setSoldPropertiesLog] = useState([]);
  const [achievements, setAchievements] = useState({
    boughtFirstProperty: false,
    firstRenovation: false,
    firstProfit: false,
    gotFirstLoan: false,
  });
  const [staff, setStaff] = useState({
    hired: [],
    availableToHire: STAFF_LIST,
  });
  // --- DERIVED STATE ---
  // Loan Auto-Debit Loop
  useEffect(() => {
    const loanInterval = setInterval(() => {
      const activeLoanTypes = Object.keys(activeLoans);
      if (activeLoanTypes.length === 0) return;
      let totalEmi = 0;
      activeLoanTypes.forEach((type) => {
        totalEmi += activeLoans[type].emi;
      });
      if (gameMoney >= totalEmi)
        setGameMoney((prevMoney) => prevMoney - totalEmi);
    }, GAME_DAY_IN_MS);
    return () => clearInterval(loanInterval);
  }, [activeLoans, gameMoney]);
  useEffect(() => {
    const offerInterval = setInterval(() => {
      const propertiesForSale = playerAssets.filter(
        (asset) => asset.status === "For Sale"
      );
      if (propertiesForSale.length === 0) return;

      const newOffers = { ...offers };

      propertiesForSale.forEach((asset) => {
        // --- NEW REALISTIC OFFER LOGIC ---

        // 1. Calculate a "true value" based on the property's condition and the area average.
        const trueValue =
          asset.marketValue * 0.7 + asset.areaAverageValue * 0.3;

        // 2. Determine if the player's asking price is a good deal for the AI buyer.
        // A dealFactor > 1 means the asking price is good value. < 1 means it's overpriced.
        // We'll clamp it to avoid extreme offers.
        let dealFactor = trueValue / asset.askingPrice;
        dealFactor = Math.max(0.7, Math.min(1.2, dealFactor)); // Clamp between 70% and 120%

        // 3. The AI's offer is based on the asking price, adjusted by how good the deal is.
        const offerBase = asset.askingPrice * dealFactor;

        // 4. Add a small amount of randomness to the final offer.
        const finalOfferAmount = Math.round(
          offerBase * (0.95 + Math.random() * 0.08)
        ); // 95% to 103% of the adjusted price

        const newOffer = {
          id: `OFFER_${new Date().getTime()}`,
          amount: finalOfferAmount,
        };

        if (!newOffers[asset.id]) newOffers[asset.id] = [];
        newOffers[asset.id].unshift(newOffer);
        newOffers[asset.id] = newOffers[asset.id].slice(0, 5);
      });
      setOffers(newOffers);
    }, OFFER_GENERATION_INTERVAL_MS);

    return () => clearInterval(offerInterval);
  }, [playerAssets, offers]);

  useEffect(() => {
    const renovationInterval = setInterval(() => {
      setPlayerAssets((prevAssets) => {
        let assetsUpdated = false;
        const updatedAssets = prevAssets.map((asset) => {
          if (asset.status === "Renovating") {
            assetsUpdated = true;
            const newProgress =
              asset.renovationProgress +
              (RENOVATION_CHECK_INTERVAL_MS / RENOVATION_TIME_MS) * 100;
            if (newProgress >= 100) {
              return {
                ...asset,
                status: "Owned",
                renovationProgress: 100,
                marketValue:
                  asset.marketValue + asset.renovationData.valueIncrease,
                invested: asset.invested + asset.renovationData.cost,
              };
            }
            return { ...asset, renovationProgress: newProgress };
          }
          return asset;
        });
        return assetsUpdated ? updatedAssets : prevAssets;
      });
    }, RENOVATION_CHECK_INTERVAL_MS);
    return () => clearInterval(renovationInterval);
  }, []);
  useEffect(() => {
    const progressInterval = setInterval(() => {
      // Update Construction Projects
      setConstructionProjects((prev) => {
        const { updatedProjects, needsUpdate } = updateConstructionProgress(
          prev,
          staff.hired
        );
        return needsUpdate ? updatedProjects : prev;
      });
      // Update Renovation Projects
      setRenovationProjects((prev) => {
        const { updatedProjects, needsUpdate, completedProjects } =
          updateRenovationProgress(prev, staff.hired);
        if (completedProjects.length > 0) {
          handleCompletedRenovations(completedProjects);
        }
        return needsUpdate ? updatedProjects : prev;
      });
    }, UPDATE_INTERVAL_MS);
    return () => clearInterval(progressInterval);
  }, [staff.hired]); // Dependency ensures this logic uses the latest staff data

  // NEW useEffect for paying salaries
  useEffect(() => {
    const salaryInterval = setInterval(() => {
      if (staff.hired.length > 0) {
        const totalSalary = staff.hired.reduce(
          (sum, member) => sum + member.salaryPerDay,
          0
        );
        setGameMoney((prev) => prev - totalSalary);
      }
    }, GAME_DAY_IN_MS);
    return () => clearInterval(salaryInterval);
  }, [staff.hired]);
  useEffect(() => {
    const salaryInterval = setInterval(() => {
      if (staff.hired.length > 0) {
        const totalSalary = staff.hired.reduce(
          (sum, member) => sum + member.salaryPerDay,
          0
        );
        setGameMoney((prev) => prev - totalSalary);
        console.log(`Paid $${totalSalary} in salaries.`);
      }
    }, GAME_DAY_IN_MS); // Using the same game day timer as loans
    return () => clearInterval(salaryInterval);
  }, [staff.hired]);
 const logTransaction = (description, amount, category) => {
    const newTransaction = {
      id: `TXN_${new Date().getTime()}`,
      date: Date.now(),
      description,
      amount, // Use negative for expenses, positive for income
      category,
    };
    setTransactionLog(prev => [newTransaction, ...prev]);
  };
  // --- NEW STAFF FUNCTIONS ---
  const hireStaff = (staffMember) => {
    if (gameMoney < staffMember.hireCost) {
      Alert.alert(
        "Cannot Hire",
        "You don't have enough money to pay the hiring fee."
      );
      return;
    }
    setGameMoney((prev) => prev - staffMember.hireCost);
    logTransaction(`Hiring fee for ${staffMember.name}`, -cost, 'Staff');
    // Add to hired list and give them a status
    setStaff((prev) => ({
      ...prev,
      hired: [
        ...prev.hired,
        { ...staffMember, status: "Idle", assignedProjectId: null },
      ],
      availableToHire: prev.availableToHire.filter(
        (s) => s.id !== staffMember.id
      ),
    }));
  };
  const hireAgent = (propertyId, fee) => {
    setGameMoney((prev) => prev - fee);
    const propData = PROPERTY_LIST.find((p) => p.id === propertyId);
    setAgentReports((prev) => ({
      ...prev,
      [propertyId]: {
        hiddenDamage: propData.hiddenDamageCost,
        areaAverage: propData.areaAverageValue,
      },
    }));
  };

  const buyProperty = (property, price) => {
    const feePercentage = 0.02 + Math.random() * 0.03; // Random float between 0.02 and 0.05
    const acquisitionFee = Math.round(price * feePercentage);
    const totalCost = price + acquisitionFee;
    if (gameMoney < totalCost) {
      // Alert.alert("Transaction Failed", `You do not have enough funds. You need $${totalCost.toLocaleString()} (including a $${acquisitionFee.toLocaleString()} acquisition fee).`);
      return false;
    }

    setGameMoney((prev) => prev - totalCost);
    logTransaction(`Purchase: ${property.name}`, -price, 'Property Purchase');
    logTransaction(`Acquisition Fee`, -acquisitionFee, 'Fees & Taxes');
    const newAsset = {
      ...property,
      id: `${property.id}_${new Date().getTime()}`,
      purchasePrice: price,
      acquisitionFee: acquisitionFee, // Store the fee for records
      purchaseTimestamp: Date.now(),
      marketValue: property.baseValue,
      status: "Owned",
      renovationProgress: 0,
      invested: price,
      installedAddOns: [],
      renovationData: {
        cost:
          (property.renovationCost.total || 0) +
          (property.hiddenDamageCost || 0),
        valueIncrease: property.valueIncreaseAfterReno || 0,
      },
    };
    setPlayerAssets((prev) => [...prev, newAsset]);
    // Alert.alert("Purchase Successful!", `${property.name} acquired for $${price.toLocaleString()}.\nAcquisition Fee: $${acquisitionFee.toLocaleString()}`);
    triggerAchievement("firstRenovation", 50);
    return true;
  };
  useEffect(() => {
    const constructionInterval = setInterval(() => {
      let projectsUpdated = false;
      const updatedProjects = { ...constructionProjects };

      for (const projectId in updatedProjects) {
        const project = updatedProjects[projectId];
        if (project.status === "In Progress") {
          projectsUpdated = true;
          let totalEfficiency = project.assignedStaff.reduce(
            (total, staffId) => {
              const staffMember = staff.hired.find((s) => s.id === staffId);
              return total + (staffMember?.efficiencyModifier || 1.0);
            },
            0
          );
          if (totalEfficiency === 0) totalEfficiency = 1;
          const progressToAdd =
            (100 / project.currentPhase.duration) * totalEfficiency;
          project.progress = Math.min(100, project.progress + progressToAdd);

          const newProgress =
            project.progress + 100 / project.currentPhase.duration;

          if (newProgress >= 100) {
            // Phase Complete!
            project.status = "Phase Complete";
            project.progress = 100;
          } else {
            project.progress = newProgress;
          }
        }
      }

      if (projectsUpdated) {
        setConstructionProjects(updatedProjects);
      }
    }, 1000); // Check every second

    return () => clearInterval(constructionInterval);
  }, [constructionProjects]);
  const takeLoan = (loanDetails) => {
    setGameMoney((prevMoney) => prevMoney + loanDetails.amount);
    setActiveLoans((prevLoans) => ({
      ...prevLoans,
      [loanDetails.type]: {
        ...loanDetails,
        id: `LOAN_${Date.now()}`,
        outstandingPrincipal: loanDetails.amount,
      },
    }));
    if (loanDetails.type === 'Mortgage' && loanDetails.assetId) {
        setPlayerAssets(prev => prev.map(asset => 
            asset.id === loanDetails.assetId ? { ...asset, isMortgaged: true } : asset
        ));
    }
    triggerAchievement("gotFirstLoan", 25);
  };

  // In GameContext.js

 // In GameContext.js
const preCloseLoan = (loanToClose) => {
    if (!loanToClose) return false;
    const feePercentage = 0.02 + Math.random() * 0.03;
    const fee = Math.round(loanToClose.outstandingPrincipal * feePercentage);
    const totalPayoff = loanToClose.outstandingPrincipal + fee;

    // Confirmation Alert Logic...
    Alert.alert("Confirm Pre-Closure", `Total Cost: $${totalPayoff.toLocaleString()}`, [
        { text: "Cancel" },
        { text: "Confirm Payment", onPress: () => {
            if (gameMoney < totalPayoff) { /*... alert insufficient funds ...*/ return; }

            setGameMoney(prevMoney => prevMoney - totalPayoff);
            logTransaction(`Loan Payoff: ${loanToClose.type}`, -totalPayoff, 'Loan');

            // Remove the loan from the array
            setActiveLoans(prev => prev.filter(loan => loan.id !== loanToClose.id));

            // If it was a mortgage, un-mark the property
            if (loanToClose.type === 'Mortgage' && loanToClose.assetId) {
                setPlayerAssets(prev => prev.map(asset => 
                    asset.id === loanToClose.assetId ? { ...asset, isMortgaged: false } : asset
                ));
            }
            Alert.alert("Loan Closed!", "You have paid off the loan.");
        }}
    ]);
};
  const buyLand = (landPlot, price) => {
    const feePercentage = 0.02 + Math.random() * 0.03;
    const acquisitionFee = Math.round(price * feePercentage);
    const totalCost = price + acquisitionFee;
    if (gameMoney < totalCost) {
      // Alert.alert("Transaction Failed", `You need $${totalCost.toLocaleString()} (including a $${acquisitionFee.toLocaleString()} acquisition fee).`);
      return false;
    }
    setGameMoney((prev) => prev - totalCost);
    const newLandAsset = {
      ...landPlot,
      assetType: "Land", // Differentiate from 'Property'
      id: `${landPlot.id}_${new Date().getTime()}`,
      purchasePrice: price,
      acquisitionFee: acquisitionFee,
      purchaseTimestamp: Date.now(),
      status: "Owned",
    };
    setPlayerAssets((prev) => [...prev, newLandAsset]);
    // Alert.alert("Land Acquired!", `${landPlot.name} purchased for $${price.toLocaleString()}.\nAcquisition Fee: $${acquisitionFee.toLocaleString()}`);
    triggerAchievement("boughtFirstProperty", 50); // You can reuse achievements
    return true;
  };

  // In GameContext.js

  const startConstruction = (landAsset, blueprint) => {
    const supervisor = staff.hired.find(
      (s) => s.role === "Construction" && s.status === "Idle"
    );
    if (!supervisor) {
      Alert.alert(
        "No Supervisor Available",
        "Hire a Construction Supervisor or wait for one to finish their current project."
      );
      return false;
    }
    const initialPhase = blueprint.phases[0];
    if (gameMoney < initialPhase.cost) {
      Alert.alert(
        "Insufficient Funds",
        `You need $${initialPhase.cost.toLocaleString()} for the first phase.`
      );
      return false;
    }
    setGameMoney((prev) => prev - initialPhase.cost);
    setStaff((prev) => ({
      ...prev,
      hired: prev.hired.map((s) =>
        s.id === supervisor.id
          ? { ...s, status: "On Project", assignedProjectId: landAsset.id }
          : s
      ),
    }));
    setConstructionProjects((prev) => ({
      ...prev,
      [landAsset.id]: {
        blueprintId: blueprint.id,
        currentPhaseIndex: 0,
        currentPhase: initialPhase,
        status: "In Progress",
        progress: 0,
        assignedStaff: [supervisor.id],
      },
    }));
    setPlayerAssets((prev) =>
      prev.map((asset) =>
        asset.id === landAsset.id
          ? { ...asset, status: "Under Construction" }
          : asset
      )
    );
    triggerAchievement("firstRenovation", 50);
    return true;
  };
  const handleCompletedRenovations = (completedProjectIds) => {
    let finalAssets = [...playerAssets];
    let finalStaff = [...staff.hired];

    completedProjectIds.forEach((projectId) => {
      const project = renovationProjects[projectId];
      const asset = finalAssets.find((a) => a.id === projectId);
      if (asset) {
        const valueIncrease = asset.renovationData?.valueIncrease || 0;
        const cost = asset.renovationData?.cost || 0;
        finalAssets = finalAssets.map((a) =>
          a.id === projectId
            ? {
                ...a,
                status: "Owned",
                marketValue: a.marketValue + valueIncrease,
                invested: (a.invested || a.purchasePrice) + cost,
                renovationProgress: 100,
              }
            : a
        );
      }
      finalStaff = finalStaff.map((s) =>
        project.assignedStaff.includes(s.id)
          ? { ...s, status: "Idle", assignedProjectId: null }
          : s
      );
    });

    setPlayerAssets(finalAssets);
    setStaff((prev) => ({ ...prev, hired: finalStaff }));

    const finalProjects = { ...renovationProjects };
    completedProjectIds.forEach((id) => delete finalProjects[id]);
    setRenovationProjects(finalProjects);
  };
  const advanceConstructionPhase = (projectId) => {
    const project = constructionProjects[projectId];
    if (!project) return;
    const blueprint = BLUEPRINT_LIST.find((b) => b.id === project.blueprintId);
    const nextPhaseIndex = project.currentPhaseIndex + 1;
    if (nextPhaseIndex < blueprint.phases.length) {
      const nextPhase = blueprint.phases[nextPhaseIndex];
      if (gameMoney < nextPhase.cost) {
        Alert.alert(`Not enough money for ${nextPhase.name}!`);
        return;
      }
      setGameMoney((prev) => prev - nextPhase.cost);
      logTransaction(`Phase Cost: ${nextPhase.name}`, -nextPhase.cost, 'Construction');

      setConstructionProjects((prev) => ({
        ...prev,
        [projectId]: {
          ...prev[projectId],
          currentPhaseIndex: nextPhaseIndex,
          currentPhase: nextPhase,
          status: "In Progress",
          progress: 0,
        },
      }));
    } else {
      const landAsset = playerAssets.find((a) => a.id === projectId);
      const totalInvestment = blueprint.phases.reduce(
        (sum, phase) => sum + phase.cost,
        landAsset.purchasePrice
      );
      const newProperty = {
        id: `${blueprint.id}_${new Date().getTime()}`,
        assetType: "Property",
        name: blueprint.name,
        type: blueprint.type,
        baseValue: blueprint.finalValue,
        askingPrice: Math.round(blueprint.finalValue * 1.15),
        marketValue: blueprint.finalValue,
        purchasePrice: totalInvestment,
        invested: totalInvestment,
        status: "Owned",
        renovationProgress: 100,
        installedAddOns: [],
        availableAddOns: blueprint.potentialAddOns || [],
      };
      setPlayerAssets((prev) => [
        ...prev.filter((a) => a.id !== projectId),
        newProperty,
      ]);
      const updatedProjects = { ...constructionProjects };
      delete updatedProjects[projectId];
      setConstructionProjects(updatedProjects);
      setStaff((prev) => ({
        ...prev,
        hired: prev.hired.map((s) =>
          project.assignedStaff.includes(s.id)
            ? { ...s, status: "Idle", assignedProjectId: null }
            : s
        ),
      }));
      addXp(blueprint.xpReward);
      logTransaction(`New Build: ${newProperty.name}`, 0, 'Construction'); // Log completion

      Alert.alert(
        "Construction Complete!",
        `${newProperty.name} has been added to your portfolio!`
      );
    }
  };
  // ADD the new function to list with a price
  const listPropertyWithPrice = (assetId, askingPrice) => {
    const asset = playerAssets.find(a => a.id === assetId);

    if (asset?.isMortgaged) {
      Alert.alert("Action Blocked", "You must pay off the mortgage on this specific property before you can list it for sale.");
      return;
    }
    setPlayerAssets((prev) =>
      prev.map((a) =>
        a.id === assetId
          ? { ...a, status: "For Sale", askingPrice: askingPrice }
          : a
      )
    );
  };
  // In GameContext.js

  const startRenovation = (asset) => {
    // FIX: Directly use the 'total' property from your new data structure.
    const totalRenovationCost = asset.renovationData?.cost?.total || 0;

    const manager = staff.hired.find(
      (s) => s.role === "Renovation" && s.status === "Idle"
    );
    if (!manager) {
      Alert.alert(
        "No Renovation Manager Available",
        "You must hire a Renovation Manager to start this project."
      );
      return false;
    }

    if (gameMoney < totalRenovationCost) {
      Alert.alert(
        "Not Enough Funds",
        `You need $${totalRenovationCost.toLocaleString()} to renovate.`
      );
      return false;
    }

    setGameMoney((prev) => prev - totalRenovationCost);
    logTransaction(`Renovation: ${asset.name}`, -totalRenovationCost, 'Renovation');

    setStaff((prev) => ({
      ...prev,
      hired: prev.hired.map((s) =>
        s.id === manager.id
          ? { ...s, status: "On Project", assignedProjectId: asset.id }
          : s
      ),
    }));
    setRenovationProjects((prev) => ({
      ...prev,
      [asset.id]: { progress: 0, assignedStaff: [manager.id] },
    }));
    setPlayerAssets((prev) =>
      prev.map((a) => (a.id === asset.id ? { ...a, status: "Renovating" } : a))
    );
    triggerAchievement("firstRenovation", 50);
    return true;
  };

  // --- XP & LEVEL-UP LOGIC ---
  const xpForNextLevel = LEVEL_UP_THRESHOLDS[playerLevel];

  const addXp = (amount) => {
    const finalXpAmount = Math.round(amount * Math.max(1, playerLevel / 2));
    let newXp = playerXp + amount;
    let newLevel = playerLevel;
    let xpThreshold = LEVEL_UP_THRESHOLDS[newLevel];

    // Check for level-ups, including multiple level-ups from a large XP gain
    while (newXp >= xpThreshold) {
      newXp -= xpThreshold;
      newLevel++;
      xpThreshold = LEVEL_UP_THRESHOLDS[newLevel];
      console.log(`DING! Player reached Level ${newLevel}!`);
    }

    setPlayerXp(newXp);
    setPlayerLevel(newLevel);
  };

  const triggerAchievement = (achievementName, xpBonus) => {
    if (!achievements[achievementName]) {
      console.log(`ACHIEVEMENT UNLOCKED: ${achievementName}! +${xpBonus} XP`);
      addXp(xpBonus);
      setAchievements((prev) => ({ ...prev, [achievementName]: true }));
    }
  };
 const acceptOffer = (assetId, offerAmount) => {
    const assetToSell = playerAssets.find(a => a.id === assetId);
    if (!assetToSell) return;

    const totalInvestment = assetToSell.invested || assetToSell.purchasePrice;
    const profit = offerAmount - totalInvestment;

    // FIX: Declare and initialize taxToPay to 0 before the conditional block.
    let taxToPay = 0;
    let taxRate = 0;

    if (profit > 0) {
        // Determine holding period in "game days"
        const holdingDurationDays = (Date.now() - (assetToSell.purchaseTimestamp || 0)) / GAME_DAY_IN_MS;
        
        // Apply different tax rates
        taxRate = holdingDurationDays < 10 ? 0.30 : 0.15; // 30% for short-term, 15% for long-term
        
        // Now we just assign a new value, we don't declare it again.
        taxToPay = Math.round(profit * taxRate);
        
        // Grant XP based on profit percentage
        const profitPercentage = (profit / totalInvestment) * 100;
        const profitXp = Math.round(profitPercentage * PROFIT_XP_MODIFIER);
        addXp(profitXp);
        triggerAchievement('firstProfit', 150);
    }
    
    // This line is now safe because taxToPay always has a value (0 or more).
    const netPayout = offerAmount - taxToPay;
    setGameMoney(prev => prev + netPayout);
    
    logTransaction(`Sale: ${assetToSell.name}`, offerAmount, 'Property Sale');
    if (taxToPay > 0) {
      logTransaction(`Capital Gains Tax`, -taxToPay, 'Fees & Taxes');
    }

    // Log the sale for the Property Ledger
    const saleRecord = {
      id: assetToSell.id,
      name: assetToSell.name,
      purchasePrice: assetToSell.purchasePrice,
      totalInvestment: totalInvestment,
      salePrice: offerAmount,
      profit: profit,
    };
    setSoldPropertiesLog(prev => [saleRecord, ...prev]);

    // Remove the asset from the player's portfolio
    setPlayerAssets(prev => prev.filter(a => a.id !== assetId));
    
    // Clear any outstanding offers for this property
    const newOffers = {...offers};
    delete newOffers[assetId];
    setOffers(newOffers);
  };

  const installAddOn = (assetId, addOn) => {
    const asset = playerAssets.find((a) => a.id === assetId);
    if (!asset || gameMoney < addOn.cost) return false;
    setGameMoney((prev) => prev - addOn.cost);
    setPlayerAssets((prev) =>
      prev.map((a) => {
        if (a.id === assetId) {
          return {
            ...a,
            marketValue: a.marketValue + addOn.valueIncrease,
            invested: (a.invested || 0) + addOn.cost,
            installedAddOns: [...(a.installedAddOns || []), addOn.id],
          };
        }
        return a;
      })
    );
    return true;
  };

  const value = {
    gameMoney,
    playerLevel,
    playerAssets,
    offers,
    agentReports,
    buyProperty,
    startRenovation,
    listPropertyWithPrice,
    acceptOffer,
    installAddOn,
    hireAgent,
    playerXp,
    xpForNextLevel,
    buyLand,
    startConstruction,
    advanceConstructionPhase,
    constructionProjects,
    activeLoans,
    takeLoan,
    preCloseLoan,
    staff,
    hireStaff,
  };
  const updateConstructionProgress = (currentProjects, hiredStaff) => {
    let needsUpdate = false;
    const updatedProjects = { ...currentProjects };

    for (const projectId in updatedProjects) {
      const project = updatedProjects[projectId];
      if (project.status === "In Progress") {
        needsUpdate = true;

        // Calculate total efficiency from all staff assigned to this project
        let totalEfficiency = project.assignedStaff.reduce((total, staffId) => {
          const staffMember = hiredStaff.find((s) => s.id === staffId);
          return total + (staffMember?.efficiencyModifier || 1.0);
        }, 0);
        if (totalEfficiency === 0) totalEfficiency = 1; // Failsafe in case no staff found

        // Calculate progress to add this second, boosted by efficiency
        const progressToAdd =
          (100 / project.currentPhase.duration) * totalEfficiency;
        project.progress = Math.min(100, project.progress + progressToAdd);

        // Check if the phase is complete
        if (project.progress >= 100) {
          project.status = "Phase Complete";
        }
      }
    }
    return { updatedProjects, needsUpdate };
  };

  const updateRenovationProgress = (currentProjects, hiredStaff) => {
    let needsUpdate = false;
    const completedProjects = [];
    const updatedProjects = { ...currentProjects };

    for (const projectId in updatedProjects) {
      const project = updatedProjects[projectId];
      needsUpdate = true;

      // Calculate total efficiency from all staff assigned to this project
      let totalEfficiency = project.assignedStaff.reduce((total, staffId) => {
        const staffMember = hiredStaff.find((s) => s.id === staffId);
        return total + (staffMember?.efficiencyModifier || 1.0);
      }, 0);
      if (totalEfficiency === 0) totalEfficiency = 1;

      // Calculate progress to add this second, boosted by efficiency
      const progressToAdd =
        (100 / (RENOVATION_TIME_MS / 1000)) * totalEfficiency;
      project.progress = Math.min(100, project.progress + progressToAdd);

      // If renovation is complete, add it to a list to be processed
      if (project.progress >= 100) {
        completedProjects.push(projectId);
      }
    }
    return { updatedProjects, needsUpdate, completedProjects };
  };
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};
