# Software Requirements Specification (SRS)

## Sentinel AI — AI Visibility & Answer Engine Optimization Platform

**Version**: 1.0  
**Date**: April 2025  
**Document Status**: Approved  

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Overall Description](#2-overall-description)
3. [Specific Requirements](#3-specific-requirements)
4. [External Interface Requirements](#4-external-interface-requirements)
5. [System Features](#5-system-features)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [Data Requirements](#7-data-requirements)
8. [Security Requirements](#8-security-requirements)
9. [Compliance Requirements](#9-compliance-requirements)
10. [Appendices](#10-appendices)

---

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification (SRS) document describes the functional and non-functional requirements for the Sentinel AI platform—a web-based application for monitoring, analyzing, and optimizing brand visibility across AI-powered answer engines (ChatGPT, Claude, Gemini, Perplexity).

This document is intended for developers, testers, project managers, and stakeholders involved in the development and evaluation of the platform.

### 1.2 Scope

Sentinel AI is a single-page web application (SPA) with a serverless backend. It provides:

- User authentication and profile management
- Guided onboarding with AI-powered brand analysis
- Real-time dashboard with visibility metrics
- Prompt tracking across multiple LLM platforms
- Citation source auditing
- Competitor benchmarking
- AI-generated optimization tasks
- Community intelligence monitoring
- Predictive analytics
- Report generation

### 1.3 Definitions, Acronyms, and Abbreviations

| Term | Definition |
|------|-----------|
| AEO | Answer Engine Optimization |
| LLM | Large Language Model |
| RLS | Row-Level Security |
| JWT | JSON Web Token |
| SPA | Single-Page Application |
| RAG | Retrieval-Augmented Generation |
| GDPR | General Data Protection Regulation (EU) |
| CCPA | California Consumer Privacy Act (US) |
| DPDPA | Digital Personal Data Protection Act 2023 (India) |
| UK-GDPR | UK General Data Protection Regulation |

### 1.4 References

- IEEE 830-1998: IEEE Recommended Practice for Software Requirements Specifications
- Supabase Documentation: https://supabase.com/docs
- React Documentation: https://react.dev
- OWASP Top 10 (2021): https://owasp.org/www-project-top-ten/

### 1.5 Overview

Section 2 provides an overall product description. Section 3 details specific functional requirements. Sections 4–9 cover interfaces, non-functional, data, security, and compliance requirements.

---

## 2. Overall Description

### 2.1 Product Perspective

Sentinel AI is a standalone web application that integrates with:
- **Supabase**: Authentication, database, edge functions, storage
- **AI Providers**: Google Gemini (primary), OpenRouter, Groq, Cohere (fallbacks)
- **Firecrawl**: Website scraping and analysis
- **Reddit API**: Community intelligence

### 2.2 Product Functions

```
┌────────────────────────────────────────────────────┐
│                  Sentinel AI                        │
│                                                      │
│  ┌──────────────┐  ┌────────────┐  ┌────────────┐  │
│  │ Authentication│  │ Onboarding │  │ Dashboard  │  │
│  └──────────────┘  └────────────┘  └────────────┘  │
│                                                      │
│  ┌──────────────┐  ┌────────────┐  ┌────────────┐  │
│  │   Prompts    │  │ Citations  │  │Competitors │  │
│  └──────────────┘  └────────────┘  └────────────┘  │
│                                                      │
│  ┌──────────────┐  ┌────────────┐  ┌────────────┐  │
│  │ Optimization │  │  Reports   │  │  Settings  │  │
│  └──────────────┘  └────────────┘  └────────────┘  │
└────────────────────────────────────────────────────┘
```

### 2.3 User Classes and Characteristics

| User Class | Description | Technical Proficiency |
|-----------|-------------|----------------------|
| Marketing Professional | Tracks brand AI visibility | Low–Medium |
| SEO Specialist | Optimizes for AI discoverability | Medium–High |
| Agency Manager | Monitors multiple client brands | Medium |
| Business Owner | Oversees brand reputation | Low |
| Developer | Integrates via API | High |

### 2.4 Operating Environment

- **Client**: Modern web browser (Chrome 90+, Firefox 90+, Safari 15+, Edge 90+)
- **Server**: Supabase Cloud (PostgreSQL 15, Deno runtime for edge functions)
- **CDN**: Vercel Edge Network
- **Connectivity**: Requires active internet connection

### 2.5 Design and Implementation Constraints

1. Frontend must be a React SPA (no server-side rendering)
2. Backend limited to Supabase edge functions (Deno runtime)
3. Database operations constrained by Supabase's 1000-row default query limit
4. AI provider API rate limits apply
5. Firecrawl scraping subject to target website robots.txt compliance

### 2.6 Assumptions and Dependencies

1. Users have a valid email address or Google account
2. AI provider APIs (Gemini, OpenRouter) maintain current pricing and availability
3. Supabase platform maintains 99.5% uptime SLA
4. Target websites allow scraping for analysis purposes

---

## 3. Specific Requirements

### 3.1 Authentication Module

#### 3.1.1 Email/Password Registration
- **Input**: Email address, password, optional full name
- **Password requirements**: Minimum 8 characters, uppercase, lowercase, digit, special character
- **Output**: User account created, verification email sent
- **Error handling**: Duplicate email, weak password, invalid email format

#### 3.1.2 Email/Password Login
- **Input**: Email, password
- **Output**: JWT session token, redirect to dashboard or onboarding
- **Error handling**: Invalid credentials, unverified email, account locked

#### 3.1.3 Google OAuth Login
- **Input**: Google account authorization
- **Output**: JWT session token, profile auto-populated from Google metadata
- **Error handling**: OAuth rejection, popup blocked, network failure

#### 3.1.4 Password Reset
- **Input**: Email address
- **Process**: Send reset link via email, redirect to `/login#type=recovery`
- **Output**: Password updated, user signed in
- **Error handling**: Email not found, expired token, weak new password

#### 3.1.5 Session Management
- Automatic session refresh via Supabase client
- `onAuthStateChange` listener for real-time auth state
- Secure token storage in memory (not localStorage)

### 3.2 Onboarding Module

#### 3.2.1 Step 1: Industry Selection
- **Input**: User selects from predefined industry list
- **Validation**: Exactly one industry must be selected
- **State**: Saved to profile on completion

#### 3.2.2 Step 2: Brand Information
- **Input**: Brand name (text), website URL (text)
- **Validation**: Name > 1 character, URL > 3 characters, auto-prefixed with `https://`
- **Action**: Triggers AI-powered website scraping and competitor suggestion

#### 3.2.3 Step 3: Competitor Selection
- **Input**: AI-suggested competitors (toggle), manual competitor domains (up to 5)
- **Validation**: Domain normalization, deduplication
- **Action**: Selected competitors stored in `competitors` table

#### 3.2.4 Step 4: LLM Platform Selection
- **Input**: Multi-select from ChatGPT, Claude, Gemini, Perplexity
- **Validation**: At least one platform selected
- **Default**: All four platforms pre-selected

#### 3.2.5 Step 5: Goal Selection
- **Input**: Multi-select from visibility, leads, revenue, actions
- **Validation**: At least one goal selected
- **Default**: "visibility" pre-selected

#### 3.2.6 Onboarding Completion
- **Action**: Edge function performs comprehensive AI analysis
- **Data generated**: Website analysis, prompt recommendations, citations, optimization tasks, alerts, sentiment baseline, competitor landscape
- **Profile update**: `onboarding_completed = true`
- **Redirect**: Navigate to `/dashboard`

### 3.3 Dashboard Module

#### 3.3.1 Metric Cards
- Tracked Prompts count
- Active Citations count
- AEO Fixes count (optimization tasks)
- Competitors count

#### 3.3.2 Visibility Score
- Composite score (0–100) with trend indicator
- Historical trend chart (line graph)

#### 3.3.3 Share of Voice
- Pie/donut chart showing brand vs. competitor mention percentages

#### 3.3.4 Sentiment Indicator
- Overall sentiment (positive/neutral/negative) with percentage breakdown
- Per-LLM sentiment comparison

#### 3.3.5 Prompt Coverage Chart
- Bar chart showing prompt coverage by LLM platform

#### 3.3.6 Citation Node Map
- Network visualization of citation sources and their relationships

#### 3.3.7 Competitive Landscape
- Grid of competitor cards with visibility scores and trends
- User's brand highlighted with "You" badge

#### 3.3.8 Predictive Score
- 7-day and 30-day visibility forecasts with confidence intervals

#### 3.3.9 Community Intelligence Panel
- Trending Reddit discussions related to user's keywords
- AI-summarized insights from community posts

#### 3.3.10 Website Insights
- Latest website analysis summary
- SEO signal checklist

### 3.4 Prompt Tracking Module

#### 3.4.1 Add Prompt
- **Input**: Natural language query (e.g., "Best project management tools")
- **Storage**: `tracked_prompts` table with category and active status
- **Trigger**: Automatic analysis across selected LLM platforms

#### 3.4.2 Prompt Analysis
- Per-prompt, per-LLM visibility status: mentioned / partial / not_mentioned
- Confidence score (0–100)
- Citations found count
- AI response text
- Stored in `prompt_rankings` table

#### 3.4.3 Prompt Search
- Search bar in top bar (⌘K keyboard shortcut)
- Redirects to Prompts page with query filter

### 3.5 Citation Module

#### 3.5.1 Citation Listing
- Source name, URL, domain
- Sentiment (positive/neutral/negative)
- Authority score (0–100)
- Ownership status (owned/external)
- Mention count and last detected timestamp

### 3.6 Optimization Module

#### 3.6.1 Task Categories
- schema, content_gap, technical, authority, general, engagement, citations, visibility, performance

#### 3.6.2 Task Priorities
- critical, high, medium, low

#### 3.6.3 Task Lifecycle
- Status: pending → in_progress → completed / dismissed
- Completion timestamp recorded

#### 3.6.4 AI One-Click Fix
- **Input**: Task title and description
- **Output**: AI-generated content/fix recommendation
- **Storage**: Updated `ai_suggestion` field on task

#### 3.6.5 Weekly Task Generation
- **Trigger**: User clicks "Generate Weekly Tasks"
- **Input**: User's website URL
- **Output**: 5 prioritized AEO optimization tasks
- **Validation**: Categories and priorities normalized to valid values

### 3.7 Competitor Module

#### 3.7.1 Competitor Management
- Add up to 8 competitor domains
- Remove competitors
- View competitor visibility scores and trends

### 3.8 Settings Module

#### 3.8.1 Profile Settings
- Display name, company name, website URL, industry
- Avatar upload

#### 3.8.2 Alert Preferences
- Toggle alerts: visibility drop, competitor gain, new citation, weekly summary

#### 3.8.3 Webhook Configuration
- Custom webhook URL for external alert delivery

### 3.9 Alert System

#### 3.9.1 Alert Types
- Visibility changes, competitor movements, new citations, system notifications

#### 3.9.2 Alert Delivery
- In-app notification bell with unread count
- Mark all as read functionality
- Optional webhook delivery

---

## 4. External Interface Requirements

### 4.1 User Interfaces

| Screen | Description | Responsive |
|--------|-------------|-----------|
| Login | Email/password + Google OAuth, forgot password | ✅ |
| Onboarding | 5-step wizard with progress bar | ✅ |
| Dashboard | Multi-widget analytics grid | ✅ |
| Prompts | Prompt list with analysis results | ✅ |
| Citations | Citation source table | ✅ |
| Optimization | Task list with filters | ✅ |
| Competitors | Competitor grid | ✅ |
| Settings | Form-based settings | ✅ |

### 4.2 Hardware Interfaces

None (web application).

### 4.3 Software Interfaces

| Interface | Protocol | Purpose |
|-----------|----------|---------|
| Supabase Auth | HTTPS/REST | User authentication |
| Supabase Database | HTTPS/REST (PostgREST) | Data persistence |
| Supabase Edge Functions | HTTPS | Server-side logic |
| Google Gemini API | HTTPS/REST | Primary AI provider |
| OpenRouter API | HTTPS/REST | Fallback AI provider |
| Firecrawl API | HTTPS/REST | Website scraping |
| Reddit Search API | HTTPS/REST | Community intelligence |

### 4.4 Communication Interfaces

- **HTTPS**: All client-server communication
- **WebSocket**: Supabase real-time subscriptions (future)
- **JWT**: Authentication token format

---

## 5. System Features

### 5.1 Feature Priority Matrix

| Feature | Business Priority | Technical Complexity | Risk |
|---------|------------------|---------------------|------|
| Authentication | Critical | Low | Low |
| Onboarding Analysis | Critical | High | Medium |
| Dashboard Metrics | Critical | Medium | Low |
| Prompt Tracking | Critical | High | Medium |
| Citation Auditing | High | Medium | Low |
| Optimization Tasks | High | Medium | Low |
| Competitor Benchmarking | High | Medium | Low |
| Community Intelligence | Medium | High | Medium |
| Predictive Analytics | Medium | High | High |
| Report Generation | Medium | Medium | Low |

---

## 6. Non-Functional Requirements

### 6.1 Performance

| Metric | Requirement |
|--------|-------------|
| Page load (LCP) | < 2.5 seconds |
| Time to Interactive (TTI) | < 3.5 seconds |
| API response time (p95) | < 500ms (excluding AI calls) |
| AI analysis response | < 60 seconds |
| Concurrent users | 100+ (Supabase free tier: 500 connections) |

### 6.2 Reliability

| Metric | Requirement |
|--------|-------------|
| Uptime | 99.5% (excluding Supabase maintenance) |
| Data durability | 99.99% (PostgreSQL with WAL) |
| AI provider fallback | 3+ providers for resilience |
| Error recovery | Graceful degradation with user-visible error messages |

### 6.3 Scalability

- Horizontal scaling via Supabase edge functions (auto-scaled)
- Database connection pooling (PgBouncer)
- CDN caching for static assets (Vercel)

### 6.4 Usability

- Onboarding completion rate target: > 80%
- Dashboard comprehension without training
- Mobile-friendly responsive design (360px–1920px)
- Keyboard shortcuts (⌘K for search)
- Loading states for all async operations

### 6.5 Maintainability

- TypeScript strict mode for type safety
- Component-based architecture (< 300 lines per component)
- Centralized design tokens (CSS custom properties)
- Consistent error handling patterns

---

## 7. Data Requirements

### 7.1 Data Retention

| Data Type | Retention Period |
|-----------|-----------------|
| User profiles | Account lifetime |
| Prompt rankings | 12 months rolling |
| Citations | Account lifetime |
| Optimization tasks | 6 months |
| Alerts | 3 months |
| Sentiment logs | 12 months |
| Website analyses | 6 months |

### 7.2 Data Backup

- PostgreSQL WAL (Write-Ahead Logging) for crash recovery
- Supabase managed daily backups (Pro plan)

### 7.3 Data Migration

- Database changes managed via SQL migrations
- Type definitions auto-generated from database schema

---

## 8. Security Requirements

### 8.1 Authentication Security

| Requirement | Implementation |
|-------------|---------------|
| Password hashing | bcrypt (Supabase Auth default) |
| Password requirements | 8+ chars, upper, lower, digit, special |
| Session management | JWT with refresh tokens |
| OAuth 2.0 | Google provider via Supabase Auth |
| Brute force protection | Supabase rate limiting |

### 8.2 Authorization Security

| Requirement | Implementation |
|-------------|---------------|
| Row-Level Security | RLS policies on all 11 tables |
| Data isolation | `auth.uid() = user_id` on all policies |
| Service role separation | Edge functions use service role; client uses anon key |
| API key management | Supabase Edge Function secrets |

### 8.3 Data Security

| Requirement | Implementation |
|-------------|---------------|
| Transport encryption | TLS 1.3 (HTTPS) |
| Data at rest | PostgreSQL encryption (Supabase managed) |
| Secret storage | Supabase Vault / Edge Function secrets |
| Input validation | Client-side + server-side validation |
| XSS prevention | React default escaping, no `dangerouslySetInnerHTML` |
| SQL injection | Parameterized queries via Supabase SDK |
| CORS | Configured on all edge functions |

### 8.4 Security Headers

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

---

## 9. Compliance Requirements

### 9.1 GDPR (EU — General Data Protection Regulation)

| Requirement | Implementation |
|-------------|---------------|
| Lawful basis | Consent (account creation) + Legitimate interest |
| Right to access | User can view all their data via dashboard |
| Right to erasure | Account deletion removes all associated data (CASCADE) |
| Data minimization | Only essential data collected |
| Data portability | Export functionality (reports) |
| Privacy by design | RLS, encryption, minimal data collection |

### 9.2 UK-GDPR (United Kingdom)

| Requirement | Implementation |
|-------------|---------------|
| ICO registration | Required for commercial deployment |
| International transfers | Supabase servers in compliant regions |
| Cookie consent | No tracking cookies used (SPA with JWT) |
| Privacy notice | Required in production deployment |

### 9.3 CCPA (California Consumer Privacy Act — US)

| Requirement | Implementation |
|-------------|---------------|
| Right to know | User data accessible via dashboard |
| Right to delete | Account deletion with CASCADE |
| Right to opt-out | No data selling; opt-out not applicable |
| Non-discrimination | Equal service regardless of privacy choices |

### 9.4 DPDPA 2023 (Digital Personal Data Protection Act — India)

| Requirement | Implementation |
|-------------|---------------|
| Consent | Explicit consent at registration |
| Purpose limitation | Data used only for stated purposes |
| Data localization | Configurable Supabase region |
| Grievance redressal | Support contact provided |
| Data breach notification | Supabase incident response + user notification |

### 9.5 IT Act 2000 & IT Rules 2011 (India)

| Requirement | Implementation |
|-------------|---------------|
| Reasonable security practices | ISO 27001 aligned (Supabase compliance) |
| Sensitive personal data | Encrypted storage, access controls |
| Privacy policy | Required for production deployment |

---

## 10. Appendices

### 10.1 Database Schema

See `README.md` Chapter 5, Section 5.2 for complete ERD and table descriptions.

### 10.2 API Endpoints

| Edge Function | Method | Description |
|---------------|--------|-------------|
| `onboarding-analysis` | POST | Website analysis + competitor suggestions |
| `ai-fallback` | POST | Multi-provider AI query routing |
| `analyze-visibility` | POST | Prompt visibility analysis |
| `weekly-tasks` | POST | Generate optimization tasks |
| `technical-audit` | POST | Website technical audit |
| `community-intel` | POST | Reddit community search |
| `predict-visibility` | POST | Predictive scoring |
| `generate-content` | POST | AI content generation |
| `crawl-website` | POST | Firecrawl website scraping |
| `competitor-benchmark` | POST | Competitor analysis |
| `check-visibility-alerts` | POST | Alert condition checking |
| `send-webhook-alert` | POST | External webhook delivery |
| `scheduled-analysis` | POST | Cron-triggered analysis |
| `knowledge-graph` | POST | Knowledge graph building |

### 10.3 Technology Stack Summary

| Component | Technology | Version |
|-----------|-----------|---------|
| UI Framework | React | 18.3 |
| Language | TypeScript | 5.x |
| Build Tool | Vite | 5.x |
| CSS Framework | Tailwind CSS | 3.4 |
| Component Library | shadcn/ui | Latest |
| Animation | Framer Motion | 12.x |
| Charts | Recharts | 2.15 |
| State Management | TanStack Query | 5.x |
| Routing | React Router | 6.x |
| Backend | Supabase | Latest |
| Database | PostgreSQL | 15 |
| Edge Runtime | Deno | Latest |
| Deployment | Vercel | Latest |

### 10.4 Glossary

| Term | Definition |
|------|-----------|
| Visibility Score | Composite metric (0–100) measuring brand presence in AI responses |
| Prompt Coverage | Percentage of tracked prompts where the brand is mentioned |
| Citation Strength | Weighted average of authority scores of sources citing the brand |
| Share of Voice | Brand's mention frequency relative to competitors in AI responses |
| AI Readiness | Score measuring how well a website is structured for AI consumption |

---

*Document prepared in accordance with IEEE 830-1998 standards for Software Requirements Specifications.*
