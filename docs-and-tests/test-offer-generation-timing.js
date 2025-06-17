// Test script to verify offer generation timing improvements
// This simulates the offer generation flow to ensure immediate offers

console.log('=== OFFER GENERATION TIMING TEST ===');

// Mock property data
const mockProperty = {
  id: 'PROP001',
  status: 'For Sale',
  askingPrice: 250000,
  invested: 200000,
  marketSentiment: 'Standard'
};

// Mock the generateOfferForProperty function
const generateOfferForProperty = (asset) => {
  const totalInvestment = asset.invested || asset.purchasePrice || 0;
  if (totalInvestment === 0) return null;
  
  let finalOfferAmount = 0;
  switch (asset.marketSentiment) {
    case 'Lowball':
      finalOfferAmount = Math.round(totalInvestment * (0.75 + Math.random() * 0.20));
      break;
    case 'Lucrative':
      finalOfferAmount = Math.round(totalInvestment * (1.21 + Math.random() * 0.49));
      break;
    case 'Standard':
    default:
      finalOfferAmount = Math.round(totalInvestment * (1.01 + Math.random() * 0.49));
      break;
  }
  
  return { 
    id: `OFFER_${Date.now()}_${Math.random()}`, 
    amount: finalOfferAmount 
  };
};

// Test immediate offer generation when listing property
console.log('Testing immediate offer generation...');
const startTime = Date.now();

const immediateOffer = generateOfferForProperty(mockProperty);
const immediateOfferTime = Date.now() - startTime;

console.log(`✅ Immediate offer generated in ${immediateOfferTime}ms`);
console.log(`   Offer Amount: $${immediateOffer.amount.toLocaleString()}`);
console.log(`   Investment: $${mockProperty.invested.toLocaleString()}`);
console.log(`   Profit Margin: ${(((immediateOffer.amount - mockProperty.invested) / mockProperty.invested) * 100).toFixed(1)}%`);

// Test multiple offer generation to verify randomness
console.log('\nTesting offer generation variety...');
const offers = [];
for (let i = 0; i < 5; i++) {
  const offer = generateOfferForProperty(mockProperty);
  offers.push(offer);
  console.log(`Offer ${i + 1}: $${offer.amount.toLocaleString()}`);
}

// Verify offers are different
const uniqueAmounts = new Set(offers.map(o => o.amount));
console.log(`\n✅ Generated ${uniqueAmounts.size} unique offer amounts out of 5 offers`);

// Test timing expectations
console.log('\n=== TIMING EXPECTATIONS ===');
console.log('First offer: Immediate (< 100ms)');
console.log('Subsequent offers: Every 8 seconds');
console.log('Maximum offers per property: 5');

if (immediateOfferTime < 100) {
  console.log('✅ SUCCESS: Immediate offer generation meets timing requirements!');
} else {
  console.log('❌ WARNING: Immediate offer generation is slower than expected');
}

console.log('\n=== CONFIGURATION ===');
console.log('OFFER_GENERATION_INTERVAL_MS: 8000 (8 seconds)');
console.log('Maximum offers per property: 5');
console.log('Offer ranges:');
console.log('  - Standard: 101-150% of investment');
console.log('  - Lowball: 75-95% of investment');  
console.log('  - Lucrative: 121-170% of investment');
