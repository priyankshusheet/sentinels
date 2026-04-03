import httpx
import logging

class AlertService:
    async def send_webhook_alert(self, webhook_url: str, message: str, platform: str = "Slack"):
        """
        Send a notification to Slack or Discord via webhook.
        """
        try:
            payload = {}
            if "slack.com" in webhook_url:
                payload = {"text": f"🚨 *SentinelAI Alert*: {message}"}
            elif "discord.com" in webhook_url:
                payload = {"content": f"🚨 **SentinelAI Alert**: {message}"}
            else:
                payload = {"text": message}

            async with httpx.AsyncClient() as client:
                response = await client.post(webhook_url, json=payload)
                response.raise_for_status()
                return True
        except Exception as e:
            logging.error(f"Failed to send {platform} alert: {str(e)}")
            return False

    async def check_for_ranking_drops(self, user_id: str, webhook_url: str):
        """
        Simulate a check for ranking drops and send alert if needed.
        """
        # In a real scenario, compare current vs past rankings in Supabase
        drop_detected = True # Simulation
        if drop_detected:
            msg = "Your visibility for 'best SEO tool' dropped from #2 to #8 on Claude."
            await self.send_webhook_alert(webhook_url, msg)

alert_service = AlertService()
