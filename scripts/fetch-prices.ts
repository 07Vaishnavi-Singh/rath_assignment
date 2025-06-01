import { HermesClient } from "@pythnetwork/hermes-client";

export async function fetchPriceUpdates() {
  const connection = new HermesClient("https://hermes.pyth.network", {});
 
  const priceFeeds = await connection.getPriceFeeds({
    query: "btc",
  });

  const priceFeeds2 = await connection.getPriceFeeds({
    query: "eth",
  });

  const priceIds = [
    ...priceFeeds.map(feed => feed.id),
    ...priceFeeds2.map(feed => feed.id)
  ].slice(0, 20);

  const priceUpdates = await connection.getLatestPriceUpdates(priceIds);

  return { priceIds, priceUpdates, connection  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  fetchPriceUpdates().catch(console.error);
} 