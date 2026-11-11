import React from 'react';
import { MarketPricePoint, Company } from '../../types';
import { StockPriceHistoryM3Chart } from './StockPriceHistoryM3Chart';

export interface PriceHistoryChartProps {
  data: MarketPricePoint[];
  companySymbol: string;
  companyName?: string;
  company?: Company;
  className?: string;
}

export const PriceHistoryChart: React.FC<PriceHistoryChartProps> = ({
  data,
  companySymbol,
  companyName,
  company,
  className,
}) => {
  return (
    <StockPriceHistoryM3Chart
      data={data}
      companySymbol={companySymbol}
      companyName={companyName || company?.name}
      ipoPrice={company?.ipoPrice}
      ipoDate={company?.ipoDate}
      className={className}
    />
  );
};

export { StockPriceHistoryM3Chart };
