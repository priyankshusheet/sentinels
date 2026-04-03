import httpx
from bs4 import BeautifulSoup
import json
import logging

class AuditService:
    async def run_audit(self, url: str):
        try:
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                response = await client.get(url)
                response.raise_for_status()
                html = response.text
                
            soup = BeautifulSoup(html, 'lxml')
            
            # 1. Check Schema Markup (JSON-LD)
            schemas = soup.find_all('script', type='application/ld+json')
            has_schema = len(schemas) > 0
            schema_count = len(schemas)
            
            # 2. Check standard SEO elements
            title = soup.find('title')
            meta_desc = soup.find('meta', attrs={'name': 'description'})
            h1 = soup.find('h1')
            
            missing = []
            if not has_schema: missing.append("JSON-LD Schema Markup")
            if not title: missing.append("Meta Title")
            if not meta_desc: missing.append("Meta Description")
            if not h1: missing.append("H1 Heading")
            
            status = "Good" if not missing else "Needs Improvement"
            if len(missing) >= 3: status = "Poor"
            
            return {
                "url": url,
                "status": status,
                "has_schema": has_schema,
                "schema_count": schema_count,
                "missing_elements": missing,
                "metadata": {
                    "title": title.string if title else None,
                    "description": meta_desc.get('content') if meta_desc else None,
                    "h1": h1.get_text().strip() if h1 else None
                }
            }
        except Exception as e:
            logging.error(f"Audit failed for {url}: {str(e)}")
            return {"url": url, "status": "Error", "error": str(e)}

audit_service = AuditService()
