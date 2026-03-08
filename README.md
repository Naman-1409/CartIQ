# 🛒 CartIQ — Agentic Quick Commerce Comparator

> Type your grocery list in plain English. Get the best prices across Zepto, Blinkit & Bigbasket in seconds.

## Architecture


```
apps/
  frontend/       → Next.js 14 (App Router, Tailwind CSS)
  api-gateway/    → Node.js + Express (orchestration, SSE, Redis)
  scraper/        → Python FastAPI (LLM parser, Playwright scrapers)
```

## Quick Start

### Prerequisites
- Node.js 18+, Python 3.11+, Docker Desktop

### 1. Clone & Configure
```bash
cp .env.example .env
# Fill in your GROQ_API_KEY (free at console.groq.com)
```

### 2. Start Redis
```bash
docker-compose up -d redis
```

### 3. Start the Scraper / Parser Service
```bash
cd apps/scraper
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

### 4. Start the API Gateway
```bash
cd apps/api-gateway
npm install
npm run dev
```

### 5. Start the Frontend
```bash
cd apps/frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and type your grocery query!

## Example Query
> "I need 2 kg onions, 1 Amul butter 500g, and 1 bread loaf. Deliver fast."

## Tech Stack
| Layer | Technology |
|---|---|
| Frontend | Next.js 14 + Tailwind CSS |
| API Gateway | Node.js / Express |
| AI Parser | Groq API (Llama-3-70B) |
| Scrapers | Python + Playwright |
| Cache | Redis |
| Realtime | Server-Sent Events (SSE) |
| Containers | Docker Compose |
