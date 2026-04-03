import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface Node {
  id: string;
  label: string;
  type: "brand" | "owned" | "external";
  x: number;
  y: number;
  mentions: number;
}

interface Edge {
  source: string;
  target: string;
  weight: number;
}

const WIDTH = 480;
const HEIGHT = 300;
const CENTER_X = WIDTH / 2;
const CENTER_Y = HEIGHT / 2;

const typeColor: Record<string, string> = {
  brand: "hsl(var(--primary))",
  owned: "hsl(var(--success))",
  external: "hsl(var(--muted-foreground))",
};

export function CitationNodeMap() {
  const { user } = useAuth();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      const { data: citations, error } = await supabase
        .from("citations")
        .select("*")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching citations map:", error);
        setLoading(false);
        return;
      }

      const rawNodes = [
        { id: "brand", label: "Your Brand", type: "brand" as const, mentions: 100 },
        ...(citations || []).map((c: any) => ({
          id: c.id,
          label: c.source_name,
          type: "external" as const, // For now, treat all as external unless we add owned logic
          mentions: 1
        }))
      ];

      const radius = 100;
      const angleStep = (2 * Math.PI) / (rawNodes.length - 1 || 1);
      
      const finalNodes = rawNodes.map((n, i) => {
        if (n.id === "brand") return { ...n, x: CENTER_X, y: CENTER_Y };
        return {
          ...n,
          x: CENTER_X + radius * Math.cos(angleStep * (i - 1) - Math.PI / 2),
          y: CENTER_Y + radius * Math.sin(angleStep * (i - 1) - Math.PI / 2),
        };
      });

      const finalEdges = (citations || []).map((c: any) => ({
        source: "brand",
        target: c.id,
        weight: 1
      }));

      setNodes(finalNodes);
      setEdges(finalEdges);
      setLoading(false);
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="rounded-2xl bg-card p-6 border border-border h-[400px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));
  const hoveredNode = hovered ? nodeMap[hovered] : null;

  return (
    <div className="rounded-2xl bg-card p-6 border border-border">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Citation Node Map</h3>
          <p className="text-sm text-muted-foreground">Visual connection of brand sources</p>
        </div>
      </div>

      <div className="relative" style={{ height: HEIGHT }}>
        <svg width="100%" height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="overflow-visible">
          {/* Edges */}
          {edges.map((edge) => {
            const src = nodeMap[edge.source];
            const tgt = nodeMap[edge.target];
            if (!src || !tgt) return null;
            const isActive = hovered === edge.source || hovered === edge.target;
            return (
              <motion.line
                key={`${edge.source}-${edge.target}`}
                x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                stroke={isActive ? "hsl(var(--primary))" : "hsl(var(--border))"}
                strokeWidth={1}
                strokeOpacity={isActive ? 0.9 : 0.4}
              />
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const r = node.type === "brand" ? 22 : 10;
            const isHovered = hovered === node.id;
            return (
              <motion.g
                key={node.id}
                style={{ cursor: "pointer" }}
                onHoverStart={() => setHovered(node.id)}
                onHoverEnd={() => setHovered(null)}
              >
                <circle cx={node.x} cy={node.y} r={r} fill={typeColor[node.type]} fillOpacity={0.85} />
                <text
                  x={node.x} y={node.y + 4}
                  textAnchor="middle" fontSize={6}
                  fontWeight="600" fill="white"
                  style={{ pointerEvents: "none" }}
                >
                  {node.type === "brand" ? "YOU" : ""}
                </text>
              </motion.g>
            );
          })}
        </svg>

        {hoveredNode && (
          <div className="absolute bottom-0 right-0 bg-popover border border-border rounded-xl p-3 text-sm shadow-lg min-w-36">
            <p className="font-semibold text-foreground">{hoveredNode.label}</p>
            <p className="text-muted-foreground text-xs mt-0.5">{hoveredNode.type}</p>
          </div>
        )}
      </div>
    </div>
  );
}
