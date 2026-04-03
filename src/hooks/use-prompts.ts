import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type TrackedPrompt = Tables<"tracked_prompts"> & {
  latest_ranking?: Tables<"prompt_rankings"> | null;
  all_rankings?: Tables<"prompt_rankings">[];
};

export const usePrompts = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  const promptsQuery = useQuery({
    queryKey: ["prompts", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data: prompts, error } = await supabase
        .from("tracked_prompts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!prompts) return [];

      const { data: rankings, error: rankingsError } = await supabase
        .from("prompt_rankings")
        .select("*")
        .in("prompt_id", prompts.map(p => p.id))
        .order("checked_at", { ascending: false });

      if (rankingsError) throw rankingsError;

      const latestRankingsMap: Record<string, Tables<"prompt_rankings">> = {};
      const allRankingsMap: Record<string, Tables<"prompt_rankings">[]> = {};
      
      (rankings || []).forEach(curr => {
        if (!latestRankingsMap[curr.prompt_id]) {
          latestRankingsMap[curr.prompt_id] = curr;
        }
        if (!allRankingsMap[curr.prompt_id]) {
          allRankingsMap[curr.prompt_id] = [];
        }
        allRankingsMap[curr.prompt_id].push(curr);
      });

      return prompts.map(p => ({
        ...p,
        latest_ranking: latestRankingsMap[p.id] || null,
        all_rankings: allRankingsMap[p.id] || [],
      })) as TrackedPrompt[];
    },
    enabled: !!userId,
  });

  const addPromptMutation = useMutation({
    mutationFn: async (newPrompt: { query: string; category: string }) => {
      if (!userId) throw new Error("User not authenticated");
      const { data, error } = await supabase
        .from("tracked_prompts")
        .insert({ user_id: userId, ...newPrompt })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompts", userId] });
      toast.success("Prompt added!");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const deletePromptMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("tracked_prompts")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompts", userId] });
      toast.success("Prompt removed");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const analyzePromptMutation = useMutation({
    mutationFn: async ({ id, parallel = false }: { id: string; parallel?: boolean }) => {
      const { data: prompt, error: promptError } = await supabase
        .from("tracked_prompts")
        .select("*")
        .eq("id", id)
        .single();
      
      if (promptError) throw promptError;

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_name, selected_llms")
        .eq("user_id", userId!)
        .single();

      const body: any = {
        prompt_id: id,
        query: prompt.query,
        brand_name: profile?.company_name || "the brand",
        parallel,
      };

      // For multi-platform audit, send all selected LLMs
      if (parallel && profile?.selected_llms?.length) {
        body.multi_llm = profile.selected_llms.map((l: string) => l.toLowerCase());
      }

      const { data, error } = await supabase.functions.invoke("analyze-visibility", { body });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Analysis failed");

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompts", userId] });
      toast.success("Analysis complete!");
    },
    onError: (error: any) => {
      if (error.message?.includes("429") || error.message?.includes("Rate limit")) {
        toast.error("Rate limit exceeded. Please wait a moment and try again.");
      } else if (error.message?.includes("402")) {
        toast.error("AI credits exhausted. Please add credits in Settings.");
      } else {
        toast.error(`Analysis failed: ${error.message}`);
      }
    },
  });

  return {
    prompts: promptsQuery.data || [],
    isLoading: promptsQuery.isLoading,
    isError: promptsQuery.isError,
    error: promptsQuery.error,
    addPrompt: addPromptMutation.mutateAsync,
    isAdding: addPromptMutation.isPending,
    deletePrompt: deletePromptMutation.mutateAsync,
    isDeleting: deletePromptMutation.isPending,
    analyzePrompt: analyzePromptMutation.mutateAsync,
    isAnalyzing: analyzePromptMutation.isPending,
  };
};
