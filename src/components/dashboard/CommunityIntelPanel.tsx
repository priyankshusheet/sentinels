import { motion } from "framer-motion";
import { MessageSquare, ExternalLink, TrendingUp } from "lucide-react";
import { useCommunity } from "@/hooks/use-community";

export const CommunityIntelPanel = ({ keywords }: { keywords: string[] }) => {
  const { data: posts, isLoading } = useCommunity(keywords);

  return (
    <div className="rounded-2xl bg-card p-6 border border-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Community Intelligence</h3>
          <p className="text-sm text-muted-foreground">Recent discussions from Reddit & Social</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">
          Live Feed
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-secondary/20 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {posts?.map((post: any, index: number) => (
            <motion.a
              key={index}
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="block p-4 rounded-xl bg-secondary/5 border border-border hover:border-primary/50 transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">r/{post.subreddit || "community"}</span>
                    <span className="text-[10px] text-muted-foreground">• {post.score} points</span>
                  </div>
                  <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h4>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
              </div>
            </motion.a>
          ))}
          {(!posts || posts.length === 0) && (
            <div className="text-center py-8 text-muted-foreground italic text-sm">
              No recent discussions found for your keywords.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
