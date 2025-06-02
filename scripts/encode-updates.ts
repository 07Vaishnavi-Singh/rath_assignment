import { fetchPriceUpdates } from "./fetch-prices.js";

export async function main() {
  const { priceIds, priceUpdates, connection } = await fetchPriceUpdates();
  const originalCalldata = priceUpdates.binary.data[0];
  
  const decodedData = decodeAccumulatorUpdateData(originalCalldata);
  const selectedPriceFeeds = decodedData.priceFeeds.slice(0, 5);
  
  const filteredCalldata = encodeAccumulatorUpdateData(decodedData.vaa, selectedPriceFeeds);
  const formattedPayload = filteredCalldata.startsWith('0x') ? filteredCalldata : `0x${filteredCalldata}`;
  
  console.log(`Original calldata: ${originalCalldata.length} characters`);
  console.log(`Filtered calldata: ${formattedPayload.length} characters`);
  console.log(`Selected ${selectedPriceFeeds.length} price feeds`);
  console.log('\nCalldata for updatePriceFeeds():');
  console.log(formattedPayload);
    
  return {
    originalCalldata,
    filteredCalldata: formattedPayload,
    selectedAssets: selectedPriceFeeds.length,
    originalSize: originalCalldata.length,
    filteredSize: formattedPayload.length,
    isValid: validateAccumulatorUpdateData(formattedPayload)
  };
}

interface AccumulatorUpdateData {
  vaa: Buffer;
  vaaSize: number;
  priceFeeds: PriceFeedUpdate[];
  priceFeedCount: number;
}

interface PriceFeedUpdate {
  priceFeed: PriceFeed;
  proofs: Buffer[];
}

interface PriceFeed {
  id: Buffer;
  price: bigint;
  conf: bigint;
  expo: number;
  publishTime: bigint;
  prevPublishTime: bigint;
  emaPrice: bigint;
  emaConf: bigint;
}

function decodeAccumulatorUpdateData(calldata: string): AccumulatorUpdateData {
  const cleanHex = calldata.startsWith('0x') ? calldata.slice(2) : calldata;
  const buffer = Buffer.from(cleanHex, 'hex');
  
  let offset = 0;
  
  const magic = buffer.readUInt32BE(offset);
  if (magic !== 0x504e4155) {
    throw new Error('Invalid AccumulatorUpdateData magic');
  }
  offset += 4;
  
  const majorVersion = buffer.readUInt8(offset);
  const minorVersion = buffer.readUInt8(offset + 1);
  offset += 2;
  
  const trailingHeaderSize = buffer.readUInt8(offset);
  offset += 1;
  
  const updateType = buffer.readUInt8(offset);
  offset += 1;
  
  const vaaSize = buffer.readUInt16BE(offset);
  offset += 2;
  
  const vaa = buffer.subarray(offset, offset + vaaSize);
  offset += vaaSize;
  
  const numUpdates = buffer.readUInt8(offset);
  offset += 1;
  
  const priceFeeds: PriceFeedUpdate[] = [];
  
  for (let i = 0; i < numUpdates; i++) {
    const messageSize = buffer.readUInt16BE(offset);
    offset += 2;
    
    const message = buffer.subarray(offset, offset + messageSize);
    const priceFeed = parsePriceFeedMessage(message);
    offset += messageSize;
    
    const numProofs = buffer.readUInt8(offset);
    offset += 1;
    
    const proofs: Buffer[] = [];
    for (let j = 0; j < numProofs; j++) {
      const proof = buffer.subarray(offset, offset + 20);
      proofs.push(proof);
      offset += 20;
    }
    
    priceFeeds.push({ priceFeed, proofs });
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
  
  const messageType = message.readUInt8(offset);
  offset += 1;
  
  const id = message.subarray(offset, offset + 32);
  offset += 32;
  
  const price = message.readBigInt64BE(offset);
  offset += 8;
  
  const conf = message.readBigUInt64BE(offset);
  offset += 8;
  
  const expo = message.readInt32BE(offset);
  offset += 4;
  
  const publishTime = message.readBigUInt64BE(offset);
  offset += 8;
  
  const prevPublishTime = message.readBigUInt64BE(offset);
  offset += 8;
  
  const emaPrice = message.readBigInt64BE(offset);
  offset += 8;
  
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

function encodeAccumulatorUpdateData(vaa: Buffer, priceFeedUpdates: PriceFeedUpdate[]): string {
  const buffers: Buffer[] = [];
  
  const header = Buffer.alloc(8);
  let offset = 0;
  
  header.writeUInt32BE(0x504e4155, offset);
  offset += 4;
  
  header.writeUInt8(1, offset);
  header.writeUInt8(0, offset + 1);
  offset += 2;
  
  header.writeUInt8(0, offset);
  offset += 1;
  
  header.writeUInt8(0, offset);
  offset += 1;
  
  buffers.push(header);
  
  const vaaSizeBuffer = Buffer.alloc(2);
  vaaSizeBuffer.writeUInt16BE(vaa.length, 0);
  buffers.push(vaaSizeBuffer);
  
  buffers.push(vaa);
  
  const numUpdatesBuffer = Buffer.alloc(1);
  numUpdatesBuffer.writeUInt8(priceFeedUpdates.length, 0);
  buffers.push(numUpdatesBuffer);
  
  for (const priceFeedUpdate of priceFeedUpdates) {
    const message = encodePriceFeedMessage(priceFeedUpdate.priceFeed);
    
    const messageSizeBuffer = Buffer.alloc(2);
    messageSizeBuffer.writeUInt16BE(message.length, 0);
    buffers.push(messageSizeBuffer);
    
    buffers.push(message);
    
    const numProofsBuffer = Buffer.alloc(1);
    numProofsBuffer.writeUInt8(priceFeedUpdate.proofs.length, 0);
    buffers.push(numProofsBuffer);
    
    for (const proof of priceFeedUpdate.proofs) {
      buffers.push(proof);
    }
  }
  
  const result = Buffer.concat(buffers);
  return result.toString('hex');
}

function encodePriceFeedMessage(priceFeed: PriceFeed): Buffer {
  const message = Buffer.alloc(85);
  let offset = 0;
  
  message.writeUInt8(0, offset);
  offset += 1;
  
  if (priceFeed.id.length !== 32) {
    throw new Error(`Invalid price feed ID length: ${priceFeed.id.length}, expected 32`);
  }
  priceFeed.id.copy(message, offset);
  offset += 32;
  
  message.writeBigInt64BE(priceFeed.price, offset);
  offset += 8;
  
  message.writeBigUInt64BE(priceFeed.conf, offset);
  offset += 8;
  
  message.writeInt32BE(priceFeed.expo, offset);
  offset += 4;
  
  message.writeBigUInt64BE(priceFeed.publishTime, offset);
  offset += 8;
  
  message.writeBigUInt64BE(priceFeed.prevPublishTime, offset);
  offset += 8;
  
  message.writeBigInt64BE(priceFeed.emaPrice, offset);
  offset += 8;
  
  message.writeBigUInt64BE(priceFeed.emaConf, offset);
  offset += 8;
  
  if (offset !== 85) {
    throw new Error(`Message encoding error: offset ${offset}, expected 85`);
  }
  
  return message;
}

function validateAccumulatorUpdateData(calldata: string): boolean {
  try {
    const decoded = decodeAccumulatorUpdateData(calldata);
    return decoded.priceFeedCount > 0 && decoded.vaaSize > 0;
  } catch (error) {
    return false;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
} 


