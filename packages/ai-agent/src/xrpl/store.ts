import type { SettlementResult } from "./types.js";

const settlements = new Map<string, SettlementResult>();

// fulfillment storage: key = "ownerAddress:escrowSequence" -> fulfillment hex
const fulfillments = new Map<string, string>();

export function saveSettlement(
  marketId: string,
  result: SettlementResult
): void {
  settlements.set(marketId, result);
}

export function getSettlement(
  marketId: string
): SettlementResult | undefined {
  return settlements.get(marketId);
}

export function getSettlementByReport(
  reportId: string
): SettlementResult | undefined {
  for (const s of settlements.values()) {
    if (s.reportId === reportId) return s;
  }
  return undefined;
}

export function getAllSettlements(): SettlementResult[] {
  return Array.from(settlements.values());
}

export function storeFulfillment(
  ownerAddress: string,
  sequence: number,
  fulfillment: string
): void {
  fulfillments.set(`${ownerAddress}:${sequence}`, fulfillment);
}

export function getFulfillment(
  ownerAddress: string,
  sequence: number
): string | undefined {
  return fulfillments.get(`${ownerAddress}:${sequence}`);
}
