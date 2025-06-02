# Pyth Network Price Feed Optimizer

A TypeScript implementation for decoding, filtering, and re-encoding Pyth Network price feed data to create gas-optimized blockchain transactions.

## Features

- Decode AccumulatorUpdateData from Pyth Network
- Filter and select specific price feeds
- Re-encode optimized calldata for smart contracts
- Validate output compatibility with Pyth contracts

## Installation

```bash
npm install
```

## Usage

### Build and Run

```bash
npm run build
npm run start
```

### Fetch Price Updates Only

```bash
npm run fetch-prices
```

## Architecture

### Data Flow

1. **Fetch** → Hermes API retrieves AccumulatorUpdateData
2. **Decode** → Parse binary format (PNAU header + VAA + price feeds)
3. **Filter** → Select subset of price feeds (first 5)
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

## Output

The script generates optimized calldata for the `updatePriceFeeds()` function:

- **Size Reduction**: ~65% smaller than original
- **Format**: Hex string ready for blockchain transactions
- **Compatibility**: Full Pyth Network contract compatibility

## Dependencies

- `@pythnetwork/hermes-client`: Pyth price data API
- TypeScript + Node.js: Runtime and build tools

## License

ISC




```




