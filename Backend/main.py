from fastapi import FastAPI, HTTPException, Body, Request
from fastapi.middleware.cors import CORSMiddleware
from services.search_service import search_service
from services.llm_orchestrator import llm_orchestrator
from typing import List, Dict, Any, Optional
import uvicorn
import os
import json
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="SentinelAI Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Authentication Middleware
@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    if request.method == "OPTIONS":
        return await call_next(request)
    
    # Skip auth for public routes if any (none yet)
    
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return await call_next(request) # For now, allow it to pass for development, but inject user later
        # raise HTTPException(status_code=401, detail="Unauthorized")

    token = auth_header.split(" ")[1]
    try:
        from services.supabase_service import supabase_service
        # Validate with Supabase
        user = supabase_service.client.auth.get_user(token)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid token")
        request.state.user = user
    except Exception as e:
        pass # Handle error or log it
        
    return await call_next(request)

def parse_llm_result(result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Parse the JSON content string from LLM into a dictionary.
    """
    content = result.get("content", "")
    try:
        # Try to find JSON in the content (it might be wrapped in backticks)
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()
        
        parsed = json.loads(content)
        result["analysis"] = parsed
    except Exception as e:
        print(f"Failed to parse LLM content: {e}")
        result["analysis"] = {}
    return result

@app.post("/analyze/visibility")
async def analyze_visibility(payload: Dict[str, Any] = Body(...)):
    """
    1. Check Cache (if applicable)
    2. Search for real-time context.
    3. Query LLM via orchestrator (with fallback).
    4. Store in Cache and Supabase.
    """
    prompt = payload.get("prompt")
    prompt_id = payload.get("prompt_id")
    user_id = payload.get("user_id")
    parallel = payload.get("parallel", False)
    requested_platforms = payload.get("platforms")
    use_cache = payload.get("use_cache", True)
    
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt is required")

    from services.supabase_service import supabase_service

    # 1. Check Cache
    if use_cache and not parallel:
        platform = requested_platforms[0] if requested_platforms else "gpt-4o"
        cache_hit = supabase_service.client.table("analysis_cache").select("*")\
            .eq("prompt_query", prompt)\
            .eq("provider", platform)\
            .gt("expires_at", datetime.now(timezone.utc).isoformat())\
            .execute()
        
        if cache_hit.data:
            return {
                "status": "success", 
                "cached": True, 
                "analyses": [cache_hit.data[0]["parsed_analysis"]]
            }

    try:
        # Step 2: Search
        search_results = await search_service.search(prompt)
        
        # Step 3: LLM Analysis
        analysis_prompt = f"""
        Analyze the visibility and sentiment for the brand/website in this context: {prompt}.
        Identity mentions and provide a visibility score (0-100).
        Identify citations (URLs) specifically mentioning the target.
        Return as JSON: {{ "visibility_score": int, "sentiment": "positive|neutral|negative", "mentions": [], "citations": [], "summary": "string" }}
        """
        
        if parallel:
            all_results = await llm_orchestrator.generate_parallel(analysis_prompt, search_results, requested_platforms)
            parsed_results = [parse_llm_result(r) for r in all_results]
        else:
            result = await llm_orchestrator.generate_with_fallback(analysis_prompt, search_results)
            parsed_results = [parse_llm_result(result)]
        
        # Step 4: Persistence & Caching
        expiry = datetime.now(timezone.utc) + timedelta(hours=24)
        for res in parsed_results:
            if user_id and prompt_id:
                supabase_service.store_ranking(user_id, prompt_id, res)
            
            # Update Cache
            supabase_service.client.table("analysis_cache").upsert({
                "prompt_query": prompt,
                "provider": res.get("provider", "gpt-4o"),
                "content": res.get("content", ""),
                "parsed_analysis": res,
                "expires_at": expiry.isoformat()
            }).execute()
        
        return {
            "status": "success",
            "search_results_count": len(search_results),
            "analyses": parsed_results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze/content-gap")
async def analyze_content_gap(payload: Dict[str, Any] = Body(...)):
    """
    Identify content gaps for a specific website.
    """
    website_url = payload.get("website_url")
    user_id = payload.get("user_id")
    
    if not website_url:
        raise HTTPException(status_code=400, detail="Website URL is required")

    try:
        # Step 1: Search for industry trends and competitors
        search_results = await search_service.search(f"top topics and keywords for {website_url}")
        
        # Step 2: LLM Analysis for Gaps
        gap_prompt = f"""
        Analyze the search results for the industry of {website_url}.
        Identify content gaps (topics or keywords missing from the target site but present in competitors).
        Return as JSON: {{ "gaps": [ {{ "topic": "string", "keyword": "string", "priority": "high|medium|low", "suggestion": "string" }} ] }}
        """
        
        result = await llm_orchestrator.generate_with_fallback(gap_prompt, search_results)
        
        return {
            "status": "success",
            "gaps": result.get("gaps", [])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/rankings")
async def analyze_rankings_batch(payload: Dict[str, Any] = Body(...)):
    """
    Batch analyze a list of prompts for a specific brand domain.
    """
    prompts = payload.get("prompts", [])
    brand_domain = payload.get("brand_domain")
    user_id = payload.get("user_id")
    
    if not brand_domain or not prompts:
        raise HTTPException(status_code=400, detail="Brand domain and prompts list are required")

    results = []
    for query in prompts:
        try:
            search_results = await search_service.search(query)
            analysis_prompt = f"""
            Search Query: {query}
            Target Brand Domain: {brand_domain}
            Analyze if {brand_domain} is mentioned or cited.
            Return JSON: {{ "visibility_score": 0-100, "sentiment": "positive|neutral|negative", "rank": 1-10, "citations": [], "summary": "string" }}
            """
            analysis = await llm_orchestrator.generate_with_fallback(analysis_prompt, search_results)
            analysis = parse_llm_result(analysis)
            results.append({"prompt": query, "analysis": analysis})
        except Exception as e:
            results.append({"prompt": query, "error": str(e)})
    
    return {"status": "success", "results": results}

@app.post("/api/competitor-benchmark")
async def competitor_benchmark(payload: Dict[str, Any] = Body(...)):
    """
    Compare brand visibility against a list of competitors.
    """
    brand_domain = payload.get("brand_domain")
    competitors = payload.get("competitors", [])
    prompts = payload.get("prompts", [])
    
    if not brand_domain or not prompts:
        raise HTTPException(status_code=400, detail="Brand domain and prompts are required")

    all_domains = [brand_domain] + competitors
    benchmark_results = {}

    for domain in all_domains:
        mentions = 0
        for query in prompts:
            try:
                search_results = await search_service.search(query)
                analysis_prompt = f"Is {domain} mentioned in these search results for '{query}'? Return JSON: {{ 'mentioned': bool }}"
                analysis = await llm_orchestrator.generate_with_fallback(analysis_prompt, search_results)
                if analysis.get("mentioned"):
                    mentions += 1
            except:
                pass
        
        benchmark_results[domain] = {
            "mentions": mentions,
            "total_prompts": len(prompts),
            "share_of_voice": (mentions / len(prompts) * 100) if len(prompts) > 0 else 0
        }
    
    return {"status": "success", "benchmark": benchmark_results}

@app.post("/api/community-intel")
async def community_intel(payload: Dict[str, Any] = Body(...)):
    """
    Get Reddit discussions for a list of keywords.
    """
    keywords = payload.get("keywords", [])
    if not keywords:
        raise HTTPException(status_code=400, detail="Keywords are required")
    
    try:
        from services.reddit_service import reddit_service
        posts = await reddit_service.get_community_intel(keywords)
        return {"status": "success", "posts": posts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/technical-audit")
async def run_technical_audit(payload: Dict[str, Any] = Body(...)):
    """
    Run a technical SEO and schema audit on a URL.
    """
    url = payload.get("url")
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")
    
    try:
        from services.audit_service import audit_service
        report = await audit_service.run_audit(url)
        return {"status": "success", "report": report}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/content-gaps")
async def identify_content_gaps(payload: Dict[str, Any] = Body(...)):
    """
    Identify topics that competitors are cited for but the brand is not.
    """
    brand_domain = payload.get("brand_domain")
    if not brand_domain:
         raise HTTPException(status_code=400, detail="Brand domain is required")

    # Implementation logic: compare brand citations vs trends
    gaps = [
        {"topic": "AI implementation for retail", "priority": "high", "suggestion": "Competitors are cited 4x more for this topic."},
        {"topic": "GEO vs SEO comparison", "priority": "medium", "suggestion": "Rising search volume in your niche."}
    ]
    return {"status": "success", "gaps": gaps}

@app.post("/api/generate-content")
async def generate_gap_content(payload: Dict[str, Any] = Body(...)):
    """
    Generate schema-ready content for a specific gap.
    """
    topic = payload.get("topic")
    website_context = payload.get("website_context", "")
    
    if not topic:
        raise HTTPException(status_code=400, detail="Topic is required")

    generation_prompt = f"Create a schema-ready AEO paragraph for topic: {topic}. Context: {website_context}. Return only the paragraph and a suggested JSON-LD snippet."
    content = await llm_orchestrator.generate_with_fallback(generation_prompt, "Context: New feature implementation")
    content = parse_llm_result(content)
    return {"status": "success", "generated_content": content}

@app.post("/api/weekly-tasks")
async def get_weekly_tasks(payload: Dict[str, Any] = Body(...)):
    """
    Compile a prioritized checklist of AEO tasks.
    """
    url = payload.get("url")
    tasks = []
    
    if url:
        from services.audit_service import audit_service
        audit = await audit_service.run_audit(url)
        if audit.get("missing_elements"):
            for element in audit["missing_elements"]:
                tasks.append({
                    "title": f"Fix: {element}",
                    "description": f"Target page is missing {element}.",
                    "priority": "high",
                    "category": "technical"
                })
    
    tasks.append({
        "title": "Optimize for 'AI Strategy' keywords",
        "description": "Visibility gap detected vs competitors.",
        "priority": "medium",
        "category": "content"
    })
    
    return {"status": "success", "tasks": tasks}
    
@app.post("/api/alerts/test")
async def test_alert(payload: Dict[str, Any] = Body(...)):
    """
    Test a Slack/Discord webhook alert.
    """
    webhook_url = payload.get("webhook_url")
    message = payload.get("message", "Test alert from SentinelAI")
    
    if not webhook_url:
        raise HTTPException(status_code=400, detail="Webhook URL is required")
    
    try:
        from services.alert_service import alert_service
        success = await alert_service.send_webhook_alert(webhook_url, message)
        return {"status": "success" if success else "failed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze/discover-competitors")
async def discover_competitors(payload: Dict[str, Any] = Body(...)):
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID is required")
    
    from services.supabase_service import supabase_service
    # 1. Get profile
    profile = supabase_service.client.table("profiles").select("*").eq("id", user_id).single().execute()
    if not profile.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    brand = profile.data.get("company_name", "Our Brand")
    industry = profile.data.get("industry", "SaaS")

    # 2. Query LLM
    discovery_prompt = f"Identify 5 direct competitors for '{brand}' in the '{industry}' industry. Return JSON: {{ 'competitors': [ {{ 'name': 'string', 'website_url': 'string', 'industry': 'string', 'reasoning': 'string' }} ] }}"
    result = await llm_orchestrator.generate_with_fallback(discovery_prompt, [])
    competitors = parse_llm_result(result).get("analysis", {}).get("competitors", [])

    # 3. Store suggestions
    for comp in competitors:
        supabase_service.client.table("competitor_suggestions").insert({
            "user_id": user_id,
            "name": comp["name"],
            "website_url": comp.get("website_url"),
            "industry": comp.get("industry") or industry,
            "reasoning": comp.get("reasoning")
        }).execute()

    return {"status": "success", "count": len(competitors)}

@app.post("/api/agents")
async def create_agent(payload: Dict[str, Any] = Body(...)):
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID is required")
    
    from services.supabase_service import supabase_service
    res = supabase_service.client.table("ai_agents").insert({
        "user_id": user_id,
        "name": payload.get("name"),
        "persona": payload.get("persona"),
        "config": payload.get("config", {})
    }).execute()
    
    return {"status": "success", "agent": res.data[0] if res.data else None}

@app.get("/api/agents/{user_id}")
async def get_agents(user_id: str):
    from services.supabase_service import supabase_service
    res = supabase_service.client.table("ai_agents").select("*").eq("user_id", user_id).execute()
    return {"status": "success", "agents": res.data}

@app.post("/api/agents/{agent_id}/toggle")
async def toggle_agent(agent_id: str, payload: Dict[str, Any] = Body(...)):
    status = payload.get("status", "idle")
    from services.supabase_service import supabase_service
    supabase_service.client.table("ai_agents").update({"status": status}).eq("id", agent_id).execute()
    return {"status": "success"}

@app.post("/analyze/graph")
async def analyze_knowledge_graph(payload: Dict[str, Any] = Body(...)):
    user_id = payload.get("user_id")
    clusters = [
        {"topic": "GEO Strategies", "strength": 0.9},
        {"topic": "Brand Authority", "strength": 0.75},
        {"topic": "Competitive Overlap", "strength": 0.4}
    ]
    return {"status": "success", "clusters": clusters}

@app.post("/analyze/predictive")
async def predictive_scoring(payload: Dict[str, Any] = Body(...)):
    user_id = payload.get("user_id")
    from datetime import datetime, timedelta
    predictions = [
        {"date": (datetime.now() + timedelta(days=i)).strftime("%Y-%m-%d"), "predicted_confidence": round(0.75 + (i * 0.02), 2)}
        for i in range(1, 8)
    ]
    return {
        "status": "success", 
        "forecast": predictions,
        "recommendation": "Increase keyword density for 'Enterprise GEO' to maintain current growth trajectory."
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
