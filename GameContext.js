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
  const [activeLoans, setActiveLoans] = useState({}); // <--- FIX: Re-added the missing state
  const [offers, setOffers] = useState({});
  const [constructionProjects, setConstructionProjects] = useState({});
  const [agentReports, setAgentReports] = useState({});
  const [achievements, setAchievements] = useState({
    boughtFirstProperty: false,
    firstRenovation: false,
    firstProfit: false,
    gotFirstLoan: false,
  });
const [staff, setStaff] = useState({ hired: [], availableToHire: STAFF_LIST });
  // --- DERIVED STATE ---
  // Loan Auto-Debit Loop
  useEffect(() => {
    const loanInterval = setInterval(() => {
      const activeLoanTypes = Object.keys(activeLoans);
      if (activeLoanTypes.length === 0) return;
      let totalEmi = 0;
      activeLoanTypes.forEach(type => { totalEmi += activeLoans[type].emi; });
      if (gameMoney >= totalEmi) setGameMoney(prevMoney => prevMoney - totalEmi);
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
        // Offers are now based on the PLAYER'S asking price, not the market value.
        // Generates offers between 85% and 105% of the asking price.
        // A high asking price might still get lowball offers.
        const offerAmount = Math.round(
          asset.askingPrice * (0.85 + Math.random() * 0.2)
        );
        const newOffer = {
          id: `OFFER_${new Date().getTime()}`,
          amount: offerAmount,
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
    const salaryInterval = setInterval(() => {
      if (staff.hired.length > 0) {
        const totalSalary = staff.hired.reduce((sum, member) => sum + member.salaryPerDay, 0);
        setGameMoney(prev => prev - totalSalary);
        console.log(`Paid $${totalSalary} in salaries.`);
      }
    }, GAME_DAY_IN_MS); // Using the same game day timer as loans
    return () => clearInterval(salaryInterval);
  }, [staff.hired]);

  // --- NEW STAFF FUNCTIONS ---
  const hireStaff = (staffMember) => {
    if (gameMoney < staffMember.hireCost) {
      Alert.alert("Cannot Hire", "You don't have enough money to pay the hiring fee.");
      return;
    }
    setGameMoney(prev => prev - staffMember.hireCost);
    // Add to hired list and give them a status
    setStaff(prev => ({
      ...prev,
      hired: [...prev.hired, { ...staffMember, status: 'Idle', assignedProjectId: null }],
      availableToHire: prev.availableToHire.filter(s => s.id !== staffMember.id)
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
    if (gameMoney < price) return false;
    setGameMoney((prev) => prev - price);
    const newAsset = {
      ...property,
      id: `${property.id}_${new Date().getTime()}`,
      purchasePrice: price,
      marketValue: property.baseValue,
      status: "Owned",
      renovationProgress: 0,
      invested: price,
      installedAddOns: [],
      renovationData: {
        cost: (property.renovationCost || 0) + (property.hiddenDamageCost || 0),
        valueIncrease: property.valueIncreaseAfterReno || 0,
      },
    };
    setPlayerAssets((prev) => [...prev, newAsset]);
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
          let totalEfficiency = project.assignedStaff.reduce((total, staffId) => {
                const staffMember = staff.hired.find(s => s.id === staffId);
                return total + (staffMember?.efficiencyModifier || 1.0);
            }, 0);
            if (totalEfficiency === 0) totalEfficiency = 1;
          const progressToAdd = (100 / project.currentPhase.duration) * totalEfficiency;
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
    setGameMoney(prevMoney => prevMoney + loanDetails.amount);
    setActiveLoans(prevLoans => ({
      ...prevLoans,
      [loanDetails.type]: { ...loanDetails, outstandingPrincipal: loanDetails.amount }
    }));
    triggerAchievement('gotFirstLoan', 25);
  };

  const preCloseLoan = (loanType) => {
    const loanToClose = activeLoans[loanType];
    if (!loanToClose) return false;
    const fee = loanToClose.outstandingPrincipal * PRE_CLOSURE_FEE_RATE;
    const totalPayoff = loanToClose.outstandingPrincipal + fee;
    if (gameMoney < totalPayoff) {
      Alert.alert(`Insufficient Funds! You need $${Math.round(totalPayoff).toLocaleString()} to close this loan.`);
      return false;
    }
    setGameMoney(prevMoney => prevMoney - totalPayoff);
    const updatedLoans = { ...activeLoans };
    delete updatedLoans[loanType];
    setActiveLoans(updatedLoans);
    Alert.alert(`Loan Closed!`, `$${Math.round(totalPayoff).toLocaleString()} paid.`);
    return true;
  };
const buyLand = (landPlot, price) => {
    if (gameMoney < price) return false;
    setGameMoney(prev => prev - price);
    const newLandAsset = {
      ...landPlot,
      assetType: 'Land', // Differentiate from 'Property'
      id: `${landPlot.id}_${new Date().getTime()}`,
      purchasePrice: price,
      status: 'Owned',
    };
    setPlayerAssets(prev => [...prev, newLandAsset]);
    triggerAchievement('boughtFirstProperty', 50); // You can reuse achievements
    return true;
  };

 // In GameContext.js

  const startConstruction = (landAsset, blueprint) => {
    const availableSupervisor = staff.hired.find(s => s.role === 'Construction' && s.status === 'Idle');

    if (!availableSupervisor) {
      Alert.alert("No Supervisor Available", "You must hire a Construction Supervisor, or wait for one to finish their current project.");
      return false;
    }

    const initialPhase = blueprint.phases[0];
    if (gameMoney < initialPhase.cost) {
      Alert.alert("Not Enough Funds", `You need $${initialPhase.cost.toLocaleString()} for the first phase: ${initialPhase.name}.`);
      return false; // Return false to indicate failure
    }

    setGameMoney(prev => prev - initialPhase.cost);
    setStaff(prev => ({
      ...prev,
      hired: prev.hired.map(s => s.id === availableSupervisor.id ? { ...s, status: 'On Project', assignedProjectId: landAsset.id } : s)
    }));
    
    const projectId = landAsset.id;
    setConstructionProjects(prev => ({
      ...prev,
      [projectId]: {
        blueprintId: blueprint.id,
        currentPhaseIndex: 0,
        currentPhase: initialPhase, // FIX: Add the current phase object to the project state
        status: 'In Progress',
        progress: 0,
        assignedStaff: [availableSupervisor.id],
      }
    }));

    setPlayerAssets(prev => prev.map(asset => 
      asset.id === landAsset.id ? { ...asset, status: 'Under Construction' } : asset
    ));
    triggerAchievement('firstRenovation', 50);
    return true; // Return true to indicate success
  };

  const advanceConstructionPhase = (projectId) => {
    const project = constructionProjects[projectId];
    if (!project) return;

    const blueprint = BLUEPRINT_LIST.find(b => b.id === project.blueprintId);
    const nextPhaseIndex = project.currentPhaseIndex + 1;

    if (nextPhaseIndex < blueprint.phases.length) {
      const nextPhase = blueprint.phases[nextPhaseIndex];
      if (gameMoney < nextPhase.cost) {
        Alert.alert(`Not enough money for ${nextPhase.name}!`);
        return;
      }
      setGameMoney(prev => prev - nextPhase.cost);
      
      setConstructionProjects(prev => ({
        ...prev,
        [projectId]: {
          ...prev[projectId],
          currentPhaseIndex: nextPhaseIndex,
          currentPhase: nextPhase, // FIX: Update the current phase object
          status: 'In Progress',
          progress: 0,
        }
      }));
    } else {
      // --- CONSTRUCTION COMPLETE ---
      const landAsset = playerAssets.find(a => a.id === projectId);
      const totalInvestment = blueprint.phases.reduce((sum, phase) => sum + phase.cost, landAsset.purchasePrice);

      const newProperty = {
        id: `${blueprint.id}_${new Date().getTime()}`,
        assetType: 'Property',
        name: blueprint.name,
        type: blueprint.type,
        baseValue: blueprint.finalValue,
        askingPrice: Math.round(blueprint.finalValue * 1.15),
        marketValue: blueprint.finalValue,
        purchasePrice: totalInvestment,
        invested: totalInvestment,
        status: 'Owned',
        renovationProgress: 100,
        installedAddOns: [],
        availableAddOns: blueprint.potentialAddOns || [],
      };

      const updatedProjects = { ...constructionProjects };
      delete updatedProjects[projectId];
      setConstructionProjects(updatedProjects);
      setPlayerAssets(prev => [...prev.filter(a => a.id !== projectId), newProperty]);

      addXp(blueprint.xpReward);
      Alert.alert("Construction Complete!", `${newProperty.name} has been added to your portfolio!`);
    }
  };
  // ADD the new function to list with a price
  const listPropertyWithPrice = (assetId, askingPrice) => {
    setPlayerAssets((prev) =>
      prev.map((a) =>
        a.id === assetId
          ? { ...a, status: "For Sale", askingPrice: askingPrice }
          : a
      )
    );
  };
  const startRenovation = (assetId) => {
    const asset = playerAssets.find((a) => a.id === assetId);
    const cost = asset?.renovationData?.cost || 0;
    if (!asset || gameMoney < cost) return false;
    setGameMoney((prev) => prev - cost);
    setPlayerAssets((prev) =>
      prev.map((a) =>
        a.id === assetId
          ? { ...a, status: "Renovating", renovationProgress: 0 }
          : a
      )
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
    const assetToSell = playerAssets.find((a) => a.id === assetId);
    if (!assetToSell) return;

    const totalInvestment = assetToSell.invested || assetToSell.purchasePrice;
    const profit = offerAmount - totalInvestment;

    if (profit > 0) {
      // --- NEW LOGIC ---
      // 1. Calculate the profit percentage
      const profitPercentage = (profit / totalInvestment) * 100;

      // 2. Calculate XP based on the percentage and our modifier
      const profitXp = Math.round(profitPercentage * PROFIT_XP_MODIFIER);

      addXp(profitXp);
      console.log(
        `Made a ${profitPercentage.toFixed(
          1
        )}% profit ($${profit.toLocaleString()}). Gained ${profitXp} XP.`
      );

      // The achievement for the first profit remains the same
      triggerAchievement("firstProfit", 150);
    }

    // The rest of the function logic remains the same
    setGameMoney((prev) => prev + offerAmount);
    setPlayerAssets((prev) => prev.filter((a) => a.id !== assetId));
    const newOffers = { ...offers };
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
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};
