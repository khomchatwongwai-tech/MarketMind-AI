import { useI18n } from '../i18n/I18nContext.js';
import React from 'react';
import {
  TradingViewChart,
  TradingViewChartProps,
  formatTradingViewSymbol,
  formatTradingViewInterval,
} from './TradingViewChart';

export interface TradingViewAdvancedChartProps extends TradingViewChartProps {
  containerClassName?: string;
}

export const getTradingViewSymbol = (sym: string) => formatTradingViewSymbol(sym).formattedSymbol;
export const getTradingViewInterval = formatTradingViewInterval;

export const TradingViewAdvancedChart: React.FC<TradingViewAdvancedChartProps> = (props) => {
  const { t, formatDate, formatCurrency, formatNumber, formatPercent } = useI18n();
  return <TradingViewChart {...props} className={props.containerClassName || props.className} />;
};

TradingViewAdvancedChart.displayName = 'TradingViewAdvancedChart';
export default TradingViewAdvancedChart;
