import { fetchPriceUpdates } from "./fetch-prices.js";



export async function main() {
 
  const { priceIds, priceUpdates, connection } = await fetchPriceUpdates();
  
  const originalCalldata = priceUpdates.binary.data[0];
 
  console.log(`Original calldata length: ${originalCalldata.length} characters`);
  
  const decodedData = decodeAccumulatorUpdateData(originalCalldata);
  console.log(`Total price feeds found: ${decodedData.priceFeedCount}`);
  console.log(`VAA size: ${decodedData.vaaSize} bytes`);
  
  const selectedPriceFeeds = decodedData.priceFeeds.slice(0, 5);
  
  displaySelectedAssets(selectedPriceFeeds);
 
  const filteredCalldata = encodeAccumulatorUpdateData(decodedData.vaa, selectedPriceFeeds);
  const formattedPayload = filteredCalldata.startsWith('0x') ? filteredCalldata : `0x${filteredCalldata}`;
  
  console.log(`Re-encoded calldata successfully`);
  console.log(`Original size: ${originalCalldata.length} characters`);
  console.log(`Filtered size: ${formattedPayload.length} characters`);
  
  const isValid = validateAccumulatorUpdateData(formattedPayload);

  console.log(`calldata param for updatePriceFeeds() function: \n "${formattedPayload}";`);
    
  return {
    originalCalldata,
    filteredCalldata: formattedPayload,
    selectedAssets: selectedPriceFeeds.length,
    originalSize: originalCalldata.length,
    filteredSize: formattedPayload.length,
    isValid
  };
}

interface AccumulatorUpdateData {
  vaa: Buffer;
  vaaSize: number;
  priceFeeds: PriceFeed[];
  priceFeedCount: number;
}

interface PriceFeed {
  id: Buffer;           // 32 bytes price feed identifier
  price: bigint;        // Price value
  conf: bigint;         // Confidence interval
  expo: number;         // Price exponent
  publishTime: bigint;  // Publish timestamp
  prevPublishTime: bigint; // Previous publish timestamp
  emaPrice: bigint;     // Exponential moving average price
  emaConf: bigint;      // EMA confidence
}

function decodeAccumulatorUpdateData(calldata: string): AccumulatorUpdateData {
  // Remove 0x prefix if present
  const cleanHex = calldata.startsWith('0x') ? calldata.slice(2) : calldata;
  const buffer = Buffer.from(cleanHex, 'hex');
  
  let offset = 0;
  
  // Parse AccumulatorUpdateData header (official format)
  const magic = buffer.readUInt32BE(offset);
  if (magic !== 0x504e4155) {
    // It has to be "PNAU" as shown in the contract
    throw new Error('Invalid AccumulatorUpdateData magic');
  }
  offset += 4;
  
  // Version info
  const majorVersion = buffer.readUInt8(offset);
  const minorVersion = buffer.readUInt8(offset + 1);
  offset += 2;
  
  // Trailing header size (skip)
  const trailingHeaderSize = buffer.readUInt8(offset);
  offset += 1;
  
  // Update type (should be 0 for price update)
  const updateType = buffer.readUInt8(offset);
  offset += 1;
  
  // VAA size (2 bytes big endian)
  const vaaSize = buffer.readUInt16BE(offset);
  offset += 2;
  
  // Extract VAA data
  const vaa = buffer.subarray(offset, offset + vaaSize);
  offset += vaaSize;
  
  // Number of updates (1 byte)
  const numUpdates = buffer.readUInt8(offset);
  offset += 1;
  
  // Parse price feed updates
  const priceFeeds: PriceFeed[] = [];
  
  for (let i = 0; i < numUpdates; i++) {
    // Message size (2 bytes)
    const messageSize = buffer.readUInt16BE(offset);
    offset += 2;
    
    // Price feed message (following official format)
    const message = buffer.subarray(offset, offset + messageSize);
    const priceFeed = parsePriceFeedMessage(message);
    priceFeeds.push(priceFeed);
    offset += messageSize;
    
    // Number of proofs (1 byte)
    const numProofs = buffer.readUInt8(offset);
    offset += 1;
    
    // Skip proof data (20 bytes per proof)
    offset += numProofs * 20;
  }
  
  return {
    vaa,
    vaaSize,
    priceFeeds,
    priceFeedCount: priceFeeds.length
  };
}

function parsePriceFeedMessage(message: Buffer): PriceFeed {
  let offset = 0;
  
  // Message type (should be 0 for price feed)
  const messageType = message.readUInt8(offset);
  offset += 1;
  
  // Price feed ID (32 bytes)
  const id = message.subarray(offset, offset + 32);
  offset += 32;
  
  // Price (8 bytes, signed big endian)
  const price = message.readBigInt64BE(offset);
  offset += 8;
  
  // Confidence (8 bytes, unsigned big endian)
  const conf = message.readBigUInt64BE(offset);
  offset += 8;
  
  // Exponent (4 bytes, signed big endian)
  const expo = message.readInt32BE(offset);
  offset += 4;
  
  // Publish time (8 bytes, unsigned big endian)
  const publishTime = message.readBigUInt64BE(offset);
  offset += 8;
  
  // Previous publish time (8 bytes, unsigned big endian)
  const prevPublishTime = message.readBigUInt64BE(offset);
  offset += 8;
  
  // EMA price (8 bytes, signed big endian)
  const emaPrice = message.readBigInt64BE(offset);
  offset += 8;
  
  // EMA confidence (8 bytes, unsigned big endian)
  const emaConf = message.readBigUInt64BE(offset);
  offset += 8;
  
  return {
    id,
    price,
    conf,
    expo,
    publishTime,
    prevPublishTime,
    emaPrice,
    emaConf
  };
}

function encodeAccumulatorUpdateData(vaa: Buffer, priceFeeds: PriceFeed[]): string {
  const buffers: Buffer[] = [];
  
  // AccumulatorUpdateData header 
  const header = Buffer.alloc(8);
  let offset = 0;
  
  // Magic: "PNAU" (0x504e4155)
  header.writeUInt32BE(0x504e4155, offset);
  offset += 4;
  
  // Version: major=1, minor=0
  header.writeUInt8(1, offset);
  header.writeUInt8(0, offset + 1);
  offset += 2;
  
  // Trailing header size: 0
  header.writeUInt8(0, offset);
  offset += 1;
  
  // Update type: 0 (price update)
  header.writeUInt8(0, offset);
  offset += 1;
  
  buffers.push(header);
  
  // VAA size (2 bytes big endian)
  const vaaSizeBuffer = Buffer.alloc(2);
  vaaSizeBuffer.writeUInt16BE(vaa.length, 0);
  buffers.push(vaaSizeBuffer);
  
  // VAA data
  buffers.push(vaa);
  
  // Number of updates (1 byte)
  const numUpdatesBuffer = Buffer.alloc(1);
  numUpdatesBuffer.writeUInt8(priceFeeds.length, 0);
  buffers.push(numUpdatesBuffer);
  
  // Encode each price feed update
  for (const priceFeed of priceFeeds) {
    // Create price feed message
    const message = encodePriceFeedMessage(priceFeed);
    
    // Message size (2 bytes big endian)
    const messageSizeBuffer = Buffer.alloc(2);
    messageSizeBuffer.writeUInt16BE(message.length, 0);
    buffers.push(messageSizeBuffer);
    
    // Message data
    buffers.push(message);
    
    // Number of proofs: 0 (we'll use empty proofs for simplicity)
    const numProofsBuffer = Buffer.alloc(1);
    numProofsBuffer.writeUInt8(0, 0);
    buffers.push(numProofsBuffer);
  }
  
  // Combine all buffers and return as hex
  const result = Buffer.concat(buffers);
  return result.toString('hex');
}

/**
 * Encode price feed message following official Pyth format
 */
function encodePriceFeedMessage(priceFeed: PriceFeed): Buffer {
  // 1 byte: message type
  // 32 bytes: price feed ID
  // 8 bytes: price (signed)
  // 8 bytes: confidence (unsigned)
  // 4 bytes: exponent (signed)
  // 8 bytes: publish time (unsigned)
  // 8 bytes: previous publish time (unsigned)
  // 8 bytes: EMA price (signed)
  // 8 bytes: EMA confidence (unsigned)
  // Total: 1 + 32 + 8 + 8 + 4 + 8 + 8 + 8 + 8 = 85 bytes
  const message = Buffer.alloc(85);
  let offset = 0;
  
  // Message type: 0 (price feed)
  message.writeUInt8(0, offset);
  offset += 1;
  
  // Price feed ID (32 bytes)
  if (priceFeed.id.length !== 32) {
    throw new Error(`Invalid price feed ID length: ${priceFeed.id.length}, expected 32`);
  }
  priceFeed.id.copy(message, offset);
  offset += 32;
  
  // Price (8 bytes, signed big endian)
  message.writeBigInt64BE(priceFeed.price, offset);
  offset += 8;
  
  // Confidence (8 bytes, unsigned big endian)
  message.writeBigUInt64BE(priceFeed.conf, offset);
  offset += 8;
  
  // Exponent (4 bytes, signed big endian)
  message.writeInt32BE(priceFeed.expo, offset);
  offset += 4;
  
  // Publish time (8 bytes, unsigned big endian)
  message.writeBigUInt64BE(priceFeed.publishTime, offset);
  offset += 8;
  
  // Previous publish time (8 bytes, unsigned big endian)
  message.writeBigUInt64BE(priceFeed.prevPublishTime, offset);
  offset += 8;
  
  // EMA price (8 bytes, signed big endian)
  message.writeBigInt64BE(priceFeed.emaPrice, offset);
  offset += 8;
  
  // EMA confidence (8 bytes, unsigned big endian)
  message.writeBigUInt64BE(priceFeed.emaConf, offset);
  offset += 8;
  
  if (offset !== 85) {
    throw new Error(`Message encoding error: offset ${offset}, expected 85`);
  }
  
  return message;
}

/**
 * Validate AccumulatorUpdateData format
 */
function validateAccumulatorUpdateData(calldata: string): boolean {
  try {
    const decoded = decodeAccumulatorUpdateData(calldata);
    return decoded.priceFeedCount > 0 && decoded.vaaSize > 0;
  } catch (error) {
    return false;
  }
}

////////////////////////////////////////////////////////////
// Helper Functions
////////////////////////////////////////////////////////////

// Display selected assets
function displaySelectedAssets(priceFeeds: PriceFeed[]) {
  console.log('\nSelected assets:');
  console.log(priceFeeds.map(feed => feed.id.toString('hex')));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
} 


