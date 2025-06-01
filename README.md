# Pyth Network Price 

## Overview

TypeScript implementation for decoding, filtering, and re-encoding Pyth Network price feed data for gas-optimized blockchain transactions.

## Quick Start

```bash
npm install && npm run build && npm start
```

## Core Implementation

```typescript
import { implementAssignmentApproach } from "./scripts/encode-updates.js";

const result = await implementAssignmentApproach();
console.log(
  `Size reduction: ${(
    ((result.originalSize - result.filteredSize) / result.originalSize) *
    100
  ).toFixed(1)}%`
);
```

## Architecture

### Data Flow

1. **Fetch** → Hermes API retrieves AccumulatorUpdateData
2. **Decode** → Parse binary format (PNAU header + VAA + price feeds)
3. **Filter** → Select subset of price feeds
4. **Re-encode** → Reconstruct optimized payload
5. **Validate** → Ensure Pyth contract compatibility

### Price Feed Message Format (85 bytes)

```
[1B] Message Type (0x00)
[32B] Feed ID
[8B] Price (signed int64 BE)
[8B] Confidence (uint64 BE)
[4B] Exponent (int32 BE)
[8B] Publish Time (uint64 BE)
[8B] Previous Publish Time (uint64 BE)
[8B] EMA Price (signed int64 BE)
[8B] EMA Confidence (uint64 BE)
```

### Key Functions

- `decodeAccumulatorUpdateData()` - Parses binary Pyth format
- `parsePriceFeedMessage()` - Extracts individual price data
- `encodeAccumulatorUpdateData()` - Reconstructs filtered payload
- `encodePriceFeedMessage()` - Converts struct to binary


## Tech Stack

- TypeScript + Node.js
- @pythnetwork/hermes-client
- Binary data manipulation (Buffer)
