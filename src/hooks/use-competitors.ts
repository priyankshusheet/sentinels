import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useCompetitors = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  const competitorsQuery = useQuery({
    queryKey: ["competitors", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competitors")
        .select("*")
        .eq("user_id", userId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const benchmarkMutation = useMutation({
    mutationFn: async ({ brandDomain, competitors, prompts }: { brandDomain: string, competitors: string[], prompts: string[] }) => {
      const { data, error } = await supabase.functions.invoke("competitor-benchmark", {
        body: { brand_domain: brandDomain, competitors, prompts },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competitors", userId] });
    },
  });

  return {
    competitors: competitorsQuery.data || [],
    isLoading: competitorsQuery.isLoading,
    runBenchmark: benchmarkMutation.mutateAsync,
    isBenchmarking: benchmarkMutation.isPending,
  };
};
