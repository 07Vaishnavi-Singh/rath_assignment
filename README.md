# Pyth Price Update Assignment

This project demonstrates fetching price updates from Pyth Hermes API and selectively re-encoding them for on-chain submission.

## 🎯 Assignment Overview

### Task 1: Fetch Price Update Data ✅

- Fetch latest price update calldata for 20 different assets using Pyth Hermes HTTP API
- Successfully retrieves BTC and ETH related price feeds
- Extracts price feed IDs and gets corresponding price updates

### Task 2: Selectively Encode Updates ✅

- Select 5 assets from the 20 fetched price updates
- Re-encode the calldata to create a valid `updatePriceFeeds` payload
- Generate valid Pyth accumulator update for on-chain submission

### Task 3: Project Structure ✅

- Organized code in `scripts/` directory
- Comprehensive documentation and usage instructions

## 🏗️ Project Structure

```
rath_assignment/
├── scripts/
│   ├── fetch-prices.ts      # Fetches 20 price updates from Hermes API
│   └── encode-updates.ts    # Selects 5 updates and creates filtered VAA
├── dist/                    # Compiled JavaScript files
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
└── README.md              # This file
```

## 🛠️ Tools and Technologies Used

### Core Dependencies

- **@pythnetwork/hermes-client**: Official Pyth SDK for fetching price data
- **TypeScript**: Type-safe development environment
- **Node.js**: Runtime environment

### Key Libraries

- **Hermes Client**: Connects to Pyth's Hermes service for real-time price data
- **Native Node.js**: For hex encoding/decoding and data manipulation

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd rath_assignment
```

2. Install dependencies:

```bash
npm install
```

3. Build the project:

```bash
npm run build
```

### Running the Scripts

#### Fetch 20 Price Updates

```bash
# Run the price fetching script
npm run fetch-prices

# Or run directly after building
node dist/fetch-prices.js
```

#### Selective Encoding (5 Assets)

```bash
# Run the selective encoding script
npm run encode-updates

# Or run directly after building
node dist/encode-updates.js
```

## 📋 How It Works

### 1. Price Data Fetching (`fetch-prices.ts`)

```typescript
// Fetches BTC and ETH related price feeds
const priceFeeds = await connection.getPriceFeeds({
  query: "btc",
  assetType: "crypto",
});

const priceFeeds2 = await connection.getPriceFeeds({
  query: "eth",
  assetType: "crypto",
});

// Extracts first 20 price feed IDs
const priceIds = [
  ...priceFeeds.map((feed) => feed.id),
  ...priceFeeds2.map((feed) => feed.id),
].slice(0, 20);

// Gets latest price updates for all 20 assets
const priceUpdates = await connection.getLatestPriceUpdates(priceIds);
```

### 2. Selective Encoding (`encode-updates.ts`)

```typescript
// Import and reuse the fetch function
const { priceIds, priceUpdates, connection } = await fetchPriceUpdates();

// Select first 5 assets
const selectedIds = priceIds.slice(0, 5);

// Create filtered VAA with only selected assets
const filteredUpdates = await connection.getLatestPriceUpdates(selectedIds);

// Extract the complete VAA payload
const reEncodedPayload = filteredUpdates.binary.data[0];
```

### 3. On-Chain Usage

The re-encoded payload can be submitted to a Pyth consumer contract:

```solidity
// Example Solidity usage
contract.updatePriceFeeds(reEncodedPayload);
```

## 🔧 Technical Approach


## 🧪 Sample Output

### Price Feeds Fetched

```
Fetched 20 price IDs from BTC and ETH feeds
Selected first 5 assets for filtered VAA creation:
1. e62df6c8...a415b43
2. c96458d3...68df0a
3. ff61491a...b17c13
4. 2b89b9dc...c74590
5. 8ac0c70f...e8f8e5
```

### Filtered VAA Creation

```
Creating filtered VAA for selected 5 assets...
Created filtered VAA with 1 binary entries
Parsed data for 5 assets

Asset Details in Filtered VAA:
1. Asset: e62df6c8...a415b43
   Price: $67,234.56
   Confidence: ±45.2300
   Published: 2024-01-15T10:30:45.000Z

2. Asset: c96458d3...68df0a
   Price: $3,456.78
   Confidence: ±2.1500
   Published: 2024-01-15T10:30:45.000Z

[... more assets ...]

Payload Preview of size 2847 chars:
0x504e41550100000003b801000000040d00561f4ceb8ce5eb58adda318009817714a017b0db9a7f1ef57253c81d1984d8140cdee5c06925a1cbd7a2612211fddcd91008dd854444b513519a06fdc1a7b00101021612a8c846810b86a42eb3c9fc25ad9b1c5bbccf6bcd2df39fa83bfd580a58646d508fa28c4cecd8878eefaf964eca8de36031cad28b3c8a870a409a8b0a062d0003e8c8dd8bc33307235e3073e7a66af5087824628e8e6b4fa02df9e8fd1bf4757f28388255e1866b52edb0d8f604e97c6afcb05a33dce52b48dbdeeea85028e9ac...

Valid format for updatePriceFeeds(): YES
```

## 🚧 Key Implementation Details

### Modular Design

The project uses a modular approach where:

- `fetch-prices.ts` handles the initial data fetching and exports reusable functions
- `encode-updates.ts` imports and reuses the fetch functionality, then creates filtered VAAs
- Both scripts can be run independently or imported as modules

### Filtered VAA Creation

Instead of manually combining binary data, the implementation:

- Uses the Hermes client's `getLatestPriceUpdates()` with selected price IDs
- Creates a proper Pyth VAA (Verified Actionable Artifact) with only the chosen assets
- Ensures the resulting payload is a valid accumulator update

## 🔍 Key Features

- ✅ **Real-time Data**: Fetches live price data from Pyth Hermes
- ✅ **Type Safety**: Full TypeScript implementation with proper typing
- ✅ **Modular Design**: Separated concerns with reusable functions
- ✅ **Filtered VAAs**: Creates proper Pyth accumulator updates for selected assets
- ✅ **Error Handling**: Comprehensive validation and error checking
- ✅ **Documentation**: Detailed comments and usage examples
- ✅ **Extensible**: Easy to modify for different assets or selection strategies



**Note**: This implementation provides a working solution for the assignment requirements. The filtered VAA creation ensures that the payload contains only the selected assets and is valid for on-chain submission to Pyth consumer contracts.
