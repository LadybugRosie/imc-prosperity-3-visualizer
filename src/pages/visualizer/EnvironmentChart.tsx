import Highcharts from 'highcharts';
import { ReactNode } from 'react';
import { ProsperitySymbol } from '../../models.ts';
import { useStore } from '../../store.ts';
import {
  conversionObservationPriceKeys,
  conversionObservationTransportKeys,
  formatConversionObservationKey,
} from '../../utils/conversionObservations.ts';
import { Chart } from './Chart.tsx';

export interface EnvironmentChartProps {
  symbol: ProsperitySymbol;
}

export function EnvironmentChart({ symbol }: EnvironmentChartProps): ReactNode {
  const algorithm = useStore(state => state.algorithm)!;

  const excludedKeys = new Set([...conversionObservationPriceKeys, ...conversionObservationTransportKeys]);
  const dataByKey: Record<string, [number, number][]> = {};

  for (const row of algorithm.data) {
    const observation = row.state.observations.conversionObservations[symbol];
    if (observation === undefined) {
      continue;
    }

    for (const [key, value] of Object.entries(observation)) {
      if (excludedKeys.has(key) || key === 'sugarPrice' || key === 'sunlightIndex' || value === undefined) {
        continue;
      }

      if (dataByKey[key] === undefined) {
        dataByKey[key] = [];
      }

      dataByKey[key].push([row.state.timestamp, value]);
    }
  }

  const series: Highcharts.SeriesOptionsType[] = Object.entries(dataByKey).map(([key, data], index) => ({
    type: 'line',
    name: formatConversionObservationKey(key),
    marker: { symbol: ['circle', 'square', 'diamond', 'triangle', 'triangle-down'][index % 5] },
    data,
  }));

  if (series.length === 0) {
    return null;
  }

  const options: Highcharts.Options = {
    yAxis: {
      opposite: true,
      allowDecimals: true,
    },
  };

  return <Chart title={`${symbol} - Observations`} options={options} series={series} />;
}
