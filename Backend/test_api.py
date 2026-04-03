import httpx
import asyncio
import json

async def test_visibility():
    async with httpx.AsyncClient() as client:
        try:
            print("Testing /analyze/visibility...")
            response = await client.post(
                "http://localhost:8000/analyze/visibility", 
                json={"prompt": "Best project management tools for 2024", "website_id": None},
                timeout=30.0
            )
            print(f"Status: {response.status_code}")
            print(f"Response: {json.dumps(response.json(), indent=2)}")
        except Exception as e:
            print(f"Error: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_visibility())
