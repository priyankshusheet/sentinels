import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

class SupabaseService:
    def __init__(self):
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        if url and key:
            self.client: Client = create_client(url, key)
        else:
            self.client = None

    def store_ranking(self, user_id: str, prompt_id: str, analysis: dict):
        if not self.client:
            return
        
        # Insert into prompt_rankings
        data = {
            "user_id": user_id,
            "prompt_id": prompt_id,
            "llm_platform": analysis.get("provider", "unknown"),
            "visibility": analysis.get("analysis", {}).get("visibility", "not_mentioned"),
            "confidence_score": analysis.get("analysis", {}).get("confidence_score", 0),
            "citations_found": len(analysis.get("analysis", {}).get("citations", [])),
            "ai_response": analysis.get("content", ""),
            "raw_response": analysis.get("raw", {})
        }
        self.client.table("prompt_rankings").insert(data).execute()

        # Insert discovered citations
        citations = analysis.get("analysis", {}).get("citations", [])
        for cit in citations:
            url = cit.get("url") if isinstance(cit, dict) else cit
            name = cit.get("name") if isinstance(cit, dict) else url
            
            citation_data = {
                "user_id": user_id,
                "source_name": name,
                "source_url": url,
                "sentiment": analysis.get("analysis", {}).get("sentiment", "neutral")
            }
            try:
                self.client.table("citations").insert(citation_data).execute()
            except:
                pass # Already exists or other error

supabase_service = SupabaseService()
