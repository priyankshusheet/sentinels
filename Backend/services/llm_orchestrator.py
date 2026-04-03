from services.llm_providers import OpenAIProvider, GeminiProvider, AnthropicProvider, GroqProvider, LLMProvider, MockProvider
from typing import List, Dict, Any, Optional, cast
import os
import logging

class LLMOrchestrator:
    def __init__(self):
        self.providers: List[LLMProvider] = []
        
        # Initialize providers based on available keys (skip placeholders)
        def is_valid(key):
            return key and not key.startswith("your_")

        if is_valid(os.getenv("OPENAI_API_KEY")):
            self.providers.append(OpenAIProvider(os.getenv("OPENAI_API_KEY")))
        if is_valid(os.getenv("GEMINI_API_KEY")):
            self.providers.append(GeminiProvider(os.getenv("GEMINI_API_KEY")))
        if is_valid(os.getenv("ANTHROPIC_API_KEY")):
            self.providers.append(AnthropicProvider(os.getenv("ANTHROPIC_API_KEY")))
        if is_valid(os.getenv("GROQ_API_KEY")):
            self.providers.append(GroqProvider(os.getenv("GROQ_API_KEY")))
        
        # Always add MockProvider for development fallback
        self.providers.append(MockProvider())

    async def generate_with_fallback(self, prompt: str, search_context: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Attempt to generate a response using providers in order of priority.
        """
        errors = []
        for provider in self.providers:
            try:
                return await provider.generate_response(prompt, search_context)
            except Exception as e:
                logging.error(f"Provider {provider.__class__.__name__} failed: {str(e)}")
                errors.append({"provider": provider.__class__.__name__, "error": str(e)})
        
        raise Exception(f"All LLM providers failed. Errors: {errors}")

    async def generate_parallel(self, prompt: str, search_context: List[Dict[str, Any]], requested_providers: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """
        Query multiple LLM providers in parallel.
        """
        import asyncio
        
        tasks = []
        available_providers: List[LLMProvider] = []
        
        for provider in self.providers:
            provider_name = provider.__class__.__name__.replace("Provider", "").lower()
            if requested_providers is None or provider_name in [p.lower() for p in (requested_providers or [])]:
                if not isinstance(provider, MockProvider): # Don't use Mock in parallel unless specified
                    available_providers.append(provider)
        
        # If no real providers found or requested, use first 2 available including mock
        if not available_providers:
            available_providers = cast(List[LLMProvider], self.providers[:2])

        for provider in available_providers:
            tasks.append(provider.generate_response(prompt, search_context))
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        final_results: List[Dict[str, Any]] = []
        for provider, result in zip(available_providers, results):
            if isinstance(result, Exception):
                logging.error(f"Parallel provider {provider.__class__.__name__} failed: {str(result)}")
                continue
            
            # Tag the result with the provider name if not already there
            res_dict = cast(Dict[str, Any], result)
            if "provider" not in res_dict:
                res_dict["provider"] = provider.__class__.__name__.replace("Provider", "")
            final_results.append(res_dict)
            
        return final_results

llm_orchestrator = LLMOrchestrator()
