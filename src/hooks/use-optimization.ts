import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useOptimization = (userId?: string) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);

  const generateWeeklyTasks = async (url: string) => {
    if (!userId || !url) return null;
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("weekly-tasks", {
        body: { url },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data.tasks;
    } catch (e: any) {
      toast.error(e.message);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const runTechnicalAudit = async (url: string) => {
    if (!url) return null;
    setIsAuditing(true);
    try {
      const { data, error } = await supabase.functions.invoke("technical-audit", {
        body: { url },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data.report;
    } catch (e: any) {
      toast.error(e.message);
      return null;
    } finally {
      setIsAuditing(false);
    }
  };

  const generateContentFix = async (topic: string, context: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: { topic, website_context: context },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data.generated_content;
    } catch (e: any) {
      toast.error("Content generation failed");
      return null;
    }
  };

  return {
    generateWeeklyTasks,
    runTechnicalAudit,
    generateContentFix,
    isGenerating,
    isAuditing
  };
};
