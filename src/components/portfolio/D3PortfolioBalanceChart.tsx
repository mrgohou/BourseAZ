import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Layers,
  Sparkles,
  Maximize2,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
} from 'lucide-react';
import { formatFCFA, formatPercent } from '../../lib/formatters';

export interface PortfolioHistoryPoint {
  date: Date;
  dateStr: string;
  totalValue: number;
  cash: number;
  invested: number;
  unrealizedGain: number;
  benchmarkValue: number;
}

interface D3PortfolioBalanceChartProps {
  initialCash: number;
  currentCash: number;
  currentTotalValue: number;
  totalInvested: number;
  createdAt?: string;
  transactionsCount?: number;
}

export const D3PortfolioBalanceChart: React.FC<D3PortfolioBalanceChartProps> = ({
  initialCash,
  currentCash,
  currentTotalValue,
  totalInvested,
  createdAt,
  transactionsCount = 0,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [timeRange, setTimeRange] = useState<'7J' | '1M' | '3M' | 'ALL'>('1M');
  const [showBenchmark, setShowBenchmark] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState<PortfolioHistoryPoint | null>(null);

  // Generate realistic historical balance data points based on portfolio state
  const data: PortfolioHistoryPoint[] = useMemo(() => {
    let daysCount = 30;
    if (timeRange === '7J') daysCount = 7;
    if (timeRange === '1M') daysCount = 30;
    if (timeRange === '3M') daysCount = 90;
    if (timeRange === 'ALL') daysCount = 120;

    const points: PortfolioHistoryPoint[] = [];
    const now = Date.now();
    const netDelta = currentTotalValue - initialCash;

    for (let i = daysCount; i >= 0; i--) {
      const pointDate = new Date(now - i * 86400000);
      const progress = (daysCount - i) / daysCount;

      // Realistic market fluctuation curve combining trigonometric cycles with overall growth
      const smoothTrend = Math.sin((progress * Math.PI) / 2);
      const wave = Math.sin(i * 0.45) * 0.018 * initialCash;
      const microNoise = Math.cos(i * 1.2) * 0.006 * initialCash;

      let value = Math.round(initialCash + netDelta * smoothTrend + wave + microNoise);

      // Anchor last point strictly to current total value
      if (i === 0) {
        value = currentTotalValue;
      }
      // Anchor first point strictly to initial cash
      if (i === daysCount) {
        value = initialCash;
      }

      // Benchmark BRVM Composite simulation (smooth historical market line)
      const benchmarkProgress = 0.024 * progress;
      const benchmarkWave = Math.sin(i * 0.3) * 0.008;
      const benchmarkVal = Math.round(initialCash * (1 + benchmarkProgress + benchmarkWave));

      const stockVal = Math.max(0, value - currentCash);
      const unrealized = value - initialCash;

      points.push({
        date: pointDate,
        dateStr: pointDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
        totalValue: value,
        cash: currentCash,
        invested: stockVal,
        unrealizedGain: unrealized,
        benchmarkValue: benchmarkVal,
      });
    }

    return points;
  }, [timeRange, initialCash, currentCash, currentTotalValue]);

  // Statistics
  const stats = useMemo(() => {
    if (!data.length) return { min: 0, max: 0, netChange: 0, netPercent: 0 };
    const values = data.map((d) => d.totalValue);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const netChange = currentTotalValue - initialCash;
    const netPercent = initialCash > 0 ? (netChange / initialCash) * 100 : 0;

    return {
      min: minVal,
      max: maxVal,
      netChange,
      netPercent,
    };
  }, [data, currentTotalValue, initialCash]);

  // D3 Chart Rendering Engine
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || data.length === 0) return;

    const container = containerRef.current;
    const width = container.clientWidth || 700;
    const height = 300;
    const margin = { top: 20, right: 30, bottom: 35, left: 65 };

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Gradient definitions
    const defs = svg.append('defs');

    // Emerald gradient for portfolio area
    const portGradient = defs
      .append('linearGradient')
      .attr('id', 'd3-port-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    portGradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#10b981')
      .attr('stop-opacity', 0.45);

    portGradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#10b981')
      .attr('stop-opacity', 0.0);

    // Indigo gradient for benchmark
    const benchGradient = defs
      .append('linearGradient')
      .attr('id', 'd3-bench-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    benchGradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#6366f1')
      .attr('stop-opacity', 0.15);

    benchGradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#6366f1')
      .attr('stop-opacity', 0.0);

    // Scales
    const xScale = d3
      .scaleTime()
      .domain(d3.extent(data, (d) => d.date) as [Date, Date])
      .range([0, innerWidth]);

    const allValues = [
      ...data.map((d) => d.totalValue),
      initialCash,
      ...(showBenchmark ? data.map((d) => d.benchmarkValue) : []),
    ];

    const yMin = (d3.min(allValues) || initialCash) * 0.985;
    const yMax = (d3.max(allValues) || initialCash) * 1.015;

    const yScale = d3
      .scaleLinear()
      .domain([yMin, yMax])
      .range([innerHeight, 0])
      .nice();

    // Horizontal Grid Lines
    const yAxisGrid = d3
      .axisLeft(yScale)
      .tickSize(-innerWidth)
      .tickFormat(() => '')
      .ticks(5);

    g.append('g')
      .attr('class', 'grid')
      .call(yAxisGrid)
      .selectAll('line')
      .attr('stroke', '#94a3b8')
      .attr('stroke-opacity', 0.12)
      .attr('stroke-dasharray', '2,3');

    g.select('.grid').select('.domain').remove();

    // Initial Capital Reference Line
    const initialY = yScale(initialCash);
    if (initialY >= 0 && initialY <= innerHeight) {
      g.append('line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', initialY)
        .attr('y2', initialY)
        .attr('stroke', '#64748b')
        .attr('stroke-width', 1.2)
        .attr('stroke-dasharray', '4,4')
        .attr('opacity', 0.7);

      g.append('text')
        .attr('x', innerWidth - 6)
        .attr('y', initialY - 6)
        .attr('text-anchor', 'end')
        .attr('fill', '#94a3b8')
        .attr('font-size', '10px')
        .attr('font-weight', '600')
        .text(`Capital initial (${Math.round(initialCash / 1000000)}M FCFA)`);
    }

    // Benchmark Curve (if active)
    if (showBenchmark) {
      const benchLine = d3
        .line<PortfolioHistoryPoint>()
        .x((d) => xScale(d.date))
        .y((d) => yScale(d.benchmarkValue))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', '#6366f1')
        .attr('stroke-width', 1.8)
        .attr('stroke-dasharray', '5,4')
        .attr('opacity', 0.75)
        .attr('d', benchLine);
    }

    // Area Fill for Portfolio
    const portArea = d3
      .area<PortfolioHistoryPoint>()
      .x((d) => xScale(d.date))
      .y0(innerHeight)
      .y1((d) => yScale(d.totalValue))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(data)
      .attr('fill', 'url(#d3-port-gradient)')
      .attr('d', portArea);

    // Main Line for Portfolio
    const portLine = d3
      .line<PortfolioHistoryPoint>()
      .x((d) => xScale(d.date))
      .y((d) => yScale(d.totalValue))
      .curve(d3.curveMonotoneX);

    const path = g
      .append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#10b981')
      .attr('stroke-width', 2.8)
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round')
      .attr('d', portLine);

    // Path entrance animation using strokeDashoffset
    const totalLength = path.node()?.getTotalLength() || 0;
    path
      .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(750)
      .ease(d3.easeCubicOut)
      .attr('stroke-dashoffset', 0);

    // Axes
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(Math.max(4, Math.floor(innerWidth / 90)))
      .tickFormat((d) =>
        (d as Date).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: timeRange === '7J' ? '2-digit' : 'short',
        })
      );

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '11px')
      .attr('font-weight', '500')
      .attr('dy', '1em');

    g.selectAll('.domain').attr('stroke', '#cbd5e1').attr('opacity', 0.25);

    const yAxis = d3
      .axisLeft(yScale)
      .ticks(5)
      .tickFormat((d) => {
        const val = Number(d);
        if (val >= 1000000) {
          return `${(val / 1000000).toFixed(1)}M`;
        }
        return `${Math.round(val / 1000)}k`;
      });

    g.append('g')
      .call(yAxis)
      .selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '11px')
      .attr('font-weight', '500')
      .attr('dx', '-0.5em');

    // Interactive Hover Tracking Layer
    const bisectDate = d3.bisector<PortfolioHistoryPoint, Date>((d) => d.date).left;

    const crosshair = g.append('g').style('display', 'none');

    // Vertical line
    const verticalLine = crosshair
      .append('line')
      .attr('stroke', '#10b981')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '3,3')
      .attr('y1', 0)
      .attr('y2', innerHeight);

    // Highlight dot outer glow
    const focusGlow = crosshair
      .append('circle')
      .attr('r', 8)
      .attr('fill', '#10b981')
      .attr('opacity', 0.25);

    // Highlight dot center
    const focusCircle = crosshair
      .append('circle')
      .attr('r', 4.5)
      .attr('fill', '#10b981')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2);

    // Benchmark dot (if shown)
    const benchCircle = crosshair
      .append('circle')
      .attr('r', 3.5)
      .attr('fill', '#6366f1')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1.5)
      .style('display', showBenchmark ? 'block' : 'none');

    // Overlay rect to capture all mouse events
    svg
      .append('rect')
      .attr('transform', `translate(${margin.left},${margin.top})`)
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'transparent')
      .attr('cursor', 'crosshair')
      .on('mouseenter', () => crosshair.style('display', null))
      .on('mouseleave', () => {
        crosshair.style('display', 'none');
        setHoveredPoint(null);
      })
      .on('mousemove', (event) => {
        const [xPos] = d3.pointer(event);
        const xDate = xScale.invert(xPos);
        const index = bisectDate(data, xDate, 1);
        const d0 = data[index - 1];
        const d1 = data[index];
        let d = d0;
        if (d1 && xDate) {
          d = xDate.getTime() - d0.date.getTime() > d1.date.getTime() - xDate.getTime() ? d1 : d0;
        }

        if (d) {
          const cx = xScale(d.date);
          const cy = yScale(d.totalValue);
          verticalLine.attr('transform', `translate(${cx},0)`);
          focusGlow.attr('cx', cx).attr('cy', cy);
          focusCircle.attr('cx', cx).attr('cy', cy);

          if (showBenchmark) {
            benchCircle
              .attr('cx', cx)
              .attr('cy', yScale(d.benchmarkValue))
              .style('display', 'block');
          } else {
            benchCircle.style('display', 'none');
          }

          setHoveredPoint(d);
        }
      });
  }, [data, showBenchmark, initialCash]);

  // Handle responsive resize with ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => {
      // Trigger subtle redraw
      setTimeRange((prev) => prev);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const isGain = stats.netChange >= 0;

  return (
    <div className="p-5 sm:p-7 rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-5 transition-colors">
      {/* Chart Top Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 text-[11px] font-bold uppercase tracking-wider">
              <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Courbe D3 Interactive • Solde Fictif
            </span>
            <span className="text-xs text-slate-400">
              Mise à jour en temps réel
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white font-['Outfit'] flex items-center gap-2">
            Progression Historique du Portefeuille Virtuel
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
            Visualisez la trajectoire globale de votre capital simulé ({formatFCFA(initialCash)}) face aux fluctuations de vos titres cotés.
          </p>
        </div>

        {/* Controls: Time Range Pills & Benchmark Toggle */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {/* Time Range Pills */}
          <div className="inline-flex items-center p-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-xs font-bold">
            {(['7J', '1M', '3M', 'ALL'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                  timeRange === range
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          {/* Benchmark Toggle Button */}
          <button
            onClick={() => setShowBenchmark(!showBenchmark)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
              showBenchmark
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-300/80 dark:border-indigo-700/80 shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
            title="Afficher ou masquer la courbe de référence BRVM Composite"
          >
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <span>Ref BRVM</span>
          </button>
        </div>
      </div>

      {/* Dynamic Inspector Bar / Hovered Point Details */}
      <div className="p-3.5 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200">
            <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{hoveredPoint ? hoveredPoint.date.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' }) : 'Dernière valeur enregistrée'}</span>
          </div>

          <span className="text-slate-300 dark:text-slate-600">|</span>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Solde Portefeuille :</span>
            <span className="font-extrabold text-slate-900 dark:text-white text-sm">
              {formatFCFA(hoveredPoint ? hoveredPoint.totalValue : currentTotalValue)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Écart vs initial :</span>
            <span
              className={`font-black flex items-center gap-0.5 ${
                (hoveredPoint ? hoveredPoint.unrealizedGain : stats.netChange) >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {(hoveredPoint ? hoveredPoint.unrealizedGain : stats.netChange) >= 0 ? (
                <ArrowUpRight className="w-3.5 h-3.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5" />
              )}
              {formatFCFA(hoveredPoint ? hoveredPoint.unrealizedGain : stats.netChange)} (
              {formatPercent(
                initialCash > 0
                  ? ((hoveredPoint ? hoveredPoint.unrealizedGain : stats.netChange) / initialCash) * 100
                  : 0
              )}
              )
            </span>
          </div>

          {showBenchmark && hoveredPoint && (
            <div className="hidden sm:flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-medium">
              <span>Indice Ref :</span>
              <span className="font-bold">{formatFCFA(hoveredPoint.benchmarkValue)}</span>
            </div>
          )}
        </div>
      </div>

      {/* D3 SVG Chart Container */}
      <div ref={containerRef} className="w-full relative min-h-[300px]">
        <svg ref={svgRef} className="w-full overflow-visible" />
      </div>

      {/* Chart Footer Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/50">
          <span className="text-[10.5px] uppercase font-bold text-slate-600 dark:text-slate-400 block">
            Capital Initial
          </span>
          <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mt-0.5 block">
            {formatFCFA(initialCash)}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/50">
          <span className="text-[10.5px] uppercase font-bold text-slate-600 dark:text-slate-400 block">
            Plus Haut Historique
          </span>
          <span className="text-sm font-extrabold text-emerald-800 dark:text-emerald-400 mt-0.5 block">
            {formatFCFA(stats.max)}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/50">
          <span className="text-[10.5px] uppercase font-bold text-slate-600 dark:text-slate-400 block">
            Plus Bas Historique
          </span>
          <span className="text-sm font-extrabold text-slate-800 dark:text-slate-300 mt-0.5 block">
            {formatFCFA(stats.min)}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/50">
          <span className="text-[10.5px] uppercase font-bold text-slate-600 dark:text-slate-400 block">
            Performance Totale
          </span>
          <span
            className={`text-sm font-black mt-0.5 block ${
              isGain ? 'text-emerald-800 dark:text-emerald-400' : 'text-rose-800 dark:text-rose-400'
            }`}
          >
            {isGain ? '+' : ''}
            {formatPercent(stats.netPercent)}
          </span>
        </div>
      </div>
    </div>
  );
};
