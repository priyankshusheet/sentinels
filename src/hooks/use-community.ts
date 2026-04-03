import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useCommunity = (keywords: string[]) => {
  return useQuery({
    queryKey: ["community-intel", keywords],
    queryFn: async () => {
      if (keywords.length === 0) return [];
      
      const { data, error } = await supabase.functions.invoke("community-intel", {
        body: { keywords },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data.posts || [];
    },
    enabled: keywords.length > 0,
    refetchInterval: 300000,
  });
};
