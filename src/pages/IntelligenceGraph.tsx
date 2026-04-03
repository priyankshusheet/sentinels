import { useState, useEffect, useCallback, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Sparkles, Share2, ZoomIn, ZoomOut, Loader2, AlertTriangle, TrendingUp, Shield, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface GraphNode {
  id: string;
  label: string;
  type: "brand" | "topic" | "citation" | "competitor" | "llm_platform";
  weight: number;
  metadata: Record<string, any>;
  x?: number;
  y?: number;
}

interface GraphEdge {
  source: string;
  target: string;
  type: string;
  weight: number;
  label?: string;
}

interface Insight {
  title: string;
  description: string;
  impact: string;
  category: string;
}

const NODE_COLORS: Record<string, { fill: string; glow: string; label: string }> = {
  brand: { fill: "hsl(var(--primary))", glow: "rgba(0,212,255,0.6)", label: "Your Brand" },
  topic: { fill: "hsl(270, 70%, 60%)", glow: "rgba(168,85,247,0.4)", label: "Topics" },
  citation: { fill: "hsl(142, 71%, 45%)", glow: "rgba(34,197,94,0.4)", label: "Citations" },
  competitor: { fill: "hsl(45, 93%, 47%)", glow: "rgba(234,179,8,0.4)", label: "Competitors" },
  llm_platform: { fill: "hsl(330, 70%, 55%)", glow: "rgba(236,72,153,0.4)", label: "LLM Platforms" },
};

const INSIGHT_ICONS: Record<string, any> = {
  gap: AlertTriangle,
  opportunity: TrendingUp,
  risk: Shield,
  strength: Sparkles,
};

const WIDTH = 800;
const HEIGHT = 500;
const CX = WIDTH / 2;
const CY = HEIGHT / 2;

function layoutNodes(nodes: GraphNode[]): GraphNode[] {
  if (nodes.length === 0) return [];
  const laid = [...nodes];
  const brand = laid.find(n => n.type === "brand");
  if (brand) { brand.x = CX; brand.y = CY; }

  const grouped: Record<string, GraphNode[]> = {};
  for (const n of laid) {
    if (n.type === "brand") continue;
    if (!grouped[n.type]) grouped[n.type] = [];
    grouped[n.type].push(n);
  }

  const typeKeys = Object.keys(grouped);
  const ringGap = 120;

  typeKeys.forEach((type, typeIdx) => {
    const group = grouped[type];
    const radius = 140 + typeIdx * ringGap;
    const angleStart = (typeIdx * Math.PI * 0.4);
    const angleStep = (2 * Math.PI) / Math.max(group.length, 1);

    group.forEach((n, i) => {
      const angle = angleStart + i * angleStep;
      n.x = CX + radius * Math.cos(angle);
      n.y = CY + radius * Math.sin(angle);
    });
  });

  return laid;
}

export default function IntelligenceGraph() {
  const { user } = useAuth();
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [insights, setInsights] = useState<{ insights: Insight[]; overall_health: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchGraph = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("knowledge-graph", {});
        if (error) throw error;
        const laidOut = layoutNodes(data.nodes || []);
        setNodes(laidOut);
        setEdges(data.edges || []);
        setInsights(data.insights);
        setStats(data.stats);
      } catch (e: any) {
        toast.error("Failed to load knowledge graph: " + e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchGraph();
  }, [user]);

  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));
  const hoveredNode = hovered ? nodeMap[hovered] : null;

  const connectedIds = new Set<string>();
  if (hovered) {
    connectedIds.add(hovered);
    edges.forEach(e => {
      if (e.source === hovered) connectedIds.add(e.target);
      if (e.target === hovered) connectedIds.add(e.source);
    });
  }

  const getNodeRadius = (n: GraphNode) => {
    if (n.type === "brand") return 28;
    return Math.max(8, Math.min(18, n.weight / 8));
  };

  return (
    <DashboardLayout>
      <TooltipProvider>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Knowledge Graph</h1>
              <p className="text-muted-foreground mt-1">Entity relationships as seen by AI models</p>
            </div>
            <div className="flex items-center gap-3">
              {stats && (
                <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5 text-[10px] font-bold uppercase tracking-widest">
                  {stats.total_nodes} entities · {stats.total_edges} connections
                </Badge>
              )}
            </div>
          </div>

          {loading ? (
            <div className="aspect-[16/9] w-full bg-card rounded-3xl border border-border flex items-center justify-center">
              <div className="text-center space-y-4">
                <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
                <p className="text-sm text-muted-foreground">Building entity graph...</p>
              </div>
            </div>
          ) : nodes.length < 2 ? (
            <div className="aspect-[16/9] w-full bg-card rounded-3xl border border-border flex items-center justify-center">
              <div className="text-center space-y-4 max-w-md">
                <Sparkles className="h-12 w-12 text-muted-foreground/30 mx-auto" />
                <h2 className="text-xl font-bold text-foreground">Not enough data yet</h2>
                <p className="text-sm text-muted-foreground">Track some prompts, add citations, and run visibility analyses to build your knowledge graph.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="relative bg-[#0a0f18] rounded-3xl border border-border overflow-hidden shadow-2xl" style={{ height: HEIGHT * zoom }}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1a365d33_0%,_transparent_70%)]" />

                {/* Controls */}
                <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
                  <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.min(z + 0.2, 2))} className="bg-background/80 backdrop-blur-md border border-border h-8 w-8">
                    <ZoomIn size={14} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.max(z - 0.2, 0.6))} className="bg-background/80 backdrop-blur-md border border-border h-8 w-8">
                    <ZoomOut size={14} />
                  </Button>
                </div>

                {/* Legend */}
                <div className="absolute top-4 right-4 z-20 flex flex-wrap gap-3">
                  {Object.entries(NODE_COLORS).map(([type, colors]) => (
                    <div key={type} className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: colors.fill, boxShadow: `0 0 6px ${colors.glow}` }} />
                      {colors.label}
                    </div>
                  ))}
                </div>

                <svg width="100%" height="100%" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="overflow-visible">
                  {/* Edges */}
                  {edges.map((edge, i) => {
                    const src = nodeMap[edge.source];
                    const tgt = nodeMap[edge.target];
                    if (!src?.x || !tgt?.x) return null;
                    const isActive = hovered && (connectedIds.has(edge.source) && connectedIds.has(edge.target));
                    const opacity = hovered ? (isActive ? 0.7 : 0.08) : 0.25;
                    return (
                      <line
                        key={`${edge.source}-${edge.target}-${i}`}
                        x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                        stroke={isActive ? NODE_COLORS[src.type]?.fill || "hsl(var(--border))" : "hsl(var(--border))"}
                        strokeWidth={isActive ? 1.5 : 0.5}
                        strokeOpacity={opacity}
                        strokeDasharray={edge.type === "competes_with" || edge.type === "competes_in" ? "4 4" : undefined}
                      />
                    );
                  })}

                  {/* Nodes */}
                  {nodes.map((node) => {
                    const r = getNodeRadius(node);
                    const colors = NODE_COLORS[node.type] || NODE_COLORS.brand;
                    const isActive = !hovered || connectedIds.has(node.id);
                    const isHovered = hovered === node.id;

                    return (
                      <g
                        key={node.id}
                        style={{ cursor: "pointer" }}
                        onMouseEnter={() => setHovered(node.id)}
                        onMouseLeave={() => setHovered(null)}
                        opacity={isActive ? 1 : 0.2}
                      >
                        {isHovered && (
                          <circle cx={node.x} cy={node.y} r={r + 6} fill="none" stroke={colors.fill} strokeWidth={1.5} strokeOpacity={0.5} />
                        )}
                        <circle
                          cx={node.x} cy={node.y} r={r}
                          fill={colors.fill}
                          fillOpacity={0.85}
                          style={{ filter: isHovered ? `drop-shadow(0 0 12px ${colors.glow})` : `drop-shadow(0 0 4px ${colors.glow})` }}
                        />
                        <text
                          x={node.x} y={(node.y || 0) + r + 14}
                          textAnchor="middle" fontSize={node.type === "brand" ? 10 : 8}
                          fontWeight={node.type === "brand" ? "700" : "500"}
                          fill={isActive ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))"}
                          style={{ pointerEvents: "none" }}
                        >
                          {node.label.length > 16 ? node.label.slice(0, 14) + "…" : node.label}
                        </text>
                        {node.type === "brand" && (
                          <text x={node.x} y={(node.y || 0) + 4} textAnchor="middle" fontSize={8} fontWeight="700" fill="white" style={{ pointerEvents: "none" }}>
                            ★
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>

                {/* Hover tooltip */}
                <AnimatePresence>
                  {hoveredNode && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="absolute bottom-4 left-4 bg-card border border-border rounded-xl p-4 text-sm shadow-lg max-w-xs z-20"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: NODE_COLORS[hoveredNode.type]?.fill }} />
                        <span className="font-bold text-foreground">{hoveredNode.label}</span>
                        <Badge variant="outline" className="text-[9px] uppercase">{hoveredNode.type.replace("_", " ")}</Badge>
                      </div>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        {hoveredNode.metadata.domain && <p>Domain: {hoveredNode.metadata.domain}</p>}
                        {hoveredNode.metadata.mentions !== undefined && <p>Mentions: {hoveredNode.metadata.mentions}</p>}
                        {hoveredNode.metadata.sentiment && <p>Sentiment: {hoveredNode.metadata.sentiment}</p>}
                        {hoveredNode.metadata.mention_rate !== undefined && <p>Mention rate: {hoveredNode.metadata.mention_rate}%</p>}
                        {hoveredNode.metadata.avg_score !== undefined && <p>Avg score: {hoveredNode.metadata.avg_score}%</p>}
                        {hoveredNode.metadata.prompt_count !== undefined && <p>Prompts: {hoveredNode.metadata.prompt_count}</p>}
                        {hoveredNode.metadata.industry && <p>Industry: {hoveredNode.metadata.industry}</p>}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* AI Insights */}
              {insights && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-primary" /> AI Strategic Insights
                    </h2>
                    <Badge variant="outline" className="border-primary/20 text-primary">
                      Graph Health: {insights.overall_health}%
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {insights.insights.map((insight, i) => {
                      const Icon = INSIGHT_ICONS[insight.category] || Sparkles;
                      const impactColor = insight.impact === "high" ? "text-destructive" : insight.impact === "medium" ? "text-warning" : "text-muted-foreground";
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="bg-card rounded-2xl border border-border p-5 hover:border-primary/20 transition-all"
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <Icon className={cn("h-4 w-4", impactColor)} />
                            <Badge variant="outline" className={cn("text-[9px] uppercase", impactColor)}>{insight.impact} impact</Badge>
                          </div>
                          <h3 className="font-semibold text-foreground mb-1 text-sm">{insight.title}</h3>
                          <p className="text-xs text-muted-foreground leading-relaxed">{insight.description}</p>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </TooltipProvider>
    </DashboardLayout>
  );
}
