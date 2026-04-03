
SELECT cron.schedule(
  'scheduled-analysis-daily',
  '0 6 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://eupzhjktffzmzzcddemn.supabase.co/functions/v1/scheduled-analysis',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1cHpoamt0ZmZ6bXp6Y2RkZW1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MzQ3OTMsImV4cCI6MjA4NjQxMDc5M30.rGLCYDRdbel6qFrTcqvJ4-OYl4htb25QkIDy93P4XxQ"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);
