from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import os
import openai
import anthropic
import google.generativeai as genai
from groq import Groq

class LLMProvider(ABC):
    @abstractmethod
    async def generate_response(self, prompt: str, search_context: List[Dict[str, Any]]) -> Dict[str, Any]:
        pass

class OpenAIProvider(LLMProvider):
    def __init__(self, api_key: str):
        self.client = openai.AsyncOpenAI(api_key=api_key)

    async def generate_response(self, prompt: str, search_context: List[Dict[str, Any]]) -> Dict[str, Any]:
        context_str = "\n".join([f"- {r['title']}: {r['link']}" for r in search_context])
        system_prompt = f"Analyze the visibility of the target brand for the given prompt. Context:\n{context_str}"
        
        response = await self.client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"} if "json" in prompt.lower() else None
        )
        return {
            "provider": "openai",
            "content": response.choices[0].message.content,
            "raw": response.model_dump()
        }

class GeminiProvider(LLMProvider):
    def __init__(self, api_key: str):
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-1.5-pro')

    async def generate_response(self, prompt: str, search_context: List[Dict[str, Any]]) -> Dict[str, Any]:
        context_str = "\n".join([f"- {r['title']}: {r['link']}" for r in search_context])
        full_prompt = f"Context:\n{context_str}\n\nPrompt: {prompt}"
        
        response = await self.model.generate_content_async(full_prompt)
        return {
            "provider": "gemini",
            "content": response.text,
            "raw": str(response)
        }

class AnthropicProvider(LLMProvider):
    def __init__(self, api_key: str):
        self.client = anthropic.AsyncAnthropic(api_key=api_key)

    async def generate_response(self, prompt: str, search_context: List[Dict[str, Any]]) -> Dict[str, Any]:
        context_str = "\n".join([f"- {r['title']}: {r['link']}" for r in search_context])
        system_prompt = f"Analyze visibility. Context:\n{context_str}"
        
        response = await self.client.messages.create(
            model="claude-3-opus-20240229",
            max_tokens=1024,
            system=system_prompt,
            messages=[{"role": "user", "content": prompt}]
        )
        return {
            "provider": "anthropic",
            "content": response.content[0].text,
            "raw": str(response)
        }

class GroqProvider(LLMProvider):
    def __init__(self, api_key: str):
        self.client = Groq(api_key=api_key)

    async def generate_response(self, prompt: str, search_context: List[Dict[str, Any]]) -> Dict[str, Any]:
        context_str = "\n".join([f"- {r['title']}: {r['link']}" for r in search_context])
        system_prompt = f"Analyze visibility. Context:\n{context_str}"
        
        response = self.client.chat.completions.create(
            model="mixtral-8x7b-32768",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ]
        )
class MockProvider(LLMProvider):
    async def generate_response(self, prompt: str, search_context: List[Dict[str, Any]]) -> Dict[str, Any]:
        return {
            "provider": "mock",
            "content": '{"visibility_score": 85, "sentiment": "positive", "mentions": ["Brand"], "citations": ["https://example.com"], "summary": "Brand is visible and well-received."}',
            "raw": {"status": "mocked"}
        }
