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
  
  // This is a complete VAA with only our 5 selected assets
  const reEncodedPayload = filteredUpdates.binary.data[0];
    
  console.log(`\n Payload Preview of size ${reEncodedPayload.length} chars:`);
  console.log(`${reEncodedPayload.substring(0, 100)}...`);
  
  // Validate the payload
  const isValidFormat = reEncodedPayload.startsWith('0x') || /^[0-9a-fA-F]+$/.test(reEncodedPayload);
  console.log(`Valid format for updatePriceFeeds(): ${isValidFormat ? 'YES' : 'NO'}`);
  
}

if (import.meta.url === `file://${process.argv[1]}`) {
  selectiveEncodeUpdates().catch(console.error);
} 