# Profit Calculation Fix for Constructed Properties - Complete

## Issue Description
When selling constructed properties, the game was calculating gross profit using only the land value (`asset.purchasePrice`) instead of the total investment, which includes:
- Land cost
- Construction cost
- Architect fee  
- Supervisor fee
- Any upgrades

This resulted in:
- **Artificially inflated profits** (showing much higher gains than actual)
- **Excessive capital gains taxes** (taxing on the inflated profit)
- **Players losing significant money** due to incorrect tax calculations

## Root Cause
Two functions were using the wrong investment calculation:

1. **GameContext.js - `acceptOffer` function (line 1022)**
2. **PortfolioScreen.js - `handleAcceptOffer` function (line 102)**

Both were using: `asset.invested || asset.purchasePrice`  
Instead of: `asset.totalInvestment || asset.invested || asset.purchasePrice`

## Example Impact
For a constructed property with:
- Land cost: $50,000
- Construction: $75,000  
- Supervisor: $12,000
- Architect: $8,000
- **Total investment: $145,000**
- **Sale price: $180,000**

### Before Fix (WRONG):
- Profit = $180,000 - $50,000 = **$130,000**
- Tax (15%) = **$19,500**
- Net gain = $160,500

### After Fix (CORRECT):
- Profit = $180,000 - $145,000 = **$35,000**  
- Tax (15%) = **$5,250**
- Net gain = $174,750

### Player Savings:
- **$95,000** more accurate profit calculation
- **$14,250** tax savings
- **Total benefit: $109,250** per transaction

## Fixes Applied

### 1. GameContext.js - acceptOffer Function
**Before:**
```javascript
const totalInvestment = asset.invested || asset.purchasePrice;
```

**After:**
```javascript
// Use totalInvestment for constructed properties, fallback to invested/purchasePrice for regular properties
const totalInvestment = asset.totalInvestment || asset.invested || asset.purchasePrice;
```

### 2. PortfolioScreen.js - handleAcceptOffer Function  
**Before:**
```javascript
const totalInvestment = asset.invested || asset.purchasePrice;
```

**After:**
```javascript
// Use totalInvestment for constructed properties, fallback to invested/purchasePrice for regular properties
const totalInvestment = asset.totalInvestment || asset.invested || asset.purchasePrice;
```

## Verification

### Test Results
Created and ran `test-profit-calculation-fix.js`:
- ✅ Regular properties: Use `invested` amount correctly
- ✅ Constructed properties: Now use `totalInvestment` correctly  
- ✅ Profit calculation: Accurate for both property types
- ✅ Tax calculation: Based on correct profit amounts
- ✅ Money savings: Players no longer lose money to inflated taxes

### Code Audit
Verified that all other locations in the codebase already use the correct pattern:
- `GameContext.js` line 38 ✅
- `GameContext.js` line 1001 ✅  
- `ListingDetailScreen.js` line 19 ✅
- Other helper functions ✅

## Files Modified
- `d:\Cursor\games\tycoon-re\GameContext.js` - Fixed acceptOffer function
- `d:\Cursor\games\tycoon-re\src\PortfolioScreen.js` - Fixed handleAcceptOffer function
- `d:\Cursor\games\tycoon-re\docs-and-tests\test-profit-calculation-fix.js` - Created test

## Impact
- ✅ Correct profit calculation for all property types
- ✅ Accurate capital gains tax calculation  
- ✅ Players no longer lose money due to calculation errors
- ✅ Fair and realistic financial gameplay
- ✅ Maintained backward compatibility with regular properties

## Business Logic
The fix maintains the correct fallback hierarchy:
1. **Constructed properties**: Use `totalInvestment` (includes all costs)
2. **Renovated properties**: Use `invested` (purchase + renovation costs)
3. **Regular properties**: Use `purchasePrice` (original purchase cost)

This ensures accurate profit calculation for all property types while preserving existing save game compatibility.
