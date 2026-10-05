import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  Network,
  Share2,
  MapPin,
  Activity,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Play,
  Pause,
  Sparkles,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';
import { OutbreakRecord, ActivePage } from '../types';
import { TAMIL_NADU_DISTRICTS } from '../services/dataScience';

interface NetworkGraphProps {
  records: OutbreakRecord[];
  onSelectPage: (page: ActivePage) => void;
  onLoadSample: () => void;
}

interface GraphNode {
  id: string;
  name: string;
  type: 'disease' | 'district';
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  cases: number;
  color: string;
  glowColor: string;
  pulsePhase: number;
}

interface GraphLink {
  id: string;
  source: string;
  target: string;
  sourceNode: GraphNode;
  targetNode: GraphNode;
  cases: number;
  color: string;
}

interface FlowParticle {
  linkId: string;
  progress: number; // 0 to 1
  speed: number;
  size: number;
  color: string;
}

const PALETTE = ['#06b6d4', '#a855f7', '#f43f5e', '#eab308', '#10b981', '#3b82f6'];

export const NetworkGraph: React.FC<NetworkGraphProps> = ({
  records,
  onSelectPage,
  onLoadSample,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [zoomScale, setZoomScale] = useState(1);
  const [selectedDiseaseFilter, setSelectedDiseaseFilter] = useState('All');

  // Build nodes & links
  const { nodes, links, spreadChains, diseaseList } = useMemo(() => {
    const disMap = new Map<string, number>();
    const distMap = new Map<string, number>();
    const relationMap = new Map<string, { count: number; disease: string; district: string }>();

    records.forEach((r) => {
      const dName = r.disease || 'Unknown Pathogen';
      const distName = r.region || r.district || 'Metropolitan';
      const count = r.cases && r.cases > 0 ? r.cases : 1;

      disMap.set(dName, (disMap.get(dName) || 0) + count);
      distMap.set(distName, (distMap.get(distName) || 0) + count);

      const relKey = `${dName}:::${distName}`;
      if (!relationMap.has(relKey)) {
        relationMap.set(relKey, { count: 0, disease: dName, district: distName });
      }
      relationMap.get(relKey)!.count += count;
    });

    const topDiseases = Array.from(disMap.entries())
      .filter(([d]) => selectedDiseaseFilter === 'All' || d === selectedDiseaseFilter)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    const topDistricts = Array.from(distMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12);

    const width = 840;
    const height = 520;
    const cx = width / 2;
    const cy = height / 2;

    const graphNodes: GraphNode[] = [];
    const nodeLookup = new Map<string, GraphNode>();

    // 1. Disease nodes in inner orbit
    const dRadius = 140;
    topDiseases.forEach(([name, count], idx) => {
      const angle = (idx / Math.max(1, topDiseases.length)) * 2 * Math.PI - Math.PI / 2;
      const x = cx + dRadius * Math.cos(angle);
      const y = cy + dRadius * Math.sin(angle);
      const color = PALETTE[idx % PALETTE.length];

      const node: GraphNode = {
        id: `dis-${name}`,
        name,
        type: 'disease',
        baseX: x,
        baseY: y,
        x,
        y,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.min(26, Math.max(18, 14 + Math.log2(count + 1) * 2.2)),
        cases: count,
        color,
        glowColor: color,
        pulsePhase: Math.random() * Math.PI * 2,
      };
      graphNodes.push(node);
      nodeLookup.set(node.id, node);
    });

    // 2. District nodes in outer orbit
    const distRadius = 245;
    topDistricts.forEach(([name, count], idx) => {
      const angle = (idx / Math.max(1, topDistricts.length)) * 2 * Math.PI - Math.PI / 2;
      const x = cx + distRadius * Math.cos(angle);
      const y = cy + distRadius * Math.sin(angle);

      const node: GraphNode = {
        id: `dist-${name}`,
        name,
        type: 'district',
        baseX: x,
        baseY: y,
        x,
        y,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: Math.min(18, Math.max(11, 8 + Math.log2(count + 1) * 1.5)),
        cases: count,
        color: '#38bdf8',
        glowColor: '#0284c7',
        pulsePhase: Math.random() * Math.PI * 2,
      };
      graphNodes.push(node);
      nodeLookup.set(node.id, node);
    });

    // 3. Connect links
    const graphLinks: GraphLink[] = [];
    relationMap.forEach((rel) => {
      const sNode = nodeLookup.get(`dis-${rel.disease}`);
      const tNode = nodeLookup.get(`dist-${rel.district}`);

      if (sNode && tNode) {
        graphLinks.push({
          id: `${sNode.id}-${tNode.id}`,
          source: sNode.id,
          target: tNode.id,
          sourceNode: sNode,
          targetNode: tNode,
          cases: rel.count,
          color: sNode.color,
        });
      }
    });

    // 4. Spread Chains: e.g. Chennai → Dengue → Chengalpattu
    const chains: { from: string; disease: string; to: string; cases: number }[] = [];
    topDiseases.forEach(([disName]) => {
      const linked = Array.from(relationMap.values())
        .filter((r) => r.disease === disName)
        .sort((a, b) => b.count - a.count)
        .map((r) => r.district);

      if (linked.length >= 2) {
        chains.push({
          from: linked[0],
          disease: disName,
          to: linked[1],
          cases: (relationMap.get(`${disName}:::${linked[0]}`)?.count || 0) +
                 (relationMap.get(`${disName}:::${linked[1]}`)?.count || 0),
        });
        if (linked.length >= 3) {
          chains.push({
            from: linked[1],
            disease: disName,
            to: linked[2],
            cases: relationMap.get(`${disName}:::${linked[2]}`)?.count || 0,
          });
        }
      } else if (linked.length === 1) {
        const neighbor = TAMIL_NADU_DISTRICTS[linked[0]]?.neighbors[0] || 'Adjacent Region';
        chains.push({
          from: linked[0],
          disease: disName,
          to: neighbor,
          cases: relationMap.get(`${disName}:::${linked[0]}`)?.count || 0,
        });
      }
    });

    return {
      nodes: graphNodes,
      links: graphLinks,
      spreadChains: chains,
      diseaseList: Array.from(disMap.keys()),
    };
  }, [records, selectedDiseaseFilter]);

  // Animated Flow Particles along links
  const particlesRef = useRef<FlowParticle[]>([]);

  useEffect(() => {
    // Generate flowing particles for links
    const newParticles: FlowParticle[] = [];
    links.forEach((link) => {
      const count = Math.min(4, Math.max(2, Math.ceil(Math.log2(link.cases + 1))));
      for (let i = 0; i < count; i++) {
        newParticles.push({
          linkId: link.id,
          progress: Math.random(),
          speed: 0.004 + Math.random() * 0.006,
          size: 2.2 + Math.random() * 1.5,
          color: link.color,
        });
      }
    });
    particlesRef.current = newParticles;
  }, [links]);

  // 60FPS Physics & Particle Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(zoomScale, zoomScale);
      ctx.translate(-cx, -cy);

      // 1. Update Physics (gentle oscillation)
      if (isPlaying) {
        nodes.forEach((n) => {
          n.pulsePhase += 0.04;
          n.x += n.vx;
          n.y += n.vy;

          // Soft spring pull back to base position
          const dx = n.baseX - n.x;
          const dy = n.baseY - n.y;
          n.vx += dx * 0.005;
          n.vy += dy * 0.005;
          n.vx *= 0.96;
          n.vy *= 0.96;
        });

        // Update Flowing Particles
        particlesRef.current.forEach((p) => {
          p.progress += p.speed;
          if (p.progress > 1) p.progress = 0;
        });
      }

      // 2. Render Links & Direction Arrows
      links.forEach((link) => {
        const isSelected =
          selectedNodeId &&
          (link.source === selectedNodeId || link.target === selectedNodeId);

        const isHovered =
          hoveredNodeId &&
          (link.source === hoveredNodeId || link.target === hoveredNodeId);

        const highlight = isSelected || isHovered;

        // Line
        ctx.strokeStyle = highlight ? '#06b6d4' : link.color;
        ctx.lineWidth = highlight ? 2.5 : Math.max(1.2, Math.min(3, Math.log2(link.cases + 1)));
        ctx.globalAlpha = highlight ? 0.9 : 0.35;

        ctx.beginPath();
        ctx.moveTo(link.sourceNode.x, link.sourceNode.y);
        ctx.lineTo(link.targetNode.x, link.targetNode.y);
        ctx.stroke();

        // Direction Arrow in the middle of link
        const midX = (link.sourceNode.x + link.targetNode.x) / 2;
        const midY = (link.sourceNode.y + link.targetNode.y) / 2;
        const angle = Math.atan2(link.targetNode.y - link.sourceNode.y, link.targetNode.x - link.sourceNode.x);

        const arrowSize = 6;
        ctx.fillStyle = highlight ? '#38bdf8' : link.color;
        ctx.globalAlpha = highlight ? 0.9 : 0.5;
        ctx.beginPath();
        ctx.moveTo(midX + Math.cos(angle) * arrowSize, midY + Math.sin(angle) * arrowSize);
        ctx.lineTo(midX + Math.cos(angle + 2.5) * arrowSize, midY + Math.sin(angle + 2.5) * arrowSize);
        ctx.lineTo(midX + Math.cos(angle - 2.5) * arrowSize, midY + Math.sin(angle - 2.5) * arrowSize);
        ctx.closePath();
        ctx.fill();
      });

      // 3. Render Flowing Particles
      ctx.globalAlpha = 1;
      particlesRef.current.forEach((p) => {
        const link = links.find((l) => l.id === p.linkId);
        if (!link) return;

        const px = link.sourceNode.x + (link.targetNode.x - link.sourceNode.x) * p.progress;
        const py = link.sourceNode.y + (link.targetNode.y - link.sourceNode.y) * p.progress;

        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // 4. Render Nodes with Pulsing Sonar Halos
      nodes.forEach((n) => {
        const isSelected = selectedNodeId === n.id;
        const isHovered = hoveredNodeId === n.id;
        const isDisease = n.type === 'disease';

        // Animated sonar ripple pulse
        const pulse = (Math.sin(n.pulsePhase) + 1) / 2;
        const pulseRadius = n.radius + 4 + pulse * (isDisease ? 12 : 6);

        ctx.strokeStyle = isDisease ? n.color : '#38bdf8';
        ctx.globalAlpha = isSelected || isHovered ? 0.7 : 0.25 - pulse * 0.15;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(n.x, n.y, pulseRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Node circle
        ctx.globalAlpha = 1;
        ctx.fillStyle = isDisease ? n.color : '#0f172a';
        ctx.strokeStyle = isSelected ? '#ffffff' : isDisease ? '#ffffff' : '#38bdf8';
        ctx.lineWidth = isSelected ? 2.5 : 1.5;
        ctx.shadowColor = n.color;
        ctx.shadowBlur = isDisease ? 15 : 6;

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Label
        ctx.font = isDisease ? 'bold 11px monospace' : '10px monospace';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(n.name, n.x, n.y + n.radius + 14);
      });

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [nodes, links, isPlaying, zoomScale, selectedNodeId, hoveredNodeId]);

  if (records.length === 0) {
    return (
      <div className="space-y-6 pb-16">
        <div>
          <h1 className="text-2xl font-black text-white font-mono">Disease Spread Network Graph</h1>
          <p className="text-xs text-slate-400 font-mono">Live multi-vector transmission networks &bull; Moving nodes & flowing particles</p>
        </div>

        <div className="p-12 rounded-3xl bg-[#080c18] border border-slate-800 text-center max-w-xl mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 mx-auto flex items-center justify-center">
            <Network className="w-7 h-7 animate-pulse" />
          </div>
          <h2 className="text-lg font-bold text-white font-mono">No Outbreak Records Loaded</h2>
          <p className="text-xs text-slate-400 font-mono leading-relaxed">
            Upload outbreak surveillance records or load the sample Tamil Nadu dataset to activate the live animated disease spread network graph with flowing particles and directional transmission arrows.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={onLoadSample}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs font-mono shadow-lg shadow-cyan-500/20 transition active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Load Sample Dataset
            </button>
            <button
              onClick={() => onSelectPage('dataset')}
              className="px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-medium text-xs font-mono hover:bg-slate-800 transition"
            >
              Upload CSV
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeNode = nodes.find((n) => n.id === selectedNodeId);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[#070913] border border-slate-800 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-purple-400 animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-mono">
              Disease Spread Network Graph
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Live physics simulation &bull; Animated photon particle streams & directional transmission vectors
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <select
            value={selectedDiseaseFilter}
            onChange={(e) => setSelectedDiseaseFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-300 focus:outline-none"
          >
            <option value="All">All Pathogens</option>
            {diseaseList.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => setIsPlaying((p) => !p)}
              className={`p-1.5 rounded-lg transition ${
                isPlaying ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
              }`}
              title={isPlaying ? 'Pause Motion' : 'Play Motion'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setZoomScale((z) => Math.min(1.4, z + 0.1))}
              className="p-1.5 text-slate-400 hover:text-white transition"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomScale((z) => Math.max(0.7, z - 0.1))}
              className="p-1.5 text-slate-400 hover:text-white transition"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setZoomScale(1);
                setSelectedNodeId(null);
              }}
              className="p-1.5 text-slate-400 hover:text-white transition"
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Network Canvas (8 cols) + Transmission Chains (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 p-6 rounded-3xl bg-[#080c18] border border-slate-800 relative overflow-hidden flex flex-col items-center shadow-xl">
          <div className="w-full flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              Moving Disease Hubs (Center)
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              District Satellites (Orbit)
            </span>
            <span className="hidden sm:inline text-purple-400 font-semibold">
              Live Particle Streams Active
            </span>
          </div>

          <div className="w-full overflow-x-auto flex justify-center py-2">
            <canvas
              ref={canvasRef}
              width={840}
              height={520}
              onClick={(e) => {
                const rect = canvasRef.current?.getBoundingClientRect();
                if (!rect) return;
                const clickX = e.clientX - rect.left;
                const clickY = e.clientY - rect.top;
                const cx = 840 / 2;
                const cy = 520 / 2;

                const clicked = nodes.find((n) => {
                  const screenX = cx + (n.x - cx) * zoomScale;
                  const screenY = cy + (n.y - cy) * zoomScale;
                  return Math.hypot(clickX - screenX, clickY - screenY) <= n.radius + 6;
                });

                setSelectedNodeId(clicked ? clicked.id : null);
              }}
              className="w-full max-w-[840px] h-auto select-none cursor-pointer"
            />
          </div>
        </div>

        {/* Right: Spread Chains (e.g. Chennai → Dengue → Chengalpattu) */}
        <div className="lg:col-span-4 space-y-4">
          {activeNode && (
            <div className="p-5 rounded-2xl bg-[#070b16] border border-cyan-500/40 space-y-2 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold">
                  Active Focus Node
                </span>
                <span className="text-[10px] font-mono text-slate-400 capitalize">
                  {activeNode.type}
                </span>
              </div>
              <h4 className="text-base font-black text-white font-mono">
                {activeNode.name}
              </h4>
              <div className="text-xs font-mono text-slate-300">
                Indexed Cases: <strong className="text-cyan-400">{activeNode.cases}</strong>
              </div>
            </div>
          )}

          <div className="p-6 rounded-3xl bg-[#080c18] border border-slate-800 space-y-4">
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                Cross-District Spread Chains
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Transmission sequences derived from geographical proximity & multi-district clustering
            </p>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {spreadChains.map((chain, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-[#060810] border border-slate-800/80 space-y-2 hover:border-slate-700 transition"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>Chain #{idx + 1}</span>
                    <span className="text-cyan-400">{chain.cases} linked cases</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-white flex-wrap">
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-200">
                      {chain.from}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span className="px-2 py-0.5 rounded bg-purple-500/20 border border-purple-500/40 text-purple-300">
                      {chain.disease}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300">
                      {chain.to}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
