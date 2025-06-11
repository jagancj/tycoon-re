import React, { createContext, useState, useEffect } from 'react';
import { Alert, ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- DATA IMPORTS ---
import { PROPERTY_LIST } from './data/properties';
import { LAND_PLOT_LIST } from './data/landPlots';
import { BLUEPRINT_LIST } from './data/buildingBlueprints';
import { STAFF_LIST } from './data/staffMembers';
import { BANK_LIST } from './data/banks';
import { LEVEL_UP_THRESHOLDS } from './data/levels';

export const GameContext = createContext();

// --- GAME CONSTANTS ---
const SAVE_GAME_KEY = '@RealEstateTycoon:gameState';
const GAME_DAY_IN_MS = 20000;
const UPDATE_INTERVAL_MS = 1000;
const TICKS_PER_DAY = GAME_DAY_IN_MS / UPDATE_INTERVAL_MS;
const PROFIT_XP_MODIFIER = 4;
const RENOVATION_TIME_MS = 30000;
const PRE_CLOSURE_FEE_RATE = 0.025;
const OFFER_GENERATION_INTERVAL_MS = 10000;

// --- HELPER FUNCTIONS ---
const updateConstructionProgress = (currentProjects) => {
  let needsUpdate = false;
  const updatedProjects = { ...currentProjects };
  for (const projectId in updatedProjects) {
    const project = updatedProjects[projectId];
    if (project.status === 'In Progress') {
      needsUpdate = true;
      const currentPhase = project.modifiedPhases[project.currentPhaseIndex];
      if (currentPhase && typeof currentPhase.duration === 'number' && currentPhase.duration > 0) {
        const progressToAdd = (100 / currentPhase.duration);
        project.progress = Math.min(100, project.progress + progressToAdd);
        if (project.progress >= 100) {
          project.status = 'Phase Complete';
        }
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
    if (project) {
      needsUpdate = true;
      let totalEfficiency = project.assignedStaff.reduce((total, staffId) => {
        const staffMember = hiredStaff.find((s) => s.id === staffId);
        return total + (staffMember?.efficiencyModifier || 1.0);
      }, 0) || 1;
      const progressToAdd = (100 / (RENOVATION_TIME_MS / 1000)) * totalEfficiency;
      project.progress = Math.min(100, project.progress + progressToAdd);
      if (project.progress >= 100) {
        completedProjects.push(projectId);
      }
    }
  }
  return { updatedProjects, needsUpdate, completedProjects };
};

// --- INITIAL STATE ---
const initialState = {
  gameMoney: 1000000,
  playerLevel: 1,
  playerXp: 0,
  playerAssets: [],
  activeLoans: [],
  offers: {},
  constructionProjects: {},
  renovationProjects: {},
  staff: { hired: [], availableToHire: STAFF_LIST },
  agentReports: {},
  transactionLog: [],
  soldPropertiesLog: [],
  achievements: {
    boughtFirstProperty: false,
    firstRenovation: false,
    firstProfit: false,
    gotFirstLoan: false,
  },
};

// --- MAIN GAME PROVIDER COMPONENT ---
export const GameProvider = ({ children }) => {
  // --- STATE MANAGEMENT ---
  const [state, setState] = useState(initialState);
  const [isLoading, setIsLoading] = useState(true);
  const [gameTick, setGameTick] = useState(0);

  const { gameMoney, playerLevel, playerXp, playerAssets, activeLoans, offers, constructionProjects, renovationProjects, staff, agentReports, transactionLog, soldPropertiesLog, achievements } = state;
  const xpForNextLevel = LEVEL_UP_THRESHOLDS[playerLevel] || 99999;
  
  // --- GAME LOOPS ---
  useEffect(() => {
    const loadState = async () => {
      try {
        const savedStateString = await AsyncStorage.getItem(SAVE_GAME_KEY);
        if (savedStateString) {
          const savedState = JSON.parse(savedStateString);
          setState(prevState => ({ ...prevState, ...savedState }));
        }
      } catch (e) { console.error("Failed to load state.", e); }
      finally { setIsLoading(false); }
    };
    loadState();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const stateToSave = { gameMoney, playerLevel, playerXp, playerAssets, activeLoans, staff, achievements, soldPropertiesLog, agentReports };
      AsyncStorage.setItem(SAVE_GAME_KEY, JSON.stringify(stateToSave));
    }
  }, [state, isLoading]);

  useEffect(() => {
    if (isLoading) return;
    const gameLoop = setInterval(() => {
      setState(prevState => {
        const { updatedProjects: updatedConstruction } = updateConstructionProgress(prevState.constructionProjects);
        const { updatedProjects: updatedRenovation, completedProjects } = updateRenovationProgress(prevState.renovationProjects, prevState.staff.hired);
        if (completedProjects.length > 0) {
          handleCompletedRenovations(completedProjects, prevState);
        }
        return { ...prevState, constructionProjects: updatedConstruction, renovationProjects: updatedRenovation };
      });
      setGameTick(prevTick => (prevTick + 1));
    }, UPDATE_INTERVAL_MS);
    return () => clearInterval(gameLoop);
  }, [isLoading]);

  useEffect(() => {
    if (gameTick >= TICKS_PER_DAY && !isLoading) {
      handleDailyFinancials();
      setGameTick(0);
    }
  }, [gameTick, isLoading]);
  
  useEffect(() => {
    if (isLoading) return;
    const offerInterval = setInterval(() => {
      const propertiesForSale = state.playerAssets.filter(asset => asset.status === 'For Sale' && asset.askingPrice > 0);
      if (propertiesForSale.length === 0) return;
      const newOffers = { ...state.offers };
      propertiesForSale.forEach(asset => {
          const totalInvestment = asset.invested || asset.purchasePrice || 0;
            if (totalInvestment === 0) return; // Cannot generate offer for a free property
        let finalOfferAmount = 0;
        switch (asset.marketSentiment) {
                case 'Lowball':
                    // Always generate a loss-making offer (75% to 95% of investment)
                    finalOfferAmount = Math.round(totalInvestment * (0.75 + Math.random() * 0.20));
                    break;
                case 'Lucrative':
                    // Always generate a high-profit offer (151% to 200% of investment)
                    finalOfferAmount = Math.round(totalInvestment * (1.21 + Math.random() * 0.49));
                    break;
                case 'Standard':
                default:
                    // Always generate a modest-profit offer (101% to 150% of investment)
                    finalOfferAmount = Math.round(totalInvestment * (1.01 + Math.random() * 0.49));
                    break;
            }
        const newOffer = { id: `OFFER_${Date.now()}_${Math.random()}`, amount: finalOfferAmount };
        if (!newOffers[asset.id]) newOffers[asset.id] = [];
        newOffers[asset.id].unshift(newOffer);
        newOffers[asset.id] = newOffers[asset.id].slice(0, 5);
      });
      setState(prev => ({ ...prev, offers: newOffers }));
    }, OFFER_GENERATION_INTERVAL_MS);
    return () => clearInterval(offerInterval);
  }, [isLoading, state.playerAssets]);

  // --- CORE GAME FUNCTIONS ---

  const logTransaction = (description, amount, category) => {
    const newTransaction = { id: `TXN_${Date.now()}`, date: Date.now(), description, amount, category };
    setState(prev => ({ ...prev, transactionLog: [newTransaction, ...prev.transactionLog].slice(0, 100) }));
  };

  const handleDailyFinancials = () => {
    let totalDailyCost = 0;
    const totalSalary = state.staff.hired.reduce((sum, member) => sum + member.salaryPerDay, 0);
    if (totalSalary > 0) {
      totalDailyCost += totalSalary;
      logTransaction('Staff Salaries', -totalSalary, 'Expenses');
    }
    const totalEmi = state.activeLoans.reduce((sum, loan) => sum + loan.emi, 0);
    if (totalEmi > 0) {
      totalDailyCost += totalEmi;
      logTransaction('Loan Payments', -totalEmi, 'Expenses');
    }
    if (totalDailyCost > 0) setState(prev => ({ ...prev, gameMoney: prev.gameMoney - totalDailyCost }));
  };

  const handleCompletedRenovations = (completedProjectIds, currentState) => {
    let finalAssets = [...currentState.playerAssets];
    let finalStaff = [...currentState.staff.hired];
    let finalProjects = { ...currentState.renovationProjects };
    completedProjectIds.forEach(projectId => {
      const project = finalProjects[projectId];
      const asset = finalAssets.find(a => a.id === projectId);
      if (asset && asset.renovationData) {
        const valueIncrease = asset.renovationData.valueIncrease || 0;
        finalAssets = finalAssets.map(a => a.id === projectId ? { ...a, status: 'Owned', marketValue: a.marketValue + valueIncrease, renovationProgress: 100 } : a);
      }
      if (project) finalStaff = finalStaff.map(s => project.assignedStaff.includes(s.id) ? { ...s, status: 'Idle', assignedProjectId: null } : s);
      delete finalProjects[projectId];
    });
    setState(prev => ({ ...prev, playerAssets: finalAssets, staff: { ...prev.staff, hired: finalStaff }, renovationProjects: finalProjects }));
  };
  
  const addXp = (amount) => {
    setState(prev => {
      const finalXpAmount = Math.round(amount * Math.max(1, prev.playerLevel / 2));
      let newXp = prev.playerXp + finalXpAmount;
      let newLevel = prev.playerLevel;
      let xpThreshold = LEVEL_UP_THRESHOLDS[newLevel];
      while (xpThreshold !== undefined && newXp >= xpThreshold) {
        newXp -= xpThreshold;
        newLevel++;
        xpThreshold = LEVEL_UP_THRESHOLDS[newLevel];
      }
      return { ...prev, playerXp: newXp, playerLevel: newLevel };
    });
  };

  const triggerAchievement = (name, xp) => {
    if (!state.achievements[name]) {
        addXp(xp);
        setState(prev => ({ ...prev, achievements: { ...prev.achievements, [name]: true } }));
    }
  };

  const takeLoan = (loanDetails) => {
    const existingLoan = state.activeLoans.find(loan => loan.type === loanDetails.type);
    if (existingLoan && loanDetails.type === 'Personal') { Alert.alert("Loan Exists", `You already have an active Personal loan.`); return; }
    const newLoan = { id: `LOAN_${Date.now()}`, ...loanDetails };
    setState(prev => {
        let updatedAssets = prev.playerAssets;
        if (loanDetails.type === 'Mortgage' && loanDetails.assetId) {
            updatedAssets = prev.playerAssets.map(asset => asset.id === loanDetails.assetId ? { ...asset, isMortgaged: true } : asset);
        }
        return { ...prev, gameMoney: prev.gameMoney + loanDetails.amount, activeLoans: [...prev.activeLoans, newLoan], playerAssets: updatedAssets, };
    });
    logTransaction(`Loan Taken: ${loanDetails.type}`, loanDetails.amount, 'Loan');
    triggerAchievement('gotFirstLoan', 25);
  };
  
    // In GameContext.js

  const preCloseLoan = (loanToClose) => {
    if (!loanToClose) {
      console.error("preCloseLoan called with invalid loan object");
      return false;
    }
    
    // 1. All calculations are done upfront.
    const feePercentage = PRE_CLOSURE_FEE_RATE + Math.random() * 0.03; // 2.5% to 5.5% fee
    const fee = Math.round(loanToClose.outstandingPrincipal * feePercentage);
    const totalPayoff = loanToClose.outstandingPrincipal + fee;

    // 2. The confirmation alert is shown to the user.
    Alert.alert(
      "Confirm Pre-Closure",
      `This will pay off the remaining $${loanToClose.outstandingPrincipal.toLocaleString()} principal.\n\nA pre-closure fee of $${fee.toLocaleString()} will be applied.\n\nTotal Cost: $${totalPayoff.toLocaleString()}`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Confirm Payment", 
          onPress: () => {
            // 3. A single validation check.
            if (state.gameMoney < totalPayoff) {
              Alert.alert("Payment Failed", "You do not have sufficient funds to pay off this loan.");
              return;
            }

            // 4. A single, atomic state update for all changes.
            setState(prev => {
              // Prepare the updated state slices
              const updatedActiveLoans = prev.activeLoans.filter(loan => loan.id !== loanToClose.id);
              
              let updatedPlayerAssets = prev.playerAssets;
              if (loanToClose.type === 'Mortgage' && loanToClose.assetId) {
                updatedPlayerAssets = prev.playerAssets.map(asset => 
                  asset.id === loanToClose.assetId ? { ...asset, isMortgaged: false } : asset
                );
              }

              // Prepare new transaction logs
              const payoffLog = { id: `TXN_${Date.now()}_payoff`, date: Date.now(), description: `Loan Payoff: ${loanToClose.type}`, amount: -totalPayoff, category: 'Loan' };

              // Return the new, complete state object
              return {
                ...prev,
                gameMoney: prev.gameMoney - totalPayoff,
                activeLoans: updatedActiveLoans,
                playerAssets: updatedPlayerAssets,
                transactionLog: [payoffLog, ...prev.transactionLog].slice(0, 100),
              };
            });
            
            Alert.alert("Loan Closed!", "You have successfully paid off the loan.");
          }
        }
      ]
    );
    return true; // The action was successfully initiated
  };

  const buyProperty = (property, price) => {
    // 1. All calculations are done upfront, before any state is changed.
    const feePercentage = 0.02 + Math.random() * 0.03;
    const acquisitionFee = Math.round(price * feePercentage);
    const totalCost = price + acquisitionFee + (property.pendingTaxes || 0);

    // 2. The validation check remains at the top.
    if (state.gameMoney < totalCost) {
      // The modal will handle showing the failure message.
      return false;
    }

    // 3. A single, atomic state update for all changes.
    setState(prev => {
      // Construct the new asset object with all necessary fields.
      const newAsset = {
        ...property,
        assetType: 'Property',
        id: `${property.id}_${Date.now()}`,
        purchasePrice: price,
        invested: totalCost,
        acquisitionFee: acquisitionFee,
        purchaseTimestamp: Date.now(),
        status: 'Owned',
        installedAddOns: [],
        renovationProgress: 0,
        // Ensure renovationData is created correctly from the property list data
        renovationData: property.renovationCost 
            ? { cost: property.renovationCost, valueIncrease: property.valueIncreaseAfterReno } 
            : undefined,
      };

      // Prepare new transaction log entries.
      const purchaseLog = { id: `TXN_${Date.now()}_buy`, date: Date.now(), description: `Purchase: ${property.name}`, amount: -price, category: 'Acquisition' };
      const feeLog = { id: `TXN_${Date.now()}_fee`, date: Date.now(), description: 'Acquisition Fees', amount: -acquisitionFee, category: 'Fees & Taxes' };
      const newLogs = [purchaseLog, feeLog, ...prev.transactionLog].slice(0, 100);
      
      // Prepare achievement updates.
      let updatedAchievements = prev.achievements;
      if (!prev.achievements.boughtFirstProperty) {
        updatedAchievements = { ...prev.achievements, boughtFirstProperty: true };
      }
      
      // Return the new, complete state object.
      return {
        ...prev,
        gameMoney: prev.gameMoney - totalCost,
        playerAssets: [...prev.playerAssets, newAsset],
        transactionLog: newLogs,
        achievements: updatedAchievements,
      };
    });

    // Trigger XP addition after the state update.
    if (!state.achievements.boughtFirstProperty) {
        addXp(50);
    }
    
    return true;
  };

  const buyLand = (landPlot, price) => {
    // All calculations are done before updating state.
    const feePercentage = 0.02 + Math.random() * 0.03;
    const acquisitionFee = Math.round(price * feePercentage);
    const totalCost = price + acquisitionFee;

    // The validation check remains at the top.
    if (state.gameMoney < totalCost) {
      // The modal in the UI will handle showing the failure message.
      return false;
    }

    // A single, atomic state update for all changes.
    setState(prev => {
      // 1. Construct the new asset object with all necessary fields.
      const newLandAsset = {
        ...landPlot,
        assetType: 'Land',
        id: `${landPlot.id}_${Date.now()}`,
        purchasePrice: price,
        invested: totalCost, // The true initial investment
        acquisitionFee: acquisitionFee,
        purchaseTimestamp: Date.now(), // For calculating capital gains later
        status: 'Owned',
      };

      // 2. Prepare the new transaction log entries.
      const purchaseLog = { id: `TXN_${Date.now()}_buy`, date: Date.now(), description: `Purchase: ${landPlot.name}`, amount: -price, category: 'Acquisition' };
      const feeLog = { id: `TXN_${Date.now()}_fee`, date: Date.now(), description: 'Acquisition Fees', amount: -acquisitionFee, category: 'Fees & Taxes' };

      // 3. Handle achievements inside the state update.
      let updatedAchievements = prev.achievements;
      let xpToAdd = 0;
      if (!prev.achievements.boughtFirstProperty) {
        xpToAdd = 50;
        updatedAchievements = { ...prev.achievements, boughtFirstProperty: true };
      }
      
      // We will call the addXp function after this state update completes.

      // 4. Return the new, complete state object.
      return {
        ...prev,
        gameMoney: prev.gameMoney - totalCost,
        playerAssets: [...prev.playerAssets, newLandAsset],
        transactionLog: [purchaseLog, feeLog, ...prev.transactionLog].slice(0, 100),
        achievements: updatedAchievements,
      };
    });
    
    // Add XP after the state has been updated.
    if (!state.achievements.boughtFirstProperty) {
      addXp(50);
    }
    
    return true;
  };

  const startRenovation = (asset) => {
    // 1. Find an available manager from the current state
    const manager = state.staff.hired.find(s => s.role === 'Renovation' && s.status === 'Idle');
    if (!manager) {
      Alert.alert("No Renovation Manager Available", "You must hire a Renovation Manager to start this project.");
      return false;
    }

    // 2. Calculate the cost from the asset's data
    const totalRenovationCost = asset.renovationData?.cost?.total || 0;
    if (state.gameMoney < totalRenovationCost) {
      Alert.alert("Not Enough Funds", `You need $${totalRenovationCost.toLocaleString()} to renovate.`);
      return false;
    }

    // 3. If all checks pass, update everything in a single state operation
    setState(prev => {
      // Create the updated staff list
      const updatedHiredStaff = prev.staff.hired.map(s =>
        s.id === manager.id ? { ...s, status: 'On Project', assignedProjectId: asset.id } : s
      );

      // Create the updated renovation projects object
      const updatedRenovationProjects = {
        ...prev.renovationProjects,
        [asset.id]: { progress: 0, assignedStaff: [manager.id] }
      };

      // Create the updated player assets list
      const updatedPlayerAssets = prev.playerAssets.map(a =>
        a.id === asset.id ? { ...a, status: 'Renovating' } : a
      );

      // Log the transaction
      const newTransaction = { id: `TXN_${Date.now()}`, date: Date.now(), description: `Renovation: ${asset.name}`, amount: -totalRenovationCost, category: 'Renovation' };
      const updatedTransactionLog = [newTransaction, ...prev.transactionLog].slice(0, 100);

      // Trigger achievement logic
      let updatedAchievements = prev.achievements;
      let xpToAdd = 0;
      if (!prev.achievements.firstRenovation) {
        xpToAdd = 50; // XP Bonus for first renovation
        updatedAchievements = { ...prev.achievements, firstRenovation: true };
      }

      // Return the single, new state object with all changes
      return {
        ...prev,
        gameMoney: prev.gameMoney - totalRenovationCost,
        staff: { ...prev.staff, hired: updatedHiredStaff },
        renovationProjects: updatedRenovationProjects,
        playerAssets: updatedPlayerAssets,
        transactionLog: updatedTransactionLog,
        achievements: updatedAchievements,
        // We will call addXp separately if needed, to not complicate the reducer logic further
      };
    });

    // Handle XP addition after the main state update
    if (!state.achievements.firstRenovation) {
      addXp(50);
    }
    
    return true;
  };

  const listPropertyWithPrice = (assetId, askingPrice) => {
    // 1. Find the asset from the current state first to ensure we have the latest data.
    const asset = state.playerAssets.find(a => a.id === assetId);
    
    // 2. Perform validation checks.
    if (!asset) {
      console.error("listPropertyWithPrice: Could not find asset with ID:", assetId);
      return;
    }
    if (asset.isMortgaged) {
      Alert.alert("Action Blocked", "You must pay off the mortgage on this property before listing it.");
      return;
    }

    // 3. Determine the market sentiment for this new listing.
    const roll = Math.random() * 10;
    let marketSentiment;
    if (roll <= 3) {
      marketSentiment = 'Lowball';
    } else if (roll <= 7) {
      marketSentiment = 'Standard';
    } else {
      marketSentiment = 'Lucrative';
    }

    // 4. Perform all state changes in a single, atomic operation.
    setState(prev => {
      // Create the updated player assets array
      const updatedPlayerAssets = prev.playerAssets.map(a =>
        a.id === assetId
          ? { ...a, status: "For Sale", askingPrice: askingPrice, marketSentiment: marketSentiment }
          : a
      );
      
      // Return the new state object
      return {
        ...prev,
        playerAssets: updatedPlayerAssets,
      };
    });
  };

  const acceptOffer = (assetId, offerAmount) => {
    // Find the asset from the current state to ensure we have the latest data.
    const assetToSell = state.playerAssets.find(a => a.id === assetId);
    if (!assetToSell) {
        console.error("Could not find asset to sell with ID:", assetId);
        return;
    }

    // Perform all calculations before updating state.
    const totalInvestment = assetToSell.invested || assetToSell.purchasePrice || 0;
    const profit = offerAmount - totalInvestment;
    let taxToPay = 0;
    let xpFromProfit = 0;
    let shouldTriggerAchievement = false;

    if (profit > 0) {
        const holdingDurationDays = (Date.now() - (assetToSell.purchaseTimestamp || 0)) / GAME_DAY_IN_MS;
        const taxRate = holdingDurationDays < 10 ? 0.30 : 0.15;
        taxToPay = Math.round(profit * taxRate);
        
        const profitPercentage = totalInvestment > 0 ? (profit / totalInvestment) * 100 : 100;
        xpFromProfit = Math.round(profitPercentage * PROFIT_XP_MODIFIER);
        
        if (!state.achievements.firstProfit) {
            shouldTriggerAchievement = true;
        }
    }
    
    const netPayout = offerAmount - taxToPay;
    const saleRecord = { id: assetToSell.id, name: assetToSell.name, purchasePrice: assetToSell.purchasePrice, totalInvestment, salePrice: offerAmount, profit };

    // Perform all state updates in a single, atomic operation.
    setState(prev => {
        // Prepare the new state slices based on the previous state.
        const updatedPlayerAssets = prev.playerAssets.filter(a => a.id !== assetId);
        const updatedSoldLog = [saleRecord, ...prev.soldPropertiesLog];
        const updatedOffers = { ...prev.offers };
        delete updatedOffers[assetId];
        
        // Handle XP and achievements inside the state update to ensure consistency.
        let newXp = prev.playerXp;
        let newLevel = prev.playerLevel;
        let finalAchievements = prev.achievements;
        let totalXpToAdd = xpFromProfit;

        if (shouldTriggerAchievement) {
            totalXpToAdd += 150; // First profit XP bonus
            finalAchievements = { ...prev.achievements, firstProfit: true };
        }

        if (totalXpToAdd > 0) {
            const finalXpAmount = Math.round(totalXpToAdd * Math.max(1, prev.playerLevel / 2));
            newXp += finalXpAmount;
            let xpThreshold = LEVEL_UP_THRESHOLDS[newLevel];
            while (xpThreshold !== undefined && newXp >= xpThreshold) {
                newXp -= xpThreshold;
                newLevel++;
                xpThreshold = LEVEL_UP_THRESHOLDS[newLevel];
            }
        }
        
        // Log the transactions. Note: We don't call the helper here to avoid a double state update.
        const saleTransaction = { id: `TXN_${Date.now()}_sale`, date: Date.now(), description: `Sale: ${assetToSell.name}`, amount: offerAmount, category: 'Property Sale' };
        const taxTransaction = taxToPay > 0 ? { id: `TXN_${Date.now()}_tax`, date: Date.now(), description: 'Capital Gains Tax', amount: -taxToPay, category: 'Fees & Taxes' } : null;
        const newTransactionLog = [saleTransaction, ...(taxTransaction ? [taxTransaction] : []), ...prev.transactionLog].slice(0, 100);

        // Return the new, complete state object.
        return {
            ...prev,
            gameMoney: prev.gameMoney + netPayout,
            playerAssets: updatedPlayerAssets,
            soldPropertiesLog: updatedSoldLog,
            offers: updatedOffers,
            playerXp: newXp,
            playerLevel: newLevel,
            achievements: finalAchievements,
            transactionLog: newTransactionLog,
        };
    });
  };

  const installAddOn = (assetId, addOn) => {
    const asset = playerAssets.find((a) => a.id === assetId);
    
    // Safety check to ensure the asset exists and the player can afford the upgrade.
    if (!asset || gameMoney < addOn.cost) {
        Alert.alert("Error", "Cannot install this add-on. Check your funds.");
        return false;
    }

    // Perform all state changes in a single, atomic operation.
    setState(prev => {
        // Find the specific asset within the current state's playerAssets array.
        const updatedAssets = prev.playerAssets.map((a) => {
            if (a.id === assetId) {
                // Return a new object for the updated asset.
                return {
                    ...a,
                    marketValue: (a.marketValue || 0) + addOn.valueIncrease,
                    invested: (a.invested || 0) + addOn.cost,
                    installedAddOns: [...(a.installedAddOns || []), addOn.id],
                };
            }
            return a; // Return all other assets unchanged.
        });

        // Log the transaction for the finance screen.
        logTransaction(`Add-on: ${addOn.name} for ${asset.name}`, -addOn.cost, 'Upgrades');

        // Return the new, complete state object.
        return {
            ...prev,
            gameMoney: prev.gameMoney - addOn.cost,
            playerAssets: updatedAssets,
        };
    });

    return true;
  };
  const startConstruction = (landAsset, blueprint, architect, supervisor) => {
    // This part of the logic is correct
    const finalCostModifier = architect.costModifier * (supervisor.costModifier || 1);
    const finalEfficiencyModifier = architect.efficiencyModifier * (supervisor.efficiencyModifier || 1);
    const modifiedPhases = blueprint.phases.map(phase => ({
      ...phase,
      cost: Math.round(phase.cost * finalCostModifier),
      duration: Math.max(1, phase.duration / finalEfficiencyModifier),
    }));

    const initialPhase = modifiedPhases[0];
    if (state.gameMoney < initialPhase.cost) {
      Alert.alert("Insufficient Funds", `You need $${initialPhase.cost.toLocaleString()} for the first phase with this team.`);
      return false;
    }

    // This is the new, corrected state update
    setState(prev => {
      // First, update the staff member's status
      const updatedHiredStaff = prev.staff.hired.map(s => 
        s.id === supervisor.id ? { ...s, status: 'On Project', assignedProjectId: landAsset.id } : s
      );

      // Then, create the new construction project
      const projectId = landAsset.id;
      const newConstructionProjects = {
        ...prev.constructionProjects,
        [projectId]: {
          blueprintId: blueprint.id,
          currentPhaseIndex: 0,
          currentPhase: initialPhase,
          status: 'In Progress',
          progress: 0,
          assignedStaff: [supervisor.id],
          architectId: architect.id,
          qualityModifier: architect.qualityModifier * (supervisor.qualityModifier || 1),
          modifiedPhases: modifiedPhases,
        }
      };

      // Finally, update the land asset's status
      const updatedPlayerAssets = prev.playerAssets.map(asset => 
        asset.id === landAsset.id ? { ...asset, status: 'Under Construction' } : asset
      );

      // Log the transaction
      logTransaction(`Phase Cost: ${initialPhase.name}`, -initialPhase.cost, 'Construction');
      triggerAchievement('firstRenovation', 50);

      // Return the new, complete state object
      return {
        ...prev,
        gameMoney: prev.gameMoney - initialPhase.cost,
        staff: { ...prev.staff, hired: updatedHiredStaff },
        constructionProjects: newConstructionProjects,
        playerAssets: updatedPlayerAssets,
      };
    });

    return true;
  };
  

  const advanceConstructionPhase = (projectId) => {
    const project = state.constructionProjects[projectId];
    if (!project) return;

    const blueprint = BLUEPRINT_LIST.find(b => b.id === project.blueprintId);
    const nextPhaseIndex = project.currentPhaseIndex + 1;

    if (nextPhaseIndex < blueprint.phases.length) {
      // Logic for advancing to the next phase (this part is correct)
      const nextPhase = project.modifiedPhases[nextPhaseIndex];
      if (state.gameMoney < nextPhase.cost) {
        Alert.alert(`Not enough money for ${nextPhase.name}!`);
        return;
      }
      
      setState(prev => {
        logTransaction(`Phase Cost: ${nextPhase.name}`, -nextPhase.cost, 'Construction');
        return {
          ...prev,
          gameMoney: prev.gameMoney - nextPhase.cost,
          constructionProjects: {
            ...prev.constructionProjects,
            [projectId]: {
              ...project,
              currentPhaseIndex: nextPhaseIndex,
              currentPhase: nextPhase,
              status: 'In Progress',
              progress: 0,
            }
          }
        };
      });

    } else {
      // --- CONSTRUCTION COMPLETE ---
      // This is the block with the corrected state update logic.
      
      setState(prev => {
        const landAsset = prev.playerAssets.find(a => a.id === projectId);
        const projectToComplete = prev.constructionProjects[projectId];
        
        // 1. Calculate final values
        const totalInvestment = projectToComplete.modifiedPhases.reduce((sum, phase) => sum + phase.cost, landAsset.purchasePrice);
        const finalMarketValue = Math.round(blueprint.finalValue * projectToComplete.qualityModifier);

        // 2. Create the new property object
        const newProperty = {
            id: `${blueprint.id}_${Date.now()}`, assetType: 'Property', name: blueprint.name,
            type: blueprint.type, baseValue: finalMarketValue, askingPrice: Math.round(finalMarketValue * 1.15),
            marketValue: finalMarketValue, purchasePrice: totalInvestment, invested: totalInvestment,
            status: 'Owned', renovationProgress: 100, installedAddOns: [],
            availableAddOns: blueprint.potentialAddOns || [], purchaseTimestamp: Date.now(),
        };

        // 3. Prepare the updated state slices
        const updatedPlayerAssets = [...prev.playerAssets.filter(a => a.id !== projectId), newProperty];
        
        const updatedProjects = { ...prev.constructionProjects };
        delete updatedProjects[projectId];

        const updatedHiredStaff = prev.staff.hired.map(s => 
            projectToComplete.assignedStaff.includes(s.id) ? { ...s, status: 'Idle', assignedProjectId: null } : s
        );

        // 4. Log the transaction and add XP
        logTransaction(`New Build: ${newProperty.name}`, 0, 'Construction');
        addXp(blueprint.xpReward);
        Alert.alert("Construction Complete!", `${newProperty.name} has been added to your portfolio!`);

        // 5. Return the new state in a single operation
        return {
            ...prev,
            playerAssets: updatedPlayerAssets,
            constructionProjects: updatedProjects,
            staff: { ...prev.staff, hired: updatedHiredStaff },
        };
      });
    }
  };

  const hireAgent = (property, fee) => {
    // 1. Validation check is performed first using the current state.
    if (state.gameMoney < fee) {
      Alert.alert("Insufficient Funds", "You can't afford the agent's fee.");
      return;
    }

    // 2. Perform all state changes in a single, atomic operation.
    setState(prev => {
      // Prepare the new agent reports object.
      const updatedAgentReports = {
        ...prev.agentReports,
        [property.id]: {
          hiddenDamage: property.hiddenDamageCost,
          areaAverage: property.areaAverageValue,
        }
      };

      // Prepare the new transaction log entry.
      const agentLog = { 
        id: `TXN_${Date.now()}_agent`, 
        date: Date.now(), 
        description: `Agent Fee: ${property.name}`, 
        amount: -fee, 
        category: 'Services' 
      };

      // Return the new, complete state object.
      return {
        ...prev,
        gameMoney: prev.gameMoney - fee,
        agentReports: updatedAgentReports,
        transactionLog: [agentLog, ...prev.transactionLog].slice(0, 100),
      };
    });
  };

  const hireStaff = (staffMember) => {
    const cost = staffMember.hireCost;

    // 1. Validation check is performed first.
    if (state.gameMoney < cost) {
      Alert.alert("Cannot Hire", "You don't have enough money for the hiring fee.");
      return; // Exit if the player can't afford it.
    }

    // 2. A single, atomic state update for all changes.
    setState(prev => {
      // Prepare the new state slices based on the previous state.
      const updatedHiredStaff = [
        ...prev.staff.hired,
        { ...staffMember, status: 'Idle', assignedProjectId: null }
      ];
      
      const updatedAvailableToHire = prev.staff.availableToHire.filter(s => s.id !== staffMember.id);
      
      const updatedStaff = {
        hired: updatedHiredStaff,
        availableToHire: updatedAvailableToHire,
      };

      // Prepare the new transaction log entry.
      const hireLog = { 
          id: `TXN_${Date.now()}_hire`, 
          date: Date.now(), 
          description: `Hiring Fee: ${staffMember.name}`, 
          amount: -cost, 
          category: 'Staff' 
        };
      const newTransactionLog = [hireLog, ...prev.transactionLog].slice(0, 100);

      // Return the new, complete state object.
      return {
        ...prev,
        gameMoney: prev.gameMoney - cost,
        staff: updatedStaff,
        transactionLog: newTransactionLog,
      };
    });
  };
  const value = {
    ...state,
    xpForNextLevel,
    logTransaction, addXp, triggerAchievement, hireStaff, takeLoan, preCloseLoan,
    buyProperty, buyLand, startRenovation, listPropertyWithPrice, acceptOffer,
    installAddOn, startConstruction, advanceConstructionPhase, hireAgent,
  };

  if (isLoading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f2027' }}><ActivityIndicator size="large" color="#FFD700" /></View>;
  }

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};