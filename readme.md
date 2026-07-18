# SentinelSwarm – Autonomous Competitive Intelligence Agent Swarm

**SentinelSwarm** is a production‑grade multi‑agent research system that autonomously gathers and cross‑checks SEC filings, news, sentiment, and web data for any public company, then produces a cited, analyst‑style report. A human‑in‑the‑loop approval step ensures every claim is grounded, and a live dashboard shows each agent’s reasoning trace in real time.

Built with **LangGraph.js**, **Node.js**, **BullMQ + Redis**, **Groq** (or any LLM), and a free‑tool‑only data layer.

---

## Problem We Solve

Equity analysts, VCs, product/strategy teams, and business consultants spend **hours** manually collecting and cross‑checking public filings, news articles, competitor product pages, and market sentiment.  
SentinelSwarm automates the entire first‑pass research pipeline, cutting a typical 3‑hour manual process down to **under 10 minutes** while keeping every claim traceable to its original source.

**Real‑world use case:**  
A competitive intelligence team wants a daily, cited report on a competitor’s latest financials, product launches, and market perception. They type a company name, approve the final draft, and receive an analyst‑grade report – without writing a single query.

---

## High‑Level Architecture

                     ┌────────────────┐
                     │  Supervisor    │  (routes tasks, tracks state, decides when done)
                     └───────┬────────┘
        ┌───────────┬────────┼────────┬────────────┐
        ▼           ▼        ▼        ▼             ▼

Filing Agent News Agent Sentiment Table Agent Web Scout
(10-K/10-Q (RSS/API Agent (financial (product pages,
RAG) ingest) (classify) tables) pricing pages)
└───────────┴────────┴────────┴─────────────┘
▼
Critic/Verifier Agent (checks claims against sources, flags contradictions)
▼
Report Writer Agent (drafts w/ citations)
▼
Human-in-the-loop approval node (LangGraph interrupt())

All agents run **sequentially** to respect free‑tier LLM rate limits. A **critic agent** fact‑checks the draft against the raw research data; if it’s not grounded, the writer revises – this loop is capped at 2 revisions to prevent infinite cycles. After critic approval, the graph pauses for a **human‑in‑the‑loop** decision (via LangGraph’s `interrupt()`), then produces the final report.

---

## How Agents Interact

- **Supervisor Node** – orchestrates the four research agents (filing, news, sentiment, web scout) one after the other, each writing its output into the shared state.
- **Filing Agent** – retrieves the two most recent 10‑K/10‑Q filings from the SEC EDGAR API (free, no key).
- **News Agent** – fetches up to 10 recent headlines from the **GDELT** free news API.
- **Sentiment Agent** – classifies the fetched news articles using the LLM itself (positive/negative/neutral).
- **Web Scout Agent** – scrapes a relevant product/pricing page (via Cheerio) and extracts key text.
- **Aggregator Node** – trims and merges all agent outputs into a single findings string.
- **Report Writer** – uses a reasoning LLM to write a structured markdown report (Executive Summary, Key Findings, Risks, Sentiment, Conclusion).
- **Critic Node** – fact‑checks the report against the original findings; if it hallucinates, the writer revisits.
- **Human Approval Node** – pauses the graph until a human clicks “Approve” or requests changes through the API.

All state flows through a shared **LangGraph Annotation** so every node sees the latest data.

---

## Tech Stack

| Layer         | Technology                                            |
| ------------- | ----------------------------------------------------- |
| Orchestration | LangGraph.js (supervisor + worker agents, interrupts) |
| LLM           | Groq (`llama-3.3-70b-versatile`) – free tier          |
| Job Queue     | BullMQ + Redis                                        |
| Backend       | Express.js (Node.js)                                  |
| Frontend      | Next.js (separate repo)                               |
| Checkpoints   | SQLite (or PostgreSQL / Memory)                       |
| Vector DB     | pgvector (optional, for RAG)                          |
| Data Sources  | SEC EDGAR, GDELT, Cheerio (all free)                  |

**Why Groq free tier?**  
We deliberately stay under the 12K tokens/minute and 100K tokens/day limits by using a cheap model for agents and a serialised request queue. All tools are free (SEC, GDELT, Cheerio) – no paid APIs required.

---

## How to Run Locally

### Prerequisites

- Node.js 18+
- Redis running locally (`brew services start redis` or use Docker)
- A Groq API key (free tier)

### 1. Clone & Install

```bash
git clone https://github.com/abhiraj7821/company_sentimetal.git
cd sentinelswarm-backend
npm install

```

### 2. Environment Variables

GROQ_API_KEY=sk-...
REDIS_URL=redis://localhost:6379
CHECKPOINTER=sqlite
CHECKPOINTER_PATH=./data/checkpoints.db

### 3. Start Redis

redis-server

### 4. Run the API Server + Worker

npm run worker # starts background job processor
npm start # starts Express API (port 3000)

### 5. Test the System

node tests/graph/buildGraph.test.js # end-to-end graph test
Or call the API:
curl -X POST http://localhost:3000/research \
 -H "Content-Type: application/json" \
 -d '{"researchTarget": "Apple Inc. (AAPL)"}'

## Then poll /research/:runId/status and approve at /research/:runId/approve.

How a Company Can Use This
Competitive Intelligence Team – Set a cron job to run daily research on 5 competitors. The reports are emailed to the strategy lead, who only needs to review and approve.

VC Due Diligence – Input a startup’s parent company and instantly get a report on financial health, recent news, and market sentiment before an investment committee meeting.

Product Management – Scrape competitor pricing pages and track their filings to anticipate product launches – the web scout agent does exactly that.

Financial Analysts – Replace manual EDGAR browsing; the filing agent pulls the latest 10‑K/10‑Q and the writer highlights key metrics.

Because every claim in the final report is traced back to a source (with citations), the output is auditable and can be directly inserted into internal memos.

Deployment to Production (Railway)
We recommend Railway for the backend because it supports long‑running processes and add‑on Redis.

Create two services in Railway from the same GitHub repo:

Server – npm start

Worker – npm run worker

Attach a Redis plugin – it auto‑sets REDIS_URL.

Add environment variables (see .env.example).

Set CHECKPOINTER=sqlite and mount a volume at ./data.

Frontend can be deployed to Vercel; point it to the Railway API URL.

Project Structure (Backend)
sentinelswarm-backend/
├── src/
│ ├── graph/ # LangGraph definition, state, router, checkpointer
│ ├── nodes/ # supervisor, aggregator, reportWriter, critic, humanApproval
│ ├── nodes/agents/ # filing, news, sentiment, webScout agents
│ ├── tools/ # free data tools (SEC, GDELT, Cheerio, etc.)
│ ├── rag/ # (optional) pgvector RAG ingestion & retrieval
│ ├── queue/ # BullMQ connection, research queue, worker
│ ├── routes/ # Express API routes
│ ├── lib/ # LLM client, logger, cost tracker
│ ├── config/ # environment config
│ └── index.js # server entry point
├── tests/ # unit and integration tests
├── data/ # SQLite checkpoints (persisted volume)
└── ...

### Evaluation Harness

We ship a custom groundedness scorer that checks every factual claim in the report against the raw research sources. Run it with:

node src/eval/runEval.js

It will run the full swarm for each company in src/eval/goldenDataset.json and output a CSV with groundedness scores. This forms a regression suite you can re‑run after any prompt or graph change.

License
MIT – feel free to use, modify, and deploy in your own organisation.

Built with ❤️ by me who believe AI should be transparent, auditable, and actually useful for real‑world research.

Abhishek Rajput. 🫶🏻
