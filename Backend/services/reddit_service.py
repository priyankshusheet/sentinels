import praw
import os
from dotenv import load_dotenv

load_dotenv()

class RedditService:
    def __init__(self):
        client_id = os.getenv("REDDIT_CLIENT_ID")
        client_secret = os.getenv("REDDIT_CLIENT_SECRET")
        user_agent = os.getenv("REDDIT_USER_AGENT", "SentinelAI/1.0")
        
        if client_id and client_secret:
            self.reddit = praw.Reddit(
                client_id=client_id,
                client_secret=client_secret,
                user_agent=user_agent
            )
        else:
            self.reddit = None

    async def get_community_intel(self, keywords: list, limit: int = 10):
        if not self.reddit:
            # Fallback to mock data if no API keys
            return [
                {"title": "How to optimize for Perplexity AI?", "url": "https://reddit.com/r/seo/123", "score": 45, "created_utc": 1711111111},
                {"title": "GEO is the new SEO", "url": "https://reddit.com/r/marketing/456", "score": 88, "created_utc": 1711111122}
            ]
        
        all_posts = []
        for kw in keywords:
            # Note: search is blocking in praw, in a true async app we'd use asyncpraw
            # For this MVP, we'll run it normally or wrap in a thread
            for post in self.reddit.subreddit("all").search(kw, limit=limit):
                all_posts.append({
                    "title": post.title,
                    "url": post.url,
                    "score": post.score,
                    "created_utc": post.created_utc,
                    "subreddit": post.subreddit.display_name
                })
        
        # Sort by score
        all_posts.sort(key=lambda x: x["score"], reverse=True)
        return all_posts[:limit]

reddit_service = RedditService()
