# Pyth Network Price Feed Filtering

## Overview

TypeScript implementation for fetching Pyth Network price feeds and creating filtered VAAs (Verifiable Action Approvals) containing only 5 selected assets for efficient on-chain price updates.

## Approach

1. **Data Fetching**: Connect to Pyth Hermes API to retrieve 20 crypto asset price feeds using keyword - eth and bitcoin.
2. **Selective Filtering**: Extract first 5 assets from the dataset (as instructed).
3. **VAA Generation**: Create new VAA containing only selected price feeds using `getLatestPriceUpdates()`
4. **Payload Formatting**: Format output as valid hex bytes for Solidity `updatePriceFeeds()` function and  Proper `0x` prefix for Solidity compatibility 

## Technical Implementation


### Key Functions

```typescript
// Fetch all available price feeds
const { priceIds, priceUpdates, connection } = await fetchPriceUpdates();

// Create filtered VAA for selected assets
const filteredUpdates = await connection.getLatestPriceUpdates(selectedIds);

// Format for Solidity bytes[] parameter
const formattedPayload = `0x${rawPayload}`;
```

## Tools Used

- **TypeScript**: Type-safe development
- **@pythnetwork/hermes-client**: Official Pyth Network client
- **Node.js**: Runtime environment
- **npm**: Package management and build scripts

## Challenges Encountered

1. **Hex Format Compatibility**: Ensuring proper `0x` prefix for Solidity `bytes[]` parameterr eady for submission to Pyth consumer contracts via `updatePriceFeeds(updateData)`.
3. **VAA Structure**: Understanding binary data access patterns (`binary.data[0]`) 

## Output Format

Generates Solidity-compatible payload:

```solidity
bytes[] memory updateData = new bytes[](1);
updateData[0] = "0x504e4155..."; 
```

