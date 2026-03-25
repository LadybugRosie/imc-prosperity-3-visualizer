import type { Algorithm, ActivityLogRow, OrderDepth, Trade, TradingState } from '../models.ts';

export interface TutorialCsvFile {
  name: string;
  content: string;
}

interface ParsedPriceRow extends ActivityLogRow {
  rawTimestamp: number;
}

interface ParsedTradeRow extends Trade {
  day: number;
  rawTimestamp: number;
}

function parseCsv(content: string): string[][] {
  return content
    .trim()
    .split(/\r?\n/)
    .filter(line => line.length > 0)
    .map(line => line.split(';'));
}

function getDayFromFilename(fileName: string): number | null {
  const match = fileName.match(/day_(-?\d+)/);
  return match === null ? null : Number(match[1]);
}

function getNumber(value: string | undefined): number | undefined {
  if (value === undefined || value === '') {
    return undefined;
  }

  return Number(value);
}

function getTimestampStep(rows: ParsedPriceRow[]): number {
  const timestamps = [...new Set(rows.map(row => row.rawTimestamp))].sort((a, b) => a - b);

  let step = Number.POSITIVE_INFINITY;
  for (let i = 1; i < timestamps.length; i++) {
    const diff = timestamps[i] - timestamps[i - 1];
    if (diff > 0) {
      step = Math.min(step, diff);
    }
  }

  return Number.isFinite(step) ? step : 100;
}

function buildDayOffsets(days: number[], daySpan: number): Map<number, number> {
  const sortedDays = [...days].sort((a, b) => a - b);
  const offsets = new Map<number, number>();

  sortedDays.forEach((day, index) => {
    offsets.set(day, index * daySpan);
  });

  return offsets;
}

function getEffectiveTimestamp(dayOffsets: Map<number, number>, day: number, rawTimestamp: number): number {
  return dayOffsets.get(day)! + rawTimestamp;
}

function parsePriceFiles(files: TutorialCsvFile[]): ParsedPriceRow[] {
  const rows: ParsedPriceRow[] = [];

  for (const file of files) {
    const [header, ...dataRows] = parseCsv(file.content);
    const indices = Object.fromEntries(header.map((column, index) => [column, index]));

    for (const columns of dataRows) {
      rows.push({
        day: Number(columns[indices.day]),
        rawTimestamp: Number(columns[indices.timestamp]),
        timestamp: Number(columns[indices.timestamp]),
        product: columns[indices.product],
        bidPrices: [1, 2, 3].flatMap(level => {
          const value = getNumber(columns[indices[`bid_price_${level}`]]);
          return value === undefined ? [] : [value];
        }),
        bidVolumes: [1, 2, 3].flatMap(level => {
          const value = getNumber(columns[indices[`bid_volume_${level}`]]);
          return value === undefined ? [] : [value];
        }),
        askPrices: [1, 2, 3].flatMap(level => {
          const value = getNumber(columns[indices[`ask_price_${level}`]]);
          return value === undefined ? [] : [value];
        }),
        askVolumes: [1, 2, 3].flatMap(level => {
          const value = getNumber(columns[indices[`ask_volume_${level}`]]);
          return value === undefined ? [] : [value];
        }),
        midPrice: Number(columns[indices.mid_price]),
        profitLoss: Number(columns[indices.profit_and_loss]),
      });
    }
  }

  return rows;
}

function parseTradeFiles(files: TutorialCsvFile[], knownDays: number[]): ParsedTradeRow[] {
  const rows: ParsedTradeRow[] = [];

  for (const file of files) {
    const inferredDay = getDayFromFilename(file.name);
    const day = inferredDay ?? knownDays[0];

    const [header, ...dataRows] = parseCsv(file.content);
    const indices = Object.fromEntries(header.map((column, index) => [column, index]));

    for (const columns of dataRows) {
      rows.push({
        symbol: columns[indices.symbol],
        price: Number(columns[indices.price]),
        quantity: Number(columns[indices.quantity]),
        buyer: columns[indices.buyer] || '',
        seller: columns[indices.seller] || '',
        timestamp: Number(columns[indices.timestamp]),
        rawTimestamp: Number(columns[indices.timestamp]),
        day,
      });
    }
  }

  return rows;
}

function getOrderDepth(row: ParsedPriceRow): OrderDepth {
  const buyOrders: Record<number, number> = {};
  const sellOrders: Record<number, number> = {};

  row.bidPrices.forEach((price, index) => {
    buyOrders[price] = row.bidVolumes[index];
  });

  row.askPrices.forEach((price, index) => {
    sellOrders[price] = -Math.abs(row.askVolumes[index]);
  });

  return {
    buyOrders,
    sellOrders,
  };
}

export function parseTutorialCsvFiles(files: TutorialCsvFile[]): Algorithm {
  const priceFiles = files.filter(file => file.name.startsWith('prices_') && file.name.endsWith('.csv'));
  const tradeFiles = files.filter(file => file.name.startsWith('trades_') && file.name.endsWith('.csv'));

  if (priceFiles.length === 0) {
    throw new Error('No price CSV files found.');
  }

  const parsedPriceRows = parsePriceFiles(priceFiles);
  const knownDays = [...new Set(parsedPriceRows.map(row => row.day))];
  const parsedTradeRows = parseTradeFiles(tradeFiles, knownDays);

  const daySpan = Math.max(...parsedPriceRows.map(row => row.rawTimestamp)) + getTimestampStep(parsedPriceRows);
  const dayOffsets = buildDayOffsets(knownDays, daySpan);

  parsedPriceRows.forEach(row => {
    row.timestamp = getEffectiveTimestamp(dayOffsets, row.day, row.rawTimestamp);
  });

  parsedTradeRows.forEach(row => {
    row.timestamp = getEffectiveTimestamp(dayOffsets, row.day, row.rawTimestamp);
  });

  const activityLogs = [...parsedPriceRows].sort((a, b) => a.timestamp - b.timestamp);
  const products = [...new Set(activityLogs.map(row => row.product))].sort((a, b) => a.localeCompare(b));
  const listings = Object.fromEntries(
    products.map(product => [
      product,
      {
        symbol: product,
        product,
        denomination: 'XIRECS',
      },
    ]),
  );

  const rowsByTimestamp = new Map<number, ParsedPriceRow[]>();
  for (const row of activityLogs) {
    if (!rowsByTimestamp.has(row.timestamp)) {
      rowsByTimestamp.set(row.timestamp, []);
    }

    rowsByTimestamp.get(row.timestamp)!.push(row);
  }

  const marketTradesByTimestamp = new Map<number, Record<string, Trade[]>>();
  for (const trade of parsedTradeRows) {
    if (!marketTradesByTimestamp.has(trade.timestamp)) {
      marketTradesByTimestamp.set(trade.timestamp, {});
    }

    const tradesBySymbol = marketTradesByTimestamp.get(trade.timestamp)!;
    if (tradesBySymbol[trade.symbol] === undefined) {
      tradesBySymbol[trade.symbol] = [];
    }

    tradesBySymbol[trade.symbol].push({
      symbol: trade.symbol,
      price: trade.price,
      quantity: trade.quantity,
      buyer: trade.buyer,
      seller: trade.seller,
      timestamp: trade.timestamp,
    });
  }

  const data = [...rowsByTimestamp.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([timestamp, rows]) => {
      const orderDepths = Object.fromEntries(rows.map(row => [row.product, getOrderDepth(row)]));

      const state: TradingState = {
        timestamp,
        traderData: '',
        listings,
        orderDepths,
        ownTrades: {},
        marketTrades: marketTradesByTimestamp.get(timestamp) ?? {},
        position: {},
        observations: {
          plainValueObservations: {},
          conversionObservations: {},
        },
      };

      return {
        state,
        orders: {},
        conversions: 0,
        traderData: '',
        algorithmLogs: '',
        sandboxLogs: '',
      };
    });

  return {
    activityLogs,
    data,
  };
}
