import httpx
import os
import logging
from typing import List, Dict, Any

class SearchService:
    def __init__(self):
        self.api_key = os.getenv("SERPER_API_KEY")
        self.base_url = "https://google.serper.dev/search"

    async def search(self, query: str) -> List[Dict[str, Any]]:
        """
        Perform a search query using Serper.dev.
        """
        if not self.api_key:
            # Mock data for development if API key is missing
            return [
                {"title": "Sample Result 1", "link": "https://example.com/1", "snippet": "Snippet 1"},
                {"title": "Sample Result 2", "link": "https://example.com/2", "snippet": "Snippet 2"},
            ]

        headers = {
            'X-API-KEY': self.api_key,
            'Content-Type': 'application/json'
        }
        payload = {"q": query}

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(self.base_url, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()
                return data.get("organic", [])
            except Exception as e:
                logging.error(f"Search failed: {str(e)}")
                return []

search_service = SearchService()
