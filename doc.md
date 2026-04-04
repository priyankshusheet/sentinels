# SentinelAI: Ultimate Technical Manual & Architecture Deep-Dive

This document provides an exhaustive, phase-by-phase breakdown of the SentinelAI platform, detailing every API endpoint, backend service, and frontend connection.

---

## 🏛️ Project Architecture Overview

-   **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion, Lucide React, TanStack Query.
-   **Backend**: FastAPI (Python 3.10+), Uvicorn, Pydantic, HTTPX, BeautifulSoup4, PRAW.
-   **Infrastructure**: Supabase (PostgreSQL, Auth, RLS).
-   **AI Core**: Multi-provider Orchestrator (OpenAI, Gemini, Claude, Groq) with failover redundancy.

---

## 🚀 Phase 1: The GEO Foundation (The "Heart")

In this phase, we established the core connectivity between the user's browser, the Sentinel server, and the AI models.

### 📡 API Endpoint: `/analyze/visibility` (POST)
-   **Purpose**: The primary engine for checking brand visibility for a specific prompt.
-   **Backend Logic**:
    1.  **Search Context**: Calls `SearchService` (using Serper.dev) to get the latest web results for the prompt.
    2.  **LLM Orchestration**: Passes the search results + prompt to `llm_orchestrator.py`.
    3.  **Analysis**: The LLM identifies if the brand is mentioned, extracts citation URLs, calculates a visibility score (0-100), and performs sentiment analysis.
    4.  **Persistence**: Automatically saves the result to `prompt_rankings` and `citations` tables in Supabase via `supabase_service.py`.
-   **Frontend Connection**: 
    -   **Page**: `Prompts.tsx`
    -   **Trigger**: Clicking "Analyze" on a prompt card.
    -   **State**: Updates the local visibility score and time-since-last-check.

---

## 🚀 Phase 2: Core Feature Implementation (The "Eyes & Brain")

This phase added depth to the tracking and competitive analysis capabilities.

### 📡 API Endpoint: `/api/rankings` (POST)
-   **Purpose**: Batch-analyze all tracked prompts for a brand.
-   **Backend Logic**: Iterates through a list of prompts provided in the payload, running the Phase 1 visibility logic for each and returning a consolidated report.
-   **Frontend Connection**: 
    -   **Hook**: `use-prompts.ts`
    -   **Trigger**: The "Sync All" button in the dashboard header.

### 📡 API Endpoint: `/api/competitor-benchmark` (POST)
-   **Purpose**: Compare the brand's visibility directly against 5-10 rival domains.
-   **Backend Logic**: Queries the LLM to rank the provided brand domain against the competitor domains based on search context.
-   **Frontend Connection**: 
    -   **Page**: `Competitors.tsx`
    -   **Hook**: `useCompetitors`
    -   **Logic**: Updates the "Benchmark Matrix" table with comparative scores.

### 📡 API Endpoint: `/api/community-intel` (POST)
-   **Purpose**: Social listening on platforms like Reddit to understand how AI models "learn" about the brand from community sentiment.
-   **Backend Logic**: Uses `reddit_service.py` (PRAW) to fetch the top 10 relevant posts for a keyword and summarizes them using the LLM.
-   **Frontend Connection**: 
    -   **Component**: `CommunityIntelPanel.tsx` in the Dashboard.

---

## 🚀 Phase 3: Actionable Tools (The "Hands")

In Phase 3, we enabled the system to not just report data, but to provide fixes.

### 📡 API Endpoint: `/api/technical-audit` (POST)
-   **Purpose**: Run a "One-Click" technical SEO and AEO audit on any URL.
-   **Backend Logic**: `audit_service.py` fetches the page HTML, uses **BeautifulSoup4** to check for `<title>`, `<meta>`, and `<h1>` tags, and specifically looks for `json-ld` schema blocks.
-   **Frontend Connection**: 
    -   **Page**: `Optimization.tsx`
    -   **Action**: "Run Site Audit."

### 📡 API Endpoint: `/api/content-gaps` (POST)
-   **Purpose**: Identify topics that competitors are ranking for but the user's brand is not.
-   **Backend Logic**: Analyzes the `citations` table for competitors vs. the user's "Topics Covered" list to find missing keywords.
-   **Frontend Connection**: 
    -   **Page**: `Optimization.tsx`
    -   **Hook**: `useOptimization`.

### 📡 API Endpoint: `/api/generate-content` (POST)
-   **Purpose**: Generate AI-written content to fill identified gaps.
-   **Backend Logic**: Prompts the LLM Orchestrator to write a SEO-optimized section with embedded schema markup based on a gap topic.
-   **Frontend Connection**: 
    -   **Action**: The "One-Click Fix" button on any Content Gap task card.

### 📡 API Endpoint: `/api/weekly-tasks` (POST)
-   **Purpose**: Compile a prioritized checklist of AEO tasks.
-   **Backend Logic**: Aggregates data from recent audits (missing tags) and rankings (low-visibility prompts) into a JSON list of tasks.
-   **Frontend Connection**: 
    -   **Trigger**: "Generate Weekly Tasks" button in `Optimization.tsx`.

---

## 🚀 Phase 4: Integration & UX (The "Nerves")

The final phase unified the disparate features into a single cohesive experience.

### 📡 API Endpoint: `/api/alerts/test` (POST)
-   **Purpose**: Verify proactive notification webhooks.
-   **Backend Logic**: Uses `alert_service.py` (HTTPX) to send a POST request with a notification payload to a user-provided Slack or Discord webhook URL.
-   **Frontend Connection**: 
    -   **Component**: `AlertsPanel.tsx` in the Dashboard.

### 🔗 The "Super Hook": `useDashboardMetrics`
-   **Purpose**: The master connection between the Dashboard UI and the entire backend database.
-   **Details**:
    -   It runs 5 parallel queries to Supabase.
    -   **Tracked Prompts Count**: Fetches size of `tracked_prompts`.
    -   **Citations Found**: Totals rows in the `citations` table.
    -   **Content Gaps**: Filters `optimization_tasks` for "content_gap" categories.
    -   **Live Visibility Score**: Pulls the most recent `confidence_score` from `prompt_rankings`.
-   **Frontend Connection**: This hook is the sole source of truth for the 4 primary metric cards at the top of the [Dashboard](file:///c:/Users/Welcome/Desktop/SentinelAI/sentinel-ai/src/pages/Dashboard.tsx).

---

## ⚙️ Environment Configuration (.env)

The SentinelAI platform requires several environment variables to function correctly. These should be placed in a `.env` file in the `Backend` directory.

### Backend `.env` Template
```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Search Service (Serper.dev)
SERPER_API_KEY=your_serper_api_key

# LLM Provider API Keys
OPENAI_API_KEY=your_openai_api_key
GEMINI_API_KEY=your_google_gemini_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
GROQ_API_KEY=your_groq_api_key

# Reddit API (PRAW)
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
REDDIT_USER_AGENT=sentinel-ai-bot/1.0
```

---

## 🚀 How to Run the Application

### 1. Prerequisites
- **Python 3.10+**: For the backend API.
- **Node.js 18+**: For the frontend React application.
- **Supabase Account**: A project with the schema from `supabase/migrations/` applied.

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd Backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   .\venv\Scripts\activate  # Windows
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

### 3. Frontend Setup
1. Open a new terminal and navigate to the root directory:
   ```bash
   cd sentinel-ai
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser to `http://localhost:5173`.

---

## 🛠️ Global Connection Pattern

Every interaction follows this strict flow:
1.  **User Trigger**: Click a button (e.g., "Run Audit").
2.  **Frontend Hook**: The component calls a custom hook (e.g., `useOptimization`).
3.  **Backend Fetch**: The hook uses `fetch()` or Supabase client to call the FastAPI endpoint at `localhost:8000`.
4.  **Backend Processing**: FastAPI service processes the request (LLM, Search, or DB).
5.  **Persistence**: Backend saves state to Supabase.
6.  **UI Update**: Frontend receives JSON, updates state, and displays results/toasts immediately.

This architecture ensures that the application is **fully decoupled**, meaning you can swap out the backend language or the AI models without breaking the user experience.
