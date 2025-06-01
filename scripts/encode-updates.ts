import { fetchPriceUpdates } from "./fetch-prices.js";

/**
 * Fetches 20 price feeds, selects first 5, and creates a VAA payload for updatePriceFeeds()
 */
export async function selectiveEncodeUpdates() {
  const { priceIds, priceUpdates, connection } = await fetchPriceUpdates();
  
  console.log(`Fetched ${priceIds.length} price feed IDs`);
  
  const selectedIds = priceIds.slice(0, 5);
  logSelectedAssets(selectedIds);
  
  const filteredUpdates = await connection.getLatestPriceUpdates(selectedIds);
  logVAACreation(filteredUpdates);
  
  logAssetDetails(filteredUpdates);
  
  // Get the raw VAA payload
  let rawPayload = filteredUpdates.binary.data[0];
  
  // Ensure proper 0x prefix for Solidity bytes format
  const formattedPayload = rawPayload.startsWith('0x') ? rawPayload : `0x${rawPayload}`;
  
  // Validate the payload format
  const isValidHex = /^0x[0-9a-fA-F]+$/.test(formattedPayload);
  
  logPayloadInfo(formattedPayload, isValidHex);
  logSolidityUsage(formattedPayload);
  
  return {
    payload: formattedPayload,
    selectedAssets: selectedIds,
    isValid: isValidHex
  };
}

////////////////////////////////////////////////////////////
// Helper Functions 
////////////////////////////////////////////////////////////

//  function to log selected assets
function logSelectedAssets(selectedIds: string[]) {
  console.log(`\nSelected first 5 assets for filtered VAA creation:`);
  selectedIds.forEach((id, index) => {
    console.log(`${index + 1}. ${id.substring(0, 8)}...${id.substring(id.length - 8)}`);
  });
}

//  function to log VAA creation progress
function logVAACreation(filteredUpdates: any) {
  console.log(`\nCreating filtered VAA for selected 5 assets...`);
  console.log(`Created filtered VAA with ${filteredUpdates.binary.data.length} binary entries`);
  console.log(`Parsed data for ${filteredUpdates.parsed?.length || 0} assets`);
}

//  function to log asset details
function logAssetDetails(filteredUpdates: any) {
  if (filteredUpdates.parsed) {
    console.log(`\n Asset Details in Filtered VAA:`);
    
    filteredUpdates.parsed.forEach((update: any, index: number) => {
      const formattedPrice = (parseInt(update.price.price) / Math.pow(10, Math.abs(update.price.expo))).toFixed(2);
      const publishTime = new Date(update.price.publish_time * 1000).toISOString();
      
      console.log(`${index + 1}. Asset: ${update.id.substring(0, 8)}...${update.id.substring(update.id.length - 8)}`);
      console.log(`   Price: $${formattedPrice}`);
    });
  }
}

//  function to log payload information
function logPayloadInfo(formattedPayload: string, isValidHex: boolean) {
  console.log(`\n VAA Payload for updatePriceFeeds():`);
  console.log(`Length: ${formattedPayload.length} characters`);
  console.log(`Payload: ${formattedPayload.substring(0, 100)}...`);
  console.log(`Valid hex format: ${isValidHex ? 'YES' : 'NO'}`);
}

//  function to log Solidity usage examples
function logSolidityUsage(formattedPayload: string) {
  console.log(`\n Function CAall to Pyth Network uses this function parameter : bytes[] memory updateData`);
  console.log(`updateData[0] = ${formattedPayload}`);
}


if (import.meta.url === `file://${process.argv[1]}`) {
  selectiveEncodeUpdates().catch(console.error);
} 


