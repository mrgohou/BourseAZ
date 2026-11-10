import React, { useState, useEffect } from 'react';
import { RefreshCw, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export interface MarketStatusInfo {
  isOpen: boolean;
  statusText: string;
  subText: string;
  timeString: string;
}

export interface StockTickerItem {
  symbol: string;
  name: string;
  price: string;
  change: number;
  isUp: boolean;
}

export function getBRVMMarketStatus(date = new Date()): MarketStatusInfo {
  const utcDay = date.getUTCDay();
  const utcHours = date.getUTCHours();
  const utcMinutes = date.getUTCMinutes();
  const utcSeconds = date.getUTCSeconds();

  const totalMinutes = utcHours * 60 + utcMinutes;
  const openMinutes = 9 * 60; // 09:00 GMT
  const closeMinutes = 15 * 60; // 15:00 GMT

  const isWeekday = utcDay >= 1 && utcDay <= 5;
  const isOpen = isWeekday && totalMinutes >= openMinutes && totalMinutes < closeMinutes;

  const hh = String(utcHours).padStart(2, '0');
  const mm = String(utcMinutes).padStart(2, '0');
  const ss = String(utcSeconds).padStart(2, '0');
  const timeString = `${hh}:${mm}:${ss} GMT`;

  if (isOpen) {
    return {
      isOpen: true,
      statusText: 'MARCHÉ OUVERT',
      subText: 'Cotation en direct (09h00 - 15h00 GMT)',
      timeString,
    };
  }

  let nextMsg = 'Prochaine séance : Demain à 09h00 GMT';
  if (utcDay === 5 && totalMinutes >= closeMinutes) {
    nextMsg = 'Prochaine séance : Lundi à 09h00 GMT';
  } else if (utcDay === 6 || utcDay === 0) {
    nextMsg = 'Prochaine séance : Lundi à 09h00 GMT';
  } else if (isWeekday && totalMinutes < openMinutes) {
    nextMsg = 'Ouverture aujourd’hui à 09h00 GMT';
  }

  return {
    isOpen: false,
    statusText: 'MARCHÉ FERMÉ',
    subText: nextMsg,
    timeString,
  };
}

const INITIAL_STOCKS: StockTickerItem[] = [
  { symbol: 'BRVM-COMP', name: 'BRVM COMPOSITE', price: '224,85', change: 0.48, isUp: true },
  { symbol: 'BRVM-30', name: 'BRVM 30', price: '112,40', change: 0.62, isUp: true },
  { symbol: 'SNTS', name: 'Sonatel', price: '32 000 FCFA', change: 3.23, isUp: true },
  { symbol: 'ORGT', name: 'Orange CI', price: '11 800 FCFA', change: 1.40, isUp: true },
  { symbol: 'SGBC', name: 'Société Générale CI', price: '18 500 FCFA', change: 1.65, isUp: true },
  { symbol: 'SLBC', name: 'Solibra', price: '37 005 FCFA', change: 0.01, isUp: true },
  { symbol: 'PALC', name: 'Palmci', price: '7 400 FCFA', change: -1.20, isUp: false },
  { symbol: 'ETIT', name: 'Ecobank Trans.', price: '19 FCFA', change: 0.00, isUp: true },
  { symbol: 'CBIBF', name: 'Coris Bank', price: '10 200 FCFA', change: 1.15, isUp: true },
  { symbol: 'BOAC', name: 'BOA Côte d’Ivoire', price: '7 100 FCFA', change: 2.10, isUp: true },
  { symbol: 'TTLC', name: 'Total Côte d’Ivoire', price: '2 200 FCFA', change: 0.45, isUp: true },
  { symbol: 'ONTBF', name: 'Onatel Burkina', price: '2 450 FCFA', change: 0.82, isUp: true },
  { symbol: 'SDCC', name: 'Sodeci', price: '5 350 FCFA', change: -0.50, isUp: false },
  { symbol: 'NSBC', name: 'NSIA Banque', price: '6 400 FCFA', change: 1.80, isUp: true },
  { symbol: 'BICC', name: 'BICI Côte d’Ivoire', price: '7 800 FCFA', change: -0.30, isUp: false },
  { symbol: 'SICC', name: 'Sicable', price: '1 120 FCFA', change: 0.90, isUp: true },
  { symbol: 'UNLC', name: 'Unilever CI', price: '6 900 FCFA', change: 0.00, isUp: true },
  { symbol: 'BRVM-PREST', name: 'BRVM PRESTIGE', price: '104,15', change: -0.12, isUp: false },
];

export const MarketStatusTicker: React.FC = () => {
  const [status, setStatus] = useState<MarketStatusInfo>(() => getBRVMMarketStatus());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stocks, setStocks] = useState<StockTickerItem[]>(INITIAL_STOCKS);

  useEffect(() => {
    const timer = setInterval(() => {
      setStatus(getBRVMMarketStatus());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setStatus(getBRVMMarketStatus());

    setStocks(prev =>
      prev.map(item => {
        const delta = (Math.random() - 0.48) * 0.2;
        const newChange = Number((item.change + delta).toFixed(2));
        return {
          ...item,
          change: newChange,
          isUp: newChange >= 0,
        };
      })
    );

    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  // Duplicate items array to create infinite seamless sliding loop
  const duplicatedStocks = [...stocks, ...stocks];

  return (
    <div className="bg-slate-950 text-white text-xs border-b border-slate-800/90 shadow-xs transition-colors overflow-hidden select-none">
      <div className="max-w-full mx-auto px-2 sm:px-4 py-1.5 flex items-center justify-between gap-2">
        {/* Fixed Left Status Badge */}
        <div className="flex items-center gap-2 shrink-0 bg-slate-950 pr-3 z-10 border-r border-slate-800/80">
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-extrabold border transition-all ${
              status.isOpen
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                : 'bg-amber-500/20 text-amber-300 border-amber-400/40'
            }`}
          >
            <span className="relative flex h-2 w-2">
              {status.isOpen && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  status.isOpen ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              ></span>
            </span>
            <span className="tracking-wide font-black">{status.statusText}</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-slate-400 text-[11px] font-medium">
            <Clock className="w-3 h-3 text-slate-400" />
            <span className="font-mono text-slate-200 font-bold">{status.timeString}</span>
          </div>
        </div>

        {/* Sliding Marquee Container for All BRVM Action Cours */}
        <div className="flex-1 overflow-hidden relative py-0.5 group">
          <div className="animate-marquee flex items-center gap-6 whitespace-nowrap">
            {duplicatedStocks.map((item, idx) => (
              <div
                key={`${item.symbol}-${idx}`}
                className="inline-flex items-center gap-2 px-2 py-0.5 rounded-lg bg-slate-900/80 border border-slate-800/60 hover:bg-slate-800 transition-colors text-[11px]"
              >
                <span className="font-extrabold text-slate-200 tracking-wide">{item.symbol}</span>
                <span className="text-slate-400 text-[10px] hidden lg:inline">({item.name})</span>
                <span className="font-bold text-white font-mono">{item.price}</span>
                <span
                  className={`inline-flex items-center text-[10px] font-extrabold px-1.5 py-0.2 rounded ${
                    item.isUp
                      ? 'text-emerald-400 bg-emerald-950/80 border border-emerald-500/30'
                      : 'text-rose-400 bg-rose-950/80 border border-rose-500/30'
                  }`}
                >
                  {item.isUp ? (
                    <ArrowUpRight className="w-3 h-3 stroke-[3]" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 stroke-[3]" />
                  )}
                  {item.change >= 0 ? `+${item.change.toFixed(2)}%` : `${item.change.toFixed(2)}%`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Fixed Right Refresh Button */}
        <div className="shrink-0 bg-slate-950 pl-2 z-10 border-l border-slate-800/80 flex items-center">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            title="Mettre à jour les cours du marché en direct"
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};
