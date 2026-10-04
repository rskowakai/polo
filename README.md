# Smart Grid Gems - Energy & IoT Management Dashboard

Modern, full-stack platform for smart grid monitoring, energy analytics, IoT sensor telemetry, and AI-assisted document analysis (RAG).

## Architecture

```
[Browser / React Client]
       │
       ▼ (HTTP / SSE / REST)
[Server-side Express Backend (port 3000)]
  ├── Guardrails: PII Scrubber (PESEL, Email, Phone redaction)
  ├── Server-Side Gemini API (@google/genai)
  └── Vite Middlewares (SPA Client Serving)
```

- **Frontend**: React 18, TypeScript, Tailwind CSS, shadcn/ui, Recharts, TanStack Query
- **Backend**: Express + `@google/genai` (SDK User-Agent: `aistudio-build`)
- **Security**: Server-side API key isolation (`GEMINI_API_KEY`), zero client-side secret exposure, automated PII scrubbing

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env

# 3. Start development server (Port 3000)
npm run dev

# 4. Production build
npm run build
npm start
```

## Environment Variables

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Google Gemini API key (server-side only) |
| `VITE_OPENWEATHER_API_KEY` | Optional: OpenWeatherMap API for live telemetry |
| `VITE_ELECTRICITY_MAPS_API_KEY` | Optional: Electricity Maps API for carbon intensity |

## Key Capabilities

- **Real-Time Energy Analytics**: Dynamic power load charts, company comparisons, peak detection.
- **IoT Sensor Monitoring**: Multi-city sensor telemetry, alert thresholds, performance diagnostics.
- **Secure RAG Assistant**: Document ingestion with chunking, PII sanitization, and server-side Gemini 3.8 Flash answers.
