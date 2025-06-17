// Quick test to verify offer generation timing
// Run this to simulate the offer generation process

const OFFER_GENERATION_INTERVAL_MS = 5000; // 5 seconds

// Mock generateOfferForProperty function
const generateOfferForProperty = (asset) => {
  const totalInvestment = asset.totalInvestment || asset.invested || asset.purchasePrice || 0;
  if (totalInvestment === 0) return null;
  
  const finalOfferAmount = Math.round(totalInvestment * (1.01 + Math.random() * 0.49));
  return { 
    id: `OFFER_${Date.now()}_${Math.random()}`, 
    amount: finalOfferAmount 
  };
};

// Mock property
const mockProperty = {
  id: 'PROP001',
  status: 'For Sale',
  askingPrice: 250000,
  invested: 200000,
  marketSentiment: 'Standard'
};

console.log('=== OFFER GENERATION TIMING TEST ===');
console.log('Testing immediate offer generation...');

// Test immediate offer
const startTime = Date.now();
const immediateOffer = generateOfferForProperty(mockProperty);
const immediateTime = Date.now() - startTime;

console.log(`✅ Immediate offer: ${immediateTime}ms`);
console.log(`   Amount: $${immediateOffer.amount.toLocaleString()}`);

// Test interval timing
console.log(`\nInterval set to: ${OFFER_GENERATION_INTERVAL_MS}ms (${OFFER_GENERATION_INTERVAL_MS/1000} seconds)`);

let intervalCount = 0;
const testInterval = setInterval(() => {
  intervalCount++;
  const offer = generateOfferForProperty(mockProperty);
  console.log(`Interval ${intervalCount}: Generated $${offer.amount.toLocaleString()}`);
  
  if (intervalCount >= 3) {
    clearInterval(testInterval);
    console.log('✅ Interval test completed');
  }
}, OFFER_GENERATION_INTERVAL_MS);

console.log('⏰ Waiting for interval offers...');
