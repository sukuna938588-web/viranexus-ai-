import React, { useState } from 'react';

export interface TrendDataPoint {
  label: string; // date or day
  primary: number; // e.g. cases or predicted
  secondary?: number; // e.g. moving average or ICU
  lowerCI?: number;
  upperCI?: number;
  annotation?: string;
}

interface TrendChartProps {
  data: TrendDataPoint[];
  title?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  primaryColor?: string; // hex
  secondaryColor?: string; // hex
  height?: number;
  showConfidenceBands?: boolean;
}

export const TrendChart: React.FC<TrendChartProps> = ({
  data,
  title,
  primaryLabel = 'Cases',
  secondaryLabel = '7-Day Avg',
  primaryColor = '#06b6d4',
  secondaryColor = '#a855f7',
  height = 240,
  showConfidenceBands = false,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex h-48 w-full items-center justify-center rounded-2xl bg-slate-900/30 border border-slate-800 text-xs text-slate-500">
        No time-series data available
      </div>
    );
  }

  const padding = { top: 25, right: 25, bottom: 35, left: 45 };
  const width = 600; // viewBox width

  // Compute scale limits
  const allValues: number[] = [];
  data.forEach((d) => {
    allValues.push(d.primary);
    if (d.secondary !== undefined) allValues.push(d.secondary);
    if (showConfidenceBands && d.upperCI !== undefined) allValues.push(d.upperCI);
    if (showConfidenceBands && d.lowerCI !== undefined) allValues.push(d.lowerCI);
  });

  const maxValue = Math.max(10, Math.ceil(Math.max(...allValues) * 1.15));
  const minValue = 0;

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const getX = (index: number) => {
    if (data.length <= 1) return padding.left + chartWidth / 2;
    return padding.left + (index / (data.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    const clamped = Math.max(minValue, Math.min(maxValue, val));
    return padding.top + chartHeight - ((clamped - minValue) / (maxValue - minValue)) * chartHeight;
  };

  // Primary Line Path
  const primaryPath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(d.primary).toFixed(1)}`)
    .join(' ');

  // Primary Area Path
  const primaryArea =
    `${primaryPath} L ${getX(data.length - 1).toFixed(1)} ${(padding.top + chartHeight).toFixed(1)} L ${getX(0).toFixed(1)} ${(padding.top + chartHeight).toFixed(1)} Z`;

  // Secondary Line Path (if present)
  const secondaryPath =
    data[0]?.secondary !== undefined
      ? data
          .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(d.secondary || 0).toFixed(1)}`)
          .join(' ')
      : null;

  // Confidence Bands Path (if showConfidenceBands)
  let confidencePath = '';
  if (showConfidenceBands && data[0]?.upperCI !== undefined) {
    const upperPoints = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(d.upperCI || 0).toFixed(1)}`).join(' ');
    const lowerPoints = data
      .slice()
      .reverse()
      .map((d, i) => `L ${getX(data.length - 1 - i).toFixed(1)} ${getY(d.lowerCI || 0).toFixed(1)}`)
      .join(' ');
    confidencePath = `${upperPoints} ${lowerPoints} Z`;
  }

  // Y-axis tick values (4 steps)
  const yTicks = [0, 0.33, 0.66, 1].map((pct) => Math.round(minValue + (maxValue - minValue) * pct));

  return (
    <div className="w-full relative flex flex-col select-none">
      {title && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
            {title}
          </span>
          <div className="flex items-center gap-4 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: primaryColor }} />
              <span className="text-slate-400">{primaryLabel}</span>
            </div>
            {secondaryPath && (
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: secondaryColor }} />
                <span className="text-slate-400">{secondaryLabel}</span>
              </div>
            )}
            {showConfidenceBands && (
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400/20 border border-cyan-400/40" />
                <span className="text-slate-400">95% Confidence Band</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={`grad-${primaryColor}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={primaryColor} stopOpacity="0.25" />
              <stop offset="85%" stopColor={primaryColor} stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="ciGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yTicks.map((tick, i) => {
            const y = getY(tick);
            return (
              <g key={`ytick-${i}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#1e293b"
                  strokeDasharray="4 4"
                  strokeWidth="0.8"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize="9.5"
                  fontFamily="monospace"
                >
                  {tick.toLocaleString()}
                </text>
              </g>
            );
          })}

          {/* Confidence interval area */}
          {confidencePath && (
            <path d={confidencePath} fill="url(#ciGrad)" stroke="none" />
          )}

          {/* Primary area & line */}
          <path d={primaryArea} fill={`url(#grad-${primaryColor})`} />
          <path
            d={primaryPath}
            fill="none"
            stroke={primaryColor}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Secondary line */}
          {secondaryPath && (
            <path
              d={secondaryPath}
              fill="none"
              stroke={secondaryColor}
              strokeWidth="1.8"
              strokeDasharray="3 3"
            />
          )}

          {/* X Axis Ticks (Show up to 6 evenly spaced labels) */}
          {data.map((d, i) => {
            const step = Math.max(1, Math.floor(data.length / 5));
            if (i % step !== 0 && i !== data.length - 1) return null;
            const x = getX(i);
            return (
              <text
                key={`xtick-${i}`}
                x={x}
                y={height - 10}
                textAnchor="middle"
                fill="#64748b"
                fontSize="9"
                fontFamily="system-ui, sans-serif"
              >
                {d.label.length > 10 ? d.label.slice(5) : d.label}
              </text>
            );
          })}

          {/* Interactive Hover Guides & Circles */}
          {hoverIndex !== null && data[hoverIndex] && (
            <g>
              <line
                x1={getX(hoverIndex)}
                y1={padding.top}
                x2={getX(hoverIndex)}
                y2={padding.top + chartHeight}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <circle
                cx={getX(hoverIndex)}
                cy={getY(data[hoverIndex].primary)}
                r="5"
                fill={primaryColor}
                stroke="#ffffff"
                strokeWidth="2"
              />
              {data[hoverIndex].secondary !== undefined && (
                <circle
                  cx={getX(hoverIndex)}
                  cy={getY(data[hoverIndex].secondary!)}
                  r="4"
                  fill={secondaryColor}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
              )}
            </g>
          )}

          {/* Invisible hover overlay rects */}
          {data.map((_, i) => {
            const x = getX(i);
            const w = chartWidth / Math.max(1, data.length);
            return (
              <rect
                key={`hover-col-${i}`}
                x={x - w / 2}
                y={padding.top}
                width={w}
                height={chartHeight}
                fill="transparent"
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
                className="cursor-crosshair"
              />
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoverIndex !== null && data[hoverIndex] && (
          <div
            className="absolute pointer-events-none z-20 rounded-xl bg-slate-950/90 border border-cyan-500/40 p-2.5 shadow-2xl backdrop-blur-md text-xs font-mono"
            style={{
              left: `${Math.min(78, Math.max(12, (getX(hoverIndex) / width) * 100))}%`,
              top: '12%',
              transform: 'translateX(-50%)',
            }}
          >
            <div className="font-semibold text-white border-b border-slate-800 pb-1 mb-1.5 flex items-center justify-between gap-2">
              <span>{data[hoverIndex].label}</span>
              {data[hoverIndex].annotation && (
                <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px]">
                  {data[hoverIndex].annotation}
                </span>
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-3 text-cyan-300">
                <span>{primaryLabel}:</span>
                <span className="font-bold">{data[hoverIndex].primary.toLocaleString()}</span>
              </div>
              {data[hoverIndex].secondary !== undefined && (
                <div className="flex items-center justify-between gap-3 text-purple-300">
                  <span>{secondaryLabel}:</span>
                  <span className="font-bold">{data[hoverIndex].secondary?.toLocaleString()}</span>
                </div>
              )}
              {showConfidenceBands && data[hoverIndex].upperCI !== undefined && (
                <div className="text-[10px] text-slate-400 pt-0.5">
                  CI (95%): [{data[hoverIndex].lowerCI} — {data[hoverIndex].upperCI}]
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
