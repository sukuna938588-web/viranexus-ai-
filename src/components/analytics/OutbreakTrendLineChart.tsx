import React, { useState } from 'react';
import { TrendingUp, Calendar, Activity, AlertCircle } from 'lucide-react';
import { DailyTrendPoint } from '../../types';

interface OutbreakTrendLineChartProps {
  dailyTrends: DailyTrendPoint[];
  totalCases: number;
}

export const OutbreakTrendLineChart: React.FC<OutbreakTrendLineChartProps> = ({
  dailyTrends = [],
  totalCases = 0,
}) => {
  const [activeSeries, setActiveSeries] = useState<'all' | 'cases' | 'movingAvg' | 'severe'>('all');
  const [scrubIndex, setScrubIndex] = useState<number | null>(null);

  if (totalCases === 0 || dailyTrends.length === 0) {
    return (
      <div className="p-6 rounded-3xl bg-[#080c18]/80 border border-slate-800/80 backdrop-blur-xl flex flex-col items-center justify-center min-h-[340px] text-center">
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3">
          <TrendingUp className="w-6 h-6 opacity-60" />
        </div>
        <h4 className="text-sm font-bold text-white font-mono">Outbreak Trend Line Chart</h4>
        <p className="text-xs text-slate-400 max-w-xs mt-1">
          No longitudinal data found. Add case records with dates to render outbreak epidemic curves.
        </p>
      </div>
    );
  }

  // Calculate coordinates
  const data = dailyTrends.slice(-21); // Show last 21 chronological intervals
  const width = 640;
  const height = 220;
  const paddingX = 40;
  const paddingY = 30;

  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.cases, d.movingAvg7, d.severe)),
    5
  );

  const getX = (index: number) => {
    if (data.length <= 1) return paddingX + (width - paddingX * 2) / 2;
    return paddingX + (index / (data.length - 1)) * (width - paddingX * 2);
  };

  const getY = (val: number) => {
    return height - paddingY - (val / maxVal) * (height - paddingY * 2);
  };

  // Generate SVG path strings
  const generatePath = (accessor: (d: DailyTrendPoint) => number) => {
    if (data.length === 0) return '';
    const points = data.map((d, i) => ({ x: getX(i), y: getY(accessor(d)) }));
    return points.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '');
  };

  const generateArea = (accessor: (d: DailyTrendPoint) => number) => {
    if (data.length === 0) return '';
    const linePath = generatePath(accessor);
    const lastX = getX(data.length - 1);
    const firstX = getX(0);
    const bottomY = height - paddingY;
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  };

  const casesPath = generatePath((d) => d.cases);
  const casesArea = generateArea((d) => d.cases);
  const avgPath = generatePath((d) => d.movingAvg7);
  const severePath = generatePath((d) => d.severe);

  const scrubPoint = scrubIndex !== null ? data[scrubIndex] : null;

  return (
    <div className="p-6 rounded-3xl bg-gradient-to-b from-[#0b0f1e]/90 to-[#060812]/90 border border-slate-800/90 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <TrendingUp className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Outbreak Trend Line Chart</h3>
            <p className="text-[11px] text-slate-400 font-mono">Epidemic progression & rolling moving average</p>
          </div>
        </div>

        {/* Filter Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-[10px] font-mono font-bold self-start sm:self-auto">
          <button
            onClick={() => setActiveSeries('all')}
            className={`px-2 py-0.5 rounded-lg transition ${
              activeSeries === 'all' ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            All Curves
          </button>
          <button
            onClick={() => setActiveSeries('cases')}
            className={`px-2 py-0.5 rounded-lg transition ${
              activeSeries === 'cases' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Daily Cases
          </button>
          <button
            onClick={() => setActiveSeries('movingAvg')}
            className={`px-2 py-0.5 rounded-lg transition ${
              activeSeries === 'movingAvg' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            7D Moving Avg
          </button>
          <button
            onClick={() => setActiveSeries('severe')}
            className={`px-2 py-0.5 rounded-lg transition ${
              activeSeries === 'severe' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Severe / ICU
          </button>
        </div>
      </div>

      {/* SVG Canvas Stage */}
      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
          onMouseLeave={() => setScrubIndex(null)}
        >
          <defs>
            <linearGradient id="trendCyanArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="trendPurpleArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const y = height - paddingY - pct * (height - paddingY * 2);
            const valLabel = Math.round(pct * maxVal);
            return (
              <g key={idx}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="rgba(148, 163, 184, 0.08)"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingX - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-slate-500 font-mono text-[9px]"
                >
                  {valLabel}
                </text>
              </g>
            );
          })}

          {/* Daily Cases Area + Line */}
          {(activeSeries === 'all' || activeSeries === 'cases') && (
            <>
              <path d={casesArea} fill="url(#trendCyanArea)" />
              <path
                d={casesPath}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2.2"
                strokeLinecap="round"
                className="filter drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]"
              />
            </>
          )}

          {/* 7-Day Moving Average Line */}
          {(activeSeries === 'all' || activeSeries === 'movingAvg') && (
            <path
              d={avgPath}
              fill="none"
              stroke="#c084fc"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeDasharray={activeSeries === 'all' ? '6 3' : undefined}
              className="filter drop-shadow-[0_0_8px_rgba(192,132,252,0.4)]"
            />
          )}

          {/* Severe Line */}
          {(activeSeries === 'all' || activeSeries === 'severe') && (
            <path
              d={severePath}
              fill="none"
              stroke="#fb7185"
              strokeWidth="2"
              strokeLinecap="round"
              className="filter drop-shadow-[0_0_8px_rgba(251,113,133,0.4)]"
            />
          )}

          {/* Data Points & Interactive Scrubbing Zones */}
          {data.map((d, idx) => {
            const x = getX(idx);
            const y = getY(d.cases);
            const isHovered = scrubIndex === idx;

            return (
              <g key={d.date} className="cursor-pointer" onMouseEnter={() => setScrubIndex(idx)}>
                {/* Invisible hover capture rect */}
                <rect
                  x={x - (width / data.length) / 2}
                  y={0}
                  width={width / data.length}
                  height={height}
                  fill="transparent"
                />

                {/* Visible Data Point */}
                {(activeSeries === 'all' || activeSeries === 'cases') && (
                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered ? 5 : 2.5}
                    fill={isHovered ? '#ffffff' : '#06b6d4'}
                    stroke="#080c18"
                    strokeWidth="1.5"
                    className="transition-all"
                  />
                )}

                {/* X Axis Date Labels */}
                {(idx % Math.ceil(data.length / 6) === 0 || idx === data.length - 1) && (
                  <text
                    x={x}
                    y={height - 8}
                    textAnchor="middle"
                    className="fill-slate-500 font-mono text-[9px]"
                  >
                    {d.date.slice(5)}
                  </text>
                )}
              </g>
            );
          })}

          {/* Vertical Scrub Crosshair */}
          {scrubIndex !== null && (
            <line
              x1={getX(scrubIndex)}
              y1={paddingY}
              x2={getX(scrubIndex)}
              y2={height - paddingY}
              stroke="#22d3ee"
              strokeWidth="1.2"
              strokeDasharray="3 3"
              className="pointer-events-none"
            />
          )}
        </svg>

        {/* Floating Tooltip during Scrub */}
        {scrubPoint && scrubIndex !== null && (
          <div
            className="absolute top-2 pointer-events-none p-2.5 rounded-xl bg-[#090e1c] border border-cyan-500/40 text-[11px] font-mono shadow-2xl text-left backdrop-blur-xl animate-fade-in"
            style={{
              left: Math.min(Math.max(10, getX(scrubIndex) - 60), width - 150),
            }}
          >
            <div className="flex items-center gap-1.5 text-slate-300 font-bold mb-1">
              <Calendar className="w-3 h-3 text-cyan-400" />
              <span>{scrubPoint.date}</span>
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center justify-between gap-4 text-cyan-300">
                <span>Daily Cases:</span>
                <strong className="text-white">{scrubPoint.cases}</strong>
              </div>
              <div className="flex items-center justify-between gap-4 text-purple-300">
                <span>7D Rolling Avg:</span>
                <strong className="text-white">{scrubPoint.movingAvg7}</strong>
              </div>
              <div className="flex items-center justify-between gap-4 text-rose-300">
                <span>Severe/ICU:</span>
                <strong className="text-white">{scrubPoint.severe}</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Legend */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-cyan-300">
            <span className="w-3 h-0.5 bg-cyan-400 rounded-full" />
            <span>Daily Confirmed</span>
          </div>
          <div className="flex items-center gap-1.5 text-purple-300">
            <span className="w-3 h-0.5 bg-purple-400 rounded-full" />
            <span>7-Day Moving Avg</span>
          </div>
          <div className="flex items-center gap-1.5 text-rose-300">
            <span className="w-3 h-0.5 bg-rose-400 rounded-full" />
            <span>Severe Cases</span>
          </div>
        </div>
        <span className="text-slate-500 text-[10px]">
          Window: {data[0]?.date} - {data[data.length - 1]?.date}
        </span>
      </div>
    </div>
  );
};
