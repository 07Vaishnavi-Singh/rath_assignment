import { fetchPriceUpdates } from "./fetch-prices.js";

export async function selectiveEncodeUpdates() {

  const { priceIds, priceUpdates , connection} = await fetchPriceUpdates();
  const selectedIds = priceIds.slice(0, 5);
  
  console.log(`\n Selected first 5 assets for filtered VAA creation:`);
  selectedIds.forEach((id, index) => {
    console.log(`${index + 1}. ${id.substring(0, 8)}...${id.substring(id.length - 8)}`);
  });
  
  // Get latest price updates for ONLY the selected 5 assets
  console.log(`\n Creating filtered VAA for selected 5 assets...`);
  const filteredUpdates = await connection.getLatestPriceUpdates(selectedIds);
  console.log(`Created filtered VAA with ${filteredUpdates.binary.data.length} binary entries`);
  console.log(`Parsed data for ${filteredUpdates.parsed?.length || 0} assets`);
  
  // Extract and display data for the selected assets
  const selectedParsedData: any[] = [];
  
  if (filteredUpdates.parsed) {
    console.log(`Asset Details in Filtered VAA:`);
    
    filteredUpdates.parsed.forEach((update: any, index: number) => {
      selectedParsedData.push(update);
      
      const formattedPrice = (parseInt(update.price.price) / Math.pow(10, Math.abs(update.price.expo))).toFixed(2);
      const publishTime = new Date(update.price.publish_time * 1000).toISOString();
      
      console.log(`${index + 1}. Asset: ${update.id.substring(0, 8)}...${update.id.substring(update.id.length - 8)}`);
      console.log(`Price: $${formattedPrice}`);
      console.log(`Confidence: ±${(parseInt(update.price.conf) / Math.pow(10, Math.abs(update.price.expo))).toFixed(4)}`);
      console.log(`Published: ${publishTime}`);
    });
  }
  
  // Get the raw VAA payload
  let rawPayload = filteredUpdates.binary.data[0];
  
  // Ensure proper 0x prefix for Solidity bytes format
  const formattedPayload = rawPayload.startsWith('0x') ? rawPayload : `0x${rawPayload}`;
  
  console.log(`\n VAA Payload for updatePriceFeeds():`);
  console.log(`Format: bytes (with 0x prefix)`);
  console.log(`Length: ${formattedPayload.length} characters`);
  console.log(`Payload: ${formattedPayload.substring(0, 100)}...`);
  
  // Validate the payload format
  const isValidHex = /^0x[0-9a-fA-F]+$/.test(formattedPayload);
  console.log(`Valid hex format: ${isValidHex ? 'YES' : 'NO'}`);
  
  // Show how to use in Solidity
  console.log(`\n Solidity Usage:`);
  console.log(`bytes[] memory updateData = new bytes[](1);`);
  console.log(`updateData[0] = hex"${formattedPayload.slice(2)}"; // Remove 0x for hex literal`);
  console.log(`// OR`);
  console.log(`updateData[0] = "${formattedPayload}"; // Direct hex string`);
  
  // Calculate estimated fee (this is approximate)
  const numUpdates = filteredUpdates.parsed?.length || 0;
  console.log(`\n Fee Information:`);
  console.log(`Number of price updates: ${numUpdates}`);
  console.log(`Estimated fee required: Call getTotalFee(${numUpdates}) on contract`);
  
  return {
    payload: formattedPayload,
    numUpdates: numUpdates,
    selectedAssets: selectedIds,
    isValid: isValidHex
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  selectiveEncodeUpdates().catch(console.error);
} 