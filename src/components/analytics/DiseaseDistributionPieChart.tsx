import React, { useState } from 'react';
import { PieChart as PieIcon, Info } from 'lucide-react';
import { DiseaseStat } from '../../types';

interface DiseaseDistributionPieChartProps {
  diseaseStats: DiseaseStat[];
  totalCases: number;
}

const PALETTE = [
  { stroke: '#06b6d4', fill: 'rgba(6, 182, 212, 0.85)', glow: 'rgba(6, 182, 212, 0.4)' }, // Cyan
  { stroke: '#a855f7', fill: 'rgba(168, 85, 247, 0.85)', glow: 'rgba(168, 85, 247, 0.4)' }, // Purple
  { stroke: '#f43f5e', fill: 'rgba(244, 63, 94, 0.85)', glow: 'rgba(244, 63, 94, 0.4)' }, // Rose
  { stroke: '#eab308', fill: 'rgba(234, 179, 8, 0.85)', glow: 'rgba(234, 179, 8, 0.4)' }, // Amber
  { stroke: '#10b981', fill: 'rgba(16, 185, 129, 0.85)', glow: 'rgba(16, 185, 129, 0.4)' }, // Emerald
  { stroke: '#3b82f6', fill: 'rgba(59, 130, 246, 0.85)', glow: 'rgba(59, 130, 246, 0.4)' }, // Blue
  { stroke: '#ec4899', fill: 'rgba(236, 72, 153, 0.85)', glow: 'rgba(236, 72, 153, 0.4)' }, // Pink
  { stroke: '#14b8a6', fill: 'rgba(20, 184, 166, 0.85)', glow: 'rgba(20, 184, 166, 0.4)' }, // Teal
];

export const DiseaseDistributionPieChart: React.FC<DiseaseDistributionPieChartProps> = ({
  diseaseStats = [],
  totalCases = 0,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (totalCases === 0 || diseaseStats.length === 0) {
    return (
      <div className="p-6 rounded-3xl bg-[#080c18]/80 border border-slate-800/80 backdrop-blur-xl flex flex-col items-center justify-center min-h-[340px] text-center">
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3">
          <PieIcon className="w-6 h-6 opacity-60" />
        </div>
        <h4 className="text-sm font-bold text-white font-mono">Disease Distribution Pie Chart</h4>
        <p className="text-xs text-slate-400 max-w-xs mt-1">
          No records uploaded yet. Upload user case data to compute pathogen distribution.
        </p>
      </div>
    );
  }

  // Calculate slice angles
  const size = 260;
  const center = size / 2;
  const radius = 95;
  const innerRadius = 55; // Donut style for modern data science visualization

  let currentAngle = -Math.PI / 2;
  const slices = diseaseStats.map((item, idx) => {
    const fraction = item.count / totalCases;
    const sliceAngle = fraction * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    currentAngle = endAngle;

    const isHovered = hoveredIndex === idx;
    const effectiveRadius = isHovered ? radius + 7 : radius;
    const effectiveInner = isHovered ? innerRadius - 2 : innerRadius;

    let pathData = '';

    // If slice is 100% or only 1 disease exists, draw two 180-deg arcs for a complete donut ring
    if (sliceAngle >= 2 * Math.PI - 0.005 || diseaseStats.length === 1) {
      pathData = [
        `M ${center} ${center - effectiveRadius}`,
        `A ${effectiveRadius} ${effectiveRadius} 0 1 1 ${center} ${center + effectiveRadius}`,
        `A ${effectiveRadius} ${effectiveRadius} 0 1 1 ${center} ${center - effectiveRadius}`,
        `M ${center} ${center - effectiveInner}`,
        `A ${effectiveInner} ${effectiveInner} 0 1 0 ${center} ${center + effectiveInner}`,
        `A ${effectiveInner} ${effectiveInner} 0 1 0 ${center} ${center - effectiveInner}`,
        'Z',
      ].join(' ');
    } else {
      // Outer arc coordinates
      const x1 = center + effectiveRadius * Math.cos(startAngle);
      const y1 = center + effectiveRadius * Math.sin(startAngle);
      const x2 = center + effectiveRadius * Math.cos(endAngle);
      const y2 = center + effectiveRadius * Math.sin(endAngle);

      // Inner arc coordinates
      const ix1 = center + effectiveInner * Math.cos(endAngle);
      const iy1 = center + effectiveInner * Math.sin(endAngle);
      const ix2 = center + effectiveInner * Math.cos(startAngle);
      const iy2 = center + effectiveInner * Math.sin(startAngle);

      const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;

      // SVG donut path
      pathData = [
        `M ${x1} ${y1}`,
        `A ${effectiveRadius} ${effectiveRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        `L ${ix1} ${iy1}`,
        `A ${effectiveInner} ${effectiveInner} 0 ${largeArcFlag} 0 ${ix2} ${iy2}`,
        'Z',
      ].join(' ');
    }

    const color = PALETTE[idx % PALETTE.length];

    return {
      name: item.name,
      count: item.count,
      percentage: item.percentage,
      pathData,
      color,
      isHovered,
    };
  });

  const activeItem = hoveredIndex !== null ? diseaseStats[hoveredIndex] : null;

  return (
    <div className="p-6 rounded-3xl bg-gradient-to-b from-[#0b0f1e]/90 to-[#060812]/90 border border-slate-800/90 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <PieIcon className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Disease Distribution</h3>
            <p className="text-[11px] text-slate-400 font-mono">Proportional pathogen case frequency</p>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300">
          {diseaseStats.length} Pathogens
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* SVG Pie / Donut Chart */}
        <div className="md:col-span-6 flex justify-center relative select-none">
          <svg width={size} height={size} className="overflow-visible filter drop-shadow-lg">
            {slices.map((slice, idx) => (
              <path
                key={slice.name}
                d={slice.pathData}
                fill={slice.color.fill}
                stroke={slice.color.stroke}
                strokeWidth={slice.isHovered ? 2.5 : 1.2}
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{
                  filter: slice.isHovered ? `drop-shadow(0 0 10px ${slice.color.glow})` : undefined,
                }}
              />
            ))}

            {/* Donut Center Display */}
            <circle
              cx={center}
              cy={center}
              r={innerRadius - 4}
              fill="#060812"
              stroke="rgba(100, 116, 139, 0.2)"
              strokeWidth="1"
            />
            <text
              x={center}
              y={center - 4}
              textAnchor="middle"
              className="fill-white font-mono font-black text-lg"
            >
              {activeItem ? activeItem.count.toLocaleString() : totalCases.toLocaleString()}
            </text>
            <text
              x={center}
              y={center + 14}
              textAnchor="middle"
              className="fill-slate-400 font-mono text-[9px] uppercase tracking-wider"
            >
              {activeItem ? `${activeItem.percentage}%` : 'TOTAL CASES'}
            </text>
          </svg>
        </div>

        {/* Legend & Frequency Metrics */}
        <div className="md:col-span-6 space-y-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
          {diseaseStats.map((item, idx) => {
            const color = PALETTE[idx % PALETTE.length];
            const isHovered = hoveredIndex === idx;
            return (
              <div
                key={item.name}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`p-2 rounded-xl transition cursor-pointer flex items-center justify-between border ${
                  isHovered
                    ? 'bg-slate-800/80 border-cyan-500/40 translate-x-1'
                    : 'bg-slate-900/40 border-slate-800/60 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: color.stroke }}
                  />
                  <span className="text-xs font-medium text-slate-200 truncate">{item.name}</span>
                </div>
                <div className="flex items-center gap-2.5 shrink-0 font-mono text-xs">
                  <span className="text-white font-bold">{item.count.toLocaleString()}</span>
                  <span className="text-cyan-400 font-bold min-w-[38px] text-right">
                    {item.percentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
