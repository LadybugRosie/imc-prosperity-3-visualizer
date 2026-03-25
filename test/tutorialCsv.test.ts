import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { parseTutorialCsvFiles } from '../src/utils/tutorialCsv.ts';

test('parseTutorialCsvFiles converts a minimal tutorial CSV pair into algorithm data', () => {
  const algorithm = parseTutorialCsvFiles([
    {
      name: 'prices_round_0_day_-1.csv',
      content: [
        'day;timestamp;product;bid_price_1;bid_volume_1;bid_price_2;bid_volume_2;bid_price_3;bid_volume_3;ask_price_1;ask_volume_1;ask_price_2;ask_volume_2;ask_price_3;ask_volume_3;mid_price;profit_and_loss',
        '-1;0;EMERALDS;9999;3;;;;;10001;4;;;;;10000.0;12.0',
        '-1;100;EMERALDS;9998;2;;;;;10002;5;;;;;10000.0;15.0',
      ].join('\n'),
    },
    {
      name: 'trades_round_0_day_-1.csv',
      content: [
        'timestamp;buyer;seller;symbol;currency;price;quantity',
        '100;;;EMERALDS;XIRECS;10001.0;2',
      ].join('\n'),
    },
  ]);

  assert.equal(algorithm.activityLogs.length, 2);
  assert.equal(algorithm.data.length, 2);
  assert.deepEqual(Object.keys(algorithm.data[0].state.listings), ['EMERALDS']);
  assert.equal(algorithm.data[1].state.marketTrades.EMERALDS.length, 1);
  assert.equal(algorithm.data[1].state.marketTrades.EMERALDS[0].price, 10001);
  assert.equal(algorithm.activityLogs[0].profitLoss, 12);
});

test('parseTutorialCsvFiles parses the real Prosperity 4 tutorial CSVs', async () => {
  const baseDir = '/Users/davidhovey/Downloads/Tutorial Round 1';

  const files = await Promise.all([
    'prices_round_0_day_-2.csv',
    'prices_round_0_day_-1.csv',
    'trades_round_0_day_-2.csv',
    'trades_round_0_day_-1.csv',
  ].map(async name => ({
    name,
    content: await readFile(`${baseDir}/${name}`, 'utf8'),
  })));

  const algorithm = parseTutorialCsvFiles(files);
  const symbols = Object.keys(algorithm.data[0].state.listings).sort();

  assert.ok(algorithm.activityLogs.length > 1000);
  assert.ok(algorithm.data.length > 1000);
  assert.deepEqual(symbols, ['EMERALDS', 'TOMATOES']);
  assert.ok(algorithm.data.every((row, index, rows) => index === 0 || row.state.timestamp > rows[index - 1].state.timestamp));
  assert.ok(algorithm.data.some(row => Object.keys(row.state.marketTrades).length > 0));
});
