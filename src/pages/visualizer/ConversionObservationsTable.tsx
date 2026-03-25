import { Table } from '@mantine/core';
import { ReactNode } from 'react';
import { TradingState } from '../../models.ts';
import { formatNumber } from '../../utils/format.ts';
import {
  formatConversionObservationKey,
  getVisibleConversionObservationKeys,
} from '../../utils/conversionObservations.ts';
import { SimpleTable } from './SimpleTable.tsx';

export interface ConversionObservationsTableProps {
  conversionObservations: TradingState['observations']['conversionObservations'];
}

export function ConversionObservationsTable({ conversionObservations }: ConversionObservationsTableProps): ReactNode {
  const keys = getVisibleConversionObservationKeys(conversionObservations);
  const rows: ReactNode[] = [];

  for (const [product, observation] of Object.entries(conversionObservations)) {
    rows.push(
      <Table.Tr key={product}>
        <Table.Td>{product}</Table.Td>
        {keys.map(key => (
          <Table.Td key={key}>{observation[key] === undefined ? '' : formatNumber(observation[key], 2)}</Table.Td>
        ))}
      </Table.Tr>,
    );
  }

  return (
    <SimpleTable
      label="conversion observations"
      columns={['Product', ...keys.map(formatConversionObservationKey)]}
      rows={rows}
    />
  );
}
