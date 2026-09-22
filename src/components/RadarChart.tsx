import React from 'react';

interface RadarAttribute {
  attribute: string;
  score: number;
  maxScore: number;
  description: string;
}

interface RadarChartProps {
  attributes: RadarAttribute[];
  size?: number;
}

export const RadarChart: React.FC<RadarChartProps> = ({
  attributes,
  size = 320,
}) => {
  if (!attributes || attributes.length === 0) return null;

  const center = size / 2;
  const radius = size * 0.38;
  const totalPoints = attributes.length;
  const angleStep = (2 * Math.PI) / totalPoints;

  // Concentric polygon grid levels: 25%, 50%, 75%, 100%
  const levels = [0.25, 0.5, 0.75, 1.0];

  const getCoordinates = (index: number, normalizedValue: number) => {
    // Start from top (- PI / 2)
    const angle = index * angleStep - Math.PI / 2;
    const r = radius * normalizedValue;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  // Polygon points for data
  const dataPoints = attributes.map((attr, i) => {
    const val = Math.max(0.08, Math.min(1, attr.score / (attr.maxScore || 100)));
    return getCoordinates(i, val);
  });

  const polygonPath =
    dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z';

  return (
    <div className="flex flex-col items-center justify-center relative select-none">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible"
      >
        <defs>
          <radialGradient id="radarGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4} />
            <stop offset="60%" stopColor="#8b5cf6" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
          </radialGradient>
          <filter id="radarGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Background web polygons */}
        {levels.map((lvl, lIdx) => {
          const gridPoints = Array.from({ length: totalPoints }).map((_, i) =>
            getCoordinates(i, lvl)
          );
          const gridPath =
            gridPoints
              .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
              .join(' ') + ' Z';
          return (
            <path
              key={`grid-${lIdx}`}
              d={gridPath}
              fill="none"
              stroke="#334155"
              strokeWidth={lIdx === 3 ? '1.2' : '0.8'}
              strokeDasharray={lIdx < 3 ? '3 3' : 'none'}
              strokeOpacity={0.4 + lIdx * 0.15}
            />
          );
        })}

        {/* Axis spokes */}
        {attributes.map((_, i) => {
          const edge = getCoordinates(i, 1.0);
          return (
            <line
              key={`axis-${i}`}
              x1={center}
              y1={center}
              x2={edge.x}
              y2={edge.y}
              stroke="#475569"
              strokeWidth="0.8"
              strokeOpacity="0.4"
            />
          );
        })}

        {/* Data polygon filled */}
        <path
          d={polygonPath}
          fill="url(#radarGrad)"
          stroke="#06b6d4"
          strokeWidth="2.5"
          filter="url(#radarGlow)"
          className="transition-all duration-700 ease-out"
        />

        {/* Data Points */}
        {dataPoints.map((p, i) => (
          <circle
            key={`dot-${i}`}
            cx={p.x}
            cy={p.y}
            r="4.5"
            fill="#a855f7"
            stroke="#ffffff"
            strokeWidth="1.5"
            filter="url(#radarGlow)"
          />
        ))}

        {/* Labels */}
        {attributes.map((attr, i) => {
          const labelCoord = getCoordinates(i, 1.22);
          const isLeft = labelCoord.x < center - 10;
          const isRight = labelCoord.x > center + 10;
          const textAnchor = isLeft ? 'end' : isRight ? 'start' : 'middle';

          return (
            <g key={`lbl-${i}`}>
              <text
                x={labelCoord.x}
                y={labelCoord.y}
                textAnchor={textAnchor}
                fill="#cbd5e1"
                fontSize="10.5"
                fontWeight="500"
                fontFamily="system-ui, sans-serif"
                className="select-none drop-shadow"
              >
                {attr.attribute}
              </text>
              <text
                x={labelCoord.x}
                y={labelCoord.y + 12}
                textAnchor={textAnchor}
                fill="#06b6d4"
                fontSize="10"
                fontWeight="700"
                fontFamily="monospace"
              >
                {attr.score} / 100
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
