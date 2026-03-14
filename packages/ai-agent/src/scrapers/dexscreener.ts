import type { TokenMarketData } from "@lapis/shared";

interface DexScreenerPair {
  chainId: string;
  dexId: string;
  pairAddress: string;
  baseToken: { address: string; name: string; symbol: string };
  priceUsd: string | null;
  fdv: number | null;
  marketCap: number | null;
  liquidity: { usd: number } | null;
  volume: { h24: number } | null;
  priceChange: { h24: number } | null;
  url: string;
}

interface DexScreenerResponse {
  pairs: DexScreenerPair[] | null;
}

const TIMEOUT_MS = 10_000;

/**
 * Fetch token market data from DexScreener.
 * Non-critical — returns null on any failure.
 */
export async function scrapeTokenData(
  tokenAddress: string,
  chain?: string
): Promise<TokenMarketData | null> {
  try {
    let pairs = await fetchTokenEndpoint(tokenAddress);

    // fallback to search endpoint if primary returns nothing
    if (!pairs || pairs.length === 0) {
      pairs = await fetchSearchEndpoint(tokenAddress);
    }

    if (!pairs || pairs.length === 0) {
      console.warn(`DexScreener: no pairs found for ${tokenAddress}`);
      return null;
    }

    // filter by chain if specified
    let filtered = chain
      ? pairs.filter((p) => p.chainId === chain)
      : pairs;

    // fall back to unfiltered if chain filter yields nothing
    if (filtered.length === 0) {
      filtered = pairs;
    }

    // pick the highest liquidity pair
    const best = filtered.reduce((a, b) => {
      const liqA = a.liquidity?.usd ?? 0;
      const liqB = b.liquidity?.usd ?? 0;
      return liqB > liqA ? b : a;
    });

    return {
      address: best.baseToken.address,
      chain: best.chainId,
      name: best.baseToken.name,
      symbol: best.baseToken.symbol,
      priceUsd: best.priceUsd ?? "0",
      marketCap: best.marketCap ?? null,
      fdv: best.fdv ?? null,
      liquidity: best.liquidity?.usd ?? null,
      volume24h: best.volume?.h24 ?? null,
      priceChange24h: best.priceChange?.h24 ?? null,
      pairAddress: best.pairAddress,
      dexId: best.dexId,
      url: best.url,
    };
  } catch (err) {
    console.warn(
      `DexScreener scrape failed for ${tokenAddress}:`,
      (err as Error).message
    );
    return null;
  }
}

async function fetchTokenEndpoint(
  address: string
): Promise<DexScreenerPair[] | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const res = await fetch(
      `https://api.dexscreener.com/tokens/v1/${address}`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (!res.ok) return null;

    // The tokens endpoint may return an array directly or an object with pairs
    const json = await res.json();
    if (Array.isArray(json)) {
      return json as DexScreenerPair[];
    }
    return (json as DexScreenerResponse).pairs ?? null;
  } catch {
    return null;
  }
}

async function fetchSearchEndpoint(
  query: string
): Promise<DexScreenerPair[] | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const res = await fetch(
      `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (!res.ok) return null;

    const json = (await res.json()) as DexScreenerResponse;
    return json.pairs ?? null;
  } catch {
    return null;
  }
}
