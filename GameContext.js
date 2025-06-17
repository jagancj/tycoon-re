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
const PROFIT_XP_MODIFIER = 4; // Legacy - kept for compatibility
const PROFIT_MARGIN_XP_MULTIPLIER = 2.5; // XP per 1% profit margin
const RENOVATION_TIME_MS = 10000; // Changed from 30000 to 10000 for faster renovations
const PRE_CLOSURE_FEE_RATE = 0.025;
const OFFER_GENERATION_INTERVAL_MS = 5000; // 5 seconds between subsequent offers (reduced for faster testing)

// --- HELPER FUNCTIONS ---
const addStaffToAvailable = (availableStaff, newStaff) => {
  const updatedStaff = [...availableStaff];
  newStaff.forEach(staffMember => {
    if (!updatedStaff.some(existing => existing.id === staffMember.id)) {
      updatedStaff.push(staffMember);
    }
  });
  return updatedStaff;
};

// Helper function to generate an offer for a specific property
const generateOfferForProperty = (asset) => {
  let totalInvestment = asset.totalInvestment || asset.invested || asset.purchasePrice || 0;
  
  console.log('🎯 Generating offer for asset:', {
    id: asset.id,
    totalInvestment: asset.totalInvestment,
    invested: asset.invested,
    purchasePrice: asset.purchasePrice,
    calculated: totalInvestment,
    assetType: asset.assetType,
    status: asset.status
  });
    if (totalInvestment === 0) {
    console.log('❌ Cannot generate offer - no investment data, using asking price as fallback');
    // Fallback: use asking price if available
    const fallbackInvestment = asset.askingPrice || 100000; // Default to $100k if nothing available
    console.log('🔄 Using fallback investment:', fallbackInvestment);
    totalInvestment = fallbackInvestment;
  }
  
  let finalOfferAmount = 0;
  switch (asset.marketSentiment) {
    case 'Lowball':
      // Generate a loss-making offer (75% to 95% of investment)
      finalOfferAmount = Math.round(totalInvestment * (0.75 + Math.random() * 0.20));
      break;
    case 'Lucrative':
      // Generate a high-profit offer (121% to 170% of investment)
      finalOfferAmount = Math.round(totalInvestment * (1.21 + Math.random() * 0.49));
      break;
    case 'Standard':
    default:
      // Generate a modest-profit offer (101% to 150% of investment)
      finalOfferAmount = Math.round(totalInvestment * (1.01 + Math.random() * 0.49));
      break;  }
  
  const offer = { 
    id: `OFFER_${Date.now()}_${Math.random()}`, 
    amount: finalOfferAmount 
  };
  
  console.log('✅ Generated offer:', offer);
  return offer;
};

// Cleanup function for invalid construction projects
const cleanupInvalidConstructionProjects = () => {
  setState(prev => {
    const validProjects = {};
    const updatedAssets = prev.playerAssets.map(asset => {
      // If asset is under construction but has no valid project, reset it to owned
      if (asset.status === 'Under Construction') {
        const project = prev.constructionProjects[asset.id];
        if (!project || !project.blueprint || project.blueprintId === 'undefined') {
          console.log('🧹 Cleaning up invalid construction project for asset:', asset.id);
          return {
            ...asset,
            status: 'Owned' // Reset to owned state
          };
        } else {
          // Keep valid projects
          validProjects[asset.id] = project;
        }
      }
      return asset;
    });

    console.log('🧹 Cleanup complete. Valid projects:', Object.keys(validProjects).length);
    
    return {
      ...prev,
      playerAssets: updatedAssets,
      constructionProjects: validProjects
    };
  });
};

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

  // Cleanup stuck projects by adding a timeout check
  const RENOVATION_TIMEOUT_MS = RENOVATION_TIME_MS * 2; // Double the expected time as timeout

  for (const projectId in updatedProjects) {
    const project = updatedProjects[projectId];
    if (!project) continue;

    // Initialize project status if not set
    if (!project.status) {
      project.status = 'In Progress';
    }

    // Check for stuck projects (those that haven't completed after timeout)
    const projectAge = Date.now() - (project.startDate || Date.now());
    if (projectAge > RENOVATION_TIMEOUT_MS) {
      console.log(`Project ${projectId} timed out - marking as complete`);
      completedProjects.push(projectId);
      continue;
    }

    if (project.status !== 'Completed') {
      needsUpdate = true;
      
      // Initialize progress if it doesn't exist
      if (typeof project.progress !== 'number' || isNaN(project.progress)) {
        project.progress = 0;
      }

      // Even without staff, project should progress slowly
      let progressIncrement = (100 / (RENOVATION_TIME_MS / 1000)) * 0.5; // Base progress rate

      // If has staff, add their efficiency bonus
      if (project.assignedStaff && project.assignedStaff.length > 0) {
        const assignedStaffMembers = project.assignedStaff
          .map(staffId => hiredStaff.find(s => s.id === staffId))
          .filter(Boolean);

        if (assignedStaffMembers.length > 0) {
          const staffEfficiency = assignedStaffMembers.reduce((total, staff) => 
            total + (staff.efficiencyModifier || 1.0), 0);
          progressIncrement = (100 / (RENOVATION_TIME_MS / 1000)) * staffEfficiency;
        }
      }

      // Update progress
      project.progress = Math.min(100, project.progress + progressIncrement);

      // Check if project is complete
      if (project.progress >= 100) {
        project.status = 'Completed';
        completedProjects.push(projectId);
      }
    }
  }
    return { updatedProjects, needsUpdate, completedProjects };
};

const calculateTimeRemaining = (project) => {
  if (!project || project.status === 'Completed' || project.progress >= 100) {
    return 0;
  }
  
  const remainingProgress = 100 - (project.progress || 0);
  
  // Calculate progress rate based on staff efficiency (same logic as updateRenovationProgress)
  let progressRate = (100 / (RENOVATION_TIME_MS / 1000)) * 0.5; // Base progress rate
  
  if (project.assignedStaff && project.assignedStaff.length > 0) {
    // We need access to hired staff here, but we don't have it in this context
    // For now, estimate based on number of assigned staff
    const staffEfficiency = project.assignedStaff.length * 1.0; // Assume average efficiency of 1.0
    progressRate = (100 / (RENOVATION_TIME_MS / 1000)) * staffEfficiency;
  }
  
  const remainingTimeSeconds = remainingProgress / progressRate;
  return Math.max(0, remainingTimeSeconds * 1000); // Convert to milliseconds
};

// --- INITIAL STATE ---
const initialState = {
  gameMoney: 0, 
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
  soldPropertiesLog: [],  achievements: {
    boughtFirstProperty: false,
    firstRenovation: false,
    firstProfit: false,
    gotFirstLoan: false,
  },
  hasCompletedTutorial: false,
  // Marketplace batch system
  currentMarketplaceBatch: [], // Array of 5 property objects
  marketplaceBatchPurchased: [], // Array of property IDs purchased from current batch
  // Land market batch system
  currentLandBatch: [], // Array of 5 land plot objects
  landBatchPurchased: [], // Array of land plot IDs purchased from current batch
};

// --- MAIN GAME PROVIDER COMPONENT ---
export const GameProvider = ({ children, navigation }) => {
  // --- STATE MANAGEMENT ---
  const [state, setState] = useState(initialState);
  const [isLoading, setIsLoading] = useState(true);
  const [gameTick, setGameTick] = useState(0);
  const [lastLogin, setLastLogin] = useState(Date.now());

  const { gameMoney, playerLevel, playerXp, playerAssets, activeLoans, offers, constructionProjects, renovationProjects, staff, agentReports, transactionLog, soldPropertiesLog, achievements, hasCompletedTutorial, currentMarketplaceBatch, marketplaceBatchPurchased, currentLandBatch, landBatchPurchased } = state;
  const xpForNextLevel = LEVEL_UP_THRESHOLDS[playerLevel] || 99999;
    // --- GAME LOOPS ---
  useEffect(() => {
    const loadState = async () => {
      try {
        const savedStateString = await AsyncStorage.getItem(SAVE_GAME_KEY);
        if (savedStateString) {
          const savedState = JSON.parse(savedStateString);
          console.log('Loading saved state - tutorial status:', savedState.hasCompletedTutorial);
          // Ensure we merge STAFF_LIST back in for availableToHire
          const mergedStaff = {
            hired: savedState.staff?.hired || [],
            availableToHire: STAFF_LIST.filter(s => 
              !savedState.staff?.hired.some(hired => hired.id === s.id)
            )
          };
          savedState.staff = mergedStaff;
          setState(prevState => ({ ...prevState, ...savedState }));

          // Clean up any stuck projects after loading state
          setTimeout(cleanupStuckProjects, 0);
        } else {
          console.log('No saved state found, using initial state');
        }
      } catch (e) { console.error("Failed to load state.", e); }
      finally { setIsLoading(false); }
    };
    const checkDailyEvents = async () => {
        const now = Date.now();
        const lastLoginTime = await AsyncStorage.getItem('@lastLogin'); // Using AsyncStorage for persistence
        const oneDay = 24 * 60 * 60 * 1000;

        if (lastLoginTime) {
            const daysPassed = Math.floor((now - parseInt(lastLoginTime, 10)) / oneDay);
            if (daysPassed > 0) {
                console.log(`Player was away for ${daysPassed} real-world day(s).`);
                // Deduct expenses for each day the player was away
                for (let i = 0; i < daysPassed; i++) {
                    handleDailyFinancials(); 
                }
            }
        }
        await AsyncStorage.setItem('@lastLogin', now.toString());
    };
    checkDailyEvents();
    loadState();
  }, []);
  useEffect(() => {
    if (!isLoading) {
      const stateToSave = { gameMoney, playerLevel, playerXp, playerAssets, activeLoans, staff, achievements, soldPropertiesLog, agentReports, hasCompletedTutorial, currentMarketplaceBatch, marketplaceBatchPurchased, currentLandBatch, landBatchPurchased };
      AsyncStorage.setItem(SAVE_GAME_KEY, JSON.stringify(stateToSave));
    }
  }, [state, isLoading]);  useEffect(() => {
    if (isLoading) return;
    const gameLoop = setInterval(() => {
      setState(prevState => {
        const { updatedProjects: updatedConstruction } = updateConstructionProgress(prevState.constructionProjects);
        const { updatedProjects: updatedRenovation, completedProjects } = updateRenovationProgress(prevState.renovationProjects, prevState.staff.hired);
        
        // Handle completed renovations within the same state update
        let finalAssets = [...prevState.playerAssets];
        let finalProjects = { ...updatedRenovation };
        let finalStaff = { ...prevState.staff };
        
        // Process completed renovations
        if (completedProjects.length > 0) {
          console.log('Processing completed renovations:', completedProjects);
          
          completedProjects.forEach(projectId => {
            const project = finalProjects[projectId];
            const asset = finalAssets.find(a => a.id === projectId);
            
            if (asset && project) {
              console.log(`Completing renovation for ${projectId}`);
              
              // Get value increase from either the project or the asset's renovation data
              const valueIncrease = project.valueIncrease || asset.renovationData?.valueIncrease || 0;
              const renovationCost = project.cost?.total || 0;
              
              // Update the asset with completed renovation status
              finalAssets = finalAssets.map(a => {
                if (a.id === projectId) {
                  const currentValue = a.marketValue || a.purchasePrice;
                  return {
                    ...a,
                    status: 'Owned',
                    marketValue: currentValue + valueIncrease,
                    renovationProgress: 100,
                    renovationCompleted: true,
                    renovationTimeRemaining: 0,
                    invested: (a.invested || a.purchasePrice) + renovationCost,
                    lastRenovationValue: valueIncrease
                  };
                }
                return a;
              });                // Return staff to hiring agency
                if (project.assignedStaff) {
                  const staffToReturn = finalStaff.hired.filter(s => project.assignedStaff.includes(s.id));
                  finalStaff.hired = finalStaff.hired.filter(s => !project.assignedStaff.includes(s.id));
                  
                  const returnedStaff = staffToReturn.map(s => ({
                    ...s,
                    status: undefined,
                    assignedProjectId: null,
                    projectEndDate: null,
                    prepaidSalary: null
                  }));
                    // Deduplicate staff when returning to avoid duplicates
                  finalStaff.availableToHire = addStaffToAvailable(finalStaff.availableToHire, returnedStaff);
                }
              
              // Remove completed project
              delete finalProjects[projectId];
            }
          });
        } else {
          // Sync renovation progress to player assets for ongoing projects
          finalAssets = prevState.playerAssets.map(asset => {
            const project = finalProjects[asset.id];
            if (project && asset.status === 'Renovating') {
              return {
                ...asset,
                renovationProgress: project.progress || 0,
                renovationTimeRemaining: calculateTimeRemaining(project)
              };
            }
            return asset;
          });
        }
        
        return { 
          ...prevState, 
          constructionProjects: updatedConstruction, 
          renovationProjects: finalProjects,
          playerAssets: finalAssets,
          staff: finalStaff
        };
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
    
    console.log('🚀 Setting up offer generation interval every', OFFER_GENERATION_INTERVAL_MS, 'ms');
    const offerInterval = setInterval(() => {
      console.log('🔄 Offer generation interval triggered');
      setState(prev => {
        const propertiesForSale = prev.playerAssets.filter(asset => {
          // Don't generate offers for sold properties or those not marked for sale
          if (asset.status !== 'For Sale' || !asset.askingPrice) return false;
          
          // Check if the property exists in soldPropertiesLog
          const originalId = asset.id.split('_')[0];
          return !prev.soldPropertiesLog.some(sp => sp.id.split('_')[0] === originalId);
        });

        console.log('🏡 Properties for sale:', propertiesForSale.length);
        if (propertiesForSale.length === 0) return prev;
        
        const newOffers = { ...prev.offers };
        propertiesForSale.forEach(asset => {
          const offer = generateOfferForProperty(asset);
          console.log('💰 Generated offer for', asset.id, ':', offer);
          if (!offer) return;
          if (!newOffers[asset.id]) newOffers[asset.id] = [];
          newOffers[asset.id].unshift(offer);
          newOffers[asset.id] = newOffers[asset.id].slice(0, 5);
        });
        
        console.log('📊 Updated offers state:', Object.keys(newOffers));
        return { ...prev, offers: newOffers };
      });}, OFFER_GENERATION_INTERVAL_MS);
    return () => clearInterval(offerInterval);
  }, [isLoading]); // Only depend on isLoading to prevent interval recreation

  // --- CORE GAME FUNCTIONS ---

  const logTransaction = (description, amount, category) => {
    const newTransaction = { id: `TXN_${Date.now()}`, date: Date.now(), description, amount, category };
    setState(prev => ({ ...prev, transactionLog: [newTransaction, ...prev.transactionLog].slice(0, 100) }));
  };  const completeTutorial = () => {
    console.log("Tutorial completion requested");
    setState(prev => {
      console.log("Setting hasCompletedTutorial to true, previous value:", prev.hasCompletedTutorial);
      return { ...prev, hasCompletedTutorial: true };
    });
    console.log("Tutorial completed!");
  };
// In GameContext.js

  const handleDailyFinancials = () => {
    setState(prev => {
      let newMoney = prev.gameMoney;
      let newTransactionLog = [...prev.transactionLog];
      let updatedActiveLoans = [...prev.activeLoans];
      let updatedPlayerAssets = [...prev.playerAssets];

      // 1. Pay Salaries
      const totalSalary = prev.staff.hired.reduce((sum, member) => sum + member.salaryPerDay, 0);
      if (totalSalary > 0 && newMoney >= totalSalary) {
        newMoney -= totalSalary;
        newTransactionLog.unshift({ id: `TXN_${Date.now()}_sal`, date: Date.now(), description: 'Staff Salaries', amount: -totalSalary, category: 'Expenses' });
      }      // 2. Process Loan Payments Individually (Only when due)
      if (updatedActiveLoans.length > 0) {
        const paidOffLoanIds = [];
        const currentDate = Date.now();

        updatedActiveLoans = updatedActiveLoans.map(loan => {
          // Check if payment is due (monthly payment schedule)
          const isPaymentDue = !loan.nextPaymentDate || currentDate >= loan.nextPaymentDate;
          
          if (isPaymentDue && newMoney >= loan.emi) {
            newMoney -= loan.emi;
            const newPrincipal = loan.outstandingPrincipal - loan.emi;

            // Log the EMI payment transaction
            newTransactionLog.unshift({
              id: `TXN_${Date.now()}_emi`,
              date: currentDate,
              description: `EMI Payment: ${loan.type} - ${loan.bank}`,
              amount: -loan.emi,
              category: 'Loan'
            });

            if (newPrincipal <= 0) {
              // Loan is paid off
              paidOffLoanIds.push(loan.id);
              
              // If it was a mortgage, free the property
              if (loan.type === 'Mortgage' && loan.assetId) {
                  updatedPlayerAssets = updatedPlayerAssets.map(asset => 
                      asset.id === loan.assetId ? { ...asset, isMortgaged: false } : asset
                  );
              }
              return null; // Mark for removal
            }
            
            // Return the loan with updated principal and next payment date (30 days from now)
            return { 
              ...loan, 
              outstandingPrincipal: newPrincipal,
              nextPaymentDate: currentDate + (30 * 24 * 60 * 60 * 1000), // 30 days
              remainingTenure: Math.max(0, loan.remainingTenure - 1)
            };
          }
          
          return loan; // Payment not due or insufficient funds, return unchanged
        }).filter(Boolean); // Filter out the null (paid off) loans

        if (paidOffLoanIds.length > 0) {
            Alert.alert("Loan(s) Paid Off!", "You have successfully paid off one or more loans.");
        }
      }
      
      // Return the new, complete state object
      return {
        ...prev,
        gameMoney: newMoney,
        activeLoans: updatedActiveLoans,
        playerAssets: updatedPlayerAssets,
        transactionLog: newTransactionLog.slice(0, 100),
      };
    });  };
  
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
    if (!loanDetails) {
      console.error("takeLoan called with invalid loan details");
      return false;
    }

    // Check if there's an existing loan of this type for this asset/bank
    const existingLoan = state.activeLoans.find(loan => {
      if (loanDetails.type === 'Personal') {
        // For personal loans, only restrict if taking from the same bank
        return loan.type === 'Personal' && loan.bank === loanDetails.bank;
      } else {
        // For mortgage loans, restrict if same property (regardless of bank)
        return loan.type === 'Mortgage' && loan.assetId === loanDetails.assetId;
      }
    });

    if (existingLoan) {
      if (loanDetails.type === 'Personal') {
        Alert.alert(
          "Loan Already Exists",
          `You already have an active Personal loan from ${loanDetails.bank}.`
        );
      } else {
        Alert.alert(
          "Loan Already Exists",
          `You already have an active Mortgage loan on this property.`
        );
      }
      return false;
    }

    setState(prev => {
      let updatedAssets = prev.playerAssets;
      
      // If this is a mortgage loan, mark the property as mortgaged
      if (loanDetails.type === 'Mortgage' && loanDetails.assetId) {
        updatedAssets = prev.playerAssets.map(asset => 
          asset.id === loanDetails.assetId 
            ? { ...asset, isMortgaged: true } 
            : asset
        );
      }

      // Create new loan with unique ID and timestamp
      const newLoan = {
        id: `LOAN_${Date.now()}`,
        ...loanDetails,
        startDate: Date.now(),
        nextPaymentDate: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days from now
        monthlyPayment: loanDetails.emi,
        remainingTenure: loanDetails.tenure,
      };

      // Add transaction log
      const loanLog = {
        id: `TXN_${Date.now()}_loan`,
        date: Date.now(),
        description: `${loanDetails.type} Loan from ${loanDetails.bank}`,
        amount: loanDetails.amount,
        category: 'Loan'
      };

      return {
        ...prev,
        gameMoney: prev.gameMoney + loanDetails.amount,
        activeLoans: [...prev.activeLoans, newLoan],
        playerAssets: updatedAssets,
        transactionLog: [loanLog, ...prev.transactionLog].slice(0, 100)
      };
    });

    return true;
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
    });    // Trigger XP addition after the state update.
    if (!state.achievements.boughtFirstProperty) {
        addXp(50);
    }    
    // Track property purchase for marketplace batch system
    trackPropertyPurchaseFromBatch(property.id);
    
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
    
    // Track land purchase for land batch system
    trackLandPurchaseFromBatch(landPlot.id);
    
    return true;
  };

  const assignStaffToProject = (staffMember, projectId, projectType, phases) => {
    const durationDays = calculateProjectDuration(projectType, phases || []);
    const totalSalary = staffMember.salaryPerDay * durationDays;

    if (state.gameMoney < totalSalary) {
      Alert.alert(
        "Insufficient Funds",
        `You need ${totalSalary.toLocaleString()} to hire ${staffMember.name} for the entire project duration (${durationDays} days).`
      );
      return false;
    }    setState(prev => {
      const updatedStaff = {
        ...prev.staff,
        hired: [
          ...prev.staff.hired,
          {
            ...staffMember,
            status: 'On Project',
            assignedProjectId: projectId,
            projectEndDate: Date.now() + (durationDays * 24 * 60 * 60 * 1000),
            prepaidSalary: totalSalary
          }
        ]
      };

      // Update renovation or construction project with assigned staff
      let updatedRenovationProjects = prev.renovationProjects;
      let updatedConstructionProjects = prev.constructionProjects;
      
      if (projectType === 'Renovation' && prev.renovationProjects[projectId]) {
        updatedRenovationProjects = {
          ...prev.renovationProjects,
          [projectId]: {
            ...prev.renovationProjects[projectId],
            assignedStaff: [...(prev.renovationProjects[projectId].assignedStaff || []), staffMember.id]
          }
        };      } else if (projectType === 'Construction' && prev.constructionProjects[projectId]) {
        updatedConstructionProjects = {
          ...prev.constructionProjects,
          [projectId]: {
            ...prev.constructionProjects[projectId],
            assignedStaff: [...(prev.constructionProjects[projectId].assignedStaff || []), staffMember.id]
            // Note: supervisorFee is now tracked upfront in startConstruction, not accumulated here
          }
        };
      }

      // Log the salary payment
      const salaryLog = {
        id: `TXN_${Date.now()}_salary`,
        date: Date.now(),
        description: `Project Salary: ${staffMember.name}`,
        amount: -totalSalary,
        category: 'Staff'
      };

      return {
        ...prev,
        gameMoney: prev.gameMoney - totalSalary,
        staff: updatedStaff,
        renovationProjects: updatedRenovationProjects,
        constructionProjects: updatedConstructionProjects,
        transactionLog: [salaryLog, ...prev.transactionLog].slice(0, 100)
      };
    });

    return true;
  };

  const calculateProjectDuration = (type, phases) => {
    if (type === 'Construction') {
      return phases.reduce((total, phase) => total + phase.duration, 0);
    }
    return RENOVATION_TIME_MS / (1000 * 60 * 60 * 24); // Convert renovation time to days
  };
  const startRenovation = (asset, { navigation } = {}) => {
    if (!navigation) {
      Alert.alert("Error", "Navigation is not available. Please try again.");
      return false;
    }

    // Check if property is already renovated
    if (asset.renovationCompleted) {
      Alert.alert("Already Renovated", "This property has already been renovated and cannot be renovated again.");
      return false;
    }

    // Check if property is currently being renovated
    if (asset.status === 'Renovating') {
      Alert.alert("Already Renovating", "This property is currently being renovated.");
      return false;
    }

    const availableManagers = state.staff.availableToHire.filter(s =>
      s.role === 'Renovation' && 
      !state.staff.hired.some(hired => hired.id === s.id)
    );

    if (availableManagers.length === 0) {
      Alert.alert("No Managers Available", "There are no renovation managers available for hire.");
      return false;
    }    // Calculate renovation cost and value increase
    const totalRenovationCost = asset.renovationCost?.total || 0;
    const valueIncrease = asset.valueIncreaseAfterReno || 0;

    if (state.gameMoney < totalRenovationCost) {
      Alert.alert("Not Enough Funds", `You need $${totalRenovationCost.toLocaleString()} to renovate.`);
      return false;
    }

    // Create the renovation project and then hire staff
    setState(prev => {
      const updatedRenovationProjects = {
        ...prev.renovationProjects,
        [asset.id]: { 
          progress: 0,
          assignedStaff: [],
          status: 'In Progress',
          startDate: Date.now(),
          cost: asset.renovationCost,
          valueIncrease: valueIncrease // Store the value increase amount
        }
      };

      const updatedPlayerAssets = prev.playerAssets.map(a =>
        a.id === asset.id ? { 
          ...a, 
          status: 'Renovating',
          renovationProgress: 0,
          renovationData: {
            cost: asset.renovationCost,
            valueIncrease: valueIncrease // Ensure value increase is stored
          }
        } : a
      );

      const newTransaction = {
        id: `TXN_${Date.now()}`,
        date: Date.now(),
        description: `Renovation: ${asset.name}`,
        amount: -totalRenovationCost,
        category: 'Renovation'
      };

      return {
        ...prev,
        gameMoney: prev.gameMoney - totalRenovationCost,
        renovationProjects: updatedRenovationProjects,
        playerAssets: updatedPlayerAssets,
        transactionLog: [newTransaction, ...prev.transactionLog].slice(0, 100)
      };
    });

    // After creating the project, navigate to staff selection
    navigation.navigate('StaffSelection', {
      projectId: asset.id,
      projectType: 'Renovation',
      requiredRole: 'Renovation'
    });

    return true;
  };

  const listPropertyWithPrice = (asset, askingPrice) => {
    // Validate the asset isn't already sold
    if (asset.status === 'Sold' || state.soldPropertiesLog.some(sp => sp.id.split('_')[0] === asset.id.split('_')[0])) {
      Alert.alert("Error", "This property has already been sold.");
      return false;
    }

    setState(prev => {
      const updatedAssets = prev.playerAssets.map(a => {
        if (a.id === asset.id) {
          return {
            ...a,
            status: 'For Sale',
            askingPrice: askingPrice,
            marketSentiment: 'Standard',
            listedTimestamp: Date.now()
          };
        }
        return a;
      });      // Clear any existing offers for this property
      const updatedOffers = { ...prev.offers };
      delete updatedOffers[asset.id];      // Generate immediate first offer for newly listed property
      const immediateOffer = generateOfferForProperty({
        ...asset,
        status: 'For Sale',
        askingPrice: askingPrice,
        marketSentiment: 'Standard'
      });
      
      console.log('🎯 Immediate offer generation:', {
        assetId: asset.id,
        offer: immediateOffer,
        investment: asset.totalInvestment || asset.invested || asset.purchasePrice
      });
      
      if (immediateOffer) {
        updatedOffers[asset.id] = [immediateOffer];
        console.log('✅ Added immediate offer to state');
      } else {
        console.log('❌ No immediate offer generated');
      }

      return { 
        ...prev, 
        playerAssets: updatedAssets,
        offers: updatedOffers
      };
    });
    return true;
  };

  const acceptOffer = (assetId, offerAmount) => {
    // Pre-checks before state modification
    const asset = state.playerAssets.find(a => a.id === assetId);
    if (!asset) {
      Alert.alert("Error", "Property not found.");
      return false;
    }

    if (asset.status !== 'For Sale') {
      Alert.alert("Error", "This property is not for sale.");
      return false;
    }

    // Check if property is already in a sold state
    if (state.soldPropertiesLog.some(sp => sp.id.split('_')[0] === asset.id.split('_')[0])) {
      Alert.alert("Error", "This property has already been sold.");
      return false;
    }    setState(prev => {
      // Calculate profits and taxes
      // Use totalInvestment for constructed properties, fallback to invested/purchasePrice for regular properties
      const totalInvestment = asset.totalInvestment || asset.invested || asset.purchasePrice;
      const profitOrLoss = offerAmount - totalInvestment;
      let capitalGainsTax = 0;
      if (profitOrLoss > 0) {
        const holdingDurationDays = (Date.now() - asset.purchaseTimestamp) / GAME_DAY_IN_MS;
        const taxRate = holdingDurationDays < 10 ? 0.3 : 0.15;
        capitalGainsTax = Math.round(profitOrLoss * taxRate);
      }

      const netAmount = offerAmount - capitalGainsTax;

      // Create transaction logs
      const saleLog = {
        id: `TXN_${Date.now()}_sale`,
        date: Date.now(),
        description: `Sale: ${asset.name}`,
        amount: offerAmount,
        category: 'Sale'
      };
      const taxLog = {
        id: `TXN_${Date.now()}_tax`,
        date: Date.now(),
        description: 'Capital Gains Tax',
        amount: -capitalGainsTax,
        category: 'Taxes'
      };

      // Create sale record
      const saleRecord = {
        id: asset.id,
        propertyName: asset.name,
        purchasePrice: totalInvestment,
        salePrice: offerAmount,
        profit: profitOrLoss,
        tax: capitalGainsTax,
        date: Date.now()
      };

      // Remove asset and ALL its offers atomically
      const updatedAssets = prev.playerAssets.filter(a => a.id !== asset.id);
      const updatedOffers = { ...prev.offers };
      delete updatedOffers[asset.id];      // Award XP based on profit margin (percentage) rather than absolute profit
      if (profitOrLoss > 0 && totalInvestment > 0) {
        const profitMargin = (profitOrLoss / totalInvestment) * 100; // Convert to percentage
        // Award XP based on profit margin: 10% margin = 25 XP, 20% margin = 50 XP, etc.
        // This prevents rapid leveling from high-value properties
        const xpAmount = Math.floor(profitMargin * PROFIT_MARGIN_XP_MULTIPLIER);
        setTimeout(() => addXp(xpAmount), 0);
      }

      return {
        ...prev,
        gameMoney: prev.gameMoney + netAmount,
        playerAssets: updatedAssets,
        offers: updatedOffers,
        transactionLog: [saleLog, taxLog, ...prev.transactionLog].slice(0, 100),
        soldPropertiesLog: [saleRecord, ...prev.soldPropertiesLog].slice(0, 50)
      };
    });

    return true;
  };
  const installAddOn = (assetId, addOn) => {
    if (!assetId || !addOn) return false;

    // Find the asset by ID
    const asset = state.playerAssets.find(a => a.id === assetId);
    if (!asset) {
      Alert.alert("Error", "Property not found.");
      return false;
    }

    const totalCost = addOn.cost;
    if (state.gameMoney < totalCost) {
      Alert.alert("Insufficient Funds", "You don't have enough money to install this add-on.");
      return false;
    }

    setState(prev => {
      const updatedAssets = prev.playerAssets.map(a => {
        if (a.id === assetId) {
          return {
            ...a,
            installedAddOns: [...(a.installedAddOns || []), addOn.id],
            invested: (a.invested || a.purchasePrice) + addOn.cost,
            marketValue: (a.marketValue || a.purchasePrice) + addOn.valueIncrease
          };
        }
        return a;
      });

      const installLog = {
        id: `TXN_${Date.now()}_addon`,
        date: Date.now(),
        description: `Add-on: ${addOn.name}`,
        amount: -totalCost,
        category: 'Improvements'
      };

      return {
        ...prev,
        gameMoney: prev.gameMoney - totalCost,
        playerAssets: updatedAssets,
        transactionLog: [installLog, ...prev.transactionLog].slice(0, 100)
      };
    });

    return true;
  };  const startConstruction = (landAsset, blueprint, supervisor, architectCost = 0) => {
    if (!landAsset || !blueprint || !supervisor) return false;

    // Validate blueprint has phases
    if (!blueprint.phases || blueprint.phases.length === 0) {
      Alert.alert("Blueprint Error", "Invalid blueprint data.");
      return false;
    }    const firstPhase = blueprint.phases[0];
    
    // Calculate total supervisor fee for the entire project upfront
    const totalProjectDuration = blueprint.phases.reduce((total, phase) => 
      total + Math.round(phase.duration / supervisor.efficiencyModifier), 0);
    const totalSupervisorFee = supervisor.salaryPerDay * totalProjectDuration;
    
    const totalUpfrontCost = firstPhase.cost + architectCost + totalSupervisorFee;
    
    if (!firstPhase || state.gameMoney < totalUpfrontCost) {
      Alert.alert("Insufficient Funds", `You need $${totalUpfrontCost.toLocaleString()} for the first phase, architect fee, and supervisor fee.`);
      return false;
    }

    setState(prev => {      // Create modified phases with efficiency bonus
      const modifiedPhases = blueprint.phases.map(phase => ({
        ...phase,
        duration: Math.round(phase.duration / supervisor.efficiencyModifier)
      }));
      
      // Calculate total supervisor fee for the entire project
      const totalProjectDuration = modifiedPhases.reduce((total, phase) => total + phase.duration, 0);
      const totalSupervisorFee = supervisor.salaryPerDay * totalProjectDuration;

      const newProject = {
        id: landAsset.id,
        blueprintId: blueprint.id,  // Store blueprint ID instead of entire object
        blueprint: blueprint,       // Keep blueprint for immediate access
        modifiedPhases,
        currentPhaseIndex: 0,
        progress: 0,
        status: 'In Progress',
        assignedStaff: [supervisor.id],
        phasesCompleted: [],
        architectCost: architectCost, // Track architect cost
        supervisorFee: totalSupervisorFee // Track total supervisor fee upfront
      };

      const updatedAssets = prev.playerAssets.map(a => 
        a.id === landAsset.id ? { ...a, status: 'Under Construction' } : a
      );

      const transactionLogs = [];
      
      // Log architect fee if there is one
      if (architectCost > 0) {
        transactionLogs.push({
          id: `TXN_${Date.now()}_architect`,
          date: Date.now(),
          description: `Architect Fee`,
          amount: -architectCost,
          category: 'Construction'
        });
      }
        // Log first phase cost
      transactionLogs.push({
        id: `TXN_${Date.now()}_const`,
        date: Date.now(),
        description: `Construction Start: ${firstPhase.name}`,
        amount: -firstPhase.cost,
        category: 'Construction'
      });
      
      // Log supervisor fee
      transactionLogs.push({
        id: `TXN_${Date.now()}_supervisor`,
        date: Date.now(),
        description: `Supervisor Fee: ${supervisor.name}`,
        amount: -totalSupervisorFee,
        category: 'Staff'
      });      return {
        ...prev,
        gameMoney: prev.gameMoney - totalUpfrontCost,
        constructionProjects: { ...prev.constructionProjects, [landAsset.id]: newProject },
        playerAssets: updatedAssets,
        transactionLog: [...transactionLogs, ...prev.transactionLog].slice(0, 100)
      };
    });

    return true;
  };

  const advanceConstructionPhase = (projectId) => {
    setState(prev => {
      const project = prev.constructionProjects[projectId];
      if (!project) return prev;

      const nextPhaseIndex = project.currentPhaseIndex + 1;
      const nextPhase = project.modifiedPhases[nextPhaseIndex];

      if (nextPhase) {
        if (prev.gameMoney < nextPhase.cost) {
          Alert.alert("Insufficient Funds", `You need ${nextPhase.cost.toLocaleString()} to start the next phase.`);
          return prev;
        }

        const phaseStartLog = {
          id: `TXN_${Date.now()}_const`,
          date: Date.now(),
          description: `Construction Phase: ${nextPhase.name}`,
          amount: -nextPhase.cost,
          category: 'Construction'
        };

        // Add current phase to completed phases and start next one
        return {
          ...prev,
          gameMoney: prev.gameMoney - nextPhase.cost,
          constructionProjects: {
            ...prev.constructionProjects,
            [projectId]: {
              ...project,
              currentPhaseIndex: nextPhaseIndex,
              progress: 0,
              status: 'In Progress',
              phasesCompleted: [...project.phasesCompleted, project.currentPhaseIndex]
            }
          },
          transactionLog: [phaseStartLog, ...prev.transactionLog].slice(0, 100)
        };
      } else {        // All phases complete - finalize the construction
        const updatedAssets = prev.playerAssets.map(asset => {
          if (asset.id === projectId) {            // Calculate total investment: land price + construction cost + supervisor fee + architect cost
            const landPrice = asset.purchasePrice || 0;
            const constructionCost = project.blueprint.phases.reduce((total, phase) => total + phase.cost, 0);
            const supervisorFee = project.supervisorFee || 0;
            const architectCost = project.architectCost || 0;
            const totalInvestment = landPrice + constructionCost + supervisorFee + architectCost;
            
            // Set market value with profit margin (30-70% above total investment)
            const profitMultiplier = 1.3 + (Math.random() * 0.4); // 1.3 to 1.7
            const calculatedMarketValue = Math.round(totalInvestment * profitMultiplier);
              return {
              ...asset,
              status: 'Owned',
              type: project.blueprint.type,
              marketValue: calculatedMarketValue,
              constructionCompleted: true,
              totalInvestment: totalInvestment, // Track total investment for future reference
              landCost: landPrice,
              constructionCost: constructionCost,
              supervisorFee: supervisorFee,
              architectCost: architectCost
            };
          }
          return asset;
        });// Return assigned staff to hiring agency
        const staffToReturn = prev.staff.hired.filter(s => project.assignedStaff.includes(s.id));
        const remainingStaff = prev.staff.hired.filter(s => !project.assignedStaff.includes(s.id));
        
        // Reset staff status and prepare to return
        const returnedStaff = staffToReturn.map(s => ({
          ...s,
          status: undefined,
          assignedProjectId: null,
          projectEndDate: null,
          prepaidSalary: null
        }));
        
        // Add returned staff back to availableToHire, avoiding duplicates
        const updatedAvailableStaff = addStaffToAvailable(prev.staff.availableToHire, returnedStaff);

        const { [projectId]: _, ...remainingProjects } = prev.constructionProjects;
        addXp(project.blueprint.xpReward);

        return {          ...prev,
          playerAssets: updatedAssets,
          staff: { 
            hired: remainingStaff,
            availableToHire: updatedAvailableStaff
          },
          constructionProjects: remainingProjects
        };
      }
    });
  };

  const hireAgent = (property, fee) => {
    if (state.gameMoney < fee) {
      Alert.alert("Insufficient Funds", "You don't have enough money for the agent's fee.");
      return false;
    }

    setState(prev => {      // Calculate the agent negotiated price - it should always be less than asking price
      const agentPrice = Math.round(property.askingPrice - property.agentDealDiscount);
      // Ensure price doesn't go below 90% of base value
      const minimumPrice = Math.round(property.baseValue * 0.9);
      const finalAgentPrice = Math.max(agentPrice, minimumPrice);      const agentReport = {
        propertyId: property.id,
        date: Date.now(),
        agentPrice: finalAgentPrice,
        locationScore: property.locationScore,
        areaAverageValue: property.areaAverageValue
      };

      const feeLog = {
        id: `TXN_${Date.now()}_agent`,
        date: Date.now(),
        description: "Agent Inspection Fee",
        amount: -fee,
        category: 'Fees & Services'
      };

      return {
        ...prev,
        gameMoney: prev.gameMoney - fee,
        agentReports: { ...prev.agentReports, [property.id]: agentReport },
        transactionLog: [feeLog, ...prev.transactionLog].slice(0, 100)
      };
    });

    return true;
  };
  const cleanupStuckProjects = () => {
    setState(prev => {
      const stuckRenovationAssets = prev.playerAssets.filter(a => a.status === 'Renovating');
      const stuckConstructionAssets = prev.playerAssets.filter(a => 
        a.status === 'Under Construction' && 
        (!prev.constructionProjects[a.id] || prev.constructionProjects[a.id].blueprintId === 'undefined')
      );
      
      if (stuckRenovationAssets.length === 0 && stuckConstructionAssets.length === 0) return prev;

      console.log('🧹 Cleaning up stuck projects:');
      console.log('- Stuck renovations:', stuckRenovationAssets.length);
      console.log('- Stuck constructions:', stuckConstructionAssets.length);

      // Clean up each stuck asset
      const updatedAssets = prev.playerAssets.map(asset => {
        if (asset.status === 'Renovating') {
          console.log('🔧 Fixing stuck renovation:', asset.id);
          return {
            ...asset,
            status: 'Owned',
            renovationProgress: 100,
            renovationCompleted: true,
            // If we have renovation data, apply it
            ...(asset.renovationData && {
              marketValue: asset.marketValue + (asset.renovationData.valueIncrease || 0)
            })
          };
        }
        if (asset.status === 'Under Construction' && 
            (!prev.constructionProjects[asset.id] || prev.constructionProjects[asset.id].blueprintId === 'undefined')) {
          console.log('🏗️ Fixing stuck construction:', asset.id);
          return {
            ...asset,
            status: 'Owned' // Reset to owned so it can be developed again
          };
        }
        return asset;
      });

      // Clean up invalid construction projects
      const validConstructionProjects = {};
      Object.keys(prev.constructionProjects).forEach(projectId => {
        const project = prev.constructionProjects[projectId];
        if (project && project.blueprint && project.blueprintId !== 'undefined') {
          validConstructionProjects[projectId] = project;
        } else {
          console.log('🗑️ Removing invalid construction project:', projectId);
        }      });

      // Return staff assigned to stuck projects back to hiring agency
      const allStuckAssets = [...stuckRenovationAssets, ...stuckConstructionAssets];
      const staffToReturn = prev.staff.hired.filter(s => 
        s.status === 'On Project' && allStuckAssets.some(a => a.id === s.assignedProjectId)
      );
      const remainingStaff = prev.staff.hired.filter(s => 
        !(s.status === 'On Project' && allStuckAssets.some(a => a.id === s.assignedProjectId))
      );
      
      // Reset staff status and prepare to return to hiring agency
      const returnedStaff = staffToReturn.map(s => ({
        ...s,
        status: undefined,
        assignedProjectId: null,
        projectEndDate: null,
        prepaidSalary: null
      }));
        // Add returned staff back to availableToHire, avoiding duplicates
      const updatedAvailableStaff = addStaffToAvailable(prev.staff.availableToHire, returnedStaff);

      // Clear out renovation projects for stuck assets
      const updatedRenovationProjects = {};
      
      return {
        ...prev,
        playerAssets: updatedAssets,
        staff: { 
          hired: remainingStaff,
          availableToHire: updatedAvailableStaff
        },
        renovationProjects: updatedRenovationProjects,
        constructionProjects: validConstructionProjects // Use cleaned construction projects
      };
    });
  };
  const returnAllStaffToHiringAgency = () => {
    setState(prev => {
      // Get all hired staff and prepare them to return
      const staffToReturn = prev.staff.hired.map(s => ({
        ...s,
        status: undefined,
        assignedProjectId: null,
        projectEndDate: null,
        prepaidSalary: null
      }));

      // Add them back to availableToHire, avoiding duplicates
      const updatedAvailableStaff = addStaffToAvailable(prev.staff.availableToHire, staffToReturn);

      // Reset ongoing projects
      const updatedRenovationProjects = {};
      const updatedConstructionProjects = {};

      // Update assets that were under construction/renovation
      const updatedAssets = prev.playerAssets.map(asset => {
        if (asset.status === 'Under Construction' || asset.status === 'Renovating') {
          return {
            ...asset,
            status: 'Owned'
          };
        }
        return asset;
      });

      return {
        ...prev,
        playerAssets: updatedAssets,
        staff: {
          hired: [], // Clear all hired staff
          availableToHire: updatedAvailableStaff
        },        renovationProjects: updatedRenovationProjects,
        constructionProjects: updatedConstructionProjects
      };
    });
  };

  // --- MARKETPLACE BATCH SYSTEM ---
  // Helper function to get eligible properties for the current player level
  const getEligiblePropertiesForLevel = (level, excludeOwned = true, excludeSold = true) => {
    let eligibleProperties = PROPERTY_LIST.filter(p => {
      const meetsLevelRequirement = level >= p.minLevel;
      return meetsLevelRequirement;
    });    if (excludeOwned && state.playerAssets) {
      const ownedPropertyIds = state.playerAssets.map(asset => asset.id.split('_')[0]);
      eligibleProperties = eligibleProperties.filter(p => !ownedPropertyIds.includes(p.id));
    }

    if (excludeSold && state.soldPropertiesLog) {
      const soldPropertyOriginalIds = state.soldPropertiesLog.map(log => log.id.split("_")[0]);
      eligibleProperties = eligibleProperties.filter(p => !soldPropertyOriginalIds.includes(p.id));
    }

    return eligibleProperties;
  };

  // Shuffle array helper
  const shuffleArray = (array) => {
    const shuffled = [...array];
    let currentIndex = shuffled.length, randomIndex;
    while (currentIndex > 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [shuffled[currentIndex], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[currentIndex]];
    }
    return shuffled;
  };

  // Generate a new batch of 5 properties for the marketplace
  const generateNewMarketplaceBatch = () => {
    const eligibleProperties = getEligiblePropertiesForLevel(state.playerLevel);
    
    if (eligibleProperties.length === 0) {
      // No eligible properties available
      setState(prev => ({
        ...prev,
        currentMarketplaceBatch: [],
        marketplaceBatchPurchased: []
      }));
      return;
    }

    // Shuffle and take up to 5 properties
    const shuffled = shuffleArray(eligibleProperties);
    const newBatch = shuffled.slice(0, Math.min(5, shuffled.length));

    setState(prev => ({
      ...prev,
      currentMarketplaceBatch: newBatch,
      marketplaceBatchPurchased: []
    }));
  };
  // Check if all properties in current batch have been purchased
  const isCurrentBatchCompleted = () => {
    if (!state.currentMarketplaceBatch || state.currentMarketplaceBatch.length === 0) return true;
    if (!state.marketplaceBatchPurchased) return false;
    return state.marketplaceBatchPurchased.length >= state.currentMarketplaceBatch.length;
  };  // Track when a property is purchased from the current batch
  const trackPropertyPurchaseFromBatch = (propertyId) => {
    if (!state.currentMarketplaceBatch || !state.marketplaceBatchPurchased) return;
    
    const propertyInCurrentBatch = state.currentMarketplaceBatch.find(p => p.id === propertyId);
    
    if (propertyInCurrentBatch && !state.marketplaceBatchPurchased.includes(propertyId)) {
      setState(prev => ({
        ...prev,
        marketplaceBatchPurchased: [...(prev.marketplaceBatchPurchased || []), propertyId]
      }));
    }
  };

  // --- LAND MARKET BATCH SYSTEM ---
  // Helper function to get eligible land plots for the current player level
  const getEligibleLandPlotsForLevel = (level, excludeOwned = true) => {
    let eligibleLandPlots = LAND_PLOT_LIST.filter(plot => {
      const meetsLevelRequirement = level >= plot.minLevel;
      return meetsLevelRequirement;
    });

    if (excludeOwned && state.playerAssets) {
      const ownedLandIds = state.playerAssets
        .filter(asset => asset.assetType === 'Land')
        .map(asset => asset.id.split('_')[0]);
      eligibleLandPlots = eligibleLandPlots.filter(plot => !ownedLandIds.includes(plot.id));
    }

    return eligibleLandPlots;
  };

  // Generate a new batch of 5 land plots for the land market
  const generateNewLandBatch = () => {
    const eligibleLandPlots = getEligibleLandPlotsForLevel(state.playerLevel);
    
    if (eligibleLandPlots.length === 0) {
      // No eligible land plots available
      setState(prev => ({
        ...prev,
        currentLandBatch: [],
        landBatchPurchased: []
      }));
      return;
    }

    // Sort by price (asking price) and take up to 5 land plots
    const sorted = [...eligibleLandPlots].sort((a, b) => a.askingPrice - b.askingPrice);
    const newBatch = sorted.slice(0, Math.min(5, sorted.length));

    setState(prev => ({
      ...prev,
      currentLandBatch: newBatch,
      landBatchPurchased: []
    }));
  };

  // Check if all land plots in current batch have been purchased
  const isCurrentLandBatchCompleted = () => {
    if (!state.currentLandBatch || state.currentLandBatch.length === 0) return true;
    if (!state.landBatchPurchased) return false;
    return state.landBatchPurchased.length >= state.currentLandBatch.length;
  };

  // Track when a land plot is purchased from the current batch
  const trackLandPurchaseFromBatch = (landPlotId) => {
    if (!state.currentLandBatch || !state.landBatchPurchased) return;
    
    const landPlotInCurrentBatch = state.currentLandBatch.find(plot => plot.id === landPlotId);
    
    if (landPlotInCurrentBatch && !state.landBatchPurchased.includes(landPlotId)) {
      setState(prev => ({        ...prev,
        landBatchPurchased: [...(prev.landBatchPurchased || []), landPlotId]
      }));
    }
  };

  const value = {
    ...state,
    xpForNextLevel,
    logTransaction, addXp, triggerAchievement,
    assignStaffToProject, returnAllStaffToHiringAgency,
    takeLoan, preCloseLoan,
    buyProperty, buyLand, startRenovation, listPropertyWithPrice, acceptOffer,
    installAddOn, startConstruction, advanceConstructionPhase, hireAgent, completeTutorial,
    cleanupInvalidConstructionProjects, // Add cleanup function
    // Marketplace batch functions
    generateNewMarketplaceBatch, isCurrentBatchCompleted, trackPropertyPurchaseFromBatch,
    // Land market batch functions
    generateNewLandBatch, isCurrentLandBatchCompleted, trackLandPurchaseFromBatch
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};