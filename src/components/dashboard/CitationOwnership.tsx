import { motion } from "framer-motion";
import { ExternalLink, Crown, Star, Award } from "lucide-react";

interface Citation {
  rank: number;
  source: string;
  domain: string;
  mentions: number;
  authority: number;
  isOwned: boolean;
}

const citations: Citation[] = [
  { rank: 1, source: "G2 Reviews", domain: "g2.com", mentions: 156, authority: 94, isOwned: true },
  { rank: 2, source: "Capterra", domain: "capterra.com", mentions: 128, authority: 91, isOwned: true },
  { rank: 3, source: "Product Hunt", domain: "producthunt.com", mentions: 87, authority: 88, isOwned: false },
  { rank: 4, source: "TechCrunch", domain: "techcrunch.com", mentions: 64, authority: 96, isOwned: false },
  { rank: 5, source: "Your Blog", domain: "yourbrand.com/blog", mentions: 52, authority: 72, isOwned: true },
];

export function CitationOwnership() {
  const ownedCount = citations.filter(c => c.isOwned).length;
  const totalMentions = citations.reduce((acc, c) => acc + c.mentions, 0);

  return (
    <div className="rounded-2xl bg-card p-6 border border-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Citation Sources</h3>
          <p className="text-sm text-muted-foreground">Where AI finds your brand information</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Owned:</span>
          <span className="font-semibold text-primary">{ownedCount}/{citations.length}</span>
        </div>
      </div>

      <div className="space-y-3">
        {citations.map((citation, index) => (
          <motion.div
            key={citation.rank}
            className="flex items-center gap-4 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors group cursor-pointer"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            {/* Rank badge */}
            <div className="flex h-8 w-8 items-center justify-center">
              {citation.rank === 1 && <Crown className="h-5 w-5 text-yellow-500" />}
              {citation.rank === 2 && <Star className="h-5 w-5 text-slate-400" />}
              {citation.rank === 3 && <Award className="h-5 w-5 text-amber-600" />}
              {citation.rank > 3 && (
                <span className="text-sm font-medium text-muted-foreground">#{citation.rank}</span>
              )}
            </div>

            {/* Source info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">{citation.source}</span>
                {citation.isOwned && (
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-success/20 text-success">
                    Owned
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <span>{citation.domain}</span>
                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>

            {/* Metrics */}
            <div className="text-right">
              <div className="text-sm font-semibold text-foreground">{citation.mentions} mentions</div>
              <div className="text-xs text-muted-foreground">Authority: {citation.authority}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Summary */}
      <motion.div
        className="mt-6 pt-6 border-t border-border flex items-center justify-between"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <div>
          <p className="text-sm text-muted-foreground">Total citations this month</p>
          <p className="text-2xl font-bold text-foreground">{totalMentions}</p>
        </div>
        <button className="px-4 py-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary/10 transition-colors">
          Analyze sources
        </button>
      </motion.div>
    </div>
  );
}
