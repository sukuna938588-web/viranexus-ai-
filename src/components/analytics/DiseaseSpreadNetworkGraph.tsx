import React, { useState, useMemo } from 'react';
import { Network, Share2, MapPin, Activity, Info, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { OutbreakRecord } from '../../types';

interface DiseaseSpreadNetworkGraphProps {
  records: OutbreakRecord[];
}

interface GraphNode {
  id: string;
  name: string;
  type: 'disease' | 'region';
  x: number;
  y: number;
  radius: number;
  color: string;
  glow: string;
  cases: number;
  severe: number;
}

interface GraphLink {
  id: string;
  source: string;
  target: string;
  sourceNode: GraphNode;
  targetNode: GraphNode;
  weight: number;
  severeCount: number;
  color: string;
}

const DISEASE_PALETTE = ['#06b6d4', '#a855f7', '#f43f5e', '#eab308', '#10b981', '#3b82f6'];

export const DiseaseSpreadNetworkGraph: React.FC<DiseaseSpreadNetworkGraphProps> = ({
  records = [],
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const { nodes, links } = useMemo(() => {
    if (!records || records.length === 0) return { nodes: [], links: [] };

    // Group relations: Disease <--> Region
    const diseaseMap = new Map<string, { cases: number; severe: number }>();
    const regionMap = new Map<string, { cases: number; severe: number }>();
    const relationMap = new Map<string, { count: number; severe: number; disease: string; region: string }>();

    records.forEach((r) => {
      const dName = r.disease || 'Unknown Pathogen';
      const rName = r.region || 'Unknown Location';
      const count = r.cases && r.cases > 0 ? r.cases : 1;
      const isSevere = r.severity === 'Severe' || r.severity === 'Critical';

      // Disease
      if (!diseaseMap.has(dName)) diseaseMap.set(dName, { cases: 0, severe: 0 });
      const dObj = diseaseMap.get(dName)!;
      dObj.cases += count;
      if (isSevere) dObj.severe += count;

      // Region
      if (!regionMap.has(rName)) regionMap.set(rName, { cases: 0, severe: 0 });
      const regObj = regionMap.get(rName)!;
      regObj.cases += count;
      if (isSevere) regObj.severe += count;

      // Relation
      const relKey = `${dName}:::${rName}`;
      if (!relationMap.has(relKey)) {
        relationMap.set(relKey, { count: 0, severe: 0, disease: dName, region: rName });
      }
      const relObj = relationMap.get(relKey)!;
      relObj.count += count;
      if (isSevere) relObj.severe += count;
    });

    const width = 640;
    const height = 360;
    const centerX = width / 2;
    const centerY = height / 2;

    const topDiseases = Array.from(diseaseMap.entries())
      .sort((a, b) => b[1].cases - a[1].cases)
      .slice(0, 6);

    const topRegions = Array.from(regionMap.entries())
      .sort((a, b) => b[1].cases - a[1].cases)
      .slice(0, 10);

    const graphNodes: GraphNode[] = [];
    const nodeLookup = new Map<string, GraphNode>();

    // 1. Position Disease Nodes in an inner orbital ring
    const dRadius = Math.min(width, height) * 0.22;
    topDiseases.forEach(([name, data], idx) => {
      const angle = (idx / topDiseases.length) * 2 * Math.PI - Math.PI / 2;
      const x = centerX + dRadius * Math.cos(angle);
      const y = centerY + dRadius * Math.sin(angle);
      const color = DISEASE_PALETTE[idx % DISEASE_PALETTE.length];
      const r = Math.min(22, Math.max(12, 10 + Math.log2(data.cases + 1) * 2.5));

      const node: GraphNode = {
        id: `disease-${name}`,
        name,
        type: 'disease',
        x,
        y,
        radius: r,
        color,
        glow: color,
        cases: data.cases,
        severe: data.severe,
      };
      graphNodes.push(node);
      nodeLookup.set(node.id, node);
    });

    // 2. Position Region Nodes in an outer orbital perimeter
    const rRadius = Math.min(width, height) * 0.42;
    topRegions.forEach(([name, data], idx) => {
      const angle = (idx / topRegions.length) * 2 * Math.PI - Math.PI / 4;
      const x = centerX + rRadius * Math.cos(angle);
      const y = centerY + rRadius * Math.sin(angle);
      const r = Math.min(16, Math.max(8, 7 + Math.log2(data.cases + 1) * 1.8));

      const node: GraphNode = {
        id: `region-${name}`,
        name,
        type: 'region',
        x,
        y,
        radius: r,
        color: '#94a3b8',
        glow: '#38bdf8',
        cases: data.cases,
        severe: data.severe,
      };
      graphNodes.push(node);
      nodeLookup.set(node.id, node);
    });

    // 3. Connect valid edges
    const graphLinks: GraphLink[] = [];
    relationMap.forEach((rel) => {
      const dNode = nodeLookup.get(`disease-${rel.disease}`);
      const rNode = nodeLookup.get(`region-${rel.region}`);
      if (dNode && rNode) {
        graphLinks.push({
          id: `${dNode.id}->${rNode.id}`,
          source: dNode.id,
          target: rNode.id,
          sourceNode: dNode,
          targetNode: rNode,
          weight: rel.count,
          severeCount: rel.severe,
          color: dNode.color,
        });
      }
    });

    return { nodes: graphNodes, links: graphLinks };
  }, [records]);

  if (!records || records.length === 0 || nodes.length === 0) {
    return (
      <div className="p-6 rounded-3xl bg-[#080c18]/80 border border-slate-800/80 backdrop-blur-xl flex flex-col items-center justify-center min-h-[380px] text-center">
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3">
          <Network className="w-6 h-6 opacity-60" />
        </div>
        <h4 className="text-sm font-bold text-white font-mono">Disease Spread Network Graph</h4>
        <p className="text-xs text-slate-400 max-w-xs mt-1">
          No transmission records indexed yet. Upload case logs to map pathogen-to-region transmission vectors.
        </p>
      </div>
    );
  }

  const activeFocusId = selectedNodeId || hoveredNodeId;
  const activeNode = nodes.find((n) => n.id === activeFocusId);

  // Check if a link is connected to focused node
  const isLinkActive = (link: GraphLink) => {
    if (!activeFocusId) return true;
    return link.source === activeFocusId || link.target === activeFocusId;
  };

  const isNodeActive = (node: GraphNode) => {
    if (!activeFocusId) return true;
    if (node.id === activeFocusId) return true;
    return links.some(
      (l) =>
        (l.source === activeFocusId && l.target === node.id) ||
        (l.target === activeFocusId && l.source === node.id)
    );
  };

  return (
    <div className="p-6 rounded-3xl bg-gradient-to-b from-[#0b0f1e]/90 to-[#060812]/90 border border-slate-800/90 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Network className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Disease Spread Network Graph</h3>
            <p className="text-[11px] text-slate-400 font-mono">Topological pathogen transmission vectors</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono">
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            {links.length} Transmission Vectors
          </span>
          {selectedNodeId && (
            <button
              onClick={() => setSelectedNodeId(null)}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              Reset Isolation
            </button>
          )}
        </div>
      </div>

      {/* Interactive Canvas */}
      <div className="relative border border-slate-800/80 rounded-2xl bg-[#05070e] overflow-hidden select-none">
        <svg
          viewBox="0 0 640 360"
          className="w-full h-auto cursor-default"
          onClick={() => setSelectedNodeId(null)}
        >
          <defs>
            {/* Radial glow filter for active nodes */}
            <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background subtle radial rings */}
          <circle cx="320" cy="180" r="140" fill="none" stroke="rgba(148, 163, 184, 0.05)" strokeDasharray="4 4" />
          <circle cx="320" cy="180" r="75" fill="none" stroke="rgba(148, 163, 184, 0.06)" />

          {/* Links (Transmission Edges) */}
          <g>
            {links.map((link) => {
              const active = isLinkActive(link);
              const strokeW = Math.max(1, Math.min(5, Math.log2(link.weight + 1) * 1.2));

              return (
                <g key={link.id}>
                  <line
                    x1={link.sourceNode.x}
                    y1={link.sourceNode.y}
                    x2={link.targetNode.x}
                    y2={link.targetNode.y}
                    stroke={link.color}
                    strokeWidth={activeFocusId && active ? strokeW + 1.2 : strokeW}
                    strokeOpacity={active ? (activeFocusId ? 0.9 : 0.45) : 0.08}
                    strokeDasharray={link.severeCount > 0 ? '5 2' : undefined}
                    className="transition-all duration-300"
                  />

                  {/* Pulsing particle along active link */}
                  {active && (
                    <circle r="2" fill="#ffffff" opacity={activeFocusId ? 0.95 : 0.6}>
                      <animateMotion
                        path={`M ${link.sourceNode.x} ${link.sourceNode.y} L ${link.targetNode.x} ${link.targetNode.y}`}
                        dur={`${Math.max(1.8, 4 - Math.log2(link.weight + 1))}s`}
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}
                </g>
              );
            })}
          </g>

          {/* Nodes */}
          <g>
            {nodes.map((node) => {
              const active = isNodeActive(node);
              const isSelected = selectedNodeId === node.id || hoveredNodeId === node.id;
              const isDisease = node.type === 'disease';

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNodeId(node.id === selectedNodeId ? null : node.id);
                  }}
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                >
                  {/* Selection / Glow Ring */}
                  {isSelected && (
                    <circle
                      r={node.radius + 6}
                      fill="none"
                      stroke={node.color}
                      strokeWidth="2"
                      strokeDasharray="4 2"
                      className="animate-spin"
                      style={{ animationDuration: '8s' }}
                    />
                  )}

                  {/* Node Circle */}
                  <circle
                    r={isSelected ? node.radius + 2 : node.radius}
                    fill={isDisease ? node.color : '#1e293b'}
                    stroke={isDisease ? '#ffffff' : node.color}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    opacity={active ? 1 : 0.25}
                    filter={isSelected ? 'url(#nodeGlow)' : undefined}
                    className="transition-all duration-300"
                  />

                  {/* Inner Icon / Dot */}
                  {!isDisease && (
                    <circle r="3" fill="#38bdf8" opacity={active ? 1 : 0.3} />
                  )}

                  {/* Node Label */}
                  <text
                    y={node.radius + 12}
                    textAnchor="middle"
                    className={`font-mono text-[9px] pointer-events-none select-none transition-all ${
                      isSelected
                        ? 'fill-cyan-300 font-bold'
                        : active
                        ? 'fill-slate-300'
                        : 'fill-slate-600'
                    }`}
                  >
                    {node.name.length > 14 ? `${node.name.slice(0, 12)}…` : node.name}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Floating Detail Overlay */}
        {activeNode && (
          <div className="absolute bottom-3 left-3 p-3 rounded-xl bg-[#090d1c]/95 border border-cyan-500/40 text-xs font-mono shadow-2xl backdrop-blur-xl animate-fade-in max-w-xs">
            <div className="flex items-center gap-1.5 text-cyan-300 font-bold mb-1">
              {activeNode.type === 'disease' ? (
                <Activity className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              )}
              <span>{activeNode.name}</span>
            </div>
            <div className="text-[11px] text-slate-300 space-y-0.5">
              <div>
                Total Cases: <strong className="text-white">{activeNode.cases.toLocaleString()}</strong>
              </div>
              <div>
                Severe Acuity: <strong className="text-rose-400">{activeNode.severe}</strong> cases
              </div>
              <div className="text-[10px] text-slate-400 pt-0.5">
                Type: {activeNode.type === 'disease' ? 'Pathogen Epicenter' : 'Affected Geographic Zone'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Network Legend */}
      <div className="mt-3 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span>Pathogen Epicenters (Inner Ring)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-700 border border-cyan-400" />
            <span>Regional Hotspots (Outer Ring)</span>
          </div>
        </div>
        <span className="text-slate-500">Click any node to isolate transmission vectors</span>
      </div>
    </div>
  );
};
