import { ConversionObservation } from '../models.ts';

const preferredOrder = [
  'bidPrice',
  'askPrice',
  'transportFees',
  'exportTariff',
  'importTariff',
  'sunlight',
  'humidity',
];

const hiddenAliases = new Set(['sugarPrice', 'sunlightIndex']);

const labels: Record<string, string> = {
  bidPrice: 'Bid price',
  askPrice: 'Ask price',
  transportFees: 'Transport fees',
  exportTariff: 'Export tariff',
  importTariff: 'Import tariff',
  sunlight: 'Sunlight',
  humidity: 'Humidity',
  sugarPrice: 'Sugar price',
  sunlightIndex: 'Sunlight index',
};

export const conversionObservationPriceKeys = ['bidPrice', 'askPrice'];
export const conversionObservationTransportKeys = ['transportFees', 'exportTariff', 'importTariff'];

export function normalizeConversionObservation(observation: Record<string, number>): ConversionObservation {
  const normalized: ConversionObservation = { ...observation };

  if (normalized.sunlight === undefined && normalized.sugarPrice !== undefined) {
    normalized.sunlight = normalized.sugarPrice;
  }

  if (normalized.humidity === undefined && normalized.sunlightIndex !== undefined) {
    normalized.humidity = normalized.sunlightIndex;
  }

  if (normalized.sugarPrice === undefined && normalized.sunlight !== undefined) {
    normalized.sugarPrice = normalized.sunlight;
  }

  if (normalized.sunlightIndex === undefined && normalized.humidity !== undefined) {
    normalized.sunlightIndex = normalized.humidity;
  }

  return normalized;
}

export function getVisibleConversionObservationKeys(observations: Record<string, ConversionObservation>): string[] {
  const keys = new Set<string>();

  for (const observation of Object.values(observations)) {
    for (const key of Object.keys(observation)) {
      if (!hiddenAliases.has(key)) {
        keys.add(key);
      }
    }
  }

  return [...keys].sort((a, b) => {
    const orderA = preferredOrder.indexOf(a);
    const orderB = preferredOrder.indexOf(b);

    if (orderA !== -1 || orderB !== -1) {
      if (orderA === -1) {
        return 1;
      }

      if (orderB === -1) {
        return -1;
      }

      return orderA - orderB;
    }

    return a.localeCompare(b);
  });
}

export function formatConversionObservationKey(key: string): string {
  if (labels[key] !== undefined) {
    return labels[key];
  }

  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/^./, value => value.toUpperCase());
}
